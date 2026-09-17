import type { BusinessTwin } from "@/domain/business-twin";
import type { PainPointResult, DiagnosticResult } from "@/domain/scoring";
import type {
  CapabilityDefinition,
  CapabilityRecommendation,
  ComponentScores,
  GapId,
  RecommendationGapState,
  RecommendationRulePack,
} from "@/domain/recommendations";

export const RECOMMENDATION_WEIGHTS = {
  painPointFit: 0.3,
  prerequisiteReadiness: 0.2,
  budgetFit: 0.15,
  timeToValue: 0.15,
  riskFit: 0.1,
  dataReadiness: 0.1,
} as const;

export const PREREQUISITE_SCORE = { met: 100, partial: 60, unknown: 25, unmet: 0 } as const;
export const BUDGET_CAPACITY = { under_5k: 1, "5k_15k": 2, "15k_50k": 3, "50k_plus": 4, unknown: 2 } as const;
export const PACE_CAPACITY = { within_30_days: 1, "1_3_months": 2, "3_6_months": 3, "6_12_months": 4 } as const;

const round1 = (value: number) => Math.round(value * 10) / 10;
const evidenceIds = (twin: BusinessTwin, refs: readonly string[]) => twin.evidence.filter((item) => refs.includes(item.sourceRef)).map((item) => item.id);

function painMatches(pain: PainPointResult, gaps: readonly GapId[]) {
  return pain.affectedCapabilityIds.some((id) => gaps.includes(id as GapId));
}

export function generateCapabilityCandidates(twin: BusinessTwin, diagnostic: DiagnosticResult, rulePack: RecommendationRulePack) {
  return rulePack.definitions.filter((definition) => {
    const assessedPrimaryStates = definition.primaryGapIds.map((gap) => rulePack.assessedGapState(twin, gap)).filter((state): state is RecommendationGapState => state !== undefined);
    const primaryPainMatch = diagnostic.painPoints.some((pain) => painMatches(pain, definition.primaryGapIds));
    const directGap = definition.primaryGapIds.some((gap) => {
      const state = rulePack.assessedGapState(twin, gap);
      return state !== undefined && state !== "active";
    });
    return rulePack.isCandidateEligible(definition, twin, diagnostic, { assessedPrimaryStates, primaryPainMatch, directGap });
  });
}

export function calculateBudgetFit(capacity: number, tier: number) {
  const difference = tier - capacity;
  return difference <= 0 ? 100 : difference === 1 ? 65 : difference === 2 ? 30 : 0;
}

export function calculateTimeToValue(capacity: number, tier: number) {
  const difference = tier - capacity;
  return difference <= 0 ? 100 : difference === 1 ? 70 : 35;
}

function painPointFit(definition: CapabilityDefinition, twin: BusinessTwin, diagnostic: DiagnosticResult, rulePack: RecommendationRulePack) {
  const primary = diagnostic.painPoints.filter((pain) => painMatches(pain, definition.primaryGapIds)).map((pain) => pain.priority);
  const supporting = diagnostic.painPoints.filter((pain) => painMatches(pain, definition.supportingGapIds)).map((pain) => pain.priority * 0.7);
  const direct = definition.primaryGapIds.map((gap) => ({ not_used: 60, informal: 40, unknown: 20, active: 0 }[rulePack.assessedGapState(twin, gap) ?? "active"]));
  return round1(Math.max(0, ...primary, ...supporting, ...direct));
}

export function calculateFitScore(components: ComponentScores) {
  return round1(Object.entries(RECOMMENDATION_WEIGHTS).reduce((sum, [key, weight]) => sum + components[key as keyof ComponentScores] * weight, 0));
}

export function selectCapabilityRecommendations(twin: BusinessTwin, diagnostic: DiagnosticResult, rulePack: RecommendationRulePack): CapabilityRecommendation[] {
  const capacity = BUDGET_CAPACITY[twin.constraints.budgetBand as keyof typeof BUDGET_CAPACITY] ?? BUDGET_CAPACITY.unknown;
  const pace = PACE_CAPACITY[twin.constraints.implementationPace as keyof typeof PACE_CAPACITY] ?? 1;
  const candidates = generateCapabilityCandidates(twin, diagnostic, rulePack).map((definition) => {
    const checks = [...rulePack.evaluatePrerequisites(definition, twin, diagnostic)];
    const prerequisiteReadiness = checks.length ? round1(checks.reduce((sum, check) => sum + PREREQUISITE_SCORE[check.status], 0) / checks.length) : 100;
    const budgetFit = calculateBudgetFit(capacity, definition.costTier);
    const components: ComponentScores = {
      painPointFit: painPointFit(definition, twin, diagnostic, rulePack), prerequisiteReadiness, budgetFit,
      timeToValue: calculateTimeToValue(pace, definition.effortTier), riskFit: rulePack.riskFit(definition, twin, budgetFit), dataReadiness: rulePack.dataReadiness(definition, twin),
    };
    const addressed = diagnostic.painPoints.filter((pain) => painMatches(pain, [...definition.primaryGapIds, ...definition.supportingGapIds]));
    const refs = [...definition.primaryGapIds, ...definition.supportingGapIds].flatMap((gap) => rulePack.gapEvidenceRefs(gap));
    const hardFailure = checks.some((check) => check.hard && check.status !== "met") || budgetFit < 50;
    const blockers = checks.filter((check) => check.status !== "met").map((check) => check.label);
    return {
      rank: 0, capabilityId: definition.id, title: definition.title, outcome: definition.outcome,
      fitScore: calculateFitScore(components), componentScores: components, status: hardFailure ? "why_later" as const : "next" as const,
      whySelected: addressed.length ? `Selected because it addresses ${addressed.map((pain) => pain.title.toLowerCase()).join("; ")}.` : "Selected from a directly assessed capability gap.",
      whyNowOrLater: hardFailure ? `Sequence this later. ${blockers.length ? `First address: ${blockers.join(", ")}.` : "Its relative cost does not fit the current budget capacity."}` : "The current evidence, capacity, and timing support this as an eligible next step.",
      addressedPainPointIds: addressed.map((pain) => pain.id),
      evidenceIds: [...new Set([...addressed.flatMap((pain) => pain.evidenceIds), ...evidenceIds(twin, refs), ...checks.flatMap((check) => check.evidenceIds)])],
      prerequisites: checks, expectedImpact: definition.expectedImpact, effortTier: definition.effortTier, relativeCostTier: definition.costTier,
      timeToValueTier: definition.effortTier, risks: definition.risks, roadmapPhase: hardFailure ? "Optimize" as const : definition.defaultRoadmapPhase,
      alternativeOfferingIds: [], highestPainPriority: Math.max(0, ...addressed.map((pain) => pain.priority)),
    };
  });
  candidates.sort((a, b) => Number(a.status === "why_later") - Number(b.status === "why_later") || b.fitScore - a.fitScore || b.highestPainPriority - a.highestPainPriority || a.capabilityId.localeCompare(b.capabilityId));
  let whyNowCount = 0;
  return candidates.map(({ highestPainPriority: _highestPainPriority, ...item }, index) => {
    void _highestPainPriority;
    const whyNow = item.status !== "why_later" && item.fitScore >= 70 && whyNowCount < 3;
    if (whyNow) whyNowCount += 1;
    return { ...item, rank: index + 1, status: whyNow ? "why_now" : item.status, whyNowOrLater: whyNow ? "This is one of the three highest eligible capabilities with a fit score of at least 70." : item.whyNowOrLater };
  });
}
