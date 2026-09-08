import os

sovereignty_dir = "src/components/Sovereignty"
os.makedirs(sovereignty_dir, exist_ok=True)

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
    { id: 'flags', label: language === "ar" ? "الرايات والشارات" : "Flags & Badges", icon: Flag, color: 'text-emerald-400' },
    { id: 'leaderboards', label: language === "ar" ? "لوحات الترتيب" : "Leaderboards", icon: Users, color: 'text-blue-400' },
    { id: 'history', label: language === "ar" ? "سجل البطولات" : "History", icon: History, color: 'text-gray-400' },
  ] as const;

  return (
    <div className="w-full h-full min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Mobile Header / Desktop Sidebar */}
      <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-2 bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/5"
          >
            <ArrowRight size={18} className={language === "ar" ? "" : "rotate-180"} />
            <span className="text-sm font-bold">{language === "ar" ? "العودة للرئيسية" : "Back to Home"}</span>
          </button>
        )}
        
        <div className="bg-[#0A0F1D] border border-amber-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 shrink-0">
              <Crown size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">
                {language === "ar" ? "منصة السيادة" : "Sovereignty"}
              </h1>
              <p className="text-xs text-amber-400/80 font-bold mt-1">
                {language === "ar" ? "دوري المدارس والمنافسات" : "Schools League & Battles"}
              </p>
            </div>
          </div>

          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all whitespace-nowrap shrink-0 lg:w-full text-right ${
                    isActive
                      ? 'bg-white/10 border border-white/10 shadow-lg scale-[1.02]'
                      : 'hover:bg-white/5 text-white/50 hover:text-white/80 border border-transparent'
                  }`}
                >
                  <Icon size={20} className={`${isActive ? tab.color : 'opacity-50'}`} />
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#0A0F1D] border border-white/10 rounded-[2rem] p-4 md:p-6 shadow-2xl overflow-hidden relative min-h-[500px]">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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
    <div className="space-y-6">
      {/* Berq Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-[#101935] to-indigo-900/40 border border-amber-500/30 rounded-[2rem] p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 blur-[40px] rounded-full pointer-events-none" />
        
        {/* Berq Mascot Avatar (Placeholder logic) */}
        <div className="w-24 h-24 shrink-0 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-2xl relative animate-pulse-slow">
          <div className="w-full h-full bg-[#0A0F1D] rounded-[1.4rem] flex items-center justify-center overflow-hidden relative">
             {/* Mascot image can go here, using an icon for now */}
             <Sparkles size={40} className="text-amber-400" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg border border-white/20 animate-bounce">
            {language === "ar" ? "جديد!" : "New!"}
          </div>
        </div>

        <div className="flex-1 text-center md:text-right z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-400">
              {language === "ar" ? "بيرق يعلن التحدي!" : "Berq Announces a Challenge!"}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
            {language === "ar" ? "كأس الرياضيات الكبرى 🏆" : "The Great Math Cup 🏆"}
          </h2>
          <p className="text-sm text-white/70 font-medium max-w-xl leading-relaxed">
            {language === "ar" 
              ? "انطلقت الآن بطولة المدارس في الرياضيات! هل تستطيع أن ترفع راية صفك ومدرستك نحو القمة؟ شارك الآن واكسب النقاط الموزونة لفريقك."
              : "The Inter-School Math Tournament has begun! Can you raise your class and school flag to the top?"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
             <button onClick={() => onNavigate('tournaments')} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2">
               <Swords size={18} />
               {language === "ar" ? "شارك في التحدي" : "Join Challenge"}
             </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={language === "ar" ? "نقاط السيادة" : "Sovereignty Points"} value="1,240" icon={Trophy} color="amber" />
        <StatCard title={language === "ar" ? "ترتيب المدرسة" : "School Rank"} value="#3" icon={Target} color="indigo" />
        <StatCard title={language === "ar" ? "الرايات المكتسبة" : "Earned Flags"} value="5" icon={Flag} color="emerald" />
        <StatCard title={language === "ar" ? "ترتيب الصف" : "Class Rank"} value="#1" icon={ShieldAlert} color="rose" />
      </div>
      
      {/* My Current Status */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Flag className="text-blue-400" size={20} />
          {language === "ar" ? "موقفي الحالي" : "My Current Status"}
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-center bg-[#050810] p-4 rounded-2xl border border-white/5">
           <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
             <Trophy size={32} className="text-blue-400" />
           </div>
           <div className="flex-1 text-center md:text-right">
             <h4 className="text-white font-bold">{userProfile?.fullName || (language === "ar" ? "بطل بيرق" : "Berq Hero")}</h4>
             <p className="text-sm text-white/50 mt-1">{language === "ar" ? "المستوى 12 • منافس نشط" : "Level 12 • Active Contender"}</p>
           </div>
           <div className="w-full md:w-1/3">
             <div className="flex justify-between text-xs mb-1">
               <span className="text-blue-400 font-bold">{language === "ar" ? "نحو المستوى التالي" : "To next level"}</span>
               <span className="text-white">85%</span>
             </div>
             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full w-[85%] shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
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
    <div className="bg-[#050810] border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center gap-2 relative overflow-hidden group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mb-1 transition-transform group-hover:scale-110 ${activeColor}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-3xl font-black text-white">{value}</h3>
      <p className="text-xs font-bold text-white/40">{title}</p>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">
            {isCompetitionsMode 
              ? (language === "ar" ? "منافساتي الداخلية" : "Internal Competitions")
              : (language === "ar" ? "البطولات ودوري المدارس" : "Tournaments & League")}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {language === "ar" ? "شارك، نافس، وارفع رايتك!" : "Join, compete, and raise your flag!"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const Icon = t.icon;
          return (
            <motion.div 
              key={t.id}
              whileHover={{ y: -4 }}
              className={`bg-gradient-to-br ${t.color} p-1 rounded-3xl overflow-hidden shadow-xl`}
            >
              <div className="bg-[#0A0F1D]/90 backdrop-blur-md w-full h-full rounded-[1.4rem] p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${t.accent}`}>
                    <Icon size={24} />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1">
                    {t.status === 'active' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {language === "ar" ? "جارية الآن" : "Live"}
                      </>
                    ) : (
                      <>
                        <Clock size={12} />
                        {language === "ar" ? "قريباً" : "Upcoming"}
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white mb-2">{t.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs font-medium text-white/70">
                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                      <Users size={14} /> {t.participants}
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                      <Clock size={14} /> {t.timeLeft}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-white/50">
                    {t.type === 'league' ? (language === "ar" ? "دوري المدارس" : "Schools League") : 
                     t.type === 'school' ? (language === "ar" ? "منافسة مدرسية" : "School Battle") :
                     (language === "ar" ? "تحدي صفي" : "Class Challenge")}
                  </span>
                  <button className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10">
                    <Play size={18} className={language === "ar" ? "rotate-180" : ""} />
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
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-lg mx-auto mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-4 border border-white/20">
          <Flag size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">
          {language === "ar" ? "نظام الرايات والشارات" : "Flags & Badges System"}
        </h2>
        <p className="text-sm text-white/60 font-medium">
          {language === "ar" 
            ? "الراية هي رمز السيادة والإنجاز في بوابة بيرق. احصل عليها عبر الفوز بالمنافسات والتحديات." 
            : "Flags represent your sovereignty and achievements in Gate 6. Earn them by winning battles."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {flags.map((flag, idx) => {
          const Icon = flag.icon;
          return (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative overflow-hidden rounded-[2rem] p-5 border ${flag.earned ? flag.border + " " + flag.bg.replace('/20', '/10') : 'border-white/5 bg-white/5 grayscale opacity-60'} flex flex-col items-center text-center`}
            >
              {flag.earned && <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />}
              
              {/* Flag Pole Graphic */}
              <div className="relative mb-4 mt-2">
                <div className="w-1 h-16 bg-white/20 absolute -left-2 bottom-0 rounded-full" />
                <div className={`w-14 h-12 rounded-lg flex items-center justify-center shadow-lg relative z-10 ${flag.earned ? flag.bg.replace('/20', '') : 'bg-white/10'}`}>
                  <Icon size={24} className={flag.earned ? 'text-white' : 'text-white/30'} />
                </div>
              </div>

              <h3 className="text-sm font-black text-white mb-1">
                {language === "ar" ? flag.name : flag.enName}
              </h3>
              <p className="text-[10px] text-white/50 font-bold mb-3">{flag.desc}</p>
              
              {flag.earned ? (
                <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
                  <Star size={10} className="text-amber-400" /> 
                  {language === "ar" ? "مكتسبة" : "Earned"}
                </div>
              ) : (
                <div className="bg-black/20 px-3 py-1 rounded-full border border-white/5 text-[10px] font-bold text-white/30">
                  <LockIcon size={10} /> 
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
import { Trophy, Medal, Crown, Star, Users } from 'lucide-react';

export function SovereigntyLeaderboards({ language }: any) {
  const [boardType, setBoardType] = useState<'league' | 'school' | 'class'>('league');

  const boards = [
    { id: 'league', label: language === "ar" ? "دوري المدارس" : "League" },
    { id: 'school', label: language === "ar" ? "ترتيب المدرسة" : "School Rank" },
    { id: 'class', label: language === "ar" ? "ترتيب الصف" : "Class Rank" }
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="text-amber-400" />
            {language === "ar" ? "لوحات الشرف والترتيب" : "Leaderboards & Honor"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {language === "ar" ? "نظام نقاط موزون وعادل يحسب الإنجازات" : "Weighted fair points system"}
          </p>
        </div>

        <div className="flex bg-[#050810] p-1 rounded-xl border border-white/10 w-full md:w-auto">
          {boards.map(b => (
            <button
              key={b.id}
              onClick={() => setBoardType(b.id as any)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                boardType === b.id 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#050810] border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-black text-white/40 uppercase">
          <div className="col-span-2 md:col-span-1 text-center">#</div>
          <div className="col-span-6 md:col-span-7">{language === "ar" ? "الاسم / الكيان" : "Name / Entity"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "الرايات" : "Flags"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "النقاط" : "Points"}</div>
        </div>

        <div className="p-2 space-y-2">
          {currentData.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx}
              className={`grid grid-cols-12 gap-4 p-4 rounded-2xl items-center border ${
                item.isMe 
                  ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 transition-colors'
              }`}
            >
              <div className="col-span-2 md:col-span-1 flex justify-center">
                {item.rank === 1 ? <Crown size={24} className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" /> :
                 item.rank === 2 ? <Medal size={22} className="text-gray-300" /> :
                 item.rank === 3 ? <Medal size={22} className="text-amber-700" /> :
                 <span className="text-lg font-black text-white/30">{item.rank}</span>}
              </div>
              <div className="col-span-6 md:col-span-7 font-bold text-sm md:text-base text-white flex items-center gap-2">
                {item.isMe && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                {item.name}
              </div>
              <div className="col-span-2 flex justify-center items-center gap-1 text-emerald-400 font-bold text-sm">
                <span className="hidden md:inline">{item.flags}</span>
                <Flag size={14} />
              </div>
              <div className="col-span-2 flex justify-center items-center gap-1 text-amber-400 font-black text-sm">
                <span className="hidden md:inline">{item.points}</span>
                <Star size={14} />
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
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white/10 rounded-2xl">
          <History className="text-white/70" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            {language === "ar" ? "سجل البطولات التاريخية" : "Hall of History"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {language === "ar" ? "الأبطال الذين خلدوا أسماءهم في منصة السيادة" : "Champions who immortalized their names"}
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-white/10 pl-6 ml-4 md:ml-8 space-y-10" dir={language === "ar" ? "rtl" : "ltr"}>
        {history.map((record, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.2 }}
            key={idx} 
            className="relative"
          >
            <div className={`absolute w-6 h-6 rounded-full border-4 border-[#0A0F1D] ${idx === 0 ? 'bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/30'} -left-[37px] top-1`} />
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-xl hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-amber-400 font-bold text-sm tracking-wider">{record.year} • {record.season}</span>
                  <h3 className="text-xl font-black text-white mt-1">{record.tournament}</h3>
                </div>
                <Crown className={idx === 0 ? "text-amber-400" : "text-white/20"} size={28} />
              </div>
              
              <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50 mb-1">{language === "ar" ? "البطل المتوج" : "Crowned Champion"}</p>
                  <p className="text-lg font-bold text-emerald-400">{record.champion}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50 mb-1">{language === "ar" ? "مجموع النقاط" : "Total Points"}</p>
                  <p className="text-lg font-black text-amber-400 flex items-center gap-1 justify-end">
                    {record.points} <Star size={14} />
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

print("Sovereignty files generated successfully.")
