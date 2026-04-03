// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GET /api/health/wearable/garmin-callback
// Exchanges oauth_verifier + request token for access token.

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

function signRequest(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret = '',
): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&');
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return hmacSha1(signingKey, baseString);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const oauthToken    = searchParams.get('oauth_token');
  const oauthVerifier = searchParams.get('oauth_verifier');
  const origin        = req.nextUrl.origin;
  const wellnessUrl   = `${origin}/health/wellness`;

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=garmin_missing_verifier`);
  }

  const consumerKey         = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret      = process.env.GARMIN_CONSUMER_SECRET;
  const requestToken        = req.cookies.get('garmin_request_token')?.value;
  const requestTokenSecret  = req.cookies.get('garmin_request_token_secret')?.value;

  if (!consumerKey || !consumerSecret || !requestTokenSecret) {
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=garmin_config`);
  }

  const accessTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';

  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_token:            oauthToken,
    oauth_verifier:         oauthVerifier,
    oauth_version:          '1.0',
  };

  oauthParams.oauth_signature = signRequest('POST', accessTokenUrl, oauthParams, consumerSecret, requestTokenSecret);

  try {
    const tokenRes = await fetch(accessTokenUrl, {
      method:  'POST',
      headers: { Authorization: buildOAuthHeader(oauthParams) },
    });

    if (!tokenRes.ok) {
      console.error('[Garmin] access token failed:', await tokenRes.text());
      return NextResponse.redirect(`${wellnessUrl}?wearable_error=garmin_access_token`);
    }

    const body   = await tokenRes.text();
    const parsed = Object.fromEntries(new URLSearchParams(body));
    const accessToken       = parsed.oauth_token;
    const accessTokenSecret = parsed.oauth_token_secret;

    if (!accessToken) {
      return NextResponse.redirect(`${wellnessUrl}?wearable_error=garmin_no_access_token`);
    }

    // Garmin tokens don't expire — use a far-future timestamp
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;

    const hash = new URLSearchParams({
      platform:      'garmin',
      access_token:  accessToken,
      refresh_token: accessTokenSecret,
      expires_at:    String(expiresAt),
    }).toString();

    const res = NextResponse.redirect(`${wellnessUrl}#${hash}`);
    res.cookies.delete('garmin_request_token');
    res.cookies.delete('garmin_request_token_secret');
    return res;
  } catch (err) {
    console.error('[Garmin] callback error:', err);
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=garmin_server`);
  }
}
