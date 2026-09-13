import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getFirebaseConfig, isFirebaseConfigured } from '../../lib/firebase/config';
import { LanguageCode } from '../../types/i18n';

export interface UserProfile {
  userId: string;
  phoneNumber: string;
  displayName: string;
  preferredLanguage: LanguageCode;
  state: string;
  district: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const PROFILE_KEY = '@nyaya_user_profile_v1';

export class UserProfileRepository {
  private db: any = null;

  constructor() {
    if (isFirebaseConfigured()) {
      try {
        const apps = getApps();
        const app = apps.length === 0 ? initializeApp(getFirebaseConfig()) : apps[0];
        this.db = getFirestore(app);
      } catch (e) {
        console.warn('[UserProfileRepository] Firestore init warning:', e);
      }
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (raw) {
        return JSON.parse(raw) as UserProfile;
      }
    } catch (e) {
      console.warn('[UserProfileRepository] Error reading local profile:', e);
    }
    return null;
  }

  async saveProfile(profile: Partial<UserProfile> & { userId: string }): Promise<UserProfile> {
    const existing = await this.getProfile();
    const updated: UserProfile = {
      userId: profile.userId,
      phoneNumber: profile.phoneNumber || existing?.phoneNumber || '',
      displayName: profile.displayName || existing?.displayName || '',
      preferredLanguage: profile.preferredLanguage || existing?.preferredLanguage || 'en',
      state: profile.state || existing?.state || '',
      district: profile.district || existing?.district || '',
      onboardingCompleted: profile.onboardingCompleted ?? existing?.onboardingCompleted ?? false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save locally
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));

    // Non-blocking background sync to Firestore
    if (this.db && updated.userId) {
      const userRef = doc(this.db, 'users', updated.userId);
      setDoc(userRef, updated, { merge: true }).catch((err) => {
        console.log('[UserProfileRepository] Firestore sync background notice:', err?.message || err);
      });
    }

    return updated;
  }

  async clearProfile(): Promise<void> {
    await AsyncStorage.removeItem(PROFILE_KEY);
  }
}

export const userProfileRepository = new UserProfileRepository();

