export interface ScannedDocument {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  scannedAt: string;
  storagePath?: string;
}

export interface DocumentAnalysisResult {
  id: string;
  documentType: string;
  issuer?: string;
  recipient?: string;
  date?: string;
  referenceNumber?: string;
  deadline?: string;
  amounts: string[];
  importantClauses: string[];
  keyDates: string[];
  extractedEntities: Record<string, string>;
  summary: string;
  legalRelevance: string;
  riskFlags: string[];
  confidenceScore: number;
}

