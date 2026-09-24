begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any(array['profiles','organizations','organization_members','guest_sessions','assessment_sessions','assessment_answers','business_twins','evidence_items','diagnostic_runs','recommendation_runs','scenario_comparisons','scenario_revisions','blueprints','consent_records','report_artifacts','leads','lead_assignments','lead_events','consultant_notes','advisor_runs','advisor_reviews','model_calls','chat_sessions','chat_messages','workflow_outbox','catalogue_versions','catalogue_offerings','catalogue_mappings','retention_holds','export_requests','deletion_requests']) and not c.relrowsecurity),'RLS enabled on every Phase B table');
select ok(not has_table_privilege('anon','public.assessment_sessions','select'),'anon has no assessment access');
select ok(not has_table_privilege('anon','public.guest_sessions','select'),'anon has no guest-session access');
select ok(has_table_privilege('authenticated','public.assessment_sessions','select'),'authenticated receives explicit assessment grant');
select ok(not has_function_privilege('authenticated','public.claim_guest_session(text,uuid,uuid)','execute'),'claim RPC is server-only');
select ok(has_function_privilege('service_role','public.claim_guest_session(text,uuid,uuid)','execute'),'service role can invoke guarded claim RPC');
select ok(has_table_privilege('anon','public.public_catalogue_offerings','select'),'safe catalogue projection is public');
select is((select count(*)::integer from pg_policies where schemaname='storage' and tablename='objects' and policyname in ('report_objects_select','report_objects_insert','report_objects_update','report_objects_delete','export_objects_select','export_objects_insert','export_objects_update','export_objects_delete')),8,'private report and export buckets have complete operation policy matrix');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner@example.invalid','',now(),now(),now()),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values ('20000000-0000-0000-0000-000000000001','Owner Org'),('20000000-0000-0000-0000-000000000002','Other Org');
insert into public.organization_members(organization_id,user_id,role) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','prospect'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','prospect');
insert into public.assessment_sessions(id,organization_id,created_by,schema_version) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','1.0.0'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','1.0.0');

select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::integer from public.assessment_sessions),1,'member reads only own tenant');
select lives_ok($$insert into public.assessment_answers(id,assessment_session_id,answer_key,revision,value,schema_version,created_by) values('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','q1',1,'{}','1.0.0','10000000-0000-0000-0000-000000000001')$$,'member inserts own answer');
select throws_ok($$insert into public.assessment_answers(id,assessment_session_id,answer_key,revision,value,schema_version,created_by) values('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','q1',1,'{}','1.0.0','10000000-0000-0000-0000-000000000001')$$,'42501',null,'cross-tenant insert denied');
select throws_ok($$update public.organization_members set role='system_admin' where user_id='10000000-0000-0000-0000-000000000001'$$,'42501',null,'role escalation denied by grants');
select throws_ok($$update public.assessment_sessions set organization_id='20000000-0000-0000-0000-000000000002' where id='30000000-0000-0000-0000-000000000001'$$,'42501',null,'owner reassignment denied by RLS');
reset role;

insert into public.consent_records(id,assessment_session_id,organization_id,subject_kind,subject_id,purpose,action,consent_version,policy_version,text_hash,locale,presentation_surface,request_id,channel)
values('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','user','10000000-0000-0000-0000-000000000001','consultation_contact','granted','1','1',repeat('a',64),'en-MY','test','request-0001','test');
select throws_ok($$update public.consent_records set action='withdrawn' where id='50000000-0000-0000-0000-000000000001'$$,'22000','IMMUTABLE_RECORD','consent is append-only');
select is((select count(*)::integer from storage.buckets where id in ('majupilot-reports','majupilot-exports') and public=false),2,'report and export buckets are private');
select * from finish();
rollback;
