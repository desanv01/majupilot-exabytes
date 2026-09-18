import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Stage 05 advisor API request bounds", () => {
  it("rejects an oversized declared body before parsing", async () => {
    const { POST } = await import("../../src/app/api/advisors/review/route");
    const response = await POST(new Request("http://localhost/api/advisors/review", { method: "POST", headers: { "content-length": String(256 * 1024 + 1) }, body: "{}" }));
    expect(response.status).toBe(413); expect(await response.json()).toEqual({ error: "request_too_large" });
  });

  it("rejects an oversized streamed body even without Content-Length", async () => {
    const { POST } = await import("../../src/app/api/advisors/review/route");
    const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("x".repeat(256 * 1024 + 1))); controller.close(); } });
    const response = await POST(new Request("http://localhost/api/advisors/review", { method: "POST", body, duplex: "half" } as RequestInit & { duplex: "half" }));
    expect(response.status).toBe(413); expect(await response.json()).toEqual({ error: "request_too_large" });
  });
});
