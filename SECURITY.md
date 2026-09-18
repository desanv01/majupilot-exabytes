# Security Policy

## Supported status

SME Growth Twin is currently a hackathon prototype, not a production service. It uses browser-local demonstration persistence and does not yet provide production authentication, tenant isolation, encrypted server-side storage, operational monitoring, or a formal retention system.

## Reporting a vulnerability

Do not publish exploit details in a normal issue. Use GitHub's private vulnerability reporting or security-advisory flow for this repository. Include the affected route or module, reproduction steps, expected impact, and a minimal sanitized proof of concept.

## Secrets and sensitive data

- Never commit `.env.local`, API keys, service credentials, assessment exports, or real customer records.
- Never place server credentials in variables prefixed with `NEXT_PUBLIC_`.
- Use fictional or explicitly sanitized businesses in fixtures, screenshots, and demonstrations.
- Product and benchmark claims require traceable sources and review.

## Current hardening and limits

Static responses deny framing and MIME sniffing, apply a conservative referrer policy and restrictive permissions policy, and use a Next.js-compatible Content Security Policy. The lead and advisor APIs require bounded JSON and strict schemas and return `Cache-Control: no-store`; both have prototype-grade process-local rate limits that retain salted hashes of coarse client identifiers rather than raw IPs or request content.

Advisor calls are server-only and bounded to five roles, one retry per role, 900 output tokens per attempt, and 12 seconds per role (ten attempts/9,000 output tokens maximum per request). The deterministic fallback remains available without credentials.

Browser assessment/result/Blueprint records can be removed by the scoped reset. Consultation records and limiter state disappear with the server instance lifecycle. There is no formal production retention/deletion service, authentication, tenant isolation, durable lead storage, monitoring, audit log, backup, encryption claim, or compliance certification.
