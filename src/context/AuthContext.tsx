import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, UserSession } from '../services/auth/authService';
import { userProfileRepository, UserProfile } from '../services/storage/userProfileRepository';

interface AuthContextValue {
  session: UserSession | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  sendOtp: (phone: string, recaptcha?: any) => Promise<{ verificationId: string }>;
  verifyOtp: (verId: string, code: string) => Promise<UserSession>;
  signInWithEmail: (email: string, pass: string) => Promise<UserSession>;
  signUpWithEmail: (email: string, pass: string) => Promise<UserSession>;
  sendPasswordReset: (email: string) => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<UserSession>;
  signInAsDemoUser: () => Promise<UserSession>;
  saveProfileStep: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  reloadSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const reloadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSession = await authService.getCurrentSession();
      setSession(activeSession);
      if (activeSession) {
        const userProf = await userProfileRepository.getProfile();
        setProfile(userProf);
      } else {
        setProfile(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadSession();
    const unsubscribe = authService.onAuthStateChanged((sess) => {
      setSession(sess);
      if (sess) {
        userProfileRepository.getProfile().then(setProfile);
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, [reloadSession]);

  const sendOtp = async (phone: string, recaptcha?: any) => {
    return authService.sendOtp(phone, recaptcha);
  };

  const verifyOtp = async (verId: string, code: string) => {
    const sess = await authService.verifyOtp(verId, code);
    setSession(sess);
    let prof = await userProfileRepository.getProfile();
    if (!prof) {
      prof = await userProfileRepository.saveProfile({
        userId: sess.uid,
        phoneNumber: sess.phoneNumber,
        onboardingCompleted: true,
      });
    } else {
      prof = await userProfileRepository.saveProfile({
        ...prof,
        onboardingCompleted: true,
      });
    }
    setProfile(prof);
    return sess;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const sess = await authService.signInWithEmail(email, pass);
    setSession(sess);
    let prof = await userProfileRepository.getProfile();
    if (!prof) {
      prof = await userProfileRepository.saveProfile({
        userId: sess.uid,
        displayName: email.split('@')[0],
        onboardingCompleted: true,
      });
    } else {
      prof = await userProfileRepository.saveProfile({
        ...prof,
        onboardingCompleted: true,
      });
    }
    setProfile(prof);
    return sess;
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    const sess = await authService.signUpWithEmail(email, pass);
    setSession(sess);
    const prof = await userProfileRepository.saveProfile({
      userId: sess.uid,
      displayName: email.split('@')[0],
      onboardingCompleted: true,
    });
    setProfile(prof);
    return sess;
  };

  const signInWithGoogleCredential = async (idToken: string) => {
    const sess = await authService.signInWithGoogleCredential(idToken);
    setSession(sess);
    let prof = await userProfileRepository.getProfile();
    if (!prof) {
      prof = await userProfileRepository.saveProfile({
        userId: sess.uid,
        displayName: sess.displayName || 'Google User',
        onboardingCompleted: true,
      });
    } else {
      prof = await userProfileRepository.saveProfile({
        ...prof,
        onboardingCompleted: true,
      });
    }
    setProfile(prof);
    return sess;
  };

  const sendPasswordReset = async (email: string) => {
    return authService.sendPasswordReset(email);
  };

  const signInAsDemoUser = async () => {
    const sess = await authService.createDemoSession();
    setSession(sess);
    const prof = await userProfileRepository.saveProfile({
      userId: sess.uid,
      displayName: 'Demo Judge',
      phoneNumber: sess.phoneNumber || '+91 99999 88888',
      preferredLanguage: 'hi',
      state: 'Maharashtra',
      district: 'Mumbai',
      onboardingCompleted: true,
    });
    setProfile(prof);
    return sess;
  };

  const saveProfileStep = async (data: Partial<UserProfile>): Promise<UserProfile | null> => {
    const userId = session?.uid || profile?.userId || `usr-${Date.now()}`;
    const updated = await userProfileRepository.saveProfile({
      ...data,
      userId,
    });
    setProfile(updated);
    return updated;
  };

  const signOut = async () => {
    await authService.signOut();
    await userProfileRepository.clearProfile();
    setSession(null);
    setProfile(null);
  };

  const isAuthenticated = Boolean(session);
  const isOnboardingComplete = Boolean(profile && profile.onboardingCompleted);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        isAuthenticated,
        isOnboardingComplete,
        sendOtp,
        verifyOtp,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signInWithGoogleCredential,
        signInAsDemoUser,
        saveProfileStep,
        signOut,
        reloadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
