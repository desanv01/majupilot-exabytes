import { describe, expect, it } from "vitest";

import { budgetFit, calculateScenarioValue } from "../../src/core/roi/calculate-roi";
import { estimateRangeSchema, scenarioEventSchema } from "../../src/domain/scenarios";
import { caseAFull } from "./stage04-fixtures";

describe("Stage 04 ROI model", () => {
  it("freezes Case A operational, net, payback, budget and conditional expansion ranges", () => {
    const { comparison } = caseAFull();
    const [lean, balanced, accelerated] = comparison.scenarios;
    expect(comparison.scenarios.map((item) => item.costs.firstYear)).toEqual([
      { low: 5640, base: 11280, high: 16920 }, { low: 9200, base: 18400, high: 27600 }, { low: 10320, base: 20640, high: 30960 },
    ]);
    expect(comparison.scenarios.map((item) => item.value.operational.status === "estimated" ? item.value.operational.range : null)).toEqual([
      { low: 1088, base: 3778, high: 8392 }, { low: 2358, base: 7254, high: 15233 }, { low: 2327, base: 8312, high: 17377 },
    ]);
    expect(comparison.scenarios.map((item) => item.value.net.status === "estimated" ? item.value.net.range : null)).toEqual([
      { low: -15832, base: -7502, high: 2752 }, { low: -25242, base: -11146, high: 6033 }, { low: -28633, base: -12328, high: 7057 },
    ]);
    expect(comparison.scenarios.map((item) => item.value.payback)).toEqual([
      { status: "estimated", best: 8.1, base: 35.8, worst: 186.6 }, { status: "estimated", best: 7.2, base: 30.4, worst: 140.5 }, { status: "estimated", best: 7.1, base: 29.8, worst: 159.6 },
    ]);
    expect(lean.budgetFit).toBe("base_within"); expect(balanced.budgetFit).toBe("only_low_within"); expect(accelerated.budgetFit).toBe("only_low_within");
    expect(accelerated.costs.conditionalExpansionCost).toEqual({ low: 7200, base: 14400, high: 21600 });
    expect(accelerated.value.revenue.status).toBe("not_estimated"); expect(accelerated.value.avoidedRisk.status).toBe("not_estimated");
  });

  it("activates fictional revenue only when all inputs exist and does not mutate the Business Twin", () => {
    const { twin, comparison } = caseAFull(); const before = JSON.stringify(twin); const assumptions = structuredClone(comparison.scenarios[1].assumptions);
    assumptions.revenue.addressableRevenue.range = { low: 100000, base: 120000, high: 140000 };
    assumptions.revenue.conversionChange.range = { low: .02, base: .03, high: .04 };
    expect(calculateScenarioValue(assumptions, comparison.scenarios[1].costs.firstYear).revenue.status).toBe("not_estimated");
    assumptions.revenue.grossMargin.range = { low: .3, base: .4, high: .5 };
    const value = calculateScenarioValue(assumptions, comparison.scenarios[1].costs.firstYear);
    expect(value.revenue).toEqual({ status: "estimated", range: { low: 600, base: 1440, high: 2800 }, formula: "addressable revenue × conversion change × gross margin" });
    expect(JSON.stringify(twin)).toBe(before);
  });

  it("enforces exact budget states and zero-value payback behavior", () => {
    expect(budgetFit({ low: 1000, base: 2000, high: 5000 }, "under_5k")).toBe("within_range");
    expect(budgetFit({ low: 1000, base: 5000, high: 6000 }, "under_5k")).toBe("base_within");
    expect(budgetFit({ low: 5000, base: 6000, high: 7000 }, "under_5k")).toBe("only_low_within");
    expect(budgetFit({ low: 5001, base: 6000, high: 7000 }, "under_5k")).toBe("over");
    expect(budgetFit({ low: 1, base: 2, high: 3 }, "unknown")).toBe("unknown");
  });

  it("rejects invalid numeric ranges, ratios, months and unknown events", () => {
    for (const value of [{ low: Number.NaN, base: 1, high: 2 }, { low: 0, base: Number.POSITIVE_INFINITY, high: 2 }, { low: -1, base: 1, high: 2 }, { low: 2, base: 1, high: 3 }]) expect(estimateRangeSchema.safeParse(value).success).toBe(false);
    const baseEvent = { id: "event_valid0001", scenarioId: "scenario", month: 1, type: "scenario_started", explanation: "Valid event" };
    expect(scenarioEventSchema.safeParse({ ...baseEvent, month: 0 }).success).toBe(false);
    expect(scenarioEventSchema.safeParse({ ...baseEvent, type: "unknown_event" }).success).toBe(false);
  });
});
