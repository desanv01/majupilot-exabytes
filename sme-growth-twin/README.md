# SME Growth Twin application

This directory is the canonical Next.js application root. The accepted build
currently includes the project foundation, discovery interview, Business Twin,
deterministic diagnostics, capability recommendations, scenario and ROI modeling,
the immutable Stage 05 advisor-reviewed Transformation Blueprint, and the
Stage 06 consented consultation handoff.

Stage 06 validates the complete current source chain before showing the form,
requires explicit versioned consent, and records one idempotent consultant-ready
lead through `POST /api/leads`. The prototype adapter is deliberately
process-local: it does not send email, call a webhook or CRM, expose a lead-list
endpoint, or provide durable multi-instance storage. The browser stores only a
safe receipt in `sessionStorage`; contact values remain in memory while the form
is open. Run `npm run test:stage06:browser` for the real Case A Blueprint-to-lead
journey, API consent and duplicate safety, desktop/mobile layout, keyboard/focus,
safe-receipt, clean-console, and Blueprint print checks.

Stage 05 works without any model credentials: each of the five roles resolves to
an evidence-linked deterministic fallback. Optional live reviews use the
server-only Vercel AI Gateway configuration shown in `.env.example`; the model
name is supplied at runtime, outputs are schema-validated, and a failed or invalid
role falls back independently without changing trusted scores, costs, ROI, scope,
or schedule. Run `npm run test:stage05:browser` for the frozen desktop, mobile,
print, persistence, accessibility-target, and exact-figure browser contract.

An opt-in live acceptance harness is also available:

```powershell
$env:AI_GATEWAY_MODEL="provider/model"
$env:AI_GATEWAY_API_KEY="..." # or set VERCEL_OIDC_TOKEN
npm run test:stage05:gateway-live
```

The live harness refuses to start without `AI_GATEWAY_MODEL` and either
`AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`. It exercises five real Gateway
model calls and therefore incurs provider/Gateway cost. It is intentionally not
run in CI. Harness output contains only bounded call metadata and never prints
credentials, prompts, business context, generated statements, or response bodies.
Live success also requires the Gateway account and project to satisfy Vercel's
authorization and payment prerequisites. HTTP 401, 402, and 403 responses are
terminal safe fallbacks and are not retried. The live-success gate has not passed
in an environment where the Gateway reports that a valid payment method is needed.

The repository-level [README](../README.md) describes the product, architecture,
status, roadmap, security posture, and contribution workflow. For application
details, see [Local development](./docs/local-development.md) and
[Architecture](./docs/architecture.md).
