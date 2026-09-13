import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export interface LegalSourceItem {
  id?: string;
  title: string;
  authority?: string;
  url?: string;
  reason?: string;
  type?: 'statute' | 'portal' | 'court' | 'helpline' | 'official';
}

interface SourceBadgeProps {
  source: LegalSourceItem;
  compact?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, compact = false }) => {
  const { colors } = useTheme();

  const handleOpenSource = () => {
    if (source.url) {
      Linking.openURL(source.url);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!source.url}
      onPress={handleOpenSource}
      style={[
        styles.badgeContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.badgeLeft}>
        <Ionicons name="ribbon-outline" size={12} color={colors.accent} />
        <Text style={[styles.authorityTag, { color: colors.textMuted }]}>
          OFFICIAL PROVENANCE
        </Text>
      </View>
      <Text style={[styles.titleText, { color: colors.textPrimary, flexShrink: 1 }]}>
        {source.title}
      </Text>
      {source.url && (
        <Ionicons name="open-outline" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  );
};

interface SourcePanelProps {
  sources: LegalSourceItem[];
  title?: string;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  sources,
  title = 'OFFICIAL LEGAL SOURCES & PROVENANCE',
}) => {
  const { colors } = useTheme();

  if (!sources || sources.length === 0) return null;

  return (
    <View style={[styles.panelContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.panelHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
          <Text style={[styles.panelTitle, { color: colors.textMuted }]}>{title}</Text>
        </View>
        <Text style={[styles.verifiedBadge, { color: colors.accentSuccess }]}>VERIFIED GOVT PROVENANCE</Text>
      </View>

      <View style={styles.sourcesList}>
        {sources.map((item, idx) => (
          <View
            key={item.id || `src-${idx}`}
            style={[
              styles.sourceItemRow,
              {
                borderColor: colors.borderSubtle,
                borderBottomWidth: idx === sources.length - 1 ? 0 : 1,
              },
            ]}
          >
            <View style={styles.sourceMainInfo}>
              <Text style={[styles.sourceTitleText, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
              {item.authority && (
                <Text style={[styles.authorityName, { color: colors.accent }]}>
                  {item.authority}
                </Text>
              )}
              {item.reason && (
                <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                  "{item.reason}"
                </Text>
              )}
            </View>
            {item.url && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.openBtn, { backgroundColor: colors.accentMuted, borderColor: colors.accentPrimaryBorder }]}
                onPress={() => item.url && Linking.openURL(item.url)}
              >
                <Text style={[styles.openBtnText, { color: colors.accent }]}>Access ↗</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorityTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  panelContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginVertical: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  verifiedBadge: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sourcesList: {
    gap: 10,
  },
  sourceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 10,
  },
  sourceMainInfo: {
    flex: 1,
  },
  sourceTitleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  authorityName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  reasonText: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  openBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  openBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
