import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const configuredArtifacts = process.env.PHASE4_UI_ARTIFACT_DIR?.trim();
const artifacts = configuredArtifacts
  ? path.resolve(configuredArtifacts)
  : await mkdtemp(path.join(tmpdir(), "majupilot-phase4-ui-"));
const blueprintArtifacts = path.join(artifacts, "blueprint");
const workspaceArtifacts = path.join(artifacts, "workspace");
const quietAi = { AI_EXECUTION_MODE: "disabled", AI_GATEWAY_MODEL: "", AI_GATEWAY_API_KEY: "", VERCEL_OIDC_TOKEN: "" };

try {
  await mkdir(blueprintArtifacts, { recursive: true });
  await mkdir(workspaceArtifacts, { recursive: true });
  if (process.env.PHASE4_SKIP_BUILD !== "1") {
    execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
      cwd: process.cwd(), env: { ...process.env, ...quietAi }, stdio: "inherit", windowsHide: true,
    });
  }
  if (process.env.PHASE4_SKIP_BLUEPRINT !== "1") {
    execFileSync(process.execPath, ["scripts/phase06-browser-check.mjs"], {
      cwd: process.cwd(), env: { ...process.env, ...quietAi, PHASE4_BLUEPRINT_ARTIFACT_DIR: blueprintArtifacts }, stdio: "inherit", windowsHide: true,
    });
  }
  execFileSync(process.execPath, ["scripts/phase2-blueprint-copilot-check.mjs", "--evidence"], {
    cwd: process.cwd(), env: { ...process.env, ...quietAi, PHASE4_WORKSPACE_ARTIFACT_DIR: workspaceArtifacts }, stdio: "inherit", windowsHide: true,
  });

  const blueprint = JSON.parse(await readFile(path.join(blueprintArtifacts, "browser-evidence.json"), "utf8"));
  const workspace = JSON.parse(await readFile(path.join(workspaceArtifacts, "browser-proof.json"), "utf8"));
  const screenshots = (await Promise.all([blueprintArtifacts, workspaceArtifacts].map(async (directory) =>
    (await readdir(directory)).filter((name) => name.endsWith(".png")).map((name) => path.relative(artifacts, path.join(directory, name))),
  ))).flat();
  const summary = {
    contract: "Phase 4 UI and UX correction",
    generatedAt: new Date().toISOString(),
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: process.cwd(), encoding: "utf8", windowsHide: true }).trim(),
    viewports: ["390x844", "768x1024", "1366x900", "1920x1080"],
    assertions: {
      blueprintSectionTracking: blueprint.clarity?.sectionTracking === true,
      primaryMetadataRestrained: blueprint.clarity?.metadataRestraint === true,
      blueprintResponsive: blueprint.responsive?.every((item) => !item.overflow && !item.overlay && item.minTarget >= 44) === true,
      blueprintAxe: Object.values(blueprint.accessibility ?? {}).every((violations) => violations.length === 0),
      copilotFailureRecovery: workspace.copilotFailure?.retry === true && workspace.copilotFailure?.technicalClosed === true,
      evidenceTechnicalDisclosure: workspace.evidence?.technicalEvidence === true && workspace.evidence?.technicalCitation === true,
      evidenceDeleteDialog: workspace.evidence?.deleteDialogAccessible === true,
      workspaceResponsive: workspace.responsive?.every((item) => !item.overflow && item.minTarget >= 44) === true && workspace.evidence?.responsive?.every((item) => !item.overflow && item.minTarget >= 44) === true,
      workspaceAxe: workspace.axe?.length === 0,
      cleanConsole: blueprint.consoleErrors?.length === 0 && workspace.consoleErrors?.length === 0,
    },
    screenshots,
    sourceReports: ["blueprint/browser-evidence.json", "workspace/browser-proof.json"],
  };
  if (!Object.values(summary.assertions).every(Boolean)) throw new Error(`Phase 4 browser assertions failed: ${JSON.stringify(summary, null, 2)}`);
  await writeFile(path.join(artifacts, "phase4-browser-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...summary, artifacts }, null, 2)}\n`);
} finally {
  if (!configuredArtifacts) await rm(artifacts, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
}
