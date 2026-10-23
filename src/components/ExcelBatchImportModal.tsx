import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, X, Sparkles, 
  Download, Layers, Users, RefreshCw, ArrowRight, ShieldCheck 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportToExcel } from '../lib/exportUtils';
import { normalizeGradeName, generateStudentCodes } from '../utils/studentUtils';

export interface ParsedBatchStudent {
  id: string;
  name: string;
  grade: string;
  batchName: string;
  address?: string;
  discountType?: string;
  discountRate?: number;
  discountAmount?: number;
  totalAmount?: number;
  gender: 'male' | 'female';
}

export interface ParsedBatchGroup {
  batchName: string;
  grade: string;
  students: ParsedBatchStudent[];
}

interface ExcelBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  adminBranch: 'boys' | 'girls';
  availableGrades: string[];
  tuitionFee: number;
  discountRates: Record<string, number>;
  installmentPlan: any[];
  schoolSettings?: any;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onImportToEditor: (listName: string, grade: string, students: any[]) => void;
  onSaveBatchesDirectly: (batches: any[]) => Promise<void>;
}

export const ExcelBatchImportModal: React.FC<ExcelBatchImportModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  adminBranch,
  availableGrades,
  tuitionFee,
  discountRates,
  installmentPlan,
  schoolSettings,
  showToast,
  onImportToEditor,
  onSaveBatchesDirectly
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedGroups, setParsedGroups] = useState<ParsedBatchGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSavingDirectly, setIsSavingDirectly] = useState<boolean>(false);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(0);

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        'اسم الطالب': 'حيدر محمد علي',
        'الصف': availableGrades[0] || 'الأول المتوسط',
        'الشعبة / اسم الوجبة': `${availableGrades[0] || 'الأول المتوسط'} - شعبة أ`,
        'السكن': 'بغداد - الكرادة',
        'نوع الخصم': 'بدون خصم'
      },
      {
        'اسم الطالب': 'علي حسين كاظم',
        'الصف': availableGrades[0] || 'الأول المتوسط',
        'الشعبة / اسم الوجبة': `${availableGrades[0] || 'الأول المتوسط'} - شعبة أ`,
        'السكن': 'بغداد - المنصور',
        'نوع الخصم': 'أيتام'
      },
      {
        'اسم الطالب': 'حسن جاسم فاضل',
        'الصف': availableGrades[1] || 'الثاني المتوسط',
        'الشعبة / اسم الوجبة': `${availableGrades[1] || 'الثاني المتوسط'} - شعبة ب`,
        'السكن': 'بغداد - الدورة',
        'نوع الخصم': 'خصم خاص'
      }
    ];

    exportToExcel(sampleData, `نموذج_رفع_وجبات_الطلاب_${schoolName}.xlsx`, 'نموذج الوجبات');
    showToast('تم تنزيل نموذج الإكسل المعتمد بنجاح', 'success');
  };

  // Helper to detect column value by keywords
  const getColValue = (row: any, keywords: string[]): string => {
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      for (const kw of keywords) {
        if (cleanKey.includes(kw.toLowerCase())) {
          return String(row[key] || '').trim();
        }
      }
    }
    return '';
  };

  // Process Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          showToast('الملف المرفوع فارغ أو لا يحتوي على صفوف بيانات', 'error');
          setIsProcessing(false);
          return;
        }

        const groupsMap = new Map<string, { grade: string; students: ParsedBatchStudent[] }>();

        rawJson.forEach((row, index) => {
          const name = getColValue(row, ['اسم الطالب', 'اسم', 'طالب', 'student', 'name']);
          if (!name) return; // Skip empty rows

          const rawGrade = getColValue(row, ['الصف', 'المرحلة', 'grade', 'class']);
          const detectedGrade = normalizeGradeName(rawGrade) || availableGrades[0] || 'الأول المتوسط';

          const batchName = getColValue(row, ['الشعبة', 'الوجبة', 'اسم الوجبة', 'القائمة', 'section', 'batch']) || `${detectedGrade} - وجبة جديدة`;
          const address = getColValue(row, ['السكن', 'العنوان', 'المنطقة', 'address', 'location']);
          const discountStr = getColValue(row, ['الخصم', 'نوع الخصم', 'النسبة', 'discount']);

          let discountType = 'NONE';
          if (discountStr) {
            if (discountStr.includes('يتيم') || discountStr.includes('أيتام') || discountStr.includes('ايتام')) discountType = 'ORPHAN';
            else if (discountStr.includes('أخوة') || discountStr.includes('اخوة') || discountStr.includes('أشقاء')) discountType = 'SIBLINGS';
            else if (discountStr.includes('شهداء') || discountStr.includes('شهيد')) discountType = 'MARTYRS';
            else if (discountStr.includes('كادر') || discountStr.includes('معلم')) discountType = 'STAFF';
            else if (discountStr.includes('خاص') || discountStr.includes('مخصص')) discountType = 'SPECIAL';
          }

          const studentObj: ParsedBatchStudent = {
            id: crypto.randomUUID(),
            name,
            grade: detectedGrade,
            batchName,
            address,
            discountType,
            gender: adminBranch === 'girls' ? 'female' : 'male'
          };

          const groupKey = `${batchName}__${detectedGrade}`;
          if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, { grade: detectedGrade, students: [] });
          }
          groupsMap.get(groupKey)!.students.push(studentObj);
        });

        const groupsList: ParsedBatchGroup[] = Array.from(groupsMap.entries()).map(([key, data]) => {
          const [batchName] = key.split('__');
          return {
            batchName,
            grade: data.grade,
            students: data.students
          };
        });

        if (groupsList.length === 0) {
          showToast('لم يتم العثور على أي بيانات طلاب صحيحة في ملف الإكسل', 'error');
        } else {
          setParsedGroups(groupsList);
          setSelectedGroupIdx(0);
          showToast(`تم التعرف على ${groupsList.reduce((sum, g) => sum + g.students.length, 0)} طالب موزعين على ${groupsList.length} وجبة!`, 'success');
        }
      } catch (err: any) {
        console.error('Error parsing excel:', err);
        showToast('حدث خطأ أثناء قراءة ملف الإكسل: ' + (err?.message || ''), 'error');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Apply single selected batch to editor form
  const handleApplyToEditor = (group: ParsedBatchGroup) => {
    onImportToEditor(group.batchName, group.grade, group.students);
    showToast(`تم استيراد ${group.students.length} طالب إلى المحرر في وجبة "${group.batchName}"`, 'success');
    onClose();
  };

  // Automatically Generate and Save All Batches to Database Directly
  const handleSaveAllBatchesDirectly = async () => {
    if (parsedGroups.length === 0) return;
    setIsSavingDirectly(true);

    try {
      const generatedBatches = parsedGroups.map((group) => {
        const freshCodes = generateStudentCodes(
          group.students,
          adminBranch,
          tuitionFee,
          discountRates,
          schoolName,
          installmentPlan,
          schoolSettings?.tuitionFeesByGrade
        );

        return {
          id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
          name: group.batchName,
          grade: group.grade,
          school: schoolName,
          adminBranch,
          date: new Date().toLocaleDateString('ar-IQ'),
          students: freshCodes
        };
      });

      await onSaveBatchesDirectly(generatedBatches);
      showToast(`تم إنشاء وتفعيل ${generatedBatches.length} وجبة تحوي ${generatedBatches.reduce((acc, b) => acc + b.students.length, 0)} طالب بنجاح!`, 'success');
      onClose();
    } catch (err: any) {
      console.error('Save all batches error:', err);
      showToast('حدث خطأ أثناء حفظ الوجبات: ' + (err?.message || ''), 'error');
    } finally {
      setIsSavingDirectly(false);
    }
  };

  if (!isOpen) return null;

  const totalStudentsCount = parsedGroups.reduce((sum, g) => sum + g.students.length, 0);
  const activeGroup = parsedGroups[selectedGroupIdx];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3500] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="w-full max-w-4xl bg-[#0b1329] border border-blue-500/30 rounded-[2.5rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden text-right my-auto"
          dir="rtl"
        >
          {/* Top Gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">توليد وإضافة الوجبات عبر ملف Excel</h3>
                <p className="text-xs text-white/50 font-bold mt-0.5">
                  قم برفع ملف إكسل يحتوي أسماء الطلاب وصفوفهم وشعبهم لتوليد الوجبات تلقائياً
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white/60 flex items-center justify-center transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="py-5 space-y-6">
            {/* Step 1: Template Download & Upload Dropzone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Template Download Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-purple-400 font-black text-xs">
                    <Download size={16} />
                    <span>تحميل القالب المعتمد</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed font-bold">
                    حمل نموذج الإكسل الجاهز لتعبئة أسماء الطلاب وصفوفهم وشعبهم بالصيغة الصحيحة.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Download size={15} />
                  <span>تنزيل نموذج إكسل جاهز</span>
                </button>
              </div>

              {/* Excel Dropzone */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-white/[0.02] border-2 border-dashed border-blue-500/30 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-center space-y-3 relative group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>

                <div>
                  <h4 className="text-sm font-black text-white">
                    {fileName ? `الملف المحدد: ${fileName}` : 'اختر ملف إكسل أو اسحبه إلى هنا'}
                  </h4>
                  <p className="text-[11px] text-white/40 font-bold mt-0.5">
                    يدعم ملفات XLSX, XLS, CSV التي تحتوي الأعمدة: (اسم الطالب، الصف، الشعبة)
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>{fileName ? 'تغيير الملف' : 'استعراض ملف الإكسل'}</span>
                </button>
              </div>
            </div>

            {/* Step 2: Parsed Results & Batches Preview */}
            {parsedGroups.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-300 pt-2 border-t border-white/10">
                {/* Stats Summary Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-black">
                    <CheckCircle2 size={18} />
                    <span>تم تحليل الملف بنجاح! تم رصد <strong>{totalStudentsCount}</strong> طالب موزعين على <strong>{parsedGroups.length}</strong> وجبة/شعبة.</span>
                  </div>

                  <button
                    onClick={handleSaveAllBatchesDirectly}
                    disabled={isSavingDirectly}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-black font-black text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
                  >
                    {isSavingDirectly ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    <span>توليد وتفعيل كافّة الوجبات فوراً ({parsedGroups.length} وجبات)</span>
                  </button>
                </div>

                {/* Batches Tabs / Cards Selector */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {parsedGroups.map((group, idx) => {
                    const isSelected = selectedGroupIdx === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedGroupIdx(idx)}
                        className={`px-4 py-3 rounded-2xl border text-right transition-all shrink-0 min-w-[180px] ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/30 scale-[1.02]'
                            : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-xs truncate">{group.batchName}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'}`}>
                            {group.students.length} طالب
                          </span>
                        </div>
                        <span className="text-[10px] opacity-75 font-bold block mt-1">
                          الصف: {group.grade}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Batch Details */}
                {activeGroup && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <Layers size={16} className="text-blue-400" />
                          <span>معاينة وجبة: <strong className="text-blue-400">{activeGroup.batchName}</strong></span>
                        </h4>
                        <p className="text-[11px] text-white/50 font-bold mt-0.5">
                          الصف الدراسي: {activeGroup.grade} • الإجمالي: {activeGroup.students.length} طالب
                        </p>
                      </div>

                      <button
                        onClick={() => handleApplyToEditor(activeGroup)}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <span>استيراد هذه الوجبة إلى المحرر فقط</span>
                        <ArrowRight size={14} className="rotate-180" />
                      </button>
                    </div>

                    {/* Students List Preview Table */}
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                      {activeGroup.students.map((st, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-white/5 text-white/40 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-black text-white">{st.name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            {st.address && (
                              <span className="text-amber-300/80 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                📍 {st.address}
                              </span>
                            )}
                            <span className="text-blue-300 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                              {st.discountType && st.discountType !== 'NONE' ? `خصم: ${st.discountType}` : 'بدون خصم'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
            <span className="text-white/40 font-bold">
              💡 يرجى التأكد من مطابقة أسماء الصفوف في ملف الإكسل لقائمة المراحل المعتمدة.
            </span>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black transition-all"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
