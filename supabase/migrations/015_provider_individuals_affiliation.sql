-- Links a physician (provider_individuals) to the clinic/org they most likely
-- practise at, when one can be inferred.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file into
-- the Supabase SQL editor and run it by hand, then update CLAUDE.md's
-- "Applied as of" list.
--
-- PREREQUISITE: migration 013 (provider_individuals) must already be applied.
--
-- Safe to run more than once: guarded add-column / index.
--
-- ---------------------------------------------------------------------------
-- WHY THIS IS A HEURISTIC, NOT A FACT, AND WHY THAT'S RECORDED EXPLICITLY
--
-- NPPES has no published "this individual works at this organisation" field.
-- link_affiliations.py (part of the bulk-load pipeline) infers it by matching
-- a physician's geocoded coordinates against a clinic's geocoded coordinates,
-- rounded to 5 decimal places (~1 metre) -- i.e. "this physician's registered
-- address and this clinic's registered address are the same building".
--
-- Matching is restricted to rows where BOTH sides got an address-level Census
-- geocode (geocode_precision = 'address'), never a ZIP-centroid fallback --
-- otherwise every physician in a ZIP would spuriously match every clinic in
-- the same ZIP. A coordinate occupied by more than one clinic is left
-- unmatched (ambiguous) rather than guessing.
--
-- This still produces false positives (unrelated practices sharing an office
-- building) and false negatives (formatting differences that geocode to
-- slightly different points, telehealth-only providers). Treat it as "likely
-- affiliated", not verified -- same posture as everything else bulk NPPES
-- data cannot actually confirm (see CLAUDE.md's OIG screening section for the
-- established pattern of surfacing an inference for a human rather than
-- asserting it as fact).
-- ---------------------------------------------------------------------------

alter table public.provider_individuals
  add column if not exists affiliated_clinic_npi text;

create index if not exists provider_individuals_affiliated_clinic_idx
  on public.provider_individuals (affiliated_clinic_npi)
  where affiliated_clinic_npi is not null;


-- ===========================================================================
-- VERIFY
-- ===========================================================================
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'provider_individuals'
  and column_name = 'affiliated_clinic_npi';
