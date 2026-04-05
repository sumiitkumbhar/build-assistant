// lib/utils/clauseExtractor.ts

import { ClauseDetail } from '../types/indianContractAnalysis';
import { criticalIndianClauses, getAllClauseTypes } from '../data/indianConstructionClauses';

/**
 * Clause Extractor Utility
 * NLP-based clause extraction and analysis for Indian construction contracts
 * Identifies critical clauses, missing clauses, and assesses severity
 * 
 * For production implementation:
 * - Install OpenAI: npm install openai
 * - Or use Hugging Face: npm install @huggingface/inference
 * - Add API keys to .env.local
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface ClauseExtractionResult {
  critical: ClauseDetail[];
  missing: string[];
  flagged: ClauseDetail[];
}

interface ClauseMatch {
  type: string;
  content: string;
  confidence: number;
  location: { start: number; end: number };
}

// ============================================================================
// Main Clause Extraction Function
// ============================================================================

/**
 * Extract and analyze clauses from contract text
 * @param contractText - Full contract text content
 * @param state - Indian state for state-specific validation
 * @returns Extracted clauses categorized as critical, missing, and flagged
 */
export async function extractClauses(
  contractText: string,
  state: string
): Promise<ClauseExtractionResult> {
  try {
    // In production, use OpenAI or Hugging Face for NLP analysis
    // For now, use rule-based extraction
    const extractedClauses = await extractClausesWithRules(contractText);
    const missingClauses = identifyMissingClauses(extractedClauses, state);
    const flaggedClauses = identifyFlaggedClauses(extractedClauses);

    return {
      critical: extractedClauses.filter(
        (c) => c.severity === 'low' || c.severity === 'medium'
      ),
      missing: missingClauses,
      flagged: flaggedClauses,
    };
  } catch (error) {
    console.error('Clause extraction error:', error);
    // Return fallback analysis
    return getFallbackClauses();
  }
}

// ============================================================================
// Rule-Based Clause Extraction (Fallback)
// ============================================================================

/**
 * Extract clauses using keyword matching and pattern recognition
 * @param contractText - Contract text content
 * @returns Array of ClauseDetail objects
 */
async function extractClausesWithRules(contractText: string): Promise<ClauseDetail[]> {
  const clauses: ClauseDetail[] = [];
  const lowerText = contractText.toLowerCase();

  // Arbitration Clause Detection
  if (
    lowerText.includes('arbitration') &&
    lowerText.includes('dispute') &&
    lowerText.includes('1996')
  ) {
    clauses.push({
      clauseType: 'Arbitration',
      content: extractClauseContent(contractText, 'arbitration'),
      severity: 'low',
      recommendation:
        'Arbitration clause is present and references the Arbitration and Conciliation Act, 1996',
      indianLawReference: 'Arbitration and Conciliation Act, 1996',
    });
  }

  // GST Clause Detection
  if (lowerText.includes('gst') || lowerText.includes('goods and services tax')) {
    const gstRate = extractGSTRate(contractText);
    clauses.push({
      clauseType: 'GST Compliance',
      content: extractClauseContent(contractText, 'gst'),
      severity: gstRate === 18 ? 'low' : 'medium',
      recommendation:
        gstRate === 18
          ? 'GST clause correctly specifies 18% rate for construction services'
          : `GST rate of ${gstRate}% detected. Verify if correct for your project type.`,
      indianLawReference: 'CGST Act, 2017',
    });
  }

  // Force Majeure Clause Detection
  if (lowerText.includes('force majeure')) {
    const hasCovidProvision = lowerText.includes('pandemic') || lowerText.includes('covid');
    const hasMonsoonProvision = lowerText.includes('monsoon') || lowerText.includes('flood');

    clauses.push({
      clauseType: 'Force Majeure',
      content: extractClauseContent(contractText, 'force majeure'),
      severity: hasCovidProvision && hasMonsoonProvision ? 'low' : 'medium',
      recommendation:
        hasCovidProvision && hasMonsoonProvision
          ? 'Force majeure clause covers pandemic and monsoon scenarios'
          : 'Consider adding specific provisions for pandemic and monsoon delays',
      indianLawReference: 'Indian Contract Act, 1872 - Section 56',
    });
  }

  // Payment Terms Detection
  if (lowerText.includes('payment') && lowerText.includes('advance')) {
    const advancePercent = extractPercentage(contractText, 'advance');
    clauses.push({
      clauseType: 'Payment Terms',
      content: extractClauseContent(contractText, 'payment'),
      severity: advancePercent > 25 ? 'high' : advancePercent > 20 ? 'medium' : 'low',
      recommendation:
        advancePercent > 25
          ? `Advance payment of ${advancePercent}% is high. Standard is 10-20%. Negotiate reduction.`
          : `Advance payment of ${advancePercent}% is within acceptable range.`,
      indianLawReference: 'Indian Contract Act, 1872',
    });
  }

  // Defects Liability Period
  if (lowerText.includes('defect') && lowerText.includes('liability')) {
    clauses.push({
      clauseType: 'Defects Liability Period',
      content: extractClauseContent(contractText, 'defect'),
      severity: 'low',
      recommendation: 'Defects liability period is specified as per standard practice',
    });
  }

  // RERA Registration
  if (lowerText.includes('rera') || lowerText.includes('real estate regulation')) {
    clauses.push({
      clauseType: 'RERA Registration',
      content: extractClauseContent(contractText, 'rera'),
      severity: 'low',
      recommendation: 'RERA registration details are mentioned in the contract',
      indianLawReference: 'Real Estate (Regulation and Development) Act, 2016',
    });
  }

  return clauses;
}

// ============================================================================
// Missing Clause Identification
// ============================================================================

/**
 * Identify critical clauses that are missing from the contract
 * @param extractedClauses - Clauses found in the contract
 * @param state - Indian state for state-specific requirements
 * @returns Array of missing clause types
 */
export function identifyMissingClauses(
  extractedClauses: ClauseDetail[],
  state?: string
): string[] {
  const requiredClauseTypes = criticalIndianClauses
    .filter((c) => c.criticality === 'critical' || c.criticality === 'high')
    .map((c) => c.type);

  const extractedTypes = extractedClauses.map((c) => c.clauseType);

  const missing = requiredClauseTypes.filter(
    (required) =>
      !extractedTypes.some((extracted) =>
        extracted.toLowerCase().includes(required.toLowerCase())
      )
  );

  return missing;
}

// ============================================================================
// Flagged Clause Identification
// ============================================================================

/**
 * Identify clauses that require attention or renegotiation
 * @param extractedClauses - All extracted clauses
 * @returns Array of flagged clauses with severity high or critical
 */
function identifyFlaggedClauses(extractedClauses: ClauseDetail[]): ClauseDetail[] {
  return extractedClauses.filter(
    (clause) => clause.severity === 'high' || clause.severity === 'critical'
  );
}

// ============================================================================
// Clause Severity Assessment
// ============================================================================

/**
 * Assess the severity level of a clause based on its type and content
 * @param clauseType - Type of clause (e.g., 'Arbitration', 'Payment Terms')
 * @param content - Clause text content
 * @returns Severity level: 'low', 'medium', 'high', or 'critical'
 */
export function assessClauseSeverity(
  clauseType: string,
  content: string
): 'low' | 'medium' | 'high' | 'critical' {
  const criticalTypes = ['GST Compliance', 'RERA Registration', 'Labor Law Compliance'];
  const highTypes = ['Arbitration Clause', 'Force Majeure', 'Payment Terms', 'Delay Penalties'];

  // Check if it's a critical clause type
  if (criticalTypes.some((type) => clauseType.toLowerCase().includes(type.toLowerCase()))) {
    // Check for red flags in content
    if (hasRedFlags(content)) {
      return 'critical';
    }
    return 'low'; // Critical type but content is okay
  }

  // Check if it's a high priority clause
  if (highTypes.some((type) => clauseType.toLowerCase().includes(type.toLowerCase()))) {
    if (hasRedFlags(content)) {
      return 'high';
    }
    return 'low';
  }

  // For other clause types, check content
  if (hasRedFlags(content)) {
    return 'medium';
  }

  return 'low';
}

// ============================================================================
// Red Flag Detection
// ============================================================================

/**
 * Check if clause content contains red flags
 * @param content - Clause text content
 * @returns Boolean indicating presence of red flags
 */
function hasRedFlags(content: string): boolean {
  const lowerContent = content.toLowerCase();

  const redFlagPatterns = [
    /advance.*(?:40|50|60|70|80|90)%/i, // High advance payment
    /penalty.*(?:0\.[5-9]|[1-9])%.*day/i, // Excessive penalty rate
    /no.*warranty/i, // No warranty
    /unlimited.*liability/i, // Unlimited liability
    /waive.*rights/i, // Waiving rights
  ];

  return redFlagPatterns.some((pattern) => pattern.test(lowerContent));
}

// ============================================================================
// Helper Functions for Text Extraction
// ============================================================================

/**
 * Extract clause content from contract text
 * @param text - Full contract text
 * @param keyword - Keyword to search for
 * @returns Extracted clause content
 */
function extractClauseContent(text: string, keyword: string): string {
  const sentences = text.split(/[.!?]\s+/);
  const relevantSentences = sentences.filter((s) =>
    s.toLowerCase().includes(keyword.toLowerCase())
  );

  if (relevantSentences.length > 0) {
    return relevantSentences.slice(0, 2).join('. ') + '.';
  }

  return `Clause related to ${keyword} found in contract`;
}

/**
 * Extract GST rate from contract text
 * @param text - Contract text
 * @returns GST percentage
 */
function extractGSTRate(text: string): number {
  const gstMatch = text.match(/(?:gst|GST).*?(\d+)%/i);
  return gstMatch ? parseInt(gstMatch[1]) : 18; // Default to 18%
}

/**
 * Extract percentage value from text near a keyword
 * @param text - Contract text
 * @param keyword - Keyword to search near
 * @returns Extracted percentage
 */
function extractPercentage(text: string, keyword: string): number {
  const regex = new RegExp(`${keyword}.*?(\\d+(?:\\.\\d+)?)%`, 'i');
  const match = text.match(regex);
  return match ? parseFloat(match[1]) : 15; // Default 15%
}

// ============================================================================
// AI-Powered Clause Extraction (Production)
// ============================================================================

/**
 * Extract clauses using OpenAI API (for production use)
 * @param contractText - Contract text content
 * @param state - Indian state
 * @returns Structured clause extraction result
 * 
 * To implement:
 * 1. Install: npm install openai
 * 2. Add OPENAI_API_KEY to .env.local
 */
export async function extractClausesWithAI(
  contractText: string,
  state: string
): Promise<ClauseExtractionResult> {
  // TODO: Implement with OpenAI
  /*
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Analyze this Indian construction contract for ${state}. 
Extract and categorize the following clauses:
1. Arbitration clauses
2. Payment terms (identify advance %, retention %)
3. RERA compliance details
4. GST information and rates
5. Force majeure provisions (check for pandemic, monsoon)
6. Penalty clauses (identify penalty rate)
7. Quality standards (IS codes, NBC)
8. Defects liability period
9. Labor law compliance
10. Environmental clearances

Contract Text:
${contractText.substring(0, 8000)}

Return as JSON with structure:
{
  "critical": [{"clauseType": "", "content": "", "severity": "", "recommendation": "", "indianLawReference": ""}],
  "missing": [""],
  "flagged": [{"clauseType": "", "content": "", "severity": "", "recommendation": ""}]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
  */

  // Fallback for now
  return extractClausesWithRules(contractText);
}

// ============================================================================
// Fallback Clause Analysis
// ============================================================================

/**
 * Return default clause analysis if extraction fails
 */
function getFallbackClauses(): ClauseExtractionResult {
  return {
    critical: [
      {
        clauseType: 'Contract Analysis',
        content: 'Unable to extract detailed clauses. Manual review recommended.',
        severity: 'medium',
        recommendation: 'Please review the contract manually or try uploading again.',
      },
    ],
    missing: ['Unable to determine missing clauses without proper extraction'],
    flagged: [],
  };
}

// ============================================================================
// Clause Validation
// ============================================================================

/**
 * Validate if a clause meets minimum requirements
 * @param clause - Clause detail object
 * @returns Boolean indicating if valid
 */
export function validateClause(clause: ClauseDetail): boolean {
  return (
    clause.clauseType.length > 0 &&
    clause.content.length > 10 &&
    clause.severity !== undefined &&
    clause.recommendation.length > 0
  );
}

/**
 * Compare extracted clauses against required clauses
 * @param extractedClauses - Clauses found in contract
 * @param requiredClauses - List of required clause types
 * @returns Comparison result with coverage percentage
 */
export function compareClauseCoverage(
  extractedClauses: string[],
  requiredClauses: string[]
): { coverage: number; missing: string[]; present: string[] } {
  const present = requiredClauses.filter((required) =>
    extractedClauses.some((extracted) =>
      extracted.toLowerCase().includes(required.toLowerCase())
    )
  );

  const missing = requiredClauses.filter((required) => !present.includes(required));

  const coverage = (present.length / requiredClauses.length) * 100;

  return { coverage, missing, present };
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  extractClauses,
  identifyMissingClauses,
  assessClauseSeverity,
  extractClausesWithAI,
  validateClause,
  compareClauseCoverage,
};
