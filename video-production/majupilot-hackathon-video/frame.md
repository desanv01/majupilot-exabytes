---
name: "MajuPilot Evidence Ledger Editorial"
version: 1
canvas: "1920x1080"
fps: 30
concept: "A warm editorial decision ledger: every chapter advances one continuous evidence path from five SME answers to an inspectable Blueprint and an explicitly consented handoff."
colors:
  ink_950: "#082D3F"
  ink_800: "#123F5B"
  paper_50: "#FFFDF8"
  paper_100: "#F7F4EC"
  surface: "#FFFFFF"
  text: "#17394B"
  muted: "#5B7181"
  border: "#D8E4E2"
  teal_700: "#087C79"
  teal_500: "#13A29B"
  teal_200: "#BFEAE3"
  teal_100: "#E4F5F1"
  amber_600: "#9A6414"
  amber_100: "#FFF2D7"
  coral_700: "#A63E36"
  coral_100: "#FCE9E6"
  focus: "#F2A43A"
typography:
  display:
    family: "EB Garamond"
    weights: [700]
    fallback: "Georgia, serif"
    source: "locally staged WOFF2; production-compatible proxy for the live app's Libre Baskerville register"
  body:
    family: "Inter"
    weights: [400, 700]
    fallback: "Arial, sans-serif"
    source: "locally staged WOFF2; production-compatible proxy for the live app's DM Sans register"
  data:
    family: "JetBrains Mono"
    weights: [400, 700]
    fallback: "Courier New, monospace"
    source: "locally staged WOFF2"
spacing:
  safe_x: 120
  safe_top: 92
  safe_bottom_without_captions: 88
  caption_keepout_bottom: 184
  grid: 24
components:
  corner_radius_small: 8
  corner_radius_medium: 14
  corner_radius_large: 22
  border_standard: "2px solid #D8E4E2"
  border_emphasis: "3px solid #087C79"
  depth: "flat paper planes; no glassmorphism; shadows only on lifted live-capture windows"
  chapter_transition: "vertical push, 0.45s, power2.inOut"
  primary_transition: "directional wipe/push left, 0.40s, power2.inOut"
  secondary_transition: "fade-through warm paper, 0.50s, sine.inOut"
accessibility:
  minimum_body_px: 28
  minimum_label_px: 20
  minimum_headline_px: 68
  target_contrast: "WCAG AA or better"
  captions: "keep essential content above y=896 (top 83% of frame)"
---

# MajuPilot frame system

## Overview

This is the canonical design truth for the MajuPilot hackathon film. It is derived from the
production UI tokens in `sme-growth-twin/src/app/styles.css` and the audited production surface in
`planning/VISUAL-AUDIT.md`. The film is not a generic AI interface. It should feel like a carefully
edited SME decision document whose evidence, assumptions, calculations, and consent boundary remain
visible.

The visual concept is **Evidence Ledger Editorial**. A thin teal evidence path enters at the left
edge, becomes a five-step journey rail, runs through diagrams and proof cards, and terminates at an
unchecked consent box. That repeated prop makes the film feel like one argument rather than a deck
of unrelated slides.

## The frame

- **Focal element:** one large claim, authentic product surface, or exact evidence value—not a grid
  of equally weighted cards.
- **Edge anchors:** chapter/index at upper left; time/evidence/source register at upper right; the
  evidence path rides the lower third but stays above the caption keep-out.
- **Supporting detail:** evidence stamps, provenance chips, version labels, section numbers, and
  restrained tabular data in the mono voice.
- **Background:** predominantly warm paper. Ink-navy chapter openings are allowed when they quote
  the production hero or Blueprint cover. Use hard surface changes and localized pale-teal fields;
  do not use full-screen neon or purple/blue gradients.

## Composition rules

1. Use a 12-column editorial field with a 120 px horizontal safe area. Asymmetry is preferred:
   roughly 7/5 or 8/4 splits, with the focal claim leading.
2. Headlines occupy 55–72% of the frame width at 68–116 px. Keep body copy between 28–38 px and
   labels/data between 20–26 px.
3. The production UI appears as real capture or a plainly labelled capture placeholder. Never
   reconstruct a vendor UI and pass it off as footage.
4. Numbers use tabular figures. A score, count, or range must retain its qualifier and evidence
   label; negative values stay visible.
5. Section changes may invert paper/ink, but the palette never changes. Teal indicates the active
   decision path, amber indicates an assumption/future boundary, and coral indicates risk or a
   prohibited/unchecked state.
6. Chapter markers are explicit: `01 — Problem / Objectives` through
   `06 — Industry Value / Future Potential`.
7. Essential content lives above y=896 whenever captions are present.

## Typography

The live app uses Libre Baskerville with DM Sans. Stage 3 uses local EB Garamond and Inter files as
deterministic, embeddable production-compatible proxies; Stage 5 must either keep these exact local
files or locally embed the app fonts before rendering. JetBrains Mono is reserved for evidence IDs,
versions, timestamps, routes, and numeric registers. Never substitute a second expressive display
face.

## Motion posture for Stage 5

- Primary direction is leftward progression: the evidence path advances left-to-right while scene
  handoffs push the old frame left.
- Related beats use the registry `directional-wipe` component. Chapter changes use a hand-authored
  vertical push from the HyperFrames CSS transition catalog. Quiet proof/limit beats use the
  registry `fade-through` component or the local blur-crossfade recipe.
- Authentic UI footage is driven by restrained camera punch-ins, simulated cursor emphasis, and a
  feathered spotlight. Do not add synthetic UI states or obscure fiction/assumption labels.
- Every scene enters; only the final frame may animate out. Transitions own all other exits.
- Allocate stillness deliberately: the no-current-RAG limit and the unchecked-consent boundary
  each end in a readable hold.

## Do

- Keep `FICTIONAL DEMONSTRATION`, fixture `1.0.0`, planning-assumption labels, and unchecked consent
  legible when those proofs appear.
- Attribute hosted and Phase I local evidence as different layers.
- Use the actual MajuPilot palette and production motifs: journey rail, evidence card, score pair,
  section index, provenance chip, and Blueprint cover.
- Crop the authorized portrait without distortion, only in Frame 01.

## Do not

- No neon/cyan-on-black AI aesthetic, glass-card wallpaper, gradient text, or purple-to-blue wash.
- No equal-weight card grids used as a default layout; grids are reserved for real breadth or proof.
- No slideshow cadence where every scene is a new card, and no screensaver motion that carries no
  meaning.
- No invented metrics, customer data, current Document RAG, vendor guarantees, ROI promises,
  automatic CRM creation, or human consultant acceptance.
- No portrait outside the opening identity card and no private asset path on screen.
