import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
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
  Download,
  X
} from 'lucide-react';
import { auditService, AuditLog } from '../services/auditService';
import { ConfirmDialog } from './ConfirmDialog';

interface AuditLogViewProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [logLimit, setLogLimit] = useState(30);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearScope, setClearScope] = useState<'all' | '7days' | '30days'>('all');
  const [isClearing, setIsClearing] = useState(false);
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'students' | 'codes' | 'finance' | 'broadcast' | 'teachers' | 'resources' | 'support' | 'portal_pulse' | 'ideas_bank' | 'sovereignty' | 'transport' | 'discipline'>('all');

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadLogs = async (limitVal: number) => {
    try {
      setLoading(true);
      const data = await auditService.fetchLogs(limitVal);
      setLogs(data);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(logLimit);
  }, [logLimit]);

  const handleExecuteClear = async () => {
    setIsClearing(true);
    try {
      let res: { success: boolean; count?: number; message?: string };
      if (clearScope === 'all') {
        res = await auditService.clearAllLogs();
      } else if (clearScope === '7days') {
        res = await auditService.clearOldLogs(7);
      } else {
        res = await auditService.clearOldLogs(30);
      }

      const deletedCount = res.count ?? 0;
      if (deletedCount > 0) {
        showToast(res.message || `تم تنظيف ${deletedCount} سجل بنجاح.`, 'success');
        if (clearScope === 'all') {
          setLogs([]);
        } else {
          await loadLogs(logLimit);
        }
      } else {
        showToast(res.message || 'لا توجد سجلات تطابق شرط الحذف المختار.', 'info');
        await loadLogs(logLimit);
      }
      setShowClearModal(false);
    } catch (error: any) {
      console.error("Error clearing logs:", error);
      showToast(error.message || "حدث خطأ أثناء محاولة تنظيف السجلات.", "error");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingleLog = async (log: AuditLog) => {
    try {
      await auditService.deleteLog(log.id);
      setLogs(prev => prev.filter(l => l.id !== log.id));
      showToast(`تم حذف سجل (${log.action}) بنجاح.`, 'success');
      setLogToDelete(null);
    } catch (error: any) {
      console.error("Error deleting log:", error);
      showToast(error.message || "فشل حذف السجل", "error");
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
                const date = log.timestamp ? new Date(log.timestamp).toLocaleString('ar-IQ') : 'غير محدد';
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>
                      <strong style="font-family: monospace;">${getDisplayUserEmail(log)}</strong><br/>
                      ${log.userName && log.userName !== getDisplayUserEmail(log) && log.userName !== 'الإدارة العامة' ? `<span style="color: #666; font-size: 11px;">${log.userName}</span>` : ''}
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
        return matchesSearch && (log.targetType === 'codes_generation' || log.targetType === 'activation_codes');
      case 'portal_pulse':
        return matchesSearch && (log.targetType?.includes('pulse') || log.action.includes('تجميد') || log.targetType === 'account_freeze');
      case 'ideas_bank':
        return matchesSearch && log.targetType === 'ideas_bank';
      case 'sovereignty':
        return matchesSearch && log.targetType === 'sovereignty';
      case 'transport':
        return matchesSearch && (log.targetType === 'transport' || log.action.includes('نقل') || log.action.includes('باص'));
      case 'discipline':
        return matchesSearch && (log.targetType === 'discipline' || log.action.includes('سلوك') || log.action.includes('انضباط') || log.targetType === 'behavior_logs' || log.targetType === 'attendance_logs');
      default:
        return matchesSearch;
    }
  });

  const getDisplayUserEmail = (log: AuditLog) => {
    if (log.userEmail && log.userEmail.includes('@')) {
      return log.userEmail;
    }
    if (log.userName && log.userName.includes('@')) {
      return log.userName;
    }
    return 'abdulradhaalmayali@gmail.com';
  };

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
            onClick={() => setShowClearModal(true)}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-rose-500/10 px-6 py-4 sm:py-3 rounded-2xl border border-white/10 hover:border-rose-500/20 backdrop-blur-sm transition-all group text-right shadow-xl"
          >
            <Trash2 size={22} className="text-rose-400 group-hover:scale-110 transition-transform shrink-0" />
            <div className="flex flex-col flex-1 sm:flex-none">
              <span className="text-[10px] text-white/30 font-black uppercase leading-none mb-1">تنظيف السجلات</span>
              <span className="text-xs text-white font-black">خيارات الحذف والتنظيف</span>
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
          {(['all', 'portal_pulse', 'finance', 'codes', 'students', 'discipline', 'transport', 'resources', 'broadcast', 'ideas_bank', 'sovereignty', 'teachers', 'support'] as const).map((f) => (
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
               f === 'portal_pulse' ? 'نبض البوابة' :
               f === 'finance' ? 'الموقف المالي والإحصائيات' : 
               f === 'codes' ? 'مركز الأكواد' :
               f === 'students' ? 'شؤون الطلاب والدرجات' : 
               f === 'discipline' ? 'سجل الانضباط المدرسي' :
               f === 'transport' ? 'ادارة النقل المدرسي' :
               f === 'broadcast' ? 'الإذاعة المدرسية' : 
               f === 'teachers' ? 'الكادر والموظفين' : 
               f === 'resources' ? 'مركز مراقبة المحتوى' :
               f === 'ideas_bank' ? 'بنك الافكار' :
               f === 'sovereignty' ? 'منصة السيادة' : 'الدعم والشكاوى'}
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
                <th className="px-4 py-5 text-[11px] font-black text-white/30 uppercase tracking-[0.2em] text-center w-[60px] print:hidden">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <p className="text-white/20 font-black text-sm uppercase tracking-widest">جاري استرجاع سجلات الرقابة...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-32 text-center">
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
                          <p className="text-white text-xs sm:text-sm font-black group-hover:text-purple-400 transition-colors tracking-tight leading-none mb-1.5 font-mono">
                            {getDisplayUserEmail(log)}
                          </p>
                          {log.userName && log.userName !== getDisplayUserEmail(log) && log.userName !== 'الإدارة العامة' && (
                            <p className="text-white/40 text-[10px] tracking-tight">{log.userName}</p>
                          )}
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
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/30 font-bold text-[10px] pr-2 whitespace-nowrap">
                          <CalendarIcon size={12} />
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '---'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-center align-middle print:hidden">
                      <button
                        onClick={() => setLogToDelete(log)}
                        title="حذف هذا السجل نهائياً"
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 flex items-center justify-center transition-all opacity-60 group-hover:opacity-100 mx-auto"
                      >
                        <Trash2 size={15} />
                      </button>
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
                <div className="flex items-start justify-between">
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
                        <p className="text-white text-xs sm:text-sm font-black tracking-tight leading-tight mb-1 font-mono break-all">{getDisplayUserEmail(log)}</p>
                        {log.userName && log.userName !== getDisplayUserEmail(log) && log.userName !== 'الإدارة العامة' && (
                          <p className="text-white/40 text-[10px] tracking-tight">{log.userName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setLogToDelete(log)}
                    title="حذف هذا السجل"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all shrink-0 mt-1"
                  >
                    <Trash2 size={16} />
                  </button>
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
                    <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : '---'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/30 font-bold text-[9px]">
                    <CalendarIcon size={12} />
                    <span>{log.timestamp ? new Date(log.timestamp).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' }) : '---'}</span>
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
            هذا السجل هو مرجع قانوني وإداري. العمليات المسجلة لا يمكن استرجاعها بعد الحذف لضمان النزاهة التامة في (بوابة بيرق).
          </p>
        </div>
      </div>

      {/* Clear Modal */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1021] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-right"
            >
              {/* Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -translate-y-20 -translate-x-20" />
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">إدارة وتنظيف السجلات</h3>
                    <p className="text-xs text-white/40 font-bold mt-0.5">اختر نطاق الحذف المناسب من قاعدة البيانات</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowClearModal(false)}
                  disabled={isClearing}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6 relative z-10">
                {/* Option 1: Clear All */}
                <div 
                  onClick={() => setClearScope('all')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    clearScope === 'all'
                      ? 'bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-950/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    clearScope === 'all' ? 'border-rose-500 bg-rose-500' : 'border-white/20'
                  }`}>
                    {clearScope === 'all' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">مسح كافة السجلات بالكامل (تفريغ السجل)</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        مسح 100%
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 font-bold mt-1 leading-relaxed">
                      حذف جميع سجلات العمليات المسجلة في النظام نهائياً (الحالية والسابقة).
                    </p>
                  </div>
                </div>

                {/* Option 2: Older than 7 days */}
                <div 
                  onClick={() => setClearScope('7days')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    clearScope === '7days'
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-950/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    clearScope === '7days' ? 'border-amber-500 bg-amber-500' : 'border-white/20'
                  }`}>
                    {clearScope === '7days' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">حذف ما قبل 7 أيام</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        أقدم من أسبوع
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 font-bold mt-1 leading-relaxed">
                      الإبقاء على نشاطات الأسبوع الأخير وحذف العمليات الأقدم.
                    </p>
                  </div>
                </div>

                {/* Option 3: Older than 30 days */}
                <div 
                  onClick={() => setClearScope('30days')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                    clearScope === '30days'
                      ? 'bg-blue-500/15 border-blue-500/50 shadow-lg shadow-blue-950/30'
                      : 'bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    clearScope === '30days' ? 'border-blue-500 bg-blue-500' : 'border-white/20'
                  }`}>
                    {clearScope === '30days' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">حذف ما قبل 30 يوماً</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        أقدم من شهر
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 font-bold mt-1 leading-relaxed">
                      تنظيف الأرشيف المتراكم لأكثر من شهر والإبقاء على نشاطات الشهر الحالي.
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Note */}
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3 relative z-10">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/60 font-bold leading-relaxed">
                  {clearScope === 'all' 
                    ? `سيتم حذف جميع السجلات المعروضة في الشاشة (${logs.length} سجل) بشكل فوري من قاعدة البيانات.`
                    : clearScope === '7days'
                    ? 'سيتم حذف العمليات المسجلة قبل أكثر من 7 أيام فقط، ولن تتأثر نشاطات هذا الأسبوع.'
                    : 'سيتم حذف العمليات المسجلة قبل أكثر من 30 يوماً فقط، ولن تتأثر نشاطات هذا الشهر.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 relative z-10">
                <button
                  onClick={() => setShowClearModal(false)}
                  disabled={isClearing}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/5"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleExecuteClear}
                  disabled={isClearing}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isClearing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>جاري الحذف...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>تأكيد الحذف الآن</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Individual Log Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={async () => {
          if (logToDelete) {
            await handleDeleteSingleLog(logToDelete);
          }
        }}
        title="تأكيد حذف السجل"
        message={logToDelete ? `هل أنت متأكد من حذف هذا السجل نهائياً؟\n(${logToDelete.action} - ${logToDelete.userName})` : ''}
        confirmText="نعم، احذف السجل"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
};
