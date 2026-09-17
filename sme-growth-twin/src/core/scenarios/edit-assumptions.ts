import { scenarioAssumptionsSchema, type ScenarioAssumptions } from "@/domain/scenarios";

type RangeGroup = "costs" | "operational" | "revenue" | "avoidedRisk";
type RangeBand = "low" | "base" | "high";

const clone = (value: ScenarioAssumptions): ScenarioAssumptions => JSON.parse(JSON.stringify(value)) as ScenarioAssumptions;

export function editRangeAssumption(assumptions: ScenarioAssumptions, group: RangeGroup, field: string, band: RangeBand, rawValue: string) {
  const next = clone(assumptions);
  const edited = (next[group] as unknown as Record<string, { range: Record<RangeBand, number | null>; source: ScenarioAssumptions["costs"]["implementation"]["source"]; sourceRef: string }>)[field];
  edited.range[band] = rawValue.trim() === "" ? (["revenue", "avoidedRisk"].includes(group) ? null : Number.NaN) : Number(rawValue);
  edited.source = "user_override";
  edited.sourceRef = "scenario-lab-edit";
  return scenarioAssumptionsSchema.safeParse(next);
}

export function editSensitivitySeed(assumptions: ScenarioAssumptions, rawValue: string) {
  const next = clone(assumptions);
  next.sensitivity.seed = rawValue.trim() === "" ? Number.NaN : Number(rawValue);
  next.sensitivity.source = "user_override";
  next.sensitivity.sourceRef = "scenario-lab-edit";
  return scenarioAssumptionsSchema.safeParse(next);
}
