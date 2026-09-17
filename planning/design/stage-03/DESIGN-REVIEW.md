# Stage 03 Design Review

Status: **Approved for implementation with mandatory factual corrections**  
Visual family: **Candidate D, continued from Stages 01-02**  
Functional authority: `planning/stages/STAGE-03-RECOMMENDATIONS-CATALOGUE.md`

## 1. Approved references

| Surface | Reference | Decision |
|---|---|---|
| Recommendations overview | `branch/branch/screens/a.png` | Primary desktop composition: retain three timing groups, capability-first hierarchy, compact diagnostic carry-over, and visual rhythm. |
| Capability detail | `branch/branch/screens/b.png` | Retain the split explanation structure and compact decision-factor cards; replace all generated facts and values. |
| Offering evidence | `branch/branch/screens/c.png` | Retain the provenance/mapping/limitation composition only; generated product content is not authoritative. |
| Mobile overview | `branch/branch/screens/d.png` | Retain single-column order and progressive disclosure ideas; it is not proof of real 360 px responsiveness. |

The images are a single screen family. They are not product, calculation,
catalogue, or copy authority. Hosted HTML conversion was not performed because
it would upload a rendered screen beyond the approved abstract brief. The
implementer must use the images locally and preserve existing application
components/styles where possible.

## 2. What to retain

- warm-white canvas, navy editorial headings, readable sans-serif body;
- teal/seafoam for evidence and positive sequencing;
- restrained coral/orange for blocked prerequisites, never for fear marketing;
- overview grouped into Why now, Next, and Why later;
- capability outcome before the smaller `Supported by` offering treatment;
- visible diagnostic carry-over without repeating the full results page;
- detail view that separates evidence, fit factors, prerequisites, mapping, and
  limitations;
- progressive disclosure and calm density on mobile.

## 3. Mandatory global corrections

- Remove `12 min left`; the journey has no countdown promise.
- Reuse the existing approved Stage 01-02 header and progress language. Do not
  introduce `Business Profile`, `Capabilities & Gaps`, `Growth Priorities`, or
  `Your Action Plan` as a new assessment step model.
- Use `Digital maturity`, not `Overall Maturity` or `Business Maturity`.
- Case A confidence is `High` / `1.00`, not `Moderate Confidence`.
- Use application data and deterministic rules only. Decorative café imagery
  is optional and may not imply evidence.
- The user moves from results to recommendations; avoid contradictory `Back to
  Overview` direction labels or a `View Full Plan` action before Stage 04-05.
- No generated benefit, timeframe, cost, staffing, product, or customer claim
  may be retained unless the frozen Stage 03 packet produces it.

## 4. Overview corrections (`a.png`)

- Preserve `shared_customer_operations` as Case A's first `why_now` item.
- Determine continuity/collaboration order from the formula; do not hard-code
  the image's grouping merely to match pixels.
- Display fit score/status/phase from the canonical result and provide a clear
  path to the component explanation.
- Replace `Faster response times, higher customer satisfaction, more repeat
  business` and similar generated benefits with the capability definition's
  approved expected-impact text.
- `Future-fit AI Cloud` is allowed only as a secondary, clearly non-purchase
  label inside the `why_later` capability.
- Stage 04 must be described honestly as the future Scenario and ROI step; do
  not imply that a full plan already exists.

## 5. Capability-detail corrections (`b.png`)

Delete every fabricated evidence item, including:

- `38% of customer queries require handoffs`;
- `Average order-to-delivery time is 2.6 days`;
- `Customer satisfaction score is 68/100`;
- claims of growing demand, rising delays, rework, or higher service costs.

Use the actual Case A evidence: CRM not used; customer records in messaging
apps; WhatsApp orders/catering enquiries; 11-20 manual hours; eight affected
employees; increase-revenue objective; and the evidence IDs actually linked by
the current result.

- Show all six canonical fit components with numeric values and rule labels.
- Use the real prerequisite array; do not invent documented processes or
  partner alignment.
- Display phase, `effortTier`, `relativeCostTier`, and time-to-value tier. Never
  render `RM 50k-150k`, `3-6 people`, or `3-6 months` from the image.
- `View supporting evidence` means current Business Twin evidence and catalogue
  provenance, not vendor proof points or case studies.

## 6. Offering-evidence corrections (`c.png`)

- Provider is `Exabytes catalogue offering: Freshsales CRM`; do not change the
  provider/source relationship to an unsourced `Freshworks Inc.` fact.
- Use only the approved Catalogue 1.0.0 fact summary.
- Official source is
  `https://www.exabytes.my/freshworks/freshsales-crm`, not freshworks.com.
- Verified date is `17 September 2026`, not `16 Apr 2025`.
- Remove HubSpot CRM, Zoho CRM, Pipedrive, their logos, and all descriptions.
  They are not in the approved Exabytes catalogue.
- Allowed alternatives are only the active catalogue alternatives named by the
  selection rules for that capability. Freshsales has no CRM alternative in
  Catalogue 1.0.0.
- `Verified offering` must not imply certification or endorsement. Use
  `Official source checked` or `Catalogue entry active`.
- `Verify current quote with Exabytes` links to the official offering page or
  an in-app non-submitting explanation. Stage 03 must not collect contact data.
- Retain the consultation limitation and add catalogue version/source date.

## 7. Mobile corrections (`d.png`)

- The reference is a phone mockup inside a 1536 px image. Test an actual 360 px
  browser viewport.
- The first Case A item is `Why now`, not `Next`.
- Use the same status labels everywhere: `Why now`, `Next`, `Why later`.
- Do not show `360° Overview`; use `Assessment snapshot` or no extra label.
- An expanded card must not duplicate its list card in a confusing way. Use one
  accessible disclosure with `aria-expanded` and a 44 px control.
- One column, no horizontal overflow, no clipped source URLs, no sticky-action
  collision, readable fit components, and reduced decorative imagery.

## 8. Implementation close

After implementation:

1. capture `/recommendations` desktop and actual 360 px screenshots;
2. compare each route/state locally with its matching reference;
3. keep canonical data/behavior wherever it conflicts with an image;
4. record intentional visual deviations;
5. do not upload rendered application screens to 12ui without a new explicit
   approval covering that payload.
