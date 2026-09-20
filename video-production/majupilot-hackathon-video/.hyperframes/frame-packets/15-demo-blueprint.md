# Frame packet: 15-demo-blueprint

## Project inputs

- Project: C:\Users\Dv\.codex\worktrees\a634\MajuPilot\video-production\majupilot-hackathon-video
- Design truth: C:\Users\Dv\.codex\worktrees\a634\MajuPilot\video-production\majupilot-hackathon-video\frame.md
- RULES_DIR: C:\Users\Dv\.agents\skills\hyperframes-animation\rules

## Assigned storyboard block

## Frame 15 — Live demo: the source-linked Blueprint

- status: built
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

## Selected blueprint: transcript-scroll-artifact-reveal

# transcript-scroll-artifact-reveal — Transcript-Scroll Artifact Reveal

**intent**: The frame travels vertically along ONE long content surface — an agent transcript, a running task feed, an analysis document, a story draft — rendered full-bleed on a flat canvas (no device frame, no held mockup), by camera pan or element scroll; the traversal itself is the story ("look how much work happened / how much is here"), until ONE focal interaction — a file-chip click, a quote highlight, a collapsible-row expand — pivots the shot into an artifact/detail reveal: the deliverable behind the work.

**roles served**

- Key_Feature (modes: `pan-to-workspace` · `feed-rush` · `document-to-artifact` · `selection-pivot`): the x-viral AI-product grammar for "the agent did a lot of work → here's the deliverable." The long surface is the EVIDENCE (tool pills, checked progress items, task rows, headings, comps tables, story paragraphs), read at traversal pace; the artifact is the PAYOFF (full workspace with live mockup, spreadsheet with highlighted cells, inline ask-panel, sub-task stack). Reach for it when the feature's proof is the volume/depth of generated work and the beat should cash that in on one interaction — not a held device tour (`device-surface-showcase`), not a cursor-chased workflow (`cursor-ui-demo`).

**duration**: 5–11.8s (feed-rush 5.4s · pan-to-workspace 5.0s · selection-pivot 9.3s · document-to-artifact 11.75s)

**shot structure** One `[long content surface: agent chat transcript / task feed / analysis document / story doc]` sits full-bleed on a `[flat light canvas]` (goldens: warm off-white / cream / beige / plain white — the surface's own background IS the scene background); dark text with small `[accent]` marks (green verb highlights, model-tag pills, check circles, yellow cells). Three acts: TRAVERSE → HINGE → ARTIFACT. Camera discipline is the signature: at most TWO real camera moves in the whole shot, bracketing the hinge; everything else is element motion on a static frame.

- **Scene 1 (0.0–~40–60% of runtime) — establish + vertical traversal (the evidence).** The surface establishes with one small opener — a `[title]` types on / a centered `[title]` shrinks ~50% and glides to the top-left to dock as a fixed header / the frame opens tight on the `[chat panel]` — then the traversal begins: the frame travels DOWN the content (or the content streams UP through the frame), revealing progressive work in reading order: `[prompt → tool pills → checked progress items → typed summary]`, `[tagged task rows → muted tasks → checklist block]`, `[heading → paragraph → comps table → bullets]`, `[title → story paragraphs → dialogue]`. New rows may cascade in (staggered arrival) before the scroll takes over; a typed line may finish under the moving frame. Traversal texture varies by member: one continuous slow pan, a fast continuous feed rush, stepped scrolls decelerating at each stop (speed-blur between stops, content fading at frame edges), or one smooth scroll easing to a stop.
- **Scene 2 (~1–2s) — the hinge: ONE focal interaction.** The traversal settles and a single interaction pivots the shot: a `[file-attachment chip]` spring-pops in below a typed handoff line and a cursor glides in and CLICKS it; a `[sentence/quote]` gets a selection-highlight sweep and a `[tooltip pill]` spring-pops above it for the click; a `[collapsible row]` reaches the frame center and EXPANDS; or the typed `[verifier summary]` completes as the implicit trigger. This is the only interaction in the shot — the cursor (if any) appears here for the first time.
- **Scene 3 (rest) — artifact reveal + hold.** The hinge cashes in, choosing ONE reveal mechanic: a fast smoothly-DECELERATING zoom-OUT re-frames the whole `[workspace]` (the panel just traversed becomes a sidebar beside a `[live mockup]` and `[tool panel]`); an `[artifact window: spreadsheet]` scales up from small toward full frame, then a slow push-in + lateral pan settles on its `[highlighted cells]`; an `[inline panel]` expands below the highlighted line and a `[follow-up question]` types into it; or the row unfolds into a `[sub-task stack]` and the scroll settles on `[narration text]`. Optional coda: one cursor click instantly swaps a `[screen]` inside the revealed artifact (e.g. a phone tab click). Frame locks; element motion only to the end.

- Variant — _pan-to-workspace_ (001_claudeai, 5.0s): traversal is a REAL camera pan — opens tight on the chat panel, one single uninterrupted downward glide (never cutting away) over pills → checked list → typing verifier summary; hinge is the summary completing; reveal is ONE rapid decelerating zoom-out to the three-part workspace (chat-as-sidebar / phone mockup / tweaks panel); coda cursor click swaps the phone screen instantly. Exactly two camera moves total.
- Variant — _feed-rush_ (010_perplexity A, 5.4s): NO camera at all — title docks to header, five tagged rows cascade in, then a fast continuous upward ELEMENT scroll races through muted tasks and a checklist to a collapsible row; hinge is the row itself; reveal is the row expanding into a six-item sub-task stack, settling on narration. Cursorless.
- Variant — _document-to-artifact_ (010_perplexity B, 11.75s): traversal is a stepped ELEMENT scroll (static frame) — the document climbs in fast steps, decelerating at each stop, blur/fade between stops, clearing to blank canvas; hinge is a typed handoff line + file-chip pop + cursor click; reveal is the spreadsheet window scaling up then one slow continuous push-in + rightward pan onto the yellow-highlighted forecast columns.
- Variant — _selection-pivot_ (014_OpenAI, 9.3s): typed headline → document builds (bubble prompt + typed title + populating paragraphs) → one smooth upward element scroll eases to a stop; hinge is the selection-highlight sweep + the shot's ONE push-in framing the sentence + tooltip-pill click; reveal is the inline panel expanding below the line with the referenced quote and a rapidly-typed follow-up question. Camera locked at the pushed-in zoom to the end.

**motion vocabulary** continuous slow downward camera pan; fast continuous upward feed scroll; stepped document scroll decelerating at each stop; smooth scroll easing to a stop; speed-blur between scroll stops; content fade at frame edges; centered title shrinks ~50% and glides to a top-left header dock; task rows cascade in staggered; typed line / typed title / typed follow-up question (caret); green leading-verb highlights and model-tag pills riding past; checked-item strikethroughs riding past; file-attachment chip spring pop-in; tooltip pill spring pop; chat-bubble arrival; cursor glide-in + click; selection-highlight sweep across a sentence; ONE camera push-in onto the selection; fast decelerating zoom-out to the full workspace; artifact window scales up from small; slow push-in + lateral pan settling on highlighted cells; collapsible row expands into a sub-task stack; inline panel expands below the line; phone-screen instant swap on a coda tab click; frame-lock hold.

**rule mapping**

- vertical traversal by ELEMENT scroll — fast feed rush / stepped document scroll / smooth scroll-to-stop → `3d-page-scroll` (flat variant: tilt ≈ 0 — the surface's content `translateY`-scrolls to sections; the multi-phase scroll variant covers stepped stops; keep ONE ease family across all steps — `power3.out`/`power4.out` for UI-scroll feel)
- vertical traversal by CAMERA pan (transcript glide) → `viewport-change` (pan mode — the world translates up under a static frame; one continuous tween, no cuts)
- speed-blur between stepped-scroll stops → `motion-blur-streak` (blur peaks at max scroll velocity, resolves to 0 at each settle)
- which content each traversal beat reveals (stop-by-stop sequencing) → `dynamic-content-sequencing`
- centered title shrinks and glides to dock as a fixed header → `gsap-effects` (one simultaneous scale + translate tween; plain two-property move, no named rule required)
- task rows cascade in staggered before the scroll takes over → `waterfall-entry` (arrival cascade; goldens use fade + slide-up — the house rule prescribes binary-opacity whip-in, adopt the house form) or `spring-pop-entrance` (staggered group) for card-like rows
- typed lines — verifier summary, handoff line, document title, follow-up question, opening headline → `discrete-text-sequence` (+ `context-sensitive-cursor` for the trailing caret)
- file-attachment chip pop-in / tooltip pill pop / chat-bubble arrival → `spring-pop-entrance`
- cursor glides in, lands, clicks (hinge and coda) → `cursor-click-ripple` (+ `physics-press-reaction` to compress cursor and target together on the press)
- selection-highlight sweep across the sentence → `css-marker-patterns` (highlight sweep)
- ONE push-in onto the highlighted selection / slow push-in + lateral pan settling on highlighted cells → `coordinate-target-zoom` (measured off-center target — the lateral pan IS the counter-translate component), sequenced under `multi-phase-camera` when it follows the window scale-up
- fast decelerating zoom-OUT to the full workspace → `coordinate-target-zoom` (zoom-out variation: open at the zoomed-in framing, pull to scale 1 with `power3.out`/`power4.out`) or `viewport-change` (single continuous pull on the `cam` object)
- artifact window scales up from small toward full frame on the click → `spring-pop-entrance` (hero arrival scale-up; tune overshoot to ~0 / `power3.out` so the window reads weighty, not bouncy)
- collapsible row expands into a sub-task stack / inline panel expands below the highlighted line → `anchored-layout-expand` (in-flow accordion growth pushing subsequent content DOWN — never tween width/height) + `waterfall-entry` (or `spring-pop-entrance` stagger) on the arriving children
- phone-screen instant swap on the coda tab click → `discrete-text-sequence` (discrete whole-state swap; instant, no in-artifact camera move)
- green verb highlights, model-tag pills, check-circle strikethroughs, yellow forecast cells, edge fade masks → static styling of the surface content — no motion rule needed

**camera modifier**: The blueprint's camera law: **at most TWO real camera moves, bracketing the hinge** — the goldens are emphatic (their briefs carry CRITICAL camera notes). Pick the traversal mechanic first: camera pan (`viewport-change` pan — pan-to-workspace only) OR element scroll (`3d-page-scroll` flat — all others); never both at once. The reveal then spends the second (or only) move: one zoom-OUT to the workspace or one push-IN to the detail (`coordinate-target-zoom`, phases sequenced by `multi-phase-camera`), after which the frame LOCKS — all remaining motion is element-level (typing, expand, screen swap). The feed-rush variant spends zero camera moves: the whole shot is element scroll + expand. This restraint is what separates the shape from `cursor-ui-demo` (camera servos to every interaction) and from `device-surface-showcase` (a showcase camera presenting a held hero).

**Overflow (scrolled/panned surfaces — required for a clean `check`):** the traversal deliberately moves content past the frame edges. Clip at the scene (`overflow: hidden`) AND mark the moving inner layer (the `.page-content` / `.world` wrapper carrying the transcript/feed/document) with `data-layout-allow-overflow` — otherwise `check` reports `text_box_overflow` / `container_overflow` for every row that has scrolled off. The clip handles it visually; the attribute tells the layout audit it's intentional.

## Selected motion rule: svg-path-draw

---
name: svg-path-draw
description: Animate SVG paths drawing progressively using stroke-dasharray and stroke-dashoffset.
metadata:
  tags: svg, stroke, draw, path, reveal, icon, vector
---

# SVG Path Draw

Reveals an SVG shape by animating its stroke as if a pen were tracing it. Two stroke properties together: **`stroke-dasharray = <pathLength>`** makes the entire path one dash; **`stroke-dashoffset`** starts at the path length (dash shifted fully out of view → invisible) and tweens to `0` (fully drawn). The length comes from the DOM API `path.getTotalLength()` — measured, never guessed.

Works on anything with a stroke: `<path>`, `<circle>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>`, `<ellipse>`.

## Recipe

```html
<!-- inside a standard scene clip -->
<svg class="logo-mark" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path id="bar-left" d="M 60 40 L 60 160" />
  <path id="bar-right" d="M 140 40 L 140 160" />
  <path id="bar-mid" d="M 60 100 L 140 100" />
</svg>
```

```css
.logo-mark path {
  fill: none; /* outline-only draw — a fill would appear immediately and ruin the reveal */
  stroke: {accentColor};
  stroke-width: 12;
  stroke-linecap: round; /* softer endpoints */
  stroke-linejoin: round;
}
```

```js
// Setup: measure each path and set its dash pattern. Real measured geometry, not a magic number.
document.querySelectorAll(".logo-mark path").forEach((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = `${len}`;
  p.style.strokeDashoffset = `${len}`;
});

// Stagger draws so the eye reads continuous motion — each segment starts at
// ~70-80% of the previous segment's duration, before it finishes.
tl.to(
  "#bar-left",
  { strokeDashoffset: 0, duration: SEGMENT_DRAW_DUR, ease: "power2.out" },
  SEG_1_START,
);
tl.to(
  "#bar-right",
  { strokeDashoffset: 0, duration: SEGMENT_DRAW_DUR, ease: "power2.out" },
  SEG_2_START,
);
tl.to(
  "#bar-mid",
  { strokeDashoffset: 0, duration: FINAL_SEGMENT_DUR, ease: "power2.out" },
  SEG_3_START,
);

// Companion wordmark fades in only after the last stroke settles.
tl.to(
  ".brand-line",
  { opacity: 1, duration: BRAND_FADE_DUR, ease: "power1.out" },
  BRAND_FADE_START,
);
```

## Variations

- **Ring starting at 12 o'clock** — `<circle>` / `<rect>` strokes start at 3 o'clock by default; rotate the element `-90deg` so a progress ring draws from the top:

```html
<circle
  cx="100"
  cy="100"
  r="60"
  id="ring"
  style="transform-origin: 100px 100px; transform: rotate(-90deg)"
/>
```

- **Linear (constant-speed) draw** — `ease: "none"` for a steady-rate "real pen" trace.
- **Draw then fill** — for filled shapes, tween `fillOpacity: 0 → 1` AFTER the stroke completes (requires `fill-opacity: 0` initially and a real `fill` in CSS):

```js
tl.to(
  "#path",
  { strokeDashoffset: 0, duration: SEGMENT_DRAW_DUR, ease: "power2.out" },
  SEG_1_START,
);
tl.to(
  "#path",
  { fillOpacity: 1, duration: FILL_FADE_DUR, ease: "power1.out" },
  SEG_1_START + SEGMENT_DRAW_DUR,
);
```

## Values

| token             | range                                   | notes                                                                                              |
| ----------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| SEGMENT_DRAW_DUR  | 0.3–0.8s                                | fast snap vs deliberate pen trace; >~1s feels sluggish for a logo reveal                           |
| FINAL_SEGMENT_DUR | 60–80% of SEGMENT_DRAW_DUR              | proportional to segment length — a short connector at full duration reads slower than its siblings |
| SEG_N_START       | previous start + 70–80% of its duration | reads as continuous motion, not N isolated animations                                              |
| SEG_1_START       | 0–0.4s                                  | a small ~0.2s lead-in lets the viewer settle before motion                                         |
| BRAND_FADE_START  | ≥ last stroke end (+ ~0.2s beat)        | earlier and the wordmark competes with the draw                                                    |
| BRAND_FADE_DUR    | 0.3–0.8s                                | snap (urgent) vs glide (premium)                                                                   |

Ease families are discrete choices: **stroke draws** use `power2.out` (a hand lifting at end of stroke) or `none` for constant speed — never `back.out` / `elastic.out` (pens don't bounce). **Fades** use `power1.out`.

## Critical Constraints

- **`fill: none`** for outline-only draws — otherwise the fill appears immediately.
- **Dasharray/dashoffset = the measured `getTotalLength()`**, set at setup; requires the SVG in the DOM (inline SVG is fine; a loaded `<image>` SVG is not).
- **Complex paths**: if `getTotalLength()` looks wrong, overestimate slightly (`len * 1.05`) — too large is invisible at animation start; too small clips the end.
- **Stagger multi-path draws at ~70–80%** of the previous segment's duration.
- **A drawn line must land on something.** When the path is a connector (rail, beam, underline, callout) rather than a shape, both endpoints must sit on real elements and the draw must do a job — reveal, route, validate, or emphasize. A stroke that only decorates empty space reads as filler; attach it or cut it.

## See also

`svg-icon-enrichment` (internal parts animate after the outline draws) · `counting-dynamic-scale` (stroke draws an icon while a number counts up) · `hacker-flip-3d` (logo draws, wordmark decodes beneath).

## Selected motion rule: depth-of-field-blur

---
name: depth-of-field-blur
description: Selective-focus rack-focus — pull the eye to a focal element by GSAP-tweening filter blur (+ a small opacity dim) on the off-focus layers while the focal one stays sharp. Drive blur via a `--dof` CSS var; finite tweens, no CSS transition, deterministic. Covers single focal pull, rack-focus between two depth planes, and blur-the-cluster-while-pushing-in.
metadata:
  tags: blur, focus, depth-of-field, dof, rack-focus, filter, dim, spotlight, cinematic, push-in
---

# Depth-of-Field Blur (Selective Focus / Rack Focus)

Pulls the eye to one focal element by **blurring** (and slightly **dimming**) everything around it while the focal layer stays sharp — the camera's depth-of-field falling off the background, or a rack-focus shifting which plane is in focus. `filter` and `opacity` are paint-only, so both tween seek-safe. This is the backing rule for the focus-falloff beat the blueprints reach for: outer nodes blurring during a push-in (`constellation-hub`), rack-focus across a parallax card stack (`cursor-ui-demo`), non-highlighted cards dimming to spotlight a hero metric (`dataviz-countup`).

## How It Works

Every layer carries a `--dof` custom property (px of blur), read by `filter: blur(var(--dof))`, plus its own `opacity`. A GSAP tween advances each layer's `--dof` from `0` to its target blur and its opacity from `1` to a dim level over the focus-shift window. The focal layer's `--dof` stays `0`. Per-layer targets derive from `data-depth` / index, so the falloff is identical on every seek.

Three mechanics, same primitive:

1. **Focal pull** — one window: off-focus layers go sharp(0) → blurred while the focal layer holds at 0. The eye is pulled to the only thing still crisp.
2. **Rack focus** — two adjacent windows on the same property: plane A's blur ramps 0 → max at the same position plane B's ramps max → 0. State continuity matters exactly as in `press-release-spring`: A's resting blur after the rack must equal what B held before it — author both as tweens on the same `--dof` at the same position so the hand-off is seamless.
3. **Blur-the-cluster-while-pushing-in** — the DoF tween runs at the SAME timeline position as a camera push-in (`multi-phase-camera` / `coordinate-target-zoom`): "the world recedes" and "we push in" read as one move.

## Recipe

```html
<div class="world" id="world">
  <!-- Focal layer — stays sharp -->
  <div class="layer focal" id="focal">{FocalLabel}</div>
  <!-- Off-focus layers — blur + dim; data-depth orders near→far -->
  <div class="layer ctx" data-depth="1">{Context A}</div>
  <div class="layer ctx" data-depth="2">{Context B}</div>
  <div class="layer ctx" data-depth="3">{Context C}</div>
</div>
```

```css
.world {
  /* single wrapper so a concurrent camera push-in transforms everything
     together; DoF is independent of the camera */
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
}
.layer {
  --dof: 0px; /* px of blur; filter reads it — starts sharp */
  filter: blur(var(--dof));
  will-change: filter; /* promotes the layer so per-frame re-rasterization is cheap */
}
.focal {
  z-index: 2; /* sharp layer must sit ABOVE the blurred ones, or its crisp
     edges read as bleeding into the haze */
}
.ctx {
  z-index: 1;
}
```

```js
// Mechanic 1 — FOCAL PULL. Blur scales with data-depth so far planes blur
// more than near ones; the focal layer (--dof: 0, opacity: 1) is untouched.
gsap.utils.toArray(".ctx").forEach((el) => {
  const depth = Number(el.dataset.depth) || 1;
  tl.to(
    el,
    {
      "--dof": `${BLUR_PER_DEPTH * depth}px`,
      opacity: DIM_LEVEL, // dim, not gone
      duration: FOCUS_DUR,
      ease: "power2.inOut",
    },
    FOCUS_START,
  );
});
```

## Variations

- **Rack focus between two depth planes** — `gsap.set` plane B pre-blurred BEFORE the rack (no pop), then two tweens sharing `RACK_START` + `RACK_DUR`: A → `MAX_BLUR` + `DIM_LEVEL`, B → `0px` + `1`. Shared window makes them cross at the midpoint.
- **Blur the cluster while pushing in** — run the focal-pull tweens at the same position + duration as a camera tween on `#world` (`scale/x/y`, `power2.inOut`). Camera transforms the world; DoF tweens the layers — independent property channels, no conflict.
- **Spotlight a hero metric in a card grid** — `gsap.utils.toArray(".card:not(.hero)")` all defocus (`GRID_BLUR` + `DIM_LEVEL`) on one shared window; heroes are skipped.
- **Refocus / settle** — if the beat resolves back to "everything visible" (or hands off to a crossfade needing a clean outgoing frame), ramp all `--dof` back to `0px` / opacity 1 over the tail (`REFOCUS_START + REFOCUS_DUR ≤ DURATION`).
- **Bounded focus-breathing on the focal layer (optional)** — a finite `ease:"none"` driver writes `Math.max(0, Math.sin(p)) * FOCAL_BREATH_PX` into the focal `--dof` during a hold. Keep it ≤ ~0.6px or it reads as "still focusing"; default to omitting it.

## Values

| token                 | range                                  | notes                                                                                                    |
| --------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| BLUR_PER_DEPTH        | 3–6 px per depth step                  | a 3-plane stack tops out ~9–18 px; low = gentle DoF, high = tilt-shift falloff                           |
| MAX_BLUR              | 8 soft → 16 default → 24 heavy px      | terminal blur for a fully-defocused plane; above ~24 px on a big surface, shrink/group the layer instead |
| GRID_BLUR             | 6–12 px                                | pushes cards back without losing the grid's shape                                                        |
| DIM_LEVEL             | 0.4 strong → 0.55 default → 0.7 subtle | rarely below 0.35 — fully dark reads as "removed," not "defocused"                                       |
| FOCUS_DUR             | 0.5–1.2 s                              | a rack/pull is a deliberate move, not a snap; shorter = snap focus, longer = languid                     |
| RACK_START / RACK_DUR | shared by both planes                  | `gsap.set` the pre-blurred plane BEFORE `RACK_START`                                                     |
| FOCAL_BREATH_PX       | ≤ 0.6 px, period 2–3 s                 | barely-there nicety                                                                                      |
| FOCAL vs CTX sizing   | context smaller / grouped              | small context layers let a modest radius still read as "out of focus" — and blur cheaply                 |

Tokens: dark `{bgGradient}` so the sharp focal layer reads as lit and forward; heavy display `{font}` weight — blurred copy needs it to stay shape-legible.

## Critical Constraints

- **Tween the `--dof` variable on the timeline** — reading `filter: blur(var(--dof))` keeps the blur on the HF seek clock.
- **Blur the SMALL / GROUPED layers, not the giant one.** Filter cost scales with radius × pixel area; a 20 px blur on a full-frame background is the worst case. Keep per-layer radius ≤ ~24 px on large surfaces and lean on the `opacity` **dim** to do the push-back work — dim + modest blur reads more like real DoF than blur cranked to the max.
- **`will-change: filter`** on every layer whose blur animates (drop it after settle if the layer also does heavy transform work).
- **Focal layer stays genuinely sharp** — `--dof: 0`, untouched (or breathing ≤ 0.6 px). Any visible blur on the focal element kills the "this is the thing" read.
- **State continuity on a rack** — the outgoing plane starts at the blur the incoming plane was holding, and vice-versa; adjacent tweens on the same `--dof` at the same position.
- **DoF is independent of the camera** — blur the layers, transform `.world` for the push-in; don't fake DoF with the camera transform or vice-versa.
- **Settle sharp before a hand-off** — refocus to `--dof: 0` in the tail if the next beat is a crossfade/push; handing off mid-defocus reads as "the render glitched."
- **Sharp focal layer above blurred layers** (`z-index`).

## See also

[multi-phase-camera.md](multi-phase-camera.md) (the push-in this rule's falloff accompanies) · [coordinate-target-zoom.md](coordinate-target-zoom.md) (zoom onto the focal core — the `constellation-hub` hook) · [viewport-change.md](viewport-change.md) (pan + rack across a tilted card plane) · [counting-dynamic-scale.md](counting-dynamic-scale.md) (hero metric counts up sharp — the `dataviz-countup` spotlight) · [3d-page-scroll.md](3d-page-scroll.md) (the parallax stack to rack between) · [sine-wave-loop.md](sine-wave-loop.md) (post-rack idle; keep both amplitudes tiny).

## Selected motion rule: viewport-change

---
name: viewport-change
description: Virtual camera — simulate zoom / pan / focus-lock by transforming a wrapper around all scene content. Camera moves right → world translates left.
metadata:
  tags: viewport, camera, zoom, pan, focus-lock, virtual-camera
---

# Viewport Change (Virtual Camera)

Simulates camera effects (zoom / pan / focus-lock on a moving element) by transforming a wrapper around ALL scene content. The "world" moves opposite to the perceived camera. Distinct from [multi-phase-camera](multi-phase-camera.md) (2-3 discrete phases + drift) — viewport-change is a single continuous zoom/pan, often used for focus-lock following a moving element.

## How It Works

Camera intent → world transform. Camera **pans right** → world `translateX(-distance)`; camera **zooms in** → world `scale(>1)`; camera **follows element X** → world `translateX(viewportCenter - elementWorldX)` per-frame. Get the sign right or everything moves the wrong way. The single `.world` wrapper holds the camera transform; elements inside are positioned in world space, unchanged.

**Single-element composite transform (this rule's form).** Both scale and translate live on ONE wrapper as `translate(x, y) scale(S)`. CSS applies scale FIRST, then translate (right-to-left matrix composition), so a point at world offset `(ox, oy)` lands on screen at `(S × ox + x, S × oy + y)`. To map the target to viewport center, solve `S × offset + T = 0`:

```
T = -offset × S
```

This is **different from [coordinate-target-zoom](coordinate-target-zoom.md)**, which uses two nested wrappers (outer scales, inner translates) and derives `T = -offset` (independent of S). Mixing up the two forms drifts the target off-center as scale changes. Use this single-wrapper form when you want one source of truth for camera state (`cam.scale`, `cam.x`, `cam.y`) written via `onUpdate`; use nested wrappers when scale and translate can tween independently with shared ease.

## Recipe

```html
<div class="world" id="world">
  <div class="content">
    <div class="hero">{Brand}</div>
    <div class="tagline">{tagline}</div>
    <div class="cta" id="cta">{ctaUrl}</div>
  </div>
</div>
```

```css
.scene {
  overflow: hidden; /* REQUIRED — any non-1.0 scale reveals edges or pushes content off-frame */
  background: {bgGradient}; /* on .scene, NOT .world — a world-borne background warps with the camera */
}
.world {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform-origin: 50% 50%; /* centered scaling is what the math assumes */
  will-change: transform;
}
```

```js
const world = document.getElementById("world");

// Camera state — single source of truth. The world transform is composed from
// this object in ONE place so the transform string order is stable.
const cam = { scale: 1, x: 0, y: 0 };
function applyCamera() {
  world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`;
}
applyCamera(); // seed frame 0

// Zoom in on the CTA: single-element composite transform → T = -offset × S.
// TARGET_OFFSET_Y is the target's measured offset from viewport center at
// neutral camera (sign matters — positive = below center).
const counterY = -TARGET_OFFSET_Y * TARGET_SCALE;

tl.to(
  cam,
  {
    scale: TARGET_SCALE,
    y: counterY,
    duration: ZOOM_DUR,
    ease: "power3.inOut",
    onUpdate: applyCamera,
  },
  ZOOM_START,
);
```

## Scale Value Guide

| Effect      | Scale       | Feel                                |
| ----------- | ----------- | ----------------------------------- |
| Subtle      | 1.02 - 1.05 | Barely perceptible — "professional" |
| Medium      | 1.05 - 1.15 | "Ta-da" emphasis                    |
| Noticeable  | 1.15 - 1.30 | Focus on region                     |
| Dramatic    | 1.5 - 2.5   | Element fills screen                |
| Full-screen | 3.0+        | Element covers viewport             |

Perception: < 5% scale change is imperceptible; 10-15% is comfortable emphasis; > 30% is cinematic/dramatic. For a natural product feel, prefer 1.05-1.15× over 2-3s; save big > 1.3× zooms for dramatic narrative moments.

### Extreme range — 4–12× outward (workspace reveal)

The same single-cam math runs far past the table: a zoom-out workspace reveal opens punched-in at **4–12×** on one detail (a single cell, message, or button) and pulls out to the full workspace in one continuous move. The mechanics don't change — one `cam` object, `T = -offset × S`, one `applyCamera()` writer — only the authoring direction does:

- **Build the workspace at its final (1×) layout and OPEN scaled-in** (`cam.scale = 8`, counter-translate aiming the opening detail; state it in a `fromTo` / seed via `applyCamera()` so a seek to t=0 lands punched-in). The wide landing frame is then everything at native design size — text crisp, raster assets at source resolution.
- **Never the inverse** — authoring the close-up at 1× and scaling the world down to 0.08–0.25 for the wide frame drops every label below legible pixel size and softens raster media; the reveal lands on mush.
- **Measure the opening target** — at S = 8, a 1 px error in the baked offset is 8 px on screen at the opening pose. Take the offset from the target's real laid-out center (`getBoundingClientRect` after `fonts.ready`, once at setup — the measuring doctrine in [coordinate-target-zoom.md](coordinate-target-zoom.md)), never from a layout formula.
- **The opening detail must survive ×S** — it renders at `S ×` its design size on the first frames (vector/DOM text is safe; raster needs `sourceResolution ≥ rendered × S`).

## Variations

- **Focus-lock (camera follows a moving cursor/character)** — keep the element at a fixed screen X by computing the world offset per-frame inside the driver's `onUpdate`:

```js
const focusEl = document.querySelector(".moving-cursor");
const targetScreenX = VIEWPORT_WIDTH * FOCUS_SCREEN_X_FRAC; // 0.4–0.7; 0.5 = dead center
const focusUpdate = { p: 0 };
tl.to(
  focusUpdate,
  {
    p: 1,
    duration: FOLLOW_DUR, // matches how long the focused element is in motion
    ease: "power2.inOut",
    onUpdate: () => {
      const rect = focusEl.getBoundingClientRect();
      cam.x = targetScreenX - (rect.left + rect.width / 2);
      applyCamera();
    },
  },
  FOLLOW_START,
);
```

- **Composite scale (multi-phase)** — two proxy tweens multiplied through one writer: `cam.scale = scaleUp.v * scaleDown.v; applyCamera()`. Combine a slow push-in (~1.15) with a brief release (~0.9) for a breath/punch shape.
- **Camera mode transition (centered → follow)** — crossfade two camera modes via a 0→1 weight tween; intermediate frames interpolate between the modes' offsets.

## Values

| token           | range                                | notes                                                                                       |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| TARGET_OFFSET_Y | measured, not a free parameter       | target's offset from viewport center at neutral camera; measure via `getBoundingClientRect` |
| TARGET_SCALE    | 1.3× modest → 1.6–2.0× typical → 3×+ | raster media needs `sourceResolution ≥ rendered × TARGET_SCALE`                             |
| ZOOM_START      | content landed + ~0.5s scan time     | let the viewer read before the camera moves                                                 |
| ZOOM_DUR        | 1.0–2.0s                             | under 0.8s teleports, over 2.5s drags                                                       |
| DWELL           | ≥ 1.0s after the zoom settles        | the viewer must be able to read the focal point (climax dwell)                              |
| VIEWPORT_WIDTH  | = the root's `data-width`            | real value, not abstract                                                                    |

## Critical Constraints

- **One `.world` wrapper carries the whole camera** — every scene element lives inside it; a second transformed wrapper is a second camera.
- **Single source of truth via the `cam` object + `applyCamera()`** — when scale and translate both change, write them in ONE place; never split them across tweens that touch `world.style.transform` directly (the transform string composition order becomes unpredictable).
- **Single-wrapper counter-translate is `T = -offset × S`** — don't import the nested-wrapper `T = -offset` formula.
- **`overflow: hidden` on `.scene`**; **`transform-origin: 50% 50%` on `.world`**; **background on `.scene`, never on `.world`**.

## See also

[coordinate-target-zoom.md](coordinate-target-zoom.md) (nested-wrapper alternative, `T = -offset`) · [multi-phase-camera.md](multi-phase-camera.md) (viewport-change inside one phase) · [sine-wave-loop.md](sine-wave-loop.md) (idle micro-drift after the viewport settles).
