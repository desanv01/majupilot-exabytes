import { budgetFit, calculateScenarioValue, addRanges, roundMoney } from "@/core/roi/calculate-roi";
import type { BusinessTwin } from "@/domain/business-twin";
import type { CapabilityRecommendation } from "@/domain/recommendations";
import { scenarioResultSchema, type EstimateRange, type ScenarioAssumptions, type ScenarioEvent, type ScenarioIntervention, type ScenarioRulePack, type ScenarioTemplateDefinition } from "@/domain/scenarios";

import { buildSensitivityTrace } from "./seeded-sensitivity";

const eventPriority: Record<ScenarioEvent["type"], number> = { scenario_started: 0, intervention_scheduled: 10, prerequisite_completed: 20, training_started: 30, cost_incurred: 40, milestone_delayed: 50, conditional_gate_blocked: 60, capability_activated: 70, adoption_changed: 80, benefit_realised: 90, risk_reduced: 100, scenario_completed: 110 };
const mapRange = (range: EstimateRange, multiplier: number): EstimateRange => ({ low: roundMoney(range.low * multiplier), base: roundMoney(range.base * multiplier), high: roundMoney(range.high * multiplier) });
const zeroRange = (): EstimateRange => ({ low: 0, base: 0, high: 0 });
const nullable = () => ({ low: null, base: null, high: null });
const followUpHours = { under_5: 2.5, "5_10": 7.5, "11_20": 15.5, "21_40": 30.5, over_40: 41 } as const;

function manualHours(twin: BusinessTwin) {
  const direct = twin.processes[0]?.manualHoursPerWeek;
  if (direct !== null && direct !== undefined) return { value: direct, source: "user_fact" as const, ref: "q3.manualHoursPerWeek" };
  const answer = twin.followUps.find((item) => item.questionId === "fu_manual_hours")?.answer;
  if (typeof answer === "string" && answer in followUpHours) return { value: followUpHours[answer as keyof typeof followUpHours], source: "derived_user_fact" as const, ref: "fu_manual_hours" };
  return { value: null, source: "user_fact" as const, ref: "q3.manualHoursPerWeek" };
}

export function deriveAssumptions(twin: BusinessTwin, template: ScenarioTemplateDefinition, committed: readonly CapabilityRecommendation[], conditional: readonly CapabilityRecommendation[], rules: ScenarioRulePack): ScenarioAssumptions {
  const aggregate = (key: "implementation" | "training" | "annualRecurring", items: readonly CapabilityRecommendation[], pace = false) => items.reduce((sum, item) => addRanges(sum, mapRange(rules.costTiers[item.relativeCostTier as 1 | 2 | 3 | 4][key], pace ? template.paceMultiplier : 1)), zeroRange());
  const implementation = aggregate("implementation", committed, true);
  const training = aggregate("training", committed, true);
  const annualRecurring = aggregate("annualRecurring", committed);
  const hours = manualHours(twin);
  const rangeAssumption = (key: string, unit: string, range: EstimateRange, rationale: string) => ({ key, unit, range, source: "planning_default" as const, sourceRef: "scenario-roi-model-1.0.0", rationale, editable: true });
  const nullableAssumption = (key: string, unit: string, rationale: string) => ({ key, unit, range: nullable(), source: "planning_default" as const, sourceRef: "not-supplied", rationale, editable: true });
  void conditional;
  return {
    costs: {
      implementation: rangeAssumption("implementation_cost", "RM", implementation, "Aggregated from committed relative cost tiers and the scenario pace multiplier."),
      training: rangeAssumption("training_cost", "RM", training, "Aggregated from committed relative cost tiers and the scenario pace multiplier."),
      annualRecurring: rangeAssumption("annual_recurring_cost", "RM/year", annualRecurring, "Aggregated annual recurring planning ranges for committed capabilities."),
    },
    operational: {
      manualHoursPerWeek: { key: "manual_hours_per_week", unit: "hours/week", range: hours.value === null ? nullable() : { low: hours.value, base: hours.value, high: hours.value }, source: hours.source, sourceRef: hours.ref, rationale: "Accepted manual-work evidence from the Business Twin.", editable: true },
      automatableShare: { ...rangeAssumption("automatable_share", "ratio", template.operational.automatableShare, "Scenario-specific share of evidenced manual work that may be addressable."), range: template.operational.automatableShare },
      adoption: { ...rangeAssumption("adoption", "ratio", template.operational.adoption, "Scenario-specific adoption range."), range: template.operational.adoption },
      loadedHourlyCost: rangeAssumption("loaded_hourly_cost", "RM/hour", { low: 15, base: 25, high: 35 }, "Editable planning default, not a wage claim."),
    },
    revenue: { addressableRevenue: nullableAssumption("addressable_revenue", "RM/year", "Revenue remains unestimated until supplied."), conversionChange: nullableAssumption("conversion_change", "ratio", "Revenue remains unestimated until supplied."), grossMargin: nullableAssumption("gross_margin", "ratio", "Revenue remains unestimated until supplied.") },
    avoidedRisk: { baselineIncidentProbability: nullableAssumption("baseline_incident_probability", "ratio", "Avoided risk remains unestimated until supplied."), incidentImpact: nullableAssumption("incident_impact", "RM", "Avoided risk remains unestimated until supplied."), riskReduction: nullableAssumption("risk_reduction", "ratio", "Avoided risk remains unestimated until supplied.") },
    sensitivity: { seed: template.seed, ...template.sensitivity },
  };
}

function schedule(recommendations: readonly CapabilityRecommendation[], commitments: ReadonlyMap<string, "committed" | "conditional">, template: ScenarioTemplateDefinition, rules: ScenarioRulePack): { interventions: ScenarioIntervention[]; dependencies: Array<{ capabilityId: CapabilityRecommendation["capabilityId"]; dependsOnCapabilityId: CapabilityRecommendation["capabilityId"]; policy: string }> } {
  const selectedIds = new Set(recommendations.map((item) => item.capabilityId));
  const dependencies = rules.dependencies.filter((item) => selectedIds.has(item.capabilityId) && selectedIds.has(item.dependsOnCapabilityId));
  const interventions: ScenarioIntervention[] = recommendations.map((recommendation) => {
    const commitment = commitments.get(recommendation.capabilityId)!;
    const phase = template.phaseSchedule[recommendation.roadmapPhase];
    const startMonth = commitment === "conditional" ? (template.conditionalPilotMonth ?? 7) : (phase?.startMonth ?? 12);
    const duration = phase?.durationMonths ?? 1;
    return { capabilityId: recommendation.capabilityId, title: recommendation.title, recommendationRank: recommendation.rank, recommendationStatus: recommendation.status, commitment, status: commitment === "conditional" ? "blocked" as const : phase ? "scheduled" as const : "deferred" as const, startMonth, completionMonth: startMonth + duration - 1, dependencyCapabilityIds: dependencies.filter((item) => item.capabilityId === recommendation.capabilityId).map((item) => item.dependsOnCapabilityId), prerequisiteChecks: recommendation.prerequisites.map(({ ruleId, label, status, explanation }) => ({ ruleId, label, status, explanation })) };
  });
  let changed = true;
  while (changed) {
    changed = false;
    for (const intervention of interventions) {
      for (const dependencyId of intervention.dependencyCapabilityIds) {
        const dependency = interventions.find((item) => item.capabilityId === dependencyId);
        if (dependency && intervention.startMonth <= dependency.completionMonth) {
          const duration = intervention.completionMonth - intervention.startMonth;
          intervention.startMonth = dependency.completionMonth + 1;
          intervention.completionMonth = intervention.startMonth + duration;
          changed = true;
        }
      }
      if (intervention.completionMonth > 12 && intervention.commitment === "committed") intervention.status = "deferred";
    }
  }
  return { interventions, dependencies };
}

export function runScenario(args: { scenarioId: string; template: ScenarioTemplateDefinition; recommendations: readonly CapabilityRecommendation[]; commitments: ReadonlyMap<string, "committed" | "conditional">; twin: BusinessTwin; rules: ScenarioRulePack; assumptions?: ScenarioAssumptions; eventId: () => ScenarioEvent["id"] }) {
  const { scenarioId, template, recommendations, commitments, twin, rules, eventId } = args;
  const { interventions, dependencies } = schedule(recommendations, commitments, template, rules);
  const committed = recommendations.filter((item) => commitments.get(item.capabilityId) === "committed");
  const conditional = recommendations.filter((item) => commitments.get(item.capabilityId) === "conditional");
  const assumptions = args.assumptions ?? deriveAssumptions(twin, template, committed, conditional, rules);
  const firstYear = addRanges(assumptions.costs.implementation.range, assumptions.costs.training.range, assumptions.costs.annualRecurring.range);
  const conditionalExpansionCost = conditional.length ? addRanges(
    conditional.reduce((sum, item) => addRanges(sum, mapRange(rules.costTiers[item.relativeCostTier as 1 | 2 | 3 | 4].implementation, template.paceMultiplier)), zeroRange()),
    conditional.reduce((sum, item) => addRanges(sum, mapRange(rules.costTiers[item.relativeCostTier as 1 | 2 | 3 | 4].training, template.paceMultiplier)), zeroRange()),
    conditional.reduce((sum, item) => addRanges(sum, rules.costTiers[item.relativeCostTier as 1 | 2 | 3 | 4].annualRecurring), zeroRange()),
  ) : null;
  const value = calculateScenarioValue(assumptions, firstYear);
  const events: ScenarioEvent[] = [{ id: eventId(), scenarioId, month: 1, type: "scenario_started", explanation: "The deterministic 12-month scenario begins." }];
  for (const intervention of interventions) {
    events.push({ id: eventId(), scenarioId, month: intervention.startMonth, type: "intervention_scheduled", capabilityId: intervention.capabilityId, explanation: `${intervention.title} is placed in the dependency-aware schedule.` });
    if (intervention.commitment === "conditional") events.push({ id: eventId(), scenarioId, month: template.conditionalGateMonth ?? 6, type: "conditional_gate_blocked", capabilityId: intervention.capabilityId, explanation: `Conditional gate blocked: ${intervention.prerequisiteChecks.filter((item) => item.status !== "met").map((item) => item.label).join(", ")}.` });
    else {
      events.push({ id: eventId(), scenarioId, month: intervention.startMonth, type: "training_started", capabilityId: intervention.capabilityId, explanation: `Training begins for ${intervention.title}.` });
      events.push({ id: eventId(), scenarioId, month: intervention.startMonth, type: "cost_incurred", capabilityId: intervention.capabilityId, explanation: "Committed planning cost begins; conditional expansion is excluded." });
      if (intervention.status !== "deferred") {
        events.push({ id: eventId(), scenarioId, month: intervention.completionMonth, type: "capability_activated", capabilityId: intervention.capabilityId, explanation: `${intervention.title} reaches its scheduled activation milestone.` });
        events.push({ id: eventId(), scenarioId, month: Math.min(12, intervention.completionMonth + 1), type: "benefit_realised", capabilityId: intervention.capabilityId, explanation: "Operational value may begin after activation under the visible adoption assumptions." });
      }
    }
  }
  events.push(...buildSensitivityTrace({ scenarioId, seed: assumptions.sensitivity.seed, delayProbability: assumptions.sensitivity.delayProbability, maximumDelayMonths: assumptions.sensitivity.maximumDelayMonths, adoptionVariation: assumptions.sensitivity.adoptionVariation, interventions, eventId }));
  events.push({ id: eventId(), scenarioId, month: 12, type: "scenario_completed", explanation: "The first-year comparison window closes." });
  events.sort((a, b) => a.month - b.month || eventPriority[a.type] - eventPriority[b.type] || (a.capabilityId ?? "").localeCompare(b.capabilityId ?? "") || a.id.localeCompare(b.id));
  const months = Array.from({ length: 12 }, (_, index) => { const month = index + 1; const activeCapabilityIds = interventions.filter((item) => item.commitment === "committed" && item.status !== "deferred" && item.completionMonth <= month).map((item) => item.capabilityId); return { month, activeCapabilityIds, incurredCost: month === 1 ? firstYear.base : 0, realisedBenefit: value.gross.status === "estimated" ? roundMoney(value.gross.range.base / 12) : 0, notes: events.filter((event) => event.month === month && ["milestone_delayed", "conditional_gate_blocked"].includes(event.type)).map((event) => event.explanation) }; });
  const latest = Math.max(0, ...interventions.filter((item) => item.commitment === "committed" && item.status !== "deferred").map((item) => item.completionMonth));
  return scenarioResultSchema.parse({ id: scenarioId, templateId: template.id, title: template.title, intent: template.intent, riskLevel: template.riskLevel, seed: assumptions.sensitivity.seed, interventions, assumptions, costs: { implementation: assumptions.costs.implementation.range, training: assumptions.costs.training.range, annualRecurring: assumptions.costs.annualRecurring.range, firstYear, conditionalExpansionCost }, value, budgetFit: budgetFit(firstYear, twin.constraints.budgetBand), months, events, dependencies, confidence: value.exclusions.length >= 2 ? "medium" : "high", warnings: [...interventions.filter((item) => item.status === "blocked").map((item) => `${item.title} remains conditional until all hard prerequisites are met.`), ...interventions.filter((item) => item.status === "deferred").map((item) => `${item.title} completes after month 12 and is deferred from first-year benefit.`)], timelineLabel: latest ? `Months 1–${latest}` : "No committed schedule" });
}
