import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Printer, Search, Filter, SlidersHorizontal, Check, X, Calendar, CreditCard, DollarSign, BookOpen, Clock } from 'lucide-react';
import { DigitalReceiptModal } from './DigitalReceiptModal';

interface AccessLogsSectionProps {
  gradesByStage: Record<string, string[]>;
  students: any[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccessLogsSection: React.FC<AccessLogsSectionProps> = ({ gradesByStage, students, showToast }) => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedNoteFilter, setSelectedNoteFilter] = useState<string>('all');

  // Compute all stamped / digital / completed manual receipts globally across all students
  const allStampedTransactions = useMemo(() => {
    const logsMap = new Map<string, any>();
    students.forEach(s => {
      const txns = s.finance?.transactions || [];
      txns.forEach((t: any) => {
        // Include explicitly stamped transactions or completed parent/digital payments
        const isRealParentPayment = t.method && t.method !== 'نقدي' && t.method !== 'نقدي/مدير' && t.method !== 'غير محدد' && t.status === 'completed';
        const isManual = t.isManual === true || t.method === 'نقدي/مدير';
        if (t.isStamped === true || isRealParentPayment || isManual) {
          // Heuristically find the real payment method if it shows 'نقدي/مدير' or is empty
          let resolvedMethod = t.method;
          if (!resolvedMethod || resolvedMethod === 'نقدي/مدير' || resolvedMethod === 'نقدي' || resolvedMethod === 'غير محدد') {
            // Find another transaction from the same student with the exact same amount that has a real payment method
            const realTx = txns.find((other: any) => 
              other.id !== t.id && 
              Number(other.amount) === Number(t.amount) && 
              other.method && 
              other.method !== 'نقدي/مدير' && 
              other.method !== 'نقدي' && 
              other.method !== 'غير محدد'
            );
            if (realTx) {
              resolvedMethod = realTx.method;
            }
          }

          // Heuristically find the installment name (note) if empty or generic
          let resolvedNote = t.note || '';
          let cleanNote = resolvedNote.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
          
          if (!cleanNote || cleanNote === 'قسط غير محدد') {
            const matchingInst = (s.finance?.installments || []).find((inst: any) => 
               (inst.paid === true || inst.status === 'completed') && Number(inst.amount) === Number(t.amount)
            );
            if (matchingInst) {
              resolvedNote = matchingInst.name;
              cleanNote = matchingInst.name;
            }
          }
          if (!cleanNote) {
            cleanNote = 'قسط غير محدد';
            resolvedNote = 'قسط غير محدد';
          } else {
            resolvedNote = cleanNote;
          }

          // Use the clean (normalized) note for grouping
          const key = `${s.code}-${t.amount}-${cleanNote}`;
          
          if (!logsMap.has(key)) {
            logsMap.set(key, {
              ...t,
              note: resolvedNote,
              method: resolvedMethod,
              id: t.id || key,
              studentName: s.name,
              studentCode: s.code,
              studentId: s.id,
              grade: s.grade,
              schoolName: s.schoolName,
              schoolId: s.schoolId
            });
          } else {
            // Merge fields if existing entry is missing info
            const existing = logsMap.get(key);
            if (!existing.timestamp && t.timestamp) existing.timestamp = t.timestamp;
            // Keep the most recent timestamp if we have multiple
            if (existing.timestamp && t.timestamp) {
                const dateExists = existing.timestamp.seconds ? new Date(existing.timestamp.seconds * 1000).getTime() : new Date(existing.timestamp).getTime();
                const dateNew = t.timestamp.seconds ? new Date(t.timestamp.seconds * 1000).getTime() : new Date(t.timestamp).getTime();
                if (dateNew > dateExists) {
                    existing.timestamp = t.timestamp;
                }
            }
            if ((!existing.note || existing.note === 'قسط غير محدد') && resolvedNote && resolvedNote !== 'قسط غير محدد') {
              existing.note = resolvedNote;
            }
            if (t.isStamped || existing.isStamped) {
              existing.isStamped = true;
              if (t.stampTime) {
                existing.stampTime = t.stampTime;
              }
            }
            if (resolvedMethod && resolvedMethod !== 'نقدي/مدير' && resolvedMethod !== 'نقدي' && resolvedMethod !== 'غير محدد') {
              existing.method = resolvedMethod;
            }
          }
        }
      });
    });
    return Array.from(logsMap.values()).sort((a, b) => new Date(b.timestamp?.seconds * 1000 || b.timestamp).getTime() - new Date(a.timestamp?.seconds * 1000 || a.timestamp).getTime());
  }, [students]);

  // Find all unique installment notes globally for the filters
  const uniqueInstallmentNotes = useMemo(() => {
    const notesSet = new Set<string>();
    allStampedTransactions.forEach(t => {
      if (t.note) {
        notesSet.add(t.note);
      }
    });
    return Array.from(notesSet).filter(Boolean);
  }, [allStampedTransactions]);

  // Apply filters on top of all transactions
  const filteredTransactions = useMemo(() => {
    return allStampedTransactions.filter((log) => {
      // 1. Stage/Grade Filter
      if (selectedGrade && log.grade !== selectedGrade) {
        return false;
      }
      if (selectedStage && !selectedGrade) {
        const stageGrades = gradesByStage[selectedStage] || [];
        if (!stageGrades.includes(log.grade)) {
          return false;
        }
      }

      // 2. Search Query Filter - filters by name, code, note, amount, method, stage/grade
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (log.studentName || '').toLowerCase().includes(query);
        const matchesCode = (log.studentCode || '').toLowerCase().includes(query);
        const matchesNote = (log.note || '').toLowerCase().includes(query);
        const matchesMethod = (log.method || '').toLowerCase().includes(query);
        const matchesGrade = (log.grade || '').toLowerCase().includes(query);
        const matchesAmount = String(log.amount).includes(query);
        
        if (!matchesName && !matchesCode && !matchesNote && !matchesMethod && !matchesGrade && !matchesAmount) {
          return false;
        }
      }

      // 3. Payment Method Filter
      if (selectedMethod !== 'all') {
        if (selectedMethod === 'cash') {
          // matches cash options
          const isCash = log.method === 'نقدي' || log.method === 'نقدي/مدير' || !log.method || log.isManual === true;
          if (!isCash) return false;
        } else if (selectedMethod === 'digital') {
          const isCash = log.method === 'نقدي' || log.method === 'نقدي/مدير' || !log.method || log.isManual === true;
          if (isCash) return false;
        } else {
          // matches specific code
          if (log.method !== selectedMethod) return false;
        }
      }

      // 4. Installment Note Filter
      if (selectedNoteFilter !== 'all') {
        if (log.note !== selectedNoteFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allStampedTransactions, selectedStage, selectedGrade, searchQuery, selectedMethod, selectedNoteFilter, gradesByStage]);

  const hasAnyFilterActive = searchQuery.trim() !== '' || selectedMethod !== 'all' || selectedNoteFilter !== 'all';

  // Find Stage name of a particular grade
  const findStageOfGrade = (gradeName: string) => {
    for (const [stage, grades] of Object.entries(gradesByStage)) {
      const gradesArray = grades as string[];
      if (Array.isArray(gradesArray) && gradesArray.includes(gradeName)) {
        return stage;
      }
    }
    return '';
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMethod('all');
    setSelectedNoteFilter('all');
    showToast('تم إعادة تعيين فلاتر البحث بنجاح', 'info');
  };

  return (
    <div className="space-y-6 px-2 md:px-4 pb-10">
      {/* Banner / Header */}
      <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900/30 to-indigo-600/15 border border-indigo-500/20 rounded-[30px] p-6 shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-white font-extrabold text-xl sm:text-2xl flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-500/25 text-indigo-400 flex items-center justify-center rounded-2xl shadow-lg border border-indigo-500/20 ring-4 ring-indigo-500/5">
               <History size={24} className="animate-pulse" />
             </div>
             <span>سجل الوصولات المالية</span>
          </h2>
          <p className="text-white/40 text-xs font-bold mt-2.5 mr-15">تتبع كامل لمقبوضات الدفع الرقمية واليدوية المعتمدة، مع محركات بحث وتصفية فورية فائقة الأداء.</p>
        </div>
      </div>

      {/* Advanced Filter and Search Controls Row */}
      <div className="bg-[#101935]/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl relative">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Text Search Field */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/30">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الطالب، كود ولي الأمر، المرحلة، قيمة الوصل أو اسم القسط..."
              className="w-full h-12 pr-11 pl-12 bg-black/60 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-white text-xs font-bold leading-relaxed focus:outline-none transition-all shadow-inner focus:ring-1 focus:ring-indigo-500/30 text-right placeholder-white/20"
              dir="rtl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Payment Method filter dropdown */}
          <div className="w-full lg:w-60 relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-indigo-400">
              <CreditCard size={16} />
            </div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full h-12 pr-10 pl-4 bg-black/60 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-white text-xs font-bold leading-relaxed focus:outline-none transition-all cursor-pointer appearance-none text-right shadow-inner"
            >
              <option value="all" className="bg-[#0b1021]">جميع طرق الدفع</option>
              <option value="cash" className="bg-[#0b1021]">دفع نقدي (يدوي)</option>
              <option value="digital" className="bg-[#0b1021]">دفع إلكتروني (رقمي)</option>
              <option value="zaincash" className="bg-[#0b1021]">زين كاش (Zain Cash)</option>
              <option value="asiahawala" className="bg-[#0b1021]">آسيا حوالة (AsiaHawala)</option>
              <option value="fib" className="bg-[#0b1021]">مصرف العراق الأول (FIB)</option>
              <option value="mastercard" className="bg-[#0b1021]">ماستر كارد (Mastercard)</option>
            </select>
          </div>

          {/* Installment Note filter dropdown */}
          <div className="w-full lg:w-60 relative">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-amber-400">
              <SlidersHorizontal size={14} />
            </div>
            <select
              value={selectedNoteFilter}
              onChange={(e) => setSelectedNoteFilter(e.target.value)}
              className="w-full h-12 pr-10 pl-4 bg-black/60 border border-white/5 focus:border-indigo-500/50 rounded-2xl text-white text-xs font-bold leading-relaxed focus:outline-none transition-all cursor-pointer appearance-none text-right shadow-inner"
            >
              <option value="all" className="bg-[#0b1021]">جميع الأقساط والمناسبات</option>
              {uniqueInstallmentNotes.map(note => (
                <option key={note} value={note} className="bg-[#0b1021]">{note}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filter Pills status summary */}
        {hasAnyFilterActive && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
            <span className="text-indigo-300 text-[10px] font-black flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              تم العثور على {filteredTransactions.length} وصل مالي مطابق للتصفية
            </span>
            <button
              onClick={handleResetFilters}
              className="text-white/60 hover:text-white hover:bg-white/5 text-[9px] font-black border border-white/10 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <X size={12} />
              إعادة تعيين الفلاتر وطرق التصفية
            </button>
          </div>
        )}
      </div>

      {/* Main content display based on filtering and navigation status */}
      <AnimatePresence mode="wait">
        
        {/* If any text search or filters are typed, and NO stage/grade is selected OR user wants to see global results */}
        {hasAnyFilterActive ? (
          <motion.div
            key="search-mode-results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header info for Search Results */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 pr-6 rounded-[24px]">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 text-xs font-black animate-pulse bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">نتائج البحث الشامل المباشر</span>
                {selectedStage && (
                  <span className="text-white/40 text-[11px] font-bold">
                     محددة بالصف: {selectedStage} {selectedGrade ? ` - ${selectedGrade}` : ''}
                  </span>
                )}
              </div>
              
              {/* Reset view buttons */}
              {(selectedStage || selectedGrade) && (
                <button 
                  onClick={() => { setSelectedStage(null); setSelectedGrade(null); }} 
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-[9px] font-black transition-all"
                >
                  العودة للرئيسية
                </button>
              )}
            </div>

            {/* List rendered */}
            {filteredTransactions.length === 0 ? (
              <div className="bg-[#101935]/60 p-12 rounded-[30px] border border-white/5 text-center flex flex-col items-center justify-center gap-4 py-20 shadow-inner">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-2">
                  <Printer size={40} className="stroke-1 text-indigo-400/40" />
                </div>
                <h4 className="text-white font-black text-lg">لم نعثر على نتائج مطابقة</h4>
                <p className="text-white/30 text-xs font-bold max-w-sm">جرب تعديل كلمات البحث، أو طريقة الدفع، أو تأكد من تحديد معايير التصفية بشكل سليم.</p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all active:scale-95"
                >
                  مسح كلمة البحث واستعراض المقبوضات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTransactions.map((log, idx) => {
                  const methodMap: Record<string, string> = {
                    'asiahawala': 'آسيا حوالة',
                    'zaincash': 'زين كاش',
                    'mastercard': 'ماستر كارد',
                    'fib': 'مصرف العراق الأول FIB'
                  };
                  const displayMethod = methodMap[log.method] || log.method || 'نقدي/مدير';
                  const isCash = displayMethod === 'نقدي' || displayMethod === 'نقدي/مدير';
                  const parentStage = findStageOfGrade(log.grade);
                  
                  return (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                      className="group bg-gradient-to-r from-[#101935] to-[#0B1021] p-5 rounded-[24px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-indigo-500/30 hover:bg-indigo-950/20 transition-all shadow-lg hover:shadow-indigo-500/5 mt-1"
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                           <Printer size={20} />
                         </div>
                         <div>
                             <p className="font-black text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
                               {log.studentName}
                               {log.isStamped && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="مختوم ومعتمد"></span>}
                             </p>
                             <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                               {/* Grade Badge */}
                               <span className="text-[8px] sm:text-[9px] text-[#00E5FF] font-black bg-[#00E5FF]/10 px-2 py-0.5 rounded-md border border-[#00E5FF]/20 flex items-center gap-1">
                                 <BookOpen size={9} />
                                 <span>{parentStage ? `${parentStage} / ` : ''}{log.grade}</span>
                               </span>
                               
                               <span className="text-[10px] text-white/40 font-mono bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{log.studentCode}</span>
                               {log.note && <span className="text-[9px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{log.note.replace('وصل رقمي - ', '')}</span>}
                             </div>
                         </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-5 pl-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-white/5">
                          <div className="text-right">
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <span className={`text-[9px] font-black px-2 py-1 rounded-xl whitespace-nowrap ${isCash ? 'bg-white/5 text-white/50 border-white/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                {displayMethod}
                              </span>
                              <p className="font-black text-emerald-400 text-base sm:text-lg tracking-tight min-w-[90px] text-left">
                                {Number(log.amount).toLocaleString()} <span className="text-[10px] opacity-60">د.ع</span>
                              </p>
                            </div>
                            <p className="text-[10px] text-white/30 font-bold flex items-center justify-end gap-1">
                              <Calendar size={10} />
                              {(() => {
                                const rawTs: any = log.timestamp || log.paidAt || log.createdAt || log.stampTime;
                                if (!rawTs) return '';
                                let d: Date;
                                if (typeof rawTs === 'object' && rawTs !== null && 'toDate' in rawTs && typeof (rawTs as any).toDate === 'function') { d = (rawTs as any).toDate(); } 
                                else if (typeof rawTs === 'object' && rawTs !== null && 'seconds' in rawTs) { d = new Date((rawTs as any).seconds * 1000); } 
                                else if (typeof rawTs === 'number' || typeof rawTs === 'string') { d = new Date(rawTs); } 
                                else { return ''; }
                                return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ar-EG');
                              })()}
                            </p>
                          </div>
                          <button 
                            onClick={() => setSelectedReceipt({
                               id: log.id,
                               adminName: log.adminName || 'مدير النظام',
                               studentName: log.studentName,
                               studentId: log.studentId || log.studentCode,
                               amount: Number(log.amount),
                               time: (() => {
                                   if (!log.timestamp) return new Date();
                                   if (log.timestamp.toDate && typeof log.timestamp.toDate === 'function') return log.timestamp.toDate();
                                   if (log.timestamp.seconds) return new Date(log.timestamp.seconds * 1000);
                                   return new Date(log.timestamp);
                               })(),
                               schoolName: log.schoolName,
                               schoolId: log.schoolId,
                               installmentName: log.note,
                               isStamped: log.isStamped,
                               method: log.method,
                               stampTime: log.stampTime || (log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleDateString('ar-EG') : undefined)
                            })}
                            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                          >
                            استعراض
                          </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* Normal Structured Flow (Stage Selection -> Grade Selection -> Stamped logs) */
          <>
            {!selectedStage ? (
              <motion.div 
                key="stage-selector"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Visual Alert explaining flow */}
                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <p className="text-white/40 text-[10px] sm:text-xs font-bold leading-relaxed">يرجى اختيار المرحلة الدراسية لمطالعة وتصفية وصولات طلابها، أو استخدم حقل البحث المباشر في الأعلى للبحث الشامل والمباشر فورياً.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(gradesByStage).map(stage => {
                    // count total transactions for this stage to show in a badge
                    const studentGrades = gradesByStage[stage] || [];
                    const stageReceiptCount = allStampedTransactions.filter(t => studentGrades.includes(t.grade)).length;
                    
                    return (
                      <button 
                        key={stage}
                        onClick={() => setSelectedStage(stage)}
                        className="bg-gradient-to-br from-[#101935]/80 to-[#0a1024]/90 p-8 rounded-[35px] border border-white/5 text-white font-black text-center hover:border-indigo-500/40 hover:shadow-[0_0_35px_rgba(79,70,229,0.12)] transition-all duration-300 group flex flex-col items-center justify-center gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/[0.02] blur-2xl rounded-full" />
                        
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500 border border-white/5 group-hover:border-indigo-500/25">
                          <Printer size={28} className="text-white/30 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <span className="text-lg tracking-wide block font-extrabold group-hover:text-indigo-300 transition-colors">{stage}</span>
                        
                        {/* Static Badge */}
                        <span className="text-[10px] text-indigo-300 font-extrabold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/15">
                          {stageReceiptCount} وصل مالي ومعتمد
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : !selectedGrade ? (
              <motion.div 
                key="grade-selector"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 pr-6 rounded-[24px]">
                  <h3 className="text-white font-black text-lg flex items-center gap-2 text-indigo-400">
                     {selectedStage}
                  </h3>
                  <button 
                    onClick={() => setSelectedStage(null)} 
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                  >
                    رئيسية مقبوضات الوصولات
                    <History size={14} className="rotate-180 text-indigo-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {gradesByStage[selectedStage].map(grade => {
                    const gradeReceiptCount = allStampedTransactions.filter(t => t.grade === grade).length;
                    
                    return (
                      <button 
                        key={grade}
                        onClick={() => setSelectedGrade(grade)}
                        className="bg-[#101935] p-6 rounded-[24px] border border-white/5 text-white font-black text-center hover:bg-indigo-600/10 hover:border-indigo-500/30 transition-all hover:-translate-y-1 relative group flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <span className="text-sm font-extrabold pr-0.5 group-hover:text-indigo-300 transition-colors">{grade}</span>
                        <span className="text-[9px] text-white/30 font-bold block mt-1">
                          {gradeReceiptCount} وصولات مستلمة
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* Specific Grade results with no matching filters (meaning viewing entire raw grade output) */
              <motion.div 
                key="grade-receipts-list"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Navigation header row */}
                <div className="flex flex-col md:flex-row items-center justify-between bg-white/[0.02] border border-white/5 p-4 pr-6 rounded-[24px] gap-4">
                  <h3 className="text-white font-black text-base sm:text-lg flex items-center gap-3">
                     <span className="text-indigo-400">{selectedStage}</span>
                     <span className="text-white/20">/</span>
                     <span className="text-white/80">{selectedGrade}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                      <button 
                        onClick={() => setSelectedGrade(null)} 
                        className="px-4 py-2 bg-white/5 hover:bg-indigo-500/10 text-white/60 hover:text-indigo-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        العودة للصفوف
                      </button>
                      <button 
                        onClick={() => { setSelectedStage(null); setSelectedGrade(null); }} 
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        رئيسية السجل
                      </button>
                  </div>
                </div>
                
                {/* Render Filtered Transactions for specific grade list */}
                {filteredTransactions.length === 0 ? (
                  <div className="bg-[#101935] p-12 rounded-[30px] border border-white/5 text-center flex flex-col items-center justify-center gap-4 py-20 shadow-inner">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/10 mb-2">
                      <Printer size={40} className="stroke-1 text-indigo-400/40" />
                    </div>
                    <h4 className="text-white font-black text-lg">لا توجد وصولات مطابقة</h4>
                    <p className="text-white/30 text-xs font-bold max-w-sm">لم يتم العثور على أي وصولات مطابقة في هذا الصف بناءً على خيارات التصفية الحالية.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTransactions.map((log, idx) => {
                      const methodMap: Record<string, string> = {
                        'asiahawala': 'آسيا حوالة',
                        'zaincash': 'زين كاش',
                        'mastercard': 'ماستر كارد',
                        'fib': 'مصرف العراق الأول FIB'
                      };
                      const displayMethod = methodMap[log.method] || log.method || 'نقدي/مدير';
                      const isCash = displayMethod === 'نقدي' || displayMethod === 'نقدي/مدير';
                      
                      return (
                        <div key={log.id} className="group bg-gradient-to-r from-[#101935] to-[#0B1021] p-5 rounded-[24px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-indigo-500/30 hover:bg-white/[0.02] transition-all shadow-lg hover:shadow-indigo-500/10 mt-1">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                 <Printer size={20} />
                               </div>
                               <div>
                                   <p className="font-black text-white text-base tracking-wide flex items-center gap-2">
                                     {log.studentName}
                                     {log.isStamped && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>}
                                   </p>
                                   <div className="flex flex-wrap items-center gap-2 mt-1">
                                     <span className="text-[10px] text-white/40 font-mono bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{log.studentCode}</span>
                                     {log.note && <span className="text-[9px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{log.note.replace('وصل رقمي - ', '')}</span>}
                                   </div>
                               </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-5 pl-2 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-white/5">
                                <div className="text-right">
                                  <div className="flex items-center gap-2 justify-end mb-1">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-xl whitespace-nowrap ${isCash ? 'bg-white/5 text-white/50 border-white/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                      {displayMethod}
                                    </span>
                                    <p className="font-black text-emerald-400 text-lg tracking-tight min-w-[90px] text-left">{Number(log.amount).toLocaleString()} <span className="text-[10px] opacity-60">د.ع</span></p>
                                  </div>
                                  <p className="text-[10px] text-white/30 font-bold flex items-center justify-end gap-1">
                                    <Calendar size={10} />
                                    {(() => {
                                      const rawTs: any = log.timestamp || log.paidAt || log.createdAt || log.stampTime;
                                      if (!rawTs) return '';
                                      let d: Date;
                                      if (typeof rawTs === 'object' && rawTs !== null && 'toDate' in rawTs && typeof (rawTs as any).toDate === 'function') { d = (rawTs as any).toDate(); } 
                                      else if (typeof rawTs === 'object' && rawTs !== null && 'seconds' in rawTs) { d = new Date((rawTs as any).seconds * 1000); } 
                                      else if (typeof rawTs === 'number' || typeof rawTs === 'string') { d = new Date(rawTs); } 
                                      else { return ''; }
                                      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ar-EG');
                                    })()}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => setSelectedReceipt({
                                     id: log.id,
                                     adminName: log.adminName || 'مدير النظام',
                                     studentName: log.studentName,
                                     studentId: log.studentId || log.studentCode,
                                     amount: Number(log.amount),
                                     time: (() => {
                                         if (!log.timestamp) return new Date();
                                         if (log.timestamp.toDate && typeof log.timestamp.toDate === 'function') return log.timestamp.toDate();
                                         if (log.timestamp.seconds) return new Date(log.timestamp.seconds * 1000);
                                         return new Date(log.timestamp);
                                     })(),
                                     schoolName: log.schoolName,
                                     schoolId: log.schoolId,
                                     installmentName: log.note,
                                     isStamped: log.isStamped,
                                     method: log.method,
                                     stampTime: log.stampTime || (log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleDateString('ar-EG') : undefined)
                                  })}
                                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2 active:scale-95 shrink-0"
                                >
                                  استعراض
                                </button>
                            </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* digital modal for receipt detail view */}
      <DigitalReceiptModal 
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        hideActions={true}
      />
    </div>
  );
};
