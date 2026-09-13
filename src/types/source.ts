export interface LegalSource {
  id: string;
  title: string;
  publisher: string;
  sourceType: 'official_government' | 'official_court' | 'primary_law' | 'official_portal' | 'institutional' | 'legal_database' | 'educational' | 'youtube';
  url: string;
  retrievedAt?: string;
  provider: string;
  relevance: string;
  supports?: string[]; // array of action IDs or claim IDs supported by this source
  instructions?: string[];
  actionButtonText?: string;
}
