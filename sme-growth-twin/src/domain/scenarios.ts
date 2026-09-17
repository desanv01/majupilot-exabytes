import { z } from "zod";

import {
  assessmentSessionIdSchema,
  businessTwinIdSchema,
  diagnosticResultIdSchema,
  recommendationResultIdSchema,
  scenarioComparisonIdSchema,
  scenarioEventIdSchema,
} from "./ids";
import { capabilityIdSchema, RECOMMENDATION_CATALOGUE_VERSION, RECOMMENDATION_MODEL_VERSION, type CapabilityId, type RoadmapPhase } from "./recommendations";
import { PAIN_MODEL_VERSION, SCORE_MODEL_VERSION } from "./scoring";

export const SCENARIO_MODEL_VERSION = "1.0.0" as const;
export const ROI_MODEL_VERSION = "1.0.0" as const;

const finiteNumber = z.number().finite();
const nonNegative = finiteNumber.nonnegative();
const ratio = finiteNumber.min(0).max(1);
const month = z.number().int().min(1).max(12);

export const estimateRangeSchema = z.object({ low: nonNegative, base: nonNegative, high: nonNegative }).strict().superRefine((range, context) => {
  if (range.low > range.base || range.base > range.high) context.addIssue({ code: "custom", message: "Expected low <= base <= high" });
});
export const resultRangeSchema = z.object({ low: finiteNumber, base: finiteNumber, high: finiteNumber }).strict().superRefine((range, context) => {
  if (range.low > range.base || range.base > range.high) context.addIssue({ code: "custom", message: "Expected low <= base <= high" });
});
export const ratioRangeSchema = z.object({ low: ratio, base: ratio, high: ratio }).strict().superRefine((range, context) => {
  if (range.low > range.base || range.base > range.high) context.addIssue({ code: "custom", message: "Expected low <= base <= high" });
});
export const nullableEstimateRangeSchema = z.object({ low: nonNegative.nullable(), base: nonNegative.nullable(), high: nonNegative.nullable() }).strict().superRefine((range, context) => {
  const values = [range.low, range.base, range.high];
  if (values.every((value) => value === null)) return;
  if (values.some((value) => value === null)) return;
  if (range.low! > range.base! || range.base! > range.high!) context.addIssue({ code: "custom", message: "Expected low <= base <= high" });
});
export const nullableRatioRangeSchema = z.object({ low: ratio.nullable(), base: ratio.nullable(), high: ratio.nullable() }).strict().superRefine((range, context) => {
  const values = [range.low, range.base, range.high];
  if (values.every((value) => value === null)) return;
  if (values.some((value) => value === null)) return;
  if (range.low! > range.base! || range.base! > range.high!) context.addIssue({ code: "custom", message: "Expected low <= base <= high" });
});

export const assumptionSourceSchema = z.enum(["user_fact", "derived_user_fact", "planning_default", "user_override"]);
const assumptionBase = { key: z.string().min(1), unit: z.string().min(1), source: assumptionSourceSchema, sourceRef: z.string().min(1), rationale: z.string().min(1), editable: z.boolean() };
export const rangeAssumptionSchema = z.object({ ...assumptionBase, range: estimateRangeSchema }).strict();
export const ratioAssumptionSchema = z.object({ ...assumptionBase, range: ratioRangeSchema }).strict();
export const nullableRangeAssumptionSchema = z.object({ ...assumptionBase, range: nullableEstimateRangeSchema }).strict();
export const nullableRatioAssumptionSchema = z.object({ ...assumptionBase, range: nullableRatioRangeSchema }).strict();
export const scenarioAssumptionsSchema = z.object({
  costs: z.object({ implementation: rangeAssumptionSchema, training: rangeAssumptionSchema, annualRecurring: rangeAssumptionSchema }).strict(),
  operational: z.object({ manualHoursPerWeek: nullableRangeAssumptionSchema, automatableShare: ratioAssumptionSchema, adoption: ratioAssumptionSchema, loadedHourlyCost: rangeAssumptionSchema }).strict(),
  revenue: z.object({ addressableRevenue: nullableRangeAssumptionSchema, conversionChange: nullableRatioAssumptionSchema, grossMargin: nullableRatioAssumptionSchema }).strict(),
  avoidedRisk: z.object({ baselineIncidentProbability: nullableRatioAssumptionSchema, incidentImpact: nullableRangeAssumptionSchema, riskReduction: nullableRatioAssumptionSchema }).strict(),
  sensitivity: z.object({ seed: z.number().int().nonnegative(), delayProbability: ratio, maximumDelayMonths: z.number().int().min(0).max(12), adoptionVariation: ratio }).strict(),
}).strict();

export const scenarioTemplateIdSchema = z.enum(["lean_foundation", "balanced_growth", "accelerated_ai"]);
export const dependencySchema = z.object({ capabilityId: capabilityIdSchema, dependsOnCapabilityId: capabilityIdSchema, policy: z.string().min(1) }).strict();
export const prerequisiteCheckSchema = z.object({ ruleId: z.string().min(1), label: z.string().min(1), status: z.enum(["met", "unmet", "unknown"]), explanation: z.string().min(1) }).strict();
export const scenarioInterventionSchema = z.object({
  capabilityId: capabilityIdSchema,
  title: z.string().min(1),
  recommendationRank: z.number().int().positive(),
  recommendationStatus: z.enum(["why_now", "next", "why_later"]),
  commitment: z.enum(["committed", "conditional"]),
  status: z.enum(["scheduled", "deferred", "blocked"]),
  startMonth: month,
  completionMonth: z.number().int().min(1),
  dependencyCapabilityIds: z.array(capabilityIdSchema),
  prerequisiteChecks: z.array(prerequisiteCheckSchema),
}).strict();

export const scenarioEventTypeSchema = z.enum(["scenario_started", "intervention_scheduled", "prerequisite_completed", "training_started", "capability_activated", "adoption_changed", "cost_incurred", "benefit_realised", "risk_reduced", "milestone_delayed", "conditional_gate_blocked", "scenario_completed"]);
export const scenarioEventSchema = z.object({ id: scenarioEventIdSchema, scenarioId: z.string().min(1), month, type: scenarioEventTypeSchema, capabilityId: capabilityIdSchema.optional(), numericPayload: finiteNumber.optional(), explanation: z.string().min(1) }).strict();
export const monthlyStateSchema = z.object({ month, activeCapabilityIds: z.array(capabilityIdSchema), incurredCost: nonNegative, realisedBenefit: nonNegative, notes: z.array(z.string()) }).strict();

export const valueStreamSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("estimated"), range: resultRangeSchema, formula: z.string().min(1) }).strict(),
  z.object({ status: z.literal("not_estimated"), missingFields: z.array(z.string().min(1)).min(1), formula: z.string().min(1) }).strict(),
]);
export const paybackSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("estimated"), best: nonNegative, base: nonNegative, worst: nonNegative }).strict(),
  z.object({ status: z.literal("not_estimated") }).strict(),
]);
export const scenarioValueSchema = z.object({
  operational: valueStreamSchema,
  revenue: valueStreamSchema,
  avoidedRisk: valueStreamSchema,
  gross: valueStreamSchema,
  net: valueStreamSchema,
  payback: paybackSchema,
  exclusions: z.array(z.string().min(1)),
}).strict();
export const scenarioCostsSchema = z.object({ implementation: estimateRangeSchema, training: estimateRangeSchema, annualRecurring: estimateRangeSchema, firstYear: estimateRangeSchema, conditionalExpansionCost: estimateRangeSchema.nullable() }).strict();

export const scenarioResultSchema = z.object({
  id: z.string().min(1), templateId: scenarioTemplateIdSchema, title: z.string().min(1), intent: z.string().min(1), riskLevel: z.enum(["Low", "Medium", "Higher change"]), seed: z.number().int().nonnegative(),
  interventions: z.array(scenarioInterventionSchema).superRefine((items, context) => { const ids = items.map((item) => item.capabilityId); if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "Duplicate capabilities are not allowed" }); }),
  assumptions: scenarioAssumptionsSchema, costs: scenarioCostsSchema, value: scenarioValueSchema,
  budgetFit: z.enum(["within_range", "base_within", "only_low_within", "over", "unknown"]),
  months: z.array(monthlyStateSchema).length(12), events: z.array(scenarioEventSchema), dependencies: z.array(dependencySchema),
  confidence: z.enum(["low", "medium", "high"]), warnings: z.array(z.string()), timelineLabel: z.string().min(1),
}).strict();

export const scenarioComparisonSchema = z.object({
  id: scenarioComparisonIdSchema, assessmentSessionId: assessmentSessionIdSchema, businessTwinId: businessTwinIdSchema, twinRevision: z.number().int().positive(), diagnosticResultId: diagnosticResultIdSchema, recommendationResultId: recommendationResultIdSchema,
  sourceScoreModelVersion: z.literal(SCORE_MODEL_VERSION), sourcePainModelVersion: z.literal(PAIN_MODEL_VERSION), sourceRecommendationModelVersion: z.literal(RECOMMENDATION_MODEL_VERSION), sourceCatalogueVersion: z.literal(RECOMMENDATION_CATALOGUE_VERSION),
  scenarioModelVersion: z.literal(SCENARIO_MODEL_VERSION), roiModelVersion: z.literal(ROI_MODEL_VERSION), createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }), selectedScenarioId: z.string().optional(), scenarios: z.array(scenarioResultSchema).length(3),
}).strict();

export type EstimateRange = z.infer<typeof estimateRangeSchema>;
export type NullableEstimateRange = z.infer<typeof nullableEstimateRangeSchema>;
export type ScenarioAssumptions = z.infer<typeof scenarioAssumptionsSchema>;
export type ScenarioIntervention = z.infer<typeof scenarioInterventionSchema>;
export type ScenarioEvent = z.infer<typeof scenarioEventSchema>;
export type ScenarioResult = z.infer<typeof scenarioResultSchema>;
export type ScenarioComparison = z.infer<typeof scenarioComparisonSchema>;
export type ScenarioTemplateId = z.infer<typeof scenarioTemplateIdSchema>;

export interface ScenarioTemplateDefinition {
  id: ScenarioTemplateId;
  title: string;
  intent: string;
  riskLevel: "Low" | "Medium" | "Higher change";
  paceMultiplier: number;
  seed: number;
  maximumCommitted: number;
  phaseSchedule: Record<RoadmapPhase, { startMonth: number; durationMonths: number } | null>;
  conditionalGateMonth?: number;
  conditionalPilotMonth?: number;
  operational: { automatableShare: EstimateRange; adoption: EstimateRange };
  sensitivity: { delayProbability: number; maximumDelayMonths: number; adoptionVariation: number };
}
export interface ScenarioRulePack {
  templates: readonly ScenarioTemplateDefinition[];
  costTiers: Readonly<Record<1 | 2 | 3 | 4, { implementation: EstimateRange; training: EstimateRange; annualRecurring: EstimateRange }>>;
  dependencies: readonly { capabilityId: CapabilityId; dependsOnCapabilityId: CapabilityId; policy: string }[];
}
