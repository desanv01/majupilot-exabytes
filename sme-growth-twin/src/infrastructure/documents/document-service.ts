import "server-only";

import { createHash } from "node:crypto";

import { embed, embedMany, gateway } from "ai";

import {
  DOCUMENT_EMBEDDING_MODEL,
  DOCUMENT_EMBEDDING_VERSION,
  DOCUMENT_LIMITS,
  DOCUMENT_SCHEMA_VERSION,
  documentCitationSchema,
  documentExcerptInputSchema,
  documentSearchInputSchema,
  evidenceDocumentSchema,
  type DocumentCitation,
  type EvidenceDocument,
  type SupportedDocumentMime,
} from "@/domain/documents";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { hasGatewayCredential } from "@/infrastructure/model-provider/ai-execution-policy";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";

import { chunkDocument, type DocumentChunk } from "./chunk-document";
import { DocumentError } from "./document-errors";
import { extractDocument, validateDocumentEnvelope } from "./extract-document";

const BUCKET = "majupilot-evidence";
const EMBEDDING_DIMENSIONS = 1536;
type Db = ReturnType<typeof createAdminSupabaseClient>;
type Row = Record<string, unknown>;

export type EmbeddingProvider = {
  embedMany(values: string[]): Promise<number[][]>;
  embedOne(value: string): Promise<number[]>;
};

const liveEmbeddingProvider: EmbeddingProvider = {
  async embedMany(values) {
    if (!hasGatewayCredential()) throw new DocumentError("DOCUMENT_PROCESSING_FAILED", 503);
    const result = await embedMany({
      model: gateway.embeddingModel(DOCUMENT_EMBEDDING_MODEL),
      values,
      maxRetries: 1,
      maxParallelCalls: 2,
      abortSignal: AbortSignal.timeout(30_000),
      providerOptions: { gateway: { tags: ["feature:document-rag", `embedding:${DOCUMENT_EMBEDDING_VERSION}`] } },
    });
    return result.embeddings;
  },
  async embedOne(value) {
    if (!hasGatewayCredential()) throw new DocumentError("DOCUMENT_PROCESSING_FAILED", 503);
    const result = await embed({
      model: gateway.embeddingModel(DOCUMENT_EMBEDDING_MODEL),
      value,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(15_000),
      providerOptions: { gateway: { tags: ["feature:document-rag-search", `embedding:${DOCUMENT_EMBEDDING_VERSION}`] } },
    });
    return result.embedding;
  },
};

const fail = (error: { message?: string } | null) => {
  if (error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: error });
};

function view(row: Row): EvidenceDocument {
  return evidenceDocumentSchema.parse({
    id: row.id,
    assessmentSessionId: row.assessment_session_id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteLength: Number(row.byte_length),
    checksumSha256: row.checksum_sha256,
    status: row.status,
    failureCode: row.failure_code ?? null,
    duplicateOfDocumentId: row.duplicate_of_document_id ?? null,
    pageCount: row.page_count === null || row.page_count === undefined ? null : Number(row.page_count),
    extractedCharCount: row.extracted_char_count === null || row.extracted_char_count === undefined ? null : Number(row.extracted_char_count),
    chunkCount: Number(row.chunk_count),
    schemaVersion: row.schema_version,
    embeddingVersion: row.embedding_version,
    createdAt: row.created_at,
    processedAt: row.processed_at ?? null,
    failedAt: row.failed_at ?? null,
    deletedAt: row.deleted_at ?? null,
    updatedAt: row.updated_at,
  });
}

function assertEmbedding(value: number[]) {
  if (value.length !== EMBEDDING_DIMENSIONS || value.some((item) => !Number.isFinite(item))) throw new DocumentError("DOCUMENT_PROCESSING_FAILED", 503);
  return `[${value.join(",")}]`;
}

function safeExcerpt(value: string) {
  return value.length <= DOCUMENT_LIMITS.maxExcerptChars ? value : `${value.slice(0, DOCUMENT_LIMITS.maxExcerptChars - 1).trimEnd()}…`;
}

function safeFilename(value: string) {
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 240);
  return normalized || "document";
}

export class EvidenceDocumentService {
  constructor(private readonly db: Db = createAdminSupabaseClient(), private readonly embeddings: EmbeddingProvider = liveEmbeddingProvider) {}

  private async assessment(owner: OwnershipContext, assessmentSessionId: string) {
    const result = await this.db.from("assessment_sessions").select("id,organization_id,guest_session_id").eq("id", assessmentSessionId).maybeSingle();
    fail(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    const row = result.data as Row;
    const authorized = owner.kind === "guest"
      ? row.guest_session_id === owner.guestSessionId
      : row.organization_id === owner.organizationId;
    if (!authorized) throw new PersistenceError("NOT_FOUND", 404);
    return row;
  }

  private async exactDocument(owner: OwnershipContext, assessmentSessionId: string, documentId: string, includeDeleted = false) {
    await this.assessment(owner, assessmentSessionId);
    let query = this.db.from("evidence_documents").select("*").eq("id", documentId).eq("assessment_session_id", assessmentSessionId);
    if (!includeDeleted) query = query.neq("status", "deleted");
    const result = await query.maybeSingle();
    fail(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    return result.data as Row;
  }

  async list(owner: OwnershipContext, assessmentSessionId: string) {
    await this.assessment(owner, assessmentSessionId);
    const result = await this.db.from("evidence_documents").select("*").eq("assessment_session_id", assessmentSessionId).order("created_at", { ascending: false }).limit(100);
    fail(result.error);
    return (result.data ?? []).map((row) => view(row as Row));
  }

  private ownerColumns(owner: OwnershipContext) {
    return owner.kind === "guest"
      ? { organization_id: null, guest_session_id: owner.guestSessionId }
      : { organization_id: owner.organizationId, guest_session_id: null };
  }

  private storagePath(owner: OwnershipContext, assessmentSessionId: string, documentId: string, mime: SupportedDocumentMime) {
    const extension = mime === "application/pdf" ? "pdf" : mime === "text/plain" ? "txt" : "docx";
    return owner.kind === "guest"
      ? `guest/${owner.guestSessionId}/${assessmentSessionId}/${documentId}.${extension}`
      : `org/${owner.organizationId}/${assessmentSessionId}/${documentId}.${extension}`;
  }

  private async insertDocument(input: {
    id: string; owner: OwnershipContext; assessmentSessionId: string; filename: string; mime: SupportedDocumentMime;
    bytes: number; checksum: string; status: "processing" | "duplicate"; storagePath: string | null; duplicateOf?: string;
  }) {
    const timestamp = new Date().toISOString();
    const result = await this.db.from("evidence_documents").insert({
      id: input.id,
      assessment_session_id: input.assessmentSessionId,
      ...this.ownerColumns(input.owner),
      original_filename: input.filename,
      storage_path: input.storagePath,
      mime_type: input.mime,
      byte_length: input.bytes,
      checksum_sha256: input.checksum,
      status: input.status,
      duplicate_of_document_id: input.duplicateOf ?? null,
      schema_version: DOCUMENT_SCHEMA_VERSION,
      embedding_version: DOCUMENT_EMBEDDING_VERSION,
      processing_started_at: input.status === "processing" ? timestamp : null,
      processed_at: input.status === "duplicate" ? timestamp : null,
      updated_at: timestamp,
    }).select("*").single();
    fail(result.error);
    return result.data as Row;
  }

  private async insertUnsupported(owner: OwnershipContext, assessmentSessionId: string, file: File, bytes: Uint8Array, checksum: string, code: string) {
    const timestamp = new Date().toISOString();
    const result = await this.db.from("evidence_documents").insert({
      id: crypto.randomUUID(), assessment_session_id: assessmentSessionId, ...this.ownerColumns(owner),
      original_filename: safeFilename(file.name), storage_path: null,
      mime_type: (file.type || "application/octet-stream").slice(0, 160), byte_length: bytes.byteLength,
      checksum_sha256: checksum, status: "unsupported", failure_code: code,
      schema_version: DOCUMENT_SCHEMA_VERSION, embedding_version: DOCUMENT_EMBEDDING_VERSION,
      failed_at: timestamp, updated_at: timestamp,
    }).select("*").single();
    fail(result.error);
    return view(result.data as Row);
  }

  private async markFailed(documentId: string, code: string) {
    const timestamp = new Date().toISOString();
    const removed = await this.db.from("evidence_document_chunks").delete().eq("document_id", documentId);
    fail(removed.error);
    const result = await this.db.from("evidence_documents").update({ status: "failed", failure_code: code.slice(0, 80), chunk_count: 0, failed_at: timestamp, processed_at: null, updated_at: timestamp }).eq("id", documentId).eq("status", "processing").select("*").single();
    fail(result.error);
    return view(result.data as Row);
  }

  private async finish(document: Row, bytes: Uint8Array, mime: SupportedDocumentMime, chunks: DocumentChunk[], extractedCharCount: number, pageCount: number | null, upload = true) {
    const documentId = String(document.id);
    const path = String(document.storage_path);
    if (upload) {
      const stored = await this.db.storage.from(BUCKET).upload(path, bytes, { contentType: mime, upsert: false, cacheControl: "0" });
      if (stored.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: stored.error });
    }
    let vectors: number[][];
    try { vectors = await this.embeddings.embedMany(chunks.map((chunk) => chunk.content)); }
    catch (error) { throw error instanceof DocumentError ? error : new DocumentError("DOCUMENT_PROCESSING_FAILED", 503, { cause: error }); }
    if (vectors.length !== chunks.length) throw new DocumentError("DOCUMENT_PROCESSING_FAILED", 503);
    const rows = chunks.map((chunk, index) => ({
      id: crypto.randomUUID(),
      document_id: documentId,
      assessment_session_id: document.assessment_session_id,
      chunk_index: chunk.chunkIndex,
      page_number: chunk.pageNumber,
      section_ref: chunk.sectionRef,
      content: chunk.content,
      char_count: chunk.content.length,
      embedding: assertEmbedding(vectors[index]),
      schema_version: DOCUMENT_SCHEMA_VERSION,
      embedding_version: DOCUMENT_EMBEDDING_VERSION,
    }));
    const inserted = await this.db.from("evidence_document_chunks").insert(rows);
    fail(inserted.error);
    const timestamp = new Date().toISOString();
    const updated = await this.db.from("evidence_documents").update({
      status: "ready", failure_code: null, failed_at: null, page_count: pageCount,
      extracted_char_count: extractedCharCount, chunk_count: chunks.length, processed_at: timestamp, updated_at: timestamp,
    }).eq("id", documentId).eq("status", "processing").select("*").single();
    fail(updated.error);
    return view(updated.data as Row);
  }

  async upload(owner: OwnershipContext, assessmentSessionId: string, file: File) {
    await this.assessment(owner, assessmentSessionId);
    if (file.size > DOCUMENT_LIMITS.maxFileBytes) throw new DocumentError("DOCUMENT_TOO_LARGE", 413);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const filename = safeFilename(file.name);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    let mime: SupportedDocumentMime;
    try { mime = validateDocumentEnvelope(file.name, file.type, bytes); }
    catch (error) {
      if (error instanceof DocumentError && ["DOCUMENT_UNSUPPORTED", "DOCUMENT_MIME_MISMATCH"].includes(error.code)) return this.insertUnsupported(owner, assessmentSessionId, file, bytes, checksum, error.code);
      throw error;
    }
    const existing = await this.db.from("evidence_documents").select("id").eq("assessment_session_id", assessmentSessionId).eq("checksum_sha256", checksum).in("status", ["processing", "ready"]).limit(1).maybeSingle();
    fail(existing.error);
    const id = crypto.randomUUID();
    if (existing.data) {
      return view(await this.insertDocument({ id, owner, assessmentSessionId, filename, mime, bytes: bytes.byteLength, checksum, status: "duplicate", storagePath: null, duplicateOf: String(existing.data.id) }));
    }
    const storagePath = this.storagePath(owner, assessmentSessionId, id, mime);
    const document = await this.insertDocument({ id, owner, assessmentSessionId, filename, mime, bytes: bytes.byteLength, checksum, status: "processing", storagePath });
    try {
      const extracted = await extractDocument(bytes, mime);
      const chunks = chunkDocument(extracted);
      return await this.finish(document, bytes, mime, chunks, extracted.extractedCharCount, extracted.pageCount);
    } catch (error) {
      const code = error instanceof DocumentError ? error.code : "DOCUMENT_PROCESSING_FAILED";
      return this.markFailed(id, code);
    }
  }

  async reprocess(owner: OwnershipContext, assessmentSessionId: string, documentId: string) {
    const document = await this.exactDocument(owner, assessmentSessionId, documentId);
    if (!["ready", "failed"].includes(String(document.status)) || !document.storage_path) throw new PersistenceError("VALIDATION_FAILED", 422);
    const downloaded = await this.db.storage.from(BUCKET).download(String(document.storage_path));
    if (downloaded.error || !downloaded.data) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: downloaded.error });
    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    const mime = validateDocumentEnvelope(String(document.original_filename), String(document.mime_type), bytes);
    const started = new Date().toISOString();
    const reset = await this.db.from("evidence_documents").update({ status: "processing", failure_code: null, failed_at: null, processed_at: null, chunk_count: 0, processing_started_at: started, updated_at: started }).eq("id", documentId).eq("status", document.status).eq("updated_at", document.updated_at).select("id").single();
    fail(reset.error);
    const removed = await this.db.from("evidence_document_chunks").delete().eq("document_id", documentId);
    fail(removed.error);
    try {
      const extracted = await extractDocument(bytes, mime);
      return await this.finish({ ...document, status: "processing" }, bytes, mime, chunkDocument(extracted), extracted.extractedCharCount, extracted.pageCount, false);
    } catch (error) {
      return this.markFailed(documentId, error instanceof DocumentError ? error.code : "DOCUMENT_PROCESSING_FAILED");
    }
  }

  async remove(owner: OwnershipContext, assessmentSessionId: string, documentId: string) {
    const document = await this.exactDocument(owner, assessmentSessionId, documentId, true);
    if (document.status === "processing") throw new PersistenceError("VALIDATION_FAILED", 422);
    const timestamp = new Date().toISOString();
    // Tombstone first; failed object cleanup can safely be retried. Compare-and-
    // swap prevents a concurrent reprocess from reviving this document.
    const updated = await this.db.from("evidence_documents").update({ status: "deleted", deleted_at: timestamp, duplicate_of_document_id: null, chunk_count: 0, updated_at: timestamp }).eq("id", documentId).eq("status", document.status).eq("updated_at", document.updated_at).select("*").single();
    fail(updated.error);
    if (document.storage_path) {
      const removed = await this.db.storage.from(BUCKET).remove([String(document.storage_path)]);
      if (removed.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: removed.error });
    }
    const chunks = await this.db.from("evidence_document_chunks").delete().eq("document_id", documentId);
    fail(chunks.error);
    return view(updated.data as Row);
  }

  async signedDownload(owner: OwnershipContext, assessmentSessionId: string, documentId: string) {
    const document = await this.exactDocument(owner, assessmentSessionId, documentId);
    if (document.status !== "ready" || !document.storage_path) throw new PersistenceError("NOT_FOUND", 404);
    const signed = await this.db.storage.from(BUCKET).createSignedUrl(String(document.storage_path), 60, { download: String(document.original_filename) });
    if (signed.error || !signed.data) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: signed.error });
    return { url: signed.data.signedUrl, expiresInSeconds: 60 };
  }

  async search(owner: OwnershipContext, assessmentSessionId: string, rawInput: unknown) {
    const input = documentSearchInputSchema.parse(rawInput);
    await this.assessment(owner, assessmentSessionId);
    const available = await this.db.from("evidence_documents").select("id", { count: "exact", head: true }).eq("assessment_session_id", assessmentSessionId).eq("status", "ready").is("deleted_at", null);
    fail(available.error);
    if (!available.count) return { answerable: false, reason: "NO_UPLOADED_EVIDENCE", citations: [] as DocumentCitation[] };
    let queryEmbedding: number[];
    try { queryEmbedding = await this.embeddings.embedOne(input.query); }
    catch (error) { throw error instanceof DocumentError ? error : new DocumentError("DOCUMENT_PROCESSING_FAILED", 503, { cause: error }); }
    const result = await this.db.rpc("search_evidence_document_chunks", {
      p_assessment_session_id: assessmentSessionId,
      p_query_embedding: assertEmbedding(queryEmbedding),
      p_match_threshold: input.relevanceThreshold,
      p_match_count: input.maxResults,
    });
    fail(result.error);
    const citations = (result.data ?? []).map((row: Row) => documentCitationSchema.parse({
      documentId: row.document_id,
      chunkId: row.chunk_id,
      documentName: row.document_name,
      pageNumber: row.page_number === null ? null : Number(row.page_number),
      sectionRef: row.section_ref,
      excerpt: safeExcerpt(String(row.content)),
      similarity: Number(row.similarity),
      reference: `doc:${row.document_id}#chunk:${row.chunk_id}`,
      provenance: "uploaded_document",
    }));
    return { answerable: citations.length > 0, reason: citations.length ? null : "NO_RELEVANT_EVIDENCE", citations };
  }

  async excerpt(owner: OwnershipContext, assessmentSessionId: string, rawInput: unknown) {
    const input = documentExcerptInputSchema.parse(rawInput);
    await this.exactDocument(owner, assessmentSessionId, input.documentId);
    const result = await this.db.from("evidence_document_chunks").select("id,document_id,page_number,section_ref,content,evidence_documents!inner(original_filename,status,deleted_at,assessment_session_id)").eq("id", input.chunkId).eq("document_id", input.documentId).eq("assessment_session_id", assessmentSessionId).eq("evidence_documents.status", "ready").is("evidence_documents.deleted_at", null).maybeSingle();
    fail(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    const row = result.data as Row;
    const joined = row.evidence_documents as Row;
    return documentCitationSchema.parse({
      documentId: row.document_id, chunkId: row.id, documentName: joined.original_filename,
      pageNumber: row.page_number === null ? null : Number(row.page_number), sectionRef: row.section_ref,
      excerpt: safeExcerpt(String(row.content)), similarity: null,
      reference: `doc:${row.document_id}#chunk:${row.id}`, provenance: "uploaded_document",
    });
  }
}
