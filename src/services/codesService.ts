import { collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  orderBy,
  onSnapshot } from '@/src/lib/firebase';
import { db } from '../lib/firebase';

export interface SubscriptionCode {
  id: string;
  code: string;
  type: string;
  duration: number;
  isActive: boolean;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: any;
  createdAt: any;
  batchId?: string;
  price?: number;
}

const CODES_COLLECTION = 'subscription_codes';

export const codesService = {
  // استماع مباشر للأكواد
  subscribeToCodes: (callback: (codes: SubscriptionCode[]) => void) => {
    const q = query(collection(db, CODES_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const codes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionCode[];
      callback(codes);
    });
  },

  // إنشاء كود جديد
  generateCode: async (data: Omit<SubscriptionCode, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, CODES_COLLECTION), {
        ...data,
        createdAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error generating code:', error);
      throw error;
    }
  },

  // حذف كود
  deleteCode: async (id: string) => {
    try {
      await deleteDoc(doc(db, CODES_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting code:', error);
      throw error;
    }
  },

  // حذف مجموعة (Batch)
  deleteBatch: async (batchId: string) => {
    try {
      const q = query(collection(db, CODES_COLLECTION), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, CODES_COLLECTION, d.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  }
};
