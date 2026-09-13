import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CaseDocument } from '../../types/case';

interface EvidenceCardProps {
  document: CaseDocument;
  onPress?: () => void;
  onDelete?: () => void;
  usedInActionIds?: string[];
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  document,
  onPress,
  onDelete,
  usedInActionIds = [],
}) => {
  const { colors } = useTheme();

  const isAudio = document.mimeType?.includes('audio') || document.fileName?.endsWith('.mp3') || document.fileName?.endsWith('.m4a');
  const isImage = document.mimeType?.includes('image') || document.fileName?.endsWith('.jpg') || document.fileName?.endsWith('.png');

  const getDocIcon = () => {
    if (isImage) return 'image-outline';
    if (isAudio) return 'mic-outline';
    return 'document-text-outline';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          <View style={[styles.typeIconFrame, { backgroundColor: colors.accentMuted, borderColor: colors.accentPrimaryBorder }]}>
            <Ionicons name={getDocIcon()} size={16} color={colors.accent} />
          </View>
          <View style={styles.titleStack}>
            <Text style={[styles.docTypeLabel, { color: colors.textMuted }]}>
              EVIDENCE OBJECT • {(document.documentCategory || (isImage ? 'IMAGE' : isAudio ? 'AUDIO' : 'DOCUMENT')).toUpperCase()}
            </Text>
            <Text style={[styles.docTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {document.fileName}
            </Text>
          </View>
        </View>

        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          Added {formatDate(document.scannedAt)}
        </Text>
      </View>

      {/* Waveform graphic for Audio evidence */}
      {isAudio && (
        <View style={[styles.waveformBox, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="volume-medium-outline" size={14} color={colors.accent} />
          <View style={styles.waveformBars}>
            {[40, 75, 30, 90, 60, 100, 45, 80, 25, 60, 85, 35, 70].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: (h / 100) * 18,
                    backgroundColor: i % 2 === 0 ? colors.accent : colors.accent + '80',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Preview Thumbnail for Image evidence */}
      {isImage && document.fileUri && (
        <View style={styles.imagePreviewFrame}>
          <Image source={{ uri: document.fileUri }} style={styles.previewImage} resizeMode="cover" />
        </View>
      )}

      {/* Connected Action Badges */}
      {usedInActionIds.length > 0 && (
        <View style={styles.usedInRow}>
          <Ionicons name="link-outline" size={12} color={colors.accentSuccess} />
          <Text style={[styles.usedInText, { color: colors.accentSuccess }]}>
            Used in: {usedInActionIds.map((id) => `Action ${id.replace(/[^0-9]/g, '') || id}`).join(', ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  typeIconFrame: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStack: {
    flex: 1,
  },
  docTypeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  waveformBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    gap: 8,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    height: 18,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  imagePreviewFrame: {
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  usedInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  usedInText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
