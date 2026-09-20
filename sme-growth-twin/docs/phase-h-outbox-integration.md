# Phase H — Durable outbox and minimal application integration

Phase H extends the Phase B `workflow_outbox` table instead of introducing a provider-specific queue. A durable lead insert now enqueues one minimized `lead.consultation_requested` delivery record and appends `delivery.enqueued` inside the same database transaction. Provider delivery begins only after that transaction commits; delivery state never updates lead identity, status, assignment, consent, or report references.

## Delivery lifecycle

- `public.claim_workflow_outbox` leases eligible work with `FOR UPDATE SKIP LOCKED`. Expired leases are reclaimable after a worker restart only while attempts remain; an expired final lease is atomically dead-lettered with one idempotent lead audit event.
- Every claim increments `attempt_count` and writes `workflow_outbox_attempts` with a unique provider delivery key.
- Retry delays use the frozen 1 minute, 5 minute, 15 minute, 30 minute, 1 hour, 2 hour, 6 hour, and 12 hour schedule with deterministic event/attempt-derived jitter.
- `Retry-After` is accepted only for retryable outcomes and capped at one hour. The total retry horizon is capped at 24 hours from creation.
- Exhaustion and permanent failures move to `dead_letter`; successful work moves to `completed`. Both are terminal for that delivery lineage.
- Replay is limited to an authenticated system administrator, creates a new outbox row linked by `replay_of_outbox_id`, and requires a unique explicit replay key. The domain event type, aggregate, payload, and payload hash are preserved.

Raw payloads and attempt rows have RLS enabled and no browser-role grants. Operator routes return only safe event IDs, state, counts, and redacted result codes.

## Signed webhook adapter

The first adapter uses only the approved Phase H variables:

- `OUTBOX_WEBHOOK_URL`
- `OUTBOX_WEBHOOK_SECRET`
- `OUTBOX_WEBHOOK_KEY_ID`

`OUTBOX_WEBHOOK_URL` must be HTTPS and its exact hostname is the destination allowlist. URL credentials are rejected. DNS is resolved before delivery, every result is checked against private, loopback, link-local, reserved, multicast, and mapped-loopback ranges, and the request is pinned to a validated address while TLS continues to verify the configured hostname. Redirects are not followed.

The canonical JSON envelope is `{ eventId, eventType, eventVersion, occurredAt, aggregateId, idempotencyKey, data }`. The signature is `HMAC-SHA256(timestamp + "." + canonical_body)`. No report bytes, signed URLs, raw consent wording, or contact payload is delivered. Responses are drained but never stored; only status, a syntax-checked provider request ID, timestamp, and stable redacted error categories/codes are retained.

The explicit insecure-localhost option exists only as an injected test adapter option. It is not available through production environment configuration.

## Application boundary

`/v2` is the smallest stable presentation addition. It links to the accepted assessment, Blueprint/report, and consultation surfaces, describes the authenticated Transformation Copilot API boundary, and exposes `/api/v2/integration/status`. It intentionally does not redesign the V1 journey, add a second assessment UI, enable document RAG, or claim Phase I deployment/release proof.

Outbox operations are intentionally narrow:

- `POST /api/v2/outbox/process` — authenticated system administrator; processes a bounded batch.
- `POST /api/v2/outbox/events/:id/replay` — authenticated system administrator; replays one dead-letter event with an explicit unique replay key.

A production scheduler and hosted webhook credential remain deployment-environment work. Phase H proves the durable contract locally without inventing external delivery evidence.
