import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  GraduationCap, 
  BookOpen,
  Layout,
  ChevronDown,
  RefreshCcw,
  Check,
  Sparkles
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { logActivity } from '../utils/auditLogger';
import { CardGridSkeleton } from './shared/ShimmerSkeleton';

interface Subject {
  id: string;
  name: string;
}

const GRADES_BY_STAGE: Record<string, string[]> = {
  primary: ['الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'],
  intermediate: ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'],
  scientific: ['الرابع علمي', 'الخامس علمي', 'السادس علمي'],
  literary: ['الرابع أدبي', 'الخامس أدبي', 'السادس أدبي']
};

const DEFAULT_SUBJECTS: Record<string, Subject[]> = {
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
  initialStage?: string,
  onClose?: () => void
}> = ({ showToast, initialStage, onClose }) => {
  const [mappings, setMappings] = useState<Record<string, Subject[]>>(DEFAULT_SUBJECTS);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(initialStage || 'primary');
  const [selectedGrade, setSelectedGrade] = useState<string>('الأول الابتدائي');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string } | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<Record<string, string[]>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync with Firestore settings
  useEffect(() => {
    const docRef = doc(db, 'settings', 'subject_mapping');
    const unsubscribe = onSnapshot(
      docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const merged = { ...DEFAULT_SUBJECTS };
          
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              merged[key] = data[key];
            }
          });
          
          setMappings(merged);
          setPendingDeletions({});
          setHasUnsavedChanges(false);
        } else {
          setMappings(DEFAULT_SUBJECTS);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Subject mapping listener error:", error);
        setMappings(DEFAULT_SUBJECTS);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // When expanding a stage, auto-select its first grade
  const handleStageSelect = (stage: string) => {
    if (expandedStage === stage) {
      setExpandedStage(null);
    } else {
      setExpandedStage(stage);
      const firstGrade = GRADES_BY_STAGE[stage]?.[0] || '';
      setSelectedGrade(firstGrade);
      setEditingSubject(null);
      setNewSubjectName('');
    }
  };

  // Get active subjects for current grade
  const getCurrentGradeSubjects = (): Subject[] => {
    if (!selectedGrade) return [];
    if (mappings[selectedGrade] && Array.isArray(mappings[selectedGrade])) {
      return mappings[selectedGrade];
    }
    // Fallback to stage default
    const stage = expandedStage || 'intermediate';
    return DEFAULT_SUBJECTS[stage] || [];
  };

  // Save current modifications to Firestore
  const saveToFirebase = async () => {
    if (!selectedGrade) return;

    try {
      const currentSubjects = getCurrentGradeSubjects();
      const currentDeletions = pendingDeletions[selectedGrade] || [];
      
      // Clean up deleted subjects
      const cleanedGradeSubjects = currentSubjects.filter(s => !currentDeletions.includes(s.id));

      const updatedMappings = {
        ...mappings,
        [selectedGrade]: cleanedGradeSubjects
      };

      await setDoc(doc(db, 'settings', 'subject_mapping'), updatedMappings);
      setMappings(updatedMappings);
      setPendingDeletions(prev => ({ ...prev, [selectedGrade]: [] }));
      setHasUnsavedChanges(false);
      showToast(`تم حفظ وتطبيق مواد ${selectedGrade} بنجاح`, 'success');
      
      logActivity({
        action: 'تطبيق مواد الصف',
        details: `تم تحديث وتطبيق مواد (${selectedGrade}) على النظام المدرسي`,
        targetType: 'subject_mapping'
      });
    } catch (e) {
      console.error(e);
      showToast('حدث خطأ أثناء حفظ التعديلات', 'error');
    }
  };

  // Add subject to active grade
  const addSubject = () => {
    if (!newSubjectName.trim() || !selectedGrade) return;
    
    const newSubject: Subject = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newSubjectName.trim()
    };

    const currentSubjects = getCurrentGradeSubjects();
    const updated = {
      ...mappings,
      [selectedGrade]: [...currentSubjects, newSubject]
    };

    setMappings(updated);
    setHasUnsavedChanges(true);
    setNewSubjectName('');
  };

  // Soft toggle delete subject for active grade
  const toggleDeleteSubject = (id: string) => {
    if (!selectedGrade) return;
    const currentDeletions = pendingDeletions[selectedGrade] || [];
    const isAlreadyPending = currentDeletions.includes(id);
    
    const updated = isAlreadyPending
      ? currentDeletions.filter(item => item !== id)
      : [...currentDeletions, id];

    setPendingDeletions({
      ...pendingDeletions,
      [selectedGrade]: updated
    });
    setHasUnsavedChanges(true);
  };

  // Edit subject name
  const updateSubject = () => {
    if (!editingSubject || !editingSubject.name.trim() || !selectedGrade) return;

    const currentSubjects = getCurrentGradeSubjects();
    const updatedSubjects = currentSubjects.map(s => 
      s.id === editingSubject.id ? { ...s, name: editingSubject.name.trim() } : s
    );

    setMappings({
      ...mappings,
      [selectedGrade]: updatedSubjects
    });
    setHasUnsavedChanges(true);
    setEditingSubject(null);
  };

  // Reset current grade to stage defaults
  const resetGradeToDefault = () => {
    if (!expandedStage || !selectedGrade) return;
    const defaultList = DEFAULT_SUBJECTS[expandedStage] || [];
    
    setMappings({
      ...mappings,
      [selectedGrade]: defaultList
    });
    setPendingDeletions(prev => ({ ...prev, [selectedGrade]: [] }));
    setHasUnsavedChanges(true);
    showToast(`تم استعادة المواد الافتراضية لـ ${selectedGrade}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  const stageLabels: Record<string, { label: string; desc: string }> = {
    primary: { label: 'المرحلة الابتدائية', desc: 'من الصف الأول حتى السادس الابتدائي' },
    intermediate: { label: 'المرحلة المتوسطة', desc: 'من الصف الأول حتى الثالث المتوسط' },
    scientific: { label: 'المرحلة الإعدادية (الفرع العلمي)', desc: 'الرابع والخامس والسادس العلمي' },
    literary: { label: 'المرحلة الإعدادية (الفرع الأدبي)', desc: 'الرابع والخامس والسادس الأدبي' }
  };

  const stageKeys = ['primary', 'intermediate', 'scientific', 'literary'];
  const activeSubjects = getCurrentGradeSubjects();
  const currentDeletions = pendingDeletions[selectedGrade] || [];

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-[#101935]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
            <Layout size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>التوزيع النوعي للمواد الدراسية</span>
            </h2>
            <p className="text-white/40 text-xs font-bold mt-0.5">
              تخصيص وتطبيق المناهج والدروس لكل صف دراسي بشكل مستقل
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Stages Accordion */}
      <div className="grid gap-3.5">
        {stageKeys.map((stage) => {
          const isExpanded = expandedStage === stage;
          const grades = GRADES_BY_STAGE[stage] || [];

          return (
            <div 
              key={stage} 
              className="bg-[#0f172a]/70 border border-white/5 hover:border-white/10 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-200"
            >
              {/* Stage Header Button */}
              <button 
                onClick={() => handleStageSelect(stage)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-right cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    isExpanded 
                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' 
                      : 'bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10'
                  }`}>
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white group-hover:text-amber-400 transition-colors">
                      {stageLabels[stage]?.label}
                    </h3>
                    <p className="text-[11px] text-white/35 font-bold mt-0.5">
                      {grades.length} صفوف دراسية • {stageLabels[stage]?.desc}
                    </p>
                  </div>
                </div>
                
                <ChevronDown className={`text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-amber-400' : ''}`} size={18} />
              </button>

              {/* Stage Content: Grades & Grade-Specific Subjects */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/5"
                  >
                    
                    {/* Grade Selector Tabs (No stage-level general button) */}
                    <div className="p-3 sm:p-4 bg-black/30 flex flex-wrap gap-2 border-b border-white/5">
                      {grades.map((grade) => {
                        const isSelected = selectedGrade === grade;
                        const gradeCount = (mappings[grade] || DEFAULT_SUBJECTS[stage] || []).length;

                        return (
                          <button
                            key={grade}
                            onClick={() => {
                              setSelectedGrade(grade);
                              setEditingSubject(null);
                              setNewSubjectName('');
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                              isSelected 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20 font-black scale-100' 
                                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            <span>{grade}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                              isSelected ? 'bg-black/20 text-black' : 'bg-white/5 text-white/40'
                            }`}>
                              {gradeCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Grade Subjects Panel */}
                    <div className="p-4 sm:p-6 space-y-5">
                      
                      {/* Active Grade Header & Actions */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="text-amber-400" size={18} />
                          <div>
                            <span className="text-white font-black text-sm block">
                              مواد {selectedGrade}
                            </span>
                            <span className="text-white/35 text-[10px] font-bold">
                              المواد المسجلة فعلياً بنظام الدرجات لهذا الصف
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={resetGradeToDefault}
                          className="text-[11px] text-white/40 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/5"
                          title="استعادة المواد القياسية لهذا الصف"
                        >
                          <RefreshCcw size={12} />
                          <span>استعادة الافتراضي</span>
                        </button>
                      </div>

                      {/* Subjects Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {activeSubjects.map((subject, idx) => {
                          const isPendingDelete = currentDeletions.includes(subject.id);
                          const isEditing = editingSubject?.id === subject.id;

                          return (
                            <div 
                              key={subject.id || idx} 
                              className={`rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all border ${
                                isPendingDelete 
                                  ? 'bg-rose-500/5 border-rose-500/20 grayscale opacity-45' 
                                  : 'bg-[#121a30] border-white/5 hover:border-amber-500/30'
                              }`}
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-1.5 w-full">
                                  <input 
                                    type="text" 
                                    value={editingSubject.name}
                                    onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') updateSubject();
                                      if (e.key === 'Escape') setEditingSubject(null);
                                    }}
                                    className="flex-1 bg-black/50 border border-amber-500/60 rounded-xl px-3 py-1.5 text-white text-xs outline-none font-bold"
                                    autoFocus
                                  />
                                  <button 
                                    onClick={updateSubject} 
                                    className="p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 cursor-pointer"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingSubject(null)} 
                                    className="p-1.5 bg-white/10 text-white/60 hover:text-white rounded-lg cursor-pointer"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-mono text-white/30 shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <span className={`text-xs sm:text-sm font-black block truncate ${
                                        isPendingDelete ? 'line-through text-white/25' : 'text-white'
                                      }`}>
                                        {subject.name}
                                      </span>
                                      {isPendingDelete && (
                                        <span className="text-[8px] text-rose-400 font-bold block">
                                          سيتم حذفها عند الحفظ
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {!isPendingDelete && (
                                      <button 
                                        onClick={() => setEditingSubject({ id: subject.id, name: subject.name })}
                                        className="p-1.5 text-white/40 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                        title="تعديل اسم المادة"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => toggleDeleteSubject(subject.id)}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isPendingDelete 
                                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black' 
                                          : 'text-white/40 hover:text-rose-400 hover:bg-white/5'
                                      }`}
                                      title={isPendingDelete ? "تراجع عن الحذف" : "حذف المادة"}
                                    >
                                      {isPendingDelete ? <RefreshCcw size={13} /> : <Trash2 size={13} />}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* Add New Subject Input Card */}
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder={`إضافة مادة جديدة لـ (${selectedGrade})...`}
                            value={newSubjectName}
                            onChange={e => setNewSubjectName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSubject()}
                            className="w-full h-full min-h-[48px] bg-white/[0.02] border border-dashed border-white/10 hover:border-amber-500/40 rounded-2xl pl-11 pr-4 text-xs text-white placeholder-white/25 outline-none focus:border-amber-500 transition-all text-right font-bold"
                          />
                          <button 
                            onClick={addSubject}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-amber-400 hover:bg-amber-300 text-black rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-amber-900/20"
                            title="إضافة"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Save & Apply Button Bar for Active Grade */}
                      {hasUnsavedChanges && (
                        <div className="pt-4 border-t border-white/5 flex justify-center">
                          <motion.button
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={saveToFirebase}
                            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black px-6 py-2.5 rounded-2xl text-xs font-black transition-all shadow-xl shadow-emerald-500/20 active:scale-95 cursor-pointer"
                          >
                            <Save size={15} />
                            <span>حفظ وتطبيق التغييرات لـ ({selectedGrade})</span>
                          </motion.button>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
