import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { theme } from '../../src/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { caseRepository } from '../../src/services/storage/localCaseRepository';
import { CaseModel, CaseChatMessage, CaseDocument, CaseDraft, ContextualAction, DynamicMissingQuestion } from '../../src/types/case';
import { ActionStep } from '../../src/types/actionPlan';
import { Header } from '../../src/components/common/Header';
import { LegalDisclaimerBanner } from '../../src/components/common/LegalDisclaimerBanner';
import { apiCall } from '../../src/lib/apiClient';
import { LegalFlowBackground } from '../../src/components/common/LegalFlowBackground';
import { LegalRoadmapGraph } from '../../src/components/actionPlan/LegalRoadmapGraph';
import { LegalStamp } from '../../src/components/common/LegalStamp';
import { EvidenceCard } from '../../src/components/common/EvidenceCard';
import { SourceBadge } from '../../src/components/common/SourceBadge';
import { addOrUpdateDraftInCase, updateDraftContentManually } from '../../src/domain/cases/caseManager';
import { useVoiceInput } from '../../src/hooks/useVoiceInput';
import { LanguageSelector } from '../../src/components/common/LanguageSelector';
import { CaseLanguage } from '../../src/types/i18n';
import { VoiceProviderToggle } from '../../src/components/common/VoiceProviderToggle';

interface PendingAttachment {
  id: string;
  fileName: string;
  fileUri: string;
  mimeType: string;
  base64?: string;
}

export default function CaseWorkspaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const chatScrollViewRef = useRef<ScrollView>(null);

  const [caseItem, setCaseItem] = useState<CaseModel | null>(null);
  const [loading, setLoading] = useState(true);

  // Missing question inline response state
  const [missingAnswersInput, setMissingAnswersInput] = useState<Record<string, string>>({});
  const [submittingAnswerIdx, setSubmittingAnswerIdx] = useState<number | null>(null);

  // Follow-up interaction modal
  const [activeFollowUpStepId, setActiveFollowUpStepId] = useState<string | null>(null);
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Draft Management State
  const [draftModalVisible, setDraftModalVisible] = useState(false);
  const [activeDraft, setActiveDraft] = useState<CaseDraft | null>(null);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [draftLoading, setDraftLoading] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [manualDraftText, setManualDraftText] = useState('');
  const [aiRevisionPrompt, setAiRevisionPrompt] = useState('');
  const [revisingDraftLoading, setRevisingDraftLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Chat Control Surface State
  const [chatInput, setChatInput] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [chatState, setChatState] = useState<'idle' | 'sending' | 'thinking' | 'error'>('idle');
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);

  // Voice Input Integration for Case Chat
  const {
    voiceState: chatVoiceState,
    voiceError: chatVoiceError,
    voiceProvider: chatVoiceProvider,
    isGnaniError: isChatGnaniError,
    isRecording: isChatRecording,
    isTranscribing: isChatTranscribing,
    toggleVoiceProvider: toggleChatVoiceProvider,
    switchProviderToGemini: switchChatProviderToGemini,
    toggleRecording: toggleChatRecording,
    cancelRecording: cancelChatRecording,
    retryVoiceInput: retryChatVoiceInput,
  } = useVoiceInput((transcript) => {
    if (transcript) {
      setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    }
  });

  // Language Transition & Re-rendering State
  const [translatingLanguage, setTranslatingLanguage] = useState(false);

  const handleLanguageChange = async (newLang: CaseLanguage) => {
    if (!caseItem) return;
    setTranslatingLanguage(true);

    try {
      const updatedWithLang: CaseModel = {
        ...caseItem,
        language: newLang,
        updatedAt: new Date().toISOString(),
      };

      // 1. Immediately persist language change locally & to Firestore
      await caseRepository.saveCase(updatedWithLang);
      setCaseItem(updatedWithLang);

      // 2. Call fast translation API to re-render presentation fields
      const res = await apiCall<{ success: boolean; case?: CaseModel; error?: string }>('/api/ai/translate-case', {
        caseState: updatedWithLang,
        targetLanguage: newLang.code,
      });

      if (res.success && res.case) {
        const finalTranslatedCase: CaseModel = {
          ...res.case,
          language: newLang,
          updatedAt: new Date().toISOString(),
        };
        await caseRepository.saveCase(finalTranslatedCase);
        setCaseItem(finalTranslatedCase);
      }
    } catch (err) {
      console.error('[Case Workspace] Language change error:', err);
    } finally {
      setTranslatingLanguage(false);
    }
  };

  const fetchCase = async () => {
    if (!id) return;
    setLoading(true);
    const item = await caseRepository.getCaseById(id);
    setCaseItem(item);
    setLoading(false);
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  useEffect(() => {
    if (caseItem?.messages && chatScrollViewRef.current) {
      setTimeout(() => chatScrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [caseItem?.messages, chatState]);

  // Handle roadmap step status updates
  const handleToggleStepStatus = async (stepId: string) => {
    if (!caseItem) return;
    const steps = caseItem.actions.map((st) => {
      if (st.id === stepId) {
        const nextStatus = st.status === 'completed' ? 'pending' : 'completed';
        return { ...st, status: nextStatus as any };
      }
      return st;
    });

    const completedCount = steps.filter((s) => s.status === 'completed').length;
    const progressPercentage = Math.round((completedCount / (steps.length || 1)) * 100);

    const updated: CaseModel = {
      ...caseItem,
      actions: steps,
      actionPlan: {
        ...caseItem.actionPlan,
        steps,
        progressPercentage,
      },
      updatedAt: new Date().toISOString(),
    };

    await caseRepository.saveCase(updated);
    setCaseItem(updated);
  };

  // Add Attachment to Composer
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const newAttachment: PendingAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: asset.name || `document_${Date.now()}`,
          fileUri: asset.uri,
          mimeType: asset.mimeType || 'application/pdf',
        };
        setPendingAttachments((prev) => [...prev, newAttachment]);
      }
    } catch (e) {
      console.warn('Document picker error:', e);
    }
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const newAttachment: PendingAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          fileUri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          base64: asset.base64 || undefined,
        };
        setPendingAttachments((prev) => [...prev, newAttachment]);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // Central Control Surface — Send Chat Turn
  const handleSendCaseUpdate = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : chatInput.trim();
    if ((!textToSend && pendingAttachments.length === 0) || !caseItem || chatState === 'sending') return;

    const currentAtts = [...pendingAttachments];

    if (overrideText === undefined) setChatInput('');
    setPendingAttachments([]);
    setChatState('sending');
    setChatErrorMessage(null);

    // 1. Create immediate User Message
    const userMessage: CaseChatMessage = {
      id: `msg-${Date.now()}`,
      caseId: caseItem.id,
      sender: 'user',
      text: textToSend || (currentAtts.length > 0 ? `Uploaded ${currentAtts.length} document(s)` : ''),
      timestamp: new Date().toISOString(),
      attachments: currentAtts.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUri: a.fileUri,
        mimeType: a.mimeType,
      })),
    };

    let updatedCase = (await caseRepository.addChatMessage(caseItem.id, userMessage)) || caseItem;
    setCaseItem(updatedCase);
    setChatState('thinking');

    try {
      // 2. Call backend unified case chat endpoint
      const chatRes = await apiCall<{
        success: boolean;
        chat: {
          replyText: string;
          eventType: string;
          extractedFacts?: Record<string, any>;
          completedStepNumber?: number | null;
          suggestedActions?: ContextualAction[];
          missingQuestions?: string[];
        };
      }>('/api/ai/chat', {
        caseId: caseItem.id,
        messageText: textToSend,
        attachments: currentAtts.map((a) => ({ base64: a.base64, fileName: a.fileName, mimeType: a.mimeType })),
        currentCaseState: updatedCase,
      });

      if (chatRes.success && chatRes.chat) {
        const { replyText, eventType, extractedFacts, completedStepNumber, suggestedActions, missingQuestions } = chatRes.chat;

        // 3. Append AI Response Message
        const aiMessage: CaseChatMessage = {
          id: `msg-ai-${Date.now()}`,
          caseId: caseItem.id,
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toISOString(),
          eventType: eventType as any,
          actions: suggestedActions,
          missingQuestions,
        };

        // 4. Dynamic Case Memory Updates
        let newActions = [...(updatedCase.actions || [])];
        if (completedStepNumber && completedStepNumber > 0) {
          newActions = newActions.map((act) => {
            if (act.stepNumber === completedStepNumber || act.order === completedStepNumber) {
              return { ...act, status: 'completed' as const };
            }
            return act;
          });
        }

        const mergedFacts = { ...(updatedCase.facts || {}), ...(extractedFacts || {}) };

        // Process attachments as case documents
        const newDocs: CaseDocument[] = currentAtts.map((att) => ({
          id: att.id,
          caseId: caseItem.id,
          fileName: att.fileName,
          fileUri: att.fileUri,
          mimeType: att.mimeType,
          scannedAt: new Date().toISOString(),
          extractedSummary: `Evidence uploaded via case chat on ${new Date().toLocaleDateString('en-IN')}`,
        }));

        const finalCase: CaseModel = {
          ...updatedCase,
          facts: mergedFacts,
          actions: newActions,
          actionPlan: {
            ...updatedCase.actionPlan,
            steps: newActions,
            progressPercentage: Math.round(
              (newActions.filter((s) => s.status === 'completed').length / (newActions.length || 1)) * 100
            ),
          },
          documents: [...(updatedCase.documents || []), ...newDocs],
          updatedAt: new Date().toISOString(),
        };

        await caseRepository.saveCase(finalCase);
        await caseRepository.addChatMessage(caseItem.id, aiMessage);
        const refreshed = await caseRepository.getCaseById(caseItem.id);
        setCaseItem(refreshed || finalCase);
        setChatState('idle');
      } else {
        throw new Error('Server returned invalid response');
      }
    } catch (e: any) {
      console.error('[CaseWorkspace] Chat error:', e);
      setChatState('error');
      setChatErrorMessage(e?.message || 'Could not connect to AI service. Please try again.');
      if (textToSend && overrideText === undefined) setChatInput(textToSend);
    }
  };

  // Smart Open Questions Flow State
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [smartAnswerText, setSmartAnswerText] = useState('');

  const handleAnswerMissingQuestion = async (idx: number, q: DynamicMissingQuestion, selectedAnswer?: string) => {
    const answer = (selectedAnswer || missingAnswersInput[idx] || smartAnswerText).trim();
    if (!answer) return;

    setSubmittingAnswerIdx(idx);
    const fullMsg = `${q.question} Answer: ${answer}`;
    await handleSendCaseUpdate(fullMsg);

    // Advance question card index
    setActiveQuestionIdx((prev) => prev + 1);
    setSmartAnswerText('');
    setSubmittingAnswerIdx(null);
  };

  const handleAskStepQuestion = async (step: ActionStep, questionType: 'why' | 'missing') => {
    setActiveFollowUpStepId(step.id);
    setFollowUpLoading(true);
    setFollowUpAnswer(null);

    const questionText =
      questionType === 'why' ? 'Why is this action step necessary?' : "What secondary evidence can I use if I don't have this document?";

    try {
      const res = await apiCall<{ success: boolean; answer: string }>('/api/ai/action-followup', {
        stepTitle: step.title,
        stepPurpose: step.reason || step.description,
        userQuestion: questionText,
        caseCategory: caseItem?.category || 'general_legal',
      });

      if (res.success && res.answer) {
        setFollowUpAnswer(res.answer);
      } else {
        setFollowUpAnswer(`Step "${step.title}" is required under statutory procedures.`);
      }
    } catch {
      setFollowUpAnswer(
        questionType === 'why'
          ? `Step "${step.title}" is required under Indian statutory law to establish formal notice and proof.`
          : 'You may provide alternative proof such as bank statements, written emails, or message logs.'
      );
    } finally {
      setFollowUpLoading(false);
    }
  };

  // Draft System: Open / Generate / Persist / Edit / Revise
  const handleOpenDraft = async (documentType: string = 'demand_notice') => {
    if (!caseItem) return;

    setDraftModalVisible(true);
    setIsEditingDraft(false);
    setCopyFeedback(false);

    // 1. Check if draft already exists on case
    const existing = caseItem.drafts?.find(
      (d) => d.documentType.toLowerCase() === documentType.toLowerCase() || d.title.toLowerCase().includes(documentType.toLowerCase())
    );

    if (existing && existing.versions && existing.versions.length > 0) {
      setActiveDraft(existing);
      setSelectedVersionIndex(existing.versions.length - 1);
      setManualDraftText(existing.versions[existing.versions.length - 1].content);
      return;
    }

    // 2. Generate new draft
    setDraftLoading(true);
    setActiveDraft(null);

    const draftTitle = documentType === 'rti' ? 'RTI Application' : 'Legal Demand Notice';

    try {
      const res = await apiCall<{ success: boolean; draftText: string }>('/api/ai/generate-draft', {
        documentType,
        caseState: caseItem,
      });

      const text = res.success && res.draftText
        ? res.draftText
        : `LEGAL DEMAND NOTICE\n\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nTo Opposing Party,\n\nPlease satisfy claim within 15 days of receipt of this notice.`;

      const updatedCase = addOrUpdateDraftInCase(caseItem, draftTitle, documentType, text, 'ai', 'Initial generation');
      await caseRepository.saveCase(updatedCase);
      setCaseItem(updatedCase);

      const savedDraft = updatedCase.drafts?.find((d) => d.documentType === documentType) || updatedCase.drafts?.[0];
      setActiveDraft(savedDraft || null);
      setSelectedVersionIndex(savedDraft ? savedDraft.versions.length - 1 : 0);
      setManualDraftText(text);
    } catch {
      const fallbackText = `LEGAL DEMAND NOTICE\n\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nRe: ${caseItem.title}\n\nYou are requested to resolve this matter within 15 days.`;
      const updatedCase = addOrUpdateDraftInCase(caseItem, draftTitle, documentType, fallbackText, 'ai', 'Fallback draft');
      await caseRepository.saveCase(updatedCase);
      setCaseItem(updatedCase);
      const savedDraft = updatedCase.drafts?.[0];
      setActiveDraft(savedDraft || null);
      setSelectedVersionIndex(0);
      setManualDraftText(fallbackText);
    } finally {
      setDraftLoading(false);
    }
  };

  // Handle Manual Draft Save
  const handleSaveManualDraft = async () => {
    if (!caseItem || !activeDraft) return;

    const updatedCase = updateDraftContentManually(caseItem, activeDraft.id, manualDraftText);
    await caseRepository.saveCase(updatedCase);
    setCaseItem(updatedCase);

    const updatedDraft = updatedCase.drafts?.find((d) => d.id === activeDraft.id) || activeDraft;
    setActiveDraft(updatedDraft);
    setIsEditingDraft(false);
  };

  // Handle AI Revision of Draft
  const handleReviseDraftWithAi = async () => {
    if (!aiRevisionPrompt.trim() || !caseItem || !activeDraft) return;

    const currentContent = activeDraft.versions[selectedVersionIndex]?.content || manualDraftText;
    setRevisingDraftLoading(true);

    try {
      const res = await apiCall<{ success: boolean; revisedText: string }>('/api/ai/revise-draft', {
        draftText: currentContent,
        userPrompt: aiRevisionPrompt.trim(),
        caseState: caseItem,
      });

      if (res.success && res.revisedText) {
        const updatedCase = addOrUpdateDraftInCase(
          caseItem,
          activeDraft.title,
          activeDraft.documentType,
          res.revisedText,
          'ai',
          `AI Modification: ${aiRevisionPrompt.trim()}`
        );

        await caseRepository.saveCase(updatedCase);
        setCaseItem(updatedCase);

        const updatedDraft = updatedCase.drafts?.find((d) => d.id === activeDraft.id) || activeDraft;
        setActiveDraft(updatedDraft);
        const newVerIdx = updatedDraft.versions.length - 1;
        setSelectedVersionIndex(newVerIdx);
        setManualDraftText(updatedDraft.versions[newVerIdx].content);
        setAiRevisionPrompt('');
      }
    } catch (e) {
      console.error('Draft revision failed:', e);
      Alert.alert('Revision Error', 'Could not revise draft right now. Please try again.');
    } finally {
      setRevisingDraftLoading(false);
    }
  };

  // Handle Copying Draft Text
  const handleCopyDraftText = () => {
    const textToCopy = activeDraft?.versions[selectedVersionIndex]?.content || manualDraftText;
    if (typeof window !== 'undefined' && window.navigator && window.navigator.clipboard) {
      window.navigator.clipboard.writeText(textToCopy);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } else {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Execute Contextual Action Chips
  const handleContextualAction = (action: ContextualAction) => {
    if (action.actionType === 'generate_draft') {
      handleOpenDraft(action.payload?.documentType || 'demand_notice');
    } else if (action.actionType === 'upload_evidence') {
      handlePickDocument();
    } else if (action.actionType === 'ask_followup') {
      const step = caseItem?.actions?.[0];
      if (step) handleAskStepQuestion(step, 'why');
    }
  };

  // Active Tab State: 'overview' | 'route' | 'evidence' | 'sources'
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'evidence' | 'sources'>('overview');

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Nyaya Flow Intelligence" showBack={true} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
          <Text style={styles.loadingText}>Analyzing legal intelligence...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!caseItem) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Case Not Found" showBack={true} />
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>The requested case could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInformationalOnly = caseItem.queryIntent === 'informational' || caseItem.queryIntent === 'navigational' || !caseItem.actions || caseItem.actions.length === 0;

  const currentNextAction =
    caseItem.actions?.find((a) => a.status === 'in_progress' || a.status === 'pending') ||
    caseItem.actions?.[0];

  const primarySource = caseItem.sources?.[0];
  const allMessages = caseItem.messages || [];
  const missingQuestions = caseItem.usefulMissingQuestions || [];

  // Raw AI Overview text
  const rawAiText = caseItem.aiOverview || caseItem.reasoningSummary?.whatUnderstood || caseItem.summary || '';

  // Extract 3-4 Key Facts for "What matters"
  const getFactsList = () => {
    let facts: { label: string; detail: string }[] = [];
    if (caseItem.facts && Object.keys(caseItem.facts).length > 0) {
      facts = Object.entries(caseItem.facts).slice(0, 4).map(([k, v]) => ({
        label: k.replace(/_/g, ' '),
        detail: String(v),
      }));
    } else if (caseItem.problemSummary || caseItem.summary) {
      const raw = caseItem.problemSummary || caseItem.summary;
      const sentences = raw.split('.').map((s) => s.trim()).filter(Boolean);
      facts = sentences.slice(0, 4).map((s, idx) => ({
        label: idx === 0 ? 'Dispute' : idx === 1 ? 'Key Fact' : `Fact ${idx + 1}`,
        detail: s,
      }));
    }
    return facts;
  };

  const keyFacts = getFactsList();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LegalFlowBackground watermarkText="NYAYA FLOW" variant="roadmap" />

      <Header
        title={caseItem.title}
        subtitle={`${typeof caseItem.jurisdiction === 'string' ? caseItem.jurisdiction : caseItem.jurisdiction?.state || 'India'} · ${(caseItem.category || 'General legal').replace('_', ' ')}`}
        showBack={true}
        rightAction={
          <LanguageSelector
            currentLanguage={caseItem.language}
            onSelectLanguage={handleLanguageChange}
            compact={true}
          />
        }
      />

      {translatingLanguage && (
        <View style={[styles.listeningNotice, { backgroundColor: colors.surfaceHighlight, borderColor: colors.accent, marginHorizontal: 16, marginTop: 8 }]}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
            Re-rendering case presentation...
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LegalDisclaimerBanner compact={true} />

          {/* CASE META ROW */}
          <View style={styles.caseHeaderMetaRow}>
            <LegalStamp label={isInformationalOnly ? 'Informational Guidance' : caseItem.status || 'in_progress'} variant="primary" size="sm" />
            <Text style={[styles.refCodeText, { color: colors.textMuted }]}>
              Updated {new Date(caseItem.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {/* 1. QUIET SECTION TABS BAR */}
          <View style={[styles.tabBarContainer, { borderBottomColor: colors.borderSubtle }]}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'route', label: 'Route' },
              { id: 'evidence', label: 'Evidence' },
              { id: 'sources', label: 'Sources' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.7}
                  style={[
                    styles.tabItem,
                    isActive && [styles.tabItemActive, { borderBottomColor: colors.accent }],
                  ]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      { color: isActive ? colors.accent : colors.textMuted },
                      isActive && styles.tabItemTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View style={{ gap: 16 }}>
              {/* AI OVERVIEW CARD */}
              <View style={[styles.aiOverviewCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <View style={styles.aiOverviewHeaderRow}>
                  <View style={styles.aiOverviewTitleGroup}>
                    <Ionicons name="sparkles" size={16} color={colors.accent} />
                    <Text style={[styles.aiOverviewHeading, { color: colors.textPrimary }]}>AI OVERVIEW</Text>
                  </View>
                  <Text style={[styles.aiVerifiedTag, { color: caseItem.verifiedAnalysis ? colors.accentSuccess : colors.accent }]}>
                    {caseItem.verifiedAnalysis ? 'VERIFIED LEGAL ANALYSIS' : 'AI LEGAL GUIDANCE'}
                  </Text>
                </View>

                {/* Scannable Formatted AI Response */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.aiSectionSubheading, { color: colors.accent }]}>What this means</Text>
                  <Text style={[styles.aiOverviewBodyText, { color: colors.textPrimary }]}>
                    {rawAiText}
                  </Text>

                  <Text style={[styles.aiSectionSubheading, { color: colors.accent, marginTop: 12 }]}>What you should do</Text>
                  <Text style={[styles.aiOverviewBodyText, { color: colors.textSecondary }]}>
                    {caseItem.problemSummary || caseItem.reasoningSummary?.whyThisRoute || 'Your matter has been analyzed against relevant statutory provisions under Indian law.'}
                  </Text>

                  {currentNextAction && !isInformationalOnly && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.aiSectionSubheading, { color: colors.accent }]}>Next step</Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.stepLinkChip, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                        onPress={() => setActiveTab('route')}
                      >
                        <Ionicons name="map-outline" size={14} color={colors.accent} />
                        <Text style={[styles.stepLinkChipText, { color: colors.textPrimary }]}>
                          <Text style={{ fontWeight: '700' }}>{currentNextAction.title}</Text> — View Step in Route →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {primarySource && (
                  <View style={{ marginBottom: 12 }}>
                    <SourceBadge source={primarySource as any} />
                  </View>
                )}

                {/* INTEGRATED CASE CHAT / CONVERSATIONAL INPUT */}
                <View style={[styles.integratedChatBox, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
                  <View style={styles.integratedChatHeader}>
                    <Ionicons name="chatbubbles-outline" size={14} color={colors.accent} />
                    <Text style={[styles.integratedChatTitle, { color: colors.textPrimary }]}>Ask about your case</Text>
                  </View>

                  {/* Chat Messages Feed */}
                  {allMessages.length > 0 && (
                    <ScrollView
                      ref={chatScrollViewRef}
                      style={styles.chatStreamContainer}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {allMessages.map((msg) => {
                        const isUser = msg.sender === 'user';
                        return (
                          <View
                            key={msg.id}
                            style={[
                              styles.chatBubbleWrapper,
                              isUser ? styles.chatBubbleUserAlign : styles.chatBubbleAiAlign,
                            ]}
                          >
                            <View
                              style={[
                                styles.chatBubble,
                                isUser
                                  ? [styles.userBubble, { backgroundColor: colors.accent }]
                                  : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }],
                              ]}
                            >
                              <Text style={[styles.msgSenderLabel, { color: isUser ? '#E0E7FF' : colors.accent }]}>
                                {isUser ? 'You' : 'Nyaya Flow AI'}
                              </Text>

                              {msg.attachments && msg.attachments.length > 0 && (
                                <View style={styles.msgAttachmentBadgeRow}>
                                  {msg.attachments.map((att) => (
                                    <View key={att.id} style={[styles.msgAttChip, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : colors.surfaceHighlight }]}>
                                      <Ionicons name="document-text" size={12} color={isUser ? '#FFF' : colors.textPrimary} />
                                      <Text style={[styles.msgAttChipText, { color: isUser ? '#FFF' : colors.textPrimary }]} numberOfLines={1}>
                                        {att.fileName}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}

                              <Text style={[styles.chatMessageText, { color: isUser ? '#FFFFFF' : colors.textPrimary }]}>
                                {msg.text}
                              </Text>

                              {msg.sender === 'ai' && msg.actions && msg.actions.length > 0 && (
                                <View style={styles.contextualActionsRow}>
                                  {msg.actions.map((act) => (
                                    <TouchableOpacity
                                      key={act.id}
                                      activeOpacity={0.8}
                                      style={[styles.actionChipBtn, { backgroundColor: colors.accent }]}
                                      onPress={() => handleContextualAction(act)}
                                    >
                                      <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                                      <Text style={styles.actionChipBtnText}>{act.label}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}

                      {chatState === 'thinking' && (
                        <View style={[styles.chatBubbleWrapper, styles.chatBubbleAiAlign]}>
                          <View style={[styles.chatBubble, styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                            <View style={styles.thinkingRow}>
                              <ActivityIndicator size="small" color={colors.accent} />
                              <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                                Updating case understanding...
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {chatState === 'error' && (
                        <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                          <Ionicons name="alert-circle" size={16} color="#DC2626" />
                          <Text style={[styles.errorBoxText, { color: '#991B1B' }]}>
                            {chatErrorMessage || 'Failed to process turn.'}
                          </Text>
                          <TouchableOpacity onPress={() => handleSendCaseUpdate()} style={styles.retryBtn}>
                            <Text style={styles.retryBtnText}>Retry</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>
                  )}

                  {/* Pending Attachments */}
                  {pendingAttachments.length > 0 && (
                    <View style={[styles.pendingAttContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {pendingAttachments.map((att) => (
                          <View key={att.id} style={[styles.pendingAttCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
                            <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                            <Text style={[styles.pendingAttName, { color: colors.textPrimary }]} numberOfLines={1}>
                              {att.fileName}
                            </Text>
                            <TouchableOpacity onPress={() => handleRemoveAttachment(att.id)}>
                              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Voice Input Active / Transcribing Banners for Case Chat */}
                  {isChatRecording && (
                    <View style={[styles.listeningNotice, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', marginBottom: 8 }]}>
                      <ActivityIndicator size="small" color="#DC2626" style={{ marginRight: 8 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 12 }}>Recording voice…</Text>
                        <Text style={{ color: '#B91C1C', fontSize: 11 }}>Speak clearly. Tap mic button to stop.</Text>
                      </View>
                      <TouchableOpacity onPress={cancelChatRecording} style={{ padding: 4 }}>
                        <Ionicons name="close-circle-outline" size={18} color="#991B1B" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {isChatTranscribing && (
                    <View style={[styles.listeningNotice, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent, marginBottom: 8 }]}>
                      <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                      <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 12 }}>
                        Understanding your voice ({chatVoiceProvider === 'gnani' ? 'Gnani.ai' : 'Gemini'})…
                      </Text>
                    </View>
                  )}

                  {chatVoiceError && (
                    <View style={[styles.listeningNotice, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle, marginBottom: 8 }]}>
                      <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 11 }}>{chatVoiceError}</Text>
                      {isChatGnaniError ? (
                        <TouchableOpacity onPress={switchChatProviderToGemini} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.accent, borderRadius: 4 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>Switch to Gemini</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={retryChatVoiceInput} style={{ paddingHorizontal: 6, paddingVertical: 3, backgroundColor: colors.accent, borderRadius: 4 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>Retry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Compact Composer */}
                  <View style={[styles.composerBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <TouchableOpacity onPress={handlePickDocument} style={styles.composerIconBtn}>
                      <Ionicons name="attach" size={18} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePickImage} style={styles.composerIconBtn}>
                      <Ionicons name="image-outline" size={16} color={colors.accent} />
                    </TouchableOpacity>

                    {/* Optional Gnani.ai Provider Selection Control */}
                    <VoiceProviderToggle
                      provider={chatVoiceProvider}
                      onToggle={toggleChatVoiceProvider}
                      disabled={isChatRecording || isChatTranscribing}
                    />

                    <TouchableOpacity
                      onPress={() => {
                        const langCode = typeof caseItem?.language === 'string' ? caseItem.language : caseItem?.language?.code || 'en';
                        toggleChatRecording(langCode);
                      }}
                      activeOpacity={0.8}
                      style={[
                        styles.composerIconBtn,
                        {
                          backgroundColor: isChatRecording ? '#DC2626' : isChatTranscribing ? colors.accent : 'transparent',
                          borderRadius: 14,
                          width: 28,
                          height: 28,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                      accessibilityLabel="Voice chat recording"
                    >
                      {isChatTranscribing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons
                          name={isChatRecording ? 'mic' : 'mic-outline'}
                          size={16}
                          color={isChatRecording ? '#FFFFFF' : colors.accent}
                        />
                      )}
                    </TouchableOpacity>

                    <TextInput
                      style={[styles.composerTextInput, { color: colors.textPrimary }]}
                      placeholder="Ask a question or speak..."
                      placeholderTextColor={colors.textMuted}
                      value={chatInput}
                      onChangeText={setChatInput}
                      multiline={true}
                      editable={chatState !== 'sending' && chatState !== 'thinking'}
                    />

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.sendUpdateBtn,
                        { backgroundColor: (chatInput.trim() || pendingAttachments.length > 0) ? colors.accent : colors.border },
                      ]}
                      onPress={() => handleSendCaseUpdate()}
                      disabled={(!chatInput.trim() && pendingAttachments.length === 0) || chatState === 'sending'}
                    >
                      {chatState === 'sending' ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* SMART OPEN QUESTIONS FLOW CARD (DIRECTLY BELOW AI OVERVIEW) */}
              {missingQuestions.length > 0 && activeQuestionIdx < missingQuestions.length && (
                <View style={[styles.smartQuestionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={styles.smartQuestionHeaderRow}>
                    <View style={styles.smartQuestionTitleGroup}>
                      <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
                      <Text style={[styles.smartQuestionCardLabel, { color: colors.accent }]}>
                        ONE THING I NEED TO KNOW ({activeQuestionIdx + 1} OF {missingQuestions.length})
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveQuestionIdx((prev) => prev + 1)}>
                      <Text style={[styles.skipQuestionLink, { color: colors.textMuted }]}>Skip</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.smartQuestionTitle, { color: colors.textPrimary }]}>
                    {missingQuestions[activeQuestionIdx].question}
                  </Text>

                  {missingQuestions[activeQuestionIdx].whyItMatters && (
                    <Text style={[styles.smartQuestionWhy, { color: colors.textSecondary }]}>
                      Why this matters: {missingQuestions[activeQuestionIdx].whyItMatters}
                    </Text>
                  )}

                  {/* Render Options / Input based on inputType */}
                  {missingQuestions[activeQuestionIdx].inputType === 'yes_no' || missingQuestions[activeQuestionIdx].inputType === 'multi_option' || (missingQuestions[activeQuestionIdx].options && missingQuestions[activeQuestionIdx].options!.length > 0) ? (
                    <View style={styles.optionPillsRow}>
                      {(missingQuestions[activeQuestionIdx].options || ['Yes, I have written proof', 'No, it was only verbal', 'I am not sure']).map((opt, oIdx) => (
                        <TouchableOpacity
                          key={oIdx}
                          activeOpacity={0.8}
                          style={[styles.optionPillBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                          onPress={() => handleAnswerMissingQuestion(activeQuestionIdx, missingQuestions[activeQuestionIdx], opt)}
                        >
                          <Text style={[styles.optionPillBtnText, { color: colors.textPrimary }]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      <View style={styles.smartAnswerInputRow}>
                        <TextInput
                          style={[styles.smartAnswerTextInput, { color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                          placeholder={missingQuestions[activeQuestionIdx].inputType === 'document' ? 'Provide details or attach file...' : 'Type your answer...'}
                          placeholderTextColor={colors.textMuted}
                          value={smartAnswerText}
                          onChangeText={setSmartAnswerText}
                        />
                        {missingQuestions[activeQuestionIdx].inputType === 'document' && (
                          <TouchableOpacity style={[styles.smartAttachIconBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]} onPress={handlePickDocument}>
                            <Ionicons name="attach" size={18} color={colors.accent} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.smartSubmitBtn, { backgroundColor: smartAnswerText.trim() ? colors.accent : colors.border }]}
                          onPress={() => handleAnswerMissingQuestion(activeQuestionIdx, missingQuestions[activeQuestionIdx], smartAnswerText)}
                          disabled={!smartAnswerText.trim()}
                        >
                          <Text style={styles.smartSubmitBtnText}>Submit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* WHAT MATTERS (KEY FACTS) */}
              {keyFacts.length > 0 && (
                <View style={[styles.whatMattersSection, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.whatMattersHeaderTitle, { color: colors.textPrimary }]}>What matters</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {keyFacts.map((fact, idx) => (
                      <View key={idx} style={styles.factItemRow}>
                        <View style={[styles.factDot, { backgroundColor: colors.accent }]} />
                        <Text style={[styles.factText, { color: colors.textPrimary }]}>
                          <Text style={{ fontWeight: '700' }}>{fact.label}: </Text>
                          {fact.detail}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* NEXT ACTION */}
              {currentNextAction && !isInformationalOnly && (
                <View style={[styles.nextActionHighlightCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={styles.nextActionBadgeRow}>
                    <View style={[styles.nextActionDot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.nextActionLabel, { color: colors.accent }]}>NEXT ACTION</Text>
                  </View>

                  <Text style={[styles.nextActionTitle, { color: colors.textPrimary }]}>
                    {currentNextAction.title}
                  </Text>
                  <Text style={[styles.nextActionDesc, { color: colors.textSecondary }]}>
                    {currentNextAction.description || currentNextAction.reason || 'Follow this statutory step to proceed with your matter.'}
                  </Text>

                  <View style={styles.nextActionBtnsRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
                      onPress={() => {
                        if (currentNextAction.officialProcessUrl) {
                          Linking.openURL(currentNextAction.officialProcessUrl);
                        } else if (currentNextAction.title.toLowerCase().includes('notice') || currentNextAction.title.toLowerCase().includes('rti')) {
                          handleOpenDraft(currentNextAction.title.toLowerCase().includes('rti') ? 'rti' : 'demand_notice');
                        } else {
                          handleToggleStepStatus(currentNextAction.id);
                        }
                      }}
                    >
                      <Text style={styles.primaryActionBtnText}>Continue →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.secondaryActionBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                      onPress={() => handleAskStepQuestion(currentNextAction, 'why')}
                    >
                      <Ionicons name="help-circle-outline" size={14} color={colors.textPrimary} />
                      <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary }]}>Why this step?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.secondaryActionBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                      onPress={handlePickDocument}
                    >
                      <Ionicons name="attach-outline" size={14} color={colors.textPrimary} />
                      <Text style={[styles.secondaryActionBtnText, { color: colors.textPrimary }]}>Add evidence</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* PERSISTENT GENERATED DRAFTS */}
              {caseItem.drafts && caseItem.drafts.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>GENERATED DRAFTS</Text>
                  <View style={{ gap: 8 }}>
                    {caseItem.drafts.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        activeOpacity={0.8}
                        style={[styles.draftItemRow, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                        onPress={() => handleOpenDraft(d.documentType)}
                      >
                        <Ionicons name="document-text-outline" size={20} color={colors.accent} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.draftItemTitle, { color: colors.textPrimary }]} numberOfLines={1}>{d.title}</Text>
                          <Text style={[styles.draftItemSub, { color: colors.textSecondary }]}>
                            {d.versions.length} version(s) · Last modified {new Date(d.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <Text style={[styles.openDraftBadge, { color: colors.accent }]}>View & Edit →</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: ROUTE */}
          {activeTab === 'route' && (
            <View style={{ gap: 16 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.mainSectionTitle, { color: colors.textPrimary }]}>Procedural Roadmap</Text>
                {caseItem.actions && caseItem.actions.length > 0 && (
                  <Text style={[styles.routeSubText, { color: colors.textMuted }]}>
                    {caseItem.actions.filter((s) => s.status === 'completed').length} of {caseItem.actions.length} steps completed
                  </Text>
                )}
              </View>

              {caseItem.actions && caseItem.actions.length > 0 ? (
                <LegalRoadmapGraph
                  steps={caseItem.actions}
                  onToggleStep={handleToggleStepStatus}
                  onAskFollowUp={handleAskStepQuestion}
                  onAttachEvidence={handlePickDocument}
                  sources={caseItem.sources as any}
                />
              ) : (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>No multi-step process needed</Text>
                  </View>
                  <Text style={[styles.emptyEvidenceDesc, { color: colors.textSecondary, textAlign: 'left' }]}>
                    This question is informational and does not require a formal case workflow or litigation steps.
                  </Text>
                  {primarySource && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.accent, borderRadius: 10, alignSelf: 'flex-start' }}
                      onPress={() => {
                        if (primarySource.url) Linking.openURL(primarySource.url);
                        else setActiveTab('sources');
                      }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Open {primarySource.title} ↗</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: EVIDENCE */}
          {activeTab === 'evidence' && (
            <View style={{ gap: 16 }}>
              <View style={styles.sectionHeaderRowBetween}>
                <Text style={[styles.mainSectionTitle, { color: colors.textPrimary }]}>Evidence Workspace</Text>
                <TouchableOpacity style={[styles.addEvidenceBtn, { backgroundColor: colors.accent }]} onPress={handlePickDocument}>
                  <Ionicons name="add" size={16} color="#FFF" />
                  <Text style={styles.addEvidenceBtnText}>Add document</Text>
                </TouchableOpacity>
              </View>

              {/* YOU HAVE */}
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.sectionHeadingLabel, { color: colors.textMuted }]}>
                  YOU HAVE ({caseItem.documents?.length || 0})
                </Text>
                {(!caseItem.documents || caseItem.documents.length === 0) ? (
                  <View style={[styles.emptyEvidenceBox, { backgroundColor: colors.surfaceHighlight }]}>
                    <Ionicons name="document-attach-outline" size={24} color={colors.textMuted} />
                    <Text style={[styles.emptyEvidenceTitle, { color: colors.textPrimary }]}>No evidence uploaded yet</Text>
                    <Text style={[styles.emptyEvidenceDesc, { color: colors.textSecondary }]}>
                      Attach receipts, WhatsApp screenshots, or contracts to strengthen your legal claim.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10, marginTop: 8 }}>
                    {caseItem.documents.map((docItem: CaseDocument) => (
                      <EvidenceCard key={docItem.id} document={docItem} usedInActionIds={['Notice Step', 'Filing']} />
                    ))}
                  </View>
                )}
              </View>

              {/* STILL NEEDED */}
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Text style={[styles.sectionHeadingLabel, { color: colors.textMuted }]}>STILL NEEDED</Text>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {missingQuestions.length > 0 ? (
                    missingQuestions.map((q, idx) => (
                      <View key={idx} style={[styles.missingReqRow, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
                        <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.missingReqTitle, { color: colors.textPrimary }]}>{q.question}</Text>
                          {q.whyItMatters && <Text style={[styles.missingReqSub, { color: colors.textSecondary }]}>{q.whyItMatters}</Text>}
                        </View>
                        <TouchableOpacity style={[styles.uploadChipBtn, { backgroundColor: colors.accent }]} onPress={handlePickDocument}>
                          <Text style={styles.uploadChipBtnText}>Attach</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <View style={[styles.allSetBox, { backgroundColor: colors.surfaceHighlight }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.accentSuccess} />
                      <Text style={[styles.allSetText, { color: colors.textPrimary }]}>All primary evidence collected for your current step.</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* TAB 4: SOURCES */}
          {activeTab === 'sources' && (
            <View style={{ gap: 16 }}>
              <Text style={[styles.mainSectionTitle, { color: colors.textPrimary }]}>Verified Legal Sources</Text>

              {(!caseItem.sources || caseItem.sources.length === 0) ? (
                <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.emptyEvidenceDesc, { color: colors.textSecondary }]}>
                    Standard statutory provisions under Indian law apply to this matter.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {caseItem.sources.map((src, idx) => (
                    <View key={src.id || idx} style={[styles.sourceCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                      <View style={styles.sourceCardHeader}>
                        <View style={[styles.statutoryBadge, { backgroundColor: colors.surfaceHighlight }]}>
                          <Ionicons name="bookmark-outline" size={14} color={colors.accent} />
                          <Text style={[styles.statutoryBadgeText, { color: colors.accent }]}>Official Source</Text>
                        </View>
                        {(src as any).type && (
                          <Text style={[styles.sourceTypeText, { color: colors.textMuted }]}>{(src as any).type.toUpperCase()}</Text>
                        )}
                      </View>

                      <Text style={[styles.sourceCardTitle, { color: colors.textPrimary }]}>{src.title}</Text>

                      {src.relevance ? (
                        <Text style={[styles.sourceCardRelevance, { color: colors.textSecondary }]}>{src.relevance}</Text>
                      ) : src.publisher ? (
                        <Text style={[styles.sourceCardRelevance, { color: colors.textSecondary }]}>Published by {src.publisher}</Text>
                      ) : null}

                      {src.url && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.openSourceBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                          onPress={() => Linking.openURL(src.url!)}
                        >
                          <Text style={[styles.openSourceBtnText, { color: colors.accent }]}>Open source →</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* "WHY THIS STEP?" MODAL */}
      <Modal visible={Boolean(activeFollowUpStepId)} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: colors.textPrimary }]}>Why this step?</Text>
              <TouchableOpacity onPress={() => setActiveFollowUpStepId(null)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalSheetBody}>
              {followUpLoading ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
              ) : (
                <>
                  <Text style={[styles.modalBlockTitle, { color: colors.textMuted }]}>WHY WE'RE RECOMMENDING THIS</Text>
                  <Text style={[styles.modalBlockDesc, { color: colors.textSecondary }]}>
                    {followUpAnswer || 'This action step satisfies formal Indian statutory notification requirements.'}
                  </Text>

                  {primarySource && (
                    <>
                      <Text style={[styles.modalBlockTitle, { color: colors.textMuted, marginTop: 16 }]}>OFFICIAL BASIS</Text>
                      <Text style={[styles.modalBlockDesc, { color: colors.textSecondary }]}>
                        {primarySource.title} — {(primarySource as any).relevance || (primarySource as any).publisher || 'Official statutory procedure.'}
                      </Text>
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.accent }]}
              onPress={() => setActiveFollowUpStepId(null)}
            >
              <Text style={styles.modalCloseButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PERSISTENT DRAFT GENERATION & EDITING MODAL */}
      <Modal visible={draftModalVisible} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activeDraft?.title || 'Legal Document Draft'}
                </Text>

                {activeDraft && activeDraft.versions && activeDraft.versions.length > 1 && (
                  <View style={styles.versionPillsRow}>
                    {activeDraft.versions.map((ver, idx) => (
                      <TouchableOpacity
                        key={ver.id}
                        onPress={() => {
                          setSelectedVersionIndex(idx);
                          setManualDraftText(ver.content);
                          setIsEditingDraft(false);
                        }}
                        style={[
                          styles.versionPill,
                          selectedVersionIndex === idx
                            ? { backgroundColor: colors.accent }
                            : { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle },
                        ]}
                      >
                        <Text
                          style={[
                            styles.versionPillText,
                            { color: selectedVersionIndex === idx ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          v{ver.versionNumber}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={() => setDraftModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {draftLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ marginTop: 12, color: colors.textSecondary }}>
                  Generating personalized legal draft...
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.draftActionsRow}>
                  <TouchableOpacity
                    style={[styles.draftActionBtn, { backgroundColor: copyFeedback ? colors.accentSuccess : colors.surfaceHighlight }]}
                    onPress={handleCopyDraftText}
                  >
                    <Ionicons name={copyFeedback ? 'checkmark-circle' : 'copy-outline'} size={14} color={copyFeedback ? '#FFF' : colors.textPrimary} />
                    <Text style={[styles.draftActionBtnText, { color: copyFeedback ? '#FFF' : colors.textPrimary }]}>
                      {copyFeedback ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  {!isEditingDraft ? (
                    <TouchableOpacity
                      style={[styles.draftActionBtn, { backgroundColor: colors.surfaceHighlight }]}
                      onPress={() => {
                        setIsEditingDraft(true);
                        const curContent = activeDraft?.versions[selectedVersionIndex]?.content || '';
                        setManualDraftText(curContent);
                      }}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.textPrimary} />
                      <Text style={[styles.draftActionBtnText, { color: colors.textPrimary }]}>Manual Edit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.draftActionBtn, { backgroundColor: colors.accent }]}
                      onPress={handleSaveManualDraft}
                    >
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      <Text style={[styles.draftActionBtnText, { color: '#FFFFFF' }]}>Save Edits</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={[styles.draftScrollBox, { backgroundColor: colors.background }]}>
                  {isEditingDraft ? (
                    <TextInput
                      style={[styles.draftEditTextInput, { color: colors.textPrimary }]}
                      value={manualDraftText}
                      onChangeText={setManualDraftText}
                      multiline={true}
                    />
                  ) : (
                    <Text style={[styles.draftTextContent, { color: colors.textPrimary }]}>
                      {activeDraft?.versions[selectedVersionIndex]?.content || manualDraftText}
                    </Text>
                  )}
                </ScrollView>

                <View style={[styles.aiRevisionBox, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.aiRevisionLabel, { color: colors.textMuted }]}>ASK AI TO MODIFY THIS DRAFT</Text>
                  <View style={styles.aiRevisionInputRow}>
                    <TextInput
                      style={[styles.aiRevisionInput, { color: colors.textPrimary }]}
                      placeholder='e.g. "Make it firmer", "Add payment date of 12th July", "Translate to Hindi"'
                      placeholderTextColor={colors.textMuted}
                      value={aiRevisionPrompt}
                      onChangeText={setAiRevisionPrompt}
                      editable={!revisingDraftLoading}
                    />
                    <TouchableOpacity
                      style={[styles.aiRevisionSubmitBtn, { backgroundColor: colors.accent }]}
                      onPress={handleReviseDraftWithAi}
                      disabled={!aiRevisionPrompt.trim() || revisingDraftLoading}
                    >
                      {revisingDraftLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.aiRevisionSubmitBtnText}>Refine</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.accent }]}
                onPress={() => setDraftModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  caseHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  refCodeText: {
    fontSize: 11,
  },
  aiOverviewCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  aiOverviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiOverviewTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiOverviewHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  aiVerifiedTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aiOverviewBodyText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 4,
  },
  aiSectionSubheading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabItemTextActive: {
    fontWeight: '700',
  },
  integratedChatBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  integratedChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  integratedChatTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  whatMattersSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  whatMattersHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  factItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  factDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  factText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  routeSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeaderRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addEvidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addEvidenceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeadingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  missingReqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  missingReqTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  missingReqSub: {
    fontSize: 11,
    marginTop: 2,
  },
  uploadChipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  uploadChipBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  allSetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  allSetText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sourceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sourceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statutoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statutoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sourceTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sourceCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sourceCardRelevance: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  openSourceBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  openSourceBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    marginBottom: 8,
  },
  mainSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  nextActionHighlightCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  nextActionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  nextActionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nextActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  nextActionDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  nextActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  draftItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  draftItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  draftItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  openDraftBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyEvidenceBox: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyEvidenceTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyEvidenceDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  chatStreamContainer: {
    maxHeight: 280,
    minHeight: 120,
    marginVertical: 4,
  },
  chatBubbleWrapper: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  chatBubbleUserAlign: {
    justifyContent: 'flex-end',
  },
  chatBubbleAiAlign: {
    justifyContent: 'flex-start',
  },
  chatBubble: {
    maxWidth: '85%',
    borderRadius: 14,
    padding: 12,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  msgSenderLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  msgAttachmentBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  msgAttChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  msgAttChipText: {
    fontSize: 11,
    maxWidth: 120,
  },
  chatMessageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  contextualActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  actionChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionChipBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  thinkingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginVertical: 6,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 12,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pendingAttContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  pendingAttCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  pendingAttName: {
    fontSize: 11,
    maxWidth: 100,
  },
  composerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  composerIconBtn: {
    padding: 6,
  },
  composerTextInput: {
    flex: 1,
    fontSize: 13,
    minHeight: 36,
    maxHeight: 80,
    paddingHorizontal: 6,
  },
  sendUpdateBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSheetBody: {
    marginBottom: 16,
  },
  modalBlockTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalBlockDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalContent: {
    borderRadius: 20,
    margin: 16,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  versionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  versionPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  draftActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  draftActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  draftActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  draftScrollBox: {
    padding: 12,
    borderRadius: 10,
    maxHeight: 280,
    minHeight: 150,
  },
  draftTextContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  draftEditTextInput: {
    fontSize: 13,
    lineHeight: 20,
    minHeight: 150,
  },
  aiRevisionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  aiRevisionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiRevisionInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  aiRevisionInput: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
  },
  aiRevisionSubmitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  aiRevisionSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  modalCloseBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  // Linked Step Chips & Badges
  stepLinkChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 4,
  },
  stepLinkChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  legalBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  legalBadgeTextVerified: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legalBadgeTextAI: {
    color: '#6366F1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Overview Action Cards
  overviewActionCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  overviewActionStepTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  overviewActionStepDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    marginBottom: 6,
  },
  // Smart Question Flow Styles
  smartQuestionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  smartQuestionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  smartQuestionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smartQuestionCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipQuestionLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  smartQuestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  smartQuestionWhy: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  optionPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  optionPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionPillBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  smartAnswerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  smartAnswerTextInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  smartAttachIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // No Route Card Styles
  noRouteCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  noRouteTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  noRouteDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  noRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  noRouteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listeningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});

