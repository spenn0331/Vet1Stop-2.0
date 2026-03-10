// Strike 5 — Quick tag coverage audit for healthResources collection
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';

async function run() {
  if (!uri) { console.error('MONGODB_URI not set in .env.local'); process.exit(1); }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const coll = client.db(dbName).collection('healthResources');
    const total = await coll.countDocuments();
    const noTags   = await coll.countDocuments({ $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }] });
    const sparse   = await coll.countDocuments({ tags: { $exists: true, $not: { $size: 0 } }, $expr: { $lt: [{ $size: '$tags' }, 3] } });
    const rich     = await coll.countDocuments({ $expr: { $gte: [{ $size: '$tags' }, 3] } });
    const hasState = await coll.countDocuments({ 'location.state': { $exists: true, $ne: '' } });
    const hasDate  = await coll.countDocuments({ updatedAt: { $exists: true } });
    const subcats  = await coll.aggregate([{ $group: { _id: '$subcategory', count: { $sum: 1 } } }]).toArray();

    // Sample a sparse doc
    const sparseSample = await coll.findOne({ $or: [{ tags: { $exists: false } }, { tags: { $size: 0 } }] }, { projection: { title: 1, tags: 1, description: 1, subcategory: 1 } });

    console.log('\n====== healthResources Tag Audit ======');
    console.log(`Total docs:         ${total}`);
    console.log(`No tags / empty:    ${noTags}  (${Math.round(noTags/total*100)}%)`);
    console.log(`Sparse (<3 tags):   ${sparse}  (${Math.round(sparse/total*100)}%)`);
    console.log(`Rich (>=3 tags):    ${rich}   (${Math.round(rich/total*100)}%)`);
    console.log(`Has location.state: ${hasState}`);
    console.log(`Has updatedAt:      ${hasDate}`);
    console.log('\nSubcategory breakdown:');
    subcats.forEach(s => console.log(`  ${s._id || 'null'}: ${s.count}`));
    if (sparseSample) {
      console.log('\nSample sparse doc:');
      console.log(`  title: ${sparseSample.title}`);
      console.log(`  subcategory: ${sparseSample.subcategory}`);
      console.log(`  tags: ${JSON.stringify(sparseSample.tags)}`);
      console.log(`  description (first 120 chars): ${String(sparseSample.description).slice(0, 120)}`);
    }
    console.log('\n====== Decision Gate ======');
    const enrichNeeded = noTags + sparse;
    const enrichPct = Math.round(enrichNeeded / total * 100);
    console.log(`Docs needing enrichment: ${enrichNeeded} (${enrichPct}%)`);
    if (enrichPct > 30) {
      console.log('⚠ ENRICHMENT NEEDED before engine extraction (>30% sparse)');
    } else {
      console.log('✅ Tag coverage acceptable — proceed with engine extraction');
    }
  } finally {
    await client.close();
  }
}
run().catch(console.error);
