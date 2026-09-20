# MajuPilot production visual audit

Audit date: 20 September 2026 (Asia/Kuala_Lumpur)

Target: [MajuPilot production app](https://majupilot-exabytes.vercel.app/)

Method: direct visual and accessibility-tree inspection in Chrome through the Codex computer
use surface, supplemented by read-only repository route inspection. The audit used the
fictional Kopi Kita Café Group case. It did not enter contact details, submit consultation
data, upload files, reveal credentials, or inspect the private portrait contents.

## Brand and visual system

- Wordmark: `MajuPilot`; subtitle: “Your business transformation copilot.”
- Primary visual language: deep navy surfaces, cream / off-white content fields, teal accents, and a restrained warm status banner for fictional demonstrations.
- Typography: high-contrast serif display headlines paired with a clean sans-serif body / label system.
- Composition: wide editorial hero panels, evidence cards, progress rails, bordered metric groups, and generous whitespace.
- The live production surface showed no legacy SME Growth Twin name, internal phase label, competition logo, or university logo in the inspected journey.
- English UI copy is consistent across the inspected routes.
- The app visibly labels fiction and planning assumptions. Keep those labels in any screen capture rather than replacing them with polished title cards.

## Route-by-route findings

| Route | Visible state | Video use |
|---|---|---|
| `/` | Branded hero; `Start assessment` / `Resume assessment`; read-only Business Twin preview for fictional Case A; five question topics; three clearly labelled fictional cases; disclosures. | Open and problem / solution anchor; load Case A from the demo section. |
| `/assessment` | Five-step progress rail; local saved-draft message; fields for business context and a `2 to 3 minutes` estimate. | Optional objective / input beat; skip full manual entry in the 3:37 path. |
| `/assessment/review` | Fictional banner; five completed question groups; editable evidence cards; explicit `Confirm Business Twin`; unknowns remain visible and no score is calculated yet. | Show evidence discipline and trust boundary. |
| `/assessment/analysis` | Transitional analysis route in source; current Case A confirmation moved into `/results` after the calculation handoff. | Do not hold on this route; capture the completed results state. |
| `/results` | `Digital maturity 37.5`; `AI readiness 42.5`; six triggered pain findings; evidence / calculation disclosures; `View recommendations`. | Primary diagnosis proof. |
| `/recommendations` | Capability-first sequence; Case A shows 3 `Why now`, 1 `Next`, and 1 `Why later`; catalogue version `2.0.0`; no scenario value shown yet. | Show the first move and why governed AI is later. |
| `/scenarios` | Lean Foundation, Balanced Growth, and Accelerated AI; Balanced Growth begins as inspection focus but is not saved until selected; cost / value / net / payback ranges; twelve-month schedule; editable assumptions. | Select Balanced Growth and show the conditional range. |
| `/blueprint` | Five advisor statuses; after generation, an immutable source-linked Blueprint with 16 sections, selected plan, financial range, month-by-month roadmap, risks, advisor reviews, synthesis, methodology, and consultation handoff. | Main payoff; show the 16-section index and a few representative sections. |
| `/consultation` | Blueprint verified; contact fields; consultation urgency; categories that would be shared; explicit consent checkbox starts unchecked; `Record consultation request`. | Show privacy / handoff boundary only; do not fill or submit. |
| `/copilot` | Branded Copilot shell; current inspected state visibly says `Your Blueprint comes first` and `Complete and sync a Blueprint before opening Copilot.` | Use only as a boundary / future-facing transition unless a later capture re-verifies an available Copilot session. |
| `/v2` | Redirects to `/copilot`. | Do not present it as an internal phase-preview page. |

## Capture-ready Case A facts

The current visual path showed the fictional Case A banner and the following exact values:

- Business: Kopi Kita Café Group; Food and beverage; B2C; 25–49 people.
- Digital maturity: `37.5 / 100`, “Building foundations”.
- AI readiness: `42.5 / 100`, “Prepare and pilot”.
- Recommendation status count: 3 `Why now`, 1 `Next`, 1 `Why later`.
- Selected path: Balanced Growth.
- Cost: RM9,200 / RM18,400 / RM27,600 low / base / high.
- Operational value: RM2,358 / RM7,254 / RM15,233 low / base / high.
- Net value: -RM25,242 / -RM11,146 / RM6,033 low / base / high.
- Payback: 7.2 / 30.4 / 140.5 months best / base / worst.
- Blueprint: 16 sections; consultant notes were visibly empty in the inspected run.

The app labels scenario values as planning assumptions, not an Exabytes quote. Negative
net values are a valid visible outcome of the current assumptions and must not be edited out.

## Visual and capture risks

- Do not capture a stale local `SME Growth Twin` tab; use the public MajuPilot URL and verify the wordmark before recording.
- Keep the fictional banner and fixture version in the frame at least once before showing numeric results.
- Use a browser viewport that shows the left journey rail and the main content without horizontal clipping.
- Avoid fast scrolling across the long Blueprint; use the section index and a few deliberate anchors.
- Do not show personal browser tabs, credentials, console output, private report URLs, or the local portrait source.
- Do not submit the consultation form. The capture stops at the consent boundary.
- Do not imply that a live Copilot chat was completed based only on the inspected gated `/copilot` state.

## Evidence cross-check

The accepted hosted integration evidence reports no horizontal overflow at the tested desktop
viewport, zero browser console errors, required security headers, and no recent Vercel
production error logs. Those are release-evidence claims; this visual audit itself is a
screen / route inspection and does not replace the recorded automated gates.
