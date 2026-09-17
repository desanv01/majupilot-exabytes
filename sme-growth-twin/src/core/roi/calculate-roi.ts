import type { EstimateRange, NullableEstimateRange, ScenarioAssumptions } from "@/domain/scenarios";

export const roundMoney = (value: number) => Math.round(value);
export const roundMonth = (value: number) => Math.round(value * 10) / 10;
export const addRanges = (...ranges: EstimateRange[]): EstimateRange => ({ low: ranges.reduce((sum, item) => sum + item.low, 0), base: ranges.reduce((sum, item) => sum + item.base, 0), high: ranges.reduce((sum, item) => sum + item.high, 0) });
const complete = (range: NullableEstimateRange): range is EstimateRange => range.low !== null && range.base !== null && range.high !== null;
const missingKeys = (items: Array<[string, NullableEstimateRange]>) => items.filter(([, value]) => !complete(value)).map(([key]) => key);

export function calculateScenarioValue(assumptions: ScenarioAssumptions, firstYearCost: EstimateRange) {
  const hours = assumptions.operational.manualHoursPerWeek.range;
  const operationalRaw = complete(hours) ? Object.fromEntries((["low", "base", "high"] as const).map((key) => [key, Math.min(hours[key], hours[key] * assumptions.operational.automatableShare.range[key] * assumptions.operational.adoption.range[key]) * 52 * assumptions.operational.loadedHourlyCost.range[key]])) as EstimateRange : null;
  const operational = complete(hours)
    ? { status: "estimated" as const, range: Object.fromEntries((["low", "base", "high"] as const).map((key) => [key, roundMoney(operationalRaw![key])])) as EstimateRange, formula: "weekly hours saved × 52 × loaded hourly cost" }
    : { status: "not_estimated" as const, missingFields: ["manual hours per week"], formula: "weekly hours saved × 52 × loaded hourly cost" };

  const revenueInputs: Array<[string, NullableEstimateRange]> = [["addressable revenue", assumptions.revenue.addressableRevenue.range], ["conversion change", assumptions.revenue.conversionChange.range], ["gross margin", assumptions.revenue.grossMargin.range]];
  const revenueMissing = missingKeys(revenueInputs);
  const revenueRaw = revenueMissing.length === 0 ? Object.fromEntries((["low", "base", "high"] as const).map((key) => [key, revenueInputs.reduce((value, [, item]) => value * (item[key] as number), 1)])) as EstimateRange : null;
  const revenue = revenueMissing.length === 0
    ? { status: "estimated" as const, range: Object.fromEntries((["low", "base", "high"] as const).map((key) => [key, roundMoney(revenueRaw![key])])) as EstimateRange, formula: "addressable revenue × conversion change × gross margin" }
    : { status: "not_estimated" as const, missingFields: revenueMissing, formula: "addressable revenue × conversion change × gross margin" };

  const riskInputs: Array<[string, NullableEstimateRange]> = [["baseline incident probability", assumptions.avoidedRisk.baselineIncidentProbability.range], ["incident impact", assumptions.avoidedRisk.incidentImpact.range], ["risk reduction", assumptions.avoidedRisk.riskReduction.range]];
  const riskMissing = missingKeys(riskInputs);
  const riskRaw = riskMissing.length === 0 ? Object.fromEntries((["low", "base", "high"] as const).map((key) => [key, riskInputs.reduce((value, [, item]) => value * (item[key] as number), 1)])) as EstimateRange : null;
  const avoidedRisk = riskMissing.length === 0
    ? { status: "estimated" as const, range: Object.fromEntries((["low", "base", "high"] as const).map((key) => [key, roundMoney(riskRaw![key])])) as EstimateRange, formula: "incident probability × incident impact × risk reduction" }
    : { status: "not_estimated" as const, missingFields: riskMissing, formula: "incident probability × incident impact × risk reduction" };

  const estimated = [operational, revenue, avoidedRisk].filter((stream): stream is Extract<typeof operational | typeof revenue | typeof avoidedRisk, { status: "estimated" }> => stream.status === "estimated");
  const exclusions = [operational, revenue, avoidedRisk].flatMap((stream, index) => stream.status === "not_estimated" ? [`${["Operational value", "Revenue value", "Avoided risk"][index]} — missing ${stream.missingFields.join(", ")}`] : []);
  if (estimated.length === 0) return { operational, revenue, avoidedRisk, gross: { status: "not_estimated" as const, missingFields: ["at least one complete value stream"], formula: "sum of estimated value streams" }, net: { status: "not_estimated" as const, missingFields: ["gross value"], formula: "gross value − first-year cost" }, payback: { status: "not_estimated" as const }, exclusions };
  const rawRanges = [operationalRaw, revenueRaw, riskRaw].filter((range): range is EstimateRange => range !== null);
  const rawGrossRange = addRanges(...rawRanges);
  const grossRange = { low: roundMoney(rawGrossRange.low), base: roundMoney(rawGrossRange.base), high: roundMoney(rawGrossRange.high) };
  const gross = { status: "estimated" as const, range: grossRange, formula: "sum of estimated value streams" };
  const net = { status: "estimated" as const, range: { low: roundMoney(rawGrossRange.low - firstYearCost.high), base: roundMoney(rawGrossRange.base - firstYearCost.base), high: roundMoney(rawGrossRange.high - firstYearCost.low) }, formula: "low gross − high cost; base gross − base cost; high gross − low cost" };
  const payback = rawGrossRange.low <= 0 || rawGrossRange.base <= 0 || rawGrossRange.high <= 0 ? { status: "not_estimated" as const } : { status: "estimated" as const, best: roundMonth(firstYearCost.low / (rawGrossRange.high / 12)), base: roundMonth(firstYearCost.base / (rawGrossRange.base / 12)), worst: roundMonth(firstYearCost.high / (rawGrossRange.low / 12)) };
  return { operational, revenue, avoidedRisk, gross, net, payback, exclusions };
}

export function budgetFit(cost: EstimateRange, budgetBand: string) {
  const upper = { under_5k: 5000, "5k_15k": 15000, "15k_50k": 50000, "50k_plus": Number.POSITIVE_INFINITY }[budgetBand];
  if (upper === undefined) return "unknown" as const;
  if (cost.high <= upper) return "within_range" as const;
  if (cost.base <= upper) return "base_within" as const;
  if (cost.low <= upper) return "only_low_within" as const;
  return "over" as const;
}
