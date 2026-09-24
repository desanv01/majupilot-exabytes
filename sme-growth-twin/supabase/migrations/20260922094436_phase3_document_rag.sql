begin;

create extension if not exists vector with schema extensions;

create table public.evidence_documents (
  id uuid primary key default gen_random_uuid(),
  assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  guest_session_id uuid references public.guest_sessions(id),
  original_filename text not null check (char_length(original_filename) between 1 and 240),
  storage_path text unique,
  mime_type text not null check (char_length(mime_type) between 1 and 160),
  byte_length bigint not null check (byte_length between 0 and 4194304),
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null check (status in ('processing','ready','failed','unsupported','duplicate','deleted')),
  failure_code text check (failure_code is null or char_length(failure_code) between 1 and 80),
  duplicate_of_document_id uuid references public.evidence_documents(id),
  page_count integer check (page_count is null or page_count between 0 and 40),
  extracted_char_count integer check (extracted_char_count is null or extracted_char_count between 0 and 120000),
  chunk_count integer not null default 0 check (chunk_count between 0 and 80),
  schema_version text not null default 'phase3-document-rag-1.0.0' check (schema_version = 'phase3-document-rag-1.0.0'),
  embedding_version text not null default 'openai-text-embedding-3-small-1536-v1' check (embedding_version = 'openai-text-embedding-3-small-1536-v1'),
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz,
  failed_at timestamptz,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  check (num_nonnulls(organization_id, guest_session_id) = 1),
  check ((status = 'deleted') = (deleted_at is not null)),
  check ((status = 'duplicate') = (duplicate_of_document_id is not null)),
  check (status in ('failed','unsupported','deleted') or mime_type in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain')),
  check (status <> 'ready' or (storage_path is not null and processed_at is not null and chunk_count > 0))
);

create unique index evidence_documents_active_checksum_idx
  on public.evidence_documents(assessment_session_id, checksum_sha256)
  where status in ('processing','ready');
create index evidence_documents_assessment_created_idx
  on public.evidence_documents(assessment_session_id, created_at desc);
create index evidence_documents_org_idx
  on public.evidence_documents(organization_id, created_at desc)
  where organization_id is not null;
create index evidence_documents_guest_idx
  on public.evidence_documents(guest_session_id, created_at desc)
  where guest_session_id is not null;

create table public.evidence_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.evidence_documents(id) on delete cascade,
  assessment_session_id uuid not null references public.assessment_sessions(id) on delete cascade,
  chunk_index integer not null check (chunk_index between 0 and 79),
  page_number integer check (page_number is null or page_number between 1 and 40),
  section_ref text not null check (char_length(section_ref) between 1 and 120),
  content text not null check (char_length(content) between 1 and 1400),
  char_count integer not null check (char_count between 1 and 1400),
  embedding extensions.vector(1536) not null,
  schema_version text not null default 'phase3-document-rag-1.0.0' check (schema_version = 'phase3-document-rag-1.0.0'),
  embedding_version text not null default 'openai-text-embedding-3-small-1536-v1' check (embedding_version = 'openai-text-embedding-3-small-1536-v1'),
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index evidence_document_chunks_assessment_idx
  on public.evidence_document_chunks(assessment_session_id, document_id, chunk_index);
create index evidence_document_chunks_embedding_hnsw_idx
  on public.evidence_document_chunks using hnsw (embedding extensions.vector_cosine_ops);

alter table public.evidence_documents enable row level security;
alter table public.evidence_documents force row level security;
alter table public.evidence_document_chunks enable row level security;
alter table public.evidence_document_chunks force row level security;

revoke all on public.evidence_documents, public.evidence_document_chunks from public, anon, authenticated;
grant select, insert, update, delete on public.evidence_documents, public.evidence_document_chunks to service_role;
grant select on public.evidence_documents, public.evidence_document_chunks to authenticated;

create policy evidence_documents_member_select on public.evidence_documents
for select to authenticated using (
  organization_id is not null
  and app_private.is_active_member(organization_id, null)
  and app_private.can_access_assessment(assessment_session_id)
);

create policy evidence_document_chunks_member_select on public.evidence_document_chunks
for select to authenticated using (
  exists (
    select 1 from public.evidence_documents d
    where d.id = document_id
      and d.assessment_session_id = evidence_document_chunks.assessment_session_id
      and d.status = 'ready'
      and d.deleted_at is null
      and d.organization_id is not null
      and app_private.is_active_member(d.organization_id, null)
      and app_private.can_access_assessment(d.assessment_session_id)
  )
);

create or replace function public.search_evidence_document_chunks(
  p_assessment_session_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_threshold double precision default 0.62,
  p_match_count integer default 5
) returns table (
  chunk_id uuid,
  document_id uuid,
  document_name text,
  page_number integer,
  section_ref text,
  content text,
  similarity double precision
)
language plpgsql security invoker set search_path = '' as $$
begin
  if p_match_count < 1 or p_match_count > 8 then
    raise exception 'INVALID_MATCH_COUNT' using errcode = '22023';
  end if;
  if p_match_threshold < 0.40 or p_match_threshold > 0.95 then
    raise exception 'INVALID_MATCH_THRESHOLD' using errcode = '22023';
  end if;
  return query
  select c.id, d.id, d.original_filename, c.page_number, c.section_ref, c.content,
         (1 - (c.embedding OPERATOR(extensions.<=>) p_query_embedding))::double precision
  from public.evidence_document_chunks c
  join public.evidence_documents d on d.id = c.document_id
  where c.assessment_session_id = p_assessment_session_id
    and d.assessment_session_id = p_assessment_session_id
    and d.status = 'ready'
    and d.deleted_at is null
    and 1 - (c.embedding OPERATOR(extensions.<=>) p_query_embedding) >= p_match_threshold
  order by c.embedding OPERATOR(extensions.<=>) p_query_embedding, c.chunk_index
  limit p_match_count;
end $$;

revoke all on function public.search_evidence_document_chunks(uuid, extensions.vector, double precision, integer) from public, anon, authenticated;
grant execute on function public.search_evidence_document_chunks(uuid, extensions.vector, double precision, integer) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'majupilot-evidence',
  'majupilot-evidence',
  false,
  4194304,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain']
)
on conflict(id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Intentionally no anon/authenticated storage.objects policies. Every object
-- operation uses the server-only service role after application authorization;
-- downloads are exposed only as 60-second signed URLs.

commit;
