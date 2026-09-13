import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, ThemeMode } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useLocalization } from '../../src/hooks/useLocalization';
import { LanguageCode } from '../../src/types/i18n';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { LegalDisclaimerBanner } from '../../src/components/common/LegalDisclaimerBanner';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { profile, signOut } = useAuth();
  const { currentLanguage, setLanguage, t } = useLocalization();

  const languages: { code: LanguageCode; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'Default' },
    { code: 'hi', label: 'हिंदी (Hindi)', sub: 'हिन्दी अनुवाद' },
    { code: 'hinglish', label: 'Hinglish', sub: 'Romanized Hindi & English' },
  ];

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
    { mode: 'system', label: 'System', icon: 'desktop-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title={t.profile.title} subtitle="Account profile, developer tools, and settings" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Account Info */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ACCOUNT PROFILE</Text>
        <Card style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.profileHeaderRow}>
            <View style={[styles.avatarBox, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="person" size={24} color={colors.accent} />
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                {profile?.displayName || 'Nyaya Flow User'}
              </Text>
              <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                {profile?.phoneNumber || 'No phone verified'}
              </Text>
              {profile?.state && (
                <Text style={[styles.profileJurisdiction, { color: colors.textMuted }]}>
                  {profile.district ? `${profile.district}, ` : ''}{profile.state}
                </Text>
              )}
            </View>
          </View>
        </Card>



        {/* Appearance Mode */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>APPEARANCE</Text>
        <Card style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const selected = mode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: selected ? colors.accentMuted : colors.surface,
                      borderColor: selected ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setMode(opt.mode)}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={selected ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeBtnText,
                      { color: selected ? colors.accent : colors.textSecondary, fontWeight: selected ? '600' : '400' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Language Selection */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t.profile.languageSection}</Text>
        <Card style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langRow,
                { borderBottomColor: colors.borderSubtle },
                currentLanguage === lang.code && { backgroundColor: colors.accentMuted },
              ]}
              onPress={() => setLanguage(lang.code)}
            >
              <View>
                <Text style={[styles.langLabel, { color: colors.textPrimary }]}>{lang.label}</Text>
                <Text style={[styles.langSub, { color: colors.textSecondary }]}>{lang.sub}</Text>
              </View>
              {currentLanguage === lang.code && (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Legal Disclaimer */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>LEGAL SAFETY & TERMS</Text>
        <LegalDisclaimerBanner compact={false} />

        {/* About & Sign Out */}
        <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>ABOUT APPLICATION</Text>
        <Card style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.aboutTitle, { color: colors.accent }]}>NYAYA FLOW</Text>
          <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>Version 1.0.0 (Production Architecture)</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            "Know your rights. Know your next step." AI legal navigation platform for India.
          </Text>

          <View style={styles.signOutWrapper}>
            <Button
              title="Sign Out"
              variant="outline"
              size="md"
              onPress={async () => {
                await signOut();
                router.replace('/landing');
              }}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profilePhone: {
    fontSize: 13,
    marginTop: 2,
  },
  profileJurisdiction: {
    fontSize: 12,
    marginTop: 2,
  },
  inspectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inspectorIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  inspectorSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 13,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  langSub: {
    fontSize: 12,
    marginTop: 2,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  aboutVersion: {
    fontSize: 12,
    marginVertical: 4,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  signOutWrapper: {
    marginTop: 16,
  },
});
