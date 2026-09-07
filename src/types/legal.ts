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

export interface LegalCaseAnalysis {
  category: LegalCategory;
  subcategory: string;
  jurisdiction: Jurisdiction;
  summary: string;
  urgency: UrgencyLevel;
  confidenceScore: number;
  keyIssuesIdentified: string[];
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
  escalationOptions: string[];
}
