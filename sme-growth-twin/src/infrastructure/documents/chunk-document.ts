import { DOCUMENT_LIMITS } from "@/domain/documents";

import type { ExtractedDocument } from "./extract-document";
import { DocumentError } from "./document-errors";

export type DocumentChunk = { chunkIndex: number; pageNumber: number | null; sectionRef: string; content: string };

export function chunkDocument(document: ExtractedDocument): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const section of document.sections) {
    let cursor = 0;
    while (cursor < section.text.length) {
      let end = Math.min(section.text.length, cursor + DOCUMENT_LIMITS.maxChunkChars);
      if (end < section.text.length) {
        const boundary = Math.max(section.text.lastIndexOf(". ", end), section.text.lastIndexOf("\n", end), section.text.lastIndexOf(" ", end));
        if (boundary > cursor + 600) end = boundary + 1;
      }
      const content = section.text.slice(cursor, end).trim();
      if (content) chunks.push({ chunkIndex: chunks.length, pageNumber: section.pageNumber, sectionRef: section.sectionRef, content });
      if (chunks.length > DOCUMENT_LIMITS.maxChunks) throw new DocumentError("DOCUMENT_CHUNK_LIMIT", 422);
      if (end >= section.text.length) break;
      cursor = Math.max(cursor + 1, end - DOCUMENT_LIMITS.chunkOverlapChars);
    }
  }
  if (!chunks.length) throw new DocumentError("DOCUMENT_CORRUPT", 422);
  return chunks;
}
