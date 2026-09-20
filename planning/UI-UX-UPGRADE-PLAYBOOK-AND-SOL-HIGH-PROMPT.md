# SME Growth Twin

## UI/UX Upgrade Playbook and GPT-5.6 Sol High Handoff

**Document type:** planning and execution handoff

**Status:** ready for review and use in the main planning chat

**Created:** 18 September 2026

**Product:** SME Growth Twin

**Competition:** AI Horizon Solution Challenge 2026, Exabytes track

**Scope:** visual and interaction upgrade only; preserve accepted product contracts

**Model policy:** GPT-5.6 Sol High for the main planning chat and every implementation, review, and verification chat

This file is the complete design and execution brief to paste into the main
planning chat. It does not itself implement application code. It tells the main
chat how to use the installed skills, preserve the existing product logic,
divide work into phase-specific implementation chats, and review each result.

---

## 1. Installed skills and how this project uses them

The two requested skills are installed in the global Codex skills directory:

| Skill | Installed path | Upstream |
|---|---|---|
| Taste Skill | C:/Users/Dv/.codex/skills/taste-skill | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
| UI/UX Pro Max | C:/Users/Dv/.codex/skills/ui-ux-pro-max | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |

### 1.1 Taste Skill role

Use Taste Skill for the homepage, hero composition, editorial Blueprint
surfaces, visual hierarchy, copy discipline, reference-board interpretation,
and redesign auditing. Its default skill name is design-taste-frontend.

Taste Skill is not the authority for dense dashboards, data tables, multi-step
forms, or complex product UI. It explicitly directs those surfaces to
form-specific, data-specific, or app-specific patterns.

Apply its useful constraints:

- declare a one-line design read before visual work;
- set and explain DESIGN_VARIANCE, MOTION_INTENSITY, and VISUAL_DENSITY;
- avoid generic AI-purple gradients, centered default heroes, three identical
  feature cards, fake screenshots, decorative status dots, and invented
  precision;
- use one coherent palette, radius system, theme strategy, and icon family;
- use real assets, an actual component preview, or clearly labelled placeholders;
- provide loading, empty, error, success, keyboard, reduced-motion, and mobile
  states;
- run the complete pre-flight checklist before declaring a phase complete;
- keep visible copy plain, grammatical, and free of em-dashes.

### 1.2 UI/UX Pro Max role

Use UI/UX Pro Max for the actual product surfaces: assessment, follow-ups,
forms, analysis, results, recommendations, scenarios, ROI, Blueprint,
consultation, charts, responsive behavior, accessibility, and implementation
stack guidance.

Its workflow is:

1. Inspect the product type, audience, existing stack, and current design.
2. Generate or inspect a coherent design system when a system-wide change is
   needed.
3. Search the smallest relevant domain for a targeted concern.
4. Search the detected implementation stack separately.
5. Verify the result against accessibility, interaction, layout, performance,
   typography, color, animation, forms, navigation, and chart guidance.
6. Treat recommendations as suggestions, never as instructions that override
   the frozen product contract.

When implementation chats use its search tool, they must:

- check package.json before importing any dependency;
- use the existing stack rather than silently migrating the app;
- pass the actual stack to searches, such as nextjs, react, shadcn, or
  html-tailwind;
- use one dominant search intent with two to five meaningful terms;
- retry a zero-result search once with a narrower query;
- never invent a database result from an empty search;
- persist a design system only after checking whether a project source of truth
  already exists and never overwrite it without explicit approval.

### 1.3 Combined use

The skills are complementary:

- UI/UX Pro Max is primary for product UI structure, form behavior, responsive
  rules, accessibility, charts, and stack-specific implementation.
- Taste Skill is primary for anti-slop visual judgment, landing-page and
  editorial composition, content discipline, and redesign quality.
- Repository stage packets, contracts, schemas, deterministic outputs, and
  tests override both skills whenever they conflict.

Do not blindly apply every rule from either skill. The product is an evidence
and decision tool, not a generic marketing landing page.

---

## 2. Product and authority context

SME Growth Twin is an evidence-first digital transformation advisor for
Malaysian SMEs and Exabytes consultants. It turns a short structured interview
into:

1. a normalized Business Twin;
2. explainable digital maturity and readiness results;
3. ranked pain points with evidence;
4. sequenced Exabytes-aligned capability recommendations;
5. Lean, Balanced, and Accelerated scenarios;
6. transparent ROI ranges and assumptions;
7. a five-advisor review and synthesis;
8. a printable growth Blueprint;
9. a consultation-ready recorded lead request.

The implementation is built from the project's own requirements, terminology,
schemas, prompts, components, tests, and architecture.

### 2.1 Authority hierarchy

When a visual idea conflicts with a product rule, use this order:

1. Official competition rules and the Exabytes challenge statement.
2. planning/MASTER-GAMEPLAN.md.
3. The relevant stage packet and accepted data contracts.
4. Existing tests, schemas, deterministic rule packs, and accessibility
   requirements.
5. Accepted local design reviews and screenshots.
6. This document.
7. Taste Skill and UI/UX Pro Max recommendations.

The design direction must never change a score formula, route contract, field
name, stable value code, evidence ID, recommendation mapping, ROI formula,
scenario dependency, Blueprint section, or consent claim.

### 2.2 Current accepted visual family

Continue the accepted family unless a deliberate, reviewed redesign proves a
material benefit:

- warm off-white canvas;
- deep navy headings and body hierarchy;
- teal or seafoam evidence, positive, and saved-state treatment;
- restrained coral or amber for validation, gaps, warnings, and conditions;
- large editorial display heading paired with a highly readable sans-serif UI
  face;
- generous whitespace and calm information rhythm;
- rounded but restrained cards with fine borders and low-elevation shadows;
- horizontal desktop progress with a compact mobile equivalent;
- visible local-save status;
- large choice targets and explicit Back and Continue controls;
- print-friendly Blueprint surfaces;
- 44 px minimum interactive targets;
- a single-column, no-horizontal-scroll mobile fallback at 360 px.

The visual family is evidence-first digital transformation cockpit with
editorial Blueprint qualities. It should feel credible to a Malaysian SME owner,
clear to an Exabytes judge, and useful to a consultant. It is not a generic
dark AI dashboard, a chatbot, or a cinematic agency page.

---

## 3. Design read, dials, and constitution

### 3.1 Design read

Use this line before a design or implementation task:

> Reading this as: a trust-first B2B digital transformation product for Malaysian SMEs and Exabytes judges, with an editorial evidence-cockpit language, leaning toward warm editorial surfaces, explicit provenance, and restrained purposeful motion.

### 3.2 Initial dials

Use these as the starting point and adjust only with a written reason:

| Dial | Value | Reason |
|---|---:|---|
| DESIGN_VARIANCE | 6 | enough asymmetric editorial character without reducing form clarity |
| MOTION_INTENSITY | 4 | meaningful transitions and feedback without cinematic distraction |
| VISUAL_DENSITY | 5 | readable evidence and scenario comparison without dashboard clutter |

Marketing and Blueprint surfaces may move variance to 7 and density to 4.
Assessment and consultation surfaces may move variance to 4 and density to 5.
Any change must be recorded in the phase design brief.

### 3.3 Design principles

1. **Evidence before confidence.** Every conclusion should show what supports it,
   what is missing, and what is a planning assumption.
2. **Calm before spectacle.** Motion explains hierarchy, feedback, or state
   change. It never delays the user or hides a result.
3. **One question, one decision.** Assessment screens reduce cognitive load and
   make the next action obvious.
4. **Progress without pressure.** Show meaningful progress, never a countdown or
   artificial urgency.
5. **Capability before vendor.** Explain the business capability and outcome
   before showing a related Exabytes offering.
6. **Ranges before false precision.** ROI and scenario values show low, base,
   and high ranges plus source and assumptions.
7. **Generated content is labelled.** Model-origin text, deterministic fallback,
   user facts, derived facts, defaults, and overrides are visibly distinct.
8. **Mobile is a first-class layout.** 360 px is a required test viewport, not
   an afterthought.
9. **The interface teaches.** Terms such as maturity, readiness, confidence,
   evidence, and prerequisite get short explanations at the point of use.
10. **The user remains in control.** Back, edit, reset, print, save, and consent
    states are explicit and reversible where possible.

### 3.4 Explicit anti-patterns

Do not ship:

- generic AI-purple or blue glow gradients;
- a dark mesh background with a centered hero by default;
- glassmorphism on every surface;
- a chatbot bubble as the primary experience;
- fake dashboards or screenshots made from decorative rectangles;
- invented customer logos, testimonials, adoption metrics, or Exabytes facts;
- generated café or laptop photography presented as the user's business;
- sample scores, percentages, payback periods, or revenue claims in live output;
- a countdown such as 12 min left;
- an extra assessment taxonomy such as Business Profile, Growth Priorities, or
  Action Plan when the accepted journey uses five grouped questions;
- filled background progress tracks used as the main scoring comparison;
- long lists of repeated bordered rows;
- more than one primary CTA intent on a page;
- decorative dots, scroll cues, version stamps, city or weather strips;
- em-dashes in visible product copy;
- animation that starts before its content is ready;
- hidden evidence or a report that cannot be printed or interpreted offline;
- an image upload, live AI call, cloud privacy guarantee, encryption promise, or
  human follow-up claim unless it exists in the implemented contract.

---

## 4. Information architecture and journey

Preserve current routes and route slugs. Confirm actual route names from the
repository before editing. The following is the intended experience map, not
permission to invent routes:

| Surface | Purpose | Binding authority |
|---|---|---|
| Home | explain the value and start a fictional or new assessment | Stage 01 and Stage 07 |
| Assessment | five grouped questions and conditional follow-ups | Stage 01 packet |
| Business Twin review | show normalized facts, unknowns, evidence, and edit links | Stage 01 packet |
| Analysis | finite deterministic calculation state | Stage 02 packet |
| Results | maturity, readiness, pain points, evidence, and calculation details | Stage 02 packet |
| Recommendations overview | Why now, Next, Why later capability sequencing | Stage 03 packet |
| Capability detail | outcome, fit, evidence, prerequisites, mapping, limitations | Stage 03 packet |
| Scenario comparison | Lean, Balanced, Accelerated comparison | Stage 04 packet |
| Scenario detail | schedule, dependencies, financial outlook, warnings | Stage 04 packet |
| Blueprint | advisor review, synthesis, report, print | Stage 05 packet |
| Consultation | consent-safe request recording | Stage 06 packet |
| Consultation success | honest recorded-request receipt | Stage 06 packet |
| Demo launcher | Case A, B, C fixture loading and reset | Stage 07 packet |

The assessment has five grouped questions:

1. Business identity and context.
2. Current digital foundation.
3. Main business friction.
4. Growth objective and constraints.
5. AI and change readiness.

After Q5, the deterministic follow-up registry may ask zero to three triggered
follow-ups. Each follow-up explains why it is being asked and supports an
unknown answer. The Business Twin review follows. Analysis and all later stages
are separate, honest handoffs.

The post-diagnosis journey rail is:

1. Discover.
2. Diagnose.
3. Compare.
4. Blueprint.

Do not merge the five assessment groups into the four-stage rail, and do not
replace either with the generated labels shown in old visual references.

---

## 5. Complete screen layout

### 5.1 Global application shell

**Desktop**

- Header height 64 to 72 px, never more than 80 px.
- One-line navigation at 1024 px and above.
- Brand mark and product name on the left.
- Only the primary journey action and a compact utility area on the right.
- Current stage or saved-state status is visible but quiet.
- No decorative dot before every item.
- Content container is approximately 1200 to 1400 px and centered.

**Mobile**

- Brand remains visible.
- Secondary navigation collapses into a labelled menu or a simple back action.
- Progress becomes Step N of 5 for assessment or the compact four-stage rail
  for post-assessment surfaces.
- No horizontal scrolling, clipped labels, or sticky controls covering content.
- Body text stays at least 16 px and labels at least 14 px.

**Global states**

- local save: Saved on this device;
- restoring: a short skeleton or status message that does not block forever;
- restored: clear confirmation and preserved answers;
- invalid draft: discard only the incompatible project draft and explain why;
- reset: confirmation dialog naming the exact known application keys;
- error: inline, actionable, and retryable where a retry is meaningful;
- reduced motion: all transitions collapse to instant or static;
- keyboard: visible focus and logical order;
- print: navigation, sticky controls, shadows, and interactive-only controls
  disappear from the Blueprint report.

### 5.2 Home and start screen

**First viewport**

1. Compact header.
2. One plain-language headline, maximum two desktop lines.
3. A short subheading that states the result in no more than 20 words.
4. One primary Start assessment action and at most one secondary action.
5. A visual Business Twin preview that is either:
   - a real read-only component rendered from a fictional fixture;
   - a generated visual asset clearly marked as a fictional preview; or
   - a clearly labelled placeholder while assets are being prepared.
6. A small disclosure that the demo uses fictional or user-entered information.

**Below the hero**

- A proof strip using verified product properties, such as deterministic
  calculations, evidence-linked recommendations, scenario comparison, and
  model-failure fallback.
- A short three-part workflow: answer, compare, act.
- A visual explanation of the Business Twin without exposing implementation
  jargon.
- A capability boundary that explains Exabytes mapping without promising that
  every suggestion is a quote, purchase, or live availability.
- Case A, B, and C fixture actions under a clearly labelled fictional-demo
  area. Case A is the recommended demonstration path, not the only valid path.
- A limitations and provenance footer.

**Home copy rules**

- No customer logos, testimonials, invented adoption numbers, or claims of
  production readiness.
- No countdown, version label, or artificial scarcity.
- Keep the primary value proposition concrete: assessment, explanation,
  scenario comparison, and Blueprint.

### 5.3 Assessment question screen

**Layout**

- Persistent context header with the current question group.
- Progress indicator that is meaningful but not pressuring.
- One grouped question per screen.
- A short why-this-matters explanation.
- Labels above fields, never placeholder-only labels.
- Choice controls with large targets and plain-language descriptions.
- Explicit Back and Continue actions in a stable footer.
- Local save status near the navigation, not inside the question copy.

**Question behavior**

- Keep valid answers on Back and browser navigation.
- Show errors next to the field and focus the first invalid control.
- Do not mark an answer correct or incorrect.
- unknown or not sure is a first-class response.
- Use fieldsets and legends for grouped choices.
- Show terms such as CRM, backup, and readiness in short helper text.
- Avoid an unnecessary AI animation. Stage 01 calculation is deterministic.

**Follow-up sequence**

- Explain why a follow-up appeared.
- Show the same progress language as the core flow without pretending it is a
  sixth core question.
- Keep the maximum at three.
- Reconcile obsolete follow-up answers if an earlier answer is edited.

**Review screen**

- Use section cards with visible Edit actions.
- Show recorded facts, unknowns, source question IDs, and evidence references.
- Do not show maturity, readiness, pain, recommendations, ROI, or conclusions.
- Confirm and Continue leads only to an honest Stage 02 handoff.

### 5.4 Analysis screen

**Finite states**

1. Ready to calculate.
2. Calculating.
3. Calculated successfully.
4. Bounded error with retry.
5. Recovered or safely failed.

The screen must say that the calculation runs locally from recorded answers when
that is the implemented behavior. It must not reveal provisional scores,
rankings, or pain points while calculation is incomplete. Use a shaped skeleton
that matches the result layout rather than a generic spinner.

### 5.5 Results overview

**Top hierarchy**

- Same header and journey language as the assessment.
- Clear result title and a short explanation of what was calculated.
- Two prominent overall score areas: digital maturity and readiness.
- Band and confidence are separate concepts.
- An evidence coverage or confidence explanation uses only canonical data.

**Breakdown**

Use exactly the accepted maturity dimensions:

- Website and commerce.
- Cloud and collaboration.
- CRM and customer operations.
- Marketing and measurement.
- Cybersecurity and continuity.
- AI adoption.

Use exactly the accepted readiness dimensions:

- Leadership sponsorship.
- Data availability and quality.
- Employee skills.
- Process consistency.

**Evidence and action**

- Show largest gaps based on the canonical lowest dimensions.
- Show ranked pain points from the canonical pain rule pack.
- Distinguish strongest factor, limiting factor, known evidence, and missing
  evidence.
- Use progressive disclosure for calculation details and evidence references.
- Use a clear edit action and an honest Stage 03 handoff message.
- Do not show a vendor, product, recommendation, or scenario before its stage.

### 5.6 Recommendations overview

**Composition**

- Carry a compact diagnostic summary without repeating the entire results page.
- Group capabilities into Why now, Next, and Why later.
- Explain the business capability and expected impact before an Exabytes
  offering mapping.
- Show fit, phase, confidence, evidence, and prerequisites.
- Make blocked or conditional capabilities visually distinct without fear
  marketing.

**Capability detail**

- Outcome and problem statement first.
- Fit components and rule labels next.
- Evidence IDs and the exact user facts that support them.
- Missing evidence and limitations.
- Prerequisites and conditions.
- Exabytes mapping with provenance and clear separation between official facts
  and generated advisory text.
- A path back to the overview and forward to scenario comparison.

Never retain fabricated figures, customer metrics, timeframes, staffing,
benefits, or product facts from generated visual references.

### 5.7 Scenario and ROI Lab

**Comparison**

- Short explanation above the comparison.
- Three clearly differentiated cards: Lean, Balanced, Accelerated.
- Repeat the same metric positions so the user can compare quickly.
- Show risk, budget fit, conditional state, next action, and timing.
- Balanced may receive visual focus, but no scenario is selected until the user
  explicitly selects it.
- Show Not estimated where the model has no revenue or avoided-risk estimate.
- Display Planning assumptions - not an Exabytes quote near costs.
- Keep conditional AI cost and benefits outside committed ROI while blocked.

**Detail**

- A tab or detail navigation that remains understandable on mobile.
- A 12-month desktop timeline with each month listed exactly once.
- A vertical month list on mobile.
- Scheduled accepted capabilities and dependency events.
- Separate financial outlook, readiness warnings, and assumption sources.
- Every assumption is labelled as user fact, derived user fact, planning default,
  or user override.
- Low, base, and high values use Malaysian ringgit and the exact scenario model.

Do not use invented percentages, multipliers, payback, market studies, supplier
claims, customer counts, or contract values.

### 5.8 Blueprint and advisor review

**In-progress state**

- Keep Blueprint current on the four-stage rail.
- Show the five advisor roles in stable order.
- Each role has a finite state: ready, reviewing, live, fallback, or failed-safe.
- Never show an indefinite spinner.
- Explain that live model review is optional and deterministic numbers remain
  authoritative.

**Advisor panel**

Each advisor card shows:

- role and position;
- model-origin or deterministic-fallback badge;
- confidence;
- support;
- concerns;
- missing evidence;
- adjustments;
- inspectable evidence references.

Synthesis separates agreement, disagreement, conditions, and open questions.
If there is no disagreement, say No material disagreement detected.

**Report preview**

- Toolbar: Back to scenarios, Regenerate review, and Print / save as PDF.
- Executive summary and selected-scenario decision before detail.
- Contents rail on desktop and compact section menu on mobile.
- Model 1.0.0 section order.
- Low, base, and high values with labels and assumptions.
- No invented charts, testimonials, ratings, quotes, countdowns, or badges.
- Consultation is a preview that explicitly says Stage 06.

**Print**

- A4-friendly document.
- No application navigation, sticky controls, buttons, shadows, accordions, or
  clipped timelines.
- Evidence and assumptions expanded.
- Headings and tables remain legible in grayscale.

### 5.9 Consultation and success

**Consultation form**

- Evidence-ready heading and restrained hero hierarchy.
- Readable form on the left and privacy and sharing explanation on the right on
  desktop.
- On mobile, collapse to one column with disclosure before consent.
- Show Blueprint ID, selected scenario, maturity, and readiness context.
- Keep field labels visible and errors associated.
- Consent is unchecked by default.
- The primary action spans the available width and has a clear label.
- Do not claim encryption, PDPA compliance, external delivery, human review,
  retention period, or partner sharing unless implemented and verified.

**Success**

- Show the request was recorded by this prototype.
- Provide a three-part receipt: lead reference, submitted time, Blueprint ID.
- Explain the next available action.
- Offer Return to Blueprint and Start a new assessment.
- Do not show contact details or imply that a real person has already been
  notified.

### 5.10 Demo launcher and release states

- Start assessment remains the dominant action.
- Fictional Case A, B, and C fixture actions are secondary and explicitly
  labelled.
- Loading a fixture states that it replaces this device's saved prototype
  records and never suggests production customer data.
- Reset requires confirmation and clears only known project keys.
- The reliability strip states only verified properties:
  deterministic calculations, evidence-linked recommendations, and model-failure
  fallback.
- Include empty, loading, error, retry, restored, and reset states.

---

## 6. Visual system specification

### 6.1 Typography

- Use the accepted editorial display heading style and readable sans-serif body
  style unless the repository already has a documented font system.
- Prefer a self-hosted or framework-supported font path.
- Do not add a new font package without checking existing dependencies and
  recording the reason.
- Body text is readable at 16 px or larger on mobile.
- Keep headings compact enough to preserve hierarchy and avoid four-line hero
  headlines.
- Use one type family for emphasis unless a deliberate editorial pairing is
  documented.

### 6.2 Color roles

Use semantic tokens rather than raw hex values in components:

- canvas: warm off-white;
- surface: white or a closely related warm surface;
- text-primary: deep navy;
- text-secondary: accessible muted navy or slate;
- accent: teal or seafoam;
- attention: restrained coral or amber;
- border: low-contrast warm neutral;
- focus: high-contrast visible ring;
- success, warning, error, and info: distinct semantic roles that do not rely
  on color alone.

Choose one accent family per page and test light and dark or the project's
documented single-theme strategy. Do not introduce an AI-purple gradient.

### 6.3 Shape and elevation

- Use one documented radius scale.
- Use cards only when elevation communicates real grouping or hierarchy.
- Prefer whitespace, section rules, and grouped panels over a wall of cards.
- Tint shadows toward the canvas instead of using pure black.
- Keep interactive targets at least 44 by 44 px.

### 6.4 Icons and assets

- Use one icon family already present or an allowed library such as Phosphor,
  Hugeicons, Radix Icons, or Tabler.
- Do not hand-draw icon paths or use emoji as interface icons.
- Use image generation or a real component preview for important visuals.
- Never use a decorative image as evidence.
- Use alt text for meaningful images and mark decorative images hidden.

### 6.5 Motion

Every animation needs one sentence explaining whether it communicates
hierarchy, storytelling, feedback, or state transition.

Approved motion:

- short hero entrance;
- progress transition;
- score reveal after calculation completes;
- scenario selection feedback;
- evidence disclosure;
- Blueprint section transitions;
- subtle background movement only where it does not compete with content.

Required:

- respect prefers-reduced-motion;
- animate transform and opacity rather than layout dimensions;
- use Motion for local UI transitions;
- isolate client-side motion leaves;
- use GSAP only for a genuinely justified pinned or horizontal narrative;
- never use window.addEventListener('scroll');
- clean up every effect;
- do not block interaction with an animation.

### 6.6 Responsive rules

Required validation widths:

- 1440 px desktop;
- 1024 px tablet or compact desktop;
- 768 px boundary;
- 390 px modern mobile;
- 360 px required narrow mobile.

For every multi-column component, specify its below-768 px collapse in the same
component. Do not rely on an unexamined default. Check long evidence IDs,
scenario labels, buttons, focus rings, timelines, and helper text.

### 6.7 Accessibility and quality

Every phase must check:

- WCAG AA contrast for body, labels, controls, placeholders, errors, and focus;
- semantic landmarks and native headings;
- fieldset and legend for grouped choices;
- visible keyboard focus;
- logical tab order;
- labelled icon-only controls;
- no hover-only meaning;
- touch targets at least 44 px;
- status messages announced without disruptive focus changes;
- no information conveyed by color alone;
- reduced motion;
- zoom and text enlargement;
- no horizontal overflow.

---

## 7. Reference board and evidence discipline

Create or maintain a reference board before a large visual change. Group
references by role rather than copying one site:

1. **Layout reference:** calm editorial grid, asymmetric but readable, clear
   section rhythm.
2. **Typography and color reference:** deep navy, warm canvas, teal evidence,
   restrained coral, strong display and body contrast.
3. **Interaction reference:** assessment progress, progressive disclosure,
   comparison controls, timeline, print report, and consent clarity.
4. **Data visualization reference:** explainable score cards, evidence lists,
   ranges, confidence, and conditions.

For every reference, record:

- URL or local screenshot path;
- the design property being borrowed;
- why it fits SME Growth Twin;
- what is explicitly not being copied;
- the surface where it may be used;
- accessibility and performance risks.

No reference is permission to copy source code, brand assets, text, or a whole
layout.

---

## 8. Video-derived workflow adapted for this project

The two supplied videos are treated as process references. Their useful ideas
are combined below. ImageKit and Higgsfield MCP elements from the second video
are intentionally out of scope.

### 8.1 Before implementation

1. Write the product brief and audience.
2. Inspect the current repository, routes, package manifest, tests, and visual
   references.
3. Read project instructions and update design-specific instructions only when
   needed.
4. Produce a one-line design read and set the three dials.
5. Build a reference board and design constitution.
6. Create a design system master and page-specific overrides only after checking
   for existing project sources of truth.

### 8.2 Design and implementation loop

1. Design the first viewport or the most important screen.
2. Run a local browser preview.
3. Inspect desktop and mobile screenshots.
4. Fix hierarchy, spacing, contrast, copy, and responsive behavior.
5. Expand the system into reusable components.
6. Connect real deterministic data and existing contracts.
7. Exercise the complete state cycle, not only the success state.
8. Run accessibility, type, lint, unit, integration, and browser checks.
9. Create a small Git checkpoint and a phase-specific PR.
10. Review the diff and visual evidence before merge.

### 8.3 Deliberately excluded

- ImageKit MCP;
- Higgsfield MCP;
- unapproved image hosting or video pipelines;
- a new backend or database for a visual-only change;
- unapproved Supabase or authentication work;
- a new model provider or live AI dependency just to make a screen look
  intelligent;
- destructive replacement of accepted routes or stage contracts.

Original visual assets may be generated with an available image-generation tool
when needed, but they must remain fictional, provenance-labelled, and separate
from evidence data.

---

## 9. Phased UI/UX execution plan

Each phase is implemented in a separate GPT-5.6 Sol High chat. The main chat
remains planner, contract owner, reviewer, integrator, and release coordinator.
The implementation chat receives one phase only.

### Phase 0 - Audit and visual contract

**Goal:** establish a safe baseline.

Tasks:

- inspect routes, components, package manifest, current tokens, test commands,
  and existing design files;
- run baseline tests and a browser smoke check;
- capture current desktop and 360 px screenshots;
- map current visual problems without editing code;
- confirm which routes and behavior are already accepted;
- create or update DESIGN.md, REFERENCE-BOARD.md, and DESIGN-TOKENS.md;
- record the design read and dials.

Exit gate:

- baseline commands and results recorded;
- no route or contract changes;
- visual debt list ranked;
- design constitution approved by the main chat.

### Phase 1 - Home and first viewport

**Goal:** make the first impression credible and clear.

Tasks:

- implement the global shell and home layout;
- keep Start assessment dominant;
- add fictional-data disclosure and verified reliability strip;
- use an actual read-only preview or generated asset, not a fake screenshot;
- keep Case A, B, and C fixture actions secondary;
- verify desktop and 360 px.

Exit gate:

- visual comparison evidence;
- no invented claims;
- keyboard and reduced-motion checks;
- existing assessment entry path still works.

### Phase 2 - Assessment and Business Twin review

**Goal:** make the five-question journey calm and trustworthy.

Tasks:

- improve progress, question grouping, labels, helper copy, validation,
  follow-ups, save status, restoration, edit links, and review;
- preserve all field names, stable codes, reducer behavior, storage adapter, and
  deterministic follow-up policy;
- remove generated content that is not in the Stage 01 contract.

Exit gate:

- all Stage 01 tests pass;
- refresh and invalid-draft recovery pass;
- 360 px keyboard and screen-reader-oriented checks pass;
- no scoring or recommendation leakage.

### Phase 3 - Analysis and results

**Goal:** make deterministic intelligence understandable.

Tasks:

- implement finite analysis states;
- improve score hierarchy, band and confidence separation, dimension breakdowns,
  pain points, evidence, calculation details, and handoff;
- use the exact six maturity and four readiness dimensions;
- keep provisional states free of fake findings.

Exit gate:

- Stage 02 tests pass;
- deterministic results are unchanged for golden fixtures;
- empty, loading, success, error, retry, and mobile states are verified.

### Phase 4 - Recommendations and catalogue

**Goal:** make advice capability-first and evidence-linked.

Tasks:

- improve Why now, Next, and Why later composition;
- separate capability outcome, fit, prerequisites, evidence, mapping, and
  limitations;
- distinguish official Exabytes facts from generated advisory text;
- make missing evidence and conditional states visible.

Exit gate:

- Stage 03 rules and tests pass;
- no unsupported benefits, costs, products, or customer facts;
- all recommendations link to evidence and a clear next action.

### Phase 5 - Scenario and ROI Lab

**Goal:** make comparison useful without false precision.

Tasks:

- refine Lean, Balanced, and Accelerated comparison;
- refine selection, detail, 12-month schedule, warnings, and assumptions;
- show low, base, high and source type;
- make mobile comparison and vertical timeline explicit.

Exit gate:

- Stage 04 model and tests pass;
- selected state requires explicit user action;
- conditional AI economics remain separate;
- no horizontal overflow or unsupported numbers.

### Phase 6 - Blueprint and advisor experience

**Goal:** make the output reportable and inspectable.

Tasks:

- refine finite advisor states, advisor cards, synthesis, executive summary,
  contents navigation, report toolbar, and print;
- visually distinguish model-origin and fallback content;
- preserve section order and assumptions;
- test A4 output and 360 px.

Exit gate:

- Stage 05 tests pass;
- print output contains all interpretation context;
- no indefinite spinner or hidden disagreement.

### Phase 7 - Consultation, demo, and release hardening

**Goal:** complete the user journey and make the demo reliable.

**Owner execution override (19 September 2026):** use GPT-5.6 Sol Medium with
medium reasoning for Phase 7 planning, implementation, review, and correction
tasks. This phase-specific instruction supersedes the earlier Sol High profile
in sections 9 and 10 without changing any quality gate.

Tasks:

- refine consultation form and success receipt;
- refine fixture launcher, reset confirmation, reliability strip, error states,
  and recording views;
- run the entire Case A path plus Cases B and C golden checks;
- run browser visual, accessibility, performance, and console checks;
- update screenshots and release evidence intentionally.

Exit gate:

- Stages 06 and 07 tests pass;
- full end-to-end flow works from home to recorded request;
- browser checks pass at 1440, 1024, 390, and 360 px;
- release manifest, third-party register, demo script, and test evidence are
  current.

---

## 10. Implementation-chat contract

Every new implementation chat must receive:

- the exact phase name and objective;
- this handoff document;
- the relevant stage packet;
- the relevant design review and approved local screenshots;
- the current branch or worktree;
- the exact allowed file areas;
- the test and browser commands;
- the exit-gate checklist.

The implementation chat must:

1. use GPT-5.6 Sol High with high reasoning;
2. read relevant repository instructions before editing;
3. inspect current code instead of assuming file paths;
4. state the one-line design read and phase dials;
5. use UI/UX Pro Max searches for the actual stack and specific UX concerns;
6. use Taste Skill where its scope fits;
7. preserve contracts, schemas, routes, analytics, storage keys, and tests;
8. avoid installing dependencies without checking package.json and reporting
   the command first;
9. implement full state cycles;
10. verify desktop, tablet, and 360 px mobile;
11. run lint, typecheck, unit, integration, browser, accessibility, and build
    checks proportionate to the phase;
12. capture visual evidence and report the exact viewport;
13. create a focused commit and PR or handoff;
14. report changed files, tests, known limitations, and follow-up work.

The implementation chat must not:

- expand scope silently;
- rewrite business logic to match a screenshot;
- replace the accepted design system without a decision record;
- copy another product's code or visual assets;
- use ImageKit or Higgsfield MCP;
- fabricate Exabytes offerings, prices, metrics, or customer data;
- claim a live AI call, privacy guarantee, security property, or human follow-up
  that was not verified;
- leave placeholder comments where a required state should be implemented.

---

## 11. Review, browser QA, and Git protocol

### 11.1 Review sequence

For each phase:

1. Read the implementation report.
2. Inspect the diff and changed-file list.
3. Run the phase tests.
4. Start the local preview.
5. Check the browser at 1440 px, 1024 px, 390 px, and 360 px.
6. Check the documented theme strategy and reduced motion.
7. Check keyboard navigation and visible focus.
8. Check console errors and network failures.
9. Compare screenshots with the accepted visual target.
10. Record pass, correction request, or blocked status in the main chat.

### 11.2 Visual pre-flight

- no em-dash in visible copy;
- no fake screenshot or decorative dashboard;
- no unsupported number or claim;
- no duplicate CTA intent;
- no desktop navigation wrap;
- no hidden focus state;
- no control below 44 px;
- no horizontal scroll at 360 px;
- no unmotivated animation;
- no window.addEventListener('scroll');
- no motion without reduced-motion handling;
- no missing loading, empty, error, success, or fallback state;
- no evidence hidden behind an unexplained visual flourish;
- no print layout that depends on app navigation.

### 11.3 Git and GitHub

The main chat controls the repository:

- one branch and focused commit per phase or correction;
- descriptive conventional commit message;
- tests and visual evidence in the PR description;
- CI must pass before merge;
- push stage by stage, not as one large final dump;
- never commit credentials, .env.local, private user data, generated secrets,
  or unapproved media;
- update release and third-party documentation when dependencies or external
  references change.

---

## 12. Ready-to-paste prompt for the main planning chat

Copy everything inside the following block into the main planning chat. Before
using it, select GPT-5.6 Sol High with high reasoning for that main chat. When
creating implementation chats, select GPT-5.6 Sol High with high reasoning
again. The prompt cannot change the model setting of an already-open task by
itself.

~~~text
You are the main planning, architecture, review, integration, and release
agent for the SME Growth Twin project in:
C:/Users/Dv/Desktop/AI HORIZON HACKATHON (EXABYTES)

Use GPT-5.6 Sol High with high reasoning for this main chat. Every separate
implementation, correction, review, and verification chat must also use
GPT-5.6 Sol High with high reasoning. Do not use Sol Medium for this project.

Your job is to plan exact changes, dispatch one bounded phase at a time to a
separate implementation chat, review its work, run the required tests and
browser checks, communicate the result back to this main chat, and coordinate
stage-by-stage commits, PRs, merges, and pushes. Keep this main chat as the
single source of truth for scope and decisions. Do not let an implementation
chat silently redefine the product.

Read these files before planning the first UI phase:

- planning/MASTER-GAMEPLAN.md
- planning/EXECUTION-ORCHESTRATION.md
- planning/STAGE-LEDGER.md
- planning/design/stage-01/DESIGN-REVIEW.md
- planning/design/stage-02/DESIGN-REVIEW.md
- planning/design/stage-03/DESIGN-REVIEW.md
- planning/design/stage-04/DESIGN-REVIEW.md
- planning/design/stage-05/DESIGN-CONTRACT.md
- planning/design/stage-06/DESIGN-REVIEW.md
- planning/design/stage-07/DESIGN-REVIEW.md
- planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md

The installed design skills are:

- C:/Users/Dv/.codex/skills/taste-skill
- C:/Users/Dv/.codex/skills/ui-ux-pro-max

Read their SKILL.md files before dispatching UI work. Use UI/UX Pro Max as the
primary guide for product UI, forms, responsive behavior, accessibility,
charts, and the detected implementation stack. Use Taste Skill for anti-slop
visual judgment, homepage and editorial composition, copy discipline, and
redesign auditing. Remember that Taste Skill is not the authority for dense
dashboards, data tables, or multi-step forms. Do not apply either skill
blindly. Frozen repository contracts and accepted stage packets win.

Build from the project's approved requirements, architecture, terminology,
schemas, prompts, interfaces, tests, and code. External visual references do
not override frozen contracts or permit copying files, routes, prompts, text,
UI, or structure wholesale.

The visual direction is:

Reading this as: a trust-first B2B digital transformation product for
Malaysian SMEs and Exabytes judges, with an editorial evidence-cockpit
language, leaning toward warm editorial surfaces, explicit provenance, and
restrained purposeful motion.

Start from these dials:

- DESIGN_VARIANCE: 6
- MOTION_INTENSITY: 4
- VISUAL_DENSITY: 5

Use the accepted visual family:

- warm off-white canvas;
- deep navy editorial headings and readable sans-serif body;
- teal or seafoam evidence and positive states;
- restrained coral or amber warnings and validation;
- generous whitespace;
- restrained rounded cards, fine borders, and low-elevation shadows;
- visible save status;
- clear progress;
- 44 px minimum controls;
- no horizontal overflow at 360 px;
- print-friendly Blueprint report.

The design must feel like an evidence-first digital transformation cockpit
with editorial Blueprint qualities. It must be credible to an SME owner, clear
to a judge, and useful to a consultant. It must not become a generic dark AI
dashboard, chatbot, cinematic agency landing page, or purple-glow template.

Preserve all existing routes, schemas, stable value codes, evidence IDs,
deterministic formulas, scoring dimensions, pain rules, recommendation rules,
scenario model, advisor contract, Blueprint section order, consultation
fields, local-storage behavior, analytics events, and tests unless a separate
explicit decision authorizes a product change.

The exact accepted product journey is:

Home
  -> Start assessment
  -> Q1 Business identity and context
  -> Q2 Current digital foundation
  -> Q3 Main business friction
  -> Q4 Growth objective and constraints
  -> Q5 AI and change readiness
  -> zero to three deterministic conditional follow-ups
  -> Business Twin review and edit
  -> Stage 02 analysis
  -> results
  -> recommendations
  -> scenario comparison
  -> selected scenario
  -> advisor review and Blueprint
  -> consultation recording

The five assessment groups are not the same thing as the post-assessment
journey rail. The post-assessment rail is Discover, Diagnose, Compare,
Blueprint. Do not invent a new taxonomy such as Business Profile, Growth
Priorities, or Action Plan.

Apply the full screen contract:

1. Home:
   - one clear headline, short value statement, one primary Start assessment
     CTA, and a real read-only or generated fictional Business Twin visual;
   - disclose fictional or user-entered data;
   - show verified properties such as deterministic calculations,
     evidence-linked recommendations, scenario comparison, and model-failure
     fallback;
   - keep Case A, B, and C fixture actions secondary and clearly fictional;
   - do not add testimonials, fake logos, invented adoption, countdowns, or
     unsupported Exabytes claims.

2. Assessment:
   - one grouped question at a time;
   - progress without pressure;
   - labels above fields;
   - why-this-matters explanation;
   - large choice targets;
   - Back and Continue that preserve answers;
   - inline errors and focus management;
   - unknown as a first-class answer;
   - zero to three deterministic follow-ups;
   - local save and restore;
   - review screen showing facts and unknowns, not findings.

3. Analysis and results:
   - finite states, no indefinite spinner;
   - calculations described as local and deterministic when that is true;
   - exactly six maturity dimensions: Website and commerce; Cloud and
     collaboration; CRM and customer operations; Marketing and measurement;
     Cybersecurity and continuity; AI adoption;
   - exactly four readiness dimensions: Leadership sponsorship; Data
     availability and quality; Employee skills; Process consistency;
   - band and confidence separate;
   - evidence, missing evidence, largest gaps, pain points, and calculation
     details come from canonical rules only;
   - do not leak recommendations or vendors before Stage 03.

4. Recommendations:
   - Why now, Next, Why later;
   - capability and business outcome before Exabytes offering mapping;
   - fit, evidence, prerequisites, limitations, confidence, and provenance;
   - distinguish official facts from generated advice;
   - no fabricated benefits, metrics, costs, timelines, or product claims.

5. Scenario and ROI Lab:
   - Lean, Balanced, Accelerated comparison;
   - repeated metric positions;
   - risk, budget fit, conditions, timing, and next action;
   - no selected label until explicit user selection;
   - Planning assumptions - not an Exabytes quote;
   - low, base, high values with source types;
   - 12-month desktop timeline and vertical mobile timeline;
   - conditional AI economics separate from committed ROI;
   - no invented percentages, multipliers, payback, revenue, supplier, or
     market claims.

6. Blueprint:
   - five advisor roles in fixed order;
   - finite ready, reviewing, live, fallback, and failed-safe states;
   - advisor position, origin, confidence, support, concerns, missing
     evidence, adjustments, and inspectable evidence references;
   - separate agreement, disagreement, conditions, and open questions;
   - executive summary before detail;
   - contents rail on desktop and compact menu on mobile;
   - print-ready A4 output with evidence and assumptions expanded;
   - no invented charts, testimonials, quotes, ratings, countdowns, or badges.

7. Consultation and release:
   - disclosure before unchecked consent;
   - no unsupported privacy, encryption, PDPA, retention, human-review, partner-
     sharing, or external-delivery claim;
   - honest recorded-request receipt with lead reference, submitted time, and
     Blueprint ID;
   - fixture launcher, reset confirmation, error, retry, restored state, and
     reliability strip;
   - reset only known project storage keys.

Use these visual and engineering rules:

- one coherent palette, radius scale, theme strategy, and icon family;
- use semantic tokens, not raw hex values in components;
- use real assets, an actual component preview, or labelled placeholders;
- do not build fake screenshots out of rectangles;
- do not use emoji as interface icons or hand-drawn SVG paths;
- do not use an AI-purple glow, generic glassmorphism, decorative dots, scroll
  cues, version stamps, city/weather strips, or fake precision;
- keep desktop navigation on one line;
- specify every below-768 px collapse in the component;
- test 1440, 1024, 390, and 360 px;
- keep controls at least 44 by 44 px;
- use Motion or another existing approved library for local transitions;
- never use window.addEventListener('scroll');
- animate transform and opacity rather than layout dimensions;
- honor prefers-reduced-motion;
- clean up every effect;
- make every animation explainable as hierarchy, storytelling, feedback, or
  state transition;
- provide loading, empty, error, success, fallback, keyboard, and print states;
- keep visible copy grammatical, plain, and free of em-dashes.

Do not use ImageKit MCP, Higgsfield MCP, unapproved image hosting, or an
unapproved backend, auth, or database change for this UI upgrade. Original
assets may be generated with an available image tool when appropriate, but all
demo assets must be fictional and provenance-labelled.

Work in these phases, one separate GPT-5.6 Sol High chat at a time:

Phase 0: audit and visual contract.
Phase 1: home and first viewport.
Phase 2: assessment and Business Twin review.
Phase 3: analysis and results.
Phase 4: recommendations and catalogue.
Phase 5: scenario and ROI Lab.
Phase 6: Blueprint and advisor experience.
Phase 7: consultation, demo, and release hardening.

Before dispatching a phase:

1. inspect the actual repository and current routes;
2. read the relevant stage packet and design review;
3. identify exact allowed files and commands;
4. state the design read and dials;
5. define the phase acceptance gate;
6. choose the correct Sol High model settings;
7. send only that bounded task to the implementation chat.

Every implementation chat must return:

- summary of work;
- changed files;
- dependency changes and why;
- design decisions and any dial changes;
- tests and commands with results;
- desktop and 360 px browser evidence;
- accessibility and reduced-motion evidence;
- known limitations;
- commit or PR identifier;
- any requested follow-up.

After receiving the result:

1. inspect the diff;
2. run the phase tests;
3. run browser verification at 1440, 1024, 390, and 360 px;
4. check console errors, keyboard focus, reduced motion, and horizontal
   overflow;
5. compare against accepted local screenshots and the contract;
6. request corrections if any visual or contract gate fails;
7. merge and push only after the gate passes;
8. update the stage ledger, test evidence, and release notes.

Use small, representative commits and push stage by stage. Never push secrets,
private data, .env.local, or unapproved generated assets. Do not call a phase
complete merely because the page renders. A phase is complete only when its
functional contract, visual hierarchy, responsive layout, accessibility,
state-cycle, tests, browser evidence, and Git handoff all pass.

Begin with Phase 0 as a non-mutating audit. Report the current routes, stack,
baseline test commands, existing design sources of truth, current visual debt,
and the exact Phase 1 implementation brief before dispatching Phase 1.
~~~

---

## 13. Short child-task template

Use this after the main chat has approved a phase. Replace the bracketed
values. Keep the task bounded.

~~~text
You are the GPT-5.6 Sol High implementation agent for [PHASE NAME] in
C:/Users/Dv/Desktop/AI HORIZON HACKATHON (EXABYTES).

Read:
- planning/UI-UX-UPGRADE-PLAYBOOK-AND-SOL-HIGH-PROMPT.md
- [RELEVANT STAGE PACKET]
- [RELEVANT DESIGN REVIEW]
- the repository instructions and current implementation

Use GPT-5.6 Sol High with high reasoning. Do not use Sol Medium.

Phase objective:
[ONE SENTENCE]

Allowed scope:
[EXACT FILES OR MODULES]

Frozen behavior to preserve:
[ROUTES, SCHEMAS, FORMULAS, DATA CONTRACTS, STORAGE, ANALYTICS, TESTS]

Visual target:
[SCREENSHOT PATHS OR DESIGN BRIEF]

Before editing:
1. inspect the existing implementation and package manifest;
2. state the design read and dials;
3. use UI/UX Pro Max searches for the actual stack and the relevant UX concern;
4. use Taste Skill only where its scope fits;
5. report any dependency or contract change before making it.

Implementation requirements:
- preserve all frozen behavior;
- implement loading, empty, error, success, fallback, keyboard, reduced-motion,
  and 360 px states relevant to this phase;
- use semantic tokens and the existing component system;
- no fake data, unsupported claims, fake screenshots, ImageKit, or Higgsfield;
- no window.addEventListener('scroll');
- no visible em-dashes;
- no horizontal overflow at 360 px;
- minimum 44 by 44 px interactive targets.

Verification:
- run the phase unit and integration tests;
- run lint, typecheck, and build when applicable;
- run browser verification at 1440, 1024, 390, and 360 px;
- check keyboard focus, contrast, reduced motion, console errors, and print if
  the phase touches the Blueprint or report;
- capture screenshots and name the exact viewport.

Return:
- changed files;
- decisions;
- commands and results;
- visual and accessibility evidence;
- known limitations;
- commit or PR identifier;
- any remaining correction request.
~~~

---

## 14. Definition of done

The UI/UX upgrade is complete only when:

- the accepted product journey still works from Home through consultation;
- no frozen domain or data contract changed accidentally;
- the implementation remains original and no external source was copied wholesale;
- Taste Skill and UI/UX Pro Max were used within their scopes;
- every phase has a reviewed design brief and evidence;
- the UI works at 1440, 1024, 390, and 360 px;
- keyboard, focus, contrast, reduced motion, and no-overflow gates pass;
- all required loading, empty, error, success, fallback, and reset states exist;
- deterministic values and provenance remain inspectable;
- Blueprint print output is readable and self-contained;
- the full golden Case A flow passes, with Case B and C checks also passing;
- lint, typecheck, unit, integration, browser, accessibility, and build checks
  pass as applicable;
- each phase has a focused commit and stage-by-stage GitHub update;
- release manifest, test evidence, third-party register, and demo script are
  current;
- no secrets, credentials, private user data, ImageKit artifacts, or Higgsfield
  artifacts are committed;
- the main chat has recorded the final limitations honestly.

This document is the handoff. The next action in the main chat is the Phase 0
non-mutating audit, followed by a bounded Phase 1 implementation chat using
GPT-5.6 Sol High.
