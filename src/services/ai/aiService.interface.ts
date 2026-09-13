import { LegalCaseAnalysis } from '../../types/legal';
import { ActionPlan } from '../../types/actionPlan';

export interface IAIService {
  analyzeProblem(problemDescription: string, userLanguage?: string): Promise<LegalCaseAnalysis>;
  analyzeDocument(documentUri: string, contextCaseId?: string): Promise<LegalCaseAnalysis>;
  generateActionPlan(caseId: string, analysis: LegalCaseAnalysis): Promise<ActionPlan>;
  generateDocumentDraft(caseId: string, templateType: string): Promise<string>;
}
