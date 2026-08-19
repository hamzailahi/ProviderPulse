-- Appointment requests between a patient and a claimed provider, plus the
-- physician-facing briefing generated when one is booked.
--
-- Scheduling itself stays out of scope on purpose: provider_profiles already
-- has booking_mode/booking_url (migration 005) for a provider who wants real
-- calendar booking. This is the lighter "request an appointment through the
-- directory" path -- a time the patient wants, that the provider confirms or
-- declines -- which is what a briefing needs to attach to.
--
-- Run in the Supabase SQL editor.

create table if not exists public.appointment_requests (
  id                 uuid primary key default gen_random_uuid(),
  patient_id         uuid not null references auth.users(id) on delete cascade,
  provider_id        uuid not null references auth.users(id) on delete cascade,
  -- requested -> confirmed | declined -> completed, or requested -> cancelled
  status             text not null default 'requested',
  requested_time     timestamptz,
  reason             text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists appointment_requests_patient_idx  on public.appointment_requests (patient_id, created_at desc);
create index if not exists appointment_requests_provider_idx on public.appointment_requests (provider_id, created_at desc);

-- One structured briefing per appointment. Kept separate from
-- appointment_requests (not a column on it) because it is PHI derived from
-- patient_profiles and, when available, patient_document_facts -- narrower
-- data than the request row itself, so it gets its own, narrower RLS below
-- rather than inheriting the broader appointment-row visibility.
create table if not exists public.appointment_briefings (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointment_requests(id) on delete cascade,
  generated_at    timestamptz not null default now(),
  -- 'profile_only' | 'profile_and_documents' -- records what was actually
  -- available at generation time, since patient_document_facts may not exist
  -- yet (migration 002 is held back pending a Supabase BAA) or the patient
  -- may simply have approved nothing.
  source          text not null default 'profile_only',
  -- 'model' when Claude wrote the narrative, 'deterministic' when it fell
  -- back to the assembled-facts summary -- same distinction audit-narrate.js
  -- already makes, for the same reason: the model must never be the only
  -- path to a briefing existing.
  narrative_source text not null default 'deterministic',
  summary         jsonb not null,
  unique (appointment_id)
);
create index if not exists appointment_briefings_appointment_idx on public.appointment_briefings (appointment_id);

alter table public.appointment_requests  enable row level security;
alter table public.appointment_briefings enable row level security;

-- Both sides of the appointment can see it; only the patient can create one
-- (a provider does not book on a patient's behalf here); updates are allowed
-- from either side at the RLS layer because the function enforces WHICH
-- fields each side may change (patient: cancel only; provider: confirm/
-- decline/complete only) -- the same coarse-RLS-plus-field-whitelist split
-- profile.js already uses for PROVIDER_FIELDS/PATIENT_FIELDS.
create policy "appointment parties: select" on public.appointment_requests
  for select using (auth.uid() = patient_id or auth.uid() = provider_id);
create policy "appointment parties: insert" on public.appointment_requests
  for insert with check (auth.uid() = patient_id);
create policy "appointment parties: update" on public.appointment_requests
  for update using (auth.uid() = patient_id or auth.uid() = provider_id)
  with check (auth.uid() = patient_id or auth.uid() = provider_id);
-- No delete policy: cancellation is a status change, not a row removal --
-- the same audit-trail posture the rest of this schema takes with PHI-
-- adjacent records.

-- No insert/update/delete policy on briefings at all: like patient_profiles,
-- rows are written only by a function under the service role, after that
-- function has independently confirmed the caller is one of the two parties
-- on the appointment. Read access mirrors that same two-party check.
create policy "appointment parties: select briefing" on public.appointment_briefings
  for select using (
    exists (
      select 1 from public.appointment_requests ar
      where ar.id = appointment_id
        and (ar.patient_id = auth.uid() or ar.provider_id = auth.uid())
    )
  );
