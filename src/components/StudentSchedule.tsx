import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from '../lib/firebase';
import { db } from '../lib/firebase';
import { Calendar, MonitorPlay, Users, Shirt, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { academicService } from '../services/academicService';
import { BerqCharacter } from './BerqCharacterManager';
import { ScheduleSkeleton } from './shared/ShimmerSkeleton';
import { normalizeArabicText, getPrefixForGrade, normalizeGradeName } from '../utils/studentUtils';

interface ScheduleEntry {
  id: string;
  day: string;
  className: string;
  time: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  type: 'live' | 'physical';
}

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];
const TIMES = [
  '08:00 صباحاً', '09:00 صباحاً', '10:00 صباحاً', '11:00 صباحاً', '12:00 ظهراً',
  '01:00 ظهراً', '02:00 ظهراً', '04:00 عصراً', '05:00 عصراً', '06:00 مساءً', 
  '07:00 مساءً', '08:00 مساءً'
];

const normalizeDay = (d: string) => (d || '').replace(/[إأآٱ]/g, 'ا').trim();

function matchStudentGrade(itemClassName: string, studentGrade: string): boolean {
  if (!itemClassName) return false;
  if (!studentGrade) return true; // If no specific student grade provided, match
  const rawItem = itemClassName.trim();
  const rawTarget = studentGrade.trim();
  if (rawItem === rawTarget) return true;

  const normItem = normalizeArabicText(rawItem);
  const normTarget = normalizeArabicText(rawTarget);
  if (normItem && normTarget && (normItem === normTarget || normItem.includes(normTarget) || normTarget.includes(normItem))) {
    return true;
  }

  const p1 = getPrefixForGrade(rawItem);
  const p2 = getPrefixForGrade(rawTarget);
  if (p1 && p2 && p1 !== 'STU' && p1 === p2) {
    return true;
  }

  const clean1 = normalizeGradeName(rawItem);
  const clean2 = normalizeGradeName(rawTarget);
  if (clean1 && clean2 && clean1 === clean2) {
    return true;
  }

  return false;
}

function getStageFromGrade(grade: string): string {
  if (!grade) return 'المرحلة الاعدادية';
  const prefix = getPrefixForGrade(grade);
  if (prefix.startsWith('P')) return 'المرحلة الابتدائية';
  if (prefix.startsWith('M')) return 'المرحلة المتوسطة';
  if (prefix.startsWith('S')) return 'المرحلة الاعدادية';

  const norm = normalizeArabicText(grade);
  if (norm.includes('ابتدائي')) return 'المرحلة الابتدائية';
  if (norm.includes('متوسط')) return 'المرحلة المتوسطة';
  return 'المرحلة الاعدادية';
}

function getInitialDay(): string {
  const daysMap: Record<number, string> = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت'
  };
  const today = daysMap[new Date().getDay()];
  if (today && today !== 'الجمعة') {
    const found = DAYS.find(d => normalizeDay(d) === normalizeDay(today));
    if (found) return found;
  }
  return DAYS[0];
}

interface Props {
  grade: string;
  isTeacher?: boolean;
  teacherId?: string;
  schoolId?: string;
  schoolName?: string;
}

export const StudentSchedule: React.FC<Props> = ({ grade, isTeacher, teacherId, schoolId, schoolName }) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState(getInitialDay);
  const [loading, setLoading] = useState(true);
  const [uniformConfig, setUniformConfig] = useState<any>(null);

  useEffect(() => {
    if (isTeacher) return;
    const targetSchoolId = schoolId || 'default';
    const unsub = academicService.subscribeToSchoolSettings(targetSchoolId, (data) => {
      const resolvedStage = getStageFromGrade(grade);
      const stageConfig = data?.uniformConfigs?.[resolvedStage];
      if (stageConfig && stageConfig.isActive) {
        setUniformConfig(stageConfig);
      } else {
        setUniformConfig(null);
      }
    });
    return () => unsub();
  }, [schoolId, grade, isTeacher]);

  useEffect(() => {
    let isMounted = true;

    const processEntries = (rawDocs: any[]) => {
      const parsed: ScheduleEntry[] = rawDocs
        .map(entry => {
          const item = (typeof entry.data === 'function' ? { id: entry.id, ...entry.data() } : entry) as any;
          return {
            id: item.id || `entry_${Math.random()}`,
            day: item.day || item.dayOfWeek || '',
            className: item.className || item.class_name || '',
            time: item.time || item.startTime || item.start_time || '',
            teacherId: item.teacherId || item.teacher_id || '',
            teacherName: item.teacherName || item.teacher_name || '',
            subject: item.subject || '',
            type: item.type || item.classType || item.class_type || 'physical'
          };
        })
        .filter(entry => {
          if (!entry.subject || !entry.time) return false;
          if (isTeacher && teacherId) {
            return entry.teacherId === teacherId;
          }
          return matchStudentGrade(entry.className, grade);
        });

      if (isMounted) {
        setSchedules(parsed);
        setLoading(false);
      }
    };

    // 1. Immediate fetch via REST API to ensure reliable fast loading across new server paths
    const fetchFromApi = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (schoolId && schoolId !== 'all') queryParams.append('schoolId', schoolId);
        if (isTeacher && teacherId) queryParams.append('teacherId', teacherId);
        
        const res = await fetch(`/api/class-schedules?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          const list = json.schedules || json.data || [];
          if (Array.isArray(list) && isMounted) {
            processEntries(list);
          }
        }
      } catch (err) {
        console.warn("StudentSchedule API fallback fetch error:", err);
      }
    };

    fetchFromApi();

    // 2. Realtime subscription via Firestore / SQL adapter
    const colRef = collection(db, 'class_schedules');
    const unsub = onSnapshot(colRef, (snapshot: any) => {
      if (!isMounted) return;
      if (snapshot && snapshot.docs) {
        processEntries(snapshot.docs);
      }
    }, (error: any) => {
      console.warn("StudentSchedule onSnapshot error:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, [grade, isTeacher, teacherId, schoolId]);

  const filteredView = schedules.filter(s => normalizeDay(s.day) === normalizeDay(selectedDay));
  filteredView.sort((a, b) => TIMES.indexOf(a.time) - TIMES.indexOf(b.time));

  const resolvedStage = getStageFromGrade(grade);

  if (loading) {
     return <ScheduleSkeleton />;
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto no-scrollbar space-y-6 text-right" dir="rtl">
      {/* Daily Schedule Main Header Banner across full width */}
      <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[90px] sm:h-[100px] flex items-center">
        {/* Background elegant pattern and overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
        <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Bairaq Video Companion */}
        <div className="absolute left-0 top-0 bottom-0 h-full w-28 sm:w-34 md:w-38 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
          <div className="absolute -left-4 -top-4 w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
          <BerqCharacter
            pose="pose_schedule_planner"
            glowColor="cyan"
            className="w-full h-full object-cover relative z-10 scale-110"
          />
          <div className="absolute inset-y-0 right-0 w-10 sm:w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
        </div>

        {/* Header Title & Subtitle */}
        <div className="relative z-10 flex-1 flex flex-col justify-center pr-4 sm:pr-5 pl-28 sm:pl-36 md:pl-40 py-2 select-none text-right h-full min-w-0">
          <h2 className="text-white text-xs sm:text-sm md:text-base font-black leading-snug drop-shadow-md truncate">
            {isTeacher ? 'جدول الحصص التعليمية 📅' : 'جدول المواعيد اليومي 📅'}
          </h2>
          <div className="flex items-center gap-1 text-[#FFD600] font-bold text-[10px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
            <span className="shrink-0 text-[10px]">🏛️</span>
            <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
          </div>
        </div>
      </div>

      {/* Schedule Days Bar & Content Area */}
      <div className="shrink-0 flex flex-col md:flex-row gap-4 min-h-0">
        {/* Days Selector Bar */}
        <div className="shrink-0 bg-[#0d1226]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-2 sm:p-3 flex md:flex-col items-center justify-around md:justify-start gap-1 sm:gap-2 shadow-xl overflow-x-auto no-scrollbar md:w-28">
          <div className="hidden md:flex items-center gap-1.5 px-2 py-2 mb-2 w-full border-b border-white/5 text-center justify-center">
            <Calendar size={16} className="text-[#FFD600]" />
            <span className="text-[10px] text-white/60 font-black tracking-widest uppercase">الجدول</span>
          </div>
          {DAYS.map((day) => {
            const isSelected = normalizeDay(selectedDay) === normalizeDay(day);
            const count = schedules.filter((s) => normalizeDay(s.day) === normalizeDay(day)).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative flex items-center md:flex-col justify-center px-3 py-2 sm:py-2.5 rounded-xl transition-all outline-none gap-1 cursor-pointer w-full ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FFD600]/25 to-[#FFD600]/10 border border-[#FFD600]/40 text-[#FFD600] shadow-md shadow-[#FFD600]/10'
                    : 'border border-transparent text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black whitespace-nowrap">{day}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                    isSelected ? 'bg-[#FFD600] text-black shadow-md shadow-[#FFD600]/20' : 'bg-white/10 text-white/50'
                  }`}>
                    {count} حصص
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Schedule Panel Content */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar p-4 sm:p-6 bg-gradient-to-bl from-[#101935]/30 to-black/20 rounded-2xl border border-white/5">
          <div className="flex-1">
            {filteredView.length === 0 ? (
              <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-white/30 p-8 bg-black/20 rounded-2xl border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3">
                    <Calendar size={28} className="opacity-50" />
                </div>
                <p className="font-bold text-sm">ليس لديك حصص في هذا اليوم، عطلة سعيدة! 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredView.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`relative p-4 md:p-5 rounded-2xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:bg-white/5 ${
                        entry.type === 'live' 
                        ? 'bg-blue-600/5 border-blue-500/10 hover:border-blue-500/30' 
                        : 'bg-purple-600/5 border-purple-500/10 hover:border-purple-500/30'
                      }`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            entry.type === 'live' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {entry.type === 'live' ? <MonitorPlay size={20} /> : <Users size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h4 className="text-white text-base sm:text-lg font-black leading-none">{entry.subject}</h4>
                               <div className={`inline-flex px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black leading-none ${
                                  entry.type === 'live' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {entry.type === 'live' ? '📡 بث مباشر' : '🏫 حضور فعلي'}
                               </div>
                            </div>
                            {entry.teacherName ? (
                              <p className="text-white/50 text-[11px] font-bold mt-1">أ. {entry.teacherName}</p>
                            ) : null}
                          </div>
                       </div>

                       <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                          <p className="text-white font-black text-sm tracking-widest bg-[#101428] px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">{entry.time}</p>
                          {isTeacher && (
                            <span className="text-[#FFD600] text-[10px] font-black bg-[#FFD600]/10 px-2 py-0.5 rounded-md">{entry.className}</span>
                          )}
                       </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated School Uniform Section positioned below schedule */}
      {!isTeacher && (
        <div className="shrink-0 space-y-4 pt-4 border-t border-white/10">
          {/* School Uniform Header Banner matching exact platform h-[90px] sm:h-[100px] header size */}
          <div className="shrink-0 relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-gradient-to-r from-[#0B122C] via-[#121C42] to-[#0D47A1] shadow-[0_10px_30px_rgba(79,70,229,0.3)] h-[90px] sm:h-[100px] flex items-center">
            {/* Background elegant pattern and overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#121C42] to-[#0a2342] opacity-95" />
            <div className="absolute top-0 left-0 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Bairaq Video Companion with pose_school_uniform */}
            <div className="absolute left-0 top-0 bottom-0 h-full w-28 sm:w-34 md:w-38 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
              <div className="absolute -left-4 -top-4 w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
              <BerqCharacter
                pose="pose_school_uniform"
                glowColor="gold"
                className="w-full h-full object-cover relative z-10 scale-110"
              />
              <div className="absolute inset-y-0 right-0 w-10 sm:w-12 bg-gradient-to-r from-transparent to-[#121C42] z-20 pointer-events-none" />
            </div>

            {/* Header Title & Subtitle */}
            <div className="relative z-10 flex-1 flex flex-col justify-center pr-4 sm:pr-5 pl-28 sm:pl-36 md:pl-40 py-2 select-none text-right h-full min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[9px] sm:text-[10px] font-black">
                  الزي المدرسي المعتمد 👔
                </span>
              </div>
              <h2 className="text-white text-xs sm:text-sm md:text-base font-black leading-snug drop-shadow-md truncate">
                ضوابط ومواصفات الزي المدرسي الرسمي 👔
              </h2>
              <p className="text-white/70 text-[9px] sm:text-[10px] md:text-[11px] font-semibold drop-shadow-sm mt-0.5 truncate">
                التزم بضوابط الزي المعتمد لتكون دائماً بالقمة والتميز
              </p>
            </div>
          </div>

          {/* Uniform Details Cards Container */}
          <div className="bg-gradient-to-bl from-[#101935]/40 to-black/30 rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
            {uniformConfig ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Shirt Specification */}
                <div className="p-4 rounded-xl bg-[#0F1735]/80 border border-indigo-500/20 flex flex-col gap-2 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-base">
                      👔
                    </div>
                    <div>
                      <h4 className="text-white font-black text-xs">الزي العلوي (القميص)</h4>
                      <p className="text-white/40 text-[9px] font-bold">المظهر العلوي المعتمد</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/10 text-indigo-200 text-xs font-black leading-snug">
                    {uniformConfig.shirt}
                  </div>
                </div>

                {/* Pants Specification */}
                <div className="p-4 rounded-xl bg-[#0F1735]/80 border border-cyan-500/20 flex flex-col gap-2 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-base">
                      👖
                    </div>
                    <div>
                      <h4 className="text-white font-black text-xs">الزي السفلي (البنطال)</h4>
                      <p className="text-white/40 text-[9px] font-bold">المظهر السفلي المعتمد</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/10 text-cyan-200 text-xs font-black leading-snug">
                    {uniformConfig.pants}
                  </div>
                </div>

                {/* Shoes Specification */}
                <div className="p-4 rounded-xl bg-[#0F1735]/80 border border-purple-500/20 flex flex-col gap-2 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-base">
                      👟
                    </div>
                    <div>
                      <h4 className="text-white font-black text-xs">الحذاء والإكسسوارات</h4>
                      <p className="text-white/40 text-[9px] font-bold">المرونة والأناقة</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/10 text-purple-200 text-xs font-black leading-snug">
                    {uniformConfig.accessories}
                  </div>
                </div>

                {/* Days Specification */}
                {uniformConfig.days && uniformConfig.days.length > 0 && (
                  <div className="md:col-span-3 p-4 rounded-xl bg-[#0F1735]/80 border border-amber-500/20 flex flex-col gap-2.5 shadow-md">
                    <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                      <Sparkles size={14} />
                      <span>الأيام المقررة للبس الزي المدرسي الرسمي:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((day) => {
                        const isReq = uniformConfig.days?.some((d: string) => 
                          normalizeArabicText(d) === normalizeArabicText(day) || d === day
                        );
                        return (
                          <div
                            key={day}
                            className={`px-3 py-1.5 rounded-lg border text-[11px] font-black flex items-center gap-1.5 ${
                              isReq
                                ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
                                : 'bg-white/5 border-white/5 text-white/30'
                            }`}
                          >
                            <CheckCircle2 size={12} className={isReq ? 'text-amber-400' : 'text-white/20'} />
                            <span>{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes Specification */}
                {uniformConfig.notes && (
                  <div className="md:col-span-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                    <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-amber-200/90 text-[11px] font-bold leading-relaxed">
                      {uniformConfig.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-white/40 text-center border border-dashed border-white/10 rounded-xl">
                <Shirt size={36} className="text-indigo-400/50 mb-2" />
                <h4 className="text-white font-black text-sm">لم يتم تحديد تفاصيل الزي بعد</h4>
                <p className="text-[11px] font-semibold mt-1 max-w-md text-white/50">
                  إدارة المدرسة تعمل حالياً على تحديث جدول وضوابط الزي المدرسي الرسمي لهذه المرحلة.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

