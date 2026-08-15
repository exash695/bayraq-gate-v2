import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Database, Plus, Trash2, Edit2, BookOpen, Layers, Calendar, BookOpenText, ArrowRight, Save, X, CheckCircle, BrainCircuit, Search, Filter, Scan, Loader, FileText } from 'lucide-react';
import { TeacherExamPapers } from './TeacherExamPapers';
import { BerqCharacter } from './BerqCharacterManager';

interface TeacherQuestionBankProps {
  schoolId: string;
  teacherData?: any;
  schoolName?: string;
}

export const TeacherQuestionBank: React.FC<TeacherQuestionBankProps> = ({ schoolId, teacherData, schoolName }) => {
  const [mainTab, setMainTab] = useState<'questions' | 'papers'>('questions');
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // New Question State
  const [qText, setQText] = useState('');
  const [qDifficulty, setQDifficulty] = useState('medium');
  const [qTags, setQTags] = useState('');

  const categories = [
    { id: 'ministerial', title: "أسئلة وزارية", icon: BookOpen, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", desc: "أرشفة أسئلة السنوات السابقة" },
    { id: 'chapter', title: "أسئلة فصلية", icon: Layers, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", desc: "أسئلة مخصصة بنهاية كل فصل" },
    { id: 'monthly', title: "أسئلة شهرية", icon: Calendar, color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20", desc: "أسئلة اختبارات الأشهر" },
    { id: 'lesson', title: "أسئلة حسب الدرس", icon: BookOpenText, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", desc: "أسئلة دقيقة لكل موضوع" },
  ];

  useEffect(() => {
    if (!schoolId) return;
    setLoading(true);
    const subject = teacherData?.subject || "اللغة الإنجليزية"; // fallback or general
    
    // Fetch all questions for this school to derive counts
    const qRef = collection(db, 'question_bank');
    let q = query(qRef, 
        where('schoolId', '==', schoolId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = data.filter(d => (d as any).subject === subject);
      
      // Sort by descending createdAt
      filtered.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis() || 0;
          const tB = b.createdAt?.toMillis() || 0;
          return tB - tA;
      });

      setAllQuestions(filtered);
      
      // Calculate counts per category
      const counts: Record<string, number> = {};
      filtered.forEach((item: any) => {
         const cat = item.category;
         if (cat) {
             counts[cat] = (counts[cat] || 0) + 1;
         }
      });
      setCategoryCounts(counts);

      setLoading(false);
    }, (err) => {
      console.error("Error fetching questions:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [schoolId, teacherData]);

  useEffect(() => {
      if (activeCategory) {
          setQuestions(allQuestions.filter(q => q.category === activeCategory));
      } else {
          setQuestions([]);
      }
  }, [activeCategory, allQuestions]);

  const handleAddQuestion = async () => {
    if (!qText.trim()) return alert("يرجى كتابة نص السؤال");

    try {
      await addDoc(collection(db, 'question_bank'), {
        schoolId,
        teacherId: teacherData?.id || teacherData?.code || 'unknown',
        subject: teacherData?.subject || 'مادة عامة',
        category: activeCategory,
        text: qText,
        type: 'custom',
        difficulty: qDifficulty,
        tags: qTags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      // Reset form
      setQText('');
      setQTags('');
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء إضافة السؤال");
    }
  };

  const handleDelete = (id: string) => {
    setQuestionToDelete(id);
  };

  const confirmDelete = async () => {
    if (questionToDelete) {
      try {
        await deleteDoc(doc(db, 'question_bank', questionToDelete));
        setQuestionToDelete(null);
      } catch(e) {
        console.error(e);
      }
    }
  };

  const confirmDeleteAll = async () => {
    try {
      setLoading(true);
      for (const q of questions) {
        await deleteDoc(doc(db, 'question_bank', q.id));
      }
      setShowDeleteAllConfirm(false);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (activeCategory) {
    const catDetails = categories.find(c => c.id === activeCategory);
    return (
      <div className="h-full flex flex-col p-6 overflow-hidden relative" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${catDetails?.bg} ${catDetails?.border} border shrink-0`}>
              {catDetails && <catDetails.icon size={24} className={catDetails.color} />}
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black text-white whitespace-nowrap">{catDetails?.title}</h2>
              <button 
                onClick={() => setActiveCategory(null)}
                className="text-white/40 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 mt-1 w-fit"
              >
                <ArrowRight size={12} />
                عودة للأقسام
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {questions.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-500/20 shrink-0"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">حذف الكل</span>
              </button>
            )}
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-105 flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">إضافة سؤال جديد</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-20">
            <Database size={64} className="text-white/20 mb-6" />
            <p className="text-white text-xl font-bold mb-2">لا توجد أسئلة هنا بعد</p>
            <p className="text-white/60">اضغط على إضافة سؤال للبدء في بناء بنكك المعرفي.</p>
          </div>
        ) : (
            <div className="flex flex-col gap-2">
              {questions.map((q, idx) => {
                const isExpanded = expandedQuestionId === q.id;
                return (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-xl relative group transition-all w-full cursor-pointer hover:bg-white/10 overflow-hidden" onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}>
                  
                  {/* Collapsed Thin Strip View */}
                  <div className="p-3 md:p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black border ${
                        q.difficulty === 'hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {q.difficulty === 'hard' ? 'صعب' : q.difficulty === 'medium' ? 'متوسط' : 'سهل'}
                      </span>
                      {q.tags?.map((tag: string, i: number) => (
                        <span key={i} className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {tag}
                        </span>
                      ))}
                      <h4 className="text-white font-bold text-sm md:text-base truncate">{q.text}</h4>
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm" title="حذف السؤال">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Expanded Full View */}
                  {isExpanded && (
                    <div className="p-4 md:p-6 border-t border-white/5 bg-black/20 cursor-default" onClick={e => e.stopPropagation()}>
                      <h4 className="text-white font-bold text-base md:text-lg mb-4 leading-relaxed">{q.text}</h4>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {questionToDelete && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-md">
            <div className="bg-gradient-to-b from-[#131B32] to-[#0A1024] border border-red-500/30 rounded-[2rem] w-full max-w-md p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">تأكيد الحذف</h3>
              <p className="text-white/60 mb-8 font-bold">هل أنت متأكد من رغبتك في حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setQuestionToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-400 text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete All Confirmation Modal */}
        {showDeleteAllConfirm && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-md">
            <div className="bg-gradient-to-b from-[#131B32] to-[#0A1024] border border-red-500/30 rounded-[2rem] w-full max-w-md p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">حذف جميع الأسئلة</h3>
              <p className="text-white/60 mb-8 font-bold">هل أنت متأكد من حذف جميع الأسئلة ({questions.length}) المعروضة في هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmDeleteAll}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-400 text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  نعم، احذف الكل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-xl">
            <div className="bg-gradient-to-b from-[#131B32] to-[#0A1024] border border-indigo-500/20 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="sticky top-0 z-10 bg-gradient-to-b from-[#131B32] to-transparent p-6 pb-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Plus size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black text-white">إضافة سؤال جديد</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 hover:border-white/10">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 pt-2 space-y-6">
                <div>
                  <label className="block text-white/70 font-bold text-sm mb-2">نص السؤال</label>
                  <textarea
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold resize-none h-32 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="اكتب صيغة السؤال بوضوح..."
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-white/70 font-bold text-sm mb-2">الصعوبة</label>
                    <select
                      value={qDifficulty}
                      onChange={e => setQDifficulty(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white font-bold text-sm outline-none"
                    >
                      <option value="easy">سهل</option>
                      <option value="medium">متوسط</option>
                      <option value="hard">صعب</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-white/70 font-bold text-sm mb-2">إشارات (مفصولة بفاصلة)</label>
                    <input
                      type="text"
                      value={qTags}
                      onChange={e => setQTags(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold text-sm focus:border-indigo-500 outline-none"
                      placeholder="مثال: الفصل الأول, مهم, مبرهنة"
                    />
                  </div>
                </div>

                <div className="pt-4 pb-8 border-t border-white/10">
                  <button
                    onClick={handleAddQuestion}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 shrink-0 mb-8"
                  >
                    <Save size={20} />
                    حفظ السؤال في البنك
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  if ((mainTab as string) === 'papers') {
    return (
      <div className="h-full flex flex-col overflow-hidden relative" dir="rtl">
        <TeacherExamPapers schoolId={schoolId} teacherData={teacherData} onBack={() => setMainTab('questions')} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto no-scrollbar" dir="rtl">
      {/* Bairaq Header Banner */}
      <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
        <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Bairaq Video Companion */}
        <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
          <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
          <BerqCharacter
            pose="pose_questions_bank"
            glowColor="purple"
            className="w-full h-full object-cover relative z-10 scale-110"
          />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
        </div>

        {/* Header Title & Subtitle */}
        <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none text-right h-full min-w-0">
          <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
            بنك الأسئلة الموحد 📚
          </h2>
          <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
            <span className="shrink-0 text-xs">🏛️</span>
            <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
          </div>
          <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
            <span className="shrink-0 text-[10px]">📂</span>
            <span className="truncate">المستودع الذكي لإدارة وحفظ الأسئلة</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/10 pb-2">
        <button 
          onClick={() => setMainTab('questions')}
          className={`font-bold pb-2 px-2 transition-all border-b-2 ${(mainTab as string) === 'questions' ? 'text-indigo-400 border-indigo-400' : 'text-white/40 border-transparent hover:text-white'}`}
        >
          الأسئلة المفردة
        </button>
        <button 
          onClick={() => setMainTab('papers')}
          className={`font-bold pb-2 px-2 transition-all border-b-2 ${(mainTab as string) === 'papers' ? 'text-fuchsia-400 border-fuchsia-400' : 'text-white/40 border-transparent hover:text-white'}`}
        >
          الأوراق الامتحانية
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {categories.map((item, idx) => {
          const count = categoryCounts[item.id] || 0;
          return (
            <div 
              key={idx} 
              onClick={() => setActiveCategory(item.id)}
              className="bg-[#0A1024]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group hover:border-white/30 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.border} border`}>
                  <item.icon size={24} className={item.color} />
                </div>
                {count > 0 && (
                  <div className={`px-2.5 py-1 rounded-full text-xs font-black border ${item.bg} ${item.color} ${item.border}`}>
                    {count}
                  </div>
                )}
              </div>
              <h3 className="text-white font-bold text-lg">{item.title}</h3>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

