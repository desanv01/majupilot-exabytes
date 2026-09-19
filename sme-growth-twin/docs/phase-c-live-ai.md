# Phase C live AI and dynamic follow-up

Phase C adds one bounded live-AI operation without changing the deterministic decision kernel. `POST /api/v2/assessment/follow-up` revalidates guest or organization ownership, verifies every evidence UUID belongs to that assessment, deterministically selects the highest-impact unanswered intent, and permits the model to phrase exactly that one question. The server rejects a changed intent, answer type, choice set, or unsupported evidence reference. The automatic-follow-up count comes only from persisted delivered `model_calls` outcomes, never client input, and stops at three. Responses always require confirmation; this route does not write an answer or recalculate a score.

## Execution policy

`AI_EXECUTION_MODE` is server-only and defaults to `required` when absent. Unknown values fail closed.

- `required`: current-model preflight and the live structured result must succeed. Stable errors are `AI_REQUIRED_UNAVAILABLE`, `AI_INVALID_OUTPUT`, `AI_BUDGET_EXCEEDED`, and `AI_TIMEOUT`. There is no fallback response.
- `preferred`: the same live path is attempted first. A safe failure returns the authoritative deterministic question with `state=deterministic_fallback`.
- `disabled`: no catalogue or model call occurs. The deterministic question is returned with `state=ai_disabled`.

`GET /api/v2/ai/preflight` checks the configured exact model against the current official Gateway catalogue. Required mode fails visibly; preferred mode reports an unavailable live path plus fallback availability; disabled mode performs no provider/catalogue call. The competition/demo environment must set `AI_EXECUTION_MODE=required` and an exact `AI_GATEWAY_MODEL_FOLLOW_UP` or `AI_GATEWAY_MODEL` from the current catalogue.

## Bounds and telemetry

The follow-up operation has one generation step, a 20-second total deadline, one transient retry at most, a 1,200 estimated-input-token ceiling, 320 output tokens, a per-call cost ceiling, a rolling subject/IP rate limit, a three-call concurrency cap, and a tenant/guest daily cost ceiling. Provider pricing used for the estimate comes from the preflight catalogue rather than a hard-coded model table.

Every attempted, disabled, failed, fallback, or successful operation appends a redacted `model_calls` row after assessment ownership is checked. Stored data is limited to operation/provider/exact model, prompt and schema versions, timestamps/latency, token usage, estimated cost, retry count, outcome/safe fallback reason, and UUID evidence references. Raw prompts, answers, business identity/description, contact fields, credentials, provider payloads, and provider error strings are never stored or returned.

The existing advisor evidence validator remains authoritative. Its model route now uses the same execution mode, exact-current-model preflight, operation routing, timeout, and output-token policy. Required-mode advisor failure is returned visibly and is not silently converted by the browser into a live result.

## Focused verification

Run:

```text
npm run test -- tests/unit/phase-c-ai-policy.test.ts tests/unit/phase-c-follow-up.test.ts tests/unit/phase-c-persistence.test.ts tests/unit/phase-c-routes.test.ts
npm run type-check
npm run lint
npm run test:phase-c:smoke
```

The smoke starts isolated development servers for disabled, preferred, and required preflight behavior and sends a schema-invalid follow-up request. The real required-mode model call is executed separately by the credential-gated live harness below.

## Required-mode live exit evidence

On 20 September 2026 (MYT), `scripts/phase-c-live-gateway-proof.mjs` made one real `POST /api/v2/assessment/follow-up` call against the local Supabase stack with `AI_EXECUTION_MODE=required` and exact Gateway model `deepseek/deepseek-v4.1-flash`.

The response state was `live`. The corresponding redacted `model_calls` row recorded `outcome=success`, `provider=vercel_ai_gateway`, 523 input tokens, 154 output tokens, estimated cost USD 0.000342, latency 1,955 ms, and zero retries. The harness queried the complete stored row and verified that it contained only the frozen telemetry columns, no unexpected payload column, and none of the synthetic marker embedded in the submitted business answers. Credentials, cookies, raw prompts, raw answers, and provider payloads were neither printed nor committed.
