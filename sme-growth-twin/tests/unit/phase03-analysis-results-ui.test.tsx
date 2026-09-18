import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import { ResultsView } from "../../src/components/diagnostics/results-client";
import type { CoreAnswers } from "../../src/domain/assessment";
import { goldenFixtureById } from "../../src/domain-packs/exabytes/golden-fixtures";
import { assessmentSessionIdSchema } from "../../src/domain/ids";

const caseA = goldenFixtureById("case-a");

function renderAnswers(answers: CoreAnswers, suffix: string) {
  let sequence = 0;
  const twin = buildBusinessTwin(
    {
      sessionId: assessmentSessionIdSchema.parse(`assessment_phase03${suffix}`),
      answers,
      selectedFollowUpIds: suffix === "casea" ? caseA.selectedFollowUpIds : [],
      followUpAnswers: suffix === "casea" ? caseA.followUpAnswers : {},
    },
    {
      now: () => "2026-09-18T09:00:00+08:00",
      id: (kind) => `${kind}_phase03${suffix}${String(++sequence).padStart(4, "0")}`,
    },
  );
  const result = buildDiagnosticResult(twin, {
    now: () => "2026-09-18T09:00:01+08:00",
    id: () => `diagnostic_phase03${suffix}`,
  });
  return { html: renderToStaticMarkup(<ResultsView result={result} twin={twin} onEdit={() => undefined} />), result };
}

describe("Phase 03 analysis and results surface", () => {
  it("renders Case A as a complete evidence-first diagnostic without fabricated claims", () => {
    const { html, result } = renderAnswers(caseA.answers, "casea");
    expect(result.digitalMaturity.value).toBe(37.5);
    expect(result.aiReadiness.value).toBe(42.5);
    expect(html).toContain("Six maturity dimensions");
    expect(html).toContain("Four readiness dimensions");
    expect(html).toContain("Score</strong> shows the calculated capability level");
    expect(html).toContain("Confidence</strong> shows how much configured evidence was available");
    expect(html).toContain("Contributing evidence");
    expect(html).toContain("Calculation details");
    expect(html).toContain("All triggered pain findings");
    expect(html).toContain("Capability recommendations come next");
    expect(html).not.toMatch(/external source|benchmark date|target gap|Exabytes product|guaranteed ROI/i);
    expect(html).not.toMatch(/[—–]/);
  });

  it("keeps low-confidence evidence distinct from a low score", () => {
    const answers: CoreAnswers = {
      ...caseA.answers,
      q2: { ...caseA.answers.q2, crm: "unknown", backup: "unknown", cybersecurityControls: "unknown", aiTools: "unknown" },
      q5: { leadershipSponsorship: 4, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null },
    };
    const { html, result } = renderAnswers(answers, "lowconfidence");
    expect(result.aiReadiness.value).not.toBeNull();
    expect(result.aiReadiness.confidence).toBeLessThan(0.5);
    expect(html).toContain("Some evidence is unavailable");
    expect(html).toContain("Low confidence");
    expect(html).toContain("Missing evidence");
    expect(html).toContain("excluded from scoring and lowers confidence instead of being treated as zero");
  });

  it("shows an honest insufficient-evidence state when every scored input is unknown", () => {
    const answers: CoreAnswers = {
      q1: caseA.answers.q1,
      q2: {
        websiteOrStore: "unknown",
        businessEmail: "unknown",
        cloudProductivity: "unknown",
        crm: "unknown",
        digitalMarketingAnalytics: "unknown",
        backup: "unknown",
        cybersecurityControls: "unknown",
        aiTools: "unknown",
      },
      q3: { biggestChallenge: "other", challengeOther: "General planning", manualWorkflow: "General planning workflow", manualHoursPerWeek: null, affectedEmployees: null, urgency: 1 },
      q4: { ...caseA.answers.q4, primaryObjective: "improve_retention" },
      q5: { leadershipSponsorship: null, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null },
    };
    const { html, result } = renderAnswers(answers, "unknowns");
    expect(result.digitalMaturity.value).toBeNull();
    expect(result.aiReadiness.value).toBeNull();
    expect(html.match(/Not available/g)?.length).toBeGreaterThan(2);
    expect(html).toContain("More recorded evidence is needed before a gap can be identified");
    expect(html).toContain("No evidence-linked pain finding was emitted");
  });

  it("keeps analysis deterministic, finite, retryable, and local", async () => {
    const analysis = await readFile(path.join(process.cwd(), "src/components/diagnostics/analysis-client.tsx"), "utf8");
    expect(analysis).toContain("ANALYSIS_STEPS");
    expect(analysis).toContain("Try again");
    expect(analysis).toContain("prefers-reduced-motion: reduce");
    expect(analysis).toContain("setTimeout");
    expect(analysis).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|EventSource/);
  });
});
