import "server-only";

import type { AccountCaseSnapshot } from "@/domain/account-cases";
import { PersistenceError, type OwnershipContext } from "@/domain/persistence";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";

function failure(error: { code?: string; message: string } | null): never {
  if (error?.code === "23505") throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
  throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: error });
}

function organization(owner: OwnershipContext) {
  if (owner.kind !== "organization") throw new PersistenceError("FORBIDDEN", 403);
  return owner.organizationId;
}

export class AccountCaseRepository {
  private readonly db = createAdminSupabaseClient();

  async ensurePersonalWorkspace(userId: string) {
    const result = await this.db.rpc("ensure_personal_workspace", { p_user_id: userId });
    if (result.error) failure(result.error);
    return String(result.data);
  }

  async list(owner: OwnershipContext) {
    const organizationId = organization(owner);
    const cases = await this.db.from("assessment_sessions")
      .select("id,state,created_at,updated_at")
      .eq("organization_id", organizationId)
      .neq("state", "deletion_pending")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (cases.error) failure(cases.error);
    const rows = cases.data ?? [];
    if (!rows.length) return [];
    const snapshots = await this.db.from("assessment_case_snapshots")
      .select("assessment_session_id,revision,payload,updated_at")
      .in("assessment_session_id", rows.map((row) => row.id));
    if (snapshots.error) failure(snapshots.error);
    const byId = new Map((snapshots.data ?? []).map((row) => [row.assessment_session_id, row]));
    return rows.map((row) => {
      const snapshot = byId.get(row.id);
      const payload = snapshot?.payload as { draft?: { answers?: { q1?: { businessName?: unknown } } }; diagnostic?: unknown; recommendations?: unknown; comparison?: unknown; blueprint?: unknown } | undefined;
      const name = payload?.draft?.answers?.q1?.businessName;
      const progress = payload?.blueprint ? "Blueprint ready" : payload?.comparison ? "Comparing scenarios" : payload?.recommendations ? "Reviewing recommendations" : payload?.diagnostic ? "Reviewing results" : snapshot ? "Assessment in progress" : "Not started";
      return {
        id: row.id,
        state: row.state,
        progress,
        businessName: typeof name === "string" && name.trim() ? name.slice(0, 160) : "Untitled case",
        revision: snapshot?.revision ?? 0,
        createdAt: row.created_at,
        updatedAt: snapshot?.updated_at ?? row.updated_at,
      };
    });
  }

  async create(owner: OwnershipContext) {
    const inserted = await this.db.from("assessment_sessions")
      .insert({ id: crypto.randomUUID(), organization_id: organization(owner), created_by: owner.kind === "organization" ? owner.userId : null, schema_version: "1.0.0" })
      .select("id,state,created_at,updated_at").single();
    if (inserted.error) failure(inserted.error);
    return inserted.data;
  }

  async get(owner: OwnershipContext, caseId: string) {
    const record = await this.db.from("assessment_sessions")
      .select("id,state,created_at,updated_at")
      .eq("id", caseId).eq("organization_id", organization(owner)).maybeSingle();
    if (record.error) failure(record.error);
    if (!record.data || record.data.state === "deletion_pending") throw new PersistenceError("NOT_FOUND", 404);
    const snapshot = await this.db.from("assessment_case_snapshots")
      .select("revision,payload,updated_at")
      .eq("assessment_session_id", caseId).maybeSingle();
    if (snapshot.error) failure(snapshot.error);
    return { ...record.data, revision: snapshot.data?.revision ?? 0, snapshot: snapshot.data?.payload ?? null, snapshotUpdatedAt: snapshot.data?.updated_at ?? null };
  }

  async save(owner: OwnershipContext, caseId: string, expectedRevision: number, payload: AccountCaseSnapshot) {
    await this.get(owner, caseId);
    const row = { assessment_session_id: caseId, revision: expectedRevision + 1, payload, updated_at: new Date().toISOString() };
    if (expectedRevision === 0) {
      const inserted = await this.db.from("assessment_case_snapshots").insert(row).select("revision,updated_at").single();
      if (inserted.error) failure(inserted.error);
      return { revision: inserted.data.revision, updatedAt: inserted.data.updated_at };
    }
    const updated = await this.db.from("assessment_case_snapshots")
      .update(row).eq("assessment_session_id", caseId).eq("revision", expectedRevision)
      .select("revision,updated_at").maybeSingle();
    if (updated.error) failure(updated.error);
    if (!updated.data) throw new PersistenceError("IDEMPOTENCY_CONFLICT", 409);
    return { revision: updated.data.revision, updatedAt: updated.data.updated_at };
  }
}
