import type {
  AiUsageValue,
  AssessmentDraft,
  CoreAnswers,
  FollowUpAnswers,
  FollowUpId,
} from "@/domain/assessment";

export const FOLLOW_UPS: Record<
  FollowUpId,
  { priority: number; whyWeAsk: string }
> = {
  fu_manual_hours: {
    priority: 100,
    whyWeAsk: "This materially affects later pain and ROI estimates.",
  },
  fu_customer_records: {
    priority: 90,
    whyWeAsk: "This changes the likely CRM need and migration complexity.",
  },
  fu_backup_frequency: {
    priority: 80,
    whyWeAsk: "This changes continuity and security urgency.",
  },
  fu_sales_channel: {
    priority: 70,
    whyWeAsk: "This changes commerce and marketing capability needs.",
  },
  fu_ai_usage: {
    priority: 60,
    whyWeAsk: "This separates experimentation from governed adoption.",
  },
  fu_change_barrier: {
    priority: 50,
    whyWeAsk: "This changes adoption risk and implementation sequencing.",
  },
};

export function selectFollowUps(answers: CoreAnswers): FollowUpId[] {
  const ids: FollowUpId[] = [];

  if (answers.q3.manualHoursPerWeek === null) ids.push("fu_manual_hours");
  if (
    ["lead_generation", "customer_management"].includes(
      answers.q3.biggestChallenge,
    ) &&
    ["not_used", "informal", "unknown"].includes(answers.q2.crm)
  ) {
    ids.push("fu_customer_records");
  }
  if (
    ["not_used", "unknown"].includes(answers.q2.backup) ||
    answers.q4.highestConcern === "security"
  ) {
    ids.push("fu_backup_frequency");
  }
  if (
    answers.q2.websiteOrStore === "active" ||
    ["acquire_customers", "increase_revenue"].includes(
      answers.q4.primaryObjective,
    )
  ) {
    ids.push("fu_sales_channel");
  }
  if (["informal", "active"].includes(answers.q2.aiTools)) {
    ids.push("fu_ai_usage");
  }
  if (
    Object.values(answers.q5).some((value) => value !== null && value <= 2) ||
    ["adoption", "disruption"].includes(answers.q4.highestConcern)
  ) {
    ids.push("fu_change_barrier");
  }

  return [...new Set(ids)]
    .sort(
      (left, right) =>
        FOLLOW_UPS[right].priority - FOLLOW_UPS[left].priority ||
        left.localeCompare(right),
    )
    .slice(0, 3);
}

export function reconcileFollowUpAnswers(
  selectedIds: FollowUpId[],
  previousAnswers: FollowUpAnswers,
): FollowUpAnswers {
  return Object.fromEntries(
    selectedIds.flatMap((id) =>
      previousAnswers[id] === undefined ? [] : [[id, previousAnswers[id]]],
    ),
  ) as FollowUpAnswers;
}

export function toggleAiUsageAnswer(
  current: AiUsageValue[],
  selected: AiUsageValue,
): AiUsageValue[] {
  if (selected === "unknown") {
    return current.includes("unknown") ? [] : ["unknown"];
  }

  const concrete = current.filter((value) => value !== "unknown");
  return concrete.includes(selected)
    ? concrete.filter((value) => value !== selected)
    : [...concrete, selected];
}

export function completeCoreAssessment(
  draft: AssessmentDraft,
  answers: CoreAnswers,
  updatedAt: string,
): AssessmentDraft {
  const selectedFollowUpIds = selectFollowUps(answers);
  return {
    ...draft,
    answers,
    currentStep: 6,
    status:
      selectedFollowUpIds.length === 0 ? "ready_for_review" : "in_progress",
    selectedFollowUpIds,
    followUpAnswers: reconcileFollowUpAnswers(
      selectedFollowUpIds,
      draft.followUpAnswers,
    ),
    updatedAt,
  };
}

export function completeFollowUps(
  draft: AssessmentDraft,
  updatedAt: string,
): AssessmentDraft {
  return { ...draft, status: "ready_for_review", updatedAt };
}

export function beginTwinEdit(
  draft: AssessmentDraft,
  step: number,
  updatedAt: string,
): AssessmentDraft {
  return {
    ...draft,
    currentStep: step,
    status: "in_progress",
    twinRevision: draft.twinRevision + 1,
    updatedAt,
  };
}
