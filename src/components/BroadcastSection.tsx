import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Bell, History, AlertCircle, Trash2, Radio, CheckCircle, Target, Sparkles } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { broadcastService } from '../services/broadcastService';
import { logActivity } from '../utils/auditLogger';
import { academicService } from '../services/academicService';
import { doc, deleteDoc, db } from '../lib/firebase';

interface VerticalScrollPickerProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  label: string;
}

const VerticalScrollPicker: React.FC<VerticalScrollPickerProps> = ({ value, onChange, min, max, label }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startY = React.useRef(0);
  const startValue = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY;
    const step = Math.round(deltaY / 15);
    let newValue = startValue.current + step;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.touches[0].clientY;
    const step = Math.round(deltaY / 15);
    let newValue = startValue.current + step;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      if (value < max) onChange(value + 1);
    } else {
      if (value > min) onChange(value - 1);
    }
  };

  const getVisibleNumbers = () => {
    const nums = [];
    for (let i = -2; i <= 2; i++) {
      const v = value + i;
      if (v >= min && v <= max) {
        nums.push({ val: v, offset: i });
      } else {
        nums.push({ val: null, offset: i });
      }
    }
    return nums;
  };

  return (
    <div 
      className="flex flex-col items-center select-none"
      onWheel={handleWheel}
    >
      <span className="text-[10px] font-black text-white/40 mb-1">{label}</span>
      <div 
        className={`w-20 h-28 bg-[#090D1E]/90 border ${isDragging ? 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-white/5'} rounded-2xl flex flex-col items-center justify-between py-1 relative overflow-hidden transition-all touch-none cursor-ns-resize`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#090D1E] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#090D1E] to-transparent pointer-events-none z-10" />

        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); increment(); }}
          className="text-white/30 hover:text-rose-400 p-1 transition-colors z-20 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <div className="flex-1 flex flex-col justify-center items-center relative h-12 w-full">
          <div className="absolute inset-y-2 inset-x-1 border-y border-rose-500/30 bg-rose-500/5 pointer-events-none rounded" />

          <div className="flex flex-col items-center justify-center gap-1 py-0.5">
            {getVisibleNumbers().map((item, idx) => {
              if (item.val === null) {
                return <div key={`empty-${idx}`} className="h-4 w-4" />;
              }
              const isActive = item.offset === 0;
              return (
                <div 
                  key={item.val}
                  onClick={(e) => { e.stopPropagation(); onChange(item.val as number); }}
                  className={`text-center transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? "text-rose-400 font-extrabold text-sm scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                      : "text-white/20 font-bold text-[10px]"
                  }`}
                >
                  {item.val}
                </div>
              );
            })}
          </div>
        </div>

        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); decrement(); }}
          className="text-white/30 hover:text-rose-400 p-1 transition-colors z-20 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface BroadcastSectionProps {
  onSendMessage?: (message: string, targetGrades: string[], duration: number, targetSection?: string, targetSections?: string[]) => void;
  onUpdateMessage?: (broadcastId: string, newMessage: string) => void;
  onDeleteMessage?: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  schoolId?: string;
  savedLists?: any[];
}

export const BroadcastSection: React.FC<BroadcastSectionProps> = ({
  onSendMessage,
  onUpdateMessage,
  onDeleteMessage,
  showToast,
  schoolId,
  savedLists
}) => {
  const [message, setMessage] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [level, setLevel] = React.useState<'primary' | 'intermediate' | 'preparatory'>('primary');
  const [selectedGrades, setSelectedGrades] = React.useState<string[]>(['أول']);
  const [selectedBranches, setSelectedBranches] = React.useState<string[]>(['علمي', 'أدبي']);
  const [selectedSection, setSelectedSection] = React.useState<string>('ALL');
  const [internalLists, setInternalLists] = React.useState<any[]>(savedLists || []);
  const [durationHours, setDurationHours] = React.useState<number>(0);
  const [durationDays, setDurationDays] = React.useState<number>(1);
  const [history, setHistory] = React.useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (savedLists && savedLists.length > 0) {
      setInternalLists(savedLists);
    }
  }, [savedLists]);

  React.useEffect(() => {
    const unsubLists = academicService.subscribeToLists(schoolId || 'school1', (lists) => {
      if (lists && Array.isArray(lists) && lists.length > 0) {
        setInternalLists(lists);
      }
    });
    return () => unsubLists();
  }, [schoolId]);

  React.useEffect(() => {
    const unsub = broadcastService.subscribeToBroadcasts(schoolId, (data) => {
      setHistory(data);
    });
    return () => unsub();
  }, [schoolId]);

  const levels = [
    { id: 'primary', name: 'ابتدائي' },
    { id: 'intermediate', name: 'متوسط' },
    { id: 'preparatory', name: 'إعدادي' }
  ];

  const gradeMap = {
    primary: ['أول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس'],
    intermediate: ['أول', 'ثاني', 'ثالث'],
    preparatory: ['رابع', 'خامس', 'سادس']
  };

  const branches = ['علمي', 'أدبي'];

  const toggleGrade = (grade: string) => {
    setSelectedSection('ALL');
    if (grade === 'الجميع') {
      setSelectedGrades(['الجميع']);
      return;
    }
    
    setSelectedGrades(prev => {
      const filtered = prev.filter(g => g !== 'الجميع');
      if (filtered.includes(grade)) {
        const next = filtered.filter(g => g !== grade);
        return next.length === 0 ? ['الجميع'] : next;
      }
      return [grade];
    });
  };

  const toggleBranch = (branch: string) => {
    setSelectedSection('ALL');
    setSelectedBranches(prev => 
      prev.includes(branch) 
        ? prev.filter(b => b !== branch) 
        : [...prev, branch]
    );
  };

  const isSingleGradeSelected = selectedGrades.length === 1 && !selectedGrades.includes('الجميع');
  const selectedGradeName = isSingleGradeSelected ? selectedGrades[0] : null;

  const selectedGradeFullName = React.useMemo(() => {
    if (!selectedGradeName) return null;
    if (level === 'primary') return `${selectedGradeName} ابتدائي`;
    if (level === 'intermediate') return `${selectedGradeName} متوسط`;
    if (level === 'preparatory') {
      if (selectedBranches.length === 1) return `${selectedGradeName} ${selectedBranches[0]}`;
      return `${selectedGradeName} إعدادي`;
    }
    return selectedGradeName;
  }, [selectedGradeName, level, selectedBranches]);

  const availableSections = React.useMemo(() => {
    if (!selectedGradeFullName) return [];

    const norm = (s: string) => (s || '')
      .trim()
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, '')
      .replace(/^(الصف|صف)/g, '')
      .replace(/^ال/, '')
      .toLowerCase();

    const targetGradeNorm = norm(selectedGradeFullName);

    // 1. Search matching lists from academicLists / savedLists
    const matchedLists = (internalLists || []).filter((l: any) => {
      if (!l || !l.name) return false;
      const lNorm = norm(l.name);
      return lNorm.includes(targetGradeNorm) || targetGradeNorm.includes(lNorm);
    });

    if (matchedLists.length > 0) {
      return matchedLists.map((l: any) => {
        const trimmed = (l.name || '').trim();
        const match = trimmed.match(/[\s\-_–—]+([\u0621-\u064Aa-zA-Z0-9])$|\(([\u0621-\u064Aa-zA-Z0-9]+)\)|شعبة\s*([\u0621-\u064Aa-zA-Z0-9]+)/);
        const letter = match ? (match[1] || match[2] || match[3]) : '';
        const label = letter ? `شعبة ${letter}` : l.name;
        return {
          id: l.id,
          fullName: l.name,
          label: label,
          letter: letter || label
        };
      });
    }

    // 2. Default fallback sections for any grade without registered lists yet
    return [
      { id: `${selectedGradeFullName}_A`, fullName: `${selectedGradeFullName} أ`, label: 'شعبة أ', letter: 'أ' },
      { id: `${selectedGradeFullName}_B`, fullName: `${selectedGradeFullName} ب`, label: 'شعبة ب', letter: 'ب' },
      { id: `${selectedGradeFullName}_C`, fullName: `${selectedGradeFullName} ج`, label: 'شعبة ج', letter: 'ج' },
    ];
  }, [selectedGradeFullName, internalLists]);

  const activeTargetLabel = React.useMemo(() => {
    if (!isSingleGradeSelected || !selectedGradeFullName) {
      return selectedGrades.includes('الجميع') ? 'كل المرحلة' : `صفوف (${selectedGrades.join('، ')})`;
    }
    if (!selectedSection || selectedSection === 'ALL') {
      return `كافة شُعب (${selectedGradeFullName})`;
    }
    const matchedSec = availableSections.find(s => s.fullName === selectedSection);
    return `${selectedGradeFullName} (${matchedSec ? matchedSec.label : selectedSection})`;
  }, [isSingleGradeSelected, selectedGradeFullName, selectedGrades, selectedSection, availableSections]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const targetId = confirmDelete;
    const itemToDelete = history.find(h => h.id === targetId);
    const previousHistory = [...history];
    setConfirmDelete(null);

    // 1. Instantaneous optimistic removal from UI (0ms delay)
    setHistory(prev => prev.filter(br => br.id !== targetId));

    try {
      // 2. Perform deletion in backend (PostgreSQL + realtime)
      await broadcastService.deleteBroadcast(targetId, itemToDelete?.message);

      // 3. Delete from Firestore if exists
      try {
        await deleteDoc(doc(db, "broadcasts", targetId));
      } catch (_) {}

      showToast('تم حذف البث الإذاعي بنجاح', 'success');

      logActivity({
        action: 'حذف بث إذاعي',
        details: 'تم حذف بث إذاعي نهائياً من قاعدة البيانات',
        targetId: targetId,
        targetType: 'broadcast'
      });
    } catch (e: any) {
      console.error("Error deleting broadcast: ", e);
      // Rollback on failure
      setHistory(previousHistory);
      showToast('حدث خطأ أثناء الحذف: ' + (e.message || ''), 'error');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    let finalSelection: string[] = [];
    const currentLevelGrades = gradeMap[level];

    if (selectedGrades.includes('الجميع')) {
      if (level === 'primary') {
        finalSelection = currentLevelGrades.map(g => `${g} ابتدائي`);
      } else if (level === 'intermediate') {
        finalSelection = currentLevelGrades.map(g => `${g} متوسط`);
      } else if (level === 'preparatory') {
        currentLevelGrades.forEach(g => {
          branches.forEach(b => finalSelection.push(`${g} ${b}`));
        });
      }
    } else {
      if (level === 'primary') {
        finalSelection = selectedGrades.map(g => `${g} ابتدائي`);
      } else if (level === 'intermediate') {
        finalSelection = selectedGrades.map(g => `${g} متوسط`);
      } else if (level === 'preparatory') {
        selectedGrades.forEach(g => {
          selectedBranches.forEach(b => {
             finalSelection.push(`${g} ${b}`);
          });
        });
      }
    }

    const durationInHours = (durationDays * 24) + durationHours || 1;
    const msg = message.trim();

    // Determine section targeting
    const isSpecificSection = isSingleGradeSelected && selectedSection && selectedSection !== 'ALL';
    const targetSectionVal = isSpecificSection ? selectedSection : 'ALL';
    const targetSectionsVal = isSpecificSection 
      ? [selectedSection] 
      : (availableSections.length > 0 ? availableSections.map(s => s.fullName) : []);
    const targetGradesVal = isSpecificSection ? [selectedSection] : finalSelection;
    const targetSectionLabelVal = isSpecificSection
      ? (availableSections.find(s => s.fullName === selectedSection)?.label ? `${selectedGradeFullName} (${availableSections.find(s => s.fullName === selectedSection)?.label})` : selectedSection)
      : (isSingleGradeSelected ? `كافة شُعب (${selectedGradeFullName})` : 'كافة الشُعب');

    const expiryMs = Date.now() + durationInHours * 3600 * 1000;
    const broadcastId = `br_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Optimistic UI update in Smart Broadcast Log (سجل البث الذكي)
    const optimisticBroadcast = {
      id: broadcastId,
      schoolId: schoolId || 'school1',
      message: msg,
      targetGrades: targetGradesVal,
      targetSection: targetSectionVal,
      targetSections: targetSectionsVal,
      targetSectionLabel: targetSectionLabelVal,
      durationHours: durationInHours,
      expiryDate: expiryMs,
      author: 'الإدارة المدرسية',
      subject: 'الإذاعة المدرسية',
      targetLocation: 'ticker',
      timestampMs: Date.now(),
      createdAt: new Date()
    };
    setHistory(prev => [optimisticBroadcast, ...prev.filter(b => b.id !== optimisticBroadcast.id)]);
    setMessage('');

    try {
      if (onSendMessage) {
        onSendMessage(msg, targetGradesVal, durationInHours, targetSectionVal, targetSectionsVal);
      } else {
        await broadcastService.sendBroadcast({
          id: broadcastId,
          schoolId: schoolId || 'school1',
          message: msg,
          targetGrades: targetGradesVal,
          targetSection: targetSectionVal,
          targetSections: targetSectionsVal,
          durationHours: durationInHours,
          expiryDate: expiryMs,
          author: 'الإدارة المدرسية',
          subject: 'الإذاعة المدرسية',
          targetLocation: 'ticker'
        });
      }

      logActivity({
        action: 'إطلاق بث إذاعي',
        details: `تم إرسال رسالة إذاعية للفئات: ${targetGradesVal.join(', ')} (${targetSectionLabelVal})`,
        targetType: 'broadcast'
      });

      showToast(`تم إرسال ونشر البث في شاشات الطلاب وسجل البث فوراً (${targetSectionLabelVal}) 📡`, 'success');

      // Re-sync with backend
      const latest = await broadcastService.getBroadcasts(schoolId);
      if (latest && latest.length > 0) {
        setHistory(latest);
      }
    } catch (e: any) {
      console.error("Error sending broadcast:", e);
      showToast('حدث خطأ أثناء إرسال البث: ' + (e.message || ''), 'error');
    }
  };

  const currentGrades = gradeMap[level];

  return (
    <div className="space-y-6 px-4 md:px-0">
      <ConfirmDialog 
         isOpen={!!confirmDelete}
         onClose={() => setConfirmDelete(null)}
         onConfirm={handleDelete}
         title="تأكيد الحذف"
         message="هل أنت متأكد من حذف هذا البث الإذاعي نهائياً؟"
      />
      <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/10 border-b md:border border-rose-500/20 rounded-none md:rounded-[40px] p-8 text-center space-y-6 shadow-2xl -mx-4 md:mx-0">
         <div className="w-20 h-20 bg-rose-500 rounded-[30px] flex items-center justify-center text-white mx-auto shadow-xl shadow-rose-900/40 animate-pulse">
            <Megaphone size={40} />
         </div>
         <div>
           <h3 className="text-white font-black text-xl mb-2">رادار الذكاء الإذاعي</h3>
           <p className="text-white/40 text-xs leading-relaxed max-w-sm mx-auto font-bold px-4">
              أرسل تنبيهات ذكية، استنتاجات من الملازم، أو إعلانات عاجلة لطلابك بكل احترافية، مع توجيه دقيق للشُعب المحددة.
           </p>
         </div>

         {/* Level Selector */}
         <div className="flex items-center justify-center gap-2 bg-black/20 p-2 rounded-2xl border border-white/5 mx-auto w-fit">
            {levels.map(l => (
              <button 
                key={l.id}
                onClick={() => {
                  setLevel(l.id as any);
                  setSelectedGrades(l.id === 'primary' ? ['أول'] : ['الجميع']);
                  setSelectedSection('ALL');
                }}
                className={`px-5 py-2.5 rounded-xl font-black text-[10px] transition-all cursor-pointer ${
                  level === l.id ? 'bg-white text-black shadow-lg scale-105' : 'text-white/40 hover:text-white/60'
                }`}
              >
                {l.name}
              </button>
            ))}
         </div>

         <div className="bg-black/20 p-6 rounded-[35px] border border-white/5 space-y-5">
            <div className="space-y-4">
              <p className="text-white/30 text-[10px] font-black text-right uppercase tracking-[0.2em] mr-2">تحديد الفئة المستهدفة:</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button 
                  onClick={() => toggleGrade('الجميع')}
                  className={`px-5 py-2.5 rounded-xl font-black text-[10px] transition-all border cursor-pointer ${
                    selectedGrades.includes('الجميع') 
                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
                    : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
                >
                  كل المرحلة
                </button>
                {currentGrades.map(grade => (
                  <button 
                    key={grade}
                    onClick={() => toggleGrade(grade)}
                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] transition-all border cursor-pointer ${
                      selectedGrades.includes(grade) 
                      ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white/60'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            {/* Branch Selector for Preparatory Grades */}
            {level === 'preparatory' && !selectedGrades.includes('الجميع') && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-white/5 space-y-3"
              >
                <p className="text-rose-400 text-[10px] font-black text-right mr-2 flex items-center justify-end gap-2">
                  <span>اختر الفرع الدراسي:</span>
                  <AlertCircle size={12} />
                </p>
                <div className="flex justify-center gap-3">
                  {branches.map(branch => (
                    <button 
                      key={branch}
                      onClick={() => toggleBranch(branch)}
                      className={`px-10 py-3 rounded-2xl font-black text-[11px] transition-all border-2 cursor-pointer ${
                        selectedBranches.includes(branch) 
                        ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30' 
                        : 'bg-white/5 border-transparent text-white/20 hover:text-white/40'
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Available sections selector when a specific grade is chosen (e.g. الأول ابتدائي) */}
            {isSingleGradeSelected && selectedGradeFullName && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 border-t border-rose-500/20 text-right space-y-3" 
                dir="rtl"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                    <span className="text-[11px] font-black text-rose-300">
                      الشُعب المتاحة لصف ({selectedGradeFullName}):
                    </span>
                  </div>
                  <span className="text-[9px] text-white/50 font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {selectedSection === 'ALL' ? 'بث جماعي لكافة الشُعب' : `موجه حصرياً: ${activeTargetLabel}`}
                  </span>
                </div>

                {/* Section interactive pills */}
                <div className="flex flex-wrap items-center justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSection('ALL')}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                      selectedSection === 'ALL'
                        ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] border-rose-400 scale-105'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/5'
                    }`}
                  >
                    <span>🌟 كافة شُعب الصف</span>
                  </button>

                  {availableSections.map((sec) => {
                    const isCurrent = selectedSection === sec.fullName;
                    return (
                      <button
                        key={sec.id || sec.fullName}
                        type="button"
                        onClick={() => setSelectedSection(sec.fullName)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isCurrent
                            ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)] border-cyan-300 scale-105 font-extrabold'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/5'
                        }`}
                      >
                        <span>📌 {sec.label}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[9px] text-white/40 font-bold px-1">
                  {selectedSection === 'ALL'
                    ? `💡 سيتم بث هذا الإعلان لكافة طلاب جميع شُعب صف (${selectedGradeFullName}).`
                    : `💡 سيصل هذا الإعلان حصرياً لشاشة طلاب (${activeTargetLabel}) في شريط التنبيهات ولن يظهر للشُعب الأخرى.`}
                </p>
              </motion.div>
            )}
            
            {/* Duration Selector */}
            <div className="space-y-3 pt-4 border-t border-white/5 bg-black/10 rounded-3xl p-4">
                <label className="text-rose-300 text-[10px] font-extrabold block text-center">تحديد مدة بقاء الإعلان وتوقيت الاختفاء التلقائي ⏱️</label>
                <div className="flex justify-center items-center gap-12 py-2">
                  <VerticalScrollPicker 
                    value={durationHours} 
                    onChange={setDurationHours} 
                    min={0} 
                    max={23} 
                    label="ساعات" 
                  />
                  <VerticalScrollPicker 
                    value={durationDays} 
                    onChange={setDurationDays} 
                    min={0} 
                    max={30} 
                    label="أيام" 
                  />
                </div>
                <p className="text-[9px] text-white/40 text-center font-bold">
                  💡 متبقي البث: 
                  <span className="text-rose-400 mx-1 font-extrabold">
                    {durationDays > 0 ? `${durationDays} يوم ` : ""}
                    {durationHours > 0 ? `${durationHours} ساعة` : ""}
                    {durationDays === 0 && durationHours === 0 ? "ساعة واحدة (حد أدنى تلقائي)" : ""}
                  </span>
                  ثم يختفي تماماً من شاشات الطلاب.
                </p>
            </div>
         </div>
         
         <div className="space-y-4 pt-2">
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-36 bg-black/40 border border-white/10 rounded-[30px] p-6 text-white font-bold text-sm outline-none focus:border-rose-500 transition-all resize-none text-right placeholder:text-white/10 leading-relaxed shadow-inner"
              placeholder="اكتب رسالتك الذكية هنا ليعلق في أذهان الأبطال..."
            ></textarea>
            <button 
              disabled={!message.trim() || (level === 'preparatory' && !selectedGrades.includes('الجميع') && selectedBranches.length === 0)}
              onClick={handleSend}
              className="w-full h-20 bg-rose-500 rounded-[30px] text-white font-black text-lg shadow-2xl shadow-rose-900/60 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale disabled:scale-100 group cursor-pointer"
            >
               <Bell size={28} className="group-hover:rotate-12 transition-transform" />
               <span>
                 {selectedGrades.includes('الجميع')
                   ? 'إطلاق بث لكافة صفوف المرحلة'
                   : (selectedSection !== 'ALL' ? `إطلاق البث لشعبة (${activeTargetLabel})` : `إطلاق البث لـ (${activeTargetLabel})`)}
               </span>
            </button>
         </div>
      </div>
      
      <div className="bg-[#101935] p-6 md:p-8 rounded-none md:rounded-[40px] border-t md:border border-white/5 space-y-6 shadow-2xl min-h-[300px] -mx-4 md:mx-0">
         <div className="flex items-center justify-between px-2">
           <h4 className="text-white font-black text-sm uppercase tracking-widest text-white/50">سجل البث الذكي</h4>
           <History className="text-white/20" size={18} />
         </div>
         <div className="space-y-4">
           {history.map((br) => {
             const expiryMs = typeof br.expiryDate === 'number'
               ? br.expiryDate
               : (br.expiryDate ? new Date(br.expiryDate).getTime() : 0);
             const diffMs = expiryMs ? expiryMs - Date.now() : 0;
             let remainingBadgeText = '';
             if (diffMs > 0) {
               const diffMins = Math.round(diffMs / 60000);
               const diffHours = Math.floor(diffMins / 60);
               const remMins = diffMins % 60;
               remainingBadgeText = diffHours < 24
                 ? `متبقي ${diffHours} س ${remMins > 0 ? `${remMins} د` : ""} ⏱️`
                 : `متبقي ${Math.floor(diffHours / 24)} يوم ⏱️`;
             }

             return (
               <div key={br.id} className="p-5 bg-white/[0.03] rounded-3xl md:rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-rose-500/30 transition-all cursor-default relative overflow-hidden">
                  <div className="flex gap-4 w-full">
                     <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/10 shrink-0">
                        <Bell size={20} />
                     </div>
                     <div className="text-right w-full">
                        {editingId === br.id ? (
                          <div className="flex flex-col gap-2">
                              <textarea 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-bold text-sm outline-none focus:border-rose-500 transition-all resize-none text-right"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        if (onUpdateMessage) {
                                          onUpdateMessage(br.id, editValue);
                                        }
                                        await broadcastService.updateBroadcast(br.id, editValue);
                                        setHistory(prev => prev.map(p => p.id === br.id ? { ...p, message: editValue } : p));
                                        showToast('تم تعديل البث بنجاح', 'success');
                                      } catch (e: any) {
                                        showToast('خطأ في تعديل البث', 'error');
                                      }
                                      setEditingId(null);
                                    }}
                                    className="px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/20 cursor-pointer"
                                  >حفظ التعديل</button>
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="px-6 py-2 bg-white/10 text-white/50 rounded-xl text-xs font-black hover:bg-white/20 cursor-pointer"
                                  >إلغاء</button>
                              </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                              <p className="text-white text-base font-black leading-snug">{br.message}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-[10px] bg-rose-500/10 text-rose-300 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-rose-500/20">
                                      🎯 {br.targetSectionLabel || (br.targetSection && br.targetSection !== 'ALL' ? br.targetSection : (br.targetGrades?.includes('الجميع') ? 'لكافة الصفوف' : (Array.isArray(br.targetGrades) ? br.targetGrades.join(', ') : 'للجميع')))}
                                  </span>
                                  {remainingBadgeText && (
                                    <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold">
                                      {remainingBadgeText}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-white/40 font-bold">
                                      {(() => {
                                        const ts = br.timestampMs || (br.createdAt ? new Date(br.createdAt).getTime() : (br.timestamp ? (typeof br.timestamp.toDate === 'function' ? br.timestamp.toDate().getTime() : new Date(br.timestamp).getTime()) : Date.now()));
                                        const date = new Date(ts);
                                        return isNaN(date.getTime()) ? 'الآن' : new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' }).format(date);
                                      })()}
                                  </span>
                              </div>
                          </div>
                        )}
                     </div>
                  </div>
                  
                  {/* Actions Section - Only show when NOT editing */}
                  {editingId !== br.id && (
                    <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end border-t md:border-0 border-white/5 pt-3 md:pt-0">               
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => {
                                    setEditingId(br.id);
                                    setEditValue(br.message);
                                }}
                                className="h-10 px-6 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/10 hover:bg-blue-500 hover:text-white transition-all text-[11px] font-black cursor-pointer"
                            >
                                تعديل
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(br.id);
                                }}
                                className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/10 cursor-pointer"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                  )}
               </div>
             );
           })}
           {history.length === 0 && (
             <div className="py-20 text-center text-white/5 font-black text-xs italic">
               لا يوجد سجل بث حالياً..
             </div>
           )}
         </div>
      </div>
    </div>
  );
};
