import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { NyayaLogo } from '../src/components/common/NyayaLogo';

export default function SplashScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/landing');
    }, 1800);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <NyayaLogo size={64} />
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.display.fontSize }]}>
          NYAYA FLOW
        </Text>
        <Text style={[styles.tagline, { color: colors.textSecondary, fontSize: typography.body.fontSize }]}>
          Know your rights. Know your next step.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 20,
  },
  tagline: {
    marginTop: 8,
    textAlign: 'center',
  },
});
