import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const requiredGateway = ["AI_GATEWAY_API_KEY", "AI_GATEWAY_MODEL"];
for (const name of requiredGateway) {
  if (!process.env[name]) throw new Error(`Missing ${name}; load the ignored .env.local file before running this proof`);
}

const supabaseCli = path.join(process.cwd(), "node_modules", "supabase", "dist", "supabase.js");
const status = spawnSync(process.execPath, [supabaseCli, "status", "-o", "env"], {
  cwd: process.cwd(),
  encoding: "utf8",
  windowsHide: true,
  maxBuffer: 4 * 1024 * 1024,
});
if (status.status !== 0) throw new Error("Local Supabase is not available");

const local = Object.fromEntries(
  status.stdout
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z0-9_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].replace(/"$/, "")]),
);
if (!local.API_URL) throw new Error("Local Supabase did not report an API URL");
const localUrl = new URL(local.API_URL);
if (!["127.0.0.1", "localhost"].includes(localUrl.hostname)) throw new Error("Phase 3 live proof is restricted to loopback Supabase");

const publishableKey = local.PUBLISHABLE_KEY || local.ANON_KEY;
const secretKey = local.SECRET_KEY || local.SERVICE_ROLE_KEY;
if (!publishableKey || !secretKey) throw new Error("Local Supabase keys are unavailable");

const vitest = path.join(process.cwd(), "node_modules", "vitest", "vitest.mjs");
const proof = spawnSync(process.execPath, [vitest, "run", "tests/unit/phase3-live-gateway.test.tsx", "--reporter=verbose"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY: secretKey,
    MAJUPILOT_GUEST_TOKEN_PEPPER: `phase3-live-${crypto.randomUUID()}`,
    AI_EXECUTION_MODE: "required",
    PHASE3_LIVE_GATEWAY_PROOF: "1",
    NEXT_TELEMETRY_DISABLED: "1",
  },
  encoding: "utf8",
  windowsHide: true,
  maxBuffer: 8 * 1024 * 1024,
});

process.stdout.write(proof.stdout);
process.stderr.write(proof.stderr);
process.exitCode = proof.status ?? 1;
