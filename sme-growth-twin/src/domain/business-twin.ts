import { z } from "zod";

import {
  capabilityStateSchema,
  followUpAnswerSchema,
  followUpIdSchema,
  q1Schema,
} from "./assessment";
import {
  assessmentSessionIdSchema,
  assumptionIdSchema,
  businessTwinIdSchema,
  evidenceIdSchema,
} from "./ids";
import { semanticVersionSchema } from "./versioning";

const atomSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const jsonValueSchema = z.union([
  atomSchema,
  z.array(atomSchema),
  z.record(z.string(), atomSchema),
]);

export const evidenceSourceSchema = z.enum([
  "user_fact",
  "catalogue_fact",
  "model_interpretation",
  "human_decision",
]);

export const evidenceSchema = z
  .object({
    id: evidenceIdSchema,
    source: evidenceSourceSchema,
    sourceRef: z.string().min(1).max(120),
    questionId: z.string().min(1).max(80).optional(),
    rawAnswer: jsonValueSchema.optional(),
    normalizedValue: jsonValueSchema.optional(),
    capturedAt: z.iso.datetime({ offset: true }),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const assumptionSchema = z
  .object({
    id: assumptionIdSchema,
    key: z.string().min(1).max(80),
    value: z.union([z.string(), z.number(), z.boolean()]),
    rationale: z.string().min(1).max(500),
  })
  .strict();

export const businessFactSchema = z
  .object({
    key: z.string().min(1).max(80),
    value: z.union([z.string(), z.number(), z.boolean()]),
    evidenceIds: z.array(evidenceIdSchema),
  })
  .strict();

const evidenceLinkedSchema = z.object({
  evidenceIds: z.array(evidenceIdSchema),
  confidence: z.number().min(0).max(1),
});

export const businessTwinSchema = z
  .object({
    id: businessTwinIdSchema,
    assessmentSessionId: assessmentSessionIdSchema,
    schemaVersion: semanticVersionSchema,
    revision: z.number().int().positive(),
    facts: z.array(businessFactSchema),
    evidence: z.array(evidenceSchema),
    assumptions: z.array(assumptionSchema),
    generatedAt: z.iso.datetime({ offset: true }),
    identity: q1Schema,
    objectives: z.array(
      z.object({
        objectiveId: z.string(),
        type: z.string(),
        timeHorizonMonths: z.number().int(),
      }),
    ),
    capabilities: z.array(
      evidenceLinkedSchema.extend({
        capabilityId: z.string(),
        currentState: capabilityStateSchema,
      }),
    ),
    processes: z.array(
      z.object({
        processId: z.string(),
        name: z.string(),
        manualHoursPerWeek: z.number().nullable().optional(),
        participants: z.number().nullable().optional(),
        painSignals: z.array(z.string()),
        evidenceIds: z.array(evidenceIdSchema),
      }),
    ),
    constraints: z.object({
      budgetBand: z.string(),
      implementationPace: z.string(),
      concerns: z.array(z.string()),
    }),
    readiness: z.object({
      leadership: z.number().nullable(),
      data: z.number().nullable(),
      skills: z.number().nullable(),
      process: z.number().nullable(),
      changeWillingness: z.number().nullable(),
    }),
    followUps: z.array(
      z.object({
        questionId: followUpIdSchema,
        answer: followUpAnswerSchema,
        whyWeAsked: z.string(),
      }),
    ),
  })
  .strict();

export type Evidence = z.infer<typeof evidenceSchema>;
export type BusinessTwin = z.infer<typeof businessTwinSchema>;
export type Assumption = z.infer<typeof assumptionSchema>;
export type BusinessFact = z.infer<typeof businessFactSchema>;
