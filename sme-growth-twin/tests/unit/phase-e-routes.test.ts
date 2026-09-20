import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ resolveOwner: vi.fn(), signedDownload: vi.fn(), acceptDraft: vi.fn() }));
vi.mock("@/infrastructure/persistence/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/infrastructure/persistence/api")>();
  return { ...original, resolveOwner: mocks.resolveOwner, correlationId: () => "request_phase_e", response: (body: unknown, status: number) => Response.json(body, { status }) };
});
vi.mock("@/infrastructure/reports/supabase-report-repository", () => ({ SupabaseReportRepository: class {} }));
vi.mock("@/infrastructure/reports/report-service", () => ({ ReportService: class { signedDownload(...args: unknown[]) { return mocks.signedDownload(...args); } } }));
vi.mock("@/infrastructure/consultant-notes/supabase-consultant-note-repository", () => ({ SupabaseConsultantNoteRepository: class { acceptDraft(...args: unknown[]) { return mocks.acceptDraft(...args); } } }));

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("Phase E route authorization", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.resolveOwner.mockResolvedValue({ kind: "organization", organizationId: uuid(1), userId: uuid(2), role: "consultant" }); });

  it("does not mint a signed URL when a revoked guest cannot resolve", async () => {
    const { PersistenceError } = await import("@/domain/persistence");
    mocks.resolveOwner.mockRejectedValueOnce(new PersistenceError("UNAUTHENTICATED", 401));
    const { GET } = await import("@/app/api/v2/reports/[id]/download/route");
    const result = await GET(new Request(`http://localhost/api/v2/reports/${uuid(3)}/download`), { params: Promise.resolve({ id: uuid(3) }) });
    expect(result.status).toBe(401);
    expect(mocks.signedDownload).not.toHaveBeenCalled();
  });

  it("creates acceptance as a new human revision through the repository boundary", async () => {
    mocks.acceptDraft.mockResolvedValue({ id: uuid(7), origin: "human", status: "accepted", sourceDraftId: uuid(6) });
    const { POST } = await import("@/app/api/v2/consultant-notes/accept/route");
    const body = { organizationId: uuid(1), assessmentSessionId: uuid(4), draftNoteId: uuid(6), body: "Human-reviewed next-step guidance.", requestId: "request-accept-0001" };
    const result = await POST(new Request("http://localhost/api/v2/consultant-notes/accept", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    expect(result.status).toBe(201);
    expect(mocks.acceptDraft).toHaveBeenCalledWith(expect.objectContaining({ role: "consultant" }), body);
  });
});
