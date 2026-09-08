import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, CheckCircle2, XCircle, Clock, Search, MessageSquare, Send, BrainCircuit, Filter, Users, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import { logActivity } from '../utils/auditLogger';
import { ConfirmDialog } from './ConfirmDialog';
import { ideaService, IdeaSubmit, CouncilPoll } from '../services/ideaService';
import { notificationService } from '../services/notificationService';
import { CardGridSkeleton } from './shared/ShimmerSkeleton';

export interface IdeaBankAdminViewProps {
  schoolId: string | null;
  schoolName?: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  defaultTab?: 'ideas' | 'council';
  onReadTab?: (tab: 'ideas' | 'council') => void;
}

export const IdeaBankAdminView: React.FC<IdeaBankAdminViewProps> = ({ schoolId, showToast, defaultTab = 'ideas', onReadTab }) => {
  const [ideas, setIdeas] = useState<IdeaSubmit[]>([]);
  const [polls, setPolls] = useState<CouncilPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ideas' | 'council'>(defaultTab);

  const [readIdeasTs, setReadIdeasTs] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('bairaq_admin_read_ideas_ts') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [readCouncilTs, setReadCouncilTs] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('bairaq_admin_read_council_ts') || '0', 10);
    } catch {
      return 0;
    }
  });

  // تحديث التبويب إذا تم تمرير defaultTab مختلف
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const markIdeasRead = React.useCallback(() => {
    const now = Date.now();
    setReadIdeasTs(now);
    try {
      localStorage.setItem('bairaq_admin_read_ideas_ts', now.toString());
      window.dispatchEvent(new CustomEvent('bairaq:ideabank-read-update', { detail: { tab: 'ideas' } }));
    } catch (e) {}
    onReadTab?.('ideas');
  }, [onReadTab]);

  const markCouncilRead = React.useCallback(() => {
    const now = Date.now();
    setReadCouncilTs(now);
    try {
      localStorage.setItem('bairaq_admin_read_council_ts', now.toString());
      window.dispatchEvent(new CustomEvent('bairaq:ideabank-read-update', { detail: { tab: 'council' } }));
    } catch (e) {}
    onReadTab?.('council');
  }, [onReadTab]);

  // دالة مساعدة لضمان إسناد الاقتراح لولي الأمر وليس الطالب
  const formatParentSender = (name?: string) => {
    if (!name) return 'ولي أمر';
    const clean = name.trim();
    if (clean === 'الإدارة المدرسية' || clean === 'الإدارة العامة' || clean === 'الإدارة') return clean;
    if (clean.startsWith('ولي أمر') || clean.startsWith('ولي امر')) return clean;
    return `ولي أمر ${clean}`;
  };

  const unreadIdeasCount = React.useMemo(() => {
    return ideas.filter(idea => {
      if (idea.status !== 'pending') return false;
      const t = idea.timestamp ? new Date(idea.timestamp).getTime() : 0;
      return t > readIdeasTs;
    }).length;
  }, [ideas, readIdeasTs]);

  const unreadCouncilCount = React.useMemo(() => {
    return polls.filter(poll => {
      if (poll.type !== 'parent' && poll.authorName === 'الإدارة المدرسية') return false;
      const t = poll.timestamp ? new Date(poll.timestamp).getTime() : 0;
      return t > readCouncilTs;
    }).length;
  }, [polls, readCouncilTs]);

  // عند الدخول، نميز التبويب النشط كمقروء لإخفاء إشعاره
  useEffect(() => {
    if (activeTab === 'ideas' && unreadIdeasCount > 0) {
      markIdeasRead();
    } else if (activeTab === 'council' && unreadCouncilCount > 0) {
      markCouncilRead();
    }
  }, [activeTab, unreadIdeasCount, unreadCouncilCount, markIdeasRead, markCouncilRead]);
  
  const [replyIdea, setReplyIdea] = useState<IdeaSubmit | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  
  const [statusUpdateIdea, setStatusUpdateIdea] = useState<{ideaId: string, status: string} | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollTargetGrade, setPollTargetGrade] = useState('all');
  const [showPollForm, setShowPollForm] = useState(false);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  
  const [resolvingPoll, setResolvingPoll] = useState<CouncilPoll | null>(null);
  const [pollResolveStatus, setPollResolveStatus] = useState<'implemented' | 'rejected'>('implemented');
  const [pollAdminReply, setPollAdminReply] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ideasData, pollsData] = await Promise.all([
        ideaService.fetchIdeas(schoolId || undefined),
        ideaService.fetchPolls(schoolId || undefined)
      ]);
      setIdeas(ideasData);
      setPolls(pollsData);
    } catch (err) {
      console.warn("IdeaBankAdmin load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollDesc.trim()) return;

    setIsSubmittingPoll(true);
    try {
      await ideaService.createPoll({
        schoolId: schoolId || undefined,
        title: pollTitle.trim() || 'مقترح إداري عام',
        description: pollDesc,
        type: 'admin',
        authorId: 'admin',
        authorName: 'الإدارة المدرسية',
        status: 'active',
        votes: {},
        targetGrade: pollTargetGrade
      });
      setPollTitle('');
      setPollDesc('');
      setPollTargetGrade('all');
      setShowPollForm(false);
      loadData();
      logActivity({
        action: 'طرح مقترح جديد',
        details: `طرح مقترح للتصويت العام بعنوان: ${pollTitle}`,
        targetType: 'idea_bank'
      });
      showToast('تم طرح المقترح بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء طرح المقترح', 'error');
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleTogglePollStatus = async (pollId: string, currentStatus: string) => {
    try {
      await ideaService.updatePoll(pollId, {
        status: currentStatus === 'active' ? 'closed' : 'active'
      });
      loadData();
      showToast('تم تحديث حالة التصويت');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolvePoll = async () => {
    if (!resolvingPoll) return;
    try {
      await ideaService.updatePoll(resolvingPoll.id, {
        status: pollResolveStatus,
        adminReply: pollAdminReply.trim() || (pollResolveStatus === 'implemented' ? 'تم تنفيذ المقترح بناءً على تصويت المجلس.' : '')
      });
      
      // Notify parent if the poll author was a parent
      if (resolvingPoll.authorId && resolvingPoll.authorId !== 'admin') {
         await notificationService.sendNotification({
           userId: resolvingPoll.authorId,
           title: pollResolveStatus === 'implemented' ? 'تم تنفيذ مقترحك! 🌟' : 'تحديث على مقترحك في المجلس',
           message: pollResolveStatus === 'implemented' 
               ? `لقد تم تنفيذ مقترحك "${resolvingPoll.title}". شكراً لك!`
               : `تم رفض مقترحك "${resolvingPoll.title}" مع السبب: ${pollAdminReply.trim()}`,
           type: 'system'
         });
      }

      setResolvingPoll(null);
      setPollAdminReply('');
      loadData();
      logActivity({
        action: 'تحديث مقترح مجلس',
        details: `تم تحديث مقترح المجلس إلى ${pollResolveStatus}`,
        targetType: 'idea_bank'
      });
      showToast('تم تحديث المقترح بنجاح');
    } catch (err) {
      console.error(err);
    }
  };

  const getGradeLabel = (gradeValue: string) => {
    const gradesMap: Record<string, string> = {
      'all': 'عام (جميع الصفوف)',
      '1': 'الأول الابتدائي',
      '2': 'الثاني الابتدائي',
      '3': 'الثالث الابتدائي',
      '4': 'الرابع الابتدائي',
      '5': 'الخامس الابتدائي',
      '6': 'السادس الابتدائي',
      '7': 'الأول المتوسط',
      '8': 'الثاني المتوسط',
      '9': 'الثالث المتوسط',
      '10_sci': 'الرابع العلمي',
      '10_lit': 'الرابع الأدبي',
      '11_sci': 'الخامس العلمي',
      '11_lit': 'الخامس الأدبي',
      '12_sci': 'السادس العلمي',
      '12_lit': 'السادس الأدبي',
    };
    return gradesMap[gradeValue] || gradeValue;
  };

  const handleDeleteIdea = (ideaId: string) => {
    openConfirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المقترح؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      try {
        await ideaService.deleteIdea(ideaId);
        loadData();
        showToast('تم حذف المقترح بنجاح');
      } catch (err) {
        console.error("Error deleting idea:", err);
      }
    });
  };

  const handleDeleteAllIdeas = () => {
    openConfirm('تأكيد حذف الكل', 'هل أنت متأكد من حذف جميع المقترحات؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      try {
        const promises = ideas.map(idea => ideaService.deleteIdea(idea.id));
        await Promise.all(promises);
        loadData();
        showToast('تم حذف جميع المقترحات');
      } catch (err) {
        console.error("Error deleting all ideas:", err);
      }
    });
  };

  const handleDeletePoll = (pollId: string) => {
    openConfirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذا التصويت؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      try {
        await ideaService.deletePoll(pollId);
        loadData();
        showToast('تم حذف التصويت بنجاح');
      } catch (err) {
        console.error("Error deleting poll:", err);
      }
    });
  };

  const handleDeleteAllPolls = () => {
    openConfirm('تأكيد حذف الكل', 'هل أنت متأكد من حذف جميع التصويتات؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      try {
        const promises = polls.map(poll => ideaService.deletePoll(poll.id));
        await Promise.all(promises);
        loadData();
        showToast('تم حذف جميع التصويتات');
      } catch (err) {
        console.error("Error deleting all polls:", err);
      }
    });
  };

  const handleUpdateStatus = async () => {
    if (!statusUpdateIdea) return;
    try {
      await ideaService.updateIdea(statusUpdateIdea.ideaId, {
        status: statusUpdateIdea.status as any,
        readByParent: false
      });
      
      if (statusUpdateIdea.status === 'implemented') {
        const ideaObj = ideas.find(i => i.id === statusUpdateIdea.ideaId);
        if (ideaObj && ideaObj.userId) {
          await notificationService.sendNotification({
            userId: ideaObj.userId,
            title: 'رسالة شكر وتقدير 🌟',
            message: `لقد تم تنفيذ مقترحك: "${ideaObj.title || 'مقترحك'}". شكراً لمساهمتك القيمة في التطوير!`,
            type: 'system'
          });
        }
      }

      logActivity({
        action: 'تحديث حالة مقترح',
        details: `تم تغيير حالة المقترح إلى ${statusUpdateIdea.status}`,
        targetType: 'idea_bank'
      });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setStatusUpdateIdea(null);
    }
  };

  const handleSendReply = async () => {
    if (!replyIdea || !replyMessage.trim()) return;
    try {
      await ideaService.updateIdea(replyIdea.id, {
        adminReply: replyMessage,
        status: replyIdea.status === 'pending' ? 'under_review' : replyIdea.status,
        readByParent: false
      });
      
      logActivity({
        action: 'الرد على مقترح',
        details: `تم الرد على المقترح: ${replyIdea.title}`,
        targetType: 'idea_bank'
      });
      
      setReplyIdea(null);
      setReplyMessage('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'rejected': return <XCircle className="text-rose-400" size={18} />;
      case 'under_review': return <BrainCircuit className="text-amber-400" size={18} />;
      default: return <Clock className="text-white/40" size={18} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'implemented': return 'تم التنفيذ';
      case 'rejected': return 'مرفوض';
      case 'under_review': return 'قيد الدراسة';
      default: return 'قيد الانتظار';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'academic': return 'أكاديمي وتعليمي';
      case 'behavior': return 'القيم والسلوك';
      case 'administrative': return 'إداري وتنظيمي';
      default: return 'أخرى';
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.includes(searchQuery) || idea.description.includes(searchQuery) || idea.senderName.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || idea.status === filterStatus;
    const matchesGrade = filterGrade === 'all' || idea.targetGrade === filterGrade;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  if (loading) {
    return (
      <div className="p-6">
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans" style={{ direction: 'rtl' }}>
      
      <ConfirmDialog 
        isOpen={!!statusUpdateIdea}
        onClose={() => setStatusUpdateIdea(null)}
        onConfirm={handleUpdateStatus}
        title="تأكيد تغيير الحالة"
        message={`هل أنت متأكد من تغيير حالة هذا المقترح إلى ${getStatusText(statusUpdateIdea?.status || '')}؟`}
      />

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />

      <div className="bg-[#050A18] relative overflow-hidden flex flex-col md:flex-row items-center gap-6 px-6 py-8 rounded-3xl border border-white/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 flex items-center justify-center border border-yellow-500/20 shrink-0 z-10">
          <Lightbulb className="text-yellow-400" size={32} />
        </div>
        <div className="z-10 flex-1 text-center md:text-right">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">بنك الأفكار ومجلس الآباء</h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
            إدارة وتقييم مقترحات التطوير، وطرح مقترحات عامة لتصويت أولياء الأمور لمعرفة نبض الأغلبية.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/10 mx-auto md:mx-0">
        <button
          onClick={() => {
            setActiveTab('ideas');
            markIdeasRead();
          }}
          className={`px-6 sm:px-8 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm h-[44px] flex items-center justify-center gap-2.5 leading-tight text-center relative ${
            activeTab === 'ideas' 
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-lg shadow-yellow-500/10' 
              : 'text-white/50 hover:text-white border border-transparent'
          }`}
        >
          <span>بنك الأفكار (مقترحات الآباء)</span>
          {unreadIdeasCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center animate-pulse shrink-0 shadow-lg shadow-rose-500/50">
              {unreadIdeasCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('council');
            markCouncilRead();
          }}
          className={`px-6 sm:px-8 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm h-[44px] flex items-center justify-center text-center leading-tight gap-2.5 relative ${
            activeTab === 'council' 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-lg shadow-purple-500/10' 
              : 'text-white/50 hover:text-white border border-transparent'
          }`}
        >
          <Users size={16} className="shrink-0" />
          <span>مجلس الآباء (تصويت عام)</span>
          {unreadCouncilCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white font-black text-[11px] flex items-center justify-center animate-pulse shrink-0 shadow-lg shadow-rose-500/50">
              {unreadCouncilCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ideas' ? (
          <motion.div
            key="ideas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input
                  type="text"
                  placeholder="بحث في المقترحات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-all font-bold text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                <div className="flex gap-2">
                  <Filter className="text-white/40 ml-2 shrink-0 hidden sm:block" size={18} />
                  {['all', 'pending', 'under_review', 'implemented', 'rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        filterStatus === status 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-lg shadow-yellow-500/10' 
                          : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {status === 'all' ? 'جميع المقترحات' : getStatusText(status)}
                    </button>
                  ))}
                </div>
                <select
                  value={filterGrade}
                  onChange={(e) => setFilterGrade(e.target.value)}
                  className="bg-white/5 border border-white/10 text-white/70 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none appearance-none cursor-pointer shrink-0"
                >
                  <option value="all">جميع الصفوف</option>
                  {['1','2','3','4','5','6','7','8','9','10_sci','10_lit','11_sci','11_lit','12_sci','12_lit'].map(g => (
                    <option key={g} value={g}>{getGradeLabel(g)}</option>
                  ))}
                </select>
                {ideas.length > 0 && (
                   <button
                     onClick={handleDeleteAllIdeas}
                     className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20 shrink-0"
                     title="حذف جميع المقترحات"
                   >
                     حذف الكل
                   </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIdeas.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 border border-white/10 rounded-3xl">
                  <Lightbulb size={48} className="mx-auto text-white/10 mb-4" />
                  <p className="text-xl font-bold text-white/40">لا توجد مقترحات تطابق بحثك</p>
                </div>
              ) : (
                filteredIdeas.map((idea) => (
                  <div key={idea.id} className="bg-[#0a0f25] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all group">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h4 className="font-bold text-white text-lg flex items-center gap-2">
                            {idea.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-white/40 text-[10px] font-bold">بواسطة: {formatParentSender(idea.senderName)}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <span className="text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-400/10">
                              {getCategoryLabel(idea.category)}
                            </span>
                            {idea.targetGrade && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <span className="text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-400/10">
                                  الصف: {getGradeLabel(idea.targetGrade)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 items-center shrink-0">
                          <button
                            onClick={() => handleDeleteIdea(idea.id)}
                            className="p-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                            title="حذف المقترح"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border ${
                            idea.status === 'implemented' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            idea.status === 'under_review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            idea.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-white/5 text-white/50 border-white/10'
                          }`}>
                            {getStatusIcon(idea.status)}
                            {getStatusText(idea.status)}
                          </div>
                        </div>
                      </div>

                      <p className="text-white/70 text-sm leading-relaxed mb-6 font-medium bg-white/[0.02] p-4 rounded-xl border border-white/5 line-clamp-4">
                        {idea.description}
                      </p>

                      {idea.adminReply && (
                        <div className="bg-[#050A18] rounded-xl p-4 border border-cyan-500/20 border-r-4 border-r-cyan-500 mb-6 flex items-start gap-3 shadow-inner">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                            <MessageSquare className="text-cyan-400" size={14} />
                          </div>
                          <div>
                            <span className="text-cyan-400 text-[10px] font-black block mb-1">الرد السابق:</span>
                            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{idea.adminReply}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">تغيير الحالة:</span>
                        <select
                          className="bg-white/5 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none appearance-none pr-8 cursor-pointer shadow-sm hover:bg-white/10 transition-colors"
                          value={idea.status}
                          onChange={(e) => setStatusUpdateIdea({ ideaId: idea.id, status: e.target.value })}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="under_review">قيد الدراسة</option>
                          <option value="implemented">تم التنفيذ</option>
                          <option value="rejected">مرفوض</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setReplyIdea(idea);
                          setReplyMessage(idea.adminReply || '');
                        }}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all"
                      >
                        <MessageSquare size={14} />
                        {idea.adminReply ? 'تعديل الرد' : 'إضافة رد'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="council"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
               <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Users className="text-purple-400" size={20} />
                    إدارة مجلس الآباء
                  </h3>
                  <p className="text-white/60 text-xs mt-1">يمكنك طرح مقترحات عامة ليُصوت عليها أولياء الأمور.</p>
               </div>
               <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                 {polls.length > 0 && (
                   <button
                     onClick={handleDeleteAllPolls}
                     className="px-3 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                     title="حذف جميع التصويتات"
                   >
                     حذف الكل
                   </button>
                 )}
                 <button
                    onClick={() => setShowPollForm(!showPollForm)}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors shadow-lg shadow-purple-500/20"
                 >
                    {showPollForm ? 'إلغاء' : 'طرح مقترح للتصويت'}
                 </button>
               </div>
            </div>

            <AnimatePresence>
              {showPollForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreatePoll} 
                  className="bg-black/30 border border-purple-500/20 rounded-xl p-5 mb-6 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-2">عنوان المقترح</label>
                      <input
                        value={pollTitle}
                        onChange={(e) => setPollTitle(e.target.value)}
                        placeholder="اكتب عنواناً يختصر المقترح (لأولياء الأمور)..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 text-sm font-bold placeholder:font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-2">الفئة المستهدفة (الصف)</label>
                      <select
                        value={pollTargetGrade}
                        onChange={(e) => setPollTargetGrade(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 text-sm font-bold appearance-none cursor-pointer"
                      >
                        <option value="all">عام (جميع الصفوف)</option>
                        {['1','2','3','4','5','6','7','8','9','10_sci','10_lit','11_sci','11_lit','12_sci','12_lit'].map(g => (
                          <option key={g} value={g}>{getGradeLabel(g)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-2">تفاصيل المقترح وخلفيته</label>
                    <textarea
                      required
                      value={pollDesc}
                      onChange={(e) => setPollDesc(e.target.value)}
                      placeholder="اشرح الهدف من مقترحك ليتمكن مجلس الآباء من التصويت عليه بوضوح..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 min-h-[120px] resize-y text-sm leading-relaxed"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPoll || !pollDesc.trim()}
                      className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                    >
                      مشاركة المقترح للآباء
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="grid gap-4">
              {polls.length === 0 ? (
                <div className="text-center py-12 border border-white/10 rounded-2xl bg-white/5">
                  <Users size={40} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/40">لا توجد مقترحات مطروحة حالياً في المجلس.</p>
                </div>
              ) : (
                polls.map(poll => {
                  const totalSupports = Object.values(poll.votes || {}).filter(v => v === 'support').length;
                  const totalRejects = Object.values(poll.votes || {}).filter(v => v === 'reject').length;
                  const totalVotes = totalSupports + totalRejects;
                  const supportPct = totalVotes > 0 ? Math.round((totalSupports / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={poll.id} className={`bg-black/40 border border-white/10 hover:border-white/20 transition-all rounded-2xl p-5 relative overflow-hidden group`}>
                       {poll.type === 'admin' && (
                         <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-bl-xl border-l border-b border-amber-500/20">
                           إداري
                         </div>
                       )}
                       <div className="mb-4">
                         <div className="flex items-start justify-between gap-4">
                            <h4 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                              {poll.title}
                            </h4>
                            <button
                              onClick={() => handleDeletePoll(poll.id)}
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                              title="حذف التصويت"
                            >
                              <Trash2 size={14} />
                            </button>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] text-white/40 mb-3">
                           <span>{formatParentSender(poll.authorName)}</span>
                           <span>•</span>
                           <span>{poll.timestamp ? new Date(poll.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن'}</span>
                           {poll.targetGrade && (
                             <>
                               <span>•</span>
                               <span className="text-purple-400 font-bold">الصف: {getGradeLabel(poll.targetGrade)}</span>
                             </>
                           )}
                         </div>
                         <p className="text-white/70 text-sm leading-relaxed">{poll.description}</p>
                         
                         {poll.adminReply && (
                            <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border ${poll.status === 'implemented' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-rose-500/10 border-rose-500/30 text-rose-100'}`}>
                              <strong className="block mb-1">{poll.status === 'implemented' ? 'رد الإدارة (تم التنفيذ):' : 'رد الإدارة (مرفوض):'}</strong>
                              {poll.adminReply}
                            </div>
                         )}
                       </div>

                       <div className="mt-6 pt-4 border-t border-white/10">
                          <div className="flex items-center justify-between mb-3 text-xs font-bold text-white/60">
                             <span>نتائج التصويت (إجمالي: {totalVotes})</span>
                             <span className={supportPct >= 50 ? 'text-emerald-400' : 'text-rose-400'}>{supportPct}% مؤيد</span>
                          </div>
                          <div className="h-2 w-full bg-rose-500/20 rounded-full overflow-hidden flex relative mb-4">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${supportPct}%` }} />
                          </div>

                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <button
                                   onClick={() => handleTogglePollStatus(poll.id, poll.status)}
                                   className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border ${
                                     (poll.status === 'active' || poll.status === 'closed') 
                                       ? poll.status === 'active'
                                         ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20' 
                                         : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                                       : 'bg-white/5 text-white/40 border-white/10 opacity-50 cursor-not-allowed'
                                   }`}
                                   disabled={poll.status === 'implemented' || poll.status === 'rejected'}
                                >
                                   {(poll.status === 'active' || poll.status === 'closed') ? (
                                     <>
                                       {poll.status === 'active' ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                                       {poll.status === 'active' ? 'إغلاق التصويت' : 'إعادة فتح التصويت'}
                                     </>
                                   ) : (
                                     <span>تم القرار ({poll.status === 'implemented' ? 'منفذ' : 'مرفوض'})</span>
                                   )}
                                </button>
                                
                                {(poll.status === 'active' || poll.status === 'closed') && (
                                  <button
                                     onClick={() => setResolvingPoll(poll)}
                                     className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                                  >
                                     إصدار قرار نهائي
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                                  <ThumbsUp size={16} /> {totalSupports}
                                </div>
                                <div className="flex items-center gap-2 text-rose-400 text-sm font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg">
                                  <ThumbsDown size={16} /> {totalRejects}
                                </div>
                              </div>
                            </div>
                            
                            {/* Comments Section */}
                            {poll.comments && poll.comments.length > 0 && (
                              <div className="mt-2 pt-4 border-t border-white/5 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                <h5 className="text-white/40 text-xs font-bold mb-2 flex items-center gap-2">
                                  <MessageSquare size={12} />
                                  تعليقات الآباء ({poll.comments.length})
                                </h5>
                                {poll.comments.map(c => (
                                  <div key={c.id} className="bg-white/5 rounded-lg p-2.5 text-xs">
                                    <span className="font-bold text-white/60 mb-1 block">{formatParentSender(c.authorName)}</span>
                                    <p className="text-white/80">{c.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resolvingPoll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">إنهاء تصويت وإصدار قرار</h3>
              <p className="text-white/60 text-sm mb-6">قرر ما إذا كنت ستنفذ المقترح ({resolvingPoll.title}) أو ترفضه مع توضيح السبب للآباء.</p>

              <div className="flex gap-2 mb-4">
                <button
                   onClick={() => setPollResolveStatus('implemented')}
                   className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${pollResolveStatus === 'implemented' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-white/5 text-white/50 border-white/10 hover:bg-emerald-500/10'}`}
                >
                  تنفيذ المقترح
                </button>
                <button
                   onClick={() => setPollResolveStatus('rejected')}
                   className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${pollResolveStatus === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-white/5 text-white/50 border-white/10 hover:bg-rose-500/10'}`}
                >
                  رفض المقترح
                </button>
              </div>

              <textarea
                value={pollAdminReply}
                onChange={(e) => setPollAdminReply(e.target.value)}
                placeholder="أضف تعليق الإدارة (السبب للآباء)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 mb-6 h-32 resize-none text-sm leading-relaxed"
              ></textarea>

              <div className="flex gap-3 justify-end border-t border-white/10 pt-6">
                <button
                  onClick={() => setResolvingPoll(null)}
                  className="px-6 py-2 rounded-xl text-white/50 hover:bg-white/5 font-bold transition-all text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleResolvePoll}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 px-8 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 text-sm"
                >
                  <Send size={18} />
                  تأكيد القرار
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Modal strictly separated but still accessible */}
      <AnimatePresence>
        {replyIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#0c1329] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setReplyIdea(null)}
                className="absolute top-4 left-4 p-2 text-white/40 hover:text-white bg-white/5 rounded-xl transition-colors"
              >
                <XCircle size={20} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6">الرد على المقترح</h3>
              
              <div className="bg-white/5 p-4 rounded-xl mb-6 border border-white/5">
                <span className="text-yellow-400 text-xs font-bold px-2 py-0.5 rounded bg-yellow-400/10 mb-2 inline-block shadow-sm">
                  {getCategoryLabel(replyIdea.category)}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h4 className="text-white font-bold text-lg">{replyIdea.title}</h4>
                  <span className="text-white/40 text-xs font-bold">بواسطة: {formatParentSender(replyIdea.senderName)}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{replyIdea.description}</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-white/70">الرد الإداري</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition-all min-h-[120px] resize-none text-sm"
                />
                
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setReplyIdea(null)}
                    className="px-6 py-2.5 rounded-xl font-bold bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim()}
                    className="px-6 py-2.5 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                  >
                    <Send size={16} />
                    إرسال الرد
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
