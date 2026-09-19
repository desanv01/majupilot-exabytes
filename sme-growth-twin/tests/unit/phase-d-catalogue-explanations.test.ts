import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildBusinessTwin } from "@/core/assessment/build-business-twin";
import { diffCatalogues, disableOfferingInNewVersion } from "@/core/recommendations/catalogue-lifecycle";
import { buildRecommendationResult } from "@/core/recommendations/build-recommendations";
import { validateRecommendationExplanation } from "@/core/recommendations/explain-recommendation";
import { buildDiagnosticResult } from "@/core/scoring/build-diagnostic";
import { assessmentSessionIdSchema } from "@/domain/ids";
import { EXABYTES_CATALOGUE_1_0_0, EXABYTES_CATALOGUE_2_0_0 } from "@/domain-packs/exabytes/catalogue";
import { goldenFixtureById } from "@/domain-packs/exabytes/golden-fixtures";
import { EXABYTES_OFFERING_SELECTION_1_0_0, EXABYTES_OFFERING_SELECTION_2_0_0 } from "@/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "@/domain-packs/exabytes/recommendation-rules";
import { runRecommendationExplanation } from "@/infrastructure/model-provider/recommendation-explanation-model";
import { LocalFixturePersistenceRepository } from "@/infrastructure/persistence/local-fixture-repository";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const digest = (character: string) => character.repeat(64);
const originalEnv = { ...process.env };
afterEach(() => { process.env = { ...originalEnv }; });

function recommendations() {
  const fixture = goldenFixtureById("case-a");
  let sequence = 0;
  const twin = buildBusinessTwin({ sessionId: assessmentSessionIdSchema.parse("assessment_phase_d_001"), answers: fixture.answers, followUpAnswers: fixture.followUpAnswers, selectedFollowUpIds: fixture.selectedFollowUpIds, revision: 1 }, { now: () => "2026-09-20T08:00:00+08:00", id: (kind) => `${kind}_phase_d_${++sequence}` });
  const diagnostic = buildDiagnosticResult(twin, { now: () => "2026-09-20T08:00:01+08:00", id: () => "diagnostic_phase_d_001" });
  const legacy = buildRecommendationResult(twin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => "2026-09-20T08:00:02+08:00", id: () => "recommendation_phase_d_legacy" });
  const current = buildRecommendationResult(twin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_2_0_0, EXABYTES_OFFERING_SELECTION_2_0_0, { now: () => "2026-09-20T08:00:02+08:00", id: () => "recommendation_phase_d_current" });
  return { legacy, current };
}

function validExplanation(recommendationId: string, evidenceId: string, alternativeId = "exb_freshdesk") {
  return {
    recommendationId,
    capabilityId: "shared_customer_operations",
    rationale: { text: "A shared customer workflow addresses the recorded operating gap.", citations: [{ type: "recommendation", id: recommendationId }, { type: "evidence", id: evidenceId }] },
    observedEvidence: [{ evidenceId, observation: "Customer records are currently handled through the recorded channel.", citations: [{ type: "evidence", id: evidenceId }] }],
    expectedOperationalChange: { text: "Customer interactions move into one governed follow-up workflow.", citations: [{ type: "recommendation", id: recommendationId }, { type: "evidence", id: evidenceId }] },
    timing: { status: "why_now", explanation: { text: "The deterministic result places this capability in the current sequence.", citations: [{ type: "recommendation", id: recommendationId }] } },
    adoptionRisk: { text: "Inconsistent team use is the principal adoption risk to validate.", citations: [{ type: "recommendation", id: recommendationId }] },
    firstSuccessMeasure: { text: "Track whether the agreed follow-up workflow is consistently used.", citations: [{ type: "recommendation", id: recommendationId }, { type: "evidence", id: evidenceId }] },
    consultantValidationQuestion: { text: "Which customer handoff should the consultant validate first?", citations: [{ type: "recommendation", id: recommendationId }, { type: "evidence", id: evidenceId }] },
    counterfactualAlternative: { offeringId: alternativeId, explanation: { text: "Freshdesk remains an unselected consultant-validated alternative for a support-led workflow.", citations: [{ type: "recommendation", id: recommendationId }, { type: "catalogue_source", id: "EXB-FRESHDESK" }] } },
  };
}

describe("Phase D catalogue completion", () => {
  it("maps every challenge-facing category to a verified row or an explicit unavailable row", () => {
    const expected = [
      "exb_ai_wp_hosting", "exb_managed_ecommerce", "exb_shopify_partner_path", "unavailable_magento_path", "third_party_ecommerce_saas",
      "exb_meeting_ai", "exb_ai_sales_team", "exb_ai_marketing_team", "exb_freshmarketer", "exb_freshdesk",
      "exb_freshchat", "exb_ai_website_builder_path", "exb_lark", "exb_google_workspace", "exb_microsoft_365",
    ];
    expect(expected.every((id) => EXABYTES_CATALOGUE_2_0_0.offerings.some((item) => item.id === id))).toBe(true);
    for (const item of EXABYTES_CATALOGUE_2_0_0.offerings.filter((entry) => entry.active)) {
      expect(item.reviewState).toBe("approved");
      expect(item.verifiedAt).toBe("2026-09-20");
      expect(item.sourceUrl).toMatch(/^https:\/\//);
    }
    expect(EXABYTES_CATALOGUE_2_0_0.offerings.find((item) => item.id === "unavailable_magento_path")).toMatchObject({ active: false, reviewState: "unavailable", classification: "unavailable/unverified", sourceUrl: null });
  });

  it("changes catalogue mappings without changing deterministic capability eligibility or ranking", () => {
    const { legacy, current } = recommendations();
    expect(current.recommendations.map(({ capabilityId, rank, fitScore, status }) => ({ capabilityId, rank, fitScore, status }))).toEqual(legacy.recommendations.map(({ capabilityId, rank, fitScore, status }) => ({ capabilityId, rank, fitScore, status })));
    expect(current.catalogueVersion).toBe("2.0.0");
    expect(current.recommendations[0].mappedOffering?.selectionRuleId).toBe("catalogue_rule_1");
  });

  it("produces a stable golden diff and disables offerings only in a new snapshot", () => {
    const diff = diffCatalogues(EXABYTES_CATALOGUE_1_0_0, EXABYTES_CATALOGUE_2_0_0);
    expect(diff.addedOfferingIds).toEqual(expect.arrayContaining(["exb_ai_wp_hosting", "exb_managed_ecommerce", "exb_meeting_ai", "unavailable_magento_path"]));
    expect(diff.removedOfferingIds).toEqual([]);
    const disabled = disableOfferingInNewVersion(EXABYTES_CATALOGUE_2_0_0, { nextVersion: "2.0.1", offeringId: "exb_meeting_ai", verifiedAt: "2026-09-20" });
    expect(disabled.reviewState).toBe("draft");
    expect(disabled.offerings.find((item) => item.id === "exb_meeting_ai")).toMatchObject({ active: false, reviewState: "disabled", catalogueVersion: "2.0.1" });
    expect(disabled.mappings.some((mapping) => mapping.offeringId === "exb_meeting_ai")).toBe(false);
    expect(EXABYTES_CATALOGUE_2_0_0.offerings.find((item) => item.id === "exb_meeting_ai")?.active).toBe(true);
  });
});

describe("Phase D recommendation explanations", () => {
  it("accepts only existing evidence, recommendation, alternative, and source citations", () => {
    const { current } = recommendations();
    const recommendation = current.recommendations.find((item) => item.capabilityId === "shared_customer_operations")!;
    const context = { recommendationId: uuid(1), recommendation, evidence: [{ id: uuid(2), sourceRef: "q3.biggestChallenge", normalizedValue: "customer_management" }], catalogueSources: EXABYTES_CATALOGUE_2_0_0.offerings.filter((item) => [recommendation.mappedOffering?.id, ...recommendation.alternativeOfferingIds].includes(item.id)).map(({ id, name, sourceReferenceId, approvedFactSummary }) => ({ id, name, sourceReferenceId, approvedFactSummary })) };
    expect(validateRecommendationExplanation(validExplanation(uuid(1), uuid(2)), context).recommendationId).toBe(uuid(1));
    expect(() => validateRecommendationExplanation({ ...validExplanation(uuid(1), uuid(2)), rationale: { text: "Unsupported claim.", citations: [{ type: "evidence", id: uuid(9) }] } }, context)).toThrow("unsupported_evidence_citation");
    expect(() => validateRecommendationExplanation({ ...validExplanation(uuid(1), uuid(2)), firstSuccessMeasure: { text: "Guarantee a 99% gain.", citations: [{ type: "recommendation", id: uuid(1) }] } }, context)).toThrow("unsupported_numeric_or_commercial_claim");
  });

  it("runs a bounded structured live explanation and persists only redacted telemetry", async () => {
    process.env.AI_EXECUTION_MODE = "required";
    process.env.AI_GATEWAY_MODEL_RECOMMENDATION_EXPLANATION = "test/model";
    process.env.AI_GATEWAY_API_KEY = "test-only";
    const repository = new LocalFixturePersistenceRepository();
    const issued = await repository.issueGuest(digest("d"));
    const owner = { kind: "guest" as const, guestSessionId: issued.guestSessionId };
    const evidenceId = uuid(3);
    const runId = uuid(4);
    const { current } = recommendations();
    await repository.saveArtifact(owner, { kind: "evidence_items", id: evidenceId, assessmentSessionId: issued.assessmentSessionId, payload: { sourceKind: "user_fact", sourceRef: "q3.biggestChallenge", normalizedValue: "customer_management" }, revision: 1, schemaVersion: "1", sourceArtifactIds: [], links: {} });
    await repository.saveArtifact(owner, { kind: "recommendation_runs", id: runId, assessmentSessionId: issued.assessmentSessionId, payload: current, schemaVersion: "1", rulePackVersion: "1", sourceArtifactIds: [evidenceId], links: { diagnosticRunId: uuid(5), businessTwinId: uuid(6) } });
    const result = await runRecommendationExplanation({ assessmentSessionId: issued.assessmentSessionId, recommendationRunId: runId, capabilityId: "shared_customer_operations", evidenceRefs: [evidenceId] }, owner, repository, "client", {
      now: (() => { let value = Date.parse("2026-09-20T08:00:00Z"); return () => value += 5; })(),
      id: () => uuid(7),
      preflight: async () => ({ id: "test/model", type: "language", max_tokens: 4096, supported_parameters: ["max_tokens"], modalities: { input: ["text"], output: ["text"] }, pricing: { input: "0.0000001", output: "0.0000001" } }),
      callProvider: async () => ({ output: validExplanation(runId, evidenceId), inputTokens: 100, outputTokens: 120 }),
    });
    expect(result.state).toBe("live");
    expect(repository.modelCalls).toHaveLength(1);
    expect(repository.modelCalls[0].record).toMatchObject({ operation: "recommendation_explanation", outcome: "success", evidenceRefs: [evidenceId] });
    expect(JSON.stringify(repository.modelCalls[0])).not.toContain("customer_management");
  });
});
