import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

export default function IndexGuardRoute() {
  const router = useRouter();
  const { session, profile, isLoading, isAuthenticated, isOnboardingComplete } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      try {
        if (!isAuthenticated) {
          router.replace('/landing');
          return;
        }

        if (!isOnboardingComplete) {
          if (!profile?.preferredLanguage) {
            router.replace('/onboarding/language');
          } else if (!profile?.displayName) {
            router.replace('/onboarding/name');
          } else if (!profile?.state) {
            router.replace('/onboarding/location');
          } else {
            router.replace('/onboarding/completion');
          }
          return;
        }

        router.replace('/(tabs)');
      } catch (err) {
        console.warn('[IndexGuardRoute] Initial navigation error:', err);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, isOnboardingComplete, profile, router, session]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accentPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
