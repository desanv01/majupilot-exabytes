import { describe, expect, it } from "vitest";

import type { ModelCallTelemetry } from "@/domain/ai-execution";
import { LocalFixturePersistenceRepository } from "@/infrastructure/persistence/local-fixture-repository";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const digest = (character: string) => character.repeat(64);

describe("Phase C telemetry authority and evidence scope", () => {
  it("accepts only evidence owned by the same authorized assessment", async () => {
    const repository = new LocalFixturePersistenceRepository();
    const first = await repository.issueGuest(digest("a"));
    const second = await repository.issueGuest(digest("b"));
    const firstOwner = { kind: "guest" as const, guestSessionId: first.guestSessionId };
    const secondOwner = { kind: "guest" as const, guestSessionId: second.guestSessionId };
    await repository.saveArtifact(firstOwner, { kind: "evidence_items", id: uuid(1), assessmentSessionId: first.assessmentSessionId, payload: { sourceKind: "user_fact", sourceRef: "test" }, revision: 1, schemaVersion: "1", sourceArtifactIds: [], links: {} });
    await repository.assertEvidenceReferences(firstOwner, first.assessmentSessionId, [uuid(1)]);
    await expect(repository.assertEvidenceReferences(secondOwner, second.assessmentSessionId, [uuid(1)])).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(repository.assertEvidenceReferences(firstOwner, first.assessmentSessionId, [uuid(9)])).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("counts only persisted outcomes that actually returned a proposal", async () => {
    const repository = new LocalFixturePersistenceRepository();
    const issued = await repository.issueGuest(digest("c"));
    const owner = { kind: "guest" as const, guestSessionId: issued.guestSessionId };
    const base: ModelCallTelemetry = { id: uuid(2), assessmentSessionId: issued.assessmentSessionId, operation: "assessment_follow_up", provider: "none", model: "disabled", schemaVersion: "1", promptVersion: "1", startedAt: "2026-09-19T10:00:00.000Z", completedAt: "2026-09-19T10:00:00.001Z", latencyMs: 1, inputTokens: null, outputTokens: null, estimatedCost: null, retryCount: 0, outcome: "ai_disabled", fallbackReason: "ai_disabled", evidenceRefs: [] };
    await repository.appendModelCall(owner, base);
    await repository.appendModelCall(owner, { ...base, id: uuid(3), outcome: "failed", fallbackReason: "AI_TIMEOUT" });
    await repository.appendModelCall(owner, { ...base, id: uuid(4), outcome: "deterministic_fallback", fallbackReason: "AI_REQUIRED_UNAVAILABLE" });
    expect(await repository.countDeliveredFollowUps(owner, issued.assessmentSessionId)).toBe(2);
  });
});
