"use client";

import { accountCaseSnapshotSchema, type AccountCaseSnapshot } from "@/domain/account-cases";
import { canonicalJson } from "@/core/reports/canonical-json";
import { ASSESSMENT_STORAGE_KEY } from "./local-assessment-store";
import { DIAGNOSTIC_STORAGE_KEY } from "./local-diagnostic-store";
import { RECOMMENDATION_STORAGE_KEY } from "./local-recommendation-store";
import { SCENARIO_STORAGE_KEY } from "./local-scenario-store";
import { BLUEPRINT_STORAGE_KEY } from "./local-blueprint-store";
import { DURABLE_JOURNEY_STORAGE_KEY } from "./durable-journey-client";
import { DEMO_SESSION_STORAGE_KEY, PROJECT_LOCAL_STORAGE_KEYS, PROJECT_SESSION_STORAGE_KEYS } from "./project-storage";
import { ACCOUNT_CASE_STORAGE_KEY, activeAccountCase, setActiveAccountCase, type ActiveAccountCase } from "./account-case-scope";

export { activeAccountCase, setActiveAccountCase } from "./account-case-scope";

export function clearAccountCaseStorage(local: Storage, session: Storage) {
  for (const key of PROJECT_LOCAL_STORAGE_KEYS) local.removeItem(key);
  for (const key of PROJECT_SESSION_STORAGE_KEYS) session.removeItem(key);
  local.removeItem(ACCOUNT_CASE_STORAGE_KEY);
  window.dispatchEvent(new Event("majupilot:account-case-changed"));
}

function parseLocal(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) return undefined;
  try { return JSON.parse(raw) as unknown; } catch { return undefined; }
}

export function collectAccountCaseSnapshot(active: ActiveAccountCase): AccountCaseSnapshot | undefined {
  if (localStorage.getItem(DEMO_SESSION_STORAGE_KEY)) return undefined;
  const journey = parseLocal(DURABLE_JOURNEY_STORAGE_KEY);
  let context = journey && typeof journey === "object" ? journey as Record<string, unknown> : undefined;
  if (!context) {
    context = { organizationId: active.organizationId, assessmentSessionId: active.caseId, leadIdempotencyKey: `lead:${crypto.randomUUID()}` };
    localStorage.setItem(DURABLE_JOURNEY_STORAGE_KEY, JSON.stringify(context));
  }
  if (context.assessmentSessionId !== active.caseId || context.organizationId !== active.organizationId) return undefined;
  const durableJourney = { ...Object.fromEntries(Object.entries(context).filter(([key]) => key !== "guestSessionId")), schemaVersion: "1.0.0" };
  const candidate = {
    schemaVersion: "1.0.0", draft: parseLocal(ASSESSMENT_STORAGE_KEY),
    diagnostic: parseLocal(DIAGNOSTIC_STORAGE_KEY),
    recommendations: parseLocal(RECOMMENDATION_STORAGE_KEY),
    comparison: parseLocal(SCENARIO_STORAGE_KEY),
    blueprint: parseLocal(BLUEPRINT_STORAGE_KEY), durableJourney,
  };
  const result = accountCaseSnapshotSchema.safeParse(candidate);
  return result.success ? result.data : undefined;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const result = await fetch(url, { ...init, cache: "no-store" });
  const body = await result.json() as { data?: T; error?: { code: string } };
  if (!result.ok || !body.data) throw new Error(body.error?.code ?? "Request failed");
  return body.data;
}

let lastSave: Promise<unknown> = Promise.resolve();

async function saveOnce() {
  const active = activeAccountCase(localStorage);
  if (!active) return;
  const snapshot = collectAccountCaseSnapshot(active);
  if (!snapshot) {
    const hasWork = [ASSESSMENT_STORAGE_KEY, DIAGNOSTIC_STORAGE_KEY, RECOMMENDATION_STORAGE_KEY, SCENARIO_STORAGE_KEY, BLUEPRINT_STORAGE_KEY].some((key) => localStorage.getItem(key) !== null);
    if (hasWork) throw new Error("LOCAL_SNAPSHOT_INVALID");
    return;
  }
  let saved: { revision: number };
  try {
    saved = await request<{ revision: number }>(`/api/v2/cases/${active.caseId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: active.organizationId, expectedRevision: active.revision, snapshot }),
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "IDEMPOTENCY_CONFLICT" || active.revision !== 0) throw error;
    const existing = await request<{ revision: number; snapshot: unknown }>(`/api/v2/cases/${active.caseId}?organizationId=${encodeURIComponent(active.organizationId)}`, { method: "GET" });
    if (!existing.snapshot || canonicalJson(existing.snapshot) !== canonicalJson(JSON.parse(JSON.stringify(snapshot)) as unknown)) throw error;
    saved = { revision: existing.revision };
  }
  const latest = activeAccountCase(localStorage);
  if (latest?.caseId === active.caseId && latest.revision === active.revision) setActiveAccountCase(localStorage, { ...active, revision: saved.revision });
  return saved;
}

export function saveActiveAccountCase() {
  const next = lastSave.catch(() => undefined).then(saveOnce);
  lastSave = next;
  return next;
}

export function restoreAccountCase(snapshot: unknown, active: ActiveAccountCase) {
  if (snapshot === null) {
    clearAccountCaseStorage(localStorage, sessionStorage);
    setActiveAccountCase(localStorage, active);
    return;
  }
  const parsed = accountCaseSnapshotSchema.parse(snapshot);
  if (parsed.durableJourney && (parsed.durableJourney.assessmentSessionId !== active.caseId || parsed.durableJourney.organizationId !== active.organizationId)) throw new Error("Case identity mismatch");
  clearAccountCaseStorage(localStorage, sessionStorage);
  const entries: [string, unknown][] = [
    [ASSESSMENT_STORAGE_KEY, parsed.draft], [DIAGNOSTIC_STORAGE_KEY, parsed.diagnostic],
    [RECOMMENDATION_STORAGE_KEY, parsed.recommendations], [SCENARIO_STORAGE_KEY, parsed.comparison],
    [BLUEPRINT_STORAGE_KEY, parsed.blueprint],
    [DURABLE_JOURNEY_STORAGE_KEY, parsed.durableJourney ? { ...parsed.durableJourney, schemaVersion: undefined } : { organizationId: active.organizationId, assessmentSessionId: active.caseId, leadIdempotencyKey: `lead:${crypto.randomUUID()}` }],
  ];
  for (const [key, value] of entries) if (value !== undefined) localStorage.setItem(key, JSON.stringify(value));
  setActiveAccountCase(localStorage, active);
}
