import { LegalCategory, UrgencyLevel } from './legal';
import { ActionPlan } from './actionPlan';

export type CaseStatus = 'active' | 'in_notice' | 'filed' | 'resolved' | 'archived';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'creation' | 'document_added' | 'step_completed' | 'notice_generated' | 'status_change';
}

export interface CaseDocument {
  id: string;
  caseId: string;
  fileName: string;
  fileUri: string;
  mimeType: string;
  scannedAt: string;
  documentCategory?: string;
  extractedSummary?: string;
}

export interface CaseModel {
  id: string;
  title: string;
  category: LegalCategory;
  jurisdiction: string;
  summary: string;
  urgency: UrgencyLevel;
  status: CaseStatus;
  nextActionTitle: string;
  deadlineDate?: string;
  deadlineDaysRemaining?: number;
  actionPlan: ActionPlan;
  documents: CaseDocument[];
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}
