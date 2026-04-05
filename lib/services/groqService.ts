// lib/services/groqService.ts
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY,
});

export interface GroqAnalysisRequest {
  contractText: string;
  state: string;
  contractType: string;
}

export async function analyzeContractWithGroq(request: GroqAnalysisRequest) {
  try {
    const prompt = `You are an expert Indian construction contract analyst. Analyze the following construction contract for ${request.state} state.

Contract Type: ${request.contractType}
State: ${request.state}

CONTRACT TEXT:
${request.contractText}

Provide a comprehensive JSON analysis with the following structure:
{
  "criticalClauses": {
    "mahaRERARegistration": "extracted RERA number or 'Not Found'",
    "gstCompliance": "GST rate and compliance status",
    "retentionMoney": "retention percentage and terms",
    "liquidatedDamages": "penalty terms",
    "insuranceCAR": "insurance coverage details",
    "defectsLiability": "DLP period",
    "disputeResolution": "arbitration/mediation details",
    "governingLaw": "jurisdiction and governing law",
    "laborCompliance": "EPF/ESI/BoCW compliance",
    "qualityStandards": "NBC/IS codes mentioned"
  },
  "financialAnalysis": {
    "totalValue": number,
    "gstAmount": number,
    "retentionAmount": number,
    "milestones": [
      {"phase": "string", "percentage": number, "amount": "string", "timeline": "string"}
    ]
  },
  "riskAssessment": {
    "overallRisk": number,
    "highRisks": ["list of high risks"],
    "mediumRisks": ["list of medium risks"],
    "lowRisks": ["list of low risks"]
  },
  "complianceStatus": {
    "overall": number,
    "mandatory": {
      "mahaRERA": "status",
      "gst": "status",
      "laborWelfare": "status",
      "buildingPermissions": "status"
    }
  },
  "recommendations": ["list of actionable recommendations"]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-70b-versatile', // or 'mixtral-8x7b-32768'
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from Groq');

    return JSON.parse(content);
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to analyze contract with Groq');
  }
}

export async function extractContractText(file: File): Promise<string> {
  // Simple text extraction for PDF/DOCX
  const text = await file.text();
  return text;
}
