# Local development

Run all commands from the canonical `sme-growth-twin` directory.

## Prerequisites

- Node.js 22.12.0 or newer
- npm 11 or a compatible npm release

## Commands

```powershell
# Reproducible install from the committed lockfile
npm ci

# Local development server
npm run dev

# Static analysis
npm run lint
npm run type-check

# Unit tests
npm test

# Production build
npm run build
```

For the first lockfile creation only, Stage 00 used `npm install`. Fresh
implementers should use `npm ci` thereafter.

Copy `.env.example` to `.env.local` only when a later approved stage introduces
a server-side model adapter. Stage 00 does not require environment variables.
Never commit `.env.local` or credentials.
