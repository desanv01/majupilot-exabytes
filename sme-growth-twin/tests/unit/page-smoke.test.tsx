import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage from "../../src/app/page";

describe("Stage 01 home page", () => {
  it("renders the assessment start without fabricated results", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("SME Growth Twin");
    expect(html).toContain("Start assessment");
    expect(html).not.toMatch(/maturity score|recommended product|scenario result/i);
  });
});
