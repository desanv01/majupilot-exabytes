# P0 hosted production integration evidence

Date: 2026-09-20

This release wave connects the accepted A-I implementation to the hosted runtime and promotes the MajuPilot product identity across the complete user journey. It does not enable the separately deferred Document RAG P1 scope.

## Hosted foundations

- Hosted Supabase project linked without storing credentials in Git.
- Ten local and remote migrations aligned, including the catalogue read-policy consolidation.
- Hosted schema lint completed with no warnings.
- `majupilot-reports` and `majupilot-exports` remain private with the expected PDF and JSON/ZIP constraints.
- Vercel Development, Preview, and Production environments received the non-empty application settings through the authenticated CLI. Secret values were never printed or committed.
- `CRON_SECRET` protects the bounded `/api/cron/outbox` scheduler route; unauthenticated access returns HTTP 401.

## Consolidated release proof

The consolidated smoke runs from a new browser profile and uses only a labelled fictional business and synthetic contact details. It verified:

- MajuPilot branding with no legacy product name on the product surface.
- `/v2` redirects into the product Copilot rather than an internal phase-preview page.
- Exact live model `deepseek/deepseek-v4.1-flash` through Vercel AI Gateway.
- Five live advisor reviews with strict evidence validation and one bounded retry for malformed model output.
- Durable hosted persistence of the assessment-to-Blueprint chain.
- Deterministic five-page PDF, SHA-256 content hash, private storage, and a valid short-lived signed PDF download.
- Explicit consent records, durable lead creation, and deterministic assignment.
- Signed external webhook accepted with HTTP 200, completed outbox state, and persisted `delivery.succeeded` audit event.
- Guest access to internal lead-event history denied with HTTP 403.
- Live persisted Transformation Copilot turn grounded in the saved journey.
- Required security headers, no horizontal overflow at the tested desktop viewport, and zero browser console errors.

Final local gates: 47 test files passed with 221 tests passed and one intentionally skipped; TypeScript passed; ESLint passed; the production build compiled and generated 38 static pages.

## Release acceptance

- PR [#11](https://github.com/desanv01/majupilot-exabytes/pull/11) merged as `b825ab6` after the required `validate` and Vercel checks passed.
- The preview deployment completed successfully. Its public URL remained behind Vercel Deployment Protection, so it was not falsely treated as the application surface.
- The merged commit deployed successfully to `https://majupilot-exabytes.vercel.app/`.
- The complete consolidated release proof passed against that public production URL.
- Desktop visual inspection confirmed the branded MajuPilot home and Transformation Copilot surfaces with no legacy brand, no internal phase copy, and no horizontal overflow.
- Vercel reported no recent production error logs after the proof.
