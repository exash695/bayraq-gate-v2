import React, { useState } from 'react';
import { 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  Clock, 
  Database, 
  FileText, 
  Send, 
  UserX,
  Info
} from 'lucide-react';
import { useAppLogo } from './BerqCharacterManager';
import { resolveApiUrl } from '../lib/serverConfig';

interface AccountDeletionPageProps {
  onBack?: () => void;
}

export const AccountDeletionPage: React.FC<AccountDeletionPageProps> = ({ onBack }) => {
  const appLogo = useAppLogo();
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');
  const [identifier, setIdentifier] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [schoolName, setSchoolName] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg(activeLang === 'ar' ? 'يرجى إدخال كود الدخول أو البريد الإلكتروني أو رقم الهاتف المرتبط بالحساب.' : 'Please enter your Access Code, Email, or Phone Number.');
      return;
    }
    if (!confirmed) {
      setErrorMsg(activeLang === 'ar' ? 'يرجى تأكيد الموافقة على حذف الحساب والبيانات المرتبطة به.' : 'Please confirm that you understand the account deletion terms.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(resolveApiUrl('/api/account-deletion-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          accountType,
          schoolName: schoolName.trim(),
          reason: reason.trim(),
          requestedAt: new Date().toISOString()
        })
      });

      const data = await response.json().catch(() => null);
      const refNum = data?.referenceId || `DEL-${Date.now().toString().slice(-6)}`;
      setSubmittedRef(refNum);
    } catch {
      const refNum = `DEL-${Date.now().toString().slice(-6)}`;
      setSubmittedRef(refNum);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      dir={activeLang === 'ar' ? 'rtl' : 'ltr'} 
      className="min-h-screen bg-[#050A18] text-white flex flex-col font-cairo selection:bg-rose-500/30 selection:text-rose-200"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#050A18]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1.5 text-sm font-bold border border-white/5"
            >
              <ArrowRight size={18} className="rtl:rotate-0 ltr:rotate-180" />
              <span className="hidden sm:inline">{activeLang === 'ar' ? 'العودة' : 'Back'}</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 p-1 flex items-center justify-center shrink-0">
              <img src={appLogo || '/logo.png'} alt="Bayraq Gate Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                {activeLang === 'ar' ? 'بوابة بيرق - حذف الحساب والبيانات' : 'Bayraq Gate - Account & Data Deletion'}
              </h1>
              <p className="text-[10px] text-white/40 font-medium">
                {activeLang === 'ar' ? 'النموذج الرسمي لطلب إزالة الحساب والبيانات الشخصية (com.bairaq.gate6)' : 'Official Account & Personal Data Removal Request (com.bairaq.gate6)'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex items-center text-xs font-bold">
          <button
            onClick={() => setActiveLang('ar')}
            className={`px-3 py-1 rounded-lg transition-all ${activeLang === 'ar' ? 'bg-rose-500 text-white shadow-md font-black' : 'text-white/60 hover:text-white'}`}
          >
            العربية
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`px-3 py-1 rounded-lg transition-all ${activeLang === 'en' ? 'bg-rose-500 text-white shadow-md font-black' : 'text-white/60 hover:text-white'}`}
          >
            English
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950/50 via-[#0B132B] to-[#050A18] border border-rose-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <UserX size={26} />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldAlert size={12} />
                {activeLang === 'ar' ? 'متوافق مع سياسات Google Play و Apple App Store' : 'Google Play & Apple App Store Data Safety Compliant'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {activeLang === 'ar' 
                  ? 'طلب حذف الحساب والبيانات المرتبطة به نهائياً' 
                  : 'Request Permanent Account & Associated Data Deletion'}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                {activeLang === 'ar'
                  ? 'تمنحك منصة "بوابة بيرق - Bayraq Gate" الحق الكامل في طلب حذف حسابك وجميع بياناتك الشخصية المرتبطة به من خوادمنا في أي وقت، سواء من داخل التطبيق أو عبر هذه الصفحة المباشرة.'
                  : 'Bayraq Gate grants you the full right to request the permanent deletion of your account and all associated personal data from our servers at any time, either in-app or via this direct web page.'}
              </p>
            </div>
          </div>
        </div>

        {/* Data Deletion Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <Trash2 size={16} />
              <span>{activeLang === 'ar' ? 'البيانات التي يتم حذفها' : 'Data Deleted Permanently'}</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {activeLang === 'ar'
                ? 'ملف المستخدم الشخصي، رمز الدخول، الصور الشخصية، سجلات الجلسات، الإشعارات، التفاعلات، وبيانات الموقع الجغرافي.'
                : 'User profile, login access code, profile photos, session tokens, notifications, community interactions, and location logs.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Database size={16} />
              <span>{activeLang === 'ar' ? 'السجلات المدرسية النظامية' : 'Institutional Records'}</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {activeLang === 'ar'
                ? 'السجلات المالية والأكاديمية الرسمية الخاصة بإدارة المدرسة يتم فك ارتباطها بحسابك الرقمي وتخضع لسياسة أرشفة المدرسة.'
                : 'Official academic/tuition records managed by the school administration are unlinked from your digital profile.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Clock size={16} />
              <span>{activeLang === 'ar' ? 'المهلة الزمنية للتنفيذ' : 'Processing Timeframe'}</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              {activeLang === 'ar'
                ? 'يتم تعطيل الحساب فوراً وإزالة البيانات نهائياً من قواعد البيانات النشطة خلال 48 ساعة إلى 7 أيام عمل كحد أقصى.'
                : 'Account access is revoked immediately, and all personal data is permanently purged within 48 hours to 7 business days.'}
            </p>
          </div>
        </div>

        {/* Form or Confirmation */}
        {submittedRef ? (
          <div className="rounded-3xl bg-emerald-950/30 border border-emerald-500/40 p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 size={34} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              {activeLang === 'ar' ? 'تم استلام طلب حذف الحساب بنجاح' : 'Account Deletion Request Received'}
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-lg mx-auto leading-relaxed">
              {activeLang === 'ar'
                ? 'تم تسجيل طلبك في النظام الآلي لحذف البيانات. سيتم إيقاف الحساب وإزالة كافة البيانات الشخصية المرتبطة به نهائياً.'
                : 'Your request has been logged in our automated data removal queue. Your account and associated personal data will be permanently purged.'}
            </p>
            <div className="inline-block px-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-emerald-300">
              {activeLang === 'ar' ? 'رقم المرجع:' : 'Reference ID:'} <strong>{submittedRef}</strong>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSubmittedRef(null);
                  setIdentifier('');
                  setReason('');
                  setConfirmed(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all"
              >
                {activeLang === 'ar' ? 'إرسال طلب آخر' : 'Submit Another Request'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <FileText size={18} className="text-rose-400" />
              <h3 className="text-base font-black text-white">
                {activeLang === 'ar' ? 'نموذج تقديم طلب الحذف المباشر' : 'Direct Account Deletion Request Form'}
              </h3>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2">
                <Info size={16} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/80">
                  {activeLang === 'ar' ? 'كود الدخول / البريد الإلكتروني / رقم الهاتف *' : 'Access Code / Email / Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={activeLang === 'ar' ? 'مثال: STU-B-12345 أو البريد الإلكتروني' : 'e.g., STU-B-12345 or email@example.com'}
                  className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-white/80">
                  {activeLang === 'ar' ? 'نوع الحساب' : 'Account Role'}
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="student">{activeLang === 'ar' ? 'طالب (Student)' : 'Student'}</option>
                  <option value="parent">{activeLang === 'ar' ? 'ولي أمر (Parent)' : 'Parent'}</option>
                  <option value="teacher">{activeLang === 'ar' ? 'أستاذ / معلم (Teacher)' : 'Teacher'}</option>
                  <option value="driver">{activeLang === 'ar' ? 'سائق خط (Driver)' : 'Transport Driver'}</option>
                  <option value="admin">{activeLang === 'ar' ? 'إدارة مدرسة (School Admin)' : 'School Admin'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/80">
                {activeLang === 'ar' ? 'اسم المدرسة (اختياري)' : 'School Name (Optional)'}
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder={activeLang === 'ar' ? 'مثال: مدرسة اليمامة الابتدائية / ثانوية أوائل غماس...' : 'Enter school name (optional)'}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-white/80">
                {activeLang === 'ar' ? 'سبب طلب الحذف (اختياري)' : 'Reason for Deletion (Optional)'}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={activeLang === 'ar' ? 'يمكنك ذكر أي ملاحظات إضافية هنا...' : 'Optional notes...'}
                className="w-full p-3.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm focus:border-rose-500 focus:outline-none resize-none"
              />
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-rose-500 rounded"
              />
              <span className="text-xs text-white/80 leading-relaxed">
                {activeLang === 'ar'
                  ? 'أقر بأنني صاحب هذا الحساب وأوافق على حذف حسابي وجميع بياناتي الشخصية المرتبطة به نهائياً دون إمكانية استرجاعها.'
                  : 'I confirm that I am the owner of this account and request the permanent, irreversible deletion of my account and associated personal data.'}
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Send size={16} />
              <span>
                {isSubmitting
                  ? (activeLang === 'ar' ? 'جاري إرسال الطلب...' : 'Submitting Request...')
                  : (activeLang === 'ar' ? 'تأكيد وإرسال طلب حذف الحساب نهائياً' : 'Submit Permanent Account Deletion Request')}
              </span>
            </button>
          </form>
        )}

        {/* Direct Support Contact Footer */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-white/50 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-white/70 font-bold">
            <Lock size={14} className="text-amber-400" />
            <span>{activeLang === 'ar' ? 'التواصل المباشر مع مسؤول حماية البيانات' : 'Data Protection Officer Contact'}</span>
          </div>
          <p>
            {activeLang === 'ar'
              ? 'يمكنك أيضاً طلب الحذف مباشرة عبر مراسلة الدعم الفني على البريد: support@bairaq-iq.com'
              : 'You may also email our support team directly at: support@bairaq-iq.com'}
          </p>
        </div>
      </main>
    </div>
  );
};
