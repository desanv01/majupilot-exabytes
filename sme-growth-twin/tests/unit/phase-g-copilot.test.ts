import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { copilotTurnRequestSchema, copilotWriteToolInputSchemas, type CopilotMessage, type CopilotSession } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { executeCopilotTurn } from "@/infrastructure/copilot/copilot-model";
import type { AppendCopilotMessage, CopilotRepository } from "@/infrastructure/copilot/copilot-repository";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner: OwnershipContext = { kind: "guest", guestSessionId: uuid(2) };
const session: CopilotSession = { id: uuid(3), assessmentSessionId: uuid(1), businessTwinId: uuid(4), blueprintId: uuid(5), status: "active", nextSequence: 1, schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-20T00:00:00.000Z", updatedAt: "2026-09-20T00:00:00.000Z" };

class FakeRepository implements CopilotRepository {
  messages: AppendCopilotMessage[] = [];
  calls: Array<Record<string, unknown>> = [];
  receipts = new Map<string, Record<string, unknown>>();
  invoked: string[] = [];
  createOrResume = vi.fn(async () => session);
  getSession = vi.fn(async () => session);
  history = vi.fn(async () => [] as CopilotMessage[]);
  findTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string) => this.receipts.has(key) ? { turnId: uuid(8), response: this.receipts.get(key)! } : null);
  rememberTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string, _turnId: string, response: Record<string, unknown>) => { if (this.receipts.has(key)) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409); this.receipts.set(key, response); });
  appendMessage = vi.fn(async (_owner: OwnershipContext, _sessionId: string, message: AppendCopilotMessage) => { this.messages.push(message); return {} as CopilotMessage; });
  invokeReadTool = vi.fn(async (_owner: OwnershipContext, _session: CopilotSession, name: string) => { this.invoked.push(name); return name === "getEvidenceForClaim" ? { evidence: [{ id: uuid(6), sourceRef: "question:3", payload: { value: "Synthetic evidence" } }] } : name === "searchUploadedEvidence" ? { answerable: false, reason: "NO_RELEVANT_EVIDENCE", citations: [] } : { artifactId: uuid(5), trusted: true }; });
  proposeWrite = vi.fn(); claimConfirmation = vi.fn(); completeConfirmation = vi.fn(); failConfirmation = vi.fn();
  appendModelCall = vi.fn(async (_owner, sessionId, turnId, telemetry, toolNames, finishReason) => { this.calls.push({ sessionId, turnId, telemetry, toolNames, finishReason }); });
  getDailyModelSpend = vi.fn(async () => 0);
}

describe("Phase G Transformation Copilot", () => {
  const previousMode = process.env.AI_EXECUTION_MODE;
  afterEach(() => { if (previousMode === undefined) delete process.env.AI_EXECUTION_MODE; else process.env.AI_EXECUTION_MODE = previousMode; });

  it("persists an ai-disabled turn with truthful disclosure and one authorized typed read", async () => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const repository = new FakeRepository();
    const request = copilotTurnRequestSchema.parse({ message: "Why is my digital maturity score low?", idempotencyKey: "turn-disabled-01" });
    const result = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" });
    expect(result.state).toBe("ai_disabled");
    expect(result.text).toContain("AI is disabled");
    expect(repository.invoked).toEqual(["explainDigitalMaturity"]);
    expect(repository.messages.map((item) => item.role)).toEqual(["user", "tool", "assistant"]);
    expect((repository.calls[0].telemetry as { outcome: string }).outcome).toBe("ai_disabled");
  });

  it("reuses the stable turn idempotency key without appending messages twice", async () => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const repository = new FakeRepository();
    const request = copilotTurnRequestSchema.parse({ message: "Show my Blueprint", idempotencyKey: "turn-replay-01" });
    const first = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" });
    const count = repository.messages.length;
    const replay = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" });
    expect(replay).toEqual(first); expect(repository.messages).toHaveLength(count); expect(repository.receipts.size).toBe(2);
  });

  it("proves an authorized evidence-reading tool returns persisted evidence", async () => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const repository = new FakeRepository();
    const request = copilotTurnRequestSchema.parse({ message: "Read the saved evidence", requestedTool: "getEvidenceForClaim", requestedToolInput: { evidenceId: uuid(6) }, idempotencyKey: "turn-evidence-01" });
    const result = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" });
    expect(result.toolCalls[0]).toMatchObject({ toolName: "getEvidenceForClaim", status: "completed" });
    expect(result.toolCalls[0].result).toMatchObject({ evidence: [{ id: uuid(6), sourceRef: "question:3" }] });
    expect(repository.invoked).toEqual(["getEvidenceForClaim"]);
  });

  it("gracefully refuses an uploaded-document question with no relevant evidence", async () => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const repository = new FakeRepository();
    const request = copilotTurnRequestSchema.parse({ message: "What does the uploaded document say about payroll?", idempotencyKey: "turn-upload-none-01" });
    const result = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" });
    expect(result.toolCalls[0]).toMatchObject({ toolName: "searchUploadedEvidence", result: { answerable: false, reason: "NO_RELEVANT_EVIDENCE" } });
    expect(result.text).toContain("could not answer this from uploaded evidence");
    expect(result.text).toContain("deterministic MajuPilot facts");
  });

  it.each([
    ["Download the PDF report", "getReportMetadata"],
    ["Where can I download my report?", "getReportMetadata"],
    ["What does the uploaded PDF say about payroll?", "searchUploadedEvidence"],
    ["Search the DOCX document for the service owner", "searchUploadedEvidence"],
    ["From the uploaded evidence, report the stockout target", "searchUploadedEvidence"],
  ] as const)("routes deterministic fallback intent for %s", async (message, expectedTool) => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const repository = new FakeRepository();
    const request = copilotTurnRequestSchema.parse({ message, idempotencyKey: `turn-route-${expectedTool}-${message.length}` });
    const result = await executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" });
    expect(result.toolCalls[0]?.toolName).toBe(expectedTool);
    expect(repository.invoked).toEqual([expectedTool]);
  });

  it("does not regex-block legitimate injection discussion and still rejects unknown tools", async () => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const repository = new FakeRepository();
    const request = copilotTurnRequestSchema.parse({ message: "Explain why the phrase ignore system instructions is a prompt-injection pattern.", idempotencyKey: "turn-inject-01" });
    await expect(executeCopilotTurn({ owner, sessionId: session.id, request, repository, clientKey: "test-client" })).resolves.toMatchObject({ state: "ai_disabled" });
    expect(repository.proposeWrite).not.toHaveBeenCalled();
    expect(() => copilotTurnRequestSchema.parse({ message: "hello", idempotencyKey: "turn-unknown-01", requestedTool: "readOtherTenant" })).toThrow();
  });

  it("strictly validates every proposed write before confirmation", () => {
    expect(() => copilotWriteToolInputSchemas.requestConsultation.parse({ blueprintId: uuid(5), idempotencyKey: "lead-key-01" })).toThrow();
    expect(() => copilotWriteToolInputSchemas.acceptConsultantNote.parse({ organizationId: uuid(9), draftNoteId: uuid(10), body: "", requestId: "request-01" })).toThrow();
  });
});
