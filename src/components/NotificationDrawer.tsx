import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Bell, Trash2, Clock, CheckCircle2, Unlock, MessageSquare, 
  AlertTriangle, Swords, Shield, Crown, Megaphone, BellRing, 
  Smartphone, Loader2, ExternalLink, Copy, Check 
} from 'lucide-react';
import { AppNotification } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { BerqCharacter } from './BerqCharacterManager';
import { pushNotificationManager } from '../services/pushNotificationManager';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string, index: number) => void;
  language: 'ar' | 'en';
}

export const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAsRead,
  onDelete,
  language
}: NotificationDrawerProps) => {
  const isAr = language === 'ar';
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      notifications.filter(n => !n.read).forEach(notif => {
         if (notif.id) onMarkAsRead(notif.id);
      });
    }
  }, [isOpen, unreadCount, notifications, onMarkAsRead]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isActivatingWebPush, setIsActivatingWebPush] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [pushFeedback, setPushFeedback] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    text: string;
    showDirect?: boolean;
  } | null>(null);

  const isInIframe = typeof window !== 'undefined' && pushNotificationManager.isInIframe();
  const directAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleActivateWebPush = async () => {
    setIsActivatingWebPush(true);
    setPushFeedback(null);

    try {
      const userId = localStorage.getItem('current_user_id') || localStorage.getItem('bayraq_student_id') || 'student_guest';
      const result = await pushNotificationManager.requestWebPermission(userId);

      setIsActivatingWebPush(false);

      if (result.success || result.status === 'granted') {
        setPermissionGranted(true);
        setPushFeedback({
          type: 'success',
          text: isAr ? 'تم تفعيل إشعارات المتصفح بنجاح! ستصلك التنبيهات فوراً على جهازك.' : 'Notifications enabled successfully!'
        });
      } else if (result.status === 'iframe_restricted' || isInIframe) {
        setPushFeedback({
          type: 'warning',
          text: isAr 
            ? 'متصفح Chrome يمنع طلب الإذن من داخل إطار المعاينة. انقر على الزر أدناه لفتح الرابط المباشر وتفعيلها فوراً:' 
            : 'Chrome restricts notifications inside iframes. Open the direct link below to enable:',
          showDirect: true
        });
      } else if (result.status === 'denied') {
        setPushFeedback({
          type: 'error',
          text: isAr
            ? 'الإشعارات محظورة في إعدادات متصفحك. انقر على أيقونة الإعدادات 🔒 أو النقاط الثلاث بجانب الرابط واختر "سماح بالإشعارات".'
            : 'Notifications blocked in browser settings. Please allow them from site settings.'
        });
      } else {
        setPushFeedback({
          type: 'info',
          text: result.message || (isAr ? 'يرجى فتح الرابط المباشر لمنح إذن الإشعارات.' : 'Please open direct link to enable.')
        });
      }
    } catch (e: any) {
      setIsActivatingWebPush(false);
      setPushFeedback({
        type: 'warning',
        text: isAr ? 'يرجى فتح المنصة في تبويب مباشر لتمكين المتصفح من إظهار طلب الإذن:' : 'Please open direct tab to allow notifications:',
        showDirect: true
      });
    }
  };

  const handleCopyDirectLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(directAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'alarm': return <Clock className="text-amber-500" size={18} />;
      case 'unlock': return <Unlock className="text-emerald-500" size={18} />;
      case 'support': return <MessageSquare className="text-blue-500" size={18} />;
      case 'challenge': return <Swords className="text-rose-500" size={18} />;
      case 'siege': return <Shield className="text-amber-600" size={18} />;
      case 'sovereignty': return <Crown className="text-yellow-500" size={18} />;
      case 'broadcast': return <Megaphone className="text-rose-500" size={18} />;
      default: return <Bell className="text-theme-primary" size={18} />;
    }
  };

  return (
    <>
      <ConfirmDialog 
         isOpen={confirmDelete}
         onClose={() => setConfirmDelete(false)}
         onConfirm={() => {
           onClearAll();
           setConfirmDelete(false);
         }}
         title={isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
         message={isAr ? 'هل أنت متأكد من حذف جميع الإشعارات؟' : 'Are you sure you want to clear all notifications?'}
      />
      <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />

          {/* Drawer */}
          <motion.div
            key="drawer-panel"
            initial={{ x: isAr ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isAr ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${isAr ? 'left-0' : 'right-0'} w-full max-w-md bg-[#050505] border-l border-white/10 shadow-2xl z-[201] flex flex-col`}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="text-theme-primary" size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-black">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {isAr ? 'مركز الإشعارات' : 'Notification Center'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Web Push Notification Banner */}
            {typeof window !== 'undefined' && 'Notification' in window && (
              permissionGranted ? (
                <div className="mx-4 mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="text-xs font-bold text-emerald-400 truncate">
                        {isAr ? 'إشعارات المتصفح مفعلة بنجاح' : 'Web Notifications Active'}
                      </p>
                      <p className="text-[10px] text-emerald-300/70 truncate">
                        {isAr ? 'تصلك تنبيهات الواجبات والدرجات تلقائياً' : 'Live alerts are active on this device'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/25 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                        <BellRing size={18} className="animate-pulse" />
                      </div>
                      <div className="min-w-0 text-right">
                        <p className="text-xs font-bold text-white truncate">
                          {isAr ? 'تفعيل إشعارات المتصفح' : 'Enable Web Notifications'}
                        </p>
                        <p className="text-[10px] text-white/60 truncate">
                          {isAr ? 'لتصلك تنبيهات الواجبات والدرجات مباشرة' : 'Get alerts even when tab is closed'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleActivateWebPush}
                      disabled={isActivatingWebPush}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-black shrink-0 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      {isActivatingWebPush ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>{isAr ? 'جاري الفحص...' : 'Checking...'}</span>
                        </>
                      ) : (
                        <>
                          <BellRing size={13} />
                          <span>{isAr ? 'تفعيل الآن' : 'Enable'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Diagnostic feedback or iframe solution */}
                  {pushFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`pt-2 mt-1 border-t border-white/10 text-[11px] leading-relaxed flex flex-col gap-2 ${
                        pushFeedback.type === 'success' ? 'text-emerald-300' :
                        pushFeedback.type === 'error' ? 'text-rose-300' :
                        'text-amber-200/90'
                      }`}
                    >
                      <p>{pushFeedback.text}</p>

                      {pushFeedback.showDirect && (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={directAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 text-black font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-md hover:bg-amber-400 transition-colors"
                          >
                            <ExternalLink size={12} />
                            <span>{isAr ? 'فتح في علامة تبويب مباشرة' : 'Open in Direct Tab'}</span>
                          </a>

                          <button
                            onClick={handleCopyDirectLink}
                            className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-[11px] flex items-center justify-center gap-1 transition-colors border border-white/15"
                            title={isAr ? 'نسخ الرابط' : 'Copy link'}
                          >
                            {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedLink ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرابط' : 'Copy')}</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-8">
                  <div className="w-28 h-28 mx-auto relative flex items-center justify-center">
                    <BerqCharacter 
                      pose="general_pose_encouragement" 
                      glowColor="cyan"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-[#D4AF37] tracking-wider">
                      {isAr ? 'لا توجد إشعارات حالياً 🔕' : 'No Notifications Yet 🔕'}
                    </h3>
                    <p className="text-white/30 text-sm font-medium">
                      {isAr ? 'سنقوم بإعلامك عند وجود تحديثات جديدة' : 'We will notify you when there are new updates'}
                    </p>
                  </div>
                  
                  {/* Luxury Theme Element */}
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      {isAr ? 'أحدث التنبيهات' : 'Latest Alerts'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                      title={isAr ? 'مسح الكل' : 'Clear All'}
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {notifications && notifications.length > 0 && 
                      notifications
                        .filter((notif, index, self) => index === self.findIndex((n) => n.id === notif.id))
                        .map((notif, idx) => {
                          const key = `${notif.id || 'notif'}-${idx}`;
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                                notif?.read 
                                  ? 'bg-white/5 border-white/5 opacity-60' 
                                  : 'bg-white/10 border-white/10 hover:border-theme-primary/30 shadow-lg'
                              }`}
                              onClick={() => notif?.id && onMarkAsRead(notif.id)}
                            >
                        <div className="flex gap-4 flex-1 overflow-hidden">
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                            notif?.read ? 'bg-white/5' : 'bg-theme-primary/10'
                          }`}>
                            {getIcon(notif?.type)}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-bold text-sm truncate ${notif?.read ? 'text-white/60' : 'text-white'}`}>
                                {notif?.title}
                              </h4>
                              <span className="text-[10px] font-medium text-white/30 flex items-center gap-1 shrink-0">
                                <Clock size={10} />
                                {(() => {
                                  if (!notif?.timestamp) return '';
                                  const d = new Date(notif.timestamp);
                                  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
                                })()}
                              </span>
                            </div>
                            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                              {notif?.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notif?.id) onDelete(notif.id, idx);
                            }}
                            className="p-1.5 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        {!notif?.read && (
                          <div className="absolute top-4 right-4 w-2 h-2 bg-theme-primary rounded-full shadow-[0_0_8px_var(--theme-glow)]" />
                        )}
                      </motion.div>
                    )})}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-white/5">
              <p className="text-[10px] text-center text-white/20 font-bold uppercase tracking-[0.2em]">
                {isAr ? 'بوابة بيرق - نظام الإشعارات الذكي' : 'Bayraq Gate - Smart Notification System'}
              </p>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </>
  );
};
