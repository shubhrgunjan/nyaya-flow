import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { documentService } from '../services/document/documentService';
import { ScannedDocument, DocumentAnalysisResult } from '../types/document';
import { apiCall } from '../lib/apiClient';

export function useDocumentScanner() {
  const [scannedDoc, setScannedDoc] = useState<ScannedDocument | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFileSelection = async (
    uri: string,
    fileName: string,
    mimeType: string = 'image/jpeg',
    base64Data?: string,
    sizeBytes?: number
  ) => {
    try {
      setIsScanning(true);
      setError(null);

      const doc = await documentService.scanDocument(uri, fileName);
      if (sizeBytes) doc.sizeBytes = sizeBytes;
      doc.mimeType = mimeType;
      setScannedDoc(doc);

      // Attempt backend AI document analysis if base64 is available
      let result: DocumentAnalysisResult;
      if (base64Data) {
        try {
          const apiRes = await apiCall<{
            success: boolean;
            documentAnalysis: any;
          }>('/api/ai/analyze-document', {
            imageBase64: base64Data,
            mimeType,
            contextDescription: `User uploaded document: ${fileName}`,
          });

          if (apiRes.success && apiRes.documentAnalysis) {
            const da = apiRes.documentAnalysis;
            result = {
              id: doc.id,
              documentType: da.documentType || 'Scanned Evidence',
              summary: da.summary || 'Uploaded evidence document.',
              legalRelevance: da.summary || 'Extracted evidence document for legal verification.',
              confidenceScore: 0.95,
              extractedEntities: da.facts || da.extractedEntities || {},
              amounts: da.amounts || [],
              keyDates: da.deadlines || [],
              importantClauses: da.suggestedActions || [],
              riskFlags: da.riskFlags || [],
            };
          } else {
            result = await documentService.extractDocumentSummary(doc);
          }
        } catch (_) {
          result = await documentService.extractDocumentSummary(doc);
        }
      } else {
        result = await documentService.extractDocumentSummary(doc);
      }

      setAnalysis(result);
      return { doc, result };
    } catch (err: any) {
      console.error('[useDocumentScanner] Error processing file:', err);
      setError(err?.message || 'Failed to scan document');
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const launchCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to scan legal documents.');
          return null;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `camera_scan_${Date.now()}.jpg`;
        return await processFileSelection(
          asset.uri,
          fileName,
          asset.mimeType || 'image/jpeg',
          asset.base64 || undefined,
          asset.fileSize
        );
      }
    } catch (err: any) {
      console.error('[useDocumentScanner] Camera launch error:', err);
      setError('Could not open camera on this device.');
    }
    return null;
  };

  const launchGallery = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library permission is required to select document images.');
          return null;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `document_image_${Date.now()}.jpg`;
        return await processFileSelection(
          asset.uri,
          fileName,
          asset.mimeType || 'image/jpeg',
          asset.base64 || undefined,
          asset.fileSize
        );
      }
    } catch (err: any) {
      console.error('[useDocumentScanner] Gallery launch error:', err);
      setError('Could not open photo gallery.');
    }
    return null;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.name || `document_${Date.now()}`;
        return await processFileSelection(
          asset.uri,
          fileName,
          asset.mimeType || 'application/pdf',
          undefined,
          asset.size
        );
      }
    } catch (err: any) {
      console.error('[useDocumentScanner] DocumentPicker error:', err);
      setError('Could not open document picker.');
    }
    return null;
  };

  const captureDocument = async (uri?: string) => {
    if (uri) {
      return await processFileSelection(uri, 'Scanned_Document.jpg');
    }
    return await launchCamera();
  };

  const clearScan = () => {
    setScannedDoc(null);
    setAnalysis(null);
    setError(null);
  };

  return {
    scannedDoc,
    analysis,
    isScanning,
    error,
    captureDocument,
    launchCamera,
    launchGallery,
    pickDocument,
    clearScan,
  };
}
