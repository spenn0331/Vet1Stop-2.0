/**
 * /api/health/browse — Public browse endpoint for the Health Hub page.
 * Queries the healthResources collection by subcategory (federal/ngo/state),
 * search term, tags, and pagination. Distinct from /api/health/resources
 * which uses legacy resourceType + categories fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

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
      const re = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { title: re },
        { description: re },
        { tags: re },
      ];
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

    // Sort
    let sort: Record<string, 1 | -1> = {};
    if (sortBy === 'rating')    sort = { rating: -1 };
    else if (sortBy === 'newest') sort = { updatedAt: -1 };
    else if (sortBy === 'alpha')  sort = { title: 1 };
    else                          sort = { priority: 1, rating: -1 }; // relevance default

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
