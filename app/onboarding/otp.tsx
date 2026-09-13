import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const { verificationId, phoneNumber } = useLocalSearchParams<{ verificationId?: string; phoneNumber?: string }>();
  const { colors, typography, radius } = useTheme();
  const { verifyOtp, sendOtp } = useAuth();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChangeDigit = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (error) setError(null);

    // Auto-advance to next box
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when 6 digits filled
    if (newOtp.every((digit) => digit.length === 1)) {
      handleConfirmOtp(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await verifyOtp(verificationId || 'ver-dev', code);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      setTimer(30);
      setError(null);
      if (phoneNumber) {
        await sendOtp(phoneNumber);
      }
    } catch {
      setError('Failed to resend code.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="OTP Verification" showBack={true} />
      <View style={styles.content}>
        <View style={styles.headerGroup}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.headingLarge.fontSize }]}>
            Verify your number
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.body.fontSize }]}>
            Enter the 6-digit code sent to {phoneNumber || '+91 Mobile Number'}
          </Text>
        </View>

        {/* 6 OTP Input Boxes */}
        <View style={styles.otpSection}>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: colors.surface,
                    borderColor: digit ? colors.accentPrimary : colors.border,
                    color: colors.textPrimary,
                    borderRadius: radius.sm,
                  },
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChangeDigit(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
                editable={!loading}
              />
            ))}
          </View>

          {error && <Text style={[styles.errorText, { color: colors.accentError }]}>{error}</Text>}

          {/* Resend Section */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={[styles.resendTimerText, { color: colors.textMuted }]}>
                Resend code in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={[styles.resendActionText, { color: colors.accentPrimary }]}>Resend verification code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Testing Reassurance Note */}
          <View style={[styles.hintCard, { backgroundColor: colors.surfaceHighlight, borderRadius: radius.sm }]}>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              💡 Development Hint: Enter <Text style={{ fontWeight: '700' }}>123456</Text> to verify instantly.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={colors.accentPrimary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Verifying OTP...</Text>
            </View>
          ) : (
            <Button
              title="Verify & Continue"
              variant="primary"
              size="lg"
              style={styles.btn}
              onPress={() => handleConfirmOtp()}
              disabled={otp.some((d) => !d)}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  otpSection: {
    marginVertical: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  resendTimerText: {
    fontSize: 13,
  },
  resendActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hintCard: {
    padding: 12,
    marginTop: 16,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
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
