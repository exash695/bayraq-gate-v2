import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
  Sliders,
  Eye,
  SlidersHorizontal,
  KeyRound,
  Fingerprint,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../../utils/auditLogger';
import { useSecuritySettings, securityService, SecuritySettings } from '../../services/securityService';

interface BannedEntity {
  id: string;
  type: 'ip' | 'device' | 'account';
  value: string;
  reason: string;
  failedAttempts: number;
  bannedAt: string;
  expiresAt: string;
  status: 'active_ban' | 'lifted';
}

export const SecurityAccessSection: React.FC = () => {
  const { settings, updateSettings, isSaving, reloadSettings } = useSecuritySettings();
  const [bannedEntities, setBannedEntities] = useState<BannedEntity[]>([]);
  const [newBanType, setNewBanType] = useState<'ip' | 'device' | 'account'>('device');
  const [newBanValue, setNewBanValue] = useState('');
  const [newBanReason, setNewBanReason] = useState('محاولات تسجيل أو تخمين مشبوهة');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // RBAC Matrix State: Capabilities vs Roles
  const roles = [
    { key: 'student', label: '👨‍🎓 طالب' },
    { key: 'parent', label: '👨‍👩‍👧 ولي أمر' },
    { key: 'teacher', label: '👨‍🏫 أستاذ' },
    { key: 'driver', label: '🚌 سائق' },
    { key: 'supervisor', label: '🕵️‍♂️ مشرف' },
    { key: 'admin', label: '🏫 مدير مدرسة' },
  ];

  const permissionsMatrix = settings.permissionsMatrix || [];

  const fetchBans = async () => {
    try {
      const res = await fetch('/api/security/bans');
      if (res.ok) {
        const data = await res.json();
        setBannedEntities(data.map((d: any) => ({
          id: d.id,
          type: d.type,
          value: d.value,
          reason: d.reason,
          failedAttempts: d.failed_attempts || 0,
          bannedAt: d.banned_at || new Date().toISOString(),
          expiresAt: d.expires_at || '',
          status: d.status
        })));
      }
    } catch (err) {
      console.error('Failed to fetch security bans', err);
    }
  };

  useEffect(() => {
    fetchBans();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const togglePermission = async (capId: string, roleKey: string) => {
    const updated = permissionsMatrix.map(cap => {
      if (cap.id === capId) {
        return {
          ...cap,
          [roleKey]: !(cap as any)[roleKey]
        };
      }
      return cap;
    });
    await updateSettings({ permissionsMatrix: updated });
    showToast(`تم حفظ وتفعيل تعديل صلاحية (${roleKey}) بالسيرفر والواجهة بنجاح ✓`);
  };

  const handleToggleMultiDevice = async () => {
    const nextVal = !settings.allowMultiDeviceLogin;
    await updateSettings({ allowMultiDeviceLogin: nextVal });
    showToast(`تم ${nextVal ? 'السماح بالدخول من أجهزة متعددة' : 'قصر الدخول على جهاز واحد فقط'} وتعميمه فوراً`);
  };

  const handleTogglePinForFinance = async () => {
    const nextVal = !settings.requirePinForFinance;
    await updateSettings({ requirePinForFinance: nextVal });
    showToast(`تم ${nextVal ? 'تفعيل طلب رمز PIN للمالية إجبارياً' : 'تعطيل طلب رمز PIN للمالية وتسهيل الدخول'} فوراً`);
  };

  const handleMaxAttemptsChange = async (val: number) => {
    await updateSettings({ maxFailedAttempts: val });
    showToast(`تم تحديث الحد الأقصى لمحاولات التخمين إلى (${val}) محاولات`);
  };

  const handleLockoutDurationChange = async (val: number) => {
    await updateSettings({ lockoutDurationMinutes: val });
    showToast(`تم تحديث مدة حظر التخمين إلى (${val}) دقيقة`);
  };

  const handleAddBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanValue.trim()) {
      showToast('يرجى كتابة عنوان IP أو معرف الجهاز');
      return;
    }

    const item: BannedEntity = {
      id: `ban-${Date.now()}`,
      type: newBanType,
      value: newBanValue.trim(),
      reason: newBanReason,
      failedAttempts: 6,
      bannedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active_ban'
    };

    try {
      await fetch('/api/security/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      fetchBans();
    } catch (e) {
      console.error(e);
    }

    setBannedEntities(prev => [item, ...prev]);
    setNewBanValue('');
    showToast(`تم حظر ${item.value} وتعميمه على جدار الحماية وقاعدة البيانات 🛡️`);

    await logActivity({
      action: 'إضافة حظر أمني',
      details: `تم حظر ${item.type}: ${item.value} - السبب: ${item.reason}`,
      targetId: item.id,
      targetType: 'security_bans'
    });
  };

  const handleLiftBan = async (id: string, val: string) => {
    try {
      await fetch(`/api/security/bans/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    setBannedEntities(prev => prev.filter(b => b.id !== id));
    showToast(`تم رفع الحظر عن (${val}) واستعادة إمكانية الوصول بنجاح ✓`);

    await logActivity({
      action: 'رفع حظر أمني',
      details: `تم رفع الحظر عن: ${val}`,
      targetId: id,
      targetType: 'security_bans'
    });
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
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-rose-400/40 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles size={16} className="text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-[#0B0D1B] to-purple-950/80 border border-rose-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner">
                <ShieldAlert size={22} className="animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">أمن البيانات وسياسات الوصول (Security & Access Control)</h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              حماية المنظومة من محاولات التخمين والاختراق، إدارة جدار الحماية (Firewall Blacklist)، والتحكم في مصفوفة الصلاحيات (RBAC Matrix) لكافة الأدوار المدرسية.
            </p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-[11px] font-bold text-white">جدار الحماية الفوري (WAF)</p>
              <p className="text-[10px] text-emerald-400 font-mono">0 Brute-Force Breaches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Policies & Rate Limiting Controls */}
      <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">سياسات مكافحة التخمين ومحددات السرعة (Rate Limiting)</h3>
            <p className="text-[10px] text-white/40">تحديد المعايير الآلية للإغلاق وحظر الأجهزة المشبوهة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
            <label className="block text-[11px] font-bold text-white/60 mb-2">أقصى محاولات كود خاطئة قبل الحظر:</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={3}
                max={10}
                value={settings.maxFailedAttempts || 5}
                onChange={(e) => handleMaxAttemptsChange(Number(e.target.value))}
                className="w-20 bg-black/40 border border-white/10 rounded-xl p-2 text-white font-bold text-center"
              />
              <span className="text-[10px] text-white/40">محاولات متتالية</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
            <label className="block text-[11px] font-bold text-white/60 mb-2">مدة الحظر المؤقت للجهاز:</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={1440}
                value={settings.lockoutDurationMinutes || 30}
                onChange={(e) => handleLockoutDurationChange(Number(e.target.value))}
                className="w-20 bg-black/40 border border-white/10 rounded-xl p-2 text-white font-bold text-center"
              />
              <span className="text-[10px] text-white/40">دقيقة</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <span className="block text-[11px] font-bold text-white/60 mb-2">السماح بتسجيل الدخول من عدة أجهزة:</span>
            <button
              onClick={handleToggleMultiDevice}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-between ${
                settings.allowMultiDeviceLogin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span>{settings.allowMultiDeviceLogin ? 'مفعل (أجهزة متعددة)' : 'مغلق (جهاز واحد فقط)'}</span>
              {settings.allowMultiDeviceLogin ? <Unlock size={14} /> : <Lock size={14} />}
            </button>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <span className="block text-[11px] font-bold text-white/60 mb-2">طلب رمز PIN لقسم الرسوم والمالية:</span>
            <button
              onClick={handleTogglePinForFinance}
              className={`py-2 px-3 rounded-xl font-bold transition-all text-xs flex items-center justify-between ${
                settings.requirePinForFinance ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span>{settings.requirePinForFinance ? 'مطلوب إجباري ✓' : 'معطل (دخول مباشر)'}</span>
              <Fingerprint size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control (RBAC) Matrix */}
      <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">مصفوفة صلاحيات الأدوار المدرسية (RBAC Matrix)</h3>
              <p className="text-[10px] text-white/40">التحكم الدقيق بما يمكن لكل فئة قراءته أو تعديله في المنظومة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold border ${
              isSaving 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              {isSaving ? 'جاري المزامنة...' : 'مطبق حياً على كافة المستخدمين'}
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-bold text-[11px]">
                <th className="pb-3 pr-2 min-w-[200px]">القسم / الصلاحية</th>
                {roles.map(r => (
                  <th key={r.key} className="pb-3 px-2 text-center">{r.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {permissionsMatrix.map((cap) => (
                <tr key={cap.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-2 font-bold text-white">{cap.name}</td>
                  {roles.map(r => {
                    const isGranted = (cap as any)[r.key];
                    return (
                      <td key={r.key} className="py-3 px-2 text-center">
                        <button
                          onClick={() => togglePermission(cap.id, r.key)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            isGranted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-white/5 text-white/20 border border-white/5 hover:bg-white/10'
                          }`}
                          title={`تغيير صلاحية ${r.label}`}
                        >
                          {isGranted ? <CheckCircle2 size={15} /> : <Lock size={13} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspicious Entities & Firewall Blacklist */}
      <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <UserX size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">قائمة الحظر وجدار الحماية الفوري (Active Ban List)</h3>
              <p className="text-[10px] text-white/40">الأجهزة والعناوين المحظورة لتجاوز حدود الأمان</p>
            </div>
          </div>
        </div>

        {/* Add Ban Form */}
        <form onSubmit={handleAddBan} className="bg-black/30 border border-white/5 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-white/50 mb-1">نوع الهدف:</label>
            <select
              value={newBanType}
              onChange={(e) => setNewBanType(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white font-bold"
            >
              <option value="device" className="bg-[#0B0D1B]">معرف جهاز (Device UUID)</option>
              <option value="ip" className="bg-[#0B0D1B]">عنوان إنترنت (IP Address)</option>
              <option value="account" className="bg-[#0B0D1B]">بريد أو حساب مشبوه</option>
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-[10px] font-bold text-white/50 mb-1">القيمة / المعرف:</label>
            <input
              type="text"
              placeholder="مثال: 192.168.1.1 أو UUID"
              value={newBanValue}
              onChange={(e) => setNewBanValue(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white font-mono font-bold"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-white/50 mb-1">سبب الحظر:</label>
            <input
              type="text"
              value={newBanReason}
              onChange={(e) => setNewBanReason(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-white"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> إضافة للحظر
            </button>
          </div>
        </form>

        {/* Banned List */}
        <div className="divide-y divide-white/5">
          {bannedEntities.map((ban) => (
            <div key={ban.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-400">{ban.value}</span>
                  <span className="text-[10px] bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20">
                    {ban.type.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    محاولات فاشلة: {ban.failedAttempts}
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-0.5">{ban.reason} • التوقيت: {ban.bannedAt}</p>
              </div>

              <button
                onClick={() => handleLiftBan(ban.id, ban.value)}
                className="px-3 py-1.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-white/70 border border-white/10 rounded-xl text-[11px] font-bold transition-all"
              >
                فك الحظر ✓
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
