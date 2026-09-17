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

