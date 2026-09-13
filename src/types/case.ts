import { LegalCategory, UrgencyLevel } from './legal';
import { ActionPlan, ActionStep } from './actionPlan';
import { LegalSource } from './source';
import { CaseLanguage } from './i18n';

export type CaseStatus = 'active' | 'in_notice' | 'filed' | 'resolved' | 'archived';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'creation' | 'document_added' | 'step_completed' | 'notice_generated' | 'status_change' | 'case_updated';
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
  extractedDate?: string;
  extractedAmount?: string;
}

export interface CaseDraftVersion {
  id: string;
  versionNumber: number;
  content: string;
  createdAt: string;
  createdBy: 'ai' | 'user';
  changeNote?: string;
}

export interface CaseDraft {
  id: string;
  caseId: string;
  title: string;
  documentType: string;
  versions: CaseDraftVersion[];
  currentVersionIndex: number;
  status: 'draft' | 'final';
  missingInfo?: string[];
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | 'conversation'
  | 'question'
  | 'new_fact'
  | 'correction'
  | 'evidence'
  | 'document'
  | 'action_completed'
  | 'route_change'
  | 'draft_request'
  | 'draft_revision';

export interface StructuredCaseEvent {
  id: string;
  timestamp: string;
  type: EventType;
  summary: string;
  payload?: any;
}

export interface ContextualAction {
  id: string;
  label: string;
  actionType: 'generate_draft' | 'ask_followup' | 'upload_evidence' | 'complete_step' | 'external_link';
  payload?: any;
}

export interface CaseChatMessage {
  id: string;
  caseId: string;
  sender: 'user' | 'system' | 'ai';
  text: string;
  timestamp: string;
  affectsCaseState?: boolean;
  explanation?: string;
  eventType?: EventType;
  actions?: ContextualAction[];
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUri: string;
    mimeType: string;
    extractedType?: string;
    extractedSummary?: string;
  }>;
  missingQuestions?: string[];
  suggestedDraftType?: string;
}

export interface StructuredReasoningSummary {
  whatUnderstood: string;
  whyThisRoute: string;
  whatIsUnknown: string;
  whatToCollect: string;
  whatHappensNext: string;
}

export interface DynamicMissingQuestion {
  id?: string;
  question: string;
  whyItMatters?: string;
  inputType?: 'text' | 'document' | 'image' | 'yes_no' | 'multi_option' | 'optional';
  options?: string[];
  priority?: number;
}

export interface CaseModel {
  id: string;
  caseId: string;
  ownerUid?: string;
  title: string;
  status: CaseStatus;
  language: string | CaseLanguage;
  category: LegalCategory;
  subcategory: string;
  summary: string;
  problemSummary: string;
  urgency: UrgencyLevel;
  queryIntent?: 'informational' | 'navigational' | 'case_problem' | 'actionable_matter';
  aiOverview?: string;
  usefulMissingQuestions?: DynamicMissingQuestion[];
  jurisdiction: {
    country: string;
    state: string;
    district: string;
    forumOrCourt: string;
  };
  facts: Record<string, any>;
  people: string[];
  organizations?: string[];
  dates: string[];
  amounts: string[];
  documents: CaseDocument[];
  evidence: string[];
  missingInformation: string[];
  riskFlags: string[];
  legalRoutes: string[];
  recommendedRoute: string;
  reasoningSummary: StructuredReasoningSummary;
  actions: ActionStep[];
  deadlines: { label: string; date: string; isPassed?: boolean }[];
  sources: LegalSource[];
  actionPlan: ActionPlan;
  timeline: TimelineEvent[];
  messages?: CaseChatMessage[];
  drafts?: CaseDraft[];
  structuredEvents?: StructuredCaseEvent[];
  memoryContext?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastAiUpdateAt?: string;
  verifiedAnalysis?: boolean;
  version: number;
}

