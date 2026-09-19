import { z } from "zod";

import { blueprintSchema } from "./blueprint";
import { persistenceUuidSchema } from "./persistence";

export const REPORT_RENDERER_VERSION = "majupilot-pdf-1.0.0" as const;
export const REPORT_TEMPLATE_VERSION = "exabytes-blueprint-1.0.0" as const;
export const REPORT_SCHEMA_VERSION = "1.0.0" as const;
export const REPORT_BUCKET = "majupilot-reports" as const;

export const acceptedConsultantNoteSchema = z.object({
  id: persistenceUuidSchema,
  body: z.string().trim().min(1).max(8_000),
  authorUserId: persistenceUuidSchema,
  acceptedAt: z.iso.datetime({ offset: true }),
  sourceDraftId: persistenceUuidSchema,
}).strict();
export type AcceptedConsultantNote = z.infer<typeof acceptedConsultantNoteSchema>;

export const generateReportRequestSchema = z.object({
  organizationId: persistenceUuidSchema.optional(),
  assessmentSessionId: persistenceUuidSchema,
  blueprintId: persistenceUuidSchema,
  locale: z.enum(["en-MY"]).default("en-MY"),
  acceptedNoteIds: z.array(persistenceUuidSchema).max(50).default([]),
}).strict();
export type GenerateReportRequest = z.infer<typeof generateReportRequestSchema>;

export const reportArtifactSchema = z.object({
  id: persistenceUuidSchema,
  reportNumber: z.string().min(1).max(80),
  reportVersion: z.number().int().positive(),
  assessmentSessionId: persistenceUuidSchema,
  blueprintId: persistenceUuidSchema,
  blueprintRevision: z.number().int().positive(),
  status: z.enum(["pending", "completed", "failed", "deleted"]),
  contentSha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  provenanceHash: z.string().regex(/^[a-f0-9]{64}$/),
  renderKey: z.string().regex(/^[a-f0-9]{64}$/),
  mimeType: z.literal("application/pdf"),
  byteLength: z.number().int().nonnegative().nullable(),
  pageCount: z.number().int().positive().nullable(),
  storageBucket: z.string().nullable(),
  objectPath: z.string().nullable(),
  selectedNoteIds: z.array(persistenceUuidSchema),
  rendererVersion: z.literal(REPORT_RENDERER_VERSION),
  templateVersion: z.literal(REPORT_TEMPLATE_VERSION),
  generatedAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type ReportArtifact = z.infer<typeof reportArtifactSchema>;

export const reportGenerationSourceSchema = z.object({
  blueprint: blueprintSchema,
  blueprintRevision: z.number().int().positive(),
  blueprintProvenanceHash: z.string().regex(/^[a-f0-9]{64}$/),
  rulePackVersion: z.string().min(1).max(64),
  catalogueVersion: z.string().min(1).max(64),
  sourceArtifactIds: z.array(persistenceUuidSchema).max(256),
  advisorRunIds: z.array(persistenceUuidSchema).max(32),
  advisorReviewIds: z.array(persistenceUuidSchema).max(64),
  acceptedNotes: z.array(acceptedConsultantNoteSchema).max(50),
}).strict();
export type ReportGenerationSource = z.infer<typeof reportGenerationSourceSchema>;

export const signedReportDownloadSchema = z.object({
  reportId: persistenceUuidSchema,
  url: z.url(),
  expiresAt: z.iso.datetime({ offset: true }),
}).strict();
