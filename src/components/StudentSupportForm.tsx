import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ShieldAlert, X, MessageSquare, History, Send, Bell, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

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
}

interface TicketRecord {
  id: string;
  message: string;
  issueType: string;
  adminReply?: string;
  status: string;
  timestamp: any;
  readByStudent?: boolean;
  userId: string;
  role: string;
  broadcastId?: string;
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
  onSocialUnreadCount
}) => {
  const [view, setView] = useState<'form' | 'history' | 'social'>('social');
  const [issueType, setIssueType] = useState('مشكلة تقنية');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<TicketRecord[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [socialNotifications, setSocialNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (onSocialUnreadCount) {
      const unread = socialNotifications.filter(n => !n.read).length;
      onSocialUnreadCount(unread);
    }
  }, [socialNotifications, onSocialUnreadCount]);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
     if (!isOpen) return;
     try {
      const unsubs: any[] = [];
      
      let items1: any[] = [];
      let items2: any[] = [];
      
      const updateCombined = () => {
        const map = new Map();
        items1.forEach(x => map.set(x.id, x));
        items2.forEach(x => map.set(x.id, x));
        setSocialNotifications(Array.from(map.values()).sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
      };

      if (userId) {
        const q1 = query(collection(db, 'social_notifications'), where('recipientUserId', '==', userId));
        unsubs.push(onSnapshot(q1, snap => {
           items1 = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           updateCombined();
        }, error => {
           console.warn("Error fetching social_notifications for userId:", error);
        }));
      }
      if (studentName) {
        const q2 = query(collection(db, 'social_notifications'), where('recipientName', '==', studentName));
        unsubs.push(onSnapshot(q2, snap => {
           items2 = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
           updateCombined();
        }, error => {
           console.warn("Error fetching social_notifications for studentName:", error);
        }));
      }
       return () => unsubs.forEach(u => u());
     } catch (e) {
       console.warn("Social notifications error:", e);
     }
  }, [isOpen, userId, studentName]);

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
      
      await addDoc(collection(db, 'support_tickets'), {
        userId: userId || studentCode || parentCode || '',
        role,
        studentName,
        grade,
        issueType: originalIssueType || 'متابعة',
        message: fullMessage,
        timestamp: serverTimestamp(),
        status: 'pending',
        readByAdmin: false,
        senderType: role === 'parent' ? 'parent' : isTeacher ? 'teacher' : 'student',
        replyToTicketId: replyToTicketId || null,
        broadcastId: broadcastId || null
      });
      
      setReplyInputText('');
      setReplyingToId(null);
      setView('history');
    } catch (e) {
      console.error("Error sending reply:", e);
    } finally {
      setIsReplying(false);
    }
  };

  useEffect(() => {
    console.log("StudentSupportForm notifications:", notifications);
    if (!isOpen || !auth.currentUser || (!userId && !studentCode && !parentCode)) return;

    const possibleIdsSet = new Set<string>();
    const hasSpecificCode = Boolean(studentCode || parentCode);

    if (userId && !hasSpecificCode) {
      possibleIdsSet.add(userId);
      possibleIdsSet.add(userId.trim());
      possibleIdsSet.add(userId.trim().toUpperCase());
      possibleIdsSet.add(userId.trim().toLowerCase());
    }
    
    const processCode = (rawCode?: string, isParent = false) => {
      if (!rawCode) return;
      const clean = rawCode.trim();
      const upper = clean.toUpperCase();
      const lower = clean.toLowerCase();
      
      possibleIdsSet.add(clean);
      possibleIdsSet.add(upper);
      possibleIdsSet.add(lower);
      
      const prefix = isParent ? 'pcode_' : (isTeacher || upper.startsWith('TCH-') ? 'tcode_' : 'scode_');
      possibleIdsSet.add(`${prefix}${clean}`);
      possibleIdsSet.add(`${prefix}${upper}`);
      possibleIdsSet.add(`${prefix}${lower}`);

      if (upper.startsWith('TCH-')) {
        possibleIdsSet.add(`tcode_${clean}`);
        possibleIdsSet.add(`tcode_${upper}`);
        possibleIdsSet.add(`tcode_${lower}`);
      }
      
      if (upper.startsWith('S-') || upper.startsWith('P-')) {
        const pure = upper.slice(2);
        possibleIdsSet.add(pure);
        possibleIdsSet.add(pure.toLowerCase());
        possibleIdsSet.add(`${prefix}${pure}`);
        possibleIdsSet.add(`${prefix}${pure.toLowerCase()}`);
      } else if (upper.startsWith('STU-') || upper.startsWith('PAR-')) {
        const pure = upper.startsWith('STU-') ? upper.slice(4) : upper.slice(4);
        possibleIdsSet.add(pure);
        possibleIdsSet.add(pure.toLowerCase());
        possibleIdsSet.add(`${prefix}${pure}`);
        possibleIdsSet.add(`${prefix}${pure.toLowerCase()}`);
      } else {
        const signPrefix = isParent ? 'P-' : 'S-';
        possibleIdsSet.add(`${signPrefix}${upper}`);
        possibleIdsSet.add(`${signPrefix}${lower}`);
        possibleIdsSet.add(`${prefix}${signPrefix}${upper}`);
        possibleIdsSet.add(`${prefix}${signPrefix}${lower}`);
      }
    };
    
    if (role === 'parent') {
      processCode(parentCode, true);
    } else {
      processCode(studentCode, false);
    }
    
    const possibleIds = Array.from(possibleIdsSet).filter(Boolean).slice(0, 30);

    if (possibleIds.length === 0) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', 'in', possibleIds)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Got tickets, count:", snapshot.docs.length, "for possibleIds:", possibleIds);
      const allRecords = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as TicketRecord))
        .filter(r => r.role === role);
      
      allRecords.sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime());
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime());
        return tA - tB; // oldest first for chronological replies, history will reverse it
      });

      setAllTickets(allRecords);

      const historyRecords = [...allRecords]
        .filter(r => r.issueType !== 'تبليغ إداري' && r.issueType !== 'رد على تبليغ إداري')
        .reverse(); // newest first for history

      setHistory(historyRecords);
    }, (error) => {
      console.warn("StudentSupportForm error:", error);
    });
    return () => unsubscribe();
  }, [isOpen, userId, isTeacher, studentCode, parentCode]);

  const displayNotifications = (notifications || []).filter(n => {
    if (!n.title) return false;
    const lowercaseTitle = n.title.toLowerCase();
    if (lowercaseTitle.includes('مرحباً بك') || lowercaseTitle.includes('welcome to bayraq')) return false;
    if (lowercaseTitle.includes('خطأ في') || lowercaseTitle.includes('خطأ') || n.type === 'alarm') return false;
    if (n.message && (n.message.includes('تم نشر الإعلان') || n.message.includes('أجهزة وواجهات جميع المستخدمين'))) return false;
    if (n.title && (n.title.includes('تم نشر الإعلان') || (n.title === 'نجاح' && n.message?.includes('تم نشر')))) return false;
    return true;
  });

  useEffect(() => {
    if (isOpen && view === 'history') {
      const unreadTickets = allTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined));
      if (unreadTickets.length > 0) {
        markAsRead(unreadTickets);
      }
      
      const unreadNotifs = displayNotifications.filter(n => !n.read);
      if (unreadNotifs.length > 0) {
        markNotificationsAsRead(unreadNotifs);
      }
    }

    if (isOpen && view === 'social') {
      handleMarkSocialRead();
    }
  }, [isOpen, view, allTickets, notifications, socialNotifications]);

  const markAsRead = async (tickets: TicketRecord[]) => {
    for (const ticket of tickets) {
      await updateDoc(doc(db, 'support_tickets', ticket.id), { readByStudent: true });
    }
  };

  const markNotificationsAsRead = async (notifs: AppNotification[]) => {
    for (const notif of notifs) {
      if (onMarkNotificationAsRead) {
        onMarkNotificationAsRead(notif.id);
      } else {
        try {
          await updateDoc(doc(db, 'notifications', notif.id), { read: true });
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
         await updateDoc(doc(db, 'social_notifications', notif.id), { read: true });
      } catch (e) {
         console.warn("Could not mark social notif as read", e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: userId || studentCode || parentCode || '',
        role,
        studentName,
        grade,
        issueType,
        message,
        timestamp: serverTimestamp(),
        status: 'pending',
        senderType: role === 'parent' ? 'parent' : isTeacher ? 'teacher' : 'student'
      });
      setMessage('');
      handleSwitchToHistory();
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const hasUnreadAlerts = allTickets.some(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined)) || 
                          (displayNotifications && displayNotifications.some(n => !n.read));

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

  const handleDeleteNotification = async (id: string) => {
    if (!id) return;
    
    // 1. Optimistic UI update
    if (onDeleteNotification) onDeleteNotification(id);
    setTargetDeleteId(null);
    
    // 2. background firestore delete
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.warn("Firestore delete failed:", err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!displayNotifications.length) return;
    
    const count = displayNotifications.length;
    const idsToDelete = displayNotifications.map(n => n.id);

    // 1. Optimistic UI update
    if (onClearAllNotifications) onClearAllNotifications();
    setConfirmDeleteAll(false);
    
    // 2. background firestore delete
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'notifications', id)).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.error("Delete all error:", err);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!id) return;
    setTargetDeleteHistoryId(null);
    try {
      await deleteDoc(doc(db, 'support_tickets', id));
    } catch (err) {
      console.warn("Firestore delete history failed:", err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!history.length) return;
    const idsToDelete = history.map(h => h.id);
    setConfirmDeleteAllHistory(false);
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'support_tickets', id)).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.error("Delete all history error:", err);
    }
  };

  const handleDeleteSocialNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'social_notifications', id));
    } catch (err) {
      console.warn("Delete social notification failed:", err);
    }
  };

  const handleDeleteAllSocialNotifications = async () => {
    if (!socialNotifications.length) return;
    const idsToDelete = socialNotifications.map(n => n.id);
    try {
      const promises = idsToDelete.map(id => deleteDoc(doc(db, 'social_notifications', id)).catch(() => {}));
      await Promise.all(promises);
    } catch (err) {
      console.error("Delete all social notifications error:", err);
    }
  };

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
                {socialNotifications.some(n => !n.read) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                )}
              </button>
              <button 
                onClick={handleSwitchToHistory}
                className={`flex-1 py-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${view === 'history' ? 'text-[#FFD600] border-b-2 border-[#FFD600]' : 'text-white/30 truncate'}`}
              >
                <History size={16} /> {isTeacher ? 'تبليغات الإدارة' : 'السجل والردود'}
                {hasUnreadAlerts && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
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
                          className="text-[10px] px-4 py-2 rounded-lg font-black transition-all cursor-pointer border shadow-xl relative z-[100] active:scale-95 bg-rose-500/10 text-rose-400 border-rose-500/20"
                        >
                          حذف الكل
                        </button>
                      </div>
                      {displayNotifications.map((notif, idx) => (
                        <div key={`notif_${notif.id}_${idx}`} className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 relative overflow-hidden group">
                          <div className="flex items-center gap-2 mb-3">
                             <Bell size={14} className="text-rose-400" />
                             <span className="text-xs font-bold text-rose-400 line-clamp-1">{typeof notif.title === 'string' ? notif.title.replace(/الأكاديمية/g, 'الإدارة') : notif.title}</span>
                             <span className="text-[10px] text-white/40 mr-auto whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full">
                               {formatNotifDate(notif.timestamp)}
                             </span>
                           </div>
                           <p className="text-white/80 text-sm leading-relaxed mb-4">{typeof notif.message === 'string' ? notif.message.replace(/الأكاديمية/g, 'الإدارة') : notif.message}</p>
                           
                           {allTickets.filter(t => t.issueType === 'رد على تبليغ إداري' && (t.broadcastId === notif.broadcastId || t.broadcastId === notif.id))
                             .sort((a,b) => {
                               const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime());
                               const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime());
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
                                   onClick={() => handleSendReply(notif.message, replyInputText, 'رد على تبليغ إداري', undefined, notif.broadcastId || notif.id)}
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
                                 className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-rose-500/25 text-rose-400 border border-rose-500/30 hover:bg-rose-500/35 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                 title="حذف التبليغ"
                               >
                                 <Trash2 size={12} />
                                 <span>حذف</span>
                               </button>
                             </div>
                           )}
                         </div>
                      ))}
                    </div>
                  )}
                  {displayNotifications.length > 0 && history.length > 0 && (
                    <div className="h-[1px] w-full bg-white/10 my-6" />
                  )}
                  {history.length > 0 && (
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
                          className="text-[10px] px-4 py-2 rounded-lg font-black transition-all cursor-pointer border shadow-xl relative z-[100] active:scale-95 bg-rose-500/10 text-rose-400 border-rose-500/20"
                        >
                          حذف السجل
                        </button>
                      </div>
                      {history.map((record, idx) => (
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
                                className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-90"
                                title="حذف من السجل"
                              >
                                <Trash2 size={12} />
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
                  {history.length === 0 && displayNotifications.length === 0 && (
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
                                  <span className="text-[#00E5FF] px-1 font-bold">{notif.senderName}</span>
                                  {notif.type === 'like' && 'أعجب بمنشورك.'}
                                  {notif.type === 'comment' && 'علق على منشورك.'}
                                  {notif.type === 'mention_comment' && 'أشار إليك في تعليق.'}
                                  {notif.type === 'mention_post' && 'أشار إليك في منشور.'}
                                  {notif.type === 'mention_story' && 'أشار إليك في حالة.'}
                                  {notif.type === 'mention' && 'أشار إليك.'}
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
