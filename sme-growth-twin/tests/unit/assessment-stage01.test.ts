import { describe, expect, it } from "vitest";

import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import {
  beginTwinEdit,
  completeCoreAssessment,
  reconcileFollowUpAnswers,
  selectFollowUps,
  toggleAiUsageAnswer,
} from "../../src/core/assessment/follow-ups";
import {
  assessmentDraftSchema,
  coreAnswersSchema,
  q1Schema,
  q2Schema,
  q3Schema,
  q4Schema,
  q5Schema,
  type AssessmentDraft,
  type CoreAnswers,
} from "../../src/domain/assessment";
import { assessmentSessionIdSchema } from "../../src/domain/ids";
import {
  ASSESSMENT_STORAGE_KEY,
  loadAssessmentDraft,
  saveAssessmentDraft,
} from "../../src/infrastructure/persistence/local-assessment-store";

const now = "2026-09-17T09:00:00+08:00";

const caseA: CoreAnswers = {
  q1: {
    businessName: "Kopi Kita Café Group",
    industry: "food_beverage",
    businessModel: "b2c",
    employeeBand: "25_49",
    description: "Three Malaysian café outlets serving walk-in and catering customers.",
  },
  q2: {
    websiteOrStore: "active",
    businessEmail: "not_used",
    cloudProductivity: "informal",
    crm: "not_used",
    digitalMarketingAnalytics: "active",
    backup: "not_used",
    cybersecurityControls: "informal",
    aiTools: "not_used",
  },
  q3: {
    biggestChallenge: "customer_management",
    manualWorkflow: "WhatsApp orders and catering enquiries",
    manualHoursPerWeek: null,
    affectedEmployees: 8,
    urgency: 4,
  },
  q4: {
    primaryObjective: "increase_revenue",
    budgetBand: "5k_15k",
    implementationPace: "1_3_months",
    highestConcern: "cost",
  },
  q5: {
    leadershipSponsorship: 4,
    usableData: 2,
    employeeDigitalSkills: 3,
    processConsistency: 2,
    changeWillingness: 4,
  },
};

const noFollowUps: CoreAnswers = {
  ...caseA,
  q2: {
    ...caseA.q2,
    websiteOrStore: "informal",
    crm: "active",
    backup: "active",
    aiTools: "not_used",
  },
  q3: {
    ...caseA.q3,
    biggestChallenge: "manual_work",
    manualHoursPerWeek: 4,
  },
  q4: { ...caseA.q4, primaryObjective: "reduce_cost" },
  q5: {
    leadershipSponsorship: 5,
    usableData: 5,
    employeeDigitalSkills: 5,
    processConsistency: 5,
    changeWillingness: 5,
  },
};

function draft(overrides: Partial<AssessmentDraft> = {}): AssessmentDraft {
  return assessmentDraftSchema.parse({
    schemaVersion: "1.0.0",
    sessionId: "assessment_casea0001",
    status: "in_progress",
    currentStep: 1,
    twinRevision: 1,
    answers: {},
    selectedFollowUpIds: [],
    followUpAnswers: {},
    updatedAt: now,
    ...overrides,
  });
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    storage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    },
  };
}

describe("Stage 01 schemas", () => {
  it("accepts valid steps and rejects missing conditional fields", () => {
    for (const [schema, value] of [
      [q1Schema, caseA.q1],
      [q2Schema, caseA.q2],
      [q3Schema, caseA.q3],
      [q4Schema, caseA.q4],
      [q5Schema, caseA.q5],
    ] as const) {
      expect(schema.safeParse(value).success).toBe(true);
    }

    expect(
      q1Schema.safeParse({ ...caseA.q1, industry: "other", industryOther: "" })
        .success,
    ).toBe(false);
    expect(
      q3Schema.safeParse({
        ...caseA.q3,
        biggestChallenge: "other",
        challengeOther: "",
      }).success,
    ).toBe(false);
  });

  it("preserves explicit unknown and null values", () => {
    const answers = coreAnswersSchema.parse({
      ...caseA,
      q2: { ...caseA.q2, backup: "unknown" },
      q5: { ...caseA.q5, usableData: null },
    });
    expect(answers.q2.backup).toBe("unknown");
    expect(answers.q5.usableData).toBeNull();
  });
});

describe("follow-up selection and reconciliation", () => {
  it("is stable, unique, bounded, and selects Case A priorities", () => {
    const selected = selectFollowUps(caseA);
    expect(selected).toEqual([
      "fu_manual_hours",
      "fu_customer_records",
      "fu_backup_frequency",
    ]);
    expect(new Set(selected).size).toBe(selected.length);
    expect(selectFollowUps(caseA)).toEqual(selected);
  });

  it("returns no questions when no trigger applies", () => {
    expect(selectFollowUps(noFollowUps)).toEqual([]);
  });

  it("removes obsolete answers while preserving still-selected answers", () => {
    expect(
      reconcileFollowUpAnswers(
        ["fu_customer_records", "fu_backup_frequency"],
        {
          fu_manual_hours: "11_20",
          fu_customer_records: "messaging_apps",
          fu_backup_frequency: "weekly",
        },
      ),
    ).toEqual({
      fu_customer_records: "messaging_apps",
      fu_backup_frequency: "weekly",
    });
  });

  it("keeps Not sure mutually exclusive for AI usage", () => {
    expect(toggleAiUsageAnswer(["content"], "unknown")).toEqual(["unknown"]);
    expect(toggleAiUsageAnswer(["unknown"], "analysis")).toEqual(["analysis"]);
    expect(toggleAiUsageAnswer(["content", "analysis"], "content")).toEqual([
      "analysis",
    ]);
  });
});

describe("completion and edit policy", () => {
  it("saves the no-follow-up Q5 completion before a review can reload it", () => {
    const { storage } = memoryStorage();
    const completed = completeCoreAssessment(
      draft({ currentStep: 5, answers: noFollowUps }),
      noFollowUps,
      now,
    );

    expect(completed.status).toBe("ready_for_review");
    expect(completed.selectedFollowUpIds).toEqual([]);
    expect(completed.answers.q5).toEqual(noFollowUps.q5);
    saveAssessmentDraft(storage, completed);
    expect(loadAssessmentDraft(storage)).toEqual({ status: "ok", draft: completed });
  });

  it("preserves answers when moving back and increments once when editing a twin", () => {
    const ready = draft({
      status: "ready_for_review",
      currentStep: 6,
      answers: caseA,
      selectedFollowUpIds: selectFollowUps(caseA),
      twinRevision: 3,
    });
    const back = { ...ready, currentStep: 4 as const };
    expect(back.answers).toEqual(ready.answers);

    const edited = beginTwinEdit(ready, 2, now);
    expect(edited.answers).toEqual(ready.answers);
    expect(edited.currentStep).toBe(2);
    expect(edited.status).toBe("in_progress");
    expect(edited.twinRevision).toBe(4);
  });
});

describe("Business Twin mapping", () => {
  it("is deterministic, evidence-linked, revisioned, and assumption-free", () => {
    const input = {
      sessionId: assessmentSessionIdSchema.parse("assessment_casea0001"),
      answers: caseA,
      selectedFollowUpIds: selectFollowUps(caseA),
      followUpAnswers: {
        fu_manual_hours: "11_20" as const,
        fu_customer_records: "messaging_apps" as const,
        fu_backup_frequency: "none" as const,
      },
      revision: 4,
    };
    const factory = () => {
      let sequence = 0;
      return {
        now: () => now,
        id: (kind: "twin" | "evidence") =>
          `${kind}_fixed${String(++sequence).padStart(4, "0")}`,
      };
    };
    const twin = buildBusinessTwin(input, factory());
    expect(twin).toEqual(buildBusinessTwin(input, factory()));
    expect(twin.revision).toBe(4);
    const evidenceIds = new Set(twin.evidence.map((item) => item.id));
    expect(
      twin.capabilities.every((capability) =>
        capability.evidenceIds.every((id) => evidenceIds.has(id)),
      ),
    ).toBe(true);
    expect(twin.assumptions).toEqual([]);
    expect(twin.evidence.every((item) => item.source === "user_fact")).toBe(true);
  });

  it("lowers confidence for an explicit unknown", () => {
    let sequence = 0;
    const twin = buildBusinessTwin(
      {
        sessionId: assessmentSessionIdSchema.parse("assessment_casea0001"),
        answers: { ...caseA, q2: { ...caseA.q2, backup: "unknown" } },
        selectedFollowUpIds: [],
        followUpAnswers: {},
      },
      {
        now: () => now,
        id: (kind) => `${kind}_unknown${String(++sequence).padStart(4, "0")}`,
      },
    );
    expect(
      twin.capabilities.find((item) => item.capabilityId === "backup")?.confidence,
    ).toBeLessThan(1);
  });
});

describe("local draft adapter", () => {
  it("round-trips valid state and rejects corrupt content", () => {
    const { data, storage } = memoryStorage();
    const validDraft = draft({ currentStep: 3, answers: { q1: caseA.q1, q2: caseA.q2 } });
    saveAssessmentDraft(storage, validDraft);
    expect(loadAssessmentDraft(storage)).toEqual({ status: "ok", draft: validDraft });

    data.set(ASSESSMENT_STORAGE_KEY, "{bad");
    expect(loadAssessmentDraft(storage)).toEqual({ status: "discarded", reason: "corrupt" });
    expect(data.has(ASSESSMENT_STORAGE_KEY)).toBe(false);
  });

  it("discards and removes an incompatible stored version", () => {
    const { data, storage } = memoryStorage();
    data.set(
      ASSESSMENT_STORAGE_KEY,
      JSON.stringify({ ...draft(), schemaVersion: "0.9.0" }),
    );
    expect(loadAssessmentDraft(storage)).toEqual({
      status: "discarded",
      reason: "incompatible",
    });
    expect(data.has(ASSESSMENT_STORAGE_KEY)).toBe(false);
  });
});
