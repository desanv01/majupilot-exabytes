begin;

alter table public.consent_records
  add column blueprint_id uuid references public.blueprints(id),
  add column report_artifact_id uuid references public.report_artifacts(id),
  add column valid_until timestamptz,
  add column consent_snapshot jsonb not null default '{}'::jsonb;

create index consent_records_current_idx
  on public.consent_records(assessment_session_id, subject_kind, subject_id, purpose, created_at desc);

alter table public.leads
  add column guest_session_id uuid references public.guest_sessions(id),
  add column receipt_id uuid not null default gen_random_uuid(),
  add column blueprint_revision integer,
  add column report_version integer,
  add column report_content_sha256 text,
  add column consent_snapshot jsonb not null default '{}'::jsonb,
  add column assignment_state text not null default 'unassigned',
  add column region text,
  add column preferred_language text,
  add column capability_tags text[] not null default '{}',
  add column created_by_kind text not null default 'system',
  add column created_by_id uuid,
  add column schema_version text not null default '1.0.0';

alter table public.leads
  add constraint leads_owner_exactly_one check ((organization_id is null) <> (guest_session_id is null)),
  add constraint leads_receipt_id_unique unique (receipt_id),
  add constraint leads_status_valid check (status in ('new','assigned','contact_pending','contacted','qualified','proposal','won','lost','closed','withdrawn')),
  add constraint leads_assignment_state_valid check (assignment_state in ('assigned','unassigned')),
  add constraint leads_report_hash_format check (report_content_sha256 is null or report_content_sha256 ~ '^[a-f0-9]{64}$'),
  add constraint leads_request_key_nonempty check (length(idempotency_key) between 8 and 128);

create index leads_guest_created_idx on public.leads(guest_session_id, created_at desc) where guest_session_id is not null;
create index leads_receipt_idx on public.leads(receipt_id);

alter table public.sales_roster_entries
  add column member_user_id uuid references auth.users(id),
  add column team_key text,
  add column max_new_leads_30d integer not null default 100 check (max_new_leads_30d >= 0),
  add column eligibility jsonb not null default '{"accepting_new_leads":true}'::jsonb,
  add column roster_version text not null default 'demo-roster-1.0.0';

create unique index sales_roster_member_idx on public.sales_roster_entries(member_user_id) where member_user_id is not null;
create index sales_roster_active_version_idx on public.sales_roster_entries(roster_version, stable_key) where active;

alter table public.sales_queues
  add column queue_version text not null default 'demo-roster-1.0.0';

alter table public.lead_assignments
  add column roster_snapshot_version text not null default 'legacy',
  add column normalized_inputs jsonb not null default '{}'::jsonb,
  add column candidate_snapshot jsonb not null default '[]'::jsonb,
  add column load_snapshot jsonb not null default '{}'::jsonb,
  add column tie_break_result text,
  add column request_id text not null default 'legacy',
  add column correlation_id text not null default 'legacy',
  add column actor_kind text not null default 'system',
  add column actor_id uuid;

insert into public.sales_roster_entries(stable_key, display_label, fictional_demo, regions, languages, capability_tags, active, version, roster_version, max_new_leads_30d)
values
  ('demo_sales_aina','Aina Rahman — Fictional Demo Consultant',true,array['Malaysia','Central'],array['English','Bahasa Malaysia'],array['productivity','digital presence','CRM'],true,1,'demo-roster-1.0.0',100),
  ('demo_sales_jian','Jian Wei Tan — Fictional Demo Consultant',true,array['Malaysia','North'],array['English','Mandarin'],array['commerce','cloud','cybersecurity'],true,1,'demo-roster-1.0.0',100),
  ('demo_sales_kavya','Kavya Nair — Fictional Demo Consultant',true,array['Malaysia','South'],array['English','Bahasa Malaysia','Tamil'],array['AI readiness','automation','collaboration'],true,1,'demo-roster-1.0.0',100)
on conflict(stable_key) do update set
  display_label=excluded.display_label, fictional_demo=true, regions=excluded.regions, languages=excluded.languages,
  capability_tags=excluded.capability_tags, active=excluded.active, version=excluded.version,
  roster_version=excluded.roster_version, max_new_leads_30d=excluded.max_new_leads_30d;

insert into public.sales_queues(stable_key, display_label, active, version, queue_version)
values('unassigned','Unassigned consultation queue',true,1,'demo-roster-1.0.0')
on conflict(stable_key) do update set display_label=excluded.display_label, active=true, version=excluded.version, queue_version=excluded.queue_version;

create or replace function app_private.can_access_lead(target_lead uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(
    select 1
    from public.leads l
    where l.id=target_lead and (
      (l.organization_id is not null and exists(
        select 1 from public.organization_members m
        where m.organization_id=l.organization_id and m.user_id=(select auth.uid()) and m.status='active' and (
          m.role in ('prospect','sales_manager','system_admin') or
          (m.role='consultant' and exists(
            select 1 from public.lead_assignments a
            where a.lead_id=l.id and (
              a.assignee_member_user_id=m.user_id or
              (a.team_key is not null and a.team_key=m.team_key)
            )
          ))
        )
      ))
      or exists(
        select 1 from public.lead_assignments a
        join public.sales_roster_entries r on r.stable_key=a.roster_key
        where a.lead_id=l.id and r.member_user_id=(select auth.uid()) and r.active
          and a.sequence=(select max(a2.sequence) from public.lead_assignments a2 where a2.lead_id=l.id)
      )
      or exists(
        select 1 from public.organization_members admin_member
        where admin_member.user_id=(select auth.uid()) and admin_member.status='active' and admin_member.role='system_admin'
      )
    )
  );
$$;

create or replace function app_private.can_access_lead_internal(target_lead uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(
    select 1
    from public.leads l
    where l.id=target_lead and (
      (l.organization_id is not null and exists(
        select 1 from public.organization_members m
        where m.organization_id=l.organization_id and m.user_id=(select auth.uid()) and m.status='active' and (
          m.role in ('sales_manager','system_admin') or
          (m.role='consultant' and exists(
            select 1 from public.lead_assignments a
            where a.lead_id=l.id and (a.assignee_member_user_id=m.user_id or (a.team_key is not null and a.team_key=m.team_key))
          ))
        )
      ))
      or exists(
        select 1 from public.lead_assignments a
        join public.sales_roster_entries r on r.stable_key=a.roster_key
        where a.lead_id=l.id and r.member_user_id=(select auth.uid()) and r.active
          and a.sequence=(select max(a2.sequence) from public.lead_assignments a2 where a2.lead_id=l.id)
      )
      or exists(
        select 1 from public.organization_members admin_member
        where admin_member.user_id=(select auth.uid()) and admin_member.status='active' and admin_member.role='system_admin'
      )
    )
  );
$$;

drop policy if exists lead_assignments_select on public.lead_assignments;
drop policy if exists lead_events_select on public.lead_events;
drop policy if exists consultant_notes_select on public.consultant_notes;
create policy lead_assignments_select on public.lead_assignments for select to authenticated using(app_private.can_access_lead_internal(lead_id));
create policy lead_events_select on public.lead_events for select to authenticated using(app_private.can_access_lead_internal(lead_id));
create policy consultant_notes_select on public.consultant_notes for select to authenticated using(
  (organization_id is not null and app_private.is_active_member(organization_id,array['consultant','sales_manager','system_admin']::public.organization_role[]))
  or (lead_id is not null and app_private.can_access_lead_internal(lead_id))
);
revoke all on function app_private.can_access_lead_internal(uuid) from public,anon,authenticated;
grant execute on function app_private.can_access_lead_internal(uuid) to authenticated;

create or replace function app_private.protect_lead_identity()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
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
    raise exception using errcode='22000',message='IMMUTABLE_LEAD_IDENTITY';
  end if;
  return new;
end $$;

create trigger leads_identity_immutable
before update on public.leads for each row execute function app_private.protect_lead_identity();

create or replace function app_private.create_phase_f_lead(
  p_owner_kind text, p_owner_id uuid, p_organization_id uuid, p_actor_user_id uuid,
  p_assessment_session_id uuid, p_blueprint_id uuid, p_blueprint_revision integer,
  p_report_artifact_id uuid, p_report_content_sha256 text,
  p_contact_consent_id uuid, p_report_consent_id uuid,
  p_idempotency_key text, p_request_hash text, p_contact_payload jsonb,
  p_region text, p_preferred_language text, p_capability_tags text[],
  p_roster_version text, p_algorithm_version text, p_request_id text, p_correlation_id text
)
returns table(receipt_id uuid, lead_id uuid, lead_status text, assignment_state text, assignment_key text, replayed boolean)
language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare
  v_assessment public.assessment_sessions;
  v_report public.report_artifacts;
  v_existing public.leads;
  v_lead public.leads;
  v_contact public.consent_records;
  v_share public.consent_records;
  v_selected_id uuid;
  v_selected_key text;
  v_selected_team_key text;
  v_candidate_snapshot jsonb := '[]'::jsonb;
  v_load_snapshot jsonb := '{}'::jsonb;
  v_region_fallback boolean := false;
  v_language_fallback boolean := false;
  v_reason text;
  v_assignment_key text;
  v_actor_kind text;
  v_actor_id uuid;
begin
  if p_owner_kind not in ('guest','organization') or p_idempotency_key !~ '^[A-Za-z0-9_.:-]{8,128}$'
    or p_request_hash !~ '^[a-f0-9]{64}$' or p_report_content_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception using errcode='22023',message='VALIDATION_FAILED';
  end if;

  select * into v_assessment from public.assessment_sessions where id=p_assessment_session_id for update;
  if not found then raise exception using errcode='P0002',message='BLUEPRINT_NOT_FOUND'; end if;
  if p_owner_kind='organization' then
    if p_organization_id is null or p_owner_id is distinct from p_actor_user_id or v_assessment.organization_id is distinct from p_organization_id
      or not exists(select 1 from public.organization_members m where m.organization_id=p_organization_id and m.user_id=p_actor_user_id and m.status='active') then
      raise exception using errcode='42501',message='FORBIDDEN';
    end if;
  else
    if p_organization_id is not null or v_assessment.guest_session_id is distinct from p_owner_id
      or not exists(select 1 from public.guest_sessions g where g.id=p_owner_id and g.revoked_at is null and g.claimed_at is null and g.expires_at>now() and g.absolute_expires_at>now()) then
      raise exception using errcode='42501',message='FORBIDDEN';
    end if;
  end if;

  select * into v_existing from public.leads where assessment_session_id=p_assessment_session_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.request_hash<>p_request_hash then raise exception using errcode='23505',message='IDEMPOTENCY_CONFLICT'; end if;
    select coalesce(a.roster_key,a.queue_key) into v_assignment_key from public.lead_assignments a where a.lead_id=v_existing.id order by a.sequence desc limit 1;
    return query select v_existing.receipt_id,v_existing.id,v_existing.status,v_existing.assignment_state,v_assignment_key,true;
    return;
  end if;

  perform 1 from public.blueprints where id=p_blueprint_id and assessment_session_id=p_assessment_session_id and revision=p_blueprint_revision;
  if not found then raise exception using errcode='P0002',message='BLUEPRINT_NOT_FOUND'; end if;
  select * into v_report from public.report_artifacts where id=p_report_artifact_id and assessment_session_id=p_assessment_session_id and blueprint_id=p_blueprint_id for update;
  if not found or v_report.status<>'completed' or v_report.content_sha256 is distinct from p_report_content_sha256
    or v_report.blueprint_revision is distinct from p_blueprint_revision
    or (p_owner_kind='organization' and v_report.organization_id is distinct from p_organization_id)
    or (p_owner_kind='guest' and v_report.guest_session_id is distinct from p_owner_id) then
    raise exception using errcode='23514',message='REPORT_NOT_READY';
  end if;

  select * into v_contact from public.consent_records where id=p_contact_consent_id for share;
  select * into v_share from public.consent_records where id=p_report_consent_id for share;
  if v_contact.id is null or v_share.id is null
    or v_contact.purpose<>'consultation_contact' or v_share.purpose<>'report_share_with_sales'
    or v_contact.action<>'granted' or v_share.action<>'granted'
    or v_contact.assessment_session_id is distinct from p_assessment_session_id or v_share.assessment_session_id is distinct from p_assessment_session_id
    or v_contact.subject_id is distinct from p_owner_id or v_share.subject_id is distinct from p_owner_id
    or v_contact.subject_kind is distinct from (case when p_owner_kind='guest' then 'guest_session' else 'user' end)
    or v_share.subject_kind is distinct from (case when p_owner_kind='guest' then 'guest_session' else 'user' end)
    or v_contact.blueprint_id is distinct from p_blueprint_id or v_share.blueprint_id is distinct from p_blueprint_id
    or v_contact.report_artifact_id is distinct from p_report_artifact_id or v_share.report_artifact_id is distinct from p_report_artifact_id
    or (v_contact.valid_until is not null and v_contact.valid_until<=now()) or (v_share.valid_until is not null and v_share.valid_until<=now())
    or exists(select 1 from public.consent_records c where c.assessment_session_id=p_assessment_session_id and c.subject_kind=v_contact.subject_kind and c.subject_id=p_owner_id and c.purpose='consultation_contact' and c.id<>v_contact.id and c.created_at>=v_contact.created_at)
    or exists(select 1 from public.consent_records c where c.assessment_session_id=p_assessment_session_id and c.subject_kind=v_share.subject_kind and c.subject_id=p_owner_id and c.purpose='report_share_with_sales' and c.id<>v_share.id and c.created_at>=v_share.created_at) then
    raise exception using errcode='23514',message='CONSENT_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('majupilot:assignment:'||p_roster_version,0));

  with base as (
    select r.*,
      (select count(*)::integer from public.lead_assignments a where a.roster_key=r.stable_key and a.sequence=1 and a.created_at>=now()-interval '30 days') as load_count,
      case when p_region is null then 0 when p_region=any(r.regions) then 2 when 'Malaysia'=any(r.regions) then 1 else 0 end as region_score,
      case when p_preferred_language is null then 0 when p_preferred_language=any(r.languages) then 1 else 0 end as language_score,
      (select count(*)::integer from unnest(coalesce(p_capability_tags,'{}'::text[])) tag where tag=any(r.capability_tags)) as capability_score
    from public.sales_roster_entries r
    where r.active and r.roster_version=p_roster_version and coalesce((r.eligibility->>'accepting_new_leads')::boolean,true)
  ), capacity as (
    select * from base where load_count<max_new_leads_30d
  ), region_rank as (select coalesce(max(region_score),0) best from capacity),
  region_filtered as (select c.* from capacity c,region_rank rr where rr.best=0 or c.region_score=rr.best),
  language_rank as (select coalesce(max(language_score),0) best from region_filtered),
  language_filtered as (select c.* from region_filtered c,language_rank lr where lr.best=0 or c.language_score=lr.best),
  capability_rank as (select coalesce(max(capability_score),0) best from language_filtered),
  finalists as (select c.* from language_filtered c,capability_rank cr where cr.best=0 or c.capability_score=cr.best)
  select id,stable_key,team_key into v_selected_id,v_selected_key,v_selected_team_key
  from finalists order by load_count,stable_key limit 1;

  with candidates as (
    select r.stable_key,
      (select count(*)::integer from public.lead_assignments a where a.roster_key=r.stable_key and a.sequence=1 and a.created_at>=now()-interval '30 days') as load_count,
      case when p_region is null then 0 when p_region=any(r.regions) then 2 when 'Malaysia'=any(r.regions) then 1 else 0 end as region_score,
      case when p_preferred_language is null then 0 when p_preferred_language=any(r.languages) then 1 else 0 end as language_score,
      (select count(*)::integer from unnest(coalesce(p_capability_tags,'{}'::text[])) tag where tag=any(r.capability_tags)) as capability_score
    from public.sales_roster_entries r
    where r.active and r.roster_version=p_roster_version and coalesce((r.eligibility->>'accepting_new_leads')::boolean,true)
  )
  select coalesce(jsonb_agg(jsonb_build_object('stableKey',stable_key,'load',load_count,'regionScore',region_score,'languageScore',language_score,'capabilityScore',capability_score) order by stable_key),'[]'::jsonb),
    coalesce(jsonb_object_agg(stable_key,load_count),'{}'::jsonb)
  into v_candidate_snapshot,v_load_snapshot from candidates;

  select not exists(select 1 from public.sales_roster_entries r where r.active and r.roster_version=p_roster_version and p_region=any(r.regions)) into v_region_fallback where p_region is not null;
  select not exists(select 1 from public.sales_roster_entries r where r.active and r.roster_version=p_roster_version and p_preferred_language=any(r.languages)) into v_language_fallback where p_preferred_language is not null;
  v_reason:=concat_ws(',',case when v_region_fallback then 'region_fallback' end,case when v_language_fallback then 'language_fallback' end,case when v_selected_id is null then 'no_eligible_salesperson' else 'deterministic_load_tie_break' end);
  v_actor_kind:=case when p_owner_kind='guest' then 'guest' else 'user' end;
  v_actor_id:=p_owner_id;

  insert into public.leads(organization_id,guest_session_id,assessment_session_id,blueprint_id,blueprint_revision,report_artifact_id,report_version,report_content_sha256,
    consent_contact_id,consent_report_id,idempotency_key,request_hash,status,contact_payload,consent_snapshot,assignment_state,region,preferred_language,capability_tags,created_by_kind,created_by_id,schema_version)
  values(p_organization_id,case when p_owner_kind='guest' then p_owner_id end,p_assessment_session_id,p_blueprint_id,p_blueprint_revision,p_report_artifact_id,v_report.report_version,p_report_content_sha256,
    p_contact_consent_id,p_report_consent_id,p_idempotency_key,p_request_hash,case when v_selected_id is null then 'new' else 'assigned' end,p_contact_payload,
    jsonb_build_object('version','phase-f-consent-snapshot-1.0.0','consultationContact',jsonb_build_object('id',v_contact.id,'consentVersion',v_contact.consent_version,'policyVersion',v_contact.policy_version,'textHash',v_contact.text_hash,'grantedAt',v_contact.created_at),'reportShare',jsonb_build_object('id',v_share.id,'consentVersion',v_share.consent_version,'policyVersion',v_share.policy_version,'textHash',v_share.text_hash,'grantedAt',v_share.created_at)),
    case when v_selected_id is null then 'unassigned' else 'assigned' end,p_region,p_preferred_language,coalesce(p_capability_tags,'{}'::text[]),v_actor_kind,v_actor_id,'1.0.0') returning * into v_lead;

  if v_selected_id is null then v_assignment_key:='unassigned'; else v_assignment_key:=v_selected_key; end if;
  insert into public.lead_assignments(lead_id,sequence,assignee_member_user_id,roster_key,queue_key,team_key,reason,algorithm_version,created_by,roster_snapshot_version,
    normalized_inputs,candidate_snapshot,load_snapshot,tie_break_result,request_id,correlation_id,actor_kind,actor_id)
  values(v_lead.id,1,null,case when v_selected_id is not null then v_selected_key end,case when v_selected_id is null then 'unassigned' end,v_selected_team_key,
    v_reason,p_algorithm_version,p_actor_user_id,p_roster_version,jsonb_build_object('region',p_region,'preferredLanguage',p_preferred_language,'capabilityTags',coalesce(p_capability_tags,'{}'::text[])),
    v_candidate_snapshot,v_load_snapshot,coalesce(v_selected_key,'unassigned'),p_request_id,p_correlation_id,v_actor_kind,v_actor_id);

  insert into public.lead_events(lead_id,sequence,event_type,actor_kind,actor_id,reason_code,payload,correlation_id,idempotency_key,schema_version) values
    (v_lead.id,1,'lead.created',v_actor_kind,v_actor_id,'consultation_requested',jsonb_build_object('requestId',p_request_id),p_correlation_id,p_idempotency_key||':lead','1.0.0'),
    (v_lead.id,2,'report.attached',v_actor_kind,v_actor_id,'canonical_report',jsonb_build_object('reportArtifactId',p_report_artifact_id,'reportVersion',v_report.report_version,'contentSha256',p_report_content_sha256),p_correlation_id,p_idempotency_key||':report','1.0.0'),
    (v_lead.id,3,'consent.linked',v_actor_kind,v_actor_id,'required_consents_current',jsonb_build_object('consentIds',jsonb_build_array(p_contact_consent_id,p_report_consent_id),'snapshotVersion','phase-f-consent-snapshot-1.0.0'),p_correlation_id,p_idempotency_key||':consent','1.0.0'),
    (v_lead.id,4,case when v_selected_id is null then 'assignment.unassigned' else 'assignment.created' end,'system',null,v_reason,jsonb_build_object('assignmentKey',v_assignment_key,'algorithmVersion',p_algorithm_version,'rosterVersion',p_roster_version),p_correlation_id,p_idempotency_key||':assignment','1.0.0');

  return query select v_lead.receipt_id,v_lead.id,v_lead.status,v_lead.assignment_state,v_assignment_key,false;
exception
  when unique_violation then
    select * into v_existing from public.leads where assessment_session_id=p_assessment_session_id and idempotency_key=p_idempotency_key;
    if v_existing.id is not null and v_existing.request_hash=p_request_hash then
      select coalesce(a.roster_key,a.queue_key) into v_assignment_key from public.lead_assignments a where a.lead_id=v_existing.id order by a.sequence desc limit 1;
      return query select v_existing.receipt_id,v_existing.id,v_existing.status,v_existing.assignment_state,v_assignment_key,true;
      return;
    end if;
    raise exception using errcode='23505',message='IDEMPOTENCY_CONFLICT';
end $$;

create or replace function public.create_phase_f_lead(
  p_owner_kind text, p_owner_id uuid, p_organization_id uuid, p_actor_user_id uuid,
  p_assessment_session_id uuid, p_blueprint_id uuid, p_blueprint_revision integer,
  p_report_artifact_id uuid, p_report_content_sha256 text,
  p_contact_consent_id uuid, p_report_consent_id uuid,
  p_idempotency_key text, p_request_hash text, p_contact_payload jsonb,
  p_region text, p_preferred_language text, p_capability_tags text[],
  p_roster_version text, p_algorithm_version text, p_request_id text, p_correlation_id text
)
returns table(receipt_id uuid, lead_id uuid, lead_status text, assignment_state text, assignment_key text, replayed boolean)
language sql security invoker set search_path=pg_catalog,public as $$
  select * from app_private.create_phase_f_lead(p_owner_kind,p_owner_id,p_organization_id,p_actor_user_id,p_assessment_session_id,p_blueprint_id,p_blueprint_revision,
    p_report_artifact_id,p_report_content_sha256,p_contact_consent_id,p_report_consent_id,p_idempotency_key,p_request_hash,p_contact_payload,p_region,p_preferred_language,
    p_capability_tags,p_roster_version,p_algorithm_version,p_request_id,p_correlation_id)
$$;

revoke all on function public.create_phase_f_lead(text,uuid,uuid,uuid,uuid,uuid,integer,uuid,text,uuid,uuid,text,text,jsonb,text,text,text[],text,text,text,text) from public,anon,authenticated;
grant execute on function public.create_phase_f_lead(text,uuid,uuid,uuid,uuid,uuid,integer,uuid,text,uuid,uuid,text,text,jsonb,text,text,text[],text,text,text,text) to service_role;
revoke all on function app_private.create_phase_f_lead(text,uuid,uuid,uuid,uuid,uuid,integer,uuid,text,uuid,uuid,text,text,jsonb,text,text,text[],text,text,text,text) from public,anon,authenticated;
grant execute on function app_private.create_phase_f_lead(text,uuid,uuid,uuid,uuid,uuid,integer,uuid,text,uuid,uuid,text,text,jsonb,text,text,text[],text,text,text,text) to service_role;
revoke all on function app_private.protect_lead_identity() from public,anon,authenticated;

commit;
