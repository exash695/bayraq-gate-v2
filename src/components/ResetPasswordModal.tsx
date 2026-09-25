import * as FirebaseMock from "../lib/firebase"; const { db, auth, storage, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, terminate, clearIndexedDbPersistence } = FirebaseMock;
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { customAuth } from '../services/customAuthService';
import { motion } from 'motion/react';

interface ResetPasswordModalProps {
  token: string;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  token,
  email,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setError('يجب ألا تقل كلمة المرور عن 6 أحرف');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    try {
      const res = await customAuth.resetPassword(email, token, newPassword);
      setSuccessMessage(res.message || 'تم تحديث كلمة المرور بنجاح!');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-[#0a1024] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-right overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-white/50 hover:text-white transition-colors"
        >
          <X size={22} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">إعادة تعيين كلمة المرور</h2>
          <p className="text-white/60 text-sm">
            للحساب: <span className="text-amber-400 font-mono text-xs">{email}</span>
          </p>
        </div>

        {successMessage ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
            <p className="text-emerald-400 font-bold text-lg mb-2">{successMessage}</p>
            <p className="text-white/60 text-sm">جاري تحويلك لتسجيل الدخول...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="6 أحرف على الأقل"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 p-3.5 pr-4 pl-12 rounded-2xl outline-none text-white focus:border-amber-400 focus:bg-white/[0.07] transition-all text-left dir-ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-amber-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                تأكيد كلمة المرور
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 p-3.5 pr-4 pl-4 rounded-2xl outline-none text-white focus:border-amber-400 focus:bg-white/[0.07] transition-all text-left dir-ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
