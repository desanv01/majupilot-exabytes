import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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
  isPublicWebQuerySafe,
  isSafePublicSourceUrl,
} from "@/infrastructure/copilot/copilot-model";
import type { AppendCopilotMessage, CopilotConfirmation, CopilotRepository } from "@/infrastructure/copilot/copilot-repository";
import { restoreCopilotMessages } from "@/components/copilot/copilot-client-utils";
import { Markdown } from "@/components/copilot/copilot-client";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

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
      const tools = (options as { tools: Record<string, unknown> }).tools;
      expect(Object.keys(tools)).toEqual(expect.arrayContaining(["searchUploadedEvidence", "searchWeb", "getBlueprint", "requestConsultation"]));
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

  it("never renders Markdown images that could auto-fetch attacker URLs", () => {
    const html = renderToStaticMarkup(createElement(Markdown, null, "Safe text ![tracking pixel](https://attacker.invalid/private-beacon)"));
    expect(html).toContain("Safe text");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("attacker.invalid");
  });
});
