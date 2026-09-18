import { z } from "zod";

import { advisorReviewIdSchema, modelCallIdSchema } from "./ids";

export const ADVISOR_MODEL_VERSION = "1.0.0" as const;
export const ADVISOR_PROMPT_VERSION = "1.0.0" as const;
export const ADVISOR_SCHEMA_VERSION = "1.0.0" as const;

export const FROZEN_ADVISOR_ORDER = ["growth", "operations", "finance", "cybersecurity", "change"] as const;
export const advisorIdSchema = z.enum(FROZEN_ADVISOR_ORDER);
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

const boundedRef = z.string().trim().min(1).max(160);
const boundedText = z.string().trim().min(1).max(500);
const contextRangeSchema = z.object({ low: z.number().finite(), base: z.number().finite(), high: z.number().finite() }).strict();
const reviewValueStreamSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("estimated"), range: contextRangeSchema, formula: boundedText }).strict(),
  z.object({ status: z.literal("not_estimated"), missingFields: z.array(boundedText).min(1).max(12), formula: boundedText }).strict(),
]);
const reviewPaybackSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("estimated"), best: z.number().finite().nonnegative(), base: z.number().finite().nonnegative(), worst: z.number().finite().nonnegative() }).strict(),
  z.object({ status: z.literal("not_estimated") }).strict(),
]);

export const advisorReviewContextSchema = z.object({
  business: z.object({
    sector: boundedText, businessModel: boundedText, employeeBand: boundedText, objective: boundedText,
    constraints: z.array(boundedText).max(12),
    readiness: z.record(z.string().min(1).max(60), z.number().finite().min(1).max(5).nullable()).refine((value) => Object.keys(value).length <= 10, "Too many readiness fields"),
  }).strict(),
  scores: z.object({ digitalMaturity: z.number().finite().min(0).max(100).nullable(), aiReadiness: z.number().finite().min(0).max(100).nullable() }).strict(),
  painPoints: z.array(z.object({ id: boundedRef, title: boundedText, priority: z.number().finite().min(0).max(100), evidenceRefs: z.array(boundedRef).max(10) }).strict()).max(5),
  recommendations: z.array(z.object({ capabilityId: boundedRef, title: boundedText, status: boundedText, evidenceRefs: z.array(boundedRef).max(30) }).strict()).max(20),
  selectedScenario: z.object({
    id: boundedRef, title: boundedText, intent: boundedText, budgetFit: boundedText,
    firstYearCost: contextRangeSchema,
    values: z.object({ operational: reviewValueStreamSchema, revenue: reviewValueStreamSchema, avoidedRisk: reviewValueStreamSchema, gross: reviewValueStreamSchema, net: reviewValueStreamSchema }).strict(),
    payback: reviewPaybackSchema,
    interventions: z.array(z.object({ capabilityId: boundedRef, title: boundedText, commitment: boundedText, status: boundedText, startMonth: z.number().int().min(1).max(12), completionMonth: z.number().int().min(1).max(24), dependencies: z.array(boundedRef).max(12) }).strict()).max(20),
    warnings: z.array(boundedText).max(30), exclusions: z.array(boundedText).max(30), assumptionRefs: z.array(boundedRef).max(40),
  }).strict(),
  evidenceAllowList: z.array(boundedRef).min(1).max(250),
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
  const reviewRoles = panel.reviews.map((item) => item.advisor);
  const callRoles = panel.modelCalls.map((item) => item.advisor);
  if (new Set(reviewRoles).size !== reviewRoles.length) context.addIssue({ code: "custom", path: ["reviews"], message: "Advisor roles must be unique" });
  if (new Set(callRoles).size !== callRoles.length) context.addIssue({ code: "custom", path: ["modelCalls"], message: "Model-call roles must be unique" });
  for (const [index, expected] of FROZEN_ADVISOR_ORDER.entries()) {
    const review = panel.reviews[index]; const call = panel.modelCalls[index];
    if (review?.advisor !== expected) context.addIssue({ code: "custom", path: ["reviews", index, "advisor"], message: "Reviews must use the frozen role order" });
    if (call?.advisor !== expected) context.addIssue({ code: "custom", path: ["modelCalls", index, "advisor"], message: "Model calls must use the frozen role order" });
    if (review && call && review.advisor !== call.advisor) context.addIssue({ code: "custom", path: ["modelCalls", index, "advisor"], message: "Review and model-call roles must align" });
    if (review && call && ((call.status === "success") !== (review.origin === "model"))) context.addIssue({ code: "custom", path: ["modelCalls", index, "status"], message: "Model success must align with model review origin" });
  }
});

export const synthesisPerspectiveSchema = z.object({
  kind: z.enum(["support", "concern", "condition", "missing_evidence"]),
  statement: z.string().min(1), advisorIds: z.array(advisorIdSchema).min(1), evidenceRefs: z.array(z.string().min(1)).min(1),
}).strict();
export const synthesisEntrySchema = z.object({ topic: z.string().min(1), perspectives: z.array(synthesisPerspectiveSchema).min(1) }).strict();
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
