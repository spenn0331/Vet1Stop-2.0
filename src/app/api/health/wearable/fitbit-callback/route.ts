// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

// GET /api/health/wearable/fitbit-callback
// Exchanges the authorization code for tokens, then redirects back to
// /health/wellness with the token in the URL hash (kept out of server logs).

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const origin = req.nextUrl.origin;
  const wellnessUrl = `${origin}/health/wellness`;

  if (error || !code) {
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=access_denied`);
  }

  const storedState    = req.cookies.get('fitbit_oauth_state')?.value;
  const codeVerifier   = req.cookies.get('fitbit_pkce_verifier')?.value;
  const clientId       = process.env.FITBIT_CLIENT_ID;
  const clientSecret   = process.env.FITBIT_CLIENT_SECRET;
  const redirectUri    = `${origin}/api/health/wearable/fitbit-callback`;

  if (!codeVerifier || !clientId || !clientSecret) {
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=config`);
  }
  if (storedState && storedState !== state) {
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=state_mismatch`);
  }

  try {
    const body = new URLSearchParams({
      client_id:     clientId,
      grant_type:    'authorization_code',
      redirect_uri:  redirectUri,
      code,
      code_verifier: codeVerifier,
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[Fitbit] token exchange failed:', err);
      return NextResponse.redirect(`${wellnessUrl}?wearable_error=token_exchange`);
    }

    const data = await tokenRes.json();
    const expiresAt = Date.now() + (data.expires_in ?? 28800) * 1000;

    // Pass token back via URL hash — kept out of server access logs
    const hash = new URLSearchParams({
      platform:      'fitbit',
      access_token:  data.access_token,
      refresh_token: data.refresh_token ?? '',
      expires_at:    String(expiresAt),
    }).toString();

    const res = NextResponse.redirect(`${wellnessUrl}#${hash}`);
    res.cookies.delete('fitbit_pkce_verifier');
    res.cookies.delete('fitbit_oauth_state');
    return res;
  } catch (err) {
    console.error('[Fitbit] callback error:', err);
    return NextResponse.redirect(`${wellnessUrl}?wearable_error=server`);
  }
}
