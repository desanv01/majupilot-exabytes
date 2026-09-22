import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScenariosView } from "../../src/components/scenarios/scenarios-client";
import { caseAFull } from "./stage04-fixtures";

describe("Phase 05 Scenario and ROI Lab UI contract", () => {
  const full = caseAFull();
  const html = renderToStaticMarkup(<ScenariosView initialResult={full.comparison} twin={full.twin} diagnostic={full.diagnostic} recommendations={full.recommendation} />);

  it("starts with Balanced inspection focus and no implied preferred selection", () => {
    expect(html).toContain("Compare - 3 of 4");
    expect(html).toContain("Balanced Growth starts in inspection focus");
    expect(html).toMatch(/balanced_growth is-focused/);
    expect(html).toContain("None selected");
    expect(html).toContain("Select a preferred path first");
    expect(html).not.toContain("Preferred path</strong>");
    expect(html).not.toContain('href="/blueprint"');
  });

  it("renders the frozen Case A comparison and honest economics", () => {
    for (const value of [
      "RM 5,640", "RM 11,280", "RM 16,920",
      "RM 9,200", "RM 18,400", "RM 27,600",
      "RM 10,320", "RM 20,640", "RM 30,960",
      "RM 1,088", "RM 3,778", "RM 8,392",
      "-RM 15,832", "-RM 7,502", "RM 2,752",
      "RM 7,200", "RM 14,400", "RM 21,600",
    ]) expect(html).toContain(value);
    expect(html).toContain("Planning assumptions, not an Exabytes quote");
    expect(html).toContain("More than 60 months");
    expect(html).not.toContain("140.5 months");
    expect(html).toContain("Conditional scope, outside committed economics");
    expect(html).toContain("Governed AI automation");
    expect(html.match(/Not estimated/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("renders months 1 through 12 once and exposes evidence in native disclosures", () => {
    for (let month = 1; month <= 12; month += 1) expect(html.match(new RegExp(`data-month="${month}"`, "g"))).toHaveLength(1);
    expect(html).toContain("Inspect formulas and exclusions");
    expect(html).toContain("weekly hours saved × 52 × loaded hourly cost");
    expect(html).toContain("Dependencies and readiness");
    expect(html).toContain("Sensitivity trace");
    expect(html).toContain("source-derived_user_fact");
    expect(html).toContain("source-planning_default");
    expect(html).not.toMatch(/[—–]/);
  });

  it("keeps inputs, reset, mobile timeline, print, and reduced motion within the UI boundary", async () => {
    const root = process.cwd();
    const styles = await readFile(path.join(root, "src/app/styles.css"), "utf8");
    const source = await readFile(path.join(root, "src/components/scenarios/scenarios-client.tsx"), "utf8");
    for (const name of ["Implementation Low", "Training Base", "Annual recurring High", "Manual hours per week Low", "Adoption High"]) expect(html).toContain(`aria-label="${name}"`);
    expect(html).toContain("Reset focused path assumptions");
    expect(styles).toContain(".scenario-timeline { grid-template-columns: 1fr; border: 0; }");
    expect(styles).toContain("@media print");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("min-height: 48px");
    expect(source).toContain("loadScenarioComparison(localStorage");
    expect(source).toContain("recalculateScenarioComparison(");
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|ModelProvider/);
  });

  it("keeps one authoritative Phase 05 scenario style system", async () => {
    const styles = await readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8");
    for (const legacySelector of [
      ".scenarios-shell {", ".scenarios-hero {", ".comparison-intro {", ".scenario-grid {",
      ".scenario-card {", ".scenario-metrics {", ".scenario-detail {", ".timeline {",
      ".assumptions-panel {", ".assumption-groups {", ".assumption-group {", ".stage-five-handoff {",
    ]) expect(styles).not.toContain(legacySelector);
    expect(styles.match(/\/\* Phase 05: scenario comparison and ROI decision laboratory \*\//g)).toHaveLength(1);
    expect(styles.match(/^\.assumption-row \{/gm)).toHaveLength(1);
    expect(styles.match(/^\.range-inputs \{/gm)).toHaveLength(1);
  });
});
