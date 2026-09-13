import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ProgressBarProps {
  progressPercentage: number;
  height?: number;
  style?: ViewStyle;
  fillColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercentage,
  height = 6,
  style,
  fillColor,
}) => {
  const { colors } = useTheme();
  const percentage = Math.max(0, Math.min(100, progressPercentage));
  const activeColor = fillColor || colors.accent;

  return (
    <View style={[styles.track, { height, backgroundColor: colors.surfaceHighlight }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${percentage}%`,
            height,
            backgroundColor: activeColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
});

