import { ADVISOR_PROMPT_VERSION, ADVISOR_SCHEMA_VERSION, type AdvisorDefinition, type AdvisorReview, type ModelCallRecord } from "@/domain/advisors";

export type AttemptFailureStatus = "timeout" | "provider_error" | "invalid_output" | "invalid_evidence";
export type AttemptFailureCategory = "timeout" | "provider" | "validation" | "evidence";

export class AdvisorModelAttemptError extends Error {
  constructor(readonly status: AttemptFailureStatus, readonly category: AttemptFailureCategory, readonly transient: boolean) { super(status); }
}

export interface ModelAttemptResult { review: AdvisorReview; evidenceIds: string[] }
export interface AdvisorModelRunnerOptions {
  definition: AdvisorDefinition; model: string; maxTotalMs?: number;
  attempt: (options: { attemptIndex: 0 | 1; timeoutMs: number }) => Promise<ModelAttemptResult>;
  now?: () => number; callId?: () => string;
}

const asFailure = (error: unknown) => error instanceof AdvisorModelAttemptError ? error : new AdvisorModelAttemptError("provider_error", "provider", true);

export async function runBoundedAdvisorModelReview(options: AdvisorModelRunnerOptions): Promise<{ status: "success"; review: AdvisorReview; call: ModelCallRecord } | { status: "fallback"; call: ModelCallRecord }> {
  const now = options.now ?? Date.now; const started = now(); const maxTotalMs = options.maxTotalMs ?? 12_000;
  const record = (status: ModelCallRecord["status"], category: ModelCallRecord["errorCategory"], retryCount: 0 | 1, evidenceIds: string[]): ModelCallRecord => ({
    id: (options.callId?.() ?? `modelcall_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`) as ModelCallRecord["id"], advisor: options.definition.id,
    provider: "vercel_ai_gateway", model: options.model, promptVersion: ADVISOR_PROMPT_VERSION, schemaVersion: ADVISOR_SCHEMA_VERSION,
    latencyMs: Math.max(0, now() - started), retryCount, status, evidenceIds, errorCategory: category,
  });
  for (const attemptIndex of [0, 1] as const) {
    const remaining = maxTotalMs - (now() - started);
    if (remaining <= 0) return { status: "fallback", call: record("timeout", "timeout", attemptIndex === 0 ? 0 : 1, []) };
    try {
      const result = await options.attempt({ attemptIndex, timeoutMs: remaining });
      return { status: "success", review: result.review, call: record("success", "none", attemptIndex, result.evidenceIds) };
    } catch (error) {
      const failure = asFailure(error);
      if (!(failure.transient && attemptIndex === 0 && now() - started < maxTotalMs)) return { status: "fallback", call: record(failure.status, failure.category, attemptIndex, []) };
    }
  }
  return { status: "fallback", call: record("provider_error", "provider", 1, []) };
}
