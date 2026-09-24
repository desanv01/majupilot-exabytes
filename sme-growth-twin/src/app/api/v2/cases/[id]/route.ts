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
    const snapshotCaseId = input.snapshot.durableJourney?.assessmentSessionId;
    if (snapshotCaseId !== undefined && snapshotCaseId !== caseId) throw new PersistenceError("VALIDATION_FAILED", 422);
    const snapshotOrganizationId = input.snapshot.durableJourney?.organizationId;
    if (snapshotOrganizationId !== undefined && snapshotOrganizationId !== input.organizationId) throw new PersistenceError("VALIDATION_FAILED", 422);
    if (input.snapshot.diagnostic && input.snapshot.diagnostic.assessmentSessionId !== input.snapshot.draft.sessionId) {
      // The local assessment identifier is distinct from the durable UUID; the
      // stage records must still agree with the draft before a case is saved.
      throw new PersistenceError("VALIDATION_FAILED", 422);
    }
    return response({ data: await new AccountCaseRepository().save(owner, caseId, input.expectedRevision, input.snapshot) }, 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
