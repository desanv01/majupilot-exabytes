import { z } from "zod";

import { executionMode, operationPolicy } from "@/infrastructure/model-provider/ai-execution-policy";
import { preflightModel } from "@/infrastructure/model-provider/gateway-catalogue";
import { correlationId, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";
const querySchema = z.object({ detail: z.enum(["safe"]).optional() }).strict();

export async function GET(request: Request) {
  const requestId = correlationId(request);
  try {
    const url = new URL(request.url); querySchema.parse({ detail: url.searchParams.get("detail") ?? undefined });
    const mode = executionMode();
    const policy = operationPolicy("transformation_copilot");
    if (mode === "disabled") return response({ data: { state: "ai_disabled", liveAvailable: false, fallbackAvailable: true, documentRag: "p1_out_of_scope" } }, 200, requestId);
    if (!policy.model) return response({ data: { state: mode === "required" ? "failed" : "deterministic_fallback", liveAvailable: false, fallbackAvailable: mode === "preferred", error: "AI_REQUIRED_UNAVAILABLE", documentRag: "p1_out_of_scope" } }, mode === "required" ? 503 : 200, requestId);
    try {
      const model = await preflightModel(policy);
      return response({ data: { state: "live", liveAvailable: true, fallbackAvailable: mode === "preferred", model: model.id, maxToolCalls: 5, documentRag: "p1_out_of_scope" } }, 200, requestId);
    } catch {
      return response({ data: { state: mode === "required" ? "failed" : "deterministic_fallback", liveAvailable: false, fallbackAvailable: mode === "preferred", error: "AI_REQUIRED_UNAVAILABLE", documentRag: "p1_out_of_scope" } }, mode === "required" ? 503 : 200, requestId);
    }
  } catch { return response({ error: { code: "VALIDATION_FAILED", requestId } }, 422, requestId); }
}
