import { z } from "zod";

import { DOCUMENT_LIMITS } from "@/domain/documents";
import { PersistenceError, persistenceUuidSchema } from "@/domain/persistence";
import { errorResponse, response } from "@/infrastructure/persistence/api";

import { DocumentError } from "./document-errors";

export const documentScopeSchema = z.object({
  assessmentSessionId: persistenceUuidSchema,
  organizationId: persistenceUuidSchema.optional(),
}).strict();

export function documentErrorResponse(error: unknown, requestId: string) {
  if (error instanceof DocumentError) return response({ error: { code: error.code, requestId } }, error.httpStatus, requestId);
  return errorResponse(error, requestId);
}

export async function readDocumentForm(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > DOCUMENT_LIMITS.maxMultipartBytes) throw new DocumentError("DOCUMENT_TOO_LARGE", 413);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) throw new PersistenceError("VALIDATION_FAILED", 422);
  // Content-Length may be missing or forged. Bound actual bytes before parsing.
  if (!request.body) throw new PersistenceError("VALIDATION_FAILED", 422);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > DOCUMENT_LIMITS.maxMultipartBytes) {
        await reader.cancel();
        throw new DocumentError("DOCUMENT_TOO_LARGE", 413);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type")! }, body: bytes }).formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new PersistenceError("VALIDATION_FAILED", 422);
  const scope = documentScopeSchema.parse({
    assessmentSessionId: form.get("assessmentSessionId"),
    organizationId: form.get("organizationId") || undefined,
  });
  return { file, scope };
}
