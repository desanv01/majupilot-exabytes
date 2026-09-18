import { describe, expect, it } from "vitest";

import { AdvisorModelAttemptError, runBoundedAdvisorModelReview } from "../../src/infrastructure/model-provider/advisor-model-runner";
import { EXABYTES_ADVISORS_1_0_0 } from "../../src/domain-packs/exabytes/advisor-rules";
import { stage05CaseA } from "./stage05-fixtures";

describe("Stage 05 bounded model runner", () => {
  const definition = EXABYTES_ADVISORS_1_0_0[0]; const review = stage05CaseA().panel.reviews[0];
  const options = { definition, model: "runtime-model", now: () => 100, callId: () => "modelcall_runner000001" };

  it("returns first-attempt success without retry", async () => {
    let calls = 0; const result = await runBoundedAdvisorModelReview({ ...options, attempt: async () => { calls += 1; return { review, evidenceIds: ["scenario:x"] }; } });
    expect(calls).toBe(1); expect(result.status).toBe("success"); expect(result.call.retryCount).toBe(0);
  });

  it("retries one transient failure and records success on retry", async () => {
    let calls = 0; const result = await runBoundedAdvisorModelReview({ ...options, attempt: async () => { calls += 1; if (calls === 1) throw new AdvisorModelAttemptError("timeout", "timeout", true); return { review, evidenceIds: [] }; } });
    expect(calls).toBe(2); expect(result.status).toBe("success"); expect(result.call.retryCount).toBe(1);
  });

  it("does not retry terminal validation failures", async () => {
    let calls = 0; const result = await runBoundedAdvisorModelReview({ ...options, attempt: async () => { calls += 1; throw new AdvisorModelAttemptError("invalid_output", "validation", false); } });
    expect(calls).toBe(1); expect(result).toMatchObject({ status: "fallback", call: { status: "invalid_output", errorCategory: "validation", retryCount: 0 } });
  });

  it("stops after one retry when transient failures persist", async () => {
    let calls = 0; const result = await runBoundedAdvisorModelReview({ ...options, attempt: async () => { calls += 1; throw new AdvisorModelAttemptError("provider_error", "provider", true); } });
    expect(calls).toBe(2); expect(result).toMatchObject({ status: "fallback", call: { status: "provider_error", errorCategory: "provider", retryCount: 1 } });
  });
});
