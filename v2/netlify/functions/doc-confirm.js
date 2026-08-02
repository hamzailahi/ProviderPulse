// doc-confirm.js
// Applies the facts a patient has APPROVED from an extracted document to their
// own profile. This is the only path by which anything read out of a document
// reaches patient_profiles — doc-extract.js deliberately cannot write there.
//
// The patient decides. Facts arrive as accept/reject decisions keyed by fact id;
// anything not accepted is marked rejected and never applied.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DOCUMENT_UPLOAD_ENABLED

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// The navigator maps profile conditions through CONDITION_TAXONOMY, whose keys are
// this fixed list. A free-text condition off a lab report ("essential hypertension")
// would never match, so map it onto the existing vocabulary where we can and keep
// the rest as narrative instead of silently dropping it.
const CONDITION_ALIASES = [
  [/diabet/i,                                    'Diabetes'],
  [/hypertens|high blood pressure/i,             'High blood pressure'],
  [/coronary|heart (disease|failure)|cardiac/i,  'Heart disease'],
  [/asthma|copd|emphysema/i,                     'Asthma / COPD'],
  [/depress|anxiet|bipolar|ptsd/i,               'Mental health'],
  [/arthrit/i,                                   'Arthritis'],
  [/back pain|joint pain|lumbar|sciatic/i,       'Back or joint pain'],
  [/cancer|carcinoma|oncolog|tumou?r/i,          'Cancer care'],
  [/kidney|renal|nephro/i,                       'Kidney disease'],
  [/pregnan|prenatal|obstetric/i,                'Pregnancy / prenatal'],
  [/obes|weight management|bariatric/i,          'Weight management'],
  [/sleep apnea|insomnia|sleep disorder/i,       'Sleep disorders']
];

const KNOWN_CONDITIONS = [
  'Diabetes', 'High blood pressure', 'Heart disease', 'Asthma / COPD',
  'Mental health', 'Arthritis', 'Back or joint pain', 'Cancer care',
  'Kidney disease', 'Pregnancy / prenatal', 'Pediatric care', 'Weight management',
  'Sleep disorders', 'Preventive care / checkup'
];

function toKnownCondition(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  const exact = KNOWN_CONDITIONS.find(c => c.toLowerCase() === v.toLowerCase());
  if (exact) return exact;
  for (const [re, label] of CONDITION_ALIASES) if (re.test(v)) return label;
  return null;
}

async function audit(env, row) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(row)
    });
  } catch (e) { /* never block on audit */ }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  if (env.DOCUMENT_UPLOAD_ENABLED !== 'true') {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Document upload is not available yet' }) };
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const accepted = [...new Set((Array.isArray(body.accept) ? body.accept : []).map(String))].slice(0, 40);
  const rejected = [...new Set((Array.isArray(body.reject) ? body.reject : []).map(String))].slice(0, 40);
  if (!accepted.length && !rejected.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Nothing to apply' }) };
  }

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  if (((user.user_metadata || {}).role) !== 'patient') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Patient accounts only' }) };
  }

  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
  const idList = ids => `(${ids.map(i => `"${i}"`).join(',')})`;

  // Load only this patient's facts. The service role bypasses RLS, so filtering on
  // patient_id is what prevents one patient applying another's records.
  const factsRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_document_facts?id=in.${idList(accepted.concat(rejected))}&patient_id=eq.${user.id}&select=id,fact_type,value,document_id`,
    { headers: svc }
  );
  const facts = factsRes.ok ? await factsRes.json() : [];
  if (!Array.isArray(facts) || !facts.length) {
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Those items are no longer available' }) };
  }
  const acceptedFacts = facts.filter(f => accepted.includes(String(f.id)));

  // Mark decisions
  if (accepted.length) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/patient_document_facts?id=in.${idList(accepted)}&patient_id=eq.${user.id}`, {
      method: 'PATCH', headers: svc, body: JSON.stringify({ status: 'accepted' })
    }).catch(() => {});
  }
  if (rejected.length) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/patient_document_facts?id=in.${idList(rejected)}&patient_id=eq.${user.id}`, {
      method: 'PATCH', headers: svc, body: JSON.stringify({ status: 'rejected' })
    }).catch(() => {});
  }

  // Apply accepted facts to the profile
  const profRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_profiles?id=eq.${user.id}&select=conditions,concern_description`,
    { headers: svc }
  );
  const profRows = profRes.ok ? await profRes.json() : [];
  const prof = (Array.isArray(profRows) && profRows[0]) || {};

  const conditions = new Set(Array.isArray(prof.conditions) ? prof.conditions : []);
  const referrals = [];
  const unmapped = [];

  for (const f of acceptedFacts) {
    if (f.fact_type === 'condition') {
      const mapped = toKnownCondition(f.value);
      if (mapped) conditions.add(mapped);
      else unmapped.push(f.value);
    } else if (f.fact_type === 'referral') {
      referrals.push(f.value);
    }
    // medication / allergy / provider / date are kept on the document record for
    // the patient's reference; they do not drive provider matching, so they are
    // deliberately not written into the search profile.
  }

  // Referrals are the highest-signal thing a document carries — a specialty a
  // doctor already told this patient to see. Surface it in the free-text field the
  // navigator reads so the next search finds that specialty.
  let concern = String(prof.concern_description || '').trim();
  const additions = [];
  if (referrals.length) additions.push(`Referred to: ${referrals.join(', ')}.`);
  if (unmapped.length) additions.push(`Also noted: ${unmapped.join(', ')}.`);
  if (additions.length) {
    const add = additions.join(' ');
    if (!concern.includes(add)) concern = (concern ? concern + ' ' : '') + add;
    concern = concern.slice(0, 1000);
  }

  const patch = {};
  if (conditions.size) patch.conditions = [...conditions].slice(0, 30);
  if (additions.length) patch.concern_description = concern;

  if (Object.keys(patch).length) {
    const upRes = await fetch(`${env.SUPABASE_URL}/rest/v1/patient_profiles?id=eq.${user.id}`, {
      method: 'PATCH', headers: { ...svc, Prefer: 'return=representation' }, body: JSON.stringify(patch)
    });
    if (!upRes.ok) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not update your profile. Nothing was changed.' }) };
    }
  }

  // Field names and counts only — never the clinical values themselves
  await audit(env, {
    actor: user.id, actor_role: 'patient', action: 'document_facts_applied', ip,
    detail: {
      document_id: acceptedFacts[0] ? acceptedFacts[0].document_id : null,
      accepted: acceptedFacts.length, rejected: rejected.length,
      fields: Object.keys(patch)
    }
  });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      ok: true,
      applied: acceptedFacts.length,
      conditions: patch.conditions || null,
      referrals,
      message: referrals.length
        ? `Added to your profile. Want to find ${referrals[0]} providers near you?`
        : 'Added to your profile.'
    })
  };
};
