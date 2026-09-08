import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  UserCheck, 
  Sparkles, 
  Plus, 
  Copy, 
  Check, 
  Printer, 
  Trash2, 
  RefreshCw, 
  Search, 
  MapPin, 
  Phone, 
  FileText, 
  Layers, 
  QrCode, 
  ShieldCheck,
  AlertCircle,
  Download
} from 'lucide-react';

interface Instructor {
  id: string;
  name: string;
  subject: string;
  grade: string;
  code?: string;
  phone?: string;
  bio?: string;
  schoolId?: string;
  createdAt?: string;
}

interface StudentCode {
  id: string;
  code: string;
  role: string;
  schoolId: string;
  used: boolean;
  usedBy?: string;
  createdAt?: string;
}

export const AcademyManagementSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate_teacher' | 'generate_students' | 'instructors_list' | 'students_codes'>('generate_teacher');
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [studentCodes, setStudentCodes] = useState<StudentCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form for New Instructor Master Key
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('الرياضيات');
  const [teacherGrade, setTeacherGrade] = useState('السادس العلمي');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [teacherBio, setTeacherBio] = useState('');

  // Form for Student Scratch Cards Batch
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [batchBookstore, setBatchBookstore] = useState('مكتبة المتنبي المركزية');
  const [batchCount, setBatchCount] = useState<number>(25);
  const [batchPrefix, setBatchPrefix] = useState('ACAD-MATH');

  // Printable Cards Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [generatedBatchForPrint, setGeneratedBatchForPrint] = useState<{
    instructorName: string;
    subject: string;
    grade: string;
    bookstore: string;
    codes: string[];
  } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch teachers for school8
      const tchRes = await fetch('/api/teachers?schoolId=school8');
      if (tchRes.ok) {
        const tchData = await tchRes.json();
        setInstructors(tchData.teachers || []);
      }

      // 2. Fetch activation codes for school8
      const codeRes = await fetch('/api/activation-codes?schoolId=school8');
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setStudentCodes(codeData.codes || []);
      }
    } catch (err: any) {
      console.error('Error loading academy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate Instructor Master Key
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) {
      setErrorMessage('يرجى كتابة اسم الأستاذ');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const generatedCode = teacherCode.trim() || `PROF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const teacherId = `tch_acad_${Date.now()}`;

      // 1. Insert teacher record
      const resTeacher = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: teacherId,
          schoolId: 'school8',
          name: teacherName.trim(),
          subject: teacherSubject,
          grade: teacherGrade,
          phone: teacherPhone.trim(),
          code: generatedCode,
          bio: teacherBio.trim() || `أستاذ مادة ${teacherSubject} في أكاديمية بيرق الرقمية`,
          role: 'TEACHER',
          canPublish: true,
          isActive: true
        })
      });

      if (!resTeacher.ok) throw new Error('فشل حفظ بيانات الأستاذ');

      // 2. Insert activation code for teacher
      await fetch('/api/activation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: generatedCode,
          schoolId: 'school8',
          role: 'teacher'
        })
      });

      setSuccessMessage(`تم توليد كود الأستاذ بنجاح! الكود: ${generatedCode}`);
      setTeacherName('');
      setTeacherCode('');
      setTeacherPhone('');
      setTeacherBio('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء كود الأستاذ');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Batch Student Scratch Cards for Bookstores
  const handleGenerateStudentBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const count = Number(batchCount) || 10;
      const instructor = instructors.find(i => i.id === selectedInstructorId);
      const prefix = batchPrefix.trim() || 'ACAD';

      const res = await fetch('/api/activation-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: 'school8',
          role: 'student',
          count,
          prefix
        })
      });

      if (!res.ok) throw new Error('فشل توليد كروت الطلاب');

      const data = await res.json();
      const generatedCodesList = (data.codes || []).map((c: any) => c.code);

      setGeneratedBatchForPrint({
        instructorName: instructor?.name || 'نخبة الأساتذة',
        subject: instructor?.subject || 'المنهج الوزاري',
        grade: instructor?.grade || 'السادس العلمي',
        bookstore: batchBookstore,
        codes: generatedCodesList
      });

      setShowPrintModal(true);
      setSuccessMessage(`تم توليد ${generatedCodesList.length} كرت اشتراك بنجاح لمكتبة ${batchBookstore}`);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء توليد الكروت');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الأستاذ؟')) return;
    try {
      await fetch(`/api/teachers/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الكود؟')) return;
    try {
      await fetch(`/api/activation-codes/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-right" dir="rtl">
      
      {/* Header & Stats Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/20 via-indigo-500/15 to-[#0A0F22] border border-amber-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-400/30">
              <GraduationCap size={14} />
              <span>محرك أكاديمية بيرق الرقمية</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              إدارة دورات الأساتذة وتوليد كروت المكاتب
            </h2>
            <p className="text-xs text-white/60">
              توليد أكواد الأساتذة المحاضرين، وإنشاء بطاقات الاشتراك للطلاب لتوزيعها على المكاتب المعتمدة
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 text-white text-xs font-bold flex items-center gap-2 transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>تحديث البيانات</span>
          </button>

        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-white/60">الأساتذة المسجلين</span>
            <p className="text-xl font-black text-amber-400 mt-0.5">{instructors.length}</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-white/60">كروت الطلاب المولدة</span>
            <p className="text-xl font-black text-cyan-400 mt-0.5">{studentCodes.length}</p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-white/60">الكروت المفعلة</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {studentCodes.filter(c => c.used).length}
            </p>
          </div>
          <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-center">
            <span className="text-[11px] text-white/60">الكروت المتاحة بالمكاتب</span>
            <p className="text-xl font-black text-purple-400 mt-0.5">
              {studentCodes.filter(c => !c.used).length}
            </p>
          </div>
        </div>
      </div>

      {/* Action Messages */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <ShieldCheck size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'generate_teacher', label: '✨ توليد كود الأستاذ المحاضر', icon: GraduationCap },
          { id: 'generate_students', label: '🎟️ توليد كروت الطلاب للمكاتب', icon: QrCode },
          { id: 'instructors_list', label: '👨‍🏫 قائمة الأساتذة والدورات', icon: UserCheck },
          { id: 'students_codes', label: '📋 أرشيف كروت الاشتراك', icon: FileText },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSuccessMessage('');
                setErrorMessage('');
              }}
              className={`px-4 py-2.5 rounded-xl font-black text-xs whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-amber-400 text-black shadow-lg scale-[1.02]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content for Tabs */}

      {/* Tab 1: Generate Teacher Master Key */}
      {activeTab === 'generate_teacher' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0F22] border border-amber-500/20 rounded-3xl p-6 space-y-5"
        >
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">تسجيل أستاذ محاضر وتوليد الكود الرئيسي</h3>
            <p className="text-xs text-white/60">
              هذا الكود يفتح للأستاذ لوحة التحكم لرفع الملازم وإطلاق تحديات الـ 60 ثانية والتواصل مع الطلاب
            </p>
          </div>

          <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">اسم الأستاذ الكامل *</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                placeholder="مثال: أ. حيدر وليد"
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">المادة الدراسية *</label>
              <select
                value={teacherSubject}
                onChange={e => setTeacherSubject(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="الرياضيات">الرياضيات</option>
                <option value="الفيزياء">الفيزياء</option>
                <option value="الكيمياء">الكيمياء</option>
                <option value="اللغة العربية">اللغة العربية</option>
                <option value="اللغة الإنكليزية">اللغة الإنكليزية</option>
                <option value="الأحياء">الأحياء</option>
                <option value="التربية الإسلامية">التربية الإسلامية</option>
                <option value="الاجتماعيات">الاجتماعيات</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">المرحلة الدراسية *</label>
              <select
                value={teacherGrade}
                onChange={e => setTeacherGrade(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-amber-400 outline-none"
              >
                <option value="السادس العلمي">السادس العلمي</option>
                <option value="السادس الأدبي">السادس الأدبي</option>
                <option value="الثالث متوسط">الثالث متوسط</option>
                <option value="الخامس العلمي">الخامس العلمي</option>
                <option value="الرابع العلمي">الرابع العلمي</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">كود الأستاذ المخصص (اختياري)</label>
              <input
                type="text"
                value={teacherCode}
                onChange={e => setTeacherCode(e.target.value.toUpperCase())}
                placeholder="مثال: PROF-MATH-HYDER (اتركه فارغاً للتوليد التلقائي)"
                dir="ltr"
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">رقم هاتف الأستاذ (للتواصل)</label>
              <input
                type="text"
                value={teacherPhone}
                onChange={e => setTeacherPhone(e.target.value)}
                placeholder="0780xxxxxxx"
                dir="ltr"
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-white/80">نبذة عن الدورة / المنهج</label>
              <input
                type="text"
                value={teacherBio}
                onChange={e => setTeacherBio(e.target.value)}
                placeholder="شرح كامل للمنهج الوزاري مع حلول الوزاريات وتحديات الـ 60 ثانية"
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black text-sm shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all"
              >
                <Sparkles size={16} />
                <span>توليد وتفعيل كود الأستاذ فوراً</span>
              </button>
            </div>

          </form>
        </motion.div>
      )}

      {/* Tab 2: Batch Generate Student Scratch Cards for Bookstores */}
      {activeTab === 'generate_students' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A0F22] border border-cyan-500/20 rounded-3xl p-6 space-y-5"
        >
          <div className="space-y-1">
            <h3 className="text-base font-black text-white">توليد كروت اشتراك الطلاب للمكاتب بالمدينة</h3>
            <p className="text-xs text-white/60">
              توليد دفعة من الأكواد وتصديرها كبطاقات جاهزة للطباعة والتوزيع على مكاتب واستنساخ المحافظة
            </p>
          </div>

          <form onSubmit={handleGenerateStudentBatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">اختر الأستاذ / المادة *</label>
              <select
                required
                value={selectedInstructorId}
                onChange={e => {
                  setSelectedInstructorId(e.target.value);
                  const inst = instructors.find(i => i.id === e.target.value);
                  if (inst) {
                    setBatchPrefix(`ACAD-${inst.subject.substring(0, 4)}`);
                  }
                }}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value="">-- اختر الأستاذ --</option>
                {instructors.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.subject} - {inst.grade})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">المكتبة المعتمدة / نقطة البيع *</label>
              <select
                value={batchBookstore}
                onChange={e => setBatchBookstore(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value="مكتبة المتنبي المركزية">مكتبة المتنبي المركزية - الديوانية</option>
                <option value="مكتبة الفرسان للخدمات الطلابية">مكتبة الفرسان - غماس</option>
                <option value="مكتبة واستنساخ الرواد">مكتبة واستنساخ الرواد - الديوانية</option>
                <option value="مكتبة النخبة الأكاديمية">مكتبة النخبة الأكاديمية - بغداد</option>
                <option value="مبيعات التطبيق المباشرة">مبيعات التطبيق والدعم المباشر</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">عدد الكروت المطلوبة للطباعة *</label>
              <select
                value={batchCount}
                onChange={e => setBatchCount(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-400 outline-none"
              >
                <option value={10}>10 كروت تجريبية</option>
                <option value={25}>25 كرت (شيت 1)</option>
                <option value={50}>50 كرت (شيت 2)</option>
                <option value={100}>100 كرت (دفعة مكتبة كاملة)</option>
                <option value={200}>200 كرت</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80">بادئة كود الكرت (Prefix)</label>
              <input
                type="text"
                value={batchPrefix}
                onChange={e => setBatchPrefix(e.target.value.toUpperCase())}
                placeholder="مثال: ACAD-MATH"
                dir="ltr"
                className="w-full h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 outline-none font-mono"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-sm shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all"
              >
                <QrCode size={16} />
                <span>توليد الكروت وتجهيز شيت الطباعة للمكتبة</span>
              </button>
            </div>

          </form>
        </motion.div>
      )}

      {/* Tab 3: Instructors List Table */}
      {activeTab === 'instructors_list' && (
        <div className="bg-[#0A0F22] border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white">قائمة الأساتذة المحاضرين وكود كل أستاذ</h3>
            <span className="text-xs text-white/60">العدد: {instructors.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-black/50 text-white/60 border-b border-white/10">
                <tr>
                  <th className="p-3">اسم الأستاذ</th>
                  <th className="p-3">المادة</th>
                  <th className="p-3">المرحلة</th>
                  <th className="p-3">كود الأستاذ (Master Key)</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {instructors.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <GraduationCap size={15} className="text-amber-400" />
                      <span>{t.name}</span>
                    </td>
                    <td className="p-3 text-amber-300 font-bold">{t.subject}</td>
                    <td className="p-3 text-white/70">{t.grade}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleCopy(t.code || t.id, t.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400 font-mono font-bold border border-white/10"
                      >
                        {copiedId === t.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{t.code || t.id}</span>
                      </button>
                    </td>
                    <td className="p-3 text-white/60 font-mono" dir="ltr">{t.phone || '-'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteTeacher(t.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="حذف الأستاذ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Student Scratch Cards Directory */}
      {activeTab === 'students_codes' && (
        <div className="bg-[#0A0F22] border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-white">أرشيف كروت واشتراكات الطلاب المولدة</h3>
            
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث بالكود..."
                className="w-full h-9 pr-9 pl-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-right text-xs">
              <thead className="bg-black/50 text-white/60 border-b border-white/10 sticky top-0">
                <tr>
                  <th className="p-3">كود الكرت</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">تاريخ التوليد</th>
                  <th className="p-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {studentCodes
                  .filter(c => !searchQuery || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 100)
                  .map((sc) => (
                    <tr key={sc.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                        <span>{sc.code}</span>
                        <button
                          onClick={() => handleCopy(sc.code, sc.id)}
                          className="text-white/40 hover:text-white"
                        >
                          {copiedId === sc.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </td>
                      <td className="p-3">
                        {sc.used ? (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            مُستخدم ومفعل
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            متاح بالمكتبة
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-white/40">
                        {sc.createdAt ? new Date(sc.createdAt).toLocaleDateString('ar-IQ') : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteCode(sc.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Scratch Cards Sheet Modal */}
      <AnimatePresence>
        {showPrintModal && generatedBatchForPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none" dir="rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050914] border border-amber-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Printer size={18} className="text-amber-400" />
                    <span>شيت طباعة كروت الاشتراك لمكتبة ({generatedBatchForPrint.bookstore})</span>
                  </h3>
                  <p className="text-xs text-white/60">
                    {generatedBatchForPrint.instructorName} • {generatedBatchForPrint.subject} ({generatedBatchForPrint.grade})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const allCodesText = generatedBatchForPrint.codes.join('\n');
                      navigator.clipboard.writeText(allCodesText);
                      alert('تم نسخ جميع الأكواد إلى الحافظة!');
                    }}
                    className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Copy size={13} />
                    <span>نسخ الأكواد</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black flex items-center gap-1.5 shadow-lg"
                  >
                    <Printer size={14} />
                    <span>طباعة الشيت A4</span>
                  </button>

                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Cards Grid Sheet (Printable Layout) */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#080d1e]">
                {generatedBatchForPrint.codes.map((code, idx) => (
                  <div
                    key={idx}
                    className="relative bg-gradient-to-b from-[#0F172A] to-[#0B0F1E] border-2 border-dashed border-amber-400/40 rounded-2xl p-4 space-y-3 shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={16} className="text-amber-400" />
                        <span className="text-[11px] font-black text-white">أكاديمية بيرق الرقمية</span>
                      </div>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        2026
                      </span>
                    </div>

                    {/* Course & Professor */}
                    <div className="space-y-0.5 text-right">
                      <p className="text-xs font-black text-white">{generatedBatchForPrint.instructorName}</p>
                      <p className="text-[10px] text-amber-300 font-bold">
                        مادة {generatedBatchForPrint.subject} • {generatedBatchForPrint.grade}
                      </p>
                    </div>

                    {/* Scratch Card Secret Mask */}
                    <div className="bg-black/60 border border-amber-400/30 rounded-xl p-2.5 text-center space-y-1">
                      <span className="text-[9px] text-white/40 block font-bold">كود الاشتراك السري (اكشط هنا)</span>
                      <span className="text-sm font-black text-amber-400 font-mono tracking-wider select-all">
                        {code}
                      </span>
                    </div>

                    {/* Instructions */}
                    <div className="text-[8px] text-white/40 text-center leading-tight">
                      أدخل الكود في تطبيق بوابة بيرق Gate 6 للوصول للمحطات وتحديات 60s
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
