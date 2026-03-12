/**
 * /api/health/browse — Public browse endpoint for the Health Hub page.
 * Queries the healthResources collection by subcategory (federal/ngo/state),
 * search term, tags, and pagination. Distinct from /api/health/resources
 * which uses legacy resourceType + categories fields.
 *
 * Strike 9: Text index + synonym expansion for smarter search.
 * MongoDB Atlas text index required on: { title: "text", description: "text", tags: "text" }
 * Create in Atlas UI: Collection → Indexes → Create Index → JSON editor:
 *   { "title": "text", "description": "text", "tags": "text" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// ─── Synonym expansion map (Strike 9) ────────────────────────────────────────
// Expands colloquial/umbrella terms to match how resources are actually tagged.
// "outdoors" won't hit fishing/kayaking NGOs without this.
const SYNONYM_MAP: Record<string, string[]> = {
  outdoors:        ['outdoor', 'fishing', 'hunting', 'camping', 'hiking', 'adventure', 'nature therapy', 'kayaking'],
  outdoor:         ['fishing', 'hunting', 'camping', 'hiking', 'adventure', 'nature therapy', 'kayaking', 'outdoor therapy'],
  pain:            ['chronic pain', 'back pain', 'musculoskeletal', 'physical therapy', 'pain management'],
  'mental health': ['ptsd', 'depression', 'anxiety', 'counseling', 'therapy', 'behavioral health'],
  ptsd:            ['trauma', 'mental health', 'stress', 'anxiety', 'counseling'],
  hearing:         ['tinnitus', 'audiology', 'hearing loss', 'audiologist'],
  sleep:           ['sleep apnea', 'insomnia', 'sleep disorder', 'respiratory'],
  benefits:        ['va benefits', 'disability', 'compensation', 'claims', 'vso'],
  jobs:            ['employment', 'careers', 'hiring', 'workforce', 'vocation'],
  housing:         ['shelter', 'homeless', 'transitional housing', 'hud-vash'],
  fitness:         ['exercise', 'wellness', 'adaptive sports', 'physical therapy', 'rehabilitation'],
  tbi:             ['traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation'],
  addiction:       ['substance use', 'alcohol', 'recovery', 'rehabilitation'],
  women:           ["women's health", 'female veteran', 'mst', 'military sexual trauma'],
  crisis:          ['suicide', 'emergency', 'crisis line', 'mental health crisis'],
  claims:          ['va claims', 'disability rating', 'vso', 'compensation', 'nexus'],
  free:            ['no cost', 'at no cost', 'sliding scale', 'financial assistance'],
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
