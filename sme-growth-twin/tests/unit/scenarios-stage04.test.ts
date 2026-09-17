import { describe, expect, it } from "vitest";

import { composeScenarioRecommendations, recalculateScenarioComparison } from "../../src/core/scenarios/build-scenarios";
import { editRangeAssumption } from "../../src/core/scenarios/edit-assumptions";
import { buildSensitivityTrace } from "../../src/core/scenarios/seeded-sensitivity";
import { EXABYTES_SCENARIO_RULES_1_0_0 } from "../../src/domain-packs/exabytes/scenario-templates";
import { scenarioComparisonSchema, scenarioResultSchema } from "../../src/domain/scenarios";
import { isScenarioCurrent, loadScenarioComparison, saveScenarioComparison, SCENARIO_STORAGE_KEY } from "../../src/infrastructure/persistence/local-scenario-store";
import { caseAFull, caseB, caseC, fullCase, memoryStorage, now } from "./stage04-fixtures";

describe("Stage 04 scenario composition and run", () => {
  it("composes Case A exactly without manufacturing capabilities", () => {
    const { recommendation, comparison } = caseAFull();
    expect(comparison.scenarios.map((item) => item.interventions.map((entry) => [entry.capabilityId, entry.commitment]))).toEqual([
      [["shared_customer_operations", "committed"], ["professional_team_collaboration", "committed"], ["protected_business_continuity", "committed"]],
      [["shared_customer_operations", "committed"], ["professional_team_collaboration", "committed"], ["protected_business_continuity", "committed"], ["protected_web_presence", "committed"]],
      [["shared_customer_operations", "committed"], ["professional_team_collaboration", "committed"], ["protected_business_continuity", "committed"], ["protected_web_presence", "committed"], ["governed_ai_automation", "conditional"]],
    ]);
    const recommendedIds = new Set(recommendation.recommendations.map((item) => item.capabilityId));
    expect(comparison.scenarios.every((scenario) => scenario.interventions.every((item) => recommendedIds.has(item.capabilityId)))).toBe(true);
    expect(composeScenarioRecommendations(recommendation, EXABYTES_SCENARIO_RULES_1_0_0.templates[0]).committed).toHaveLength(3);
    expect(composeScenarioRecommendations(recommendation, { ...EXABYTES_SCENARIO_RULES_1_0_0.templates[0], maximumCommitted: 2 }).committed).toHaveLength(2);
  });

  it("allocates auditable monthly costs and benefits to their actual start windows", () => {
    for (const scenario of caseAFull().comparison.scenarios) {
      const firstBenefitMonth = Math.min(...scenario.events.filter((event) => event.type === "benefit_realised").map((event) => event.month));
      const monthlyCost = scenario.months.reduce((sum, month) => sum + month.incurredCost, 0);
      const monthlyBenefit = scenario.months.reduce((sum, month) => sum + month.realisedBenefit, 0);
      const eventCost = scenario.events.filter((event) => event.type === "cost_incurred").reduce((sum, event) => sum + (event.numericPayload ?? 0), 0);
      const eventBenefit = scenario.events.filter((event) => event.type === "benefit_realised").reduce((sum, event) => sum + (event.numericPayload ?? 0), 0);
      expect(monthlyCost).toBe(scenario.costs.firstYear.base);
      expect(eventCost).toBe(scenario.costs.firstYear.base);
      expect(scenario.months.filter((month) => month.month < firstBenefitMonth).every((month) => month.realisedBenefit === 0)).toBe(true);
      expect(monthlyBenefit).toBe(scenario.value.gross.status === "estimated" ? scenario.value.gross.range.base : 0);
      expect(eventBenefit).toBe(monthlyBenefit);
      expect(scenario.events.filter((event) => event.type === "cost_incurred" || event.type === "benefit_realised").every((event) => event.numericPayload !== undefined)).toBe(true);
    }
  });

  it("enforces dependency order, exact 12 months, stable events and blocked conditional AI", () => {
    const accelerated = caseAFull().comparison.scenarios[2];
    const shared = accelerated.interventions.find((item) => item.capabilityId === "shared_customer_operations")!;
    const ai = accelerated.interventions.find((item) => item.capabilityId === "governed_ai_automation")!;
    expect(shared.completionMonth).toBeLessThan(ai.startMonth); expect(ai.status).toBe("blocked"); expect(ai.startMonth).toBe(7);
    expect(accelerated.months.map((item) => item.month)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
    expect(accelerated.events.some((item) => item.type === "conditional_gate_blocked" && item.capabilityId === "governed_ai_automation")).toBe(true);
    expect(accelerated.events.every((event, index, events) => index === 0 || event.month >= events[index - 1].month)).toBe(true);
    expect(accelerated.events.filter((event) => event.capabilityId).every((event) => accelerated.interventions.some((item) => item.capabilityId === event.capabilityId))).toBe(true);
  });

  it("makes sensitivity reproducible while leaving headline ROI unchanged", () => {
    let sequence = 0; const input = { scenarioId: "scenario_seed", seed: 42, delayProbability: 1, maximumDelayMonths: 3, adoptionVariation: .15, interventions: [{ capabilityId: "shared_customer_operations" as const, startMonth: 1, commitment: "committed" as const }], eventId: () => `event_seed${String(++sequence).padStart(4, "0")}` as never };
    const withoutIds = (events: ReturnType<typeof buildSensitivityTrace>) => events.map((event) => ({ scenarioId: event.scenarioId, month: event.month, type: event.type, capabilityId: event.capabilityId, numericPayload: event.numericPayload, explanation: event.explanation }));
    const first = withoutIds(buildSensitivityTrace(input)); sequence = 0; const second = withoutIds(buildSensitivityTrace(input));
    expect(first).toEqual(second); sequence = 0; expect(withoutIds(buildSensitivityTrace({ ...input, seed: 43 }))).not.toEqual(first);
    const { twin, recommendation, comparison } = caseAFull(); const before = comparison.scenarios.map((item) => ({ costs: item.costs, value: item.value }));
    let event = 0; const changed = recalculateScenarioComparison(comparison, twin, recommendation, EXABYTES_SCENARIO_RULES_1_0_0, Object.fromEntries(comparison.scenarios.map((item) => [item.templateId, { ...item.assumptions, sensitivity: { ...item.assumptions.sensitivity, seed: item.seed + 1 } }])) , { now: () => now, eventId: () => `event_changed${String(++event).padStart(4, "0")}` });
    expect(changed.scenarios.map((item) => ({ costs: item.costs, value: item.value }))).toEqual(before);
  });

  it("keeps Case B foundation-first and allows only an evidenced feasible Case C AI path", () => {
    const b = fullCase(caseB, {}, [], "b").comparison.scenarios[2];
    expect(b.interventions.find((item) => item.capabilityId === "governed_ai_automation")?.commitment).toBe("conditional");
    const cData = fullCase(caseC, {}, [], "c"); const c = cData.comparison.scenarios[2];
    expect(c.interventions.map((item) => item.capabilityId)).not.toEqual(expect.arrayContaining(["professional_team_collaboration", "protected_business_continuity"]));
    const recommendedAi = cData.recommendation.recommendations.find((item) => item.capabilityId === "governed_ai_automation");
    if (recommendedAi) expect(c.interventions.some((item) => item.capabilityId === "governed_ai_automation" && item.commitment === "committed")).toBe(recommendedAi.status !== "why_later");
  });

  it("rejects duplicate capabilities", () => {
    const scenario = caseAFull().comparison.scenarios[0];
    expect(scenarioResultSchema.safeParse({ ...scenario, interventions: [...scenario.interventions, scenario.interventions[0]] }).success).toBe(false);
  });
});

describe("Stage 04 persistence", () => {
  it("round-trips overrides and preference and distinguishes empty, corrupt and incompatible", () => {
    const { storage, data } = memoryStorage(); const full = caseAFull();
    expect(loadScenarioComparison(storage, full.twin, full.diagnostic, full.recommendation)).toEqual({ status: "empty" });
    const saved = { ...full.comparison, selectedScenarioId: full.comparison.scenarios[1].id };
    saveScenarioComparison(storage, saved); expect(loadScenarioComparison(storage, full.twin, full.diagnostic, full.recommendation)).toEqual({ status: "ok", result: saved });
    data.set(SCENARIO_STORAGE_KEY, "{bad"); expect(loadScenarioComparison(storage)).toEqual({ status: "discarded", reason: "corrupt" });
    data.set(SCENARIO_STORAGE_KEY, JSON.stringify({ ...saved, scenarioModelVersion: "9.9.9" })); expect(loadScenarioComparison(storage)).toEqual({ status: "discarded", reason: "incompatible" });
  });

  it("persists user-edit provenance and rejects a foreign preferred scenario", () => {
    const { storage } = memoryStorage();
    const full = caseAFull();
    const balanced = full.comparison.scenarios[1];
    const edited = editRangeAssumption(balanced.assumptions, "operational", "loadedHourlyCost", "base", "30");
    expect(edited.success).toBe(true);
    if (!edited.success) return;
    let event = 0;
    const recalculated = recalculateScenarioComparison(
      { ...full.comparison, selectedScenarioId: balanced.id },
      full.twin,
      full.recommendation,
      EXABYTES_SCENARIO_RULES_1_0_0,
      { balanced_growth: edited.data },
      { now: () => now, eventId: () => `event_override${String(++event).padStart(4, "0")}` },
    );
    saveScenarioComparison(storage, recalculated);
    const loaded = loadScenarioComparison(storage, full.twin, full.diagnostic, full.recommendation);
    expect(loaded.status).toBe("ok");
    if (loaded.status !== "ok") return;
    const assumption = loaded.result.scenarios[1].assumptions.operational.loadedHourlyCost;
    expect(assumption.range.base).toBe(30);
    expect(assumption.source).toBe("user_override");
    expect(assumption.sourceRef).toBe("scenario-lab-edit");
    expect(scenarioComparisonSchema.safeParse({ ...loaded.result, selectedScenarioId: "foreign-scenario" }).success).toBe(false);
  });

  it("invalidates every upstream identity and version dimension", () => {
    const full = caseAFull(); const result = full.comparison;
    const checks = [
      isScenarioCurrent({ ...result, assessmentSessionId: "assessment_changed0001" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, businessTwinId: "twin_changed0000001" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, twinRevision: 99 }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, diagnosticResultId: "diagnostic_changed0001" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, recommendationResultId: "recommendation_changed01" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, sourceScoreModelVersion: "9.9.9" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, sourcePainModelVersion: "9.9.9" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, sourceRecommendationModelVersion: "9.9.9" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, sourceCatalogueVersion: "9.9.9" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, scenarioModelVersion: "9.9.9" as never }, full.twin, full.diagnostic, full.recommendation),
      isScenarioCurrent({ ...result, roiModelVersion: "9.9.9" as never }, full.twin, full.diagnostic, full.recommendation),
    ];
    expect(checks).toEqual(Array(checks.length).fill(false));
  });
});
