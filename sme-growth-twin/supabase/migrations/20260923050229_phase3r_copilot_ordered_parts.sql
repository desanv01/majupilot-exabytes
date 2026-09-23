begin;

alter table public.chat_messages
  add constraint chat_messages_parts_bounded_array check (
    jsonb_typeof(parts) = 'array'
    and jsonb_array_length(parts) <= 24
    and octet_length(parts::text) <= 24000
  ) not valid;

-- NOT VALID preserves readability of immutable conversations created by prior
-- accepted phases while enforcing the bound for every newly inserted message.

alter table public.chat_sessions
  alter column prompt_version set default 'phase3r-general-copilot-2.0.0';

-- Existing service-role-only grants, ownership authorization, immutable message
-- trigger, and RLS posture remain unchanged. This migration creates no exposed
-- table, view, function, policy, or public privilege.

commit;
