// @ts-nocheck
/**
 * /api/health/browse — Public browse endpoint for the Health Hub page.
 * Queries the healthResources collection by subcategory (federal/ngo/state),
 * search term, tags, and pagination. Distinct from /api/health/resources
 * which uses legacy resourceType + categories fields.
 *
 * Strike 9: Comprehensive synonym expansion for smarter search.
 * Covers lay medical terms, body-part searches, informal language, toxic exposure
 * terms (burn pit, agent orange), veteran demographics (Vietnam, post-9/11),
 * activity searches (fishing, hiking, equine), and clinical vocabulary gaps.
 *
 * Optional Atlas text index for relevance ranking:
 *   { "title": "text", "description": "text", "tags": "text" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// ─── Synonym expansion map ────────────────────────────────────────────────────
// Maps realistic user search terms → actual database tags in healthResources.
// Built from the real tag vocabulary in seed-federal-va-resources.js and
// sampleHealthResources.ts. Covers lay terms, body parts, informal phrases,
// toxic exposures, veteran demographics, and activity-based searches.
//
// Rule: key = what a user would type; values = real DB tags to also match against.
const SYNONYM_MAP: Record<string, string[]> = {

  // ── Mental Health — clinical ───────────────────────────────────────────────
  'mental health':          ['ptsd', 'depression', 'anxiety', 'counseling', 'therapy', 'behavioral health', 'trauma'],
  'ptsd':                   ['trauma', 'mental health', 'stress', 'anxiety', 'counseling', 'therapy'],
  'depression':             ['mental health', 'counseling', 'therapy', 'anxiety', 'mood', 'grief'],
  'anxiety':                ['mental health', 'stress', 'panic', 'counseling', 'therapy', 'ptsd'],
  'stress':                 ['mental health', 'anxiety', 'ptsd', 'mindfulness', 'counseling', 'wellness'],
  'trauma':                 ['ptsd', 'mental health', 'counseling', 'therapy', 'mst'],
  'anger':                  ['mental health', 'counseling', 'ptsd', 'therapy', 'behavior'],
  'nightmares':             ['ptsd', 'sleep', 'trauma', 'nightmare', 'sleep medicine'],
  'isolation':              ['peer support', 'mental health', 'counseling', 'community', 'depression'],
  'lonely':                 ['peer support', 'mental health', 'community', 'depression', 'social'],
  'grief':                  ['mental health', 'counseling', 'therapy', 'depression', 'support'],
  'mood':                   ['mental health', 'depression', 'counseling', 'therapy', 'wellness'],
  'panic':                  ['anxiety', 'mental health', 'ptsd', 'counseling', 'crisis'],
  'panic attacks':          ['anxiety', 'mental health', 'ptsd', 'counseling', 'therapy'],
  'flashbacks':             ['ptsd', 'trauma', 'mental health', 'counseling', 'therapy'],
  'hypervigilance':         ['ptsd', 'anxiety', 'mental health', 'counseling'],
  'hopeless':               ['depression', 'mental health', 'crisis', 'peer support', 'counseling'],
  'worthless':              ['depression', 'mental health', 'crisis', 'counseling'],
  'numb':                   ['ptsd', 'depression', 'mental health', 'counseling'],
  'disconnected':           ['ptsd', 'depression', 'mental health', 'peer support', 'isolation'],
  'avoiding':               ['ptsd', 'depression', 'isolation', 'mental health', 'counseling'],
  'racing thoughts':        ['anxiety', 'mental health', 'ptsd', 'sleep', 'counseling'],
  'trust issues':           ['ptsd', 'mental health', 'counseling', 'therapy'],
  'relationship problems':  ['family support', 'counseling', 'mental health', 'peer support'],
  'marriage':               ['family support', 'caregiver', 'counseling', 'mental health'],
  // Informal lay phrases
  'stressed out':           ['stress', 'mental health', 'ptsd', 'counseling', 'mindfulness'],
  'not okay':               ['mental health', 'counseling', 'crisis', 'ptsd', 'peer support'],
  'struggling':             ['mental health', 'counseling', 'peer support', 'ptsd', 'therapy'],
  "can't cope":             ['mental health', 'counseling', 'ptsd', 'crisis', 'peer support'],
  'feel like giving up':    ['depression', 'mental health', 'crisis', '988', 'peer support'],
  'dark place':             ['depression', 'mental health', 'crisis', 'ptsd', 'counseling'],
  'losing it':              ['mental health', 'ptsd', 'counseling', 'crisis', 'stress'],
  'on edge':                ['ptsd', 'anxiety', 'mental health', 'stress', 'counseling'],
  'going through it':       ['mental health', 'counseling', 'peer support', 'ptsd', 'therapy'],

  // ── Therapy & Support Access ──────────────────────────────────────────────
  'therapy':                ['counseling', 'mental health', 'treatment', 'ptsd', 'rehabilitation'],
  'counseling':             ['therapy', 'mental health', 'ptsd', 'support', 'treatment'],
  'support group':          ['peer support', 'counseling', 'mental health', 'community', 'recovery'],
  'peer support':           ['support group', 'counseling', 'mental health', 'community', 'veteran-led'],
  'telehealth':             ['telemedicine', 'portal', 'appointments', 'digital', 'online'],
  'online':                 ['telemedicine', 'telehealth', 'portal', 'digital', 'app', 'counseling'],
  'virtual':                ['telemedicine', 'telehealth', 'portal', 'digital', 'appointments'],
  'app':                    ['app', 'mobile', 'digital', 'telemedicine', 'self-help', 'coping'],
  'getting help':           ['mental health', 'counseling', 'peer support', 'ptsd', 'therapy'],
  'need help':              ['mental health', 'counseling', 'peer support', 'crisis', 'benefits'],
  'talk to someone':        ['counseling', 'mental health', 'crisis', 'peer support', '988'],

  // ── Physical Health & Pain ────────────────────────────────────────────────
  'pain':                   ['chronic pain', 'back pain', 'pain management', 'physical therapy', 'musculoskeletal'],
  'chronic pain':           ['pain management', 'physical therapy', 'back pain', 'musculoskeletal', 'rehabilitation'],
  'back pain':              ['chronic pain', 'musculoskeletal', 'physical therapy', 'pain management', 'rehabilitation'],
  'back':                   ['back pain', 'musculoskeletal', 'physical therapy', 'chronic pain', 'spine'],
  'lower back':             ['back pain', 'musculoskeletal', 'physical therapy', 'chronic pain', 'spine'],
  'knee':                   ['knee pain', 'musculoskeletal', 'physical therapy', 'orthopedic', 'rehabilitation'],
  'knee pain':              ['musculoskeletal', 'physical therapy', 'chronic pain', 'orthopedic'],
  'shoulder':               ['musculoskeletal', 'physical therapy', 'chronic pain', 'orthopedic'],
  'shoulder pain':          ['musculoskeletal', 'physical therapy', 'chronic pain', 'orthopedic'],
  'neck':                   ['musculoskeletal', 'physical therapy', 'chronic pain', 'spine'],
  'neck pain':              ['musculoskeletal', 'physical therapy', 'chronic pain'],
  'hip':                    ['musculoskeletal', 'physical therapy', 'orthopedic', 'chronic pain'],
  'hip pain':               ['musculoskeletal', 'physical therapy', 'orthopedic', 'chronic pain'],
  'headaches':              ['tbi', 'chronic pain', 'neurological', 'migraine'],
  'migraines':              ['chronic pain', 'tbi', 'headache', 'neurological'],
  'migraine':               ['chronic pain', 'tbi', 'headache', 'neurological'],
  'dizziness':              ['tbi', 'neurological', 'rehabilitation', 'balance'],
  'balance':                ['tbi', 'rehabilitation', 'physical therapy', 'neurological'],
  'nerve pain':             ['chronic pain', 'musculoskeletal', 'physical therapy'],
  'physical therapy':       ['rehabilitation', 'back pain', 'chronic pain', 'musculoskeletal', 'orthopedic'],
  'rehab':                  ['rehabilitation', 'physical therapy', 'recovery', 'substance use', 'tbi'],
  'physical':               ['physical therapy', 'rehabilitation', 'fitness', 'chronic pain', 'musculoskeletal'],
  'spine':                  ['back pain', 'musculoskeletal', 'physical therapy', 'orthopedic'],
  // Breathing / respiratory
  'breathing':              ['respiratory', 'sleep apnea', 'cpap', 'pact act', 'toxic exposure'],
  'shortness of breath':    ['respiratory', 'sleep apnea', 'pact act', 'burn pit'],
  'breathing problems':     ['respiratory', 'sleep apnea', 'cpap', 'pact act'],
  'lung':                   ['respiratory', 'sleep apnea', 'toxic exposure', 'pact act'],
  'cough':                  ['respiratory', 'pact act', 'burn pit', 'toxic exposure'],
  // Lay terms for pain
  'aching':                 ['chronic pain', 'pain management', 'physical therapy', 'musculoskeletal'],
  'sore':                   ['chronic pain', 'physical therapy', 'musculoskeletal', 'rehabilitation'],
  'joint pain':             ['musculoskeletal', 'physical therapy', 'orthopedic', 'chronic pain'],
  'always in pain':         ['chronic pain', 'pain management', 'physical therapy', 'musculoskeletal'],
  'body pain':              ['chronic pain', 'musculoskeletal', 'physical therapy', 'pain management'],
  'my back is killing me':  ['back pain', 'chronic pain', 'physical therapy', 'musculoskeletal'],
  'bad back':               ['back pain', 'musculoskeletal', 'physical therapy', 'chronic pain'],
  'bad knees':              ['knee pain', 'musculoskeletal', 'physical therapy', 'orthopedic'],
  'blown out knee':         ['knee pain', 'musculoskeletal', 'physical therapy', 'orthopedic'],

  // ── TBI & Brain ───────────────────────────────────────────────────────────
  'tbi':                    ['traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation', 'polytrauma'],
  'brain injury':           ['tbi', 'traumatic brain injury', 'cognitive', 'rehabilitation', 'polytrauma'],
  'head trauma':            ['tbi', 'traumatic brain injury', 'cognitive', 'rehabilitation'],
  'brain damage':           ['tbi', 'traumatic brain injury', 'cognitive', 'neurological'],
  'concussion':             ['tbi', 'traumatic brain injury', 'cognitive', 'rehabilitation'],
  'memory':                 ['tbi', 'cognitive', 'neurological', 'concentration'],
  'memory problems':        ['tbi', 'cognitive', 'neurological', 'concentration'],
  'brain fog':              ['tbi', 'cognitive', 'fatigue', 'neurological', 'concentration'],
  "can't remember":         ['tbi', 'cognitive', 'neurological', 'memory'],
  'forgetful':              ['tbi', 'cognitive', 'neurological', 'memory'],
  'cognitive':              ['tbi', 'traumatic brain injury', 'memory', 'concentration', 'rehabilitation'],
  'concentration':          ['tbi', 'cognitive', 'mental health', 'ptsd', 'focus'],
  'focus':                  ['tbi', 'cognitive', 'mental health', 'ptsd', 'concentration'],
  "can't focus":            ['tbi', 'cognitive', 'mental health', 'ptsd', 'concentration'],
  // Combat causes of TBI
  'explosion':              ['tbi', 'traumatic brain injury', 'ptsd', 'polytrauma'],
  'blast':                  ['tbi', 'traumatic brain injury', 'ptsd', 'polytrauma'],
  'ied':                    ['tbi', 'traumatic brain injury', 'ptsd', 'polytrauma'],
  'blast injury':           ['tbi', 'traumatic brain injury', 'ptsd', 'polytrauma'],

  // ── Hearing & Vision ─────────────────────────────────────────────────────
  'hearing':                ['tinnitus', 'audiology', 'hearing loss', 'hearing aids'],
  'tinnitus':               ['hearing', 'audiology', 'hearing loss', 'ringing'],
  'hearing loss':           ['tinnitus', 'audiology', 'hearing aids', 'hearing'],
  'ringing in ears':        ['tinnitus', 'audiology', 'hearing loss', 'hearing'],
  'ringing ears':           ['tinnitus', 'audiology', 'hearing loss'],
  'my ears are ringing':    ['tinnitus', 'audiology', 'hearing loss', 'hearing'],
  'ringing wont stop':      ['tinnitus', 'audiology', 'hearing loss'],
  'deaf':                   ['hearing loss', 'audiology', 'hearing aids', 'tinnitus'],
  'going deaf':             ['hearing loss', 'audiology', 'hearing aids', 'tinnitus'],
  'bad hearing':            ['hearing loss', 'tinnitus', 'audiology', 'hearing aids'],
  "can't hear":             ['hearing loss', 'audiology', 'hearing aids', 'tinnitus'],
  'ears':                   ['tinnitus', 'hearing loss', 'audiology', 'hearing aids'],
  'vision':                 ['low vision', 'blind', 'assistive technology', 'rehabilitation'],
  'blind':                  ['low vision', 'blind rehabilitation', 'assistive technology', 'vision'],
  'eyesight':               ['low vision', 'blind', 'vision', 'assistive technology'],
  'eyes':                   ['low vision', 'blind', 'vision', 'assistive technology'],
  'losing vision':          ['low vision', 'blind', 'vision', 'assistive technology'],

  // ── Sleep ─────────────────────────────────────────────────────────────────
  'sleep':                  ['sleep apnea', 'insomnia', 'sleep medicine', 'cpap', 'respiratory'],
  'sleep apnea':            ['sleep', 'cpap', 'insomnia', 'respiratory', 'sleep medicine'],
  'insomnia':               ['sleep', 'sleep apnea', 'sleep medicine', 'mental health'],
  'cpap':                   ['sleep apnea', 'sleep', 'respiratory', 'sleep medicine'],
  'tired':                  ['fatigue', 'sleep', 'sleep apnea', 'mental health', 'wellness'],
  'fatigue':                ['sleep', 'fatigue', 'mental health', 'chronic conditions', 'wellness'],
  'exhausted':              ['fatigue', 'sleep', 'mental health', 'wellness', 'chronic conditions'],
  'no energy':              ['fatigue', 'sleep', 'mental health', 'wellness', 'chronic conditions'],
  'always tired':           ['fatigue', 'sleep', 'sleep apnea', 'mental health', 'wellness'],
  // Lay phrases
  'trouble sleeping':       ['sleep', 'insomnia', 'sleep apnea', 'ptsd', 'sleep medicine'],
  "can't sleep":            ['sleep', 'insomnia', 'sleep apnea', 'sleep medicine'],
  'bad dreams':             ['ptsd', 'sleep', 'nightmare', 'trauma', 'sleep medicine'],
  'nightsweats':            ['ptsd', 'sleep', 'trauma', 'sleep medicine'],
  'waking up':              ['sleep', 'insomnia', 'ptsd', 'sleep apnea', 'sleep medicine'],
  'keep waking up':         ['insomnia', 'sleep', 'ptsd', 'sleep apnea', 'sleep medicine'],
  'snoring':                ['sleep apnea', 'sleep', 'cpap', 'respiratory', 'sleep medicine'],

  // ── Substance Use & Recovery ──────────────────────────────────────────────
  'substance use':          ['alcohol', 'recovery', 'rehabilitation', 'addiction', 'detox'],
  'addiction':              ['substance use', 'alcohol', 'recovery', 'rehabilitation', 'detox'],
  'alcohol':                ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'drinking':               ['alcohol', 'substance use', 'addiction', 'recovery'],
  'drink too much':         ['alcohol', 'substance use', 'addiction', 'recovery'],
  "can't stop drinking":    ['alcohol', 'substance use', 'addiction', 'recovery', 'detox'],
  'drinking problem':       ['alcohol', 'substance use', 'addiction', 'recovery'],
  'drugs':                  ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'drug problem':           ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'pain pills':             ['substance use', 'addiction', 'recovery', 'opioid'],
  'opioid':                 ['substance use', 'addiction', 'recovery', 'detox', 'rehabilitation'],
  'opioids':                ['substance use', 'addiction', 'recovery', 'detox', 'rehabilitation'],
  'sober':                  ['recovery', 'substance use', 'alcohol', 'peer support'],
  'recovery':               ['substance use', 'alcohol', 'rehabilitation', 'peer support', 'addiction'],
  'detox':                  ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'drinking to cope':       ['alcohol', 'substance use', 'ptsd', 'mental health', 'recovery'],
  'self-medicating':        ['alcohol', 'substance use', 'ptsd', 'mental health', 'recovery'],

  // ── Outdoor, Recreation & Activity Therapy ────────────────────────────────
  'outdoor':                ['outdoor therapy', 'adventure therapy', 'fishing', 'hiking', 'adaptive sports', 'recreation', 'fitness'],
  'outdoors':               ['outdoor therapy', 'adventure therapy', 'fishing', 'hunting', 'camping', 'hiking', 'kayaking', 'adaptive sports', 'recreation'],
  'outdoor therapy':        ['adventure therapy', 'fishing', 'hiking', 'nature therapy', 'equine', 'ptsd', 'peer support', 'recreation'],
  'outdoor activities':     ['outdoor therapy', 'adventure therapy', 'fishing', 'hiking', 'recreation', 'adaptive sports'],
  'adventure therapy':      ['outdoor therapy', 'fishing', 'hiking', 'nature therapy', 'ptsd', 'peer support'],
  'nature':                 ['outdoor therapy', 'adventure therapy', 'fishing', 'hiking', 'recreation', 'wellness'],
  'get outside':            ['outdoor therapy', 'recreation', 'adaptive sports', 'fitness', 'wellness'],
  'go fishing':             ['fishing', 'outdoor therapy', 'recreation', 'ptsd', 'peer support'],
  'fishing':                ['outdoor therapy', 'adventure therapy', 'recreation', 'ptsd', 'peer support', 'nature therapy'],
  'hunting':                ['outdoor therapy', 'adventure therapy', 'recreation', 'peer support'],
  'hiking':                 ['outdoor therapy', 'adventure therapy', 'recreation', 'fitness', 'wellness'],
  'camping':                ['outdoor therapy', 'adventure therapy', 'recreation', 'peer support'],
  'kayaking':               ['outdoor therapy', 'adventure therapy', 'recreation', 'fitness'],
  'equine':                 ['equine therapy', 'outdoor therapy', 'ptsd', 'mental health', 'adventure therapy'],
  'horse therapy':          ['equine therapy', 'equine', 'outdoor therapy', 'ptsd', 'mental health'],
  'art therapy':            ['creative arts', 'mental health', 'ptsd', 'counseling', 'therapy'],
  'music therapy':          ['creative arts', 'mental health', 'ptsd', 'counseling', 'therapy'],
  'sports':                 ['adaptive sports', 'fitness', 'recreation', 'wellness', 'Paralympic'],
  'recreation':             ['adaptive sports', 'fitness', 'outdoor therapy', 'recreation', 'wellness'],
  'adaptive sports':        ['fitness', 'disability', 'wheelchair', 'Paralympic', 'recreation'],
  'yoga':                   ['mindfulness', 'wellness', 'mental health', 'stress', 'ptsd', 'physical therapy'],
  'mindfulness':            ['yoga', 'wellness', 'mental health', 'stress', 'meditation'],
  'meditation':             ['mindfulness', 'yoga', 'wellness', 'mental health', 'stress'],
  'fitness':                ['wellness', 'adaptive sports', 'physical therapy', 'exercise', 'rehabilitation', 'weight loss'],
  'exercise':               ['fitness', 'wellness', 'adaptive sports', 'physical therapy', 'weight loss'],
  'volunteer':              ['community service', 'volunteer', 'peer support', 'disaster response'],
  'meet other veterans':    ['peer support', 'community', 'veteran-led', 'social', 'volunteer'],
  'social activities':      ['peer support', 'recreation', 'community', 'adaptive sports', 'social'],
  'make friends':           ['peer support', 'community service', 'social', 'volunteer', 'recreation'],

  // ── Women Veterans ────────────────────────────────────────────────────────
  'women':                  ["women's health", 'women veterans', 'mst', 'military sexual trauma', 'gynecology'],
  'women veterans':         ["women's health", 'mst', 'military sexual trauma', 'gynecology', 'mental health'],
  'female veteran':         ["women's health", 'women veterans', 'mst', 'mental health'],
  'mst':                    ['military sexual trauma', 'counseling', 'mental health', 'trauma', 'women veterans'],
  'military sexual trauma': ['mst', 'counseling', 'mental health', 'trauma', 'women veterans'],
  'sexual trauma':          ['mst', 'military sexual trauma', 'counseling', 'mental health', 'trauma'],
  'sexual assault':         ['mst', 'military sexual trauma', 'counseling', 'mental health', 'trauma'],
  'sexual harassment':      ['mst', 'military sexual trauma', 'counseling', 'mental health'],
  'harassment':             ['mst', 'counseling', 'mental health', 'trauma', 'women veterans'],
  'pregnancy':              ['maternal care', "women's health", 'women veterans', 'gynecology'],
  'maternity':              ['maternal care', "women's health", 'women veterans', 'gynecology'],

  // ── Disability & Mobility ─────────────────────────────────────────────────
  'disability':             ['disability', 'adaptive', 'prosthetics', 'orthopedic', 'wheelchair', 'rehabilitation'],
  'prosthetics':            ['disability', 'adaptive', 'orthopedic', 'rehabilitation'],
  'amputee':                ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'amputation':             ['prosthetics', 'adaptive', 'disability', 'rehabilitation', 'orthopedic'],
  'missing limb':           ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'limb loss':              ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'amputated':              ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'lost leg':               ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'lost arm':               ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'wheelchair':             ['adaptive sports', 'disability', 'prosthetics', 'rehabilitation'],
  'burn':                   ['reconstructive surgery', 'burn treatment', 'disability', 'rehabilitation'],
  'burn injury':            ['reconstructive surgery', 'burn treatment', 'disability', 'rehabilitation'],
  'scarring':               ['reconstructive surgery', 'burn treatment', 'rehabilitation'],

  // ── Benefits, Claims & VA Access ──────────────────────────────────────────
  'benefits':               ['va benefits', 'disability', 'compensation', 'claims', 'vso'],
  'claims':                 ['va claims', 'disability', 'benefits', 'compensation', 'vso'],
  'vso':                    ['benefits', 'claims', 'disability', 'compensation', 'advocacy'],
  'rating':                 ['disability', 'claims', 'vso', 'compensation', 'benefits'],
  'compensation':           ['disability', 'claims', 'benefits', 'vso', 'compensation'],
  'enroll':                 ['healthcare', 'enrollment', 'benefits', 'va', 'insurance'],
  'enrollment':             ['healthcare', 'benefits', 'va', 'insurance'],
  'not enrolled':           ['healthcare', 'enrollment', 'benefits', 'va'],
  'file a claim':           ['claims', 'vso', 'benefits', 'disability'],
  'disability payment':     ['disability', 'compensation', 'claims', 'benefits'],
  'getting benefits':       ['benefits', 'claims', 'vso', 'disability'],
  'prescriptions':          ['pharmacy', 'prescriptions', 'medication', 'benefits'],
  'medication':             ['pharmacy', 'prescriptions', 'mental health', 'chronic conditions'],
  'pharmacy':               ['prescriptions', 'medication', 'pharmacy', 'benefits'],
  'records':                ['records', 'portal', 'documentation', 'appointments'],
  'appointments':           ['primary care', 'appointments', 'telemedicine', 'portal'],
  'dental':                 ['dental', 'dental insurance', 'benefits'],
  'primary care':           ['primary care', 'clinic', 'healthcare', 'outpatient'],
  'find a doctor':          ['primary care', 'clinic', 'community care', 'healthcare'],
  'specialist':             ['specialty care', 'community care', 'healthcare'],

  // ── Family & Caregiver ────────────────────────────────────────────────────
  'family':                 ['family support', 'caregiver', 'spouse', 'counseling', 'mental health'],
  'caregiver':              ['family support', 'respite', 'caregiver', 'PCAFC', 'support'],
  'spouse':                 ['family support', 'caregiver', 'counseling', 'mental health'],
  'children':               ['family support', 'caregiver', 'counseling', 'mental health'],
  'caregiving':             ['caregiver', 'family support', 'respite', 'support'],
  'kids':                   ['family support', 'caregiver', 'counseling', 'mental health'],
  'divorce':                ['family support', 'counseling', 'mental health', 'peer support'],
  'family stress':          ['family support', 'caregiver', 'counseling', 'mental health', 'stress'],

  // ── Nutrition, Weight & Metabolic ─────────────────────────────────────────
  'nutrition':              ['wellness', 'fitness', 'weight loss', 'diabetes', 'lifestyle'],
  'weight':                 ['weight loss', 'fitness', 'nutrition', 'wellness', 'obesity'],
  'weight loss':            ['fitness', 'nutrition', 'wellness', 'obesity', 'lifestyle'],
  'overweight':             ['weight loss', 'fitness', 'nutrition', 'obesity', 'wellness'],
  'weight gain':            ['weight loss', 'fitness', 'nutrition', 'wellness'],
  'diet':                   ['nutrition', 'weight loss', 'diabetes', 'wellness', 'fitness'],
  'blood sugar':            ['diabetes', 'metabolic', 'nutrition', 'chronic conditions'],
  'diabetes':               ['metabolic', 'nutrition', 'wellness', 'chronic conditions'],

  // ── Crisis & Emergency ────────────────────────────────────────────────────
  'crisis':                 ['crisis', 'suicide prevention', 'emergency', '988', 'mental health'],
  'suicide':                ['crisis', 'suicide prevention', '988', 'mental health', 'safety'],
  'suicidal':               ['crisis', 'suicide prevention', '988', 'mental health'],
  'suicidal thoughts':      ['crisis', 'suicide prevention', '988', 'mental health', 'safety'],
  "don't want to live":     ['crisis', 'suicide prevention', '988', 'mental health'],
  "want to die":            ['crisis', 'suicide prevention', '988', 'mental health', 'safety'],
  "thoughts of harming":    ['crisis', 'suicide prevention', '988', 'mental health', 'safety'],
  '988':                    ['crisis', 'suicide prevention', 'mental health', 'hotline'],
  'hotline':                ['crisis', 'counseling', 'mental health', 'hotline', '988'],
  'emergency':              ['crisis', 'emergency', 'urgent care', 'safety', '988'],
  'urgent care':            ['urgent care', 'emergency', 'primary care', 'community care'],

  // ── Housing & Financial ───────────────────────────────────────────────────
  'housing':                ['shelter', 'homeless', 'transitional housing', 'hud-vash'],
  'homeless':               ['shelter', 'transitional housing', 'hud-vash', 'housing'],
  'need a place to stay':   ['shelter', 'housing', 'transitional housing', 'hud-vash', 'lodging'],
  'lodging':                ['shelter', 'housing', 'lodging', 'family support'],
  'financial':              ['financial assistance', 'benefits', 'compensation', 'claims'],
  'money':                  ['financial assistance', 'benefits', 'compensation'],
  "can't afford":           ['free', 'financial assistance', 'no cost', 'sliding scale'],
  'no insurance':           ['healthcare', 'enrollment', 'benefits', 'va', 'insurance'],
  'free':                   ['free', 'no cost', 'sliding scale', 'financial assistance'],
  'jobs':                   ['employment', 'careers', 'hiring', 'workforce', 'vocational'],
  'employment':             ['vocational', 'careers', 'hiring', 'workforce', 'disability'],
  'work':                   ['employment', 'vocational', 'careers', 'hiring'],
  'unemployed':             ['employment', 'vocational', 'careers', 'financial assistance'],
  "can't work":             ['employment', 'vocational', 'disability', 'financial assistance'],
  'lost my job':            ['employment', 'vocational', 'financial assistance', 'benefits'],

  // ── Toxic Exposures ───────────────────────────────────────────────────────
  'burn pit':               ['toxic exposure', 'pact act', 'respiratory', 'cancer'],
  'burn pits':              ['toxic exposure', 'pact act', 'respiratory', 'cancer'],
  'burn pit exposure':      ['toxic exposure', 'pact act', 'respiratory', 'cancer'],
  'agent orange':           ['toxic exposure', 'cancer', 'diabetes', 'chronic conditions'],
  'toxic exposure':         ['pact act', 'cancer', 'respiratory', 'burn pit', 'chronic conditions'],
  'pact act':               ['toxic exposure', 'cancer', 'respiratory', 'burn pit', 'benefits'],
  'radiation':              ['toxic exposure', 'cancer', 'pact act', 'chronic conditions'],
  'gulf war':               ['toxic exposure', 'ptsd', 'chronic conditions', 'benefits'],
  'gulf war illness':       ['toxic exposure', 'chronic conditions', 'ptsd', 'benefits'],
  'contaminated water':     ['toxic exposure', 'cancer', 'pact act'],
  'camp lejeune':           ['toxic exposure', 'cancer', 'pact act', 'benefits'],
  'cancer':                 ['toxic exposure', 'pact act', 'cancer', 'benefits'],

  // ── Veteran Demographics & Eras ───────────────────────────────────────────
  'vietnam':                ['vietnam era', 'agent orange', 'ptsd', 'toxic exposure'],
  'vietnam veteran':        ['vietnam era', 'agent orange', 'ptsd', 'toxic exposure', 'peer support'],
  'iraq veteran':           ['ptsd', 'tbi', 'post-9/11', 'mental health', 'peer support'],
  'iraq vet':               ['ptsd', 'tbi', 'post-9/11', 'mental health', 'peer support'],
  'afghanistan veteran':    ['ptsd', 'tbi', 'post-9/11', 'mental health', 'peer support'],
  'combat veteran':         ['ptsd', 'tbi', 'physical rehabilitation', 'mental health', 'peer support'],
  'saw combat':             ['ptsd', 'tbi', 'mental health', 'counseling', 'peer support'],
  'deployed':               ['ptsd', 'tbi', 'mental health', 'peer support', 'post-9/11'],
  'post-9/11':              ['ptsd', 'tbi', 'mental health', 'physical rehabilitation', 'peer support'],
  'disabled veteran':       ['disability', 'adaptive', 'rehabilitation', 'benefits', 'prosthetics'],
  'elderly':                ['aging', 'geriatric', 'long-term care', 'caregiver'],
  'older veteran':          ['aging', 'geriatric', 'long-term care', 'caregiver'],
  'aging':                  ['geriatric', 'long-term care', 'caregiver', 'dementia'],
  'senior':                 ['aging', 'geriatric', 'long-term care', 'caregiver'],
  'national guard':         ['benefits', 'healthcare', 'mental health', 'peer support'],
  'reserve':                ['benefits', 'healthcare', 'mental health', 'peer support'],
  'reservist':              ['benefits', 'healthcare', 'mental health', 'peer support'],
};

// Stopwords stripped before word-overlap synonym matching
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'my', 'i', 'me', 'we', 'you', 'he', 'she', 'it',
  'is', 'am', 'are', 'was', 'be', 'been', 'have', 'has', 'had', 'do',
  'does', 'did', 'as', 'up', 'so', 'if', 'no', 'go', 'from', 'into',
  'too', 'just', 'can', 'will', 'would', 'could', 'should', 'may',
  'not', 'get', 'got', 'also', 'some', 'any', 'how', 'what', 'when',
  'where', 'why', 'who', 'its', 'their', 'there', 'then', 'that',
  'this', 'these', 'those', 'im', 'ive', 'dont', 'cant', 'wont',
]);

function getSignificantWords(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .replace(/[''`]/g, '')  // strip apostrophes so "can't" → "cant"
    .split(/[\s\-,]+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * Expands a search term using SYNONYM_MAP and returns all variants for $or matching.
 * Always includes the original term.
 *
 * Two-pass expansion:
 *   1. Exact key lookup  — "tinnitus" → [hearing aids, audiology…]
 *   2. Word-overlap (≥80%) — "ringing in my ears" matches "ringing in ears" key
 *      because their significant words {ringing, ears} are identical.
 *      This makes filler words like "my", "in", "the" invisible to the matcher.
 */
function expandSearchTerms(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const terms = new Set<string>([lower]);

  // 1. Exact key match (fast path)
  (SYNONYM_MAP[lower] ?? []).forEach(s => terms.add(s));

  // 2. Word-overlap: handles inserted filler words
  const inputWords = new Set(getSignificantWords(lower));
  if (inputWords.size > 0) {
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (key === lower) continue;
      const keyWords = getSignificantWords(key);
      if (keyWords.length === 0) continue;
      const matched = keyWords.filter(w => inputWords.has(w)).length;
      if (matched / keyWords.length >= 0.8) {
        synonyms.forEach(s => terms.add(s));
      }
    }
  }

  return Array.from(terms);
}

const DB_NAME = process.env.MONGODB_DB || 'vet1stop';
const COLLECTION = 'healthResources';
const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subcategory = searchParams.get('subcategory') ?? '';
    const search      = searchParams.get('search') ?? '';
    const tag         = searchParams.get('tag') ?? '';
    const sortBy      = searchParams.get('sortBy') ?? 'relevance';
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit       = Math.min(50, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10));

    const { db } = await connectToDatabase(DB_NAME);
    const col = db.collection(COLLECTION);

    // Build query
    const query: Record<string, unknown> = {};

    if (subcategory) {
      query.subcategory = subcategory;
    }

    if (search.trim()) {
      // Strike 9: expand the search term through synonym map, then OR across all variants
      const searchTerms = expandSearchTerms(search.trim());
      const termClauses = searchTerms.flatMap(term => {
        const re = { $regex: term, $options: 'i' };
        return [{ title: re }, { description: re }, { tags: re }];
      });
      query.$or = termClauses;
    }

    if (tag) {
      // If we already have a search $or, wrap in $and to avoid collision
      if (query.$or) {
        query.$and = [{ $or: query.$or as unknown[] }, { tags: { $regex: tag, $options: 'i' } }];
        delete query.$or;
      } else {
        query.tags = { $regex: tag, $options: 'i' };
      }
    }

    // Sort — when a search is active and sortBy is default relevance, sort by rating desc
    // so the best-matched (most reputable) resource floats to top instead of priority order.
    // Strike 9: text score relevance requires Atlas text index (see file header).
    let sort: Record<string, 1 | -1> = {};
    if (sortBy === 'rating')       sort = { rating: -1 };
    else if (sortBy === 'newest')  sort = { updatedAt: -1 };
    else if (sortBy === 'alpha')   sort = { title: 1 };
    else if (search.trim())        sort = { rating: -1, priority: 1 }; // search active: best-rated first
    else                           sort = { priority: 1, rating: -1 }; // browse default: priority order

    const skip = (page - 1) * limit;

    // When a search term is active, use aggregation to boost title-prefix matches.
    // Without this, searching "ree" surfaces all "free"-tagged resources above
    // REE Medical because they share the "ree" substring but outrank it by rating.
    let resources: Record<string, unknown>[];
    let total: number;

    if (search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const aggResult = await col.aggregate([
        { $match: query },
        { $addFields: {
          _tb: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: '$title', regex: `^${escapedSearch}`, options: 'i' } }, then: 10 },
                { case: { $regexMatch: { input: '$title', regex: escapedSearch,        options: 'i' } }, then: 5  },
              ],
              default: 0,
            },
          },
        }},
        { $sort: { _tb: -1, ...sort } },
        { $facet: {
          resources: [{ $skip: skip }, { $limit: limit }, { $unset: '_tb' }],
          meta:      [{ $count: 'total' }],
        }},
      ]).toArray();

      const facet = aggResult[0] as { resources: Record<string, unknown>[]; meta: { total: number }[] } | undefined;
      resources = facet?.resources ?? [];
      total     = facet?.meta?.[0]?.total ?? 0;
    } else {
      [resources, total] = await Promise.all([
        col.find(query).sort(sort).skip(skip).limit(limit).toArray() as Promise<Record<string, unknown>[]>,
        col.countDocuments(query),
      ]);
    }

    return NextResponse.json({
      resources,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[/api/health/browse]', err);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }
}
