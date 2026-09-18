import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Stage 05 opt-in live Gateway harness", () => {
  const scriptPath = path.join(process.cwd(), "scripts/stage05-live-gateway-check.mjs");

  it("refuses to start without credentials and does not leak inherited values", () => {
    const secret = "must-not-appear-in-output";
    const result = spawnSync(process.execPath, [scriptPath], { cwd: process.cwd(), encoding: "utf8", env: { ...process.env, AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "", HARNESS_SECRET_SENTINEL: secret } });
    expect(result.status).toBe(1); expect(result.stdout).toBe(""); expect(result.stderr).not.toContain(secret);
    expect(JSON.parse(result.stderr)).toEqual({ ok: false, error: "missing_gateway_configuration", advisors: [] });
  });

  it("keeps the live contract bounded, ordered, cost-opt-in, and separate from the deterministic gate", async () => {
    const [script, deterministic, packageJson, readme] = await Promise.all([
      readFile(scriptPath, "utf8"), readFile(path.join(process.cwd(), "scripts/stage05-browser-check.mjs"), "utf8"), readFile(path.join(process.cwd(), "package.json"), "utf8"), readFile(path.join(process.cwd(), "README.md"), "utf8"),
    ]);
    expect(script).toContain('const expectedAdvisors = ["growth", "operations", "finance", "cybersecurity", "change"]');
    for (const contract of ['call.provider === "vercel_ai_gateway"', 'call.model === model', 'call.status === "success"', 'call.errorCategory === "none"', 'review.origin === "model"', 'advisorResponses.length !== 1', 'selected.templateId !== "balanced_growth"', 'restoredBlueprintId !== blueprintId']) expect(script).toContain(contract);
    expect(script).toContain('env: { ...process.env }'); expect(script).toContain("finally"); expect(script).not.toMatch(/console\.(?:log|error)\([^\n]*(?:AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN|prompt|BUSINESS_DATA|response\.json)/);
    expect(deterministic).toContain('AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: ""');
    expect(JSON.parse(packageJson).scripts["test:stage05:gateway-live"]).toBe("node scripts/stage05-live-gateway-check.mjs");
    expect(readme).toMatch(/incurs provider\/Gateway cost/i); expect(readme).toMatch(/not\s+run in CI/i);
  });
});
