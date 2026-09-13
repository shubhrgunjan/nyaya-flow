import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { LanguageCode } from '../../src/types/i18n';
import { Button } from '../../src/components/common/Button';
import { Header } from '../../src/components/common/Header';

interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'hinglish', nativeName: 'Hinglish', englishName: 'Romanized Hindi & English' },
  { code: 'en', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'en', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'en', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'en', nativeName: 'తెలుగు', englishName: 'Telugu' },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { colors, typography, radius } = useTheme();
  const { saveProfileStep } = useAuth();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('en');

  const handleContinue = async () => {
    await saveProfileStep({ preferredLanguage: selectedLang });
    router.push('/onboarding/phone');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="Language" showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.headingLarge.fontSize }]}>
            How would you like to use Nyaya Flow?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.body.fontSize }]}>
            Choose your preferred language. You can change this anytime in your profile settings.
          </Text>
        </View>

        <View style={styles.grid}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLang === lang.code && index < 3; // Highlight active primary options
            return (
              <TouchableOpacity
                key={`${lang.nativeName}-${index}`}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: isSelected ? colors.accentPrimaryMuted : colors.surface,
                    borderColor: isSelected ? colors.accentPrimary : colors.border,
                    borderRadius: radius.md,
                  },
                ]}
                onPress={() => setSelectedLang(lang.code)}
              >
                <View style={styles.cardContent}>
                  <Text style={[styles.nativeText, { color: colors.textPrimary }]}>{lang.nativeName}</Text>
                  <Text style={[styles.englishText, { color: colors.textSecondary }]}>{lang.englishName}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.accentPrimary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            title="Continue"
            variant="primary"
            size="lg"
            style={styles.btn}
            onPress={handleContinue}
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
    padding: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
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
  grid: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  cardContent: {
    flex: 1,
  },
  nativeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  englishText: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    paddingBottom: 16,
  },
  btn: {
    width: '100%',
  },
});
