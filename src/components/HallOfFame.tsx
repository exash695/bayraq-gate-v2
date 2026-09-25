import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Star, Target, Shield, Crown, CheckCircle2, Lightbulb, Lock as LockIcon, Sparkles } from 'lucide-react';
import { UserProgress } from '../types';
import { BerqCharacter } from './BerqCharacterManager';
import { collection, query, where, getDocs, limit } from '../lib/firebase';
import { db } from '../lib/firebase';
import { CardGridSkeleton } from './shared/ShimmerSkeleton';

interface HallOfFameProps {
  language: 'ar' | 'en';
  progress: UserProgress;
}

interface TopStudentData {
  id: string;
  fullName: string;
  schoolName: string;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ language, progress }) => {
  const isAr = language === 'ar';
  const [topStudents, setTopStudents] = useState<TopStudentData[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [activeTab, setActiveTab] = useState<'hall' | 'records'>('hall');

  useEffect(() => {
    const fetchTopStudents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('isTopStudent', '==', true),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TopStudentData));
        setTopStudents(fetched);
      } catch (error) {
        console.error("Error fetching top students:", error);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopStudents();
  }, []);

  const ACHIEVEMENTS = [
    {
      id: 'a1',
      title: isAr ? 'فارس البداية' : 'Starting Knight',
      description: isAr ? 'أكملت دراسة صفحتك الأولى بنجاح' : 'Successfully completed your first page',
      icon: Star,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      unlocked: (progress.completedPages?.length || 0) >= 1,
      rank: 'برونزي'
    },
    {
      id: 'a2',
      title: isAr ? 'البطل المثابر' : 'The Persistent Hero',
      description: isAr ? 'أكملت دراسة 10 صفحات' : 'Completed 10 pages',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      unlocked: (progress.completedPages?.length || 0) >= 10,
      rank: 'فضي'
    },
    {
      id: 'a3',
      title: isAr ? 'سيد الإتقان' : 'Master of Mastery',
      description: isAr ? 'أتقنت 5 صفحات بالكامل' : 'Mastered 5 pages completely',
      icon: Medal,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      unlocked: (progress.masteredPages?.length || 0) >= 5,
      rank: 'ذهبي'
    },
    {
      id: 'a4',
      title: isAr ? 'حامي البوابة' : 'Gate Guardian',
      description: isAr ? 'وصلت إلى رتبة Guardian' : 'Reached Guardian rank',
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      unlocked: progress.rank === 'guardian',
      rank: 'أسطوري'
    },
    {
      id: 'a5',
      title: isAr ? 'صياد الأفكار' : 'Idea Hunter',
      description: isAr ? 'دونت أول ملاحظة ذكية في بنك الأفكار' : 'Wrote your first smart note in the idea bank',
      icon: Lightbulb,
      color: 'text-[#00E5FF]',
      bgColor: 'bg-[#00E5FF]/10',
      unlocked: progress.favorites?.length > 0,
      rank: 'ماسي'
    },
    {
      id: 'a6',
      title: isAr ? 'ملك التحدي' : 'Challenge King',
      description: isAr ? 'فزت في أول تحدي الستين ثانية' : 'Won your first 60-second challenge',
      icon: Crown,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      unlocked: false,
      rank: 'ملكي'
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 p-4 md:p-8">
      <div className="text-center space-y-4 relative">
        <div className="absolute inset-x-0 -top-20 flex justify-center opacity-20 blur-3xl pointer-events-none">
          <div className="w-64 h-64 bg-indigo-500 rounded-full" />
        </div>
        
        <motion.div 
          initial={{ scale: 0.8, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          className="w-36 h-36 mx-auto mb-4 relative flex items-center justify-center"
        >
          <BerqCharacter 
            pose="pose_champion_laureate" 
            glowColor="gold"
            className="w-full h-full object-cover scale-110"
          />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
          {isAr ? 'قاعة الأساطير' : 'Hall of Legends'}
        </h1>

        {/* وسم قريباً بين أيديكم */}
        <div className="flex justify-center items-center gap-2 pt-1 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Sparkles size={13} className="text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs md:text-sm font-black tracking-wide">
              {isAr ? 'قريباً بين أيديكم • إطلاق مرتقب ⚔️' : 'Coming Soon • Anticipated Launch ⚔️'}
            </span>
          </div>
        </div>

        <p className="text-white/40 max-w-lg mx-auto font-bold text-base md:text-lg leading-relaxed">
          {isAr 
            ? 'مرحباً بك في ساحة الشرف الملكية. هنا تُخلد إنجازاتك الدراسية وتحتفل بانتصاراتك مع نخبة الفرسان.' 
            : 'Welcome to the royal arena of honor. Here your academic achievements are immortalized and your victories celebrated.'}
        </p>
      </div>

      {/* الرادار المتفوقين */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0A0F1D] border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col items-center text-center space-y-4 mb-10 relative z-10">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {isAr ? 'رواد التميز' : 'Pioneers of Excellence'}
          </h2>
          <p className="text-white/40 font-bold max-w-xl mx-auto text-sm">
            {isAr ? 'نُخبة الطلاب الذين أثبتوا جدارتهم في ميادين العلم والمعرفة.' : 'The elite students who proved their worth in the fields of science and knowledge.'}
          </p>
        </div>

        {loadingTop ? (
          <div className="p-4">
            <CardGridSkeleton count={3} />
          </div>
        ) : topStudents.length === 0 ? (
          <div className="text-center p-8 text-white/40 italic bg-white/5 rounded-3xl border border-white/5">{isAr ? 'لا يوجد أساطير مدرجين حالياً' : 'No legends listed currently'}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topStudents.map((student, idx) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#050812] border border-white/5 rounded-[1.5rem] p-5 flex items-center gap-4 hover:border-indigo-500/30 transition-all group shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.05)]"
              >
                <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center font-black text-lg shadow-inner ${
                    idx === 0 ? 'bg-gradient-to-br from-[#D4AF37] to-[#B8942E] text-black border border-[#D4AF37]/50' :
                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black border border-white/30' :
                    'bg-[#0A0F1D] text-white/50 border border-white/10'
                }`}>
                  {idx + 1}
                </div>
                <div className="text-right flex-1">
                  <h3 className="font-bold text-white text-lg group-hover:text-indigo-400 transition-colors">{student.fullName}</h3>
                  <p className="text-xs text-white/40 font-bold">{student.schoolName || (isAr ? 'بوابة بيرق' : 'Gateway Academy')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <div className="space-y-6 pt-6">
        <h3 className="text-2xl font-black text-white text-center pb-6">
          {isAr ? 'إنجازاتي الشخصية' : 'My Achievements'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ACHIEVEMENTS.map((achievement, idx) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ y: -5 }}
            className={`p-1 rounded-[40px] transition-all relative group shadow-2xl ${
              achievement.unlocked 
                ? 'bg-gradient-to-br from-white/20 via-white/5 to-transparent border border-white/10' 
                : 'bg-black/40 border border-white/5 opacity-40 grayscale pointer-events-none'
            }`}
          >
            <div className="bg-[#0A0F1E] rounded-[39px] p-8 h-full space-y-6 relative overflow-hidden">
               {achievement.unlocked && (
                 <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-125 transition-transform duration-700">
                   <achievement.icon size={200} />
                 </div>
               )}

              <div className="flex items-start justify-between">
                <div className={`w-16 h-16 rounded-2xl ${achievement.bgColor} flex items-center justify-center ${achievement.color} border border-white/10 shadow-lg`}>
                  <achievement.icon size={32} />
                </div>
                {achievement.unlocked ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                      {isAr ? 'تم الفتح' : 'Unlocked'}
                    </span>
                    <span className="text-[10px] text-[#FFD600] font-black mt-1 italic tracking-widest">{achievement.rank}</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                    <LockIcon size={18} />
                  </div>
                )}
              </div>

              <div className="space-y-2 relative z-10">
                <h3 className="text-2xl font-black text-white">{achievement.title}</h3>
                <p className="text-sm text-white/30 font-bold leading-relaxed">{achievement.description}</p>
              </div>

              {achievement.unlocked ? (
                <div className="pt-4 flex items-center gap-3">
                  <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
              ) : (
                <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                  <Crown size={12} />
                  <span>{isAr ? 'تحدي قيد المعالجة' : 'Challenge in progress'}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="glass-card p-12 border-[#FFD600]/20 text-center relative overflow-hidden rounded-[50px] shadow-[0_0_80px_rgba(255,214,0,0.1)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,214,0,0.05)_0%,transparent_70%)]" />
        <div className="relative z-10 space-y-6">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Crown size={64} className="mx-auto text-[#FFD600]" />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {isAr ? 'طريق السيادة يبدأ هنا' : 'The Path to Sovereignty Begins Here'}
          </h2>
          <p className="text-white/30 font-bold max-w-md mx-auto text-lg leading-relaxed">
            {isAr 
              ? 'كل قراءة، كل سؤال، وكل تحدي يقربك من لقب "الحارس الأسطوري". استمر ولا تتوقف!' 
              : 'Every reading, every question, and every challenge brings you closer to the title of "Legendary Guardian". Keep going!'}
          </p>
          <div className="pt-4">
             <div className="inline-flex flex-col items-center gap-2 text-[9px] font-black text-[#FFD600] uppercase tracking-[0.5em] px-6 py-2 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20">
               <span>بوابة بَيْرَق</span>
               <span className="h-px w-12 bg-[#FFD600]/40" />
             </div>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};
