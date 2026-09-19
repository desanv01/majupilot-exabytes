import type { BusinessTwin } from "@/domain/business-twin";
import type { RecommendationResultId } from "@/domain/ids";
import {
  catalogueSchema,
  RECOMMENDATION_CATALOGUE_VERSION,
  RECOMMENDATION_MODEL_VERSION,
  recommendationResultSchema,
  type RecommendationRulePack,
  type RecommendationResult,
} from "@/domain/recommendations";
import type { DiagnosticResult } from "@/domain/scoring";

import { selectCapabilityRecommendations } from "./capability-rules";
import { mapOfferingsAfterSelection } from "./map-offerings";

export interface RecommendationFactories { now: () => string; id: () => string }

export function buildRecommendationResult(
  twin: BusinessTwin,
  diagnostic: DiagnosticResult,
  recommendationRulePack: RecommendationRulePack,
  catalogue: unknown,
  offeringSelectionPolicy: unknown,
  factories: RecommendationFactories,
): RecommendationResult {
  const parsedCatalogue = catalogueSchema.safeParse(catalogue);
  const selected = selectCapabilityRecommendations(twin, diagnostic, recommendationRulePack);
  const mapped = mapOfferingsAfterSelection(selected, twin, catalogue, offeringSelectionPolicy);
  return recommendationResultSchema.parse({
    id: factories.id() as RecommendationResultId,
    assessmentSessionId: twin.assessmentSessionId,
    businessTwinId: twin.id,
    twinRevision: twin.revision,
    diagnosticResultId: diagnostic.id,
    sourceScoreModelVersion: diagnostic.scoreModelVersion,
    sourcePainModelVersion: diagnostic.painModelVersion,
    recommendationModelVersion: RECOMMENDATION_MODEL_VERSION,
    catalogueVersion: parsedCatalogue.success ? parsedCatalogue.data.version : RECOMMENDATION_CATALOGUE_VERSION,
    generatedAt: factories.now(),
    recommendations: mapped,
  });
}
