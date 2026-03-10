/**
 * keyword-map-loader.ts — Strike 5
 *
 * Loads the KEYWORD_TAG_MAP from the MongoDB `keywordMappings` collection.
 * Falls back to the hardcoded map in resources-scoring.ts if DB call fails.
 * In-memory cache with 10-minute TTL prevents per-request DB round trips.
 *
 * Usage: const map = await getKeywordTagMap('health');
 */

import { connectToDatabase } from '@/lib/mongodb';

export type KeywordTagMap = Record<string, string[]>;

// ─── Hardcoded fallback (mirrors resources-scoring.ts KEYWORD_TAG_MAP) ────────
// This is the safety net — if MongoDB is unreachable, scoring still works.
const FALLBACK_MAP: KeywordTagMap = {
  'back pain':     ['back', 'spine', 'lumbar', 'musculoskeletal', 'chronic pain', 'pain management', 'physical therapy', 'adaptive sports', 'yoga'],
  'ptsd':          ['ptsd', 'trauma', 'mental health', 'anxiety', 'stress', 'peer support', 'counseling', 'veteran mental health'],
  'weight loss':   ['weight', 'fitness', 'nutrition', 'wellness', 'exercise', 'adaptive fitness', 'yoga', 'lifestyle'],
  'tinnitus':      ['tinnitus', 'hearing', 'audiology', 'hearing loss'],
  'sleep apnea':   ['sleep', 'sleep apnea', 'respiratory', 'chronic conditions'],
  'depression':    ['depression', 'mental health', 'counseling', 'peer support', 'wellness'],
  'anxiety':       ['anxiety', 'mental health', 'stress', 'counseling', 'peer support'],
  'chronic pain':  ['chronic pain', 'pain management', 'physical therapy', 'adaptive sports', 'musculoskeletal'],
  'diabetes':      ['diabetes', 'metabolic', 'nutrition', 'wellness', 'chronic conditions'],
  'tbi':           ['tbi', 'traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation'],
  'substance use': ['substance', 'alcohol', 'recovery', 'peer support', 'rehabilitation'],
  'fitness':       ['fitness', 'exercise', 'adaptive sports', 'yoga', 'wellness', 'nutrition'],
  'grants':        ['grant', 'financial assistance', 'benefits', 'funding'],
  'peer':          ['peer', 'peer support', 'peer-led', 'veteran community'],
};

// ─── In-memory cache (10-minute TTL) ─────────────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache: Map<string, { map: KeywordTagMap; expiresAt: number }> = new Map();

/**
 * Returns the keyword→relatedTerms map for the given domain.
 * Tries MongoDB first (with cache), falls back to hardcoded map on any error.
 */
export async function getKeywordTagMap(domain: string = 'health'): Promise<KeywordTagMap> {
  // Return cached version if fresh
  const cached = cache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.map;
  }

  try {
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const { db } = await connectToDatabase(dbName);
    const docs = await db
      .collection('keywordMappings')
      .find({ domain })
      .toArray() as unknown as Array<{ keyword: string; relatedTerms: string[] }>;

    if (docs.length === 0) {
      console.warn(`[KeywordMapLoader] No mappings found for domain="${domain}" — using fallback`);
      return domain === 'health' ? FALLBACK_MAP : {};
    }

    const map: KeywordTagMap = {};
    for (const doc of docs) {
      if (doc.keyword && Array.isArray(doc.relatedTerms)) {
        map[doc.keyword] = doc.relatedTerms;
      }
    }

    cache.set(domain, { map, expiresAt: Date.now() + CACHE_TTL_MS });
    console.log(`[KeywordMapLoader] Loaded ${docs.length} mappings for domain="${domain}" from MongoDB`);
    return map;
  } catch (err) {
    console.error('[KeywordMapLoader] DB load failed — using fallback:', (err as Error).message);
    return domain === 'health' ? FALLBACK_MAP : {};
  }
}

/** Clears the in-memory cache (useful for testing or after a reseed). */
export function clearKeywordMapCache(): void {
  cache.clear();
}

export { FALLBACK_MAP };
