import { beforeEach, describe, expect, it, vi } from "vitest";

import { createGoldenAssessmentDraft, goldenFixtureById } from "@/domain-packs/exabytes/golden-fixtures";
import { accountCaseResumePath } from "@/infrastructure/persistence/account-case-client";
import type { AccountCaseSnapshot } from "@/domain/account-cases";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  resolveOwner: vi.fn(),
  getUser: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  ensurePersonalWorkspace: vi.fn(),
}));

vi.mock("@/infrastructure/persistence/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/infrastructure/persistence/api")>();
  return { ...original, resolveOwner: mocks.resolveOwner, correlationId: () => "request_account_cases", response: (body: unknown, status: number) => Response.json(body, { status }) };
});
vi.mock("@/infrastructure/supabase/server", () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/infrastructure/persistence/account-case-repository", () => ({
  AccountCaseRepository: class {
    get = mocks.get;
    list = mocks.list;
    create = mocks.create;
    save = mocks.save;
    ensurePersonalWorkspace = mocks.ensurePersonalWorkspace;
  },
}));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const organizationId = uuid(1);
const caseId = uuid(2);
const owner = { kind: "organization", organizationId, userId: uuid(3), role: "prospect" } as const;
const draft = createGoldenAssessmentDraft(goldenFixtureById("case-a"), "assessment_accountcases00001", "2026-09-24T01:00:00.000Z");
const snapshot = { schemaVersion: "1.0.0", draft, durableJourney: { schemaVersion: "1.0.0", organizationId, assessmentSessionId: caseId, leadIdempotencyKey: `lead:${uuid(4)}` } };

describe("Phase 3R account-case authority routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveOwner.mockResolvedValue(owner);
    mocks.getUser.mockResolvedValue({ data: { user: { id: owner.userId } }, error: null });
    mocks.get.mockResolvedValue({ id: caseId, revision: 1, snapshot });
    mocks.list.mockResolvedValue([]);
    mocks.create.mockResolvedValue({ id: caseId });
    mocks.save.mockResolvedValue({ revision: 2 });
    mocks.ensurePersonalWorkspace.mockResolvedValue(organizationId);
  });

  it("requires a verified account before creating a personal workspace", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { POST } = await import("@/app/api/v2/account/workspace/route");
    const result = await POST(new Request("http://localhost/api/v2/account/workspace", { method: "POST" }));
    expect(result.status).toBe(401);
    expect(mocks.ensurePersonalWorkspace).not.toHaveBeenCalled();
  });

  it("resolves the requested organization before listing or opening cases", async () => {
    const { GET: list } = await import("@/app/api/v2/cases/route");
    const listed = await list(new Request(`http://localhost/api/v2/cases?organizationId=${organizationId}`));
    expect(listed.status).toBe(200);
    expect(mocks.resolveOwner).toHaveBeenCalledWith(expect.any(Request), organizationId);
    expect(mocks.list).toHaveBeenCalledWith(owner);
    const { GET: get } = await import("@/app/api/v2/cases/[id]/route");
    const opened = await get(new Request(`http://localhost/api/v2/cases/${caseId}?organizationId=${organizationId}`), { params: Promise.resolve({ id: caseId }) });
    expect(opened.status).toBe(200);
    expect(mocks.get).toHaveBeenCalledWith(owner, caseId);
  });

  it("rejects a snapshot carrying a different durable case identity before saving", async () => {
    const { PUT } = await import("@/app/api/v2/cases/[id]/route");
    const result = await PUT(new Request(`http://localhost/api/v2/cases/${caseId}`, {
      method: "PUT", headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId, expectedRevision: 1, snapshot: { ...snapshot, durableJourney: { ...snapshot.durableJourney, assessmentSessionId: uuid(9) } } }),
    }), { params: Promise.resolve({ id: caseId }) });
    expect(result.status).toBe(422);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});

describe("Phase 3R saved-stage resume", () => {
  const ready = { ...snapshot, draft: { ...draft, status: "ready_for_review" } } as AccountCaseSnapshot;

  it("resumes the latest saved analysis stage without restarting the assessment", () => {
    expect(accountCaseResumePath(ready)).toBe("/assessment/review");
    expect(accountCaseResumePath({ ...ready, diagnostic: {} as AccountCaseSnapshot["diagnostic"] })).toBe("/results");
    expect(accountCaseResumePath({ ...ready, recommendations: {} as AccountCaseSnapshot["recommendations"] })).toBe("/recommendations");
    expect(accountCaseResumePath({ ...ready, comparison: {} as AccountCaseSnapshot["comparison"] })).toBe("/scenarios");
  });

  it("opens a saved Blueprint and only resumes Copilot when its durable artifact is synced", () => {
    const withBlueprint = { ...ready, blueprint: {} as AccountCaseSnapshot["blueprint"], lastStage: "/copilot" as const };
    expect(accountCaseResumePath(withBlueprint)).toBe("/blueprint");
    expect(accountCaseResumePath({ ...withBlueprint, durableJourney: { ...snapshot.durableJourney, syncedAt: "2026-09-24T01:00:00.000Z", artifactIds: { blueprint: uuid(5) } } as AccountCaseSnapshot["durableJourney"] })).toBe("/copilot");
  });
});
