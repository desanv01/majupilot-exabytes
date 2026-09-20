begin;

create or replace function public.claim_workflow_outbox(p_worker text,p_limit integer default 10,p_lease_seconds integer default 60)
returns setof public.workflow_outbox
language plpgsql security definer set search_path='' as $$
declare
  v_exhausted public.workflow_outbox;
begin
  if p_worker !~ '^[A-Za-z0-9_.:-]{3,100}$' or p_limit not between 1 and 50 or p_lease_seconds not between 15 and 300 then
    raise exception using errcode='22023',message='VALIDATION_FAILED';
  end if;

  for v_exhausted in
    with exhausted_candidates as (
      select o.id
      from public.workflow_outbox o
      where (
          (o.state in ('pending','retry_wait') and o.available_at<=now())
          or (o.state='leased' and o.lease_expires_at<=now())
        )
        and o.attempt_count>=o.max_attempts
      order by o.priority desc,o.available_at,o.created_at
      for update skip locked
      limit p_limit
    )
    update public.workflow_outbox o set
      state='dead_letter',lease_owner=null,lease_expires_at=null,completed_at=now(),response_at=now(),
      last_error_category='delivery',last_error_code='MAX_ATTEMPTS_EXHAUSTED',
      safe_response_metadata='{}'::jsonb
    from exhausted_candidates e
    where o.id=e.id
    returning o.*
  loop
    update public.workflow_outbox_attempts set
      finished_at=coalesce(finished_at,now()),outcome='dead_letter',
      error_category='delivery',error_code='MAX_ATTEMPTS_EXHAUSTED',safe_metadata='{}'::jsonb
    where outbox_id=v_exhausted.id and attempt_number=v_exhausted.attempt_count;

    if v_exhausted.aggregate_type='lead' then
      perform 1 from public.leads where id=v_exhausted.aggregate_id for update;
      insert into public.lead_events(lead_id,sequence,event_type,actor_kind,reason_code,payload,correlation_id,idempotency_key,schema_version)
      values(
        v_exhausted.aggregate_id,
        (select coalesce(max(sequence),0)+1 from public.lead_events where lead_id=v_exhausted.aggregate_id),
        'delivery.dead_lettered','system','attempts_exhausted',
        jsonb_build_object('outboxEventId',v_exhausted.id,'attempt',v_exhausted.attempt_count),
        v_exhausted.correlation_id,
        v_exhausted.idempotency_key||':attempt:'||v_exhausted.attempt_count||':dead_letter',
        '1.0.0'
      ) on conflict(lead_id,idempotency_key) do nothing;
    end if;
  end loop;

  return query
  with candidates as (
    select o.id from public.workflow_outbox o
    where (
      (o.state in ('pending','retry_wait') and o.available_at <= now())
      or (o.state='leased' and o.lease_expires_at <= now())
    )
      and o.attempt_count<o.max_attempts
      and o.expires_at>now()
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
language plpgsql security definer set search_path='' as $$
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
    on conflict(lead_id,idempotency_key) do nothing;
  end if;
  return v_item;
end $$;

revoke all on function public.claim_workflow_outbox(text,integer,integer) from public,anon,authenticated;
revoke all on function public.finish_workflow_outbox_attempt(uuid,text,text,timestamptz,integer,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_workflow_outbox(text,integer,integer) to service_role;
grant execute on function public.finish_workflow_outbox_attempt(uuid,text,text,timestamptz,integer,text,text,text,jsonb) to service_role;

commit;
