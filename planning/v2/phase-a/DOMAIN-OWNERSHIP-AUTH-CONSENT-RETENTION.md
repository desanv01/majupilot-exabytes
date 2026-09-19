# Domain Ownership, Authentication, Consent, and Retention

**Frozen:** 19 September 2026 (MYT)
**Implementation owner:** Phase B, with lead transaction completion in Phase F

## 1. Ownership model

Every private record has exactly one effective security owner:

- an unclaimed `guest_session_id`; or
- an authenticated `organization_id` whose access is mediated by an active `organization_members` row.

Analytical artifact identity is immutable. Claiming a guest session adds authenticated ownership and audit provenance; it does not regenerate IDs, replace source references, or rewrite old revisions. Rows may not remain both independently guest-readable and organization-readable after claim. The claim transaction revokes the guest credential before granting organization access.

## 2. Durable aggregate and table inventory

| Aggregate | Table | Root/child | Required owner and identity | Mutability |
|---|---|---|---|---|
| Identity | `profiles` | root extension of `auth.users` | `user_id` | Mutable display fields; no authorization role here |
| Organization | `organizations` | root | `id`, legal/display name | Mutable with audited lifecycle state |
| Organization | `organization_members` | child | `organization_id`, `user_id`, role, optional `team_key`, status | Membership changes append audit event; authorization source |
| Guest access | `guest_sessions` | root | `id`, `token_digest`, `expires_at`, `claimed_at`, `revoked_at` | Token rotates; digest only; terminal claim/revoke |
| Assessment | `assessment_sessions` | root | exactly one of `guest_session_id` or `organization_id`; creator; state/version | Mutable state machine; ownership immutable except claim |
| Assessment | `assessment_answers` | child | `assessment_session_id`, answer/evidence version | Append revision; no destructive overwrite of confirmed evidence |
| Twin | `business_twins` | versioned artifact | session/org, immutable revision ID | Append-only revisions |
| Evidence | `evidence_items` | versioned child | session/org plus source reference | Append/retract with provenance; never silently rewrite |
| Diagnostics | `diagnostic_runs` | versioned artifact | Twin revision | Immutable output |
| Recommendations | `recommendation_runs` | versioned artifact | diagnostic/Twin/catalogue/rule-pack versions | Immutable output |
| Scenarios | `scenario_comparisons` | root artifact | recommendation/Twin | Immutable comparison identity |
| Scenarios | `scenario_revisions` | child artifact | comparison plus confirmed assumptions | Append-only revisions |
| Advisors | `advisor_runs` | root run | Blueprint candidate/Twin/org | Immutable execution metadata |
| Advisors | `advisor_reviews` | child | advisor run/evidence IDs | Immutable result; validation status explicit |
| AI ledger | `model_calls` | event | operation/org or guest session; provider/model/schema/prompt versions | Append-only, redacted telemetry |
| Blueprint | `blueprints` | root versioned artifact | session/org plus all source versions | Immutable canonical identity |
| Report | `report_artifacts` | versioned artifact | Blueprint ID/revision, hash, private object path | Append-only versions; no overwrite |
| Consent | `consent_records` | event stream | subject/session/org, purpose, action, policy/text version | Immutable grant/withdraw/supersede events |
| Lead | `leads` | root | organization or claimed guest transaction, Blueprint, report, consent grant | Status changes by events; identity immutable |
| Lead | `lead_assignments` | event | lead, assignee member/roster key or queue key | Append-only assign/reassign/unassign |
| Lead | `lead_events` | event | lead, actor, event type, safe payload | Append-only audit timeline |
| Sales routing | `sales_roster_entries` | configuration | fictional/approved identity key, region/language/capability tags, active | Versioned configuration; no real data until approved |
| Sales routing | `sales_queues` | configuration | stable queue key, routing scope | Versioned; `unassigned` required |
| Notes | `consultant_notes` | versioned artifact | lead, author, origin, status, accepted revision | Append-only; AI draft distinct from accepted human note |
| Chat | `chat_sessions` | root | organization/session/Twin/Blueprint scope | Durable; scope immutable after first message |
| Chat | `chat_messages` | event | chat session, role, parts, tool provenance | Append-only except redaction tombstone |
| Delivery | `workflow_outbox` | event/job | aggregate ID, event type, idempotency key | Mutable delivery state; immutable payload hash |
| Catalogue | `catalogue_versions` | root version | semantic version, review state, effective dates | Immutable after activation |
| Catalogue | `catalogue_offerings` | versioned child | catalogue version/stable offering ID/classification/source | Immutable within version |
| Catalogue | `catalogue_mappings` | versioned child | catalogue version/capability/offering/rule | Immutable within version |

Cross-cutting columns on private/versioned rows: `id`, `organization_id` and/or `guest_session_id`, `created_at`, `created_by`, `schema_version`, and where applicable `updated_at`, `revision`, `source_artifact_ids`, `rule_pack_version`, `catalogue_version`, `model_version`, and `supersedes_id`. Database constraints enforce the exclusive guest/organization owner rule.

## 3. Guest-first five-minute lifecycle

1. The server generates at least 256 bits of cryptographic randomness, sends it only in a `Secure`, `HttpOnly`, `SameSite=Lax`, path-scoped cookie, and stores only a keyed digest in `guest_sessions`.
2. The initial guest session expires after 24 hours of inactivity while the journey is active. A valid response rotates the cookie and extends the active window, capped at 30 days from creation.
3. Guest routes resolve the digest server-side and filter every operation by `guest_session_id`. The raw token is never stored, logged, placed in a URL, used as a public object path, or sent to a model.
4. Guests can complete assessment, diagnostics, scenarios, Blueprint, and report generation without registration. Consultation submission may collect the minimum contact fields with explicit purpose-specific consent; it still does not require an account.
5. A guest cannot list arbitrary sessions, organizations, reports, or leads. Resume uses only the valid opaque cookie. Lost/expired tokens are not recoverable without a later verified account/contact flow.
6. Rate, request-size, token, and model-cost limits apply per digest and per IP. Sensitive responses use `Cache-Control: no-store`.
7. At 24-hour inactivity expiry the credential is rejected. Unclaimed data remains retained for the 30-day guest retention window solely for safe resume/support, then is deleted by the retention job.

## 4. Authenticated organization lifecycle

1. Supabase Auth supplies identity; the application verifies server-side claims/session freshness before protected operations.
2. First account onboarding creates or joins an organization through a server transaction. No client-submitted role is trusted.
3. `organization_members` is the authorization source. Allowed roles are `prospect`, `consultant`, `sales_manager`, `catalogue_admin`, and `system_admin`; membership status must be `active`.
4. `prospect` accesses only its organizations' assessment/analytical/report/lead status records. `consultant` additionally accesses assigned or team-authorized leads. `sales_manager` accesses team-scoped leads and assignments. `catalogue_admin` manages versioned catalogue facts, not private SME data. `system_admin` is server-administered and audited, not a browser bypass role.
5. Role changes take effect through membership rows and server checks. `raw_user_meta_data`, `user_metadata`, email domain, display fields, and arbitrary JWT client claims are never authorization sources. If `app_metadata` is used as a cache hint, the database membership check remains authoritative because JWT claims may be stale.
6. Removing/suspending a member blocks new authorization immediately at the repository/server boundary. Sensitive operations validate the current session and membership rather than trusting a long-lived client cache.

## 5. Guest-to-account claim/link rules

- Claim requires a valid guest cookie and a freshly verified authenticated user in the same request.
- The user selects or creates the target organization; server authorization confirms permission to claim into it.
- A serializable transaction locks `guest_sessions` and all claimable roots, rejects expired/revoked/already-claimed tokens, sets `claimed_at`, `claimed_by_user_id`, and `claimed_organization_id`, converts root ownership, and writes a safe claim audit event.
- Children inherit access through their locked root or are updated in the same transaction where a direct `organization_id` is required for RLS performance.
- The transaction rotates/revokes the guest cookie before commit. A replay returns the existing safe claim receipt only to the same authorized member; a conflicting organization returns `CLAIM_CONFLICT`.
- Existing organization records are never merged by email/name heuristics. Cross-organization merge requires an explicit later admin workflow and is outside P0.

## 6. Consent record contract

`consent_records` is not a flag on `leads`. Each immutable row contains:

- `id`, `subject_kind` (`guest_session | user`), `subject_id`, optional `organization_id`;
- `purpose` (`consultation_contact`, `report_share_with_sales`, `product_updates`, or a future separately versioned purpose);
- `action` (`granted | withdrawn | superseded`), `consent_version`, `policy_version`, `text_hash`, locale, presentation surface, timestamp;
- minimal capture provenance: server request/audit ID and coarse channel; no raw IP in long-term consent evidence;
- `parent_consent_id` for withdrawal/supersession and optional `lead_id` as a consequence link, never the consent owner.

Rules:

- Purposes are unbundled. Consultation and report sharing are P0; marketing/product updates are optional and default off.
- Consultation transaction requires the newest unwithdrawn grants for both required purposes, matching the submitted Blueprint/report subject.
- Withdrawal appends a record; it never deletes or mutates the historical grant. It blocks future contact/delivery for that purpose and enqueues suppression/cancellation work where legally and operationally possible.
- Withdrawal does not erase the fact that consent was previously granted. The evidence stream is retained under the audit exception, while contact payloads and operational records follow deletion/retention rules.
- Every consent read is subject/organization scoped. Only authorized audit/admin server operations can export the immutable history.

## 7. Configurable retention defaults

Configuration is versioned, environment-specific only within the stated maximums, and recorded as `retention_policy_version` on deletion/export jobs. Shortening a period is allowed; lengthening it requires privacy/legal approval and a new policy version.

| Record class | Default clock | Default retention/action |
|---|---|---|
| Unclaimed guest session and guest-owned assessment/artifacts | Last activity | Delete at 30 days; credentials expire earlier as described above |
| Profiles, organizations, memberships | Account/org active state | Active life; delete/anonymize within 30 days after verified deletion request, subject to exceptions |
| Assessment answers, Twins, evidence, diagnostics, recommendations, scenarios, Blueprints | Last organization activity | 24 months, then delete unless attached to an open lead or retained by explicit account choice |
| Private report artifacts | Blueprint activity or lead closure, later clock wins | 24 months; delete Storage object and metadata tombstone after integrity audit |
| Open leads and assignments | Lead closure | Active life plus 24 months; contact fields removed earlier on valid withdrawal/deletion where no exception applies |
| Consent and lead audit events | Event time | 7 years; minimize/anonymize subject identifiers when linkage is no longer required |
| Consultant notes | Lead closure | 24 months; accepted note and authorship retained with lead audit exception only when required |
| Chat messages | Message time | 180 days; tool result references may retain artifact IDs, not duplicated private payloads |
| Detailed model-call telemetry | Call time | 90 days; redacted monthly usage/cost aggregates retained 13 months |
| Completed/dead-letter outbox payload | Terminal time | Encrypted payload deleted after 30 days; delivery metadata/hash retained 13 months |
| Failed in-progress outbox event | Creation | Maximum 30 days of retry/dead-letter handling, then terminal review and payload deletion |
| Security/access logs | Event time | 90 days unless active investigation hold |
| Catalogue versions, mappings, rule/source facts | Supersession | Indefinite because non-personal and needed to reproduce old Blueprints |
| Aggregate anonymous product metrics | Aggregation | 25 months; only where re-identification is not reasonably possible |

Legal/security hold is an explicit, authorized, time-bounded record with reason, scope, approver, review date (maximum 90-day review interval), and audit trail. It pauses only covered deletion; it does not authorize new use.

## 8. Export and deletion

### Export

- A verified subject or authorized organization admin can request a machine-readable JSON export; report PDFs are separate signed downloads.
- Export includes the subject's profile/membership, assessment and artifact revisions, consent history, lead/status/assignment history visible to that subject, notes visible to that subject, chat, and model-call metadata. It excludes secrets, internal security signals, other users' personal data, provider raw responses, and cross-tenant records.
- Export is assembled server-side, privately stored for at most 24 hours, encrypted at rest, and delivered through a one-use or short-lived signed URL. The request and download are audited.

### Deletion

1. Verify subject and organization authority; revoke/refresh sessions first because deleting a user alone does not invalidate already issued access tokens.
2. Block new processing, rotate/revoke guest credentials, and append required withdrawal/suppression events.
3. Cancel eligible pending outbox work and detach/delete private Storage objects.
4. Delete or irreversibly anonymize child records in a controlled job; preserve only records covered by the explicit consent/audit, fraud/security, transaction, or legal-hold exception.
5. Delete membership/profile/Auth identity last, write a non-identifying completion receipt, and complete within 30 days.

Exceptions retain only the minimum fields, restrict access to the audit/legal role, and never keep model prompts or unnecessary contact text.

## 9. RLS, grants, functions, views, and Storage expectations

- Enable RLS on every table in an exposed schema, including `public`. Revoke default `anon`/`authenticated` privileges first, then grant only required operations. Data API grants decide whether an operation is callable; RLS separately decides which rows are visible. Both must be tested.
- Guest-owned private records are accessed through narrow server routes; `anon` receives no direct table grants for them. Public catalogue reads are limited to reviewed, active fields through a security-invoker projection.
- Authenticated policies combine `TO authenticated` with ownership/membership predicates. `TO authenticated` alone is not authorization.
- `SELECT`/`DELETE` policies use `USING`; `INSERT` uses `WITH CHECK`; every `UPDATE` has both `USING` and `WITH CHECK` plus a compatible `SELECT` policy. Organization and immutable identity columns cannot be reassigned.
- Authorization never reads `raw_user_meta_data`/`user_metadata`. Membership/team/assignment tables are authoritative.
- Views use `security_invoker = true` on supported Postgres or live in an unexposed schema with revoked client access. Materialized views and generated projections receive equivalent explicit grants.
- Prefer `SECURITY INVOKER`. Any unavoidable `SECURITY DEFINER` function lives in a non-exposed schema, sets a safe `search_path`, performs explicit `auth.uid()`/membership checks, receives explicit least-privilege `EXECUTE` grants, and is covered by negative tests. Never add definer rights merely to bypass a permission error.
- Service-role/secret clients are server-only and used only for background/administrative work with explicit application authorization. They are never prefixed `NEXT_PUBLIC_`, serialized, logged, or bundled for a browser.
- Report/document buckets are private. Object keys are opaque and organization-scoped; display filenames are metadata. Download requires current authorization and a short-lived signed URL (default 5 minutes, maximum 15 minutes). Signed URLs are not stored in reports/leads.
- Storage policies constrain `bucket_id` and owner/path on `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Upsert requires the corresponding `SELECT`, `INSERT`, and `UPDATE` permissions. Object metadata rows and Storage objects are deleted together by idempotent jobs.
- Phase B supplies allow/deny tests for every private table and Storage operation: owner/member, authorized consultant/team manager, non-member, other tenant, expired/revoked guest, `anon`, and role escalation attempts.

## 10. Stable authorization failures

External errors expose no existence oracle: `UNAUTHENTICATED` (401), `SESSION_EXPIRED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404 only after authorized scope resolution), `CLAIM_CONFLICT` (409), `CONSENT_REQUIRED` (422), and `RETENTION_HOLD` (409). Logs use request IDs and safe categories, never raw guest tokens, service keys, signed URLs, or contact payloads.
