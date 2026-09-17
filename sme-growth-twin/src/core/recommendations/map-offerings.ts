import type { BusinessTwin } from "@/domain/business-twin";
import {
  catalogueSchema,
  offeringSelectionPolicySchema,
  type CapabilityRecommendation,
  type Catalogue,
  type OfferingSelectionCondition,
  type OfferingSelectionRule,
} from "@/domain/recommendations";

function conditionValue(condition: OfferingSelectionCondition, twin: BusinessTwin) {
  if (condition.source === "capability_state") {
    return twin.capabilities.find((item) => item.capabilityId === condition.key)?.currentState;
  }
  if (condition.source === "constraint_concern") return twin.constraints.concerns[0];
  return twin.processes[0]?.painSignals[0];
}

function conditionMatches(condition: OfferingSelectionCondition, twin: BusinessTwin) {
  const value = conditionValue(condition, twin);
  const included = value !== undefined && condition.values.includes(value as never);
  return condition.operator === "in" ? included : !included;
}

function selectionFor(
  recommendation: CapabilityRecommendation,
  twin: BusinessTwin,
  rules: readonly OfferingSelectionRule[],
) {
  return rules
    .filter((rule) => rule.capabilityId === recommendation.capabilityId)
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .find((rule) => rule.conditions.every((condition) => conditionMatches(condition, twin)));
}

/** Mapping is deliberately a second pass over already-ranked capabilities. */
export function mapOfferingsAfterSelection(
  selected: readonly CapabilityRecommendation[],
  twin: BusinessTwin,
  catalogueInput: unknown,
  selectionPolicyInput: unknown,
): CapabilityRecommendation[] {
  const parsed = catalogueSchema.safeParse(catalogueInput);
  const policy = offeringSelectionPolicySchema.safeParse(selectionPolicyInput);
  if (!parsed.success || !policy.success) return selected.map((item) => ({ ...item, mappedOffering: undefined, alternativeOfferingIds: [] }));
  const catalogue: Catalogue = parsed.data;
  return selected.map((recommendation) => {
    const selection = selectionFor(recommendation, twin, policy.data.rules);
    if (!selection) return { ...recommendation, mappedOffering: undefined, alternativeOfferingIds: [] };
    const offering = catalogue.offerings.find((item) => item.id === selection.offeringId && item.active && item.capabilityIds.includes(recommendation.capabilityId));
    const mapping = catalogue.mappings.find((item) => item.capabilityId === recommendation.capabilityId && item.offeringId === selection.offeringId);
    if (!offering || !mapping) return { ...recommendation, mappedOffering: undefined, alternativeOfferingIds: [] };
    const validAlternatives = selection.alternativeOfferingIds.filter((id) => catalogue.offerings.some((item) => item.id === id && item.active && item.capabilityIds.includes(recommendation.capabilityId)));
    return {
      ...recommendation,
      mappedOffering: {
        id: offering.id, provider: offering.provider, name: offering.name,
        approvedFactSummary: offering.approvedFactSummary, relativeCostTier: offering.relativeCostTier,
        pricingTreatment: offering.pricingTreatment, sourceUrl: offering.sourceUrl, sourceLabel: offering.sourceLabel,
        verifiedAt: offering.verifiedAt, catalogueVersion: offering.catalogueVersion,
        selectionRuleId: mapping.selectionRuleId, mappingReason: mapping.mappingReason,
        futureFit: recommendation.status === "why_later",
      },
      alternativeOfferingIds: validAlternatives,
    };
  });
}
