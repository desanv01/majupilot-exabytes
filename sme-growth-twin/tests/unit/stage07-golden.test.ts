import { describe, expect, it } from "vitest";

import { buildAdvisorReviewContext } from "../../src/core/blueprint/build-review-context";
import { buildBlueprint } from "../../src/core/blueprint/build-blueprint";
import { advisorPanelResponseSchema } from "../../src/domain/advisors";
import { BLUEPRINT_SECTION_IDS } from "../../src/domain/blueprint";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "../../src/domain-packs/exabytes/advisor-rules";
import { GOLDEN_FIXTURES } from "../../src/domain-packs/exabytes/golden-fixtures";
import { caseAFull, caseBFull, caseCFull, now } from "./stage04-fixtures";

function completeCase(full: ReturnType<typeof caseAFull>, suffix: string) {
  const selected = full.comparison.scenarios.find((item) => item.templateId === "balanced_growth")!;
  const comparison = { ...full.comparison, selectedScenarioId: selected.id };
  const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, comparison);
  const panel = advisorPanelResponseSchema.parse({
    reviews: EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, context, `advisor_stage07${suffix}${String(index).padStart(3, "0")}`)),
    modelCalls: EXABYTES_ADVISORS_1_0_0.map((definition, index) => ({ id: `modelcall_stage07${suffix}${String(index).padStart(3, "0")}`, advisor: definition.id, provider: "unavailable", model: "not_configured", promptVersion: "1.0.0", schemaVersion: "1.0.0", latencyMs: 0, retryCount: 0, status: "unavailable", evidenceIds: [], errorCategory: "configuration" })),
  });
  const blueprint = buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison, panel }, { id: () => `blueprint_stage07${suffix.padEnd(8, "0")}`, now: () => now });
  return { ...full, comparison, selected, panel, blueprint };
}

function summary(result: ReturnType<typeof completeCase>) {
  return {
    digitalMaturity: result.diagnostic.digitalMaturity.value,
    aiReadiness: result.diagnostic.aiReadiness.value,
    painOrder: result.diagnostic.painPoints.map((item) => item.id),
    recommendations: result.recommendation.recommendations.map((item) => `${item.capabilityId}:${item.status}`),
    selectedScenario: result.selected.templateId,
    firstYearCost: result.selected.costs.firstYear,
    operationalValue: result.selected.value.operational,
    netValue: result.selected.value.net,
    payback: result.selected.value.payback,
    advisorOrigins: result.panel.reviews.map((item) => item.origin),
    sections: result.blueprint.sectionIds,
  };
}

describe("Stage 07 shared golden fixtures", () => {
  it("validates one production-owned fictional source", () => {
    expect(GOLDEN_FIXTURES.map((item) => item.id)).toEqual(["case-a", "case-b", "case-c"]);
    expect(GOLDEN_FIXTURES.every((item) => item.fictional)).toBe(true);
  });

  it("derives complete deterministic A/B/C journeys", () => {
    const results = [completeCase(caseAFull(), "a"), completeCase(caseBFull(), "b"), completeCase(caseCFull(), "c")];
    for (const result of results) {
      expect(result.panel.reviews).toHaveLength(5);
      expect(result.panel.reviews.every((review) => review.origin === "deterministic_fallback")).toBe(true);
      expect(result.blueprint.sectionIds).toEqual([...BLUEPRINT_SECTION_IDS]);
    }
    expect(results.map(summary)).toEqual([
      expect.objectContaining({
        digitalMaturity: 37.5,
        aiReadiness: 42.5,
        painOrder: ["pain_customer_followup", "pain_data_visibility", "pain_scaling_operations", "pain_collaboration", "pain_manual_work", "pain_security_continuity"],
        recommendations: ["shared_customer_operations:why_now", "professional_team_collaboration:why_now", "protected_business_continuity:why_now", "protected_web_presence:next", "governed_ai_automation:why_later"],
        selectedScenario: "balanced_growth",
        firstYearCost: { low: 9200, base: 18400, high: 27600 },
        operationalValue: { status: "estimated", range: { low: 2358, base: 7254, high: 15233 }, formula: "weekly hours saved × 52 × loaded hourly cost" },
        netValue: { status: "estimated", range: { low: -25242, base: -11146, high: 6033 }, formula: "low gross − high cost; base gross − base cost; high gross − low cost" },
        payback: { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 },
      }),
      expect.objectContaining({
        digitalMaturity: 23.2,
        aiReadiness: 43.8,
        painOrder: ["pain_manual_work", "pain_data_visibility", "pain_scaling_operations", "pain_lead_generation", "pain_customer_followup"],
        recommendations: ["professional_team_collaboration:why_now", "measurable_digital_growth:why_now", "shared_customer_operations:why_now", "protected_business_continuity:next", "governed_ai_automation:why_later"],
        selectedScenario: "balanced_growth",
        firstYearCost: { low: 7400, base: 14800, high: 22200 },
        operationalValue: { status: "estimated", range: { low: 2738, base: 8424, high: 17690 }, formula: "weekly hours saved × 52 × loaded hourly cost" },
        netValue: { status: "estimated", range: { low: -19462, base: -6376, high: 10290 }, formula: "low gross − high cost; base gross − base cost; high gross − low cost" },
        payback: { status: "estimated", best: 5, base: 21.1, worst: 97.3 },
      }),
      expect.objectContaining({
        digitalMaturity: 79,
        aiReadiness: 73.8,
        painOrder: ["pain_scaling_operations", "pain_manual_work", "pain_customer_followup"],
        recommendations: ["shared_customer_operations:why_now", "governed_ai_automation:why_now", "scalable_cloud_operations:why_now"],
        selectedScenario: "balanced_growth",
        firstYearCost: { low: 22400, base: 44800, high: 67200 },
        operationalValue: { status: "estimated", range: { low: 913, base: 2808, high: 5897 }, formula: "weekly hours saved × 52 × loaded hourly cost" },
        netValue: { status: "estimated", range: { low: -66287, base: -41992, high: -16503 }, formula: "low gross − high cost; base gross − base cost; high gross − low cost" },
        payback: { status: "estimated", best: 45.6, base: 191.5, worst: 883.6 },
      }),
    ]);
  });
});
