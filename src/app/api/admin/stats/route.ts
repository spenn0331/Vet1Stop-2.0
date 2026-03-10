// Strike 6 — Admin Stats API — live MongoDB counts for Admin Dashboard
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const { db } = await connectToDatabase(dbName);

    const [
      totalResources,
      federalResources,
      ngoResources,
      stateResources,
      pathwaysCount,
      ratingsCount,
      recentRatings,
    ] = await Promise.all([
      db.collection('healthResources').countDocuments(),
      db.collection('healthResources').countDocuments({ subcategory: 'federal' }),
      db.collection('healthResources').countDocuments({ subcategory: 'ngo' }),
      db.collection('healthResources').countDocuments({ subcategory: 'state' }),
      db.collection('pathways').countDocuments().catch(() => 0),
      db.collection('ratings').countDocuments().catch(() => 0),
      db.collection('ratings')
        .find({})
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray()
        .catch(() => []),
    ]);

    const avgRating = ratingsCount > 0
      ? await db.collection('ratings')
          .aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }])
          .toArray()
          .then(r => Math.round((r[0]?.avg ?? 0) * 10) / 10)
          .catch(() => 0)
      : 0;

    return NextResponse.json({
      resources: {
        total: totalResources,
        federal: federalResources,
        ngo: ngoResources,
        state: stateResources,
      },
      pathways: pathwaysCount,
      ratings: {
        total: ratingsCount,
        average: avgRating,
        recent: recentRatings.map(r => ({
          resourceId: r.resourceId,
          track: r.track,
          thumbs: r.thumbs,
          rating: r.rating,
          timestamp: r.timestamp,
        })),
      },
    });
  } catch (err) {
    console.error('[AdminStats] Error:', (err as Error).message);
    return NextResponse.json(
      { error: 'Failed to load stats', resources: { total: 0, federal: 0, ngo: 0, state: 0 }, pathways: 0, ratings: { total: 0, average: 0, recent: [] } },
      { status: 500 }
    );
  }
}
