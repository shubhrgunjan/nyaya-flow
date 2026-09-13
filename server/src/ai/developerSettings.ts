export type AiExecutionMode = 'NORMAL' | 'SEARCH_FIRST' | 'NO_AI' | 'FORCE_CHEAPEST' | 'FORCE_SPECIFIC_MODEL';

export interface DeveloperSettingsConfig {
  globalAiMode: AiExecutionMode;
  enabledModels: Record<string, boolean>;
  maxStrongModelCallsPerSession: number;
  strongModelCallsUsed: number;
  forceSpecificModelId: string | null;
  forceSearchOnly: boolean;
}

class DeveloperSettingsStore {
  private config: DeveloperSettingsConfig = {
    globalAiMode: 'NORMAL',
    enabledModels: {
      'none': true,
      'gemini-2.5-flash': true,
      'gemini-3.6-flash': true,
    },
    maxStrongModelCallsPerSession: 10,
    strongModelCallsUsed: 0,
    forceSpecificModelId: null,
    forceSearchOnly: false,
  };

  getConfig(): DeveloperSettingsConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<DeveloperSettingsConfig>): DeveloperSettingsConfig {
    this.config = {
      ...this.config,
      ...updates,
      enabledModels: {
        ...this.config.enabledModels,
        ...(updates.enabledModels || {}),
      },
    };
    return this.getConfig();
  }

  isModelEnabled(modelId: string): boolean {
    if (modelId === 'none') return true;
    return Boolean(this.config.enabledModels[modelId]);
  }

  incrementStrongModelUsage(): void {
    this.config.strongModelCallsUsed++;
  }

  resetStrongModelUsage(): void {
    this.config.strongModelCallsUsed = 0;
  }
}

export const developerSettings = new DeveloperSettingsStore();
