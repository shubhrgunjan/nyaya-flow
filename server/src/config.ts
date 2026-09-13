import dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('[Config] GNANI_ASR_URL loaded:', process.env.GNANI_ASR_URL || '(default: stt/v3)');

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'nyaya-flow-india',
  gnaniApiKey: process.env.GNANI_API_KEY || process.env.GNANI_TOKEN || '',
  gnaniAccessKey: process.env.GNANI_ACCESS_KEY || '',
  gnaniAsrUrl: process.env.GNANI_ASR_URL || 'https://api.vachana.ai/stt/v3',
  gnaniMockFallback: process.env.GNANI_MOCK_FALLBACK === 'true' || (process.env.GNANI_API_KEY || '').includes('mock'),
};
