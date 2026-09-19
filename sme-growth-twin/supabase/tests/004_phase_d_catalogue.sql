begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('14000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','catalogue-admin@example.invalid','',now(),now(),now()),
('14000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','catalogue-outsider@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values ('24000000-0000-0000-0000-000000000001','Catalogue Org');
insert into public.organization_members(organization_id,user_id,role) values ('24000000-0000-0000-0000-000000000001','14000000-0000-0000-0000-000000000001','catalogue_admin');

set local role anon;
select ok((select count(*) from public.public_catalogue_offerings)>0,'anon sees reviewed active public catalogue rows');
select is((select count(*)::integer from public.public_catalogue_offerings where stable_offering_id='unavailable_magento_path'),0,'unavailable Magento row is never public');
select is((select count(*)::integer from public.catalogue_versions where semantic_version='2.0.0'),1,'anon sees only the active catalogue version');
reset role;

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000002","role":"authenticated"}',true); set local role authenticated;
select throws_ok($$insert into public.catalogue_versions(semantic_version,review_state) values('9.0.0','draft')$$,'42501',null,'non-admin cannot create a catalogue version');
reset role;

select set_config('request.jwt.claims','{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}',true); set local role authenticated;
select lives_ok($$insert into public.catalogue_versions(semantic_version,review_state,verified_at) values('2.0.1','draft','2026-09-20')$$,'catalogue admin can create a draft version');
select lives_ok($$insert into public.catalogue_offerings(catalogue_version_id,stable_offering_id,classification,name,provider,approved_summary,official_source_url,verified_at,active,facts) select id,'draft_test','consultation-only','Draft test','Exabytes','Draft only','https://www.exabytes.ai/','2026-09-20',false,'{}' from public.catalogue_versions where semantic_version='2.0.1'$$,'catalogue admin can populate a draft');
select throws_ok($$insert into public.catalogue_offerings(catalogue_version_id,stable_offering_id,classification,name,provider,approved_summary,official_source_url,verified_at,active,facts) select id,'active_attack','Exabytes product','Attack','Exabytes','Must fail','https://www.exabytes.ai/','2026-09-20',true,'{}' from public.catalogue_versions where semantic_version='2.0.0'$$,'22000','IMMUTABLE_ACTIVATED_CATALOGUE','activated catalogue children are immutable');
select throws_ok($$update public.catalogue_offerings set active=false where stable_offering_id='exb_meeting_ai'$$,'42501',null,'direct offering updates are denied; disable requires a new version');
reset role;

select * from finish();
rollback;
