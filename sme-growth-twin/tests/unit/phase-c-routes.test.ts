import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  resolveOwner: vi.fn(),
  assertAssessmentAccess: vi.fn(),
  assertEvidenceReferences: vi.fn(),
  countDeliveredFollowUps: vi.fn(),
  runDynamicFollowUp: vi.fn(),
}));

vi.mock("@/infrastructure/persistence/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/infrastructure/persistence/api")>();
  return { ...original, resolveOwner: mocks.resolveOwner, repository: () => ({ assertAssessmentAccess: mocks.assertAssessmentAccess, assertEvidenceReferences: mocks.assertEvidenceReferences, countDeliveredFollowUps: mocks.countDeliveredFollowUps }), correlationId: () => "request_test123", response: (body: unknown, status: number) => Response.json(body, { status }) };
});
vi.mock("@/infrastructure/model-provider/follow-up-model", () => ({ runDynamicFollowUp: mocks.runDynamicFollowUp }));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const valid = {
  assessmentSessionId: uuid(1),
  answers: {
    q1: { businessName: "Example", industry: "professional_services", businessModel: "b2b", employeeBand: "10_24", description: "A bounded synthetic test business." },
    q2: { websiteOrStore: "informal", businessEmail: "active", cloudProductivity: "active", crm: "active", digitalMarketingAnalytics: "informal", backup: "active", cybersecurityControls: "informal", aiTools: "not_used" },
    q3: { biggestChallenge: "manual_work", manualWorkflow: "A manual internal workflow", manualHoursPerWeek: null, affectedEmployees: 3, urgency: 4 },
    q4: { primaryObjective: "reduce_cost", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
    q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 4, processConsistency: 4, changeWillingness: 4 },
  },
  answeredIntents: [], evidenceRefs: [],
};

describe("Phase C follow-up route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveOwner.mockResolvedValue({ kind: "guest", guestSessionId: uuid(2) });
    mocks.countDeliveredFollowUps.mockResolvedValue(0);
    mocks.runDynamicFollowUp.mockResolvedValue({ state: "complete", proposal: null, requiresConfirmation: true });
  });

  it("rejects malformed structured input before ownership/provider work", async () => {
    const { POST } = await import("@/app/api/v2/assessment/follow-up/route");
    const result = await POST(new Request("http://localhost/api/v2/assessment/follow-up", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...valid, evidenceRefs: ["not-a-uuid"] }) }));
    expect(result.status).toBe(422); expect(mocks.resolveOwner).not.toHaveBeenCalled(); expect(mocks.runDynamicFollowUp).not.toHaveBeenCalled();
  });

  it("checks assessment ownership before dispatching the bounded model operation", async () => {
    const { POST } = await import("@/app/api/v2/assessment/follow-up/route");
    const result = await POST(new Request("http://localhost/api/v2/assessment/follow-up", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(valid) }));
    expect(result.status).toBe(200);
    expect(mocks.assertAssessmentAccess).toHaveBeenCalledWith({ kind: "guest", guestSessionId: uuid(2) }, uuid(1));
    expect(mocks.assertEvidenceReferences).toHaveBeenCalledWith({ kind: "guest", guestSessionId: uuid(2) }, uuid(1), []);
    expect(mocks.assertAssessmentAccess.mock.invocationCallOrder[0]).toBeLessThan(mocks.runDynamicFollowUp.mock.invocationCallOrder[0]);
  });

  it("rejects unknown or cross-session evidence before count or provider dispatch", async () => {
    const { PersistenceError } = await import("@/domain/persistence");
    mocks.assertEvidenceReferences.mockRejectedValueOnce(new PersistenceError("NOT_FOUND", 404));
    const { POST } = await import("@/app/api/v2/assessment/follow-up/route");
    const body = { ...valid, evidenceRefs: [uuid(9)] };
    const result = await POST(new Request("http://localhost/api/v2/assessment/follow-up", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    expect(result.status).toBe(404); expect(await result.json()).toEqual({ error: { code: "NOT_FOUND", requestId: "request_test123" } });
    expect(mocks.countDeliveredFollowUps).not.toHaveBeenCalled(); expect(mocks.runDynamicFollowUp).not.toHaveBeenCalled();
  });
});
