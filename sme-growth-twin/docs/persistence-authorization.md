# Persistence and authorization foundation

Phase B adds the durable Supabase boundary without changing the accepted UI or deterministic scoring, recommendation, scenario, ROI, or Blueprint contracts.

## Identity and ownership

Postgres UUIDs are used for persisted identities. `gen_random_uuid()` is built into the supported Postgres runtime, so migrations do not depend on an optional extension. Existing prefixed deterministic-domain IDs remain unchanged inside their versioned payloads; persistence UUIDs are stable database identities and source references.

Every assessment root has exactly one owner: `guest_session_id` or `organization_id`, enforced by a check constraint. Children inherit authorization from that root. Guest tokens contain 256 random bits, live only in a Secure/HttpOnly/SameSite=Lax `/api/v2` cookie, and are persisted only as a server-keyed SHA-256 HMAC. The active window is 24 hours and the absolute cap is 30 days.

Claim is a short database transaction with stable lock order. It validates an active database membership, locks the guest and assessment roots, revokes the guest credential, changes root ownership, keeps all record IDs, and records claim provenance on `guest_sessions`. A same-user/same-organization replay returns the original claim; another organization receives `CLAIM_CONFLICT`.

Supabase Auth establishes identity. Active `organization_members` rows establish authorization. User metadata, email, display name, and client-supplied roles are never authorization inputs.

## Schema and versioning

The ordered migrations create purpose-built roots and revisions for assessments/answers, Twins/evidence, diagnostics, recommendations, scenario comparisons/revisions, Blueprints, consent, and the shared report, lead, assignment, event, note, chat, model-call, catalogue, outbox, export, deletion, and retention-hold foundations. Major artifacts store schema/rule/catalogue/model/source provenance where applicable. Immutable analytical and audit records have database update/delete guards.

The public catalogue view contains only reviewed active safe fields. The report and export buckets are private. Keys must begin with an authorized organization UUID followed by opaque components; display filenames are metadata, not object identity. Application code must create signed downloads only after current authorization, with a 5-minute default and 15-minute maximum, and must never persist the URL.

## Access matrix

| Boundary | Anonymous | Prospect/member | Consultant | Sales manager | Service/background |
|---|---|---|---|---|---|
| Guest/private tables | No direct grants | Server guest route or organization scope | Organization/assignment scope | Organization/team scope | Explicit application authorization |
| Assessment/artifacts | None | Own organization | Own organization | Own organization | Guest route/background only |
| Leads/notes/events | None | Own safe organization scope | Assigned/team-authorized | Team/organization scope | Workflow jobs |
| Catalogue projection | Reviewed active facts | Same | Same | Same | Version administration later |
| Report Storage | None | Own organization | Assigned organization | Scoped organization | Render/retention jobs |
| Export Storage | None | Authorized own export | Authorized scope | Authorized scope | Export/deletion jobs |

All exposed tables have RLS and explicit grants. Updates require compatible select, `USING`, and `WITH CHECK` policies. Membership helpers are private-schema, safe-search-path security-definer functions. Public transactional wrappers are security-invoker and executable only by `service_role`; their private implementations re-check membership and scope. The service key is server-only.

## Consent, retention, export, and deletion

Consent is an immutable purpose-specific event stream. Withdrawal/supersession appends a new record. Defaults remain frozen: unclaimed guests 30 days; analytical/report/lead data 24 months under the applicable activity/closure clock; chat 180 days; detailed model telemetry and security logs 90 days; outbox payload 30 days; consent/lead audit 7 years; catalogue indefinitely. A legal/security hold is explicit, scoped, approved, and reviewed within 90 days.

Export/deletion routes create durable requests. Background assembly/deletion is intentionally deferred; a completed export may be privately stored for at most 24 hours. Deletion checks active holds before acceptance and preserves only the minimum frozen audit/legal exceptions.

## API and configuration

Private routes are under `/api/v2`. They enforce strict Zod/domain input, bounded JSON bodies, `Cache-Control: no-store`, correlation IDs, and stable safe errors. Guest create/resume rotates credentials; revoke invalidates them; claim requires both the guest cookie and a freshly verified authenticated user. Repeated revision writes rely on database unique constraints for idempotency/conflict detection.

Public variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Server-only variables: `SUPABASE_SECRET_KEY`, `MAJUPILOT_GUEST_TOKEN_PEPPER`. Never expose, log, or commit their values.

Local ports are isolated at 55320–55329 so this project does not alter the separate chatbot/V1 stack. Validate with `supabase db reset --local --no-seed`, `supabase migration list --local`, `supabase test db --local`, `supabase db lint --local`, and `supabase db advisors --local` using the pinned CLI.
