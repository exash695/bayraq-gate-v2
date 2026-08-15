import { doc, getDoc, updateDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Service to handle subscription codes.
 */
export const activateSubscriptionCode = async (uid: string, code: string) => {
  const codeRef = doc(db, 'codes', code);
  const userRef = doc(db, 'users', uid);

  try {
    await runTransaction(db, async (transaction) => {
      const codeDoc = await transaction.get(codeRef);
      const userDoc = await transaction.get(userRef);

      if (!codeDoc.exists()) {
        throw new Error('الكود غير موجود.');
      }

      const codeData = codeDoc.data();
      if (codeData.isUsed) {
        throw new Error('هذا الكود مستخدم بالفعل.');
      }

      // Update user subscriptions
      transaction.update(userRef, {
        subscriptions: arrayUnion(codeData.courseId)
      });

      // Mark code as used
      transaction.update(codeRef, {
        isUsed: true,
        usedBy: uid,
        usedAt: new Date().toISOString()
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error activating code:', error);
    return { success: false, message: error.message || 'حدث خطأ أثناء تفعيل الكود.' };
  }
};
