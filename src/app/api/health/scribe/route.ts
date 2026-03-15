import { NextRequest, NextResponse } from 'next/server';

const PRIMARY_MODEL  = 'grok-4';
const FALLBACK_MODEL = 'grok-3-latest';

function getGrokApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

async function callGrok(model: string, apiKey: string, transcript: string): Promise<string> {
  const systemPrompt = `You are a personal health journaling assistant for veterans.
Your role is to take a veteran's spoken or typed health notes and organize them into a clear, structured summary.

STRICT RULES:
- NEVER use clinical diagnostic language. NEVER say "you have X condition" or "your diagnosis is".
- NEVER recommend specific medications or clinical treatments.
- Use the veteran's own words — do not infer or assume beyond what they said.
- Keep each section concise and practical.
- ALWAYS end with: "This summary is for personal journaling only — not clinical documentation. Discuss anything concerning with your VA provider."

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no extra text:
{
  "described": "2–4 sentence summary of what the veteran described in their own terms",
  "themes": "2–3 bullet points of key recurring themes or patterns (use \\n• to separate bullets)",
  "followUp": "2–3 actionable follow-up items to bring to their next provider visit (use \\n• to separate bullets)"
}`;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Please organize these health notes:\n\n${transcript.slice(0, 4000)}` },
      ],
      temperature: 0.3,
      max_tokens:  600,
    }),
  });

  if (!response.ok) throw new Error(`Grok ${model}: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json() as { transcript?: string };

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Transcript is too short to summarize.' }, { status: 400 });
    }

    const apiKey = getGrokApiKey();
    if (!apiKey) {
      return NextResponse.json(buildFallbackSummary(transcript));
    }

    let raw = '';
    try {
      raw = await callGrok(PRIMARY_MODEL, apiKey, transcript);
    } catch {
      console.warn('[Scribe] grok-4 failed, trying fallback model');
      try {
        raw = await callGrok(FALLBACK_MODEL, apiKey, transcript);
      } catch {
        return NextResponse.json(buildFallbackSummary(transcript));
      }
    }

    const stripped  = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json(buildFallbackSummary(transcript));

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      described: String(parsed.described ?? ''),
      themes:    String(parsed.themes    ?? ''),
      followUp:  String(parsed.followUp  ?? ''),
    });
  } catch (err) {
    console.error('[Scribe] Error:', err);
    return NextResponse.json({ error: 'Unable to summarize at this time. Please try again.' }, { status: 500 });
  }
}

function buildFallbackSummary(transcript: string) {
  const wordCount = transcript.trim().split(/\s+/).length;
  return {
    described: `Your notes cover approximately ${wordCount} words of health observations.`,
    themes:    '• Review your notes for recurring symptoms or concerns\n• Note any changes in frequency or severity\n• Identify anything that started recently',
    followUp:  '• Share these notes with your VA provider at your next visit\n• Mention any symptoms that have worsened or changed\n• Ask about any items you\'re uncertain about',
  };
}
