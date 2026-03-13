/**
 * Revert wrongly added benefits/claims tags from resources that matched the
 * broad /REE/i regex (Freedom Sings USA, Freedom Alliance, Green Beret Foundation).
 * REE Medical and TRICARE are intentionally kept.
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri    = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';

const WRONG_TITLES = ['Freedom Sings USA', 'Freedom Alliance', 'Green Beret Foundation'];
const TAGS_TO_REMOVE = ['benefits', 'claims assistance', 'claims', 'vso', 'disability claims'];

async function run() {
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const coll = client.db(dbName).collection('healthResources');

    for (const title of WRONG_TITLES) {
      const before = await coll.findOne({ title });
      if (!before) { console.log(`Not found: "${title}"`); continue; }

      const result = await coll.updateOne(
        { title },
        { $pull: { tags: { $in: TAGS_TO_REMOVE } } },
      );
      const after = await coll.findOne({ title });
      console.log(`Reverted "${title}": modified=${result.modifiedCount}`);
      console.log(`  tags now: [${(after?.tags ?? []).join(', ')}]`);
    }
    console.log('\nDone.');
  } finally {
    await client.close();
  }
}
run().catch(console.error);
