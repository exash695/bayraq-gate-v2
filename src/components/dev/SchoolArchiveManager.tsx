import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Download, 
  FileText, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  X, 
  Sparkles,
  ShieldAlert,
  HardDriveDownload,
  AlertTriangle,
  Layers,
  GraduationCap,
  Briefcase,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { schoolArchiveService, SchoolArchiveRecord } from '../../services/schoolArchiveService';

interface SchoolArchiveManagerProps {
  schools: Array<{
    id: string;
    schoolId?: string;
    schoolName?: string;
    name?: string;
    governorate?: string;
    status?: string;
    plan?: string;
    expiryDate?: string;
    subscriptionFee?: number;
    currentStudents?: number;
    maxStudents?: number;
  }>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onRefreshSchools?: () => void;
  initialSelectedSchoolId?: string | null;
  onClose?: () => void;
}

export const SchoolArchiveManager: React.FC<SchoolArchiveManagerProps> = ({
  schools,
  showToast,
  onRefreshSchools,
  initialSelectedSchoolId,
  onClose
}) => {
  const [archives, setArchives] = useState<SchoolArchiveRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<SchoolArchiveRecord | null>(null);
  
  // Create Archive Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSchoolIdForArchive, setSelectedSchoolIdForArchive] = useState<string>(initialSelectedSchoolId || '');
  const [academicPeriod, setAcademicPeriod] = useState<string>('العام الدراسي 2025 - 2026');
  const [archiveReason, setArchiveReason] = useState<string>('انتهاء ترخيص الاشتراك السنوي وأرشفة السجلات الرقمية');
  const [archiveNotes, setArchiveNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');

  // Active Tab inside details modal
  const [detailTab, setDetailTab] = useState<'overview' | 'students' | 'staff' | 'finance' | 'files'>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);

  // Load archives
  const loadArchives = async () => {
    setLoading(true);
    try {
      const data = await schoolArchiveService.fetchArchives();
      setArchives(data);
    } catch (e) {
      console.error(e);
      showToast('❌ تعذر تحميل سجل الأرشيف', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchives();
  }, []);

  useEffect(() => {
    if (initialSelectedSchoolId) {
      setSelectedSchoolIdForArchive(initialSelectedSchoolId);
      setIsCreateOpen(true);
    }
  }, [initialSelectedSchoolId]);

  // Selected school object for preview during creation
  const targetSchool = schools.find(s => (s.schoolId || s.id) === selectedSchoolIdForArchive);

  // Handle Archive Creation
  const handleExecuteArchive = async () => {
    if (!selectedSchoolIdForArchive) {
      showToast('⚠️ يرجى اختيار المدرسة أولاً', 'error');
      return;
    }

    setIsProcessing(true);
    setProcessStep('جاري قراءة وتجميع شؤون الطلاب والدرجات...');

    try {
      await new Promise(r => setTimeout(r, 400));
      setProcessStep('جاري تجميع سجلات الكادر والموظفين والموقف المالي...');
      await new Promise(r => setTimeout(r, 400));
      setProcessStep('جاري فحص وتوثيق المرفقات والملازم والجداول...');
      await new Promise(r => setTimeout(r, 400));
      setProcessStep('جاري إنشاء الحزمة الرقمية المشفرة وتغيير حالة المدرسة إلى Read-Only...');

      const created = await schoolArchiveService.createSchoolArchive(selectedSchoolIdForArchive, {
        academicPeriod,
        archivedReason: archiveReason,
        notes: archiveNotes
      });

      showToast(`✅ تم إنشاء وتوثيق أرشيف مدرسة ${created.schoolName} برقم (${created.archiveNumber}) بنجاح!`);
      setIsCreateOpen(false);
      await loadArchives();
      if (onRefreshSchools) onRefreshSchools();
      setSelectedArchive(created);
    } catch (err: any) {
      console.error('Archiving error:', err);
      showToast(`❌ فشل إنشاء الأرشيف: ${err?.message || 'خطأ غير معروف'}`, 'error');
    } finally {
      setIsProcessing(false);
      setProcessStep('');
    }
  };

  // Filtered archives
  const filteredArchives = archives.filter(arc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (arc.schoolName || '').toLowerCase().includes(term) ||
      (arc.schoolId || '').toLowerCase().includes(term) ||
      (arc.archiveNumber || '').toLowerCase().includes(term) ||
      (arc.academicPeriod || '').toLowerCase().includes(term) ||
      (arc.governorate || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-[#070C1E] via-[#0D1530] to-[#0A1A2F] border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
                <Archive size={26} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  أرشيف المدارس والسجلات الرقمية الدائمة
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    SCHOOL ARCHIVE VAULT
                  </span>
                </h2>
                <p className="text-xs text-white/60 font-bold mt-0.5">
                  أرشفة وحفظ سجلات المدارس المنتهية تراخيصها بشكل منعزل ودائم، مع تحويلها إلى وضع القراءة فقط (Read-Only) دون حذف أي بيانات.
                </p>
              </div>
            </div>

            {/* Compliance Guarantee Banner */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-[11px] text-white/80 flex items-start gap-2.5 max-w-3xl">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-emerald-400">ضمان النزاهة والعزل الرقمي: </span>
                كل أرشيف يتم إنشاؤه مخصص لمعرف المدرسة (School ID) بصورة تامة ومستقلة، ولا يتم حذف أي سجل، وتبقى جميع الملفات والدرجات والحسابات مخزنة سحابياً بشكل آمن ودائم.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setSelectedSchoolIdForArchive('');
                setIsCreateOpen(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer border border-amber-400/40"
            >
              <Archive size={18} />
              <span>إنشاء أرشيف مدرسة جديد 📦</span>
            </button>

            <button
              onClick={loadArchives}
              className="p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl transition-all border border-white/10"
              title="تحديث سجل الأرشيف"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl transition-all border border-white/10"
                title="إغلاق والعودة"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">إجمالي المدارس المؤرشفة</span>
            <Archive size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{archives.length} مدرسة</div>
          <p className="text-[10px] text-amber-400/80 font-bold mt-1">✓ سجلات محفوظة ومعتمدة</p>
        </div>

        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">حالة التخزين والبيانات</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">سحابي دائم 100%</div>
          <p className="text-[10px] text-white/40 font-bold mt-1">بدون تخزين مؤقت أو روابط زائلة</p>
        </div>

        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">وضع الأمان والتعديل</span>
            <ShieldAlert size={18} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">Read-Only</div>
          <p className="text-[10px] text-white/40 font-bold mt-1">حماية ضد التعديل أو الحذف العرضي</p>
        </div>

        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">جاهزية التنزيل والطباعة</span>
            <HardDriveDownload size={18} className="text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-300">JSON + PDF/HTML</div>
          <p className="text-[10px] text-white/40 font-bold mt-1">تصدير شامل مع رمز التحقق QR</p>
        </div>
      </div>

      {/* Archives Log Table Section */}
      <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">سجل الأرشفة والتوثيق السحابي (Archive Records)</h3>
              <p className="text-xs text-white/40">استعراض الأرشيفات الصادرة، تنزيل الحزم الرقمية، وطباعة التقارير الرسمية</p>
            </div>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input
              type="text"
              placeholder="ابحث برقم الأرشيف، اسم المدرسة، المعرف، أو الفترة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-amber-400 font-bold"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 font-bold text-[11px]">
                <th className="pb-3 pr-3">المدرسة المؤرشفة</th>
                <th className="pb-3 px-2">رقم الأرشيف الفريد</th>
                <th className="pb-3 px-2">الفترة الدراسية</th>
                <th className="pb-3 px-2">تاريخ وساعة الإنشاء</th>
                <th className="pb-3 px-2">الجهة الموثقة</th>
                <th className="pb-3 px-2">إجمالي السجلات</th>
                <th className="pb-3 pl-3 text-left">إجراءات الأرشيف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredArchives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive size={36} className="text-white/20" />
                      <p>لا توجد سجلات أرشفة حالياً.</p>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/30"
                      >
                        + إنشاء أول أرشيف مدرسة الآن
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredArchives.map((arc) => (
                  <tr key={arc.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* School Name & ID */}
                    <td className="py-4 pr-3">
                      <div className="font-bold text-white text-sm">{arc.schoolName}</div>
                      <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1.5">
                        <span>{arc.governorate}</span>
                        <span>•</span>
                        <span className="font-mono text-amber-400/90">ID: {arc.schoolId}</span>
                      </div>
                    </td>

                    {/* Archive ID */}
                    <td className="py-4 px-2">
                      <span className="font-mono font-bold text-[11px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        {arc.archiveNumber}
                      </span>
                    </td>

                    {/* Academic Period */}
                    <td className="py-4 px-2">
                      <div className="font-bold text-white/80">{arc.academicPeriod}</div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        🔒 وضع القراءة فقط
                      </span>
                    </td>

                    {/* Creation Date */}
                    <td className="py-4 px-2 font-mono text-[11px] text-white/60">
                      <div>{new Date(arc.createdAt).toLocaleDateString('ar-IQ')}</div>
                      <div className="text-[10px] text-white/40">{new Date(arc.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>

                    {/* Created By */}
                    <td className="py-4 px-2">
                      <div className="text-white/80 font-bold text-[11px]">{arc.createdBy?.name || 'مدير النظام'}</div>
                      <div className="text-[10px] text-white/40 font-mono">{arc.createdBy?.email || '-'}</div>
                    </td>

                    {/* Stats summary */}
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-bold">
                          {arc.stats?.totalStudents || 0} طالب
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-bold">
                          {(arc.stats?.totalTeachers || 0) + (arc.stats?.totalStaff || 0)} كادر
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                          {arc.stats?.totalFiles || 0} ملف
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-3 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedArchive(arc);
                            setDetailTab('overview');
                          }}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-amber-500/30 active:scale-95"
                          title="عرض تفاصيل الأرشيف والسجلات"
                        >
                          <Eye size={14} />
                          <span>عرض السجلات</span>
                        </button>

                        {/* Download JSON */}
                        <button
                          onClick={() => schoolArchiveService.downloadArchiveJSON(arc)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-all border border-white/10"
                          title="تنزيل حزمة الأرشيف الرقمية الشاملة (JSON)"
                        >
                          <Download size={15} />
                        </button>

                        {/* Export / Print Report */}
                        <button
                          onClick={() => schoolArchiveService.downloadArchiveReport(arc)}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl transition-all border border-emerald-500/20"
                          title="طباعة وتصدير تقرير الأرشيف الرسمي المعتمد"
                        >
                          <FileText size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📦 MODAL 1: CREATE SCHOOL ARCHIVE (إنشاء أرشيف مدرسة جديد) */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0A0E23] border border-amber-500/40 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_0_80px_rgba(245,158,11,0.2)] text-right relative my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Archive size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">إنشاء أرشيف مدرسة شامل ومعتمد</h3>
                  <p className="text-[11px] text-white/50">تجميع كافة السجلات الرقمية وتحويل المدرسة إلى وضع القراءة فقط بشكل دائم</p>
                </div>
              </div>
              <button
                disabled={isProcessing}
                onClick={() => setIsCreateOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Select School */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  1. اختر المدرسة المراد أرشفتها:
                </label>
                <select
                  disabled={isProcessing}
                  value={selectedSchoolIdForArchive}
                  onChange={(e) => setSelectedSchoolIdForArchive(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-bold"
                >
                  <option value="" className="bg-[#0A0E23]">-- اضغط لاختيار المدرسة من القائمة --</option>
                  {schools.map(s => {
                    const sid = s.schoolId || s.id;
                    const sname = s.schoolName || s.name || sid;
                    return (
                      <option key={sid} value={sid} className="bg-[#0A0E23]">
                        {sname} (ID: {sid}) - {s.status === 'expired' ? '🔴 ترخيص منتهي' : s.status === 'archived' ? '📦 مؤرشفة مسبقاً' : '🟢 ترخيص سارٍ'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected School Info Preview */}
              {targetSchool && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white">{targetSchool.schoolName || targetSchool.name}</span>
                    <span className="text-amber-300 font-mono">ID: {targetSchool.schoolId || targetSchool.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-white/70">
                    <div>المحافظة: <span className="font-bold text-white">{targetSchool.governorate || 'عام'}</span></div>
                    <div>الباقة: <span className="font-bold text-white">{targetSchool.plan || 'standard'}</span></div>
                    <div>الطلاب المسجلين: <span className="font-bold text-white">{targetSchool.currentStudents || 0} طالب</span></div>
                  </div>
                </div>
              )}

              {/* Academic Period */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  2. الفترة الدراسية للأرشيف:
                </label>
                <input
                  disabled={isProcessing}
                  type="text"
                  value={academicPeriod}
                  onChange={(e) => setAcademicPeriod(e.target.value)}
                  placeholder="مثال: العام الدراسي 2025 - 2026 أو الفصل الثاني 2026"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-bold"
                />
              </div>

              {/* Archival Reason */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  3. سبب وإقرار الأرشفة:
                </label>
                <input
                  disabled={isProcessing}
                  type="text"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="مثال: انتهاء ترخيص الاشتراك السنوي وأرشفة السجلات الرقمية"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-bold"
                />
              </div>

              {/* Additional Archival Notes */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  4. ملاحظات إضافية (اختياري):
                </label>
                <textarea
                  disabled={isProcessing}
                  rows={2}
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="أي تفاصيل أو ملاحظات تنظيمية للأرشيف..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-bold resize-none"
                />
              </div>

              {/* Data Integrity Checklist */}
              <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-1.5 text-[11px] text-white/80">
                <div className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                  <CheckCircle2 size={14} className="text-amber-400" />
                  <span>معايير الأمان والتخزين الدائم المطبقة:</span>
                </div>
                <div className="flex items-center gap-2">✓ تجميع شؤون الطلاب، الدرجات، الحضور والغياب، والسلوك والانضباط.</div>
                <div className="flex items-center gap-2">✓ تجميع الكادر التدريسي، الموظفين، الموقف المالي، والاشتراكات.</div>
                <div className="flex items-center gap-2">✓ حفظ دائم للملفات والملازم المرفوعة في قاعدة البيانات السحابية.</div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">✓ تحويل حالة المدرسة إلى مؤرشفة (Read-Only) دون حذف أي سجل.</div>
              </div>

              {/* Progress Indicator */}
              {isProcessing && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
                    <RefreshCw size={16} className="animate-spin text-amber-400" />
                    <span>{processStep || 'جاري معالجة وحفظ الأرشيف...'}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full w-2/3 animate-pulse rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-white/10">
              <button
                disabled={isProcessing}
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                disabled={isProcessing || !selectedSchoolIdForArchive}
                onClick={handleExecuteArchive}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Archive size={16} />
                <span>{isProcessing ? 'جاري الإنشاء والتوثيق...' : 'تأكيد إنشاء وحفظ الأرشيف 📦'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL 2: VIEW ARCHIVE DETAILS (عرض وتصفح تفاصيل وسجلات الأرشيف) */}
      {/* ========================================================================= */}
      {selectedArchive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0A0F26] border border-amber-500/40 rounded-3xl p-4 sm:p-6 max-w-5xl w-full shadow-[0_0_80px_rgba(245,158,11,0.2)] text-right relative my-auto animate-in fade-in zoom-in-95 duration-200 space-y-4 max-h-[90vh] flex flex-col">
            
            {/* Header & Quick Action Buttons */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl border-2 border-amber-500/50 bg-[#070C1E] flex items-center justify-center overflow-hidden shadow-lg shadow-amber-500/20 shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="شعار البوابة" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-amber-400 font-black text-xs font-mono hidden">G6</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>أرشيف مدرسة {selectedArchive.schoolName}</span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedArchive.archiveNumber}
                    </span>
                  </h3>
                  <p className="text-xs text-white/50">
                    الفترة: {selectedArchive.academicPeriod} • تاريخ التوثيق: {new Date(selectedArchive.createdAt).toLocaleString('ar-IQ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Download JSON */}
                <button
                  onClick={() => schoolArchiveService.downloadArchiveJSON(selectedArchive)}
                  className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-500/30 active:scale-95 cursor-pointer"
                  title="تنزيل الحزمة الرقمية الشاملة"
                >
                  <Download size={15} />
                  <span>تنزيل الأرشيف (JSON)</span>
                </button>

                {/* Print Official Report */}
                <button
                  onClick={() => schoolArchiveService.downloadArchiveReport(selectedArchive)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/30 active:scale-95 cursor-pointer"
                  title="طباعة وتصدير التقرير الرسمي المعتمد بشعار البوابة"
                >
                  <FileText size={15} />
                  <span>تقرير رسمي / طباعة معتمدة (A4) 🖨️</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 shrink-0">
              <button
                onClick={() => setDetailTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  detailTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Layers size={15} />
                <span>نظرة عامة وملف المدرسة</span>
              </button>

              <button
                onClick={() => setDetailTab('students')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  detailTab === 'students'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={15} />
                <span>شؤون الطلاب والدرجات ({selectedArchive.students?.length || 0})</span>
              </button>

              <button
                onClick={() => setDetailTab('staff')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  detailTab === 'staff'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <GraduationCap size={15} />
                <span>الكادر والموظفون ({(selectedArchive.teachersAndStaff?.length || 0)})</span>
              </button>

              <button
                onClick={() => setDetailTab('finance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  detailTab === 'finance'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <DollarSign size={15} />
                <span>الموقف المالي الشامل</span>
              </button>

              <button
                onClick={() => setDetailTab('files')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  detailTab === 'files'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <FileCheck size={15} />
                <span>المرفقات والتعاميم ({selectedArchive.filesAndAttachments?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              
              {/* TAB 1: OVERVIEW */}
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">الطلاب والدرجات</div>
                      <div className="text-xl font-black text-amber-300">{selectedArchive.stats?.totalStudents || 0}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">الكادر التعليمي والإداري</div>
                      <div className="text-xl font-black text-white">{(selectedArchive.stats?.totalTeachers || 0) + (selectedArchive.stats?.totalStaff || 0)}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">الصفوف والشعب الموثقة</div>
                      <div className="text-xl font-black text-indigo-300">
                        {selectedArchive.academicLists?.length || selectedArchive.stats?.totalAcademicLists || 1} صفوف
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">إجمالي التحصيل المالي</div>
                      <div className="text-xl font-black text-emerald-400">
                        {((selectedArchive.financials?.summary?.totalCollected || selectedArchive.stats?.totalPaymentsAmount || 0)).toLocaleString()} د.ع
                      </div>
                    </div>
                  </div>

                  {/* School Contract & Archival Meta */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                      <Building2 size={16} />
                      <span>بيانات المدرسة والتوثيق التعاقدي:</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>المعرف الرقمي: <span className="font-mono text-white font-bold">{selectedArchive.schoolId}</span></div>
                      <div>المحافظة: <span className="text-white font-bold">{selectedArchive.governorate}</span></div>
                      <div>باقة الترخيص: <span className="text-white font-bold">{selectedArchive.schoolProfile?.plan || '-'}</span></div>
                      <div>رقم الوصل: <span className="font-mono text-amber-300 font-bold">{selectedArchive.schoolProfile?.receiptNumber || '-'}</span></div>
                      <div>رقم الترخيص: <span className="font-mono text-white font-bold">{selectedArchive.schoolProfile?.licenseNumber || '-'}</span></div>
                      <div>حالة الأرشيف: <span className="text-emerald-400 font-bold">🔒 مؤرشف (Read-Only)</span></div>
                    </div>
                  </div>

                  {/* Audit Trail info */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-white flex items-center gap-2">
                      <Clock size={16} className="text-indigo-400" />
                      <span>سجل التدقيق والمصادقة:</span>
                    </h4>
                    <div className="text-xs text-white/70 space-y-1">
                      <div>الجهة الموثقة للأرشيف: <strong className="text-white">{selectedArchive.createdBy?.name}</strong> ({selectedArchive.createdBy?.email})</div>
                      <div>تاريخ وتوقيت الأرشفة: <strong className="text-white">{new Date(selectedArchive.createdAt).toLocaleString('ar-IQ')}</strong></div>
                      <div>سبب الأرشفة: <span className="text-white">{selectedArchive.archivedReason}</span></div>
                      {selectedArchive.notes && <div>ملاحظات إضافية: <span className="text-white/90">{selectedArchive.notes}</span></div>}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STUDENTS & GRADES (حرفياً حسب الصفوف والدرجات) */}
              {detailTab === 'students' && (
                <div className="space-y-4">
                  {/* Top Bar: Search & Classes Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-300">الصفوف الدراسية:</span>
                      {(selectedArchive.academicLists && selectedArchive.academicLists.length > 0) ? (
                        selectedArchive.academicLists.map((cls: any, cIdx: number) => (
                          <button
                            key={cIdx}
                            onClick={() => setSelectedClassIndex(cIdx)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedClassIndex === cIdx
                                ? 'bg-amber-500 text-slate-950 font-black shadow'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {cls.name || cls.grade || `صف ${cIdx + 1}`} ({cls.students?.length || 0})
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-white/50">جميع الطلاب المسجلين</span>
                      )}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" size={13} />
                      <input
                        type="text"
                        placeholder="ابحث باسم الطالب أو الكود..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Render Class Table with exact subject columns */}
                  {(() => {
                    const currentClass = selectedArchive.academicLists?.[selectedClassIndex] || {
                      name: 'سجل الطلاب والدرجات',
                      grade: 'عام',
                      subjects: [
                        { id: 'islamic', name: 'التربية الإسلامية' },
                        { id: 'arabic', name: 'اللغة العربية' },
                        { id: 'english', name: 'اللغة الانجليزية' },
                        { id: 'math', name: 'الرياضيات' },
                        { id: 'science', name: 'العلوم' }
                      ],
                      students: selectedArchive.students || []
                    };

                    const classSubjects: any[] = currentClass.subjects || [];
                    const filteredStudents = (currentClass.students || []).filter((s: any) => {
                      if (!studentSearch) return true;
                      const t = studentSearch.toLowerCase();
                      return (s.name || '').toLowerCase().includes(t) || (s.code || '').toLowerCase().includes(t);
                    });

                    return (
                      <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/30">
                        <div className="bg-white/5 px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                          <div className="font-bold text-xs text-white flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                              {currentClass.name || currentClass.grade}
                            </span>
                            <span>كشف درجات وسجلات الطلاب الحرفي</span>
                          </div>
                          <div className="text-[11px] text-white/60">
                            عدد الطلاب: <strong className="text-white">{filteredStudents.length}</strong> طالب
                          </div>
                        </div>

                        <div className="overflow-x-auto max-h-[500px]">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-white/[0.04] text-white/70 sticky top-0 backdrop-blur-md">
                              <tr>
                                <th className="p-2.5 text-center w-10">#</th>
                                <th className="p-2.5 min-w-[130px]">اسم الطالب</th>
                                <th className="p-2.5 text-center min-w-[85px]">كود الطالب</th>
                                <th className="p-2.5 text-center min-w-[85px]">كود ولي الأمر</th>
                                {classSubjects.map((sub: any) => (
                                  <th key={sub.id} className="p-2 text-center text-[11px] min-w-[65px] text-amber-200/90 font-bold border-r border-white/5">
                                    {sub.name}
                                  </th>
                                ))}
                                <th className="p-2.5 text-center min-w-[60px] text-amber-300">المعدل</th>
                                <th className="p-2.5 text-center min-w-[60px]">المجموع</th>
                                <th className="p-2.5 text-center min-w-[70px]">التميز</th>
                                <th className="p-2.5 text-center min-w-[85px]">الموقف المالي</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {filteredStudents.map((s: any, idx: number) => {
                                const currentMarks = s.currentMarks || s.grades?.month1 || s.grades || {};
                                const avg = s.average !== undefined ? s.average : '-';
                                const total = s.totalScore !== undefined ? s.totalScore : '-';
                                const finStatus = s.financial?.status || (s.paid ? 'paid' : 'unpaid');
                                const isPaid = finStatus === 'paid';
                                const isPartial = finStatus === 'partial';

                                return (
                                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                                    <td className="p-2.5 text-center text-white/40">{idx + 1}</td>
                                    <td className="p-2.5 font-bold text-white whitespace-nowrap">{s.name || 'طالب'}</td>
                                    <td className="p-2.5 text-center font-mono text-amber-300">{s.code || '-'}</td>
                                    <td className="p-2.5 text-center font-mono text-white/50">{s.parentCode || '-'}</td>
                                    {classSubjects.map((sub: any) => {
                                      const mark = currentMarks[sub.id];
                                      const hasMark = mark !== undefined && mark !== null && mark !== '';
                                      const numMark = Number(mark);
                                      const isLow = !isNaN(numMark) && numMark < 50;

                                      return (
                                        <td key={sub.id} className="p-2 text-center font-mono border-r border-white/5">
                                          {hasMark ? (
                                            <span className={`font-bold ${isLow ? 'text-rose-400' : 'text-white'}`}>
                                              {mark}
                                            </span>
                                          ) : (
                                            <span className="text-white/20">-</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="p-2.5 text-center font-mono font-black text-amber-300 bg-white/[0.02]">
                                      {avg}
                                    </td>
                                    <td className="p-2.5 text-center font-mono text-white/70">
                                      {total}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      {s.isTopStudent ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                          ⭐ متميز
                                        </span>
                                      ) : (
                                        <span className="text-white/30 text-[11px]">{s.excellencePoints ? `${s.excellencePoints} ن` : '-'}</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        isPaid
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : isPartial
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      }`}>
                                        {isPaid ? 'مسدد ✓' : isPartial ? 'جزئي' : 'مستحق'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: STAFF & TEACHERS */}
              {detailTab === 'staff' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white/70">
                    أعضاء الكادر التعليمي والإداري ({selectedArchive.teachersAndStaff?.length || 0} عضو)
                  </div>
                  <div className="overflow-x-auto border border-white/10 rounded-2xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">الاسم</th>
                          <th className="p-2.5">الدور والصفة</th>
                          <th className="p-2.5">المادة / القسم</th>
                          <th className="p-2.5">رقم الهاتف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(selectedArchive.teachersAndStaff || []).map((t, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="p-2.5 text-white/40">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-white">{t.name || '-'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                t.role === 'STAFF' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {t.role === 'STAFF' ? 'كادر إداري' : 'معلم / أستاذ'}
                              </span>
                            </td>
                            <td className="p-2.5 text-white/70">{t.subject || t.department || 'عام'}</td>
                            <td className="p-2.5 font-mono text-white/60" dir="ltr">{t.phone || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: COMPLETE FINANCIAL POSITION (الموقف المالي بالكامل) */}
              {detailTab === 'finance' && (
                <div className="space-y-4">
                  {/* Financial KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">إجمالي الأقساط المقررة</div>
                      <div className="text-base sm:text-lg font-black text-white">
                        {(selectedArchive.financials?.summary?.totalRequired || 0).toLocaleString()} د.ع
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">إجمالي المحصل الفعلي</div>
                      <div className="text-base sm:text-lg font-black text-emerald-400">
                        {(selectedArchive.financials?.summary?.totalCollected || 0).toLocaleString()} د.ع
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">المتبقيات والذمم</div>
                      <div className="text-base sm:text-lg font-black text-rose-400">
                        {(selectedArchive.financials?.summary?.totalOutstanding || 0).toLocaleString()} د.ع
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
                      <div className="text-[10px] text-white/50 font-bold mb-1">نسبة التحصيل</div>
                      <div className="text-base sm:text-lg font-black text-amber-300">
                        {selectedArchive.financials?.summary?.collectionRate || 100}%
                      </div>
                    </div>
                  </div>

                  {/* Student Financial Installments Table */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/20">
                    <div className="bg-white/5 px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
                      <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
                        <DollarSign size={15} />
                        <span>كشف الأقساط والموقف المالي لجميع الطلاب:</span>
                      </h4>
                      <span className="text-[11px] text-white/50">
                        {selectedArchive.financials?.studentInstallments?.length || selectedArchive.students?.length || 0} طالب
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-[350px]">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-white/5 text-white/60 sticky top-0 backdrop-blur-md">
                          <tr>
                            <th className="p-2.5 text-center w-10">#</th>
                            <th className="p-2.5">اسم الطالب</th>
                            <th className="p-2.5 text-center">الصف</th>
                            <th className="p-2.5 text-center">كود الطالب</th>
                            <th className="p-2.5 text-center">القسط السنوي</th>
                            <th className="p-2.5 text-center">المسدد</th>
                            <th className="p-2.5 text-center">المتبقي</th>
                            <th className="p-2.5 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(selectedArchive.financials?.studentInstallments || selectedArchive.students || []).map((inst: any, idx: number) => {
                            const tuition = Number(inst.tuitionRequired || inst.financial?.totalRequired || inst.totalAmount || 1200000);
                            const paid = Number(inst.paidAmount || inst.financial?.paidAmount || (inst.paid ? tuition : 0));
                            const rem = Number(inst.remainingAmount || Math.max(0, tuition - paid));
                            const isPaid = paid >= tuition || inst.status === 'paid' || inst.financial?.status === 'paid';
                            const isPartial = !isPaid && paid > 0;

                            return (
                              <tr key={idx} className="hover:bg-white/[0.02]">
                                <td className="p-2.5 text-center text-white/40">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-white">{inst.name || 'طالب'}</td>
                                <td className="p-2.5 text-center text-white/70">{inst.grade || '-'}</td>
                                <td className="p-2.5 text-center font-mono text-amber-300">{inst.code || '-'}</td>
                                <td className="p-2.5 text-center font-mono text-white">{tuition.toLocaleString()} د.ع</td>
                                <td className="p-2.5 text-center font-mono text-emerald-400 font-bold">{paid.toLocaleString()} د.ع</td>
                                <td className="p-2.5 text-center font-mono text-rose-400 font-bold">{rem.toLocaleString()} د.ع</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    isPaid
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : isPartial
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
                                    {isPaid ? 'مسدد بالكامل ✓' : isPartial ? 'سداد جزئي' : 'مستحق'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* School Platform License Details */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black text-amber-300">تفاصيل ترخيص المنصة وعقد الاشتراك السنوي:</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>قيمة اشتراك المنصة: <span className="font-bold text-white">{(selectedArchive.schoolProfile?.subscriptionFee || 0).toLocaleString()} د.ع</span></div>
                      <div>حالة سداد الترخيص: <span className="font-bold text-emerald-400">{selectedArchive.schoolProfile?.paymentStatus === 'paid' ? 'مسدد بالكامل ✓' : 'جزئي'}</span></div>
                      <div>رقم الوصل المعتمد: <span className="font-mono text-amber-300 font-bold">{selectedArchive.schoolProfile?.receiptNumber || '-'}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: FILES & BROADCASTS */}
              {detailTab === 'files' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white/70">
                    الملفات والملازم المؤرشفة ({selectedArchive.filesAndAttachments?.length || 0} ملف)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedArchive.filesAndAttachments || []).map((file, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-white">{file.title || file.name || 'ملف دراسي'}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">
                            المادة: {file.subject || '-'} • الصف: {file.grade || '-'}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                          {file.size || 'ملف معتمد'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
