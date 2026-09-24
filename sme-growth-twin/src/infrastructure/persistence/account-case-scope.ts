export const ACCOUNT_CASE_STORAGE_KEY = "majupilot:active-account-case:1.0.0";
export const ACCOUNT_CASE_CHANGED_EVENT = "majupilot:account-case-changed";
export type ActiveAccountCase = { organizationId: string; caseId: string; revision: number };

export function activeAccountCase(storage: Storage): ActiveAccountCase | undefined {
  try {
    const raw = storage.getItem(ACCOUNT_CASE_STORAGE_KEY);
    if (!raw) return undefined;
    const input = JSON.parse(raw) as Partial<ActiveAccountCase>;
    if (typeof input.organizationId === "string" && typeof input.caseId === "string" && Number.isInteger(input.revision) && input.revision! >= 0) return input as ActiveAccountCase;
  } catch { /* invalid local marker */ }
  storage.removeItem(ACCOUNT_CASE_STORAGE_KEY);
  return undefined;
}

export function setActiveAccountCase(storage: Storage, value: ActiveAccountCase) {
  storage.setItem(ACCOUNT_CASE_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(ACCOUNT_CASE_CHANGED_EVENT));
}
