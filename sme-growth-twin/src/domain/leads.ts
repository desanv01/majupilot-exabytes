import { z } from "zod";

import { advisorIdSchema } from "./advisors";
import { blueprintSchema, blueprintSourceIdentitySchema } from "./blueprint";
import { blueprintIdSchema } from "./ids";

export const LEAD_MODEL_VERSION = "1.0.0" as const;
export const LEAD_STORAGE_VERSION = "1.0.0" as const;
export const CONSENT_WORDING_VERSION = "consultation-consent-1.0.0" as const;
export const CONSENT_WORDING = "I agree that my contact details and this assessment's Blueprint summary may be used to arrange an Exabytes consultation. I understand what will be shared and that I can request deletion." as const;
export const LEAD_SOURCE_CAMPAIGN = "ai-horizon-2026" as const;
export const INITIAL_LEAD_STATUS = "new" as const;

export const consultationUrgencySchema = z.enum([
  "within_30_days",
  "one_to_three_months",
  "three_to_six_months",
  "exploring",
]);

export const submissionIdSchema = z.uuid();
export const leadIdSchema = z.string().regex(/^lead_[a-z0-9]{20,32}$/);
export const consentIdSchema = z.string().regex(/^consent_[a-z0-9]{20,32}$/);

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  businessName: z.string().trim().min(2).max(140),
  email: z.email().max(254),
  phone: z.string().trim().max(32).regex(/^[+()\-\s0-9]*$/).optional(),
  urgency: consultationUrgencySchema,
}).strict();

export const consentRecordSchema = z.object({
  id: consentIdSchema,
  wordingVersion: z.literal(CONSENT_WORDING_VERSION),
  wording: z.literal(CONSENT_WORDING),
  consentedAt: z.iso.datetime({ offset: true }),
  submissionId: submissionIdSchema,
  blueprintId: blueprintIdSchema,
  blueprintModelVersion: z.literal("1.0.0"),
  blueprintSourceIdentity: blueprintSourceIdentitySchema,
}).strict();

export const leadSummarySchema = z.object({
  businessProfile: z.object({
    employeeBand: z.string().min(1),
    industry: z.string().min(1),
    budgetBand: z.string().min(1),
    implementationPace: z.string().min(1),
  }).strict(),
  scores: z.object({
    digitalMaturity: z.object({ value: z.number().nullable(), band: z.string().min(1), confidence: z.number().min(0).max(1) }).strict(),
    aiReadiness: z.object({ value: z.number().nullable(), band: z.string().min(1), confidence: z.number().min(0).max(1) }).strict(),
  }).strict(),
  painPoints: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), priority: z.number(), mechanism: z.string().min(1), evidenceIds: z.array(z.string().min(1)) }).strict()).max(5),
  selectedScenario: z.object({
    id: z.string().min(1), title: z.string().min(1), budgetFit: z.string().min(1),
    firstYearCost: z.object({ low: z.number(), base: z.number(), high: z.number() }).strict(),
    operationalValue: z.unknown(), netValue: z.unknown(), payback: z.unknown(), assumptions: z.unknown(),
  }).strict(),
  recommendations: z.array(z.object({
    capabilityId: z.string().min(1), title: z.string().min(1), status: z.string().min(1), outcome: z.string().min(1),
    mappedOffering: z.object({ id: z.string().min(1), name: z.string().min(1) }).strict().optional(),
  }).strict()),
  advisorFindings: z.array(z.object({
    advisor: advisorIdSchema, headline: z.string().min(1), position: z.string().min(1),
    concerns: z.array(z.string().min(1)), missingEvidence: z.array(z.string().min(1)),
  }).strict()).length(5),
}).strict();

export const leadSchema = z.object({
  id: leadIdSchema,
  modelVersion: z.literal(LEAD_MODEL_VERSION),
  storageVersion: z.literal(LEAD_STORAGE_VERSION),
  submissionId: submissionIdSchema,
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  status: z.literal(INITIAL_LEAD_STATUS),
  sourceCampaign: z.literal(LEAD_SOURCE_CAMPAIGN),
  contact: contactSchema,
  consent: consentRecordSchema,
  blueprintId: blueprintIdSchema,
  blueprint: blueprintSchema,
  summary: leadSummarySchema,
}).strict();

export const createLeadRequestSchema = z.object({
  submissionId: submissionIdSchema,
  contact: contactSchema,
  consent: z.object({ accepted: z.boolean().optional(), wordingVersion: z.string().max(80).optional() }).strict(),
  honeypot: z.string().max(200),
  blueprint: blueprintSchema,
}).strict();

export const leadReceiptSchema = z.object({
  leadReference: leadIdSchema,
  submittedAt: z.iso.datetime({ offset: true }),
  blueprintId: blueprintIdSchema,
  status: z.literal(INITIAL_LEAD_STATUS),
  replayed: z.boolean(),
}).strict();

export type ConsultationUrgency = z.infer<typeof consultationUrgencySchema>;
export type LeadContact = z.infer<typeof contactSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type CreateLeadRequest = z.infer<typeof createLeadRequestSchema>;
export type LeadReceipt = z.infer<typeof leadReceiptSchema>;
