import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Phone,
  MessageSquare,
  Lock
} from 'lucide-react';
import { customAuth } from '../services/customAuthService';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialPhone?: string;
  initialMethod?: 'email' | 'phone';
  onSuccessLogin?: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  initialPhone = '',
  initialMethod = 'email'
}) => {
  const [method, setMethod] = useState<'email' | 'phone'>(initialMethod);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMethod(initialMethod);
      setEmailInput(initialEmail);
      setPhoneInput(initialPhone);
      setStep('request');
      setError(null);
      setSuccessMessage(null);
      setWhatsappLink(null);
      setOtpInput('');
      setNewPassword('');
    }
  }, [isOpen, initialMethod, initialEmail, initialPhone]);

  if (!isOpen) return null;

  // Handle Email Password Reset
  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const email = emailInput.trim();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني المسجل');
      return;
    }

    setLoading(true);
    try {
      const res = await customAuth.forgotPassword(email);
      setSuccessMessage(res.message || 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح. يرجى مراجعة صندوق الوارد.');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط استعادة كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone Recovery Request
  const handlePhoneRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!phoneInput.trim()) {
      setError('يرجى إدخال رقم الهاتف المسجل');
      return;
    }

    setLoading(true);
    try {
      const res = await customAuth.requestWhatsappOtp(phoneInput);
      setMaskedPhone(res.phoneMasked || phoneInput);
      setWhatsappLink(res.whatsappLink || null);
      setStep('verify');
      setSuccessMessage('تم العثور على حسابك! يرجى الحصول على كود التحقق عبر واتساب.');
    } catch (err: any) {
      setError(err.message || 'لم نتمكن من العثور على حساب بهذا الرقم.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone Recovery Verify & Reset
  const handlePhoneVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!otpInput || otpInput.length < 4) {
      setError('يرجى إدخال كود التحقق المكون من 6 أرقام');
      return;
    }

    if (newPassword.length < 6) {
      setError('يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف');
      return;
    }

    setLoading(true);
    try {
      await customAuth.verifyWhatsappOtp(phoneInput, otpInput, newPassword);
      setSuccessMessage('تم تغيير كلمة المرور بنجاح! يمكنك الآن العودة لتسجيل الدخول.');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'كود التحقق غير صحيح أو انتهت صلاحيته.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#0a1024] border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-right overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-white/50 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 z-10"
          aria-label="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Method Switcher */}
        {step === 'request' && (
          <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
            <button
              onClick={() => { setMethod('email'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${method === 'email' ? 'bg-amber-500 text-[#050A18] shadow-lg shadow-amber-500/20' : 'text-white/60 hover:text-white'}`}
            >
              عبر البريد
            </button>
            <button
              onClick={() => { setMethod('phone'); setError(null); setSuccessMessage(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${method === 'phone' ? 'bg-amber-500 text-[#050A18] shadow-lg shadow-amber-500/20' : 'text-white/60 hover:text-white'}`}
            >
              عبر واتساب
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-400 shadow-inner">
            {method === 'email' ? <Mail size={32} /> : <Phone size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-white mb-1.5">استعادة كلمة المرور</h2>
          <p className="text-white/60 text-xs sm:text-sm px-4">
            {method === 'email' 
              ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور'
              : step === 'request' 
                ? 'أدخل رقم هاتفك المسجل لنرسل لك كود التحقق عبر محادثة واتساب'
                : `تم إرسال الكود إلى الرقم ${maskedPhone}. يرجى إدخاله مع كلمة المرور الجديدة.`
            }
          </p>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2.5 p-3.5 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm"
            >
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2.5 p-3.5 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm"
            >
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms Container */}
        <div className="min-h-[200px]">
          {method === 'email' ? (
            <form onSubmit={handleEmailReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  البريد الإلكتروني المسجل:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-amber-400/80">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 p-3.5 pr-12 pl-4 rounded-2xl outline-none text-white text-base focus:border-amber-400 focus:bg-white/[0.07] transition-all dir-ltr text-right"
                  />
                </div>
                <p className="text-white/40 text-xs mt-2 mr-1">
                  ستصلك رسالة رسمية من المنظومة تحتوي على زر آمن لتعيين كلمة مرور جديدة.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    جاري إرسال الرابط...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    إرسال رابط الاستعادة إلى البريد
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {step === 'request' ? (
                <form onSubmit={handlePhoneRequest} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      رقم الهاتف المسجل:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-amber-400/80">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="07xxxxxxxx"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 p-3.5 pr-12 pl-4 rounded-2xl outline-none text-white text-base focus:border-amber-400 focus:bg-white/[0.07] transition-all dir-ltr text-right"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                    بدء عملية الاستعادة عبر واتساب
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneVerify} className="flex flex-col gap-5">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                    <p className="text-emerald-400 text-sm font-bold mb-2">يرجى الضغط على الرابط الأخضر للحصول على الكود:</p>
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black text-sm transition-all shadow-lg hover:scale-105 active:scale-95"
                      >
                        <MessageSquare size={18} />
                        الحصول على كود التفعيل من واتساب
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-white/70 text-xs font-bold mb-1.5 mr-1">كود التحقق المستلم:</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 p-3 rounded-xl outline-none text-center text-xl font-mono tracking-[0.5em] text-amber-400 focus:border-amber-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-xs font-bold mb-1.5 mr-1">كلمة المرور الجديدة:</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/30">
                          <Lock size={16} />
                        </div>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/10 p-3 pr-11 rounded-xl outline-none text-white focus:border-amber-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base rounded-2xl transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    تحديث كلمة المرور والدخول
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('request')}
                    className="w-full py-2 text-white/40 hover:text-white/60 text-xs font-medium transition-colors"
                  >
                    تغيير الرقم؟ العودة للخطوة السابقة
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
