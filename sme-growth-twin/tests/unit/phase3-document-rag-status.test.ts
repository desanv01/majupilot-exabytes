import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  hasGatewayCredential: vi.fn(),
  executionMode: vi.fn(),
  operationPolicy: vi.fn(),
  preflightModel: vi.fn(),
}));

vi.mock("@/infrastructure/model-provider/ai-execution-policy", () => ({
  hasGatewayCredential: mocks.hasGatewayCredential,
  executionMode: mocks.executionMode,
  operationPolicy: mocks.operationPolicy,
}));
vi.mock("@/infrastructure/model-provider/gateway-catalogue", () => ({ preflightModel: mocks.preflightModel }));
vi.mock("@/infrastructure/outbox/outbox-worker", () => ({ outboxConfigurationStatus: () => ({ configured: true }) }));
vi.mock("@/infrastructure/persistence/api", () => ({
  correlationId: () => "request_document_rag_status",
  response: (body: unknown, status: number) => Response.json(body, { status }),
}));

describe("Document RAG status reporting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasGatewayCredential.mockReturnValue(false);
    mocks.executionMode.mockReturnValue("disabled");
    mocks.operationPolicy.mockReturnValue({ model: null });
  });

  it("reports implemented capability without claiming live embeddings when Gateway has no credential", async () => {
    const { GET: integrationStatus } = await import("@/app/api/v2/integration/status/route");
    const { GET: copilotStatus } = await import("@/app/api/v2/copilot/status/route");
    const integration = await integrationStatus(new Request("http://localhost/api/v2/integration/status"));
    const copilot = await copilotStatus(new Request("http://localhost/api/v2/copilot/status?detail=safe"));
    const integrationData = (await integration.json()).data;
    const copilotData = (await copilot.json()).data;
    expect(integrationData.capabilities).toContain("evidence_document_rag");
    expect(integrationData.documentRag).toEqual({ capability: "implemented", embeddingGatewayCredentialPresent: false, liveEmbeddingCheck: "not_performed" });
    expect(copilotData).toMatchObject({ state: "ai_disabled", liveAvailable: false, documentRag: integrationData.documentRag });
    expect(mocks.preflightModel).not.toHaveBeenCalled();
  });

  it("keeps embedding reachability unverified when Copilot model preflight fails", async () => {
    mocks.hasGatewayCredential.mockReturnValue(true);
    mocks.executionMode.mockReturnValue("required");
    mocks.operationPolicy.mockReturnValue({ model: "configured-model" });
    mocks.preflightModel.mockRejectedValue(new Error("Gateway unavailable"));
    const { GET } = await import("@/app/api/v2/copilot/status/route");
    const result = await GET(new Request("http://localhost/api/v2/copilot/status?detail=safe"));
    expect(result.status).toBe(503);
    expect((await result.json()).data).toMatchObject({
      state: "failed", liveAvailable: false,
      documentRag: { capability: "implemented", embeddingGatewayCredentialPresent: true, liveEmbeddingCheck: "not_performed" },
    });
  });
});
