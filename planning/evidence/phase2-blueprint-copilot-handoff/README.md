# Phase 2 Blueprint-to-Copilot handoff evidence

This folder records the bounded local browser proof for the Phase 2 handoff. The
scenario uses synthetic café data and intercepts the durable-journey and Copilot
API requests, so it does not read or write customer data.

## Covered flow

- Blueprint generation visibly enters `Saving evidence` before any ready claim.
- `Continue to Copilot` appears only after the full durable chain is acknowledged.
- The deep link carries the exact assessment-session and blueprint identifiers.
- Refresh resumes the current durable journey.
- A mismatched assessment link is denied before Copilot session creation.
- Regeneration invalidates the prior handoff and creates a new artifact set.
- Failed synchronization exposes retry without a false ready claim or Copilot action.
- Retry reuses the failed write set instead of duplicating immutable evidence.
- Desktop and mobile layouts have no horizontal overflow and retain 44px targets.
- Axe, console-error, and failed-request collections are empty.

## Artifacts

- `browser-proof.json` — machine-readable assertions and identifiers.
- `ready-desktop.png` — ready-state handoff at 1440px.
- `ready-mobile.png` — ready-state handoff at 390px.
- `sync-failure.png` — failed synchronization with the retry action.

Run the proof with:

```powershell
npm run test:phase2:browser
```

The hosted 12ui alignment pass was not run because the environment security
review blocked uploading local screenshots to an external service. The captured
screens were instead inspected locally for hierarchy, responsive behavior, state
truthfulness, and alignment with the approved design language.
