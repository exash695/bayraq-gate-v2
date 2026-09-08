import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, where } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { ClipboardCheck, Search, CheckCircle, XCircle, Trophy, User, Calendar, MessageSquare, Send, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TeacherActivities({ 
  schoolId, 
  teacherData,
  selectedClass
}: { 
  schoolId: string; 
  teacherData: any;
  selectedClass?: string;
}) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'homework' | 'competition'>('homework');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteTaskConfirmId, setDeleteTaskConfirmId] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState<'homework' | 'competition' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    if (!id || !schoolId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "schools", schoolId, "activities_submissions", id));
    } catch(e) {
      console.error(e);
    }
    setIsDeleting(false);
    setDeleteConfirmId(null);
    if (selectedSubmission?.id === id) setSelectedSubmission(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskId || !schoolId) return;
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      
      // Delete the task from ai_materials
      batch.delete(doc(db, "schools", schoolId, "ai_materials", taskId));
      
      // Delete all submissions for this task
      const toDelete = submissions.filter(s => s.taskId === taskId);
      toDelete.forEach(s => {
        batch.delete(doc(db, "schools", schoolId, "activities_submissions", s.id));
      });
      
      await batch.commit();
    } catch(e) {
      console.error(e);
    }
    setIsDeleting(false);
    setDeleteTaskConfirmId(null);
  };

  const handleDeleteAll = async (type: 'homework' | 'competition') => {
    if (!schoolId) return;
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);
      
      // Delete all submissions
      const toDelete = submissions.filter(s => s.type === type);
      toDelete.forEach(s => {
        batch.delete(doc(db, "schools", schoolId, "activities_submissions", s.id));
      });
      
      // Delete all tasks
      const toolType = type === 'homework' ? 'صناعة واجبات' : 'مسابقات صفية';
      const tasksToDelete = tasks.filter(t => t.tool === toolType);
      tasksToDelete.forEach(t => {
        batch.delete(doc(db, "schools", schoolId, "ai_materials", t.id));
      });
      
      await batch.commit();
    } catch(e) {
      console.error(e);
    }
    setIsDeleting(false);
    setDeleteAllConfirm(null);
    if (selectedSubmission?.type === type) setSelectedSubmission(null);
  };

  useEffect(() => {
    if (!schoolId) return;
    
    // Fetch submissions
    const qSub = query(
      collection(db, "schools", schoolId, "activities_submissions"),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribeSub = onSnapshot(qSub, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(list);
    }, (err) => {
      console.error(err);
    });

    // Fetch tasks (ai_materials)
    const teacherId = teacherData?.id || teacherData?.code || "unknown";
    const qTasks = query(
      collection(db, "schools", schoolId, "ai_materials"),
      where("teacherId", "==", teacherId)
    );
    
    const unsubscribeTasks = onSnapshot(qTasks, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setTasks(list.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => {
      unsubscribeSub();
      unsubscribeTasks();
    };
  }, [schoolId, teacherData]);

  // Decoupled search lists for homeworks and competitions (Tasks)
  const isClassMatch = (targetGrade?: string) => {
    if (!selectedClass || selectedClass === 'ALL' || selectedClass === 'all') return true;
    if (!targetGrade || targetGrade === 'all' || targetGrade === 'الكل') return true;
    return targetGrade === selectedClass;
  };

  const homeworkTasks = tasks.filter(t => 
    t.tool === 'صناعة واجبات' && 
    isClassMatch(t.targetGrade) &&
    (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.content?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const competitionTasks = tasks.filter(t => 
    t.tool === 'مسابقات صفية' && 
    isClassMatch(t.targetGrade) &&
    (t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.content?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col min-h-[600px] bg-[#050A18] text-white rounded-3xl border border-white/10" dir="rtl">
      {/* Upper header section with search and modern segmented tabs */}
      <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col xl:flex-row gap-5 justify-between items-start xl:items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">متابعة الأنشطة</h2>
            <p className="text-white/40 text-xs mt-1">تتبع إنجازات الطلاب وتقييم الواجبات والمسابقات</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Dynamic Search Bar */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ابحث عن طالب أو نشاط..."
              className="w-full bg-[#0A0F24] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500/50 outline-none placeholder:text-white/30"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          </div>

          {/* Upper Segmented Tabs (التبويبات العلوية) */}
          <div className="flex bg-[#0A0F24] p-1.5 rounded-xl border border-white/10 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('homework')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                filterType === 'homework'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ClipboardCheck size={14} />
              <span>الواجبات ({homeworkTasks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('competition')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                filterType === 'competition'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy size={14} />
              <span>المسابقات ({competitionTasks.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center text-white/40 min-h-[300px]">جاري التحميل...</div>
        ) : (
          <AnimatePresence mode="wait">
            {filterType === 'homework' ? (
              <motion.div
                key="homework-tab-content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <h3 className="font-bold text-amber-400 flex items-center gap-2">
                    <ClipboardCheck size={18} /> الواجبات المضافة ({homeworkTasks.length})
                  </h3>
                  {homeworkTasks.length > 0 && (
                    <button 
                      onClick={() => setDeleteAllConfirm('homework')}
                      className="text-red-400 text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} /> حذف جميع الواجبات
                    </button>
                  )}
                </div>

                {homeworkTasks.length === 0 ? (
                  <div className="text-white/40 text-sm text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
                    {searchTerm ? "لا توجد واجبات تطابق بحثك حالياً" : "لم تقم بإنشاء أي واجبات بعد"}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {homeworkTasks.map(task => {
                      const taskSubmissions = submissions.filter(s => s.taskId === task.id);
                      return (
                        <div key={task.id} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                             <div>
                               <h4 className="text-lg font-bold text-white">{task.name || 'واجب دراسي'}</h4>
                               <p className="text-sm text-white/50 mt-1">تاريخ النشر: {(typeof task.timestamp?.toDate === 'function' ? (typeof task.timestamp?.toDate === 'function' ? task.timestamp.toDate() : new Date(task.timestamp)) : new Date(task.timestamp)).toLocaleDateString('ar-SA')}</p>
                             </div>
                             <button onClick={() => setDeleteTaskConfirmId(task.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer title='حذف الواجب ككل'">
                                <Trash2 size={18} />
                             </button>
                          </div>
                          
                          <div className="bg-[#050A18] rounded-2xl p-4 border border-white/5">
                            <h5 className="text-sm font-bold text-amber-400/80 mb-4 flex items-center gap-2">
                              <User size={16} /> إجابات الطلاب ({taskSubmissions.length})
                            </h5>
                            
                            {taskSubmissions.length === 0 ? (
                              <p className="text-xs text-white/30 text-center py-4">لم يقم أي طالب بالرد على هذا الواجب حتى الآن</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {taskSubmissions.map(sub => (
                                  <div 
                                    key={sub.id} 
                                    onClick={() => { setSelectedSubmission(sub); setFeedback(sub.feedback || ''); }} 
                                    className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer hover:border-amber-500/40 hover:bg-white/[0.08] transition-all flex items-center gap-3"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                                      <User size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h6 className="font-bold text-xs text-white truncate">{sub.studentName}</h6>
                                      <div className="flex gap-2 items-center mt-1">
                                        <span className={`text-[10px] ${sub.aiGraded ? 'text-indigo-400' : sub.feedback ? 'text-emerald-400' : 'text-white/40'}`}>
                                          {sub.aiGraded ? 'تقييم تلقائي' : sub.feedback ? 'تم التقييم' : 'بانتظار التقييم'}
                                        </span>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(sub.id); }}
                                      className="text-white/20 hover:text-red-400 p-1 transition-colors"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>            ) : (
              <motion.div
                key="competition-tab-content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="border-b border-white/5 pb-2 flex justify-between items-center">
                  <h3 className="font-bold text-rose-400 flex items-center gap-2">
                    <Trophy size={18} /> المسابقات المضافة ({competitionTasks.length})
                  </h3>
                  {competitionTasks.length > 0 && (
                    <button 
                      onClick={() => setDeleteAllConfirm('competition')}
                      className="text-red-400 text-xs font-bold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} /> حذف جميع المسابقات
                    </button>
                  )}
                </div>
                
                {competitionTasks.length === 0 ? (
                  <div className="text-white/40 text-sm text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl">
                    {searchTerm ? "لا توجد مسابقات تطابق بحثك حالياً" : "لم تقم بإنشاء أي مسابقات بعد"}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {competitionTasks.map(task => {
                      const taskSubmissions = submissions.filter(s => s.taskId === task.id).sort((a, b) => b.score - a.score);
                      return (
                        <div key={task.id} className="bg-gradient-to-br from-rose-500/5 to-fuchsia-500/5 border border-rose-500/10 rounded-3xl p-5 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                             <div>
                               <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                  <Trophy size={18} className="text-rose-400" />
                                  {task.name || 'مسابقة صفية'}
                               </h4>
                               <p className="text-sm text-white/50 mt-1">تاريخ النشر: {(typeof task.timestamp?.toDate === 'function' ? (typeof task.timestamp?.toDate === 'function' ? task.timestamp.toDate() : new Date(task.timestamp)) : new Date(task.timestamp)).toLocaleDateString('ar-SA')}</p>
                             </div>
                             <button onClick={() => setDeleteTaskConfirmId(task.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer" title="حذف المسابقة ككل">
                                <Trash2 size={18} />
                             </button>
                          </div>
                          
                          <div className="bg-[#0A0F24]/80 rounded-2xl p-4 border border-white/5">
                            <h5 className="text-sm font-bold text-rose-400/80 mb-4 flex items-center gap-2">
                              <Trophy size={16} /> الترتيب ونتائج الطلاب ({taskSubmissions.length})
                            </h5>
                            
                            {taskSubmissions.length === 0 ? (
                              <p className="text-xs text-white/30 text-center py-4">لم يقم أي طالب بإنهاء هذه المسابقة حتى الآن</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {taskSubmissions.map((sub, i) => (
                                  <div 
                                    key={sub.id} 
                                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:bg-black/40 hover:border-rose-500/30 transition-all"
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0 text-xs ${
                                        i === 0 
                                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                                          : i === 1 
                                            ? 'bg-slate-300 text-black shadow-lg shadow-slate-300/10' 
                                            : i === 2 
                                              ? 'bg-amber-700 text-white shadow-lg shadow-amber-700/10' 
                                              : 'bg-white/10 text-white/50'
                                      }`}>
                                        {i + 1}
                                      </div>
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-white truncate">{sub.studentName}</h4>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-rose-400 font-black text-sm px-2.5 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                        {sub.score} <span className="text-[10px] text-rose-400/50 font-normal">/ {sub.totalQuestions}</span>
                                      </div>
                                      <button 
                                        onClick={() => setDeleteConfirmId(sub.id)}
                                        className="text-white/20 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Floating Evaluation/Grading Modal - Configured to support free scrolling upwards and unconstrained height limits */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 30 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0A0F24] border border-white/10 rounded-3xl w-full max-w-2xl my-4 sm:my-8 flex flex-col shadow-2xl overflow-hidden max-h-none"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h3 className="font-bold text-amber-400 flex items-center gap-2">
                    <ClipboardCheck size={18} />
                    <span>تقييم الواجب الدراسي</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1">{selectedSubmission.taskTitle}</p>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)} 
                  className="p-2 bg-white/5 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-white/50 transition-all cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto max-h-none">
                <div className="flex items-center gap-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{selectedSubmission.studentName}</h4>
                    <p className="text-xs text-white/40 mt-1">{selectedSubmission.createdAt?.toDate().toLocaleString('ar-SA')}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h5 className="text-xs font-bold text-amber-400/70 mb-2 uppercase tracking-wide">إجابة الطالب:</h5>
                  <div className="bg-[#050A18] border border-white/10 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap select-text selection:bg-amber-500/30">
                    {selectedSubmission.content}
                  </div>
                </div>

                {selectedSubmission.aiGraded && (
                  <div className="mb-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 text-right">
                    <h5 className="text-xs font-bold text-indigo-400 mb-2.5 flex items-center gap-1.5">
                      <Sparkles size={14} className="animate-pulse" /> تم التقييم والاحتساب تلقائياً بواسطة الذكاء الاصطناعي
                    </h5>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                        <span className="text-[10px] text-white/40">النقاط الممنوحة</span>
                        <span className="text-sm font-black text-amber-400 font-mono">+{selectedSubmission.pointsAwarded || selectedSubmission.score || 0} XP</span>
                      </div>
                      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                        <span className="text-[10px] text-white/40">الوسام الممنوح</span>
                        <span className="text-xs font-bold text-emerald-400 mt-1">
                          {selectedSubmission.badgeAwarded ? `🎖️ ${selectedSubmission.badgeAwarded}` : 'لا يوجد'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-white/70 bg-black/40 border border-white/5 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                      <strong className="text-indigo-300 block mb-1">التعليق التربوي التلقائي:</strong>
                      {selectedSubmission.feedback}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-xs font-bold text-white/50 mb-2 flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-400" /> 
                    <span>التغذية الراجعة والتقييم (تصل للطالب مباشرة):</span>
                  </h5>
                  <textarea 
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="اكتب ملاحظاتك وتقييمك وتوجيهاتك التربوية للطالب هنا..."
                    className="w-full h-32 bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-xl p-4 text-sm outline-none resize-none placeholder:text-white/20 transition-all"
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      disabled={isSendingFeedback || !feedback.trim()}
                      onClick={async () => {
                        setIsSendingFeedback(true);
                        try {
                          await updateDoc(doc(db, "schools", schoolId, "activities_submissions", selectedSubmission.id), {
                            feedback: feedback
                          });
                          setSelectedSubmission(null);
                        } catch(e) {
                          console.error(e);
                        } finally {
                          setIsSendingFeedback(false);
                        }
                      }}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-white/5 disabled:text-white/35 disabled:border-white/5 text-black font-black rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
                    >
                      {isSendingFeedback ? 'جاري الحفظ والارسال...' : 'حفظ وإرسال التقييم'} 
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Task Confirmation Modal */}
      <AnimatePresence>
        {deleteTaskConfirmId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0A0F24] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">حذف الواجب / المسابقة ككل</h3>
              <p className="text-white/60 text-sm mb-6">
                هل أنت متأكد من رغبتك في حذف هذا النشاط بالكامل؟ سيتم إخفاؤه من منصة الطلاب وسيتم حذف جميع إجابات الطلاب المتعلقة به. لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeleteTaskConfirmId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => handleDeleteTask(deleteTaskConfirmId)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'جاري الحذف...' : 'نعم، احذف النشاط'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Item Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0A0F24] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">تأكيد الحذف</h3>
              <p className="text-white/60 text-sm mb-6">
                هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 font-bold transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Modal */}
      <AnimatePresence>
        {deleteAllConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0A0F24] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">تأكيد حذف الكل</h3>
              <p className="text-white/60 text-sm mb-6">
                هل أنت متأكد من رغبتك في حذف <strong>جميع</strong> {deleteAllConfirm === 'homework' ? 'الواجبات' : 'المسابقات'}؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeleteAllConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 font-bold transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => handleDeleteAll(deleteAllConfirm)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الكل'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
