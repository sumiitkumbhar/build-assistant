// lib/utils/documentParser.ts

/**
 * Document Parser Utility
 * Extracts text and metadata from PDF, DOCX, and DOC files
 * Supports Indian construction contract formats: GCC, SCC, BOQ
 * 
 * Dependencies to install:
 * - npm install pdf-parse
 * - npm install mammoth
 * - npm install tesseract.js (for OCR on scanned PDFs)
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: Date;
  pageCount?: number;
  wordCount?: number;
  extractedDate: Date;
}

interface ExtractionResult {
  text: string;
  metadata: DocumentMetadata;
  success: boolean;
  error?: string;
}

// ============================================================================
// Main Text Extraction Function
// ============================================================================

/**
 * Extract text from various document formats
 * @param file - File object (PDF, DOCX, DOC)
 * @returns Extracted text content
 */
export async function extractTextFromDocument(file: File): Promise<string> {
  const fileType = file.type;

  try {
    if (fileType === 'application/pdf') {
      return await extractFromPDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractFromDOCX(file);
    } else if (fileType === 'application/msword') {
      return await extractFromDOC(file);
    } else {
      throw new Error(`Unsupported file format: ${fileType}`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text from ${file.name}: ${error}`);
  }
}

// ============================================================================
// PDF Text Extraction
// ============================================================================

/**
 * Extract text from PDF files
 * @param file - PDF file object
 * @returns Extracted text content
 * 
 * To implement:
 * 1. Install: npm install pdf-parse
 * 2. For scanned PDFs with OCR: npm install tesseract.js
 */
export async function extractFromPDF(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // TODO: Uncomment when pdf-parse is installed
    /*
    const pdf = require('pdf-parse');
    const data = await pdf(buffer);
    
    // Check if PDF has text content
    if (data.text && data.text.trim().length > 0) {
      return data.text;
    } else {
      // If no text found, PDF might be scanned - use OCR
      return await extractFromScannedPDF(file);
    }
    */

    // Mock implementation for testing (remove in production)
    console.log('PDF extraction: Using mock data. Install pdf-parse for production.');
    return `
      CONSTRUCTION CONTRACT AGREEMENT
      
      This Agreement is entered into on [Date] between:
      
      PARTY A (Developer): [Developer Name]
      GST Number: 27AAPFU0939F1ZV
      RERA Registration: MahaRERA/RC/2024/1234
      
      PARTY B (Contractor): [Contractor Name]
      
      PROJECT DETAILS:
      - Project Name: [Project Name]
      - Location: [City, State]
      - Estimated Cost: Rs. [Amount]
      
      TERMS AND CONDITIONS:
      
      1. SCOPE OF WORK
      The Contractor shall execute all civil construction works as per approved drawings
      and specifications in accordance with IS codes and NBC 2016.
      
      2. PAYMENT TERMS
      - Advance Payment: 15% on signing
      - Progress Payments: As per milestone completion
      - Retention Money: 7.5% until defects liability period
      
      3. GST AND TAXES
      All payments shall be subject to applicable GST at 18% for construction services.
      
      4. QUALITY STANDARDS
      Works shall comply with:
      - IS 456:2000 for concrete works
      - IS 1893:2016 for earthquake resistance
      - NBC 2016 - National Building Code
      
      5. DEFECTS LIABILITY PERIOD
      18 months from date of completion certificate.
      
      6. ARBITRATION
      Disputes shall be resolved through arbitration as per Arbitration and Conciliation Act, 1996.
      Seat of Arbitration: Maharashtra
      
      7. FORCE MAJEURE
      Neither party shall be liable for delays due to acts of God, pandemic, government orders,
      or events beyond reasonable control.
      
      [Additional clauses and signatures]
    `;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error}`);
  }
}

// ============================================================================
// Scanned PDF OCR Extraction
// ============================================================================

/**
 * Extract text from scanned PDF using OCR
 * @param file - Scanned PDF file
 * @returns Extracted text via OCR
 * 
 * To implement:
 * Install: npm install tesseract.js
 */
async function extractFromScannedPDF(file: File): Promise<string> {
  try {
    // TODO: Implement OCR with tesseract.js
    /*
    const Tesseract = require('tesseract.js');
    
    // Convert PDF pages to images first
    // Then run OCR on each image
    const { data: { text } } = await Tesseract.recognize(
      imageData,
      'eng',
      { logger: m => console.log(m) }
    );
    
    return text;
    */

    console.log('OCR extraction: Feature not yet implemented');
    return 'Scanned PDF detected. OCR functionality not yet implemented.';
  } catch (error) {
    throw new Error(`OCR extraction failed: ${error}`);
  }
}

// ============================================================================
// DOCX Text Extraction
// ============================================================================

/**
 * Extract text from DOCX files (Word 2007+)
 * @param file - DOCX file object
 * @returns Extracted text content
 * 
 * To implement:
 * Install: npm install mammoth
 */
export async function extractFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // TODO: Uncomment when mammoth is installed
    /*
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      console.warn('DOCX extraction warnings:', result.messages);
    }
    
    return result.value;
    */

    // Mock implementation for testing (remove in production)
    console.log('DOCX extraction: Using mock data. Install mammoth for production.');
    return `
      SPECIAL CONDITIONS OF CONTRACT (SCC)
      For Construction Project
      
      1. GENERAL
      These Special Conditions supplement and/or amend the General Conditions of Contract (GCC).
      
      2. RERA COMPLIANCE
      Project Registration Number: K-RERA/RC/2024/5678
      Promoter Registration: PR/KA/9012
      
      3. FINANCIAL TERMS
      Contract Value: Rs. 50,00,000/-
      GST Registration: 29AABCU9603R1ZM
      Stamp Duty: As per Karnataka Stamp Act (5%)
      
      4. EXECUTION TIMELINE
      Commencement: Within 7 days of agreement
      Completion: 12 months from commencement
      
      5. LIQUIDATED DAMAGES
      0.15% per week of delay, maximum 10% of contract value
      
      6. PRICE ESCALATION
      Material price variation allowed for cement and steel as per market rates
      
      7. ENVIRONMENTAL CLEARANCES
      - Environmental Clearance (EC) obtained
      - Consent to Establish (CTE) from KSPCB
      
      8. LABOR COMPLIANCE
      All provisions of Contract Labor Act and Building Workers Act shall be followed
      
      [Additional special conditions...]
    `;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error}`);
  }
}

// ============================================================================
// DOC Text Extraction
// ============================================================================

/**
 * Extract text from legacy DOC files (Word 97-2003)
 * @param file - DOC file object
 * @returns Extracted text content
 * 
 * Note: DOC format is more complex. Consider asking users to save as DOCX.
 */
export async function extractFromDOC(file: File): Promise<string> {
  try {
    // DOC format extraction is more complex
    // Best practice: Convert DOC to DOCX or use cloud service

    console.log('DOC extraction: Legacy format. Recommend converting to DOCX.');
    return 'Legacy DOC format detected. Please convert to DOCX for better extraction.';
  } catch (error) {
    throw new Error(`DOC extraction failed: ${error}`);
  }
}

// ============================================================================
// Metadata Extraction
// ============================================================================

/**
 * Extract metadata from uploaded document
 * @param file - File object
 * @returns Document metadata
 */
export async function extractMetadata(file: File): Promise<DocumentMetadata> {
  const text = await extractTextFromDocument(file);

  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    lastModified: new Date(file.lastModified),
    wordCount: countWords(text),
    extractedDate: new Date(),
  };
}

// ============================================================================
// Full Extraction with Metadata
// ============================================================================

/**
 * Extract both text and metadata from document
 * @param file - File object
 * @returns Complete extraction result
 */
export async function extractDocumentContent(file: File): Promise<ExtractionResult> {
  try {
    const text = await extractTextFromDocument(file);
    const metadata = await extractMetadata(file);

    return {
      text,
      metadata,
      success: true,
    };
  } catch (error) {
    return {
      text: '',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: new Date(file.lastModified),
        extractedDate: new Date(),
      },
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Count words in extracted text
 * @param text - Text content
 * @returns Word count
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Clean extracted text (remove extra whitespace, special characters)
 * @param text - Raw extracted text
 * @returns Cleaned text
 */
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line breaks
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .replace(/\s{2,}/g, ' ') // Remove multiple spaces
    .trim();
}

/**
 * Detect document format from filename
 * @param fileName - Name of the file
 * @returns Document format type
 */
export function detectDocumentFormat(fileName: string): 'GCC' | 'SCC' | 'BOQ' | 'Standard' {
  const lowerName = fileName.toLowerCase();

  if (lowerName.includes('gcc') || lowerName.includes('general conditions')) {
    return 'GCC';
  } else if (lowerName.includes('scc') || lowerName.includes('special conditions')) {
    return 'SCC';
  } else if (lowerName.includes('boq') || lowerName.includes('bill of quantities')) {
    return 'BOQ';
  }
  return 'Standard';
}

/**
 * Validate file size (max 10MB for uploads)
 * @param file - File object
 * @returns Boolean indicating if size is valid
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type (PDF, DOCX, DOC only)
 * @param file - File object
 * @returns Boolean indicating if type is valid
 */
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 * @param fileName - Name of the file
 * @returns File extension (e.g., 'pdf', 'docx')
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  extractTextFromDocument,
  extractFromPDF,
  extractFromDOCX,
  extractFromDOC,
  extractMetadata,
  extractDocumentContent,
  cleanExtractedText,
  detectDocumentFormat,
  validateFileSize,
  validateFileType,
  getFileExtension,
};
