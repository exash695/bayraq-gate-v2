import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, Wifi, CheckCircle2 } from 'lucide-react';

export const NetworkStatusListener: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });

  const [showRestored, setShowRestored] = useState<boolean>(false);
  const [isRechecking, setIsRechecking] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualRetry = async () => {
    setIsRechecking(true);
    try {
      // Test connectivity by pinging an ultra-lightweight endpoint with cache busting
      await fetch(`/api/health?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3500);
    } catch {
      // If native check also says offline or fetch fails
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setIsOnline(true);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 3500);
      } else {
        setIsOnline(false);
      }
    } finally {
      setTimeout(() => {
        setIsRechecking(false);
      }, 600);
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[99999] max-w-md w-auto"
          dir="rtl"
          id="offline-network-banner"
        >
          <div className="bg-[#0f111a]/95 backdrop-blur-xl border border-amber-500/40 text-white px-4 py-3 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <WifiOff size={18} className="animate-pulse" />
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-amber-300">
                  يبدو أن الاتصال بالإنترنت متوقف
                </p>
                <p className="text-[11px] text-white/60 font-medium leading-tight">
                  البيانات المحفوظة متاحة لديك، وسنعاود المزامنة فور عودة الشبكة.
                </p>
              </div>
            </div>

            <button
              onClick={handleManualRetry}
              disabled={isRechecking}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-300 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} className={isRechecking ? 'animate-spin' : ''} />
              <span>{isRechecking ? 'جاري الفحص...' : 'إعادة المحاولة'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {showRestored && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[99999] max-w-sm w-auto"
          dir="rtl"
          id="online-restored-banner"
        >
          <div className="bg-[#061811]/95 backdrop-blur-xl border border-emerald-500/40 text-white px-4 py-2.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7),0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wifi size={15} />
            </div>
            <p className="text-xs font-black text-emerald-300">
              تمت استعادة الاتصال بالإنترنت بنجاح ✨
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
