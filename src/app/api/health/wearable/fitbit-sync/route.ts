import { NextRequest, NextResponse } from 'next/server';
import type { WearableData } from '@/types/wellness';

// POST /api/health/wearable/fitbit-sync
// Client sends { accessToken } — server proxies to Fitbit API and returns WearableData.
// Token is never stored server-side.

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 400 });

    const headers = { Authorization: `Bearer ${accessToken}` };
    const today   = new Date().toISOString().split('T')[0];

    const [sleepRes, heartRes, activityRes] = await Promise.allSettled([
      fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${today}.json`, { headers }),
      fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${today}/1d.json`, { headers }),
      fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, { headers }),
    ]);

    let sleepDurationMin: number | null = null;
    let sleepEfficiency:  number | null = null;
    let restingHR:        number | null = null;
    let steps:            number | null = null;
    let activeMinutes:    number | null = null;

    if (sleepRes.status === 'fulfilled' && sleepRes.value.ok) {
      const d = await sleepRes.value.json();
      const summary = d?.summary;
      if (summary) {
        sleepDurationMin = summary.totalMinutesAsleep ?? null;
        sleepEfficiency  = d?.sleep?.[0]?.efficiency ?? null;
      }
    }

    if (heartRes.status === 'fulfilled' && heartRes.value.ok) {
      const d = await heartRes.value.json();
      restingHR = d?.['activities-heart']?.[0]?.value?.restingHeartRate ?? null;
    }

    if (activityRes.status === 'fulfilled' && activityRes.value.ok) {
      const d = await activityRes.value.json();
      steps         = d?.summary?.steps ?? null;
      activeMinutes = (d?.summary?.fairlyActiveMinutes ?? 0) + (d?.summary?.veryActiveMinutes ?? 0);
    }

    const result: WearableData = {
      platform:         'fitbit',
      date:             today,
      sleepDurationMin,
      sleepEfficiency,
      restingHR,
      hrv:              null,
      steps,
      activeMinutes,
      syncedAt:         new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Fitbit sync]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
