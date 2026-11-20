## Before the changelog: from the code history

The README changelog starts on 2026-08-19. The work before it, 2026-05-13 to 2026-08-16, is listed here from the commit messages, one line per change.

### 2026-08-16

- Rewrite README as a full technical walkthrough of the project

### 2026-08-15

- Fix provider-count.js timing out and update the stale 1.9M trust-line figure
- Fix Provider Source filter freeze and St/Saint city-name matching
- Generalize city-name search beyond St/Saint to every common abbreviation
- Update README for national rollout completion and recent map fixes

### 2026-08-14

- Fix false negatives being permanently cached in cms-provider.js
- Raise cms-provider's timeout cap -- a database-wide check found real requests exceeding 10s
- Parallelize the dashboard's multi-ZIP/multi-city provider fetches

### 2026-08-13

- Make the login page's provider count live instead of hardcoded
- Make register-provider.html's provider count live too
- Fix taxonomy dropdown overflowing onto the sidebar when the filter rail is resized
- Remove the taxonomy legend panel from the dashboard
- Fix CMS enrichment field-name mismatch (facility, school, telehealth were silently dropped)
- Cache CMS provider lookups in the database instead of refetching every popup

### 2026-08-12

- Fix map popup scrolling and clustering for dense provider locations
- Update README for the national bulk-load pipeline and npi-zip-enrich workflow

### 2026-08-11

- Wire provider_individuals and clinic_secondary_locations into both maps

### 2026-08-06

- Add project README and license
- Update README links for the ProviderPulse repo rename

### 2026-08-05

- Read every row, not the first thousand PostgREST felt like sending
- Keep the ZIP centroids PLACES was already sending us
- Score opportunity per specialty, over a catchment rather than a ZIP
- Stop dropping pins to a 1000-row cap; anchor on real ZIP centres
- Draft (not applied): provider_profiles and provider_insurance are open to anon
- Show the per-specialty opportunity on the provider pitch page
- Fix 011: pg_policies.cmd is 'SELECT', not the single-letter code 'r'
- Show the per-specialty opportunity on the analyst dashboard's verdict card

### 2026-08-04

- Phase 2: demand logging
- Phase 3: market analyst agent
- Push the taxonomy filter into the database, not just JS
- Teach the planner the real taxonomy vocabulary
- Force-select the taxonomy column, or every match filters to zero
- Stop recommending a claimed listing for specialties it does not practise
- Retire the provider page's duplicate auth forms
- Give the opportunity score a demand side, per taxonomy

### 2026-08-03

- 1.1: audit schema migration
- 1.2: Medicare activity import (CMS PUF + PECOS)
- 1.2: resolve the CMS dataset from the catalog instead of a pinned UUID
- 1.2: order weekly distributions by date, not catalog position
- 1.3: accuracy scoring module
- 1.4: audit runner
- 1.5: narrative generation
- 1.4: drop the clinics sampling mode, it could not produce a usable audit
- 1.6: directory accuracy report
- Fix a false-positive inactive verdict from an implausible stored year
- Correct the diagnosis: it was Number(null), not bad data

### 2026-08-02

- Redesign foundations: specialty groups and a real opportunity score
- Score clinicians, not listings
- Count all listings again; refuse to score ZIPs with no population
- Dashboard redesign: clustered map, floating panels, verdict-first panel
- Fix provider sign-in leaving the registration form on screen
- Fix unusable light mode and a geocoder that matched Turkey
- Make the top search actually load the market; route provider save to it
- Patient app: live map beside the conversation on wide screens
- Verified listings now always appear; fix keyword substring matching
- Role-aware dashboard entry and provider opening hours
- Fix 'Save failed' when migration 005 has not been run
- One session across all three surfaces
- Restore the provider session on load
- Show the provider link on deep links; cap the patient map at two nearby ZIPs
- Provider registration: lead with the market data, not a form
- One sign-in for both sides, routed by the server's role
- Require a session to open the dashboard
- Practice locations: one account, many sites (backend)
- Fix 006 marking self-reported addresses as NPPES-verified
- Provider UI for managing practice locations
- Draw a pin per practice location on the patient map
- Draw per-location pins on the dashboard map too
- Fix saving a location throwing away its coordinates

### 2026-08-01

- Patient document upload and extraction, disabled behind a flag
- New patient app: conversation-first care navigator
- Extract design tokens; move the provider page onto the new design system
- Make the patient app the site: root routing and cutover
- Revamp the market dashboard onto the new design system
- Map opens in the app, not a new tab; drop the Google Maps handoff
- Fix the map deep link never firing
- Fix clinics vanishing from the map in short-vocabulary ZIPs
- State-specific insurance plans, shared by patients and providers
- Put every migration in the repo with a README
- Seed insurance payers for all 50 states, DC and Puerto Rico
- Bump LEIE workflow actions off deprecated Node 20 runners
- Session refresh and revocation, provider review queue, chart theming, 404
- Remove dead files: 8.6MB -> 3.1MB
- Retire the v1 site; repo is now v2-only

### 2026-07-30

- Browse providers by specialty without describing symptoms
- Fix map deep link showing every clinic instead of the recommended ones
- Patient and provider pages: shared stylesheet, mobile, and accessibility
- Provider side: surface claimed listings, harden NPI checks, claim flow
- Automate monthly OIG exclusions (LEIE) import
- Name-based OIG exclusion screening, flagged for review not blocked

### 2026-07-29

- Add provider and patient registration modules
- Add auth-login function
- Care navigator: live NPPES matching by ZIP and specialty, map deep links
- Map deep link support for care navigator
- Fix NPPES ZIP search and let patient supply ZIP in chat
- Accurate map pins via server-side Nominatim geocoding
- Align chat recommendations with map links by ranking and trimming to top 3
- Fix deep link handler: replace mangled regex with string parsing
- Auto-create missing profile rows; cms-provider graceful degradation
- Single area deep link: plot all matching clinics, highlight recommended

### 2026-07-16

- Add CMS provider data fetching function
- Add CMS enrichment functionality to index.html
- Add report-generate and cms-provider functions with timeouts
- Add cms-provider function with a 10 second timeout
- Update medical school display format in index.html
- Implement CMS provider data fetching function

### 2026-07-14

- Add v2 design prototype in separate v2/ folder
- Add index.html for v2 Netlify root
- Remove session guard from v2 for demo access
- Remove CSV export entirely from v2
- Fix v2: omnibar, procedures on neighbors, reports error, lighter colors
- Fix v2: changes to taxonomy legend area, ai reports generation. clinics capped at 100
- v2: Send all clinics, filter by ZIPs server-side
- Fix formatting in netlify.toml
- Fix missing newline at end of report-generate.js
- Fix: Add report-generate.js to root functions
- Refactor report generation in report-generate.js
- Refactor report generation logic and limits
- Remove unused procedures processing in report generation
- Add newline at end of report-generate.js

### 2026-07-13

- Mobile responsive: bottom sheet map sidebar, mobile index/login

### 2026-06-17

- Fix catchment circle demographics: fetch missing ZIP data, allow single-ZIP drill-down within circle and neighbors
- Fix demographics cache collision: clinic rows were overwriting cached population data
- Move access code validation and admin data reads server-side ahead of RLS lockdown
- Remove hardcoded ADMIN_PASSWORD fallback, fail safe if env var is missing

### 2026-06-16

- Redesign layout: left filter rail, dropdown nav, resizable panels
- Fix catchment circle demographics: fetch missing ZIP data, allow single-ZIP drill-down within circle and neighbors

### 2026-06-11

- Fix AI crash - safe JSON parse, timeout, full error handling
- Fix access flow: toggle sign-in, duration selector, dedup, email fix
- Move admin actions server-side with secret key - fix approve/email

### 2026-06-09

- Add Open Payments pharma tab - CMS Sunshine Act data by NPI
- Fix Open Payments query — select only needed columns to reduce response size
- Add HPSA shortage data, remove Open Payments tab and function
- Fix HPSA state name matching - use full state name
- Add address search - fly to any address with pin drop

### 2026-06-08

- Add NPPES contact enrichment on clinic click + AI integration
- Fix syntax error in ai-query.js

### 2026-06-05

- Tool-use AI: server-side computation, 26s timeout, lean payloads
- Auto-load PLACES+procedures on search, dynamic taxonomy colors, taller legend

### 2026-06-04

- Add search to Procedures tab by HCPCS code, description, or specialty
- Fix AI context: add procedures data, cache PLACES and CMS properly
- Fix missing ai-messages wrapper div
- Fix AI: cap procedures context at 500 rows, increase max_tokens to 2000

### 2026-05-25

- Procedures tab: full dataset with all specialties and money columns
- Add search to Procedures tab by HCPCS code, description, or specialty

### 2026-05-24

- Pre-calculate adult population 18+ in demographics context for AI
- Add Medicare Procedures tab

### 2026-05-23

- Add Claude AI query via Netlify function
- Fix missing closing script tag
- Add ai-query Netlify function
- Fix ai-query to use Node https instead of fetch
- Add logging to ai-query function
- Fix model name in ai-query function
- Add multi-city search, restore multi-ZIP dropdown, add Health Data tab
- Fix missing processData declaration, add three tabs and multi-city search
- Fix City ST comma detection, add cross-state neighbor loading
- Fix cross-state neighbors: loadState returns promise, properly awaited
- Fix neighbor clinic taxonomy colors

### 2026-05-22

- Add CMS Medicare county utilization data on county click
- Rebuild PLACES display with all 40 measures, remove ICD section
- Add ZIP-level PLACES data on ZIP click

### 2026-05-20

- Clean rewrite: simple ZIP click + neighbors button
- Fix county layer, add comma-separated ZIP search

### 2026-05-19

- Add password-protected site with admin panel
- Add admin notification emails
- Only notify hilahi
- Fix approve/deny UI refresh and email sending
- Add multi-ZIP selection with Ctrl+click and Load Neighbors
- Add multi-select toggle button for ZIP selection
- Add multi-ZIP dropdown with checkboxes and Select All
- Fix neighbor clinic fetching with pagination and global activeStatesInCSV

### 2026-05-15

- Uploaded map_supabase_full.html

### 2026-05-14

- Uploaded map_supabase_full.html

### 2026-05-13

- Uploaded map_supabase_full.html

