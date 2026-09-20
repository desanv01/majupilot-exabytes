# Phase F: durable lead and salesperson core

Phase F turns an authorized assessment into one durable lead without adding Copilot, delivery, webhook, email, CRM, or UI behavior.

## Consultation transaction

`POST /api/v2/leads` accepts the exact assessment, Blueprint revision, completed canonical report and SHA-256, two current consent grant IDs, an idempotency key, minimum contact data, and optional region/language. The server derives ownership and capability tags. A single database transaction then:

1. locks and verifies the assessment owner;
2. verifies the immutable Blueprint revision and same-owner completed Phase E report/hash;
3. verifies that the supplied `consultation_contact` and `report_share_with_sales` grants are current, unexpired, unwithdrawn, and scoped to that Blueprint/report;
4. acquires the assessment/idempotency key and returns the existing receipt for an identical replay, or `IDEMPOTENCY_CONFLICT` for a different request hash;
5. serializes assignment selection, evaluates the versioned fictional roster, capacity, region, language, capability overlap, trailing-30-day load, and stable-key tie break;
6. creates the lead, assignment or truthful `unassigned` queue result, and four append-only events.

The lead stores `phase-f-consent-snapshot-1.0.0`, both immutable consent identities and versions, the exact report version/hash, assignment inputs, algorithm `deterministic-roster-load-1.0.0`, roster `demo-roster-1.0.0`, request/correlation provenance, and immutable ownership. Phase F creates no outbox event; delivery remains Phase H.

## Read APIs and authorization

- `GET /api/v2/leads` returns a bounded safe list for the current guest/organization owner or authorized staff member.
- `GET /api/v2/leads/{id}` returns the salesperson pre-call projection only to the assigned active roster account, a team-authorized consultant, a scoped sales manager, or a system admin.
- `GET /api/v2/leads/{id}/assignment` returns the current fictional-demo assignment label and algorithm provenance to the same internal roles.
- `GET /api/v2/leads/{id}/events` returns append-only audit history to the same internal roles.
- `GET /api/v2/leads/{id}/report-download` re-authorizes the internal reader and mints a 30-second-to-15-minute private signed download; the URL is never persisted.

Organization membership, active assignment, team scope, and roster mapping are checked from persisted records. User-editable metadata and the service key are never authorization sources. Guests and prospects do not receive internal salesperson detail. Cross-tenant, revoked guest, anonymous, and inactive-member access fails closed.

The salesperson projection contains only the linked assessment/Blueprint context, contact and consent restrictions, exact report metadata, accepted consultant notes, current assignment, and approved pre-call facts. It excludes guest tokens, model prompts/reasoning, provider secrets, outbox payloads, other tenant data, and unrelated members.

## Operational boundary

The migration seeds only the three frozen fictional demo personas and the `unassigned` queue, without personal endpoints. A real assigned salesperson requires an approved roster update that maps a roster entry to an active Auth user. Hosted V2 Supabase still requires migration application and environment-specific verification; local success is not a hosted-deployment claim.

Focused validation is:

```text
npm exec -- vitest run tests/unit/phase-f-lead-sales.test.ts tests/unit/phase-e-routes.test.ts
npm run type-check
npm run lint
supabase db reset --local --no-seed
supabase test db --local
supabase migration list --local
supabase db lint --local
supabase db advisors --local
```
