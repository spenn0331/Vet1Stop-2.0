// Strike 6 — Expand federal VA health resources (5 → 30+)
// Adds 27 new federal subcategory docs to healthResources collection.
// Usage: node scripts/seed-federal-va-resources.js [--dry-run]
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const DRY_RUN = process.argv.includes('--dry-run');
const uri    = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';

const now = new Date();

const FEDERAL_RESOURCES = [
  // ── Mental Health ──────────────────────────────────────────────────────────
  {
    title: 'VA PTSD Treatment Programs',
    description: 'Comprehensive PTSD care including Cognitive Processing Therapy (CPT), Prolonged Exposure therapy, and group counseling at VA Medical Centers nationwide. Free for eligible veterans with service-connected PTSD.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/ptsd/',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.6,
    tags: ['ptsd', 'mental health', 'trauma', 'counseling', 'therapy', 'veteran', 'free', 'cognitive processing therapy'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA PTSD Coach App',
    description: 'Free mobile app developed by VA to help veterans manage PTSD symptoms. Includes self-assessment tools, coping strategies, and access to support resources available 24/7.',
    url: 'https://www.ptsd.va.gov/appvid/mobile/ptsdcoach_app.asp',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['ptsd', 'mental health', 'app', 'self-help', 'veteran', 'free', 'mobile', 'coping'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'National Center for PTSD',
    description: "VA's center of excellence for PTSD research, education, and treatment. Provides educational resources, clinical tools, and the latest evidence-based treatment information for veterans and clinicians.",
    url: 'https://www.ptsd.va.gov/',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.7,
    tags: ['ptsd', 'mental health', 'trauma', 'research', 'veteran', 'free', 'education'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Suicide Prevention Program',
    description: 'Comprehensive suicide prevention services including the Veterans Crisis Line (988 Press 1), safety planning, lethal means counseling, and follow-up care for at-risk veterans.',
    url: 'https://www.mentalhealth.va.gov/suicide_prevention/',
    phone: '988 (Press 1)',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.8,
    tags: ['crisis', 'mental health', 'suicide prevention', 'veteran', 'free', 'safety', '988'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Substance Use Disorder Treatment',
    description: 'Comprehensive substance use disorder treatment including medication-assisted treatment (MAT), detox programs, residential rehab, and outpatient counseling. Free for enrolled veterans.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/substance-use-problems/',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.4,
    tags: ['substance use', 'alcohol', 'recovery', 'rehabilitation', 'mental health', 'veteran', 'free', 'detox'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  // ── Physical Health & Pain ─────────────────────────────────────────────────
  {
    title: 'VA Whole Health Program',
    description: 'Integrative health approach combining conventional medicine with yoga, nutrition, mindfulness, and fitness coaching. Available at all VA Medical Centers with personalized health coaching. Free for enrolled veterans.',
    url: 'https://www.va.gov/wholehealth/',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.6,
    tags: ['wellness', 'fitness', 'yoga', 'nutrition', 'mindfulness', 'veteran', 'free', 'integrative health', 'chronic pain'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Physical Therapy & Rehabilitation',
    description: 'Evidence-based physical therapy for musculoskeletal conditions including back pain, knee injuries, and post-surgical rehab. Provided at VA Medical Centers and CBOCs nationwide.',
    url: 'https://www.va.gov/health-care/about-va-health-benefits/',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.4,
    tags: ['physical therapy', 'back pain', 'knee pain', 'rehabilitation', 'musculoskeletal', 'chronic pain', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Pain Management Program',
    description: 'Comprehensive chronic pain management using multimodal approaches including medication management, physical therapy, acupuncture, and pain psychology. VA Pain Clinics available at major VAMCs.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/pain-management/',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.3,
    tags: ['chronic pain', 'pain management', 'back pain', 'acupuncture', 'physical therapy', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA MOVE! Weight Management Program',
    description: 'Evidence-based weight management program at VA facilities nationwide. Combines group education, nutrition counseling, physical activity coaching, and behavioral health support. Free for enrolled veterans.',
    url: 'https://www.move.va.gov/',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.3,
    tags: ['weight loss', 'fitness', 'nutrition', 'wellness', 'obesity', 'veteran', 'free', 'lifestyle'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Audiology & Tinnitus Services',
    description: 'Audiology services including hearing aids, tinnitus management (TRT, sound therapy), cochlear implant evaluation, and hearing loss treatment. Free for veterans with service-connected hearing conditions.',
    url: 'https://www.va.gov/health-care/about-va-health-benefits/hearing-aids/',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['tinnitus', 'hearing', 'audiology', 'hearing loss', 'hearing aids', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Sleep Medicine Program',
    description: 'Diagnosis and treatment for sleep disorders including sleep apnea (CPAP/BiPAP equipment), insomnia, and restless leg syndrome. VA provides CPAP equipment at no cost for eligible veterans.',
    url: 'https://www.va.gov/health-care/about-va-health-benefits/',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.4,
    tags: ['sleep apnea', 'sleep', 'insomnia', 'CPAP', 'sleep medicine', 'veteran', 'free', 'respiratory'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA TBI Rehabilitation Program',
    description: 'Specialized traumatic brain injury evaluation and rehabilitation at VA Polytrauma Rehabilitation Centers. Services include cognitive rehab, occupational therapy, speech therapy, and neuropsychology.',
    url: 'https://www.polytrauma.va.gov/',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.6,
    tags: ['tbi', 'traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation', 'polytrauma', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Prosthetics & Sensory Aids Service',
    description: 'Free prosthetics, orthopedic braces, wheelchairs, and sensory aids for eligible veterans. Includes advanced prosthetic limbs, custom orthotics, and adaptive sports equipment programs.',
    url: 'https://www.va.gov/health-care/about-va-health-benefits/prosthetic-care/',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['prosthetics', 'disability', 'adaptive', 'orthopedic', 'wheelchair', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  // ── Fitness & Wellness ────────────────────────────────────────────────────
  {
    title: 'VA Adaptive Sports Program',
    description: 'Competitive and recreational adaptive sports for veterans with disabilities. Includes wheelchair basketball, sitting volleyball, Paralympic events, and the National Veterans Wheelchair Games.',
    url: 'https://www.va.gov/adaptive-sports/',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.7,
    tags: ['adaptive sports', 'fitness', 'disability', 'wheelchair', 'Paralympic', 'veteran', 'free', 'recreation'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Diabetes Management Program',
    description: 'Comprehensive diabetes care including education, dietitian counseling, medication management, and insulin programs. VA coordinates full metabolic health teams for veterans with Type 1 or Type 2 diabetes.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/diabetes/',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.4,
    tags: ['diabetes', 'metabolic', 'nutrition', 'wellness', 'chronic conditions', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  // ── Benefits & Access ─────────────────────────────────────────────────────
  {
    title: 'VA Health Care Enrollment',
    description: 'Apply for VA healthcare coverage based on military service. Enrollment provides access to all VA medical services, prescriptions, and mental health care. Free for most veterans.',
    url: 'https://www.va.gov/health-care/apply/application/introduction',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.3,
    tags: ['healthcare', 'enrollment', 'benefits', 'va', 'veteran', 'free', 'insurance'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Community Care Program (MISSION Act)',
    description: 'MISSION Act allows eligible veterans to receive care from community (non-VA) providers when VA care is unavailable or travel is a hardship. Includes community mental health, specialty care, and urgent care.',
    url: 'https://www.va.gov/communitycare/',
    phone: '1-866-606-8198',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.2,
    tags: ['community care', 'MISSION Act', 'healthcare', 'veteran', 'free', 'specialty care', 'mental health'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'My HealtheVet — VA Patient Portal',
    description: 'Secure online portal to manage VA health records, schedule appointments, refill prescriptions, send secure messages to providers, and view test results. Available 24/7 from any device.',
    url: 'https://www.myhealth.va.gov/',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.4,
    tags: ['records', 'portal', 'prescriptions', 'appointments', 'veteran', 'free', 'telemedicine', 'digital'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Caregiver Support Program',
    description: 'Comprehensive support for veterans needing assistance including the Program of Comprehensive Assistance for Family Caregivers (PCAFC): monthly stipends, health insurance, respite care, mental health services.',
    url: 'https://www.caregiver.va.gov/',
    phone: '1-855-260-3274',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.4,
    tags: ['caregiver', 'family', 'support', 'respite', 'veteran', 'free', 'PCAFC'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Women Veterans Health Program',
    description: 'Comprehensive women\'s health services including primary care, mental health, gynecology, MST treatment, maternity care, and women veteran coordinators at every VA facility. Free for eligible women veterans.',
    url: 'https://www.womenshealth.va.gov/',
    phone: '1-855-829-6636',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['women veterans', 'mst', 'mental health', 'gynecology', 'veteran', 'free', 'primary care', 'maternal care'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Pharmacy Benefits',
    description: 'Prescription medications filled at VA pharmacies for $0–$15 copay (free for 50%+ disability or income-based). Mail-order pharmacy available. VA formulary covers all standard treatments.',
    url: 'https://www.va.gov/health-care/about-va-health-benefits/pharmacy-benefits/',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['pharmacy', 'prescriptions', 'medication', 'veteran', 'free', 'benefits'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Community Based Outpatient Clinics (CBOCs)',
    description: 'Smaller VA clinics providing primary care, mental health, and preventive care closer to where veterans live. Eliminate need to travel to main VA Medical Center for routine appointments.',
    url: 'https://www.va.gov/find-locations/',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.2,
    tags: ['primary care', 'mental health', 'veteran', 'free', 'local', 'clinic', 'outpatient', 'convenient'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA MST-Related Mental Health Care',
    description: 'Free mental health treatment for military sexual trauma (MST) — available to ALL veterans regardless of service-connected disability rating or enrollment status. No co-pays ever.',
    url: 'https://www.mentalhealth.va.gov/msthome.asp',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.6,
    tags: ['mst', 'military sexual trauma', 'mental health', 'trauma', 'counseling', 'veteran', 'free', 'women veterans'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Blind Rehabilitation Service',
    description: 'Comprehensive blind and low vision rehabilitation including assistive technology training, orientation & mobility, and residential blindness rehab programs. Free for eligible veterans.',
    url: 'https://www.rehab.va.gov/blindrehab/',
    subcategory: 'federal',
    priority: 'low',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['blind', 'low vision', 'rehabilitation', 'assistive technology', 'disability', 'veteran', 'free'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Vocational Rehabilitation & Employment (VR&E)',
    description: 'Chapter 31 VR&E helps veterans with service-connected disabilities prepare for, find, and maintain suitable employment through education, training, and job placement. Monthly subsistence allowance provided.',
    url: 'https://www.va.gov/careers-employment/vocational-rehabilitation/',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.3,
    tags: ['vocational', 'employment', 'disability', 'education', 'veteran', 'free', 'training', 'career'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'VA Dental Care Benefits',
    description: 'Dental care available for veterans with 100% service-connected disability, former POWs, and those meeting specific eligibility criteria. Community Dental Insurance Program (VADIP) available for other veterans.',
    url: 'https://www.va.gov/health-care/about-va-health-benefits/dental-care/',
    phone: '1-800-827-1000',
    subcategory: 'federal',
    priority: 'medium',
    isFree: true,
    costLevel: 'free',
    rating: 4.1,
    tags: ['dental', 'benefits', 'veteran', 'free', '100% disability', 'dental insurance'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'SAMHSA Veterans Behavioral Health',
    description: 'Substance Abuse and Mental Health Services Administration resources for veterans including the National Helpline (free, confidential, 24/7) and treatment locator for mental health and substance use programs.',
    url: 'https://www.samhsa.gov/veterans-and-military-families',
    phone: '1-800-662-4357',
    subcategory: 'federal',
    priority: 'high',
    isFree: true,
    costLevel: 'free',
    rating: 4.5,
    tags: ['mental health', 'substance use', 'recovery', 'veteran', 'free', 'crisis', 'hotline', 'counseling'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
  {
    title: 'TRICARE Health Coverage (Active Duty & Retirees)',
    description: 'TRICARE is the health insurance program for uniformed service members, retirees, and their families. Plans include TRICARE Prime (HMO), TRICARE Select (PPO), and TRICARE For Life for Medicare-eligible retirees.',
    url: 'https://www.tricare.mil/',
    phone: '1-844-866-9378',
    subcategory: 'federal',
    priority: 'medium',
    isFree: false,
    costLevel: 'low',
    rating: 4.0,
    tags: ['TRICARE', 'health insurance', 'retiree', 'military', 'veteran', 'healthcare', 'coverage'],
    location: { state: 'National', city: 'Nationwide', region: 'National' },
    updatedAt: now,
    createdAt: now,
  },
];

async function run() {
  if (!uri) { console.error('MONGODB_URI not set in .env.local'); process.exit(1); }

  console.log(`\n====== Federal VA Resource Seed ${DRY_RUN ? '(DRY RUN)' : ''} ======`);
  console.log(`Resources to seed: ${FEDERAL_RESOURCES.length}`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const coll = client.db(dbName).collection('healthResources');

    const preSeed = await coll.countDocuments({ subcategory: 'federal' });
    console.log(`Federal count BEFORE: ${preSeed}`);

    if (DRY_RUN) {
      console.log('\nSample entries:');
      FEDERAL_RESOURCES.slice(0, 3).forEach(r => console.log(`  "${r.title}" — tags: [${r.tags.slice(0,4).join(', ')}]`));
      console.log('\nDry run complete. Run without --dry-run to insert.');
      return;
    }

    // Check for existing titles to avoid duplicates
    const existingTitles = new Set(
      (await coll.find({ subcategory: 'federal' }).project({ title: 1 }).toArray())
        .map(d => d.title.toLowerCase())
    );

    const newResources = FEDERAL_RESOURCES.filter(
      r => !existingTitles.has(r.title.toLowerCase())
    );
    const skipped = FEDERAL_RESOURCES.length - newResources.length;

    if (newResources.length === 0) {
      console.log('All resources already exist — nothing to insert.');
      return;
    }

    const result = await coll.insertMany(newResources);
    console.log(`✅ Inserted: ${result.insertedCount} docs (${skipped} already existed)`);

    const postSeed = await coll.countDocuments({ subcategory: 'federal' });
    const total    = await coll.countDocuments();
    const ngo      = await coll.countDocuments({ subcategory: 'ngo' });
    const state    = await coll.countDocuments({ subcategory: 'state' });

    console.log(`\nFederal count AFTER: ${postSeed}`);
    console.log(`Total healthResources: ${total} (federal: ${postSeed} | ngo: ${ngo} | state: ${state})`);
    console.log('\n====== Seed Complete ======');
  } finally {
    await client.close();
  }
}

run().catch(console.error);
