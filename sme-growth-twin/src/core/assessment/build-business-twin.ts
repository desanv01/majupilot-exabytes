import type {
  CoreAnswers,
  FollowUpAnswers,
  FollowUpId,
} from "@/domain/assessment";
import {
  businessTwinSchema,
  type BusinessTwin,
} from "@/domain/business-twin";
import type {
  AssessmentSessionId,
  BusinessTwinId,
  EvidenceId,
} from "@/domain/ids";

import { FOLLOW_UPS } from "./follow-ups";

export interface TwinFactories {
  now: () => string;
  id: (kind: "twin" | "evidence") => string;
}

interface BuildBusinessTwinInput {
  sessionId: AssessmentSessionId;
  answers: CoreAnswers;
  selectedFollowUpIds: FollowUpId[];
  followUpAnswers: FollowUpAnswers;
  revision?: number;
}

export function buildBusinessTwin(
  input: BuildBusinessTwinInput,
  factories: TwinFactories,
): BusinessTwin {
  const answers = input.answers;
  const evidence: BusinessTwin["evidence"] = [];
  const facts: BusinessTwin["facts"] = [];

  const addEvidence = (
    reference: string,
    rawAnswer: unknown,
    normalizedValue: unknown,
    isUnknown = false,
  ) => {
    const id = factories.id("evidence") as EvidenceId;
    evidence.push({
      id,
      source: "user_fact",
      sourceRef: reference,
      questionId: reference,
      rawAnswer: rawAnswer as never,
      normalizedValue: normalizedValue as never,
      capturedAt: factories.now(),
      confidence: isUnknown ? 0.6 : 1,
    });
    return id;
  };

  const addFact = (
    key: string,
    value: string | number | boolean,
    questionId: string,
    isUnknown = false,
  ) => {
    const evidenceId = addEvidence(questionId, value, value, isUnknown);
    facts.push({ key, value, evidenceIds: [evidenceId] });
    return evidenceId;
  };

  Object.entries(answers.q1).forEach(([key, value]) => {
    if (value !== undefined) addFact(key, value, `q1.${key}`);
  });

  const capabilities = Object.entries(answers.q2).map(
    ([capabilityId, currentState]) => ({
      capabilityId,
      currentState,
      evidenceIds: [
        addEvidence(
          `q2.${capabilityId}`,
          currentState,
          currentState,
          currentState === "unknown",
        ),
      ],
      confidence: currentState === "unknown" ? 0.6 : 1,
    }),
  );

  const processEvidence = [
    addFact(
      "biggestChallenge",
      answers.q3.biggestChallenge,
      "q3.biggestChallenge",
    ),
    addFact("manualWorkflow", answers.q3.manualWorkflow, "q3.manualWorkflow"),
  ];

  if (answers.q3.manualHoursPerWeek === null) {
    addEvidence("q3.manualHoursPerWeek", null, null, true);
  } else {
    processEvidence.push(
      addFact(
        "manualHoursPerWeek",
        answers.q3.manualHoursPerWeek,
        "q3.manualHoursPerWeek",
      ),
    );
  }

  if (answers.q3.affectedEmployees === null) {
    addEvidence("q3.affectedEmployees", null, null, true);
  } else {
    processEvidence.push(
      addFact(
        "affectedEmployees",
        answers.q3.affectedEmployees,
        "q3.affectedEmployees",
      ),
    );
  }
  addFact("urgency", answers.q3.urgency, "q3.urgency");

  const followUps = input.selectedFollowUpIds.flatMap((questionId) => {
    const answer = input.followUpAnswers[questionId];
    if (answer === undefined) return [];
    const isUnknown = Array.isArray(answer)
      ? answer.includes("unknown")
      : answer === "unknown";
    addEvidence(questionId, answer, answer, isUnknown);
    return [
      {
        questionId,
        answer,
        whyWeAsked: FOLLOW_UPS[questionId].whyWeAsk,
      },
    ];
  });

  Object.entries(answers.q4).forEach(([key, value]) => {
    addFact(key, value, `q4.${key}`, value === "unknown");
  });
  Object.entries(answers.q5).forEach(([key, value]) => {
    if (value === null) addEvidence(`q5.${key}`, null, null, true);
    else addFact(key, value, `q5.${key}`);
  });

  return businessTwinSchema.parse({
    id: factories.id("twin") as BusinessTwinId,
    assessmentSessionId: input.sessionId,
    schemaVersion: "1.0.0",
    revision: input.revision ?? 1,
    facts,
    evidence,
    assumptions: [],
    generatedAt: factories.now(),
    identity: answers.q1,
    objectives: [
      {
        objectiveId: `objective_${answers.q4.primaryObjective}`,
        type: answers.q4.primaryObjective,
        timeHorizonMonths: 12,
      },
    ],
    capabilities,
    processes: [
      {
        processId: "process_primary",
        name: answers.q3.manualWorkflow,
        manualHoursPerWeek: answers.q3.manualHoursPerWeek,
        participants: answers.q3.affectedEmployees,
        painSignals: [answers.q3.biggestChallenge],
        evidenceIds: processEvidence,
      },
    ],
    constraints: {
      budgetBand: answers.q4.budgetBand,
      implementationPace: answers.q4.implementationPace,
      concerns: [answers.q4.highestConcern],
    },
    readiness: {
      leadership: answers.q5.leadershipSponsorship,
      data: answers.q5.usableData,
      skills: answers.q5.employeeDigitalSkills,
      process: answers.q5.processConsistency,
      changeWillingness: answers.q5.changeWillingness,
    },
    followUps,
  });
}
