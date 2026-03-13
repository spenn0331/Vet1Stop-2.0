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
// sampleHealthResources.ts. Covers: lay medical terms, body-part searches,
// informal language, toxic exposures, veteran demographics, and activity searches.
//
// Rule: key = what a user would type; values = database tags that should also match.
const SYNONYM_MAP: Record<string, string[]> = {

  // ── Mental Health (broad) ─────────────────────────────────────────────────
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
  // Informal / lay mental health phrases
  'stressed out':           ['stress', 'mental health', 'ptsd', 'counseling', 'mindfulness'],
  'not okay':               ['mental health', 'counseling', 'crisis', 'ptsd', 'peer support'],
  'struggling':             ['mental health', 'counseling', 'peer support', 'ptsd', 'therapy'],

  // ── Therapy & Support Access ──────────────────────────────────────────────
  'therapy':                ['counseling', 'mental health', 'treatment', 'ptsd', 'rehabilitation'],
  'counseling':             ['therapy', 'mental health', 'ptsd', 'support', 'treatment'],
  'support group':          ['peer support', 'counseling', 'mental health', 'community', 'recovery'],
  'peer support':           ['support group', 'counseling', 'mental health', 'community', 'veteran-led'],
  'telehealth':             ['telemedicine', 'portal', 'appointments', 'digital', 'online'],
  'online':                 ['telemedicine', 'telehealth', 'portal', 'digital', 'app', 'counseling'],
  'virtual':                ['telemedicine', 'telehealth', 'portal', 'digital', 'appointments'],
  'app':                    ['app', 'mobile', 'digital', 'telemedicine', 'self-help', 'coping'],

  // ── Physical Health & Pain ────────────────────────────────────────────────
  'pain':                   ['chronic pain', 'back pain', 'pain management', 'physical therapy', 'musculoskeletal'],
  'chronic pain':           ['pain management', 'physical therapy', 'back pain', 'musculoskeletal', 'rehabilitation'],
  'back pain':              ['chronic pain', 'musculoskeletal', 'physical therapy', 'pain management', 'rehabilitation'],
  'back':                   ['back pain', 'musculoskeletal', 'physical therapy', 'chronic pain', 'spine'],
  'knee':                   ['knee pain', 'musculoskeletal', 'physical therapy', 'orthopedic', 'rehabilitation'],
  'knee pain':              ['musculoskeletal', 'physical therapy', 'chronic pain', 'orthopedic'],
  'physical therapy':       ['rehabilitation', 'back pain', 'chronic pain', 'musculoskeletal', 'orthopedic'],
  'rehab':                  ['rehabilitation', 'physical therapy', 'recovery', 'substance use', 'tbi'],
  'physical':               ['physical therapy', 'rehabilitation', 'fitness', 'chronic pain', 'musculoskeletal'],
  // Lay terms for pain
  'aching':                 ['chronic pain', 'pain management', 'physical therapy', 'musculoskeletal'],
  'sore':                   ['chronic pain', 'physical therapy', 'musculoskeletal', 'rehabilitation'],
  'joint pain':             ['musculoskeletal', 'physical therapy', 'orthopedic', 'chronic pain'],

  // ── TBI & Brain ───────────────────────────────────────────────────────────
  'tbi':                    ['traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation', 'polytrauma'],
  'brain injury':           ['tbi', 'traumatic brain injury', 'cognitive', 'rehabilitation', 'polytrauma'],
  'concussion':             ['tbi', 'traumatic brain injury', 'cognitive', 'rehabilitation'],
  'memory':                 ['tbi', 'cognitive', 'neurological', 'concentration'],
  'brain fog':              ['tbi', 'cognitive', 'fatigue', 'neurological', 'concentration'],
  'cognitive':              ['tbi', 'traumatic brain injury', 'memory', 'concentration', 'rehabilitation'],
  'concentration':          ['tbi', 'cognitive', 'mental health', 'ptsd', 'focus'],
  'focus':                  ['tbi', 'cognitive', 'mental health', 'ptsd', 'concentration'],

  // ── Hearing & Vision ─────────────────────────────────────────────────────
  'hearing':                ['tinnitus', 'audiology', 'hearing loss', 'hearing aids'],
  'tinnitus':               ['hearing', 'audiology', 'hearing loss', 'ringing'],
  'hearing loss':           ['tinnitus', 'audiology', 'hearing aids', 'hearing'],
  'ringing in ears':        ['tinnitus', 'audiology', 'hearing loss', 'hearing'],
  'ringing ears':           ['tinnitus', 'audiology', 'hearing loss'],
  'deaf':                   ['hearing loss', 'audiology', 'hearing aids', 'tinnitus'],
  'ears':                   ['tinnitus', 'hearing loss', 'audiology', 'hearing aids'],
  'vision':                 ['low vision', 'blind', 'assistive technology', 'rehabilitation'],
  'blind':                  ['low vision', 'blind rehabilitation', 'assistive technology', 'vision'],
  'eyesight':               ['low vision', 'blind', 'vision', 'assistive technology'],

  // ── Sleep ─────────────────────────────────────────────────────────────────
  'sleep':                  ['sleep apnea', 'insomnia', 'sleep medicine', 'cpap', 'respiratory'],
  'sleep apnea':            ['sleep', 'cpap', 'insomnia', 'respiratory', 'sleep medicine'],
  'insomnia':               ['sleep', 'sleep apnea', 'sleep medicine', 'mental health'],
  'cpap':                   ['sleep apnea', 'sleep', 'respiratory', 'sleep medicine'],
  'tired':                  ['fatigue', 'sleep', 'sleep apnea', 'mental health', 'wellness'],
  'fatigue':                ['sleep', 'fatigue', 'mental health', 'chronic conditions', 'wellness'],
  // Lay phrases
  'trouble sleeping':       ['sleep', 'insomnia', 'sleep apnea', 'ptsd', 'sleep medicine'],
  "can't sleep":            ['sleep', 'insomnia', 'sleep apnea', 'sleep medicine'],
  'bad dreams':             ['ptsd', 'sleep', 'nightmare', 'trauma', 'sleep medicine'],
  'nightsweats':            ['ptsd', 'sleep', 'trauma', 'sleep medicine'],

  // ── Substance Use & Recovery ──────────────────────────────────────────────
  'substance use':          ['alcohol', 'recovery', 'rehabilitation', 'addiction', 'detox'],
  'addiction':              ['substance use', 'alcohol', 'recovery', 'rehabilitation', 'detox'],
  'alcohol':                ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'drinking':               ['alcohol', 'substance use', 'addiction', 'recovery'],
  'drugs':                  ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'sober':                  ['recovery', 'substance use', 'alcohol', 'peer support'],
  'recovery':               ['substance use', 'alcohol', 'rehabilitation', 'peer support', 'addiction'],
  'detox':                  ['substance use', 'addiction', 'recovery', 'rehabilitation'],
  'opioid':                 ['substance use', 'addiction', 'recovery', 'detox', 'rehabilitation'],

  // ── Outdoor, Recreation & Activity Therapy ────────────────────────────────
  'outdoor':                ['outdoor therapy', 'adventure therapy', 'fishing', 'hiking', 'adaptive sports', 'recreation', 'fitness'],
  'outdoors':               ['outdoor therapy', 'adventure therapy', 'fishing', 'hunting', 'camping', 'hiking', 'kayaking', 'adaptive sports', 'recreation'],
  'outdoor therapy':        ['adventure therapy', 'fishing', 'hiking', 'nature therapy', 'equine', 'ptsd', 'peer support', 'recreation'],
  'adventure therapy':      ['outdoor therapy', 'fishing', 'hiking', 'nature therapy', 'ptsd', 'peer support'],
  'nature':                 ['outdoor therapy', 'adventure therapy', 'fishing', 'hiking', 'recreation', 'wellness'],
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

  // ── Women Veterans ────────────────────────────────────────────────────────
  'women':                  ["women's health", 'women veterans', 'mst', 'military sexual trauma', 'gynecology'],
  'women veterans':         ["women's health", 'mst', 'military sexual trauma', 'gynecology', 'mental health'],
  'mst':                    ['military sexual trauma', 'counseling', 'mental health', 'trauma', 'women veterans'],
  'military sexual trauma': ['mst', 'counseling', 'mental health', 'trauma', 'women veterans'],
  'sexual trauma':          ['mst', 'military sexual trauma', 'counseling', 'mental health', 'trauma'],
  'sexual assault':         ['mst', 'military sexual trauma', 'counseling', 'mental health', 'trauma'],
  'pregnancy':              ['maternal care', "women's health", 'women veterans', 'gynecology'],

  // ── Disability & Mobility ─────────────────────────────────────────────────
  'disability':             ['disability', 'adaptive', 'prosthetics', 'orthopedic', 'wheelchair', 'rehabilitation'],
  'prosthetics':            ['disability', 'adaptive', 'orthopedic', 'rehabilitation'],
  'amputee':                ['prosthetics', 'adaptive', 'disability', 'rehabilitation'],
  'amputation':             ['prosthetics', 'adaptive', 'disability', 'rehabilitation', 'orthopedic'],
  'wheelchair':             ['adaptive sports', 'disability', 'prosthetics', 'rehabilitation'],

  // ── Benefits, Claims & VA Access ──────────────────────────────────────────
  'benefits':               ['va benefits', 'disability', 'compensation', 'claims', 'vso'],
  'claims':                 ['va claims', 'disability', 'benefits', 'compensation', 'vso'],
  'vso':                    ['benefits', 'claims', 'disability', 'compensation', 'advocacy'],
  'rating':                 ['disability', 'claims', 'vso', 'compensation', 'benefits'],
  'compensation':           ['disability', 'claims', 'benefits', 'vso', 'compensation'],
  'enroll':                 ['healthcare', 'enrollment', 'benefits', 'va', 'insurance'],
  'enrollment':             ['healthcare', 'benefits', 'va', 'insurance'],
  'prescriptions':          ['pharmacy', 'prescriptions', 'medication', 'benefits'],
  'medication':             ['pharmacy', 'prescriptions', 'mental health', 'chronic conditions'],
  'pharmacy':               ['prescriptions', 'medication', 'pharmacy', 'benefits'],
  'records':                ['records', 'portal', 'documentation', 'appointments'],
  'appointments':           ['primary care', 'appointments', 'telemedicine', 'portal'],
  'dental':                 ['dental', 'dental insurance', 'benefits'],

  // ── Family & Caregiver ────────────────────────────────────────────────────
  'family':                 ['family support', 'caregiver', 'spouse', 'counseling', 'mental health'],
  'caregiver':              ['family support', 'respite', 'caregiver', 'PCAFC', 'support'],
  'spouse':                 ['family support', 'caregiver', 'counseling', 'mental health'],
  'children':               ['family support', 'caregiver', 'counseling', 'mental health'],
  'caregiving':             ['caregiver', 'family support', 'respite', 'support'],

  // ── Nutrition, Weight & Metabolic ─────────────────────────────────────────
  'nutrition':              ['wellness', 'fitness', 'weight loss', 'diabetes', 'lifestyle'],
  'weight':                 ['weight loss', 'fitness', 'nutrition', 'wellness', 'obesity'],
  'weight loss':            ['fitness', 'nutrition', 'wellness', 'obesity', 'lifestyle'],
  'diet':                   ['nutrition', 'weight loss', 'diabetes', 'wellness', 'fitness'],
  'diabetes':               ['metabolic', 'nutrition', 'wellness', 'chronic conditions'],

  // ── Crisis & Emergency ────────────────────────────────────────────────────
  'crisis':                 ['crisis', 'suicide prevention', 'emergency', '988', 'mental health'],
  'suicide':                ['crisis', 'suicide prevention', '988', 'mental health', 'safety'],
  'suicidal':               ['crisis', 'suicide prevention', '988', 'mental health'],
  '988':                    ['crisis', 'suicide prevention', 'mental health', 'hotline'],
  'hotline':                ['crisis', 'counseling', 'mental health', 'hotline', '988'],
  'emergency':              ['crisis', 'emergency', 'urgent care', 'safety', '988'],

  // ── Housing & Financial ───────────────────────────────────────────────────
  'housing':                ['shelter', 'homeless', 'transitional housing', 'hud-vash'],
  'homeless':               ['shelter', 'transitional housing', 'hud-vash', 'housing'],
  'financial':              ['financial assistance', 'benefits', 'compensation', 'claims'],
  'money':                  ['financial assistance', 'benefits', 'compensation'],
  'free':                   ['free', 'no cost', 'sliding scale', 'financial assistance'],
  'jobs':                   ['employment', 'careers', 'hiring', 'workforce', 'vocational'],
  'employment':             ['vocational', 'careers', 'hiring', 'workforce', 'disability'],
  'work':                   ['employment', 'vocational', 'careers', 'hiring'],

  // ── Toxic Exposures ───────────────────────────────────────────────────────
  'burn pit':               ['toxic exposure', 'pact act', 'respiratory', 'cancer'],
  'agent orange':           ['toxic exposure', 'cancer', 'diabetes', 'chronic conditions'],
  'toxic exposure':         ['pact act', 'cancer', 'respiratory', 'burn pit', 'chronic conditions'],
  'pact act':               ['toxic exposure', 'cancer', 'respiratory', 'burn pit', 'benefits'],
  'radiation':              ['toxic exposure', 'cancer', 'pact act', 'chronic conditions'],

  // ── Veteran Demographics & Eras ───────────────────────────────────────────
  'vietnam':                ['vietnam era', 'agent orange', 'ptsd', 'toxic exposure'],
  'vietnam veteran':        ['vietnam era', 'agent orange', 'ptsd', 'toxic exposure', 'peer support'],
  'combat veteran':         ['ptsd', 'tbi', 'physical rehabilitation', 'mental health', 'peer support'],
  'post-9/11':              ['ptsd', 'tbi', 'mental health', 'physical rehabilitation', 'peer support'],
  'elderly':                ['aging', 'geriatric', 'long-term care', 'caregiver'],
  'aging':                  ['geriatric', 'long-term care', 'caregiver', 'dementia'],
  'senior':                 ['aging', 'geriatric', 'long-term care', 'caregiver'],
};

/**
 * Expands a search term using SYNONYM_MAP and returns all variants for $or matching.
 * Always includes the original term.
 */
function expandSearchTerms(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const synonyms = SYNONYM_MAP[lower] ?? [];
  return Array.from(new Set([lower, ...synonyms]));
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
    const [resources, total] = await Promise.all([
      col.find(query).sort(sort).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    return NextResponse.json({
      resources,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[/api/health/browse]', err);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }
}
