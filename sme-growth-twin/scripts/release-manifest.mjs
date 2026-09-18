import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const appRoot = process.cwd();
const repositoryRoot = path.resolve(appRoot, "..");
const output = path.resolve(process.env.STAGE07_MANIFEST_PATH?.trim() || path.join(tmpdir(), "sme-growth-twin-stage07-release-manifest.json"));
const files = [
  "package.json", "package-lock.json", "next.config.ts",
  "src/domain-packs/exabytes/golden-fixtures.ts",
  "src/domain-packs/exabytes/catalogue.ts",
  "src/domain-packs/exabytes/recommendation-rules.ts",
  "src/domain-packs/exabytes/scenario-templates.ts",
  "src/domain-packs/exabytes/advisor-rules.ts",
  "../planning/submission/TEST-EVIDENCE.md",
  "../planning/submission/THIRD-PARTY-REGISTER.md",
];
const hashes = {};
for (const file of files) hashes[file] = createHash("sha256").update(await readFile(path.resolve(appRoot, file))).digest("hex");
const npmVersion = process.env.npm_config_user_agent?.match(/^npm\/([^\s]+)/)?.[1] ?? "unavailable";
let diffCheck = "passed";
try { execFileSync("git", ["diff", "--check"], { cwd: repositoryRoot, stdio: "pipe", windowsHide: true }); } catch { diffCheck = "failed"; }
const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  gitCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim(),
  gitBranch: execFileSync("git", ["branch", "--show-current"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim(),
  nodeVersion: process.version,
  npmVersion,
  versions: { fixture: "1.0.0", catalogue: "1.0.0", score: "1.0.0", pain: "1.0.0", recommendation: "1.0.0", scenario: "1.0.0", roi: "1.0.0", advisor: "1.0.0", blueprint: "1.0.0" },
  commandResults: { "git diff --check": diffCheck, "required release commands": "See hashed planning/submission/TEST-EVIDENCE.md for the reviewed run." },
  deployment: { url: process.env.STAGE07_DEPLOYMENT_URL || null, target: process.env.STAGE07_DEPLOYMENT_TARGET || null, status: process.env.STAGE07_DEPLOYMENT_STATUS || "pending external deployment by main task" },
  pendingManualGates: ["five human usability tests", "catalogue owner approval", "judge Q&A rehearsal", "48-hour freeze", "final narrated video", "YouTube signed-out visibility", "competition form submission", "official receipt archive"],
  sha256: hashes,
};
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output, gitCommit: manifest.gitCommit, filesHashed: files.length, diffCheck }, null, 2));
if (diffCheck !== "passed") process.exitCode = 1;
