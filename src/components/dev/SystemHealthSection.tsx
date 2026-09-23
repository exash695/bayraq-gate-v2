import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Key,
  HardDrive,
  Cpu,
  Bell,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Calculator,
  Layers,
  Bot,
  Wrench,
  CheckCheck,
  RotateCw,
  ShieldCheck,
  Wifi,
  Trash2,
  Lock,
  Send
} from 'lucide-react';
import {
  systemHealthService,
  SystemHealthReport,
  ServiceHealthCheck
} from '../../services/systemHealthService';
import { logActivity } from '../../utils/auditLogger';

interface SystemHealthSectionProps {
  schoolsCount: number;
  activeUsersCount: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  processedFilesCount: number;
  aiUsageCount: number;
  aiAnalytics: any;
  loadingAnalytics: boolean;
  onRefreshAnalytics: () => void;
}

export const SystemHealthSection: React.FC<SystemHealthSectionProps> = ({
  schoolsCount,
  activeUsersCount,
  totalStudents,
  totalTeachers,
  totalParents,
  processedFilesCount,
  aiUsageCount,
  aiAnalytics,
  loadingAnalytics,
  onRefreshAnalytics
}) => {
  const [report, setReport] = useState<SystemHealthReport>({
    overallStatus: 'healthy',
    lastChecked: new Date().toISOString(),
    checks: [],
    avgLatencyMs: 0,
    healthyCount: 0,
    warningCount: 0,
    criticalCount: 0,
    offlineCount: 0
  });

  const [isChecking, setIsChecking] = useState(false);
  const [repairingMap, setRepairingMap] = useState<Record<string, boolean>>({});
  const [successMap, setSuccessMap] = useState<Record<string, boolean>>({});
  const [toastNotification, setToastNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    latencyMs?: number;
  } | null>(null);

  const [simStudents, setSimStudents] = useState(1000);
  const [simSubscription, setSimSubscription] = useState(1500);
  const [simAiRequests, setSimAiRequests] = useState(10);

  const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success', latencyMs?: number) => {
    setToastNotification({ title, message, type, latencyMs });
    setTimeout(() => {
      setToastNotification(null);
    }, 5500);
  };

  const markButtonSuccess = (actionKey: string) => {
    setSuccessMap(prev => ({ ...prev, [actionKey]: true }));
    setTimeout(() => {
      setSuccessMap(prev => ({ ...prev, [actionKey]: false }));
    }, 3500);
  };

  useEffect(() => {
    systemHealthService.startAutoCheck(30000);
    const unsubscribe = systemHealthService.subscribe((newReport) => {
      setReport(newReport);
    });
    return () => {
      unsubscribe();
      systemHealthService.stopAutoCheck();
    };
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const start = performance.now();
      await systemHealthService.checkAll(true);
      onRefreshAnalytics();
      const latency = Math.round(performance.now() - start);
      markButtonSuccess('manual_check');
      showNotification(
        'تم فحص واختبار كافة الأنظمة بنجاح',
        `تم فحص 6 خدمات بنية تحتية بنجاح ومتوسط زمن الاستجابة هو ${report.avgLatencyMs || latency}ms`,
        'success',
        latency
      );
    } catch (e: any) {
      showNotification('تعذر استكمال الفحص', e.message || 'حدث خطأ غير متوقع', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePingReconnect = async (serviceId: string, serviceName: string) => {
    setRepairingMap(prev => ({ ...prev, [serviceId]: true }));
    try {
      const res = await systemHealthService.reconnectAndPingService(serviceId);
      await logActivity({
        action: 'إعادة الاتصال وتنشيط خدمة',
        details: `${serviceName} - النتيجة: ${res.message}`,
        targetId: serviceId,
        targetType: 'system_health_action'
      });
      markButtonSuccess(serviceId);
      showNotification(
        `تمت مزامنة وتنشيط: ${serviceName}`,
        res.message,
        res.success ? 'success' : 'error',
        res.latencyMs
      );
    } catch (e: any) {
      showNotification('خطأ في الاتصال', e.message || 'تعذر الاتصال بالخدمة', 'error');
    } finally {
      setRepairingMap(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleFlushServerCache = async () => {
    setRepairingMap(prev => ({ ...prev, ['server_cache']: true }));
    try {
      const res = await systemHealthService.flushServerCache();
      await logActivity({
        action: 'تفريغ الذاكرة المؤقتة للسيرفر',
        details: res.message,
        targetType: 'server_cache'
      });
      markButtonSuccess('server_cache');
      showNotification(
        'تم تفريغ كاش السيرفر بنجاح',
        `${res.message} ${res.freedMb ? `(تم تحرير ${res.freedMb}MB من الذاكرة)` : ''}`,
        'success'
      );
    } catch (e: any) {
      showNotification('فشل تفريغ الكاش', 'تعذر استكمال طلب تفريغ ذاكرة السيرفر', 'error');
    } finally {
      setRepairingMap(prev => ({ ...prev, ['server_cache']: false }));
    }
  };

  const handleResetAiSession = async () => {
    setRepairingMap(prev => ({ ...prev, ['gemini_ai']: true }));
    try {
      const res = await systemHealthService.resetAiSession();
      await logActivity({
        action: 'إعادة ضبط بوابة الذكاء الاصطناعي',
        details: res.message,
        targetType: 'gemini_gateway'
      });
      markButtonSuccess('gemini_ai');
      showNotification(
        'تمت إعادة ضبط بوابة الذكاء الاصطناعي',
        res.message,
        'success'
      );
    } catch (e: any) {
      showNotification('فشل ضبط AI', 'تعذر إعادة ضبط جلسة وبوابة الذكاء الاصطناعي', 'error');
    } finally {
      setRepairingMap(prev => ({ ...prev, ['gemini_ai']: false }));
    }
  };

  const handleRefreshAuthSession = async () => {
    setRepairingMap(prev => ({ ...prev, ['custom_auth']: true }));
    try {
      const res = await systemHealthService.refreshAuthSession();
      await logActivity({
        action: 'تجديد رمز المصادقة الأمني',
        details: res.message,
        targetType: 'custom_auth'
      });
      markButtonSuccess('custom_auth');
      showNotification(
        'تم تجديد جلسة المصادقة الأمنية',
        res.message,
        'success'
      );
    } catch (e: any) {
      showNotification('فشل تجديد المصادقة', 'تعذر تجديد رمز المصادقة الأمني', 'error');
    } finally {
      setRepairingMap(prev => ({ ...prev, ['custom_auth']: false }));
    }
  };

  const handleProbeFallbackStorage = async () => {
    setRepairingMap(prev => ({ ...prev, ['storage_service']: true }));
    try {
      const res = await systemHealthService.probeFallbackStorage();
      await logActivity({
        action: 'فحص مسارات التخزين والـ CDN البديل',
        details: res.message,
        targetType: 'storage_service'
      });
      markButtonSuccess('storage_service');
      showNotification(
        'تم فحص وتأكيد مسار التخزين',
        res.message,
        'success'
      );
    } catch (e: any) {
      showNotification('فشل اختبار التخزين', 'تعذر اختبار مسار التخزين والـ CDN', 'error');
    } finally {
      setRepairingMap(prev => ({ ...prev, ['storage_service']: false }));
    }
  };

  const handleTriggerDeadlinesCheck = async () => {
    setRepairingMap(prev => ({ ...prev, ['notifications_bus']: true }));
    try {
      const res = await systemHealthService.triggerDeadlinesCheck();
      await logActivity({
        action: 'تشغيل فحص مواعيد الحصص والتنبيهات',
        details: res.message,
        targetType: 'notifications_bus'
      });
      markButtonSuccess('notifications_bus');
      showNotification(
        'تم فحص وتشغيل ناقل الإشعارات',
        res.message,
        'success'
      );
    } catch (e: any) {
      showNotification('فشل فحص الإشعارات', 'تعذر تشغيل فحص مواعيد الإشعارات', 'error');
    } finally {
      setRepairingMap(prev => ({ ...prev, ['notifications_bus']: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} /> ممتاز (Healthy)
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle size={13} /> تنبيه (Warning)
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <XCircle size={13} /> حرج (Critical)
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-neutral-800 text-neutral-400 border border-white/10">
            <XCircle size={13} /> غير متصل (Offline)
          </span>
        );
    }
  };

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'database':
        return <Database className="text-indigo-400" size={20} />;
      case 'auth':
        return <Key className="text-emerald-400" size={20} />;
      case 'storage':
        return <HardDrive className="text-cyan-400" size={20} />;
      case 'backend':
        return <Server className="text-purple-400" size={20} />;
      case 'ai':
        return <Cpu className="text-amber-400" size={20} />;
      case 'notifications':
        return <Bell className="text-rose-400" size={20} />;
      default:
        return <Activity className="text-indigo-400" size={20} />;
    }
  };

  const calculateGrossProfit = () => {
    const revenueIQD = simStudents * simSubscription;
    const revenueUSD = revenueIQD / 1310;
    const aiCostPerRequestUSD = 0.00015;
    const monthlyAiCostUSD = simStudents * simAiRequests * aiCostPerRequestUSD;
    const monthlyAiCostIQD = monthlyAiCostUSD * 1310;
    const cloudflareBandwidthCostIQD = simStudents * 15;
    const totalCostsIQD = monthlyAiCostIQD + cloudflareBandwidthCostIQD;
    const netProfitIQD = revenueIQD - totalCostsIQD;
    const profitMargin = revenueIQD > 0 ? (netProfitIQD / revenueIQD) * 100 : 0;
    return {
      revenueIQD,
      revenueUSD,
      monthlyAiCostIQD,
      totalCostsIQD,
      netProfitIQD,
      profitMargin
    };
  };

  const simResults = calculateGrossProfit();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Floating Viewport Toast Notification (Visible anywhere on screen) */}
      {toastNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-3xl border border-emerald-500/40 bg-neutral-950/95 p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              toastNotification.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}>
              {toastNotification.type === 'success' ? (
                <CheckCheck size={20} className="animate-bounce" />
              ) : (
                <XCircle size={20} />
              )}
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                {toastNotification.title}
                {toastNotification.latencyMs && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                    {toastNotification.latencyMs}ms
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
                {toastNotification.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-all shrink-0"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Top Banner with Real-time Overall Health */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl border ${
              report.overallStatus === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : report.overallStatus === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
            }`}>
              <Activity size={28} className={report.overallStatus === 'healthy' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white">صحة ومراقبة أنظمة بوابة بيرق</h2>
                {getStatusBadge(report.overallStatus)}
              </div>
              <p className="text-xs text-white/60 mt-1 flex items-center gap-2">
                <Clock size={12} />
                آخر فحص حي: {new Date(report.lastChecked).toLocaleTimeString('ar-IQ')} • متوسط زمن الاستجابة: {report.avgLatencyMs}ms
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={handleFlushServerCache}
              disabled={repairingMap['server_cache']}
              className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
                successMap['server_cache']
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
              title="تفريغ الذاكرة المؤقتة لكافة موديولات السيرفر"
            >
              {successMap['server_cache'] ? (
                <>
                  <CheckCheck size={13} className="text-emerald-400" />
                  تم تفريغ الكاش بنجاح!
                </>
              ) : (
                <>
                  <Trash2 size={13} className={repairingMap['server_cache'] ? 'animate-spin text-purple-400' : 'text-purple-400'} />
                  {repairingMap['server_cache'] ? 'جاري التفريغ...' : 'تفريغ كاش السيرفر'}
                </>
              )}
            </button>
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
                successMap['manual_check']
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {successMap['manual_check'] ? (
                <>
                  <CheckCheck size={15} />
                  تم فحص الأنظمة!
                </>
              ) : (
                <>
                  <RefreshCw size={15} className={isChecking ? 'animate-spin' : ''} />
                  {isChecking ? 'جاري فحص الأنظمة...' : 'فحص الصحة الآن'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-white/40 block font-bold">الخدمات السليمة</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{report.healthyCount} / {report.checks.length}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-white/40 block font-bold">تنبيهات الاستجابة</span>
            <span className="text-lg font-black text-amber-400 font-mono">{report.warningCount}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-white/40 block font-bold">خدمات متعثرة</span>
            <span className="text-lg font-black text-rose-400 font-mono">{report.criticalCount + report.offlineCount}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-white/40 block font-bold">سرعة الشبكة والسيرفر</span>
            <span className="text-lg font-black text-indigo-400 font-mono">{report.avgLatencyMs} ms</span>
          </div>
        </div>
      </div>

      {/* Global Quick Action Toolbar */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-bold text-white/90">
          <Wrench size={16} className="text-indigo-400" />
          <span>مركز إجراءات الإنقاذ والتحسين السريع</span>
          <span className="text-[10px] text-indigo-400/80 font-mono font-normal" dir="ltr">(Quick Fix Center)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Auth Button */}
          <button
            onClick={handleRefreshAuthSession}
            disabled={repairingMap['custom_auth']}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
              successMap['custom_auth']
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/5'
            }`}
          >
            {successMap['custom_auth'] ? (
              <>
                <CheckCheck size={13} className="text-emerald-400" />
                تم التجديد بنجاح!
              </>
            ) : (
              <>
                <Key size={13} className="text-emerald-400" />
                {repairingMap['custom_auth'] ? 'جاري التجديد...' : 'تجديد جلسة المصادقة'}
              </>
            )}
          </button>

          {/* AI Session Button */}
          <button
            onClick={handleResetAiSession}
            disabled={repairingMap['gemini_ai']}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
              successMap['gemini_ai']
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/5'
            }`}
          >
            {successMap['gemini_ai'] ? (
              <>
                <CheckCheck size={13} className="text-amber-400" />
                تمت إعادة الضبط!
              </>
            ) : (
              <>
                <Cpu size={13} className="text-amber-400" />
                {repairingMap['gemini_ai'] ? 'جاري إعادة الضبط...' : 'إعادة ضبط بوابة AI'}
              </>
            )}
          </button>

          {/* Storage Probe Button */}
          <button
            onClick={handleProbeFallbackStorage}
            disabled={repairingMap['storage_service']}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
              successMap['storage_service']
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/5'
            }`}
          >
            {successMap['storage_service'] ? (
              <>
                <CheckCheck size={13} className="text-cyan-400" />
                تم فحص التخزين!
              </>
            ) : (
              <>
                <HardDrive size={13} className="text-cyan-400" />
                {repairingMap['storage_service'] ? 'جاري الفحص...' : 'فحص CDN والتخزين'}
              </>
            )}
          </button>

          {/* Notifications Probe Button */}
          <button
            onClick={handleTriggerDeadlinesCheck}
            disabled={repairingMap['notifications_bus']}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
              successMap['notifications_bus']
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/5'
            }`}
          >
            {successMap['notifications_bus'] ? (
              <>
                <CheckCheck size={13} className="text-rose-400" />
                تم فحص المواعيد!
              </>
            ) : (
              <>
                <Bell size={13} className="text-rose-400" />
                {repairingMap['notifications_bus'] ? 'جاري الفحص...' : 'فحص مواعيد الإشعارات'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real Live Service Cards Grid (Replaces Hardcoded Cards) */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
          <Server size={16} className="text-indigo-400" /> الحالة اللحظية للخدمات والبنية التحتية مع أزرار الإصلاح الفوري
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.checks.map((svc: ServiceHealthCheck) => {
            const isGood = svc.status === 'healthy';
            const isWarn = svc.status === 'warning';
            const isRepairing = repairingMap[svc.id] || false;
            const isSucceeded = successMap[svc.id] || false;

            return (
              <div
                key={svc.id}
                className="bg-neutral-900/60 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4 backdrop-blur-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
                        {getServiceIcon(svc.category)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{svc.name}</h4>
                        <span className="text-[10px] text-white/40 font-mono block">
                          {svc.id}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(svc.status)}
                  </div>

                  {/* Latency Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-white/40">زمن الاستجابة:</span>
                      <span className={`font-black ${isGood ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-rose-400'}`}>
                        {svc.responseTimeMs} ms
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-emerald-500' : isWarn ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(8, (svc.responseTimeMs / 2000) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata Details */}
                  {svc.details && (
                    <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[10px] font-mono text-white/60">
                      {Object.entries(svc.details).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-white/30">{key}:</span>
                          <span className="text-white/80 font-bold">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {svc.errorMessage && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px]">
                      {svc.errorMessage}
                    </div>
                  )}
                </div>

                {/* Service Context Action Buttons */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Database Specific Actions */}
                    {svc.category === 'database' && (
                      <button
                        onClick={() => handlePingReconnect(svc.id, svc.name)}
                        disabled={isRepairing}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                          isSucceeded
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/20'
                        }`}
                      >
                        {isSucceeded ? (
                          <>
                            <CheckCheck size={13} className="text-emerald-400" />
                            تمت المزامنة بنجاح ({svc.responseTimeMs}ms)
                          </>
                        ) : (
                          <>
                            <Zap size={13} className={isRepairing ? 'animate-spin' : 'text-indigo-400'} />
                            {isRepairing ? 'جاري إعادة الاتصال...' : 'إعادة الاتصال والمزامنة الفورية'}
                          </>
                        )}
                      </button>
                    )}

                    {/* Auth Specific Actions */}
                    {svc.category === 'auth' && (
                      <button
                        onClick={handleRefreshAuthSession}
                        disabled={isRepairing}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                          isSucceeded
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        {isSucceeded ? (
                          <>
                            <CheckCheck size={13} className="text-emerald-400" />
                            تم تجديد التوكن بنجاح!
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={13} className={isRepairing ? 'animate-spin' : 'text-emerald-400'} />
                            {isRepairing ? 'جاري التجديد...' : 'تجديد رمز المصادقة (Refresh Token)'}
                          </>
                        )}
                      </button>
                    )}

                    {/* Storage Specific Actions */}
                    {svc.category === 'storage' && (
                      <button
                        onClick={handleProbeFallbackStorage}
                        disabled={isRepairing}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                          isSucceeded
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/20'
                        }`}
                      >
                        {isSucceeded ? (
                          <>
                            <CheckCheck size={13} className="text-cyan-400" />
                            التخزين الاحتياطي يعمل بنجاح!
                          </>
                        ) : (
                          <>
                            <HardDrive size={13} className={isRepairing ? 'animate-spin' : 'text-cyan-400'} />
                            {isRepairing ? 'جاري الاختبار...' : 'فحص واختبار التخزين الاحتياطي'}
                          </>
                        )}
                      </button>
                    )}

                    {/* Backend Specific Actions */}
                    {svc.category === 'backend' && (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                          onClick={handleFlushServerCache}
                          disabled={repairingMap['server_cache']}
                          className={`py-2 px-2 rounded-xl font-bold text-[11px] transition-all border flex items-center justify-center gap-1 disabled:opacity-50 ${
                            successMap['server_cache']
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/20'
                          }`}
                        >
                          {successMap['server_cache'] ? (
                            <>
                              <CheckCheck size={12} className="text-emerald-400" />
                              تم التفريغ!
                            </>
                          ) : (
                            <>
                              <Trash2 size={12} className={repairingMap['server_cache'] ? 'animate-spin' : ''} />
                              تفريغ الكاش
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handlePingReconnect(svc.id, svc.name)}
                          disabled={isRepairing}
                          className={`py-2 px-2 rounded-xl font-bold text-[11px] transition-all border flex items-center justify-center gap-1 disabled:opacity-50 ${
                            isSucceeded
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                          }`}
                        >
                          {isSucceeded ? (
                            <>
                              <CheckCheck size={12} className="text-emerald-400" />
                              نشط ({svc.responseTimeMs}ms)
                            </>
                          ) : (
                            <>
                              <Zap size={12} className={isRepairing ? 'animate-spin' : 'text-indigo-400'} />
                              فحص الاستجابة
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* AI Specific Actions */}
                    {svc.category === 'ai' && (
                      <button
                        onClick={handleResetAiSession}
                        disabled={isRepairing}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all border flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                          isSucceeded
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        {isSucceeded ? (
                          <>
                            <CheckCheck size={13} className="text-amber-400" />
                            تمت إعادة ضبط الجلسة بنجاح!
                          </>
                        ) : (
                          <>
                            <RotateCw size={13} className={isRepairing ? 'animate-spin' : 'text-amber-400'} />
                            {isRepairing ? 'جاري إعادة الضبط...' : 'إعادة ضبط بوابة وجلسة AI'}
                          </>
                        )}
                      </button>
                    )}

                    {/* Notifications Specific Actions */}
                    {svc.category === 'notifications' && (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                          onClick={handleTriggerDeadlinesCheck}
                          disabled={isRepairing}
                          className={`py-2 px-2 rounded-xl font-bold text-[11px] transition-all border flex items-center justify-center gap-1 disabled:opacity-50 ${
                            isSucceeded
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/20'
                          }`}
                        >
                          {isSucceeded ? (
                            <>
                              <CheckCheck size={12} className="text-rose-400" />
                              تم الفحص!
                            </>
                          ) : (
                            <>
                              <Bell size={12} className={isRepairing ? 'animate-spin' : 'text-rose-400'} />
                              فحص المواعيد
                            </>
                          )}
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const testPayload = {
                                userId: 'all',
                                title: 'بوابة بيرق - فحص الإشعارات الخارجية',
                                message: 'تم إرسال إشعار تجريبي ناجح من منظومة بوابة بيرق للأجهزة المتصلة.',
                                type: 'system_alert'
                              };
                              await fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(testPayload)
                              });
                              showNotification(
                                'بوابة بيرق: اختبار الإشعارات الخارجية',
                                'تم بث إشعار تجريبي ناجح لكافة الأجهزة والتوكنات المسجلة باسم بوابة بيرق',
                                'success'
                              );
                            } catch (e) {
                              showNotification('خطأ في الإرسال', 'تعذر إرسال الإشعار التجريبي', 'error');
                            }
                          }}
                          className="py-2 px-2 rounded-xl font-bold text-[11px] transition-all border bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20 flex items-center justify-center gap-1"
                        >
                          <Send size={12} className="text-emerald-400" />
                          إرسال إشعار تجريبي
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                    <span>آخر نجاح: {svc.lastSuccessfulCheck ? new Date(svc.lastSuccessfulCheck).toLocaleTimeString('ar-IQ') : 'جارِ الفحص'}</span>
                    {svc.consecutiveFailures > 0 && (
                      <span className="text-rose-400 font-bold">تعثر ({svc.consecutiveFailures})</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Operational Numbers */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl">
          <span className="text-xs font-bold text-white/40 block">المدارس الفعالة</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">{schoolsCount}</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl">
          <span className="text-xs font-bold text-white/40 block">المستخدمين النشطين</span>
          <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">{activeUsersCount}</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl">
          <span className="text-xs font-bold text-white/40 block">المستندات المعالجة</span>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
            {totalStudents + totalTeachers + totalParents + processedFilesCount}
          </span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl">
          <span className="text-xs font-bold text-white/40 block">طلبات الذكاء التراكمية</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{aiUsageCount}</span>
        </div>
      </section>

      {/* AI Performance & Analytics Section */}
      <section className="bg-gradient-to-br from-indigo-950/20 to-purple-950/20 border border-indigo-500/10 rounded-3xl p-6 space-y-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">إحصائيات كفاءة الذكاء الاصطناعي والكاش</h3>
              <p className="text-[10px] text-white/40">تحليلات الأداء المباشر وتوفير الرموز عبر الكاش</p>
            </div>
          </div>
          <button
            onClick={onRefreshAnalytics}
            disabled={loadingAnalytics}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw size={12} className={loadingAnalytics ? 'animate-spin' : ''} /> تحديث
          </button>
        </div>

        {aiAnalytics && !aiAnalytics.error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-white/40 font-bold block">إجمالي طلبات AI</span>
              <span className="text-xl font-black text-white font-mono mt-1 block">
                {aiAnalytics.totalRequests || 0}
              </span>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-emerald-400 font-bold block">نسبة التوفير بالكاش</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                {Math.round((aiAnalytics.savingsRatio || 0) * 100)}%
              </span>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-indigo-400 font-bold block">متوسط زمن الاستجابة</span>
              <span className="text-xl font-black text-indigo-400 font-mono mt-1 block">
                {Math.round(aiAnalytics.avgProcessingTimeMs || 0)} ms
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Simulator Section */}
      <section className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator size={20} className="text-indigo-400" />
            <h3 className="text-sm font-black text-white">حاسبة التكاليف والأرباح التقديرية الحية</h3>
          </div>
          <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            محاكاة تشغيلية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/30 p-5 rounded-2xl border border-white/5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-bold">عدد الطلاب المحاكين</span>
              <span className="text-indigo-400 font-mono font-black">{simStudents.toLocaleString()} طالب</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={simStudents}
              onChange={(e) => setSimStudents(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-bold">اشتراك الطالب الشهري</span>
              <span className="text-emerald-400 font-mono font-black">{simSubscription.toLocaleString()} د.ع</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="250"
              value={simSubscription}
              onChange={(e) => setSimSubscription(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/60 font-bold">طلب AI / طالب شهرياً</span>
              <span className="text-amber-400 font-mono font-black">{simAiRequests} طلبات</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={simAiRequests}
              onChange={(e) => setSimAiRequests(Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-white/40 block">الإيراد الشهري</span>
            <span className="text-sm font-black text-white font-mono mt-1 block">
              {simResults.revenueIQD.toLocaleString()} د.ع
            </span>
          </div>
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-rose-400/80 block">التكاليف التشغيلية</span>
            <span className="text-sm font-black text-rose-400 font-mono mt-1 block">
              {Math.round(simResults.totalCostsIQD).toLocaleString()} د.ع
            </span>
          </div>
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-emerald-400/80 block">صافي الربح التقديري</span>
            <span className="text-sm font-black text-emerald-400 font-mono mt-1 block">
              {Math.round(simResults.netProfitIQD).toLocaleString()} د.ع
            </span>
          </div>
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
            <span className="text-[10px] text-indigo-400/80 block">هامش الربح</span>
            <span className="text-sm font-black text-indigo-400 font-mono mt-1 block">
              {simResults.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
