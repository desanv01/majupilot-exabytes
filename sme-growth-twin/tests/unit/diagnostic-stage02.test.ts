import { describe, expect, it } from "vitest";

import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import {
  AI_READINESS_DIMENSIONS,
  CAPABILITY_STATE_POINTS,
  DIGITAL_MATURITY_DIMENSIONS,
  READINESS_POINTS,
  calculateAiReadiness,
  calculateDigitalMaturity,
  metricBand,
} from "../../src/core/scoring/diagnostic-scoring";
import { PAIN_DEFINITIONS, rankPainPoints } from "../../src/core/pain-points/rank-pain-points";
import type { CoreAnswers, FollowUpAnswers, FollowUpId } from "../../src/domain/assessment";
import { assessmentSessionIdSchema } from "../../src/domain/ids";
import {
  DIAGNOSTIC_STORAGE_KEY,
  loadDiagnosticResult,
  saveDiagnosticResult,
} from "../../src/infrastructure/persistence/local-diagnostic-store";

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
  q2: { websiteOrStore: "active", businessEmail: "active", cloudProductivity: "active", crm: "informal", digitalMarketingAnalytics: "active", backup: "active", cybersecurityControls: "informal", aiTools: "informal" },
  q3: { biggestChallenge: "scaling_operations", manualWorkflow: "Capacity planning across client projects", manualHoursPerWeek: 6, affectedEmployees: 6, urgency: 3 },
  q4: { primaryObjective: "increase_productivity", budgetBand: "15k_50k", implementationPace: "3_6_months", highestConcern: "security" },
  q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 5, processConsistency: 3, changeWillingness: 5 },
};

function twin(answers: CoreAnswers, followUpAnswers: FollowUpAnswers = {}, selectedFollowUpIds: FollowUpId[] = [], revision = 1) {
  let sequence = 0;
  return buildBusinessTwin(
    { sessionId: assessmentSessionIdSchema.parse("assessment_stage020001"), answers, selectedFollowUpIds, followUpAnswers, revision },
    { now: () => now, id: (kind) => `${kind}_stage02${String(++sequence).padStart(4, "0")}` },
  );
}

function diagnostic(answers = caseA, followUpAnswers: FollowUpAnswers = {}, selected: FollowUpId[] = []) {
  return buildDiagnosticResult(twin(answers, followUpAnswers, selected), { now: () => now, id: () => "diagnostic_stage020001" });
}

function memoryStorage() {
  const data = new Map<string, string>();
  return { data, storage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) } };
}

describe("score model 1.0.0", () => {
  it("freezes exact weights and point maps", () => {
    expect(DIGITAL_MATURITY_DIMENSIONS.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(AI_READINESS_DIMENSIONS.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
    expect(CAPABILITY_STATE_POINTS).toEqual({ not_used: 0, informal: 40, active: 100, unknown: null });
    expect(READINESS_POINTS).toEqual({ 1: 0, 2: 25, 3: 50, 4: 75, 5: 100 });
  });

  it("produces frozen Case A scores, dimensions, confidence and pain order", () => {
    const result = diagnostic(caseA, { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"]);
    expect(result.digitalMaturity.value).toBe(37.5);
    expect(result.digitalMaturity.bandId).toBe("building");
    expect(result.digitalMaturity.confidence).toBe(1);
    expect(result.digitalMaturity.dimensions.map((item) => item.score)).toEqual([100, 26, 0, 100, 18, 0]);
    expect(result.aiReadiness.value).toBe(42.5);
    expect(result.aiReadiness.bandId).toBe("prepare_and_pilot");
    expect(result.aiReadiness.confidence).toBe(1);
    expect(result.aiReadiness.dimensions.map((item) => item.score)).toEqual([75, 25, 50, 25]);
    expect(result.painPoints.map((item) => [item.id, item.priority])).toEqual([
      ["pain_customer_followup", 95],
      ["pain_data_visibility", 86.3],
      ["pain_scaling_operations", 86.3],
      ["pain_collaboration", 76.3],
      ["pain_manual_work", 76.3],
      ["pain_security_continuity", 76.3],
    ]);
    expect(result.painPoints.map((item) => item.id)).toEqual(expect.arrayContaining(["pain_security_continuity", "pain_manual_work"]));
    expect(result.painPoints.every((item) => item.evidenceIds.length > 0)).toBe(true);
  });

  it("excludes unknown/null, lowers confidence, and treats all unknown as insufficient evidence", () => {
    const unknown = twin({ ...caseA, q2: Object.fromEntries(Object.keys(caseA.q2).map((key) => [key, "unknown"])) as CoreAnswers["q2"], q5: { leadershipSponsorship: null, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null } });
    const digital = calculateDigitalMaturity(unknown);
    const readiness = calculateAiReadiness(unknown);
    expect(digital.value).toBeNull();
    expect(digital.bandId).toBe("insufficient_evidence");
    expect(digital.confidence).toBe(0);
    expect(readiness.value).toBeNull();
    expect(readiness.confidence).toBe(0);
    expect(digital.missingEvidence.length).toBe(8);
  });

  it("excludes a non-null input when its exact evidence record is absent", () => {
    const value = twin(caseA);
    value.evidence = value.evidence.filter((item) => item.sourceRef !== "q2.websiteOrStore");
    const digital = calculateDigitalMaturity(value);
    expect(digital.dimensions[0].score).toBeNull();
    expect(digital.dimensions[0].contributions).toEqual([]);
    expect(digital.dimensions[0].missingEvidence).toEqual(["Website or online store"]);
    expect(digital.confidence).toBe(0.85);

    const readinessTwin = twin(caseA);
    readinessTwin.evidence = readinessTwin.evidence.filter((item) => item.sourceRef !== "q5.usableData");
    const readiness = calculateAiReadiness(readinessTwin);
    expect(readiness.dimensions[1].score).toBeNull();
    expect(readiness.missingEvidence).toContain("Usable data");
    expect(readiness.confidence).toBe(0.7);
  });

  it("keeps values bounded, evidence unique/valid, and rule versions present", () => {
    for (const answers of [caseA, caseB, caseC]) {
      const currentTwin = twin(answers);
      const result = buildDiagnosticResult(currentTwin, { now: () => now, id: () => "diagnostic_bounds0001" });
      const evidence = new Set(currentTwin.evidence.map((item) => item.id));
      for (const metric of [result.digitalMaturity, result.aiReadiness]) {
        if (metric.value !== null) expect(metric.value).toBeGreaterThanOrEqual(0);
        if (metric.value !== null) expect(metric.value).toBeLessThanOrEqual(100);
        expect(metric.rulesVersion).toBe("1.0.0");
        expect(new Set(metric.evidenceIds).size).toBe(metric.evidenceIds.length);
        expect(metric.dimensions.flatMap((item) => item.evidenceIds).every((id) => evidence.has(id))).toBe(true);
      }
      expect(result.painPoints.every((item) => [item.impact, item.urgency, item.strategicAlignment, item.confidence, item.priority].every((value) => value >= 0 && value <= 100))).toBe(true);
    }
  });

  it("uses exact band boundaries", () => {
    expect(metricBand("digital", 24.9).bandId).toBe("starting");
    expect(metricBand("digital", 25).bandId).toBe("building");
    expect(metricBand("digital", 50).bandId).toBe("connected");
    expect(metricBand("digital", 75).bandId).toBe("optimizing");
    expect(metricBand("readiness", 39.9).bandId).toBe("foundation_first");
    expect(metricBand("readiness", 40).bandId).toBe("prepare_and_pilot");
    expect(metricBand("readiness", 60).bandId).toBe("targeted_adoption");
    expect(metricBand("readiness", 80).bandId).toBe("scale_responsibly");
  });

  it("is monotonic within a capability dimension and applies stable factor ties", () => {
    const low = calculateDigitalMaturity(twin({ ...caseA, q2: { ...caseA.q2, websiteOrStore: "not_used" } }));
    const high = calculateDigitalMaturity(twin({ ...caseA, q2: { ...caseA.q2, websiteOrStore: "active" } }));
    expect(high.dimensions[0].score).toBeGreaterThanOrEqual(low.dimensions[0].score ?? 0);
    const tied = calculateDigitalMaturity(twin({ ...caseA, q2: Object.fromEntries(Object.keys(caseA.q2).map((key) => [key, "active"])) as CoreAnswers["q2"] }));
    expect(tied.strongestPositiveFactor).toContain("Website and commerce");
    expect(tied.largestLimitingFactor).toContain("CRM and customer operations");
  });
});

describe("pain model 1.0.0", () => {
  const neutral: CoreAnswers = { ...caseC, q2: Object.fromEntries(Object.keys(caseC.q2).map((key) => [key, "active"])) as CoreAnswers["q2"], q3: { ...caseC.q3, biggestChallenge: "other", challengeOther: "No current blocker", manualHoursPerWeek: 0, affectedEmployees: 1 }, q4: { ...caseC.q4, primaryObjective: "improve_retention", highestConcern: "cost" }, q5: { leadershipSponsorship: 5, usableData: 5, employeeDigitalSkills: 5, processConsistency: 5, changeWillingness: 5 } };
  const positives: Record<string, CoreAnswers> = {
    pain_customer_followup: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "customer_management" } },
    pain_manual_work: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "manual_work" } },
    pain_security_continuity: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "security_continuity" } },
    pain_lead_generation: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "lead_generation" } },
    pain_collaboration: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "team_collaboration" } },
    pain_data_visibility: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "data_visibility" } },
    pain_scaling_operations: { ...neutral, q3: { ...neutral.q3, biggestChallenge: "scaling_operations" } },
    pain_ai_foundation: { ...neutral, q4: { ...neutral.q4, primaryObjective: "launch_ai_capability" }, q5: { ...neutral.q5, usableData: 2 } },
  };

  it("has positive and negative fixtures for all eight definitions", () => {
    expect(PAIN_DEFINITIONS).toHaveLength(8);
    const negativeIds = rankPainPoints(twin(neutral)).map((item) => item.id);
    for (const definition of PAIN_DEFINITIONS) {
      expect(rankPainPoints(twin(positives[definition.id])).map((item) => item.id)).toContain(definition.id);
      expect(negativeIds).not.toContain(definition.id);
    }
  });

  it("uses exact priority arithmetic and stable tie-breaking", () => {
    const result = diagnostic(caseA, { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"]);
    const first = result.painPoints[0];
    expect(first.priority).toBe(Math.round((first.impact * .35 + first.urgency * .25 + first.strategicAlignment * .2 + first.confidence * .2) * 10) / 10);
    expect(result.painPoints.findIndex((item) => item.id === "pain_data_visibility")).toBeLessThan(result.painPoints.findIndex((item) => item.id === "pain_scaling_operations"));
  });

  it("emits nothing when matching evidence is absent", () => {
    const value = twin(neutral);
    value.evidence = [];
    expect(rankPainPoints(value)).toEqual([]);
  });

  it("does not let shared urgency/objective/pace evidence justify a pain trigger", () => {
    const value = twin(positives.pain_customer_followup);
    value.evidence = value.evidence.filter((item) => item.sourceRef !== "q3.biggestChallenge");
    expect(value.evidence.some((item) => item.sourceRef === "q3.urgency")).toBe(true);
    expect(value.evidence.some((item) => item.sourceRef === "q4.primaryObjective")).toBe(true);
    expect(value.evidence.some((item) => item.sourceRef === "q4.implementationPace")).toBe(true);
    expect(rankPainPoints(value).map((item) => item.id)).not.toContain("pain_customer_followup");
  });
});

describe("golden contrasts and deterministic persistence", () => {
  it("makes Cases B and C meaningfully distinct", () => {
    const b = diagnostic(caseB);
    const c = diagnostic(caseC);
    expect(c.digitalMaturity.value).toBeGreaterThan(b.digitalMaturity.value ?? 0);
    expect(c.aiReadiness.value).toBeGreaterThan(b.aiReadiness.value ?? 0);
    expect(b.painPoints[0].id).toBe("pain_manual_work");
    expect(c.painPoints.map((item) => item.id)).toContain("pain_scaling_operations");
  });

  it("is identical for identical inputs and injected factories", () => {
    expect(diagnostic()).toEqual(diagnostic());
  });

  it("handles round-trip, empty, corrupt, incompatible and stale result states", () => {
    const { data, storage } = memoryStorage();
    const currentTwin = twin(caseA);
    const result = buildDiagnosticResult(currentTwin, { now: () => now, id: () => "diagnostic_stage020001" });
    expect(loadDiagnosticResult(storage, currentTwin)).toEqual({ status: "empty" });
    saveDiagnosticResult(storage, result);
    expect(loadDiagnosticResult(storage, currentTwin)).toEqual({ status: "ok", result });
    data.set(DIAGNOSTIC_STORAGE_KEY, "{bad");
    expect(loadDiagnosticResult(storage, currentTwin)).toEqual({ status: "discarded", reason: "corrupt" });
    data.set(DIAGNOSTIC_STORAGE_KEY, JSON.stringify({ ...result, scoreModelVersion: "0.9.0" }));
    expect(loadDiagnosticResult(storage, currentTwin)).toEqual({ status: "discarded", reason: "incompatible" });
    saveDiagnosticResult(storage, result);
    expect(loadDiagnosticResult(storage, { ...currentTwin, revision: 2 })).toEqual({ status: "discarded", reason: "stale" });
    expect(data.has(DIAGNOSTIC_STORAGE_KEY)).toBe(false);
  });
});
