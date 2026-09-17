# Contributing

SME Growth Twin is developed through gated stages governed by the planning contracts in `planning/`.

## Workflow

1. Start from the latest accepted `main` branch.
2. Create a focused branch such as `stage/04-scenario-roi-lab` or `fix/<short-description>`.
3. Link the change to a frozen stage contract or record the decision being amended.
4. Keep provider-specific knowledge in its domain pack; keep `src/core/` provider-neutral.
5. Add or update tests for every calculation, persistence, boundary, or user-flow change.
6. Run lint, type checking, tests, and the production build locally.
7. Open a pull request with scope, evidence, assumptions, and known limitations.

## Required local gates

```bash
cd sme-growth-twin
npm ci
npm run lint
npm run type-check
npm test
npm run build
```

## Calculation and AI rules

- Code owns scores, ranks, budgets, prerequisites, ROI, timelines, and persistence.
- Models may interpret or critique structured facts but may not invent product facts or perform authoritative arithmetic.
- Every material output must retain evidence, assumption, formula, and version provenance.
- Do not mechanically translate or copy MiroFish code, prompts, names, assets, or directory structure.

