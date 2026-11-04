# HIPAA readiness: what a BAA has to cover before patients sign up

*Written 2026-11-04. Vendor terms change, so confirm each point with the
vendor in writing before acting on it.*

Today patient sign-up is closed except for listed testers
(`PATIENT_SIGNUP_EMAILS`), and document upload is off
(`DOCUMENT_UPLOAD_ENABLED`). Both stay that way until every service below
that touches protected health information (PHI) is covered by a signed
Business Associate Agreement (BAA).

## Where patient information goes

| Data | Path | Service that sees it |
|---|---|---|
| Date of birth, conditions, concern (`patient_profiles`) | stored | Supabase (database) |
| Appointment requests and briefings | stored | Supabase (database) |
| Uploaded documents (migration 002, not applied) | stored | Supabase (storage) |
| Every signed-in patient request | processed | Netlify Functions |
| The patient's own profile in the care navigator (`patient-match`) | sent to the model | Anthropic API, Claude Haiku 4.5 |
| Concern, conditions and approved facts in briefings (`appointment-briefing`) | sent to the model | Anthropic API, Claude Haiku 4.5 |
| Uploaded documents (`doc-extract`, off) | sent to the model | Anthropic API, Claude Sonnet 5 |
| Sign-up and password emails | sent | Supabase Auth's email sender |

Not PHI by design: `demand_log` (no user, no free text), `listing_reports`
(no user), the dashboard and every public directory table.

## What each vendor needs

### Supabase (required)

- Signed BAA plus the **HIPAA add-on**, which Supabase's docs say is needed
  before storing PHI ([Supabase HIPAA projects](https://supabase.com/docs/guides/platform/hipaa-projects.md),
  [Supabase BAA](https://supabase.com/legal/customer-resources/business-associate-agreement)).
- Plan: third-party guides say Team plan or above; Free and Pro are not
  eligible. Supabase does not publish the add-on price; blog posts quote
  about $350 a month, unverified. **Ask Supabase sales for the current price.**
- Mark the project **High Compliance** in the dashboard (it is per project,
  not account-wide) and fix whatever its checks flag (typically SSL
  enforcement, point-in-time recovery, network restrictions, MFA on team
  accounts).
- Auth emails: confirm whether Supabase's built-in sender is in BAA scope;
  if not, use a custom SMTP provider that signs a BAA. Keep email text free
  of health details either way.

### Netlify (required: every function runs there)

- Netlify signs BAAs and lists one in its trust center; its announcement
  speaks of **enterprise** customers, and third-party guides say Enterprise
  only ([Netlify announcement](https://netlify.com/blog/netlify-launches-a-hipaa-compliant-service-offering),
  [Netlify trust center](https://www.netlify.com/trust-center.md)).
  **Ask Netlify sales which plan and which services (Functions, logs) the
  BAA covers.**
- If the price is out of reach, the alternative is moving the PHI-touching
  functions (`profile`, `auth-register-patient`, `appointment-*`,
  `patient-match`, `doc-*`) to a host that signs a BAA on a smaller plan.
  That is real work; ask before committing to it.
- Function logs already never carry PHI values (CLAUDE.md, PHI rules). Keep it so.

### Anthropic (required while the navigator and briefings use Claude)

- Signed BAA plus a **HIPAA-ready API organization**. Anthropic's current
  docs say this covers the Claude API without zero data retention, and that
  covered models need standard 30-day retention
  ([API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention),
  [covered models](https://support.claude.com/en/articles/15455031-covered-models-under-a-business-associate-agreement-baa)).
- **Check that Claude Haiku 4.5 and Sonnet 5 are on the covered-models list.**
  The support article names Claude Fable 5 and points to a separate list. If
  they are not covered, switch those functions to a covered model.
- The PHI calls must use an API key from the HIPAA-ready organization, kept
  apart from the market assistant's key (which carries no PHI).
- Features outside the eligibility table are refused for HIPAA
  organizations; the patient calls use only Messages with Structured Outputs.
  Confirm Structured Outputs is on the table.

### Smaller items to decide

- **MapTiler** geocodes the address a patient types, from the browser. It
  receives the address alone, with no name or health detail, and only the
  ZIP reaches our functions. Probably out of scope, but note it in the risk
  assessment.
- **GitHub Actions** never touch patient tables (they read public data). Keep it so.

## Order of work

1. Ask Supabase, Netlify and Anthropic for BAA terms and prices (one email each).
2. Sign the Supabase BAA, enable the add-on, mark the project High Compliance.
3. Sign Netlify's BAA, or plan the move of the PHI functions.
4. Sign Anthropic's BAA, create the HIPAA-ready organization, confirm the
   models, and put its key in Netlify for the patient functions only.
5. Write a short HIPAA risk assessment and policies (access, breach notice,
   retention). The BAAs do not replace these.
6. Then set `PATIENT_SIGNUP_ENABLED=true`, and later apply migration 002 and
   `DOCUMENT_UPLOAD_ENABLED=true` for documents.
