/**
 * enrich-education-ngo-tags.js
 * Adds meaningful tags to the 23 education NGO documents based on their
 * title/description content so the NGO tab filters in EducationBrowseSection work.
 * Run: node scripts/enrich-education-ngo-tags.js
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) { console.error('Missing MONGODB_URI'); process.exit(1); }

// Map each NGO title (substring match) → tags to ADD
// Tags must align with NGO_FILTERS values: scholarship, mentoring, career, women, stem, transition, free
const TAG_MAP = [
  { match: 'Pat Tillman',             tags: ['scholarship', 'merit-based', 'leadership', 'free'] },
  { match: 'Folds of Honor',          tags: ['scholarship', 'family', 'free'] },
  { match: 'VFW Sport Clips',         tags: ['scholarship', 'free'] },
  { match: 'American Legion Legacy',  tags: ['scholarship', 'family', 'free'] },
  { match: 'AMVETS',                  tags: ['scholarship', 'stem', 'free'] },
  { match: 'Veterans of Foreign Wars', tags: ['scholarship', 'free'] },
  { match: 'American Legion Education', tags: ['scholarship', 'family', 'benefits', 'free'] },
  { match: 'Fisher House',            tags: ['scholarship', 'family', 'free'] },
  { match: 'MOAA',                    tags: ['scholarship', 'family', 'benefits', 'free'] },
  { match: 'Veterans Forge',          tags: ['stem', 'tech', 'career', 'workforce', 'free'] },
  { match: 'Vets in Tech',            tags: ['stem', 'tech', 'career', 'workforce', 'free'] },
  { match: 'CareerKarma',             tags: ['career', 'tech', 'online', 'free', 'transition'] },
  { match: 'STEM Veterans',           tags: ['stem', 'tech', 'career', 'internship', 'free'] },
  { match: 'Solar Ready',             tags: ['career', 'workforce', 'vocational', 'transition', 'free'] },
  { match: 'Student Veterans',        tags: ['peer support', 'networking', 'higher education', 'free'] },
  { match: 'Service to School',       tags: ['mentoring', 'college prep', 'free', 'transition'] },
  { match: 'Disabled American Veterans', tags: ['benefits', 'disability', 'scholarship', 'free'] },
  { match: 'Wounded Warrior',         tags: ['scholarship', 'disability', 'benefits', 'free'] },
  { match: 'Operation Homefront',     tags: ['family', 'scholarship', 'free'] },
  { match: 'National Military Family', tags: ['family', 'scholarship', 'women', 'free'] },
  { match: 'American Corporate Partners', tags: ['mentoring', 'career', 'workforce', 'free'] },
  { match: 'Hire Our Heroes',         tags: ['mentoring', 'career', 'transition', 'free'] },
  { match: 'LinkedIn Learning',       tags: ['online', 'career', 'tech', 'free', 'certification'] },
];

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'vet1stop');
    const col = db.collection('educationResources');

    const ngos = await col.find({ subcategory: 'ngo' }).toArray();
    console.log(`Found ${ngos.length} NGO documents to enrich.\n`);

    let updated = 0;
    for (const doc of ngos) {
      const title = doc.title || '';
      const matchEntry = TAG_MAP.find(m => title.toLowerCase().includes(m.match.toLowerCase()));

      if (!matchEntry) {
        console.log(`  [SKIP] No match rule for: "${title}"`);
        continue;
      }

      const existingTags = (doc.tags || []).map(t => t.toLowerCase().trim());
      const newTags = matchEntry.tags.filter(t => !existingTags.includes(t));

      if (newTags.length === 0) {
        console.log(`  [OK] "${title}" already has all target tags.`);
        continue;
      }

      const mergedTags = [...(doc.tags || []), ...newTags];
      await col.updateOne(
        { _id: doc._id },
        { $set: { tags: mergedTags, updatedAt: new Date() } }
      );
      console.log(`  [UPDATED] "${title}"`);
      console.log(`    Added: [${newTags.join(', ')}]`);
      updated++;
    }

    console.log(`\nDone. Updated ${updated}/${ngos.length} documents.`);

    // Verify
    const allTags = new Set();
    const final = await col.find({ subcategory: 'ngo' }).toArray();
    final.forEach(r => (r.tags || []).forEach(t => allTags.add(t.toLowerCase().trim())));
    console.log('\nAll unique tags after enrichment:');
    console.log([...allTags].sort().join(', '));

  } finally {
    await client.close();
  }
}

run().catch(console.error);
