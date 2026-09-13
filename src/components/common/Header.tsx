import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  rightAction,
  rightElement,
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const actionNode = rightAction || rightElement;

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.background, borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.leftRow}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleColumn}>
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {actionNode && <View style={styles.rightContainer}>{actionNode}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  titleColumn: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  rightContainer: {
    marginLeft: 12,
  },
});
