import type { CopilotMessage } from "@/domain/copilot";

export const COPILOT_WELCOME_TEXT = "Ask me anything. I can reason conversationally, explain your saved MajuPilot plan, search your private Evidence Library with exact citations, or check the public web when current information matters.";

export type CopilotClientMessage = {
  id: string;
  role: "user" | "assistant" | "status";
  text: string;
  tools?: Array<{ toolName: string; status: "completed" | "confirmation_required" | "rejected"; confirmationId: string | null; result?: Record<string, unknown> | null }>;
  requestId?: string | null;
  retryMessage?: string;
  retryIdempotencyKey?: string;
};

export type CopilotApiErrorBody = {
  code?: string;
  category?: string;
  requestId?: string;
  retryable?: boolean;
};

export class CopilotApiError extends Error {
  constructor(
    readonly code: string,
    readonly category: string | null,
    readonly requestId: string | null,
    readonly retryable: boolean,
    readonly status: number,
  ) {
    super(code);
    this.name = "CopilotApiError";
  }
}

export function copilotErrorPresentation(error: unknown) {
  const details = error instanceof CopilotApiError
    ? error
    : new CopilotApiError("INTERNAL_RETRYABLE", "persistence_failure", null, true, 503);
  const message = (() => {
    switch (details.code) {
      case "AI_REQUIRED_UNAVAILABLE": return "Live guidance is temporarily unavailable. Your saved evidence was not changed.";
      case "AI_INVALID_OUTPUT": return "Live guidance returned an invalid response. Your saved evidence was not changed.";
      case "AI_TIMEOUT": return "Live guidance timed out. Your saved evidence was not changed.";
      case "AI_BUDGET_EXCEEDED": return "Live guidance is unavailable because the Copilot budget has been reached. Your saved evidence was not changed.";
      case "AI_RATE_LIMITED": return "Live guidance is busy right now. Please retry shortly. Your saved evidence was not changed.";
      case "UNAUTHENTICATED":
      case "SESSION_EXPIRED":
      case "FORBIDDEN":
      case "NOT_FOUND":
      case "BLUEPRINT_NOT_FOUND": return "This Copilot session could not be restored safely. Refresh after confirming your Blueprint is synced.";
      case "VALIDATION_FAILED": return "That Copilot request could not be validated safely. Your saved evidence was not changed.";
      default: return "That Copilot request could not be completed safely. Your saved evidence was not changed.";
    }
  })();
  return { message, requestId: details.requestId, retryable: details.retryable };
}

export function restoreCopilotMessages(messages: readonly CopilotMessage[]): CopilotClientMessage[] {
  const toolResults = new Map<string, CopilotClientMessage["tools"]>();
  for (const message of messages) {
    if (message.role !== "tool" || !message.toolName || !message.toolPayload) continue;
    const current = toolResults.get(message.turnId) ?? [];
    const confirmationId = typeof message.toolPayload.confirmationId === "string" ? message.toolPayload.confirmationId : null;
    const persistedStatus = message.parts?.find((part) => part.type === "tool-status");
    current.push({
      toolName: message.toolName,
      status: persistedStatus?.type === "tool-status"
        ? persistedStatus.state
        : message.toolPayload.confirmationRequired === true ? "confirmation_required" : "completed",
      confirmationId,
      result: message.toolPayload,
    });
    toolResults.set(message.turnId, current);
  }
  const restored = messages
    .filter((message) => message.role !== "tool" && typeof message.text === "string" && message.text.length > 0)
    .map((message) => ({
      id: message.id,
      role: message.role === "user" ? "user" as const : "assistant" as const,
      text: message.text!,
      tools: message.role === "assistant" ? toolResults.get(message.turnId) : undefined,
    }));
  return restored.length ? restored : [{ id: "welcome", role: "assistant", text: COPILOT_WELCOME_TEXT }];
}

export function prepareCopilotRetry(messages: readonly CopilotClientMessage[], failedStatusId: string) {
  return messages.filter((message) => message.id !== failedStatusId);
}

export function shouldOfferCopilotRetry(failure: { retryable: boolean } | undefined) {
  return failure?.retryable === true;
}
