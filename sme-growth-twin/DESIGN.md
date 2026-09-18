# SME Growth Twin Design Authority

Status: approved for implementation on 18 September 2026.

## Product design read

SME Growth Twin is a trust-first B2B decision product for Malaysian SMEs and Exabytes judges. Its visual language is an editorial evidence cockpit: deep ink, warm paper, calm teal, explicit provenance, restrained motion, and enough density to feel useful without becoming a conventional dashboard.

The current work is a product-wide visual overhaul, not a content or contract rewrite. Routes, schemas, deterministic calculations, storage behavior, consent boundaries, and tests are protected unless a phase packet explicitly says otherwise.

Design dials:

- visual variance: 6 of 10;
- motion intensity: 4 of 10;
- information density: 5 of 10.

## Direction

- Use one deliberate deep-ink hero or framing block. Use warm-paper and white surfaces for the evidence workspace.
- Use teal as the primary action and evidence accent. Coral is reserved for errors or serious risks.
- Use DM Sans for product UI and Libre Baskerville for selected display headings.
- Make the home page editorial and asymmetric. Make forms, reports, scenarios, and consultation flows calm and authoritative.
- Use a real, read-only Case A Business Twin preview. Do not use stock lifestyle imagery or a fake dashboard illustration.
- Preserve the user's mental model across assessment, analysis, recommendations, scenarios, blueprint, and consultation.

## Non-negotiable rules

- Each view has one clear primary action.
- Facts, user evidence, deterministic calculations, assumptions, catalogue facts, AI interpretation, and fallback output remain visibly distinguishable.
- Never invent product claims, prices, evidence, scores, or customer outcomes.
- Do not use generic feature-card grids, decorative AI purple, glassmorphism, or excessive pills and shadows.
- Do not use em dashes or en dashes in visible interface copy.
- Do not use window scroll listeners for animation.
- Interactive targets are at least 44 by 44 CSS pixels.
- Meet WCAG AA contrast and preserve keyboard and screen-reader operation.
- Respect `prefers-reduced-motion`; motion must never carry essential meaning.
- Keep the hero concise: a two-line headline at most and a supporting sentence of no more than 20 words.
- Ration cards, eyebrow labels, rounded containers, and decorative dividers. Every one must clarify hierarchy or state.

## Layout and shape

- Maximum content canvas: 1440px.
- Reading measure: approximately 68 characters.
- Desktop: 12-column grid. Mobile: 16px side gutters.
- Navigation height: no more than 72px.
- Input radius: 8px. Button radius: 10px. Panel radius: 16px. Full pills are for statuses and compact tags only.
- Default panels use borders or tonal contrast. Shadows are reserved for elevated or selected surfaces.

## Motion

- Page and section entry: 240 to 360ms.
- Hover and press feedback: 160 to 220ms.
- Animate transform and opacity where possible.
- Use skeletons or stable placeholders for asynchronous content. Avoid layout jumps.
- Disable non-essential animation under reduced motion.

## Tools and authority

- 12ui supplies divergent visual exploration and implementation references.
- UI/UX Pro Max supplies accessibility, interaction, and system checks.
- Design Taste supplies anti-template editorial judgment for marketing surfaces.
- Next.js and React guidance governs component boundaries and runtime correctness.
- This file, `DESIGN-TOKENS.md`, `REFERENCE-BOARD.md`, and the active phase packet override generated suggestions when they conflict.

## Delivery protocol

Every redesign phase is implemented in a separate GPT-5.6 Sol High task. The main task reviews the actual diff, screenshots, responsive states, tests, and browser behavior before accepting and publishing that phase. Every accepted phase receives its own branch, pull request, CI run, merge, and GitHub update.
