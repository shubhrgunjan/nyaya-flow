import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';

export default function NameOnboardingScreen() {
  const router = useRouter();
  const { colors, typography, radius } = useTheme();
  const { profile, saveProfileStep } = useAuth();

  const [name, setName] = useState(profile?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your full name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await saveProfileStep({ displayName: trimmed });
      router.push('/onboarding/location');
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="Your Profile" showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.headerGroup}>
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.headingLarge.fontSize }]}>
              First, what should we call you?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.body.fontSize }]}>
              We use your name on generated legal notices and formal correspondence.
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError(null);
                }}
                autoCapitalize="words"
                autoFocus={true}
                editable={!loading}
              />
            </View>
            {error && <Text style={[styles.errorText, { color: colors.accentError }]}>{error}</Text>}
          </View>

          <View style={styles.footer}>
            <Button
              title="Continue"
              variant="primary"
              size="lg"
              style={styles.btn}
              onPress={handleContinue}
              loading={loading}
              disabled={!name.trim()}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
  },
  headerGroup: {
    marginTop: 8,
  },
  title: {
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  inputSection: {
    marginVertical: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1.5,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    paddingBottom: 16,
  },
  btn: {
    width: '100%',
  },
});
