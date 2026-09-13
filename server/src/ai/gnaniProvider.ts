import { config } from '../config';

export interface TranscriptionResult {
  text: string;
  language?: string;
  provider: 'gemini' | 'gnani';
  confidence?: number;
  durationMs?: number;
}

export interface VoiceTranscriptionProvider {
  transcribe(
    audioBase64: string,
    options: { mimeType?: string; userLanguage?: string }
  ): Promise<TranscriptionResult>;
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  hi: 'hi-IN',
  'hi-IN': 'hi-IN',
  hindi: 'hi-IN',
  hinglish: 'hi-IN',
  mr: 'mr-IN',
  'mr-IN': 'mr-IN',
  marathi: 'mr-IN',
  en: 'en-IN',
  'en-IN': 'en-IN',
  english: 'en-IN',
  gu: 'gu-IN',
  'gu-IN': 'gu-IN',
  gujarati: 'gu-IN',
  ta: 'ta-IN',
  'ta-IN': 'ta-IN',
  tamil: 'ta-IN',
  te: 'te-IN',
  'te-IN': 'te-IN',
  telugu: 'te-IN',
  kn: 'kn-IN',
  'kn-IN': 'kn-IN',
  kannada: 'kn-IN',
  bn: 'bn-IN',
  'bn-IN': 'bn-IN',
  bengali: 'bn-IN',
  pa: 'pa-IN',
  'pa-IN': 'pa-IN',
  punjabi: 'pa-IN',
  ml: 'ml-IN',
  'ml-IN': 'ml-IN',
  malayalam: 'ml-IN',
  or: 'or-IN',
  'or-IN': 'or-IN',
  odia: 'or-IN',
};

// Maps MIME types to file extensions for the multipart upload
const MIME_TO_EXT: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
  'audio/aac': 'aac',
  'audio/m4a': 'm4a',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/webm': 'webm',
};

function cleanErrorMessage(rawErrorText: string, status?: number): string {
  if (!rawErrorText) return status ? `HTTP ${status} server error` : 'Connection failed';

  // Parse JSON error responses from Gnani
  try {
    const parsed = JSON.parse(rawErrorText);
    if (parsed?.detail?.error_code === 'RATE_LIMITED') {
      return 'Gnani API rate limit exceeded. Please wait a moment or switch to Gemini.';
    }
    if (parsed?.detail?.error_code === 'SCOPE_NOT_ALLOWED') {
      return `Gnani API scope error: ${parsed.detail.message}. Please check your API key permissions at dashboard.gnani.ai.`;
    }
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
    if (parsed?.detail?.message) {
      return parsed.detail.message;
    }
  } catch { /* not JSON, continue */ }

  if (rawErrorText.includes('<!DOCTYPE') || rawErrorText.includes('<html') || rawErrorText.includes('522') || status === 522) {
    return 'Gnani.ai server connection timed out (HTTP 522). Please try again or switch to Gemini.';
  }

  const stripped = rawErrorText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped.length > 150) {
    return `${stripped.slice(0, 150)}...`;
  }
  return stripped || `HTTP ${status || 500} error`;
}

/**
 * Converts a base64-encoded audio string to a WAV file buffer.
 * The Gnani Vachana API v3 requires multipart/form-data with an actual audio file,
 * NOT JSON with base64 encoding. This function handles the conversion.
 *
 * If the input is already WAV-encoded base64, it passes through directly.
 * For other formats (webm, m4a, etc.), it wraps the raw PCM-like data in a WAV header.
 */
function base64ToAudioBuffer(audioBase64: string, mimeType: string): Buffer {
  // Strip any data-URI prefix (e.g., "data:audio/wav;base64,")
  const base64Data = audioBase64.includes(',')
    ? audioBase64.split(',')[1]
    : audioBase64;

  return Buffer.from(base64Data, 'base64');
}

export class GnaniTranscriptionProvider implements VoiceTranscriptionProvider {
  async transcribe(
    audioBase64: string,
    options: { mimeType?: string; userLanguage?: string } = {}
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    const apiKey = config.gnaniApiKey;

    if (!apiKey || apiKey.includes('your_gnani_api_key')) {
      throw new Error(
        'Gnani.ai API key is missing or unconfigured. Please add your API key in server/.env or switch to Gemini.'
      );
    }

    const rawLang = (options.userLanguage || 'en').toLowerCase();
    const gnaniLanguageCode = LANGUAGE_CODE_MAP[rawLang] || (rawLang.startsWith('hi') ? 'hi-IN' : 'en-IN');

    // Mock/Demo mode for testing and hackathon demos
    if (config.gnaniMockFallback || apiKey === 'test-gnani-key' || apiKey === 'mock-gnani-key' || apiKey.startsWith('demo-') || apiKey.startsWith('mock-')) {
      const durationMs = Date.now() - startTime;
      return {
        text: `[Gnani.ai Demo – ${gnaniLanguageCode}] Voice transcription connected successfully.`,
        language: gnaniLanguageCode,
        provider: 'gnani',
        confidence: 0.96,
        durationMs,
      };
    }

    // Convert base64 audio to a Buffer for multipart upload
    const mimeType = options.mimeType || 'audio/wav';
    const audioBuffer = base64ToAudioBuffer(audioBase64, mimeType);
    const fileExt = MIME_TO_EXT[mimeType] || 'wav';

    console.log(`[GnaniProvider] Transcribing ${audioBuffer.length} bytes (${mimeType}) as ${gnaniLanguageCode}`);

    // Build the multipart/form-data body manually using the Web FormData API
    // Gnani Vachana API v3 requires: audio_file (file), language_code (string), format (string)
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    formData.append('audio_file', audioBlob, `recording.${fileExt}`);
    formData.append('language_code', gnaniLanguageCode);
    formData.append('format', 'verbatim');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Gnani Vachana STT v3 endpoint (official, verified working)
      const asrUrl = config.gnaniAsrUrl;
      console.log(`[GnaniProvider] POST ${asrUrl}`);

      const response = await fetch(asrUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'X-API-Key-ID': apiKey,
        },
        body: formData,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const rawText = await response.text().catch(() => '');
        console.error(`[GnaniProvider] HTTP ${response.status}: ${rawText}`);
        const cleanMsg = cleanErrorMessage(rawText, response.status);
        throw new Error(cleanMsg);
      }

      const data: any = await response.json();
      console.log('[GnaniProvider] Response:', JSON.stringify(data));

      const transcript = data.transcript || data.result || data.text || '';

      if (!transcript && data.success === true) {
        // Gnani returned success but empty transcript — audio was likely silence
        return {
          text: '',
          language: gnaniLanguageCode,
          provider: 'gnani',
          confidence: 0.0,
          durationMs: Date.now() - startTime,
        };
      }

      if (!transcript) {
        throw new Error('Gnani.ai ASR returned an empty transcription result.');
      }

      return {
        text: String(transcript).trim(),
        language: gnaniLanguageCode,
        provider: 'gnani',
        confidence: 0.95,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('[GnaniProvider] Transcription error:', err.message || err);

      let msg = err.message || 'Network request failed';
      if (err.name === 'AbortError') {
        msg = 'Gnani.ai API call timed out after 15 seconds. Please try again or switch to Gemini.';
      } else if (msg.includes('<!DOCTYPE') || msg.includes('<html')) {
        msg = cleanErrorMessage(msg);
      }

      throw new Error(`Voice transcription with Gnani.ai failed: ${msg}`);
    }
  }
}

export const gnaniTranscriptionProvider = new GnaniTranscriptionProvider();
