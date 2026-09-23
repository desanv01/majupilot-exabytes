import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "index.html");
let html = fs.readFileSync(file, "utf8");
const bed = html.match(/<audio[^>]+id="bgm-new-direction"[^>]*><\/audio>/);
if (!bed) throw new Error("music bed not found");
const attr = bed[0].match(/data-automation="([^"]+)"/);
if (!attr) throw new Error("music automation not found");
const decode = (text) => text.replaceAll("&quot;", '"').replaceAll("&amp;", "&");
const encode = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
const automation = JSON.parse(decode(attr[1]));
const gaps = [[173.5, 189.65], [544.0, 556.2]];

function valueAt(points, t) {
  if (t <= points[0].t) return points[0].v;
  for (let i = 1; i < points.length; i += 1) {
    if (t <= points[i].t) {
      const a = points[i - 1], b = points[i];
      return a.v + (b.v - a.v) * ((t - a.t) / (b.t - a.t));
    }
  }
  return points.at(-1).v;
}

for (const lane of automation.lanes) {
  if (lane.target !== "volume" && !/^fx\.n\d+\.gain$/.test(lane.target)) continue;
  for (const [start, end] of gaps) {
    const original = lane.points;
    const left = Number((start - .35).toFixed(3));
    const right = Number((end + .35).toFixed(3));
    const held = lane.target === "volume" ? .16 : 0;
    lane.points = [
      ...original.filter((point) => point.t < left),
      {t:left, v:Number(valueAt(original, left).toFixed(3))},
      {t:start, v:held},
      {t:end, v:held},
      {t:right, v:Number(valueAt(original, right).toFixed(3))},
      ...original.filter((point) => point.t > right),
    ];
  }
}
const updated = bed[0].replace(attr[0], `data-automation="${encode(JSON.stringify(automation))}"`);
html = html.replace(bed[0], updated);
fs.writeFileSync(file, html);
console.log("Phase 6 music: restored the existing bed during two authentic narration pauses");
