# Report, Lead, Assignment, and Outbox Contract

**Frozen:** 19 September 2026 (MYT)
**Owners:** Phase E (report/notes), Phase F (lead/assignment), Phase H (outbox/integration)

## 1. Immutable Blueprint-to-PDF contract

The canonical report is a deterministic projection of one immutable `blueprints` revision plus zero or more human-accepted consultant-note revisions explicitly selected at render time. It is not a browser printout and never reads mutable “current” state during rendering.

`report_artifacts` requires:

- `id`, `report_number`, `report_version`, `blueprint_id`, `blueprint_revision`, and `organization_id` or claim-scoped guest owner;
- `renderer_version`, `template_version`, `schema_version`, `rule_pack_version`, `catalogue_version`, selected accepted-note IDs, advisor run/review IDs, and source artifact IDs;
- generation timestamp, locale, byte length, MIME type, page count where available;
- `content_sha256` calculated from final PDF bytes and an immutable `provenance_hash` over canonical input identities;
- private Storage bucket/key, generation status, safe failure category, and creator/request ID;
- `supersedes_report_id` for a new version; old artifacts are never silently overwritten.

Required report sections: Exabytes branding, report/Blueprint IDs and versions, generation time, business summary, maturity/readiness, pain points/evidence, roadmap with 1–3/3–6/6–12 month interpretation, ROI formulas/ranges/assumptions/unestimated streams, capabilities and source-linked classified offerings, advisor findings/origin, limitations/missing evidence, and accepted consultant notes with human authorship. AI drafts are omitted or visibly labelled draft in an authorized preview; they are never published as accepted notes.

Renderer rules:

- Numbers, eligibility, ordering, costs, ROI, payback, and timeline values come only from the Blueprint/source revisions.
- Rendering is idempotent on `(blueprint_revision, template_version, accepted_note_set_hash, locale)`. The same inputs produce equivalent content; byte-level nondeterminism such as PDF metadata is normalized before hash/equality assertions.
- A completed artifact is immutable. Correction means a new Blueprint/report version.
- The bucket is private. Download first re-authorizes guest/organization/assignment scope, then creates a signed URL with a five-minute default and fifteen-minute maximum. URLs are never stored in the lead or emitted to logs.
- Lead attachment stores `report_artifact_id`, `report_version`, and `content_sha256`, not a signed URL. Report deletion/retention cannot leave a dangling “available” attachment.

## 2. Consultant-note provenance

`consultant_notes` is append-only and includes `origin = ai_draft | human`, `status = draft | accepted | rejected | superseded`, evidence/source IDs, AI model-call ID when applicable, human author member ID, accepted timestamp, and `supersedes_note_id`.

- `draftConsultantNote` can create only `ai_draft/draft` after authorization.
- `acceptConsultantNote` requires an authorized consultant/manager, explicit review, current lead scope, and creates a new `human/accepted` revision. It never flips an AI row to accepted.
- Rejection and supersession are events/revisions. Authorship and AI provenance remain visible to authorized users.
- Only accepted human revisions may enter the canonical report and salesperson projection as consultant advice.

## 3. Consultation transaction

Request contract: `idempotency_key`, exact `blueprint_id/revision`, completed `report_artifact_id/hash`, required current consent grant IDs, normalized minimum contact fields, optional region/language, and request correlation ID. Server derives guest/user/organization ownership.

One serializable transaction:

1. Lock and authorize the assessment/Blueprint/report subject.
2. Validate report completion/hash and current immutable consent grants for `consultation_contact` and `report_share_with_sales`.
3. Acquire unique `(subject_scope, idempotency_key)`; replay returns the original safe receipt.
4. Create the lead with exact Blueprint/report/consent references and no mutable report URL.
5. Run deterministic assignment against the roster snapshot and write one `lead_assignments` event (person or `unassigned` queue).
6. Write `lead.created`, `report.attached`, `consent.linked`, and `assignment.created` lead events.
7. Enqueue provider-neutral outbox events in the same database transaction.
8. Commit and return `{ receipt_id, lead_id, status, assignment_state }`; never return internal salesperson contact data or delivery secrets.

External delivery happens only after commit. Delivery failure cannot roll back, erase, or duplicate the lead.

## 4. Stable errors and idempotency

| Code | HTTP | Meaning/retry |
|---|---:|---|
| `UNAUTHENTICATED` | 401 | No valid account/guest credential; authenticate/resume |
| `FORBIDDEN` | 403 | Valid identity lacks scope; never reveal other record existence |
| `BLUEPRINT_NOT_FOUND` | 404 | No authorized exact revision |
| `REPORT_NOT_READY` | 409 | Canonical artifact incomplete/hash mismatch; generate/repair first |
| `CONSENT_REQUIRED` | 422 | Required purpose grant absent/withdrawn/version mismatch |
| `VALIDATION_FAILED` | 422 | Stable field issues; no provider message leakage |
| `IDEMPOTENCY_CONFLICT` | 409 | Key was used with a different canonical request hash |
| `ASSIGNMENT_UNAVAILABLE` | 202 receipt | Lead committed to unassigned queue; not a failed consultation |
| `RATE_LIMITED` | 429 | Bounded retry-after |
| `INTERNAL_RETRYABLE` | 503 | Transaction did not commit; same key may be retried |

Unique constraints cover consultation request keys, report render keys, assignment event sequence, lead event sequence, outbox idempotency key, and provider delivery key. A replay with the same key and canonical hash returns the original result; a different hash conflicts.

## 5. Deterministic demo roster

No approved real roster exists. Phase F seeds only these clearly fictional records, with no real email/phone/contact details:

| Stable key | Display label | Regions | Languages | Capability tags |
|---|---|---|---|---|
| `demo_sales_aina` | Aina Rahman — Fictional Demo Consultant | Malaysia, Central | English, Bahasa Malaysia | productivity, digital presence, CRM |
| `demo_sales_jian` | Jian Wei Tan — Fictional Demo Consultant | Malaysia, North | English, Mandarin | commerce, cloud, cybersecurity |
| `demo_sales_kavya` | Kavya Nair — Fictional Demo Consultant | Malaysia, South | English, Bahasa Malaysia, Tamil | AI readiness, automation, collaboration |
| `unassigned` | Unassigned consultation queue | All | Any | Any |

UI/API surfaces must include `fictional_demo: true` and “Fictional demo” labels. These records cannot receive external notifications at personal endpoints. Replacing them requires an owner-approved real roster, privacy review, and a new versioned roster snapshot.

## 6. Assignment algorithm

Inputs are normalized lead region/language, eligible recommendation capability tags, active roster snapshot, and each candidate's count of `assignment.created` events in the trailing 30 days (excluding reassignment and test rows outside the active demo partition).

1. Start with active non-queue candidates.
2. If region is known, retain exact region then `Malaysia`; if none match, keep all and record `region_fallback`.
3. If preferred language is known, retain matching candidates when at least one exists; otherwise record `language_fallback`.
4. Score capability overlap as the count of matching high-priority capability tags; retain candidates at the maximum score when maximum is greater than zero.
5. Choose the fewest recent new leads.
6. Tie-break by stable roster key ascending, never randomness or model judgment.
7. If no active candidate survives, assign queue `unassigned`.
8. Persist algorithm version, roster snapshot/version, normalized inputs, candidate IDs, load counts, tie-break result, reason, and actor. Reassignment is a new event with explicit reason and authorization.

The model may summarize assignment context but cannot choose or reassign a salesperson.

## 7. Authorized salesperson projection

An active assigned consultant, team-authorized consultant, or scoped sales manager may read:

- company/industry, employee band, budget band, pace/urgency, and preferred language/region;
- digital maturity and AI readiness with versions;
- top pain points with evidence references;
- selected scenario and revision, ROI assumptions/formulas/ranges/limitations;
- recommendations, prerequisites, classifications, official source links, and mapped offerings;
- advisor concerns, confidence/origin, missing evidence, and validation questions;
- exact report metadata and a newly authorized short-lived download;
- accepted consultant notes and separately labelled AI drafts if the reader can review them;
- current status, assignment/history, consent/contact restrictions, and first-call questions.

It excludes other organizations, raw model prompts/reasoning, service/provider credentials, guest tokens, internal security signals, withdrawn marketing consent, unrelated member data, and raw outbox payload/secrets. Prospects see only their own safe lead status, not internal roster load or notes not shared with them.

## 8. Lead, status, and assignment events

Lead statuses: `new`, `assigned`, `contact_pending`, `contacted`, `qualified`, `proposal`, `won`, `lost`, `closed`, `withdrawn`. Allowed transitions are server validated and versioned. Withdrawal blocks disallowed contact/delivery but preserves minimum audit evidence.

Append-only event types:

- `lead.created`, `lead.status_changed`, `lead.withdrawn`, `lead.closed`;
- `consent.linked`, `consent.withdrawn`;
- `report.attached`, `report.superseded`;
- `assignment.created`, `assignment.reassigned`, `assignment.unassigned`;
- `note.drafted`, `note.accepted`, `note.rejected`, `note.superseded`;
- `delivery.enqueued`, `delivery.succeeded`, `delivery.failed`, `delivery.dead_lettered`.

Each event has aggregate ID/sequence, actor kind/ID, timestamp, reason code, safe typed payload, correlation/idempotency key, and schema version. Payloads reference artifacts; they do not duplicate full private reports or contact text.

## 9. Provider-neutral outbox

`workflow_outbox` fields:

- identity: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `event_version`, `idempotency_key` (unique), `correlation_id`;
- delivery: `adapter_key`, `destination_key`, `state = pending | leased | retry_wait | completed | dead_letter`, `priority`, `available_at`, `lease_owner`, `lease_expires_at`;
- attempts: `attempt_count`, `max_attempts`, `first_attempt_at`, `last_attempt_at`, `next_retry_at`, `last_error_category`, redacted `last_error_code`;
- payload: encrypted/minimized `payload`, `payload_schema_version`, `payload_sha256`, `created_at`, `completed_at`, `expires_at`;
- provider response: status, provider request/message ID, response timestamp, and safe metadata only—never secret headers, full bodies, or signed URLs.

Workers claim with `FOR UPDATE SKIP LOCKED` or equivalent leasing. A crashed lease becomes retryable after expiry. Domain services know only event/payload contracts, not webhook/email/CRM SDKs.

## 10. First adapter: HMAC-signed webhook

Committed example configuration was inspected without reading `.env.local`. The target exposes Gateway names only; the authorized chatbot example exposes Supabase/document/AI/search names but no approved email, CRM, or webhook provider credential. The safe first P0 adapter is therefore a controlled HTTPS webhook with configuration names introduced in Phase H:

- `OUTBOX_WEBHOOK_URL` (HTTPS allowlisted destination),
- `OUTBOX_WEBHOOK_SECRET` (server-only signing key),
- optional `OUTBOX_WEBHOOK_KEY_ID` for rotation.

Delivery sends a minimized JSON envelope `{ eventId, eventType, eventVersion, occurredAt, aggregateId, idempotencyKey, data }`, timestamp, key ID, and `HMAC-SHA256(timestamp + "." + canonical_body)` signature. The receiver must reject stale timestamps and deduplicate `idempotencyKey`. No report bytes, signed download URL, raw consent text, or unnecessary contact data is included; an authorized downstream system uses a separate server-to-server retrieval contract if approved.

The URL must be HTTPS, pass an explicit host allowlist, reject private/link-local/loopback destinations outside local tests, disable unsafe redirects, and use DNS/IP rebinding protections. Logs redact URL query/credentials and payload contact fields.

## 11. Retry and failure semantics

- Default `max_attempts = 8`; total retry horizon 24 hours.
- Retry only network errors, 408, 409 when provider documents idempotent retry, 425, 429, and 5xx. Honor bounded `Retry-After` up to one hour.
- Backoff schedule before deterministic bounded jitter: 1 min, 5 min, 15 min, 30 min, 1 h, 2 h, 6 h, 12 h. Jitter derives from event ID so tests/replays are reproducible.
- Other 4xx responses are permanent and dead-letter immediately. Signature/config/allowlist failure is configuration/permanent until an authorized replay.
- Provider success is 2xx. Store only safe response metadata, mark completed atomically, and append `delivery.succeeded` idempotently.
- Exhaustion marks `dead_letter`, appends one event, deletes encrypted payload after the retention window, and alerts an authorized operator. It does not change lead durability or assignment.
- Replay requires authorization and creates a new delivery attempt lineage linked to the original event while preserving the same domain event and an explicit replay key.
