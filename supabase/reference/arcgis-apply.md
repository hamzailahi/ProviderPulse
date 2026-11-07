# ArcGIS points: dry_run

Run 2026-11-07 22:48 UTC by scripts/arcgis-apply.sh. Points from the user's own ArcGIS run (keyless service, loaded by the user's decision without an Esri storage licence), filtered to address-level matches in the listing's ZIP. Written only to rows still without a pin whose address and ZIP were unchanged, within 25 miles of the ZIP's centre. Dry run: rolled back, nothing written.

- Rows offered: 66480
- Left out, more than 25 miles from the ZIP's centre: 109
- Left out, pinned or address changed since the export: 0
- clinic_secondary_locations=5
- clinics=10222
- provider_individuals=56144
- type PointAddress=49195
- type Subaddress=17176
- Rows that would be written: **66371**
