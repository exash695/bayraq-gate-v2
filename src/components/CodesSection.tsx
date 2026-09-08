import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Save, UserPlus, CheckCircle2, FileSpreadsheet, Database, QrCode, Trash2, ShieldCheck, X, Copy, Printer, Check, Sparkles, ArrowRight, RefreshCw
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { logActivity } from '../utils/auditLogger';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from '@/src/lib/firebase';

import { 
  getPrefixForGrade,
  normalizeGradeName,
  generateStudentCodes, 
  exportStudentsToCSV, 
  printStudentCards 
} from '../utils/studentUtils';
import { copyToClipboard } from '../utils/clipboard';
import { activationCodesService } from '../services/activationCodesService';

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
  schoolSettings?: any;
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
  schoolSettings,
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
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  
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
        const firstStudentGrade = normalizeGradeName(listToEdit.students[0].grade);
        if (firstStudentGrade && availableGrades.includes(firstStudentGrade)) {
          setSelectedGrade(firstStudentGrade);
        } else if (firstStudentGrade) {
          setSelectedGrade(firstStudentGrade);
        }
      }

      setBulkStudents(listToEdit.students.map((s: any) => ({
        id: s.id || crypto.randomUUID(),
        name: s.name,
        gender: s.gender,
        grade: normalizeGradeName(s.grade),
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
      installmentPlan,
      schoolSettings?.tuitionFeesByGrade
    );
    setGeneratedCodes(freshCodes);
    showToast(`تم توليد ${freshCodes.length} كود بنجاح`, 'success');

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
    showToast('تم تصدير ملف Excel بنجاح', 'success');
  };

  const handlePrint = () => {
    printStudentCards(generatedCodes, schoolName);
  };

  const handleGenerateAdminCode = async () => {
    
    try {
      const response = await activationCodesService.generateCodes(
        schoolName,
        'admin',
        1,
        `ADM-${adminBranch === 'girls' ? 'G' : 'B'}`
      );
      
      if (response.success && response.codes.length > 0) {
        const newCode = response.codes[0].code;
        
        // Also sync back to Firestore for legacy compatibility if needed
        await addDoc(collection(db, 'activation_codes'), {
          code: newCode,
          role: 'admin',
          schoolName: schoolName,
          branch: adminBranch === 'girls' ? 'G' : 'B',
          type: 'observer',
          createdAt: serverTimestamp(),
        });

        setAdminObserverCode(newCode);
        setIsAdminModalOpen(true);
        showToast('تم توليد كود المراقب بنجاح', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء توليد الكود', 'error');
    }
  };

  const handleQuickCopy = async (codeText: string, key: string) => {
    if (!codeText) return;
    await copyToClipboard(codeText);
    setCopiedCodeKey(key);
    showToast(`تم نسخ الكود: ${codeText}`, 'success');
    setTimeout(() => {
      setCopiedCodeKey(null);
    }, 2000);
  };

  // Live Batch Calculation metrics
  const batchStats = useMemo(() => {
    const list = generatedCodes.length > 0 ? generatedCodes : bulkStudents;
    const totalCount = list.length;
    const withCodesCount = generatedCodes.filter(c => !!c.student).length;
    const discountedCount = list.filter(c => c.discountType && c.discountType !== 'NONE').length;
    
    const totalNet = list.reduce((acc, c) => {
      const byGrade = schoolSettings?.tuitionFeesByGrade || {};
      const baseFee = (c.grade && byGrade[c.grade] !== undefined) ? Number(byGrade[c.grade]) : tuitionFee;
      const rate = discountRates[c.discountType || 'NONE'] || 0;
      const currentNet = c.totalAmount !== undefined ? c.totalAmount : (baseFee - (baseFee * rate / 100));
      return acc + currentNet;
    }, 0);

    return { totalCount, withCodesCount, discountedCount, totalNet };
  }, [generatedCodes, bulkStudents, tuitionFee, discountRates, schoolSettings?.tuitionFeesByGrade]);

  return (
    <div className="w-full space-y-4" dir="rtl">
      {/* Edge-to-Edge Header Strip */}
      <div className="bg-[#0c1224]/90 backdrop-blur-xl border-y sm:border border-white/10 sm:rounded-3xl p-4 sm:p-6 shadow-2xl -mx-3 sm:mx-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <QrCode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black text-lg sm:text-xl tracking-tight">مركز توليد الأكواد وبطاقات الدخول</h3>
                <span className="text-[10px] text-[#FFD600] font-black bg-[#FFD600]/10 border border-[#FFD600]/20 px-2.5 py-0.5 rounded-full">
                  {schoolName}
                </span>
              </div>
              <p className="text-white/40 text-xs font-bold mt-0.5">
                توليد وإدارة الأكواد الرسمية للطلاب وأولياء الأمور والمراقبين الإداريين
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateAdminCode}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/20 text-xs font-black shadow-lg shadow-[#FFD600]/5 active:scale-95 transition-all hover:bg-[#FFD600]/20"
            >
              <ShieldCheck size={16} />
              <span>كود مراقب إداري</span>
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-xs font-black shadow-lg active:scale-95 transition-all ${
                isAddingStudent 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-600/20' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/20'
              }`}
            >
              {isAddingStudent ? <X size={16} /> : <UserPlus size={16} />}
              <span>{isAddingStudent ? (listToEdit ? 'إلغاء التعديل' : 'إغلاق المحرر') : 'إضافة وجبة طلاب جديدة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Adding & Codes Generation Container */}
      <AnimatePresence>
        {isAddingStudent && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#0c1224]/95 backdrop-blur-xl border-y sm:border border-white/10 sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5 -mx-3 sm:mx-0"
          >
            {!generatedCodes.length ? (
              /* Step 1: Inputting bulk students */
              <>
                {/* Batch Meta inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-[11px] font-black mr-1 uppercase">اسم الوجبة (القائمة أو الشعبة)</label>
                    <input 
                      type="text" 
                      value={currentListName}
                      onChange={(e) => setCurrentListName(e.target.value)}
                      className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm outline-none font-bold focus:border-blue-500/80 transition-all placeholder:text-white/20" 
                      placeholder="مثال: الأول المتوسط - شعبة أ" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-white/40 text-[11px] font-black mr-1 uppercase">اسم المدرسة التابعة لها الوجبة</label>
                    <input 
                      type="text" 
                      value={currentListSchool}
                      onChange={(e) => setCurrentListSchool(e.target.value)}
                      className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm outline-none font-bold focus:border-blue-500/80 transition-all placeholder:text-white/20" 
                      placeholder="اسم المدرسة..." 
                    />
                  </div>
                </div>

                {/* Rows Control & Grade Selector */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Users size={16} />
                    </div>
                    <div>
                      <span className="text-white text-xs font-black block">إعداد الصف والسطور</span>
                      <span className="text-white/40 text-[10px] font-bold">العدد الحالي: {bulkStudents.length} سطر</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-2 h-11">
                      <span className="text-white/30 text-[10px] font-bold ml-1">إضافة:</span>
                      <input 
                        type="number" 
                        min="1" 
                        max="100" 
                        value={numRows}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNumRows(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                        }}
                        className="w-12 bg-transparent text-white text-center text-sm font-black outline-none font-sans" 
                      />
                      <span className="text-white/30 text-[10px] font-bold mr-1">سطور</span>
                    </div>

                    <select 
                      value={selectedGrade}
                      onChange={(e) => {
                        const newGrade = e.target.value;
                        setSelectedGrade(newGrade);
                        setBulkStudents(prev => prev.map(s => ({ ...s, grade: newGrade })));
                      }}
                      className="h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-white text-xs font-bold outline-none cursor-pointer focus:border-blue-500"
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
                      className="h-11 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-xs transition-all shadow-md shadow-blue-900/30 flex items-center gap-1.5"
                    >
                      <Plus size={15} />
                      <span>إضافة السطور</span>
                    </button>
                  </div>
                </div>

                {/* Slim Student Rows Container */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                  {bulkStudents.map((row, index) => {
                    const byGrade = schoolSettings?.tuitionFeesByGrade || {};
                    const baseFee = (row.grade && byGrade[row.grade] !== undefined) ? Number(byGrade[row.grade]) : tuitionFee;
                    const rate = discountRates[row.discountType || 'NONE'] || 0;
                    const netFee = baseFee - (baseFee * rate / 100);

                    return (
                      <div 
                        key={row.id} 
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 sm:p-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-white/5 text-white/40 text-xs font-mono font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input 
                            type="text" 
                            value={row.name || ''}
                            onChange={(e) => {
                              const newRows = [...bulkStudents];
                              newRows[index].name = e.target.value;
                              setBulkStudents(newRows);
                            }}
                            className="flex-1 sm:w-60 h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-white text-xs outline-none focus:border-blue-500/80 transition-all font-bold placeholder:text-white/20" 
                            placeholder="اسم الطالب الرباعي..." 
                          />
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={row.address || ''}
                            onChange={(e) => {
                              const newRows = [...bulkStudents];
                              newRows[index].address = e.target.value;
                              setBulkStudents(newRows);
                            }}
                            className="h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-amber-300 text-xs outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/20" 
                            placeholder="السكن / المنطقة..." 
                          />

                          <div className="flex items-center gap-1.5">
                            <select
                              value={row.discountType || 'NONE'}
                              onChange={(e) => {
                                const newRows = [...bulkStudents];
                                newRows[index].discountType = e.target.value;
                                setBulkStudents(newRows);
                              }}
                              className="flex-1 h-10 bg-black/40 border border-white/10 rounded-xl px-2 text-white text-xs outline-none focus:border-blue-500 transition-all font-bold cursor-pointer"
                            >
                              <option value="NONE" className="bg-[#101935]">بدون خصم (0%)</option>
                              {Object.entries(discountLabels).filter(([type]) => type !== 'NONE').map(([type, label]) => (
                                <option key={type} value={type} className="bg-[#101935]">
                                  {label} ({discountRates[type]}%)
                                </option>
                              ))}
                            </select>

                            <div className="shrink-0 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-2 rounded-xl border border-emerald-500/20 whitespace-nowrap">
                              {netFee.toLocaleString()} د.ع
                            </div>
                          </div>
                        </div>

                        {bulkStudents.length > 1 && (
                          <button 
                            onClick={() => setBulkStudents(bulkStudents.filter((_, i) => i !== index))}
                            className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shrink-0 self-end sm:self-center"
                            title="حذف هذا السطر"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Generate Action Button */}
                <button 
                  onClick={handleGenerateCodes}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 rounded-2xl text-white font-black text-base shadow-xl shadow-blue-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  <span>توليد الأكواد الرسمية وحساب المستحقات المالية ({bulkStudents.length} طالب)</span>
                </button>
              </>
            ) : (
              /* Step 2: Generated Codes Management & Archive Save */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {/* Batch Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/50 font-black">إجراءات الوجبة:</span>
                    <select 
                      onChange={(e) => {
                        const newGrade = e.target.value;
                        if (!newGrade) return;
                        const newCodes = generatedCodes.map(c => {
                          const prefix = getPrefixForGrade(newGrade);
                          const parts = (c.student || '').split('-');
                          parts[0] = prefix;
                          return { ...c, grade: newGrade, student: parts.join('-') };
                        });
                        setGeneratedCodes(newCodes);
                        showToast(`تم تعديل صف الوجبة إلى ${newGrade}`, 'success');
                      }}
                      className="h-9 bg-black/40 border border-white/10 rounded-xl px-2.5 text-white text-xs font-bold outline-none focus:border-blue-500"
                    >
                      <option value="">تعديل الصف للكل...</option>
                      {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => {
                        const newStudent = {
                          id: crypto.randomUUID(),
                          name: '',
                          gender: adminBranch === 'girls' ? 'female' : 'male',
                          grade: generatedCodes.find((c: any) => c.grade)?.grade || selectedGrade || availableGrades[0],
                          discountType: 'NONE',
                          student: '',
                          parent: '',
                          discountAmount: 0,
                          totalAmount: tuitionFee,
                          discountRate: 0
                        };
                        setGeneratedCodes([newStudent, ...generatedCodes]);
                      }}
                      className="h-9 px-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Plus size={14} />
                      <span>إضافة طالب</span>
                    </button>
                    <button 
                      onClick={() => {
                        const newCodes = generatedCodes.map(code => {
                          const byGrade = schoolSettings?.tuitionFeesByGrade || {};
                          const baseFee = (code.grade && byGrade[code.grade] !== undefined) ? Number(byGrade[code.grade]) : tuitionFee;
                          return {
                            ...code,
                            totalAmount: baseFee - ((baseFee * (code.discountRate || 0)) / 100)
                          };
                        });
                        setGeneratedCodes(newCodes);
                        showToast('تم تحديث الأقساط من الإعدادات', 'success');
                      }}
                      className="h-9 px-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Database size={14} />
                      <span>تحديث الأقساط</span>
                    </button>
                    <button 
                      onClick={() => {
                        
                        const newCodes = generatedCodes.map(code => {
                          if (code.student && code.student !== '') return code;
                          const randomNum = Math.floor(1000 + Math.random() * 9000);
                          const prefix = getPrefixForGrade(code.grade);
                          return { 
                            ...code, 
                            student: `${prefix}-${code.gender === 'female' ? 'G' : code.gender === 'male' ? 'B' : (adminBranch === 'girls' ? 'G' : 'B')}-${randomNum}`,
                            parent: `PAR-${code.gender === 'female' ? 'G' : code.gender === 'male' ? 'B' : (adminBranch === 'girls' ? 'G' : 'B')}-${randomNum}`
                          };
                        });
                        setGeneratedCodes(newCodes);
                        showToast('تم توليد الأكواد للطلاب الجدد', 'success');
                      }}
                      className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <CheckCircle2 size={14} />
                      <span>توليد أكواد للجدد</span>
                    </button>
                    <button 
                      onClick={() => {
                        let fixedCount = 0;
                        const newCodes = generatedCodes.map(code => {
                          const properPrefix = getPrefixForGrade(code.grade || selectedGrade);
                          let student = code.student || '';
                          let parent = code.parent || '';
                          if (student) {
                            const parts = student.split('-');
                            if (parts[0].toUpperCase() !== properPrefix.toUpperCase()) {
                              parts[0] = properPrefix;
                              student = parts.join('-');
                              fixedCount++;
                            }
                          }
                          if (parent) {
                            parent = parent.toUpperCase();
                          }
                          return { ...code, student, parent };
                        });
                        setGeneratedCodes(newCodes);
                        showToast(`تم تصحيح بادئات ${fixedCount} كود إلى (${getPrefixForGrade(selectedGrade)}) بنجاح`, 'success');
                      }}
                      className="h-9 px-3 bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 hover:text-black rounded-xl text-amber-400 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="تصحيح بادئات الأكواد لتتوافق مع تشفير الصف المعتمد (مثل M3 للثالث متوسط)"
                    >
                      <RefreshCw size={14} />
                      <span>تصحيح التشفير المعتمد</span>
                    </button>
                  </div>
                </div>

                {/* Slim, Edge-to-Edge Table Header & Rows */}
                <div className="bg-[#080d1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                  {/* Desktop Table Header */}
                  <div className="hidden lg:grid grid-cols-[50px_1.5fr_1.1fr_1fr_1fr_1.1fr_1.1fr_50px] gap-2 items-center px-4 py-3 bg-white/5 border-b border-white/10 text-[11px] font-black text-white/50 text-center uppercase tracking-wider">
                    <span>#</span>
                    <span className="text-right">اسم الطالب</span>
                    <span>الصف</span>
                    <span>كود الطالب</span>
                    <span>كود ولي الأمر</span>
                    <span>الخصم</span>
                    <span>صافي القسط</span>
                    <span>حذف</span>
                  </div>

                  {/* Slim Student Rows */}
                  <div className="max-h-[460px] overflow-y-auto no-scrollbar divide-y divide-white/5">
                    {displayCodes.map((code: any, idx: number) => {
                      const studentKey = `stu-code-${code.id || idx}`;
                      const parentKey = `par-code-${code.id || idx}`;
                      const isStuCopied = copiedCodeKey === studentKey;
                      const isParCopied = copiedCodeKey === parentKey;

                      return (
                        <div 
                          key={code.id || code.student || idx} 
                          className="flex flex-col lg:grid lg:grid-cols-[50px_1.5fr_1.1fr_1fr_1fr_1.1fr_1.1fr_50px] gap-2 lg:gap-2 items-stretch lg:items-center p-3 lg:px-4 lg:py-2.5 hover:bg-white/[0.03] transition-all group"
                        >
                          {/* Row number & student name */}
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-white/5 text-white/40 text-xs font-mono font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 lg:hidden">
                              <span className="text-[10px] text-white/30 font-bold block">اسم الطالب:</span>
                            </div>
                            <input 
                              type="text"
                              value={code.name || ''}
                              onChange={(e) => {
                                const newCodes = [...generatedCodes];
                                const targetIdx = newCodes.findIndex(c => c.id === code.id || (code.student && c.student === code.student));
                                if (targetIdx !== -1) {
                                  newCodes[targetIdx].name = e.target.value;
                                  setGeneratedCodes(newCodes);
                                }
                              }}
                              className="flex-1 bg-transparent text-white text-xs font-black text-right border-b border-transparent focus:border-blue-500 outline-none truncate px-1 py-1"
                              placeholder="اسم الطالب..."
                            />
                          </div>

                          {/* Hidden desktop grade selector */}
                          <div className="flex items-center justify-between lg:justify-center">
                            <span className="lg:hidden text-[10px] text-white/30 font-bold">الصف:</span>
                            <select
                              value={code.grade || ''}
                              onChange={(e) => {
                                const newGrade = e.target.value;
                                const newCodes = [...generatedCodes];
                                const targetIdx = newCodes.findIndex(c => c.id === code.id || (code.student && c.student === code.student));
                                if (targetIdx !== -1) {
                                  newCodes[targetIdx].grade = newGrade;
                                  
                                  // Recalculate financial info for this student based on new grade
                                  const byGrade = schoolSettings?.tuitionFeesByGrade || {};
                                  const baseFee = (newGrade && byGrade[newGrade] !== undefined) ? Number(byGrade[newGrade]) : tuitionFee;
                                  const currentRate = newCodes[targetIdx].discountRate || discountRates[newCodes[targetIdx].discountType || 'NONE'] || 0;
                                  const amount = (baseFee * currentRate) / 100;
                                  const total = baseFee - amount;
                                  newCodes[targetIdx].discountAmount = amount;
                                  newCodes[targetIdx].totalAmount = total;

                                  // Update the finance object immediately so the UI (like tooltips or logs) is accurate
                                  const discountFactor = (100 - currentRate) / 100; const installmentSum = (installmentPlan || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0); const gradeProportion = installmentSum > 0 ? (baseFee / installmentSum) : 1; const combinedFactor = gradeProportion * discountFactor;
                                  const studentInstallments = installmentPlan.map((inst, idx) => ({
                                    ...inst,
                                    id: inst.id || `inst_${idx}`,
                                    amount: Math.round((inst.amount || 0) * combinedFactor),
                                    paid: false
                                  }));

                                  newCodes[targetIdx].finance = {
                                    installments: studentInstallments,
                                    totalTuition: total,
                                    paidAmount: 0,
                                    remainingAmount: total,
                                    lastUpdated: new Date().toISOString()
                                  };

                                  const prefix = getPrefixForGrade(newGrade);
                                  if (code.student) {
                                    const parts = code.student.split('-');
                                    parts[0] = prefix;
                                    newCodes[targetIdx].student = parts.join('-');
                                  }
                                  setGeneratedCodes(newCodes);
                                }
                              }}
                              className="h-8 bg-black/40 text-white text-[11px] font-bold outline-none rounded-lg px-2 text-center cursor-pointer border border-white/5"
                            >
                              {availableGrades.map(g => <option key={g} value={g} className="bg-[#101935]">{g}</option>)}
                            </select>
                          </div>

                          {/* Student Code + Quick Copy */}
                          <div className="flex items-center justify-between lg:justify-center">
                            <span className="lg:hidden text-[10px] text-white/30 font-bold">كود الطالب:</span>
                            <button
                              onClick={() => handleQuickCopy(code.student, studentKey)}
                              className="flex items-center gap-1.5 bg-black/50 hover:bg-[#FFD600]/10 border border-white/10 hover:border-[#FFD600]/30 px-2.5 py-1.5 rounded-lg transition-all group/btn"
                              title="انقر لنسخ كود الطالب فورياً"
                            >
                              <span className="text-[#FFD600] font-mono text-[11px] font-black tracking-wider">{code.student || '---'}</span>
                              {isStuCopied ? (
                                <Check size={12} className="text-emerald-400 animate-bounce" />
                              ) : (
                                <Copy size={12} className="text-white/30 group-hover/btn:text-[#FFD600] transition-colors" />
                              )}
                            </button>
                          </div>

                          {/* Parent Code + Quick Copy */}
                          <div className="flex items-center justify-between lg:justify-center">
                            <span className="lg:hidden text-[10px] text-white/30 font-bold">كود ولي الأمر:</span>
                            <button
                              onClick={() => handleQuickCopy(code.parent, parentKey)}
                              className="flex items-center gap-1.5 bg-black/50 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 px-2.5 py-1.5 rounded-lg transition-all group/btn"
                              title="انقر لنسخ كود ولي الأمر فورياً"
                            >
                              <span className="text-cyan-400 font-mono text-[11px] font-black tracking-wider">{code.parent || '---'}</span>
                              {isParCopied ? (
                                <Check size={12} className="text-emerald-400 animate-bounce" />
                              ) : (
                                <Copy size={12} className="text-white/30 group-hover/btn:text-cyan-400 transition-colors" />
                              )}
                            </button>
                          </div>

                          {/* Discount selection */}
                          <div className="flex items-center justify-between lg:justify-center">
                            <span className="lg:hidden text-[10px] text-white/30 font-bold">الخصم:</span>
                            <select
                              value={code.discountType || 'NONE'}
                              onChange={(e) => {
                                const type = e.target.value;
                                const rate = discountRates[type] || 0;
                                
                                const byGrade = schoolSettings?.tuitionFeesByGrade || {};
                                const baseFee = (code.grade && byGrade[code.grade] !== undefined) ? Number(byGrade[code.grade]) : tuitionFee;
                                
                                const amount = (baseFee * rate) / 100;
                                const total = baseFee - amount;
                                const newCodes = [...generatedCodes];
                                const targetIdx = newCodes.findIndex(c => c.id === code.id || (code.student && c.student === code.student));
                                if (targetIdx !== -1) {
                                  newCodes[targetIdx].discountType = type;
                                  newCodes[targetIdx].discountAmount = amount;
                                  newCodes[targetIdx].totalAmount = total;
                                  newCodes[targetIdx].discountRate = rate;

                                  // Update the finance object immediately
                                  const discountFactor = (100 - rate) / 100; const installmentSum = (installmentPlan || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0); const gradeProportion = installmentSum > 0 ? (baseFee / installmentSum) : 1; const combinedFactor = gradeProportion * discountFactor;
                                  const studentInstallments = installmentPlan.map((inst, idx) => ({
                                    ...inst,
                                    id: inst.id || `inst_${idx}`,
                                    amount: Math.round((inst.amount || 0) * combinedFactor),
                                    paid: false
                                  }));

                                  newCodes[targetIdx].finance = {
                                    installments: studentInstallments,
                                    totalTuition: total,
                                    paidAmount: 0,
                                    remainingAmount: total,
                                    lastUpdated: new Date().toISOString()
                                  };

                                  setGeneratedCodes(newCodes);
                                }
                              }}
                              className="h-8 bg-black/40 text-white text-[10px] font-bold outline-none rounded-lg px-2 text-center cursor-pointer border border-white/5"
                            >
                              <option value="NONE" className="bg-[#101935]">بدون خصم (0%)</option>
                              {Object.entries(discountLabels).filter(([t]) => t !== 'NONE').map(([t, l]) => (
                                <option key={t} value={t} className="bg-[#101935]">{l} ({discountRates[t]}%)</option>
                              ))}
                            </select>
                          </div>

                          {/* Net Tuition Calculation */}
                          <div className="flex items-center justify-between lg:justify-center">
                            <span className="lg:hidden text-[10px] text-white/30 font-bold">الصافي:</span>
                            <span className="text-emerald-400 font-mono font-black text-xs">
                              {(() => {
                                if (code.totalAmount !== undefined) return code.totalAmount.toLocaleString();
                                const byGrade = schoolSettings?.tuitionFeesByGrade || {};
                                const baseFee = (code.grade && byGrade[code.grade] !== undefined) ? Number(byGrade[code.grade]) : tuitionFee;
                                return (baseFee - ((baseFee * (code.discountRate || 0)) / 100)).toLocaleString();
                              })()}
                              <span className="text-[9px] opacity-60 mr-1">د.ع</span>
                            </span>
                          </div>

                          {/* Delete Student Button */}
                          <div className="flex items-center justify-end lg:justify-center">
                            <button 
                              onClick={() => setConfirmDelete({ id: code.id })}
                              className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all border border-rose-500/20"
                              title="حذف الطالب من القائمة"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save & Export Controls Strip */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950/40 via-[#101935] to-indigo-950/40 rounded-2xl border border-purple-500/20 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input 
                      type="text" 
                      value={currentListName}
                      onChange={(e) => setCurrentListName(e.target.value)}
                      placeholder="اسم القائمة للأرشيف (مثال: أول متوسط - شعبة أ)"
                      className="flex-1 h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white text-sm outline-none focus:border-purple-500 transition-all font-black text-center placeholder:text-white/20"
                    />

                    <button 
                      disabled={isSaving}
                      onClick={async () => {
                        if (!currentListName.trim()) {
                          showToast('يرجى كتابة اسم للقائمة أولاً', 'error');
                          return;
                        }
                        
                         // Apply automatic finance plan to all students in the list before saving
                         const studentsWithFinance = generatedCodes.map(stu => {
                           const byGrade = schoolSettings?.tuitionFeesByGrade || {};
                           const baseFee = (stu.grade && byGrade[stu.grade] !== undefined) ? Number(byGrade[stu.grade]) : tuitionFee;
                           const rate = stu.discountRate || discountRates[stu.discountType || 'NONE'] || 0;
                           const discountAmount = Math.round((baseFee * rate) / 100);
                           const totalAmount = baseFee - discountAmount;
                           
                           // Factor for scaling installments to match grade tuition and student discount
                           const discountFactor = (100 - rate) / 100;
                           const installmentSum = (installmentPlan || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
                           const gradeProportion = installmentSum > 0 ? (baseFee / installmentSum) : 1;
                           const combinedFactor = gradeProportion * discountFactor;
                           
                           const studentInstallments = (installmentPlan || []).map((inst, idx) => ({
                             ...inst,
                             id: inst.id || `inst_${idx}`,
                             amount: Math.round((Number(inst.amount) || 0) * combinedFactor),
                             paid: false
                           }));

                           return {
                             ...stu,
                             totalAmount: totalAmount,
                             discountAmount: discountAmount,
                             discountRate: rate,
                             finance: {
                               installments: studentInstallments,
                               totalTuition: totalAmount,
                               paidAmount: 0,
                               remainingAmount: totalAmount,
                               lastUpdated: new Date().toISOString()
                             }
                           };
                         });

                        const newList = {
                          id: listToEdit ? listToEdit.id : Date.now().toString(),
                          name: currentListName,
                          school: currentListSchool || schoolName,
                          date: listToEdit ? listToEdit.date : new Date().toLocaleDateString('ar-IQ'),
                          students: studentsWithFinance
                        };
                        
                        // 1. Optimistically update local savedLists immediately!
                        if (setSavedLists) {
                          setSavedLists(prev => {
                            const existingIdx = prev.findIndex(l => l.id === newList.id);
                            if (existingIdx >= 0) {
                              const copy = [...prev];
                              copy[existingIdx] = newList;
                              return copy;
                            }
                            return [newList, ...prev];
                          });
                        }

                        const wasEditing = !!listToEdit;
                        setCurrentListName('');
                        setGeneratedCodes([]);
                        setIsAddingStudent(false);
                        if (setListToEdit) setListToEdit(null);

                        showToast(wasEditing ? 'تم تحديث القائمة بنجاح' : 'تم الحفظ في الأرشيف بنجاح', 'success');

                        try {
                          await onSaveList(newList);
                          logActivity({
                            action: wasEditing ? 'تحديث قائمة طلاب' : 'حفظ قائمة طلاب',
                            details: `${wasEditing ? 'تم تحديث قائمة الطلاب المؤرشفة' : 'تم حفظ قائمة طلاب جديدة للأرشيف'}: ${newList.name}`,
                            targetId: newList.id,
                            targetType: 'academic_list',
                            targetName: newList.name
                          });
                        } catch (err: any) {
                          console.error('Batch save error:', err);
                          showToast(`حدث خطأ أثناء مزامنة القائمة مع الخادم: ${err?.message || ''}`, 'error');
                        }
                      }}
                      className={`h-12 px-6 rounded-xl text-white font-black text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                        isSaving ? 'bg-purple-800 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 shadow-purple-900/30'
                      }`}
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>{isSaving ? 'جاري الحفظ...' : (listToEdit ? 'تحديث التغييرات' : 'حفظ للأرشيف والمزامنة')}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleExport}
                        className="h-10 px-4 bg-emerald-600/90 hover:bg-emerald-600 rounded-xl text-white font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2"
                      >
                        <FileSpreadsheet size={15} />
                        <span>تصدير إكسل</span>
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-xs active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Printer size={15} />
                        <span>طباعة البطاقات</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        setGeneratedCodes([]);
                        setIsAddingStudent(false);
                        setBulkStudents([{ id: crypto.randomUUID(), name: '', gender: adminBranch === 'girls' ? 'female' : 'male', grade: selectedGrade }]);
                        if (listToEdit && setListToEdit) setListToEdit(null);
                      }}
                      className="text-white/40 hover:text-rose-400 font-bold text-xs transition-colors py-2 px-3"
                    >
                      تجاهل وإغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete === null || !confirmDelete.id) return;
          const previousCodes = [...generatedCodes];
          const newCodes = generatedCodes.filter((c) => c.id !== confirmDelete.id);
          setGeneratedCodes([...newCodes]);
          try {
            showToast('تم الحذف بنجاح', 'success');
            logActivity({
              action: 'حذف طالب من مسودة',
              details: `تم حذف طالب من مسودة الأكواد الحالية`,
              targetType: 'codes_generation'
            });
          } catch (e: any) {
            setGeneratedCodes(previousCodes);
            console.error('Delete Error in CodesSection:', e);
          } finally {
            setConfirmDelete(null);
          }
        }}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الطالب من القائمة؟"
      />

      {/* Admin Observer Code Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <div className="fixed inset-0 bg-[#050A18]/85 backdrop-blur-md z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div 
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-[#0e162c] border border-[#FFD600]/30 rounded-3xl p-6 max-w-sm w-full relative shadow-[0_0_50px_rgba(255,214,0,0.15)] text-center"
            >
              <button 
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                title="إغلاق"
              >
                <X size={16} />
              </button>

              <div className="w-16 h-16 bg-[#FFD600]/10 rounded-2xl flex items-center justify-center text-[#FFD600] mx-auto mb-4 border border-[#FFD600]/30 shadow-[0_0_25px_rgba(255,214,0,0.2)]">
                <ShieldCheck size={32} />
              </div>

              <h2 className="text-xl font-black text-white mb-1.5">كود مراقب إداري رسمي</h2>
              <p className="text-xs text-white/60 mb-5 bg-white/5 p-3 rounded-2xl border border-white/5 leading-relaxed">
                يمنح هذا الرمز صلاحية الدخول لمنصة الطلاب لمتابعة المنشورات والأنشطة كإدارة معتمدة.
              </p>

              <div className="bg-black/50 border border-[#FFD600]/20 rounded-2xl p-4 mb-5 flex items-center justify-between gap-2">
                <span className="text-xl font-mono font-black text-[#FFD600] tracking-widest break-all" dir="ltr">{adminObserverCode}</span>
                <button 
                  onClick={async () => {
                    await copyToClipboard(adminObserverCode);
                    showToast('تم نسخ الكود بنجاح', 'success');
                  }}
                  className="w-10 h-10 shrink-0 bg-[#FFD600]/10 hover:bg-[#FFD600]/20 text-[#FFD600] rounded-xl flex items-center justify-center transition-colors"
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
                className="w-full h-12 bg-[#FFD600] hover:bg-amber-400 text-black font-black rounded-xl shadow-lg shadow-[#FFD600]/20 transition-all"
              >
                نسخ الكود وإغلاق
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
