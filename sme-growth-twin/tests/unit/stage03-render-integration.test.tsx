import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildRecommendationResult } from "../../src/core/recommendations/build-recommendations";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import { RecommendationsView } from "../../src/components/recommendations/recommendations-client";
import { EXABYTES_CATALOGUE_1_0_0 } from "../../src/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_1_0_0 } from "../../src/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "../../src/domain-packs/exabytes/recommendation-rules";
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
  { sessionId: assessmentSessionIdSchema.parse("assessment_render03001"), answers, selectedFollowUpIds: ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], followUpAnswers: { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" } },
  { now: () => "2026-09-17T09:00:00+08:00", id: (kind) => `${kind}_render03${String(++sequence).padStart(4, "0")}` },
);
const diagnostic = buildDiagnosticResult(twin, { now: () => "2026-09-17T09:00:01+08:00", id: () => "diagnostic_render03001" });
const result = buildRecommendationResult(twin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => "2026-09-17T09:00:02+08:00", id: () => "recommendation_render03001" });

describe("Stage 03 rendered contract", () => {
  const html = renderToStaticMarkup(<RecommendationsView result={result} twin={twin} diagnostic={diagnostic} />);

  it("renders capability-first groups, exact diagnostics, components, prerequisites and evidence", () => {
    expect(html).toContain("Digital maturity");
    expect(html).toContain("37.5");
    expect(html).toContain("42.5");
    expect(html.indexOf("Shared customer operations")).toBeLessThan(html.indexOf("Freshsales CRM"));
    for (const label of ["Why now", "Next", "Why later", "Pain-point fit", "Prerequisite readiness", "Budget fit", "Time to value", "Risk fit", "Data readiness"]) expect(html).toContain(label);
    expect(html).toContain("CRM");
    expect(html).toContain("Messaging apps");
    expect(html).toContain("11-20 hours");
    expect(html).toContain("Affected employees");
    expect(html).toContain("Usable data readiness of at least 3");
    expect(html).toContain("Unlock:");
    expect(result.recommendations.flatMap((item) => item.evidenceIds).every((id) => twin.evidence.some((entry) => entry.id === id))).toBe(true);
  });

  it("renders only approved catalogue facts, safe official links, provenance, alternatives and limitations", () => {
    expect(html).toContain("Exabytes catalogue offering: Freshsales CRM");
    expect(html).toContain("Centralises customer information and interactions");
    expect(html).toContain("Verify current quote with Exabytes");
    expect(html).toContain("Catalogue entry active");
    expect(html).toContain("17 September 2026");
    expect(html).toContain("target=\"_blank\"");
    expect(html).toContain("rel=\"noopener noreferrer\"");
    expect(html).toContain("Consultant-validated alternatives");
    expect(html).toContain("This is not a purchase recommendation");
    expect(html).not.toMatch(/HubSpot|Zoho|Pipedrive|RM\s*\d|guaranteed savings|customer satisfaction score|38% of customer/i);
  });

  it("uses semantic disclosures and contains no later-stage controls or values", () => {
    expect(html.match(/<details/g)?.length).toBe(result.recommendations.length);
    expect(html).toContain("Compare transformation scenarios");
    expect(html).toContain('href="/scenarios"');
    expect(html).not.toMatch(/<form|<input|email address|phone number|generate blueprint|advisor review|submit consultation|projected ROI|estimated savings/i);
  });
});

describe("Stage 03 route, refresh and responsive contracts", () => {
  it("links results to recommendations and restores or recomputes a valid recommendation without network or model access", async () => {
    const root = process.cwd();
    const resultsSource = await readFile(path.join(root, "src/components/diagnostics/results-client.tsx"), "utf8");
    const recommendationsSource = await readFile(path.join(root, "src/components/recommendations/recommendations-client.tsx"), "utf8");
    expect(resultsSource).toContain('href="/recommendations"');
    expect(resultsSource).toContain("View recommendations");
    expect(recommendationsSource).toContain("loadRecommendationResult(localStorage, twin, diagnosticLoad.result)");
    expect(recommendationsSource).toContain("buildRecommendationResult(");
    expect(recommendationsSource).toContain("saveRecommendationResult(localStorage, result)");
    expect(recommendationsSource).not.toMatch(/fetch\(|ModelProvider|XMLHttpRequest|WebSocket/);
  });

  it("has actual 360px one-column, target-size, overflow and reduced-motion safeguards", async () => {
    const styles = await readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8");
    expect(styles).toContain("@media (max-width: 620px)");
    expect(styles).toContain(".recommendation-groups { grid-template-columns: 1fr; }");
    expect(styles).toContain("min-height: 44px");
    expect(styles).toContain("overflow-wrap: anywhere");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    const unrelatedPersistentRailsRemoved = styles
      .replace(".consultation-aside { position: sticky", ".consultation-aside { position: static")
      .replace(/\.diagnostic-rail\s*\{\s*position:\s*sticky/, ".diagnostic-rail { position: static");
    expect(unrelatedPersistentRailsRemoved).not.toMatch(/position:\s*(fixed|sticky)/);
  });
});
