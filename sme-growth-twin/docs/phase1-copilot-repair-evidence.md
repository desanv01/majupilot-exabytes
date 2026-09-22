# Phase 1 Copilot repair evidence

## Scope and commit

- Branch: `codex/phase1-copilot-repair`
- Baseline: `b493f8f`
- Reviewed implementation commit: `9792f9c76f27b9c5b7c258de49c446729d6d82f3`.
- Retry correction commit: this file's next containing commit; its exact SHA is recorded in the final handoff because a Git commit cannot contain its own hash.
- Boundary preserved: Blueprint sync remains the browser prerequisite. No Blueprint navigation/resync work, document RAG, redesign, deployment, or later-phase work is included.

## Root cause and reproduction

The production failure was a contract and hydration gap rather than a deterministic-evidence failure:

1. Copilot routes returned inconsistent error shapes. AI failures had a code and request ID but no category; persistence/session and validation failures used a separate envelope.
2. HTTP 429 was incorrectly classified as budget exhaustion rather than rate limiting.
3. The browser discarded the request ID, retryability, and category, rendered only generic status text, and never loaded the authorized server message ledger after opening a session. Refresh therefore lost visible history.
4. Retry had no stable failed-turn key. The repair reuses the original logical key, removes the failed optimistic status without adding another user bubble, and stores immutable attempt receipts. A retryable base failure permits exactly one separately claimed re-execution; its immutable result is then replayed. Non-retryable failures remain terminal.

Safe hosted baseline reproduction against `https://majupilot-exabytes.vercel.app` used only a fresh guest and fictional data:

- Invalid synthetic session: HTTP 404, code `NOT_FOUND`, request ID `e4ac34a0-973c-425f-9247-f8e67b295371`. Phase 1 maps this to `session_failure`.
- Successful live turn: request ID `e4beda21-24ed-4785-bfa5-77099cd69cbf`, state `live`; executed tools included `getEvidenceForClaim` and `getBusinessTwinSummary`.
- The hosted deployment was not changed, so it does not yet emit the new `category` field or patched history/retry UI. The hosted release smoke now asserts those behaviors for the next authorized deployment.

## Implemented contract

- Safe categories: `model_unavailable`, `invalid_output`, `timeout`, `budget_exceeded`, `rate_limited`, `session_failure`, `persistence_failure`, and `validation`.
- Every Copilot error response carries the same correlation ID in the body and `X-Correlation-ID` header. Provider messages, prompts, credentials, and database details are never returned.
- Gateway semantics: 402 is budget exhaustion, 408/abort is timeout, and 429 is rate limiting.
- Authorized history is loaded from `GET /api/v2/copilot/sessions/{id}/messages` with `no-store` and restored after refresh.
- Turn Retry is shown only for retryable failures, retains the original logical idempotency key, avoids a second optimistic user message, and permits one hashed claim/result attempt. Concurrent callers fail closed while one claimant executes; a lost response replays the durable result.
- Workspace-open Retry is rendered only when the opening error is retryable. Non-retryable session and validation failures retain their diagnostic ID without an endless Retry action.

## Verification

- Focused Vitest: 2 files, 10 tests passed.
- TypeScript: `npm run type-check` passed.
- ESLint: `npm run lint` passed.
- Next.js 16.3.5 production build: passed; 38 static pages generated and all Copilot routes compiled.
- Synthetic API smoke: passed with 18 persisted messages after server restart, stable replay, prompt-injection and unknown-tool rejection, and cross-session denial.
- Grounded read request IDs:
  - `getEvidenceForClaim`: `d99a92e7-97de-47d2-8fa7-4536a9a24b4f`
  - `getBusinessTwinSummary`: `2e835ac3-d66a-4546-a39a-b844600a1a6d`
  - `listRecommendations`: `b117a698-9b1f-4ce4-a18b-289c18ccdf22`
  - `compareScenarios`: `636ecd3b-2d50-4240-881e-6f813a5ab107`
  - `getBlueprint`: `900f59d4-e25a-4de3-9c80-49551bee866a`
- Safe local failure proof: category `session_failure`, request ID `fae084d2-e237-4e14-8803-b20e6eb9d0ff`.

## Evidence non-mutation and authorization

- The required-mode retry test snapshots deterministic evidence, records one pending confirmation proposal, fails with a retryable timeout, then proves one claimed same-key re-execution can succeed and replay without duplicating the user row or proposal.
- A terminal invalid-output test proves non-retryable receipts never re-enter execution. A concurrent-claim test proves one executor wins while the other receives a safe retryable persistence response and later replays the winner's durable result.
- The API smoke reads the same persisted evidence before and after invalid-session, prompt-injection, and unknown-tool probes; the grounded result is byte-for-byte unchanged.
- Session creation, history, turns, reads, proposals, and confirmations continue to resolve an owner and re-authorize the session. Cross-session history access fails closed.
- Write tools still create pending confirmation proposals only. Execution remains behind explicit `CONFIRM`, owner authorization, stable execution idempotency, service-role-only tables, and immutable chat/audit/receipt triggers.

## Files changed

- Copilot routes and shared safe error envelope.
- AI error domain and Gateway classification.
- Copilot turn execution receipts and retry replay.
- Copilot client history, diagnostics, and retry behavior plus minimal diagnostic styling.
- Focused unit tests, local API smoke, and hosted release smoke assertions.

## Known limits

- No push, merge, deployment, PR, or production configuration change was made.
- The updated hosted smoke was syntax-checked but not run end-to-end against the undeployed patch; its prior Chrome launch was unavailable in this environment.
- Document ingestion/RAG remains explicitly out of scope.
