import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useIntake } from '../src/hooks/useIntake';
import { useLocalization } from '../src/hooks/useLocalization';
import { Header } from '../src/components/common/Header';
import { Button } from '../src/components/common/Button';
import { LegalDisclaimerBanner } from '../src/components/common/LegalDisclaimerBanner';
import { LegalFlowBackground } from '../src/components/common/LegalFlowBackground';
import { LegalStamp } from '../src/components/common/LegalStamp';
import { VoiceProviderToggle } from '../src/components/common/VoiceProviderToggle';

export default function IntakeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string; mode?: string }>();
  const { colors } = useTheme();
  const { t, currentLanguage } = useLocalization();
  const {
    inputText,
    setInputText,
    voiceState,
    voiceError,
    voiceProvider,
    isGnaniError,
    isListening,
    isTranscribing,
    isProcessing,
    processingStage,
    error,
    toggleVoiceProvider,
    switchProviderToGemini,
    toggleListening,
    cancelVoiceInput,
    retryVoiceInput,
    processIntake,
  } = useIntake();

  useEffect(() => {
    if (params.prefill && !inputText) {
      setInputText(decodeURIComponent(params.prefill));
    }
    if (params.mode === 'voice' && voiceState === 'idle' && !inputText) {
      toggleListening(currentLanguage);
    }
  }, [params.prefill, params.mode]);

  const handleGenerate = async () => {
    const newCase = await processIntake();
    if (newCase) {
      router.replace(`/case/${newCase.id}`);
    }
  };

  const getStageList = () => [
    { key: 'understanding', label: 'UNDERSTANDING LEGAL CHAOS' },
    { key: 'routing', label: 'ROUTING JURISDICTION & LAWS' },
    { key: 'sources', label: 'FINDING STATUTORY SOURCES' },
    { key: 'building', label: 'BUILDING PROCEDURAL PATH' },
    { key: 'validating', label: 'VALIDATING CASE MAP' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <LegalFlowBackground watermarkText="NYAYA FLOW" variant="intake" />
      <Header title="Describe your legal matter" showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <LegalDisclaimerBanner compact={true} />

          {/* Legal Intake Header */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              Tell us what happened
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Describe your situation in plain words. Nyaya Flow will analyze statutory requirements and build your procedural roadmap.
            </Text>
          </View>

          {/* Intake Surface Input Card */}
          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.textPrimary }]}
              multiline={true}
              numberOfLines={6}
              placeholder={t.intake.inputPlaceholder || "Provide details: What occurred, date, parties involved, financial loss..."}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              editable={!isProcessing && !isListening && !isTranscribing}
            />

            {/* Integrated Toolbar */}
            <View style={[styles.inputToolbar, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.mediaActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.mediaBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                  onPress={() => router.push('/scanner?mode=camera')}
                  accessibilityLabel="Scan Document with Camera"
                >
                  <Ionicons name="camera-outline" size={18} color={colors.accent} />
                  <Text style={[styles.mediaBtnText, { color: colors.textPrimary }]}>Scan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.mediaBtn, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}
                  onPress={() => router.push('/scanner?mode=picker')}
                  accessibilityLabel="Attach Document or PDF"
                >
                  <Ionicons name="attach-outline" size={18} color={colors.accent} />
                  <Text style={[styles.mediaBtnText, { color: colors.textPrimary }]}>Attach PDF</Text>
                </TouchableOpacity>
              </View>

              {/* Right Side: Voice Actions Group */}
              <View style={styles.voiceActionsGroup}>
                <VoiceProviderToggle
                  provider={voiceProvider}
                  onToggle={toggleVoiceProvider}
                  disabled={isListening || isTranscribing}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.micBtn,
                    {
                      backgroundColor: isListening ? '#DC2626' : isTranscribing ? colors.accent : colors.surfaceHighlight,
                      borderColor: isListening ? '#EF4444' : isTranscribing ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => toggleListening(currentLanguage)}
                  accessibilityLabel="Voice intake microphone"
                >
                  {isTranscribing ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Transcribing…</Text>
                    </>
                  ) : isListening ? (
                    <>
                      <View style={styles.recordingDot} />
                      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Stop</Text>
                    </>
                  ) : voiceState === 'requesting_permission' ? (
                    <>
                      <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 4 }} />
                      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>Allow mic</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="mic-outline" size={16} color={colors.accent} style={{ marginRight: 4 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>Speak</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Voice Listening Active Banner */}
          {isListening && (
            <View style={[styles.listeningNotice, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
              <ActivityIndicator size="small" color="#DC2626" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#991B1B', fontWeight: '700', fontSize: 13 }}>Listening…</Text>
                <Text style={{ color: '#B91C1C', fontSize: 11 }}>Speak your complaint clearly into the mic ({voiceProvider === 'gnani' ? 'Gnani.ai' : 'Gemini'}). Tap mic button to stop.</Text>
              </View>
              <TouchableOpacity onPress={cancelVoiceInput} style={{ padding: 4 }}>
                <Ionicons name="close-circle-outline" size={20} color="#991B1B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Voice Transcribing Banner */}
          {isTranscribing && (
            <View style={[styles.listeningNotice, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
              <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.listeningText, { color: colors.textPrimary, fontWeight: '600' }]}>
                Understanding your voice ({voiceProvider === 'gnani' ? 'Gnani.ai' : 'Gemini'})…
              </Text>
            </View>
          )}

          {/* Voice Error Banner */}
          {voiceError && (
            <View style={[styles.listeningNotice, { backgroundColor: colors.surfaceHighlight, borderColor: colors.borderSubtle }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 12 }}>{voiceError}</Text>
              {isGnaniError ? (
                <TouchableOpacity onPress={switchProviderToGemini} style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.accent, borderRadius: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Switch to Gemini</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={retryVoiceInput} style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.accent, borderRadius: 6 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Try again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {error && !voiceError && <Text style={styles.errorText}>{error}</Text>}


          {/* Structured Transformation / Backend Multi-Stage Processing Indicator */}
          {isProcessing ? (
            <View style={[styles.processingCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.processingTitle, { color: colors.textPrimary }]}>
                CONSTRUCTING STATUTORY CASE PATH
              </Text>
              
              {/* Stages List */}
              <View style={styles.stagesList}>
                {getStageList().map((stg, i) => (
                  <View key={stg.key} style={styles.stageItemRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.accent}
                      style={{ opacity: 0.9 }}
                    />
                    <Text style={[styles.stageItemText, { color: colors.textPrimary }]}>
                      {stg.label}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.processingStage, { color: colors.accent }]}>{processingStage}</Text>
            </View>
          ) : (
            <Button
              title="Generate Legal Case Path ➔"
              variant="primary"
              size="lg"
              style={styles.submitBtn}
              onPress={handleGenerate}
              disabled={!inputText.trim()}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    marginVertical: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroMeta: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  chipRow: {
    marginBottom: 14,
  },
  chipRowLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  inputToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  mediaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  mediaBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  voiceActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  listeningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  listeningText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 14,
  },
  processingCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 12,
  },
  stagesList: {
    marginTop: 12,
    marginBottom: 8,
    width: '100%',
    gap: 6,
  },
  stageItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageItemText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  processingStage: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  submitBtn: {
    marginTop: 4,
  },
});
