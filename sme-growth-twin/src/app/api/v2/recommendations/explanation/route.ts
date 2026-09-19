import { AiExecutionError } from "@/domain/ai-execution";
import { recommendationExplanationRequestSchema, recommendationExplanationResponseSchema } from "@/domain/recommendation-explanations";
import { runRecommendationExplanation } from "@/infrastructure/model-provider/recommendation-explanation-model";
import { correlationId, errorResponse, readJson, repository, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = recommendationExplanationRequestSchema.parse(await readJson(request, 32 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const store = repository();
    await store.assertAssessmentAccess(owner, input.assessmentSessionId);
    await store.assertEvidenceReferences(owner, input.assessmentSessionId, input.evidenceRefs);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
    const result = recommendationExplanationResponseSchema.parse(await runRecommendationExplanation(input, owner, store, clientKey));
    return response({ data: result }, 200, requestId);
  } catch (error) {
    if (error instanceof AiExecutionError) return response({ error: { code: error.code, requestId, retryable: error.retryable } }, error.httpStatus, requestId);
    return errorResponse(error, requestId);
  }
}
