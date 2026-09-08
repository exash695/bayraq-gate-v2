import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Lock as LockIcon, 
  Radar, 
  Trophy, 
  Settings as SettingsIcon, 
  Lightbulb, 
  ChevronRight, 
  ChevronLeft, 
  Zap, 
  Timer,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  FileText,
  HelpCircle,
  Sparkles,
  Crown,
  Award,
  Fingerprint,
  Star,
  Target,
  Glasses
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, increment, getDoc, where } from '@/src/lib/firebase';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { sounds } from '../lib/sounds';
import { BerqCharacter } from './BerqCharacterManager';

interface Page {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  quiz: {
    question: string;
    options: string[];
    correct: number;
  }[];
}

const MOCK_PAGES: Page[] = [
  {
    id: "1",
    title: "اليونت الأول: الأساسيات",
    subtitle: "قواعد الربط الزمني",
    content: [
      "العرض التفاعلي: القواعد التفاعلية المستخلصة.",
      "تستخدم (While) و (As) مع الماضي المستمر دائماً، حيث يعبران عن حدث طويل استمر في الماضي.",
      "قاعدة التحويل الذكي: الفاعل + was/were + الفعل مضافاً له ing.",
      "أما (When) و (And) فيأتي بعدهما الماضي البسيط مباشرة للتعبير عن حدث مفاجئ قطع الاستمرار.",
      "ملاحظة فوسفورية: إذا وجدت (was/were) ابحث عن ing فوراً في الخيارات."
    ],
    quiz: [
      {
        question: "ما هي الأداة التي يأتي بعدها ماضي مستمر دائماً؟",
        options: ["While", "When", "And", "Once"],
        correct: 0
      },
      {
        question: "الفعل بعد (When) يكون في حالة:",
        options: ["الماضي البسيط", "الماضي المستمر", "المستقبل", "الأمر"],
        correct: 0
      }
    ]
  }
];

export const BayraqGateway: React.FC<{ initialTab?: string; onBack: () => void }> = ({ initialTab = 'station1', onBack }) => {
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'station1' | 'station2' | 'radar' | 'hall' | 'control' | 'bank'>(initialTab as any);
  const [pages, setPages] = useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [revealedSolutions, setRevealedSolutions] = useState<Set<string>>(new Set());

  useEffect(() => {
    setActiveTab(initialTab as any);
  }, [initialTab]);

  useEffect(() => {
    const q = query(collection(db, 'academy_pages'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setPages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      } else {
        setPages(MOCK_PAGES);
      }
      setLoadingPages(false);
    });
    return () => unsub();
  }, []);

  const currentPage = pages[currentPageIndex] || MOCK_PAGES[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isChallengeActive && timeLeft > 0 && !showResults) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isChallengeActive) {
      setShowResults(true);
    }
    return () => clearInterval(timer);
  }, [isChallengeActive, timeLeft, showResults]);

  const startChallenge = () => {
    setIsChallengeActive(true);
    setTimeLeft(60);
    setQuizStep(0);
    setQuizScore(0);
    setShowResults(false);
    sounds.playNotification();
  };

  const handleAnswer = (index: number) => {
    if (index === currentPage.quiz[quizStep].correct) {
      setQuizScore(prev => prev + 1);
      sounds.playSuccess();
    } else {
      sounds.playError();
    }

    if (quizStep < currentPage.quiz.length - 1) {
      setQuizStep(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const toggleSolution = (id: string) => {
    const newSet = new Set(revealedSolutions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setRevealedSolutions(newSet);
  };

  const renderTabContent = () => {
    if (loadingPages) return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-white/40 font-black animate-pulse">جاري تحضير المحطة التعليمية...</p>
      </div>
    );

    switch (activeTab) {
      case 'radar':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-4 py-12">
               <div className="w-40 h-40 mx-auto relative mb-4">
                  <BerqCharacter 
                    pose="pose_radar_navigator" 
                    glowColor="emerald" 
                    className="w-full h-full" 
                  />
               </div>
               <h2 className="text-4xl font-black font-amiri text-white">رادار الذكاء</h2>
               <p className="text-white/40 max-w-md mx-auto">تحليل شامل للملزمة واستنباط الأسئلة الذهبية التي تضمن التفوق الفوسفوري.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {["كيف تم الربط بين زمنين مختلفين في الصفحة الأخيرة؟", "استنتج الفكرة المركزية من الفقرة الثانية.", "ما هي الكلمة المفتاحية المختبئة في هذا النص؟"].map((q, i) => (
                  <div key={`radar_question_${i}`} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-[#00FF88]/50 transition-all group">
                     <p className="text-[#00FF88] font-bold mb-2">سؤال استنتاجي {i+1}:</p>
                     <p className="text-white/80">{q}</p>
                  </div>
               ))}
            </div>
          </div>
        );
      case 'hall':
        return (
          <div className="space-y-12 animate-in fade-in zoom-in duration-700 pb-20">
             <div className="text-center space-y-4">
                <Crown size={64} className="text-amber-400 mx-auto drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                <h2 className="text-5xl font-black font-amiri bg-gradient-to-b from-amber-200 to-amber-600 bg-clip-text text-transparent">قاعة الأبطال</h2>
                <p className="text-white/30 tracking-widest uppercase text-xs font-black">Elite Hall of Fame</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((_, i) => (
                   <div key={`hall_of_fame_placeholder_${i}`} className="p-8 bg-gradient-to-br from-[#1A1A2E] to-[#0A0A0A] rounded-[3rem] border border-amber-500/20 text-center space-y-4 relative group hover:border-amber-500 transition-all duration-500">
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 text-black rounded-full flex items-center justify-center font-black shadow-xl">
                         #{i+1}
                      </div>
                      <div className="w-32 h-32 mx-auto relative group-hover:scale-110 transition-transform flex items-center justify-center">
                         <BerqCharacter 
                           pose={i === 0 ? "pose_champion_laureate" : i === 1 ? "pose_sovereign_leader" : "pose_academic_scholar"} 
                           glowColor={i === 0 ? "gold" : i === 1 ? "purple" : "cyan"}
                           className="w-full h-full"
                         />
                      </div>
                      <h3 className="text-xl font-black text-white">بطل البوابة</h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">إنجاز: العرض التفاعلي</p>
                      <div className="flex justify-center gap-1">
                         {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-amber-500 fill-amber-500" />)}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );
      case 'bank':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center space-y-6">
                <div className="w-36 h-36 mx-auto mb-4">
                   <BerqCharacter 
                     pose="pose_idea_creator" 
                     glowColor="gold" 
                     className="w-full h-full" 
                   />
                </div>
                <h2 className="text-3xl font-black text-white">بنك الأفكار</h2>
                <p className="text-white/40 text-sm">مساحتك الخاصة لتدوين الروابط الذهبية والأفكار العبقرية التي تستنتجها.</p>
                <textarea 
                  className="w-full h-48 bg-black/40 border border-white/5 rounded-3xl p-6 text-white text-lg placeholder:text-white/10 outline-none focus:border-amber-400 transition-all"
                  placeholder="اكتب فكرتك الذهبية هنا..."
                />
                <button className="px-10 py-4 bg-amber-400 text-black font-black rounded-2xl hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20 active:scale-95">حفظ الفكرة</button>
             </div>
          </div>
        );
      case 'control':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center space-y-6">
                <div className="w-36 h-36 mx-auto mb-4">
                   <BerqCharacter 
                     pose="pose_control_mechanic" 
                     glowColor="cyan" 
                     className="w-full h-full" 
                   />
                </div>
                <h2 className="text-3xl font-black text-white">غرفة التحكم والتخصيص</h2>
                <p className="text-white/40 text-sm max-w-md mx-auto">تحكم بإعدادات البوابة والصوت والتأثيرات الفوسفورية لتجربة دراسية مثالية.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-right mt-6">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <span className="text-white/80 font-bold">تفعيل المؤثرات البصرية</span>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer flex justify-start">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                    </div>
                  </div>
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                    <span className="text-white/80 font-bold">أصوات التفاعل والمؤثرات</span>
                    <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer flex justify-start">
                      <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        );
      case 'station1':
      default:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Page Title Section */}
            <div className="text-center space-y-6 py-8 relative">
               <div className="w-40 h-40 mx-auto relative mb-2">
                 <BerqCharacter 
                   pose="pose_academic_scholar" 
                   glowColor="cyan" 
                   className="w-full h-full" 
                 />
               </div>
               <motion.div 
                 initial={{ y: -20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="inline-flex items-center gap-2 px-6 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-[10px] font-black tracking-widest uppercase"
               >
                 <Sparkles size={12} />
                 <span>{currentPage.title}</span>
               </motion.div>
               <h1 className="text-5xl md:text-7xl font-black font-amiri text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                 {currentPage.subtitle}
               </h1>
            </div>

            {/* List of Content Sections */}
            <div className="space-y-8">
               {currentPage.content.map((text, i) => (
                  <motion.div
                    key={`${currentPage.id}-c-${i}`}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="p-10 bg-gradient-to-br from-[#101935]/80 to-[#050A18]/90 backdrop-blur-3xl border border-white/5 rounded-[3rem] hover:border-amber-500/20 transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                       <FileText size={150} />
                    </div>
                    
                    <p className="text-2xl md:text-3xl font-medium leading-[1.7] text-white/90 relative z-10 font-sans">
                       {text}
                    </p>

                    {text.includes(":") && (
                      <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                        <button 
                          onClick={() => toggleSolution(`${currentPage.id}-${i}`)}
                          className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-sm transition-all ${
                            revealedSolutions.has(`${currentPage.id}-${i}`) ? 'bg-[#00FF88]/20 text-[#00FF88]' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Fingerprint size={18} />
                          {revealedSolutions.has(`${currentPage.id}-${i}`) ? "إخفاء التوضيح" : "نقر للإظهار (نظام الإظهار الذكي)"}
                        </button>
                        <AnimatePresence>
                          {revealedSolutions.has(`${currentPage.id}-${i}`) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-6"
                            >
                               <div className="p-6 bg-[#00FF88]/5 border border-[#00FF88]/10 rounded-2xl text-[#00FF88] italic text-lg leading-relaxed">
                                  توضيح ذكي: هنا يتم الربط المباشر مع محتوى اليونت لضمان فهم العمق التعليمي للفقرة المذكورة أعلاه.
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
               ))}
            </div>

            {/* 60s Challenge Section */}
            <div className="py-20 flex justify-center">
               <motion.button
                 whileHover={{ scale: 1.05, y: -5 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={startChallenge}
                 className="relative group pr-2 pl-12 py-2 bg-amber-400 rounded-full flex items-center gap-6 shadow-[0_30px_60px_rgba(251,191,36,0.2)]"
               >
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform">
                     <Zap size={32} fill="currentColor" />
                  </div>
                  <span className="text-2xl font-black text-black">⚡ ابدأ تحدي الـ 60 ثانية</span>
               </motion.button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex overflow-hidden font-sans relative" dir="rtl">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c1e] via-[#050505] to-[#12121a] -z-10" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      {/* Glass Sidebar */}
      <aside className="w-80 bg-white/[0.02] backdrop-blur-3xl border-l border-white/5 flex flex-col p-8 gap-10 z-50 shadow-2xl">
        <div className="space-y-4 flex flex-col items-center text-center">
           <motion.div
             animate={{ y: [0, -6, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="relative"
           >
             <BerqCharacter 
               pose="pose_gateway_guardian" 
               glowColor="gold"
               className="h-28 w-auto mx-auto"
             />
             <div className="absolute -bottom-1 -right-1 bg-[#00FF88] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
               متصل ⚡
             </div>
           </motion.div>
           <div className="space-y-1">
             <h2 className="text-3xl font-black font-amiri bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">بوابة بيرق</h2>
             <p className="text-[10px] text-white/30 tracking-[0.3em] font-black uppercase">Pro Edition v.2.0</p>
           </div>
        </div>

        <nav className="flex-1 space-y-3">
           <SidebarLink 
             icon={<BookOpen size={20} />} 
             title="العرض التفاعلي" 
             info={`${currentPage?.title || 'جاري التحميل'} | ${currentPage?.subtitle || ''}`}
             active={activeTab === 'station1'} 
             onClick={() => setActiveTab('station1')}
             color="#3B82F6"
           />
           <SidebarLink 
             icon={<LockIcon size={20} />} 
             title="المحطة الثانية" 
             info="مقفلة حالياً"
             active={false}
             locked
             onClick={() => {}}
             color="#64748B"
           />
           <SidebarLink 
             icon={<Radar size={20} />} 
             title="رادار الذكاء" 
             info="تحليل الأسئلة المستنتجة"
             active={activeTab === 'radar'} 
             onClick={() => setActiveTab('radar')}
             color="#00FF88"
           />
           <SidebarLink 
             icon={<Trophy size={20} />} 
             title="قاعة الأبطال" 
             info="لوحة شرف المبدعين"
             active={activeTab === 'hall'} 
             onClick={() => setActiveTab('hall')}
             color="#F59E0B"
           />
           <SidebarLink 
             icon={<Lightbulb size={20} />} 
             title="بنك الأفكار" 
             info="ملاحظات الطالب الذكية"
             active={activeTab === 'bank'} 
             onClick={() => setActiveTab('bank')}
             color="#EAB308"
           />
           <SidebarLink 
             icon={<SettingsIcon size={20} />} 
             title="غرفة التحكم" 
             info="إعدادات التجربة"
             active={activeTab === 'control'} 
             onClick={() => setActiveTab('control')}
             color="#06B6D4"
           />
        </nav>

        <button 
          onClick={onBack}
          className="mt-auto py-4 w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white/40 hover:text-white transition-all text-sm font-bold"
        >
           <ArrowRight size={18} />
           <span>العودة للرئيسية</span>
        </button>
      </aside>

      {/* Interaction Stage */}
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
        <div className="max-w-5xl mx-auto p-12 pb-40">
           {renderTabContent()}
        </div>

        {/* Floating Controls */}
        {activeTab === 'station1' && (
          <div className="fixed bottom-12 right-1/2 translate-x-1/2 flex items-center gap-6 p-3 bg-white/[0.03] backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl z-50">
             <button 
                disabled={currentPageIndex === 0}
                onClick={() => setCurrentPageIndex(prev => prev - 1)}
                className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all text-white"
             >
                <ChevronRight size={28} />
             </button>
             <div className="px-8 flex flex-col items-center">
                <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">المحطة</span>
                <span className="text-xl font-black text-white">{currentPageIndex + 1} / {pages.length || 1}</span>
             </div>
             <button 
                disabled={currentPageIndex >= pages.length - 1}
                onClick={() => setCurrentPageIndex(prev => prev + 1)}
                className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all text-white"
             >
                <ChevronLeft size={28} />
             </button>
          </div>
        )}
      </main>

      {/* Challenge Overlay */}
      <AnimatePresence>
        {isChallengeActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#050505]/95 backdrop-blur-xl"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 40 }}
               animate={{ scale: 1, y: 0 }}
               className="w-full max-w-2xl bg-[#0c0c1e] border border-white/10 rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
             >
                {/* Modal Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-amber-400/20 rounded-3xl flex items-center justify-center text-amber-400 border border-amber-400/20">
                         <Timer size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-white">تحدي الـ 60 ثانية</h3>
                         <p className="text-sm text-white/30 font-bold">كل ثانية تساوي معلومة ذهبية!</p>
                      </div>
                   </div>
                   <div className={`text-5xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-bounce' : 'text-amber-400'}`}>
                      {timeLeft}
                   </div>
                </div>

                {/* Modal Body */}
                <div className="p-12">
                   {!showResults ? (
                     <div className="space-y-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/[0.02] border border-white/5 p-8 rounded-3xl">
                           <div className="w-28 h-28 shrink-0 relative">
                              <BerqCharacter 
                                pose="pose_sixty_seconds_challenger" 
                                glowColor="gold" 
                                className="w-full h-full" 
                              />
                           </div>
                           <div className="space-y-3 flex-1 text-right">
                              <span className="text-xs text-amber-500 font-black uppercase tracking-[0.3em] bg-amber-500/10 px-4 py-1.5 rounded-full">السؤال {quizStep + 1}</span>
                              <h4 className="text-3xl font-black font-amiri leading-normal text-white">
                                 {currentPage?.quiz?.[quizStep]?.question || "جاري التحميل..."}
                              </h4>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                           {currentPage?.quiz?.[quizStep]?.options.map((opt, idx) => (
                             <motion.button
                               key={`quiz_option_${idx}`}
                               whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }}
                               onClick={() => handleAnswer(idx)}
                               className="p-6 rounded-[2rem] bg-white/5 border border-white/5 text-right text-xl font-bold flex items-center justify-between group transition-all"
                             >
                                <span>{opt}</span>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-black transition-all">
                                   <ChevronLeft size={20} />
                                </div>
                             </motion.button>
                           ))}
                        </div>
                     </div>
                   ) : (
                     <div className="text-center py-10 space-y-8">
                        <div className="relative inline-block">
                           <div className="w-48 h-48 mx-auto relative z-10">
                              <BerqCharacter 
                                pose="pose_champion_laureate" 
                                glowColor="gold" 
                                className="w-full h-full" 
                              />
                           </div>
                           <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                              className="absolute inset-0 -m-4 border-2 border-dashed border-amber-400/30 rounded-full"
                           />
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-4xl font-black text-white">أحسنت يا بطل!</h4>
                           <p className="text-xl text-white/40">نتيجة التحدي: <span className="text-amber-400 font-black">{quizScore}</span> من أصل {currentPage.quiz.length}</p>
                        </div>
                        <div className="flex gap-4 justify-center">
                           <button onClick={() => setIsChallengeActive(false)} className="px-10 py-5 bg-white/5 rounded-[2rem] font-black hover:bg-white/10 transition-all border border-white/10">إنهاء</button>
                           <button onClick={startChallenge} className="px-10 py-5 bg-amber-400 text-black rounded-[2rem] font-black hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20">إعادة المحاولة</button>
                        </div>
                     </div>
                   )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarLink: React.FC<{ 
  icon: React.ReactNode, 
  title: string, 
  info: string, 
  active: boolean, 
  locked?: boolean,
  onClick: () => void,
  color: string
}> = ({ icon, title, info, active, locked, onClick, color }) => {
  return (
    <button 
      onClick={locked ? undefined : onClick}
      className={`w-full p-5 rounded-[2.5rem] flex items-center gap-4 transition-all relative overflow-hidden group ${
        active 
          ? 'bg-white/5 shadow-inner border border-white/10' 
          : 'hover:bg-white/[0.03]'
      } ${locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute inset-y-0 right-0 w-1 rounded-full bg-amber-400"
        />
      )}
      
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        {icon}
      </div>
      
      <div className="text-right flex-1 min-w-0">
        <h3 className={`text-sm font-black transition-colors ${active ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>{title}</h3>
        <p className="text-[10px] text-white/20 font-bold truncate italic">{info}</p>
      </div>
    </button>
  );
};
