import { z } from "zod";

import { assessmentDraftSchema } from "./assessment";
import { blueprintSchema } from "./blueprint";
import { diagnosticResultSchema } from "./scoring";
import { recommendationResultSchema } from "./recommendations";
import { scenarioComparisonSchema } from "./scenarios";
import { persistenceUuidSchema } from "./persistence";

export const accountCaseSnapshotSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  draft: assessmentDraftSchema,
  diagnostic: diagnosticResultSchema.optional(),
  recommendations: recommendationResultSchema.optional(),
  comparison: scenarioComparisonSchema.optional(),
  blueprint: blueprintSchema.optional(),
  durableJourney: z.record(z.string().max(80), z.unknown()).optional(),
}).strict();
export type AccountCaseSnapshot = z.infer<typeof accountCaseSnapshotSchema>;

export const saveAccountCaseSchema = z.object({
  organizationId: persistenceUuidSchema,
  expectedRevision: z.number().int().min(0),
  snapshot: accountCaseSnapshotSchema,
}).strict();
