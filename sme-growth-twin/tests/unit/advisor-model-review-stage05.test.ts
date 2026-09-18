import { APICallError } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildAdvisorReviewContext } from "../../src/core/blueprint/build-review-context";
import { EXABYTES_ADVISORS_1_0_0 } from "../../src/domain-packs/exabytes/advisor-rules";
import { stage05CaseA } from "./stage05-fixtures";

const generateTextMock = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("ai", async (importOriginal) => ({ ...(await importOriginal<typeof import("ai")>()), generateText: generateTextMock }));

const apiError = (statusCode: number, secret: string) => new APICallError({
  message: secret, url: "https://ai-gateway.vercel.sh/v1/ai/language-model", requestBodyValues: { secret }, statusCode,
  responseHeaders: { authorization: secret, "x-private-header": secret }, responseBody: JSON.stringify({ error: secret }),
});

describe("Stage 05 advisor Gateway HTTP classification", () => {
  const previous = { model: process.env.AI_GATEWAY_MODEL, key: process.env.AI_GATEWAY_API_KEY, oidc: process.env.VERCEL_OIDC_TOKEN };
  const full = stage05CaseA(); const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);

  beforeEach(() => { generateTextMock.mockReset(); process.env.AI_GATEWAY_MODEL = "provider/runtime-model"; process.env.AI_GATEWAY_API_KEY = "test-key-never-logged"; delete process.env.VERCEL_OIDC_TOKEN; });
  afterEach(() => {
    if (previous.model === undefined) delete process.env.AI_GATEWAY_MODEL; else process.env.AI_GATEWAY_MODEL = previous.model;
    if (previous.key === undefined) delete process.env.AI_GATEWAY_API_KEY; else process.env.AI_GATEWAY_API_KEY = previous.key;
    if (previous.oidc === undefined) delete process.env.VERCEL_OIDC_TOKEN; else process.env.VERCEL_OIDC_TOKEN = previous.oidc;
  });

  it.each([401, 402, 403, 404, 422])("treats HTTP %i as a terminal redacted provider fallback", async (statusCode) => {
    const secret = `provider-secret-${statusCode}`; generateTextMock.mockRejectedValue(apiError(statusCode, secret));
    const { reviewWithConfiguredModel } = await import("../../src/infrastructure/model-provider/advisor-model-review");
    const result = await reviewWithConfiguredModel(EXABYTES_ADVISORS_1_0_0[0], context);
    expect(generateTextMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: "fallback", call: { advisor: "growth", provider: "vercel_ai_gateway", model: "provider/runtime-model", status: "provider_error", errorCategory: "provider", retryCount: 0, evidenceIds: [] } });
    expect(JSON.stringify(result)).not.toContain(secret); expect(JSON.stringify(result)).not.toMatch(/authorization|responseBody|requestBodyValues/i);
  });

  it.each([408, 409, 429, 503])("preserves one bounded retry for transient HTTP %i", async (statusCode) => {
    generateTextMock.mockRejectedValue(apiError(statusCode, `transient-secret-${statusCode}`));
    const { reviewWithConfiguredModel } = await import("../../src/infrastructure/model-provider/advisor-model-review");
    const result = await reviewWithConfiguredModel(EXABYTES_ADVISORS_1_0_0[0], context);
    expect(generateTextMock).toHaveBeenCalledTimes(2); expect(result.status).toBe("fallback"); expect(result.call.retryCount).toBe(1);
    expect(result.call.status).toBe(statusCode === 408 ? "timeout" : "provider_error");
  });
});
