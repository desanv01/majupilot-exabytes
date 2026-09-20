import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import HomePage from "../../src/app/page";

describe("Stage 01 home page", () => {
  it("renders the assessment start without fabricated results", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("MajuPilot");
    expect(html).not.toContain("SME Growth Twin");
    expect(html).toContain("Start assessment");
    expect(html).not.toMatch(/maturity score|recommended product|scenario result/i);
  });

  it("renders the corrected Phase 01 hierarchy from real fixture facts", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("Know your business.");
    expect(html).toContain('data-fixture-preview="case-a"');
    expect(html).toContain("Kopi Kita Café Group");
    expect(html).toContain("WhatsApp orders and catering enquiries");
    expect(html).toContain("Fictional Case A");
    expect(html).toContain("Business Twin preview");
    expect(html).toContain("Current digital foundation");
    expect(html).toContain("AI and change readiness");
    expect(html).toContain("AI may interpret and review a plan");
    expect(html).not.toMatch(/[—–]/);

    const topicsIndex = html.indexOf('id="assessment-topics"');
    const demosIndex = html.indexOf('id="demo-cases"');
    expect(topicsIndex).toBeGreaterThan(-1);
    expect(demosIndex).toBeGreaterThan(topicsIndex);
  });

  it("keeps all protected home actions and their browser hooks", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('href="/assessment?new=1"');
    expect(html).toContain('data-fixture-id="case-a"');
    expect(html).toContain('data-fixture-id="case-b"');
    expect(html).toContain('data-fixture-id="case-c"');
    expect(html).toContain("Reset demo data");
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain("Resume assessment");
  });
});
