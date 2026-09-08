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
    const user = auth.currentUser;
    if (!user) return;

    // استخراج الإيميل الفعلي للمسؤول
    let email = user.email || '';
    if (!email) {
      try {
        email = localStorage.getItem('bairaq_admin_email') || 
                localStorage.getItem('admin_email') || 
                localStorage.getItem('user_email') || 
                '';
      } catch (e) {
        // ignore localStorage errors
      }
    }

    // إذا لم يتوفر الإيميل وكان المستخدم بحساب إداري
    if (!email && (user.uid === 'ACT_MASTER_G' || user.uid === 'admin_main' || user.displayName === 'الإدارة العامة')) {
      email = 'abdulradhaalmayali@gmail.com';
    }

    const effectiveName = email ? email : (user.displayName && user.displayName !== 'الإدارة العامة' ? user.displayName : (user.email || 'abdulradhaalmayali@gmail.com'));

    await auditService.logAction({
      ...entry,
      userId: user.uid,
      userName: effectiveName,
      userEmail: email || 'abdulradhaalmayali@gmail.com',
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
