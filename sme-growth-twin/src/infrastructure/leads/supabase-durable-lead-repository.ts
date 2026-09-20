import "server-only";

import { blueprintSchema } from "@/domain/blueprint";
import {
  ASSIGNMENT_ALGORITHM_VERSION,
  SALES_ROSTER_VERSION,
  durableLeadContactSchema,
  leadAssignmentViewSchema,
  leadEventViewSchema,
  leadReceiptSchemaV2,
  leadSummaryV2Schema,
  salespersonLeadDetailSchema,
  type CreateDurableLeadRequest,
} from "@/domain/lead-sales";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { SupabasePersistenceRepository } from "@/infrastructure/persistence/supabase-repository";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";

import type { DurableLeadCreateContext, DurableLeadRepository, LeadAccessContext } from "./durable-lead-repository";

type DbError = { message: string; code?: string } | null;
type Row = Record<string, unknown>;
const first = (data: unknown): Row => Array.isArray(data) ? (data[0] as Row) : (data as Row);

function failure(error: DbError): never {
  const message = error?.message ?? "";
  if (message.includes("IDEMPOTENCY_CONFLICT") || error?.code === "23505") throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409, { cause: error });
  if (message.includes("CONSENT_REQUIRED")) throw new PersistenceError("CONSENT_REQUIRED", 422, { cause: error });
  if (message.includes("REPORT_NOT_READY")) throw new PersistenceError("REPORT_NOT_READY", 409, { cause: error });
  if (message.includes("BLUEPRINT_NOT_FOUND")) throw new PersistenceError("BLUEPRINT_NOT_FOUND", 404, { cause: error });
  if (message.includes("FORBIDDEN") || error?.code === "42501") throw new PersistenceError("FORBIDDEN", 403, { cause: error });
  if (message.includes("VALIDATION_FAILED") || error?.code === "22023") throw new PersistenceError("VALIDATION_FAILED", 422, { cause: error });
  throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: error });
}

function assignment(row: Row) {
  const stableKey = String(row.roster_key ?? row.queue_key);
  return leadAssignmentViewSchema.parse({
    sequence: row.sequence,
    state: row.roster_key ? "assigned" : "unassigned",
    stableKey,
    displayLabel: row.display_label ?? (stableKey === "unassigned" ? "Unassigned consultation queue" : stableKey),
    fictionalDemo: row.fictional_demo ?? true,
    algorithmVersion: row.algorithm_version,
    rosterVersion: row.roster_snapshot_version,
    reason: row.reason,
    createdAt: row.created_at,
  });
}

function tagsFromBlueprint(payload: unknown): string[] {
  const blueprint = blueprintSchema.parse(payload);
  const tags = new Set<string>();
  for (const item of blueprint.snapshot.recommendations.recommendations) {
    tags.add(item.capabilityId.toLowerCase());
    const searchable = `${item.capabilityId} ${item.title}`.toLowerCase();
    for (const tag of ["productivity", "digital presence", "crm", "commerce", "cloud", "cybersecurity", "ai readiness", "automation", "collaboration"]) {
      if (searchable.includes(tag)) tags.add(tag);
    }
  }
  return [...tags].sort();
}

export class SupabaseDurableLeadRepository implements DurableLeadRepository {
  private readonly db = createAdminSupabaseClient();
  private readonly persistence = new SupabasePersistenceRepository();

  async loadCreateContext(owner: OwnershipContext, request: CreateDurableLeadRequest): Promise<DurableLeadCreateContext> {
    await this.persistence.assertAssessmentAccess(owner, request.assessmentSessionId);
    const result = await this.db.from("blueprints").select("payload,revision").eq("id", request.blueprintId).eq("assessment_session_id", request.assessmentSessionId).eq("revision", request.blueprintRevision).maybeSingle();
    if (result.error) failure(result.error);
    if (!result.data) throw new PersistenceError("BLUEPRINT_NOT_FOUND", 404);
    return { capabilityTags: tagsFromBlueprint(result.data.payload) };
  }

  async create(owner: OwnershipContext, request: CreateDurableLeadRequest, requestHash: string, requestId: string, correlationId: string, context: DurableLeadCreateContext) {
    const params = {
      p_owner_kind: owner.kind,
      p_owner_id: owner.kind === "guest" ? owner.guestSessionId : owner.userId,
      p_organization_id: owner.kind === "organization" ? owner.organizationId : null,
      p_actor_user_id: owner.kind === "organization" ? owner.userId : null,
      p_assessment_session_id: request.assessmentSessionId,
      p_blueprint_id: request.blueprintId,
      p_blueprint_revision: request.blueprintRevision,
      p_report_artifact_id: request.reportArtifactId,
      p_report_content_sha256: request.reportContentSha256,
      p_contact_consent_id: request.contactConsentId,
      p_report_consent_id: request.reportConsentId,
      p_idempotency_key: request.idempotencyKey,
      p_request_hash: requestHash,
      p_contact_payload: request.contact,
      p_region: request.region ?? null,
      p_preferred_language: request.preferredLanguage ?? null,
      p_capability_tags: context.capabilityTags,
      p_roster_version: SALES_ROSTER_VERSION,
      p_algorithm_version: ASSIGNMENT_ALGORITHM_VERSION,
      p_request_id: requestId,
      p_correlation_id: correlationId,
    };
    const result = await this.db.rpc("create_phase_f_lead", params);
    if (result.error) failure(result.error);
    const row = first(result.data);
    return leadReceiptSchemaV2.parse({ receiptId: row.receipt_id, leadId: row.lead_id, status: row.lead_status, assignmentState: row.assignment_state, assignmentKey: row.assignment_key, replayed: row.replayed });
  }

  private async leadRow(leadId: string) {
    const result = await this.db.from("leads").select("*").eq("id", leadId).maybeSingle();
    if (result.error) failure(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    return result.data as Row;
  }

  private async latestAssignment(leadId: string) {
    const result = await this.db.from("lead_assignments").select("*").eq("lead_id", leadId).order("sequence", { ascending: false }).limit(1).maybeSingle();
    if (result.error) failure(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    const row = result.data as Row;
    if (row.roster_key) {
      const roster = await this.db.from("sales_roster_entries").select("display_label,fictional_demo,member_user_id,team_key,active").eq("stable_key", row.roster_key).maybeSingle();
      if (roster.error) failure(roster.error);
      Object.assign(row, roster.data ?? {});
    } else {
      const queue = await this.db.from("sales_queues").select("display_label").eq("stable_key", row.queue_key).maybeSingle();
      if (queue.error) failure(queue.error);
      Object.assign(row, queue.data ?? {});
    }
    return row;
  }

  private async authorize(access: LeadAccessContext, lead: Row, internal: boolean) {
    if (access.kind === "guest") {
      if (internal || lead.guest_session_id !== access.guestSessionId) throw new PersistenceError("FORBIDDEN", 403);
      return;
    }
    if (access.kind === "organization") {
      if (lead.organization_id !== access.organizationId) throw new PersistenceError("NOT_FOUND", 404);
      if (!internal) return;
      if (access.role === "sales_manager" || access.role === "system_admin") return;
      if (access.role !== "consultant") throw new PersistenceError("FORBIDDEN", 403);
    }
    const userId = access.userId;
    const globalAdmin = await this.db.from("organization_members").select("user_id").eq("user_id", userId).eq("status", "active").eq("role", "system_admin").limit(1);
    if (globalAdmin.error) failure(globalAdmin.error);
    if ((globalAdmin.data ?? []).length) return;
    const latest = await this.latestAssignment(String(lead.id));
    if (latest.member_user_id === userId) return;
    if (lead.organization_id) {
      const membership = await this.db.from("organization_members").select("role,team_key,status").eq("organization_id", lead.organization_id).eq("user_id", userId).maybeSingle();
      if (membership.error) failure(membership.error);
      if (membership.data?.status === "active" && membership.data.role === "sales_manager") return;
      if (membership.data?.status === "active" && membership.data.role === "consultant" && latest.team_key && membership.data.team_key === latest.team_key) return;
    }
    throw new PersistenceError("FORBIDDEN", 403);
  }

  async list(access: LeadAccessContext) {
    let query = this.db.from("leads").select("id,receipt_id,assessment_session_id,status,assignment_state,contact_payload,created_at,organization_id,guest_session_id").order("created_at", { ascending: false }).limit(100);
    if (access.kind === "guest") query = query.eq("guest_session_id", access.guestSessionId);
    else if (access.kind === "organization") query = query.eq("organization_id", access.organizationId);
    const result = await query;
    if (result.error) failure(result.error);
    const visible: Row[] = [];
    for (const row of result.data ?? []) {
      try { await this.authorize(access, row, access.kind === "staff" || (access.kind === "organization" && access.role !== "prospect")); visible.push(row); }
      catch (error) { if (!(error instanceof PersistenceError) || !["FORBIDDEN", "NOT_FOUND"].includes(error.code)) throw error; }
    }
    return visible.map((row) => {
      const contact = durableLeadContactSchema.parse(row.contact_payload);
      return leadSummaryV2Schema.parse({ id: row.id, receiptId: row.receipt_id, assessmentSessionId: row.assessment_session_id, status: row.status, assignmentState: row.assignment_state, businessName: contact.businessName, urgency: contact.urgency, createdAt: row.created_at });
    });
  }

  async assignment(access: LeadAccessContext, leadId: string) {
    const lead = await this.leadRow(leadId);
    await this.authorize(access, lead, true);
    return assignment(await this.latestAssignment(leadId));
  }

  async events(access: LeadAccessContext, leadId: string) {
    const lead = await this.leadRow(leadId);
    await this.authorize(access, lead, true);
    const result = await this.db.from("lead_events").select("*").eq("lead_id", leadId).order("sequence", { ascending: true });
    if (result.error) failure(result.error);
    return (result.data ?? []).map((row) => leadEventViewSchema.parse({ id: row.id, sequence: row.sequence, eventType: row.event_type, actorKind: row.actor_kind, reasonCode: row.reason_code, payload: row.payload, correlationId: row.correlation_id, requestKey: row.idempotency_key, createdAt: row.created_at }));
  }

  async detail(access: LeadAccessContext, leadId: string) {
    const lead = await this.leadRow(leadId);
    await this.authorize(access, lead, true);
    const [blueprintResult, reportResult, noteResult, assignmentResult] = await Promise.all([
      this.db.from("blueprints").select("payload").eq("id", lead.blueprint_id).single(),
      this.db.from("report_artifacts").select("id,report_version,content_sha256,report_number,status").eq("id", lead.report_artifact_id).single(),
      this.db.from("consultant_notes").select("id,body,author_user_id,accepted_at,source_draft_id").eq("lead_id", leadId).eq("origin", "human").eq("status", "accepted").order("created_at", { ascending: true }),
      this.latestAssignment(leadId),
    ]);
    if (blueprintResult.error) failure(blueprintResult.error);
    if (reportResult.error || reportResult.data.status !== "completed") throw new PersistenceError("REPORT_NOT_READY", 409, { cause: reportResult.error });
    if (noteResult.error) failure(noteResult.error);
    const blueprint = blueprintSchema.parse(blueprintResult.data.payload);
    const consent = lead.consent_snapshot as Record<string, unknown>;
    const preCallContext = {
      business: blueprint.snapshot.twin.identity,
      constraints: blueprint.snapshot.twin.constraints,
      scores: { digitalMaturity: blueprint.snapshot.diagnostic.digitalMaturity, aiReadiness: blueprint.snapshot.diagnostic.aiReadiness },
      painPoints: blueprint.snapshot.diagnostic.painPoints.slice(0, 5),
      selectedScenario: blueprint.snapshot.selectedScenario,
      recommendations: blueprint.snapshot.recommendations.recommendations,
      advisorFindings: blueprint.advisorReviews,
      limitations: blueprint.limitations,
      acceptedConsultantNotes: noteResult.data ?? [],
    };
    return salespersonLeadDetailSchema.parse({
      id: lead.id, receiptId: lead.receipt_id, assessmentSessionId: lead.assessment_session_id, blueprintId: lead.blueprint_id,
      blueprintRevision: lead.blueprint_revision, status: lead.status, assignmentState: lead.assignment_state,
      contact: lead.contact_payload, region: lead.region, preferredLanguage: lead.preferred_language,
      consent: { snapshotVersion: consent.version, consultationContact: consent.consultationContact, reportShare: consent.reportShare },
      report: { id: reportResult.data.id, reportVersion: reportResult.data.report_version, contentSha256: reportResult.data.content_sha256, reportNumber: reportResult.data.report_number, downloadEndpoint: `/api/v2/leads/${leadId}/report-download` },
      preCallContext, assignment: assignment(assignmentResult), createdAt: lead.created_at,
    });
  }

  async reportDownload(access: LeadAccessContext, leadId: string, expiresInSeconds: number) {
    const lead = await this.leadRow(leadId);
    await this.authorize(access, lead, true);
    const report = await this.db.from("report_artifacts").select("id,status,storage_bucket,object_path").eq("id", lead.report_artifact_id).maybeSingle();
    if (report.error) failure(report.error);
    if (!report.data || report.data.status !== "completed" || !report.data.storage_bucket || !report.data.object_path) throw new PersistenceError("REPORT_NOT_READY", 409);
    const signed = await this.db.storage.from(report.data.storage_bucket).createSignedUrl(report.data.object_path, expiresInSeconds, { download: `${report.data.id}.pdf` });
    if (signed.error) failure(signed.error);
    return { reportId: report.data.id, url: signed.data.signedUrl, expiresAt: new Date(Date.now() + expiresInSeconds * 1_000).toISOString() };
  }
}
