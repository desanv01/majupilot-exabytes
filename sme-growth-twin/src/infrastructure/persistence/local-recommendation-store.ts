import type { BusinessTwin } from "@/domain/business-twin";
import {
  RECOMMENDATION_CATALOGUE_VERSION,
  RECOMMENDATION_MODEL_VERSION,
  recommendationResultSchema,
  type RecommendationResult,
} from "@/domain/recommendations";
import { PAIN_MODEL_VERSION, SCORE_MODEL_VERSION, type DiagnosticResult } from "@/domain/scoring";

export const RECOMMENDATION_STORAGE_KEY = "sme-growth-twin:recommendations:1.0.0";
export interface RecommendationStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export type RecommendationLoadResult =
  | { status: "empty" }
  | { status: "ok"; result: RecommendationResult }
  | { status: "discarded"; reason: "corrupt" | "incompatible" | "stale" };

export function clearRecommendationResult(storage: RecommendationStorage) { storage.removeItem(RECOMMENDATION_STORAGE_KEY); }
export function saveRecommendationResult(storage: RecommendationStorage, result: RecommendationResult) {
  storage.setItem(RECOMMENDATION_STORAGE_KEY, JSON.stringify(recommendationResultSchema.parse(result)));
}
export function isRecommendationCurrent(result: RecommendationResult, twin: BusinessTwin, diagnostic: DiagnosticResult) {
  return result.assessmentSessionId === twin.assessmentSessionId && result.businessTwinId === twin.id && result.twinRevision === twin.revision &&
    result.diagnosticResultId === diagnostic.id && result.sourceScoreModelVersion === diagnostic.scoreModelVersion &&
    result.sourcePainModelVersion === diagnostic.painModelVersion && result.recommendationModelVersion === RECOMMENDATION_MODEL_VERSION &&
    result.catalogueVersion === RECOMMENDATION_CATALOGUE_VERSION;
}
export function loadRecommendationResult(storage: RecommendationStorage, twin?: BusinessTwin, diagnostic?: DiagnosticResult): RecommendationLoadResult {
  const raw = storage.getItem(RECOMMENDATION_STORAGE_KEY);
  if (raw === null) return { status: "empty" };
  let json: unknown;
  try { json = JSON.parse(raw); } catch { clearRecommendationResult(storage); return { status: "discarded", reason: "corrupt" }; }
  const parsed = recommendationResultSchema.safeParse(json);
  if (!parsed.success) {
    clearRecommendationResult(storage);
    const record = json && typeof json === "object" ? json as Record<string, unknown> : {};
    const incompatible = record.recommendationModelVersion !== RECOMMENDATION_MODEL_VERSION || record.catalogueVersion !== RECOMMENDATION_CATALOGUE_VERSION || record.sourceScoreModelVersion !== SCORE_MODEL_VERSION || record.sourcePainModelVersion !== PAIN_MODEL_VERSION;
    return { status: "discarded", reason: incompatible ? "incompatible" : "corrupt" };
  }
  if (twin && diagnostic && !isRecommendationCurrent(parsed.data, twin, diagnostic)) {
    clearRecommendationResult(storage); return { status: "discarded", reason: "stale" };
  }
  return { status: "ok", result: parsed.data };
}
