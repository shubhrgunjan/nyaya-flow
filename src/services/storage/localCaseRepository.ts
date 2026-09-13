import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirebaseConfig, isFirebaseConfigured } from '../../lib/firebase/config';
import { ICaseRepository } from './caseRepository.interface';
import { CaseModel, CaseChatMessage, CaseDocument, TimelineEvent } from '../../types/case';

const STORAGE_KEY = '@nyaya_flow_cases_v2';

export class LocalCaseRepository implements ICaseRepository {
  private memoryCache: CaseModel[] | null = null;
  private db: any = null;

  constructor() {
    if (isFirebaseConfigured()) {
      try {
        const apps = getApps();
        const app = apps.length === 0 ? initializeApp(getFirebaseConfig()) : apps[0];
        this.db = getFirestore(app);
      } catch (e) {
        console.warn('[CaseRepository] Firestore init notice:', e);
      }
    }
  }

  private getAuthenticatedUid(): string | null {
    try {
      const apps = getApps();
      if (apps.length > 0) {
        const auth = getAuth(apps[0]);
        return auth.currentUser?.uid || null;
      }
    } catch (_) {}
    return null;
  }

  async getAllCases(): Promise<CaseModel[]> {
    const uid = this.getAuthenticatedUid();

    // 1. Try reading from Firestore if authenticated
    if (this.db && uid) {
      try {
        const casesRef = collection(this.db, 'users', uid, 'cases');
        const snapshot = await getDocs(casesRef);
        if (!snapshot.empty) {
          const firestoreCases: CaseModel[] = snapshot.docs.map((docSnap) => docSnap.data() as CaseModel);
          this.memoryCache = firestoreCases;
          await this.persistLocalCache(firestoreCases);
          return firestoreCases;
        }
      } catch (err: any) {
        console.warn('[CaseRepository] Firestore query fallback to local cache:', err?.message || err);
      }
    }

    // 2. Fallback to local persistent cache
    if (this.memoryCache) {
      return this.memoryCache;
    }
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        this.memoryCache = JSON.parse(data);
        return this.memoryCache || [];
      }
    } catch (e) {
      console.warn('[CaseRepository] Error reading AsyncStorage:', e);
    }

    // Absolutely NO seed cases — return clean empty state
    this.memoryCache = [];
    return [];
  }

  async getCaseById(id: string): Promise<CaseModel | null> {
    const cases = await this.getAllCases();
    return cases.find((c) => c.id === id || c.caseId === id) || null;
  }

  async saveCase(caseItem: CaseModel): Promise<void> {
    const uid = this.getAuthenticatedUid();
    const cleanItem: CaseModel = {
      ...caseItem,
      ownerUid: uid || caseItem.ownerUid || 'local-user',
      updatedAt: new Date().toISOString(),
    };

    const cases = await this.getAllCases();
    const index = cases.findIndex((c) => c.id === cleanItem.id);
    if (index >= 0) {
      cases[index] = cleanItem;
    } else {
      cases.unshift(cleanItem);
    }
    this.memoryCache = [...cases];
    await this.persistLocalCache(this.memoryCache);

    // Synchronize to Firestore under users/{uid}/cases/{caseId}
    if (this.db && uid) {
      try {
        const caseDocRef = doc(this.db, 'users', uid, 'cases', cleanItem.id);
        await setDoc(caseDocRef, cleanItem, { merge: true });

        // Save subcollections if present
        if (cleanItem.messages && cleanItem.messages.length > 0) {
          for (const msg of cleanItem.messages) {
            const msgRef = doc(this.db, 'users', uid, 'cases', cleanItem.id, 'messages', msg.id);
            await setDoc(msgRef, msg, { merge: true });
          }
        }
      } catch (err: any) {
        console.warn('[CaseRepository] Firestore save notice:', err?.message || err);
      }
    }
  }

  async addChatMessage(caseId: string, message: CaseChatMessage): Promise<CaseModel | null> {
    const caseItem = await this.getCaseById(caseId);
    if (!caseItem) return null;

    const messages = caseItem.messages || [];
    messages.push(message);

    const updatedCase: CaseModel = {
      ...caseItem,
      messages,
      updatedAt: new Date().toISOString(),
    };

    await this.saveCase(updatedCase);
    return updatedCase;
  }

  async deleteCase(id: string): Promise<void> {
    const cases = await this.getAllCases();
    const filtered = cases.filter((c) => c.id !== id);
    this.memoryCache = filtered;
    await this.persistLocalCache(filtered);

    const uid = this.getAuthenticatedUid();
    if (this.db && uid) {
      try {
        const caseDocRef = doc(this.db, 'users', uid, 'cases', id);
        await deleteDoc(caseDocRef);
      } catch (err) {
        console.warn('[CaseRepository] Firestore delete notice:', err);
      }
    }
  }

  private async persistLocalCache(cases: CaseModel[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    } catch (e) {
      console.warn('[CaseRepository] Error writing AsyncStorage:', e);
    }
  }
}

export const caseRepository = new LocalCaseRepository();
