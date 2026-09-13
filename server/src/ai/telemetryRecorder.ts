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

class TelemetryStore {
  private traces: Map<string, PipelineTrace> = new Map();
  private maxTraces: number = 50;

  createTrace(traceId: string, userInput: string, language: string = 'en', caseId?: string): PipelineTrace {
    const trace: PipelineTrace = {
      traceId,
      caseId,
      timestamp: new Date().toISOString(),
      userInput,
      language,
      aiRequired: true,
      decisionReason: 'Initial request analysis',
      whyNoModel: undefined,
      whyThisModel: undefined,
      routingEfficiency: 'EXCELLENT',
      totalDurationMs: 0,
      modelCalls: [],
      providerCalls: [],
      steps: [],
      tokenSummary: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        estimatedCostInr: 0,
        strongModelCalls: 0,
        cheapModelCalls: 0,
        expensiveModelAvoided: true,
      },
      validationSummary: {
        passed: true,
        claimsRequiringSources: 0,
        claimsWithSources: 0,
        sourceCoveragePercent: 100,
        unsupportedClaimsCount: 0,
        brokenSourceReferencesCount: 0,
      },
    };
    this.traces.set(traceId, trace);
    this.cleanOldTraces();
    return trace;
  }

  getTrace(traceId: string): PipelineTrace | undefined {
    return this.traces.get(traceId);
  }

  getLatestTraces(limit: number = 30): PipelineTrace[] {
    return Array.from(this.traces.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addStep(traceId: string, step: Omit<PipelineStepTelemetry, 'stepIndex' | 'timestamp'>): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const fullStep: PipelineStepTelemetry = {
      ...step,
      stepIndex: trace.steps.length + 1,
      timestamp: new Date().toISOString(),
    };
    trace.steps.push(fullStep);
  }

  recordModelCall(traceId: string, call: ModelCallTelemetry): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.modelCalls.push(call);
    if (call.status === 'success') {
      trace.tokenSummary.totalInputTokens += call.inputTokens || 0;
      trace.tokenSummary.totalOutputTokens += call.outputTokens || 0;
      trace.tokenSummary.totalTokens += call.totalTokens || 0;
      trace.tokenSummary.estimatedCostInr += call.estimatedCostInr || 0;

      if (call.model.includes('3.6') || call.model.includes('pro')) {
        trace.tokenSummary.strongModelCalls++;
        trace.tokenSummary.expensiveModelAvoided = false;
        trace.routingEfficiency = 'GOOD';
      } else {
        trace.tokenSummary.cheapModelCalls++;
      }
    }
  }

  recordProviderCall(traceId: string, call: ProviderCallTelemetry): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;
    trace.providerCalls.push(call);
  }

  finalizeTrace(traceId: string, durationMs: number): PipelineTrace | undefined {
    const trace = this.traces.get(traceId);
    if (!trace) return undefined;
    trace.totalDurationMs = durationMs;
    return trace;
  }

  private cleanOldTraces() {
    if (this.traces.size > this.maxTraces) {
      const sorted = Array.from(this.traces.entries()).sort(
        (a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime()
      );
      const toDelete = sorted.slice(0, this.traces.size - this.maxTraces);
      for (const [key] of toDelete) {
        this.traces.delete(key);
      }
    }
  }
}

export const telemetryStore = new TelemetryStore();
