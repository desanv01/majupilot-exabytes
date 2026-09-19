import type { CoreAnswers } from "@/domain/assessment";
import { followUpProposalSchema, type FollowUpIntent, type FollowUpProposal } from "@/domain/ai-execution";

type Candidate = Omit<FollowUpProposal, "question" | "evidenceRefs"> & { priority: number; question: string };

const candidates = (answers: CoreAnswers): Partial<Record<FollowUpIntent, Candidate>> => ({
  manual_hours: answers.q3.manualHoursPerWeek === null ? { priority: 100, intent: "manual_hours", question: "About how many staff hours per week does this manual workflow take?", whyItMatters: "This input materially changes the operational value and ROI range.", expectedAnswerType: "number" } : undefined,
  customer_record_location: ["lead_generation", "customer_management"].includes(answers.q3.biggestChallenge) && ["not_used", "informal", "unknown"].includes(answers.q2.crm) ? { priority: 90, intent: "customer_record_location", question: "Where are customer records and follow-ups kept today?", whyItMatters: "This changes CRM migration complexity and the safest implementation sequence.", expectedAnswerType: "choice", allowedValues: ["spreadsheets", "messaging_apps", "accounting_system", "paper", "multiple_places"] } : undefined,
  backup_frequency: ["not_used", "unknown"].includes(answers.q2.backup) || answers.q4.highestConcern === "security" ? { priority: 80, intent: "backup_frequency", question: "How often is business-critical data backed up?", whyItMatters: "This changes continuity risk and the urgency of protection work.", expectedAnswerType: "choice", allowedValues: ["none", "ad_hoc", "weekly", "daily", "managed"] } : undefined,
  sales_channel: answers.q2.websiteOrStore === "active" || ["acquire_customers", "increase_revenue"].includes(answers.q4.primaryObjective) ? { priority: 70, intent: "sales_channel", question: "Which channel currently produces most sales or qualified enquiries?", whyItMatters: "This changes which growth capability and measurement path should come first.", expectedAnswerType: "choice", allowedValues: ["physical_only", "social_messaging", "marketplace", "own_website", "multiple"] } : undefined,
  ai_usage: ["informal", "active"].includes(answers.q2.aiTools) ? { priority: 60, intent: "ai_usage", question: "What is the main business task for which AI is already used?", whyItMatters: "This separates experimentation from a governed, repeatable AI workflow.", expectedAnswerType: "short_text" } : undefined,
  change_barrier: Object.values(answers.q5).some((value) => value !== null && value <= 2) || ["adoption", "disruption"].includes(answers.q4.highestConcern) ? { priority: 50, intent: "change_barrier", question: "What is the biggest barrier to staff adopting a new workflow?", whyItMatters: "This changes adoption risk, training needs, and implementation sequencing.", expectedAnswerType: "choice", allowedValues: ["time", "skills", "leadership_alignment", "employee_resistance", "unclear_value", "other"] } : undefined,
  roi_revenue_input: ["increase_revenue", "acquire_customers", "improve_retention"].includes(answers.q4.primaryObjective) ? { priority: 40, intent: "roi_revenue_input", question: "What monthly revenue value should be used as the baseline for this opportunity?", whyItMatters: "A confirmed baseline is required before revenue opportunity can be estimated.", expectedAnswerType: "number" } : undefined,
  roi_risk_input: answers.q3.biggestChallenge === "security_continuity" || answers.q4.highestConcern === "security" ? { priority: 30, intent: "roi_risk_input", question: "What direct financial impact should be tested for one serious disruption?", whyItMatters: "A confirmed impact is required before avoided-risk value can be estimated.", expectedAnswerType: "number" } : undefined,
});

export function selectHighestImpactUnknown(answers: CoreAnswers, answered: FollowUpIntent[], evidenceRefs: string[]): FollowUpProposal | null {
  const answeredSet = new Set(answered);
  const selected = Object.values(candidates(answers))
    .filter((candidate): candidate is Candidate => Boolean(candidate) && !answeredSet.has(candidate.intent))
    .sort((left, right) => right.priority - left.priority || left.intent.localeCompare(right.intent))[0];
  if (!selected) return null;
  return followUpProposalSchema.parse({
    intent: selected.intent,
    question: selected.question,
    whyItMatters: selected.whyItMatters,
    expectedAnswerType: selected.expectedAnswerType,
    ...(selected.allowedValues ? { allowedValues: selected.allowedValues } : {}),
    evidenceRefs,
  });
}

export function validateModelProposal(modelValue: unknown, authoritative: FollowUpProposal): FollowUpProposal {
  const parsed = followUpProposalSchema.parse(modelValue);
  if (parsed.intent !== authoritative.intent || parsed.expectedAnswerType !== authoritative.expectedAnswerType) throw new Error("authoritative_follow_up_mismatch");
  if (JSON.stringify(parsed.allowedValues ?? []) !== JSON.stringify(authoritative.allowedValues ?? [])) throw new Error("authoritative_allowed_values_mismatch");
  if (parsed.evidenceRefs.some((reference) => !authoritative.evidenceRefs.includes(reference))) throw new Error("unsupported_evidence_reference");
  return parsed;
}
