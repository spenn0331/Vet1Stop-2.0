// @ts-nocheck
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';
import type { ScoreBreakdown } from '@/utils/ngo-data';

/**
 * Weighted scoring algorithm for NGO of the Month:
 *   Impact Score       35% — program outcome rating (0–100)
 *   Community Rating   25% — aggregate user rating (0–5 stars)
 *   Funding Efficiency 20% — % of funds going to veterans (0–1)
 *   Reach & Engagement 20% — veterans supported, normalized to top NGO
 */
function computeScore(ngo: any, maxVets: number): ScoreBreakdown {
  const m = ngo.metrics ?? {};
  const impactScore = typeof m.impactScore === 'number' ? m.impactScore : 50;
  const rating = typeof ngo.rating === 'number' ? ngo.rating : (typeof ngo.averageRating === 'number' ? ngo.averageRating : 3.5);
  const fundingEff = typeof m.fundingEfficiency === 'number' ? m.fundingEfficiency : 0.5;
  const vetCount = typeof m.veteransSupportedCount === 'number' ? m.veteransSupportedCount : 0;

  const impactComponent = Math.round((Math.min(impactScore, 100) / 100) * 35);
  const ratingComponent = Math.round((Math.min(rating, 5) / 5) * 25);
  const fundingComponent = Math.round(Math.min(Math.max(fundingEff, 0), 1) * 20);
  const veteransComponent = maxVets > 0 ? Math.round((Math.min(vetCount, maxVets) / maxVets) * 20) : 0;

  return {
    impactComponent,
    ratingComponent,
    fundingComponent,
    veteransComponent,
    total: impactComponent + ratingComponent + fundingComponent + veteransComponent,
  };
}

export async function GET(request: NextRequest) {
  const includeCandidates = request.nextUrl.searchParams.get('includeCandidates') === 'true';
  try {
    const { db } = await connectToDatabase();
    const allActive = await db.collection('ngos').find({ status: 'active' }).toArray();

    const maxVets = allActive.reduce((m, n) => Math.max(m, n.metrics?.veteransSupportedCount ?? 0), 1);

    const scored = allActive
      .map(n => ({ ngo: n, scoreBreakdown: computeScore(n, maxVets) }))
      .sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);

    const manualPick = allActive.find(n => n.isNGOOfTheMonth && n.isManualOverride);

    let winner: any = null;
    let isManualOverride = false;
    let scoreBreakdown: ScoreBreakdown | null = null;

    if (manualPick) {
      winner = manualPick;
      isManualOverride = true;
      scoreBreakdown = computeScore(manualPick, maxVets);
    } else if (scored.length > 0) {
      winner = scored[0].ngo;
      scoreBreakdown = scored[0].scoreBreakdown;
    }

    const selectionMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return NextResponse.json({
      success: true,
      ngoOfTheMonth: winner ? { ...winner, _id: winner._id?.toString() } : null,
      scoreBreakdown,
      selectionMonth,
      isManualOverride,
      ...(includeCandidates && {
        candidates: scored.slice(0, 5).map(s => ({
          ...s.ngo,
          _id: s.ngo._id?.toString(),
          scoreBreakdown: s.scoreBreakdown,
        })),
      }),
    });
  } catch (error: any) {
    console.error('Error fetching NGO of the Month:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch NGO of the Month', details: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/ngos/month — Admin manual crown
 * Body: { ngoId: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ngoId } = body as { ngoId: string };
    if (!ngoId) return NextResponse.json({ success: false, error: 'ngoId is required' }, { status: 400 });

    const { db } = await connectToDatabase();
    await db.collection('ngos').updateMany(
      { isManualOverride: true },
      { $set: { isNGOOfTheMonth: false, isManualOverride: false } }
    );

    let result = await db.collection('ngos').updateOne(
      { id: ngoId },
      { $set: { isNGOOfTheMonth: true, isManualOverride: true, manualOverrideDate: new Date() } }
    );

    if (result.matchedCount === 0) {
      try {
        result = await db.collection('ngos').updateOne(
          { _id: new ObjectId(ngoId) },
          { $set: { isNGOOfTheMonth: true, isManualOverride: true, manualOverrideDate: new Date() } }
        );
      } catch {
        // ngoId was not a valid ObjectId — no further fallback needed
      }
    }

    return NextResponse.json({ success: true, message: 'NGO of the Month updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/ngos/month — Reset to auto-select (removes manual override)
 */
export async function DELETE() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('ngos').updateMany(
      { isManualOverride: true },
      { $set: { isNGOOfTheMonth: false, isManualOverride: false } }
    );
    return NextResponse.json({ success: true, message: 'Reset to auto-select' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
