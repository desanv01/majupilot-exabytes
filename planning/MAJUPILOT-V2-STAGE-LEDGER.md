# MajuPilot V2 Stage Ledger

Allowed states: `Locked`, `Ready`, `Dispatched`, `Needs correction`, `Under review`, `Accepted`, `Re-planned`.

| Phase | Status | Implementation task | Accepted | Gate evidence / notes |
|---|---|---|---|---|
| 00 Repository and baseline isolation | Accepted | Bootstrap coordinator | 2026-09-19 | V1 commit `2341460` imported with full history; separate V2 origin `desanv01/majupilot-exabytes`; tag `v1.0.0-baseline`; V2 README and authoritative orchestration documents added. V1 origin remains configured as read-only reference remote `v1`. |
| A Contract and source audit | Accepted | Phase A implementer — `codex/phase-a-contract-audit` | 2026-09-19 | PR [#1](https://github.com/desanv01/majupilot-exabytes/pull/1) merged as `ab82566`; quality gate `validate` passed. Main-task review accepted exact diff scope, all 51 challenge P0 rows, representative Exabytes AI Cloud source trace, and the guest/auth/consent/RLS security boundary. Six contract/source artifacts freeze Phase B with no unresolved architectural blocker. |
| B Durable persistence and authorization | Under review | Phase B implementer — `codex/phase-b-persistence-rls` | - | PR [#2](https://github.com/desanv01/majupilot-exabytes/pull/2); commits `8b4f085`, `ba7b00b`, `bf95cd7`. Three CLI-created migrations apply cleanly from zero; 35 pgTAP security assertions, 9 targeted tests, 176 milestone tests, type-check, lint, database lint/advisors, and restart/resume/revoke API smoke passed. Local Supabase proof only; Phase C remains locked pending main-task acceptance and merge. |
| C Live AI and dynamic follow-up | Locked | Pending Phase B | - | Server-only provider, execution modes, structured outputs, budgets, telemetry, and bounded follow-ups. |
| D Catalogue and recommendation completion | Locked | Pending Phase C | - | Primary-source verification, offering classification/versioning, deterministic eligibility, and evidence-grounded explanations. |
| E Canonical PDF and consultant notes | Locked | Pending Phase D | - | Deterministic PDF, private artifact storage, signed download, hashes, versions, and draft/accepted notes. |
| F Durable lead and salesperson core | Locked | Pending Phase E | - | Versioned consent, idempotent lead, deterministic assignment, attached report, salesperson detail, and events. |
| G Transformation Copilot | Locked | Pending Phase F | - | Persisted chat, authorized typed tools, confirmed writes, and live/fallback disclosure. Document RAG remains P1. |
| H Outbox and minimal application integration | Locked | Pending Phase G | - | Durable retryable delivery adapter and smallest stable-UI integration needed to expose V2. |
| I Final challenge and release proof | Locked | Pending Phase H | - | Five-minute, live-AI, report, sales, security, separate deployment, and submission proof. |

## Validation policy

Per phase, run targeted changed-module tests, TypeScript checking when relevant, lint only when relevant, and one focused route/API smoke path when a journey changes. Broader relevant suites run once after persistence/RLS, live AI/Copilot, report/sales, and final release. The V2 main task returns only `accepted`, `correction required`, or `re-planned` after each stage review.
