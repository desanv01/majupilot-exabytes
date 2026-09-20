begin;

alter table public.chat_sessions
  add column organization_id uuid references public.organizations(id),
  add column guest_session_id uuid references public.guest_sessions(id),
  add column idempotency_key text,
  add column prompt_version text not null default 'phase-g-copilot-1.0.0',
  add column model_version text,
  add column status text not null default 'active' check (status in ('active','closed')),
  add column next_sequence integer not null default 1 check (next_sequence > 0),
  add column updated_at timestamptz not null default now();

update public.chat_sessions c
set organization_id = a.organization_id, guest_session_id = a.guest_session_id
from public.assessment_sessions a
where a.id = c.assessment_session_id;

alter table public.chat_sessions
  add constraint chat_sessions_one_owner check (num_nonnulls(organization_id, guest_session_id) = 1),
  add constraint chat_sessions_owner_assessment_unique unique (assessment_session_id, idempotency_key);

create index chat_sessions_org_idx on public.chat_sessions(organization_id, updated_at desc) where organization_id is not null;
create index chat_sessions_guest_idx on public.chat_sessions(guest_session_id, updated_at desc) where guest_session_id is not null;

alter table public.chat_messages
  add column turn_id uuid,
  add column message_type text not null default 'text' check (message_type in ('text','tool_call','tool_result','disclosure')),
  add column text_content text,
  add column tool_name text,
  add column tool_call_id text,
  add column model_call_id uuid references public.model_calls(id),
  add column execution_state text check (execution_state in ('live','deterministic_fallback','ai_disabled','failed')),
  add column content_sha256 text check (content_sha256 is null or length(content_sha256)=64),
  add constraint chat_messages_tool_shape check (
    (message_type in ('tool_call','tool_result') and tool_name is not null and tool_call_id is not null)
    or (message_type not in ('tool_call','tool_result') and tool_name is null and tool_call_id is null)
  );

update public.chat_messages set turn_id = id where turn_id is null;
alter table public.chat_messages alter column turn_id set not null;
create index chat_messages_turn_idx on public.chat_messages(chat_session_id,turn_id,sequence);

alter table public.model_calls
  add column chat_session_id uuid references public.chat_sessions(id),
  add column turn_id uuid,
  add column tool_names text[] not null default '{}',
  add column tool_call_count integer not null default 0 check(tool_call_count between 0 and 5),
  add column finish_reason text;
create index model_calls_chat_idx on public.model_calls(chat_session_id,created_at desc) where chat_session_id is not null;

create table public.copilot_tool_confirmations (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references public.chat_sessions(id) on delete restrict,
  turn_id uuid not null,
  tool_name text not null check (tool_name in ('recalculateScenario','collectMissingRoiInput','draftConsultantNote','acceptConsultantNote','generateBlueprintReport','requestConsultation')),
  arguments jsonb not null,
  arguments_sha256 text not null check(length(arguments_sha256)=64),
  proposal_idempotency_key text not null,
  execution_idempotency_key text,
  status text not null default 'pending' check(status in ('pending','executing','executed','expired','rejected','failed')),
  proposed_by_model_call_id uuid references public.model_calls(id),
  confirmed_by_user_id uuid references auth.users(id),
  confirmed_by_guest_session_id uuid references public.guest_sessions(id),
  result jsonb,
  safe_error_code text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  executed_at timestamptz,
  unique(chat_session_id,proposal_idempotency_key),
  unique(chat_session_id,execution_idempotency_key),
  check (expires_at <= created_at + interval '30 minutes')
);
create index copilot_confirmations_session_idx on public.copilot_tool_confirmations(chat_session_id,created_at desc);
alter table public.copilot_tool_confirmations enable row level security;

create table public.copilot_tool_audit_events (
  id uuid primary key default gen_random_uuid(),
  confirmation_id uuid not null references public.copilot_tool_confirmations(id) on delete restrict,
  chat_session_id uuid not null references public.chat_sessions(id) on delete restrict,
  sequence integer not null check(sequence > 0),
  event_type text not null check(event_type in ('proposed','confirmed','executed','rejected','expired','failed')),
  actor_kind text not null check(actor_kind in ('model','guest','user','system')),
  actor_id uuid,
  safe_payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(confirmation_id,sequence)
);
create index copilot_tool_audit_session_idx on public.copilot_tool_audit_events(chat_session_id,created_at);
alter table public.copilot_tool_audit_events enable row level security;

create table public.copilot_turn_receipts (
  id uuid primary key default gen_random_uuid(),
  chat_session_id uuid not null references public.chat_sessions(id) on delete restrict,
  idempotency_key text not null,
  turn_id uuid not null,
  response jsonb not null,
  response_sha256 text not null check(length(response_sha256)=64),
  created_at timestamptz not null default now(),
  unique(chat_session_id,idempotency_key)
);
alter table public.copilot_turn_receipts enable row level security;

create or replace function app_private.reject_copilot_mutation() returns trigger language plpgsql set search_path='' as $$
begin
  raise exception 'IMMUTABLE_COPILOT_RECORD' using errcode='42501';
end $$;

create trigger chat_messages_immutable before update or delete on public.chat_messages for each row execute function app_private.reject_copilot_mutation();
create trigger copilot_tool_audit_immutable before update or delete on public.copilot_tool_audit_events for each row execute function app_private.reject_copilot_mutation();
create trigger copilot_turn_receipts_immutable before update or delete on public.copilot_turn_receipts for each row execute function app_private.reject_copilot_mutation();

create or replace function public.append_copilot_message(
  p_chat_session_id uuid,
  p_message_id uuid,
  p_turn_id uuid,
  p_role text,
  p_message_type text,
  p_text_content text,
  p_tool_name text,
  p_tool_call_id text,
  p_parts jsonb,
  p_tool_provenance jsonb,
  p_model_call_id uuid,
  p_execution_state text,
  p_content_sha256 text,
  p_schema_version text
) returns table(message_id uuid, message_sequence integer)
language plpgsql security invoker set search_path='' as $$
declare v_sequence integer;
begin
  update public.chat_sessions
  set next_sequence=next_sequence+1, updated_at=now()
  where id=p_chat_session_id and status='active'
  returning next_sequence-1 into v_sequence;
  if v_sequence is null then raise exception 'CHAT_NOT_FOUND' using errcode='P0001'; end if;
  insert into public.chat_messages(id,chat_session_id,sequence,turn_id,role,message_type,text_content,tool_name,tool_call_id,parts,tool_provenance,model_call_id,execution_state,content_sha256,schema_version)
  values(p_message_id,p_chat_session_id,v_sequence,p_turn_id,p_role,p_message_type,p_text_content,p_tool_name,p_tool_call_id,p_parts,p_tool_provenance,p_model_call_id,p_execution_state,p_content_sha256,p_schema_version);
  return query select p_message_id,v_sequence;
end $$;

revoke all on public.chat_sessions, public.chat_messages, public.copilot_tool_confirmations, public.copilot_tool_audit_events, public.copilot_turn_receipts from anon, authenticated;
grant select,insert,update on public.chat_sessions to service_role;
grant select,insert on public.chat_messages to service_role;
grant select,insert,update on public.copilot_tool_confirmations to service_role;
grant select,insert on public.copilot_tool_audit_events, public.copilot_turn_receipts to service_role;
revoke all on function public.append_copilot_message(uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.append_copilot_message(uuid,uuid,uuid,text,text,text,text,text,jsonb,jsonb,uuid,text,text,text) to service_role;

commit;
