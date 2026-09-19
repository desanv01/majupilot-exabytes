import { AiExecutionError } from "@/domain/ai-execution";
import { hasGatewayCredential, operationPolicy } from "@/infrastructure/model-provider/ai-execution-policy";
import { preflightModel } from "@/infrastructure/model-provider/gateway-catalogue";
import { correlationId, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = correlationId(request);
  let mode: "required" | "preferred" | "disabled" = "required";
  try {
    const policy = operationPolicy("assessment_follow_up");
    mode = policy.mode;
    if (policy.mode === "disabled") return response({ data: { mode: policy.mode, state: "disabled", providerCallAllowed: false } }, 200, requestId);
    if (!policy.model || !hasGatewayCredential()) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
    const model = await preflightModel(policy);
    return response({ data: { mode: policy.mode, state: "ready", providerCallAllowed: true, model: model.id, operation: policy.operation } }, 200, requestId);
  } catch (error) {
    const safe = error instanceof AiExecutionError ? error : new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, true);
    if (mode === "preferred") return response({ data: { mode, state: "unavailable", providerCallAllowed: false, fallbackAvailable: true, reason: safe.code } }, 200, requestId);
    return response({ error: { code: safe.code, requestId, retryable: safe.retryable } }, safe.httpStatus, requestId);
  }
}
