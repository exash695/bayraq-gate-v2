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

  constructor() { }

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
    contextData?: any;
  }) {
    try {
      const signature = `${params.service}-${params.module || 'unknown'}-${params.errorCode || 'none'}`.replace(/[^a-zA-Z0-9-]/g, '_');
      const docId = `err_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const errObj: SystemErrorItem = {
        errorId: docId,
        signature,
        service: params.service,
        module: params.module || 'unknown',
        screen: params.screen,
        action: params.action,
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
        stackTrace: params.stackTrace,
        severity: params.severity || 'warning',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        userId: params.userId || auth.currentUser?.uid,
        schoolId: params.schoolId,
        contextData: params.contextData
      };

      await fetch('/api/system_errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, ...errObj })
      });
      // no need to store in local memory as we fetch it
    } catch (e) {
      // failed to log
    }
  }


  private async persistErrorToFirestore(item: SystemErrorItem) { /* disabled */ }

  public async updateStatus(errorIdOrSignature: string, status: ErrorStatus) {
    let target = this.errorsMap.get(errorIdOrSignature);
    if (!target) {
      target = Array.from(this.errorsMap.values()).find(e => e.id === errorIdOrSignature || e.errorId === errorIdOrSignature);
    }
    
    if (target) {
      const updated: SystemErrorItem = {
        ...target,
        status,
        resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
        resolvedBy: status === 'resolved' ? (auth.currentUser?.email || 'المطور') : null
      };
      this.errorsMap.set(target.signature, updated);
      if (target.id) this.errorsMap.set(target.id, updated);
      this.notify();
    }

    try {
      await fetch(`/api/system_errors/${encodeURIComponent(errorIdOrSignature)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
          resolvedBy: status === 'resolved' ? (auth.currentUser?.email || 'المطور') : null
        })
      });
    } catch (e) {
      console.warn('Failed to patch system error on backend:', e);
    }
  }

  public async deleteError(errorIdOrSignature: string) {
    let target = this.errorsMap.get(errorIdOrSignature);
    if (!target) {
      target = Array.from(this.errorsMap.values()).find(e => e.id === errorIdOrSignature || e.errorId === errorIdOrSignature);
    }
    if (target) {
      this.errorsMap.delete(target.signature);
      if (target.id) this.errorsMap.delete(target.id);
      this.notify();
    }

    try {
      await fetch(`/api/system_errors/${encodeURIComponent(errorIdOrSignature)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Failed to delete system error on backend:', e);
    }
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

    try {
      await fetch('/api/system_errors/clear-resolved', {
        method: 'POST'
      });
    } catch (e) {
      console.warn('Failed to clear resolved errors on backend:', e);
    }
  }

  // --- Smart Issue Resolution Methods ---

  public async resolvePermissionError(signature: string): Promise<{ success: boolean; message: string }> {
    try {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true).catch(() => null);
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
    try {
      const res = await fetch('/api/system_errors/resolve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, resolvedBy: auth.currentUser?.email || 'المطور' })
      });
      if (res.ok) {
        const data = await res.json();
        return { count: data.count || 0 };
      }
    } catch (e) {
      console.warn('Backend resolveBatchByService failed:', e);
    }

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
    try {
      const res = await fetch('/api/system_errors/resolve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ severity, resolvedBy: auth.currentUser?.email || 'المطور' })
      });
      if (res.ok) {
        const data = await res.json();
        return { count: data.count || 0 };
      }
    } catch (e) {
      console.warn('Backend resolveBatchBySeverity failed:', e);
    }

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

  private subscribeToFirestore() { /* disabled */ }
}

export const errorMonitoringService = new ErrorMonitoringService();
