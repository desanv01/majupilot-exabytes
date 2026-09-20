---
format: 1920x1080
duration: 580s
message: "MajuPilot turns five evidence-backed SME answers into an inspectable path from diagnosis to Blueprint and consented handoff."
arc: "Identity → decision gap → evidence-led route → deterministic architecture → authentic proof → validation → bounded value → visible path"
audience: "Hackathon judges and Malaysian SME / Exabytes decision-makers"
mode: collaborative
fps: 30
language: en
workflow: general-video
flow: automation
storyboard: yes
demo_window: "195s–412s (3:15–6:52), exactly 217s"
design_truth: frame.md
---

# MajuPilot hackathon submission storyboard

## Decisions

- **Viewer arc:** establish why an SME needs an evidence-backed sequence, show how MajuPilot keeps
  deterministic truth separate from bounded interpretation, prove the route in the authentic
  production app, then close on validation, honest limits, and consented handoff.
- **Rhythm:** identity hold → problem compression → ordered build → architecture inspection →
  authentic long-form demo → proof ledger → value/boundary alternation → held close.
- **Duration driver:** the locked script chapter boundaries and the exact 217-second live-demo
  capture window. Durations below sum to 580 seconds / 17,400 frames at 30 fps.
- **Spine:** a continuous teal evidence path changes form—from underline to journey rail to
  provenance connector to consent checkbox—without becoming generic decoration.
- **Brand:** `frame.md` is authoritative. Warm paper, ink navy, teal, amber, coral; editorial serif,
  clean sans, and mono evidence labels; no neon/cyan AI look.
- **Held frames:** Frame 09 holds the no-current-RAG boundary; Frame 16 holds unchecked consent.
- **Status convention:** `animated` means the Stage 5 HyperFrames sub-composition and motion sidecar are implemented.
  Every `src` is a reserved Stage 5 target and is intentionally not created in this stage.
- **Capture truth:** all product UI tiles in the contact sheet are labelled placeholders for
  authentic capture. Stage 5 must use recorded production footage, never a DOM reconstruction.
- **Transition system:** related beats use registry `directional-wipe`; quiet proof/limit beats use
  registry `fade-through` or the local blur-crossfade recipe; chapter resets use the hand-authored
  HyperFrames vertical-push transition. First frame is a cut.
- **Stage 3 audio choice:** no narration, BGM, or SFX media is created here. `voiceover` preserves
  the locked script wording for Stage 4/5 sync.

## Registry resolution

Registry search receipts and no-fit reasons are in `planning/REGISTRY-DECISIONS.md`. Selected items
are recorded but not installed because Stage 3 may not create final composition code. Stage 5 must
install them once before parallel scene work.

## Frame 01 — Identity / the visible path

- status: animated
- src: compositions/frames/01-identity-visible-path.html
- duration: 20s
- transition_in: cut
- scene: Authorized portrait at right; Desan Vasu, Student, USM, and the MajuPilot thesis at left.
- voiceover: "Hello, I'm Desan Vasu, a student at USM, Universiti Sains Malaysia. This is MajuPilot. It turns a small set of SME answers into a decision path that people can inspect, question, and carry forward—with the evidence and boundaries still visible."
- poster: 12s
- time: 00:00–00:20
- section: Opening identity
- type: hook
- script_ref: SCRIPT.md § 0:00–0:20 — Opening identity
- evidence: SRC-11; BRIEF.md creator identity and message
- narrative_role: Introduce the creator and land the inspectable-path value before any implementation detail.
- blueprint: titlecard-reveal (Adapt; single restrained identity reveal and hold)
- rules: spring-pop-entrance; svg-path-draw; sine-wave-loop
- registry: No registry dependency; chapter-title search had no restrained on-brand fit.
- layer_plan: BG ink field + paper corner register; MG identity copy and teal evidence underline; FG respectful portrait crop and creator metadata.
- truthfulness: Portrait is authorized only here; no asset path appears; no product outcome claim.
- constraint: No portrait callback, no university/competition logo, no animated distortion of the face.
- first_motion: Evidence underline draws left-to-right inside 0.2s; portrait and name settle once, then hold.

The opening behaves like a signed cover sheet rather than a promotional splash. The evidence line
originates beneath “MajuPilot” and becomes the recurring path. The portrait is the sole photographic
focal point and remains proportionally cropped.

## Frame 02 — The decision gap

- status: animated
- src: compositions/frames/02-decision-gap.html
- duration: 22s
- transition_in: fade-through
- scene: “Another idea” is crowded by four unanswered decision questions, resolving to “A sequence.”
- voiceover: "Small and medium businesses are told to digitalise before they have a clear next step. The hard part isn't finding another idea. It's deciding what happens first, what it depends on, what it may cost, and which evidence supports the decision."
- poster: 14s
- time: 00:20–00:42
- section: 01 — Problem / Objectives
- type: pain_point
- script_ref: SCRIPT.md § 0:20–1:05 ¶1; SCRIPT-COVERAGE-AUDIT.md PROB-01 at 0:20–0:46
- evidence: PROB-01
- narrative_role: Reframe the problem from idea scarcity to decision sequencing and evidence.
- blueprint: overwhelm-surround (Adapt; clutter-shove-to-question without avatar)
- rules: center-outward-expansion; discrete-text-sequence; reactive-displacement
- registry: fade-through selected for entry; no additional effect.
- layer_plan: BG warm paper with cropped “DIGITALISE” ghost type; MG four question slips around a central sequence line; FG chapter marker and evidence-path arrow.
- truthfulness: Problem framing only; no market-size or performance statistic.
- constraint: No generic chatbot bubbles, no fake customer quote, no quantified pain claim.
- first_motion: Four question slips step in from the edges while the central “A sequence.” stays fixed.

The frame first feels crowded, then the evidence path shoves the loose ideas to the perimeter and
opens one readable route through the center.

## Frame 03 — Five answers become a Business Twin

- status: animated
- src: compositions/frames/03-five-answers-business-twin.html
- duration: 23s
- transition_in: directional-wipe
- scene: Five numbered evidence leaves assemble into an editable Business Twin with FACT and UNKNOWN stamps.
- voiceover: "A generic chat answer can sound confident and still leave those questions unresolved. MajuPilot starts with five focused questions. Together, they create an editable Business Twin: a compact record of context, objectives, capabilities, process friction, constraints, readiness, and evidence. Facts and unknowns remain visible. The objective is practical: move from answers to an inspectable path, not just a paragraph of advice."
- poster: 16s
- time: 00:42–01:05
- section: 01 — Problem / Objectives
- type: product_intro
- script_ref: SCRIPT.md § 0:20–1:05 ¶2; SCRIPT-COVERAGE-AUDIT.md OBJ-01/OBJ-02 at 0:46–1:05
- evidence: OBJ-01; OBJ-02
- narrative_role: Convert the abstract problem into MajuPilot’s smallest trustworthy evidence unit.
- blueprint: grid-card-assemble (Adapt; five-item evidence list, not a generic card grid)
- rules: waterfall-entry; svg-path-draw; spring-pop-entrance
- registry: state-chip-rail selected for the five-question progress rail.
- layer_plan: BG paper ledger and five-step spine; MG five labelled question leaves feeding one Twin dossier; FG FACT / UNKNOWN provenance chips.
- truthfulness: Facts and unknowns remain visibly distinct; no score exists yet.
- constraint: Exactly five question leaves; do not imply document upload or automatic inference.
- first_motion: The five rail states advance in sequence; the dossier locks only after the fifth.

The hero prop is the Business Twin dossier. Its visible edit tab and unknown stamp prevent the shot
from implying that input is complete or automatically verified.

## Frame 04 — The five-stage route

- status: animated
- src: compositions/frames/04-five-stage-route.html
- duration: 18s
- transition_in: vertical-push
- scene: ANSWER → DIAGNOSE → COMPARE → BLUEPRINT → HANDOFF runs as one evidence rail across the frame.
- voiceover: "MajuPilot organizes that path as Answer, Diagnose, Compare, Blueprint, and Handoff."
- poster: 10s
- time: 01:05–01:23
- section: 02 — Proposed Solution
- type: product_intro
- script_ref: SCRIPT.md § 1:05–2:05 ¶1; SCRIPT-COVERAGE-AUDIT.md SOL-01 at 1:05–1:32
- evidence: SOL-01
- narrative_role: Give judges a simple mental map that the live demo will later fulfil.
- blueprint: spatial-pan-stations (Adapt; five labelled stations on one continuous canvas)
- rules: viewport-change; svg-path-draw; spring-pop-entrance
- registry: state-chip-rail selected for stage-state changes.
- layer_plan: BG ink field with paper route labels; MG continuous teal rail and five asymmetric stations; FG chapter marker and small route verbs.
- truthfulness: Uses the product’s branded journey names in the approved order.
- constraint: Do not call the route a CRM funnel or generic chatbot workflow.
- first_motion: Camera begins already moving along the rail and lands on HANDOFF for the hold.

The rail is the recurring evidence path widened into the core navigation model. This is a map, not a
feature inventory.

## Frame 05 — What each stage owns

- status: animated
- src: compositions/frames/05-stage-ownership.html
- duration: 25s
- transition_in: directional-wipe
- scene: Five route stations open one at a time to show evidence, deterministic diagnosis, ranges, report, and consent.
- voiceover: "Answer captures evidence before scoring. Diagnose applies deterministic rules to produce maturity, readiness, and pain findings. Compare places alternative plans side by side, with their assumptions, schedules, costs, operational value, net value, and payback ranges. Blueprint brings the selected path, risks, open questions, evidence links, and five specialist reviews into one report. Handoff opens only after the Blueprint is verified and the person decides what information to share."
- poster: 18s
- time: 01:23–01:48
- section: 02 — Proposed Solution
- type: feature_showcase
- script_ref: SCRIPT.md § 1:05–2:05 ¶2; SCRIPT-COVERAGE-AUDIT.md SOL-01
- evidence: SOL-01; SOL-03
- narrative_role: Prove that every stage has a specific responsibility and boundary.
- blueprint: spatial-pan-stations (Adapt; station-by-station ownership reveal)
- rules: anchored-layout-expand; control-target-sync; svg-path-draw
- registry: directional-wipe selected; state-chip-rail supplies the active/done/pending treatment.
- layer_plan: BG persistent route rail; MG one expanded station plus four compressed stations; FG exact ownership noun and qualifying evidence chip.
- truthfulness: Handoff opens after Blueprint verification and a sharing decision; no lead is created by loading a case.
- constraint: No automatic handoff, no CRM record, no hidden score before evidence confirmation.
- first_motion: Active station expands from its anchored rail position while the ownership noun snaps into view.

The same camera position is maintained while the active station changes, so the audience reads one
system with explicit ownership rather than five unrelated slides.

## Frame 06 — Deterministic truth, bounded interpretation

- status: animated
- src: compositions/frames/06-truth-boundary.html
- duration: 17s
- transition_in: directional-wipe
- scene: A locked deterministic ledger sits left; bounded interpretation sits right, connected but unable to overwrite it.
- voiceover: "Throughout the journey, facts, calculations, assumptions, catalogue mappings, and model interpretation are visibly different. Deterministic values remain authoritative. Optional AI can interpret within a bounded role, but it does not calculate or overwrite numeric truth. Loading a fictional demonstration also does not create consent or a consultation lead."
- poster: 11s
- time: 01:48–02:05
- section: 02 — Proposed Solution
- type: feature_showcase
- script_ref: SCRIPT.md § 1:05–2:05 ¶3; SCRIPT-COVERAGE-AUDIT.md OBJ-02/SOL-02/SOL-03
- evidence: OBJ-02; SOL-02; SOL-03
- narrative_role: Establish the core trust architecture before technical implementation appears.
- blueprint: comparison-split (Adapt; authority vs bounded interpretation)
- rules: split-tilt-cards; control-target-sync; card-morph-anchor
- registry: No extra effect; directional-wipe handles the seam.
- layer_plan: BG paper split by a fixed vertical rule; MG deterministic ledger and bounded-review panel; FG lock icon, “CANNOT OVERWRITE” bridge, and FICTION label.
- truthfulness: Optional AI interprets only within bounded roles; deterministic values remain authoritative.
- constraint: No sentient-agent imagery, no “AI decides,” no automatic consent or lead creation.
- first_motion: Ledger locks first; interpretation panel enters second and stops at the bridge.

The two panels are deliberately unequal: deterministic truth receives more area and visual weight.

## Frame 07 — Production architecture

- status: animated
- src: compositions/frames/07-production-architecture.html
- duration: 26s
- transition_in: vertical-push
- scene: Six-node architecture path links Next.js, versioned routes, deterministic core, domain pack, Supabase, optional Gateway, and outbox.
- voiceover: "Underneath, MajuPilot is a Next dot J S interface over versioned routes and a deterministic domain core. An Exabytes domain pack supplies the rules and catalogue mappings. Supabase supports persistence and private storage. A Vercel AI Gateway can provide the optional model path, and a durable outbox supports controlled delivery."
- poster: 17s
- time: 02:05–02:31
- section: 03 — Technical Approach / Design
- type: feature_showcase
- script_ref: SCRIPT.md § 2:05–3:15 ¶1; SCRIPT-COVERAGE-AUDIT.md TECH-01 at 2:05–2:32
- evidence: TECH-01; SRC-01; SRC-02; SRC-03
- narrative_role: Show separation of concerns without turning the chapter into a stack recital.
- blueprint: spatial-pan-stations (Adapt; architecture nodes on one inspected path)
- rules: svg-path-draw; center-outward-expansion; viewport-change
- registry: Architecture-flow search returned no fit; bespoke diagram justified in planning/REGISTRY-DECISIONS.md.
- layer_plan: BG navy technical field with subtle paper grid; MG six named system nodes and directional connectors; FG OPTIONAL and PRIVATE badges plus chapter marker.
- truthfulness: Shows component roles only; no credentials, environment variables, endpoints, or private URLs.
- constraint: Gateway is optional; Supabase is persistence/private storage; outbox is controlled delivery.
- first_motion: Evidence path draws through nodes in dependency order, pausing at deterministic core.

The deterministic core is the visual center of gravity. Optional AI is a side branch rather than the
top-level engine.

## Frame 08 — Provenance and five specialist lenses

- status: animated
- src: compositions/frames/08-provenance-specialists.html
- duration: 28s
- transition_in: directional-wipe
- scene: One claim traces back to Business Twin evidence and calculation version while five advisor lenses review the selected path.
- voiceover: "This separation matters because each stage can be inspected on its own. Evidence-linked records connect claims back to the Business Twin and calculation versions. Once a path is selected, five specialist lenses review it. If model output is invalid or unavailable, each role falls back within a bounded contract; the workflow does not pretend that an unconstrained agent is making the decision."
- poster: 19s
- time: 02:31–02:59
- section: 03 — Technical Approach / Design
- type: feature_showcase
- script_ref: SCRIPT.md § 2:05–3:15 ¶2; SCRIPT-COVERAGE-AUDIT.md TECH-02/TECH-03 at 2:32–3:02
- evidence: TECH-02; TECH-03
- narrative_role: Translate architecture into inspectability and bounded failure behavior.
- blueprint: grid-card-assemble (Adapt; one evidence chain plus five lenses)
- rules: svg-path-draw; waterfall-entry; spring-pop-entrance
- registry: Provenance-flow search returned no fit; use hand-authored evidence chain. `state-chip-rail` may render advisor live/fallback states.
- layer_plan: BG warm paper; MG claim→source→version chain across lower half and five compact advisor lenses above; FG BOUNDED FALLBACK stamp.
- truthfulness: Five specialist reviews; invalid/unavailable output falls back per role.
- constraint: No universal explainability claim, no raw prompts/reasoning, no autonomous-decision language.
- first_motion: Provenance connector draws backward from claim to source before advisor lenses assemble.

The causal reading order runs backward from output to evidence, making provenance the action rather
than a decorative footnote.

## Frame 09 — The current boundary

- status: animated
- src: compositions/frames/09-no-current-rag.html
- duration: 16s
- transition_in: fade-through
- scene: Held amber boundary card: “Document RAG and arbitrary document ingestion — NOT IMPLEMENTED NOW.”
- voiceover: "One limitation is equally important. Document R A G and arbitrary document ingestion are not current product features. They are deferred P one future potential, not something demonstrated here. In this video, the source of truth is the live, labelled, fictional journey."
- poster: 10s
- time: 02:59–03:15
- section: 03 — Technical Approach / Design
- type: benefit_highlight
- script_ref: SCRIPT.md § 2:05–3:15 ¶3; SCRIPT-COVERAGE-AUDIT.md TECH-04 at 3:02–3:15
- evidence: TECH-04; FUT-01
- narrative_role: Earn trust by stating the most important non-feature before the demo.
- blueprint: titlecard-reveal (Adapt; one restrained reveal and deliberate still hold)
- rules: svg-path-draw; sine-wave-loop
- registry: fade-through selected; chapter-title search had no on-brand fit.
- layer_plan: BG amber-100 paper field; MG large boundary statement and thin coral prohibition rule; FG `CURRENT` / `DEFERRED P1` labels and source-of-truth note.
- truthfulness: Document RAG and arbitrary ingestion are future-only, not current.
- constraint: No upload icon, file-ingestion animation, Copilot answer, or roadmap date.
- first_motion: Coral rule draws once; all other motion stops for the final six-second hold.

This is the planned stillness beat. The absence of motion gives the limitation enough time to be
read and remembered.

## Frame 10 — Live demo: fictional Case A

- status: animated
- src: compositions/frames/10-demo-case-a-home.html
- duration: 13s
- transition_in: vertical-push
- scene: Authentic home capture slot shows MajuPilot, Kopi Kita Café Group, FICTIONAL DEMONSTRATION, and fixture 1.0.0.
- voiceover: "Here is the MajuPilot production surface. I'm loading Case A, Kopi Kita Café Group. The banner identifies it as a fictional demonstration using fixture one point zero point zero."
- poster: 8s
- time: 03:15–03:28
- section: 04 — Functional Prototype Demonstration
- type: product_intro
- script_ref: SCRIPT.md § 3:15–3:28; DEMO-CAPTURE-PLAN.md 3:15–3:28
- evidence: DEMO-01; SOL-03; SRC-09
- narrative_role: Establish authentic production proof and the fiction boundary before any number.
- blueprint: device-surface-showcase (Adapt; held browser surface, authentic capture only)
- rules: viewport-change; depth-of-field-blur
- registry: browser-device-stage may frame capture; simulated-cursor for the Case A action.
- layer_plan: BG ink frame and chapter marker; MG full-width AUTHENTIC CAPTURE SLOT; FG FICTION / fixture callout and route receipt.
- truthfulness: Fiction banner and fixture 1.0.0 stay visible; no real customer data.
- constraint: No portrait, private browser chrome, stale SME Growth Twin tab, or reconstructed app UI.
- first_motion: Browser surface settles; cursor moves once to the real Case A action.

Stage 5 replaces the labelled placeholder with the actual capture described in the plan.

## Frame 11 — Live demo: evidence before score

- status: animated
- src: compositions/frames/11-demo-evidence-review.html
- duration: 22s
- transition_in: directional-wipe
- scene: Authentic /assessment/review capture shows five completed groups, an explicit unknown, editable cards, and Confirm Business Twin.
- voiceover: "Before any score appears, the review screen shows five completed evidence groups and an explicit unknown. The record is still editable. Confirm Business Twin is the deliberate handoff from captured evidence to calculation."
- poster: 14s
- time: 03:28–03:50
- section: 04 — Functional Prototype Demonstration
- type: feature_showcase
- script_ref: SCRIPT.md § 3:28–3:50; DEMO-CAPTURE-PLAN.md 3:28–3:50
- evidence: OBJ-02; DEMO-01
- narrative_role: Prove that evidence stays editable and precedes deterministic calculation.
- blueprint: cursor-ui-demo (Adapt; one authentic review action, no reconstructed UI)
- rules: cursor-click-ripple; control-target-sync; anchored-layout-expand
- registry: simulated-cursor + yt-feather-highlight selected.
- layer_plan: BG ink capture frame; MG authentic review page; FG spotlight sequence on five groups, UNKNOWN chip, and Confirm Business Twin.
- truthfulness: No score is shown before confirmation; unknown remains explicit.
- constraint: Do not hide the fiction banner, invent completion states, or click through before the hold.
- first_motion: Spotlight moves from evidence count to UNKNOWN and rests on Confirm Business Twin.

## Frame 12 — Live demo: deterministic diagnosis

- status: animated
- src: compositions/frames/12-demo-diagnosis.html
- duration: 28s
- transition_in: directional-wipe
- scene: Authentic /results capture centers 37.5, 42.5, six pain findings, and one opened evidence/calculation disclosure.
- voiceover: "Now the deterministic diagnosis is complete. Digital maturity is thirty seven point five out of one hundred. AI readiness is forty two point five. Six pain findings were triggered. I can open a finding and see the evidence and calculation disclosure behind it, rather than accepting an unexplained score."
- poster: 18s
- time: 03:50–04:18
- section: 04 — Functional Prototype Demonstration
- type: feature_showcase
- script_ref: SCRIPT.md § 3:50–4:18; DEMO-CAPTURE-PLAN.md 3:50–4:18
- evidence: DEMO-02; TECH-02
- narrative_role: Deliver the first exact numeric proof and immediately expose its provenance.
- blueprint: dataviz-countup (Adapt; two exact scores then evidence disclosure)
- rules: counting-dynamic-scale; stat-bars-and-fills; anchored-layout-expand
- registry: count-up or mk-progress-stat for overlays; ui-focus-zoom for the disclosure.
- layer_plan: BG authentic results page; MG score pair and six-finding group; FG exact-value overlay and disclosure spotlight.
- truthfulness: Values are exactly 37.5 and 42.5 out of 100; six triggered findings.
- constraint: Do not round values, strengthen maturity labels, or suggest AI generated the scores.
- first_motion: Score overlays count to exact values, then camera pans to one real expanded disclosure.

## Frame 13 — Live demo: capability-first recommendations

- status: animated
- src: compositions/frames/13-demo-recommendations.html
- duration: 27s
- transition_in: directional-wipe
- scene: Authentic /recommendations capture shows 3 Why now, 1 Next, 1 Why later, governed AI later, and catalogue 2.0.0.
- voiceover: "Recommendations are capability-first. For this case, three moves are marked Why now, one is Next, and governed AI is Why later. Catalogue version two point zero point zero supports the mapping, but these entries are not live quotations or guaranteed availability. They are provenance for the decision sequence."
- poster: 17s
- time: 04:18–04:45
- section: 04 — Functional Prototype Demonstration
- type: feature_showcase
- script_ref: SCRIPT.md § 4:18–4:45; DEMO-CAPTURE-PLAN.md 4:18–4:45
- evidence: DEMO-03
- narrative_role: Show priority order and the boundary between capability provenance and a vendor quote.
- blueprint: grid-card-assemble (Adapt; ordered recommendation ledger)
- rules: waterfall-entry; stat-bars-and-fills; spring-pop-entrance
- registry: state-chip-rail selected for Why now / Next / Why later states.
- layer_plan: BG authentic recommendation surface; MG ordered ledger; FG 3 / 1 / 1 status register and `CATALOGUE 2.0.0 · PROVENANCE, NOT QUOTE`.
- truthfulness: Governed AI stays Why later; catalogue mapping is not a live quotation or guarantee.
- constraint: No price overlay, availability badge, or vendor fulfilment claim.
- first_motion: Status rail advances 3→1→1 and stops on governed AI / Why later.

## Frame 14 — Live demo: three scenarios, one selected path

- status: animated
- src: compositions/frames/14-demo-scenarios.html
- duration: 40s
- transition_in: directional-wipe
- scene: Authentic /scenarios capture compares three plans, selects Balanced Growth, and holds every low/base/high range with the assumption label.
- voiceover: "The scenario lab compares Lean Foundation, Balanced Growth, and Accelerated AI. I'm selecting Balanced Growth; inspection alone does not save the preference. The screen labels figures as planning assumptions, not an Exabytes quote. In the base case, cost is eighteen thousand four hundred ringgit, operational value is seven thousand two hundred fifty-four ringgit, net value is negative eleven thousand one hundred forty-six ringgit, and payback is thirty point four months. Low and high figures remain visible, including negative outcomes. These are conditional ranges, not predictions or guarantees."
- poster: 27s
- time: 04:45–05:25
- section: 04 — Functional Prototype Demonstration
- type: feature_showcase
- script_ref: SCRIPT.md § 4:45–5:25; DEMO-CAPTURE-PLAN.md 4:45–5:25
- evidence: DEMO-04; DEMO-05
- narrative_role: Let judges compare alternatives and see the exact financial consequences of assumptions.
- blueprint: device-surface-showcase (Adapt; real scenario lab with one deliberate selection)
- rules: control-target-sync; stat-bars-and-fills; cursor-click-ripple
- registry: simulated-cursor + ui-focus-zoom; data-chart is a reference only, not a replacement for the real UI.
- layer_plan: BG authentic scenario lab; MG three scenario cards and schedule; FG Balanced Growth selection plus four exact low/base/high registers.
- truthfulness: Cost RM9,200/RM18,400/RM27,600; value RM2,358/RM7,254/RM15,233; net -RM25,242/-RM11,146/RM6,033; live payback labels 7.2/30.4/More than 60 months, with underlying deterministic worst-case value 140.5 months.
- constraint: Keep negative net values and planning-assumption/not-quote labels visible; no ROI guarantee.
- first_motion: Cursor selects Balanced Growth; linked financial ranges highlight in the same beat.

## Frame 15 — Live demo: the source-linked Blueprint

- status: animated
- src: compositions/frames/15-demo-blueprint.html
- duration: 55s
- transition_in: directional-wipe
- scene: Authentic /blueprint capture moves from five advisor statuses to the 16-section index, selected plan, roadmap, risks, synthesis, methodology, and empty notes.
- voiceover: "With the path selected, MajuPilot generates a source-linked Blueprint. Five specialist reviews appear around the same deterministic facts; interpretation does not replace the scores, schedule, or financial range. The report contains sixteen sections. Instead of scrolling through everything, I am using the index to show the executive overview, selected plan, month-by-month roadmap, risks, conditions, open questions, advisor reviews, synthesis, and methodology. Evidence references remain attached, and the Blueprint identity is carried into the handoff. Notice what is not being claimed: the advisor output is bounded, consultant notes are still empty in this run, and no human consultant has accepted the report. The value here is a reviewable package, not an automatic final decision."
- poster: 34s
- time: 05:25–06:20
- section: 04 — Functional Prototype Demonstration
- type: feature_showcase
- script_ref: SCRIPT.md § 5:25–6:20; DEMO-CAPTURE-PLAN.md 5:25–6:20
- evidence: DEMO-06; TECH-03
- narrative_role: Deliver the product payoff as an inspectable, source-linked package—not an opaque AI answer.
- blueprint: transcript-scroll-artifact-reveal (Adapt; index-led traversal of the real report)
- rules: viewport-change; depth-of-field-blur; svg-path-draw
- registry: ui-focus-zoom + yt-feather-highlight; state-chip-rail for five advisor statuses.
- layer_plan: BG authentic Blueprint surface; MG advisor status row and index-led report anchors; FG `16 SECTIONS`, provenance badges, empty-notes callout, and Blueprint identity.
- truthfulness: Five bounded specialist reviews; deterministic values unchanged; consultant notes empty; no human acceptance.
- constraint: No full-speed scroll, no invented consultant note, no implication that the report is a final decision.
- first_motion: Advisor states settle, then the section index drives three deliberate anchored jumps.

## Frame 16 — Live demo: consent is the boundary

- status: animated
- src: compositions/frames/16-demo-consent-boundary.html
- duration: 32s
- transition_in: fade-through
- scene: Authentic /consultation capture shows verified Blueprint, shared-data categories, empty fields, and unchecked consent; the cursor stops.
- voiceover: "The consultation page verifies the Blueprint and summarizes the selected path. It also names the categories that would be shared. Contact fields are empty, and consent begins unchecked. I stop here. Nothing is submitted, no real contact data is entered, and the interface does not promise a human response, vendor fulfilment, or automatic C R M record creation."
- poster: 23s
- time: 06:20–06:52
- section: 04 — Functional Prototype Demonstration
- type: feature_showcase
- script_ref: SCRIPT.md § 6:20–6:52; DEMO-CAPTURE-PLAN.md 6:20–6:52
- evidence: DEMO-07; VALUE-02
- narrative_role: End the live demo on explicit user agency and privacy rather than submission theatre.
- blueprint: cursor-ui-demo (Adapt; approach without click, then held boundary)
- rules: cursor-click-ripple (approach only); depth-of-field-blur; sine-wave-loop
- registry: simulated-cursor + yt-feather-highlight selected; no press/click component.
- layer_plan: BG authentic consultation page; MG verified Blueprint summary, disclosure, and empty form; FG large magnified unchecked box and `STOP BEFORE SUBMIT` receipt.
- truthfulness: No contact data, submission, promised response, fulfilment, or CRM creation.
- constraint: Checkbox remains unchecked; Record consultation request is never clicked.
- first_motion: Spotlight descends from shared-data categories to the unchecked box; all motion stops for the final eight seconds.

This is the second intentional stillness beat and the demo’s terminal frame.

## Frame 17 — Testing / Validation chapter reset

- status: animated
- src: compositions/frames/17-testing-chapter.html
- duration: 3s
- transition_in: vertical-push
- scene: Chapter card “05 — Testing / Validation” with two labelled evidence layers: HOSTED and PHASE I LOCAL.
- voiceover: ""
- poster: 2s
- time: 06:52–06:55
- section: 05 — Testing / Validation
- type: product_intro
- script_ref: SCRIPT.md § 6:52–8:15 chapter card; SCRIPT-COVERAGE-AUDIT.md required section marker
- evidence: TEST-01–TEST-05
- narrative_role: Reset the viewer from live walkthrough to evidence receipts and establish the two-layer distinction.
- blueprint: titlecard-reveal (Adapt; one fast chapter reveal)
- rules: waterfall-entry; svg-path-draw
- registry: No on-brand chapter block; hand-authored per no-fit decision.
- layer_plan: BG ink field; MG chapter title; FG HOSTED / PHASE I LOCAL split labels and evidence path fork.
- truthfulness: The two validation layers are distinct before any counts appear.
- constraint: No narration, no combined totals, no celebratory claim of perfection.
- first_motion: Evidence path forks once into two labelled rails.

## Frame 18 — Accepted hosted gates

- status: animated
- src: compositions/frames/18-hosted-gates.html
- duration: 24s
- transition_in: directional-wipe
- scene: Hosted evidence ledger lands 47 test files, 221 passed, one intentionally skipped, TypeScript, ESLint, and 38 static pages.
- voiceover: "Validation is kept in two clearly labelled layers. In accepted hosted integration, forty seven test files ran, two hundred twenty one tests passed, and one test was intentionally skipped. TypeScript, E S Lint, and the build passed, generating thirty eight static pages."
- poster: 16s
- time: 06:55–07:19
- section: 05 — Testing / Validation
- type: social_proof
- script_ref: SCRIPT.md § 6:52–8:15 ¶1–2; SCRIPT-COVERAGE-AUDIT.md TEST-01 at 6:55–7:19
- evidence: TEST-01; SRC-03
- narrative_role: Provide current hosted release proof with exact counts and scope.
- blueprint: dataviz-countup (Adapt; exact evidence counts, no marketing inflation)
- rules: counting-dynamic-scale; stat-bars-and-fills; spring-pop-entrance
- registry: count-up / mk-progress-stat selected; mk-specs-list for the passed gates.
- layer_plan: BG hosted evidence docket; MG one hero `221` with supporting 47 / 1 skipped / 38; FG TypeScript, ESLint, BUILD receipts and `ACCEPTED HOSTED` label.
- truthfulness: Counts belong to accepted hosted integration; one test intentionally skipped.
- constraint: Do not combine with 220/35 local baseline or imply zero defects.
- first_motion: 221 counts up once; supporting receipts stamp in sequentially.

## Frame 19 — Consolidated production smoke

- status: animated
- src: compositions/frames/19-production-smoke.html
- duration: 20s
- transition_in: directional-wipe
- scene: A fictional/synthetic smoke path checks durable journey, private report, consent/lead flow, signed delivery, guest denial, and Copilot boundary.
- voiceover: "The consolidated smoke used a labelled fictional business and synthetic contact details. It verified the durable journey, private report handling, consent and lead flow, signed delivery, guest denial, and the live Copilot boundary."
- poster: 13s
- time: 07:19–07:39
- section: 05 — Testing / Validation
- type: social_proof
- script_ref: SCRIPT.md § 6:52–8:15 ¶2; SCRIPT-COVERAGE-AUDIT.md TEST-02 at 7:19–7:39
- evidence: TEST-02; SRC-03
- narrative_role: Show what the smoke exercised while preserving fiction and synthetic-data limits.
- blueprint: grid-card-assemble (Adapt; six verified smoke checks)
- rules: waterfall-entry; svg-path-draw; spring-pop-entrance
- registry: mk-specs-list selected.
- layer_plan: BG paper test sheet; MG six sequential checks on a single route line; FG `FICTIONAL BUSINESS` and `SYNTHETIC CONTACT` labels.
- truthfulness: Verified in the consolidated smoke; not a real customer conversion or human response.
- constraint: No real contact details, webhook payload, or private report URL.
- first_motion: Route line draws through six checks; each check lands only as the line reaches it.

## Frame 20 — Scoped environment evidence

- status: animated
- src: compositions/frames/20-scoped-environment-evidence.html
- duration: 19s
- transition_in: directional-wipe
- scene: Four recorded-environment receipts show security headers, no desktop overflow, zero console errors, and no recent Vercel production error logs.
- voiceover: "Release evidence also recorded required security headers, no horizontal overflow at the tested desktop viewport, zero browser console errors, and no recent Vercel production error logs. Those are scoped results from the recorded test environment, not a claim of perfect production performance."
- poster: 12s
- time: 07:39–07:58
- section: 05 — Testing / Validation
- type: social_proof
- script_ref: SCRIPT.md § 6:52–8:15 ¶3; SCRIPT-COVERAGE-AUDIT.md TEST-03 at 7:39–7:58
- evidence: TEST-03; SRC-03
- narrative_role: Present useful release evidence and immediately bound its interpretation.
- blueprint: grid-card-assemble (Adapt; four scoped proof rows)
- rules: waterfall-entry; spring-pop-entrance
- registry: mk-specs-list selected.
- layer_plan: BG warm paper; MG four evidence rows with environment/date rail; FG large `SCOPED RESULTS` qualifier and no-perfection footnote.
- truthfulness: Claims apply only to the recorded test environment and recent-log window.
- constraint: Never show “perfect,” “zero production errors forever,” or universal accessibility claims.
- first_motion: Proof rows arrive; `SCOPED RESULTS` remains fixed and visible throughout.

## Frame 21 — Historical local baseline stays separate

- status: animated
- src: compositions/frames/21-local-baseline.html
- duration: 12s
- transition_in: fade-through
- scene: Hosted and Phase I local receipts sit side by side, with the local row labelled historical: 47/220/1 file-test skipped/35/3.284s.
- voiceover: "The earlier Phase I local baseline remains separate: forty seven test files, two hundred twenty tests passed, one file and test intentionally skipped, thirty five static pages, and a three point two eight four second guest-first keyboard journey to Blueprint."
- poster: 8s
- time: 07:58–08:10
- section: 05 — Testing / Validation
- type: feature_showcase
- script_ref: SCRIPT.md § 6:52–8:15 ¶4 sentence 1; SCRIPT-COVERAGE-AUDIT.md TEST-04 at 7:58–8:10
- evidence: TEST-04; SRC-04; SRC-05
- narrative_role: Preserve provenance by preventing the local baseline from inflating current hosted proof.
- blueprint: comparison-split (Adapt; current hosted vs historical local)
- rules: split-tilt-cards; stat-bars-and-fills
- registry: No extra effect; fade-through distinguishes evidence layer change.
- layer_plan: BG paper split; MG HOSTED receipt left and PHASE I LOCAL receipt right; FG `HISTORICAL BASELINE` band and exact 3.284s label.
- truthfulness: Local baseline is 47 files / 220 tests / one file and test skipped / 35 pages / 3.284 seconds.
- constraint: Never sum, average, or merge hosted and local counts.
- first_motion: Local receipt enters second and receives the amber historical band before numbers appear.

## Frame 22 — Bounded hosted model path

- status: animated
- src: compositions/frames/22-bounded-model-path.html
- duration: 5s
- transition_in: fade-through
- scene: A compact receipt names deepseek/deepseek-v4.1-flash behind bounded Gateway controls; private fields remain redacted by design.
- voiceover: "The accepted hosted model path observed DeepSeek V four point one Flash behind bounded Gateway controls. No credentials, raw prompts, private report links, or model reasoning are exposed."
- poster: 3s
- time: 08:10–08:15
- section: 05 — Testing / Validation
- type: benefit_highlight
- script_ref: SCRIPT.md § 6:52–8:15 ¶4 sentence 2–3; SCRIPT-COVERAGE-AUDIT.md TEST-05 at 8:10–8:15
- evidence: TEST-05; SRC-02; SRC-03
- narrative_role: Name the observed model path without turning private implementation detail into spectacle.
- blueprint: titlecard-reveal (Adapt; compact receipt and hard hold)
- rules: discrete-text-sequence; svg-path-draw
- registry: fade-through selected; no terminal/code block.
- layer_plan: BG ink receipt field; MG exact model identifier and bounded Gateway line; FG four privacy redaction labels.
- truthfulness: Exact observed model is deepseek/deepseek-v4.1-flash; no cost or reasoning claim.
- constraint: No credentials, prompts, reasoning, private URL, or terminal simulation.
- first_motion: Model receipt snaps in fully formed; privacy labels draw beneath it.

## Frame 23 — Value for owner and advisor

- status: animated
- src: compositions/frames/23-owner-advisor-value.html
- duration: 32s
- transition_in: vertical-push
- scene: One evidence path serves two viewpoints: SME owner gains a clearer decision conversation; advisor gains a structured, consented handoff.
- voiceover: "For an SME owner, the value is not manufactured certainty. It is a clearer conversation: five answers become a reviewed starting point, scenario ranges show the consequences of assumptions, and the Blueprint preserves why a path was chosen. For an advisor, the same structured handoff can reduce repeated discovery while keeping consent explicit."
- poster: 21s
- time: 08:15–08:47
- section: 06 — Industry Value / Future Potential
- type: benefit_highlight
- script_ref: SCRIPT.md § 8:15–9:25 ¶1; SCRIPT-COVERAGE-AUDIT.md VALUE-01 at 8:15–8:47
- evidence: VALUE-01
- narrative_role: Convert product mechanics into restrained stakeholder value without promising outcomes.
- blueprint: comparison-split (Adapt; complementary owner/advisor views)
- rules: split-tilt-cards; svg-path-draw; control-target-sync
- registry: directional-wipe/vertical chapter seam only.
- layer_plan: BG warm paper with shared evidence path; MG owner and advisor panels of unequal but complementary weight; FG `CLEARER CONVERSATION` / `STRUCTURED HANDOFF` claims.
- truthfulness: Value is inspectability and reduced repeated discovery potential, not measured time saved.
- constraint: No ROI, revenue, productivity, conversion, or response-time promise.
- first_motion: Shared path splits to the two roles, then reconnects at explicit consent.

## Frame 24 — What MajuPilot does not promise

- status: animated
- src: compositions/frames/24-no-promises.html
- duration: 15s
- transition_in: directional-wipe
- scene: Fixed “DEPLOYABLE WORKFLOW” anchor stays centered while five prohibited promises cycle beside it and remain crossed out.
- voiceover: "The current boundary matters. MajuPilot does not promise business outcomes, vendor fulfilment, guaranteed availability, a human response, or automatic C R M record creation. The prototype shows a deployable workflow and an inspectable decision package, not a completed customer transformation."
- poster: 10s
- time: 08:47–09:02
- section: 06 — Industry Value / Future Potential
- type: benefit_highlight
- script_ref: SCRIPT.md § 8:15–9:25 ¶2; SCRIPT-COVERAGE-AUDIT.md VALUE-02 at 8:47–9:02
- evidence: VALUE-02
- narrative_role: Protect credibility by making non-promises as memorable as the value claim.
- blueprint: fixed-anchor-cycle (Adapt; fixed value anchor, cycling prohibited promises)
- rules: discrete-text-sequence; svg-path-draw; theme-crossfade-morph
- registry: state-chip-rail may carry the five boundary states; no decorative effect.
- layer_plan: BG ink field; MG fixed `DEPLOYABLE WORKFLOW` anchor and cycling no-promise register; FG coral strike rules and `NOT A COMPLETED TRANSFORMATION`.
- truthfulness: Repeats the exact five boundaries from the script.
- constraint: No upbeat checkmarks on prohibited promises and no implication of a submitted handoff.
- first_motion: Anchor remains still while the five no-promises step through one adjacent slot.

## Frame 25 — Future potential remains future

- status: animated
- src: compositions/frames/25-future-potential.html
- duration: 23s
- transition_in: fade-through
- scene: The current validated boundary stays solid; four future branches and deferred P1 Document RAG remain amber outlines beyond it.
- voiceover: "Future work can extend domain packs, evidence sources, integrations, and consultant workflows after this boundary is validated. Document R A G and arbitrary uploaded-document ingestion may be explored later as deferred P one scope only. They are not implemented now. The opportunity is to broaden the evidence available to the system without weakening provenance, consent, or deterministic ownership."
- poster: 15s
- time: 09:02–09:25
- section: 06 — Industry Value / Future Potential
- type: benefit_highlight
- script_ref: SCRIPT.md § 8:15–9:25 ¶3; SCRIPT-COVERAGE-AUDIT.md FUT-01/FUT-02 at 9:02–9:25
- evidence: FUT-01; FUT-02; TECH-04
- narrative_role: Show credible expansion paths while keeping the implemented/future line unmistakable.
- blueprint: spatial-pan-stations (Adapt; current station and four outlined future branches)
- rules: svg-path-draw; center-outward-expansion; stat-bars-and-fills
- registry: No architecture/provenance diagram fit; hand-authored outlined branches.
- layer_plan: BG paper field with solid current boundary; MG four outlined future branches; FG amber `FUTURE / DEFERRED P1` stamps and persistent provenance/consent/deterministic anchors.
- truthfulness: Domain packs, sources, integrations, consultant workflows, and Document RAG are opportunities only; no release date.
- constraint: Document RAG branch never fills, activates, or receives current-feature styling.
- first_motion: Future branches draw as outlines but stop before crossing the validated-boundary rule.

## Frame 26 — The path stays visible

- status: animated
- src: compositions/frames/26-visible-path-close.html
- duration: 15s
- transition_in: fade-through
- scene: MajuPilot wordmark and “The path to a decision, visible.” close with creator attribution; no portrait.
- voiceover: "MajuPilot is not a machine that decides for an SME. It makes the path to a decision visible. I'm Desan Vasu, Student, USM — Universiti Sains Malaysia. Thank you."
- poster: 10s
- time: 09:25–09:40
- section: Close
- type: branding
- script_ref: SCRIPT.md § 9:25–9:40 — Close
- evidence: VALUE-01; BRIEF.md creator identity
- narrative_role: Return to the thesis and creator with a restrained, trustworthy finish.
- blueprint: logo-assemble-lockup (Adapt; evidence path resolves into wordmark, then long hold)
- rules: svg-path-draw; spring-pop-entrance; sine-wave-loop
- registry: fade-through selected; no logo-effect block.
- layer_plan: BG ink field; MG MajuPilot wordmark and thesis; FG creator attribution, thin teal path, and final `THANK YOU` receipt.
- truthfulness: Restates inspectable decision support, not machine decision-making.
- constraint: No portrait reuse, CTA button, URL, conversion ask, or new product claim.
- first_motion: Evidence path draws into the wordmark; the completed lockup holds through the last five seconds.

## Timestamp and duration audit

| Frames | Window | Seconds | Frames at 30 fps | Result |
|---|---:|---:|---:|---|
| 01 | 00:00–00:20 | 20 | 600 | Opening identity |
| 02–03 | 00:20–01:05 | 45 | 1,350 | Problem / Objectives |
| 04–06 | 01:05–02:05 | 60 | 1,800 | Proposed Solution |
| 07–09 | 02:05–03:15 | 70 | 2,100 | Technical Approach / Design |
| 10–16 | 03:15–06:52 | **217** | **6,510** | Functional Prototype Demonstration — exact 3:37 lock |
| 17–22 | 06:52–08:15 | 83 | 2,490 | Testing / Validation |
| 23–25 | 08:15–09:25 | 70 | 2,100 | Industry Value / Future Potential |
| 26 | 09:25–09:40 | 15 | 450 | Close |
| **Total** | **00:00–09:40** | **580** | **17,400** | **PASS** |

Frame duration arithmetic:

`20 + 22 + 23 + 18 + 25 + 17 + 26 + 28 + 16 + 13 + 22 + 28 + 27 + 40 + 55 + 32 + 3 + 24 + 20 + 19 + 12 + 5 + 32 + 15 + 23 + 15 = 580 seconds`.

Demo arithmetic:

`13 + 22 + 28 + 27 + 40 + 55 + 32 = 217 seconds = 3:37`, beginning at second 195
and ending at second 412.

## Judging-criteria coverage check

| Criterion | Weight | Storyboard proof | Result |
|---|---:|---|---|
| Industrial problem-solving value | 25% | Frames 02–06, 11–16, 23–24 | PASS — sequencing problem, evidence-first route, conditional scenarios, Blueprint, consent. |
| AI innovation and technical implementation | 25% | Frames 06–09, 15, 22 | PASS — deterministic ownership, provenance, five bounded lenses, fallback, optional Gateway, no-current-RAG limit. |
| Industry impact and feasibility | 20% | Frames 13–16, 18–25 | PASS — capability sequencing, exact ranges, release evidence, handoff boundary, restrained future path. |
| UX and solution design | 15% | Frames 04–06, 10–16 | PASS — five-stage route, fiction/evidence labels, scores, comparison, indexed Blueprint, unchecked consent. |
| Presentation and demonstration | 15% | Frames 01, 10–22, 24–26 | PASS — identified creator, exact 3:37 demo, scoped validation, honest limits, value-led close. |

## Prohibited-claim and privacy check

| Check | Frames | Result |
|---|---|---|
| No current Document RAG / arbitrary ingestion | 09, 25 | PASS — explicitly not implemented; future/deferred P1 only. |
| No catalogue quote, availability, or vendor guarantee | 13, 24 | PASS — catalogue is provenance; boundaries repeated. |
| No ROI prediction or guarantee | 14, 23–24 | PASS — conditional ranges, negative values retained, no outcome promise. |
| No real customer/contact data or completed handoff | 10, 16, 19 | PASS — fictional/synthetic labels; empty fields; unchecked consent; no submission. |
| No human consultant acceptance | 15 | PASS — notes empty; no acceptance claimed. |
| No automatic CRM creation | 16, 24 | PASS — explicitly disclaimed. |
| No credentials, raw prompts/reasoning, private report URL | 07–08, 15, 19, 22 | PASS — excluded from visuals and copy. |
| Portrait only on opening identity card | 01, 26 | PASS — portrait appears only in Frame 01 and is explicitly absent from close. |
