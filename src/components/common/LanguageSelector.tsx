import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { CaseLanguage, LanguageOption, SUPPORTED_LANGUAGES } from '../../types/i18n';
import { normalizeCaseLanguage } from '../../services/language/languageDetectorService';

interface LanguageSelectorProps {
  currentLanguage?: string | CaseLanguage;
  onSelectLanguage: (lang: CaseLanguage) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  compact = false,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const activeLang = normalizeCaseLanguage(currentLanguage);

  const handleSelect = (option: LanguageOption) => {
    setModalVisible(false);
    const selectedObj: CaseLanguage = {
      code: option.code,
      name: option.name,
      nativeName: option.nativeName,
      source: 'user_selected',
    };
    onSelectLanguage(selectedObj);
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.selectorBtn,
          compact ? styles.compactBtn : styles.fullBtn,
          {
            backgroundColor: colors.surfaceHighlight,
            borderColor: colors.borderSubtle,
          },
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel="Select Case Language"
      >
        <Ionicons name="globe-outline" size={compact ? 14 : 16} color={colors.accent} />
        <Text style={[styles.selectorBtnText, { color: colors.textPrimary }, compact && { fontSize: 11 }]}>
          {activeLang.nativeName || activeLang.name}
        </Text>
        <Ionicons name="chevron-down" size={compact ? 12 : 14} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.accent },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Ionicons name="language-outline" size={20} color={colors.accent} />
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Select Case Language
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Changes presentation language without altering case facts or legal conclusions.
            </Text>

            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
              renderItem={({ item }) => {
                const isSelected = item.code === activeLang.code;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.langOptionCard,
                      {
                        backgroundColor: isSelected ? colors.surfaceHighlight : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.langTextCol}>
                      <Text style={[styles.nativeNameText, { color: colors.textPrimary }]}>
                        {item.nativeName}
                      </Text>
                      <Text style={[styles.englishNameText, { color: colors.textMuted }]}>
                        {item.name}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  compactBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fullBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectorBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: 8,
  },
  modalSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  langTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nativeNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  englishNameText: {
    fontSize: 12,
  },
});
