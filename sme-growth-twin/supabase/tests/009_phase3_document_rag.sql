begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

select has_table('public','evidence_documents','document ledger exists');
select has_table('public','evidence_document_chunks','document chunks exist');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.evidence_documents'::regclass),'document ledger forces RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid='public.evidence_document_chunks'::regclass),'document chunks force RLS');
select ok(not has_table_privilege('anon','public.evidence_documents','select'),'anonymous unbound access is denied');
select ok(not has_table_privilege('authenticated','public.evidence_documents','insert'),'clients cannot forge document processing state');
select ok(not has_function_privilege('authenticated','public.search_evidence_document_chunks(uuid,extensions.vector,double precision,integer)','execute'),'client roles cannot call privileged vector search');
select ok(has_function_privilege('service_role','public.search_evidence_document_chunks(uuid,extensions.vector,double precision,integer)','execute'),'service role may call bounded vector search after application authorization');
select is((select count(*)::integer from storage.buckets where id='majupilot-evidence' and public=false and file_size_limit=4194304),1,'evidence bucket is private and size bounded');
select is((select array_length(allowed_mime_types,1) from storage.buckets where id='majupilot-evidence'),3,'evidence bucket allows exactly three MIME types');
select is((select count(*)::integer from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'evidence_objects_%'),0,'clients have no direct evidence-object access; server-issued signed URLs are required');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('12000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner-rag@example.invalid','',now(),now(),now()),
('12000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','member-rag@example.invalid','',now(),now(),now()),
('12000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','outsider-rag@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values
('22000000-0000-0000-0000-000000000001','RAG Owner Org'),
('22000000-0000-0000-0000-000000000002','RAG Other Org');
insert into public.organization_members(organization_id,user_id,role) values
('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001','prospect'),
('22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000002','consultant'),
('22000000-0000-0000-0000-000000000002','12000000-0000-0000-0000-000000000003','prospect');
insert into public.assessment_sessions(id,organization_id,created_by,schema_version) values
('32000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001','1.0.0'),
('32000000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000001','12000000-0000-0000-0000-000000000001','1.0.0'),
('32000000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000002','12000000-0000-0000-0000-000000000003','1.0.0');
insert into public.evidence_documents(id,assessment_session_id,organization_id,original_filename,storage_path,mime_type,byte_length,checksum_sha256,status,page_count,extracted_char_count,chunk_count,schema_version,embedding_version,processed_at) values
('42000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','fictional-plan.txt','org/22000000-0000-0000-0000-000000000001/32000000-0000-0000-0000-000000000001/42000000-0000-0000-0000-000000000001.txt','text/plain',120,repeat('a',64),'ready',null,120,1,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1',now()),
('42000000-0000-0000-0000-000000000002','32000000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000001','other-assessment.txt','org/22000000-0000-0000-0000-000000000001/32000000-0000-0000-0000-000000000002/42000000-0000-0000-0000-000000000002.txt','text/plain',120,repeat('b',64),'ready',null,120,1,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1',now()),
('42000000-0000-0000-0000-000000000003','32000000-0000-0000-0000-000000000003','22000000-0000-0000-0000-000000000002','other-tenant.txt','org/22000000-0000-0000-0000-000000000002/32000000-0000-0000-0000-000000000003/42000000-0000-0000-0000-000000000003.txt','text/plain',120,repeat('c',64),'ready',null,120,1,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1',now()),
('42000000-0000-0000-0000-000000000004','32000000-0000-0000-0000-000000000001','22000000-0000-0000-0000-000000000001','deleted.txt','org/22000000-0000-0000-0000-000000000001/32000000-0000-0000-0000-000000000001/42000000-0000-0000-0000-000000000004.txt','text/plain',120,repeat('d',64),'ready',null,120,1,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1',now());
insert into public.evidence_document_chunks(id,document_id,assessment_session_id,chunk_index,section_ref,content,char_count,embedding,schema_version,embedding_version) values
('52000000-0000-0000-0000-000000000001','42000000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001',0,'Text document','Fictional Northwind Bikes targets a 20 percent stockout reduction.',66,array_fill(0.01::real,array[1536])::extensions.vector,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1'),
('52000000-0000-0000-0000-000000000002','42000000-0000-0000-0000-000000000002','32000000-0000-0000-0000-000000000002',0,'Text document','Fictional second assessment evidence.',37,array_fill(0.01::real,array[1536])::extensions.vector,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1'),
('52000000-0000-0000-0000-000000000003','42000000-0000-0000-0000-000000000003','32000000-0000-0000-0000-000000000003',0,'Text document','Fictional other tenant evidence.',34,array_fill(0.01::real,array[1536])::extensions.vector,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1'),
('52000000-0000-0000-0000-000000000004','42000000-0000-0000-0000-000000000004','32000000-0000-0000-0000-000000000001',0,'Text document','Deleted fictional evidence.',27,array_fill(0.01::real,array[1536])::extensions.vector,'phase3-document-rag-1.0.0','openai-text-embedding-3-small-1536-v1');
update public.evidence_documents set status='deleted',deleted_at=now(),chunk_count=0 where id='42000000-0000-0000-0000-000000000004';

select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::integer from public.evidence_documents where organization_id='22000000-0000-0000-0000-000000000001'),3,'owner can read organization documents and their states');
select is((select count(*)::integer from public.evidence_documents where organization_id='22000000-0000-0000-0000-000000000002'),0,'cross-tenant document access is denied');
select is((select count(*)::integer from public.evidence_document_chunks where assessment_session_id='32000000-0000-0000-0000-000000000003'),0,'cross-tenant chunk access is denied');
select is((select count(*)::integer from public.evidence_document_chunks where document_id='42000000-0000-0000-0000-000000000004'),0,'deleted document chunks are not visible');
reset role;

select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::integer from public.evidence_documents where organization_id='22000000-0000-0000-0000-000000000001'),3,'another active organization member receives organization access');
reset role;

select set_config('request.jwt.claims','{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*)::integer from public.evidence_documents where organization_id='22000000-0000-0000-0000-000000000001'),0,'cross-user access outside the organization is denied');
reset role;

set local role service_role;
select is((select count(*)::integer from public.search_evidence_document_chunks('32000000-0000-0000-0000-000000000001',array_fill(0.01::real,array[1536])::extensions.vector,0.62,5)),1,'retrieval returns only the requested assessment');
select is((select count(*)::integer from public.search_evidence_document_chunks('32000000-0000-0000-0000-000000000002',array_fill(0.01::real,array[1536])::extensions.vector,0.62,5)),1,'a different assessment has a separate result set');
select throws_ok($$select * from public.search_evidence_document_chunks('32000000-0000-0000-0000-000000000001',array_fill(0.01::real,array[1536])::extensions.vector,0.1,5)$$,'22023','INVALID_MATCH_THRESHOLD','relevance threshold is bounded');
select throws_ok($$select * from public.search_evidence_document_chunks('32000000-0000-0000-0000-000000000001',array_fill(0.01::real,array[1536])::extensions.vector,0.62,50)$$,'22023','INVALID_MATCH_COUNT','result count is bounded');
reset role;

select * from finish();
rollback;
