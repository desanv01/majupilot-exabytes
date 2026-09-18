# Stage 06 Design Review

Status: **Accepted with bounded adaptation**  
Source: 12ui Branch run `crt-7f5e51a81e997db719878d30c307b74d58419c35`  
Reviewed: **18 September 2026**

## Accepted targets

### Desktop consultation

Use [`consultation-desktop.png`](./branch/screens/consultation-desktop.png) for:

- the strong evidence-ready heading and restrained hero hierarchy;
- a readable left form / right privacy-and-sharing arrangement;
- prominent Blueprint, selected scenario, maturity, and readiness context;
- persistent field labels, clear section grouping, an unchecked consent card,
  and a full-width primary submit action;
- generous spacing and the accepted navy/teal/warm-white visual language.

Adapt it to the existing SME Growth Twin header and four-stage journey. Do not
copy its invented side navigation, stock illustration, “past requests” link,
or unsupported 12-month retention/security claims.

### Success state

Use [`consultation-success.png`](./branch/screens/consultation-success.png) for:

- the calm recorded-request hierarchy;
- the three-part safe receipt (lead reference, submitted time, Blueprint ID);
- a simple explanation of next steps;
- balanced Return to Blueprint and Start a new assessment actions.

Replace any statement that implies external delivery or immediate human review
with the frozen Stage 06 wording: the request was recorded by this prototype.
Do not show contact details.

## Rejected target

[`mobile-rejected-reference.png`](./branch/screens/mobile-rejected-reference.png)
is retained only as design provenance and must not be implemented. It diverges
from the accepted app shell, adds marketing navigation/footer, changes the
required business/email/urgency contract, invents a preferred-time field and
topic choices, and states unsupported encryption, PDPA, partner sharing, and
12-month retention claims.

The mobile implementation must instead be the accepted desktop form collapsed
to one column at 360 px, with disclosure before consent, minimum 44 px controls,
visible focus/errors, and no horizontal overflow.

## Conversion note

All three paid Branch images completed and were downloaded. 12ui's Windows
HTML/prototype conversion then stopped on `EPERM: operation not permitted,
fsync`; resuming the same recorded run reproduced that local conversion error.
No duplicate branch was started. The accepted PNGs remain sufficient visual
targets for implementation and later browser comparison.

## Binding hierarchy

When a visual contains copy or behavior that conflicts with
`STAGE-06-CONSULTATION-FULL-UX.md`, the frozen stage contract wins. The images
govern composition, hierarchy, density, spacing, and visual character only.

