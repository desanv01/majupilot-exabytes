import { ADVISOR_MODEL_VERSION, advisorPanelResponseSchema, type AdvisorPanelResponse } from "@/domain/advisors";
import { BLUEPRINT_MODEL_VERSION, BLUEPRINT_SECTION_IDS, BLUEPRINT_STORAGE_VERSION, blueprintSchema, type Blueprint } from "@/domain/blueprint";
import type { BusinessTwin } from "@/domain/business-twin";
import type { RecommendationResult } from "@/domain/recommendations";
import type { ScenarioComparison } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";

import { synthesizeAdvisorReviews } from "../advisors/synthesize-advisors";

export interface BlueprintFactories { id: () => string; now: () => string }
export interface BlueprintInputs { twin: BusinessTwin; diagnostic: DiagnosticResult; recommendations: RecommendationResult; comparison: ScenarioComparison; panel: AdvisorPanelResponse }

export function blueprintIdentity(inputs: Omit<BlueprintInputs, "panel">) {
  const selected = inputs.comparison.scenarios.find((item) => item.id === inputs.comparison.selectedScenarioId);
  if (!selected || !inputs.comparison.selectedScenarioId) throw new Error("preferred_scenario_required");
  return {
    assessmentSessionId: inputs.twin.assessmentSessionId, businessTwinId: inputs.twin.id, twinRevision: inputs.twin.revision, businessTwinSchemaVersion: inputs.twin.schemaVersion,
    diagnosticResultId: inputs.diagnostic.id, scoreModelVersion: inputs.diagnostic.scoreModelVersion, painModelVersion: inputs.diagnostic.painModelVersion,
    recommendationResultId: inputs.recommendations.id, recommendationModelVersion: inputs.recommendations.recommendationModelVersion, catalogueVersion: inputs.recommendations.catalogueVersion,
    scenarioComparisonId: inputs.comparison.id, scenarioModelVersion: inputs.comparison.scenarioModelVersion, roiModelVersion: inputs.comparison.roiModelVersion, selectedScenarioId: selected.id,
    advisorModelVersion: ADVISOR_MODEL_VERSION, blueprintModelVersion: BLUEPRINT_MODEL_VERSION,
  };
}

export function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const item of Object.values(value)) deepFreeze(item); }
  return value;
}

export function buildBlueprint(inputs: BlueprintInputs, factories: BlueprintFactories): Blueprint {
  const panel = advisorPanelResponseSchema.parse(inputs.panel);
  const selectedScenario = inputs.comparison.scenarios.find((item) => item.id === inputs.comparison.selectedScenarioId);
  if (!selectedScenario) throw new Error("preferred_scenario_required");
  const provenance = [
    { claimId: "profile", sectionId: "business-profile", category: "user_fact", sourceRefs: inputs.twin.evidence.map((item) => item.id).slice(0, 8) },
    { claimId: "scores", sectionId: "maturity-readiness", category: "calculated_rule", sourceRefs: [inputs.diagnostic.id] },
    { claimId: "catalogue", sectionId: "recommendations", category: "catalogue_fact", sourceRefs: [inputs.recommendations.id] },
    { claimId: "scenario", sectionId: "selected-plan", category: "scenario_assumption", sourceRefs: [selectedScenario.id] },
    ...panel.reviews.map((review) => ({ claimId: `advisor-${review.advisor}`, sectionId: "advisor-reviews" as const, category: review.origin === "model" ? "model_interpretation" as const : "deterministic_fallback" as const, sourceRefs: [review.id] })),
    { claimId: "consultant-notes", sectionId: "consultant-notes", category: "human_note", sourceRefs: ["empty-until-human-review"] },
  ];
  const parsed = blueprintSchema.parse({
    id: factories.id(), storageVersion: BLUEPRINT_STORAGE_VERSION, modelVersion: BLUEPRINT_MODEL_VERSION, generatedAt: factories.now(), sourceIdentity: blueprintIdentity(inputs), sectionIds: [...BLUEPRINT_SECTION_IDS],
    snapshot: { twin: structuredClone(inputs.twin), diagnostic: structuredClone(inputs.diagnostic), recommendations: structuredClone(inputs.recommendations), comparison: structuredClone(inputs.comparison), selectedScenario: structuredClone(selectedScenario) },
    advisorReviews: panel.reviews, synthesis: synthesizeAdvisorReviews(panel.reviews), modelCalls: panel.modelCalls, provenance,
    limitations: ["Revenue and avoided-risk value remain unestimated until every required input is supplied.", "Costs are planning assumptions, not vendor quotes or guaranteed outcomes.", "Advisor interpretations are bounded critiques and do not alter deterministic records."],
  });
  return deepFreeze(parsed) as Blueprint;
}
