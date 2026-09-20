import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BlueprintView } from "../../src/components/blueprint/blueprint-client";
import { buildBlueprint } from "../../src/core/blueprint/build-blueprint";
import { BLUEPRINT_SECTION_IDS } from "../../src/domain/blueprint";
import { FROZEN_ADVISOR_ORDER } from "../../src/domain/advisors";
import { stage05CaseA } from "./stage05-fixtures";

const full = stage05CaseA();
const sources = {
  twin: full.twin,
  diagnostic: full.diagnostic,
  recommendations: full.recommendation,
  comparison: full.comparison,
};

describe("UI Upgrade Phase 06 Blueprint contract", () => {
  const html = renderToStaticMarkup(<BlueprintView sources={sources} initialBlueprint={full.blueprint} />);

  it("uses the shared frame with Blueprint current and a finite five-role status board", () => {
    expect(html).toContain("Post-assessment journey");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Blueprint - 4 of 4");
    expect(html.match(/advisor-status-item status-fallback/g)).toHaveLength(5);
    for (const role of ["Growth advisor", "Operations advisor", "Finance advisor", "Cybersecurity advisor", "Change advisor"]) {
      expect(html).toContain(role);
    }
  });

  it("orients the executive before the report with labelled ranges and complete synthesis counts", () => {
    for (const text of [
      "Executive decision overview",
      "Balanced Growth: Proceed With Conditions",
      "Digital maturity",
      "AI readiness",
      "Advisor origins",
      "Agreement",
      "Disagreement",
      "Conditions",
      "Open questions",
      "Low",
      "Base",
      "High",
      "Best",
      "Worst",
      "Negative net values reflect",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("RM 9,200 / RM 18,400 / RM 27,600");
  });

  it("keeps every report section and advisor detail accessible through native disclosures", () => {
    for (const sectionId of BLUEPRINT_SECTION_IDS) expect(html).toContain(`id="${sectionId}"`);
    expect(html).toContain("Browse all 16 report sections");
    expect(html.match(/class="phase06-advisor-card /g)).toHaveLength(5);
    expect(html).toContain("material items across support, concerns, evidence gaps, and adjustments");
    for (const label of ["Support", "Concerns", "Missing evidence", "Advisory adjustments", "Evidence references"]) {
      expect(html).toContain(label);
    }
  });

  it("preserves all synthesis perspectives, explicit empty disagreement, provenance, formulas, exclusions, limitations, and model calls", () => {
    for (const label of [
      "No material disagreement detected",
      "Contributors:",
      "Inspect formulas and exclusions",
      "Inspect claim provenance",
      "Inspect model-call disclosure",
      "Inspect limitations",
      "Scenario assumptions",
    ]) {
      expect(html).toContain(label);
    }
  });

  it("discloses a mixed five-role origin set in frozen order without changing upstream values", () => {
    const panel = structuredClone(full.panel);
    const growth = panel.reviews[0];
    panel.reviews[0] = {
      ...growth,
      origin: "model",
      sourceRef: "advisor-prompt-1.0.0",
      support: growth.support.map((item) => ({ ...item, claimSource: "model_interpretation" })),
      concerns: growth.concerns.map((item) => ({ ...item, claimSource: "model_interpretation" })),
      missingEvidence: growth.missingEvidence.map((item) => ({ ...item, claimSource: "model_interpretation" })),
      adjustments: growth.adjustments.map((item) => ({ ...item, claimSource: "model_interpretation" })),
    };
    panel.modelCalls[0] = {
      ...panel.modelCalls[0],
      provider: "vercel_ai_gateway",
      model: "configured-at-runtime",
      status: "success",
      errorCategory: "none",
    };
    const blueprint = buildBlueprint(
      { ...sources, panel },
      { id: () => "blueprint_phase0600001", now: () => full.blueprint.generatedAt },
    );
    const mixedHtml = renderToStaticMarkup(<BlueprintView sources={sources} initialBlueprint={blueprint} />);
    expect(blueprint.advisorReviews.map((review) => review.advisor)).toEqual([...FROZEN_ADVISOR_ORDER]);
    expect(mixedHtml).toContain("1 live, 4 fallback");
    expect(mixedHtml).toContain("RM 18,400");
    expect(mixedHtml).toContain("30.4 months");
  });

  it("has honest consultation copy and no visible en dash or em dash", () => {
    expect(html).toContain("creates a durable consultation handoff");
    expect(html).toContain("It does not send email, create a CRM record, promise a human response, or provide vendor fulfilment.");
    const visibleText = html.replace(/<[^>]+>/g, " ");
    expect(visibleText).not.toMatch(/[–—]/);
  });
});
