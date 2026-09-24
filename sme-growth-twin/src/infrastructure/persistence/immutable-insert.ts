import { canonicalJson } from "@/core/reports/canonical-json";

export const immutableInsertMatches = (existing: Record<string, unknown>, expected: Record<string, unknown>) =>
  Object.entries(expected).every(([key, value]) => value === undefined || canonicalJson(existing[key]) === canonicalJson(value));
