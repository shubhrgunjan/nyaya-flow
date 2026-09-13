import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { LEGAL_DISCLAIMER_TEXT } from '../../domain/legal/disclaimerNotice';

interface LegalDisclaimerBannerProps {
  compact?: boolean;
}

export const LegalDisclaimerBanner: React.FC<LegalDisclaimerBannerProps> = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={14}
        color={colors.textMuted}
        style={styles.icon}
      />
      <Text style={[styles.text, { color: colors.textMuted }]}>
        Nyaya Flow provides legal navigation and guidance, not attorney representation.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});

