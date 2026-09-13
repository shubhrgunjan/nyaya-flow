import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export const AbstractPathIllustration: React.FC<{ width?: number; height?: number }> = ({
  width = 280,
  height = 200,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox="0 0 280 200" fill="none">
        <Defs>
          <LinearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.accentPrimary} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={colors.accentSecondary || colors.accentPrimary} stopOpacity="0.2" />
          </LinearGradient>
          <LinearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.accentPrimary} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={colors.accentPrimary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Soft background shape */}
        <Path
          d="M 20 160 Q 90 20 160 100 T 260 40 L 260 180 L 20 180 Z"
          fill="url(#glowGrad)"
        />

        {/* Clean flowing navigation path representing Legal Problem -> Clarity -> Next Step */}
        <Path
          d="M 30 150 C 70 150, 80 50, 140 70 C 200 90, 210 30, 250 40"
          stroke="url(#pathGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Nodes along the journey */}
        <Circle cx="30" cy="150" r="5" fill={colors.textMuted} />
        <Circle cx="140" cy="70" r="6" fill={colors.accentPrimary} stroke={colors.background} strokeWidth="2" />
        <Circle cx="250" cy="40" r="7" fill={colors.accentPrimary} stroke={colors.background} strokeWidth="2" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
});
