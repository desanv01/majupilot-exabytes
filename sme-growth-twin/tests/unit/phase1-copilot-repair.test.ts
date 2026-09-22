import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const generateMock = vi.hoisted(() => vi.fn());
const preflightMock = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    ToolLoopAgent: class {
      constructor(options: unknown) { void options; }
      generate(...args: unknown[]) { return generateMock(...args); }
    },
  };
});

vi.mock("@/infrastructure/model-provider/gateway-catalogue", () => ({ preflightModel: preflightMock }));

import { AiExecutionError } from "@/domain/ai-execution";
import type { CopilotMessage, CopilotSession } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { copilotErrorResponse } from "@/infrastructure/copilot/copilot-errors";
import { executeCopilotTurn } from "@/infrastructure/copilot/copilot-model";
import type { AppendCopilotMessage, CopilotRepository } from "@/infrastructure/copilot/copilot-repository";
import { CopilotApiError, copilotErrorPresentation, prepareCopilotRetry, restoreCopilotMessages } from "@/components/copilot/copilot-client-utils";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner: OwnershipContext = { kind: "guest", guestSessionId: uuid(21) };
const session: CopilotSession = { id: uuid(22), assessmentSessionId: uuid(23), businessTwinId: uuid(24), blueprintId: uuid(25), status: "active", nextSequence: 1, schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-20T00:00:00.000Z", updatedAt: "2026-09-20T00:00:00.000Z" };

const message = (role: CopilotMessage["role"], sequence: number, text: string | null): CopilotMessage => ({
  id: uuid(30 + sequence), chatSessionId: session.id, sequence, turnId: uuid(40 + sequence), role, text,
  toolName: null, toolCallId: null, toolPayload: null, modelCallId: null, executionState: role === "tool" ? "ai_disabled" : null,
  schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-20T00:00:00.000Z",
});

class FailureRepository implements CopilotRepository {
  messages: AppendCopilotMessage[] = [];
  receipts = new Map<string, Record<string, unknown>>();
  deterministicEvidence = { revision: 1, evidence: ["synthetic-evidence"] };
  createOrResume = vi.fn(async () => session);
  getSession = vi.fn(async () => session);
  history = vi.fn(async () => [] as CopilotMessage[]);
  findTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string) => this.receipts.has(key) ? { turnId: uuid(26), response: this.receipts.get(key)! } : null);
  rememberTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string, _turnId: string, response: Record<string, unknown>) => { this.receipts.set(key, response); });
  appendMessage = vi.fn(async (_owner: OwnershipContext, _sessionId: string, input: AppendCopilotMessage) => { this.messages.push(input); return {} as CopilotMessage; });
  invokeReadTool = vi.fn(async () => ({ evidence: this.deterministicEvidence.evidence }));
  proposeWrite = vi.fn();
  claimConfirmation = vi.fn();
  completeConfirmation = vi.fn();
  failConfirmation = vi.fn();
  appendModelCall = vi.fn(async () => undefined);
  getDailyModelSpend = vi.fn(async () => 0);
}

describe("Phase 1 Copilot repair", () => {
  const envNames = ["AI_EXECUTION_MODE", "AI_GATEWAY_MODEL", "AI_GATEWAY_API_KEY", "AI_MAX_RETRIES_COPILOT"];
  const previousEnv = new Map(envNames.map((name) => [name, process.env[name]]));

  beforeEach(() => {
    generateMock.mockReset();
    preflightMock.mockReset();
    process.env.AI_EXECUTION_MODE = "required";
    process.env.AI_GATEWAY_MODEL = "test/model";
    process.env.AI_GATEWAY_API_KEY = "synthetic-test-credential";
    process.env.AI_MAX_RETRIES_COPILOT = "0";
  });

  afterEach(() => {
    for (const name of envNames) {
      const value = previousEnv.get(name);
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });

  it("returns only safe error categories and a correlation ID", async () => {
    const cases = [
      ["AI_REQUIRED_UNAVAILABLE", 503, true, "model_unavailable"],
      ["AI_INVALID_OUTPUT", 502, false, "invalid_output"],
      ["AI_TIMEOUT", 504, true, "timeout"],
      ["AI_BUDGET_EXCEEDED", 402, false, "budget_exceeded"],
      ["AI_RATE_LIMITED", 429, true, "rate_limited"],
    ] as const;
    for (const [code, status, retryable, category] of cases) {
      const ai = copilotErrorResponse(new AiExecutionError(code, status, retryable), "request_phase1_123");
      const aiBody = await ai.json() as { error: Record<string, unknown> };
      expect(ai.status).toBe(status);
      expect(ai.headers.get("x-correlation-id")).toBe("request_phase1_123");
      expect(aiBody.error).toEqual({ code, category, requestId: "request_phase1_123", retryable });
      expect(aiBody.error.message).toBeUndefined();
    }

    const sessionFailure = copilotErrorResponse(new PersistenceError("NOT_FOUND", 404), "request_phase1_session");
    const sessionBody = await sessionFailure.json() as { error: Record<string, unknown> };
    expect(sessionBody.error).toEqual({ code: "NOT_FOUND", category: "session_failure", requestId: "request_phase1_session", retryable: false });
    const validationFailure = copilotErrorResponse(new PersistenceError("VALIDATION_FAILED", 422), "request_phase1_validation");
    const validationBody = await validationFailure.json() as { error: Record<string, unknown> };
    expect(validationBody.error).toEqual({ code: "VALIDATION_FAILED", category: "validation", requestId: "request_phase1_validation", retryable: false });
    const persistenceFailure = copilotErrorResponse(new PersistenceError("INTERNAL_RETRYABLE", 503), "request_phase1_persistence");
    const persistenceBody = await persistenceFailure.json() as { error: Record<string, unknown> };
    expect(persistenceBody.error).toEqual({ code: "INTERNAL_RETRYABLE", category: "persistence_failure", requestId: "request_phase1_persistence", retryable: true });
  });

  it("restores only authorized user and assistant history and preserves diagnostics", () => {
    const restored = restoreCopilotMessages([message("user", 1, "What is my priority?"), message("tool", 2, null), message("assistant", 3, "The saved evidence points to CRM first.")]);
    expect(restored).toEqual([
      { id: uuid(31), role: "user", text: "What is my priority?" },
      { id: uuid(33), role: "assistant", text: "The saved evidence points to CRM first." },
    ]);
    const presentation = copilotErrorPresentation(new CopilotApiError("AI_TIMEOUT", "timeout", "request_timeout_123", true, 504));
    expect(presentation).toEqual({ message: "Live guidance timed out. Your saved evidence was not changed.", requestId: "request_timeout_123", retryable: true });
    const failed = { id: "failed-status", role: "status" as const, text: presentation.message, retryMessage: "What is my priority?", retryIdempotencyKey: "turn-stable-retry" };
    expect(prepareCopilotRetry([...restored, failed], failed.id)).toEqual(restored);
  });

  it("leaves deterministic evidence untouched when a required live turn fails", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    generateMock.mockRejectedValue(new Error("synthetic timeout"));
    const repository = new FailureRepository();
    const before = structuredClone(repository.deterministicEvidence);
    const request = { message: "Read the saved evidence", idempotencyKey: "turn-phase1-failure" } as const;

    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-failure-test" })).rejects.toMatchObject({ code: "AI_TIMEOUT" });
    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-failure-test" })).rejects.toMatchObject({ code: "AI_TIMEOUT" });
    expect(repository.deterministicEvidence).toEqual(before);
    expect(repository.invokeReadTool).not.toHaveBeenCalled();
    expect(repository.proposeWrite).not.toHaveBeenCalled();
    expect(repository.messages.map((item) => item.role)).toEqual(["user"]);
    expect(repository.receipts.size).toBe(1);
  });
});
