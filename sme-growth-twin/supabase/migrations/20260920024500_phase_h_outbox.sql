begin;

alter table public.workflow_outbox
  add column first_attempt_at timestamptz,
  add column last_attempt_at timestamptz,
  add column last_error_code text,
  add column provider_status integer,
  add column provider_request_id text,
  add column response_at timestamptz,
  add column safe_response_metadata jsonb not null default '{}'::jsonb,
  add column replay_of_outbox_id uuid references public.workflow_outbox(id),
  add column replay_key text;

alter table public.workflow_outbox
  add constraint workflow_outbox_lease_pair check ((lease_owner is null) = (lease_expires_at is null)),
  add constraint workflow_outbox_replay_key_unique unique (replay_key),
  add constraint workflow_outbox_payload_hash_format check (payload_sha256 ~ '^[a-f0-9]{64}$');

create table public.workflow_outbox_attempts (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid not null references public.workflow_outbox(id),
  attempt_number integer not null check (attempt_number > 0),
  delivery_key text not null unique,
  lease_owner text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  outcome text check (outcome in ('succeeded','retry','dead_letter')),
  status_code integer,
  provider_request_id text,
  error_category text,
  error_code text,
  safe_metadata jsonb not null default '{}'::jsonb,
  unique(outbox_id,attempt_number)
);

alter table public.workflow_outbox_attempts enable row level security;
revoke all on public.workflow_outbox, public.workflow_outbox_attempts from public, anon, authenticated;

create or replace function app_private.protect_outbox_identity_payload()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if new.aggregate_type is distinct from old.aggregate_type
    or new.aggregate_id is distinct from old.aggregate_id
    or new.event_type is distinct from old.event_type
    or new.event_version is distinct from old.event_version
    or new.idempotency_key is distinct from old.idempotency_key
    or new.adapter_key is distinct from old.adapter_key
    or new.destination_key is distinct from old.destination_key
    or new.payload is distinct from old.payload
    or new.payload_schema_version is distinct from old.payload_schema_version
    or new.payload_sha256 is distinct from old.payload_sha256
    or new.replay_of_outbox_id is distinct from old.replay_of_outbox_id
    or new.replay_key is distinct from old.replay_key then
    raise exception using errcode='22000',message='IMMUTABLE_OUTBOX_IDENTITY_PAYLOAD';
  end if;
  return new;
end $$;

create trigger workflow_outbox_identity_payload_immutable
before update on public.workflow_outbox for each row execute function app_private.protect_outbox_identity_payload();

create or replace function app_private.enqueue_lead_delivery()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare
  v_payload jsonb;
  v_outbox_id uuid;
begin
  v_payload := jsonb_build_object(
    'leadId',new.id,
    'receiptId',new.receipt_id,
    'status',new.status,
    'assignmentState',new.assignment_state,
    'reportArtifactId',new.report_artifact_id,
    'reportVersion',new.report_version,
    'schemaVersion','1.0.0'
  );
  insert into public.workflow_outbox(
    aggregate_type,aggregate_id,event_type,event_version,idempotency_key,correlation_id,
    adapter_key,destination_key,state,priority,available_at,max_attempts,payload,payload_schema_version,payload_sha256,expires_at
  ) values (
    'lead',new.id,'lead.consultation_requested','1.0.0',new.idempotency_key||':webhook',new.idempotency_key,
    'signed_webhook','primary','pending',100,now(),8,v_payload,'1.0.0',
    encode(digest(convert_to(v_payload::text,'UTF8'),'sha256'),'hex'),now()+interval '30 days'
  ) returning id into v_outbox_id;

  insert into public.lead_events(lead_id,sequence,event_type,actor_kind,reason_code,payload,correlation_id,idempotency_key,schema_version)
  values(new.id,5,'delivery.enqueued','system','lead_committed',jsonb_build_object('outboxEventId',v_outbox_id,'adapterKey','signed_webhook'),new.idempotency_key,new.idempotency_key||':delivery:enqueued','1.0.0');
  return new;
end $$;

create trigger leads_enqueue_delivery
after insert on public.leads for each row execute function app_private.enqueue_lead_delivery();

create or replace function public.claim_workflow_outbox(p_worker text,p_limit integer default 10,p_lease_seconds integer default 60)
returns setof public.workflow_outbox
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if p_worker !~ '^[A-Za-z0-9_.:-]{3,100}$' or p_limit not between 1 and 50 or p_lease_seconds not between 15 and 300 then
    raise exception using errcode='22023',message='VALIDATION_FAILED';
  end if;
  return query
  with candidates as (
    select o.id from public.workflow_outbox o
    where (
      (o.state in ('pending','retry_wait') and o.available_at <= now())
      or (o.state='leased' and o.lease_expires_at <= now())
    ) and o.expires_at > now()
    order by o.priority desc,o.available_at,o.created_at
    for update skip locked limit p_limit
  ), claimed as (
    update public.workflow_outbox o set
      state='leased',lease_owner=p_worker,lease_expires_at=now()+make_interval(secs=>p_lease_seconds),
      attempt_count=o.attempt_count+1,
      first_attempt_at=coalesce(o.first_attempt_at,now()),last_attempt_at=now(),next_retry_at=null
    from candidates c where o.id=c.id returning o.*
  ), attempts as (
    insert into public.workflow_outbox_attempts(outbox_id,attempt_number,delivery_key,lease_owner,started_at)
    select c.id,c.attempt_count,c.idempotency_key||':attempt:'||c.attempt_count,p_worker,c.last_attempt_at from claimed c
    on conflict(outbox_id,attempt_number) do update set lease_owner=excluded.lease_owner,started_at=excluded.started_at
    returning outbox_id
  )
  select c.* from claimed c join attempts a on a.outbox_id=c.id;
end $$;

create or replace function public.finish_workflow_outbox_attempt(
  p_outbox_id uuid,p_worker text,p_outcome text,p_next_retry_at timestamptz,
  p_status_code integer,p_provider_request_id text,p_error_category text,p_error_code text,p_safe_metadata jsonb
)
returns public.workflow_outbox
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_item public.workflow_outbox; v_final text; v_event text;
begin
  select * into v_item from public.workflow_outbox where id=p_outbox_id for update;
  if v_item.id is null or v_item.state<>'leased' or v_item.lease_owner<>p_worker or v_item.lease_expires_at<=now() then
    raise exception using errcode='40001',message='OUTBOX_LEASE_LOST';
  end if;
  if p_outcome not in ('succeeded','retry','dead_letter') then raise exception using errcode='22023',message='VALIDATION_FAILED'; end if;
  v_final := case when p_outcome='succeeded' then 'completed' when p_outcome='retry' and v_item.attempt_count<v_item.max_attempts then 'retry_wait' else 'dead_letter' end;
  if v_final='retry_wait' and (p_next_retry_at is null or p_next_retry_at<=now() or p_next_retry_at>v_item.created_at+interval '24 hours') then
    raise exception using errcode='22023',message='INVALID_RETRY_TIME';
  end if;

  update public.workflow_outbox set state=v_final,available_at=case when v_final='retry_wait' then p_next_retry_at else available_at end,
    next_retry_at=case when v_final='retry_wait' then p_next_retry_at end,lease_owner=null,lease_expires_at=null,
    completed_at=case when v_final in ('completed','dead_letter') then now() end,
    last_error_category=case when v_final='completed' then null else left(p_error_category,80) end,
    last_error_code=case when v_final='completed' then null else left(p_error_code,120) end,
    provider_status=p_status_code,provider_request_id=left(p_provider_request_id,160),response_at=now(),
    safe_response_metadata=coalesce(p_safe_metadata,'{}'::jsonb)
  where id=p_outbox_id returning * into v_item;

  update public.workflow_outbox_attempts set finished_at=now(),outcome=case when v_final='retry_wait' then 'retry' else case when v_final='completed' then 'succeeded' else 'dead_letter' end end,
    status_code=p_status_code,provider_request_id=left(p_provider_request_id,160),error_category=left(p_error_category,80),error_code=left(p_error_code,120),safe_metadata=coalesce(p_safe_metadata,'{}'::jsonb)
  where outbox_id=p_outbox_id and attempt_number=v_item.attempt_count;

  if v_item.aggregate_type='lead' then
    perform 1 from public.leads where id=v_item.aggregate_id for update;
    v_event:=case when v_final='completed' then 'delivery.succeeded' when v_final='dead_letter' then 'delivery.dead_lettered' else 'delivery.failed' end;
    insert into public.lead_events(lead_id,sequence,event_type,actor_kind,reason_code,payload,correlation_id,idempotency_key,schema_version)
    values(v_item.aggregate_id,(select coalesce(max(sequence),0)+1 from public.lead_events where lead_id=v_item.aggregate_id),v_event,'system',coalesce(p_error_category,'provider_response'),
      jsonb_strip_nulls(jsonb_build_object('outboxEventId',v_item.id,'attempt',v_item.attempt_count,'statusCode',p_status_code,'nextRetryAt',v_item.next_retry_at)),
      v_item.correlation_id,v_item.idempotency_key||':attempt:'||v_item.attempt_count||':'||v_final,'1.0.0')
    on conflict(idempotency_key) do nothing;
  end if;
  return v_item;
end $$;

create or replace function public.replay_workflow_outbox(p_original_id uuid,p_replay_key text,p_correlation_id text)
returns public.workflow_outbox
language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_original public.workflow_outbox; v_replay public.workflow_outbox;
begin
  if p_replay_key !~ '^[A-Za-z0-9_.:-]{8,128}$' then raise exception using errcode='22023',message='VALIDATION_FAILED'; end if;
  select * into v_original from public.workflow_outbox where id=p_original_id and state='dead_letter' for update;
  if v_original.id is null then raise exception using errcode='P0002',message='OUTBOX_NOT_REPLAYABLE'; end if;
  insert into public.workflow_outbox(aggregate_type,aggregate_id,event_type,event_version,idempotency_key,correlation_id,adapter_key,destination_key,state,priority,available_at,max_attempts,payload,payload_schema_version,payload_sha256,expires_at,replay_of_outbox_id,replay_key)
  values(v_original.aggregate_type,v_original.aggregate_id,v_original.event_type,v_original.event_version,v_original.idempotency_key||':replay:'||p_replay_key,p_correlation_id,v_original.adapter_key,v_original.destination_key,'pending',v_original.priority,now(),v_original.max_attempts,v_original.payload,v_original.payload_schema_version,v_original.payload_sha256,now()+interval '30 days',v_original.id,p_replay_key)
  returning * into v_replay;
  return v_replay;
end $$;

revoke all on function public.claim_workflow_outbox(text,integer,integer) from public,anon,authenticated;
revoke all on function public.finish_workflow_outbox_attempt(uuid,text,text,timestamptz,integer,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.replay_workflow_outbox(uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_workflow_outbox(text,integer,integer) to service_role;
grant execute on function public.finish_workflow_outbox_attempt(uuid,text,text,timestamptz,integer,text,text,text,jsonb) to service_role;
grant execute on function public.replay_workflow_outbox(uuid,text,text) to service_role;
revoke all on function app_private.enqueue_lead_delivery() from public,anon,authenticated;
revoke all on function app_private.protect_outbox_identity_payload() from public,anon,authenticated;

commit;
