import { z } from "zod";

import { persistenceUuidSchema } from "./persistence";

export const CONSULTANT_NOTE_SCHEMA_VERSION = "1.0.0" as const;
export const CONSULTANT_NOTE_PROMPT_VERSION = "phase-e-note-draft-1.0.0" as const;

export const consultantNoteDraftRequestSchema = z.object({
  organizationId: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  leadId: persistenceUuidSchema.optional(),
  blueprintId: persistenceUuidSchema,
  evidenceIds: z.array(persistenceUuidSchema).max(24).default([]),
  requestId: z.string().trim().min(8).max(128),
}).strict();
export type ConsultantNoteDraftRequest = z.infer<typeof consultantNoteDraftRequestSchema>;

export const consultantNoteAcceptanceRequestSchema = z.object({
  organizationId: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  draftNoteId: persistenceUuidSchema,
  body: z.string().trim().min(1).max(8_000),
  requestId: z.string().trim().min(8).max(128),
}).strict();
export type ConsultantNoteAcceptanceRequest = z.infer<typeof consultantNoteAcceptanceRequestSchema>;

export const consultantNoteSchema = z.object({
  id: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  organizationId: persistenceUuidSchema,
  leadId: persistenceUuidSchema.nullable(),
  origin: z.enum(["ai_draft", "human"]),
  status: z.enum(["draft", "accepted", "rejected", "superseded"]),
  body: z.string().min(1).max(8_000),
  evidenceIds: z.array(persistenceUuidSchema),
  sourceArtifactIds: z.array(persistenceUuidSchema),
  modelCallId: persistenceUuidSchema.nullable(),
  authorUserId: persistenceUuidSchema.nullable(),
  sourceDraftId: persistenceUuidSchema.nullable(),
  acceptedAt: z.iso.datetime({ offset: true }).nullable(),
  schemaVersion: z.literal(CONSULTANT_NOTE_SCHEMA_VERSION),
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type ConsultantNote = z.infer<typeof consultantNoteSchema>;

export const consultantNoteDraftOutputSchema = z.object({
  body: z.string().trim().min(40).max(2_000),
}).strict();
