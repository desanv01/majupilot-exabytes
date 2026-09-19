import { z } from "zod";

import { coreAnswersSchema } from "./assessment";
import { persistenceUuidSchema } from "./persistence";

export const AI_PROMPT_VERSION = "phase-c-follow-up-1.0.0";
export const AI_SCHEMA_VERSION = "phase-c-follow-up-1.0.0";

export const aiExecutionModeSchema = z.enum(["required", "preferred", "disabled"]);
export type AiExecutionMode = z.infer<typeof aiExecutionModeSchema>;

export const aiErrorCodeSchema = z.enum([
  "AI_REQUIRED_UNAVAILABLE",
  "AI_INVALID_OUTPUT",
  "AI_BUDGET_EXCEEDED",
  "AI_TIMEOUT",
]);
export type AiErrorCode = z.infer<typeof aiErrorCodeSchema>;

export const followUpIntentSchema = z.enum([
  "manual_hours",
  "customer_record_location",
  "backup_frequency",
  "sales_channel",
  "ai_usage",
  "change_barrier",
  "roi_revenue_input",
  "roi_risk_input",
]);
export type FollowUpIntent = z.infer<typeof followUpIntentSchema>;

export const followUpProposalSchema = z
  .object({
    intent: followUpIntentSchema,
    question: z.string().trim().min(8).max(220),
    whyItMatters: z.string().trim().min(8).max(280),
    expectedAnswerType: z.enum(["choice", "number", "short_text"]),
    allowedValues: z.array(z.string().trim().min(1).max(80)).min(2).max(12).optional(),
    evidenceRefs: z.array(persistenceUuidSchema).max(24),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.expectedAnswerType === "choice" && !value.allowedValues) {
      context.addIssue({ code: "custom", path: ["allowedValues"], message: "Choice questions require allowed values" });
    }
    if (value.expectedAnswerType !== "choice" && value.allowedValues) {
      context.addIssue({ code: "custom", path: ["allowedValues"], message: "Only choice questions may include allowed values" });
    }
  });
export type FollowUpProposal = z.infer<typeof followUpProposalSchema>;

export const followUpRequestSchema = z
  .object({
    organizationId: persistenceUuidSchema.optional(),
    assessmentSessionId: persistenceUuidSchema,
    answers: coreAnswersSchema,
    answeredIntents: z.array(followUpIntentSchema).max(8).default([]),
    evidenceRefs: z.array(persistenceUuidSchema).max(24).default([]),
  })
  .strict();
export type FollowUpRequest = z.infer<typeof followUpRequestSchema>;

export const followUpResponseSchema = z
  .object({
    state: z.enum(["live", "deterministic_fallback", "ai_disabled", "complete"]),
    proposal: followUpProposalSchema.nullable(),
    requiresConfirmation: z.literal(true),
    model: z.string().min(1).max(160).optional(),
  })
  .strict();
export type FollowUpResponse = z.infer<typeof followUpResponseSchema>;

export const modelCallTelemetrySchema = z
  .object({
    id: persistenceUuidSchema,
    assessmentSessionId: persistenceUuidSchema,
    operation: z.enum(["assessment_follow_up", "advisor_review", "ai_preflight"]),
    provider: z.enum(["vercel_ai_gateway", "none"]),
    model: z.string().min(1).max(160),
    schemaVersion: z.string().min(1).max(64),
    promptVersion: z.string().min(1).max(64),
    startedAt: z.iso.datetime({ offset: true }),
    completedAt: z.iso.datetime({ offset: true }),
    latencyMs: z.number().int().min(0),
    inputTokens: z.number().int().min(0).nullable(),
    outputTokens: z.number().int().min(0).nullable(),
    estimatedCost: z.number().min(0).nullable(),
    retryCount: z.number().int().min(0).max(1),
    outcome: z.enum(["success", "deterministic_fallback", "ai_disabled", "failed"]),
    fallbackReason: z.string().min(1).max(80).nullable(),
    evidenceRefs: z.array(persistenceUuidSchema).max(24),
  })
  .strict();
export type ModelCallTelemetry = z.infer<typeof modelCallTelemetrySchema>;

export class AiExecutionError extends Error {
  constructor(
    readonly code: AiErrorCode,
    readonly httpStatus: number,
    readonly retryable: boolean,
  ) {
    super(code);
    this.name = "AiExecutionError";
  }
}
