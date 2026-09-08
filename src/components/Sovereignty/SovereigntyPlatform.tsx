import React, { useState } from 'react';
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
