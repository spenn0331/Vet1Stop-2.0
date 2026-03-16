import { NextRequest, NextResponse } from 'next/server';

// POST /api/health/wellness/insights
// Accepts last 14 days of anonymized check-in data, returns 3-5 AI insight cards.
// [PREMIUM: wellness_ai_insights]

const PRIMARY_MODEL  = 'grok-4';
const FALLBACK_MODEL = 'grok-3-latest';

function getApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

interface CheckInEntry {
  date: string;
  scores: { mood: number; energy: number; sleep: number; pain: number; social: number };
  notes: string;
}

export interface InsightCard {
  id:        string;
  type:      'trend' | 'correlation' | 'warning' | 'positive' | 'recommendation';
  title:     string;
  body:      string;
  action:    string | null;
  dimension: string | null;
}

function buildPrompt(entries: CheckInEntry[]): string {
  const rows = entries.map(e =>
    `${e.date}: mood=${e.scores.mood} energy=${e.scores.energy} sleep=${e.scores.sleep} pain=${e.scores.pain} social=${e.scores.social}`
    + (e.notes ? ` | notes: "${e.notes.slice(0, 120)}"` : ''),
  ).join('\n');

  return `You are a veteran wellness analyst. Analyze this veteran's last ${entries.length} daily check-ins and generate 4 insight cards.

CHECK-IN DATA (last ${entries.length} days, scale 1–10 for all):
${rows}

STRICT RULES:
- NEVER diagnose. NEVER use clinical diagnostic language.
- Do NOT reference specific notes text verbatim.
- Speak directly to the veteran in second person ("you").
- Each insight must be actionable and specific to the data pattern.
- For warning cards: keep tone supportive, not alarming.
- ALWAYS end action suggestions with a resource (VA, 988, VSO, etc.) when appropriate.

OUTPUT — return ONLY a valid JSON array with exactly 4 objects, no markdown, no extra text:
[
  {
    "id": "insight_1",
    "type": "trend|correlation|warning|positive|recommendation",
    "title": "short title (5-8 words)",
    "body": "2-3 sentences explaining the pattern",
    "action": "1 concrete action to take, or null",
    "dimension": "mood|energy|sleep|pain|social|overall or null"
  }
]`;
}

function staticFallback(): InsightCard[] {
  return [
    {
      id:        'static_1',
      type:      'recommendation',
      title:     'Keep checking in daily',
      body:      'Consistent daily check-ins give you the most accurate picture of your wellness over time. Even a quick 30-second entry helps surface trends.',
      action:    'Set a daily reminder at the same time each day.',
      dimension: 'overall',
    },
    {
      id:        'static_2',
      type:      'recommendation',
      title:     'Sleep and mood are closely linked',
      body:      'Research shows veterans who improve sleep quality often see mood improvements within 1–2 weeks. Small changes in bedtime routine can compound quickly.',
      action:    'Talk to your VA provider about the MOVE! program or sleep hygiene resources.',
      dimension: 'sleep',
    },
    {
      id:        'static_3',
      type:      'recommendation',
      title:     'Social connection reduces pain perception',
      body:      'Veterans with strong social connections report lower chronic pain scores on average. Even brief social interactions can shift how the nervous system processes pain.',
      action:    'Find a local veteran group via the VA Community Care network or VFW.',
      dimension: 'social',
    },
    {
      id:        'static_4',
      type:      'positive',
      title:     'You showed up — that matters',
      body:      'The act of tracking your wellness is itself a form of self-care. Every entry you make builds the historical record that can support better VA care.',
      action:    'Export your symptom diary before your next VA appointment.',
      dimension: 'overall',
    },
  ];
}

async function callGrok(model: string, apiKey: string, prompt: string): Promise<InsightCard[]> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a veteran wellness analyst. Return only valid JSON arrays, no markdown.' },
        { role: 'user',   content: prompt },
      ],
      temperature: 0.4,
      max_tokens:  900,
    }),
  });
  if (!res.ok) throw new Error(`Grok ${model}: ${res.status}`);
  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content || '';
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean) as InsightCard[];
}

export async function POST(req: NextRequest) {
  try {
    const { entries } = await req.json() as { entries?: CheckInEntry[] };

    if (!entries || entries.length < 3) {
      return NextResponse.json({ insights: staticFallback(), source: 'static' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json({ insights: staticFallback(), source: 'static' });
    }

    const recent  = entries.slice(-14);
    const prompt  = buildPrompt(recent);

    let insights: InsightCard[];
    try {
      insights = await callGrok(PRIMARY_MODEL, apiKey, prompt);
    } catch {
      try {
        insights = await callGrok(FALLBACK_MODEL, apiKey, prompt);
      } catch {
        return NextResponse.json({ insights: staticFallback(), source: 'static' });
      }
    }

    if (!Array.isArray(insights) || insights.length === 0) {
      return NextResponse.json({ insights: staticFallback(), source: 'static' });
    }

    return NextResponse.json({ insights, source: 'ai' });
  } catch (err) {
    console.error('[wellness/insights]', err);
    return NextResponse.json({ insights: staticFallback(), source: 'static' });
  }
}
