/**
 * audit-education-ngo-tags.js — Shows all NGO docs and their tags
 * Run: node scripts/audit-education-ngo-tags.js
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

    const ngos = await col.find({ subcategory: 'ngo' }).toArray();
    console.log(`\n=== ${ngos.length} Education NGO Documents ===\n`);
    ngos.forEach((r, i) => {
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   tags: [${(r.tags || []).join(', ')}]`);
      console.log(`   desc: ${(r.description || '').substring(0, 80)}...`);
      console.log('');
    });

    // Show all unique tags across NGO docs
    const allTags = new Set();
    ngos.forEach(r => (r.tags || []).forEach(t => allTags.add(t.toLowerCase().trim())));
    console.log('=== All unique tags across NGO docs ===');
    console.log([...allTags].sort().join('\n'));

  } finally {
    await client.close();
  }
}

run().catch(console.error);
