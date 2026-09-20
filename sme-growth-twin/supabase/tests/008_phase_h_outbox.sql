begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select has_table('public','workflow_outbox_attempts','attempt lineage table exists');
select has_trigger('public','leads','leads_enqueue_delivery','durable lead creation has an in-transaction enqueue trigger');

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
select is((select state from public.replay_workflow_outbox('81000000-0000-0000-0000-000000000001','authorized-replay-0001','phase-h-replay')),'pending','authorized replay creates new pending work');
select is((select replay_of_outbox_id from public.workflow_outbox where replay_key='authorized-replay-0001'),'81000000-0000-0000-0000-000000000001'::uuid,'replay links to the original event');
set local role anon;
select throws_ok($$select count(*) from public.workflow_outbox$$,'42501',null,'raw outbox payload is not readable anonymously');
reset role;

select * from finish();
rollback;
