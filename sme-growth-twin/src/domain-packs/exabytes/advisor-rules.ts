import { ADVISOR_MODEL_VERSION, advisorDefinitionSchema, type AdvisorDefinition, type AdvisorId, type AdvisorReview, type AdvisorReviewContext } from "@/domain/advisors";

export const EXABYTES_ADVISORS_1_0_0: readonly AdvisorDefinition[] = [
  { id: "growth", label: "Growth advisor", objective: "Measurable acquisition, conversion, and retention", lens: ["customer value", "measurement gaps", "growth prerequisites"] },
  { id: "operations", label: "Operations advisor", objective: "Stable, lower-friction workflows", lens: ["process readiness", "dependencies", "ownership", "operational load"] },
  { id: "finance", label: "Finance advisor", objective: "Protect cash flow and assumption quality", lens: ["budget fit", "payback", "missing value streams", "phased commitment"] },
  { id: "cybersecurity", label: "Cybersecurity advisor", objective: "Reduce exposure and improve recovery", lens: ["security dependencies", "continuity", "recovery evidence", "accountable ownership"] },
  { id: "change", label: "Change advisor", objective: "Maximize adoption and delivery capacity", lens: ["sequencing load", "training", "ownership", "employee adoption"] },
].map((item) => advisorDefinitionSchema.parse(item));

const ref = (context: AdvisorReviewContext, prefix: string) => context.evidenceAllowList.find((item) => item.startsWith(prefix)) ?? context.evidenceAllowList[0];
const finding = (advisor: AdvisorId, suffix: string, topic: string, statement: string, evidenceRefs: string[]) => ({ id: `${advisor}-${suffix}`, topic, statement, evidenceRefs, claimSource: "deterministic_fallback" as const });
const adjustment = (advisor: AdvisorId, suffix: string, topic: string, action: string, targetRef: string, evidenceRefs: string[]) => ({ id: `${advisor}-${suffix}`, topic, action, targetRef, evidenceRefs, claimSource: "deterministic_fallback" as const });

export function buildExabytesFallbackReview(definition: AdvisorDefinition, context: AdvisorReviewContext, reviewId: string): AdvisorReview {
  const scenario = ref(context, "scenario:"); const diagnostic = ref(context, "diagnostic:"); const comparison = ref(context, "comparison:");
  const cap = (id: string) => ref(context, `capability:${id}`); const assumption = (key: string) => ref(context, `assumption:${key}`);
  const common = finding(definition.id, "governance", "delivery_governance", "The plan needs explicit ownership and measurable checkpoints throughout delivery.", [scenario]);
  const rules: Record<AdvisorId, Omit<AdvisorReview, "id" | "advisor" | "origin" | "sourceRef">> = {
    growth: {
      position: "support_with_conditions", headline: "Customer operations can support growth once value measurement is supplied.", confidence: 0.82,
      support: [finding("growth", "customer-ops", "customer_value", "Shared customer operations creates a credible foundation for consistent follow-up and retention work.", [cap("shared_customer_operations"), scenario]), common],
      concerns: [finding("growth", "value-gap", "value_measurement", "Revenue and conversion contribution cannot yet be quantified from the accepted evidence.", [assumption("addressable_revenue"), assumption("conversion_change")])],
      missingEvidence: [finding("growth", "missing-revenue", "value_measurement", "Supply addressable revenue, conversion change, and gross margin before making growth-value claims.", [assumption("addressable_revenue"), assumption("conversion_change"), assumption("gross_margin")])],
      adjustments: [adjustment("growth", "measurement-plan", "value_measurement", "Add baseline conversion and retention checkpoints before activation and at each monthly review.", scenario, [scenario])],
    },
    operations: {
      position: "support_with_conditions", headline: "The dependency-aware sequence is workable with process owners in place.", confidence: 0.86,
      support: [finding("operations", "sequence", "dependency_sequence", "The selected plan orders interventions through explicit dependencies and a twelve-month schedule.", [scenario, comparison]), common],
      concerns: [finding("operations", "readiness", "process_readiness", "Low process consistency increases implementation and handover risk.", [diagnostic, scenario])],
      missingEvidence: [finding("operations", "missing-owner", "delivery_ownership", "Named operational owners and current process acceptance criteria are not recorded.", [scenario])],
      adjustments: [adjustment("operations", "owner", "delivery_ownership", "Name one accountable owner and one completion test for every committed intervention.", scenario, [scenario])],
    },
    finance: {
      position: "support_with_conditions", headline: "Proceed in phases; the base case exceeds the stated budget band and value is incomplete.", confidence: 0.93,
      support: [finding("finance", "auditable", "assumption_quality", "The plan preserves visible low, base, and high cost and value assumptions.", [scenario, comparison]), common],
      concerns: [finding("finance", "budget", "budget_fit", `Budget fit is ${context.selectedScenario.budgetFit}; base payback is ${context.selectedScenario.payback.base ?? "not estimated"} months, while revenue and avoided risk remain unestimated.`, [scenario, assumption("implementation_cost"), assumption("annual_recurring_cost")])],
      missingEvidence: [finding("finance", "missing-value", "value_measurement", "Revenue and avoided-risk inputs are incomplete, so they cannot support the commitment decision.", [assumption("addressable_revenue"), assumption("baseline_incident_probability")])],
      adjustments: [adjustment("finance", "phase", "phased_commitment", "Approve the selected scenario in evidence-gated phases without changing its deterministic scope or figures.", scenario, [scenario])],
    },
    cybersecurity: {
      position: "support_with_conditions", headline: "Continuity and web protection are sound priorities once recovery evidence and ownership exist.", confidence: 0.84,
      support: [finding("cybersecurity", "protection", "resilience", "The plan includes continuity and web-protection work that directly addresses current exposure.", [cap("protected_business_continuity"), cap("protected_web_presence"), scenario]), common],
      concerns: [finding("cybersecurity", "recovery", "recovery_assurance", "Control deployment alone does not demonstrate that recovery works under realistic conditions.", [scenario])],
      missingEvidence: [finding("cybersecurity", "missing-test", "recovery_assurance", "A dated recovery test, result, and accountable owner are not recorded.", [scenario])],
      adjustments: [adjustment("cybersecurity", "test", "recovery_assurance", "Schedule a recovery test and assign an owner before treating continuity risk as reduced.", cap("protected_business_continuity"), [cap("protected_business_continuity")])],
    },
    change: {
      position: "support_with_conditions", headline: "Four committed initiatives require deliberate ownership, training, and adoption checkpoints.", confidence: 0.88,
      support: [finding("change", "sequence", "adoption_sequence", "A month-by-month sequence makes adoption load visible and reviewable.", [scenario]), common],
      concerns: [finding("change", "load", "adoption_capacity", `${context.selectedScenario.interventions.filter((item) => item.commitment === "committed").length} committed initiatives create material delivery and learning load.`, [scenario])],
      missingEvidence: [finding("change", "missing-adoption", "adoption_capacity", "Named owners, training completion criteria, and adoption measures are not yet recorded.", [scenario])],
      adjustments: [adjustment("change", "checkpoints", "adoption_capacity", "Add named owners, role-based training, and monthly adoption checkpoints for each committed initiative.", scenario, [scenario])],
    },
  };
  return { id: reviewId as AdvisorReview["id"], advisor: definition.id, ...rules[definition.id], origin: "deterministic_fallback", sourceRef: `exabytes-advisor-rules-${ADVISOR_MODEL_VERSION}` };
}
