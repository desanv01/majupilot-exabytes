import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AiExecutionError } from "@/domain/ai-execution";
import { executionMode, operationPolicy } from "@/infrastructure/model-provider/ai-execution-policy";
import { preflightModel, resetGatewayCatalogueCacheForTests } from "@/infrastructure/model-provider/gateway-catalogue";

describe("Phase C policy and exact-current-model preflight", () => {
  const previous = process.env.AI_EXECUTION_MODE;
  afterEach(() => { if (previous === undefined) delete process.env.AI_EXECUTION_MODE; else process.env.AI_EXECUTION_MODE = previous; resetGatewayCatalogueCacheForTests(); });

  it("defaults the competition path to required and rejects unknown modes", () => {
    delete process.env.AI_EXECUTION_MODE; expect(executionMode()).toBe("required");
    process.env.AI_EXECUTION_MODE = "sometimes"; expect(() => executionMode()).toThrow(AiExecutionError);
  });

  it("requires the configured exact ID and required text/output capacity", async () => {
    process.env.AI_EXECUTION_MODE = "required"; process.env.AI_GATEWAY_MODEL = "provider/exact-model";
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: [{ id: "provider/exact-model", type: "language", max_tokens: 1024, supported_parameters: ["max_tokens"], modalities: { input: ["text"], output: ["text"] } }] }), { status: 200 }));
    await expect(preflightModel(operationPolicy("assessment_follow_up"), fetcher as typeof fetch)).resolves.toMatchObject({ id: "provider/exact-model" });
    process.env.AI_GATEWAY_MODEL = "provider/not-present";
    await expect(preflightModel(operationPolicy("assessment_follow_up"), fetcher as typeof fetch)).rejects.toMatchObject({ code: "AI_REQUIRED_UNAVAILABLE" });
  });
});
