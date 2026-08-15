import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Trash2,
  Loader2,
  Download
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, getDocs, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  targetId?: string;
  targetName?: string;
  targetType?: string;
  timestamp: Timestamp;
}

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [logLimit, setLogLimit] = useState(30);
  const [isDeletingOld, setIsDeletingOld] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'students' | 'codes' | 'finance' | 'broadcast' | 'teachers' | 'resources' | 'support'>('all');

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(logLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(logsData);
      setLoading(false);
      setLoadingMore(false);
    }, (error) => {
      console.error("Audit log listener error:", error);
      setLoading(false);
      setLoadingMore(false);
    });

    return () => unsubscribe();
  }, [logLimit]);

  const handleClearOldLogs = async () => {
    setIsDeletingOld(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const timestampLimit = Timestamp.fromDate(thirtyDaysAgo);

      const oldLogsQuery = query(
        collection(db, 'audit_logs'),
        where('timestamp', '<', timestampLimit)
      );

      const snapshot = await getDocs(oldLogsQuery);
      
      if (snapshot.empty) {
        alert("تنبيه: لا توجد سجلات أقدم من 30 يوماً متوفرة للحذف في الوقت الحالي.");
        setIsDeletingOld(false);
        return;
      }

      const confirmMessage = `هل أنت متأكد من رغبتك في حذف ${snapshot.size} سجل قديم؟\n\nسيتم حذفها نهائياً لتخفيف العبء عن قاعدة البيانات.`;
      if (!window.confirm(confirmMessage)) {
        setIsDeletingOld(false);
        return;
      }
      
      // Delete in batches or sequentially
      let deletedCount = 0;
      for (const document of snapshot.docs) {
        await deleteDoc(doc(db, 'audit_logs', document.id));
        deletedCount++;
      }
      
      alert(`تم حذف ${deletedCount} سجل قديم بنجاح.`);
    } catch (error: any) {
      console.error("Error clearing old logs:", error);
      if (error && error.message && error.message.includes('permission')) {
        alert("عذراً، لا تملك الصلاحية الكافية لحذف هذه السجلات.");
      } else {
        alert("تنبيه: لا توجد سجلات أقدم من 30 يوماً ليتم حذفها، أو حدث خطأ أثناء جلب البيانات.");
      }
    } finally {
      setIsDeletingOld(false);
    }
  };

  const handlePrintLogs = () => {
    if (logs.length === 0) {
      alert("لا توجد سجلات لطباعتها.");
      return;
    }
    
    // Create popup for printing format
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("يرجى السماح بالنوافذ المنبثقة (Pop-ups) لطباعة السجلات.");
      return;
    }

    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>سجل النشاطات الإدارية - طباعة</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #000; background: #fff; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 24px; color: #111; }
            p.subtitle { text-align: center; color: #666; margin-bottom: 40px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: right; vertical-align: top; }
            th { background-color: #f8f9fa; font-weight: bold; color: #333; }
            tr:nth-child(even) { background-color: #fafafa; }
            .action-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background: #eee; font-weight: bold; font-size: 11px; }
            .details { max-width: 400px; line-height: 1.5; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>سجل النشاطات الإدارية - بوابة بيرق</h1>
          <p class="subtitle">تم التوليد بتاريخ: ${new Date().toLocaleString('ar-IQ')} • عدد السجلات: ${logs.length}</p>
          <table>
            <thead>
              <tr>
                <th width="5%">#</th>
                <th width="25%">المسؤول عن الإجراء</th>
                <th width="15%">نوع العملية</th>
                <th width="35%">التفاصيل</th>
                <th width="20%">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map((log, index) => {
                const date = typeof log.timestamp === 'string' 
                  ? log.timestamp 
                  : log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('ar-IQ') : 'غير محدد';
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>
                      <strong>${log.userName || 'مدير النظام'}</strong><br/>
                      <span style="color: #666; font-size: 11px;">${log.userEmail || ''}</span>
                    </td>
                    <td><span class="action-badge">${log.action}</span></td>
                    <td class="details">
                      ${log.details.replace(/\n/g, '<br/>')}
                      ${log.targetName ? `<br/><br/><strong>الهدف:</strong> ${log.targetName}` : ''}
                    </td>
                    <td dir="ltr" style="text-align: right;">${date}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      searchQuery.trim() === '' ||
      log.userName.toLowerCase().includes(searchLower) || 
      (log.userEmail?.toLowerCase().includes(searchLower)) ||
      log.action.toLowerCase().includes(searchLower) || 
      log.details.toLowerCase().includes(searchLower) ||
      (log.targetName?.toLowerCase().includes(searchLower));
    
    if (filter === 'all') return matchesSearch;
    
    // Fine-grained logical mapping
    switch (filter) {
      case 'students': 
        return matchesSearch && (log.targetType === 'student' || log.targetType === 'academic_list' || log.action.includes('درجات') || log.targetType === 'student_grades');
      case 'finance':
        return matchesSearch && (log.targetType?.includes('finance') || log.action.includes('قسط') || log.action.includes('دفعة') || log.targetType === 'finance_config');
      case 'broadcast':
        return matchesSearch && log.targetType === 'broadcast';
      case 'teachers':
        return matchesSearch && log.targetType === 'teacher';
      case 'resources':
        return matchesSearch && log.targetType === 'resource';
      case 'support':
        return matchesSearch && log.targetType === 'support_ticket';
      case 'codes':
        return matchesSearch && log.targetType === 'codes_generation';
      default:
        return matchesSearch;
    }
  });

  const getActionColor = (action: string) => {
    if (action.includes('حذف')) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (action.includes('تعديل') || action.includes('تحديث')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    if (action.includes('إضافة')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  };

  const getTargetIcon = (type?: string) => {
    switch (type) {
      case 'teacher': return <UserIcon size={14} />;
      case 'academic_list': return <History size={14} />;
      case 'student': return <UserIcon size={14} />;
      case 'resource': return <History size={14} />;
      case 'finance_config': return <ShieldCheck size={14} />;
      case 'broadcast': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:bg-white print:text-black print:p-0 print:m-0">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-section, .print-section * {
              visibility: visible;
            }
            .print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
            .print-section table {
              width: 100%;
              border-collapse: collapse;
            }
            .print-section th, .print-section td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
              color: black !important;
            }
            .print-section th {
              background-color: #f2f2f2 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 border-white/10 relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full -translate-y-32 -translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/5 rounded-full translate-y-24 translate-x-12 blur-3xl" />
        
        <div className="flex items-center gap-5 relative z-10 w-full lg:w-auto">
          <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-white border border-white/10 shadow-2xl shadow-purple-950/40 shrink-0">
            <History size={32} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">سجل الرقابة الإدارية</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">نظام تتبع العمليات النشط • آخر {logs.length} سجل</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10 w-full lg:w-auto mt-4 md:mt-0 print:hidden">
          <button
            onClick={handlePrintLogs}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-blue-500/10 px-6 py-4 sm:py-3 rounded-2xl border border-white/10 hover:border-blue-500/20 backdrop-blur-sm transition-all group text-right shadow-xl"
          >
            <Download size={22} className="text-blue-400 group-hover:-translate-y-1 transition-transform shrink-0" />
            <div className="flex flex-col flex-1 sm:flex-none">
              <span className="text-[10px] text-white/30 font-black uppercase leading-none mb-1">نسخة احتياطية</span>
              <span className="text-xs text-white font-black">طباعة السجلات</span>
            </div>
          </button>
          
          <button
            onClick={handleClearOldLogs}
            disabled={isDeletingOld}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-rose-500/10 px-6 py-4 sm:py-3 rounded-2xl border border-white/10 hover:border-rose-500/20 backdrop-blur-sm transition-all group disabled:opacity-50 text-right shadow-xl"
          >
            {isDeletingOld ? (
              <Loader2 size={22} className="text-rose-400 animate-spin shrink-0" />
            ) : (
              <Trash2 size={22} className="text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
            )}
            <div className="flex flex-col flex-1 sm:flex-none">
              <span className="text-[10px] text-white/30 font-black uppercase leading-none mb-1">تنظيف السجلات</span>
              <span className="text-xs text-white font-black">{isDeletingOld ? 'جاري التنظيف...' : 'حذف ما قبل 30 يوماً'}</span>
            </div>
          </button>

          <div className="flex items-center justify-center gap-3 bg-white/5 px-6 py-4 sm:py-3 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
            <ShieldCheck size={22} className="text-purple-400 shrink-0" />
            <div className="flex flex-col flex-1 sm:flex-none text-right">
              <span className="text-[10px] text-white/30 font-black uppercase leading-none mb-1">حالة النظام</span>
              <span className="text-xs text-white font-black">مؤمن بالكامل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 print:hidden">
        <div className="lg:col-span-3 relative group">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-500 transition-colors" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن عملية، موظف، أو اسم استاذ/طالب..."
            className="w-full h-16 bg-[#0a0f1d] border border-white/5 rounded-2xl px-14 text-white text-sm outline-none focus:border-purple-500/50 shadow-inner focus:ring-4 ring-purple-500/5 transition-all font-bold placeholder:text-white/10"
          />
        </div>
        <div className="flex bg-[#0a0f1d] p-1.5 rounded-2xl border border-white/5 shadow-inner overflow-x-auto no-scrollbar gap-1">
          {(['all', 'finance', 'codes', 'students', 'broadcast', 'teachers', 'resources', 'support'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 h-full rounded-xl text-[10px] font-black transition-all flex-shrink-0 ${
                filter === f 
                  ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg' 
                  : 'text-white/30 hover:text-white hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'الكل' : 
               f === 'finance' ? 'الموقف المالي والإحصائيات' : 
               f === 'codes' ? 'مركز الأكواد' :
               f === 'students' ? 'شؤون الطلاب والدرجات' : 
               f === 'broadcast' ? 'الإذاعة المدرسية' : 
               f === 'teachers' ? 'الكادر والموظفين' : 
               f === 'resources' ? 'مركز مراقبة المحتوى' : 'الدعم والشكاوى'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table or Mobile View */}
      {!isMobile ? (
        /* Desktop Logs Table */
        <div className="print-section print:p-8 glass-card overflow-hidden border-white/5 shadow-2xl">
        <h2 className="hidden print:block text-2xl font-bold mb-6 text-center border-b pb-4">سجل النشاطات الإدارية - بوابة بيرق</h2>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5">
                <th className="px-8 py-5 text-[11px] font-black text-white/30 uppercase tracking-[0.2em] w-1/4">المسؤول عن الإجراء</th>
                <th className="px-6 py-5 text-[11px] font-black text-white/30 uppercase tracking-[0.2em] text-center w-[120px]">نوع العملية</th>
                <th className="px-6 py-5 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">وصف النشاط التفصيلي</th>
                <th className="px-8 py-5 text-[11px] font-black text-white/30 uppercase tracking-[0.2em] text-left w-1/5">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <p className="text-white/20 font-black text-sm uppercase tracking-widest">جاري استرجاع سجلات الرقابة...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <History size={48} className="text-white/5 mb-2" />
                      <p className="text-white/20 font-black text-sm uppercase tracking-widest">لم يتم العثور على أي نتائج مطابقة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group border-b border-white/5 last:border-0">
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-all border border-white/5 group-hover:border-purple-500/20 shrink-0">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-black group-hover:text-purple-400 transition-colors tracking-tight leading-none mb-1.5">{log.userName}</p>
                          <p className="text-white/20 text-[10px] font-mono tracking-tighter break-all max-w-[200px]">{log.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center align-top">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black border tracking-tighter ${getActionColor(log.action)}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
                        <span className="whitespace-nowrap">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 align-top">
                      <div className="max-w-2xl">
                        <p className="text-white/80 text-xs font-bold leading-relaxed whitespace-pre-line">{log.details}</p>
                        {log.targetName && (
                          <div className="flex items-center gap-2 mt-3 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                            <span className="text-purple-400/40">{getTargetIcon(log.targetType)}</span>
                            <span className="text-amber-500 text-[10px] font-black tracking-tight">{log.targetName}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-left align-top">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-white font-black text-xs bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 group-hover:border-white/10 transition-all">
                          <Clock size={14} className="text-purple-400" />
                          <span>{log.timestamp?.toDate().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/30 font-bold text-[10px] pr-2 whitespace-nowrap">
                          <CalendarIcon size={12} />
                          <span>{log.timestamp?.toDate().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (

      /* Mobile Logs View (Stacked Cards) */
      <div className="space-y-4">
        {loading && logs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/20 font-black text-xs uppercase tracking-widest">جاري استرجاع السجلات...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <History size={48} className="text-white/5 mx-auto mb-4" />
            <p className="text-white/20 font-black text-xs uppercase tracking-widest">لا توجد نتائج</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 border-white/5 shadow-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 opacity-20" />
              
              <div className="space-y-6">
                {/* 1. Responsibile User */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <UserIcon size={14} className="text-purple-400" />
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">المسؤول عن الإجراء</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-purple-400 border border-white/5 shrink-0">
                      <UserIcon size={18} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-black tracking-tight leading-loose">{log.userName}</p>
                      <p className="text-white/20 text-[9px] font-mono break-all line-clamp-1">{log.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Action Type */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Filter size={14} className="text-purple-400" />
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">نوع العملية</span>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black border tracking-tighter ${getActionColor(log.action)}`}>
                    <div className="w-1 h-1 rounded-full bg-current animate-pulse shrink-0" />
                    {log.action}
                  </div>
                </div>

                {/* 3. Details */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle size={14} className="text-purple-400" />
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">وصف النشاط التفصيلي</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-white/80 text-[11px] font-bold leading-relaxed whitespace-pre-line">{log.details}</p>
                    {log.targetName && (
                      <div className="flex items-center gap-2 mt-3 bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="text-purple-400/60">{getTargetIcon(log.targetType)}</span>
                        <span className="text-amber-500 text-[9px] font-black tracking-tight">{log.targetName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Timestamp */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white font-black text-[10px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <Clock size={12} className="text-purple-400" />
                    <span>{log.timestamp?.toDate().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/30 font-bold text-[9px]">
                    <CalendarIcon size={12} />
                    <span>{log.timestamp?.toDate().toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      )}

      {logs.length >= logLimit && !loading && (
        <div className="flex justify-center pt-2 pb-6 print:hidden">
          <button
            onClick={() => {
              setLoadingMore(true);
              setLogLimit(prev => prev + 30);
            }}
            disabled={loadingMore}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-purple-500/30 px-8 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {loadingMore ? <Loader2 size={16} className="animate-spin text-purple-400" /> : <History size={16} className="text-purple-400" />}
            {loadingMore ? 'جاري تحميل المزيد من السجلات...' : 'تحميل سجلات أقدم'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-amber-500/5 to-transparent rounded-3xl border border-amber-500/10 print:hidden">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1">تنبيه أمني</h4>
          <p className="text-[11px] text-white/40 font-bold leading-relaxed">
            هذا السجل هو مرجع قانوني وإداري. العمليات المسجلة لا يمكن حذفها أو تعديلها من قبل أي مسؤول لضمان النزاهة التامة في (بوابة بيرق).
          </p>
        </div>
      </div>
    </div>
  );
};
