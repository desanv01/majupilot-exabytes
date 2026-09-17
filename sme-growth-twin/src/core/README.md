# Deterministic core boundary

The core contains pure TypeScript rules. Core modules may import contracts from
`src/domain`; they must not import `src/infrastructure`, environment variables,
model-provider code, persistence adapters, or Next.js APIs.

The approved future module boundaries are:

- `assessment` — question flow and answer normalization
- `scoring` — maturity and readiness rules
- `pain-points` — classification and deterministic ranking
- `recommendations` — capability-first matching
- `scenarios` — scenario state and deterministic transitions
- `roi` — financial/value calculations
- `advisors` — structured advisor findings and synthesis contracts
- `blueprint` — report model composition

Stage 00 implements none of those feature rules.
