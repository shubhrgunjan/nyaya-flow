import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface LegalStampProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  subLabel?: string;
  size?: 'sm' | 'md';
}

export const LegalStamp: React.FC<LegalStampProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const { colors } = useTheme();

  // Clean label mapping to subtle state dots
  const normalizedLabel = () => {
    const raw = label.trim();
    if (raw.toLowerCase().includes('completed') || raw.toLowerCase().includes('case ready') || raw.toLowerCase() === 'resolved') {
      return '✓ Completed';
    }
    if (raw.toLowerCase().includes('action') || raw.toLowerCase().includes('needed') || raw.toLowerCase() === 'in_notice') {
      return '● Action needed';
    }
    if (raw.toLowerCase().includes('waiting') || raw.toLowerCase().includes('pending')) {
      return '● Waiting';
    }
    if (raw.toLowerCase().includes('active') || raw.toLowerCase().includes('progress')) {
      return '● In progress';
    }
    return raw;
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          textColor: colors.accentSuccess,
          bgColor: colors.accentSuccess + '15',
        };
      case 'warning':
        return {
          textColor: colors.accentWarning,
          bgColor: colors.accentWarning + '15',
        };
      case 'danger':
        return {
          textColor: colors.accentError,
          bgColor: colors.accentError + '15',
        };
      case 'muted':
        return {
          textColor: colors.textMuted,
          bgColor: colors.surfaceHighlight,
        };
      case 'primary':
      default:
        return {
          textColor: colors.accent,
          bgColor: colors.accentMuted,
        };
    }
  };

  const styleVar = getVariantColors();
  const displayLabel = normalizedLabel();

  return (
    <View
      style={[
        styles.badgeContainer,
        {
          backgroundColor: styleVar.bgColor,
          paddingHorizontal: size === 'sm' ? 8 : 10,
          paddingVertical: size === 'sm' ? 3 : 5,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: styleVar.textColor,
            fontSize: size === 'sm' ? 11 : 12,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontWeight: '600',
  },
});
