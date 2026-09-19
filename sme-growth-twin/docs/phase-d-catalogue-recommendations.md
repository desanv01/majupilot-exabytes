# Phase D: catalogue and recommendation explanations

Phase D activates Catalogue 2.0.0 after a 20 September 2026 primary-source review. The source register and complete classification matrix are in `planning/catalogue/EXABYTES-CATALOGUE-2.0.0.md`.

## Deterministic authority

`buildRecommendationResult` still performs capability selection and ranking before catalogue mapping. `mapOfferingsAfterSelection` accepts only schema-valid, active, approved, source-backed offerings. Inactive, unavailable, malformed, or unmapped entries fail closed without removing the underlying capability guidance.

Catalogue lifecycle helpers produce stable diffs and a new draft snapshot for disable operations. The Phase D migration adds append-only review events, catalogue-admin policies, guarded state transitions, immutable activated children, Catalogue 2.0.0 rows, and a safe public projection. Old Blueprint and recommendation payloads retain their embedded catalogue version and facts.

## Live explanation contract

`POST /api/v2/recommendations/explanation` accepts an owned assessment UUID, an owned persisted recommendation-run UUID, one capability ID, and same-assessment evidence UUIDs. The server loads the canonical persisted recommendation and redacted evidence values; callers cannot provide product facts or a replacement recommendation.

The live model returns strict structured output for rationale, observed evidence, expected operational change, timing, adoption risk, first success measure, one consultant validation question, and a counterfactual alternative. Post-validation rejects unknown evidence, recommendation, catalogue-source, or alternative IDs and rejects unsupported price, percentage, duration, and guarantee claims.

Execution uses the Phase C server-only Gateway adapter rules, preflight, timeout, one-retry ceiling, rate limit, daily/per-call budget, and redacted model-call telemetry. `required` mode surfaces provider or validation failure. `preferred` mode may return a clearly labelled deterministic explanation. `disabled` mode records `ai_disabled` and returns no live explanation.

No prompt, raw evidence value, response body, credential, price, ROI, or timeline is written to model-call telemetry.
