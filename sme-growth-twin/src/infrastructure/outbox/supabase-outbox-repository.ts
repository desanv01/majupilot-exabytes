import "server-only";

import { claimedOutboxItemSchema, type ClaimedOutboxItem, type DeliveryResult } from "@/domain/workflow-outbox";
import { PersistenceError } from "@/domain/persistence";
import { createAdminSupabaseClient } from "@/infrastructure/supabase/admin";

export class SupabaseOutboxRepository {
  private readonly db = createAdminSupabaseClient();

  async assertOperator(userId: string) {
    const result = await this.db.from("organization_members").select("id").eq("user_id", userId).eq("status", "active").eq("role", "system_admin").limit(1);
    if (result.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: result.error });
    if (!result.data?.length) throw new PersistenceError("FORBIDDEN", 403);
  }

  async claim(worker: string, limit = 10, leaseSeconds = 60): Promise<ClaimedOutboxItem[]> {
    const result = await this.db.rpc("claim_workflow_outbox", { p_worker: worker, p_limit: limit, p_lease_seconds: leaseSeconds });
    if (result.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: result.error });
    return (result.data ?? []).map((item: unknown) => claimedOutboxItemSchema.parse(item));
  }

  async finish(item: ClaimedOutboxItem, worker: string, result: DeliveryResult, nextRetryAt?: string) {
    const stored = await this.db.rpc("finish_workflow_outbox_attempt", {
      p_outbox_id: item.id,
      p_worker: worker,
      p_outcome: result.outcome,
      p_next_retry_at: nextRetryAt ?? null,
      p_status_code: result.statusCode ?? null,
      p_provider_request_id: result.providerRequestId ?? null,
      p_error_category: result.errorCategory ?? null,
      p_error_code: result.errorCode ?? null,
      p_safe_metadata: result.safeMetadata ?? {},
    });
    if (stored.error) throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: stored.error });
  }

  async replay(originalId: string, replayKey: string, correlationId: string) {
    const result = await this.db.rpc("replay_workflow_outbox", { p_original_id: originalId, p_replay_key: replayKey, p_correlation_id: correlationId });
    if (result.error) {
      if (result.error.message.includes("OUTBOX_NOT_REPLAYABLE")) throw new PersistenceError("VALIDATION_FAILED", 422);
      throw new PersistenceError("INTERNAL_RETRYABLE", 503, { cause: result.error });
    }
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return { eventId: row.id as string, state: row.state as string, replayOfEventId: row.replay_of_outbox_id as string };
  }
}
