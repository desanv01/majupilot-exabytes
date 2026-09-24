import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildRecommendationResult } from "../../src/core/recommendations/build-recommendations";
import { RecommendationsView } from "../../src/components/recommendations/recommendations-client";
import { EXABYTES_CATALOGUE_1_0_0 } from "../../src/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_1_0_0 } from "../../src/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "../../src/domain-packs/exabytes/recommendation-rules";
import { caseA, caseAFull, caseBFull, caseCFull, fullCase, now } from "./stage04-fixtures";

describe("Phase 04 recommendation decision workspace", () => {
  it("renders the shared shell, dominant first move, one ordered ledger and complete disclosure records", () => {
    const full = caseAFull();
    const html = renderToStaticMarkup(<RecommendationsView result={full.recommendation} twin={full.twin} diagnostic={full.diagnostic} />);
    const firstTitle = html.indexOf("Shared customer operations");
    const firstOffering = html.indexOf("Freshsales CRM");

    expect(html).toContain("Post-assessment journey");
    expect(html).toContain("Diagnose - 2 of 5");
    expect(html).toContain("Lead with the highest-ranked decision");
    expect(html).toContain("Ordered capability ledger");
    expect(html.match(/<ol/g)?.length).toBeGreaterThanOrEqual(2);
    expect(html.match(/<details/g)?.length).toBe(full.recommendation.recommendations.length * 3);
    expect(html).toContain("Inspect fit calculation and delivery profile");
    expect(html).toContain("Inspect catalogue mapping and source");
    expect(firstTitle).toBeGreaterThan(-1);
    expect(firstTitle).toBeLessThan(firstOffering);
    expect(html).toContain("fit = pain_point_fit * 0.30");
    for (const label of ["Pain-point fit", "Prerequisite readiness", "Budget fit", "Time to value", "Risk fit", "Data readiness"]) expect(html).toContain(label);
    expect(html).toContain("Roadmap phase");
    expect(html).toContain("Effort tier");
    expect(html).toContain("Relative cost tier");
    expect(html).toContain("Time-to-value tier");
    expect(html).toContain("Recorded facts used");
    expect(html).not.toMatch(/[—–]/);
  });

  it("renders catalogue mapping as safe, allow-listed provenance rather than a sales card", () => {
    const full = caseAFull();
    const html = renderToStaticMarkup(<RecommendationsView result={full.recommendation} twin={full.twin} diagnostic={full.diagnostic} />);

    expect(html).toContain("Freshworks via Exabytes: Freshsales CRM");
    expect(html).toContain("Active means this entry passed the current catalogue review");
    expect(html).toContain("It is not a certification or endorsement");
    expect(html).toContain("Offering ID");
    expect(html).toContain("Selection rule");
    expect(html).toContain("Verify current quote with Exabytes");
    expect(html).toContain("target=\"_blank\"");
    expect(html).toContain("rel=\"noopener noreferrer\"");
    expect(html).toContain("No active alternative is named by Catalogue 1.0.0");
    expect(html).not.toMatch(/HubSpot|Zoho|Pipedrive|RM\s*\d|guaranteed savings/i);
  });

  it("keeps capability guidance visible when catalogue mapping fails closed", () => {
    const full = caseAFull();
    const recommendations = full.recommendation.recommendations.map((item, index) => index === 0 ? { ...item, mappedOffering: undefined, alternativeOfferingIds: [] } : item);
    const result = { ...full.recommendation, recommendations };
    const html = renderToStaticMarkup(<RecommendationsView result={result} twin={full.twin} diagnostic={full.diagnostic} />);

    expect(html).toContain("Shared customer operations");
    expect(html).toContain("Capability guidance remains available");
    expect(html).toContain("no current catalogue offering passed the mapping rules");
  });

  it("shows unknown prerequisites, fail-closed explanations and unlock actions", () => {
    const unknownAnswers = {
      ...caseA,
      q5: { leadershipSponsorship: null, usableData: null, employeeDigitalSkills: null, processConsistency: null, changeWillingness: null },
    };
    const full = fullCase(unknownAnswers, { fu_manual_hours: "11_20", fu_customer_records: "messaging_apps", fu_backup_frequency: "none" }, ["fu_manual_hours", "fu_customer_records", "fu_backup_frequency"], "unknown");
    const html = renderToStaticMarkup(<RecommendationsView result={full.recommendation} twin={full.twin} diagnostic={full.diagnostic} />);

    expect(html).toContain("Unknown");
    expect(html).toContain("fails closed");
    expect(html).toContain("Unlock:");
    expect(html).toContain("Why later");
  });

  it("omits empty timing claims and renders an honest empty recommendation state", () => {
    const full = caseCFull();
    const selectiveHtml = renderToStaticMarkup(<RecommendationsView result={full.recommendation} twin={full.twin} diagnostic={full.diagnostic} />);
    const emptyHtml = renderToStaticMarkup(<RecommendationsView result={{ ...full.recommendation, recommendations: [] }} twin={full.twin} diagnostic={full.diagnostic} />);

    expect(full.recommendation.recommendations.every((item) => item.status === "why_now")).toBe(true);
    expect(selectiveHtml).not.toContain("Keep visible until readiness improves");
    expect(emptyHtml).toContain("More diagnostic evidence is needed");
    expect(emptyHtml).not.toContain("Compare transformation scenarios</h2>");
  });

  it("preserves Case A, B and C sequence regressions and deterministic result identity", () => {
    const cases = [caseAFull(), caseBFull(), caseCFull()];
    expect(cases.map((full) => full.recommendation.recommendations.map((item) => `${item.capabilityId}:${item.status}:${item.fitScore.toFixed(1)}`))).toMatchInlineSnapshot(`
      [
        [
          "shared_customer_operations:why_now:93.5",
          "professional_team_collaboration:why_now:92.9",
          "protected_business_continuity:why_now:92.9",
          "protected_web_presence:next:92.9",
          "governed_ai_automation:why_later:54.2",
        ],
        [
          "professional_team_collaboration:why_now:100.0",
          "measurable_digital_growth:why_now:86.9",
          "shared_customer_operations:why_now:85.9",
          "protected_business_continuity:next:82.0",
          "governed_ai_automation:why_later:54.3",
        ],
        [
          "shared_customer_operations:why_now:84.8",
          "governed_ai_automation:why_now:83.4",
          "scalable_cloud_operations:why_now:76.2",
        ],
      ]
    `);

    const full = caseAFull();
    const rebuilt = buildRecommendationResult(full.twin, full.diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => now, id: () => full.recommendation.id });
    expect(rebuilt).toEqual(full.recommendation);
  });
});
