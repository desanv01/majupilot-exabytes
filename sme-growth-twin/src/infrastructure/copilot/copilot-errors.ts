import { z } from "zod";

import { AiExecutionError } from "@/domain/ai-execution";
import { PersistenceError } from "@/domain/persistence";

import { response } from "@/infrastructure/persistence/api";

export const copilotErrorCategorySchema = z.enum([
  "model_unavailable",
  "invalid_output",
  "timeout",
  "budget_exceeded",
  "rate_limited",
  "session_failure",
  "persistence_failure",
  "validation",
]);
export type CopilotErrorCategory = z.infer<typeof copilotErrorCategorySchema>;

const SESSION_FAILURE_CODES = new Set([
  "UNAUTHENTICATED",
  "SESSION_EXPIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BLUEPRINT_NOT_FOUND",
]);

export function copilotAiErrorCategory(error: AiExecutionError): CopilotErrorCategory {
  switch (error.code) {
    case "AI_INVALID_OUTPUT": return "invalid_output";
    case "AI_TIMEOUT": return "timeout";
    case "AI_BUDGET_EXCEEDED": return "budget_exceeded";
    case "AI_RATE_LIMITED": return "rate_limited";
    case "AI_REQUIRED_UNAVAILABLE": return "model_unavailable";
  }
}

export function copilotPersistenceErrorCategory(error: PersistenceError): CopilotErrorCategory {
  if (error.code === "VALIDATION_FAILED") return "validation";
  return SESSION_FAILURE_CODES.has(error.code) ? "session_failure" : "persistence_failure";
}

export function copilotErrorResponse(error: unknown, requestId: string): Response {
  if (error instanceof AiExecutionError) {
    return response({ error: { code: error.code, category: copilotAiErrorCategory(error), requestId, retryable: error.retryable } }, error.httpStatus, requestId);
  }
  if (error instanceof PersistenceError) {
    return response({ error: { code: error.code, category: copilotPersistenceErrorCategory(error), requestId, retryable: error.code === "INTERNAL_RETRYABLE" } }, error.httpStatus, requestId);
  }
  if (error instanceof z.ZodError) {
    return response({ error: { code: "VALIDATION_FAILED", category: "validation", requestId, retryable: false, issues: error.issues.map((issue) => ({ path: issue.path.join("."), code: issue.code })) } }, 422, requestId);
  }
  return response({ error: { code: "INTERNAL_RETRYABLE", category: "persistence_failure", requestId, retryable: true } }, 503, requestId);
}
