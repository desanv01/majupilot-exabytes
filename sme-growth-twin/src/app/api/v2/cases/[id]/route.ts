import { saveAccountCaseSchema } from "@/domain/account-cases";
import { PersistenceError, persistenceUuidSchema } from "@/domain/persistence";
import { AccountCaseRepository } from "@/infrastructure/persistence/account-case-repository";
import { correlationId, errorResponse, readJson, resolveOwner, response } from "@/infrastructure/persistence/api";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const caseId = persistenceUuidSchema.parse((await params).id);
    const organizationId = persistenceUuidSchema.parse(new URL(request.url).searchParams.get("organizationId"));
    const owner = await resolveOwner(request, organizationId);
    return response({ data: await new AccountCaseRepository().get(owner, caseId) }, 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = correlationId(request);
  try {
    const caseId = persistenceUuidSchema.parse((await params).id);
    const input = saveAccountCaseSchema.parse(await readJson(request, 2 * 1024 * 1024));
    const owner = await resolveOwner(request, input.organizationId);
    const snapshot = input.snapshot;
    const journey = snapshot.durableJourney;
    if (journey && (journey.assessmentSessionId !== caseId || journey.organizationId !== input.organizationId)) throw new PersistenceError("VALIDATION_FAILED", 422);
    if ([snapshot.diagnostic?.assessmentSessionId, snapshot.recommendations?.assessmentSessionId, snapshot.comparison?.assessmentSessionId, snapshot.blueprint?.sourceIdentity.assessmentSessionId]
      .some((stageId) => stageId !== undefined && stageId !== snapshot.draft.sessionId)) throw new PersistenceError("VALIDATION_FAILED", 422);
    const diagnostic = snapshot.diagnostic;
    const recommendations = snapshot.recommendations;
    const comparison = snapshot.comparison;
    const blueprint = snapshot.blueprint;
    if (diagnostic && diagnostic.twinRevision !== snapshot.draft.twinRevision) throw new PersistenceError("VALIDATION_FAILED", 422);
    if (recommendations && (!diagnostic || recommendations.diagnosticResultId !== diagnostic.id || recommendations.businessTwinId !== diagnostic.businessTwinId || recommendations.twinRevision !== diagnostic.twinRevision)) throw new PersistenceError("VALIDATION_FAILED", 422);
    if (comparison && (!recommendations || !diagnostic || comparison.recommendationResultId !== recommendations.id || comparison.diagnosticResultId !== diagnostic.id || comparison.businessTwinId !== diagnostic.businessTwinId || comparison.twinRevision !== diagnostic.twinRevision)) throw new PersistenceError("VALIDATION_FAILED", 422);
    if (blueprint && (!comparison || !recommendations || !diagnostic || blueprint.sourceIdentity.scenarioComparisonId !== comparison.id || blueprint.sourceIdentity.recommendationResultId !== recommendations.id || blueprint.sourceIdentity.diagnosticResultId !== diagnostic.id || blueprint.sourceIdentity.businessTwinId !== diagnostic.businessTwinId)) throw new PersistenceError("VALIDATION_FAILED", 422);
    if (journey?.report && (journey.report.assessmentSessionId !== caseId || journey.report.blueprintId !== journey.artifactIds?.blueprint)) throw new PersistenceError("VALIDATION_FAILED", 422);
    return response({ data: await new AccountCaseRepository().save(owner, caseId, input.expectedRevision, input.snapshot) }, 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
