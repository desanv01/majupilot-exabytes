begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('15000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-e-prospect@example.invalid','',now(),now(),now()),
('15000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-e-consultant@example.invalid','',now(),now(),now()),
('15000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase-e-outsider@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values
('25000000-0000-0000-0000-000000000001','Phase E Org'),
('25000000-0000-0000-0000-000000000002','Phase E Other Org');
insert into public.organization_members(organization_id,user_id,role,status) values
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','prospect','active'),
('25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000002','consultant','active'),
('25000000-0000-0000-0000-000000000002','15000000-0000-0000-0000-000000000003','consultant','active');
insert into public.assessment_sessions(id,organization_id,created_by,schema_version) values
('35000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000001','15000000-0000-0000-0000-000000000001','1');
insert into public.business_twins(id,assessment_session_id,revision,payload,schema_version,rule_pack_version) values
('45000000-0000-0000-0000-000000000001','35000000-0000-0000-0000-000000000001',1,'{}','1','1');
insert into public.diagnostic_runs(id,assessment_session_id,business_twin_id,payload,schema_version,rule_pack_version) values
('45000000-0000-0000-0000-000000000002','35000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000001','{}','1','1');
insert into public.recommendation_runs(id,assessment_session_id,diagnostic_run_id,business_twin_id,payload,schema_version,rule_pack_version) values
('45000000-0000-0000-0000-000000000003','35000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000002','45000000-0000-0000-0000-000000000001','{}','1','1');
insert into public.scenario_comparisons(id,assessment_session_id,recommendation_run_id,business_twin_id,schema_version,rule_pack_version) values
('45000000-0000-0000-0000-000000000004','35000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000001','1','1');
insert into public.scenario_revisions(id,scenario_comparison_id,revision,assumptions,results,schema_version) values
('45000000-0000-0000-0000-000000000005','45000000-0000-0000-0000-000000000004',1,'{}','{}','1');
insert into public.blueprints(id,assessment_session_id,revision,business_twin_id,diagnostic_run_id,recommendation_run_id,scenario_revision_id,payload,schema_version,rule_pack_version,provenance_hash) values
('45000000-0000-0000-0000-000000000006','35000000-0000-0000-0000-000000000001',1,'45000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000002','45000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000005','{}','1','1',repeat('a',64));
insert into public.leads(id,organization_id,assessment_session_id,blueprint_id,idempotency_key,request_hash) values
('45000000-0000-0000-0000-000000000007','25000000-0000-0000-0000-000000000001','35000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000006','phase-e-lead',repeat('b',64));

insert into public.report_artifacts(id,assessment_session_id,blueprint_id,report_number,report_version,blueprint_revision,organization_id,render_key,content_sha256,provenance_hash,object_path,status,mime_type,byte_length,page_count,storage_bucket,renderer_version,template_version,schema_version,rule_pack_version,catalogue_version,locale,request_id,generated_at,completed_at)
values ('45000000-0000-0000-0000-000000000008','35000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000006','MP-PHASE-E-R1',1,1,'25000000-0000-0000-0000-000000000001',repeat('c',64),repeat('d',64),repeat('e',64),'25000000-0000-0000-0000-000000000001/reports/45000000-0000-0000-0000-000000000008.pdf','completed','application/pdf',1024,2,'majupilot-reports','majupilot-pdf-1.0.0','exabytes-blueprint-1.0.0','1.0.0','1','2.0.0','en-MY','phase-e-report-request','2026-09-20T00:00:00Z','2026-09-20T00:00:01Z');
insert into public.consultant_notes(id,lead_id,assessment_session_id,organization_id,origin,status,body,evidence_ids,model_call_id,source_artifact_ids,request_id,schema_version)
values ('45000000-0000-0000-0000-000000000009','45000000-0000-0000-0000-000000000007','35000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000001','ai_draft','draft','AI draft requiring human review.','{}','45000000-0000-0000-0000-000000000010',array['45000000-0000-0000-0000-000000000006'::uuid],'phase-e-note-draft','1.0.0');
insert into public.consultant_notes(id,lead_id,assessment_session_id,organization_id,origin,status,body,evidence_ids,model_call_id,author_user_id,source_draft_id,accepted_at,source_artifact_ids,request_id,schema_version)
values ('45000000-0000-0000-0000-000000000011','45000000-0000-0000-0000-000000000007','35000000-0000-0000-0000-000000000001','25000000-0000-0000-0000-000000000001','human','accepted','Human-reviewed immutable note.','{}','45000000-0000-0000-0000-000000000010','15000000-0000-0000-0000-000000000002','45000000-0000-0000-0000-000000000009','2026-09-20T00:00:02Z',array['45000000-0000-0000-0000-000000000006'::uuid],'phase-e-note-accepted','1.0.0');
insert into storage.objects(id,bucket_id,name) values
('45000000-0000-0000-0000-000000000012','majupilot-reports','25000000-0000-0000-0000-000000000001/reports/45000000-0000-0000-0000-000000000008.pdf');

select throws_ok($$update public.report_artifacts set byte_length=2048 where id='45000000-0000-0000-0000-000000000008'$$,'22000','IMMUTABLE_COMPLETED_REPORT','completed report metadata is immutable');
select throws_ok($$update public.consultant_notes set body='silently changed' where id='45000000-0000-0000-0000-000000000011'$$,'22000','IMMUTABLE_CONSULTANT_NOTE','accepted note cannot be mutated');
select throws_ok($$update public.consultant_notes set status='accepted',origin='human',author_user_id='15000000-0000-0000-0000-000000000002',accepted_at=now() where id='45000000-0000-0000-0000-000000000009'$$,'22000','IMMUTABLE_CONSULTANT_NOTE','AI draft cannot be flipped to accepted');

select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.report_artifacts),1,'prospect can read own report metadata');
select is((select count(*)::integer from storage.objects where bucket_id='majupilot-reports'),1,'prospect can read only the own-organization private report object');
select is((select count(*)::integer from public.consultant_notes),0,'prospect cannot read internal consultant notes'); reset role;
select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.consultant_notes),2,'consultant can read scoped draft and accepted revisions'); reset role;
select set_config('request.jwt.claims','{"sub":"15000000-0000-0000-0000-000000000003","role":"authenticated"}',true); set local role authenticated;
select is((select count(*)::integer from public.report_artifacts),0,'cross-tenant consultant cannot read report metadata');
select is((select count(*)::integer from storage.objects where bucket_id='majupilot-reports'),0,'cross-tenant consultant cannot read the private report object');
select is((select count(*)::integer from public.consultant_notes),0,'cross-tenant consultant cannot read notes'); reset role;

select * from finish();
rollback;
