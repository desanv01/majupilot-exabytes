import type { ScenarioEvent } from "@/domain/scenarios";

export interface SensitivityInput {
  scenarioId: string;
  seed: number;
  delayProbability: number;
  maximumDelayMonths: number;
  adoptionVariation: number;
  interventions: readonly { capabilityId: ScenarioEvent["capabilityId"]; startMonth: number; commitment: "committed" | "conditional" }[];
  eventId: () => ScenarioEvent["id"];
}

function generator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function buildSensitivityTrace(input: SensitivityInput): ScenarioEvent[] {
  const random = generator(input.seed);
  return input.interventions.flatMap((intervention) => {
    if (intervention.commitment === "conditional") return [];
    const events: ScenarioEvent[] = [];
    if (random() < input.delayProbability && input.maximumDelayMonths > 0) {
      const delay = 1 + Math.floor(random() * input.maximumDelayMonths);
      events.push({ id: input.eventId(), scenarioId: input.scenarioId, month: Math.min(12, intervention.startMonth), type: "milestone_delayed", capabilityId: intervention.capabilityId, numericPayload: delay, explanation: `Sensitivity trace: a ${delay}-month delivery delay is sampled for this milestone.` });
    }
    const variation = (random() * 2 - 1) * input.adoptionVariation;
    events.push({ id: input.eventId(), scenarioId: input.scenarioId, month: Math.min(12, intervention.startMonth + 1), type: "adoption_changed", capabilityId: intervention.capabilityId, numericPayload: Math.round(variation * 1000) / 1000, explanation: "Sensitivity trace only: sampled adoption variation; headline ROI is unchanged." });
    return events;
  });
}
