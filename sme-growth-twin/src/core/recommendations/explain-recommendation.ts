import {
  recommendationExplanationSchema,
  type ExplanationCitation,
  type RecommendationExplanation,
  type RecommendationExplanationContext,
} from "@/domain/recommendation-explanations";

const unsupportedClaim = /(?:https?:\/\/|\b(?:guarantee(?:d)?|price|costs?\s+RM)\b|(?:RM|MYR|USD|\$)\s*\d|\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:days?|weeks?|months?)\b)/i;

function everyStatement(explanation: RecommendationExplanation) {
  return [
    explanation.rationale,
    ...explanation.observedEvidence.map((item) => ({ text: item.observation, citations: item.citations })),
    explanation.expectedOperationalChange,
    explanation.timing.explanation,
    explanation.adoptionRisk,
    explanation.firstSuccessMeasure,
    explanation.consultantValidationQuestion,
    explanation.counterfactualAlternative.explanation,
  ];
}

export function validateRecommendationExplanation(output: unknown, context: RecommendationExplanationContext): RecommendationExplanation {
  const explanation = recommendationExplanationSchema.parse(output);
  if (explanation.recommendationId !== context.recommendationId || explanation.capabilityId !== context.recommendation.capabilityId || explanation.timing.status !== context.recommendation.status) throw new Error("authoritative_recommendation_mismatch");
  const evidenceIds = new Set(context.evidence.map((item) => item.id));
  const sourceIds = new Set(context.catalogueSources.map((item) => item.sourceReferenceId));
  const alternativeIds = new Set(context.recommendation.alternativeOfferingIds);
  for (const item of explanation.observedEvidence) if (!evidenceIds.has(item.evidenceId)) throw new Error("unsupported_evidence_citation");
  if (explanation.counterfactualAlternative.offeringId !== null && !alternativeIds.has(explanation.counterfactualAlternative.offeringId)) throw new Error("unsupported_alternative");
  if (!explanation.consultantValidationQuestion.text.endsWith("?")) throw new Error("unsupported_consultant_question");
  for (const statement of everyStatement(explanation)) {
    if (unsupportedClaim.test(statement.text)) throw new Error("unsupported_numeric_or_commercial_claim");
    for (const citation of statement.citations) {
      if (citation.type === "evidence" && !evidenceIds.has(citation.id)) throw new Error("unsupported_evidence_citation");
      if (citation.type === "recommendation" && citation.id !== context.recommendationId) throw new Error("unsupported_recommendation_citation");
      if (citation.type === "catalogue_source" && !sourceIds.has(citation.id)) throw new Error("unsupported_catalogue_citation");
    }
    for (const source of context.catalogueSources) {
      if (statement.text.toLocaleLowerCase().includes(source.name.toLocaleLowerCase()) && !statement.citations.some((citation) => citation.type === "catalogue_source" && citation.id === source.sourceReferenceId)) throw new Error("missing_catalogue_source_citation");
    }
  }
  for (const item of explanation.observedEvidence) if (!item.citations.some((citation) => citation.type === "evidence" && citation.id === item.evidenceId)) throw new Error("missing_evidence_citation");
  if (!explanation.rationale.citations.some((citation) => citation.type === "recommendation")) throw new Error("missing_recommendation_citation");
  if (explanation.counterfactualAlternative.offeringId !== null) {
    const source = context.catalogueSources.find((item) => item.id === explanation.counterfactualAlternative.offeringId);
    if (!source || !explanation.counterfactualAlternative.explanation.citations.some((citation) => citation.type === "catalogue_source" && citation.id === source.sourceReferenceId)) throw new Error("missing_alternative_source_citation");
  }
  return explanation;
}

export function deterministicRecommendationExplanation(context: RecommendationExplanationContext): RecommendationExplanation {
  const recommendationCitation: ExplanationCitation = { type: "recommendation", id: context.recommendationId };
  const evidence = context.evidence.slice(0, 6);
  const mappedSource = context.catalogueSources.find((item) => item.id === context.recommendation.mappedOffering?.id);
  const alternative = context.catalogueSources.find((item) => context.recommendation.alternativeOfferingIds.includes(item.id));
  const evidenceCitations: ExplanationCitation[] = evidence.map((item) => ({ type: "evidence", id: item.id }));
  const baseCitations = [recommendationCitation, ...evidenceCitations.slice(0, 2)];
  return recommendationExplanationSchema.parse({
    recommendationId: context.recommendationId,
    capabilityId: context.recommendation.capabilityId,
    rationale: { text: context.recommendation.whySelected, citations: baseCitations },
    observedEvidence: evidence.map((item) => ({ evidenceId: item.id, observation: `${item.sourceRef}: ${String(item.normalizedValue)}`.slice(0, 280), citations: [{ type: "evidence", id: item.id }] })),
    expectedOperationalChange: { text: context.recommendation.expectedImpact, citations: baseCitations },
    timing: { status: context.recommendation.status, explanation: { text: context.recommendation.whyNowOrLater, citations: [recommendationCitation] } },
    adoptionRisk: { text: context.recommendation.risks[0] ?? "Adoption ownership and process discipline require consultant validation.", citations: [recommendationCitation] },
    firstSuccessMeasure: { text: `Confirm one observable operating measure for ${context.recommendation.title.toLowerCase()} before implementation.`, citations: baseCitations },
    consultantValidationQuestion: { text: `Which owner and existing workflow should be validated first for ${context.recommendation.title.toLowerCase()}?`, citations: baseCitations },
    counterfactualAlternative: alternative
      ? { offeringId: alternative.id, explanation: { text: `${alternative.name} remains a consultant-validated alternative and is not selected by the current deterministic rule.`, citations: [recommendationCitation, { type: "catalogue_source", id: alternative.sourceReferenceId }] } }
      : { offeringId: null, explanation: { text: "No active catalogue alternative passed the deterministic mapping for this capability.", citations: mappedSource ? [recommendationCitation, { type: "catalogue_source", id: mappedSource.sourceReferenceId }] : [recommendationCitation] } },
  });
}
