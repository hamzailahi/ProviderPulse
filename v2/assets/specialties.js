// specialties.js
// Moved verbatim out of register-patient.html. Each entry is
// [label, mapTerms, nppesTerm] and the two vocabularies are NOT interchangeable:
//
//   mapTerms  -> matched against clinics.primary_taxonomy, which stores
//                role-suffixed values ("Internal Medicine Physician",
//                "General Practice Dentistry"). Used to filter the map.
//   nppesTerm -> sent to the NPPES registry, which uses the bare description
//                ("Internal Medicine"). Used to search for providers.
//
// Mixing them up is a real bug that has shipped before; see CLAUDE.md.
// Every nppesTerm here was verified to return live results from the registry —
// note NPPES calls it "Dietitian", not "Registered Dietitian", which returns none.
//
// Frozen, hand-verified data. Do not "tidy" these strings.

const SPECIALTIES = [
  ['Primary care / family doctor', 'Family Medicine Physician,Internal Medicine Physician,General Practice Physician,Primary Care Clinic/Center,Federally Qualified Health Center,Family Nurse Practitioner,Adult Health Nurse Practitioner,Community Health Clinic/Center,Family Medicine,Internal Medicine', 'Family Medicine'],
  ['Pediatrics (children)', 'Pediatrics Physician,Pediatric Nurse Practitioner,Pediatric Adolescent Medicine,Pediatrics', 'Pediatrics'],
  ["Women's health / OB-GYN", 'Obstetrics & Gynecology Physician,Obstetrics Physician,Gynecology Physician,Advanced Practice Midwife,Maternal & Fetal Medicine,Obstetrics & Gynecology', 'Obstetrics & Gynecology'],
  ['Mental health & counseling', 'Psychiatry Physician,Psychologist,Neuropsychologist,Counselor,Clinical Social Worker,Marriage & Family Therapist,Mental Health,Behavioral Health,Behavior Analyst,Community/Behavioral Health Agency,Psychiatry & Mental Health', 'Psychiatry'],
  ['Dental', 'Dentist,Dentistry,Dental Clinic/Center,Endodontics', 'Dentist'],
  ['Eye care', 'Optometrist,Ophthalmology Physician,Eyewear Supplier,Vision & Eye Care', 'Optometrist'],
  ['Chiropractic', 'Chiropractor,Chiropractic', 'Chiropractor'],
  ['Physical & occupational therapy', 'Physical Therapist,Physical Therapy Clinic/Center,Occupational Therapist,Occupational Therapy Assistant,Physical Medicine & Rehabilitation Physician,Rehabilitation Clinic/Center,Rehabilitation Hospital,Therapy & Rehabilitation', 'Physical Therapist'],
  ['Orthopedics & sports injury', 'Orthopaedic Surgery Physician,Sports Medicine,Surgery of the Hand,Surgery', 'Orthopaedic Surgery'],
  ['Heart / cardiology', 'Cardiovascular Disease Physician,Cardiology,Thoracic Surgery', 'Cardiovascular Disease'],
  ['Skin / dermatology', 'Dermatology Physician,Dermatology', 'Dermatology'],
  ['Allergy & immunology', 'Allergy Physician,Allergy & Immunology Physician', 'Allergy & Immunology'],
  ['Lung, breathing & sleep', 'Pulmonary Disease Physician,Sleep Disorder Diagnostic Clinic/Center,Sleep Medicine,Pulmonary', 'Pulmonary Disease'],
  ['Digestive / gastroenterology', 'Gastroenterology Physician,Endoscopy Clinic/Center,Gastroenterology', 'Gastroenterology'],
  ['Kidney / nephrology', 'Nephrology Physician,End-Stage Renal Disease,Nephrology', 'Nephrology'],
  ['Diabetes & hormones', 'Endocrinology', 'Endocrinology'],
  ['Cancer care / oncology', 'Hematology & Oncology Physician,Radiation Oncology Physician,Gynecologic Oncology Physician,Oncology', 'Hematology & Oncology'],
  ['Arthritis / rheumatology', 'Rheumatology Physician,Rheumatology', 'Rheumatology'],
  ['Brain & nerves / neurology', 'Neurology Physician,Neurological Surgery Physician,Clinical Neurophysiology,Neurology', 'Neurology'],
  ['Ear, nose & throat', 'Otolaryngology Physician,Otolaryngology', 'Otolaryngology'],
  ['Urology', 'Urology Physician,Urology', 'Urology'],
  ['Foot & ankle / podiatry', 'Podiatrist,Podiatric Clinic/Center,Podiatry', 'Podiatrist'],
  ['Pain management', 'Pain Medicine Physician,Pain Medicine (Anesthesiology) Physician,Pain Medicine', 'Pain Medicine'],
  ['Plastic & reconstructive surgery', 'Plastic Surgery Physician,Plastic and Reconstructive Surgery Physician,Plastic Surgery', 'Plastic Surgery'],
  ['Speech & language therapy', 'Speech-Language Pathologist,Speech-Language Assistant,Hearing and Speech Clinic/Center,Speech & Hearing', 'Speech-Language Pathologist'],
  ['Nutrition & dietitian', 'Registered Dietitian,Nutritionist,Nutrition', 'Dietitian'],
  ['Acupuncture, massage & naturopathy', 'Acupuncturist,Massage Therapist,Naturopath,Music Therapist,Alternative Medicine', 'Acupuncturist'],
  ['Urgent care & emergency', 'Urgent Care Clinic/Center,Emergency Care Clinic/Center,Emergency Medicine Physician,General Acute Care Hospital,Critical Access Hospital,Ambulatory Surgical Clinic/Center,Emergency Services', 'Emergency Medicine'],
  ['Imaging & lab', 'Diagnostic Radiology Physician,Radiology Clinic/Center,Body Imaging,Clinical Medical Laboratory,Physiological Laboratory,Radiology & Imaging,Pathology', 'Radiology'],
  ['Pharmacy', 'Pharmacy,Pharmacist', 'Pharmacy'],
  ['Home health & in-home care', 'Home Health Agency,Home Health Aide,Home Health Registered Nurse,In Home Supportive Care Agency,Nursing Care Agency,Community Based Hospice Care Agency,Nursing', 'Home Health'],
  ['Nursing & assisted living', 'Skilled Nursing Facility,Assisted Living Facility,Adult Care Home Facility,Nursing', 'Skilled Nursing Facility'],
  ['Medical equipment & supplies', 'Durable Medical Equipment,Prosthetic/Orthotic Supplier,Customized Equipment,Hearing  Aid Equipment,Medical Equipment & Supplies', 'Durable Medical Equipment & Medical Supplies'],
  // Added 2026-10-09 with the NUCC code table (taxonomy codes phase 3). Their
  // nppesTerms are official NUCC classification names, NOT yet verified live
  // against the registry (it was unreachable when they were added).
  ['Hearing & audiology', 'Audiologist,Hearing Instrument Specialist,Audiology Assistant,Hearing Aid Equipment', 'Audiologist'],
  ['Behavior therapy (ABA)', 'Behavior Technician,Behavior Analyst,Assistant Behavior Analyst', 'Behavior Analyst'],
  ['Nursing (RN, LPN)', 'Registered Nurse,Licensed Practical Nurse,Licensed Vocational Nurse,Clinical Nurse Specialist', 'Registered Nurse'],
  ['Physician assistant', 'Physician Assistant', 'Physician Assistant'],
  ['Care coordination & community health', 'Case Manager/Care Coordinator,Community Health Worker,Health Educator,Prevention Professional', 'Case Manager/Care Coordinator'],
  ['Hospital-based clinicians', 'Hospitalist,Anesthesiology Physician,Certified Registered Nurse Anesthetist,Acute Care Nurse Practitioner,Critical Care Medicine', 'Hospitalist'],
  ['General surgery', 'Surgery Physician,Vascular Surgery Physician,Colon & Rectal Surgery Physician,Transplant Surgery Physician', 'Surgery'],
  ['Infectious disease', 'Infectious Disease Physician', 'Infectious Disease'],
  ['Genetics & genetic counseling', 'Genetic Counselor,Medical Genetics', 'Medical Genetics'],
  ['Hospice & palliative care', 'Hospice and Palliative Medicine,Community Based Hospice Care Agency,Hospice Care', 'Hospice and Palliative Medicine'],
  ['Other health services', 'Specialist,Technician,Interpreter,Driver', 'Specialist']
];

// Every surface finds a specialty's listings by NUCC code
// (TaxonomyMap.codesFor(label), from the reviewed table in
// supabase/reference/taxonomy-overrides.csv). mapTerms remain only for what
// still matches by name: claimed listings' self-reported specialty, the
// dashboard's #tax= deep links and the navigator.
//
// SCORED_SPECIALTIES is what the market model scores (market-score, the
// assistant, the benchmark builder, the demand trainer). Four categories are
// searchable but not scored. Nobody opens a practice in the first two, so an
// "opportunity" for them would mean nothing. Nurses are almost always
// employed, and most physician assistant codes already count toward primary
// care's supply, so scoring them separately would double-report (the user's
// call, 2026-10-11).
var NOT_SCORED = ['Hospital-based clinicians', 'Other health services', 'Nursing (RN, LPN)', 'Physician assistant'];
var SCORED_SPECIALTIES = SPECIALTIES.filter(function (s) { return NOT_SCORED.indexOf(s[0]) === -1; });

if (typeof window !== 'undefined') window.SCORED_SPECIALTIES = SCORED_SPECIALTIES;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPECIALTIES;
  module.exports.SCORED = SCORED_SPECIALTIES;
  module.exports.NOT_SCORED = NOT_SCORED;
}
