import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { DurableLeadService } from "@/infrastructure/leads/durable-lead-service";
import type { DurableLeadRepository } from "@/infrastructure/leads/durable-lead-repository";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const owner = { kind: "organization" as const, organizationId: uuid(1), userId: uuid(2), role: "prospect" as const };
const request = {
  organizationId: uuid(1), assessmentSessionId: uuid(3), blueprintId: uuid(4), blueprintRevision: 2,
  reportArtifactId: uuid(5), reportContentSha256: "a".repeat(64), contactConsentId: uuid(6), reportConsentId: uuid(7),
  idempotencyKey: "phase-f-request-0001",
  contact: { name: "Ada Owner", businessName: "Ada Foods", email: "ada@example.invalid", urgency: "within_30_days" as const },
  region: "Central", preferredLanguage: "English",
};

describe("Phase F durable lead service", () => {
  const repository = {
    loadCreateContext: vi.fn(), create: vi.fn(), list: vi.fn(), detail: vi.fn(), assignment: vi.fn(), events: vi.fn(),
  } as unknown as DurableLeadRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.loadCreateContext).mockResolvedValue({ capabilityTags: ["productivity", "crm"] });
    vi.mocked(repository.create).mockResolvedValue({ receiptId: uuid(8), leadId: uuid(9), status: "assigned", assignmentState: "assigned", assignmentKey: "demo_sales_aina", replayed: false });
  });

  it("binds the request and server-derived capability inputs to a deterministic request hash", async () => {
    const service = new DurableLeadService(repository);
    const receipt = await service.create(owner, request, "request-phase-f", "correlation-phase-f");
    expect(receipt.assignmentKey).toBe("demo_sales_aina");
    expect(repository.create).toHaveBeenCalledWith(owner, request, expect.stringMatching(/^[a-f0-9]{64}$/), "request-phase-f", "correlation-phase-f", { capabilityTags: ["productivity", "crm"] });
    const firstHash = vi.mocked(repository.create).mock.calls[0][2];
    await service.create(owner, request, "request-phase-f-replay", "correlation-phase-f-replay");
    expect(vi.mocked(repository.create).mock.calls[1][2]).toBe(firstHash);
  });

  it("rejects malformed report hashes and contacts before persistence", async () => {
    const service = new DurableLeadService(repository);
    await expect(service.create(owner, { ...request, reportContentSha256: "not-a-hash" }, "request-bad", "correlation-bad")).rejects.toThrow();
    expect(repository.loadCreateContext).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
