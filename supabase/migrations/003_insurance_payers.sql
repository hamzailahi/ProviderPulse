-- Insurance payers, scoped by state.
--
-- Health plans are state-specific in three ways that a single hardcoded list
-- cannot express:
--   1. Medicaid is rebranded per state — TennCare (TN), ARKids First (AR),
--      MississippiCAN (MS), Vital (PR).
--   2. "Blue Cross Blue Shield" is a federation of independent state licensees.
--      BlueCross BlueShield of Tennessee is a different company from Arkansas
--      Blue Cross and Blue Shield.
--   3. Regional and marketplace-only plans exist in a handful of states.
--
-- Both patients and providers choose from THIS table, which is the point:
-- patient-match compares the patient's payer against the provider's list by
-- exact string, so both sides must draw from one vocabulary or the match
-- silently fails.
--
-- Run in the Supabase SQL editor.

create table if not exists public.insurance_payers (
  id         bigint generated always as identity primary key,
  name       text not null,
  -- null = national, offered in every state
  state      text,
  -- medicare | medicaid | commercial | marketplace | self_pay
  category   text not null default 'commercial',
  sort_order int  not null default 100,
  active     boolean not null default true,
  unique (name, state)
);

create index if not exists insurance_payers_state_idx on public.insurance_payers (state) where active;

alter table public.insurance_payers enable row level security;

-- Public reference data: anyone may read, nobody may write except the service role
-- (which bypasses RLS). Deliberately readable without a session, because the
-- provider signup form needs it before an account exists.
drop policy if exists "payers are public" on public.insurance_payers;
create policy "payers are public" on public.insurance_payers for select using (active);

-- ---------------------------------------------------------------- national ---
insert into public.insurance_payers (name, state, category, sort_order) values
  ('Medicare',                     null, 'medicare',   10),
  ('Medicare Advantage',           null, 'medicare',   11),
  ('TRICARE',                      null, 'commercial', 20),
  ('Veterans Affairs (VA)',        null, 'commercial', 21),
  ('UnitedHealthcare',             null, 'commercial', 30),
  ('Aetna',                        null, 'commercial', 31),
  ('Cigna',                        null, 'commercial', 32),
  ('Humana',                       null, 'commercial', 33),
  ('Molina Healthcare',            null, 'commercial', 34),
  ('Ambetter',                     null, 'marketplace',40),
  ('Oscar Health',                 null, 'marketplace',41),
  ('Uninsured / self-pay',         null, 'self_pay',   900),
  ('Other',                        null, 'commercial', 901)
on conflict (name, state) do nothing;

-- ------------------------------------------------------------------ states ---
-- Starting set for the states currently represented in the clinics table.
-- REVIEW AND EXTEND before launch: this is not an exhaustive market list, and
-- plan names change. Adding a row is all that is required — no code change.
insert into public.insurance_payers (name, state, category, sort_order) values
  -- Tennessee
  ('BlueCross BlueShield of Tennessee', 'TN', 'commercial', 50),
  ('TennCare',                          'TN', 'medicaid',   51),
  ('Wellpoint Tennessee',               'TN', 'medicaid',   52),
  ('UnitedHealthcare Community Plan',   'TN', 'medicaid',   53),
  -- Arkansas
  ('Arkansas Blue Cross and Blue Shield','AR','commercial', 50),
  ('Arkansas Medicaid',                 'AR', 'medicaid',   51),
  ('ARKids First',                      'AR', 'medicaid',   52),
  ('QualChoice',                        'AR', 'commercial', 53),
  -- Mississippi
  ('Blue Cross & Blue Shield of Mississippi','MS','commercial',50),
  ('Mississippi Medicaid',              'MS', 'medicaid',   51),
  ('MississippiCAN',                    'MS', 'medicaid',   52),
  ('Magnolia Health',                   'MS', 'medicaid',   53),
  -- Puerto Rico
  ('Triple-S Salud',                    'PR', 'commercial', 50),
  ('MCS (Medical Card System)',         'PR', 'commercial', 51),
  ('First Medical',                     'PR', 'commercial', 52),
  ('Vital (Plan de Salud del Gobierno)','PR', 'medicaid',   53),
  ('MMM Multi Health',                  'PR', 'medicare',   54)
on conflict (name, state) do nothing;
