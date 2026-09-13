import { useState, useEffect, useCallback } from 'react';
import { CaseModel, CaseDocument } from '../types/case';
import { caseRepository } from '../services/storage/localCaseRepository';
import { updateStepStatus, addDocumentToCase } from '../domain/cases/caseManager';

export function useCases() {
  const [cases, setCases] = useState<CaseModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reloadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseRepository.getAllCases();
      setCases(data);
    } catch {
      setError('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadCases();
  }, [reloadCases]);

  const saveCase = async (newCase: CaseModel) => {
    await caseRepository.saveCase(newCase);
    await reloadCases();
  };

  const setStepStatus = async (
    caseId: string,
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) => {
    const existing = await caseRepository.getCaseById(caseId);
    if (existing) {
      const updated = updateStepStatus(existing, stepId, status);
      await caseRepository.saveCase(updated);
      await reloadCases();
      return updated;
    }
    return null;
  };

  const attachDocument = async (caseId: string, doc: Omit<CaseDocument, 'caseId'>) => {
    const existing = await caseRepository.getCaseById(caseId);
    if (existing) {
      const updated = addDocumentToCase(existing, doc);
      await caseRepository.saveCase(updated);
      await reloadCases();
      return updated;
    }
    return null;
  };

  return {
    cases,
    loading,
    error,
    reloadCases,
    saveCase,
    setStepStatus,
    attachDocument,
  };
}
