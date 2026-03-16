import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { WearableData } from '@/types/wellness';

// POST /api/health/wearable/garmin-sync
// Client sends { accessToken, tokenSecret } — server proxies to Garmin Health API.
// Garmin uses OAuth 1.0a for every signed request.

function hmacSha1(key: string, data: string): string {
  return crypto.createHmac('sha1', key).update(data).digest('base64');
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuthHeader(params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return 'OAuth ' + sorted.map(([k, v]) => `${k}="${percentEncode(v)}"`).join(', ');
}

function signedRequest(
  method: string,
  url: string,
  queryParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  tokenSecret: string,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  };

  const allParams = { ...queryParams, ...oauthParams };
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&');

  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  oauthParams.oauth_signature = hmacSha1(signingKey, baseString);

  return buildOAuthHeader(oauthParams);
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken, tokenSecret } = await req.json();
    if (!accessToken || !tokenSecret) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
    }

    const consumerKey    = process.env.GARMIN_CONSUMER_KEY;
    const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'Garmin not configured' }, { status: 503 });
    }

    const now   = Math.floor(Date.now() / 1000);
    const start = now - 86400;

    const dailyUrl    = 'https://healthapi.garmin.com/wellness-api/rest/dailies';
    const sleepUrl    = 'https://healthapi.garmin.com/wellness-api/rest/sleeps';
    const hrvUrl      = 'https://healthapi.garmin.com/wellness-api/rest/heartRateVariability';

    const timeQuery = { uploadStartTimeInSeconds: String(start), uploadEndTimeInSeconds: String(now) };

    const makeAuth = (url: string) => signedRequest('GET', url, timeQuery, consumerKey, consumerSecret, accessToken, tokenSecret);

    const queryStr = new URLSearchParams(timeQuery).toString();

    const [dailyRes, sleepRes, hrvRes] = await Promise.allSettled([
      fetch(`${dailyUrl}?${queryStr}`, { headers: { Authorization: makeAuth(dailyUrl) } }),
      fetch(`${sleepUrl}?${queryStr}`, { headers: { Authorization: makeAuth(sleepUrl) } }),
      fetch(`${hrvUrl}?${queryStr}`,   { headers: { Authorization: makeAuth(hrvUrl) } }),
    ]);

    let steps:            number | null = null;
    let activeMinutes:    number | null = null;
    let restingHR:        number | null = null;
    let sleepDurationMin: number | null = null;
    let sleepEfficiency:  number | null = null;
    let hrv:              number | null = null;

    if (dailyRes.status === 'fulfilled' && dailyRes.value.ok) {
      const d = await dailyRes.value.json();
      const summary = Array.isArray(d) ? d[0] : d;
      if (summary) {
        steps         = summary.totalSteps ?? null;
        activeMinutes = summary.activeTimeInSeconds != null ? Math.round(summary.activeTimeInSeconds / 60) : null;
        restingHR     = summary.averageHeartRateInBeatsPerMinute ?? null;
      }
    }

    if (sleepRes.status === 'fulfilled' && sleepRes.value.ok) {
      const d = await sleepRes.value.json();
      const s = Array.isArray(d) ? d[0] : d;
      if (s) {
        sleepDurationMin = s.sleepTimeSeconds != null ? Math.round(s.sleepTimeSeconds / 60) : null;
        sleepEfficiency  = s.overallSleepScore?.value ?? null;
      }
    }

    if (hrvRes.status === 'fulfilled' && hrvRes.value.ok) {
      const d = await hrvRes.value.json();
      const h = Array.isArray(d) ? d[0] : d;
      hrv = h?.lastNight?.avg ?? null;
    }

    const today  = new Date().toISOString().split('T')[0];
    const result: WearableData = {
      platform: 'garmin',
      date: today,
      sleepDurationMin,
      sleepEfficiency,
      restingHR,
      hrv,
      steps,
      activeMinutes,
      syncedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Garmin sync]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
