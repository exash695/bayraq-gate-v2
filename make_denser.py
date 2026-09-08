import os

sovereignty_dir = "src/components/Sovereignty"

# 1. SovereigntyPlatform.tsx
with open(os.path.join(sovereignty_dir, "SovereigntyPlatform.tsx"), "w") as f:
    f.write('''import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flag, Swords, Crown, Medal, Users, History, Target, ArrowRight } from 'lucide-react';
import { SovereigntyDashboard } from './SovereigntyDashboard';
import { SovereigntyTournaments } from './SovereigntyTournaments';
import { SovereigntyFlags } from './SovereigntyFlags';
import { SovereigntyLeaderboards } from './SovereigntyLeaderboards';
import { SovereigntyHistory } from './SovereigntyHistory';

interface Props {
  language: "ar" | "en";
  userProfile?: any;
  onBack?: () => void;
  onNavigate?: (section: string, id?: string) => void;
}

export type SovereigntyTab = 'dashboard' | 'tournaments' | 'competitions' | 'flags' | 'leaderboards' | 'history';

export function SovereigntyPlatform({ language, userProfile, onBack, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<SovereigntyTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: language === "ar" ? "الرئيسية" : "Dashboard", icon: Trophy, color: 'text-amber-400' },
    { id: 'tournaments', label: language === "ar" ? "البطولات" : "Tournaments", icon: Crown, color: 'text-purple-400' },
    { id: 'competitions', label: language === "ar" ? "منافساتي" : "My Battles", icon: Swords, color: 'text-rose-400' },
    { id: 'flags', label: language === "ar" ? "الرايات" : "Flags", icon: Flag, color: 'text-emerald-400' },
    { id: 'leaderboards', label: language === "ar" ? "الترتيب" : "Ranks", icon: Users, color: 'text-blue-400' },
    { id: 'history', label: language === "ar" ? "السجل" : "History", icon: History, color: 'text-gray-400' },
  ] as const;

  return (
    <div className="w-full h-full min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4 md:gap-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Mobile Header / Desktop Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors mb-1 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/5"
          >
            <ArrowRight size={16} className={language === "ar" ? "" : "rotate-180"} />
            <span className="text-xs font-bold">{language === "ar" ? "العودة" : "Back"}</span>
          </button>
        )}
        
        <div className="bg-[#0A0F1D] border border-amber-500/20 rounded-[1.5rem] p-4 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg border border-white/10 shrink-0">
              <Crown size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white leading-tight">
                {language === "ar" ? "منصة السيادة" : "Sovereignty"}
              </h1>
              <p className="text-[10px] md:text-xs text-amber-400/80 font-bold mt-0.5">
                {language === "ar" ? "دوري المدارس والمنافسات" : "Schools League & Battles"}
              </p>
            </div>
          </div>

          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-2 lg:pb-0 hide-scrollbar scroll-smooth">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 md:py-3 rounded-xl transition-all whitespace-nowrap shrink-0 lg:w-full text-right ${
                    isActive
                      ? 'bg-white/10 border border-white/10 shadow-md scale-[1.02]'
                      : 'hover:bg-white/5 text-white/50 hover:text-white/80 border border-transparent'
                  }`}
                >
                  <Icon size={16} className={`${isActive ? tab.color : 'opacity-50'}`} />
                  <span className={`text-[11px] md:text-sm font-bold ${isActive ? 'text-white' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0A0F1D] border border-white/10 rounded-[1.5rem] p-3 md:p-5 shadow-2xl overflow-hidden relative min-h-[400px]">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[200px] bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="h-full relative z-10"
          >
            {activeTab === 'dashboard' && <SovereigntyDashboard language={language} userProfile={userProfile} onNavigate={setActiveTab} />}
            {activeTab === 'tournaments' && <SovereigntyTournaments language={language} userProfile={userProfile} />}
            {activeTab === 'competitions' && <SovereigntyTournaments language={language} userProfile={userProfile} isCompetitionsMode />}
            {activeTab === 'flags' && <SovereigntyFlags language={language} userProfile={userProfile} />}
            {activeTab === 'leaderboards' && <SovereigntyLeaderboards language={language} userProfile={userProfile} />}
            {activeTab === 'history' && <SovereigntyHistory language={language} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
''')

# 2. SovereigntyDashboard.tsx
with open(os.path.join(sovereignty_dir, "SovereigntyDashboard.tsx"), "w") as f:
    f.write('''import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Flag, ShieldAlert, Sparkles, Swords } from 'lucide-react';

export function SovereigntyDashboard({ language, userProfile, onNavigate }: any) {
  return (
    <div className="space-y-4 md:space-y-5">
      {/* Berq Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-[#101935] to-indigo-900/40 border border-amber-500/30 rounded-[1.25rem] p-4 relative overflow-hidden flex flex-row items-center gap-3 md:gap-5 shadow-lg">
        <div className="absolute -right-5 -top-5 w-32 h-32 bg-amber-500/20 blur-[30px] rounded-full pointer-events-none" />
        
        {/* Berq Mascot Avatar - smaller for density */}
        <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-xl relative animate-pulse-slow">
          <div className="w-full h-full bg-[#0A0F1D] rounded-[0.9rem] flex items-center justify-center overflow-hidden relative">
             <Sparkles size={24} className="text-amber-400" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/20 animate-bounce">
            {language === "ar" ? "جديد!" : "New!"}
          </div>
        </div>

        <div className="flex-1 text-right z-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] font-bold text-amber-400">
              {language === "ar" ? "بيرق يعلن التحدي!" : "Challenge Alert!"}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-base md:text-lg font-black text-white mb-0.5 leading-tight">
                {language === "ar" ? "كأس الرياضيات الكبرى 🏆" : "The Great Math Cup 🏆"}
              </h2>
              <p className="text-[10px] md:text-xs text-white/70 font-medium max-w-sm leading-snug line-clamp-2">
                {language === "ar" 
                  ? "انطلقت الآن بطولة المدارس في الرياضيات! شارك واكسب النقاط الموزونة لفريقك."
                  : "The Inter-School Math Tournament has begun! Earn points for your team."}
              </p>
            </div>
            <button onClick={() => onNavigate('tournaments')} className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 w-fit shrink-0 mt-1 md:mt-0">
              <Swords size={14} />
              {language === "ar" ? "شارك" : "Join"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title={language === "ar" ? "نقاط السيادة" : "Sovereignty Points"} value="1,240" icon={Trophy} color="amber" />
        <StatCard title={language === "ar" ? "ترتيب المدرسة" : "School Rank"} value="#3" icon={Target} color="indigo" />
        <StatCard title={language === "ar" ? "الرايات المكتسبة" : "Earned Flags"} value="5" icon={Flag} color="emerald" />
        <StatCard title={language === "ar" ? "ترتيب الصف" : "Class Rank"} value="#1" icon={ShieldAlert} color="rose" />
      </div>
      
      {/* My Current Status */}
      <div className="bg-white/5 border border-white/10 rounded-[1.25rem] p-4 md:p-5">
        <h3 className="text-sm md:text-base font-black text-white mb-3 flex items-center gap-2">
          <Flag className="text-blue-400" size={16} />
          {language === "ar" ? "موقفي الحالي" : "My Current Status"}
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-center bg-[#050810] p-3 rounded-xl border border-white/5">
           <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
             <Trophy size={20} className="text-blue-400" />
           </div>
           <div className="flex-1 text-center md:text-right">
             <h4 className="text-sm font-bold text-white">{userProfile?.fullName || (language === "ar" ? "بطل بيرق" : "Berq Hero")}</h4>
             <p className="text-[10px] md:text-xs text-white/50 mt-0.5">{language === "ar" ? "المستوى 12 • منافس نشط" : "Level 12 • Active Contender"}</p>
           </div>
           <div className="w-full md:w-1/3">
             <div className="flex justify-between text-[10px] mb-1">
               <span className="text-blue-400 font-bold">{language === "ar" ? "نحو المستوى التالي" : "To next level"}</span>
               <span className="text-white">85%</span>
             </div>
             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full w-[85%] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };
  const activeColor = colors[color as keyof typeof colors];

  return (
    <div className="bg-[#050810] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-1.5 relative overflow-hidden group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${activeColor}`}>
        <Icon size={16} />
      </div>
      <h3 className="text-lg md:text-xl font-black text-white leading-none">{value}</h3>
      <p className="text-[9px] md:text-[10px] font-bold text-white/40 leading-none">{title}</p>
    </div>
  );
}
''')

# 3. SovereigntyTournaments.tsx
with open(os.path.join(sovereignty_dir, "SovereigntyTournaments.tsx"), "w") as f:
    f.write('''import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, Users, Swords, Calculator, BookOpen, FlaskConical, Play } from 'lucide-react';

export function SovereigntyTournaments({ language, userProfile, isCompetitionsMode }: any) {
  const tournaments = [
    {
      id: 1,
      title: language === "ar" ? "كأس الرياضيات الكبرى" : "Great Math Cup",
      type: "league",
      subject: "math",
      icon: Calculator,
      color: "from-blue-600 to-indigo-800",
      accent: "text-blue-400",
      participants: "45 مدرسة",
      timeLeft: "3 أيام",
      status: "active"
    },
    {
      id: 2,
      title: language === "ar" ? "تحدي القراءة السريع" : "Speed Reading Challenge",
      type: "school",
      subject: "arabic",
      icon: BookOpen,
      color: "from-emerald-600 to-teal-800",
      accent: "text-emerald-400",
      participants: "12 صف",
      timeLeft: "5 ساعات",
      status: "active"
    },
    {
      id: 3,
      title: language === "ar" ? "بطولة عباقرة العلوم" : "Science Geniuses",
      type: "class",
      subject: "science",
      icon: FlaskConical,
      color: "from-rose-600 to-pink-800",
      accent: "text-rose-400",
      participants: "32 طالب",
      timeLeft: "غداً",
      status: "upcoming"
    }
  ];

  const filtered = isCompetitionsMode 
    ? tournaments.filter(t => t.type === 'class' || t.type === 'school')
    : tournaments.filter(t => t.type === 'league' || t.type === 'school');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white leading-tight">
            {isCompetitionsMode 
              ? (language === "ar" ? "منافساتي الداخلية" : "Internal Competitions")
              : (language === "ar" ? "البطولات ودوري المدارس" : "Tournaments & League")}
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {language === "ar" ? "شارك، نافس، وارفع رايتك!" : "Join, compete, and raise your flag!"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((t) => {
          const Icon = t.icon;
          return (
            <motion.div 
              key={t.id}
              whileHover={{ y: -2 }}
              className={`bg-gradient-to-br ${t.color} p-[1px] rounded-2xl overflow-hidden shadow-lg`}
            >
              <div className="bg-[#0A0F1D]/90 backdrop-blur-md w-full h-full rounded-[15px] p-3 md:p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${t.accent}`}>
                    <Icon size={18} />
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white flex items-center gap-1">
                    {t.status === 'active' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {language === "ar" ? "جارية الآن" : "Live"}
                      </>
                    ) : (
                      <>
                        <Clock size={10} />
                        {language === "ar" ? "قريباً" : "Upcoming"}
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-black text-white mb-1.5 leading-tight">{t.title}</h3>
                  <div className="flex flex-wrap gap-2 text-[10px] font-medium text-white/70">
                    <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                      <Users size={12} /> {t.participants}
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                      <Clock size={12} /> {t.timeLeft}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/50">
                    {t.type === 'league' ? (language === "ar" ? "دوري المدارس" : "Schools League") : 
                     t.type === 'school' ? (language === "ar" ? "منافسة مدرسية" : "School Battle") :
                     (language === "ar" ? "تحدي صفي" : "Class Challenge")}
                  </span>
                  <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10 shadow-sm">
                    <Play size={14} className={language === "ar" ? "rotate-180" : ""} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
''')

# 4. SovereigntyFlags.tsx
with open(os.path.join(sovereignty_dir, "SovereigntyFlags.tsx"), "w") as f:
    f.write('''import React from 'react';
import { motion } from 'motion/react';
import { Flag, Star, Zap, Brain, Target, Shield } from 'lucide-react';

export function SovereigntyFlags({ language, userProfile }: any) {
  const flags = [
    { id: 1, name: "راية الرياضيات", enName: "Math Flag", desc: "بطل الجبر والهندسة", icon: CalculatorIcon, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", earned: true },
    { id: 2, name: "راية العلوم", enName: "Science Flag", desc: "المكتشف الصغير", icon: FlaskIcon, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", earned: true },
    { id: 3, name: "راية القراءة", enName: "Reading Flag", desc: "دودة الكتب", icon: BookIcon, color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", earned: false },
    { id: 4, name: "راية الإبداع", enName: "Creativity Flag", desc: "أفكار خارج الصندوق", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", earned: true },
    { id: 5, name: "راية المثابرة", enName: "Perseverance Flag", desc: "لا يستسلم أبداً", icon: Shield, color: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/30", earned: false },
    { id: 6, name: "راية التاريخ", enName: "History Flag", desc: "حارس الحضارات", icon: Target, color: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-500/30", earned: false },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center max-w-sm mx-auto mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-3 border border-white/20">
          <Flag size={20} className="text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-black text-white mb-1.5 leading-tight">
          {language === "ar" ? "نظام الرايات والشارات" : "Flags & Badges System"}
        </h2>
        <p className="text-[10px] md:text-xs text-white/60 font-medium leading-snug">
          {language === "ar" 
            ? "الراية هي رمز السيادة والإنجاز. احصل عليها عبر الفوز بالمنافسات." 
            : "Flags represent your sovereignty. Earn them by winning battles."}
        </p>
      </div>

      {/* Increased density: grid-cols-2 on tiny mobile, 3 on normal mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
        {flags.map((flag, idx) => {
          const Icon = flag.icon;
          return (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-[1.25rem] border flex flex-col items-center text-center transition-transform ${
                flag.earned 
                  ? flag.border + " " + flag.bg.replace('/20', '/10') + " p-3" 
                  : 'border-white/5 bg-white/5 grayscale opacity-70 scale-[0.96] p-2.5'
              }`}
            >
              {flag.earned && <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />}
              
              {/* Flag Pole Graphic - Reduced height for density */}
              <div className="relative mb-2 mt-1">
                <div className="w-1 h-10 bg-white/20 absolute -left-1.5 bottom-0 rounded-full" />
                <div className={`w-9 h-7 rounded-md flex items-center justify-center shadow-md relative z-10 ${flag.earned ? flag.bg.replace('/20', '') : 'bg-white/10'}`}>
                  <Icon size={14} className={flag.earned ? 'text-white' : 'text-white/30'} />
                </div>
              </div>

              <h3 className="text-[11px] md:text-xs font-black text-white mb-0.5 leading-tight">
                {language === "ar" ? flag.name : flag.enName}
              </h3>
              <p className="text-[9px] text-white/50 font-bold mb-2 leading-tight min-h-[1.2rem]">{flag.desc}</p>
              
              {flag.earned ? (
                <div className="bg-white/10 px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-white flex items-center gap-1 shadow-inner">
                  <Star size={8} className="text-amber-400" /> 
                  {language === "ar" ? "مكتسبة" : "Earned"}
                </div>
              ) : (
                <div className="bg-black/20 px-2 py-0.5 rounded-full border border-white/5 text-[9px] font-bold text-white/40">
                  <LockIcon size={8} /> 
                  {language === "ar" ? "مقفلة" : "Locked"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CalculatorIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>; }
function FlaskIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>; }
function BookIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>; }
function LockIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
''')

# 5. SovereigntyLeaderboards.tsx
with open(os.path.join(sovereignty_dir, "SovereigntyLeaderboards.tsx"), "w") as f:
    f.write('''import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, Star, Users, Flag } from 'lucide-react';

export function SovereigntyLeaderboards({ language }: any) {
  const [boardType, setBoardType] = useState<'league' | 'school' | 'class'>('league');

  const boards = [
    { id: 'league', label: language === "ar" ? "دوري المدارس" : "League" },
    { id: 'school', label: language === "ar" ? "المدرسة" : "School" },
    { id: 'class', label: language === "ar" ? "الصف" : "Class" }
  ];

  const mockData = {
    league: [
      { rank: 1, name: "إعدادية الكرار للمتفوقين", points: "15,420", flags: 12, isMe: false },
      { rank: 2, name: "مدرستي (مدرسة الموهوبين)", points: "14,890", flags: 10, isMe: true },
      { rank: 3, name: "ثانوية المتنبي", points: "12,100", flags: 8, isMe: false },
      { rank: 4, name: "إعدادية الحكمة", points: "9,500", flags: 5, isMe: false },
    ],
    school: [
      { rank: 1, name: "السادس العلمي (أ)", points: "5,200", flags: 4, isMe: false },
      { rank: 2, name: "السادس العلمي (ب)", points: "4,800", flags: 3, isMe: true },
      { rank: 3, name: "الخامس العلمي", points: "3,100", flags: 1, isMe: false },
    ],
    class: [
      { rank: 1, name: "علي محمد رضا", points: "1,450", flags: 2, isMe: false },
      { rank: 2, name: "أنت (بطل بيرق)", points: "1,240", flags: 1, isMe: true },
      { rank: 3, name: "حسين جاسم", points: "980", flags: 0, isMe: false },
    ]
  };

  const currentData = mockData[boardType];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 leading-tight">
            <Trophy className="text-amber-400" size={18} />
            {language === "ar" ? "لوحات الشرف والترتيب" : "Leaderboards & Honor"}
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {language === "ar" ? "نظام نقاط موزون وعادل" : "Weighted fair points system"}
          </p>
        </div>

        <div className="flex bg-[#050810] p-1 rounded-lg border border-white/10 w-full md:w-auto">
          {boards.map(b => (
            <button
              key={b.id}
              onClick={() => setBoardType(b.id as any)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                boardType === b.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#050810] border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 text-[10px] font-black text-white/40 uppercase">
          <div className="col-span-2 md:col-span-1 text-center">#</div>
          <div className="col-span-6 md:col-span-7">{language === "ar" ? "الاسم" : "Name"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "الرايات" : "Flags"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "النقاط" : "Points"}</div>
        </div>

        <div className="p-1.5 space-y-1.5">
          {currentData.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx}
              className={`grid grid-cols-12 gap-2 p-2.5 rounded-xl items-center border ${
                item.isMe 
                  ? 'bg-indigo-500/10 border-indigo-500/30 shadow-sm' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 transition-colors'
              }`}
            >
              <div className="col-span-2 md:col-span-1 flex justify-center">
                {item.rank === 1 ? <Crown size={18} className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" /> :
                 item.rank === 2 ? <Medal size={16} className="text-gray-300" /> :
                 item.rank === 3 ? <Medal size={16} className="text-amber-700" /> :
                 <span className="text-sm font-black text-white/30">{item.rank}</span>}
              </div>
              <div className="col-span-6 md:col-span-7 font-bold text-xs md:text-sm text-white flex items-center gap-1.5 line-clamp-1">
                {item.isMe && <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-indigo-500 animate-pulse" />}
                <span className="truncate">{item.name}</span>
              </div>
              <div className="col-span-2 flex justify-center items-center gap-1 text-emerald-400 font-bold text-xs">
                <span className="hidden md:inline">{item.flags}</span>
                <Flag size={12} />
              </div>
              <div className="col-span-2 flex justify-center items-center gap-1 text-amber-400 font-black text-xs">
                <span className="hidden md:inline">{item.points}</span>
                <Star size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
''')

# 6. SovereigntyHistory.tsx
with open(os.path.join(sovereignty_dir, "SovereigntyHistory.tsx"), "w") as f:
    f.write('''import React from 'react';
import { motion } from 'motion/react';
import { History, Crown, Star } from 'lucide-react';

export function SovereigntyHistory({ language }: any) {
  const history = [
    {
      year: "2025",
      season: language === "ar" ? "الفصل الأول" : "Term 1",
      champion: "إعدادية الكرار للمتفوقين",
      tournament: "كأس بيرق الذهبي",
      points: "120,500"
    },
    {
      year: "2024",
      season: language === "ar" ? "البطولة الصيفية" : "Summer Tourney",
      champion: "مدرسة الموهوبين",
      tournament: "دوري البرمجة",
      points: "85,200"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-white/10 rounded-xl">
          <History className="text-white/70" size={20} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-white leading-tight">
            {language === "ar" ? "سجل البطولات التاريخية" : "Hall of History"}
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {language === "ar" ? "الأبطال الذين خلدوا أسماءهم في منصة السيادة" : "Champions who immortalized their names"}
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-white/10 pl-5 ml-3 md:ml-6 space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
        {history.map((record, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            key={idx} 
            className="relative"
          >
            <div className={`absolute w-4 h-4 rounded-full border-2 border-[#0A0F1D] ${idx === 0 ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/30'} -left-[29px] top-1.5`} />
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4 shadow-md hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-amber-400 font-bold text-[10px] tracking-wider">{record.year} • {record.season}</span>
                  <h3 className="text-base font-black text-white mt-0.5">{record.tournament}</h3>
                </div>
                <Crown className={idx === 0 ? "text-amber-400" : "text-white/20"} size={20} />
              </div>
              
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/50 mb-0.5">{language === "ar" ? "البطل المتوج" : "Crowned Champion"}</p>
                  <p className="text-sm font-bold text-emerald-400">{record.champion}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/50 mb-0.5">{language === "ar" ? "النقاط" : "Points"}</p>
                  <p className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end">
                    {record.points} <Star size={12} />
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
''')

print("Denser sovereignty files generated successfully.")
