import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ToolChoiceViolationError } from "ai";

const generateMock = vi.hoisted(() => vi.fn());
const streamMock = vi.hoisted(() => vi.fn());
const preflightMock = vi.hoisted(() => vi.fn());
const perplexitySearchMock = vi.hoisted(() => vi.fn(() => ({ type: "provider-defined" })));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    ToolLoopAgent: class {
      constructor(private readonly options: unknown) {}
      generate(...args: unknown[]) { return generateMock(this.options, ...args); }
      stream(...args: unknown[]) { return streamMock(this.options, ...args); }
    },
  };
});
vi.mock("@ai-sdk/gateway", () => ({ gateway: { tools: { perplexitySearch: perplexitySearchMock } } }));
vi.mock("@/infrastructure/model-provider/gateway-catalogue", () => ({ preflightModel: preflightMock }));

import type { CopilotMessage, CopilotSession } from "@/domain/copilot";
import { copilotMessagePartSchema } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import {
  derivePublicWebQuery,
  executeCopilotTurn,
  focusedBlueprintRead,
  isPublicWebQuerySafe,
  isSafePublicSourceUrl,
} from "@/infrastructure/copilot/copilot-model";
import type { AppendCopilotMessage, CopilotConfirmation, CopilotRepository } from "@/infrastructure/copilot/copilot-repository";
import { restoreCopilotMessages } from "@/components/copilot/copilot-client-utils";
import { Markdown } from "@/components/copilot/copilot-client";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { stage05CaseA } from "./stage05-fixtures";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner: OwnershipContext = { kind: "guest", guestSessionId: uuid(1) };
const session: CopilotSession = {
  id: uuid(2), assessmentSessionId: uuid(3), businessTwinId: uuid(4), blueprintId: uuid(5), status: "active",
  nextSequence: 1, schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-23T00:00:00.000Z", updatedAt: "2026-09-23T00:00:00.000Z",
};
const completed = (text: string) => ({ text, usage: { inputTokens: 30, outputTokens: 12 }, finishReason: "stop", toolResults: [] });

class Phase3rRepository implements CopilotRepository {
  messages: AppendCopilotMessage[] = [];
  receipts = new Map<string, { turnId: string; response: Record<string, unknown> }>();
  savedHistory: CopilotMessage[] = [];
  createOrResume = vi.fn(async () => session);
  getSession = vi.fn(async () => session);
  history = vi.fn(async () => this.savedHistory);
  findTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string) => this.receipts.get(key) ?? null);
  rememberTurn = vi.fn(async (_owner: OwnershipContext, _sessionId: string, key: string, turnId: string, response: Record<string, unknown>) => {
    if (this.receipts.has(key)) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
    this.receipts.set(key, { turnId, response });
  });
  appendMessage = vi.fn(async (_owner: OwnershipContext, _sessionId: string, input: AppendCopilotMessage) => {
    this.messages.push(input);
    return {} as CopilotMessage;
  });
  invokeReadTool = vi.fn(async (_owner: OwnershipContext, _session: CopilotSession, name: string) => {
    if (name === "searchUploadedEvidence") return {
      answerable: true,
      reason: null,
      citations: [{
        documentId: uuid(10), chunkId: uuid(11), documentName: "synthetic-plan.txt", pageNumber: null,
        sectionRef: "Text document", excerpt: "Private synthetic stockout target: 17 percent, owned by Amina.",
        similarity: 0.88, reference: `doc:${uuid(10)}#chunk:${uuid(11)}`, provenance: "uploaded_document",
      }],
    };
    return { trusted: true };
  });
  proposeWrite = vi.fn(async (_owner: OwnershipContext, _session: CopilotSession, turnId: string, toolName: CopilotConfirmation["toolName"], args: Record<string, unknown>) => ({
    id: uuid(12), chatSessionId: session.id, turnId, toolName, arguments: args, status: "pending" as const,
    expiresAt: "2026-09-23T00:15:00.000Z", result: null,
  }));
  claimConfirmation = vi.fn();
  completeConfirmation = vi.fn();
  failConfirmation = vi.fn();
  appendModelCall = vi.fn(async () => undefined);
  getDailyModelSpend = vi.fn(async () => 0);
}

describe("Phase 3R general assessment-scoped Copilot", () => {
  const envNames = ["AI_EXECUTION_MODE", "AI_GATEWAY_MODEL", "AI_GATEWAY_API_KEY", "AI_MAX_RETRIES_COPILOT"];
  const previousEnv = new Map(envNames.map((name) => [name, process.env[name]]));

  beforeEach(() => {
    generateMock.mockReset();
    streamMock.mockReset();
    preflightMock.mockReset();
    perplexitySearchMock.mockClear();
    process.env.AI_EXECUTION_MODE = "required";
    process.env.AI_GATEWAY_MODEL = "test/model";
    process.env.AI_GATEWAY_API_KEY = "synthetic-test-credential";
    process.env.AI_MAX_RETRIES_COPILOT = "0";
    preflightMock.mockResolvedValue({ id: "test/model", supported_parameters: ["tools"], pricing: { input: 0, output: 0 } });
  });

  afterEach(() => {
    for (const name of envNames) {
      const value = previousEnv.get(name);
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });

  it("answers general follow-ups with restored history and the complete tool set available", async () => {
    const repository = new Phase3rRepository();
    repository.savedHistory = [{
      id: uuid(20), chatSessionId: session.id, sequence: 1, turnId: uuid(21), role: "assistant", text: "A webhook is an HTTP callback.",
      toolName: null, toolCallId: null, toolPayload: null, modelCallId: null, executionState: "live", schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-23T00:00:00.000Z",
    }];
    generateMock.mockImplementation(async (options: unknown, input: unknown) => {
      const configured = options as { tools: Record<string, unknown>; prepareStep: (value: unknown) => unknown };
      const tools = configured.tools;
      expect(Object.keys(tools)).toEqual(expect.arrayContaining(["searchUploadedEvidence", "searchWeb", "getBlueprint", "requestConsultation"]));
      expect(configured.prepareStep({ steps: [] })).toBeUndefined();
      expect((input as { prompt: string }).prompt).toContain("A webhook is an HTTP callback.");
      return completed("It lets one service notify another when an event occurs.");
    });

    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-general",
      request: { message: "Can you explain that more simply?", idempotencyKey: "phase3r-general-turn" },
    });

    expect(result).toMatchObject({ state: "live", toolCalls: [], text: expect.stringContaining("notify another") });
    expect(repository.invokeReadTool).not.toHaveBeenCalled();
    expect(repository.messages.map((item) => item.role)).toEqual(["user", "assistant"]);
  });

  it.each(["document-first", "web-first"] as const)("combines assessment evidence and current web sources in %s order", async (order) => {
    const repository = new Phase3rRepository();
    const nestedPrompts: string[] = [];
    generateMock.mockImplementation(async (options: unknown, input: unknown) => {
      const tools = (options as { tools: Record<string, { execute: (value: Record<string, unknown>) => Promise<unknown> }> }).tools;
      if (tools.providerSearch) {
        nestedPrompts.push((input as { prompt: string }).prompt);
        return {
          text: "", usage: { inputTokens: 10, outputTokens: 1 }, finishReason: "tool-calls",
          toolResults: [{ toolName: "providerSearch", output: { results: [
            { title: "Malaysia retail benchmark", url: "https://example.org/benchmark", snippet: "Public benchmark for 2026.", date: "2026-09-22", lastUpdated: "2026-09-23" },
            { title: "Bad protocol", url: "javascript:alert(1)", snippet: "Unsafe", date: null, lastUpdated: null },
            { title: "Credential URL", url: "https://user:pass@example.org/private", snippet: "Unsafe", date: null, lastUpdated: null },
          ] } }],
        };
      }
      const doc = () => tools.searchUploadedEvidence.execute({ query: "stockout target", maxResults: 5, relevanceThreshold: 0.62 });
      const web = () => tools.searchWeb.execute({ query: "current Malaysia retail stockout benchmarks 2026", recency: "year" });
      if (order === "document-first") { await doc(); await web(); } else { await web(); await doc(); }
      return completed("The private target is 17 percent; the current public benchmark is shown separately in Sources.");
    });

    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: `phase3r-mixed-${order}`,
      request: { message: "Compare the uploaded stockout target with current Malaysia retail stockout benchmarks for 2026.", idempotencyKey: `phase3r-${order}` },
    });

    expect(result.toolCalls.map((item) => item.toolName)).toEqual(order === "document-first" ? ["searchUploadedEvidence", "searchWeb"] : ["searchWeb", "searchUploadedEvidence"]);
    expect(result.toolCalls.find((item) => item.toolName === "searchWeb")?.result).toMatchObject({
      answerable: true,
      query: "current malaysia retail stockout benchmarks 2026",
      sources: [{ url: "https://example.org/benchmark", lastUpdated: "2026-09-23" }],
    });
    expect(JSON.stringify(result.toolCalls.find((item) => item.toolName === "searchWeb")?.result)).not.toContain("javascript:");
    expect(nestedPrompts).toEqual(["Public query: current malaysia retail stockout benchmarks 2026"]);
    expect(nestedPrompts[0]).not.toContain("Amina");
    const toolParts = repository.messages.filter((item) => item.role === "tool").flatMap((item) => item.parts ?? []);
    expect(toolParts.map((part) => part.type)).toEqual(expect.arrayContaining(["source-document", "source-url"]));
    expect(repository.messages.at(-1)?.parts).toEqual([{ type: "text", text: result.text }]);
  });

  it("rejects a private-only web query without invoking the provider", async () => {
    const repository = new Phase3rRepository();
    generateMock.mockImplementation(async (options: unknown) => {
      const tools = (options as { tools: Record<string, { execute: (value: Record<string, unknown>) => Promise<Record<string, unknown>> }> }).tools;
      const rejected = await tools.searchWeb.execute({ query: '"Amina secret margin 43127"' });
      expect(rejected).toMatchObject({ answerable: false, reason: "UNSAFE_WEB_QUERY", query: null, sources: [] });
      return completed("I cannot safely form a public search from only that private-looking phrase. Please name a public topic.");
    });

    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-private-query",
      request: { message: 'Search the web for "Amina secret margin 43127".', idempotencyKey: "phase3r-private-only" },
    });

    expect(result.toolCalls).toMatchObject([{ toolName: "searchWeb", status: "rejected", result: { reason: "UNSAFE_WEB_QUERY" } }]);
    expect(perplexitySearchMock).not.toHaveBeenCalled();
  });

  it("preserves public company questions while rejecting explicitly private text", () => {
    const publicQuestion = "What is company Apple doing today?";
    expect(derivePublicWebQuery(publicQuestion, publicQuestion)).toBe("what is company apple doing today");
    expect(isPublicWebQuerySafe("what is company apple doing today", publicQuestion)).toBe(true);
    expect(derivePublicWebQuery("AB apple today", publicQuestion)).toBe("apple today");

    expect(() => derivePublicWebQuery(
      "our customer's secret margin 43127",
      "Search the web for our customer's secret margin 43127.",
    )).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("customer Acme", "Search the web for customer Acme.")).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("customer relationship Acme", "Search the web for customer relationship Acme.")).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("customer relationship Acme, Inc", "Search the web for customer relationship Acme, Inc.")).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("customer service Acme", "Search the web for customer service Acme.")).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("Acme today", "Search web for Acme, my customer.")).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("Acme today", "Search web for confidential company Acme.")).toThrowError(PersistenceError);
    expect(() => derivePublicWebQuery("Acme client benchmark", "Search web for Acme client benchmark.")).toThrowError(PersistenceError);
    expect(derivePublicWebQuery("customer relationship management", "Find customer relationship management guidance.")).toBe("customer relationship management");
    expect(derivePublicWebQuery("customer service trends", "What are current customer service trends?")).toBe("customer service trends");
    expect(derivePublicWebQuery("current customer service trends", "Find current customer service trends.")).toBe("current customer service trends");
  });

  it.each([
    "Search web for Acme, my customer.",
    "Search web for confidential company Acme.",
    "Search web for Acme client benchmark.",
  ])("rejects a name-first private web request before invoking the provider: %s", async (message) => {
    const repository = new Phase3rRepository();
    generateMock.mockImplementation(async (options: unknown) => {
      const tools = (options as { tools: Record<string, { execute: (value: Record<string, unknown>) => Promise<Record<string, unknown>> }> }).tools;
      const rejected = await tools.searchWeb.execute({ query: "Acme today" });
      expect(rejected).toMatchObject({ answerable: false, reason: "UNSAFE_WEB_QUERY", query: null, sources: [] });
      return completed("I cannot safely form a public search query from that private context.");
    });
    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-name-first-private",
      request: { message, idempotencyKey: `phase3r-name-first-${message.length}` },
    });
    expect(result.toolCalls).toMatchObject([{ toolName: "searchWeb", status: "rejected", result: { reason: "UNSAFE_WEB_QUERY" } }]);
    expect(perplexitySearchMock).not.toHaveBeenCalled();
  });

  it("honors explicit tool and private-document exclusions", async () => {
    const repository = new Phase3rRepository();
    generateMock.mockImplementation(async (options: unknown) => {
      const configured = options as { prepareStep: (value: unknown) => { activeTools?: string[]; toolChoice?: unknown } | undefined };
      const initial = configured.prepareStep({ steps: [] });
      expect(initial).toMatchObject({ activeTools: [], toolChoice: "none" });
      return completed("A webhook is an HTTP callback.");
    });
    await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-no-tools",
      request: { message: "Explain a webhook simply. Do not use tools.", idempotencyKey: "phase3r-no-tools-turn" },
    });

    generateMock.mockImplementation(async (options: unknown) => {
      const configured = options as { prepareStep: (value: unknown) => { activeTools?: string[]; toolChoice?: { toolName: string } } | undefined };
      const initial = configured.prepareStep({ steps: [] });
      expect(initial?.toolChoice?.toolName).toBe("searchWeb");
      expect(initial?.activeTools).not.toContain("searchUploadedEvidence");
      expect(initial?.activeTools).not.toContain("getDocumentExcerpt");
      return completed("I need current public sources for today's activity.");
    });
    await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-no-documents",
      request: { message: "What is company Apple doing today? Search the public web. Do not use private documents.", idempotencyKey: "phase3r-no-documents-turn" },
    });

    generateMock.mockImplementation(async (options: unknown) => {
      const configured = options as { prepareStep: (value: unknown) => { activeTools?: string[]; toolChoice?: unknown } | undefined };
      const initial = configured.prepareStep({ steps: [] });
      expect(initial?.activeTools).not.toContain("searchWeb");
      expect(initial?.toolChoice).toBeUndefined();
      return completed("I can answer from general knowledge without current sources.");
    });
    await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-no-web",
      request: { message: "Explain Apple in general terms, but do not search the web.", idempotencyKey: "phase3r-no-web-turn" },
    });
  });

  it("uses one authorized Blueprint read for a brief overview without blocking mixed evidence questions", async () => {
    const repository = new Phase3rRepository();
    const blueprint = stage05CaseA().blueprint;
    repository.invokeReadTool.mockResolvedValueOnce({ blueprint: { id: blueprint.id, payload: blueprint } });
    generateMock.mockImplementationOnce(async (options: unknown, input: unknown) => {
      const configured = options as { prepareStep: (value: unknown) => { activeTools?: string[]; toolChoice?: { toolName: string } | string } | undefined };
      expect(configured.prepareStep({ steps: [] })).toMatchObject({ activeTools: [], toolChoice: "none" });
      expect(configured.prepareStep({ steps: [{ toolCalls: [{ toolName: "getBlueprint" }] }] })).toMatchObject({ activeTools: [], toolChoice: "none" });
      expect((input as { prompt: string }).prompt).toContain("AUTHORIZED_BLUEPRINT_READ");
      expect((input as { prompt: string }).prompt).toContain(blueprint.snapshot.recommendations.recommendations[0].evidenceIds[0]);
      return completed("The Blueprint's selected path is Balanced Growth.");
    });
    await executeCopilotTurn({ owner, sessionId: session.id, repository, clientKey: "phase3r-blueprint-overview", request: { message: "Give me a brief summary of my Blueprint.", idempotencyKey: "phase3r-blueprint-overview" } });
    expect(repository.invokeReadTool).toHaveBeenCalledOnce();
    expect(repository.invokeReadTool).toHaveBeenCalledWith(owner, session, "getBlueprint", {});

    generateMock.mockImplementationOnce(async (options: unknown) => {
      const configured = options as { prepareStep: (value: unknown) => { activeTools?: string[]; toolChoice?: { toolName: string } | string } | undefined };
      const first = configured.prepareStep({ steps: [] });
      expect(first?.activeTools).not.toEqual(["getBlueprint"]);
      if (first?.activeTools) expect(first.activeTools).toContain("searchUploadedEvidence");
      return completed("I can compare the authorized Blueprint with the uploaded document.");
    });
    await executeCopilotTurn({ owner, sessionId: session.id, repository, clientKey: "phase3r-blueprint-doc-mix", request: { message: "Summarize my Blueprint and compare it with my uploaded document.", idempotencyKey: "phase3r-blueprint-doc-mix" } });
  });

  it("plans both tools for a natural uploaded-plan and current-benchmark request", async () => {
    const repository = new Phase3rRepository();
    generateMock.mockImplementation(async (options: unknown) => {
      const configured = options as {
        tools: Record<string, { execute: (value: Record<string, unknown>) => Promise<unknown> }>;
        prepareStep: (value: unknown) => { toolChoice?: { toolName: string }; activeTools?: string[] } | undefined;
      };
      if (configured.tools.providerSearch) return {
        ...completed(""),
        toolResults: [{ toolName: "providerSearch", output: { results: [{ title: "Public benchmark", url: "https://example.org/benchmark", snippet: "Public stockout benchmark", date: "2026-09-22" }] } }],
      };
      expect(configured.prepareStep({ steps: [] })?.toolChoice?.toolName).toBe("searchWeb");
      await configured.tools.searchWeb.execute({ query: "current public stockout benchmark" });
      const afterWeb = configured.prepareStep({ steps: [{ toolCalls: [{ toolName: "searchWeb" }] }] });
      expect(afterWeb?.toolChoice?.toolName).toBe("searchUploadedEvidence");
      expect(afterWeb?.activeTools).not.toContain("searchWeb");
      await configured.tools.searchUploadedEvidence.execute({ query: "uploaded stockout plan", maxResults: 5, relevanceThreshold: 0.62 });
      expect(configured.prepareStep({ steps: [{ toolCalls: [{ toolName: "searchWeb" }] }, { toolCalls: [{ toolName: "searchUploadedEvidence" }] }] })?.activeTools).not.toContain("searchWeb");
      return completed("The uploaded plan and public benchmark are shown separately.");
    });

    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-natural-mixed",
      request: { message: "Compare the uploaded stockout plan with a current public stockout benchmark.", idempotencyKey: "phase3r-natural-mixed-turn" },
    });
    expect(result.toolCalls.map((call) => call.toolName)).toEqual(["searchWeb", "searchUploadedEvidence"]);
    expect(result.toolCalls[0].result).toMatchObject({ answerable: true, query: "current public stockout benchmark" });
  });

  it("retries a missing provider search tool call once without private context", async () => {
    const repository = new Phase3rRepository();
    let providerAttempts = 0;
    generateMock.mockImplementation(async (options: unknown, input: unknown) => {
      const configured = options as { tools: Record<string, { execute: (value: Record<string, unknown>) => Promise<unknown> }> };
      if (configured.tools.providerSearch) {
        providerAttempts += 1;
        expect((input as { prompt: string }).prompt).toContain("apple");
        expect((input as { prompt: string }).prompt).not.toContain("Amina");
        if (providerAttempts === 1) throw new ToolChoiceViolationError({
          toolChoice: { type: "tool", toolName: "providerSearch" }, finishReason: "stop",
          provider: "test", modelId: "test/model", content: [],
        });
        return { ...completed(""), toolResults: [{ toolName: "providerSearch", output: { results: [{ title: "Apple public news", url: "https://example.org/apple", snippet: "Public news", date: "2026-09-23" }] } }] };
      }
      await configured.tools.searchWeb.execute({ query: "apple today" });
      return completed("Public sources are available.");
    });
    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-provider-retry",
      request: { message: "What is company Apple doing today?", idempotencyKey: "phase3r-provider-retry-turn" },
    });
    expect(providerAttempts).toBe(2);
    expect(result.toolCalls).toMatchObject([{ toolName: "searchWeb", result: { answerable: true, query: "apple today" } }]);
  });

  it("aborts a partial stream without persisting it as a completed assistant message", async () => {
    const repository = new Phase3rRepository();
    const controller = new AbortController();
    streamMock.mockImplementation(async (_options: unknown, input: unknown) => {
      const signal = (input as { abortSignal: AbortSignal }).abortSignal;
      async function* fullStream() {
        yield { type: "text-delta", text: "Partial response" };
        if (signal.aborted) throw new Error("aborted");
        await new Promise<never>((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
      }
      return { fullStream: fullStream(), text: Promise.resolve("Partial response"), usage: Promise.resolve({ inputTokens: 1, outputTokens: 1 }), finishReason: Promise.resolve("stop"), toolResults: Promise.resolve([]) };
    });

    await expect(executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-cancel",
      request: { message: "Start a long explanation.", idempotencyKey: "phase3r-cancel-turn" }, signal: controller.signal,
      onEvent: (event) => { if (event.type === "text_delta") controller.abort(); },
    })).rejects.toMatchObject({ code: "AI_TIMEOUT", retryable: true });

    expect(repository.messages.map((item) => item.role)).toEqual(["user"]);
    expect(repository.receipts.get("phase3r-cancel-turn")?.response).toMatchObject({ failed: true, retryable: true });
  });

  it("keeps the recorded top recommendation and its source evidence in a focused Blueprint read", () => {
    const blueprint = stage05CaseA().blueprint;
    const result = focusedBlueprintRead({ blueprint: { id: blueprint.id, payload: blueprint } });
    const excerpt = result.blueprint as Record<string, unknown>;
    const top = excerpt.topRecommendation as Record<string, unknown>;
    const expected = [...blueprint.snapshot.recommendations.recommendations].sort((a, b) => a.rank - b.rank)[0];
    expect(top.title).toBe(expected.title);
    expect(top.evidenceIds).toEqual(expected.evidenceIds);
    expect(excerpt.evidence).toEqual(expect.arrayContaining(expected.evidenceIds.map((id) => expect.objectContaining({ id }))));
    expect(JSON.stringify(result)).not.toContain("omittedItems");
  });

  it("rejects provider tool markup instead of showing or saving it as an answer", async () => {
    const repository = new Phase3rRepository();
    const raw = '<｜｜DSML｜｜ calls> <｜｜DSML｜｜ invoke name="searchUploadedEvidence">';
    const deltas: string[] = [];
    streamMock.mockResolvedValue({
      fullStream: (async function* () {
        yield { type: "text-delta", text: "<｜｜DS" };
        yield { type: "text-delta", text: 'ML｜｜ calls> <｜｜DSML｜｜ invoke name="searchUploadedEvidence">' };
      })(),
      text: Promise.resolve(raw), usage: Promise.resolve({ inputTokens: 30, outputTokens: 12 }),
      finishReason: Promise.resolve("stop"), toolResults: Promise.resolve([]),
    });

    await expect(executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-malformed-tool",
      request: { message: "Summarize my Blueprint.", idempotencyKey: "phase3r-malformed-tool-turn" },
      onEvent: (event) => { if (event.type === "text_delta") deltas.push(event.delta); },
    })).rejects.toMatchObject({ code: "AI_INVALID_OUTPUT" });

    expect(deltas).toEqual([]);
    expect(repository.messages.map((item) => item.role)).toEqual(["user"]);
  });

  it("completes a streamed answer that exceeds the saved-message bound without discarding the draft", async () => {
    const repository = new Phase3rRepository();
    const longAnswer = "A".repeat(13_000);
    const deltas: string[] = [];
    streamMock.mockResolvedValue({
      fullStream: (async function* () { yield { type: "text-delta", text: longAnswer }; })(),
      text: Promise.resolve(longAnswer),
      usage: Promise.resolve({ inputTokens: 100, outputTokens: 3_500 }),
      finishReason: Promise.resolve("length"),
      toolResults: Promise.resolve([]),
    });

    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-long-stream",
      request: { message: "Summarize my Blueprint.", idempotencyKey: "phase3r-long-stream-turn" },
      onEvent: (event) => { if (event.type === "text_delta") deltas.push(event.delta); },
    });

    expect(result.text.length).toBeLessThanOrEqual(12_000);
    expect(result.text).toMatch(/incomplete/i);
    expect(repository.messages.at(-1)).toMatchObject({ role: "assistant", text: result.text });
    expect(repository.receipts.get("phase3r-long-stream-turn")?.response).toMatchObject({ text: result.text });
    expect(deltas.join("").length).toBeLessThanOrEqual(12_000);
  });

  it("continues a length-limited answer once without repeating retrieval or claiming completion early", async () => {
    const repository = new Phase3rRepository();
    generateMock
      .mockResolvedValueOnce({ text: "The first supported finding is clear.", usage: { inputTokens: 100, outputTokens: 1500 }, finishReason: "length", toolResults: [] })
      .mockResolvedValueOnce({ text: "The next supported step is to review the owner and timeline.", usage: { inputTokens: 120, outputTokens: 30 }, finishReason: "stop", toolResults: [] });

    const result = await executeCopilotTurn({
      owner, sessionId: session.id, repository, clientKey: "phase3r-continue-once",
      request: { message: "Explain my Blueprint in detail.", idempotencyKey: "phase3r-continue-once" },
    });

    expect(result.text).toContain("The first supported finding is clear.");
    expect(result.text).toContain("The next supported step is to review the owner and timeline.");
    expect(result.text).not.toContain("This answer is incomplete");
    expect(generateMock).toHaveBeenCalledTimes(2);
    expect(repository.invokeReadTool).toHaveBeenCalledOnce();
    expect(repository.messages.filter((item) => item.role === "assistant")).toHaveLength(1);
  });

  it("replays an already saved assistant turn when only its result receipt failed", async () => {
    const repository = new Phase3rRepository();
    let failResultReceipt = true;
    repository.rememberTurn.mockImplementation(async (_owner, _sessionId, key, turnId, response) => {
      if (key === "phase3r-receipt-recovery" && failResultReceipt) {
        failResultReceipt = false;
        throw new PersistenceError("INTERNAL_RETRYABLE", 503);
      }
      repository.receipts.set(key, { turnId, response });
    });
    generateMock.mockResolvedValue(completed("The authorized Blueprint is ready."));
    const request = { message: "Summarize my Blueprint.", idempotencyKey: "phase3r-receipt-recovery" };

    await expect(executeCopilotTurn({ owner, sessionId: session.id, repository, clientKey: "phase3r-receipt-recovery", request })).rejects.toMatchObject({ code: "INTERNAL_RETRYABLE" });
    const savedAssistant = repository.messages.find((item) => item.role === "assistant");
    expect(savedAssistant?.text).toBe("The authorized Blueprint is ready.");
    repository.savedHistory = [{
      id: uuid(50), chatSessionId: session.id, sequence: 2, turnId: savedAssistant!.turnId,
      role: "assistant", text: savedAssistant!.text, toolName: null, toolCallId: null,
      toolPayload: null, modelCallId: uuid(51), executionState: "live", parts: [{ type: "text", text: savedAssistant!.text! }],
      schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-24T00:00:00.000Z",
    }];

    const retried = await executeCopilotTurn({ owner, sessionId: session.id, repository, clientKey: "phase3r-receipt-recovery", request });
    expect(retried.text).toBe(savedAssistant!.text);
    expect(generateMock).toHaveBeenCalledTimes(1);
    expect(repository.messages.filter((item) => item.role === "assistant")).toHaveLength(1);
  });

  it("enforces credential-free HTTP(S) sources and public-query derivation", () => {
    expect(isSafePublicSourceUrl("https://example.org/source")).toBe(true);
    expect(isSafePublicSourceUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePublicSourceUrl("https://user:pass@example.org/source")).toBe(false);
    expect(() => copilotMessagePartSchema.parse({ type: "source-url", url: "javascript:alert(1)", title: "bad", snippet: "", date: null, lastUpdated: null })).toThrow();
    expect(derivePublicWebQuery("latest Malaysia CRM benchmarks 2026 private-margin-778899", 'Compare latest Malaysia CRM benchmarks for 2026 with "private margin 778899".')).toBe("latest malaysia crm benchmarks 2026");
    expect(isPublicWebQuerySafe("latest malaysia crm benchmarks 2026", "Show latest Malaysia CRM benchmarks 2026")).toBe(true);
  });

  it("restores persisted rejected-tool state instead of presenting it as completed", () => {
    const turnId = uuid(30);
    const messages: CopilotMessage[] = [
      {
        id: uuid(31), chatSessionId: session.id, sequence: 1, turnId, role: "tool", text: null, toolName: "searchWeb", toolCallId: "web:1",
        toolPayload: { answerable: false, reason: "UNSAFE_WEB_QUERY" }, modelCallId: uuid(32), executionState: "live",
        parts: [{ type: "tool-status", toolName: "searchWeb", state: "rejected" }], schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-23T00:00:00.000Z",
      },
      {
        id: uuid(33), chatSessionId: session.id, sequence: 2, turnId, role: "assistant", text: "Please name a public topic.", toolName: null, toolCallId: null,
        toolPayload: null, modelCallId: uuid(32), executionState: "live", parts: [{ type: "text", text: "Please name a public topic." }],
        schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-23T00:00:01.000Z",
      },
    ];
    expect(restoreCopilotMessages(messages)[0].tools?.[0]).toMatchObject({ toolName: "searchWeb", status: "rejected" });
  });

  it("hides a malformed historical answer and excludes it from later model context", async () => {
    const repository = new Phase3rRepository();
    const malformed = '<｜｜DSML｜｜ calls> <｜｜DSML｜｜ invoke name="searchUploadedEvidence">';
    const prior: CopilotMessage = {
      id: uuid(60), chatSessionId: session.id, sequence: 1, turnId: uuid(61), role: "assistant", text: malformed,
      toolName: null, toolCallId: null, toolPayload: null, modelCallId: uuid(62), executionState: "live",
      schemaVersion: "phase-g-copilot-1.0.0", createdAt: "2026-09-23T00:00:00.000Z",
    };
    repository.savedHistory = [prior];
    expect(restoreCopilotMessages([prior])[0].text).toContain("could not be displayed safely");
    generateMock.mockImplementation(async (_options: unknown, input: unknown) => {
      expect((input as { prompt: string }).prompt).not.toContain("DSML");
      return completed("Here is a fresh answer.");
    });
    await executeCopilotTurn({ owner, sessionId: session.id, repository, clientKey: "phase3r-historical-malformed", request: { message: "Explain the plan again.", idempotencyKey: "phase3r-historical-malformed" } });
  });

  it("never renders Markdown images that could auto-fetch attacker URLs", () => {
    const html = renderToStaticMarkup(createElement(Markdown, null, "Safe text ![tracking pixel](https://attacker.invalid/private-beacon)"));
    expect(html).toContain("Safe text");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("attacker.invalid");
  });
});
