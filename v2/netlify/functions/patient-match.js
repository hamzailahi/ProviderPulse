// patient-match.js
// AI care navigator for signed-in patients. Maps the patient's stated conditions
// (and any specialty mentioned in chat) to NPPES taxonomy searches scoped to their
// ZIP area, then has Claude present the top matches. Also returns the raw provider
// list plus the ZIP and taxonomy terms used, so the frontend can deep link the map
// to the whole search area with these providers highlighted.
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
// (service role is used only to read published fields of registered providers)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Standardized condition -> NPPES taxonomy_description search term
const CONDITION_TAXONOMY = {
  'diabetes': 'Endocrinology',
  'high blood pressure': 'Internal Medicine',
  'heart disease': 'Cardiovascular Disease',
  'asthma / copd': 'Pulmonary Disease',
  'mental health': 'Psychiatry',
  'arthritis': 'Rheumatology',
  'back or joint pain': 'Orthopaedic Surgery',
  'cancer care': 'Oncology',
  'kidney disease': 'Nephrology',
  'pregnancy / prenatal': 'Obstetrics & Gynecology',
  'pediatric care': 'Pediatrics',
  'weight management': 'Obesity Medicine',
  'sleep disorders': 'Sleep Medicine',
  'preventive care / checkup': 'Family Medicine'
};

// Free-text specialty keywords a patient might type in chat
const KEYWORD_TAXONOMY = {
  'cardiolog': 'Cardiovascular Disease', 'heart': 'Cardiovascular Disease',
  'dermatolog': 'Dermatology', 'skin': 'Dermatology',
  'neurolog': 'Neurology', 'psychiat': 'Psychiatry', 'therap': 'Psychiatry',
  'counsel': 'Counselor', 'orthoped': 'Orthopaedic Surgery', 'ortho': 'Orthopaedic Surgery',
  'pediatric': 'Pediatrics', 'obgyn': 'Obstetrics & Gynecology', 'gynecol': 'Obstetrics & Gynecology',
  'urolog': 'Urology', 'gastro': 'Gastroenterology', 'stomach': 'Gastroenterology',
  'pulmon': 'Pulmonary Disease', 'lung': 'Pulmonary Disease',
  'endocrin': 'Endocrinology', 'oncolog': 'Oncology', 'cancer': 'Oncology',
  'nephrolog': 'Nephrology', 'kidney': 'Nephrology',
  'ophthalmolog': 'Ophthalmology', 'eye': 'Ophthalmology', 'optomet': 'Optometrist',
  'dentist': 'Dentist', 'dental': 'Dentist', 'allerg': 'Allergy & Immunology',
  'ent': 'Otolaryngology', 'ear': 'Otolaryngology', 'sleep': 'Sleep Medicine',
  'rheumat': 'Rheumatology', 'family': 'Family Medicine', 'primary care': 'Family Medicine',
  'internal med': 'Internal Medicine', 'chiropract': 'Chiropractor',
  'physical therap': 'Physical Therapist', 'podiat': 'Podiatrist', 'foot': 'Podiatrist'
};

// NPPES search terms do not match what the map filters on. The map compares against
// clinics.primary_taxonomy, which uses role-suffixed and facility-style values, so
// "Family Medicine" finds nothing even where primary care clearly exists (the column
// holds "General Practice Physician", "Primary Care Clinic/Center", ...). Expand each
// search term into the forms that column actually stores. Terms absent from this table
// pass through unchanged, which is correct when both vocabularies already agree.
const MAP_TAXONOMY = {
  'Family Medicine': 'Family Medicine Physician,General Practice Physician,Internal Medicine Physician,Primary Care Clinic/Center,Federally Qualified Health Center,Family Nurse Practitioner,Adult Health Nurse Practitioner,Community Health Clinic/Center,Family Medicine,Internal Medicine',
  'Internal Medicine': 'Internal Medicine Physician,General Practice Physician,Primary Care Clinic/Center,Federally Qualified Health Center,Internal Medicine,Family Medicine',
  'Pediatrics': 'Pediatrics Physician,Pediatric Nurse Practitioner,Pediatric Adolescent Medicine,Pediatrics',
  'Obstetrics & Gynecology': 'Obstetrics & Gynecology Physician,Obstetrics Physician,Gynecology Physician,Advanced Practice Midwife,Obstetrics & Gynecology',
  'Psychiatry': 'Psychiatry Physician,Psychologist,Neuropsychologist,Counselor,Clinical Social Worker,Marriage & Family Therapist,Mental Health,Behavioral Health,Psychiatry & Mental Health,Psychiatry',
  'Counselor': 'Counselor,Clinical Social Worker,Psychologist,Marriage & Family Therapist,Mental Health,Behavioral Health,Psychiatry & Mental Health',
  'Dentist': 'Dentist,Dentistry,Dental Clinic/Center',
  'Optometrist': 'Optometrist,Ophthalmology Physician,Eyewear Supplier,Vision & Eye Care',
  'Ophthalmology': 'Ophthalmology Physician,Optometrist,Vision & Eye Care',
  'Physical Therapist': 'Physical Therapist,Physical Therapy Clinic/Center,Occupational Therapist,Physical Medicine & Rehabilitation Physician,Therapy & Rehabilitation',
  'Orthopaedic Surgery': 'Orthopaedic Surgery Physician,Sports Medicine,Surgery',
  'Cardiovascular Disease': 'Cardiovascular Disease Physician,Cardiology',
  'Oncology': 'Oncology,Hematology',
  'Hematology & Oncology': 'Hematology & Oncology Physician,Oncology',
  'Obesity Medicine': 'Obesity Medicine,Registered Dietitian,Nutritionist,Bariatric',
  'Sleep Medicine': 'Sleep Medicine,Sleep Disorder,Pulmonary Disease Physician',
  'Emergency Medicine': 'Emergency Medicine Physician,Urgent Care Clinic/Center,Emergency Care Clinic/Center,General Acute Care Hospital,Emergency Services',
  'Radiology': 'Diagnostic Radiology Physician,Radiology Clinic/Center,Body Imaging,Radiology & Imaging',
  'Home Health': 'Home Health Agency,Home Health Aide,In Home Supportive Care Agency,Nursing Care Agency,Nursing',
  'Dietitian': 'Registered Dietitian,Nutritionist,Nutrition',
  'Pain Medicine': 'Pain Medicine Physician,Pain Medicine (Anesthesiology) Physician',
  'Plastic Surgery': 'Plastic Surgery Physician,Plastic and Reconstructive Surgery Physician',
  'Speech-Language Pathologist': 'Speech-Language Pathologist,Audiologist,Hearing and Speech Clinic/Center'
};

// Terms the map should filter on, given what the navigator searched NPPES for.
//
// The bare NPPES term is ALWAYS included, not just its expansions. The clinics
// table holds two different vocabularies depending on the import batch — some
// ZIPs store "Internal Medicine Physician", others store plain "Internal
// Medicine" — and matching is prefix-at-a-word-boundary, so the short form
// matches both while the long form only matches the long one. Dropping the bare
// term made every clinic in the short-vocabulary ZIPs vanish from the map.
function mapTaxonomies(terms) {
  const out = [];
  const add = v => { v = String(v).trim(); if (v && !out.includes(v)) out.push(v); };
  for (const t of terms) {
    add(t);
    if (MAP_TAXONOMY[t]) String(MAP_TAXONOMY[t]).split(',').forEach(add);
  }
  return out;
}

function taxonomyTerms(conditions, latestUserText, concernDescription) {
  const terms = new Set();
  const text = (latestUserText + ' ' + concernDescription).toLowerCase();
  // Match on a WORD BOUNDARY, not a bare substring. "ear" -> Otolaryngology was
  // firing on "searching" and "near", and "ent" fires on "patient", "different",
  // "recent" — so a plain primary-care question came back full of ENT providers.
  // Keywords are prefixes of real words, so a leading boundary plus free suffix
  // still matches "cardiolog" -> "cardiologist".
  for (const [kw, tax] of Object.entries(KEYWORD_TAXONOMY)) {
    if (kw.split(' ').every(w => new RegExp('(^|[^a-z])' + w).test(text))) terms.add(tax);
  }
  // Chat/keyword intent wins; fall back to profile conditions
  if (terms.size === 0) {
    for (const c of conditions) {
      const tax = CONDITION_TAXONOMY[String(c).toLowerCase()];
      if (tax) terms.add(tax);
    }
  }
  if (terms.size === 0) terms.add('Family Medicine');
  return [...terms].slice(0, 3);
}

async function nppesSearch(zip, taxonomy) {
  // NPPES accepts a full 5-digit ZIP OR a 5-digit + wildcard. Full ZIP is more reliable.
  // Try full ZIP first, then broaden to state if empty.
  const tryUrl = async (url) => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const data = await r.json();
      return data.results || [];
    } catch { return []; }
  };
  const enc = encodeURIComponent(taxonomy);
  const zip5 = zip.length === 5 ? zip : '';
  let results = [];
  if (zip5) {
    results = await tryUrl(`https://npiregistry.cms.hhs.gov/api/?version=2.1&postal_code=${zip5}&taxonomy_description=${enc}&limit=15`);
  }
  if (results.length < 3 && zip.length >= 3) {
    // Broaden to prefix wildcard (NPPES supports one wildcard at the end)
    const zipStar = zip.slice(0, 3) + '*';
    const extra = await tryUrl(`https://npiregistry.cms.hhs.gov/api/?version=2.1&postal_code=${zipStar}&taxonomy_description=${enc}&limit=15`);
    const seen = new Set(results.map(r => r.number));
    for (const r of extra) if (!seen.has(r.number)) results.push(r);
  }
  return results.slice(0, 8);
}

function compact(rec, taxonomy) {
  const basic = rec.basic || {};
  const addr = (rec.addresses || []).find(a => a.address_purpose === 'LOCATION') || (rec.addresses || [])[0] || {};
  const name = rec.enumeration_type === 'NPI-2'
    ? (basic.organization_name || 'Organization')
    : [basic.first_name, basic.last_name].filter(Boolean).join(' ');
  const primaryTax = (rec.taxonomies || []).find(t => t.primary) || {};
  return {
    npi: rec.number,
    name,
    specialty: primaryTax.desc || taxonomy,
    address: addr.address_1 || '',
    city: addr.city || '',
    state: addr.state || '',
    zip: (addr.postal_code || '').slice(0, 5),
    phone: addr.telephone_number || ''
  };
}

// Registered (claimed) listings for these NPIs, keyed by NPI. Providers supply the
// one thing NPPES cannot: which payers they actually take. Uses the service role
// because provider_profiles is RLS self-only; only non-identifying, provider-published
// fields are read, never the account id or anything patient-related.
async function registeredByNpi(env, npis) {
  const list = [...new Set((npis || []).filter(n => /^\d{10}$/.test(String(n))))].slice(0, 40);
  if (!list.length || !env.SUPABASE_SERVICE_ROLE_KEY) return {};
  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
  try {
    // Listings flagged by OIG exclusion screening must not be recommended to a
    // patient. Falls back if the review column has not been added yet.
    const sel = 'select=id,npi,accepting_new_patients,telehealth';
    let res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=in.(${list.join(',')})&review_status=not.eq.pending&${sel}`,
      { headers: svc, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=in.(${list.join(',')})&${sel}`,
        { headers: svc, signal: AbortSignal.timeout(5000) }
      );
    }
    if (!res.ok) return {};
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return {};

    const byId = {};
    const out = {};
    for (const r of rows) {
      byId[r.id] = r.npi;
      out[r.npi] = { accepting_new_patients: r.accepting_new_patients, telehealth: r.telehealth, payers: [] };
    }
    const ids = Object.keys(byId);
    if (ids.length) {
      const insRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_insurance?provider_id=in.(${ids.map(i => `"${i}"`).join(',')})&select=provider_id,payer_name`,
        { headers: svc, signal: AbortSignal.timeout(5000) }
      );
      if (insRes.ok) {
        for (const row of (await insRes.json()) || []) {
          const npi = byId[row.provider_id];
          if (npi && row.payer_name) out[npi].payers.push(row.payer_name);
        }
      }
    }
    return out;
  } catch {
    return {}; // enrichment is optional; never fail the whole match on it
  }
}

// Registered providers whose practice is in this ZIP. Uses the service role
// because provider_profiles is RLS self-only; only published fields are read.
async function claimedInZip(env, zip) {
  if (!/^\d{5}$/.test(String(zip || '')) || !env.SUPABASE_SERVICE_ROLE_KEY) return [];
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/provider_profiles?zip=eq.${zip}&review_status=not.eq.pending` +
      `&select=npi,org_name,first_name,last_name,address_line,city,state,zip,phone,taxonomy_desc&limit=20`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    return (Array.isArray(rows) ? rows : []).filter(r => /^\d{10}$/.test(String(r.npi || ''))).map(r => ({
      npi: String(r.npi),
      name: r.org_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Provider',
      specialty: r.taxonomy_desc || '',
      address: r.address_line || '',
      city: r.city || '', state: r.state || '', zip: r.zip || '',
      phone: r.phone || ''
    }));
  } catch { return []; }
}

// Server-side geocoding, Nominatim first (accurate for US), Photon fallback
async function geocode(provider) {
  const query = `${provider.address}, ${provider.city}, ${provider.state} ${provider.zip}`;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'ProviderPulse/1.0 (healthcare provider directory)' }, signal: AbortSignal.timeout(5000) }
    );
    const data = await r.json();
    if (Array.isArray(data) && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* try photon */ }
  try {
    const r = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await r.json();
    const c = data && data.features && data.features[0] && data.features[0].geometry && data.features[0].geometry.coordinates;
    if (c) return { lat: c[1], lng: c[0] };
  } catch { /* give up */ }
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  // Specialty browse: the patient picked a type of provider outright, so skip
  // condition inference entirely and never bring their health history into it.
  const specialty = String(body.specialty || '').trim().slice(0, 80);
  const bodyZip = String(body.zip || '').trim();

  // 1) Identify caller, must be a patient
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  if (((user.user_metadata || {}).role) !== 'patient') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Patient accounts only' }) };
  }

  // 2) Load the patient's own profile (RLS enforced)
  const profRes = await fetch(`${env.SUPABASE_URL}/rest/v1/patient_profiles?id=eq.${user.id}&select=*`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  const profRows = await profRes.json();
  const p = (Array.isArray(profRows) && profRows[0]) || {};

  // Extract ZIP from chat if patient typed one, overrides missing profile ZIP
  const allChatText = history.map(m => String(m.content || '')).join(' ');
  const zipInChat = (allChatText.match(/\b\d{5}\b/g) || []).pop();
  // An explicit ZIP from the specialty browser wins over the profile, which would
  // otherwise pin every search to their home ZIP.
  const effectiveZip = /^\d{5}$/.test(bodyZip) ? bodyZip
    : ((p.zip && /^\d{5}$/.test(p.zip)) ? p.zip : (zipInChat || ''));
  const zip3 = effectiveZip.slice(0, 3);

  // 3) Live NPPES search by ZIP area + taxonomy
  const latestUser = [...history].reverse().find(m => m.role === 'user');
  const terms = specialty
    ? [specialty]
    : taxonomyTerms(p.conditions || [], String((latestUser || {}).content || ''), p.concern_description || '');

  let providers = [];
  if (effectiveZip) {
    const batches = await Promise.all(terms.map(t => nppesSearch(effectiveZip, t).then(rs => rs.map(r => compact(r, t)))));
    const seen = new Set();
    for (const batch of batches) for (const pr of batch) {
      if (!seen.has(pr.npi)) { seen.add(pr.npi); providers.push(pr); }
    }
    // Rank by ZIP closeness: exact match first, then same 3-digit prefix
    providers.sort((a, b) => {
      const ax = a.zip === effectiveZip ? 0 : (a.zip.startsWith(zip3) ? 1 : 2);
      const bx = b.zip === effectiveZip ? 0 : (b.zip.startsWith(zip3) ? 1 : 2);
      return ax - bx;
    });
    // Claimed listings for this ZIP are pulled in DIRECTLY, not just looked up
    // among whatever NPPES happened to return. A verified provider is our best
    // data about a market; making them depend on a federal registry's ranking
    // meant a claimed listing could silently never appear.
    const localClaimed = await claimedInZip(env, effectiveZip);
    for (const c of localClaimed) {
      if (!seen.has(c.npi)) { seen.add(c.npi); providers.push(c); }
    }

    // Claimed listings first: a registered provider has actually told us whether they
    // take this patient's insurance, which NPPES can never say.
    const claimed = await registeredByNpi(env, providers.map(p => p.npi));
    const wantPayer = String(p.insurance_payer || '').trim().toLowerCase();
    for (const pr of providers) {
      const reg = claimed[pr.npi];
      if (!reg) continue;
      pr.registered = true;
      pr.accepting_new_patients = reg.accepting_new_patients;
      pr.telehealth = reg.telehealth;
      pr.payers = reg.payers;
      if (wantPayer && reg.payers.length) {
        pr.takes_your_insurance = reg.payers.some(x => String(x).trim().toLowerCase() === wantPayer);
      }
    }
    providers.sort((a, b) => {
      const score = x => (x.takes_your_insurance ? 0 : 1) + (x.registered ? 0 : 1);
      return score(a) - score(b);
    });

    providers = providers.slice(0, 3);
    // Geocode the 3 in parallel so exact map coordinates are ready before Claude answers
    const coords = await Promise.all(providers.map(geocode));
    for (let i = 0; i < providers.length; i++) {
      if (coords[i]) { providers[i].lat = coords[i].lat; providers[i].lng = coords[i].lng; }
    }
  }

  // 4) Ask Claude to present the matches
  // On a specialty browse the health history is not needed to answer, so it is
  // left out of the prompt entirely rather than sent and then ignored.
  const patientContext = specialty
    ? {
        first_name: p.first_name || 'there',
        zip: effectiveZip || 'unknown',
        insurance: p.insurance_payer || 'not specified',
        browsing_specialty: specialty
      }
    : {
        first_name: p.first_name || 'there',
        zip: p.zip || 'unknown',
        insurance: p.insurance_payer || 'not specified',
        conditions: p.conditions || [],
        concern_description: p.concern_description || ''
      };

  const system = `You are the ProviderPulse care navigator, a warm and concise assistant inside a healthcare provider directory.

PATIENT (greet them by first name):
${JSON.stringify(patientContext)}

PROVIDERS FOUND NEAR THEM in the national registry, already filtered to their area (${effectiveZip ? 'ZIP ' + effectiveZip : 'no ZIP on file'}) and relevant specialties (${terms.join(', ')}). This is the COMPLETE list, use ALL of them and never invent others:
${JSON.stringify(providers)}

Rules:
${specialty
  ? `- The patient chose to browse "${specialty}" providers directly and has NOT described any symptoms. Greet them by first name in a few words and go straight to the list. Do not mention health conditions, do not ask what is wrong, and do not ask them to describe symptoms.`
  : '- On the first message, greet the patient by first name and briefly, kindly acknowledge the health concerns they listed. One sentence, no drama.'}
- Present ALL providers in the list above, in the exact order given. For each: name, specialty, city, and phone.
- A single "Open these on the map" link appears automatically under your reply, which shows their whole area on the map with these providers highlighted. Do not list URLs yourself.
- If the list is empty AND no ZIP is on file, ask them to share their 5-digit ZIP so you can search.
- If the list is empty AND a ZIP was provided, tell them there are no matches in that area for that specialty and offer to try a different specialty or nearby area.
- Insurance: a provider with "takes_your_insurance": true has confirmed with us that they accept ${patientContext.insurance} — say so plainly and mention they are a verified listing. For anyone with "registered": true, their "payers" list is what they told us they accept. For everyone else insurance is simply unknown, so tell the patient to call ahead and confirm; never guess.
- If a provider has "accepting_new_patients": false, say they are not currently taking new patients. If true, mention that they are. Say nothing when the field is absent.
- You are not a doctor. Never diagnose, never recommend treatments or medications. If asked for medical advice, gently redirect to seeing a provider.
- The patient may have uploaded their own medical documents, and details from them can appear in the conditions or concerns above. Those are for choosing WHICH KIND of provider to search for, nothing else. Never interpret a test result, never say whether something is normal or worrying, never explain what a measurement means, and never guess at a diagnosis — even if the patient asks directly, and even if the answer seems obvious. Say that reading results is their doctor's job, and offer to help them find the right kind of doctor instead. If a document referred them to a specialty, help them find that specialty near them; that is carrying out their doctor's instruction, which is exactly what you are for.
- If the patient describes an emergency (chest pain, difficulty breathing, stroke signs, suicidal thoughts), tell them to call 911 or go to the nearest emergency room immediately.
- Keep every reply under 150 words. Plain text only, no markdown.`;

  const messages = history.length
    ? history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }))
    : [{ role: 'user', content: 'Hi' }];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system,
        messages
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error && aiData.error.message);
    const reply = (aiData.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    // zip + map_taxonomies let the frontend deep link the map to the whole search
    // area. map_taxonomies (not taxonomies) is what the map must filter on.
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ reply, providers, zip: effectiveZip, taxonomies: terms, map_taxonomies: mapTaxonomies(terms) })
    };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'The assistant is unavailable right now, please try again in a moment.' }) };
  }
};
