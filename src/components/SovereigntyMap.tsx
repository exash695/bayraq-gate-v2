import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Swords, Zap, X, 
  Users, Target, Trophy, Crown,
  ChevronRight, Map as MapIcon, CheckCircle2,
  Lock as LockIcon, ArrowRight, Star
} from 'lucide-react';
import { DualArena } from './DualArena';
import { Battalion } from './Battalion';
import { INITIAL_PAGES } from '../data';
import { Timer } from 'lucide-react';

interface Mission {
  id: string;
  title: { ar: string, en: string };
  description: { ar: string, en: string };
  target: string; // section id
  type: 'unit' | 'battalion' | 'challenge' | 'score' | 'lessons';
  requirement: number;
  icon: any;
  color: string;
}

const STRATEGIC_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: { ar: 'الخطوة الأولى', en: 'The First Step' },
    description: { ar: 'أكمل دراسة الوحدة الأولى بالكامل', en: 'Complete Unit 1 study' },
    target: 'unit-detail-1',
    type: 'unit',
    requirement: 1,
    icon: Star,
    color: '#38bdf8'
  },
  {
    id: 'm2',
    title: { ar: 'توحيد الصفوف', en: 'Unite the Ranks' },
    description: { ar: 'انضم إلى كتيبة أو أسس كتيبتك الخاصة', en: 'Join or found a battalion' },
    target: 'battalion',
    type: 'battalion',
    requirement: 1,
    icon: Shield,
    color: '#a855f7'
  },
  {
    id: 'm3',
    title: { ar: 'المبارز المحترف', en: 'The Professional Duelist' },
    description: { ar: 'انتصر في أول تحدي 1vs1 لك', en: 'Win your first 1vs1 challenge' },
    target: 'hub',
    type: 'challenge',
    requirement: 1,
    icon: Swords,
    color: '#f43f5e'
  },
  {
    id: 'm4',
    title: { ar: 'طالب العلم', en: 'The Scholar' },
    description: { ar: 'أكمل 10 دروس في المحطات المختلفة', en: 'Complete 10 lessons' },
    target: 'hub',
    type: 'lessons',
    requirement: 10,
    icon: Target,
    color: '#22c55e'
  },
  {
    id: 'm5',
    title: { ar: 'حارس البوابة', en: 'The Gate Guardian' },
    description: { ar: 'حقق 1000 نقطة خبرة لتصبح حارساً', en: 'Reach 1000 XP to become a guardian' },
    target: 'profile',
    type: 'score',
    requirement: 1000,
    icon: Crown,
    color: '#facc15'
  }
];

interface SovereigntyMapProps {
  language: 'ar' | 'en';
  unlockedUnits: number[];
  userProfile: any;
  onNavigate: (section: any, unitId?: number) => void;
}

export const SovereigntyMap: React.FC<SovereigntyMapProps> = ({ language, unlockedUnits, userProfile, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'battalion' | 'siege'>('missions');
  const [topBattalion, setTopBattalion] = useState<any>(null);
  const [topUser, setTopUser] = useState<any>(null);
  const [topGovernorate, setTopGovernorate] = useState<{name: string, score: number} | null>(null);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [siegeActive, setSiegeActive] = useState(false);
  const [siegeOpponent, setSiegeOpponent] = useState<any>(null);
  const [siegeType, setSiegeType] = useState<'1vs1' | 'provincial'>('1vs1');
  const [throneUsers, setThroneUsers] = useState<any[]>([]);

  useEffect(() => {
    // Leaderboard Listeners
    const bQuery = query(collection(db, 'battalions'), orderBy('exp', 'desc'), limit(1));
    const unsubscribeB = onSnapshot(bQuery, (snap) => {
      if (!snap.empty) setTopBattalion(snap.docs[0].data());
    }, (error) => {
      console.warn("SovereigntyMap onSnapshot (bQuery) error:", error);
    });

    const uQuery = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(100));
    const unsubscribeU = onSnapshot(uQuery, (snap) => {
      if (!snap.empty) {
        setTopUser(snap.docs[0].data());
        
        const govScores: Record<string, number> = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          if (data.governorate && data.governorate !== 'غير محدد') {
            govScores[data.governorate] = (govScores[data.governorate] || 0) + (data.totalScore || 0);
          }
        });
        
        let topGov = '';
        let maxScore = 0;
        for (const [gov, score] of Object.entries(govScores)) {
          if (score > maxScore) {
            maxScore = score;
            topGov = gov;
          }
        }
        if (topGov) {
          setTopGovernorate({ name: topGov, score: maxScore });
        }
      }
    }, (error) => {
      console.warn("SovereigntyMap uQuery error:", error);
    });

    // Throne Users Listener
    const tQuery = query(
      collection(db, 'users'),
      orderBy('completedUnits', 'desc'),
      orderBy('totalScore', 'desc'),
      limit(3)
    );

    const handleThroneSnapshot = (snapshot: any) => {
      const fetchedUsers = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      const formattedUsers = fetchedUsers.map((user: any, index: number) => {
        const rank = index + 1;
        let color, shadow, height, borderColor;
        
        if (rank === 1) {
          color = 'from-yellow-400 to-yellow-600';
          shadow = 'shadow-[0_0_30px_rgba(250,204,21,0.6)]';
          height = 'h-40';
          borderColor = 'border-yellow-400';
        } else if (rank === 2) {
          color = 'from-slate-300 to-slate-500';
          shadow = 'shadow-[0_0_20px_rgba(148,163,184,0.5)]';
          height = 'h-32';
          borderColor = 'border-slate-300';
        } else {
          color = 'from-amber-600 to-amber-800';
          shadow = 'shadow-[0_0_20px_rgba(217,119,6,0.5)]';
          height = 'h-28';
          borderColor = 'border-amber-600';
        }

        return {
          id: user.id,
          name: user.displayName || user.name || (language === 'ar' ? 'فارس مجهول' : 'Unknown Knight'),
          score: user.totalScore ? `${user.totalScore}` : '0',
          rank,
          color,
          shadow,
          height,
          borderColor
        };
      });

      const uiOrdered = [];
      if (formattedUsers[1]) uiOrdered.push(formattedUsers[1]);
      if (formattedUsers[0]) uiOrdered.push(formattedUsers[0]);
      if (formattedUsers[2]) uiOrdered.push(formattedUsers[2]);

      setThroneUsers(uiOrdered);
    };

    let unsubscribeT = onSnapshot(tQuery, handleThroneSnapshot, (error) => {
      console.warn("Notice: Falling back to single-field query for throne users:", error);
      const fallbackQuery = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(3));
      unsubscribeT = onSnapshot(fallbackQuery, handleThroneSnapshot, (err2) => {
        console.warn("Fallback throne query error:", err2);
      });
    });

    return () => {
      unsubscribeB();
      unsubscribeU();
      if (unsubscribeT) unsubscribeT();
    };
  }, [language]);

  useEffect(() => {
    if (!userProfile) return;
    
    const completed: string[] = [];
    
    if (userProfile.completedPages?.some((p: string) => p.startsWith('1-'))) {
      completed.push('m1');
    }
    
    if (userProfile.battalionId) {
      completed.push('m2');
    }
    
    if ((userProfile.completedPages?.length || 0) >= 10) {
      completed.push('m4');
    }
    
    if ((userProfile.totalScore || 0) >= 1000) {
      completed.push('m5');
    }

    setCompletedMissions(completed);
  }, [userProfile]);

  const triggerHighlight = (id: string) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('neon-highlight-pulse');
        setTimeout(() => el.classList.remove('neon-highlight-pulse'), 3000);
      }
    }, 500);
  };

  const handleMissionClick = (mission: Mission) => {
    if (mission.target === 'battalion') {
      setActiveTab('battalion');
      triggerHighlight('battalion-section');
      return;
    }

    if (mission.target.startsWith('unit-detail-')) {
      const unitId = parseInt(mission.target.split('-').pop() || '1');
      onNavigate('unit-detail', unitId);
      triggerHighlight(`unit-content-${unitId}`);
    } else {
      onNavigate(mission.target);
      triggerHighlight(`section-${mission.target}`);
    }
  };

  return (
    <div className="space-y-10 pb-20 px-0 sm:px-4">
      {/* Throne of Knights Card */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="relative overflow-hidden rounded-none md:rounded-[3rem] bg-[#0c0c14]/40 backdrop-blur-xl p-6 sm:p-10 border-y md:border border-white/10 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--theme-glow),transparent_70%)] opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 sm:gap-6 mb-10 w-full px-4">
              <div className="hidden sm:block h-[2px] w-12 sm:w-24 bg-gradient-to-r from-transparent via-theme-primary to-transparent opacity-50" />
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-theme-primary drop-shadow-[0_0_20px_var(--theme-glow)] flex-shrink-0" />
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-[0.1em] sm:tracking-[0.15em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center">
                {language === 'ar' ? 'عرش الفرسان' : 'Throne of Knights'}
              </h2>
              <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-theme-primary drop-shadow-[0_0_20px_var(--theme-glow)] flex-shrink-0" />
              <div className="hidden sm:block h-[2px] w-12 sm:w-24 bg-gradient-to-l from-transparent via-theme-primary to-transparent opacity-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* First Battalion */}
              <div className="glass-card p-6 border-theme-primary/30 bg-gradient-to-br from-theme-primary/10 to-transparent flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Trophy size={80} />
                </div>
                <div className="w-16 h-16 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary border border-theme-primary/30 shadow-[0_0_15px_var(--theme-glow)] mb-4">
                  <Shield size={32} />
                </div>
                <p className="text-xs font-black text-theme-primary uppercase tracking-widest mb-2">
                  {language === 'ar' ? 'الكتيبة الأولى 🏆' : 'First Battalion 🏆'}
                </p>
                <h4 className="text-2xl font-black text-white truncate w-full mb-1">{topBattalion?.name || '...'}</h4>
                <p className="text-sm text-white/40 font-bold mb-6">Level {topBattalion?.level || 1} • {topBattalion?.exp || 0} EXP</p>
                <button 
                  onClick={() => {
                    if (topBattalion) {
                      setSiegeOpponent(topBattalion);
                      setSiegeType('provincial');
                      setSiegeActive(true);
                    }
                  }}
                  className="mt-auto w-full py-2 rounded-xl bg-theme-primary/20 text-theme-primary border border-theme-primary/50 font-bold hover:bg-theme-primary hover:text-black transition-all flex items-center justify-center gap-2 relative z-20"
                >
                  <Swords size={18} />
                  {language === 'ar' ? 'تحدي' : 'Challenge'}
                </button>
              </div>

              {/* First Governorate */}
              <div className="glass-card p-6 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <MapIcon size={80} />
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-4">
                  <MapIcon size={32} />
                </div>
                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">
                  {language === 'ar' ? 'المحافظة الأولى 🌟' : 'First Governorate 🌟'}
                </p>
                <h4 className="text-2xl font-black text-white truncate w-full mb-1">{topGovernorate?.name || '...'}</h4>
                <p className="text-sm text-white/40 font-bold mb-6">{topGovernorate?.score || 0} XP</p>
                <div className="mt-auto w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-400/50 border border-emerald-500/20 font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  <Shield size={18} />
                  {language === 'ar' ? 'سيادة مطلقة' : 'Absolute Sovereignty'}
                </div>
              </div>

              {/* Gate Guardian */}
              <div className="glass-card p-6 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-110 transition-transform">
                  <Crown size={80} />
                </div>
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 border border-yellow-500/30 shadow-[0_0_15px_rgba(250,204,21,0.3)] mb-4">
                  <Crown size={32} />
                </div>
                <p className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-2">
                  {language === 'ar' ? 'حارس البوابة 👑' : 'Gate Guardian 👑'}
                </p>
                <h4 className="text-2xl font-black text-white truncate w-full mb-1">{topUser?.fullName || '...'}</h4>
                <p className="text-sm text-white/40 font-bold mb-6">{topUser?.totalScore || 0} XP • {topUser?.rank || 'Knight'}</p>
                <button 
                  onClick={() => {
                    if (topUser) {
                      setSiegeOpponent(topUser);
                      setSiegeType('1vs1');
                      setSiegeActive(true);
                    }
                  }}
                  className="mt-auto w-full py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 font-bold hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2 relative z-20"
                >
                  <Swords size={18} />
                  {language === 'ar' ? 'تحدي' : 'Challenge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
        {[
          { id: 'missions', label: language === 'ar' ? 'خارطة المهام' : 'Mission Map', icon: MapIcon },
          { id: 'battalion', label: language === 'ar' ? 'الكتائب' : 'Battalions', icon: Users },
          { id: 'siege', label: language === 'ar' ? 'تحدي الحصار' : 'Siege Challenge', icon: Swords }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all border-2 ${
              activeTab === tab.id 
                ? 'bg-theme-primary text-black border-theme-primary shadow-[0_0_20px_var(--theme-glow)]' 
                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'missions' && (
            <motion.div
              key="missions-map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative py-10"
            >
              {/* Mission Path Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/5 -translate-x-1/2 hidden md:block" />
              
              <div className="space-y-12 relative">
                {STRATEGIC_MISSIONS.map((mission, idx) => {
                  const isCompleted = completedMissions.includes(mission.id);
                  return (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className={`flex items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                    >
                      <div className="flex-1 hidden md:block" />
                      
                      {/* Mission Node */}
                      <button
                        onClick={() => handleMissionClick(mission)}
                        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-500 group ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_30px_rgba(34,197,94,0.4)]' 
                            : 'bg-black/60 border-white/10 hover:border-theme-primary/50'
                        }`}
                        style={{ borderColor: !isCompleted ? `${mission.color}40` : undefined }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={32} className="text-white" />
                        ) : (
                          <mission.icon size={32} style={{ color: mission.color }} className="group-hover:scale-110 transition-transform" />
                        )}
                        
                        {/* Connecting Line to next node (mobile) */}
                        <div className="absolute top-full h-12 w-1 bg-white/5 md:hidden" />
                      </button>

                      {/* Mission Card */}
                      <div className="flex-1 bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-white/5 rounded-none md:rounded-[2.5rem] p-8 hover:border-theme-primary/30 transition-all cursor-pointer group shadow-2xl relative overflow-hidden" onClick={() => handleMissionClick(mission)}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        <div className="relative z-10 flex justify-between items-start mb-4">
                          <h3 className={`text-xl font-black ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                            {language === 'ar' ? mission.title.ar : mission.title.en}
                          </h3>
                          {isCompleted && <Star size={16} className="text-emerald-400 fill-emerald-400" />}
                        </div>
                        <p className="relative z-10 text-white/60 text-sm mb-4">
                          {language === 'ar' ? mission.description.ar : mission.description.en}
                        </p>
                        <div className="relative z-10 flex items-center justify-between">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 ${isCompleted ? 'text-emerald-400' : 'text-white/40'}`}>
                            {isCompleted ? (language === 'ar' ? 'مكتملة' : 'Completed') : (language === 'ar' ? 'قيد التنفيذ' : 'In Progress')}
                          </span>
                          <ArrowRight size={18} className="text-theme-primary group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'battalion' && (
            <motion.div
              key="battalion-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="-mx-4 md:mx-0"
            >
              <Battalion userProfile={userProfile} language={language} />
            </motion.div>
          )}

          {activeTab === 'siege' && (
            <motion.div
              key="siege-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full"
            >
              {/* Siege Command Console - Integrated Dashboard Look */}
              <div className="bg-[#0c0c14]/40 backdrop-blur-xl border-y md:border border-white/10 rounded-none md:rounded-[3rem] shadow-2xl relative overflow-hidden">
                {/* Top Header Strip */}
                <div className="bg-gradient-to-r from-[#4A0404] via-[#8B0000] to-[#4A0404] border-b border-white/10 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Crown className="text-[#D4AF37]" size={32} />
                    <h3 className="text-2xl font-black text-[#D4AF37] tracking-tight">
                      {language === 'ar' ? 'غرفة عمليات الحصار العظيم' : 'Great Siege Operations Room'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-black/40 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">
                      Status: Ready
                    </div>
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                  </div>
                </div>

                {/* Main Console Body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-white/10">
                  {/* Rules Section */}
                  <div className="p-8 space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="text-[#D4AF37]/60" size={20} />
                      <span className="text-[#D4AF37] font-black text-sm uppercase tracking-widest">
                        {language === 'ar' ? 'بروتوكول الاشتباك' : 'Engagement Protocol'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Target, label: language === 'ar' ? 'أسئلة وزارية' : 'Ministerial', color: 'text-red-500' },
                        { icon: Timer, label: language === 'ar' ? '10 ثوانٍ' : '10s Limit', color: 'text-yellow-500' },
                        { icon: Zap, label: language === 'ar' ? 'الخطأ = هزيمة' : 'Fail = Loss', color: 'text-orange-500' }
                      ].map((rule, i) => (
                        <div key={`${rule.label}-${i}`} className="flex flex-col items-center text-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                          <rule.icon className={rule.color} size={24} />
                          <span className="text-white font-bold text-[10px] leading-tight">{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rewards Section */}
                  <div className="p-8 space-y-8 bg-[#8B0000]/5">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy className="text-[#D4AF37]/60" size={20} />
                      <span className="text-[#D4AF37] font-black text-sm uppercase tracking-widest">
                        {language === 'ar' ? 'مكافآت النصر' : 'Victory Rewards'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { icon: Trophy, title: language === 'ar' ? 'وسام' : 'Medal', desc: language === 'ar' ? '15 صح' : '15 Correct' },
                        { icon: Star, title: language === 'ar' ? 'لقب' : 'Title', desc: language === 'ar' ? 'فاتح' : 'Conqueror' },
                        { icon: Zap, title: language === 'ar' ? '300' : '300', desc: language === 'ar' ? 'نقطة' : 'Points' }
                      ].map((reward, i) => (
                        <div key={`${reward.title}-${i}`} className="flex flex-col items-center text-center gap-2 p-4 bg-black/20 border border-white/5 rounded-2xl">
                          <reward.icon className="text-[#D4AF37]" size={24} />
                          <div>
                            <div className="text-white font-black text-[10px]">{reward.title}</div>
                            <div className="text-white/40 text-[8px] font-bold uppercase">{reward.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="p-10 bg-black/80 border-t border-white/10 text-center relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,0,0,0.2)_0%,transparent_70%)]" />
                  <div className="relative z-10 w-full flex flex-col items-center">
                    <button 
                      onClick={() => setSiegeActive(true)}
                      className="group relative px-12 sm:px-20 py-6 bg-gradient-to-b from-[#8B0000] to-[#4A0404] text-[#D4AF37] font-black text-2xl sm:text-3xl shadow-2xl hover:scale-105 transition-all uppercase tracking-tighter flex items-center justify-center gap-6 sm:gap-8 border border-[#D4AF37]/40 rounded-none md:rounded-3xl"
                    >
                      <Swords size={36} className="group-hover:rotate-12 transition-transform" />
                      {language === 'ar' ? 'ابدأ الهجوم العظيم' : 'Start Great Attack'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {siegeActive && (
          <DualArena 
            opponent={{
              uid: 'siege-master',
              fullName: language === 'ar' ? 'سيد الحصار' : 'Siege Master',
              rank: 'Guardian',
              totalScore: 9999,
              photoURL: 'https://picsum.photos/seed/siege/200'
            }}
            type="siege"
            language={language}
            unlockedUnits={unlockedUnits}
            onClose={() => setSiegeActive(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
