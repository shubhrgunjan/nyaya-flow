import { Router, Request, Response } from 'express';
import { aiOrchestrator } from '../ai/orchestrator';

export const aiRouter = Router();

// ─── Analyze Problem (Full AI Orchestration Pipeline) ────────────────────────
aiRouter.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  const { problemDescription, userLanguage = 'en', caseId } = req.body;

  if (!problemDescription || typeof problemDescription !== 'string') {
    res.status(400).json({ error: 'problemDescription is required' });
    return;
  }

  try {
    const analysisResult = await aiOrchestrator.processProblemIntake(problemDescription, userLanguage, caseId);
    res.json({
      success: true,
      analysis: analysisResult,
      meta: analysisResult.meta,
    });
  } catch (err: any) {
    console.error('[AI Route Error]', err.message || err);
    res.status(502).json({
      error: `AI Orchestration pipeline error: ${err.message || String(err)}`,
      code: 'AI_PIPELINE_ERROR',
    });
  }
});

// ─── Incremental Case Update (Fact Extraction & Roadmap Mutation) ────────────
aiRouter.post('/update-case', async (req: Request, res: Response): Promise<void> => {
  const { caseId, newMessage, currentCaseState } = req.body;

  if (!caseId || !newMessage || !currentCaseState) {
    res.status(400).json({ error: 'caseId, newMessage, and currentCaseState are required' });
    return;
  }

  try {
    const updateResult = await aiOrchestrator.processIncrementalCaseUpdate(caseId, newMessage, currentCaseState);
    res.json({
      success: true,
      update: updateResult,
    });
  } catch (err: any) {
    console.error('[AI Update Case Error]', err.message || err);
    res.status(502).json({
      error: `Incremental case update failed: ${err.message}`,
      code: 'AI_UPDATE_ERROR',
    });
  }
});

// ─── Document Analysis (Multimodal Fact Extraction) ──────────────────────────
aiRouter.post('/analyze-document', async (req: Request, res: Response): Promise<void> => {
  const { imageBase64, mimeType = 'image/jpeg', contextDescription = '' } = req.body;

  try {
    const analysisResult = await aiOrchestrator.processDocumentAnalysis(imageBase64, mimeType, contextDescription);

    res.json({
      success: true,
      documentAnalysis: analysisResult,
    });
  } catch (err: any) {
    console.error('[AI Document Analysis Error]', err.message || err);
    res.status(502).json({
      error: `Document analysis failed: ${err.message}`,
      code: 'GEMINI_API_ERROR',
    });
  }
});

// ─── Audio Voice Transcription Endpoint ──────────────────────────────────────
aiRouter.post('/transcribe-audio', async (req: Request, res: Response): Promise<void> => {
  const { audioBase64, mimeType = 'audio/m4a', provider = 'gemini', userLanguage = 'en', traceId } = req.body;

  if (!audioBase64) {
    res.status(400).json({ error: 'audioBase64 is required' });
    return;
  }

  try {
    const result = await aiOrchestrator.transcribeAudio(
      audioBase64,
      mimeType,
      provider as 'gemini' | 'gnani',
      userLanguage,
      traceId
    );

    res.json({
      success: true,
      transcript: typeof result === 'string' ? result : result.text,
      provider: typeof result === 'object' ? result.provider : provider,
      language: typeof result === 'object' ? result.language : userLanguage,
      confidence: typeof result === 'object' ? result.confidence : undefined,
      durationMs: typeof result === 'object' ? result.durationMs : undefined,
    });
  } catch (err: any) {
    console.error('[Audio Transcription Error]', err.message || err);
    res.status(502).json({
      success: false,
      error: err.message || 'Audio transcription failed',
      code: 'TRANSCRIPTION_ERROR',
      provider,
    });
  }
});

// ─── Action Plan Endpoint ──────────────────────────────────────────────────
aiRouter.post('/action-plan', async (req: Request, res: Response): Promise<void> => {
  const { analysis, userLanguage = 'en' } = req.body;

  if (!analysis) {
    res.status(400).json({ error: 'analysis object is required' });
    return;
  }

  res.json({
    success: true,
    actionPlan: {
      title: `${analysis.category || 'Legal'} Action Plan`,
      contextMessage: analysis.reasoningSummary?.whatUnderstood || 'Here is your structured action plan.',
      steps: analysis.actions || [],
    },
  });
});

// ─── Action Follow-up Question Endpoint ──────────────────────────────────────
aiRouter.post('/action-followup', async (req: Request, res: Response): Promise<void> => {
  const { stepTitle, stepPurpose, userQuestion, caseCategory = 'general_legal' } = req.body;

  if (!stepTitle || !userQuestion) {
    res.status(400).json({ error: 'stepTitle and userQuestion are required' });
    return;
  }

  try {
    const answer = await aiOrchestrator.processActionFollowUp(stepTitle, stepPurpose || '', userQuestion, caseCategory);
    res.json({
      success: true,
      answer,
    });
  } catch (err: any) {
    console.error('[Action Followup Error]', err.message || err);
    res.status(502).json({
      error: `Follow-up question failed: ${err.message}`,
      code: 'FOLLOWUP_ERROR',
    });
  }
});

// ─── Legal Draft Generation Endpoint ────────────────────────────────────────
aiRouter.post('/generate-draft', async (req: Request, res: Response): Promise<void> => {
  const { documentType = 'demand_notice', caseState } = req.body;

  if (!caseState) {
    res.status(400).json({ error: 'caseState is required' });
    return;
  }

  try {
    const draftText = await aiOrchestrator.processDraftGeneration(documentType, caseState);
    res.json({
      success: true,
      documentType,
      draftText,
    });
  } catch (err: any) {
    console.error('[Generate Draft Error]', err.message || err);
    res.status(502).json({
      error: `Draft generation failed: ${err.message}`,
      code: 'DRAFT_GEN_ERROR',
    });
  }
});

// ─── Legal Draft Revision Endpoint ──────────────────────────────────────────
aiRouter.post('/revise-draft', async (req: Request, res: Response): Promise<void> => {
  const { draftText, userPrompt, caseState } = req.body;

  if (!draftText || !userPrompt) {
    res.status(400).json({ error: 'draftText and userPrompt are required' });
    return;
  }

  try {
    const revisedText = await aiOrchestrator.processDraftRevision(draftText, userPrompt, caseState || {});
    res.json({
      success: true,
      revisedText,
    });
  } catch (err: any) {
    console.error('[Revise Draft Error]', err.message || err);
    res.status(502).json({
      error: `Draft revision failed: ${err.message}`,
      code: 'DRAFT_REVISE_ERROR',
    });
  }
});

// ─── Unified Case Chat Endpoint (Central Control Surface) ───────────────────
aiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const { caseId, messageText, attachments = [], currentCaseState } = req.body;

  if (!caseId || (!messageText && attachments.length === 0) || !currentCaseState) {
    res.status(400).json({ error: 'caseId, currentCaseState, and messageText/attachments are required' });
    return;
  }

  try {
    const chatResult = await aiOrchestrator.processCaseChat(caseId, messageText || '', attachments, currentCaseState);
    res.json({
      success: true,
      chat: chatResult,
    });
  } catch (err: any) {
    console.error('[Case Chat Error]', err.message || err);
    res.status(502).json({
      error: `Case chat processing failed: ${err.message}`,
      code: 'CHAT_ERROR',
    });
  }
});

// ─── Case Presentation Translation Endpoint (Fast Low-Cost Re-render) ────────
aiRouter.post('/translate-case', async (req: Request, res: Response): Promise<void> => {
  const { caseState, targetLanguage = 'en' } = req.body;

  if (!caseState) {
    res.status(400).json({ error: 'caseState object is required' });
    return;
  }

  try {
    const translatedCase = await aiOrchestrator.translateCasePresentation(caseState, targetLanguage);
    res.json({
      success: true,
      case: translatedCase,
    });
  } catch (err: any) {
    console.error('[Translate Case Error]', err.message || err);
    res.status(500).json({
      success: false,
      error: `Case translation failed: ${err.message}`,
    });
  }
});




