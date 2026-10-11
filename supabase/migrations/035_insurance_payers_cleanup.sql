-- Cleanup after 034 (2026-10-11). Reading the loaded list turned up:
--   * "Banner|Aetna" (AZ): the review sheet's "sold under both names" note was
--     loaded as one literal name. It becomes "Banner Aetna" (Aetna is also
--     listed nationally).
--   * entries that are not plan names: "Multiple Sites" (WA), "GMS
--     Reinsurance" (MI), "AMHIC, A Reciprocal Association & Sub" (DC),
--     "Holman Professional Counseling Centers" (CA, an employee counseling
--     program). Removed.
--   * unclear names given their full plan name: "DCS/CHP" (AZ) and "HOME" (UT).
--   * the same plan twice in one state, merged into the name kept:
--     CDPHP (NY), The Health Plan of West Virginia (WV), Baylor Scott & White
--     Health Plan (TX), Fallon Health (MA), HealthPartners (MN).
-- supabase/reference/payer-brand-map.csv now makes the same decisions, so a
-- future refresh will not bring these back.
--
-- Only rows 034 added are touched (sort order 70, the category 034 gave
-- them), never a Medicare Advantage row of the same name. A provider's or
-- patient's saved choice of a renamed or merged name follows the new name;
-- a removed name stays as the text they saved. Safe to re-run.
--
-- Run in the Supabase SQL editor. The whole fix is one DO block, so it runs
-- as a single statement and either all of it applies or none does. (The
-- first version used begin/commit around a temp table; the SQL editor ran
-- the statements separately and the table was gone by the second one:
-- 42P01, nothing changed.)

do $$
begin

drop table if exists pp_035;
create temp table pp_035 (old text, new text, state text, category text);
insert into pp_035 (old, new, state, category) values
  ('Banner|Aetna',                            'Banner Aetna',                           'AZ', 'commercial'),
  ('DCS/CHP',                                 'DCS Comprehensive Health Plan',          'AZ', 'medicaid'),
  ('HOME',                                    'HOME (University of Utah Health Plans)', 'UT', 'medicaid'),
  ('Capital District Physician''s Health Plan','CDPHP',                                 'NY', 'medicaid'),
  ('The Health Plan of WV',                   'The Health Plan of West Virginia',       'WV', 'medicaid'),
  ('Scott & White Health Plan',               'Baylor Scott & White Health Plan',       'TX', 'medicaid'),
  ('Fallon Community Health Plan',            'Fallon Health',                          'MA', 'commercial'),
  ('Health Partners',                         'HealthPartners',                         'MN', 'medicaid'),
  ('Multiple Sites',                          null,                                     'WA', 'medicaid'),
  ('GMS Reinsurance',                         null,                                     'MI', 'commercial'),
  ('AMHIC, A Reciprocal Association & Sub',   null,                                     'DC', 'commercial'),
  ('Holman Professional Counseling Centers',  null,                                     'CA', 'commercial');

-- Rename where the new name is not already listed in that state.
update public.insurance_payers p set name = m.new
from pp_035 m
where p.name = m.old and p.state = m.state and p.category = m.category and p.sort_order = 70
  and m.new is not null
  and not exists (select 1 from public.insurance_payers q where q.name = m.new and q.state = m.state);

-- Everything else on the list goes: removals, and duplicates whose kept name already exists.
delete from public.insurance_payers p
using pp_035 m
where p.name = m.old and p.state = m.state and p.category = m.category and p.sort_order = 70;

-- Saved choices follow a renamed or merged plan, once the old name is gone everywhere.
update public.provider_insurance i set payer_name = m.new
from pp_035 m
where i.payer_name = m.old and m.new is not null
  and not exists (select 1 from public.insurance_payers q where q.name = m.old);

update public.patient_profiles pp set insurance_payer = m.new
from pp_035 m
where pp.insurance_payer = m.old and m.new is not null
  and not exists (select 1 from public.insurance_payers q where q.name = m.old);

drop table pp_035;

end $$;

-- Check (expect 0 rows): none of the old names remain from 034.
-- select p.state, p.name from public.insurance_payers p
-- where p.sort_order = 70 and p.category <> 'medicare'
--   and (p.name, p.state) in (('Banner|Aetna','AZ'),('Multiple Sites','WA'),('GMS Reinsurance','MI'),
--     ('AMHIC, A Reciprocal Association & Sub','DC'),('Holman Professional Counseling Centers','CA'),
--     ('DCS/CHP','AZ'),('HOME','UT'),('Capital District Physician''s Health Plan','NY'),
--     ('The Health Plan of WV','WV'),('Scott & White Health Plan','TX'),
--     ('Fallon Community Health Plan','MA'),('Health Partners','MN'));
