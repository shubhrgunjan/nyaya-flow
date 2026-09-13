import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { StepPriority, StepStatus } from '../../types/actionPlan';
import { UrgencyLevel } from '../../types/legal';

interface BadgeProps {
  label: string;
  type?: 'status' | 'priority' | 'urgency' | 'custom';
  value?: StepStatus | StepPriority | UrgencyLevel | string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, type: _type = 'custom', value, style }) => {
  const { colors, isDark } = useTheme();

  const getColors = () => {
    const val = (value || label).toLowerCase();

    if (val === 'completed' || val === 'resolved') {
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.12)',
        text: isDark ? '#10B981' : '#059669',
        border: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.25)',
      };
    }
    if (val === 'in_progress' || val === 'active' || val === 'in_notice') {
      return {
        bg: colors.accentMuted,
        text: colors.accent,
        border: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.25)',
      };
    }
    if (val === 'pending' || val === 'medium') {
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.12)',
        text: isDark ? '#F59E0B' : '#D97706',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.25)',
      };
    }
    if (val === 'high' || val === 'critical' || val === 'urgent') {
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.12)',
        text: isDark ? '#EF4444' : '#DC2626',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.25)',
      };
    }

    return { bg: colors.surfaceHighlight, text: colors.textSecondary, border: colors.borderSubtle };
  };

  const badgeColors = getColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeColors.bg, borderColor: badgeColors.border },
        style,
      ]}
    >
      <Text style={[styles.badgeText, { color: badgeColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

