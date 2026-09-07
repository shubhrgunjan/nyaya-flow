import { LegalCategory, ResourceLink } from './legal';

export type StepPriority = 'low' | 'medium' | 'high';
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface EvidenceRequirement {
  id: string;
  label: string;
  isRequired: boolean;
  isUploaded: boolean;
  documentId?: string;
}

export interface ActionStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  priority: StepPriority;
  status: StepStatus;
  reason: string;
  evidenceRequirements: EvidenceRequirement[];
  resourceLinks?: ResourceLink[];
  draftTemplate?: {
    templateTitle: string;
    content: string;
  };
  officialProcessUrl?: string;
}

export interface ActionPlan {
  caseId: string;
  title: string;
  category: LegalCategory;
  contextMessage: string;
  steps: ActionStep[];
  progressPercentage: number;
}
