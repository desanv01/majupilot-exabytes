# UI Upgrade Phase 01 - Home and First Viewport

Status: ready for implementation.

Implementer profile: GPT-5.6 Sol, high reasoning.

Branch: `codex/ui-phase-01-home-first-viewport`.

## Objective

Replace the current generic homepage with a distinctive, responsive, trustworthy first viewport and supporting home narrative. This is a full homepage redesign, not a styling patch.

## Required reading

- `planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md`;
- `sme-growth-twin/DESIGN.md`;
- `sme-growth-twin/DESIGN-TOKENS.md`;
- `sme-growth-twin/REFERENCE-BOARD.md`;
- existing Stage 01 packet and design review;
- `planning/MIROFISH-REFERENCE-MAP.md`;
- `sme-growth-twin/AGENTS.md` and the local Next.js documentation it names.

Use the applicable UI/UX, Design Taste, 12ui, Next.js, React, and browser-verification skills. Read each selected skill before acting.

## Visual target

Use `planning/design/ui-upgrade/phase-01-home/selected-home-d.png` as the selected design evidence. It establishes the editorial dark-ink direction, not literal content. The corrections in `REFERENCE-BOARD.md` are mandatory.

## Allowed implementation surface

- `sme-growth-twin/src/app/page.tsx`;
- `sme-growth-twin/src/app/layout.tsx` for fonts and application shell only;
- the existing brand and home-action components;
- new components under `sme-growth-twin/src/components/home/`;
- token and homepage portions of the main stylesheet, or a clean equivalent consistent with current architecture;
- font and icon dependencies when justified;
- focused homepage tests and phase evidence documents.

Do not refactor scoring, schemas, persistence, AI, catalogue, scenario, blueprint, or consultation logic in this phase.

## Protected behavior

- Start assessment must enter the existing flow.
- Resume assessment appears only when resumable local state exists and resumes correctly.
- Demo cases retain their accepted reset and loading behavior.
- Consent, privacy, AI disclosure, catalogue disclosure, and evidence boundaries stay accurate.
- Existing routes, URLs, test hooks, storage keys, and deterministic contracts remain compatible.

## Required composition

1. A header no taller than 72px with clear product identity and navigation.
2. An asymmetric deep-ink hero with a two-line maximum headline.
3. A support sentence of 20 words or fewer.
4. Start assessment as the dominant action and resume as a conditional secondary action.
5. A real read-only Case A Business Twin preview, clearly marked fictional.
6. Reliability and evidence framing immediately after the hero.
7. The five assessment topics before demo-case promotion.
8. Demo cases as a secondary exploration path.
9. Clear AI, catalogue, evidence, and privacy disclosures.

The Case A preview may show fixture facts and evidence already present in the repository. It must not expose later scores, recommendations, scenarios, advisor conclusions, lead details, or a misleading live-state claim.

## Required states

- pristine first visit;
- resumable assessment;
- demo loading and demo reset;
- keyboard focus;
- reduced motion;
- narrow mobile navigation and content wrapping;
- degraded or unavailable non-essential enhancement without blocking the start action.

## Implementation rules

- Use DM Sans and Libre Baskerville through `next/font` or a checked-in package.
- Use one consistent SVG icon family if icons are needed. Phosphor is acceptable.
- Do not ship the generated lifestyle photo, a fake dashboard, dark mode, decorative gradients, or a new product claim.
- Use semantic tokens, readable sizes, 44px targets, and no visible em dashes or en dashes.
- Prefer Server Components. Isolate only stateful leaves as Client Components.
- Use CSS or isolated leaf motion. Do not use window scroll listeners.
- Prevent horizontal overflow at every required viewport.

## Acceptance and evidence

Run and report:

- lint;
- type-check;
- full test suite;
- production build;
- focused homepage behavior tests;
- the established Stage 07 end-to-end browser flow;
- browser console and failed-request inspection;
- accessibility scan;
- screenshots at 1440, 1024, 390, and 360px, including pristine and resume states.

Return the files changed, decisions made, command outcomes, screenshot paths, limitations, commit, pushed branch, and pull-request URL. Do not merge the pull request. The main task owns review and acceptance.
