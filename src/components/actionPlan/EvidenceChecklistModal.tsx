import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { EvidenceRequirement } from '../../types/actionPlan';
import { Button } from '../common/Button';

interface EvidenceChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  requirements: EvidenceRequirement[];
  caseId: string;
}

export const EvidenceChecklistModal: React.FC<EvidenceChecklistModalProps> = ({
  visible,
  onClose,
  requirements,
  caseId,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleScanPress = () => {
    onClose();
    router.push({
      pathname: '/scanner',
      params: { caseId },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Evidence Checklist</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Required documents to support your legal claim</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={requirements}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={[styles.itemRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                <Ionicons
                  name={item.isUploaded ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={item.isUploaded ? '#10B981' : colors.textMuted}
                  style={styles.checkIcon}
                />
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemLabel, { color: colors.textPrimary }, item.isUploaded && styles.uploadedLabel]}>
                    {item.label}
                  </Text>
                  {item.isRequired && (
                    <Text style={[styles.requiredTag, { color: colors.accent }]}>* Required before notice</Text>
                  )}
                </View>
                {item.isUploaded ? (
                  <View style={styles.uploadedBadge}>
                    <Text style={styles.uploadedBadgeText}>Attached</Text>
                  </View>
                ) : (
                  <Button
                    title="Scan"
                    variant="outline"
                    size="sm"
                    leftIcon={<Ionicons name="camera-outline" size={14} color={colors.accent} />}
                    onPress={handleScanPress}
                  />
                )}
              </View>
            )}
          />

          <View style={styles.footerRow}>
            <Button
              title="Scan Document Now"
              variant="primary"
              size="md"
              leftIcon={<Ionicons name="camera-outline" size={18} color="#FFFFFF" />}
              style={styles.fullBtn}
              onPress={handleScanPress}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    paddingVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  checkIcon: {
    marginRight: 10,
  },
  itemTextCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  uploadedLabel: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  requiredTag: {
    fontSize: 10,
    marginTop: 2,
  },
  uploadedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  uploadedBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  footerRow: {
    marginTop: 14,
  },
  fullBtn: {
    width: '100%',
  },
});

