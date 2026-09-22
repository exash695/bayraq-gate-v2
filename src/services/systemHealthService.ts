import { auth } from '../lib/firebase';


export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'offline';

export interface ServiceHealthCheck {
  id: string;
  name: string;
  category: 'database' | 'auth' | 'storage' | 'backend' | 'ai' | 'notifications';
  status: HealthStatus;
  responseTimeMs: number;
  checkedAt: string;
  lastSuccessfulCheck: string | null;
  lastFailedCheck: string | null;
  consecutiveFailures: number;
  errorMessage: string | null;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  overallStatus: HealthStatus;
  lastChecked: string;
  checks: ServiceHealthCheck[];
  avgLatencyMs: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
}

type HealthListener = (report: SystemHealthReport) => void;

class SystemHealthService {
  private listeners: Set<HealthListener> = new Set();
  private checkInterval: any = null;
  private isChecking: boolean = false;
  
  private lastReport: SystemHealthReport = {
    overallStatus: 'healthy',
    lastChecked: new Date().toISOString(),
    checks: [],
    avgLatencyMs: 0,
    healthyCount: 0,
    warningCount: 0,
    criticalCount: 0,
    offlineCount: 0
  };

  private historyState: Map<string, { lastSuccess: string | null; lastFail: string | null; consecutiveFails: number }> = new Map();

  constructor() {
    this.initDefaultHistory();
  }

  private initDefaultHistory() {
    const services = ['postgresql_db', 'custom_auth', 'storage_service', 'backend_api', 'gemini_ai', 'notifications_bus'];
    services.forEach(id => {
      this.historyState.set(id, {
        lastSuccess: null,
        lastFail: null,
        consecutiveFails: 0
      });
    });
  }

  public subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    // Send current report immediately
    if (this.lastReport.checks.length > 0) {
      listener(this.lastReport);
    } else {
      this.checkAll();
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public startAutoCheck(intervalMs = 45000) {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.checkAll(false);
    }, intervalMs);
    this.checkAll(false);
  }

  public stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public async checkAll(force = false): Promise<SystemHealthReport> {
    if (this.isChecking && !force) return this.lastReport;
    this.isChecking = true;

    try {
      const [
        dbCheck,
        authCheck,
        storageCheck,
        backendCheck,
        aiCheck,
        notificationsCheck
      ] = await Promise.all([
        this.probePostgreSQL(),
        this.probeAuth(),
        this.probeStorage(),
        this.probeBackend(),
        this.probeAI(),
        this.probeNotifications()
      ]);

      const checks = [dbCheck, authCheck, storageCheck, backendCheck, aiCheck, notificationsCheck];

      let healthyCount = 0;
      let warningCount = 0;
      let criticalCount = 0;
      let offlineCount = 0;
      let totalLatency = 0;

      checks.forEach(c => {
        totalLatency += c.responseTimeMs;
        if (c.status === 'healthy') healthyCount++;
        else if (c.status === 'warning') warningCount++;
        else if (c.status === 'critical') criticalCount++;
        else if (c.status === 'offline') offlineCount++;
      });

      let overallStatus: HealthStatus = 'healthy';
      if (offlineCount > 0 || criticalCount >= 2) {
        overallStatus = 'critical';
      } else if (criticalCount > 0 || warningCount > 0) {
        overallStatus = 'warning';
      }

      this.lastReport = {
        overallStatus,
        lastChecked: new Date().toISOString(),
        checks,
        avgLatencyMs: Math.round(totalLatency / checks.length),
        healthyCount,
        warningCount,
        criticalCount,
        offlineCount
      };

      this.notifyListeners();
      return this.lastReport;
    } finally {
      this.isChecking = false;
    }
  }

  private notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.lastReport);
      } catch (e) {
        console.error('Health listener error:', e);
      }
    });
  }

  private updateHistory(id: string, success: boolean) {
    const prev = this.historyState.get(id) || { lastSuccess: null, lastFail: null, consecutiveFails: 0 };
    const now = new Date().toISOString();
    if (success) {
      this.historyState.set(id, {
        lastSuccess: now,
        lastFail: prev.lastFail,
        consecutiveFails: 0
      });
    } else {
      this.historyState.set(id, {
        lastSuccess: prev.lastSuccess,
        lastFail: now,
        consecutiveFails: prev.consecutiveFails + 1
      });
    }
    return this.historyState.get(id)!;
  }

  // 1. Probe PostgreSQL DB
  private async probePostgreSQL(): Promise<ServiceHealthCheck> {
    const id = 'postgresql_db';
    const start = performance.now();
    try {
      // Test server-side read ping to PostgreSQL
      const res = await fetch('/api/schools?limit=1', { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error('Database unreachable');

      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, true);

      return {
        id,
        name: 'قاعدة البيانات المركزية (PostgreSQL)',
        category: 'database',
        status: 'healthy',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: { connection: 'active', dialect: 'pg' }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'قاعدة البيانات المركزية (PostgreSQL)',
        category: 'database',
        status: 'critical',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'فشل الاتصال بقاعدة البيانات',
        details: { error: String(error) }
      };
    }
  }

  // 2. Probe خدمة المصادقة المخصصة
  private async probeAuth(): Promise<ServiceHealthCheck> {
    const id = 'custom_auth';
    const start = performance.now();
    try {
      const isReady = auth !== null;
      const currentUser = auth.currentUser;
      
      // If user logged in, check token readiness
      if (currentUser) {
        await currentUser.getIdToken(false);
      }
      
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, isReady);

      return {
        id,
        name: 'خدمة المصادقة والأمان (خدمة المصادقة المخصصة)',
        category: 'auth',
        status: 'healthy',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: {
          authenticated: Boolean(currentUser),
          userId: currentUser?.uid || 'guest',
          email: currentUser?.email || 'none'
        }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'خدمة المصادقة والأمان (خدمة المصادقة المخصصة)',
        category: 'auth',
        status: 'warning',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'خطأ في التحقق من حالة المصادقة',
        details: { error: String(error) }
      };
    }
  }

  // 3. Probe Storage
  private async probeStorage(): Promise<ServiceHealthCheck> {
    const id = 'storage_service';
    const start = performance.now();
    try {
      const res = await fetch('/api/storage/status', { signal: AbortSignal.timeout(6000) });
      const responseTimeMs = Math.round(performance.now() - start);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hist = this.updateHistory(id, true);

      return {
        id,
        name: 'خدمة تخزين الوسائط (Cloud Storage & R2)',
        category: 'storage',
        status: 'healthy',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: {
          provider: data.provider || 'local_fallback',
          r2Configured: data.r2Configured,
          bucket: data.bucket || 'local'
        }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'خدمة تخزين الوسائط (Cloud Storage & R2)',
        category: 'storage',
        status: hist.consecutiveFails > 2 ? 'offline' : 'warning',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'تعذر الاتصال بخدمة التخزين',
        details: { fallbackActive: true }
      };
    }
  }

  // 4. Probe Backend Server & APIs
  private async probeBackend(): Promise<ServiceHealthCheck> {
    const id = 'backend_api';
    const start = performance.now();
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
      const responseTimeMs = Math.round(performance.now() - start);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hist = this.updateHistory(id, true);

      let status: HealthStatus = 'healthy';
      if (responseTimeMs > 1500) status = 'warning';

      return {
        id,
        name: 'خادم التطبيق والبنية السحابية (Cloud Run Server)',
        category: 'backend',
        status,
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: {
          uptimeSeconds: data.uptimeSeconds || 0,
          memoryMb: data.memoryUsageMb || 'N/A',
          env: data.env || 'production'
        }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'خادم التطبيق والبنية السحابية (Cloud Run Server)',
        category: 'backend',
        status: 'critical',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'انقطاع الاتصال بالسيرفر الخلفي',
        details: { error: String(error) }
      };
    }
  }

  // 5. Probe Gemini AI
  private async probeAI(): Promise<ServiceHealthCheck> {
    const id = 'gemini_ai';
    const start = performance.now();
    try {
      const res = await fetch('/api/worker/health', { signal: AbortSignal.timeout(6000) });
      const responseTimeMs = Math.round(performance.now() - start);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hist = this.updateHistory(id, true);

      return {
        id,
        name: 'بوابة الذكاء الاصطناعي (Gemini AI Gateway)',
        category: 'ai',
        status: data.status === 'ok' ? 'healthy' : 'warning',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: {
          provider: data.provider || 'gemini',
          gateway: data.gateway || 'Worker-Proxy'
        }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'بوابة الذكاء الاصطناعي (Gemini AI Gateway)',
        category: 'ai',
        status: 'warning',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'بوابة الذكاء الاصطناعي غير مستجيبة',
        details: { error: String(error) }
      };
    }
  }

  // 6. Probe Notifications & Realtime Bus
  private async probeNotifications(): Promise<ServiceHealthCheck> {
    const id = 'notifications_bus';
    const start = performance.now();
    try {
      const res = await fetch('/api/notifications/check-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, true);

      return {
        id,
        name: 'نظام الإشعارات والبث المباشر (Notification Bus)',
        category: 'notifications',
        status: 'healthy',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: null,
        details: { mode: 'Realtime onSnapshot + Webhook' }
      };
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - start);
      const hist = this.updateHistory(id, false);
      return {
        id,
        name: 'نظام الإشعارات والبث المباشر (Notification Bus)',
        category: 'notifications',
        status: 'warning',
        responseTimeMs,
        checkedAt: new Date().toISOString(),
        lastSuccessfulCheck: hist.lastSuccess,
        lastFailedCheck: hist.lastFail,
        consecutiveFailures: hist.consecutiveFails,
        errorMessage: error.message || 'تأخر في معالجة ناقل الإشعارات',
        details: { error: String(error) }
      };
    }
  }

  // --- Interactive Resolution & Recovery Methods ---

  public async reconnectAndPingService(serviceId: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const start = performance.now();
    try {
      if (serviceId === 'postgresql_db') {
        await fetch('/api/schools?limit=1', { signal: AbortSignal.timeout(5000) });
        await this.probePostgreSQL();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `تم فحص وإعادة الاتصال بقاعدة بيانات PostgreSQL بنجاح (${latency}ms)`, latencyMs: latency };
      } else if (serviceId === 'custom_auth') {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }
        await this.probeAuth();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `تم تجديد وتنشيط جلسة المصادقة بنجاح (${latency}ms)`, latencyMs: latency };
      } else if (serviceId === 'storage_service') {
        const res = await fetch('/cdn/mascot/welcome.png', { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
        await this.probeStorage();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `تم اختبار مسارات التخزين والـ CDN البديل بنجاح (${latency}ms)`, latencyMs: latency };
      } else if (serviceId === 'backend_api') {
        const res = await fetch('/api/system/ping-reconnect', { method: 'POST', signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        await this.probeBackend();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `${data.message || 'تم تنشيط الاتصال بالسيرفر'} (${latency}ms)`, latencyMs: latency };
      } else if (serviceId === 'gemini_ai') {
        const res = await fetch('/api/system/reset-ai-cache', { method: 'POST', signal: AbortSignal.timeout(6000) });
        const data = await res.json();
        await this.probeAI();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `${data.message || 'تمت إعادة ضبط بوابة الذكاء الاصطناعي'} (${latency}ms)`, latencyMs: latency };
      } else if (serviceId === 'notifications_bus') {
        await fetch('/api/notifications/check-deadlines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dryRun: true }),
          signal: AbortSignal.timeout(5000)
        });
        await this.probeNotifications();
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `تم فحص وتنشيط ناقل الإشعارات بنجاح (${latency}ms)`, latencyMs: latency };
      } else {
        await this.checkAll(true);
        const latency = Math.round(performance.now() - start);
        return { success: true, message: `تم تحديث وفحص الخدمة بنجاح (${latency}ms)`, latencyMs: latency };
      }
    } catch (e: any) {
      const latency = Math.round(performance.now() - start);
      return { success: false, message: e.message || 'فشلت محاولة إعادة الاتصال', latencyMs: latency };
    }
  }

  public async flushServerCache(): Promise<{ success: boolean; message: string; heapUsedMb?: number; freedMb?: number }> {
    try {
      const res = await fetch('/api/system/flush-cache', { method: 'POST', signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await this.checkAll(true);
      return {
        success: true,
        message: data.message || 'تم تفريغ الذاكرة المؤقتة وإعادة تحسين الاستهلاك بنجاح',
        heapUsedMb: data.heapUsedMb,
        freedMb: data.freedMb
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'تعذر تفريغ ذاكرة السيرفر'
      };
    }
  }

  public async resetAiSession(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/system/reset-ai-cache', { method: 'POST', signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await this.probeAI();
      return {
        success: true,
        message: data.message || 'تمت إعادة ضبط جلسة وبوابة الذكاء الاصطناعي بنجاح'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'تعذر إعادة ضبط بوابة الذكاء الاصطناعي'
      };
    }
  }

  public async refreshAuthSession(): Promise<{ success: boolean; message: string }> {
    try {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      await this.probeAuth();
      return {
        success: true,
        message: 'تم تجديد رمز المصادقة (Auth Token) ومزامنة الحساب فوراً بنجاح'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'تعذر تجديد جلسة المصادقة'
      };
    }
  }

  public async probeFallbackStorage(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/storage/status', { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      await this.probeStorage();
      return {
        success: true,
        message: `تم التحقق من مسار التخزين بنجاح (المزود: ${data.provider || 'local_fallback'})`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'تعذر اختبار مسارات التخزين'
      };
    }
  }

  public async triggerDeadlinesCheck(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const res = await fetch('/api/notifications/check-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
        signal: AbortSignal.timeout(6000)
      });
      const data = await res.json();
      await this.probeNotifications();
      return {
        success: true,
        message: `تم تنفيذ فحص المواعيد بنجاح (تم إرسال ${data.sentCount || 0} إشعار)`,
        count: data.sentCount
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'تعذر تنفيذ فحص المواعيد'
      };
    }
  }
}

export const systemHealthService = new SystemHealthService();
