import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateAdvisorReview } from "../../src/core/advisors/review-validation";
import { synthesizeAdvisorReviews } from "../../src/core/advisors/synthesize-advisors";
import { buildAdvisorReviewContext } from "../../src/core/blueprint/build-review-context";
import { advisorDefinitionSchema, advisorPanelResponseSchema, advisorReviewContextSchema, advisorReviewSchema } from "../../src/domain/advisors";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "../../src/domain-packs/exabytes/advisor-rules";
import { stage05CaseA } from "./stage05-fixtures";

async function files(root: string): Promise<string[]> { const entries = await readdir(root, { withFileTypes: true }); return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(root, entry.name)) : [path.join(root, entry.name)]))).flat(); }

describe("Stage 05 advisor contracts", () => {
  const full = stage05CaseA();

  it("owns exactly five stable distinct domain-pack roles", () => {
    expect(EXABYTES_ADVISORS_1_0_0.map((item) => item.id)).toEqual(["growth", "operations", "finance", "cybersecurity", "change"]);
    expect(new Set(EXABYTES_ADVISORS_1_0_0.map((item) => item.objective)).size).toBe(5);
    expect(advisorDefinitionSchema.safeParse({ ...EXABYTES_ADVISORS_1_0_0[0], extra: true }).success).toBe(false);
  });

  it("rejects unknown roles, invalid confidence, unsupported findings, duplicates, and extra fields", () => {
    const review = full.panel.reviews[0];
    expect(advisorReviewSchema.safeParse({ ...review, advisor: "sales" }).success).toBe(false);
    expect(advisorReviewSchema.safeParse({ ...review, confidence: 1.1 }).success).toBe(false);
    expect(advisorReviewSchema.safeParse({ ...review, support: [{ ...review.support[0], evidenceRefs: [] }] }).success).toBe(false);
    expect(advisorReviewSchema.safeParse({ ...review, concerns: [{ ...review.support[0] }] }).success).toBe(false);
    expect(advisorReviewSchema.safeParse({ ...review, extra: true }).success).toBe(false);
    expect(advisorPanelResponseSchema.safeParse({ reviews: [...full.panel.reviews.slice(0, 4), full.panel.reviews[0]], modelCalls: full.panel.modelCalls }).success).toBe(false);
    expect(advisorPanelResponseSchema.safeParse({ reviews: [full.panel.reviews[1], full.panel.reviews[0], ...full.panel.reviews.slice(2)], modelCalls: full.panel.modelCalls }).success).toBe(false);
    expect(advisorPanelResponseSchema.safeParse({ reviews: full.panel.reviews, modelCalls: [...full.panel.modelCalls.slice(0, 4), full.panel.modelCalls[0]] }).success).toBe(false);
    expect(advisorPanelResponseSchema.safeParse({ reviews: full.panel.reviews, modelCalls: [full.panel.modelCalls[1], full.panel.modelCalls[0], ...full.panel.modelCalls.slice(2)] }).success).toBe(false);
    expect(advisorPanelResponseSchema.safeParse({ reviews: full.panel.reviews, modelCalls: [{ ...full.panel.modelCalls[0], status: "success", errorCategory: "none" }, ...full.panel.modelCalls.slice(1)] }).success).toBe(false);
  });

  it("rejects model output with an unknown evidence reference", () => {
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    const live = { ...full.panel.reviews[0], origin: "model" as const, sourceRef: "advisor-prompt-1.0.0", support: full.panel.reviews[0].support.map((item) => ({ ...item, claimSource: "model_interpretation" as const, evidenceRefs: ["unknown-ref"] })), concerns: full.panel.reviews[0].concerns.map((item) => ({ ...item, claimSource: "model_interpretation" as const })), missingEvidence: full.panel.reviews[0].missingEvidence.map((item) => ({ ...item, claimSource: "model_interpretation" as const })), adjustments: full.panel.reviews[0].adjustments.map((item) => ({ ...item, claimSource: "model_interpretation" as const })) };
    expect(() => validateAdvisorReview(live, EXABYTES_ADVISORS_1_0_0[0], context)).toThrow("invalid_evidence");
  });

  it("meets every frozen Case A fallback expectation without changing numeric records", () => {
    const before = JSON.stringify({ twin: full.twin, diagnostic: full.diagnostic, recommendation: full.recommendation, comparison: full.comparison });
    const byRole = Object.fromEntries(full.panel.reviews.map((review) => [review.advisor, review]));
    expect(byRole.growth.headline).toMatch(/customer operations/i); expect(byRole.growth.missingEvidence[0].statement).toMatch(/revenue.*conversion/i);
    expect(byRole.operations.support[0].statement).toMatch(/dependencies/i); expect(byRole.operations.adjustments[0].action).toMatch(/owner/i);
    expect(byRole.finance.concerns[0].statement).toContain("only_low_within"); expect(byRole.finance.concerns[0].statement).toContain("30.4 months"); expect(byRole.finance.adjustments[0].action).toMatch(/phases/i);
    expect(byRole.cybersecurity.support.map((item) => item.statement).join(" ")).toMatch(/continuity.*web presence/i); expect(byRole.cybersecurity.missingEvidence[0].statement).toMatch(/recovery test/i);
    expect(byRole.change.concerns[0].statement).toMatch(/4 committed.*0 conditional/i); expect(byRole.change.adjustments[0].action).toMatch(/owners.*training.*adoption/i);
    expect(JSON.stringify({ twin: full.twin, diagnostic: full.diagnostic, recommendation: full.recommendation, comparison: full.comparison })).toBe(before);
  });

  it("is deterministic and preserves agreement, conditions, missing evidence, and empty disagreement", () => {
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    const again = EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, context, `advisor_stage05${String(index + 1).padStart(4, "0")}`));
    expect(again).toEqual(full.panel.reviews);
    const synthesis = synthesizeAdvisorReviews(again);
    expect(synthesis.agreement.map((item) => item.topic)).toContain("delivery_governance"); expect(synthesis.disagreement).toEqual([]); expect(synthesis.conditions.length).toBeGreaterThan(4); expect(synthesis.openQuestions.length).toBeGreaterThan(0); expect(synthesis.decision).toBe("proceed_with_conditions");
  });

  it("preserves every distinct same-topic perspective in stable review order", () => {
    const reviews = structuredClone(full.panel.reviews);
    reviews[0].support[0] = { ...reviews[0].support[0], topic: "shared_tradeoff", statement: "Growth supports a measured pilot." };
    reviews[1].support[0] = { ...reviews[1].support[0], topic: "shared_tradeoff", statement: "Operations supports a staged rollout." };
    reviews[2].concerns[0] = { ...reviews[2].concerns[0], topic: "shared_tradeoff", statement: "Finance requires a cash-flow gate." };
    const item = synthesizeAdvisorReviews(reviews).disagreement.find((entry) => entry.topic === "shared_tradeoff");
    expect(item?.perspectives.map((perspective) => perspective.statement)).toEqual(["Growth supports a measured pilot.", "Operations supports a staged rollout.", "Finance requires a cash-flow gate."]);
    expect(item?.perspectives.map((perspective) => perspective.kind)).toEqual(["support", "support", "concern"]);
  });

  it("derives fallback claims from Lean and Accelerated selected scope without unrelated capability references", () => {
    for (const scenarioIndex of [0, 2]) {
      const base = stage05CaseA(); const scenario = base.comparison.scenarios[scenarioIndex];
      const comparison = { ...base.comparison, selectedScenarioId: scenario.id };
      const context = buildAdvisorReviewContext(base.twin, base.diagnostic, base.recommendation, comparison);
      const reviews = EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, context, `advisor_shape${scenarioIndex}${index}000`));
      const selectedIds = new Set(scenario.interventions.map((item) => item.capabilityId));
      const allItems = reviews.flatMap((review) => [...review.support, ...review.concerns, ...review.missingEvidence, ...review.adjustments]);
      expect(allItems.flatMap((item) => item.evidenceRefs).every((reference) => context.evidenceAllowList.includes(reference))).toBe(true);
      for (const [capabilityId, phrase] of [["shared_customer_operations", "Shared customer operations"], ["protected_business_continuity", "Protected business continuity"], ["protected_web_presence", "Protected web presence"]] as const) {
        const capabilityRef = `capability:${capabilityId}`;
        expect(allItems.some((item) => item.evidenceRefs.includes(capabilityRef))).toBe(selectedIds.has(capabilityId));
        if (!selectedIds.has(capabilityId)) expect(reviews.flatMap((review) => review.support.map((item) => item.statement)).join(" ")).not.toContain(phrase);
      }
    }
  });

  it("uses estimated revenue and avoided-risk ranges without stale missing-value claims", () => {
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    const estimated = advisorReviewContextSchema.parse({ ...context, selectedScenario: { ...context.selectedScenario, values: {
      ...context.selectedScenario.values,
      revenue: { status: "estimated", range: { low: 600, base: 1440, high: 2800 }, formula: "addressable revenue × conversion change × gross margin" },
      avoidedRisk: { status: "estimated", range: { low: 250, base: 900, high: 2400 }, formula: "incident probability × incident impact × risk reduction" },
    } } });
    const reviews = EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, estimated, `advisor_estimated${index}000`));
    const text = reviews.flatMap((review) => [review.headline, ...review.support.map((item) => item.statement), ...review.concerns.map((item) => item.statement), ...review.missingEvidence.map((item) => item.statement)]).join(" ");
    expect(text).toContain("RM600/RM1440/RM2800"); expect(text).toContain("RM250/RM900/RM2400");
    expect(text).not.toMatch(/revenue and conversion contribution cannot|revenue and avoided risk remain unestimated|avoided-risk inputs.*not recorded/i);
  });

  it("rejects oversized and structurally unbounded review contexts", () => {
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    expect(advisorReviewContextSchema.safeParse({ ...context, business: { ...context.business, objective: "x".repeat(501) } }).success).toBe(false);
    expect(advisorReviewContextSchema.safeParse({ ...context, evidenceAllowList: Array.from({ length: 251 }, (_, index) => `ref:${index}`) }).success).toBe(false);
    expect(advisorReviewContextSchema.safeParse({ ...context, painPoints: Array.from({ length: 6 }, (_, index) => ({ id: `pain-${index}`, title: "Bounded", priority: 1, evidenceRefs: [] })) }).success).toBe(false);
  });

  it("keeps every failure category role-local and supports an honest mixed-origin panel", () => {
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    const statuses = ["unavailable", "timeout", "provider_error", "invalid_output", "invalid_evidence"] as const;
    const calls = EXABYTES_ADVISORS_1_0_0.map((definition, index) => ({ id: `modelcall_failure${String(index + 1).padStart(4, "0")}`, advisor: definition.id, provider: index === 0 ? "unavailable" : "vercel_ai_gateway", model: index === 0 ? "not_configured" : "configured-at-runtime", promptVersion: "1.0.0", schemaVersion: "1.0.0", latencyMs: index, retryCount: index === 0 ? 0 : 1, status: statuses[index], evidenceIds: [], errorCategory: index === 0 ? "configuration" : index === 1 ? "timeout" : index === 4 ? "evidence" : index === 3 ? "validation" : "provider" }));
    const reviews = EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, context, `advisor_failure${String(index + 1).padStart(4, "0")}`));
    expect(advisorPanelResponseSchema.parse({ reviews, modelCalls: calls }).reviews.every((review) => review.origin === "deterministic_fallback")).toBe(true);
    const liveGrowth = { ...reviews[0], origin: "model" as const, sourceRef: "advisor-prompt-1.0.0", support: reviews[0].support.map((item) => ({ ...item, claimSource: "model_interpretation" as const })), concerns: reviews[0].concerns.map((item) => ({ ...item, claimSource: "model_interpretation" as const })), missingEvidence: reviews[0].missingEvidence.map((item) => ({ ...item, claimSource: "model_interpretation" as const })), adjustments: reviews[0].adjustments.map((item) => ({ ...item, claimSource: "model_interpretation" as const })) };
    const mixed = advisorPanelResponseSchema.parse({ reviews: [liveGrowth, ...reviews.slice(1)], modelCalls: [{ ...calls[0], provider: "vercel_ai_gateway", model: "configured-at-runtime", status: "success", errorCategory: "none" }, ...calls.slice(1)] });
    expect(mixed.reviews.map((review) => review.origin)).toEqual(["model", "deterministic_fallback", "deterministic_fallback", "deterministic_fallback", "deterministic_fallback"]);
  });

  it("keeps the reusable core free of domain-pack IDs, AI SDK, environment and infrastructure", async () => {
    for (const file of (await files(path.resolve("src/core"))).filter((item) => /\.[jt]sx?$/.test(item))) {
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(/from\s+["']ai["']|process\.env|domain-packs[\\/]exabytes|infrastructure|shared_customer_operations|balanced_growth/i);
    }
  });
});
