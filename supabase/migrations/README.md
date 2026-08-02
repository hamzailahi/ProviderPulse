# Supabase migrations

The core tables (`clinics`, `demographics_raw`, `hpsa_designations`,
`provider_profiles`, `provider_insurance`, `patient_profiles`, `audit_log`) were
created by hand in the Supabase dashboard and are **not** represented here.
Everything added since is, so it can be reviewed and re-run.

## How to run one

Supabase dashboard → **SQL Editor** → **New query** → paste the file → **Run**.

Every file is idempotent (`if not exists` / `on conflict do nothing`), so
re-running one is safe.

## Order and status

| # | File | What it enables | Safe to run now? |
|---|---|---|---|
| 001 | `001_leie_exclusions.sql` | OIG exclusion screening at provider registration | **Yes** — you reported this one already applied |
| 003 | `003_insurance_payers.sql` | State-specific insurance lists on both signup forms | **Yes** — do this one next |
| 004 | `004_provider_review_status.sql` | Name-based exclusion screening (flag for review) | **Yes** |
| 002 | `002_patient_documents.sql` | Patient document upload + extraction | **NOT YET** — see below |

They are independent; the numbering is creation order, not a dependency chain.

## Why 002 is held back

`002` creates storage for uploaded medical records — the most sensitive PHI this
system will hold. Do not run it in production until BAAs are in place with
**both**:

1. **Supabase** (Team plan or above)
2. **Anthropic**, on the API account `doc-extract.js` uses — document contents
   leave our infrastructure when they are read

The application code is gated behind `DOCUMENT_UPLOAD_ENABLED=false`, so the
feature stays dark regardless. Running `002` in a dev project is fine.

## After running 003

230 plans are seeded: 13 national carriers plus 217 rows covering **all 50
states, DC and Puerto Rico** — each state's Blue Cross licensee (they are
independent companies, not one national insurer), its Medicaid program under its
own brand (TennCare, Medi-Cal, MassHealth, SoonerCare, Apple Health …), and
notable regional plans in the larger markets.

**Review the names before launch.** Plan names, Medicaid brands and Blue Cross
licensees all change, and this is a strong starting set rather than a verified
market census. A missing plan degrades gracefully — both forms offer "Other" as
free text — but a *wrong* name looks worse than a missing one. Adding a plan
needs no code change:

```sql
insert into public.insurance_payers (name, state, category, sort_order)
values ('Some Regional Plan', 'TN', 'commercial', 60);
```

`state = null` means national, shown in every state.
