import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Trophy, Megaphone, QrCode, 
  Bell, BookOpenText, Users2, Layers, Search, RefreshCw, AlertCircle, ArrowLeft
} from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';
import { normalizeGradeCanonical } from '../utils/studentUtils';

interface AdminHomeDashboardProps {
  schoolName: string;
  selectedSchoolId: string | null;
  setActiveTab: (tab: any) => void;
  onOpenNotifications?: () => void;
}

export const AdminHomeDashboard: React.FC<AdminHomeDashboardProps> = ({ 
  schoolName, 
  selectedSchoolId,
  setActiveTab,
  onOpenNotifications
}) => {
  const { students, teachers, savedLists, isLoading } = useAdminData(selectedSchoolId, schoolName);
  const [dataError, setDataError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fallback timeout to detect loading errors if Firebase gets stuck
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setDataError(true);
      }, 15000);
    } else {
      setDataError(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleRetry = () => {
    setDataError(false);
    window.location.reload();
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Accurate Synchronized Statistics (Strictly Current Enrolled Active Data)
  const studentsCount = students.length;
  const teachersCount = teachers.filter(t => t.role !== 'STAFF' && !t.isDeleted).length;
  
  const parentsCount = useMemo(() => {
    if (students.length === 0) return 0;
    const parentCodes = new Set(
      students
        .map(s => s.parentCode || (s.code ? `P-${s.code}` : null) || (s.student ? `P-${s.student}` : null) || s.id)
        .filter(Boolean)
    );
    return parentCodes.size;
  }, [students]);

  const classesCount = useMemo(() => {
    if (savedLists && savedLists.length > 0) {
      const distinctClasses = new Set(
        savedLists.map((l: any) => normalizeGradeCanonical(l.grade || l.name || '')).filter(Boolean)
      );
      return distinctClasses.size > 0 ? distinctClasses.size : 1;
    }
    const classes = new Set(students.filter(s => s.grade).map(s => normalizeGradeCanonical(s.grade || '')).filter(Boolean));
    return classes.size > 0 ? classes.size : 0;
  }, [savedLists, students]);

  // Search logic among verified active school members
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { students: [], teachers: [] };
    const query = searchQuery.toLowerCase().trim();
    
    return {
      students: students.filter(s => 
        s.name?.toLowerCase().includes(query) || 
        s.code?.toLowerCase().includes(query)
      ).slice(0, 3), // Limit to 3
      teachers: teachers.filter(t => 
        t.name?.toLowerCase().includes(query) ||
        t.subject?.toLowerCase().includes(query)
      ).slice(0, 3)
    };
  }, [searchQuery, students, teachers]);

  const renderSkeleton = () => (
    <div className="animate-pulse bg-white/10 h-7 w-12 rounded-md mb-1"></div>
  );

  const getGreetingName = (name: string) => {
    if (!name) return 'المدرسة';
    if (name.includes('مدرسة') || name.includes('ثانوية') || name.includes('إعدادية') || name.includes('ابتدائية') || name.includes('متوسطة')) {
      return name;
    }
    return `مدرسة ${name}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto min-h-screen pb-32 pt-6 font-sans px-4 space-y-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <div className="w-12 h-12 shrink-0 overflow-hidden rounded-[1rem] relative border border-white/5 flex items-center justify-center bg-[#0A0F1D] p-1 shadow-sm">
          <img src="/logo.png" alt="شعار البوابة" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[#D4AF37] font-black font-amiri text-lg tracking-wide">وَقُل رَّبِّ زِدْنِي عِلْمًا</span>
        </div>
        <button 
          onClick={() => onOpenNotifications?.()}
          className="w-12 h-12 flex items-center justify-center shrink-0 rounded-[1rem] bg-[#0A0F1D] border border-white/5 shadow-sm hover:bg-white/5 transition-colors active:scale-95"
        >
          <Bell size={18} className="text-[#D4AF37]" />
        </button>
      </div>

      {/* Greeting Card - Executive Style */}
      <div className="bg-gradient-to-br from-[#101935] to-[#0A0F1D] border border-white/5 rounded-[1.5rem] p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <h2 className="text-xl font-black text-white leading-tight">
            مرحباً بإدارة {getGreetingName(schoolName)}
          </h2>
          <p className="text-white/50 text-xs font-bold leading-relaxed">
            إليك نظرة سريعة ومباشرة على أداء مدرستك اليوم.
          </p>
        </div>
        {/* Subtle decorative glow */}
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Summary Grid */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-widest px-1">الملخص الإحصائي المباشر</h3>
        
        {dataError ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-[1.25rem] p-6 flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="text-rose-400" size={24} />
            <div>
              <p className="text-sm font-bold text-rose-400">تعذر تحديث البيانات</p>
              <p className="text-[10px] text-white/50 mt-1">يرجى التحقق من اتصالك بالإنترنت</p>
            </div>
            <button 
              onClick={handleRetry}
              className="mt-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={12} />
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { title: 'الطلاب', count: studentsCount, icon: Users, color: 'text-blue-400', tab: 'students' },
              { title: 'الكادر التدريسي', count: teachersCount, icon: BookOpenText, color: 'text-fuchsia-400', tab: 'teachers' },
              { title: 'أولياء الأمور', count: parentsCount, icon: Users2, color: 'text-emerald-400', tab: 'codes' },
              { title: 'الصفوف', count: classesCount, icon: Layers, color: 'text-amber-400', tab: 'students' },
            ].map((stat, idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveTab(stat.tab)}
                className="bg-[#0A0F1D] border border-white/5 hover:border-white/10 rounded-[1rem] py-3.5 px-2 flex flex-col items-center justify-center gap-2 shadow-sm transition-colors active:scale-95 relative overflow-hidden group"
              >
                <stat.icon className={`${stat.color} opacity-80 group-hover:scale-110 transition-transform`} size={16} />
                <div className="text-center w-full flex flex-col items-center">
                  {isLoading ? renderSkeleton() : (
                    <h3 className="text-[1.1rem] font-black text-white leading-none mb-1">{stat.count}</h3>
                  )}
                  <p className="text-[9px] font-bold text-white/40 truncate w-full">{stat.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative group z-20" ref={searchRef}>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <Search className="text-white/30 group-focus-within:text-[#D4AF37] transition-colors" size={16} />
        </div>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="ابحث عن طالب أو معلم..." 
          className="w-full bg-[#0A0F1D] border border-white/5 rounded-[1.25rem] py-3.5 pr-11 pl-4 text-xs font-bold text-right text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30 shadow-sm transition-all"
        />
        
        <AnimatePresence>
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full mt-2 w-full bg-[#101935] border border-white/10 rounded-[1.25rem] overflow-hidden shadow-2xl flex flex-col"
            >
              {searchResults.students.length === 0 && searchResults.teachers.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-xs font-bold">لا توجد نتائج مطابقة</div>
              ) : (
                <>
                  {searchResults.students.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-3 py-1.5 bg-black/20 text-[10px] font-bold text-white/40">الطلاب</div>
                      {searchResults.students.map(s => (
                        <button key={s.id} onClick={() => setActiveTab('students')} className="text-right px-3 py-2.5 hover:bg-white/5 text-xs text-white border-b border-white/5 last:border-0 flex justify-between items-center transition-colors">
                          <span>{s.name}</span>
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{s.grade || 'طالب'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.teachers.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-3 py-1.5 bg-black/20 text-[10px] font-bold text-white/40">الكادر التدريسي</div>
                      {searchResults.teachers.map(t => (
                        <button key={t.id} onClick={() => setActiveTab('teachers')} className="text-right px-3 py-2.5 hover:bg-white/5 text-xs text-white border-b border-white/5 last:border-0 flex justify-between items-center transition-colors">
                          <span>{t.name}</span>
                          <span className="text-[10px] text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full">{t.subject || 'معلم'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Shortcut Cards (Bento Style) */}
      <div className="space-y-3 relative z-10">
        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-widest px-1">الوصول السريع</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'codes', name: 'مركز الأكواد', icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { id: 'students', name: 'شؤون الطلاب والدرجات', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { id: 'broadcast', name: 'الإذاعة المدرسية', icon: Megaphone, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { id: 'sovereignty', name: 'منصة السيادة', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((tab, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveTab(tab.id)}
              className="bg-[#0A0F1D] border border-white/5 hover:border-[#D4AF37]/30 rounded-[1.25rem] p-3.5 flex flex-col gap-3 items-start transition-all shadow-sm active:scale-95 group"
            >
              <div className={`w-9 h-9 rounded-xl ${tab.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <tab.icon className={tab.color} size={18} />
              </div>
              <div className="text-right">
                <h4 className="text-xs font-black text-white mb-0.5">{tab.name}</h4>
                <p className="text-[9px] text-white/40 font-bold">انقر للإدارة والتعديل</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Admin Button */}
      <button 
        onClick={() => setActiveTab('pulse')} 
        className="w-full relative overflow-hidden bg-gradient-to-l from-[#D4AF37] to-[#F3D77A] text-[#0A0F1D] font-black text-sm rounded-[1.25rem] py-4 px-4 text-center hover:opacity-90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-4 flex items-center justify-center gap-3 active:scale-95 group"
      >
        <span className="relative z-10 text-[15px]">الدخول إلى لوحة التحكم الشاملة</span>
        <ArrowLeft size={18} className="relative z-10 group-hover:-translate-x-1 transition-transform" />
        <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out" />
      </button>

    </motion.div>
  );
};

