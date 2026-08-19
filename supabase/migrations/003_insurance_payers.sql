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

-- 'Medicare' and 'Medicare Advantage' below stay as the generic "I don't
-- know my specific carrier" fallback. Named MA carrier brands per state
-- (Aetna Medicare, Humana, BlueCare Plus Tennessee, ...) are populated
-- separately and automatically by scripts/import-medicare-advantage-payers.mjs,
-- sourced from CMS's own contract enrollment + directory data rather than
-- hand-typed here -- do not hand-add individual MA carrier rows to this file,
-- that importer will just re-add them on its next monthly run anyway.
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
-- All 50 states, DC and Puerto Rico. For each: the Blue Cross licensee (these
-- are independent companies per state, not one national insurer) and the state's
-- Medicaid program under its own brand, plus notable regional plans for the
-- larger markets.
--
-- ⚠️ REVIEW BEFORE LAUNCH. Plan names, Medicaid brands and Blue Cross licensees
-- all change over time, and this is a strong starting set rather than a verified
-- market census. Patients and providers can always type a plan not listed here
-- via "Other", so a gap degrades gracefully — but a WRONG name looks worse than
-- a missing one. Verify against your own market data as you expand.
--
-- Adding a plan needs no code change:
--   insert into public.insurance_payers (name, state, category, sort_order)
--   values ('Some Regional Plan', 'TN', 'commercial', 65);

insert into public.insurance_payers (name, state, category, sort_order) values
  -- AK
  ('Premera Blue Cross Blue Shield of Alaska', 'AK', 'commercial', 50),
  ('Alaska Medicaid', 'AK', 'medicaid', 51),
  -- AL
  ('Blue Cross and Blue Shield of Alabama', 'AL', 'commercial', 50),
  ('Alabama Medicaid', 'AL', 'medicaid', 51),
  ('VIVA Health', 'AL', 'commercial', 60),
  -- AR
  ('Arkansas Blue Cross and Blue Shield', 'AR', 'commercial', 50),
  ('Arkansas Medicaid', 'AR', 'medicaid', 51),
  ('ARKids First', 'AR', 'commercial', 60),
  ('QualChoice', 'AR', 'commercial', 61),
  -- AZ
  ('Blue Cross Blue Shield of Arizona', 'AZ', 'commercial', 50),
  ('AHCCCS', 'AZ', 'medicaid', 51),
  ('Banner Health Plans', 'AZ', 'commercial', 60),
  ('Mercy Care', 'AZ', 'commercial', 61),
  -- CA
  ('Anthem Blue Cross', 'CA', 'commercial', 50),
  ('Medi-Cal', 'CA', 'medicaid', 51),
  ('Blue Shield of California', 'CA', 'commercial', 60),
  ('Health Net', 'CA', 'commercial', 61),
  ('L.A. Care Health Plan', 'CA', 'commercial', 62),
  ('Inland Empire Health Plan', 'CA', 'commercial', 63),
  -- CO
  ('Anthem Blue Cross Blue Shield', 'CO', 'commercial', 50),
  ('Health First Colorado', 'CO', 'medicaid', 51),
  ('Rocky Mountain Health Plans', 'CO', 'commercial', 60),
  -- CT
  ('Anthem Blue Cross Blue Shield', 'CT', 'commercial', 50),
  ('HUSKY Health', 'CT', 'medicaid', 51),
  ('ConnectiCare', 'CT', 'commercial', 60),
  -- DC
  ('CareFirst BlueCross BlueShield', 'DC', 'commercial', 50),
  ('DC Medicaid', 'DC', 'medicaid', 51),
  ('AmeriHealth Caritas DC', 'DC', 'commercial', 60),
  -- DE
  ('Highmark Blue Cross Blue Shield Delaware', 'DE', 'commercial', 50),
  ('Delaware Medicaid', 'DE', 'medicaid', 51),
  ('Diamond State Health Plan', 'DE', 'commercial', 60),
  -- FL
  ('Florida Blue', 'FL', 'commercial', 50),
  ('Florida Medicaid', 'FL', 'medicaid', 51),
  ('Sunshine Health', 'FL', 'commercial', 60),
  ('Simply Healthcare', 'FL', 'commercial', 61),
  ('AvMed', 'FL', 'commercial', 62),
  -- GA
  ('Anthem Blue Cross Blue Shield of Georgia', 'GA', 'commercial', 50),
  ('Georgia Medicaid', 'GA', 'medicaid', 51),
  ('Peach State Health Plan', 'GA', 'commercial', 60),
  ('CareSource Georgia', 'GA', 'commercial', 61),
  -- HI
  ('Hawaii Medical Service Association (HMSA)', 'HI', 'commercial', 50),
  ('Med-QUEST', 'HI', 'medicaid', 51),
  ('Kaiser Permanente Hawaii', 'HI', 'commercial', 60),
  ('''Ohana Health Plan', 'HI', 'commercial', 61),
  -- IA
  ('Wellmark Blue Cross and Blue Shield', 'IA', 'commercial', 50),
  ('Iowa Medicaid', 'IA', 'medicaid', 51),
  ('IA Health Link', 'IA', 'commercial', 60),
  ('Amerigroup Iowa', 'IA', 'commercial', 61),
  -- ID
  ('Blue Cross of Idaho', 'ID', 'commercial', 50),
  ('Idaho Medicaid', 'ID', 'medicaid', 51),
  ('Regence BlueShield of Idaho', 'ID', 'commercial', 60),
  ('PacificSource', 'ID', 'commercial', 61),
  -- IL
  ('Blue Cross and Blue Shield of Illinois', 'IL', 'commercial', 50),
  ('Illinois Medicaid', 'IL', 'medicaid', 51),
  ('HealthChoice Illinois', 'IL', 'commercial', 60),
  ('Meridian Health Plan', 'IL', 'commercial', 61),
  -- IN
  ('Anthem Blue Cross Blue Shield', 'IN', 'commercial', 50),
  ('Indiana Medicaid', 'IN', 'medicaid', 51),
  ('Healthy Indiana Plan (HIP)', 'IN', 'commercial', 60),
  ('CareSource Indiana', 'IN', 'commercial', 61),
  ('MDwise', 'IN', 'commercial', 62),
  -- KS
  ('Blue Cross and Blue Shield of Kansas', 'KS', 'commercial', 50),
  ('KanCare', 'KS', 'medicaid', 51),
  ('Sunflower Health Plan', 'KS', 'commercial', 60),
  -- KY
  ('Anthem Blue Cross Blue Shield', 'KY', 'commercial', 50),
  ('Kentucky Medicaid', 'KY', 'medicaid', 51),
  ('Passport Health Plan', 'KY', 'commercial', 60),
  ('WellCare of Kentucky', 'KY', 'commercial', 61),
  -- LA
  ('Blue Cross and Blue Shield of Louisiana', 'LA', 'commercial', 50),
  ('Louisiana Medicaid', 'LA', 'medicaid', 51),
  ('Healthy Louisiana', 'LA', 'commercial', 60),
  ('Amerihealth Caritas Louisiana', 'LA', 'commercial', 61),
  -- MA
  ('Blue Cross Blue Shield of Massachusetts', 'MA', 'commercial', 50),
  ('MassHealth', 'MA', 'medicaid', 51),
  ('Tufts Health Plan', 'MA', 'commercial', 60),
  ('Harvard Pilgrim Health Care', 'MA', 'commercial', 61),
  ('Mass General Brigham Health Plan', 'MA', 'commercial', 62),
  -- MD
  ('CareFirst BlueCross BlueShield', 'MD', 'commercial', 50),
  ('Maryland Medicaid', 'MD', 'medicaid', 51),
  ('HealthChoice', 'MD', 'commercial', 60),
  ('Priority Partners', 'MD', 'commercial', 61),
  ('Johns Hopkins Health Plans', 'MD', 'commercial', 62),
  -- ME
  ('Anthem Blue Cross Blue Shield', 'ME', 'commercial', 50),
  ('MaineCare', 'ME', 'medicaid', 51),
  ('Community Health Options', 'ME', 'commercial', 60),
  -- MI
  ('Blue Cross Blue Shield of Michigan', 'MI', 'commercial', 50),
  ('Michigan Medicaid', 'MI', 'medicaid', 51),
  ('Healthy Michigan Plan', 'MI', 'commercial', 60),
  ('Priority Health', 'MI', 'commercial', 61),
  ('McLaren Health Plan', 'MI', 'commercial', 62),
  -- MN
  ('Blue Cross and Blue Shield of Minnesota', 'MN', 'commercial', 50),
  ('Minnesota Medical Assistance', 'MN', 'medicaid', 51),
  ('MinnesotaCare', 'MN', 'commercial', 60),
  ('HealthPartners', 'MN', 'commercial', 61),
  ('UCare', 'MN', 'commercial', 62),
  ('Medica', 'MN', 'commercial', 63),
  -- MO
  ('Anthem Blue Cross Blue Shield', 'MO', 'commercial', 50),
  ('MO HealthNet', 'MO', 'medicaid', 51),
  ('Home State Health', 'MO', 'commercial', 60),
  ('Healthy Blue Missouri', 'MO', 'commercial', 61),
  -- MS
  ('Blue Cross & Blue Shield of Mississippi', 'MS', 'commercial', 50),
  ('Mississippi Medicaid', 'MS', 'medicaid', 51),
  ('MississippiCAN', 'MS', 'commercial', 60),
  ('Magnolia Health', 'MS', 'commercial', 61),
  -- MT
  ('Blue Cross and Blue Shield of Montana', 'MT', 'commercial', 50),
  ('Montana Medicaid', 'MT', 'medicaid', 51),
  ('Healthy Montana Kids', 'MT', 'commercial', 60),
  ('PacificSource Montana', 'MT', 'commercial', 61),
  -- NC
  ('Blue Cross and Blue Shield of North Carolina', 'NC', 'commercial', 50),
  ('NC Medicaid', 'NC', 'medicaid', 51),
  ('Healthy Blue North Carolina', 'NC', 'commercial', 60),
  ('WellCare of North Carolina', 'NC', 'commercial', 61),
  -- ND
  ('Blue Cross Blue Shield of North Dakota', 'ND', 'commercial', 50),
  ('North Dakota Medicaid', 'ND', 'medicaid', 51),
  ('Sanford Health Plan', 'ND', 'commercial', 60),
  -- NE
  ('Blue Cross and Blue Shield of Nebraska', 'NE', 'commercial', 50),
  ('Heritage Health', 'NE', 'medicaid', 51),
  ('Nebraska Total Care', 'NE', 'commercial', 60),
  -- NH
  ('Anthem Blue Cross Blue Shield', 'NH', 'commercial', 50),
  ('New Hampshire Medicaid', 'NH', 'medicaid', 51),
  ('Granite Advantage', 'NH', 'commercial', 60),
  ('WellSense Health Plan', 'NH', 'commercial', 61),
  -- NJ
  ('Horizon Blue Cross Blue Shield of New Jersey', 'NJ', 'commercial', 50),
  ('NJ FamilyCare', 'NJ', 'medicaid', 51),
  ('AmeriHealth New Jersey', 'NJ', 'commercial', 60),
  ('WellCare New Jersey', 'NJ', 'commercial', 61),
  -- NM
  ('Blue Cross and Blue Shield of New Mexico', 'NM', 'commercial', 50),
  ('Centennial Care', 'NM', 'medicaid', 51),
  ('Presbyterian Health Plan', 'NM', 'commercial', 60),
  ('Western Sky Community Care', 'NM', 'commercial', 61),
  -- NV
  ('Anthem Blue Cross Blue Shield of Nevada', 'NV', 'commercial', 50),
  ('Nevada Medicaid', 'NV', 'medicaid', 51),
  ('Nevada Check Up', 'NV', 'commercial', 60),
  ('Silver Summit Health Plan', 'NV', 'commercial', 61),
  -- NY
  ('Empire BlueCross BlueShield', 'NY', 'commercial', 50),
  ('New York Medicaid', 'NY', 'medicaid', 51),
  ('Fidelis Care', 'NY', 'commercial', 60),
  ('Healthfirst', 'NY', 'commercial', 61),
  ('EmblemHealth', 'NY', 'commercial', 62),
  ('MVP Health Care', 'NY', 'commercial', 63),
  ('Excellus BlueCross BlueShield', 'NY', 'commercial', 64),
  -- OH
  ('Anthem Blue Cross Blue Shield', 'OH', 'commercial', 50),
  ('Ohio Medicaid', 'OH', 'medicaid', 51),
  ('CareSource', 'OH', 'commercial', 60),
  ('Buckeye Health Plan', 'OH', 'commercial', 61),
  ('Paramount Health Care', 'OH', 'commercial', 62),
  -- OK
  ('Blue Cross and Blue Shield of Oklahoma', 'OK', 'commercial', 50),
  ('SoonerCare', 'OK', 'medicaid', 51),
  ('Oklahoma Complete Health', 'OK', 'commercial', 60),
  -- OR
  ('Regence BlueCross BlueShield of Oregon', 'OR', 'commercial', 50),
  ('Oregon Health Plan', 'OR', 'medicaid', 51),
  ('Providence Health Plan', 'OR', 'commercial', 60),
  ('Moda Health', 'OR', 'commercial', 61),
  ('PacificSource', 'OR', 'commercial', 62),
  -- PA
  ('Highmark Blue Cross Blue Shield', 'PA', 'commercial', 50),
  ('Pennsylvania Medical Assistance', 'PA', 'medicaid', 51),
  ('HealthChoices', 'PA', 'commercial', 60),
  ('Independence Blue Cross', 'PA', 'commercial', 61),
  ('Capital Blue Cross', 'PA', 'commercial', 62),
  ('UPMC Health Plan', 'PA', 'commercial', 63),
  ('Geisinger Health Plan', 'PA', 'commercial', 64),
  -- PR
  ('Triple-S Salud', 'PR', 'commercial', 50),
  ('Vital (Plan de Salud del Gobierno)', 'PR', 'medicaid', 51),
  ('MCS (Medical Card System)', 'PR', 'commercial', 60),
  ('First Medical', 'PR', 'commercial', 61),
  ('MMM Multi Health', 'PR', 'commercial', 62),
  ('Plan de Salud Menonita', 'PR', 'commercial', 63),
  -- RI
  ('Blue Cross & Blue Shield of Rhode Island', 'RI', 'commercial', 50),
  ('RIte Care', 'RI', 'medicaid', 51),
  ('Neighborhood Health Plan of Rhode Island', 'RI', 'commercial', 60),
  -- SC
  ('BlueCross BlueShield of South Carolina', 'SC', 'commercial', 50),
  ('Healthy Connections', 'SC', 'medicaid', 51),
  ('Absolute Total Care', 'SC', 'commercial', 60),
  ('Select Health of South Carolina', 'SC', 'commercial', 61),
  -- SD
  ('Wellmark Blue Cross and Blue Shield of South Dakota', 'SD', 'commercial', 50),
  ('South Dakota Medicaid', 'SD', 'medicaid', 51),
  ('Avera Health Plans', 'SD', 'commercial', 60),
  ('Sanford Health Plan', 'SD', 'commercial', 61),
  -- TN
  ('BlueCross BlueShield of Tennessee', 'TN', 'commercial', 50),
  ('TennCare', 'TN', 'medicaid', 51),
  ('Wellpoint Tennessee', 'TN', 'commercial', 60),
  ('UnitedHealthcare Community Plan', 'TN', 'commercial', 61),
  -- TX
  ('Blue Cross and Blue Shield of Texas', 'TX', 'commercial', 50),
  ('Texas Medicaid', 'TX', 'medicaid', 51),
  ('STAR', 'TX', 'commercial', 60),
  ('Superior HealthPlan', 'TX', 'commercial', 61),
  ('Community Health Choice', 'TX', 'commercial', 62),
  ('Driscoll Health Plan', 'TX', 'commercial', 63),
  -- UT
  ('Regence BlueCross BlueShield of Utah', 'UT', 'commercial', 50),
  ('Utah Medicaid', 'UT', 'medicaid', 51),
  ('SelectHealth', 'UT', 'commercial', 60),
  ('Molina Healthcare of Utah', 'UT', 'commercial', 61),
  -- VA
  ('Anthem Blue Cross Blue Shield', 'VA', 'commercial', 50),
  ('Cardinal Care', 'VA', 'medicaid', 51),
  ('Sentara Health Plans', 'VA', 'commercial', 60),
  ('CareFirst BlueCross BlueShield', 'VA', 'commercial', 61),
  -- VT
  ('Blue Cross and Blue Shield of Vermont', 'VT', 'commercial', 50),
  ('Green Mountain Care', 'VT', 'medicaid', 51),
  ('Dr. Dynasaur', 'VT', 'commercial', 60),
  ('MVP Health Care', 'VT', 'commercial', 61),
  -- WA
  ('Premera Blue Cross', 'WA', 'commercial', 50),
  ('Apple Health', 'WA', 'medicaid', 51),
  ('Regence BlueShield', 'WA', 'commercial', 60),
  ('Kaiser Permanente Washington', 'WA', 'commercial', 61),
  ('Community Health Plan of Washington', 'WA', 'commercial', 62),
  -- WI
  ('Anthem Blue Cross Blue Shield', 'WI', 'commercial', 50),
  ('BadgerCare Plus', 'WI', 'medicaid', 51),
  ('Quartz', 'WI', 'commercial', 60),
  ('Security Health Plan', 'WI', 'commercial', 61),
  ('Network Health', 'WI', 'commercial', 62),
  -- WV
  ('Highmark Blue Cross Blue Shield West Virginia', 'WV', 'commercial', 50),
  ('West Virginia Medicaid', 'WV', 'medicaid', 51),
  ('Mountain Health Trust', 'WV', 'commercial', 60),
  ('The Health Plan', 'WV', 'commercial', 61),
  -- WY
  ('Blue Cross Blue Shield of Wyoming', 'WY', 'commercial', 50),
  ('Wyoming Medicaid', 'WY', 'medicaid', 51)
on conflict (name, state) do nothing;
