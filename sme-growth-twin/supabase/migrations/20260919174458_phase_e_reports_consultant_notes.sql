begin;

create extension if not exists pgcrypto with schema extensions;

alter table public.report_artifacts
  add column report_number text,
  add column blueprint_revision integer,
  add column organization_id uuid references public.organizations(id),
  add column guest_session_id uuid references public.guest_sessions(id),
  add column render_key text,
  add column selected_note_ids uuid[] not null default '{}',
  add column advisor_run_ids uuid[] not null default '{}',
  add column advisor_review_ids uuid[] not null default '{}',
  add column source_artifact_ids uuid[] not null default '{}',
  add column rule_pack_version text,
  add column catalogue_version text,
  add column locale text,
  add column page_count integer,
  add column storage_bucket text,
  add column failure_category text,
  add column created_by uuid references auth.users(id),
  add column request_id text,
  add column generated_at timestamptz,
  add column completed_at timestamptz;

update public.report_artifacts r
set blueprint_revision = b.revision,
    organization_id = a.organization_id,
    guest_session_id = a.guest_session_id,
    report_number = 'MP-' || upper(substr(replace(r.blueprint_id::text, '-', ''), 1, 12)) || '-R' || r.report_version,
    render_key = encode(extensions.digest(r.blueprint_id::text || ':' || r.report_version::text, 'sha256'), 'hex'),
    rule_pack_version = b.rule_pack_version,
    catalogue_version = coalesce(cv.semantic_version, 'unversioned'),
    locale = 'en-MY',
    storage_bucket = case when r.object_path is null then null else 'majupilot-reports' end,
    request_id = 'phase-e-backfill-' || r.id::text,
    generated_at = r.created_at,
    completed_at = case when r.status = 'completed' then r.created_at else null end
from public.blueprints b
join public.assessment_sessions a on a.id = b.assessment_session_id
left join public.catalogue_versions cv on cv.id = b.catalogue_version_id
where b.id = r.blueprint_id;

alter table public.report_artifacts
  alter column report_number set not null,
  alter column blueprint_revision set not null,
  alter column render_key set not null,
  alter column rule_pack_version set not null,
  alter column catalogue_version set not null,
  alter column locale set not null,
  alter column request_id set not null,
  alter column generated_at set not null,
  add constraint report_artifacts_owner_exactly_one check ((organization_id is null) <> (guest_session_id is null)),
  add constraint report_artifacts_hash_format check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  add constraint report_artifacts_render_key_format check (render_key ~ '^[a-f0-9]{64}$'),
  add constraint report_artifacts_page_count_positive check (page_count is null or page_count > 0),
  add constraint report_artifacts_storage_complete check (
    (status = 'completed') = (
      content_sha256 is not null and object_path is not null and storage_bucket is not null
      and byte_length is not null and page_count is not null and completed_at is not null
    )
  );

create unique index report_artifacts_render_key_idx on public.report_artifacts(render_key);
create unique index report_artifacts_report_number_idx on public.report_artifacts(report_number);
create index report_artifacts_org_created_idx on public.report_artifacts(organization_id, created_at desc) where organization_id is not null;
create index report_artifacts_guest_created_idx on public.report_artifacts(guest_session_id, created_at desc) where guest_session_id is not null;

alter table public.consultant_notes
  add column assessment_session_id uuid references public.assessment_sessions(id),
  add column organization_id uuid references public.organizations(id),
  add column source_draft_id uuid references public.consultant_notes(id),
  add column source_artifact_ids uuid[] not null default '{}',
  add column request_id text;

update public.consultant_notes n
set assessment_session_id = l.assessment_session_id,
    organization_id = l.organization_id,
    request_id = 'phase-e-backfill-' || n.id::text
from public.leads l
where l.id = n.lead_id;

alter table public.consultant_notes
  alter column lead_id drop not null,
  alter column assessment_session_id set not null,
  alter column request_id set not null,
  add constraint consultant_notes_owner_matches_assessment check (
    (organization_id is not null) or (lead_id is null)
  ),
  add constraint consultant_notes_ai_draft_contract check (
    origin <> 'ai_draft' or (status = 'draft' and model_call_id is not null and author_user_id is null and accepted_at is null)
  ),
  add constraint consultant_notes_human_acceptance_contract check (
    status <> 'accepted' or (origin = 'human' and source_draft_id is not null and author_user_id is not null and accepted_at is not null)
  );

create unique index consultant_notes_request_idx on public.consultant_notes(assessment_session_id, request_id);
create unique index consultant_notes_one_acceptance_per_draft_idx on public.consultant_notes(source_draft_id) where status = 'accepted';
create index consultant_notes_assessment_idx on public.consultant_notes(assessment_session_id, created_at desc);
create index consultant_notes_org_idx on public.consultant_notes(organization_id, created_at desc) where organization_id is not null;

create or replace function app_private.reject_consultant_note_mutation()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  raise exception using errcode = '22000', message = 'IMMUTABLE_CONSULTANT_NOTE';
end $$;

create trigger consultant_notes_immutable_update
before update on public.consultant_notes for each row execute function app_private.reject_consultant_note_mutation();
create trigger consultant_notes_immutable_delete
before delete on public.consultant_notes for each row execute function app_private.reject_consultant_note_mutation();

create or replace function app_private.protect_completed_report()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.status = 'completed' then
    raise exception using errcode = '22000', message = 'IMMUTABLE_COMPLETED_REPORT';
  end if;
  if new.id is distinct from old.id
    or new.assessment_session_id is distinct from old.assessment_session_id
    or new.blueprint_id is distinct from old.blueprint_id
    or new.blueprint_revision is distinct from old.blueprint_revision
    or new.organization_id is distinct from old.organization_id
    or new.guest_session_id is distinct from old.guest_session_id
    or new.report_version is distinct from old.report_version
    or new.render_key is distinct from old.render_key
    or new.provenance_hash is distinct from old.provenance_hash
    or new.selected_note_ids is distinct from old.selected_note_ids
    or new.renderer_version is distinct from old.renderer_version
    or new.template_version is distinct from old.template_version
    or new.locale is distinct from old.locale then
    raise exception using errcode = '22000', message = 'IMMUTABLE_REPORT_IDENTITY';
  end if;
  return new;
end $$;

create trigger report_artifacts_protect_completed
before update on public.report_artifacts for each row execute function app_private.protect_completed_report();

drop policy if exists report_artifacts_select on public.report_artifacts;
create policy report_artifacts_select on public.report_artifacts for select to authenticated using (
  (organization_id is not null and app_private.is_active_member(organization_id, null))
  or app_private.can_access_assessment(assessment_session_id)
);

drop policy if exists consultant_notes_select on public.consultant_notes;
create policy consultant_notes_select on public.consultant_notes for select to authenticated using (
  organization_id is not null and app_private.is_active_member(
    organization_id,
    array['consultant','sales_manager','system_admin']::public.organization_role[]
  )
);

revoke all on function app_private.reject_consultant_note_mutation() from public, anon, authenticated;
revoke all on function app_private.protect_completed_report() from public, anon, authenticated;

commit;
