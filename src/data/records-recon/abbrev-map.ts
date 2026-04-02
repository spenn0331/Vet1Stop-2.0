// @ts-nocheck
// ─── VA Medical Abbreviation Map (200+ entries) ─────────────────────────────
// Maps common VA/military medical abbreviations to full condition names.
// Includes context flags (h/o, s/p, c/o) that signal the NEXT term is a condition.

export interface AbbrevEntry {
  fullName: string;
  category: string;
  isContextFlag?: boolean; // If true, this abbreviation signals the next term is a condition
}

export const ABBREV_MAP: Record<string, AbbrevEntry> = {
  // ── Context flags (not conditions themselves — signal next term IS a condition) ──
  'h/o':  { fullName: 'history of', category: '', isContextFlag: true },
  'hx':   { fullName: 'history of', category: '', isContextFlag: true },
  'hx of': { fullName: 'history of', category: '', isContextFlag: true },
  's/p':  { fullName: 'status post', category: '', isContextFlag: true },
  'c/o':  { fullName: 'complains of', category: '', isContextFlag: true },
  'r/o':  { fullName: 'rule out', category: '', isContextFlag: true },
  'dx':   { fullName: 'diagnosis', category: '', isContextFlag: true },
  'ddx':  { fullName: 'differential diagnosis', category: '', isContextFlag: true },

  // ── Musculoskeletal ──
  'ddd':  { fullName: 'Degenerative Disc Disease', category: 'Musculoskeletal' },
  'djd':  { fullName: 'Degenerative Joint Disease', category: 'Musculoskeletal' },
  'tkr':  { fullName: 'Total Knee Replacement', category: 'Musculoskeletal' },
  'tka':  { fullName: 'Total Knee Arthroplasty', category: 'Musculoskeletal' },
  'thr':  { fullName: 'Total Hip Replacement', category: 'Musculoskeletal' },
  'tha':  { fullName: 'Total Hip Arthroplasty', category: 'Musculoskeletal' },
  'cts':  { fullName: 'Carpal Tunnel Syndrome', category: 'Musculoskeletal' },
  'rct':  { fullName: 'Rotator Cuff Tear', category: 'Musculoskeletal' },
  'acl':  { fullName: 'ACL Injury', category: 'Musculoskeletal' },
  'mcl':  { fullName: 'MCL Injury', category: 'Musculoskeletal' },
  'rom':  { fullName: 'Range of Motion', category: 'Musculoskeletal' },
  'oa':   { fullName: 'Osteoarthritis', category: 'Musculoskeletal' },
  'ra':   { fullName: 'Rheumatoid Arthritis', category: 'Musculoskeletal' },
  'si joint': { fullName: 'Sacroiliac Joint Dysfunction', category: 'Musculoskeletal' },
  'crps': { fullName: 'Complex Regional Pain Syndrome', category: 'Musculoskeletal' },
  'rsd':  { fullName: 'Reflex Sympathetic Dystrophy', category: 'Musculoskeletal' },
  'lom':  { fullName: 'Limitation of Motion', category: 'Musculoskeletal' },

  // ── Mental Health ──
  'ptsd': { fullName: 'Post-Traumatic Stress Disorder', category: 'Mental Health' },
  'mdd':  { fullName: 'Major Depressive Disorder', category: 'Mental Health' },
  'gad':  { fullName: 'Generalized Anxiety Disorder', category: 'Mental Health' },
  'bpd':  { fullName: 'Borderline Personality Disorder', category: 'Mental Health' },
  'ocd':  { fullName: 'Obsessive Compulsive Disorder', category: 'Mental Health' },
  'adhd': { fullName: 'Attention Deficit Hyperactivity Disorder', category: 'Mental Health' },
  'add':  { fullName: 'Attention Deficit Disorder', category: 'Mental Health' },
  'sud':  { fullName: 'Substance Use Disorder', category: 'Mental Health' },
  'aud':  { fullName: 'Alcohol Use Disorder', category: 'Mental Health' },
  'oud':  { fullName: 'Opioid Use Disorder', category: 'Mental Health' },
  'mst':  { fullName: 'Military Sexual Trauma', category: 'Mental Health' },
  'tbi':  { fullName: 'Traumatic Brain Injury', category: 'Mental Health' },
  'pcs':  { fullName: 'Post-Concussion Syndrome', category: 'Mental Health' },
  'si':   { fullName: 'Suicidal Ideation', category: 'Mental Health' },
  'sa':   { fullName: 'Suicide Attempt', category: 'Mental Health' },

  // ── Sleep ──
  'osa':  { fullName: 'Obstructive Sleep Apnea', category: 'Sleep' },
  'csa':  { fullName: 'Central Sleep Apnea', category: 'Sleep' },
  'cpap': { fullName: 'Obstructive Sleep Apnea (CPAP therapy)', category: 'Sleep' },
  'bipap': { fullName: 'Sleep Apnea (BiPAP therapy)', category: 'Sleep' },
  'rls':  { fullName: 'Restless Leg Syndrome', category: 'Sleep' },
  'plmd': { fullName: 'Periodic Limb Movement Disorder', category: 'Sleep' },

  // ── Neurological ──
  'ms':   { fullName: 'Multiple Sclerosis', category: 'Neurological' },
  'als':  { fullName: 'Amyotrophic Lateral Sclerosis', category: 'Neurological' },
  'bppv': { fullName: 'Benign Paroxysmal Positional Vertigo', category: 'Neurological' },
  'tia':  { fullName: 'Transient Ischemic Attack', category: 'Neurological' },
  'cva':  { fullName: 'Cerebrovascular Accident (Stroke)', category: 'Neurological' },
  'pn':   { fullName: 'Peripheral Neuropathy', category: 'Neurological' },

  // ── Hearing / ENT ──
  'snhl': { fullName: 'Sensorineural Hearing Loss', category: 'Hearing' },
  'chl':  { fullName: 'Conductive Hearing Loss', category: 'Hearing' },
  'eom':  { fullName: 'Extraocular Movements', category: 'Hearing' },
  'tmj':  { fullName: 'Temporomandibular Joint Disorder', category: 'Hearing' },
  'tmjd': { fullName: 'Temporomandibular Joint Disorder', category: 'Hearing' },

  // ── Cardiovascular ──
  'htn':  { fullName: 'Hypertension', category: 'Cardiovascular' },
  'cad':  { fullName: 'Coronary Artery Disease', category: 'Cardiovascular' },
  'chf':  { fullName: 'Congestive Heart Failure', category: 'Cardiovascular' },
  'mi':   { fullName: 'Myocardial Infarction', category: 'Cardiovascular' },
  'afib': { fullName: 'Atrial Fibrillation', category: 'Cardiovascular' },
  'a-fib': { fullName: 'Atrial Fibrillation', category: 'Cardiovascular' },
  'dvt':  { fullName: 'Deep Vein Thrombosis', category: 'Cardiovascular' },
  'pe':   { fullName: 'Pulmonary Embolism', category: 'Cardiovascular' },
  'pvd':  { fullName: 'Peripheral Vascular Disease', category: 'Cardiovascular' },
  'pad':  { fullName: 'Peripheral Artery Disease', category: 'Cardiovascular' },
  'hld':  { fullName: 'Hyperlipidemia', category: 'Cardiovascular' },
  'ihd':  { fullName: 'Ischemic Heart Disease', category: 'Cardiovascular' },
  'lvh':  { fullName: 'Left Ventricular Hypertrophy', category: 'Cardiovascular' },
  'aaa':  { fullName: 'Abdominal Aortic Aneurysm', category: 'Cardiovascular' },

  // ── Respiratory ──
  'copd': { fullName: 'Chronic Obstructive Pulmonary Disease', category: 'Respiratory' },
  'sob':  { fullName: 'Shortness of Breath', category: 'Respiratory' },
  'pft':  { fullName: 'Pulmonary Function Test', category: 'Respiratory' },
  'ild':  { fullName: 'Interstitial Lung Disease', category: 'Respiratory' },
  'ipf':  { fullName: 'Idiopathic Pulmonary Fibrosis', category: 'Respiratory' },

  // ── GI / Digestive ──
  'gerd': { fullName: 'Gastroesophageal Reflux Disease', category: 'GI' },
  'ibs':  { fullName: 'Irritable Bowel Syndrome', category: 'GI' },
  'ibd':  { fullName: 'Inflammatory Bowel Disease', category: 'GI' },
  'uc':   { fullName: 'Ulcerative Colitis', category: 'GI' },
  'gi':   { fullName: 'Gastrointestinal', category: 'GI' },
  'pud':  { fullName: 'Peptic Ulcer Disease', category: 'GI' },
  'nafld': { fullName: 'Non-Alcoholic Fatty Liver Disease', category: 'GI' },
  'nash': { fullName: 'Non-Alcoholic Steatohepatitis', category: 'GI' },

  // ── Endocrine ──
  'dm':   { fullName: 'Diabetes Mellitus', category: 'Endocrine' },
  'dm1':  { fullName: 'Diabetes Mellitus Type 1', category: 'Endocrine' },
  'dm2':  { fullName: 'Diabetes Mellitus Type 2', category: 'Endocrine' },
  'dmii': { fullName: 'Diabetes Mellitus Type 2', category: 'Endocrine' },
  'iddm': { fullName: 'Insulin-Dependent Diabetes Mellitus', category: 'Endocrine' },
  'niddm': { fullName: 'Non-Insulin-Dependent Diabetes Mellitus', category: 'Endocrine' },
  'a1c':  { fullName: 'Hemoglobin A1C (Diabetes Marker)', category: 'Endocrine' },
  'tsh':  { fullName: 'Thyroid Stimulating Hormone', category: 'Endocrine' },

  // ── Genitourinary ──
  'ckd':  { fullName: 'Chronic Kidney Disease', category: 'Genitourinary' },
  'esrd': { fullName: 'End-Stage Renal Disease', category: 'Genitourinary' },
  'bph':  { fullName: 'Benign Prostatic Hyperplasia', category: 'Genitourinary' },
  'uti':  { fullName: 'Urinary Tract Infection', category: 'Genitourinary' },
  'ed':   { fullName: 'Erectile Dysfunction', category: 'Genitourinary' },
  'ic':   { fullName: 'Interstitial Cystitis', category: 'Genitourinary' },

  // ── Dermatological ──
  'scc':  { fullName: 'Squamous Cell Carcinoma', category: 'Dermatological' },
  'bcc':  { fullName: 'Basal Cell Carcinoma', category: 'Dermatological' },
  'hs':   { fullName: 'Hidradenitis Suppurativa', category: 'Dermatological' },

  // ── Ophthalmological ──
  'iop':  { fullName: 'Intraocular Pressure (Glaucoma)', category: 'Ophthalmological' },
  'amd':  { fullName: 'Age-Related Macular Degeneration', category: 'Ophthalmological' },

  // ── Exposure-related ──
  'ao':   { fullName: 'Agent Orange Exposure', category: 'Respiratory' },
  'gws':  { fullName: 'Gulf War Syndrome', category: 'Other' },
  'gwi':  { fullName: 'Gulf War Illness', category: 'Other' },

  // ── Claims / Ratings ──
  'tdiu': { fullName: 'Total Disability Individual Unemployability', category: 'Other' },
  'iu':   { fullName: 'Individual Unemployability', category: 'Other' },
  'smc':  { fullName: 'Special Monthly Compensation', category: 'Other' },
  'dbq':  { fullName: 'Disability Benefits Questionnaire', category: 'Other' },
};

// Pre-compiled regex patterns for abbreviation detection
// Uses word boundaries to avoid partial matches (e.g., "road" matching "oa")
export const ABBREV_PATTERNS: Array<{ regex: RegExp; key: string; entry: AbbrevEntry }> = 
  Object.entries(ABBREV_MAP).map(([key, entry]) => ({
    regex: new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
    key,
    entry,
  }));
