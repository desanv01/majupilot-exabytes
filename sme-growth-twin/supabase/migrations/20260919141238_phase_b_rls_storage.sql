begin;

create or replace function app_private.is_active_member(target_org uuid, allowed_roles public.organization_role[] default null)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.organization_members m where m.organization_id=target_org and m.user_id=(select auth.uid()) and m.status='active' and (allowed_roles is null or m.role=any(allowed_roles)));
$$;
create or replace function app_private.can_access_assessment(target_session uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(select 1 from public.assessment_sessions s where s.id=target_session and s.organization_id is not null and app_private.is_active_member(s.organization_id,null));
$$;
create or replace function app_private.can_access_lead(target_lead uuid)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists(
    select 1 from public.leads l join public.organization_members m on m.organization_id=l.organization_id
    where l.id=target_lead and m.user_id=(select auth.uid()) and m.status='active' and (
      m.role in ('prospect','sales_manager','system_admin') or
      (m.role='consultant' and exists(select 1 from public.lead_assignments a where a.lead_id=l.id and (a.assignee_member_user_id=m.user_id or (a.team_key is not null and a.team_key=m.team_key))))
    )
  );
$$;
revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function app_private.is_active_member(uuid,public.organization_role[]) to authenticated;
grant execute on function app_private.can_access_assessment(uuid) to authenticated;
grant execute on function app_private.can_access_lead(uuid) to authenticated;

create or replace function app_private.reject_assessment_owner_change() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  if (new.guest_session_id is distinct from old.guest_session_id or new.organization_id is distinct from old.organization_id)
     and current_setting('app.claim_guest_session',true) <> 'on' then
    raise exception using errcode='22000',message='IMMUTABLE_OWNER';
  end if;
  return new;
end $$;
create trigger assessment_owner_immutable before update on public.assessment_sessions for each row execute function app_private.reject_assessment_owner_change();

do $$ declare t text; begin
  foreach t in array array['profiles','organizations','organization_members','guest_sessions','assessment_sessions','assessment_answers','business_twins','evidence_items','catalogue_versions','catalogue_offerings','catalogue_mappings','diagnostic_runs','recommendation_runs','scenario_comparisons','scenario_revisions','blueprints','consent_records','report_artifacts','leads','lead_assignments','lead_events','sales_roster_entries','sales_queues','consultant_notes','advisor_runs','advisor_reviews','model_calls','chat_sessions','chat_messages','workflow_outbox','retention_holds','export_requests','deletion_requests'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('alter table public.%I force row level security',t);
    execute format('revoke all on table public.%I from public, anon, authenticated',t);
  end loop;
end $$;
revoke all on all sequences in schema public from public,anon,authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;

grant select,insert,update on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated using(user_id=(select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy profiles_update on public.profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

grant select,update on public.organizations to authenticated;
create policy organizations_select on public.organizations for select to authenticated using(app_private.is_active_member(id,null));
create policy organizations_update on public.organizations for update to authenticated using(app_private.is_active_member(id,array['sales_manager','system_admin']::public.organization_role[])) with check(app_private.is_active_member(id,array['sales_manager','system_admin']::public.organization_role[]));
grant select on public.organization_members to authenticated;
create policy organization_members_select on public.organization_members for select to authenticated using(user_id=(select auth.uid()) or app_private.is_active_member(organization_id,array['sales_manager','system_admin']::public.organization_role[]));

grant select,insert,update on public.assessment_sessions to authenticated;
create policy assessment_sessions_select on public.assessment_sessions for select to authenticated using(organization_id is not null and app_private.is_active_member(organization_id,null));
create policy assessment_sessions_insert on public.assessment_sessions for insert to authenticated with check(guest_session_id is null and app_private.is_active_member(organization_id,null) and created_by=(select auth.uid()));
create policy assessment_sessions_update on public.assessment_sessions for update to authenticated using(organization_id is not null and app_private.is_active_member(organization_id,null)) with check(guest_session_id is null and app_private.is_active_member(organization_id,null));

grant select,insert on public.assessment_answers,public.business_twins,public.evidence_items,public.diagnostic_runs,public.recommendation_runs,public.scenario_comparisons,public.blueprints,public.advisor_runs,public.model_calls,public.chat_sessions to authenticated;
create policy assessment_answers_select on public.assessment_answers for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy assessment_answers_insert on public.assessment_answers for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id) and (created_by is null or created_by=(select auth.uid())));
create policy business_twins_select on public.business_twins for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy business_twins_insert on public.business_twins for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id) and (created_by is null or created_by=(select auth.uid())));
create policy evidence_items_select on public.evidence_items for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy evidence_items_insert on public.evidence_items for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id));
create policy diagnostic_runs_select on public.diagnostic_runs for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy diagnostic_runs_insert on public.diagnostic_runs for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id));
create policy recommendation_runs_select on public.recommendation_runs for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy recommendation_runs_insert on public.recommendation_runs for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id));
create policy scenario_comparisons_select on public.scenario_comparisons for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy scenario_comparisons_insert on public.scenario_comparisons for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id));
create policy blueprints_select on public.blueprints for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy blueprints_insert on public.blueprints for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id) and (created_by is null or created_by=(select auth.uid())));
create policy advisor_runs_select on public.advisor_runs for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy advisor_runs_insert on public.advisor_runs for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id));
create policy model_calls_select on public.model_calls for select to authenticated using((assessment_session_id is not null and app_private.can_access_assessment(assessment_session_id)) or (organization_id is not null and app_private.is_active_member(organization_id,array['sales_manager','system_admin']::public.organization_role[])));
create policy model_calls_insert on public.model_calls for insert to authenticated with check((assessment_session_id is not null and app_private.can_access_assessment(assessment_session_id)) or (organization_id is not null and app_private.is_active_member(organization_id,null)));
create policy chat_sessions_select on public.chat_sessions for select to authenticated using(app_private.can_access_assessment(assessment_session_id));
create policy chat_sessions_insert on public.chat_sessions for insert to authenticated with check(app_private.can_access_assessment(assessment_session_id));

grant select,insert on public.scenario_revisions to authenticated;
create policy scenario_revisions_select on public.scenario_revisions for select to authenticated using(exists(select 1 from public.scenario_comparisons c where c.id=scenario_comparison_id and app_private.can_access_assessment(c.assessment_session_id)));
create policy scenario_revisions_insert on public.scenario_revisions for insert to authenticated with check(exists(select 1 from public.scenario_comparisons c where c.id=scenario_comparison_id and app_private.can_access_assessment(c.assessment_session_id)) and (created_by is null or created_by=(select auth.uid())));
grant select,insert on public.advisor_reviews to authenticated;
create policy advisor_reviews_select on public.advisor_reviews for select to authenticated using(exists(select 1 from public.advisor_runs r where r.id=advisor_run_id and app_private.can_access_assessment(r.assessment_session_id)));
create policy advisor_reviews_insert on public.advisor_reviews for insert to authenticated with check(exists(select 1 from public.advisor_runs r where r.id=advisor_run_id and app_private.can_access_assessment(r.assessment_session_id)));
grant select,insert on public.chat_messages to authenticated;
create policy chat_messages_select on public.chat_messages for select to authenticated using(exists(select 1 from public.chat_sessions c where c.id=chat_session_id and app_private.can_access_assessment(c.assessment_session_id)));
create policy chat_messages_insert on public.chat_messages for insert to authenticated with check(exists(select 1 from public.chat_sessions c where c.id=chat_session_id and app_private.can_access_assessment(c.assessment_session_id)));

grant select,insert on public.consent_records to authenticated;
create policy consent_records_select on public.consent_records for select to authenticated using((organization_id is not null and app_private.is_active_member(organization_id,null)) or (assessment_session_id is not null and app_private.can_access_assessment(assessment_session_id)));
create policy consent_records_insert on public.consent_records for insert to authenticated with check(subject_kind='user' and subject_id=(select auth.uid()) and ((organization_id is not null and app_private.is_active_member(organization_id,null)) or (assessment_session_id is not null and app_private.can_access_assessment(assessment_session_id))));
grant select on public.report_artifacts to authenticated;
create policy report_artifacts_select on public.report_artifacts for select to authenticated using(app_private.can_access_assessment(assessment_session_id));

grant select on public.leads,public.lead_assignments,public.lead_events,public.consultant_notes to authenticated;
create policy leads_select on public.leads for select to authenticated using(app_private.can_access_lead(id));
create policy lead_assignments_select on public.lead_assignments for select to authenticated using(app_private.can_access_lead(lead_id));
create policy lead_events_select on public.lead_events for select to authenticated using(app_private.can_access_lead(lead_id));
create policy consultant_notes_select on public.consultant_notes for select to authenticated using(app_private.can_access_lead(lead_id));

grant select,insert on public.export_requests,public.deletion_requests to authenticated;
create policy export_requests_select on public.export_requests for select to authenticated using(requested_by=(select auth.uid()) and (organization_id is null or app_private.is_active_member(organization_id,null)));
create policy export_requests_insert on public.export_requests for insert to authenticated with check(requested_by=(select auth.uid()) and (organization_id is null or app_private.is_active_member(organization_id,null)));
create policy deletion_requests_select on public.deletion_requests for select to authenticated using(requested_by=(select auth.uid()) and (organization_id is null or app_private.is_active_member(organization_id,null)));
create policy deletion_requests_insert on public.deletion_requests for insert to authenticated with check(requested_by=(select auth.uid()) and (organization_id is null or app_private.is_active_member(organization_id,null)));

create view public.public_catalogue_offerings with(security_invoker=true) as
select o.stable_offering_id,o.name,o.provider,o.classification,o.approved_summary,o.official_source_url,o.verified_at,v.semantic_version
from public.catalogue_offerings o join public.catalogue_versions v on v.id=o.catalogue_version_id where o.active and v.review_state='active' and o.classification<>'unavailable/unverified';
revoke all on public.public_catalogue_offerings from public; grant select on public.public_catalogue_offerings to anon,authenticated;
grant select (id,semantic_version,review_state,effective_at,retired_at,created_at) on public.catalogue_versions to anon,authenticated;
grant select (id,catalogue_version_id,stable_offering_id,classification,name,provider,approved_summary,official_source_url,verified_at,active,created_at) on public.catalogue_offerings to anon,authenticated;
create policy catalogue_versions_public_select on public.catalogue_versions for select to anon,authenticated using(review_state='active');
create policy catalogue_offerings_public_select on public.catalogue_offerings for select to anon,authenticated using(active and classification<>'unavailable/unverified' and exists(select 1 from public.catalogue_versions v where v.id=catalogue_version_id and v.review_state='active'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('majupilot-reports','majupilot-reports',false,26214400,array['application/pdf']),
('majupilot-exports','majupilot-exports',false,52428800,array['application/json','application/zip'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy report_objects_select on storage.objects for select to authenticated using(bucket_id='majupilot-reports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,null));
create policy report_objects_insert on storage.objects for insert to authenticated with check(bucket_id='majupilot-reports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,null));
create policy report_objects_update on storage.objects for update to authenticated using(bucket_id='majupilot-reports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,null)) with check(bucket_id='majupilot-reports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,null));
create policy report_objects_delete on storage.objects for delete to authenticated using(bucket_id='majupilot-reports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,array['sales_manager','system_admin']::public.organization_role[]));
create policy export_objects_select on storage.objects for select to authenticated using(bucket_id='majupilot-exports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,null));
create policy export_objects_insert on storage.objects for insert to authenticated with check(bucket_id='majupilot-exports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,array['sales_manager','system_admin']::public.organization_role[]));
create policy export_objects_update on storage.objects for update to authenticated using(bucket_id='majupilot-exports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,array['sales_manager','system_admin']::public.organization_role[])) with check(bucket_id='majupilot-exports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,array['sales_manager','system_admin']::public.organization_role[]));
create policy export_objects_delete on storage.objects for delete to authenticated using(bucket_id='majupilot-exports' and app_private.is_active_member(((storage.foldername(name))[1])::uuid,array['sales_manager','system_admin']::public.organization_role[]));

commit;
