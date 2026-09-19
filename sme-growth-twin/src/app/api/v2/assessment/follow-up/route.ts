import { AiExecutionError, followUpRequestSchema, followUpResponseSchema } from "@/domain/ai-execution";
import { correlationId, errorResponse, readJson, repository, resolveOwner, response } from "@/infrastructure/persistence/api";
import { runDynamicFollowUp } from "@/infrastructure/model-provider/follow-up-model";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = followUpRequestSchema.parse(await readJson(request, 64 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const store = repository();
    await store.assertAssessmentAccess(owner, input.assessmentSessionId);
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = (forwarded || request.headers.get("x-real-ip") || "unidentified-client").slice(0, 128);
    const result = followUpResponseSchema.parse(await runDynamicFollowUp(input, owner, store, clientKey));
    return response({ data: result }, 200, requestId);
  } catch (error) {
    if (error instanceof AiExecutionError) return response({ error: { code: error.code, requestId, retryable: error.retryable } }, error.httpStatus, requestId);
    return errorResponse(error, requestId);
  }
}
