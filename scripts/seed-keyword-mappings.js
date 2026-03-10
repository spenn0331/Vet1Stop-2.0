// Strike 5 — Seed keywordMappings collection in MongoDB
// Migrates KEYWORD_TAG_MAP from resources-scoring.ts into a DB-managed collection.
// Usage: node scripts/seed-keyword-mappings.js [--dry-run]
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const DRY_RUN = process.argv.includes('--dry-run');
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';

// ─── Keyword mappings ──────────────────────────────────────────────────────────
// Each entry: condition keyword → related terms for fuzzy DB matching
// domain: 'health' | 'education' | 'life' (for future Education/Life pages)

const KEYWORD_MAPPINGS = [
  // ── Health domain ────────────────────────────────────────────────────────────
  { keyword: 'back pain',     domain: 'health',    relatedTerms: ['back', 'spine', 'lumbar', 'musculoskeletal', 'chronic pain', 'pain management', 'physical therapy', 'adaptive sports', 'yoga'] },
  { keyword: 'ptsd',          domain: 'health',    relatedTerms: ['ptsd', 'trauma', 'mental health', 'anxiety', 'stress', 'peer support', 'counseling', 'veteran mental health'] },
  { keyword: 'weight loss',   domain: 'health',    relatedTerms: ['weight', 'fitness', 'nutrition', 'wellness', 'exercise', 'adaptive fitness', 'yoga', 'lifestyle'] },
  { keyword: 'tinnitus',      domain: 'health',    relatedTerms: ['tinnitus', 'hearing', 'audiology', 'hearing loss'] },
  { keyword: 'sleep apnea',   domain: 'health',    relatedTerms: ['sleep', 'sleep apnea', 'respiratory', 'chronic conditions'] },
  { keyword: 'depression',    domain: 'health',    relatedTerms: ['depression', 'mental health', 'counseling', 'peer support', 'wellness'] },
  { keyword: 'anxiety',       domain: 'health',    relatedTerms: ['anxiety', 'mental health', 'stress', 'counseling', 'peer support'] },
  { keyword: 'chronic pain',  domain: 'health',    relatedTerms: ['chronic pain', 'pain management', 'physical therapy', 'adaptive sports', 'musculoskeletal'] },
  { keyword: 'diabetes',      domain: 'health',    relatedTerms: ['diabetes', 'metabolic', 'nutrition', 'wellness', 'chronic conditions'] },
  { keyword: 'tbi',           domain: 'health',    relatedTerms: ['tbi', 'traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation'] },
  { keyword: 'substance use', domain: 'health',    relatedTerms: ['substance', 'alcohol', 'recovery', 'peer support', 'rehabilitation'] },
  { keyword: 'fitness',       domain: 'health',    relatedTerms: ['fitness', 'exercise', 'adaptive sports', 'yoga', 'wellness', 'nutrition'] },
  { keyword: 'grants',        domain: 'health',    relatedTerms: ['grant', 'financial assistance', 'benefits', 'funding'] },
  { keyword: 'peer',          domain: 'health',    relatedTerms: ['peer', 'peer support', 'peer-led', 'veteran community'] },
  { keyword: 'knee pain',     domain: 'health',    relatedTerms: ['knee', 'joint', 'orthopedic', 'musculoskeletal', 'physical therapy', 'adaptive sports'] },
  { keyword: 'sleep',         domain: 'health',    relatedTerms: ['sleep', 'insomnia', 'sleep apnea', 'rest', 'fatigue'] },
  { keyword: 'mental health', domain: 'health',    relatedTerms: ['mental health', 'ptsd', 'depression', 'anxiety', 'counseling', 'peer support', 'wellness'] },
  { keyword: 'mst',           domain: 'health',    relatedTerms: ['mst', 'military sexual trauma', 'sexual assault', 'trauma', 'counseling'] },
  { keyword: 'women veterans',domain: 'health',    relatedTerms: ['women', 'female veteran', 'women veterans', 'mst'] },

  // ── Education domain (for Strike 6 GI Bill Pathfinder) ──────────────────────
  { keyword: 'gi bill',          domain: 'education', relatedTerms: ['gi bill', 'chapter 33', 'chapter 30', 'tuition assistance', 'education benefit', 'montgomery gi bill'] },
  { keyword: 'vocational',       domain: 'education', relatedTerms: ['vocational', 'vr&e', 'vocational rehab', 'chapter 31', 'skills training', 'apprenticeship'] },
  { keyword: 'college',          domain: 'education', relatedTerms: ['college', 'university', 'degree', 'bachelor', 'associate', 'campus'] },
  { keyword: 'scholarship',      domain: 'education', relatedTerms: ['scholarship', 'grant', 'fellowship', 'financial aid', 'tuition waiver'] },
  { keyword: 'stem',             domain: 'education', relatedTerms: ['stem', 'science', 'technology', 'engineering', 'math', 'coding', 'computer science'] },
  { keyword: 'certification',    domain: 'education', relatedTerms: ['certification', 'certificate', 'credential', 'license', 'trade school'] },
  { keyword: 'online learning',  domain: 'education', relatedTerms: ['online', 'remote learning', 'distance education', 'virtual', 'e-learning'] },

  // ── Life & Leisure domain (for Strike 7 Home Base) ──────────────────────────
  { keyword: 'housing',          domain: 'life', relatedTerms: ['housing', 'home', 'apartment', 'va loan', 'mortgage', 'hud-vash', 'rental'] },
  { keyword: 'relocation',       domain: 'life', relatedTerms: ['relocation', 'moving', 'pcs', 'transition', 'home base'] },
  { keyword: 'recreation',       domain: 'life', relatedTerms: ['recreation', 'mwr', 'outdoor', 'sports', 'fishing', 'hunting', 'parks', 'adventure'] },
  { keyword: 'financial',        domain: 'life', relatedTerms: ['financial', 'money', 'debt', 'bankruptcy', 'budget', 'tax', 'scra'] },
  { keyword: 'legal',            domain: 'life', relatedTerms: ['legal', 'law', 'attorney', 'scra', 'mla', 'contract', 'rights'] },
  { keyword: 'caregiver',        domain: 'life', relatedTerms: ['caregiver', 'family', 'spouse', 'dependent', 'respite', 'support'] },
  { keyword: 'va loan',          domain: 'life', relatedTerms: ['va loan', 'mortgage', 'home purchase', 'refinance', 'homebuying'] },
];

async function run() {
  if (!uri) { console.error('MONGODB_URI not set in .env.local'); process.exit(1); }

  console.log(`\n====== Keyword Mappings Seed ${DRY_RUN ? '(DRY RUN)' : ''} ======`);
  console.log(`Total entries to seed: ${KEYWORD_MAPPINGS.length}`);

  if (DRY_RUN) {
    console.log('\nSample entries:');
    KEYWORD_MAPPINGS.slice(0, 3).forEach(m => console.log(`  [${m.domain}] "${m.keyword}" → [${m.relatedTerms.join(', ')}]`));
    console.log('\nDry run complete. Run without --dry-run to write to DB.');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const coll = client.db(dbName).collection('keywordMappings');

    // Drop existing docs for clean reseed
    const existing = await coll.countDocuments();
    if (existing > 0) {
      console.log(`Found ${existing} existing mappings — clearing for reseed...`);
      await coll.deleteMany({});
    }

    const now = new Date();
    const docs = KEYWORD_MAPPINGS.map(m => ({
      ...m,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await coll.insertMany(docs);
    console.log(`✅ Inserted ${result.insertedCount} keyword mapping documents`);

    // Create index for fast domain lookups
    await coll.createIndex({ domain: 1 }, { name: 'idx_domain' });
    await coll.createIndex({ keyword: 1, domain: 1 }, { unique: true, name: 'idx_keyword_domain' });
    console.log('✅ Indexes created: idx_domain, idx_keyword_domain');

    // Verify
    const healthCount = await coll.countDocuments({ domain: 'health' });
    const educationCount = await coll.countDocuments({ domain: 'education' });
    const lifeCount = await coll.countDocuments({ domain: 'life' });
    console.log(`\nBreakdown: health=${healthCount} education=${educationCount} life=${lifeCount}`);
    console.log('\n====== Seed Complete ======');
  } finally {
    await client.close();
  }
}

run().catch(console.error);
