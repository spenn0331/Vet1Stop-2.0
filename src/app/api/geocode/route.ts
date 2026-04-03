// @ts-nocheck
/**
 * /api/geocode — server-side Nominatim reverse-geocode proxy.
 * Browser fetch can't set User-Agent (stripped for security), so Nominatim
 * returns 400. This proxy adds the required header server-side.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon || isNaN(Number(lat)) || isNaN(Number(lon))) {
    return NextResponse.json({ error: 'Valid lat and lon required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=5`,
      {
        headers: {
          'User-Agent': 'Vet1Stop/1.0 (vet1stop.app)',
          'Accept-Language': 'en',
          'Accept': 'application/json',
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Nominatim ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
