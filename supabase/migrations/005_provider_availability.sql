-- Provider opening hours and appointment settings.
--
-- Useful on its own — patients currently have no idea when a practice is open,
-- which is the most common reason a "found a doctor" moment fails. It is also
-- the foundation appointment booking needs: you cannot offer a slot without
-- knowing the hours it sits in.
--
-- NOTE ON SCOPE: this stores AVAILABILITY, not appointments. No patient data is
-- involved, so it is safe to run before the BAAs land. The appointments table
-- itself is deliberately not created here — an appointment record (who saw
-- which doctor, when, and why) is PHI at its most concrete and should not exist
-- in an uncovered database.
--
-- Safe to run more than once.

alter table public.provider_profiles
  -- {"mon":{"open":"09:00","close":"17:00"}, ... , "sat":null, "sun":null}
  -- A null or missing day means closed. Times are LOCAL to the practice; the
  -- state/ZIP already on the row is what resolves the timezone.
  add column if not exists office_hours jsonb,
  -- Typical minutes per appointment; drives slot generation later.
  add column if not exists appointment_minutes int,
  -- How a patient should get in touch until real booking exists.
  -- phone | website | walk_in
  add column if not exists booking_mode text default 'phone',
  add column if not exists booking_url text,
  -- Free text for anything the structured fields cannot express
  -- ("closed for lunch 12-1", "Saturdays by appointment only")
  add column if not exists hours_note text;

-- Patients filter on "open now" / "open weekends", so the common lookup is by
-- presence of hours rather than by their contents.
create index if not exists provider_hours_idx
  on public.provider_profiles ((office_hours is not null))
  where office_hours is not null;

-- ---------------------------------------------------------------------------
-- Example shape:
--
--   update provider_profiles set
--     office_hours = '{"mon":{"open":"08:00","close":"17:00"},
--                      "tue":{"open":"08:00","close":"17:00"},
--                      "wed":{"open":"08:00","close":"17:00"},
--                      "thu":{"open":"08:00","close":"17:00"},
--                      "fri":{"open":"08:00","close":"12:00"}}'::jsonb,
--     appointment_minutes = 20,
--     booking_mode = 'phone',
--     hours_note = 'Closed 12–1 daily'
--   where npi = '1669794574';
-- ---------------------------------------------------------------------------
