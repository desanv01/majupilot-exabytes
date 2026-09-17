import { coreAnswersSchema, type AssessmentDraft } from "@/domain/assessment";
import type { BusinessTwin } from "@/domain/business-twin";

import { buildBusinessTwin } from "./build-business-twin";

export function rebuildCurrentTwin(draft: AssessmentDraft): BusinessTwin {
  const answers = coreAnswersSchema.parse(draft.answers);
  let sequence = 0;
  return buildBusinessTwin(
    {
      sessionId: draft.sessionId,
      answers,
      selectedFollowUpIds: draft.selectedFollowUpIds,
      followUpAnswers: draft.followUpAnswers,
      revision: draft.twinRevision,
    },
    {
      now: () => draft.updatedAt,
      id: (kind) => `${kind}_current${String(++sequence).padStart(4, "0")}`,
    },
  );
}
