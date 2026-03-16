/**
 * /api/education/browse — Public browse endpoint for the Education Hub page.
 * Queries the educationResources collection by subcategory (federal/ngo/state),
 * search term, tags, and pagination.
 *
 * Mirrors /api/health/browse exactly — same aggregation, synonym expansion,
 * and pagination logic. Only the collection name and synonym map differ.
 *
 * Optional Atlas text index for relevance ranking:
 *   { "title": "text", "description": "text", "tags": "text" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// ─── Education Synonym Map ────────────────────────────────────────────────────
// Maps realistic user search terms → actual database tags in educationResources.

const SYNONYM_MAP: Record<string, string[]> = {

  // ── GI Bill & VA Education Benefits ──────────────────────────────────────
  'gi bill':              ['post-9/11', 'chapter 33', 'montgomery', 'education benefit', 'tuition', 'housing allowance'],
  'post 9/11':            ['post-9/11', 'chapter 33', 'gi bill', 'tuition', 'bah', 'housing allowance'],
  'post-9/11':            ['chapter 33', 'gi bill', 'tuition', 'bah', 'housing allowance'],
  'chapter 33':           ['post-9/11', 'gi bill', 'tuition', 'housing allowance', 'education benefit'],
  'chapter 30':           ['montgomery', 'active duty', 'gi bill', 'education benefit'],
  'montgomery':           ['chapter 30', 'gi bill', 'active duty', 'education benefit'],
  'mha':                  ['housing allowance', 'bah', 'monthly stipend', 'post-9/11'],
  'housing allowance':    ['mha', 'bah', 'post-9/11', 'gi bill', 'monthly income'],
  'bah':                  ['housing allowance', 'mha', 'post-9/11', 'gi bill', 'stipend'],
  'education benefit':    ['gi bill', 'post-9/11', 'tuition', 'scholarship', 'chapter 33'],
  'tuition assistance':   ['tuition', 'federal', 'military', 'active duty', 'education benefit'],
  'yellow ribbon':        ['yellow ribbon program', 'tuition gap', 'private school', 'gi bill'],
  'tuition':              ['gi bill', 'tuition assistance', 'scholarship', 'education', 'yellow ribbon'],
  'free school':          ['yellow ribbon', 'scholarship', 'gi bill', 'tuition', 'free', 'no cost'],
  'free college':         ['yellow ribbon', 'scholarship', 'gi bill', 'tuition', 'free'],

  // ── VR&E / Vocational Rehabilitation ─────────────────────────────────────
  'voc rehab':            ['vr&e', 'chapter 31', 'vocational rehabilitation', 'disability', 'employment'],
  'vocational rehab':     ['vr&e', 'chapter 31', 'vocational', 'disability', 'employment'],
  'vr&e':                 ['vocational rehabilitation', 'chapter 31', 'disability', 'employment', 'retraining'],
  'chapter 31':           ['vr&e', 'vocational rehabilitation', 'disability', 'employment'],
  'retraining':           ['vr&e', 'vocational rehabilitation', 'career change', 'workforce', 'chapter 31'],
  'disability':           ['vr&e', 'chapter 31', 'adaptive', 'accommodations', 'disability services'],
  'career change':        ['vr&e', 'vocational rehabilitation', 'retraining', 'workforce', 'new career'],

  // ── Scholarships & Financial Aid ──────────────────────────────────────────
  'scholarship':          ['scholarship', 'award', 'grant', 'fellowship', 'financial aid', 'free'],
  'scholarships':         ['scholarship', 'award', 'grant', 'fellowship', 'financial aid'],
  'grant':                ['scholarship', 'grant', 'financial aid', 'award', 'free'],
  'fellowship':           ['scholarship', 'fellowship', 'graduate', 'research', 'award'],
  'financial aid':        ['scholarship', 'grant', 'fafsa', 'financial aid', 'free', 'need-based'],
  'fafsa':                ['financial aid', 'federal aid', 'need-based', 'pell grant', 'student aid'],
  'pell grant':           ['grant', 'federal aid', 'need-based', 'financial aid', 'fafsa'],
  'need-based':           ['need-based', 'scholarship', 'grant', 'financial aid', 'low income'],
  'merit':                ['merit-based', 'scholarship', 'academic', 'award', 'gpa'],
  'merit-based':          ['scholarship', 'academic achievement', 'award', 'gpa', 'merit'],
  'free':                 ['free', 'no cost', 'scholarship', 'grant', 'financial aid', 'yellow ribbon'],
  'no cost':              ['free', 'scholarship', 'grant', 'no cost', 'waiver'],
  'award':                ['scholarship', 'grant', 'fellowship', 'award', 'financial aid'],
  'women veterans':       ["women's scholarship", 'female veteran', 'women veterans', 'gender', 'award'],
  'female veteran':       ["women's scholarship", 'women veterans', 'award', 'scholarship'],
  'stem scholarship':     ['stem', 'science', 'technology', 'engineering', 'math', 'scholarship'],
  'undergraduate':        ['bachelor', 'undergraduate', 'four-year', 'degree', 'scholarship'],
  'graduate':             ['master', 'doctoral', 'graduate', 'advanced degree', 'fellowship'],

  // ── Degree Levels & Types ─────────────────────────────────────────────────
  'bachelors':            ['bachelor', "bachelor's", 'undergraduate', 'four-year degree', 'ba', 'bs'],
  "bachelor's":           ['bachelor', 'undergraduate', 'four-year', 'degree'],
  'bachelor':             ['undergraduate', 'four-year', 'ba', 'bs', 'degree'],
  'masters':              ['master', "master's", 'graduate', 'advanced degree', 'ms', 'ma', 'mba'],
  "master's":             ['master', 'graduate', 'advanced degree', 'ms', 'ma'],
  'master':               ['graduate', 'advanced degree', 'ms', 'ma', 'mba'],
  'doctorate':            ['doctoral', 'phd', 'research', 'graduate', 'advanced degree'],
  'phd':                  ['doctoral', 'doctorate', 'research', 'graduate', 'advanced degree'],
  'associate':            ["associate's", 'two-year', 'community college', 'degree'],
  'certificate':          ['certificate', 'certification', 'credential', 'vocational', 'professional'],
  'certification':        ['certificate', 'credential', 'professional cert', 'vocational', 'license'],
  'online':               ['online', 'distance learning', 'remote', 'virtual', 'e-learning'],
  'distance learning':    ['online', 'remote', 'virtual', 'e-learning', 'asynchronous'],

  // ── Subject Areas ─────────────────────────────────────────────────────────
  'stem':                 ['science', 'technology', 'engineering', 'mathematics', 'stem', 'research'],
  'cybersecurity':        ['cyber', 'information security', 'network security', 'it', 'stem', 'technology'],
  'cyber':                ['cybersecurity', 'information security', 'it', 'stem', 'technology', 'network'],
  'it':                   ['information technology', 'cybersecurity', 'computer science', 'technology', 'stem'],
  'information technology': ['it', 'cyber', 'computer science', 'technology', 'systems', 'stem'],
  'computer science':     ['it', 'software', 'programming', 'technology', 'stem', 'computer'],
  'engineering':          ['stem', 'civil', 'mechanical', 'electrical', 'aerospace', 'systems engineering'],
  'business':             ['business administration', 'mba', 'management', 'finance', 'marketing', 'leadership'],
  'mba':                  ['business', 'business administration', 'management', 'master', 'graduate'],
  'healthcare':           ['health sciences', 'nursing', 'medicine', 'medical', 'clinical', 'patient care'],
  'nursing':              ['health sciences', 'rn', 'bsn', 'healthcare', 'medical', 'patient care'],
  'medicine':             ['healthcare', 'pre-med', 'medical school', 'clinical', 'health sciences'],
  'law':                  ['legal', 'law school', 'jd', 'criminal justice', 'paralegal', 'attorney'],
  'criminal justice':     ['law', 'legal', 'law enforcement', 'criminology', 'homeland security'],
  'psychology':           ['mental health', 'counseling', 'behavioral science', 'social work', 'therapy'],
  'social work':          ['human services', 'psychology', 'counseling', 'community services'],
  'education':            ['teaching', 'teacher', 'k-12', 'higher education', 'curriculum', 'degree in education'],
  'aviation':             ['aviation management', 'flight', 'aerospace', 'pilot', 'avionics'],

  // ── Certifications & Vocational ───────────────────────────────────────────
  'vettec':               ['tech', 'information technology', 'coding', 'programming', 'training', 'vettec'],
  'apprenticeship':       ['on-the-job training', 'trade', 'vocational', 'workforce', 'earn while you learn'],
  'trade school':         ['vocational', 'technical', 'certification', 'apprenticeship', 'trade'],
  'coding bootcamp':      ['programming', 'software', 'it', 'tech', 'vettec', 'workforce'],
  'cdl':                  ['commercial driver', 'truck driving', 'logistics', 'transportation', 'trade'],
  'project management':   ['pmp', 'leadership', 'management', 'business', 'certification'],
  'pmp':                  ['project management', 'leadership', 'certification', 'business', 'professional'],

  // ── Dependent / Survivor Benefits ─────────────────────────────────────────
  'chapter 35':           ['survivors', 'dependents', 'dea', 'spouse', 'education benefit'],
  'dea':                  ['chapter 35', 'survivors', 'dependents', 'spouse', 'education benefit'],
  'dependents':           ['chapter 35', 'survivors', 'spouse', 'dea', 'family'],
  'spouse':               ['chapter 35', 'dea', 'mycaa', 'family', 'dependents', 'transferability'],
  'mycaa':                ['spouse', 'military spouse', 'career advancement', 'financial aid', 'education'],
  'transferability':      ['gi bill', 'spouse', 'dependents', 'transfer', 'family'],
  'transfer':             ['transferability', 'gi bill transfer', 'dependents', 'spouse'],

  // ── State & Institutional Programs ────────────────────────────────────────
  'state benefits':       ['state', 'tuition waiver', 'in-state', 'state aid', 'local'],
  'tuition waiver':       ['state', 'state benefits', 'in-state', 'free', 'scholarship'],
  'in-state':             ['state', 'in-state tuition', 'resident', 'tuition waiver'],
  'community college':    ['associate', 'two-year', 'trade', 'affordable', 'local'],

  // ── General Education & Career ────────────────────────────────────────────
  'career':               ['career development', 'workforce', 'employment', 'job training', 'education'],
  'workforce':            ['career', 'employment', 'job training', 'vr&e', 'workforce development'],
  'job training':         ['workforce', 'vr&e', 'vocational', 'career', 'retraining'],
  'transition':           ['separation', 'military to civilian', 'education transition', 'career change'],
  'military to civilian': ['transition', 'career change', 'education', 'workforce', 'retraining'],
  'mos translation':      ['mos', 'military skills', 'civilian equivalent', 'career', 'job search'],
  'military credit':      ['ace credit', 'clep', 'dsst', 'transfer credit', 'prior learning'],
  'clep':                 ['military credit', 'transfer credit', 'prior learning', 'college credit'],
  'dsst':                 ['military credit', 'transfer credit', 'prior learning', 'college credit'],
  'ace':                  ['military credit', 'ace credit', 'transfer', 'prior learning'],
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'my', 'i', 'me', 'we', 'you', 'he', 'she', 'it',
  'is', 'am', 'are', 'was', 'be', 'been', 'have', 'has', 'had', 'do',
  'does', 'did', 'as', 'up', 'so', 'if', 'no', 'go', 'from', 'into',
  'too', 'just', 'can', 'will', 'would', 'could', 'should', 'may',
  'not', 'get', 'got', 'also', 'some', 'any', 'how', 'what', 'when',
  'where', 'why', 'who', 'its', 'their', 'there', 'then', 'that',
  'this', 'these', 'those', 'im', 'ive', 'dont', 'cant', 'wont',
]);

function getSignificantWords(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .replace(/[''`]/g, '')
    .split(/[\s\-,]+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

function expandSearchTerms(term: string): string[] {
  const lower = term.toLowerCase().trim();
  const terms = new Set<string>([lower]);

  (SYNONYM_MAP[lower] ?? []).forEach(s => terms.add(s));

  const inputWords = new Set(getSignificantWords(lower));
  if (inputWords.size > 0) {
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (key === lower) continue;
      const keyWords = getSignificantWords(key);
      if (keyWords.length === 0) continue;
      const matched = keyWords.filter(w => inputWords.has(w)).length;
      if (matched / keyWords.length >= 0.8) {
        synonyms.forEach(s => terms.add(s));
      }
    }
  }

  return Array.from(terms);
}

const DB_NAME   = process.env.MONGODB_DB || 'vet1stop';
const COLLECTION = 'educationResources';
const PAGE_SIZE  = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subcategory = searchParams.get('subcategory') ?? '';
    const search      = searchParams.get('search') ?? '';
    const tag         = searchParams.get('tag') ?? '';
    const sortBy      = searchParams.get('sortBy') ?? 'relevance';
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit       = Math.min(50, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10));

    const { db } = await connectToDatabase(DB_NAME);
    const col = db.collection(COLLECTION);

    const query: Record<string, unknown> = {};

    // 'scholarships' tab is a virtual tab — maps to ngo subcategory + scholarship tag
    if (subcategory === 'scholarships') {
      query.subcategory = 'ngo';
      const scholarshipClause = { tags: { $regex: 'scholarship', $options: 'i' } };
      query.$and = [scholarshipClause];
    } else if (subcategory) {
      query.subcategory = subcategory;
    }

    if (search.trim()) {
      const searchTerms = expandSearchTerms(search.trim());
      const termClauses = searchTerms.flatMap(term => {
        const re = { $regex: term, $options: 'i' };
        return [{ title: re }, { description: re }, { tags: re }];
      });
      if (query.$and) {
        (query.$and as unknown[]).push({ $or: termClauses });
      } else {
        query.$or = termClauses;
      }
    }

    if (tag) {
      const tagClause = { tags: { $regex: tag, $options: 'i' } };
      if (query.$or) {
        query.$and = [{ $or: query.$or as unknown[] }, tagClause];
        delete query.$or;
      } else if (query.$and) {
        (query.$and as unknown[]).push(tagClause);
      } else {
        query.tags = { $regex: tag, $options: 'i' };
      }
    }

    let sort: Record<string, 1 | -1> = {};
    if (sortBy === 'rating')       sort = { rating: -1 };
    else if (sortBy === 'newest')  sort = { updatedAt: -1 };
    else if (sortBy === 'alpha')   sort = { title: 1 };
    else if (search.trim())        sort = { rating: -1, priority: 1 };
    else                           sort = { priority: 1, rating: -1 };

    const skip = (page - 1) * limit;

    let resources: Record<string, unknown>[];
    let total: number;

    if (search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const aggResult = await col.aggregate([
        { $match: query },
        { $addFields: {
          _tb: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: '$title', regex: `^${escapedSearch}`, options: 'i' } }, then: 10 },
                { case: { $regexMatch: { input: '$title', regex: escapedSearch,        options: 'i' } }, then: 5  },
              ],
              default: 0,
            },
          },
        }},
        { $sort: { _tb: -1, ...sort } },
        { $facet: {
          resources: [{ $skip: skip }, { $limit: limit }, { $unset: '_tb' }],
          meta:      [{ $count: 'total' }],
        }},
      ]).toArray();

      const facet = aggResult[0] as { resources: Record<string, unknown>[]; meta: { total: number }[] } | undefined;
      resources = facet?.resources ?? [];
      total     = facet?.meta?.[0]?.total ?? 0;
    } else {
      [resources, total] = await Promise.all([
        col.find(query).sort(sort).skip(skip).limit(limit).toArray() as Promise<Record<string, unknown>[]>,
        col.countDocuments(query),
      ]);
    }

    return NextResponse.json({
      resources,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[/api/education/browse]', err);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }
}
