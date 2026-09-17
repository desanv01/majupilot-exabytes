import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AssessmentStepContent } from "../../src/components/assessment/assessment-client";
import { BusinessTwinReviewCards } from "../../src/components/assessment/review-client";
import { assessmentDraftSchema } from "../../src/domain/assessment";
import { businessTwinSchema } from "../../src/domain/business-twin";

const now = "2026-09-17T09:00:00+08:00";

function draft(currentStep: number) {
  return assessmentDraftSchema.parse({
    schemaVersion: "1.0.0",
    sessionId: "assessment_smoke0001",
    status: "in_progress",
    currentStep,
    twinRevision: 1,
    answers: {},
    selectedFollowUpIds:
      currentStep === 6 ? ["fu_ai_usage", "fu_backup_frequency"] : [],
    followUpAnswers: {},
    updatedAt: now,
  });
}

const twin = businessTwinSchema.parse({
  id: "twin_smoke0001",
  assessmentSessionId: "assessment_smoke0001",
  schemaVersion: "1.0.0",
  revision: 2,
  facts: [],
  evidence: [],
  assumptions: [],
  generatedAt: now,
  identity: {
    businessName: "Example SME",
    industry: "professional_services",
    businessModel: "b2b",
    employeeBand: "10_24",
    description: "A Malaysian professional services business.",
  },
  objectives: [
    { objectiveId: "primary", type: "increase_productivity", timeHorizonMonths: 12 },
  ],
  capabilities: [
    {
      capabilityId: "crm",
      currentState: "informal",
      evidenceIds: [],
      confidence: 1,
    },
  ],
  processes: [
    {
      processId: "primary_manual_workflow",
      name: "Manual client intake",
      manualHoursPerWeek: null,
      participants: 3,
      painSignals: [],
      evidenceIds: [],
    },
  ],
  constraints: {
    budgetBand: "unknown",
    implementationPace: "3_6_months",
    concerns: ["adoption"],
  },
  readiness: {
    leadership: 4,
    data: null,
    skills: 3,
    process: 2,
    changeWillingness: 4,
  },
  followUps: [],
});

const forbiddenOutputs = /recommendation|advisor|scenario|overall score/i;

describe("Stage 01 render smoke states", () => {
  it("renders the capability question with linked validation semantics", () => {
    const html = renderToStaticMarkup(
      <AssessmentStepContent
        draft={draft(2)}
        update={() => undefined}
        setDraft={() => undefined}
        errors={{ websiteOrStore: "Choose one option." }}
      />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="websiteOrStore-error"');
    expect(html).not.toMatch(forbiddenOutputs);
  });

  it("renders follow-ups, including explicit Not sure, without analysis output", () => {
    const html = renderToStaticMarkup(
      <AssessmentStepContent
        draft={draft(6)}
        update={() => undefined}
        setDraft={() => undefined}
        errors={{ fu_ai_usage: "Choose at least one option." }}
      />,
    );
    expect(html).toContain("Not sure");
    expect(html).toContain('aria-invalid="true"');
    expect(html).not.toMatch(forbiddenOutputs);
  });

  it("renders human-readable review cards with no fabricated outputs", () => {
    const html = renderToStaticMarkup(
      <BusinessTwinReviewCards twin={twin} onEdit={() => undefined} />,
    );
    expect(html).toContain("Professional services");
    expect(html).toContain("Increase productivity");
    expect(html).toContain("Not sure");
    expect(html).not.toContain("professional_services");
    expect(html).not.toContain("increase_productivity");
    expect(html).not.toMatch(forbiddenOutputs);
  });
});
