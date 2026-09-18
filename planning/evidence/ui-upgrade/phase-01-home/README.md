# Phase 01 home verification evidence

## Scope

- Route: `/`
- States: pristine and valid saved-assessment resume
- Viewports: 1440 x 1000, 1024 x 900, 390 x 844, and 360 x 800
- Visual source: `planning/design/ui-upgrade/phase-01-home/selected-home-d.png`
- Preserved contracts: assessment routes, local-storage keys, fictional demo fixtures, reset behavior, and Stage 07 browser hooks

## Captures

| State | 1440 | 1024 | 390 | 360 |
| --- | --- | --- | --- | --- |
| Pristine | `home-pristine-1440.png` | `home-pristine-1024.png` | `home-pristine-390.png` | `home-pristine-360.png` |
| Resume | `home-resume-1440.png` | `home-resume-1024.png` | `home-resume-390.png` | `home-resume-360.png` |

All captures were refreshed from the final production build. The resume state was created through the real `Start assessment` flow and then verified on return to the homepage.

## Automated gates

| Gate | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run type-check` | Pass |
| `npm test` | Pass, 24 files and 139 tests |
| `npm run build` | Pass, Next.js 16.3.5 production build |
| `npm run test:stage07:browser` | Pass |
| `git diff --check` | Pass; line-ending notices only |

The Stage 07 browser gate completed the keyboard-driven Case A journey, validated all three deterministic cases, checked the scoped reset, security headers, consultation receipt safety, and every product route at 1440 and 360 px. It reported no console errors, failed requests, overlays, or horizontal overflow; all routine targets were at least 44 px high.

## Focused browser checks

- Full WCAG A/AA axe run on the homepage: 24 passing rules, zero incomplete checks, zero violations.
- Stage 07 serious/critical axe checks: zero findings across homepage, assessment, reviewed Blueprint, consultation, consultation success, desktop state routes, and mobile Blueprint.
- Keyboard: the brand link is first, the primary assessment action is reachable, and the visible focus outline is 3 px.
- Reduced motion: entry animations resolve to `none` and button transitions resolve to `0s` when `prefers-reduced-motion: reduce` is active.
- Network: final homepage reload produced 24 requests and zero failures.
- Responsive: no horizontal overflow at 1440, 1024, 390, or 360 px; the hero headline remains exactly two lines at each width.
- Content audit: no fabricated scores or results, no stock imagery, no visible en/em dashes, and all five required assessment topics appear before the demo section.

## Implementation notes

The homepage uses the selected direction's deep-ink, warm-paper, evidence-teal visual language while correcting its earlier hierarchy and responsiveness issues. The preview is rendered directly from the accepted fictional Case A fixture, remains read-only, and labels both its fictional status and source evidence. Start is always available, Resume appears only for a valid draft, and storage failures degrade to non-blocking status messages.
