import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Header } from '../src/components/common/Header';
import { telemetryService } from '../src/services/telemetry/telemetryService';
import { PipelineTrace, PipelineStepTelemetry } from '../src/types/telemetry';
import { LegalFlowBackground } from '../src/components/common/LegalFlowBackground';

export default function PipelineInspectorScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [traces, setTraces] = useState<PipelineTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<PipelineTrace | null>(null);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Developer Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [devConfig, setDevConfig] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);

  const fetchTracesAndConfig = async () => {
    setLoading(true);
    const [list, configRes] = await Promise.all([
      telemetryService.getTraces(),
      telemetryService.getConfig(),
    ]);
    setTraces(list || []);
    if (list && list.length > 0) {
      setSelectedTrace(list[0]);
    }
    if (configRes) {
      setDevConfig(configRes.config);
      setAvailableModels(configRes.availableModels || []);
    }
    setLoading(false);
  };

  const handleUpdateConfig = async (updates: any) => {
    const res = await telemetryService.updateConfig(updates);
    if (res && res.config) {
      setDevConfig(res.config);
      if (res.availableModels) setAvailableModels(res.availableModels);
    }
  };

  useEffect(() => {
    fetchTracesAndConfig();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="DEVELOPER PIPELINE INSPECTOR" subtitle="Real-time backend execution telemetry & model routing observability" showBack={true} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Fetching execution telemetry...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Developer Settings Toggle Bar */}
          <TouchableOpacity
            style={styles.settingsToggleHeader}
            onPress={() => setShowSettings(!showSettings)}
          >
            <View style={styles.settingsHeaderLeft}>
              <Ionicons name="options-outline" size={20} color="#38BDF8" />
              <Text style={styles.settingsHeaderTitle}>DEVELOPER AI ROUTING CONTROLS</Text>
            </View>
            <View style={styles.settingsHeaderRight}>
              <View style={[styles.modeIndicator, devConfig?.globalAiMode === 'NO_AI' && { backgroundColor: '#EF4444' }]}>
                <Text style={styles.modeIndicatorText}>MODE: {devConfig?.globalAiMode || 'NORMAL'}</Text>
              </View>
              <Ionicons name={showSettings ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* Developer Settings Panel */}
          {showSettings && devConfig && (
            <View style={styles.settingsCard}>
              <Text style={styles.settingsSectionTitle}>1. GLOBAL AI EXECUTION MODE</Text>
              <View style={styles.modeRadioGrid}>
                {[
                  { mode: 'NORMAL', label: 'NORMAL (Router Decides)' },
                  { mode: 'SEARCH_FIRST', label: 'SEARCH-FIRST (Source Default)' },
                  { mode: 'NO_AI', label: 'NO-AI (Strict 0 LLM Calls)' },
                  { mode: 'FORCE_CHEAPEST', label: 'FORCE CHEAPEST MODEL' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.mode}
                    style={[
                      styles.modeRadioItem,
                      devConfig.globalAiMode === item.mode && styles.modeRadioItemActive,
                    ]}
                    onPress={() => handleUpdateConfig({ globalAiMode: item.mode })}
                  >
                    <Ionicons
                      name={devConfig.globalAiMode === item.mode ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={devConfig.globalAiMode === item.mode ? '#38BDF8' : '#64748B'}
                    />
                    <Text style={[styles.modeRadioText, devConfig.globalAiMode === item.mode && styles.modeRadioTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.settingsSectionTitle}>2. MODEL PERMISSIONS (CHECKBOXES)</Text>
              <View style={styles.modelCheckList}>
                {availableModels
                  .filter((m) => m.modelId !== 'none')
                  .map((m) => {
                    const isEnabled = Boolean(devConfig.enabledModels?.[m.modelId]);
                    return (
                      <TouchableOpacity
                        key={m.modelId}
                        style={styles.modelCheckRow}
                        onPress={() =>
                          handleUpdateConfig({
                            enabledModels: {
                              ...devConfig.enabledModels,
                              [m.modelId]: !isEnabled,
                            },
                          })
                        }
                      >
                        <Ionicons
                          name={isEnabled ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isEnabled ? (m.tier >= 4 ? '#F59E0B' : '#10B981') : '#64748B'}
                        />
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text style={styles.modelCheckName}>
                            {m.name} ({m.modelId})
                          </Text>
                          <Text style={styles.modelCheckDesc}>
                            Tier {m.tier} • Cost: {m.costClass} • {m.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>

              <Text style={styles.settingsSectionTitle}>3. STRONG MODEL POLICY (GEMINI 3.6 FLASH)</Text>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Max Strong Model Calls / Session:</Text>
                <View style={styles.budgetBtnGroup}>
                  {[0, 1, 3, 5].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.budgetBtn,
                        devConfig.maxStrongModelCallsPerSession === val && styles.budgetBtnActive,
                      ]}
                      onPress={() => handleUpdateConfig({ maxStrongModelCallsPerSession: val })}
                    >
                      <Text
                        style={[
                          styles.budgetBtnText,
                          devConfig.maxStrongModelCallsPerSession === val && styles.budgetBtnTextActive,
                        ]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Text style={styles.budgetHelp}>
                Current Usage: {devConfig.strongModelCallsUsed} / {devConfig.maxStrongModelCallsPerSession} calls. (Default 0 = 3.6 Flash Hard Banned).
              </Text>
            </View>
          )}

          {traces.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="analytics-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Execution Traces Recorded</Text>
              <Text style={styles.emptySubtitle}>
                Ask a legal question or create a case to generate backend pipeline execution telemetry.
              </Text>
            </View>
          ) : (
            <>
              {/* Trace Selector Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.traceTabScroll}>
                {traces.map((tr) => {
                  const isSelected = selectedTrace?.traceId === tr.traceId;
                  const isZeroAi = !tr.aiRequired || tr.modelCalls.length === 0;
                  return (
                    <TouchableOpacity
                      key={tr.traceId}
                      style={[styles.traceTab, isSelected && styles.traceTabActive, isZeroAi && styles.traceTabZeroAi]}
                      onPress={() => {
                        setSelectedTrace(tr);
                        setExpandedStepIndex(null);
                      }}
                    >
                      <Text style={[styles.traceTabTitle, isSelected && styles.traceTabTitleActive]}>
                        {tr.traceId.slice(0, 16)} {isZeroAi ? '⚡ (0 AI)' : ''}
                      </Text>
                      <Text style={styles.traceTabSub}>
                        {new Date(tr.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedTrace && (
                <>
                  {/* Telemetry Summary Dashboard */}
                  <View style={styles.dashboardCard}>
                    <View style={styles.dashboardHeader}>
                      <Text style={styles.dashboardTitle}>AI COST & ROUTING TELEMETRY</Text>
                      <View
                        style={[
                          styles.efficiencyBadge,
                          selectedTrace.routingEfficiency === 'EXCELLENT'
                            ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' }
                            : { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
                        ]}
                      >
                        <Ionicons
                          name="flash"
                          size={12}
                          color={selectedTrace.routingEfficiency === 'EXCELLENT' ? '#10B981' : '#F59E0B'}
                        />
                        <Text
                          style={[
                            styles.efficiencyText,
                            { color: selectedTrace.routingEfficiency === 'EXCELLENT' ? '#10B981' : '#F59E0B' },
                          ]}
                        >
                          EFFICIENCY: {selectedTrace.routingEfficiency}
                        </Text>
                      </View>
                    </View>

                    {/* Why No Model / Why This Model Banner */}
                    {selectedTrace.whyNoModel ? (
                      <View style={styles.reasonBannerZeroAi}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.reasonBannerZeroAiText}>
                          WHY NO MODEL: {selectedTrace.whyNoModel}
                        </Text>
                      </View>
                    ) : selectedTrace.whyThisModel ? (
                      <View style={styles.reasonBannerAi}>
                        <Ionicons name="information-circle-outline" size={16} color="#60A5FA" />
                        <Text style={styles.reasonBannerAiText}>
                          WHY THIS MODEL: {selectedTrace.whyThisModel}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.metricsGrid}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Total Tokens</Text>
                        <Text style={styles.metricValue}>
                          {selectedTrace.tokenSummary.totalTokens.toLocaleString()}
                        </Text>
                        <Text style={styles.metricSub}>
                          {selectedTrace.tokenSummary.totalInputTokens} in / {selectedTrace.tokenSummary.totalOutputTokens} out
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>LLM Invocations</Text>
                        <Text style={styles.metricValue}>{selectedTrace.modelCalls.length}</Text>
                        <Text style={styles.metricSub}>
                          {selectedTrace.modelCalls.length === 0 ? '⚡ Solved without LLM' : 'Low-cost Flash-Lite'}
                        </Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Strong Model</Text>
                        <Text style={[styles.metricValue, { color: selectedTrace.tokenSummary.strongModelCalls === 0 ? '#10B981' : '#F59E0B' }]}>
                          {selectedTrace.tokenSummary.strongModelCalls === 0 ? 'NOT USED' : 'USED'}
                        </Text>
                        <Text style={styles.metricSub}>Gate: Hard Budget Enforced</Text>
                      </View>

                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Est. API Cost</Text>
                        <Text style={styles.metricValue}>₹{selectedTrace.tokenSummary.estimatedCostInr.toFixed(4)}</Text>
                        <Text style={styles.metricSub}>{selectedTrace.totalDurationMs}ms total latency</Text>
                      </View>
                    </View>
                  </View>

                  {/* User Input Banner */}
                  <View style={styles.inputBanner}>
                    <Text style={styles.inputBannerLabel}>USER INPUT</Text>
                    <Text style={styles.inputBannerText}>"{selectedTrace.userInput}"</Text>
                  </View>

                  {/* Pipeline Execution Tree */}
                  <Text style={styles.sectionHeader}>PIPELINE EXECUTION TREE</Text>

                  <View style={styles.timelineTree}>
                    {selectedTrace.steps.map((step: PipelineStepTelemetry, idx: number) => {
                      const isExpanded = expandedStepIndex === idx;
                      return (
                        <View key={idx} style={styles.timelineNode}>
                          <View style={styles.timelineConnector}>
                            <View style={[styles.timelineDot, getStepTypeColor(step.type)]} />
                            {idx < selectedTrace.steps.length - 1 && <View style={styles.timelineLine} />}
                          </View>

                          <TouchableOpacity
                            style={styles.timelineContent}
                            onPress={() => setExpandedStepIndex(isExpanded ? null : idx)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.nodeHeaderRow}>
                              <Text style={styles.nodeIndex}>#{step.stepIndex}</Text>
                              <Text style={styles.nodeName}>{step.name}</Text>
                              <View style={styles.nodeBadge}>
                                <Text style={styles.nodeBadgeText}>{step.durationMs}ms</Text>
                              </View>
                            </View>

                            <Text style={styles.nodeSummary}>{step.summary}</Text>

                            {isExpanded && (
                              <View style={styles.jsonContainer}>
                                <Text style={styles.jsonLabel}>Raw Details Payload:</Text>
                                <Text style={styles.jsonCode}>
                                  {JSON.stringify(step.details, null, 2)}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>

                  {/* Model Calls Table */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionCardTitle}>MODEL INVOCATIONS LOG</Text>
                    {selectedTrace.modelCalls.length === 0 ? (
                      <View style={styles.zeroModelBox}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                        <Text style={styles.zeroModelText}>
                          ZERO MODEL CALLS MADE: This query was answered deterministically using verified official portal data.
                        </Text>
                      </View>
                    ) : (
                      selectedTrace.modelCalls.map((mc, idx) => (
                        <View key={idx} style={styles.modelCallRow}>
                          <View style={styles.modelCallHeader}>
                            <Text style={styles.modelName}>{mc.model}</Text>
                            <Text style={styles.modelStatus}>{mc.status.toUpperCase()}</Text>
                          </View>
                          <Text style={styles.modelPurpose}>Purpose: {mc.purpose}</Text>
                          <Text style={styles.modelTokens}>
                            Tokens: {mc.totalTokens} ({mc.inputTokens} in / {mc.outputTokens} out) • Latency: {mc.latencyMs}ms
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function getStepTypeColor(type: string) {
  switch (type) {
    case 'input': return { backgroundColor: '#3B82F6' };
    case 'decision': return { backgroundColor: '#8B5CF6' };
    case 'model_call': return { backgroundColor: '#EC4899' };
    case 'router': return { backgroundColor: '#10B981' };
    case 'action_engine': return { backgroundColor: '#F59E0B' };
    case 'validation': return { backgroundColor: '#6366F1' };
    default: return { backgroundColor: '#6B7280' };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  traceTabScroll: {
    marginBottom: 16,
  },
  traceTab: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  traceTabZeroAi: {
    borderColor: '#10B981',
  },
  traceTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  traceTabTitle: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  traceTabTitleActive: {
    color: '#FFFFFF',
  },
  traceTabSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  dashboardCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dashboardTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  efficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  efficiencyText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  reasonBannerZeroAi: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  reasonBannerZeroAiText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  reasonBannerAi: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  reasonBannerAiText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  metricItem: {
    width: '50%',
    padding: 6,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  metricValue: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 2,
  },
  metricSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  inputBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  inputBannerLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  inputBannerText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontStyle: 'italic',
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  timelineTree: {
    marginBottom: 16,
  },
  timelineNode: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineConnector: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#334155',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nodeIndex: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },
  nodeName: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  nodeBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  nodeSummary: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 16,
  },
  jsonContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  jsonLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  jsonCode: {
    fontFamily: 'monospace',
    color: '#38BDF8',
    fontSize: 11,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionCardTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  zeroModelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  zeroModelText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  modelCallRow: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  modelCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modelName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  modelStatus: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  modelPurpose: {
    color: '#CBD5E1',
    fontSize: 11,
  },
  modelTokens: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },
  settingsToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 12,
  },
  settingsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  settingsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIndicator: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  modeIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  settingsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  settingsSectionTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 8,
  },
  modeRadioGrid: {
    marginBottom: 10,
  },
  modeRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#0F172A',
  },
  modeRadioItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  modeRadioText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 8,
  },
  modeRadioTextActive: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  modelCheckList: {
    marginBottom: 10,
  },
  modelCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  modelCheckName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  modelCheckDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
  },
  budgetLabel: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  budgetBtnGroup: {
    flexDirection: 'row',
  },
  budgetBtn: {
    width: 32,
    height: 28,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  budgetBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FBBF24',
  },
  budgetBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  budgetBtnTextActive: {
    color: '#0F172A',
  },
  budgetHelp: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 6,
  },
});
