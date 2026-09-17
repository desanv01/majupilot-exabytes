import { z } from "zod";

const entityId = <TBrand extends string>(prefix: string, brand: TBrand) =>
  z
    .string()
    .regex(
      new RegExp(`^${prefix}_[a-z0-9][a-z0-9_-]{7,63}$`),
      `Expected a ${brand} using the ${prefix}_ prefix`,
    )
    .brand<TBrand>();

export const assessmentSessionIdSchema = entityId(
  "assessment",
  "AssessmentSessionId",
);
export const businessTwinIdSchema = entityId("twin", "BusinessTwinId");
export const evidenceIdSchema = entityId("evidence", "EvidenceId");
export const assumptionIdSchema = entityId("assumption", "AssumptionId");
export const scoreResultIdSchema = entityId("score", "ScoreResultId");
export const diagnosticResultIdSchema = entityId(
  "diagnostic",
  "DiagnosticResultId",
);
export const recommendationResultIdSchema = entityId(
  "recommendation",
  "RecommendationResultId",
);

export type AssessmentSessionId = z.infer<typeof assessmentSessionIdSchema>;
export type BusinessTwinId = z.infer<typeof businessTwinIdSchema>;
export type EvidenceId = z.infer<typeof evidenceIdSchema>;
export type AssumptionId = z.infer<typeof assumptionIdSchema>;
export type ScoreResultId = z.infer<typeof scoreResultIdSchema>;
export type DiagnosticResultId = z.infer<typeof diagnosticResultIdSchema>;
export type RecommendationResultId = z.infer<
  typeof recommendationResultIdSchema
>;
