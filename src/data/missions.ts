/**
 * missions.ts — Static Mission Briefings registry
 * 8 veteran health missions, each step enriched with NGO partner objects.
 * No API call, no auth dependency. Read directly in components.
 */

export interface MissionNGO {
  title: string;
  description: string;
  url: string;
  phone?: string;
}

export interface MissionStep {
  id: string;
  title: string;
  description: string;
  keyPoints: string[];
  actionItems: string[];
  tips?: string[];
  warnings?: string[];
  estimatedTimeMinutes: number;
  order: number;
  ngoPartners: MissionNGO[];
  recordsReconDeeplink?: boolean;
  /** Strike 9 — Vet1Stop platform tip pointing to a specific tool (Records Recon, Symptom Finder, Sea Bag) */
  vet1stopTip?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  objective: string;
  targetAudience: string[];
  tags: string[];
  estimatedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  featured: boolean;
  steps: MissionStep[];
  icon: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'transitioning-healthcare',
    title: 'Transitioning from Military Healthcare',
    description: 'A step-by-step guide to help veterans transition from military to VA or civilian healthcare.',
    objective: 'Get enrolled in VA healthcare and establish a long-term care routine.',
    targetAudience: ['Recently separated veterans', 'Veterans within 1 year of separation'],
    tags: ['healthcare transition', 'VA enrollment', 'medical records', 'transition', 'separation'],
    estimatedDuration: 110,
    difficulty: 'medium',
    featured: true,
    icon: 'transition',
    steps: [
      {
        id: 'step-1-1', title: 'Understand Your Healthcare Options', order: 1,
        description: 'Learn about VA healthcare, TRICARE, and civilian options available after separation.',
        keyPoints: [
          'VA Healthcare covers service-connected conditions — apply using VA Form 10-10EZ',
          'TRICARE is available to retired service members and certain separated veterans',
          'Civilian Marketplace plans (Healthcare.gov) are an option if VA eligibility is uncertain',
          'You may have a transition coverage window — act quickly to avoid gaps in coverage',
        ],
        actionItems: ['Check VA eligibility at va.gov/health-care/eligibility', 'Confirm TRICARE status with your branch', 'Note your exact separation date — coverage windows are time-sensitive'],
        tips: ['Even if healthy, enrolling in VA now protects you if service-connected issues emerge later.'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'Disabled American Veterans (DAV)', description: 'Free VA claims and benefits navigation for transitioning veterans.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
          { title: 'American Legion', description: 'Benefits counseling and healthcare enrollment support at local posts nationwide.', url: 'https://www.legion.org/', phone: '1-800-433-3318' },
        ],
      },
      {
        id: 'step-1-2', title: 'Collect Your Medical Records', order: 2,
        description: 'Obtain and organize your complete military medical records before they become harder to access.',
        keyPoints: [
          'Military medical records are critical evidence for VA disability claims',
          'Request through milConnect, Standard Form 180, or your Military Treatment Facility',
          'Keep both digital and physical copies organized by date and condition',
          'Highlight diagnoses and treatments that may be service-connected',
        ],
        actionItems: ['Submit records request via milConnect or SF-180', 'Organize digital copies in a secure folder', 'Use Vet1Stop Records Recon to extract and organize your records'],
        tips: ['Request records before separating — access gets harder after you\'re out.'],
        estimatedTimeMinutes: 20,
        recordsReconDeeplink: true,
        vet1stopTip: 'Upload your records to Vet1Stop Records Recon — it automatically extracts conditions, dates, and service-connection language. Your Evidence Report is print-ready to share with your VSO.',
        ngoPartners: [
          { title: 'Veterans of Foreign Wars (VFW)', description: 'Free VSO assistance with records requests and VA claims documentation.', url: 'https://www.vfw.org/', phone: '1-816-756-3390' },
        ],
      },
      {
        id: 'step-1-3', title: 'Apply for VA Healthcare', order: 3,
        description: 'Submit your VA healthcare application using the fastest available method.',
        keyPoints: [
          'Apply online at va.gov/health-care/apply (fastest — decisions in under a week)',
          'You\'ll need your DD214, Social Security Number, and medical records',
          'Priority groups determine copay level — service-connected conditions get highest priority',
          'Set up My HealtheVet after approval for online scheduling and prescription management',
        ],
        actionItems: ['Gather DD214 and SSN', 'Complete VA Form 10-10EZ at va.gov', 'Note your confirmation number and application date', 'Set up My HealtheVet after approval'],
        estimatedTimeMinutes: 30,
        ngoPartners: [
          { title: 'DAV (Disabled American Veterans)', description: 'Walk you through the VA enrollment application to ensure nothing is missed.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
        ],
      },
      {
        id: 'step-1-4', title: 'Schedule Your Initial VA Appointments', order: 4,
        description: 'Set up primary care and mental health appointments with your new VA care team.',
        keyPoints: [
          'You\'ll be assigned a Patient Aligned Care Team (PACT) — your primary care home base',
          'Schedule primary care within 30 days of enrollment',
          'Request a mental health screening at your first visit — it\'s confidential',
          'Bring your full medical records and a written list of current medications',
        ],
        actionItems: ['Call VA appointment line: 1-866-606-8198 or use My HealtheVet', 'Prepare list of current medications and top 3 health concerns', 'Request mental health screening at first visit'],
        estimatedTimeMinutes: 25,
        vet1stopTip: 'After enrolling, use Vet1Stop Symptom Finder to match your conditions to VA, NGO, and state resources beyond the VA system — many veterans miss free community programs.',
        ngoPartners: [
          { title: 'My HealtheVet', description: 'VA\'s patient portal for scheduling, prescriptions, and health records — 24/7 access.', url: 'https://www.myhealth.va.gov/' },
          { title: 'Vet Centers', description: 'Community-based VA counseling with shorter wait times than main facilities.', url: 'https://www.vetcenter.va.gov/', phone: '1-877-927-8387' },
        ],
      },
      {
        id: 'step-1-5', title: 'Establish Your Long-term Routine', order: 5,
        description: 'Build sustainable healthcare habits so you stay proactive instead of reactive.',
        keyPoints: [
          'Schedule annual physical exams and keep up with recommended screenings',
          'Set up medication delivery through My HealtheVet to avoid pharmacy trips',
          'Know the difference between VA emergency, urgent, and routine care',
          'VA Whole Health offers yoga, nutrition coaching, and wellness programs — free for enrolled veterans',
        ],
        actionItems: ['Set up prescription delivery via My HealtheVet', 'Download the VA Mobile app', 'Identify your nearest VA urgent care location', 'Ask your PACT about Whole Health programs'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Team Red White & Blue', description: 'Physical and social fitness programs connecting veterans to communities nationwide.', url: 'https://www.teamrwb.org/' },
          { title: 'VA Whole Health Program', description: 'Free integrative health including yoga, nutrition, and fitness for enrolled veterans.', url: 'https://www.va.gov/wholehealth/' },
        ],
      },
    ],
  },

  {
    id: 'mental-health-ptsd',
    title: 'Mental Health & PTSD Support',
    description: 'Navigate resources and steps for addressing PTSD and other mental health concerns as a veteran.',
    objective: 'Connect with evidence-based treatment and build a sustainable mental health support system.',
    targetAudience: ['Veterans with PTSD', 'Combat veterans', 'Veterans seeking mental health support'],
    tags: ['PTSD', 'mental health', 'trauma', 'anxiety', 'depression', 'crisis', 'sleep'],
    estimatedDuration: 90,
    difficulty: 'medium',
    featured: true,
    icon: 'mental-health',
    steps: [
      {
        id: 'step-2-1', title: 'Recognizing the Signs', order: 1,
        description: 'Identify PTSD and mental health symptoms — and understand that seeking help is strength.',
        keyPoints: [
          'PTSD signs: flashbacks, avoidance behaviors, sleep disturbances, hypervigilance, emotional numbing',
          'Also watch for depression, anxiety, anger management difficulties, and substance use changes',
          'Symptoms interfering with daily life, work, or relationships are a clear signal to reach out',
          'You can be evaluated confidentially — asking doesn\'t commit you to any treatment',
        ],
        actionItems: ['Review the PCL-5 PTSD checklist at va.gov', 'Note which symptoms you\'ve experienced in the past month', 'Identify one trusted person to discuss concerns with'],
        warnings: ['If you\'re having thoughts of harming yourself or others — call 988 Press 1 now. Do not wait.'],
        estimatedTimeMinutes: 15,
        vet1stopTip: 'Use Vet1Stop Symptom Finder to describe your mental health concerns — it matches you to VA, NGO, and state programs tailored to PTSD, anxiety, and trauma.',
        ngoPartners: [
          { title: 'Veterans Crisis Line', description: 'Free, confidential 24/7 support. Call 988 Press 1, text 838255.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)' },
          { title: 'NAMI (National Alliance on Mental Illness)', description: 'Free peer-led support groups and mental health navigation for veterans.', url: 'https://www.nami.org/', phone: '1-800-950-6264' },
        ],
      },
      {
        id: 'step-2-2', title: 'Crisis Resources', order: 2,
        description: 'Immediate support if you or someone you know is in a mental health crisis right now.',
        keyPoints: [
          'Veterans Crisis Line: 988 Press 1 — free, confidential, 24/7/365',
          'Text 838255 or chat at VeteransCrisisLine.net/Chat for non-voice options',
          'VA emergency mental health services are available 24/7 at every VAMC — no appointment needed',
          'After crisis: connect with a VA Suicide Prevention Coordinator to create a safety plan',
        ],
        actionItems: ['Save 988 in your phone as "Veterans Crisis Line"', 'Identify your nearest VA Medical Center emergency entrance', 'Create or update a safety plan with a provider'],
        warnings: ['Never wait for a crisis to pass on its own. VA emergency mental health has no wait list.'],
        estimatedTimeMinutes: 10,
        ngoPartners: [
          { title: 'Veterans Crisis Line', description: 'Call 988 Press 1 — free, confidential, 24/7. Text 838255.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)' },
          { title: 'Stop Soldier Suicide', description: 'Peer-led crisis intervention and mental health outreach for veterans.', url: 'https://stopsoldiersuicide.org/', phone: '1-800-273-8255' },
        ],
      },
      {
        id: 'step-2-3', title: 'Evidence-Based Treatment Options', order: 3,
        description: 'The proven therapies for PTSD and mental health — and how to access them through VA.',
        keyPoints: [
          'CPT (Cognitive Processing Therapy): 12 sessions, challenges unhelpful trauma-related beliefs',
          'Prolonged Exposure (PE): reduces avoidance through guided, gradual trauma memory processing',
          'EMDR: uses bilateral stimulation to change your reaction to traumatic memories',
          'VA offers outpatient, residential, telehealth, and PTSD specialty programs',
          'Telehealth therapy is equally effective as in-person — don\'t let distance stop you',
        ],
        actionItems: ['Request a PTSD specialty evaluation through your VA primary care provider', 'Ask specifically about CPT or PE — strongest evidence base', 'Inquire about telehealth options', 'Ask about the free VA PTSD Coach app'],
        tips: ['It\'s okay to try a therapist and switch if the fit isn\'t right. Ask for another referral.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Give An Hour', description: 'Free mental health services from licensed professionals — PTSD and military trauma specialists.', url: 'https://giveanhour.org/' },
          { title: 'Headstrong Project', description: 'Free, confidential PTSD treatment for post-9/11 veterans through licensed therapists.', url: 'https://getheadstrong.org/' },
          { title: 'Cohen Veterans Network', description: 'Nationwide sliding-scale clinics for PTSD, TBI, and adjustment disorders.', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936' },
        ],
      },
      {
        id: 'step-2-4', title: 'Building Your Support Network', order: 4,
        description: 'Create a support system — professional, peer, family, and community — that sustains recovery.',
        keyPoints: [
          'VA peer specialists are veterans trained to support other veterans in recovery',
          'Vet Centers offer readjustment counseling with shorter wait times than main VA facilities',
          'Family therapy helps loved ones understand PTSD and gives them tools to support you',
          'Community and volunteer engagement reduce isolation — one of the strongest risk factors',
        ],
        actionItems: ['Find your nearest Vet Center at vetcenter.va.gov', 'Ask your VA provider about peer support specialist availability', 'Look into one veteran group (VFW post, Team RWB, volunteer program)'],
        estimatedTimeMinutes: 25,
        ngoPartners: [
          { title: 'Vet Centers', description: 'Community readjustment counseling with peer specialists and shorter wait times.', url: 'https://www.vetcenter.va.gov/', phone: '1-877-927-8387' },
          { title: 'Wounded Warrior Project', description: 'Mental health programs and peer support for post-9/11 veterans.', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586' },
        ],
      },
      {
        id: 'step-2-5', title: 'Daily Self-Care Strategies', order: 5,
        description: 'Build your own mental wellness toolkit — habits that work between therapy sessions.',
        keyPoints: [
          'Regular exercise (30 min daily) reduces PTSD symptoms comparably to some medications',
          'Grounding techniques (5-4-3-2-1 senses) interrupt flashbacks and anxiety spirals in real time',
          'Consistent sleep schedule — even weekends — is the highest-leverage single habit',
          'Limiting alcohol is essential — it worsens PTSD symptoms even when it feels like relief',
        ],
        actionItems: ['Download the free VA PTSD Coach app', 'Practice one mindfulness or grounding exercise this week', 'Set a consistent sleep/wake schedule for 7 days'],
        tips: ['Start small. One 10-minute walk beats planning a full routine and quitting after day 2.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Team Red White & Blue', description: 'Physical and social fitness programs for veterans — free to join, chapters nationwide.', url: 'https://www.teamrwb.org/' },
          { title: 'VA Whole Health Program', description: 'Yoga, meditation, nutrition, and mind-body services — free for enrolled veterans.', url: 'https://www.va.gov/wholehealth/' },
        ],
      },
    ],
  },

  {
    id: 'emergency-care',
    title: 'Accessing Emergency Care',
    description: 'Know when and how to get emergency care as a veteran, including VA and non-VA options.',
    objective: 'Be prepared for any emergency with the right contacts, coverage knowledge, and a personal plan.',
    targetAudience: ['All veterans', 'Veterans with VA healthcare', 'Veterans with chronic conditions'],
    tags: ['emergency care', 'urgent care', 'VA healthcare', 'medical emergencies'],
    estimatedDuration: 75,
    difficulty: 'easy',
    featured: false,
    icon: 'emergency',
    steps: [
      {
        id: 'step-3-1', title: 'Emergency vs. Urgent Care', order: 1,
        description: 'Know exactly which situations need the ER versus an urgent care visit.',
        keyPoints: [
          'Emergency: chest pain, severe bleeding, stroke, severe head injury, suicidal thoughts → 911 or ER',
          'Urgent care: minor cuts, sprains, fever, UTIs, minor fractures — no ER needed',
          'VA Emergency mental health is 24/7 at every VAMC — no appointment, no wait list',
          'When in doubt: choose emergency care — it\'s always better to err on the side of safety',
        ],
        actionItems: ['Save nearest VAMC address in your phone', 'Save 988 as "Veterans Crisis Line"', 'Know your nearest non-VA ER as backup'],
        warnings: ['Never drive yourself to the ER in a true emergency. Call 911.'],
        estimatedTimeMinutes: 10,
        ngoPartners: [
          { title: 'Veterans Crisis Line', description: 'Mental health emergencies 24/7 — Call 988 Press 1, text 838255.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)' },
        ],
      },
      {
        id: 'step-3-2', title: 'VA Emergency Care Coverage', order: 2,
        description: 'Understand what VA covers at non-VA emergency facilities and the 72-hour notification rule.',
        keyPoints: [
          'VA can cover non-VA emergency care — but you MUST notify VA within 72 hours',
          '72-hour notification number: 1-844-724-7842 (save this now)',
          'Service-connected conditions are generally covered; non-service-connected may also qualify',
          'Ambulance costs can be covered if transport is medically necessary',
        ],
        actionItems: ['Save 72-hour notification number: 1-844-724-7842', 'Locate and carry your VA Health Benefits card', 'Confirm your VA enrollment status if uncertain'],
        tips: ['Save the 72-hour number now — you won\'t want to search for it post-emergency.'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'VA Emergency Care Info', description: 'Official VA guidance on emergency care coverage at non-VA facilities.', url: 'https://www.va.gov/health-care/get-emergency-care/' },
        ],
      },
      {
        id: 'step-3-3', title: 'Using Non-VA Emergency Care', order: 3,
        description: 'What to do before, during, and after a non-VA emergency room visit.',
        keyPoints: [
          'Seek care at the nearest ER — never delay because you\'re unsure about coverage',
          'Inform ER staff you\'re a veteran with VA healthcare and present your benefits card',
          'After care: notify VA within 72 hours and submit all bills to your VA Non-VA Care Office',
          'Keep copies of every bill, receipt, and notification confirmation',
        ],
        actionItems: ['Keep VA Health Benefits card + photo ID together', 'After any non-VA emergency, call 1-844-724-7842 within 72 hours', 'Collect all bills and submit to VA Non-VA Care Office'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'DAV (Disabled American Veterans)', description: 'Help navigating VA billing disputes and non-VA care reimbursement claims.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
        ],
      },
      {
        id: 'step-3-4', title: 'VA Urgent Care Benefit', order: 4,
        description: 'Use the VA urgent care benefit for minor issues — no referral or appointment needed.',
        keyPoints: [
          'Eligibility: enrolled in VA healthcare + received VA care in the last 24 months',
          'No VA referral needed — just visit an in-network urgent care provider',
          'Find in-network providers at va.gov/find-locations or call 877-881-7618',
          'Prescriptions: 14-day supply max; longer prescriptions go to your VA pharmacy',
        ],
        actionItems: ['Find 2–3 in-network urgent care locations at va.gov/find-locations', 'Confirm you\'ve had a VA visit in the last 24 months', 'Save network assistance line: 877-881-7618'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'VA Urgent Care Locator', description: 'Find in-network urgent care providers near you — no referral needed.', url: 'https://www.va.gov/find-locations/' },
        ],
      },
      {
        id: 'step-3-5', title: 'Create Your Emergency Plan', order: 5,
        description: 'Build a personal emergency plan so you\'re prepared — not scrambling — when something happens.',
        keyPoints: [
          'Keep an emergency contact list with VA numbers, personal contacts, and local ER locations',
          'Maintain a current medication list with dosages — carry it or photograph it on your phone',
          'Create an ICE (In Case of Emergency) contact in your phone',
          'Share your emergency plan with a trusted family member or friend',
        ],
        actionItems: ['Set up an ICE contact in your phone', 'Photograph your medication + allergy list', 'Write down all VA and non-VA provider numbers', 'Share plan with one trusted person'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Veterans Crisis Line', description: 'Mental health emergencies always — 988 Press 1, text 838255.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)' },
        ],
      },
    ],
  },

  {
    id: 'womens-health',
    title: "Women's Health for Veterans",
    description: "Comprehensive guide to women's health services, benefits, and resources for women veterans.",
    objective: 'Access gender-specific VA healthcare and your full range of benefits as a woman veteran.',
    targetAudience: ['Women veterans', 'Caregivers of women veterans'],
    tags: ["women's health", 'women veterans', 'reproductive health', 'MST', 'gender-specific care'],
    estimatedDuration: 80,
    difficulty: 'easy',
    featured: true,
    icon: 'women-health',
    steps: [
      {
        id: 'step-4-1', title: "VA Women's Health Services Overview", order: 1,
        description: "Learn about specialized services available at every VA for women veterans.",
        keyPoints: [
          "Every VA facility has designated Women's Health Primary Care Providers (WH-PCPs)",
          'Services include reproductive health, maternity care, cancer screenings, and MST treatment',
          "Women Veterans Call Center: 1-855-VA-WOMEN — your starting point for navigation",
          'Women-only care environments are available at many facilities',
        ],
        actionItems: ["Call Women Veterans Call Center to find nearest WH-PCP: 1-855-829-6636", "Request assignment to a Women's Health provider when enrolling", "Review full service coverage at va.gov/womenvet"],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'Women Veterans Interactive', description: 'Peer community and advocacy resources for women veterans.', url: 'https://womenveteransinteractive.com/' },
          { title: "VA Women's Health Program", description: "Complete guide to gender-specific VA healthcare services.", url: 'https://www.womenshealth.va.gov/', phone: '1-855-829-6636' },
        ],
      },
      {
        id: 'step-4-2', title: "Enrolling in Women's Health Services", order: 2,
        description: "Steps to enroll and formally designate a Women's Health Primary Care Provider.",
        keyPoints: [
          'Verify VA eligibility first — you need your DD214 and service documentation',
          "Request a Women's Health Provider specifically when enrolling",
          'First appointment includes comprehensive health assessment and personalized care plan',
          "Formally designate your WH-PCP for continuity of care with the same provider",
        ],
        actionItems: ['Confirm VA eligibility at va.gov/health-care/eligibility', "Call your VA and ask specifically for a Women's Health Provider", 'Prepare DD214 and medication list before first appointment'],
        recordsReconDeeplink: true,
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'DAV (Disabled American Veterans)', description: 'Free enrollment and benefits navigation for women veterans.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
          { title: "Service Women's Action Network", description: "Policy advocacy and peer support for women navigating VA.", url: 'https://www.servicewomen.org/' },
        ],
      },
      {
        id: 'step-4-3', title: 'Reproductive Health Services', order: 3,
        description: 'Access contraception, maternity care, menopause treatment, and cancer screenings through VA.',
        keyPoints: [
          'VA covers contraceptive counseling and many contraceptive methods',
          'Maternity care coordination is available for enrolled pregnant veterans',
          'Menopause and perimenopause treatment is a covered VA benefit',
          'Cervical cancer (Pap + HPV) and breast cancer (mammogram) screenings are covered',
        ],
        actionItems: ["Ask your WH-PCP about your full reproductive health benefit coverage", 'Schedule any overdue cancer screenings', 'If pregnant or planning pregnancy, request maternity care coordination'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: "VA Women's Health Services", description: "Full reproductive and preventive healthcare for women veterans.", url: 'https://www.womenshealth.va.gov/', phone: '1-855-829-6636' },
        ],
      },
      {
        id: 'step-4-4', title: 'Military Sexual Trauma (MST) Support', order: 4,
        description: 'Access confidential MST counseling — available to ALL veterans regardless of discharge status.',
        keyPoints: [
          'MST services are FREE for all veterans who experienced it — no documentation required',
          'Every VA facility has an MST Coordinator — contact them directly without filing a claim',
          'Vet Centers provide confidential support outside the main VA system if preferred',
          'PTSD and conditions stemming from MST are treated as service-connected by VA law',
        ],
        actionItems: ['Find your MST Coordinator at va.gov/health-care/health-needs-conditions/military-sexual-trauma', 'Contact a Vet Center for confidential support: 1-877-927-8387', 'Ask about MST-related disability claim process if applicable'],
        warnings: ['You never need to prove your MST to receive treatment. VA law protects your right to care.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Give An Hour', description: 'Free mental health counseling including MST specialists.', url: 'https://giveanhour.org/' },
          { title: 'Protect Our Defenders', description: 'Advocacy and legal resources for MST survivors.', url: 'https://www.protectourdefenders.com/' },
        ],
      },
      {
        id: 'step-4-5', title: 'Mental Health & Long-term Wellness', order: 5,
        description: "Maintain long-term wellness with women-specific VA and community resources.",
        keyPoints: [
          'Depression and anxiety are more common among women veterans than the general female population',
          'VA offers gender-specific PTSD treatment groups — ask your provider',
          'Whole Health coaching, yoga, and nutrition are available at most VA facilities',
          'Community networks for women veterans measurably reduce isolation',
        ],
        actionItems: ['Schedule your annual wellness visit', 'Ask about women-specific mental health groups at your VA', 'Look into one women veteran peer network in your area'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'Cohen Veterans Network', description: 'Women veterans-focused mental health services on a sliding scale.', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936' },
          { title: 'Women Veterans Interactive', description: 'Community, advocacy, and wellness for women veterans.', url: 'https://womenveteransinteractive.com/' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MISSION 5 — Chronic Pain Management
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'chronic-pain',
    title: 'Chronic Pain Management',
    description: 'A comprehensive journey through understanding, treating, and living with chronic pain as a veteran.',
    objective: 'Build a multi-modal pain management plan using VA, NGO support, and self-management skills.',
    targetAudience: ['Veterans with chronic pain', 'Veterans with service-connected injuries', 'Caregivers'],
    tags: ['chronic pain', 'pain management', 'rehabilitation', 'back pain', 'injury', 'complementary health'],
    estimatedDuration: 90,
    difficulty: 'medium',
    featured: false,
    icon: 'pain-management',
    steps: [
      {
        id: 'step-5-1', title: 'Understanding Your Chronic Pain', order: 1,
        description: 'Learn pain types and how to communicate effectively with your healthcare providers.',
        keyPoints: [
          'Types: musculoskeletal, neuropathic, headache/migraine, phantom limb, widespread (fibromyalgia)',
          'Chronic pain affects sleep, mood, relationships, and work — all interconnected',
          'LOCQSTIA: Location, Quality, Scale (0–10), Timing, Intensity, Aggravating/Alleviating factors',
          'A pain journal tracking daily levels, activities, and sleep dramatically improves provider conversations',
        ],
        actionItems: ['Start a daily pain journal (0–10 scale, activities, sleep quality)', 'Identify top 3 activities most limited by your pain', 'Note aggravating and relieving factors before your next provider visit'],
        tips: ['"7/10 burning, worse after sitting 30 min, relieved by walking" is far more useful than "it hurts a lot."'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'American Chronic Pain Association', description: 'Free pain tracking tools, education, and peer support groups for veterans with chronic pain.', url: 'https://www.theacpa.org/', phone: '1-800-533-3231' },
          { title: 'Wounded Warrior Project', description: 'Physical wellness and chronic pain programs for post-9/11 veterans.', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586' },
        ],
      },
      {
        id: 'step-5-2', title: 'Navigating VA Pain Management', order: 2,
        description: 'Access VA\'s specialized pain management services and understand your treatment pathway.',
        keyPoints: [
          'VA uses Stepped Care: Primary Care → Pain Specialty Teams → Intensive Rehabilitation Programs',
          'Pain clinic teams include physicians, physical therapists, psychologists, and pharmacists',
          'Service-connected pain conditions qualify for VA disability compensation — file VA Form 21-526EZ',
          'Community Care Network is available if VA facilities have long wait times or are too far',
        ],
        actionItems: ['Request a formal pain assessment at your next VA primary care visit', 'Ask specifically for a Pain Specialty team referral', 'Ask if your condition qualifies for a service-connected disability rating'],
        recordsReconDeeplink: true,
        vet1stopTip: 'Run Records Recon to surface pain diagnoses, treatment history, and service-connection language — bring your Evidence Report when asking about a disability rating.',
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Paralyzed Veterans of America', description: 'Advocacy and peer support for veterans with chronic pain and mobility limitations.', url: 'https://pva.org/', phone: '1-800-424-8200' },
          { title: 'Wounded Warrior Project', description: 'Peer-to-peer support and chronic pain programs for post-9/11 veterans.', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586' },
        ],
      },
      {
        id: 'step-5-3', title: 'Medication & Medical Treatments', order: 3,
        description: 'Understand non-opioid and interventional treatment options for chronic pain.',
        keyPoints: [
          'Non-opioid first: NSAIDs, acetaminophen, antidepressants, anticonvulsants, topical treatments',
          'Interventional: epidural steroid injections, nerve blocks, radiofrequency ablation',
          'If opioids are prescribed: expect close monitoring, an Opioid Safety Agreement, and regular reassessment',
          'Physical and occupational therapy are evidence-based and covered under VA benefits',
        ],
        actionItems: ['List all pain treatments you\'ve tried and their effectiveness', 'Ask your provider about non-opioid options you haven\'t tried', 'Request a physical therapy referral if you haven\'t had one'],
        warnings: ['Never abruptly stop prescription pain medications — tapering is required. Talk to your provider first.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'American Chronic Pain Association', description: 'Medication management resources, pain tracking tools, and community support.', url: 'https://www.theacpa.org/', phone: '1-800-533-3231' },
        ],
      },
      {
        id: 'step-5-4', title: 'Complementary & Integrative Health', order: 4,
        description: 'Explore evidence-based complementary approaches offered through VA and community providers.',
        keyPoints: [
          'VA Whole Health offers tai chi, yoga, qi gong, acupuncture, and chiropractic — all covered benefits',
          'Mind-body practices (mindfulness, biofeedback) are proven to reduce pain intensity',
          'Acupuncture is a covered VA benefit — ask for a referral',
          'Always inform all providers about all treatments — interactions matter',
        ],
        actionItems: ['Ask your VA provider about the Whole Health program at your facility', 'Request an acupuncture referral if you haven\'t tried it', 'Try the free VA Mindfulness Coach app this week'],
        tips: ['Complementary approaches work best combined with conventional care — they\'re additive, not replacements.'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'VA Whole Health Program', description: 'Free yoga, acupuncture, tai chi, and nutrition counseling for enrolled veterans.', url: 'https://www.va.gov/wholehealth/' },
          { title: 'Team Red White & Blue', description: 'Adaptive fitness programs that accommodate injuries — chapters nationwide.', url: 'https://www.teamrwb.org/' },
        ],
      },
      {
        id: 'step-5-5', title: 'Self-Management Strategies', order: 5,
        description: 'Build daily habits that reduce pain impact and improve quality of life long-term.',
        keyPoints: [
          'Pacing: break tasks into segments, alternate activity and rest — avoid boom-and-bust cycles',
          'Anti-inflammatory diet (fatty fish, berries, olive oil, turmeric) measurably reduces pain',
          'Low-impact exercise like walking and swimming builds tolerance over time',
          'CBT-CP (Cognitive Behavioral Therapy for Chronic Pain) is a VA evidence-based program',
        ],
        actionItems: ['Ask your provider about CBT-CP (Cognitive Behavioral Therapy for Chronic Pain)', 'Identify 3 pacing strategies for your most painful daily activities', 'Build a 10-minute daily walk into your routine this week'],
        tips: ['A toolkit of 5–10 strategies means you always have something to reach for during a flare.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'American Chronic Pain Association', description: 'Structured self-management programs, pain journals, and peer support groups.', url: 'https://www.theacpa.org/', phone: '1-800-533-3231' },
          { title: 'VA MOVE! Program', description: 'Free weight management combining nutrition and fitness at VA facilities nationwide.', url: 'https://www.move.va.gov/' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MISSION 6 — Substance Use Recovery
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'substance-recovery',
    title: 'Substance Use Recovery',
    description: 'A supportive pathway for veterans seeking recovery from substance use disorders.',
    objective: 'Access appropriate treatment and build a lasting recovery support system.',
    targetAudience: ['Veterans with substance use concerns', 'Family members of veterans', 'Veterans in recovery'],
    tags: ['substance use', 'recovery', 'addiction', 'alcohol', 'opioids', 'PTSD', 'mental health'],
    estimatedDuration: 90,
    difficulty: 'medium',
    featured: false,
    icon: 'recovery',
    steps: [
      {
        id: 'step-6-1', title: 'Recognizing Substance Use Concerns', order: 1,
        description: 'Understand substance use disorders and recognize when to reach out for help.',
        keyPoints: [
          'Veterans face unique risks: combat exposure, chronic pain, transition difficulties, co-occurring PTSD',
          'Physical signs: changes in sleep, weight, coordination, unusual odors',
          'Behavioral signs: missing obligations, financial problems, secrecy, social isolation',
          'CAGE criteria: Cut down, Annoyed by criticism, Guilty, Eye-opener use — 2+ is significant',
        ],
        actionItems: ['Review the CAGE criteria honestly', 'Speak with your VA primary care provider — conversations are confidential', 'If in crisis: call 988 Press 1 immediately'],
        warnings: ['Alcohol and substances significantly worsen PTSD and chronic pain over time.'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'SAMHSA National Helpline', description: 'Free, confidential 24/7 treatment referral for substance use and mental health.', url: 'https://www.samhsa.gov/find-help/national-helpline', phone: '1-800-662-4357' },
          { title: 'Veterans Crisis Line', description: 'If substance use has reached a crisis point — 988 Press 1, free and confidential.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)' },
        ],
      },
      {
        id: 'step-6-2', title: 'VA Substance Use Treatment Options', order: 2,
        description: 'Explore the full range of VA treatment programs for substance use disorders.',
        keyPoints: [
          'VA screens for SUD at every primary care visit — you can also self-refer directly',
          'Outpatient: individual counseling, group therapy, Intensive Outpatient Programs (IOP), telehealth',
          'Residential RRTP: 30–90 day live-in rehabilitation; detox services also available',
          'MAT (Medication-Assisted Treatment): buprenorphine, methadone, naltrexone for opioid/alcohol use',
          'Dual diagnosis programs treat co-occurring PTSD and SUD simultaneously — highly effective',
        ],
        actionItems: ['Tell your VA provider you want a substance use evaluation — or walk into any VAMC', 'Ask about Medication-Assisted Treatment (MAT) options', 'Ask about telehealth if in-person attendance is a barrier'],
        tips: ['You can walk into any VA Medical Center and ask for substance use services — no referral required.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'SAMHSA National Helpline', description: 'Free 24/7 treatment referrals including VA-connected providers nationwide.', url: 'https://www.samhsa.gov/find-help/national-helpline', phone: '1-800-662-4357' },
        ],
      },
      {
        id: 'step-6-3', title: 'Community Recovery Support', order: 3,
        description: 'Find peer-based and community recovery resources that complement VA treatment.',
        keyPoints: [
          'Peer support from others in recovery is one of the strongest predictors of long-term sobriety',
          'AA/NA has veteran-specific meeting groups — search with "veteran" in their meeting finders',
          'The Phoenix offers sober active community events designed specifically for veterans — free',
          'SMART Recovery is a science-based alternative to 12-step programs',
        ],
        actionItems: ['Search for a veteran-specific AA/NA group near you', 'Look up The Phoenix events in your area at thephoenix.org', 'Ask your VA counselor about peer support specialist availability'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'The Phoenix', description: 'Sober active community with free fitness, yoga, and events for veterans in recovery.', url: 'https://thephoenix.org/' },
          { title: 'SMART Recovery', description: 'Science-based self-management recovery — evidence-based alternative to 12-step.', url: 'https://www.smartrecovery.org/' },
        ],
      },
      {
        id: 'step-6-4', title: 'Managing Co-occurring Conditions', order: 4,
        description: 'Address the PTSD or chronic pain that often drives substance use in veterans.',
        keyPoints: [
          '~50% of veterans with SUD also have PTSD — these must be treated together for lasting recovery',
          '"Seeking Safety" is an integrated VA program treating both SUD and trauma simultaneously',
          'Treating only one condition while ignoring the other significantly raises relapse risk',
          'Chronic pain management must be part of recovery for veterans whose use stems from pain',
        ],
        actionItems: ['Ask your VA provider about integrated PTSD-SUD treatment (Seeking Safety)', 'If chronic pain drives use, request pain management alongside SUD treatment', 'Disclose all co-occurring conditions openly — withholding limits treatment quality'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Cohen Veterans Network', description: 'Sliding-scale clinics treating co-occurring PTSD and substance use.', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936' },
          { title: 'Give An Hour', description: 'Free mental health counseling for co-occurring PTSD and addiction.', url: 'https://giveanhour.org/' },
        ],
      },
      {
        id: 'step-6-5', title: 'Long-term Recovery & Relapse Prevention', order: 5,
        description: 'Build tools and routines that sustain recovery for the long haul.',
        keyPoints: [
          'Relapse is part of many journeys — it\'s not failure, it\'s information about what to adjust',
          'Identify high-risk situations in advance: stress, certain places, anniversaries, social pressure',
          'A relapse prevention plan with your counselor is one of the most protective tools available',
          'Physical activity, structured routine, and social connection are the three most protective factors',
        ],
        actionItems: ['Create or update a relapse prevention plan with your VA counselor', 'Identify top 3 high-risk situations and your response plan for each', 'Join at least one ongoing peer support group (virtual or in-person)'],
        tips: ['Recovery is not linear. Continuing after a setback — not quitting — is the defining factor.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'The Phoenix', description: 'Ongoing sober active community — consistency of events makes it powerful long-term support.', url: 'https://thephoenix.org/' },
          { title: 'SAMHSA Treatment Locator', description: 'Find ongoing treatment, counseling, and support groups in your area.', url: 'https://findtreatment.gov/', phone: '1-800-662-4357' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MISSION 7 — Know Your Rating: VA Benefits Navigation
  // Legal: 38 CFR §14.629-630 — Vet1Stop is informational ONLY, not a VSO.
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'va-claims-navigation',
    title: 'Know Your Rating: VA Benefits Navigation',
    description: 'Educational guide to understanding the VA rating system and connecting with free, authorized help — informational only, not claims advice.',
    objective: 'Understand how VA ratings work, gather your evidence, and connect with accredited VSOs who can help at no cost.',
    targetAudience: ['Veterans with low or stalled ratings', 'Veterans 5+ years post-service', 'First-time claimants', 'Veterans with multiple SC conditions'],
    tags: ['va claims', 'disability rating', 'vso', 'benefits', 'c&p exam', 'appeals', 'nexus', 'pact act', 'supplemental claim'],
    estimatedDuration: 100,
    difficulty: 'medium',
    featured: true,
    icon: 'benefits-nav',
    steps: [
      {
        id: 'step-7-1', title: 'Understanding the VA Rating System', order: 1,
        description: 'Learn how VA combined ratings work and why your total may be lower than expected.',
        keyPoints: [
          'The VA uses "whole person" math — NOT addition. 10% rating leaves 90% eligible for additional ratings.',
          'Example: 10% PTSD + 10% lumbar + 0% knee = 19% combined → rounds to 20%, not 20% simple sum.',
          'Bilateral factor: conditions on both sides of the body (bilateral knees) earn an extra percentage bonus.',
          'TDIU: you can receive 100% compensation rate if SC conditions prevent substantial employment.',
          'Ratings can be increased anytime your condition worsens — no statute of limitations on claims.',
        ],
        actionItems: ['Find your current combined rating at va.gov or eBenefits', 'Use the VA Combined Ratings Calculator at va.gov/disability/about-disability-ratings', 'List each service-connected condition and its current rating'],
        tips: ['Even if you accepted your initial rating years ago, you can seek an increase anytime your condition worsens or new evidence emerges.'],
        vet1stopTip: 'Use Records Recon to scan your VA records — it surfaces condition severity language and dates that inform what to raise with your VSO.',
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'DAV (Disabled American Veterans)', description: 'Free accredited claims agents who explain your rating and identify potential increases at no cost.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
          { title: 'VA Disability Ratings', description: 'Official VA explanation of combined ratings and compensation levels.', url: 'https://www.va.gov/disability/about-disability-ratings/' },
        ],
      },
      {
        id: 'step-7-2', title: 'Gathering Your Evidence', order: 2,
        description: 'Understand what types of evidence support a higher rating and where to find yours.',
        keyPoints: [
          'Service treatment records: proof your condition began or was aggravated during service',
          'Buddy statements: fellow service members document what they witnessed — valid lay evidence',
          'Nexus letter: independent medical opinion linking a current diagnosis to service — strongest private evidence',
          '"Continuity of symptomatology": evidence your condition was continuous from service to present',
          'Private medical records showing current diagnosis and functional impact round out your package',
        ],
        actionItems: ['Request service treatment records via milConnect or SF-180', 'List current medical conditions and their service connection', 'Consider a nexus letter if past C&P exams have been unfavorable'],
        tips: ['You do NOT need all evidence before meeting your VSO. A good VSO identifies what\'s missing and can file an Intent to File immediately.'],
        warnings: ['Vet1Stop is an informational resource — not a VSO or legal advisor. For official claims assistance, connect with an accredited VSO at no cost.'],
        vet1stopTip: 'Run Records Recon before your VSO meeting. Your Evidence Report surfaces condition history and service-connection language — ready to print and share.',
        recordsReconDeeplink: true,
        estimatedTimeMinutes: 25,
        ngoPartners: [
          { title: 'REE Medical', description: 'Independent nexus letters (IMOs) from licensed physicians for veterans seeking disability evidence.', url: 'https://reemedical.com/' },
          { title: 'Trajector Medical', description: 'Medical evidence and nexus letter services for veterans pursuing rating increases.', url: 'https://trajectormedical.com/' },
        ],
      },
      {
        id: 'step-7-3', title: 'Connect with a Free Accredited VSO', order: 3,
        description: 'Free accredited VSOs are authorized by VA to file and manage claims — always use them first.',
        keyPoints: [
          'VSOs are legally accredited by VA to represent you at absolutely no cost',
          'DAV, VFW, American Legion, and AMVETS all offer free claims assistance nationwide',
          'State and county VSOs often provide faster, more local support',
          'Never pay a third party to file a VA disability claim — accredited VSOs do this every day for free',
          'A VSO can file an Intent to File (ITF) to lock in your effective date today while you gather evidence',
        ],
        actionItems: ['Find an accredited VSO at va.gov/ogc/apps/accreditation/index.asp', 'Contact DAV or your state VSO for a free claim review', 'Ask your VSO to file an Intent to File immediately to lock your start date'],
        tips: ['An ITF locks today as your start date — even if it takes months to complete, back pay goes to this date.'],
        warnings: ['Vet1Stop is an informational resource — not a VSO or legal advisor. For official claims assistance, use an accredited VSO.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'DAV (Disabled American Veterans)', description: 'Largest free VSO in the US — accredited claims agents handle VA disability claims at no cost.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
          { title: 'VFW Benefits Assistance', description: 'Free claims assistance and VSO representation for veterans and families.', url: 'https://www.vfw.org/assistance/va-claims-separation-benefits', phone: '1-816-756-3390' },
          { title: 'American Legion Claims Audit', description: 'Free review of your current rating for errors or missed conditions.', url: 'https://www.legion.org/serviceofficers' },
          { title: 'NVLSP', description: 'Free legal representation for complex benefit claims and appeals.', url: 'https://www.nvlsp.org/' },
        ],
      },
      {
        id: 'step-7-4', title: 'The C&P Exam: What to Expect', order: 4,
        description: 'Compensation & Pension exams determine your rating — describe your worst days, not your best.',
        keyPoints: [
          'The C&P exam is NOT a treatment visit — the examiner assesses how your condition limits daily function.',
          'Describe your WORST days. Frequency and functional impact matter more than average days.',
          'Common mistake: veterans downplay symptoms. "I manage fine" is a rating-killer — VA rates the condition, not your resilience.',
          'You can bring documentation, buddy statements, and nexus letters to the exam.',
          'A poor exam result can be challenged with a private nexus letter or a request for a new exam.',
        ],
        actionItems: ['Write how your condition affects daily work, sleep, relationships, and activity — before the exam', 'Bring your Records Recon Evidence Report to avoid recalling everything from memory', 'Note if your condition has worsened since your last exam'],
        tips: ['At your C&P exam: be honest, be specific, describe your worst days. Never say "I manage fine."'],
        warnings: ['Vet1Stop is an informational resource — not a VSO or legal advisor.'],
        vet1stopTip: 'Bring your Records Recon Evidence Report to your C&P exam — it organizes your condition history and dates so you don\'t have to recall everything on the spot.',
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'VA PACT Act Resource Center', description: 'Presumptive conditions for toxic exposure — many combat vets qualify for additional ratings they never filed.', url: 'https://www.va.gov/resources/the-pact-act-and-your-va-benefits/' },
          { title: 'Trajector Medical', description: 'C&P exam preparation and independent medical opinion services.', url: 'https://trajectormedical.com/' },
        ],
      },
      {
        id: 'step-7-5', title: 'Your Appeals & Next Options', order: 5,
        description: 'If your rating is denied or too low, clear legal paths exist — understand them before the deadline.',
        keyPoints: [
          'Supplemental Claim: submit new evidence. No time limit, can be filed anytime.',
          'Higher-Level Review (HLR): senior VA rater reviews your case. No new evidence — argue legal error.',
          'Board of Veterans Appeals (BVA): formal appeal with hearing option. Takes longer but more thorough.',
          'CAVC (Court of Appeals): federal court — requires a VA-accredited attorney.',
          'Veterans have 1 year from decision to choose a review lane without losing their effective date.',
        ],
        actionItems: ['Review your rating decision letter within 1 year of receiving it', 'File a Supplemental Claim immediately if you have new evidence', 'Contact NVLSP or a VA-accredited attorney for complex appeals'],
        tips: ['Mark the date you receive your rating decision — you have exactly 1 year to appeal without resetting your effective date.'],
        warnings: ['Vet1Stop is an informational resource — not a VSO or legal advisor. For official appeals help, contact an accredited representative.'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'NVLSP', description: 'Free legal services for veterans in BVA and CAVC appeals.', url: 'https://www.nvlsp.org/' },
          { title: 'CCK Law', description: 'VA-accredited law firm specializing in veteran disability appeals — no upfront cost.', url: 'https://cck-law.com/', phone: '1-800-544-9144' },
          { title: 'Berry Law Firm', description: 'Veteran-founded law firm focused on VA disability claims and appeals.', url: 'https://berrylawfirm.com/', phone: '1-888-883-2483' },
          { title: 'Hill & Ponton', description: 'Veteran disability attorneys specializing in appeals and rating increases.', url: 'https://www.hillandponton.com/', phone: '1-888-477-2363' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MISSION 8 — Benefits for Aging Veterans
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'aging-veterans',
    title: 'Benefits for Aging Veterans',
    description: 'A comprehensive guide to benefits, services, and long-term care options for aging veterans.',
    objective: 'Maximize benefits and access long-term care services available to older veterans.',
    targetAudience: ['Veterans age 65+', 'Caregivers of elderly veterans', 'Veterans with age-related conditions'],
    tags: ['aging veterans', 'geriatric care', 'long-term care', 'VA pension', 'Aid & Attendance', 'caregiver'],
    estimatedDuration: 80,
    difficulty: 'medium',
    featured: false,
    icon: 'geriatric-care',
    steps: [
      {
        id: 'step-8-1', title: 'VA Geriatric & Extended Care Services', order: 1,
        description: "Overview of VA's comprehensive services for aging veterans with complex needs.",
        keyPoints: [
          'Home-Based Primary Care: in-home medical team for veterans who can\'t easily travel to clinics',
          'Adult Day Health Care: community programs for health maintenance and caregiver respite',
          'Community Living Centers (VA nursing homes): skilled nursing, rehab, and mental health care',
          'Veteran-Directed Care: flexible budget to hire your own caregivers with counselor support',
          'Respite Care: up to 30 days/year to give family caregivers temporary relief',
        ],
        actionItems: ['Ask your VA provider about Home-Based Primary Care eligibility', 'Find Community Living Centers at va.gov/find-locations', 'Inquire about Veteran-Directed Care if self-directed care is preferred'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'VA Caregiver Support Program', description: 'Financial stipends, health insurance, training, and respite for veteran caregivers.', url: 'https://www.caregiver.va.gov/', phone: '1-855-260-3274' },
          { title: 'National Council on Aging', description: 'Benefits screening tools to find every benefit aging veterans qualify for.', url: 'https://www.ncoa.org/' },
        ],
      },
      {
        id: 'step-8-2', title: 'VA Pension & Aid and Attendance', order: 2,
        description: 'Understand significant financial benefits many eligible veterans never apply for.',
        keyPoints: [
          'VA Pension: needs-based monthly benefit for wartime veterans with limited income and assets',
          'Aid & Attendance: substantial monthly addition for veterans needing help with daily activities',
          'Housebound benefit: available for veterans substantially confined to their home',
          'These are separate from disability compensation — you may qualify for both simultaneously',
          'Always use a FREE VSO (DAV, VFW) — never pay a third party to file a VA claim',
        ],
        actionItems: ['Check VA pension eligibility at va.gov/pension', 'Contact DAV or VFW for free application assistance', 'Never pay a third party to file a VA benefits claim'],
        tips: ['Aid & Attendance can cover in-home care, assisted living, and nursing costs — it\'s severely underutilized.'],
        estimatedTimeMinutes: 20,
        ngoPartners: [
          { title: 'Disabled American Veterans (DAV)', description: 'Free pension and Aid & Attendance application assistance from accredited claims agents.', url: 'https://www.dav.org/', phone: '1-877-426-2838' },
          { title: 'Veterans of Foreign Wars (VFW)', description: 'Free benefit counseling and pension/A&A claim assistance nationwide.', url: 'https://www.vfw.org/', phone: '1-816-756-3390' },
        ],
      },
      {
        id: 'step-8-3', title: 'Cognitive Health & Dementia Care', order: 3,
        description: 'Access VA programs and community resources for cognitive health and dementia support.',
        keyPoints: [
          'TBI history significantly raises dementia risk in veterans — annual cognitive screening is recommended',
          'VA offers comprehensive dementia evaluations and care management programs',
          'VA Geriatric Patient Aligned Care Teams (GeriPACT) specialize in complex aging veteran needs',
          'Caregiver education is as important as the veteran\'s own care plan',
        ],
        actionItems: ['Request annual cognitive screening, especially with TBI history', 'Ask about GeriPACT teams at your VA facility', 'Contact Alzheimer\'s Association for caregiver support: 1-800-272-3900'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: "Alzheimer's Association", description: '24/7 helpline, caregiver support groups, and care planning resources.', url: 'https://www.alz.org/', phone: '1-800-272-3900' },
          { title: 'VA Caregiver Support Program', description: 'Training, coaching, and respite for caregivers of veterans with dementia.', url: 'https://www.caregiver.va.gov/', phone: '1-855-260-3274' },
        ],
      },
      {
        id: 'step-8-4', title: 'Fall Prevention & Home Safety', order: 4,
        description: 'Reduce fall risk and create a safer home — a critical priority for aging veterans.',
        keyPoints: [
          'Falls are the leading cause of injury-related death in veterans age 65+ — prevention is essential',
          'VA Home Safety Evaluations identify hazards and recommend modifications (grab bars, ramps, lighting)',
          'Physical therapy for balance training is a covered VA benefit',
          'Medication review is critical — many medications increase fall risk and can often be adjusted',
        ],
        actionItems: ['Request a VA Home Safety Evaluation through your primary care team', 'Ask for a physical therapy referral focused on balance training', 'Request medication review to identify fall-risk medications'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'National Council on Aging', description: 'Evidence-based fall prevention programs and home safety resources for aging veterans.', url: 'https://www.ncoa.org/' },
          { title: 'VA Caregiver Support Program', description: 'Caregiver education including home safety and fall prevention strategies.', url: 'https://www.caregiver.va.gov/', phone: '1-855-260-3274' },
        ],
      },
      {
        id: 'step-8-5', title: 'Advance Care Planning', order: 5,
        description: 'Document your healthcare wishes before a crisis forces those decisions on others.',
        keyPoints: [
          'Advance directives (living will, healthcare proxy) ensure your wishes are followed if you can\'t speak',
          'VA social workers facilitate advance care planning conversations with you and your family',
          'VA Palliative Care and Hospice programs focus on comfort and quality of life',
          'Completing an advance directive is taking control — not giving up',
        ],
        actionItems: ['Complete an Advance Directive — ask your VA provider for forms', 'Designate a healthcare proxy to make decisions if you can\'t', 'Share your advance directive with your VA care team and family'],
        tips: ['Advance care planning is about living on your own terms — it\'s an act of clarity, not surrender.'],
        estimatedTimeMinutes: 15,
        ngoPartners: [
          { title: 'VA Hospice & Palliative Care', description: 'Comfort-focused care and quality-of-life support through VA hospice programs.', url: 'https://www.va.gov/geriatrics/pages/Hospice_and_Palliative_Care.asp' },
          { title: 'National Hospice and Palliative Care Organization', description: 'Advance care planning resources and veterans-specific hospice guidance.', url: 'https://www.nhpco.org/', phone: '1-800-658-8898' },
        ],
      },
    ],
  },
];

// ─── Helper utilities ──────────────────────────────────────────────────────

/** Get a mission by ID */
export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find(m => m.id === id);
}

/** Get featured missions (up to a limit) */
export function getFeaturedMissions(limit = 4): Mission[] {
  return MISSIONS.filter(m => m.featured).slice(0, limit);
}

/**
 * Find the best matching mission ID for a set of condition/symptom strings.
 * Returns the mission ID with the most tag overlap, or null if none found.
 */
export function getMissionMatch(keywords: string[]): string | null {
  if (!keywords.length) return null;
  const lower = keywords.map(k => k.toLowerCase());
  let best: { id: string; score: number } = { id: '', score: 0 };
  for (const mission of MISSIONS) {
    const score = mission.tags.filter(
      tag => lower.some(kw => kw.includes(tag) || tag.includes(kw))
    ).length;
    if (score > best.score) best = { id: mission.id, score };
  }
  return best.score > 0 ? best.id : null;
}

/**
 * Get mission steps as simplified objects for the ResultsPanel PathwayModal.
 * Returns first 4 steps formatted as { title, body } pairs.
 */
export function getMissionStepsForModal(missionId: string): Array<{ title: string; body: string }> | null {
  const mission = getMissionById(missionId);
  if (!mission) return null;
  return mission.steps.slice(0, 4).map(step => ({
    title: `Step ${step.order} — ${step.title}`,
    body: step.keyPoints[0] ?? step.description,
  }));
}
