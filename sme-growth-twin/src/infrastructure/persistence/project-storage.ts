import { z } from "zod";

import { BLUEPRINT_STORAGE_KEY } from "./local-blueprint-store";
import { ASSESSMENT_STORAGE_KEY } from "./local-assessment-store";
import { DIAGNOSTIC_STORAGE_KEY } from "./local-diagnostic-store";
import { RECOMMENDATION_STORAGE_KEY } from "./local-recommendation-store";
import { SCENARIO_STORAGE_KEY } from "./local-scenario-store";
import { LEAD_RECEIPT_SESSION_KEY } from "./session-lead-receipt-store";

export const DEMO_SESSION_STORAGE_KEY = "sme-growth-twin:demo-session:1.0.0";
export const RESET_STATUS_SESSION_KEY = "sme-growth-twin:reset-status:1.0.0";
export const DEMO_SESSION_CHANGED_EVENT = "sme-growth-twin:demo-session-changed";

export const demoSessionSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    fixtureId: z.enum(["case-a", "case-b", "case-c"]),
    fixtureVersion: z.literal("1.0.0"),
    label: z.string().trim().min(2).max(100),
    fictional: z.literal(true),
    assessmentSessionId: z.string().startsWith("assessment_"),
    loadedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export type DemoSession = z.infer<typeof demoSessionSchema>;

export const PROJECT_LOCAL_STORAGE_KEYS = [
  ASSESSMENT_STORAGE_KEY,
  DIAGNOSTIC_STORAGE_KEY,
  RECOMMENDATION_STORAGE_KEY,
  SCENARIO_STORAGE_KEY,
  BLUEPRINT_STORAGE_KEY,
  DEMO_SESSION_STORAGE_KEY,
] as const;

export const PROJECT_SESSION_STORAGE_KEYS = [LEAD_RECEIPT_SESSION_KEY] as const;

type ReadWriteStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function clearKnownProjectStorage(
  local: Pick<Storage, "removeItem">,
  session: Pick<Storage, "removeItem">,
) {
  for (const key of PROJECT_LOCAL_STORAGE_KEYS) local.removeItem(key);
  for (const key of PROJECT_SESSION_STORAGE_KEYS) session.removeItem(key);
}

export function saveDemoSession(storage: Pick<ReadWriteStorage, "setItem">, value: DemoSession) {
  storage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(demoSessionSchema.parse(value)));
}

export function loadDemoSession(
  storage: Pick<ReadWriteStorage, "getItem" | "removeItem">,
): DemoSession | undefined {
  const raw = storage.getItem(DEMO_SESSION_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    const parsed = demoSessionSchema.safeParse(JSON.parse(raw) as unknown);
    if (parsed.success) return parsed.data;
  } catch {}
  storage.removeItem(DEMO_SESSION_STORAGE_KEY);
  return undefined;
}
