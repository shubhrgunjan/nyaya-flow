import { calculateCaseProgress } from '../src/domain/cases/progressCalculator';
import { ActionStep } from '../src/types/actionPlan';

describe('calculateCaseProgress', () => {
  it('should return 0 for empty steps', () => {
    expect(calculateCaseProgress([])).toBe(0);
  });

  it('should calculate 100% when all steps are completed', () => {
    const steps: ActionStep[] = [
      { id: '1', stepNumber: 1, title: 'Step 1', description: '', priority: 'high', status: 'completed', reason: '', evidenceRequirements: [] },
      { id: '2', stepNumber: 2, title: 'Step 2', description: '', priority: 'high', status: 'completed', reason: '', evidenceRequirements: [] },
      { id: '3', stepNumber: 3, title: 'Step 3', description: '', priority: 'medium', status: 'completed', reason: '', evidenceRequirements: [] },
      { id: '4', stepNumber: 4, title: 'Step 4', description: '', priority: 'low', status: 'completed', reason: '', evidenceRequirements: [] },
    ];

    expect(calculateCaseProgress(steps)).toBe(100);
  });

  it('should calculate partial progress for in_progress steps', () => {
    const steps: ActionStep[] = [
      { id: '1', stepNumber: 1, title: 'Step 1', description: '', priority: 'high', status: 'completed', reason: '', evidenceRequirements: [] },
      { id: '2', stepNumber: 2, title: 'Step 2', description: '', priority: 'high', status: 'in_progress', reason: '', evidenceRequirements: [] },
      { id: '3', stepNumber: 3, title: 'Step 3', description: '', priority: 'medium', status: 'pending', reason: '', evidenceRequirements: [] },
      { id: '4', stepNumber: 4, title: 'Step 4', description: '', priority: 'low', status: 'pending', reason: '', evidenceRequirements: [] },
    ];

    const progress = calculateCaseProgress(steps);
    expect(progress).toBeGreaterThan(25);
    expect(progress).toBeLessThan(50);
  });
});
