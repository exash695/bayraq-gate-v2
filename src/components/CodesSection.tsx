import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Save, UserPlus, CheckCircle2, FileSpreadsheet, Database, QrCode, Trash2, ShieldCheck, X, Copy
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { logActivity } from '../utils/auditLogger';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { 
  getPrefixForGrade, 
  generateStudentCodes, 
  exportStudentsToCSV, 
  printStudentCards 
} from '../utils/studentUtils';
import { copyToClipboard } from '../utils/clipboard';

interface CodesSectionProps {
  schoolName: string;
  adminBranch: 'boys' | 'girls';
  availableGrades: string[];
  discountLabels: Record<string, string>;
  discountRates: Record<string, number>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  savedLists: any[];
  setSavedLists: React.Dispatch<React.SetStateAction<any[]>>;
  tuitionFee: number;
  installmentPlan: any[];
  listToEdit?: any | null;
  setListToEdit?: (list: any | null) => void;
  onSaveList: (list: any) => Promise<void>;
  isSaving?: boolean;
  onSubViewChange?: (isOpen: boolean) => void;
}

export const CodesSection: React.FC<CodesSectionProps> = ({
  schoolName,
  adminBranch,
  availableGrades,
  discountLabels,
  discountRates,
  showToast,
  savedLists,
  setSavedLists,
  tuitionFee,
  installmentPlan,
  listToEdit,
  setListToEdit,
  onSaveList,
  isSaving,
  onSubViewChange
}) => {
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(availableGrades[0]);
  const [numRows, setNumRows] = useState<number | string>(1);
  const [bulkStudents, setBulkStudents] = useState<{id: string; name: string; address?: string; gender: 'male' | 'female'; grade: string; discountType?: string}[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<any[]>([]);
  const [currentListName, setCurrentListName] = useState('');
  const [currentListSchool, setCurrentListSchool] = useState(schoolName);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminObserverCode, setAdminObserverCode] = useState('');

  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(isAddingStudent);
    }
    return () => {
      if (onSubViewChange) {
        onSubViewChange(false);
      }
    };
  }, [isAddingStudent, onSubViewChange]);

  const displayCodes = useMemo(() => {
    if (isAddingStudent) {
      return generatedCodes;
    }
    return [...generatedCodes].sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'ar'));
  }, [generatedCodes, isAddingStudent]);

  useEffect(() => {
    if (listToEdit) {
      setIsAddingStudent(true);
      setCurrentListName(listToEdit.name);
      setCurrentListSchool(listToEdit.school || schoolName);
      
      if (listToEdit.students && listToEdit.students.length > 0) {
        const firstStudentGrade = listToEdit.students[0].grade;
        if (firstStudentGrade && availableGrades.includes(firstStudentGrade)) {
          setSelectedGrade(firstStudentGrade);
        }
      }

      setBulkStudents(listToEdit.students.map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        name: s.name,
        gender: s.gender,
        grade: s.grade,
        discountType: s.discountType || 'NONE'
      })));
      setGeneratedCodes(listToEdit.students.map((s: any) => ({
        ...s,
        id: s.id || crypto.randomUUID()
      })));
    }
  }, [listToEdit]);

  const handleGenerateCodes = () => {
    const freshCodes = generateStudentCodes(
      bulkStudents, 
      adminBranch, 
      tuitionFee, 
      discountRates, 
      currentListSchool || schoolName,
      installmentPlan
    );
    setGeneratedCodes(freshCodes);
    showToast(`تم توليد ${freshCodes.length} كود بنجاح`);

    logActivity({
      action: 'توليد أكواد',
      details: `تم توليد أكواد لعدد ${freshCodes.length} طالباً في قائمة: ${currentListName || 'بدون اسم'}`,
      targetType: 'codes_generation'
    });
  };

  const handleExport = () => {
    if (generatedCodes.length === 0) {
      showToast('لا توجد بيانات لتصديرها', 'error');
      return;
    }
    exportStudentsToCSV(generatedCodes);
    showToast('تم تصدير ملف Excel بنجاح');
  };

  const handlePrint = () => {
    printStudentCards(generatedCodes, schoolName);
  };

  const handleGenerateAdminCode = async () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const branchSuffix = adminBranch === 'girls' ? 'G' : 'B';
    const newCode = `ADM-${branchSuffix}-${randomNum}`;
    try {
      await addDoc(collection(db, 'activation_codes'), {
        code: newCode,
        role: 'admin', // This makes it work with the verification logic in App.tsx
        schoolName: schoolName,
        branch: branchSuffix,
        type: 'observer', // To signify it is a school admin/observer
        createdAt: serverTimestamp(),
      });
      setAdminObserverCode(newCode);
      setIsAdminModalOpen(true);
      showToast('تم توليد الكود وحفظه بنجاح', 'success');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء توليد الكود', 'error');
    }
  };

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/10">
            <QrCode size={24} />
          </div>
          <h3 className="text-white font-black text-xl tracking-tighter">مركز الأكواد</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateAdminCode}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20 text-xs font-black shadow-lg shadow-[#FFD600]/5 active:scale-95 transition-all hover:bg-[#FFD600]/20"
          >
            <ShieldCheck size={16} />
            توليد كود مراقب إداري
          </button>
          <button 
            onClick={() => {
              if (isAddingStudent && listToEdit && setListToEdit) {
                 setListToEdit(null);
              }
              setIsAddingStudent(!isAddingStudent);
              setGeneratedCodes([]);
              setBulkStudents([{ id: crypto.randomUUID(), name: '', address: '', gender: adminBranch === 'girls' ? 'female' : 'male', grade: selectedGrade }]);
              setCurrentListName('');
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-xs font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all ${
              isAddingStudent ? 'bg-rose-500' : 'bg-blue-600'
            }`}
          >
            {isAddingStudent ? <CheckCircle2 className="rotate-45" size={16} /> : <UserPlus size={16} />}
            {isAddingStudent ? (listToEdit ? 'إلغاء التعديل' : 'إلغاء') : 'إضافة وجبة طلاب'}
          </button>
        </div>
      </div>

      {isAddingStudent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#101935]/80 backdrop-blur-xl border-y md:border border-white/5 rounded-none md:rounded-[3rem] p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6 -mx-4 md:mx-0"
        >
          {!generatedCodes.length ? (
            <>
              <div className="flex flex-col md:flex-row bg-white/[0.03] p-5 rounded-none md:rounded-[2.5rem] border-y md:border border-white/5 gap-4 -mx-2 md:mx-0">
                <div className="flex-1 space-y-2">
                  <label className="text-white/30 text-[10px] font-black mr-2 uppercase tracking-widest">اسم الوجبة (القائمة)</label>
                  <input 
                    type="text" 
                    value={currentListName}
                    onChange={(e) => setCurrentListName(e.target.value)}
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-white text-base outline-none font-bold focus:border-blue-500 transition-all shadow-inner" 
                    placeholder="مثلاً: وجبة المتفوقين..." 
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-white/30 text-[10px] font-black mr-2 uppercase tracking-widest">اسم مدرسة الوجبة</label>
                  <input 
                    type="text" 
                    value={currentListSchool}
                    onChange={(e) => setCurrentListSchool(e.target.value)}
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-white text-base outline-none font-bold focus:border-blue-500 transition-all shadow-inner" 
                    placeholder="اسم المدرسة لهذه الوجبة..." 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-6 p-5 bg-white/5 rounded-none md:rounded-[2.5rem] border-y md:border border-white/5 -mx-2 md:mx-0">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500">
                      <Users size={14} />
                   </div>
                   <span className="text-white/40 text-[10px] font-black">إعدادات الوجبة</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={numRows}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNumRows(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                    }}
                    className="w-24 h-14 bg-black/40 border border-white/10 rounded-2xl px-4 text-white text-xl outline-none font-black text-center focus:border-blue-500 transition-all font-sans" 
                    placeholder="00"
                  />
                  <select 
                     value={selectedGrade}
                     onChange={(e) => {
                       const newGrade = e.target.value;
                       setSelectedGrade(newGrade);
                       // Update all existing rows in the current batch to the new selected grade
                       setBulkStudents(prev => prev.map(s => ({ ...s, grade: newGrade })));
                     }}
                    className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl px-4 text-white text-sm outline-none font-bold appearance-none text-right"
                  >
                    {availableGrades.map(g => <option key={g} value={g} className="bg-[#101935]">{g}</option>)}
                  </select>
                  <button 
                    onClick={() => {
                      const count = parseInt(numRows.toString()) || 1;
                      const newRows = Array.from({length: count}, () => ({ 
                        id: crypto.randomUUID(),
                        name: '', 
                        address: '',
                        gender: adminBranch === 'girls' ? 'female' as const : 'male' as const, 
                        grade: selectedGrade 
                      }));
                      setBulkStudents([...bulkStudents, ...newRows]);
                    }}
                    className="h-14 px-6 bg-blue-600 rounded-2xl text-white font-black text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/40"
                  >
                    إضافة سطور
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar px-1">
                {bulkStudents.map((row, index) => (
                   <div key={row.id} className="flex gap-3 items-center group">
                     <span className="text-white/20 text-[11px] font-black w-6 text-center">{index + 1}</span>
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_120px] gap-2 relative">
                        <input 
                          type="text" 
                          value={row.name || ''}
                          onChange={(e) => {
                            const newRows = [...bulkStudents];
                            newRows[index].name = e.target.value;
                            setBulkStudents(newRows);
                          }}
                          className="w-full h-14 bg-black/30 border border-white/5 rounded-2xl px-5 text-white text-sm outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-white/10" 
                          placeholder="اسم الطالب الرباعي..." 
                        />
                        <input 
                          type="text" 
                          value={row.address || ''}
                          onChange={(e) => {
                            const newRows = [...bulkStudents];
                            newRows[index].address = e.target.value;
                            setBulkStudents(newRows);
                          }}
                          className="w-full h-14 bg-black/30 border border-white/5 rounded-2xl px-5 text-[#FFD600] text-sm outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-white/10" 
                          placeholder="السكن (المنصور، الداودي...)" 
                        />
                        <div className="flex flex-col gap-1 shrink-0 w-full">
                          <select
                            value={row.discountType || 'NONE'}
                            onChange={(e) => {
                              const newRows = [...bulkStudents];
                              newRows[index].discountType = e.target.value;
                              setBulkStudents(newRows);
                            }}
                            className="h-10 bg-black/30 border border-white/5 rounded-xl px-2 text-white text-[10px] sm:text-xs outline-none focus:border-blue-500/50 transition-all font-bold appearance-none text-right w-full"
                          >
                            <option value="NONE" className="bg-[#101935]">بدون خصم</option>
                            {Object.entries(discountLabels).filter(([type]) => type !== 'NONE').map(([type, label]) => (
                              <option key={type} value={type} className="bg-[#101935]">
                                {label} {discountRates[type]}%
                              </option>
                            ))}
                          </select>
                          <div className="text-[8px] font-black text-emerald-400 text-center bg-emerald-400/5 rounded-lg py-1 border border-emerald-400/10 w-full truncate">
                             الصافي: {(tuitionFee - (tuitionFee * (discountRates[row.discountType || 'NONE'] || 0) / 100)).toLocaleString()}
                          </div>
                        </div>
                     </div>
                     {bulkStudents.length > 1 && (
                       <button 
                         onClick={() => setBulkStudents(bulkStudents.filter((_, i) => i !== index))}
                         className="w-12 h-12 rounded-2xl bg-rose-500/5 text-rose-500/30 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                       >
                         <Plus className="rotate-45" size={18} />
                       </button>
                     )}
                   </div>
                ))}
              </div>

              <button 
                onClick={handleGenerateCodes}
                className="w-full h-16 bg-blue-600 rounded-[25px] text-white font-black text-lg shadow-xl shadow-blue-900/40 hover:bg-blue-700 transition-all mt-4"
              >
                توليد الأكواد وحساب المستحقات
              </button>
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              {/* Batch Controls at the Top */}
              <div className="flex flex-wrap gap-2 items-center bg-white/5 p-3 rounded-[25px] border border-white/5">
                 <div className="text-[10px] text-white/40 font-black px-2 shrink-0">إجراءات الوجبة:</div>
                 <select 
                   onChange={(e) => {
                     const newGrade = e.target.value;
                     if (!newGrade) return;
                     const newCodes = generatedCodes.map(c => {
                       const prefix = getPrefixForGrade(newGrade);
                       const parts = c.student.split('-');
                       parts[0] = prefix;
                       return { ...c, grade: newGrade, student: parts.join('-') };
                     });
                     setGeneratedCodes(newCodes);
                     showToast(`تم تغيير الصف للكل إلى ${newGrade}`);
                   }}
                   className="h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-white text-[10px] font-bold outline-none flex-1 min-w-[120px]"
                 >
                   <option value="">تعديل الصف للكل...</option>
                   {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
 
                 <button 
                  onClick={() => {
                    const newStudent = {
                      id: crypto.randomUUID(),
                      name: '',
                      gender: adminBranch === 'girls' ? 'female' : 'male',
                      grade: generatedCodes.find((c: any) => c.grade)?.grade || selectedGrade || availableGrades[0],
                      discountType: 'NONE',
                      student: '', // Empty, needs generation
                      parent: '',  // Empty
                      discountAmount: 0,
                      totalAmount: tuitionFee,
                      discountRate: 0
                    };
                    setGeneratedCodes([newStudent, ...generatedCodes]);
                  }}
                  className="h-10 px-4 bg-blue-600 rounded-xl text-white font-black text-[10px] flex items-center gap-2 shadow-lg shadow-blue-900/40"
                >
                  <Plus size={14} />
                  إضافة طالب (بدون كود)
                </button>
                <button 
                   onClick={() => {
                     const newCodes = generatedCodes.map(code => ({
                        ...code,
                        totalAmount: tuitionFee - ((tuitionFee * (code.discountRate || 0)) / 100)
                     }));
                     setGeneratedCodes(newCodes);
                     showToast('تم تحديث أقساط الطلاب من الإعدادات');
                   }}
                   className="h-10 px-4 bg-purple-600 rounded-xl text-white font-black text-[10px] flex items-center gap-2 shadow-lg shadow-purple-900/40"
                  >
                  <Database size={14} />
                  تحديث الأقساط
                </button>
                <button 
                  onClick={() => {
                     const branchSuffix = adminBranch === 'girls' ? 'G' : 'B';
                     const newCodes = generatedCodes.map(code => {
                        if (code.student && code.student !== '') return code;
                        const randomNum = Math.floor(1000 + Math.random() * 9000);
                        const prefix = getPrefixForGrade(code.grade);
                        return { 
                           ...code, 
                           student: `${prefix}-${branchSuffix}-${randomNum}`,
                           parent: `PAR-${branchSuffix}-${randomNum}`
                        };
                     });
                     setGeneratedCodes(newCodes);
                      showToast('تمت إضافة الأكواد للطلاب الجدد');
                   }}
                   className="h-10 px-4 bg-emerald-600 rounded-xl text-white font-black text-[10px] flex items-center gap-2 shadow-lg shadow-emerald-900/40"
                 >
                   <CheckCircle2 size={14} />
                   توليد أكواد للجدد
                 </button>
               </div>

               <div id="student-table-container" className="grid grid-cols-1 gap-3 max-h-[450px] overflow-y-auto no-scrollbar -mx-6 md:mx-0 px-6 md:px-0">
                <div className="hidden md:grid grid-cols-[1.3fr_1fr_0.8fr_1fr_1fr_0.8fr_0.8fr] gap-1.5 items-center px-6 py-4 bg-[#050b1f] rounded-t-3xl text-[10px] font-black text-white/40 text-center sticky top-0 z-10 border-b border-white/5 uppercase tracking-widest">
                    <span className="text-right">الاسم</span>
                    <span>الصف</span>
                    <span>كود الطالب</span>
                    <span>كود ولي الأمر</span>
                    <span>الخصم</span>
                    <span>الاشتراك</span>
                    <span className="text-rose-500/50">إجراء</span>
                 </div>
                {displayCodes.map((code: any) => (
                   <div key={code.id || code.student} className="flex flex-col md:grid md:grid-cols-[1.3fr_1fr_0.8fr_1fr_1fr_0.8fr_0.8fr] gap-4 md:gap-1.5 items-start md:items-center bg-white/[0.03] p-5 md:p-3 rounded-3xl md:rounded-2xl border border-white/5 group transition-all hover:bg-white/[0.06] hover:border-blue-500/20 relative shadow-lg">
                      <div className="w-full md:w-auto flex flex-col gap-1">
                        <span className="md:hidden text-[9px] text-white/20 font-black uppercase tracking-widest">اسم الطالب</span>
                        <input 
                          type="text"
                          value={code.name || ''}
                          onChange={(e) => {
                            const newCodes = [...generatedCodes];
                            const idx = newCodes.findIndex(c => c.id === code.id || (code.student && c.student === code.student));
                            if (idx !== -1) {
                              newCodes[idx].name = e.target.value;
                              setGeneratedCodes(newCodes);
                            }
                          }}
                          className="w-full bg-transparent text-white text-base md:text-[10px] font-black text-right border-b border-white/5 focus:border-blue-500 outline-none truncate px-1 h-10 md:h-7"
                          placeholder="الاسم..."
                        />
                      </div>
                      
                      <div className="w-full md:w-auto flex flex-col gap-1">
                        <span className="md:hidden text-[9px] text-white/20 font-black uppercase tracking-widest">المرحلة</span>
                        <select
                          value={code.grade || ''}
                          onChange={(e) => {
                            const newGrade = e.target.value;
                            const newCodes = [...generatedCodes];
                            const idx = newCodes.findIndex(c => c.id === code.id || (code.student && c.student === code.student));
                            if (idx !== -1) {
                              newCodes[idx].grade = newGrade;
                              const prefix = getPrefixForGrade(newGrade);
                              if (code.student) {
                                const parts = code.student.split('-');
                                parts[0] = prefix;
                                newCodes[idx].student = parts.join('-');
                              }
                              setGeneratedCodes(newCodes);
                            }
                          }}
                          className="w-full bg-white/5 text-white/80 text-[10px] md:text-[8px] font-black outline-none rounded-xl h-10 md:h-7 px-3 md:px-1 appearance-none text-right md:text-center cursor-pointer border border-white/5"
                        >
                          {availableGrades.map(g => <option key={g} value={g} className="bg-[#101935]">{g}</option>)}
                        </select>
                      </div>

                      <div className="flex gap-1.5 w-full md:w-auto">
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="md:hidden text-[8px] text-white/20 font-black uppercase tracking-widest">كود الطالب</span>
                          <span className="text-[#FFD600] font-mono text-[10px] md:text-[7px] bg-black/40 py-2 md:py-1 rounded-xl text-center border border-white/5 font-black tracking-widest">{code.student}</span>
                        </div>
                        <div className="flex-1 flex flex-col gap-1">
                          <span className="md:hidden text-[8px] text-white/20 font-black uppercase tracking-widest">كود ولي الأمر</span>
                          <span className="text-blue-400 font-mono text-[10px] md:text-[7px] bg-black/40 py-2 md:py-1 rounded-xl text-center border border-white/5 font-black tracking-widest">{code.parent}</span>
                        </div>
                      </div>

                      <div className="w-full md:w-auto flex flex-col gap-1">
                        <span className="md:hidden text-[9px] text-white/20 font-black uppercase tracking-widest">الخصم</span>
                        <select
                          value={code.discountType || 'NONE'}
                          onChange={(e) => {
                            const type = e.target.value;
                            const rate = discountRates[type] || 0;
                            const amount = (tuitionFee * rate) / 100;
                            const total = tuitionFee - amount;
                            const newCodes = [...generatedCodes];
                            const idx = newCodes.findIndex(c => c.id === code.id || (code.student && c.student === code.student));
                            if (idx !== -1) {
                              newCodes[idx].discountType = type;
                              newCodes[idx].discountAmount = amount;
                              newCodes[idx].totalAmount = total;
                              newCodes[idx].discountRate = rate;
                              setGeneratedCodes(newCodes);
                            }
                          }}
                          className="w-full bg-white/5 text-white/80 text-[10px] md:text-[8px] font-black outline-none rounded-xl h-10 md:h-7 px-3 md:px-1 appearance-none text-right md:text-center cursor-pointer border border-white/5"
                        >
                          <option value="NONE" className="bg-[#101935]">بدون خصم</option>
                          {Object.entries(discountLabels).filter(([t]) => t !== 'NONE').map(([t, l]) => (
                            <option key={t} value={t} className="bg-[#101935]">{l}</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full md:w-auto flex items-center justify-between md:justify-center pt-2 md:pt-0 border-t md:border-0 border-white/5">
                        <span className="md:hidden text-[10px] text-white/30 font-black uppercase">المبلغ الصافي</span>
                        <span className="text-emerald-400 font-black text-lg md:text-[11px] text-center whitespace-nowrap drop-shadow-emerald">
                          {code.totalAmount ? `${code.totalAmount.toLocaleString()}` : '0'}<span className="text-[10px] md:text-[7px] opacity-40 ml-1">د.ع</span>
                        </span>
                      </div>

                      {/* Removed individual row delete button per user request */}
                   </div>
                ))}
              </div>

              <div className="p-6 bg-purple-500/5 rounded-none md:rounded-[3rem] border-y md:border border-purple-500/10 space-y-5 -mx-2 md:mx-0">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                       <Save size={20} />
                    </div>
                    <h4 className="text-white font-black text-sm tracking-tight">تسمية وحفظ القائمة</h4>
                 </div>
                 <div className="flex flex-col gap-3">
                   <input 
                      type="text" 
                      value={currentListName}
                      onChange={(e) => setCurrentListName(e.target.value)}
                      placeholder="مثلاً: أول متوسط - شعبة أ"
                      className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-5 text-white text-md outline-none focus:border-purple-500 transition-all font-black text-center"
                   />
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                          disabled={isSaving}
                          onClick={async () => {
                            if (!currentListName.trim()) {
                              showToast('يرجى تسمية القائمة أولاً', 'error');
                              return;
                            }
                            const newList = {
                              id: listToEdit ? listToEdit.id : Date.now().toString(),
                              name: currentListName,
                              school: currentListSchool || schoolName,
                              date: listToEdit ? listToEdit.date : new Date().toLocaleDateString('ar-IQ'),
                              students: [...generatedCodes]
                            };
                            
                            if (listToEdit) {
                              // Perform update via parent provided onSaveList
                              await onSaveList(newList);
                              showToast(`تم تحديث القائمة بنجاح`);
                              if (setListToEdit) setListToEdit(null);

                              logActivity({
                                action: 'تحديث قائمة طلاب',
                                details: `تم تحديث قائمة الطلاب المؤرشفة: ${newList.name}`,
                                targetId: newList.id,
                                targetType: 'academic_list',
                                targetName: newList.name
                              });
                            } else {
                              // Perform creation via parent provided onSaveList
                              await onSaveList(newList);
                              showToast(`تم الحفظ في الأرشيف بنجاح`);

                              logActivity({
                                action: 'حفظ قائمة طلاب',
                                details: `تم حفظ قائمة طلاب جديدة للأرشيف: ${newList.name}`,
                                targetId: newList.id,
                                targetType: 'academic_list',
                                targetName: newList.name
                              });
                            }
                            
                            setCurrentListName('');
                            setGeneratedCodes([]);
                            setIsAddingStudent(false);
                          }}
                          className={`h-14 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
                            isSaving ? 'bg-purple-800 cursor-not-allowed' : 'bg-purple-600 shadow-purple-900/40 hover:scale-[1.02]'
                          }`}
                      >
                          {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Save size={18} />
                          )}
                          {isSaving ? 'جاري الحفظ...' : (listToEdit ? 'تحديث التغييرات' : 'حفظ للأرشيف')}
                      </button>
                      <button 
                          onClick={handleExport}
                          className="h-14 bg-emerald-600 rounded-2xl text-white font-black text-sm shadow-xl shadow-emerald-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                          <FileSpreadsheet size={18} />
                          تنزيل إكسل
                      </button>
                      <button 
                          onClick={handlePrint}
                          className="h-14 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm hover:bg-white/10 transition-all col-span-2"
                      >
                          طباعة ورقية
                      </button>
                   </div>
                 </div>
              </div>

              <button 
                onClick={() => {
                  setGeneratedCodes([]);
                  setIsAddingStudent(false);
                  setBulkStudents([{ id: crypto.randomUUID(), name: '', gender: adminBranch === 'girls' ? 'female' : 'male', grade: selectedGrade }]);
                  if (listToEdit && setListToEdit) setListToEdit(null);
                }}
                className="w-full h-10 text-white/10 font-black text-[10px] hover:text-rose-500/40 transition-colors uppercase tracking-[0.2em]"
              >
                تجاهل وإغلاق
              </button>
            </div>
          )}
        </motion.div>
      )}
      <ConfirmDialog 
         isOpen={!!confirmDelete}
         onClose={() => setConfirmDelete(null)}
         onConfirm={async () => {
           if (confirmDelete === null || !confirmDelete.id) return;
           
           // 1. Snapshot current to revert if delete fails
           const previousCodes = [...generatedCodes];
           const newCodes = generatedCodes.filter((c) => c.id !== confirmDelete.id);
           
           console.log("Delete triggered for ID:", confirmDelete.id, "Remaining codes:", newCodes.length);
           
           // 2. Optimistic UI update
           setGeneratedCodes([...newCodes]);
           
           try {
             showToast('تم الحذف بنجاح');
             logActivity({
               action: 'حذف طالب من مسودة',
               details: `تم حذف طالب من مسودة الأكواد الحالية`,
               targetType: 'codes_generation'
             });
           } catch (e: any) {
             // 4. Rollback on failure
             setGeneratedCodes(previousCodes);
             console.error('Delete Error in CodesSection:', e);
             alert('فشلت عملية الحذف: ' + (e.message || 'خطأ غير معروف'));
           } finally {
             setConfirmDelete(null);
           }
         }}
         title="تأكيد الحذف"
         message="هل أنت متأكد من حذف هذا الطالب من القائمة؟"
      />

      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 bg-[#050A18]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#101935] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative shadow-[0_0_50px_rgba(255,214,0,0.1)] text-center"
            >
              <button 
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                title="إغلاق"
              >
                <X size={16} />
              </button>

              <div className="w-16 h-16 bg-[#FFD600]/10 rounded-full flex items-center justify-center text-[#FFD600] mx-auto mb-4 border border-[#FFD600]/20 shadow-[0_0_20px_rgba(255,214,0,0.2)]">
                <ShieldCheck size={32} />
              </div>

              <h2 className="text-xl font-black text-white mb-2">كود مراقب إداري</h2>
              <p className="text-sm text-white/50 mb-6 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                هذا الرمز يسمح بالدخول إلى منصة الطلاب لإدارة أو مراقبة المنشورات وإدارتها، بالإضافة لإمكانية النشر كإدارة المدرسة.
              </p>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 flex items-center justify-between gap-2">
                <span className="text-xl font-black text-[#FFD600] tracking-widest break-all" dir="ltr">{adminObserverCode}</span>
                <button 
                  onClick={async () => {
                    await copyToClipboard(adminObserverCode);
                    showToast('تم نسخ الكود بنجاح', 'success');
                  }}
                  className="w-10 h-10 shrink-0 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  title="نسخ الكود"
                >
                  <Copy size={18} />
                </button>
              </div>

              <button 
                onClick={async () => {
                  await copyToClipboard(adminObserverCode);
                  showToast('تم نسخ الكود بنجاح', 'success');
                  setIsAdminModalOpen(false);
                }}
                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/5 transition-colors"
              >
                نسخ الأكواد وإغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
