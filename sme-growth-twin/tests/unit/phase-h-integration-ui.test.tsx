import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={String(href)} {...props}>{children}</a> }));

import CopilotPage from "@/app/copilot/page";

describe("MajuPilot application integration", () => {
  it("exposes Copilot as a first-class product surface without internal phase copy", () => {
    const html = renderToStaticMarkup(<CopilotPage />);
    expect(html).toContain("MajuPilot Transformation Copilot");
    expect(html).toContain("Turn your evidence into a confident next move.");
    expect(html).toContain("Blueprint");
    expect(html).toContain("Consultation");
    expect(html).not.toContain("Phase H");
    expect(html).not.toContain("Document RAG");
  });
});
