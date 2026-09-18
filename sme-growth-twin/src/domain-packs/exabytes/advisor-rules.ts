import { ADVISOR_MODEL_VERSION, advisorDefinitionSchema, advisorReviewSchema, type AdvisorDefinition, type AdvisorId, type AdvisorReview, type AdvisorReviewContext } from "@/domain/advisors";

export const EXABYTES_ADVISORS_1_0_0: readonly AdvisorDefinition[] = [
  { id: "growth", label: "Growth advisor", objective: "Measurable acquisition, conversion, and retention", lens: ["customer value", "measurement gaps", "growth prerequisites"] },
  { id: "operations", label: "Operations advisor", objective: "Stable, lower-friction workflows", lens: ["process readiness", "dependencies", "ownership", "operational load"] },
  { id: "finance", label: "Finance advisor", objective: "Protect cash flow and assumption quality", lens: ["budget fit", "payback", "missing value streams", "phased commitment"] },
  { id: "cybersecurity", label: "Cybersecurity advisor", objective: "Reduce exposure and improve recovery", lens: ["security dependencies", "continuity", "recovery evidence", "accountable ownership"] },
  { id: "change", label: "Change advisor", objective: "Maximize adoption and delivery capacity", lens: ["sequencing load", "training", "ownership", "employee adoption"] },
].map((item) => advisorDefinitionSchema.parse(item));

const exactRef = (context: AdvisorReviewContext, reference: string) => context.evidenceAllowList.includes(reference) ? reference : undefined;
const requiredRef = (context: AdvisorReviewContext, reference: string) => { const found = exactRef(context, reference); if (!found) throw new Error(`Missing required review reference: ${reference}`); return found; };
const compactRefs = (...values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))];
const finding = (advisor: AdvisorId, suffix: string, topic: string, statement: string, evidenceRefs: string[]) => ({ id: `${advisor}-${suffix}`, topic, statement, evidenceRefs, claimSource: "deterministic_fallback" as const });
const adjustment = (advisor: AdvisorId, suffix: string, topic: string, action: string, targetRef: string, evidenceRefs: string[]) => ({ id: `${advisor}-${suffix}`, topic, action, targetRef, evidenceRefs, claimSource: "deterministic_fallback" as const });
const moneyRange = (range: { low: number; base: number; high: number }) => `RM${range.low}/RM${range.base}/RM${range.high}`;

export function buildExabytesFallbackReview(definition: AdvisorDefinition, context: AdvisorReviewContext, reviewId: string): AdvisorReview {
  const selected = context.selectedScenario; const scenario = requiredRef(context, `scenario:${selected.id}`);
  const comparison = context.evidenceAllowList.find((item) => item.startsWith("comparison:")); const diagnostic = context.evidenceAllowList.find((item) => item.startsWith("diagnostic:"));
  const selectedIds = new Set(selected.interventions.map((item) => item.capabilityId));
  const cap = (capabilityId: string) => selectedIds.has(capabilityId) ? exactRef(context, `capability:${capabilityId}`) : undefined;
  const assumption = (key: string) => exactRef(context, `assumption:${key}`);
  const common = finding(definition.id, "governance", "delivery_governance", "The selected plan needs explicit ownership and measurable checkpoints throughout delivery.", [scenario]);
  const committed = selected.interventions.filter((item) => item.commitment === "committed"); const conditional = selected.interventions.filter((item) => item.commitment === "conditional");
  const revenueRange = selected.values.revenue.status === "estimated" ? selected.values.revenue.range : undefined; const riskRange = selected.values.avoidedRisk.status === "estimated" ? selected.values.avoidedRisk.range : undefined;
  const revenueEstimated = Boolean(revenueRange); const riskEstimated = Boolean(riskRange);
  const customerOps = cap("shared_customer_operations"); const continuity = cap("protected_business_continuity"); const webProtection = cap("protected_web_presence");
  const budgetStatement: Record<string, string> = { within_range: "The full modeled first-year cost range is within the stated budget band.", base_within: "The base first-year cost is within the stated budget band, while the high case is not.", only_low_within: "Only the low first-year cost case is within the stated budget band.", over: "The modeled first-year cost range is above the stated budget band.", unknown: "Budget fit cannot be confirmed because the budget band is unknown." };
  const missingStreams = [!revenueEstimated ? "revenue" : undefined, !riskEstimated ? "avoided risk" : undefined].filter((value): value is string => Boolean(value));
  const paybackText = selected.payback.status === "estimated" ? `Base payback is ${selected.payback.base} months.` : "Payback is not estimated.";

  const rules: Record<AdvisorId, Omit<AdvisorReview, "id" | "advisor" | "origin" | "sourceRef">> = {
    growth: {
      position: "support_with_conditions", headline: customerOps ? (revenueEstimated ? "Customer operations has a quantified growth-value range to validate." : "Customer operations can support growth once value measurement is supplied.") : (revenueEstimated ? "The selected plan has quantified revenue assumptions that require measurement checkpoints." : "Growth value remains conditional on missing revenue and conversion evidence."), confidence: 0.82,
      support: [...(customerOps ? [finding("growth", "customer-ops", "customer_value", "Shared customer operations is included in the selected scenario as a foundation for consistent follow-up and retention work.", compactRefs(customerOps, scenario))] : []), ...(revenueRange ? [finding("growth", "revenue-range", "value_measurement", `The selected scenario includes an estimated revenue value range of ${moneyRange(revenueRange)} for validation, not as a guarantee.`, compactRefs(scenario, assumption("addressable_revenue"), assumption("conversion_change"), assumption("gross_margin")))] : []), common],
      concerns: revenueEstimated ? [finding("growth", "validate-value", "value_measurement", "Estimated revenue value remains scenario-dependent and needs observed conversion and retention checkpoints.", [scenario])] : [finding("growth", "value-gap", "value_measurement", "Revenue and conversion contribution cannot yet be quantified from the accepted evidence.", compactRefs(assumption("addressable_revenue"), assumption("conversion_change"), scenario))],
      missingEvidence: revenueEstimated ? [] : [finding("growth", "missing-revenue", "value_measurement", "Supply addressable revenue, conversion change, and gross margin before making growth-value claims.", compactRefs(assumption("addressable_revenue"), assumption("conversion_change"), assumption("gross_margin"), scenario))],
      adjustments: [adjustment("growth", "measurement-plan", "value_measurement", "Add baseline conversion and retention checkpoints before activation and at each monthly review.", scenario, [scenario])],
    },
    operations: {
      position: "support_with_conditions", headline: selected.interventions.length ? "The dependency-aware sequence is workable with process owners in place." : "The selected scenario needs an executable intervention sequence.", confidence: 0.86,
      support: [...(selected.interventions.length ? [finding("operations", "sequence", "dependency_sequence", `The selected plan schedules ${selected.interventions.length} intervention(s), including ${committed.length} committed and ${conditional.length} conditional, with dependencies visible in the accepted sequence.`, compactRefs(scenario, comparison))] : []), common],
      concerns: context.business.readiness.process !== null && context.business.readiness.process <= 2 ? [finding("operations", "readiness", "process_readiness", "Current process consistency increases implementation and handover risk.", compactRefs(diagnostic, scenario))] : [],
      missingEvidence: [finding("operations", "missing-owner", "delivery_ownership", "Named operational owners and current process acceptance criteria are not recorded in the selected scenario.", [scenario])],
      adjustments: [adjustment("operations", "owner", "delivery_ownership", "Name one accountable owner and one completion test for every committed intervention.", scenario, [scenario])],
    },
    finance: {
      position: "support_with_conditions", headline: `${budgetStatement[selected.budgetFit] ?? `Budget fit is ${selected.budgetFit}.`} ${paybackText}`, confidence: 0.93,
      support: [finding("finance", "auditable", "assumption_quality", "The plan preserves visible low, base, and high cost and value assumptions.", compactRefs(scenario, comparison)), common],
      concerns: [finding("finance", "budget", "budget_fit", `Budget fit ${selected.budgetFit}: ${budgetStatement[selected.budgetFit] ?? `Budget fit is ${selected.budgetFit}.`} ${paybackText}${missingStreams.length ? ` ${missingStreams.join(" and ")} remain unestimated.` : " Revenue and avoided-risk ranges are estimated assumptions."}`, compactRefs(scenario, assumption("implementation_cost"), assumption("annual_recurring_cost")))],
      missingEvidence: missingStreams.length ? [finding("finance", "missing-value", "value_measurement", `${missingStreams.join(" and ")} inputs are incomplete, so those streams cannot support the commitment decision.`, compactRefs(!revenueEstimated ? assumption("addressable_revenue") : undefined, !riskEstimated ? assumption("baseline_incident_probability") : undefined, scenario))] : [],
      adjustments: [adjustment("finance", "phase", "phased_commitment", ["only_low_within", "over", "unknown"].includes(selected.budgetFit) ? "Approve the selected scenario in evidence-gated phases without changing its deterministic scope or figures." : "Retain staged approval gates and compare observed value with the accepted ranges before further commitment.", scenario, [scenario])],
    },
    cybersecurity: {
      position: "support_with_conditions", headline: continuity || webProtection ? `${[continuity ? "Continuity" : undefined, webProtection ? "web protection" : undefined].filter(Boolean).join(" and ")} are included; recovery evidence and ownership remain required.` : "The selected scenario has no dedicated continuity or web-protection intervention; security ownership remains a condition.", confidence: 0.84,
      support: [...(continuity ? [finding("cybersecurity", "continuity", "resilience", "Protected business continuity is included in the selected scenario.", compactRefs(continuity, scenario))] : []), ...(webProtection ? [finding("cybersecurity", "web-protection", "resilience", "Protected web presence is included in the selected scenario.", compactRefs(webProtection, scenario))] : []), ...(riskRange ? [finding("cybersecurity", "risk-range", "risk_measurement", `The avoided-risk range ${moneyRange(riskRange)} is explicitly modeled for validation.`, compactRefs(scenario, assumption("baseline_incident_probability"), assumption("incident_impact"), assumption("risk_reduction")))] : []), common],
      concerns: [finding("cybersecurity", "recovery", "recovery_assurance", continuity || webProtection ? "Control deployment alone does not demonstrate that recovery works under realistic conditions." : "The selected scenario does not include a dedicated continuity or web-protection intervention.", [scenario])],
      missingEvidence: riskEstimated ? [finding("cybersecurity", "test-evidence", "recovery_assurance", "A dated recovery test and accountable owner are still required before treating modeled avoided risk as observed impact.", [scenario])] : [finding("cybersecurity", "missing-risk", "risk_measurement", "Avoided-risk inputs and a dated recovery test are not recorded.", compactRefs(assumption("baseline_incident_probability"), assumption("incident_impact"), assumption("risk_reduction"), scenario))],
      adjustments: [adjustment("cybersecurity", "test", "recovery_assurance", "Schedule a recovery test and assign an accountable owner before treating continuity risk as reduced.", continuity ?? scenario, compactRefs(continuity, scenario))],
    },
    change: {
      position: "support_with_conditions", headline: `${committed.length} committed initiative${committed.length === 1 ? "" : "s"} require deliberate ownership, training, and adoption checkpoints.`, confidence: 0.88,
      support: [finding("change", "sequence", "adoption_sequence", "The month-by-month sequence makes adoption load visible and reviewable.", [scenario]), common],
      concerns: [finding("change", "load", "adoption_capacity", `${committed.length} committed and ${conditional.length} conditional initiative(s) create delivery and learning load that must be actively managed.`, [scenario])],
      missingEvidence: [finding("change", "missing-adoption", "adoption_capacity", "Named owners, training completion criteria, and adoption measures are not yet recorded.", [scenario])],
      adjustments: [adjustment("change", "checkpoints", "adoption_capacity", "Add named owners, role-based training, and monthly adoption checkpoints for each committed intervention.", scenario, [scenario])],
    },
  };
  return advisorReviewSchema.parse({ id: reviewId, advisor: definition.id, ...rules[definition.id], origin: "deterministic_fallback", sourceRef: `exabytes-advisor-rules-${ADVISOR_MODEL_VERSION}` });
}
