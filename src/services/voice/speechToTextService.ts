import {
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
  AudioModule,
  RecordingPresets,
  type AudioRecorder,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { apiCall } from '../../lib/apiClient';

const getPlatformOS = (): string => {
  try {
    const RN = require('react-native');
    if (RN?.Platform?.OS) return RN.Platform.OS;
  } catch (_) {}
  if (typeof window === 'undefined') return 'android';
  return 'web';
};

export type PermissionStatus = 'granted' | 'denied' | 'unavailable';

export interface STTResult {
  success: boolean;
  transcript: string;
  provider?: 'gemini' | 'gnani';
  language?: string;
  error?: string;
  permissionDenied?: boolean;
  isGnaniError?: boolean;
}

function sanitizeError(msg?: string): string {
  if (!msg) return '';
  if (msg.includes('<!DOCTYPE') || msg.includes('<html') || msg.includes('522')) {
    return 'Gnani.ai connection timed out (HTTP 522). Please try again or switch to Gemini.';
  }
  const clean = msg.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > 140 ? `${clean.slice(0, 140)}...` : clean;
}

class SpeechToTextService {
  private activeRecorder: AudioRecorder | null = null;
  private webRecognitionInstance: any = null;

  /**
   * Check and request microphone permissions cleanly.
   */
  async requestPermissions(): Promise<PermissionStatus> {
    if (getPlatformOS() === 'web') {
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          return 'granted';
        } catch (_) {
          return 'denied';
        }
      }
      return 'unavailable';
    }

    try {
      console.log('[VOICE] Checking microphone permissions...');
      const permissionRes = await getRecordingPermissionsAsync();
      console.log('[VOICE] permission status check:', permissionRes.status, 'granted:', permissionRes.granted);

      if (permissionRes.granted || permissionRes.status === 'granted') {
        return 'granted';
      }

      if (permissionRes.canAskAgain !== false) {
        console.log('[VOICE] Requesting microphone permissions...');
        const reqRes = await requestRecordingPermissionsAsync();
        console.log('[VOICE] permission status result:', reqRes.status, 'granted:', reqRes.granted);
        if (reqRes.granted || reqRes.status === 'granted') {
          return 'granted';
        }
        return 'denied';
      }

      return 'denied';
    } catch (err) {
      console.warn('[VOICE] Permission check error:', err);
      return 'unavailable';
    }
  }

  /**
   * Clean up any active recorder to prevent multi-instance audio conflicts.
   */
  private async cleanupRecorder(): Promise<void> {
    if (this.activeRecorder) {
      try {
        if (this.activeRecorder.isRecording) {
          console.log('[VOICE] Cleaning up previous active recording...');
          await this.activeRecorder.stop();
        }
      } catch (err) {
        console.warn('[VOICE] Error during recorder cleanup:', err);
      } finally {
        this.activeRecorder = null;
      }
    }
  }

  /**
   * Start recording.
   */
  async startListening(
    onInterimText?: (text: string) => void,
    onError?: (errMessage: string, isPermissionError?: boolean) => void
  ): Promise<boolean> {
    const perm = await this.requestPermissions();

    if (perm === 'denied') {
      console.log('[VOICE] Permission denied state detected');
      if (onError) onError('Microphone access is required to use voice input. Please enable microphone permission in app settings.', true);
      return false;
    }

    if (perm === 'unavailable') {
      console.log('[VOICE] Permission unavailable');
      if (onError) onError('Microphone is unavailable on this device environment.', false);
      return false;
    }

    // Ensure strictly one active recorder instance
    await this.cleanupRecorder();

    if (getPlatformOS() !== 'web') {
      try {
        console.log('[VOICE] Configuring Audio Mode for recording...');
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        console.log('[VOICE] Creating new AudioRecorder with HIGH_QUALITY preset...');
        const recorder = new (AudioModule as any).AudioRecorder(RecordingPresets.HIGH_QUALITY);
        await recorder.prepareToRecordAsync();
        recorder.record();
        this.activeRecorder = recorder;

        console.log('[VOICE] recording started successfully');
        return true;
      } catch (err: any) {
        console.error('[VOICE] Native audio recording creation failed:', err);
        await this.cleanupRecorder();
        if (onError) onError(`Failed to start recording: ${err.message || 'Unknown error'}`, false);
        return false;
      }
    }

    // Web Speech API fallback for browser environment
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = true;
          rec.lang = 'en-IN';

          rec.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript && onInterimText) {
              onInterimText(currentTranscript);
            }
          };

          rec.onerror = (evt: any) => {
            console.error('[VOICE] Web STT error:', evt.error);
            if (onError) onError("Couldn't process your voice. Try again.", false);
          };

          this.webRecognitionInstance = rec;
          rec.start();
          console.log('[VOICE] Web speech recognition started');
          return true;
        } catch (webErr) {
          console.error('[VOICE] Web recognition start failed:', webErr);
        }
      }
    }

    if (onError) {
      onError("Voice input is not supported on this device.", false);
    }
    return false;
  }

  /**
   * Stop recording, verify file existence, upload to backend transcription service.
   */
  async stopListening(
    provider: 'gemini' | 'gnani' = 'gemini',
    userLanguage: string = 'en'
  ): Promise<STTResult> {
    if (this.webRecognitionInstance) {
      try {
        this.webRecognitionInstance.stop();
      } catch (_) {}
      this.webRecognitionInstance = null;
    }

    if (!this.activeRecorder) {
      console.warn('[VOICE] stopListening called with no active recorder');
      return { success: false, transcript: '', provider, error: 'No active recording found.' };
    }

    const recorder = this.activeRecorder;
    this.activeRecorder = null;

    try {
      console.log('[VOICE] Stopping active recording...');
      await recorder.stop();

      const uri = recorder.uri;
      console.log('[VOICE] recording stopped. audio URI:', uri);

      if (!uri) {
        return { success: false, transcript: '', provider, error: 'Recording produced no audio file.' };
      }

      // Verify file existence
      if (FileSystem.getInfoAsync) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log('[VOICE] file verification info:', fileInfo);
        if (!fileInfo.exists) {
          return { success: false, transcript: '', provider, error: 'Audio file could not be found on storage.' };
        }
      }

      console.log('[VOICE] Reading audio file into base64...');
      let base64Audio = '';
      if (FileSystem.readAsStringAsync) {
        base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType?.Base64 || 'base64',
        });
      }

      if (!base64Audio) {
        return { success: false, transcript: '', provider, error: 'Could not read audio file data.' };
      }

      console.log(`[VOICE] upload started (provider: ${provider}, lang: ${userLanguage}), calling transcription API...`);
      const apiRes = await apiCall<{
        success: boolean;
        transcript?: string;
        provider?: 'gemini' | 'gnani';
        language?: string;
        error?: string;
      }>('/api/ai/transcribe-audio', {
        audioBase64: base64Audio,
        mimeType: 'audio/m4a',
        provider,
        userLanguage,
      });

      console.log('[VOICE] transcription response:', apiRes);

      if (apiRes.success && apiRes.transcript) {
        console.log('[VOICE] transcription result:', apiRes.transcript, 'provider:', apiRes.provider);
        return {
          success: true,
          transcript: apiRes.transcript.trim(),
          provider: apiRes.provider || provider,
          language: apiRes.language || userLanguage,
        };
      } else {
        const rawErr = apiRes.error || (provider === 'gnani' ? 'Voice transcription with Gnani.ai failed.' : "Couldn't process your voice. Try again.");
        const errorMsg = sanitizeError(rawErr);
        return {
          success: false,
          transcript: '',
          provider,
          error: errorMsg,
          isGnaniError: provider === 'gnani',
        };
      }
    } catch (err: any) {
      console.error('[VOICE] Transcribe audio error:', err);
      const rawErr = provider === 'gnani'
        ? `Voice transcription with Gnani.ai failed. ${err.message || 'Try again or switch to Gemini.'}`
        : err.message || "Couldn't process your voice. Try again.";
      const errorMsg = sanitizeError(rawErr);
      return {
        success: false,
        transcript: '',
        provider,
        error: errorMsg,
        isGnaniError: provider === 'gnani',
      };
    } finally {
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch (_) {}
    }
  }

  /**
   * Cancel active recording without transcribing.
   */
  async cancelListening(): Promise<void> {
    console.log('[VOICE] Cancelling voice recording...');
    if (this.webRecognitionInstance) {
      try {
        this.webRecognitionInstance.abort();
      } catch (_) {}
      this.webRecognitionInstance = null;
    }

    await this.cleanupRecorder();

    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch (_) {}
  }
}

export const speechToTextService = new SpeechToTextService();
