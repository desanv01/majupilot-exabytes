import "server-only";

import { deterministicRetryDelaySeconds } from "./retry-policy";
import { SignedWebhookAdapter } from "./signed-webhook-adapter";
import { SupabaseOutboxRepository } from "./supabase-outbox-repository";

function webhookConfig() {
  const url = process.env.OUTBOX_WEBHOOK_URL;
  const secret = process.env.OUTBOX_WEBHOOK_SECRET;
  if (!url || !secret) return undefined;
  return { url, secret, keyId: process.env.OUTBOX_WEBHOOK_KEY_ID };
}

export class OutboxWorker {
  constructor(private readonly repository = new SupabaseOutboxRepository()) {}

  async processBatch(workerId: string, limit = 10) {
    const claimed = await this.repository.claim(workerId, limit);
    const config = webhookConfig();
    const adapter = config ? new SignedWebhookAdapter(config) : undefined;
    const outcomes: Array<{ eventId: string; outcome: string }> = [];

    for (const item of claimed) {
      let result = item.adapter_key === "signed_webhook" && adapter
        ? await adapter.deliver(item)
        : { outcome: "dead_letter" as const, errorCategory: "configuration" as const, errorCode: "WEBHOOK_NOT_CONFIGURED" };
      let retry = result.outcome === "retry" && item.attempt_count < item.max_attempts;
      const delay = retry ? deterministicRetryDelaySeconds(item.id, item.attempt_count, result.retryAfterSeconds) : undefined;
      const nextRetryMs = delay ? Date.now() + delay * 1_000 : undefined;
      if (nextRetryMs && nextRetryMs > Date.parse(item.created_at) + 24 * 60 * 60 * 1_000) {
        result = { outcome: "dead_letter", errorCategory: "provider", errorCode: "RETRY_HORIZON_EXHAUSTED", statusCode: result.statusCode };
        retry = false;
      }
      const nextRetryAt = retry && nextRetryMs ? new Date(nextRetryMs).toISOString() : undefined;
      await this.repository.finish(item, workerId, result, nextRetryAt);
      outcomes.push({ eventId: item.id, outcome: retry ? "retry_wait" : result.outcome });
    }
    return { claimed: claimed.length, outcomes };
  }
}

export function outboxConfigurationStatus() {
  return { adapter: "signed_webhook", configured: Boolean(process.env.OUTBOX_WEBHOOK_URL && process.env.OUTBOX_WEBHOOK_SECRET) };
}
