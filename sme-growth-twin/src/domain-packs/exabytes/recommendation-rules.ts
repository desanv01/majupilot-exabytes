import type { BusinessTwin } from "@/domain/business-twin";
import type { EvidenceId } from "@/domain/ids";
import {
  capabilityDefinitionSchema,
  type CapabilityDefinition,
  type GapId,
  type RecommendationGapState,
  type RecommendationRulePack,
} from "@/domain/recommendations";

const definitions: readonly CapabilityDefinition[] = [
  {
    id: "shared_customer_operations", title: "Shared customer operations",
    outcome: "Create one shared customer record and a consistent follow-up process.",
    expectedImpact: "Clearer ownership of enquiries, customer history, and follow-up across the team.",
    primaryGapIds: ["crm", "data_foundation"], supportingGapIds: ["workflow_automation"], costTier: 2, effortTier: 2,
    applicableObjectives: ["increase_revenue", "acquire_customers", "improve_retention", "increase_productivity"],
    risks: ["Adoption", "Data quality"], prerequisiteRules: [], defaultRoadmapPhase: "Connect",
  },
  {
    id: "protected_business_continuity", title: "Protected business continuity",
    outcome: "Strengthen backup, recovery, and core protection for day-to-day operations.",
    expectedImpact: "More dependable recovery and clearer protection management when disruption occurs.",
    primaryGapIds: ["backup_recovery", "cybersecurity"], supportingGapIds: [], costTier: 1, effortTier: 1,
    applicableObjectives: ["strengthen_resilience", "increase_productivity"],
    risks: ["Security", "Operational ownership"], prerequisiteRules: [], defaultRoadmapPhase: "Foundation",
  },
  {
    id: "professional_team_collaboration", title: "Professional team collaboration",
    outcome: "Standardise business communication, shared files, and everyday teamwork.",
    expectedImpact: "More consistent communication, knowledge sharing, and coordination across the team.",
    primaryGapIds: ["business_email", "cloud_productivity"], supportingGapIds: ["process_standardization"], costTier: 1, effortTier: 1,
    applicableObjectives: ["increase_productivity", "reduce_cost", "increase_revenue"],
    risks: ["Adoption", "Change management"], prerequisiteRules: [], defaultRoadmapPhase: "Foundation",
  },
  {
    id: "measurable_digital_growth", title: "Measurable digital growth",
    outcome: "Establish an owned digital entry point and connect growth activity to measurement.",
    expectedImpact: "A more dependable foundation for attracting demand and learning what activity works.",
    primaryGapIds: ["digital_presence", "marketing_measurement"], supportingGapIds: ["analytics"], costTier: 1, effortTier: 1,
    applicableObjectives: ["increase_revenue", "acquire_customers"],
    risks: ["Content ownership", "Measurement discipline"], prerequisiteRules: [], defaultRoadmapPhase: "Connect",
  },
  {
    id: "protected_web_presence", title: "Protected web presence",
    outcome: "Add focused protection and performance controls around an active website or store.",
    expectedImpact: "A better protected customer-facing web foundation with clearer operational controls.",
    primaryGapIds: ["cybersecurity"], supportingGapIds: ["digital_presence"], costTier: 2, effortTier: 2,
    applicableObjectives: ["strengthen_resilience", "increase_revenue", "acquire_customers"],
    risks: ["Security", "Configuration"], prerequisiteRules: ["active_web_presence"], defaultRoadmapPhase: "Connect",
  },
  {
    id: "scalable_cloud_operations", title: "Scalable cloud operations",
    outcome: "Prepare production infrastructure to scale with evidenced workload needs.",
    expectedImpact: "A managed infrastructure path aligned to explicit production capacity and scaling requirements.",
    primaryGapIds: ["infrastructure_scaling"], supportingGapIds: ["process_standardization"], costTier: 4, effortTier: 4,
    applicableObjectives: ["increase_productivity", "increase_revenue"],
    risks: ["Complexity", "Migration"], prerequisiteRules: ["explicit_scaling_need", "leadership_3"], defaultRoadmapPhase: "Optimize",
  },
  {
    id: "governed_ai_automation", title: "Governed AI automation",
    outcome: "Introduce bounded AI automation after data, process, and leadership foundations are ready.",
    expectedImpact: "A safer path to task-specific AI use with clearer governance and operational ownership.",
    primaryGapIds: ["ai_governance"], supportingGapIds: ["workflow_automation"], costTier: 3, effortTier: 3,
    applicableObjectives: ["launch_ai_capability", "increase_productivity"],
    risks: ["Governance", "Data quality", "Adoption"], prerequisiteRules: ["ai_readiness_60", "data_3", "process_3", "leadership_3"], defaultRoadmapPhase: "Optimize",
  },
].map((definition) => capabilityDefinitionSchema.parse(definition));

const capabilityState = (twin: BusinessTwin, id: string) => twin.capabilities.find((item) => item.capabilityId === id)?.currentState;
const challenge = (twin: BusinessTwin) => twin.processes[0]?.painSignals[0] ?? "";
const evidenceIds = (twin: BusinessTwin, ...refs: string[]) => twin.evidence.filter((item) => refs.includes(item.sourceRef)).map((item) => item.id as EvidenceId);
const readinessState = (value: number | null): RecommendationGapState => value === null ? "unknown" : value <= 2 ? "not_used" : value === 3 ? "informal" : "active";
const readinessPoints = (value: number | null) => value === null ? 25 : [0, 0, 25, 50, 75, 100][value];

const gapStates: Partial<Record<GapId, (twin: BusinessTwin) => RecommendationGapState | undefined>> = {
  crm: (twin) => capabilityState(twin, "crm"),
  data_foundation: (twin) => readinessState(twin.readiness.data),
  backup_recovery: (twin) => capabilityState(twin, "backup"),
  cybersecurity: (twin) => capabilityState(twin, "cybersecurityControls"),
  business_email: (twin) => capabilityState(twin, "businessEmail"),
  cloud_productivity: (twin) => capabilityState(twin, "cloudProductivity"),
  process_standardization: (twin) => readinessState(twin.readiness.process),
  digital_presence: (twin) => capabilityState(twin, "websiteOrStore"),
  marketing_measurement: (twin) => capabilityState(twin, "digitalMarketingAnalytics"),
  analytics: (twin) => capabilityState(twin, "digitalMarketingAnalytics"),
  infrastructure_scaling: (twin) => challenge(twin) === "scaling_operations" ? "not_used" : "active",
  ai_governance: (twin) => capabilityState(twin, "aiTools"),
};

const evidenceRefs: Partial<Record<GapId, readonly string[]>> = {
  crm: ["q2.crm"], data_foundation: ["q5.usableData"], workflow_automation: ["q3.manualHoursPerWeek", "fu_manual_hours"],
  backup_recovery: ["q2.backup", "fu_backup_frequency"], cybersecurity: ["q2.cybersecurityControls"], business_email: ["q2.businessEmail"],
  cloud_productivity: ["q2.cloudProductivity"], process_standardization: ["q5.processConsistency"], digital_presence: ["q2.websiteOrStore"],
  marketing_measurement: ["q2.digitalMarketingAnalytics"], analytics: ["q2.digitalMarketingAnalytics", "q5.usableData"],
  infrastructure_scaling: ["q3.biggestChallenge", "q5.leadershipSponsorship"], ai_governance: ["q2.aiTools", "q5.usableData", "q5.processConsistency", "q5.leadershipSponsorship"],
};

export const EXABYTES_RECOMMENDATION_RULE_PACK_1_0_0: RecommendationRulePack = {
  definitions,
  assessedGapState: (twin, gapId) => gapStates[gapId]?.(twin),
  gapEvidenceRefs: (gapId) => evidenceRefs[gapId] ?? [],
  isCandidateEligible: (definition, twin, diagnostic, context) => {
    if (context.assessedPrimaryStates.length > 0 && context.assessedPrimaryStates.every((state) => state === "active")) return false;
    if (definition.id === "protected_web_presence") return capabilityState(twin, "websiteOrStore") === "active" && (context.primaryPainMatch || context.directGap);
    if (definition.id === "scalable_cloud_operations") return challenge(twin) === "scaling_operations";
    if (definition.id === "governed_ai_automation") return context.primaryPainMatch || context.directGap || (capabilityState(twin, "aiTools") === "not_used" && (diagnostic.aiReadiness.value ?? 0) < 60);
    return context.primaryPainMatch || context.directGap;
  },
  evaluatePrerequisites: (definition, twin, diagnostic) => {
    const rules = {
      active_web_presence: { label: "Active website or online store", met: capabilityState(twin, "websiteOrStore") === "active", unknown: capabilityState(twin, "websiteOrStore") === "unknown", refs: ["q2.websiteOrStore"], unlock: "Establish and confirm an active website or online store first." },
      explicit_scaling_need: { label: "Explicit production infrastructure or scaling need", met: challenge(twin) === "scaling_operations", unknown: false, refs: ["q3.biggestChallenge"], unlock: "Document a production infrastructure or scaling requirement first." },
      ai_readiness_60: { label: "AI readiness of at least 60", met: (diagnostic.aiReadiness.value ?? -1) >= 60, unknown: diagnostic.aiReadiness.value === null, refs: ["q5.leadershipSponsorship", "q5.usableData", "q5.employeeDigitalSkills", "q5.processConsistency"], unlock: "Raise the assessed AI readiness score to at least 60." },
      data_3: { label: "Usable data readiness of at least 3", met: (twin.readiness.data ?? -1) >= 3, unknown: twin.readiness.data === null, refs: ["q5.usableData"], unlock: "Improve and reassess usable data readiness to at least 3 of 5." },
      process_3: { label: "Process consistency of at least 3", met: (twin.readiness.process ?? -1) >= 3, unknown: twin.readiness.process === null, refs: ["q5.processConsistency"], unlock: "Standardise the target process and reassess it at 3 of 5 or higher." },
      leadership_3: { label: "Leadership sponsorship of at least 3", met: (twin.readiness.leadership ?? -1) >= 3, unknown: twin.readiness.leadership === null, refs: ["q5.leadershipSponsorship"], unlock: "Confirm accountable leadership sponsorship at 3 of 5 or higher." },
    } as const;
    return definition.prerequisiteRules.map((ruleId) => {
      const rule = rules[ruleId as keyof typeof rules];
      const status = rule.unknown ? "unknown" as const : rule.met ? "met" as const : "unmet" as const;
      return { ruleId, label: rule.label, status, hard: true, explanation: status === "met" ? `${rule.label} is evidenced and meets the rule.` : status === "unknown" ? `${rule.label} is unknown, so the rule fails closed.` : `${rule.label} does not yet meet the rule.`, unlockAction: rule.unlock, evidenceIds: evidenceIds(twin, ...rule.refs) };
    });
  },
  riskFit: (definition, twin, budgetFit) => {
    const concern = twin.constraints.concerns[0];
    if (concern === "cost") return budgetFit;
    if (concern === "complexity" || concern === "disruption") return ({ 1: 100, 2: 80, 3: 55, 4: 30 } as const)[definition.effortTier as 1 | 2 | 3 | 4];
    if (concern === "security") return ["protected_business_continuity", "protected_web_presence"].includes(definition.id) ? 100 : 70;
    if (concern === "adoption") return twin.readiness.changeWillingness === null ? 50 : twin.readiness.changeWillingness * 20;
    return 70;
  },
  dataReadiness: (definition, twin) => {
    const mapped = readinessPoints(twin.readiness.data);
    if (definition.id === "shared_customer_operations") return Math.max(50, mapped);
    if (definition.id === "measurable_digital_growth" || definition.id === "governed_ai_automation") return mapped;
    return 100;
  },
};
