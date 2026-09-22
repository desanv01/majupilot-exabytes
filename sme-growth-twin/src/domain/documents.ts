import { z } from "zod";

import { persistenceUuidSchema } from "./persistence";

export const DOCUMENT_SCHEMA_VERSION = "phase3-document-rag-1.0.0" as const;
export const DOCUMENT_EMBEDDING_VERSION = "openai-text-embedding-3-small-1536-v1" as const;
export const DOCUMENT_EMBEDDING_MODEL = "openai/text-embedding-3-small" as const;

export const DOCUMENT_LIMITS = {
  maxFileBytes: 4 * 1024 * 1024,
  maxMultipartBytes: 4.25 * 1024 * 1024,
  maxPdfPages: 40,
  maxExtractedChars: 120_000,
  maxChunks: 80,
  maxChunkChars: 1_200,
  chunkOverlapChars: 120,
  maxArchiveEntries: 2_000,
  maxArchiveUncompressedBytes: 20 * 1024 * 1024,
  maxExcerptChars: 900,
  maxSearchResults: 8,
} as const;

export const supportedDocumentMimeSchema = z.enum([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
export type SupportedDocumentMime = z.infer<typeof supportedDocumentMimeSchema>;

export const evidenceDocumentStatusSchema = z.enum([
  "processing",
  "ready",
  "failed",
  "unsupported",
  "duplicate",
  "deleted",
]);

export const evidenceDocumentSchema = z.object({
  id: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  originalFilename: z.string().min(1).max(240),
  mimeType: z.string().min(1).max(160),
  byteLength: z.number().int().min(0).max(DOCUMENT_LIMITS.maxFileBytes),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/),
  status: evidenceDocumentStatusSchema,
  canReprocess: z.boolean(),
  failureCode: z.string().max(80).nullable(),
  duplicateOfDocumentId: persistenceUuidSchema.nullable(),
  pageCount: z.number().int().min(0).max(DOCUMENT_LIMITS.maxPdfPages).nullable(),
  extractedCharCount: z.number().int().min(0).max(DOCUMENT_LIMITS.maxExtractedChars).nullable(),
  chunkCount: z.number().int().min(0).max(DOCUMENT_LIMITS.maxChunks),
  schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
  embeddingVersion: z.literal(DOCUMENT_EMBEDDING_VERSION),
  createdAt: z.iso.datetime({ offset: true }),
  processedAt: z.iso.datetime({ offset: true }).nullable(),
  failedAt: z.iso.datetime({ offset: true }).nullable(),
  deletedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
}).strict();
export type EvidenceDocument = z.infer<typeof evidenceDocumentSchema>;

export const documentSearchInputSchema = z.object({
  query: z.string().trim().min(2).max(500),
  maxResults: z.number().int().min(1).max(DOCUMENT_LIMITS.maxSearchResults).default(5),
  relevanceThreshold: z.number().min(0.4).max(0.95).default(0.62),
}).strict();

export const documentExcerptInputSchema = z.object({
  documentId: persistenceUuidSchema,
  chunkId: persistenceUuidSchema,
}).strict();

export const documentCitationSchema = z.object({
  documentId: persistenceUuidSchema,
  chunkId: persistenceUuidSchema,
  documentName: z.string().min(1).max(240),
  pageNumber: z.number().int().positive().nullable(),
  sectionRef: z.string().min(1).max(120),
  excerpt: z.string().min(1).max(DOCUMENT_LIMITS.maxExcerptChars),
  similarity: z.number().min(-1).max(1).nullable(),
  reference: z.string().min(1).max(100),
  provenance: z.literal("uploaded_document"),
}).strict();
export type DocumentCitation = z.infer<typeof documentCitationSchema>;
