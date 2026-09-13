export type ModelTier = 'level_0_none' | 'level_1_cheap_lite' | 'level_2_workhorse_lite' | 'level_3_mid_reasoning' | 'level_4_strong_reasoning';

export interface ModelRoutingDecision {
  tier: ModelTier;
  selectedModel: string | null;
  reason: string;
  deterministicBypass: boolean;
  strongModelReason?: string;
  whyNoModel?: string;
  whyThisModel?: string;
  routingEfficiency: 'EXCELLENT' | 'GOOD' | 'BAD';
}

export const MODEL_HIERARCHY = {
  LEVEL_1_CHEAP: 'gemini-3.6-flash',
  LEVEL_2_WORKHORSE: 'gemini-3.6-flash',
  LEVEL_3_MID: 'gemini-3.6-flash',
  LEVEL_4_STRONG: 'gemini-3.6-flash',
};

export class ModelRouter {
  /**
   * Route task according to strict cost and complexity hierarchy.
   */
  routeTask(taskType: string, options: {
    aiRequired?: boolean;
    inputLength?: number;
    hasAmbiguity?: boolean;
    requiresMultiSourceSynthesis?: boolean;
    strongModelReason?: string;
    matchedProviderId?: string;
  } = {}): ModelRoutingDecision {
    const {
      aiRequired = true,
      inputLength = 0,
      hasAmbiguity = false,
      requiresMultiSourceSynthesis = false,
      strongModelReason,
      matchedProviderId,
    } = options;

    // LEVEL 0: NO MODEL (Deterministic Bypass / Direct Lookup)
    if (!aiRequired || taskType === 'direct_lookup' || taskType === 'case_mutation') {
      return {
        tier: 'level_0_none',
        selectedModel: null,
        reason: `Task "${taskType}" answered deterministically using verified official provider registry (0 tokens used).`,
        deterministicBypass: true,
        whyNoModel: matchedProviderId
          ? `Matched direct official portal lookup for provider "${matchedProviderId}".`
          : 'Solved deterministically via backend registry rules without LLM invocation.',
        routingEfficiency: 'EXCELLENT',
      };
    }

    // LEVEL 1: LOW-COST COMPACT EXTRACTION (gemini-2.5-flash-lite)
    if (
      taskType === 'fact_extraction' ||
      taskType === 'message_classification' ||
      taskType === 'normalization' ||
      (taskType === 'problem_intake' && !requiresMultiSourceSynthesis && !hasAmbiguity && inputLength < 300)
    ) {
      return {
        tier: 'level_1_cheap_lite',
        selectedModel: MODEL_HIERARCHY.LEVEL_1_CHEAP,
        reason: `Flash-Lite model (${MODEL_HIERARCHY.LEVEL_1_CHEAP}) selected for fast, low-cost structured fact extraction.`,
        deterministicBypass: false,
        whyThisModel: 'Low-cost semantic extraction into compact JSON.',
        routingEfficiency: 'EXCELLENT',
      };
    }

    // LEVEL 2/3: MID-TIER FLASH REASONING (gemini-2.5-flash)
    if (
      taskType === 'document_understanding' ||
      taskType === 'action_followup' ||
      taskType === 'procedural_interpretation' ||
      (taskType === 'problem_intake' && (!requiresMultiSourceSynthesis || !hasAmbiguity))
    ) {
      return {
        tier: 'level_3_mid_reasoning',
        selectedModel: MODEL_HIERARCHY.LEVEL_3_MID,
        reason: `Mid Flash model (${MODEL_HIERARCHY.LEVEL_3_MID}) selected for moderate legal/procedural reasoning.`,
        deterministicBypass: false,
        whyThisModel: 'Moderate reasoning required for structured action plan generation.',
        routingEfficiency: 'GOOD',
      };
    }

    // LEVEL 4: STRONG MODEL (gemini-3.6-flash for complex synthesis)
    if (
      (requiresMultiSourceSynthesis && hasAmbiguity) ||
      taskType === 'complex_legal_synthesis' ||
      taskType === 'personalized_drafting' ||
      (strongModelReason && strongModelReason.trim().length > 10)
    ) {
      return {
        tier: 'level_4_strong_reasoning',
        selectedModel: MODEL_HIERARCHY.LEVEL_4_STRONG,
        reason: `Strong model (${MODEL_HIERARCHY.LEVEL_4_STRONG}) selected for complex multi-route synthesis and detailed reasoning.`,
        strongModelReason: strongModelReason || 'Complex legal route synthesis and personalized reasoning required.',
        deterministicBypass: false,
        whyThisModel: `Complex legal reasoning required: ${strongModelReason || 'Multi-source route comparison.'}`,
        routingEfficiency: 'GOOD',
      };
    }

    // DEFAULT TO MID FLASH
    return {
      tier: 'level_2_workhorse_lite',
      selectedModel: MODEL_HIERARCHY.LEVEL_2_WORKHORSE,
      reason: `Mid Flash model (${MODEL_HIERARCHY.LEVEL_2_WORKHORSE}) selected for standard intake processing.`,
      deterministicBypass: false,
      whyThisModel: 'Balanced model selection for legal query processing.',
      routingEfficiency: 'GOOD',
    };
  }
}

export const modelRouter = new ModelRouter();

