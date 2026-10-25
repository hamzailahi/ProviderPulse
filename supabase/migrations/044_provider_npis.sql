-- 044: one account, many NPIs (2026-10-25, the user's choices: an NPI whose
-- registry name matches the account is verified at once, anything else waits
-- for review; each NPI keeps its own listing details; organizations and
-- clinicians alike).
--
-- NPPES issues an NPI per location, so a practice with three offices, a
-- pharmacy chain or a group with several doctors holds several NPIs. The
-- account's own NPI stays in provider_profiles (id = the auth user). Each
-- further NPI is a row here: its own listing (hours, insurance, availability),
-- owned by the account, published by providers-public only once
-- review_status is 'clear'.
--
-- Access: RLS on; the owner may read their rows; nothing else. Every write
-- goes through provider-npis.js under the service role after it has checked
-- the caller owns the row and whitelisted the fields, so a provider can never
-- set npi, review_status or account_id themselves (the lesson of 043).
-- Safe to re-run.

create table if not exists public.provider_npis (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  npi character(10) not null unique check (npi ~ '^[0-9]{10}$'),
  entity_type smallint check (entity_type in (1, 2)),
  first_name text,
  last_name text,
  org_name text,
  phone text,
  address_line text,
  city text,
  state character(2),
  zip text,
  taxonomy_code text,
  taxonomy_desc text,
  accepting_new_patients boolean,
  telehealth boolean,
  bio text,
  office_hours jsonb,
  appointment_minutes integer,
  booking_mode text default 'phone',
  booking_url text,
  hours_note text,
  review_status text not null default 'pending' check (review_status in ('clear', 'pending', 'blocked')),
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists provider_npis_account_idx on public.provider_npis (account_id);
drop trigger if exists trg_provider_npis_touch on public.provider_npis;
create trigger trg_provider_npis_touch before update on public.provider_npis
  for each row execute function public.touch_updated_at();

create table if not exists public.provider_npi_insurance (
  id bigint generated always as identity primary key,
  npi_id uuid not null references public.provider_npis(id) on delete cascade,
  payer_name text not null,
  plan_type text,
  unique (npi_id, payer_name, plan_type)
);

alter table public.provider_npis enable row level security;
alter table public.provider_npi_insurance enable row level security;
revoke all on public.provider_npis, public.provider_npi_insurance from anon, authenticated;
grant select on public.provider_npis, public.provider_npi_insurance to authenticated;
-- Explicit rather than left to Supabase's default privileges; 041's
-- listing_reports relied on those, so it is stated here too.
grant all on public.provider_npis, public.provider_npi_insurance to service_role;
grant all on public.listing_reports to service_role;
drop policy if exists "own npis select" on public.provider_npis;
create policy "own npis select" on public.provider_npis for select using (account_id = auth.uid());
drop policy if exists "own npi insurance select" on public.provider_npi_insurance;
create policy "own npi insurance select" on public.provider_npi_insurance for select
  using (exists (select 1 from public.provider_npis n where n.id = npi_id and n.account_id = auth.uid()));

-- One NPI, one owner, across both tables: an NPI registered as an account
-- cannot be added to another account, and an added NPI cannot be registered.
create or replace function public.npi_claimed_once() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'provider_profiles' then
    if exists (select 1 from public.provider_npis where npi = new.npi) then
      raise exception 'NPI % is already part of another account', new.npi using errcode = '23505';
    end if;
  else
    if exists (select 1 from public.provider_profiles where npi = new.npi) then
      raise exception 'NPI % is already registered as an account', new.npi using errcode = '23505';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_npi_claimed_once on public.provider_profiles;
create trigger trg_npi_claimed_once before insert or update of npi on public.provider_profiles
  for each row execute function public.npi_claimed_once();
drop trigger if exists trg_npi_claimed_once on public.provider_npis;
create trigger trg_npi_claimed_once before insert or update of npi on public.provider_npis
  for each row execute function public.npi_claimed_once();

-- Which of the account's listings a patient booked (null: the account's own NPI,
-- as every request before this migration). Patients may set it on insert.
alter table public.appointment_requests add column if not exists npi text;
grant insert (patient_id, provider_id, requested_time, reason, npi) on public.appointment_requests to authenticated;

-- A request's npi must be one of that provider account's listings. The check
-- reads both listing tables, which RLS hides from the patient, so the lookup
-- is a definer function that answers only yes or no.
create or replace function public.npi_belongs_to(p_npi text, p_account uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.provider_profiles where id = p_account and npi = p_npi)
      or exists (select 1 from public.provider_npis where account_id = p_account and npi = p_npi)
$$;
revoke all on function public.npi_belongs_to(text, uuid) from public;
grant execute on function public.npi_belongs_to(text, uuid) to authenticated, service_role;

create or replace function public.appointment_npi_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and new.npi is not null
     and not public.npi_belongs_to(new.npi, new.provider_id) then
    raise exception 'That NPI is not one of this provider''s listings' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_appointment_npi_guard on public.appointment_requests;
create trigger trg_appointment_npi_guard before insert on public.appointment_requests
  for each row execute function public.appointment_npi_guard();
