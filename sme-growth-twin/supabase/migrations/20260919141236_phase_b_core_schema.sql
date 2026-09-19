begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create type public.organization_role as enum ('prospect','consultant','sales_manager','catalogue_admin','system_admin');
create type public.membership_status as enum ('active','suspended','removed');
create type public.consent_action as enum ('granted','withdrawn','superseded');
create type public.consent_purpose as enum ('consultation_contact','report_share_with_sales','product_updates');
create type public.request_status as enum ('pending','processing','completed','failed','blocked');
create type public.owner_kind as enum ('guest','organization');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or length(display_name) between 1 and 120),
  locale text not null default 'en-MY', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organizations (
  id uuid primary key default gen_random_uuid(), display_name text not null check (length(display_name) between 1 and 160),
  legal_name text, status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'prospect', team_key text,
  status public.membership_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create index organization_members_user_active_idx on public.organization_members(user_id,organization_id) where status='active';
create index organization_members_team_idx on public.organization_members(organization_id,team_key) where status='active';

create table public.guest_sessions (
  id uuid primary key default gen_random_uuid(), token_digest text not null unique check (length(token_digest)=64), previous_token_digest text unique,
  created_at timestamptz not null default now(), last_activity_at timestamptz not null default now(), expires_at timestamptz not null,
  absolute_expires_at timestamptz not null, claimed_at timestamptz, claimed_by_user_id uuid references auth.users(id),
  claimed_organization_id uuid references public.organizations(id), revoked_at timestamptz, rotation_counter integer not null default 0 check(rotation_counter>=0),
  check (expires_at <= absolute_expires_at),
  check ((claimed_at is null and claimed_by_user_id is null and claimed_organization_id is null) or (claimed_at is not null and claimed_by_user_id is not null and claimed_organization_id is not null))
);
create index guest_sessions_active_digest_idx on public.guest_sessions(token_digest,expires_at) where revoked_at is null and claimed_at is null;
create index guest_sessions_retention_idx on public.guest_sessions(last_activity_at) where claimed_at is null;

create table public.assessment_sessions (
  id uuid primary key default gen_random_uuid(), guest_session_id uuid references public.guest_sessions(id), organization_id uuid references public.organizations(id),
  created_by uuid references auth.users(id), state text not null default 'active' check(state in ('active','completed','archived','deletion_pending')),
  schema_version text not null, version integer not null default 1 check(version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((guest_session_id is null) <> (organization_id is null))
);
create unique index assessment_sessions_one_active_guest_idx on public.assessment_sessions(guest_session_id) where guest_session_id is not null and state='active';
create index assessment_sessions_org_idx on public.assessment_sessions(organization_id,updated_at desc) where organization_id is not null;
alter table public.guest_sessions add column claimed_assessment_session_id uuid references public.assessment_sessions(id);
alter table public.guest_sessions add constraint guest_claim_receipt_complete check ((claimed_at is null and claimed_assessment_session_id is null) or (claimed_at is not null and claimed_assessment_session_id is not null));

create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  answer_key text not null, revision integer not null check(revision>0), value jsonb not null, evidence_state text not null default 'confirmed' check(evidence_state in ('draft','confirmed','retracted')),
  supersedes_id uuid references public.assessment_answers(id), schema_version text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now(),
  unique(assessment_session_id,answer_key,revision)
);
create index assessment_answers_session_idx on public.assessment_answers(assessment_session_id,created_at);

create table public.business_twins (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id) on delete restrict,
  revision integer not null check(revision>0), payload jsonb not null, source_artifact_ids uuid[] not null default '{}', schema_version text not null,
  rule_pack_version text not null, created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(assessment_session_id,revision)
);
create index business_twins_session_idx on public.business_twins(assessment_session_id,revision desc);
create table public.evidence_items (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  business_twin_id uuid references public.business_twins(id) on delete restrict, revision integer not null check(revision>0), source_kind text not null,
  source_ref text not null, payload jsonb not null, status text not null default 'active' check(status in ('active','retracted')),
  supersedes_id uuid references public.evidence_items(id), schema_version text not null, created_at timestamptz not null default now(), unique(assessment_session_id,source_ref,revision)
);
create index evidence_items_session_idx on public.evidence_items(assessment_session_id,created_at);
create index evidence_items_twin_idx on public.evidence_items(business_twin_id) where business_twin_id is not null;

create table public.catalogue_versions (
  id uuid primary key default gen_random_uuid(), semantic_version text not null unique, review_state text not null check(review_state in ('draft','reviewed','active','retired')),
  effective_at timestamptz, retired_at timestamptz, created_at timestamptz not null default now()
);
create table public.catalogue_offerings (
  id uuid primary key default gen_random_uuid(), catalogue_version_id uuid not null references public.catalogue_versions(id) on delete restrict,
  stable_offering_id text not null, classification text not null check(classification in ('Exabytes product','partner/resold product','supported path','third-party alternative','consultation-only','unavailable/unverified')),
  name text not null, provider text not null, approved_summary text not null, official_source_url text, verified_at timestamptz,
  active boolean not null default false, facts jsonb not null default '{}', created_at timestamptz not null default now(), unique(catalogue_version_id,stable_offering_id)
);
create index catalogue_offerings_active_idx on public.catalogue_offerings(catalogue_version_id,stable_offering_id) where active;
create table public.catalogue_mappings (
  id uuid primary key default gen_random_uuid(), catalogue_version_id uuid not null references public.catalogue_versions(id) on delete cascade,
  capability_id text not null, stable_offering_id text not null, rule jsonb not null, created_at timestamptz not null default now(), unique(catalogue_version_id,capability_id,stable_offering_id)
);
create index catalogue_mappings_capability_idx on public.catalogue_mappings(catalogue_version_id,capability_id);

create table public.diagnostic_runs (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), business_twin_id uuid not null references public.business_twins(id),
  payload jsonb not null, schema_version text not null, rule_pack_version text not null, model_version text, source_artifact_ids uuid[] not null default '{}', created_at timestamptz not null default now()
);
create index diagnostic_runs_session_idx on public.diagnostic_runs(assessment_session_id,created_at desc); create index diagnostic_runs_twin_idx on public.diagnostic_runs(business_twin_id);
create table public.recommendation_runs (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), diagnostic_run_id uuid not null references public.diagnostic_runs(id),
  business_twin_id uuid not null references public.business_twins(id), catalogue_version_id uuid references public.catalogue_versions(id), payload jsonb not null,
  schema_version text not null, rule_pack_version text not null, model_version text, source_artifact_ids uuid[] not null default '{}', created_at timestamptz not null default now()
);
create index recommendation_runs_session_idx on public.recommendation_runs(assessment_session_id,created_at desc); create index recommendation_runs_diagnostic_idx on public.recommendation_runs(diagnostic_run_id);
create table public.scenario_comparisons (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), recommendation_run_id uuid not null references public.recommendation_runs(id),
  business_twin_id uuid not null references public.business_twins(id), schema_version text not null, rule_pack_version text not null, created_at timestamptz not null default now()
);
create index scenario_comparisons_session_idx on public.scenario_comparisons(assessment_session_id,created_at desc);
create table public.scenario_revisions (
  id uuid primary key default gen_random_uuid(), scenario_comparison_id uuid not null references public.scenario_comparisons(id) on delete restrict,
  revision integer not null check(revision>0), assumptions jsonb not null, results jsonb not null, source_artifact_ids uuid[] not null default '{}',
  schema_version text not null, supersedes_id uuid references public.scenario_revisions(id), created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(scenario_comparison_id,revision)
);
create index scenario_revisions_comparison_idx on public.scenario_revisions(scenario_comparison_id,revision desc);
create table public.blueprints (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), revision integer not null check(revision>0),
  business_twin_id uuid not null references public.business_twins(id), diagnostic_run_id uuid not null references public.diagnostic_runs(id), recommendation_run_id uuid not null references public.recommendation_runs(id),
  scenario_revision_id uuid not null references public.scenario_revisions(id), payload jsonb not null, schema_version text not null, rule_pack_version text not null,
  catalogue_version_id uuid references public.catalogue_versions(id), model_version text, source_artifact_ids uuid[] not null default '{}', provenance_hash text not null check(length(provenance_hash)=64),
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(assessment_session_id,revision)
);
create index blueprints_session_idx on public.blueprints(assessment_session_id,revision desc);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid references public.assessment_sessions(id), organization_id uuid references public.organizations(id),
  subject_kind text not null check(subject_kind in ('guest_session','user')), subject_id uuid not null, purpose public.consent_purpose not null, action public.consent_action not null,
  consent_version text not null, policy_version text not null, text_hash text not null check(length(text_hash)=64), locale text not null, presentation_surface text not null,
  parent_consent_id uuid references public.consent_records(id), request_id text not null, channel text not null, created_at timestamptz not null default now(),
  check (assessment_session_id is not null or organization_id is not null)
);
create index consent_records_subject_idx on public.consent_records(subject_kind,subject_id,purpose,created_at desc); create index consent_records_org_idx on public.consent_records(organization_id,created_at desc);

create table public.report_artifacts (
  id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), blueprint_id uuid not null references public.blueprints(id),
  report_version integer not null check(report_version>0), content_sha256 text, provenance_hash text not null check(length(provenance_hash)=64), object_path text,
  status text not null default 'pending' check(status in ('pending','completed','failed','deleted')), mime_type text not null default 'application/pdf', byte_length bigint check(byte_length is null or byte_length>=0),
  renderer_version text not null, template_version text not null, schema_version text not null, supersedes_report_id uuid references public.report_artifacts(id), created_at timestamptz not null default now(),
  unique(blueprint_id,report_version), check ((status='completed') = (content_sha256 is not null and object_path is not null))
);
create index report_artifacts_session_idx on public.report_artifacts(assessment_session_id,created_at desc); create unique index report_artifacts_object_path_idx on public.report_artifacts(object_path) where object_path is not null;

create table public.leads (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id), assessment_session_id uuid not null references public.assessment_sessions(id),
  blueprint_id uuid not null references public.blueprints(id), report_artifact_id uuid references public.report_artifacts(id), consent_contact_id uuid references public.consent_records(id),
  consent_report_id uuid references public.consent_records(id), idempotency_key text not null, request_hash text not null check(length(request_hash)=64), status text not null default 'new',
  contact_payload jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(assessment_session_id,idempotency_key)
);
create index leads_org_status_idx on public.leads(organization_id,status,created_at desc); create index leads_assessment_idx on public.leads(assessment_session_id);
create table public.lead_assignments (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade, sequence integer not null check(sequence>0),
  assignee_member_user_id uuid references auth.users(id), roster_key text, queue_key text, team_key text, reason text not null, algorithm_version text not null,
  created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(lead_id,sequence), check(num_nonnulls(assignee_member_user_id,roster_key,queue_key)=1)
);
create index lead_assignments_assignee_idx on public.lead_assignments(assignee_member_user_id,created_at desc) where assignee_member_user_id is not null;
create index lead_assignments_team_idx on public.lead_assignments(team_key,created_at desc) where team_key is not null;
create table public.lead_events (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade, sequence integer not null check(sequence>0), event_type text not null,
  actor_kind text not null, actor_id uuid, reason_code text, payload jsonb not null default '{}', correlation_id text not null, idempotency_key text not null,
  schema_version text not null, created_at timestamptz not null default now(), unique(lead_id,sequence), unique(lead_id,idempotency_key)
);
create index lead_events_lead_time_idx on public.lead_events(lead_id,created_at);
create table public.sales_roster_entries (id uuid primary key default gen_random_uuid(), stable_key text not null unique, display_label text not null, fictional_demo boolean not null default true, regions text[] not null default '{}', languages text[] not null default '{}', capability_tags text[] not null default '{}', active boolean not null default true, version integer not null default 1, created_at timestamptz not null default now());
create table public.sales_queues (id uuid primary key default gen_random_uuid(), stable_key text not null unique, display_label text not null, active boolean not null default true, version integer not null default 1, created_at timestamptz not null default now());
create table public.consultant_notes (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade, origin text not null check(origin in ('ai_draft','human')), status text not null check(status in ('draft','accepted','rejected','superseded')),
  body text not null, evidence_ids uuid[] not null default '{}', model_call_id uuid, author_user_id uuid references auth.users(id), supersedes_note_id uuid references public.consultant_notes(id), accepted_at timestamptz,
  schema_version text not null, created_at timestamptz not null default now(), check ((status='accepted') = (origin='human' and author_user_id is not null and accepted_at is not null))
);
create index consultant_notes_lead_idx on public.consultant_notes(lead_id,created_at desc);

create table public.advisor_runs (id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), blueprint_id uuid references public.blueprints(id), payload jsonb not null, schema_version text not null, model_version text, created_at timestamptz not null default now());
create index advisor_runs_session_idx on public.advisor_runs(assessment_session_id,created_at desc);
create table public.advisor_reviews (id uuid primary key default gen_random_uuid(), advisor_run_id uuid not null references public.advisor_runs(id) on delete cascade, payload jsonb not null, evidence_ids uuid[] not null default '{}', validation_status text not null, schema_version text not null, created_at timestamptz not null default now());
create index advisor_reviews_run_idx on public.advisor_reviews(advisor_run_id);
create table public.model_calls (id uuid primary key default gen_random_uuid(), assessment_session_id uuid references public.assessment_sessions(id), organization_id uuid references public.organizations(id), operation text not null, provider text not null, model text not null, schema_version text not null, prompt_version text not null, started_at timestamptz not null, completed_at timestamptz, latency_ms integer check(latency_ms is null or latency_ms>=0), input_tokens integer check(input_tokens is null or input_tokens>=0), output_tokens integer check(output_tokens is null or output_tokens>=0), estimated_cost numeric(14,6) check(estimated_cost is null or estimated_cost>=0), retry_count integer not null default 0 check(retry_count>=0), outcome text not null, safe_error_code text, evidence_ids uuid[] not null default '{}', created_at timestamptz not null default now(), check(assessment_session_id is not null or organization_id is not null));
create index model_calls_session_idx on public.model_calls(assessment_session_id,created_at desc); create index model_calls_org_time_idx on public.model_calls(organization_id,created_at desc);
create table public.chat_sessions (id uuid primary key default gen_random_uuid(), assessment_session_id uuid not null references public.assessment_sessions(id), business_twin_id uuid references public.business_twins(id), blueprint_id uuid references public.blueprints(id), schema_version text not null, created_at timestamptz not null default now());
create index chat_sessions_assessment_idx on public.chat_sessions(assessment_session_id,created_at desc);
create table public.chat_messages (id uuid primary key default gen_random_uuid(), chat_session_id uuid not null references public.chat_sessions(id) on delete cascade, sequence integer not null check(sequence>0), role text not null check(role in ('user','assistant','tool','system')), parts jsonb not null, tool_provenance jsonb, redacted_at timestamptz, schema_version text not null, created_at timestamptz not null default now(), unique(chat_session_id,sequence));
create index chat_messages_session_idx on public.chat_messages(chat_session_id,sequence);
create table public.workflow_outbox (id uuid primary key default gen_random_uuid(), aggregate_type text not null, aggregate_id uuid not null, event_type text not null, event_version text not null, idempotency_key text not null unique, correlation_id text not null, adapter_key text not null, destination_key text not null, state text not null check(state in ('pending','leased','retry_wait','completed','dead_letter')), priority smallint not null default 0, available_at timestamptz not null default now(), lease_owner text, lease_expires_at timestamptz, attempt_count integer not null default 0 check(attempt_count>=0), max_attempts integer not null default 8 check(max_attempts between 1 and 32), next_retry_at timestamptz, last_error_category text, payload jsonb, payload_schema_version text not null, payload_sha256 text not null check(length(payload_sha256)=64), created_at timestamptz not null default now(), completed_at timestamptz, expires_at timestamptz not null);
create index workflow_outbox_claim_idx on public.workflow_outbox(state,available_at,priority desc) where state in ('pending','retry_wait'); create index workflow_outbox_aggregate_idx on public.workflow_outbox(aggregate_type,aggregate_id);

create table public.retention_holds (id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id), assessment_session_id uuid references public.assessment_sessions(id), reason text not null, scope text not null, approved_by uuid not null references auth.users(id), review_at timestamptz not null, released_at timestamptz, created_at timestamptz not null default now(), check(review_at<=created_at+interval '90 days'), check(organization_id is not null or assessment_session_id is not null));
create index retention_holds_active_org_idx on public.retention_holds(organization_id,review_at) where released_at is null;
create table public.export_requests (id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id), requested_by uuid references auth.users(id), assessment_session_id uuid references public.assessment_sessions(id), status public.request_status not null default 'pending', retention_policy_version text not null, object_path text, expires_at timestamptz, downloaded_at timestamptz, request_id text not null unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(organization_id is not null or assessment_session_id is not null));
create index export_requests_requester_idx on public.export_requests(requested_by,created_at desc); create index export_requests_status_idx on public.export_requests(status,created_at);
create table public.deletion_requests (id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id), requested_by uuid references auth.users(id), assessment_session_id uuid references public.assessment_sessions(id), status public.request_status not null default 'pending', retention_policy_version text not null, safe_receipt text not null unique, blocked_reason text, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(organization_id is not null or assessment_session_id is not null));
create index deletion_requests_requester_idx on public.deletion_requests(requested_by,created_at desc); create index deletion_requests_status_idx on public.deletion_requests(status,created_at);

commit;
