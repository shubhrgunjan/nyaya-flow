import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { VoiceProvider } from '../../hooks/useVoiceInput';

export interface VoiceProviderToggleProps {
  provider: VoiceProvider;
  onToggle: () => void;
  disabled?: boolean;
}

export const VoiceProviderToggle: React.FC<VoiceProviderToggleProps> = ({
  provider,
  onToggle,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const isGnani = provider === 'gnani';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onToggle}
      style={[
        styles.container,
        {
          backgroundColor: isGnani ? 'rgba(56, 189, 248, 0.15)' : colors.surfaceHighlight,
          borderColor: isGnani ? '#38BDF8' : colors.borderSubtle,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Voice transcription provider toggle. Current provider: ${isGnani ? 'Gnani.ai' : 'Gemini'}`}
    >
      <Text
        style={[
          styles.label,
          {
            color: isGnani ? '#38BDF8' : colors.textSecondary,
            fontWeight: isGnani ? '700' : '500',
          },
        ]}
      >
        Gnani.ai{isGnani ? ' ✓' : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
