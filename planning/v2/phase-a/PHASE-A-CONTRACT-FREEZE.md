# Phase A Contract Freeze

**Status:** Frozen for Phase B implementation review
**Date:** 19 September 2026 (MYT)
**Authority:** `MAJUPILOT-V2-BOOTSTRAP-AND-ORCHESTRATION-ADDENDUM.md`, then the main-chat master prompt and core-AI gameplan
**Product:** MajuPilot V2 (`v2.0.0` target)

## 1. Outcome

Phase A freezes the backend, AI, catalogue, reporting, consent, lead, and delivery contracts required to begin Phase B. It changes documentation only. The accepted V1 presentation boundary and deterministic application behavior are unchanged.

There is no unresolved architectural choice that blocks Phase B. Later implementation may tune operational limits through versioned configuration, but may not reverse an invariant in this freeze without an explicit re-plan by the main coordinator.

## 2. Locked decisions

1. The deterministic kernel is the sole authority for normalized facts, evidence, scores, eligibility, prerequisites, offering selection, costs, ROI, payback, timelines, scenario revisions, and Blueprint identity.
2. Live AI is bounded to normalization, follow-up proposals, explanations, critique, conversational collection, Copilot language, and drafts. Model text cannot mutate trusted state except through an authorized, schema-validated, explicitly confirmed tool.
3. The approximately five-minute path is guest-first. Registration is never a prerequisite to assessment, diagnostics, scenarios, Blueprint creation, or report preview/generation.
4. Guest access uses a high-entropy opaque server-issued cookie whose digest, not raw value, is persisted. The browser never receives a Supabase service-role credential and receives no direct broad table access.
5. Account claims are transactional and explicit. A guest session may be claimed once into an organization only after authenticated verification; claim never changes immutable artifact identity or provenance.
6. Authorization comes from server-verified `organization_members` records and assignment/team records, never `user_metadata` or other user-editable claims.
7. Consent is an append-only, versioned `consent_records` stream separate from `leads`. Grant, withdrawal, and supersession are immutable events with policy/text versions and provenance.
8. Retention defaults are concrete, configurable, and fail closed. Their frozen defaults and deletion/export exceptions are in `DOMAIN-OWNERSHIP-AUTH-CONSENT-RETENTION.md`.
9. Exabytes catalogue facts use exactly one classification: `Exabytes product`, `partner/resold product`, `supported path`, `third-party alternative`, `consultation-only`, or `unavailable/unverified`. Unknown or stale facts are unavailable/unverified.
10. Provider access is server-only through a Vercel AI Gateway adapter. `AI_EXECUTION_MODE` is `required | preferred | disabled`; required mode never silently falls back.
11. Model IDs are configuration, not domain constants. Each configured ID must be confirmed against the current Gateway `/v1/models` response at deployment preflight and meet the operation capability allowlist.
12. The canonical report is generated from one immutable Blueprint revision, privately stored, content-hashed, versioned, and served only by short-lived signed download.
13. AI consultant notes remain `draft` until an authorized human accepts a new immutable revision. Drafts are never rendered as accepted advice.
14. Consultation creation is one idempotent database transaction that validates current consent and ownership, creates the durable lead, attaches the exact report, records assignment/events, and enqueues outbox work.
15. Initial assignment uses fictional demo personnel only and an unassigned queue. No real person or contact data has been supplied or inferred.
16. The first delivery adapter is an HMAC-signed HTTPS webhook because no approved email/CRM/webhook provider credential is present in committed example configuration. The domain remains provider-neutral.
17. Direct future copying from the authorized chatbot project must preserve its MIT copyright and permission notice in copies/substantial portions and in the dependency/attribution record. Phase A copies no source.
18. Document RAG is P1 behind parser/retrieval/storage contracts and cannot delay P0.
19. MajuPilot remains the working product name. The V1 repository, deployment, and data stay independent and read-only from V2 work.

## 3. Priority scope

### P0 — challenge and trust path

- Guest-first five-section assessment and five-minute evidence gate.
- Durable assessment, Twin, diagnostics, recommendations, scenarios, Blueprint, report, consent, lead, assignment, chat, model-call, catalogue, and outbox records.
- Organization membership, guest claim, tenant/session isolation, RLS, private Storage, export, deletion, and retention enforcement.
- Required-mode live AI, bounded dynamic follow-up, evidence-grounded explanations, advisor validation, telemetry, budgets, and stable failures.
- Verified/versioned challenge-facing catalogue with fail-closed classification.
- Canonical Blueprint-derived PDF and human-accepted consultant notes.
- Idempotent consultation, deterministic assignment, authorized salesperson projection, event history, and signed-webhook outbox adapter.
- Transformation Copilot tools for Twin, evidence, scores, recommendations, scenarios, ROI, Blueprint/report, catalogue, and lead state; writes require authorization and confirmation.
- Minimal stable-UI/API integration and final security/live/timing/release proof.

### P1 — useful expansion after P0

- Uploaded SME documents, parser/retrieval contracts, page citations, embeddings, and document-grounded Copilot answers.
- Additional provider/model adapters, richer CRM/email adapters, catalogue-admin review UI, optional sourced benchmarks, and deeper interview mode selected by the user.
- More sophisticated routing/teams once an approved real organization roster exists.

### P2 — deferred productization

- Local/self-hosted model execution, autonomous multi-agent workflows, broad third-party marketplace integrations, advanced analytics/experimentation, and nonessential presentation expansion.

## 4. Explicit non-goals

- No product code, schema migration, package change, service provisioning, environment change, runtime behavior change, or generated private report.
- No UI redesign, visual audit, route redesign, or reopening of accepted UI phases.
- No wholesale merge of the chatbot repository, its UI, schema, environment, Google-specific behavior, website search, subscription model, or document pipeline.
- No invented Exabytes product, feature, price, integration, model ID, salesperson, credential, legal basis, or completion claim.
- No browser service-role client, public report bucket, raw prompt/contact logging, or model-authored trusted numeric result.
- No document RAG implementation in P0.

## 5. Ownership and dependency map

| Phase | Owner | Depends on | Frozen deliverable and invariant | Acceptance condition |
|---|---|---|---|---|
| B | Persistence & authorization | A | Domain tables, opaque guests, organization membership, consent, RLS, private Storage, retention jobs | Durable restart/browser proof; cross-tenant and cross-session deny tests; version identity retained |
| C | Live AI & follow-up | B | Gateway adapter, execution modes, structured outputs, budgets, telemetry, stable errors | Required mode produces a real current-model result; unavailable provider is visible/bounded; trusted numbers unchanged |
| D | Catalogue & recommendations | C | Six-way classification, source/version review, fail-closed selection, AI explanations | Every category is verified or unavailable/unverified; catalogue golden diffs; explanations cite evidence |
| E | PDF & consultant notes | D | Immutable Blueprint-to-PDF, private artifact, hash/provenance, signed URL, note acceptance | PDF values equal Blueprint; old versions remain downloadable to authorized users; draft labels enforced |
| F | Lead & salesperson core | E | Consent transaction, exact report attachment, fictional roster, deterministic assignment, projections/events | Duplicate request yields same receipt; authorized salesperson sees full pre-call context; other users denied |
| G | Transformation Copilot | F | Persisted scoped chat, typed authorized tools, confirmed writes, injection separation | Golden questions are tool-grounded; numeric what-if equals kernel; cross-tenant and unsupported claims rejected |
| H | Outbox & minimal integration | G | Provider-neutral outbox, signed webhook, smallest stable-UI hookup | Retry/idempotency proof; delivery failure does not erase/duplicate lead; UI boundary remains stable |
| I | Final proof | B–H | Timed, live-AI, PDF, lead, outbox, security, build/deploy/submission evidence | Every P0 row demonstrated or truthfully disclosed; no unverified completion claim |

The addendum's phase lettering controls where it differs from older gameplan ordering.

## 6. P0 invariant register

| P0 contract | Owner phase | Invariant | Acceptance evidence |
|---|---|---|---|
| Guest-first journey | B, I | Registration never gates the core journey | Timed clean-browser guest run and resume/expiry tests |
| Durable tenant state | B | Every private row belongs to one organization or unclaimed guest session | Restart/browser persistence plus negative RLS matrix |
| Consent | B, F | Versioned immutable record; lead state is not consent | Grant/withdraw/supersede tests and lead-transaction evidence |
| Live AI | C | Required failure is visible; AI cannot change kernel values | Live preflight/call record and mutation-negative tests |
| Catalogue | D | One six-way classification and current official source per active claim | Source-to-row trace and stale-source fail-closed test |
| Report | E | PDF derives only from immutable Blueprint revision | Snapshot/equality/hash/private-download evidence |
| Sales workflow | F | One request creates at most one lead and recorded assignment outcome | Idempotency/concurrency and projection authorization tests |
| Copilot | G | Only registered typed tools; writes confirmed and authorized | Golden conversation and cross-tenant/tool allowlist tests |
| Delivery | H | Durable lead commits before external delivery; retries are idempotent | Forced webhook failure/retry/deduplication evidence |
| Release truthfulness | I | Claims follow demonstrated evidence | Signed checklist mapped to coverage matrix |

## 7. No-open-blocker checklist for Phase B

- [x] Aggregate/table ownership and identity columns are named.
- [x] Guest token, expiry, rotation, claim, and authenticated membership lifecycles are frozen.
- [x] Role and authorization sources are frozen; user-editable metadata is prohibited.
- [x] Consent is separated from lead state with grant/withdraw/supersede semantics.
- [x] Retention defaults, export scope, deletion sequence, and exceptions are concrete.
- [x] RLS, grants, views/functions, Storage, and service-role boundaries are frozen.
- [x] AI SDK 7 target and chatbot SDK 6 incompatibility are recorded.
- [x] Current Gateway catalogue lookup and model preflight rule are frozen.
- [x] Catalogue classifications and current official source states are recorded.
- [x] Blueprint/report/note/lead/assignment/outbox contracts and stable error families are frozen.
- [x] Fictional demo roster and unassigned queue are frozen.
- [x] Signed webhook is selected from the available configuration evidence.
- [x] P0 requirements have owner phases, invariants, acceptance evidence, and sources/status.
- [x] Accepted UI and V1 remain untouched.

## 8. Phase B handoff

Phase B may create the dedicated Supabase project configuration, ordered migrations, repository interfaces, RLS/storage policy tests, and retention/export/deletion services described by this freeze. It must preserve deterministic fixture mode and may not add live model behavior, catalogue expansion, PDF rendering, sales UI, or RAG. Any necessary schema refinement must preserve the aggregate ownership, consent immutability, guest claim, and isolation invariants in this document and its domain companion.
