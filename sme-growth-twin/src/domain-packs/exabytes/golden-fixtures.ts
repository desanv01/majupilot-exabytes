import { z } from "zod";

import {
  ASSESSMENT_SCHEMA_VERSION,
  assessmentDraftSchema,
  coreAnswersSchema,
  followUpAnswersSchema,
  followUpIdSchema,
  type AssessmentDraft,
} from "@/domain/assessment";
import { assessmentSessionIdSchema } from "@/domain/ids";

export const GOLDEN_FIXTURE_VERSION = "1.0.0" as const;

export const goldenFixtureSchema = z.object({
  id: z.enum(["case-a", "case-b", "case-c"]),
  fixtureVersion: z.literal(GOLDEN_FIXTURE_VERSION),
  fictional: z.literal(true),
  label: z.string().min(1).max(100),
  sector: z.string().min(1).max(80),
  challengeSummary: z.string().min(1).max(220),
  answers: coreAnswersSchema,
  selectedFollowUpIds: z.array(followUpIdSchema).max(3),
  followUpAnswers: followUpAnswersSchema,
}).strict().superRefine((fixture, context) => {
  const selected = new Set(fixture.selectedFollowUpIds);
  for (const id of Object.keys(fixture.followUpAnswers)) {
    if (!selected.has(id as z.infer<typeof followUpIdSchema>)) {
      context.addIssue({ code: "custom", path: ["followUpAnswers", id], message: "A fixture answer must belong to a selected follow-up." });
    }
  }
  for (const id of fixture.selectedFollowUpIds) {
    if (fixture.followUpAnswers[id] === undefined) {
      context.addIssue({ code: "custom", path: ["followUpAnswers", id], message: "Every selected fixture follow-up requires an answer." });
    }
  }
});

export type GoldenFixture = z.infer<typeof goldenFixtureSchema>;

const fixtures = [
  {
    id: "case-a",
    fixtureVersion: GOLDEN_FIXTURE_VERSION,
    fictional: true,
    label: "Kopi Kita Café Group",
    sector: "Food and beverage",
    challengeSummary: "Three café outlets need a shared way to manage WhatsApp orders, catering enquiries, continuity, and growth.",
    answers: {
      q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
      q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
      q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
      q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
      q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
    },
    selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"],
    followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" },
  },
  {
    id: "case-b",
    fixtureVersion: GOLDEN_FIXTURE_VERSION,
    fictional: true,
    label: "Precision Parts Manufacturing",
    sector: "B2B manufacturing",
    challengeSummary: "A 48-person manufacturer needs structured quotation and quality workflows before considering AI.",
    answers: {
      q1: { businessName: "Precision Parts Manufacturing", industry: "manufacturing", businessModel: "b2b", employeeBand: "25_49", description: "A 48-employee precision components manufacturer using local accounting and shared-drive quality records." },
      q2: { websiteOrStore: "informal", businessEmail: "active", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "not_used", backup: "informal", cybersecurityControls: "informal", aiTools: "not_used" },
      q3: { biggestChallenge: "manual_work", manualWorkflow: "Manual quotation tracking and shared-drive quality records", manualHoursPerWeek: 18, affectedEmployees: 12, urgency: 5 },
      q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "within_30_days", highestConcern: "complexity" },
      q5: { leadershipSponsorship: 5, usableData: 2, employeeDigitalSkills: 2, processConsistency: 2, changeWillingness: 4 },
    },
    selectedFollowUpIds: ["fu_customer_records", "fu_backup_frequency"],
    followUpAnswers: { fu_customer_records: "accounting_system", fu_backup_frequency: "ad_hoc" },
  },
  {
    id: "case-c",
    fixtureVersion: GOLDEN_FIXTURE_VERSION,
    fictional: true,
    label: "Northstar Digital Studio",
    sector: "Boutique digital agency",
    challengeSummary: "A nine-person cloud-native studio needs stronger CRM and capacity planning with governed, selective AI use.",
    answers: {
      q1: { businessName: "Northstar Digital Studio", industry: "technology_digital", businessModel: "b2b", employeeBand: "1_9", description: "A nine-person boutique digital agency with mature cloud delivery, marketing, and security practices." },
      q2: { websiteOrStore: "active", businessEmail: "active", cloudProductivity: "active", crm: "informal", digitalMarketingAnalytics: "active", backup: "active", cybersecurityControls: "active", aiTools: "informal" },
      q3: { biggestChallenge: "scaling_operations", manualWorkflow: "Capacity planning across client projects", manualHoursPerWeek: 6, affectedEmployees: 6, urgency: 3 },
      q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "3_6_months", highestConcern: "security" },
      q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 5, processConsistency: 3, changeWillingness: 5 },
    },
    selectedFollowUpIds: ["fu_ai_usage"],
    followUpAnswers: { fu_ai_usage: ["content", "analysis", "development"] },
  },
] as const;

export const EXABYTES_GOLDEN_FIXTURES: readonly GoldenFixture[] = Object.freeze(
  fixtures.map((fixture) => Object.freeze(goldenFixtureSchema.parse(fixture))),
);
export const GOLDEN_FIXTURES = EXABYTES_GOLDEN_FIXTURES;

export function goldenFixtureById(id: GoldenFixture["id"]): GoldenFixture {
  const fixture = EXABYTES_GOLDEN_FIXTURES.find((item) => item.id === id);
  if (!fixture) throw new Error("unknown_golden_fixture");
  return fixture;
}

export function draftFromGoldenFixture(
  fixture: GoldenFixture,
  options: { sessionId: string; now: string },
): AssessmentDraft {
  return assessmentDraftSchema.parse({
    schemaVersion: ASSESSMENT_SCHEMA_VERSION,
    sessionId: assessmentSessionIdSchema.parse(options.sessionId),
    status: "ready_for_review",
    currentStep: 6,
    twinRevision: 1,
    answers: fixture.answers,
    selectedFollowUpIds: fixture.selectedFollowUpIds,
    followUpAnswers: fixture.followUpAnswers,
    updatedAt: options.now,
  });
}

export function createGoldenAssessmentDraft(fixture: GoldenFixture, sessionId: string, updatedAt: string) {
  return draftFromGoldenFixture(fixture, { sessionId, now: updatedAt });
}
