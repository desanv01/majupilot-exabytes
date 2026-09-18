import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST } from "../../src/app/api/leads/route";
import { EXABYTES_CONSULTATION_POLICY } from "../../src/domain-packs/exabytes/consultation-rules";
import { processLocalLeadStore } from "../../src/infrastructure/leads/process-local-lead-store";
import { leadRateLimiter } from "../../src/infrastructure/leads/rate-limit";
import { stage05CaseA } from "./stage05-fixtures";

function payload(index = 1) { return { submissionId: `fd492b2c-190a-49b8-b93b-${String(index).padStart(12, "0")}`, contact: { name: "Aiman Rahman", businessName: "Kopi Kita Café Group", email: "private@example.test", phone: "+60 12 345 6789", urgency: "within_30_days" }, consent: { accepted: true, wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, honeypot: "", blueprint: stage05CaseA().blueprint }; }
function apiRequest(body: unknown, headers: Record<string, string> = {}) { return new Request("http://localhost/api/leads", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.50", ...headers }, body: JSON.stringify(body) }); }

describe("Stage 06 lead API", () => {
  beforeEach(() => { processLocalLeadStore.resetForTests(); leadRateLimiter.resetForTests(); });

  it("creates once, returns only a safe receipt, and replays identically", async () => {
    const input = payload(); const first = await POST(apiRequest(input)); const firstText = await first.text(); const receipt = JSON.parse(firstText);
    expect(first.status).toBe(201); expect(first.headers.get("cache-control")).toBe("no-store"); expect(receipt.replayed).toBe(false); expect(receipt.blueprintId).toBe(input.blueprint.id);
    for (const sensitive of [input.contact.name, input.contact.email, input.contact.phone, input.blueprint.snapshot.twin.evidence[0].rawAnswer, input.blueprint.advisorReviews[0].headline]) if (typeof sensitive === "string") expect(firstText).not.toContain(sensitive);
    const second = await POST(apiRequest(input)); const replay = await second.json(); expect(second.status).toBe(200); expect(replay).toEqual({ ...receipt, replayed: true }); expect(processLocalLeadStore.countForTests()).toBe(1);
    const stored = processLocalLeadStore.getForTests(input.submissionId); expect(stored?.blueprint).toEqual(input.blueprint); expect(stored?.summary.scores.digitalMaturity.value).toBe(37.5);
  });

  it("rejects changed payload reuse, false consent, honeypots, unknown fields, content type, malformed and oversized JSON with safe errors", async () => {
    const input = payload(); expect((await POST(apiRequest(input))).status).toBe(201);
    expect((await POST(apiRequest({ ...input, contact: { ...input.contact, businessName: "Changed business" } }))).status).toBe(400);
    for (const consent of [{ accepted: false, wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, { wordingVersion: EXABYTES_CONSULTATION_POLICY.consentWordingVersion }, { accepted: true, wordingVersion: "old" }]) { processLocalLeadStore.resetForTests(); const response = await POST(apiRequest({ ...input, consent })); expect(response.status).toBe(422); expect(await response.json()).toEqual({ error: "consent_required" }); expect(processLocalLeadStore.countForTests()).toBe(0); }
    expect((await POST(apiRequest({ ...input, honeypot: "bot" }))).status).toBe(400); expect((await POST(apiRequest({ ...input, extra: true }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/leads", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/leads", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": String(513 * 1024) }, body: "{}" }))).status).toBe(400);
  });

  it("rate-limits the sixth new request and includes a bounded Retry-After", async () => {
    for (let index = 1; index <= 5; index += 1) expect((await POST(apiRequest(payload(index)))).status).toBe(201);
    const limited = await POST(apiRequest(payload(6))); expect(limited.status).toBe(429); expect(await limited.json()).toEqual({ error: "rate_limited" }); expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0); expect(processLocalLeadStore.countForTests()).toBe(5);
  });
});
