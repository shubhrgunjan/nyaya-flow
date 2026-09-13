import { transformAnalysisToActionPlan } from '../src/domain/actions/actionPlanTransformer';
import { LegalCaseAnalysis } from '../src/types/legal';

describe('actionPlanTransformer', () => {
  const sampleAnalysis: LegalCaseAnalysis = {
    id: 'test-analysis-1',
    language: 'en',
    normalizedProblem: 'Landlord refused deposit refund.',
    category: 'tenant_dispute',
    subcategory: 'Security Deposit Non-Refund',
    jurisdiction: {
      country: 'India',
      state: 'Delhi',
      district: 'New Delhi',
      forumOrCourt: 'District Rent Tribunal',
    },
    facts: {},
    people: [],
    organizations: [],
    dates: [],
    amounts: [],
    summary: 'Landlord refused deposit refund.',
    urgency: 'high',
    riskFlags: [],
    uncertainties: [],
    confidenceScore: 0.95,
    keyIssuesIdentified: ['Deposit withholding'],
    evidenceNeeded: ['Rental Agreement', 'Payment Proof'],
    possibleRoutes: ['Notice', 'Tribunal'],
    recommendedRoute: 'Send Legal Notice',
    suggestedActionSteps: [],
    requiredDocumentsList: ['Rental Agreement', 'Payment Proof'],
    officialResources: [{ title: 'Consumer Portal', url: 'https://consumerhelpline.gov.in' }],
    officialForms: [],
    recommendedVideos: [],
    legalSources: [],
    escalationOptions: ['NALSA Legal Aid'],
    disclaimer: 'Legal guidance only',
  };

  it('should transform analysis into a 4-step ActionPlan', () => {
    const plan = transformAnalysisToActionPlan('test-case-1', sampleAnalysis);

    expect(plan.caseId).toBe('test-case-1');
    expect(plan.category).toBe('tenant_dispute');
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps[0].title).toBe('Collect your evidence');
    expect(plan.steps[1].title).toBe('Prepare a formal notice');
    expect(plan.steps[2].title).toBe('File the appropriate complaint');
    expect(plan.steps[3].title).toBe('Escalate if unresolved');
  });

  it('should format required documents as evidence items in step 1', () => {
    const plan = transformAnalysisToActionPlan('test-case-2', sampleAnalysis);
    const step1 = plan.steps[0];

    expect(step1.evidenceRequirements).toHaveLength(2);
    expect(step1.evidenceRequirements[0].label).toBe('Rental Agreement');
    expect(step1.evidenceRequirements[0].isRequired).toBe(true);
  });
});
