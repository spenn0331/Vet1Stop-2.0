// Strike 5 — AI-assisted tag enrichment for sparse healthResources docs
// Usage: node scripts/enrich-resource-tags.js [--write] [--domain health]
// Default: dry-run (prints proposed changes, does NOT write to DB)
// --write: commit enriched tags to MongoDB
// --domain: which collection to enrich (default: health)
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const WRITE_MODE = process.argv.includes('--write');
const DOMAIN_ARG = process.argv.find(a => a.startsWith('--domain='))?.split('=')[1] ?? 'health';
const MIN_TAGS = 3;

const COLLECTION_MAP = {
  health:    'healthResources',
  education: 'educationResources',
  life:      'lifeLeisureResources',
};

const uri    = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';
const xaiKey = process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY;

async function generateTags(title, description) {
  if (!xaiKey) {
    console.warn('[EnrichTags] No GROK_API_KEY found — cannot generate AI tags');
    return [];
  }
  const prompt = `You are a veteran resource database tagger. Given the title and description of a veteran resource, return ONLY a JSON array of 5-10 lowercase string tags that accurately describe the resource's purpose. No explanations, no markdown, just the array.\n\nTitle: "${title}"\nDescription: "${description}"`;
  try {
    const resp = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${xaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]).filter(t => typeof t === 'string').slice(0, 10);
  } catch (err) {
    console.error('[EnrichTags] Grok call failed:', err.message);
    return [];
  }
}

async function run() {
  if (!uri) { console.error('MONGODB_URI not set in .env.local'); process.exit(1); }
  const collectionName = COLLECTION_MAP[DOMAIN_ARG];
  if (!collectionName) { console.error(`Unknown domain: ${DOMAIN_ARG}`); process.exit(1); }

  console.log(`\n====== Tag Enrichment ${WRITE_MODE ? '(WRITE MODE)' : '(DRY RUN — use --write to commit)'} ======`);
  console.log(`Domain: ${DOMAIN_ARG} → Collection: ${collectionName}`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const coll = client.db(dbName).collection(collectionName);
    const total = await coll.countDocuments();

    // Find docs that need enrichment
    const sparseDocs = await coll.find({
      $or: [
        { tags: { $exists: false } },
        { tags: { $size: 0 } },
        { $expr: { $lt: [{ $size: { $ifNull: ['$tags', []] } }, MIN_TAGS] } },
      ],
    }).project({ _id: 1, title: 1, description: 1, tags: 1 }).toArray();

    console.log(`Total docs: ${total}`);
    console.log(`Docs needing enrichment (< ${MIN_TAGS} tags): ${sparseDocs.length}`);

    if (sparseDocs.length === 0) {
      console.log('\n✅ All docs have sufficient tags. No enrichment needed.');
      return;
    }

    let enriched = 0;
    let failed = 0;

    for (const doc of sparseDocs) {
      console.log(`\n[${doc._id}] "${doc.title}"`);
      console.log(`  Current tags: ${JSON.stringify(doc.tags ?? [])}`);

      const newTags = await generateTags(doc.title, doc.description);
      if (newTags.length === 0) {
        console.log('  ⚠ No tags generated (API issue or no key)');
        failed++;
        continue;
      }

      // Merge with existing tags (deduplicated)
      const merged = [...new Set([...(doc.tags ?? []), ...newTags])];
      console.log(`  Proposed tags: ${JSON.stringify(merged)}`);

      if (WRITE_MODE) {
        await coll.updateOne(
          { _id: doc._id },
          { $set: { tags: merged, updatedAt: new Date() } },
        );
        console.log('  ✅ Written to DB');
        enriched++;
      } else {
        console.log('  (dry run — not written)');
        enriched++;
      }

      // Rate limit: 200ms between calls to avoid API throttling
      await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n====== Summary ======`);
    console.log(`Processed: ${sparseDocs.length} docs`);
    console.log(`Enriched:  ${enriched}`);
    console.log(`Failed:    ${failed}`);
    if (!WRITE_MODE) {
      console.log('\nRun with --write to commit changes to MongoDB.');
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
