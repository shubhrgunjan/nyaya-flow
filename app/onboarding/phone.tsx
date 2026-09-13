import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';

type AuthTab = 'email' | 'phone';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { colors, typography, radius, spacing } = useTheme();
  const { sendOtp, signInWithEmail, signUpWithEmail, signInWithGoogleCredential, signInAsDemoUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoAccess = async () => {
    try {
      setLoading(true);
      await signInAsDemoUser();
      router.replace('/intake');
    } catch (e) {
      console.warn('[PhoneAuthScreen] Demo access error:', e);
      router.replace('/intake');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const cleaned = phoneNumber.trim().replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fullPhone = `+91${cleaned.slice(-10)}`;
      const { verificationId } = await sendOtp(fullPhone);
      router.push({
        pathname: '/onboarding/otp',
        params: { verificationId, phoneNumber: fullPhone },
      });
    } catch {
      setError('Unable to send verification code. Please try again or use email sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.includes('@') || password.length < 6) {
      setError('Please provide a valid email and minimum 6-character password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (isRegisterMode) {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Authentication failed. Please check credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Google Sign-In requires a native development build (not Expo Go).
    // For now, guide the user to use email/password auth which works everywhere.
    setError(
      'Google Sign-In requires a native development build. Please use Email Sign In above — it works instantly!'
    );
    setActiveTab('email');
  };

  const isPhoneValid = phoneNumber.trim().replace(/\D/g, '').length >= 10;
  const isEmailValid = email.includes('@') && password.length >= 6;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="Authentication" showBack={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerGroup}>
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.headingLarge.fontSize }]}>
              Welcome to Nyaya Flow
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.body.fontSize }]}>
              Sign in or create an account to access AI legal navigation.
            </Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'email' && { backgroundColor: colors.accentPrimary },
              ]}
              onPress={() => {
                setActiveTab('email');
                setError(null);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'email' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Email Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'phone' && { backgroundColor: colors.accentPrimary },
              ]}
              onPress={() => {
                setActiveTab('phone');
                setError(null);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'phone' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Phone OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          {activeTab === 'email' ? (
            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: radius.md,
                  },
                ]}
                placeholder="you@domain.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
              />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 16 }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: radius.md,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={true}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError(null);
                }}
              />

              {error && <Text style={[styles.errorText, { color: colors.accentError }]}>{error}</Text>}

              <TouchableOpacity
                onPress={() => setIsRegisterMode(!isRegisterMode)}
                style={styles.toggleRegisterRow}
              >
                <Text style={[styles.toggleRegisterText, { color: colors.accentPrimary }]}>
                  {isRegisterMode
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Register here"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputSection}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mobile Number</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
                ]}
              >
                <View style={[styles.countryBadge, { borderRightColor: colors.borderSubtle }]}>
                  <Text style={[styles.countryText, { color: colors.textPrimary }]}>+91</Text>
                </View>
                <TextInput
                  style={[styles.inputPhone, { color: colors.textPrimary }]}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    if (error) setError(null);
                  }}
                  editable={!loading}
                />
              </View>

              {error && <Text style={[styles.errorText, { color: colors.accentError }]}>{error}</Text>}

              <View style={styles.reassuranceRow}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.reassuranceText, { color: colors.textMuted }]}>
                  We will send a one-time verification code via SMS.
                </Text>
              </View>
            </View>
          )}

          {/* Social Sign In Option */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]} />
          </View>

          <Button
            title={isRegisterMode ? 'Sign up with Google' : 'Sign in with Google'}
            variant="secondary"
            size="lg"
            onPress={handleGoogleSignIn}
            style={{ marginBottom: spacing.md }}
          />

          {/* Submit Button */}
          <View style={styles.footer}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.accentPrimary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Authenticating...</Text>
              </View>
            ) : (
              <>
                <Button
                  title={activeTab === 'email' ? (isRegisterMode ? 'Create Account' : 'Sign In') : 'Continue with OTP'}
                  variant="primary"
                  size="lg"
                  style={styles.btn}
                  onPress={activeTab === 'email' ? handleEmailAuth : handleSendOtp}
                  disabled={activeTab === 'email' ? !isEmailValid : !isPhoneValid}
                />
                <Button
                  title="Try Demo Mode (Instant Judge Entry) ➔"
                  variant="secondary"
                  size="md"
                  style={[styles.btn, { marginTop: 12 }]}
                  onPress={handleDemoAccess}
                />
              </>
            )}
          </View>
        </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerGroup: {
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginVertical: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    height: 54,
  },
  countryBadge: {
    paddingHorizontal: 16,
    borderRightWidth: 1,
    height: '100%',
    justifyContent: 'center',
  },
  countryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputPhone: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '500',
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  toggleRegisterRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  toggleRegisterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  reassuranceText: {
    fontSize: 12,
    marginLeft: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 16,
  },
  btn: {
    width: '100%',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  loadingText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
