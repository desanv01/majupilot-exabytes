import { ADVISOR_MODEL_VERSION, advisorSynthesisSchema, type AdvisorId, type AdvisorReview, type AdvisorSynthesis } from "@/domain/advisors";

type Item = AdvisorReview["support"][number] | AdvisorReview["adjustments"][number];
type Kind = "support" | "concern" | "condition" | "missing_evidence";
const unique = <T>(items: readonly T[]) => [...new Set(items)];
const statement = (item: Item) => "statement" in item ? item.statement : item.action;

function collect(reviews: readonly AdvisorReview[], kind: "support" | "concerns" | "missingEvidence" | "adjustments") {
  const topics = new Map<string, Array<{ advisor: AdvisorId; item: Item }>>();
  for (const review of reviews) for (const item of review[kind]) {
    const list = topics.get(item.topic) ?? [];
    list.push({ advisor: review.advisor, item }); topics.set(item.topic, list);
  }
  return topics;
}

function entry(topic: string, groups: Array<{ kind: Kind; values: Array<{ advisor: AdvisorId; item: Item }> }>) {
  const perspectives: Array<{ kind: Kind; statement: string; advisorIds: AdvisorId[]; evidenceRefs: string[] }> = [];
  for (const group of groups) for (const value of group.values) {
    const text = statement(value.item);
    const existing = perspectives.find((item) => item.kind === group.kind && item.statement === text);
    if (existing) { existing.advisorIds = unique([...existing.advisorIds, value.advisor]); existing.evidenceRefs = unique([...existing.evidenceRefs, ...value.item.evidenceRefs]); }
    else perspectives.push({ kind: group.kind, statement: text, advisorIds: [value.advisor], evidenceRefs: [...value.item.evidenceRefs] });
  }
  return { topic, perspectives };
}

export function synthesizeAdvisorReviews(reviews: readonly AdvisorReview[]): AdvisorSynthesis {
  const support = collect(reviews, "support"); const concerns = collect(reviews, "concerns");
  const missing = collect(reviews, "missingEvidence"); const adjustments = collect(reviews, "adjustments");
  const agreement = [...support].filter(([, values]) => new Set(values.map((value) => value.advisor)).size >= 4).map(([topic, values]) => entry(topic, [{ kind: "support", values }]));
  const disagreement = [...support].filter(([topic]) => concerns.has(topic)).map(([topic, values]) => entry(topic, [{ kind: "support", values }, { kind: "concern", values: concerns.get(topic) ?? [] }]));
  const openQuestions = [...missing].map(([topic, values]) => entry(topic, [{ kind: "missing_evidence", values }]));
  const conditionTopics = new Map(adjustments);
  for (const [topic, values] of missing) conditionTopics.set(topic, [...(conditionTopics.get(topic) ?? []), ...values]);
  const conditions = [...conditionTopics].map(([topic]) => entry(topic, [{ kind: "condition", values: adjustments.get(topic) ?? [] }, { kind: "missing_evidence", values: missing.get(topic) ?? [] }]));
  const positions = reviews.map((review) => review.position);
  const decision = positions.includes("oppose") ? "revise" : positions.filter((value) => value === "insufficient_evidence").length >= 3 ? "insufficient_evidence" : positions.some((value) => value !== "support") || conditions.length ? "proceed_with_conditions" : "proceed";
  return advisorSynthesisSchema.parse({ modelVersion: ADVISOR_MODEL_VERSION, decision, agreement, disagreement, conditions, openQuestions });
}
