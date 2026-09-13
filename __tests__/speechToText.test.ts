import { speechToTextService } from '../src/services/voice/speechToTextService';
import * as apiClient from '../src/lib/apiClient';

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
  getRecordingPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: {
    AudioRecorder: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
      record: jest.fn(),
      stop: jest.fn().mockResolvedValue(undefined),
      isRecording: true,
      uri: 'file:///tmp/test-recording.m4a',
    })),
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  readAsStringAsync: jest.fn().mockResolvedValue('mockBase64Data'),
  EncodingType: { Base64: 'base64' },
}));

describe('SpeechToTextService & Backend Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request permissions gracefully and return granted / denied status', async () => {
    const status = await speechToTextService.requestPermissions();
    expect(['granted', 'denied', 'unavailable']).toContain(status);
  });

  it('should start listening and process base64 audio response via apiClient', async () => {
    jest.spyOn(apiClient, 'apiCall').mockResolvedValue({
      success: true,
      transcript: 'My landlord refuses to return my security deposit of ₹50,000.',
      provider: 'gemini',
    });

    const started = await speechToTextService.startListening();
    expect(started).toBe(true);

    const result = await speechToTextService.stopListening();
    expect(result.success).toBe(true);
    expect(result.transcript).toBe('My landlord refuses to return my security deposit of ₹50,000.');
    expect(result.provider).toBe('gemini');
  });

  it('should support optional Gnani.ai voice provider with user language', async () => {
    jest.spyOn(apiClient, 'apiCall').mockImplementation(async (path, body: any) => {
      expect(body.provider).toBe('gnani');
      expect(body.userLanguage).toBe('hi');
      return {
        success: true,
        transcript: 'मेरा मकान मालिक मेरी ₹50,000 की सुरक्षा जमा राशि वापस नहीं कर रहा है।',
        provider: 'gnani',
        language: 'hi-IN',
      };
    });

    const started = await speechToTextService.startListening();
    expect(started).toBe(true);

    const result = await speechToTextService.stopListening('gnani', 'hi');
    expect(result.success).toBe(true);
    expect(result.provider).toBe('gnani');
    expect(result.transcript).toContain('सुरक्षा जमा राशि');
  });

  it('should handle Gnani API failure without silent fallback and set isGnaniError flag', async () => {
    jest.spyOn(apiClient, 'apiCall').mockResolvedValue({
      success: false,
      error: 'Voice transcription with Gnani.ai failed. Try again or switch to Gemini.',
      provider: 'gnani',
    });

    await speechToTextService.startListening();
    const result = await speechToTextService.stopListening('gnani', 'mr');

    expect(result.success).toBe(false);
    expect(result.provider).toBe('gnani');
    expect(result.isGnaniError).toBe(true);
    expect(result.error).toContain('Voice transcription with Gnani.ai failed');
  });
});
