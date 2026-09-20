import "server-only";

import { blueprintSchema } from "@/domain/blueprint";
import { CONSULTANT_NOTE_SCHEMA_VERSION, consultantNoteSchema, type ConsultantNoteAcceptanceRequest, type ConsultantNoteDraftRequest } from "@/domain/consultant-notes";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { SupabasePersistenceRepository } from "@/infrastructure/persistence/supabase-repository";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";

import type { ConsultantNoteRepository } from "./consultant-note-repository";

type DbError = { message: string; code?: string } | null;
function failure(error: DbError): never {
  if (error?.code === "23505") throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409, { cause: error });
  if (error?.code === "42501") throw new PersistenceError("FORBIDDEN", 403, { cause: error });
  throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: error });
}
function rowToNote(row: Record<string, unknown>) {
  return consultantNoteSchema.parse({
    id: row.id, assessmentSessionId: row.assessment_session_id, organizationId: row.organization_id, leadId: row.lead_id,
    origin: row.origin, status: row.status, body: row.body, evidenceIds: row.evidence_ids ?? [], sourceArtifactIds: row.source_artifact_ids ?? [],
    modelCallId: row.model_call_id, authorUserId: row.author_user_id, sourceDraftId: row.source_draft_id, acceptedAt: row.accepted_at,
    schemaVersion: row.schema_version, createdAt: row.created_at,
  });
}

export class SupabaseConsultantNoteRepository implements ConsultantNoteRepository {
  private readonly db = createAdminSupabaseClient();
  private readonly persistence = new SupabasePersistenceRepository();

  private async authorize(owner: OwnershipContext, assessmentSessionId: string) {
    if (owner.kind !== "organization" || !["consultant", "sales_manager", "system_admin"].includes(owner.role)) throw new PersistenceError("FORBIDDEN", 403);
    await this.persistence.assertAssessmentAccess(owner, assessmentSessionId);
  }
  private async assertLead(request: { leadId?: string; assessmentSessionId: string; organizationId: string }) {
    if (!request.leadId) return;
    const lead = await this.db.from("leads").select("id").eq("id", request.leadId).eq("assessment_session_id", request.assessmentSessionId).eq("organization_id", request.organizationId).maybeSingle();
    if (lead.error) failure(lead.error);
    if (!lead.data) throw new PersistenceError("NOT_FOUND", 404);
  }

  async loadDraftContext(owner: OwnershipContext, request: ConsultantNoteDraftRequest) {
    await this.authorize(owner, request.assessmentSessionId);
    await this.assertLead(request);
    await this.persistence.assertEvidenceReferences(owner, request.assessmentSessionId, request.evidenceIds);
    const result = await this.db.from("blueprints").select("revision,payload").eq("id", request.blueprintId).eq("assessment_session_id", request.assessmentSessionId).maybeSingle();
    if (result.error) failure(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    const blueprint = blueprintSchema.parse(result.data.payload);
    return {
      blueprintId: blueprint.id, blueprintRevision: result.data.revision,
      businessSummary: { businessName: blueprint.snapshot.twin.identity.businessName, industry: blueprint.snapshot.twin.identity.industry, employeeBand: blueprint.snapshot.twin.identity.employeeBand, objective: blueprint.snapshot.twin.objectives[0]?.type ?? "not_recorded" },
      scores: { digitalMaturity: blueprint.snapshot.diagnostic.digitalMaturity.value, aiReadiness: blueprint.snapshot.diagnostic.aiReadiness.value },
      painPoints: blueprint.snapshot.diagnostic.painPoints.slice(0, 5).map(({ title, mechanism, evidenceIds }) => ({ title, mechanism, evidenceIds })),
      recommendations: blueprint.snapshot.recommendations.recommendations.map(({ title, status, whySelected, evidenceIds }) => ({ title, status, whySelected, evidenceIds })),
      limitations: blueprint.limitations,
    };
  }

  async createAiDraft(owner: OwnershipContext, request: ConsultantNoteDraftRequest, body: string, modelCallId: string) {
    await this.authorize(owner, request.assessmentSessionId);
    await this.assertLead(request);
    const row = { id: crypto.randomUUID(), assessment_session_id: request.assessmentSessionId, organization_id: request.organizationId, lead_id: request.leadId ?? null, origin: "ai_draft", status: "draft", body, evidence_ids: request.evidenceIds, source_artifact_ids: [request.blueprintId], model_call_id: modelCallId, author_user_id: null, source_draft_id: null, accepted_at: null, request_id: request.requestId, schema_version: CONSULTANT_NOTE_SCHEMA_VERSION };
    const result = await this.db.from("consultant_notes").insert(row).select("*").single();
    if (result.error) failure(result.error);
    return rowToNote(result.data);
  }

  async acceptDraft(owner: OwnershipContext, request: ConsultantNoteAcceptanceRequest) {
    await this.authorize(owner, request.assessmentSessionId);
    const draftResult = await this.db.from("consultant_notes").select("*").eq("id", request.draftNoteId).eq("assessment_session_id", request.assessmentSessionId).eq("organization_id", request.organizationId).maybeSingle();
    if (draftResult.error) failure(draftResult.error);
    if (!draftResult.data || draftResult.data.origin !== "ai_draft" || draftResult.data.status !== "draft") throw new PersistenceError("NOT_FOUND", 404);
    const row = { id: crypto.randomUUID(), assessment_session_id: request.assessmentSessionId, organization_id: request.organizationId, lead_id: draftResult.data.lead_id, origin: "human", status: "accepted", body: request.body, evidence_ids: draftResult.data.evidence_ids, source_artifact_ids: draftResult.data.source_artifact_ids, model_call_id: draftResult.data.model_call_id, author_user_id: owner.kind === "organization" ? owner.userId : null, source_draft_id: request.draftNoteId, accepted_at: new Date().toISOString(), request_id: request.requestId, schema_version: CONSULTANT_NOTE_SCHEMA_VERSION };
    const result = await this.db.from("consultant_notes").insert(row).select("*").single();
    if (result.error) failure(result.error);
    return rowToNote(result.data);
  }

  async list(owner: OwnershipContext, assessmentSessionId: string) {
    await this.authorize(owner, assessmentSessionId);
    const result = await this.db.from("consultant_notes").select("*").eq("assessment_session_id", assessmentSessionId).eq("organization_id", owner.kind === "organization" ? owner.organizationId : "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: true });
    if (result.error) failure(result.error);
    return (result.data ?? []).map(rowToNote);
  }
}
