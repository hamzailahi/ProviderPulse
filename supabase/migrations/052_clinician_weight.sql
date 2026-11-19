-- 052: clinician_weight (2026-11-19, step 1 of the scoring upgrade, the
-- user's rule): a clinician with several practice sites counts 0.6 at their
-- main address in market supply (scripts/lib/dac.mjs MAIN_SHARE). Only
-- clinicians whose weight is below 1 have a row; everyone else counts 1.
-- Written only by dac-load.yml apply. The view lets market-score read each
-- catchment listing's weight in the same request as the listing.
create table if not exists public.clinician_weight (
  npi text primary key,
  w   real not null check (w > 0 and w <= 1)
);
alter table public.clinician_weight enable row level security;
revoke all on public.clinician_weight from anon, authenticated;
grant select on public.clinician_weight to anon, authenticated;
drop policy if exists clinician_weight_read on public.clinician_weight;
create policy clinician_weight_read on public.clinician_weight for select using (true);

create or replace view public.provider_individuals_weighted
with (security_invoker = true) as
  select p.npi, p.zip, p.primary_taxonomy, p.taxonomy_code, p.latitude, p.longitude,
         coalesce(cw.w, 1)::real as w
  from public.provider_individuals p
  left join public.clinician_weight cw on cw.npi = p.npi;
grant select on public.provider_individuals_weighted to anon, authenticated;
