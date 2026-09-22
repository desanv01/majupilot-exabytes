import type { CreateCopilotSession } from "@/domain/copilot";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";

export type StoredCopilotSessionBinding = {
  assessment_session_id: unknown;
  business_twin_id: unknown;
  blueprint_id: unknown;
  guest_session_id: unknown;
  organization_id: unknown;
};

export function assertCopilotSessionBinding(
  row: StoredCopilotSessionBinding,
  owner: OwnershipContext,
  input: CreateCopilotSession,
) {
  if (String(row.assessment_session_id) !== input.assessmentSessionId) throw new PersistenceError("NOT_FOUND", 404);
  if (owner.kind === "guest" && row.guest_session_id !== owner.guestSessionId) throw new PersistenceError("FORBIDDEN", 403);
  if (owner.kind === "organization" && row.organization_id !== owner.organizationId) throw new PersistenceError("NOT_FOUND", 404);
  const storedTwin = row.business_twin_id === null ? undefined : String(row.business_twin_id);
  const storedBlueprint = row.blueprint_id === null ? undefined : String(row.blueprint_id);
  if (storedTwin !== input.businessTwinId || storedBlueprint !== input.blueprintId) {
    throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
  }
}
