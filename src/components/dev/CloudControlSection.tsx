import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Radio,
  Sparkles,
  DollarSign,
  UserPlus,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Smartphone,
  Eye,
  Activity,
  Palette,
  Calendar,
  Layers,
  Check,
  Send,
  Upload,
  Database
} from 'lucide-react';
import { RemoteConfig, saveRemoteConfigToServer, fetchRemoteConfigFromServer } from '../../services/remoteConfig';
import { THEME_PRESETS, ACCENT_STYLES, ThemePresetInfo } from '../../utils/themePresets';
import { broadcastService } from '../../services/broadcastService';
import { logActivity } from '../../utils/auditLogger';
import { realtimeManager } from '../../lib/realtimeManager';

export type SystemModalType = 'maintenance' | 'system_pause' | 'update_force' | 'update_optional' | 'new_version_announcement';

interface CloudControlSectionProps {
  remoteConfig: RemoteConfig;
  setRemoteConfig: React.Dispatch<React.SetStateAction<RemoteConfig>>;
  onPreviewModal: (type: SystemModalType) => void;
  triggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CloudControlSection: React.FC<CloudControlSectionProps> = ({
  remoteConfig,
  setRemoteConfig,
  onPreviewModal,
  triggerToast
}) => {
  const [savingRemoteConfig, setSavingRemoteConfig] = useState(false);
  const [isBroadcastingTheme, setIsBroadcastingTheme] = useState(false);

  // Sync latest from server on mount and subscribe to realtime updates
  useEffect(() => {
    let isCancelled = false;

    fetchRemoteConfigFromServer().then((cfg) => {
      if (!isCancelled && cfg) {
        setRemoteConfig(prev => ({ ...prev, ...cfg }));
      }
    });

    const unsub = realtimeManager.subscribe('system_config', (event?: any) => {
      if (isCancelled) return;
      if (event?.data) {
        setRemoteConfig(prev => ({ ...prev, ...event.data }));
      } else {
        fetchRemoteConfigFromServer().then(cfg => {
          if (!isCancelled && cfg) setRemoteConfig(prev => ({ ...prev, ...cfg }));
        });
      }
    });

    return () => {
      isCancelled = true;
      unsub();
    };
  }, [setRemoteConfig]);

  const handleSave = async () => {
    setSavingRemoteConfig(true);
    try {
      const result = await saveRemoteConfigToServer(remoteConfig);
      if (result.success) {
        await logActivity({
          action: 'تحديث التحكم عن بعد والتكوين السحابي',
          details: 'تم حفظ إعدادات التحكم السحابي والسمات وتطبيقها عبر خادم Express السحابي',
          targetId: 'remote_control_seasonal_theme',
          targetType: 'system_config'
        });
        triggerToast('✅ تم حفظ وتطبيق التغييرات سحابياً عبر السيرفر بنجاح!', 'success');
      } else {
        triggerToast('⚠️ تم الحفظ محلياً مع جدولة المزامنة السحابية', 'info');
      }
    } catch (err: any) {
      console.error('Error saving remote config:', err);
      triggerToast('حدث خطأ أثناء الحفظ على السيرفر', 'error');
    } finally {
      setSavingRemoteConfig(false);
    }
  };

  const handleBroadcastThemeNotice = async () => {
    const preset = THEME_PRESETS[remoteConfig.seasonalTheme] || THEME_PRESETS.default;
    const title = remoteConfig.themeCardTitle || preset.defaultCardTitle;
    const message = remoteConfig.themeMessage || preset.defaultMessage;

    setIsBroadcastingTheme(true);
    try {
      await broadcastService.sendBroadcast({
        schoolId: 'all',
        message: `${title}: ${message}`,
        targetGrades: ['all'],
        durationHours: 72,
        author: 'إدارة السمات السحابية Central Cloud',
        subject: `تهنئة ومناسبة: ${title}`,
        targetLocation: 'both',
        type: 'seasonal_theme_broadcast'
      });

      await logActivity({
        action: 'إرسال تهنئة موسمية للمدارس',
        details: `تم بث إشعار تهنئة بمناسبة (${title}) لجميع المدارس عبر الخادم`,
        targetId: remoteConfig.seasonalTheme,
        targetType: 'broadcast_announcement'
      });

      triggerToast('تم إرسال إشعار التهنئة السحابي بنجاح إلى جميع المدارس 📢', 'success');
    } catch (err) {
      console.error('Theme notification error:', err);
      triggerToast('حدث خطأ أثناء إرسال إشعار التهنئة', 'error');
    } finally {
      setIsBroadcastingTheme(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 p-6 pb-28 text-right" dir="rtl">
      {/* Top Bar Header & Save Action */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#0A0E1A] border border-indigo-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 z-10">
          <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-2xl shadow-inner">
            <SlidersHorizontal size={28} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-white">مركز التحكم عن بُعد والتكوين السحابي 🎛️</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Database size={10} className="text-emerald-400" />
                مربوط بخادم Express ومحرك PostgreSQL السحابي ⚡
              </span>
            </div>
            <p className="text-xs text-white/60 font-bold mt-1">
              تحكم بخصائص ومفاتيح المنظومة فورياً أينما وُجد المستخدم عبر خادم Express المركزي مع مزامنة آنية.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={savingRemoteConfig}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 z-10 border border-indigo-400/40 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {savingRemoteConfig ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              <span>جاري الحفظ والتطبيق السحابي...</span>
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              <span>حفظ وتطبيق التغييرات سحابياً 🚀</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: 2 Columns for System Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Panel 1: Emergency Kill Switches */}
        <div className="bg-[#0A0E1A] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">قواطع الطوارئ والتحكم الشامل (Kill Switches)</h3>
              <p className="text-[11px] text-white/50 font-bold">تعطيل فوري لوظائف النظام الرئيسية أو إيقاف المنظومة للصيانة</p>
            </div>
          </div>

          {/* Maintenance Mode Card */}
          <div className={`p-4 rounded-2xl border transition-all ${remoteConfig.maintenanceMode ? 'bg-rose-950/30 border-rose-500/50' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className={remoteConfig.maintenanceMode ? 'text-rose-400 animate-bounce' : 'text-white/40'} size={24} />
                <div>
                  <h4 className="text-sm font-black text-white">وضع الصيانة العامة (Under Maintenance)</h4>
                  <p className="text-[11px] text-white/40">حجب كامل لواجهة المستخدم وعرض شاشة الصيانة المغلقة فورياً</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.maintenanceMode}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {remoteConfig.maintenanceMode && (
              <div className="mt-4 pt-3 border-t border-rose-500/20 space-y-2">
                <label className="text-[10px] text-rose-300 font-bold block">رسالة الصيانة الموجهة للمستخدمين:</label>
                <textarea
                  value={remoteConfig.maintenanceMessage}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                  className="w-full bg-black/40 border border-rose-500/30 rounded-xl p-3 text-xs text-white placeholder-white/20 outline-none focus:border-rose-400 h-20 resize-none font-bold"
                  placeholder="اكتب سبب الصيانة وموعد العودة المتوقع..."
                />
                <button
                  type="button"
                  onClick={() => onPreviewModal('maintenance')}
                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold rounded-lg border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>معاينة شاشة الصيانة كما يراها المستخدم</span>
                </button>
              </div>
            )}
          </div>

          {/* System Paused Card */}
          <div className={`p-4 rounded-2xl border transition-all ${remoteConfig.systemPaused ? 'bg-amber-950/30 border-amber-500/50' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className={remoteConfig.systemPaused ? 'text-amber-400' : 'text-white/40'} size={24} />
                <div>
                  <h4 className="text-sm font-black text-white">إيقاف مؤقت للمنظومة (Pause System)</h4>
                  <p className="text-[11px] text-white/40">توقيف مؤقت مع عرض سبب التوقف وموعد العودة التقديري</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.systemPaused}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, systemPaused: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {remoteConfig.systemPaused && (
              <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-3">
                <div>
                  <label className="text-[10px] text-amber-300 font-bold block mb-1">سبب التوقف المؤقت:</label>
                  <input
                    type="text"
                    value={remoteConfig.systemPauseReason}
                    onChange={(e) => setRemoteConfig(prev => ({ ...prev, systemPauseReason: e.target.value }))}
                    className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-amber-400 font-bold"
                    placeholder="مثال: تحديث أمني دوري لقواعد البيانات..."
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-300 font-bold block mb-1">الموعد التقديري للعودة (ETA):</label>
                  <input
                    type="text"
                    value={remoteConfig.systemPauseEta || ''}
                    onChange={(e) => setRemoteConfig(prev => ({ ...prev, systemPauseEta: e.target.value }))}
                    className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-amber-400 font-bold"
                    placeholder="مثال: اليوم الساعة 6:00 مساءً"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onPreviewModal('system_pause')}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>معاينة نافذة الإيقاف المؤقت</span>
                </button>
              </div>
            )}
          </div>

          {/* Granular Subsystem Toggles */}
          <div className="space-y-3 pt-2">
            <h5 className="text-[11px] font-black text-white/40 uppercase tracking-widest">الموديولات والخدمات الفرعية</h5>

            {/* AI Features */}
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className={remoteConfig.aiFeaturesEnabled ? 'text-indigo-400' : 'text-white/20'} size={20} />
                <div>
                  <h4 className="text-xs font-black text-white">الذكاء الاصطناعي والمساعد الذكي (AI Features)</h4>
                  <p className="text-[10px] text-white/40">تفعيل أو تعطيل محرك الذكاء الاصطناعي وتوليد الاختبارات الفوري</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.aiFeaturesEnabled}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, aiFeaturesEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Live Radio */}
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className={remoteConfig.liveRadioEnabled ? 'text-emerald-400' : 'text-white/20'} size={20} />
                <div>
                  <h4 className="text-xs font-black text-white">الإذاعة المدرسية والبث المباشر (School Radio)</h4>
                  <p className="text-[10px] text-white/40">تشغيل أو إيقاف محطة البث الإذاعي والموسيقى المدرسية</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.liveRadioEnabled}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, liveRadioEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Online Payments */}
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className={remoteConfig.onlinePaymentsEnabled ? 'text-amber-400' : 'text-white/20'} size={20} />
                <div>
                  <h4 className="text-xs font-black text-white">الدفع الإلكتروني والأقساط (Online Payments)</h4>
                  <p className="text-[10px] text-white/40">إتاحة أو تعليق بوابات الدفع الإلكتروني عبر بطاقات الدفع</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.onlinePaymentsEnabled}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, onlinePaymentsEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* New Registrations */}
            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className={remoteConfig.newRegistrationsEnabled ? 'text-cyan-400' : 'text-white/20'} size={20} />
                <div>
                  <h4 className="text-xs font-black text-white">تسجيل الطلاب والمدارس الجديدة (Registrations)</h4>
                  <p className="text-[10px] text-white/40">فتح أو إغلاق نافذة التسجيل العام وطلب الانضمام للمنظومة</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.newRegistrationsEnabled}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, newRegistrationsEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Panel 2: System Dialogs, Versions & Stores */}
        <div className="bg-[#0A0E1A] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">نوافذ المنظومة وإصدارات التطبيق (Dialogs & Versions)</h3>
              <p className="text-[11px] text-white/50 font-bold">فرض التحديثات وتوجيه المستخدمين لمتاجر التطبيقات</p>
            </div>
          </div>

          {/* Force Update Trigger */}
          <div className={`p-4 rounded-2xl border transition-all ${remoteConfig.forceUpdateActive ? 'bg-indigo-950/30 border-indigo-500/50' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">تفعيل التحديث الإجباري (Force Update)</h4>
                <p className="text-[11px] text-white/40">إلزام المستخدمين الذين يحملون إصداراً أقدم من الحد الأدنى بالتحديث</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.forceUpdateActive}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, forceUpdateActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onPreviewModal('update_force')}
                className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Eye size={12} />
                <span>معاينة نافذة التحديث الإجباري</span>
              </button>
            </div>
          </div>

          {/* Optional Update Trigger */}
          <div className={`p-4 rounded-2xl border transition-all ${remoteConfig.optionalUpdateActive ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">تفعيل التحديث الاختياري (Optional Update)</h4>
                <p className="text-[11px] text-white/40">إشعار المستخدم بوجود إصدار أحدث مع إمكانية التخطي أو التذكير لاحقاً</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.optionalUpdateActive}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, optionalUpdateActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onPreviewModal('update_optional')}
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-bold rounded-lg border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Eye size={12} />
                <span>معاينة نافذة التحديث الاختياري</span>
              </button>
            </div>
          </div>

          {/* New Version Announcement Dialog */}
          <div className={`p-4 rounded-2xl border transition-all ${remoteConfig.newVersionNoticeActive ? 'bg-purple-950/30 border-purple-500/50' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">إعلان الإصدار الجديد (New Version Announcement)</h4>
                <p className="text-[11px] text-white/40">عرض بطاقة احتفالية للمستخدمين تشرح الميزات والتغييرات في النسخة الجديدة</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={remoteConfig.newVersionNoticeActive}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, newVersionNoticeActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="mt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => onPreviewModal('new_version_announcement')}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold rounded-lg border border-purple-500/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <Eye size={12} />
                <span>معاينة إعلان الإصدار الجديد</span>
              </button>
            </div>
          </div>

          {/* Versions Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-white/50 font-bold block mb-1">الحد الأدنى المطلوب للإصدار (Min Version):</label>
              <input
                type="text"
                value={remoteConfig.minRequiredVersion}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, minRequiredVersion: e.target.value }))}
                placeholder="1.0.0"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 font-bold block mb-1">أحدث إصدار متاح بالمتجر (Latest Version):</label>
              <input
                type="text"
                value={remoteConfig.latestVersion}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, latestVersion: e.target.value }))}
                placeholder="1.2.0"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Store URLs */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-white/50 font-bold block mb-1">رابط Google Play Store:</label>
              <input
                type="text"
                value={remoteConfig.playStoreUrl}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, playStoreUrl: e.target.value }))}
                placeholder="https://play.google.com/store/apps/..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 font-bold block mb-1">رابط Apple App Store:</label>
              <input
                type="text"
                value={remoteConfig.appStoreUrl}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, appStoreUrl: e.target.value }))}
                placeholder="https://apps.apple.com/app/..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/50 font-bold block mb-1">سجل التغييرات والميزات الجديدة (Changelog):</label>
              <textarea
                value={remoteConfig.updateChangelog}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, updateChangelog: e.target.value }))}
                placeholder="• إضافة ميزة البث المباشر&#10;• تحسين سرعة التطبيق..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-500 h-20 resize-none font-bold"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Panel 3: Global Dynamic Ticker Marquee Settings */}
      <div className="bg-[#0A0E1A] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">شريط الأخبار والتعاميم المتحرك العام (Global Dynamic Marquee)</h3>
              <p className="text-[11px] text-white/50 font-bold">بث رسالة نصية متحركة تظهر في أعلى واجهات كافة المدارس والمستخدمين</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={remoteConfig.tickerEnabled}
              onChange={(e) => setRemoteConfig(prev => ({ ...prev, tickerEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {remoteConfig.tickerEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="md:col-span-3">
              <label className="text-[10px] text-white/40 font-bold block mb-1">نص الرسالة المتحركة:</label>
              <input
                type="text"
                value={remoteConfig.tickerText}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, tickerText: e.target.value }))}
                placeholder="اكتب نص الإعلان المتحرك..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 outline-none focus:border-amber-400 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 font-bold block mb-1">سرعة الحركة:</label>
              <select
                value={remoteConfig.tickerSpeed}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, tickerSpeed: e.target.value as any }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-amber-400 font-bold cursor-pointer"
              >
                <option value="slow">بطيئة (هادئة للقراءة)</option>
                <option value="medium">متوسطة (افتراضية)</option>
                <option value="fast">سريعة</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Panel 4: Cloud Themes Management Center v2 */}
      <div className="bg-[#0A0E1A] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-indigo-500/20 text-amber-300 rounded-xl border border-amber-500/30">
              <Palette size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">مركز إدارة السمات والمناسبات السحابية (Cloud Themes Center v2)</h3>
              <p className="text-[11px] text-white/50 font-bold">تطبيق سمات بصرية موسمية، ومؤثرات جزيئية، وتخصيص هوية المدارس فورياً</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white/60">تفعيل السمة عالمياً:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={remoteConfig.themeActive}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-indigo-500"></div>
            </label>
          </div>
        </div>

        {/* Theme Presets Selection Grid */}
        <div className="space-y-3">
          <label className="text-xs font-black text-white/70 block">اختر المناسبة أو السمة الموسمية:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.values(THEME_PRESETS).map((preset: ThemePresetInfo) => {
              const isSelected = remoteConfig.seasonalTheme === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setRemoteConfig(prev => ({
                      ...prev,
                      seasonalTheme: preset.id,
                      themeCardTitle: preset.defaultCardTitle,
                      themeMessage: preset.defaultMessage,
                      themeAccentColor: preset.defaultAccent,
                      themeEffectType: preset.suggestedEffect,
                      seasonalHeroText: preset.defaultMessage
                    }));
                  }}
                  className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/40 border-indigo-400 shadow-lg shadow-indigo-500/20'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{preset.icon}</span>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-indigo-500 text-white">
                        <Check size={12} />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{preset.nameAr}</h4>
                    <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{preset.defaultCardTitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Settings Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
          {/* Schedule Dates */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white/80 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-400" />
              <span>جدولة تواريخ السمة (اختياري)</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-white/40 font-bold block mb-1">تاريخ البدء:</label>
                <input
                  type="date"
                  value={remoteConfig.themeStartDate || ''}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeStartDate: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold block mb-1">تاريخ الانتهاء:</label>
                <input
                  type="date"
                  value={remoteConfig.themeEndDate || ''}
                  onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeEndDate: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/30">
              * في حال ترك التواريخ فارغة، سيتم تفعيل السمة مباشرة بناءً على مفتاح التشغيل العام.
            </p>
          </div>

          {/* Banner Messages & Titles */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white/80 flex items-center gap-2">
              <Layers size={16} className="text-purple-400" />
              <span>نصوص وبطاقات المناسبة</span>
            </h4>
            <div>
              <label className="text-[10px] text-white/40 font-bold block mb-1">عنوان بطاقة التهنئة:</label>
              <input
                type="text"
                value={remoteConfig.themeCardTitle || ''}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeCardTitle: e.target.value }))}
                placeholder="عنوان التهنئة..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 font-bold block mb-1">رسالة التهنئة:</label>
              <input
                type="text"
                value={remoteConfig.themeMessage || ''}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeMessage: e.target.value }))}
                placeholder="رسالة التهنئة والترحيب..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Accent Colors Palette Selection */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <label className="text-xs font-black text-white/70 block">لون التمييز الأساسي (Accent Color):</label>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(ACCENT_STYLES).map(([key, style]) => {
              const isSelected = remoteConfig.themeAccentColor === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRemoteConfig(prev => ({ ...prev, themeAccentColor: key as any }))}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-white/10 border-white text-white shadow-lg'
                      : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${style.badgeBg} border border-white/20`} />
                  <span>{style.nameAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mascot & Particle Effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
          {/* Mascot Upload */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white/80">شخصية أو أيقونة المناسبة (Mascot / Icon):</h4>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer">
                <Upload size={14} />
                <span>رفع صورة شخصية (WebP/PNG)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const maxDim = 200;
                        let width = img.width;
                        let height = img.height;
                        if (width > height) {
                          if (width > maxDim) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                          }
                        } else {
                          if (height > maxDim) {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                          }
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/webp', 0.75);
                          setRemoteConfig(prev => ({ ...prev, themeMascotUrl: compressedBase64 }));
                          triggerToast('تم ضغط ورفع صورة شخصية المناسبة بنجاح 🖼️', 'success');
                        }
                      };
                      img.src = evt.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              {remoteConfig.themeMascotUrl && (
                <button
                  type="button"
                  onClick={() => setRemoteConfig(prev => ({ ...prev, themeMascotUrl: '' }))}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all"
                >
                  استعادة الافتراضي
                </button>
              )}
            </div>
            {remoteConfig.themeMascotUrl && (
              <div className="w-16 h-16 rounded-xl border border-white/10 bg-black/40 p-1 flex items-center justify-center overflow-hidden">
                <img src={remoteConfig.themeMascotUrl} alt="Mascot" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* Effects & Broadcast Action */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-white/80">المؤثرات الجزيئية الحركية (Particle Effects):</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remoteConfig.themeEffectsEnabled}
                    onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeEffectsEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <select
                value={remoteConfig.themeEffectType || 'ambient'}
                onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeEffectType: e.target.value as any }))}
                disabled={!remoteConfig.themeEffectsEnabled}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 disabled:opacity-40"
              >
                <option value="ambient">إضاءة محيطية هادئة (Ambient Glow)</option>
                <option value="particles">جزيئات عائمة (Floating Particles)</option>
                <option value="crescent_stars">هلال ونجوم متلألئة (Ramadan Crescents)</option>
                <option value="confetti">قصاصات ورقية احتفالية (Celebration Confetti)</option>
                <option value="lanterns">فوانيس متأرجحة (Swinging Lanterns)</option>
              </select>
            </div>

            {/* Broadcast Notice Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBroadcastThemeNotice}
                disabled={isBroadcastingTheme}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBroadcastingTheme ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                <span>إرسال إشعار عام لجميع المدارس بهذه المناسبة عبر الخادم 📢</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 5: Quick Support Hotlines & Links */}
      <div className="bg-[#0A0E1A] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">قنوات الدعم الفني المباشر (Direct Support Hotlines)</h3>
              <p className="text-[11px] text-white/50 font-bold">تحديث أرقام الواتساب وروابط التليجرام لزر الدعم في لوحات المستخدمين</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={remoteConfig.supportButtonEnabled}
              onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportButtonEnabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-[10px] text-white/40 font-bold block mb-1">رقم واتساب الدعم الفني المباشر:</label>
            <input
              type="text"
              value={remoteConfig.supportWhatsapp}
              onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportWhatsapp: e.target.value }))}
              placeholder="+964..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/40 font-bold block mb-1">رابط حساب تليجرام الدعم المباشر:</label>
            <input
              type="text"
              value={remoteConfig.supportTelegram}
              onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportTelegram: e.target.value }))}
              placeholder="https://t.me/..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-white/40 font-bold block mb-1">رابط قناة التعاميم والإعلانات الرسمية:</label>
            <input
              type="text"
              value={remoteConfig.supportChannelUrl}
              onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportChannelUrl: e.target.value }))}
              placeholder="https://t.me/..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
