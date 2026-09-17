# Multi-Model Development Orchestration Playbook

**Status:** Proposed operating model  
**Prepared:** 17 September 2026  
**Purpose:** Turn the proposed Codex/OpenAI planner → DeepSeek worker → OpenAI auditor workflow into a safe, measurable, repeatable development system.  
**Scope:** Planning and operating design only. This document does not install, configure, or run any harness.

---

## 1. Executive verdict

The core idea is strong and worth pursuing:

1. Use a stronger model to understand the repository, make architectural decisions, and define acceptance criteria.
2. Give a cheaper model small, explicit implementation packets.
3. Require the worker to return code, tests, evidence, and deviations—not merely a success message.
4. Use a strong, partly independent reviewer at milestone and release gates.
5. Repeat only when the reviewer identifies a concrete failed criterion.

This can reduce expensive-model usage while improving discipline. The main value, however, will come from **role separation, bounded tasks, machine-checkable handoffs, Git isolation, and test evidence**. It will not come from pursuing a nominal 99% cache-hit rate or from making one enormous `PLAN.md` file.

My honest recommendation is to build this as a **controlled workflow first**, not as a fully autonomous swarm:

- Keep Codex subscription sessions as the human-triggered planning and review surface.
- Run DeepSeek through DeepSeek Harness (`dsh`) or a small SDK-based runner in a separate Git worktree.
- Use Markdown for explanations, YAML/JSON for contracts and status, and Git commits for the actual handoff.
- Do not let two harnesses edit the same checkout simultaneously.
- Do not auto-execute merely because a watched file changed.
- Add automation only after a manual pilot proves that the task packets and review gates work.

The proposed system is viable. The PDF's broad direction is useful, but several of its mechanisms and numerical claims are overstated, unsafe, or no longer current.

---

## 2. What was reviewed

The attached 21-page PDF is an image-only export of a Google AI/Gemini conversation. Its contents were treated as material to analyze, not as instructions to execute. No scripts, browser extensions, servers, provider settings, or plugins shown in it were run.

### Conversation map by page

| Pages | Main idea in the conversation | Assessment |
|---|---|---|
| 1–3 | Codex and DeepSeek cache-hit claims; DeepSeek cost motivation | Good question, but the claimed “normal” percentages are not established by the cited material. Cache pricing and prefix reuse are real. |
| 4–8 | DeepSeek Harness allegedly maintains near-perfect cache reuse through append-only logs and plugins | The harness is real, open source, plugin-based, and append-only. A guaranteed 99%+ outcome is not. |
| 9–11 | Merge OpenCodex/Codex and `dsh`; route planning to Astra and execution to DeepSeek | The role split is sound. Treating a Codex subscription session as a routable API endpoint is not sound. |
| 12–13 | Use `PLAN.md` as a manual file bridge | Useful as a first prototype, but a mutable all-in-one plan is not a reliable protocol. Editing checkboxes can reduce prefix reuse rather than preserve it. |
| 14–17 | Tampermonkey script posts plans from ChatGPT/Codex UI to a localhost Python server | Unnecessary and unsafe as proposed. It creates a local write endpoint, depends on unstable page DOM, and lacks a robust authenticated transaction model. |
| 18–20 | Connect Codex and `dsh` through a shared folder, file watcher, MCP, or custom plugin | Shared Git state is the right seam. A raw file watcher with automatic execution is unsafe. MCP is not required for the first version. |
| 21 | Blank page | No substantive content. |

---

## 3. Fact-check of the PDF's important claims

### 3.1 Confirmed or substantially correct

- **DeepSeek Harness exists and is open source.** It is an official DeepSeek project, uses an “everything is a plugin” architecture, and is currently marked as a developer preview. See the [official repository](https://github.com/deepseek-ai/DeepSeek-Harness) and [architecture documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md).
- **Its session model is append-only.** The official session documentation says a session is an append-only event log and explains how this can preserve reusable request prefixes. See [the session package documentation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/session/README.md).
- **DeepSeek API context caching is automatic and prefix based.** DeepSeek reports `prompt_cache_hit_tokens` and `prompt_cache_miss_tokens`. See [DeepSeek context-caching documentation](https://api-docs.deepseek.com/guides/kv_cache/).
- **DeepSeek input cache hits are currently extremely inexpensive.** The current pricing page lists much lower cache-hit input pricing than cache-miss input pricing. Prices can change, so the orchestrator must read current provider metadata rather than hard-code permanent assumptions. See [DeepSeek models and pricing](https://api-docs.deepseek.com/quick_start/pricing).
- **DeepSeek provides an official Codex integration.** Current DeepSeek documentation describes Codex configuration through its Responses-compatible API. See [Integrate with Codex](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/).
- **Astra is appropriate for difficult, end-to-end work, while Sol is cheaper.** OpenAI's current model documentation describes GPT-6 Astra as its most capable model and GPT-5.6 Sol as the flagship for complex professional work. See [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model) and [model comparison](https://developers.openai.com/api/docs/models/compare).

### 3.2 Incorrect, unsupported, or dangerously simplified

#### “Codex normally gets 92–96%, and local harnesses get 99%”

There is no universal normal rate. Cache reuse depends on the exact serialized prefix, tool schemas, system/developer instructions, file ordering, session history, model/provider behavior, retention, traffic, and compaction. A percentage observed in one workload is not a promise for another.

**Operational rule:** never use a claimed percentage in the business case until it has been measured on your own workload.

#### “DeepSeek guarantees 99%+ cache reuse”

DeepSeek's own documentation calls caching best-effort and explicitly says it does not guarantee a 100% hit rate. Cached data can be cleared after hours or days. There is no fixed 72-hour guarantee in the current documentation.

#### “Putting a stable `PLAN.md` at the repository root guarantees a cache hit”

Cache matching happens over the API request's tokenized prefix, not over the existence or path of a file. A harness must actually read that file, serialize its contents in the same position, and keep every earlier token unchanged. Tool definitions or system prompts inserted before the file can still change the prefix.

#### “Checking boxes in `PLAN.md` preserves the cache”

Changing `[ ]` to `[x]` changes bytes and tokens at that location. If the plan is early in the prompt, cache reuse after the first changed token may be lost. An immutable task packet plus a separate append-only status/result file is better.

#### “`dsh` is hermetically sandboxed”

The project has sandbox and approval mechanisms, but its own safety notice says it is experimental, not security audited, and must not be treated as secure or production-ready. Its minimal SDK profile can run with broad access if configured that way. See the [official safety notice](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md).

#### “DeepSeek V4.1 Flash” is one timeless model identifier

Provider naming has changed. Current Codex integration documentation uses `deepseek-flash` for the latest Flash route and retains `deepseek-v4-pro` for Pro. Older material and harness catalogs may also show `deepseek-v4-flash`. The runner must discover or configure a current supported identifier rather than embedding a name from a screenshot.

#### “CED/CSA2 and 890 bytes per token explain the cache economics”

Those exact terms and numbers are not supported by the primary sources reviewed. DeepSeek V4 materials describe a CSA/HCA hybrid attention architecture; API context caching is a separate service behavior. Model architecture efficiency should not be confused with the billable API prefix cache.

#### “`dsh` can route to an Astra endpoint exposed by the Codex desktop subscription”

A Codex subscription session is not a general local OpenAI model API for another harness. DeepSeek Harness documentation also says OAuth providers such as Codex are not currently supported as `dsh` providers. Full machine-to-machine routing to Astra requires an authorized API route; otherwise the Codex planning/review stages remain human-triggered app sessions.

#### “MCP connects both harnesses automatically”

MCP can expose tools or resources to a client, but it does not by itself provide durable workflow state, exactly-once execution, locking, Git isolation, approvals, or a planner callback. Those still require an orchestrator or an explicit human-controlled protocol.

#### “The Tampermonkey + localhost bridge is foolproof”

It is not. The shown design creates a write-capable local HTTP endpoint and lets browser code overwrite a known file. It has weak authentication, replay, validation, provenance, collision, path, and failure-recovery controls. It also depends on private UI markup that may change. Copying a plan manually is safer than that prototype; a proper signed/validated local CLI is safer than both when automation becomes necessary.

---

## 4. The sound idea underneath the conversation

The strongest part of the proposal is not “Astra plus DeepSeek.” It is the **separation of concerns**:

| Role | Owns | Must not own |
|---|---|---|
| Product owner / human | Goals, tradeoffs, authority, approvals, final acceptance | Routine code generation |
| Planner / architect | Repository understanding, architecture, task decomposition, contracts, acceptance criteria | Quietly implementing the entire plan |
| Worker / executor | Bounded code changes, local tests, result evidence | Changing architecture or scope without approval |
| Reviewer / verifier | Diff inspection, acceptance checks, defect classification, integration risk | Rewriting requirements after seeing the implementation |
| Deterministic CI | Formatting, static analysis, builds, tests, security scans | Making subjective product decisions |

This structure reduces three common failure modes:

1. A single model invents its own requirements while coding.
2. A reviewer accepts a plausible narrative without checking evidence.
3. A cheap worker is asked to hold the entire project architecture in an ever-growing conversation.

The architecture should therefore optimize for **clear contracts and evidence**, not for transferring a giant chat transcript.

---

## 5. Where the original proposal needs adjustment

### 5.1 Do not plan “literally everything” once at the beginning

An exhaustive, inch-by-inch master plan sounds safe but becomes stale as soon as implementation exposes a false assumption. It also produces massive context that every worker must repeatedly parse.

Use hierarchical planning instead:

1. **Project charter:** stable goals, constraints, non-goals, users, success measures.
2. **Architecture baseline:** stable boundaries, data contracts, quality attributes, security model.
3. **Milestone plan:** ordered deliverables and integration gates.
4. **Task packet:** one bounded, executable change with precise acceptance criteria.
5. **Decision records:** explicit changes to the baseline, with reasons.

Freeze the upper levels deliberately; generate or revise lower-level task packets just before execution.

### 5.2 Do not make one Markdown file the database, queue, lock, and audit log

Markdown is excellent for humans. It is weak for atomic state transitions, concurrency, schema validation, and idempotency.

Use:

- Markdown for intent, architecture, explanations, and reviews.
- YAML or JSON for task and result contracts.
- Git commits for code state and provenance.
- CI for deterministic truth.
- SQLite or another small state store only when concurrent automation is actually needed.

### 5.3 “Only follow the plan” must include a safe stop rule

Blind compliance is not desirable. The worker must stop when:

- requirements contradict repository behavior;
- a named file or API does not exist;
- the requested change would touch a forbidden path;
- acceptance criteria cannot all be satisfied;
- a migration is destructive;
- credentials, production access, or wider permissions are required;
- tests reveal an architecture-level defect;
- the plan is ambiguous in a way that changes public behavior.

The worker should return `BLOCKED` with evidence and a narrowly framed question, not improvise a new architecture.

### 5.4 Review diffs and evidence, not stories

A worker's prose is not proof. Every review must receive:

- base commit SHA;
- implementation commit SHA;
- changed-file list;
- diff statistics;
- exact test commands and exit codes;
- relevant logs or artifact paths;
- deviations from the task packet;
- unresolved risks.

The reviewer then checks the actual diff and reruns risk-appropriate commands.

### 5.5 Avoid endless model ping-pong

Limit ordinary tasks to two correction rounds. On a third failure, stop and replan. Repeated repair attempts often indicate a bad task boundary, missing repository context, or an invalid architectural assumption—not merely weak execution.

---

## 6. Recommended operating architecture

### 6.1 Version 1: controlled, human-triggered workflow

This is the recommended starting point because it works with Codex subscription models without pretending they are a callable API.

```text
Human request
    ↓
Codex planner thread (Sol high; Astra only when justified)
    ↓ writes immutable task packet
Git repository / orchestration/tasks/TASK-###.yaml
    ↓ human starts worker
DeepSeek Harness in an isolated Git worktree
    ↓ commits implementation + writes structured result
orchestration/results/TASK-###.json
    ↓ human opens review in Codex
Sol/Astra reviewer inspects commit diff + test evidence
    ↓
ACCEPTED, CHANGES_REQUESTED, or REPLAN_REQUIRED
```

The “connection” is the repository's orchestration contract and Git history. No browser scraping, unofficial local endpoint, or background auto-execution is necessary.

### 6.2 Version 2: local orchestrator after the pilot

Once the protocol is stable, a small local controller can:

1. Validate a task packet against a JSON Schema.
2. Check that dependencies are accepted.
3. Create a dedicated Git worktree and branch.
4. Invoke the official DeepSeek Harness Python SDK or headless runner.
5. Collect its structured result.
6. Run allowlisted verification commands.
7. Mark the task `REVIEW_READY`.
8. Notify the human to open a Codex review.

The controller should not automate Codex subscription UI sessions. If a future authorized API route is added, the planner/reviewer calls can become programmatic without changing the handoff schemas.

### 6.3 Version 3: event-driven orchestration

Only after sustained evidence should the system add queues, hooks, MCP tools, or automatic reviewer calls. At that point, use an explicit state store, leases, idempotency keys, and signed event records. A file watcher can notify the orchestrator that a candidate task exists, but it must never equate “file changed” with “authorized to execute.”

---

## 7. Repository contract

Recommended layout:

```text
orchestration/
  README.md
  PROJECT_CHARTER.md
  ARCHITECTURE.md
  WORKPLAN.md
  POLICIES.md
  schemas/
    task.schema.json
    result.schema.json
    review.schema.json
  tasks/
    TASK-001.yaml
    TASK-002.yaml
  results/
    TASK-001.result.json
  reviews/
    TASK-001.review.md
    TASK-001.review.json
  decisions/
    ADR-001-choose-database.md
  evidence/
    TASK-001/
      test-summary.txt
      screenshots/
  state/
    TASK-001.state.json
```

### Immutability rules

- A released task packet is never edited in place.
- Corrections create `revision: 2` and include `supersedes` plus a new hash.
- Worker progress never modifies the task packet.
- Results and reviews are append-only or versioned.
- Architecture changes require an ADR.
- Git is the authoritative code history; state files describe workflow status, not code contents.

---

## 8. Task packet specification

A task should be small enough that one worker can complete and verify it without redesigning the project. A useful target is one coherent behavior or one internal refactor, normally touching a narrow set of modules.

Example:

```yaml
schema_version: 1
id: TASK-017
revision: 1
title: Add idempotent retry to invoice import
status: READY
created_by: codex-planner
base_commit: 4f3c2ab

objective: >
  Retry transient provider failures without creating duplicate invoice records.

business_reason: >
  Imports currently fail on brief provider outages and manual retries can duplicate data.

dependencies:
  - TASK-012

scope:
  allowed_paths:
    - src/imports/**
    - tests/imports/**
  forbidden_paths:
    - migrations/**
    - infra/**
  expected_files:
    - src/imports/worker.ts
    - tests/imports/worker.test.ts

requirements:
  - Retry only errors classified as transient.
  - Use the existing invoice idempotency key.
  - Preserve current behavior for permanent validation errors.

non_goals:
  - Changing queue technology.
  - Adding a new database table.

acceptance_criteria:
  - id: AC-1
    criterion: A transient failure is retried at most three times.
    evidence: Automated test.
  - id: AC-2
    criterion: Reprocessing the same import creates one invoice only.
    evidence: Automated integration test.
  - id: AC-3
    criterion: Permanent validation errors are not retried.
    evidence: Automated test.

verification:
  commands:
    - npm test -- tests/imports/worker.test.ts
    - npm run typecheck
  required_exit_code: 0

constraints:
  network: denied
  new_dependencies: denied
  secrets: denied
  destructive_commands: denied
  max_changed_files: 6

stop_conditions:
  - A schema migration is required.
  - The existing idempotency key is not stable.
  - A requested command needs wider permissions.

deliverables:
  - Implementation commit.
  - Tests for AC-1 through AC-3.
  - Structured result manifest.
```

### Task readiness gate

A task is `READY` only when:

- the objective is singular and unambiguous;
- the base commit exists;
- dependencies are accepted;
- allowed and forbidden paths are defined;
- acceptance criteria are observable;
- verification commands are available;
- stop conditions are explicit;
- no unresolved architecture decision is hidden inside it.

---

## 9. Worker result specification

The worker should return structured evidence similar to:

```json
{
  "schema_version": 1,
  "task_id": "TASK-017",
  "task_revision": 1,
  "status": "REVIEW_READY",
  "base_commit": "4f3c2ab",
  "implementation_commit": "9b70e1c",
  "changed_files": [
    "src/imports/worker.ts",
    "tests/imports/worker.test.ts"
  ],
  "acceptance_results": [
    {"id": "AC-1", "status": "PASS", "evidence": "test: retries transient error three times"},
    {"id": "AC-2", "status": "PASS", "evidence": "test: duplicate delivery remains idempotent"},
    {"id": "AC-3", "status": "PASS", "evidence": "test: permanent error exits without retry"}
  ],
  "commands": [
    {"command": "npm test -- tests/imports/worker.test.ts", "exit_code": 0},
    {"command": "npm run typecheck", "exit_code": 0}
  ],
  "deviations": [],
  "unresolved_risks": [],
  "usage": {
    "provider": "deepseek",
    "model": "deepseek-flash",
    "prompt_cache_hit_tokens": 0,
    "prompt_cache_miss_tokens": 0,
    "output_tokens": 0,
    "estimated_cost_usd": 0
  }
}
```

The orchestrator, not the model, should populate trusted fields such as commit SHAs, command exit codes, token counts, and cost whenever possible.

---

## 10. Review contract

The reviewer receives the task packet, repository baseline documents, implementation diff, result manifest, and relevant evidence. It should not receive every previous conversational turn unless a specific ambiguity requires it.

Allowed decisions:

- `ACCEPTED`: all blocking criteria pass and risks are acceptable.
- `CHANGES_REQUESTED`: implementation is locally repairable without changing the contract.
- `REPLAN_REQUIRED`: task or architecture assumptions are wrong.
- `HUMAN_DECISION_REQUIRED`: a business, security, legal, or product tradeoff is needed.

Every blocking finding must include:

1. Severity.
2. File and line or observable behavior.
3. Violated acceptance criterion or policy.
4. Evidence.
5. Minimal required correction.
6. Verification needed after correction.

Style preferences are non-blocking unless they violate a written repository standard.

---

## 11. Workflow state machine

```text
DRAFT
  → READY
  → CLAIMED
  → IMPLEMENTING
  → REVIEW_READY
  → ACCEPTED
  → VERIFIED
  → CLOSED

Alternative transitions:
IMPLEMENTING → BLOCKED
REVIEW_READY → CHANGES_REQUESTED → IMPLEMENTING
REVIEW_READY → REPLAN_REQUIRED → DRAFT (new revision)
any controlled state → CANCELLED (human authority only)
```

### State invariants

- Only one active worker lease exists per task revision.
- A worker must start from the task's exact base commit.
- `REVIEW_READY` requires a commit and result manifest.
- `ACCEPTED` requires a reviewer decision tied to the implementation commit.
- `VERIFIED` requires deterministic checks on the accepted commit.
- A changed commit invalidates the previous review.
- A changed task revision invalidates the previous worker result.

---

## 12. Git and workspace isolation

The two harnesses may share a repository, but they should not share a mutable checkout.

Recommended pattern:

```text
main checkout                 Human/Codex planning and integration view
.worktrees/TASK-017-worker    DeepSeek implementation branch
.worktrees/TASK-017-review    Optional clean verification checkout
```

Per task:

1. Validate a clean, known base commit.
2. Create `agent/TASK-017` from that commit.
3. Give the worker only its worktree and permitted credentials.
4. Worker commits its change.
5. Reviewer inspects `base_commit..implementation_commit`.
6. After acceptance, merge through the normal integration mechanism.

This prevents concurrent edits, accidental overwrites, and ambiguity about which model changed which file.

Do not permit an agent to stash, reset, force-push, delete branches, rewrite shared history, or merge to the protected branch unless the user has expressly authorized that action.

---

## 13. Model-routing recommendation

The following is a starting policy, not a permanent law. Promote or demote models based on measured task outcomes.

| Work type | Recommended default | Escalation |
|---|---|---|
| Project charter, requirements synthesis | Sol high | Astra low/medium when ambiguity or cross-domain reasoning is high |
| Architecture baseline | Sol high | Astra medium for irreversible or security-sensitive choices |
| Routine task decomposition | Sol medium/high | Astra low only when dependencies are complex |
| Bounded implementation | DeepSeek Flash high | DeepSeek max or stronger model when task fails the pilot threshold |
| Repetitive tests/docs/refactors | DeepSeek Flash low/high as measured | Deterministic tooling before any model |
| Per-task review | Sol high or a separate DeepSeek review session for low-risk work | Astra medium for important defects or cross-cutting changes |
| Milestone integration review | Astra medium | Astra high for difficult release blockers |
| Final release/security/architecture audit | Astra high | Human specialist for high-consequence domains |

### Why not use Astra high for every review?

It would erase much of the cost and quota advantage, and high reasoning is not automatically better for routine checks. OpenAI's model guidance recommends selecting effort based on difficulty rather than assuming the maximum level is always optimal.

### Preserve reviewer independence

- Use a fresh review context or a deliberately compact review package.
- Do not show the reviewer the worker's chain-of-thought or persuasive narrative.
- Show requirements, diff, tests, and evidence.
- For critical releases, use both a model reviewer and deterministic or human specialist checks.

---

## 14. Prompt and context architecture

Each role should have a small, stable instruction prefix.

### Planner context order

1. Stable planner policy.
2. Project charter.
3. Architecture baseline and policies.
4. Relevant ADRs.
5. Repository facts discovered for the current milestone.
6. Current request and dynamic questions.

### Worker context order

1. Stable worker policy and tool schema.
2. Minimal repository instructions.
3. Immutable task packet.
4. Only the files and interfaces relevant to the task.
5. Dynamic tool results appended by the harness.

### Reviewer context order

1. Stable review rubric.
2. Task packet and relevant policies.
3. Base/implementation identifiers.
4. Diff and test evidence.
5. Dynamic reviewer findings.

Do not automatically inject the full master plan into every worker call. Retrieve only the needed stable documents. Long context capacity is not a reason to spend, transmit, or distract with unnecessary context.

---

## 15. Cache engineering without superstition

### What actually improves reuse

- Keep the system/developer prompt stable.
- Keep tool definitions and their ordering stable.
- Keep stable files in a deterministic order before dynamic content.
- Append new interaction content rather than rewriting history.
- Keep immutable task packets immutable.
- Store progress and results separately.
- Avoid timestamps, random paths, absolute temporary paths, and volatile repository listings in the stable prefix.
- Reuse a session only for the same role and task lineage.
- Measure provider-reported hit and miss tokens.
- Start a new session when the role, security policy, tool set, or project changes substantially.

### What does not guarantee reuse

- Naming a file `PLAN.md`.
- Putting the file at repository root.
- Keeping a long chat open indefinitely.
- Using the same visible words while the hidden tool schema changes.
- Assuming every file reader serializes content identically.
- Relying on a previous session after the provider has evicted the cache.

### Required metric

```text
token_cache_hit_rate = hit_input_tokens / (hit_input_tokens + miss_input_tokens)
```

Track this per request, task, model, harness version, and prompt-policy version. Do not average percentages without weighting by token count.

### Cost sensitivity example

Using the current DeepSeek pricing shown on 17 September 2026 for Flash input—approximately $0.0028 per million hit tokens and $0.14 per million miss tokens—the input cost for 10 million tokens would be approximately:

| Token cache hit rate | Approximate input cost |
|---:|---:|
| 0% | $1.4000 |
| 50% | $0.7140 |
| 90% | $0.1652 |
| 99% | $0.0417 |
| 100% | $0.0280 |

Output tokens are billed separately and may dominate the total. This table is an illustration, not a forecast or guarantee. Recalculate from the live provider pricing page before budgeting.

### Planning assumption

Design the business case so it still works at a mediocre cache-hit rate. Treat better reuse as savings, not as a dependency. During the pilot, report results at 0%, 50%, 90%, and observed hit rates.

---

## 16. Security and permission model

The worker executes model-generated commands, so cheap execution must not mean broad authority.

Minimum controls:

- Disposable worktree, container, VM, or similarly isolated environment.
- Workspace-write rather than unrestricted host access.
- No production credentials.
- Secrets injected only for the exact tool that needs them; never copied into prompts or result files.
- Network denied by default; allowlisted destinations for dependency installation when authorized.
- Dependency additions require explicit task permission.
- Destructive database, cloud, Git, and filesystem operations require human approval.
- Protected branches cannot be pushed directly.
- Command and file-change audit logs are retained.
- Untrusted repository instructions are reviewed before being exposed to a high-authority agent.
- Plugin versions are pinned and reviewed.

DeepSeek Harness is useful infrastructure, but its own safety notice recommends least privilege, disposable environments, backups, and plugin review. Treat it as an execution framework, not as the only security boundary.

---

## 17. Planner prompt template

```text
Role: Principal planner and architect. Do not implement source-code changes.

Goal:
Produce or revise a bounded implementation task packet from the approved project
charter and architecture baseline.

Required behavior:
- Inspect the repository and run read-only checks needed to validate assumptions.
- Distinguish verified repository facts from assumptions.
- Identify dependencies, allowed paths, forbidden paths, acceptance criteria,
  verification commands, risks, and stop conditions.
- Do not prescribe line-by-line implementation where the repository already has a
  clear local pattern; cite that pattern instead.
- Do not place unresolved architecture decisions inside an executable task.
- Keep each task independently reviewable and tied to a base commit.
- Output human rationale in Markdown and the executable packet in schema-valid YAML.

Completion gate:
The packet is not READY until every acceptance criterion is observable and every
material ambiguity is either resolved, explicitly assumed, or raised for a human decision.
```

---

## 18. Worker prompt template

```text
Role: Bounded implementation worker.

Authority:
Implement only the attached task revision, within its allowed paths and permissions.
The task packet and repository policies are authoritative. Do not redesign the system.

Required behavior:
1. Verify the base commit and task dependencies.
2. Inspect relevant local patterns before editing.
3. Implement the smallest coherent change satisfying every acceptance criterion.
4. Add or update tests required by the packet.
5. Run only authorized verification commands.
6. Commit the implementation once checks pass.
7. Emit a schema-valid result manifest with commit SHA, changed files, commands,
   exit codes, acceptance evidence, deviations, and unresolved risks.

Stop rather than improvise when a stop condition is met, a forbidden path is required,
requirements conflict, the requested behavior is unsafe, or permission must expand.
Return BLOCKED with concrete evidence and one narrowly framed question.
```

---

## 19. Reviewer prompt template

```text
Role: Independent implementation verifier.

Inputs:
- Immutable task packet and relevant policies.
- Base commit and implementation commit.
- Actual diff.
- Worker result manifest and test evidence.

Required behavior:
- Inspect the code and evidence; do not trust the worker's summary by itself.
- Map every finding to an acceptance criterion, policy, regression, security risk,
  or maintainability defect with concrete impact.
- Rerun or request risk-appropriate verification.
- Separate blocking defects from optional improvements.
- Do not expand product scope during review.
- Return exactly one decision: ACCEPTED, CHANGES_REQUESTED, REPLAN_REQUIRED,
  or HUMAN_DECISION_REQUIRED.
- For every blocking defect, state the minimal correction and how to verify it.
```

---

## 20. Verification layers

Use multiple layers because no single reviewer is enough:

1. **Worker self-check:** targeted tests for the task.
2. **Orchestrator checks:** schema validation, path boundaries, commit identity, command exit codes.
3. **CI checks:** formatter, linter, type checker, unit/integration tests, build.
4. **Model review:** semantic bugs, missed requirements, architecture and security concerns.
5. **Milestone integration test:** representative end-to-end user flows.
6. **Human acceptance:** product behavior, risk tradeoffs, release authority.

High-consequence domains require qualified human review regardless of model quality.

---

## 21. Metrics and evaluation

Measure whether the workflow is actually better than a single-model baseline.

### Quality

- Acceptance criteria passed on first submission.
- Defects found during review.
- Defects escaping after acceptance.
- Reopened tasks.
- Test coverage of changed behavior.
- False approvals and false rejections by reviewers.

### Efficiency

- Wall-clock time per accepted task.
- Human minutes per task.
- Planner, worker, and reviewer token usage.
- Input hit/miss tokens and weighted cache-hit rate.
- API cost per accepted task.
- Number of correction rounds.
- Time lost to blocked or stale task packets.

### Stability

- Harness crashes.
- Schema-invalid handoffs.
- Unauthorized path or command attempts.
- Merge conflicts caused by concurrent workers.
- Tasks invalidated by plan revisions.

### Pilot comparison

Run 5–10 representative tasks through:

1. Your proposed split workflow.
2. A single Sol implementation workflow.
3. A single DeepSeek workflow.

Compare accepted-result cost, time, defects, and human intervention. Do not compare token prices alone.

---

## 22. Failure and escalation policy

| Failure | Response |
|---|---|
| Worker cannot satisfy task | Return `BLOCKED`; planner revises assumptions or scope. |
| First review finds local defects | Issue one bounded correction packet. |
| Second review finds the same class of defect | Stop; escalate model or replan. |
| Worker touched forbidden paths | Reject result; inspect all changes; do not auto-retry. |
| Tests are unavailable or flaky | Mark evidence incomplete; create a separate test-infrastructure task. |
| Base branch moved | Do not silently rebase; create a new task revision or controlled integration task. |
| Cache rate drops | Continue if economics remain acceptable; inspect prefix changes using telemetry. |
| Provider/model becomes unavailable | Route through a provider-neutral adapter and record the substitution. |
| Harness requests broader permissions | Human approval only, scoped to the exact operation. |
| Reviewer and planner disagree | Present the requirement, code evidence, and tradeoff to the human owner. |

---

## 23. Adoption roadmap

### Phase 0 — Protocol design

- Freeze task, result, and review schemas.
- Define role prompts and permission policies.
- Pick 5–10 pilot tasks of varied difficulty.
- Record a single-model baseline.

**Exit gate:** A human can read every packet and know exactly what completion means.

### Phase 1 — Manual shared-repository workflow

- Codex writes plans/task packets.
- Human starts `dsh` in a dedicated worktree.
- DeepSeek commits and returns a result manifest.
- Human starts Codex review.
- CI verifies accepted commits.

**Exit gate:** At least five tasks complete without ambiguous handoffs or accidental cross-task changes.

### Phase 2 — Local DeepSeek runner

- Add schema validation.
- Create worktrees automatically.
- Invoke the official `dsh` SDK/headless mode.
- Collect usage and cache telemetry.
- Run allowlisted verification commands.
- Notify the human when review is ready.

**Exit gate:** Repeated runs are idempotent and no task can execute without an explicit READY state.

### Phase 3 — Review and integration tooling

- Generate review bundles automatically.
- Add risk-based review routing.
- Add patch/commit provenance and CI integration.
- Add dashboards for quality, cost, and cache metrics.

**Exit gate:** The workflow demonstrably beats at least one single-model baseline on cost or quality without unacceptable human overhead.

### Phase 4 — Selective automation

- Add an API-based planner/reviewer only if an authorized API route and budget exist.
- Add queueing, leases, retries, and notifications.
- Add specialist security/performance review agents where justified.
- Keep human gates for destructive, security-sensitive, financial, legal, or release-critical actions.

---

## 24. What not to build initially

- A universal router that tries to infer whether every individual prompt is “planning” or “coding.”
- Browser DOM scraping or Tampermonkey automation for moving plans.
- A localhost endpoint that overwrites arbitrary repository files.
- Automatic execution on file-save events.
- A custom MCP server merely to pass a Markdown file.
- One giant forever-growing `PLAN.md`.
- An autonomous correction loop with no maximum attempts.
- Simultaneous writes by Codex and DeepSeek in one checkout.
- A dashboard before the protocol works.
- Hard-coded cache-hit promises or provider pricing.

These features add failure modes before they solve a demonstrated problem.

---

## 25. Decisions to freeze before implementation

1. **Source of truth:** Git commits plus versioned orchestration artifacts.
2. **Initial coordination:** Human-triggered, not fully autonomous.
3. **Workspace isolation:** One Git worktree and branch per worker task.
4. **Task format:** Human-readable Markdown context plus schema-valid YAML.
5. **Result format:** Schema-valid JSON with orchestrator-populated evidence.
6. **Review limit:** Maximum two ordinary correction rounds before replanning.
7. **Permission default:** Workspace-write, network denied, no production secrets.
8. **Planner default:** Sol high; Astra only at risk-appropriate gates.
9. **Worker default:** Current DeepSeek Flash route, evaluated per task class.
10. **Final auditor:** Astra medium/high for milestone or release review, not every trivial change.
11. **Cache policy:** Measure actual hit/miss tokens; no guaranteed target in acceptance criteria.
12. **Automation threshold:** No file watcher or API router until the manual pilot succeeds.

---

## 26. Final recommendation

Proceed with the idea, but name and build it as a **multi-model software delivery protocol**, not as a “cache-maximizing model relay.”

Your best first version is:

1. Sol high creates the charter, architecture baseline, and a small batch of task packets.
2. Astra low/medium challenges the architecture only where risk warrants it.
3. DeepSeek Flash executes one immutable packet at a time in its own worktree.
4. The worker returns a commit, tests, structured evidence, and measured API usage.
5. Sol high reviews ordinary tasks; Astra medium/high audits milestones and the final release.
6. Failed local reviews produce bounded correction packets; repeated failure triggers replanning.
7. Deterministic CI and the human owner remain the final authority.

That retains everything valuable in the original vision—strong planning, cheap execution, independent review, iterative correction, and reusable documentation—while removing the weakest elements: fake certainty about cache rates, uncontrolled file watching, mutable mega-plans, browser scraping, shared-checkout races, and endless agent ping-pong.

The idea is not only feasible; with these controls, it can become a genuinely reusable operating system for future projects. Its success should be judged by accepted outcomes per dollar and per hour, not by how many models are connected or how close a telemetry number gets to 99%.

---

## 27. Primary references

### DeepSeek

- [DeepSeek Harness official repository](https://github.com/deepseek-ai/DeepSeek-Harness)
- [DeepSeek Harness architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md)
- [DeepSeek Harness session/event-log design](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/session/README.md)
- [DeepSeek Harness safety notice](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md)
- [DeepSeek Harness Python SDK](https://github.com/deepseek-ai/deepseek-harness/blob/master/python/sdk/README.md)
- [DeepSeek context caching](https://api-docs.deepseek.com/guides/kv_cache/)
- [DeepSeek models and pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek Codex integration](https://api-docs.deepseek.com/quick_start/agent_integrations/codex/)
- [DeepSeek Responses API guide](https://api-docs.deepseek.com/guides/responses_api/)

### OpenAI

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI model comparison](https://developers.openai.com/api/docs/models/compare)
- [GPT-6 Astra model page](https://developers.openai.com/api/docs/models/gpt-6-astra)
- [OpenAI Responses API reference, including cache controls](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)

---

## 28. Review date and change policy

Provider capabilities, model names, pricing, cache behavior, Codex configuration, and DeepSeek Harness APIs can change. Revalidate the primary references before implementing this playbook and record the checked versions in an ADR. Architectural principles in this document should remain stable; provider-specific commands and prices should be configuration, not policy.
