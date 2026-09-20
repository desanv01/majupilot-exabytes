begin;
select plan(20);

select has_table('public','copilot_tool_confirmations','confirmation ledger exists');
select has_table('public','copilot_tool_audit_events','confirmation audit exists');
select has_table('public','copilot_turn_receipts','turn idempotency receipts exist');
select ok((select relrowsecurity from pg_class where oid='public.chat_sessions'::regclass),'chat sessions keep RLS');
select ok((select relrowsecurity from pg_class where oid='public.chat_messages'::regclass),'chat messages keep RLS');
select ok((select relrowsecurity from pg_class where oid='public.copilot_tool_confirmations'::regclass),'confirmation ledger has RLS');
select ok((select relrowsecurity from pg_class where oid='public.copilot_tool_audit_events'::regclass),'confirmation audit has RLS');
select ok((select relrowsecurity from pg_class where oid='public.copilot_turn_receipts'::regclass),'turn receipts have RLS');
select col_is_fk('public','chat_messages','model_call_id','assistant/tool messages link safely to model calls');
select col_is_fk('public','copilot_tool_confirmations','chat_session_id','confirmation is scoped to chat');
select col_is_fk('public','copilot_tool_audit_events','confirmation_id','audit event is scoped to confirmation');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='copilot_tool_confirmations' and grantee in ('anon','authenticated')),0,'clients have no direct confirmation grants');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='copilot_tool_audit_events' and grantee in ('anon','authenticated')),0,'clients have no direct audit grants');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='chat_sessions' and grantee in ('anon','authenticated')),0,'clients cannot bypass the Copilot session API');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='chat_messages' and grantee in ('anon','authenticated')),0,'clients cannot forge Copilot messages or tool results');
select ok(exists(select 1 from pg_constraint where conrelid='public.copilot_tool_confirmations'::regclass and contype='c' and pg_get_constraintdef(oid) like '%recalculateScenario%' and pg_get_constraintdef(oid) like '%requestConsultation%'),'write-tool allowlist is enforced by a database check');

create temporary table phase_g_guest as select * from app_private.issue_guest_session(repeat('7',64),'1.0.0');
create temporary table phase_g_chat as select gen_random_uuid() id,assessment_session_id,guest_session_id from phase_g_guest;
insert into public.chat_sessions(id,assessment_session_id,guest_session_id,idempotency_key,schema_version,prompt_version) select id,assessment_session_id,guest_session_id,'pgtap-chat','phase-g-copilot-1.0.0','phase-g-copilot-1.0.0' from phase_g_chat;

select lives_ok($$insert into public.copilot_tool_confirmations(id,chat_session_id,turn_id,tool_name,arguments,arguments_sha256,proposal_idempotency_key,expires_at) select '00000000-0000-4000-8000-000000000701',id,gen_random_uuid(),'generateBlueprintReport','{"blueprintId":"00000000-0000-4000-8000-000000000001"}',repeat('a',64),'proposal-once',now()+interval '5 minutes' from phase_g_chat$$,'a write is persisted only as a pending proposal');
select throws_ok($$insert into public.copilot_tool_confirmations(chat_session_id,turn_id,tool_name,arguments,arguments_sha256,proposal_idempotency_key,expires_at) select id,gen_random_uuid(),'generateBlueprintReport','{}',repeat('b',64),'proposal-once',now()+interval '5 minutes' from phase_g_chat$$,'23505',null,'proposal idempotency key rejects duplicate execution intent');
select lives_ok($$update public.copilot_tool_confirmations set status='executing',execution_idempotency_key='confirmed-once',confirmed_by_guest_session_id=(select guest_session_id from phase_g_chat),confirmed_at=now() where id='00000000-0000-4000-8000-000000000701' and status='pending'; insert into public.copilot_tool_audit_events(confirmation_id,chat_session_id,sequence,event_type,actor_kind,actor_id,safe_payload) select '00000000-0000-4000-8000-000000000701',id,1,'confirmed','guest',guest_session_id,'{"explicit":true}' from phase_g_chat$$,'explicit confirmation advances one proposal and appends audit');
select is((select count(*)::integer from public.copilot_tool_confirmations where id='00000000-0000-4000-8000-000000000701' and status='executing' and execution_idempotency_key='confirmed-once'),1,'confirmed proposal has one idempotent execution identity');

select * from finish();
rollback;
