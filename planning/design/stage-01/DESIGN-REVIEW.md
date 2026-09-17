# Stage 01 design review

Status: **Candidate D approved by the user on 17 September 2026**

## Authority rule

The generated screens are the visual composition target. They do not override
the functional, content, data, accessibility, or scope contract in
`planning/stages/STAGE-01-DISCOVERY-BUSINESS-TWIN.md`.

When a generated label, example, claim, field, or interaction conflicts with
the stage packet, the stage packet wins.

## Visual assets

| File | Intended use |
|---|---|
| `branch/screens/winner.png` | Digital Foundation question layout and shared visual system |
| `branch/screens/a.png` | Why-we-ask / follow-up explanation pattern |
| `branch/screens/b.png` | Home/start/resume composition |
| `branch/screens/c.png` | General multi-field question composition only |
| `branch/screens/d.png` | Validation-error and retained-answer pattern |
| `branch/screens/e.png` | Business Twin section-card review composition |

Responsive source baseline:

- `converted/current-digital-foundation/winner.html`
- `converted/current-digital-foundation/winner.layerdoc.json`

The responsive HTML is a static visual reference, not application code to copy
wholesale. It contains responsive breakpoints and the extracted design tokens,
but its controls have no Stage 01 state or schema behavior.

### Conversion outcome

The 12ui screen branch generated all five requested additional states
successfully. Its first local multi-page HTML conversion failed on Windows with
`spawn EINVAL`, so no trustworthy multi-page clickable prototype was produced
from that attempt. The approved Digital Foundation screen was then converted
successfully through the approved hosted converter and is the reusable
responsive implementation baseline. The other generated PNGs remain the
state-specific targets.

Do not claim that the failed partial prototype exists. Implementation must use
the successful responsive baseline plus the approved state images, and the main
task will run the required post-implementation 12ui target comparison.

## Visual decisions to retain

- warm off-white page background;
- deep navy headings and body hierarchy;
- teal primary controls and success/saved states;
- restrained coral for validation or attention only;
- large serif display headings paired with a highly readable sans-serif UI face;
- generous whitespace, rounded but restrained cards, fine borders, and low-elevation shadows;
- horizontal desktop progress with a compact mobile equivalent;
- clear local-save status;
- large choice targets and explicit Back/Continue controls;
- section cards with visible Edit actions on Business Twin review.

## Mandatory corrections

The implementer must not copy these generated-content errors:

1. Replace all 10/11/12-minute estimates with the approved 2-3 minute core interview expectation or a contextually accurate remaining-time value.
2. Replace draft progress labels with the exact five grouped questions from the Stage 01 packet.
3. Use the exact eight digital-foundation capability fields and exact stable value codes.
4. Remove the file-upload/document-evidence control shown in `c.png`; document upload is outside Stage 01.
5. Remove generated maturity/readiness conclusions such as `Moderate`; Stage 02 owns scoring.
6. Remove generated recommendations, priorities, outcomes, and action-plan promises; they are later-stage outputs.
7. Replace the UK/Manchester sample and all invented company facts with Case A or neutral Malaysian SME fixture data.
8. Do not claim that an answer “won't affect your score.” Use: `No single answer judges your business; it helps us understand your current starting point.`
9. Do not claim cloud privacy guarantees beyond the implemented local-storage behavior.
10. Reduce or remove stock laptop/plant imagery when it competes with the question content or harms mobile performance.
11. The review screen must show recorded facts and explicit unknowns, not calculated findings.
12. `Confirm & Continue` at review must lead only to an honest Stage 02 handoff state; it must not fabricate analysis.

## Responsive interpretation

- At 360px, progress may become `Step N of 5` plus a compact progress bar; do not squeeze five labels into one row.
- Capability cards stack one per row and each four-choice control may wrap into a two-by-two grid.
- Primary navigation actions remain reachable without covering content.
- Business Twin cards stack in the order: Identity, Objectives, Capabilities, Process Friction, Constraints, Readiness, Evidence.
- Decorative media is removed before form controls or explanatory text are compressed.

## Acceptance use

After the functional implementation is complete, run the 12ui improve workflow
against the applicable approved image targets. Apply fidelity corrections that
preserve the Stage 01 contract, then verify desktop and 360px behavior manually.
