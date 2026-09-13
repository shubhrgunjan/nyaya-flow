export interface ModelRecord {
  id: string;
  modelId: string;
  name: string;
  tier: number;
  costClass: 'zero' | 'ultra_low' | 'low' | 'medium' | 'high';
  provider: 'none' | 'google';
  defaultEnabled: boolean;
  allowedTasks: string[];
  description: string;
}

export const MODEL_REGISTRY: Record<string, ModelRecord> = {
  NO_MODEL: {
    id: 'NO_MODEL',
    modelId: 'none',
    name: 'Zero-AI (Deterministic / Direct Search)',
    tier: 0,
    costClass: 'zero',
    provider: 'none',
    defaultEnabled: true,
    allowedTasks: ['direct_lookup', 'case_mutation', 'search', 'source_retrieval', 'step_toggle'],
    description: 'No LLM API call. Direct official portal lookup, state mutation, or verified registry lookup.',
  },
  GEMINI_25_FLASH_LITE: {
    id: 'GEMINI_25_FLASH_LITE',
    modelId: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Cheap / Fast)',
    tier: 1,
    costClass: 'ultra_low',
    provider: 'google',
    defaultEnabled: true,
    allowedTasks: [
      'fact_extraction',
      'simple_classification',
      'normalization',
      'language_detection',
      'compact_json',
      'simple_case_update',
      'basic_multilingual',
    ],
    description: 'Fast low-cost Flash model for simple NLP extraction, classification, and compact updates.',
  },
  GEMINI_25_FLASH: {
    id: 'GEMINI_25_FLASH',
    modelId: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Mid Reasoning)',
    tier: 2,
    costClass: 'low',
    provider: 'google',
    defaultEnabled: true,
    allowedTasks: [
      'moderate_reasoning',
      'document_understanding',
      'involved_case_update',
      'procedural_interpretation',
      'action_followup',
    ],
    description: 'Mid-tier Flash model for document understanding and multi-step procedural interpretation.',
  },
  GEMINI_36_FLASH: {
    id: 'GEMINI_36_FLASH',
    modelId: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Strong Reasoning)',
    tier: 4,
    costClass: 'high',
    provider: 'google',
    defaultEnabled: true,
    allowedTasks: [
      'complex_legal_synthesis',
      'multi_route_ambiguity_resolution',
      'conflicting_route_comparison',
      'nuanced_evidence_interpretation',
      'complex_roadmap_generation',
      'major_case_state_change',
      'personalized_drafting',
    ],
    description: 'High-capability strong reasoning model. Controlled resource for complex synthesis and multi-route evaluation.',
  },
};

export function getAvailableModels(): ModelRecord[] {
  return Object.values(MODEL_REGISTRY);
}

export function getModelById(modelId: string): ModelRecord | undefined {
  return Object.values(MODEL_REGISTRY).find((m) => m.modelId === modelId || m.id === modelId);
}

