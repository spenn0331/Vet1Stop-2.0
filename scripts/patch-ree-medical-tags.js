/**
 * Patch script: Add 'benefits', 'claims assistance', 'claims', 'vso' tags to REE Medical
 * so it appears in the "Benefits & Claims Help" filter on the Health Browse page.
 *
 * Usage:  node scripts/patch-ree-medical-tags.js
 *         node scripts/patch-ree-medical-tags.js --dry-run
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const DRY_RUN = process.argv.includes('--dry-run');
const uri     = process.env.MONGODB_URI;
const dbName  = process.env.MONGODB_DB || 'vet1stop';

const TAGS_TO_ADD = ['benefits', 'claims assistance', 'claims', 'vso', 'disability claims'];

async function run() {
  if (!uri) { console.error('MONGODB_URI not set in .env.local'); process.exit(1); }

  console.log(`\n====== REE Medical Tag Patch ${DRY_RUN ? '(DRY RUN)' : ''} ======`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const coll = client.db(dbName).collection('healthResources');

    // Find REE Medical by exact title (case-insensitive anchor) to avoid broad substring hits
    const matches = await coll.find({
      title: { $regex: '^REE Medical$', $options: 'i' },
    }).toArray();

    if (matches.length === 0) {
      console.log('No documents matching "REE" found in healthResources.');
      console.log('Checking ngos collection…');

      const ngosColl = client.db(dbName).collection('ngos');
      const ngoMatches = await ngosColl.find({ title: { $regex: 'REE', $options: 'i' } }).toArray();
      if (ngoMatches.length === 0) {
        console.log('Also not found in ngos. Exiting.');
        return;
      }
      console.log(`Found ${ngoMatches.length} match(es) in ngos:`, ngoMatches.map(d => d.title));
      return;
    }

    console.log(`\nFound ${matches.length} match(es):`);
    matches.forEach(doc => console.log(`  "${doc.title}"  current tags: [${(doc.tags ?? []).join(', ')}]`));

    if (DRY_RUN) {
      console.log(`\nWould add tags: [${TAGS_TO_ADD.join(', ')}]`);
      console.log('Dry run complete — no changes made.');
      return;
    }

    // For each match, $addToSet each new tag so existing tags are preserved
    for (const doc of matches) {
      const result = await coll.updateOne(
        { _id: doc._id },
        { $addToSet: { tags: { $each: TAGS_TO_ADD } } },
      );
      console.log(`\nUpdated "${doc.title}": matched=${result.matchedCount} modified=${result.modifiedCount}`);

      const updated = await coll.findOne({ _id: doc._id });
      console.log(`  New tags: [${(updated?.tags ?? []).join(', ')}]`);
    }

    console.log('\n====== Patch Complete ======');
  } finally {
    await client.close();
  }
}

run().catch(console.error);
