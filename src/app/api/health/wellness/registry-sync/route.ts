// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { NvwiCohortUpdate } from '@/types/wellness';

// POST /api/health/wellness/registry-sync
// Receives an anonymized cohort update from an opted-in user.
// Uses MongoDB $inc to add to cohort aggregates — no individual records stored.

export async function POST(req: NextRequest) {
  try {
    const body: NvwiCohortUpdate = await req.json();

    const { cohort_week, era, branch, age_decade, region, scores, wearable_metrics } = body;

    if (!cohort_week || !scores) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const col = db.collection('nvwi_cohorts');

    const filter = { cohort_week, era, branch, age_decade, region };

    const incFields: Record<string, number> = {
      n_count: 1,
      'scores.mood.sum':    scores.mood.sum,
      'scores.mood.count':  scores.mood.count,
      'scores.energy.sum':  scores.energy.sum,
      'scores.energy.count': scores.energy.count,
      'scores.sleep.sum':   scores.sleep.sum,
      'scores.sleep.count': scores.sleep.count,
      'scores.pain.sum':    scores.pain.sum,
      'scores.pain.count':  scores.pain.count,
      'scores.social.sum':  scores.social.sum,
      'scores.social.count': scores.social.count,
    };

    if (wearable_metrics) {
      incFields['wearable_metrics.hrv_sum']            = wearable_metrics.hrv_sum;
      incFields['wearable_metrics.hrv_count']          = wearable_metrics.hrv_count;
      incFields['wearable_metrics.sleep_duration_sum'] = wearable_metrics.sleep_duration_sum;
      incFields['wearable_metrics.sleep_count']        = wearable_metrics.sleep_count;
      incFields['wearable_metrics.resting_hr_sum']     = wearable_metrics.resting_hr_sum;
      incFields['wearable_metrics.resting_hr_count']   = wearable_metrics.resting_hr_count;
    }

    await col.updateOne(
      filter,
      {
        $inc: incFields,
        $set: { last_updated: new Date() },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[NVWI] registry-sync error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
