import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BerqCharacter } from './BerqCharacterManager';
import { 
  Search, 
  GraduationCap, 
  ChevronRight, 
  ChevronDown,
  Star, 
  Users, 
  BookOpen, 
  ArrowRight,
  Filter,
  Medal,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  MessageSquare,
  PlayCircle,
  Clock,
  Send,
  Trophy,
  LayoutDashboard,
  StickyNote,
  X,
  FileDown,
  Bell,
  History
} from 'lucide-react';
import jsPDF from 'jspdf';
import { html2canvasSafe } from '../lib/html2canvasSafe';
import { safeStorage, safeSessionStorage } from '../lib/storage';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  image: string;
  description: string;
  rating: number;
  students: number;
  courses: number;
  color: string;
}

interface Course {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  lessons: { id: string; title: string; titleEn: string; completed: boolean }[];
  resources: { id: string; title: string; type: 'pdf' | 'exam'; size: string }[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  rank: number;
}

const SUBJECTS = [
  { id: 'all', name: 'الكل', nameEn: 'All' },
  { id: 'islamic', name: 'القرآن والتربية الإسلامية', nameEn: 'Islamic Education' },
  { id: 'arabic', name: 'اللغة العربية', nameEn: 'Arabic Language' },
  { id: 'english', name: 'اللغة الإنجليزية', nameEn: 'English Language' },
  { id: 'math', name: 'الرياضيات', nameEn: 'Mathematics' },
  { id: 'chemistry', name: 'الكيمياء', nameEn: 'Chemistry' },
  { id: 'physics', name: 'الفيزياء', nameEn: 'Physics' },
  { id: 'biology', name: 'الأحياء', nameEn: 'Biology' },
  { id: 'science', name: 'العلوم', nameEn: 'Science' },
  { id: 'social', name: 'الاجتماعيات', nameEn: 'Social Studies' },
];

const TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'أستاذ النخبة (1)',
    subject: 'english',
    image: 'https://picsum.photos/seed/teacher1/400/400',
    description: 'خبير المادة للمرحلة الإعدادية، صاحب أسلوب متميز في تبسيط المنهج وضمان التفوق.',
    rating: 4.9,
    students: 15400,
    courses: 12,
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    id: 't2',
    name: 'أستاذ النخبة (2)',
    subject: 'math',
    image: 'https://picsum.photos/seed/teacher2/400/400',
    description: 'شرح مفصل وممتع، تبسيط أعقد المفاهيم بأسلوب يضمن الدرجة الكاملة.',
    rating: 5.0,
    students: 28000,
    courses: 8,
    color: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 't3',
    name: 'أستاذ النخبة (3)',
    subject: 'chemistry',
    image: 'https://picsum.photos/seed/teacher3/400/400',
    description: 'المنهج بأسلوب حديث وتفاعلي، التركيز على الأسئلة الوزارية والمهمة.',
    rating: 4.8,
    students: 12000,
    courses: 6,
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    id: 't4',
    name: 'أستاذ النخبة (4)',
    subject: 'arabic',
    image: 'https://picsum.photos/seed/teacher4/400/400',
    description: 'سيد المادة، شرح وافٍ وشامل لكل تفاصيل المنهج بأسلوب أدبي رفيع.',
    rating: 4.9,
    students: 22000,
    courses: 10,
    color: 'from-orange-500/20 to-red-500/20'
  },
  {
    id: 't5',
    name: 'أستاذ النخبة (5)',
    subject: 'physics',
    image: 'https://picsum.photos/seed/teacher5/400/400',
    description: 'فهم عميق للمادة، ربط النظريات بالتطبيقات العملية لضمان الاستيعاب الكامل.',
    rating: 4.7,
    students: 9500,
    courses: 5,
    color: 'from-indigo-500/20 to-blue-500/20'
  }
];

const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: 'كورس المراجعة المركزة - الجزء الأول',
    titleEn: 'Intensive Revision Course - Part 1',
    description: 'شرح كامل للمادة مع التركيز على الأسئلة الوزارية المكررة وأهم الملاحظات لضمان الدرجة الكاملة.',
    descriptionEn: 'Full subject explanation focusing on repeated ministerial questions and key notes to ensure full marks.',
    lessons: [
      { id: 'l1', title: 'المقدمة وأساسيات المادة', titleEn: 'Introduction & Basics', completed: true },
      { id: 'l2', title: 'الفصل الأول: المفاهيم الأساسية', titleEn: 'Chapter 1: Core Concepts', completed: true },
      { id: 'l3', title: 'تطبيقات عملية وأمثلة وزارية', titleEn: 'Practical Applications & Ministerial Examples', completed: false },
      { id: 'l4', title: 'اختبار شامل للفصل الأول', titleEn: 'Comprehensive Test for Chapter 1', completed: false },
    ],
    resources: [
      { id: 'r1', title: 'ملخص القوانين الذهبي', type: 'pdf', size: '2.4 MB' },
      { id: 'r2', title: 'الأسئلة الوزارية (2015-2023)', type: 'exam', size: '5.1 MB' },
      { id: 'r3', title: 'مخططات ذهنية للفصل الأول', type: 'pdf', size: '1.8 MB' },
    ]
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', name: 'الفارس أحمد', points: 2450, rank: 1 },
  { id: 'u2', name: 'الفارس سيف', points: 2100, rank: 2 },
  { id: 'u3', name: 'الفارسة مريم', points: 1950, rank: 3 },
  { id: 'u4', name: 'الفارس علي', points: 1800, rank: 4 },
  { id: 'u5', name: 'الفارسة نور', points: 1650, rank: 5 },
];

export const EliteTeachers: React.FC<{ language: 'ar' | 'en'; onBack: () => void }> = ({ language, onBack }) => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'resources' | 'quiz' | 'ask' | 'leaderboard'>('syllabus');
  const [message, setMessage] = useState('');
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [notes, setNotes] = useState(() => safeStorage.getItem('bayraq_notepad_notes') || '');
  const isAr = language === 'ar';

  const handleSaveNotes = (val: string) => {
    setNotes(val);
    safeStorage.setItem('bayraq_notepad_notes', val);
  };

  const handleExportPDF = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!selectedTeacher) return;
    const content = document.getElementById('notepad-content');
    if (!content) return;

    try {
      // Before cloning, we might want to temporarily disable the color-mix/oklab styles on the element itself
      // or its parent.
      
      // Use safe canvas generation helper
      const canvas = await html2canvasSafe(content, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#101935',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      // Use ASCII safe filename for absolute compatibility
      doc.save(`Bayraq_Notes_${selectedTeacher.id || 'teacher'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(isAr ? 'فشل تصدير الملف بصيغة PDF. يرجى المحاولة مرة أخرى.' : 'Failed to export PDF. Please try again.');
    }
  };

  const handleCompleteLesson = (lesson: any) => {
    // Logic to mark lesson as completed (simulated)
    // Schedule notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const reminderTime = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days
      safeStorage.setItem(`reminder_${lesson.id}`, reminderTime.toString());
      
      // For demo purposes, we can't easily schedule a browser notification 3 days later without a worker
      // but we can show a confirmation toast
      alert(isAr ? `تم جدولة مراجعة لدرس "${lesson.title}" بعد 3 أيام.` : `Spaced repetition scheduled for "${lesson.titleEn}" in 3 days.`);
    } else {
      Notification.requestPermission();
    }
  };

  const filteredTeachers = TEACHERS.filter(teacher => {
    const matchesSubject = selectedSubject === 'all' || teacher.subject === selectedSubject;
    const matchesSearch = teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         teacher.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  const renderSidebar = () => (
    <aside className={`w-full lg:w-80 shrink-0 flex flex-col gap-6 ${isAr ? 'lg:border-l' : 'lg:border-r'} border-white/10 p-4 lg:p-6 h-fit lg:sticky lg:top-24 z-20 bg-[#050505]/50 backdrop-blur-sm rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)]`}>
      <div className="text-center space-y-2 mb-2">
        <div className="inline-flex p-3 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] mb-2">
          <GraduationCap size={28} className="animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          {isAr ? 'بوابة الكورسات' : 'Course Portal'}
        </h2>
        <p className="text-xs text-white/40 font-bold">
          {isAr ? 'اختر أستاذك وابدأ رحلتك' : 'Choose your teacher and start'}
        </p>
      </div>

      <div className="relative group">
        <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#D4AF37] transition-colors`} size={18} />
        <input 
          type="text"
          placeholder={isAr ? 'ابحث عن أستاذ أو كورس...' : 'Search teacher or course...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white outline-none focus:border-[#D4AF37]/50 focus:bg-white/5 transition-all text-sm font-bold shadow-inner`}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {SUBJECTS.map((s, idx) => (
          <button 
            key={`${s.id}_${idx}_teacher_sub`}
            onClick={() => setSelectedSubject(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap border transition-all ${selectedSubject === s.id ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-500 border-transparent text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] transform scale-105' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
          >
            {isAr ? s.name : s.nameEn}
          </button>
        ))}
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
        {filteredTeachers.map((teacher, idx) => (
          <div key={`${teacher.id}_${idx}_teacher_entry`} className="space-y-2">
            <button 
              onClick={() => {
                setExpandedTeacherId(expandedTeacherId === teacher.id ? null : teacher.id);
                setSelectedTeacher(teacher);
                setSelectedCourse(null);
              }}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border relative overflow-hidden group ${expandedTeacherId === teacher.id ? 'bg-gradient-to-br from-[#D4AF37]/20 to-transparent border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]' : 'bg-black/40 border-white/10 hover:border-white/30 hover:bg-white/5'}`}
            >
              {expandedTeacherId === teacher.id && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.2),transparent_70%)]" />
              )}
              <div className={`flex items-center gap-4 relative z-10 ${isAr ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="relative">
                  <img src={teacher.image} className="w-12 h-12 rounded-xl object-cover border-2 border-white/10 group-hover:border-[#D4AF37]/50 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#050505]" />
                </div>
                <div className="text-right">
                  <p className={`text-white font-black text-sm ${isAr ? 'text-right' : 'text-left'}`}>{teacher.name}</p>
                  <p className={`text-[#00E5FF] text-[10px] font-bold ${isAr ? 'text-right' : 'text-left'} mt-0.5`}>
                    {isAr ? SUBJECTS.find(s => s.id === teacher.subject)?.name : SUBJECTS.find(s => s.id === teacher.subject)?.nameEn}
                  </p>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative z-10 ${expandedTeacherId === teacher.id ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white'}`}>
                <ChevronDown size={16} className={`transition-transform duration-300 ${expandedTeacherId === teacher.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {expandedTeacherId === teacher.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden space-y-2 px-2 pt-2"
                >
                  {MOCK_COURSES.map((course, cIdx) => (
                    <button 
                      key={`${course.id}_${cIdx}_teacher_course`}
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setSelectedCourse(course);
                      }}
                      className={`w-full p-4 rounded-xl text-right text-sm font-black transition-all flex items-center gap-4 group relative overflow-hidden ${selectedCourse?.id === course.id ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-600 text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-[1.02]' : 'bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-white/60 hover:text-white'}`}
                    >
                      {selectedCourse?.id === course.id && (
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]" />
                      )}
                      <div className={`p-2 rounded-lg relative z-10 ${selectedCourse?.id === course.id ? 'bg-black/20 text-black' : 'bg-white/5 text-[#D4AF37] group-hover:bg-[#D4AF37]/20'}`}>
                        <BookOpen size={16} />
                      </div>
                      <span className="flex-1 relative z-10 leading-tight">{isAr ? course.title : course.titleEn}</span>
                      <ChevronRight size={16} className={`relative z-10 transition-transform ${isAr ? 'rotate-180' : ''} ${selectedCourse?.id === course.id ? 'text-black' : 'opacity-30 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </aside>
  );

  const renderContent = () => {
    if (selectedCourse && selectedTeacher) {
    const completedCount = selectedCourse.lessons.filter(l => l.completed).length;
    const progressPercent = Math.round((completedCount / selectedCourse.lessons.length) * 100);

    return (
      <div className="min-h-screen pb-20 animate-in slide-in-from-bottom-10 duration-500 relative">
        {/* Digital Notepad Side Panel */}
        <AnimatePresence>
          {isNotepadOpen && (
            <motion.div
              initial={{ x: isAr ? 400 : -400 }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? 400 : -400 }}
              className={`fixed top-0 ${isAr ? 'right-0' : 'left-0'} h-full w-80 sm:w-96 bg-[#050505] border-x border-[#D4AF37]/30 z-[100] shadow-2xl flex flex-col`}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#D4AF37]/5">
                <div className="flex items-center gap-3 text-[#D4AF37]">
                  <StickyNote size={24} />
                  <h3 className="font-black text-xl font-amiri">{isAr ? 'مفكرة المرابط' : 'Warrior Notepad'}</h3>
                </div>
                <button onClick={() => setIsNotepadOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
                <div id="notepad-content" className="flex-1 flex flex-col">
                  <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0">
                      <BerqCharacter pose="pose_staff_leader" glowColor="gold" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-[#D4AF37] font-black text-xs uppercase tracking-widest">بوابة بيرق</p>
                      <p className="text-white/60 text-[10px] font-bold">{selectedTeacher.name}</p>
                    </div>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => handleSaveNotes(e.target.value)}
                    placeholder={isAr ? 'دون ملاحظاتك الذكية هنا...' : 'Write your smart notes here...'}
                    className="flex-1 w-full bg-transparent text-white outline-none resize-none font-medium leading-relaxed placeholder:text-white/10 custom-scrollbar"
                  />
                </div>
                
                <button 
                  onClick={handleExportPDF}
                  className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-[#D4AF37]/20"
                >
                  <FileDown size={20} />
                  <span>{isAr ? 'تصدير كـ PDF' : 'Export as PDF'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Notepad Button */}
        <button
          onClick={() => setIsNotepadOpen(true)}
          className={`fixed bottom-24 ${isAr ? 'right-8' : 'left-8'} z-50 w-16 h-16 bg-[#D4AF37] text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-110 transition-all group`}
        >
          <StickyNote size={28} />
          <span className={`absolute ${isAr ? 'right-20' : 'left-20'} whitespace-nowrap bg-black/80 text-[#D4AF37] px-4 py-2 rounded-xl text-sm font-black border border-[#D4AF37]/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-reem`}>
            {isAr ? 'مفكرة المرابط' : 'Warrior Notepad'}
          </span>
        </button>

        {/* Course Dashboard Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#050505] border-2 border-[#D4AF37]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent_70%)]" />
          <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedCourse(null)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all border border-white/10"
              >
                <ArrowRight className="rotate-180" size={24} />
              </button>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-white font-amiri">{isAr ? selectedCourse.title : selectedCourse.titleEn}</h1>
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <GraduationCap size={18} />
                  <span className="font-bold font-reem">{selectedTeacher.name}</span>
                </div>
              </div>
            </div>

            {/* Progress Visualizer */}
            <div className="flex items-center gap-6 bg-white/5 p-4 rounded-3xl border border-white/10">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-white/10"
                    strokeDasharray="100, 100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#D4AF37]"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                  {progressPercent}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{isAr ? 'تقدمك في الكورس' : 'Course Progress'}</p>
                <p className="text-white font-bold">{completedCount} / {selectedCourse.lessons.length} {isAr ? 'دروس مكتملة' : 'Lessons Completed'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-8 border-b border-white/10">
          {[
            { id: 'syllabus', label: isAr ? 'المنهج الدراسي' : 'Syllabus', icon: LayoutDashboard },
            { id: 'resources', label: isAr ? 'المصادر والملخصات' : 'Resources', icon: FileText },
            { id: 'quiz', label: isAr ? 'اختبار سريع' : 'Quick Quiz', icon: Trophy },
            { id: 'leaderboard', label: isAr ? 'ردهة المنافسة' : 'Leaderboard', icon: Users },
            { id: 'ask', label: isAr ? 'اسأل الأستاذ' : 'Ask Teacher', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-4 rounded-t-2xl font-black transition-all relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#D4AF37] bg-[#D4AF37]/10'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4AF37]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              {selectedCourse.lessons.map((lesson, i) => (
                <div key={lesson.id} className="glass-card p-6 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${lesson.completed ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/5 text-white/30'}`}>
                      {lesson.completed ? <CheckCircle2 size={24} className="drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" /> : i + 1}
                    </div>
                    <div>
                      <h3 className={`text-lg font-black transition-colors ${lesson.completed ? 'text-white/80' : 'text-white group-hover:text-[#D4AF37]'}`}>
                        {isAr ? lesson.title : lesson.titleEn}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                          <Clock size={12} />
                          45 {isAr ? 'دقيقة' : 'Min'}
                        </span>
                        {lesson.completed && (
                          <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest flex items-center gap-1">
                            <Sparkles size={12} />
                            {isAr ? 'تم الإتقان' : 'Mastered'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!lesson.completed && (
                      <button 
                        onClick={() => handleCompleteLesson(lesson)}
                        className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                        title={isAr ? 'تحديد كمكتمل' : 'Mark as Completed'}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    )}
                    <button className={`p-3 rounded-xl transition-all ${lesson.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'}`}>
                      <PlayCircle size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-black text-white font-amiri">{isAr ? 'ردهة المنافسة' : 'Course Leaderboard'}</h2>
                <p className="text-white/40 font-bold font-reem">{isAr ? 'أفضل 5 فرسان في هذا الكورس' : 'Top 5 Knights in this course'}</p>
              </div>
              
              <div className="space-y-3">
                {MOCK_LEADERBOARD.map((entry, i) => (
                  <div 
                    key={`${entry.id}_${i}_leaderboard`} 
                    className={`glass-card p-6 flex items-center justify-between border-white/5 hover:border-[#D4AF37]/30 transition-all relative overflow-hidden group ${i === 0 ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : ''}`}
                  >
                    {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent pointer-events-none" />}
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${
                        i === 0 ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' :
                        i === 1 ? 'bg-slate-300 text-black' :
                        i === 2 ? 'bg-amber-700 text-white' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {i < 3 ? <Trophy size={20} /> : i + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-[#D4AF37] transition-colors">{entry.name}</h4>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{isAr ? 'فارس معتمد' : 'Verified Knight'}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <div className="flex items-center gap-2 text-[#00E5FF] font-black text-xl">
                        <Sparkles size={18} />
                        <span>{entry.points.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{isAr ? 'نقطة' : 'Points'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCourse.resources.map((res, rIdx) => (
                <div key={`${res.id}_${rIdx}_resource`} className="glass-card p-6 hover:border-[#00E5FF]/30 transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${res.type === 'pdf' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {res.type === 'pdf' ? <FileText size={32} /> : <Trophy size={32} />}
                    </div>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{res.size}</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-6 group-hover:text-[#00E5FF] transition-colors">{res.title}</h3>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleExportPDF();
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-[#00E5FF] hover:text-black rounded-xl font-black flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-[#00E5FF]"
                  >
                    <Download size={18} />
                    <span>{isAr ? 'تحميل الملف' : 'Download File'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="glass-card p-12 text-center space-y-8 max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
                <Trophy size={48} className="animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white">{isAr ? 'تحدي المعرفة السريع' : 'Knowledge Quick Challenge'}</h2>
                <p className="text-white/50 font-medium">{isAr ? 'اختبر معلوماتك في آخر درس شاهدته واحصل على نقاط إضافية!' : 'Test your knowledge on the last lesson you watched and earn extra points!'}</p>
              </div>
              <button className="px-12 py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                {isAr ? 'ابدأ الاختبار الآن' : 'Start Quiz Now'}
              </button>
            </div>
          )}

          {activeTab === 'ask' && (
            <div className="glass-card p-8 max-w-2xl mx-auto space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{isAr ? 'بوابة التواصل المباشر' : 'Direct Contact Portal'}</h3>
                  <p className="text-white/40 text-sm font-medium">{isAr ? 'أرسل سؤالك وسيقوم الأستاذ بالرد عليك في أقرب وقت.' : 'Send your question and the teacher will reply as soon as possible.'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isAr ? 'اكتب سؤالك هنا بالتفصيل...' : 'Write your question here in detail...'}
                  className="w-full h-40 bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-white outline-none focus:border-[#D4AF37]/50 transition-all placeholder:text-white/20 font-bold resize-none"
                />
                <button className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#D4AF37]/90 transition-all shadow-xl">
                  <Send size={20} />
                  <span>{isAr ? 'إرسال السؤال' : 'Send Question'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

    if (selectedTeacher && !selectedCourse) {
    return (
      <div className="min-h-screen pb-20 animate-in fade-in zoom-in duration-700">
        {/* Teacher Hero Section */}
        <div className="relative overflow-hidden rounded-[3rem] bg-[#050505] border-2 border-[#D4AF37]/30 shadow-[0_0_60px_rgba(0,0,0,0.9)] mb-12 group">
          <div className={`absolute inset-0 bg-gradient-to-br ${selectedTeacher.color} opacity-20`} />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent_70%)]" />
          
          <div className="relative p-8 sm:p-12 flex flex-col md:flex-row items-center gap-12">
            <div className="relative">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10"
              >
                <img 
                  src={selectedTeacher.image} 
                  alt={selectedTeacher.name}
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-[2.5rem] object-cover border-4 border-[#D4AF37]/50 shadow-[0_0_40px_rgba(212,175,55,0.3)]"
                />
                <div className="absolute -bottom-4 -right-4 bg-[#D4AF37] text-black p-4 rounded-2xl shadow-2xl flex items-center gap-2 font-black">
                  <Star size={24} fill="currentColor" />
                  <span className="text-xl">{selectedTeacher.rating}</span>
                </div>
              </motion.div>
              <div className="absolute -inset-4 bg-[#D4AF37]/20 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 space-y-6 text-center md:text-right">
              <div className="space-y-2">
                <motion.button 
                  initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedTeacher(null)}
                  className="flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors font-black mb-4 group/back"
                >
                  <ArrowRight className={`transition-transform ${isAr ? '' : 'rotate-180'} group-hover/back:-translate-x-2`} size={20} />
                  <span>{isAr ? 'العودة للأساتذة' : 'Back to Teachers'}</span>
                </motion.button>
                <h1 className="text-5xl sm:text-6xl font-black text-white font-amiri drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {selectedTeacher.name}
                </h1>
                <p className="text-[#00E5FF] text-xl font-black uppercase tracking-[0.2em] font-reem">
                  {isAr 
                    ? SUBJECTS.find(s => s.id === selectedTeacher.subject)?.name 
                    : SUBJECTS.find(s => s.id === selectedTeacher.subject)?.nameEn}
                </p>
              </div>
              <p className="text-white/70 text-lg leading-relaxed max-w-2xl font-medium">
                {selectedTeacher.description}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                <div className="bg-white/5 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                  <Users className="text-[#D4AF37]" size={20} />
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{isAr ? 'الطلاب' : 'Students'}</p>
                    <p className="text-white font-black">{selectedTeacher.students.toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                  <BookOpen className="text-[#00E5FF]" size={20} />
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{isAr ? 'الكورسات' : 'Courses'}</p>
                    <p className="text-white font-black">{selectedTeacher.courses}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section Header */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
            <h2 className="text-3xl font-black text-white font-amiri">
              {isAr ? 'بوابة الكورسات المتاحة' : 'Available Courses Portal'}
            </h2>
          </div>
          <div className="px-6 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] font-black text-sm">
            {MOCK_COURSES.length} {isAr ? 'كورس متاح' : 'Courses Available'}
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-2">
          {MOCK_COURSES.map((course, idx) => (
            <motion.div 
              key={`${course.id}_${idx}_course_card`} 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedCourse(course)}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#00E5FF] rounded-[2.5rem] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#050505] border border-white/10 p-8 flex flex-col sm:flex-row gap-8 transition-all duration-500 group-hover:border-[#D4AF37]/50 group-hover:translate-y-[-8px] shadow-2xl">
                
                {/* Course Icon/Visual */}
                <div className="w-full sm:w-40 h-40 rounded-3xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_70%)]" />
                  <BookOpen size={64} className="text-[#D4AF37] group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]" />
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.3em]">{isAr ? 'كورس معتمد' : 'Certified Course'}</span>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {isAr ? 'متاح' : 'Available'}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white group-hover:text-[#D4AF37] transition-colors font-amiri leading-tight">
                      {isAr ? course.title : course.titleEn}
                    </h3>
                    <p className="text-white/50 text-sm font-medium line-clamp-2 leading-relaxed">
                      {isAr ? course.description : course.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{isAr ? 'الدروس' : 'Lessons'}</span>
                        <span className="text-white font-black">{course.lessons.length}</span>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{isAr ? 'المصادر' : 'Resources'}</span>
                        <span className="text-white font-black">{course.resources.length}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-500 shadow-lg">
                      <ChevronRight size={24} className={isAr ? '' : 'rotate-180'} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-8 p-12">
        <div className="relative">
          <div className="absolute -inset-8 bg-[#D4AF37]/20 blur-[60px] rounded-full animate-pulse" />
          <GraduationCap size={120} className="text-[#D4AF37] relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]" />
        </div>
        <div className="space-y-4 max-w-lg">
          <h2 className="text-4xl font-black text-white font-amiri">
            {isAr ? 'مرحباً بك في عرين المعرفة' : 'Welcome to the Knowledge Den'}
          </h2>
          <p className="text-white/50 text-lg font-medium leading-relaxed">
            {isAr 
              ? 'اختر أستاذك المفضل من القائمة الجانبية لاستكشاف الكورسات المتاحة والبدء في رحلة التفوق.' 
              : 'Select your favorite teacher from the sidebar to explore available courses and start your journey to excellence.'}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-sm font-black flex items-center gap-2">
            <Users size={18} className="text-[#D4AF37]" />
            <span>{TEACHERS.length} {isAr ? 'أستاذ' : 'Teachers'}</span>
          </div>
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-sm font-black flex items-center gap-2">
            <BookOpen size={18} className="text-[#00E5FF]" />
            <span>24+ {isAr ? 'كورس' : 'Courses'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-700 relative">
      {/* Background Sparkles/Particles Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00E5FF]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`flex flex-col lg:flex-row gap-8 relative z-10 ${isAr ? 'lg:flex-row-reverse' : ''}`}>
        {renderSidebar()}
        
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
