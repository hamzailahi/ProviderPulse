-- Provider exclusion-review flag.
--
-- Only ~10% of OIG exclusion records carry an NPI, so name+state matching covers
-- the rest. But last+first+state collides for over a thousand real combinations
-- (there are five different MARIA HERNANDEZ in FL on that list), so a name hit
-- cannot be treated as proof. It flags the listing for a human instead of
-- blocking the account.
--
-- A flagged provider can still sign in and edit their profile; they are simply
-- withheld from patients — providers-public.js and patient-match.js both filter
-- on review_status <> 'pending'.
--
-- Until this migration runs, name screening is INERT: clean providers register
-- normally, and a provider who would have been flagged fails registration
-- outright rather than being published unflagged. That is deliberate — it fails
-- closed, not open.
--
-- Safe to run more than once.

alter table public.provider_profiles
  add column if not exists review_status text not null default 'clear',
  add column if not exists review_reason text;

create index if not exists provider_review_idx
  on public.provider_profiles (review_status)
  where review_status <> 'clear';

-- ---------------------------------------------------------------------------
-- Reviewing the queue (manual for now — there is no admin UI yet)
--
--   select npi, first_name, last_name, org_name, state, review_reason
--   from provider_profiles where review_status = 'pending';
--
-- To clear one after checking them against oig.hhs.gov/exclusions:
--
--   update provider_profiles
--      set review_status = 'clear', review_reason = null
--    where npi = '1234567890';
-- ---------------------------------------------------------------------------
