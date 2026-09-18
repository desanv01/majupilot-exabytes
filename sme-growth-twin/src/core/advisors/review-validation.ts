import { advisorReviewSchema, type AdvisorDefinition, type AdvisorReview, type AdvisorReviewContext } from "@/domain/advisors";

export interface ReviewFactories { reviewId: (advisor: string) => string }

export function validateAdvisorReview(input: unknown, definition: AdvisorDefinition, context: AdvisorReviewContext): AdvisorReview {
  const parsed = advisorReviewSchema.parse(input);
  if (parsed.advisor !== definition.id) throw new Error("advisor_mismatch");
  const allowed = new Set(context.evidenceAllowList);
  const items = [...parsed.support, ...parsed.concerns, ...parsed.missingEvidence, ...parsed.adjustments];
  for (const item of items) {
    if (item.evidenceRefs.some((reference) => !allowed.has(reference))) throw new Error("invalid_evidence");
    if ("targetRef" in item && !allowed.has(item.targetRef)) throw new Error("invalid_evidence");
  }
  return parsed;
}

export function withReviewIdentity(input: Omit<AdvisorReview, "id">, factories: ReviewFactories): AdvisorReview {
  return advisorReviewSchema.parse({ ...input, id: factories.reviewId(input.advisor) });
}
