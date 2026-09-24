import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BlueprintView } from "../../src/components/blueprint/blueprint-client";
import { ProductHeader } from "../../src/components/navigation/product-header";
import { stage05CaseA } from "./stage05-fixtures";

describe("Phase 4 UI and UX correction", () => {
  const full = stage05CaseA();
  const html = renderToStaticMarkup(
    <BlueprintView
      sources={{ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison: full.comparison }}
      initialBlueprint={full.blueprint}
    />,
  );

  it("keeps technical report identities available without putting them in the primary summary", () => {
    const technicalStart = html.indexOf('<details class="phase06-cover-technical">');
    const rawId = html.indexOf(full.blueprint.id);
    expect(html).toContain(`MP-${full.blueprint.id.slice(-8).toUpperCase()}`);
    expect(html).toContain("Technical report details");
    expect(technicalStart).toBeGreaterThan(0);
    expect(rawId).toBeGreaterThan(technicalStart);
    expect(html).toContain("Inspect record IDs and model versions");
    expect(html).toContain("evidence references</summary>");
  });

  it("renders a compact, active workspace navigation without duplicate primary actions", () => {
    const header = renderToStaticMarkup(<ProductHeader current="evidence" />);
    expect(header).toContain('aria-label="Workspace navigation"');
    expect(header).toContain('aria-current="page" href="/evidence"');
    expect(header.match(/aria-current="page"/g)).toHaveLength(1);
    for (const label of ["Blueprint", "Evidence", "Copilot", "Consultation"]) expect(header).toContain(label);
  });

  it("provides current-section tracking, keyboard bypass, reduced-motion handling, and accessible destructive confirmation", async () => {
    const [contents, layout, evidence, copilot, css] = await Promise.all([
      readFile(path.join(process.cwd(), "src/components/blueprint/blueprint-contents-navigation.tsx"), "utf8"),
      readFile(path.join(process.cwd(), "src/app/layout.tsx"), "utf8"),
      readFile(path.join(process.cwd(), "src/components/evidence/evidence-library-client.tsx"), "utf8"),
      readFile(path.join(process.cwd(), "src/components/copilot/copilot-client.tsx"), "utf8"),
      readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8"),
    ]);
    expect(contents).toContain("IntersectionObserver");
    expect(contents).toContain('aria-current={active === anchor ? "location" : undefined}');
    expect(layout).toContain('className="skip-link"');
    expect(evidence).toContain("showModal()");
    expect(evidence).not.toContain("window.confirm");
    expect(copilot).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
    expect(css).toContain('.product-header nav a[aria-current="page"]');
    expect(css).toContain("grid-template-columns: 1fr 1fr");
  });
});
