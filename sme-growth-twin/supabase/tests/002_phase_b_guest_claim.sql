begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('11000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','claim@example.invalid','',now(),now(),now());
insert into public.organizations(id,display_name) values ('21000000-0000-0000-0000-000000000001','Claim Org'),('21000000-0000-0000-0000-000000000002','Conflict Org');
insert into public.organization_members(organization_id,user_id,role) values
('21000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000001','prospect'),
('21000000-0000-0000-0000-000000000002','11000000-0000-0000-0000-000000000001','prospect');
create temp table issued as select * from public.issue_guest_session(repeat('1',64),'1.0.0');
select is((select count(*)::integer from issued),1,'guest and assessment are issued atomically');
select is((select length(token_digest) from public.guest_sessions where id=(select guest_session_id from issued)),64,'only a digest is persisted');
create temp table claimed as select * from public.claim_guest_session(repeat('1',64),'11000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001');
select is((select organization_id from public.assessment_sessions where id=(select assessment_session_id from issued)),'21000000-0000-0000-0000-000000000001'::uuid,'claim transfers root ownership');
select is((select id from public.assessment_sessions where id=(select assessment_session_id from issued)),(select assessment_session_id from issued),'claim preserves artifact root identity');
select ok((select revoked_at is not null and claimed_at is not null from public.guest_sessions where id=(select guest_session_id from issued)),'guest credential is revoked before organization access');
select ok((select replayed from public.claim_guest_session(repeat('1',64),'11000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000001')),'same organization claim replay is idempotent');
select throws_ok($$select * from public.claim_guest_session(repeat('1',64),'11000000-0000-0000-0000-000000000001','21000000-0000-0000-0000-000000000002')$$,'23505','CLAIM_CONFLICT','conflicting claim is rejected');
create temp table expired_issue as select * from public.issue_guest_session(repeat('2',64),'1.0.0');
update public.guest_sessions set expires_at=now()-interval '1 second' where id=(select guest_session_id from expired_issue);
select throws_ok($$select * from public.resume_rotate_guest_session(repeat('2',64),repeat('3',64))$$,'28000','SESSION_EXPIRED','expired guest cannot resume');
select * from finish();
rollback;
