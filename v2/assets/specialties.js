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
  ['Primary care / family doctor', 'Family Medicine Physician,Internal Medicine Physician,General Practice Physician,Primary Care Clinic/Center,Federally Qualified Health Center,Family Nurse Practitioner,Adult Health Nurse Practitioner,Community Health Clinic/Center', 'Family Medicine'],
  ['Pediatrics (children)', 'Pediatrics Physician,Pediatric Nurse Practitioner,Pediatric Adolescent Medicine', 'Pediatrics'],
  ["Women's health / OB-GYN", 'Obstetrics & Gynecology Physician,Obstetrics Physician,Gynecology Physician,Advanced Practice Midwife,Maternal & Fetal Medicine', 'Obstetrics & Gynecology'],
  ['Mental health & counseling', 'Psychiatry Physician,Psychologist,Neuropsychologist,Counselor,Clinical Social Worker,Marriage & Family Therapist,Mental Health,Behavioral Health,Behavior Analyst,Community/Behavioral Health Agency', 'Psychiatry'],
  ['Dental', 'Dentist,Dentistry,Dental Clinic/Center,Endodontics', 'Dentist'],
  ['Eye care', 'Optometrist,Ophthalmology Physician,Eyewear Supplier', 'Optometrist'],
  ['Chiropractic', 'Chiropractor', 'Chiropractor'],
  ['Physical & occupational therapy', 'Physical Therapist,Physical Therapy Clinic/Center,Occupational Therapist,Occupational Therapy Assistant,Physical Medicine & Rehabilitation Physician,Rehabilitation Clinic/Center,Rehabilitation Hospital', 'Physical Therapist'],
  ['Orthopedics & sports injury', 'Orthopaedic Surgery Physician,Sports Medicine,Surgery of the Hand', 'Orthopaedic Surgery'],
  ['Heart / cardiology', 'Cardiovascular Disease Physician,Cardiology,Thoracic Surgery', 'Cardiovascular Disease'],
  ['Skin / dermatology', 'Dermatology Physician', 'Dermatology'],
  ['Allergy & immunology', 'Allergy Physician,Allergy & Immunology Physician', 'Allergy & Immunology'],
  ['Lung, breathing & sleep', 'Pulmonary Disease Physician,Sleep Disorder Diagnostic Clinic/Center,Sleep Medicine', 'Pulmonary Disease'],
  ['Digestive / gastroenterology', 'Gastroenterology Physician,Endoscopy Clinic/Center', 'Gastroenterology'],
  ['Kidney / nephrology', 'Nephrology Physician,End-Stage Renal Disease', 'Nephrology'],
  ['Diabetes & hormones', 'Endocrinology', 'Endocrinology'],
  ['Cancer care / oncology', 'Hematology & Oncology Physician,Radiation Oncology Physician,Gynecologic Oncology Physician,Oncology', 'Hematology & Oncology'],
  ['Arthritis / rheumatology', 'Rheumatology Physician', 'Rheumatology'],
  ['Brain & nerves / neurology', 'Neurology Physician,Neurological Surgery Physician,Clinical Neurophysiology', 'Neurology'],
  ['Ear, nose & throat', 'Otolaryngology Physician', 'Otolaryngology'],
  ['Urology', 'Urology Physician', 'Urology'],
  ['Foot & ankle / podiatry', 'Podiatrist,Podiatric Clinic/Center', 'Podiatrist'],
  ['Pain management', 'Pain Medicine Physician,Pain Medicine (Anesthesiology) Physician', 'Pain Medicine'],
  ['Plastic & reconstructive surgery', 'Plastic Surgery Physician,Plastic and Reconstructive Surgery Physician', 'Plastic Surgery'],
  ['Speech & hearing', 'Speech-Language Pathologist,Audiologist,Hearing Instrument Specialist,Hearing and Speech Clinic/Center', 'Speech-Language Pathologist'],
  ['Nutrition & dietitian', 'Registered Dietitian,Nutritionist', 'Dietitian'],
  ['Acupuncture, massage & naturopathy', 'Acupuncturist,Massage Therapist,Naturopath,Music Therapist', 'Acupuncturist'],
  ['Urgent care & emergency', 'Urgent Care Clinic/Center,Emergency Care Clinic/Center,Emergency Medicine Physician,General Acute Care Hospital,Critical Access Hospital,Ambulatory Surgical Clinic/Center', 'Emergency Medicine'],
  ['Imaging & lab', 'Diagnostic Radiology Physician,Radiology Clinic/Center,Body Imaging,Clinical Medical Laboratory,Physiological Laboratory', 'Radiology'],
  ['Pharmacy', 'Pharmacy,Pharmacist', 'Pharmacy'],
  ['Home health & in-home care', 'Home Health Agency,Home Health Aide,Home Health Registered Nurse,In Home Supportive Care Agency,Nursing Care Agency,Community Based Hospice Care Agency', 'Home Health'],
  ['Nursing & assisted living', 'Skilled Nursing Facility,Assisted Living Facility,Adult Care Home Facility', 'Skilled Nursing Facility'],
  ['Medical equipment & supplies', 'Durable Medical Equipment,Prosthetic/Orthotic Supplier,Customized Equipment,Hearing  Aid Equipment', 'Durable Medical Equipment & Medical Supplies']
];
