begin;

-- Personal workspaces are created only by the verified-auth server route.
create table app_private.personal_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null unique references public.organizations(id) on delete restrict
);
revoke all on app_private.personal_workspaces from public, anon, authenticated;
grant select, insert on app_private.personal_workspaces to service_role;

create or replace function public.ensure_personal_workspace(p_user_id uuid)
returns uuid language plpgsql security invoker set search_path = pg_catalog, public, app_private as $$
declare v_organization_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select organization_id into v_organization_id from app_private.personal_workspaces where user_id = p_user_id;
  if v_organization_id is null then
    insert into public.organizations(display_name) values ('Personal workspace') returning id into v_organization_id;
    insert into app_private.personal_workspaces(user_id, organization_id) values (p_user_id, v_organization_id);
    insert into public.organization_members(organization_id, user_id, role, status)
      values (v_organization_id, p_user_id, 'prospect', 'active');
  end if;
  if not exists (
    select 1 from public.organization_members
    where organization_id = v_organization_id and user_id = p_user_id and status = 'active'
  ) then
    raise exception using errcode = '42501', message = 'FORBIDDEN';
  end if;
  return v_organization_id;
end $$;
revoke all on function public.ensure_personal_workspace(uuid) from public, anon, authenticated;
grant execute on function public.ensure_personal_workspace(uuid) to service_role;

create table public.assessment_case_snapshots (
  assessment_session_id uuid primary key references public.assessment_sessions(id) on delete restrict,
  revision integer not null check (revision > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2097152),
  updated_at timestamptz not null default now()
);
alter table public.assessment_case_snapshots enable row level security;
revoke all on public.assessment_case_snapshots from public, anon, authenticated;
grant select, insert, update on public.assessment_case_snapshots to service_role;

-- Browser roles have no direct snapshot policy or grant. Server routes verify
-- auth.getUser(), active organization membership, and assessment ownership
-- before accessing this table through the service-role repository.

commit;
