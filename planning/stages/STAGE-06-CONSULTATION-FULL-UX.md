# Stage 06 — Consultation and Full UX

Status: **Frozen for implementation**
Authority: `MASTER-GAMEPLAN.md`, the approved execution orchestration, and the accepted Stage 05 source chain
Branch: `codex/stage-06-consultation-full-ux`

## 1. Objective

Complete the P0 journey from an immutable Stage 05 Blueprint to an explicit,
privacy-conscious consultation request. A successful submission creates one
consultant-ready lead record that references and contains the exact accepted
Blueprint, then returns a non-sensitive lead reference to the user.

Stage 06 also closes the responsive Blueprint-to-consultation UX. It does not
add a CRM, consultant administration interface, authentication, or deployment.

## 2. Required user journey

```text
Current Blueprint
  -> Request consultation
  -> Validate current Blueprint/source chain
  -> Review exactly what will be shared
  -> Enter contact details and urgency
  -> Explicitly accept versioned consent (unchecked by default)
  -> Submit once through a bounded same-origin API
  -> Receive success confirmation and lead reference
```

If the Blueprint is absent, corrupt, incompatible, or stale, consultation must
redirect safely to `/blueprint`. The form must never synthesize a replacement
Blueprint or silently submit an older one.

## 3. Frozen scope

### P0 implementation

1. Replace the Stage 05 consultation preview with an active, clear CTA to
   `/consultation` while preserving print behavior.
2. Add a responsive consultation page and success state consistent with the
   accepted warm-white, navy, seafoam/teal, restrained-coral visual system.
3. Load and validate the current local Assessment, Business Twin, Diagnostic,
   Recommendation, Scenario, and Blueprint chain before showing the form.
4. Prefill the business name from the Business Twin but allow the contact to
   correct the lead-facing business name.
5. Collect only:
   - contact name (required);
   - business name (required);
   - email (required);
   - phone (optional);
   - consultation urgency (required: `within_30_days`, `one_to_three_months`,
     `three_to_six_months`, or `exploring`);
   - explicit consent (required and unchecked);
   - an invisible empty honeypot field.
6. Show a readable pre-submit disclosure of the exact data categories shared:
   contact details; business profile bands; score summary; top five pain points;
   selected scenario and ROI assumptions; recommended capabilities and mapped
   offerings; advisor findings; Blueprint identity, evidence, and limitations.
7. State that contact details are not sent to the model and are not used to
   calculate scores, recommendations, ROI, or the Blueprint.
8. Submit through `POST /api/leads` with strict request/response schemas,
   bounded JSON input, stable error codes, `Cache-Control: no-store`, and no
   contact data in logs or response payloads.
9. Require consent in both the domain service and API boundary. Client-side
   validation is supplementary and cannot be the only enforcement.
10. Create one versioned `ConsentRecord` and one consultant-ready `Lead` that
    references and contains the exact Blueprint snapshot submitted by the
    validated client journey.
11. Use a client-generated submission ID for idempotency. Replaying the same
    valid submission returns the same lead reference and never creates a second
    lead.
12. Rate-limit new lead submissions with a bounded, privacy-minimizing
    server-side limiter. Do not key or log the limiter by email or phone.
13. Return only a safe receipt: lead reference, server timestamp, Blueprint ID,
    status, and replay flag. Never echo email, phone, raw answers, advisor text,
    or the Blueprint in the response.
14. Preserve only the safe receipt in browser `sessionStorage`; never persist
    contact fields in localStorage/sessionStorage.
15. Provide retryable error UX that preserves the in-memory form values and
    does not falsely claim success.
16. Add a server-only `LeadStore` port with an in-memory prototype adapter.
    This proves creation, lookup for tests, and idempotency without writing PII
    to the repository or browser. The UI must honestly avoid claiming that an
    email or CRM notification was sent.
17. Add unit, integration, render, and browser acceptance tests plus a documented
    Stage 06 browser command.

### P1 only if it does not threaten P0

- A print-safe success receipt without contact details.
- A “Return to Blueprint” action and a clearly separated “Start a new
  assessment” action.

## 4. Consent and lead contracts

Frozen constants:

- lead model version: `1.0.0`;
- lead storage version: `1.0.0`;
- consent wording version: `consultation-consent-1.0.0`;
- source campaign: `ai-horizon-2026`;
- initial lead status: `new`.

The consent statement must communicate, in plain English:

> I agree that my contact details and this assessment's Blueprint summary may
> be used to arrange an Exabytes consultation. I understand what will be shared
> and that I can request deletion.

The server supplies `consentedAt`. Client timestamps are ignored. The stored
record includes the exact wording/version, submission ID, Blueprint ID and
model version, and the Blueprint source identity.

The consultant-ready Lead contains:

- generated lead ID and timestamps;
- consent record;
- contact fields and urgency;
- employee band, industry, budget band, implementation pace;
- maturity/readiness score summaries;
- top five pain points;
- selected scenario identity and result;
- recommended capability and offering summaries;
- full immutable Blueprint snapshot;
- source campaign and lead status.

## 5. API behavior

`POST /api/leads`

- Accept only `application/json`.
- Enforce a maximum request size appropriate for one Blueprint (hard ceiling
  512 KiB).
- Reject malformed or extra fields.
- Use generated identifiers, never contact-derived identifiers.
- `201`: new lead receipt.
- `200`: idempotent replay of the same submission.
- `400 invalid_request`: malformed JSON/schema, honeypot, or content type.
- `422 consent_required`: consent is absent/false or consent version differs.
- `429 rate_limited`: bounded new-submission limit with `Retry-After`.
- `503 lead_unavailable`: safe storage/service failure.
- Never include stack traces or raw validation/provider details.

The prototype store is process-local by deliberate Stage 06 decision. The port
must permit a later PostgreSQL adapter without changing domain or UI contracts.
Durable multi-instance storage, authentication, consultant access, delivery,
and retention automation are production work and must not be faked.

## 6. UX contract

### Consultation form

- Desktop: main form plus sticky “What will be shared” summary; mobile: one
  column with disclosure before consent and submit.
- Reuse the accepted Brand, typography, colors, spacing, cards, and evidence
  language; do not introduce a dark SaaS or marketing aesthetic.
- Heading makes the step concrete: “Request an evidence-ready consultation.”
- Display the Business Twin name, selected scenario, Blueprint ID, and score
  summary so the user can verify the handoff target.
- Every field has a persistent label, hint/error association, autocomplete,
  and visible keyboard focus.
- Minimum interactive target 44 px; no horizontal overflow at 360 px.
- Consent cannot be bundled with marketing permission or preselected.
- Disable duplicate submission while pending, but provide a finite failure
  state and retry.

### Success state

- State that the request was recorded, not that a human has already reviewed
  it or that an email/CRM delivery occurred.
- Show lead reference, submitted time, Blueprint ID, and expected next step.
- Do not display or persist submitted email/phone.
- Provide Return to Blueprint and Start a new assessment actions.

### Full-journey integration

- The Blueprint CTA is visible on screen but excluded from printed output.
- Existing deterministic results, exact Case A figures, print layout, source
  identity, and model/fallback disclosures remain unchanged.
- Back navigation from consultation returns to the same Blueprint.
- Direct navigation to consultation without a current Blueprint fails safely.

## 7. Security and privacy acceptance

- No contact value is passed to an LLM, analytics event, console, URL, error
  message, response, or browser persistence.
- The server owns timestamps, lead IDs, status, campaign, and consent record.
- Request and response schemas reject unbounded or unknown fields.
- A failed store operation cannot produce a success receipt.
- Idempotency is scoped to the submitted request ID and rejects reuse with a
  materially different payload.
- The rate limiter does not use contact information.
- API and UI use stable safe messages.

## 8. MiroFish reference decision

Retain and adapt MiroFish's staged report-to-interaction responsibility and
stable project/report identity. Replace its local JSON/filesystem state,
traceback-style route errors, and implicit security assumptions with typed
versioned Lead/Consent contracts, a storage port, stable safe errors,
idempotency, and explicit consent. Omit report chat and agent interview from
this stage.

## 9. Protected and out-of-scope work

- No email, webhook, CRM, or external Exabytes send.
- No consultant/admin lead listing endpoint or UI.
- No authentication or multi-tenant ownership.
- No PostgreSQL/Supabase provisioning or deployment.
- No server-side PDF generator.
- No report chat, stakeholder interview, file ingestion, or new model calls.
- No changes to frozen scores, pain order, catalogue, recommendations,
  scenarios, ROI, advisor rules, or Blueprint numeric/content contracts.
- No Stage 07 submission, video, dependency scanning, or broad polish work.

## 10. Expected implementation boundaries

Expected additions include:

- `src/domain/leads.ts`;
- `src/core/leads/create-lead.ts`;
- `src/infrastructure/leads/lead-store.ts` and prototype adapter;
- `src/infrastructure/leads/rate-limit.ts`;
- `src/app/api/leads/route.ts`;
- `src/app/consultation/page.tsx`;
- `src/components/consultation/consultation-client.tsx`;
- safe receipt session-store helper;
- Stage 06 tests and browser harness;
- focused Blueprint CTA/style changes;
- README and architecture notes.

Names may vary when existing boundaries justify it, but the domain core must
not import React, Next.js, browser globals, or Exabytes-specific IDs.

## 11. Required verification

The implementation task must run:

```text
npm run lint
npm run type-check
npm test
npm run build
npm run test:stage06:browser
git diff --check
```

Tests must prove at minimum:

- false/missing consent creates zero leads;
- valid consent creates exactly one Lead and ConsentRecord;
- stored Lead contains the exact Blueprint ID, source identity, selected
  scenario, scores, capabilities, and immutable Blueprint snapshot;
- same submission replay returns the same lead; changed-payload reuse fails;
- new submissions hit the configured rate limit;
- response and errors contain no contact data;
- no contact fields are written to browser storage;
- missing/stale Blueprint blocks the form;
- validation failures preserve entered fields;
- Case A Blueprint-to-lead succeeds with exact accepted figures;
- desktop and 360 px have no overflow, minimum targets remain usable, keyboard
  order works, consent defaults unchecked, console is clean, and the success
  state returns a lead reference;
- Blueprint print output remains legible and omits the interactive CTA.

## 12. Acceptance gate

Stage 06 is accepted only when the main task independently verifies the diff,
all required commands, the browser journey, security/privacy behavior, and CI.
Acceptance evidence is recorded in `STAGE-LEDGER.md`. Stage 07 remains locked
until then.
