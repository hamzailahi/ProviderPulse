-- 057: market concentration per ZIP3 and scored specialty (2026-11-20, step 7).
--
-- HHI of Medicare-enrolled clinicians by billing group (org_pac_id in CMS
-- Doctors and Clinicians; no group = a solo practice, its own firm). The
-- specialty is the clinician's own NUCC code through the reviewed patient
-- specialty table. Shown on Insights as a fact, never scored. Written only by
-- hhi-build.yml (scripts/hhi-build.sh). Public data only.

create table if not exists public.market_concentration (
  zip3 text not null check (zip3 ~ '^\d{3}$'),
  specialty text not null,
  clinicians integer not null,
  groups integer not null,
  hhi integer not null,
  top_group text,
  top_share numeric,
  release_date date,
  primary key (zip3, specialty)
);

alter table public.market_concentration enable row level security;
drop policy if exists market_concentration_read on public.market_concentration;
create policy market_concentration_read on public.market_concentration for select using (true);
revoke insert, update, delete on public.market_concentration from anon, authenticated;
grant select on public.market_concentration to anon, authenticated;
