import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BlueprintView } from "../../src/components/blueprint/blueprint-client";
import { buildBlueprint } from "../../src/core/blueprint/build-blueprint";
import { stage05CaseA } from "./stage05-fixtures";

describe("Stage 05 rendered, responsive, and print contract", () => {
  const full = stage05CaseA();
  const html = renderToStaticMarkup(<BlueprintView sources={{ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison }} initialBlueprint={full.blueprint} />);

  it("renders the handoff, five distinct reviews, origin, confidence, evidence and adjustment", () => {
    for (const label of ["Back to scenarios", "Regenerate review", "Print / save as PDF", "Growth advisor", "Operations advisor", "Finance advisor", "Cybersecurity advisor", "Change advisor", "Deterministic fallback", "Confidence", "Evidence references", "Advisory adjustments"]) expect(html).toContain(label);
    expect(html.match(/class="advisor-card /g)).toHaveLength(5); expect(html).toContain("No material disagreement detected");
  });

  it("renders all required sections, exact Case A values, provenance, limitations and preview-only consultation", () => {
    for (const label of ["Executive summary", "Business profile", "Digital maturity and AI readiness", "Top five pain points", "Recommended capabilities and mapped offerings", "Three-scenario comparison", "Selected transformation plan", "ROI assumptions, ranges, formulas, and exclusions", "Month-by-month roadmap", "Risks, warnings, and prerequisites", "Five advisor reviews", "Consultant notes", "Claim provenance", "Model-call disclosure", "Consultation preview", "RM 9,200 / RM 18,400 / RM 27,600", "30.4 months", "Not Estimated", "Stage 06"]) expect(html).toContain(label);
    expect(html).not.toMatch(/name=["'](?:email|phone|contact)|consent checkbox|submit consultation|send to exabytes/i);
  });

  it("has 360px stacking, wrapping, 44px controls, reduced motion and print expansion/hiding", async () => {
    const styles = await readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8");
    expect(styles).toContain("@media (max-width: 620px)"); expect(styles).toContain(".report-cover dl, .report-grid, .versions, .score-pair, .report-scenarios, .roi-highlight, .blueprint-timeline, .synthesis-grid { grid-template-columns: 1fr; }"); expect(styles).toContain("overflow-wrap: anywhere"); expect(styles).toContain("min-height: 44px"); expect(styles).toContain("@media (prefers-reduced-motion: reduce)"); expect(styles).toContain("@media print"); expect(styles).toContain(".no-print, .topbar, .journey-rail, .advisor-progress, .blueprint-hero, .contents-rail { display: none !important; }"); expect(styles).toContain("details > * { display: block !important; }");
  });

  it("keeps live model access server-only and uses current structured-output API", async () => {
    const adapter = await readFile(path.join(process.cwd(), "src/infrastructure/model-provider/advisor-model-review.ts"), "utf8"); const route = await readFile(path.join(process.cwd(), "src/app/api/advisors/review/route.ts"), "utf8");
    expect(adapter).toContain('import "server-only"'); expect(adapter).toContain("generateText"); expect(adapter).toContain("Output.object"); expect(adapter).not.toContain("generateObject"); expect(adapter).toContain("process.env.AI_GATEWAY_MODEL"); expect(adapter).not.toMatch(/model:\s*["'][^"']+\//); expect(route).not.toMatch(/process\.env|AI_GATEWAY_API_KEY/);
  });

  it("discloses mixed live and fallback origins without changing the report", () => {
    const panel = structuredClone(full.panel); const review = panel.reviews[0];
    panel.reviews[0] = { ...review, origin: "model", sourceRef: "advisor-prompt-1.0.0", support: review.support.map((item) => ({ ...item, claimSource: "model_interpretation" })), concerns: review.concerns.map((item) => ({ ...item, claimSource: "model_interpretation" })), missingEvidence: review.missingEvidence.map((item) => ({ ...item, claimSource: "model_interpretation" })), adjustments: review.adjustments.map((item) => ({ ...item, claimSource: "model_interpretation" })) };
    panel.modelCalls[0] = { ...panel.modelCalls[0], provider: "vercel_ai_gateway", model: "configured-at-runtime", status: "success", errorCategory: "none" };
    const mixed = buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison, panel }, { id: () => "blueprint_stage0500011", now: () => full.blueprint.generatedAt });
    const mixedHtml = renderToStaticMarkup(<BlueprintView sources={{ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison }} initialBlueprint={mixed} />);
    expect(mixedHtml).toContain("Live model review"); expect(mixedHtml).toContain("Deterministic fallback"); expect(mixedHtml).toContain("1 live model review(s) and 4 deterministic fallback review(s)");
  });

  it("renders all distinct same-topic synthesis statements with attribution", () => {
    const panel = structuredClone(full.panel);
    panel.reviews[0].support[0] = { ...panel.reviews[0].support[0], topic: "shared_tradeoff", statement: "Growth supports a measured pilot." };
    panel.reviews[1].support[0] = { ...panel.reviews[1].support[0], topic: "shared_tradeoff", statement: "Operations supports a staged rollout." };
    panel.reviews[2].concerns[0] = { ...panel.reviews[2].concerns[0], topic: "shared_tradeoff", statement: "Finance requires a cash-flow gate." };
    const blueprint = buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison, panel }, { id: () => "blueprint_stage0500012", now: () => full.blueprint.generatedAt });
    const rendered = renderToStaticMarkup(<BlueprintView sources={{ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison }} initialBlueprint={blueprint} />);
    for (const phrase of ["Growth supports a measured pilot.", "Operations supports a staged rollout.", "Finance requires a cash-flow gate.", "Growth", "Operations", "Finance"]) expect(rendered).toContain(phrase);
  });
});
