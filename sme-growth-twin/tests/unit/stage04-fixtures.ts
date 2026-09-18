import { buildBusinessTwin } from "../../src/core/assessment/build-business-twin";
import { buildRecommendationResult } from "../../src/core/recommendations/build-recommendations";
import { buildScenarioComparison } from "../../src/core/scenarios/build-scenarios";
import { buildDiagnosticResult } from "../../src/core/scoring/build-diagnostic";
import { EXABYTES_CATALOGUE_1_0_0 } from "../../src/domain-packs/exabytes/catalogue";
import { EXABYTES_OFFERING_SELECTION_1_0_0 } from "../../src/domain-packs/exabytes/offering-selection";
import { EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0 } from "../../src/domain-packs/exabytes/recommendation-rules";
import { EXABYTES_SCENARIO_RULES_1_0_0 } from "../../src/domain-packs/exabytes/scenario-templates";
import { GOLDEN_FIXTURES } from "../../src/domain-packs/exabytes/golden-fixtures";
import type { CoreAnswers, FollowUpAnswers, FollowUpId } from "../../src/domain/assessment";
import { assessmentSessionIdSchema } from "../../src/domain/ids";

export const now = "2026-09-17T09:00:00+08:00";
export const caseA: CoreAnswers = GOLDEN_FIXTURES[0].answers;
export const caseB: CoreAnswers = GOLDEN_FIXTURES[1].answers;
export const caseC: CoreAnswers = GOLDEN_FIXTURES[2].answers;

export function fullCase(answers = caseA, followUps: FollowUpAnswers = {}, selected: FollowUpId[] = [], suffix = "a") {
  let idSequence = 0;
  let eventSequence = 0;
  const twin = buildBusinessTwin({ sessionId: assessmentSessionIdSchema.parse(`assessment_stage04${suffix.padEnd(4, "0")}`), answers, followUpAnswers: followUps, selectedFollowUpIds: selected }, { now: () => now, id: (kind) => `${kind}_stage04${String(++idSequence).padStart(4, "0")}` });
  const diagnostic = buildDiagnosticResult(twin, { now: () => now, id: () => `diagnostic_stage04${suffix.padEnd(4, "0")}` });
  const recommendation = buildRecommendationResult(twin, diagnostic, EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0, EXABYTES_CATALOGUE_1_0_0, EXABYTES_OFFERING_SELECTION_1_0_0, { now: () => now, id: () => `recommendation_stage04${suffix.padEnd(4, "0")}` });
  const comparison = buildScenarioComparison(twin, diagnostic, recommendation, EXABYTES_SCENARIO_RULES_1_0_0, { now: () => now, id: () => `scenario_stage04${suffix.padEnd(5, "0")}`, eventId: () => `event_stage04${String(++eventSequence).padStart(5, "0")}` });
  return { twin, diagnostic, recommendation, comparison };
}

export function caseAFull() { return fullCase(caseA, GOLDEN_FIXTURES[0].followUpAnswers, GOLDEN_FIXTURES[0].selectedFollowUpIds, "a"); }
export function caseBFull() { return fullCase(caseB, GOLDEN_FIXTURES[1].followUpAnswers, GOLDEN_FIXTURES[1].selectedFollowUpIds, "b"); }
export function caseCFull() { return fullCase(caseC, GOLDEN_FIXTURES[2].followUpAnswers, GOLDEN_FIXTURES[2].selectedFollowUpIds, "c"); }

export function memoryStorage() { const data = new Map<string, string>(); return { data, storage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) } }; }
