import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildBusinessTwin } from "@/core/assessment/build-business-twin";
import { buildRecommendationResult } from "@/core/recommendations/build-recommendations";
import { buildDiagnosticResult } from "@/core/scoring/build-diagnostic";
import { assessmentSessionIdSchema } from "@/domain/ids";
import { EXABYTES_CATALOGUE_CURRENT } from "@/domain-packs/exabytes/catalogue";
import { goldenFixtureById } from "@/domain-packs/exabytes/golden-fixtures";
import { EXABYTES_OFFERING_SELECTION_CURRENT } from "@/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "@/domain-packs/exabytes/recommendation-rules";
import { runRecommendationExplanation } from "@/infrastructure/model-provider/recommendation-explanation-model";
import { LocalFixturePersistenceRepository } from "@/infrastructure/persistence/local-fixture-repository";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe.skipIf(process.env.RUN_PHASE_D_LIVE_GATEWAY !== "1")("Phase D live Gateway proof", () => {
  it("returns a source/evidence-bound explanation and safe telemetry", async () => {
    const fixture = goldenFixtureById("case-a");
    let sequence = 0;
    const twin = buildBusinessTwin({ sessionId: assessmentSessionIdSchema.parse("assessment_phase_d_live"), answers: fixture.answers, followUpAnswers: fixture.followUpAnswers, selectedFollowUpIds: fixture.selectedFollowUpIds, revision: 1 }, { now: () => "2026-09-20T08:00:00+08:00", id: (kind) => `${kind}_phase_d_live_${++sequence}` });
    const diagnostic = buildDiagnosticResult(twin, { now: () => "2026-09-20T08:00:01+08:00", id: () => "diagnostic_phase_d_live" });
    const recommendation = buildRecommendationResult(twin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_CURRENT, EXABYTES_OFFERING_SELECTION_CURRENT, { now: () => "2026-09-20T08:00:02+08:00", id: () => "recommendation_phase_d_live" });
    const repository = new LocalFixturePersistenceRepository();
    const issued = await repository.issueGuest("e".repeat(64));
    const owner = { kind: "guest" as const, guestSessionId: issued.guestSessionId };
    const evidenceId = uuid(31);
    const recommendationRunId = uuid(32);
    await repository.saveArtifact(owner, { kind: "evidence_items", id: evidenceId, assessmentSessionId: issued.assessmentSessionId, payload: { sourceKind: "user_fact", sourceRef: "q3.biggestChallenge", normalizedValue: "customer_management" }, revision: 1, schemaVersion: "1", sourceArtifactIds: [], links: {} });
    await repository.saveArtifact(owner, { kind: "recommendation_runs", id: recommendationRunId, assessmentSessionId: issued.assessmentSessionId, payload: recommendation, schemaVersion: "1", rulePackVersion: "1", sourceArtifactIds: [evidenceId], links: { diagnosticRunId: uuid(33), businessTwinId: uuid(34) } });
    const result = await runRecommendationExplanation({ assessmentSessionId: issued.assessmentSessionId, recommendationRunId, capabilityId: "shared_customer_operations", evidenceRefs: [evidenceId] }, owner, repository, "phase-d-live-proof");
    expect(result.state).toBe("live");
    expect(result.explanation?.recommendationId).toBe(recommendationRunId);
    expect(result.explanation?.observedEvidence[0].evidenceId).toBe(evidenceId);
    expect(result.explanation?.rationale.citations.some((citation) => citation.type === "recommendation" && citation.id === recommendationRunId)).toBe(true);
    const telemetry = repository.modelCalls.at(-1)!.record;
    expect(telemetry).toMatchObject({ operation: "recommendation_explanation", provider: "vercel_ai_gateway", outcome: "success" });
    console.info("PHASE_D_LIVE_PROOF", JSON.stringify({ state: result.state, provider: telemetry.provider, model: telemetry.model, inputTokens: telemetry.inputTokens, outputTokens: telemetry.outputTokens, estimatedCost: telemetry.estimatedCost, latencyMs: telemetry.latencyMs, retries: telemetry.retryCount, evidenceReferenceCount: telemetry.evidenceRefs.length }));
  }, 60_000);
});
