begin;

-- The existing claim transaction changes assessment ownership. Its owner
-- marker also permits this tightly bounded transfer of related rows.
create or replace function app_private.guard_consent_claim_immutable()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  -- claim_guest_session updates assessment_sessions before consent_records.
  if tg_op = 'UPDATE' then
    if current_setting('app.claim_guest_session', true) = 'on'
      and old.organization_id is null
      and new.organization_id is not null
      and old.subject_kind = 'guest_session'
      and exists (
        select 1 from public.guest_sessions g
        join public.assessment_sessions a on a.id = old.assessment_session_id
        where g.id = old.subject_id
          and g.claimed_organization_id = new.organization_id
          and a.organization_id = new.organization_id
          and a.guest_session_id is null
      )
      and to_jsonb(new) - 'organization_id' = to_jsonb(old) - 'organization_id' then
      return new;
    end if;
  end if;
  raise exception using errcode = '22000', message = 'IMMUTABLE_RECORD';
end $$;

drop trigger consent_records_immutable on public.consent_records;
create trigger consent_records_immutable before update or delete on public.consent_records
for each row execute function app_private.guard_consent_claim_immutable();

create or replace function app_private.protect_completed_report()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_setting('app.claim_guest_session', true) = 'on'
    and old.guest_session_id is not null
    and new.guest_session_id is null
    and new.organization_id is not null
    and exists (select 1 from public.guest_sessions g where g.id = old.guest_session_id and g.claimed_organization_id = new.organization_id)
    and to_jsonb(new) - 'organization_id' - 'guest_session_id' = to_jsonb(old) - 'organization_id' - 'guest_session_id' then
    return new;
  end if;
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

create or replace function app_private.protect_lead_identity()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_setting('app.claim_guest_session', true) = 'on'
    and old.guest_session_id is not null
    and new.guest_session_id is null
    and new.organization_id is not null
    and exists (select 1 from public.guest_sessions g where g.id = old.guest_session_id and g.claimed_organization_id = new.organization_id)
    and to_jsonb(new) - 'organization_id' - 'guest_session_id' = to_jsonb(old) - 'organization_id' - 'guest_session_id' then
    return new;
  end if;
  if new.organization_id is distinct from old.organization_id
    or new.guest_session_id is distinct from old.guest_session_id
    or new.assessment_session_id is distinct from old.assessment_session_id
    or new.blueprint_id is distinct from old.blueprint_id
    or new.blueprint_revision is distinct from old.blueprint_revision
    or new.report_artifact_id is distinct from old.report_artifact_id
    or new.report_version is distinct from old.report_version
    or new.report_content_sha256 is distinct from old.report_content_sha256
    or new.consent_contact_id is distinct from old.consent_contact_id
    or new.consent_report_id is distinct from old.consent_report_id
    or new.idempotency_key is distinct from old.idempotency_key
    or new.request_hash is distinct from old.request_hash
    or new.receipt_id is distinct from old.receipt_id then
    raise exception using errcode = '22000', message = 'IMMUTABLE_LEAD_IDENTITY';
  end if;
  return new;
end $$;

create or replace function app_private.reject_consultant_note_mutation()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if tg_op = 'UPDATE' then
    if current_setting('app.claim_guest_session', true) = 'on'
      and old.organization_id is null
      and new.organization_id is not null
      and exists (select 1 from public.assessment_sessions a where a.id = old.assessment_session_id and a.organization_id = new.organization_id)
      and to_jsonb(new) - 'organization_id' = to_jsonb(old) - 'organization_id' then
      return new;
    end if;
  end if;
  raise exception using errcode = '22000', message = 'IMMUTABLE_CONSULTANT_NOTE';
end $$;

create or replace function app_private.transfer_claimed_case_owners()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.guest_session_id is null or new.guest_session_id is not null or new.organization_id is null then return new; end if;
  if current_setting('app.claim_guest_session', true) <> 'on' then
    raise exception using errcode = '22000', message = 'CLAIM_CONTEXT_REQUIRED';
  end if;
  if not exists (
    select 1 from public.guest_sessions g
    where g.id = old.guest_session_id and g.claimed_organization_id = new.organization_id
  ) then
    raise exception using errcode = '42501', message = 'CLAIM_OWNER_MISMATCH';
  end if;
  update public.evidence_documents set organization_id = new.organization_id, guest_session_id = null
    where assessment_session_id = new.id and guest_session_id = old.guest_session_id;
  update public.chat_sessions set organization_id = new.organization_id, guest_session_id = null
    where assessment_session_id = new.id and guest_session_id = old.guest_session_id;
  update public.report_artifacts set organization_id = new.organization_id, guest_session_id = null
    where assessment_session_id = new.id and guest_session_id = old.guest_session_id;
  update public.leads set organization_id = new.organization_id, guest_session_id = null
    where assessment_session_id = new.id and guest_session_id = old.guest_session_id;
  update public.consultant_notes set organization_id = new.organization_id
    where assessment_session_id = new.id and organization_id is null;
  return new;
end $$;

create trigger assessment_claim_transfer_related_owners
after update of organization_id, guest_session_id on public.assessment_sessions
for each row execute function app_private.transfer_claimed_case_owners();

-- Bring earlier claimed cases into the same ownership model.
select set_config('app.claim_guest_session', 'on', true);
update public.evidence_documents d set organization_id = a.organization_id, guest_session_id = null
from public.assessment_sessions a, public.guest_sessions g
where d.assessment_session_id = a.id and d.guest_session_id = g.id and g.claimed_organization_id = a.organization_id and a.organization_id is not null and a.guest_session_id is null;
update public.chat_sessions c set organization_id = a.organization_id, guest_session_id = null
from public.assessment_sessions a, public.guest_sessions g
where c.assessment_session_id = a.id and c.guest_session_id = g.id and g.claimed_organization_id = a.organization_id and a.organization_id is not null and a.guest_session_id is null;
update public.report_artifacts r set organization_id = a.organization_id, guest_session_id = null
from public.assessment_sessions a, public.guest_sessions g
where r.assessment_session_id = a.id and r.guest_session_id = g.id and g.claimed_organization_id = a.organization_id and a.organization_id is not null and a.guest_session_id is null;
update public.leads l set organization_id = a.organization_id, guest_session_id = null
from public.assessment_sessions a, public.guest_sessions g
where l.assessment_session_id = a.id and l.guest_session_id = g.id and g.claimed_organization_id = a.organization_id and a.organization_id is not null and a.guest_session_id is null;
-- Historical consultant notes have no guest owner column. Only the recorded
-- claimed assessment ID proves provenance; leave any other null-owner notes
-- unchanged rather than guessing across multiple old guest assessments.
update public.consultant_notes n set organization_id = a.organization_id
from public.assessment_sessions a, public.guest_sessions g
where n.assessment_session_id = a.id and g.claimed_assessment_session_id = a.id and g.claimed_organization_id = a.organization_id and a.guest_session_id is null and n.organization_id is null;

update public.consent_records c set organization_id = a.organization_id
from public.assessment_sessions a, public.guest_sessions g
where c.assessment_session_id = a.id and c.subject_kind = 'guest_session' and c.subject_id = g.id
  and g.claimed_organization_id = a.organization_id and a.guest_session_id is null and c.organization_id is null;

revoke all on function app_private.transfer_claimed_case_owners() from public, anon, authenticated;
revoke all on function app_private.guard_consent_claim_immutable() from public, anon, authenticated;
commit;
