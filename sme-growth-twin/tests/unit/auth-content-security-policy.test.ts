import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("browser Auth content security policy", () => {
  it("allows connections only to this deployment and the configured Supabase origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co/other/path");
    vi.resetModules();
    const { default: config } = await import("../../next.config");
    const rules = await config.headers!();
    const policy = rules[0].headers.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(policy).toContain("connect-src 'self' https://example.supabase.co");
    expect(policy).not.toContain("connect-src *");
    expect(policy).not.toContain("https://example.supabase.co/other/path");
  });

  it("rejects production builds without a browser Supabase URL", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.resetModules();

    await expect(import("../../next.config")).rejects.toThrow("NEXT_PUBLIC_SUPABASE_URL is required");
  });
});
