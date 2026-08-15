import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Settings, 
  GraduationCap, 
  BookOpen,
  Layout,
  ChevronDown,
  RefreshCcw,
  Check
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logActivity } from '../utils/auditLogger';

interface Subject {
  id: string;
  name: string;
}

interface StageSubjects {
  primary: Subject[];
  intermediate: Subject[];
  scientific: Subject[];
  literary: Subject[];
}

const DEFAULT_SUBJECTS: StageSubjects = {
  primary: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الانجليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'science', name: 'العلوم' },
    { id: 'social', name: 'الاجتماعيات' },
    { id: 'art', name: 'التربية الفنية' },
    { id: 'sports', name: 'الرياضة' }
  ],
  intermediate: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الانجليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'chemistry', name: 'الكيمياء' },
    { id: 'physics', name: 'الفيزياء' },
    { id: 'biology', name: 'الأحياء' }
  ],
  scientific: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الانجليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'chemistry', name: 'كيمياء' },
    { id: 'physics', name: 'فيزياء' },
    { id: 'biology', name: 'احياء' },
    { id: 'computer', name: 'حاسوب' },
    { id: 'french', name: 'لغة فرنسية' }
  ],
  literary: [
    { id: 'islamic', name: 'التربية الإسلامية' },
    { id: 'arabic', name: 'اللغة العربية' },
    { id: 'english', name: 'اللغة الانجليزية' },
    { id: 'math', name: 'الرياضيات' },
    { id: 'geography', name: 'الجغرافية' },
    { id: 'history', name: 'التاريخ' },
    { id: 'economics', name: 'الاقتصاد' },
    { id: 'computer', name: 'الحاسوب' },
    { id: 'french', name: 'اللغة الفرنسية' }
  ]
};

export const SubjectManager: React.FC<{ 
  showToast: (msg: string, type?: 'success' | 'error') => void,
  initialStage?: 'primary' | 'intermediate' | 'scientific' | 'literary'
}> = ({ showToast, initialStage }) => {
  const [stages, setStages] = useState<StageSubjects>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<keyof StageSubjects | null>(initialStage || 'primary');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ stage: keyof StageSubjects; id: string; name: string } | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'subject_mapping');
    const unsubscribe = onSnapshot(
      docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setStages(snapshot.data() as StageSubjects);
        } else {
          setStages(DEFAULT_SUBJECTS);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Subject mapping listener error:", error);
        setStages(DEFAULT_SUBJECTS);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveToFirebase = async (updatedStages: StageSubjects) => {
    try {
      await setDoc(doc(db, 'settings', 'subject_mapping'), updatedStages);
      showToast('تم حفظ التعديلات بنجاح');
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const addSubject = (stage: keyof StageSubjects) => {
    if (!newSubjectName.trim()) return;
    
    const newSubject = {
      id: `custom_${Date.now()}`,
      name: newSubjectName.trim()
    };

    const updated = {
      ...stages,
      [stage]: [...stages[stage], newSubject]
    };

    setStages(updated);
    saveToFirebase(updated);
    setNewSubjectName('');

    logActivity({
      action: 'إضافة مادة',
      details: `تم إضافة مادة جديدة (${newSubjectName.trim()}) للمرحلة: ${stageLabels[stage]}`,
      targetType: 'subject_mapping'
    });
  };

  const deleteSubject = (stage: keyof StageSubjects, id: string) => {
    const subjectName = stages[stage].find(s => s.id === id)?.name;
    const updated = {
      ...stages,
      [stage]: stages[stage].filter(s => s.id !== id)
    };

    setStages(updated);
    saveToFirebase(updated);

    logActivity({
      action: 'حذف مادة',
      details: `تم حذف مادة (${subjectName}) من المرحلة: ${stageLabels[stage]}`,
      targetType: 'subject_mapping'
    });
  };

  const updateSubject = () => {
    if (!editingSubject || !editingSubject.name.trim()) return;

    const { stage, id, name } = editingSubject;
    const updated = {
      ...stages,
      [stage]: stages[stage].map(s => s.id === id ? { ...s, name: name.trim() } : s)
    };

    setStages(updated);
    saveToFirebase(updated);
    setEditingSubject(null);

    logActivity({
      action: 'تعديل مادة',
      details: `تم تعديل اسم مادة إلى (${name.trim()}) في المرحلة: ${stageLabels[stage]}`,
      targetType: 'subject_mapping'
    });
  };

  const resetToDefault = () => {
    setStages(DEFAULT_SUBJECTS);
    saveToFirebase(DEFAULT_SUBJECTS);
  };

  if (loading) return <div className="text-center py-20 text-white/40">جاري تحميل نظام المواد...</div>;

  const stageLabels: Record<keyof StageSubjects, string> = {
    primary: 'المرحلة الابتدائية',
    intermediate: 'المرحلة المتوسطة',
    scientific: 'المرحلة الإعدادية (الفرع العلمي)',
    literary: 'المرحلة الإعدادية (الفرع الأدبي)'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 glass-card p-6 border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Layout className="text-amber-500" />
            نظام التوزيع الذكي للمواد
          </h2>
          <p className="text-white/40 text-sm mt-1">إعداد وضبط المواد الدراسية حسب كل مرحلة تعليمية</p>
        </div>
      </div>

      <div className="grid gap-4">
        {(Object.keys(stages) as Array<keyof StageSubjects>).map((stage) => (
          <div key={stage} className="glass-card overflow-hidden border-white/5 hover:border-white/10 transition-all">
            <button 
              onClick={() => setExpandedStage(expandedStage === stage ? null : stage)}
              className="w-full p-6 flex items-center justify-between text-right"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${expandedStage === stage ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/40'}`}>
                   <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{stageLabels[stage]}</h3>
                  <p className="text-xs text-white/40 font-bold">{stages[stage].length} مواد دراسية</p>
                </div>
              </div>
              <ChevronDown className={`text-white/20 transition-transform ${expandedStage === stage ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {expandedStage === stage && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6 border-t border-white/5 pt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {stages[stage].map((subject) => (
                      <div 
                        key={subject.id} 
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-amber-500/30 transition-all"
                      >
                        {editingSubject?.id === subject.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input 
                              type="text" 
                              value={editingSubject?.name || ''}
                              onChange={e => setEditingSubject({...editingSubject, name: e.target.value})}
                              className="flex-1 bg-black/40 border border-amber-500/50 rounded-lg p-2 text-white text-sm outline-none"
                              autoFocus
                            />
                            <button onClick={updateSubject} className="text-emerald-400 hover:text-emerald-300"><Check size={18} /></button>
                            <button onClick={() => setEditingSubject(null)} className="text-rose-400 hover:text-rose-300"><X size={18} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="text-white font-bold">{subject.name}</span>
                            <div className="flex items-center gap-1 transition-opacity">
                              <button 
                                onClick={() => setEditingSubject({ stage, id: subject.id, name: subject.name })}
                                className="p-2 text-white/40 hover:text-amber-400 transition-colors bg-white/5 rounded-lg"
                                title="تعديل"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => deleteSubject(stage, subject.id)}
                                className="p-2 text-white/40 hover:text-rose-500 transition-colors bg-white/5 rounded-lg"
                                title="حذف"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="إضافة مادة جديدة..."
                        value={expandedStage === stage ? newSubjectName : ''}
                        onChange={e => setNewSubjectName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSubject(stage)}
                        className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500 focus:bg-amber-500/5 transition-all text-right"
                      />
                      <button 
                        onClick={() => addSubject(stage)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-black rounded-lg hover:scale-110 transition-transform shadow-lg shadow-amber-900/20"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};
