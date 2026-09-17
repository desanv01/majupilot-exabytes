import { z } from "zod";

import { assessmentSessionIdSchema, businessTwinIdSchema } from "./ids";

export const ASSESSMENT_SCHEMA_VERSION = "1.0.0" as const;

const trimmed = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

export const capabilityStateSchema = z.enum([
  "not_used",
  "informal",
  "active",
  "unknown",
]);

export const q1Schema = z
  .object({
    businessName: trimmed(2, 100),
    industry: z.enum([
      "food_beverage",
      "retail_ecommerce",
      "professional_services",
      "manufacturing",
      "technology_digital",
      "health_wellness",
      "education_training",
      "logistics_distribution",
      "construction_property",
      "other",
    ]),
    industryOther: z.string().trim().max(80).optional(),
    businessModel: z.enum(["b2b", "b2c", "hybrid"]),
    employeeBand: z.enum(["1_9", "10_24", "25_49", "50_99", "100_plus"]),
    description: trimmed(10, 500),
  })
  .superRefine((value, context) => {
    if (
      value.industry === "other" &&
      (!value.industryOther || value.industryOther.length < 2)
    ) {
      context.addIssue({
        code: "custom",
        path: ["industryOther"],
        message: "Tell us your industry (2–80 characters).",
      });
    }
  });

export const q2Schema = z.object({
  websiteOrStore: capabilityStateSchema,
  businessEmail: capabilityStateSchema,
  cloudProductivity: capabilityStateSchema,
  crm: capabilityStateSchema,
  digitalMarketingAnalytics: capabilityStateSchema,
  backup: capabilityStateSchema,
  cybersecurityControls: capabilityStateSchema,
  aiTools: capabilityStateSchema,
});

export const q3Schema = z
  .object({
    biggestChallenge: z.enum([
      "lead_generation",
      "customer_management",
      "manual_work",
      "team_collaboration",
      "data_visibility",
      "security_continuity",
      "scaling_operations",
      "other",
    ]),
    challengeOther: z.string().trim().max(120).optional(),
    manualWorkflow: trimmed(3, 300),
    manualHoursPerWeek: z.number().int().min(0).max(168).nullable(),
    affectedEmployees: z.number().int().min(1).max(10_000).nullable(),
    urgency: z.number().int().min(1).max(5),
  })
  .superRefine((value, context) => {
    if (
      value.biggestChallenge === "other" &&
      (!value.challengeOther || value.challengeOther.length < 2)
    ) {
      context.addIssue({
        code: "custom",
        path: ["challengeOther"],
        message: "Describe the challenge (2–120 characters).",
      });
    }
  });

export const q4Schema = z.object({
  primaryObjective: z.enum([
    "increase_revenue",
    "acquire_customers",
    "improve_retention",
    "reduce_cost",
    "increase_productivity",
    "strengthen_resilience",
    "launch_ai_capability",
  ]),
  budgetBand: z.enum([
    "under_5k",
    "5k_15k",
    "15k_50k",
    "50k_plus",
    "unknown",
  ]),
  implementationPace: z.enum([
    "within_30_days",
    "1_3_months",
    "3_6_months",
    "6_12_months",
  ]),
  highestConcern: z.enum([
    "cost",
    "complexity",
    "security",
    "adoption",
    "disruption",
  ]),
});

export const readinessValueSchema = z.number().int().min(1).max(5).nullable();

export const q5Schema = z.object({
  leadershipSponsorship: readinessValueSchema,
  usableData: readinessValueSchema,
  employeeDigitalSkills: readinessValueSchema,
  processConsistency: readinessValueSchema,
  changeWillingness: readinessValueSchema,
});

export const coreAnswersSchema = z.object({
  q1: q1Schema,
  q2: q2Schema,
  q3: q3Schema,
  q4: q4Schema,
  q5: q5Schema,
});

export type CoreAnswers = z.infer<typeof coreAnswersSchema>;
export type CoreStep = keyof CoreAnswers;

export const followUpIdSchema = z.enum([
  "fu_manual_hours",
  "fu_customer_records",
  "fu_backup_frequency",
  "fu_sales_channel",
  "fu_ai_usage",
  "fu_change_barrier",
]);

export type FollowUpId = z.infer<typeof followUpIdSchema>;

const scalarFollowUpSchema = z.enum([
  "under_5",
  "5_10",
  "11_20",
  "21_40",
  "over_40",
  "spreadsheets",
  "messaging_apps",
  "accounting_system",
  "paper",
  "multiple_places",
  "none",
  "ad_hoc",
  "weekly",
  "daily",
  "managed",
  "physical_only",
  "social_messaging",
  "marketplace",
  "own_website",
  "multiple",
  "time",
  "skills",
  "leadership_alignment",
  "employee_resistance",
  "unclear_value",
  "other",
  "unknown",
]);

export const aiUsageValueSchema = z.enum([
  "content",
  "customer_support",
  "analysis",
  "administration",
  "development",
  "other",
  "unknown",
]);

export type AiUsageValue = z.infer<typeof aiUsageValueSchema>;

export const followUpAnswerSchema = z.union([
  scalarFollowUpSchema,
  z.array(aiUsageValueSchema).min(1),
]);

export const followUpAnswersSchema = z.partialRecord(
  followUpIdSchema,
  followUpAnswerSchema,
);

export type FollowUpAnswer = z.infer<typeof followUpAnswerSchema>;
export type FollowUpAnswers = z.infer<typeof followUpAnswersSchema>;

export const partialCoreAnswersSchema = z.object({
  q1: z.object(q1Schema.shape).partial().optional(),
  q2: q2Schema.partial().optional(),
  q3: z.object(q3Schema.shape).partial().optional(),
  q4: q4Schema.partial().optional(),
  q5: q5Schema.partial().optional(),
});

export const assessmentDraftStatusSchema = z.enum([
  "in_progress",
  "ready_for_review",
]);

export const assessmentDraftSchema = z
  .object({
    schemaVersion: z.literal(ASSESSMENT_SCHEMA_VERSION),
    sessionId: assessmentSessionIdSchema,
    status: assessmentDraftStatusSchema,
    currentStep: z.number().int().min(1).max(6),
    twinRevision: z.number().int().positive(),
    answers: partialCoreAnswersSchema,
    selectedFollowUpIds: z.array(followUpIdSchema).max(3),
    followUpAnswers: followUpAnswersSchema,
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type AssessmentDraft = z.infer<typeof assessmentDraftSchema>;

export const assessmentSessionStatusSchema = z.enum([
  "draft",
  "in_progress",
  "ready_for_review",
  "completed",
  "failed",
]);

export const assessmentSessionSchema = z
  .object({
    id: assessmentSessionIdSchema,
    status: assessmentSessionStatusSchema,
    businessTwinId: businessTwinIdSchema.optional(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type AssessmentSessionStatus = z.infer<
  typeof assessmentSessionStatusSchema
>;
export type AssessmentSession = z.infer<typeof assessmentSessionSchema>;
