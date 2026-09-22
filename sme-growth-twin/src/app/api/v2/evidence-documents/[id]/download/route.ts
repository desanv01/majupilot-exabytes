import { z } from "zod";

import { documentScopeSchema, documentErrorResponse } from "@/infrastructure/documents/document-api";
import { EvidenceDocumentService } from "@/infrastructure/documents/document-service";
import { correlationId, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const id = z.uuid().parse((await params).id);
    const url = new URL(request.url);
    const scope = documentScopeSchema.parse({ assessmentSessionId: url.searchParams.get("assessmentSessionId"), organizationId: url.searchParams.get("organizationId") || undefined });
    const owner = await resolveOwner(request, scope.organizationId);
    const data = await new EvidenceDocumentService().signedDownload(owner, scope.assessmentSessionId, id);
    return response({ data }, 200, requestId);
  } catch (error) {
    return documentErrorResponse(error, requestId);
  }
}
