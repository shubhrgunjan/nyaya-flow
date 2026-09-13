import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { NyayaLogo } from '../../src/components/common/NyayaLogo';

export default function ProfileCompletionScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { profile, saveProfileStep, reloadSession } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    try {
      setLoading(true);
      await saveProfileStep({ onboardingCompleted: true });
      await reloadSession();
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoRow}>
          <NyayaLogo size={56} />
        </View>

        <View style={styles.headerGroup}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.headingLarge.fontSize }]}>
            You're all set.
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.bodyLarge.fontSize }]}>
            Nyaya Flow is ready to help you navigate your legal situation with clarity.
          </Text>
        </View>

        {/* Profile Summary Card */}
        <Card elevated={true} style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={24} color={colors.accentPrimary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account Profile</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Name:</Text>
            <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{profile?.displayName || 'User'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone:</Text>
            <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{profile?.phoneNumber || '+91 Mobile'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Jurisdiction:</Text>
            <Text style={[styles.infoVal, { color: colors.textPrimary }]}>
              {profile?.district ? `${profile.district}, ${profile.state}` : 'Delhi (NCT)'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Language:</Text>
            <Text style={[styles.infoVal, { color: colors.textPrimary }]}>
              {profile?.preferredLanguage?.toUpperCase() || 'ENGLISH'}
            </Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Button
            title="Go to Nyaya Flow Home"
            variant="primary"
            size="lg"
            style={styles.btn}
            onPress={handleFinish}
            loading={loading}
          />
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
  logoRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerGroup: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    marginVertical: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 16,
  },
  btn: {
    width: '100%',
  },
});
