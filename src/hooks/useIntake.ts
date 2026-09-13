import { useState, useCallback } from 'react';
import { caseRepository } from '../services/storage/localCaseRepository';
import { CaseModel } from '../types/case';
import { apiCall, checkServerHealth, getApiBaseUrl } from '../lib/apiClient';
import { useVoiceInput } from './useVoiceInput';
import { detectLanguage } from '../services/language/languageDetectorService';
import { useLocalization } from './useLocalization';

export function useIntake() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { currentLanguage } = useLocalization();

  const {
    voiceState,
    voiceError,
    voiceProvider,
    isGnaniActive,
    isGnaniError,
    isRecording,
    isTranscribing,
    toggleVoiceProvider,
    switchProviderToGemini,
    toggleRecording,
    cancelRecording,
    retryVoiceInput,
  } = useVoiceInput((transcript) => {
    if (transcript) {
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    }
  });

  const toggleListening = useCallback(
    (userLanguage?: string) => toggleRecording(userLanguage || currentLanguage || 'en'),
    [toggleRecording, currentLanguage]
  );

  const processIntake = async (problemText?: string): Promise<CaseModel | null> => {
    const textToSubmit = problemText || inputText;
    if (!textToSubmit.trim()) {
      setError('Please describe your legal situation before continuing.');
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Detect user input language automatically
      const detectedLang = detectLanguage(textToSubmit);

      const health = await checkServerHealth();
      if (!health.ok) {
        throw new Error(`Backend server is not reachable at ${getApiBaseUrl()}. Please make sure backend server is running.`);
      }

      setProcessingStage('Understanding legal problem & extracting facts...');
      const caseId = `case-${Date.now()}`;

      const res = await apiCall<{
        success: boolean;
        analysis: any;
        error?: string;
      }>('/api/ai/analyze', {
        problemDescription: textToSubmit,
        userLanguage: detectedLang.code,
        caseId,
      });

      if (!res.success || !res.analysis) {
        throw new Error(res.error || 'Failed to process case intake.');
      }

      const a = res.analysis;
      setProcessingStage('Retrieving authoritative legal sources & building action plan...');

      const newCase: CaseModel = {
        id: caseId,
        caseId,
        title: `${a.subcategory || 'Legal'} Dispute`,
        status: 'active',
        language: detectedLang,
        category: a.category || 'general_legal',
        subcategory: a.subcategory || 'General Legal',
        summary: a.summary || textToSubmit,
        problemSummary: a.normalizedProblem || textToSubmit,
        urgency: a.urgency || 'medium',
        queryIntent: a.queryIntent || 'case_problem',
        aiOverview: a.aiOverview || a.summary || textToSubmit,
        usefulMissingQuestions: a.usefulMissingQuestions || [],
        jurisdiction: a.jurisdiction || {
          country: 'India',
          state: '',
          district: '',
          forumOrCourt: 'Appropriate Legal Authority',
        },
        facts: a.facts || {},
        people: a.people || [],
        organizations: a.organizations || [],
        dates: a.dates || [],
        amounts: a.amounts || [],
        documents: [],
        evidence: a.evidenceNeeded || [],
        missingInformation: a.missingInformation || [],
        riskFlags: a.riskFlags || [],
        legalRoutes: a.possibleRoutes || [],
        recommendedRoute: a.recommendedRoute || 'Legal Notice & Complaint',
        reasoningSummary: a.reasoningSummary || {
          whatUnderstood: `Understood case regarding ${a.subcategory}.`,
          whyThisRoute: 'Recommended route under applicable Indian statutory process.',
          whatIsUnknown: 'Specific contract terms or dates.',
          whatToCollect: 'Proof of payments and written correspondence.',
          whatHappensNext: 'Prepare legal demand notice.',
        },
        actions: a.actions || [],
        deadlines: (a.dates || []).map((d: string) => ({ label: 'Key Date', date: d })),
        sources: a.sources || [],
        actionPlan: {
          caseId,
          title: `${a.subcategory} Action Plan`,
          category: a.category,
          contextMessage: a.summary,
          progressPercentage: Math.round((1 / (a.actions?.length || 1)) * 100),
          steps: (a.actions || []).map((act: any, idx: number) => ({
            id: act.id || `act-${idx + 1}`,
            stepNumber: idx + 1,
            title: act.title,
            description: act.purpose || act.why,
            priority: act.priority || 'medium',
            status: act.status || (idx === 0 ? 'in_progress' : 'pending'),
            reason: act.why || 'Required procedural action step.',
            evidenceRequirements: (act.requiredDocuments || []).map((docName: string, dIdx: number) => ({
              id: `ev-${idx + 1}-${dIdx + 1}`,
              label: docName,
              isRequired: dIdx === 0,
              isUploaded: false,
            })),
            officialProcessUrl: act.officialResource || a.sources?.[0]?.url,
            sourceIds: act.sourceIds || [],
          })),
        },
        timeline: [
          {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: 'Case Intaken',
            description: `Structured legal navigation roadmap created for ${a.subcategory}.`,
            type: 'creation',
          },
        ],
        messages: [
          {
            id: `msg-1`,
            caseId,
            sender: 'user',
            text: textToSubmit,
            timestamp: new Date().toISOString(),
          },
          {
            id: `msg-2`,
            caseId,
            sender: 'system',
            text: `Nyaya Flow understood your situation and generated a ${a.actions?.length || 4}-step actionable legal roadmap supported by official sources.`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      await caseRepository.saveCase(newCase);
      setIsProcessing(false);
      setInputText('');
      return newCase;
    } catch (e: any) {
      console.error('[useIntake] Error processing intake:', e);
      setError(e?.message || 'An error occurred while analyzing your legal situation. Please try again.');
      setIsProcessing(false);
      return null;
    }
  };

  return {
    inputText,
    setInputText,
    voiceState,
    voiceError,
    voiceProvider,
    isGnaniActive,
    isGnaniError,
    isListening: isRecording,
    isTranscribing,
    isProcessing,
    processingStage,
    error,
    toggleVoiceProvider,
    switchProviderToGemini,
    toggleListening,
    cancelVoiceInput: cancelRecording,
    retryVoiceInput,
    processIntake,
  };
}
