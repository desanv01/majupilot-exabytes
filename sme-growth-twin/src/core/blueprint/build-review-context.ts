import { advisorReviewContextSchema, type AdvisorReviewContext } from "@/domain/advisors";
import type { BusinessTwin } from "@/domain/business-twin";
import type { RecommendationResult } from "@/domain/recommendations";
import type { ScenarioComparison } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";

export function buildAdvisorReviewContext(twin: BusinessTwin, diagnostic: DiagnosticResult, recommendations: RecommendationResult, comparison: ScenarioComparison): AdvisorReviewContext {
  const selected = comparison.scenarios.find((item) => item.id === comparison.selectedScenarioId);
  if (!selected) throw new Error("preferred_scenario_required");
  const ref = (kind: string, id: string) => `${kind}:${id}`;
  const assumptionRefs = Object.values(selected.assumptions).flatMap((group) => typeof group === "object" && group && "key" in group ? [ref("assumption", String(group.key))] : Object.values(group as Record<string, unknown>).filter((item): item is { key: string } => Boolean(item && typeof item === "object" && "key" in item)).map((item) => ref("assumption", item.key)));
  const evidenceAllowList = [...twin.evidence.map((item) => item.id), ref("twin", twin.id), ref("diagnostic", diagnostic.id), ref("recommendation", recommendations.id), ref("comparison", comparison.id), ref("scenario", selected.id), ...recommendations.recommendations.map((item) => ref("capability", item.capabilityId)), ...assumptionRefs];
  return advisorReviewContextSchema.parse({
    business: { sector: twin.identity.industry, businessModel: twin.identity.businessModel, employeeBand: twin.identity.employeeBand, objective: twin.objectives[0]?.type ?? "unknown", constraints: [twin.constraints.budgetBand, twin.constraints.implementationPace, ...twin.constraints.concerns], readiness: twin.readiness },
    scores: { digitalMaturity: diagnostic.digitalMaturity.value, aiReadiness: diagnostic.aiReadiness.value },
    painPoints: diagnostic.painPoints.slice(0, 5).map((item) => ({ id: item.id, title: item.title, priority: item.priority, evidenceRefs: item.evidenceIds })),
    recommendations: recommendations.recommendations.map((item) => ({ capabilityId: item.capabilityId, title: item.title, status: item.status, evidenceRefs: item.evidenceIds })),
    selectedScenario: {
      id: selected.id, title: selected.title, intent: selected.intent, budgetFit: selected.budgetFit, firstYearCost: selected.costs.firstYear,
      values: { operational: selected.value.operational, revenue: selected.value.revenue, avoidedRisk: selected.value.avoidedRisk, gross: selected.value.gross, net: selected.value.net },
      payback: selected.value.payback,
      interventions: selected.interventions.map((item) => ({ capabilityId: item.capabilityId, title: item.title, commitment: item.commitment, status: item.status, startMonth: item.startMonth, completionMonth: item.completionMonth, dependencies: item.dependencyCapabilityIds })),
      warnings: selected.warnings, exclusions: selected.value.exclusions, assumptionRefs,
    },
    evidenceAllowList: [...new Set(evidenceAllowList)],
  });
}
