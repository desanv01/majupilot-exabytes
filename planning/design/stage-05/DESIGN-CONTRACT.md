# Stage 05 Design Contract

Status: **Frozen**
Reference family: approved Stage 04 implementation and Candidate D visual system

The unavailable 12ui service is not a Stage 05 blocker. This contract preserves
the existing navy/teal editorial interface, white report surfaces, restrained
blue and amber semantic panels, Georgia display headings, compact evidence
labels, generous spacing, and 44 px controls.

## Required screen states

### 1. Advisor review in progress / fallback resolution

- `/blueprint` keeps the four-step journey rail with Blueprint current.
- A finite status list shows the five roles, each as ready, reviewing, live,
  fallback, or failed-safe. No indefinite spinner.
- A short disclosure explains that live model review is optional and numeric
  results remain deterministic.

### 2. Advisor panel and synthesis

- Five visually distinct but coherent advisor cards appear in frozen role order.
- Each card shows position, origin badge, confidence, support, concerns, missing
  evidence, adjustments, and inspectable evidence references.
- Agreement, disagreement, conditions, and open questions use separate semantic
  panels. Empty disagreements must say `No material disagreement detected`, not
  disappear.
- Model-origin content and deterministic fallback content are unmistakable.

### 3. Blueprint preview

- Report toolbar: `Back to scenarios`, `Regenerate review`, and
  `Print / save as PDF`.
- Executive summary and selected-scenario decision appear before detail.
- Sections follow Model 1.0.0 order with a readable contents rail on desktop and
  a compact section menu on small screens.
- Numbers use existing low/base/high order and labels; no invented charts,
  quotes, testimonials, countdowns, ratings, or recommendation badge.
- Consultation is a non-form preview only and explicitly says Stage 06.

### 4. Print

- Clean A4 report without application navigation, buttons, sticky UI, shadows,
  accordions, clipped timeline, or background-heavy cards.
- All evidence and assumptions required to interpret the report are expanded.

## Responsive contract

- At 360 px, every section is a single column with no horizontal scroll.
- Advisor cards and synthesis panels stack; no swipe-only carousel.
- Timeline changes to a vertical month list.
- Evidence IDs and long source references wrap safely.
- Routine body text remains at least 16 px on mobile; labels at least 14 px.
- Keyboard focus, reduced motion, native headings, lists, details, and landmarks
  remain visible and correctly ordered.
