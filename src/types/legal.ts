export type LegalCategory =
  | 'tenant_dispute'
  | 'consumer_rights'
  | 'employment'
  | 'property_dispute'
  | 'banking_fraud'
  | 'cyber_crime'
  | 'general_legal';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Jurisdiction {
  country: 'India';
  state?: string;
  district?: string;
  forumOrCourt: string;
}

export interface ResourceLink {
  title: string;
  url: string;
  description?: string;
}

export interface OfficialForm {
  formId: string;
  title: string;
  issuingAuthority: string;
  downloadUrl?: string;
}

export interface LegalSourceCitation {
  actName: string;
  sectionNumber: string;
  sectionTitle: string;
  excerpt: string;
  officialSourceUrl: string;
}

export interface LegalCaseAnalysis {
  id: string;
  language: string;
  normalizedProblem: string;
  category: LegalCategory;
  subcategory: string;
  jurisdiction: Jurisdiction;
  facts: Record<string, any>;
  people: string[];
  organizations: string[];
  dates: string[];
  amounts: string[];
  summary: string;
  urgency: UrgencyLevel;
  riskFlags: string[];
  uncertainties: string[];
  confidenceScore: number;
  keyIssuesIdentified: string[];
  evidenceNeeded: string[];
  possibleRoutes: string[];
  recommendedRoute: string;
  suggestedActionSteps: {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    requiredDocuments: string[];
    officialLinks?: ResourceLink[];
  }[];
  requiredDocumentsList: string[];
  officialResources: ResourceLink[];
  officialForms: OfficialForm[];
  recommendedVideos: ResourceLink[];
  legalSources: LegalSourceCitation[];
  escalationOptions: string[];
  disclaimer: string;
}

