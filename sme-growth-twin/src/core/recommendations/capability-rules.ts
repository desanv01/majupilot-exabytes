import type { BusinessTwin } from "@/domain/business-twin";
import type { DiagnosticResult, PainPointResult } from "@/domain/scoring";
import {
  capabilityDefinitionSchema,
  type CapabilityDefinition,
  type CapabilityRecommendation,
  type ComponentScores,
  type GapId,
} from "@/domain/recommendations";

export const RECOMMENDATION_WEIGHTS = {
  painPointFit: 0.3,
  prerequisiteReadiness: 0.2,
  budgetFit: 0.15,
  timeToValue: 0.15,
  riskFit: 0.1,
  dataReadiness: 0.1,
} as const;

export const PREREQUISITE_SCORE = { met: 100, partial: 60, unknown: 25, unmet: 0 } as const;
export const BUDGET_CAPACITY = { under_5k: 1, "5k_15k": 2, "15k_50k": 3, "50k_plus": 4, unknown: 2 } as const;
export const PACE_CAPACITY = { within_30_days: 1, "1_3_months": 2, "3_6_months": 3, "6_12_months": 4 } as const;

export const CAPABILITY_DEFINITIONS: readonly CapabilityDefinition[] = [
  {
    id: "shared_customer_operations",
    title: "Shared customer operations",
    outcome: "Create one shared customer record and a consistent follow-up process.",
    expectedImpact: "Clearer ownership of enquiries, customer history, and follow-up across the team.",
    primaryGapIds: ["crm", "data_foundation"], supportingGapIds: ["workflow_automation"], costTier: 2, effortTier: 2,
    applicableObjectives: ["increase_revenue", "acquire_customers", "improve_retention", "increase_productivity"],
    risks: ["Adoption", "Data quality"], prerequisiteRules: [], defaultRoadmapPhase: "Connect",
  },
  {
    id: "protected_business_continuity",
    title: "Protected business continuity",
    outcome: "Strengthen backup, recovery, and core protection for day-to-day operations.",
    expectedImpact: "More dependable recovery and clearer protection management when disruption occurs.",
    primaryGapIds: ["backup_recovery", "cybersecurity"], supportingGapIds: [], costTier: 1, effortTier: 1,
    applicableObjectives: ["strengthen_resilience", "increase_productivity"],
    risks: ["Security", "Operational ownership"], prerequisiteRules: [], defaultRoadmapPhase: "Foundation",
  },
  {
    id: "professional_team_collaboration",
    title: "Professional team collaboration",
    outcome: "Standardise business communication, shared files, and everyday teamwork.",
    expectedImpact: "More consistent communication, knowledge sharing, and coordination across the team.",
    primaryGapIds: ["business_email", "cloud_productivity"], supportingGapIds: ["process_standardization"], costTier: 1, effortTier: 1,
    applicableObjectives: ["increase_productivity", "reduce_cost", "increase_revenue"],
    risks: ["Adoption", "Change management"], prerequisiteRules: [], defaultRoadmapPhase: "Foundation",
  },
  {
    id: "measurable_digital_growth",
    title: "Measurable digital growth",
    outcome: "Establish an owned digital entry point and connect growth activity to measurement.",
    expectedImpact: "A more dependable foundation for attracting demand and learning what activity works.",
    primaryGapIds: ["digital_presence", "marketing_measurement"], supportingGapIds: ["analytics"], costTier: 1, effortTier: 1,
    applicableObjectives: ["increase_revenue", "acquire_customers"],
    risks: ["Content ownership", "Measurement discipline"], prerequisiteRules: [], defaultRoadmapPhase: "Connect",
  },
  {
    id: "protected_web_presence",
    title: "Protected web presence",
    outcome: "Add focused protection and performance controls around an active website or store.",
    expectedImpact: "A better protected customer-facing web foundation with clearer operational controls.",
    primaryGapIds: ["cybersecurity"], supportingGapIds: ["digital_presence"], costTier: 2, effortTier: 2,
    applicableObjectives: ["strengthen_resilience", "increase_revenue", "acquire_customers"],
    risks: ["Security", "Configuration"], prerequisiteRules: ["active_web_presence"], defaultRoadmapPhase: "Connect",
  },
  {
    id: "scalable_cloud_operations",
    title: "Scalable cloud operations",
    outcome: "Prepare production infrastructure to scale with evidenced workload needs.",
    expectedImpact: "A managed infrastructure path aligned to explicit production capacity and scaling requirements.",
    primaryGapIds: ["infrastructure_scaling"], supportingGapIds: ["process_standardization"], costTier: 4, effortTier: 4,
    applicableObjectives: ["increase_productivity", "increase_revenue"],
    risks: ["Complexity", "Migration"], prerequisiteRules: ["explicit_scaling_need", "leadership_3"], defaultRoadmapPhase: "Optimize",
  },
  {
    id: "governed_ai_automation",
    title: "Governed AI automation",
    outcome: "Introduce bounded AI automation after data, process, and leadership foundations are ready.",
    expectedImpact: "A safer path to task-specific AI use with clearer governance and operational ownership.",
    primaryGapIds: ["ai_governance"], supportingGapIds: ["workflow_automation"], costTier: 3, effortTier: 3,
    applicableObjectives: ["launch_ai_capability", "increase_productivity"],
    risks: ["Governance", "Data quality", "Adoption"], prerequisiteRules: ["ai_readiness_60", "data_3", "process_3", "leadership_3"], defaultRoadmapPhase: "Optimize",
  },
].map((definition) => capabilityDefinitionSchema.parse(definition));

const round1 = (value: number) => Math.round(value * 10) / 10;
const capabilityState = (twin: BusinessTwin, id: string) => twin.capabilities.find((item) => item.capabilityId === id)?.currentState;
const evidenceIds = (twin: BusinessTwin, ...refs: string[]) => twin.evidence.filter((item) => refs.includes(item.sourceRef)).map((item) => item.id);
const challenge = (twin: BusinessTwin) => twin.processes[0]?.painSignals[0] ?? "";

type GapState = "not_used" | "informal" | "active" | "unknown";
function readinessState(value: number | null): GapState {
  if (value === null) return "unknown";
  if (value <= 2) return "not_used";
  if (value === 3) return "informal";
  return "active";
}

export function assessedGapState(twin: BusinessTwin, gapId: GapId): GapState | undefined {
  const map: Partial<Record<GapId, () => GapState | undefined>> = {
    crm: () => capabilityState(twin, "crm"),
    data_foundation: () => readinessState(twin.readiness.data),
    backup_recovery: () => capabilityState(twin, "backup"),
    cybersecurity: () => capabilityState(twin, "cybersecurityControls"),
    business_email: () => capabilityState(twin, "businessEmail"),
    cloud_productivity: () => capabilityState(twin, "cloudProductivity"),
    process_standardization: () => readinessState(twin.readiness.process),
    digital_presence: () => capabilityState(twin, "websiteOrStore"),
    marketing_measurement: () => capabilityState(twin, "digitalMarketingAnalytics"),
    analytics: () => capabilityState(twin, "digitalMarketingAnalytics"),
    infrastructure_scaling: () => challenge(twin) === "scaling_operations" ? "not_used" : "active",
    ai_governance: () => capabilityState(twin, "aiTools"),
  };
  return map[gapId]?.() as GapState | undefined;
}

const gapEvidenceRefs: Partial<Record<GapId, string[]>> = {
  crm: ["q2.crm"], data_foundation: ["q5.usableData"], workflow_automation: ["q3.manualHoursPerWeek", "fu_manual_hours"],
  backup_recovery: ["q2.backup", "fu_backup_frequency"], cybersecurity: ["q2.cybersecurityControls"], business_email: ["q2.businessEmail"],
  cloud_productivity: ["q2.cloudProductivity"], process_standardization: ["q5.processConsistency"], digital_presence: ["q2.websiteOrStore"],
  marketing_measurement: ["q2.digitalMarketingAnalytics"], analytics: ["q2.digitalMarketingAnalytics", "q5.usableData"],
  infrastructure_scaling: ["q3.biggestChallenge", "q5.leadershipSponsorship"], ai_governance: ["q2.aiTools", "q5.usableData", "q5.processConsistency", "q5.leadershipSponsorship"],
};

function painMatches(pain: PainPointResult, gaps: readonly GapId[]) {
  return pain.affectedCapabilityIds.some((id) => gaps.includes(id as GapId));
}

export function generateCapabilityCandidates(twin: BusinessTwin, diagnostic: DiagnosticResult, definitions = CAPABILITY_DEFINITIONS) {
  return definitions.filter((definition) => {
    const assessedPrimaryStates = definition.primaryGapIds.map((gap) => assessedGapState(twin, gap)).filter((state): state is GapState => state !== undefined);
    if (assessedPrimaryStates.length > 0 && assessedPrimaryStates.every((state) => state === "active")) return false;
    const primaryPain = diagnostic.painPoints.some((pain) => painMatches(pain, definition.primaryGapIds));
    const directGap = definition.primaryGapIds.some((gap) => {
      const state = assessedGapState(twin, gap);
      return state !== undefined && state !== "active";
    });
    if (definition.id === "protected_web_presence") {
      return capabilityState(twin, "websiteOrStore") === "active" && (primaryPain || directGap);
    }
    if (definition.id === "scalable_cloud_operations") return challenge(twin) === "scaling_operations";
    if (definition.id === "governed_ai_automation") {
      return primaryPain || directGap || (capabilityState(twin, "aiTools") === "not_used" && (diagnostic.aiReadiness.value ?? 0) < 60);
    }
    return primaryPain || directGap;
  });
}

export function calculateBudgetFit(capacity: number, tier: number) {
  const difference = tier - capacity;
  return difference <= 0 ? 100 : difference === 1 ? 65 : difference === 2 ? 30 : 0;
}

export function calculateTimeToValue(capacity: number, tier: number) {
  const difference = tier - capacity;
  return difference <= 0 ? 100 : difference === 1 ? 70 : 35;
}

const readinessPoints = (value: number | null) => value === null ? 25 : [0, 0, 25, 50, 75, 100][value];

function prerequisites(definition: CapabilityDefinition, twin: BusinessTwin, diagnostic: DiagnosticResult) {
  const rules = {
    active_web_presence: { label: "Active website or online store", value: capabilityState(twin, "websiteOrStore"), met: capabilityState(twin, "websiteOrStore") === "active", unknown: capabilityState(twin, "websiteOrStore") === "unknown", refs: ["q2.websiteOrStore"], unlock: "Establish and confirm an active website or online store first." },
    explicit_scaling_need: { label: "Explicit production infrastructure or scaling need", value: challenge(twin), met: challenge(twin) === "scaling_operations", unknown: false, refs: ["q3.biggestChallenge"], unlock: "Document a production infrastructure or scaling requirement first." },
    ai_readiness_60: { label: "AI readiness of at least 60", value: diagnostic.aiReadiness.value, met: (diagnostic.aiReadiness.value ?? -1) >= 60, unknown: diagnostic.aiReadiness.value === null, refs: ["q5.leadershipSponsorship", "q5.usableData", "q5.employeeDigitalSkills", "q5.processConsistency"], unlock: "Raise the assessed AI readiness score to at least 60." },
    data_3: { label: "Usable data readiness of at least 3", value: twin.readiness.data, met: (twin.readiness.data ?? -1) >= 3, unknown: twin.readiness.data === null, refs: ["q5.usableData"], unlock: "Improve and reassess usable data readiness to at least 3 of 5." },
    process_3: { label: "Process consistency of at least 3", value: twin.readiness.process, met: (twin.readiness.process ?? -1) >= 3, unknown: twin.readiness.process === null, refs: ["q5.processConsistency"], unlock: "Standardise the target process and reassess it at 3 of 5 or higher." },
    leadership_3: { label: "Leadership sponsorship of at least 3", value: twin.readiness.leadership, met: (twin.readiness.leadership ?? -1) >= 3, unknown: twin.readiness.leadership === null, refs: ["q5.leadershipSponsorship"], unlock: "Confirm accountable leadership sponsorship at 3 of 5 or higher." },
  } as const;
  return definition.prerequisiteRules.map((ruleId) => {
    const rule = rules[ruleId as keyof typeof rules];
    const status = rule.unknown ? "unknown" as const : rule.met ? "met" as const : "unmet" as const;
    return { ruleId, label: rule.label, status, hard: true, explanation: status === "met" ? `${rule.label} is evidenced and meets the rule.` : status === "unknown" ? `${rule.label} is unknown, so the rule fails closed.` : `${rule.label} does not yet meet the rule.`, unlockAction: rule.unlock, evidenceIds: evidenceIds(twin, ...rule.refs) };
  });
}

function painPointFit(definition: CapabilityDefinition, twin: BusinessTwin, diagnostic: DiagnosticResult) {
  const primary = diagnostic.painPoints.filter((pain) => painMatches(pain, definition.primaryGapIds)).map((pain) => pain.priority);
  const supporting = diagnostic.painPoints.filter((pain) => painMatches(pain, definition.supportingGapIds)).map((pain) => pain.priority * 0.7);
  const direct = definition.primaryGapIds.map((gap) => ({ not_used: 60, informal: 40, unknown: 20, active: 0 }[assessedGapState(twin, gap) ?? "active"]));
  return round1(Math.max(0, ...primary, ...supporting, ...direct));
}

function riskFit(definition: CapabilityDefinition, twin: BusinessTwin, budgetFit: number) {
  const concern = twin.constraints.concerns[0];
  if (concern === "cost") return budgetFit;
  if (concern === "complexity" || concern === "disruption") return ({ 1: 100, 2: 80, 3: 55, 4: 30 } as const)[definition.effortTier as 1 | 2 | 3 | 4];
  if (concern === "security") return ["protected_business_continuity", "protected_web_presence"].includes(definition.id) ? 100 : 70;
  if (concern === "adoption") return twin.readiness.changeWillingness === null ? 50 : twin.readiness.changeWillingness * 20;
  return 70;
}

function dataReadiness(definition: CapabilityDefinition, twin: BusinessTwin) {
  const mapped = readinessPoints(twin.readiness.data);
  if (definition.id === "shared_customer_operations") return Math.max(50, mapped);
  if (definition.id === "measurable_digital_growth" || definition.id === "governed_ai_automation") return mapped;
  return 100;
}

export function calculateFitScore(components: ComponentScores) {
  return round1(Object.entries(RECOMMENDATION_WEIGHTS).reduce((sum, [key, weight]) => sum + components[key as keyof ComponentScores] * weight, 0));
}

export function selectCapabilityRecommendations(twin: BusinessTwin, diagnostic: DiagnosticResult, definitions = CAPABILITY_DEFINITIONS): CapabilityRecommendation[] {
  const capacity = BUDGET_CAPACITY[twin.constraints.budgetBand as keyof typeof BUDGET_CAPACITY] ?? BUDGET_CAPACITY.unknown;
  const pace = PACE_CAPACITY[twin.constraints.implementationPace as keyof typeof PACE_CAPACITY] ?? 1;
  const candidates = generateCapabilityCandidates(twin, diagnostic, definitions).map((definition) => {
    const checks = prerequisites(definition, twin, diagnostic);
    const prerequisiteReadiness = checks.length ? round1(checks.reduce((sum, check) => sum + PREREQUISITE_SCORE[check.status], 0) / checks.length) : 100;
    const budgetFit = calculateBudgetFit(capacity, definition.costTier);
    const components: ComponentScores = {
      painPointFit: painPointFit(definition, twin, diagnostic), prerequisiteReadiness, budgetFit,
      timeToValue: calculateTimeToValue(pace, definition.effortTier), riskFit: riskFit(definition, twin, budgetFit), dataReadiness: dataReadiness(definition, twin),
    };
    const addressed = diagnostic.painPoints.filter((pain) => painMatches(pain, [...definition.primaryGapIds, ...definition.supportingGapIds]));
    const refs = [...definition.primaryGapIds, ...definition.supportingGapIds].flatMap((gap) => gapEvidenceRefs[gap] ?? []);
    const hardFailure = checks.some((check) => check.hard && check.status !== "met") || budgetFit < 50;
    const blockers = checks.filter((check) => check.status !== "met").map((check) => check.label);
    return {
      rank: 0, capabilityId: definition.id, title: definition.title, outcome: definition.outcome,
      fitScore: calculateFitScore(components), componentScores: components, status: hardFailure ? "why_later" as const : "next" as const,
      whySelected: addressed.length ? `Selected because it addresses ${addressed.map((pain) => pain.title.toLowerCase()).join("; ")}.` : "Selected from a directly assessed capability gap.",
      whyNowOrLater: hardFailure ? `Sequence this later. ${blockers.length ? `First address: ${blockers.join(", ")}.` : "Its relative cost does not fit the current budget capacity."}` : "The current evidence, capacity, and timing support this as an eligible next step.",
      addressedPainPointIds: addressed.map((pain) => pain.id),
      evidenceIds: [...new Set([...addressed.flatMap((pain) => pain.evidenceIds), ...evidenceIds(twin, ...refs), ...checks.flatMap((check) => check.evidenceIds)])],
      prerequisites: checks, expectedImpact: definition.expectedImpact, effortTier: definition.effortTier, relativeCostTier: definition.costTier,
      timeToValueTier: definition.effortTier, risks: definition.risks, roadmapPhase: hardFailure ? "Optimize" as const : definition.defaultRoadmapPhase,
      alternativeOfferingIds: [],
      highestPainPriority: Math.max(0, ...addressed.map((pain) => pain.priority)),
    };
  });
  candidates.sort((a, b) => Number(a.status === "why_later") - Number(b.status === "why_later") || b.fitScore - a.fitScore || b.highestPainPriority - a.highestPainPriority || a.capabilityId.localeCompare(b.capabilityId));
  let whyNowCount = 0;
  return candidates.map(({ highestPainPriority: _highestPainPriority, ...item }, index) => {
    void _highestPainPriority;
    const whyNow = item.status !== "why_later" && item.fitScore >= 70 && whyNowCount < 3;
    if (whyNow) whyNowCount += 1;
    return { ...item, rank: index + 1, status: whyNow ? "why_now" : item.status, whyNowOrLater: whyNow ? "This is one of the three highest eligible capabilities with a fit score of at least 70." : item.whyNowOrLater };
  });
}
