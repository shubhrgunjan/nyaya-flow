import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface NyayaLogoProps {
  size?: number;
  showWordmark?: boolean;
  color?: string;
}

export const NyayaLogo: React.FC<NyayaLogoProps> = ({
  size = 40,
  showWordmark = false,
  color,
}) => {
  const { colors } = useTheme();
  const strokeColor = color || colors.accentPrimary;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.accentSecondary || strokeColor} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Outer geometric shield outline */}
        <Rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="12"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeOpacity="0.25"
          fill="none"
        />

        {/* Abstract Flowing 'N' Path with Forward Navigation Arrow Segment */}
        <Path
          d="M 15 34 V 16 C 15 16, 21 28, 25 32 C 29 36, 33 22, 33 14 M 33 14 L 28 18 M 33 14 L 33 20"
          stroke="url(#logoGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {showWordmark && (
        <View style={styles.wordmarkCol}>
          <Text style={[styles.wordmarkTitle, { color: colors.textPrimary }]}>NYAYA FLOW</Text>
          <Text style={[styles.wordmarkSubtitle, { color: colors.textSecondary }]}>LEGAL NAVIGATION</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkCol: {
    marginLeft: 12,
  },
  wordmarkTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  wordmarkSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 1,
  },
});
