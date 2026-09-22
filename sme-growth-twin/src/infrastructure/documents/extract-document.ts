import "server-only";

import { DOCUMENT_LIMITS, type SupportedDocumentMime } from "@/domain/documents";

import { DocumentError } from "./document-errors";

export type ExtractedSection = { pageNumber: number | null; sectionRef: string; text: string };
export type ExtractedDocument = { sections: ExtractedSection[]; pageCount: number | null; extractedCharCount: number };

const MIME_BY_EXTENSION: Record<string, SupportedDocumentMime> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export function expectedMimeForFilename(filename: string) {
  const extension = filename.toLowerCase().split(".").pop() ?? "";
  return MIME_BY_EXTENSION[extension] ?? null;
}

export function validateDocumentEnvelope(filename: string, declaredMime: string, bytes: Uint8Array): SupportedDocumentMime {
  if (bytes.byteLength > DOCUMENT_LIMITS.maxFileBytes) throw new DocumentError("DOCUMENT_TOO_LARGE", 413);
  const expected = expectedMimeForFilename(filename);
  if (!expected) throw new DocumentError("DOCUMENT_UNSUPPORTED", 415);
  if (declaredMime !== expected) throw new DocumentError("DOCUMENT_MIME_MISMATCH", 415);
  if (expected === "application/pdf" && new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") throw new DocumentError("DOCUMENT_MIME_MISMATCH", 415);
  if (expected === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && !(bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04)) throw new DocumentError("DOCUMENT_MIME_MISMATCH", 415);
  return expected;
}

export function normalizeExtractedText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function inspectDocxArchive(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let entries = 0;
  let totalUncompressed = 0;
  let hasContentTypes = false;
  let hasDocument = false;
  for (let offset = 0; offset + 46 <= bytes.byteLength; offset += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) continue;
    entries += 1;
    if (entries > DOCUMENT_LIMITS.maxArchiveEntries) throw new DocumentError("DOCUMENT_SUSPICIOUS", 422);
    const flags = view.getUint16(offset + 8, true);
    const compressed = view.getUint32(offset + 20, true);
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if (flags & 0x1) throw new DocumentError("DOCUMENT_SUSPICIOUS", 422);
    const nameEnd = offset + 46 + nameLength;
    if (nameEnd > bytes.byteLength) throw new DocumentError("DOCUMENT_CORRUPT", 422);
    let name: string;
    try { name = decoder.decode(bytes.subarray(offset + 46, nameEnd)); }
    catch { throw new DocumentError("DOCUMENT_CORRUPT", 422); }
    if (name.includes("..") || name.startsWith("/") || name.includes("\\") || /vbaProject\.bin$/i.test(name)) throw new DocumentError("DOCUMENT_SUSPICIOUS", 422);
    totalUncompressed += uncompressed;
    if (totalUncompressed > DOCUMENT_LIMITS.maxArchiveUncompressedBytes || (compressed > 0 && uncompressed / compressed > 100)) throw new DocumentError("DOCUMENT_SUSPICIOUS", 422);
    hasContentTypes ||= name === "[Content_Types].xml";
    hasDocument ||= name === "word/document.xml";
    offset = nameEnd + extraLength + commentLength - 1;
  }
  if (!entries || !hasContentTypes || !hasDocument) throw new DocumentError("DOCUMENT_CORRUPT", 422);
}

async function extractPdf(bytes: Uint8Array): Promise<ExtractedDocument> {
  let loadingTask: { destroy(): Promise<void> } | undefined;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({ data: bytes.slice(), disableFontFace: true, useWorkerFetch: false });
    loadingTask = task;
    const pdf = await task.promise;
    if (pdf.numPages > DOCUMENT_LIMITS.maxPdfPages) throw new DocumentError("DOCUMENT_PAGE_LIMIT", 422);
    const sections: ExtractedSection[] = [];
    let total = 0;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = normalizeExtractedText(content.items.map((item) => "str" in item ? item.str : "").join(" "));
      total += text.length;
      if (total > DOCUMENT_LIMITS.maxExtractedChars) throw new DocumentError("DOCUMENT_TEXT_LIMIT", 422);
      if (text) sections.push({ pageNumber, sectionRef: `Page ${pageNumber}`, text });
      page.cleanup();
    }
    if (!sections.length) throw new DocumentError("DOCUMENT_CORRUPT", 422);
    return { sections, pageCount: pdf.numPages, extractedCharCount: total };
  } catch (error) {
    if (error instanceof DocumentError) throw error;
    throw new DocumentError("DOCUMENT_CORRUPT", 422, { cause: error });
  } finally { await loadingTask?.destroy(); }
}

async function extractDocx(bytes: Uint8Array): Promise<ExtractedDocument> {
  inspectDocxArchive(bytes);
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const blocks = result.value.split(/\n{2,}/).map(normalizeExtractedText).filter(Boolean);
    const sections = blocks.map((text, index) => ({ pageNumber: null, sectionRef: `Section ${index + 1}`, text }));
    const extractedCharCount = sections.reduce((sum, section) => sum + section.text.length, 0);
    if (!sections.length) throw new DocumentError("DOCUMENT_CORRUPT", 422);
    if (extractedCharCount > DOCUMENT_LIMITS.maxExtractedChars) throw new DocumentError("DOCUMENT_TEXT_LIMIT", 422);
    return { sections, pageCount: null, extractedCharCount };
  } catch (error) {
    if (error instanceof DocumentError) throw error;
    throw new DocumentError("DOCUMENT_CORRUPT", 422, { cause: error });
  }
}

function extractTxt(bytes: Uint8Array): ExtractedDocument {
  let decoded: string;
  try { decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch (error) { throw new DocumentError("DOCUMENT_CORRUPT", 422, { cause: error }); }
  if (decoded.includes("\u0000")) throw new DocumentError("DOCUMENT_SUSPICIOUS", 422);
  const text = normalizeExtractedText(decoded);
  if (!text) throw new DocumentError("DOCUMENT_CORRUPT", 422);
  if (text.length > DOCUMENT_LIMITS.maxExtractedChars) throw new DocumentError("DOCUMENT_TEXT_LIMIT", 422);
  return { sections: [{ pageNumber: null, sectionRef: "Text document", text }], pageCount: null, extractedCharCount: text.length };
}

export async function extractDocument(bytes: Uint8Array, mime: SupportedDocumentMime) {
  if (mime === "application/pdf") return extractPdf(bytes);
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return extractDocx(bytes);
  return extractTxt(bytes);
}
