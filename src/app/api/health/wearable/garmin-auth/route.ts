import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GET /api/health/wearable/garmin-auth
// Initiates Garmin Health API OAuth 1.0a flow.
// Step 1: get request token → Step 2: redirect user to Garmin auth page.

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
  const consumerKey    = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return NextResponse.json({ error: 'Garmin integration not configured. Add GARMIN_CONSUMER_KEY and GARMIN_CONSUMER_SECRET to .env.local.' }, { status: 503 });
  }

  const origin      = req.nextUrl.origin;
  const callbackUrl = `${origin}/api/health/wearable/garmin-callback`;
  const requestTokenUrl = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';

  const oauthParams: Record<string, string> = {
    oauth_callback:         callbackUrl,
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_version:          '1.0',
  };

  oauthParams.oauth_signature = signRequest('POST', requestTokenUrl, oauthParams, consumerSecret);

  try {
    const tokenRes = await fetch(requestTokenUrl, {
      method:  'POST',
      headers: { Authorization: buildOAuthHeader(oauthParams) },
    });

    if (!tokenRes.ok) {
      console.error('[Garmin] request token failed:', await tokenRes.text());
      return NextResponse.redirect(`${origin}/health/wellness?wearable_error=garmin_request_token`);
    }

    const body = await tokenRes.text();
    const parsed = Object.fromEntries(new URLSearchParams(body));
    const requestToken       = parsed.oauth_token;
    const requestTokenSecret = parsed.oauth_token_secret;

    if (!requestToken) {
      return NextResponse.redirect(`${origin}/health/wellness?wearable_error=garmin_no_token`);
    }

    const authUrl = `https://connect.garmin.com/oauthConfirm?oauth_token=${encodeURIComponent(requestToken)}`;
    const res = NextResponse.redirect(authUrl);
    res.cookies.set('garmin_request_token_secret', requestTokenSecret, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   600,
      path:     '/',
    });
    res.cookies.set('garmin_request_token', requestToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   600,
      path:     '/',
    });
    return res;
  } catch (err) {
    console.error('[Garmin] auth error:', err);
    return NextResponse.redirect(`${origin}/health/wellness?wearable_error=garmin_server`);
  }
}
