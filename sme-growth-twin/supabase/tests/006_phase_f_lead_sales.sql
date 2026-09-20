begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('16000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-f-owner@example.invalid','',now(),now(),now()),
('16000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-f-assigned@example.invalid','',now(),now(),now()),
('16000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-f-manager@example.invalid','',now(),now(),now()),
('16000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-f-outsider@example.invalid','',now(),now(),now()),
('16000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-f-team-consultant@example.invalid','',now(),now(),now()),
('16000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-f-admin@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values
('26000000-0000-0000-0000-000000000001','Phase F SME'),
('26000000-0000-0000-0000-000000000002','Phase F Sales Team'),
('26000000-0000-0000-0000-000000000003','Phase F Other Tenant'),
('26000000-0000-0000-0000-000000000004','Phase F Admin Tenant');
insert into public.organization_members(organization_id,user_id,role,team_key,status) values
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','prospect',null,'active'),
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000003','sales_manager','demo-sales','active'),
('26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000005','consultant','demo-sales','active'),
('26000000-0000-0000-0000-000000000002','16000000-0000-0000-0000-000000000002','consultant','demo-sales','active'),
('26000000-0000-0000-0000-000000000003','16000000-0000-0000-0000-000000000004','consultant','other-team','active'),
('26000000-0000-0000-0000-000000000004','16000000-0000-0000-0000-000000000006','system_admin',null,'active');
update public.sales_roster_entries set member_user_id='16000000-0000-0000-0000-000000000002',team_key='demo-sales' where stable_key='demo_sales_aina';

insert into public.assessment_sessions(id,organization_id,created_by,state,schema_version) values
('36000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','completed','1');
insert into public.business_twins(id,assessment_session_id,revision,payload,schema_version,rule_pack_version) values
('46000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001',1,'{}','1','1');
insert into public.diagnostic_runs(id,assessment_session_id,business_twin_id,payload,schema_version,rule_pack_version) values
('46000000-0000-0000-0000-000000000002','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000001','{}','1','1');
insert into public.recommendation_runs(id,assessment_session_id,diagnostic_run_id,business_twin_id,payload,schema_version,rule_pack_version) values
('46000000-0000-0000-0000-000000000003','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000002','46000000-0000-0000-0000-000000000001','{}','1','1');
insert into public.scenario_comparisons(id,assessment_session_id,recommendation_run_id,business_twin_id,schema_version,rule_pack_version) values
('46000000-0000-0000-0000-000000000004','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000003','46000000-0000-0000-0000-000000000001','1','1');
insert into public.scenario_revisions(id,scenario_comparison_id,revision,assumptions,results,schema_version) values
('46000000-0000-0000-0000-000000000005','46000000-0000-0000-0000-000000000004',1,'{}','{}','1');
insert into public.blueprints(id,assessment_session_id,revision,business_twin_id,diagnostic_run_id,recommendation_run_id,scenario_revision_id,payload,schema_version,rule_pack_version,provenance_hash) values
('46000000-0000-0000-0000-000000000006','36000000-0000-0000-0000-000000000001',1,'46000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000002','46000000-0000-0000-0000-000000000003','46000000-0000-0000-0000-000000000005','{}','1','1',repeat('a',64));
insert into public.report_artifacts(id,assessment_session_id,blueprint_id,report_number,report_version,blueprint_revision,organization_id,render_key,content_sha256,provenance_hash,object_path,status,mime_type,byte_length,page_count,storage_bucket,renderer_version,template_version,schema_version,rule_pack_version,catalogue_version,locale,request_id,generated_at,completed_at)
values('46000000-0000-0000-0000-000000000007','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006','MP-PHASE-F-R1',1,1,'26000000-0000-0000-0000-000000000001',repeat('b',64),repeat('c',64),repeat('d',64),'26000000-0000-0000-0000-000000000001/reports/f.pdf','completed','application/pdf',100,1,'majupilot-reports','majupilot-pdf-1.0.0','exabytes-blueprint-1.0.0','1.0.0','1','2.0.0','en-MY','phase-f-report','2026-09-20T00:00:00Z','2026-09-20T00:00:01Z');

select throws_ok($$select * from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-no-consent',repeat('e',64),'{}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-no-consent','correlation-no-consent')$$,'23514','CONSENT_REQUIRED','required consent fails closed');

insert into public.consent_records(id,assessment_session_id,organization_id,subject_kind,subject_id,purpose,action,consent_version,policy_version,text_hash,locale,presentation_surface,request_id,channel,blueprint_id,report_artifact_id,consent_snapshot,created_at) values
('56000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','user','16000000-0000-0000-0000-000000000001','consultation_contact','granted','1.0.0','privacy-1.0.0',repeat('1',64),'en-MY','consultation','consent-contact-f','web','46000000-0000-0000-0000-000000000006','46000000-0000-0000-0000-000000000007','{"explicit":true}','2026-09-20T00:01:00Z'),
('56000000-0000-0000-0000-000000000002','36000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','user','16000000-0000-0000-0000-000000000001','report_share_with_sales','granted','1.0.0','privacy-1.0.0',repeat('2',64),'en-MY','consultation','consent-report-f','web','46000000-0000-0000-0000-000000000006','46000000-0000-0000-0000-000000000007','{"explicit":true}','2026-09-20T00:01:01Z');

select lives_ok($$select * from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-create-0001',repeat('e',64),'{"name":"Owner User","businessName":"Phase F SME","email":"owner@example.invalid","urgency":"within_30_days"}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-create-0001','correlation-create-0001')$$,'valid consent and report create a lead');
select is((select count(*)::integer from public.leads where assessment_session_id='36000000-0000-0000-0000-000000000001'),1,'one durable lead exists');
select is((select roster_key from public.lead_assignments where sequence=1),'demo_sales_aina','deterministic matching selects the expected fictional salesperson');
select is((select count(*)::integer from public.lead_events),5,'creation appends the four lead events and durable delivery enqueue event');
select is((select count(*)::integer from public.workflow_outbox),1,'lead and provider-neutral delivery work commit together');
select is((select consent_snapshot->>'version' from public.leads limit 1),'phase-f-consent-snapshot-1.0.0','lead stores an explicit versioned consent snapshot');
select is((select report_content_sha256 from public.leads limit 1),repeat('c',64),'lead stores the exact canonical report hash');
select is((select replayed from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-create-0001',repeat('e',64),'{"name":"Owner User","businessName":"Phase F SME","email":"owner@example.invalid","urgency":"within_30_days"}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-create-0001','correlation-create-0001')),true,'same request replays');
select throws_ok($$select * from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-create-0001',repeat('f',64),'{}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-conflict','correlation-conflict')$$,'23505','IDEMPOTENCY_CONFLICT','same key with a different payload conflicts');
select throws_ok($$update public.leads set organization_id='26000000-0000-0000-0000-000000000003'$$,'22000','IMMUTABLE_LEAD_IDENTITY','lead ownership is immutable');
select throws_ok($$update public.lead_events set reason_code='changed'$$,'22000','IMMUTABLE_RECORD','lead event history is append-only');

select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'owner prospect can read own safe lead row'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.lead_assignments),0,'owner prospect cannot read internal assignment inputs or load snapshots'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000002","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'assigned fictional salesperson account can read the lead'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000002","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.lead_assignments),1,'assigned salesperson can read the authorized assignment record'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000003","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'scoped sales manager can read the lead'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000005","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'team-authorized consultant can read the lead'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000004","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),0,'cross-tenant consultant cannot read the lead'); reset role;
select set_config('request.jwt.claims','{"sub":"16000000-0000-0000-0000-000000000006","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.leads),1,'explicit system admin membership can read the lead'); reset role;
set local role anon; select throws_ok($$select count(*) from public.leads$$,'42501',null,'anonymous access has no table grant'); reset role;

update public.sales_roster_entries set active=false;
select is((select assignment_state from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-unassigned',repeat('6',64),'{"name":"Owner User","businessName":"Phase F SME","email":"owner@example.invalid","urgency":"within_30_days"}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-unassigned','correlation-unassigned')),'unassigned','no eligible salesperson commits a truthful unassigned lead');
select is((select queue_key from public.lead_assignments where queue_key is not null order by created_at desc limit 1),'unassigned','unassigned outcome uses the durable queue');

insert into public.consent_records(id,assessment_session_id,organization_id,subject_kind,subject_id,purpose,action,consent_version,policy_version,text_hash,locale,presentation_surface,parent_consent_id,request_id,channel,blueprint_id,report_artifact_id,created_at) values
('56000000-0000-0000-0000-000000000003','36000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','user','16000000-0000-0000-0000-000000000001','consultation_contact','withdrawn','1.0.0','privacy-1.0.0',repeat('3',64),'en-MY','settings','56000000-0000-0000-0000-000000000001','consent-withdraw-f','web','46000000-0000-0000-0000-000000000006','46000000-0000-0000-0000-000000000007','2026-09-20T00:02:00Z');
select throws_ok($$select * from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000001','26000000-0000-0000-0000-000000000001','16000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-after-withdrawal',repeat('4',64),'{}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-after-withdrawal','correlation-after-withdrawal')$$,'23514','CONSENT_REQUIRED','withdrawal blocks future lead creation');
select throws_ok($$select * from public.create_phase_f_lead('organization','16000000-0000-0000-0000-000000000004','26000000-0000-0000-0000-000000000003','16000000-0000-0000-0000-000000000004','36000000-0000-0000-0000-000000000001','46000000-0000-0000-0000-000000000006',1,'46000000-0000-0000-0000-000000000007',repeat('c',64),'56000000-0000-0000-0000-000000000001','56000000-0000-0000-0000-000000000002','phase-f-cross-tenant',repeat('5',64),'{}','Central','English',array['productivity'],'demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-cross-tenant','correlation-cross-tenant')$$,'42501','FORBIDDEN','cross-tenant creation fails before artifact disclosure');

insert into public.guest_sessions(id,token_digest,expires_at,absolute_expires_at,revoked_at) values('66000000-0000-0000-0000-000000000001',repeat('9',64),now()+interval '1 hour',now()+interval '1 day',now());
insert into public.assessment_sessions(id,guest_session_id,state,schema_version) values('66000000-0000-0000-0000-000000000002','66000000-0000-0000-0000-000000000001','completed','1');
select throws_ok($$select * from public.create_phase_f_lead('guest','66000000-0000-0000-0000-000000000001',null,null,'66000000-0000-0000-0000-000000000002','66000000-0000-0000-0000-000000000003',1,'66000000-0000-0000-0000-000000000004',repeat('7',64),'66000000-0000-0000-0000-000000000005','66000000-0000-0000-0000-000000000006','phase-f-revoked-guest',repeat('8',64),'{}',null,null,'{}','demo-roster-1.0.0','deterministic-roster-load-1.0.0','request-revoked-guest','correlation-revoked-guest')$$,'42501','FORBIDDEN','revoked guest is denied before artifact disclosure');

select * from finish();
rollback;
