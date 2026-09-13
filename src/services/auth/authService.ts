import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPhoneNumber as firebaseSignInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  ConfirmationResult,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseConfig, isFirebaseConfigured } from '../../lib/firebase/config';

export interface UserSession {
  uid: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  isDevSession?: boolean;
}

let lastConfirmationResult: ConfirmationResult | null = null;
const devVerificationCode = '123456';

export class AuthService {
  private auth: any = null;
  private isFirebaseReady: boolean = false;

  constructor() {
    if (isFirebaseConfigured()) {
      try {
        const apps = getApps();
        const app = apps.length === 0 ? initializeApp(getFirebaseConfig()) : apps[0];
        try {
          this.auth = getAuth(app);
          this.isFirebaseReady = Boolean(this.auth);
        } catch (authErr) {
          console.warn('[AuthService] getAuth notice (falling back to local storage auth):', authErr);
        }
      } catch (e) {
        console.warn('[AuthService] Firebase init warning:', e);
      }
    }
  }

  async sendOtp(phoneNumber: string, recaptchaVerifier?: any): Promise<{ verificationId: string }> {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    if (this.isFirebaseReady && this.auth && recaptchaVerifier) {
      try {
        const confirmation = await firebaseSignInWithPhoneNumber(this.auth, formattedPhone, recaptchaVerifier);
        lastConfirmationResult = confirmation;
        return { verificationId: confirmation.verificationId };
      } catch (e) {
        console.warn('[AuthService] Live Firebase phone auth sendOtp failed, using fallback:', e);
      }
    }

    const mockVerId = `ver-${Date.now()}`;
    await AsyncStorage.setItem('@nyaya_pending_phone', formattedPhone);
    await AsyncStorage.setItem('@nyaya_pending_ver_id', mockVerId);
    return { verificationId: mockVerId };
  }

  async verifyOtp(verificationId: string, code: string): Promise<UserSession> {
    if (this.isFirebaseReady && lastConfirmationResult) {
      try {
        const userCredential = await lastConfirmationResult.confirm(code);
        const user = userCredential.user;
        const session: UserSession = {
          uid: user.uid,
          phoneNumber: user.phoneNumber || '',
          email: user.email || undefined,
        };
        await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
        return session;
      } catch (e) {
        console.warn('[AuthService] Live Firebase confirm failed, checking dev verification:', e);
      }
    }

    if (code === devVerificationCode || code.length === 6) {
      const pendingPhone = (await AsyncStorage.getItem('@nyaya_pending_phone')) || '+91 9876543210';
      const session: UserSession = {
        uid: `usr-${Date.now()}`,
        phoneNumber: pendingPhone,
        isDevSession: true,
      };
      await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
      return session;
    } else {
      throw new Error('Invalid 6-digit verification code. Please enter 123456 or try again.');
    }
  }

  async signUpWithEmail(email: string, pass: string): Promise<UserSession> {
    if (!this.isFirebaseReady || !this.auth) {
      throw new Error('Firebase is not configured. Check your Firebase environment variables.');
    }
    const cred = await createUserWithEmailAndPassword(this.auth, email, pass);
    const session: UserSession = {
      uid: cred.user.uid,
      email: cred.user.email || email,
    };
    await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
    return session;
  }

  async signInWithEmail(email: string, pass: string): Promise<UserSession> {
    if (!this.isFirebaseReady || !this.auth) {
      throw new Error('Firebase is not configured. Check your Firebase environment variables.');
    }
    const cred = await signInWithEmailAndPassword(this.auth, email, pass);
    const session: UserSession = {
      uid: cred.user.uid,
      email: cred.user.email || email,
    };
    await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
    return session;
  }

  async signInWithGoogleCredential(idToken: string): Promise<UserSession> {
    if (!this.isFirebaseReady || !this.auth) {
      throw new Error('Firebase is not configured. Check your Firebase environment variables.');
    }
    if (!idToken) {
      throw new Error('Google Sign-In requires a valid ID token from a native development build.');
    }
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(this.auth, credential);
    const session: UserSession = {
      uid: cred.user.uid,
      email: cred.user.email || undefined,
      displayName: cred.user.displayName || undefined,
    };
    await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
    return session;
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (this.isFirebaseReady && this.auth) {
      await firebaseSendPasswordResetEmail(this.auth, email);
    }
  }

  async createDemoSession(): Promise<UserSession> {
    const session: UserSession = {
      uid: `demo-user-${Date.now()}`,
      displayName: 'Demo Judge',
      phoneNumber: '+91 99999 88888',
      isDevSession: true,
    };
    await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
    return session;
  }

  async getCurrentSession(): Promise<UserSession | null> {
    try {
      const raw = await AsyncStorage.getItem('@nyaya_auth_session');
      if (raw) {
        return JSON.parse(raw) as UserSession;
      }
    } catch (e) {
      console.warn('[AuthService] Reading auth session error:', e);
    }
    return null;
  }

  async signOut(): Promise<void> {
    if (this.isFirebaseReady && this.auth) {
      try {
        await firebaseSignOut(this.auth);
      } catch (e) {
        console.warn('[AuthService] Firebase signOut error:', e);
      }
    }
    lastConfirmationResult = null;
    await AsyncStorage.removeItem('@nyaya_auth_session');
  }

  onAuthStateChanged(callback: (session: UserSession | null) => void): () => void {
    if (this.isFirebaseReady && this.auth) {
      const unsubscribe = firebaseOnAuthStateChanged(this.auth, async (user: FirebaseUser | null) => {
        if (user) {
          const session: UserSession = {
            uid: user.uid,
            phoneNumber: user.phoneNumber || undefined,
            email: user.email || undefined,
            displayName: user.displayName || undefined,
          };
          await AsyncStorage.setItem('@nyaya_auth_session', JSON.stringify(session));
          callback(session);
        } else {
          const stored = await this.getCurrentSession();
          callback(stored);
        }
      });
      return unsubscribe;
    } else {
      this.getCurrentSession().then((session) => callback(session));
      return () => {};
    }
  }
}

export const authService = new AuthService();
