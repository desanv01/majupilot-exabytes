# Local development

Run all commands from the canonical `sme-growth-twin` directory.

## Prerequisites

- Node.js 22.12.0 or newer
- npm 11 or a compatible npm release

## Commands

```powershell
# Reproducible install from the committed lockfile
npm ci

# Local development server
npm run dev

# Static analysis
npm run lint
npm run type-check

# Unit tests
npm test

# Production build
npm run build

# Stage 06 real-browser acceptance (starts and cleans up isolated local processes)
npm run test:stage06:browser

# Stage 07 fixtures, security, production browser, audit, and manifest
npm run test:stage07:golden
npm run test:stage07:security
npm run test:stage07:browser
npm run audit:production
npm run release:manifest

# Optional: intentionally retain fresh Stage 06 screenshots in a chosen directory
$env:STAGE06_ARTIFACT_DIR="C:\\temp\\stage06-evidence"
npm run test:stage06:browser
```

Without `STAGE06_ARTIFACT_DIR`, the Stage 06 harness writes screenshots to a
unique temporary directory and removes both that directory and its isolated
Chrome profile after success or failure, leaving the repository unchanged.

Stage 07 likewise uses unique temporary Chrome-profile and artifact directories
and cleans both in `finally`. Set `STAGE07_ARTIFACT_DIR` to retain an explicit
JSON report and screenshot. The gate builds and runs with `next start`, forces
optional Gateway credentials empty, and accepts `CHROME_PATH` for a non-default
Chrome location. Set `STAGE07_BASE_URL` to an explicit reviewed HTTP(S) deployment
URL to skip the local build/server and run the same journey against that target.
Do not embed credentials in the URL. Vercel must use `sme-growth-twin/` as its Root Directory;
`vercel.json` supplies the install/build commands.

For the first lockfile creation only, Stage 00 used `npm install`. Fresh
implementers should use `npm ci` thereafter.

Copy `.env.example` to `.env.local` only when a later approved stage introduces
a server-side model adapter. Stage 00 does not require environment variables.
Never commit `.env.local` or credentials. Stage 06 needs no external service or
new environment variable; its lead adapter and rate limiter are process-local.
