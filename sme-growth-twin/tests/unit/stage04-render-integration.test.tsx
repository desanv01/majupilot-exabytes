import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScenariosView } from "../../src/components/scenarios/scenarios-client";
import { caseAFull } from "./stage04-fixtures";

describe("Stage 04 rendered and route contract", () => {
  const full = caseAFull();
  const html = renderToStaticMarkup(<ScenariosView initialResult={full.comparison} twin={full.twin} diagnostic={full.diagnostic} recommendations={full.recommendation} />);

  it("renders three comparable paths, exact default values and distinct conditional AI", () => {
    for (const label of ["Lean Foundation", "Balanced Growth", "Accelerated AI", "RM 5,640 / RM 11,280 / RM 16,920", "RM 9,200 / RM 18,400 / RM 27,600", "RM 10,320 / RM 20,640 / RM 30,960", "Revenue", "Avoided risk", "Not estimated", "Conditional · excluded from committed ROI", "RM 7,200 / RM 14,400 / RM 21,600", "Planning assumptions — not an Exabytes quote"] ) expect(html).toContain(label);
    expect(html).not.toContain("Recommended"); expect(html).not.toContain("12 min left");
  });

  it("renders all assumption groups, sources, formulas, exclusions and honest next stage", () => {
    for (const label of ["Costs", "Operational value", "Revenue value", "Avoided risk", "Sensitivity trace", "Derived User Fact", "Planning Default", "Reset all assumptions to Model 1.0.0", "Confidence", "Exclusions", "weekly hours saved × 52 × loaded hourly cost", "Advisor review and Blueprint", "Select a preferred path before generating a Blueprint"] ) expect(html).toContain(label);
    for (const accessibleName of ["Implementation Low", "Implementation Base", "Implementation High", "Manual hours per week Low", "Loaded hourly cost Base", "Adoption High"]) expect(html).toContain(`aria-label="${accessibleName}"`);
    expect(html).not.toMatch(/submit consultation|guaranteed|vendor quote|model request/i);
  });

  it("connects recommendations, restores versioned scenarios, and contains no network/model path", async () => {
    const root = process.cwd(); const recommendations = await readFile(path.join(root, "src/components/recommendations/recommendations-client.tsx"), "utf8"); const scenarios = await readFile(path.join(root, "src/components/scenarios/scenarios-client.tsx"), "utf8");
    expect(recommendations).toContain('href="/scenarios"'); expect(recommendations).toContain("Compare transformation scenarios");
    expect(scenarios).toContain("loadScenarioComparison(localStorage"); expect(scenarios).toContain("saveScenarioComparison(localStorage"); expect(scenarios).toContain("recalculateScenarioComparison("); expect(scenarios).not.toMatch(/fetch\(|ModelProvider|XMLHttpRequest|WebSocket/);
  });

  it("has actual 360px stacking, target-size, reduced-motion and overflow safeguards", async () => {
    const styles = await readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8");
    expect(styles).toContain("@media (max-width: 620px)"); expect(styles).toContain(".scenario-grid { grid-template-columns: 1fr; }"); expect(styles).toContain(".timeline { display: grid; grid-template-columns: 1fr; overflow: visible; }"); expect(styles).toContain("min-height: 44px"); expect(styles).toContain("overflow-wrap: anywhere"); expect(styles).toContain("@media (prefers-reduced-motion: reduce)"); expect(styles.replace(".consultation-aside { position: sticky", ".consultation-aside { position: static")).not.toMatch(/position:\s*(fixed|sticky)/);
  });
});
