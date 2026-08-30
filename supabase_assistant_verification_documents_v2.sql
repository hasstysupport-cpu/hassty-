-- Phase 2: secure Assistant verification document workflow

create table if not exists public.assistant_verification_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.assistant_verification_requests(id) on delete cascade,
  assistant_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('id_card','qualification','additional')),
  storage_path text not null,
  original_file_name text,
  mime_type text,
  file_size bigint,
  review_status text not null default 'pending' check (review_status in ('pending','accepted','rejected','reupload_requested')),
  review_note text,
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_avd_request_id on public.assistant_verification_documents(request_id);
create index if not exists idx_avd_assistant_id on public.assistant_verification_documents(assistant_id);
create index if not exists idx_avd_type_status on public.assistant_verification_documents(document_type, review_status);

alter table public.assistant_verification_documents enable row level security;

drop policy if exists avd_assistant_select on public.assistant_verification_documents;
drop policy if exists avd_assistant_insert on public.assistant_verification_documents;
drop policy if exists avd_assistant_update on public.assistant_verification_documents;
drop policy if exists avd_admin_select on public.assistant_verification_documents;
drop policy if exists avd_admin_update on public.assistant_verification_documents;

create policy avd_assistant_select on public.assistant_verification_documents
  for select to authenticated using (assistant_id = (select auth.uid()));
create policy avd_assistant_insert on public.assistant_verification_documents
  for insert to authenticated with check (
    assistant_id = (select auth.uid()) and exists (
      select 1 from public.assistant_verification_requests r
      where r.id = assistant_verification_documents.request_id and r.assistant_id = (select auth.uid())
    )
  );
create policy avd_assistant_update on public.assistant_verification_documents
  for update to authenticated
  using (assistant_id = (select auth.uid()))
  with check (assistant_id = (select auth.uid()));
create policy avd_admin_select on public.assistant_verification_documents
  for select to authenticated using (private.is_admin_strict());
create policy avd_admin_update on public.assistant_verification_documents
  for update to authenticated using (private.is_admin_strict()) with check (private.is_admin_strict());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assistant-verification','assistant-verification',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']::text[])
on conflict (id) do update
set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists assistant_verification_upload on storage.objects;
drop policy if exists assistant_verification_read on storage.objects;
drop policy if exists assistant_verification_delete on storage.objects;

create policy assistant_verification_upload on storage.objects
for insert to authenticated with check (
  bucket_id = 'assistant-verification'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'assistant')
);

create policy assistant_verification_read on storage.objects
for select to authenticated using (
  bucket_id = 'assistant-verification'
  and (owner_id = (select auth.uid()::text) or private.is_admin_strict())
);

create policy assistant_verification_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'assistant-verification' and owner_id = (select auth.uid()::text)
);

alter table public.assistant_verification_requests
  add column if not exists documents_submitted_at timestamptz;
alter table public.assistant_verification_requests
  add column if not exists id_card_review_status text;
alter table public.assistant_verification_requests
  add column if not exists qualification_review_status text;
alter table public.assistant_verification_requests
  add column if not exists last_admin_note_at timestamptz;

create or replace function public.set_assistant_verification_document_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_assistant_verification_document_updated_at on public.assistant_verification_documents;
create trigger trg_assistant_verification_document_updated_at
before update on public.assistant_verification_documents
for each row execute function public.set_assistant_verification_document_updated_at();

create or replace function public.guard_assistant_verification_approval()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status = 'approved' then
    if coalesce(new.id_card_review_status, '') <> 'accepted'
       or coalesce(new.qualification_review_status, '') <> 'accepted' then
      raise exception 'Assistant verification cannot be approved before identity and qualification documents are accepted';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_assistant_verification_approval on public.assistant_verification_requests;
create trigger trg_guard_assistant_verification_approval
before update on public.assistant_verification_requests
for each row execute function public.guard_assistant_verification_approval();

alter table public.assistant_verification_requests
  drop constraint if exists assistant_verification_requests_status_check;
alter table public.assistant_verification_requests
  add constraint assistant_verification_requests_status_check
  check (status in ('pending','documents_requested','under_review','approved','rejected'));
