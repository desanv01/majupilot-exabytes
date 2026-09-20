import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ resolveOwner: vi.fn(), create: vi.fn() }));
vi.mock("@/infrastructure/persistence/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/infrastructure/persistence/api")>();
  return { ...original, resolveOwner: mocks.resolveOwner, correlationId: () => "request_phase_f", response: (body: unknown, status: number) => Response.json(body, { status }) };
});
vi.mock("@/infrastructure/leads/supabase-durable-lead-repository", () => ({ SupabaseDurableLeadRepository: class {} }));
vi.mock("@/infrastructure/leads/durable-lead-service", () => ({ DurableLeadService: class { create(...args: unknown[]) { return mocks.create(...args); } } }));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const body = {
  assessmentSessionId: uuid(1), blueprintId: uuid(2), blueprintRevision: 1, reportArtifactId: uuid(3), reportContentSha256: "a".repeat(64),
  contactConsentId: uuid(4), reportConsentId: uuid(5), idempotencyKey: "phase-f-route-0001",
  contact: { name: "Owner User", businessName: "Owner SME", email: "owner@example.invalid", urgency: "within_30_days" },
};

describe("Phase F lead routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveOwner.mockResolvedValue({ kind: "guest", guestSessionId: uuid(9) });
  });

  it("returns a durable 202 receipt when no salesperson is eligible", async () => {
    mocks.create.mockResolvedValue({ receiptId: uuid(6), leadId: uuid(7), status: "new", assignmentState: "unassigned", assignmentKey: "unassigned", replayed: false });
    const { POST } = await import("@/app/api/v2/leads/route");
    const result = await POST(new Request("http://localhost/api/v2/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    expect(result.status).toBe(202);
    expect(await result.json()).toMatchObject({ data: { assignmentState: "unassigned", assignmentKey: "unassigned" } });
  });

  it("returns 200 for an idempotent replay instead of creating a second resource", async () => {
    mocks.create.mockResolvedValue({ receiptId: uuid(6), leadId: uuid(7), status: "assigned", assignmentState: "assigned", assignmentKey: "demo_sales_aina", replayed: true });
    const { POST } = await import("@/app/api/v2/leads/route");
    const result = await POST(new Request("http://localhost/api/v2/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    expect(result.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
