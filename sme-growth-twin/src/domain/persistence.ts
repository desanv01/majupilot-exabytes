import { z } from "zod";

export const persistenceUuidSchema = z.uuid();
export type PersistenceId = z.infer<typeof persistenceUuidSchema>;
export const organizationRoleSchema = z.enum(["prospect", "consultant", "sales_manager", "catalogue_admin", "system_admin"]);
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;
export const ownershipContextSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("guest"), guestSessionId: persistenceUuidSchema }),
  z.object({ kind: z.literal("organization"), organizationId: persistenceUuidSchema, userId: persistenceUuidSchema, role: organizationRoleSchema }),
]);
export type OwnershipContext = z.infer<typeof ownershipContextSchema>;

export const guestSessionReceiptSchema = z.object({
  guestSessionId: persistenceUuidSchema, assessmentSessionId: persistenceUuidSchema,
  expiresAt: z.iso.datetime({ offset: true }), absoluteExpiresAt: z.iso.datetime({ offset: true }).optional(), replayed: z.boolean().optional(),
});
export type GuestSessionReceipt = z.infer<typeof guestSessionReceiptSchema>;

export const assessmentAnswerRecordSchema = z.object({
  id: persistenceUuidSchema, assessmentSessionId: persistenceUuidSchema, answerKey: z.string().min(1).max(80), revision: z.number().int().positive(),
  value: z.json(), evidenceState: z.enum(["draft", "confirmed", "retracted"]), supersedesId: persistenceUuidSchema.optional(), schemaVersion: z.string().min(1).max(32),
}).strict();
export type AssessmentAnswerRecord = z.infer<typeof assessmentAnswerRecordSchema>;

export const artifactKindSchema = z.enum(["business_twins", "evidence_items", "diagnostic_runs", "recommendation_runs", "scenario_comparisons", "scenario_revisions", "blueprints"]);
export const artifactWriteSchema = z.object({ kind: artifactKindSchema, id: persistenceUuidSchema, assessmentSessionId: persistenceUuidSchema, payload: z.record(z.string(), z.unknown()), revision: z.number().int().positive().optional(), schemaVersion: z.string().min(1).max(32), rulePackVersion: z.string().min(1).max(64).optional(), sourceArtifactIds: z.array(persistenceUuidSchema).max(128).default([]), links: z.record(z.string(), persistenceUuidSchema).default({}) }).strict();
export type ArtifactWrite = z.infer<typeof artifactWriteSchema>;

export const consentAppendSchema = z.object({
  id: persistenceUuidSchema, assessmentSessionId: persistenceUuidSchema, organizationId: persistenceUuidSchema.optional(),
  purpose: z.enum(["consultation_contact", "report_share_with_sales", "product_updates"]), action: z.enum(["granted", "withdrawn", "superseded"]),
  consentVersion: z.string().min(1).max(64), policyVersion: z.string().min(1).max(64), textHash: z.string().regex(/^[a-f0-9]{64}$/), locale: z.string().min(2).max(16),
  presentationSurface: z.string().min(1).max(80), parentConsentId: persistenceUuidSchema.optional(), requestId: z.string().min(8).max(128), channel: z.string().min(1).max(40),
}).strict();
export type ConsentAppend = z.infer<typeof consentAppendSchema>;

export const dataRequestSchema = z.object({ id: persistenceUuidSchema, organizationId: persistenceUuidSchema.optional(), assessmentSessionId: persistenceUuidSchema.optional(), retentionPolicyVersion: z.string().min(1).max(64) }).refine(v => Boolean(v.organizationId) !== Boolean(v.assessmentSessionId), "Exactly one scope is required");
export type DataRequest = z.infer<typeof dataRequestSchema>;
export const dataRequestStatusSchema = z.object({ id: persistenceUuidSchema, status: z.enum(["pending", "processing", "completed", "failed", "blocked"]), createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }), expiresAt: z.iso.datetime({ offset: true }).nullable().optional(), downloadedAt: z.iso.datetime({ offset: true }).nullable().optional(), blockedReason: z.string().nullable().optional() });

export const persistenceErrorCodeSchema = z.enum(["UNAUTHENTICATED","SESSION_EXPIRED","FORBIDDEN","NOT_FOUND","CLAIM_CONFLICT","CONSENT_REQUIRED","RETENTION_HOLD","VALIDATION_FAILED","IDEMPOTENCY_CONFLICT","INTERNAL_RETRYABLE"]);
export type PersistenceErrorCode = z.infer<typeof persistenceErrorCodeSchema>;
export class PersistenceError extends Error { constructor(readonly code: PersistenceErrorCode, readonly httpStatus: number, options?: { cause?: unknown }) { super(code, options); this.name = "PersistenceError"; } }
