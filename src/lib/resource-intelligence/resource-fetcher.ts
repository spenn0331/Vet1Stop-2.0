/**
 * resource-fetcher.ts — Strike 5
 *
 * Generic MongoDB resource fetcher for any domain.
 * Moved + generalized from symptom-triage/route.ts fetchMongoResources().
 *
 * Uses DomainConfig to determine collection name and track subcategories.
 * Each track fetches up to 20 docs (Strike 4B), then falls back to
 * a relaxed query if < 3 results.
 */

import { connectToDatabase } from '@/lib/mongodb';
import type { DomainConfig, RawResource, BridgeContext, TrackResults } from './types';

// ─── State abbreviation → full name map ──────────────────────────────────────

const STATE_NAMES: Record<string, string> = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
  HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
  KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland',
  MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi',
  MO:'Missouri', MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire',
  NJ:'New Jersey', NM:'New Mexico', NY:'New York', NC:'North Carolina',
  ND:'North Dakota', OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania',
  RI:'Rhode Island', SC:'South Carolina', SD:'South Dakota', TN:'Tennessee',
  TX:'Texas', UT:'Utah', VT:'Vermont', VA:'Virginia', WA:'Washington',
  WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming', DC:'District of Columbia',
};

// Reverse map: lowercase full name → abbreviation
const STATE_NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

/** Build a MongoDB geo filter for a given state string (abbrev or full name). */
function buildStateGeoFilter(userState: string): Record<string, unknown> {
  const trimmed   = userState.trim().replace(/\s*\([^)]+\)$/, ''); // strip "(PA)" suffix
  const upperKey  = trimmed.toUpperCase();
  const lowerKey  = trimmed.toLowerCase();

  // Resolve to abbreviation + Title-Case full name
  let abbr: string;
  let fullName: string;
  if (STATE_NAMES[upperKey]) {
    // Input is an abbreviation e.g. 'PA'
    abbr     = upperKey;
    fullName = STATE_NAMES[upperKey]; // e.g. 'Pennsylvania'
  } else if (STATE_NAME_TO_ABBR[lowerKey]) {
    // Input is a full name e.g. 'pennsylvania'
    abbr     = STATE_NAME_TO_ABBR[lowerKey]; // e.g. 'PA'
    fullName = STATE_NAMES[abbr];             // e.g. 'Pennsylvania'
  } else {
    // Unknown — use trimmed as-is, no abbreviation shortcut
    abbr     = trimmed.slice(0, 2).toUpperCase();
    fullName = trimmed;
  }

  const escaped = fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return {
    $or: [
      { 'location.state': { $regex: `${escaped}|\\b${abbr}\\b`, $options: 'i' } },
      { title:            { $regex: escaped, $options: 'i' } },
      { description:      { $regex: `${escaped}.*veteran|veteran.*${escaped}`, $options: 'i' } },
    ],
  };
}

// ─── toRaw helper — normalizes a raw MongoDB doc to RawResource ───────────────

function toRaw(doc: Record<string, unknown>): RawResource {
  return {
    title:       String(doc.title ?? doc.name ?? ''),
    description: String(doc.description ?? ''),
    url:         String(doc.url ?? doc.website ?? doc.link ?? ''),
    phone:       doc.phone       ? String(doc.phone)
               : doc.phoneNumber ? String(doc.phoneNumber)
               : doc.contact     ? String(doc.contact)
               : undefined,
    priority:    (['high', 'medium', 'low'].includes(String(doc.priority))
                   ? doc.priority as 'high' | 'medium' | 'low' : 'medium'),
    tags:        Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
    isFree:      typeof doc.isFree === 'boolean' ? doc.isFree
                 : typeof doc.free  === 'boolean' ? (doc.free as boolean) : false,
    costLevel:   (['free', 'low', 'moderate', 'high'].includes(String(doc.costLevel))
                   ? doc.costLevel as 'free' | 'low' | 'moderate' | 'high' : 'free'),
    rating:      typeof doc.rating === 'number' ? doc.rating : 0,
    updatedAt:   doc.updatedAt         ? String(doc.updatedAt)
               : doc.ratingLastUpdated ? String(doc.ratingLastUpdated)
               : undefined,
    location:    (() => {
      const loc = doc.location;
      if (loc && typeof loc === 'object') {
        const obj   = loc as Record<string, unknown>;
        const parts = [obj.city, obj.state].filter(Boolean);
        return parts.length ? (parts.join(', ') as string) : undefined;
      }
      return loc ? String(loc) : doc.state ? String(doc.state) : undefined;
    })(),
  };
}

/**
 * Fetches resources from MongoDB for each track defined in the domain config.
 * Returns a TrackResults object keyed by track.id.
 *
 * Query strategy:
 *   1. Keyword + subcategory filter (up to 20 docs)
 *   2. If < 3 results: relax keyword filter (subcategory only)
 *   3. State track: also applies optional geoFilter, relaxes to state-only if dry
 *
 * exclusionTags (optional): applied as a MongoDB $nin on the tags array at query
 * level — reduces the raw pool BEFORE scoring so excluded categories never inflate counts.
 */
export async function fetchDomainResources(
  config: DomainConfig,
  keywords: string[],
  bridgeContext?: BridgeContext,
  exclusionTags?: string[],
): Promise<TrackResults> {
  const results: TrackResults = {};

  try {
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const { db } = await connectToDatabase(dbName);
    const coll = db.collection(config.collection);

    // Merge bridge conditions into keyword pool
    const bridgeTerms = bridgeContext?.conditions?.map(c => c.condition.toLowerCase()) ?? [];
    const allTerms    = Array.from(new Set([...keywords, ...bridgeTerms]));
    const searchPat   = allTerms.length > 0 ? allTerms.join('|') : '';

    const keywordFilter = searchPat ? {
      $or: [
        { title:       { $regex: searchPat, $options: 'i' } },
        { description: { $regex: searchPat, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: searchPat, $options: 'i' } } },
      ],
    } : {};

    // Exclusion pre-filter: $nin on tags array — applied at query level to reduce raw pool
    const exclusionFilter: Record<string, unknown> | null =
      exclusionTags && exclusionTags.length > 0
        ? { tags: { $nin: exclusionTags.map(t => t.toLowerCase()) } }
        : null;

    if (exclusionFilter) {
      console.log(`[ResourceFetcher] Exclusion pre-filter active: ${exclusionTags!.join(', ')}`);
    }

    for (const track of config.tracks) {
      const subcatFilter = { subcategory: track.subcategory };

      // For state track: dynamic geo from bridge, else fall back to config geoFilter
      const effectiveGeo: Record<string, unknown> | undefined =
        track.id === 'state' && bridgeContext?.userState
          ? buildStateGeoFilter(bridgeContext.userState)
          : (track.geoFilter as Record<string, unknown> | undefined);

      // If the user's state is explicitly known, never fall back to wrong-state resources
      const userStateKnown = track.id === 'state' && !!bridgeContext?.userState;

      // NGO track gets a larger fetch pool — NGOs are more numerous and score lower
      const FETCH_LIMIT = track.id === 'ngo' ? 50 : 20;

      // Query 1: keywords + subcategory + geo + exclusion pre-filter
      const strictParts: Record<string, unknown>[] = [];
      if (searchPat) strictParts.push(keywordFilter);
      strictParts.push(subcatFilter);
      if (effectiveGeo) strictParts.push(effectiveGeo);
      if (exclusionFilter) strictParts.push(exclusionFilter);
      const strictQuery = strictParts.length > 1 ? { $and: strictParts } : subcatFilter;

      let docs = await coll.find(strictQuery).sort({ rating: -1 }).limit(FETCH_LIMIT)
        .toArray() as Record<string, unknown>[];

      if (docs.length < 3) {
        // Query 2: relax keywords, keep geo + exclusion filters
        const relaxParts: Record<string, unknown>[] = [subcatFilter];
        if (effectiveGeo) relaxParts.push(effectiveGeo);
        if (exclusionFilter) relaxParts.push(exclusionFilter);
        const relaxedQuery = relaxParts.length > 1 ? { $and: relaxParts } : subcatFilter;
        docs = await coll.find(relaxedQuery).sort({ rating: -1 }).limit(FETCH_LIMIT)
          .toArray() as Record<string, unknown>[];
      }

      if (docs.length < 3 && !userStateKnown) {
        // Query 3 (last resort): subcategory + exclusion only — only when state is unknown
        // When state IS known but has 0 resources, return [] rather than wrong-state results
        const lastResortParts: Record<string, unknown>[] = [subcatFilter];
        if (exclusionFilter) lastResortParts.push(exclusionFilter);
        const lastResortQuery = lastResortParts.length > 1 ? { $and: lastResortParts } : subcatFilter;
        docs = await coll.find(lastResortQuery).sort({ rating: -1 }).limit(FETCH_LIMIT)
          .toArray() as Record<string, unknown>[];
      }

      results[track.id] = docs.map(toRaw);
      console.log(`[ResourceFetcher] ${config.collection} ${track.id} → ${results[track.id].length} docs`);
    }
  } catch (err) {
    console.error('[ResourceFetcher] fetchDomainResources error:', (err as Error).message);
    // Return empty arrays per track — caller falls back to static/AI resources
    for (const track of config.tracks) {
      results[track.id] = results[track.id] ?? [];
    }
  }

  return results;
}
