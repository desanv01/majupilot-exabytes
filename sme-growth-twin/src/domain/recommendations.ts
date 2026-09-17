import { z } from "zod";

import {
  assessmentSessionIdSchema,
  businessTwinIdSchema,
  diagnosticResultIdSchema,
  evidenceIdSchema,
  recommendationResultIdSchema,
} from "./ids";
import { PAIN_MODEL_VERSION, SCORE_MODEL_VERSION } from "./scoring";

export const RECOMMENDATION_MODEL_VERSION = "1.0.0" as const;
export const RECOMMENDATION_CATALOGUE_VERSION = "1.0.0" as const;

export const capabilityIdSchema = z.enum([
  "shared_customer_operations",
  "protected_business_continuity",
  "professional_team_collaboration",
  "measurable_digital_growth",
  "protected_web_presence",
  "scalable_cloud_operations",
  "governed_ai_automation",
]);
export const gapIdSchema = z.enum([
  "crm",
  "data_foundation",
  "workflow_automation",
  "backup_recovery",
  "cybersecurity",
  "business_email",
  "cloud_productivity",
  "process_standardization",
  "digital_presence",
  "marketing_measurement",
  "analytics",
  "infrastructure_scaling",
  "ai_governance",
]);
export const objectiveIdSchema = z.enum([
  "increase_revenue",
  "acquire_customers",
  "improve_retention",
  "reduce_cost",
  "increase_productivity",
  "strengthen_resilience",
  "launch_ai_capability",
]);
export const roadmapPhaseSchema = z.enum(["Foundation", "Connect", "Optimize"]);
export const tierSchema = z.number().int().min(1).max(4);

export const capabilityDefinitionSchema = z.object({
  id: capabilityIdSchema,
  title: z.string().min(1),
  outcome: z.string().min(1),
  expectedImpact: z.string().min(1),
  primaryGapIds: z.array(gapIdSchema),
  supportingGapIds: z.array(gapIdSchema),
  costTier: tierSchema,
  effortTier: tierSchema,
  applicableObjectives: z.array(objectiveIdSchema),
  risks: z.array(z.string().min(1)),
  prerequisiteRules: z.array(z.string().min(1)),
  defaultRoadmapPhase: roadmapPhaseSchema,
}).strict();

export const offeringSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_]+$/),
  provider: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
  capabilityIds: z.array(capabilityIdSchema).min(1),
  approvedFactSummary: z.string().min(1),
  relativeCostTier: tierSchema,
  pricingTreatment: z.literal("verify_current_quote"),
  sourceUrl: z.url().refine((value) => value.startsWith("https://"), "Expected an HTTPS source"),
  sourceLabel: z.string().min(1),
  verifiedAt: z.iso.date(),
  catalogueVersion: z.literal(RECOMMENDATION_CATALOGUE_VERSION),
}).strict();

export const offeringMappingSchema = z.object({
  capabilityId: capabilityIdSchema,
  offeringId: z.string().min(1),
  selectionRuleId: z.string().min(1),
  mappingReason: z.string().min(1),
}).strict();

export const offeringSelectionConditionSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("capability_state"),
    key: z.string().min(1),
    operator: z.enum(["in", "not_in"]),
    values: z.array(z.enum(["not_used", "informal", "active", "unknown"])).min(1),
  }).strict(),
  z.object({
    source: z.literal("constraint_concern"),
    operator: z.enum(["in", "not_in"]),
    values: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({
    source: z.literal("challenge"),
    operator: z.enum(["in", "not_in"]),
    values: z.array(z.string().min(1)).min(1),
  }).strict(),
]);

export const offeringSelectionRuleSchema = z.object({
  id: z.string().min(1),
  capabilityId: capabilityIdSchema,
  offeringId: z.string().min(1),
  priority: z.number().int(),
  conditions: z.array(offeringSelectionConditionSchema),
  alternativeOfferingIds: z.array(z.string().min(1)),
}).strict();

export const offeringSelectionPolicySchema = z.object({
  rules: z.array(offeringSelectionRuleSchema),
}).strict().superRefine((policy, context) => {
  const ids = new Set<string>();
  for (const [index, rule] of policy.rules.entries()) {
    if (ids.has(rule.id)) context.addIssue({ code: "custom", path: ["rules", index, "id"], message: "Selection rule IDs must be unique" });
    ids.add(rule.id);
  }
});

export const catalogueSchema = z.object({
  version: z.literal(RECOMMENDATION_CATALOGUE_VERSION),
  offerings: z.array(offeringSchema),
  mappings: z.array(offeringMappingSchema),
}).strict().superRefine((catalogue, context) => {
  const ids = new Set<string>();
  for (const [index, offering] of catalogue.offerings.entries()) {
    if (ids.has(offering.id)) context.addIssue({ code: "custom", path: ["offerings", index, "id"], message: "Offering IDs must be unique" });
    ids.add(offering.id);
  }
  for (const [index, mapping] of catalogue.mappings.entries()) {
    const offering = catalogue.offerings.find((item) => item.id === mapping.offeringId);
    if (!offering || !offering.active || !offering.capabilityIds.includes(mapping.capabilityId)) {
      context.addIssue({ code: "custom", path: ["mappings", index], message: "Mapping must reference an active offering that supports the capability" });
    }
  }
});

export const componentScoresSchema = z.object({
  painPointFit: z.number().min(0).max(100),
  prerequisiteReadiness: z.number().min(0).max(100),
  budgetFit: z.number().min(0).max(100),
  timeToValue: z.number().min(0).max(100),
  riskFit: z.number().min(0).max(100),
  dataReadiness: z.number().min(0).max(100),
}).strict();

export const prerequisiteResultSchema = z.object({
  ruleId: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["met", "unmet", "unknown"]),
  hard: z.boolean(),
  explanation: z.string().min(1),
  unlockAction: z.string().min(1),
  evidenceIds: z.array(evidenceIdSchema),
}).strict();

export const mappedOfferingSchema = offeringSchema.pick({
  id: true,
  provider: true,
  name: true,
  approvedFactSummary: true,
  relativeCostTier: true,
  pricingTreatment: true,
  sourceUrl: true,
  sourceLabel: true,
  verifiedAt: true,
  catalogueVersion: true,
}).extend({
  selectionRuleId: z.string().min(1),
  mappingReason: z.string().min(1),
  futureFit: z.boolean(),
}).strict();

export const capabilityRecommendationSchema = z.object({
  rank: z.number().int().positive(),
  capabilityId: capabilityIdSchema,
  title: z.string().min(1),
  outcome: z.string().min(1),
  fitScore: z.number().min(0).max(100),
  componentScores: componentScoresSchema,
  status: z.enum(["why_now", "next", "why_later"]),
  whySelected: z.string().min(1),
  whyNowOrLater: z.string().min(1),
  addressedPainPointIds: z.array(z.string().min(1)),
  evidenceIds: z.array(evidenceIdSchema),
  prerequisites: z.array(prerequisiteResultSchema),
  expectedImpact: z.string().min(1),
  effortTier: tierSchema,
  relativeCostTier: tierSchema,
  timeToValueTier: tierSchema,
  risks: z.array(z.string().min(1)),
  roadmapPhase: roadmapPhaseSchema,
  mappedOffering: mappedOfferingSchema.optional(),
  alternativeOfferingIds: z.array(z.string().min(1)),
}).strict();

export const recommendationResultSchema = z.object({
  id: recommendationResultIdSchema,
  assessmentSessionId: assessmentSessionIdSchema,
  businessTwinId: businessTwinIdSchema,
  twinRevision: z.number().int().positive(),
  diagnosticResultId: diagnosticResultIdSchema,
  sourceScoreModelVersion: z.literal(SCORE_MODEL_VERSION),
  sourcePainModelVersion: z.literal(PAIN_MODEL_VERSION),
  recommendationModelVersion: z.literal(RECOMMENDATION_MODEL_VERSION),
  catalogueVersion: z.literal(RECOMMENDATION_CATALOGUE_VERSION),
  generatedAt: z.iso.datetime({ offset: true }),
  recommendations: z.array(capabilityRecommendationSchema),
}).strict();

export type CapabilityId = z.infer<typeof capabilityIdSchema>;
export type RoadmapPhase = z.infer<typeof roadmapPhaseSchema>;
export type GapId = z.infer<typeof gapIdSchema>;
export type CapabilityDefinition = z.infer<typeof capabilityDefinitionSchema>;
export type Offering = z.infer<typeof offeringSchema>;
export type OfferingMapping = z.infer<typeof offeringMappingSchema>;
export type OfferingSelectionCondition = z.infer<typeof offeringSelectionConditionSchema>;
export type OfferingSelectionRule = z.infer<typeof offeringSelectionRuleSchema>;
export type OfferingSelectionPolicy = z.infer<typeof offeringSelectionPolicySchema>;
export type Catalogue = z.infer<typeof catalogueSchema>;
export type ComponentScores = z.infer<typeof componentScoresSchema>;
export type CapabilityRecommendation = z.infer<typeof capabilityRecommendationSchema>;
export type RecommendationResult = z.infer<typeof recommendationResultSchema>;
