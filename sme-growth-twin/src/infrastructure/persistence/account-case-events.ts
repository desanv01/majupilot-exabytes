export const ACCOUNT_CASE_LOCAL_CHANGE_EVENT = "majupilot:account-case-local-change";

export function notifyAccountCaseLocalChange(storage: object) {
  if (typeof window !== "undefined" && storage === window.localStorage) window.dispatchEvent(new Event(ACCOUNT_CASE_LOCAL_CHANGE_EVENT));
}
