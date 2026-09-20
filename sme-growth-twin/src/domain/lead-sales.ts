import { z } from "zod";

import { persistenceUuidSchema } from "./persistence";

export const LEAD_SCHEMA_VERSION = "1.0.0" as const;
export const ASSIGNMENT_ALGORITHM_VERSION = "deterministic-roster-load-1.0.0" as const;
export const SALES_ROSTER_VERSION = "demo-roster-1.0.0" as const;

export const durableLeadStatusSchema = z.enum(["new", "assigned", "contact_pending", "contacted", "qualified", "proposal", "won", "lost", "closed", "withdrawn"]);
export const assignmentStateSchema = z.enum(["assigned", "unassigned"]);

export const durableLeadContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(140),
  email: z.email().max(254),
  phone: z.string().trim().max(32).regex(/^[+()\-\s0-9]*$/).optional(),
  urgency: z.enum(["within_30_days", "one_to_three_months", "three_to_six_months", "exploring"]),
}).strict();

export const createDurableLeadRequestSchema = z.object({
  organizationId: persistenceUuidSchema.optional(),
  assessmentSessionId: persistenceUuidSchema,
  blueprintId: persistenceUuidSchema,
  blueprintRevision: z.number().int().positive(),
  reportArtifactId: persistenceUuidSchema,
  reportContentSha256: z.string().regex(/^[a-f0-9]{64}$/),
  contactConsentId: persistenceUuidSchema,
  reportConsentId: persistenceUuidSchema,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_.:-]{8,128}$/),
  contact: durableLeadContactSchema,
  region: z.string().trim().min(2).max(80).optional(),
  preferredLanguage: z.string().trim().min(2).max(80).optional(),
}).strict();
export type CreateDurableLeadRequest = z.infer<typeof createDurableLeadRequestSchema>;

export const leadReceiptSchemaV2 = z.object({
  receiptId: persistenceUuidSchema,
  leadId: persistenceUuidSchema,
  status: durableLeadStatusSchema,
  assignmentState: assignmentStateSchema,
  assignmentKey: z.string().min(1).max(100),
  replayed: z.boolean(),
}).strict();
export type LeadReceiptV2 = z.infer<typeof leadReceiptSchemaV2>;

export const leadSummaryV2Schema = z.object({
  id: persistenceUuidSchema,
  receiptId: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  status: durableLeadStatusSchema,
  assignmentState: assignmentStateSchema,
  businessName: z.string().min(1),
  urgency: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type LeadSummaryV2 = z.infer<typeof leadSummaryV2Schema>;

export const leadAssignmentViewSchema = z.object({
  sequence: z.number().int().positive(),
  state: assignmentStateSchema,
  stableKey: z.string().min(1),
  displayLabel: z.string().min(1),
  fictionalDemo: z.boolean(),
  algorithmVersion: z.string().min(1),
  rosterVersion: z.string().min(1),
  reason: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type LeadAssignmentView = z.infer<typeof leadAssignmentViewSchema>;

export const leadEventViewSchema = z.object({
  id: persistenceUuidSchema,
  sequence: z.number().int().positive(),
  eventType: z.string().min(1),
  actorKind: z.string().min(1),
  reasonCode: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  correlationId: z.string().min(1),
  requestKey: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type LeadEventView = z.infer<typeof leadEventViewSchema>;

export const salespersonLeadDetailSchema = z.object({
  id: persistenceUuidSchema,
  receiptId: persistenceUuidSchema,
  assessmentSessionId: persistenceUuidSchema,
  blueprintId: persistenceUuidSchema,
  blueprintRevision: z.number().int().positive(),
  status: durableLeadStatusSchema,
  assignmentState: assignmentStateSchema,
  contact: durableLeadContactSchema,
  region: z.string().nullable(),
  preferredLanguage: z.string().nullable(),
  consent: z.object({ snapshotVersion: z.string().min(1), consultationContact: z.record(z.string(), z.unknown()), reportShare: z.record(z.string(), z.unknown()) }).strict(),
  report: z.object({ id: persistenceUuidSchema, reportVersion: z.number().int().positive(), contentSha256: z.string().regex(/^[a-f0-9]{64}$/), reportNumber: z.string().min(1), downloadEndpoint: z.string().startsWith("/api/v2/leads/") }).strict(),
  preCallContext: z.record(z.string(), z.unknown()),
  assignment: leadAssignmentViewSchema,
  createdAt: z.iso.datetime({ offset: true }),
}).strict();
export type SalespersonLeadDetail = z.infer<typeof salespersonLeadDetailSchema>;

export const leadReportDownloadSchema = z.object({ reportId: persistenceUuidSchema, url: z.url(), expiresAt: z.iso.datetime({ offset: true }) }).strict();
export type LeadReportDownload = z.infer<typeof leadReportDownloadSchema>;
