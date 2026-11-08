# ArcGIS points, strict cut: apply

Run 2026-11-08 06:00 UTC by scripts/arcgis-revert.sh. A loaded point stays only when ArcGIS scored it 100 and it lies inside the 2020 Census ZIP area (full-resolution TIGER polygon, no tolerance) of the listing's own ZIP; a ZIP with no Census area cannot be confirmed. Failing rows go back to no pin, only if they still hold the loaded point.

- Rows loaded on 2026-11-08: 66371
- Pass the strict cut: 53322
- Fail it: 13049
- clinic_secondary_locations=5
- clinics=1745
- provider_individuals=11299
- reason outside_own_zip_area=4456
- reason score_below_100=7267
- reason zip_has_no_census_area=1326
- Rows set back to no pin: **13049**
