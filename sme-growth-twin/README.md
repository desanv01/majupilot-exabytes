# SME Growth Twin application

This directory is the canonical Next.js application root. The accepted build
currently includes the project foundation, discovery interview, Business Twin,
deterministic diagnostics, capability recommendations, scenario and ROI modeling,
and the immutable Stage 05 advisor-reviewed Transformation Blueprint.

Stage 05 works without any model credentials: each of the five roles resolves to
an evidence-linked deterministic fallback. Optional live reviews use the
server-only Vercel AI Gateway configuration shown in `.env.example`; the model
name is supplied at runtime, outputs are schema-validated, and a failed or invalid
role falls back independently without changing trusted scores, costs, ROI, scope,
or schedule. Run `npm run test:stage05:browser` for the frozen desktop, mobile,
print, persistence, accessibility-target, and exact-figure browser contract.

The repository-level [README](../README.md) describes the product, architecture,
status, roadmap, security posture, and contribution workflow. For application
details, see [Local development](./docs/local-development.md) and
[Architecture](./docs/architecture.md).
