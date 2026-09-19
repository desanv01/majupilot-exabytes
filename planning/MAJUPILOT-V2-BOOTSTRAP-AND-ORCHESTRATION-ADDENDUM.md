# MajuPilot V2 Bootstrap and Orchestration Addendum

**Status:** APPROVED AND BINDING  
**Approved:** 19 September 2026  
**Purpose:** Override repository, baseline, sequencing, and validation details in the earlier backend/AI gameplan where they conflict with the owner's approved V2 plan.

## 1. Authority and precedence

Read this addendum before:

1. `planning/MAJUPILOT-MAIN-CHAT-MASTER-PROMPT.md`;
2. `planning/CORE-AI-CHALLENGE-COVERAGE-AUDIT-AND-REBUILD-GAMEPLAN.md`;
3. the inherited V1 planning records.

The Exabytes challenge PDF remains the product-requirement source. The user's current request remains the highest-priority instruction. This addendum overrides stale repository paths, baseline counts, phase ordering, and orchestration details in the earlier documents.

## 2. Repository and version isolation

- V1 repository: `https://github.com/desanv01/sme-growth-twin`
- V1 accepted commit: `234146096c51c8f60d61dbeba5bcb3abfb1c8996`
- V2 repository: `https://github.com/desanv01/majupilot-exabytes`
- V2 local root: `C:\Users\Dv\Desktop\MajuPilot`
- Application root: `C:\Users\Dv\Desktop\MajuPilot\sme-growth-twin`
- Imported baseline tag: `v1.0.0-baseline`
- V2 target version: `v2.0.0`

The V1 repository, deployment, and database must remain independent and usable. V2 receives its own GitHub history destination, Vercel project, Supabase project, environment configuration, storage, and production URL. Never push V2 work to the V1 origin.

The imported baseline contains the accepted UI phases 00-07 and 30 test files with 167 passing tests. Those numbers replace the stale 28-file/157-test baseline stated in earlier documents.

## 3. Model and task topology

- V2 main planning and integration task: GPT-5.6 Sol with high reasoning.
- Every bounded implementation or correction task: GPT-5.6 Sol with medium reasoning.
- The main task owns architecture, exact stage contracts, sequencing, GitHub coordination, integration review, acceptance, merges, ledger updates, and user communication.
- Implementation tasks work only inside their assigned phase and worktree.
- One active implementation task per phase by default. Do not create overlapping tasks in the same worktree.

## 4. Stable presentation boundary

The accepted V1 UI/UX is closed. Do not reopen design exploration, regenerate visual systems, or repeat UI audits. Add only the smallest frontend/API integration needed to expose implemented V2 capabilities. Any necessary interface change must preserve the accepted visual language, accessibility behavior, and existing routes unless a frozen backend contract makes a route addition necessary.

## 5. Approved challenge-first phase order

### Phase 00 - V2 repository and baseline isolation

Freeze the imported baseline, repository remotes, README, CI inheritance, environment separation, V1/V2 links, and V2 ledger. Do not provision production services or implement product features in this phase.

### Phase A - contract and source audit

Audit the inherited application and the separate chatbot project. Freeze P0/P1/P2 scope, guest/auth model, domain ownership, consent records, retention policy, catalogue classification, provider boundaries, report contract, lead workflow, notification adapter boundary, and the Exabytes coverage matrix.

### Phase B - durable persistence and authorization

Implement the dedicated Supabase schema, migrations, repositories, organizations, memberships, guest assessment ownership, RLS, private storage policies, versioning, and tenant-isolation checks.

### Phase C - live AI and dynamic follow-up

Implement server-only model access, `AI_EXECUTION_MODE`, structured outputs, budgets, telemetry, bounded dynamic follow-ups, environment preflight, and visible required-mode failure without changing trusted calculations.

### Phase D - catalogue and recommendation completion

Verify current official sources, classify offerings, version the catalogue, implement review/disable behavior, complete challenge-facing mappings, and add evidence-grounded AI explanations without allowing model text to select products or alter eligibility.

### Phase E - canonical PDF and consultant notes

Generate a deterministic branded PDF from an immutable Blueprint, store it privately, record hash/version/provenance, provide signed downloads, and implement AI-draft versus human-accepted consultant notes.

### Phase F - durable lead and salesperson core

Implement explicit versioned consent, idempotent lead creation, deterministic assignment, report attachment, authorized salesperson lead detail, status/assignment events, and safe receipts. Use fictional demo personnel unless an approved real roster is supplied.

### Phase G - Transformation Copilot

Implement persisted chat and the approved typed tools for Twin, evidence, scores, recommendations, scenarios, ROI, Blueprint, report, and lead status. Require confirmation and authorization for writes. Keep document RAG at P1 unless the owner explicitly promotes it.

### Phase H - outbox and minimal application integration

Implement the durable outbox and one real notification or signed-webhook adapter. Connect completed backend capabilities to the stable application with the smallest necessary integration changes. Delivery failure must not erase or duplicate a durable lead.

### Phase I - final challenge and release proof

Run the five-minute representative journey, required-mode live AI proof, golden Copilot conversations, report equality/download proof, lead assignment proof, targeted RLS/security proof, production build, separate deployment verification, and submission evidence. Never claim manual or external completion without evidence.

## 6. Minimal validation strategy

The owner explicitly requires minimal testing and review during this wave. Target validation to the changed risk surface.

### Every implementation phase

Run only:

- targeted tests for changed modules;
- type-check when TypeScript, domain, or API code changes;
- lint when lint-sensitive or broad changes occur;
- one focused route or API smoke test when a user journey changes.

Do not rerun unrelated full suites after every small commit.

### Milestones

Run the broader relevant suite once after:

- persistence and RLS;
- live AI and Copilot;
- report and sales workflow;
- final release.

### Main-task review

After each stage, inspect only:

- diff scope;
- contract compliance;
- changed tests;
- one representative smoke path;
- the security boundary relevant to that stage.

Return one short decision: `accepted`, `correction required`, or `re-planned`.

## 7. Required Phase A corrections

Phase A must explicitly resolve these gaps before Phase B:

- add a versioned consent-record model rather than storing consent only on a lead;
- preserve a guest-first path so registration does not undermine the five-minute challenge;
- classify catalogue entries as Exabytes product, partner/resold product, supported path, third-party alternative, consultation-only, or unavailable/unverified;
- define a fictional demo salesperson roster and an unassigned queue unless a real approved roster is supplied;
- choose the first outbox adapter based on available credentials without coupling the domain to that provider;
- define configurable retention, export, and deletion policy;
- inspect the actual chatbot repository before selecting reusable code;
- verify current AI SDK, model, provider, and Exabytes product facts from primary sources;
- preserve applicable attribution for any directly adapted chatbot code.

## 8. GitHub execution contract

For each phase:

1. The main task freezes the exact stage contract, files, invariants, minimal commands, branch, PR scope, and acceptance gate.
2. The main task opens one Sol Medium implementation task.
3. The implementer makes focused representative commits and pushes a `codex/` phase branch.
4. The implementer opens one focused PR.
5. CI runs only the repository's configured gates; local validation follows Section 6.
6. Corrections remain in the same PR unless the phase is re-planned.
7. The main task reviews, returns one short decision, merges accepted work, and updates the V2 ledger.
8. The next phase begins only after merge.

Never commit `.env.local`, provider keys, Supabase service-role credentials, private reports, user documents, or real contact data. Never force-push or claim an unverified PR, check, merge, deployment, or external delivery.

## 9. Completion principle

Challenge-critical completion takes priority over optional expansion. If time becomes constrained, complete Phases 00-F and the necessary release proof before broadening Copilot or RAG. V1 remains the rollback-safe accepted product throughout the V2 wave.
