(function () {
  "use strict";

  var root = document.getElementById("root");
  var stage = root.querySelector(".ufz-stage");
  var world = root.querySelector(".ufz-world");
  var surface = root.querySelector(".ufz-surface");
  var halo = root.querySelector(".ufz-halo");
  var vars =
    window.__hyperframes && window.__hyperframes.getVariables
      ? window.__hyperframes.getVariables()
      : {};

  function num(value, fallback, min, max) {
    var parsed = parseFloat(value);
    if (!isFinite(parsed)) parsed = fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  var anchorX = num(vars.anchor_x, 64, 0, 100);
  var anchorY = num(vars.anchor_y, 36, 0, 100);
  var zoom = num(vars.zoom, 1.6, 1, 3);
  var zoomAt = num(vars.zoom_at, 1.4, 0, 30);
  var haloOn = vars.halo !== "hide";
  // Each enum choice routes to a DIFFERENT contract token so the
  // variable stays meaningful under a theme.
  var accentColors = {
    green: "var(--brand, #71f5a7)",
    blue: "var(--accent, #61a8ff)",
    violet: "var(--accent-2, #c5a3ff)",
  };
  var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
    ? vars.accent
    : "green";
  var exitMode = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

  root.style.setProperty("--ufz-accent", accentColors[accent]);

  // SLOT. Caller templates live at HOST DOCUMENT level (the mount
  // wipes host-clip children, and templates never render). The
  // scoped `document` proxy filters queries to this composition's
  // subtree, so the lookup deliberately goes through ownerDocument.
  var hostDoc = root.ownerDocument;
  var slotTemplate = null;
  try {
    slotTemplate = hostDoc.querySelector('template[data-slot="ui-focus-zoom-screen"]');
  } catch (error) {
    slotTemplate = null;
  }
  if (slotTemplate) {
    surface.querySelector(".ufz-skel").remove();
    surface.appendChild(hostDoc.importNode(slotTemplate.content, true));
  }

  /* ===== Camera (camera-servo law): translate(x, y) scale(S) on the
     ONE world wrapper. Translate percentages resolve against the
     world's own box, which fills the viewport, so a world point at
     offset o percent from center lands at S * o + T and the target
     transform is T = -(anchor - 50) * S, no measurement needed.
     The pan is clamped so the scaled world always covers the
     viewport (|T| <= 50 * (S - 1) minus the drift amplitude). ===== */
  var DRIFT_X = 0.16;
  var DRIFT_Y = 0.11;
  var panMax = Math.max(0, 50 * (zoom - 1) - Math.max(DRIFT_X, DRIFT_Y) - 0.2);
  var targetX = Math.min(panMax, Math.max(-panMax, -(anchorX - 50) * zoom));
  var targetY = Math.min(panMax, Math.max(-panMax, -(anchorY - 50) * zoom));

  var cam = { s: 1, x: 0, y: 0 };
  var drift = { p: 0, dx: 0, dy: 0 };
  function applyCamera() {
    world.style.transform =
      "translate(" +
      (cam.x + drift.dx) +
      "%, " +
      (cam.y + drift.dy) +
      "%) scale(" +
      cam.s +
      ")";
  }
  applyCamera();

  // Halo pinned to the anchor in world space; it rides the camera.
  // Explicit both-endpoint state BEFORE the timeline exists: the
  // bloom fromTo sits mid-timeline, so without this set a seek that
  // lands before the cue would show the halo unstyled.
  halo.style.left = anchorX + "%";
  halo.style.top = anchorY + "%";
  if (!haloOn) halo.remove();
  else
    gsap.set(halo, {
      opacity: 0,
      scale: 0.55,
      xPercent: -50,
      yPercent: -50,
      transformOrigin: "50% 50%",
    });

  // Envelope: fixed IN/ZOOM/OUT, elastic HOLD, never time-scaled.
  var IN_BASE = 0.9;
  var ZOOM_BASE = 1.1;
  var OUT_BASE = exitMode === "none" ? 0 : 0.5;
  var STILLNESS = 0.35;
  var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
  var totalBase = IN_BASE + ZOOM_BASE + OUT_BASE;
  var scale = duration < totalBase ? duration / totalBase : 1;
  var IN = IN_BASE * scale;
  var ZOOM = ZOOM_BASE * scale;
  var OUT = OUT_BASE * scale;
  var OUT_START = duration - OUT;

  // The camera departs on its cue, clamped so the move never fights
  // the entrance or the exit.
  var zoomStart = Math.min(Math.max(zoomAt, IN), Math.max(IN, OUT_START - ZOOM - 0.05));

  var tl = gsap.timeline({ paused: true });

  // IN: one settle. Rise + soft scale + fade, smooth ease-out.
  tl.fromTo(
    stage,
    { opacity: 0, y: "4.5cqh", scale: 0.965, transformOrigin: "50% 60%" },
    { opacity: 1, y: "0cqh", scale: 1, duration: IN, ease: "power3.out" },
    0,
  );

  // Camera servo: one move to the anchored region, then hold zoomed.
  tl.to(
    cam,
    {
      s: zoom,
      x: targetX,
      y: targetY,
      duration: ZOOM,
      ease: "power2.inOut",
      onUpdate: applyCamera,
    },
    zoomStart,
  );

  // Micro-drift: 2 and 3 INTEGER sine cycles that end at exactly
  // zero before the authored stillness, so the final hold is dead
  // still and every seek reproduces the same frame.
  var driftDuration = Math.max(0, OUT_START - STILLNESS);
  if (driftDuration >= 1.2) {
    tl.to(
      drift,
      {
        p: Math.PI * 2 * 2,
        duration: driftDuration,
        ease: "none",
        onUpdate: function () {
          drift.dx = Math.sin(drift.p) * DRIFT_X;
          drift.dy = Math.sin(drift.p * 1.5) * DRIFT_Y;
          applyCamera();
        },
      },
      0,
    );
  }

  // Halo: soft bloom at the anchor as the camera arrives, then hold.
  if (haloOn) {
    tl.fromTo(
      halo,
      { opacity: 0, scale: 0.55, xPercent: -50, yPercent: -50 },
      {
        opacity: 0.85,
        scale: 1,
        xPercent: -50,
        yPercent: -50,
        duration: 0.75 * scale,
        ease: "power2.out",
      },
      zoomStart + ZOOM * 0.5,
    );
  }

  // OUT: only when exit != none; the default holds the last frame.
  if (exitMode !== "none") {
    tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
    if (exitMode === "up") {
      tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
    }
  }

  tl.seek(0);
  window.__timelines = window.__timelines || {};
  window.__timelines["ui-focus-zoom"] = tl;
})();
