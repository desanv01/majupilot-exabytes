# Security Policy

## Supported status

MajuPilot is a hackathon release candidate with hosted Supabase persistence, owner-scoped guest sessions, tenant-aware authorization, row-level security, private report storage, immutable consent and audit records, and durable outbox delivery. It is not a compliance certification or a guarantee of production operational support.

## Reporting a vulnerability

Do not publish exploit details in a normal issue. Use GitHub's private vulnerability reporting or security-advisory flow for this repository. Include the affected route or module, reproduction steps, expected impact, and a minimal sanitized proof of concept.

## Secrets and sensitive data

- Never commit `.env.local`, API keys, service credentials, assessment exports, or real customer records.
- Never place server credentials in variables prefixed with `NEXT_PUBLIC_`.
- Use fictional or explicitly sanitized businesses in fixtures, screenshots, and demonstrations.
- Product and benchmark claims require traceable sources and review.

## Current hardening and limits

Static responses deny framing and MIME sniffing, apply a conservative referrer policy and restrictive permissions policy, and use a Next.js-compatible Content Security Policy. Versioned APIs require bounded JSON and strict schemas, return `Cache-Control: no-store`, enforce owner or role checks, and keep service credentials on the server.

Advisor calls are server-only and bounded to five roles, one retry per role, 900 output tokens per attempt, and 12 seconds per role (ten attempts/9,000 output tokens maximum per request). The deterministic fallback remains available without credentials.

Browser drafts can be removed by the scoped reset. Completed evidence, reports, consent, leads, assignments, delivery attempts, and Copilot history use the hosted persistence boundary. Export and deletion request contracts exist, while production operations, backup policy, monitoring coverage, and regulatory certification remain deployment-owner responsibilities.
