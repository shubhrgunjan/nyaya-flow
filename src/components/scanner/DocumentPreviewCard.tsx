import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { ScannedDocument, DocumentAnalysisResult } from '../../types/document';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface DocumentPreviewCardProps {
  document: ScannedDocument;
  analysis?: DocumentAnalysisResult | null;
  onConfirm: () => void;
  onRetake: () => void;
}

export const DocumentPreviewCard: React.FC<DocumentPreviewCardProps> = ({
  document,
  analysis,
  onConfirm,
  onRetake,
}) => {
  return (
    <Card elevated={true} style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="document-attach" size={24} color={theme.colors.brandPrimary} />
        <View style={styles.titleCol}>
          <Text style={styles.fileName}>{document.fileName}</Text>
          <Text style={styles.metaText}>Scanned on {new Date(document.scannedAt).toLocaleTimeString()}</Text>
        </View>
      </View>

      {analysis ? (
        <View style={styles.analysisBox}>
          <Text style={styles.analysisTitle}>Document Intelligence Summary:</Text>
          <Text style={styles.docType}>Type: {analysis.documentType}</Text>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </View>
      ) : null}

      <View style={styles.btnRow}>
        <Button title="Retake" variant="secondary" size="sm" onPress={onRetake} style={styles.btn} />
        <Button title="Confirm & Attach to Case" variant="primary" size="sm" onPress={onConfirm} style={styles.btn} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  titleCol: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  fileName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  metaText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  analysisBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  analysisTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.brandPrimary,
    marginBottom: 2,
  },
  docType: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  summaryText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: theme.typography.lineHeights.xs,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 0.48,
  },
});
