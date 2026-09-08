import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Search, 
  CheckCircle2, 
  X, 
  Printer, 
  BookX, 
  BookCheck, 
  PenLine, 
  ChevronLeft, 
  RotateCcw,
  Check,
  AlertCircle,
  Sparkles,
  Users,
  Layers
} from 'lucide-react';

interface BookDistributionManagerProps {
  savedLists: any[];
  onUpdateList: (list: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const COMMON_NOTE_PRESETS = [
  'نقص كيمياء',
  'نقص فيزياء',
  'نقص رياضيات',
  'نقص أحياء',
  'نقص انكليزي',
  'نقص عربي',
  'نقص إسلامية',
  'استلم كافة الكتب'
];

export const BookDistributionManager: React.FC<BookDistributionManagerProps> = ({ 
  savedLists, 
  onUpdateList, 
  showToast 
}) => {
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'delivered' | 'missing'>('all');
  const [editingNoteStudentId, setEditingNoteStudentId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Global overall stats across all lists
  const overallStats = useMemo(() => {
    let totalStudents = 0;
    let totalReceived = 0;

    (savedLists || []).forEach(list => {
      const studs = list.students || [];
      totalStudents += studs.length;
      totalReceived += studs.filter((s: any) => !!s.hasReceivedBooks).length;
    });

    const remaining = totalStudents - totalReceived;
    const percent = totalStudents > 0 ? Math.round((totalReceived / totalStudents) * 100) : 0;
    return { totalStudents, totalReceived, remaining, percent, totalLists: savedLists?.length || 0 };
  }, [savedLists]);

  // Stats for the active list
  const listStats = useMemo(() => {
    if (!selectedList) return null;
    const total = selectedList.students?.length || 0;
    const received = selectedList.students?.filter((s: any) => !!s.hasReceivedBooks)?.length || 0;
    const remaining = total - received;
    const percent = total > 0 ? Math.round((received / total) * 100) : 0;
    const allDelivered = total > 0 && received === total;
    return { total, received, remaining, percent, allDelivered };
  }, [selectedList]);

  // Filtered students in the active list
  const filteredStudents = useMemo(() => {
    if (!selectedList) return [];
    let students = selectedList.students || [];

    if (filterMode === 'delivered') {
      students = students.filter((s: any) => !!s.hasReceivedBooks);
    } else if (filterMode === 'missing') {
      students = students.filter((s: any) => !s.hasReceivedBooks);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      students = students.filter((s: any) => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.student && String(s.student).toLowerCase().includes(q)) ||
        (s.bookNotes && s.bookNotes.toLowerCase().includes(q))
      );
    }
    return students;
  }, [selectedList, searchQuery, filterMode]);

  // Super-fast Instant Toggle delivery status for a single student
  const handleToggleDelivery = useCallback((studentKey: string, currentStatus: boolean) => {
    if (!selectedList) return;
    
    const nextStatus = !currentStatus;
    const updatedStudents = (selectedList.students || []).map((s: any) => {
      const key = s.id || s.student || s.code;
      if (key === studentKey) {
        return { ...s, hasReceivedBooks: nextStatus };
      }
      return s;
    });

    const updatedList = { ...selectedList, students: updatedStudents };
    
    // Instant optimistic update
    setSelectedList(updatedList);
    showToast(nextStatus ? 'تم تسجيل الاستلام ⚡' : 'تم إلغاء الاستلام', 'success');

    // Async background persistence
    onUpdateList(updatedList).catch(err => {
      console.error('Error syncing delivery status:', err);
      showToast('فشل المزامنة مع السحابة', 'error');
    });
  }, [selectedList, onUpdateList, showToast]);

  // Super-fast Smooth Bulk Deliver All / Un-deliver All
  const handleDeliverAllToggle = useCallback(() => {
    if (!selectedList || !selectedList.students || selectedList.students.length === 0) return;

    const shouldDeliver = !listStats?.allDelivered;
    const updatedStudents = selectedList.students.map((s: any) => ({
      ...s,
      hasReceivedBooks: shouldDeliver
    }));

    const updatedList = { ...selectedList, students: updatedStudents };
    
    // 1. Instantaneous UI state update (0ms lag)
    setSelectedList(updatedList);
    
    // 2. Instant user feedback
    if (shouldDeliver) {
      showToast(`تم تسليم كافة كتب شعبة ${selectedList.name} (${selectedList.students.length} طالب) بنجاح ⚡`, 'success');
    } else {
      showToast(`تم إلغاء تسليم الكتب لشعبة ${selectedList.name}`, 'success');
    }

    // 3. Asynchronous non-blocking cloud persistence
    onUpdateList(updatedList).catch(err => {
      console.error('Error saving bulk delivery:', err);
      showToast('فشل المزامنة مع السحابة', 'error');
    });
  }, [selectedList, listStats, onUpdateList, showToast]);

  // Save student note (Instant & Smooth)
  const saveStudentNote = useCallback((studentKey: string, customNote?: string) => {
    if (!selectedList) return;
    const finalNote = customNote !== undefined ? customNote : noteText;

    const updatedStudents = (selectedList.students || []).map((s: any) => {
      const key = s.id || s.student || s.code;
      if (key === studentKey) {
        return { ...s, bookNotes: finalNote.trim() };
      }
      return s;
    });

    const updatedList = { ...selectedList, students: updatedStudents };
    setSelectedList(updatedList);
    setEditingNoteStudentId(null);
    setNoteText('');
    showToast('تم حفظ الملاحظة بنجاح', 'success');

    onUpdateList(updatedList).catch(err => {
      console.error('Error saving student note:', err);
      showToast('فشل حفظ الملاحظة بالسحابة', 'error');
    });
  }, [selectedList, noteText, onUpdateList, showToast]);

  // Export & Print Official Delivery Sheet
  const handleExportPrint = () => {
    if (!selectedList) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('يرجى السماح بالنوافذ المنبثقة للطباعة', 'error');
      return;
    }

    const schoolName = document.querySelector('.school-name-header')?.textContent || 'ثانوية أوائل غماس الأهلية للبنين';

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>سجل تسليم واستلام الكتب المدرسية - ${selectedList.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
            @page { size: A4 portrait; margin: 12mm; }
            * { box-sizing: border-box; }
            body { 
              font-family: 'Cairo', sans-serif; 
              margin: 0; 
              padding: 10px; 
              color: #0f172a; 
              background: #fff;
              -webkit-print-color-adjust: exact;
            }
            .header-table { width: 100%; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
            .school-name { font-size: 19px; font-weight: 900; color: #0f172a; }
            .doc-title { font-size: 15px; font-weight: 700; color: #334155; margin-top: 3px; }
            .meta-bar { 
              display: flex; 
              justify-content: space-between; 
              background: #f1f5f9; 
              padding: 8px 14px; 
              border-radius: 6px; 
              font-size: 11.5px; 
              font-weight: 700; 
              margin-bottom: 12px; 
              border: 1px solid #cbd5e1; 
            }
            table.data-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 4px; 
            }
            table.data-table th, table.data-table td { 
              border: 1px solid #94a3b8; 
              padding: 6px 5px; 
              text-align: center; 
              font-size: 10.5px; 
            }
            table.data-table th { 
              background-color: #e2e8f0; 
              font-weight: 900; 
              color: #0f172a; 
            }
            .delivered-badge { color: #16a34a; font-weight: 900; }
            .missing-badge { color: #dc2626; font-weight: 900; }
            .footer-section { 
              margin-top: 35px; 
              display: flex; 
              justify-content: space-between; 
              padding: 0 25px; 
              font-size: 11.5px; 
              font-weight: 700; 
            }
            .sign-box { text-align: center; line-height: 2.2; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="text-align: right; width: 33%;">
                <div style="font-size: 11px; font-weight: 700;">جمهورية العراق</div>
                <div style="font-size: 11px; font-weight: 700;">وزارة التربية</div>
                <div style="font-size: 11px; font-weight: 700;">المديرية العامة للتربية</div>
              </td>
              <td style="text-align: center; width: 34%;">
                <div class="school-name">${schoolName}</div>
                <div class="doc-title">استمارة جرد وتسليم الكتب المدرسية</div>
              </td>
              <td style="text-align: left; width: 33%;">
                <div style="font-size: 11px; font-weight: 700;">الشعبة: ${selectedList.name}</div>
                <div style="font-size: 11px; font-weight: 700;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>
              </td>
            </tr>
          </table>

          <div class="meta-bar">
            <span><strong>الشعبة:</strong> ${selectedList.name}</span>
            <span><strong>عدد الطلاب:</strong> ${listStats?.total}</span>
            <span><strong>المستلمين:</strong> ${listStats?.received}</span>
            <span><strong>النواقص:</strong> ${listStats?.remaining}</span>
            <span><strong>نسبة الإنجاز:</strong> ${listStats?.percent}%</span>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 35px;">ت</th>
                <th style="text-align: right; padding-right: 10px;">اسم الطالب الرباعي</th>
                <th style="width: 95px;">كود الطالب</th>
                <th style="width: 80px;">حالة الاستلام</th>
                <th>الملاحظات والنواقص</th>
                <th style="width: 120px;">توقيع الطالب</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedList.students || []).map((s: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td style="text-align: right; padding-right: 10px; font-weight: 700;">${s.name || ''}</td>
                  <td style="font-family: monospace; font-size: 10px;">${s.code || s.student || ''}</td>
                  <td>
                    ${s.hasReceivedBooks 
                      ? '<span class="delivered-badge">✔️ مستلم</span>' 
                      : '<span class="missing-badge">❌ غير مستلم</span>'}
                  </td>
                  <td style="text-align: right; padding-right: 8px; font-size: 10px; color: #334155;">
                    ${s.bookNotes || (s.hasReceivedBooks ? 'تم استلام كافة المناهج' : 'قيد الاستلام')}
                  </td>
                  <td></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-section">
            <div class="sign-box">
              <span>مسؤول شعبة المجانية / أمين المكتبة</span><br>
              <span>التوقيع: .......................................</span>
            </div>
            <div class="sign-box">
              <span>معاون شؤون الطلاب</span><br>
              <span>التوقيع: .......................................</span>
            </div>
            <div class="sign-box">
              <span>مدير المدرسة</span><br>
              <span>التوقيع: .......................................</span>
            </div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      
      {!selectedList ? (
        // ==========================================
        // 1. OVERVIEW SCREEN: CLASSES (EDGE-TO-EDGE FLUSH)
        // ==========================================
        <div className="bg-[#0b1020]/95 backdrop-blur-xl border-y sm:border border-white/10 sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl space-y-4">
          
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>سجل توزيع الكتب المدرسية</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    إدارة شاملة
                  </span>
                </h3>
                <p className="text-white/40 text-[11px] font-bold">اختر الشعبة لمتابعة التسليم وتدوين النواقص بنقرة واحدة</p>
              </div>
            </div>

            {/* Quick Overall Metrics Strip */}
            <div className="flex items-center gap-2 sm:gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 self-stretch sm:self-auto justify-around">
              <div className="px-2.5 py-0.5 text-center">
                <span className="text-[9px] text-white/40 font-black block">الشعب</span>
                <span className="text-xs font-black text-white">{overallStats.totalLists}</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="px-2.5 py-0.5 text-center">
                <span className="text-[9px] text-white/40 font-black block">إجمالي الطلاب</span>
                <span className="text-xs font-black text-white">{overallStats.totalStudents}</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="px-2.5 py-0.5 text-center">
                <span className="text-[9px] text-emerald-400 font-black block">المستلمين</span>
                <span className="text-xs font-black text-emerald-400">{overallStats.totalReceived}</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="px-2.5 py-0.5 text-center">
                <span className="text-[9px] text-amber-400 font-black block">المتبقي</span>
                <span className="text-xs font-black text-amber-400">{overallStats.remaining}</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10" />
              <div className="px-2.5 py-0.5 text-center">
                <span className="text-[9px] text-cyan-400 font-black block">النسبة</span>
                <span className="text-xs font-black text-cyan-400">{overallStats.percent}%</span>
              </div>
            </div>
          </div>

          {/* Edge-to-Edge Slim Class Rows with Real Progress & Counters */}
          <div className="grid grid-cols-1 gap-2.5">
            {(savedLists || []).map((list) => {
              const total = list.students?.length || 0;
              const received = list.students?.filter((s: any) => !!s.hasReceivedBooks)?.length || 0;
              const remaining = total - received;
              const percent = total > 0 ? Math.round((received / total) * 100) : 0;
              const isComplete = total > 0 && received === total;

              return (
                <div
                  key={list.id}
                  onClick={() => setSelectedList(list)}
                  className={`w-full rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer group border ${
                    isComplete 
                      ? 'bg-[#0e1c2e]/90 hover:bg-[#11243c] border-emerald-500/30 shadow-lg shadow-emerald-950/10' 
                      : 'bg-[#10172c]/90 hover:bg-[#15203d] border-white/5 hover:border-amber-500/30'
                  }`}
                >
                  {/* Top Line: Class Name & Total Count */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isComplete 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                          : 'bg-white/5 text-white/50 group-hover:text-amber-400 group-hover:bg-amber-500/10'
                      }`}>
                        {isComplete ? <BookCheck size={18} /> : <BookOpen size={18} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                          {list.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] sm:text-xs font-black bg-white/5 text-white/60 px-2.5 py-1 rounded-xl border border-white/5">
                        {total} طالب
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-white/5 group-hover:bg-emerald-500 group-hover:text-black flex items-center justify-center text-white/40 transition-all">
                        <ChevronLeft size={15} />
                      </div>
                    </div>
                  </div>

                  {/* Progress Strip & Detailed Counters (Replacing 'مكتمل التسليم') */}
                  <div className="space-y-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
                    {/* Metrics Row */}
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} className="shrink-0" />
                          <span>المستلمين: {received}</span>
                        </span>
                        
                        <span className={`${remaining > 0 ? 'text-amber-400' : 'text-white/30'} flex items-center gap-1`}>
                          <AlertCircle size={12} className="shrink-0" />
                          <span>المتبقي: {remaining}</span>
                        </span>
                      </div>

                      <span className={`font-mono text-xs ${isComplete ? 'text-emerald-400' : 'text-white/70'}`}>
                        {percent}%
                      </span>
                    </div>

                    {/* Full-width Responsive Progress Bar */}
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.4 }}
                        className={`h-full rounded-full transition-all ${
                          isComplete 
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                            : 'bg-gradient-to-r from-amber-500 to-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {(!savedLists || savedLists.length === 0) && (
              <div className="text-center py-12 text-white/20 text-xs font-bold border border-dashed border-white/5 rounded-2xl">
                لا توجد قوائم أو شعب مسجلة حالياً
              </div>
            )}
          </div>

        </div>
      ) : (
        // ==========================================
        // 2. CLASS DISTRIBUTION SCREEN (SLIM EDGE-TO-EDGE)
        // ==========================================
        <div className="bg-[#0b1020]/95 backdrop-blur-xl border-y sm:border border-white/10 sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl space-y-4">
          
          {/* Top Nav & Class Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3.5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedList(null); setSearchQuery(''); }}
                className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-black transition-all shrink-0 cursor-pointer active:scale-95"
                title="العودة لكافة الشعب"
              >
                <ChevronLeft size={16} className="rotate-180" />
                <span>رجوع للشعب</span>
              </button>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{selectedList.name}</span>
                </h3>
                <span className="text-white/40 text-[10px] font-bold">إدارة تسليم المناهج وتوثيق النواقص</span>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 self-stretch sm:self-auto justify-between sm:justify-start">
              <div className="px-2.5 py-1 text-center">
                <span className="text-[8px] text-white/40 font-black block">الإجمالي</span>
                <span className="text-xs font-black text-white">{listStats?.total}</span>
              </div>
              <div className="w-[1px] h-5 bg-white/10" />
              <div className="px-2.5 py-1 text-center">
                <span className="text-[8px] text-emerald-400 font-black block">تم التسليم</span>
                <span className="text-xs font-black text-emerald-400">{listStats?.received}</span>
              </div>
              <div className="w-[1px] h-5 bg-white/10" />
              <div className="px-2.5 py-1 text-center">
                <span className="text-[8px] text-amber-400 font-black block">المتبقي</span>
                <span className="text-xs font-black text-amber-400">{listStats?.remaining}</span>
              </div>
              <div className="w-[1px] h-5 bg-white/10" />
              <div className="px-2.5 py-1 text-center">
                <span className="text-[8px] text-indigo-400 font-black block">النسبة</span>
                <span className="text-xs font-black text-indigo-400">{listStats?.percent}%</span>
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch">
            {/* Search Input */}
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="بحث باسم الطالب، الكود، أو الملاحظة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 text-xs text-white placeholder-white/30 font-bold focus:border-emerald-500/50 outline-none transition-all"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  filterMode === 'all' ? 'bg-white/10 text-white shadow' : 'text-white/40 hover:text-white'
                }`}
              >
                الكل ({listStats?.total})
              </button>
              <button
                onClick={() => setFilterMode('missing')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  filterMode === 'missing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-white/40 hover:text-amber-400'
                }`}
              >
                المتبقين ({listStats?.remaining})
              </button>
              <button
                onClick={() => setFilterMode('delivered')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  filterMode === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-white/40 hover:text-emerald-400'
                }`}
              >
                المستلمين ({listStats?.received})
              </button>
            </div>

            {/* Instant Fast Deliver All & Print Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Deliver All Button (Fast & Smooth ⚡) */}
              <button
                onClick={handleDeliverAllToggle}
                className={`h-10 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                  listStats?.allDelivered
                    ? 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/15'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black shadow-emerald-500/20 font-black'
                }`}
                title={listStats?.allDelivered ? 'إلغاء تسليم الكل' : 'تسليم كافة طلاب الشعبة بلمسة واحدة'}
              >
                {listStats?.allDelivered ? (
                  <>
                    <RotateCcw size={14} />
                    <span>إلغاء تسليم الكل</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>تسليم الكل ({listStats?.total}) ⚡</span>
                  </>
                )}
              </button>

              {/* Print Export Button */}
              <button
                onClick={handleExportPrint}
                className="h-10 px-3.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="طباعة استمارة التسليم الرسمية"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">طباعة الاستمارة</span>
              </button>
            </div>
          </div>

          {/* Slim Edge-to-Edge Students List */}
          <div className="border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 bg-black/20">
            {filteredStudents.map((stu: any, idx: number) => {
              const studentKey = stu.id || stu.student || stu.code;
              const isReceived = !!stu.hasReceivedBooks;
              const isEditingNote = editingNoteStudentId === studentKey;

              return (
                <div 
                  key={studentKey || idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 transition-colors ${
                    isReceived ? 'bg-emerald-500/[0.02]' : 'hover:bg-white/[0.015]'
                  }`}
                >
                  {/* Student Info & Toggle Button */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Status Toggle Button (Instant ⚡) */}
                    <button
                      onClick={() => handleToggleDelivery(studentKey, isReceived)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-90 ${
                        isReceived
                          ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                          : 'bg-white/5 text-white/20 hover:bg-white/10 hover:text-amber-400 border border-white/5'
                      }`}
                      title={isReceived ? 'تم التسليم (انقر للإلغاء)' : 'غير مستلم (انقر لتأكيد التسليم)'}
                    >
                      {isReceived ? <BookCheck size={18} /> : <BookX size={18} />}
                    </button>

                    {/* Student Name & Code */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/20 font-mono w-5 shrink-0 text-center">
                          {idx + 1}
                        </span>
                        <h4 className={`text-xs sm:text-sm font-black truncate ${
                          isReceived ? 'text-white' : 'text-white/90'
                        }`}>
                          {stu.name}
                        </h4>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                          isReceived 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isReceived ? 'مستلم' : 'متبقي'}
                        </span>
                      </div>
                      <p className="text-white/20 text-[9px] font-mono mr-7">{stu.code || stu.student}</p>
                    </div>
                  </div>

                  {/* Note Section (Inline & Slim) */}
                  <div className="flex items-center gap-2 sm:w-72 justify-end">
                    {isEditingNote ? (
                      <div className="flex flex-col gap-1.5 w-full bg-black/60 p-2 rounded-xl border border-amber-500/30">
                        <div className="flex gap-1.5">
                          <input 
                            autoFocus
                            type="text"
                            placeholder="مثال: نقص كيمياء، نقص علوم..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveStudentNote(studentKey);
                              if (e.key === 'Escape') setEditingNoteStudentId(null);
                            }}
                            className="flex-1 h-7 bg-white/5 border border-white/10 rounded-lg px-2 text-[10px] text-white outline-none focus:border-amber-500 font-bold"
                          />
                          <button 
                            onClick={() => saveStudentNote(studentKey)}
                            className="h-7 px-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-[10px] font-black transition-all cursor-pointer"
                          >
                            حفظ
                          </button>
                          <button 
                            onClick={() => setEditingNoteStudentId(null)}
                            className="h-7 px-2 bg-white/5 hover:bg-white/10 text-white/50 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                          {COMMON_NOTE_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setNoteText(preset);
                                saveStudentNote(studentKey, preset);
                              }}
                              className="text-[8px] bg-white/5 hover:bg-amber-500/20 text-white/50 hover:text-amber-400 px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNoteStudentId(studentKey);
                          setNoteText(stu.bookNotes || '');
                        }}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-right group/note cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <PenLine size={11} className="text-white/20 group-hover/note:text-amber-400 transition-colors shrink-0" />
                          {stu.bookNotes ? (
                            <span className="text-amber-400 text-[10px] font-black truncate">
                              {stu.bookNotes}
                            </span>
                          ) : (
                            <span className="text-white/20 text-[10px] font-bold group-hover/note:text-white/40 italic truncate">
                              + تدوين نقص / ملاحظة...
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredStudents.length === 0 && (
              <div className="text-center py-10 text-white/30 text-xs font-bold">
                لا يوجد طلاب مطابقين لمعايير البحث أو التصفية
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
