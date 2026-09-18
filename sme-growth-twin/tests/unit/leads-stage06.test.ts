import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ConsentRequiredError, createLead } from "../../src/core/leads/create-lead";
import type { CreateLeadRequest } from "../../src/domain/leads";
import { EXABYTES_CONSULTATION_POLICY } from "../../src/domain-packs/exabytes/consultation-rules";
import { processLocalLeadStore } from "../../src/infrastructure/leads/process-local-lead-store";
import { leadRateLimiter, ProcessLocalLeadRateLimiter } from "../../src/infrastructure/leads/rate-limit";
import { stage05CaseA } from "./stage05-fixtures";

const ids = { leadId: () => "lead_stage060000000000000001", consentId: () => "consent_stage060000000000001", now: () => "2026-09-18T14:30:00+08:00" };
function request(overrides: Partial<CreateLeadRequest> = {}): CreateLeadRequest {
  return { submissionId: "fd492b2c-190a-49b8-b93b-0cc76beac956", contact: { name: "Aiman Rahman", businessName: "Kopi Kita Café Group", email: "aiman@example.test", phone: "+60 12 345 6789", urgency: "within_30_days" }, consent: { accepted: true, wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, honeypot: "", blueprint: stage05CaseA().blueprint, ...overrides };
}

describe("Stage 06 pure lead creation", () => {
  beforeEach(() => { processLocalLeadStore.resetForTests(); leadRateLimiter.resetForTests(); });

  it("rejects false, missing, and version-mismatched consent before creating a lead", () => {
    for (const consent of [{ accepted: false, wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, { wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, { accepted: true, wordingVersion: "old" }]) {
      expect(() => createLead(request({ consent }), EXABYTES_CONSULTATION_POLICY, ids)).toThrow(ConsentRequiredError);
    }
    expect(processLocalLeadStore.countForTests()).toBe(0);
  });

  it("creates one versioned Lead and ConsentRecord with the exact immutable Case A Blueprint and consultant summary", () => {
    const input = request(); const lead = createLead(input, EXABYTES_CONSULTATION_POLICY, ids); const selected = lead.blueprint.snapshot.selectedScenario;
    expect(lead.id).toBe("lead_stage060000000000000001"); expect(lead.status).toBe("new"); expect(lead.sourceCampaign).toBe("ai-horizon-2026");
    expect(lead.consent.id).toBe("consent_stage060000000000001"); expect(lead.consent.consentedAt).toBe(ids.now()); expect(lead.consent.submissionId).toBe(input.submissionId);
    expect(lead.blueprint).toEqual(input.blueprint); expect(lead.blueprint).not.toBe(input.blueprint); expect(Object.isFrozen(lead.blueprint)).toBe(true);
    expect(lead.blueprint.sourceIdentity).toEqual(input.blueprint.sourceIdentity); expect(lead.blueprintId).toBe(input.blueprint.id);
    expect(lead.summary.scores.digitalMaturity.value).toBe(37.5); expect(lead.summary.scores.aiReadiness.value).toBe(42.5); expect(lead.summary.painPoints).toHaveLength(5);
    expect(lead.summary.selectedScenario.id).toBe(selected.id); expect(lead.summary.selectedScenario.firstYearCost).toEqual({ low: 9200, base: 18400, high: 27600 });
    expect(lead.summary.recommendations.map((item) => item.capabilityId)).toEqual(input.blueprint.snapshot.recommendations.recommendations.map((item) => item.capabilityId));
    expect(lead.summary.advisorFindings).toHaveLength(5);
  });

  it("stores one record, safely replays the same fingerprint, and rejects changed-payload reuse", async () => {
    const lead = createLead(request(), EXABYTES_CONSULTATION_POLICY, ids);
    expect((await processLocalLeadStore.createIdempotently({ fingerprint: "same", lead })).status).toBe("created");
    const replay = await processLocalLeadStore.createIdempotently({ fingerprint: "same", lead: { ...lead, id: "lead_stage060000000000000002" } });
    expect(replay.status).toBe("replayed"); if (replay.status === "replayed") expect(replay.lead.id).toBe(lead.id);
    expect((await processLocalLeadStore.createIdempotently({ fingerprint: "changed", lead })).status).toBe("conflict"); expect(processLocalLeadStore.countForTests()).toBe(1);
  });

  it("rate-limits bounded new submissions without storing a contact key", () => {
    const limiter = new ProcessLocalLeadRateLimiter(2, 60_000, 10);
    expect(limiter.check("198.51.100.1", 1)).toEqual({ allowed: true }); expect(limiter.check("198.51.100.1", 2)).toEqual({ allowed: true });
    expect(limiter.check("198.51.100.1", 3)).toEqual({ allowed: false, retryAfterSeconds: 60 }); expect(limiter.check("203.0.113.2", 3)).toEqual({ allowed: true });
  });

  it("keeps the generic lead domain and core independent of domain-pack policy literals", async () => {
    for (const file of ["src/domain/leads.ts", "src/core/leads/create-lead.ts"]) {
      const source = await readFile(path.join(process.cwd(), file), "utf8");
      expect(source, file).not.toMatch(/Exabytes|ai-horizon-2026/i);
      expect(source, file).not.toMatch(/domain-packs[\\/]exabytes/i);
    }
  });
});
