import "server-only";

import { createHash } from "node:crypto";

import { canonicalJson } from "@/core/reports/canonical-json";
import {
  COPILOT_SCHEMA_VERSION,
  copilotMessageSchema,
  copilotReadToolInputSchema,
  copilotSessionSchema,
  copilotWriteToolInputSchemas,
  type CopilotReadToolName,
  type CopilotWriteToolName,
  type CreateCopilotSession,
} from "@/domain/copilot";
import type { ModelCallTelemetry } from "@/domain/ai-execution";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";
import { SupabasePersistenceRepository } from "@/infrastructure/persistence/supabase-repository";
import { DurableLeadService } from "@/infrastructure/leads/durable-lead-service";
import { SupabaseDurableLeadRepository } from "@/infrastructure/leads/supabase-durable-lead-repository";

import type { AppendCopilotMessage, CopilotConfirmation, CopilotRepository } from "./copilot-repository";

type Row = Record<string, unknown>;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const canonical = (value: unknown) => canonicalJson(value);

function failure(error: { message?: string; code?: string } | null): never {
  const message = error?.message ?? "";
  if (/FORBIDDEN|42501/.test(`${message}${error?.code ?? ""}`)) throw new PersistenceError("FORBIDDEN", 403, { cause: error });
  if (/CHAT_NOT_FOUND|PGRST116/.test(`${message}${error?.code ?? ""}`)) throw new PersistenceError("NOT_FOUND", 404, { cause: error });
  if (/23505|IDEMPOTENCY_CONFLICT/.test(`${message}${error?.code ?? ""}`)) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409, { cause: error });
  throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: error });
}

const sessionView = (row: Row) => copilotSessionSchema.parse({
  id: row.id,
  assessmentSessionId: row.assessment_session_id,
  businessTwinId: row.business_twin_id,
  blueprintId: row.blueprint_id,
  status: row.status,
  nextSequence: row.next_sequence,
  schemaVersion: row.schema_version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const messageView = (row: Row) => copilotMessageSchema.parse({
  id: row.id,
  chatSessionId: row.chat_session_id,
  sequence: row.sequence,
  turnId: row.turn_id,
  role: row.role,
  text: row.text_content,
  toolName: row.tool_name,
  toolCallId: row.tool_call_id,
  toolPayload: row.tool_provenance,
  modelCallId: row.model_call_id,
  executionState: row.execution_state,
  schemaVersion: row.schema_version,
  createdAt: row.created_at,
});

export class SupabaseCopilotRepository implements CopilotRepository {
  private readonly db = createAdminSupabaseClient();
  private readonly persistence = new SupabasePersistenceRepository();

  private async authorize(owner: OwnershipContext, sessionId: string) {
    const result = await this.db.from("chat_sessions").select("*").eq("id", sessionId).maybeSingle();
    if (result.error) failure(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    const row = result.data as Row;
    await this.persistence.assertAssessmentAccess(owner, String(row.assessment_session_id));
    if (owner.kind === "guest" && row.guest_session_id !== owner.guestSessionId) throw new PersistenceError("FORBIDDEN", 403);
    if (owner.kind === "organization" && row.organization_id !== owner.organizationId) throw new PersistenceError("NOT_FOUND", 404);
    return row;
  }

  async createOrResume(owner: OwnershipContext, input: CreateCopilotSession) {
    await this.persistence.assertAssessmentAccess(owner, input.assessmentSessionId);
    const ownerFilters = owner.kind === "guest" ? { guest_session_id: owner.guestSessionId, organization_id: null } : { organization_id: owner.organizationId, guest_session_id: null };
    const existing = await this.db.from("chat_sessions").select("*").eq("assessment_session_id", input.assessmentSessionId).eq("idempotency_key", input.idempotencyKey).maybeSingle();
    if (existing.error) failure(existing.error);
    if (existing.data) return sessionView(existing.data as Row);
    for (const [table, id] of [["business_twins", input.businessTwinId], ["blueprints", input.blueprintId]] as const) {
      if (!id) continue;
      const check = await this.db.from(table).select("id").eq("id", id).eq("assessment_session_id", input.assessmentSessionId).maybeSingle();
      if (check.error) failure(check.error);
      if (!check.data) throw new PersistenceError("NOT_FOUND", 404);
    }
    const inserted = await this.db.from("chat_sessions").insert({
      id: crypto.randomUUID(), assessment_session_id: input.assessmentSessionId, business_twin_id: input.businessTwinId ?? null,
      blueprint_id: input.blueprintId ?? null, idempotency_key: input.idempotencyKey, schema_version: COPILOT_SCHEMA_VERSION,
      prompt_version: "phase-g-copilot-1.0.0", ...ownerFilters,
    }).select("*").single();
    if (inserted.error) failure(inserted.error);
    return sessionView(inserted.data as Row);
  }

  async getSession(owner: OwnershipContext, sessionId: string) { return sessionView(await this.authorize(owner, sessionId)); }

  async history(owner: OwnershipContext, sessionId: string, afterSequence = 0, limit = 100) {
    await this.authorize(owner, sessionId);
    const result = await this.db.from("chat_messages").select("*").eq("chat_session_id", sessionId).gt("sequence", afterSequence).order("sequence", { ascending: true }).limit(Math.min(limit, 200));
    if (result.error) failure(result.error);
    return (result.data ?? []).map((row) => messageView(row as Row));
  }

  async findTurn(owner: OwnershipContext, sessionId: string, idempotencyKey: string) {
    await this.authorize(owner, sessionId);
    const result = await this.db.from("copilot_turn_receipts").select("turn_id,response").eq("chat_session_id", sessionId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (result.error) failure(result.error);
    return result.data ? { turnId: result.data.turn_id, response: result.data.response as Record<string, unknown> } : null;
  }

  async rememberTurn(owner: OwnershipContext, sessionId: string, idempotencyKey: string, turnId: string, response: Record<string, unknown>) {
    await this.authorize(owner, sessionId);
    const result = await this.db.from("copilot_turn_receipts").insert({ chat_session_id: sessionId, idempotency_key: idempotencyKey, turn_id: turnId, response, response_sha256: sha256(canonical(response)) });
    if (result.error) failure(result.error);
  }

  async appendMessage(owner: OwnershipContext, sessionId: string, message: AppendCopilotMessage) {
    await this.authorize(owner, sessionId);
    const parts = message.text === null ? [] : [{ type: "text", text: message.text }];
    const result = await this.db.rpc("append_copilot_message", {
      p_chat_session_id: sessionId, p_message_id: message.id, p_turn_id: message.turnId, p_role: message.role,
      p_message_type: message.messageType, p_text_content: message.text, p_tool_name: message.toolName ?? null,
      p_tool_call_id: message.toolCallId ?? null, p_parts: parts, p_tool_provenance: message.toolPayload ?? null,
      p_model_call_id: message.modelCallId ?? null, p_execution_state: message.executionState ?? null,
      p_content_sha256: sha256(canonical({ text: message.text, tool: message.toolName, payload: message.toolPayload })), p_schema_version: COPILOT_SCHEMA_VERSION,
    });
    if (result.error) failure(result.error);
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    const loaded = await this.db.from("chat_messages").select("*").eq("id", row.message_id).single();
    if (loaded.error) failure(loaded.error);
    return messageView(loaded.data as Row);
  }

  private async exactArtifact(table: string, assessmentSessionId: string, id?: string, columns = "*") {
    let query = this.db.from(table).select(columns).eq("assessment_session_id", assessmentSessionId);
    if (id) query = query.eq("id", id); else query = query.order("created_at", { ascending: false }).limit(1);
    const result = await query.maybeSingle();
    if (result.error) failure(result.error);
    if (!result.data) throw new PersistenceError("NOT_FOUND", 404);
    return result.data as unknown as Row;
  }

  async invokeReadTool(owner: OwnershipContext, session: ReturnType<typeof sessionView>, toolName: CopilotReadToolName, rawInput: unknown) {
    const input = copilotReadToolInputSchema.parse(rawInput);
    await this.authorize(owner, session.id);
    const assessment = session.assessmentSessionId;
    const requireSame = async (table: string, id: string | undefined, columns = "*") => this.exactArtifact(table, assessment, id, columns);
    switch (toolName) {
      case "getBusinessTwinSummary": return { twin: (await requireSame("business_twins", input.businessTwinId ?? session.businessTwinId ?? undefined, "id,revision,payload,schema_version,created_at")) };
      case "getEvidenceForClaim": {
        let query = this.db.from("evidence_items").select("id,business_twin_id,source_kind,source_ref,payload,status,schema_version,created_at").eq("assessment_session_id", assessment).eq("status", "active").limit(50);
        if (input.evidenceId) query = query.eq("id", input.evidenceId);
        const result = await query; if (result.error) failure(result.error); if (input.evidenceId && !result.data?.length) throw new PersistenceError("NOT_FOUND", 404); return { evidence: result.data ?? [] };
      }
      case "explainDigitalMaturity": case "explainAiReadiness": case "listPainPoints": {
        const run = await requireSame("diagnostic_runs", input.diagnosticRunId, "id,business_twin_id,payload,schema_version,rule_pack_version,source_artifact_ids,created_at");
        const payload = run.payload as Record<string, unknown>;
        return toolName === "explainDigitalMaturity" ? { diagnosticRunId: run.id, digitalMaturity: payload.digitalMaturity, evidenceRefs: run.source_artifact_ids }
          : toolName === "explainAiReadiness" ? { diagnosticRunId: run.id, aiReadiness: payload.aiReadiness, evidenceRefs: run.source_artifact_ids }
          : { diagnosticRunId: run.id, painPoints: payload.painPoints, evidenceRefs: run.source_artifact_ids };
      }
      case "listRecommendations": return { recommendation: await requireSame("recommendation_runs", input.recommendationRunId, "id,payload,catalogue_version_id,schema_version,rule_pack_version,source_artifact_ids,created_at") };
      case "compareScenarios": {
        const revisionId = input.scenarioRevisionId;
        let query = this.db.from("scenario_revisions").select("*,scenario_comparisons!inner(assessment_session_id)").eq("scenario_comparisons.assessment_session_id", assessment).order("revision", { ascending: false }).limit(1);
        if (revisionId) query = query.eq("id", revisionId);
        const result = await query.maybeSingle(); if (result.error) failure(result.error); if (!result.data) throw new PersistenceError("NOT_FOUND", 404); return { scenarioRevision: result.data };
      }
      case "searchExabytesCatalogue": {
        const result = await this.db.from("public_catalogue_offerings").select("*").limit(50); if (result.error) failure(result.error); return { offerings: result.data ?? [] };
      }
      case "getBlueprint": return { blueprint: await requireSame("blueprints", input.blueprintId ?? session.blueprintId ?? undefined, "id,revision,payload,schema_version,rule_pack_version,catalogue_version_id,source_artifact_ids,provenance_hash,created_at") };
      case "getReportMetadata": return { report: await requireSame("report_artifacts", input.reportArtifactId, "id,blueprint_id,report_number,report_version,status,content_sha256,provenance_hash,mime_type,byte_length,page_count,created_at,completed_at") };
      case "getLeadStatus": {
        if (owner.kind === "organization" && owner.role === "consultant") {
          if (!input.leadId) throw new PersistenceError("FORBIDDEN", 403);
          const detail = await new DurableLeadService(new SupabaseDurableLeadRepository()).detail({ kind: "staff", userId: owner.userId }, input.leadId);
          if (detail.assessmentSessionId !== assessment) throw new PersistenceError("NOT_FOUND", 404);
          return { leads: [{ id: detail.id, status: detail.status, assignmentState: detail.assignmentState, assignment: detail.assignment }] };
        }
        let query = this.db.from("leads").select("id,receipt_id,status,assignment_state,blueprint_id,report_artifact_id,created_at,updated_at").eq("assessment_session_id", assessment).limit(20);
        if (input.leadId) query = query.eq("id", input.leadId);
        const result = await query; if (result.error) failure(result.error); if (input.leadId && !result.data?.length) throw new PersistenceError("NOT_FOUND", 404); return { leads: result.data ?? [] };
      }
      case "getAcceptedConsultantNotes": {
        if (owner.kind !== "organization" || !["consultant", "sales_manager", "system_admin"].includes(owner.role)) throw new PersistenceError("FORBIDDEN", 403);
        if (owner.role === "consultant") {
          if (!input.leadId) throw new PersistenceError("FORBIDDEN", 403);
          const detail = await new DurableLeadService(new SupabaseDurableLeadRepository()).detail({ kind: "staff", userId: owner.userId }, input.leadId);
          if (detail.assessmentSessionId !== assessment) throw new PersistenceError("NOT_FOUND", 404);
        }
        const result = await this.db.from("consultant_notes").select("id,lead_id,body,author_user_id,accepted_at,source_draft_id,created_at").eq("assessment_session_id", assessment).eq("origin", "human").eq("status", "accepted").limit(50);
        if (result.error) failure(result.error); return { notes: result.data ?? [] };
      }
    }
  }

  async proposeWrite(owner: OwnershipContext, session: ReturnType<typeof sessionView>, turnId: string, toolName: CopilotWriteToolName, rawArgs: Record<string, unknown>, proposalKey: string, modelCallId?: string) {
    await this.authorize(owner, session.id);
    const args = copilotWriteToolInputSchemas[toolName].parse(rawArgs) as Record<string, unknown>;
    const existing = await this.db.from("copilot_tool_confirmations").select("*").eq("chat_session_id", session.id).eq("proposal_idempotency_key", proposalKey).maybeSingle();
    if (existing.error) failure(existing.error);
    if (existing.data) return this.confirmation(existing.data as Row);
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const inserted = await this.db.from("copilot_tool_confirmations").insert({ id, chat_session_id: session.id, turn_id: turnId, tool_name: toolName, arguments: args, arguments_sha256: sha256(canonical(args)), proposal_idempotency_key: proposalKey, proposed_by_model_call_id: modelCallId ?? null, expires_at: expiresAt }).select("*").single();
    if (inserted.error) failure(inserted.error);
    const audit = await this.db.from("copilot_tool_audit_events").insert({ confirmation_id: id, chat_session_id: session.id, sequence: 1, event_type: "proposed", actor_kind: "model", safe_payload: { toolName, argumentsSha256: sha256(canonical(args)) } });
    if (audit.error) failure(audit.error);
    return this.confirmation(inserted.data as Row);
  }

  private confirmation(row: Row): CopilotConfirmation { return { id: String(row.id), chatSessionId: String(row.chat_session_id), turnId: String(row.turn_id), toolName: row.tool_name as CopilotWriteToolName, arguments: row.arguments as Record<string, unknown>, status: row.status as CopilotConfirmation["status"], expiresAt: String(row.expires_at), result: row.result as Record<string, unknown> | null }; }

  async claimConfirmation(owner: OwnershipContext, confirmationId: string, executionKey: string) {
    const found = await this.db.from("copilot_tool_confirmations").select("*").eq("id", confirmationId).maybeSingle();
    if (found.error) failure(found.error); if (!found.data) throw new PersistenceError("NOT_FOUND", 404);
    const row = found.data as Row; await this.authorize(owner, String(row.chat_session_id));
    if (row.status === "executed" && row.execution_idempotency_key === executionKey) return this.confirmation(row);
    if (row.status !== "pending" || new Date(String(row.expires_at)).getTime() <= Date.now()) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
    const update = await this.db.from("copilot_tool_confirmations").update({ status: "executing", execution_idempotency_key: executionKey, confirmed_by_user_id: owner.kind === "organization" ? owner.userId : null, confirmed_by_guest_session_id: owner.kind === "guest" ? owner.guestSessionId : null, confirmed_at: new Date().toISOString() }).eq("id", confirmationId).eq("status", "pending").select("*").single();
    if (update.error) failure(update.error);
    const audit = await this.db.from("copilot_tool_audit_events").insert({ confirmation_id: confirmationId, chat_session_id: row.chat_session_id, sequence: 2, event_type: "confirmed", actor_kind: owner.kind === "guest" ? "guest" : "user", actor_id: owner.kind === "guest" ? owner.guestSessionId : owner.userId, safe_payload: { executionKey } });
    if (audit.error) failure(audit.error);
    return this.confirmation(update.data as Row);
  }

  async completeConfirmation(owner: OwnershipContext, confirmationId: string, result: Record<string, unknown>) {
    const found = await this.db.from("copilot_tool_confirmations").select("*").eq("id", confirmationId).single(); if (found.error) failure(found.error); await this.authorize(owner, found.data.chat_session_id);
    const update = await this.db.from("copilot_tool_confirmations").update({ status: "executed", result, executed_at: new Date().toISOString() }).eq("id", confirmationId).eq("status", "executing").select("*").single(); if (update.error) failure(update.error);
    const audit = await this.db.from("copilot_tool_audit_events").insert({ confirmation_id: confirmationId, chat_session_id: found.data.chat_session_id, sequence: 3, event_type: "executed", actor_kind: "system", safe_payload: { resultRefs: Object.keys(result) } }); if (audit.error) failure(audit.error);
    return this.confirmation(update.data as Row);
  }

  async failConfirmation(owner: OwnershipContext, confirmationId: string, safeCode: string) {
    const found = await this.db.from("copilot_tool_confirmations").select("chat_session_id").eq("id", confirmationId).single(); if (found.error) failure(found.error); await this.authorize(owner, found.data.chat_session_id);
    const update = await this.db.from("copilot_tool_confirmations").update({ status: "failed", safe_error_code: safeCode, executed_at: new Date().toISOString() }).eq("id", confirmationId); if (update.error) failure(update.error);
    const audit = await this.db.from("copilot_tool_audit_events").insert({ confirmation_id: confirmationId, chat_session_id: found.data.chat_session_id, sequence: 3, event_type: "failed", actor_kind: "system", safe_payload: { safeCode } }); if (audit.error) failure(audit.error);
  }

  async appendModelCall(owner: OwnershipContext, sessionId: string, turnId: string, t: ModelCallTelemetry, toolNames: string[], finishReason: string | null) {
    await this.authorize(owner, sessionId);
    const result = await this.db.from("model_calls").insert({ id: t.id, assessment_session_id: t.assessmentSessionId, organization_id: owner.kind === "organization" ? owner.organizationId : null, operation: t.operation, provider: t.provider, model: t.model, schema_version: t.schemaVersion, prompt_version: t.promptVersion, started_at: t.startedAt, completed_at: t.completedAt, latency_ms: t.latencyMs, input_tokens: t.inputTokens, output_tokens: t.outputTokens, estimated_cost: t.estimatedCost, retry_count: t.retryCount, outcome: t.outcome, safe_error_code: t.fallbackReason, evidence_ids: t.evidenceRefs, chat_session_id: sessionId, turn_id: turnId, tool_names: toolNames, tool_call_count: toolNames.length, finish_reason: finishReason });
    if (result.error) failure(result.error);
  }

  getDailyModelSpend(owner: OwnershipContext) { return this.persistence.getDailyModelSpend(owner); }
}
