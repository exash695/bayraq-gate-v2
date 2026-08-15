import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditLogEntry {
  action: string;
  details: string;
  targetId?: string;
  targetName?: string;
  targetType?: string;
}

/**
 * Logs an administrative action to Firestore for auditing.
 */
export async function logActivity(entry: AuditLogEntry) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'audit_logs'), {
      ...entry,
      userId: user.uid,
      userName: user.displayName || 'موظف',
      userEmail: user.email,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
