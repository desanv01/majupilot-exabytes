import { describe, expect, it } from "vitest";

import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildRecommendationResult } from "../../src/core/recommendations/build-recommendations";
import {
  BUDGET_CAPACITY,
  PACE_CAPACITY,
  PREREQUISITE_SCORE,
  RECOMMENDATION_WEIGHTS,
  calculateBudgetFit,
  calculateFitScore,
  calculateTimeToValue,
  generateCapabilityCandidates,
  selectCapabilityRecommendations,
} from "../../src/core/recommendations/capability-rules";
import { mapOfferingsAfterSelection } from "../../src/core/recommendations/map-offerings";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import { EXABYTES_CATALOGUE_1_0_0 } from "../../src/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_1_0_0 } from "../../src/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "../../src/domain-packs/exabytes/recommendation-rules";
import type { CoreAnswers, FollowUpAnswers, FollowUpId } from "../../src/domain/assessment";
import { assessmentSessionIdSchema } from "../../src/domain/ids";
import { catalogueSchema, recommendationResultSchema } from "../../src/domain/recommendations";
import type { DiagnosticResult } from "../../src/domain/scoring";
import {
  RECOMMENDATION_STORAGE_KEY,
  isRecommendationCurrent,
  loadRecommendationResult,
  saveRecommendationResult,
} from "../../src/infrastructure/persistence/local-recommendation-store";

const now = "2026-09-17T09:00:00+08:00";
const caseA: CoreAnswers = {
  q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
  q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
  q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
  q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
};
const caseB: CoreAnswers = {
  q1: { businessName: "Precision Parts Manufacturing", industry: "manufacturing", businessModel: "b2b", employeeBand: "25_49", description: "A precision components manufacturer with manual quotation tracking." },
  q2: { websiteOrStore: "informal", businessEmail: "active", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "not_used", backup: "informal", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "manual_work", manualWorkflow: "Quotation tracking and quality records", manualHoursPerWeek: 18, affectedEmployees: 12, urgency: 5 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "within_30_days", highestConcern: "complexity" },
  q5: { leadershipSponsorship: 5, usableData: 2, employeeDigitalSkills: 2, processConsistency: 2, changeWillingness: 4 },
};
const caseC: CoreAnswers = {
  q1: { businessName: "Northstar Digital Studio", industry: "technology_digital", businessModel: "b2b", employeeBand: "1_9", description: "A boutique digital agency with mature cloud delivery and marketing." },
  q2: { websiteOrStore: "active", businessEmail: "active", cloudProductivity: "active", crm: "informal", digitalMarketingAnalytics: "active", backup: "active", cybersecurityControls: "active", aiTools: "informal" },
  q3: { biggestChallenge: "scaling_operations", manualWorkflow: "Capacity planning across client projects", manualHoursPerWeek: 6, affectedEmployees: 6, urgency: 3 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "3_6_months", highestConcern: "security" },
  q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 5, processConsistency: 3, changeWillingness: 5 },
};

function twin(answers = caseA, followUpAnswers: FollowUpAnswers = {}, selectedFollowUpIds: FollowUpId[] = [], revision = 1, session = "assessment_stage030001") {
  let sequence = 0;
  return buildBusinessTwin({ sessionId: assessmentSessionIdSchema.parse(session), answers, followUpAnswers, selectedFollowUpIds, revision }, { now: () => now, id: (kind) => `${kind}_stage03${String(++sequence).padStart(4, "0")}` });
}
function fullCase(answers = caseA, followUps: FollowUpAnswers = {}, selected: FollowUpId[] = []) {
  const currentTwin = twin(answers, followUps, selected);
  const diagnostic = buildDiagnosticResult(currentTwin, { now: () => now, id: () => "diagnostic_stage030001" });
  const recommendation = buildRecommendationResult(currentTwin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => now, id: () => "recommendation_stage030001" });
  return { twin: currentTwin, diagnostic, recommendation };
}
function memoryStorage() {
  const data = new Map<string, string>();
  return { data, storage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) } };
}

describe("recommendation model 1.0.0", () => {
  it("freezes weights and exact component lookup tables", () => {
    expect(Object.values(RECOMMENDATION_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(1);
    expect(PREREQUISITE_SCORE).toEqual({ met: 100, partial: 60, unknown: 25, unmet: 0 });
    expect(BUDGET_CAPACITY).toEqual({ under_5k: 1, "5k_15k": 2, "15k_50k": 3, "50k_plus": 4, unknown: 2 });
    expect(PACE_CAPACITY).toEqual({ within_30_days: 1, "1_3_months": 2, "3_6_months": 3, "6_12_months": 4 });
    expect([1, 2, 3, 4].map((tier) => calculateBudgetFit(1, tier))).toEqual([100, 65, 30, 0]);
    expect([1, 2, 3, 4].map((tier) => calculateTimeToValue(1, tier))).toEqual([100, 70, 35, 35]);
    expect(calculateFitScore({ painPointFit: 95, prerequisiteReadiness: 100, budgetFit: 100, timeToValue: 100, riskFit: 100, dataReadiness: 50 })).toBe(93.5);
  });

  it("keeps all components and final fit bounded and rounded to one decimal", () => {
    for (const answers of [caseA, caseB, caseC]) {
      const { recommendation } = fullCase(answers);
      for (const item of recommendation.recommendations) {
        expect(Object.values(item.componentScores).every((value) => value >= 0 && value <= 100 && Number.isInteger(value * 10))).toBe(true);
        expect(item.fitScore).toBeGreaterThanOrEqual(0);
        expect(item.fitScore).toBeLessThanOrEqual(100);
        expect(Number.isInteger(item.fitScore * 10)).toBe(true);
      }
    }
  });

  it("uses primary matches to create candidates, supporting matches only to strengthen, and direct gaps without pain", () => {
    const neutral = twin(caseC);
    const diagnostic = buildDiagnosticResult(neutral, { now: () => now, id: () => "diagnostic_candidate01" });
    const ids = generateCapabilityCandidates(neutral, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0).map((item) => item.id);
    expect(ids).toContain("shared_customer_operations");
    expect(ids).toContain("scalable_cloud_operations");
    expect(ids).not.toContain("professional_team_collaboration");
    expect(ids).not.toContain("protected_business_continuity");

    const supportingOnly = EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0.definitions.find((item) => item.id === "governed_ai_automation")!;
    const noAiGap = { ...neutral, capabilities: neutral.capabilities.map((item) => item.capabilityId === "aiTools" ? { ...item, currentState: "active" as const } : item), readiness: { ...neutral.readiness, data: 5, process: 5 } };
    expect(generateCapabilityCandidates(noAiGap, diagnostic, { ...EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, definitions: [supportingOnly] })).toEqual([]);
  });

  it("cannot outweigh hard prerequisite, unknown prerequisite, or budget gates", () => {
    const { twin: value, diagnostic } = fullCase();
    const artificial = { ...diagnostic, painPoints: diagnostic.painPoints.map((pain) => ({ ...pain, priority: 100 })) };
    const results = selectCapabilityRecommendations(value, artificial, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0);
    const ai = results.find((item) => item.capabilityId === "governed_ai_automation")!;
    expect(ai.status).toBe("why_later");
    expect(ai.prerequisites.filter((item) => item.status !== "met").map((item) => item.ruleId)).toEqual(expect.arrayContaining(["ai_readiness_60", "data_3", "process_3"]));

    const unknownTwin = { ...value, readiness: { ...value.readiness, leadership: null, data: null, process: null } };
    const unknownAi = selectCapabilityRecommendations(unknownTwin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0).find((item) => item.capabilityId === "governed_ai_automation")!;
    expect(unknownAi.status).toBe("why_later");
    expect(unknownAi.prerequisites.some((item) => item.status === "unknown")).toBe(true);

    const expensive = EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0.definitions.find((item) => item.id === "scalable_cloud_operations")!;
    const scalingTwin = twin({ ...caseB, q3: { ...caseB.q3, biggestChallenge: "scaling_operations" }, q4: { ...caseB.q4, budgetBand: "under_5k" } });
    const scalingDiagnostic = buildDiagnosticResult(scalingTwin, { now: () => now, id: () => "diagnostic_budget001" });
    expect(selectCapabilityRecommendations(scalingTwin, scalingDiagnostic, { ...EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, definitions: [expensive] })[0].status).toBe("why_later");
  });

  it("applies status, roadmap, stable eligible ordering and stable capability tie-breaks", () => {
    const { recommendation } = fullCase(caseA, { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"]);
    expect(recommendation.recommendations.slice(0, 3).every((item) => item.status === "why_now")).toBe(true);
    expect(recommendation.recommendations.at(-1)?.status).toBe("why_later");
    expect(recommendation.recommendations.at(-1)?.roadmapPhase).toBe("Optimize");
    const tied = recommendation.recommendations.filter((item) => item.fitScore === 92.9).map((item) => item.capabilityId);
    expect(tied).toEqual([...tied].sort());
  });

  it("does not manufacture already-active foundations to fill Case C", () => {
    const { recommendation } = fullCase(caseC);
    expect(recommendation.recommendations.map((item) => item.capabilityId)).not.toEqual(expect.arrayContaining(["professional_team_collaboration", "protected_business_continuity", "measurable_digital_growth"]));
  });
});

describe("frozen cases and capability-first catalogue mapping", () => {
  it("freezes Case A order, statuses, components and approved offering selection", () => {
    const { recommendation } = fullCase(caseA, { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"]);
    expect(recommendation.recommendations.map((item) => [item.capabilityId, item.status, item.fitScore])).toEqual([
      ["shared_customer_operations", "why_now", 93.5],
      ["professional_team_collaboration", "why_now", 92.9],
      ["protected_business_continuity", "why_now", 92.9],
      ["protected_web_presence", "next", 92.9],
      ["governed_ai_automation", "why_later", 54.2],
    ]);
    expect(recommendation.recommendations[0].componentScores).toEqual({ painPointFit: 95, prerequisiteReadiness: 100, budgetFit: 100, timeToValue: 100, riskFit: 100, dataReadiness: 50 });
    expect(recommendation.recommendations[0].mappedOffering?.name).toBe("Freshsales CRM");
    const collaboration = recommendation.recommendations.find((item) => item.capabilityId === "professional_team_collaboration")!;
    expect(collaboration.mappedOffering?.name).toBe("EBiz Mail Pro Business Email");
    expect(collaboration.alternativeOfferingIds).toEqual(["exb_lark", "exb_google_workspace", "exb_microsoft_365"]);
    const ai = recommendation.recommendations.at(-1)!;
    expect(ai.mappedOffering?.futureFit).toBe(true);
    expect(ai.whyNowOrLater).toMatch(/AI readiness|Usable data|Process consistency/);
  });

  it("makes Case B favour foundations before AI and Case C stay selective", () => {
    const b = fullCase(caseB).recommendation.recommendations;
    expect(b.findIndex((item) => item.capabilityId === "professional_team_collaboration")).toBeLessThan(b.findIndex((item) => item.capabilityId === "governed_ai_automation"));
    expect(b.at(-1)?.capabilityId).toBe("governed_ai_automation");
    const c = fullCase(caseC).recommendation.recommendations;
    expect(c.length).toBeLessThan(b.length);
    expect(c.some((item) => item.capabilityId === "scalable_cloud_operations")).toBe(true);
  });

  it("validates unique IDs, HTTPS sources, known capabilities, version and active mappings", () => {
    expect(catalogueSchema.parse(EXABYTES_CATALOGUE_1_0_0)).toEqual(EXABYTES_CATALOGUE_1_0_0);
    const duplicate = { ...EXABYTES_CATALOGUE_1_0_0, offerings: [...EXABYTES_CATALOGUE_1_0_0.offerings, EXABYTES_CATALOGUE_1_0_0.offerings[0]] };
    expect(catalogueSchema.safeParse(duplicate).success).toBe(false);
    expect(catalogueSchema.safeParse({ ...EXABYTES_CATALOGUE_1_0_0, version: "1.0.1" }).success).toBe(false);
    expect(catalogueSchema.safeParse({ ...EXABYTES_CATALOGUE_1_0_0, offerings: EXABYTES_CATALOGUE_1_0_0.offerings.map((item, index) => index ? item : { ...item, sourceUrl: "http://example.com" }) }).success).toBe(false);
    expect(catalogueSchema.safeParse({ ...EXABYTES_CATALOGUE_1_0_0, offerings: EXABYTES_CATALOGUE_1_0_0.offerings.map((item, index) => index ? item : { ...item, capabilityIds: ["unknown_capability"] }) }).success).toBe(false);
    expect(catalogueSchema.safeParse({ ...EXABYTES_CATALOGUE_1_0_0, offerings: EXABYTES_CATALOGUE_1_0_0.offerings.map((item, index) => index ? item : { ...item, active: false }) }).success).toBe(false);
  });

  it("maps only after selection and fails closed for unknown, expired, or invalid catalogue data", () => {
    const { twin: value, diagnostic } = fullCase();
    const selected = selectCapabilityRecommendations(value, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0);
    expect(selected.every((item) => item.mappedOffering === undefined)).toBe(true);
    expect(mapOfferingsAfterSelection(selected, value, { version: "1.0.0", offerings: [], mappings: [] }, EXABYTES_OFFERING_SELECTION_1_0_0).every((item) => item.mappedOffering === undefined)).toBe(true);
    const expired = { ...EXABYTES_CATALOGUE_1_0_0, offerings: EXABYTES_CATALOGUE_1_0_0.offerings.map((item) => item.id === "exb_freshsales_crm" ? { ...item, active: false } : item) };
    const failed = mapOfferingsAfterSelection(selected, value, expired, EXABYTES_OFFERING_SELECTION_1_0_0);
    expect(failed.every((item) => item.mappedOffering === undefined)).toBe(true);
    expect(failed.map((item) => item.capabilityId)).toEqual(selected.map((item) => item.capabilityId));
  });

  it("maps a non-provider synthetic catalogue through the generic rule evaluator", () => {
    const { twin: value, diagnostic } = fullCase();
    const selected = selectCapabilityRecommendations(value, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0).filter((item) => item.capabilityId === "shared_customer_operations");
    const syntheticCatalogue = {
      version: "1.0.0",
      offerings: [{
        id: "vendor_customer_hub", provider: "Example Systems", name: "Customer Hub", active: true,
        capabilityIds: ["shared_customer_operations"], approvedFactSummary: "Maintains a shared customer record and follow-up workflow.",
        relativeCostTier: 2, pricingTreatment: "verify_current_quote", sourceUrl: "https://example.com/customer-hub",
        sourceLabel: "Official example source", verifiedAt: "2026-09-17", catalogueVersion: "1.0.0",
      }],
      mappings: [{ capabilityId: "shared_customer_operations", offeringId: "vendor_customer_hub", selectionRuleId: "synthetic_mapping", mappingReason: "Synthetic capability mapping for the generic-core contract." }],
    };
    const syntheticPolicy = { rules: [{
      id: "synthetic_cost_rule", capabilityId: "shared_customer_operations", offeringId: "vendor_customer_hub", priority: 10,
      conditions: [{ source: "constraint_concern", operator: "in", values: ["cost"] }], alternativeOfferingIds: [],
    }] };
    const mapped = mapOfferingsAfterSelection(selected, value, syntheticCatalogue, syntheticPolicy);
    expect(mapped[0].mappedOffering?.id).toBe("vendor_customer_hub");
    expect(mapped[0].mappedOffering?.provider).toBe("Example Systems");
    expect(mapped[0].mappedOffering?.selectionRuleId).toBe("synthetic_mapping");
  });

  it("emits only the strict approved catalogue-field subset and is deterministic", () => {
    const first = fullCase().recommendation;
    const second = fullCase().recommendation;
    expect(first).toEqual(second);
    const allowed = ["id", "provider", "name", "approvedFactSummary", "relativeCostTier", "pricingTreatment", "sourceUrl", "sourceLabel", "verifiedAt", "catalogueVersion", "selectionRuleId", "mappingReason", "futureFit"].sort();
    for (const item of first.recommendations.filter((entry) => entry.mappedOffering)) expect(Object.keys(item.mappedOffering!).sort()).toEqual(allowed);
    expect(JSON.stringify(first)).not.toMatch(/RM\s*\d|guarantee|savings/i);
  });
});

describe("recommendation persistence", () => {
  it("round-trips and distinguishes empty, corrupt and incompatible", () => {
    const { data, storage } = memoryStorage();
    const { twin: value, diagnostic, recommendation } = fullCase();
    expect(loadRecommendationResult(storage, value, diagnostic)).toEqual({ status: "empty" });
    saveRecommendationResult(storage, recommendation);
    expect(loadRecommendationResult(storage, value, diagnostic)).toEqual({ status: "ok", result: recommendation });
    data.set(RECOMMENDATION_STORAGE_KEY, "{bad");
    expect(loadRecommendationResult(storage, value, diagnostic)).toEqual({ status: "discarded", reason: "corrupt" });
    data.set(RECOMMENDATION_STORAGE_KEY, JSON.stringify({ ...recommendation, catalogueVersion: "0.9.0" }));
    expect(loadRecommendationResult(storage, value, diagnostic)).toEqual({ status: "discarded", reason: "incompatible" });
  });

  it("invalidates every session, twin, revision, diagnostic, score, pain, recommendation and catalogue dimension", () => {
    const { twin: value, diagnostic, recommendation } = fullCase();
    const variants: Array<[typeof value, DiagnosticResult, typeof recommendation]> = [
      [{ ...value, assessmentSessionId: assessmentSessionIdSchema.parse("assessment_changed0001") }, diagnostic, recommendation],
      [{ ...value, id: "twin_changed0000001" as typeof value.id }, diagnostic, recommendation],
      [{ ...value, revision: 2 }, diagnostic, recommendation],
      [value, { ...diagnostic, id: "diagnostic_changed0001" as typeof diagnostic.id }, recommendation],
      [value, { ...diagnostic, scoreModelVersion: "9.9.9" } as unknown as DiagnosticResult, recommendation],
      [value, { ...diagnostic, painModelVersion: "9.9.9" } as unknown as DiagnosticResult, recommendation],
      [value, diagnostic, { ...recommendation, recommendationModelVersion: "9.9.9" } as unknown as typeof recommendation],
      [value, diagnostic, { ...recommendation, catalogueVersion: "9.9.9" } as unknown as typeof recommendation],
    ];
    for (const [changedTwin, changedDiagnostic, changedResult] of variants) expect(isRecommendationCurrent(changedResult, changedTwin, changedDiagnostic)).toBe(false);
  });

  it("schema rejects extra or missing persisted product facts", () => {
    const result = fullCase().recommendation;
    const offering = result.recommendations.find((item) => item.mappedOffering)!.mappedOffering!;
    expect(recommendationResultSchema.safeParse({ ...result, recommendations: [{ ...result.recommendations[0], mappedOffering: { ...offering, price: "RM 1" } }, ...result.recommendations.slice(1)] }).success).toBe(false);
  });
});
