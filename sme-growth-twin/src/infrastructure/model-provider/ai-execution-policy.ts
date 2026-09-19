import "server-only";

import { aiExecutionModeSchema, AiExecutionError, type AiExecutionMode } from "@/domain/ai-execution";

export type AiOperation = "assessment_follow_up" | "recommendation_explanation" | "advisor_review";

export interface AiOperationPolicy {
  operation: AiOperation;
  mode: AiExecutionMode;
  model: string | null;
  timeoutMs: number;
  maxOutputTokens: number;
  maxInputTokens: number;
  maxRetries: 0 | 1;
  perMinuteLimit: number;
  dailyCostUsd: number;
  perCallCostUsd: number;
}

const integerEnv = (name: string, fallback: number, minimum: number, maximum: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
  return parsed;
};

const moneyEnv = (name: string, fallback: number) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
  return parsed;
};

export function executionMode(): AiExecutionMode {
  const value = process.env.AI_EXECUTION_MODE ?? "required";
  const parsed = aiExecutionModeSchema.safeParse(value);
  if (!parsed.success) throw new AiExecutionError("AI_REQUIRED_UNAVAILABLE", 503, false);
  return parsed.data;
}

export function operationPolicy(operation: AiOperation): AiOperationPolicy {
  const suffix = operation === "assessment_follow_up" ? "FOLLOW_UP" : operation === "recommendation_explanation" ? "RECOMMENDATION_EXPLANATION" : "ADVISOR_REVIEW";
  const mode = executionMode();
  const explanation = operation === "recommendation_explanation";
  return {
    operation,
    mode,
    model: process.env[`AI_GATEWAY_MODEL_${suffix}`] || process.env.AI_GATEWAY_MODEL || null,
    timeoutMs: integerEnv(`AI_TIMEOUT_MS_${suffix}`, operation === "assessment_follow_up" ? 20_000 : explanation ? 25_000 : 30_000, 1_000, 60_000),
    maxOutputTokens: integerEnv(`AI_MAX_OUTPUT_TOKENS_${suffix}`, operation === "assessment_follow_up" ? 320 : explanation ? 1_000 : 1_200, 64, 4_096),
    maxInputTokens: integerEnv(`AI_MAX_INPUT_TOKENS_${suffix}`, operation === "assessment_follow_up" ? 1_200 : explanation ? 5_000 : 8_000, 256, 32_000),
    maxRetries: integerEnv(`AI_MAX_RETRIES_${suffix}`, 1, 0, 1) as 0 | 1,
    perMinuteLimit: integerEnv(`AI_RATE_LIMIT_PER_MINUTE_${suffix}`, operation === "assessment_follow_up" ? 6 : explanation ? 8 : 10, 1, 60),
    dailyCostUsd: moneyEnv("AI_DAILY_COST_USD", 2),
    perCallCostUsd: moneyEnv(`AI_MAX_COST_USD_${suffix}`, operation === "assessment_follow_up" ? 0.02 : explanation ? 0.05 : 0.08),
  };
}

export function hasGatewayCredential() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}
