import { CaseModel, CaseDocument, TimelineEvent, CaseStatus } from '../../types/case';
import { calculateCaseProgress } from './progressCalculator';

export function addDocumentToCase(
  caseItem: CaseModel,
  doc: Omit<CaseDocument, 'caseId'>
): CaseModel {
  const newDocument: CaseDocument = {
    ...doc,
    caseId: caseItem.id,
  };

  const newTimelineEvent: TimelineEvent = {
    id: `tl-${Date.now()}`,
    timestamp: new Date().toISOString(),
    title: 'Document Added',
    description: `Uploaded evidence document: ${doc.fileName}`,
    type: 'document_added',
  };

  const currentSteps = caseItem.actions || caseItem.actionPlan?.steps || [];
  const updatedSteps = currentSteps.map((step) => {
    if (step.stepNumber === 1 && step.evidenceRequirements && step.evidenceRequirements.length > 0) {
      const updatedEv = step.evidenceRequirements.map((req) => {
        if (!req.isUploaded) {
          return { ...req, isUploaded: true, documentId: doc.id };
        }
        return req;
      });
      const allDone = updatedEv.every((e) => e.isUploaded);
      return {
        ...step,
        evidenceRequirements: updatedEv,
        status: allDone ? ('completed' as const) : ('in_progress' as const),
      };
    }
    return step;
  });

  const newProgress = calculateCaseProgress(updatedSteps);

  return {
    ...caseItem,
    documents: [...(caseItem.documents || []), newDocument],
    timeline: [newTimelineEvent, ...(caseItem.timeline || [])],
    actions: updatedSteps,
    actionPlan: {
      ...caseItem.actionPlan,
      steps: updatedSteps,
      progressPercentage: newProgress,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function updateStepStatus(
  caseItem: CaseModel,
  stepId: string,
  newStatus: 'pending' | 'in_progress' | 'completed' | 'skipped'
): CaseModel {
  const currentSteps = caseItem.actions || caseItem.actionPlan?.steps || [];
  const updatedSteps = currentSteps.map((step) => {
    if (step.id === stepId) {
      return { ...step, status: newStatus };
    }
    return step;
  });

  const newTimelineEvent: TimelineEvent = {
    id: `tl-${Date.now()}`,
    timestamp: new Date().toISOString(),
    title: 'Step Completed',
    description: `Action step updated to ${newStatus}`,
    type: 'step_completed',
  };

  const newProgress = calculateCaseProgress(updatedSteps);

  let updatedStatus: CaseStatus = caseItem.status;
  if (newProgress >= 100) {
    updatedStatus = 'resolved';
  } else if (updatedSteps.some((s) => s.stepNumber === 2 && s.status === 'completed')) {
    updatedStatus = 'in_notice';
  } else if (updatedSteps.some((s) => s.stepNumber === 3 && s.status === 'completed')) {
    updatedStatus = 'filed';
  }

  return {
    ...caseItem,
    status: updatedStatus,
    actions: updatedSteps,
    actionPlan: {
      ...caseItem.actionPlan,
      steps: updatedSteps,
      progressPercentage: newProgress,
    },
    timeline: [newTimelineEvent, ...(caseItem.timeline || [])],
    updatedAt: new Date().toISOString(),
  };
}

export function addOrUpdateDraftInCase(
  caseItem: CaseModel,
  draftTitle: string,
  documentType: string,
  content: string,
  createdBy: 'ai' | 'user' = 'ai',
  changeNote: string = 'Initial draft generated'
): CaseModel {
  const existingDrafts = caseItem.drafts || [];
  const existingIndex = existingDrafts.findIndex(
    (d) => d.documentType.toLowerCase() === documentType.toLowerCase() || d.title.toLowerCase() === draftTitle.toLowerCase()
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    const draft = existingDrafts[existingIndex];
    const newVersionNumber = draft.versions.length + 1;
    const newVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: newVersionNumber,
      content,
      createdAt: now,
      createdBy,
      changeNote,
    };

    const updatedDraft = {
      ...draft,
      versions: [...draft.versions, newVersion],
      currentVersionIndex: draft.versions.length,
      updatedAt: now,
    };

    const newDrafts = [...existingDrafts];
    newDrafts[existingIndex] = updatedDraft;

    return {
      ...caseItem,
      drafts: newDrafts,
      updatedAt: now,
    };
  } else {
    const newDraft = {
      id: `draft-${Date.now()}`,
      caseId: caseItem.id,
      title: draftTitle,
      documentType,
      versions: [
        {
          id: `ver-${Date.now()}`,
          versionNumber: 1,
          content,
          createdAt: now,
          createdBy,
          changeNote,
        },
      ],
      currentVersionIndex: 0,
      status: 'draft' as const,
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...caseItem,
      drafts: [newDraft, ...existingDrafts],
      updatedAt: now,
    };
  }
}

export function updateDraftContentManually(
  caseItem: CaseModel,
  draftId: string,
  newContent: string
): CaseModel {
  const existingDrafts = caseItem.drafts || [];
  const index = existingDrafts.findIndex((d) => d.id === draftId);
  if (index < 0) return caseItem;

  const draft = existingDrafts[index];
  const currentVer = draft.versions[draft.currentVersionIndex];

  // Update current version in place if modified by user, or push new user edit version
  const updatedVersions = [...draft.versions];
  updatedVersions[draft.currentVersionIndex] = {
    ...currentVer,
    content: newContent,
    createdAt: new Date().toISOString(),
    changeNote: 'Manual edit by user',
  };

  const updatedDraft = {
    ...draft,
    versions: updatedVersions,
    updatedAt: new Date().toISOString(),
  };

  const newDrafts = [...existingDrafts];
  newDrafts[index] = updatedDraft;

  return {
    ...caseItem,
    drafts: newDrafts,
    updatedAt: new Date().toISOString(),
  };
}

