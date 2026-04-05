// lib/types/indianContractAnalysis.ts

/**
 * Indian Contract Analysis Type Definitions
 * Complete TypeScript interfaces for Indian Construction & Real Estate Contract Analysis
 * Supports RERA compliance, GST validation, and Indian legal framework
 */

// ============================================================================
// Main Analysis Interface
// ============================================================================

export interface IndianContractAnalysis {
  reraCompliance: RERACompliance;
  governingLaw: GoverningLaw;
  indianFinancials: IndianFinancials;
  constructionClauses: ConstructionClauses;
  riskFactors: RiskFactors;
  extractedClauses: ExtractedClauses;
  executiveSummary: ExecutiveSummary;
  documentType: DocumentType;
}

// ============================================================================
// RERA Compliance Interface
// ============================================================================

export interface RERACompliance {
  /** State RERA Authority (e.g., MahaRERA, K-RERA, UP-RERA) */
  stateAuthority: string;
  
  /** RERA Project Registration Number */
  projectRegistrationNumber: string;
  
  /** Promoter Registration Number */
  promoterRegistration: string;
  
  /** Compliance with carpet area definition as per RERA */
  carpetAreaCompliance: boolean;
  
  /** 70% funds in escrow account requirement */
  escrowAccountDetails: boolean;
  
  /** Quarterly progress report submission */
  quarterlyProgressReport: boolean;
  
  /** Overall RERA compliance score (0-100) */
  complianceScore: number;
}

// ============================================================================
// Governing Law Interface
// ============================================================================

export interface GoverningLaw {
  /** List of applicable Indian acts (Contract Act, RERA, GST Act, etc.) */
  applicableActs: string[];
  
  /** Jurisdiction (e.g., Maharashtra High Court) */
  jurisdiction: string;
  
  /** Arbitration clause present */
  arbitrationClause: boolean;
  
  /** Arbitration seat location */
  arbitrationSeat: string;
  
  /** Dispute resolution mechanism description */
  disputeResolution: string;
}

// ============================================================================
// Indian Financials Interface
// ============================================================================

export interface IndianFinancials {
  /** GST compliance status */
  gstCompliance: boolean;
  
  /** GST Registration Number (15 digits) */
  gstNumber: string;
  
  /** State-specific stamp duty percentage */
  stampDutyCalculation: number;
  
  /** State for stamp duty calculation */
  stampDutyState: string;
  
  /** Retention money percentage (typically 5-10%) */
  retentionPercentage: number;
  
  /** Price escalation clause for material costs */
  priceEscalationClause: boolean;
  
  /** Payment terms compliance with Indian standards */
  paymentTermsCompliance: boolean;
  
  /** Advance payment percentage */
  advancePaymentPercentage: number;
}

// ============================================================================
// Construction Clauses Interface
// ============================================================================

export interface ConstructionClauses {
  /** Defects liability period (typically 12-24 months in India) */
  defectsLiabilityPeriod: string;
  
  /** Quality standards (IS codes, NBC compliance) */
  qualityStandards: string[];
  
  /** Environmental clearances (EC, CTE, CTO, etc.) */
  environmentalClearances: string[];
  
  /** Safety compliance as per Indian standards */
  safetyCompliance: boolean;
  
  /** Force majeure clause (COVID-19, monsoon, govt orders) */
  forceMajeureClause: boolean;
  
  /** Labor law compliance (Contract Labor Act, Building Workers Act) */
  laborLawCompliance: boolean;
  
  /** Penalty/liquidated damages clauses present */
  penaltyClausesPresent: boolean;
}

// ============================================================================
// Risk Factors Interface
// ============================================================================

export interface RiskFactors {
  /** Regulatory risk score (0-100) - RERA, GST, labor law compliance */
  regulatoryRisk: number;
  
  /** Financial risk score (0-100) - payment terms, escalation, retention */
  financialRisk: number;
  
  /** Execution risk score (0-100) - timeline, quality standards, penalties */
  executionRisk: number;
  
  /** Dispute risk score (0-100) - arbitration, termination, warranties */
  disputeRisk: number;
  
  /** Overall aggregated risk score (0-100) */
  overallRiskScore: number;
}

// ============================================================================
// Extracted Clauses Interface
// ============================================================================

export interface ExtractedClauses {
  /** Critical clauses identified in the contract */
  critical: ClauseDetail[];
  
  /** Missing critical clauses that should be present */
  missing: string[];
  
  /** Flagged clauses requiring attention or negotiation */
  flagged: ClauseDetail[];
}

// ============================================================================
// Clause Detail Interface
// ============================================================================

export interface ClauseDetail {
  /** Type of clause (e.g., Arbitration, Payment Terms, GST) */
  clauseType: string;
  
  /** Actual clause content/text from contract */
  content: string;
  
  /** Severity level of the issue */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** AI-generated recommendation for improvement */
  recommendation: string;
  
  /** Reference to Indian law or standard (optional) */
  indianLawReference?: string;
}

// ============================================================================
// Executive Summary Interface
// ============================================================================

export interface ExecutiveSummary {
  /** Overall contract health score (0-100) */
  contractHealthScore: number;
  
  /** Number of critical issues requiring immediate attention */
  criticalIssuesCount: number;
  
  /** Compliance status description */
  complianceStatus: string;
  
  /** Financial terms summary */
  financialSummary: string;
}

// ============================================================================
// Document Type
// ============================================================================

/** Type of construction contract document */
export type DocumentType = 'GCC' | 'SCC' | 'BOQ' | 'Standard' | 'Custom';

// ============================================================================
// Supporting Interfaces
// ============================================================================

/** State-wise RERA Authority Information */
export interface StateRERAAuthority {
  /** State name */
  state: string;
  
  /** RERA authority name */
  authority: string;
  
  /** Official RERA website */
  website: string;
  
  /** Stamp duty percentage for the state */
  stampDutyRate: number;
}

/** Critical Clause Definition */
export interface CriticalClause {
  /** Clause type identifier */
  type: string;
  
  /** Legal reference (Act, Section, Standard) */
  reference: string;
  
  /** Criticality level */
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// Utility Types
// ============================================================================

/** Contract analysis request payload */
export interface ContractAnalysisRequest {
  file: File;
  state: string;
  documentType?: DocumentType;
}

/** Contract analysis response */
export interface ContractAnalysisResponse {
  success: boolean;
  analysis?: IndianContractAnalysis;
  error?: string;
}

/** Export format options */
export type ExportFormat = 'pdf' | 'excel' | 'word' | 'json';

/** Export request payload */
export interface ExportRequest {
  analysis: IndianContractAnalysis;
  format: ExportFormat;
}
