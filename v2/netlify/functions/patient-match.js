// patient-match.js
// AI care navigator for signed-in patients. Maps the patient's stated conditions
// (and any specialty mentioned in chat) to NPPES taxonomy searches scoped to their
// ZIP area, then has Claude present the top matches. Also returns the raw provider
// list so the frontend can offer "show on map" links.
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY

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

function taxonomyTerms(conditions, latestUserText, concernDescription) {
  const terms = new Set();
  const text = (latestUserText + ' ' + concernDescription).toLowerCase();
  for (const [kw, tax] of Object.entries(KEYWORD_TAXONOMY)) {
    if (text.includes(kw)) terms.add(tax);
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

async function nppesSearch(zip3, taxonomy) {
  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&postal_code=${zip3}*&taxonomy_description=${encodeURIComponent(taxonomy)}&limit=8`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await r.json();
    return data.results || [];
  } catch { return []; }
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
  const zip3 = (p.zip || '').slice(0, 3);

  // 3) Live NPPES search by ZIP area + taxonomy
  const latestUser = [...history].reverse().find(m => m.role === 'user');
  const terms = taxonomyTerms(p.conditions || [], String((latestUser || {}).content || ''), p.concern_description || '');

  let providers = [];
  if (zip3) {
    const batches = await Promise.all(terms.map(t => nppesSearch(zip3, t).then(rs => rs.map(r => compact(r, t)))));
    const seen = new Set();
    for (const batch of batches) for (const pr of batch) {
      if (!seen.has(pr.npi)) { seen.add(pr.npi); providers.push(pr); }
    }
    providers = providers.slice(0, 15);
  }

  // 4) Ask Claude to present the matches
  const patientContext = {
    first_name: p.first_name || 'there',
    zip: p.zip || 'unknown',
    insurance: p.insurance_payer || 'not specified',
    conditions: p.conditions || [],
    concern_description: p.concern_description || ''
  };

  const system = `You are the ProviderPulse care navigator, a warm and concise assistant inside a healthcare provider directory.

PATIENT (greet them by first name):
${JSON.stringify(patientContext)}

PROVIDERS FOUND NEAR THEM in the national registry, already filtered to their area (${zip3 ? 'ZIP prefix ' + zip3 : 'no ZIP on file'}) and relevant specialties (${terms.join(', ')}). This is the COMPLETE list, never invent others:
${JSON.stringify(providers)}

Rules:
- On the first message, greet the patient by first name and briefly, kindly acknowledge the health concerns they listed. One sentence, no drama.
- Recommend the top 3 best-fitting providers. For each: name, specialty, city, and phone.
- After the recommendations, mention they can tap "Show on map" below to see these locations.
- If the list is empty, say no matches were found in their immediate area yet and suggest they try the map search or ask you for a different specialty. If no ZIP is on file, ask them to add their ZIP code to their profile.
- Insurance acceptance is not in this data, so advise calling ahead to confirm the provider takes ${patientContext.insurance}.
- You are not a doctor. Never diagnose, never recommend treatments or medications. If asked for medical advice, gently redirect to seeing a provider.
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
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply, providers: providers.slice(0, 3) }) };
  } catch (e) {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'The assistant is unavailable right now, please try again in a moment.' }) };
  }
};
