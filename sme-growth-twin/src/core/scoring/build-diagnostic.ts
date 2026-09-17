import type { BusinessTwin } from "@/domain/business-twin";
import type { DiagnosticResultId } from "@/domain/ids";
import {
  diagnosticResultSchema,
  PAIN_MODEL_VERSION,
  SCORE_MODEL_VERSION,
  type DiagnosticResult,
} from "@/domain/scoring";

import { rankPainPoints } from "../pain-points/rank-pain-points";
import { calculateAiReadiness, calculateDigitalMaturity } from "./diagnostic-scoring";

export interface DiagnosticFactories {
  now: () => string;
  id: () => string;
}

export function buildDiagnosticResult(
  twin: BusinessTwin,
  factories: DiagnosticFactories,
): DiagnosticResult {
  return diagnosticResultSchema.parse({
    id: factories.id() as DiagnosticResultId,
    assessmentSessionId: twin.assessmentSessionId,
    businessTwinId: twin.id,
    twinRevision: twin.revision,
    generatedAt: factories.now(),
    scoreModelVersion: SCORE_MODEL_VERSION,
    painModelVersion: PAIN_MODEL_VERSION,
    digitalMaturity: calculateDigitalMaturity(twin),
    aiReadiness: calculateAiReadiness(twin),
    painPoints: rankPainPoints(twin),
  });
}
