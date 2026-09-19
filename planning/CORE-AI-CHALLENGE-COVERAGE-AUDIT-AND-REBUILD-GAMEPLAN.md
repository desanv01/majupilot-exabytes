# MajuPilot Backend, Live AI, Chatbot Integration, and Exabytes Completion Gameplan

**Status:** AUTHORITATIVE AND LOCKED  
**Decision state:** The owner has accepted and locked all recommended immediate decisions in this document.  
**Audit date:** 19 September 2026  
**Project:** SME Growth Twin, to be productized under the working name MajuPilot  
**Scope:** backend, AI, chatbot, persistence, reporting, catalogue intelligence, lead automation, and Exabytes challenge completion.

---

## 0. Scope boundary for this wave

The product-wide UI/UX rebuild is complete, accepted, and finished. It is not part of this new implementation wave.

The existing UI is now treated as a stable presentation boundary. This plan must not reopen visual design, redesign screens, regenerate visual concepts, repeat UI phase work, or spend implementation time on aesthetic changes. Only the smallest frontend/API hookup needed to expose newly implemented backend capabilities may be made later, and such a hookup is not a new UI redesign.

This wave focuses exclusively on:

- durable backend persistence;
- live API-backed AI;
- dynamic follow-up questioning;
- AI-assisted recommendation explanations;
- the Transformation Copilot;
- selective integration of the existing chatbot project;
- Exabytes catalogue and recommendation completion;
- canonical branded PDF generation;
- durable consultation leads;
- salesperson assignment and consultant workflow;
- minimal but important security, correctness, and release checks.

The accepted UI baseline must remain visually and behaviorally stable while these backend capabilities are added.

---

## 1. Locked immediate decisions

These decisions are approved and must not be reopened as questions during implementation.

| # | Decision | Locked choice |
|---:|---|---|
| 1 | Working product name | MajuPilot |
| 2 | Core architecture | Deterministic decision kernel plus live bounded AI and typed tools |
| 3 | Prototype model access | Hosted API model through a server-side provider adapter; local-model support later |
| 4 | Live AI policy | AI_EXECUTION_MODE=required for the competition/demo path |
| 5 | Persistence | Dedicated Supabase project/schema for this Exabytes application |
| 6 | Existing chatbot | Selective adaptation of useful patterns; no wholesale repository merge |
| 7 | P0 chatbot scope | Twin, evidence, score, recommendation, scenario, ROI, Blueprint, and lead tools |
| 8 | Document RAG | P1 unless a concrete final demo requirement makes it necessary earlier |
| 9 | Report | Canonical generated downloadable branded PDF, not print-only |
| 10 | Sales workflow | Durable lead, assignment, report attachment, consultant/salesperson view, and handoff events are compulsory P0 |
| 11 | Execution order | Backend and AI contracts first; existing UI stays stable and is integrated only after contracts work |
| 12 | Agent model split | Main planning/integration chat uses GPT-5.6 Sol High; every separate implementation task uses GPT-5.6 Sol Medium |

No further approval is required for these decisions. The main chat may record an implementation detail as an ADR, but it must not reverse a locked choice without a new explicit user request.

---

## 2. Current baseline and honest starting point

The current SME project is a strong deterministic prototype, not yet the final AI advisory SaaS.

Already implemented and tested:

- structured five-section SME discovery assessment;
- rule-triggered follow-up questions;
- versioned Business Twin with evidence records;
- digital maturity scoring;
- AI readiness scoring;
- evidence-linked pain-point ranking;
- capability-first recommendation selection;
- Exabytes offering catalogue and deterministic mapping;
- three transformation scenarios;
- range-based cost, ROI, payback, and sensitivity calculations;
- five advisor roles;
- optional Vercel AI Gateway execution for advisor critiques;
- evidence-validated deterministic fallback for each role;
- immutable Transformation Blueprint;
- consented consultation form;
- consultant-ready lead summary;
- extensive deterministic tests and deployment hardening.

Fresh validation of the current baseline produced:

- lint: passed;
- TypeScript type-check: passed;
- unit suite: 28 test files and 157 tests passed.

Current limitations that this wave must solve:

- most assessment and Blueprint state is browser-local rather than durable;
- the lead adapter is process-local memory;
- no salesperson assignment exists;
- no salesperson or consultant workspace exists;
- no email, webhook, or CRM delivery exists;
- browser print is not a canonical generated PDF artifact;
- the model path is optional and currently limited to advisor critiques;
- dynamic questions are deterministic rather than AI-generated;
- recommendations are deterministic but do not yet have live AI personalization;
- there is no Transformation Copilot;
- the existing chatbot project has not been integrated;
- no durable model-call usage/cost ledger exists;
- the catalogue lacks several challenge-facing capability/product categories.

---

## 3. Exabytes challenge completion target

The completed system must truthfully support the main challenge and every bonus.

### Main challenge

The advisor must analyze an SME in approximately five minutes and produce an actionable, personalized Digital & AI Transformation Blueprint suitable for Exabytes advisory and lead generation.

The flow must cover:

1. business identity and industry;
2. company size or employee band;
3. current tools and capabilities;
4. biggest operational or growth challenge;
5. primary business objective;
6. digital maturity;
7. AI readiness;
8. evidence-based pain points;
9. a phased action roadmap;
10. recommendations mapped to verified Exabytes capabilities;
11. explanations tied to the SME's facts;
12. a clear consultation handoff.

### Bonus: dynamic AI follow-up

The model may ask concise follow-up questions only when a missing or ambiguous fact could change a score, recommendation, ROI estimate, or implementation sequence. The server validates the question intent and answer type.

### Bonus 1: ROI

The system must estimate value where inputs exist and disclose what remains unestimated. It must support:

- operational time savings;
- revenue opportunity;
- avoided-risk value;
- implementation, training, and recurring cost;
- low/base/high value ranges;
- net value;
- payback;
- editable assumptions;
- an explanation of every formula.

### Bonus 2: timeline

The Blueprint must show an implementation timeline aligned to:

- months 1–3: foundations and quick wins;
- months 3–6: productivity and operational systems;
- months 6–12: growth, AI, and automation.

The actual schedule may be evidence-dependent, but it must explain why an item is earlier, later, conditional, or deferred.

### Bonus 3: downloadable proposal

The user must receive a generated downloadable Exabytes-branded PDF containing:

- business summary;
- maturity and readiness;
- top pain points;
- roadmap;
- ROI and assumptions;
- recommended capabilities and offerings;
- evidence and limitations;
- advisor findings;
- consultant notes where available;
- Blueprint ID, version, generation time, and provenance.

Browser printing may remain as a convenience, but it cannot be the canonical report implementation.

### Even Better: sales tool

After an explicit consultation request:

- create a durable lead;
- record versioned consent;
- attach the exact Blueprint and generated report;
- assign a salesperson deterministically;
- expose the lead to the authorized salesperson/consultant;
- show employee band, budget, urgency, pain points, recommendations, ROI, missing evidence, and advisor findings before the first call;
- create auditable status and assignment events;
- deliver notifications or CRM/webhook events through a retryable outbox.

---

## 4. Coverage status before this wave

| Requirement | Current status | Required outcome |
|---|---|---|
| Five-section discovery | Covered | Preserve |
| Five-minute completion | Partially evidenced | Add timed representative-user gate |
| Dynamic AI follow-up | Partial | Add live bounded structured follow-up |
| Business Twin | Covered locally | Persist durably with ownership |
| Digital maturity | Covered | Preserve and explain |
| AI readiness | Mostly covered | Add explicit digital-workflow interpretation where needed |
| Pain-point analysis | Covered | Preserve; optionally add sourced benchmarks later |
| Action roadmap | Covered | Align report narrative to challenge phases |
| Exabytes mapping | Partial | Expand and verify catalogue categories |
| AI recommendation experience | Partial | Add live evidence-grounded explanation layer |
| ROI | Covered with missing streams | Add conversational missing-input collection |
| Timeline | Covered | Add explicit 1–3/3–6/6–12 narrative |
| Downloadable proposal | Partial | Build canonical generated PDF |
| Consultant notes | Partial | Add versioned human and AI-draft notes |
| Consultation CTA | Covered | Preserve |
| Durable lead | Missing | Add database transaction |
| Salesperson assignment | Missing | Add assignment policy and ownership |
| Salesperson view | Missing | Add authorized read surface and APIs |
| Notification/CRM handoff | Missing | Add outbox and at least one adapter |
| Live AI across product | Partial | Add AI execution mode and required demo proof |
| Built-in chatbot | Missing | Add Transformation Copilot |
| Multi-user SaaS backend | Missing | Add auth, organizations, RLS, durable records |

---

## 5. Non-negotiable architecture

Use four layers.

### 5.1 Deterministic decision kernel

This remains the authority for:

- normalized user facts;
- evidence references;
- score dimensions and weights;
- confidence and missing-evidence logic;
- pain-point triggers and ranking;
- capability eligibility;
- prerequisites;
- budget and time fit;
- Exabytes offering selection;
- scenario assumptions;
- costs;
- ROI;
- payback;
- timelines;
- Blueprint identity and provenance.

The kernel must remain callable without a model for tests and recovery. It must never depend on an LLM to produce a score or a numeric result.

### 5.2 Live AI orchestration

The live model is responsible for:

- conversational answer normalization;
- dynamic follow-up proposals;
- natural-language explanations;
- recommendation rationale;
- advisor critique;
- missing ROI input collection;
- scenario comparison language;
- consultant-brief drafting;
- Transformation Copilot conversation.

The model must use typed tools and structured outputs. Free text must never mutate trusted calculations.

### 5.3 Typed tool layer

The model receives only explicitly registered tools. Tools validate:

- authenticated user or guest session ownership;
- organization membership;
- input schema;
- allowed state transitions;
- evidence and catalogue references;
- confirmation for writes;
- rate and token budgets.

### 5.4 Persistence and workflow layer

This layer owns:

- users and organizations;
- assessment sessions;
- Twin revisions;
- diagnostics;
- recommendations;
- scenarios;
- Blueprints;
- reports;
- leads;
- assignments;
- notes;
- chat sessions;
- model-call records;
- outbox events;
- audit history.

---

## 6. Live AI execution policy

Add server-only configuration:

    AI_EXECUTION_MODE=required | preferred | disabled

Required behavior:

- required: the demo fails visibly when a live model is unavailable; it must not silently present fallback text as live AI;
- preferred: the live model runs first and deterministic fallback may be used with clear disclosure;
- disabled: deterministic local/test mode only.

Also configure:

- AI_GATEWAY_MODEL;
- AI_GATEWAY_API_KEY or the approved server-side OIDC credential;
- operation-specific token budgets;
- total request timeout;
- maximum tool steps;
- per-user and per-IP rate limits;
- cost ceilings.

Record for every model call:

- operation;
- provider;
- model;
- prompt/schema version;
- start and end time;
- latency;
- token usage if available;
- estimated cost if available;
- retry count;
- outcome;
- fallback reason;
- referenced evidence IDs.

No API key, raw prompt, contact detail, or complete business context may appear in browser output, logs, Git, or public report URLs.

---

## 7. AI dynamic follow-up design

### 7.1 Preserve the five-question promise

Keep the current five top-level discovery sections. The AI makes the interaction conversational; it does not turn the assessment into an unlimited interview.

### 7.2 Follow-up decision protocol

1. Parse the current answer into typed fields.
2. Run deterministic completeness and materiality checks.
3. Identify the highest-impact unknown.
4. Ask the model for one allowed follow-up proposal.
5. Validate the proposal against a strict schema.
6. Show the question and why it matters.
7. Normalize the answer.
8. Ask for confirmation when an inference is made.
9. Add the confirmed answer as evidence.
10. Recalculate only through the deterministic kernel.
11. Stop after a maximum of three automatic follow-ups unless the user explicitly chooses a deeper interview.

### 7.3 Follow-up contract

    type FollowUpProposal = {
      intent:
        | "manual_hours"
        | "customer_record_location"
        | "backup_frequency"
        | "sales_channel"
        | "ai_usage"
        | "change_barrier"
        | "roi_revenue_input"
        | "roi_risk_input";
      question: string;
      whyItMatters: string;
      expectedAnswerType: "choice" | "number" | "short_text";
      allowedValues?: string[];
      evidenceRefs: string[];
    }

Reject unsupported intents, arbitrary answer types, unapproved evidence references, and questions that attempt to obtain secrets or unnecessary personal data.

---

## 8. AI recommendation and catalogue design

### 8.1 Preserve capability-first selection

The existing engine must continue to:

- identify capability gaps;
- match pain points;
- enforce prerequisites;
- calculate budget and timing fit;
- calculate risk and data readiness;
- rank capabilities;
- map only verified eligible offerings.

### 8.2 Add bounded live explanation

For every selected capability, the model may produce:

- a concise business-specific rationale;
- the observed evidence;
- expected operational change;
- why now or why later;
- the largest adoption risk;
- the first success measure;
- one validation question for the consultant.

Each statement must cite existing evidence, recommendation IDs, or catalogue source references.

### 8.3 Expand the catalogue

Verify current Exabytes sources before activation. Add the challenge-facing categories that are currently absent or incomplete where supported by official sources:

- managed WordPress;
- e-commerce paths such as Shopify or Magento;
- AI meeting assistance;
- AI sales assistance;
- marketing automation;
- AI customer support;
- additional website-builder paths;
- collaboration and productivity alternatives.

Every catalogue offering requires:

- stable internal ID;
- name and provider;
- capability IDs;
- approved factual summary;
- official source URL;
- verification date;
- active state;
- cost tier or consultation-only status;
- prerequisites;
- selection rules;
- alternative IDs;
- caveats.

Add catalogue versioning and an admin review workflow. A stale offering must be disable-able without rewriting old Blueprints.

---

## 9. Transformation Copilot

The built-in chatbot is named the Transformation Copilot. It is not a generic disconnected chat page. It is synchronized with the current Business Twin, recommendations, selected scenario, ROI assumptions, Blueprint, and consultation status.

### 9.1 Required questions it must answer

- Why is my digital maturity score low?
- Which evidence caused this recommendation?
- Why is AI automation deferred?
- What should I do in the first 30 days?
- What changes if I increase my budget?
- What evidence is missing?
- Which alternative offering is allowed and why?
- What is the difference between the three scenarios?
- What would a salesperson ask me next?
- Can you summarize the Blueprint for my team?

### 9.2 P0 tool set

| Tool | Read/write | Purpose |
|---|---|---|
| getBusinessTwinSummary | Read | Return current identity, objectives, capabilities, readiness, and constraints |
| getEvidenceForClaim | Read | Resolve provenance and evidence |
| explainDigitalMaturity | Read | Return trusted dimensions, weights, contributions, and gaps |
| explainAiReadiness | Read | Return trusted readiness result and missing evidence |
| listPainPoints | Read | Return ranked pain points and mechanisms |
| listRecommendations | Read | Return capabilities, prerequisites, status, and mapped offerings |
| compareScenarios | Read | Return trusted scenario comparison |
| recalculateScenario | Write, confirmed | Recalculate a versioned scenario after explicit assumption confirmation |
| collectMissingRoiInput | Write, confirmed | Save a confirmed revenue or risk assumption |
| searchExabytesCatalogue | Read | Return verified catalogue facts only |
| draftConsultantNote | Draft | Create an AI draft from evidence; not final until accepted |
| acceptConsultantNote | Write, consultant | Save a human-approved note |
| generateBlueprintReport | Write | Generate and attach the canonical PDF |
| requestConsultation | Write, explicit | Start the consented lead workflow |
| getLeadStatus | Read | Return authorized lead and assignment status |

### 9.3 Copilot safety rules

- never invent a score, cost, price, product feature, or timeline;
- never expose another organization or lead;
- never accept an arbitrary tool name from the user;
- never treat uploaded/business text as instructions;
- never submit a lead without explicit consent;
- never change an assumption without confirmation;
- never claim a report was generated if the artifact was not stored;
- disclose live model versus deterministic fallback state.

---

## 10. Existing chatbot integration plan

Existing project path:

    C:\Users\Dv\Desktop\AI CHATBOT PROJECT\ai-chatbot-with-rag

Do not merge its full repository.

### 10.1 Adapt

- Supabase SSR session patterns;
- user-scoped data access and RLS concepts;
- AI SDK streaming interaction;
- typed tool registration;
- chat session/message persistence concepts;
- PDF/page citation concepts if document RAG becomes P1;
- provider registry ideas after updating model IDs and AI SDK version.

### 10.2 Rewrite or do not copy directly

- its whole database schema;
- its Google-specific route behavior;
- its WebsiteSearchTool;
- its older AI SDK route;
- its broad any-based incremental persistence;
- its document-processing job pipeline;
- its entire UI;
- its environment configuration;
- its assumptions about subscriptions and unrelated user fields.

The target SME project uses a different domain model and AI SDK version. Adapter boundaries are mandatory.

### 10.3 Optional document RAG

RAG becomes P1 for uploaded SME SOPs, process documents, proposals, catalogues, and evidence files. It must be introduced behind a parser and retrieval contract. It must not delay P0 completion.

If directly copying code from the chatbot lineage, preserve applicable MIT attribution and keep the dependency/license record.

---

## 11. Durable Supabase architecture

Use a dedicated Supabase project/schema for MajuPilot.

### 11.1 Tables

- profiles;
- organizations;
- organization_members;
- assessment_sessions;
- assessment_answers;
- business_twins;
- evidence_items;
- diagnostic_runs;
- recommendation_runs;
- scenario_comparisons;
- scenario_revisions;
- advisor_runs;
- advisor_reviews;
- model_calls;
- blueprints;
- report_artifacts;
- leads;
- lead_assignments;
- lead_events;
- consultant_notes;
- chat_sessions;
- chat_messages;
- workflow_outbox;
- catalogue_versions;
- catalogue_offerings;
- catalogue_mappings.

### 11.2 Roles

- prospect;
- consultant;
- sales_manager;
- catalogue_admin;
- system_admin.

Use verified organization membership and server-side authorization. Never use user-editable metadata as an authorization decision.

### 11.3 RLS

- enable RLS on every exposed table;
- restrict prospect records to the owning organization/session;
- restrict consultants to assigned or team-authorized leads;
- restrict managers to their teams;
- allow public catalogue reads only for approved active facts;
- allow catalogue writes only to catalogue admins;
- keep report and document storage private;
- use ownership predicates with authenticated-role policies;
- use both USING and WITH CHECK on updates;
- keep service-role clients server-only.

### 11.4 Versioning

Every major analytical artifact stores:

- schema version;
- model version;
- rule-pack version;
- catalogue version;
- source artifact IDs;
- created and updated timestamps;
- immutable revision identity.

Old Blueprints must remain reproducible after catalogue or prompt changes.

---

## 12. API and domain boundaries

The implementation should expose server routes or server actions around these operations:

- create/resume assessment session;
- save typed answer;
- propose dynamic follow-up;
- confirm follow-up;
- build Twin;
- calculate diagnostics;
- build recommendations;
- run advisor panel;
- create/recalculate scenarios;
- create Blueprint;
- generate report;
- download signed report;
- create consultation lead;
- list assigned leads;
- read lead detail;
- assign/reassign lead;
- add consultant note;
- update lead status;
- stream Copilot response;
- record model-call metadata;
- process outbox event.

Every route must:

- validate request size and schema;
- authorize ownership/role;
- return stable error codes;
- avoid leaking secrets or contact data;
- be idempotent where repeated submission is possible;
- record appropriate audit events.

---

## 13. Canonical PDF report

The report service must generate PDF bytes from an immutable Blueprint.

Required behavior:

- include Exabytes branding;
- include report and Blueprint IDs;
- include generation date and version;
- include all challenge sections;
- include sources, evidence, assumptions, and limitations;
- include advisor findings and synthesis;
- include consultant notes with authorship;
- store the artifact privately;
- record a content hash;
- issue a short-lived signed download URL;
- attach the artifact to the lead;
- create a new report version rather than silently overwriting an old report.

The renderer may be React-based or server-HTML-based, but it must be deterministic enough for equality tests against the Blueprint.

---

## 14. Real sales workflow

### 14.1 Transaction

Consultation submission must transactionally:

1. validate explicit consent;
2. verify the submitted Blueprint belongs to the session;
3. create a durable lead;
4. create a consent record;
5. create an assignment event;
6. attach the report artifact;
7. enqueue notification/CRM work;
8. return a safe receipt.

### 14.2 Assignment policy

Use a deterministic initial policy:

1. match region or language if known;
2. match specialist capability tags if available;
3. choose the eligible salesperson with the fewest recent new leads;
4. use stable tie-breaking;
5. route to an unassigned queue when no salesperson is eligible;
6. record every assignment and reassignment.

### 14.3 Salesperson view data

The authorized salesperson must see:

- company and industry;
- employee band;
- budget and pace;
- digital maturity;
- AI readiness;
- top pain points and evidence;
- chosen scenario;
- ROI assumptions and limitations;
- recommendations and mapped offerings;
- advisor concerns;
- missing evidence;
- report download;
- consultant notes;
- lead status and event history;
- first-call questions.

### 14.4 Outbox

External delivery must use a durable outbox with:

- event type;
- idempotency key;
- attempt count;
- last error;
- next retry time;
- completed state;
- provider response metadata without secrets.

At least one real email or webhook adapter must be implemented for P0. CRM integration may begin with an adapter interface plus one concrete provider or controlled webhook.

---

## 15. Execution phases

### Phase A — contract freeze

Goal: freeze the backend/product decisions that are already approved.

Tasks:

- record this locked decision register;
- freeze P0/P1/P2 scope;
- freeze domain model and ownership;
- freeze AI execution mode;
- freeze provider and data-retention policy;
- freeze the Exabytes coverage matrix;
- freeze the MajuPilot name as working product name.

Exit gate:

- no unresolved architectural choice blocks Phase B;
- every P0 requirement has an owner and acceptance condition.

### Phase B — durable persistence and authorization

Tasks:

- create dedicated Supabase project configuration;
- add ordered migrations;
- implement tables, relationships, enums, and indexes;
- implement RLS and storage policy;
- add server-side repositories;
- persist assessment, Twin, diagnostics, recommendations, scenarios, Blueprints, and leads;
- preserve deterministic fixture mode;
- add organization/member roles.

Exit gate:

- records survive restart and browser change;
- cross-tenant reads fail;
- version identity is retained;
- existing core behavior remains green.

### Phase C — live AI provider and telemetry

Tasks:

- implement server-only provider adapter;
- add AI_EXECUTION_MODE;
- add operation-specific model routing;
- add strict structured output;
- add timeouts, retries, budgets, and rate limits;
- persist model-call metadata;
- implement live dynamic follow-up;
- preserve advisor evidence validation;
- add an environment preflight.

Exit gate:

- required mode produces a real live-model result in the target environment;
- provider failure is visible and bounded;
- no trusted numbers change.

### Phase D — catalogue and recommendation completion

Tasks:

- verify and expand challenge-facing Exabytes offerings;
- add catalogue versioning and admin review;
- add new selection/prerequisite rules;
- add AI explanation generation;
- add evidence and source citations;
- add counterfactual alternative explanation;
- add golden-case diffs for catalogue changes.

Exit gate:

- every challenge product category is mapped, verified, or clearly marked unavailable;
- model explanations remain evidence-bound.

### Phase E — Transformation Copilot

Tasks:

- create chat/session/message persistence;
- implement stream route;
- implement all P0 tools;
- bind each chat to an organization, assessment, Twin, and Blueprint;
- implement explicit confirmation for writes;
- add tool authorization;
- add prompt-injection handling;
- adapt safe chatbot patterns;
- implement live/fallback state disclosure.

Exit gate:

- golden questions receive correct tool-grounded answers;
- scenario what-if results match the deterministic engine;
- cross-tenant and unsupported claims are rejected.

### Phase F — canonical PDF and consultant notes

Tasks:

- implement report renderer;
- create artifact storage;
- create signed download route;
- attach report to Blueprint and lead;
- implement consultant-note drafts and human acceptance;
- add report versioning and checksums.

Exit gate:

- report downloads immediately;
- values match the Blueprint;
- report remains available through salesperson lead detail.

### Phase G — sales workflow

Tasks:

- create durable consultation transaction;
- implement assignment policy;
- implement lead list/detail repositories and APIs;
- implement status and assignment event history;
- implement consultant view data;
- implement outbox;
- implement one notification or webhook adapter;
- implement idempotency and retry handling.

Exit gate:

- a consultation becomes a durable assigned lead;
- the salesperson sees the report and complete pre-call context;
- duplicate submissions do not create duplicate lead records.

### Phase H — backend contract integration

Tasks:

- expose the backend capabilities through stable existing route contracts;
- add only the smallest required Copilot, report-download, and consultant-flow API integration;
- preserve the accepted presentation boundary;
- verify that backend state, authorization, and error contracts remain stable for the existing client.

Exit gate:

- the real backend flows are reachable through the existing application contracts;
- no unrelated presentation work is introduced.

### Phase I — final challenge proof

Tasks:

- run the timed five-minute assessment gate;
- run live AI required-mode proof;
- run Copilot golden conversations;
- run report download proof;
- run lead assignment proof;
- run targeted security/RLS proof;
- run final production build and release checks;
- prepare the demo and submission evidence.

Exit gate:

- every P0 challenge row is demonstrated or truthfully disclosed;
- the final submission never claims an untested capability.

---

## 16. Minimal validation strategy

The owner has requested minimal testing and review during this wave. Use targeted validation by default.

### Every implementation phase

Run only:

- targeted tests for changed modules;
- type-check when TypeScript/domain/API code changes;
- lint when lint-sensitive or broad changes occur;
- one focused route/API smoke test when a user journey changes.

Do not rerun unrelated full suites after every small commit.

### Milestones

Run the broader relevant suite once after:

- persistence/RLS;
- live AI and Copilot;
- report and sales workflow;
- final release.

### Main-chat review

After each stage, inspect:

- diff scope;
- contract compliance;
- changed tests;
- one representative smoke path;
- security boundary relevant to that stage.

Return one short decision: accepted, correction required, or re-planned.

---

## 17. GitHub and separate-agent operating model

The main chat is the planner/integrator. New chats are bounded implementers.

For each phase:

1. Main chat writes the exact stage contract.
2. Main chat opens one GPT-5.6 Sol Medium implementation task.
3. Implementer works only on that phase.
4. Implementer makes focused commits.
5. Implementer runs minimal validation.
6. Implementer pushes the stage branch.
7. Implementer opens a PR.
8. CI runs.
9. Main chat reviews the diff and evidence.
10. Corrections stay in the same PR unless scope materially changes.
11. Main chat accepts and merges.
12. Stage ledger and status documentation are updated.
13. Next phase begins only after merge.

GitHub requirements:

- push stage by stage, never everything at once;
- maintain representative commits and PRs;
- use descriptive codex/ branches;
- never commit secrets, private documents, service keys, or generated private reports;
- never claim a PR, CI run, merge, or deployment without verification;
- preserve history and avoid force-pushes;
- keep the existing clean deterministic baseline available for rollback.

---

## 18. Security and privacy controls

Required controls:

- server-only model keys;
- request size limits;
- strict Zod/domain validation;
- tenant and role authorization on every read/write;
- RLS on all exposed Supabase tables;
- private report storage and signed URLs;
- prompt-injection separation for user/business/document text;
- rate limits and model budgets;
- explicit consent versioning;
- audit trail for leads, assignments, notes, and reports;
- no contact details in model prompts unless necessary and consented;
- no unverified product features or prices;
- no service-role client in browser bundles;
- deletion/export policy;
- retention policy;
- human approval for AI-drafted consultant notes.

---

## 19. Risk register

| Risk | Priority | Response |
|---|---:|---|
| LLM changes trusted numbers | Critical | Keep all calculations in deterministic kernel; expose read/recalculate tools only |
| Live model unavailable | High | required mode, environment preflight, visible failure, paid test before demo |
| Lead disappears on restart | Critical | transactional Supabase persistence |
| Cross-tenant data leak | Critical | RLS, repository authorization, negative tests |
| Stale catalogue | High | versioning, verification date, admin review |
| PDF differs from Blueprint | High | generate only from immutable Blueprint; equality tests |
| Chatbot merge imports debt | High | selective adaptation and rewrite boundaries |
| Scope expands into RAG too early | Medium | keep document RAG P1 |
| Duplicate lead or webhook | Medium | idempotency and outbox |
| AI costs exceed budget | Medium | per-operation limits, token metadata, rate limits |
| Consultant trusts AI draft as fact | Medium | draft/accepted state and provenance labels |

---

## 20. Definition of done

The backend/AI rebuild is complete only when:

- all locked decisions are implemented or documented as accepted constraints;
- the deterministic kernel remains authoritative;
- live API AI operates in required mode in the target environment;
- dynamic follow-up is live, bounded, and schema-validated;
- recommendation explanations are live and evidence-grounded;
- Exabytes catalogue categories required by the brief are verified or explicitly unavailable;
- the Transformation Copilot can answer score, evidence, recommendation, scenario, ROI, Blueprint, and lead questions;
- Copilot writes require confirmation and authorization;
- assessment/Twin/Blueprint/lead records are durable and tenant-isolated;
- a canonical branded PDF downloads and is attached to the lead;
- a consultation creates a durable assigned lead;
- an authorized salesperson can see the report and pre-call context;
- at least one outbox notification/webhook path is functional;
- targeted tests, milestone tests, security checks, and final release checks pass;
- GitHub contains representative stage commits, PRs, CI evidence, and merges;
- the accepted presentation boundary remains unchanged except for required integration hooks;
- remaining limitations are stated truthfully.

---

## 21. Final product statement

MajuPilot is an evidence-backed SME transformation advisor that combines deterministic business analysis, live AI guidance, scenario simulation, ROI modeling, a downloadable Exabytes Blueprint, a synchronized Transformation Copilot, and an immediately actionable salesperson handoff.

The project is not restarted. The existing analytical core is retained and upgraded into the trustworthy backend of the complete product.
