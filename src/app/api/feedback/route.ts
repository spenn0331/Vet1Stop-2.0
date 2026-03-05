// Phase 1 + 1.5 feedback framework skeleton — data-ready Day 1 per Living Master MD Section 2 ★ — Strike 2 March 2026

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { RATINGS_COLLECTION, type RatingDocument } from '@/lib/feedback/ratingsSchema';

/**
 * POST /api/feedback
 *
 * Logs anonymized resource ratings (thumbs + stars) to MongoDB.
 * Zero PII: userId and sessionId are SHA-256 hashed before storage.
 * No auth required for MVP — returns 200 immediately.
 * Post-launch team extends with rate-limiting, aggregation, and admin views.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashValue(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function generateAnonymousId(): string {
  return hashValue(`anon-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

// ─── Validation ──────────────────────────────────────────────────────────────

interface FeedbackPayload {
  resourceId: string;
  rating?: number | null;
  thumbs?: 'up' | 'down' | null;
  track?: string;
  source?: string;
  userId?: string;
  sessionId?: string;
}

function validatePayload(body: FeedbackPayload): string | null {
  if (!body.resourceId || typeof body.resourceId !== 'string') {
    return 'resourceId is required and must be a string';
  }

  if (body.rating !== undefined && body.rating !== null) {
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return 'rating must be a number between 1 and 5';
    }
  }

  if (body.thumbs !== undefined && body.thumbs !== null) {
    if (body.thumbs !== 'up' && body.thumbs !== 'down') {
      return 'thumbs must be "up" or "down"';
    }
  }

  // At least one feedback signal required
  if ((body.rating === undefined || body.rating === null) &&
      (body.thumbs === undefined || body.thumbs === null)) {
    return 'At least one of rating or thumbs is required';
  }

  return null;
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: FeedbackPayload = await request.json();

    // Validate
    const error = validatePayload(body);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Hash PII — zero personal data stored
    const hashedUserId = body.userId
      ? hashValue(body.userId)
      : generateAnonymousId();

    const hashedSessionId = body.sessionId
      ? hashValue(body.sessionId)
      : generateAnonymousId();

    // Build document
    const doc: RatingDocument = {
      resourceId: body.resourceId,
      rating: body.rating ?? null,
      thumbs: body.thumbs ?? null,
      timestamp: new Date().toISOString(),
      userId: hashedUserId,
      sessionId: hashedSessionId,
      track: body.track ?? undefined,
      source: body.source ?? 'health',
    };

    // Write to MongoDB — fire and forget for speed, but await for reliability
    const { db } = await connectToDatabase();
    await db.collection(RATINGS_COLLECTION).insertOne(doc);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Feedback API] Error logging rating:', err);
    // Always return 200 to the user — feedback should never block UX
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
