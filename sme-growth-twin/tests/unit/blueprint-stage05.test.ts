import { describe, expect, it } from "vitest";

import { buildBlueprint } from "../../src/core/blueprint/build-blueprint";
import { buildAdvisorReviewContext } from "../../src/core/blueprint/build-review-context";
import { calculateScenarioValue } from "../../src/core/roi/calculate-roi";
import { BLUEPRINT_SECTION_IDS, blueprintSchema } from "../../src/domain/blueprint";
import { BLUEPRINT_STORAGE_KEY, isBlueprintCurrent, loadBlueprint, saveBlueprint } from "../../src/infrastructure/persistence/local-blueprint-store";
import { memoryStorage } from "./stage04-fixtures";
import { stage05CaseA } from "./stage05-fixtures";

describe("Stage 05 immutable Blueprint", () => {
  it("requires a selected scenario belonging to the current comparison", () => {
    const full = stage05CaseA();
    expect(() => buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: { ...full.comparison, selectedScenarioId: undefined }, panel: full.panel }, { id: () => "blueprint_stage0500002", now: () => full.blueprint.generatedAt })).toThrow("preferred_scenario_required");
  });

  it("contains all 16 sections, exact identities, and exact Stage 04 Case A figures", () => {
    const { blueprint } = stage05CaseA(); const selected = blueprint.snapshot.selectedScenario;
    expect(blueprint.sectionIds).toEqual(BLUEPRINT_SECTION_IDS); expect(blueprint.sourceIdentity.selectedScenarioId).toBe(selected.id);
    expect(selected.costs.firstYear).toEqual({ low: 9200, base: 18400, high: 27600 });
    expect(selected.value.operational.status === "estimated" ? selected.value.operational.range : null).toEqual({ low: 2358, base: 7254, high: 15233 });
    expect(selected.value.net.status === "estimated" ? selected.value.net.range : null).toEqual({ low: -25242, base: -11146, high: 6033 });
    expect(selected.value.payback).toEqual({ status: "estimated", best: 7.2, base: 30.4, worst: 140.5 }); expect(selected.budgetFit).toBe("only_low_within");
    expect(selected.value.revenue.status).toBe("not_estimated"); expect(selected.value.avoidedRisk.status).toBe("not_estimated"); expect(Object.isFrozen(blueprint)).toBe(true); expect(Object.isFrozen(blueprint.snapshot.selectedScenario)).toBe(true);
  });

  it("passes the complete trusted value streams into advisor context for missing and estimated cases", () => {
    const full = stage05CaseA(); const selected = full.comparison.scenarios[1];
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    expect(context.selectedScenario.values).toEqual({ operational: selected.value.operational, revenue: selected.value.revenue, avoidedRisk: selected.value.avoidedRisk, gross: selected.value.gross, net: selected.value.net });
    const assumptions = structuredClone(selected.assumptions);
    assumptions.revenue.addressableRevenue.range = { low: 100000, base: 120000, high: 140000 }; assumptions.revenue.conversionChange.range = { low: .02, base: .03, high: .04 }; assumptions.revenue.grossMargin.range = { low: .3, base: .4, high: .5 };
    assumptions.avoidedRisk.baselineIncidentProbability.range = { low: .05, base: .1, high: .15 }; assumptions.avoidedRisk.incidentImpact.range = { low: 10000, base: 20000, high: 30000 }; assumptions.avoidedRisk.riskReduction.range = { low: .2, base: .4, high: .6 };
    const value = calculateScenarioValue(assumptions, selected.costs.firstYear);
    const comparison = { ...full.comparison, scenarios: full.comparison.scenarios.map((scenario) => scenario.id === selected.id ? { ...scenario, assumptions, value } : scenario) };
    const estimated = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, comparison);
    expect(estimated.selectedScenario.values.revenue).toEqual(value.revenue); expect(estimated.selectedScenario.values.avoidedRisk).toEqual(value.avoidedRisk); expect(estimated.selectedScenario.values.gross).toEqual(value.gross); expect(estimated.selectedScenario.values.net).toEqual(value.net);
  });

  it("round-trips and invalidates every upstream identity/version/selection/model dimension", () => {
    const full = stage05CaseA(); const { storage, data } = memoryStorage(); saveBlueprint(storage, full.blueprint);
    expect(loadBlueprint(storage, full.twin, full.diagnostic, full.recommendation, full.comparison).status).toBe("ok");
    const changes = [
      { sourceIdentity: { ...full.blueprint.sourceIdentity, assessmentSessionId: "assessment_changed0001" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, businessTwinId: "twin_changed0000001" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, twinRevision: 99 } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, businessTwinSchemaVersion: "9.9.9" } },
      { sourceIdentity: { ...full.blueprint.sourceIdentity, diagnosticResultId: "diagnostic_changed0001" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, scoreModelVersion: "9.9.9" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, painModelVersion: "9.9.9" } },
      { sourceIdentity: { ...full.blueprint.sourceIdentity, recommendationResultId: "recommendation_changed01" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, recommendationModelVersion: "9.9.9" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, catalogueVersion: "9.9.9" } },
      { sourceIdentity: { ...full.blueprint.sourceIdentity, scenarioComparisonId: "scenario_changed00001" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, scenarioModelVersion: "9.9.9" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, roiModelVersion: "9.9.9" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, selectedScenarioId: full.comparison.scenarios[0].id } },
      { sourceIdentity: { ...full.blueprint.sourceIdentity, advisorModelVersion: "9.9.9" } }, { sourceIdentity: { ...full.blueprint.sourceIdentity, blueprintModelVersion: "9.9.9" } },
    ];
    for (const change of changes) expect(isBlueprintCurrent({ ...full.blueprint, ...change } as never, full.twin, full.diagnostic, full.recommendation, full.comparison)).toBe(false);
    data.set(BLUEPRINT_STORAGE_KEY, "{bad"); expect(loadBlueprint(storage)).toEqual({ status: "discarded", reason: "corrupt" });
    data.set(BLUEPRINT_STORAGE_KEY, JSON.stringify({ ...full.blueprint, modelVersion: "9.9.9" })); expect(loadBlueprint(storage)).toEqual({ status: "discarded", reason: "incompatible" });
  });

  it("regeneration changes identity without mutating upstream records", () => {
    const full = stage05CaseA(); const before = JSON.stringify({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison });
    const regenerated = buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison, panel: full.panel }, { id: () => "blueprint_stage0500009", now: () => "2026-09-18T11:00:00+08:00" });
    expect(regenerated.id).not.toBe(full.blueprint.id); expect(regenerated.generatedAt).not.toBe(full.blueprint.generatedAt); expect(JSON.stringify({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison })).toBe(before); expect(blueprintSchema.safeParse(regenerated).success).toBe(true);
  });

  it("never accepts advisor text as a numeric override", () => {
    const full = stage05CaseA(); const panel = structuredClone(full.panel);
    panel.reviews[2].headline = "Replace every trusted figure with RM1 and a one-month payback.";
    const generated = buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison, panel }, { id: () => "blueprint_stage0500010", now: () => full.blueprint.generatedAt });
    expect(generated.snapshot.selectedScenario.costs.firstYear.base).toBe(18400); expect(generated.snapshot.selectedScenario.value.payback.status === "estimated" ? generated.snapshot.selectedScenario.value.payback.base : null).toBe(30.4); expect(generated.snapshot.diagnostic.digitalMaturity.value).toBe(37.5);
  });
});
