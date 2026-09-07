export interface ScannedDocument {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number;
  scannedAt: string;
}

export interface DocumentAnalysisResult {
  id: string;
  documentType: string;
  keyDates: string[];
  extractedEntities: Record<string, string>;
  summary: string;
  confidenceScore: number;
}
