import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useCases } from '../../src/hooks/useCases';
import { useLocalization } from '../../src/hooks/useLocalization';
import { Button } from '../../src/components/common/Button';
import { CaseCard } from '../../src/components/cases/CaseCard';
import { LegalDisclaimerBanner } from '../../src/components/common/LegalDisclaimerBanner';
import { NyayaLogo } from '../../src/components/common/NyayaLogo';
import { LegalFlowBackground } from '../../src/components/common/LegalFlowBackground';
import { JurisdictionIndicator } from '../../src/components/common/JurisdictionIndicator';
import { LegalStamp } from '../../src/components/common/LegalStamp';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { cases, loading } = useCases();
  const { t } = useLocalization();
  const [quickInputText, setQuickInputText] = useState('');

  const userState = profile?.state || 'Delhi';
  const userDistrict = profile?.district || 'New Delhi';

  const handleStartIntake = (prefill?: string) => {
    if (prefill) {
      router.push(`/intake?prefill=${encodeURIComponent(prefill)}`);
    } else if (quickInputText.trim()) {
      router.push(`/intake?prefill=${encodeURIComponent(quickInputText.trim())}`);
    } else {
      router.push('/intake');
    }
  };

  const categories = [
    {
      id: 'rent',
      title: 'Rent & Landlord',
      subtitle: 'Security deposits, eviction, lease terms',
      icon: 'home-outline' as const,
      prefill: 'My landlord is refusing to return my security deposit of ₹50,000 after 30 days of lease end.',
    },
    {
      id: 'refunds',
      title: 'Purchases & Refunds',
      subtitle: 'Defective products, e-commerce, wrong billing',
      icon: 'card-outline' as const,
      prefill: 'E-commerce platform delivered a defective laptop worth ₹65,000 and rejected my refund request.',
    },
    {
      id: 'rti',
      title: 'Government & RTI',
      subtitle: 'Public records, RTI applications, civic issues',
      icon: 'business-outline' as const,
      prefill: 'I need to file an RTI application to check status of public infrastructure work in my area.',
    },
    {
      id: 'workplace',
      title: 'Workplace & Salary',
      subtitle: 'Unpaid wages, termination notice, F&F settlement',
      icon: 'briefcase-outline' as const,
      prefill: 'My employer has withheld final settlement salary for 60 days after my resignation.',
    },
    {
      id: 'contracts',
      title: 'Contracts & Documents',
      subtitle: 'Service agreements, NDAs, contract breach',
      icon: 'document-text-outline' as const,
      prefill: 'A service provider failed to deliver contractually agreed services after receiving payment.',
    },
    {
      id: 'other',
      title: 'Other Legal Issue',
      subtitle: 'General legal guidance & procedural path',
      icon: 'scale-outline' as const,
      prefill: '',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LegalFlowBackground watermarkText="NYAYA FLOW" variant="intake" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Clean Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandTitleRow}>
            <NyayaLogo size={28} />
            <View>
              <Text style={[styles.brandName, { color: colors.textPrimary }]}>Nyaya Flow</Text>
              <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
                Legal Navigation & Procedural Roadmap
              </Text>
            </View>
          </View>
        </View>

        {/* Location Indicator */}
        <JurisdictionIndicator state={userState} district={userDistrict} />

        {/* MAIN INTAKE SURFACE */}
        <View
          style={[
            styles.intakeCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.primaryQuestion, { color: colors.textPrimary }]}>
            Tell us what happened
          </Text>
          <Text style={[styles.secondaryPrompt, { color: colors.textSecondary }]}>
            You don't need legal terms. Explain it in your own words.
          </Text>

          {/* Text Input Box */}
          <View style={[styles.intakeInputBox, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
            <TextInput
              style={[styles.intakeTextInput, { color: colors.textPrimary }]}
              placeholder="e.g. My landlord has refused to return my ₹50,000 security deposit after 30 days..."
              placeholderTextColor={colors.textMuted}
              multiline={true}
              numberOfLines={3}
              value={quickInputText}
              onChangeText={setQuickInputText}
            />

            {/* Input Toolbar */}
            <View style={[styles.inputToolbar, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.inputModesLeft}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.modeChip, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  onPress={() => router.push('/intake?mode=voice')}
                >
                  <Ionicons name="mic-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.modeChipText, { color: colors.textSecondary }]}>Speak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.modeChip, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  onPress={() => router.push('/scanner?mode=camera')}
                >
                  <Ionicons name="camera-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.modeChipText, { color: colors.textSecondary }]}>Scan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.modeChip, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                  onPress={() => router.push('/scanner?mode=picker')}
                >
                  <Ionicons name="document-attach-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.modeChipText, { color: colors.textSecondary }]}>Upload</Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Route my case →"
                variant="primary"
                size="md"
                onPress={() => handleStartIntake()}
              />
            </View>
          </View>
        </View>

        {/* VISUAL CATEGORY TILES (Section 7) */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Where to start
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Select a legal area to begin your case roadmap
          </Text>

          <View style={styles.gridContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                style={[styles.categoryTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleStartIntake(cat.prefill)}
              >
                <View style={[styles.categoryIconBox, { backgroundColor: colors.accentMuted }]}>
                  <Ionicons name={cat.icon} size={20} color={colors.accent} />
                </View>
                <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>{cat.title}</Text>
                <Text style={[styles.categorySub, { color: colors.textSecondary }]} numberOfLines={2}>
                  {cat.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subtle Disclaimer */}
        <LegalDisclaimerBanner compact={true} />

        {/* ACTIVE CASES SECTION (Section 8) */}
        <View style={styles.casesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleCol}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Your cases
              </Text>
            </View>
            {cases.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/cases')}>
                <Text style={[styles.viewAllText, { color: colors.accent }]}>View all →</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading cases...
            </Text>
          ) : cases.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="folder-open-outline" size={28} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No cases yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Describe your situation above to create your first legal roadmap.
              </Text>
            </View>
          ) : (
            cases.slice(0, 3).map((item) => (
              <CaseCard
                key={item.id}
                caseItem={item}
                onPress={() => router.push(`/case/${item.id}`)}
              />
            ))
          )}
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
    padding: 16,
    paddingBottom: 90,
  },
  brandHeader: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
  },
  brandTagline: {
    fontSize: 12,
    marginTop: 1,
  },
  intakeCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginTop: 14,
    marginBottom: 20,
  },
  primaryQuestion: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  secondaryPrompt: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  intakeInputBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  intakeTextInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  inputModesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryTile: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  categoryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  categorySub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  casesSection: {
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleCol: {
    flex: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 13,
    marginVertical: 16,
  },
  emptyBox: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginVertical: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});


