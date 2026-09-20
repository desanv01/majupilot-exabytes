import { z } from "zod";

import { PersistenceService } from "@/core/persistence/persistence-service";
import { assessmentDraftSchema } from "@/domain/assessment";
import { blueprintSchema } from "@/domain/blueprint";
import { businessTwinSchema } from "@/domain/business-twin";
import { scenarioComparisonSchema } from "@/domain/scenarios";
import { recommendationResultSchema } from "@/domain/recommendations";
import { diagnosticResultSchema } from "@/domain/scoring";
import { persistenceUuidSchema } from "@/domain/persistence";
import { correlationId, errorResponse, readJson, repository, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

const idsSchema = z.object({
  answers: z.record(z.string().min(1).max(80), persistenceUuidSchema),
  businessTwin: persistenceUuidSchema,
  evidence: z.array(persistenceUuidSchema).max(128),
  diagnostic: persistenceUuidSchema,
  recommendations: persistenceUuidSchema,
  scenarioComparison: persistenceUuidSchema,
  scenarioRevision: persistenceUuidSchema,
  blueprint: persistenceUuidSchema,
}).strict();

const inputSchema = z.object({
  assessmentSessionId: persistenceUuidSchema,
  ids: idsSchema,
  draft: assessmentDraftSchema,
  twin: businessTwinSchema,
  diagnostic: diagnosticResultSchema,
  recommendations: recommendationResultSchema,
  comparison: scenarioComparisonSchema,
  blueprint: blueprintSchema,
}).strict();

const record = (value: unknown) => value as Record<string, unknown>;

export async function POST(request: Request) {
  const requestId = correlationId(request);
  try {
    const input = inputSchema.parse(await readJson(request, 2 * 1024 * 1024));
    const selected = input.comparison.scenarios.find((item) => item.id === input.comparison.selectedScenarioId);
    if (!selected || input.ids.evidence.length !== input.twin.evidence.length) {
      return response({ error: { code: "VALIDATION_FAILED", requestId } }, 422, requestId);
    }
    const owner = await resolveOwner(request);
    const persistence = new PersistenceService(repository());
    const answers = {
      ...input.draft.answers,
      ...Object.fromEntries(Object.entries(input.draft.followUpAnswers).map(([key, value]) => [`followUp.${key}`, value])),
    };
    for (const [answerKey, value] of Object.entries(answers)) {
      const id = input.ids.answers[answerKey];
      if (!id) return response({ error: { code: "VALIDATION_FAILED", requestId } }, 422, requestId);
      await persistence.saveAnswer(owner, {
        id,
        assessmentSessionId: input.assessmentSessionId,
        answerKey,
        revision: 1,
        value,
        evidenceState: "confirmed",
        schemaVersion: input.draft.schemaVersion,
      });
    }

    const answerIds = Object.values(input.ids.answers);
    await persistence.saveArtifact(owner, {
      kind: "business_twins", id: input.ids.businessTwin, assessmentSessionId: input.assessmentSessionId,
      payload: record(input.twin), revision: 1, schemaVersion: input.twin.schemaVersion,
      rulePackVersion: input.diagnostic.scoreModelVersion, sourceArtifactIds: answerIds, links: {},
    });
    for (const [index, evidence] of input.twin.evidence.entries()) {
      await persistence.saveArtifact(owner, {
        kind: "evidence_items", id: input.ids.evidence[index], assessmentSessionId: input.assessmentSessionId,
        payload: record({ ...evidence, sourceKind: evidence.source, sourceRef: evidence.sourceRef }), revision: 1,
        schemaVersion: input.twin.schemaVersion, sourceArtifactIds: answerIds,
        links: { businessTwinId: input.ids.businessTwin },
      });
    }
    await persistence.saveArtifact(owner, {
      kind: "diagnostic_runs", id: input.ids.diagnostic, assessmentSessionId: input.assessmentSessionId,
      payload: record(input.diagnostic), schemaVersion: input.draft.schemaVersion,
      rulePackVersion: input.diagnostic.scoreModelVersion, sourceArtifactIds: [input.ids.businessTwin, ...input.ids.evidence],
      links: { businessTwinId: input.ids.businessTwin },
    });
    await persistence.saveArtifact(owner, {
      kind: "recommendation_runs", id: input.ids.recommendations, assessmentSessionId: input.assessmentSessionId,
      payload: record(input.recommendations), schemaVersion: input.draft.schemaVersion,
      rulePackVersion: input.recommendations.recommendationModelVersion,
      sourceArtifactIds: [input.ids.businessTwin, input.ids.diagnostic, ...input.ids.evidence],
      links: { businessTwinId: input.ids.businessTwin, diagnosticRunId: input.ids.diagnostic },
    });
    await persistence.saveArtifact(owner, {
      kind: "scenario_comparisons", id: input.ids.scenarioComparison, assessmentSessionId: input.assessmentSessionId,
      payload: record(input.comparison), schemaVersion: input.draft.schemaVersion,
      rulePackVersion: input.comparison.scenarioModelVersion,
      sourceArtifactIds: [input.ids.businessTwin, input.ids.diagnostic, input.ids.recommendations],
      links: { businessTwinId: input.ids.businessTwin, recommendationRunId: input.ids.recommendations },
    });
    await persistence.saveArtifact(owner, {
      kind: "scenario_revisions", id: input.ids.scenarioRevision, assessmentSessionId: input.assessmentSessionId,
      payload: { assumptions: selected.assumptions, results: selected }, revision: 1,
      schemaVersion: input.draft.schemaVersion, rulePackVersion: input.comparison.scenarioModelVersion,
      sourceArtifactIds: [input.ids.scenarioComparison, input.ids.recommendations],
      links: { scenarioComparisonId: input.ids.scenarioComparison },
    });
    await persistence.saveArtifact(owner, {
      kind: "blueprints", id: input.ids.blueprint, assessmentSessionId: input.assessmentSessionId,
      payload: record(input.blueprint), revision: 1, schemaVersion: input.blueprint.storageVersion,
      rulePackVersion: input.blueprint.modelVersion,
      sourceArtifactIds: [input.ids.businessTwin, input.ids.diagnostic, input.ids.recommendations, input.ids.scenarioRevision],
      links: {
        businessTwinId: input.ids.businessTwin,
        diagnosticRunId: input.ids.diagnostic,
        recommendationRunId: input.ids.recommendations,
        scenarioRevisionId: input.ids.scenarioRevision,
      },
    });
    return response({ data: { assessmentSessionId: input.assessmentSessionId, ids: input.ids } }, 201, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
