// @ts-nocheck
// Phase 1 + 1.5 feedback framework skeleton — data-ready Day 1 per Living Master MD Section 2 ★ — Strike 2 March 2026

/**
 * MongoDB Ratings Collection Schema
 *
 * Collection: "ratings" in the vet1stop database.
 * Zero PII: userId is a SHA-256 hash, sessionId is anonymized.
 * Post-launch team extends this with aggregation pipelines, admin views, and RAG feedback loops.
 */

// ─── Collection name constant ────────────────────────────────────────────────
export const RATINGS_COLLECTION = 'ratings';

// ─── TypeScript interfaces ───────────────────────────────────────────────────

export interface RatingDocument {
  /** Unique identifier for the resource being rated (matches resource card id / title slug) */
  resourceId: string;

  /** 1–5 star rating (optional — user may only give thumbs) */
  rating: number | null;

  /** Thumbs up or down (optional — user may only give stars) */
  thumbs: 'up' | 'down' | null;

  /** ISO-8601 timestamp of when the rating was submitted */
  timestamp: string;

  /** SHA-256 hashed userId — zero PII stored */
  userId: string;

  /** Anonymized session identifier (hashed) */
  sessionId: string;

  /** Which resource track the card belongs to (va / ngo / state) */
  track?: string;

  /** Page context where the rating was submitted */
  source?: string;
}

// ─── MongoDB JSON Schema Validator (for createCollection) ────────────────────
// Use this when bootstrapping the collection in a migration/seed script.

export const RATINGS_JSON_SCHEMA = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['resourceId', 'timestamp', 'userId', 'sessionId'],
    properties: {
      resourceId: {
        bsonType: 'string',
        description: 'Unique identifier for the rated resource',
      },
      rating: {
        bsonType: ['int', 'double', 'null'],
        minimum: 1,
        maximum: 5,
        description: 'Star rating 1–5 or null if only thumbs given',
      },
      thumbs: {
        enum: ['up', 'down', null],
        description: 'Thumbs up/down or null if only stars given',
      },
      timestamp: {
        bsonType: 'string',
        description: 'ISO-8601 timestamp',
      },
      userId: {
        bsonType: 'string',
        description: 'SHA-256 hashed user identifier — zero PII',
      },
      sessionId: {
        bsonType: 'string',
        description: 'Anonymized session identifier',
      },
      track: {
        bsonType: ['string', 'null'],
        description: 'Resource track: va, ngo, or state',
      },
      source: {
        bsonType: ['string', 'null'],
        description: 'Page context where rating was submitted',
      },
    },
  },
};

// ─── Index recommendations (run once via migration script) ───────────────────
// db.ratings.createIndex({ resourceId: 1, timestamp: -1 })
// db.ratings.createIndex({ userId: 1 })
// db.ratings.createIndex({ track: 1 })
