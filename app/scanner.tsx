import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../src/theme';
import { useDocumentScanner } from '../src/hooks/useDocumentScanner';
import { caseRepository } from '../src/services/storage/localCaseRepository';
import { addDocumentToCase } from '../src/domain/cases/caseManager';
import { Header } from '../src/components/common/Header';
import { CameraViewFinder } from '../src/components/scanner/CameraViewFinder';
import { DocumentPreviewCard } from '../src/components/scanner/DocumentPreviewCard';

export default function ScannerScreen() {
  const router = useRouter();
  const { caseId, mode } = useLocalSearchParams<{ caseId?: string; mode?: 'camera' | 'picker' | 'gallery' }>();
  const {
    scannedDoc,
    analysis,
    isScanning,
    error,
    launchCamera,
    launchGallery,
    pickDocument,
    clearScan,
  } = useDocumentScanner();

  useEffect(() => {
    if (mode === 'picker') {
      pickDocument();
    } else if (mode === 'gallery') {
      launchGallery();
    } else if (mode === 'camera') {
      launchCamera();
    }
  }, [mode]);

  const handleConfirm = async () => {
    if (!scannedDoc) return;
    const targetCaseId = caseId || 'case-landlord-101';
    const targetCase = await caseRepository.getCaseById(targetCaseId);

    if (targetCase) {
      const updated = addDocumentToCase(targetCase, {
        id: scannedDoc.id,
        fileName: scannedDoc.fileName,
        fileUri: scannedDoc.uri,
        mimeType: scannedDoc.mimeType,
        scannedAt: scannedDoc.scannedAt,
        documentCategory: analysis?.documentType || 'Lease Deed',
        extractedSummary: analysis?.summary || 'Scanned evidence document.',
      });
      await caseRepository.saveCase(updated);
      Alert.alert('Document Attached', 'Document has been attached to your case evidence checklist.', [
        {
          text: 'View Action Plan',
          onPress: () => router.replace(`/case/${targetCaseId}`),
        },
      ]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Document Scanner & Evidence" showBack={true} />
      <View style={styles.container}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {scannedDoc ? (
          <View style={styles.previewContainer}>
            <DocumentPreviewCard
              document={scannedDoc}
              analysis={analysis}
              onConfirm={handleConfirm}
              onRetake={clearScan}
            />
          </View>
        ) : (
          <CameraViewFinder
            onCapture={launchCamera}
            onPickDocument={pickDocument}
            onPickGallery={launchGallery}
            isScanning={isScanning}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  previewContainer: {
    padding: theme.spacing.md,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: theme.typography.sizes.xs,
    textAlign: 'center',
  },
});
