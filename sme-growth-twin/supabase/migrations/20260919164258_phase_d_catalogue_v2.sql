begin;

alter table public.catalogue_versions
  add column verified_at date,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users(id),
  add column reviewed_by_key text;

create table public.catalogue_review_events (
  id uuid primary key default gen_random_uuid(),
  catalogue_version_id uuid not null references public.catalogue_versions(id) on delete restrict,
  stable_offering_id text,
  event_type text not null check(event_type in ('submitted','reviewed','activated','retired','offering_disabled')),
  reason text not null,
  actor_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index catalogue_review_events_version_idx on public.catalogue_review_events(catalogue_version_id,created_at);

create or replace function app_private.is_catalogue_admin()
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.organization_members m where m.user_id=(select auth.uid()) and m.status='active' and m.role in ('catalogue_admin','system_admin'));
$$;
revoke all on function app_private.is_catalogue_admin() from public,anon,authenticated;
grant execute on function app_private.is_catalogue_admin() to authenticated;

create or replace function app_private.guard_catalogue_version_transition()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if tg_op='DELETE' then raise exception using errcode='22000',message='IMMUTABLE_CATALOGUE_VERSION'; end if;
  if new.semantic_version is distinct from old.semantic_version or new.created_at is distinct from old.created_at then raise exception using errcode='22000',message='IMMUTABLE_CATALOGUE_IDENTITY'; end if;
  if (old.review_state,new.review_state) not in (('draft','draft'),('draft','reviewed'),('reviewed','reviewed'),('reviewed','active'),('active','active'),('active','retired'),('retired','retired')) then raise exception using errcode='22000',message='INVALID_CATALOGUE_TRANSITION'; end if;
  if new.review_state in ('reviewed','active') and (new.reviewed_at is null or (new.reviewed_by is null and new.reviewed_by_key is null) or new.verified_at is null) then raise exception using errcode='23514',message='CATALOGUE_REVIEW_REQUIRED'; end if;
  return new;
end $$;
create trigger catalogue_versions_guard before update or delete on public.catalogue_versions for each row execute function app_private.guard_catalogue_version_transition();

create or replace function app_private.guard_catalogue_child_write()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare target_version uuid:=case when tg_op='DELETE' then old.catalogue_version_id else new.catalogue_version_id end;
begin
  if not exists(select 1 from public.catalogue_versions v where v.id=target_version and v.review_state='draft') then raise exception using errcode='22000',message='IMMUTABLE_ACTIVATED_CATALOGUE'; end if;
  return case when tg_op='DELETE' then old else new end;
end $$;
create trigger catalogue_offerings_guard before insert or update or delete on public.catalogue_offerings for each row execute function app_private.guard_catalogue_child_write();
create trigger catalogue_mappings_guard before insert or update or delete on public.catalogue_mappings for each row execute function app_private.guard_catalogue_child_write();
create trigger catalogue_review_events_immutable before update or delete on public.catalogue_review_events for each row execute function app_private.guard_immutable_event();

alter table public.catalogue_review_events enable row level security;
alter table public.catalogue_review_events force row level security;
revoke all on public.catalogue_review_events from public,anon,authenticated;
grant all privileges on public.catalogue_review_events to service_role;
grant select,insert,update on public.catalogue_versions to authenticated;
grant select,insert on public.catalogue_offerings,public.catalogue_mappings,public.catalogue_review_events to authenticated;
grant select(facts) on public.catalogue_offerings to anon,authenticated;
create policy catalogue_versions_admin_select on public.catalogue_versions for select to authenticated using(app_private.is_catalogue_admin());
create policy catalogue_versions_admin_insert on public.catalogue_versions for insert to authenticated with check(app_private.is_catalogue_admin() and review_state='draft');
create policy catalogue_versions_admin_update on public.catalogue_versions for update to authenticated using(app_private.is_catalogue_admin()) with check(app_private.is_catalogue_admin());
create policy catalogue_offerings_admin_select on public.catalogue_offerings for select to authenticated using(app_private.is_catalogue_admin());
create policy catalogue_offerings_admin_insert on public.catalogue_offerings for insert to authenticated with check(app_private.is_catalogue_admin());
create policy catalogue_mappings_admin_select on public.catalogue_mappings for select to authenticated using(app_private.is_catalogue_admin());
create policy catalogue_mappings_admin_insert on public.catalogue_mappings for insert to authenticated with check(app_private.is_catalogue_admin());
create policy catalogue_review_events_admin_select on public.catalogue_review_events for select to authenticated using(app_private.is_catalogue_admin());
create policy catalogue_review_events_admin_insert on public.catalogue_review_events for insert to authenticated with check(app_private.is_catalogue_admin() and (actor_user_id is null or actor_user_id=(select auth.uid())));

with version_row as (
  insert into public.catalogue_versions(semantic_version,review_state,verified_at)
  values('2.0.0','draft','2026-09-20')
  on conflict(semantic_version) do update set verified_at=excluded.verified_at
  returning id
)
insert into public.catalogue_offerings(catalogue_version_id,stable_offering_id,classification,name,provider,approved_summary,official_source_url,verified_at,active,facts)
select version_row.id,seed.stable_id,seed.classification,seed.name,seed.provider,seed.summary,seed.source_url,case when seed.source_url is null then null else '2026-09-20T00:00:00+08:00'::timestamptz end,seed.active,
  jsonb_build_object('capabilityIds',seed.capabilities,'commercialStatus',seed.commercial_status,'relativeCostTier',seed.cost_tier,'pricingTreatment','verify_current_quote','sourceReferenceId',seed.source_ref,'reviewState',case when seed.active then 'approved' else 'unavailable' end,'reviewedBy','MajuPilot catalogue review','prerequisites',seed.prerequisites,'caveats',seed.caveats)
from version_row cross join (values
  ('exb_freshsales_crm','partner/resold product','Freshsales CRM','Freshworks via Exabytes','Centralises customer information and interactions; supports sales pipelines, activities, follow-up, reports, workflows, and multi-channel engagement.','https://www.exabytes.my/freshworks/freshsales-crm',true,array['shared_customer_operations'],'quote_required',2,'EXB-FRESHSALES',array[]::text[],array['Confirm current plan details and terms with Exabytes.']),
  ('exb_acronis_cyber_protect','partner/resold product','Acronis Cyber Protect','Acronis via Exabytes','Combines backup/recovery with endpoint cyber protection and centralised protection management.','https://www.exabytes.my/acronis/cyber-protect',true,array['protected_business_continuity'],'quote_required',1,'EXB-ACRONIS',array[]::text[],array['Confirm current plan details and terms with Exabytes.']),
  ('exb_business_email','Exabytes product','EBiz Mail Pro Business Email','Exabytes','Provides domain-based business email and team-sharing functions.','https://www.exabytes.my/email/email-hosting',true,array['professional_team_collaboration'],'quote_required',1,'EXB-EMAIL',array[]::text[],array['Confirm current plan details and terms with Exabytes.']),
  ('exb_lark','partner/resold product','Lark','Lark via Exabytes','Exabytes offers Lark as a team collaboration and work-management option.','https://www.exabytes.my/lark',true,array['professional_team_collaboration'],'quote_required',1,'EXB-LARK',array[]::text[],array['Plan-specific capabilities require current review.']),
  ('exb_google_workspace','partner/resold product','Google Workspace','Google via Exabytes','Provides business email, cloud files, collaboration, meetings, administration, and security controls.','https://www.exabytes.my/google-workspace',true,array['professional_team_collaboration'],'quote_required',1,'EXB-GWS',array[]::text[],array['Plan-specific capabilities require current review.']),
  ('exb_microsoft_365','partner/resold product','Microsoft 365','Microsoft via Exabytes','Provides business email, Office tools, OneDrive storage, and collaboration tooling.','https://www.exabytes.my/microsoft-365',true,array['professional_team_collaboration'],'quote_required',1,'EXB-M365',array[]::text[],array['Plan-specific capabilities require current review.']),
  ('exb_ai_business_hosting','Exabytes product','AI-Powered Business Hosting','Exabytes','Provides website-hosting foundations with site-building tools, SSL, and backup.','https://www.exabytes.my/web-hosting/business-web-hosting',true,array['measurable_digital_growth'],'quote_required',1,'EXB-BIZHOST',array['A missing or informal owned website foundation'],array['Exact resources and AI tools depend on plan.']),
  ('exb_ai_wp_hosting','Exabytes product','AI-Powered WP Hosting','Exabytes','WordPress-oriented hosting with setup and management tools, AI-assisted site/content tools, SSL, and backup features.','https://www.exabytes.my/web-hosting/wp-hosting',true,array['measurable_digital_growth'],'quote_required',1,'EXB-WP',array['A missing or informal owned website foundation','A confirmed WordPress preference or compatibility need'],array['Exact plan features require confirmation.']),
  ('exb_ai_website_builder_path','supported path','AI Website Builder path','Exabytes','AI-assisted website and content creation is a reviewed capability within Exabytes Business Hosting, not a separate SKU.','https://www.exabytes.my/web-hosting/business-web-hosting',true,array['measurable_digital_growth'],'quote_required',1,'EXB-BIZHOST',array['A missing or informal owned website foundation'],array['Confirm the current hosting plan inclusion.']),
  ('exb_managed_ecommerce','Exabytes product','Managed eCommerce Solution','Exabytes','A managed commerce path covering website, marketplace integration, operations, customer care, marketing, reporting, and consultation.','https://www.exabytes.my/managed-ecommerce-solution',true,array['measurable_digital_growth','shared_customer_operations'],'consultation_only',4,'EXB-ECOM',array['A confirmed commerce operating need','Consultant validation of channels, fulfilment, and ownership'],array['Exact scope requires consultation.']),
  ('exb_shopify_partner_path','supported path','Shopify Partner implementation path','Exabytes partner directory','An official Exabytes partner-directory listing supports only a consultant-validated Shopify path, not an Exabytes Shopify SKU.','https://www.exabytes.my/partners/home/listing/mices-technology-sdn-bhd/',true,array['measurable_digital_growth'],'consultation_only',3,'EXB-SHOPIFY',array['An explicit Shopify requirement','Current partner relationship and scope validation'],array['Not an Exabytes Shopify SKU.']),
  ('unavailable_magento_path','unavailable/unverified','Magento-specific implementation','Unverified','No current official Exabytes product or supported-path page was verified for a Magento-specific implementation.',null,false,array['measurable_digital_growth'],'unavailable',4,'EXB-MAGENTO-UNVERIFIED',array[]::text[],array['Do not map until an official current source is reviewed.']),
  ('third_party_ecommerce_saas','third-party alternative','Generic third-party eCommerce SaaS','Third party','A category-only non-Exabytes alternative. No provider, endorsement, features, integration, or commercial terms are asserted.',null,false,array['measurable_digital_growth'],'consultation_only',2,'CATEGORY-THIRD-PARTY-ECOMMERCE',array[]::text[],array['Do not imply Exabytes sale, support, endorsement, or integration.']),
  ('exb_cloudflare_managed','partner/resold product','Cloudflare Managed Services','Cloudflare via Exabytes','Provides website CDN, DDoS mitigation, SSL compatibility, and plan-dependent WAF capabilities.','https://www.exabytes.my/web-security/cloudflare-web-performance-booster',true,array['protected_web_presence'],'quote_required',2,'EXB-CLOUDFLARE',array['An active website and evidenced protection gap'],array['Plan details require current review.']),
  ('exb_vision_cloud','Exabytes product','Exabytes Vision Cloud','Exabytes','A managed Malaysia-hosted virtual infrastructure option for production workloads.','https://www.exabytes.my/enterprise/evc',true,array['scalable_cloud_operations'],'consultation_only',4,'EXB-EVC',array['An evidenced production infrastructure or scaling need'],array['Quote and optional services require consultation.']),
  ('exb_ai_cloud','Exabytes product','Exabytes AI Cloud','Exabytes','Combines cloud infrastructure with workflow automation and AI tooling in a Malaysia-hosted platform.','https://www.exabytes.ai/ai-cloud',true,array['governed_ai_automation'],'register_interest',3,'EXB-AICLOUD',array['Governed AI prerequisites are met'],array['Register-interest path; confirm current availability.']),
  ('exb_eva','Exabytes product','Exabytes Vision AI (EVA)','Exabytes','A no-code agentic AI platform for building agents grounded in business knowledge and connected to apps/data.','https://www.exabytes.ai/eva',true,array['governed_ai_automation'],'register_interest',3,'EXB-EVA',array['Governed AI prerequisites are met'],array['Register-interest path; confirm current availability.']),
  ('exb_meeting_ai','Exabytes product','Meeting AI','Exabytes','A register-interest meeting assistant producing summaries, action items, and next steps.','https://www.exabytes.ai/',true,array['governed_ai_automation','professional_team_collaboration'],'register_interest',2,'EXB-GROWAI',array['Governed AI prerequisites are met','Meeting consent and human-review controls'],array['Register-interest path.']),
  ('exb_ai_sales_team','Exabytes product','AI Sales Team','Exabytes','A consultation-led AI-agent team for sales research, outreach, qualification, follow-up, enablement, CRM data, and reporting.','https://www.exabytes.ai/ai-sales-team',true,array['governed_ai_automation','shared_customer_operations'],'register_interest',3,'EXB-SALES',array['Governed AI prerequisites are met','Defined sales process and human oversight'],array['Register-interest path.']),
  ('exb_ai_marketing_team','Exabytes product','AI Digital Marketing Team Agent','Exabytes','A register-interest AI marketing-agent team for coordinated brand, traffic, campaign, and lead-conversion work.','https://www.exabytes.ai/ai-marketing-team',true,array['governed_ai_automation','measurable_digital_growth'],'register_interest',3,'EXB-MARKETING',array['Governed AI prerequisites are met','Brand and human-review workflows are defined'],array['Register-interest path.']),
  ('exb_freshmarketer','partner/resold product','Freshmarketer','Freshworks via Exabytes','An Exabytes-offered campaign path with multichannel marketing, journey, tracking, segmentation, reporting, and plan-dependent AI features.','https://www.exabytes.my/freshworks/freshsales-crm',true,array['measurable_digital_growth'],'quote_required',2,'EXB-FRESHSALES',array['A confirmed campaign automation and measurement gap'],array['Current plan capabilities require review.']),
  ('exb_freshdesk','partner/resold product','Freshdesk','Freshworks via Exabytes','An Exabytes-offered helpdesk path with ticketing, shared inboxes, knowledge base, automation, and plan-dependent Freddy AI.','https://www.exabytes.my/freshworks/helpdesk',true,array['shared_customer_operations'],'quote_required',2,'EXB-FRESHDESK',array['A confirmed support volume or channel-management need'],array['Current plan and AI inclusions require review.']),
  ('exb_freshchat','partner/resold product','Freshchat','Freshworks via Exabytes','A conversational support path within the Freshworks portfolio offered by Exabytes.','https://www.exabytes.my/freshworks',true,array['shared_customer_operations'],'quote_required',2,'EXB-FRESHWORKS',array['A confirmed real-time customer messaging need'],array['Current plan and channel support require review.']),
  ('exb_bespoke_ai_consultation','consultation-only','Bespoke AI and integration consultation','Exabytes','A consultation-only route for needs that do not fit a verified product mapping; no SKU, features, price, or outcome is implied.','https://www.exabytes.ai/',true,array['governed_ai_automation','shared_customer_operations','measurable_digital_growth'],'consultation_only',4,'EXB-GROWAI',array['No verified product mapping adequately fits'],array['A consultant must validate scope and delivery assumptions.'])
) as seed(stable_id,classification,name,provider,summary,source_url,active,capabilities,commercial_status,cost_tier,source_ref,prerequisites,caveats)
on conflict(catalogue_version_id,stable_offering_id) do nothing;

with version_row as (select id from public.catalogue_versions where semantic_version='2.0.0')
insert into public.catalogue_mappings(catalogue_version_id,capability_id,stable_offering_id,rule)
select version_row.id,seed.capability_id,seed.offering_id,jsonb_build_object('selectionRuleId',seed.rule_id,'mappingReason',seed.reason)
from version_row cross join (values
 ('shared_customer_operations','exb_freshsales_crm','catalogue_rule_1','Default shared customer operations mapping.'),
 ('shared_customer_operations','exb_freshdesk','catalogue_rule_15_freshdesk','Customer-support alternative.'),
 ('shared_customer_operations','exb_freshchat','catalogue_rule_16_freshchat','Conversational-support alternative.'),
 ('protected_business_continuity','exb_acronis_cyber_protect','catalogue_rule_2','Backup and protection mapping.'),
 ('professional_team_collaboration','exb_business_email','catalogue_rule_3_email','Professional email foundation.'),
 ('professional_team_collaboration','exb_lark','catalogue_rule_3_lark','Collaboration alternative.'),
 ('professional_team_collaboration','exb_google_workspace','catalogue_rule_3_google','Browser-first productivity alternative.'),
 ('professional_team_collaboration','exb_microsoft_365','catalogue_rule_3_microsoft','Office-compatible productivity alternative.'),
 ('professional_team_collaboration','exb_meeting_ai','catalogue_rule_11_meeting_ai','Governed meeting-assistance path.'),
 ('measurable_digital_growth','exb_ai_business_hosting','catalogue_rule_4','Website foundation mapping.'),
 ('measurable_digital_growth','exb_ai_wp_hosting','catalogue_rule_8_wp','WordPress-specific website path.'),
 ('measurable_digital_growth','exb_ai_website_builder_path','catalogue_rule_17_builder','Website-builder supported path.'),
 ('measurable_digital_growth','exb_managed_ecommerce','catalogue_rule_9_ecommerce','Managed commerce path.'),
 ('measurable_digital_growth','exb_shopify_partner_path','catalogue_rule_10_shopify','Consultant-validated Shopify path.'),
 ('measurable_digital_growth','exb_freshmarketer','catalogue_rule_14_freshmarketer','Campaign automation alternative.'),
 ('protected_web_presence','exb_cloudflare_managed','catalogue_rule_5','Active website protection mapping.'),
 ('scalable_cloud_operations','exb_vision_cloud','catalogue_rule_6','Scaling infrastructure mapping.'),
 ('governed_ai_automation','exb_ai_cloud','catalogue_rule_7','Default governed AI mapping.'),
 ('governed_ai_automation','exb_eva','catalogue_rule_7_eva','Agentic AI alternative.'),
 ('governed_ai_automation','exb_meeting_ai','catalogue_rule_11_meeting_ai','Meeting-assistance path.'),
 ('governed_ai_automation','exb_ai_sales_team','catalogue_rule_12_ai_sales','Sales-assistance path.'),
 ('governed_ai_automation','exb_ai_marketing_team','catalogue_rule_13_ai_marketing','Marketing-assistance path.'),
 ('governed_ai_automation','exb_bespoke_ai_consultation','catalogue_rule_18_bespoke','Consultation-only fallback path.')
) as seed(capability_id,offering_id,rule_id,reason)
on conflict(catalogue_version_id,capability_id,stable_offering_id) do nothing;

update public.catalogue_versions set review_state='reviewed',reviewed_at=now(),reviewed_by_key='phase-d-primary-source-review',verified_at='2026-09-20' where semantic_version='2.0.0' and review_state='draft';
update public.catalogue_versions set review_state='active',effective_at=coalesce(effective_at,now()) where semantic_version='2.0.0' and review_state='reviewed';
update public.catalogue_versions set review_state='retired',retired_at=coalesce(retired_at,now()) where semantic_version='1.0.0' and review_state='active';

create or replace view public.public_catalogue_offerings with(security_invoker=true) as
select o.stable_offering_id,o.name,o.provider,o.classification,o.approved_summary,o.official_source_url,o.verified_at,v.semantic_version,o.facts->>'commercialStatus' as commercial_status,o.facts->>'sourceReferenceId' as source_reference_id
from public.catalogue_offerings o join public.catalogue_versions v on v.id=o.catalogue_version_id
where o.active and v.review_state='active' and o.classification<>'unavailable/unverified';
revoke all on public.public_catalogue_offerings from public;
grant select on public.public_catalogue_offerings to anon,authenticated;

commit;
