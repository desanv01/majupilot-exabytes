import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import { ResultsView } from "../../src/components/diagnostics/results-client";
import type { CoreAnswers } from "../../src/domain/assessment";
import { assessmentSessionIdSchema } from "../../src/domain/ids";

const answers: CoreAnswers = {
  q1: { businessName: "Kopi Kita Café Group", industry: "food_beverage", businessModel: "b2c", employeeBand: "25_49", description: "Three Malaysian café outlets serving walk-in and catering customers." },
  q2: { websiteOrStore: "active", businessEmail: "not_used", cloudProductivity: "informal", crm: "not_used", digitalMarketingAnalytics: "active", backup: "not_used", cybersecurityControls: "informal", aiTools: "not_used" },
  q3: { biggestChallenge: "customer_management", manualWorkflow: "WhatsApp orders and catering enquiries", manualHoursPerWeek: null, affectedEmployees: 8, urgency: 4 },
  q4: { primaryObjective: "increase_revenue", budgetBand: "5k_15k", implementationPace: "1_3_months", highestConcern: "cost" },
  q5: { leadershipSponsorship: 4, usableData: 2, employeeDigitalSkills: 3, processConsistency: 2, changeWillingness: 4 },
};

let sequence = 0;
const twin = buildBusinessTwin(
  { sessionId: assessmentSessionIdSchema.parse("assessment_render0001"), answers, selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" } },
  { now: () => "2026-09-17T09:00:00+08:00", id: (kind) => `${kind}_render${String(++sequence).padStart(4, "0")}` },
);
const result = buildDiagnosticResult(twin, { now: () => "2026-09-17T09:00:01+08:00", id: () => "diagnostic_render0001" });

describe("Stage 02 rendered contract", () => {
  it("renders canonical scores, all dimensions, explanations, evidence and honest next-stage copy", () => {
    const html = renderToStaticMarkup(<ResultsView result={result} twin={twin} onEdit={() => undefined} />);
    expect(html).toContain("37.5");
    expect(html).toContain("42.5");
    for (const label of ["Website and commerce", "Cloud and collaboration", "CRM and customer operations", "Marketing and measurement", "Cybersecurity and continuity", "AI adoption", "Leadership sponsorship", "Data availability and quality", "Employee skills", "Process consistency"]) expect(html).toContain(label);
    expect(html).toContain("Contributing evidence");
    expect(html).toContain("Missing evidence");
    expect(html).toContain("Website or online store");
    expect(html).toContain("Not used");
    expect(html).not.toContain("q2.websiteOrStore");
    expect(html).toContain("Customer follow-up lacks a shared system");
    expect(html).toContain("View recommendations");
    expect(html).not.toMatch(/Exabytes product|ROI|scenario lab|advisor panel|consultation|lead capture/i);
  });

  it("uses semantic expandable controls and score labels", () => {
    const html = renderToStaticMarkup(<ResultsView result={result} twin={twin} onEdit={() => undefined} />);
    expect(html.match(/<details/g)?.length).toBeGreaterThanOrEqual(7);
    expect(html).toContain('role="progressbar" aria-label="Website and commerce"');
    expect(html).toContain('aria-valuetext="100 out of 100"');
    expect(html).toContain("Edit Business Twin");
  });
});

describe("Stage 02 route integration contracts", () => {
  it("routes review confirmation to finite local analysis and analysis to results without network/model access", async () => {
    const root = process.cwd();
    const review = await readFile(path.join(root, "src/components/assessment/review-client.tsx"), "utf8");
    const analysis = await readFile(path.join(root, "src/components/diagnostics/analysis-client.tsx"), "utf8");
    expect(review).toContain('router.push("/assessment/analysis")');
    expect(analysis).toContain('router.replace("/results")');
    expect(analysis).not.toMatch(/fetch\(|ModelProvider|XMLHttpRequest|WebSocket/);
    expect(analysis).toContain("ANALYSIS_STEPS");
    expect(analysis).toContain("Try again");
  });

  it("contains stale invalidation, refresh restoration, mobile and reduced-motion safeguards", async () => {
    const root = process.cwd();
    const results = await readFile(path.join(root, "src/components/diagnostics/results-client.tsx"), "utf8");
    const persistence = await readFile(path.join(root, "src/infrastructure/persistence/local-diagnostic-store.ts"), "utf8");
    const styles = await readFile(path.join(root, "src/app/styles.css"), "utf8");
    expect(results).toContain("loadDiagnosticResult(localStorage, twin)");
    expect(results).toContain("clearDiagnosticResult(localStorage)");
    expect(persistence).toContain('reason: "stale"');
    expect(styles).toContain("@media (max-width: 620px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
