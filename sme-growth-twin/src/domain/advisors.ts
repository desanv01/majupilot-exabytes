import { z } from "zod";

import { advisorReviewIdSchema, modelCallIdSchema } from "./ids";

export const ADVISOR_MODEL_VERSION = "1.0.0" as const;
export const ADVISOR_PROMPT_VERSION = "1.0.0" as const;
export const ADVISOR_SCHEMA_VERSION = "1.0.0" as const;

export const advisorIdSchema = z.enum(["growth", "operations", "finance", "cybersecurity", "change"]);
export const advisorPositionSchema = z.enum(["support", "support_with_conditions", "oppose", "insufficient_evidence"]);
export const claimSourceSchema = z.enum(["model_interpretation", "deterministic_fallback"]);

export const advisorDefinitionSchema = z.object({
  id: advisorIdSchema,
  label: z.string().trim().min(1).max(80),
  objective: z.string().trim().min(1).max(240),
  lens: z.array(z.string().trim().min(1).max(120)).min(1).max(6),
}).strict();

export const findingSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]{2,79}$/),
  topic: z.string().regex(/^[a-z0-9][a-z0-9_-]{2,79}$/),
  statement: z.string().trim().min(1).max(360),
  evidenceRefs: z.array(z.string().trim().min(1).max(160)).min(1).max(10),
  claimSource: claimSourceSchema,
}).strict();

export const adjustmentSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]{2,79}$/),
  topic: z.string().regex(/^[a-z0-9][a-z0-9_-]{2,79}$/),
  action: z.string().trim().min(1).max(360),
  targetRef: z.string().trim().min(1).max(160),
  evidenceRefs: z.array(z.string().trim().min(1).max(160)).min(1).max(10),
  claimSource: claimSourceSchema,
}).strict();

export const advisorReviewSchema = z.object({
  id: advisorReviewIdSchema,
  advisor: advisorIdSchema,
  position: advisorPositionSchema,
  headline: z.string().trim().min(1).max(180),
  support: z.array(findingSchema).max(8),
  concerns: z.array(findingSchema).max(8),
  missingEvidence: z.array(findingSchema).max(8),
  adjustments: z.array(adjustmentSchema).max(8),
  confidence: z.number().finite().min(0).max(1),
  origin: z.enum(["model", "deterministic_fallback"]),
  sourceRef: z.string().trim().min(1).max(120),
}).strict().superRefine((review, context) => {
  const ids = [...review.support, ...review.concerns, ...review.missingEvidence, ...review.adjustments].map((item) => item.id);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", path: ["support"], message: "Finding and adjustment IDs must be unique within a review" });
  const expected = review.origin === "model" ? "model_interpretation" : "deterministic_fallback";
  for (const item of [...review.support, ...review.concerns, ...review.missingEvidence, ...review.adjustments]) {
    if (item.claimSource !== expected) context.addIssue({ code: "custom", message: "Claim source must match review origin" });
  }
});

export const advisorReviewContextSchema = z.object({
  business: z.object({ sector: z.string().min(1), businessModel: z.string().min(1), employeeBand: z.string().min(1), objective: z.string().min(1), constraints: z.array(z.string()), readiness: z.record(z.string(), z.number().nullable()) }).strict(),
  scores: z.object({ digitalMaturity: z.number().nullable(), aiReadiness: z.number().nullable() }).strict(),
  painPoints: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), priority: z.number(), evidenceRefs: z.array(z.string()) }).strict()),
  recommendations: z.array(z.object({ capabilityId: z.string().min(1), title: z.string().min(1), status: z.string().min(1), evidenceRefs: z.array(z.string()) }).strict()),
  selectedScenario: z.object({
    id: z.string().min(1), title: z.string().min(1), intent: z.string().min(1), budgetFit: z.string().min(1),
    firstYearCost: z.object({ low: z.number(), base: z.number(), high: z.number() }).strict(),
    operationalValue: z.object({ status: z.string(), low: z.number().optional(), base: z.number().optional(), high: z.number().optional() }).strict(),
    payback: z.object({ status: z.string(), best: z.number().optional(), base: z.number().optional(), worst: z.number().optional() }).strict(),
    revenueStatus: z.string().min(1), avoidedRiskStatus: z.string().min(1),
    interventions: z.array(z.object({ capabilityId: z.string(), title: z.string(), commitment: z.string(), status: z.string(), startMonth: z.number(), completionMonth: z.number(), dependencies: z.array(z.string()) }).strict()),
    warnings: z.array(z.string()), exclusions: z.array(z.string()), assumptionRefs: z.array(z.string()),
  }).strict(),
  evidenceAllowList: z.array(z.string().min(1)).min(1),
}).strict();

export const modelCallRecordSchema = z.object({
  id: modelCallIdSchema,
  advisor: advisorIdSchema,
  provider: z.enum(["vercel_ai_gateway", "unavailable"]),
  model: z.string().min(1),
  promptVersion: z.literal(ADVISOR_PROMPT_VERSION),
  schemaVersion: z.literal(ADVISOR_SCHEMA_VERSION),
  latencyMs: z.number().int().nonnegative(),
  retryCount: z.number().int().min(0).max(1),
  status: z.enum(["success", "unavailable", "timeout", "provider_error", "invalid_output", "invalid_evidence"]),
  evidenceIds: z.array(z.string().min(1)),
  errorCategory: z.enum(["none", "configuration", "timeout", "provider", "validation", "evidence"]).optional(),
}).strict();

export const advisorPanelResponseSchema = z.object({
  reviews: z.array(advisorReviewSchema).length(5),
  modelCalls: z.array(modelCallRecordSchema).length(5),
}).strict().superRefine((panel, context) => {
  const roles = panel.reviews.map((item) => item.advisor);
  if (new Set(roles).size !== roles.length) context.addIssue({ code: "custom", path: ["reviews"], message: "Advisor roles must be unique" });
});

export const synthesisEntrySchema = z.object({ topic: z.string().min(1), statement: z.string().min(1), advisorIds: z.array(advisorIdSchema).min(1), evidenceRefs: z.array(z.string().min(1)).min(1) }).strict();
export const advisorSynthesisSchema = z.object({
  modelVersion: z.literal(ADVISOR_MODEL_VERSION),
  decision: z.enum(["proceed", "proceed_with_conditions", "revise", "insufficient_evidence"]),
  agreement: z.array(synthesisEntrySchema), disagreement: z.array(synthesisEntrySchema),
  conditions: z.array(synthesisEntrySchema), openQuestions: z.array(synthesisEntrySchema),
}).strict();

export type AdvisorId = z.infer<typeof advisorIdSchema>;
export type AdvisorDefinition = z.infer<typeof advisorDefinitionSchema>;
export type AdvisorReview = z.infer<typeof advisorReviewSchema>;
export type AdvisorReviewContext = z.infer<typeof advisorReviewContextSchema>;
export type ModelCallRecord = z.infer<typeof modelCallRecordSchema>;
export type AdvisorPanelResponse = z.infer<typeof advisorPanelResponseSchema>;
export type AdvisorSynthesis = z.infer<typeof advisorSynthesisSchema>;
