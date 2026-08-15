import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle2, Trash2, ShieldAlert, BadgeCheck } from 'lucide-react';
import { logActivity } from '../utils/auditLogger';

interface SupportTicket {
  id: string;
  studentName: string;
  grade?: string;
  issueType: string;
  message: string;
  timestamp: any;
  status: 'pending' | 'resolved';
  isGroup?: boolean;
  adminReply?: string;
  role?: 'student' | 'teacher' | 'staff' | 'parent';
  broadcastId?: string;
  senderType?: string;
  readByAdmin?: boolean;
}

interface SupportManagerProps {
  onSubViewChange?: (isOpen: boolean) => void;
}

export const SupportManager: React.FC<SupportManagerProps> = ({ onSubViewChange }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTicket, setReplyTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'parent' | 'staff'>('student');

  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(!!replyTicket);
    }
    return () => {
      if (onSubViewChange) {
        onSubViewChange(false);
      }
    };
  }, [replyTicket, onSubViewChange]);

  useEffect(() => {
    const q = query(
      collection(db, 'support_tickets')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setTickets(ticketsData.filter(t => !t.broadcastId && t.issueType !== 'تبليغ إداري')); // Filter out broadcasts and admin notifications
      setLoading(false);
    }, (error) => {
      console.warn("SupportManager error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getTicketTabId = (t: SupportTicket): 'student' | 'teacher' | 'parent' | 'staff' => {
    const rawVal = t.senderType || t.role || '';
    if (!rawVal) return 'student';
    const r = String(rawVal).toLowerCase();
    if (r.includes('teacher') || r.includes('cadre') || r.includes('أستاذ') || r.includes('كادر')) return 'teacher';
    if (r.includes('parent') || r.includes('أمر') || r.includes('ولي')) return 'parent';
    if (r.includes('staff') || r.includes('موظف')) return 'staff';
    return 'student';
  };

  const getPendingCountForTab = (tabId: 'student' | 'teacher' | 'parent' | 'staff') => {
    return tickets.filter(t => 
      getTicketTabId(t) === tabId && 
      t.status === 'pending' && 
      !t.readByAdmin
    ).length;
  };

  const attemptedTicketIds = React.useRef<Set<string>>(new Set());

  const markTabTicketsAsRead = async (tab: 'student' | 'teacher' | 'parent' | 'staff') => {
    const unreadUnderTab = tickets.filter(t => 
      getTicketTabId(t) === tab && 
      t.status === 'pending' && 
      !t.readByAdmin &&
      !attemptedTicketIds.current.has(t.id)
    );
    if (unreadUnderTab.length === 0) return;
    
    const promises = unreadUnderTab.map(ticket => {
      attemptedTicketIds.current.add(ticket.id);
      return updateDoc(doc(db, 'support_tickets', ticket.id), { readByAdmin: true }).catch(err => 
        console.error("Could not mark ticket as read:", ticket.id, err)
      );
    });
    await Promise.all(promises);
  };

  useEffect(() => {
    if (tickets.length > 0) {
      markTabTicketsAsRead(activeTab);
    }
  }, [activeTab, tickets]);

  const groupedTickets = React.useMemo(() => {
    const tabTickets = tickets.filter(t => getTicketTabId(t) === activeTab);
    const groups: Record<string, SupportTicket[]> = {};
    const singles: SupportTicket[] = [];

    tabTickets.forEach(t => {
      if (t.broadcastId) {
        if (!groups[t.broadcastId]) groups[t.broadcastId] = [];
        groups[t.broadcastId].push(t);
      } else {
        singles.push(t);
      }
    });

    // Merge: for each group, only represent as ONE entry
    const merged = [...singles];
    Object.entries(groups).forEach(([bid, groupTickets]) => {
      const first = groupTickets[0];
      merged.push({
        ...first,
        id: `group_${bid}`,
        studentName: `تبليغ جماعي (${groupTickets.length} مستلم)`,
        message: first.message,
        isGroup: true,
        originalIds: groupTickets.map(gt => gt.id)
      } as any);
    });

    // Sort again by timestamp descending
    return merged.sort((a, b) => {
      const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime());
      const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : (b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime());
      return tB - tA;
    });
  }, [tickets, activeTab]);

  const filteredTickets = groupedTickets;

  const handleReply = async () => {
    if (!replyTicket || !replyMessage.trim()) return;
    const targetLabel = replyTicket.role === 'teacher' ? 'الأستاذ' : 'الطالب';
    await updateDoc(doc(db, 'support_tickets', replyTicket.id), { 
      status: 'resolved',
      adminReply: replyMessage 
    });

    logActivity({
      action: 'الرد على شكوى',
      details: `تم الرد على شكوى ${targetLabel}: ${replyTicket.studentName} وتغيير حالتها إلى مكتمل`,
      targetId: replyTicket.id,
      targetType: 'support_ticket',
      targetName: replyTicket.studentName
    });

    setReplyMessage('');
    setReplyTicket(null);
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('group_')) {
      const ticket = groupedTickets.find(t => t.id === id) as any;
      if (ticket && ticket.originalIds) {
        if (confirm(`هل أنت متأكد من حذف هذا التبليغ الجماعي لـ ${ticket.originalIds.length} مستخدم؟`)) {
          const promises = ticket.originalIds.map((origId: string) => deleteDoc(doc(db, 'support_tickets', origId)));
          await Promise.all(promises);
          
          logActivity({
            action: 'حذف تبليغ جماعي',
            details: `تم حذف تبليغ جماعي (${ticket.originalIds.length} رسالة)`,
            targetType: 'support_ticket_group'
          });
        }
      }
      return;
    }

    const ticket = tickets.find(t => t.id === id);
    const name = ticket?.studentName || 'غير معروف';
    const targetLabel = ticket?.role === 'teacher' ? 'الأستاذ' : 'الطالب';
    
    await deleteDoc(doc(db, 'support_tickets', id));

    logActivity({
      action: 'حذف شكوى',
      details: `تم حذف شكوى ${targetLabel}: ${name} من النظام`,
      targetId: id,
      targetType: 'support_ticket',
      targetName: name
    });
  };

  if (loading) return <div className="text-cyan-400 p-8 animate-pulse text-center font-bold">جاري تأمين لوحة التحكم ...</div>;

  return (
    <div className="bg-[#0b1221]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 text-white shadow-[0_0_50px_-12px_rgba(34,211,238,0.2)]">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 tracking-tight">
            مركز عمليات الدعم والشكاوى
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {activeTab === 'student' ? 'إدارة حالات الطلاب والإشراف الأكاديمي' : 'إدارة طلبات الكادر التدريسي والموظفين'}
          </p>
        </div>
        
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 shrink-0 overflow-x-auto no-scrollbar max-w-full">
          {([
            { id: 'student', label: 'الطلاب', bg: 'bg-cyan-600' },
            { id: 'parent', label: 'أولياء الأمور', bg: 'bg-purple-600' },
            { id: 'teacher', label: 'الكادر', bg: 'bg-emerald-600' },
            { id: 'staff', label: 'الموظفين', bg: 'bg-amber-600' }
          ] as { id: 'student' | 'parent' | 'teacher' | 'staff', label: string, bg: string }[]).map((tab) => {
            const count = getPendingCountForTab(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${isActive ? `${tab.bg} text-white shadow-lg` : 'text-white/30 hover:text-white/60'}`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 px-1 bg-rose-500 rounded-full flex items-center justify-center border border-[#0b1221] animate-pulse text-[9.5px] text-white font-black shadow-md z-30">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTickets.map((ticket) => (
          <motion.div 
            key={ticket.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 border border-white/10 p-7 rounded-3xl hover:border-cyan-500/30 transition-all group flex flex-col justify-between"
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="font-black text-xl text-white mb-1.5 flex items-center gap-2">
                  {ticket.studentName}
                  {!ticket.readByAdmin && ticket.status === 'pending' && (
                     <span className="bg-rose-500/25 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-black border border-rose-500/30 animate-pulse">
                       جديد 🔔
                     </span>
                  )}
                  {ticket.isGroup && (
                     <span className="bg-orange-500/20 text-orange-400 text-[9px] px-2 py-0.5 rounded-full font-black border border-orange-500/30">
                       تبليغ جماعي
                     </span>
                  )}
                </h3>
                <span className="text-xs font-bold text-amber-500/90">{ticket.grade || 'غير محدد'}</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                ticket.status === 'resolved' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {ticket.status === 'resolved' ? 'مـكتمل' : 'معلـق'}
              </span>
            </div>
            
            <div className="bg-black/20 p-5 rounded-2xl mb-6 border border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold block mb-2">{ticket.issueType}</span>
                <p className="text-sm text-white/70 leading-relaxed">{ticket.message}</p>
            </div>
            
            <div className="flex justify-between items-center mt-auto">
              <span className="text-[11px] text-white/30 font-mono">
                {ticket.timestamp?.toDate ? ticket.timestamp.toDate().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
              </span>
              <div className="flex gap-2">
                {!ticket.isGroup && ticket.status !== 'resolved' && (
                  <button 
                    onClick={() => setReplyTicket(ticket)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${ticket.role === 'teacher' ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white hover:shadow-amber-500/20' : ticket.role === 'parent' ? 'bg-gradient-to-br from-purple-600 to-pink-700 text-white hover:shadow-purple-500/20' : 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white hover:shadow-cyan-500/20'}`}
                  >
                    الرد على {ticket.role === 'teacher' ? 'الأستاذ' : ticket.role === 'parent' ? 'ولي الأمر' : ticket.role === 'staff' ? 'الموظف' : 'الطالب'}
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(ticket.id)}
                  className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/30 text-sm">لا توجد بلاغات أو شكاوى في هذا القسم حالياً.</div>
        )}
      </div>
      
      {/* Reply Modal */}
      {replyTicket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#101935] border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
                <h3 className={`text-xl font-black mb-6 ${replyTicket.role === 'teacher' ? 'text-amber-400' : 'text-cyan-400'}`}>الرد على: {replyTicket.studentName}</h3>
                <textarea 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className={`w-full bg-black/30 text-white p-4 rounded-2xl mb-6 text-sm border border-white/10 outline-none min-h-[150px] ${replyTicket.role === 'teacher' ? 'focus:border-amber-500' : 'focus:border-cyan-500'}`}
                    placeholder={`اكتب الرد الرسمي ل${replyTicket.role === 'teacher' ? 'للأستاذ' : 'للطالب'}...`}
                />
                <div className="flex gap-3">
                    <button onClick={handleReply} className={`flex-1 py-3 rounded-xl text-sm font-bold text-white ${replyTicket.role === 'teacher' ? 'bg-amber-600' : 'bg-emerald-600'}`}>إرسال الإشعار</button>
                    <button onClick={() => setReplyTicket(null)} className="px-6 py-3 bg-white/10 rounded-xl text-sm font-bold text-white">إلغاء</button>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
};
