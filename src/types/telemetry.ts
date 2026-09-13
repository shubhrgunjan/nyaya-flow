export interface ModelCallTelemetry {
  timestamp: string;
  provider: string;
  model: string;
  purpose: string;
  requestId: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostInr: number;
  status: 'success' | 'failed' | 'skipped';
  skipReason?: string;
  strongModelReason?: string;
  error?: string;
}

export interface ProviderCallTelemetry {
  provider: string;
  endpoint: string;
  operation: string;
  status: number;
  latencyMs: number;
  itemsReturned: number;
}

export interface PipelineStepTelemetry {
  stepIndex: number;
  name: string;
  type: 'input' | 'decision' | 'model_call' | 'case_update' | 'router' | 'provider_request' | 'action_engine' | 'validation' | 'persistence';
  summary: string;
  details: Record<string, any>;
  durationMs: number;
  timestamp: string;
}

export interface PipelineTrace {
  traceId: string;
  caseId?: string;
  timestamp: string;
  userInput: string;
  language: string;
  aiRequired: boolean;
  decisionReason: string;
  whyNoModel?: string;
  whyThisModel?: string;
  routingEfficiency: 'EXCELLENT' | 'GOOD' | 'BAD';
  totalDurationMs: number;
  modelCalls: ModelCallTelemetry[];
  providerCalls: ProviderCallTelemetry[];
  steps: PipelineStepTelemetry[];
  tokenSummary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    estimatedCostInr: number;
    strongModelCalls: number;
    cheapModelCalls: number;
    expensiveModelAvoided: boolean;
  };
  validationSummary: {
    passed: boolean;
    claimsRequiringSources: number;
    claimsWithSources: number;
    sourceCoveragePercent: number;
    unsupportedClaimsCount: number;
    brokenSourceReferencesCount: number;
  };
}
