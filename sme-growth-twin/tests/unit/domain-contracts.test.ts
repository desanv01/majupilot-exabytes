import { describe, expect, it } from "vitest";

import {
  assessmentSessionSchema,
  businessTwinSchema,
  scoreResultSchema,
} from "../../src/domain";

const now = "2026-09-17T09:00:00+08:00";

describe("domain boundary contracts", () => {
  it("accepts a minimal separated assessment and business twin", () => {
    const session = assessmentSessionSchema.parse({
      id: "assessment_demo0001",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    const twin = businessTwinSchema.parse({
      id: "twin_demo0001",
      assessmentSessionId: session.id,
      schemaVersion: "1.0.0",
      revision: 1,
      facts: [
        {
          key: "business_name",
          value: "Example SME",
          evidenceIds: ["evidence_demo0001"],
        },
      ],
      evidence: [
        {
          id: "evidence_demo0001",
          source: "user_fact",
          sourceRef: "test_fixture",
          capturedAt: now,
          confidence: 1,
        },
      ],
      assumptions: [
        {
          id: "assumption_demo0001",
          key: "example_only",
          value: true,
          rationale: "Proves assumptions remain separate from user facts.",
        },
      ],
      generatedAt: now,
      identity: { businessName:"Example SME",industry:"other",industryOther:"Services",businessModel:"b2b",employeeBand:"1_9",description:"An example small business." },
      objectives: [], capabilities: [], processes: [],
      constraints: { budgetBand:"unknown",implementationPace:"3_6_months",concerns:[] },
      readiness: { leadership:null,data:null,skills:null,process:null,changeWillingness:null },
      followUps: [],
    });

    expect(twin.facts).toHaveLength(1);
    expect(twin.evidence).toHaveLength(1);
    expect(twin.assumptions).toHaveLength(1);
  });

  it("rejects out-of-range score values at the untrusted boundary", () => {
    const result = scoreResultSchema.safeParse({
      id: "score_demo0001",
      metric: "example",
      value: 101,
      band: "invalid",
      confidence: 1,
      rulesVersion: "1.0.0",
      explanation: {
        evidenceIds: [],
        missingEvidence: ["example"],
        strongestPositiveFactor: "Example only",
        largestLimitingFactor: "Example only",
        improvementAction: "Example only",
      },
    });

    expect(result.success).toBe(false);
  });
});
