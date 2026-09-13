import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { NyayaLogo } from '../src/components/common/NyayaLogo';
import { AbstractPathIllustration } from '../src/components/common/AbstractPathIllustration';
import { Button } from '../src/components/common/Button';
import { LegalFlowBackground } from '../src/components/common/LegalFlowBackground';
import { LegalStamp } from '../src/components/common/LegalStamp';

export default function LandingScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const { signInAsDemoUser } = useAuth();

  const handleDemoAccess = async () => {
    try {
      await signInAsDemoUser();
      router.replace('/intake');
    } catch (e) {
      console.warn('[LandingScreen] Demo access error:', e);
      router.push('/intake');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LegalFlowBackground watermarkText="NYAYA FLOW" variant="dashboard" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.header}>
          <NyayaLogo size={36} showWordmark={true} />
          <LegalStamp label="2026 LEGAL TECH" variant="primary" size="sm" />
        </View>

        {/* Abstract Path Vector & Document Motif */}
        <View style={styles.illustrationBox}>
          <AbstractPathIllustration width={300} height={210} />
          
          {/* FLOW MOTIF BANNER: KNOW -> ROUTE -> ACT */}
          <View style={[styles.flowMotifBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.flowNode}>
              <View style={[styles.flowDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.flowLabel, { color: colors.textPrimary }]}>KNOW</Text>
            </View>
            <Text style={[styles.flowArrow, { color: colors.textMuted }]}>➔</Text>
            <View style={styles.flowNode}>
              <View style={[styles.flowDot, { backgroundColor: colors.accentSecondary }]} />
              <Text style={[styles.flowLabel, { color: colors.textPrimary }]}>ROUTE</Text>
            </View>
            <Text style={[styles.flowArrow, { color: colors.textMuted }]}>➔</Text>
            <View style={styles.flowNode}>
              <View style={[styles.flowDot, { backgroundColor: colors.accentSuccess }]} />
              <Text style={[styles.flowLabel, { color: colors.textPrimary }]}>ACT</Text>
            </View>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroBox}>
          <Text style={[styles.metaLabel, { color: colors.accent }]}>
            AI-POWERED LEGAL NAVIGATION FOR INDIA
          </Text>
          <Text style={[styles.taglineHeading, { color: colors.textPrimary, fontSize: typography.display.fontSize }]}>
            Know your rights.{'\n'}Know your next step.
          </Text>
          <Text style={[styles.supportingText, { color: colors.textSecondary, fontSize: typography.bodyLarge.fontSize }]}>
            Nyaya Flow turns legal chaos into a clear, procedural path — designed with high-fidelity statutory sources for Indian legal jurisdiction.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionBox, { marginTop: spacing.xl }]}>
          <Button
            title="Try Demo Mode (Instant Judge Entry) ➔"
            variant="primary"
            size="lg"
            style={styles.btn}
            onPress={handleDemoAccess}
          />

          <Button
            title="Start Full Case Intake"
            variant="secondary"
            size="md"
            style={[styles.btn, { marginTop: 10 }]}
            onPress={() => router.push('/onboarding/language')}
          />

          <Button
            title="Already registered? Sign in"
            variant="ghost"
            size="md"
            style={styles.signInBtn}
            onPress={() => router.push('/onboarding/phone')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  illustrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  flowMotifBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    width: '90%',
  },
  flowNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  flowArrow: {
    fontSize: 10,
  },
  heroBox: {
    marginTop: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  taglineHeading: {
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  supportingText: {
    lineHeight: 24,
  },
  actionBox: {
    width: '100%',
    paddingBottom: 16,
  },
  btn: {
    width: '100%',
  },
  signInBtn: {
    marginTop: 12,
    width: '100%',
  },
});
