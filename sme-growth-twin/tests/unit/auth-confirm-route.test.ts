import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const auth = vi.hoisted(() => ({ verifyOtp: vi.fn(), exchangeCodeForSession: vi.fn() }));
vi.mock("@/infrastructure/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth }),
}));

describe("email confirmation callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hands an implicit callback to the browser without treating it as expired", async () => {
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(new Request("https://majupilot.example/auth/confirm"));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://majupilot.example/cases?auth=callback");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("opens password setup only after a valid recovery token", async () => {
    auth.verifyOtp.mockResolvedValueOnce({ error: null });
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(new Request("https://majupilot.example/auth/confirm?token_hash=hashed-token&type=recovery"));
    expect(response.headers.get("location")).toBe("https://majupilot.example/cases?auth=recovery");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "hashed-token", type: "recovery" });
  });

  it("rejects an invalid code without opening password setup", async () => {
    auth.exchangeCodeForSession.mockResolvedValueOnce({ error: new Error("invalid code") });
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(new Request("https://majupilot.example/auth/confirm?code=bad-code"));
    expect(response.headers.get("location")).toBe("https://majupilot.example/cases?auth=expired");
  });
});
