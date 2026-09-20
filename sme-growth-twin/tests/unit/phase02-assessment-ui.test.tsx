import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AssessmentFrame } from "../../src/components/assessment/assessment-frame";
import { Progress } from "../../src/components/assessment/progress";

describe("Phase 02 assessment UI contract", () => {
  it("renders a real-brand evidence context rail and a mobile save state", () => {
    const html = renderToStaticMarkup(
      <AssessmentFrame
        currentTopic="Digital foundation"
        saveState="unavailable"
        step={2}
      >
        <main>Question content</main>
      </AssessmentFrame>,
    );

    expect(html).toContain("MajuPilot");
    expect(html).not.toContain("SME Growth Twin");
    expect(html).toContain("Build your Business Twin");
    expect(html).toContain("Device storage unavailable");
    expect(html).toContain("Not saving");
    expect(html).not.toMatch(/botanical|generated illustration|decorative logo/i);
  });

  it("exposes current, complete, and upcoming progress without color alone", () => {
    const html = renderToStaticMarkup(
      <Progress currentTopic="Business friction" step={3} />,
    );

    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Complete");
    expect(html).toContain("Current step");
    expect(html).toContain("Upcoming");
    expect(html).toContain("Step 3 of 5");
  });

  it("keeps the Phase 02 surface responsive, reduced-motion aware, and non-pill", async () => {
    const css = await readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8");

    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".assessment-rail { display: none; }");
    expect(css).toContain(".assessment-page .button { min-height: 48px; border-radius: 10px;");
    expect(css).toContain(".assessment-page .segmented span,");
    expect(css).toContain("border-radius: 8px");
  });
});
