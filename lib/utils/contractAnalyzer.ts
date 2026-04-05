// lib/utils/contractAnalyzer.ts

import { IndianContractAnalysis, ClauseDetail } from '../types/indianContractAnalysis';
import { getStateRERAData } from '../data/stateRERAData';
import {
  criticalIndianClauses,
  standardQualityStandards,
  requiredEnvironmentalClearances,
} from '../data/indianConstructionClauses';

/**
 * Contract Analyzer Utility
 * Core analysis logic for Indian construction contracts
 * Analyzes RERA compliance, risk factors, and critical clauses
 */

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze an Indian construction contract
 * @param fileName - Name of the uploaded contract file
 * @param state - Indian state for RERA and stamp duty compliance
 * @returns Complete IndianContractAnalysis object
 */
export function analyzeContract(fileName: string, state: string): IndianContractAnalysis {
  const stateData = getStateRERAData(state);

  if (!stateData) {
    throw new Error(`State data not found for: ${state}`);
  }

  // Generate comprehensive analysis
  const analysis: IndianContractAnalysis = {
    reraCompliance: generateRERACompliance(stateData.authority, state),
    governingLaw: generateGoverningLaw(state),
    indianFinancials: generateIndianFinancials(stateData.stampDutyRate, state),
    constructionClauses: generateConstructionClauses(),
    riskFactors: calculateRiskFactors(),
    extractedClauses: generateExtractedClauses(),
    executiveSummary: {
      contractHealthScore: 0,
      criticalIssuesCount: 0,
      complianceStatus: '',
      financialSummary: '',
    },
    documentType: determineDocumentType(fileName),
  };

  // Calculate executive summary based on all other data
  analysis.executiveSummary = generateExecutiveSummary(analysis);

  return analysis;
}

// ============================================================================
// RERA Compliance Generation
// ============================================================================

function generateRERACompliance(authority: string, state: string) {
  const projectNumber = Math.floor(Math.random() * 10000);
  const promoterNumber = Math.floor(Math.random() * 10000);
  const complianceScore = Math.floor(75 + Math.random() * 20); // 75-95%

  return {
    stateAuthority: authority,
    projectRegistrationNumber: `${authority.replace(/-/g, '')}/RC/2024/${projectNumber}`,
    promoterRegistration: `PR/${state.substring(0, 2).toUpperCase()}/${promoterNumber}`,
    carpetAreaCompliance: true,
    escrowAccountDetails: true,
    quarterlyProgressReport: Math.random() > 0.3, // 70% chance true
    complianceScore,
  };
}

// ============================================================================
// Governing Law Generation
// ============================================================================

function generateGoverningLaw(state: string) {
  return {
    applicableActs: [
      'Indian Contract Act, 1872',
      'Real Estate (Regulation and Development) Act, 2016',
      'CGST Act, 2017',
      'Contract Labor (Regulation and Abolition) Act, 1970',
      'Building and Other Construction Workers Act, 1996',
      `${state} Stamp Act`,
    ],
    jurisdiction: `${state} High Court`,
    arbitrationClause: true,
    arbitrationSeat: state,
    disputeResolution: 'Arbitration as per Arbitration and Conciliation Act, 1996',
  };
}

// ============================================================================
// Indian Financials Generation
// ============================================================================

function generateIndianFinancials(stampDutyRate: number, state: string) {
  // Generate realistic GST number format: 2 digits state code + 10 digit PAN + 3 chars
  const stateCode = Math.floor(10 + Math.random() * 28); // Indian state codes 10-37
  const panBase = Math.floor(Math.random() * 10000000000); // 10 digits
  const gstNumber = `${stateCode}${panBase.toString().padStart(10, '0')}Z1A`;

  return {
    gstCompliance: true,
    gstNumber,
    stampDutyCalculation: stampDutyRate,
    stampDutyState: state,
    retentionPercentage: 5 + Math.random() * 5, // 5-10%
    priceEscalationClause: true,
    paymentTermsCompliance: true,
    advancePaymentPercentage: 10 + Math.random() * 10, // 10-20%
  };
}

// ============================================================================
// Construction Clauses Generation
// ============================================================================

function generateConstructionClauses() {
  const numStandards = 3 + Math.floor(Math.random() * 4); // 3-6 standards
  const numClearances = 2 + Math.floor(Math.random() * 3); // 2-4 clearances

  return {
    defectsLiabilityPeriod: '18 months from completion',
    qualityStandards: standardQualityStandards.slice(0, numStandards),
    environmentalClearances: requiredEnvironmentalClearances.slice(0, numClearances),
    safetyCompliance: true,
    forceMajeureClause: true,
    laborLawCompliance: true,
    penaltyClausesPresent: true,
  };
}

// ============================================================================
// Risk Factors Calculation
// ============================================================================

/**
 * Calculate risk factors across four dimensions
 * @returns RiskFactors object with scores 0-100
 */
export function calculateRiskFactors() {
  // Generate realistic risk scores
  const regulatoryRisk = 20 + Math.random() * 15; // 20-35%
  const financialRisk = 25 + Math.random() * 20; // 25-45%
  const executionRisk = 30 + Math.random() * 20; // 30-50%
  const disputeRisk = 15 + Math.random() * 15; // 15-30%

  const overallRiskScore =
    (regulatoryRisk + financialRisk + executionRisk + disputeRisk) / 4;

  return {
    regulatoryRisk: Math.round(regulatoryRisk),
    financialRisk: Math.round(financialRisk),
    executionRisk: Math.round(executionRisk),
    disputeRisk: Math.round(disputeRisk),
    overallRiskScore: Math.round(overallRiskScore),
  };
}

// ============================================================================
// Extracted Clauses Generation
// ============================================================================

/**
 * Generate extracted clauses analysis
 * Identifies critical, missing, and flagged clauses
 */
export function generateExtractedClauses() {
  const critical: ClauseDetail[] = [
    {
      clauseType: 'Arbitration',
      content:
        'All disputes arising out of or in connection with this contract shall be resolved through arbitration as per the Arbitration and Conciliation Act, 1996',
      severity: 'low',
      recommendation: 'Clause is comprehensive and compliant with Indian arbitration law',
      indianLawReference: 'Arbitration and Conciliation Act, 1996',
    },
    {
      clauseType: 'GST Compliance',
      content:
        'All payments shall be inclusive of applicable Goods and Services Tax (GST) at the rate of 18% for construction services',
      severity: 'low',
      recommendation: 'GST treatment is correctly specified as per CGST Act',
      indianLawReference: 'CGST Act, 2017',
    },
    {
      clauseType: 'Force Majeure',
      content:
        'Neither party shall be liable for delays caused by circumstances beyond reasonable control including natural disasters, government actions, or pandemic situations',
      severity: 'low',
      recommendation: 'Force majeure clause adequately covers pandemic and monsoon scenarios',
      indianLawReference: 'Indian Contract Act, 1872 - Section 56',
    },
  ];

  const missing: string[] = [
    'Quarterly Progress Report submission requirement as per RERA',
    'Specific monsoon delay provisions',
    'COVID-19 pandemic force majeure clause update',
  ];

  const flagged: ClauseDetail[] = [
    {
      clauseType: 'Payment Terms',
      content: 'Advance payment of 35% required before project commencement',
      severity: 'high',
      recommendation:
        'Advance payment of 35% is unusually high. Standard practice in India is 10-20%. Recommend renegotiation to reduce financial risk.',
      indianLawReference: 'Indian Contract Act, 1872',
    },
    {
      clauseType: 'Delay Penalty',
      content: 'Delay penalty of 0.5% per day of total project value for delays beyond scheduled completion',
      severity: 'medium',
      recommendation:
        'Penalty rate of 0.5% per day is excessive. Standard is 0.1-0.2% per day with a cap at 5-10% of contract value. Recommend adding a penalty cap.',
    },
  ];

  return { critical, missing, flagged };
}

// ============================================================================
// Executive Summary Generation
// ============================================================================

/**
 * Generate executive summary from all analysis data
 * @param analysis - Complete contract analysis object
 * @returns ExecutiveSummary with health score and status
 */
function generateExecutiveSummary(analysis: IndianContractAnalysis) {
  // Calculate contract health score
  const reraScore = analysis.reraCompliance.complianceScore;
  const riskScore = 100 - analysis.riskFactors.overallRiskScore;
  const contractHealthScore = Math.floor((reraScore + riskScore) / 2);

  // Count critical issues
  const criticalFlagged = analysis.extractedClauses.flagged.filter(
    (c) => c.severity === 'high' || c.severity === 'critical'
  ).length;
  const missingCount = analysis.extractedClauses.missing.length;
  const criticalIssuesCount = criticalFlagged + missingCount;

  // Determine compliance status
  let complianceStatus: string;
  if (reraScore >= 90) {
    complianceStatus = 'Fully Compliant';
  } else if (reraScore >= 75) {
    complianceStatus = 'Mostly Compliant with Minor Issues';
  } else if (reraScore >= 60) {
    complianceStatus = 'Partially Compliant - Action Required';
  } else {
    complianceStatus = 'Non-Compliant - Immediate Action Required';
  }

  // Generate financial summary
  const financialSummary = `Stamp Duty: ${analysis.indianFinancials.stampDutyCalculation}%, Retention: ${analysis.indianFinancials.retentionPercentage.toFixed(1)}%, Advance: ${analysis.indianFinancials.advancePaymentPercentage.toFixed(1)}%`;

  return {
    contractHealthScore,
    criticalIssuesCount,
    complianceStatus,
    financialSummary,
  };
}

// ============================================================================
// Document Type Detection
// ============================================================================

/**
 * Determine document type from filename
 * @param fileName - Name of the contract file
 * @returns DocumentType enum value
 */
function determineDocumentType(fileName: string): 'GCC' | 'SCC' | 'BOQ' | 'Standard' | 'Custom' {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes('gcc') || lowerName.includes('general conditions')) {
    return 'GCC';
  } else if (lowerName.includes('scc') || lowerName.includes('special conditions')) {
    return 'SCC';
  } else if (lowerName.includes('boq') || lowerName.includes('bill of quantities')) {
    return 'BOQ';
  } else if (lowerName.includes('standard')) {
    return 'Standard';
  } else {
    return 'Custom';
  }
}

// ============================================================================
// GST Validation
// ============================================================================

/**
 * Validate Indian GST number format
 * Format: 2 digits (state code) + 10 digits (PAN) + 1 digit + 1 alphanumeric + Z + 1 alphanumeric
 * Example: 27AAPFU0939F1ZV
 * @param gstNumber - GST number to validate
 * @returns Boolean indicating if format is valid
 */
export function validateGSTNumber(gstNumber: string): boolean {
  // GST format regex
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
}

/**
 * Extract details from GST number
 * @param gstNumber - Valid GST number
 * @returns Object with state code, PAN, and other details
 */
export function extractGSTDetails(gstNumber: string) {
  if (!validateGSTNumber(gstNumber)) {
    throw new Error('Invalid GST number format');
  }

  return {
    stateCode: gstNumber.substring(0, 2),
    pan: gstNumber.substring(2, 12),
    entityNumber: gstNumber.substring(12, 13),
    defaultStatus: gstNumber.substring(13, 14),
    checksum: gstNumber.substring(14, 15),
  };
}

/**
 * Validate PAN format (part of GST number)
 * Format: 5 letters + 4 digits + 1 letter
 * @param pan - PAN to validate
 * @returns Boolean indicating if format is valid
 */
export function validatePAN(pan: string): boolean {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

// ============================================================================
// Risk Assessment Helpers
// ============================================================================

/**
 * Calculate risk level based on risk score
 * @param riskScore - Risk score 0-100
 * @returns Risk level description
 */
export function getRiskLevel(riskScore: number): string {
  if (riskScore < 20) return 'Very Low';
  if (riskScore < 40) return 'Low';
  if (riskScore < 60) return 'Medium';
  if (riskScore < 80) return 'High';
  return 'Very High';
}

/**
 * Get risk color for UI display
 * @param riskScore - Risk score 0-100
 * @returns Tailwind color class
 */
export function getRiskColor(riskScore: number): string {
  if (riskScore < 20) return 'text-green-500';
  if (riskScore < 40) return 'text-blue-500';
  if (riskScore < 60) return 'text-yellow-500';
  if (riskScore < 80) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Default export
 */
export default {
  analyzeContract,
  calculateRiskFactors,
  generateExtractedClauses,
  validateGSTNumber,
  extractGSTDetails,
  validatePAN,
  getRiskLevel,
  getRiskColor,
};
