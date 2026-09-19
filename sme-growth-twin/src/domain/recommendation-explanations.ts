import { z } from "zod";

import { persistenceUuidSchema } from "./persistence";
import { capabilityIdSchema, type CapabilityRecommendation, type Offering } from "./recommendations";

export const RECOMMENDATION_EXPLANATION_SCHEMA_VERSION = "phase-d-explanation-1.0.0";
export const RECOMMENDATION_EXPLANATION_PROMPT_VERSION = "phase-d-explanation-1.0.0";

export const explanationCitationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("evidence"), id: persistenceUuidSchema }).strict(),
  z.object({ type: z.literal("recommendation"), id: persistenceUuidSchema }).strict(),
  z.object({ type: z.literal("catalogue_source"), id: z.string().regex(/^[A-Z0-9][A-Z0-9_-]+$/) }).strict(),
]);

const citedStatementSchema = z.object({
  text: z.string().trim().min(8).max(420),
  citations: z.array(explanationCitationSchema).min(1).max(12),
}).strict();

export const recommendationExplanationSchema = z.object({
  recommendationId: persistenceUuidSchema,
  capabilityId: capabilityIdSchema,
  rationale: citedStatementSchema,
  observedEvidence: z.array(z.object({
    evidenceId: persistenceUuidSchema,
    observation: z.string().trim().min(3).max(280),
    citations: z.array(explanationCitationSchema).min(1).max(6),
  }).strict()).min(1).max(12),
  expectedOperationalChange: citedStatementSchema,
  timing: z.object({ status: z.enum(["why_now", "next", "why_later"]), explanation: citedStatementSchema }).strict(),
  adoptionRisk: citedStatementSchema,
  firstSuccessMeasure: citedStatementSchema,
  consultantValidationQuestion: citedStatementSchema,
  counterfactualAlternative: z.object({ offeringId: z.string().min(1).nullable(), explanation: citedStatementSchema }).strict(),
}).strict();

export const recommendationExplanationRequestSchema = z.object({
  organizationId: persistenceUuidSchema.optional(),
  assessmentSessionId: persistenceUuidSchema,
  recommendationRunId: persistenceUuidSchema,
  capabilityId: capabilityIdSchema,
  evidenceRefs: z.array(persistenceUuidSchema).min(1).max(24),
}).strict();

export const recommendationExplanationResponseSchema = z.object({
  state: z.enum(["live", "deterministic_fallback", "ai_disabled"]),
  explanation: recommendationExplanationSchema.nullable(),
  model: z.string().min(1).max(160).optional(),
}).strict();

export type ExplanationCitation = z.infer<typeof explanationCitationSchema>;
export type RecommendationExplanation = z.infer<typeof recommendationExplanationSchema>;
export type RecommendationExplanationRequest = z.infer<typeof recommendationExplanationRequestSchema>;
export type RecommendationExplanationResponse = z.infer<typeof recommendationExplanationResponseSchema>;
export interface RecommendationExplanationContext {
  recommendationId: string;
  recommendation: CapabilityRecommendation;
  evidence: Array<{ id: string; sourceRef: string; normalizedValue: unknown }>;
  catalogueSources: Array<Pick<Offering, "id" | "name" | "sourceReferenceId" | "approvedFactSummary">>;
}
