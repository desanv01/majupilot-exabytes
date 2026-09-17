# Exabytes Catalogue 1.0.0

Status: **Frozen Stage 03 catalogue baseline**  
Verified: **17 September 2026 (MYT)**  
Owner: **Main task**

## 1. Catalogue policy

This is a deliberately small, versioned decision catalogue, not a scrape of
the Exabytes website. It contains only claims needed by the first
recommendation engine and verified against an official Exabytes page.

- A recommendation selects a business capability before it selects an
  offering.
- Product names and claims may only come from an active entry below.
- Promotional prices, discounts, uptime claims, statistics, testimonials, and
  compatibility details are not copied into the application.
- The UI uses `Verify current quote with Exabytes` for pricing. Relative cost
  tiers are planning metadata, not vendor prices or quotations.
- A source link and this catalogue version are visible for every mapped
  offering.
- If an entry expires or its source cannot be verified, mapping fails closed:
  the capability recommendation remains, but the offering becomes
  `Consult Exabytes for a current fit`.

## 2. Active offering entries

| ID | Official offering | Supported capability mapping | Approved fact summary | Relative cost | Source |
|---|---|---|---|---:|---|
| `exb_freshsales_crm` | Freshsales CRM | `shared_customer_operations` | Centralises customer information and interactions; supports sales pipelines, activities, follow-up, reports, workflows, and multi-channel engagement. | 2 | <https://www.exabytes.my/freshworks/freshsales-crm> |
| `exb_acronis_cyber_protect` | Acronis Cyber Protect | `protected_business_continuity` | Combines backup/recovery with endpoint cyber protection and centralised protection management across physical, virtual, and cloud environments. | 1 | <https://www.exabytes.my/acronis/cyber-protect> |
| `exb_business_email` | EBiz Mail Pro Business Email | `professional_team_collaboration` | Provides domain-based business email, web access, calendars/tasks/contacts, anti-spam, and team-sharing functions. | 1 | <https://www.exabytes.my/email/email-hosting> |
| `exb_lark` | Lark | `professional_team_collaboration` | Exabytes offers Lark as a team collaboration and work-management option. Use only the general collaboration mapping in v1.0.0; do not assert plan-specific features. | 1 | <https://www.exabytes.my/lark> |
| `exb_google_workspace` | Google Workspace | `professional_team_collaboration` | Provides custom business email, cloud files, real-time document collaboration, meetings, administration, and security controls. | 1 | <https://www.exabytes.my/google-workspace> |
| `exb_microsoft_365` | Microsoft 365 | `professional_team_collaboration` | Provides business email, Office tools, OneDrive storage, and collaboration tooling; exact inclusions depend on plan. | 1 | <https://www.exabytes.my/microsoft-365> |
| `exb_ai_business_hosting` | AI-Powered Business Hosting | `measurable_digital_growth` | Provides managed website-hosting foundations with site-building tools, SSL, and backup; exact resources and AI tools depend on plan. | 1 | <https://www.exabytes.my/web-hosting/business-web-hosting> |
| `exb_cloudflare_managed` | Cloudflare Managed Services | `protected_web_presence` | Provides website performance and protection capabilities including CDN, DDoS mitigation, SSL compatibility, and WAF features depending on plan. | 2 | <https://www.exabytes.my/web-security/cloudflare-web-performance-booster> |
| `exb_vision_cloud` | Exabytes Vision Cloud | `scalable_cloud_operations` | A managed, Malaysia-hosted virtual infrastructure option for production workloads, dedicated virtual resources, networking, monitoring, and optional backup/disaster recovery. | 4 | <https://www.exabytes.my/enterprise/evc> |
| `exb_ai_cloud` | Exabytes AI Cloud | `governed_ai_automation` | Combines cloud infrastructure with workflow automation and AI tooling in a Malaysia-hosted platform. It is a consultation/register-interest offering in this catalogue. | 3 | <https://www.exabytes.ai/ai-cloud> |
| `exb_eva` | Exabytes Vision AI (EVA) | `governed_ai_automation` | A no-code agentic AI platform for visually building agents grounded in business knowledge and connected to apps/data. It is a consultation/register-interest offering in this catalogue. | 3 | <https://www.exabytes.ai/eva> |

Cost tiers: `1 = starter`, `2 = growth`, `3 = advanced`, `4 = enterprise`.
They are internal ordering inputs only.

## 3. Offering selection rules

1. `shared_customer_operations` maps to Freshsales CRM.
2. `protected_business_continuity` maps to Acronis Cyber Protect.
3. `professional_team_collaboration` maps to:
   - EBiz Mail Pro when the dominant gap is professional email and cost is the
     highest concern;
   - Lark when coordination/workflow is the dominant gap;
   - Google Workspace when browser-first shared files and collaboration are
     preferred;
   - Microsoft 365 when Office/Outlook compatibility is an explicit need.
   When the assessment has no preference evidence, map to EBiz Mail Pro and
   label the other three as consultant-validated alternatives, not ranked
   claims.
4. `measurable_digital_growth` maps to AI-Powered Business Hosting only when an
   owned website/store foundation is missing or informal.
5. `protected_web_presence` maps to Cloudflare Managed Services only when an
   active website/store exists and web protection is the actual gap.
6. `scalable_cloud_operations` maps to Exabytes Vision Cloud only for an
   evidenced production infrastructure or scaling need; it is never a default
   SME recommendation.
7. `governed_ai_automation` maps to Exabytes AI Cloud by default and may list
   EVA as a consultant-validated alternative for agentic workflows. Both are
   `why later` until the Stage 03 hard prerequisites pass.

## 4. Re-verification

Re-check all active entries before the final demo and after any catalogue
change. A catalogue update must increment the semantic version, record its
verification date, and invalidate persisted recommendation results.
