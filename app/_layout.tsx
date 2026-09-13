import React from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { ErrorBoundary } from '../src/components/common/ErrorBoundary';

// Permanently suppress developer/runtime warning overlays in production presentation
LogBox.ignoreAllLogs(true);

function RootStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="landing" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/language" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/phone" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/otp" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/name" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/location" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/completion" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="intake" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="scanner" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="case/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootStack />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}


