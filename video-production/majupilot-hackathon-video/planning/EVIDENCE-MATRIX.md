# MajuPilot video evidence matrix

Phase 1 fact lock. This matrix is the source of truth for later narration, overlays, and
scene copy. `Implemented` means the claim is supported by accepted implementation evidence
and/or the current public production UI. `Roadmap` means it is a future opportunity only.
Do not turn a planning estimate, historical baseline, or deferred scope into an implemented
claim.

## Competition claim matrix

| ID | Competition section | Claim / visual beat | Status | Primary receipt | Capture / wording guardrail |
|---|---|---|---|---|---|
| PROB-01 | Problem / Objectives | SME decisions need a sequence, prerequisites, cost range, and evidence trail—not a generic chat answer. | Framing | `planning/submission/DEMO-SCRIPT.md`; `README.md` | Treat as the problem framing, not a quantified market statistic. |
| OBJ-01 | Problem / Objectives | Five focused questions create an editable Business Twin and a practical path forward. | Implemented | Live `/` and `/assessment`; `README.md` | Show the five-step progress rail and the saved-draft boundary. |
| OBJ-02 | Problem / Objectives | Facts, unknowns, assumptions, calculations, catalogue facts, and model text stay visibly distinct. | Implemented | Live `/assessment/review`, `/results`, `/blueprint`; `README.md` | Use the product's own evidence labels; do not compress all output into “AI says”. |
| SOL-01 | Proposed Solution | MajuPilot provides an Answer → Diagnose → Compare → Blueprint → Handoff journey. | Implemented | Live home / journey rails; `README.md` | Use the branded route names; avoid calling it a CRM or a generic chatbot. |
| SOL-02 | Proposed Solution | Deterministic scores, rankings, scenarios, and ROI remain authoritative while optional AI adds bounded interpretation. | Implemented | Live home disclosures; `README.md`; P0 integration evidence | State that model output does not calculate or overwrite numeric truth. |
| SOL-03 | Proposed Solution | Fictional demonstration cases are labelled, and the demo does not create consent or a consultation lead merely by loading a case. | Implemented | Live home demo disclosure; live Case A banner | Keep the `FICTIONAL DEMONSTRATION` banner visible in the capture. |
| TECH-01 | Technical Approach / Design | Next.js product UI, versioned routes, deterministic core, Exabytes domain pack, Supabase persistence / private storage, optional Vercel AI Gateway, and a durable outbox form the production architecture. | Implemented | `README.md`; `planning/evidence/v2/production-integration/README.md`; accepted V2 ledger | Present as an architecture diagram; do not expose environment variables, secrets, or private URLs. |
| TECH-02 | Technical Approach / Design | Evidence-linked records trace claims back to the Business Twin and calculation versions. | Implemented | Live `/results` and `/blueprint`; Phase I evidence | Show one disclosure / provenance path rather than claiming universal explainability. |
| TECH-03 | Technical Approach / Design | Five specialist advisor lenses review a selected path; invalid or unavailable model output falls back per role. | Implemented | P0 integration evidence; Phase I proof; live Blueprint advisor panel | Say “five specialist reviews” and “bounded fallback”; do not claim unconstrained autonomous advice. |
| TECH-04 | Technical Approach / Design | Document RAG and arbitrary document ingestion are not part of the current product. | Roadmap / deferred P1 | `README.md`; V2 ledger; Phase I README | Must remain an explicit limitation; never show an upload-to-RAG flow. |
| DEMO-01 | Functional Prototype Demonstration | Home loads fictional Case A / Kopi Kita Café Group with fixture `1.0.0`; no real customer data is used. | Implemented | Live home / review; live Case A banner | Keep the fiction label and fixture visible. |
| DEMO-02 | Functional Prototype Demonstration | Case A diagnosis shows digital maturity `37.5` and AI readiness `42.5` out of 100, with six triggered pain findings. | Implemented | Live `/results`; `planning/evidence/v2/phase-i/browser/stage-07-browser-evidence.json` | Show exact values; do not round them into a stronger maturity claim. |
| DEMO-03 | Functional Prototype Demonstration | Case A recommendations are capability-first: three `why now`, one `next`, and governed AI `why later`. | Implemented | Live `/recommendations`; Phase I browser evidence | Catalogue products are supporting provenance, not quotes or live availability checks. |
| DEMO-04 | Functional Prototype Demonstration | Scenario lab compares Lean Foundation, Balanced Growth, and Accelerated AI; Balanced Growth is the selected path in the capture. | Implemented | Live `/scenarios`; Phase I browser evidence | Show planning assumptions and the “not an Exabytes quote” label. |
| DEMO-05 | Functional Prototype Demonstration | Case A Balanced Growth range: first-year cost RM9,200 / RM18,400 / RM27,600; operational value RM2,358 / RM7,254 / RM15,233; net value -RM25,242 / -RM11,146 / RM6,033; visible payback 7.2 / 30.4 / More than 60 months. | Implemented | Live `/scenarios` and `/blueprint`; Phase I browser evidence; Stage 4 capture | Call these conditional planning ranges, not ROI guarantees or vendor pricing. Preserve the capped production display label in every viewer-facing artifact. |
| DEMO-06 | Functional Prototype Demonstration | The Blueprint exposes 16 sections, evidence references, a selected plan, risks, advisor reviews, synthesis, methodology, and consultation handoff. | Implemented | Live `/blueprint`; P0 integration evidence | Do not imply a human consultant has accepted notes; current live run showed consultant notes empty. |
| DEMO-07 | Functional Prototype Demonstration | Consultation starts with required contact fields and unchecked explicit consent; its disclosure explains what would be shared. | Implemented | Live `/consultation`; P0 integration evidence | Show the form only; do not enter or submit contact data in capture. |
| TEST-01 | Testing / Validation | Hosted production-integration gates passed with 47 test files and 221 tests, TypeScript, ESLint, and a production build generating 38 static pages; one test was intentionally skipped. | Implemented evidence | `planning/evidence/v2/production-integration/README.md` | Attribute to the accepted hosted integration evidence; do not silently combine with Phase I local counts. |
| TEST-02 | Testing / Validation | The consolidated production smoke used a labelled fictional business and synthetic contact details and verified durable journey, report, consent / lead flow, signed delivery, guest denial, and live Copilot boundary. | Implemented evidence | `planning/evidence/v2/production-integration/README.md` | Use “verified in the consolidated smoke”; do not claim a real customer conversion or human response. |
| TEST-03 | Testing / Validation | Current release evidence reports required security headers, no horizontal overflow at tested desktop viewport, zero browser console errors, and no recent Vercel production error logs. | Implemented evidence | `planning/evidence/v2/production-integration/README.md` | Scope the claim to the recorded test environments and dates. |
| TEST-04 | Testing / Validation | Phase I local baseline: 47 test files / 220 tests passed, one file / test intentionally skipped, 35 static pages, and a 3.284-second guest-first keyboard journey. | Implemented historical baseline | `planning/evidence/v2/phase-i/README.md`; `release-proof.json` | Label this as the pre-hosted local proof; never present it as the current hosted count. |
| TEST-05 | Testing / Validation | The exact live model observed in the accepted production integration is `deepseek/deepseek-v4.1-flash`, behind a bounded Gateway path. | Implemented evidence | V2 ledger; P0 integration evidence; live Blueprint advisor status | Do not reveal credentials, prompts, raw model reasoning, or cost unless later approved for the script. |
| VALUE-01 | Industry Value / Future Potential | SMEs and advisors can move from evidence to an inspectable transformation plan and consented handoff. | Implemented positioning | `README.md`; live journey; P0 integration evidence | Say what the workflow enables; avoid promising business outcomes or vendor fulfilment. |
| VALUE-02 | Industry Value / Future Potential | The product preserves an honest boundary: no direct promise of human response, vendor fulfilment, or automatic CRM creation from the consultation UI. | Implemented boundary | Live `/consultation`; `README.md` | Use the exact disclosure language or a faithful paraphrase. |
| FUT-01 | Industry Value / Future Potential | Document RAG / arbitrary uploaded-document ingestion is a possible later expansion, not a current feature. | Roadmap / deferred P1 | `README.md`; V2 ledger; Phase I README | Use “future” or “deferred P1” every time; never say “MajuPilot already reads documents”. |
| FUT-02 | Industry Value / Future Potential | Future work can extend domain packs, evidence sources, integrations, and consultant workflows after the current boundary is validated. | Roadmap | Inference from accepted architecture and deferred scope | Present as opportunity, not a committed release date or accepted feature. |

## Locked numeric facts

- Canvas: 1920×1080, 30 fps.
- Working duration target: 9:40 inside the 9:35–9:45 window.
- Functional prototype window: 3:37.
- Case A: digital maturity `37.5`; AI readiness `42.5`.
- Case A Balanced Growth cost: RM9,200 / RM18,400 / RM27,600 low / base / high.
- Case A Balanced Growth operational value: RM2,358 / RM7,254 / RM15,233 low / base / high.
- Case A Balanced Growth net value: -RM25,242 / -RM11,146 / RM6,033 low / base / high.
- Case A Balanced Growth viewer-facing payback: 7.2 / 30.4 / More than 60 months best / base / worst.
- Blueprint size: 16 sections.
- Hosted P0 evidence: 47 test files, 221 tests passed, one intentionally skipped test, 38 static pages.
- Phase I local baseline: 47 test files, 220 tests passed, one intentionally skipped file / test, 35 static pages, 3.284 seconds to Blueprint.

## Prohibited claims

- No document RAG, arbitrary document ingestion, or upload-grounded Copilot claim.
- No claim that catalogue entries are live quotes, guaranteed availability, or vendor fulfilment.
- No claim that ROI ranges are predictions, guarantees, or observed customer outcomes.
- No claim of real customer data, real consultation contact data, or a completed human handoff.
- No credentials, secrets, private report URLs, raw prompts, or raw model reasoning. The user-authorized portrait may appear only in the opening identity card, not in the product-demo capture.
