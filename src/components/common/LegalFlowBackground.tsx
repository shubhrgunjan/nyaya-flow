import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface LegalFlowBackgroundProps {
  watermarkText?: string;
  variant?: 'intake' | 'roadmap' | 'dashboard' | 'document';
}

export const LegalFlowBackground: React.FC<LegalFlowBackgroundProps> = ({
  watermarkText = 'CASE 01',
  variant = 'dashboard',
}) => {
  const { colors, isDark } = useTheme();
  const isDarkMode = isDark;
  const screenWidth = Dimensions.get('window').width;

  const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.015)' : 'rgba(15, 23, 42, 0.015)';
  const strokeColor = isDarkMode ? 'rgba(139, 92, 246, 0.03)' : 'rgba(124, 58, 237, 0.03)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Background subtle watermark */}
      <View style={styles.watermarkContainer}>
        <Text style={[styles.watermark, { color: textColor }]}>
          NYAYA FLOW
        </Text>
      </View>

      {/* Abstract contour flow path lines */}
      <Svg height="100%" width="100%" style={styles.svgOverlay}>
        {/* Vertical filing margin line */}
        <Line x1="28" y1="0" x2="28" y2="100%" stroke={strokeColor} strokeWidth="1" strokeDasharray="6 6" />
        
        {/* Horizontal structural rules */}
        <Line x1="0" y1="120" x2={screenWidth} y2="120" stroke={strokeColor} strokeWidth="1" />
        <Line x1="0" y1="420" x2={screenWidth} y2="420" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 4" />

        {/* Abstract flow node motif */}
        {variant === 'roadmap' && (
          <>
            <Path
              d="M 28 80 Q 80 180 28 280 T 28 480"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
            />
            <Circle cx="28" cy="80" r="3" fill={strokeColor} />
            <Circle cx="28" cy="280" r="3" fill={strokeColor} />
            <Circle cx="28" cy="480" r="3" fill={strokeColor} />
          </>
        )}

        {/* Top-right document notch grid */}
        <Rect
          x={screenWidth - 90}
          y="30"
          width="60"
          height="80"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  watermarkContainer: {
    position: 'absolute',
    top: 40,
    right: -20,
    opacity: 1,
    transform: [{ rotate: '-4deg' }],
  },
  watermark: {
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 8,
  },
  watermarkSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: -8,
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
