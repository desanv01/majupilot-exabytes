import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const cli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
const status = spawnSync(process.execPath, [cli, "status", "-o", "env"], {
  cwd: process.cwd(), encoding: "utf8", windowsHide: true, maxBuffer: 4 * 1024 * 1024,
});
if (status.status !== 0) throw new Error("Local Supabase is unavailable");
const local = Object.fromEntries(status.stdout.split(/\r?\n/)
  .map((line) => line.match(/^([A-Z0-9_]+)="?(.*?)"?$/)).filter(Boolean)
  .map((match) => [match[1], match[2].replace(/"$/, "")]));
const url = new URL(local.API_URL);
if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("Restart proof requires loopback Supabase");
const publishable = local.PUBLISHABLE_KEY || local.ANON_KEY;
const secret = local.SECRET_KEY || local.SERVICE_ROLE_KEY;
if (!publishable || !secret) throw new Error("Local Supabase keys are unavailable");
const proof = spawnSync(process.execPath, ["scripts/phase-g-copilot-smoke.mjs"], {
  cwd: process.cwd(), encoding: "utf8", windowsHide: true, maxBuffer: 4 * 1024 * 1024,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable,
    SUPABASE_SECRET_KEY: secret,
    MAJUPILOT_GUEST_TOKEN_PEPPER: `phase5-restart-${crypto.randomUUID()}`,
    AI_EXECUTION_MODE: "disabled",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});
process.stdout.write(proof.stdout);
process.stderr.write(proof.stderr);
process.exitCode = proof.status ?? 1;
