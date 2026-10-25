-- 043: column-level write grants on the tables signed-in users write through
-- the REST API (2026-10-25).
--
-- Until now anon and authenticated held ALL privileges on these tables, and
-- the UPDATE policies only check row ownership ("id = auth.uid()"). The
-- functions whitelist fields, but the REST API does not go through them: with
-- the public publishable key and their own session a user could PATCH any
-- column of a row they own.
--   provider_profiles: npi, npi_verified, review_status (an OIG name-match
--     hold could be cleared by the provider it holds), entity_type, ...
--   provider_locations: verified (only the registered NPI's address is).
--   appointment_requests: status, so a patient could confirm their own
--     request or create one already confirmed (the transitions were enforced
--     only in appointment-request.js, which also read the role from
--     user-writable user_metadata).
--
-- Fix: take INSERT/UPDATE/DELETE away from anon and authenticated, then grant
-- back exactly the columns the functions write under the caller's JWT
-- (profile.js PROVIDER_FIELDS, provider-locations.js FIELDS plus the geocoder's
-- latitude/longitude/geocoded, appointment-request.js), and check appointment
-- status changes in the database by who the caller is, not what they claim.
-- Triggers that set updated_at need no column privilege. The service role is
-- untouched. Safe to re-run.

-- provider_profiles: a provider edits their listing details, nothing else.
revoke insert, update, delete, truncate, references, trigger on public.provider_profiles from anon, authenticated;
grant update (phone, address_line, city, state, zip, accepting_new_patients, telehealth, bio, org_name,
  office_hours, appointment_minutes, booking_mode, booking_url, hours_note)
  on public.provider_profiles to authenticated;

-- provider_locations: everything a provider types or the geocoder derives;
-- never `verified`.
revoke insert, update, delete, truncate, references, trigger on public.provider_locations from anon, authenticated;
grant insert (provider_id, npi, label, address_line, city, state, zip, latitude, longitude, geocoded, phone,
  accepting_new_patients, telehealth, office_hours, hours_note, is_primary)
  on public.provider_locations to authenticated;
grant update (npi, label, address_line, city, state, zip, latitude, longitude, geocoded, phone,
  accepting_new_patients, telehealth, office_hours, hours_note, is_primary, updated_at)
  on public.provider_locations to authenticated;
grant delete on public.provider_locations to authenticated;

-- appointment_requests: a patient creates a request; either party moves its
-- status, under the rules below.
revoke insert, update, delete, truncate, references, trigger on public.appointment_requests from anon, authenticated;
grant insert (patient_id, provider_id, requested_time, reason) on public.appointment_requests to authenticated;
grant update (status, requested_time, updated_at) on public.appointment_requests to authenticated;

-- The same transitions as appointment-request.js, decided by whether the
-- caller is the row's patient or its provider. Only signed-in callers are
-- checked; the service role and the database owner pass.
create or replace function public.appointment_guard() returns trigger
language plpgsql as $$
declare
  uid uuid := auth.uid();
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status is distinct from 'requested' then
      raise exception 'A new appointment request starts as requested' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.status is distinct from old.status then
    if uid is not null and uid = old.patient_id then
      if not (old.status in ('requested', 'confirmed') and new.status = 'cancelled') then
        raise exception 'A patient may only cancel a request' using errcode = '42501';
      end if;
    elsif uid is not null and uid = old.provider_id then
      if not ((old.status = 'requested' and new.status in ('confirmed', 'declined'))
           or (old.status = 'confirmed' and new.status in ('completed', 'declined'))) then
        raise exception 'Cannot move an appointment from % to %', old.status, new.status using errcode = '42501';
      end if;
    else
      raise exception 'Not a party to this appointment' using errcode = '42501';
    end if;
  end if;
  -- Only the provider sets a time, and only when confirming a request.
  if new.requested_time is distinct from old.requested_time
     and not (uid is not null and uid = old.provider_id and old.status = 'requested' and new.status = 'confirmed') then
    raise exception 'Only the provider confirming a request can set its time' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists trg_appointment_guard on public.appointment_requests;
create trigger trg_appointment_guard before insert or update on public.appointment_requests
  for each row execute function public.appointment_guard();
