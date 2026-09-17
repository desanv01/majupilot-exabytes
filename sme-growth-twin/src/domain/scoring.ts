import { z } from "zod";

import {
  assessmentSessionIdSchema,
  businessTwinIdSchema,
  diagnosticResultIdSchema,
  evidenceIdSchema,
} from "./ids";
import { semanticVersionSchema } from "./versioning";

export const SCORE_MODEL_VERSION = "1.0.0" as const;
export const PAIN_MODEL_VERSION = "1.0.0" as const;

export const confidenceBandSchema = z.enum(["low", "medium", "high"]);
export const metricBandIdSchema = z.enum([
  "starting",
  "building",
  "connected",
  "optimizing",
  "foundation_first",
  "prepare_and_pilot",
  "targeted_adoption",
  "scale_responsibly",
  "insufficient_evidence",
]);

export const contributionSchema = z
  .object({
    inputId: z.string().min(1),
    label: z.string().min(1),
    points: z.number().min(0).max(100),
    weight: z.number().positive(),
    weightedPoints: z.number().min(0),
    evidenceIds: z.array(evidenceIdSchema),
  })
  .strict();

export const dimensionResultSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    weight: z.number().positive(),
    score: z.number().min(0).max(100).nullable(),
    confidence: z.number().min(0).max(1),
    availableEvidenceWeight: z.number().min(0),
    totalEvidenceWeight: z.number().positive(),
    contributions: z.array(contributionSchema),
    evidenceIds: z.array(evidenceIdSchema),
    missingEvidence: z.array(z.string().min(1)),
  })
  .strict();

export const metricResultSchema = z
  .object({
    value: z.number().min(0).max(100).nullable(),
    bandId: metricBandIdSchema,
    bandLabel: z.string().min(1),
    confidence: z.number().min(0).max(1),
    confidenceBand: confidenceBandSchema,
    dimensions: z.array(dimensionResultSchema),
    evidenceIds: z.array(evidenceIdSchema),
    missingEvidence: z.array(z.string().min(1).max(160)),
    strongestPositiveFactor: z.string().min(1).max(300),
    largestLimitingFactor: z.string().min(1).max(300),
    improvementAction: z.string().min(1).max(300),
    rulesVersion: semanticVersionSchema,
  })
  .strict();

export const painPointResultSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    impact: z.number().min(0).max(100),
    urgency: z.number().min(0).max(100),
    strategicAlignment: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
    priority: z.number().min(0).max(100),
    mechanism: z.string().min(1),
    affectedCapabilityIds: z.array(z.string().min(1)),
    evidenceIds: z.array(evidenceIdSchema).min(1),
    triggerCodes: z.array(z.string().min(1)).min(1),
    painModelVersion: semanticVersionSchema,
  })
  .strict();

export const diagnosticResultSchema = z
  .object({
    id: diagnosticResultIdSchema,
    assessmentSessionId: assessmentSessionIdSchema,
    businessTwinId: businessTwinIdSchema,
    twinRevision: z.number().int().positive(),
    generatedAt: z.iso.datetime({ offset: true }),
    scoreModelVersion: z.literal(SCORE_MODEL_VERSION),
    painModelVersion: z.literal(PAIN_MODEL_VERSION),
    digitalMaturity: metricResultSchema,
    aiReadiness: metricResultSchema,
    painPoints: z.array(painPointResultSchema),
  })
  .strict();

// Retained as a narrow alias for Stage 00 imports.
export const scoreResultSchema = metricResultSchema;

export type Contribution = z.infer<typeof contributionSchema>;
export type DimensionResult = z.infer<typeof dimensionResultSchema>;
export type MetricResult = z.infer<typeof metricResultSchema>;
export type PainPointResult = z.infer<typeof painPointResultSchema>;
export type DiagnosticResult = z.infer<typeof diagnosticResultSchema>;
export type ScoreResult = MetricResult;
