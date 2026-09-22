# Phase 1 Copilot repair evidence

## Scope and commit

- Branch: `codex/phase1-copilot-repair`
- Baseline: `b493f8f`
- Reviewed implementation commit: `9792f9c76f27b9c5b7c258de49c446729d6d82f3`.
- Retry correction snapshot: `1965ff141d03ffc1d87005ec0a0421a1cc2a3e15`.
- Request-binding and executed-evidence follow-up: this file's next containing commit; its exact SHA is recorded in the final handoff because a Git commit cannot contain its own hash.
- Boundary preserved: Blueprint sync remains the browser prerequisite. No Blueprint navigation/resync work, document RAG, redesign, production deployment, or later-phase work is included.

## Root cause and reproduction

The production failure was a contract and hydration gap rather than a deterministic-evidence failure:

1. Copilot routes returned inconsistent error shapes. AI failures had a code and request ID but no category; persistence/session and validation failures used a separate envelope.
2. HTTP 429 was incorrectly classified as budget exhaustion rather than rate limiting.
3. The browser discarded the request ID, retryability, and category, rendered only generic status text, and never loaded the authorized server message ledger after opening a session. Refresh therefore lost visible history.
4. Retry had no stable failed-turn key. The repair reuses the original logical key, removes the failed optimistic status without adding another user bubble, and stores immutable attempt receipts. A retryable base failure permits exactly one separately claimed re-execution; its immutable result is then replayed. Non-retryable failures remain terminal.

Safe hosted baseline reproduction against `https://majupilot-exabytes.vercel.app` used only a fresh guest and fictional data:

- Invalid synthetic session: HTTP 404, code `NOT_FOUND`, request ID `e4ac34a0-973c-425f-9247-f8e67b295371`. Phase 1 maps this to `session_failure`.
- Successful live turn: request ID `e4beda21-24ed-4785-bfa5-77099cd69cbf`, state `live`; executed tools included `getEvidenceForClaim` and `getBusinessTwinSummary`.
- Production `main` was not changed. The patched behavior was exercised on the isolated Vercel branch preview.

## Implemented contract

- Safe categories: `model_unavailable`, `invalid_output`, `timeout`, `budget_exceeded`, `rate_limited`, `session_failure`, `persistence_failure`, and `validation`.
- Every Copilot error response carries the same correlation ID in the body and `X-Correlation-ID` header. Provider messages, prompts, credentials, and database details are never returned.
- Gateway semantics: 402 is budget exhaustion, 408/abort is timeout, and 429 is rate limiting.
- Authorized history is loaded from `GET /api/v2/copilot/sessions/{id}/messages` with `no-store` and restored after refresh.
- Turn Retry is shown only for retryable failures, retains the original logical idempotency key, avoids a second optimistic user message, and permits one hashed claim/result attempt. Concurrent callers fail closed while one claimant executes; a lost response replays the durable result.
- Workspace-open Retry is rendered only when the opening error is retryable. Non-retryable session and validation failures retain their diagnostic ID without an endless Retry action.

## Verification

- Focused Vitest: 2 files, 11 tests passed.
- Full Vitest suite: 48 files passed, 1 skipped; 228 tests passed, 1 skipped.
- TypeScript: `npm run type-check` passed.
- ESLint: `npm run lint` passed.
- Next.js 16.3.5 production build: passed; 38 static pages generated and all Copilot routes compiled.
- Synthetic API smoke: passed with 18 persisted messages after server restart, stable replay, prompt-injection and unknown-tool rejection, and cross-session denial.
- The API smoke ran against the repository-pinned local Supabase 2.117.0 stack with all checked-in migrations applied; it did not use an in-memory persistence substitute.
- Grounded read request IDs:
  - `getEvidenceForClaim`: `6c2559d2-f360-47d3-95f2-8b2828f9b542`
  - `getBusinessTwinSummary`: `01228163-faeb-48c9-b753-d623c3fc0356`
  - `listRecommendations`: `02c6873d-542d-4f2d-87cc-3e41cfdf2987`
  - `compareScenarios`: `89b59bfd-29c6-43c2-a94d-9b150c80d33b`
  - `getBlueprint`: `fb3a2850-bbc1-49de-abe4-9f1db4020d19`
- Safe local failure proof: category `session_failure`, request ID `b7987d89-d28d-4784-8af3-9933e857c100`.

### Hosted branch-preview proof

- Preview: `https://majupilot-exabytes-ijd2nwdg1-desans-projects.vercel.app` for commit `12e75bf0057db24481a8e6420dcd655ab0e7e5c5`.
- Focused hosted run ID: `8d588681-7fae-4a5d-8271-bb6a3d3731fe`.
- The run created only explicitly labelled synthetic records in the configured hosted Supabase project:
  - assessment session `851aa638-0e2a-40e1-aa4f-d21f5f500fbf`
  - Business Twin `c7d44efe-b716-426e-91ba-dd3d10c7aaf7`
  - evidence `b7f123c2-c74e-4f15-bc6c-0cb54aa2ffbf`
  - Blueprint `f3a138ce-71ab-464b-98dd-5f3fb718734b`
  - Copilot session `8103b4ea-f024-469b-b98f-267e8e3ca4f3`
- Live turn `f21a9712-c12a-452c-981e-8015ba0816d9` used `deepseek/deepseek-v4.1-flash` and executed both `getBusinessTwinSummary` and `getEvidenceForClaim`.
- Same-key replay returned the durable result with the history fixed at four messages.
- Safe hosted failure: category `session_failure`, request ID `e7de9aea-7734-47e8-956a-0ca2ab09f728`, `retryable: false`.
- A second guest was denied, and the persisted evidence row was byte-for-byte unchanged after replay and failure probes.

### Branch CI

- GitHub Actions run `35693513668` completed successfully for branch commit `12e75bf0057db24481a8e6420dcd655ab0e7e5c5`.
- The workflow now validates pushes to `codex/**`, so isolated phase branches receive CI without a pull request or a `main` push.
- Vercel preview deployment completed successfully. Supabase Preview was skipped by the integration; local Supabase 2.117.0 plus the configured hosted database were both exercised directly.

## Evidence non-mutation and authorization

- The required-mode retry test snapshots deterministic evidence, records one pending confirmation proposal, fails with a retryable timeout, then proves one claimed same-key re-execution can succeed and replay without duplicating the user row or proposal.
- A terminal invalid-output test proves non-retryable receipts never re-enter execution. A concurrent-claim test proves one executor wins while the other receives a safe retryable persistence response and later replays the winner's durable result.
- Each claim is bound to the canonical request payload hash. Reusing the same idempotency key with different text or tool input fails with `IDEMPOTENCY_CONFLICT` before model or tool execution.
- The API smoke reads the same persisted evidence before and after invalid-session, prompt-injection, and unknown-tool probes; the grounded result is byte-for-byte unchanged.
- Session creation, history, turns, reads, proposals, and confirmations continue to resolve an owner and re-authorize the session. Cross-session history access fails closed.
- Write tools still create pending confirmation proposals only. Execution remains behind explicit `CONFIRM`, owner authorization, stable execution idempotency, service-role-only tables, and immutable chat/audit/receipt triggers.

## Files changed

- Copilot routes and shared safe error envelope.
- AI error domain and Gateway classification.
- Copilot turn execution receipts and retry replay.
- Copilot client history, diagnostics, and retry behavior plus minimal diagnostic styling.
- Focused unit tests, local Supabase API smoke, focused hosted Copilot smoke, and hosted release smoke assertions.
- Branch-only CI trigger for `codex/**`.

## Remaining boundaries

- The Phase 1 branch was pushed and received a Vercel preview only. No pull request, merge, `main` update, or production deployment was performed.
- The broad release smoke is still a later release gate; Phase 1 now has a dedicated hosted Copilot smoke that passed against the protected preview.
- Document ingestion/RAG remains explicitly out of scope for Phase 1.
