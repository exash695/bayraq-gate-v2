import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Flame, 
  Zap, 
  Search, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Layers, 
  Award, 
  Share2, 
  HelpCircle, 
  ChevronLeft,
  Tv,
  Star,
  FileText,
  Radio,
  Copy,
  Check,
  Trophy
} from 'lucide-react';

export interface AcademyCourse {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorTitle: string;
  subject: string;
  grade: string;
  coverImage?: string;
  avatarUrl?: string;
  badge: string;
  rating: number;
  studentsCount: number;
  lessonsCount: number;
  description: string;
  features: string[];
  codePrefix: string;
}

export interface Bookstore {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  isMainPartner?: boolean;
}

interface BayraqAcademyHubProps {
  onVerify: (code: string, isParent: boolean) => void;
  onBack: () => void;
  isVerifying?: boolean;
  savedCode?: string;
}

const DEFAULT_COURSES: AcademyCourse[] = [
  {
    id: 'acad_math_6th',
    instructorId: 'prof_math_1',
    instructorName: 'أ. حيدر وليد',
    instructorTitle: 'خبير الرياضيات الوزارية والمناهج المطورة',
    subject: 'الرياضيات',
    grade: 'السادس العلمي (أحيائي / تطبيقي)',
    badge: 'الدورة الذهبية الشاملة 2026',
    rating: 4.98,
    studentsCount: 1850,
    lessonsCount: 64,
    description: 'شرح المنهج الوزاري كاملاً بأسلوب المحطات المتسلسلة التفاعلي مع بنك الأسئلة الوزارية وتحديات الستين ثانية للـ 100.',
    features: [
      'تحديات الـ 60 ثانية بعد كل محطة',
      'حل كافة الأسئلة الوزارية من 1990 إلى 2025',
      'رادار الذكاء لاكتشاف الثغرات والملاحظات',
      'امتحانات إلكترونية وتصحيح فوري'
    ],
    codePrefix: 'ACAD-MATH'
  },
  {
    id: 'acad_physics_6th',
    instructorId: 'prof_phys_1',
    instructorName: 'أ. علي السوداني',
    instructorTitle: 'أستاذ الفيزياء المتميز لمدارس المتميزين والنخبة',
    subject: 'الفيزياء',
    grade: 'السادس العلمي',
    badge: 'دورة المئة الوزارية',
    rating: 4.95,
    studentsCount: 1420,
    lessonsCount: 52,
    description: 'تفكيك القوانين الفيزيائية والتجارب والمفاهيم الوزارية الصعبة إلى محطات مرئية وتفاعلية تضمن الفهم الكامل.',
    features: [
      'مختبر التجارب الوزارية التفاعلي',
      'ملزمة إلكترونية مدمجة بالحفظ السريع',
      'أسئلة الفكر والذكاء الاستنتاجية',
      'متابعة حية مع الأستاذ'
    ],
    codePrefix: 'ACAD-PHYS'
  },
  {
    id: 'acad_chem_6th',
    instructorId: 'prof_chem_1',
    instructorName: 'أ. مهند السوداني',
    instructorTitle: 'رائد تدريس الكيمياء للصفوف المنتهية',
    subject: 'الكيمياء',
    grade: 'السادس العلمي',
    badge: 'المسار البلاتيني',
    rating: 4.97,
    studentsCount: 1630,
    lessonsCount: 48,
    description: 'إتقان المسائل والمعادلات والكيمياء العضوية مع خرائط ذهنية مبتكرة وتحديات زمنية لرفع سرعة الحل.',
    features: [
      'خرائط العضوية والمسائل الحسابية',
      'تحدي السرعة 60s للحلول النموذجية',
      'بنك الأفكار لتدوين الملاحظات الذكية',
      'قاعة الأبطال للأوائل في كل فصل'
    ],
    codePrefix: 'ACAD-CHEM'
  },
  {
    id: 'acad_arabic_6th',
    instructorId: 'prof_arab_1',
    instructorName: 'أ. حمزة الجابري',
    instructorTitle: 'أستاذ قواعد اللغة العربية والأدب والنصوص',
    subject: 'اللغة العربية',
    grade: 'السادس العلمي والأدبي',
    badge: 'شامل القواعد والأدب',
    rating: 4.92,
    studentsCount: 1290,
    lessonsCount: 58,
    description: 'تفكيك شفرات الإعراب والأدب والنصوص بأسلوب تفاعلي لا ينسى مع مئات النماذج الوزارية المؤكدة.',
    features: [
      'إعراب مرئي تفاعلي خطوة بخطوة',
      'حفظ النصوص الوزارية بالصوت والصورة',
      'اختبارات وزارية دقيقة',
      'شهادات إكمال لكل مرحلة'
    ],
    codePrefix: 'ACAD-ARAB'
  },
  {
    id: 'acad_english_6th',
    instructorId: 'prof_eng_1',
    instructorName: 'أ. أحمد النداوي',
    instructorTitle: 'مدرب ومحاضر اللغة الإنكليزية المعتمد',
    subject: 'اللغة الإنكليزية',
    grade: 'السادس الإعدادي',
    badge: 'القطع والإنشاءات وقواعد 100',
    rating: 4.94,
    studentsCount: 1380,
    lessonsCount: 45,
    description: 'منهج الإنكليزي السادس بأحدث التقنيات مع نماذج إنشاءات نموذجية وقطع الكتاب وقواعد اليونتات.',
    features: [
      'محطات القراءة والاستماع الذكي',
      'نماذج الإنشاءات الوزارية الكاملة',
      'تحدي القواعد السريع 60 ثانية',
      'رادار الذكاء للمفردات والمرادفات'
    ],
    codePrefix: 'ACAD-ENG'
  },
  {
    id: 'acad_bio_6th',
    instructorId: 'prof_bio_1',
    instructorName: 'أ. مصطفى العقيلي',
    instructorTitle: 'أستاذ علم الأحياء والوراثة',
    subject: 'الأحياء',
    grade: 'السادس العلمي',
    badge: 'الرسومات والوراثة الذهبية',
    rating: 4.96,
    studentsCount: 1510,
    lessonsCount: 50,
    description: 'رسومات الأحياء الوزارية خطوة بخطوة وحل مسائل الوراثة المعقدة بتبسيط مذهل يضمن الدرجة الكاملة.',
    features: [
      'خطوات الرسم الوزاري التفاعلي',
      'حل كافة مسائل الوراثة المقررة',
      'فلاش كاردز للمصطلحات والتعاريف',
      'أوسمة التميز وبنك الأفكار'
    ],
    codePrefix: 'ACAD-BIO'
  }
];

const ACCREDITED_BOOKSTORES: Bookstore[] = [
  {
    id: 'bk_1',
    name: 'مكتبة المتنبي المركزية',
    city: 'الديوانية',
    address: 'شارع الجمهورية - مجاور مصرف الرافدين',
    phone: '07801234567',
    workingHours: '8:00 ص - 10:00 م',
    isMainPartner: true
  },
  {
    id: 'bk_2',
    name: 'مكتبة الفرسان للخدمات الطلابية',
    city: 'غماس',
    address: 'الشارع العام - مقابل ثانوية الأوائل',
    phone: '07819876543',
    workingHours: '8:30 ص - 9:30 م',
    isMainPartner: true
  },
  {
    id: 'bk_3',
    name: 'مكتبة واستنساخ الرواد',
    city: 'الديوانية',
    address: 'حي المعلمين - فلكة الساعة',
    phone: '07705554433',
    workingHours: '9:00 ص - 10:00 م'
  },
  {
    id: 'bk_4',
    name: 'مكتبة النخبة الأكاديمية',
    city: 'بغداد / الكرخ والكرادة',
    address: 'شارع المغرب - تقاطع الجامعة',
    phone: '07901122334',
    workingHours: '8:00 ص - 11:00 م'
  }
];

export const BayraqAcademyHub: React.FC<BayraqAcademyHubProps> = ({
  onVerify,
  onBack,
  isVerifying,
  savedCode
}) => {
  const [entryMode, setEntryMode] = useState<'student' | 'teacher'>('student');
  const [inputCode, setInputCode] = useState(savedCode || '');
  const [error, setError] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<AcademyCourse | null>(null);
  const [showBookstoresModal, setShowBookstoresModal] = useState(false);
  const [showOnlineOrderModal, setShowOnlineOrderModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Dynamic courses list with ability to fetch database teachers
  const [courses, setCourses] = useState<AcademyCourse[]>(DEFAULT_COURSES);

  useEffect(() => {
    // Attempt to fetch any custom registered teachers for the academy
    const fetchAcademyTeachers = async () => {
      try {
        const res = await fetch('/api/teachers?schoolId=school8');
        if (res.ok) {
          const data = await res.json();
          if (data.teachers && data.teachers.length > 0) {
            const dbCourses: AcademyCourse[] = data.teachers.map((t: any) => ({
              id: t.id,
              instructorId: t.id,
              instructorName: t.name,
              instructorTitle: t.bio || `أستاذ مادة ${t.subject || 'المنهج'} الوزاري`,
              subject: t.subject || 'عام',
              grade: t.grade || 'السادس العلمي',
              badge: 'دورة النخبة المعتمدة 2026',
              rating: 5.0,
              studentsCount: 350,
              lessonsCount: 40,
              description: t.adminNotes || `الدورة الإلكترونية التفاعلية الكاملة لمادة ${t.subject || 'المنهج'} بإشراف الأستاذ.`,
              features: [
                'المحطات المتسلسلة والملازم التفاعلية',
                'تحدي الـ 60 ثانية بعد كل محطة',
                'رادار الذكاء وبنك الأفكار الذكية',
                'متابعة مستمرة وتواصل مباشر'
              ],
              codePrefix: t.code ? t.code.split('-')[0] || 'ACAD' : 'ACAD'
            }));

            // Merge avoiding duplicates
            const combined = [...dbCourses];
            DEFAULT_COURSES.forEach(def => {
              if (!combined.some(c => c.subject === def.subject && c.instructorName === def.instructorName)) {
                combined.push(def);
              }
            });
            setCourses(combined);
          }
        }
      } catch (err) {
        console.log('Using default academy courses:', err);
      }
    };

    fetchAcademyTeachers();
  }, []);

  const handleVerifySubmit = () => {
    const clean = inputCode.trim().toUpperCase();
    if (!clean) {
      setError(
        entryMode === 'student'
          ? 'يرجى إدخال كود الاشتراك الخاص بالدورة'
          : 'يرجى إدخال كود الأستاذ المحاضر'
      );
      return;
    }
    setError('');
    onVerify(clean, false);
  };

  const handleCourseActivate = (course: AcademyCourse) => {
    setEntryMode('student');
    setSelectedCourseDetails(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // If input is empty, prefill prefix hint
    if (!inputCode) {
      setInputCode(`${course.codePrefix}-`);
    }
  };

  const subjectsList = ['all', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغة العربية', 'اللغة الإنكليزية', 'الأحياء'];

  const filteredCourses = courses.filter(c => {
    const matchesSubject = selectedSubjectFilter === 'all' || c.subject === selectedSubjectFilter;
    const cleanSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = !cleanSearch || 
      c.instructorName.toLowerCase().includes(cleanSearch) || 
      c.subject.toLowerCase().includes(cleanSearch) ||
      c.grade.toLowerCase().includes(cleanSearch) ||
      c.description.toLowerCase().includes(cleanSearch);
    return matchesSubject && matchesSearch;
  });

  return (
    <div 
      className="min-h-screen w-full bg-[#050914] text-white flex flex-col relative select-none font-sans overflow-x-hidden pb-28"
      dir="rtl"
      id="academy-portal-root"
    >
      {/* Background Ambient Glowing Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] right-[10%] w-[550px] h-[350px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] left-[-10%] w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[450px] h-[400px] bg-cyan-600/10 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#050914]/90 backdrop-blur-xl border-b border-amber-500/15 px-4 sm:px-6 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          {/* Right side: Academy Identity (Elegant single-line title with description underneath) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-indigo-500/20 to-black border border-amber-400/40 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
              <GraduationCap className="text-amber-400 w-5 h-5" />
            </div>
            
            <div className="flex flex-col text-right">
              <h1 className="text-base sm:text-lg font-black text-white leading-tight whitespace-nowrap">
                أكاديمية بيرق الرقمية
              </h1>
              <p className="text-[11px] text-amber-300/80 font-bold leading-tight mt-0.5">
                منصة الدورات الألكترونية لنخبة الأساتذة
              </p>
            </div>
          </div>

          {/* Left side: Back Button (Arrow only) & Bookstores */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBookstoresModal(true)}
              className="hidden sm:flex h-8 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 items-center gap-1.5 transition-all active:scale-95"
            >
              <MapPin size={12} className="text-amber-400" />
              <span>مكاتب شراء الكروت</span>
            </button>

            {/* Back Button - Sleek arrow only */}
            <button
              onClick={onBack}
              title="الرجوع للميادين"
              aria-label="الرجوع للميادين"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 active:scale-90 border border-white/10 text-amber-400 hover:text-amber-300 transition-all flex items-center justify-center shadow-sm hover:border-amber-400/40"
            >
              <ArrowRight size={17} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6 flex-1 w-full">

        {/* 1. Hero Grand Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e1630] via-[#090e21] to-[#060a17] border border-amber-500/25 p-5 sm:p-6 shadow-[0_8px_35px_rgba(0,0,0,0.5)]">
          {/* Glow Backdrop */}
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-3.5 text-right">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black w-fit">
              <Sparkles size={13} className="text-amber-400" />
              <span>المنصة التعليمية الإلكترونية المعتمدة لعام 2026</span>
            </div>

            {/* Headline as requested */}
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-white leading-snug">
              دورات إلكترونية حصرية لنخبة الأساتذة بأكواد اشتراك معتمدة
            </h2>

            {/* 8 Feature Icons arranged neatly */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'بث مباشر', icon: Radio, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                { label: 'محول العرض التفاعلي', icon: Tv, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
                { label: 'ملفات PDF', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                { label: 'بنك الوزاريات', icon: Award, color: 'text-yellow-300', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                { label: 'بنك الاسئلة', icon: HelpCircle, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
                { label: 'واجبات', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                { label: 'مسابقات', icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
                { label: 'تحدي 60 ثانية', icon: Zap, color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/30' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${item.bg} backdrop-blur-sm transition-all hover:scale-[1.02]`}
                  >
                    <Icon size={15} className={`${item.color} shrink-0`} />
                    <span className="text-xs font-bold text-white/90 whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* 2. Dual-Entry Verification Gate Card (بوابة الدخول الذكية للدورات - أنيقة وبأزرار نحيفة جميلة بدون بيرق) */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0A0F22] border border-amber-500/30 p-5 sm:p-7 shadow-[0_8px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          
          <div className="max-w-md mx-auto space-y-4 text-center">
            
            {/* Gate Title */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-black">
                <Lock size={12} className="text-amber-400" />
                <span>بوابة الدخول الذكية للدورات</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                اختر نوع الدخول وأدخل كود المرور
              </h3>
            </div>

            {/* Tab Switcher: Student vs Teacher (Slim, refined buttons) */}
            <div className="grid grid-cols-2 gap-2 bg-[#050814] p-1 rounded-xl border border-white/10">
              
              {/* Tab 1: Student */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('student');
                  setError('');
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  entryMode === 'student'
                    ? 'bg-amber-400 text-black shadow-md font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <UserCheck size={14} className={entryMode === 'student' ? 'text-black' : 'text-amber-400'} />
                <span>🎓 دخول الطالب (مشترك)</span>
              </button>

              {/* Tab 2: Teacher */}
              <button
                type="button"
                onClick={() => {
                  setEntryMode('teacher');
                  setError('');
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  entryMode === 'teacher'
                    ? 'bg-indigo-600 text-white shadow-md font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <GraduationCap size={14} className={entryMode === 'teacher' ? 'text-white' : 'text-indigo-400'} />
                <span>👨‍🏫 دخول الأستاذ (المحاضر)</span>
              </button>

            </div>

            {/* Input & Action Form (Sleek slim inputs and buttons) */}
            <div className="space-y-3 pt-1">
              
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifySubmit();
                  }}
                  placeholder={
                    entryMode === 'student'
                      ? 'أدخل كود الطالب (مثال: ACAD-MATH-1029)'
                      : 'أدخل كود الأستاذ المحاضر (مثال: PROF-MATH-01)'
                  }
                  dir="ltr"
                  className={`w-full h-11 px-4 bg-[#060A18] border rounded-xl text-center text-white placeholder:text-white/30 text-sm font-bold tracking-wider outline-none transition-all shadow-inner font-mono ${
                    entryMode === 'student'
                      ? 'border-amber-500/40 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30'
                      : 'border-indigo-500/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30'
                  }`}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-1 text-rose-400 text-xs font-bold mt-1.5"
                  >
                    <AlertCircle size={13} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              {/* Submit Button (Slim, beautiful, refined) */}
              <button
                type="button"
                onClick={handleVerifySubmit}
                disabled={isVerifying}
                className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm shadow-md active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  entryMode === 'student'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110'
                }`}
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    <span>جاري التحقق والدخول...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>
                      {entryMode === 'student' ? 'تفعيل ودخول الدورة' : 'دخول غرفة تحكم الأستاذ'}
                    </span>
                  </>
                )}
              </button>

              {/* Helper Links */}
              <div className="flex items-center justify-between text-[11px] text-white/50 px-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowBookstoresModal(true)}
                  className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <MapPin size={12} />
                  <span>أين أجد كرت الاشتراك بالمدينة؟</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOnlineOrderModal(true)}
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <Phone size={12} />
                  <span>طلب كود أونلاين / تواصل</span>
                </button>
              </div>

            </div>

          </div>

        </section>

        {/* 3. Available Elite Courses Showcase (استعراض الدورات المتاحة لنخبة الأساتذة) */}
        <section className="space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1 text-right">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="text-amber-400" size={22} />
                <span>الدورات الإلكترونية المتاحة لنخبة الأساتذة</span>
              </h3>
              <p className="text-xs text-white/60">
                استعرض الدورات، واشترِ كود الدورة من مكاتب المحافظة أو التطبيق لتفعيل الدخول فوراً
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الأستاذ أو المادة..."
                className="w-full h-10 pr-10 pl-4 rounded-xl bg-[#0A0F22] border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Subject Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {subjectsList.map((subj) => {
              const isActive = selectedSubjectFilter === subj;
              return (
                <button
                  key={subj}
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {subj === 'all' ? 'جميع المواد' : subj}
                </button>
              );
            })}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group bg-[#0A0F22] hover:bg-[#0e1633] border border-amber-500/20 hover:border-amber-500/50 rounded-[1.75rem] p-5 flex flex-col justify-between transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_35px_rgba(245,158,11,0.15)]"
              >
                {/* Ambient Card Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />

                <div className="space-y-4">
                  
                  {/* Top Bar: Subject Badge & Rating */}
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                      {course.subject} • {course.grade}
                    </span>

                    <div className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                      <Star size={12} className="fill-amber-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>

                  {/* Instructor Info */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-400/40 p-1 flex items-center justify-center shrink-0 shadow-md">
                      <GraduationCap className="text-amber-400 w-7 h-7" />
                    </div>
                    
                    <div className="space-y-0.5 text-right flex-1">
                      <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                        {course.instructorName}
                      </h4>
                      <p className="text-[11px] text-white/50 font-medium line-clamp-1">
                        {course.instructorTitle}
                      </p>
                    </div>
                  </div>

                  {/* Course Description */}
                  <p className="text-xs text-white/70 text-right leading-relaxed line-clamp-2">
                    {course.description}
                  </p>

                  {/* Quick Feature Bullets */}
                  <div className="space-y-1.5 bg-black/30 rounded-xl p-2.5 border border-white/5 text-right">
                    {course.features.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-white/80">
                        <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourseDetails(course)}
                    className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold transition-all border border-white/5"
                  >
                    تفاصيل المنهج
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCourseActivate(course)}
                    className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black transition-all shadow-[0_2px_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1"
                  >
                    <Zap size={14} />
                    <span>تفعيل بالكود</span>
                  </button>
                </div>

              </motion.div>
            ))}
          </div>

        </section>

        {/* 4. Accredited Distribution Bookstores Section (المكاتب المعتمدة لشراء كروت الاشتراك بالمدينة) */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0c142e] to-[#070b1a] border border-amber-500/20 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black">
                <MapPin size={14} />
                <span>نقاط التوزيع الرسمية بالمدينة والمحافظات</span>
              </div>
              <h3 className="text-xl font-black text-white">
                المكاتب المعتمدة لشراء كروت اشتراك الأكاديمية
              </h3>
              <p className="text-xs text-white/60">
                توجه لأقرب مكتبة معتمدة، اطلب كرت مادة الأستاذ، واكشط الكود للتفعيل المباشر
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowOnlineOrderModal(true)}
              className="h-10 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center justify-center gap-2 self-start sm:self-auto transition-all"
            >
              <Phone size={14} />
              <span>طلب توصيل الكود إلكترونياً</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACCREDITED_BOOKSTORES.map((bk) => (
              <div
                key={bk.id}
                className="bg-black/30 border border-white/5 rounded-2xl p-4 text-right space-y-2 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">{bk.city}</span>
                  {bk.isMainPartner && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 font-extrabold px-2 py-0.5 rounded-full">
                      نقطة رئيسية
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-white leading-tight">
                  {bk.name}
                </h4>

                <p className="text-[11px] text-white/60 flex items-start gap-1">
                  <MapPin size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>{bk.address}</span>
                </p>

                <p className="text-[11px] text-white/60 flex items-center gap-1">
                  <Phone size={12} className="text-cyan-400 shrink-0" />
                  <span dir="ltr">{bk.phone}</span>
                </p>

                <p className="text-[10px] text-white/40 flex items-center gap-1 pt-1">
                  <Clock size={11} className="shrink-0" />
                  <span>{bk.workingHours}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourseDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourseDetails(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0A0F22] border border-amber-500/30 rounded-3xl p-6 shadow-2xl z-10 space-y-5 text-right max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedCourseDetails.instructorName}</h3>
                    <p className="text-xs text-amber-300 font-bold">{selectedCourseDetails.subject} - {selectedCourseDetails.grade}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCourseDetails(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white/90">وصف ومحتوى الدورة:</h4>
                <p className="text-xs text-white/70 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5">
                  {selectedCourseDetails.description}
                </p>

                <h4 className="text-sm font-bold text-white/90 pt-2">مميزات الدورة في بوابة بيرق:</h4>
                <div className="space-y-2">
                  {selectedCourseDetails.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/80 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <CheckCircle2 size={15} className="text-amber-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl space-y-1 text-center">
                  <span className="text-xs font-black text-amber-300">طريقة الاشتراك:</span>
                  <p className="text-[11px] text-white/70">
                    اشترِ كارت اشتراك المادة من المكاتب المعتمدة أو اضغط تفعيل لإدخال كود الكارت مباشرة.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedCourseDetails(null)}
                  className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => handleCourseActivate(selectedCourseDetails)}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-black shadow-lg"
                >
                  تفعيل الدورة بالكود
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bookstores Modal */}
      <AnimatePresence>
        {showBookstoresModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookstoresModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0A0F22] border border-amber-500/30 rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-right max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <MapPin size={20} />
                  <h3 className="text-base font-black text-white">عناوين مكاتب شراء كروت الدورات</h3>
                </div>
                <button
                  onClick={() => setShowBookstoresModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {ACCREDITED_BOOKSTORES.map((bk) => (
                  <div key={bk.id} className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white">{bk.name}</h4>
                      <span className="text-[10px] text-amber-400 font-bold">{bk.city}</span>
                    </div>
                    <p className="text-[11px] text-white/60">{bk.address}</p>
                    <p className="text-[11px] text-cyan-400 font-mono" dir="ltr">{bk.phone}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowBookstoresModal(false)}
                className="w-full h-11 rounded-xl bg-amber-500 text-black text-xs font-black"
              >
                حسناً، فهمت
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Online Order / Support Modal */}
      <AnimatePresence>
        {showOnlineOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnlineOrderModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0A0F22] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mx-auto">
                <Phone size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">طلب كود الاشتراك أونلاين</h3>
                <p className="text-xs text-white/60">
                  إذا لم تكن المكاتب قريبة منك، يمكنك التواصل مع خدمة عملاء الأكاديمية للحصول على الكود فورياً عبر واتساب
                </p>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2 text-right">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">خدمة الطلاب والاشتراكات:</span>
                  <span className="text-amber-300 font-black">07800000000</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">واتساب المبيعات المباشرة:</span>
                  <span className="text-emerald-400 font-black">متاح 24/7</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowOnlineOrderModal(false)}
                  className="w-full h-11 rounded-xl bg-cyan-500 text-black text-xs font-black"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
