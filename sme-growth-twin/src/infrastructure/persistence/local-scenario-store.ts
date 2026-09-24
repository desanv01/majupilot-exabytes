import type { BusinessTwin } from "@/domain/business-twin";
import { notifyAccountCaseLocalChange } from "./account-case-events";
import { RECOMMENDATION_CATALOGUE_VERSION, RECOMMENDATION_MODEL_VERSION, type RecommendationResult } from "@/domain/recommendations";
import { ROI_MODEL_VERSION, SCENARIO_MODEL_VERSION, scenarioComparisonSchema, type ScenarioComparison } from "@/domain/scenarios";
import { PAIN_MODEL_VERSION, SCORE_MODEL_VERSION, type DiagnosticResult } from "@/domain/scoring";

export const SCENARIO_STORAGE_KEY = "sme-growth-twin:scenarios:1.0.0";
export interface ScenarioStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export type ScenarioLoadResult = { status: "empty" } | { status: "ok"; result: ScenarioComparison } | { status: "discarded"; reason: "corrupt" | "incompatible" | "stale" };

export const clearScenarioComparison = (storage: ScenarioStorage) => { storage.removeItem(SCENARIO_STORAGE_KEY); notifyAccountCaseLocalChange(storage); };
export function saveScenarioComparison(storage: ScenarioStorage, result: ScenarioComparison) { storage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(scenarioComparisonSchema.parse(result))); notifyAccountCaseLocalChange(storage); }
export function isScenarioCurrent(result: ScenarioComparison, twin: BusinessTwin, diagnostic: DiagnosticResult, recommendations: RecommendationResult) {
  return result.assessmentSessionId === twin.assessmentSessionId && result.businessTwinId === twin.id && result.twinRevision === twin.revision && result.diagnosticResultId === diagnostic.id && result.recommendationResultId === recommendations.id && result.sourceScoreModelVersion === diagnostic.scoreModelVersion && result.sourcePainModelVersion === diagnostic.painModelVersion && result.sourceRecommendationModelVersion === recommendations.recommendationModelVersion && result.sourceCatalogueVersion === recommendations.catalogueVersion && result.scenarioModelVersion === SCENARIO_MODEL_VERSION && result.roiModelVersion === ROI_MODEL_VERSION;
}
export function loadScenarioComparison(storage: ScenarioStorage, twin?: BusinessTwin, diagnostic?: DiagnosticResult, recommendations?: RecommendationResult): ScenarioLoadResult {
  const raw = storage.getItem(SCENARIO_STORAGE_KEY);
  if (raw === null) return { status: "empty" };
  let json: unknown;
  try { json = JSON.parse(raw); } catch { clearScenarioComparison(storage); return { status: "discarded", reason: "corrupt" }; }
  const parsed = scenarioComparisonSchema.safeParse(json);
  if (!parsed.success) {
    clearScenarioComparison(storage);
    const record = json && typeof json === "object" ? json as Record<string, unknown> : {};
    const incompatible = record.scenarioModelVersion !== SCENARIO_MODEL_VERSION || record.roiModelVersion !== ROI_MODEL_VERSION || record.sourceScoreModelVersion !== SCORE_MODEL_VERSION || record.sourcePainModelVersion !== PAIN_MODEL_VERSION || record.sourceRecommendationModelVersion !== RECOMMENDATION_MODEL_VERSION || record.sourceCatalogueVersion !== RECOMMENDATION_CATALOGUE_VERSION;
    return { status: "discarded", reason: incompatible ? "incompatible" : "corrupt" };
  }
  if (twin && diagnostic && recommendations && !isScenarioCurrent(parsed.data, twin, diagnostic, recommendations)) { clearScenarioComparison(storage); return { status: "discarded", reason: "stale" }; }
  return { status: "ok", result: parsed.data };
}
