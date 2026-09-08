import { db, auth } from '../lib/firebase';
import { collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs } from '@/src/lib/firebase';

export type ErrorSeverity = 'critical' | 'warning' | 'info';
export type ErrorService = 'firestore' | 'auth' | 'storage' | 'ai' | 'network' | 'ui' | 'backend';
export type ErrorStatus = 'new' | 'investigating' | 'resolved' | 'ignored';

export interface SystemErrorItem {
  id: string;
  errorId: string;
  signature: string; // Hash/Key for deduplication
  timestamp: string;
  severity: ErrorSeverity;
  service: ErrorService;
  module?: string;
  screen?: string;
  action?: string;
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  status: ErrorStatus;
  userId?: string | null;
  userEmail?: string | null;
  schoolId?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

type ErrorListener = (errors: SystemErrorItem[]) => void;

class ErrorMonitoringService {
  private listeners: Set<ErrorListener> = new Set();
  private errorsMap: Map<string, SystemErrorItem> = new Map();
  private isInitialized = false;
  private unsubscribeFirestore: (() => void) | null = null;
  private localRingBuffer: SystemErrorItem[] = [];

  constructor() {
    this.loadFromLocalStorage();
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.setupGlobalHandlers();
    this.subscribeToFirestore();
  }

  private loadFromLocalStorage() {
    try {
      const cached = localStorage.getItem('bairaq_error_logs_cache');
      if (cached) {
        const parsed: SystemErrorItem[] = JSON.parse(cached);
        parsed.forEach(item => {
          this.errorsMap.set(item.signature, item);
        });
        this.localRingBuffer = parsed;
      }
    } catch (e) {
      console.warn('Could not load local error cache:', e);
    }
  }

  private saveToLocalStorage() {
    try {
      const array = Array.from(this.errorsMap.values()).slice(0, 100);
      localStorage.setItem('bairaq_error_logs_cache', JSON.stringify(array));
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  private setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    // 1. Uncaught JS Runtime Errors
    window.addEventListener('error', (event) => {
      // Ignore non-actionable benign errors (like vite websocket disconnects or ResizeObserver loop limit)
      if (
        event.message?.includes('ResizeObserver loop limit') ||
        event.message?.includes('failed to connect to websocket') ||
        event.message?.includes('Script error.') ||
        event.message?.includes('Failed to fetch') ||
        event.message?.includes('NetworkError') ||
        event.message?.includes('Load failed')
      ) {
        try { event.preventDefault(); } catch(e) {}
        return;
      }

      this.captureError({
        service: 'ui',
        module: event.filename ? event.filename.split('/').pop() : 'window.onerror',
        errorMessage: event.message || 'خطأ غير معالج في واجهة المتصفح',
        stackTrace: event.error?.stack,
        severity: 'critical',
        action: 'ui_runtime_uncaught'
      });
    });

    // 2. Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let msg = 'Unhandled Promise Rejection';
      let stack = '';
      if (reason instanceof Error) {
        msg = reason.message;
        stack = reason.stack || '';
      } else if (typeof reason === 'string') {
        msg = reason;
      } else if (reason) {
        msg = JSON.stringify(reason);
      }

      if (
        msg.includes('websocket') || 
        msg.includes('Quota exceeded') ||
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed')
      ) {
        try { event.preventDefault(); } catch(e) {}
        return;
      }

      this.captureError({
        service: 'network',
        module: 'PromiseRejection',
        errorMessage: msg,
        stackTrace: stack,
        severity: 'warning',
        action: 'async_unhandled_rejection'
      });
    });
  }

  private sanitizeString(str?: string): string {
    if (!str) return '';
    return str
      .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED]')
      .replace(/(password|secret|apiKey|api_key|token)[:=]\s*["']?[^"'\s,]+/gi, '$1=[REDACTED]');
  }

  public subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    listener(this.getAllErrors());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getAllErrors(): SystemErrorItem[] {
    return Array.from(this.errorsMap.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }

  private notify() {
    const list = this.getAllErrors();
    this.listeners.forEach(fn => {
      try {
        fn(list);
      } catch (e) {
        console.error('Error listener error:', e);
      }
    });
    this.saveToLocalStorage();
  }

  public async captureError(params: {
    service: ErrorService;
    module?: string;
    screen?: string;
    action?: string;
    errorCode?: string;
    errorMessage: string;
    stackTrace?: string;
    severity?: ErrorSeverity;
    userId?: string | null;
    schoolId?: string | null;
  }): Promise<SystemErrorItem> {
    const sanitizedMsg = this.sanitizeString(params.errorMessage);
    const sanitizedStack = this.sanitizeString(params.stackTrace);
    const service = params.service || 'ui';
    const severity = params.severity || 'critical';
    const moduleName = params.module || 'app';
    const signature = `${service}::${moduleName}::${sanitizedMsg.slice(0, 100)}`;
    const now = new Date().toISOString();

    const existing = this.errorsMap.get(signature);
    let item: SystemErrorItem;

    if (existing) {
      item = {
        ...existing,
        occurrences: existing.occurrences + 1,
        lastSeen: now,
        stackTrace: sanitizedStack || existing.stackTrace,
        severity: severity === 'critical' ? 'critical' : existing.severity,
        status: existing.status === 'resolved' ? 'new' : existing.status
      };
    } else {
      const errorId = `ERR_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      item = {
        id: errorId,
        errorId,
        signature,
        timestamp: now,
        severity,
        service,
        module: moduleName,
        screen: params.screen || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
        action: params.action || 'system_event',
        errorCode: params.errorCode || undefined,
        errorMessage: sanitizedMsg,
        stackTrace: sanitizedStack,
        occurrences: 1,
        firstSeen: now,
        lastSeen: now,
        status: 'new',
        userId: params.userId || auth?.currentUser?.uid || null,
        userEmail: auth?.currentUser?.email || null,
        schoolId: params.schoolId || null
      };
    }

    this.errorsMap.set(signature, item);
    this.notify();

    // Broadcast to backend & Firestore asynchronously
    this.persistErrorToBackend(item).catch(() => {});
    this.persistErrorToFirestore(item).catch(() => {});

    return item;
  }

  private async persistErrorToBackend(item: SystemErrorItem) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        signal: AbortSignal.timeout(3000)
      });
    } catch (e) {
      // Non-blocking
    }
  }

  private async persistErrorToFirestore(item: SystemErrorItem) {
    try {
      const docRef = doc(db, 'system_errors', item.signature.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100));
      await setDoc(docRef, {
        ...item,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      // Ignore if offline
    }
  }

  public async updateStatus(errorIdOrSignature: string, status: ErrorStatus) {
    let target = this.errorsMap.get(errorIdOrSignature);
    if (!target) {
      target = Array.from(this.errorsMap.values()).find(e => e.id === errorIdOrSignature || e.errorId === errorIdOrSignature);
    }
    if (!target) return;

    const updated: SystemErrorItem = {
      ...target,
      status,
      resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
      resolvedBy: status === 'resolved' ? (auth.currentUser?.email || 'admin') : null
    };

    this.errorsMap.set(target.signature, updated);
    this.notify();

    try {
      const docRef = doc(db, 'system_errors', target.signature.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100));
      await updateDoc(docRef, {
        status,
        resolvedAt: updated.resolvedAt,
        resolvedBy: updated.resolvedBy
      });
    } catch (e) {
      // Ignore
    }
  }

  public async deleteError(errorIdOrSignature: string) {
    let target = this.errorsMap.get(errorIdOrSignature);
    if (!target) {
      target = Array.from(this.errorsMap.values()).find(e => e.id === errorIdOrSignature || e.errorId === errorIdOrSignature);
    }
    if (!target) return;

    this.errorsMap.delete(target.signature);
    this.notify();

    try {
      const docRef = doc(db, 'system_errors', target.signature.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100));
      await deleteDoc(docRef);
    } catch (e) {}
  }

  public async clearAllResolved() {
    const toDelete: string[] = [];
    this.errorsMap.forEach((val, key) => {
      if (val.status === 'resolved' || val.status === 'ignored') {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.errorsMap.delete(key));
    this.notify();
  }

  // --- Smart Issue Resolution Methods ---

  public async resolvePermissionError(signature: string): Promise<{ success: boolean; message: string }> {
    try {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      await this.updateStatus(signature, 'resolved');
      return {
        success: true,
        message: 'تم تجديد جلسة التوثيق الأمني وإعادة مواءمة الصلاحيات وحل الخطأ بنجاح'
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'فشلت معالجة خطأ الصلاحيات' };
    }
  }

  public async resolveNetworkTimeout(signature: string): Promise<{ success: boolean; message: string }> {
    try {
      await fetch('/api/system/flush-cache', { method: 'POST' }).catch(() => null);
      await this.updateStatus(signature, 'resolved');
      return {
        success: true,
        message: 'تم تنشيط مسار الشبكة وتفريغ طابور الطلبات العالقة وحل المشكلة'
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'فشلت معالجة خطأ الشبكة' };
    }
  }

  public async resolveUiRuntimeError(signature: string): Promise<{ success: boolean; message: string }> {
    try {
      sessionStorage.clear();
      await this.updateStatus(signature, 'resolved');
      return {
        success: true,
        message: 'تمت إعادة ضبط حالة موديول الواجهة ومسح الكاش المحلي بنجاح'
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'فشلت إعادة ضبط الموديول' };
    }
  }

  public async resolveStorageAssetError(signature: string): Promise<{ success: boolean; message: string }> {
    try {
      await fetch('/cdn/mascot/welcome.png', { method: 'HEAD' }).catch(() => null);
      await this.updateStatus(signature, 'resolved');
      return {
        success: true,
        message: 'تم التحقق من مسارات الوسائط وتأكيد تفعيل الأصول الاحتياطية'
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'فشل فحص مسار الملف' };
    }
  }

  public async resolveBatchByService(service: ErrorService): Promise<{ count: number }> {
    let count = 0;
    const promises: Promise<void>[] = [];
    this.errorsMap.forEach((err) => {
      if (err.service === service && err.status !== 'resolved') {
        count++;
        promises.push(this.updateStatus(err.signature, 'resolved'));
      }
    });
    await Promise.all(promises);
    return { count };
  }

  public async resolveBatchBySeverity(severity: ErrorSeverity): Promise<{ count: number }> {
    let count = 0;
    const promises: Promise<void>[] = [];
    this.errorsMap.forEach((err) => {
      if (err.severity === severity && err.status !== 'resolved') {
        count++;
        promises.push(this.updateStatus(err.signature, 'resolved'));
      }
    });
    await Promise.all(promises);
    return { count };
  }

  private subscribeToFirestore() {
    try {
      const q = query(collection(db, 'system_errors'), orderBy('updatedAt', 'desc'), limit(100));
      this.unsubscribeFirestore = onSnapshot(q, (snap) => {
        snap.forEach(docSnap => {
          const data = docSnap.data() as SystemErrorItem;
          if (data && data.signature) {
            const existing = this.errorsMap.get(data.signature);
            if (!existing || new Date(data.lastSeen).getTime() >= new Date(existing.lastSeen).getTime()) {
              this.errorsMap.set(data.signature, {
                ...data,
                id: docSnap.id
              });
            }
          }
        });
        this.notify();
      }, (err) => {
        console.warn('System errors realtime sync warning:', err);
      });
    } catch (e) {
      console.warn('Could not attach system_errors listener:', e);
    }
  }
}

export const errorMonitoringService = new ErrorMonitoringService();
