// ─── Symptom-to-Condition Synonym Clusters ───────────────────────────────────
// Catches narrative language where the condition name itself doesn't appear.
// Each key is a pipe-delimited set of phrases; value is the condition to extract.
// Regex is pre-compiled at module load for performance.

import type { DetectionSource } from '@/types/records-recon';

export interface SynonymCluster {
  phrases: string[];
  regex: RegExp;
  condition: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

const RAW_CLUSTERS: Array<{ phrases: string; condition: string; category: string; confidence: 'high' | 'medium' | 'low' }> = [
  // ── Hearing ──
  { phrases: 'ringing in ears|ear ringing|high-pitched noise|buzzing in ears|humming sound|constant ringing|ears ringing', condition: 'Tinnitus', category: 'Hearing', confidence: 'medium' },
  { phrases: 'trouble hearing|can\'t hear|difficulty hearing|hearing difficulty|hard of hearing|decreased hearing|diminished hearing', condition: 'Hearing Loss', category: 'Hearing', confidence: 'medium' },

  // ── Sleep ──
  { phrases: 'trouble sleeping|can\'t sleep|difficulty falling asleep|waking up at night|difficulty staying asleep|poor sleep|sleep disturbance|doesn\'t sleep well', condition: 'Insomnia', category: 'Sleep', confidence: 'medium' },
  { phrases: 'stops breathing at night|snoring loudly|gasping during sleep|wakes up choking|excessive daytime sleepiness|apneic episodes', condition: 'Obstructive Sleep Apnea', category: 'Sleep', confidence: 'medium' },
  { phrases: 'nightmares|night terrors|bad dreams|combat dreams|flashbacks during sleep|wakes up screaming|vivid dreams', condition: 'PTSD-related Sleep Disturbance', category: 'Mental Health', confidence: 'medium' },

  // ── Mental Health ──
  { phrases: 'feels hopeless|loss of interest|no motivation|can\'t enjoy anything|persistent sadness|feeling empty|worthless|anhedonia', condition: 'Major Depressive Disorder', category: 'Mental Health', confidence: 'medium' },
  { phrases: 'constant worry|excessive worry|can\'t relax|nervous all the time|on edge|restless and anxious|generalized worry', condition: 'Generalized Anxiety Disorder', category: 'Mental Health', confidence: 'medium' },
  { phrases: 'flashbacks|hypervigilant|avoidance behavior|exaggerated startle|intrusive thoughts|re-experiencing|emotional numbing|combat nightmares', condition: 'Post-Traumatic Stress Disorder', category: 'Mental Health', confidence: 'medium' },
  { phrases: 'panic attack|heart racing anxiety|can\'t breathe anxiety|chest tight anxiety|impending doom|sudden intense fear', condition: 'Panic Disorder', category: 'Mental Health', confidence: 'medium' },
  { phrases: 'mood swings|manic episode|depressive episode|cycling moods|euphoric then depressed|racing thoughts with energy', condition: 'Bipolar Disorder', category: 'Mental Health', confidence: 'low' },
  { phrases: 'hearing voices|seeing things|paranoid|delusions|thought disorder|disorganized thinking', condition: 'Psychotic Disorder', category: 'Mental Health', confidence: 'low' },
  { phrases: 'drinking too much|alcohol problem|binge drinking|can\'t stop drinking|blackouts from alcohol|heavy drinking', condition: 'Alcohol Use Disorder', category: 'Mental Health', confidence: 'medium' },

  // ── Musculoskeletal ──
  { phrases: 'lower back hurts|back is killing me|sharp pain in back|lumbar pain|pain radiating down leg|back gives out', condition: 'Lumbar Spine Condition', category: 'Musculoskeletal', confidence: 'medium' },
  { phrases: 'neck pain|stiff neck|pain radiating to arm|cervical pain|neck hurts all the time', condition: 'Cervical Spine Condition', category: 'Musculoskeletal', confidence: 'medium' },
  { phrases: 'knee gives out|knee swelling|knee locks up|knee pops|grinding in knee|knee buckles|knee instability', condition: 'Knee Condition', category: 'Musculoskeletal', confidence: 'medium' },
  { phrases: 'shoulder pain|can\'t lift arm|shoulder clicks|frozen shoulder|shoulder stiffness|limited shoulder motion', condition: 'Shoulder Condition', category: 'Musculoskeletal', confidence: 'medium' },
  { phrases: 'tingling in hands|numbness in fingers|pins and needles|burning sensation extremities|loss of sensation|electric shock feeling', condition: 'Peripheral Neuropathy', category: 'Neurological', confidence: 'medium' },
  { phrases: 'pain all over|widespread pain|tender points|hurts everywhere|whole body aches|chronic widespread', condition: 'Fibromyalgia', category: 'Musculoskeletal', confidence: 'low' },
  { phrases: 'flat feet|fallen arches|foot pain walking|arch pain|foot collapses', condition: 'Pes Planus (Flat Feet)', category: 'Musculoskeletal', confidence: 'medium' },
  { phrases: 'heel pain|bottom of foot hurts|morning foot pain|stabbing heel pain', condition: 'Plantar Fasciitis', category: 'Musculoskeletal', confidence: 'medium' },

  // ── Neurological ──
  { phrases: 'severe headache|pounding headache|throbbing head|light sensitivity headache|migraine aura|visual disturbance headache', condition: 'Migraine', category: 'Neurological', confidence: 'medium' },
  { phrases: 'room spinning|dizzy spells|loss of balance|world tilting|vertigo episodes|positional dizziness', condition: 'Vertigo', category: 'Neurological', confidence: 'medium' },
  { phrases: 'memory problems|can\'t concentrate|brain fog|difficulty thinking|cognitive problems|forgetful|mental clouding', condition: 'Cognitive Impairment', category: 'Neurological', confidence: 'low' },
  { phrases: 'seizure activity|convulsions|loss of consciousness|blacking out|epileptic episode|staring spells', condition: 'Seizure Disorder', category: 'Neurological', confidence: 'medium' },
  { phrases: 'hand tremor|shaking hands|involuntary movement|resting tremor', condition: 'Tremor', category: 'Neurological', confidence: 'medium' },

  // ── Respiratory ──
  { phrases: 'short of breath|can\'t catch breath|winded easily|breathing difficulty|dyspnea on exertion|out of breath', condition: 'Respiratory Condition', category: 'Respiratory', confidence: 'low' },
  { phrases: 'chronic cough|coughing up phlegm|wheezing|chest tightness breathing|asthma attack|reactive airway', condition: 'Asthma/Reactive Airway', category: 'Respiratory', confidence: 'medium' },
  { phrases: 'constant congestion|nasal obstruction|sinus pressure|facial pain sinuses|post-nasal drip|chronic sinus', condition: 'Chronic Sinusitis', category: 'Respiratory', confidence: 'medium' },

  // ── GI ──
  { phrases: 'heartburn|acid coming up|burning in chest after eating|reflux|regurgitation|sour taste in mouth', condition: 'Gastroesophageal Reflux Disease', category: 'GI', confidence: 'medium' },
  { phrases: 'stomach cramps|alternating diarrhea constipation|bloating|abdominal discomfort|irritable bowel', condition: 'Irritable Bowel Syndrome', category: 'GI', confidence: 'medium' },
  { phrases: 'trouble swallowing|food gets stuck|difficulty swallowing|painful swallowing|choking on food', condition: 'Dysphagia', category: 'GI', confidence: 'medium' },

  // ── Cardiovascular ──
  { phrases: 'chest pain|chest pressure|angina|squeezing in chest|heart pain|cardiac pain', condition: 'Cardiac Condition', category: 'Cardiovascular', confidence: 'low' },
  { phrases: 'heart racing|palpitations|irregular heartbeat|skipped beats|fluttering in chest|heart pounds', condition: 'Arrhythmia', category: 'Cardiovascular', confidence: 'medium' },
  { phrases: 'swollen legs|leg swelling|edema|fluid retention|ankles swelling', condition: 'Venous Insufficiency', category: 'Cardiovascular', confidence: 'low' },

  // ── Endocrine ──
  { phrases: 'always thirsty|frequent urination|blood sugar high|glucose elevated|diabetic symptoms', condition: 'Diabetes Mellitus', category: 'Endocrine', confidence: 'medium' },
  { phrases: 'weight gain unexplained|always cold|hair falling out|fatigue thyroid|sluggish thyroid', condition: 'Hypothyroidism', category: 'Endocrine', confidence: 'low' },

  // ── Genitourinary ──
  { phrases: 'leaking urine|urinary accidents|bladder control|incontinence|can\'t hold urine|urgency frequency', condition: 'Urinary Incontinence', category: 'Genitourinary', confidence: 'medium' },
  { phrases: 'difficulty urinating|weak stream|frequent urination at night|nocturia|hesitancy|incomplete emptying', condition: 'Benign Prostatic Hyperplasia', category: 'Genitourinary', confidence: 'low' },

  // ── Dermatological ──
  { phrases: 'itchy skin|rash won\'t go away|skin flaking|dry scaly patches|eczema flare|skin irritation chronic', condition: 'Dermatitis/Eczema', category: 'Dermatological', confidence: 'low' },
  { phrases: 'chloracne|skin condition from exposure|acne from chemicals|dioxin skin', condition: 'Chloracne', category: 'Dermatological', confidence: 'medium' },

  // ── Ophthalmological ──
  { phrases: 'blurry vision|vision getting worse|can\'t see clearly|eye pressure|losing peripheral vision|tunnel vision', condition: 'Visual Impairment', category: 'Ophthalmological', confidence: 'low' },
  { phrases: 'double vision|seeing double|diplopia|eyes not tracking', condition: 'Diplopia', category: 'Ophthalmological', confidence: 'medium' },
  { phrases: 'dry eyes|burning eyes|gritty feeling eyes|eye irritation chronic|tearing excessively', condition: 'Dry Eye Syndrome', category: 'Ophthalmological', confidence: 'medium' },
];

export const SYNONYM_CLUSTERS: SynonymCluster[] = RAW_CLUSTERS.map(c => {
  const phrases = c.phrases.split('|').map(p => p.trim());
  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return {
    phrases,
    regex: new RegExp(`(?:${escaped.join('|')})`, 'i'),
    condition: c.condition,
    category: c.category,
    confidence: c.confidence,
  };
});
