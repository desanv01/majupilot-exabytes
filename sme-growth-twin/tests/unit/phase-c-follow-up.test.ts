import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { selectHighestImpactUnknown, validateModelProposal } from "@/core/assessment/dynamic-follow-up";
import { AiExecutionError, type FollowUpRequest, type ModelCallTelemetry } from "@/domain/ai-execution";
import type { OwnershipContext } from "@/domain/persistence";
import type { PersistenceRepository } from "@/infrastructure/persistence/repository";
import { runDynamicFollowUp } from "@/infrastructure/model-provider/follow-up-model";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const answers = {
  q1: { businessName: "Example", industry: "professional_services" as const, businessModel: "b2b" as const, employeeBand: "10_24" as const, description: "A bounded synthetic test business." },
  q2: { websiteOrStore: "informal" as const, businessEmail: "active" as const, cloudProductivity: "active" as const, crm: "not_used" as const, digitalMarketingAnalytics: "informal" as const, backup: "active" as const, cybersecurityControls: "informal" as const, aiTools: "not_used" as const },
  q3: { biggestChallenge: "manual_work" as const, manualWorkflow: "A manual internal workflow", manualHoursPerWeek: null, affectedEmployees: 3, urgency: 4 },
  q4: { primaryObjective: "reduce_cost" as const, budgetBand: "5k_15k" as const, implementationPace: "1_3_months" as const, highestConcern: "cost" as const },
  q5: { leadershipSponsorship: 4, usableData: 4, employeeDigitalSkills: 4, processConsistency: 4, changeWillingness: 4 },
};
const request: FollowUpRequest = { assessmentSessionId: uuid(1), answers, answeredIntents: [], automaticFollowUpCount: 0, evidenceRefs: [uuid(2)] };
const owner: OwnershipContext = { kind: "guest", guestSessionId: uuid(3) };
const records: ModelCallTelemetry[] = [];
const repository = {
  appendModelCall: vi.fn(async (_owner, record) => void records.push(record)),
  getDailyModelSpend: vi.fn(async () => 0),
} as unknown as PersistenceRepository;
const model = { id: "openai/gpt-5.6-sol", type: "language" as const, max_tokens: 8_192, supported_parameters: ["max_tokens"], modalities: { input: ["text"], output: ["text"] }, pricing: { input: "0.000001", output: "0.000004" } };

describe("Phase C deterministic follow-up authority", () => {
  it("selects one highest-impact unknown and stops after it is answered", () => {
    const selected = selectHighestImpactUnknown(answers, [], [uuid(2)]);
    expect(selected).toMatchObject({ intent: "manual_hours", expectedAnswerType: "number", evidenceRefs: [uuid(2)] });
    expect(selectHighestImpactUnknown(answers, ["manual_hours"], [uuid(2)])).toBeNull();
  });

  it("rejects a model attempt to change intent, choices, or evidence", () => {
    const selected = selectHighestImpactUnknown(answers, [], [uuid(2)])!;
    expect(() => validateModelProposal({ ...selected, intent: "sales_channel" }, selected)).toThrow("authoritative_follow_up_mismatch");
    expect(() => validateModelProposal({ ...selected, evidenceRefs: [uuid(9)] }, selected)).toThrow("unsupported_evidence_reference");
  });
});

describe("Phase C live execution modes", () => {
  const previous = { mode: process.env.AI_EXECUTION_MODE, model: process.env.AI_GATEWAY_MODEL, key: process.env.AI_GATEWAY_API_KEY };
  beforeEach(() => { records.length = 0; vi.clearAllMocks(); process.env.AI_GATEWAY_MODEL = model.id; process.env.AI_GATEWAY_API_KEY = "test-only"; });
  afterEach(() => {
    for (const [key, value] of Object.entries(previous)) {
      const name = key === "mode" ? "AI_EXECUTION_MODE" : key === "model" ? "AI_GATEWAY_MODEL" : "AI_GATEWAY_API_KEY";
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });

  it("disabled performs no preflight or provider call and records no prompt", async () => {
    process.env.AI_EXECUTION_MODE = "disabled";
    const provider = vi.fn(); const preflight = vi.fn();
    const result = await runDynamicFollowUp(request, owner, repository, "test", { callProvider: provider, preflight, id: () => uuid(4) });
    expect(result.state).toBe("ai_disabled"); expect(provider).not.toHaveBeenCalled(); expect(preflight).not.toHaveBeenCalled();
    expect(records[0]).toMatchObject({ outcome: "ai_disabled", model: "disabled", evidenceRefs: [uuid(2)] });
    expect(JSON.stringify(records[0])).not.toContain(answers.q3.manualWorkflow);
  });

  it("preferred discloses deterministic fallback for invalid structured output", async () => {
    process.env.AI_EXECUTION_MODE = "preferred";
    const result = await runDynamicFollowUp(request, owner, repository, "test", { preflight: vi.fn(async () => model), callProvider: vi.fn(async () => ({ output: { nope: true }, inputTokens: 10, outputTokens: 5 })), id: () => uuid(5) });
    expect(result).toMatchObject({ state: "deterministic_fallback", proposal: { intent: "manual_hours" } });
    expect(records[0]).toMatchObject({ outcome: "deterministic_fallback", fallbackReason: "AI_INVALID_OUTPUT" });
  });

  it("required returns a stable invalid-output error and never falls back", async () => {
    process.env.AI_EXECUTION_MODE = "required";
    await expect(runDynamicFollowUp(request, owner, repository, "test", { preflight: vi.fn(async () => model), callProvider: vi.fn(async () => ({ output: { nope: true }, inputTokens: 10, outputTokens: 5 })), id: () => uuid(6) })).rejects.toMatchObject<Partial<AiExecutionError>>({ code: "AI_INVALID_OUTPUT" });
    expect(records[0]).toMatchObject({ outcome: "failed", fallbackReason: "AI_INVALID_OUTPUT" });
  });

  it("accepts exactly one live schema-valid proposal and records usage/cost", async () => {
    process.env.AI_EXECUTION_MODE = "required";
    const proposal = selectHighestImpactUnknown(answers, [], [uuid(2)])!;
    const result = await runDynamicFollowUp(request, owner, repository, "test", { preflight: vi.fn(async () => model), callProvider: vi.fn(async () => ({ output: { ...proposal, question: "Approximately how many staff hours does this take each week?" }, inputTokens: 100, outputTokens: 40 })), id: () => uuid(7) });
    expect(result).toMatchObject({ state: "live", proposal: { intent: "manual_hours" }, model: model.id });
    expect(records[0]).toMatchObject({ outcome: "success", inputTokens: 100, outputTokens: 40, retryCount: 0 });
    expect(records[0].estimatedCost).toBeGreaterThan(0);
  });
});
