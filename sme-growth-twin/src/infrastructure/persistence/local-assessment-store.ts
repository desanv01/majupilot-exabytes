import {
  ASSESSMENT_SCHEMA_VERSION,
  assessmentDraftSchema,
  type AssessmentDraft,
} from "@/domain/assessment";

export const ASSESSMENT_STORAGE_KEY =
  "sme-growth-twin:assessment-draft:1.0.0";

export type LoadResult =
  | { status: "empty" }
  | { status: "ok"; draft: AssessmentDraft }
  | { status: "discarded"; reason: "corrupt" | "incompatible" };

export function loadAssessmentDraft(
  storage: Pick<Storage, "getItem" | "removeItem">,
): LoadResult {
  const raw = storage.getItem(ASSESSMENT_STORAGE_KEY);
  if (!raw) return { status: "empty" };

  try {
    const json: unknown = JSON.parse(raw);
    const result = assessmentDraftSchema.safeParse(json);
    if (result.success) return { status: "ok", draft: result.data };

    storage.removeItem(ASSESSMENT_STORAGE_KEY);
    const version =
      typeof json === "object" && json !== null && "schemaVersion" in json
        ? json.schemaVersion
        : undefined;
    return {
      status: "discarded",
      reason:
        version !== undefined && version !== ASSESSMENT_SCHEMA_VERSION
          ? "incompatible"
          : "corrupt",
    };
  } catch {
    storage.removeItem(ASSESSMENT_STORAGE_KEY);
    return { status: "discarded", reason: "corrupt" };
  }
}

export function saveAssessmentDraft(
  storage: Pick<Storage, "setItem">,
  draft: AssessmentDraft,
) {
  const validated = assessmentDraftSchema.parse(draft);
  storage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(validated));
}

export function clearAssessmentDraft(
  storage: Pick<Storage, "removeItem">,
) {
  storage.removeItem(ASSESSMENT_STORAGE_KEY);
}
