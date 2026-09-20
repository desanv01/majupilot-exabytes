# Frame packet: 02-decision-gap

## Project inputs

- Project: C:\Users\Dv\.codex\worktrees\a634\MajuPilot\video-production\majupilot-hackathon-video
- Design truth: C:\Users\Dv\.codex\worktrees\a634\MajuPilot\video-production\majupilot-hackathon-video\frame.md
- RULES_DIR: C:\Users\Dv\.agents\skills\hyperframes-animation\rules

## Assigned storyboard block

## Frame 02 — The decision gap

- status: built
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

## Selected blueprint: overwhelm-surround

# overwhelm-surround — Overwhelm / Close-In

**intent**: Convey overwhelm by accumulation. Recognizable subjects assemble, density markers scatter in to amplify "look how much," then the central subject morphs into the viewer's own avatar and elements close in from ALL sides — the frame feels surrounded, not zoomed-into. The emotional arc is recognition → claustrophobia.

**roles served**

- Problem (from `problem-mockup-overwhelm`): when the problem beat must first show "too many tools / too much surface area" and then put **the viewer inside it** — a literal swap of subject (product → person) followed by a closing-in that feels invasive. Reach for it when the pain is "you're buried," not "this metric is bad" (that's `dataviz-countup`).
- Problem (from `desktop-clutter-accumulation`): when the overwhelm is a **workspace**, not a tool
  count — live windows, stickies, and alert toasts pile up until the frame is chaotically full, and
  the beat resolves not by closing in but by shoving the clutter aside and asking the question.
  Reach for this variant when the pain lands on words ("how can you X… when you spend months on
  Y?"), not on a surrounded avatar.

**duration**: 6–9s (clutter-shove-to-question variant ~10s)

**shot structure** (a `[bg]` canvas; recognizable surfaces first, the viewer's avatar revealed underneath, then a radial crowd)

- **Scene 1 (0.0–~1.6s) — recognizable assembly.** Three `[product mockups / surfaces]` assemble into something the viewer knows — staggered scale-in, the **center** one full-size, the two flanks smaller (~0.86). Each rides a low-amplitude float so they feel like live context, not a static collage. Camera static.
- **Scene 2 (~1.6–3.0s) — density amplifies.** `[platform icons / logos]` scatter in around the mockups (staggered), used purely as **density markers** — "look how much surface area," not animated dials.
- **Scene 3 (~3.0–4.6s) — the morph (signature move).** The CENTER mockup MORPHS: its content fades out, the container reshapes, and the viewer's `[avatar]` is revealed **underneath** — a literal swap of subject, product → person.
- **Scene 4 (~4.6–end) — close-in.** `[task bubbles / demands]` close in from ALL sides toward the avatar (radial staggered entry). The avatar **stays put** while the bubbles invade — the claustrophobia comes from being surrounded, never from a camera push. Holds on the crowded state.
- **Variant — clutter-shove-to-question** (replaces Scenes 3–4 and
  inverts the camera contract — see modifier): accumulation runs under a **slow steady zoom-out** —
  `[sticky notes]` bounce in springy, `[dashboard / editor windows]` pop and slide up, a stack of
  `[alert toasts]` slides in at one edge, inner content keeps typing / log-scrolling as live density,
  windows overlap until the frame is chaotically full. The camera then REVERSES into a quick
  push-in that **shoves the clutter to the frame edges**, opening central negative space where a
  `[two-part serif question]` builds word-by-word (line 1 swaps in place to line 2); a `[cursor]`
  glides in from off-frame and comes to rest under the text; a very slow forward creep and hold.
  No morph, no avatar — the question is the payoff.

**motion vocabulary**: staggered scale-in assembly; resting-scale-preserving low float; density-marker icon scatter; content-fade → container-reshape → reveal-anchor-beneath morph; radial close-in entry from all compass points; held crowded end-state. Clutter-shove variant: slow steady zoom-out under accumulation; reverse quick push-in; clutter
shoved to frame edges opening center negative space; continuous live typing / log scroll inside
windows as ambient density; toast-stack slide-in; word-by-word serif build with in-place line swap;
cursor glide-to-rest; very slow forward creep + hold.

**rule mapping**

- staggered mockup + icon entries (smooth settle onto their resting scale) → `spring-pop-entrance` (smooth-settle register) backed by `gsap-effects`
- platform icons as density markers (positions pre-baked, scale/opacity only — NOT internal-parts animation) → `svg-icon-enrichment` (its DOM contract only)
- center mockup → avatar morph (HF forbids `width`/`height` tweens → drive the reshape on `scaleX`/`scaleY`, anchor = the avatar layer rendered beneath) → `card-morph-anchor`
- radial bubble close-in (positions baked once via `cos`/`sin`, staggered entry) → `gsap-effects` (radial layout) + `spring-pop-entrance` (per-bubble arrival)
- low-amplitude float on background mockups/icons → `sine-wave-loop` (low-amplitude register — subtle jitter that composes onto each element's resting scale, never a `fromTo` yoyo that re-tweens to its start)
- (variant) zoom-out under accumulation → quick push-in → slow forward creep → `multi-phase-camera`
  (pull-back / push / drift as sequential phases on one world wrapper; counter-translate math in
  `viewport-change`)
- (variant) clutter shoved to the edges as the push-in lands → `center-outward-expansion` (outward
  vectors to edge resting positions), fired at the same timeline position as the camera push so the
  shove reads as CAUSED by it (`reactive-displacement` register)
- (variant) word-by-word serif question build → `gsap-effects` (staggered word reveal); the
  in-place line-1 → line-2 swap → `discrete-text-sequence`
- (variant) live typing inside windows → `gsap-effects` (typewriter); the continuous inner
  log-scroll — composition: looping content translateY via `gsap-effects` (masked)
- (variant) cursor glide-in coming to rest → `cursor-click-ripple` (approach portion only — no click)

**camera modifier**: camera-static — the close-in must read as the world crowding the subject, so the frame holds; a push-in would convert "surrounded" into "zoomed-into" and kill the claustrophobia. The clutter-shove-to-question variant is the sanctioned exception: there the camera IS the
storyteller (zoom-out ↔ push-in via `multi-phase-camera`), and the claustrophobia comes from
accumulation, not surround — never mix the two resolutions in one shot.

## Selected motion rule: reactive-displacement

---
name: reactive-displacement
description: Physical collision where an entering element's spring drives the exiting element's displacement — single source of truth makes the motion causally linked.
metadata:
  tags: transition, physics, collision, displacement, spring, causal
---

# Reactive Displacement

Exit animation of element A is mathematically DERIVED from the entry spring of element B — a causal link: "A moves _because_ B hit it." Distinct from [scale-swap-transition.md](scale-swap-transition.md) (which overlaps but isn't causal) and [card-morph-anchor.md](card-morph-anchor.md) (one container morphing).

A single 0→1 driver tween (the "entry spring") feeds three concurrent derived motions in one `onUpdate`:

- **Intruder** (B, entering): position interpolated off-stage → settled over the full driver, plus tilt settling to 0° and a sharp early opacity reveal.
- **Victim** (A, exiting): position interpolated settled → off-stage in the OPPOSITE direction, completing at `VICTIM_FRACTION` (~0.4–0.5) of the driver — NOT 1.0.

The victim finishing BEFORE the intruder's entry creates the "hit then settle" rhythm; sharing one eased driver makes the impact moment mathematically synchronized.

## Recipe

```js
// Both cards absolutely centered; overflow: hidden on the scene (off-stage travel);
// will-change: transform, opacity on both; intruder z-index ABOVE victim.
const INTRUDER_START_X = STAGE_W; // off-stage right
const VICTIM_END_X = -STAGE_W; // off-stage left — SAME axis, opposite direction

gsap.set("#victim", { x: 0, opacity: 1, rotation: 0 });
gsap.set("#intruder", { x: INTRUDER_START_X, opacity: 0, rotation: -INTRUDER_TILT });

const driver = { p: 0 };
tl.to(
  driver,
  {
    p: 1,
    duration: DRIVER_DUR,
    ease: `back.out(${BOUNCE_FACTOR})`, // the intruder spring
    onUpdate: () => {
      // Intruder: full 0→1 progress maps enter (off-stage → center)
      const intruderX = INTRUDER_START_X * (1 - driver.p);
      const intruderOpacity = Math.min(1, driver.p * FADE_IN_SHARPNESS);
      const intruderRot = -INTRUDER_TILT * (1 - driver.p); // settles to 0°
      const intruder = document.getElementById("intruder");
      intruder.style.transform = `translate(-50%, -50%) translateX(${intruderX}px) rotate(${intruderRot}deg)`;
      intruder.style.opacity = String(intruderOpacity);

      // Victim: completes its exit at VICTIM_FRACTION of the driver — by the
      // time the intruder centers, the victim is already off-stage.
      const victimP = Math.min(1, driver.p / VICTIM_FRACTION);
      const victimX = VICTIM_END_X * victimP;
      const victim = document.getElementById("victim");
      victim.style.transform = `translate(-50%, -50%) translateX(${victimX}px)`;
      victim.style.opacity = String(1 - victimP);
    },
  },
  DRIVER_AT,
);
// Climax dwell — intruder holds centered for ≥ DWELL_MIN before the scene ends.
```

## Variations

- **Impact rotation on victim** — the victim also rotates as it slides: `const victimRot = victimP * -VICTIM_KICK_DEG;` appended to its transform. `VICTIM_KICK_DEG` 15–25°, magnitude matched to the perceived intruder weight.
- **Vertical collision** — intruder from top, victim displaced downward; same math on Y. Reads as "weight dropped on it."
- **Wobble after settle** — after the intruder centers, a damped sine wobble (`±WOBBLE_AMP_DEG` rotation, linearly decaying over `WOBBLE_DUR` via a second `ease: "none"` driver at `DRIVER_AT + DRIVER_DUR`) before stillness — "impact aftermath."
- **Multi-victim ripple** — the intruder displaces multiple aligned cards, each victim's `victimP` on a slightly offset driver phase (cascade ripple).

## Values

| token             | range                  | notes                                                                                                      |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| DRIVER_AT         | phase-dependent        | after the prior reading beat resolves; must leave ≥ DWELL_MIN of climax dwell before the scene ends        |
| DRIVER_DUR        | 0.6–1.4 s              | short = zippy punch, long = heavy landed impact; higher bounce on long durations reads as floaty           |
| BOUNCE_FACTOR     | 1.2–2.0 (typ. 1.4–1.6) | stay in the `back.out` family (or `elastic.out` for oscillation) — changing family rewrites the feel       |
| VICTIM_FRACTION   | 0.4–0.5                | <0.4 the victim disappears before the impact reads; >0.5 feels parallel, not causal; hard cap ~0.6         |
| STAGE_W           | ≥ composition width    | smaller leaves the off-stage element partially visible at start                                            |
| INTRUDER_TILT     | 5–15° (typ. ~10°)      | low = clean glide, high = "spin-and-plant"; sign consistent with entry direction (momentum transfer)       |
| FADE_IN_SHARPNESS | 3–8                    | intruder reaches opacity 1 at `1/FADE_IN_SHARPNESS` of progress; must be > 1 or it's transparent at center |
| DWELL_MIN         | ≥ 1.0 s (typ. 1.0–1.5) | post-impact dwell is where the new content gets read — do not skip                                         |

## Critical Constraints

- **Single driver = single source of truth** — both motions computed inside ONE driver's `onUpdate`, never separate `tl.to()` calls per element; independent tweens destroy the causal link (they'd merely be near each other in time).
- **Victim completes at a fraction of the driver** — the "hit" is the overlap moment; after it the victim is just vacating space the intruder will fill.
- **Directional momentum transfer** — same axis, opposite directions; different axes read as passing, not colliding.
- **Intruder z-index above victim** — explicit, not DOM order; otherwise the victim looks like it tunneled through.
- **Intruder enters tilted, settles flat** — small initial tilt → 0° reads as "spinning in then planting."
- **Climax dwell after impact** — the impact is the headline beat; hold the settled intruder ≥ DWELL_MIN.
- **`overflow: hidden` on the scene** — off-stage motion exceeds the frame.

## See also

`control-target-sync` (the live-editing mirror — repeated coupled edits, nothing exits) · `hacker-flip-3d` (intruder text reveal during entry) · `sine-wave-loop` (idle breathing during the dwell) · `vertical-spring-ticker` (a ticker that "shoves" the previous content out).

## Selected motion rule: center-outward-expansion

---
name: center-outward-expansion
description: Elements start clustered at screen center and expand outward to their final positions, driven by a shared progress value.
metadata:
  tags: expansion, scatter, center, reveal, layout, sync, burst
---

# Center-Outward Expansion

Elements begin at one shared center point and radiate outward to their final positions — the entry beat itself, or motion driven by another animation's progress (a counting number, a beat). Flat 2D cousin of [depth-scatter-assemble.md](depth-scatter-assemble.md) (per-element 3D cloud): here every element shares the SAME origin.

## How It Works

Each element carries its final offset as `data-target-x/y`. Its position lerps between center and target: `x = targetX × progress`. Self-centering is baked as `xPercent/yPercent: -50` so the tweened `x`/`y` are pure offsets from the stage center. Standalone burst = per-item staggered `fromTo`; driven burst = one shared proxy (see Variations).

## Recipe

```html
<!-- inside a standard scene clip (hyperframes-core) -->
<div class="burst-wrap">
  <div class="burst-item" data-target-x="-360" data-target-y="-180">{itemA}</div>
  <div class="burst-item" data-target-x="360" data-target-y="-180">{itemB}</div>
  <div class="burst-item" data-target-x="0" data-target-y="360">{itemC}</div>
</div>
```

```css
.burst-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
.burst-item {
  position: absolute;
  top: 50%;
  left: 50%; /* GSAP xPercent/yPercent -50 bakes the centering; x/y tween the offset */
  will-change: transform;
}
```

```js
document.querySelectorAll(".burst-item").forEach((el, i) => {
  tl.fromTo(
    el,
    { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0.6, opacity: 0 },
    {
      x: Number(el.dataset.targetX),
      y: Number(el.dataset.targetY),
      scale: 1,
      opacity: 1,
      duration: EXPAND_DUR,
      ease: EXPAND_EASE,
    },
    ENTRY_AT + i * STAGGER,
  );
});
```

## Variations

- **Synced to a driver (chord)**: when the burst shadows a counter / beat, drop the stagger and drive all items from ONE 0→1 proxy tween with the driver's exact duration AND ease; `onUpdate` writes `translate(-50%,-50%) translate(targetX*p, targetY*p)` per item — the two read as one beat.
- **Partially-spread start**: with 6+ items the full cluster piles up — start from `{ x: targetX * START_PROGRESS, ... }`.
- **Idle micro-float**: hand off to [sine-wave-loop.md](sine-wave-loop.md) after landing instead of freezing.

## Values

| token          | range                | notes                                                            |
| -------------- | -------------------- | ---------------------------------------------------------------- |
| ITEM_COUNT     | 3–8                  | > 8 = visual chaos mid-expansion; low counts want wider spread   |
| EXPAND_DUR     | 1.0–1.8s             | must equal the driver's duration in the synced variant           |
| EXPAND_EASE    | `power3.out` default | `power2.out` gentler, `expo.out` dramatic stop; NEVER `in` eases |
| STAGGER        | 0.04–0.08s           | tighter = chord; looser = lazy arpeggio                          |
| ENTRY_AT       | 0–0.5s               | a beat of compositional quiet before the burst                   |
| START_PROGRESS | 0–0.5                | 0 = dramatic full cluster; ~0.3 avoids the pile-up               |

## Critical Constraints

- **Tween `x`/`y` over the baked `xPercent/yPercent: -50`** — mutating `left`/`top` fights the centering and causes pixel jitter.
- **Out-easing only** — `in` easings read as items being sucked back mid-air.
- **No other absolute-positioned siblings inside `.burst-wrap`** — they'd steal the centered baseline.
- **❗ The burst IS the beat** — don't park a "real headline" label below it (the eye snaps to the label and ignores the burst). If a label is needed, reveal it post-burst in the same stack.
- Synced variant: identical duration + ease as the driver, or the chord falls apart.

## See also

`counting-dynamic-scale` (the classic chord driver) · `depth-scatter-assemble` (3D per-element cloud) · `card-morph-anchor` (burst out of a morphed card) · `sine-wave-loop` (post-landing life).

## Selected motion rule: discrete-text-sequence

---
name: discrete-text-sequence
description: Replace entire text states at frame thresholds for non-linear typing effects — typos, bulk additions, pauses, backspaces, simulated thinking.
metadata:
  tags: text, typing, discrete, threshold, non-linear, sequence
---

# Discrete Text Sequence

Instead of character-by-character typewriter, replace entire string states at time thresholds — enabling non-linear effects (typos, backspaces, bulk paste, "thinking" gaps) that smooth per-char typing can't achieve. If your effect is "type each character, no edits", this rule is overkill — use the smooth-slice variation below.

## How It Works

The typing is authored as a sparse array of `{ t, text }` states; on every `onUpdate` a **reverse search** finds the latest entry whose `t` has passed and renders its text. Display jumps between states with no animation between them — the realism comes from the schedule shape: fast keystroke clusters (0.06–0.20s apart), pauses at word breaks (0.3–0.6s), a typo, backspaces peeling back to the fork, then a bulk paste replacing many chars in one entry. A block cursor blinks via a deterministic sin square wave on the same timeline.

## Recipe

```html
<!-- inside a standard scene clip (hyperframes-core) -->
<div class="terminal">
  <div class="prompt">$</div>
  <div class="text-wrap">
    <span class="text" id="text"></span><span class="cursor" id="cursor">_</span>
  </div>
</div>
```

```css
.terminal {
  font-family: {monoFont}; /* monospace required — proportional jitters even in a fixed box */
  display: flex;
  align-items: baseline;
  font-size: TERMINAL_FONT_SIZE;
}
.text-wrap {
  display: inline-flex;
  align-items: baseline;
  min-width: TEXT_WRAP_MIN_WIDTH; /* ≥ widest state — stops right-edge jitter */
  white-space: nowrap;
}
.cursor {
  display: inline-block; /* inline ignores width */
  width: CURSOR_WIDTH;
}
```

```js
// Each entry shows from its t until the NEXT entry's t.
// Shape: keystrokes → typo → backspace to the fork → bulk paste → completion mark.
const SEQUENCE = [
  { t: 0.0, text: "" },
  { t: T_K1, text: "{p1}" }, // first keystrokes (~3-5 chars, 0.1-0.2s apart)
  { t: T_K2, text: "{p1 + ' ' + p2_typo}" }, // continuation containing a typo
  { t: T_BS, text: "{p1 + ' ' + p2_partial}" }, // backspace(s) — peel back to the fork
  { t: T_BULK, text: "{fullCorrectedText}" }, // bulk paste — many chars in one jump
  { t: T_DONE, text: "{fullCorrectedText + ' ✓'}" }, // completion marker
];

// Reverse-search for the latest entry whose t has passed
function textAt(time) {
  for (let i = SEQUENCE.length - 1; i >= 0; i--) {
    if (time >= SEQUENCE[i].t) return SEQUENCE[i].text;
  }
  return "";
}

const textEl = document.getElementById("text");
const cursorEl = document.getElementById("cursor");

const driver = { t: 0 };
tl.to(
  driver,
  {
    t: TOTAL_DURATION,
    duration: TOTAL_DURATION,
    ease: "none",
    onUpdate: () => {
      textEl.textContent = textAt(driver.t);
    },
  },
  0,
);

// Cursor blink — deterministic sin square wave, never a CSS animation
const blink = { p: 0 };
tl.to(
  blink,
  {
    p: Math.PI * 2 * BLINK_CYCLES,
    duration: TOTAL_DURATION,
    ease: "none",
    onUpdate: () => {
      cursorEl.style.opacity = Math.sin(blink.p) > 0 ? "1" : "0";
    },
  },
  0,
);
```

## Variations

- **Smooth character slice** (continuous typewriter — no pauses, no edits): faster to author but uniformly "machine-typed", missing the human realism:

```js
const fullText = "{fullPhrase}";
const len = { v: 0 };
tl.to(
  len,
  {
    v: fullText.length,
    duration: TYPE_DUR,
    ease: "power1.inOut",
    onUpdate: () => {
      textEl.textContent = fullText.substring(0, Math.floor(len.v));
    },
  },
  0,
);
```

- **Thinking pause** — hold one state for `THINK_HOLD_DUR` (0.8–2.0s; under 0.5s reads as a stutter, not thought) simply by leaving a gap before the next entry's `t`.
- **State pulse on completion** — when the final state lands, `tl.to(".text", { scale: 1.03–1.08, duration: 0.15–0.3, yoyo: true, repeat: 1 }, T_DONE)`.
- **Per-state color shift** — in `onUpdate`, branch on `driver.t` vs the milestones: success color after `T_DONE`, dim mid-edit, normal while typing.

## Values

| token               | range                                        | notes                                                                  |
| ------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| TERMINAL_FONT_SIZE  | 48–96px                                      | full-bleed comps; smaller for terminal-style detail                    |
| TEXT_WRAP_MIN_WIDTH | ≥ widest state                               | measure with a hidden probe after `document.fonts.ready` if unsure     |
| milestone `t`s      | keystrokes 0.06–0.20s apart; pauses 0.3–0.6s | monotonically increasing; `T_DONE ≤ TOTAL_DURATION − ~1s` climax dwell |
| TYPE_DUR (smooth)   | `chars × 0.06–0.12s`                         | fast → relaxed                                                         |
| BLINK_CYCLES        | one cycle per 0.5–0.8s                       | `TOTAL_DURATION / 0.8 ≤ BLINK_CYCLES ≤ TOTAL_DURATION / 0.5`           |
| CURSOR_WIDTH        | ~0.3× font size                              | gap to text single-digit px so the cursor feels attached               |

## Critical Constraints

- **Reverse-search the array each frame** — O(n) with small n (≤30 typical); don't index by frame, the sequence is sparse.
- **`min-width` on the text wrap is mandatory** — without it the right edge jitters as state length changes.
- **Discrete jumps must be INSTANT** — any transition on the text turns the jump into a smear and kills the "typing" feel.
- **Cursor blink is sin/sequence-driven on the timeline**, `display: inline-block`, monospace font, `white-space: nowrap` (wrapping mid-state breaks the illusion; trailing spaces must survive).
- **Discrete vs smooth** — use discrete only for non-linear states (typos, pauses, bulk paste); plain typing takes the smooth-slice variation.

## See also

`context-sensitive-cursor` (same SEQUENCE pattern + segment-colored cursor) · `3d-text-depth-layers` (discrete text with layered depth) · `counting-dynamic-scale` (discrete label beside a smooth counter) · `press-release-spring` (post-completion press beat).
