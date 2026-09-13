import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface CameraViewFinderProps {
  onCapture: () => void;
  onPickDocument?: () => void;
  onPickGallery?: () => void;
  isScanning: boolean;
}

export const CameraViewFinder: React.FC<CameraViewFinderProps> = ({
  onCapture,
  onPickDocument,
  onPickGallery,
  isScanning,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.viewfinderFrame}>
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {isScanning ? (
          <View style={styles.scanningState}>
            <ActivityIndicator size="large" color={theme.colors.brandPrimary} />
            <Text style={styles.scanningText}>Scanning & Extracting Legal Facts with AI...</Text>
          </View>
        ) : (
          <>
            <Ionicons name="document-text-outline" size={56} color={theme.colors.brandPrimary} />
            <Text style={styles.instructions}>Align legal document / notice within frame</Text>
            <Text style={styles.subInstructions}>Supports Rental Agreements, Legal Notices, Bills & Police Complaints</Text>
          </>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.actionsLabel}>Choose how to add document:</Text>
        <View style={styles.controlsRow}>
          {/* Gallery Button */}
          {onPickGallery && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.auxBtn}
              onPress={onPickGallery}
              disabled={isScanning}
            >
              <Ionicons name="images-outline" size={24} color={theme.colors.brandPrimary} />
              <Text style={styles.auxBtnText}>Gallery</Text>
            </TouchableOpacity>
          )}

          {/* Shutter / Camera Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.shutterBtn, isScanning && styles.disabledBtn]}
            onPress={onCapture}
            disabled={isScanning}
          >
            <Ionicons name="camera" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Document Picker Button */}
          {onPickDocument && (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.auxBtn}
              onPress={onPickDocument}
              disabled={isScanning}
            >
              <Ionicons name="folder-open-outline" size={24} color={theme.colors.brandPrimary} />
              <Text style={styles.auxBtnText}>File / PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050608',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  viewfinderFrame: {
    width: '88%',
    height: '65%',
    borderColor: theme.colors.brandPrimary,
    borderWidth: 2,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(21, 24, 32, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    position: 'relative',
  },
  scanningState: {
    alignItems: 'center',
  },
  scanningText: {
    color: theme.colors.brandPrimary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.colors.brandPrimary,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  subInstructions: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.sizes.xs,
    textAlign: 'center',
    marginTop: 6,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  actionsLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginBottom: theme.spacing.sm,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  shutterBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  auxBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    minWidth: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  auxBtnText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
