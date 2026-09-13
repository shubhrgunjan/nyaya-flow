import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { TimelineEvent } from '../../types/case';

interface CaseTimelineProps {
  events: TimelineEvent[];
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ events }) => {
  return (
    <View style={styles.container}>
      {events.map((item, index) => (
        <View key={item.id} style={styles.timelineRow}>
          <View style={styles.leftCol}>
            <View style={styles.iconDot}>
              <Ionicons name="git-commit-outline" size={14} color={theme.colors.brandPrimary} />
            </View>
            {index < events.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.time}>{new Date(item.timestamp).toLocaleDateString('en-IN')}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    width: 24,
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.brandPrimaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginTop: 4,
  },
  rightCol: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
  },
  desc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  time: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
});
