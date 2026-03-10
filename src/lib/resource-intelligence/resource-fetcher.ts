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
 */
export async function fetchDomainResources(
  config: DomainConfig,
  keywords: string[],
  bridgeContext?: BridgeContext,
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

    for (const track of config.tracks) {
      const subcatFilter = { subcategory: track.subcategory };

      // Build strict query: keywords + subcategory + optional geo filter
      const strictParts = [keywordFilter, subcatFilter];
      if (track.geoFilter) strictParts.push(track.geoFilter as Record<string, unknown>);
      const strictQuery = searchPat && strictParts.length > 1
        ? { $and: strictParts }
        : subcatFilter;

      let docs = await coll.find(strictQuery).sort({ rating: -1 }).limit(20)
        .toArray() as Record<string, unknown>[];

      if (docs.length < 3) {
        // Relax: keywords + subcategory (drop geo filter)
        const relaxedQuery = searchPat
          ? { $and: [keywordFilter, subcatFilter] }
          : subcatFilter;
        docs = await coll.find(relaxedQuery).sort({ rating: -1 }).limit(20)
          .toArray() as Record<string, unknown>[];
      }

      if (docs.length < 3) {
        // Last resort: subcategory only
        docs = await coll.find(subcatFilter).sort({ rating: -1 }).limit(20)
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
