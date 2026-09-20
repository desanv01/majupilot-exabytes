# Frame packet: 16-demo-consent-boundary

## Project inputs

- Project: C:\Users\Dv\.codex\worktrees\a634\MajuPilot\video-production\majupilot-hackathon-video
- Design truth: C:\Users\Dv\.codex\worktrees\a634\MajuPilot\video-production\majupilot-hackathon-video\frame.md
- RULES_DIR: C:\Users\Dv\.agents\skills\hyperframes-animation\rules

## Assigned storyboard block

## Frame 16 — Live demo: consent is the boundary

- status: built
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

## Selected blueprint: cursor-ui-demo

# cursor-ui-demo — Cursor-Driven UI Demo

**intent**: A visible custom cursor drives a real (reconstructed) app UI through clicks / hovers / drags so the screen changes state shot-to-shot, while the camera chases each interaction — the product surface is the subject and the cursor is the actor.

**roles served**

- Product_Intro (from `product-intro-cursor-ui-demo`): first look at the product surface — the cursor sweeps/hovers to \_introduce\* the app and reveal what it is, landing on a hovered hero element or freshly-popped result. Light, exploratory; backdrop steps colors as it goes.
- Key_Feature (from `key-feature-cursor-ui-demo`): one specific multi-step workflow demonstrated \_end-to-end\* (edit / configure / select across 2–4 discrete beats), each beat a real edit the UI responds to live, landing locked on the primary action button or the produced result.
- Key_Feature (from `workflow-approve-press`): an agency / confirmation workflow framed by a cockpit of 3D-tilted flanks — a step list ticks pending → active → complete (a snap state machine, CSS responding to `[data-state]`), and a flank button takes the PRESS as the payoff (its color flips to success, a checkmark stamps). The click is the climax, not a passing gesture.
- Key_Feature (from `cursor-app-state-tour`): the static-stage STATE TOUR — the cursor drives a reconstructed app through 2–4 discrete feature states on a LOCKED frame; every scene change is a click-triggered element swap/scale (modal springs from center, side panel slides in from the right edge, settings hard-swap, table populates, node-graph builds), never a real camera move; optional `[title card]` Scene 0 in front and a `[brand end beat]` behind.
- Key_Feature (from `drag-field-onto-document`): the DRAG-DROP journey — one continuous zoom-breathing shot of a document workspace: the cursor drags a ghosted `[field chip]` from an inputs sidebar onto the page, drop-snaps it into a placed field, a modal/typing beat completes it, and the placed element is adjusted in close-up before the cursor heads to the `[Finish/CTA]`.
- Product_Intro: the low-event BROWSE — the cursor roams ONE clean page state and the filter controls answer with slight hover updates; no typed input, no title beats, and the shot may end mid-roam.
- Product_Intro (from `hover-inspect-run`): the HOVER-INSPECT run — a click SPAWNS a labeled `[toolbar]`, the camera zooms out from a tight crop to the full page, then the cursor sweeps `[page elements]` while a floating `[inspector panel]` TRACKS the cursor, outline-highlighting and content-snapping per hovered element. (The slice's three-beat dark title prelude, scenes 1–3, belongs to `titlecard-reveal`, not here.)
- Hook: the ambient MULTI-CURSOR canvas — several labeled `[teammate cursors]` work a design canvas simultaneously (grab-drag-drop of components between mockups, recolor/identity swaps on drop) while the canvas group translate-PANS within a static frame and a `[headline]` builds word-group by word-group over the demo; the live workshop itself is the hook. One continuous beat, no cuts, no camera.
- Benefits (from `ui-demo-text-interlude-ui-demo`): the demo|text|demo SANDWICH — two static-stage demo beats of this blueprint bridge through a full-screen kinetic/title interlude and back (cursor acts, UI answers, all "zoom" element scale); the interlude beat is `kinetic-type-beats` material, and the sandwich itself is sequencing above the single-shot unit.

**duration**: 4.0–12.9s (Key_Feature 4.0–12.9s — the mined state tours run long, 10.4–12.9s, and the drag-drop journeys 9.8–10.6s, against the original 4.0–7.3s set; Product_Intro 4.5–9.3s — the low-event browse sets the 4.5s floor; Hook ~6.5s; the Benefits demo|text|demo sandwich totals 11.6–12.8s with each demo half ~4–5s)

**shot structure** (a `[product UI surface]` — fixed app window, dashboard/editor, parallax `[content card]` stack, or a `[container object/icon]` — centered over `[bg color/gradient]`, shown `[flat]` or `[3D-isometric]`; a custom `[brand-colored cursor with icon]` is the protagonist and the camera servos to whatever it touches; UI responds _live_ and in sync with each cursor action. Two role-tuned tempos fold in — Product_Intro **sweeps to introduce**, Key_Feature **performs a workflow** — and the camera spans a spectrum: the full CHASE, one continuous zoom-breathe, or a fully LOCKED static stage where the UI itself does all the moving.)

- **Scene 1 (0.0–~Xs) — surface establishes + first touch.** The `[product UI surface]` arrives centered over `[bg color/gradient]` — either it is simply present (fixed window / dashboard / editor), a 3D-parallax stack of `[content cards]`, or a `[container object/icon]` that FLIES IN with a 3D tumble and settles. The custom `[cursor]` enters. The cursor performs the FIRST action on `[cursor target 1]` and the UI responds live in the same beat. Camera holds or begins a slow push-in toward the acted-on region.
  - _Variant — Product_Intro_: low-commitment first touch — cursor HOVERS/sweeps a control or SWEEP-HIGHLIGHTS a field to `[accent color]`, OR the `[container]` fans open. An optional label/title fades/morphs onto the surface. The point is to _show the surface exists_ and is touchable.
  - _Variant — Key_Feature_: a concrete edit — cursor DRAGS a scrollbar / TYPES into a field / DRAGS a handle, and the UI responds materially (`[scroll]` / value climbs / region resizes). If the surface opened in `[3D-isometric]`, it may snap perspective-FLAT here to read the workflow.
  - _Variant — Key_Feature (static-stage tour)_: an optional Scene 0 — `[title card / kinetic brand word]` on a flat field — hard-cuts or window-SCALES-UP into the surface; the `[app UI]` is fully present from the first frame and the cursor enters and glides to the first control. The camera is LOCKED from the start and stays locked.
  - _Variant — Hook (ambient multi-cursor)_: no single protagonist — several labeled `[teammate cursors]` are already at work across `[N mockups]` on a design canvas; the canvas group translate-PANS within the static frame while a `[headline]` builds word-group by word-group over the top. One continuous beat, no cuts.

- **Scene 2 (~Xs–~Ys) — camera chases to the next interaction (the engine).** The camera MOVES to the next target — push-in + pan / whip-pan / pan-down to `[cursor target k]` — and the cursor performs action k as the UI updates live. Each beat is a discrete interaction connected by a fast camera move; the surface's inner content SWAPS per interaction.
  - _Variant — Product_Intro_: navigation is exploratory — a slow camera pan + depth-of-field FOCUS-PULL across a parallax `[content card]` stack, or the `[container]` fanning into `[N option/content cards]` that SPRING to position. As content swaps, the supporting backdrop STEPS its color (`[bg step 1]` → step 2 → …). Typically one or two such moves.
  - _Variant — Key_Feature_: repeat for `[2–4 beats total]`, each a distinct operation the UI answers — counter COUNTS UP, `[pill/swatch]` SELECTS, a modal SLIDES UP and TYPES — connected by whip-pans / progressive zoom. The workflow visibly advances toward a result.
  - _Variant — Key_Feature (static-stage tour)_: the camera never moves — every beat is a click-triggered ELEMENT response: a modal SPRINGS/scales up from center, a `[side detail panel]` SLIDES in from the right edge (a second panel may slide over the first), hamburger→sidebar slide-open, a settings panel HARD-swaps its content, a dropdown fills, a `[table]` populates row-by-row, a formula types into a cell and the range populates on enter, a type-to-filter list live-collapses, a `[block]` pops into the canvas, a node-graph BUILDS (cards + connecting lines radiate from center), a hover drops a `[popover]` below a tag. Any "zoom" is element scale of the UI only.
  - _Variant — Key_Feature (drag-drop)_: the cursor GRABS a `[field chip]` from an `[inputs sidebar]`, drags a semi-transparent GHOST across the page, and drops it — it SNAPS into a placed field with bounding box + corner handles; a completion beat follows (a `[modal]` springs up over the dimmed document, a name types letter-by-letter while a live `[cursive preview]` builds per keystroke, confirm click). The whole clip rides one continuous zoom-BREATHING arc (slow zoom-out / gentle zoom-in / final zoom-out) instead of discrete camera beats.
  - _Variant — Product_Intro (hover-inspect)_: the cursor's first click SPAWNS a labeled `[toolbar]`, the camera zooms OUT from a tight crop to the full page, then the cursor sweeps `[page elements]` — each hovered element gets an outline and a floating `[inspector panel]` TRACKS the cursor, its content snapping per element.

- **Scene 3 (~Ys–end) — payoff state, camera settles, HOLD.** The cursor lands on its final target and the screen reaches the payoff state; the camera comes to rest (static) and holds.
  - _Variant — Product_Intro_: the cursor HOVERS the hero element — a `[content card]` SCALES UP on hover, a node gets an `[Available]`-style pill, or a `[result card]` POPS/springs in — the "here's the product" payoff. Settles static, holds.
  - _Variant — Key_Feature_: locked close-up on the OUTCOME — cursor lands on the `[primary action button: Export / Save / Reimburse]` and a `[hover backdrop / highlight]` SPRING-pops in (the climax is the action button / produced result). Holds.
  - _Variant — Key_Feature (static-stage tour)_: optional detachable end beat — `[brand text beat / icon-ring lockup / end stat card]` — or the cursor simply comes to REST on the next target and holds (006_claudeai ends with the cursor on a panel's close X, the panel never closing).
  - _Variant — Key_Feature (drag-drop)_: close-up on the placed element ADJUSTED — a corner-handle drag proportionally resizes it — then the cursor sweeps toward the `[Finish / CTA]` as the clip ends.
  - _Variant — browse / hover-inspect_: no payoff lock at all — the shot ends MID-demo, cursor still roaming (browse and hover-inspect modes).

**motion vocabulary**: cursor-driven click / hover / sweep-highlight / drag / type; per-interaction live UI response (scroll, value climb, region resize, content swap); camera push-in + pan / whip-pan / pan-down servoing to each target; coordinate zoom onto the acted region; press-and-ripple on a clicked control; button press-compress; screen-state swap shot-to-shot; card fan-out to corners (spring); 3D container fly-in & tumble-settle; perspective-flatten (3D→2D snap); paginated/stepped backdrop color advance; depth-of-field focus-pull across a parallax card stack; counter count-up; pill/swatch select; modal slide-up + typing; label/title morph between states; UI-keyword highlight glow; terminal hover-scale or result-card pop-in; spring hover-backdrop on the final action button; hard panel swap (no easing); side detail panel slide-in from the right edge (second panel over the first); hamburger→sidebar slide-open; hover popover drop below a tag; element-scale fake zoom (UI window scales in/out on click, camera locked); table populates row-by-row; formula typed into a cell + instant cell-range populate on enter; fill-handle drag auto-fill down rows; type-to-filter list live-collapse; dropdown fill on click; block/element pop-in to canvas; node-graph build (cards + connecting lines radiate from center); character-by-character auto-typing with blinking caret; window scale-up with settle; ghost-chip drag (grip dots + icon) across the page; drop-snap into a placed field with bounding box + corner handles + trash icon; modal spring-up over a dimming document; letter-by-letter typing with a live cursive preview building per keystroke; corner-handle drag with proportional resize; continuous zoom-breathing single shot (zoom-out / zoom-in / zoom-out arcs); cursor sweep toward the CTA at clip end; multiple labeled collaborative cursors moving independently; cursor grab-drag-drop of components between mockups; element recolor/identity swap on drop; canvas-group translate-pan within a static frame; headline building word-group by word-group over the demo; hover-triggered micro content/sidebar update; click spawns a labeled toolbar; floating inspector panel tracking the cursor with per-element content snap; per-element hover outline highlight; motion-blur window fly-in; tight-crop open then zoom-out to full page; brand icon-ring end beat; 3D end-card float on the hold.

**rule mapping**

- viewport follows the cursor / camera servos to whatever it touches (primary) → `camera-cursor-tracking`
- cursor moves to a target, presses, emits a ripple (the click itself — primary interaction primitive) → `cursor-click-ripple`
- screen-state swap shot-to-shot (surface inner content changes between beats) → `scale-swap-transition`
- camera push-in + pan / whip-pan / pan-down to the next target → `viewport-change` (pan/zoom across the UI)
- sequencing the chase into discrete interaction beats → `multi-phase-camera`
- zoom onto the specific acted-on UI region → `coordinate-target-zoom`
- cursor icon/state changing with context (e.g. pointer↔grab over a draggable handle) → `context-sensitive-cursor`
- which content appears per beat / step-by-step UI state progression / per-interaction swaps → `dynamic-content-sequencing`
- sweep-highlight a field, highlight a UI keyword to `[accent color]` → `asr-keyword-glow` (keyword glow on the touched element)
- clicked button compresses on press, springs back on release → `press-release-spring`
- cursor + button compress together on a heavier press → `physics-press-reaction`
- panel/card morphs between two states (e.g. card → expanded card, surface state A → B) → `card-morph-anchor`
- terminal hover-scale, `[result card]` pop-in, spring hover-backdrop on the final action button → `spring-pop-entrance`
- card fan-out to corners / option cards springing to position → `split-tilt-cards` (fan/spread into tilted positions) + `spring-pop-entrance` (the spring settle)
- 3D-parallax content-card stack as the surface; UI shown 3D-isometric → `3d-page-scroll` (UI as a tilted scrolling/parallax card)
- node gets an `[Available]`-style pill / tracked badge appears on an element → `ai-tracking-box`
- counter / value count-up as the UI responds → `counting-dynamic-scale`
- a result bar / number FILLS as the workflow's outcome → `stat-bars-and-fills`
- a live `[video]` screen-capture clip used as the surface → technique: video compositing
- perspective-flatten (3D-isometric → flat 2D snap) and the 3D-isometric tilt itself → technique: CSS-3D (no dedicated rule; the tilt/flatten transform is a CSS-3D primitive)
- camera settles static on the payoff and HOLDS → (settle phase of `spring-pop-entrance` on the payoff element; the static hold itself needs no rule)
- 3D container/object fly-in & tumble-settle → `depth-scatter-assemble` (free-tumbling 3D object/container entrance that flies in and tumble-settles; `orbit-3d-entry` only orbits a flat element into place)
- depth-of-field focus-pull across the parallax card stack → `depth-of-field-blur` (rack-focus / DoF blur transition between near and far cards; `3d-page-scroll` supplies the tilted parallax stack and `viewport-change` the pan)
- paginated/stepped backdrop color advance synced to interactions (`[bg step 1]`→step 2→…) → `discrete-text-sequence` (discrete state stepping, here applied to a background-color state rather than text)
- modal slide-up + in-modal typing as one combined beat → `card-morph-anchor` / `scale-swap-transition` (the panel slide-in) + `discrete-text-sequence` (the in-modal typed text)
- element-scale fake zoom — the UI window scales, camera locked (static-stage tour) → `coordinate-target-zoom` (applied to the surface wrapper rather than the world)
- side detail panel slide-in from the right edge / hamburger→sidebar slide-open / hover popover drop → `card-morph-anchor` / `scale-swap-transition` (the panel arrival) + `dynamic-content-sequencing` (which content each panel shows per beat)
- hard panel swap / in-panel content snapping through states / hover-triggered micro update / type-to-filter live-collapse / element identity swap on drop → `dynamic-content-sequencing`
- table populates row-by-row / fill-handle auto-fill cascading down rows / log rows cascade in → `waterfall-entry`
- formula typed into a cell / character-by-character auto-typing with blinking caret / letter-by-letter typed name → `discrete-text-sequence` + `context-sensitive-cursor` (the caret)
- node-graph build (cards + connecting lines radiate from center) → `center-outward-expansion` (the cards) + `svg-path-draw` (the connecting lines draw)
- click spawns a labeled toolbar / dropdown fills on click / drop-snap settle of the placed field / window scale-up with settle → `spring-pop-entrance`
- modal spring-up over a dimming document → `spring-pop-entrance` (the modal) + `depth-of-field-blur` (the document dim/blur beneath)
- ghost-chip drag-and-drop / cursor grab-drag of components between mockups / fill-handle drag / corner-handle resize drag → `cursor-drag` (`cursor-click-ripple` covers move+click only)
- floating inspector panel TRACKS the cursor, content snapping per element → `ai-tracking-box` (the per-frame follow mechanics, restyled as an inspector panel) + `dynamic-content-sequencing` (the per-element content)
- live cursive preview building per typed keystroke → `svg-path-draw` (progressive stroke reveal keyed to typing progress)
- continuous zoom-breathing single shot (drag-drop variant) → `multi-phase-camera` (pull-back / focus / push phases + micro-drift)
- motion-blur window fly-in / tight-crop open then zoom-out to full page → `motion-blur-streak` (the fly-in) + `viewport-change` (the zoom-out)
- multiple labeled collaborative cursors moving independently → `multi-cursor-choreography` (N labeled independent cursor actors; the single-actor cursor rules assume one)
- canvas-group translate-pan within a static frame → `viewport-change` (the `.world` translate realizes the pan; semantically the camera stays locked)
- headline builds word-group by word-group over the demo → `waterfall-entry`
- brand icon-ring end beat → `svg-path-draw` (the ring) + `spring-pop-entrance` (the lockup)
- 3D end-card float on the hold → `sine-wave-loop` — CAUTION: motion-doctrine bans idle wobble; prefer a settle-and-hold

**camera modifier**: The defining motion is the camera CHASE — the viewport follows the cursor from target to target via `camera-cursor-tracking` (primary), realized as concrete push-in + pan / whip-pan / pan-down moves under `viewport-change`, sequenced into discrete interaction beats by `multi-phase-camera`, with each beat's destination targeted via `coordinate-target-zoom` (zoom to the acted-on region). Product_Intro biases toward a slow, exploratory pan + focus-pull that sweeps the surface; Key_Feature biases toward snappier whip-pans / progressive zoom that march through the workflow and lock static on the action button. This camera-servo-to-cursor is what separates the blueprint from hands-off camera scrolls (dataviz-scroll-reveal) and static device/window tours. The golden set widens this into a spectrum. At one pole the **static-stage state tour** (now the largest member set) LOCKS the camera for the entire clip and lets the UI itself do all the moving — panel slide-ins, element-scale fake zooms, content snaps — with the cursor alone carrying the eye. The **drag-drop** variant replaces discrete chase beats with ONE continuous zoom-breathing arc under `multi-phase-camera`. The **hover-inspect** variant inverts the push-in: a tight-crop open zooms OUT to the full page before the cursor sweep. Pick the pole per brief — chase for workflow marches, locked stage for dense reconstructed dashboards, a single breathe for one-document journeys. With the locked pole absorbed, what separates this blueprint from `device-surface-showcase` is the CURSOR-as-actor, not the camera: a fully static tour still belongs here as long as a visible cursor drives every state change.

## Selected motion rule: cursor-click-ripple

---
name: cursor-click-ripple
description: Animated mouse cursor moves to target, clicks with scale depression and expanding ripple rings.
metadata:
  tags: cursor, click, ripple, interaction, mouse, button
---

# Cursor Click Ripple

An animated cursor moves to a target element, performs a click with visual depression, and emits expanding ripple rings from the click point. Three sequential phases on one timeline: **move** (eased translation to the target's center) → **click** (scale depression on cursor + target together, yoyo back) → **ripple** (1–3 staggered rings expand and fade from the click point). This is a _point event at one location_ — a sustained hold across space is [cursor-drag.md](cursor-drag.md).

## Recipe

```html
<button class="target-button">{ctaLabel}</button>
<div class="cursor"><!-- arrow SVG, positioned at the entry corner --></div>
<!-- Rings live in DOM from t=0 at the click-target CENTER, scale 0 + opacity 0 -->
<div class="ripple ripple-1"></div>
<div class="ripple ripple-2"></div>
<div class="ripple ripple-3"></div>
```

```css
.ripple {
  position: absolute;
  left: 50%;
  top: 50%; /* click-target center */
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid {rippleColor};
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  pointer-events: none;
}
```

```js
// Phase 1 — Move: eased, not linear
tl.to(".cursor", { x: TARGET_X, y: TARGET_Y, duration: MOVE_DUR, ease: MOVE_EASE }, 0);

// Phase 2 — Click: cursor + target depress together, then return
tl.to(
  ".cursor",
  { scale: CURSOR_PRESS_SCALE, duration: PRESS_DUR, ease: "power2.in", yoyo: true, repeat: 1 },
  CLICK_AT,
);
tl.to(
  ".target-button",
  { scale: TARGET_PRESS_SCALE, duration: PRESS_DUR, ease: "power2.in", yoyo: true, repeat: 1 },
  CLICK_AT,
);

// Phase 3 — Ripple burst, N rings staggered from the click point
tl.set([".ripple-1", ".ripple-2", ".ripple-3"], { opacity: 1 }, RIPPLE_AT);
tl.to(
  [".ripple-1", ".ripple-2", ".ripple-3"],
  {
    scale: RIPPLE_SCALE,
    opacity: 0,
    duration: RIPPLE_DUR,
    ease: RIPPLE_EASE,
    stagger: RIPPLE_STAGGER,
    immediateRender: false, // holds scale 0 / opacity 0 until the click moment
  },
  RIPPLE_AT,
);
```

## Variations

- **Single ring** — one `.ripple`, no stagger; more elegant when the rest of the scene is busy.
- **Keyframed attack-decay** — a `keyframes` block ramps opacity 0 → peak → 0 across the duration; a clearer "energy radiates and dissipates" envelope.
- **Multi-ring expanding pulse** — 3 rings at 0.08 s stagger when the click is the scene's climactic moment.

## Values

| token                       | range                       | notes                                                                                                                                  |
| --------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| MOVE_DUR                    | 0.4–1.0 s                   | short darts; long reads as a "considered click." Must end before CLICK_AT or it reads as a misclick                                    |
| MOVE_EASE                   | discrete choice             | `power2.inOut` calm · `power3.out` decisive · `back.out(1.2–1.4)` settles onto the button with a tiny recoil (higher reads cartoonish) |
| CLICK_AT                    | `MOVE_DUR + 0–0.3 s`        | zero pause reads as autopilot; >0.3 s reads as hesitation                                                                              |
| PRESS_DUR                   | 0.06–0.12 s (half; yoyo ×2) | short crisp, long mushy; must finish before the next phase needs normal scale                                                          |
| CURSOR / TARGET_PRESS_SCALE | 0.80–0.90 / 0.92–0.97       | cursor compresses MORE than the target — the cursor is the actor, the target the recipient                                             |
| RIPPLE_AT                   | `CLICK_AT + 0–0.08 s`       | simultaneous feels causal; slight delay feels acoustic                                                                                 |
| RIPPLE_DUR                  | 0.5–1.0 s                   | sharp ping vs soft sonar; must complete before anything that needs the ring gone                                                       |
| RIPPLE_SCALE                | 3–6                         | 3 stays near the click site; if the ring would exit the frame before fading, lower it                                                  |
| RIPPLE_STAGGER              | 0.06–0.12 s (or 0)          | below ~0.06 s reads as one thick ring; above ~0.12 s as separate events                                                                |
| RIPPLE_EASE                 | discrete choice             | `power2.out` standard ping · `power3.out` sharper attack · `expo.out` strong distant pulse                                             |
| TARGET_X / TARGET_Y         | layout-derived              | must match the target's visual centroid — a 4 px miss reads as missing the button                                                      |

Reference values: `../examples/cta-orbit-collapse.html` — 0.5 s move on `back.out(1.3)`, click +0.2 s, press 0.08 s at 0.85/0.95, single ring to 5× over 0.7 s `power2.out`.

## Critical Constraints

- **Move before click** — trigger the click only after the move tween settles; clicking mid-motion reads as unintentional.
- **Rings live in DOM from t=0** at the click-target center with `scale: 0` + `opacity: 0` — never conditionally rendered; `immediateRender: false` on the expand so they hold invisible until the trigger.
- **Ripple from the click point** — the button's visual center, not any element's bounding-box origin.
- **Synchronized depression** — cursor + target depress at the same position with the same duration, and both yoyo back.
- **Cursor above all content** (high z-index) for the whole sequence; `pointer-events: none` on cursor + ripples.

## See also

`orbit-3d-entry` (click as the pivot that collapses orbiters) · `center-outward-expansion` (click triggers an outward burst) · `press-release-spring` (stronger physical feel on the target) · `scale-swap-transition` (the button's post-click state change).

## Selected motion rule: sine-wave-loop

---
name: sine-wave-loop
description: Bounded sine-driven idle — subtle jitter or a single genuinely-needed bounded ambient breath on a held element. De-emphasized: circular breathing as "aliveness" is cheap; prefer sequential reveal timed to the VO, then subtle jitter, before reaching here.
metadata:
  tags: idle, jitter, bounded-ambient, sine, trigonometry, low-amplitude, post-entry
---

# Sine Wave Loop (subtle jitter / bounded ambient)

> **Reach for this last.** Per the motion doctrine (`references/motion-language.md`): circular breathing — scaling text/cards up and down to look "alive" — is cheap, the agent's reflexive cheat, and reads weak. "I'd rather have NO motion than BAD motion." First fill the back of a shot with **sequential reveal timed to the VO**; if a frame has genuinely settled and still needs life, the **sanctioned move is subtle jitter** — this rule at the LOW end of its amplitude range. A full breathing loop is the rare last resort on a single held hero, never stamped on every element.

Keeps a settled element from feeling dead using `Math.sin` on the timeline clock. Two forms:

- **Yoyo form** — one `sine.inOut` tween with `yoyo: true` and a **finite** `repeat` count. Preferred when the idle stands alone on a property nothing else touches.
- **onUpdate form** — one long `ease: "none"` tween drives a `phase` proxy `0 → 2π·CYCLES`; `onUpdate` maps `Math.sin(phase)` into the transform. Required when the offset multiplies/adds onto another live value (compound transforms, amplitude envelopes, multi-octave).

Either way, idle begins where the entry settled: at `phase = 0`, `sin(0) = 0` — the offset is zero, so there is no jump from the entry's resting state.

## Recipe

```js
// onUpdate form — phase-driven, composable.
const phase = { p: 0 };
tl.to(
  phase,
  {
    p: Math.PI * 2 * CYCLES,
    duration: IDLE_DUR,
    ease: "none", // sine provides the easing; a non-linear phase tween distorts the wave
    onUpdate: () => {
      const s = Math.sin(phase.p);
      hero.style.transform = `translateY(${s * Y_AMP_PX}px) scale(${1 + s * SCALE_AMP})`;
      // secondary elements: offset by Math.PI / 2 — synced motion looks mechanical
      dot.style.transform = `scale(${1 + Math.sin(phase.p + Math.PI / 2) * DOT_SCALE_AMP})`;
    },
  },
  IDLE_START_TIME,
);

// Yoyo form — standalone property, finite repeats.
tl.to(
  "#badge",
  { y: -Y_AMP_PX, duration: PERIOD / 2, ease: "sine.inOut", yoyo: true, repeat: REPEATS },
  IDLE_START_TIME,
);
```

## Variations

- **Multi-octave** (organic): stack a higher-frequency overlay — `1 + Math.sin(p) * AMP_PRIMARY + Math.sin(p * OCTAVE_RATIO) * AMP_SECONDARY`, with `AMP_SECONDARY < AMP_PRIMARY` and the combined max inside the normal SCALE_AMP range.
- **Settle and fade** (strongly recommended when `IDLE_DUR > 6s`): ramp amplitude to zero over the last ~20% of idle so the scene visibly settles before the inter-scene transition, instead of handing off mid-drift:

```js
const t = phase.p / (Math.PI * 2 * CYCLES); // 0 → 1 across idle
const env = t < 1 - FADE_FRAC ? 1 : (1 - t) / FADE_FRAC; // FADE_FRAC ≈ 0.2
const scale = 1 + Math.sin(phase.p) * SCALE_AMP * env;
```

This is the single biggest fix when finalize snapshots show "everything's still moving at the end"; it pairs naturally with break-boundary transitions (the outgoing visual is static when the crossfade/push begins).

## Values

| token           | range / default                      | notes                                                                      |
| --------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| SCALE_AMP       | **0.008–0.015 default**              | push to 0.02–0.04 only when isolated on canvas / scene <6s / kinetic brief |
| Y_AMP_PX        | **2–3px default**                    | 4–6px only under the same gating; rotation ±0.3–0.8° rarely needed at all  |
| period          | 1.5–3s (2.5–4s when idle is long)    | <1.5s frantic; >4s lifeless in a short window                              |
| CYCLES          | `IDLE_DUR/3 ≤ CYCLES ≤ IDLE_DUR/1.5` | derive from the period, not the other way round                            |
| IDLE_START_TIME | ≥ entry settle + ~0.1s               | `sin(0)=0` at this moment → no jump off the entry tail                     |
| IDLE_DUR        | `TOTAL_DURATION − IDLE_START_TIME`   | one long tween fills the hold — never restarted                            |
| DOT_SCALE_AMP   | 0.04–0.12                            | small accents tolerate more than the hero                                  |
| OCTAVE_RATIO    | 2.0–4.0                              | integer-ish reads musical; non-integer reads organic                       |

## Critical Constraints

- **Prefer reveal, then jitter, then breath** — the doctrine order above; default to the LOW end of every amplitude range. At the upper end across 5+ consecutive scenes the whole film reads as "shimmering".
- **Long idle window** (`IDLE_DUR > 6s` OR idle > 30% of composition): halve `SCALE_AMP` / `Y_AMP_PX`, slow the period to 3–4s, and add the settle-and-fade tail.
- **Concurrent idle on N elements** (columns, card grid, stat row): per-element amplitude ≤ default `/ √N`, AND stagger the periods (2.1s / 1.9s / 2.4s). Three columns at ±6px compound to ±18px of competing motion; three at ±2–3px read as one collective breath.
- **Compose, don't replace** — idle ADDS to the element's resting transform; never overwrite the entry's final translation.
- **Phase tween `ease: "none"`** — sine itself is the curve.
- **No CSS `@keyframes` for idle** — CSS animation runs on the browser's render clock, independent of the HF seek clock; a CSS-driven idle flickers/desyncs. Drive idle inside the timeline.

## See also

`ambient-glow-bloom` (the glow-layer counterpart, same bounded-breathe discipline) · `press-release-spring` / `counting-dynamic-scale` / `card-morph-anchor` / `orbit-3d-entry` (settled elements this can follow) · `spring-pop-entrance` (the arrival that precedes any idle).

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
