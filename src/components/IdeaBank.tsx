import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, Send, MessageSquare, Clock, CheckCircle, XCircle, FileText, Heart, BrainCircuit, Users, ThumbsUp, ThumbsDown, User, Trash2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { ConfirmDialog } from './ConfirmDialog';
import { ideaService, IdeaSubmit, CouncilPoll } from '../services/ideaService';
import { notificationService } from '../services/notificationService';

export interface IdeaBankProps {
  userId?: string;
  userName?: string;
  studentGrade?: string;
  schoolId?: string | null;
}

export const IdeaBank: React.FC<IdeaBankProps> = ({ userId, userName, studentGrade, schoolId }) => {
  const [ideas, setIdeas] = useState<IdeaSubmit[]>([]);
  const [polls, setPolls] = useState<CouncilPoll[]>([]);
  const [activeTab, setActiveTab] = useState<'submit' | 'my_ideas' | 'council'>('submit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'academic' | 'behavior' | 'administrative' | 'other'>('academic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [showPollForm, setShowPollForm] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

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

  const effectiveUserId = userId || auth.currentUser?.uid || 'guest_user';
  const effectiveUserName = userName || auth.currentUser?.displayName || 'طالب/ولي أمر';

  const getParentSenderName = (name: string) => {
    const clean = (name || '').trim();
    if (!clean || clean === 'طالب/ولي أمر' || clean === 'طالب') return 'ولي أمر';
    if (clean.startsWith('ولي أمر') || clean.startsWith('ولي امر')) return clean;
    return `ولي أمر ${clean}`;
  };

  const loadData = async () => {
    try {
      const [ideasData, pollsData] = await Promise.all([
        ideaService.fetchIdeas(schoolId || undefined, effectiveUserId),
        ideaService.fetchPolls(schoolId || undefined)
      ]);
      setIdeas(ideasData);
      setPolls(pollsData);
    } catch (err) {
      console.warn("IdeaBank fetch error:", err);
    }
  };

  useEffect(() => {
    if (!effectiveUserId) return;
    loadData();
  }, [effectiveUserId, schoolId]);

  const attemptedReadIds = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === 'my_ideas' && ideas.some(i => i.readByParent === false)) {
      const unreadIdeas = ideas.filter(i => i.readByParent === false && !attemptedReadIds.current.has(i.id));
      unreadIdeas.forEach(idea => {
        attemptedReadIds.current.add(idea.id);
        ideaService.updateIdea(idea.id, { readByParent: true }).catch(err => {
          console.warn("Error marking idea as read", err);
        });
      });
    }
  }, [activeTab, ideas]);

  const handleVote = async (pollId: string, voteType: 'support' | 'reject') => {
    if (!effectiveUserId) return;
    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      const newVotes = { ...(poll.votes || {}) };
      if (newVotes[effectiveUserId] === voteType) {
        delete newVotes[effectiveUserId];
      } else {
        newVotes[effectiveUserId] = voteType;
      }

      await ideaService.updatePoll(pollId, {
        votes: newVotes
      });
      loadData();

      // Notify the poll author if it's not the same user
      if (poll.authorId && poll.authorId !== 'admin' && poll.authorId !== effectiveUserId && newVotes[effectiveUserId]) {
        await notificationService.sendNotification({
          userId: poll.authorId,
          title: voteType === 'support' ? 'تأييد جديد لمقترحك 👍' : 'اعتراض جديد على مقترحك',
          message: `تم التصويت على مقترحك "${poll.title}" في مجلس الآباء.`,
          type: 'general'
        });
      }
    } catch (err) {
      console.error("Voting error", err);
    }
  };

  const handleCommentSubmit = async (pollId: string) => {
    const text = commentTexts[pollId];
    if (!text || !text.trim() || !effectiveUserId) return;

    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) return;

      const newComment = {
        id: Date.now().toString(),
        authorName: effectiveUserName,
        text: text.trim(),
        timestamp: Date.now()
      };

      const newComments = [...(poll.comments || []), newComment];

      await ideaService.updatePoll(pollId, {
        comments: newComments
      });

      setCommentTexts(prev => ({ ...prev, [pollId]: '' }));
      loadData();

      // Notify the poll author
      if (poll.authorId && poll.authorId !== 'admin' && poll.authorId !== effectiveUserId) {
        await notificationService.sendNotification({
          userId: poll.authorId,
          title: 'تعليق جديد على مقترحك 💬',
          message: `قام ${effectiveUserName} بالتعليق على مقترحك: "${text.trim().substring(0, 30)}..."`,
          type: 'general'
        });
      }
    } catch (err) {
      console.error("Commenting error", err);
    }
  };

  const handleSubmitPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollDesc.trim() || !effectiveUserId) return;

    setIsSubmittingPoll(true);
    try {
      await ideaService.createPoll({
        schoolId: schoolId || undefined,
        authorId: effectiveUserId,
        authorName: getParentSenderName(effectiveUserName),
        title: pollTitle.trim() || 'مقترح عام',
        description: pollDesc,
        type: 'parent',
        status: 'active',
        votes: {},
        comments: [],
        targetGrade: studentGrade || 'all'
      });
      setPollTitle('');
      setPollDesc('');
      setShowPollForm(false);
      setShowSuccess(true);
      loadData();
      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab('council');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  const handleDeleteMyIdea = (ideaId: string) => {
    openConfirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المقترح؟', async () => {
      try {
        await ideaService.deleteIdea(ideaId);
        loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteAllMyIdeas = () => {
    openConfirm('تأكيد حذف الكل', 'هل أنت متأكد من حذف جميع مقترحاتك؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      try {
        const myIdeas = ideas.filter(idea => idea.userId === effectiveUserId);
        await Promise.all(myIdeas.map(idea => ideaService.deleteIdea(idea.id)));
        loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteMyPoll = (pollId: string) => {
    openConfirm('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المقترح؟', async () => {
      try {
        await ideaService.deletePoll(pollId);
        loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteAllMyPolls = () => {
    const myPolls = polls.filter(p => !p.targetGrade || p.targetGrade === 'all' || p.targetGrade === studentGrade).filter(p => p.authorId === effectiveUserId);
    if (myPolls.length === 0) return;
    openConfirm('تأكيد حذف الكل', 'هل أنت متأكد من حذف جميع مقترحاتك في المجلس؟ لا يمكن التراجع عن هذا الإجراء.', async () => {
      try {
        await Promise.all(myPolls.map(poll => ideaService.deletePoll(poll.id)));
        loadData();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const getGradeLabel = (gradeValue: string) => {
    const gradesMap: Record<string, string> = {
      'all': 'عام',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !effectiveUserId) return;

    setIsSubmitting(true);
    try {
      await ideaService.createIdea({
        schoolId: schoolId || undefined,
        userId: effectiveUserId,
        senderName: getParentSenderName(effectiveUserName),
        title: title.trim() || 'مقترح جديد',
        description,
        category,
        status: 'pending',
        readByParent: true,
        targetGrade: studentGrade || 'all'
      });
      setTitle('');
      setDescription('');
      setCategory('academic');
      setShowSuccess(true);
      loadData();
      setTimeout(() => {
        setShowSuccess(false);
        setActiveTab('my_ideas');
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return <CheckCircle className="text-emerald-400" size={18} />;
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans" style={{ direction: 'rtl' }}>
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
      {/* Header Banner */}
      <div className="bg-[#050A18] relative overflow-hidden flex flex-col md:flex-row items-center gap-6 px-6 py-10 rounded-none sm:rounded-3xl border-y sm:border-x border-white/5 sm:mx-4 md:mx-6 sm:mt-4">
        <div className="absolute top-0 left-0 w-48 h-48 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 flex items-center justify-center border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)] shrink-0 z-10">
          <Lightbulb className="text-yellow-400" size={32} />
        </div>
        <div className="z-10 flex-1 text-center md:text-right">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">مائدة الأفكار والمقترحات</h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed max-w-2xl">
            نؤمن بأن التطوير يبدأ منكم. شاركونا أفكاركم، مقترحاتكم، وملاحظاتكم التطويرية لنصنع معاً بيئة تعليمية استثنائية.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-xl w-fit border border-white/10 mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab('submit')}
          className={`px-4 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-sm h-[44px] ${activeTab === 'submit' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'text-white/40 hover:text-white border border-transparent'}`}
        >
          تقديم فكرة
        </button>
        <button
          onClick={() => setActiveTab('my_ideas')}
          className={`px-4 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-sm h-[44px] ${activeTab === 'my_ideas' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'text-white/40 hover:text-white border border-transparent'}`}
        >
          أفكاري السابقة
        </button>
        <button
          onClick={() => setActiveTab('council')}
          className={`px-4 sm:px-8 py-2.5 rounded-lg font-bold transition-all text-sm h-[44px] flex items-center gap-2 ${activeTab === 'council' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-lg shadow-purple-500/10' : 'text-white/40 hover:text-white border border-transparent'}`}
        >
          <Users size={16} />
          مجلس الآباء الرقمي
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'submit' ? (
          <motion.div
            key="submit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <form onSubmit={handleSubmit} className="bg-black/40 border-y sm:border sm:rounded-3xl border-white/10 p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl sm:mx-4 md:mx-6">
              {showSuccess && (
                <div className="absolute inset-0 bg-emerald-900/90 z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
                  <CheckCircle className="text-emerald-400 mb-4" size={64} />
                  <h3 className="text-2xl font-black text-white">تم إرسال فكرتك بنجاح!</h3>
                  <p className="text-emerald-200 mt-2">شكراً لمساهمتك في تطوير منصتنا.</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-white/70 mb-2">عنوان الفكرة أو المقترح (اختياري)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="اكتب عنواناً يختصر فكرتك..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all font-bold placeholder:font-normal placeholder:text-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/70 mb-2">نوع المقترح</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'academic', label: 'أكاديمي وتعليمي', icon: FileText },
                    { id: 'behavior', label: 'القيم والسلوك', icon: Heart },
                    { id: 'administrative', label: 'إداري وتنظيمي', icon: BrainCircuit },
                    { id: 'other', label: 'أخرى', icon: Lightbulb }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 h-[100px] rounded-xl border transition-all w-full box-border ${
                        category === cat.id 
                          ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400 font-bold' 
                          : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white font-bold'
                      }`}
                    >
                      <cat.icon size={20} className="shrink-0" />
                      <span className="text-xs text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/70 mb-2">تفاصيل الفكرة</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اشرح فكرتك بالتفصيل وكيف يمكن أن تساهم في تطوير الأكاديمية..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/10 transition-all min-h-[150px] resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-8 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                  <Send size={18} />
                  إرسال المقترح
                </button>
              </div>
            </form>
          </motion.div>
        ) : activeTab === 'my_ideas' ? (
          <motion.div
            key="my_ideas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 px-4 sm:px-6"
          >
            {ideas.length > 0 && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleDeleteAllMyIdeas}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                >
                  حذف جميع مقترحاتي
                </button>
              </div>
            )}
            {(ideas.length === 0 && polls.filter(p => p.authorId === effectiveUserId).length === 0) ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center">
                <Lightbulb size={48} className="text-white/10 mb-4" />
                <h3 className="text-xl font-bold text-white/60 mb-2">لم تقم بتقديم أي أفكار بعد</h3>
                <p className="text-white/40 text-sm">بادر الآن بمشاركتنا أول مقترح للتطوير!</p>
                <button 
                  onClick={() => setActiveTab('submit')}
                  className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-bold text-sm"
                >
                  تقديم فكرة
                </button>
              </div>
            ) : (
              <>
                {ideas.map((idea) => (
                  <div key={idea.id} className="bg-black/30 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all group">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-white text-lg">{idea.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold">
                            {idea.category === 'academic' ? 'أكاديمي' : idea.category === 'behavior' ? 'القيم والسلوك' : idea.category === 'administrative' ? 'إداري' : 'أخرى'}
                          </span>
                        </div>
                        <p className="text-white/40 text-xs text-right" dir="ltr">
                          {idea.timestamp ? new Date(idea.timestamp).toLocaleString('ar-EG') : 'جارِ الإرسال...'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeleteMyIdea(idea.id)}
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
                    
                    <p className="text-white/70 text-sm leading-relaxed mb-4">
                      {idea.description}
                    </p>

                    {idea.adminReply && (
                      <div className="bg-[#050A18] rounded-xl p-4 border border-cyan-500/20 border-r-4 border-r-cyan-500 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="text-cyan-400" size={14} />
                        </div>
                        <div>
                          <span className="text-cyan-400 text-xs font-bold block mb-1">رد الإدارة:</span>
                          <p className="text-white/80 text-sm leading-relaxed">{idea.adminReply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {polls.filter(p => p.authorId === effectiveUserId).map((poll) => (
                  <div key={poll.id} className="bg-[#1A0B2E]/40 border border-purple-500/20 rounded-2xl p-5 hover:border-purple-500/40 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none" />
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-white text-lg">{poll.title}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center gap-1">
                            <Users size={10} />
                            مجلس الآباء
                          </span>
                        </div>
                        <p className="text-white/40 text-xs text-right" dir="ltr">
                          {poll.timestamp ? new Date(poll.timestamp).toLocaleString('ar-EG') : 'جارِ الإرسال...'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeleteMyPoll(poll.id)}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                          title="حذف التصويت"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border ${
                          poll.status === 'implemented' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          poll.status === 'closed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {poll.status === 'implemented' ? <CheckCircle size={14} /> : poll.status === 'closed' ? <XCircle size={14} /> : <Users size={14} />}
                          {poll.status === 'implemented' ? 'تم التنفيذ' : poll.status === 'closed' ? 'مغلق' : 'قيد التصويت'}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-white/70 text-sm leading-relaxed mb-4 relative z-10">
                      {poll.description}
                    </p>

                    <div className="flex items-center gap-6 pt-3 border-t border-white/5 relative z-10">
                       <div className="flex items-center gap-2 text-white/50 text-sm bg-white/5 px-3 py-1.5 rounded-lg">
                         <ThumbsUp size={14} className="text-emerald-400" />
                         <span>{Object.values(poll.votes || {}).filter(v => v === 'support').length} مؤيد</span>
                       </div>
                       <div className="flex items-center gap-2 text-white/50 text-sm bg-white/5 px-3 py-1.5 rounded-lg">
                         <ThumbsDown size={14} className="text-rose-400" />
                         <span>{Object.values(poll.votes || {}).filter(v => v === 'reject').length} معارض</span>
                       </div>
                       <div className="flex items-center gap-2 text-white/50 text-sm bg-white/5 px-3 py-1.5 rounded-lg">
                         <MessageSquare size={14} className="text-blue-400" />
                         <span>{(poll.comments || []).length} تعليق</span>
                       </div>
                    </div>

                    {poll.adminReply && (
                      <div className="bg-[#050A18] rounded-xl p-4 border border-cyan-500/20 border-r-4 border-r-cyan-500 flex items-start gap-3 mt-4 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="text-cyan-400" size={14} />
                        </div>
                        <div>
                          <span className="text-cyan-400 text-xs font-bold block mb-1">رد الإدارة:</span>
                          <p className="text-white/80 text-sm leading-relaxed">{poll.adminReply}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="council"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 px-4 sm:px-6"
          >
            <div className="flex justify-between items-center bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
               <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Users className="text-purple-400" size={20} />
                    مجلس الآباء الرقمي
                  </h3>
                  <p className="text-white/60 text-xs mt-1">صوت على المقترحات العامة أو اطرح أفكارك للمناقشة.</p>
               </div>
               <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                 {polls.filter(p => !p.targetGrade || p.targetGrade === 'all' || p.targetGrade === studentGrade).filter(p => p.authorId === effectiveUserId).length > 0 && (
                   <button
                     onClick={handleDeleteAllMyPolls}
                     className="px-3 py-2 rounded-lg text-xs font-bold transition-all border border-red-500/20 text-red-500 bg-red-500/10 hover:bg-red-500/20"
                     title="حذف جميع مقترحاتي في المجلس"
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
                  onSubmit={handleSubmitPoll} 
                  className="bg-black/30 border border-purple-500/20 rounded-xl p-5 mb-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-2">عنوان المقترح</label>
                    <input
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="اكتب عنوان المقترح..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-2">تفاصيل المقترح للآباء</label>
                    <textarea
                      required
                      value={pollDesc}
                      onChange={(e) => setPollDesc(e.target.value)}
                      placeholder="اشرح الهدف من مقترحك ليتمكن مجلس الآباء من التصويت عليه بوضوح..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500/50 min-h-[100px] resize-y text-sm"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingPoll || !pollDesc.trim()}
                      className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      نشر للتصويت
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {polls.filter(p => !p.targetGrade || p.targetGrade === 'all' || p.targetGrade === studentGrade).length === 0 ? (
               <div className="text-center py-12 border border-white/10 rounded-2xl bg-white/5">
                 <Users size={40} className="mx-auto text-white/10 mb-3" />
                 <p className="text-white/40">لا توجد مقترحات مطروحة حالياً.</p>
               </div>
            ) : (
               <div className="grid gap-4">
                 {polls.filter(p => !p.targetGrade || p.targetGrade === 'all' || p.targetGrade === studentGrade).map(poll => {
                    const totalSupports = Object.values(poll.votes || {}).filter(v => v === 'support').length;
                    const totalRejects = Object.values(poll.votes || {}).filter(v => v === 'reject').length;
                    const totalVotes = totalSupports + totalRejects;
                    const supportPct = totalVotes > 0 ? (totalSupports / totalVotes) * 100 : 0;
                    
                    const myVote = poll.votes?.[effectiveUserId];

                    return (
                      <div key={poll.id} className={`bg-gradient-to-br from-[#0c1329] to-[#050a18] border ${poll.type === 'admin' ? 'border-amber-500/30' : 'border-white/10'} rounded-2xl p-5 relative overflow-hidden`}>
                         {poll.type === 'admin' && (
                           <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-bl-xl border-l border-b border-amber-500/20">
                             مقترح إداري
                           </div>
                         )}
                         <div className="mb-4 mt-2">
                           <div className="flex items-start justify-between gap-4">
                              <h4 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                                {poll.title}
                              </h4>
                              {poll.authorId === effectiveUserId && (
                                <button
                                  onClick={() => handleDeleteMyPoll(poll.id)}
                                  className="p-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all shrink-0"
                                  title="حذف المقترح"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                           </div>
                           <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/40 mb-3">
                             <span className="flex items-center gap-1"><User size={12}/> {poll.type === 'admin' ? 'الإدارة المدرسية' : poll.authorName}</span>
                             <span>•</span>
                             <span>{poll.timestamp ? new Date(poll.timestamp).toLocaleString('ar-EG', { dateStyle: 'short' }) : 'الآن'}</span>
                             {poll.targetGrade && (
                               <>
                                 <span>•</span>
                                 <span className="text-purple-400 font-bold px-1.5 py-0.5 rounded bg-purple-400/10">الصف: {getGradeLabel(poll.targetGrade)}</span>
                               </>
                             )}
                           </div>
                           <p className="text-white/70 text-sm leading-relaxed">{poll.description}</p>
                         </div>
                         
                         {poll.adminReply && (
                            <div className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border ${poll.status === 'implemented' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-rose-500/10 border-rose-500/30 text-rose-100'}`}>
                              <strong className="block mb-1">{poll.status === 'implemented' ? 'رد الإدارة (تم التنفيذ):' : 'رد الإدارة (مرفوض):'}</strong>
                              {poll.adminReply}
                            </div>
                         )}

                         {/* Voting Section */}
                         <div className="mt-6 pt-4 border-t border-white/10">
                            {poll.status === 'closed' || poll.status === 'implemented' || poll.status === 'rejected' ? (
                               <div className="text-center text-white/40 text-xs font-bold bg-white/5 p-2 rounded-lg">التصويت مغلق على هذا المقترح</div>
                            ) : (
                               <div className="flex items-center justify-between gap-4">
                                  <div className="flex gap-2 flex-col sm:flex-row flex-1">
                                    <button 
                                      onClick={() => handleVote(poll.id, 'support')}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${myVote === 'support' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold' : 'bg-white/5 text-white/50 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-300'}`}
                                    >
                                      <ThumbsUp size={16} className={myVote === 'support' ? 'fill-emerald-400' : ''} />
                                      <span className="text-sm">مؤيد ({totalSupports})</span>
                                    </button>
                                    <button 
                                      onClick={() => handleVote(poll.id, 'reject')}
                                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${myVote === 'reject' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold' : 'bg-white/5 text-white/50 border-white/10 hover:bg-rose-500/10 hover:text-rose-300'}`}
                                    >
                                      <ThumbsDown size={16} className={myVote === 'reject' ? 'fill-rose-400' : ''} />
                                      <span className="text-sm">غير مؤيد ({totalRejects})</span>
                                    </button>
                                  </div>
                               </div>
                            )}

                            {/* Progress bar */}
                            {totalVotes > 0 && (
                              <div className="mt-4 shrink-0">
                                <div className="h-1.5 w-full bg-rose-500/20 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-emerald-500" style={{ width: `${supportPct}%` }} />
                                </div>
                              </div>
                            )}
                            
                            {/* Comments Section */}
                            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                               {poll.comments && poll.comments.length > 0 && (
                                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                   {poll.comments.map(c => (
                                     <div key={c.id} className="bg-white/5 rounded-lg p-2.5 text-xs">
                                       <span className="font-bold text-white/60 mb-1 block">{c.authorName}</span>
                                       <p className="text-white/80">{c.text}</p>
                                     </div>
                                   ))}
                                 </div>
                               )}
                               <div className="flex gap-2">
                                 <input
                                   type="text"
                                   placeholder="أضف تعليقاً..."
                                   value={commentTexts[poll.id] || ''}
                                   onChange={(e) => setCommentTexts(prev => ({ ...prev, [poll.id]: e.target.value }))}
                                   className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                       e.preventDefault();
                                       handleCommentSubmit(poll.id);
                                     }
                                   }}
                                 />
                                 <button
                                   onClick={() => handleCommentSubmit(poll.id)}
                                   disabled={!commentTexts[poll.id]?.trim()}
                                   className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                                 >
                                   <Send size={14} />
                                 </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    );
                 })}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
