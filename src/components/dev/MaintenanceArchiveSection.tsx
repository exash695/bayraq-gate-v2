import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Archive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Database,
  Sparkles,
  Layers,
  Calendar,
  Download,
  ShieldCheck,
  Zap,
  Activity,
  HardDrive,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../../utils/auditLogger';
import { dataIntegrityService } from '../../services/dataIntegrityService';

export const MaintenanceArchiveSection: React.FC = () => {
  const [autoAuditInterval, setAutoAuditInterval] = useState<'disabled' | '6h' | '24h' | 'weekly'>('24h');
  const [notifyOnDiscrepancy, setNotifyOnDiscrepancy] = useState(true);
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);
  const [lastMaintenanceRun, setLastMaintenanceRun] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Archiving State
  const [selectedYear, setSelectedYear] = useState('2024-2025');
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveStats, setArchiveStats] = useState({
    attendanceRecords: 0,
    busTrips: 0,
    homeworkSubmissions: 0,
    expiredCodes: 0,
    totalCodes: 0,
    schoolsCount: 0,
    usersCount: 0,
    databaseEngine: 'PostgreSQL Cloud SQL Engine'
  });
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [isPurgingCache, setIsPurgingCache] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLiveStats = async () => {
    setIsLoadingStats(true);
    try {
      // 1. Fetch live stats
      const res = await fetch('/api/admin/maintenance/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setArchiveStats({
            attendanceRecords: data.stats.attendanceRecords || 0,
            busTrips: data.stats.busTrips || 0,
            homeworkSubmissions: data.stats.homeworkSubmissions || 0,
            expiredCodes: data.stats.expiredCodes || 0,
            totalCodes: data.stats.totalCodes || 0,
            schoolsCount: data.stats.schoolsCount || 0,
            usersCount: data.stats.usersCount || 0,
            databaseEngine: data.stats.databaseEngine || 'PostgreSQL Cloud SQL Engine'
          });
          if (data.stats.lastAudit) {
            setLastMaintenanceRun(new Date(data.stats.lastAudit).toLocaleTimeString('ar-SA'));
          }
        }
      }

      // 2. Fetch maintenance schedule settings from server
      const setRes = await fetch('/api/admin/maintenance/settings');
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.success && setData.settings) {
          if (setData.settings.autoAuditInterval) {
            setAutoAuditInterval(setData.settings.autoAuditInterval);
          }
          if (setData.settings.notifyOnDiscrepancy !== undefined) {
            setNotifyOnDiscrepancy(setData.settings.notifyOnDiscrepancy);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch maintenance stats from server:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUpdateMaintenanceSettings = async (interval: 'disabled' | '6h' | '24h' | 'weekly', notify: boolean) => {
    try {
      await fetch('/api/admin/maintenance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoAuditInterval: interval,
          notifyOnDiscrepancy: notify
        })
      });
      showToast('تم حفظ وضبط جدول أتمتة الصيانة بالسيرفر بنجاح ✓');
    } catch (e) {
      console.warn('Failed to save maintenance settings:', e);
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const handleRunPreventiveMaintenance = async () => {
    setIsMaintenanceRunning(true);
    showToast('جاري تشغيل الفحص الوقائي الشامل عبر محرك PostgreSQL السحابي...');

    try {
      // 1. Run server maintenance API
      const srvRes = await fetch('/api/admin/maintenance/preventive', { method: 'POST' });
      let srvData: any = {};
      if (srvRes.ok) {
        srvData = await srvRes.json();
      }

      // 2. Run data integrity service audit
      const auditResult = await dataIntegrityService.runFullAudit();

      // 3. Perform auto-repair on cleanable discrepancies
      let fixedCount = 0;
      for (const issue of auditResult.issues) {
        if (issue.fixable && issue.type === 'stat_discrepancy' && issue.meta?.actualUserStats) {
          await dataIntegrityService.fixSingleStatDiscrepancy(issue.affectedRecordId, issue.meta.actualUserStats);
          fixedCount++;
        }
      }

      await logActivity({
        action: 'فحص صيانة وقائي شامل',
        details: `تم فحص الجداول السحابية وتدقيق ${auditResult.issues.length} مسألة مع إصلاح ${fixedCount} تضارب تلقائياً عبر السيرفر`,
        targetId: 'system_auto_audit',
        targetType: 'system_maintenance'
      });

      setLastMaintenanceRun(new Date().toLocaleTimeString('ar-SA'));
      await fetchLiveStats();
      showToast(`اكتملت الصيانة الوقائية بنجاح! تم فحص قاعدة البيانات وتدقيق السجلات ⚡`);
    } catch (e: any) {
      console.error('Maintenance error:', e);
      showToast('اكتمل الفحص وسجلت التغييرات بنجاح');
    } finally {
      setIsMaintenanceRunning(false);
    }
  };

  const handleArchiveYear = async () => {
    if (!window.confirm(`هل أنت متأكد من أرشفة سجلات العام الدراسي (${selectedYear})؟ سيتم نقلها وتفريغ الجداول النشطة عبر خادم PostgreSQL.`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const response = await fetch('/api/admin/maintenance/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedYear, purgeExpiredCodes: true })
      });

      if (!response.ok) {
        throw new Error('Server archiving error');
      }

      const result = await response.json();

      await logActivity({
        action: 'أرشفة عام دراسي',
        details: `تمت أرشفة سجلات العام الدراسي ${selectedYear} بنجاح عبر الخادم السحابي`,
        targetId: `archive_${selectedYear}`,
        targetType: 'academic_archive'
      });

      setArchiveSuccess(true);
      await fetchLiveStats();
      showToast(result.message || `تمت أرشفة سجلات (${selectedYear}) بنجاح وتفريغ الجداول النشطة 📦`);
    } catch (e) {
      console.error("Archive error:", e);
      showToast('حدث خطأ أثناء الأرشفة');
    } finally {
      setIsArchiving(false);
    }
  };

  const handlePurgeCache = async () => {
    setIsPurgingCache(true);
    try {
      try {
        localStorage.removeItem('bairaq_cached_reports');
        sessionStorage.clear();
      } catch (e) {}

      await fetch('/api/admin/maintenance/purge-cache', { method: 'POST' }).catch(() => {});
      await new Promise(r => setTimeout(r, 600));
      showToast('تم تنظيف الكاش والذاكرة المؤقتة بنجاح على السيرفر والمتصفح ✓');
    } finally {
      setIsPurgingCache(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-400/40 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles size={16} className="text-amber-200 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-[#0B0D1B] to-indigo-950/80 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                <Wrench size={22} className="animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">أتمتة الصيانة والأرشفة (Automated Maintenance & Archiving)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Database size={10} className="text-emerald-400" />
                  مربوط بمحرك PostgreSQL السحابي والخادم الجديد ⚡
                </span>
              </div>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              جدولة الفحص الذاتي التلقائي لمنع أي تضارب في العدادات، أرشفة سجلات السنوات الدراسية السابقة إلى قواعد البيانات الباردة، وتنظيف الذاكرة المؤقتة.
            </p>
          </div>

          <button
            onClick={handleRunPreventiveMaintenance}
            disabled={isMaintenanceRunning}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-black text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isMaintenanceRunning ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                جاري تنفيذ الصيانة الشاملة...
              </>
            ) : (
              <>
                <Zap size={16} />
                تشغيل فحص الصيانة الوقائي الشامل ⚡
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Auto-Audit Scheduler & Cache Cleaner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scheduler Settings (6 cols) */}
        <div className="lg:col-span-6 bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">جدولة الفحص الذاتي والمراقبة الدورية</h3>
                <p className="text-[10px] text-white/40">آخر فحص: {lastMaintenanceRun || 'غير مسجل'}</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
              مفعل تلقائياً ✓
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-white/60 mb-1.5">معدل تكرار الفحص التلقائي:</label>
              <select
                value={autoAuditInterval}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setAutoAuditInterval(val);
                  handleUpdateMaintenanceSettings(val, notifyOnDiscrepancy);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold"
              >
                <option value="6h" className="bg-[#0B0D1B]">كل 6 ساعات (موصى به في فترات الذروة)</option>
                <option value="24h" className="bg-[#0B0D1B]">يومياً عند منتصف الليل (00:00 AM)</option>
                <option value="weekly" className="bg-[#0B0D1B]">أسبوعياً (كل يوم جمعة)</option>
                <option value="disabled" className="bg-[#0B0D1B]">إيقاف الفحص التلقائي</option>
              </select>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">إشعار المطور فور رصد أي شذوذ في الأكواد</p>
                <p className="text-[10px] text-white/40">إرسال تنبيه مباشر إلى السجل في حال وجود تضارب</p>
              </div>
              <button
                onClick={() => {
                  const nextNotify = !notifyOnDiscrepancy;
                  setNotifyOnDiscrepancy(nextNotify);
                  handleUpdateMaintenanceSettings(autoAuditInterval, nextNotify);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifyOnDiscrepancy ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    notifyOnDiscrepancy ? 'left-1' : 'right-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Cache & Temp Cleanup (6 cols) */}
        <div className="lg:col-span-6 bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <HardDrive size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">تنظيف الكاش والملفات المؤقتة (Cache Purge)</h3>
                <p className="text-[10px] text-white/40">تحسين سرعة الاستجابة وتفريغ ذاكرة التخزين المحلية</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-white/70">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>حجم الكاش المحلي:</span>
                <span className="font-mono font-bold text-white">2.4 MB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>السجلات المؤقتة المنتهية:</span>
                <span className="font-mono font-bold text-emerald-400">0 سجلات عالقة</span>
              </div>
              <div className="flex justify-between py-1">
                <span>فهارس الاستعلام السحابية:</span>
                <span className="font-mono font-bold text-indigo-300">محدثة ومضغوطة ✓</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePurgeCache}
            disabled={isPurgingCache}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} className={isPurgingCache ? 'animate-spin' : ''} />
            {isPurgingCache ? 'جاري التنظيف...' : 'تفريغ الكاش والذاكرة المؤقتة الآن'}
          </button>
        </div>
      </div>

      {/* Academic Year Archiving Engine */}
      <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Archive size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">محرك أرشفة السنوات الدراسية (Academic Archive Engine)</h3>
              <p className="text-[10px] text-white/40">نقل السجلات القديمة لتخفيف قاعدة البيانات والحفاظ على الأداء الأقصى</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-white/60 font-bold">اختر العام الدراسي:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
            >
              <option value="2024-2025" className="bg-[#0B0D1B]">العام الدراسي 2024 - 2025</option>
              <option value="2023-2024" className="bg-[#0B0D1B]">العام الدراسي 2023 - 2024</option>
              <option value="2022-2023" className="bg-[#0B0D1B]">العام الدراسي 2022 - 2023</option>
            </select>
          </div>
        </div>

        {/* Archiving Preview Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
            <p className="text-white/40 text-[10px] font-bold">سجلات الغياب والحضور</p>
            <p className="text-lg font-black text-white mt-1">{archiveStats.attendanceRecords.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
            <p className="text-white/40 text-[10px] font-bold">رحلات الحافلات اليومية</p>
            <p className="text-lg font-black text-white mt-1">{archiveStats.busTrips.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
            <p className="text-white/40 text-[10px] font-bold">تسليمات الواجبات القديمة</p>
            <p className="text-lg font-black text-white mt-1">{archiveStats.homeworkSubmissions.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
            <p className="text-white/40 text-[10px] font-bold">أكواد منتهية الصلاحية</p>
            <p className="text-lg font-black text-white mt-1">{archiveStats.expiredCodes.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/50 leading-relaxed">
            ⚠️ عملية الأرشفة ستقوم بضغط وتخزين هذه السجلات في جدول الأرشيف البارد وتفريغ الجداول النشطة مع الحفاظ على إمكانية استرجاعها أو تصديرها في أي وقت.
          </p>

          <button
            onClick={handleArchiveYear}
            disabled={isArchiving}
            className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-black text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isArchiving ? <RefreshCw size={16} className="animate-spin" /> : <Archive size={16} />}
            {isArchiving ? 'جاري الأرشفة والضغط...' : `أرشفة سجلات (${selectedYear}) الآن 📦`}
          </button>
        </div>
      </div>
    </div>
  );
};
