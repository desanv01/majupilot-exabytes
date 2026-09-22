import { z } from "zod";

import { documentScopeSchema, documentErrorResponse } from "@/infrastructure/documents/document-api";
import { EvidenceDocumentService } from "@/infrastructure/documents/document-service";
import { correlationId, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const id = z.uuid().parse((await params).id);
    const scope = documentScopeSchema.parse(await readJson(request, 4 * 1024));
    const owner = await resolveOwner(request, scope.organizationId);
    const data = await new EvidenceDocumentService().reprocess(owner, scope.assessmentSessionId, id);
    return response({ data }, 200, requestId);
  } catch (error) {
    return documentErrorResponse(error, requestId);
  }
}
