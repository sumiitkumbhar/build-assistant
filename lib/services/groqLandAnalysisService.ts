// lib/services/groqLandAnalysisService.ts
// Backend helper for Land Feasibility Report generation via Groq

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeneratedReportSection = {
  id: string;
  title: string;
  summary: string;
  content: string;
  bullets?: string[];
  subsections?: {
    id: string;
    title: string;
    content: string;
  }[];
};

export interface LandReportRequest {
  documentText: any;
  location?: string;
  state?: string;
  analysisType?: string;
  reportType?: string;
  topics?: string[];
}

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const GROQ_API_KEY =
  process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama3-70b-8192';

// ---------------------------------------------------------------------------
// Helper: extract text from whatever structure we get
// ---------------------------------------------------------------------------

export function extractDocumentText(source: any): string {
  if (!source) return '';

  if (typeof source === 'string') return source;

  if (Array.isArray(source)) {
    return source
      .map((item) => extractDocumentText(item))
      .filter(Boolean)
      .join('\n\n');
  }

  if (typeof source === 'object') {
    const obj: any = source;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.content === 'string') return obj.content;
    if (typeof obj.body === 'string') return obj.body;
    
    try {
      return JSON.stringify(source, null, 2);
    } catch {
      return String(source);
    }
  }

  return String(source);
}

// ---------------------------------------------------------------------------
// Main: call Groq and return structured sections for the PDF generator
// ---------------------------------------------------------------------------

export async function generateLandAnalysisReport(
  req: LandReportRequest
): Promise<GeneratedReportSection[]> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY. Set it in .env.local');
  }

  const {
    documentText,
    location = 'Unknown location',
    state = 'Unknown state',
    analysisType = 'Land Feasibility',
    reportType = 'Land Feasibility Analysis',
    topics = [],
  } = req;

  const baseText = extractDocumentText(documentText);
  
  if (!baseText || baseText.trim().length === 0) {
    throw new Error(
      'Document text is empty or invalid. Please upload valid documents before generating report.'
    );
  }

  const MAX_INPUT_CHARS = 8000;
  const safeText = baseText.slice(0, MAX_INPUT_CHARS);
  
  console.log(`Input text length: ${baseText.length} chars (using ${safeText.length})`);

  const topicList =
    topics.length > 0 ? topics.join(', ') : 'core land feasibility sections';

  const prompt = `
You are an expert urban land feasibility analyst and planning consultant.
Write a structured "${reportType}" for a parcel in ${location}, ${state}
(analysis type: ${analysisType}).

Use the following source text as background and factual context. You may extend
and interpret it, but stay consistent with the information:

[SOURCE_DOCUMENT_START]
${safeText}
[SOURCE_DOCUMENT_END]

Focus the analysis on these sections (in this order): ${topicList}.

Return your answer STRICTLY as JSON (UTF-8, no markdown, no backticks) with
this exact shape:

{
  "sections": [
    {
      "id": "executive-summary",
      "title": "Executive Summary",
      "summary": "Short overview paragraph",
      "content": "Full narrative for this section, 300-600 words.",
      "bullets": ["key point 1", "key point 2"],
      "subsections": [
        {
          "id": "sub-1",
          "title": "Sub heading",
          "content": "detailed text"
        }
      ]
    }
  ]
}

IMPORTANT: Keep each section content concise (300-600 words) to avoid token limits.
`.trim();

  const estimatedInputTokens = Math.ceil(prompt.length / 4);
  console.log(`Estimated prompt tokens: ${estimatedInputTokens}`);

  const body = {
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a senior land due-diligence, zoning and real-estate feasibility expert. Always answer in English and obey the requested JSON schema exactly. Keep responses concise and well-structured.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 6000,
    top_p: 1,
    stream: false,
  };

  console.log('Calling Groq API with model:', DEFAULT_MODEL);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = res.statusText;
    let errorDetails: any = {};
    
    try {
      const errJson: any = await res.json();
      msg = errJson?.error?.message || JSON.stringify(errJson);
      errorDetails = errJson;
    } catch {
      // ignore parse failure
    }

    console.error('Groq API error details:', {
      status: res.status,
      statusText: res.statusText,
      message: msg,
      errorDetails,
      modelUsed: DEFAULT_MODEL,
      estimatedTokens: estimatedInputTokens,
    });

    if (res.status === 400) {
      throw new Error(
        `Groq API request error (400): ${msg}. This usually means the input is too large or malformed. Try with a smaller document.`
      );
    } else if (res.status === 401) {
      throw new Error(
        'Groq API authentication failed. Please check your GROQ_API_KEY in .env.local'
      );
    } else if (res.status === 429) {
      throw new Error(
        'Groq API rate limit exceeded. Please wait a moment and try again.'
      );
    } else {
      throw new Error(`Groq API error: ${res.status} - ${msg}`);
    }
  }

  const data: any = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '';

  console.log('Groq response received, length:', raw.length);

  // -------------------------------------------------------------------------
  // Parse Groq output - USING STRING METHODS (NO REGEX ISSUES)
  // -------------------------------------------------------------------------
  let parsed: any;
  try {
    // Remove markdown code fences using safe string methods
    let cleanedRaw = raw.trim();
    
    // Remove ```
    if (cleanedRaw.startsWith('```json')) {
      cleanedRaw = cleanedRaw.slice(7).trim();
    }
    
    // Remove ```
    if (cleanedRaw.startsWith('```')) {
      cleanedRaw = cleanedRaw.slice(3).trim();
    }
    
    // Remove ```
    if (cleanedRaw.endsWith('```')) {
      cleanedRaw = cleanedRaw.slice(0, -3).trim();
    }
    
    parsed = JSON.parse(cleanedRaw);
    console.log('Successfully parsed JSON response');
  } catch (parseError) {
    console.error('Failed to parse Groq JSON response:', parseError);
    console.error('Raw response (first 500 chars):', raw.slice(0, 500));
    
    const single: GeneratedReportSection = {
      id: 'land-analysis',
      title: reportType,
      summary: raw.slice(0, 400),
      content: raw,
      bullets: [],
      subsections: [],
    };
    return [single];
  }

  const sectionsArray: any[] = Array.isArray(parsed.sections)
    ? parsed.sections
    : Array.isArray(parsed)
    ? parsed
    : [];

  if (!sectionsArray.length) {
    throw new Error(
      'Groq response did not contain any sections in the expected format. Please try again.'
    );
  }

  const sections: GeneratedReportSection[] = sectionsArray.map(
    (s: any, index: number) => ({
      id: s.id || `section-${index + 1}`,
      title: s.title || `Section ${index + 1}`,
      summary: s.summary || '',
      content: s.content || '',
      bullets: Array.isArray(s.bullets) ? s.bullets : [],
      subsections: Array.isArray(s.subsections)
        ? s.subsections.map((sub: any, i: number) => ({
            id: sub.id || `sub-${index + 1}-${i + 1}`,
            title: sub.title || `Subsection ${i + 1}`,
            content: sub.content || '',
          }))
        : [],
    })
  );

  console.log(`Successfully generated ${sections.length} report sections`);
  return sections;
}

export default {
  generateLandAnalysisReport,
  extractDocumentText,
};
