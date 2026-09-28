import React, { useState, useEffect } from "react";
import { Shield, UserCheck, School, Key, RefreshCw, AlertTriangle, CheckCircle, Database, Trash2, Send, Lock, Globe, Smartphone, Activity } from "lucide-react";
import { db, addDoc, collection, serverTimestamp } from "../../lib/firebase";

interface AccountSupportAuditSectionProps {
  userProfile: any;
  showToast?: (msg: string, type: "success" | "error" | "info") => void;
  schoolId: string;
}

export function AccountSupportAuditSection({ userProfile, showToast, schoolId }: AccountSupportAuditSectionProps) {
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [storageItems, setStorageItems] = useState<{ key: string; value: string }[]>([]);

  const loadStorage = () => {
    try {
      const keysToInspect = [
        "bayraq_cached_user_profile",
        "bayraq_user_role",
        "s6_selectedSchoolId",
        "s6_isSchoolVerified",
        "bairaq_jwt_token",
        "bairaq_device_uuid",
        "s6_user_logged_out",
        "app_has_seen_onboarding"
      ];
      const items = keysToInspect.map(k => ({
        key: k,
        value: localStorage.getItem(k) || "(فارغ / غير موجود)"
      }));
      setStorageItems(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const handleSendMismatchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) {
      showToast?.("يرجى تحديد سبب الإبلاغ", "error");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await addDoc(collection(db, "admin_outbox"), {
        type: "ACCOUNT_SCHOOL_MISMATCH_REPORT",
        userId: userProfile?.uid || "unknown",
        userEmail: userProfile?.email || "unknown",
        userName: userProfile?.fullName || userProfile?.name || "مستخدم",
        role: userProfile?.role || "unknown",
        reportedSchoolId: schoolId || userProfile?.schoolId || "unknown",
        reason: reportReason,
        details: reportDetails,
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        status: "pending"
      });

      showToast?.("تم إرسال بلاغ عدم التطابق إلى مركز الدعم الفني والمطور بنجاح", "success");
      setReportReason("");
      setReportDetails("");
    } catch (err) {
      console.error("Error sending mismatch report:", err);
      showToast?.("تعذر إرسال البلاغ. يرجى المحاولة لاحقاً", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const clearProfileCacheOnly = () => {
    try {
      localStorage.removeItem("bayraq_cached_user_profile");
      localStorage.removeItem("s6_isSchoolVerified");
      loadStorage();
      showToast?.("تم مسح كاش ملف المستخدم بنجاح للاستعادة الآمنة", "success");
    } catch (e) {
      showToast?.("حدث خطأ أثناء مسح الكاش", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 p-2 sm:p-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300 text-xs font-bold mb-3">
              <Shield size={14} className="text-blue-400" />
              مركز تدقيق الجلسة والهوية (Forensic & Support)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              مركز الدعم والحساب المدمج في لوحة المطور
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl">
              أداة تشخيصية متقدمة لعزل الجلسات، فحص تخزين المتصفح، مراقبة هوية المستخدم والمدرسة الحالية، والإبلاغ المباشر عن أي تضارب في السياق.
            </p>
          </div>
          <button
            onClick={loadStorage}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>تحديث وفحص الذاكرة المحلية</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Session Forensic Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0A0F1D]/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <UserCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">هوية المستخدم والجلسة</h3>
                <p className="text-xs text-slate-400">البيانات النشطة حالياً في الذاكرة</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">معرّف المستخدم (UID):</span>
                <span className="text-white font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">{userProfile?.uid || "(غير متوفر)"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">الاسم الكامل:</span>
                <span className="text-white font-bold">{userProfile?.fullName || userProfile?.name || "(غير محدد)"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">البريد الإلكتروني:</span>
                <span className="text-slate-200">{userProfile?.email || "(بدون بريد)"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">الدور (Role):</span>
                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg font-bold border border-amber-500/20">{userProfile?.role || "student"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">معرّف المدرسة (School ID):</span>
                <span className="text-cyan-400 font-mono font-bold">{schoolId || userProfile?.schoolId || "school1"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">حالة الجلسة:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  نشطة ومؤمنة
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={clearProfileCacheOnly}
                className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-xl text-rose-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={15} />
                <span>مسح كاش الملف الشخصي وإعادة المزامنة</span>
              </button>
            </div>
          </div>

          {/* Quick Storage Key Inspector */}
          <div className="bg-[#0A0F1D]/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
              <Database size={16} className="text-indigo-400" />
              مفاتيح التخزين المحلي (Storage Inspector)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
              {storageItems.map((item, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl text-[11px]">
                  <div className="text-indigo-300 font-mono font-bold mb-1 truncate">{item.key}</div>
                  <div className="text-slate-400 font-mono truncate bg-black/40 p-1.5 rounded">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Report School / Account Mismatch */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A0F1D]/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">الإبلاغ عن عدم تطابق المدرسة أو الحساب</h3>
                  <p className="text-xs text-slate-400">أداة مخصصة لإرسال بلاغ فوري وشامل لفرقة التطوير والدعم الفني عند حدوث أي تداخل في السياق</p>
                </div>
              </div>

              <form onSubmit={handleSendMismatchReport} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">نوع المشكلة أو عدم التطابق:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">-- اختر نوع المشكلة للتشخيص --</option>
                    <option value="SCHOOL_MISMATCH">ظهور مدرسة خاطئة أو غير تابعة للمستخدم</option>
                    <option value="ROLE_MISMATCH">ظهور صلاحيات دور خاطئ (مثل ظهور واجهة إدارة بدل ولي أمر)</option>
                    <option value="CACHED_PREVIOUS_USER">ظهور بيانات مستخدم سابق بعد تسجيل الخروج والدخول</option>
                    <option value="DEFAULT_ACADEMY_FALLBACK">ظهور "أكاديمية بيرق الرقمية" بشكل مفاجئ</option>
                    <option value="OTHER">مشكلة أخرى في الجلسة أو الهوية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">تفاصيل إضافية ووصف الحالة:</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="اكتب تفاصيل ما حدث (مثال: كنت مسجلاً كولي أمر للطالب فلان، وبعد إغلاق التطبيق ظهرت لي واجهة إدارة مدرسة بيرق)..."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-950/30 border border-blue-500/20 rounded-2xl p-4 text-xs text-blue-200 flex items-start gap-3">
                  <Activity size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">معلومات التشخيص التلقائية التي سيتم إرفاقها مع البلاغ:</span>
                    معرّف المستخدم، الدور الحالي، معرّف المدرسة النشطة، نوع المتصفح، وجلسة التخزين المحلي لتسهيل الفحص الجنائي من قبل المطور.
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingReport ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    <span>إرسال البلاغ التشخيصي لفريق المطورين</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
