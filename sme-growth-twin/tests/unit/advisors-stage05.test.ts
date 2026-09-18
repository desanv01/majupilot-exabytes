import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateAdvisorReview } from "../../src/core/advisors/review-validation";
import { synthesizeAdvisorReviews } from "../../src/core/advisors/synthesize-advisors";
import { buildAdvisorReviewContext } from "../../src/core/blueprint/build-review-context";
import { advisorDefinitionSchema, advisorPanelResponseSchema, advisorReviewSchema } from "../../src/domain/advisors";
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
    expect(byRole.cybersecurity.support[0].statement).toMatch(/continuity.*web-protection/i); expect(byRole.cybersecurity.missingEvidence[0].statement).toMatch(/recovery test/i);
    expect(byRole.change.concerns[0].statement).toContain("4 committed initiatives"); expect(byRole.change.adjustments[0].action).toMatch(/owners.*training.*adoption/i);
    expect(JSON.stringify({ twin: full.twin, diagnostic: full.diagnostic, recommendation: full.recommendation, comparison: full.comparison })).toBe(before);
  });

  it("is deterministic and preserves agreement, conditions, missing evidence, and empty disagreement", () => {
    const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, full.comparison);
    const again = EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, context, `advisor_stage05${String(index + 1).padStart(4, "0")}`));
    expect(again).toEqual(full.panel.reviews);
    const synthesis = synthesizeAdvisorReviews(again);
    expect(synthesis.agreement.map((item) => item.topic)).toContain("delivery_governance"); expect(synthesis.disagreement).toEqual([]); expect(synthesis.conditions.length).toBeGreaterThan(4); expect(synthesis.openQuestions.length).toBeGreaterThan(0); expect(synthesis.decision).toBe("proceed_with_conditions");
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
