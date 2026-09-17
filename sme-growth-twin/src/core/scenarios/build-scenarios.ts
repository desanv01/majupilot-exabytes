import type { BusinessTwin } from "@/domain/business-twin";
import type { ScenarioComparisonId, ScenarioEventId } from "@/domain/ids";
import type { CapabilityRecommendation, RecommendationResult } from "@/domain/recommendations";
import { ROI_MODEL_VERSION, SCENARIO_MODEL_VERSION, scenarioComparisonSchema, type ScenarioAssumptions, type ScenarioComparison, type ScenarioRulePack, type ScenarioTemplateId } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";

import { runScenario } from "./run-scenario";

export interface ScenarioFactories { now: () => string; id: () => string; eventId: () => string }

export function composeScenarioRecommendations(result: RecommendationResult, templateId: ScenarioTemplateId) {
  const ordered = [...result.recommendations].sort((a, b) => a.rank - b.rank || a.capabilityId.localeCompare(b.capabilityId));
  const eligible = ordered.filter((item) => item.status !== "why_later");
  let committed: CapabilityRecommendation[];
  if (templateId === "lean_foundation") {
    committed = ordered.filter((item) => item.status === "why_now" && item.roadmapPhase === "Foundation");
    const highest = eligible[0];
    if (highest && !committed.some((item) => item.capabilityId === highest.capabilityId)) committed.push(highest);
    committed = committed.sort((a, b) => a.rank - b.rank || a.capabilityId.localeCompare(b.capabilityId)).slice(0, 3);
  } else {
    committed = ordered.filter((item) => item.status === "why_now");
    const next = ordered.find((item) => item.status === "next");
    if (next && !committed.some((item) => item.capabilityId === next.capabilityId)) committed.push(next);
    committed = committed.sort((a, b) => a.rank - b.rank || a.capabilityId.localeCompare(b.capabilityId)).slice(0, 4);
  }
  const conditional: CapabilityRecommendation[] = [];
  if (templateId === "accelerated_ai") {
    const ai = ordered.find((item) => item.capabilityId === "governed_ai_automation");
    if (ai && !committed.some((item) => item.capabilityId === ai.capabilityId)) {
      if (ai.status === "why_later") conditional.push(ai);
      else if (committed.length < 4) committed.push(ai);
    }
  }
  return { committed, conditional, all: [...committed, ...conditional] };
}

export function buildScenarioComparison(twin: BusinessTwin, diagnostic: DiagnosticResult, recommendations: RecommendationResult, rules: ScenarioRulePack, factories: ScenarioFactories): ScenarioComparison {
  const id = factories.id() as ScenarioComparisonId;
  const timestamp = factories.now();
  const scenarios = rules.templates.map((template) => {
    const composition = composeScenarioRecommendations(recommendations, template.id);
    const commitments = new Map(composition.all.map((item) => [item.capabilityId, composition.conditional.includes(item) ? "conditional" as const : "committed" as const]));
    return runScenario({ scenarioId: `${id}_${template.id}`, template, recommendations: composition.all, commitments, twin, rules, eventId: () => factories.eventId() as ScenarioEventId });
  });
  return scenarioComparisonSchema.parse({ id, assessmentSessionId: twin.assessmentSessionId, businessTwinId: twin.id, twinRevision: twin.revision, diagnosticResultId: diagnostic.id, recommendationResultId: recommendations.id, sourceScoreModelVersion: diagnostic.scoreModelVersion, sourcePainModelVersion: diagnostic.painModelVersion, sourceRecommendationModelVersion: recommendations.recommendationModelVersion, sourceCatalogueVersion: recommendations.catalogueVersion, scenarioModelVersion: SCENARIO_MODEL_VERSION, roiModelVersion: ROI_MODEL_VERSION, createdAt: timestamp, updatedAt: timestamp, scenarios });
}

export function recalculateScenarioComparison(comparison: ScenarioComparison, twin: BusinessTwin, recommendations: RecommendationResult, rules: ScenarioRulePack, overrides: Partial<Record<ScenarioTemplateId, ScenarioAssumptions>>, factories: Pick<ScenarioFactories, "now" | "eventId">): ScenarioComparison {
  const scenarios = comparison.scenarios.map((current) => {
    const template = rules.templates.find((item) => item.id === current.templateId)!;
    const source = composeScenarioRecommendations(recommendations, current.templateId);
    const commitments = new Map(source.all.map((item) => [item.capabilityId, source.conditional.includes(item) ? "conditional" as const : "committed" as const]));
    return runScenario({ scenarioId: current.id, template, recommendations: source.all, commitments, twin, rules, assumptions: overrides[current.templateId] ?? current.assumptions, eventId: () => factories.eventId() as ScenarioEventId });
  });
  return scenarioComparisonSchema.parse({ ...comparison, updatedAt: factories.now(), scenarios });
}
