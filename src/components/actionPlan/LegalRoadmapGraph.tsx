import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ActionStep } from '../../types/actionPlan';
import { SourceBadge, LegalSourceItem } from '../common/SourceBadge';
import { LegalStamp } from '../common/LegalStamp';

interface LegalRoadmapGraphProps {
  steps: ActionStep[];
  onToggleStep: (stepId: string) => void;
  onAskFollowUp?: (step: ActionStep, type: 'why' | 'missing') => void;
  onAttachEvidence?: (step: ActionStep) => void;
  sources?: LegalSourceItem[];
}

export const LegalRoadmapGraph: React.FC<LegalRoadmapGraphProps> = ({
  steps = [],
  onToggleStep,
  onAskFollowUp,
  onAttachEvidence,
  sources = [],
}) => {
  const { colors, isDark } = useTheme();

  if (!steps || steps.length === 0) return null;

  const [expandedStepId, setExpandedStepId] = useState<string | null>(steps[0]?.id || null);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / (steps.length || 1)) * 100);

  const toggleExpand = (id: string) => {
    setExpandedStepId(expandedStepId === id ? null : id);
  };
  const activeStepIndex = steps.findIndex((s) => s.status !== 'completed');
  const currentStepNum = activeStepIndex === -1 ? steps.length : activeStepIndex + 1;

  return (
    <View style={styles.container}>
      {/* Roadmap Header Summary */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Procedural Route</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {completedCount === steps.length
                ? 'All procedural steps completed'
                : `Step ${currentStepNum} of ${steps.length} in progress`}
            </Text>
          </View>
          <LegalStamp
            label={completedCount === steps.length ? 'Completed' : `Step ${currentStepNum} of ${steps.length}`}
            variant={completedCount === steps.length ? 'success' : 'primary'}
            size="sm"
          />
        </View>

        {/* Visual route indicator bar */}
        <View style={styles.pathMiniIndicator}>
          {steps.map((st, idx) => {
            const isDone = st.status === 'completed';
            const isCurrent = idx === activeStepIndex;
            return (
              <React.Fragment key={st.id}>
                <View
                  style={[
                    styles.miniNode,
                    {
                      backgroundColor: isDone
                        ? colors.accentSuccess
                        : isCurrent
                        ? colors.accent
                        : colors.border,
                    },
                  ]}
                />
                {idx < steps.length - 1 && (
                  <View
                    style={[
                      styles.miniLine,
                      {
                        backgroundColor: isDone ? colors.accentSuccess : colors.border,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Hero Procedural Path Node Graph */}
      <View style={styles.graphTimelineContainer}>
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = index === activeStepIndex;
          const isExpanded = expandedStepId === step.id;
          const relevantSource = sources[index % sources.length];

          return (
            <View key={step.id} style={styles.stepNodeWrapper}>
              {/* Vertical path line */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.pathConnectorLine,
                    {
                      backgroundColor: isCompleted
                        ? colors.accentSuccess
                        : colors.border,
                    },
                  ]}
                />
              )}

              {/* Node Card */}
              <View
                style={[
                  styles.caseNodeCard,
                  {
                    backgroundColor: isCurrent
                      ? colors.surface
                      : colors.surface,
                    borderColor: isCurrent
                      ? colors.accent
                      : isCompleted
                      ? colors.accentSuccess + '40'
                      : colors.borderSubtle,
                    borderWidth: isCurrent ? 1.5 : 1,
                  },
                ]}
              >
                {/* Node Header */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(step.id)}
                  style={styles.nodeHeaderRow}
                >
                  <View style={styles.nodeLeftGroup}>
                    {/* Node Circle */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onToggleStep(step.id)}
                      style={[
                        styles.nodeCheckCircle,
                        {
                          backgroundColor: isCompleted
                            ? colors.accentSuccess
                            : isCurrent
                            ? colors.accentMuted
                            : colors.surfaceHighlight,
                          borderColor: isCompleted
                            ? colors.accentSuccess
                            : isCurrent
                            ? colors.accent
                            : colors.border,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.nodeIndexText,
                            { color: isCurrent ? colors.accent : colors.textMuted },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.nodeTitleStack}>
                      <Text
                        style={[
                          styles.nodeTitleText,
                          {
                            color: isCompleted
                              ? colors.textSecondary
                              : colors.textPrimary,
                            fontWeight: isCurrent ? '700' : '600',
                          },
                        ]}
                      >
                        {step.title}
                      </Text>
                      {step.description && !isExpanded && (
                        <Text style={[styles.nodeSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {step.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={[styles.nodeDetailsBody, { borderTopColor: colors.borderSubtle }]}>
                    {step.description && (
                      <View style={styles.sectionBlock}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Overview</Text>
                        <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                          {step.description}
                        </Text>
                      </View>
                    )}

                    {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                      <View style={styles.sectionBlock}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Suggested Evidence</Text>
                        <View style={styles.evidenceChipGrid}>
                          {step.requiredDocuments.map((docName, dIdx) => (
                            <View
                              key={dIdx}
                              style={[
                                styles.evidenceChip,
                                {
                                  backgroundColor: colors.surfaceHighlight,
                                  borderColor: colors.borderSubtle,
                                },
                              ]}
                            >
                              <Ionicons name="document-text-outline" size={12} color={colors.accent} />
                              <Text style={[styles.evidenceChipText, { color: colors.textPrimary }]}>
                                {docName}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {relevantSource && (
                      <View style={styles.sectionBlock}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Official Source</Text>
                        <SourceBadge source={relevantSource} />
                      </View>
                    )}

                    {/* Action Controls */}
                    <View style={styles.actionControlsRow}>
                      {onAskFollowUp && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.controlBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                          onPress={() => onAskFollowUp(step, 'why')}
                        >
                          <Ionicons name="help-circle-outline" size={14} color={colors.textPrimary} />
                          <Text style={[styles.controlBtnText, { color: colors.textPrimary }]}>Why this step?</Text>
                        </TouchableOpacity>
                      )}

                      {onAttachEvidence && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.controlBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                          onPress={() => onAttachEvidence(step)}
                        >
                          <Ionicons name="attach-outline" size={14} color={colors.textPrimary} />
                          <Text style={[styles.controlBtnText, { color: colors.textPrimary }]}>Add Evidence</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.controlBtnPrimary,
                          {
                            backgroundColor: isCompleted ? colors.surfaceHighlight : colors.accent,
                            borderColor: isCompleted ? colors.border : colors.accent,
                          },
                        ]}
                        onPress={() => onToggleStep(step.id)}
                      >
                        <Ionicons
                          name={isCompleted ? 'refresh-outline' : 'checkmark-done-outline'}
                          size={14}
                          color={isCompleted ? colors.textPrimary : '#FFFFFF'}
                        />
                        <Text
                          style={[
                            styles.controlBtnPrimaryText,
                            { color: isCompleted ? colors.textPrimary : '#FFFFFF' },
                          ]}
                        >
                          {isCompleted ? 'Mark Pending' : 'Complete Step'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMeta: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pathMiniIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  miniNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  miniLine: {
    flex: 1,
    height: 2,
  },
  graphTimelineContainer: {
    paddingLeft: 12,
  },
  anchorNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  anchorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anchorInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  anchorLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  stepNodeWrapper: {
    position: 'relative',
    paddingLeft: 28,
    marginBottom: 16,
  },
  pathConnectorLine: {
    position: 'absolute',
    left: 11,
    top: -16,
    bottom: -16,
    width: 2,
    zIndex: -1,
  },
  caseNodeCard: {
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  nodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  nodeCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIndexText: {
    fontSize: 11,
    fontWeight: '800',
  },
  nodeTitleStack: {
    flex: 1,
  },
  nodeMetaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nodeCategoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  nextBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nextBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  nodeTitleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nodeSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  nodeDetailsBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  evidenceChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  evidenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  evidenceChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  controlBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  controlBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
