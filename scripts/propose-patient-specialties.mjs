#!/usr/bin/env node
// Taxonomy codes phase 3, step 1: PROPOSE which patient specialties each NUCC
// code belongs to, for the user to review before patient search switches to
// codes. This script is a drafting aid, not the source of truth: once the
// proposal is approved, its assignments are written into
// supabase/reference/taxonomy-overrides.csv (patient_specialties, one explicit
// row per code) and this file's rules stop mattering.
//
// Rules are keyed on the official NUCC Classification, then Specialization,
// never on keywords in a name. Every visible Individual code must end up in at
// least one specialty (the spec's coverage rule); the script exits non-zero if
// one does not. Organization codes are proposed where a specialty plainly
// fits and may stay empty.
//
// Usage: node scripts/propose-patient-specialties.mjs [--out FILE]
// Writes supabase/reference/patient-specialties-proposal.csv by default.

import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseCsv, parseNucc, parseOverrides } from './lib/taxonomy-map.mjs';

const require = createRequire(import.meta.url);
const SPECIALTIES = require('../v2/assets/specialties.js');
const REF = new URL('../supabase/reference/', import.meta.url);

// --- the proposed specialty list -------------------------------------------
// The 33 existing labels keep their wording (benchmarks and saved My market
// choices are keyed by label) except "Speech & hearing", which the spec splits.
const S = {
  PC: 'Primary care / family doctor', PED: 'Pediatrics (children)', WH: "Women's health / OB-GYN",
  MH: 'Mental health & counseling', DEN: 'Dental', EYE: 'Eye care', CHI: 'Chiropractic',
  PT: 'Physical & occupational therapy', ORTHO: 'Orthopedics & sports injury', CARD: 'Heart / cardiology',
  DERM: 'Skin / dermatology', ALLR: 'Allergy & immunology', LUNG: 'Lung, breathing & sleep',
  GI: 'Digestive / gastroenterology', KID: 'Kidney / nephrology', ENDO: 'Diabetes & hormones',
  ONC: 'Cancer care / oncology', RHEUM: 'Arthritis / rheumatology', NEURO: 'Brain & nerves / neurology',
  ENT: 'Ear, nose & throat', URO: 'Urology', POD: 'Foot & ankle / podiatry', PAIN: 'Pain management',
  PLAS: 'Plastic & reconstructive surgery', SPEECH: 'Speech & language therapy', NUTR: 'Nutrition & dietitian',
  ALT: 'Acupuncture, massage & naturopathy', URG: 'Urgent care & emergency', IMG: 'Imaging & lab',
  PHARM: 'Pharmacy', HOME: 'Home health & in-home care', SNF: 'Nursing & assisted living',
  DME: 'Medical equipment & supplies',
  // new
  HEAR: 'Hearing & audiology', ABA: 'Behavior therapy (ABA)', RN: 'Nursing (RN, LPN)',
  PA: 'Physician assistant', CARE: 'Care coordination & community health', HOSP: 'Hospital-based clinicians',
  SURG: 'General surgery', ID: 'Infectious disease', GEN: 'Genetics & genetic counseling',
  PALL: 'Hospice & palliative care', OTHER: 'Other health services'
};
const NEW = {
  HEAR: 'split out of "Speech & hearing" (spec)', ABA: 'spec: Behavior Technicians and Behavior Analysts',
  RN: 'spec: Nursing (RN, LPN)', PA: 'spec: Physician assistant', CARE: 'spec: Care coordination (Case Managers), plus community health workers',
  HOSP: 'your choice for hospital-only NPs; also hospitalists, anesthesia, critical care',
  SURG: 'general surgeons were only reachable through the bare term "Surgery" under Orthopedics',
  ID: 'infectious disease physicians had no specialty', GEN: 'medical geneticists and genetic counselors had no specialty',
  PALL: 'hospice and palliative physicians had no specialty',
  OTHER: 'explicit home for visible non-clinical individual codes (technicians, interpreters, drivers, research staff); see Decisions'
};
const RENAMED = { SPEECH: 'was "Speech & hearing"' };

// --- rules -------------------------------------------------------------------
// R[classification] = { '': default, '<specialization>': override }. A value
// is a list of S keys, optionally with a trailing '?' item marking the row as
// needing the user's decision, and an optional note after '#'.
const R = {};
const rule = (cls, def, specs = {}) => { R[cls] = { '': def, ...specs }; };

// Group (individual section, but these are practice NPIs)
rule('Multi-Specialty', ['PC', '?', '#a multi-specialty group NPI; primary care is the usual front door']);
rule('Single Specialty', ['OTHER', '?', '#the code does not say which specialty']);

// Allopathic & Osteopathic Physicians
rule('Allergy & Immunology', ['ALLR']);
rule('Anesthesiology', ['HOSP'], { 'Addiction Medicine': ['MH'], 'Critical Care Medicine': ['HOSP'],
  'Hospice and Palliative Medicine': ['PALL'], 'Pain Medicine': ['PAIN'], 'Pediatric Anesthesiology': ['HOSP', 'PED'],
  'Physician Nutrition Specialist': ['NUTR'] });
rule('Clinical Pharmacology', ['PHARM', '?', '#physicians who study drug effects; rarely patient-facing']);
rule('Colon & Rectal Surgery', ['GI', 'SURG']);
rule('Dermatology', ['DERM'], { 'Dermatopathology': ['DERM', 'IMG'], 'Pediatric Dermatology': ['DERM', 'PED'] });
rule('Electrodiagnostic Medicine', ['NEURO']);
rule('Emergency Medicine', ['URG'], { 'Hospice and Palliative Medicine': ['PALL'], 'Pediatric Emergency Medicine': ['URG', 'PED'],
  'Sports Medicine': ['ORTHO', 'URG'], 'Undersea and Hyperbaric Medicine': ['URG', '?', '#hyperbaric oxygen, often wound care'] });
rule('Family Medicine', ['PC'], { 'Addiction Medicine': ['PC', 'MH'], 'Adolescent Medicine': ['PC', 'PED'],
  'Diabetology': ['PC', 'ENDO'], 'Hospice and Palliative Medicine': ['PALL'], 'Obesity Medicine': ['PC', 'NUTR'],
  'Physician Nutrition Specialist': ['NUTR', 'PC'], 'Sleep Medicine': ['LUNG'], 'Sports Medicine': ['ORTHO', 'PC'] });
rule('General Practice', ['PC']);
rule('Hospitalist', ['HOSP']);
rule('Independent Medical Examiner', ['OTHER', '?', '#performs exams for insurers and courts, not care']);
rule('Integrative Medicine', ['PC', 'ALT']);
rule('Internal Medicine', ['PC'], {
  'Addiction Medicine': ['MH'], 'Adolescent Medicine': ['PC', 'PED'], 'Adult Congenital Heart Disease': ['CARD'],
  'Advanced Heart Failure and Transplant Cardiology': ['CARD'], 'Allergy & Immunology': ['ALLR'], 'Cardiovascular Disease': ['CARD'],
  'Clinical & Laboratory Immunology': ['ALLR'], 'Clinical Cardiac Electrophysiology': ['CARD'], 'Critical Care Medicine': ['HOSP'],
  'Diabetology': ['ENDO'], 'Endocrinology, Diabetes & Metabolism': ['ENDO'], 'Gastroenterology': ['GI'], 'Geriatric Medicine': ['PC'],
  'Hematology': ['ONC'], 'Hematology & Oncology': ['ONC'], 'Hepatology': ['GI'], 'Hospice and Palliative Medicine': ['PALL'],
  'Hypertension Specialist': ['CARD'], 'Infectious Disease': ['ID'], 'Interventional Cardiology': ['CARD'],
  'Magnetic Resonance Imaging (MRI)': ['IMG'], 'Medical Oncology': ['ONC'], 'Nephrology': ['KID'], 'Obesity Medicine': ['PC', 'NUTR'],
  'Physician Nutrition Specialist': ['NUTR'], 'Pulmonary Disease': ['LUNG'], 'Rheumatology': ['RHEUM'], 'Sleep Medicine': ['LUNG'],
  'Sports Medicine': ['ORTHO'], 'Transplant Hepatology': ['GI'] });
rule('Legal Medicine', ['OTHER', '?', '#medico-legal work, not care']);
rule('Medical Genetics', ['GEN'], { 'Molecular Genetic Pathology': ['GEN', 'IMG'] });
rule('Neurological Surgery', ['NEURO']);
rule('Neuromusculoskeletal Medicine & OMM', ['ORTHO', 'PAIN', '?', '#osteopathic manipulation for musculoskeletal pain']);
rule('Neuromusculoskeletal Medicine, Sports Medicine', ['ORTHO']);
rule('Nuclear Medicine', ['IMG'], { 'Nuclear Cardiology': ['IMG', 'CARD'] });
rule('Obstetrics & Gynecology', ['WH'], { 'Critical Care Medicine': ['WH', 'HOSP'], 'Gynecologic Oncology': ['WH', 'ONC'],
  'Hospice and Palliative Medicine': ['PALL'], 'Obesity Medicine': ['WH', 'NUTR'],
  'Urogynecology and Reconstructive Pelvic Surgery': ['WH', 'URO'] });
rule('Ophthalmology', ['EYE'], { 'Ophthalmic Plastic and Reconstructive Surgery': ['EYE', 'PLAS'],
  'Pediatric Ophthalmology and Strabismus Specialist': ['EYE', 'PED'] });
rule('Oral & Maxillofacial Surgery', ['DEN']);
rule('Orthopaedic Surgery', ['ORTHO'], { 'Foot and Ankle Surgery': ['ORTHO', 'POD'], 'Pediatric Orthopaedic Surgery': ['ORTHO', 'PED'] });
rule('Otolaryngology', ['ENT'], { 'Facial Plastic Surgery': ['ENT', 'PLAS'], 'Otolaryngology/Facial Plastic Surgery': ['ENT', 'PLAS'],
  'Plastic Surgery within the Head & Neck': ['ENT', 'PLAS'], 'Otolaryngic Allergy': ['ENT', 'ALLR'],
  'Otology & Neurotology': ['ENT', 'HEAR'], 'Pediatric Otolaryngology': ['ENT', 'PED'], 'Sleep Medicine': ['ENT', 'LUNG'] });
rule('Pain Medicine', ['PAIN']);
rule('Pathology', ['IMG'], { 'Clinical Informatics': ['OTHER'], 'Forensic Pathology': ['OTHER'] });
rule('Pediatrics', ['PED', 'PC'], {
  'Child Abuse Pediatrics': ['PED'], 'Clinical & Laboratory Immunology': ['PED', 'ALLR'],
  'Developmental - Behavioral Pediatrics': ['PED', 'MH'], 'Hospice and Palliative Medicine': ['PED', 'PALL'],
  'Medical Toxicology': ['PED', 'URG'], 'Neonatal-Perinatal Medicine': ['PED', 'HOSP'], 'Neurodevelopmental Disabilities': ['PED', 'NEURO'],
  'Obesity Medicine': ['PED', 'NUTR'], 'Pediatric Allergy/Immunology': ['PED', 'ALLR'], 'Pediatric Cardiology': ['PED', 'CARD'],
  'Pediatric Critical Care Medicine': ['PED', 'HOSP'], 'Pediatric Emergency Medicine': ['PED', 'URG'],
  'Pediatric Endocrinology': ['PED', 'ENDO'], 'Pediatric Gastroenterology': ['PED', 'GI'], 'Pediatric Hematology-Oncology': ['PED', 'ONC'],
  'Pediatric Infectious Diseases': ['PED', 'ID'], 'Pediatric Nephrology': ['PED', 'KID'], 'Pediatric Pulmonology': ['PED', 'LUNG'],
  'Pediatric Rheumatology': ['PED', 'RHEUM'], 'Pediatric Transplant Hepatology': ['PED', 'GI'], 'Physician Nutrition Specialist': ['PED', 'NUTR'],
  'Sleep Medicine': ['PED', 'LUNG'], 'Sports Medicine': ['PED', 'ORTHO'] });
rule('Phlebology', ['SURG', 'CARD', '?', '#vein specialists']);
rule('Physical Medicine & Rehabilitation', ['PT'], { 'Brain Injury Medicine': ['PT', 'NEURO'], 'Hospice and Palliative Medicine': ['PALL'],
  'Neuromuscular Medicine': ['PT', 'NEURO'], 'Pain Medicine': ['PAIN', 'PT'], 'Pediatric Rehabilitation Medicine': ['PT', 'PED'],
  'Spinal Cord Injury Medicine': ['PT', 'NEURO'], 'Sports Medicine': ['ORTHO', 'PT'] });
rule('Plastic Surgery', ['PLAS'], { 'Surgery of the Hand': ['PLAS', 'ORTHO'] });
rule('Preventive Medicine', ['PC'], { 'Addiction Medicine': ['MH'], 'Aerospace Medicine': ['OTHER', '?', '#pilots and astronauts'],
  'Clinical Informatics': ['OTHER'], 'Medical Toxicology': ['URG'], 'Obesity Medicine': ['PC', 'NUTR'],
  'Occupational Medicine': ['PC', '?', '#work injuries and employment physicals'], 'Sports Medicine': ['ORTHO'],
  'Undersea and Hyperbaric Medicine': ['URG', '?', '#hyperbaric oxygen, often wound care'] });
rule('Psychiatry & Neurology', ['MH'], {
  'Addiction Medicine': ['MH'], 'Addiction Psychiatry': ['MH'], 'Behavioral Neurology & Neuropsychiatry': ['NEURO', 'MH'],
  'Brain Injury Medicine': ['NEURO'], 'Child & Adolescent Psychiatry': ['MH', 'PED'], 'Clinical Neurophysiology': ['NEURO'],
  'Diagnostic Neuroimaging': ['NEURO', 'IMG'], 'Epilepsy': ['NEURO'], 'Forensic Psychiatry': ['MH'], 'Geriatric Psychiatry': ['MH'],
  'Hospice and Palliative Medicine': ['PALL'], 'Neurocritical Care': ['NEURO', 'HOSP'], 'Neurodevelopmental Disabilities': ['NEURO', 'PED'],
  'Neurology': ['NEURO'], 'Neurology with Special Qualifications in Child Neurology': ['NEURO', 'PED'], 'Neuromuscular Medicine': ['NEURO'],
  'Obesity Medicine': ['PC', 'NUTR'], 'Pain Medicine': ['PAIN'], 'Psychiatry': ['MH'], 'Psychosomatic Medicine': ['MH'],
  'Sleep Medicine': ['LUNG', 'NEURO'], 'Sports Medicine': ['ORTHO'], 'Vascular Neurology': ['NEURO'] });
rule('Radiology', ['IMG'], { 'Hospice and Palliative Medicine': ['PALL'], 'Radiation Oncology': ['ONC', 'IMG'],
  'Therapeutic Radiology': ['ONC', 'IMG'], 'Pediatric Radiology': ['IMG', 'PED'] });
rule('Surgery', ['SURG'], { 'Hospice and Palliative Medicine': ['PALL'], 'Pediatric Surgery': ['SURG', 'PED'],
  'Physician Nutrition Specialist': ['NUTR', 'SURG'], 'Plastic and Reconstructive Surgery': ['PLAS'], 'Surgery of the Hand': ['ORTHO', 'PLAS'],
  'Surgical Critical Care': ['HOSP', 'SURG'], 'Surgical Oncology': ['ONC', 'SURG'], 'Trauma Surgery': ['HOSP', 'SURG'],
  'Vascular Surgery': ['SURG', 'CARD'] });
rule('Thoracic Surgery (Cardiothoracic Vascular Surgery)', ['CARD', 'SURG']);
rule('Transplant Surgery', ['SURG']);
rule('Urology', ['URO'], { 'Urogynecology and Reconstructive Pelvic Surgery': ['URO', 'WH'], 'Pediatric Urology': ['URO', 'PED'] });

// Behavioral Health & Social Service Providers
rule('Assistant Behavior Analyst', ['ABA']);
rule('Behavior Technician', ['ABA']);
rule('Behavior Analyst', ['ABA', '?', '#today under Mental health; the spec moves it to ABA. Keep it in both?']);
rule('Clinical Neuropsychologist', ['MH', 'NEURO']);
rule('Counselor', ['MH'], { 'School': ['MH', 'PED'] });
rule('Drama Therapist', ['MH']);
rule('Marriage & Family Therapist', ['MH']);
rule('Poetry Therapist', ['MH']);
rule('Psychoanalyst', ['MH']);
rule('Psychologist', ['MH'], { 'Clinical Child & Adolescent': ['MH', 'PED'], 'Educational': ['MH', 'PED'], 'School': ['MH', 'PED'] });
rule('Social Worker', ['CARE', 'MH', '?', '#non-clinical social workers do case work, not therapy'],
  { 'Clinical': ['MH'], 'School': ['CARE', 'PED'] });

rule('Chiropractor', ['CHI']);

// Dental
rule('Advanced Practice Dental Therapist', ['DEN']);
rule('Dental Assistant', ['DEN']);
rule('Dental Hygienist', ['DEN']);
rule('Dental Laboratory Technician', ['DEN', '?', '#makes crowns and dentures; patients do not book them']);
rule('Dental Therapist', ['DEN']);
rule('Dentist', ['DEN'], { 'Pediatric Dentistry': ['DEN', 'PED'] });
rule('Denturist', ['DEN']);

// Dietary & Nutritional
rule('Dietary Manager', ['NUTR', '?', '#runs food service in facilities']);
rule('Dietetic Technician, Registered', ['NUTR']);
rule('Dietitian, Registered', ['NUTR'], { 'Nutrition, Pediatric': ['NUTR', 'PED'] });
rule('Nutritionist', ['NUTR']);

// Emergency Medical Service Providers
rule('Community Paramedic', ['URG', 'HOME']);
rule('Emergency Medical Technician, Basic', ['URG']);
rule('Emergency Medical Technician, Intermediate', ['URG']);
rule('Emergency Medical Technician, Paramedic', ['URG']);
rule('Personal Emergency Response Attendant', ['HOME']);

// Eye and Vision
rule('Optometrist', ['EYE'], { 'Pediatrics': ['EYE', 'PED'] });
rule('Technician/Technologist', ['EYE']);   // eye-grouping classification; other groupings use different names

// Nursing Service Providers
rule('Licensed Practical Nurse', ['RN']);
rule('Licensed Vocational Nurse', ['RN']);
rule('Licensed Psychiatric Technician', ['MH', 'RN']);
rule('Registered Nurse', ['RN'], {
  'Addiction (Substance Use Disorder)': ['RN', 'MH'], 'Administrator': ['RN', '?', '#nurse administrators manage, not treat'],
  'Cardiac Rehabilitation': ['RN', 'CARD'], 'Case Management': ['RN', 'CARE'], 'Community Health': ['RN', 'CARE'],
  'Continence Care': ['RN', 'URO'], 'Continuing Education/Staff Development': ['RN', '?', '#teaches staff'],
  'Critical Care Medicine': ['RN', 'HOSP'], 'Diabetes Educator': ['RN', 'ENDO'], 'Dialysis, Peritoneal': ['RN', 'KID'],
  'Emergency': ['RN', 'URG'], 'Flight': ['RN', 'URG'], 'Gastroenterology': ['RN', 'GI'], 'Hemodialysis': ['RN', 'KID'],
  'Home Health': ['RN', 'HOME'], 'Hospice': ['RN', 'PALL'], 'Lactation Consultant': ['RN', 'WH'], 'Maternal Newborn': ['RN', 'WH'],
  'Neonatal Intensive Care': ['RN', 'PED'], 'Neonatal, Low-Risk': ['RN', 'PED'], 'Nephrology': ['RN', 'KID'],
  'Neuroscience': ['RN', 'NEURO'], 'Nurse Massage Therapist (NMT)': ['RN', 'ALT'], 'Nutrition Support': ['RN', 'NUTR'],
  'Obstetric, High-Risk': ['RN', 'WH'], 'Obstetric, Inpatient': ['RN', 'WH'], 'Oncology': ['RN', 'ONC'], 'Ophthalmic': ['RN', 'EYE'],
  'Orthopedic': ['RN', 'ORTHO'], 'Otorhinolaryngology & Head-Neck': ['RN', 'ENT'], 'Pain Management': ['RN', 'PAIN'],
  'Pediatric Oncology': ['RN', 'PED', 'ONC'], 'Pediatrics': ['RN', 'PED'], 'Perinatal': ['RN', 'WH'], 'Plastic Surgery': ['RN', 'PLAS'],
  'Psychiatric/Mental Health': ['RN', 'MH'], 'Psychiatric/Mental Health, Adult': ['RN', 'MH'],
  'Psychiatric/Mental Health, Child & Adolescent': ['RN', 'MH', 'PED'], 'Registered Nurse First Assistant': ['RN', 'SURG'],
  'Rehabilitation': ['RN', 'PT'], 'Reproductive Endocrinology/Infertility': ['RN', 'WH'], 'School': ['RN', 'PED'],
  'Urology': ['RN', 'URO'], "Women's Health Care, Ambulatory": ['RN', 'WH'] });

// Nursing Service Related Providers
rule('Adult Companion', ['HOME']);
rule('Chore Provider', ['HOME']);
rule('Day Training/Habilitation Specialist', ['HOME', '?', '#day programs for people with developmental disabilities']);
rule('Doula', ['WH']);
rule('Home Health Aide', ['HOME']);
rule('Homemaker', ['HOME']);
rule("Nurse's Aide", ['HOME', 'SNF']);
rule('Nursing Home Administrator', ['SNF', '?', '#runs a facility; not a clinician']);
rule('Religious Nonmedical Nursing Personnel', ['HOME', '?', '#Christian Science style nonmedical care']);
rule('Religious Nonmedical Practitioner', ['HOME', '?', '#Christian Science style nonmedical care']);
rule('Technician', ['HOME']);   // Nursing Service Related: attendant and personal care

// Other Service Providers
rule('Acupuncturist', ['ALT']);
rule('Case Manager/Care Coordinator', ['CARE']);
rule('Clinical Ethicist', ['OTHER']);
rule('Community Health Worker', ['CARE']);
rule('Contractor', ['OTHER', '?', '#home and vehicle modifications for disability'], {});
rule('Driver', ['OTHER', '?', '#non-emergency medical transport']);
rule('Funeral Director', ['OTHER', '?', '#not health care; hide from the map instead?']);
rule('Genetic Counselor, MS', ['GEN']);
rule('Health & Wellness Coach', ['CARE', '?', '#could also sit under Nutrition']);
rule('Health Educator', ['CARE']);
rule('Homeopath', ['ALT']);
rule('Interpreter', ['OTHER', '?', '#medical interpreters; a patient may search for one']);
rule('Lactation Consultant, Non-RN', ['WH']);
rule('Midwife, Lay', ['WH']);
rule('Mechanotherapist', ['ALT']);
rule('Midwife', ['WH']);
rule('Military Health Care Provider', ['PC', '?', '#military clinicians; most patients cannot book them']);
rule('Naprapath', ['ALT']);
rule('Naturopath', ['ALT']);
rule('Peer Specialist', ['MH', 'CARE']);
rule('Medical Genetics, Ph.D. Medical Genetics', ['GEN']);
rule('Prevention Professional', ['CARE']);
rule('Reflexologist', ['ALT']);
rule('Sleep Specialist, PhD', ['LUNG']);
rule('Specialist', ['OTHER'], { 'Prosthetics Case Management': ['DME'] });
rule('Veterinarian', ['OTHER', '?', '#animal doctors; hide from the map instead?']);

// Pharmacy
rule('Pharmacist', ['PHARM']);
rule('Pharmacy Technician', ['PHARM']);

// Physician Assistants & Advanced Practice Nursing Providers
rule('Advanced Practice Midwife', ['WH']);
rule('Anesthesiologist Assistant', ['HOSP']);
rule('Clinical Nurse Specialist', ['RN'], {
  'Acute Care': ['RN', 'HOSP'], 'Adult Health': ['RN', 'PC'], 'Chronic Care': ['RN', 'PC'], 'Community Health/Public Health': ['RN', 'CARE'],
  'Critical Care Medicine': ['RN', 'HOSP'], 'Emergency': ['RN', 'URG'], 'Ethics': ['RN', 'OTHER'], 'Family Health': ['RN', 'PC'],
  'Gerontology': ['RN', 'PC'], 'Holistic': ['RN', 'ALT'], 'Home Health': ['RN', 'HOME'], 'Informatics': ['RN', 'OTHER'],
  'Long-Term Care': ['RN', 'SNF'], 'Medical-Surgical': ['RN', 'HOSP'], 'Neonatal': ['RN', 'HOSP', 'PED'], 'Neuroscience': ['RN', 'NEURO'],
  'Occupational Health': ['RN', 'PC'], 'Oncology': ['RN', 'ONC'], 'Oncology, Pediatrics': ['RN', 'ONC', 'PED'], 'Pediatrics': ['RN', 'PED'],
  'Perinatal': ['RN', 'WH'], 'Perioperative': ['RN', 'HOSP', 'SURG'], 'Psychiatric/Mental Health': ['RN', 'MH'],
  'Psychiatric/Mental Health, Adult': ['RN', 'MH'], 'Psychiatric/Mental Health, Child & Adolescent': ['RN', 'MH', 'PED'],
  'Psychiatric/Mental Health, Child & Family': ['RN', 'MH', 'PED'], 'Psychiatric/Mental Health, Chronically Ill': ['RN', 'MH'],
  'Psychiatric/Mental Health, Community': ['RN', 'MH'], 'Psychiatric/Mental Health, Geropsychiatric': ['RN', 'MH'],
  'Rehabilitation': ['RN', 'PT'], 'School': ['RN', 'PED'], 'Transplantation': ['RN', 'HOSP'], "Women's Health": ['RN', 'WH'] });
rule('Nurse Anesthetist, Certified Registered', ['HOSP']);
rule('Nurse Practitioner', ['PC'], {   // the spec's NP rules
  'Acute Care': ['HOSP'], 'Adult Health': ['PC'], 'Community Health': ['PC', 'CARE'], 'Critical Care Medicine': ['HOSP'],
  'Family': ['PC'], 'Gerontology': ['PC'], 'Neonatal': ['HOSP'], 'Neonatal, Critical Care': ['HOSP'],
  'Obstetrics & Gynecology': ['WH'], 'Occupational Health': ['PC'], 'Pediatrics': ['PED', 'PC'],
  'Pediatrics, Critical Care': ['HOSP', '?', '#spec lists Acute, Critical Care and Neonatal; also add Pediatrics?'],
  'Perinatal': ['WH'], 'Primary Care': ['PC'], 'Psychiatric/Mental Health': ['MH'], 'School': ['PED', 'PC'], "Women's Health": ['WH'] });
rule('Physician Assistant', ['PA', 'PC'], { 'Medical': ['PA', 'PC'], 'Surgical': ['PA', 'SURG'] });

// Podiatric
rule('Assistant, Podiatric', ['POD']);
rule('Podiatrist', ['POD']);

// Respiratory, Developmental, Rehabilitative and Restorative
rule('Anaplastologist', ['DME']);
rule('Art Therapist', ['MH']);
rule('Clinical Exercise Physiologist', ['PT']);
rule('Dance Therapist', ['MH']);
rule('Developmental Therapist', ['PT', 'PED', '?', '#early intervention for young children']);
rule('Kinesiotherapist', ['PT']);
rule('Massage Therapist', ['ALT']);
rule('Mastectomy Fitter', ['DME']);
rule('Music Therapist', ['MH', '?', '#today under Acupuncture, massage & naturopathy']);
rule('Occupational Therapist', ['PT'], { 'Low Vision': ['PT', 'EYE'], 'Mental Health': ['PT', 'MH'], 'Pediatrics': ['PT', 'PED'] });
rule('Occupational Therapy Assistant', ['PT']);
rule('Orthotic Fitter', ['DME']);
rule('Orthotist', ['DME']);
rule('Pedorthist', ['DME', 'POD']);
rule('Physical Therapist', ['PT'], { 'Cardiopulmonary': ['PT', 'LUNG'], 'Neurology': ['PT', 'NEURO'], 'Pediatrics': ['PT', 'PED'],
  'Sports': ['PT', 'ORTHO'] });
rule('Physical Therapy Assistant', ['PT']);
rule('Prosthetist', ['DME']);
rule('Pulmonary Function Technologist', ['LUNG']);
rule('Recreation Therapist', ['PT']);
rule('Recreational Therapist Assistant', ['PT']);
rule('Rehabilitation Counselor', ['PT', '?', '#vocational rehabilitation'], { 'Assistive Technology Supplier': ['DME'],
  'Assistive Technology Practitioner': ['PT', 'DME'], 'Orientation and Mobility Training Provider': ['EYE', 'PT'] });
rule('Rehabilitation Practitioner', ['MH', '?', '#psychiatric rehabilitation']);
rule('Respiratory Therapist, Certified', ['LUNG'], { 'Critical Care': ['LUNG', 'HOSP'], 'Home Health': ['LUNG', 'HOME'],
  'Neonatal/Pediatrics': ['LUNG', 'PED'], 'Palliative/Hospice': ['LUNG', 'PALL'], 'SNF/Subacute Care': ['LUNG', 'SNF'] });
R['Respiratory Therapist, Registered'] = R['Respiratory Therapist, Certified'];

// Speech, Language and Hearing
rule('Audiologist', ['HEAR']);
rule('Audiologist-Hearing Aid Fitter', ['HEAR']);
rule('Hearing Instrument Specialist', ['HEAR']);
rule('Speech-Language Pathologist', ['SPEECH']);

// Technologists, Technicians & Other Technical
rule('Perfusionist', ['HOSP']);
rule('Radiologic Technologist', ['IMG']);
rule('Radiology Practitioner Assistant', ['IMG']);
rule('Specialist/Technologist Cardiovascular', ['CARD', 'IMG']);
rule('Specialist/Technologist, Health Information', ['OTHER']);
rule('Specialist/Technologist, Other', ['OTHER'], { 'EEG': ['NEURO'], 'Electroneurodiagnostic': ['NEURO'],
  'Geneticist, Medical (PhD)': ['GEN'], 'Nephrology': ['KID'], 'Orthopedic Assistant': ['ORTHO'],
  'Surgical Assistant': ['SURG', 'HOSP'], 'Surgical Technologist': ['SURG', 'HOSP'] });
rule('Specialist/Technologist, Pathology', ['IMG']);
rule('Technician, Cardiology', ['CARD']);
rule('Technician, Health Information', ['OTHER']);
rule('Technician, Other', ['OTHER'], { 'EEG': ['NEURO'], 'Renal Dialysis': ['KID'] });
rule('Technician, Pathology', ['IMG']);

// "Specialist/Technologist" is used by two groupings; resolve by grouping.
const BY_GROUPING = {
  'Respiratory, Developmental, Rehabilitative and Restorative Service Providers|Specialist/Technologist':
    { '': ['PT'], 'Athletic Trainer': ['ORTHO', 'PT'], 'Rehabilitation, Blind': ['EYE', 'PT'] },
  'Speech, Language and Hearing Service Providers|Specialist/Technologist':
    { '': ['SPEECH', 'HEAR'], 'Audiology Assistant': ['HEAR'], 'Speech-Language Assistant': ['SPEECH'] }
};

// Organizations: proposed only where a specialty plainly fits. Keyed by
// Classification (or Classification|Specialization).
const ORG = {
  'Clinic/Center|Primary Care': ['PC'], 'Clinic/Center|Federally Qualified Health Center (FQHC)': ['PC'],
  'Clinic/Center|Rural Health': ['PC'], 'Clinic/Center|Community Health': ['PC'], 'Clinic/Center|Family Planning, Non-Surgical': ['WH'],
  'Clinic/Center|Medical Specialty': ['OTHER', '?'], 'Clinic/Center|Urgent Care': ['URG'], 'Clinic/Center|Emergency Care': ['URG'],
  'Clinic/Center|Physical Therapy': ['PT'], 'Clinic/Center|Rehabilitation': ['PT'], 'Clinic/Center|Rehabilitation, Comprehensive Outpatient Rehabilitation Facility (CORF)': ['PT'],
  'Clinic/Center|Occupational Medicine': ['PC'], 'Clinic/Center|Endoscopy': ['GI'], 'Clinic/Center|End-Stage Renal Disease (ESRD) Treatment': ['KID'],
  'Clinic/Center|Dental': ['DEN'], 'Clinic/Center|Podiatric': ['POD'], 'Clinic/Center|Hearing and Speech': ['HEAR', 'SPEECH'],
  'Clinic/Center|Oncology': ['ONC'], 'Clinic/Center|Oncology, Radiation': ['ONC'], 'Clinic/Center|Radiology': ['IMG'],
  'Clinic/Center|Radiology, Mammography': ['IMG', 'WH'], 'Clinic/Center|Radiology, Mobile': ['IMG'], 'Clinic/Center|Radiology, Mobile Mammography': ['IMG', 'WH'],
  'Clinic/Center|Sleep Disorder Diagnostic': ['LUNG'], 'Clinic/Center|Mental Health (Including Community Mental Health Center)': ['MH'],
  'Clinic/Center|Adolescent and Children Mental Health': ['MH', 'PED'], 'Clinic/Center|Methadone': ['MH'], 'Clinic/Center|Rehabilitation, Substance Use Disorder': ['MH'],
  'Clinic/Center|Critical Access Hospital': ['URG'], 'Clinic/Center|Medically Fragile Infants and Children Day Care': ['PED', 'HOME'], 'Clinic/Center|Ambulatory Surgical': ['URG', '?', '#today under Urgent care; surgery centers are not walk-in'],
  'Clinic/Center|Infusion Therapy': ['ONC', '?'], 'Clinic/Center|Lithotripsy': ['URO'], 'Clinic/Center|Amputee': ['DME', 'PT'],
  'Clinic/Center|Augmentative Communication': ['SPEECH'], 'Clinic/Center|Developmental Disabilities': ['PED', 'ABA', '?'],
  'Clinic/Center|Multi-Specialty': ['PC', '?'],
  'Clinical Medical Laboratory': ['IMG'], 'Physiological Laboratory': ['IMG'], 'General Acute Care Hospital': ['URG'],
  'General Acute Care Hospital|Children': ['URG', 'PED'], 'General Acute Care Hospital|Women': ['URG', 'WH'],
  'Rehabilitation Hospital': ['PT'], 'Psychiatric Hospital': ['MH'], 'Rehabilitation Hospital|Children': ['PT', 'PED'], 'Rehabilitation, Substance Use Disorder Unit': ['MH'],
  'Substance Abuse Rehabilitation Facility': ['MH'], 'Residential Treatment Facility, Emotionally Disturbed Children': ['MH', 'PED'],
  'Home Health': ['HOME'], 'In Home Supportive Care': ['HOME'], 'Nursing Care': ['HOME'], 'Hospice Care, Community Based': ['PALL', 'HOME'],
  'Hospice, Inpatient': ['PALL'], 'Skilled Nursing Facility': ['SNF'], 'Assisted Living Facility': ['SNF'], 'Nursing Facility/Intermediate Care Facility': ['SNF'],
  'Custodial Care Facility': ['SNF'], 'Intermediate Care Facility, Intellectual Disabilities': ['SNF'], 'Intermediate Care Facility, Mental Illness': ['SNF', 'MH'],
  'Christian Science Facility': ['SNF', '?'], 'Alzheimer Center (Dementia Center)': ['SNF'],
  'Community/Behavioral Health': ['MH'], 'Pharmacy': ['PHARM'], 'Durable Medical Equipment & Medical Supplies': ['DME'],
  'Prosthetic/Orthotic Supplier': ['DME'], 'Hearing Aid Equipment': ['HEAR', 'DME'], 'Eyewear Supplier': ['EYE'],
  'Ambulance': ['URG']
};

// --- apply -------------------------------------------------------------------
function parse(list) {
  const keys = [], notes = []; let decide = false;
  for (const x of list) {
    if (x === '?') decide = true;
    else if (x.startsWith('#')) notes.push(x.slice(1));
    else { if (!S[x]) throw new Error('unknown specialty key ' + x); keys.push(x); }
  }
  return { keys, decide, note: notes.join('; ') };
}

function propose(e) {
  if (!e.showOnMap) return { keys: [], decide: false, note: 'hidden from the map and patient search (show_on_map=false)', basis: 'hidden' };
  if (e.section === 'Individual') {
    const g = BY_GROUPING[e.grouping + '|' + e.classification];
    const r = g || R[e.classification];
    if (!r) return { keys: [], decide: true, note: 'NO RULE', basis: 'none' };
    const hit = e.specialization && r[e.specialization];
    return { ...parse(hit || r['']), basis: hit ? 'specialization' : 'classification' };
  }
  const k1 = e.classification + '|' + e.specialization;
  const r = ORG[k1] || ORG[e.classification];
  if (!r) return { keys: [], decide: false, note: '', basis: 'none' };
  return { ...parse(r), basis: ORG[k1] ? 'specialization' : 'classification' };
}

// Today's coverage, for comparison: which specialties match the stored name
// under the current word-boundary rule (the copy in CLAUDE.md, verbatim).
const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const matches = (stored, term) => (' ' + norm(stored)).includes(' ' + norm(term));
function todayFor(name) {
  return SPECIALTIES.filter(([, terms]) => terms.split(',').some((t) => t.trim() && matches(name, t.trim()))).map(([label]) => label);
}

const nucc = parseNucc(readFileSync(new URL('nucc_taxonomy.csv', REF), 'utf8'));
const overrides = parseOverrides(readFileSync(new URL('taxonomy-overrides.csv', REF), 'utf8'), new Set(nucc.map((n) => n.code)));
const inv = {};
for (const r of parseCsv(readFileSync(new URL('taxonomy-inventory.csv', REF), 'utf8')).slice(1)) inv[r[0]] = Number(r[4]) || 0;

// A name NUCC gives two codes counts once, on the code the reviewed name list
// picked (the backfill's rule), so listings are not double counted.
const nameCodes = {};
for (const n of nucc) (nameCodes[n.display_name] ||= []).push(n.code);
const reviewed = {};
for (const r of parseCsv(readFileSync(new URL('taxonomy-name-overrides.csv', REF), 'utf8')).slice(1)) if (r[0]) reviewed[r[0].trim()] = (r[1] || '').trim();
const listingsFor = (n) => {
  const codes = nameCodes[n.display_name] || [];
  if (codes.length > 1 && reviewed[n.display_name] !== n.code) return 0;
  return inv[n.display_name] || 0;
};

const out = [];
const missing = [];
const usedOrgKeys = new Set();
for (const n of nucc) {
  const ov = overrides.get(n.code);
  const showOnMap = !(ov && ov.show === false);
  const e = { ...n, showOnMap };
  const p = propose(e);
  if (e.section !== 'Individual') {
    const k1 = e.classification + '|' + e.specialization;
    if (ORG[k1]) usedOrgKeys.add(k1); else if (ORG[e.classification]) usedOrgKeys.add(e.classification);
  }
  if (e.section === 'Individual' && showOnMap && p.keys.length === 0) missing.push(n.code + ' ' + n.display_name);
  out.push({ e, p, listings: listingsFor(n), today: todayFor(n.display_name) });
}
const unusedOrg = Object.keys(ORG).filter((k) => !usedOrgKeys.has(k));
if (unusedOrg.length) console.warn('organization rules that matched no code (check spelling): ' + unusedOrg.join(' | '));
const unusedInd = Object.keys(R).filter((cls) => !nucc.some((n) => n.section === 'Individual' && n.classification === cls));
if (unusedInd.length) console.warn('individual rules that matched no code: ' + unusedInd.join(' | '));

const q = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const header = ['nucc_code', 'section', 'grouping', 'classification', 'specialization', 'display_name', 'listings_by_name',
  'proposed_specialties', 'basis', 'needs_decision', 'note', 'today_by_name'];
const lines = [header.join(',')];
for (const { e, p, listings, today } of out) {
  lines.push([e.code, e.section, e.grouping, e.classification, e.specialization, e.displayName, listings,
    p.keys.map((k) => S[k]).join(';'), p.basis, p.decide ? 'yes' : '', p.note, today.join(';')].map(q).join(','));
}
const outArg = process.argv.indexOf('--out');
const file = outArg > 0 ? process.argv[outArg + 1] : new URL('patient-specialties-proposal.csv', REF);
writeFileSync(file, lines.join('\n') + '\n');

const specMeta = Object.entries(S).map(([k, label]) => ({ key: k, label, status: NEW[k] ? 'new' : RENAMED[k] ? 'renamed' : 'existing', why: NEW[k] || RENAMED[k] || '' }));
writeFileSync(new URL('patient-specialties-list.json', REF), JSON.stringify(specMeta, null, 2) + '\n');

const ind = out.filter((o) => o.e.section === 'Individual');
console.log(`codes: ${out.length} (${ind.length} individual), decisions flagged: ${out.filter((o) => o.p.decide).length}`);
if (missing.length) { console.error('visible individual codes with no specialty:\n  ' + missing.join('\n  ')); process.exit(1); }
console.log('every visible individual code has at least one specialty');
