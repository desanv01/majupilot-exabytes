begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

select has_table('public','workflow_outbox_attempts','attempt lineage table exists');
select has_trigger('public','leads','leads_enqueue_delivery','durable lead creation has an in-transaction enqueue trigger');
select ok(has_function_privilege('service_role','public.claim_workflow_outbox(text,integer,integer)','EXECUTE'),'service role retains claim RPC execution');
select ok(not has_function_privilege('anon','public.claim_workflow_outbox(text,integer,integer)','EXECUTE'),'anonymous role cannot execute claim RPC');
select ok(has_function_privilege('service_role','public.finish_workflow_outbox_attempt(uuid,text,text,timestamptz,integer,text,text,text,jsonb)','EXECUTE'),'service role retains finish RPC execution');
select ok(not has_function_privilege('authenticated','public.finish_workflow_outbox_attempt(uuid,text,text,timestamptz,integer,text,text,text,jsonb)','EXECUTE'),'authenticated role cannot execute finish RPC');

insert into public.workflow_outbox(id,aggregate_type,aggregate_id,event_type,event_version,idempotency_key,correlation_id,adapter_key,destination_key,state,priority,available_at,max_attempts,payload,payload_schema_version,payload_sha256,expires_at)
values('81000000-0000-0000-0000-000000000001','test','82000000-0000-0000-0000-000000000001','test.delivery','1.0.0','phase-h-outbox-0001','phase-h-correlation','signed_webhook','primary','pending',100,now(),3,'{"safe":"value"}','1.0.0',repeat('a',64),now()+interval '30 days');

select is((select state from public.claim_workflow_outbox('worker-a',1,60)),'leased','pending work is leased');
select is((select attempt_count from public.workflow_outbox where id='81000000-0000-0000-0000-000000000001'),1,'claim increments the attempt count');
select is((select count(*)::integer from public.workflow_outbox_attempts),1,'claim creates immutable attempt lineage');
select is((select state from public.finish_workflow_outbox_attempt('81000000-0000-0000-0000-000000000001','worker-a','retry',now()+interval '2 minutes',429,'provider-safe-id','provider','HTTP_429','{}')),'retry_wait','retryable failure enters retry wait');
select is((select last_error_code from public.workflow_outbox where id='81000000-0000-0000-0000-000000000001'),'HTTP_429','only redacted error code is stored');
select throws_ok($$update public.workflow_outbox set payload='{"changed":true}' where id='81000000-0000-0000-0000-000000000001'$$,'22000','IMMUTABLE_OUTBOX_IDENTITY_PAYLOAD','outbox payload and hash are immutable');

update public.workflow_outbox set available_at=now()-interval '1 second';
select is((select attempt_count from public.claim_workflow_outbox('worker-b',1,15)),2,'scheduled retry creates the next attempt');
update public.workflow_outbox set lease_expires_at=now()-interval '1 second';
select is((select attempt_count from public.claim_workflow_outbox('worker-c',1,60)),3,'expired lease is safely reclaimed after restart');
select is((select state from public.finish_workflow_outbox_attempt('81000000-0000-0000-0000-000000000001','worker-c','retry',null,503,null,'provider','HTTP_503','{}')),'dead_letter','exhausted retry is dead-lettered');
select is((select count(*)::integer from public.workflow_outbox_attempts),3,'reclaimed attempts preserve full lineage');

set local session_replication_role='replica';
insert into public.leads(id,organization_id,assessment_session_id,blueprint_id,idempotency_key,request_hash)
values('83000000-0000-0000-0000-000000000001','83000000-0000-0000-0000-000000000002','83000000-0000-0000-0000-000000000003','83000000-0000-0000-0000-000000000004','phase-h-exhausted-lead',repeat('b',64));
set local session_replication_role='origin';
insert into public.workflow_outbox(id,aggregate_type,aggregate_id,event_type,event_version,idempotency_key,correlation_id,adapter_key,destination_key,state,priority,available_at,lease_owner,lease_expires_at,attempt_count,max_attempts,payload,payload_schema_version,payload_sha256,expires_at,first_attempt_at,last_attempt_at)
values('81000000-0000-0000-0000-000000000002','lead','83000000-0000-0000-0000-000000000001','test.delivery','1.0.0','phase-h-outbox-exhausted','phase-h-exhausted-correlation','signed_webhook','primary','leased',100,now(),'crashed-worker',now()-interval '1 second',1,1,'{"safe":"value"}','1.0.0',repeat('c',64),now()+interval '30 days',now()-interval '2 minutes',now()-interval '2 minutes');
insert into public.workflow_outbox_attempts(outbox_id,attempt_number,delivery_key,lease_owner,started_at)
values('81000000-0000-0000-0000-000000000002',1,'phase-h-outbox-exhausted:attempt:1','crashed-worker',now()-interval '2 minutes');

select is((select count(*)::integer from public.claim_workflow_outbox('worker-d',1,60)),0,'an exhausted expired lease is not reclaimed');
select is((select state from public.workflow_outbox where id='81000000-0000-0000-0000-000000000002'),'dead_letter','an exhausted expired lease is atomically dead-lettered');
select is((select attempt_count from public.workflow_outbox where id='81000000-0000-0000-0000-000000000002'),1,'exhausted lease finalization does not exceed max attempts');
select is((select outcome from public.workflow_outbox_attempts where outbox_id='81000000-0000-0000-0000-000000000002' and attempt_number=1),'dead_letter','the crashed final attempt is terminally finalized');
select is((select count(*)::integer from public.lead_events where lead_id='83000000-0000-0000-0000-000000000001' and event_type='delivery.dead_lettered'),1,'exhausted reclaim appends one dead-letter audit event');
select is((select count(*)::integer from public.claim_workflow_outbox('worker-e',1,60)),0,'terminal exhausted work remains unclaimable');
select is((select count(*)::integer from public.lead_events where lead_id='83000000-0000-0000-0000-000000000001' and event_type='delivery.dead_lettered'),1,'exhausted reclaim audit is idempotent');

select is((select state from public.replay_workflow_outbox('81000000-0000-0000-0000-000000000001','authorized-replay-0001','phase-h-replay')),'pending','authorized replay creates new pending work');
select is((select replay_of_outbox_id from public.workflow_outbox where replay_key='authorized-replay-0001'),'81000000-0000-0000-0000-000000000001'::uuid,'replay links to the original event');
set local role anon;
select throws_ok($$select count(*) from public.workflow_outbox$$,'42501',null,'raw outbox payload is not readable anonymously');
reset role;

select * from finish();
rollback;
