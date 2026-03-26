// ─── Core Medical Keywords (300+ terms) ──────────────────────────────────────
// Expanded from original 85 in route.ts for enhanced Phase 1 extraction.
// Edit this file to add/remove keywords without touching pipeline code.

export const CORE_KEYWORDS = [
  // ── Original 85 (preserved) ──
  'tinnitus', 'hearing loss', 'ptsd', 'post-traumatic', 'sleep apnea',
  'migraine', 'tbi', 'traumatic brain', 'anxiety', 'depression',
  'burn pit', 'burn-pit', 'agent orange', 'gulf war', 'toxic exposure',
  'pact act', 'presumptive', 'iraq', 'afghanistan',
  'back pain', 'lumbar', 'radiculopathy', 'knee', 'shoulder', 'arthritis',
  'cervical', 'sciatica',
  'sinusitis', 'rhinitis', 'asthma', 'copd', 'constrictive bronchiolitis',
  'gerd', 'neuropathy', 'chronic pain', 'fibromyalgia',
  'diabetes', 'hypertension', 'erectile', 'mst', 'military sexual trauma',
  'mgus', 'male breast cancer', 'urethral cancer', 'ischemic heart',
  'pancreatic cancer', 'kidney cancer', 'lymphatic cancer', 'bladder cancer',
  'melanoma', 'hepatitis', 'parkinson',
  'service connected', 'service-connected', 'nexus', 'at least as likely',
  'more likely than not', 'secondary to', 'aggravated by', 'in-service',
  'c&p', 'compensable', 'rated at', 'disability rating', 'tdiu',
  'individual unemployability', 'sc ',
  'diagnosis', 'diagnosed', 'abnormal', 'chronic', 'bilateral',
  'functional impairment', 'limitation of motion', 'worsening',
  'problem list', 'active diagnoses', 'range of motion', 'rom',
  'deluca', 'functional loss', 'pain on use', 'flare-up', 'flare up',
  'buddy statement', 'lay evidence', 'stressor', 'incident report',
  'seizure', 'epilepsy', 'cancer', 'tumor', 'thyroid', 'kidney', 'liver',
  'bipolar', 'schizophrenia', 'suicidal', 'substance',

  // ── Musculoskeletal (expanded) ──
  'degenerative disc', 'disc herniation', 'herniated disc', 'bulging disc',
  'spinal stenosis', 'spondylosis', 'spondylolisthesis', 'ankylosis',
  'rotator cuff', 'torn meniscus', 'meniscal tear', 'acl tear', 'acl injury',
  'carpal tunnel', 'plantar fasciitis', 'tendinitis', 'tendonitis',
  'bursitis', 'gout', 'osteoporosis', 'osteopenia',
  'sacroiliac', 'si joint', 'hip pain', 'ankle pain', 'foot pain',
  'wrist pain', 'elbow pain', 'neck pain', 'thoracic',
  'frozen shoulder', 'adhesive capsulitis', 'impingement',
  'total knee replacement', 'total hip replacement', 'joint replacement',
  'laminectomy', 'discectomy', 'spinal fusion', 'bone spur',
  'muscle spasm', 'myofascial pain', 'trigger point',
  'strain', 'sprain', 'fracture', 'dislocation',
  'compartment syndrome', 'flat feet', 'pes planus',
  'hallux valgus', 'bunion', 'hammer toe',

  // ── Mental Health (expanded) ──
  'major depressive', 'persistent depressive', 'dysthymia',
  'panic disorder', 'panic attack', 'agoraphobia', 'social anxiety',
  'obsessive compulsive', 'ocd', 'adjustment disorder',
  'dissociative', 'depersonalization', 'derealization',
  'borderline personality', 'antisocial personality',
  'attention deficit', 'adhd', 'add',
  'insomnia', 'nightmare', 'night terror', 'hypervigilance',
  'psychosis', 'psychotic', 'hallucination', 'delusion',
  'anorexia', 'bulimia', 'eating disorder', 'binge eating',
  'alcohol use disorder', 'alcohol dependence', 'substance use disorder',
  'opioid use disorder', 'cannabis use disorder',
  'traumatic stress', 'acute stress', 'combat stress',
  'moral injury', 'survivor guilt',
  'cognitive behavioral', 'emdr', 'prolonged exposure',
  'suicidal ideation', 'self-harm', 'homicidal ideation',

  // ── Neurological (expanded) ──
  'headache', 'cluster headache', 'tension headache',
  'vertigo', 'dizziness', 'disequilibrium', 'benign paroxysmal',
  'peripheral neuropathy', 'diabetic neuropathy', 'autonomic neuropathy',
  'multiple sclerosis', 'als', 'amyotrophic lateral',
  'stroke', 'cerebrovascular', 'transient ischemic', 'tia',
  'concussion', 'post-concussion', 'post-concussive',
  'tremor', 'essential tremor', 'restless leg', 'restless legs',
  'narcolepsy', 'cataplexy', 'neuralgia', 'trigeminal',
  'meningitis', 'encephalopathy', 'cognitive decline', 'dementia',
  'memory loss', 'brain fog', 'cognitive impairment',

  // ── Hearing / ENT (expanded) ──
  'sensorineural', 'conductive hearing', 'mixed hearing loss',
  'acoustic trauma', 'noise-induced', 'ototoxic',
  'menieres', "meniere's", 'vestibular', 'labyrinthitis',
  'deviated septum', 'nasal polyp', 'chronic sinusitis',
  'vocal cord', 'laryngitis', 'dysphagia', 'swallowing difficulty',
  'ear infection', 'otitis', 'eustachian',

  // ── Respiratory (expanded) ──
  'pulmonary fibrosis', 'interstitial lung', 'pleural effusion',
  'pneumothorax', 'pulmonary embolism', 'pulmonary hypertension',
  'sarcoidosis', 'emphysema', 'bronchitis', 'chronic bronchitis',
  'reactive airway', 'airway obstruction', 'dyspnea', 'shortness of breath',
  'oxygen therapy', 'supplemental oxygen', 'spirometry',

  // ── Cardiovascular (expanded) ──
  'coronary artery', 'atrial fibrillation', 'afib', 'arrhythmia',
  'heart failure', 'congestive heart', 'cardiomyopathy',
  'angina', 'chest pain', 'myocardial infarction', 'heart attack',
  'peripheral vascular', 'peripheral artery', 'deep vein thrombosis', 'dvt',
  'varicose veins', 'venous insufficiency', 'aortic aneurysm',
  'pacemaker', 'stent', 'bypass', 'valve replacement',
  'hyperlipidemia', 'high cholesterol', 'hypotension',
  'raynaud', 'raynauds',

  // ── GI / Digestive (expanded) ──
  'irritable bowel', 'ibs', 'crohn', "crohn's", 'ulcerative colitis',
  'celiac', 'diverticulitis', 'diverticulosis', 'peptic ulcer',
  'gastritis', 'esophagitis', "barrett's", 'barrets',
  'hiatal hernia', 'inguinal hernia', 'abdominal hernia',
  'fatty liver', 'cirrhosis', 'liver disease', 'hepatic',
  'pancreatitis', 'gallstones', 'cholecystectomy', 'colostomy',
  'rectal prolapse', 'hemorrhoids', 'anal fissure',
  'gastroparesis', 'malabsorption', 'dyspepsia',

  // ── Endocrine (expanded) ──
  'hypothyroidism', 'hyperthyroidism', 'hashimoto', "hashimoto's",
  'graves disease', 'thyroid nodule', 'thyroidectomy',
  'diabetes mellitus', 'type 1 diabetes', 'type 2 diabetes',
  'diabetic retinopathy', 'diabetic nephropathy',
  'adrenal insufficiency', 'addison', "addison's", 'cushing',
  'pcos', 'polycystic', 'testosterone deficiency', 'hypogonadism',
  'metabolic syndrome', 'obesity', 'morbid obesity',

  // ── Genitourinary (expanded) ──
  'urinary incontinence', 'overactive bladder', 'urinary retention',
  'kidney stone', 'nephrolithiasis', 'renal insufficiency',
  'chronic kidney', 'renal failure', 'dialysis',
  'prostate', 'benign prostatic', 'bph', 'prostatitis',
  'testicular', 'varicocele', 'hydrocele',
  'urinary tract infection', 'uti', 'interstitial cystitis',
  'pelvic floor', 'pelvic pain',

  // ── Dermatological (expanded) ──
  'eczema', 'psoriasis', 'dermatitis', 'contact dermatitis',
  'acne', 'rosacea', 'urticaria', 'hives',
  'skin cancer', 'basal cell', 'squamous cell', 'keloid',
  'scar', 'scarring', 'chloracne', 'cyst', 'lipoma',
  'tinea', 'fungal infection', 'cellulitis',
  'hidradenitis', 'vitiligo', 'alopecia',
  'burn scar', 'chemical burn', 'radiation dermatitis',

  // ── Ophthalmological (expanded) ──
  'glaucoma', 'cataract', 'macular degeneration',
  'dry eye', 'keratoconus', 'corneal', 'retinal detachment',
  'visual impairment', 'blindness', 'optic neuritis',
  'strabismus', 'diplopia', 'double vision', 'photophobia',
  'pterygium', 'uveitis',

  // ── Oncological (expanded) ──
  'leukemia', 'lymphoma', 'myeloma', 'carcinoma',
  'lung cancer', 'colon cancer', 'prostate cancer', 'breast cancer',
  'liver cancer', 'brain cancer', 'glioblastoma',
  'mesothelioma', 'sarcoma', 'metastatic', 'metastasis',
  'radiation therapy', 'chemotherapy', 'remission', 'oncology',

  // ── Dental (VA-relevant) ──
  'dental trauma', 'jaw pain', 'tmj', 'temporomandibular',
  'bruxism', 'tooth loss', 'dental prosthesis',

  // ── Exposure-specific (military) ──
  'camp lejeune', 'contaminated water', 'radiation exposure',
  'depleted uranium', 'herbicide', 'dioxin',
  'jet fuel', 'jp-8', 'asbestos', 'lead exposure',
  'noise exposure', 'blast exposure', 'blast injury',
  'cold injury', 'frostbite', 'heat injury', 'heat stroke',

  // ── Claims / Legal language (expanded) ──
  'direct service connection', 'presumptive service connection',
  'increased rating', 'total disability', '100 percent',
  'schedular', 'extraschedular', 'favorable finding',
  'unfavorable', 'remand', 'board of veterans appeals', 'bva',
  'supplemental claim', 'higher level review',
  'duty to assist', 'benefit of the doubt',
  'independent medical opinion', 'imo', 'independent medical evaluation',
  'vocational rehabilitation', 'chapter 31',
];

export const KEYWORD_PATTERNS = CORE_KEYWORDS.map(k =>
  new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
);

export const GENERIC_STANDALONE_TERMS = new Set([
  'diagnosed', 'diagnosis', 'chronic', 'abnormal', 'bilateral',
  'problem list', 'active diagnoses', 'worsening',
  'functional impairment', 'limitation of motion', 'pain on use',
  'range of motion', 'rom', 'deluca', 'functional loss',
  'flare-up', 'flare up',
]);
