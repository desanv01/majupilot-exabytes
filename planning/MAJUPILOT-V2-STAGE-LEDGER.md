# MajuPilot V2 Stage Ledger

Allowed states: `Locked`, `Ready`, `Dispatched`, `Needs correction`, `Under review`, `Accepted`, `Re-planned`.

| Phase | Status | Implementation task | Accepted | Gate evidence / notes |
|---|---|---|---|---|
| 00 Repository and baseline isolation | Accepted | Bootstrap coordinator | 2026-09-19 | V1 commit `2341460` imported with full history; separate V2 origin `desanv01/majupilot-exabytes`; tag `v1.0.0-baseline`; V2 README and authoritative orchestration documents added. V1 origin remains configured as read-only reference remote `v1`. |
| A Contract and source audit | Under review | Phase A implementer — `codex/phase-a-contract-audit` | - | Review PR [#1](https://github.com/desanv01/majupilot-exabytes/pull/1). Six contract/source artifacts delivered. Evidence: `git diff --check` and staged check pass; all 51 P0 rows have owner, invariant/acceptance evidence, and source/status; all 18 cited official Exabytes links returned HTTP 200; current Supabase, Vercel AI Gateway/AI SDK, target, and authorized chatbot sources audited. Awaiting V2 main-task acceptance; later phases remain locked. |
| B Durable persistence and authorization | Locked | Pending Phase A | - | Dedicated Supabase project, migrations, repositories, roles, guest ownership, RLS, private storage, and tenant isolation. |
| C Live AI and dynamic follow-up | Locked | Pending Phase B | - | Server-only provider, execution modes, structured outputs, budgets, telemetry, and bounded follow-ups. |
| D Catalogue and recommendation completion | Locked | Pending Phase C | - | Primary-source verification, offering classification/versioning, deterministic eligibility, and evidence-grounded explanations. |
| E Canonical PDF and consultant notes | Locked | Pending Phase D | - | Deterministic PDF, private artifact storage, signed download, hashes, versions, and draft/accepted notes. |
| F Durable lead and salesperson core | Locked | Pending Phase E | - | Versioned consent, idempotent lead, deterministic assignment, attached report, salesperson detail, and events. |
| G Transformation Copilot | Locked | Pending Phase F | - | Persisted chat, authorized typed tools, confirmed writes, and live/fallback disclosure. Document RAG remains P1. |
| H Outbox and minimal application integration | Locked | Pending Phase G | - | Durable retryable delivery adapter and smallest stable-UI integration needed to expose V2. |
| I Final challenge and release proof | Locked | Pending Phase H | - | Five-minute, live-AI, report, sales, security, separate deployment, and submission proof. |

## Validation policy

Per phase, run targeted changed-module tests, TypeScript checking when relevant, lint only when relevant, and one focused route/API smoke path when a journey changes. Broader relevant suites run once after persistence/RLS, live AI/Copilot, report/sales, and final release. The V2 main task returns only `accepted`, `correction required`, or `re-planned` after each stage review.
