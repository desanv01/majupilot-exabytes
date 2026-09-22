export type DocumentErrorCode =
  | "DOCUMENT_TOO_LARGE"
  | "DOCUMENT_UNSUPPORTED"
  | "DOCUMENT_MIME_MISMATCH"
  | "DOCUMENT_CORRUPT"
  | "DOCUMENT_SUSPICIOUS"
  | "DOCUMENT_PAGE_LIMIT"
  | "DOCUMENT_TEXT_LIMIT"
  | "DOCUMENT_CHUNK_LIMIT"
  | "DOCUMENT_DUPLICATE"
  | "DOCUMENT_PROCESSING_FAILED";

export class DocumentError extends Error {
  constructor(readonly code: DocumentErrorCode, readonly httpStatus: number, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "DocumentError";
  }
}
