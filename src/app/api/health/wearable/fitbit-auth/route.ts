import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GET /api/health/wearable/fitbit-auth
// Initiates Fitbit OAuth 2.0 PKCE flow.
// Stores code_verifier in httpOnly cookie, redirects to Fitbit authorization page.

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function GET(req: NextRequest) {
  const clientId = process.env.FITBIT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Fitbit integration not configured. Add FITBIT_CLIENT_ID to .env.local.' }, { status: 503 });
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/health/wearable/fitbit-callback`;

  // Generate PKCE code_verifier + code_challenge
  const codeVerifier  = base64urlEncode(crypto.randomBytes(48));
  const codeChallenge = base64urlEncode(
    crypto.createHash('sha256').update(codeVerifier).digest(),
  );
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id:             clientId,
    response_type:         'code',
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri:          redirectUri,
    scope:                 'sleep heartrate activity',
    state,
    expires_in:            '604800',
  });

  const authUrl = `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;

  const res = NextResponse.redirect(authUrl);
  res.cookies.set('fitbit_pkce_verifier', codeVerifier, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });
  res.cookies.set('fitbit_oauth_state', state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   600,
    path:     '/',
  });

  return res;
}
