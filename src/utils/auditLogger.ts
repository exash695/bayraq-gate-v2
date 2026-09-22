import { auth } from '../lib/firebase';
import { auditService, AuditLog } from '../services/auditService';

export interface AuditLogEntry {
  action: string;
  details: string;
  targetId?: string;
  targetName?: string;
  targetType?: string;
}

/**
 * Logs an administrative action to the backend for auditing.
 */
export async function logActivity(entry: AuditLogEntry) {
  try {
    let user: any = null;
    try {
      user = auth?.currentUser;
    } catch {}

    let uid = user?.uid || 'dev_admin';
    let email = user?.email || '';
    let displayName = user?.displayName || 'المسؤول الإداري';

    try {
      if (!email) {
        email = localStorage.getItem('bairaq_admin_email') || 
                localStorage.getItem('admin_email') || 
                localStorage.getItem('user_email') || 
                '';
      }
      const cachedProfile = localStorage.getItem('bairaq_admin_profile') || localStorage.getItem('user');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.email && !email) email = parsed.email;
        if (parsed.id || parsed.uid) uid = parsed.id || parsed.uid;
        if (parsed.name || parsed.displayName) displayName = parsed.name || parsed.displayName;
      }
    } catch (e) {
      // ignore localStorage errors
    }

    if (!email) {
      email = 'mntzralghanm527@gmail.com';
    }

    const effectiveName = displayName && displayName !== 'الإدارة العامة' ? displayName : email;

    await auditService.logAction({
      ...entry,
      userId: uid,
      userName: effectiveName,
      userEmail: email,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
