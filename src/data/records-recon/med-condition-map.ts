// @ts-nocheck
// ─── Medication → Condition Inference Map ─────────────────────────────────────
// When a medication name appears in clinical text, we can infer the underlying
// condition even if the condition itself is never named.
// Confidence is always 'medium' or 'low' since medication→condition is inferential.

export interface MedConditionEntry {
  condition: string;
  category: string;
  confidence: 'medium' | 'low';
}

// Keys are pipe-delimited medication names (matched as regex)
const RAW_MED_MAP: Array<{ meds: string; condition: string; category: string; confidence: 'medium' | 'low' }> = [
  // ── Mental Health ──
  { meds: 'prazosin', condition: 'PTSD (Nightmare Management)', category: 'Mental Health', confidence: 'medium' },
  { meds: 'sertraline|zoloft', condition: 'Depression or PTSD', category: 'Mental Health', confidence: 'medium' },
  { meds: 'fluoxetine|prozac', condition: 'Depression or Anxiety', category: 'Mental Health', confidence: 'medium' },
  { meds: 'paroxetine|paxil', condition: 'Depression, Anxiety, or PTSD', category: 'Mental Health', confidence: 'medium' },
  { meds: 'venlafaxine|effexor', condition: 'Depression or Anxiety', category: 'Mental Health', confidence: 'medium' },
  { meds: 'duloxetine|cymbalta', condition: 'Depression or Chronic Pain', category: 'Mental Health', confidence: 'medium' },
  { meds: 'citalopram|celexa', condition: 'Depression or Anxiety', category: 'Mental Health', confidence: 'medium' },
  { meds: 'escitalopram|lexapro', condition: 'Depression or Anxiety', category: 'Mental Health', confidence: 'medium' },
  { meds: 'mirtazapine|remeron', condition: 'Depression or Insomnia', category: 'Mental Health', confidence: 'medium' },
  { meds: 'bupropion|wellbutrin', condition: 'Depression or Smoking Cessation', category: 'Mental Health', confidence: 'low' },
  { meds: 'buspirone|buspar', condition: 'Generalized Anxiety Disorder', category: 'Mental Health', confidence: 'medium' },
  { meds: 'hydroxyzine|vistaril|atarax', condition: 'Anxiety', category: 'Mental Health', confidence: 'medium' },
  { meds: 'quetiapine|seroquel', condition: 'Bipolar Disorder or PTSD', category: 'Mental Health', confidence: 'medium' },
  { meds: 'aripiprazole|abilify', condition: 'Bipolar Disorder or Depression (Adjunct)', category: 'Mental Health', confidence: 'medium' },
  { meds: 'lithium', condition: 'Bipolar Disorder', category: 'Mental Health', confidence: 'medium' },
  { meds: 'lamotrigine|lamictal', condition: 'Bipolar Disorder or Seizure Disorder', category: 'Mental Health', confidence: 'medium' },
  { meds: 'naltrexone|vivitrol', condition: 'Alcohol Use Disorder or Opioid Use Disorder', category: 'Mental Health', confidence: 'medium' },
  { meds: 'disulfiram|antabuse', condition: 'Alcohol Use Disorder', category: 'Mental Health', confidence: 'medium' },
  { meds: 'buprenorphine|suboxone|subutex', condition: 'Opioid Use Disorder', category: 'Mental Health', confidence: 'medium' },
  { meds: 'methylphenidate|ritalin|concerta', condition: 'ADHD', category: 'Mental Health', confidence: 'medium' },
  { meds: 'amphetamine|adderall|vyvanse', condition: 'ADHD', category: 'Mental Health', confidence: 'medium' },

  // ── Sleep ──
  { meds: 'trazodone|desyrel', condition: 'Insomnia', category: 'Sleep', confidence: 'medium' },
  { meds: 'zolpidem|ambien', condition: 'Insomnia', category: 'Sleep', confidence: 'medium' },
  { meds: 'eszopiclone|lunesta', condition: 'Insomnia', category: 'Sleep', confidence: 'medium' },
  { meds: 'melatonin', condition: 'Sleep Disorder', category: 'Sleep', confidence: 'low' },
  { meds: 'cpap|bipap|apap', condition: 'Obstructive Sleep Apnea', category: 'Sleep', confidence: 'medium' },
  { meds: 'modafinil|provigil', condition: 'Narcolepsy or Sleep Apnea', category: 'Sleep', confidence: 'medium' },

  // ── Pain / Musculoskeletal ──
  { meds: 'gabapentin|neurontin', condition: 'Neuropathy or Chronic Pain', category: 'Neurological', confidence: 'medium' },
  { meds: 'pregabalin|lyrica', condition: 'Neuropathy or Fibromyalgia', category: 'Neurological', confidence: 'medium' },
  { meds: 'meloxicam|mobic', condition: 'Chronic Pain or Arthritis', category: 'Musculoskeletal', confidence: 'low' },
  { meds: 'naproxen|aleve|naprosyn', condition: 'Chronic Pain or Inflammation', category: 'Musculoskeletal', confidence: 'low' },
  { meds: 'ibuprofen 800|motrin 800', condition: 'Chronic Pain or Inflammation', category: 'Musculoskeletal', confidence: 'low' },
  { meds: 'diclofenac|voltaren', condition: 'Arthritis or Chronic Pain', category: 'Musculoskeletal', confidence: 'low' },
  { meds: 'cyclobenzaprine|flexeril', condition: 'Muscle Spasm or Chronic Pain', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'methocarbamol|robaxin', condition: 'Muscle Spasm', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'tizanidine|zanaflex', condition: 'Muscle Spasticity', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'tramadol|ultram', condition: 'Chronic Pain', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'oxycodone|percocet|oxycontin', condition: 'Chronic Pain (Opioid Managed)', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'hydrocodone|vicodin|norco', condition: 'Chronic Pain (Opioid Managed)', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'morphine|ms contin', condition: 'Chronic Pain (Opioid Managed)', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'allopurinol|uloric', condition: 'Gout', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'colchicine', condition: 'Gout', category: 'Musculoskeletal', confidence: 'medium' },
  { meds: 'methotrexate', condition: 'Rheumatoid Arthritis or Psoriasis', category: 'Musculoskeletal', confidence: 'medium' },

  // ── Neurological ──
  { meds: 'sumatriptan|imitrex', condition: 'Migraines', category: 'Neurological', confidence: 'medium' },
  { meds: 'rizatriptan|maxalt', condition: 'Migraines', category: 'Neurological', confidence: 'medium' },
  { meds: 'topiramate|topamax', condition: 'Migraines or Seizure Disorder', category: 'Neurological', confidence: 'medium' },
  { meds: 'levetiracetam|keppra', condition: 'Seizure Disorder', category: 'Neurological', confidence: 'medium' },
  { meds: 'carbamazepine|tegretol', condition: 'Seizure Disorder or Trigeminal Neuralgia', category: 'Neurological', confidence: 'medium' },
  { meds: 'phenytoin|dilantin', condition: 'Seizure Disorder', category: 'Neurological', confidence: 'medium' },
  { meds: 'valproic acid|depakote', condition: 'Seizure Disorder or Bipolar Disorder', category: 'Neurological', confidence: 'medium' },
  { meds: 'carbidopa-levodopa|sinemet', condition: "Parkinson's Disease", category: 'Neurological', confidence: 'medium' },
  { meds: 'ropinirole|requip', condition: "Parkinson's Disease or Restless Leg Syndrome", category: 'Neurological', confidence: 'medium' },
  { meds: 'pramipexole|mirapex', condition: "Parkinson's Disease or Restless Leg Syndrome", category: 'Neurological', confidence: 'medium' },
  { meds: 'donepezil|aricept', condition: 'Dementia or Cognitive Decline', category: 'Neurological', confidence: 'medium' },
  { meds: 'memantine|namenda', condition: 'Dementia', category: 'Neurological', confidence: 'medium' },

  // ── Cardiovascular ──
  { meds: 'lisinopril|enalapril|ramipril|benazepril', condition: 'Hypertension', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'losartan|valsartan|irbesartan|olmesartan', condition: 'Hypertension', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'amlodipine|norvasc', condition: 'Hypertension', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'metoprolol|atenolol|carvedilol|propranolol', condition: 'Hypertension or Heart Condition', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'hydrochlorothiazide|hctz|chlorthalidone', condition: 'Hypertension', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'atorvastatin|lipitor|rosuvastatin|crestor|simvastatin|zocor|pravastatin', condition: 'Hyperlipidemia', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'warfarin|coumadin', condition: 'Blood Clot Disorder or Atrial Fibrillation', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'apixaban|eliquis|rivaroxaban|xarelto', condition: 'Blood Clot Disorder or Atrial Fibrillation', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'clopidogrel|plavix', condition: 'Cardiovascular Disease (Antiplatelet)', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'nitroglycerin|nitro', condition: 'Angina or Coronary Artery Disease', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'digoxin|lanoxin', condition: 'Heart Failure or Atrial Fibrillation', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'furosemide|lasix', condition: 'Heart Failure or Edema', category: 'Cardiovascular', confidence: 'medium' },
  { meds: 'spironolactone|aldactone', condition: 'Heart Failure or Hypertension', category: 'Cardiovascular', confidence: 'low' },

  // ── GI ──
  { meds: 'omeprazole|prilosec|pantoprazole|protonix|esomeprazole|nexium|lansoprazole|prevacid', condition: 'Gastroesophageal Reflux Disease', category: 'GI', confidence: 'medium' },
  { meds: 'ranitidine|famotidine|pepcid', condition: 'GERD or Peptic Ulcer Disease', category: 'GI', confidence: 'medium' },
  { meds: 'sucralfate|carafate', condition: 'Peptic Ulcer Disease', category: 'GI', confidence: 'medium' },
  { meds: 'mesalamine|asacol|lialda', condition: 'Ulcerative Colitis', category: 'GI', confidence: 'medium' },
  { meds: 'dicyclomine|bentyl', condition: 'Irritable Bowel Syndrome', category: 'GI', confidence: 'medium' },
  { meds: 'lactulose', condition: 'Hepatic Encephalopathy or Chronic Constipation', category: 'GI', confidence: 'low' },

  // ── Endocrine ──
  { meds: 'metformin|glucophage', condition: 'Diabetes Mellitus Type 2', category: 'Endocrine', confidence: 'medium' },
  { meds: 'insulin|lantus|humalog|novolog|levemir|tresiba', condition: 'Diabetes Mellitus', category: 'Endocrine', confidence: 'medium' },
  { meds: 'glipizide|glucotrol|glyburide|glimepiride|amaryl', condition: 'Diabetes Mellitus Type 2', category: 'Endocrine', confidence: 'medium' },
  { meds: 'empagliflozin|jardiance|dapagliflozin|farxiga', condition: 'Diabetes Mellitus Type 2', category: 'Endocrine', confidence: 'medium' },
  { meds: 'semaglutide|ozempic|wegovy|liraglutide|victoza', condition: 'Diabetes Mellitus Type 2 or Obesity', category: 'Endocrine', confidence: 'medium' },
  { meds: 'levothyroxine|synthroid|levoxyl', condition: 'Hypothyroidism', category: 'Endocrine', confidence: 'medium' },
  { meds: 'methimazole|tapazole', condition: 'Hyperthyroidism', category: 'Endocrine', confidence: 'medium' },
  { meds: 'testosterone|androgel|testim', condition: 'Hypogonadism (Low Testosterone)', category: 'Endocrine', confidence: 'medium' },

  // ── Respiratory ──
  { meds: 'albuterol|proair|ventolin|proventil', condition: 'Asthma or COPD', category: 'Respiratory', confidence: 'medium' },
  { meds: 'ipratropium|atrovent|spiriva|tiotropium', condition: 'COPD', category: 'Respiratory', confidence: 'medium' },
  { meds: 'fluticasone|flovent|advair|breo|symbicort|budesonide', condition: 'Asthma or COPD', category: 'Respiratory', confidence: 'medium' },
  { meds: 'montelukast|singulair', condition: 'Asthma or Allergic Rhinitis', category: 'Respiratory', confidence: 'medium' },

  // ── Genitourinary ──
  { meds: 'tamsulosin|flomax', condition: 'Benign Prostatic Hyperplasia', category: 'Genitourinary', confidence: 'medium' },
  { meds: 'finasteride|proscar', condition: 'Benign Prostatic Hyperplasia', category: 'Genitourinary', confidence: 'medium' },
  { meds: 'sildenafil|viagra|tadalafil|cialis', condition: 'Erectile Dysfunction', category: 'Genitourinary', confidence: 'medium' },
  { meds: 'oxybutynin|ditropan|tolterodine|detrol', condition: 'Overactive Bladder', category: 'Genitourinary', confidence: 'medium' },

  // ── Dermatological ──
  { meds: 'triamcinolone|clobetasol|betamethasone', condition: 'Dermatitis or Skin Condition', category: 'Dermatological', confidence: 'low' },

  // ── Ophthalmological ──
  { meds: 'latanoprost|xalatan|timolol', condition: 'Glaucoma', category: 'Ophthalmological', confidence: 'medium' },
];

export interface CompiledMedEntry {
  regex: RegExp;
  condition: string;
  category: string;
  confidence: 'medium' | 'low';
}

export const MED_CONDITION_MAP: CompiledMedEntry[] = RAW_MED_MAP.map(entry => ({
  regex: new RegExp(`\\b(?:${entry.meds.split('|').map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i'),
  condition: entry.condition,
  category: entry.category,
  confidence: entry.confidence,
}));
