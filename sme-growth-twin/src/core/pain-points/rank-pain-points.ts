import type { BusinessTwin, Evidence } from "@/domain/business-twin";
import { PAIN_MODEL_VERSION, type PainPointResult } from "@/domain/scoring";

type PainContext = {
  twin: BusinessTwin;
  challenge: string;
  objective: string;
  urgency: number;
  pace: string;
  manualHours: number | null;
  affectedEmployees: number | null;
};

type PainDefinition = {
  id: string;
  title: string;
  mechanism: string;
  explicitChallenge?: string;
  primaryObjectives: readonly string[];
  secondaryObjectives?: readonly string[];
  affectedCapabilityIds: readonly string[];
  evaluate: (context: PainContext) => {
    triggered: boolean;
    severe: boolean;
    triggerCodes: string[];
    evidenceRefs: string[];
  };
};

export const MANUAL_HOURS_NORMALIZATION = {
  under_5: 2.5,
  "5_10": 7.5,
  "11_20": 15.5,
  "21_40": 30.5,
  over_40: 41,
} as const;

const belowActive = (state: string | undefined) => state === "not_used" || state === "informal";
const refs = (...items: Array<string | false | null | undefined>) => items.filter((item): item is string => Boolean(item));

function capabilityState(twin: BusinessTwin, id: string) {
  return twin.capabilities.find((item) => item.capabilityId === id)?.currentState;
}

function followUpScalar(twin: BusinessTwin, id: string) {
  const answer = twin.followUps.find((item) => item.questionId === id)?.answer;
  return typeof answer === "string" ? answer : undefined;
}

function normalizedManualHours(twin: BusinessTwin) {
  const direct = twin.processes[0]?.manualHoursPerWeek;
  if (direct !== null && direct !== undefined) return direct;
  const band = followUpScalar(twin, "fu_manual_hours");
  return band && band in MANUAL_HOURS_NORMALIZATION
    ? MANUAL_HOURS_NORMALIZATION[band as keyof typeof MANUAL_HOURS_NORMALIZATION]
    : null;
}

const PAIN_DEFINITIONS: readonly PainDefinition[] = [
  {
    id: "pain_customer_followup",
    title: "Customer follow-up lacks a shared system",
    mechanism: "Fragmented customer records make enquiries easier to miss and follow-up harder to manage consistently.",
    explicitChallenge: "customer_management",
    primaryObjectives: ["increase_revenue", "acquire_customers", "improve_retention"],
    affectedCapabilityIds: ["crm", "workflow_automation"],
    evaluate: ({ twin, challenge }) => {
      const crm = capabilityState(twin, "crm");
      const records = followUpScalar(twin, "fu_customer_records");
      const severe = ["messaging_apps", "paper", "multiple_places", "none"].includes(records ?? "");
      const explicit = challenge === "customer_management";
      const capabilityTrigger = crm === "not_used" || crm === "informal";
      return { triggered: explicit || capabilityTrigger, severe, triggerCodes: refs(explicit && "explicit_customer_management", capabilityTrigger && "crm_below_active", severe && "fragmented_customer_records"), evidenceRefs: refs(explicit && "q3.biggestChallenge", capabilityTrigger && "q2.crm", severe && "fu_customer_records") };
    },
  },
  {
    id: "pain_manual_work",
    title: "Manual work consumes avoidable team capacity",
    mechanism: "Repeated manual steps consume staff time, slow throughput, and make growth harder to absorb.",
    explicitChallenge: "manual_work",
    primaryObjectives: ["reduce_cost", "increase_productivity"],
    affectedCapabilityIds: ["workflow_automation", "cloud_productivity"],
    evaluate: ({ twin, challenge, manualHours, affectedEmployees }) => {
      const explicit = challenge === "manual_work";
      const hoursTrigger = manualHours !== null && manualHours >= 5;
      const severe = (manualHours !== null && manualHours >= 11) || (affectedEmployees !== null && affectedEmployees >= 5);
      const hoursRef = twin.processes[0]?.manualHoursPerWeek === null ? "fu_manual_hours" : "q3.manualHoursPerWeek";
      return { triggered: explicit || hoursTrigger, severe, triggerCodes: refs(explicit && "explicit_manual_work", hoursTrigger && "manual_hours_at_least_5", severe && "manual_work_severe"), evidenceRefs: refs(explicit && "q3.biggestChallenge", hoursTrigger && hoursRef, affectedEmployees !== null && "q3.affectedEmployees") };
    },
  },
  {
    id: "pain_security_continuity",
    title: "Security and continuity controls leave recovery exposed",
    mechanism: "Missing core protection or dependable backup increases the chance that an incident interrupts operations.",
    explicitChallenge: "security_continuity",
    primaryObjectives: ["strengthen_resilience"],
    affectedCapabilityIds: ["cybersecurity", "backup_recovery"],
    evaluate: ({ twin, challenge }) => {
      const backup = capabilityState(twin, "backup");
      const security = capabilityState(twin, "cybersecurityControls");
      const frequency = followUpScalar(twin, "fu_backup_frequency");
      const concern = twin.constraints.concerns[0];
      const explicit = challenge === "security_continuity";
      const capabilityTrigger = backup === "not_used" || security === "not_used";
      const severe = frequency === "none" || frequency === "ad_hoc" || concern === "security";
      return { triggered: explicit || capabilityTrigger, severe, triggerCodes: refs(explicit && "explicit_security_continuity", backup === "not_used" && "backup_not_used", security === "not_used" && "security_controls_not_used", severe && "continuity_severe"), evidenceRefs: refs(explicit && "q3.biggestChallenge", backup === "not_used" && "q2.backup", security === "not_used" && "q2.cybersecurityControls", (frequency === "none" || frequency === "ad_hoc") && "fu_backup_frequency", concern === "security" && "q4.highestConcern") };
    },
  },
  {
    id: "pain_lead_generation",
    title: "Digital lead generation has weak foundations",
    mechanism: "Without a dependable digital entry point and measurement, demand generation is difficult to repeat or improve.",
    explicitChallenge: "lead_generation",
    primaryObjectives: ["increase_revenue", "acquire_customers"],
    affectedCapabilityIds: ["digital_presence", "marketing_measurement"],
    evaluate: ({ twin, challenge }) => {
      const website = capabilityState(twin, "websiteOrStore");
      const marketing = capabilityState(twin, "digitalMarketingAnalytics");
      const explicit = challenge === "lead_generation";
      const capabilityTrigger = website === "not_used" || marketing === "not_used";
      const severe = belowActive(website) && belowActive(marketing);
      return { triggered: explicit || capabilityTrigger, severe, triggerCodes: refs(explicit && "explicit_lead_generation", website === "not_used" && "website_not_used", marketing === "not_used" && "marketing_not_used", severe && "digital_acquisition_severe"), evidenceRefs: refs(explicit && "q3.biggestChallenge", (website === "not_used" || severe) && "q2.websiteOrStore", (marketing === "not_used" || severe) && "q2.digitalMarketingAnalytics") };
    },
  },
  {
    id: "pain_collaboration",
    title: "Team collaboration lacks a shared digital foundation",
    mechanism: "Disconnected communication and files make coordination slower and increase duplicated work.",
    explicitChallenge: "team_collaboration",
    primaryObjectives: ["increase_productivity", "reduce_cost"],
    affectedCapabilityIds: ["business_email", "cloud_productivity"],
    evaluate: ({ twin, challenge }) => {
      const email = capabilityState(twin, "businessEmail");
      const cloud = capabilityState(twin, "cloudProductivity");
      const explicit = challenge === "team_collaboration";
      const capabilityTrigger = email === "not_used" || cloud === "not_used";
      const severe = belowActive(email) && belowActive(cloud);
      return { triggered: explicit || capabilityTrigger, severe, triggerCodes: refs(explicit && "explicit_team_collaboration", email === "not_used" && "business_email_not_used", cloud === "not_used" && "cloud_productivity_not_used", severe && "collaboration_severe"), evidenceRefs: refs(explicit && "q3.biggestChallenge", (email === "not_used" || severe) && "q2.businessEmail", (cloud === "not_used" || severe) && "q2.cloudProductivity") };
    },
  },
  {
    id: "pain_data_visibility",
    title: "Decision data is difficult to use consistently",
    mechanism: "Limited usable data and disconnected customer information reduce visibility for timely business decisions.",
    explicitChallenge: "data_visibility",
    primaryObjectives: ["increase_productivity", "increase_revenue", "launch_ai_capability"],
    affectedCapabilityIds: ["data_foundation", "analytics"],
    evaluate: ({ twin, challenge }) => {
      const data = twin.readiness.data;
      const marketing = capabilityState(twin, "digitalMarketingAnalytics");
      const crm = capabilityState(twin, "crm");
      const explicit = challenge === "data_visibility";
      const readinessTrigger = data !== null && data <= 2;
      const capabilityTrigger = marketing === "not_used";
      const severe = readinessTrigger && belowActive(crm);
      return { triggered: explicit || readinessTrigger || capabilityTrigger, severe, triggerCodes: refs(explicit && "explicit_data_visibility", readinessTrigger && "data_readiness_low", capabilityTrigger && "marketing_measurement_not_used", severe && "data_visibility_severe"), evidenceRefs: refs(explicit && "q3.biggestChallenge", readinessTrigger && "q5.usableData", capabilityTrigger && "q2.digitalMarketingAnalytics", severe && "q2.crm") };
    },
  },
  {
    id: "pain_scaling_operations",
    title: "Inconsistent processes constrain growth",
    mechanism: "Work that depends on inconsistent steps becomes harder to coordinate as volume and team size increase.",
    explicitChallenge: "scaling_operations",
    primaryObjectives: ["increase_productivity", "increase_revenue"],
    affectedCapabilityIds: ["process_standardization", "workflow_automation"],
    evaluate: ({ challenge, twin, manualHours, affectedEmployees }) => {
      const process = twin.readiness.process;
      const explicit = challenge === "scaling_operations";
      const readinessTrigger = process !== null && process <= 2;
      const severe = (affectedEmployees !== null && affectedEmployees >= 5) || (manualHours !== null && manualHours >= 11);
      const hoursRef = twin.processes[0]?.manualHoursPerWeek === null ? "fu_manual_hours" : "q3.manualHoursPerWeek";
      return { triggered: explicit || readinessTrigger, severe, triggerCodes: refs(explicit && "explicit_scaling_operations", readinessTrigger && "process_consistency_low", severe && "scaling_operations_severe"), evidenceRefs: refs(explicit && "q3.biggestChallenge", readinessTrigger && "q5.processConsistency", affectedEmployees !== null && "q3.affectedEmployees", manualHours !== null && hoursRef) };
    },
  },
  {
    id: "pain_ai_foundation",
    title: "AI ambition is ahead of its foundations",
    mechanism: "AI adoption is less likely to succeed until data, skills, and process foundations are strengthened.",
    primaryObjectives: ["launch_ai_capability"],
    affectedCapabilityIds: ["data_foundation", "ai_governance"],
    evaluate: ({ twin, objective }) => {
      const low = (["data", "skills", "process"] as const).filter((key) => twin.readiness[key] !== null && (twin.readiness[key] ?? 5) <= 2);
      const triggered = objective === "launch_ai_capability" && low.length > 0;
      return { triggered, severe: low.length >= 2, triggerCodes: refs(triggered && "ai_objective_with_low_foundation", low.length >= 2 && "multiple_ai_foundations_low"), evidenceRefs: triggered ? ["q4.primaryObjective", ...low.map((key) => ({ data: "q5.usableData", skills: "q5.employeeDigitalSkills", process: "q5.processConsistency" })[key])] : [] };
    },
  },
] as const;

export { PAIN_DEFINITIONS };

const round1 = (value: number) => Math.round(value * 10) / 10;

function evidenceForRefs(twin: BusinessTwin, evidenceRefs: string[]): Evidence[] {
  const wanted = new Set(evidenceRefs);
  const seen = new Set<string>();
  return twin.evidence.filter((item) => {
    if (!wanted.has(item.sourceRef) || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function rankPainPoints(twin: BusinessTwin): PainPointResult[] {
  const challenge = twin.processes[0]?.painSignals[0] ?? "";
  const objective = twin.objectives[0]?.type ?? "";
  const urgencyFact = twin.facts.find((item) => item.key === "urgency")?.value;
  const urgencyValue = typeof urgencyFact === "number" ? urgencyFact : 1;
  const urgency = Math.min(100, urgencyValue * 20 + (twin.constraints.implementationPace === "within_30_days" ? 10 : 0));
  const context: PainContext = {
    twin,
    challenge,
    objective,
    urgency,
    pace: twin.constraints.implementationPace,
    manualHours: normalizedManualHours(twin),
    affectedEmployees: twin.processes[0]?.participants ?? null,
  };

  return PAIN_DEFINITIONS.flatMap((definition) => {
    const evaluation = definition.evaluate(context);
    if (!evaluation.triggered) return [];
    const directEvidence = evidenceForRefs(twin, evaluation.evidenceRefs);
    if (!directEvidence.length) return [];
    const sharedRefs = ["q3.urgency", "q4.primaryObjective", "q4.implementationPace"];
    const evidence = evidenceForRefs(twin, [...evaluation.evidenceRefs, ...sharedRefs]);
    const explicit = definition.explicitChallenge === challenge;
    const impact = Math.min(100, (explicit ? 90 : 65) + (evaluation.severe ? 10 : 0));
    const strategicAlignment = definition.primaryObjectives.includes(objective)
      ? 100
      : definition.secondaryObjectives?.includes(objective)
        ? 75
        : 50;
    const confidence = round1(evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length * 100);
    const priority = round1(impact * 0.35 + urgency * 0.25 + strategicAlignment * 0.2 + confidence * 0.2);
    return [{
      id: definition.id,
      title: definition.title,
      impact: round1(impact),
      urgency: round1(urgency),
      strategicAlignment: round1(strategicAlignment),
      confidence,
      priority,
      mechanism: definition.mechanism,
      affectedCapabilityIds: [...definition.affectedCapabilityIds],
      evidenceIds: evidence.map((item) => item.id),
      triggerCodes: evaluation.triggerCodes,
      painModelVersion: PAIN_MODEL_VERSION,
    }];
  }).sort((a, b) => b.priority - a.priority || b.impact - a.impact || a.id.localeCompare(b.id));
}
