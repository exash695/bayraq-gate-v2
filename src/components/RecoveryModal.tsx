import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw
} from 'lucide-react';
import { customAuth } from '../services/customAuthService';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessLogin?: () => void;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({
  isOpen,
  onClose,
  initialEmail = ''
}) => {
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmailInput(initialEmail);
    }
  }, [initialEmail]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-[#0a1024] border border-amber-500/25 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-right overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-white/50 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
          aria-label="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 text-amber-400 shadow-inner">
            <Mail size={32} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1.5">استعادة كلمة المرور</h2>
          <p className="text-white/60 text-xs sm:text-sm">
            أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور
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

        {/* Email Form */}
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
      </motion.div>
    </div>
  );
};
