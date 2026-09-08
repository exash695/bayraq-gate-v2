import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Database, Printer, FileSpreadsheet, Edit3, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getPrefixForGrade } from '../utils/studentUtils';

interface ArchiveDetailViewProps {
  selectedArchiveList: any;
  setSelectedArchiveList: (list: any | null) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  schoolName: string;
  onEdit: (list: any) => void;
  discountLabels: Record<string, string>;
  tuitionFee: number;
  discountRates: Record<string, number>;
  onUpdateList?: (list: any) => Promise<void> | void;
  setSavedLists?: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ArchiveDetailView: React.FC<ArchiveDetailViewProps> = ({
  selectedArchiveList,
  setSelectedArchiveList,
  showToast,
  schoolName,
  onEdit,
  discountLabels,
  tuitionFee,
  discountRates,
  onUpdateList,
  setSavedLists
}) => {
  const [isFixingCodes, setIsFixingCodes] = useState(false);

  if (!selectedArchiveList) return null;

  const listGrade = selectedArchiveList.grade || (selectedArchiveList.students && selectedArchiveList.students[0]?.grade) || selectedArchiveList.name;
  const expectedPrefix = getPrefixForGrade(listGrade);

  const hasMisencodedCodes = (selectedArchiveList.students || []).some((s: any) => {
    const code = (s.student || s.code || '').toUpperCase();
    return code.startsWith('STU-') && expectedPrefix !== 'STU';
  });

  const handleFixCodes = async () => {
    if (!expectedPrefix || expectedPrefix === 'STU') {
      showToast('تعذر تحديد الصف أو البادئة الصحيحة', 'error');
      return;
    }
    setIsFixingCodes(true);
    try {
      const fixedStudents = (selectedArchiveList.students || []).map((s: any) => {
        let studentCode = s.student || s.code || '';
        let parentCode = s.parent || s.parentCode || '';
        if (studentCode) {
          const parts = studentCode.split('-');
          if (parts[0].toUpperCase() === 'STU') {
            parts[0] = expectedPrefix;
            studentCode = parts.join('-');
          }
        }
        if (parentCode) {
          parentCode = parentCode.toUpperCase();
        }
        return {
          ...s,
          student: studentCode,
          code: studentCode,
          parent: parentCode,
          parentCode: parentCode
        };
      });

      const updatedList = {
        ...selectedArchiveList,
        students: fixedStudents
      };

      // Optimistically update local selected list
      setSelectedArchiveList(updatedList);

      if (setSavedLists) {
        setSavedLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));
      }

      if (onUpdateList) {
        await onUpdateList(updatedList);
      }

      showToast(`تم تصحيح تشفير الأكواد إلى (${expectedPrefix}) بنجاح ومزامنتها`, 'success');
    } catch (e: any) {
      console.error(e);
      showToast('حدث خطأ أثناء تصحيح الأكواد: ' + (e.message || ''), 'error');
    } finally {
      setIsFixingCodes(false);
    }
  };

  const calculateTotal = (stu: any) => {
    if (stu.totalAmount && stu.totalAmount > 0) return stu.totalAmount;
    const rate = discountRates[stu.discountType] || 0;
    return tuitionFee - (tuitionFee * rate / 100);
  };

  const handleExportExcel = () => {
    const headers = ['اسم الطالب', 'كود الطالب', 'كود ولي الأمر', 'نوع الخصم', 'الاشتراك المستحق'];
    const rows = selectedArchiveList.students.map((code: any) => {
      const total = calculateTotal(code);
      return [
        `"${code.name}"`,
        `"${code.student}"`,
        `"${code.parent}"`,
        `"${discountLabels[code.discountType] || code.discountType || 'بدون'}"`,
        `"${total?.toLocaleString() || 0} د.ع"`
      ];
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `List_${selectedArchiveList.name}_${new Date().getTime()}.csv`;
    link.click();
    showToast('تم تصدير ملف Excel بنجاح');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rowsHtml = selectedArchiveList.students.map((code: any) => `
      <div style="border: 2px solid #333; padding: 15px; margin: 10px; border-radius: 10px; display: inline-block; width: 250px; direction: rtl; font-family: sans-serif; vertical-align: top;">
        <div style="font-weight: bold; border-bottom: 2px solid #FFD600; margin-bottom: 10px; padding-bottom: 5px; color: #101935; display: flex; justify-content: space-between; align-items: center;">
          <span>بطاقة الطالب الذكية</span>
          <span style="font-size: 10px; color: #666;">بوابة بيرق</span>
        </div>
        <div style="margin-bottom: 5px;"><strong>المدرسة:</strong> ${schoolName}</div>
        <div style="margin-bottom: 5px;"><strong>الصف:</strong> ${code.grade || 'غير محدد'}</div>
        <div style="margin-bottom: 5px;"><strong>الاسم:</strong> ${code.name}</div>
        <div style="margin-bottom: 5px;"><strong>كود الطالب:</strong> <span style="color: #d32f2f; font-weight: bold; font-family: monospace;">${code.student}</span></div>
        <div style="margin-bottom: 5px;"><strong>كود ولي الأمر:</strong> <span style="color: #1976d2; font-weight: bold; font-family: monospace;">${code.parent}</span></div>
        <div style="font-size: 10px; color: #666; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 5px;">يرجى الاحتفاظ بهذه الأكواد للدخول للمنصة</div>
      </div>
    `).join('');
    printWindow.document.write(`<html><head><title>Print List - ${selectedArchiveList.name}</title></head><body>${rowsHtml}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedArchiveList(null)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black transition-all group font-black text-xs shadow-md active:scale-95 cursor-pointer"
            title="الرجوع لقوائم الوجبات"
          >
            <ArrowRight size={18} className="transition-transform group-hover:-translate-x-1" />
            <span>رجوع لقوائم الوجبات</span>
          </button>
          <div>
            <h3 className="text-white font-black text-lg">{selectedArchiveList.name}</h3>
            <p className="text-white/20 text-[10px]">{selectedArchiveList.date} • {selectedArchiveList.students.length} طالباً</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {hasMisencodedCodes && (
            <button 
              onClick={handleFixCodes}
              disabled={isFixingCodes}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl hover:bg-amber-500 hover:text-black transition-all text-xs font-black shadow-lg animate-pulse"
              title={`تصحيح تشفير الأكواد إلى ${expectedPrefix}`}
            >
              <RefreshCw size={16} className={isFixingCodes ? 'animate-spin' : ''} />
              <span>{isFixingCodes ? 'جاري التصحيح...' : `إصلاح تشفير ${expectedPrefix}`}</span>
            </button>
          )}
          <button 
            onClick={() => onEdit(selectedArchiveList)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs font-black"
          >
            <Edit3 size={16} />
            تعديل القائمة
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500 hover:text-white transition-all text-xs font-black"
          >
            <Printer size={16} />
            طباعة ورقية
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all text-xs font-black"
          >
            <FileSpreadsheet size={16} />
            تنزيل إكسل
          </button>
        </div>
      </div>

      {hasMisencodedCodes && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" size={22} />
            <div>
              <div className="text-amber-300 font-bold text-xs">تنبيه تشفير الأكواد القديم</div>
              <div className="text-white/80 text-[11px] mt-0.5">
                تحتوي هذه القائمة على أكواد تبدأ بـ <span className="text-amber-400 font-mono font-bold">STU</span> بدلاً من بادئة الصف المعتمدة <span className="text-emerald-400 font-mono font-bold">{expectedPrefix}</span>.
              </div>
            </div>
          </div>
          <button
            onClick={handleFixCodes}
            disabled={isFixingCodes}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw size={14} className={isFixingCodes ? 'animate-spin' : ''} />
            <span>{isFixingCodes ? 'جاري التصحيح والمزامنة...' : `تصحيح الأكواد إلى ${expectedPrefix} وحفظها`}</span>
          </button>
        </div>
      )}

      <div className="bg-[#101935] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr] gap-2 px-6 py-4 bg-white/5 text-[10px] font-black text-white/40 text-center border-b border-white/5">
          <span className="text-right">اسم الطالب</span>
          <span>كود الطالب</span>
          <span>كود ولي الأمر</span>
          <span>نوع الخصم</span>
          <span>الاشتراك الصافي</span>
        </div>
        <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto no-scrollbar">
          {(selectedArchiveList.students || []).slice().sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'ar')).map((stu: any, i: number) => {
            const displayAmount = calculateTotal(stu);
            return (
              <div key={`${stu.student}_${i}_archived`} className="grid grid-cols-[2fr_1.2fr_1.2fr_1.2fr_1.2fr] gap-2 items-center p-4 hover:bg-white/[0.02] transition-colors group text-center">
                <span className="text-white text-xs font-bold truncate text-right group-hover:text-amber-400 transition-colors tracking-tight">{stu.name}</span>
                <span className="text-[#FFD600] font-mono text-[11px] font-bold bg-black/30 py-2 rounded-xl text-center border border-white/5 shadow-inner uppercase tracking-wider">{stu.student}</span>
                <span className="text-blue-400 font-mono text-[11px] font-bold bg-black/30 py-2 rounded-xl text-center border border-white/5 shadow-inner uppercase tracking-wider">{stu.parent}</span>
                <span className="text-white/60 text-[10px] font-black">{discountLabels[stu.discountType] || stu.discountType || 'بدون'}</span>
                <span className="text-emerald-400 font-bold text-xs whitespace-nowrap">
                   {displayAmount?.toLocaleString() || '0'} <span className="text-[10px] text-white/20">د.ع</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <button 
        onClick={() => setSelectedArchiveList(null)}
        className="w-full h-14 bg-white/5 rounded-3xl text-white/40 font-black text-xs border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
      >
        إغلاق القائمة والعودة للأرشيف
      </button>
    </div>
  );
};
