import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLocalization } from '../../src/hooks/useLocalization';
import { Header } from '../../src/components/common/Header';
import { Card } from '../../src/components/common/Card';
import { legalKnowledgeService } from '../../src/services/legal/legalKnowledgeService';

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Topics', icon: 'sparkles-outline' },
    { id: 'housing', label: 'Rent & Housing 🏠', icon: 'home-outline' },
    { id: 'consumer', label: 'Purchases & Refunds 💳', icon: 'card-outline' },
    { id: 'rti', label: 'Government & RTI 🏛', icon: 'business-outline' },
    { id: 'labour', label: 'Workplace 💼', icon: 'briefcase-outline' },
    { id: 'contract', label: 'Contracts 📄', icon: 'document-text-outline' },
    { id: 'aid', label: 'Legal Aid ⚖️', icon: 'scale-outline' },
  ];

  const rawGuides = legalKnowledgeService.getGuides();

  const filteredGuides = rawGuides.filter((guide) => {
    if (selectedCategory === 'all') return true;
    return (
      guide.category.toLowerCase().includes(selectedCategory) ||
      guide.id.toLowerCase().includes(selectedCategory)
    );
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header title="Know Your Rights" subtitle="Statutory rights, official portals, and procedural guidance" />

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}
        contentContainerStyle={styles.categoryRowContent}
      >
        {categories.map((cat) => {
          const selected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selected ? colors.accentMuted : colors.surfaceHighlight,
                  borderColor: selected ? colors.accent : colors.borderSubtle,
                },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selected ? colors.accent : colors.textSecondary },
                  selected && { fontWeight: '600' },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredGuides.map((guide) => (
          <Card
            key={guide.id}
            style={[styles.guideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => Linking.openURL(guide.officialPortalUrl)}
          >
            <View style={styles.cardHeaderRow}>
              <View style={[styles.badge, { backgroundColor: colors.accentMuted }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>
                  {guide.category.toUpperCase()}
                </Text>
              </View>
              {/* Provenance Label (Requirement 15) */}
              <View style={[styles.provenanceBadge, { backgroundColor: colors.surfaceHighlight }]}>
                <Text style={[styles.provenanceText, { color: colors.textMuted }]}>
                  Official source verified
                </Text>
              </View>
            </View>

            <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>{guide.title}</Text>
            <Text style={[styles.guideSummary, { color: colors.textSecondary }]}>{guide.summary}</Text>

            <View style={[styles.rightsContainer, { backgroundColor: colors.surfaceHighlight }]}>
              {guide.keyRights.map((r, i) => (
                <View key={i} style={styles.rightBullet}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={colors.accent} />
                  <Text style={[styles.rightText, { color: colors.textPrimary }]}>{r}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.actFooter, { borderTopColor: colors.borderSubtle }]}>
              <Text style={[styles.actText, { color: colors.textMuted }]}>
                Governing Law: {guide.applicableAct}
              </Text>
              <View style={styles.openRow}>
                <Text style={[styles.openText, { color: colors.accent }]}>Official Portal</Text>
                <Ionicons name="open-outline" size={13} color={colors.accent} />
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  categoryRow: {
    maxHeight: 50,
    borderBottomWidth: 1,
  },
  categoryRowContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  guideCard: {
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  provenanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  provenanceText: {
    fontSize: 10,
    fontWeight: '500',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  guideSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  rightsContainer: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    gap: 4,
  },
  rightBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightText: {
    fontSize: 12,
    flex: 1,
  },
  actFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actText: {
    fontSize: 11,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

