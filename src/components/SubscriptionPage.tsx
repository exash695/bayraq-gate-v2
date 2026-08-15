import React, { useState } from 'react';
import { activateSubscriptionCode } from '../services/subscriptionService';
import { auth } from '../lib/firebase';
import { CreditCard, Key, Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const SubscriptionPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRedeemCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('يجب تسجيل الدخول أولاً.');
      
      const result = await activateSubscriptionCode(user.uid, code);
      if (result.success) {
        setMessage({ type: 'success', text: 'تم تفعيل الاشتراك بنجاح! سيتم تحديث بياناتك الآن.' });
        setCode('');
        // Force a page reload or state update to reflect new permissions
        window.location.reload(); 
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Redeem Code Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Key size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-1">تفعيل كود المكتبة</h3>
            <p className="text-white/40 font-bold">أدخل كود التفعيل المكون من 16 رقماً</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-center text-xl font-mono tracking-widest text-white outline-none focus:border-purple-500/50 uppercase"
          />
          <button
            onClick={handleRedeemCode}
            disabled={loading}
            className="w-full py-4 bg-purple-500 text-white font-black rounded-xl hover:bg-purple-600 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'تفعيل الآن'}
          </button>
        </div>
      </motion.div>

      {/* Visa/Mastercard Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CreditCard size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-1">الدفع الإلكتروني</h3>
            <p className="text-white/40 font-bold">اشتراك آمن عبر Visa أو Mastercard</p>
          </div>
        </div>
        
        <a
          href="https://YOUR_PAYMENT_GATEWAY_URL_HERE"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-emerald-500 text-white py-4 rounded-xl font-black text-center hover:bg-emerald-600 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          دفع الاشتراك الآن
        </a>
        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400/60 text-xs font-bold">
          <ShieldCheck size={14} />
          <span>عملية دفع مشفرة وآمنة 100%</span>
        </div>
      </motion.div>

      {/* Message Display */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{message.text}</p>
        </motion.div>
      )}
    </div>
  );
};
