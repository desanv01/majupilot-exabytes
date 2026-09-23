begin;
select plan(10);

select ok(exists(
  select 1 from pg_constraint
  where conrelid = 'public.chat_messages'::regclass
    and conname = 'chat_messages_parts_bounded_array'
    and contype = 'c'
), 'ordered message parts have a database check');
select ok(not (select convalidated from pg_constraint where conrelid='public.chat_messages'::regclass and conname='chat_messages_parts_bounded_array'), 'legacy immutable conversations remain readable without a migration-time table validation');
select ok((select relrowsecurity from pg_class where oid='public.chat_messages'::regclass), 'chat messages keep RLS');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='chat_messages' and grantee in ('anon','authenticated')), 0, 'Phase 3R adds no direct client grants');
select ok((select column_default like '%phase3r-general-copilot-2.0.0%' from information_schema.columns where table_schema='public' and table_name='chat_sessions' and column_name='prompt_version'), 'new sessions use the Phase 3R prompt version');
select ok(not has_function_privilege('authenticated','public.append_copilot_message(uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,uuid,text,text,text)','execute'), 'clients still cannot append forged chat messages');

create temporary table phase3r_guest as select * from app_private.issue_guest_session(repeat('3',64),'1.0.0');
create temporary table phase3r_chat as select gen_random_uuid() id,assessment_session_id,guest_session_id from phase3r_guest;
insert into public.chat_sessions(id,assessment_session_id,guest_session_id,idempotency_key,schema_version)
select id,assessment_session_id,guest_session_id,'phase3r-pgtap-chat','phase-g-copilot-1.0.0' from phase3r_chat;

select lives_ok($$
  insert into public.chat_messages(id,chat_session_id,sequence,turn_id,role,parts,schema_version,message_type,text_content)
  select gen_random_uuid(),id,1,gen_random_uuid(),'assistant','[{"type":"text","text":"Synthetic answer"}]'::jsonb,'phase-g-copilot-1.0.0','text','Synthetic answer' from phase3r_chat
$$, 'a bounded ordered-parts message is accepted');
select throws_ok($$
  insert into public.chat_messages(id,chat_session_id,sequence,turn_id,role,parts,schema_version,message_type,text_content)
  select gen_random_uuid(),id,2,gen_random_uuid(),'assistant',(select jsonb_agg(jsonb_build_object('type','text','text',n::text)) from generate_series(1,25) n),'phase-g-copilot-1.0.0','text','Too many parts' from phase3r_chat
$$, '23514', null, 'new messages cannot exceed 24 ordered parts');
select throws_ok($$
  insert into public.chat_messages(id,chat_session_id,sequence,turn_id,role,parts,schema_version,message_type,text_content)
  select gen_random_uuid(),id,2,gen_random_uuid(),'assistant',jsonb_build_array(jsonb_build_object('type','text','text',repeat('x',24001))),'phase-g-copilot-1.0.0','text','Oversized parts' from phase3r_chat
$$, '23514', null, 'new ordered-parts payloads cannot exceed 24 KB');
select is((select count(*)::integer from public.chat_messages where chat_session_id=(select id from phase3r_chat)), 1, 'rejected rows do not corrupt the durable conversation');

select * from finish();
rollback;
