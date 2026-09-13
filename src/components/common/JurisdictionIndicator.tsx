import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface JurisdictionIndicatorProps {
  state?: string;
  district?: string;
  referenceId?: string;
  compact?: boolean;
}

export const JurisdictionIndicator: React.FC<JurisdictionIndicatorProps> = ({
  state = 'Delhi',
  district,
}) => {
  const { colors } = useTheme();

  const formattedState = state.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const formattedDistrict = district ? district.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';

  const locationStr = formattedDistrict ? `${formattedDistrict}, ${formattedState}` : formattedState;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
      <Ionicons name="location-outline" size={14} color={colors.accent} />
      <Text style={[styles.jurisdictionVal, { color: colors.textSecondary }]}>
        {locationStr} · India Legal Jurisdiction
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  jurisdictionVal: {
    fontSize: 12,
    fontWeight: '500',
  },
});
