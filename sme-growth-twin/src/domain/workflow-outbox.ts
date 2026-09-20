import { z } from "zod";

export const outboxStateSchema = z.enum(["pending", "leased", "retry_wait", "completed", "dead_letter"]);

export const outboxEnvelopeSchema = z.object({
  eventId: z.uuid(),
  eventType: z.string().min(1).max(120),
  eventVersion: z.string().min(1).max(32),
  occurredAt: z.iso.datetime({ offset: true }),
  aggregateId: z.uuid(),
  idempotencyKey: z.string().min(8).max(160),
  data: z.record(z.string(), z.unknown()),
}).strict();

export const claimedOutboxItemSchema = z.object({
  id: z.uuid(),
  aggregate_type: z.string(),
  aggregate_id: z.uuid(),
  event_type: z.string(),
  event_version: z.string(),
  idempotency_key: z.string(),
  correlation_id: z.string(),
  adapter_key: z.string(),
  destination_key: z.string(),
  state: z.literal("leased"),
  attempt_count: z.number().int().nonnegative(),
  max_attempts: z.number().int().positive(),
  payload: z.record(z.string(), z.unknown()),
  payload_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  created_at: z.iso.datetime({ offset: true }),
  lease_owner: z.string(),
}).passthrough();

export type ClaimedOutboxItem = z.infer<typeof claimedOutboxItemSchema>;

export type DeliveryResult = {
  outcome: "succeeded" | "retry" | "dead_letter";
  statusCode?: number;
  providerRequestId?: string;
  errorCategory?: "network" | "provider" | "configuration" | "signature";
  errorCode?: string;
  retryAfterSeconds?: number;
  safeMetadata?: Record<string, string | number | boolean>;
};
