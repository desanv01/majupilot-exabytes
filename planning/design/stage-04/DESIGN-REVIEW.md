# Stage 04 Design Review

Status: **Approved as a composition reference with mandatory corrections**  
Reviewed: 17 September 2026  
Source: 12ui Branch run `sme-growth-twin-stage04-v1`

## Run outcome

The Branch planned four responsive Scenario and ROI Lab states. Three desktop
screens completed:

- `branch/branch/screens/a.png` — scenario comparison;
- `branch/branch/screens/b.png` — Balanced scenario detail;
- `branch/branch/screens/c.png` — assumptions and calculation.

The fourth, mobile comparison, did not start because the 12ui free allowance
was exhausted and the prepaid wallet had insufficient balance. Do not retry or
spend without new authorization/funds. Mobile must be derived from the frozen
responsive contract and independently verified at an actual 360 px viewport.

## Overall decision

Retain the approved Stage 01–03 visual language and use the generated screens
for hierarchy, card composition, grouped controls, and progressive disclosure.
The stage packet and Scenario and ROI Model 1.0.0 override every generated
label, number, formula, status, milestone, photograph, or claim.

## Screen A — scenario comparison

### Retain

- three clearly differentiated scenario cards;
- repeated metric positions for rapid comparison;
- visible risk, budget fit, conditional state, and next action;
- restrained green/blue/amber scenario accents;
- a short comparison explanation above the cards.

### Mandatory corrections

- Remove `12 min left`; the assessment is already complete.
- Replace the five-step top progress labels with the accepted four-stage rail:
  Discover, Diagnose, Compare, Blueprint.
- Do not use a generated café photograph or imply it is the assessed business.
- Do not mark Lean `Recommended`; default visual focus may be Balanced, but no
  preferred plan exists until the user selects it.
- Replace all invented costs, annual values, net ranges, payback, and budget-fit
  labels with exact Model 1.0.0 values.
- Replace generic scopes such as POS, analytics, expansion, forecasting, and
  personalization with the exact accepted capability titles.
- Accelerated AI must show four committed capabilities and one conditional AI
  capability, with conditional cost separate from committed ROI.
- Show Revenue and Avoided risk as `Not estimated` for default Case A.
- Add `Planning assumptions — not an Exabytes quote` near costs.
- Timing must reflect the actual schedule/completion range, not `12 months` on
  every card.

## Screen B — scenario detail

### Retain

- tabbed/detail navigation pattern;
- 12-month horizontal timeline on desktop;
- separate financial-outlook and readiness/warning areas;
- milestone cards and dependency affordances;
- strong overview-to-detail information hierarchy.

### Mandatory corrections

- Fix the timeline to list months 1–12 exactly once.
- Remove invented digital ordering, loyalty, supply-chain, menu, expansion,
  customer-count, revenue-target, contract, and supplier claims.
- Replace generated phases with scheduled accepted capabilities and dependency
  events from the scenario engine.
- Remove `+18%`, `2.4x`, `$48.5k`, `$18.2k`, and every other unsupported figure.
- Use Malaysian ringgit and exact deterministic ranges.
- Show assumption sources as user fact, derived user fact, planning default, or
  user override; never invent payroll, supplier, market-study, or pilot sources.
- A scenario is not labelled Selected until the user explicitly chooses it.
- Readiness warnings must resolve to actual Stage 03 prerequisite checks.
- Conditional AI cost and benefits remain outside committed ROI while blocked.
- Avoid red danger styling for ordinary uncertainty; reserve it for invalid or
  blocked states and use amber for assumptions/sensitivity.

## Screen C — assumptions and calculation

### Retain

- grouped panels for Costs, Operational value, Revenue, Avoided risk, and
  Sensitivity;
- aligned low/base/high inputs;
- visible source and reset affordances;
- persistent live-result summary;
- collapsed optional value streams with `Not estimated` state;
- direct return to scenario comparison.

### Mandatory corrections

- Replace labor, rent, ingredients, supplies, and generic operating costs with
  implementation, training, and annual recurring planning costs.
- Replace capacity/quality uplift with manual hours, automatable share, adoption,
  and loaded hourly cost.
- Revenue fields must be addressable revenue, conversion change, and gross
  margin.
- Avoided-risk fields must be baseline incident probability, incident impact,
  and risk reduction.
- Use the exact frozen formulas. Do not add fields together as shown in the
  generated footer formulas.
- All results are annual or first-year values, not monthly operating forecasts.
- The live summary must show gross benefit, first-year cost, net-value range,
  payback, confidence, budget fit, and exclusions.
- Correct `Reset all asumparison` to `Reset all assumptions`.
- Invalid edits preserve the last valid calculation and show associated field
  errors rather than calculating with malformed data.

## Responsive implementation contract

Because the generated mobile slot is unavailable, the implementer must prove:

- true 360 px viewport with no horizontal overflow;
- stacked scenario cards rather than a comparison table;
- compact vertical month/timeline representation;
- low/base/high inputs remain legible and may stack by assumption;
- sources, units, errors, and reset controls remain adjacent to their fields;
- 44 px minimum interactive targets;
- no sticky control covers content;
- focus order matches reading order;
- conditional status and exclusions do not rely on colour alone.

## Acceptance reference priority

1. Stage 04 packet and Scenario and ROI Model 1.0.0.
2. Existing accepted application behavior and design tokens.
3. This mandatory-correction review.
4. Generated images for composition only.

