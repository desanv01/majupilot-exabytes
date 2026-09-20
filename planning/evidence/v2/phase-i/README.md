# Phase I final challenge and release proof

**State:** Under review

**Proof date:** 20 September 2026 (MYT)

**Baseline:** `2ea382b`

**Branch:** `codex/phase-i-final-release-proof`

This pack records the final achievable release gate without claiming hosted success that the managed worktree could not perform. It contains no credentials, raw prompts, model reasoning, private report URLs, or consultation contact payloads.

## Outcome

- Production build: passed on Next.js 16.3.5; 35 static pages generated and all V2 dynamic routes compiled.
- Representative guest-first keyboard journey: passed in 3.284 seconds to the generated Blueprint, well below five minutes. Registration was not required.
- Browser/API boundary: consultation completed with a safe receipt; no console errors, failed same-origin fetches, framework overlay, desktop/mobile overflow, or serious/critical axe violations.
- Deterministic cases: CASE A and B deferred governed AI as `why_later`; ready CASE C selected governed AI as `why_now`. Frozen maturity, readiness, cost, net-value, and payback values matched.
- Database/RLS: all 8 pgTAP files and 125 assertions passed, including guest, revocation, tenant, cross-tenant, consultant, assigned salesperson, sales manager, system admin, private Storage, lead, Copilot confirmation, and outbox boundaries.
- Code gate: 47 test files / 220 tests passed; one test file / one test remained intentionally skipped. Type-check passed. Lint passed with one non-blocking existing unused type-only import warning. Production dependency audit found zero vulnerabilities.
- API smokes: guest restart/resume and revocation denial passed. Copilot typed read, replay idempotency, truthful AI-disabled disclosure, injection rejection, unknown-tool rejection, cross-session denial, and persisted history passed. Required mode without credentials returned the required visible `503 AI_REQUIRED_UNAVAILABLE` response.

## Evidence index

| Evidence | Purpose |
|---|---|
| `release-proof.json` | Compact machine-readable pass/gate summary |
| `p0-coverage.md` | All 51 frozen P0 rows mapped to final evidence or disclosure |
| `browser/stage-07-browser-evidence.json` | Timed journey, deterministic equality, accessibility, responsive, header, console, and network evidence |
| `browser/stage-07-case-c-blueprint.png` | Sanitized ready-SME Blueprint screenshot; fictional data only |
| `supabase/tests/001`–`008` command result | 125 passing database security/workflow assertions; output intentionally not duplicated with data rows |

## Exact commands and results

| Command | Result |
|---|---|
| `npx supabase test db` | PASS — 8 files, 125 assertions |
| `npm run test:phase-b:smoke` | PASS — restart/resume and revoked guest denial |
| `npm run test:phase-g:smoke` | PASS — typed read, replay, injection/tool/session denial, persisted history |
| `npm run test:phase-c:smoke` | PASS — disabled/preferred/required contracts; required unavailable is visible |
| `npm test` | PASS — 47 passed / 1 skipped files; 220 passed / 1 skipped tests |
| `npm run type-check` | PASS |
| `npm run lint` | PASS with one warning, zero errors |
| `npm run test:stage07:browser` | PASS after correcting the proof selector to distinguish the cleared-status banner from an active fictional-demo banner |
| `npm run audit:production` | PASS — zero vulnerabilities |

## Live Gateway proof and remaining environment gates

The fresh Phase I required-mode Gateway call passed with `deepseek/deepseek-v4.1-flash`: 523 input tokens, 107 output tokens, estimated cost USD 0.000285, 1,297 ms latency, zero retries, and no raw prompt/answer payload persisted. The proof harness was updated to recognize the five safe telemetry columns added in Phase G.

1. **Hosted V2 Supabase:** no hosted V2 Supabase variables are present. Local migrations, RLS, private Storage, API restart, and workflow proofs passed.
2. **External webhook receipt:** no approved webhook destination/secret is present. Signing, SSRF rejection, retry, idempotency, dead-letter, and replay behavior passed locally; external delivery is not claimed.
3. **Separate Vercel deployment:** this worktree has no `.vercel` link, Vercel CLI, or Vercel project/deploy credentials. The local production build passed; no hosted deployment is claimed.

The locked P1 document-RAG row remains deliberately deferred and is not represented as Phase I work.
