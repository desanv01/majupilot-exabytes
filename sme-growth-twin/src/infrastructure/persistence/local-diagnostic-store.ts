import type { BusinessTwin } from "@/domain/business-twin";
import {
  diagnosticResultSchema,
  PAIN_MODEL_VERSION,
  SCORE_MODEL_VERSION,
  type DiagnosticResult,
} from "@/domain/scoring";

export const DIAGNOSTIC_STORAGE_KEY = "sme-growth-twin:diagnostic:1.0.0";

export interface DiagnosticStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type DiagnosticLoadResult =
  | { status: "empty" }
  | { status: "ok"; result: DiagnosticResult }
  | { status: "discarded"; reason: "corrupt" | "incompatible" | "stale" };

export function saveDiagnosticResult(storage: DiagnosticStorage, result: DiagnosticResult) {
  storage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(diagnosticResultSchema.parse(result)));
}

export function clearDiagnosticResult(storage: DiagnosticStorage) {
  storage.removeItem(DIAGNOSTIC_STORAGE_KEY);
}

export function isDiagnosticCurrent(result: DiagnosticResult, twin: BusinessTwin) {
  return result.assessmentSessionId === twin.assessmentSessionId &&
    result.businessTwinId === twin.id &&
    result.twinRevision === twin.revision &&
    result.scoreModelVersion === SCORE_MODEL_VERSION &&
    result.painModelVersion === PAIN_MODEL_VERSION;
}

export function loadDiagnosticResult(storage: DiagnosticStorage, twin?: BusinessTwin): DiagnosticLoadResult {
  const raw = storage.getItem(DIAGNOSTIC_STORAGE_KEY);
  if (raw === null) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearDiagnosticResult(storage);
    return { status: "discarded", reason: "corrupt" };
  }
  const result = diagnosticResultSchema.safeParse(parsed);
  if (!result.success) {
    clearDiagnosticResult(storage);
    const record = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    const incompatible = record.scoreModelVersion !== SCORE_MODEL_VERSION || record.painModelVersion !== PAIN_MODEL_VERSION;
    return { status: "discarded", reason: incompatible ? "incompatible" : "corrupt" };
  }
  if (twin && !isDiagnosticCurrent(result.data, twin)) {
    clearDiagnosticResult(storage);
    return { status: "discarded", reason: "stale" };
  }
  return { status: "ok", result: result.data };
}
