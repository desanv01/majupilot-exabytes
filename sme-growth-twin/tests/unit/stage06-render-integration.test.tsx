import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

import { ConsultationView } from "../../src/components/consultation/consultation-client";
import { LEAD_RECEIPT_SESSION_KEY, loadLeadReceipt, saveLeadReceipt } from "../../src/infrastructure/persistence/session-lead-receipt-store";
import { memoryStorage } from "./stage04-fixtures";
import { stage05CaseA } from "./stage05-fixtures";

describe("Stage 06 consultation render and browser persistence", () => {
  const blueprint = stage05CaseA().blueprint;
  it("renders the verified handoff, complete disclosure, persistent labels and unchecked consent", () => {
    const html = renderToStaticMarkup(<ConsultationView blueprint={blueprint} />);
    for (const text of ["Request an evidence-ready consultation.", "Kopi Kita Café Group", blueprint.id, "Balanced Growth", "37.5 /100", "42.5 /100", "Contact name", "Business name", "Email address", "Phone number", "Consultation urgency", "What will be shared", "Contact details are not sent to the model", "Explicit choice", "process-local"]) expect(html).toContain(text);
    expect(html).toContain('type="checkbox"'); expect(html).not.toContain('type="checkbox" checked'); expect(html).toContain('autoComplete="name"'); expect(html).toContain('autoComplete="organization"'); expect(html).toContain('autoComplete="email"'); expect(html).toContain('autoComplete="tel"');
    for (const limit of [100, 140, 254, 32]) expect(html).toContain(`maxLength="${limit}"`);
  });

  it("renders a safe responsive success receipt without contact details or delivery claims", () => {
    const receipt = { leadReference: "lead_stage060000000000000001", submittedAt: "2026-09-18T14:30:00+08:00", blueprintId: blueprint.id, status: "new" as const, replayed: false };
    const html = renderToStaticMarkup(<ConsultationView blueprint={blueprint} initialReceipt={receipt} />);
    for (const text of ["request has been recorded", receipt.leadReference, receipt.blueprintId, "Return to Blueprint", "Start a new assessment", "No email, CRM delivery, or human review is claimed"]) expect(html).toContain(text);
    expect(html).not.toMatch(/private@example|\+60 12/);
  });

  it("persists only the schema-validated safe receipt in session storage", () => {
    const { storage, data } = memoryStorage(); const receipt = { leadReference: "lead_stage060000000000000001", submittedAt: "2026-09-18T14:30:00+08:00", blueprintId: blueprint.id, status: "new" as const, replayed: false };
    saveLeadReceipt(storage, receipt); expect(loadLeadReceipt(storage)).toEqual(receipt); expect([...data.keys()]).toEqual([LEAD_RECEIPT_SESSION_KEY]);
    const raw = data.get(LEAD_RECEIPT_SESSION_KEY) ?? ""; for (const forbidden of ["email", "phone", "contact", "advisorReviews", "snapshot", "Kopi Kita"]) expect(raw).not.toContain(forbidden);
  });

  it("defines the accepted two-column desktop and one-column 360px composition with usable controls", async () => {
    const css = await readFile(path.join(process.cwd(), "src/app/styles.css"), "utf8");
    expect(css).toContain(".consultation-grid { display: grid; grid-template-columns:"); expect(css).toContain(".consultation-aside { position: sticky"); expect(css).toContain("@media (max-width: 620px)"); expect(css).toContain(".consultation-grid { grid-template-columns: 1fr;"); expect(css).toContain("min-height: 48px"); expect(css).toContain("min-height: 44px"); expect(css).toContain("overflow-wrap: anywhere");
  });

  it("keeps browser screenshots temporary by default with an explicit artifact override", async () => {
    const harness = await readFile(path.join(process.cwd(), "scripts/stage06-browser-check.mjs"), "utf8");
    expect(harness).toContain("process.env.STAGE06_ARTIFACT_DIR");
    expect(harness).toContain('mkdtemp(path.join(tmpdir(), "sme-growth-twin-stage06-artifacts-"))');
    expect(harness).toContain('mkdtemp(path.join(tmpdir(), "sme-growth-twin-stage06-profile-"))');
    expect(harness).toContain("if (!configuredArtifactDir && artifacts) await rm(artifacts, { recursive: true, force: true })");
    expect(harness).toContain("if (profile) await rm(profile, { recursive: true, force: true })");
    expect(harness).not.toContain('path.resolve("artifacts")');
  });
});
