import { LegalCaseAnalysis } from '../../types/legal';
import { ActionPlan, ActionStep } from '../../types/actionPlan';

export function transformAnalysisToActionPlan(
  caseId: string,
  analysis: LegalCaseAnalysis
): ActionPlan {
  const steps: ActionStep[] = [
    {
      id: `${caseId}-step-1`,
      stepNumber: 1,
      title: 'Collect your evidence',
      description: 'Gather all foundational documents, receipts, and correspondence before sending a notice or filing.',
      priority: 'high',
      status: 'in_progress',
      reason: 'Having strong evidence is required before any formal legal communication in India.',
      evidenceRequirements: analysis.requiredDocumentsList.map((docName, index) => ({
        id: `ev-${index + 1}`,
        label: docName,
        isRequired: index === 0 || index === 1,
        isUploaded: false,
      })),
      resourceLinks: analysis.officialResources,
    },
    {
      id: `${caseId}-step-2`,
      stepNumber: 2,
      title: 'Prepare a formal notice',
      description: 'Draft a clear, formal legal notice outlining your demand and a reasonable timeline (e.g., 15 days) to comply.',
      priority: 'high',
      status: 'pending',
      reason: 'A legal notice serves as official notice before proceeding to Consumer Court or RERA tribunal.',
      evidenceRequirements: [],
      draftTemplate: {
        templateTitle: `Legal Notice Draft: ${analysis.subcategory}`,
        content: `LEGAL NOTICE\n\nTo,\nThe Opposite Party\n\nSUBJECT: DEMAND FOR RESOLUTION OF ${analysis.subcategory.toUpperCase()} UNDER APPLICABLE LAWS OF ${analysis.jurisdiction.country}\n\nSir/Madam,\n\nUnder instructions from our user, this notice demands the immediate resolution of the following dispute:\n\n${analysis.summary}\n\nYou are hereby given 15 days from the receipt of this notice to refund/resolve the matter, failing which appropriate legal proceedings shall be initiated in ${analysis.jurisdiction.forumOrCourt}.\n\nIssued on: ${new Date().toLocaleDateString('en-IN')}`,
      },
    },
    {
      id: `${caseId}-step-3`,
      stepNumber: 3,
      title: 'File the appropriate complaint',
      description: `Submit your formal grievance to ${analysis.jurisdiction.forumOrCourt}.`,
      priority: 'medium',
      status: 'pending',
      reason: `If the opposite party fails to respond within 15 days, filing in ${analysis.jurisdiction.forumOrCourt} provides binding legal remedy.`,
      evidenceRequirements: [],
      officialProcessUrl: analysis.officialResources[0]?.url || 'https://consumerhelpline.gov.in',
    },
    {
      id: `${caseId}-step-4`,
      stepNumber: 4,
      title: 'Escalate if unresolved',
      description: 'Explore legal aid services, arbitration, or district advocate representation.',
      priority: 'low',
      status: 'pending',
      reason: 'Necessary if the opposite party contests or ignores regulatory tribunal directions.',
      evidenceRequirements: [],
      resourceLinks: analysis.escalationOptions.map((opt, _i) => ({
        title: opt,
        url: 'https://nalsa.gov.in',
      })),
    },
  ];

  return {
    caseId,
    title: `${analysis.subcategory} Dispute`,
    category: analysis.category,
    contextMessage: 'We understand your situation. Here is your step-by-step navigation plan.',
    steps,
    progressPercentage: 10,
  };
}
