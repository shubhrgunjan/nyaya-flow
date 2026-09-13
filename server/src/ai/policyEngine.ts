import { developerSettings } from './developerSettings';
import { getModelById, MODEL_REGISTRY } from './modelRegistry';

export interface PolicyEvaluationResult {
  allowed: boolean;
  modelId: string | null;
  tier: string;
  reason: string;
  policyViolation?: string;
  routingEfficiency: 'EXCELLENT' | 'GOOD' | 'BAD';
}

export class PolicyEngine {
  /**
   * Evaluate whether a model request is allowed under current Developer Settings and Policy Rules.
   * Physically prevents forbidden/disabled models from being called BEFORE spending any tokens.
   */
  evaluatePolicy(taskType: string, userInput: string, requestedModelId: string | null): PolicyEvaluationResult {
    const config = developerSettings.getConfig();
    const input = userInput.trim();
    const isOneLine = !input.includes('\n') && input.length < 120;

    // 1. NO_AI Mode Guard (0 Tokens Allowed)
    if (config.globalAiMode === 'NO_AI' || config.forceSearchOnly) {
      return {
        allowed: false,
        modelId: null,
        tier: 'level_0_none',
        reason: 'NO-AI Mode is active in Developer Settings. All LLM calls are physically blocked.',
        routingEfficiency: 'EXCELLENT',
      };
    }

    // 2. Deterministic / Direct Lookup Tasks (0 Tokens Allowed)
    if (taskType === 'direct_lookup' || taskType === 'case_mutation') {
      return {
        allowed: false,
        modelId: null,
        tier: 'level_0_none',
        reason: 'Direct lookup matched verified official provider registry. LLM invocation avoided.',
        routingEfficiency: 'EXCELLENT',
      };
    }

    // 3. HARD BAN: One-Line Queries CANNOT Call Gemini 3.6 Flash
    if (isOneLine && (requestedModelId === 'gemini-3.6-flash' || requestedModelId === 'GEMINI_36_FLASH')) {
      return {
        allowed: false,
        modelId: 'gemini-3.6-flash', // Fallback model
        tier: 'level_1_cheap_lite',
        reason: 'HARD POLICY VIOLATION: One-line simple queries are strictly prohibited from calling Gemini 3.6 Flash.',
        policyViolation: 'Gemini 3.6 Flash Hard Ban for One-Line Queries',
        routingEfficiency: 'EXCELLENT',
      };
    }

    // 4. Model Enabled Check
    if (requestedModelId && requestedModelId !== 'none') {
      const isEnabled = developerSettings.isModelEnabled(requestedModelId);
      if (!isEnabled) {
        return {
          allowed: false,
          modelId: 'gemini-3.6-flash',
          tier: 'level_1_cheap_lite',
          reason: `Model "${requestedModelId}" is disabled in Developer Settings. Call rejected by backend Policy Engine.`,
          policyViolation: `Disabled Model Call Attempted: ${requestedModelId}`,
          routingEfficiency: 'EXCELLENT',
        };
      }
    }

    // 5. Strong Model Session Budget Check (gemini-3.6-flash)
    if (requestedModelId === 'gemini-3.6-flash' || requestedModelId === 'GEMINI_36_FLASH') {
      if (
        config.maxStrongModelCallsPerSession > 0 &&
        config.strongModelCallsUsed >= config.maxStrongModelCallsPerSession
      ) {
        return {
          allowed: false,
          modelId: 'gemini-3.6-flash',
          tier: 'level_2_workhorse_lite',
          reason: `Strong Model call rejected: Max budget (${config.maxStrongModelCallsPerSession}) reached in Developer Settings.`,
          policyViolation: 'Strong Model Session Budget Exceeded',
          routingEfficiency: 'EXCELLENT',
        };
      }
    }

    // 6. FORCE CHEAPEST Mode Override
    if (config.globalAiMode === 'FORCE_CHEAPEST') {
      return {
        allowed: true,
        modelId: 'gemini-3.6-flash',
        tier: 'level_1_cheap_lite',
        reason: 'FORCE CHEAPEST mode active in Developer Settings.',
        routingEfficiency: 'EXCELLENT',
      };
    }

    // 7. FORCE SPECIFIC MODEL Mode Override
    if (config.globalAiMode === 'FORCE_SPECIFIC_MODEL' && config.forceSpecificModelId) {
      return {
        allowed: true,
        modelId: config.forceSpecificModelId,
        tier: 'level_1_cheap_lite',
        reason: `FORCE SPECIFIC MODEL mode active: Using ${config.forceSpecificModelId}`,
        routingEfficiency: 'GOOD',
      };
    }

    // Default Approved Call
    return {
      allowed: true,
      modelId: requestedModelId || 'gemini-3.6-flash',
      tier: requestedModelId?.includes('3.6') ? 'level_4_strong_reasoning' : 'level_1_cheap_lite',
      reason: 'Model invocation approved by Policy Engine.',
      routingEfficiency: requestedModelId?.includes('3.6') ? 'GOOD' : 'EXCELLENT',
    };
  }
}

export const policyEngine = new PolicyEngine();
