# Stage 07 test evidence

Date: 18 September 2026 (Asia/Kuala_Lumpur)
Environment: Windows local checkout; Node.js 24.x; npm 11.x; Next.js production mode for Stage 07 browser evidence; model credentials intentionally absent.

Reviewed deployment: <https://sme-growth-twin.vercel.app> (`dpl_6UcGRsMhFfhKQyN339CLsn8zbfcB`, Vercel `READY`, Next.js 16.3.5). GitHub PR #6 quality-gate run 15 passed for reviewed implementation commit `1a6ac740ac903f5fe7e8c634ef4411ee38bec412`.

## Frozen golden outputs

| Case | Digital / AI | Recommendation order (`status`) | Selected scenario | First-year cost low/base/high | Operational value low/base/high | Net value low/base/high | Viewer payback best/base/worst |
|---|---|---|---|---|---|---|---|
| A — Kopi Kita | 37.5 / 42.5 | customer operations (`why_now`), collaboration (`why_now`), continuity (`why_now`), protected web (`next`), governed AI (`why_later`) | Balanced Growth | 9,200 / 18,400 / 27,600 | 2,358 / 7,254 / 15,233 | -25,242 / -11,146 / 6,033 | 7.2 / 30.4 / More than 60 months |
| B — Precision Parts | 23.2 / 43.8 | collaboration (`why_now`), digital growth (`why_now`), customer operations (`why_now`), continuity (`next`), governed AI (`why_later`) | Balanced Growth | 7,400 / 14,800 / 22,200 | 2,738 / 8,424 / 17,690 | -19,462 / -6,376 / 10,290 | 5.0 / 21.1 / More than 60 months |
| C — Northstar | 79.0 / 73.8 | customer operations (`why_now`), governed AI (`why_now`), scalable cloud (`why_now`) | Balanced Growth | 22,400 / 44,800 / 67,200 | 913 / 2,808 / 5,897 | -66,287 / -41,992 / -16,503 | 45.6 / More than 60 months / More than 60 months |

All three produce five deterministic fallback advisor origins and all 16 required Blueprint sections when credentials are absent. These are scenario estimates, not real-world outcome claims.

## Command record

| Command | Final result |
|---|---|
| `npm ci` | Pass; 383 packages installed, 384 audited, 0 vulnerabilities |
| `npm run lint` | Pass; 0 errors and 0 warnings |
| `npm run type-check` | Pass |
| `npm test` | Pass; 24 files, 137 tests |
| `npm run build` | Pass; production route build and static generation completed |
| `npm run test:stage05:browser` | Pass; deterministic fallback Blueprint, all 16 sections, desktop/mobile/print checks, 0 console errors |
| `npm run test:stage06:browser` | Pass; consent, validation, safe receipt, replay, keyboard order, desktop/mobile/print checks, 0 console errors |
| `npm run test:stage07:golden` | Pass; 1 file, 2 tests, all A/B/C frozen outputs exact |
| `npm run test:stage07:security` | Pass; 1 file, 8 tests; 187 tracked text files scanned; 0 credential-shaped values; 0 client model-provider imports |
| `npm run test:stage07:browser` | Pass; production-mode three-fixture and keyboard journey evidence below |
| `npm run release:offline` | Pass; final offline alias reran the production build and Stage 07 browser gate |
| `npm run audit:production` | Pass; 0 vulnerabilities |
| `git diff --check` | Pass |

The Stage 07 browser command and its offline-release alias each include a fresh production build. `npm run release:manifest` is run after this evidence file is frozen so its hash covers this record.

## Browser/security acceptance fields

The hermetic `test:stage07:browser` report records representative axe critical/serious totals, Case A keyboard completion and duration, desktop/360 overflow and target-height results, actual production headers, console errors, overlays, failed same-origin requests, safe receipt, and scoped reset. By default its unique artifact/profile directories are removed in `finally`; set `STAGE07_ARTIFACT_DIR` to retain an explicit reviewed report/screenshot directory.

Final local browser result:

- Case A keyboard journey completed through consultation success in 2,722 ms on the correction validation run; safe receipt check passed.
- Cases A, B, and C matched frozen scores, recommendation ordering/status, Balanced Growth selection, cost, operational value, net value, payback, five fallback origins, and 16 Blueprint sections.
- 12 axe state scans reported 0 critical/serious findings, covering home, assessment, review, results, recommendations, scenarios, Blueprint, consultation, consultation success, and mobile Blueprint.
- 21 desktop/360 route-state layout checks reported no horizontal overflow, no framework overlay, and a smallest routine target height of at least 44 px.
- Home reset stayed on `/`, removed the demo banner in the same tab without reload, cleared every known local/session key, preserved unrelated storage, and displayed reset status. The banner reset path also passed.
- The browser gate defaults to a hermetic local production build/server and supports an explicit credential-free `STAGE07_BASE_URL` mode that skips local startup for deployed verification.
- Production headers passed: CSP with `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, strict-origin referrer policy, and restrictive permissions policy.
- Console errors: 0. Failed same-origin fetch/XHR requests: 0. Framework error overlays: 0.

Final deployed browser result:

- The same harness ran in external mode against <https://sme-growth-twin.vercel.app> without starting a local server.
- Cases A, B, and C matched every frozen output, five fallback origins, and 16 Blueprint sections.
- The keyboard journey completed through Blueprint in 6,481 ms; safe receipt, same-tab home reset, banner reset, scoped-key clearing, unrelated-storage preservation, and reset status all passed.
- All 12 axe scans and 21 desktop/360 layout checks passed; production headers matched policy; console errors, failed same-origin requests, framework overlays, and Vercel runtime-error clusters were all zero.

Known limitations: axe is automated coverage rather than a full assistive-technology audit; timings are environment-specific; the hashed-IP limiter and lead store are per-process/per-instance; live Gateway execution remains optional and was not required for the verified deterministic fallback release.
