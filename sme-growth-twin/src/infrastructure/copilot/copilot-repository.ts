import type { ModelCallTelemetry } from "@/domain/ai-execution";
import type {
  CopilotMessage,
  CopilotMessagePart,
  CopilotReadToolInput,
  CopilotReadToolName,
  CopilotSession,
  CopilotWriteToolName,
  CreateCopilotSession,
} from "@/domain/copilot";
import type { OwnershipContext } from "@/domain/persistence";

export interface AppendCopilotMessage {
  id: string;
  turnId: string;
  role: "user" | "assistant" | "tool";
  messageType: "text" | "tool_call" | "tool_result" | "disclosure";
  text: string | null;
  toolName?: CopilotReadToolName | CopilotWriteToolName;
  toolCallId?: string;
  toolPayload?: Record<string, unknown>;
  modelCallId?: string;
  executionState?: "live" | "deterministic_fallback" | "ai_disabled" | "failed";
  parts?: CopilotMessagePart[];
}

export interface CopilotConfirmation {
  id: string;
  chatSessionId: string;
  turnId: string;
  toolName: CopilotWriteToolName;
  arguments: Record<string, unknown>;
  status: "pending" | "executing" | "executed" | "expired" | "rejected" | "failed";
  expiresAt: string;
  result: Record<string, unknown> | null;
}

export interface CopilotRepository {
  createOrResume(owner: OwnershipContext, input: CreateCopilotSession): Promise<CopilotSession>;
  getSession(owner: OwnershipContext, sessionId: string): Promise<CopilotSession>;
  history(owner: OwnershipContext, sessionId: string, afterSequence?: number, limit?: number): Promise<CopilotMessage[]>;
  findTurn(owner: OwnershipContext, sessionId: string, idempotencyKey: string): Promise<{ turnId: string; response: Record<string, unknown> } | null>;
  rememberTurn(owner: OwnershipContext, sessionId: string, idempotencyKey: string, turnId: string, response: Record<string, unknown>): Promise<void>;
  appendMessage(owner: OwnershipContext, sessionId: string, message: AppendCopilotMessage): Promise<CopilotMessage>;
  invokeReadTool(owner: OwnershipContext, session: CopilotSession, toolName: CopilotReadToolName, input: CopilotReadToolInput): Promise<Record<string, unknown>>;
  proposeWrite(owner: OwnershipContext, session: CopilotSession, turnId: string, toolName: CopilotWriteToolName, args: Record<string, unknown>, proposalKey: string, modelCallId?: string): Promise<CopilotConfirmation>;
  claimConfirmation(owner: OwnershipContext, confirmationId: string, executionKey: string): Promise<CopilotConfirmation>;
  completeConfirmation(owner: OwnershipContext, confirmationId: string, result: Record<string, unknown>): Promise<CopilotConfirmation>;
  failConfirmation(owner: OwnershipContext, confirmationId: string, safeCode: string): Promise<void>;
  appendModelCall(owner: OwnershipContext, sessionId: string, turnId: string, telemetry: ModelCallTelemetry, toolNames: string[], finishReason: string | null): Promise<void>;
  getDailyModelSpend(owner: OwnershipContext): Promise<number>;
}
