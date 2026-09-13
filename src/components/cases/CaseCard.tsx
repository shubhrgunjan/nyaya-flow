import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CaseModel } from '../../types/case';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { LegalStamp } from '../common/LegalStamp';

interface CaseCardProps {
  caseItem: CaseModel;
  onPress: () => void;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem, onPress }) => {
  const { colors } = useTheme();

  const stateStr =
    typeof caseItem.jurisdiction === 'string'
      ? caseItem.jurisdiction
      : caseItem.jurisdiction?.state || caseItem.jurisdiction?.district || 'India';

  const categoryStr = (caseItem.subcategory || caseItem.category || 'General Legal')
    .replace('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const subtitleStr = `${stateStr} · ${categoryStr}`;

  const nextAction =
    caseItem.actions?.find((a) => a.status === 'in_progress' || a.status === 'pending') ||
    caseItem.actions?.[0];

  const nextActionTitle = nextAction?.title || 'Review case roadmap';

  return (
    <Card
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      elevated={false}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleCol}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {caseItem.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitleStr}</Text>
        </View>
        <LegalStamp label={caseItem.status || 'active'} variant="primary" size="sm" />
      </View>

      <View style={[styles.nextStepRow, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={[styles.nextLabel, { color: colors.textMuted }]}>Next</Text>
        <Text style={[styles.nextTitle, { color: colors.accent }]} numberOfLines={1}>
          {nextActionTitle} →
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  nextLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
