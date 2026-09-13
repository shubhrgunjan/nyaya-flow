import React, { useState } from 'react';
import { View, Text, StyleSheet, Linking, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ActionStep } from '../../types/actionPlan';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface ActionCardProps {
  step: ActionStep;
  onToggleStatus: (stepId: string, currentStatus: string) => void;
  onOpenChecklist: (step: ActionStep) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  step,
  onToggleStatus,
  onOpenChecklist,
}) => {
  const { colors } = useTheme();
  const [showDraftModal, setShowDraftModal] = useState(false);

  const formattedStepNumber = step.stepNumber < 10 ? `0${step.stepNumber}` : `${step.stepNumber}`;

  const renderActionButton = () => {
    switch (step.stepNumber) {
      case 1:
        return (
          <Button
            title="View checklist"
            variant="outline"
            size="sm"
            leftIcon={<Ionicons name="checkbox-outline" size={16} color={colors.accent} />}
            onPress={() => onOpenChecklist(step)}
          />
        );
      case 2:
        return (
          <Button
            title="Review draft"
            variant="outline"
            size="sm"
            leftIcon={<Ionicons name="document-text-outline" size={16} color={colors.accent} />}
            onPress={() => setShowDraftModal(true)}
          />
        );
      case 3:
        return (
          <Button
            title="View official process"
            variant="outline"
            size="sm"
            leftIcon={<Ionicons name="open-outline" size={16} color={colors.accent} />}
            onPress={() => {
              if (step.officialProcessUrl) {
                Linking.openURL(step.officialProcessUrl);
              }
            }}
          />
        );
      case 4:
        return (
          <Button
            title="View next options"
            variant="outline"
            size="sm"
            leftIcon={<Ionicons name="git-network-outline" size={16} color={colors.accent} />}
            onPress={() => {
              if (step.resourceLinks && step.resourceLinks[0]) {
                Linking.openURL(step.resourceLinks[0].url);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  const isCompleted = step.status === 'completed';

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: isCompleted ? colors.surface : colors.surfaceElevated,
          borderColor: isCompleted ? colors.accentSuccess + '60' : colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.stepNumberBadge,
            {
              backgroundColor: isCompleted ? colors.accentSuccess : colors.accentMuted,
              borderColor: isCompleted ? colors.accentSuccess : colors.accentPrimaryBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.stepNumberText,
              { color: isCompleted ? '#FFFFFF' : colors.accent },
            ]}
          >
            ● {formattedStepNumber}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.categoryHeader, { color: colors.accent }]}>
            {step.priority ? `${step.priority.toUpperCase()} PRIORITY` : 'ACTION NODE'}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{step.title}</Text>
        </View>
      </View>

      {/* Purpose Section */}
      <View style={styles.purposeSection}>
        <Text style={[styles.sectionTitleLabel, { color: colors.textMuted }]}>PURPOSE</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {step.description || 'Document facts and establish statutory record.'}
        </Text>
      </View>

      {step.reason ? (
        <View style={[styles.reasonBox, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.accent} style={styles.reasonIcon} />
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{step.reason}</Text>
        </View>
      ) : null}

      <View style={[styles.actionRow, { borderTopColor: colors.borderSubtle }]}>
        {renderActionButton()}
        <Button
          title={isCompleted ? 'Mark Pending' : 'Complete Action'}
          variant={isCompleted ? 'ghost' : 'primary'}
          size="sm"
          onPress={() => onToggleStatus(step.id, step.status)}
        />
      </View>

      {/* Legal Notice Draft Modal */}
      <Modal visible={showDraftModal} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Draft Legal Notice</Text>
              <Ionicons
                name="close"
                size={24}
                color={colors.textPrimary}
                onPress={() => setShowDraftModal(false)}
              />
            </View>
            <ScrollView style={[styles.draftScroll, { backgroundColor: colors.background }]}>
              <Text style={[styles.draftText, { color: colors.textPrimary }]}>
                {step.draftTemplate?.content || 'Draft template preview not available.'}
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Close" variant="secondary" onPress={() => setShowDraftModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  stepNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerInfo: {
    flex: 1,
  },
  categoryHeader: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  purposeSection: {
    marginVertical: 4,
  },
  sectionTitleLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
  },
  reasonIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  draftScroll: {
    borderRadius: 10,
    padding: 12,
    maxHeight: 300,
    marginBottom: 12,
  },
  draftText: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalFooter: {
    alignItems: 'flex-end',
  },
});

