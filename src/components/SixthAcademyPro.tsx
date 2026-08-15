import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Lock, Radar, Trophy, Settings, Lightbulb, 
  ChevronRight, ChevronLeft, Zap, X, CheckCircle2, Eye
} from 'lucide-react';
import { BerqCharacter } from './BerqCharacterManager';

interface SixthAcademyProProps {
  onBack: () => void;
  pageData?: any;
  isTeacherEditMode?: boolean;
}

export const SixthAcademyPro: React.FC<SixthAcademyProProps> = ({ onBack, pageData }) => {
  const [activeTab, setActiveTab] = useState<'station1' | 'station2' | 'radar' | 'fame' | 'control' | 'ideas'>('station1');
  const [challengeMode, setChallengeMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // Placeholder
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string[]>([
    'ملاحظة ذكية: استخدام while/as مع الماضي المستمر دائماً لتحديد الحدث الطويل',
    'الروابط الوزارية المهمة: الماضي البسيط يقطع الماضي المستمر'
  ]);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<number, number>>({});
  const [showChallengeResult, setShowChallengeResult] = useState(false);

  const playSound = (type: string) => {
    // sound stub
  };

  useEffect(() => {
    let timer: any;
    if (challengeMode && timeLeft > 0 && !showChallengeResult) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && challengeMode) {
      setShowChallengeResult(true);
    }
    return () => clearInterval(timer);
  }, [challengeMode, timeLeft, showChallengeResult]);

  const startChallenge = () => {
    setTimeLeft(60);
    setChallengeAnswers({});
    setShowChallengeResult(false);
    setChallengeMode(true);
  };

  const toggleSolution = (id: string) => {
    setRevealedSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    setChallengeAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0f111a] via-[#1a1b35] to-[#121420] text-white flex overflow-hidden font-sans" dir="rtl">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar - Glassmorphism */}
      <aside className="w-72 sm:w-80 h-full flex-shrink-0 bg-[#0c0d14]/60 backdrop-blur-2xl border-l border-white/5 shadow-2xl flex flex-col z-20 transition-all duration-300">
        
        {/* Header */}
        <div className="p-6 flex items-center gap-4 border-b border-white/5 relative">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/20"
          >
            <ChevronRight size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-l from-white to-white/70 tracking-tight">بوابة بيرق Gate 6</h1>
            <p className="text-[10px] text-amber-400/80 font-bold tracking-widest mt-0.5">الإصدار الاحترافي V2</p>
          </div>
        </div>

        {/* Mascot Status */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-col items-center text-center relative group">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 relative"
          >
            <BerqCharacter 
              pose="pose_gateway_guardian" 
              glowColor="gold"
              className="w-full h-full object-contain"
            />
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow animate-pulse">
              بيرق متصل ⚡
            </div>
          </motion.div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          
          {/* المحطة الأولى */}
          <button 
            onClick={() => setActiveTab('station1')}
            className={`w-full text-right p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
              activeTab === 'station1' 
                ? 'bg-indigo-500/10 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                : 'bg-white/[0.02] border border-white/5 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                activeTab === 'station1' ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white' : 'bg-[#1a1c29] text-indigo-400 border border-indigo-500/20'
              }`}>
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <h3 className={`font-black text-sm mb-1 ${activeTab === 'station1' ? 'text-white' : 'text-white/80'}`}>العرض التفاعلي للملازم</h3>
                <p className="text-[10px] text-indigo-300/70 italic font-medium leading-tight">تحويل الملازم والكتب لبطاقات تفاعلية مطابقة 100%</p>
              </div>
            </div>
            {activeTab === 'station1' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />}
          </button>

          {/* المحطة الثانية (مقفلة) */}
          <div className="w-full text-right p-4 rounded-2xl bg-black/20 border border-white/5 opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30">
                <Lock size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-white/50 mb-1 flex items-center gap-2">المحطة الثانية</h3>
                <p className="text-[10px] text-white/30 font-medium">مقفلة حالياً - أكمل العرض التفاعلي للملازم</p>
              </div>
            </div>
          </div>

          <div className="h-4" /> {/* Spacer */}

          {/* رادار الذكاء */}
          <button 
            onClick={() => setActiveTab('radar')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'radar' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Radar size={18} className={activeTab === 'radar' ? 'animate-spin-slow' : ''} />
            <span className="font-bold text-sm">رادار الذكاء</span>
          </button>

          {/* قاعة الأبطال */}
          <button 
            onClick={() => setActiveTab('fame')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'fame' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Trophy size={18} />
            <span className="font-bold text-sm">قاعة الأبطال</span>
          </button>

          {/* بنك الأفكار */}
          <button 
            onClick={() => setActiveTab('ideas')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'ideas' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Lightbulb size={18} />
            <span className="font-bold text-sm">بنك الأفكار</span>
          </button>
          
          <div className="h-4" /> {/* Spacer */}

          {/* غرفة التحكم */}
          <button 
            onClick={() => setActiveTab('control')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === 'control' ? 'bg-slate-500/20 text-slate-200 border border-slate-500/30' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            <Settings size={18} />
            <span className="font-bold text-sm">غرفة التحكم</span>
          </button>

        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-black/20">
        
        <div className="flex-1 overflow-y-auto scroll-smooth p-6 sm:p-12 pb-40 no-scrollbar relative" id="content-scroll-area">
          
          <AnimatePresence mode="wait">
            {activeTab === 'station1' && (
              <motion.div 
                key={`page-${currentPage}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="max-w-4xl mx-auto"
              >
                
                {/* Academic Scholar Mascot Banner */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-white/[0.02] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                  <div className="w-28 h-28 shrink-0 relative">
                    <BerqCharacter 
                      pose="pose_academic_scholar" 
                      glowColor="cyan" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                      <span className="w-2 h-8 bg-amber-400 rounded-full"></span>
                      الوحدة الأولى: الماضي البسيط والمستمر
                    </h2>
                    <p className="text-sm text-indigo-300/80 font-bold pr-1">الدراسة الذكية مع المعلم والأكاديمي البطل بيرق 📚</p>
                  </div>
                </div>

                {/* Content Block */}
                <div className="bg-[#121424] border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                  
                  <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/5 pb-4">1. الماضي المستمر (Past Continuous)</h3>
                  
                  <div className="space-y-6 text-white/80 text-lg leading-relaxed font-medium">
                    <p>
                      نستخدم الماضي المستمر للتعبير عن حدث كان مستمراً في فترة معينة في الماضي.
                    </p>
                    <div className="p-5 bg-black/40 rounded-2xl border border-white/5 font-mono text-left" dir="ltr">
                      <span className="text-fuchsia-400">Subject</span> + <span className="text-indigo-400">was/were</span> + <span className="text-emerald-400">v.ing</span>
                    </div>
                    
                    {/* Interactive Reveal Component */}
                    <div className="mt-8 border border-white/10 rounded-2xl p-5 bg-white/[0.01]">
                      <p className="text-sm font-bold text-white/50 mb-4">مثال اختباري سريع:</p>
                      <p className="mb-4 font-mono text-left" dir="ltr">While Ali (have) a shower, somebody knocked at the front door.</p>
                      
                      <button 
                        onClick={() => toggleSolution('sol1')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                          revealedSolutions['sol1'] 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/20'
                        }`}
                      >
                        {revealedSolutions['sol1'] ? <CheckCircle2 size={18} /> : <Eye size={18} />}
                        {revealedSolutions['sol1'] ? 'was having' : 'انقر لإظهار الحل'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121424] border border-white/5 rounded-[2rem] p-8 shadow-2xl mb-12 relative overflow-hidden">
                  <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/5 pb-4">ملاحظات هامة للوزاري</h3>
                  <ul className="space-y-4 text-white/70 list-disc list-inside marker:text-indigo-400">
                    <li>دائماً نستخدم الماضي المستمر بعد <span className="text-[#00E5FF] mx-1 font-bold">while/as</span></li>
                    <li>دائماً نستخدم الماضي البسيط بعد <span className="text-fuchsia-400 mx-1 font-bold">when/and</span></li>
                  </ul>
                </div>

                {/* 60s Challenge Trigger */}
                <div className="mt-16 text-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startChallenge}
                    className="relative inline-flex items-center justify-center px-12 py-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xl shadow-[0_10px_40px_rgba(245,158,11,0.3)] hover:shadow-[0_10px_60px_rgba(245,158,11,0.5)] transition-all overflow-hidden group"
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    <Zap className="ml-3 group-hover:scale-125 transition-transform" fill="currentColor" />
                    ابدأ تحدي الـ 60 ثانية
                  </motion.button>
                  <p className="mt-4 text-xs font-bold text-white/40">اختبر فهمك لهذه الصفحة فوراً</p>
                </div>

              </motion.div>
            )}

            {/* Radar Tab */}
            {activeTab === 'radar' && (
              <motion.div 
                key="radar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="w-40 h-40 mx-auto relative mb-4">
                    <BerqCharacter 
                      pose="pose_radar_navigator" 
                      glowColor="emerald" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  
                  <h2 className="text-4xl font-black font-amiri text-white">رادار الذكاء</h2>
                  <p className="text-white/60 max-w-md mx-auto text-sm">
                    تحليل شامل للملزمة واستنباط الأسئلة الذهبية المتوقعة في الامتحان الوزاري.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right mt-8">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 relative group overflow-hidden">
                      <span className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-black">تحليل ذكي</span>
                      <h4 className="text-lg font-bold text-white">السؤال المتوقع #1</h4>
                      <p className="text-white/40 text-sm">بناءً على أنماط السنوات السابقة، يتكرر سؤال ربط الماضي المستمر والماضي البسيط باستخدام (While).</p>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-left" dir="ltr">
                        She (read) a book when the phone rang. &rarr; was reading
                      </div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 relative group overflow-hidden">
                      <span className="absolute top-4 left-4 bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-black">تحليل ذكي</span>
                      <h4 className="text-lg font-bold text-white">السؤال المتوقع #2</h4>
                      <p className="text-white/40 text-sm">التركيز على قاعدة (As) عندما تأتي في بداية الجملة والربط بالماضي البسيط.</p>
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-left" dir="ltr">
                        As we (walk) in the park, we saw a rare bird. &rarr; were walking
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hall of Fame Tab */}
            {activeTab === 'fame' && (
              <motion.div 
                key="fame"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="w-44 h-44 mx-auto relative mb-4">
                    <BerqCharacter 
                      pose="pose_champion_laureate" 
                      glowColor="gold" 
                      className="w-full h-full object-contain" 
                    />
                  </div>

                  <h2 className="text-4xl font-black text-white">قاعة الأبطال</h2>
                  <p className="text-white/60 max-w-md mx-auto text-sm">
                    لوحة شرف الأبطال! أكمل الدروس والتحديات لتحصل على الأوسمة الفسفورية المضيئة.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                    <div className="p-6 bg-white/[0.02] border border-amber-500/20 rounded-3xl space-y-4 relative group hover:bg-amber-500/5 transition-all">
                      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 mx-auto">
                        <Trophy size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">بطل الـ 60 ثانية</h4>
                        <p className="text-white/40 text-xs mt-1">أكمل تحدي الـ 60 ثانية بنجاح</p>
                      </div>
                      <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-full inline-block">مكتسب ✅</div>
                    </div>

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 relative group opacity-50">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/40 mx-auto">
                        <Lock size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white/60">درع الفوسفور الذكي</h4>
                        <p className="text-white/30 text-xs mt-1">حل 10 أسئلة متتالية بشكل صحيح</p>
                      </div>
                      <span className="text-[10px] text-white/30 bg-white/5 py-1 px-3 rounded-full">مغلق حالياً 🔒</span>
                    </div>

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 relative group opacity-50">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/40 mx-auto">
                        <Lock size={28} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white/60">تاج الأكاديمية الذهبي</h4>
                        <p className="text-white/30 text-xs mt-1">أكمل جميع محطات اليونت الأول</p>
                      </div>
                      <span className="text-[10px] text-white/30 bg-white/5 py-1 px-3 rounded-full">مغلق حالياً 🔒</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ideas Tab */}
            {activeTab === 'ideas' && (
              <motion.div 
                key="ideas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="w-40 h-40 mx-auto relative mb-4">
                    <BerqCharacter 
                      pose="pose_idea_creator" 
                      glowColor="gold" 
                      className="w-full h-full object-contain" 
                    />
                  </div>

                  <h2 className="text-3xl font-black text-white">بنك الأفكار</h2>
                  <p className="text-white/40 text-sm">
                    مساحتك الخاصة لتدوين الروابط الذهبية والأفكار العبقرية التي تستنتجها أثناء دراستك.
                  </p>

                  <div className="max-w-lg mx-auto text-right mt-6 space-y-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="اكتب فكرة عبقرية أو ملاحظة هنا..." 
                        id="idea-input-box"
                        className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-fuchsia-500 transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) {
                              setNotes(prev => [val, ...prev]);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('idea-input-box') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            setNotes(prev => [input.value, ...prev]);
                            input.value = '';
                          }
                        }}
                        className="px-6 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto no-scrollbar">
                      {notes.length === 0 ? (
                        <p className="text-center text-white/20 py-8 text-sm">لم تقم بإضافة أي ملاحظات حتى الآن.</p>
                      ) : (
                        notes.map((note, index) => (
                          <div key={index} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-white/80 text-sm">{note}</span>
                            <button 
                              onClick={() => setNotes(prev => prev.filter((_, i) => i !== index))}
                              className="text-white/20 hover:text-rose-400 text-xs transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Control Tab */}
            {activeTab === 'control' && (
              <motion.div 
                key="control"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-48 h-48 bg-slate-500/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="w-40 h-40 mx-auto relative mb-4">
                    <BerqCharacter 
                      pose="pose_control_mechanic" 
                      glowColor="cyan" 
                      className="w-full h-full object-contain" 
                    />
                  </div>

                  <h2 className="text-3xl font-black text-white">غرفة التحكم والتخصيص</h2>
                  <p className="text-white/40 text-sm max-w-md mx-auto">
                    تحكم بإعدادات البوابة والواجهات والصوت لتجربة دراسية مثالية تليق بأبطال السادس.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-right mt-8">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                      <span className="text-white/80 font-bold text-sm">تفعيل المؤثرات البصرية</span>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer flex justify-start">
                        <div className="w-4 h-4 bg-white rounded-full translate-x-6 transition-all" />
                      </div>
                    </div>
                    <div className="p-6 bg-[#121424] border border-white/5 rounded-2xl flex items-center justify-between">
                      <span className="text-white/80 font-bold text-sm">أصوات التفاعل والمؤثرات</span>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full p-1 cursor-pointer flex justify-start">
                        <div className="w-4 h-4 bg-white rounded-full translate-x-6 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Floating Navigation Controls */}
        {activeTab === 'station1' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-[#05060a]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                currentPage === totalPages ? 'text-white/20 cursor-not-allowed' : 'bg-white/5 hover:bg-indigo-500/20 text-indigo-400 border border-white/5 hover:border-indigo-500/30'
              }`}
            >
              <ChevronRight size={20} />
            </button>
            
            <div className="flex flex-col items-center justify-center px-4 min-w-[80px]">
              <span className="text-xs text-white/40 font-bold mb-0.5">الصفحة</span>
              <span className="text-lg font-black font-mono text-white">{currentPage} <span className="text-white/30 text-sm">/ {totalPages}</span></span>
            </div>

            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                currentPage === 1 ? 'text-white/20 cursor-not-allowed' : 'bg-white/5 hover:bg-indigo-500/20 text-indigo-400 border border-white/5 hover:border-indigo-500/30'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}

      </main>

      {/* 60s Challenge Modal */}
      <AnimatePresence>
        {challengeMode && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05060f]/90 px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-gradient-to-b from-[#161a33] to-[#0a0c17] rounded-[2rem] p-8 border-2 border-[#00E5FF]/30 shadow-[0_0_80px_rgba(0,229,255,0.15)] relative overflow-hidden"
            >
              {/* Decorative background circle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5FF]/5 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
              
              <button 
                onClick={() => setChallengeMode(false)}
                className="absolute top-6 left-6 p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="text-center relative z-10">
                
                {!showChallengeResult ? (
                  <>
                    <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle 
                          cx="50" cy="50" r="46" fill="none" 
                          stroke={timeLeft > 15 ? "#00E5FF" : "#F43F5E"} 
                          strokeWidth="8"
                          strokeDasharray="289"
                          strokeDashoffset={(1 - timeLeft / 60) * 289}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`text-3xl font-black font-mono ${timeLeft > 15 ? 'text-[#00E5FF]' : 'text-rose-500 animate-pulse'}`}>{timeLeft}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-6">
                      <div className="w-16 h-16 shrink-0">
                        <BerqCharacter 
                          pose="pose_sixty_seconds_challenger" 
                          glowColor="cyan" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className="text-right">
                        <h2 className="text-2xl font-black text-white">تحدي الـ 60 ثانية</h2>
                        <p className="text-white/50 text-xs font-medium">سؤالان سريعان من محتوى هذه الصفحة فقط مع البطل بيرق!</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-right" dir="auto">
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                        <p className="font-bold text-white mb-4">س1: ما هو الزمن المستخدم بعد while مباشرة؟</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleSelectOption(0, 0)}
                            className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                              challengeAnswers[0] === 0 
                                ? 'border-amber-400 bg-amber-400/20 text-white' 
                                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            الماضي البسيط
                          </button>
                          <button 
                            onClick={() => handleSelectOption(0, 1)}
                            className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                              challengeAnswers[0] === 1 
                                ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-white shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            الماضي المستمر
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                        <p className="font-bold text-white mb-4">س2: الأفعال بعد when و and تكون بـ...</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => handleSelectOption(1, 0)}
                            className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                              challengeAnswers[1] === 0 
                                ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-white shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
                                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            الماضي البسيط
                          </button>
                          <button 
                            onClick={() => handleSelectOption(1, 1)}
                            className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                              challengeAnswers[1] === 1 
                                ? 'border-amber-400 bg-amber-400/20 text-white' 
                                : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            الماضي المستمر
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowChallengeResult(true)}
                      className="w-full mt-8 py-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-black text-lg shadow-[0_10px_30px_rgba(0,229,255,0.3)] hover:shadow-[0_10px_40px_rgba(0,229,255,0.5)] transition-all"
                    >
                      تسليم الإجابات
                    </button>
                  </>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="w-48 h-48 mx-auto relative">
                      <BerqCharacter 
                        pose="pose_champion_laureate" 
                        glowColor="gold" 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white">أحسنت يا بطل الأكاديمية!</h3>
                      <p className="text-white/60 text-sm mt-2">لقد أكملت تحدي الستين ثانية بنجاح باهر ⚡</p>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl max-w-sm mx-auto">
                      <p className="text-xs text-white/40">النتيجة النهائية</p>
                      <p className="text-3xl font-black text-amber-400 mt-1">
                        {((challengeAnswers[0] === 1 ? 1 : 0) + (challengeAnswers[1] === 0 ? 1 : 0))} / 2
                      </p>
                    </div>

                    <button 
                      onClick={() => setChallengeMode(false)}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      إغلاق والتالي 🚀
                    </button>
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
