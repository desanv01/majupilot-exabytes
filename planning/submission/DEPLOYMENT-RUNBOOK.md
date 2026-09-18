# Vercel deployment runbook

External deployment is performed only by the main integration task with the actual Vercel account. This implementer has not created, promoted, or rolled back a deployment.

## Project configuration

1. Set the Vercel project Root Directory to `sme-growth-twin` (or use `vercel --cwd sme-growth-twin`).
2. Framework preset: Next.js. Node.js must satisfy `>=22.12.0`; select Node 22 or newer.
3. The app-local `vercel.json` pins `npm ci` and `npm run build`.
4. No variable is required for deterministic fallback. Optional server-only variables are `AI_GATEWAY_MODEL` and either `AI_GATEWAY_API_KEY` or `VERCEL_OIDC_TOKEN`. Never use a `NEXT_PUBLIC_` prefix.
5. Label the URL/release notes “fictional-data hackathon prototype”; do not present it as a durable lead system.

## Preview and inspection

```powershell
vercel --cwd sme-growth-twin
vercel inspect <preview-url>
vercel logs <preview-url>
```

Record URL, target, `READY`/error status, commit SHA, detected framework, and build duration in the release manifest. If protected, authenticate the test session without exposing tokens in screenshots or logs.

## Required deployed verification

Verify browser → API → data → response for: home headers and demo labels; one complete fictional Case A fallback journey; `/api/advisors/review` with credentials absent; consultation validation/default-unchecked consent; fictional submission safe receipt/idempotent replay; reset; 360 px; console/network/runtime logs. Never submit real contact data. Confirm no credential appears in client assets.

## Promotion

Promote the already verified preview rather than rebuilding a different artifact:

```powershell
vercel promote <verified-preview-url>
vercel inspect <production-url>
vercel logs <production-url>
```

Promotion remains pending until main-task review.

## Failure recovery and rollback

- Build failure: inspect logs, verify Root Directory, Node version, lockfile, and missing optional variables; deterministic build must not require Gateway credentials.
- Runtime advisor failure: verify the deterministic five-role fallback completes; do not block the Blueprint on provider recovery.
- Lead process restart: explain that process-local records are non-durable; do not claim recovery.
- Production regression: run `vercel rollback <known-good-deployment-id-or-url>` or restore the previous production alias, then verify home/API/logs again. Record the rollback target before promotion.
