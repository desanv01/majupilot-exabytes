begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('12000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','prospect@example.invalid','',now(),now(),now()),
('12000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','consultant@example.invalid','',now(),now(),now()),
('12000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','manager@example.invalid','',now(),now(),now()),
('12000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','outsider@example.invalid','',now(),now(),now()),
('12000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other-tenant@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values ('22000000-0000-0000-0000-000000000001','Scoped Org'),('22000000-0000-0000-0000-000000000002','Other Tenant');
insert into public.organization_members(organization_id,user_id,role,team_key) values
('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001','prospect',null),
('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000002','consultant','team-a'),
('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000003','sales_manager','team-a'),
('22000000-0000-0000-0000-000000000002','12000000-0000-0000-0000-000000000005','prospect',null);
insert into public.assessment_sessions(id,organization_id,created_by,schema_version) values ('32000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001','1');
insert into public.business_twins(id,assessment_session_id,revision,payload,schema_version,rule_pack_version) values ('42000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001',1,'{}','1','1');
insert into public.diagnostic_runs(id,assessment_session_id,business_twin_id,payload,schema_version,rule_pack_version) values ('43000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','42000000-0000-0000-0000-000000000001','{}','1','1');
insert into public.recommendation_runs(id,assessment_session_id,diagnostic_run_id,business_twin_id,payload,schema_version,rule_pack_version) values ('44000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','43000000-0000-0000-0000-000000000001','42000000-0000-0000-0000-000000000001','{}','1','1');
insert into public.scenario_comparisons(id,assessment_session_id,recommendation_run_id,business_twin_id,schema_version,rule_pack_version) values ('45000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000001','42000000-0000-0000-0000-000000000001','1','1');
insert into public.scenario_revisions(id,scenario_comparison_id,revision,assumptions,results,schema_version) values ('46000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000001',1,'{}','{}','1');
insert into public.blueprints(id,assessment_session_id,revision,business_twin_id,diagnostic_run_id,recommendation_run_id,scenario_revision_id,payload,schema_version,rule_pack_version,provenance_hash) values ('47000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001',1,'42000000-0000-0000-0000-000000000001','43000000-0000-0000-0000-000000000001','44000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000001','{}','1','1',repeat('b',64));
insert into public.leads(id,organization_id,assessment_session_id,blueprint_id,idempotency_key,request_hash) values ('48000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','47000000-0000-0000-0000-000000000001','lead-request-1',repeat('c',64));
insert into public.lead_assignments(id,lead_id,sequence,assignee_member_user_id,team_key,reason,algorithm_version) values ('49000000-0000-0000-0000-000000000001','48000000-0000-0000-0000-000000000001',1,'12000000-0000-0000-0000-000000000002','team-a','initial','1');
insert into storage.objects(id,bucket_id,name) values ('52000000-0000-0000-0000-000000000001','majupilot-reports','22000000-0000-0000-0000-000000000001/opaque/report.pdf'),('52000000-0000-0000-0000-000000000002','majupilot-reports','22000000-0000-0000-0000-000000000002/opaque/report.pdf');

select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'prospect reads own organization lead');
select is((select count(*)::integer from storage.objects where bucket_id='majupilot-reports'),1,'member reads only own organization objects');
select lives_ok($$insert into storage.objects(id,bucket_id,name) values('52000000-0000-0000-0000-000000000003','majupilot-reports','22000000-0000-0000-0000-000000000001/opaque/new.pdf')$$,'member can insert scoped report object');
select lives_ok($$update storage.objects set metadata='{"verified":true}' where id='52000000-0000-0000-0000-000000000003'$$,'report upsert update path is authorized');
select throws_ok($$delete from storage.objects where id='52000000-0000-0000-0000-000000000003'$$,'42501',null,'prospect cannot delete report object'); reset role;
select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'assigned consultant reads lead'); reset role;
select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'sales manager reads scoped lead');
select throws_ok($$delete from storage.objects where id='52000000-0000-0000-0000-000000000003'$$,'42501','Direct deletion from storage tables is not allowed. Use the Storage API instead.','manager passes RLS and reaches the Storage API-only delete guard'); reset role;
select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000004","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),0,'non-member reads no leads');
select throws_ok($$insert into storage.objects(id,bucket_id,name) values('52000000-0000-0000-0000-000000000004','majupilot-reports','22000000-0000-0000-0000-000000000001/opaque/attack.pdf')$$,'42501',null,'non-member cannot insert report object'); reset role;
select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000005","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),0,'other tenant reads no leads'); reset role;
set local role anon; select is((select count(*)::integer from storage.objects where bucket_id='majupilot-reports'),0,'anon reads no private Storage objects'); reset role;
select * from finish(); rollback;
