import "server-only";

import { blueprintSchema } from "@/domain/blueprint";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import {
  REPORT_BUCKET,
  REPORT_RENDERER_VERSION,
  REPORT_SCHEMA_VERSION,
  REPORT_TEMPLATE_VERSION,
  acceptedConsultantNoteSchema,
  reportArtifactSchema,
  type GenerateReportRequest,
  type ReportArtifact,
  type ReportGenerationSource,
} from "@/domain/reports";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";
import { SupabasePersistenceRepository } from "@/infrastructure/persistence/supabase-repository";

import type { ReportRepository, ReserveReportInput } from "./report-repository";

type DbError = { message: string; code?: string } | null;
function failure(error: DbError): never {
  if (error?.code === "23505") throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409, { cause: error });
  if (error?.code === "42501") throw new PersistenceError("FORBIDDEN", 403, { cause: error });
  throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: error });
}
function artifact(row: Record<string, unknown>): ReportArtifact {
  return reportArtifactSchema.parse({
    id: row.id, reportNumber: row.report_number, reportVersion: row.report_version, assessmentSessionId: row.assessment_session_id,
    blueprintId: row.blueprint_id, blueprintRevision: row.blueprint_revision, status: row.status, contentSha256: row.content_sha256,
    provenanceHash: row.provenance_hash, renderKey: row.render_key, mimeType: row.mime_type, byteLength: row.byte_length === null ? null : Number(row.byte_length),
    pageCount: row.page_count, storageBucket: row.storage_bucket, objectPath: row.object_path, selectedNoteIds: row.selected_note_ids ?? [],
    rendererVersion: row.renderer_version, templateVersion: row.template_version, generatedAt: row.generated_at, completedAt: row.completed_at, createdAt: row.created_at,
  });
}

export class SupabaseReportRepository implements ReportRepository {
  private readonly db = createAdminSupabaseClient();
  private readonly persistence = new SupabasePersistenceRepository();

  private async assertOwner(owner: OwnershipContext, assessmentSessionId: string) { await this.persistence.assertAssessmentAccess(owner, assessmentSessionId); }

  async loadSource(owner: OwnershipContext, request: GenerateReportRequest): Promise<ReportGenerationSource> {
    await this.assertOwner(owner, request.assessmentSessionId);
    const blueprintResult = await this.db.from("blueprints").select("id,assessment_session_id,revision,payload,provenance_hash,rule_pack_version,catalogue_version_id,source_artifact_ids").eq("id", request.blueprintId).eq("assessment_session_id", request.assessmentSessionId).maybeSingle();
    if (blueprintResult.error) failure(blueprintResult.error);
    if (!blueprintResult.data) throw new PersistenceError("NOT_FOUND", 404);
    const blueprint = blueprintSchema.parse(blueprintResult.data.payload);
    const catalogue = blueprintResult.data.catalogue_version_id ? await this.db.from("catalogue_versions").select("semantic_version").eq("id", blueprintResult.data.catalogue_version_id).maybeSingle() : { data: null, error: null };
    if (catalogue.error) failure(catalogue.error);
    const advisorRuns = await this.db.from("advisor_runs").select("id").eq("assessment_session_id", request.assessmentSessionId).eq("blueprint_id", request.blueprintId);
    if (advisorRuns.error) failure(advisorRuns.error);
    const runIds = (advisorRuns.data ?? []).map((row) => row.id);
    const reviews = runIds.length ? await this.db.from("advisor_reviews").select("id").in("advisor_run_id", runIds) : { data: [], error: null };
    if (reviews.error) failure(reviews.error);
    let notes: Array<Record<string, unknown>> = [];
    if (request.acceptedNoteIds.length) {
      if (owner.kind !== "organization" || !["consultant", "sales_manager", "system_admin"].includes(owner.role)) throw new PersistenceError("FORBIDDEN", 403);
      const result = await this.db.from("consultant_notes").select("id,body,author_user_id,accepted_at,source_draft_id,status,origin,assessment_session_id,organization_id").in("id", request.acceptedNoteIds).eq("assessment_session_id", request.assessmentSessionId);
      if (result.error) failure(result.error);
      notes = result.data ?? [];
      if (notes.length !== new Set(request.acceptedNoteIds).size) throw new PersistenceError("NOT_FOUND", 404);
      if (notes.some((note) => note.organization_id !== owner.organizationId || note.status !== "accepted" || note.origin !== "human")) throw new PersistenceError("FORBIDDEN", 403);
    }
    return {
      blueprint,
      blueprintRevision: blueprintResult.data.revision,
      blueprintProvenanceHash: blueprintResult.data.provenance_hash,
      rulePackVersion: blueprintResult.data.rule_pack_version,
      catalogueVersion: catalogue.data?.semantic_version ?? blueprint.sourceIdentity.catalogueVersion,
      sourceArtifactIds: blueprintResult.data.source_artifact_ids ?? [],
      advisorRunIds: runIds,
      advisorReviewIds: (reviews.data ?? []).map((row) => row.id),
      acceptedNotes: notes.map((note) => acceptedConsultantNoteSchema.parse({ id: note.id, body: note.body, authorUserId: note.author_user_id, acceptedAt: note.accepted_at, sourceDraftId: note.source_draft_id })).sort((a, b) => a.id.localeCompare(b.id)),
    };
  }

  async findByRenderKey(owner: OwnershipContext, renderKey: string) {
    const { data, error } = await this.db.from("report_artifacts").select("*").eq("render_key", renderKey).maybeSingle();
    if (error) failure(error);
    if (!data) return null;
    await this.assertOwner(owner, data.assessment_session_id);
    return artifact(data);
  }

  async reserve(input: ReserveReportInput) {
    await this.assertOwner(input.owner, input.request.assessmentSessionId);
    const latest = await this.db.from("report_artifacts").select("id,report_version").eq("blueprint_id", input.request.blueprintId).order("report_version", { ascending: false }).limit(1);
    if (latest.error) failure(latest.error);
    const reportVersion = Number(latest.data?.[0]?.report_version ?? 0) + 1;
    const id = crypto.randomUUID();
    const reportNumber = `MP-${input.request.blueprintId.replaceAll("-", "").slice(0, 12).toUpperCase()}-R${reportVersion}`;
    const ownerColumns = input.owner.kind === "organization" ? { organization_id: input.owner.organizationId, guest_session_id: null, created_by: input.owner.userId } : { organization_id: null, guest_session_id: input.owner.guestSessionId, created_by: null };
    const row: Record<string, unknown> = {
      id, assessment_session_id: input.request.assessmentSessionId, blueprint_id: input.request.blueprintId, blueprint_revision: input.source.blueprintRevision,
      report_number: reportNumber, report_version: reportVersion, render_key: input.renderKey, provenance_hash: input.provenanceHash,
      selected_note_ids: input.source.acceptedNotes.map((note) => note.id), advisor_run_ids: input.source.advisorRunIds, advisor_review_ids: input.source.advisorReviewIds,
      source_artifact_ids: input.source.sourceArtifactIds, renderer_version: REPORT_RENDERER_VERSION, template_version: REPORT_TEMPLATE_VERSION,
      schema_version: REPORT_SCHEMA_VERSION, rule_pack_version: input.source.rulePackVersion, catalogue_version: input.source.catalogueVersion,
      locale: input.request.locale, request_id: input.requestId, generated_at: input.generatedAt, status: "pending", mime_type: "application/pdf", ...ownerColumns,
    };
    const { data, error } = await this.db.from("report_artifacts").insert(row).select("*").single();
    if (error) failure(error);
    return artifact(data);
  }

  async complete(owner: OwnershipContext, reportId: string, bytes: Uint8Array, pageCount: number, sha256: string, completedAt: string) {
    const current = await this.db.from("report_artifacts").select("*").eq("id", reportId).maybeSingle();
    if (current.error) failure(current.error);
    if (!current.data) throw new PersistenceError("NOT_FOUND", 404);
    await this.assertOwner(owner, current.data.assessment_session_id);
    const prefix = owner.kind === "organization" ? owner.organizationId : `guest/${owner.guestSessionId}`;
    const objectPath = `${prefix}/reports/${reportId}.pdf`;
    const upload = await this.db.storage.from(REPORT_BUCKET).upload(objectPath, bytes, { contentType: "application/pdf", upsert: false, cacheControl: "0" });
    if (upload.error) failure(upload.error);
    const updated = await this.db.from("report_artifacts").update({ status: "completed", content_sha256: sha256, object_path: objectPath, storage_bucket: REPORT_BUCKET, byte_length: bytes.byteLength, page_count: pageCount, completed_at: completedAt }).eq("id", reportId).eq("status", "pending").select("*").single();
    if (updated.error) {
      await this.db.storage.from(REPORT_BUCKET).remove([objectPath]);
      failure(updated.error);
    }
    return artifact(updated.data);
  }

  async fail(owner: OwnershipContext, reportId: string, category: string) {
    const current = await this.db.from("report_artifacts").select("assessment_session_id").eq("id", reportId).maybeSingle();
    if (current.error) failure(current.error);
    if (!current.data) return;
    await this.assertOwner(owner, current.data.assessment_session_id);
    const { error } = await this.db.from("report_artifacts").update({ status: "failed", failure_category: category.slice(0, 80) }).eq("id", reportId).eq("status", "pending");
    if (error) failure(error);
  }

  async list(owner: OwnershipContext, assessmentSessionId: string) {
    await this.assertOwner(owner, assessmentSessionId);
    const { data, error } = await this.db.from("report_artifacts").select("*").eq("assessment_session_id", assessmentSessionId).order("report_version", { ascending: false });
    if (error) failure(error);
    return (data ?? []).map(artifact);
  }

  async createSignedDownload(owner: OwnershipContext, reportId: string, expiresInSeconds: number) {
    const { data, error } = await this.db.from("report_artifacts").select("id,assessment_session_id,status,storage_bucket,object_path").eq("id", reportId).maybeSingle();
    if (error) failure(error);
    if (!data) throw new PersistenceError("NOT_FOUND", 404);
    await this.assertOwner(owner, data.assessment_session_id);
    if (data.status !== "completed" || !data.storage_bucket || !data.object_path) throw new PersistenceError("NOT_FOUND", 404);
    const signed = await this.db.storage.from(data.storage_bucket).createSignedUrl(data.object_path, expiresInSeconds, { download: `${reportId}.pdf` });
    if (signed.error) failure(signed.error);
    return { reportId, url: signed.data.signedUrl, expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString() };
  }
}
