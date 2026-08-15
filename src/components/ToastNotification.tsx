import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Clock, Unlock, MessageSquare, Swords, Shield, Crown, X } from 'lucide-react';
import { AppNotification } from '../types';
import { SwipeDismissContainer } from './SwipeDismissContainer';

interface ToastNotificationProps {
  notification: AppNotification;
  onClose: (id: string) => void;
  language: 'ar' | 'en';
}

export const ToastNotification = React.forwardRef<HTMLDivElement, ToastNotificationProps>(
  ({ notification, onClose, language }, ref) => {
    const isAr = language === 'ar';
    const DURATION = 3000;

    useEffect(() => {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, DURATION);
      return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    const getIcon = (type: AppNotification['type']) => {
      const iconClass = "text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]";
      switch (type) {
        case 'alarm': return <Clock className={iconClass} size={20} />;
        case 'unlock': return <Unlock className={iconClass} size={20} />;
        case 'support': return <MessageSquare className={iconClass} size={20} />;
        case 'challenge': return <Swords className={iconClass} size={20} />;
        case 'siege': return <Shield className={iconClass} size={20} />;
        case 'sovereignty': return <Crown className={iconClass} size={20} />;
        default: return <Bell className={iconClass} size={20} />;
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -20, scale: 0.95, x: isAr ? 20 : -20 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className="pointer-events-auto w-full max-w-sm"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <SwipeDismissContainer onDismiss={() => onClose(notification.id)}>
          <div className="relative p-4 flex gap-4 bg-[#050505]/95 backdrop-blur-sm border-2 border-[#D4AF37]/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.15)] overflow-hidden group">
            {/* Progress Bar Background */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: DURATION / 1000, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#00E5FF]"
              />
            </div>

            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-[#D4AF37]/20 group-hover:border-[#00E5FF]/50 transition-all duration-500 shadow-[inset_0_0_10px_rgba(212,175,55,0.1)]`}>
              {getIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0 py-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-black text-white truncate tracking-tight">
                  {notification.title}
                </h4>
                <button 
                  onClick={() => onClose(notification.id)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-white/70 leading-relaxed line-clamp-2 font-medium">
                {notification.message}
              </p>
            </div>
          </div>
        </SwipeDismissContainer>
      </motion.div>
    );
  }
);
ToastNotification.displayName = 'ToastNotification';

interface ToastContainerProps {
  toasts: AppNotification[];
  onClose: (id: string) => void;
  language: 'ar' | 'en';
}

export const ToastContainer = ({ toasts, onClose, language }: ToastContainerProps) => {
  return (
    <div 
      className={`fixed top-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-[10001] flex flex-col gap-3 pointer-events-none w-full max-w-sm`}
    >
      <AnimatePresence mode="popLayout">
        {toasts
          .filter((toast, index, self) => index === self.findIndex((t) => t.id === toast.id))
          .map((toast, idx) => (
            <ToastNotification 
              key={`${toast.id || 'toast'}-${idx}`} 
              notification={toast} 
              onClose={onClose} 
              language={language} 
            />
          ))}
      </AnimatePresence>
    </div>
  );
};
