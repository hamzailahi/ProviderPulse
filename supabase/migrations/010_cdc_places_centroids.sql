-- ZCTA centroids for cdc_places, so a ZIP catchment can be pooled server-side.
--
-- HOW TO APPLY. There is no migration runner in this repo. Paste this file into
-- the Supabase SQL editor and run it by hand, then tell Claude it is applied --
-- a file existing in supabase/migrations/ does not mean it has been run.
--
-- Safe to run more than once: add-column-if-not-exists plus a create-if-not-
-- exists index. Nothing here rewrites existing rows; the importer backfills the
-- values on its next run.
--
-- ---------------------------------------------------------------------------
-- WHY
--
-- Per-taxonomy supply cannot be scored on a single ZIP. Measured over the
-- 23,430 ZIPs present in both clinics and PLACES, the share with ZERO listings
-- in a group is: surgical 64.2%, dental 41.9%, primary 38.0%, behavioral 34.7%,
-- specialty 27.6%. The 25th percentile of density is 0.000 for every group and
-- surgical's median is 0 -- most ZIPs are small, and one primary-care practice
-- already puts a ZIP above the 38th percentile.
--
-- Those zeros are real, not a classification bug (a 50,000-row sample across
-- the NPI keyspace splits facility 38.7% / specialty 21.2% / behavioral 14.8% /
-- dental 11.9% / primary 8.7% / surgical 4.8%). A ZIP with no dentist is not
-- infinitely underserved -- its residents drive to the next ZIP. So the
-- catchment, not the ZIP, is the unit that can carry a supply verdict.
--
-- Pooling needs distances between ZIP centres, and nothing server-side had
-- them:
--   * index.html finds neighbours from Leaflet GeoJSON boundary layers, which
--     exist only in the browser.
--   * patient.js averages the coordinates of a ZIP's own clinics, and says in
--     its own comment that this is only because no ZIP geodatabase is
--     available. It also cannot work for a ZIP with no clinics -- precisely the
--     ZIPs that need pooling most.
--
-- CDC ships a `geolocation` point per ZCTA in the same rows we already import,
-- for all 32,520 ZCTAs including the empty ones. It was simply dropped on the
-- first pass. This adds it.
--
-- NOT a substitute for real ZCTA polygons: it is a representative point, so
-- "nearest centroid" is an approximation of adjacency, and a large rural ZCTA's
-- centre can sit far from its populated edge. That is acceptable for ranking a
-- catchment and is not acceptable for drawing boundaries -- do not repurpose it
-- for the latter.
-- ---------------------------------------------------------------------------

alter table public.cdc_places add column if not exists lat numeric;
alter table public.cdc_places add column if not exists lon numeric;

-- Neighbour search is a bounding-box prefilter on one measure's rows (one row
-- per ZIP), then an exact distance sort in the function. This index serves the
-- box scan.
create index if not exists cdc_places_latlon_idx
  on public.cdc_places (lat, lon)
  where lat is not null and lon is not null;


-- ===========================================================================
-- VERIFY
-- ===========================================================================
-- Immediately after applying, before re-running the importer, both columns
-- exist and are entirely null -- that is expected, not a failure.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'cdc_places'
  and column_name in ('lat', 'lon');

-- After re-running the import: expect ~32,520 ZIPs with coordinates, all
-- within the US bounding box. A count far below that means the importer did not
-- pick up the geolocation field.
-- select count(distinct zip) filter (where lat is not null) as zips_with_coords,
--        min(lat), max(lat), min(lon), max(lon)
-- from public.cdc_places;
