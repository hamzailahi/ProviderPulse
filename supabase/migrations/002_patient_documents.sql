-- Patient document uploads (lab reports, discharge summaries, referrals).
--
-- ⚠️  DO NOT RUN THIS IN PRODUCTION until BAAs are in place with BOTH:
--       1. Supabase  (Team plan or above)
--       2. Anthropic (on the API account used by doc-extract.js)
--     Uploaded reports are the most sensitive PHI this system will ever hold.
--     The application code is gated behind DOCUMENT_UPLOAD_ENABLED=false so it
--     stays dark until then; this migration is safe to run in a dev project.
--
-- Run in the Supabase SQL editor.

-- ---------------------------------------------------------------- storage ---
-- Private bucket. Objects are never publicly readable; the app hands out
-- short-lived signed URLs instead.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-docs', 'patient-docs', false, 15728640,  -- 15 MB
  -- No HEIC: the vision API cannot read it, and iOS converts to JPEG on upload.
  array['application/pdf','image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects are stored at  <auth.uid()>/<document_id>.<ext>  so the first path
-- segment is the owner. Every policy below keys off that.
create policy "own docs: read" on storage.objects for select
  using (bucket_id = 'patient-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own docs: insert" on storage.objects for insert
  with check (bucket_id = 'patient-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own docs: delete" on storage.objects for delete
  using (bucket_id = 'patient-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------- tables ---
create table if not exists public.patient_documents (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  filename     text,
  mime_type    text,
  size_bytes   bigint,
  -- uploaded -> extracting -> extracted | failed
  status       text not null default 'uploaded',
  error        text,
  uploaded_at  timestamptz not null default now(),
  extracted_at timestamptz
);
create index if not exists patient_documents_patient_idx on public.patient_documents (patient_id, uploaded_at desc);

-- Extracted facts are kept SEPARATE from patient_profiles on purpose: nothing
-- reaches the patient's actual record until they review and approve it, and every
-- fact keeps a pointer back to the document and the verbatim source text so any
-- claim can be traced. `source_text` must be quoted from the document, never
-- paraphrased or inferred.
create table if not exists public.patient_document_facts (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.patient_documents(id) on delete cascade,
  patient_id   uuid not null references auth.users(id) on delete cascade,
  -- condition | referral | medication | allergy | provider | date
  fact_type    text not null,
  value        text not null,
  source_text  text,
  -- pending -> accepted | rejected   (patient decides; nothing auto-applies)
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);
create index if not exists patient_document_facts_doc_idx on public.patient_document_facts (document_id);
create index if not exists patient_document_facts_patient_idx on public.patient_document_facts (patient_id, status);

-- -------------------------------------------------------------------- RLS ---
alter table public.patient_documents      enable row level security;
alter table public.patient_document_facts enable row level security;

-- Self-only, matching the patient_profiles model. No insert policy: rows are
-- created by functions under the service role, exactly as profile rows are.
create policy "own documents: select" on public.patient_documents
  for select using (auth.uid() = patient_id);
create policy "own documents: delete" on public.patient_documents
  for delete using (auth.uid() = patient_id);

create policy "own facts: select" on public.patient_document_facts
  for select using (auth.uid() = patient_id);
create policy "own facts: update" on public.patient_document_facts
  for update using (auth.uid() = patient_id) with check (auth.uid() = patient_id);
create policy "own facts: delete" on public.patient_document_facts
  for delete using (auth.uid() = patient_id);
