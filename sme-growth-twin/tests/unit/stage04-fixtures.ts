import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildRecommendationResult } from "../../src/core/recommendations/build-recommendations";
import { buildScenarioComparison } from "../../src/core/scenarios/build-scenarios";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import { EXABYTES_CATALOGUE_1_0_0 } from "../../src/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_1_0_0 } from "../../src/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "../../src/domain-packs/exabytes/recommendation-rules";
import { EXABYTES_SCENARIO_RULES_1_0_0 } from "../../src/domain-packs/exabytes/scenario-templates";
import type { CoreAnswers, FollowUpAnswers, FollowUpId } from "../../src/domain/assessment";
import { assessmentSessionIdSchema } from "../../src/domain/ids";

export const now = "2026-09-17T09:00:00+08:00";
export const caseA: CoreAnswers = {
  q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
  q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
  q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
  q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
};
export const caseB: CoreAnswers = {
  q1: { businessName: "Precision Parts Manufacturing", industry: "manufacturing", businessModel: "b2b", employeeBand: "25_49", description: "A precision components manufacturer with manual quotation tracking." },
  q2: { websiteOrStore: "informal", businessEmail: "active", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "not_used", backup: "informal", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "manual_work", manualWorkflow: "Quotation tracking and quality records", manualHoursPerWeek: 18, affectedEmployees: 12, urgency: 5 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "within_30_days", highestConcern: "complexity" },
  q5: { leadershipSponsorship: 5, usableData: 2, employeeDigitalSkills: 2, processConsistency: 2, changeWillingness: 4 },
};
export const caseC: CoreAnswers = {
  q1: { businessName: "Northstar Digital Studio", industry: "technology_digital", businessModel: "b2b", employeeBand: "1_9", description: "A boutique digital agency with mature cloud delivery and marketing." },
  q2: { websiteOrStore: "active", businessEmail: "active", cloudProductivity: "active", crm: "informal", digitalMarketingAnalytics: "active", backup: "active", cybersecurityControls: "active", aiTools: "informal" },
  q3: { biggestChallenge: "scaling_operations", manualWorkflow: "Capacity planning across client projects", manualHoursPerWeek: 6, affectedEmployees: 6, urgency: 3 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "3_6_months", highestConcern: "security" },
  q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 5, processConsistency: 3, changeWillingness: 5 },
};

export function fullCase(answers = caseA, followUps: FollowUpAnswers = {}, selected: FollowUpId[] = [], suffix = "a") {
  let idSequence = 0;
  let eventSequence = 0;
  const twin = buildBusinessTwin({ sessionId: assessmentSessionIdSchema.parse(`assessment_stage04${suffix.padEnd(4, "0")}`), answers, followUpAnswers: followUps, selectedFollowUpIds: selected }, { now: () => now, id: (kind) => `${kind}_stage04${String(++idSequence).padStart(4, "0")}` });
  const diagnostic = buildDiagnosticResult(twin, { now: () => now, id: () => `diagnostic_stage04${suffix.padEnd(4, "0")}` });
  const recommendation = buildRecommendationResult(twin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => now, id: () => `recommendation_stage04${suffix.padEnd(4, "0")}` });
  const comparison = buildScenarioComparison(twin, diagnostic, recommendation, EXABYTES_SCENARIO_RULES_1_0_0, { now: () => now, id: () => `scenario_stage04${suffix.padEnd(5, "0")}`, eventId: () => `event_stage04${String(++eventSequence).padStart(5, "0")}` });
  return { twin, diagnostic, recommendation, comparison };
}

export function caseAFull() { return fullCase(caseA, { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], "a"); }

export function memoryStorage() { const data = new Map<string, string>(); return { data, storage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) } }; }
