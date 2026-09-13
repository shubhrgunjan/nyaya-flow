import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let activeApiBaseUrl: string | null = null;

function getExpoHostUri(): string | null {
  try {
    const Constants = require('expo-constants')?.default || require('expo-constants');
    return Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost || null;
  } catch (e) {
    return null;
  }
}

export function getApiBaseUrl(): string {
  if (activeApiBaseUrl) return activeApiBaseUrl;

  // 1. Dynamic Metro host IP from Expo Constants (e.g. 10.42.88.150:8081 -> http://10.42.88.150:3001)
  try {
    const hostUri = getExpoHostUri();
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:3001`;
      }
    }
  } catch (e) {}

  // 2. EXPO_PUBLIC_API_URL env variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 3. Fallback
  return 'http://localhost:3001';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Get the Firebase ID token for authenticated API calls.
 * Falls back to empty string if no user is signed in.
 */
async function getAuthToken(): Promise<string> {
  try {
    const apps = getApps();
    if (apps.length === 0) return '';
    const auth = getAuth(apps[0]);
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
  } catch (e) {
    console.warn('[apiClient] Could not get auth token:', e);
  }
  return '';
}

/**
 * Make an authenticated API call to the Nyaya Flow backend.
 */
export async function apiCall<T = any>(
  endpoint: string,
  body: Record<string, any>,
  options: { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 60000 } = options;
  const token = await getAuthToken();
  const baseUrl = activeApiBaseUrl || getApiBaseUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if the backend server is reachable by probing potential IP candidates.
 */
export async function checkServerHealth(): Promise<{
  ok: boolean;
  geminiConfigured: boolean;
  youtubeConfigured: boolean;
}> {
  const candidateUrls: string[] = [];

  // 1. Dynamic Metro host IP
  try {
    const hostUri = getExpoHostUri();
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        candidateUrls.push(`http://${hostIp}:3001`);
      }
    }
  } catch (e) {}

  // 2. Environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidateUrls.push(process.env.EXPO_PUBLIC_API_URL);
  }

  // 3. Web window origin / hostname candidate
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      candidateUrls.push(`http://${host}:3001`);
      candidateUrls.push(`https://${host}:3001`);
    }
  }

  // 4. Localhost & Android emulator fallbacks
  candidateUrls.push('http://localhost:3001');
  candidateUrls.push('http://127.0.0.1:3001');
  candidateUrls.push('http://10.0.2.2:3001');

  const uniqueCandidates = Array.from(new Set(candidateUrls));

  for (const baseUrl of uniqueCandidates) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const data = await response.json();
        activeApiBaseUrl = baseUrl; // Cache the active working backend URL
        return {
          ok: true,
          geminiConfigured: data.geminiConfigured || false,
          youtubeConfigured: data.youtubeConfigured || false,
        };
      }
    } catch (_) {
      // Continue to next candidate
    }
  }

  return { ok: false, geminiConfigured: false, youtubeConfigured: false };
}

