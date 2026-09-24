import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, X, Check, Trash2, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

interface SavedGoogleAccount {
  email: string;
  name?: string;
  photoURL?: string;
  lastUsed?: number;
}

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { email: string; name?: string; photoURL?: string }) => Promise<void>;
  initialEmail?: string;
}

const STORAGE_KEY = 'bairaq_saved_google_accounts';

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  initialEmail = ''
}) => {
  const [savedAccounts, setSavedAccounts] = useState<SavedGoogleAccount[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [newName, setNewName] = useState('');
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved accounts from localStorage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const list: SavedGoogleAccount[] = JSON.parse(raw);
          setSavedAccounts(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        setSavedAccounts([]);
      }
      setError(null);
      setLoadingEmail(null);
      if (initialEmail && initialEmail.includes('@')) {
        setNewEmail(initialEmail);
      }
    }
  }, [isOpen, initialEmail]);

  const saveAccountToHistory = (account: SavedGoogleAccount) => {
    try {
      const existing = savedAccounts.filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
      const updated = [{ ...account, lastUsed: Date.now() }, ...existing].slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {}
  };

  const removeAccount = (emailToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    setSavedAccounts(updated);
  };

  const handlePickAccount = async (account: SavedGoogleAccount) => {
    setError(null);
    setLoadingEmail(account.email);
    try {
      saveAccountToHistory(account);
      await onSelectAccount(account);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدخول بالحساب المحدد');
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleAddNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = (newEmail || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('يرجى إدخال بريد جيميل صالح (مثال: example@gmail.com)');
      return;
    }

    const fullEmail = cleanEmail.endsWith('@gmail.com') || cleanEmail.includes('@') 
      ? cleanEmail 
      : `${cleanEmail}@gmail.com`;

    const account: SavedGoogleAccount = {
      email: fullEmail,
      name: (newName || '').trim() || fullEmail.split('@')[0],
      photoURL: undefined
    };

    setLoadingEmail(fullEmail);
    try {
      saveAccountToHistory(account);
      await onSelectAccount(account);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الدخول عبر Google');
    } finally {
      setLoadingEmail(null);
    }
  };

  const appendGmailDomain = () => {
    const raw = (newEmail || '').trim();
    if (!raw.includes('@')) {
      setNewEmail(raw ? `${raw}@gmail.com` : '');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden text-right"
        >
          {/* Top Background Glow */}
          <div className="absolute top-0 right-1/4 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt="Google"
                  className="w-6 h-6"
                />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">المتابعة باستخدام Google</h3>
                <p className="text-xs text-white/50">تسجيل دخول مباشر وآمن إلى بوابة بيرق</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={!!loadingEmail}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-5 relative z-10">
            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            {!isAddingNew ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-white/70 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>اختر حساباً للدخول الفوري:</span>
                </p>

                {/* Saved Accounts List */}
                {savedAccounts.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {savedAccounts.map((acc) => {
                      const isThisLoading = loadingEmail === acc.email;
                      const initialLetter = (acc.name || acc.email)[0].toUpperCase();
                      return (
                        <motion.button
                          key={acc.email}
                          whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
                          whileTap={{ scale: 0.99 }}
                          disabled={!!loadingEmail}
                          onClick={() => handlePickAccount(acc)}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/40 transition-all text-right group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                              {acc.photoURL ? (
                                <img
                                  src={acc.photoURL}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                initialLetter
                              )}
                            </div>
                            <div className="min-w-0 flex flex-col items-start">
                              <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[200px]">
                                {acc.name || acc.email.split('@')[0]}
                              </span>
                              <span className="text-xs text-white/50 truncate max-w-[200px] dir-ltr text-left">
                                {acc.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isThisLoading ? (
                              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => removeAccount(acc.email, e)}
                                title="إزالة من القائمة"
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Add / Choose Another Account Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!!loadingEmail}
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 transition-all mt-1"
                >
                  <User size={16} />
                  <span>{savedAccounts.length > 0 ? 'استخدام حساب Google آخر' : 'إدخال بريد حساب Google'}</span>
                </motion.button>
              </div>
            ) : (
              /* Add New Account Form */
              <form onSubmit={handleAddNewAccount} className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white/70">أدخل بريد حسابك على Google:</span>
                  {savedAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={12} className="rotate-180" />
                      <span>الرجوع للحسابات السابقة</span>
                    </button>
                  )}
                </div>

                {/* Email Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="example@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/15 p-3.5 pr-12 rounded-2xl text-white placeholder-white/30 text-sm outline-none focus:border-amber-400 focus:bg-white/[0.08] transition-all text-left dir-ltr"
                  />
                </div>

                {/* Quick Suffix Button */}
                {!newEmail.includes('@') && newEmail.length > 0 && (
                  <button
                    type="button"
                    onClick={appendGmailDomain}
                    className="self-start py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-amber-300 font-mono transition-colors"
                  >
                    + @gmail.com
                  </button>
                )}

                {/* Optional Name Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-white/40">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="الاسم الكامل (اختياري)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/15 p-3.5 pr-12 rounded-2xl text-white placeholder-white/30 text-sm outline-none focus:border-amber-400 focus:bg-white/[0.08] transition-all text-right"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!!loadingEmail}
                  type="submit"
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loadingEmail ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} />
                      <span>المتابعة وتسجيل الدخول</span>
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>تسجيل دخول مباشر ومحمي عبر خادم منظومة بيرق</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
