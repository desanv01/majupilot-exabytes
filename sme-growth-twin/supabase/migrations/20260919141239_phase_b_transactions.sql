begin;

create or replace function app_private.issue_guest_session(p_token_digest text, p_schema_version text)
returns table(guest_session_id uuid, assessment_session_id uuid, expires_at timestamptz, absolute_expires_at timestamptz)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare g public.guest_sessions; a public.assessment_sessions;
begin
  if p_token_digest !~ '^[0-9a-f]{64}$' then raise exception using errcode='22023',message='INVALID_DIGEST'; end if;
  insert into public.guest_sessions(token_digest,expires_at,absolute_expires_at)
  values(p_token_digest,now()+interval '24 hours',now()+interval '30 days') returning * into g;
  insert into public.assessment_sessions(guest_session_id,schema_version) values(g.id,p_schema_version) returning * into a;
  return query select g.id,a.id,g.expires_at,g.absolute_expires_at;
end $$;

create or replace function app_private.resume_rotate_guest_session(p_token_digest text,p_new_token_digest text)
returns table(guest_session_id uuid,assessment_session_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare g public.guest_sessions; a_id uuid;
begin
  if p_token_digest !~ '^[0-9a-f]{64}$' or p_new_token_digest !~ '^[0-9a-f]{64}$' then raise exception using errcode='22023',message='INVALID_DIGEST'; end if;
  select * into g from public.guest_sessions where token_digest=p_token_digest for update;
  if not found then raise exception using errcode='P0002',message='SESSION_NOT_FOUND'; end if;
  if g.revoked_at is not null or g.claimed_at is not null then raise exception using errcode='28000',message='SESSION_REVOKED'; end if;
  if g.expires_at<=now() or g.absolute_expires_at<=now() then raise exception using errcode='28000',message='SESSION_EXPIRED'; end if;
  update public.guest_sessions set previous_token_digest=token_digest,token_digest=p_new_token_digest,last_activity_at=now(),
    expires_at=least(now()+interval '24 hours',absolute_expires_at),rotation_counter=rotation_counter+1 where id=g.id returning guest_sessions.expires_at into g.expires_at;
  select s.id into a_id from public.assessment_sessions s where s.guest_session_id=g.id order by s.created_at limit 1;
  return query select g.id,a_id,g.expires_at;
end $$;

create or replace function app_private.revoke_guest_session(p_token_digest text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare g_id uuid;
begin
  update public.guest_sessions set revoked_at=coalesce(revoked_at,now()),token_digest=md5(random()::text||clock_timestamp()::text||id::text)||md5(id::text||random()::text),previous_token_digest=null
  where token_digest=p_token_digest and claimed_at is null returning id into g_id;
  if g_id is null then raise exception using errcode='P0002',message='SESSION_NOT_FOUND'; end if; return g_id;
end $$;

create or replace function app_private.claim_guest_session(p_token_digest text,p_user_id uuid,p_organization_id uuid)
returns table(guest_session_id uuid,assessment_session_id uuid,organization_id uuid,claimed_at timestamptz,replayed boolean)
language plpgsql security definer set search_path=pg_catalog,public as $$
declare g public.guest_sessions; claim_time timestamptz; claim_session_ids uuid[];
begin
  if not exists(select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=p_user_id and m.status='active') then
    raise exception using errcode='42501',message='FORBIDDEN';
  end if;
  select * into g from public.guest_sessions where token_digest=p_token_digest or previous_token_digest=p_token_digest for update;
  if not found then raise exception using errcode='P0002',message='SESSION_NOT_FOUND'; end if;
  if g.claimed_at is not null then
    if g.claimed_by_user_id=p_user_id and g.claimed_organization_id=p_organization_id then return query select g.id,g.claimed_assessment_session_id,p_organization_id,g.claimed_at,true; return;
    end if; raise exception using errcode='23505',message='CLAIM_CONFLICT';
  end if;
  if g.revoked_at is not null then raise exception using errcode='28000',message='SESSION_REVOKED'; end if;
  if g.expires_at<=now() or g.absolute_expires_at<=now() then raise exception using errcode='28000',message='SESSION_EXPIRED'; end if;
  perform 1 from public.assessment_sessions s where s.guest_session_id=g.id order by s.id for update;
  select coalesce(array_agg(s.id order by s.id),'{}'::uuid[]) into claim_session_ids from public.assessment_sessions s where s.guest_session_id=g.id;
  claim_time:=now();
  update public.guest_sessions set revoked_at=claim_time,claimed_at=claim_time,claimed_by_user_id=p_user_id,claimed_organization_id=p_organization_id,
    claimed_assessment_session_id=claim_session_ids[1],previous_token_digest=token_digest,token_digest=md5(random()::text||clock_timestamp()::text||id::text)||md5(id::text||random()::text) where id=g.id;
  perform set_config('app.claim_guest_session','on',true);
  update public.assessment_sessions s set organization_id=p_organization_id,guest_session_id=null,updated_at=claim_time where s.guest_session_id=g.id;
  update public.consent_records c set organization_id=p_organization_id where c.assessment_session_id=any(claim_session_ids) and c.organization_id is null;
  update public.model_calls m set organization_id=p_organization_id where m.assessment_session_id=any(claim_session_ids) and m.organization_id is null;
  return query select g.id,claim_session_ids[1],p_organization_id,claim_time,false;
end $$;

create or replace function public.issue_guest_session(p_token_digest text,p_schema_version text)
returns table(guest_session_id uuid,assessment_session_id uuid,expires_at timestamptz,absolute_expires_at timestamptz)
language sql security invoker set search_path=pg_catalog,public as $$ select * from app_private.issue_guest_session(p_token_digest,p_schema_version) $$;
create or replace function public.resume_rotate_guest_session(p_token_digest text,p_new_token_digest text)
returns table(guest_session_id uuid,assessment_session_id uuid,expires_at timestamptz)
language sql security invoker set search_path=pg_catalog,public as $$ select * from app_private.resume_rotate_guest_session(p_token_digest,p_new_token_digest) $$;
create or replace function public.revoke_guest_session(p_token_digest text)
returns uuid language sql security invoker set search_path=pg_catalog,public as $$ select app_private.revoke_guest_session(p_token_digest) $$;
create or replace function public.claim_guest_session(p_token_digest text,p_user_id uuid,p_organization_id uuid)
returns table(guest_session_id uuid,assessment_session_id uuid,organization_id uuid,claimed_at timestamptz,replayed boolean)
language sql security invoker set search_path=pg_catalog,public as $$ select * from app_private.claim_guest_session(p_token_digest,p_user_id,p_organization_id) $$;

revoke all on function public.issue_guest_session(text,text),public.resume_rotate_guest_session(text,text),public.revoke_guest_session(text),public.claim_guest_session(text,uuid,uuid) from public,anon,authenticated;
grant usage on schema app_private to service_role;
grant execute on function app_private.issue_guest_session(text,text),app_private.resume_rotate_guest_session(text,text),app_private.revoke_guest_session(text),app_private.claim_guest_session(text,uuid,uuid) to service_role;
grant execute on function public.issue_guest_session(text,text),public.resume_rotate_guest_session(text,text),public.revoke_guest_session(text),public.claim_guest_session(text,uuid,uuid) to service_role;

create or replace function app_private.guard_immutable_event() returns trigger language plpgsql set search_path=pg_catalog as $$ begin raise exception using errcode='22000',message='IMMUTABLE_RECORD'; end $$;
create trigger consent_records_immutable before update or delete on public.consent_records for each row execute function app_private.guard_immutable_event();
create trigger business_twins_immutable before update or delete on public.business_twins for each row execute function app_private.guard_immutable_event();
create trigger diagnostic_runs_immutable before update or delete on public.diagnostic_runs for each row execute function app_private.guard_immutable_event();
create trigger recommendation_runs_immutable before update or delete on public.recommendation_runs for each row execute function app_private.guard_immutable_event();
create trigger scenario_revisions_immutable before update or delete on public.scenario_revisions for each row execute function app_private.guard_immutable_event();
create trigger blueprints_immutable before update or delete on public.blueprints for each row execute function app_private.guard_immutable_event();
create trigger lead_assignments_immutable before update or delete on public.lead_assignments for each row execute function app_private.guard_immutable_event();
create trigger lead_events_immutable before update or delete on public.lead_events for each row execute function app_private.guard_immutable_event();

commit;
