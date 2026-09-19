import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ resolveOwner: vi.fn(), assertAssessmentAccess: vi.fn(), assertEvidenceReferences: vi.fn(), runRecommendationExplanation: vi.fn() }));
vi.mock("@/infrastructure/persistence/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/infrastructure/persistence/api")>();
  return { ...original, resolveOwner: mocks.resolveOwner, repository: () => ({ assertAssessmentAccess: mocks.assertAssessmentAccess, assertEvidenceReferences: mocks.assertEvidenceReferences }), correlationId: () => "request_phase_d", response: (body: unknown, status: number) => Response.json(body, { status }) };
});
vi.mock("@/infrastructure/model-provider/recommendation-explanation-model", () => ({ runRecommendationExplanation: mocks.runRecommendationExplanation }));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const valid = { assessmentSessionId: uuid(1), recommendationRunId: uuid(2), capabilityId: "shared_customer_operations", evidenceRefs: [uuid(3)] };

describe("Phase D recommendation explanation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveOwner.mockResolvedValue({ kind: "guest", guestSessionId: uuid(4) });
    mocks.runRecommendationExplanation.mockResolvedValue({ state: "ai_disabled", explanation: null });
  });

  it("performs ownership and same-assessment evidence checks before model dispatch", async () => {
    const { POST } = await import("@/app/api/v2/recommendations/explanation/route");
    const response = await POST(new Request("http://localhost/api/v2/recommendations/explanation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(valid) }));
    expect(response.status).toBe(200);
    expect(mocks.assertAssessmentAccess).toHaveBeenCalledWith({ kind: "guest", guestSessionId: uuid(4) }, uuid(1));
    expect(mocks.assertEvidenceReferences).toHaveBeenCalledWith({ kind: "guest", guestSessionId: uuid(4) }, uuid(1), [uuid(3)]);
    expect(mocks.assertEvidenceReferences.mock.invocationCallOrder[0]).toBeLessThan(mocks.runRecommendationExplanation.mock.invocationCallOrder[0]);
  });

  it("rejects malformed and cross-session references before model dispatch", async () => {
    const { POST } = await import("@/app/api/v2/recommendations/explanation/route");
    const malformed = await POST(new Request("http://localhost/api/v2/recommendations/explanation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...valid, recommendationRunId: "not-a-uuid" }) }));
    expect(malformed.status).toBe(422);
    const { PersistenceError } = await import("@/domain/persistence");
    mocks.assertEvidenceReferences.mockRejectedValueOnce(new PersistenceError("NOT_FOUND", 404));
    const denied = await POST(new Request("http://localhost/api/v2/recommendations/explanation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(valid) }));
    expect(denied.status).toBe(404);
    expect(mocks.runRecommendationExplanation).not.toHaveBeenCalled();
  });
});
