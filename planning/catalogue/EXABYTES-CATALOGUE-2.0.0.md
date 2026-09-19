# Exabytes Catalogue 2.0.0

**Review state:** Active implementation snapshot  
**Primary-source verification date:** 20 September 2026 (MYT)  
**Fact policy:** No copied prices, discounts, testimonials, uptime promises, or inferred integrations. Every active claim has a current official Exabytes source. Commercial terms always require current confirmation.

## Challenge-facing coverage

| Category | Stable offering/path ID | Classification | Commercial state | Official source | Outcome |
|---|---|---|---|---|---|
| Shared customer operations | `exb_freshsales_crm` | partner/resold product | quote required | https://www.exabytes.my/freshworks/freshsales-crm | Active |
| Business continuity | `exb_acronis_cyber_protect` | partner/resold product | quote required | https://www.exabytes.my/acronis/cyber-protect | Active |
| Business email | `exb_business_email` | Exabytes product | quote required | https://www.exabytes.my/email/email-hosting | Active |
| Collaboration alternative | `exb_lark` | partner/resold product | quote required | https://www.exabytes.my/lark | Active |
| Collaboration alternative | `exb_google_workspace` | partner/resold product | quote required | https://www.exabytes.my/google-workspace | Active |
| Collaboration alternative | `exb_microsoft_365` | partner/resold product | quote required | https://www.exabytes.my/microsoft-365 | Active |
| Website foundation | `exb_ai_business_hosting` | Exabytes product | quote required | https://www.exabytes.my/web-hosting/business-web-hosting | Active |
| Managed WordPress | `exb_ai_wp_hosting` | Exabytes product | quote required | https://www.exabytes.my/web-hosting/wp-hosting | Active |
| Additional website-builder path | `exb_ai_website_builder_path` | supported path | quote required | https://www.exabytes.my/web-hosting/business-web-hosting | Active as a hosting capability, not a standalone SKU |
| Managed e-commerce | `exb_managed_ecommerce` | Exabytes product | consultation only | https://www.exabytes.my/managed-ecommerce-solution | Active |
| Shopify-specific implementation | `exb_shopify_partner_path` | supported path | consultation only | https://www.exabytes.my/partners/home/listing/mices-technology-sdn-bhd/ | Active only as a consultant-validated partner path, not an Exabytes Shopify SKU |
| Magento-specific implementation | `unavailable_magento_path` | unavailable/unverified | unavailable | No current official product/support page verified | Inactive; never mapped |
| Generic third-party e-commerce SaaS | `third_party_ecommerce_saas` | third-party alternative | consultation only | Category label only; no provider claim | Inactive and never represented as an Exabytes offering |
| Website protection | `exb_cloudflare_managed` | partner/resold product | quote required | https://www.exabytes.my/web-security/cloudflare-web-performance-booster | Active |
| Scalable infrastructure | `exb_vision_cloud` | Exabytes product | consultation only | https://www.exabytes.my/enterprise/evc | Active |
| Governed AI platform | `exb_ai_cloud` | Exabytes product | register interest | https://www.exabytes.ai/ai-cloud | Active after deterministic prerequisites |
| Agentic AI alternative | `exb_eva` | Exabytes product | register interest | https://www.exabytes.ai/eva | Active alternative after deterministic prerequisites |
| AI meeting assistance | `exb_meeting_ai` | Exabytes product | register interest | https://www.exabytes.ai/ | Active after governed-AI and meeting-data controls |
| AI sales assistance | `exb_ai_sales_team` | Exabytes product | register interest | https://www.exabytes.ai/ai-sales-team | Active after deterministic governed-AI prerequisites |
| AI marketing assistance | `exb_ai_marketing_team` | Exabytes product | register interest | https://www.exabytes.ai/ai-marketing-team | Active after deterministic governed-AI prerequisites |
| Campaign automation | `exb_freshmarketer` | partner/resold product | quote required | https://www.exabytes.my/freshworks/freshsales-crm | Active alternative; plan-specific AI remains caveated |
| AI customer support | `exb_freshdesk` | partner/resold product | quote required | https://www.exabytes.my/freshworks/helpdesk | Active alternative; Freddy AI is plan-dependent |
| Conversational support | `exb_freshchat` | partner/resold product | quote required | https://www.exabytes.my/freshworks | Active alternative; current channels/plans require validation |
| Bespoke product-gap route | `exb_bespoke_ai_consultation` | consultation-only | consultation only | https://www.exabytes.ai/ | Active only when no verified product mapping fits |

## Selection boundary

Catalogue 2.0.0 is a provider-domain input to the existing recommendation kernel. The kernel continues to select and rank capabilities first. A separate deterministic pass then evaluates explicit selection conditions and maps only active, approved, source-backed offerings. AI receives the completed recommendation and may explain it; AI cannot change capability eligibility, prerequisites, rank, fit, mapped offering, alternatives, costs, ROI, or roadmap phase.

`unavailable_magento_path` is deliberately retained as an inactive catalogue row so challenge coverage is explicit and testable. It has no source URL and no mapping.

## Review and disable behavior

Activated catalogue versions and their child rows are immutable. Catalogue admins prepare a new draft snapshot, append review events, and activate it after review. Disabling an offering means copying the catalogue to a new semantic version, marking the copied offering disabled, and removing its new-version mappings. Existing Blueprint and recommendation snapshots keep their original catalogue version and approved fact subset.

The public catalogue projection exposes only active offerings from the active version and excludes `unavailable/unverified` rows. Direct catalogue writes remain limited to authenticated `catalogue_admin` or `system_admin` members; service-role use stays server-only.

## Verification limitation

The official pages above were reachable and their non-promotional product/path statements were reviewed on the verification date. A targeted search did not establish a current official Exabytes Magento-specific product or support path, so Magento remains unavailable/unverified. Current availability, plan scope, terms, partner status, and quotes must be confirmed before purchase or implementation.
