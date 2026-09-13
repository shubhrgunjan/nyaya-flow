import { IAIService } from './aiService.interface';
import { LegalCaseAnalysis, LegalCategory } from '../../types/legal';
import { ActionPlan } from '../../types/actionPlan';
import { transformAnalysisToActionPlan } from '../../domain/actions/actionPlanTransformer';

export class MockAIService implements IAIService {
  async analyzeProblem(problemDescription: string, _userLanguage: string = 'en'): Promise<LegalCaseAnalysis> {
    // Simulate natural AI network processing latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const lower = problemDescription.toLowerCase();

    let category: LegalCategory = 'general_legal';
    let subcategory = 'General Legal Dispute';

    if (lower.includes('deposit') || lower.includes('landlord') || lower.includes('rent') || lower.includes('tenant')) {
      category = 'tenant_dispute';
      subcategory = 'Security Deposit Non-Refund';
    } else if (lower.includes('defective') || lower.includes('refund') || lower.includes('ecommerce') || lower.includes('service')) {
      category = 'consumer_rights';
      subcategory = 'Consumer Product Deficiency';
    } else if (lower.includes('salary') || lower.includes('fired') || lower.includes('boss') || lower.includes('notice period')) {
      category = 'employment';
      subcategory = 'Employment Salary Claim';
    }

    return {
      id: `case-${Date.now()}`,
      language: _userLanguage || 'en',
      normalizedProblem: problemDescription,
      category,
      subcategory,
      jurisdiction: {
        country: 'India',
        state: 'Delhi',
        district: 'New Delhi',
        forumOrCourt: category === 'tenant_dispute' ? 'Rent Control Tribunal / Small Causes Court' : 'District Consumer Disputes Redressal Commission',
      },
      facts: {},
      people: [],
      organizations: [],
      dates: [],
      amounts: [],
      summary: problemDescription || 'Landlord has withheld security deposit without providing itemized deduction receipt despite completion of lease tenancy term.',
      urgency: 'high',
      riskFlags: [],
      uncertainties: [],
      confidenceScore: 0.92,
      keyIssuesIdentified: [
        'Unlawful withholding of security deposit',
        'Failure to provide itemized maintenance invoice',
        'Breach of rental agreement obligations',
      ],
      evidenceNeeded: ['Rental Agreement', 'Payment Proof'],
      possibleRoutes: ['Notice', 'Tribunal Filing'],
      recommendedRoute: 'Send Statutory Demand Notice',
      suggestedActionSteps: [
        {
          title: 'Collect your evidence',
          description: 'Gather rental agreement, rent payment receipts, and WhatsApp/Email communications with landlord.',
          priority: 'high',
          requiredDocuments: ['Rental Agreement', 'Rent & Deposit Payment Proof', 'Written Communications / Messages'],
        },
        {
          title: 'Prepare a formal legal notice',
          description: 'Draft legal notice asserting 15-day compliance deadline to return deposit amount.',
          priority: 'high',
          requiredDocuments: ['Draft Notice Copy'],
        },
        {
          title: 'File complaint in Consumer / Rent Forum',
          description: 'Submit formal petition under Consumer Protection Act 2019 / State Rent Act.',
          priority: 'medium',
          requiredDocuments: ['Filing Affidavit', 'Affixed Court Fee Stamp'],
        },
      ],
      requiredDocumentsList: [
        'Rental Agreement / Lease Deed',
        'Payment Proof (Bank Statement / UPI Receipt)',
        'Written Communications / WhatsApp Export',
        'Bank Details for Refund',
      ],
      officialResources: [
        {
          title: 'National Consumer Helpline (NCH Portal)',
          url: 'https://consumerhelpline.gov.in',
          description: 'Official Government portal to lodge grievances directly.',
        },
        {
          title: 'National Legal Services Authority (NALSA)',
          url: 'https://nalsa.gov.in',
          description: 'Free legal aid information for Indian citizens.',
        },
      ],
      officialForms: [
        {
          formId: 'Form-A-Notice',
          title: 'Standard Statutory Demand Notice Format',
          issuingAuthority: 'Bar Council Standard Guidelines',
        },
      ],
      recommendedVideos: [
        {
          title: 'Understanding Tenant Deposit Rights in India',
          url: 'https://youtube.com/watch?v=example',
        },
      ],
      escalationOptions: [
        'Lodge grievance via e-Daakhil Portal',
        'Consult a certified Real Estate & Rent Lawyer',
      ],
      legalSources: [
        {
          actName: 'Transfer of Property Act, 1882',
          sectionNumber: 'Section 108',
          sectionTitle: 'Rights and Liabilities of Lessor and Lessee',
          excerpt: 'Lessor bound to disclose defects and restore tenant possession/deposit on lease determination.',
          officialSourceUrl: 'https://www.indiacode.nic.in',
        },
      ],
      disclaimer: 'This response is for navigational guidance only and does not constitute legal advice.',
    };
  }

  async analyzeDocument(_documentUri: string, _contextCaseId?: string): Promise<LegalCaseAnalysis> {
    return this.analyzeProblem('Scanned Document Analysis: Security deposit terms, clause 4 lease deed inspection.', 'en');
  }

  async generateActionPlan(caseId: string, analysis: LegalCaseAnalysis): Promise<ActionPlan> {
    return transformAnalysisToActionPlan(caseId, analysis);
  }

  async generateDocumentDraft(_caseId: string, _templateType: string): Promise<string> {
    return `LEGAL NOTICE\n\nRE: DEMAND FOR RETURN OF SECURITY DEPOSIT\n\nNotice is hereby served demanding full refund of security deposit within 15 days under applicable state tenant laws.`;
  }
}
