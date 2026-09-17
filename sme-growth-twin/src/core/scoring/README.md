# Scoring core

`diagnostic-scoring.ts` contains the pure score model `1.0.0` for digital
maturity and AI readiness. It receives a validated Business Twin, excludes
unavailable evidence, re-normalizes available weights, and emits evidence-linked
dimension and overall results. `build-diagnostic.ts` composes scores with the
pain model; callers inject result IDs and timestamps.

This module must not import browser, persistence, routing, network, time,
randomness, or model-provider concerns.
