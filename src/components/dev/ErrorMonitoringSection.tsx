import React, { useState, useEffect } from 'react';
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Terminal,
  Zap,
  ShieldAlert,
  Server,
  Layers,
  Wrench,
  CheckCheck,
  Key,
  HardDrive,
  RotateCw
} from 'lucide-react';
import {
  errorMonitoringService,
  SystemErrorItem,
  ErrorSeverity,
  ErrorService,
  ErrorStatus
} from '../../services/errorMonitoringService';
import { logActivity } from '../../utils/auditLogger';

export const ErrorMonitoringSection: React.FC = () => {
  const [errors, setErrors] = useState<SystemErrorItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchErrors = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/system_errors');
        if (res.ok) {
          const data = await res.json();
          data.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
          setErrors(data);
        }
      } catch (err) {
        console.error('Failed to fetch errors', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchErrors();
    const interval = setInterval(fetchErrors, 10000);
    return () => clearInterval(interval);
  }, []);


  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  
  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/system_errors');
      if (res.ok) {
        const data = await res.json();
        data.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());
        setErrors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (targetId: string, newStatus: ErrorStatus) => {
    // Optimistic update
    setErrors(prev => prev.map(e => (e.id === targetId || e.errorId === targetId || e.signature === targetId) ? { ...e, status: newStatus } : e));
    await errorMonitoringService.updateStatus(targetId, newStatus);
    await logActivity({
      action: 'تحديث حالة خطأ بالنظام',
      details: `تم تغيير حالة الخطأ إلى: ${newStatus}`,
      targetId: targetId,
      targetType: 'system_error'
    });
    handleRefreshData();
  };

  const handleDelete = async (targetId: string) => {
    setErrors(prev => prev.filter(e => e.id !== targetId && e.errorId !== targetId && e.signature !== targetId));
    await errorMonitoringService.deleteError(targetId);
    handleRefreshData();
  };

  const handleClearResolved = async () => {
    setErrors(prev => prev.filter(e => e.status !== 'resolved' && e.status !== 'ignored'));
    await errorMonitoringService.clearAllResolved();
    showBanner('تم مسح كافة الأخطاء المحلولة بنجاح');
    handleRefreshData();
  };


  // Smart Auto-Fix Handlers
  const handleSmartFix = async (err: SystemErrorItem) => {
    const targetId = err.id || err.errorId || err.signature;
    setActionLoadingMap(prev => ({ ...prev, [targetId]: true, [err.signature]: true }));
    try {
      const msg = err.errorMessage.toLowerCase();
      let res = { success: true, message: 'تم حل الخطأ وأرشفته بنجاح' };

      if (err.service === 'firestore' || msg.includes('permission') || msg.includes('auth')) {
        res = await errorMonitoringService.resolvePermissionError(targetId);
      } else if (err.service === 'network' || msg.includes('timeout') || msg.includes('504') || msg.includes('429')) {
        res = await errorMonitoringService.resolveNetworkTimeout(targetId);
      } else if (err.service === 'ui' || msg.includes('typeerror') || msg.includes('undefined')) {
        res = await errorMonitoringService.resolveUiRuntimeError(targetId);
      } else if (err.service === 'storage' || msg.includes('404') || msg.includes('not found') || msg.includes('image')) {
        res = await errorMonitoringService.resolveStorageAssetError(targetId);
      } else {
        await errorMonitoringService.updateStatus(targetId, 'resolved');
      }

      // Optimistic update
      setErrors(prev => prev.map(e => (e.id === targetId || e.errorId === targetId || e.signature === targetId) ? { ...e, status: 'resolved' } : e));

      await logActivity({
        action: 'حل خطأ بالنظام تلقائياً',
        details: `${err.errorId || targetId} (${err.service}) - ${res.message}`,
        targetId: err.errorId || targetId,
        targetType: 'system_error_fix'
      });

      showBanner(res.message);
      handleRefreshData();
    } catch (e: any) {
      showBanner(`فشلت محاولة الحل: ${e.message}`);
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [targetId]: false, [err.signature]: false }));
    }
  };

  const handleResolveAllCritical = async () => {
    setActionLoadingMap(prev => ({ ...prev, ['batch_critical']: true }));
    try {
      setErrors(prev => prev.map(e => e.severity === 'critical' ? { ...e, status: 'resolved' } : e));
      const { count } = await errorMonitoringService.resolveBatchBySeverity('critical');
      await logActivity({
        action: 'حل كافة الأخطاء الحرجة دفعة واحدة',
        details: `تم حل ${count} خطأ حرج بنجاح`,
        targetType: 'batch_error_resolution'
      });
      showBanner(`تم حل وتصحيح ${count} خطأ حرج بالنظام دفعة واحدة بنجاح`);
      handleRefreshData();
    } finally {
      setActionLoadingMap(prev => ({ ...prev, ['batch_critical']: false }));
    }
  };

  const handleResolveAllNetwork = async () => {
    setActionLoadingMap(prev => ({ ...prev, ['batch_network']: true }));
    try {
      setErrors(prev => prev.map(e => e.service === 'network' ? { ...e, status: 'resolved' } : e));
      const { count } = await errorMonitoringService.resolveBatchByService('network');
      await logActivity({
        action: 'حل كافة استثناءات الشبكة دفعة واحدة',
        details: `تم حل ${count} استثناء شبكي بنجاح`,
        targetType: 'batch_error_resolution'
      });
      showBanner(`تم حل وتنشيط ${count} استثناء شبكة دفعة واحدة`);
      handleRefreshData();
    } finally {
      setActionLoadingMap(prev => ({ ...prev, ['batch_network']: false }));
    }
  };

  
  
  
  
  
  const handleTriggerTestError = async () => {
    const testErrors = [
      {
        signature: `test_err_${Date.now()}`,
        service: 'firestore',
        module: 'collection:users',
        errorMessage: 'PERMISSION_DENIED: Missing or insufficient permissions on /users/test_user',
        severity: 'critical',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        action: 'test_simulation_probe'
      },
      {
        signature: `test_err_${Date.now()}`,
        service: 'network',
        module: 'api:worker:ai:chat',
        errorMessage: 'Network timeout (504 Gateway Timeout) when contacting AI Worker Gateway',
        severity: 'warning',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        action: 'test_simulation_probe'
      },
      {
        signature: `test_err_${Date.now()}`,
        service: 'ui',
        module: 'DevDashboard',
        errorMessage: 'TypeError: Cannot read properties of undefined (reading "schoolConfig")',
        severity: 'critical',
        status: 'new',
        occurrences: 1,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        stackTrace: 'Error: Cannot read properties of undefined\n    at DevDashboard.render (DevDashboard.tsx:492)\n    at ReactCompositeComponent.mountComponent',
        action: 'test_simulation_probe'
      }
    ];

    const random = testErrors[Math.floor(Math.random() * testErrors.length)];
    try {
      await fetch('/api/system_errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: random.signature, ...random })
      });
      // Force refresh
      handleRefreshData();
    } catch (e) {
      console.error(e);
    }
  };






  const filteredErrors = errors.filter((item) => {
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
    if (serviceFilter !== 'all' && item.service !== serviceFilter) return false;
    if (statusFilter === 'active') {
      if (item.status === 'resolved' || item.status === 'ignored') return false;
    } else if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = item.errorMessage.toLowerCase().includes(q);
      const matchModule = item.module?.toLowerCase().includes(q) || false;
      const matchScreen = item.screen?.toLowerCase().includes(q) || false;
      const matchId = item.errorId.toLowerCase().includes(q);
      return matchMsg || matchModule || matchScreen || matchId;
    }
    return true;
  });

  const criticalCount = errors.filter((e) => e.severity === 'critical' && e.status !== 'resolved').length;
  const warningCount = errors.filter((e) => e.severity === 'warning' && e.status !== 'resolved').length;
  const resolvedCount = errors.filter((e) => e.status === 'resolved').length;
  const activeCount = errors.filter((e) => e.status !== 'resolved' && e.status !== 'ignored').length;

  const getSeverityBadge = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <XCircle size={10} /> حرج (Critical)
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <AlertTriangle size={10} /> تحذير (Warning)
          </span>
        );
      case 'info':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <CheckCircle2 size={10} /> معلومات (Info)
          </span>
        );
    }
  };

  const getServiceBadge = (service: ErrorService) => {
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/5 text-white/70 border border-white/10 uppercase">
        {service}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Floating Viewport Toast Notification (Always Visible) */}
      {feedbackMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-3xl border border-emerald-500/40 bg-neutral-950/95 p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCheck size={20} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">تم تنفيذ الإجراء بنجاح</h4>
              <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">{feedbackMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold transition-all shrink-0"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-neutral-900 to-indigo-950/40 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <Bug size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white">رادار الأخطاء الحية (Central Error Radar)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-mono font-bold animate-pulse border border-rose-500/30">
                  Live Stream
                </span>
              </div>
              <p className="text-xs text-white/60 mt-1">
                التقاط وتوثيق كافة الأخطاء البرمجية، استثناءات الشبكة، أخطاء قواعد البيانات، وأعطال الواجهة مع أزرار المعالجة الفورية.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            <button
              onClick={handleRefreshData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10 flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              تحديث
            </button>
            <button
              onClick={handleTriggerTestError}

              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10 flex items-center gap-1.5"
            >
              <Zap size={14} className="text-amber-400" />
              محاكاة خطأ تجريبي
            </button>
            <button
              onClick={handleClearResolved}
              className="px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white/80 font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              مسح المحلولة
            </button>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/5 text-center">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
            <span className="text-[10px] text-white/40 block font-bold">أخطاء نشطة</span>
            <span className="text-lg font-black text-white font-mono">{activeCount}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
            <span className="text-[10px] text-rose-400 block font-bold">أخطاء حرجة</span>
            <span className="text-lg font-black text-rose-400 font-mono">{criticalCount}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
            <span className="text-[10px] text-amber-400 block font-bold">تحذيرات الشبكة والخدمات</span>
            <span className="text-lg font-black text-amber-400 font-mono">{warningCount}</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
            <span className="text-[10px] text-emerald-400 block font-bold">تم حلها</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Smart Quick Fix Batch Actions Bar */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white/80">
            <Wrench size={16} className="text-rose-400" />
            <span>معالجة المشاكل المكتشفة دفعة واحدة:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {criticalCount > 0 && (
              <button
                onClick={handleResolveAllCritical}
                disabled={actionLoadingMap['batch_critical']}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all border border-rose-500/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap size={13} className={actionLoadingMap['batch_critical'] ? 'animate-spin' : ''} />
                {actionLoadingMap['batch_critical'] ? 'جاري الحل...' : `حل كافة الأخطاء الحرجة (${criticalCount})`}
              </button>
            )}
            {warningCount > 0 && (
              <button
                onClick={handleResolveAllNetwork}
                disabled={actionLoadingMap['batch_network']}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCw size={13} className={actionLoadingMap['batch_network'] ? 'animate-spin' : ''} />
                {actionLoadingMap['batch_network'] ? 'جاري الحل...' : `حل أخطاء الشبكة والمهلة (${warningCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">جميع مستويات الخطورة</option>
            <option value="critical">حرجة (Critical)</option>
            <option value="warning">تحذيرات (Warning)</option>
            <option value="info">معلومات (Info)</option>
          </select>

          {/* Service Select */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">كافة الخدمات</option>
            <option value="firestore">PostgreSQL DB</option>
            <option value="auth">Custom Auth</option>
            <option value="storage">Storage & R2</option>
            <option value="ai">Gemini AI</option>
            <option value="network">Network & APIs</option>
            <option value="ui">UI Runtime</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="active">الأخطاء النشطة فقط (غير المحلولة)</option>
            <option value="all">كافة الحالات (بما فيها المحلولة)</option>
            <option value="resolved">الأخطاء التي تم حلها (Resolved)</option>
            <option value="new">جديد (New)</option>
            <option value="investigating">قيد المتابعة</option>
            <option value="ignored">متجاهل (Ignored)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="بحث في نص الخطأ، الموديول، أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full lg:w-72 bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Errors List */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <div className="text-center py-16 bg-black/20 border border-white/5 rounded-3xl p-8 space-y-3">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <h3 className="text-sm font-black text-white">لا توجد أخطاء مسجلة مطابقة</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              {statusFilter === 'active' 
                ? 'رادار الأخطاء نظيف تماماً! تم حل كافة الاستثناءات البرمجية والشبكية بنجاح.'
                : 'سجل الأخطاء نظيف تماماً! عند وقوع أي استثناء برمجي أو انقطاع شبكي سيتم التقاطه وعرضه لحظياً هنا.'}
            </p>
          </div>
        ) : (
          filteredErrors.map((err, idx) => {
            const uniqueKey = `${err.id || ''}_${err.errorId || err.signature || 'err'}_${idx}_${err.lastSeen || ''}`;
            const isExpanded = expandedErrorId === uniqueKey;
            const isResolving = actionLoadingMap[err.signature] || actionLoadingMap[uniqueKey] || false;
            const msgLower = err.errorMessage.toLowerCase();

            return (
              <div
                key={uniqueKey}
                className={`border rounded-2xl p-5 transition-all space-y-3 backdrop-blur-md ${
                  err.status === 'resolved'
                    ? 'bg-neutral-900/30 border-white/5 opacity-60'
                    : err.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/30 shadow-lg shadow-rose-950/20'
                    : 'bg-neutral-900/60 border-white/5'
                }`}
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(err.severity)}
                    {getServiceBadge(err.service)}
                    {err.module && (
                      <span className="text-[10px] text-indigo-300 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        {err.module}
                      </span>
                    )}
                    {err.occurrences > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-white font-mono">
                        تكرر {err.occurrences} مرات
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                    <span>ID: {err.errorId}</span>
                    <button
                      onClick={() => handleCopy(err.errorId, err.errorId)}
                      className="p-1 hover:text-white transition-colors"
                      title="نسخ معرف الخطأ"
                    >
                      {copiedId === err.errorId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                    <span>• {new Date(err.lastSeen).toLocaleTimeString('ar-IQ')}</span>
                  </div>
                </div>

                {/* Error Message Box */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-3.5 font-mono text-xs text-white/90 leading-relaxed overflow-x-auto select-all">
                  {err.errorMessage}
                </div>

                {/* Context Badges */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-white/50">
                  {err.screen && <span>الشاشة: <strong className="text-white/70">{err.screen}</strong></span>}
                  {err.action && <span>الإجراء: <strong className="text-white/70">{err.action}</strong></span>}
                  {err.userId && <span>المستخدم: <strong className="text-white/70">{err.userId}</strong></span>}
                  <span>أول ظهور: {new Date(err.firstSeen).toLocaleTimeString('ar-IQ')}</span>
                </div>

                {/* Stack Trace Accordion */}
                {err.stackTrace && (
                  <div>
                    <button
                      onClick={() => setExpandedErrorId(isExpanded ? null : uniqueKey)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {isExpanded ? 'إخفاء مسار التتبع (Stack Trace)' : 'عرض مسار التتبع البرمجي (Stack Trace)'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-black/70 border border-white/10 rounded-xl font-mono text-[10px] text-white/70 overflow-x-auto whitespace-pre leading-relaxed relative">
                        <button
                          onClick={() => handleCopy(err.stackTrace || '', `stack_${uniqueKey}`)}
                          className="absolute top-2 left-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all text-[10px] flex items-center gap-1"
                        >
                          {copiedId === `stack_${uniqueKey}` ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                          نسخ
                        </button>
                        {err.stackTrace}
                      </div>
                    )}
                  </div>
                )}

                {/* Specific Smart Fix Action Button */}
                {err.status !== 'resolved' && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Wrench size={14} className="text-amber-400" />
                      <span className="text-xs font-bold text-white/80">
                        {err.service === 'firestore' || msgLower.includes('permission') || msgLower.includes('auth')
                          ? 'إصلاح مقترح: تجديد توكن المصادقة وإعادة مواءمة صلاحيات المستخدم'
                          : err.service === 'network' || msgLower.includes('timeout') || msgLower.includes('504')
                          ? 'إصلاح مقترح: تنشيط قناة الشبكة وتفريغ قائمة الانتظار العالقة بالسيرفر'
                          : err.service === 'ui'
                          ? 'إصلاح مقترح: إعادة ضبط حالة الموديول ومسح الكاش المحلي للواجهة'
                          : 'إصلاح مقترح: التحقق من المورد وأرشفة الخطأ'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSmartFix(err)}
                      disabled={isResolving}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Zap size={13} className={isResolving ? 'animate-spin' : ''} />
                      {isResolving ? 'جاري المعالجة...' : 'حل المشكلة فوراً (Fix Now)'}
                    </button>
                  </div>
                )}

                {/* Status Actions Bar */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/40">الحالة:</span>
                    <button
                      onClick={() => handleStatusChange(err.id || err.errorId || err.signature, 'investigating')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        err.status === 'investigating'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      قيد المتابعة
                    </button>
                    <button
                      onClick={() => handleStatusChange(err.id || err.errorId || err.signature, 'resolved')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        err.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      تم الحل
                    </button>
                    <button
                      onClick={() => handleStatusChange(err.id || err.errorId || err.signature, 'ignored')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        err.status === 'ignored'
                          ? 'bg-neutral-700 text-white/80'
                          : 'bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      تجاهل
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(err.id || err.errorId || err.signature)}
                    className="text-[10px] text-rose-400/80 hover:text-rose-400 hover:underline flex items-center gap-1 transition-all"
                  >
                    <Trash2 size={11} /> حذف السجل
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

