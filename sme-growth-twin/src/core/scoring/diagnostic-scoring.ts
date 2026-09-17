import type { BusinessTwin } from "@/domain/business-twin";
import {
  SCORE_MODEL_VERSION,
  type Contribution,
  type DimensionResult,
  type MetricResult,
} from "@/domain/scoring";

export const CAPABILITY_STATE_POINTS = {
  not_used: 0,
  informal: 40,
  active: 100,
  unknown: null,
} as const;

export const READINESS_POINTS = {
  1: 0,
  2: 25,
  3: 50,
  4: 75,
  5: 100,
} as const;

type MetricKind = "digital" | "readiness";
type DimensionDefinition = {
  id: string;
  label: string;
  weight: number;
  action: string;
  inputs: readonly {
    id: string;
    label: string;
    weight: number;
    read: (twin: BusinessTwin) => number | null;
    evidenceRef: string;
  }[];
};

const capability = (id: string) => (twin: BusinessTwin) => {
  const state = twin.capabilities.find((item) => item.capabilityId === id)?.currentState;
  return state ? CAPABILITY_STATE_POINTS[state] : null;
};

const readiness = (id: keyof BusinessTwin["readiness"]) =>
  (twin: BusinessTwin) => {
    const value = twin.readiness[id];
    return value === null ? null : READINESS_POINTS[value as keyof typeof READINESS_POINTS];
  };

export const DIGITAL_MATURITY_DIMENSIONS: readonly DimensionDefinition[] = [
  { id: "website", label: "Website and commerce", weight: 15, action: "Establish an owned, measurable digital customer entry point.", inputs: [{ id: "websiteOrStore", label: "Website or online store", weight: 100, read: capability("websiteOrStore"), evidenceRef: "q2.websiteOrStore" }] },
  { id: "cloud", label: "Cloud and collaboration", weight: 15, action: "Standardize business email and shared cloud collaboration.", inputs: [
    { id: "businessEmail", label: "Business email", weight: 35, read: capability("businessEmail"), evidenceRef: "q2.businessEmail" },
    { id: "cloudProductivity", label: "Cloud files or productivity suite", weight: 65, read: capability("cloudProductivity"), evidenceRef: "q2.cloudProductivity" },
  ] },
  { id: "crm", label: "CRM and customer operations", weight: 20, action: "Create one shared customer record and follow-up process.", inputs: [{ id: "crm", label: "Customer relationship management (CRM)", weight: 100, read: capability("crm"), evidenceRef: "q2.crm" }] },
  { id: "marketing", label: "Marketing and measurement", weight: 15, action: "Connect campaigns to consistent measurement.", inputs: [{ id: "digitalMarketingAnalytics", label: "Digital marketing or analytics", weight: 100, read: capability("digitalMarketingAnalytics"), evidenceRef: "q2.digitalMarketingAnalytics" }] },
  { id: "security", label: "Cybersecurity and continuity", weight: 20, action: "Formalize core controls, backup, and recovery checks.", inputs: [
    { id: "cybersecurityControls", label: "Cybersecurity controls", weight: 45, read: capability("cybersecurityControls"), evidenceRef: "q2.cybersecurityControls" },
    { id: "backup", label: "Backup", weight: 55, read: capability("backup"), evidenceRef: "q2.backup" },
  ] },
  { id: "ai", label: "AI adoption", weight: 15, action: "Establish governed, task-specific AI use after data and process foundations.", inputs: [{ id: "aiTools", label: "AI tools", weight: 100, read: capability("aiTools"), evidenceRef: "q2.aiTools" }] },
] as const;

export const AI_READINESS_DIMENSIONS: readonly DimensionDefinition[] = [
  { id: "leadership", label: "Leadership sponsorship", weight: 25, action: "Secure accountable sponsorship.", inputs: [{ id: "leadership", label: "Leadership sponsorship", weight: 100, read: readiness("leadership"), evidenceRef: "q5.leadershipSponsorship" }] },
  { id: "data", label: "Data availability and quality", weight: 30, action: "Improve usable structured data.", inputs: [{ id: "data", label: "Usable data", weight: 100, read: readiness("data"), evidenceRef: "q5.usableData" }] },
  { id: "skills", label: "Employee skills", weight: 20, action: "Build practical employee skills.", inputs: [{ id: "skills", label: "Employee digital skills", weight: 100, read: readiness("skills"), evidenceRef: "q5.employeeDigitalSkills" }] },
  { id: "process", label: "Process consistency", weight: 25, action: "Standardize the target process.", inputs: [{ id: "process", label: "Process consistency", weight: 100, read: readiness("process"), evidenceRef: "q5.processConsistency" }] },
] as const;

const round1 = (value: number) => Math.round(value * 10) / 10;
const round2 = (value: number) => Math.round(value * 100) / 100;
const unique = <T,>(values: T[]) => [...new Set(values)];

function evidenceIdsFor(twin: BusinessTwin, sourceRef: string) {
  return twin.evidence.filter((item) => item.sourceRef === sourceRef).map((item) => item.id);
}

function calculateDimension(twin: BusinessTwin, definition: DimensionDefinition): DimensionResult {
  const contributions: Contribution[] = [];
  const missingEvidence: string[] = [];
  let availableEvidenceWeight = 0;
  let weightedPoints = 0;

  for (const input of definition.inputs) {
    const points = input.read(twin);
    const evidenceIds = evidenceIdsFor(twin, input.evidenceRef);
    if (points === null || evidenceIds.length === 0) {
      missingEvidence.push(input.label);
      continue;
    }
    availableEvidenceWeight += input.weight;
    weightedPoints += points * input.weight;
    contributions.push({
      inputId: input.id,
      label: input.label,
      points,
      weight: input.weight,
      weightedPoints: round1(points * input.weight),
      evidenceIds,
    });
  }

  const totalEvidenceWeight = definition.inputs.reduce((sum, input) => sum + input.weight, 0);
  return {
    id: definition.id,
    label: definition.label,
    weight: definition.weight,
    score: availableEvidenceWeight ? round1(weightedPoints / availableEvidenceWeight) : null,
    confidence: round2(availableEvidenceWeight / totalEvidenceWeight),
    availableEvidenceWeight,
    totalEvidenceWeight,
    contributions,
    evidenceIds: unique(contributions.flatMap((item) => item.evidenceIds)),
    missingEvidence,
  };
}

export function metricBand(kind: MetricKind, value: number | null) {
  if (value === null) return { bandId: "insufficient_evidence" as const, bandLabel: "Insufficient evidence" };
  if (kind === "digital") {
    if (value < 25) return { bandId: "starting" as const, bandLabel: "Starting" };
    if (value < 50) return { bandId: "building" as const, bandLabel: "Building foundations" };
    if (value < 75) return { bandId: "connected" as const, bandLabel: "Connected" };
    return { bandId: "optimizing" as const, bandLabel: "Optimizing" };
  }
  if (value < 40) return { bandId: "foundation_first" as const, bandLabel: "Foundation first" };
  if (value < 60) return { bandId: "prepare_and_pilot" as const, bandLabel: "Prepare and pilot" };
  if (value < 80) return { bandId: "targeted_adoption" as const, bandLabel: "Ready for targeted adoption" };
  return { bandId: "scale_responsibly" as const, bandLabel: "Ready to scale responsibly" };
}

export function confidenceBand(confidence: number): "low" | "medium" | "high" {
  return confidence >= 0.85 ? "high" : confidence >= 0.6 ? "medium" : "low";
}

export function calculateMetric(
  twin: BusinessTwin,
  definitions: readonly DimensionDefinition[],
  kind: MetricKind,
): MetricResult {
  const dimensions = definitions.map((definition) => calculateDimension(twin, definition));
  const available = dimensions.filter((item) => item.score !== null);
  const availableWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const value = availableWeight
    ? round1(available.reduce((sum, item) => sum + (item.score ?? 0) * item.weight, 0) / availableWeight)
    : null;
  const confidence = round2(
    dimensions.reduce((sum, item) => sum + item.confidence * item.weight, 0) /
      definitions.reduce((sum, item) => sum + item.weight, 0),
  );

  const strongest = [...available].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const limiting = [...available].sort((a, b) =>
    (a.score ?? 0) - (b.score ?? 0) || b.weight - a.weight ||
    definitions.findIndex((item) => item.id === a.id) - definitions.findIndex((item) => item.id === b.id),
  )[0];
  const limitingDefinition = definitions.find((item) => item.id === limiting?.id);
  const factorsUnavailable = "More evidence is required before a factor can be identified.";

  return {
    value,
    ...metricBand(kind, value),
    confidence,
    confidenceBand: confidenceBand(confidence),
    dimensions,
    evidenceIds: unique(dimensions.flatMap((item) => item.evidenceIds)),
    missingEvidence: unique(dimensions.flatMap((item) => item.missingEvidence)),
    strongestPositiveFactor: strongest
      ? `${strongest.label} is the strongest available factor at ${strongest.score}/100.`
      : factorsUnavailable,
    largestLimitingFactor: limiting
      ? `${limiting.label} is the largest limiting factor at ${limiting.score}/100.`
      : factorsUnavailable,
    improvementAction: limitingDefinition?.action ?? "Provide the missing evidence before choosing an improvement action.",
    rulesVersion: SCORE_MODEL_VERSION,
  };
}

export function calculateDigitalMaturity(twin: BusinessTwin) {
  return calculateMetric(twin, DIGITAL_MATURITY_DIMENSIONS, "digital");
}

export function calculateAiReadiness(twin: BusinessTwin) {
  return calculateMetric(twin, AI_READINESS_DIMENSIONS, "readiness");
}
