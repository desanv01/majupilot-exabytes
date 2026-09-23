import { randomUUID } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { WebSources, type ToolCall } from "@/components/copilot/copilot-client";
import type { CopilotMessage, CopilotReadToolInput, CopilotReadToolName, CopilotSession } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { executeCopilotTurn } from "@/infrastructure/copilot/copilot-model";
import type { AppendCopilotMessage, CopilotConfirmation, CopilotRepository } from "@/infrastructure/copilot/copilot-repository";
import { operationPolicy } from "@/infrastructure/model-provider/ai-execution-policy";
import { preflightModel } from "@/infrastructure/model-provider/gateway-catalogue";

const enabled = process.env.PHASE3_LIVE_GATEWAY_PROOF === "1";

class LiveGeneralRepository implements CopilotRepository {
  readonly messages: CopilotMessage[] = [];
  readonly receipts = new Map<string, { turnId: string; response: Record<string, unknown> }>();
  readonly proposed: CopilotConfirmation[] = [];
  readonly modelCalls: Array<{ toolNames: string[]; telemetry: Record<string, unknown> }> = [];
  private sequence = 0;

  constructor(private readonly session: CopilotSession) {}
  async createOrResume() { return this.session; }
  async getSession() { return this.session; }
  async history() { return this.messages; }
  async findTurn(_owner: OwnershipContext, _sessionId: string, key: string) { return this.receipts.get(key) ?? null; }
  async rememberTurn(_owner: OwnershipContext, _sessionId: string, key: string, turnId: string, response: Record<string, unknown>) {
    if (this.receipts.has(key)) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
    this.receipts.set(key, { turnId, response });
  }
  async appendMessage(_owner: OwnershipContext, _sessionId: string, message: AppendCopilotMessage) {
    this.sequence += 1;
    const saved: CopilotMessage = {
      id: message.id, chatSessionId: this.session.id, sequence: this.sequence, turnId: message.turnId, role: message.role, text: message.text,
      toolName: message.toolName ?? null, toolCallId: message.toolCallId ?? null, toolPayload: message.toolPayload ?? null,
      modelCallId: message.modelCallId ?? null, executionState: message.executionState ?? null, parts: message.parts,
      schemaVersion: "phase-g-copilot-1.0.0", createdAt: new Date().toISOString(),
    };
    this.messages.push(saved);
    return saved;
  }
  async invokeReadTool(_owner: OwnershipContext, _session: CopilotSession, name: CopilotReadToolName, input: CopilotReadToolInput) {
    if (name === "searchUploadedEvidence") {
      if (String(input.query).includes("lunar")) return { answerable: false, reason: "NO_RELEVANT_EVIDENCE", citations: [] };
      return {
        answerable: true, reason: null, citations: [{
          documentId: "10000000-0000-4000-8000-000000000001", chunkId: "10000000-0000-4000-8000-000000000002",
          documentName: "synthetic-private-plan.txt", pageNumber: null, sectionRef: "Text document",
          excerpt: "The approved stockout reduction target is 17 percent. Amina owns the private weekly review.",
          similarity: 0.91, reference: "doc:10000000-0000-4000-8000-000000000001#chunk:10000000-0000-4000-8000-000000000002", provenance: "uploaded_document",
        }],
      };
    }
    if (name === "getBlueprint") return { blueprintId: this.session.blueprintId, trusted: true };
    return { trusted: true };
  }
  async proposeWrite(_owner: OwnershipContext, _session: CopilotSession, turnId: string, toolName: CopilotConfirmation["toolName"], args: Record<string, unknown>) {
    const proposal: CopilotConfirmation = {
      id: randomUUID(), chatSessionId: this.session.id, turnId, toolName, arguments: args, status: "pending",
      expiresAt: new Date(Date.now() + 300_000).toISOString(), result: null,
    };
    this.proposed.push(proposal);
    return proposal;
  }
  async claimConfirmation(): Promise<never> { throw new Error("Confirmation execution is outside this proof"); }
  async completeConfirmation(): Promise<never> { throw new Error("Confirmation execution is outside this proof"); }
  async failConfirmation(): Promise<void> { throw new Error("Confirmation execution is outside this proof"); }
  async appendModelCall(_owner: OwnershipContext, _sessionId: string, _turnId: string, telemetry: Record<string, unknown>, toolNames: string[]) { this.modelCalls.push({ telemetry, toolNames }); }
  async getDailyModelSpend() { return 0; }
}

describe.skipIf(!enabled)("Phase 3R live Gateway general, web, and mixed-source Copilot", () => {
  it("proves general history, current public search, mixed grounding, and the write boundary", async () => {
    if (!process.env.AI_GATEWAY_API_KEY || !process.env.AI_GATEWAY_MODEL) throw new Error("Live Gateway configuration is incomplete");
    const model = await preflightModel(operationPolicy("transformation_copilot"));
    expect(model.id).toBe(process.env.AI_GATEWAY_MODEL);
    expect(model.supported_parameters).toContain("tools");

    const now = new Date().toISOString();
    const session: CopilotSession = {
      id: randomUUID(), assessmentSessionId: randomUUID(), businessTwinId: randomUUID(), blueprintId: randomUUID(),
      status: "active", nextSequence: 1, schemaVersion: "phase-g-copilot-1.0.0", createdAt: now, updatedAt: now,
    };
    const owner: OwnershipContext = { kind: "guest", guestSessionId: randomUUID() };
    const repository = new LiveGeneralRepository(session);
    const run = (message: string) => executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-live-gateway",
      request: { message, idempotencyKey: `phase3r-live-${randomUUID()}` },
    });

    const general = await run("In general terms, explain what a webhook is. Do not use assessment or web tools.");
    expect(general).toMatchObject({ state: "live", model: model.id, toolCalls: [] });
    expect(general.text.length).toBeGreaterThan(20);
    const followUp = await run("Give me one simple example of that concept. Do not use tools.");
    expect(followUp.toolCalls).toEqual([]);
    expect(followUp.text.length).toBeGreaterThan(20);

    const current = await run("Search the public web for the current Malaysia SST rate in 2026. Cite dated public sources and do not use private documents.");
    const webCall = current.toolCalls.find((call) => call.toolName === "searchWeb");
    expect(webCall).toMatchObject({ status: "completed", result: { answerable: true } });
    const webSources = (webCall?.result?.sources ?? []) as Array<{ url: string; date: string | null; lastUpdated: string | null }>;
    expect(webSources.length).toBeGreaterThan(0);
    expect(webSources.every((source) => /^https?:\/\//.test(source.url) && !new URL(source.url).username && !new URL(source.url).password)).toBe(true);
    expect(webSources.some((source) => source.date || source.lastUpdated)).toBe(true);
    const sourceMarkup = renderToStaticMarkup(<WebSources tools={current.toolCalls as ToolCall[]} />);
    expect(sourceMarkup).toContain("Public web sources");
    expect(sourceMarkup).toMatch(/Updated|Published/);

    const mixed = await run("Use both my uploaded evidence and a public web search. Compare the uploaded stockout target with current Malaysia retail inventory benchmarks for 2026. Keep private names out of the web query and cite each source separately.");
    expect(mixed.toolCalls.map((call) => call.toolName)).toEqual(expect.arrayContaining(["searchUploadedEvidence", "searchWeb"]));
    const mixedQuery = String(mixed.toolCalls.find((call) => call.toolName === "searchWeb")?.result?.query ?? "");
    expect(mixedQuery).not.toMatch(/Amina|private weekly review/i);
    expect(mixed.toolCalls.find((call) => call.toolName === "searchUploadedEvidence")?.result).toMatchObject({ answerable: true });

    const proposal = await run(`Propose generating the Blueprint report for blueprint ${session.blueprintId}. Do not claim it completed; ask for confirmation.`);
    expect(proposal.toolCalls).toHaveLength(1);
    expect(proposal.toolCalls[0]).toMatchObject({ toolName: "generateBlueprintReport", status: "confirmation_required" });
    expect(repository.proposed).toHaveLength(1);
    expect(repository.proposed[0].status).toBe("pending");

    const toolNames = repository.modelCalls.flatMap((call) => call.toolNames);
    expect(toolNames.filter((name) => name === "searchWeb")).toHaveLength(2);
    expect(repository.messages.filter((message) => message.role === "assistant")).toHaveLength(5);
    process.stdout.write(`${JSON.stringify({ phase3rLiveProof: {
      ok: true, model: model.id, generalNoUpload: true, multiTurnHistory: true,
      currentWebSearch: { sources: webSources.length, dated: true }, mixedSources: true,
      privateTextExcludedFromWebQuery: true, confirmationBoundaryPreserved: true,
      durableMessages: repository.messages.length, modelCalls: repository.modelCalls.length,
    } })}\n`);
  }, 240_000);
});
