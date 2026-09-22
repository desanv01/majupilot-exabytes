import { z } from "zod";

import { persistenceUuidSchema } from "./persistence";

export const COPILOT_SCHEMA_VERSION = "phase-g-copilot-1.0.0" as const;
export const COPILOT_PROMPT_VERSION = "phase-g-copilot-1.0.0" as const;

export const copilotExecutionStateSchema = z.enum([
  "live",
  "deterministic_fallback",
  "ai_disabled",
  "failed",
]);

export const copilotReadToolNameSchema = z.enum([
  "getBusinessTwinSummary",
  "getEvidenceForClaim",
  "explainDigitalMaturity",
  "explainAiReadiness",
  "listPainPoints",
  "listRecommendations",
  "compareScenarios",
  "searchExabytesCatalogue",
  "getBlueprint",
  "getReportMetadata",
  "getLeadStatus",
  "getAcceptedConsultantNotes",
  "searchUploadedEvidence",
  "getDocumentExcerpt",
]);

export const copilotWriteToolNameSchema = z.enum([
  "recalculateScenario",
  "collectMissingRoiInput",
  "draftConsultantNote",
  "acceptConsultantNote",
  "generateBlueprintReport",
  "requestConsultation",
]);

export const copilotToolNameSchema = z.union([copilotReadToolNameSchema, copilotWriteToolNameSchema]);
export type CopilotReadToolName = z.infer<typeof copilotReadToolNameSchema>;
export type CopilotWriteToolName = z.infer<typeof copilotWriteToolNameSchema>;

const optionalArtifactIds = {
  businessTwinId: persistenceUuidSchema.optional(),
  evidenceId: persistenceUuidSchema.optional(),
  diagnosticRunId: persistenceUuidSchema.optional(),
  recommendationRunId: persistenceUuidSchema.optional(),
  scenarioRevisionId: persistenceUuidSchema.optional(),
  blueprintId: persistenceUuidSchema.optional(),
  reportArtifactId: persistenceUuidSchema.optional(),
  leadId: persistenceUuidSchema.optional(),
  query: z.string().trim().min(2).max(500).optional(),
  maxResults: z.number().int().min(1).max(8).optional(),
  relevanceThreshold: z.number().min(0.4).max(0.95).optional(),
  documentId: persistenceUuidSchema.optional(),
  chunkId: persistenceUuidSchema.optional(),
};

export const copilotReadToolInputSchema = z.object(optionalArtifactIds).strict();
export type CopilotReadToolInput = z.infer<typeof copilotReadToolInputSchema>;
export const copilotReadToolInputSchemas = {
  searchUploadedEvidence: z.object({ query: z.string().trim().min(2).max(500), maxResults: z.number().int().min(1).max(8).default(5), relevanceThreshold: z.number().min(0.4).max(0.95).default(0.62) }).strict(),
  getDocumentExcerpt: z.object({ documentId: persistenceUuidSchema, chunkId: persistenceUuidSchema }).strict(),
} as const;

const boundedJson = z.record(z.string().max(80), z.unknown()).superRefine((value, context) => {
  if (JSON.stringify(value).length > 24_000) context.addIssue({ code: "custom", message: "Payload too large" });
});

export const copilotWriteToolInputSchemas = {
  recalculateScenario: z.object({ scenarioRevisionId: persistenceUuidSchema, assumptions: boundedJson, idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/) }).strict(),
  collectMissingRoiInput: z.object({ scenarioRevisionId: persistenceUuidSchema, stream: z.enum(["revenue", "avoidedRisk"]), assumptions: boundedJson, idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/) }).strict(),
  draftConsultantNote: z.object({ organizationId: persistenceUuidSchema, leadId: persistenceUuidSchema.optional(), blueprintId: persistenceUuidSchema, evidenceIds: z.array(persistenceUuidSchema).max(24).default([]), requestId: z.string().min(8).max(128) }).strict(),
  acceptConsultantNote: z.object({ organizationId: persistenceUuidSchema, draftNoteId: persistenceUuidSchema, body: z.string().trim().min(1).max(8_000), requestId: z.string().min(8).max(128) }).strict(),
  generateBlueprintReport: z.object({ blueprintId: persistenceUuidSchema, locale: z.literal("en-MY").default("en-MY"), acceptedNoteIds: z.array(persistenceUuidSchema).max(50).default([]) }).strict(),
  requestConsultation: z.object({
    blueprintId: persistenceUuidSchema,
    blueprintRevision: z.number().int().positive(),
    reportArtifactId: persistenceUuidSchema,
    reportContentSha256: z.string().regex(/^[a-f0-9]{64}$/),
    contactConsentId: persistenceUuidSchema,
    reportConsentId: persistenceUuidSchema,
    idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/),
    contact: z.object({ name: z.string().trim().min(2).max(100), businessName: z.string().trim().min(2).max(140), email: z.email().max(254), phone: z.string().trim().max(32).regex(/^[+()\-\s0-9]*$/).optional(), urgency: z.enum(["within_30_days", "one_to_three_months", "three_to_six_months", "exploring"]) }).strict(),
    region: z.string().trim().min(2).max(80).optional(),
    preferredLanguage: z.string().trim().min(2).max(80).optional(),
  }).strict(),
} as const;

export const createCopilotSessionSchema = z.object({
  organizationId: persistenceUuidSchema.optional(),
  assessmentSessionId: persistenceUuidSchema,
  businessTwinId: persistenceUuidSchema.optional(),
  blueprintId: persistenceUuidSchema.optional(),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/),
}).strict();
export type CreateCopilotSession = z.infer<typeof createCopilotSessionSchema>;

export const copilotSessionSchema = z.object({
  id: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  businessTwinId: persistenceUuidSchema.nullable(),
  blueprintId: persistenceUuidSchema.nullable(),
  status: z.enum(["active", "closed"]),
  nextSequence: z.number().int().positive(),
  schemaVersion: z.literal(COPILOT_SCHEMA_VERSION),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
}).strict();
export type CopilotSession = z.infer<typeof copilotSessionSchema>;

export const copilotMessageSchema = z.object({
  id: persistenceUuidSchema,
  chatSessionId: persistenceUuidSchema,
  sequence: z.number().int().positive(),
  turnId: persistenceUuidSchema,
  role: z.enum(["user", "assistant", "tool"]),
  text: z.string().max(12_000).nullable(),
  toolName: copilotToolNameSchema.nullable(),
  toolCallId: z.string().max(160).nullable(),
  toolPayload: z.record(z.string(), z.unknown()).nullable(),
  modelCallId: persistenceUuidSchema.nullable(),
  executionState: copilotExecutionStateSchema.nullable(),
  schemaVersion: z.literal(COPILOT_SCHEMA_VERSION),
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type CopilotMessage = z.infer<typeof copilotMessageSchema>;

export const copilotTurnRequestSchema = z.object({
  organizationId: persistenceUuidSchema.optional(),
  message: z.string().trim().min(1).max(4_000),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/),
  requestedTool: copilotToolNameSchema.optional(),
  requestedToolInput: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type CopilotTurnRequest = z.infer<typeof copilotTurnRequestSchema>;

export const copilotTurnResponseSchema = z.object({
  turnId: persistenceUuidSchema,
  state: copilotExecutionStateSchema,
  text: z.string().min(1).max(12_000),
  model: z.string().max(160).nullable(),
  toolCalls: z.array(z.object({ toolName: copilotToolNameSchema, status: z.enum(["completed", "confirmation_required", "rejected"]), confirmationId: persistenceUuidSchema.nullable(), result: z.record(z.string(), z.unknown()).nullable() }).strict()).max(5),
}).strict();
export type CopilotTurnResponse = z.infer<typeof copilotTurnResponseSchema>;

export const confirmCopilotToolSchema = z.object({
  organizationId: persistenceUuidSchema.optional(),
  confirmationText: z.literal("CONFIRM"),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/),
}).strict();
