# Phase A Source Register

**Verification date:** 19 September 2026 (MYT)
**Policy:** Online entries are first-party/official primary sources. Local entries are separately labelled inspected code, lockfiles, licences, and owner-approved requirements. Search-result pages, third-party summaries, remembered APIs, and `.env.local` values are not evidence.

## 1. Online primary sources

### Supabase

| ID | Title | Official URL | Facts supported | Downstream rows |
|---|---|---|---|---|
| SUP-CHANGE | Supabase Changelog | https://supabase.com/changelog | Current breaking-change scan: Data API auto-exposure/grants change, Node 22 direction, Postgres/platform/security updates; no remembered behavior trusted | Domain §9; Phase freeze checklist |
| SUP-RLS | Row Level Security | https://supabase.com/docs/guides/database/postgres/row-level-security | RLS on exposed schemas; grants and policies are separate; `TO` roles; `USING`/`WITH CHECK`; update needs select; view caution; service role bypasses RLS | Domain §§3–5, 9; coverage SAAS-01 |
| SUP-API | Securing your API | https://supabase.com/docs/guides/api/securing-your-api | Exposed schemas/Data API, explicit grants, RLS defense, private schema guidance | Domain §9 |
| SUP-SSR | Creating a Supabase client for SSR (Next.js) | https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs | Cookie-backed browser/server client boundary and request refresh pattern | Domain §4; AI audit SSR rows |
| SUP-USERS | Auth Users | https://supabase.com/docs/guides/auth/users | Auth user identity, metadata distinction, deletion/session lifecycle considerations | Domain §§4, 8 |
| SUP-STORAGE | Storage Access Control | https://supabase.com/docs/guides/storage/security/access-control | `storage.objects` RLS; insert/select/update requirements for upsert; path/bucket policies | Domain §9; report private storage |
| SUP-DOWNLOAD | Serving assets from Storage | https://supabase.com/docs/guides/storage/serving/downloads | Private bucket authenticated/signed download patterns | Domain §§8–9; report §§1, 7 |
| SUP-PROD | Production Checklist | https://supabase.com/docs/guides/deployment/going-into-prod | Production security, rate/abuse, backups and operational review context | Phase B/I acceptance |

The changelog was scanned before freezing the contract. The directly relevant current change is that new `public` tables are not necessarily auto-exposed to Data/GraphQL APIs; Phase B must configure exposure/grants explicitly and still apply RLS. Self-hosted-only breaking changes are not assumed to apply to the dedicated hosted project.

### Vercel AI SDK and AI Gateway

| ID | Title | Official URL | Facts supported | Downstream rows |
|---|---|---|---|---|
| VAI-MODELS | AI Gateway live model catalogue | https://ai-gateway.vercel.sh/v1/models | Exact model IDs and capability metadata fetched on the verification date; includes `openai/gpt-5.6-sol`, `anthropic/claude-sonnet-5`, `google/gemini-3.8-flash` on that date | AI audit §7; coverage AI-01 |
| VAI-GATEWAY | Vercel AI Gateway | https://vercel.com/docs/ai-gateway | Unified Gateway, routing/authentication/observability, model-string boundary | AI audit §§5–8 |
| VAI-PROVIDERS | AI Gateway Models and Providers | https://vercel.com/docs/ai-gateway/models-and-providers | Current provider/model catalogue discovery and capability variation | AI audit §7 |
| VAI-SDK | AI SDK documentation | https://ai-sdk.dev/docs | Official SDK documentation index; online fallback after bundled source | AI audit §§1, 4, 8 |
| VAI-STRUCT | Generating Structured Data | https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data | `Output.object`/schema-validated generation concepts | AI audit §§1, 8 |
| VAI-TOOLS | Tools and Tool Calling | https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling | Typed tool definitions/execution and bounded multi-step concepts | AI audit §§5, 8–9; coverage CHAT-01 |
| VAI-TELEM | Telemetry | https://ai-sdk.dev/docs/ai-sdk-core/telemetry | Telemetry integration and sensitive-data caution | AI audit §8 |
| VAI-ERROR | Error Handling | https://ai-sdk.dev/docs/ai-sdk-core/error-handling | Typed error families and safe handling basis | AI audit §§6, 8 |

Model availability is time-sensitive. The register proves the lookup performed on 2026-09-19; it does not freeze any ID forever. Deployment preflight must re-fetch the catalogue.

### Exabytes products and supported paths

| ID | Official page | Official URL | Facts supported | Downstream catalogue rows |
|---|---|---|---|---|
| EXB-FRESHSALES | Freshsales CRM | https://www.exabytes.my/freshworks/freshsales-crm | Exabytes-offered Freshworks CRM: centralized interactions, pipeline, follow-up, reporting/workflow/channel capabilities; partner terms | Freshsales; Freshmarketer context |
| EXB-ACRONIS | Acronis Cyber Protect | https://www.exabytes.my/acronis/cyber-protect | Backup/recovery and endpoint protection capabilities offered through Exabytes | Acronis continuity |
| EXB-EMAIL | Business Email Hosting | https://www.exabytes.my/email/email-hosting | Domain/business email and coworker sharing of contacts/calendar/tasks/files | EBiz Mail Pro |
| EXB-LARK | Lark | https://www.exabytes.my/lark | Exabytes-offered collaboration suite; messaging/schedule/docs and current plan-dependent features | Lark collaboration |
| EXB-GWS | Google Workspace | https://www.exabytes.my/google-workspace | Exabytes-offered business email, Drive/docs, collaboration/meet/admin/security and current AI inclusions by plan | Google Workspace |
| EXB-M365 | Microsoft 365 | https://www.exabytes.my/microsoft-365 | Exabytes-offered Outlook/Exchange, Office, OneDrive, collaboration and plan differences | Microsoft 365 |
| EXB-BIZHOST | AI-Powered Business Hosting | https://www.exabytes.my/web-hosting/business-web-hosting | Exabytes hosting, AI website/content tools, SSL and backup with plan caveats | Business Hosting; AI Website Builder |
| EXB-WP | AI-Powered WP Hosting | https://www.exabytes.my/web-hosting/wp-hosting | WordPress-oriented Exabytes plans, pre-install/toolkit, AI builder/content tools, SSL/backups and plan caveats | Managed WordPress |
| EXB-CLOUDFLARE | Cloudflare Managed Services | https://www.exabytes.my/web-security/cloudflare-web-performance-booster | Exabytes-managed Cloudflare CDN/DDoS/WAF/performance offering | Protected web presence |
| EXB-EVC | Exabytes Vision Cloud | https://www.exabytes.my/enterprise/evc | Exabytes-managed Malaysia-hosted virtual infrastructure, dedicated resources, networking/monitoring and optional backup/DR | Scalable cloud operations |
| EXB-AICLOUD | Exabytes AI Cloud | https://www.exabytes.ai/ai-cloud | Exabytes-named Cloud + AI/workflow automation platform, Malaysia hosting, register-interest/consultative positioning | Governed AI automation |
| EXB-EVA | Exabytes Vision AI (EVA) | https://www.exabytes.ai/eva | Exabytes no-code agentic AI, business grounding/app connections, register-interest positioning | EVA alternative |
| EXB-GROWAI | Exabytes GROW AI portfolio | https://www.exabytes.ai/ | Exabytes AI portfolio and Meeting AI existence/summary; register-interest context | Meeting AI; consultation-only AI path |
| EXB-SALES | AI Sales Team | https://www.exabytes.ai/ai-sales-team | Exabytes AI sales-agent team and consultation-led deployment | AI Sales Team |
| EXB-MARKETING | AI Digital Marketing Team Agent | https://www.exabytes.ai/ai-marketing-team | Exabytes AI marketing-agent team and register-interest form | AI marketing automation |
| EXB-FRESHDESK | Freshdesk Helpdesk | https://www.exabytes.my/freshworks/helpdesk | Exabytes-offered Freshdesk support/helpdesk, automation and plan-dependent Freddy AI capabilities | AI customer support |
| EXB-FRESHWORKS | Freshworks portfolio | https://www.exabytes.my/freshworks | Exabytes partner portfolio for support, messaging, sales, marketing/IT service contexts | Freshchat supported partner context |
| EXB-ECOM | Managed eCommerce | https://www.exabytes.my/managed-ecommerce-solution | Exabytes-managed website, marketplaces, operations, customer care, marketing/reporting/consultation | Managed eCommerce |
| EXB-SHOPIFY | Exabytes reseller partner listing (MICES Technology) | https://www.exabytes.my/partners/home/listing/mices-technology-sdn-bhd/ | Official Exabytes directory identifies the listed firm as a Shopify Partner; supports only a consultant-validated path, not an Exabytes Shopify SKU | Shopify supported path |

No current official Exabytes Magento-specific product/support page was verified during Phase A. That category is intentionally `unavailable/unverified`. Official blog pages were used only to discover first-party product pages or context, not to activate unsupported claims.

## 2. Locally inspected evidence

These are direct local project/repository artifacts, not online product facts.

| ID | Title/location | Inspected identity | Facts supported | Downstream rows |
|---|---|---|---|---|
| LOCAL-REQ-ADD | `planning/MAJUPILOT-V2-BOOTSTRAP-AND-ORCHESTRATION-ADDENDUM.md` | V2 repository HEAD baseline | Binding precedence, V2 isolation, phase order, Phase A corrections, minimal validation | All Phase A documents |
| LOCAL-REQ-MASTER | `planning/MAJUPILOT-MAIN-CHAT-MASTER-PROMPT.md` | V2 repository HEAD baseline | Locked architecture, challenge requirements, tools, domain/report/lead contracts | Freeze; coverage; report/outbox |
| LOCAL-REQ-GAME | `planning/CORE-AI-CHALLENGE-COVERAGE-AUDIT-AND-REBUILD-GAMEPLAN.md` | V2 repository HEAD baseline | Owner-approved transcription of main challenge/bonuses/Even Better requirements and inherited coverage | Coverage §1 |
| LOCAL-TARGET-PKG | `sme-growth-twin/package.json`, `package-lock.json` | `ai` declared/resolved `7.0.105`; Next 16 target | Target version compatibility and current dependency boundary | AI audit §§1, 4 |
| LOCAL-TARGET-AI | `sme-growth-twin/src/infrastructure/model-provider/*` | V2 imported baseline | Current server-only Gateway advisor adapter, structured output, retry/budget/call record patterns | AI audit §§1, 5–8 |
| LOCAL-TARGET-CAT | `sme-growth-twin/src/domain-packs/exabytes/catalogue.ts`, `planning/catalogue/EXABYTES-CATALOGUE-1.0.0.md` | Catalogue 1.0.0 | Inherited 11 offerings, mappings, official URLs and stale-date baseline | Coverage §2 |
| LOCAL-AISDK7 | Adjacent installed baseline `...\AI HORIZON HACKATHON (EXABYTES)\sme-growth-twin\node_modules\ai` | Bundled docs/source `ai@7.0.107` | SDK 7 migration/API evidence for `Output.object`, streaming, tools, `ToolLoopAgent`, telemetry/errors; minor-version reference only | AI audit §§1, 4, 8 |
| LOCAL-CB-LICENSE | `C:\Users\Dv\Desktop\AI CHATBOT PROJECT\ai-chatbot-with-rag\LICENSE.md` | Committed HEAD `9eba171` | MIT copyright/permission obligations | AI audit §§2–3, 10 |
| LOCAL-CB-PKG | Chatbot `package.json`, lock | Committed HEAD `9eba171`; `ai@6.0.39` | Chatbot version/provider/dependency inventory | AI audit §§2, 4 |
| LOCAL-CB-AUTH | Chatbot `lib/server/{server,supabase,admin}.ts`, `proxy.ts`, `lib/client/client.ts` | Committed HEAD | SSR/session/service-role patterns and rewrite boundaries | Domain §§4, 9; AI matrix |
| LOCAL-CB-RLS | Chatbot `database/setup.sql`, `supabase/migrations/*.sql` | Committed HEAD | User-scoped RLS/Storage/functions, broad-grant and schema rejection evidence | Domain §9; AI matrix |
| LOCAL-CB-CHAT | Chatbot `app/api/chat/route.ts`, `lib/model-config.ts`, `SaveToDbIncremental.ts`, chat fetch/actions | Committed HEAD | Streaming/tool/provider registry/persistence patterns and `any`/direct-provider rewrite boundaries | AI audit §§2–4 |
| LOCAL-CB-RAG | Chatbot document path, upload/process/document tool/server files | Committed HEAD | Opaque paths, signed upload, parser/embedding/retrieval/page-citation concepts and P1 boundary | AI audit §§2–3, 10 |
| LOCAL-ENV-NAMES | Target and chatbot committed `.env.example` variable names only | Values not read; `.env.local` not opened | No approved email/CRM/webhook provider configuration; signed-webhook fallback decision | Report/outbox §10 |

The authorized chatbot working tree contained an unrelated modified `.gitignore` and untracked `PROJECT_ARCHITECTURE_AND_MIGRATION_ANALYSIS.md`. Neither was treated as authoritative evidence or changed.

## 3. Verification method and limitations

- Official pages were opened on the verification date and active catalogue claims were checked against page content. Promotional prices/statistics/testimonials were deliberately not adopted.
- The official Gateway JSON catalogue was fetched directly outside the restricted shell after approval; exact model IDs are a dated snapshot and require deployment-time revalidation.
- Supabase's current changelog and official RLS/Auth/Data API/Storage documentation were reviewed. Phase A provisioned no project, so database settings and policies remain Phase B acceptance evidence, not claims.
- The original challenge PDF is not committed in this worktree; the owner-approved gameplan is the local requirement authority for this phase. This limitation does not affect online product/provider fact verification.
