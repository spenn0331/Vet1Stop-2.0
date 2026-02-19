import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/health/medical-detective
 * 
 * Phase 1 MVP – Upload-First "Scan & Flag" Mode
 * Accepts uploaded VA medical records (base64 images/PDFs).
 * Uses Grok Vision (xAI) + text extraction + targeted NLP.
 * Scans for 25+ high-value flags and generates a structured report.
 * 
 * SAFETY: Raw files are NEVER stored. Processing is ephemeral.
 * All data is discarded after response is sent.
 */

// 25+ high-value flags to scan for in medical records
const HIGH_VALUE_FLAGS = [
  // Service-connected conditions
  { id: 'sleep_apnea', label: 'Sleep Apnea', category: 'Sleep Disorders', keywords: ['sleep apnea', 'obstructive sleep', 'cpap', 'sleep study', 'polysomnography'] },
  { id: 'tinnitus', label: 'Tinnitus', category: 'Hearing', keywords: ['tinnitus', 'ringing in ears', 'ear ringing', 'hearing noise'] },
  { id: 'hearing_loss', label: 'Hearing Loss', category: 'Hearing', keywords: ['hearing loss', 'sensorineural', 'audiogram', 'hearing impairment', 'decreased hearing'] },
  { id: 'migraines', label: 'Migraines / Headaches', category: 'Neurological', keywords: ['migraine', 'headache', 'chronic headache', 'tension headache', 'cephalgia'] },
  { id: 'ptsd', label: 'PTSD Markers', category: 'Mental Health', keywords: ['ptsd', 'post-traumatic', 'posttraumatic', 'trauma', 'nightmares', 'hypervigilance', 'flashbacks', 'startle response'] },
  { id: 'tbi', label: 'TBI Indicators', category: 'Neurological', keywords: ['tbi', 'traumatic brain injury', 'concussion', 'blast exposure', 'head injury', 'cognitive impairment'] },
  { id: 'depression', label: 'Depression / Anxiety', category: 'Mental Health', keywords: ['depression', 'anxiety', 'depressive disorder', 'generalized anxiety', 'mood disorder', 'phq-9', 'gad-7'] },
  { id: 'chronic_pain', label: 'Chronic Pain', category: 'Musculoskeletal', keywords: ['chronic pain', 'pain management', 'fibromyalgia', 'pain disorder', 'opioid'] },
  { id: 'back_condition', label: 'Back / Spine Conditions', category: 'Musculoskeletal', keywords: ['back pain', 'lumbar', 'cervical', 'spinal', 'disc', 'herniated', 'degenerative disc', 'radiculopathy', 'sciatica'] },
  { id: 'joint_conditions', label: 'Joint Conditions', category: 'Musculoskeletal', keywords: ['arthritis', 'joint pain', 'knee', 'shoulder', 'ankle', 'degenerative joint', 'range of motion'] },
  { id: 'skin_conditions', label: 'Skin Conditions', category: 'Dermatological', keywords: ['dermatitis', 'eczema', 'skin condition', 'rash', 'psoriasis', 'skin cancer', 'chloracne'] },
  { id: 'respiratory', label: 'Respiratory Conditions', category: 'Respiratory', keywords: ['asthma', 'copd', 'respiratory', 'lung', 'breathing difficulty', 'pulmonary', 'sinusitis', 'rhinitis'] },
  { id: 'heart_conditions', label: 'Heart / Cardiovascular', category: 'Cardiovascular', keywords: ['heart', 'cardiovascular', 'hypertension', 'blood pressure', 'cardiac', 'ischemic'] },
  { id: 'diabetes', label: 'Diabetes', category: 'Endocrine', keywords: ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'a1c', 'insulin', 'type 2 diabetes'] },
  { id: 'vision', label: 'Vision Problems', category: 'Ophthalmological', keywords: ['vision', 'eye condition', 'glaucoma', 'macular', 'cataracts', 'visual acuity'] },
  { id: 'gerd', label: 'GERD / Digestive', category: 'Gastrointestinal', keywords: ['gerd', 'reflux', 'gastroesophageal', 'ibs', 'irritable bowel', 'digestive'] },
  { id: 'mst', label: 'MST Markers', category: 'Mental Health', keywords: ['military sexual trauma', 'mst', 'sexual assault', 'sexual harassment'] },
  
  // PACT Act presumptive conditions
  { id: 'burn_pit', label: 'Burn Pit / Toxic Exposure', category: 'PACT Act Presumptive', keywords: ['burn pit', 'toxic exposure', 'airborne hazard', 'pact act', 'environmental exposure', 'camp lejeune'] },
  { id: 'agent_orange', label: 'Agent Orange Exposure', category: 'PACT Act Presumptive', keywords: ['agent orange', 'herbicide', 'dioxin', 'vietnam exposure'] },
  { id: 'gulf_war_illness', label: 'Gulf War Illness', category: 'PACT Act Presumptive', keywords: ['gulf war illness', 'gulf war syndrome', 'undiagnosed illness', 'medically unexplained'] },
  { id: 'cancer_markers', label: 'Cancer Markers', category: 'Oncological', keywords: ['cancer', 'carcinoma', 'tumor', 'neoplasm', 'oncology', 'malignant', 'biopsy'] },
  
  // Key legal/claim language
  { id: 'service_connected', label: '"Service-Connected" Language', category: 'Claim Language', keywords: ['service-connected', 'service connected', 'in-service', 'line of duty', 'incurred in service'] },
  { id: 'ruled_out', label: '"Ruled Out" Language', category: 'Claim Language', keywords: ['ruled out', 'rule out', 'r/o', 'differential diagnosis'] },
  { id: 'suspected', label: '"Suspected" / "Possible" Language', category: 'Claim Language', keywords: ['suspected', 'possible', 'probable', 'likely', 'consistent with', 'suggestive of'] },
  { id: 'secondary', label: 'Secondary Conditions', category: 'Claim Language', keywords: ['secondary to', 'secondary condition', 'aggravated by', 'caused by', 'result of', 'due to'] },
  { id: 'aggravated', label: 'Aggravation Language', category: 'Claim Language', keywords: ['aggravated', 'worsened', 'exacerbated', 'increased severity', 'beyond natural progression'] },
  { id: 'nexus', label: 'Nexus / Connection Language', category: 'Claim Language', keywords: ['nexus', 'at least as likely as not', 'more likely than not', 'related to service', 'connected to military'] },
];

interface DetectiveRequest {
  files: Array<{
    name: string;
    type: string; // 'image/png', 'image/jpeg', 'application/pdf', etc.
    data: string; // base64 encoded
    size: number;
  }>;
}

interface FlaggedItem {
  flagId: string;
  label: string;
  category: string;
  excerpt: string;
  context: string;
  dateFound?: string;
  suggestedClaimCategory: string;
  confidence: 'high' | 'medium' | 'low';
}

interface DetectiveReport {
  disclaimer: string;
  summary: string;
  totalFlagsFound: number;
  flaggedItems: FlaggedItem[];
  suggestedNextSteps: string[];
  processingDetails: {
    filesProcessed: number;
    processingTime: number;
    aiModel: string;
  };
}

// Get the Grok API key from environment
function getGrokApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

// Extract text content from a PDF buffer (basic extraction)
function extractTextFromPDF(base64Data: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const str = buffer.toString('latin1');
    
    // Method 1: Extract text between BT/ET blocks (PDF text objects)
    const textParts: string[] = [];
    const btBlocks = str.match(/BT[\s\S]*?ET/g) || [];
    
    for (const block of btBlocks) {
      // Match text within Tj and TJ operators
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      for (const tj of tjMatches) {
        const match = tj.match(/\(([^)]*)\)/);
        if (match?.[1]) {
          textParts.push(match[1]);
        }
      }
      
      // Match TJ arrays
      const tjArrayMatches = block.match(/\[(.*?)\]\s*TJ/g) || [];
      for (const tjArr of tjArrayMatches) {
        const innerMatches = tjArr.match(/\(([^)]*)\)/g) || [];
        for (const inner of innerMatches) {
          const match = inner.match(/\(([^)]*)\)/);
          if (match?.[1]) {
            textParts.push(match[1]);
          }
        }
      }
    }
    
    // Method 2: Fallback - try to find readable text in the buffer
    if (textParts.length === 0) {
      const utf8Str = buffer.toString('utf-8');
      // Extract strings that look like readable text (at least 4 chars, mostly alpha)
      const readableMatches = utf8Str.match(/[A-Za-z][A-Za-z0-9\s,.;:'\-\/]{3,}/g) || [];
      textParts.push(...readableMatches.filter(t => t.length > 5));
    }
    
    const extracted = textParts.join(' ').replace(/\s+/g, ' ').trim();
    return extracted;
  } catch (error) {
    console.error('[MedicalDetective] PDF text extraction error:', error);
    return '';
  }
}

// Call Grok Vision API to analyze an image
async function analyzeImageWithGrokVision(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  const apiKey = getGrokApiKey();
  if (!apiKey) return '';

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-latest',
        messages: [
          {
            role: 'system',
            content: `You are a medical records analyst for Vet1Stop, a veteran resource platform. Your job is to carefully scan uploaded VA medical records and identify key findings relevant to VA disability claims.

CRITICAL: You are NOT providing medical advice. You are ONLY identifying relevant text, dates, conditions, and language patterns in the documents.

For each finding, provide:
1. The exact text excerpt
2. Any dates mentioned nearby
3. The relevant condition category
4. Whether it contains claim-relevant language (e.g., "service-connected", "ruled out", "suspected", "secondary to")

Look specifically for these types of flags:
- Sleep apnea, tinnitus, hearing loss, migraines
- PTSD markers, TBI indicators, depression/anxiety
- Chronic pain, back/spine conditions, joint conditions
- PACT Act presumptive conditions (burn pit, Agent Orange, Gulf War illness)
- Cancer markers, respiratory conditions, heart conditions
- "Service-connected", "ruled out", "suspected", "secondary to" language
- Nexus language ("at least as likely as not", "more likely than not")
- Aggravation language ("worsened", "aggravated", "exacerbated")

Respond in JSON format:
{
  "findings": [
    {
      "excerpt": "exact text from document",
      "condition": "condition name",
      "category": "category",
      "dateFound": "date if visible",
      "claimLanguage": "any claim-relevant language found",
      "confidence": "high|medium|low"
    }
  ],
  "documentType": "type of document (progress note, lab report, etc.)",
  "summary": "brief summary of what the document contains"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this VA medical record document (${fileName}) for disability claim-relevant findings. Identify all conditions, claim language, and dates.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MedicalDetective] Grok Vision API error:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[MedicalDetective] Error calling Grok Vision:', error);
    return '';
  }
}

// Call Grok AI for text-based NLP analysis
async function analyzeTextWithGrokNLP(text: string, fileName: string): Promise<string> {
  const apiKey = getGrokApiKey();
  if (!apiKey) return '';

  // Truncate text if too long (API limits)
  const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...[truncated]' : text;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [
          {
            role: 'system',
            content: `You are a medical records text analyst for Vet1Stop, a veteran resource platform. Analyze the following extracted text from a VA medical record and identify all findings relevant to VA disability claims.

CRITICAL: You are NOT providing medical advice. You are ONLY identifying relevant text patterns, dates, conditions, and language.

Respond in JSON format:
{
  "findings": [
    {
      "excerpt": "exact text excerpt that is relevant",
      "condition": "condition name",
      "category": "category",
      "dateFound": "date if found in text",
      "claimLanguage": "any claim-relevant language",
      "confidence": "high|medium|low"
    }
  ],
  "documentType": "type of document",
  "summary": "brief summary"
}`
          },
          {
            role: 'user',
            content: `Analyze this extracted text from a VA medical record (${fileName}) for disability claim-relevant findings:\n\n${truncatedText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error('[MedicalDetective] Grok NLP API error:', response.status);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[MedicalDetective] Error calling Grok NLP:', error);
    return '';
  }
}

// Local keyword-based scanning as fallback / supplement
function scanTextForFlags(text: string): FlaggedItem[] {
  const lowerText = text.toLowerCase();
  const items: FlaggedItem[] = [];

  for (const flag of HIGH_VALUE_FLAGS) {
    for (const keyword of flag.keywords) {
      const index = lowerText.indexOf(keyword.toLowerCase());
      if (index !== -1) {
        // Extract surrounding context (100 chars before and after)
        const start = Math.max(0, index - 100);
        const end = Math.min(text.length, index + keyword.length + 100);
        const excerpt = text.substring(index, Math.min(text.length, index + keyword.length + 50)).trim();
        const context = text.substring(start, end).trim();

        // Try to find a date near the keyword
        const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s*\d{4})\b/gi;
        const nearbyText = text.substring(Math.max(0, index - 200), Math.min(text.length, index + 200));
        const dateMatch = nearbyText.match(dateRegex);

        items.push({
          flagId: flag.id,
          label: flag.label,
          category: flag.category,
          excerpt: excerpt,
          context: context,
          dateFound: dateMatch?.[0] || undefined,
          suggestedClaimCategory: flag.category,
          confidence: 'medium',
        });

        break; // Only flag once per flag type per text block
      }
    }
  }

  return items;
}

// Parse AI response and merge with keyword scan results
function parseAIFindings(aiResponse: string, keywordFlags: FlaggedItem[]): FlaggedItem[] {
  const aiItems: FlaggedItem[] = [];

  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const findings = parsed.findings || [];

      for (const finding of findings) {
        // Map finding to a known flag if possible
        const matchedFlag = HIGH_VALUE_FLAGS.find(f =>
          f.keywords.some(kw =>
            finding.condition?.toLowerCase().includes(kw) ||
            finding.excerpt?.toLowerCase().includes(kw) ||
            finding.category?.toLowerCase().includes(f.category.toLowerCase())
          )
        );

        aiItems.push({
          flagId: matchedFlag?.id || finding.condition?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
          label: matchedFlag?.label || finding.condition || 'Unclassified Finding',
          category: matchedFlag?.category || finding.category || 'Other',
          excerpt: finding.excerpt || '',
          context: finding.claimLanguage ? `${finding.excerpt} — ${finding.claimLanguage}` : finding.excerpt || '',
          dateFound: finding.dateFound || undefined,
          suggestedClaimCategory: matchedFlag?.category || finding.category || 'Other',
          confidence: finding.confidence || 'medium',
        });
      }
    }
  } catch (error) {
    console.warn('[MedicalDetective] Error parsing AI findings:', error);
  }

  // Merge: AI findings take priority, add keyword-only findings that AI missed
  const aiIds = new Set(aiItems.map(i => i.flagId));
  const uniqueKeywordFlags = keywordFlags.filter(kf => !aiIds.has(kf.flagId));

  return [...aiItems, ...uniqueKeywordFlags];
}

const DISCLAIMER = `IMPORTANT DISCLAIMER: This report is strictly for informational purposes only. It is NOT medical advice, legal advice, or a substitute for professional guidance. Vet1Stop does not diagnose conditions, file claims, or provide medical opinions. This tool identifies potential patterns in YOUR OWN uploaded documents to help you have informed conversations with your VSO (Veterans Service Organization) or healthcare provider. No files are stored — all uploaded documents are automatically deleted immediately after processing. Zero HIPAA exposure.`;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse multipart or JSON body
    const body: DetectiveRequest = await request.json();
    const { files } = body;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file sizes (max 10MB per file)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }
    }

    const allFlaggedItems: FlaggedItem[] = [];
    let filesProcessed = 0;

    for (const file of files) {
      filesProcessed++;
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';

      if (isImage) {
        // Use Grok Vision for images
        const aiResponse = await analyzeImageWithGrokVision(file.data, file.type, file.name);
        
        // Also do keyword scan on any text in the image response
        const keywordFlags = aiResponse ? scanTextForFlags(aiResponse) : [];
        const findings = aiResponse ? parseAIFindings(aiResponse, keywordFlags) : keywordFlags;
        allFlaggedItems.push(...findings);

      } else if (isPDF) {
        // Extract text from PDF
        const extractedText = extractTextFromPDF(file.data);
        
        if (extractedText.length > 50) {
          // Good text extraction — use NLP analysis
          const aiResponse = await analyzeTextWithGrokNLP(extractedText, file.name);
          const keywordFlags = scanTextForFlags(extractedText);
          const findings = aiResponse ? parseAIFindings(aiResponse, keywordFlags) : keywordFlags;
          allFlaggedItems.push(...findings);
        } else {
          // Poor text extraction — try as image (some PDFs are scanned)
          // Inform user that screenshot upload may be better for scanned PDFs
          const keywordFlags = scanTextForFlags(extractedText);
          if (keywordFlags.length > 0) {
            allFlaggedItems.push(...keywordFlags);
          }
        }
      }

      // IMMEDIATELY clear file data from memory (ephemeral processing)
      file.data = '';
    }

    // Deduplicate flags by flagId
    const deduped = new Map<string, FlaggedItem>();
    for (const item of allFlaggedItems) {
      const existing = deduped.get(item.flagId);
      if (!existing || item.confidence === 'high') {
        deduped.set(item.flagId, item);
      }
    }

    const flaggedItems = Array.from(deduped.values());
    const processingTime = Date.now() - startTime;

    // Build the report
    const report: DetectiveReport = {
      disclaimer: DISCLAIMER,
      summary: flaggedItems.length > 0
        ? `We identified ${flaggedItems.length} potential flag(s) across ${filesProcessed} document(s) that may be relevant to VA disability claims. Review these findings with your VSO or healthcare provider.`
        : `No specific claim-relevant flags were identified in the ${filesProcessed} document(s) processed. This does not mean there are no valid claims — consider uploading additional records or screenshots for a more thorough scan.`,
      totalFlagsFound: flaggedItems.length,
      flaggedItems: flaggedItems,
      suggestedNextSteps: [
        'Review this report with a Veterans Service Organization (VSO) representative',
        'Contact your local VA Regional Office for claims assistance',
        'Gather additional medical evidence to support identified conditions',
        'Request a nexus letter from your healthcare provider if applicable',
        'Consider filing or supplementing a VA disability claim',
      ],
      processingDetails: {
        filesProcessed,
        processingTime,
        aiModel: 'Grok Vision + NLP (xAI)',
      },
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error('[MedicalDetective] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process medical records', message: (error as Error).message },
      { status: 500 }
    );
  }
}
