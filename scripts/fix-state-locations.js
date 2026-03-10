/**
 * fix-state-locations.js
 * Sets location.state on all healthResources with subcategory='state'
 * by extracting the state name from the document title.
 *
 * Usage: node scripts/fix-state-locations.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const STATE_NAMES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
  'District of Columbia',
];

// Longest-first so "West Virginia" beats "Virginia"
STATE_NAMES.sort((a, b) => b.length - a.length);

function extractState(title) {
  for (const name of STATE_NAMES) {
    if (title.includes(name)) return name;
  }
  if (/CalVet/i.test(title)) return 'California';
  if (/DMVA/i.test(title))   return 'Pennsylvania';
  return null;
}

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db   = client.db(process.env.MONGODB_DB || 'vet1stop');
  const coll = db.collection('healthResources');

  const docs = await coll.find({ subcategory: 'state' }).toArray();
  console.log(`Found ${docs.length} state resources to update`);

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const state = extractState(doc.title ?? '');
    if (!state) {
      console.warn(`  ⚠ No state detected for: ${doc.title}`);
      skipped++;
      continue;
    }

    await coll.updateOne(
      { _id: doc._id },
      { $set: { 'location.state': state, 'location.region': 'State' } }
    );
    console.log(`  ✅ ${state} ← "${doc.title}"`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  await client.close();
}

run().catch(console.error);
