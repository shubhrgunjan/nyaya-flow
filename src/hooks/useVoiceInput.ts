import { useState, useCallback, useRef, useEffect } from 'react';
import { speechToTextService } from '../services/voice/speechToTextService';

export type VoiceInputState =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'recording'
  | 'stopping'
  | 'transcribing'
  | 'error';

export type VoiceProvider = 'gemini' | 'gnani';

export interface UseVoiceInputReturn {
  voiceState: VoiceInputState;
  voiceError: string | null;
  voiceProvider: VoiceProvider;
  isGnaniActive: boolean;
  isGnaniError: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isPermissionDenied: boolean;
  setVoiceProvider: (provider: VoiceProvider) => void;
  toggleVoiceProvider: () => void;
  switchProviderToGemini: () => void;
  startRecording: (userLanguage?: string) => Promise<boolean>;
  stopRecording: (userLanguage?: string) => Promise<string | null>;
  toggleRecording: (userLanguage?: string) => Promise<void>;
  cancelRecording: () => Promise<void>;
  retryVoiceInput: () => void;
}

export function useVoiceInput(onTranscriptReady?: (transcript: string) => void): UseVoiceInputReturn {
  const [voiceState, setVoiceState] = useState<VoiceInputState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceProvider, setVoiceProviderState] = useState<VoiceProvider>('gemini');
  const [isGnaniError, setIsGnaniError] = useState<boolean>(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      speechToTextService.cancelListening();
    };
  }, []);

  const isRecording = voiceState === 'recording';
  const isTranscribing = voiceState === 'transcribing' || voiceState === 'stopping';
  const isPermissionDenied = voiceState === 'permission_denied';
  const isGnaniActive = voiceProvider === 'gnani';

  const activeLanguageRef = useRef<string>('en');

  const setVoiceProvider = useCallback((provider: VoiceProvider) => {
    setVoiceProviderState(provider);
    setIsGnaniError(false);
    setVoiceError(null);
  }, []);

  const toggleVoiceProvider = useCallback(() => {
    setVoiceProviderState((prev) => (prev === 'gemini' ? 'gnani' : 'gemini'));
    setIsGnaniError(false);
    setVoiceError(null);
  }, []);

  const switchProviderToGemini = useCallback(() => {
    setVoiceProviderState('gemini');
    setIsGnaniError(false);
    setVoiceError(null);
    setVoiceState('idle');
  }, []);

  const startRecording = useCallback(async (userLanguage?: string): Promise<boolean> => {
    if (userLanguage) {
      activeLanguageRef.current = userLanguage;
    }
    setVoiceError(null);
    setIsGnaniError(false);
    setVoiceState('requesting_permission');

    const started = await speechToTextService.startListening(
      undefined,
      (errMessage, isPermissionError) => {
        if (!isMountedRef.current) return;
        if (isPermissionError) {
          setVoiceState('permission_denied');
          setVoiceError(errMessage || 'Microphone access is required to use voice input.');
        } else {
          setVoiceState('error');
          setVoiceError(errMessage || "Couldn't process your voice. Try again.");
        }
      }
    );

    if (started) {
      if (isMountedRef.current) {
        setVoiceState('recording');
      }
      return true;
    }

    return false;
  }, []);

  const stopRecording = useCallback(
    async (userLanguage?: string): Promise<string | null> => {
      if (voiceState !== 'recording') return null;

      const targetLang = userLanguage || activeLanguageRef.current || 'en';

      setVoiceState('stopping');
      setVoiceState('transcribing');

      const result = await speechToTextService.stopListening(voiceProvider, targetLang);

      if (!isMountedRef.current) return null;

      if (result.success && result.transcript) {
        setVoiceState('idle');
        setVoiceError(null);
        setIsGnaniError(false);
        if (onTranscriptReady) {
          onTranscriptReady(result.transcript);
        }
        return result.transcript;
      } else {
        if (result.permissionDenied) {
          setVoiceState('permission_denied');
        } else {
          setVoiceState('error');
          if (result.isGnaniError) {
            setIsGnaniError(true);
          }
        }
        setVoiceError(result.error || "Couldn't process your voice. Try again.");
        return null;
      }
    },
    [voiceState, voiceProvider, onTranscriptReady]
  );

  const toggleRecording = useCallback(
    async (userLanguage?: string) => {
      if (userLanguage) {
        activeLanguageRef.current = userLanguage;
      }
      if (voiceState === 'recording') {
        await stopRecording(userLanguage || activeLanguageRef.current);
      } else if (voiceState === 'idle' || voiceState === 'error' || voiceState === 'permission_denied') {
        await startRecording(userLanguage || activeLanguageRef.current);
      }
    },
    [voiceState, startRecording, stopRecording]
  );

  const cancelRecording = useCallback(async () => {
    await speechToTextService.cancelListening();
    if (isMountedRef.current) {
      setVoiceState('idle');
      setVoiceError(null);
      setIsGnaniError(false);
    }
  }, []);

  const retryVoiceInput = useCallback(() => {
    setVoiceState('idle');
    setVoiceError(null);
    setIsGnaniError(false);
    startRecording();
  }, [startRecording]);

  return {
    voiceState,
    voiceError,
    voiceProvider,
    isGnaniActive,
    isGnaniError,
    isRecording,
    isTranscribing,
    isPermissionDenied,
    setVoiceProvider,
    toggleVoiceProvider,
    switchProviderToGemini,
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
    retryVoiceInput,
  };
}
