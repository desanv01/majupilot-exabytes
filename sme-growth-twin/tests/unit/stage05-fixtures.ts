import { buildAdvisorReviewContext } from "../../src/core/blueprint/build-review-context";
import { buildBlueprint } from "../../src/core/blueprint/build-blueprint";
import { advisorPanelResponseSchema, type AdvisorPanelResponse } from "../../src/domain/advisors";
import { EXABYTES_ADVISORS_1_0_0, buildExabytesFallbackReview } from "../../src/domain-packs/exabytes/advisor-rules";
import { caseAFull, now } from "./stage04-fixtures";

export function stage05CaseA(): ReturnType<typeof caseAFull> & { panel: AdvisorPanelResponse; blueprint: ReturnType<typeof buildBlueprint> } {
  const full = caseAFull(); const balanced = full.comparison.scenarios[1];
  const comparison = { ...full.comparison, selectedScenarioId: balanced.id };
  const context = buildAdvisorReviewContext(full.twin, full.diagnostic, full.recommendation, comparison);
  const reviews = EXABYTES_ADVISORS_1_0_0.map((definition, index) => buildExabytesFallbackReview(definition, context, `advisor_stage05${String(index + 1).padStart(4, "0")}`));
  const modelCalls = EXABYTES_ADVISORS_1_0_0.map((definition, index) => ({ id: `modelcall_stage05${String(index + 1).padStart(4, "0")}`, advisor: definition.id, provider: "unavailable", model: "not_configured", promptVersion: "1.0.0", schemaVersion: "1.0.0", latencyMs: 0, retryCount: 0, status: "unavailable", evidenceIds: [], errorCategory: "configuration" }));
  const panel = advisorPanelResponseSchema.parse({ reviews, modelCalls });
  const blueprint = buildBlueprint({ twin: full.twin, diagnostic: full.diagnostic, recommendations: full.recommendation, comparison, panel }, { id: () => "blueprint_stage0500001", now: () => now });
  return { ...full, comparison, panel, blueprint };
}
