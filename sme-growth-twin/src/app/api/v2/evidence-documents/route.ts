import { documentScopeSchema, documentErrorResponse, readDocumentForm } from "@/infrastructure/documents/document-api";
import { EvidenceDocumentService } from "@/infrastructure/documents/document-service";
import { correlationId, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const requestId = correlationId(request);
  try {
    const url = new URL(request.url);
    const scope = documentScopeSchema.parse({
      assessmentSessionId: url.searchParams.get("assessmentSessionId"),
      organizationId: url.searchParams.get("organizationId") || undefined,
    });
    const owner = await resolveOwner(request, scope.organizationId);
    const data = await new EvidenceDocumentService().list(owner, scope.assessmentSessionId);
    return response({ data }, 200, requestId);
  } catch (error) {
    return documentErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const { file, scope } = await readDocumentForm(request);
    const owner = await resolveOwner(request, scope.organizationId);
    const data = await new EvidenceDocumentService().upload(owner, scope.assessmentSessionId, file);
    return response({ data }, 201, requestId);
  } catch (error) {
    return documentErrorResponse(error, requestId);
  }
}
