import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const phase6 = process.argv.includes("--phase6");
const words = JSON.parse(
  fs.readFileSync(path.join(root, "planning", phase6 ? "phase6" : "stage6", "captions-words.json"), "utf8"),
);

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const groups = [];
let current = [];

function flush() {
  if (!current.length) return;
  groups.push({
    beatId: current[0].beat_id,
    start: current[0].start,
    end: Math.min(580, current.at(-1).end + 0.08),
    words: current,
  });
  current = [];
}

for (let index = 0; index < words.length; index += 1) {
  const word = words[index];
  const next = words[index + 1];
  if (current.length && current[0].beat_id !== word.beat_id) flush();
  current.push(word);
  const text = current.map((item) => item.text).join(" ");
  const sentenceEnd = /[.!?][\"')\]]?$/.test(word.text);
  const pause = next && next.beat_id === word.beat_id ? next.start - word.end : Infinity;
  if (sentenceEnd || current.length >= 6 || text.length >= 54 || pause >= 0.22) flush();
}
flush();

for (let index = 0; index < groups.length - 1; index += 1) {
  groups[index].end = Math.min(groups[index].end, groups[index + 1].start);
}

const markup = groups
  .map((group, groupIndex) => {
    const spans = group.words
      .map(
        (word, wordIndex) =>
          `<span data-hf-id="hf-cap-${String(groupIndex).padStart(3, "0")}-${String(wordIndex).padStart(2, "0")}" id="cap-${groupIndex}-${wordIndex}" class="caption-word">${escapeHtml(word.text)}</span>`,
      )
      .join(" ");
    return `<div data-hf-id="hf-cap-group-${String(groupIndex).padStart(3, "0")}" id="cap-group-${groupIndex}" class="caption-group" aria-label="${escapeHtml(group.words.map((word) => word.text).join(" "))}"><div class="caption-card"><div class="caption-rail"></div><div class="caption-copy">${spans}</div></div></div>`;
  })
  .join("");

const timelineData = groups.map((group) => ({
  start: group.start,
  end: group.end,
  words: group.words.map((word) => ({ start: word.start, end: word.end })),
}));

const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body>
  <template>
    <style>
      @font-face { font-family: "MP Sans"; src: url("assets/storyboard-fonts/Inter-400.woff2") format("woff2"); font-weight: 400; font-display: block; }
      @font-face { font-family: "MP Sans"; src: url("assets/storyboard-fonts/Inter-700.woff2") format("woff2"); font-weight: 700; font-display: block; }
      *, *::before, *::after { box-sizing: border-box; }
      #caption-track { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; font-family: "MP Sans", Arial, sans-serif; }
      #caption-layer { position: absolute; inset: 0; }
      .caption-group { position: absolute; left: 192px; right: 192px; top: 900px; height: 68px; display: flex; align-items: stretch; justify-content: center; opacity: 0; visibility: hidden; }
      .caption-card { position: relative; min-width: 540px; max-width: 1536px; height: 68px; display: flex; align-items: center; justify-content: center; padding: 10px 30px 9px; overflow: visible; border: 1px solid rgba(142, 226, 211, .62); border-radius: 10px; background: rgba(5, 37, 51, .96); box-shadow: 0 10px 34px rgba(1, 19, 29, .32); }
      .caption-rail { position: absolute; left: 18px; top: -1px; width: 86px; height: 4px; background: #13a29b; }
      .caption-copy { width: 100%; color: #c9d8dc; font-size: 38px; line-height: 1.15; font-weight: 700; letter-spacing: -.01em; text-align: center; white-space: nowrap; }
      .caption-word { display: inline-block; padding: 2px 4px 3px; border-radius: 5px; color: #c9d8dc; background: rgba(15, 118, 110, 0); }
    </style>
    <div data-hf-id="hf-caption-root" id="caption-track" data-composition-id="caption-track" data-duration="580" data-width="1920" data-height="1080" data-fps="30">
      <div data-hf-id="hf-caption-layer" id="caption-layer" data-layout-allow-caption-zone>
${markup}
      </div>
    </div>
    <script>
      const GROUPS = ${JSON.stringify(timelineData)};
      const tl = gsap.timeline({ paused: true });
      GROUPS.forEach((group, groupIndex) => {
        const groupEl = document.getElementById("cap-group-" + groupIndex);
        tl.set(groupEl, { opacity: 1, visibility: "visible", y: 0 }, group.start);
        group.words.forEach((word, wordIndex) => {
          const wordEl = document.getElementById("cap-" + groupIndex + "-" + wordIndex);
          if (wordIndex > 0) {
            const previous = document.getElementById("cap-" + groupIndex + "-" + (wordIndex - 1));
            tl.set(previous, { color: "#c9d8dc", backgroundColor: "rgba(15,118,110,0)" }, word.start);
          }
          tl.set(wordEl, { color: "#fffdf8", backgroundColor: "rgba(15,118,110,.82)" }, word.start);
        });
        tl.set(groupEl, { opacity: 0, visibility: "hidden" }, group.end);
      });
      GROUPS.forEach((group, groupIndex) => {
        const groupEl = document.getElementById("cap-group-" + groupIndex);
        tl.seek(group.end + 0.01);
        const computed = window.getComputedStyle(groupEl);
        if (computed.opacity !== "0" && computed.visibility !== "hidden") {
          console.warn("[caption-lint] group " + groupIndex + " still visible after exit");
        }
      });
      tl.seek(0);
      window.__timelines["caption-track"] = tl;
    </script>
  </template>
</body>
</html>
`;

const output = path.join(root, "compositions", phase6 ? "captions-phase6.html" : "captions-stage6.html");
fs.writeFileSync(output, html);
console.log(`captions: ${groups.length} groups / ${words.length} words -> ${path.relative(root, output)}`);
