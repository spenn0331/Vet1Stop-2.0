/**
 * create-health-text-index.js
 *
 * One-time script to create a compound weighted text index on the
 * healthResources collection. Enables $text search with relevance
 * scoring in /api/health/browse instead of full-collection regex scans.
 *
 * Run once from the project root:
 *   node scripts/create-health-text-index.js
 *
 * Safe to re-run — MongoDB ignores duplicate index creation if the
 * index already exists with the same spec.
 */

const { MongoClient } = require('mongodb');

// Load .env.local if present (Next.js convention)
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // dotenv not installed — fine, we fall back to the hardcoded URI below
}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const DB_NAME    = 'vet1stop';
const COLLECTION = 'healthResources';

async function createIndex() {
  console.log('[TextIndex] Connecting to MongoDB Atlas…');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('[TextIndex] Connected ✓');

    const db  = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    // List existing indexes so the user can see what's already there
    const existing = await col.indexes();
    const existingNames = existing.map(i => i.name);
    console.log('[TextIndex] Existing indexes:', existingNames.join(', ') || 'none');

    if (existingNames.includes('health_text_search')) {
      console.log('[TextIndex] ⚠  Index "health_text_search" already exists — skipping creation.');
      return;
    }

    // MongoDB only allows ONE text index per collection.
    // Drop any existing text index before creating the weighted version.
    const existingTextIndex = existing.find(i => i.key && i.key._fts === 'text');
    if (existingTextIndex) {
      console.log(`[TextIndex] Dropping existing text index: "${existingTextIndex.name}"…`);
      await col.dropIndex(existingTextIndex.name);
      console.log('[TextIndex] Old index dropped ✓');
    }

    // Weighted compound text index:
    //   title       weight 10 — exact or close title match is most valuable
    //   description weight  5 — descriptive copy matters for keyword discovery
    //   tags        weight  3 — tags are curated but lower signal than title
    const result = await col.createIndex(
      {
        title:       'text',
        description: 'text',
        tags:        'text',
      },
      {
        name:    'health_text_search',
        weights: { title: 10, description: 5, tags: 3 },
        // default_language allows standard English stop-word removal
        default_language: 'english',
      },
    );

    console.log(`[TextIndex] ✅ Index created: "${result}"`);
    console.log('[TextIndex] Full-text search is now active on healthResources.');
    console.log('[TextIndex] The /api/health/browse route will use relevance scoring automatically.');

  } catch (err) {
    console.error('[TextIndex] ❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('[TextIndex] Connection closed.');
  }
}

createIndex();
