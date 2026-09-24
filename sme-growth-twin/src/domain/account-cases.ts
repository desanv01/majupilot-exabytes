import { z } from "zod";

import { assessmentDraftSchema } from "./assessment";
import { blueprintSchema } from "./blueprint";
import { diagnosticResultSchema } from "./scoring";
import { recommendationResultSchema } from "./recommendations";
import { scenarioComparisonSchema } from "./scenarios";
import { persistenceUuidSchema } from "./persistence";
import { reportArtifactSchema } from "./reports";
import { leadReceiptSchemaV2 } from "./lead-sales";

export const accountDurableJourneySchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  organizationId: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  artifactIds: z.object({
    answers: z.record(z.string().min(1).max(80), persistenceUuidSchema),
    businessTwin: persistenceUuidSchema,
    evidence: z.array(persistenceUuidSchema).max(100),
    diagnostic: persistenceUuidSchema,
    recommendations: persistenceUuidSchema,
    scenarioComparison: persistenceUuidSchema,
    scenarioRevision: persistenceUuidSchema,
    blueprint: persistenceUuidSchema,
  }).strict().optional(),
  sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  syncedAt: z.iso.datetime({ offset: true }).optional(),
  report: reportArtifactSchema.optional(),
  lead: leadReceiptSchemaV2.optional(),
  leadIdempotencyKey: z.string().regex(/^lead:[a-f0-9-]{36}$/),
}).strict();

export const accountCaseSnapshotSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  draft: assessmentDraftSchema,
  diagnostic: diagnosticResultSchema.optional(),
  recommendations: recommendationResultSchema.optional(),
  comparison: scenarioComparisonSchema.optional(),
  blueprint: blueprintSchema.optional(),
  durableJourney: accountDurableJourneySchema.optional(),
}).strict();
export type AccountCaseSnapshot = z.infer<typeof accountCaseSnapshotSchema>;

export const saveAccountCaseSchema = z.object({
  organizationId: persistenceUuidSchema,
  expectedRevision: z.number().int().min(0),
  snapshot: accountCaseSnapshotSchema,
}).strict();
