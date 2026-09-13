import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useCases } from '../../src/hooks/useCases';
import { useLocalization } from '../../src/hooks/useLocalization';
import { Header } from '../../src/components/common/Header';
import { CaseCard } from '../../src/components/cases/CaseCard';
import { Button } from '../../src/components/common/Button';
import { LegalFlowBackground } from '../../src/components/common/LegalFlowBackground';

export default function CasesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { cases, loading } = useCases();
  const { t } = useLocalization();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const filteredCases = cases.filter((c) => {
    if (filter === 'active') return c.status === 'active' || c.status === 'in_notice' || c.status === 'filed';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LegalFlowBackground watermarkText="CASES 01" variant="dashboard" />
      <Header title="Your Cases" subtitle="Track your active legal roadmaps and procedural progress" />

      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        {(['all', 'active', 'resolved'] as const).map((tab) => {
          const selected = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? colors.accentMuted : colors.surfaceHighlight,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selected ? colors.accent : colors.textSecondary },
                  selected && { fontWeight: '600' },
                ]}
              >
                {tab === 'all' ? 'All cases' : tab === 'active' ? 'In progress' : 'Completed'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.accentPrimary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading legal cases...</Text>
          </View>
        ) : filteredCases.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surfaceHighlight }]}>
              <Ionicons name="folder-open-outline" size={36} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No cases found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Describe your legal situation on the Home tab to create a step-by-step roadmap.
            </Text>
            <Button
              title="Start a new case →"
              variant="primary"
              size="md"
              onPress={() => router.push('/intake')}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          filteredCases.map((item) => (
            <CaseCard
              key={item.id}
              caseItem={item}
              onPress={() => router.push(`/case/${item.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
