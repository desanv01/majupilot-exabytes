# MajuPilot Design System Master

Status: curated and approved on 18 September 2026.

This file records the compact system used by implementation tasks. The complete authority is:

1. `../../DESIGN.md`;
2. `../../DESIGN-TOKENS.md`;
3. `../../REFERENCE-BOARD.md`;
4. the active phase packet.

## Design dials

- Variance: 6 of 10.
- Motion: 4 of 10.
- Density: 5 of 10.

## Identity

- Product UI: DM Sans, weights 400 to 700.
- Display accent: Libre Baskerville, weight 700.
- Primary ink: `#082D3F`.
- Warm paper: `#FFFDF8` and `#F7F4EC`.
- Action teal: `#087C79` and `#13A29B`.
- Text: `#17394B`; muted text: `#5B7181`; border: `#D8E4E2`.
- Warning: `#9A6414` on `#FFF2D7`.
- Error: `#A63E36` on `#FCE9E6`.
- Focus: `#F2A43A`.

## Component behavior

- Buttons use 10px radii and a minimum 44px target.
- Inputs use 8px radii, 16px input text, persistent labels, and visible focus rings.
- Panels use 16px radii and borders or tonal contrast before shadows.
- Full pills are reserved for compact status and taxonomy labels.
- Hover and press feedback takes 160 to 220ms without shifting layout.
- Entry motion takes 240 to 360ms and disappears under reduced-motion preferences.

## Page language

- Marketing surfaces may use a single deep-ink editorial block and asymmetric composition.
- Assessment and report surfaces prioritize scanability, provenance, and comparison.
- A real Case A preview is preferred over stock imagery or a fake product illustration.
- A page should have one dominant action, one obvious reading path, and no ornamental dashboard clutter.

## Prohibited patterns

- AI purple gradients, generic glassmorphism, decorative blobs, fake screenshots, stock lifestyle hero photography, and equal generic card grids.
- Unreadably small labels, icon-only controls without accessible names, scroll listeners, layout-shifting hover transforms, and uncontrolled one-off colors.
- Em dashes and en dashes in visible interface copy.
- Runtime Google Fonts stylesheets.

## Pre-delivery gate

- Verify 360, 390, 768, 1024, 1280, and 1440px widths.
- Verify keyboard navigation, focus visibility, reduced motion, contrast, target sizes, loading states, empty states, validation states, and no horizontal overflow.
- Verify the full assessment to consultation flow, deterministic outputs, provenance labels, print behavior, tests, build, and browser console.
