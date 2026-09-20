import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a> }));

import V2CapabilitiesPage from "@/app/v2/page";

describe("Phase H minimal application integration", () => {
  it("exposes the completed capability boundary without claiming Phase I", () => {
    const html = renderToStaticMarkup(<V2CapabilitiesPage />);
    expect(html).toContain("Assessment and Business Twin");
    expect(html).toContain("Canonical Blueprint report");
    expect(html).toContain("Durable consultation lead");
    expect(html).toContain("Transformation Copilot");
    expect(html).toContain("Document RAG");
    expect(html).toContain("not Phase I release or deployment proof");
  });
});
