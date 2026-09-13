import { IAIService } from './aiService.interface';
import { LegalCaseAnalysis } from '../../types/legal';
import { ActionPlan, ActionStep } from '../../types/actionPlan';
import { CaseModel } from '../../types/case';
import { apiCall, checkServerHealth, API_BASE_URL } from '../../lib/apiClient';

export class GeminiRealService implements IAIService {
  async analyzeProblem(problemDescription: string, userLanguage: string = 'en'): Promise<LegalCaseAnalysis> {
    const caseId = `case-${Date.now()}`;
    const detectedLang = this.detectLanguage(problemDescription, userLanguage);

    const health = await checkServerHealth();
    if (!health.ok) {
      throw new Error(`Backend server is not reachable at ${API_BASE_URL}. Please start backend server.`);
    }
    if (!health.geminiConfigured) {
      throw new Error('Gemini API Key is not set in server/.env file.');
    }

    // Call AI Orchestrator endpoint on backend
    const response = await apiCall<{
      success: boolean;
      analysis: any;
      error?: string;
      meta?: any;
    }>('/api/ai/analyze', {
      problemDescription,
      userLanguage: detectedLang,
      caseId,
    });

    if (!response.success || !response.analysis) {
      throw new Error(response.error || 'AI Orchestration pipeline failed to analyze legal problem.');
    }

    const a = response.analysis;

    return {
      id: caseId,
      language: detectedLang,
      normalizedProblem: a.normalizedProblem || problemDescription,
      summary: a.summary || problemDescription,
      category: a.category || 'general_legal',
      subcategory: a.subcategory || 'Legal Consultation',
      jurisdiction: {
        country: 'India',
        state: a.jurisdiction?.state || '',
        district: a.jurisdiction?.district || '',
        forumOrCourt: a.jurisdiction?.forumOrCourt || 'Appropriate Legal Forum',
      },
      facts: a.facts || {},
      people: a.people || [],
      organizations: a.organizations || [],
      dates: a.dates || [],
      amounts: a.amounts || [],
      urgency: a.urgency || 'medium',
      riskFlags: a.riskFlags || [],
      uncertainties: a.missingInformation || [],
      confidenceScore: a.confidence || 0.9,
      keyIssuesIdentified: a.possibleRoutes || [],
      evidenceNeeded: a.evidenceNeeded || [],
      possibleRoutes: a.possibleRoutes || [],
      recommendedRoute: a.recommendedRoute || '',
      suggestedActionSteps: (a.actions || []).map((step: any) => ({
        title: step.title,
        description: step.purpose || step.why,
        priority: step.priority || 'medium',
        requiredDocuments: step.requiredDocuments || [],
      })),
      requiredDocumentsList: a.evidenceNeeded || [],
      officialResources: (a.sources || []).map((s: any) => ({
        title: s.title,
        url: s.url,
        description: s.relevance || s.description,
      })),
      officialForms: [],
      recommendedVideos: [],
      legalSources: (a.sources || []).map((s: any) => ({
        actName: s.publisher || s.title,
        sectionNumber: s.id,
        sectionTitle: s.title,
        excerpt: s.relevance,
        officialSourceUrl: s.url,
      })),
      escalationOptions: a.escalationOptions || [],
      disclaimer: 'Nyaya Flow provides legal navigation & guidance, not formal attorney representation.',
    };
  }

  async analyzeDocument(documentUri: string, contextCaseId?: string): Promise<LegalCaseAnalysis> {
    const baseAnalysis = await this.analyzeProblem('Uploaded legal document for analysis', 'en');
    return {
      ...baseAnalysis,
      id: contextCaseId || baseAnalysis.id,
      normalizedProblem: 'Uploaded legal document analysis',
    };
  }

  async generateActionPlan(caseId: string, analysis: LegalCaseAnalysis): Promise<ActionPlan> {
    const steps: ActionStep[] = (analysis.suggestedActionSteps || []).map((step: any, idx: number) => ({
      id: `step-${idx + 1}`,
      stepNumber: idx + 1,
      title: step.title,
      description: step.description,
      priority: step.priority || 'medium',
      status: idx === 0 ? 'in_progress' : 'pending',
      reason: step.description || `Required step for your ${analysis.category} dispute.`,
      evidenceRequirements: (step.requiredDocuments || []).map((docName: string, dIdx: number) => ({
        id: `ev-${idx + 1}-${dIdx + 1}`,
        label: docName,
        isRequired: dIdx === 0,
        isUploaded: false,
      })),
      resourceLinks: analysis.officialResources,
      officialProcessUrl: analysis.officialResources[0]?.url || 'https://consumerhelpline.gov.in',
    }));

    return {
      caseId,
      title: `${analysis.category.replace('_', ' ').toUpperCase()}: Action Plan`,
      category: analysis.category,
      contextMessage: analysis.summary,
      steps,
      progressPercentage: Math.round((1 / (steps.length || 1)) * 100),
    };
  }

  async generateDocumentDraft(caseId: string, templateType: string): Promise<string> {
    return `LEGAL DEMAND NOTICE\n\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nTo,\nOpposing Party / Landlord / Vendor\n\nSubject: Formal Legal Demand Notice regarding ${templateType.replace('_', ' ')}\n\nSir/Madam,\n\nYou are hereby requested to resolve the dispute and satisfy the claim within 15 days of receipt of this notice, failing which appropriate legal proceedings shall be initiated before the competent Court / Commission.\n\nYours faithfully,\nAuthorized Claimant`;
  }

  private detectLanguage(input: string, preferred: string): string {
    if (/[\u0900-\u097F]/.test(input)) return 'hi';
    const lower = input.toLowerCase();
    if (lower.includes('hai') || lower.includes('mera') || lower.includes('kar') || lower.includes('nahi')) return 'hinglish';
    return preferred || 'en';
  }
}

export const geminiRealService = new GeminiRealService();
