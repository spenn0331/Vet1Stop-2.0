import { NextRequest, NextResponse } from 'next/server';

const PRIMARY_MODEL  = 'grok-4';
const FALLBACK_MODEL = 'grok-3-latest';

function getGrokApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

interface CppQuestion {
  question:   string;
  tip:        string;
  doNotSay:   string;
}

async function callGrok(model: string, apiKey: string, condition: string, mode: 'questions' | 'feedback', answer?: string): Promise<string> {
  let systemPrompt: string;
  let userMsg: string;

  if (mode === 'questions') {
    systemPrompt = `You are a veteran benefits educator helping veterans prepare for VA Compensation & Pension (C&P) exams.
Your goal is to help veterans understand what examiners typically ask and how to describe their symptoms accurately and completely.

STRICT RULES:
- You provide EDUCATIONAL information only — not legal advice, not claims assistance.
- NEVER coach veterans to exaggerate, fabricate, or misrepresent symptoms.
- Help veterans describe their REAL, ACTUAL symptoms accurately and completely — many veterans understate their condition.
- Always include: "Educational practice tool only. Not official VA guidance. Consult an accredited VSO for claims assistance."

OUTPUT FORMAT — return ONLY valid JSON, no markdown:
{
  "questions": [
    {
      "question": "The actual question an examiner might ask",
      "tip": "How to answer thoroughly and accurately based on your real experience",
      "doNotSay": "Common mistake veterans make when answering this type of question"
    }
  ]
}
Return exactly 5 questions.`;

    userMsg = `Generate 5 C&P exam preparation questions for a veteran with: ${condition}`;
  } else {
    systemPrompt = `You are a veteran benefits educator providing feedback on C&P exam practice answers.
Help the veteran give a complete, accurate answer that captures the full impact of their condition.

STRICT RULES:
- NEVER suggest fabricating or exaggerating symptoms.
- Focus on completeness — veterans often undersell their real limitations.
- Give specific, actionable improvement tips.
- Keep feedback concise: 2-3 sentences max.
- Always remind: not legal advice.

Return ONLY valid JSON:
{
  "feedback": "2-3 sentence specific feedback on the answer",
  "improvedAngle": "One specific thing they could add to make their answer more complete",
  "rating": "good|needs-work|incomplete"
}`;

    userMsg = `Condition: ${condition}\nVeteran's practice answer: "${answer}"`;
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMsg },
      ],
      temperature: 0.3,
      max_tokens:  900,
    }),
  });

  if (!response.ok) throw new Error(`Grok ${model}: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function tryGrok(apiKey: string, condition: string, mode: 'questions' | 'feedback', answer?: string): Promise<string> {
  try {
    return await callGrok(PRIMARY_MODEL, apiKey, condition, mode, answer);
  } catch {
    console.warn('[CppPrep] grok-4 failed, trying fallback');
    return callGrok(FALLBACK_MODEL, apiKey, condition, mode, answer);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      condition?: string;
      mode?: 'questions' | 'feedback';
      answer?: string;
    };

    const { condition, mode = 'questions', answer } = body;

    if (!condition?.trim()) {
      return NextResponse.json({ error: 'Condition is required.' }, { status: 400 });
    }

    const apiKey = getGrokApiKey();
    if (!apiKey) {
      if (mode === 'questions') return NextResponse.json(buildFallbackQuestions(condition));
      return NextResponse.json({ feedback: 'AI feedback requires an API key. Please review your answer manually.', improvedAngle: '', rating: 'needs-work' });
    }

    let raw = '';
    try {
      raw = await tryGrok(apiKey, condition, mode, answer);
    } catch {
      if (mode === 'questions') return NextResponse.json(buildFallbackQuestions(condition));
      return NextResponse.json({ feedback: 'Could not generate feedback. Please try again.', improvedAngle: '', rating: 'needs-work' });
    }

    const stripped  = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      if (mode === 'questions') return NextResponse.json(buildFallbackQuestions(condition));
      return NextResponse.json({ feedback: 'Could not parse AI response. Please try again.', improvedAngle: '', rating: 'needs-work' });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[CppPrep] Error:', err);
    return NextResponse.json({ error: 'Internal error. Please try again.' }, { status: 500 });
  }
}

function buildFallbackQuestions(condition: string): { questions: CppQuestion[] } {
  return {
    questions: [
      {
        question:  `How often do symptoms from ${condition} affect your daily activities?`,
        tip:       'Describe frequency (daily/weekly), duration, and specific tasks you can no longer do or do with difficulty.',
        doNotSay:  'Avoid vague answers like "sometimes" — be specific about how often and how much.',
      },
      {
        question:  `What is your worst-day experience with ${condition}?`,
        tip:       'Describe your worst symptoms in specific terms — what you cannot do, how long it lasts, what triggers it.',
        doNotSay:  'Do not minimize your worst days. Examiners want to understand the full range of your symptoms.',
      },
      {
        question:  `How does ${condition} affect your ability to work or maintain employment?`,
        tip:       'Describe any missed work, performance issues, accommodations needed, or career changes due to this condition.',
        doNotSay:  'Do not say "it doesn\'t affect work" if it does — even minor impacts matter.',
      },
      {
        question:  `What treatments or medications are you currently using for ${condition}?`,
        tip:       'List all VA and non-VA treatments, whether they help, side effects, and if symptoms persist despite treatment.',
        doNotSay:  'Do not suggest treatments are fully controlling your symptoms if they aren\'t.',
      },
      {
        question:  `How has ${condition} affected your relationships and social activities?`,
        tip:       'Describe social withdrawal, relationship strain, activities you\'ve stopped doing, and how your quality of life has changed.',
        doNotSay:  'Many veterans minimize social impacts — describe the real effect on your daily life.',
      },
    ],
  };
}
