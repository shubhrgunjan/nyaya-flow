import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { telemetryStore } from './telemetryRecorder';
import { taskClassifier } from './taskClassifier';
import { modelRouter, MODEL_HIERARCHY } from './modelRouter';
import { policyEngine } from './policyEngine';
import { providerRegistry, OfficialLegalSource } from '../legal/providerRegistry';
import { gnaniTranscriptionProvider, TranscriptionResult } from './gnaniProvider';

let genai: GoogleGenAI | null = null;
if (config.geminiApiKey) {
  try {
    genai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  } catch (err: any) {
    console.error('[Orchestrator] Gemini SDK init error:', err.message);
  }
}

export interface CaseAnalysisResult {
  category: string;
  subcategory: string;
  normalizedProblem: string;
  summary: string;
  queryIntent?: 'informational' | 'navigational' | 'case_problem' | 'actionable_matter';
  aiOverview?: string;
  usefulMissingQuestions?: Array<{ question: string; whyItMatters: string }>;
  jurisdiction: {
    country: string;
    state: string;
    district: string;
    forumOrCourt: string;
  };
  facts: Record<string, any>;
  people: string[];
  organizations: string[];
  dates: string[];
  amounts: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  riskFlags: string[];
  missingInformation: string[];
  evidenceNeeded: string[];
  possibleRoutes: string[];
  recommendedRoute: string;
  reasoningSummary: {
    whatUnderstood: string;
    whyThisRoute: string;
    whatIsUnknown: string;
    whatToCollect: string;
    whatHappensNext: string;
  };
  actions: {
    id: string;
    order: number;
    title: string;
    purpose: string;
    why: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    prerequisites: string[];
    requiredDocuments: string[];
    evidenceNeeded: string[];
    deadline?: string;
    officialResource?: string;
    sourceIds: string[];
    completionCriteria: string;
  }[];
  sources: OfficialLegalSource[];
  confidence: number;
  warnings: string[];
  meta: {
    traceId: string;
    modelUsed: string | null;
    latencyMs: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
      estimatedCostInr: number;
    };
    routingEfficiency: 'EXCELLENT' | 'GOOD' | 'BAD';
    whyNoModel?: string;
    whyThisModel?: string;
    policyViolation?: string;
  };
}

export class AIOrchestrator {
  /**
   * Process problem intake using Deterministic Task Classifier -> Policy Engine -> Query Sources -> Model Router.
   */
  async processProblemIntake(problemText: string, userLanguage: string = 'en', existingCaseId?: string): Promise<CaseAnalysisResult> {
    const startTime = Date.now();
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const trace = telemetryStore.createTrace(traceId, problemText, userLanguage, existingCaseId);

    const normalizedInput = problemText.trim();
    telemetryStore.addStep(traceId, {
      name: 'Input Normalizer',
      type: 'input',
      summary: `Normalized user input (${normalizedInput.length} chars, lang: ${userLanguage})`,
      details: { originalLength: problemText.length, userLanguage },
      durationMs: Date.now() - startTime,
    });

    // STEP 0: Deterministic Task Classifier (Zero-AI Check)
    const step0Start = Date.now();
    const classification = taskClassifier.classifyRequest(normalizedInput);

    telemetryStore.addStep(traceId, {
      name: 'Deterministic Task Classifier',
      type: 'decision',
      summary: `Intent: ${classification.intent} | AI Required: ${classification.aiRequired ? 'YES' : 'NO (0 TOKENS)'}`,
      details: { classification },
      durationMs: Date.now() - step0Start,
    });

    // STEP 0.5: Policy Engine Evaluation
    const policyEval = policyEngine.evaluatePolicy(
      classification.intent.toLowerCase(),
      normalizedInput,
      classification.aiRequired ? MODEL_HIERARCHY.LEVEL_1_CHEAP : null
    );

    // ────────────────────────────────────────────────────────────────────────
    // BRANCH A: ZERO-AI / DIRECT LOOKUP PATH (Informational / Navigational)
    // ────────────────────────────────────────────────────────────────────────
    if (!classification.aiRequired || !policyEval.allowed || classification.intent === 'DIRECT_LOOKUP') {
      trace.aiRequired = false;
      trace.whyNoModel = policyEval.reason || classification.reason;
      trace.routingEfficiency = 'EXCELLENT';

      const querySources = providerRegistry.findRelevantSources({
        category: classification.category,
        matchedProviderId: classification.matchedProviderId,
        keywords: normalizedInput.toLowerCase().split(' '),
      });

      const totalDuration = Date.now() - startTime;
      telemetryStore.finalizeTrace(traceId, totalDuration);

      // Informational / Navigational queries do NOT create empty procedural workflows!
      const isInformational = true;
      const directOverview = classification.directAnswer ||
        `Information and filing guidance for "${normalizedInput}". ` +
        (querySources[0] ? `Official source: ${querySources[0].title} (${querySources[0].url}).` : '');

      return {
        category: classification.category || 'general_legal',
        subcategory: classification.subcategory || 'Direct Legal Inquiry',
        normalizedProblem: normalizedInput,
        summary: classification.directAnswer || `Direct legal portal guidance for "${normalizedInput}".`,
        queryIntent: 'informational',
        aiOverview: directOverview,
        usefulMissingQuestions: normalizedInput.toLowerCase().includes('rti') ? [
          {
            question: "Is the public authority you are targeting a Central Government or State Government body?",
            whyItMatters: "Central Government authorities use rtionline.gov.in, while State Government authorities use their respective state portals.",
          }
        ] : [],
        jurisdiction: {
          country: 'India',
          state: '',
          district: '',
          forumOrCourt: querySources[0]?.provider || 'Official Authority',
        },
        facts: { query: normalizedInput, portal: querySources[0]?.title },
        people: [],
        organizations: [querySources[0]?.publisher || 'Government of India'],
        dates: [],
        amounts: [],
        urgency: 'low',
        riskFlags: [],
        missingInformation: [],
        evidenceNeeded: [],
        possibleRoutes: [querySources[0]?.title || 'Official Portal'],
        recommendedRoute: querySources[0]?.title || 'Official Portal Guidance',
        reasoningSummary: {
          whatUnderstood: `Understood query regarding ${classification.subcategory || 'legal procedure'}.`,
          whyThisRoute: `Direct official portal lookup matched: ${querySources[0]?.title || 'Official Authority'}.`,
          whatIsUnknown: 'None.',
          whatToCollect: 'Identity proof and relevant correspondence.',
          whatHappensNext: `Visit official portal ${querySources[0]?.url || ''} to proceed.`,
        },
        actions: [], // Empty workflow for informational queries!
        sources: querySources,
        confidence: 1.0,
        warnings: ['Nyaya Flow provides official portal navigation instructions.'],
        meta: {
          traceId,
          modelUsed: null,
          latencyMs: totalDuration,
          tokenUsage: { input: 0, output: 0, total: 0, estimatedCostInr: 0 },
          routingEfficiency: 'EXCELLENT',
          whyNoModel: policyEval.reason || classification.reason,
          policyViolation: policyEval.policyViolation,
        },
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // BRANCH B: LLM PATH (Tier-Appropriate Model Routing)
    // ────────────────────────────────────────────────────────────────────────
    const isQuestionOnly =
      normalizedInput.toLowerCase().startsWith('what is') ||
      normalizedInput.toLowerCase().startsWith('where to') ||
      normalizedInput.toLowerCase().startsWith('where do') ||
      normalizedInput.toLowerCase().startsWith('how much') ||
      normalizedInput.toLowerCase().startsWith('can my') ||
      normalizedInput.toLowerCase().startsWith('where can') ||
      normalizedInput.toLowerCase().startsWith('is it');

    const isComplex =
      normalizedInput.length > 250 ||
      normalizedInput.includes('legal notice') ||
      normalizedInput.includes('compare') ||
      normalizedInput.includes('options') ||
      normalizedInput.includes('withheld');

    const routing = modelRouter.routeTask('problem_intake', {
      aiRequired: true,
      inputLength: normalizedInput.length,
      requiresMultiSourceSynthesis: isComplex,
      hasAmbiguity: isComplex,
      strongModelReason: isComplex ? 'Multi-option legal analysis and complex case synthesis requested.' : undefined,
    });

    trace.whyThisModel = routing.whyThisModel;
    trace.routingEfficiency = routing.routingEfficiency;

    if (!genai || !config.geminiApiKey) {
      throw new Error('Gemini API key is missing or not configured on server.');
    }

    const modelToUse = routing.selectedModel || MODEL_HIERARCHY.LEVEL_1_CHEAP;
    const llmStart = Date.now();
    let responseText = '';
    let usageMeta = { inputTokens: 0, outputTokens: 0, totalTokens: 0, costInr: 0 };

    try {
      const prompt = `You are Nyaya Flow, an intelligent Indian legal navigation system.
Analyze the user's input and respond strictly in JSON format.

User Input: "${normalizedInput}"

Determine intent:
- "informational": User asking a general legal question ("Where to file RTI?", "What is section 138?", "How much does a complaint cost?", "What is RTI?"). For informational intent, DO NOT manufacture a multi-step procedural workflow! Set "actions" to empty array [].
- "actionable_matter": User describing a real dispute ("My landlord refuses to return ₹50,000 deposit", "Shop refused refund", "FIR quashing for firearm allegation"). For actionable matters, generate 1 to 4 clear action steps.

Schema:
{
  "queryIntent": "informational" | "navigational" | "case_problem" | "actionable_matter",
  "category": "tenant_dispute" | "consumer_rights" | "employment" | "banking_fraud" | "cyber_crime" | "property_dispute" | "general_legal",
  "subcategory": "Short topic title",
  "summary": "1-2 sentence summary of what user asked/reported",
  "aiOverview": "Formatted AI Overview. Must include:\\n### What this means\\n2-3 concise paragraphs explaining the situation in plain language.\\n\\n### What you should do\\nA concise explanation of the recommended action.\\n\\n### Next step\\nOne clearly emphasized action referencing [View Step 1] or official portal link.",
  "jurisdictionState": "State name if mentioned, else empty string",
  "amount": "Financial amount if mentioned, else empty string",
  "urgency": "low" | "medium" | "high" | "critical",
  "recommendedRoute": "Recommended legal route or authority name",
  "usefulMissingQuestions": [
    {
      "id": "q-1",
      "question": "Was the refund promise written anywhere, such as WhatsApp, receipt, or email?",
      "whyItMatters": "Establishes written vs verbal proof of terms under Indian contract law.",
      "inputType": "yes_no" | "text" | "document" | "multi_option" | "optional",
      "options": ["Yes, I have written proof", "No, it was only verbal", "I am not sure"],
      "priority": 1
    }
  ],
  "reasoningSummary": {
    "whatUnderstood": "What Nyaya Flow understood about the situation",
    "whyThisRoute": "Why this route or answer applies under Indian legal procedures",
    "whatIsUnknown": "Key missing detail",
    "whatToCollect": "Evidence to gather",
    "whatHappensNext": "Immediate next step"
  },
  "actions": [
    {
      "title": "Action step title",
      "purpose": "Why this step is required",
      "why": "Legal rationale under Indian law (e.g. Section 482 CrPC / BNSS 528)",
      "priority": "high" | "medium" | "low",
      "requiredDocuments": ["document name"],
      "evidenceNeeded": ["evidence name"]
    }
  ]
}`;

      const response = await genai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      responseText = response.text || '';
      const estimatedIn = Math.ceil(prompt.length / 4);
      const estimatedOut = Math.ceil(responseText.length / 4);
      const totalTokens = estimatedIn + estimatedOut;
      const costInr = (totalTokens / 1000) * 0.005;

      usageMeta = { inputTokens: estimatedIn, outputTokens: estimatedOut, totalTokens, costInr };
    } catch (err: any) {
      console.error('[Orchestrator] Intake Error:', err);
      throw err;
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { category: 'general_legal', subcategory: 'Legal Query', summary: normalizedInput };
    }

    const category = parsed.category || 'general_legal';
    const querySources = providerRegistry.findRelevantSources({
      category,
      keywords: [parsed.subcategory || '', ...normalizedInput.toLowerCase().split(' ')],
    });

    const queryIntent = parsed.queryIntent || (isQuestionOnly ? 'informational' : 'actionable_matter');
    const isInfoOnly = queryIntent === 'informational' || queryIntent === 'navigational';

    const actions = isInfoOnly
      ? []
      : (parsed.actions || [
          { title: 'Gather documentary evidence', purpose: 'Consolidate proof before filing complaint' },
          { title: 'Send statutory legal demand notice', purpose: 'Provide 15-day notice period' },
          { title: 'Approach competent legal authority', purpose: 'File petition before appropriate forum' },
        ]).map((act: any, idx: number) => ({
          id: `act-${idx + 1}`,
          order: idx + 1,
          title: act.title,
          purpose: act.purpose || 'Procedural requirement',
          why: act.why || act.purpose || 'Required under Indian statutory process.',
          priority: act.priority || 'medium',
          status: idx === 0 ? ('in_progress' as const) : ('pending' as const),
          prerequisites: [],
          requiredDocuments: act.requiredDocuments || [],
          evidenceNeeded: act.evidenceNeeded || [],
          officialResource: querySources[0]?.url,
          sourceIds: querySources.slice(0, 2).map((s) => s.id),
          completionCriteria: act.completionCriteria || 'Complete procedural step.',
        }));

    const totalDuration = Date.now() - startTime;
    telemetryStore.finalizeTrace(traceId, totalDuration);

    const defaultOverview = `Understood your query regarding ${parsed.subcategory || category}. ` +
      `Relevant provisions under Indian Law provide specific statutory rights for this situation. ` +
      (querySources[0] ? `Official source: ${querySources[0].title}.` : '');

    const formattedQuestions = (parsed.usefulMissingQuestions || []).map((q: any, idx: number) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question || 'Do you have additional details or proof?',
      whyItMatters: q.whyItMatters || 'Helps establish the governing statutory framework under Indian law.',
      inputType: q.inputType || (q.question.toLowerCase().includes('invoice') || q.question.toLowerCase().includes('document') ? 'document' : q.question.toLowerCase().includes('written') || q.question.toLowerCase().includes('was') ? 'yes_no' : 'text'),
      options: q.options || (q.inputType === 'yes_no' || (!q.inputType && (q.question.toLowerCase().includes('written') || q.question.toLowerCase().includes('was'))) ? ['Yes, I have written proof', 'No, it was only verbal', "I am not sure"] : undefined),
      priority: q.priority || idx + 1,
    }));

    return {
      category,
      subcategory: parsed.subcategory || 'Legal Dispute',
      normalizedProblem: parsed.summary || normalizedInput,
      summary: parsed.summary || normalizedInput,
      queryIntent,
      aiOverview: parsed.aiOverview || defaultOverview,
      usefulMissingQuestions: formattedQuestions,
      jurisdiction: {
        country: 'India',
        state: parsed.jurisdictionState || '',
        district: '',
        forumOrCourt: querySources[0]?.provider || 'Appropriate Legal Authority',
      },
      facts: { amount: parsed.amount },
      people: [],
      organizations: [],
      dates: [],
      amounts: parsed.amount ? [parsed.amount] : [],
      urgency: parsed.urgency || 'medium',
      riskFlags: [],
      missingInformation: parsed.reasoningSummary?.whatIsUnknown ? [parsed.reasoningSummary.whatIsUnknown] : [],
      evidenceNeeded: parsed.reasoningSummary?.whatToCollect ? [parsed.reasoningSummary.whatToCollect] : [],
      possibleRoutes: [parsed.recommendedRoute || 'Statutory Legal Remedy'],
      recommendedRoute: parsed.recommendedRoute || 'Statutory Legal Remedy',
      reasoningSummary: parsed.reasoningSummary || {
        whatUnderstood: `Understood situation regarding ${parsed.subcategory || category}.`,
        whyThisRoute: `Selected route based on relevant Indian statutory framework.`,
        whatIsUnknown: 'Written agreement terms or formal notice history.',
        whatToCollect: 'Payment receipts and written communications.',
        whatHappensNext: 'Prepare legal demand notice.',
      },
      actions,
      sources: querySources,
      confidence: 0.95,
      warnings: ['Nyaya Flow provides legal navigation, not formal attorney representation.'],
      meta: {
        traceId,
        modelUsed: modelToUse,
        latencyMs: totalDuration,
        tokenUsage: {
          input: usageMeta.inputTokens,
          output: usageMeta.outputTokens,
          total: usageMeta.totalTokens,
          estimatedCostInr: usageMeta.costInr,
        },
        routingEfficiency: routing.routingEfficiency,
        whyThisModel: routing.whyThisModel,
      },
    };
  }

  async processIncrementalCaseUpdate(caseId: string, newMessage: string, currentCaseState: any): Promise<any> {
    const startTime = Date.now();
    const traceId = `trace-upd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    telemetryStore.createTrace(traceId, newMessage, currentCaseState.language || 'en', caseId);

    const routing = modelRouter.routeTask('fact_extraction');
    telemetryStore.addStep(traceId, {
      name: 'Incremental Update Decision',
      type: 'decision',
      summary: `Using low-cost model (${MODEL_HIERARCHY.LEVEL_1_CHEAP}) for incremental fact extraction`,
      details: { routing },
      durationMs: 0,
    });

    if (!genai || !config.geminiApiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const prompt = `Extract structured legal facts from user message: "${newMessage}".
Context: Case Category: ${currentCaseState.category || 'general_legal'}, Subcategory: ${currentCaseState.subcategory || ''}.

Return JSON:
{
  "extractedFacts": { "key": "value" },
  "newDocuments": ["document name"],
  "systemExplanation": "1 concise sentence explaining what changed in the case"
}`;

    const response = await genai.models.generateContent({
      model: MODEL_HIERARCHY.LEVEL_1_CHEAP,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text || '{}';
    const estimatedIn = Math.ceil(prompt.length / 4);
    const estimatedOut = Math.ceil(text.length / 4);

    telemetryStore.recordModelCall(traceId, {
      timestamp: new Date().toISOString(),
      provider: 'Google Gemini',
      model: MODEL_HIERARCHY.LEVEL_1_CHEAP,
      purpose: 'Incremental Fact Extraction',
      requestId: traceId,
      latencyMs: Date.now() - startTime,
      inputTokens: estimatedIn,
      outputTokens: estimatedOut,
      totalTokens: estimatedIn + estimatedOut,
      estimatedCostInr: ((estimatedIn + estimatedOut) / 1000) * 0.005,
      status: 'success',
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { systemExplanation: 'Updated case with new information.' };
    }

    telemetryStore.finalizeTrace(traceId, Date.now() - startTime);

    return {
      extractedFacts: parsed.extractedFacts || {},
      newDocuments: parsed.newDocuments || [],
      updatedFields: ['facts', 'documents', 'timeline'],
      affectedActionIds: ['act-1'],
      systemExplanation: parsed.systemExplanation || 'Updated case facts with your new information.',
      traceId,
    };
  }

  async processActionFollowUp(stepTitle: string, stepPurpose: string, userQuestion: string, caseCategory: string): Promise<string> {
    const routing = modelRouter.routeTask('action_followup', { aiRequired: true, inputLength: userQuestion.length });
    const modelToUse = routing.selectedModel || MODEL_HIERARCHY.LEVEL_3_MID;

    if (!genai || !config.geminiApiKey) {
      return `Step "${stepTitle}" is required under ${caseCategory.replace('_', ' ')} procedures to establish formal proof.`;
    }

    const prompt = `Action Step: "${stepTitle}"
Purpose: "${stepPurpose}"
Case Category: "${caseCategory}"
User Question: "${userQuestion}"

Provide a concise 2-sentence practical answer explaining the rationale or alternative evidence options under Indian legal procedures.`;

    try {
      const response = await genai.models.generateContent({
        model: modelToUse,
        contents: prompt,
      });
      return response.text?.trim() || `Step "${stepTitle}" is required under legal procedure.`;
    } catch {
      return `Step "${stepTitle}" is required to satisfy statutory procedural requirements.`;
    }
  }

  async processDraftGeneration(documentType: string, caseState: any): Promise<string> {
    const routing = modelRouter.routeTask('personalized_drafting', {
      aiRequired: true,
      requiresMultiSourceSynthesis: true,
      strongModelReason: 'Personalized legal document draft generation based on case facts.',
    });

    const modelToUse = routing.selectedModel || MODEL_HIERARCHY.LEVEL_4_STRONG;

    if (!genai || !config.geminiApiKey) {
      return `LEGAL DEMAND NOTICE\n\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nRe: ${caseState.title || 'Legal Claim'}\n\nPlease satisfy claim within 15 days.`;
    }

    const prompt = `Generate a formal legal ${documentType.replace('_', ' ').toUpperCase()} under Indian law.
Case Title: "${caseState.title || 'Legal Dispute'}"
Category: "${caseState.category || 'General'}"
Summary: "${caseState.summary || ''}"
Known Facts: ${JSON.stringify(caseState.facts || {})}
Amount: ${caseState.amounts?.[0] || '₹50,000'}

Write a formal legal draft with standard statutory demand notice format, 15-day cure period, and signature placeholder. Use ONLY facts provided above. Do not invent false facts.`;

    try {
      const response = await genai.models.generateContent({
        model: modelToUse,
        contents: prompt,
      });
      return response.text?.trim() || `LEGAL DEMAND NOTICE\n\nDate: ${new Date().toLocaleDateString('en-IN')}`;
    } catch (err: any) {
      console.error('[Draft Generation Error]', err);
      return `LEGAL DEMAND NOTICE\n\nDate: ${new Date().toLocaleDateString('en-IN')}\n\nTo Opposing Party,\n\nNotice is hereby given to resolve the claim within 15 days.`;
    }
  }

  async transcribeAudio(
    audioBase64: string,
    mimeType: string = 'audio/m4a',
    provider: 'gemini' | 'gnani' = 'gemini',
    userLanguage: string = 'en',
    traceId?: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const effectiveTraceId = traceId || `trace-stt-${Date.now()}`;

    if (provider === 'gnani') {
      try {
        const result = await gnaniTranscriptionProvider.transcribe(audioBase64, {
          mimeType,
          userLanguage,
        });
        const latencyMs = Date.now() - startTime;

        telemetryStore.addStep(effectiveTraceId, {
          name: 'Voice Transcription',
          type: 'provider_request',
          summary: `Provider: Gnani.ai | Language: ${userLanguage} | Latency: ${latencyMs}ms | Status: Success`,
          details: {
            provider: 'gnani',
            language: userLanguage,
            model: 'Gnani ASR Engine',
            latencyMs,
            status: 'Success',
            durationSec: result.durationMs ? (result.durationMs / 1000).toFixed(1) : undefined,
          },
          durationMs: latencyMs,
        });

        return result;
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        telemetryStore.addStep(effectiveTraceId, {
          name: 'Voice Transcription',
          type: 'provider_request',
          summary: `Provider: Gnani.ai | Language: ${userLanguage} | Status: Error (${err.message})`,
          details: { provider: 'gnani', language: userLanguage, error: err.message, status: 'Error' },
          durationMs: latencyMs,
        });
        console.error('[Orchestrator] Gnani.ai transcription error:', err.message || err);
        throw new Error(err.message || 'Voice transcription with Gnani.ai failed.');
      }
    }

    // DEFAULT GEMINI VOICE TRANSCRIPTION PIPELINE
    if (!genai || !config.geminiApiKey) {
      throw new Error('Gemini API key is not configured on the server.');
    }

    try {
      const response = await genai.models.generateContent({
        model: MODEL_HIERARCHY.LEVEL_3_MID,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: audioBase64 } },
              {
                text: `Transcribe this voice recording accurately into plain text. The user is describing a legal situation in India (spoken in language: ${userLanguage}). Return ONLY the direct transcribed text without any extra commentary or introductory text.`,
              },
            ],
          },
        ],
      });
      const transcript = response.text?.trim() || '';
      if (!transcript) {
        throw new Error('Transcription engine returned empty result.');
      }
      const latencyMs = Date.now() - startTime;

      telemetryStore.addStep(effectiveTraceId, {
        name: 'Voice Transcription',
        type: 'provider_request',
        summary: `Provider: Gemini | Language: ${userLanguage} | Latency: ${latencyMs}ms | Status: Success`,
        details: {
          provider: 'gemini',
          language: userLanguage,
          model: MODEL_HIERARCHY.LEVEL_3_MID,
          latencyMs,
          status: 'Success',
        },
        durationMs: latencyMs,
      });

      return {
        text: transcript,
        language: userLanguage,
        provider: 'gemini',
        durationMs: latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      telemetryStore.addStep(effectiveTraceId, {
        name: 'Voice Transcription',
        type: 'provider_request',
        summary: `Provider: Gemini | Language: ${userLanguage} | Status: Error (${err.message})`,
        details: { provider: 'gemini', language: userLanguage, error: err.message, status: 'Error' },
        durationMs: latencyMs,
      });
      console.error('[Orchestrator] Gemini Audio transcription error:', err.message || err);
      throw new Error(`Audio transcription failed: ${err.message || 'Unknown AI error'}`);
    }
  }

  async processDocumentAnalysis(imageBase64?: string, mimeType: string = 'image/jpeg', contextDescription: string = ''): Promise<any> {
    if (!genai || !config.geminiApiKey || !imageBase64) {
      return {
        documentType: 'Legal Document',
        summary: contextDescription || 'Scanned legal document evidence.',
        facts: {},
        extractedEntities: [],
        deadlines: [],
        amounts: [],
        suggestedActions: ['Attach to legal notice', 'Keep safe copy'],
      };
    }

    try {
      const response = await genai.models.generateContent({
        model: MODEL_HIERARCHY.LEVEL_3_MID,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              {
                text: `Analyze this scanned legal document or notice image in India. Return JSON object with keys:
{
  "documentType": "string",
  "summary": "string",
  "facts": { "key": "value" },
  "extractedEntities": ["string"],
  "deadlines": ["string"],
  "amounts": ["string"],
  "suggestedActions": ["string"]
}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    } catch (err: any) {
      console.error('[Orchestrator] Document analysis error:', err.message);
      return {
        documentType: 'Scanned Document',
        summary: 'Scanned evidence document.',
        facts: {},
        extractedEntities: [],
        deadlines: [],
        amounts: [],
        suggestedActions: ['Attach to legal notice'],
      };
    }
  }

  async processCaseChat(
    caseId: string,
    messageText: string,
    attachments: Array<{ base64?: string; fileName?: string; mimeType?: string }> = [],
    currentCaseState: any = {}
  ): Promise<{
    replyText: string;
    eventType: string;
    extractedFacts?: Record<string, any>;
    completedStepNumber?: number | null;
    suggestedActions?: Array<{ id: string; label: string; actionType: string; payload?: any }>;
    missingQuestions?: string[];
    extractedEvidence?: any[];
  }> {
    const traceId = `trace-chat-${Date.now()}`;
    const cleanMsg = (messageText || '').trim();

    if (!genai || !config.geminiApiKey) {
      // Intelligent fallback when API key is unconfigured
      const lower = cleanMsg.toLowerCase();
      const isGreeting = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'thanks'].includes(lower);

      if (isGreeting) {
        return {
          replyText: "Hello! I am your Nyaya Flow legal assistant. How can I assist you with your case today?",
          eventType: 'conversation',
        };
      }

      if (lower.includes('receipt') || lower.includes("don't have") || lower.includes("dont have") || lower.includes("missing")) {
        return {
          replyText: "That's okay! A purchase receipt strengthens your claim, but it is not the only way to establish the transaction under Indian law. You can also rely on bank/UPI statements, WhatsApp conversations, or email confirmations to prove the purchase.",
          eventType: 'new_fact',
          extractedFacts: { hasReceipt: false },
          suggestedActions: [
            { id: 'act-1', label: 'Generate Demand Notice', actionType: 'generate_draft', payload: { documentType: 'demand_notice' } },
          ],
        };
      }

      return {
        replyText: `### Analysis\nUnderstood your update: "${cleanMsg}".\n\n### What applies\nRelevant statutory regulations under Indian Law (such as Consumer Protection Act or RERA) protect your rights.\n\n### What you can do\nYou can issue a formal legal notice or approach the competent authority.`,
        eventType: 'question',
        suggestedActions: [
          { id: 'act-1', label: 'Generate Legal Notice', actionType: 'generate_draft', payload: { documentType: 'demand_notice' } },
        ],
      };
    }

    const systemPrompt = `You are Nyaya Flow AI, an intelligent, empathetic, and accurate Indian legal navigator.
You are assisting a non-lawyer user with their ongoing legal case in India.

Case Category: "${currentCaseState.category || 'general_legal'}"
Case Title: "${currentCaseState.title || 'Legal Dispute'}"
Summary: "${currentCaseState.summary || currentCaseState.problemSummary || ''}"
Jurisdiction State: "${currentCaseState.jurisdiction?.state || ''}"
Existing Known Facts: ${JSON.stringify(currentCaseState.facts || {})}
Amounts: ${JSON.stringify(currentCaseState.amounts || [])}
Actions/Roadmap: ${JSON.stringify((currentCaseState.actions || []).map((a: any) => ({ step: a.stepNumber || a.order, title: a.title, status: a.status })))}

User Message: "${cleanMsg}"
Attachments Provided: ${attachments.length} attachment(s).

INSTRUCTIONS FOR YOUR RESPONSE:
1. Determine the intent/event type:
   - "conversation": Casual greeting or thanks ("Hi", "Hello", "Thanks"). Respond naturally without fake legal updates or audit entries!
   - "question": Legal query ("What is RTI?", "Can landlord deduct deposit?", "What happens next?"). Follow 4-part structure if legal query:
       1) Plain-language explanation
       2) What may apply
       3) What can be done
       4) What is missing (ONLY if critical information is missing)
   - "new_fact": User providing new case details ("The builder replied today saying no refund").
   - "correction": User correcting a fact ("Actually it was ₹4.3 lakh, not ₹4.8 lakh").
   - "action_completed": User completed a route step ("I already sent the legal notice", "I submitted the RTI").
   - "evidence": Uploaded or described document evidence.
   - "draft_request": Requesting a legal document draft ("Generate legal notice", "Draft RTI application").

2. REASONING RULES:
   - Do NOT invent false dates, amounts, locations, or legal outcomes.
   - If important context is missing that changes the route (e.g. state jurisdiction or whether notice was already sent), ask 1 or 2 minimum useful questions.
   - If user says they completed a step, identify which step number (e.g., step 1 or step 2) was completed.
   - If evidence is uploaded, extract documentType, summary, amount, date.

Return strict JSON:
{
  "replyText": "Markdown response string",
  "eventType": "conversation|question|new_fact|correction|action_completed|evidence|draft_request",
  "extractedFacts": { "amount": "₹4.3 lakh", "opposingPartyReply": "Refused refund" },
  "completedStepNumber": 1 (or null if none completed),
  "missingQuestions": ["Which state is the property located in?"],
  "suggestedActions": [
    { "id": "act-draft", "label": "Generate Legal Notice", "actionType": "generate_draft", "payload": { "documentType": "demand_notice" } }
  ]
}`;

    try {
      const contentsParts: any[] = [];
      for (const att of attachments) {
        if (att.base64) {
          contentsParts.push({
            inlineData: { mimeType: att.mimeType || 'image/jpeg', data: att.base64 },
          });
        }
      }
      contentsParts.push({ text: systemPrompt });

      const response = await genai.models.generateContent({
        model: MODEL_HIERARCHY.LEVEL_3_MID,
        contents: [
          {
            role: 'user',
            parts: contentsParts,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      return {
        replyText: parsed.replyText || "Understood your query.",
        eventType: parsed.eventType || 'question',
        extractedFacts: parsed.extractedFacts || {},
        completedStepNumber: parsed.completedStepNumber || null,
        suggestedActions: parsed.suggestedActions || [],
        missingQuestions: parsed.missingQuestions || [],
      };
    } catch (err: any) {
      console.error('[Process Case Chat Error]', err);
      return {
        replyText: `I received your message. Let's analyze how this affects your case.`,
        eventType: 'question',
      };
    }
  }

  async processDraftRevision(draftText: string, userPrompt: string, caseState: any = {}): Promise<string> {
    if (!genai || !config.geminiApiKey) {
      return `${draftText}\n\n[REVISED AS REQUESTED: ${userPrompt}]`;
    }

    const prompt = `You are revising an existing legal draft under Indian Law.
Existing Draft:
"""
${draftText}
"""

User Revision Instruction: "${userPrompt}"
Case Context: Title "${caseState.title || ''}", Category "${caseState.category || ''}".

Modify the existing draft according to the user's instructions (e.g. make firmer, add dates/facts, shorten, translate). Return ONLY the full revised legal document text, keeping formal legal layout.`;

    try {
      const response = await genai.models.generateContent({
        model: MODEL_HIERARCHY.LEVEL_3_MID,
        contents: prompt,
      });
      return response.text?.trim() || draftText;
    } catch (err: any) {
      console.error('[Draft Revision Error]', err);
      return `${draftText}\n\n[REVISED: ${userPrompt}]`;
    }
  }

  /**
   * Fast, cost-optimized presentation re-rendering of existing case into a new target language.
   * Keeps underlying structured facts, amounts, IDs, and statutory references intact.
   */
  async translateCasePresentation(caseState: any, targetLanguage: string = 'en'): Promise<any> {
    if (!genai || !config.geminiApiKey) {
      return {
        ...caseState,
        language: typeof caseState.language === 'object'
          ? { ...caseState.language, code: targetLanguage }
          : targetLanguage,
      };
    }

    const langNameMap: Record<string, string> = {
      hi: 'Hindi (हिन्दी)',
      mr: 'Marathi (मराठी)',
      hinglish: 'Hinglish (Hindi written in natural Hinglish script)',
      en: 'English',
      bn: 'Bengali (বাংলা)',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
    };
    const targetLangName = langNameMap[targetLanguage] || targetLanguage;

    const prompt = `You are Nyaya Flow's presentation translation engine.
Your task is to re-render existing user-facing case text into ${targetLangName} WITHOUT altering any facts, amounts, document IDs, step IDs, legal conclusions, or statutory names.

INPUT CASE PRESENTATION DATA:
Title: "${caseState.title || ''}"
Summary: "${caseState.summary || ''}"
Problem Summary: "${caseState.problemSummary || ''}"
AI Overview: "${caseState.aiOverview || ''}"
Recommended Route: "${caseState.recommendedRoute || ''}"
Reasoning Summary: ${JSON.stringify(caseState.reasoningSummary || {})}
Useful Missing Questions: ${JSON.stringify(caseState.usefulMissingQuestions || [])}
Action Steps: ${JSON.stringify((caseState.actions || []).map((a: any) => ({
  id: a.id,
  stepNumber: a.stepNumber || a.order,
  title: a.title,
  purpose: a.purpose,
  why: a.why,
  requiredDocuments: a.requiredDocuments
})))}

CRITICAL TRANSLATION RULES:
1. Translate all explanatory text, summaries, action titles, purposes, rationale (why), and questions into ${targetLangName}.
2. DO NOT translate official names of Acts, Sections, Court/Tribunal names, Government Portals (e.g. "National Cyber Crime Reporting Portal", "EDAKHIL Portal", "RERA Tribunal"), CNR numbers, or URLs. Keep official names in standard form and explain them in ${targetLangName}.
3. Keep step IDs and structural array lengths identical.

Return JSON ONLY:
{
  "title": "Translated title",
  "summary": "Translated summary",
  "problemSummary": "Translated problem summary",
  "aiOverview": "Translated AI overview in markdown",
  "recommendedRoute": "Translated recommended route name",
  "reasoningSummary": {
    "whatUnderstood": "Translated explanation",
    "whyThisRoute": "Translated explanation",
    "whatIsUnknown": "Translated explanation",
    "whatToCollect": "Translated explanation",
    "whatHappensNext": "Translated explanation"
  },
  "usefulMissingQuestions": [
    {
      "id": "q-1",
      "question": "Translated question",
      "whyItMatters": "Translated explanation"
    }
  ],
  "actions": [
    {
      "id": "act-1",
      "title": "Translated title",
      "purpose": "Translated purpose",
      "why": "Translated legal why rationale",
      "requiredDocuments": ["Translated document name"]
    }
  ]
}`;

    try {
      const response = await genai.models.generateContent({
        model: MODEL_HIERARCHY.LEVEL_1_CHEAP,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      const updatedReasoning = {
        ...caseState.reasoningSummary,
        ...(parsed.reasoningSummary || {}),
      };

      const updatedQuestions = (caseState.usefulMissingQuestions || []).map((q: any, idx: number) => {
        const translatedQ = parsed.usefulMissingQuestions?.[idx] || parsed.usefulMissingQuestions?.find((pq: any) => pq.id === q.id);
        return {
          ...q,
          question: translatedQ?.question || q.question,
          whyItMatters: translatedQ?.whyItMatters || q.whyItMatters,
        };
      });

      const updatedActions = (caseState.actions || []).map((act: any, idx: number) => {
        const translatedAct = parsed.actions?.[idx] || parsed.actions?.find((pa: any) => pa.id === act.id);
        return {
          ...act,
          title: translatedAct?.title || act.title,
          purpose: translatedAct?.purpose || act.purpose,
          why: translatedAct?.why || act.why,
          requiredDocuments: translatedAct?.requiredDocuments || act.requiredDocuments,
        };
      });

      const updatedActionPlanSteps = (caseState.actionPlan?.steps || []).map((step: any, idx: number) => {
        const matchingAction = updatedActions[idx];
        return {
          ...step,
          title: matchingAction?.title || step.title,
          description: matchingAction?.purpose || step.description,
          reason: matchingAction?.why || step.reason,
        };
      });

      return {
        ...caseState,
        title: parsed.title || caseState.title,
        summary: parsed.summary || caseState.summary,
        problemSummary: parsed.problemSummary || caseState.problemSummary,
        aiOverview: parsed.aiOverview || caseState.aiOverview,
        recommendedRoute: parsed.recommendedRoute || caseState.recommendedRoute,
        reasoningSummary: updatedReasoning,
        usefulMissingQuestions: updatedQuestions,
        actions: updatedActions,
        actionPlan: {
          ...caseState.actionPlan,
          title: parsed.title ? `${parsed.title} Action Plan` : caseState.actionPlan?.title,
          contextMessage: parsed.summary || caseState.actionPlan?.contextMessage,
          steps: updatedActionPlanSteps,
        },
      };
    } catch (err: any) {
      console.error('[Translate Case Presentation Error]', err);
      return caseState;
    }
  }
}

export const aiOrchestrator = new AIOrchestrator();




