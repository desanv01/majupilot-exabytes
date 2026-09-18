import { blueprintIdentity, deepFreeze } from "@/core/blueprint/build-blueprint";
import { BLUEPRINT_MODEL_VERSION, BLUEPRINT_STORAGE_VERSION, blueprintSchema, type Blueprint } from "@/domain/blueprint";
import type { BusinessTwin } from "@/domain/business-twin";
import type { RecommendationResult } from "@/domain/recommendations";
import type { ScenarioComparison } from "@/domain/scenarios";
import type { DiagnosticResult } from "@/domain/scoring";

export const BLUEPRINT_STORAGE_KEY = "sme-growth-twin:blueprint:1.0.0";
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type BlueprintLoadResult = { status: "empty" } | { status: "ok"; result: Blueprint } | { status: "discarded"; reason: "corrupt" | "incompatible" | "stale" };

export function saveBlueprint(storage: Pick<StoragePort, "setItem">, blueprint: Blueprint) { storage.setItem(BLUEPRINT_STORAGE_KEY, JSON.stringify(blueprintSchema.parse(blueprint))); }
export function clearBlueprint(storage: Pick<StoragePort, "removeItem">) { storage.removeItem(BLUEPRINT_STORAGE_KEY); }

export function isBlueprintCurrent(blueprint: Blueprint, twin: BusinessTwin, diagnostic: DiagnosticResult, recommendations: RecommendationResult, comparison: ScenarioComparison) {
  if (!comparison.selectedScenarioId) return false;
  try { return JSON.stringify(blueprint.sourceIdentity) === JSON.stringify(blueprintIdentity({ twin, diagnostic, recommendations, comparison })); } catch { return false; }
}

export function loadBlueprint(storage: Pick<StoragePort, "getItem" | "removeItem">, twin?: BusinessTwin, diagnostic?: DiagnosticResult, recommendations?: RecommendationResult, comparison?: ScenarioComparison): BlueprintLoadResult {
  const raw = storage.getItem(BLUEPRINT_STORAGE_KEY); if (raw === null) return { status: "empty" };
  let input: unknown; try { input = JSON.parse(raw); } catch { clearBlueprint(storage); return { status: "discarded", reason: "corrupt" }; }
  const parsed = blueprintSchema.safeParse(input);
  if (!parsed.success) {
    clearBlueprint(storage); const record = input && typeof input === "object" ? input as Record<string, unknown> : {};
    return { status: "discarded", reason: record.storageVersion !== BLUEPRINT_STORAGE_VERSION || record.modelVersion !== BLUEPRINT_MODEL_VERSION ? "incompatible" : "corrupt" };
  }
  if (twin && diagnostic && recommendations && comparison && !isBlueprintCurrent(parsed.data, twin, diagnostic, recommendations, comparison)) { clearBlueprint(storage); return { status: "discarded", reason: "stale" }; }
  return { status: "ok", result: deepFreeze(parsed.data) as Blueprint };
}
