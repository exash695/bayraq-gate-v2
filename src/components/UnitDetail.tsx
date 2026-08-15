import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft,
  Map as MapIcon, 
  Trophy, 
  Crown, 
  ScrollText,
  ChevronRight,
  ChevronLeft,
  Zap,
  Lock as LockIcon,
  StickyNote as StickyNoteIcon,
  Star,
  Award,
  Target,
  BookOpen,
  PenLine,
  Radio,
  Settings as SettingsIcon,
  Lightbulb,
  Search,
  Crosshair,
  Hourglass,
  Gem,
  Volume2,
  VolumeX,
  RefreshCcw,
} from 'lucide-react';
import { UnitId, UnitSubSection, PageContent, UserProgress, Badge, AppSettings } from '../types';
import { INITIAL_PAGES } from '../data';
import { StickyNote } from './StickyNote';
import { ChallengeModal } from './ChallengeModal';
import { ControlRoom } from './ControlRoom';
import { CrossingStation } from './CrossingStation';
import { BADGES } from '../constants/badges';
import { translations } from '../lib/translations';
import { SixtySecondChallenge } from './SixtySecondChallenge';

const ICON_MAP: { [key: string]: any } = {
  Trophy,
  Star,
  Award,
  Zap,
  Target,
  BookOpen,
  PenLine,
  Crosshair,
  Hourglass,
  Gem,
  Lock: LockIcon,
  ScrollText
};

interface UnitDetailProps {
  unitId: UnitId;
  onBack: () => void;
  themeColor: string;
  progress: UserProgress;
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onResetProgress: () => void;
  onClearNotes: () => void;
  onResetSettings: () => void;
}

export const UnitDetail: React.FC<UnitDetailProps> = ({ 
  unitId, 
  onBack, 
  themeColor,
  progress,
  setProgress,
  settings,
  setSettings,
  onResetProgress,
  onClearNotes,
  onResetSettings
}) => {
  const t = translations[settings.language];
  const [activeSubSection, setActiveSubSection] = useState<UnitSubSection | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showStickyNote, setShowStickyNote] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [highlightedItemIdx, setHighlightedItemIdx] = useState<number | null>(null);
  const [vaultPageIndex, setVaultPageIndex] = useState(0);
  const [pendingScrollItemIdx, setPendingScrollItemIdx] = useState<number | null>(null);
  const [navErrorMessage, setNavErrorMessage] = useState<string | null>(null);
  const [studyStartTime] = useState(Date.now());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [radarAnswers, setRadarAnswers] = useState<Record<string, number>>({});
  const [showSixtyChallenge, setShowSixtyChallenge] = useState(false);

  const speak = (text: string) => {
    if (!settings.voiceEnabled || isSpeaking) return;
    
    // Detect if text contains Arabic characters
    const isArabic = /[\u0600-\u06FF]/.test(text);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isArabic ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const playRewardSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play blocked:', e));
  };

  const awardBadge = (badgeId: string) => {
    if (!progress.badges[badgeId]) {
      setProgress(prev => ({
        ...prev,
        badges: {
          ...prev.badges,
          [badgeId]: new Date().toISOString()
        }
      }));
      playRewardSound();
    }
  };

  // Check for persistent badge
  React.useEffect(() => {
    const timer = setInterval(() => {
      const elapsedMinutes = (Date.now() - studyStartTime) / (1000 * 60);
      if (elapsedMinutes >= 30 && activeSubSection === 'comprehensive') {
        awardBadge(`unit-${unitId}-persistent`);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [studyStartTime, activeSubSection, unitId]);

  // Check for diamond badge
  React.useEffect(() => {
    const unitBadgeIds = [
      `unit-${unitId}-sniper`,
      `unit-${unitId}-dictionary`,
      `unit-${unitId}-memory`,
      `unit-${unitId}-persistent`
    ];
    const hasAll = unitBadgeIds.every(id => progress.badges[id]);
    if (hasAll && !progress.badges[`unit-${unitId}-diamond`]) {
      awardBadge(`unit-${unitId}-diamond`);
    }
  }, [progress.badges, unitId]);

  // Synchronized robust scroll tracking for UnitDetail level scrolling
  React.useEffect(() => {
    if (activeSubSection === 'comprehensive' && pendingScrollItemIdx !== null) {
      console.log(`[UnitDetail Pending Scroll] pageIndex: ${currentPageIndex}, expected itemIdx: ${pendingScrollItemIdx}`);
      
      let retries = 0;
      const tryScroll = () => {
        const id = `item-${pendingScrollItemIdx}`;
        const el = document.getElementById(id);
        
        console.log(`[UnitDetail Scroll Retry ${retries}] Searching for #${id}:`, el ? "FOUND" : "NOT FOUND");
        
        if (el) {
          console.log("[UnitDetail Scroll Action] Found item! Scrolling and highlighting.");
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedItemIdx(pendingScrollItemIdx);
          
          setTimeout(() => {
            setHighlightedItemIdx(null);
          }, 3000);
          
          setPendingScrollItemIdx(null);
        } else if (retries < 25) {
          retries++;
          setTimeout(tryScroll, 100);
        } else {
          console.error("[UnitDetail Scroll Action] Target item element never rendered!");
          setNavErrorMessage(settings.language === 'ar' ? "تعذر العثور على السؤال في الصفحة." : "Could not locate question on target page.");
          setPendingScrollItemIdx(null);
          setTimeout(() => setNavErrorMessage(null), 3000);
        }
      };
      
      tryScroll();
    }
  }, [currentPageIndex, activeSubSection, pendingScrollItemIdx, settings.language]);

  const unitPages = INITIAL_PAGES.filter(p => 
    p.unit.includes(`Unit ${unitId}`) || 
    p.unit.includes(`الوحدة ${unitId === 1 ? 'الاولى' : unitId === 2 ? 'الثانية' : unitId}`) ||
    (unitId === 1 && p.unit === "الصف السادس الإعدادي") ||
    (unitId === 9 && (p.unit.includes("Literature") || p.unit.includes("الأدب")))
  );

  const ministerialItems = unitPages.flatMap((page, pageIdx) => 
    page.items
      .map((item, itemIdx) => ({ ...item, pageIdx, itemIdx, pageTitle: page.title, pageId: page.id }))
      .filter(item => item.type === 'text' && /\(\d{4}/.test(item.content))
  );

  const currentPage = unitPages[currentPageIndex];

  const language = settings.language;
  const subSections: { id: UnitSubSection; title: string; icon: any; description: string; color: string; locked?: boolean }[] = [
    { id: 'comprehensive', title: t.comprehensive, icon: ScrollText, description: language === 'ar' ? 'المحتوى الحرفي للملزمة' : 'Literal Content', color: 'theme-primary' },
    { id: 'achievement-map', title: t.achievementMap, icon: MapIcon, description: language === 'ar' ? 'خارطة الطريق والإنجاز' : 'Roadmap & Achievement', color: 'theme-emerald' },
    { id: 'crossing-station', title: t.crossingStation, icon: Crosshair, description: language === 'ar' ? 'اختبار العبور' : 'Crossing Test', color: 'theme-purple' },
    { id: 'ministerial-vault', title: t.ministerialVault, icon: Trophy, description: language === 'ar' ? 'كنز الأسئلة الوزارية' : 'Ministerial Questions Treasure', color: 'theme-gold' },
  ];

  const renderSubSection = () => {
    switch (activeSubSection) {
      case 'comprehensive':
        return (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2 mb-4 pt-4 px-4 w-full">
              <h3 className="text-3xl font-black text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">{t.comprehensive}</h3>
              <p className="text-white/60">{t.comprehensiveDesc}</p>
            </div>
            <div className="flex items-center justify-between w-full bg-[#050505]/80 backdrop-blur-md border-y border-[#D4AF37]/30 p-4 sticky top-[65px] z-20 shadow-xl">
              <button 
                onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                disabled={currentPageIndex === 0}
                className="px-4 py-2 bg-transparent border border-[#00E5FF]/50 text-[#00E5FF] rounded-xl hover:bg-[#00E5FF]/10 transition-all flex items-center gap-2 disabled:opacity-30 shadow-[0_0_10px_rgba(0,229,255,0.1)]"
              >
                {settings.language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                <span className="hidden sm:inline">{t.previous}</span>
              </button>
              
              <div className="text-center">
                <span className="text-white/40 text-xs block">{t.page}</span>
                <span className="text-xl font-bold text-[#D4AF37] drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">{currentPageIndex + 1} / {unitPages.length}</span>
              </div>

              <button 
                onClick={() => setCurrentPageIndex(prev => Math.min(unitPages.length - 1, prev + 1))}
                disabled={currentPageIndex === unitPages.length - 1}
                className="px-4 py-2 bg-transparent border border-[#00E5FF]/50 text-[#00E5FF] rounded-xl hover:bg-[#00E5FF]/10 transition-all flex items-center gap-2 disabled:opacity-30 shadow-[0_0_10px_rgba(0,229,255,0.1)]"
              >
                <span className="hidden sm:inline">{t.next}</span>
                {settings.language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>

            {currentPage && (
              <div className="relative w-full pb-8">
                <div className="mx-2 sm:mx-4 flex items-center justify-between bg-[#12121a] rounded-2xl border border-white/5 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] mb-4 mt-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] flex-1 leading-tight">{currentPage.title}</h2>
                  <button
                    onClick={() => {
                      const isMastered = progress.masteredPages.includes(currentPage.id);
                      setProgress(prev => ({
                        ...prev,
                        masteredPages: isMastered 
                          ? prev.masteredPages.filter(id => id !== currentPage.id)
                          : [...prev.masteredPages, currentPage.id]
                      }));
                    }}
                    className={`p-2 shrink-0 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-sm shadow-md ${
                      progress.masteredPages.includes(currentPage.id)
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <Trophy size={20} className={progress.masteredPages.includes(currentPage.id) ? 'animate-bounce' : ''} />
                  </button>
                </div>

                <div className="w-full space-y-4 bg-transparent">
                  {currentPage.items.map((item, idx) => (
                    <div 
                      key={`${currentPage.id}-item-${idx}`} 
                      id={`item-${idx}`}
                      className={`mx-2 sm:mx-4 p-4 sm:p-5 rounded-2xl border border-white/5 transition-all duration-500 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] ${
                        highlightedItemIdx === idx 
                          ? 'ring-2 ring-inset ring-[#00E5FF] bg-[#00E5FF]/20 z-10' 
                          : ''
                      } ${
                        item.type === 'rule' ? 'bg-[#00E5FF]/10' :
                        item.type === 'text' && ('variant' in item && item.variant === 'warning') ? 'bg-orange-500/10' :
                        'bg-[#12121a] backdrop-blur-sm'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                      
                      {item.type === 'text' && (
                        <div className="flex items-start justify-between gap-4 relative z-10">
                          <p className="leading-relaxed flex-1 text-white/90 font-bold" style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.8' }}>{item.content}</p>
                          <button 
                            onClick={() => speak(item.content)}
                            className="p-3 bg-white/5 hover:bg-[#00E5FF]/20 rounded-2xl transition-all text-[#00E5FF] border border-white/10 shadow-md shrink-0"
                            title="استمع"
                          >
                            <Volume2 size={24} />
                          </button>
                        </div>
                      )}
                      
                      {item.type === 'rule' && (
                        <div className="flex items-start justify-between gap-4 relative z-10 text-right">
                          <div className="flex flex-col gap-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                              <Zap size={20} />
                            </div>
                            <div>
                              <h4 className="font-black text-[#00E5FF] mb-2" style={{ fontSize: `${settings.fontSize + 2}px` }}>{item.title}</h4>
                              <p className="text-white/80 leading-relaxed" style={{ fontSize: `${settings.fontSize}px` }}>{item.description}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => speak(`${item.title}. ${item.description}`)}
                            className="p-3 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 rounded-2xl transition-all text-[#00E5FF] border border-[#00E5FF]/30 shrink-0 shadow-md"
                            title="استمع"
                          >
                            <Volume2 size={24} />
                          </button>
                        </div>
                      )}
                      
                      {item.type === 'table' && (
                        <div className="overflow-x-auto relative z-10 pb-2">
                          <table className="w-full text-right border-collapse min-w-[300px]">
                            <thead>
                              <tr className="bg-white/5">
                                {Object.keys(item.rows[0]).map((k, kidx) => (
                                  <th key={`${k}_${kidx}`} className="py-3 px-4 text-[#D4AF37] font-black text-xs uppercase tracking-tight">{k}</th>
                                ))}
                                <th className="py-3 px-4 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {item.rows.map((row, ridx) => (
                                <tr key={`${currentPage.id}-item-${idx}-tr-${ridx}`} className="hover:bg-white/5 transition-colors">
                                  {Object.values(row).map((v, vidx) => (
                                    <td key={`${currentPage.id}-item-${idx}-tr-${ridx}-td-${vidx}`} className="py-3 px-4 text-white/80 font-bold" style={{ fontSize: `${settings.fontSize}px` }}>{v as string}</td>
                                  ))}
                                  <td className="py-3 px-4">
                                    <button 
                                      onClick={() => speak(Object.values(row).join(' '))}
                                      className="p-2 text-[#00E5FF]/60 hover:text-[#00E5FF] transition-colors"
                                    >
                                      <Volume2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mx-2 sm:mx-4 mt-6">
                  <button 
                    onClick={() => setShowSixtyChallenge(true)}
                    className="w-full relative overflow-hidden group py-6 rounded-2xl bg-gradient-to-r from-[#00E5FF]/80 to-[#00E5FF]/40 border border-[#00E5FF] shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-[0_0_50px_rgba(0,229,255,0.5)] transition-all text-white font-black text-xl flex items-center justify-center gap-4"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                    <Zap className="w-6 h-6 animate-bounce text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    <span className="relative z-10 tracking-tighter drop-shadow-md">{t.startChallenge}</span>
                    <ChevronLeft className={`w-6 h-6 relative z-10 transition-transform duration-500 ${settings.language === 'en' ? 'rotate-180 group-hover:translate-x-2' : 'group-hover:-translate-x-2'}`} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'achievement-map':
        return (
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {unitPages.map((page, idx) => (
              <div 
                key={`${page.id || 'page'}_${idx}_achmap`}
                onClick={() => {
                  setCurrentPageIndex(idx);
                  setActiveSubSection('comprehensive');
                }}
                className="bg-[#0c0c14]/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] p-5 hover:border-[#00E5FF]/80 transition-all duration-300 cursor-pointer flex items-center justify-between group shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${progress.masteredPages.includes(page.id) ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-[#00E5FF]/20 border-[#00E5FF]/40 text-[#00E5FF]'} shadow-[0_0_10px_rgba(0,229,255,0.2)]`}>
                    {progress.masteredPages.includes(page.id) ? '✓' : idx + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00E5FF] transition-colors">{page.title}</h3>
                </div>
                {progress.masteredPages.includes(page.id) && (
                  <div className="text-green-500">
                    <Award className="w-6 h-6" />
                  </div>
                )}
                {settings.language === 'ar' ? <ChevronLeft className="w-5 h-5 text-white/20 group-hover:text-[#00E5FF] transition-colors" /> : <ChevronLeft className="w-5 h-5 text-white/20 group-hover:text-[#00E5FF] transition-colors rotate-180" />}
              </div>
            ))}
          </div>
        );
      case 'ministerial-vault':
        const currentVaultItem = ministerialItems[vaultPageIndex];

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">{t.ministerialVault}</h3>
              <p className="text-white/60 italic">{settings.language === 'ar' ? `تم جمع ${ministerialItems.length} سؤالاً وزارياً من المسار الشامل` : `Collected ${ministerialItems.length} ministerial questions from the comprehensive path`}</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <AnimatePresence mode="wait">
                {currentVaultItem && (
                  <motion.div 
                    key={`vault_${vaultPageIndex}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-[#0c0c14]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 space-y-6 shadow-2xl min-h-[300px] flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-[#D4AF37] uppercase tracking-widest px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                          {settings.language === 'ar' ? `سؤال وزارى ${vaultPageIndex + 1} / ${ministerialItems.length}` : `Ministerial Question ${vaultPageIndex + 1} / ${ministerialItems.length}`}
                        </span>
                        <span className="text-xs text-white/40 font-bold">{currentVaultItem.pageTitle}</span>
                      </div>
                      
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="relative flex-1">
                          <Zap className="absolute -right-2 -top-2 w-8 h-8 text-[#00E5FF]/20 animate-pulse" />
                          <p className="font-bold leading-relaxed text-white pr-4 whitespace-normal break-words" style={{ fontSize: `${settings.fontSize + 4}px`, lineHeight: '1.6' }}>
                            {currentVaultItem.type === 'text' ? currentVaultItem.content : ''}
                          </p>
                        </div>
                        <button 
                          onClick={() => speak(currentVaultItem.type === 'text' ? currentVaultItem.content : '')}
                          className="p-3 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 rounded-xl transition-all text-[#00E5FF] border border-[#00E5FF]/30 shrink-0 shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                          title="استمع"
                        >
                          <Volume2 size={24} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setVaultPageIndex(prev => Math.max(0, prev - 1))}
                          disabled={vaultPageIndex === 0}
                          className="flex-1 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-[#D4AF37]/50 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                        >
                          <ChevronRight className="w-5 h-5" />
                          السابق
                        </button>
                        <button 
                          onClick={() => {
                            if (vaultPageIndex === ministerialItems.length - 1) {
                              awardBadge(`unit-${unitId}-ministerial-master`);
                            }
                            setVaultPageIndex(prev => Math.min(ministerialItems.length - 1, prev + 1));
                          }}
                          disabled={vaultPageIndex === ministerialItems.length - 1}
                          className="flex-1 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 hover:border-[#D4AF37]/50 disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                        >
                          التالي
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>

                      {navErrorMessage && (
                        <div className="w-full mb-4 p-4 text-center text-sm font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-[1rem] animate-[pulse_1.5s_infinite]" dir="rtl">
                          ⚠️ {navErrorMessage}
                        </div>
                      )}

                      <button 
                        onClick={() => {
                          const pageNumVal = currentVaultItem.pageIdx + 1;
                          const qIdVal = (currentVaultItem as any).id || `q-unit-${unitId}-${currentVaultItem.pageIdx}-${currentVaultItem.itemIdx}`;
                          const lessonIdVal = currentVaultItem.pageId || "N/A";
                          const unitIdVal = unitId;
                          const chapterIdVal = "N/A";

                          // 1. Log all requested parameters in the Console
                          console.log("=== BEGIN UNIT DETAIL NAVIGATION TRACE ===");
                          console.log(`pageNumber: ${pageNumVal}`);
                          console.log(`questionId: ${qIdVal}`);
                          console.log(`lessonId: ${lessonIdVal}`);
                          console.log(`unitId: ${unitIdVal}`);
                          console.log(`chapterId: ${chapterIdVal}`);
                          console.log("==========================================");

                          // 2. Perform safe lookup to see if the item exists on the target page
                          const targetPage = unitPages[currentVaultItem.pageIdx];
                          const hasItem = targetPage && targetPage.items && targetPage.items[currentVaultItem.itemIdx];
                          
                          if (!hasItem) {
                            console.error(`[Navigation Error] Could not find any item on target page representing index: ${currentVaultItem.itemIdx}`);
                            setNavErrorMessage(settings.language === 'ar' ? "تعذر العثور على السؤال الوزاري المطلوب." : "The requested ministerial question could not be found.");
                            setTimeout(() => setNavErrorMessage(null), 4000);
                            return;
                          }

                          // 3. Clear any existing error messages
                          setNavErrorMessage(null);

                          // 4. Navigate and defer search so the target page can fully mount
                          setCurrentPageIndex(currentVaultItem.pageIdx);
                          setActiveSubSection('comprehensive');
                          setPendingScrollItemIdx(currentVaultItem.itemIdx);
                        }}
                        className="w-full py-5 rounded-[1.5rem] bg-transparent border-2 border-amber-400 text-amber-400 font-black text-xl hover:bg-amber-400/10 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)]"
                      >
                        <Search className="w-6 h-6 animate-pulse" />
                        <span>انتقل إلى الصفحة</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {ministerialItems.length === 0 && (
                <div className="text-center py-20 bg-[#050505]/60 backdrop-blur-sm rounded-[2rem] border border-white/10 opacity-50">
                  <Crown className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/60">لا توجد أسئلة وزارية محددة في هذه الوحدة حالياً</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'radar-intelligence':
        const radarQuestions = unitPages.flatMap(p => 
          (p.questions || []).map(q => ({ ...q, pageId: p.id }))
        ).filter(q => q.difficulty === 'hard' || q.id > 100);
        
        const handleRadarAnswer = (pageId: number, qId: number, optionIdx: number) => {
          const key = `${pageId}-${qId}`;
          if (radarAnswers[key] !== undefined) return;
          setRadarAnswers(prev => ({ ...prev, [key]: optionIdx }));
          
          // Play sound on answer
          const isCorrect = radarQuestions.find(q => q.id === qId && q.pageId === pageId)?.correctAnswer === optionIdx;
          if (isCorrect) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {});
          }
        };

        const radarScore = radarQuestions.reduce((acc, q) => {
          const key = `${q.pageId}-${q.id}`;
          return acc + (radarAnswers[key] === q.correctAnswer ? 1 : 0);
        }, 0);

        const isRadarFinished = radarQuestions.length > 0 && Object.keys(radarAnswers).length === radarQuestions.length;

        const resetRadar = () => {
          setRadarAnswers({});
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">رادار الذكاء</h3>
              <p className="text-white/60">أسئلة استنتاجية تتطلب تركيزاً عالياً</p>
            </div>

            <AnimatePresence>
              {isRadarFinished && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-[#050505]/60 backdrop-blur-sm p-8 border border-[#00E5FF]/50 rounded-[2rem] text-center space-y-6 relative overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.15)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.2)_0%,transparent_70%)] opacity-30" />
                  <Trophy className="w-20 h-20 text-[#00E5FF] mx-auto animate-bounce drop-shadow-[0_0_15px_rgba(0,229,255,0.8)]" />
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-3xl font-black text-white">
                      {radarScore === radarQuestions.length 
                        ? (settings.language === 'ar' ? 'إنجاز أسطوري! 🔥' : 'Legendary Achievement! 🔥')
                        : radarScore >= radarQuestions.length / 2
                          ? (settings.language === 'ar' ? 'عمل رائع! ✨' : 'Great Work! ✨')
                          : (settings.language === 'ar' ? 'محاولة جيدة! 💪' : 'Good Attempt! 💪')
                      }
                    </h4>
                    <p className="text-xl text-white/70">
                      {settings.language === 'ar' 
                        ? `لقد أجبت على ${radarScore} من أصل ${radarQuestions.length} أسئلة بشكل صحيح`
                        : `You answered ${radarScore} out of ${radarQuestions.length} questions correctly`
                      }
                    </p>
                  </div>
                  <button 
                    onClick={resetRadar}
                    className="px-12 py-4 bg-transparent border-2 border-[#00E5FF] text-[#00E5FF] font-black text-xl rounded-[1.5rem] hover:bg-[#00E5FF]/10 transition-all flex items-center gap-3 mx-auto group shadow-[inset_0_0_15px_rgba(0,229,255,0.15)]"
                  >
                    <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    {settings.language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {radarQuestions.length > 0 ? (
              <div className="grid gap-6">
                {radarQuestions.map((q, idx) => {
                  const key = `${q.pageId}-${q.id}`;
                  const selectedIdx = radarAnswers[key];
                  const isAnswered = selectedIdx !== undefined;
                  
                  return (
                    <div key={`${key}_${idx}_radar`} className="bg-[#0c0c14]/60 backdrop-blur-xl border-y md:border border-white/10 rounded-none md:rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="p-3 rounded-[1.5rem] bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                          <Radio className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="font-bold text-[#00E5FF]">سؤال ذكاء #{idx + 1}</span>
                      </div>
                      <p className="mb-8 leading-relaxed text-white font-bold" style={{ fontSize: `${settings.fontSize + 2}px`, lineHeight: '1.8' }}>{q.text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                        {q.options.map((opt, i) => {
                          let buttonStyle = "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-[#00E5FF]/50";
                          
                          if (isAnswered) {
                            if (i === q.correctAnswer) {
                              buttonStyle = "bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]";
                            } else if (i === selectedIdx) {
                              buttonStyle = "bg-rose-500/20 border-rose-500 text-rose-400";
                            } else {
                              buttonStyle = "bg-white/5 border-white/5 text-white/20 opacity-50";
                            }
                          }

                          return (
                            <button 
                              key={`${opt}_${i}_radopt`} 
                              disabled={isAnswered}
                              onClick={() => handleRadarAnswer(q.pageId, q.id, i)}
                              className={`p-6 rounded-[2rem] border-2 transition-all text-right group relative overflow-hidden flex items-center justify-between ${buttonStyle}`}
                            >
                              <span className="relative z-10" style={{ fontSize: `${settings.fontSize}px` }}>{opt}</span>
                              {isAnswered && i === q.correctAnswer && <Trophy className="w-5 h-5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                      
                      {isAnswered && q.explanation && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-8 p-6 rounded-[2rem] bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex gap-4 shadow-[inset_0_0_20px_rgba(0,229,255,0.1)] relative z-10"
                        >
                          <Lightbulb className="w-6 h-6 text-[#00E5FF] shrink-0" />
                          <p className="text-white/80 leading-relaxed font-bold" style={{ fontSize: `${settings.fontSize - 2}px`, lineHeight: '1.8' }}>{q.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-white/20 bg-[#050505]/60 backdrop-blur-sm rounded-[2rem] border border-white/10">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="">لا توجد أسئلة رادار في هذه الوحدة حالياً</p>
              </div>
            )}
          </div>
        );
      case 'idea-bank':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">بنك الأفكار</h3>
              <p className="text-white/60">مساحة لتدوين ملاحظاتك الذكية حول الوحدة</p>
            </div>
            
            <div className="bg-[#0c0c14]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
              <div className="w-20 h-20 rounded-full bg-[#00E5FF]/20 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(0,229,255,0.2)] relative z-10">
                <Lightbulb className="w-10 h-10 text-[#00E5FF] drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
              </div>
              <p className="text-white/60 relative z-10">يمكنك إضافة ملاحظاتك من خلال أيقونة المصباح داخل صفحات المسار الشامل.</p>
              <div className="grid gap-4 text-right relative z-10">
                {Object.entries(progress.stickyNotes).map(([pageId, note]) => {
                  const page = INITIAL_PAGES.find(p => p.id === parseInt(pageId));
                  if (!page || !page.unit.includes(`Unit ${unitId}`)) return null;
                  return (
                    <div key={`${pageId}_sticky`} className="p-4 rounded-[1.5rem] bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 transition-colors shadow-sm">
                      <div className="text-[#D4AF37] mb-2 font-bold whitespace-normal break-words" style={{ fontSize: `${settings.fontSize - 2}px` }}>{page.title}</div>
                      <p className="text-white/90 leading-relaxed whitespace-normal break-words" style={{ fontSize: `${settings.fontSize}px`, lineHeight: '1.6' }}>{note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'control-room':
        return (
          <ControlRoom 
            settings={settings} 
            setSettings={setSettings} 
            progress={progress}
            onResetProgress={onResetProgress}
            onClearNotes={onClearNotes}
            onResetSettings={onResetSettings}
          />
        );
      case 'locked-station':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 animate-in fade-in zoom-in duration-500 bg-[#050505]/60 backdrop-blur-sm rounded-[2rem] border border-white/10">
            <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center mb-6">
              <LockIcon className="w-12 h-12 opacity-20" />
            </div>
            <h3 className="text-2xl font-bold mb-2">المحطة الثانية</h3>
            <p className="text-center max-w-xs text-white/60">هذه المحطة مقفلة حالياً. أكمل العرض التفاعلي للمادّة لفتحها في التحديث القادم.</p>
          </div>
        );
      case 'crossing-station':
        return (
          <CrossingStation
            unitId={unitId}
            unitPages={unitPages}
            progress={progress}
            setProgress={setProgress}
            settings={settings}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 bg-[#050505]/60 backdrop-blur-sm rounded-[2rem] border border-white/10">
            <LockIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl">هذا القسم سيتم تفعيله قريباً</p>
          </div>
        );
    }
  };

  return (
    <div 
      id={`unit-content-${unitId}`}
      className={`min-h-screen pb-20 w-full overflow-x-hidden border border-transparent`}
    >
      {/* Cinematic Header */}
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-[#050505]/60 border-b border-[#D4AF37]/30 px-4 sm:px-8 lg:px-12 py-4 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
        <div className="w-full mx-auto flex items-center justify-between relative z-10 gap-2 sm:gap-4">
          <motion.button 
            whileHover={{ scale: 1.1, x: settings.language === 'ar' ? 5 : -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-2 sm:p-3 hover:bg-[#D4AF37]/10 rounded-xl sm:rounded-[1.5rem] transition-all border border-[#D4AF37]/20 text-[#D4AF37] flex-shrink-0"
          >
            {settings.language === 'ar' ? <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
          </motion.button>
          
          <div className="flex flex-col items-center flex-1 min-w-0">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <h1 className="text-lg sm:text-2xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] truncate">
                {unitId === 9 ? t.literature : `${t.unit} ${unitId}`}
              </h1>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_10px_rgba(0,229,255,0.8)] flex-shrink-0" />
            </motion.div>
            <p className="text-[8px] sm:text-[10px] font-mono text-[#D4AF37]/60 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 truncate w-full text-center">
              {activeSubSection ? subSections.find(s => s.id === activeSubSection)?.title : (settings.language === 'ar' ? 'اختيار المهمة' : 'Mission Selection')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              onClick={() => setShowRadar(true)} 
              className="p-2 sm:p-3 hover:bg-[#00E5FF]/10 rounded-xl sm:rounded-[1.5rem] transition-all text-[#00E5FF] border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
            >
              <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(Object.keys(progress.completedPages).length / INITIAL_PAGES.length) * 100}%` }}
            className="h-full bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.8)]"
          />
        </div>
      </header>

      <AnimatePresence>
        {showRadar && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#050505]/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#050505]/80 backdrop-blur-sm p-6 sm:p-8 w-full max-w-sm text-center space-y-6 border border-[#D4AF37]/30 rounded-[2rem] shadow-[0_0_30px_rgba(0,229,255,0.15)] mx-4"
            >
              <h3 className="text-xl sm:text-2xl font-bold text-white">إحصائيات الرادار الوزاري</h3>
              <p className="text-white/60 text-sm sm:text-base">هذه الوحدة تحتوي على {ministerialItems.length} سؤالاً وزارياً مهماً.</p>
              <button onClick={() => setShowRadar(false)} className="w-full py-3 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] font-black rounded-[1.5rem] hover:bg-[#D4AF37]/10 transition-all shadow-[inset_0_0_15px_rgba(0,229,255,0.15)]">
                {t.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="w-full mx-auto px-0 sm:px-8 lg:px-12 pt-0 sm:pt-10 relative z-10">
        {!activeSubSection ? (
          <div className="space-y-8 sm:space-y-12 w-full">
            <div className="text-right space-y-2 sm:space-y-4 px-2">
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl sm:text-5xl font-black text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
              >
                {settings.language === 'ar' ? 'قائمة المهام' : 'Mission List'}
              </motion.h2>
              <p className="text-white/60 text-sm sm:text-lg">
                {settings.language === 'ar' ? 'اختر وجهتك التالية في رحلة التفوق' : 'Choose your next destination in the journey of excellence'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {subSections.map((section, index) => {
                const Icon = section.icon;
                const isLocked = section.locked;
                
                return (
                  <motion.div
                    key={`${section.id}_subsection`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={!isLocked ? { y: -10, scale: 1.02 } : {}}
                    onClick={() => !isLocked && setActiveSubSection(section.id)}
                    className={`relative overflow-hidden p-6 rounded-[2.5rem] border-2 transition-all duration-500 cursor-pointer group ${
                      isLocked 
                        ? 'bg-[#050505]/40 border-white/5 opacity-40 cursor-not-allowed' 
                        : `bg-[#050505]/60 backdrop-blur-sm border-[#D4AF37]/30 hover:border-[#00E5FF]/80 shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:shadow-[0_0_30px_rgba(0,229,255,0.2)]`
                    }`}
                  >
                    <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-[50px] opacity-10 transition-all duration-700 group-hover:opacity-30 bg-[#00E5FF]`} />
                    
                    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                      <div className={`p-4 rounded-[1.5rem] bg-white/5 border border-[#D4AF37]/20 group-hover:bg-[#00E5FF] group-hover:text-black group-hover:border-[#00E5FF] text-[#D4AF37] transition-all duration-500 shadow-lg`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-black text-white mb-1 group-hover:text-[#00E5FF] transition-colors leading-tight">{section.title}</h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{section.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                          {isLocked ? (settings.language === 'ar' ? 'قريباً' : 'Soon') : (settings.language === 'ar' ? 'دخول' : 'Enter')}
                        </span>
                        {!isLocked && (
                          <ChevronLeft className={`w-4 h-4 text-[#00E5FF] transition-transform duration-500 ${settings.language === 'en' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-8 w-full">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => setActiveSubSection(null)}
                className="flex items-center gap-2 text-white/40 hover:text-[#D4AF37] transition-colors group font-black uppercase tracking-widest text-xs whitespace-nowrap px-4"
              >
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${settings.language === 'en' ? 'rotate-180' : ''}`} />
                {settings.language === 'ar' ? 'العودة للمهام' : 'Back to Missions'}
              </button>
              {subSections.map(sub => (
                <button
                  key={`${sub.id}_mobile_sub`}
                  onClick={() => !sub.locked && setActiveSubSection(sub.id)}
                  className={`whitespace-nowrap px-6 py-2 rounded-full border transition-all ${
                    activeSubSection === sub.id 
                      ? 'bg-[#00E5FF] border-[#00E5FF] text-black font-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-[#D4AF37]/50'
                  } ${sub.locked ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {sub.title}
                </button>
              ))}
            </div>
            {renderSubSection()}
          </div>
        )}
      </main>

      {/* Floating Navigation Buttons */}
      {activeSubSection === 'comprehensive' && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#050A18]/80 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                className="p-3 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all disabled:opacity-20"
                disabled={currentPageIndex === 0}
            >
                <ChevronRight size={24} />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] text-white/40 font-black tracking-widest uppercase">الصفحة</span>
                <span className="text-white font-black">{currentPageIndex + 1} <span className="opacity-20 text-xs text-white">/ {unitPages.length}</span></span>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <button 
                onClick={() => setCurrentPageIndex(prev => Math.min(unitPages.length - 1, prev + 1))}
                className="p-3 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-all disabled:opacity-20"
                disabled={currentPageIndex === unitPages.length - 1}
            >
                <ChevronLeft size={24} />
            </button>
        </div>
      )}

      {/* Modals placed outside animated containers for true fixed positioning */}
      {showSixtyChallenge && currentPage && (
        <SixtySecondChallenge 
           questions={(currentPage.questions || []).slice(0, 2).concat([
              { 
                id: 9999,
                text: `سؤال استنتاجي عن ${currentPage.title}: ما هي القاعدة الأساسية المذكورة في البداية؟`, 
                options: ["القاعدة الأولى", "القاعدة الثانية", "القاعدة الثالثة (x,y,z,w)", "لا توجد قاعدة"], 
                correctAnswer: 0 
              }
           ])}
           onClose={() => setShowSixtyChallenge(false)}
           onComplete={(score) => {
              // We could use addNotification properly if passed, but for now we update progress and alert
              setProgress(prev => ({ ...prev, points: prev.points + score * 10 }));
              setShowSixtyChallenge(false);
           }}
        />
      )}
      {currentPage && activeSubSection === 'comprehensive' && (
        <>
          <StickyNote
            pageId={currentPage.id}
            initialText={progress.stickyNotes[currentPage.id] || ''}
            isOpen={showStickyNote}
            onOpen={() => setShowStickyNote(true)}
            onSave={(content) => {
              setProgress(prev => ({
                ...prev,
                stickyNotes: {
                  ...prev.stickyNotes,
                  [currentPage.id]: content
                }
              }));
              setShowStickyNote(false);
            }}
            onClose={() => setShowStickyNote(false)}
            language={settings.language}
          />

          <ChallengeModal 
            isOpen={showChallenge}
            onClose={() => setShowChallenge(false)}
            questions={currentPage.questions || []}
            pageTitle={currentPage.title}
            unitId={unitId}
            setProgress={setProgress}
            onAwardBadge={awardBadge}
            language={settings.language}
          />
        </>
      )}
    </div>
  );
};
