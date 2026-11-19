-- 051: clinician_status (2026-11-19, step 1 of the scoring upgrade; the
-- user's choices: every clinician stays visible, sites split supply,
-- graduation year used only in the score and on the provider side).
-- One row per NPI from CMS's Doctors and Clinicians National Downloadable
-- File (Medicare-enrolled clinicians only; absence never means inactive).
-- Written only by dac-load.yml under the service role.
create table if not exists public.clinician_status (
  npi            text primary key,
  ind_pac_id     text,
  grad_year      smallint,
  telehealth     boolean not null default false,
  sites          smallint not null,           -- distinct practice addresses in the file
  org_pac_ids    text[] not null default '{}',
  cms_specialty  text,
  release_date   date not null
);
alter table public.clinician_status enable row level security;
revoke all on public.clinician_status from anon, authenticated;
-- Public read of these columns only (public CMS data); no write grant.
grant select on public.clinician_status to anon, authenticated;
drop policy if exists clinician_status_read on public.clinician_status;
create policy clinician_status_read on public.clinician_status for select using (true);
