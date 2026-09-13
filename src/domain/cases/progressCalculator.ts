import { ActionStep } from '../../types/actionPlan';

export function calculateCaseProgress(steps: ActionStep[]): number {
  if (!steps || steps.length === 0) return 0;

  let completedWeight = 0;

  for (const step of steps) {
    const stepWeight = 100 / steps.length;

    if (step.status === 'completed') {
      completedWeight += stepWeight;
    } else if (step.status === 'in_progress') {
      // Step in progress gives partial weight (e.g. 40% of step)
      completedWeight += stepWeight * 0.4;

      // Check evidence requirement completion within step 1
      if (step.evidenceRequirements && step.evidenceRequirements.length > 0) {
        const uploaded = step.evidenceRequirements.filter((e) => e.isUploaded).length;
        const totalReq = step.evidenceRequirements.length;
        const evidenceRatio = uploaded / totalReq;
        completedWeight += stepWeight * 0.4 * evidenceRatio;
      }
    }
  }

  return Math.min(100, Math.round(completedWeight));
}
