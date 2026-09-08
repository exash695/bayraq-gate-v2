import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from '@/src/lib/firebase';
import { ShieldAlert, X, MessageSquare, History, Send, Bell, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { supportService, SupportTicket } from '../services/supportService';

interface StudentSupportFormProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  grade: string;
  userId: string;
  role: string;
  broadcastId?: string;
  isTeacher?: boolean;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onDeleteNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  studentCode?: string;
  parentCode?: string;
  onSocialUnreadCount?: (count: number) => void;
  onMarkAllRead?: () => void;
  schoolId?: string | null;
}

export const StudentSupportForm: React.FC<StudentSupportFormProps> = ({ 
  isOpen, 
  onClose, 
  studentName, 
  grade, 
  userId, 
  role,
  isTeacher,
  notifications = [],
  onMarkNotificationAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  studentCode,
  parentCode,
  onSocialUnreadCount,
  onMarkAllRead,
  schoolId
}) => {
  const [view, setView] = useState<'form' | 'history' | 'social'>('social');
  const [issueType, setIssueType] = useState('مشكلة تقنية');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<SupportTicket[]>([]);
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  const [socialNotifications, setSocialNotifications] = useState<any[]>([]);
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<Set<string>>(new Set());

  const loadTickets = async () => {
    if (!isOpen) return;
    try {
      const allPossibleUserIds = new Set<string>();
      
      const addVariants = (raw?: string, isT = false, isP = false) => {
        if (!raw) return;
        const clean = raw.trim();
        const upper = clean.toUpperCase();
        const lower = clean.toLowerCase();
        allPossibleUserIds.add(clean);
        allPossibleUserIds.add(upper);
        allPossibleUserIds.add(lower);
        
          // Expand to match all possible ways it might be stored
          allPossibleUserIds.add(clean);
          allPossibleUserIds.add(upper);
          
          const prefixes = ['scode_', 'pcode_', 'tcode_', 'tch_'];
          prefixes.forEach(p => {
            allPossibleUserIds.add(`${p}${clean}`);
            allPossibleUserIds.add(`${p}${upper}`);
          });

          if (upper.startsWith('TCH-') || upper.startsWith('PAR-')) {
             allPossibleUserIds.add(`tcode_${upper}`);
             allPossibleUserIds.add(`pcode_${upper}`);
          }
        };

      const isT = isTeacher || role === 'teacher' || role === 'cadre' || role === 'staff';
      const isP = role === 'parent';
      const effectiveRole = isT ? 'teacher' : isP ? 'parent' : 'student';

      addVariants(userId, isT, isP);
      addVariants(studentCode, isT, isP);
      addVariants(parentCode, false, true);

      const possibleIds = Array.from(allPossibleUserIds).filter(Boolean);
      const tickets = await supportService.fetchTickets(schoolId || undefined, possibleIds[0] || userId, possibleIds, effectiveRole);
      
      const filtered = tickets.filter(t => {
        const ticketUserId = t.userId?.toLowerCase();
        const lowerPossibleIds = possibleIds.map(id => id.toLowerCase());
        return ticketUserId && lowerPossibleIds.includes(ticketUserId);
      });
      
      setAllTickets(filtered);
      const historyRecords = [...filtered]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(historyRecords);

      // Mark all as read when opened
      if (isOpen) {
        try {
          fetch('/api/support-tickets/mark-all-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: possibleIds[0] || userId, 
              userIds: possibleIds, // Send all possible IDs
              userRole: effectiveRole,
              schoolId 
            })
          }).catch(() => {});
          
          // Local update for instant UI feedback
          setAllTickets(prev => prev.map(t => ({ ...t, readByStudent: true })));
          
          // Also mark local notifications as read
          if (notifications) {
            // We can't setNotifications directly if it's from props, but let's assume it's state or handled by parent
            // Actually StudentSupportForm usually gets them from props or a service.
          }
          
          if (onMarkAllRead) onMarkAllRead();
        } catch (mErr) {
          console.warn("Mark as read failed:", mErr);
        }
      }
    } catch (err) {
      console.warn("Error fetching tickets:", err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [isOpen, userId, studentCode, parentCode, schoolId]);

  const lastUnreadCountRef = React.useRef<number>(-1);
  useEffect(() => {
    if (onSocialUnreadCount) {
      const unread = socialNotifications.filter(n => !n.read).length;
      if (unread !== lastUnreadCountRef.current) {
        lastUnreadCountRef.current = unread;
        onSocialUnreadCount(unread);
      }
    }
  }, [socialNotifications, onSocialUnreadCount]);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
     if (!isOpen) return;
     let isMounted = true;
     const fetchNotifs = async () => {
       try {
         const allPossibleUserIds = new Set<string>();
         const addVariants = (raw?: string, isT = false, isP = false) => {
           if (!raw) return;
           const clean = raw.trim();
           const upper = clean.toUpperCase();
           allPossibleUserIds.add(clean);
           allPossibleUserIds.add(upper);
           const prefix = isP ? 'pcode_' : isT ? 'tcode_' : 'scode_';
           allPossibleUserIds.add(`${prefix}${clean}`);
           allPossibleUserIds.add(`${prefix}${upper}`);
           if (isT) {
             allPossibleUserIds.add(`tch_${clean}`);
             allPossibleUserIds.add(`tch_${upper}`);
           }
           if (upper.startsWith('TCH-') || upper.startsWith('T-') || upper.startsWith('S-') || upper.startsWith('P-') || upper.startsWith('STU-') || upper.startsWith('PAR-')) {
             const pure = upper.replace(/^(STU-|PAR-|TCH-|S-|P-|T-)/i, '');
             allPossibleUserIds.add(pure);
             allPossibleUserIds.add(`${prefix}${pure}`);
             if (isT) {
               allPossibleUserIds.add(`tch_${pure}`);
               allPossibleUserIds.add(`tcode_TCH-${pure}`);
               allPossibleUserIds.add(`tcode_T-${pure}`);
             } else if (isP) {
               allPossibleUserIds.add(`pcode_P-${pure}`);
             } else {
               allPossibleUserIds.add(`scode_S-${pure}`);
             }
           } else {
             if (isT) {
               allPossibleUserIds.add(`TCH-${upper}`);
               allPossibleUserIds.add(`T-${upper}`);
               allPossibleUserIds.add(`tcode_TCH-${upper}`);
               allPossibleUserIds.add(`tch_TCH-${upper}`);
             } else if (isP) {
               allPossibleUserIds.add(`P-${upper}`);
               allPossibleUserIds.add(`pcode_P-${upper}`);
             } else {
               allPossibleUserIds.add(`S-${upper}`);
               allPossibleUserIds.add(`scode_S-${upper}`);
             }
           }
         };

         const isT = isTeacher || role === 'teacher' || role === 'cadre' || role === 'staff';
         const isP = role === 'parent';

         addVariants(userId, isT, isP);
         addVariants(studentCode, isT, isP);
         addVariants(parentCode, false, true);
         if (studentName) allPossibleUserIds.add(studentName);

         const notifIds = Array.from(allPossibleUserIds).filter(Boolean);
         const res = await fetch(`/api/notifications?recipientIds=${encodeURIComponent(notifIds.join(','))}`);
         const data = await res.json();
         if (isMounted && data.success) {
           setSocialNotifications(data.notifications || []);
         }
       } catch (e) {
         console.warn("Notifications error:", e);
       }
     };
     fetchNotifs();
     return () => { isMounted = false; };
  }, [isOpen, userId, studentName, studentCode, parentCode]);

  const handleSendReply = async (
    originTitleOrMessage: string, 
    replyText: string, 
    originalIssueType: string,
    replyToTicketId?: string,
    broadcastId?: string
  ) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      const fullMessage = `[رد ومتابعة] ${studentName}:\n${replyText}\n\n(تعقيباً على: "${originTitleOrMessage.slice(0, 100)}${originTitleOrMessage.length > 100 ? '...' : ''}")`;
      
      await supportService.createTicket({
        schoolId: schoolId || undefined,
        userId: userId || studentCode || parentCode || '',
        role: role as any,
        studentName,
        grade,
        issueType: originalIssueType || 'متابعة',
        message: fullMessage,
        status: 'pending',
        readByAdmin: false,
        senderType: role === 'parent' ? 'parent' : isTeacher ? 'teacher' : 'student',
        broadcastId: broadcastId || undefined,
        replyToTicketId: replyToTicketId || undefined
      });
      
      setReplyInputText('');
      setReplyingToId(null);
      loadTickets();
      setView('history');
    } catch (e) {
      console.error("Error sending reply:", e);
    } finally {
      setIsReplying(false);
    }
  };

  const displayNotifications = useMemo(() => {
    // 1. Get real notifications
    const combined = [...(notifications || []), ...socialNotifications];
    
    // 2. Add individual administrative messages from tickets
    const adminTickets = allTickets.filter(t => 
      t.senderType === 'admin' || 
      t.issueType === 'رسالة إدارية خاصة' || 
      t.issueType === 'تبليغ إداري'
    ).map(t => ({
      id: t.id,
      title: t.issueType === 'رسالة إدارية خاصة' ? 'رسالة إدارية خاصة 💬' : (t.subject || 'تبليغ إداري'),
      message: t.message || t.adminReply || t.description || '',
      body: t.message || t.adminReply || t.description || '',
      timestamp: t.timestamp,
      read: t.readByStudent,
      type: 'individual_admin',
      isTicket: true,
      broadcastId: t.broadcastId || t.id
    }));

    const allItems = [...combined, ...adminTickets];
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const item of allItems) {
      if (!item || !item.id) continue;
      const key = String(item.id);
      if (seen.has(key) || hiddenNotificationIds.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return unique.filter(n => {
      // Always show administrative messages
      if (n.type === 'admin_broadcast' || n.type === 'broadcast' || n.type === 'individual_admin' || n.isTicket) return true;
      
      const title = (n.title || '').toLowerCase();
      const msg = (n.message || n.body || n.description || '').toLowerCase();
      if (!title && !msg) return false;
      if (title.includes('مرحباً بك') || title.includes('welcome to bayraq')) return false;
      if (title.includes('خطأ في') || title.includes('خطأ') || n.type === 'alarm') return false;
      if (msg.includes('تم نشر الإعلان') || msg.includes('أجهزة وواجهات جميع المستخدمين')) return false;
      if (title.includes('تم نشر الإعلان') || (title === 'نجاح' && msg.includes('تم نشر'))) return false;
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, socialNotifications, allTickets]);

  const lastMarkedReadRef = React.useRef<string>('');

  useEffect(() => {
    if (isOpen) {
      const unreadTickets = allTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined));
      const unreadNotifs = displayNotifications.filter(n => !n.read);
      const unreadSocial = socialNotifications.filter(n => !n.read);

      const stateKey = `${unreadTickets.length}-${unreadNotifs.length}-${unreadSocial.length}`;
      if (stateKey === lastMarkedReadRef.current) return;
      lastMarkedReadRef.current = stateKey;

      if (unreadTickets.length > 0) {
        markAsRead(unreadTickets);
      }
      
      if (unreadNotifs.length > 0) {
        markNotificationsAsRead(unreadNotifs);
      }
      
      if (unreadSocial.length > 0) {
        handleMarkSocialRead();
      }
      
      if (unreadTickets.length > 0 || unreadNotifs.length > 0) {
         setView('history');
      }
    }
  }, [isOpen, allTickets, notifications, socialNotifications]);

  const markAsRead = async (tickets: SupportTicket[]) => {
    for (const ticket of tickets) {
      await supportService.updateTicket(ticket.id, { readByStudent: true }).catch(err => {
        console.warn("Could not mark ticket as read by student:", err);
      });
    }
  };

  const markNotificationsAsRead = async (notifs: AppNotification[]) => {
    for (const notif of notifs) {
      if (onMarkNotificationAsRead) {
        onMarkNotificationAsRead(notif.id);
      } else {
        try {
          await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
        } catch (e) {
          console.error("Could not mark notification as read", e);
        }
      }
    }
  };

  const handleSwitchToHistory = () => {
    setView('history');
  };

  const handleMarkSocialRead = async () => {
    const unread = socialNotifications.filter(n => !n.read);
    for (const notif of unread) {
      try {
         await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
      } catch (e) {
         console.warn("Could not mark social notif as read", e);
      }
    }
    if (unread.length > 0) {
       setSocialNotifications(prev => prev.map(n => unread.find(u => u.id === n.id) ? { ...n, read: true } : n));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await supportService.createTicket({
        schoolId: schoolId || undefined,
        userId: userId || studentCode || parentCode || '',
        role: role as any,
        studentName,
        grade,
        issueType,
        message,
        status: 'pending',
        senderType: role === 'parent' ? 'parent' : isTeacher ? 'teacher' : 'student'
      });
      setMessage('');
      loadTickets();
      handleSwitchToHistory();
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const unreadAlertsCount = useMemo(() => {
    return displayNotifications.filter(n => !n.read).length;
  }, [displayNotifications]);
  const unreadSocialCount = socialNotifications.filter(n => !n.read).length;

  const formatNotifDate = (timestamp: any) => {
    if (!timestamp) return new Date().toLocaleDateString('ar-IQ');
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString('ar-IQ');
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString('ar-IQ');
    return new Date(timestamp).toLocaleDateString('ar-IQ');
  };

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  
  const [confirmDeleteAllHistory, setConfirmDeleteAllHistory] = useState(false);
  const [targetDeleteHistoryId, setTargetDeleteHistoryId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingAllHistory, setIsDeletingAllHistory] = useState(false);
  const [deletingHistoryIds, setDeletingHistoryIds] = useState<Set<string>>(new Set());

  const handleDeleteNotification = async (id: string) => {
    if (!id) return;
    const item = displayNotifications.find(n => n.id === id);
    setTargetDeleteId(null);
    
    // Optimistic UI update
    setHiddenNotificationIds(prev => new Set([...Array.from(prev), id]));
    setAllTickets(prev => prev.filter(t => t.id !== id));
    setHistory(prev => prev.filter(h => h.id !== id));
    if (onDeleteNotification) onDeleteNotification(id);
    
    try {
      const codes = [studentCode, parentCode].filter(Boolean).join(',');
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      if (codes) queryParams.append('codes', codes);

      if (item?.isTicket) {
        // Use thorough deletion for tickets too
        await fetch(`/api/support-tickets/${id}?${queryParams.toString()}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/notifications/${id}?${queryParams.toString()}`, { method: 'DELETE' });
      }
    } catch (err) {
      console.warn("Delete failed:", err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!displayNotifications.length || isDeletingAll) return;
    
    setIsDeletingAll(true);
    // Optimistically hide everything
    const allCurrentIds = displayNotifications.map(n => String(n.id));
    setHiddenNotificationIds(prev => new Set([...Array.from(prev), ...allCurrentIds]));

    try {
      const codes = [studentCode, parentCode].filter(Boolean).join(',');
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      if (codes) queryParams.append('codes', codes);

      // Delete from both places for thorough clearing
      await Promise.all([
        fetch(`/api/support-tickets-clear-all?${queryParams.toString()}`, { method: 'DELETE' }).catch(() => {}),
        fetch(`/api/notifications-clear-all?${queryParams.toString()}`, { method: 'DELETE' }).catch(() => {})
      ]);
      
      setAllTickets([]);
      setHistory([]);
      if (onClearAllNotifications) onClearAllNotifications();
    } catch (err) {
      console.error("Delete all error:", err);
    } finally {
      setIsDeletingAll(false);
      setConfirmDeleteAll(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!id || deletingHistoryIds.has(id)) return;
    setDeletingHistoryIds(prev => new Set(prev).add(id));
    setTargetDeleteHistoryId(null);
    
    try {
      await supportService.deleteTicket(id, userId || studentCode || parentCode);
      setHistory(prev => prev.filter(h => h.id !== id));
      setAllTickets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.warn("Delete history failed:", err);
    } finally {
      setDeletingHistoryIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!history.length || isDeletingAllHistory) return;
    setIsDeletingAllHistory(true);
    
    try {
      const effectiveId = userId || studentCode || parentCode || '';
      await supportService.clearAllTickets(effectiveId);
      setHistory([]);
      setAllTickets([]);
    } catch (err) {
      console.error("Delete all history error:", err);
    } finally {
      setIsDeletingAllHistory(false);
      setConfirmDeleteAllHistory(false);
    }
  };

  const handleDeleteSocialNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}?userId=${encodeURIComponent(userId || studentCode || parentCode || '')}`, { method: 'DELETE' });
      setSocialNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.warn("Delete social notification failed:", err);
    }
  };

  const handleDeleteAllSocialNotifications = async () => {
    if (!socialNotifications.length) return;
    try {
      const effectiveId = userId || studentCode || parentCode || '';
      await fetch(`/api/notifications-clear-all?userId=${encodeURIComponent(effectiveId)}`, { method: 'DELETE' });
      setSocialNotifications([]);
    } catch (err) {
      console.error("Delete all social notifications error:", err);
    }
  };

  const filteredHistory = useMemo(() => {
    const displayIds = new Set(displayNotifications.map(n => String(n.id)));
    return history.filter(h => !displayIds.has(String(h.id)));
  }, [history, displayNotifications]);

  return (
    <>
      <ConfirmDialog 
        isOpen={!!targetDeleteId}
        onClose={() => setTargetDeleteId(null)}
        onConfirm={() => targetDeleteId && handleDeleteNotification(targetDeleteId)}
        title="تأكيد حذف التبليغ"
        message="هل أنت متأكد من حذف هذا التبليغ بشكل نهائي؟"
      />
      <ConfirmDialog 
        isOpen={confirmDeleteAll}
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={handleDeleteAllNotifications}
        title="حذف جميع التبليغات"
        message={`هل أنت متأكد من حذف جميع التبليغات (${displayNotifications.length})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
      <ConfirmDialog 
        isOpen={!!targetDeleteHistoryId}
        onClose={() => setTargetDeleteHistoryId(null)}
        onConfirm={() => targetDeleteHistoryId && handleDeleteHistory(targetDeleteHistoryId)}
        title="تأكيد حذف الشكوى"
        message="هل أنت متأكد من حذف هذه الشكوى من السجل بشكل نهائي؟"
      />
      <ConfirmDialog 
        isOpen={confirmDeleteAllHistory}
        onClose={() => setConfirmDeleteAllHistory(false)}
        onConfirm={handleDeleteAllHistory}
        title="حذف السجل بالكامل"
        message={`هل أنت متأكد من حذف جميع الشكاوى السابقة (${history.length})؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
      <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="support-form-backdrop"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#050A18]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        >
          <motion.div 
            key="support-form-modal"
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#0b1221] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-[0_20px_50px_rgba(34,211,238,0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0D47A1] p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFD600] p-2 rounded-xl text-black">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="font-black text-lg tracking-tight">مركز الدعم والتبليغات</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-white/5 bg-white/2">
              <button 
                onClick={() => {
                  setView('social');
                  // Mark social as read implicitly or add logic later
                  handleMarkSocialRead();
                }}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${view === 'social' ? 'text-[#FFD600] border-b-2 border-[#FFD600]' : 'text-white/30 truncate'}`}
              >
                <Bell size={16} /> الإشعارات
                {unreadSocialCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shrink-0">
                    {unreadSocialCount > 9 ? '+9' : unreadSocialCount}
                  </span>
                )}
              </button>
              <button 
                onClick={handleSwitchToHistory}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${view === 'history' ? 'text-[#FFD600] border-b-2 border-[#FFD600]' : 'text-white/30 truncate'}`}
              >
                <History size={16} /> {isTeacher ? 'تبليغات الإدارة' : 'السجل والردود'}
                {unreadAlertsCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shrink-0">
                    {unreadAlertsCount > 9 ? '+9' : unreadAlertsCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setView('form')}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${view === 'form' ? 'text-[#FFD600] border-b-2 border-[#FFD600]' : 'text-white/30 truncate'}`}
              >
                <Send size={16} /> إرسال تبليغ
              </button>
            </div>

            <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              {view === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">نوع الشكوى أو التبليغ</label>
                    <select 
                      value={issueType} 
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-cyan-500/50 outline-none transition-all"
                    >
                      <option className="bg-[#0b1221]">مشكلة تقنية</option>
                      <option className="bg-[#0b1221]">محتوى دراسي</option>
                      <option className="bg-[#0b1221]">إداري/مالي</option>
                      <option className="bg-[#0b1221]">اقتراح تطوير</option>
                      <option className="bg-[#0b1221]">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 px-1">شرح التفاصيل</label>
                    <textarea 
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm min-h-[140px] focus:border-cyan-500/50 outline-none transition-all resize-none"
                      placeholder="اكتب هنا كل ما ترغب في تبليغ الإدارة به بوضوح..."
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-[#FFD600] to-[#FFAB00] rounded-2xl font-black text-black shadow-xl shadow-yellow-500/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الإرسال الآن'}
                  </button>
                </form>
              )}
              {view === 'history' && (
                <div className="space-y-4">
                  {displayNotifications.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-[#FFD600] font-black text-sm">تبليغات الإدارة</h4>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDeleteAll(true);
                          }}
                          disabled={isDeletingAll}
                          className="text-[10px] px-4 py-2 rounded-lg font-black transition-all cursor-pointer border shadow-xl relative z-[100] active:scale-95 bg-rose-500/10 text-rose-400 border-rose-500/20 disabled:opacity-50"
                        >
                          {isDeletingAll ? 'جاري الحذف...' : 'حذف الكل'}
                        </button>
                      </div>
                      {displayNotifications.map((notif, idx) => (
                        <div key={`notif_${notif.id}_${idx}`} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="flex items-center gap-2 mb-3">
                             <Bell size={14} className="text-rose-400" />
                             <span className="text-xs font-bold text-rose-400 line-clamp-1">{typeof notif.title === 'string' ? notif.title.replace(/الأكاديمية/g, 'الإدارة') : (notif.title || 'رسالة إدارية')}</span>
                             <span className="text-[10px] text-white/40 mr-auto whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full">
                               {formatNotifDate(notif.timestamp)}
                             </span>
                           </div>
                           <p className="text-white/80 text-sm leading-relaxed mb-4">
                             {typeof notif.message === 'string' 
                               ? notif.message.replace(/الأكاديمية/g, 'الإدارة') 
                               : (typeof notif.body === 'string' && notif.body ? notif.body.replace(/الأكاديمية/g, 'الإدارة') : (notif.description || 'تبليغ إداري جديد'))}
                           </p>
                           
                           {allTickets.filter(t => t.issueType === 'رد على تبليغ إداري' && (t.broadcastId === notif.broadcastId || t.broadcastId === (notif as any).metadata?.broadcastId || t.broadcastId === notif.id))
                             .sort((a,b) => {
                               const tA = new Date(a.timestamp || 0).getTime();
                               const tB = new Date(b.timestamp || 0).getTime();
                               return tA - tB; // oldest first
                             })
                             .map((reply, rIdx) => (
                               <div key={reply.id} className="mb-3 space-y-2">
                                 <div className="bg-white/5 p-3 rounded-lg border border-white/5 ml-4">
                                   <div className="flex justify-between mb-1">
                                     <span className="text-[10px] font-bold text-white/40">ردك:</span>
                                   </div>
                                   <p className="text-white/80 text-xs">{typeof reply.message === 'string' ? reply.message.split('\n\n(تعقيباً على:')[0].replace(`[رد ومتابعة] ${studentName}:\n`, '') : ''}</p>
                                 </div>
                                 {reply.adminReply && (
                                   <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mr-4">
                                     <div className="flex items-center gap-1 mb-1">
                                       <MessageSquare size={10} className="text-emerald-400" />
                                       <span className="text-[10px] font-bold text-emerald-400">رد الإدارة:</span>
                                     </div>
                                     <p className="text-white/90 text-xs">{reply.adminReply}</p>
                                   </div>
                                 )}
                               </div>
                           ))}

                           {replyingToId === notif.id ? (
                             <div className="mt-3 p-3 bg-black/40 rounded-xl border border-white/5 space-y-3">
                               <textarea
                                 value={replyInputText}
                                 onChange={(e) => setReplyInputText(e.target.value)}
                                 placeholder="اكتب ردك هنا لتبليغ الإدارة..."
                                 className="w-full bg-transparent text-white text-xs outline-none resize-none h-16 placeholder:text-white/20"
                                 autoFocus
                               />
                               <div className="flex justify-end gap-2">
                                 <button
                                   type="button"
                                   onClick={() => setReplyingToId(null)}
                                   className="px-2.5 py-1 rounded bg-white/5 text-white/50 text-[10px] font-bold"
                                 >
                                   إلغاء
                                 </button>
                                 <button
                                   type="button"
                                   disabled={!replyInputText.trim() || isReplying}
                                   onClick={() => handleSendReply(notif.message, replyInputText, 'رد على تبليغ إداري', undefined, notif.broadcastId || (notif as any).metadata?.broadcastId || notif.id)}
                                   className="px-2.5 py-1 rounded bg-[#FFD600] text-black text-[10px] font-black"
                                 >
                                   {isReplying ? 'جاري الإرسال...' : 'إرسال الرد'}
                                 </button>
                               </div>
                             </div>
                           ) : (
                             <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-500/10 gap-2">
                               <button 
                                 type="button"
                                 onClick={() => {
                                   setReplyingToId(notif.id);
                                   setReplyInputText('');
                                 }}
                                 className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                               >
                                 <span>رد على التبليغ 💬</span>
                               </button>

                               <button 
                                 type="button"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   setTargetDeleteId(notif.id);
                                 }}
                                 disabled={isDeletingAll}
                                 className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:bg-rose-500/35 transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                                 title="حذف التبليغ"
                               >
                                 <Trash2 size={12} />
                                 <span>{isDeletingAll ? 'جاري...' : 'حذف'}</span>
                               </button>
                             </div>
                           )}
                         </div>
                      ))}
                    </div>
                  )}
                  {displayNotifications.length > 0 && filteredHistory.length > 0 && (
                    <div className="h-[1px] w-full bg-white/10 my-6" />
                  )}
                  {filteredHistory.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white/60 font-bold text-sm">سجل الشكاوى السابقة</h4>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDeleteAllHistory(true);
                          }}
                          disabled={isDeletingAllHistory}
                          className="text-[10px] px-4 py-2 rounded-lg font-black transition-all cursor-pointer border shadow-xl relative z-[100] active:scale-95 bg-rose-500/10 text-rose-400 border-rose-500/20 disabled:opacity-50"
                        >
                          {isDeletingAllHistory ? 'جاري الحذف...' : 'حذف السجل'}
                        </button>
                      </div>
                      {filteredHistory.map((record, idx) => (
                        <div key={`history_${record.id}_${idx}`} className="bg-white/5 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded uppercase tracking-widest">{record.issueType}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded ${record.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                                {record.status === 'resolved' ? 'تم الرد' : 'قيد المراجعة'}
                              </span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTargetDeleteHistoryId(record.id);
                                }}
                                disabled={deletingHistoryIds.has(record.id)}
                                className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-90 disabled:opacity-50"
                                title="حذف من السجل"
                              >
                                {deletingHistoryIds.has(record.id) ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Trash2 size={12} /></motion.div> : <Trash2 size={12} />}
                              </button>
                            </div>
                          </div>
                          <p className="text-white/80 text-sm mb-3 leading-relaxed">{record.message}</p>
                          
                          {record.adminReply && (
                            <div className="bg-white/5 p-4 rounded-xl border-r-4 border-[#FFD600] mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={12} className="text-[#FFD600]" />
                                <span className="text-[11px] font-black text-[#FFD600]">رد الإدارة الرسمي:</span>
                              </div>
                              <p className="text-white text-sm font-medium leading-relaxed mb-3">{typeof record.adminReply === 'string' ? record.adminReply.replace(/الأكاديمية/g, 'الإدارة') : record.adminReply}</p>
                              
                              {replyingToId === record.id ? (
                                <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5 space-y-3">
                                  <textarea
                                    value={replyInputText}
                                    onChange={(e) => setReplyInputText(e.target.value)}
                                    placeholder="اكتب تعقيبك أو تعليقك للإدارة هنا..."
                                    className="w-full bg-transparent text-white text-xs outline-none resize-none h-16 placeholder:text-white/20"
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setReplyingToId(null)}
                                      className="px-2.5 py-1 rounded bg-white/5 text-white/50 text-[10px] font-bold"
                                    >
                                      إلغاء
                                    </button>
                                    <button
                                      type="button"
                                      disabled={!replyInputText.trim() || isReplying}
                                      onClick={() => handleSendReply(record.message, replyInputText, record.issueType, record.id, record.broadcastId)}
                                      className="px-2.5 py-1 rounded bg-[#FFD600] text-black text-[10px] font-black"
                                    >
                                      {isReplying ? 'جاري الإرسال...' : 'إرسال الرد'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(record.id);
                                    setReplyInputText('');
                                  }}
                                  className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <span>تعقيب أو رد على الرسالة 💬</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredHistory.length === 0 && displayNotifications.length === 0 && (
                    <div className="text-center py-10 opacity-30 italic text-sm">لا يوجد لديك سجل تبليغات حتى الآن.</div>
                  )}
                </div>
              )}
              {view === 'social' && (
                <div className="space-y-0">
                  {socialNotifications.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-white/50 text-xs font-bold">إشعارات المنصة</span>
                        <button 
                          onClick={handleDeleteAllSocialNotifications}
                          className="text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                        >
                          مسح الكل
                        </button>
                      </div>
                      <div className="divide-y divide-white/5 border-t border-white/5">
                        {socialNotifications.map((notif, idx) => (
                          <div key={`social_${notif.id}_${idx}`} className={`py-4 px-2 flex items-center justify-between gap-3 group transition-all hover:bg-white/[0.02] ${notif.read ? 'opacity-70' : 'bg-[#00E5FF]/5'}`}>
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                              <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-white/5 flex items-center justify-center border border-white/10">
                                {notif.senderPhoto ? (
                                  <img src={notif.senderPhoto} alt="user" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm font-bold">{notif.senderName?.[0]}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col text-right items-start" dir="rtl">
                                <p className="text-xs sm:text-sm font-medium text-white/90 truncate max-w-full">
                                  {notif.senderName && <span className="text-[#00E5FF] px-1 font-bold">{notif.senderName}</span>}
                                  {notif.type === 'like' && 'أعجب بمنشورك.'}
                                  {notif.type === 'comment' && 'علق على منشورك.'}
                                  {notif.type === 'mention_comment' && 'أشار إليك في تعليق.'}
                                  {notif.type === 'mention_post' && 'أشار إليك في منشور.'}
                                  {notif.type === 'mention_story' && 'أشار إليك في حالة.'}
                                  {notif.type === 'mention' && 'أشار إليك.'}
                                  {/* Fallback for other notification types that might be in this list */}
                                  {!['like', 'comment', 'mention_comment', 'mention_post', 'mention_story', 'mention'].includes(notif.type) && (
                                    <span className="opacity-90">{notif.title || notif.message || notif.body || 'لديك إشعار جديد'}</span>
                                  )}
                                </p>
                                <span className="text-[10px] text-white/40 block mt-0.5">{formatNotifDate(notif.timestamp)}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteSocialNotification(notif.id)}
                              className="text-white/20 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              title="حذف"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 opacity-30 italic text-sm">لا توجد إشعارات حالياً.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};
