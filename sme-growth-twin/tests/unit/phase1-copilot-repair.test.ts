import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const generateMock = vi.hoisted(() => vi.fn());
const preflightMock = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    ToolLoopAgent: class {
      constructor(private readonly options: unknown) {}
      generate(...args: unknown[]) { return generateMock(this.options, ...args); }
    },
  };
});

vi.mock("@/infrastructure/model-provider/gateway-catalogue", () => ({ preflightModel: preflightMock }));

import { AiExecutionError } from "@/domain/ai-execution";
import type { CopilotMessage, CopilotSession } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { copilotErrorResponse } from "@/infrastructure/copilot/copilot-errors";
import { executeCopilotTurn } from "@/infrastructure/copilot/copilot-model";
import type { AppendCopilotMessage, CopilotConfirmation, CopilotRepository } from "@/infrastructure/copilot/copilot-repository";
import { CopilotApiError, copilotErrorPresentation, prepareCopilotRetry, restoreCopilotMessages, shouldOfferCopilotRetry } from "@/components/copilot/copilot-client-utils";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner: OwnershipContext = { kind: "guest", guestSessionId: uuid(21) };
const session: CopilotSession = { id: uuid(22), assessmentSessionId: uuid(23), businessTwinId: uuid(24), blueprintId: uuid(25), status: "active", nextSequence: 1, schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-20T00:00:00.000Z", updatedAt: "2026-09-20T00:00:00.000Z" };

const message = (role: CopilotMessage["role"], sequence: number, text: string | null): CopilotMessage => ({
  id: uuid(30 + sequence), chatSessionId: session.id, sequence, turnId: uuid(40 + sequence), role, text,
  toolName: null, toolCallId: null, toolPayload: null, modelCallId: null, executionState: role === "tool" ? "ai_disabled" : null,
  schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-20T00:00:00.000Z",
});
const liveResult = (text = "Recovered from the retryable failure.") => ({ text, usage: { inputTokens: 24, outputTokens: 12 }, finishReason: "stop", toolResults: [] });

class FailureRepository implements CopilotRepository {
  messages: AppendCopilotMessage[] = [];
  receipts = new Map<string, { turnId: string; response: Record<string, unknown> }>();
  proposals = new Map<string, CopilotConfirmation>();
  deterministicEvidence = { revision: 1, evidence: ["synthetic-evidence"] };
  createOrResume = vi.fn(async () => session);
  getSession = vi.fn(async () => session);
  history = vi.fn(async () => [] as CopilotMessage[]);
  findTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string) => this.receipts.get(key) ?? null);
  rememberTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string, turnId: string, response: Record<string, unknown>) => { if (this.receipts.has(key)) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409); this.receipts.set(key, { turnId, response }); });
  appendMessage = vi.fn(async (_owner: OwnershipContext, _sessionId: string, input: AppendCopilotMessage) => { this.messages.push(input); return {} as CopilotMessage; });
  invokeReadTool = vi.fn(async (): Promise<Record<string, unknown>> => ({ evidence: this.deterministicEvidence.evidence }));
  proposeWrite = vi.fn(async (_owner: OwnershipContext, _session: CopilotSession, turnId: string, toolName: CopilotConfirmation["toolName"], args: Record<string, unknown>, proposalKey: string) => {
    const existing = this.proposals.get(proposalKey);
    if (existing) return existing;
    const proposal: CopilotConfirmation = { id: uuid(27), chatSessionId: session.id, turnId, toolName, arguments: args, status: "pending", expiresAt: "2026-09-20T00:15:00.000Z", result: null };
    this.proposals.set(proposalKey, proposal);
    return proposal;
  });
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
    expect(shouldOfferCopilotRetry({ retryable: true })).toBe(true);
    expect(shouldOfferCopilotRetry({ retryable: false })).toBe(false);
    expect(shouldOfferCopilotRetry(undefined)).toBe(false);
  });

  it("offers uploaded-document retrieval inside the normal tool loop", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    generateMock.mockImplementation(async (options: unknown) => {
      const tools = (options as { tools: Record<string, { execute: (input: Record<string, unknown>) => Promise<unknown> }> }).tools;
      await tools.searchUploadedEvidence.execute({ query: "stockout target", maxResults: 5, relevanceThreshold: 0.62 });
      return liveResult("The stockout target is 17 percent.");
    });
    const repository = new FailureRepository();
    const citation = { documentId: uuid(61), chunkId: uuid(62), documentName: "synthetic-plan.txt", pageNumber: null, sectionRef: "Text document", excerpt: "The stockout target is 17 percent.", similarity: 0.59, reference: `doc:${uuid(61)}#chunk:${uuid(62)}`, provenance: "uploaded_document" };
    repository.invokeReadTool.mockResolvedValue({ answerable: true, reason: null, citations: [citation] });
    const result = await executeCopilotTurn({ owner, sessionId: session.id,
      request: { message: "What stockout target is in the uploaded document? Cite it.", idempotencyKey: "phase5-anchored-answer" },
      repository, clientKey: "phase5-anchored-test" });
    expect(result.state).toBe("live");
    expect(result.toolCalls[0]).toMatchObject({ toolName: "searchUploadedEvidence", result: { citations: [citation] } });
    expect(repository.invokeReadTool).toHaveBeenCalledWith(owner, session, "searchUploadedEvidence", expect.objectContaining({ query: expect.stringContaining("stockout") }));
    expect(repository.messages.map((item) => item.role)).toEqual(["user", "tool", "assistant"]);
    expect(generateMock.mock.calls[0][0].tools).toHaveProperty("searchUploadedEvidence");
    expect(generateMock.mock.calls[0][0].tools).toHaveProperty("searchWeb");
    expect(repository.proposeWrite).not.toHaveBeenCalled();
  });

  it("allows clearly labelled general guidance after an unsupported document claim", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    generateMock.mockImplementation(async (options: unknown) => {
      const tools = (options as { tools: Record<string, { execute: (input: Record<string, unknown>) => Promise<unknown> }> }).tools;
      await tools.searchUploadedEvidence.execute({ query: "lunar payroll deadline", maxResults: 5, relevanceThreshold: 0.62 });
      return liveResult("The upload does not support a lunar payroll deadline. General guidance: confirm payroll deadlines with the relevant authority.");
    });
    const repository = new FailureRepository();
    repository.invokeReadTool.mockResolvedValue({ answerable: false, reason: "NO_RELEVANT_EVIDENCE", citations: [] });
    const result = await executeCopilotTurn({ owner, sessionId: session.id,
      request: { message: "What lunar payroll deadline is in the uploaded document?", idempotencyKey: "phase5-anchored-refusal" },
      repository, clientKey: "phase5-anchored-test" });
    expect(result.state).toBe("live");
    expect(result.text).toContain("upload does not support");
    expect(result.text).toContain("General guidance");
    expect(result.toolCalls[0]).toMatchObject({ toolName: "searchUploadedEvidence", result: { answerable: false } });
    expect(generateMock.mock.calls[0][0].tools).toHaveProperty("searchUploadedEvidence");
    expect(result.toolCalls).toHaveLength(1);
  });

  it("claims one same-key retry, succeeds, and replays without duplicate messages or proposals", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    let attempt = 0;
    generateMock.mockImplementation(async (options: unknown) => {
      const tools = (options as { tools: Record<string, { execute: (input: Record<string, unknown>) => Promise<unknown> }> }).tools;
      await tools.generateBlueprintReport.execute({ blueprintId: session.blueprintId, locale: "en-MY", acceptedNoteIds: [] });
      attempt += 1;
      if (attempt === 1) throw new Error("synthetic timeout");
      return liveResult();
    });
    const repository = new FailureRepository();
    const before = structuredClone(repository.deterministicEvidence);
    const request = { message: "Read the saved evidence", idempotencyKey: "turn-phase1-failure" } as const;

    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-failure-test" })).rejects.toMatchObject({ code: "AI_TIMEOUT" });
    const retry = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-failure-test" });
    const replay = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-failure-test" });
    expect(retry.state).toBe("live");
    expect(replay).toEqual(retry);
    expect(repository.deterministicEvidence).toEqual(before);
    expect(repository.invokeReadTool).not.toHaveBeenCalled();
    expect(repository.messages.map((item) => item.role)).toEqual(["user", "tool", "assistant"]);
    expect(repository.proposals.size).toBe(1);
    expect(repository.receipts.size).toBe(4);
    expect(generateMock).toHaveBeenCalledTimes(2);
  });

  it("keeps a non-retryable failed receipt terminal", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    generateMock.mockRejectedValue(new AiExecutionError("AI_INVALID_OUTPUT", 502, false));
    const repository = new FailureRepository();
    const request = { message: "Return a valid grounded response", idempotencyKey: "turn-phase1-terminal" } as const;

    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-terminal-test" })).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-terminal-test" })).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(repository.messages.map((item) => item.role)).toEqual(["user"]);
    expect(repository.receipts.size).toBe(2);
  });

  it("binds an idempotency key to the original request payload", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    generateMock.mockResolvedValue(liveResult("Original request completed."));
    const repository = new FailureRepository();
    const request = { message: "Summarize the saved plan", idempotencyKey: "turn-phase1-payload-binding" } as const;

    await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-payload-test" });
    await expect(executeCopilotTurn({
      owner,
      sessionId: session.id,
      request: { ...request, message: "Use the same key for a different instruction" },
      repository,
      clientKey: "phase1-payload-test",
    })).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(repository.messages.map((item) => item.role)).toEqual(["user", "assistant"]);
  });

  it("lets one concurrent claimant execute and makes the loser retry safely", async () => {
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
    let complete: (() => void) | undefined;
    generateMock.mockImplementationOnce(() => new Promise((resolve) => { complete = () => resolve(liveResult("Concurrent winner completed.")); }));
    const repository = new FailureRepository();
    const request = { message: "Summarize the saved plan", idempotencyKey: "turn-phase1-concurrent" } as const;

    const winner = executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-concurrent-test" });
    await vi.waitFor(() => expect(generateMock).toHaveBeenCalledTimes(1));
    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-concurrent-test" })).rejects.toMatchObject({ code: "INTERNAL_RETRYABLE" });
    complete?.();
    const completed = await winner;
    const replay = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "phase1-concurrent-test" });
    expect(replay).toEqual(completed);
    expect(repository.messages.map((item) => item.role)).toEqual(["user", "assistant"]);
    expect(repository.receipts.size).toBe(2);
  });
});
