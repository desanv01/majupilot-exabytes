# Stage 02 Design Review

Status: **Approved for implementation with mandatory content corrections**  
Visual family: **Candidate D, previously approved by the user**  
Functional authority: `planning/stages/STAGE-02-DETERMINISTIC-INTELLIGENCE.md`

## 1. Approved references

| Surface | Reference | Decision |
|---|---|---|
| Finite analysis | `branch/branch/screens/a.png` | Use hierarchy, progress treatment, score-card styling, and calm trust language. Do not expose unfinished results. |
| Results overview | `branch/branch/screens/b.png` | Primary Stage 02 desktop visual reference. |
| Explanation/evidence | `branch/branch/screens/c.png` | Use the evidence, missing evidence, strongest factor, limiting factor, calculation-details, and improvement-action composition. |
| Mobile results | `branch/branch/screens/d.png` | Use only as a hierarchy and density reference; implementation must be tested at an actual 360 px viewport. |
| Responsive baseline | `converted/results-overview/b.html` and `b.layerdoc.json` | Reuse layout, spacing, palette, and responsive ideas while binding only canonical application data. |

The four images are one approved screen family, not competing candidates. The
results overview (`b.png`) is the primary implementation anchor.

## 2. What to retain

- navy editorial serif headings with readable sans-serif body copy;
- teal/seafoam score and evidence system;
- restrained coral for gaps and limiting factors;
- warm white canvas and generous card spacing;
- two prominent overall score cards;
- side-by-side desktop breakdowns;
- compact ranked-gap and pain-point summaries;
- progressive disclosure for evidence and calculation details;
- clear edit action and honest next-stage message;
- reduced density and single-column ordering on mobile.

## 3. Mandatory corrections

The generated images are visual references. Their sample numbers and content
are not requirements and must not enter fixtures, tests, or application logic.

### Global shell

- Remove `12 min left`; the approved assessment has a 2–3 minute target but no
  countdown promise.
- Use the existing Stage 01 brand, header, and current five-step labels rather
  than the generated `Business Profile / Digital Foundation / Capabilities &
  Gaps / Growth Priorities / Action Plan` labels.
- Do not imply that uploaded files, POS exports, system metadata, or other
  external evidence were reviewed.
- Decorative café imagery is optional and must never carry information or harm
  responsive performance/readability.

### Analysis screen

- Show the five finite states from the Stage 02 contract.
- While analysis is incomplete, do not reveal provisional scores, rankings, or
  pain points like `a.png` does.
- Do not invent `11 of 15 key areas`, evidence-coverage percentages, or pain
  findings before the deterministic result exists.
- State plainly that calculations run locally from recorded answers and do not
  require a live AI/model call.
- On completion, persist the full result and navigate automatically or expose a
  clear `View results` action. Include a bounded error/retry state.

### Results overview

- Replace every sample score with values calculated by the Stage 02 rule pack.
- Use exactly these maturity dimensions: Website and commerce; Cloud and
  collaboration; CRM and customer operations; Marketing and measurement;
  Cybersecurity and continuity; AI adoption.
- Use exactly these readiness dimensions: Leadership sponsorship; Data
  availability and quality; Employee skills; Process consistency.
- Do not use generated labels such as `Strategy & Leadership`, `Customer
  Experience`, `Technology Readiness`, or `People Readiness`.
- Display official bands and confidence separately. `Moderate Confidence` is
  not a score band.
- `Largest gaps` means the lowest available maturity/readiness dimensions under
  the canonical model. Do not compare with invented targets such as 70 or 75.
- Pain-point titles, components, priority, and evidence must come exclusively
  from the canonical pain rule pack.
- Keep the footer statement that recommendations arrive in Stage 03, but do not
  show a recommendation, vendor, or product.

### Explanation/evidence view

- Scores are 0–100 or unavailable, never `2.8 / 5`.
- Use rule version `1.0.0`, not generated `v1.2.0`.
- Use only Business Twin evidence IDs and their recorded user facts.
- Replace invented POS, inventory, loyalty-platform, uploaded-file, and system
  metadata examples.
- Show canonical strongest factor, limiting factor, missing evidence,
  confidence basis, and the fixed improvement action.
- `Improvement action` is a score explanation, not a Stage 03 product
  recommendation. Remove `Learn how to do this` if it would imply unavailable
  content.

### Mobile

- The reference is a phone composition inside a landscape image, not proof of
  responsive behavior.
- Verify the real app at 360 px width: one column, no horizontal overflow, no
  clipped labels, no overlaying action bars, 44 px touch targets, and evidence
  details that remain readable.
- Do not add a permanent bottom card that claims recommendations already exist.
  An honest `Recommendations arrive next` message is permitted.

## 4. Canonical Case A display

Under rule model 1.0.0, the approved Case A fixture must display:

- digital maturity: **37.5**, band **Building foundations**, confidence **1.00**;
- maturity dimensions: Website 100; Cloud 26; CRM 0; Marketing 100;
  Cybersecurity/continuity 18; AI adoption 0;
- AI readiness: **42.5**, band **Prepare and pilot**, confidence **1.00**;
- readiness dimensions: Leadership 75; Data 25; Skills 50; Process 25.

Pain values must be generated from the canonical facts and rules. For Case A,
customer follow-up ranks first. Data visibility and scaling operations follow
under the frozen tie-breaking rules; security/continuity and manual-work pains
must also be present and evidence-linked even when they fall outside the top
three overview cards.

## 5. Implementation close

After implementation:

1. run the required 12ui close-against-target comparison using `b.png` for the
   results overview;
2. keep canonical content and behavior even where that differs from the image;
3. compare desktop and 360 px screenshots with the approved references;
4. record intentional visual deviations in the implementation report.

