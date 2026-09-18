# Stage 07 design review

Status: **Frozen local reference**  
Date: **18 September 2026**

## Decision

Stage 07 does not introduce a new visual language. Its demo-case launcher,
reset affordance, reliability strip, release/error states, and recording views
must compose the accepted Stage 06 system: warm-white canvas, deep navy
editorial headings, calm sans-serif body, teal/seafoam evidence treatment,
restrained coral/amber warnings, spacious cards, 44 px minimum controls,
visible focus, and 360 px-safe stacking.

The required 12ui workflow was invoked with the Stage 07 fictional-demo brief
and the accepted Stage 06 consultation screenshot. The security gate rejected
that exact external disclosure because it required new payload-specific user
approval. No bypass or duplicate paid run was attempted. The materially safer
fallback is to use the already accepted, repository-local Stage 06 screenshots
as the binding visual reference and keep Stage 07 UI changes compositional.

## Binding local references

- `planning/design/stage-06/branch/screens/consultation-desktop.png`
- `planning/design/stage-06/branch/screens/consultation-success.png`
- `sme-growth-twin/artifacts/stage-06-consultation-mobile-360.png`
- `planning/design/stage-07/DESIGN-BRIEF.md`

## Required hierarchy

1. “Start assessment” remains the dominant primary action.
2. Fictional demonstration cases are explicitly secondary and labelled.
3. Case A is marked as the recommended recording path; Cases B and C remain
   equally valid golden-case tests, not decorative samples.
4. Loading a fixture states that it replaces this device's saved prototype
   records and never suggests production customer data.
5. Reset is quiet but discoverable, requires confirmation, and clears only
   known application keys.
6. The reliability strip states only verified properties: deterministic
   calculations, evidence-linked recommendations, and model-failure fallback.

## Rejected patterns

- admin or consultant dashboards;
- testimonials, customer logos, or adoption claims;
- invented scores or product facts on the launcher;
- countdowns, gamification, animated spectacle, or a dark SaaS aesthetic;
- a single “magic demo” control that hides which records are created;
- destructive clearing of all origin storage instead of known project keys;
- unverified privacy, security, deployment, or production-readiness claims.

## Close requirement

The implemented desktop and 360 px launcher must be visually inspected against
the local references. The browser gate must prove no horizontal overflow,
minimum 44 px interactive targets, visible keyboard focus, correct fixture and
reset behavior, clean console state, and recording-readable text.
