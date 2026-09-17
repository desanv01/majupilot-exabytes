import type { EstimateRange, ScenarioRulePack } from "@/domain/scenarios";

const range = (low: number, base: number, high: number): EstimateRange => ({ low, base, high });

export const EXABYTES_SCENARIO_RULES_1_0_0: ScenarioRulePack = {
  templates: [
    { id: "lean_foundation", title: "Lean Foundation", intent: "Establish essential foundations with the lowest implementation pace and change load.", riskLevel: "Low", paceMultiplier: 0.9, seed: 104729, maximumCommitted: 3, selection: { whyNow: { phases: ["Foundation"] }, addHighestEligibleIfMissing: true, addHighestNextIfMissing: false, conditionalCapabilityIds: [] }, phaseSchedule: { Foundation: { startMonth: 1, durationMonths: 2 }, Connect: { startMonth: 3, durationMonths: 3 }, Optimize: null }, operational: { automatableShare: range(.15, .25, .35), adoption: range(.60, .75, .85) }, sensitivity: { delayProbability: .10, maximumDelayMonths: 1, adoptionVariation: .05 } },
    { id: "balanced_growth", title: "Balanced Growth", intent: "Sequence foundations and customer growth with a manageable delivery pace.", riskLevel: "Medium", paceMultiplier: 1, seed: 130363, maximumCommitted: 4, selection: { whyNow: "all", addHighestEligibleIfMissing: false, addHighestNextIfMissing: true, conditionalCapabilityIds: [] }, phaseSchedule: { Foundation: { startMonth: 1, durationMonths: 2 }, Connect: { startMonth: 2, durationMonths: 3 }, Optimize: { startMonth: 5, durationMonths: 3 } }, operational: { automatableShare: range(.30, .45, .60), adoption: range(.65, .80, .90) }, sensitivity: { delayProbability: .20, maximumDelayMonths: 2, adoptionVariation: .10 } },
    { id: "accelerated_ai", title: "Accelerated AI", intent: "Move faster across accepted capabilities while keeping AI behind its readiness gate.", riskLevel: "Higher change", paceMultiplier: 1.2, seed: 155921, maximumCommitted: 4, selection: { whyNow: "all", addHighestEligibleIfMissing: false, addHighestNextIfMissing: true, conditionalCapabilityIds: ["governed_ai_automation"] }, phaseSchedule: { Foundation: { startMonth: 1, durationMonths: 1 }, Connect: { startMonth: 1, durationMonths: 3 }, Optimize: { startMonth: 4, durationMonths: 4 } }, conditionalGateMonth: 6, conditionalPilotMonth: 7, operational: { automatableShare: range(.35, .55, .70), adoption: range(.55, .75, .88) }, sensitivity: { delayProbability: .35, maximumDelayMonths: 3, adoptionVariation: .15 } },
  ],
  costTiers: {
    1: { implementation: range(500, 1000, 1500), training: range(300, 600, 900), annualRecurring: range(600, 1200, 1800) },
    2: { implementation: range(1500, 3000, 4500), training: range(500, 1000, 1500), annualRecurring: range(1200, 2400, 3600) },
    3: { implementation: range(3000, 6000, 9000), training: range(1000, 2000, 3000), annualRecurring: range(2400, 4800, 7200) },
    4: { implementation: range(6000, 12000, 18000), training: range(2000, 4000, 6000), annualRecurring: range(4800, 9600, 14400) },
  },
  dependencies: [
    { capabilityId: "governed_ai_automation", dependsOnCapabilityId: "shared_customer_operations", policy: "Governed AI starts only after shared customer operations is complete when both are present." },
  ],
};
