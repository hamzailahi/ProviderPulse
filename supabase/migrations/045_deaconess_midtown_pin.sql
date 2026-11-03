-- 045: Deaconess Midtown Hospital's pin (2026-11-03, the user's request).
--
-- The hospital's NPI 1053361642 (General Acute Care Hospital, 600 Mary St,
-- Evansville) carries ZIP 47710 in NPPES while the hospital is in 47747, and
-- its listing was geocoded about 3.5 miles west (37.98374, -87.57111), so a
-- patient searching near downtown Evansville saw the hospital in the wrong
-- place. Other listings at the same street address already sit on the
-- hospital (Census exact match, 37.969629, -87.505618: e.g. 1629162573), and
-- deaconess.com lists Midtown at 600 Mary St, 47747.
--
-- Moves only rows at 600 Mary St, Evansville, that sit on the wrong point.
-- Address and ZIP are left as NPPES has them, so the weekly refresh sees no
-- change and keeps these coordinates. Refuses if the count looks wrong.
do $$
declare n_c int; n_i int; n_s int;
begin
  update public.clinics set latitude = 37.969629, longitude = -87.505618
   where upper(address) like '600 MARY ST%' and upper(city) = 'EVANSVILLE' and state = 'IN'
     and latitude between 37.983 and 37.985 and longitude between -87.572 and -87.570;
  get diagnostics n_c = row_count;
  update public.provider_individuals set latitude = 37.969629, longitude = -87.505618
   where upper(address) like '600 MARY ST%' and upper(city) = 'EVANSVILLE' and state = 'IN'
     and latitude between 37.983 and 37.985 and longitude between -87.572 and -87.570;
  get diagnostics n_i = row_count;
  update public.clinic_secondary_locations set latitude = 37.969629, longitude = -87.505618
   where upper(address) like '600 MARY ST%' and upper(city) = 'EVANSVILLE' and zip like '477%'
     and latitude between 37.983 and 37.985 and longitude between -87.572 and -87.570;
  get diagnostics n_s = row_count;
  raise notice 'moved: clinics %, provider_individuals %, clinic_secondary_locations %', n_c, n_i, n_s;
  if n_c < 1 or n_c + n_i + n_s > 600 then
    raise exception 'unexpected row count (clinics %, individuals %, secondary %); nothing changed', n_c, n_i, n_s;
  end if;
end $$;
