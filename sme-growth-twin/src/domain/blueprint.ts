import { z } from "zod";

import { advisorReviewSchema, advisorSynthesisSchema, modelCallRecordSchema, ADVISOR_MODEL_VERSION } from "./advisors";
import { businessTwinSchema } from "./business-twin";
import { blueprintIdSchema } from "./ids";
import { recommendationResultSchema } from "./recommendations";
import { scenarioComparisonSchema, scenarioResultSchema } from "./scenarios";
import { diagnosticResultSchema } from "./scoring";

export const BLUEPRINT_MODEL_VERSION = "1.0.0" as const;
export const BLUEPRINT_STORAGE_VERSION = "1.0.0" as const;
export const BLUEPRINT_SECTION_IDS = ["cover", "executive-summary", "business-profile", "maturity-readiness", "pain-points", "recommendations", "scenario-comparison", "selected-plan", "roi", "roadmap", "risks", "advisor-reviews", "synthesis", "consultant-notes", "methodology", "consultation-preview"] as const;

export const claimProvenanceSchema = z.object({
  claimId: z.string().min(1), sectionId: z.enum(BLUEPRINT_SECTION_IDS),
  category: z.enum(["user_fact", "catalogue_fact", "calculated_rule", "scenario_assumption", "model_interpretation", "deterministic_fallback", "human_note"]),
  sourceRefs: z.array(z.string().min(1)).min(1),
}).strict();

export const blueprintSourceIdentitySchema = z.object({
  assessmentSessionId: z.string().min(1), businessTwinId: z.string().min(1), twinRevision: z.number().int().positive(), businessTwinSchemaVersion: z.string().min(1),
  diagnosticResultId: z.string().min(1), scoreModelVersion: z.string().min(1), painModelVersion: z.string().min(1),
  recommendationResultId: z.string().min(1), recommendationModelVersion: z.string().min(1), catalogueVersion: z.string().min(1),
  scenarioComparisonId: z.string().min(1), scenarioModelVersion: z.string().min(1), roiModelVersion: z.string().min(1), selectedScenarioId: z.string().min(1),
  advisorModelVersion: z.literal(ADVISOR_MODEL_VERSION), blueprintModelVersion: z.literal(BLUEPRINT_MODEL_VERSION),
}).strict();

export const blueprintSchema = z.object({
  id: blueprintIdSchema, storageVersion: z.literal(BLUEPRINT_STORAGE_VERSION), modelVersion: z.literal(BLUEPRINT_MODEL_VERSION), generatedAt: z.iso.datetime({ offset: true }),
  sourceIdentity: blueprintSourceIdentitySchema,
  sectionIds: z.tuple(BLUEPRINT_SECTION_IDS.map((id) => z.literal(id)) as [z.ZodLiteral<(typeof BLUEPRINT_SECTION_IDS)[number]>, ...z.ZodLiteral<(typeof BLUEPRINT_SECTION_IDS)[number]>[]]),
  snapshot: z.object({ twin: businessTwinSchema, diagnostic: diagnosticResultSchema, recommendations: recommendationResultSchema, comparison: scenarioComparisonSchema, selectedScenario: scenarioResultSchema }).strict(),
  advisorReviews: z.array(advisorReviewSchema).length(5), synthesis: advisorSynthesisSchema, modelCalls: z.array(modelCallRecordSchema).length(5),
  provenance: z.array(claimProvenanceSchema).min(1), limitations: z.array(z.string().min(1)).min(1),
}).strict();

export type Blueprint = z.infer<typeof blueprintSchema>;
export type BlueprintSourceIdentity = z.infer<typeof blueprintSourceIdentitySchema>;
