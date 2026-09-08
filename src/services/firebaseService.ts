/**
 * Dedicated Firebase Service for Bairaq Portal
 * Scopes Firebase strictly to:
 * 1. Authentication (Identity & Auth)
 * 2. Firestore (Operational Data & Documents History)
 * 3. Realtime Database (Realtime Sync)
 * 4. FCM (Push Notifications)
 */

import { auth, db } from '../lib/firebase';
import { collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint } from '@/src/lib/firebase';
import { cacheService } from './cacheService';

export class FirebaseService {
  /**
   * Fetch a single document from Firestore with caching
   */
  public async getDocument<T = DocumentData>(collectionName: string, docId: string, useCache: boolean = true): Promise<T | null> {
    const cacheKey = cacheService.generateHashKey('fs_doc', `${collectionName}/${docId}`);

    if (useCache) {
      const cached = cacheService.get<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      const docRef = doc(db, collectionName, docId);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() } as T;
        cacheService.set(cacheKey, data, 10 * 60 * 1000); // 10 minutes TTL
        return data;
      }
      return null;
    } catch (error) {
      console.error(`[FirebaseService] Error getting document ${collectionName}/${docId}:`, error);
      throw error;
    }
  }

  /**
   * Save or merge a document in Firestore and invalidate local cache
   */
  public async setDocument(collectionName: string, docId: string, data: any, merge: boolean = true): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge });

      // Invalidate cache
      const cacheKey = cacheService.generateHashKey('fs_doc', `${collectionName}/${docId}`);
      cacheService.remove(cacheKey);
    } catch (error) {
      console.error(`[FirebaseService] Error setting document ${collectionName}/${docId}:`, error);
      throw error;
    }
  }

  /**
   * Query collection from Firestore
   */
  public async queryCollection<T = DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = [],
    useCache: boolean = false
  ): Promise<T[]> {
    const cacheKey = cacheService.generateHashKey('fs_query', `${collectionName}_${JSON.stringify(constraints.length)}`);

    if (useCache) {
      const cached = cacheService.get<T[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const colRef = collection(db, collectionName);
      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);

      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as T));
      if (useCache) {
        cacheService.set(cacheKey, items, 5 * 60 * 1000); // 5 minutes TTL
      }
      return items;
    } catch (error) {
      console.error(`[FirebaseService] Error querying collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get current authenticated user ID
   */
  public getCurrentUserId(): string | null {
    return auth.currentUser ? auth.currentUser.uid : null;
  }
}

export const firebaseService = new FirebaseService();
