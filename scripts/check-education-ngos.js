/**
 * check-education-ngos.js — Audits the educationResources collection
 * for NGO-tagged documents. Run: node scripts/check-education-ngos.js
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'vet1stop');
    const col = db.collection('educationResources');

    const total = await col.countDocuments();
    console.log(`\nTotal educationResources: ${total}`);

    const bySub = await col.aggregate([
      { $group: { _id: '$subcategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();
    console.log('\nBy subcategory:');
    bySub.forEach(r => console.log(`  ${r._id ?? 'null'}: ${r.count}`));

    const ngoCount = await col.countDocuments({ subcategory: 'ngo' });
    console.log(`\nNGO docs: ${ngoCount}`);

    if (ngoCount > 0) {
      const samples = await col.find({ subcategory: 'ngo' }).limit(5).toArray();
      console.log('\nFirst 5 NGO docs:');
      samples.forEach(r => {
        console.log(`  - ${r.title} | tags: [${(r.tags || []).slice(0, 4).join(', ')}]`);
      });
    } else {
      console.log('\nNo NGO docs found. Listing all distinct subcategory values:');
      const allSubs = await col.distinct('subcategory');
      console.log('  ', allSubs);
    }

  } finally {
    await client.close();
  }
}

run().catch(console.error);
