import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Lock, Radar, Trophy, Settings, Lightbulb, 
  ChevronRight, ChevronLeft, Zap, CheckCircle2, XCircle, 
  Share2, Download, Sparkles, RefreshCw, Eye, Award, 
  HelpCircle, Check, ArrowRight, Volume2, VolumeX, ShieldCheck,
  Flame, Bookmark, Plus, Trash2, Send
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { safeStorage } from '../lib/storage';

interface Gate6Props {
  onBack?: () => void;
}

interface IdeaNote {
  id: string;
  title: string;
  category: string;
  content: string;
  timestamp: string;
}

export const Gate6: React.FC<Gate6Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'station1' | 'station2' | 'radar' | 'hall' | 'control' | 'ideas'>('station1');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 3;

  // Student profile state
  const [studentName, setStudentName] = useState<string>(() => {
    return safeStorage.getItem('g6_student_name') || 'فاطمة حيدر علي';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Solutions reveal state
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});

  // 60-Second Challenge State
  const [showChallenge, setShowChallenge] = useState<boolean>(false);
  const [challengeTime, setChallengeTime] = useState<number>(60);
  const [challengeActive, setChallengeActive] = useState<boolean>(false);
  const [challengeFinished, setChallengeFinished] = useState<boolean>(false);
  const [currentChallengeQ, setCurrentChallengeQ] = useState<number>(0);
  const [selectedChallengeAnswers, setSelectedChallengeAnswers] = useState<Record<number, number>>({});
  const [challengeScore, setChallengeScore] = useState<number>(0);

  // Unlocked Medals
  const [unlockedMedals, setUnlockedMedals] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('g6_unlocked_medals');
      return saved ? JSON.parse(saved) : ['station1', 'fast_learner'];
    } catch {
      return ['station1', 'fast_learner'];
    }
  });

  // Ideas Bank
  const [notes, setNotes] = useState<IdeaNote[]>(() => {
    try {
      const saved = safeStorage.getItem('g6_student_notes');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          title: 'قاعدة While و As الذهبية',
          category: 'قواعد',
          content: 'دائماً يأتي بعد While و As جملة بزمن الماضي المستمر (Past Continuous: was/were + v-ing)، والجملة الأخرى بالماضي البسيط.',
          timestamp: 'اليوم، 10:30 ص'
        },
        {
          id: '2',
          title: 'فعل غير قياسي يتكرر وزارياً',
          category: 'مفردات',
          content: 'الفعل (fall) ماضيه (fell) والتصريف الثالث (fallen) - لا تخطط بينه وبين (feel -> felt).',
          timestamp: 'أمس، 04:15 م'
        }
      ];
    } catch {
      return [];
    }
  });
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('قواعد');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Honor Card HD Generation State
  const honorCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [cardGeneratedUrl, setCardGeneratedUrl] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState<boolean>(false);

  // Radar Interactive Quiz State
  const [radarAnswers, setRadarAnswers] = useState<Record<number, number>>({});
  const [radarChecked, setRadarChecked] = useState<Record<number, boolean>>({});

  // Challenge Timer Effect
  useEffect(() => {
    let timer: any;
    if (showChallenge && challengeActive && challengeTime > 0) {
      timer = setInterval(() => {
        setChallengeTime((prev) => prev - 1);
      }, 1000);
    } else if (challengeTime === 0 && challengeActive) {
      finishChallenge();
    }
    return () => clearInterval(timer);
  }, [showChallenge, challengeActive, challengeTime]);

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const unlockMedal = (medalId: string) => {
    if (!unlockedMedals.includes(medalId)) {
      const updated = [...unlockedMedals, medalId];
      setUnlockedMedals(updated);
      safeStorage.setItem('g6_unlocked_medals', JSON.stringify(updated));
    }
  };

  // 60s Challenge Questions mapped per page
  const pageChallenges = [
    {
      page: 1,
      questions: [
        {
          q: "ما هي الصيغة الصحيحة لزمن الماضي المستمر مع الضمير 'She'؟",
          options: ["She was playing", "She were playing", "She is played", "She played"],
          correct: 0,
          explanation: "الضمائر المفردة (I, He, She, It) تأخذ Was متبوعة بفعل مضاف له ing."
        },
        {
          q: "اختر الجملة التي تحتوي على زمن ماضي بسيط صحيح:",
          options: ["Ali was see the film", "Ali saw the film", "Ali seeing the film", "Ali seen the film"],
          correct: 1,
          explanation: "الفعل 'see' غير قياسي، وصيغة الماضي البسيط منه هي 'saw'."
        }
      ]
    },
    {
      page: 2,
      questions: [
        {
          q: "أي من أدوات الربط التالية يأتي بعدها ماضي بسيط دائماً؟",
          options: ["While", "As", "When & And", "Because"],
          correct: 2,
          explanation: "أداتا الربط When و And يتبعهما دائماً جملة في زمن الماضي البسيط (Past Simple)."
        },
        {
          q: "أكمل: While I (read), the phone rang.",
          options: ["was reading", "were reading", "readed", "am reading"],
          correct: 0,
          explanation: "بعد While نستخدم Past Continuous، والضمير I يأخذ was reading."
        }
      ]
    },
    {
      page: 3,
      questions: [
        {
          q: "ما هو المعنى الدقيق للفعل المركب 'Give up' وزارياً؟",
          options: ["يستسلم / يقلع عن", "يستيقظ", "يبحث عن", "يستمر"],
          correct: 0,
          explanation: "Give up تعني الإقلاع عن عادة أو الاستسلام (Give up smoking)."
        },
        {
          q: "اختر الترتيب الصحيح للضمير مع الفعل المركب: 'turn on / it'",
          options: ["turn on it", "turn it on", "it turn on", "turning on it"],
          correct: 1,
          explanation: "إذا كان المفعول به ضميراً (it/them) يجب أن يقع حصراً بين الفعل وحرف الجر."
        }
      ]
    }
  ];

  const currentChallengeData = pageChallenges[currentPage - 1] || pageChallenges[0];

  const startChallenge = () => {
    setChallengeTime(60);
    setCurrentChallengeQ(0);
    setSelectedChallengeAnswers({});
    setChallengeScore(0);
    setChallengeFinished(false);
    setChallengeActive(true);
    setShowChallenge(true);
  };

  const handleSelectChallengeAnswer = (qIndex: number, optionIndex: number) => {
    setSelectedChallengeAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const nextChallengeQuestion = () => {
    if (currentChallengeQ < currentChallengeData.questions.length - 1) {
      setCurrentChallengeQ((prev) => prev + 1);
    } else {
      finishChallenge();
    }
  };

  const finishChallenge = () => {
    setChallengeActive(false);
    setChallengeFinished(true);

    // Calculate score
    let calculated = 0;
    currentChallengeData.questions.forEach((q, idx) => {
      if (selectedChallengeAnswers[idx] === q.correct) {
        calculated += 50;
      }
    });
    setChallengeScore(calculated);

    if (calculated >= 50) {
      unlockMedal('challenge_60s');
    }
  };

  // High-Resolution Honor Card Export
  const handleGenerateHighResCard = async () => {
    if (!honorCardRef.current) return;
    setIsGeneratingCard(true);
    try {
      // Use pixelRatio: 3 for crisp 300+ DPI Retina rendering without blurring
      const dataUrl = await toPng(honorCardRef.current, {
        pixelRatio: 3,
        quality: 1.0,
        skipFonts: true,
        cacheBust: false,
      });
      setCardGeneratedUrl(dataUrl);
      setShowCardModal(true);
    } catch (err) {
      console.warn("Standard toPng failed, trying fallback:", err);
      try {
        const dataUrl = await toPng(honorCardRef.current, {
          pixelRatio: 2,
          quality: 0.95,
          skipFonts: true,
        });
        setCardGeneratedUrl(dataUrl);
        setShowCardModal(true);
      } catch (fallbackErr) {
        console.error("Card generation fallback failed:", fallbackErr);
      }
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const handleDownloadCard = () => {
    if (!cardGeneratedUrl) return;
    const link = document.createElement('a');
    link.download = `بطاقة_شرف_بيرق_${studentName.replace(/\s+/g, '_')}_Gate6.png`;
    link.href = cardGeneratedUrl;
    link.click();
  };

  // Idea bank functions
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote: IdeaNote = {
      id: Date.now().toString(),
      title: newNoteTitle.trim(),
      category: newNoteCategory,
      content: newNoteContent.trim(),
      timestamp: 'الآن'
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    safeStorage.setItem('g6_student_notes', JSON.stringify(updated));
    setNewNoteTitle('');
    setNewNoteContent('');
    unlockMedal('idea_genius');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    safeStorage.setItem('g6_student_notes', JSON.stringify(updated));
  };

  // Radar Questions (Smart inferred from curriculum)
  const radarQuestions = [
    {
      id: 1,
      tag: "سؤال استنتاجي وزاري مكرر",
      title: "لماذا نستخدم 'While' مع الأفعال الاستمرارية الطويلة مثل (drive, read, sleep) بدلاً من اللحظية؟",
      options: [
        "لأن الماضي المستمر يعبر عن حدث استغرق فترة زمنية ممتدة قطعه حدث مفاجئ في الماضي البسيط.",
        "لأن 'While' تعبر دائماً عن المستقبل التام فقط.",
        "لأن الأفعال اللحظية لا تأتي إلا في صيغة التصريف الثالث.",
        "لا يوجد فرق بين الأفعال الاستمرارية واللحظية في اللغة الإنجليزية."
      ],
      correct: 0,
      analysis: "تحليل الذكاء الاصطناعي: قاعدة Unit 1 ترتكز على مبدأ (الحدث الطويل الممتد يوضع في Past Continuous، والحدث اللحظي القصير القاطع يوضع في Past Simple)."
    },
    {
      id: 2,
      tag: "فخ قواعدي شائع",
      title: "في جملة: 'She told us to be quiet as we (make) too much noise'، ما الصيغة الدقيقة للفعل بين القوسين؟",
      options: [
        "were making",
        "was making",
        "made",
        "are making"
      ],
      correct: 0,
      analysis: "تحليل الذكاء الاصطناعي: كلمة 'as' هنا تعني بينما (While) وتأخذ بعدها ماضياً مستمراً، والفاعل 'we' جمع لذلك نستخدم were making."
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const SidebarItem = ({ id, icon: Icon, title, subtitle, locked = false, color }: any) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => !locked && setActiveTab(id)}
        className={`w-full text-right p-3.5 rounded-2xl mb-2.5 flex items-center gap-3.5 transition-all duration-300 relative group
          ${isActive 
            ? 'bg-gradient-to-r from-[#D4AF37]/15 to-transparent border border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)] translate-x-[-3px]' 
            : 'hover:bg-white/[0.04] border border-transparent'}
          ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg shrink-0 transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`font-black text-base truncate ${isActive ? 'text-[#FFD700]' : 'text-white'}`}>
              {title}
            </h3>
            {locked && <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-1" />}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 italic mt-0.5 truncate font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {isActive && (
          <div className="w-1.5 h-6 bg-gradient-to-b from-[#FFD700] to-[#F59E0B] rounded-full absolute left-2" />
        )}
      </button>
    );
  };

  return (
    <div className={`flex h-screen w-full bg-[#020617] overflow-hidden select-none font-sans ${fontSize === 'large' ? 'text-lg' : fontSize === 'xlarge' ? 'text-xl' : 'text-base'}`} dir="rtl">
      {/* Background Deep Indigo & Charcoal with Golden & Phosphorescent Accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0A1024] to-[#050A18] pointer-events-none" />
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-5" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, #D4AF37 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
        }} 
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-transparent to-transparent opacity-60" />

      {/* 1. Glassmorphism Sidebar */}
      <aside className="w-80 h-full backdrop-blur-2xl bg-white/[0.03] border-l border-white/10 p-5 flex flex-col z-20 shadow-[20px_0_50px_rgba(0,0,0,0.6)] shrink-0" dir="rtl">
        {/* Brand Header */}
        <div className="mb-6 text-center relative py-3 border-b border-white/5 pb-5">
          <div className="absolute inset-0 bg-[#D4AF37]/10 blur-2xl rounded-full scale-125 pointer-events-none" />
          <div className="flex items-center justify-center gap-3 mb-1">
            <img 
              src="https://raw.githubusercontent.com/Arkan-M/Resources/main/Gate6/berq_logo.png" 
              alt="شعار بيرق" 
              className="w-10 h-10 object-contain rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#F59E0B] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              بوابة بيرق
            </h1>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-[#D4AF37]/30 text-[#FFD700] text-[10px] font-black tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-[#FFD700]" />
            GATE 6 - النسخة المعتمدة
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 space-y-1.5 overflow-y-auto pr-0.5 no-scrollbar">
          <SidebarItem 
            id="station1" 
            icon={BookOpen} 
            title="المحطة الأولى" 
            subtitle="اليونت الأول: Unit 1 (المحتوى الحرفي)" 
            color="from-indigo-500 to-blue-600"
          />
          <SidebarItem 
            id="station2" 
            icon={Lock} 
            title="المحطة الثانية" 
            subtitle="اليونت الثاني - مقفلة حالياً" 
            locked={true} 
            color="from-slate-700 to-slate-800"
          />
          <SidebarItem 
            id="radar" 
            icon={Radar} 
            title="رادار الذكاء" 
            subtitle="الأسئلة الذكية المستنتجة من الملزمة" 
            color="from-emerald-400 to-teal-600"
          />
          <SidebarItem 
            id="hall" 
            icon={Trophy} 
            title="قاعة الأبطال" 
            subtitle="لوحة الشرف وبطاقات التكريم" 
            color="from-amber-400 to-orange-500"
          />
          <SidebarItem 
            id="ideas" 
            icon={Lightbulb} 
            title="بنك الأفكار" 
            subtitle="ملاحظات واستنتاجات الطالبة" 
            color="from-purple-500 to-fuchsia-600"
          />
        </div>

        {/* Bottom Section: Control Room & Back Button */}
        <div className="pt-4 mt-2 border-t border-white/5 space-y-2">
          <SidebarItem 
            id="control" 
            icon={Settings} 
            title="غرفة التحكم" 
            subtitle="إعدادات التطبيق والتخصيص" 
            color="from-slate-600 to-slate-800"
          />
          {onBack && (
            <button
              onClick={onBack}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>الرجوع للمنصة الرئيسية</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Stage */}
      <main className="flex-1 relative overflow-hidden flex flex-col z-10" dir="rtl">
        {/* Dynamic Ambient Glow Orbs */}
        <div className="absolute top-[-10%] right-[10%] w-[40%] h-[40%] bg-[#D4AF37]/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-5%] left-[5%] w-[30%] h-[30%] bg-[#00E5FF]/5 blur-[100px] rounded-full pointer-events-none animate-pulse [animation-delay:2s]" />

        {/* Dynamic Top Bar */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between backdrop-blur-md bg-black/20 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black text-white/70 tracking-wide uppercase">
              {activeTab === 'station1' && `المحطة الأولى • الشاشة ${currentPage} من ${totalPages}`}
              {activeTab === 'radar' && "رادار الذكاء • استنتاجات الملزمة الوزارية"}
              {activeTab === 'hall' && "قاعة الأبطال • لوحة الشرف الرسمية"}
              {activeTab === 'ideas' && "بنك الأفكار • تدوينات الفارس الذكية"}
              {activeTab === 'control' && "غرفة التحكم • إعدادات المنصة"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10">
              <Award className="w-4 h-4 text-[#FFD700]" />
              <span className="text-xs font-bold text-white/90">
                {studentName}
              </span>
              <span className="text-[10px] text-[#FFD700] bg-[#FFD700]/10 px-1.5 py-0.5 rounded font-black">
                {unlockedMedals.length} أوسمة
              </span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white transition"
              title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FFD700]" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Tab View Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 z-10 scroll-smooth custom-scrollbar pb-32">
          {/* TAB 1: المحطة الأولى (Strict Content Mode) */}
          {activeTab === 'station1' && (
            <motion.div 
              key={`page-${currentPage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Strict Mode Active Badge */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#FFD700] text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
                  <span>نظام الصفحات المتسلسل الحرفي 100% (STRICT CONTENT MODE)</span>
                </div>
                <div className="text-xs text-white/50 font-bold font-mono">
                  PAGE 0{currentPage} / 0{totalPages}
                </div>
              </div>

              {/* PAGE 1 CONTENT */}
              {currentPage === 1 && (
                <div className="space-y-6">
                  {/* Lesson Header Card */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-black/80 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-2">
                      UNIT 1 • GRAMMAR LESSON 1
                    </div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700]">
                      الماضي البسيط والماضي المستمر (Past Simple & Past Continuous)
                    </h2>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      النص مستخرج حرفياً 100% من الملزمة الوزارية المقررة للصف السادس الإعدادي.
                    </p>
                  </div>

                  {/* Section 1: Past Continuous Explanation */}
                  <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 space-y-4 backdrop-blur-xl hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-7 bg-[#FFD700] rounded-full" />
                      <h3 className="text-xl font-black text-[#FFD700]">
                        أولاً: زمن الماضي المستمر (Past Continuous)
                      </h3>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      يُستخدم زمن الماضي المستمر للتعبير عن حدث استمر لفترة معينة في الماضي. قاعدته التركيبية:
                    </p>

                    <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-center font-mono text-lg text-indigo-200 shadow-inner">
                      Subject + (was / were) + Verb-ing
                    </div>

                    <ul className="space-y-2 text-slate-300 text-sm list-disc list-inside">
                      <li>تأخذ الضمائر المفردة <strong className="text-white">(I, He, She, It)</strong> الفعل المساعد <span className="text-[#FFD700] font-bold">was</span>.</li>
                      <li>تأخذ ضمائر الجمع <strong className="text-white">(We, They, You)</strong> الفعل المساعد <span className="text-[#FFD700] font-bold">were</span>.</li>
                    </ul>

                    {/* Interactive Solution Box */}
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400">تطبيق حرفي من الملزمة:</span>
                        <button
                          onClick={() => toggleSolution('sol_p1_1')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black text-[#FFD700] border border-[#D4AF37]/30 transition active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{revealedSolutions['sol_p1_1'] ? 'إخفاء الحل' : 'انقر لإظهار الحل النموذجي'}</span>
                        </button>
                      </div>
                      <p className="text-slate-200 italic font-medium p-3 rounded-xl bg-black/30 border border-white/5">
                        "They (play) football when it began to rain."
                      </p>
                      <AnimatePresence>
                        {revealedSolutions['sol_p1_1'] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>الحل الحرفي: <strong>were playing</strong> (لأن الفاعل They جمع ويسبق When).</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 2 CONTENT */}
              {currentPage === 2 && (
                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-black/80 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-2">
                      UNIT 1 • GRAMMAR LESSON 2
                    </div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700]">
                      أدوات الربط (While, As, When, And)
                    </h2>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      القواعد النموذجية للربط بين الماضي البسيط والمستمر، مع أمثلة الامتحانات الوزارية نصاً.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 space-y-6 backdrop-blur-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Box 1 */}
                      <div className="p-5 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 space-y-2">
                        <div className="text-lg font-black text-indigo-300 flex items-center gap-2">
                          <span>قاعدة While & As</span>
                        </div>
                        <p className="text-xs text-slate-300">يأتي بعدهما حصراً ماضي مستمر:</p>
                        <div className="p-3 rounded-xl bg-black/40 text-center font-mono text-sm text-[#FFD700]">
                          While / As + Past Continuous, Past Simple
                        </div>
                      </div>

                      {/* Box 2 */}
                      <div className="p-5 rounded-2xl bg-teal-900/20 border border-teal-500/30 space-y-2">
                        <div className="text-lg font-black text-teal-300 flex items-center gap-2">
                          <span>قاعدة When & And</span>
                        </div>
                        <p className="text-xs text-slate-300">يأتي بعدهما حصراً ماضي بسيط:</p>
                        <div className="p-3 rounded-xl bg-black/40 text-center font-mono text-sm text-[#00E5FF]">
                          Past Continuous + When / And + Past Simple
                        </div>
                      </div>
                    </div>

                    {/* Interactive Solution 2 */}
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400">سؤال وزاري دور أول مكرر:</span>
                        <button
                          onClick={() => toggleSolution('sol_p2_1')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black text-[#FFD700] border border-[#D4AF37]/30 transition active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{revealedSolutions['sol_p2_1'] ? 'إخفاء الحل' : 'انقر لإظهار الحل النموذجي'}</span>
                        </button>
                      </div>
                      <p className="text-slate-200 italic font-medium p-3 rounded-xl bg-black/30 border border-white/5">
                        "A thief took our clothes while we (swim)."
                      </p>
                      <AnimatePresence>
                        {revealedSolutions['sol_p2_1'] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>الحل الحرفي: <strong>were swimming</strong> (مع مضاعفة الحرف m قبل إضافة ing).</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 3 CONTENT */}
              {currentPage === 3 && (
                <div className="space-y-6">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-black/80 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-2">
                      UNIT 1 • VOCABULARY & PHRASAL VERBS
                    </div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700]">
                      الأفعال المركبة والمفردات الوزارية (Phrasal Verbs)
                    </h2>
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                      القاعدة الثابتة لترتيب الضمائر مع حروف الجر والمفردات الأكثر شيوعاً في الأسئلة الوزارية.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-8 space-y-5 backdrop-blur-xl">
                    <h3 className="text-xl font-black text-[#FFD700] flex items-center gap-2">
                      <span>قاعدة موقع المفعول به مع الأفعال المركبة</span>
                    </h3>

                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm leading-relaxed">
                      💡 <strong>ملاحظة ذهبية:</strong> إذا كان المفعول به <strong>ضميراً (it, them)</strong>، فيجب أن يوضع دائماً <strong>بين الفعل وحرف الجر</strong> حصراً ولا يجوز وضعه بعده!
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-300">
                        ✅ صحيح: Can you <strong>turn it on</strong>?
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-rose-500/30 text-rose-300">
                        ❌ خطأ: Can you turn on it?
                      </div>
                    </div>

                    {/* Interactive Solution 3 */}
                    <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400">سؤال وزاري:</span>
                        <button
                          onClick={() => toggleSolution('sol_p3_1')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black text-[#FFD700] border border-[#D4AF37]/30 transition active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{revealedSolutions['sol_p3_1'] ? 'إخفاء الحل' : 'انقر لإظهار الحل النموذجي'}</span>
                        </button>
                      </div>
                      <p className="text-slate-200 italic font-medium p-3 rounded-xl bg-black/30 border border-white/5">
                        "Smoking is terrible. You should (give up / it)." [Put in the correct order]
                      </p>
                      <AnimatePresence>
                        {revealedSolutions['sol_p3_1'] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>الترتيب الصحيح: <strong>give it up</strong></span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. The 60-Second Challenge Big Button */}
              <div className="pt-10 flex flex-col items-center gap-4">
                <div className="h-px w-48 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                
                <button
                  onClick={startChallenge}
                  className="group relative px-12 py-5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F59E0B] text-slate-950 font-black text-2xl shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-4 overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Zap className="w-8 h-8 fill-current text-slate-950 animate-bounce" />
                  <span>⚡ ابدأ تحدي الـ 60 ثانية</span>
                </button>
                
                <p className="text-xs text-[#FFD700]/70 font-bold tracking-wider">
                  سؤالان سريعان من محتوى الصفحة الحالية لاختبار سرعة بديهتك ودقتك!
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 2: رادار الذكاء */}
          {activeTab === 'radar' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-black/80 border border-emerald-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-3 text-emerald-400 font-black text-sm mb-2">
                  <Radar className="w-5 h-5 animate-spin [animation-duration:8s]" />
                  <span>رادار الذكاء الاصطناعي الاستنتاجي</span>
                </div>
                <h2 className="text-3xl font-black text-white">
                  أسئلة استنتاجية من عمق الملزمة
                </h2>
                <p className="text-slate-300 text-sm mt-2">
                  هذه الأسئلة تقيس الاستيعاب الحقيقي للأسئلة الوزارية المعقدة وتفسيراتها الدقيقة.
                </p>
              </div>

              <div className="space-y-6">
                {radarQuestions.map((item, idx) => {
                  const isChecked = radarChecked[item.id];
                  const selectedOpt = radarAnswers[item.id];
                  return (
                    <div key={item.id} className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5 backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                          {item.tag}
                        </span>
                        <span className="text-xs font-mono text-slate-400">سؤال 0{idx + 1}</span>
                      </div>

                      <h3 className="text-xl font-bold text-white leading-relaxed">
                        {item.title}
                      </h3>

                      <div className="space-y-2.5">
                        {item.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const isCorrect = optIdx === item.correct;
                          let btnStyle = "bg-white/[0.02] border-white/10 text-slate-200 hover:bg-white/5";
                          if (isChecked) {
                            if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                            else if (isSelected) btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                          } else if (isSelected) {
                            btnStyle = "bg-indigo-500/20 border-indigo-400 text-white font-bold";
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => {
                                if (!isChecked) {
                                  setRadarAnswers(prev => ({ ...prev, [item.id]: optIdx }));
                                }
                              }}
                              className={`w-full text-right p-4 rounded-2xl border transition-all text-sm flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {isChecked && isCorrect && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                              {isChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {!isChecked ? (
                        <button
                          onClick={() => {
                            if (selectedOpt !== undefined) {
                              setRadarChecked(prev => ({ ...prev, [item.id]: true }));
                              unlockMedal('radar_master');
                            }
                          }}
                          disabled={selectedOpt === undefined}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-black text-sm transition"
                        >
                          تحقق من الإجابة
                        </button>
                      ) : (
                        <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20 text-xs text-emerald-300 font-mono leading-relaxed">
                          {item.analysis}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 3: قاعة الأبطال (Honor Hall & Ultra-HD Card) */}
          {activeTab === 'hall' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-10"
            >
              <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-black/80 border border-amber-500/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-xs font-black mb-2">
                    <Trophy className="w-4 h-4" />
                    <span>لوحة الشرف والأوسمة الرسمية</span>
                  </div>
                  <h2 className="text-3xl font-black text-white">
                    قاعة الأبطال - إنجازات {studentName}
                  </h2>
                  <p className="text-slate-300 text-sm mt-1">
                    أوسمة افتراضية تضاء مع كل إنجاز، مع إمكانية استخراج بطاقة شرف ملكية فائقة الجودة.
                  </p>
                </div>

                <button
                  onClick={handleGenerateHighResCard}
                  disabled={isGeneratingCard}
                  className="shrink-0 flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-slate-950 font-black text-base shadow-[0_0_25px_rgba(212,175,55,0.4)] transition active:scale-95 cursor-pointer"
                >
                  {isGeneratingCard ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Award className="w-5 h-5" />
                  )}
                  <span>توليد بطاقة الشرف فائقة الجودة (Ultra HD)</span>
                </button>
              </div>

              {/* Medals Showcase */}
              <div className="space-y-4">
                <h3 className="text-xl font-black text-[#FFD700] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>الأوسمة المكتسبة ({unlockedMedals.length} / 5)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'station1', title: 'وسام المحطة الأولى', desc: 'إتقان محتوى الوحدة الأولى الحرفي بنجاح.', icon: BookOpen, color: 'from-indigo-500 to-blue-600' },
                    { id: 'challenge_60s', title: 'فارس التحدي السريع', desc: 'اجتياز تحدي الـ 60 ثانية بنتيجة متقدمة.', icon: Zap, color: 'from-amber-400 to-orange-500' },
                    { id: 'radar_master', title: 'خبير رادار الذكاء', desc: 'حل الأسئلة الاستنتاجية وفك شيفراتها.', icon: Radar, color: 'from-emerald-400 to-teal-500' },
                    { id: 'idea_genius', title: 'عبقري بنك الأفكار', desc: 'تدوين ملاحظات ذكية مساهمة في التثبيت.', icon: Lightbulb, color: 'from-purple-500 to-fuchsia-600' },
                    { id: 'fast_learner', title: 'سرعة البديهة والتميز', desc: 'إكمال الدروس التتابعية بدون أخطاء.', icon: Trophy, color: 'from-yellow-400 to-amber-600' },
                  ].map((medal) => {
                    const isUnlocked = unlockedMedals.includes(medal.id);
                    const Icon = medal.icon;
                    return (
                      <div 
                        key={medal.id}
                        className={`p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden backdrop-blur-xl flex flex-col justify-between ${
                          isUnlocked 
                            ? 'bg-white/[0.04] border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.15)]' 
                            : 'bg-white/[0.01] border-white/5 opacity-40'
                        }`}
                      >
                        {isUnlocked && (
                          <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#D4AF37]/20 blur-2xl rounded-full pointer-events-none" />
                        )}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${medal.color} shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isUnlocked ? 'bg-[#FFD700]/20 text-[#FFD700]' : 'bg-white/10 text-white/40'}`}>
                              {isUnlocked ? 'مكتمل ومضاء ⚡' : 'مقفل حالياً 🔒'}
                            </span>
                          </div>
                          <h4 className="font-black text-white text-base mb-1">{medal.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{medal.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Master Honor Card (Rendered for High-Res PNG Capture) */}
              <div className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FFD700]" />
                    <span>معاينة بطاقة الشرف الملكية (Ultra HD Preview)</span>
                  </h3>
                  <span className="text-xs text-slate-400">تصدير بدقة 300+ DPI Retina</span>
                </div>

                {/* THE HONOR CARD COMPONENT */}
                <div 
                  ref={honorCardRef}
                  className="w-full aspect-[16/9] max-w-3xl mx-auto rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between text-right select-none shadow-[0_25px_70px_rgba(0,0,0,0.8)] border-[3px] border-[#D4AF37]"
                  style={{
                    background: 'radial-gradient(circle at 50% 0%, #151d38 0%, #060914 70%, #020308 100%)',
                  }}
                  dir="rtl"
                >
                  {/* Classical Islamic / Geometric Golden Watermark Background */}
                  <div 
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{
                      backgroundImage: 'radial-gradient(#FFD700 1.5px, transparent 1.5px)',
                      backgroundSize: '24px 24px'
                    }}
                  />
                  
                  {/* Subtle Inner Golden Border */}
                  <div className="absolute inset-4 rounded-[2rem] border border-[#D4AF37]/30 pointer-events-none" />

                  {/* Header Row */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img 
                        src="/logo.png" 
                        alt="بيرق" 
                        className="w-16 h-16 object-contain rounded-2xl drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]"
                      />
                      <div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700]">
                          بوابة بيرق للتعليم الذكي
                        </h2>
                        <p className="text-[11px] font-bold text-[#D4AF37] tracking-widest uppercase">
                          GATE 6 • ACADEMIC HONOR BOARD
                        </p>
                      </div>
                    </div>

                    {/* Official Certificate Badge */}
                    <div className="text-left">
                      <div className="px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] text-[#FFD700] text-xs font-black tracking-wider uppercase">
                        شهادة شرف رسمية
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">ID: G6-2026-IQ</span>
                    </div>
                  </div>

                  {/* Middle Content: Student Recognition */}
                  <div className="relative z-10 my-4 space-y-3 text-center">
                    <p className="text-sm font-bold text-[#FFD700]/80 tracking-wide">
                      تمنح إدارة بوابة بيرق هذه الشهادة التقديرية للفارس/الفارسة:
                    </p>
                    <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_15px_rgba(255,215,0,0.5)] tracking-wide">
                      {studentName}
                    </h1>
                    <p className="text-slate-300 text-xs md:text-sm max-w-lg mx-auto font-medium leading-relaxed">
                      تقديراً لتفوقها الباهر في إكمال محطات <strong>Gate 6</strong> الحرفية، واجتياز تحديات الـ 60 ثانية بدقة وسرعة استثنائية.
                    </p>
                  </div>

                  {/* Footer Row: Metrics, Stamp, Verification */}
                  <div className="relative z-10 flex items-end justify-between border-t border-[#D4AF37]/20 pt-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">الرتبة الأكاديمية</span>
                        <span className="text-sm font-black text-[#FFD700]">فارس النخبة الذهبي</span>
                      </div>
                      <div className="h-8 w-px bg-white/10" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">نسبة الدقة</span>
                        <span className="text-sm font-black text-emerald-400">100% ممتاز</span>
                      </div>
                    </div>

                    {/* Official Gold Embossed Stamp */}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#D4AF37] flex flex-col items-center justify-center text-center p-1 bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                        <ShieldCheck className="w-5 h-5 text-[#FFD700]" />
                        <span className="text-[8px] font-black text-[#FFD700] leading-tight mt-0.5">معتمد رسمياً</span>
                        <span className="text-[7px] text-slate-300">GATE 6</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: بنك الأفكار */}
          {activeTab === 'ideas' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-black/80 border border-purple-500/30 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span>دفتر الطالبة الذكية</span>
                </div>
                <h2 className="text-3xl font-black text-white">
                  بنك الأفكار والملاحظات الذهبية
                </h2>
                <p className="text-slate-300 text-sm mt-1">
                  دوني استنتاجاتكِ وقواعدكِ الخاصة أثناء دراسة الملزمة لحفظها ومراجعتها السريعة قبل الامتحانات الوزارية.
                </p>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 font-black text-white text-base">
                  <Plus className="w-5 h-5 text-purple-400" />
                  <span>إضافة فكرة أو ملاحظة جديدة</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input 
                    type="text"
                    placeholder="عنوان الملاحظة (مثلاً: ملاحظة على قاعدة As)"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="md:col-span-2 p-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-white/40 text-sm outline-none focus:border-purple-400"
                  />
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value)}
                    className="p-3.5 rounded-2xl bg-[#0A1024] border border-white/10 text-white text-sm outline-none focus:border-purple-400"
                  >
                    <option value="قواعد">قواعد (Grammar)</option>
                    <option value="مفردات">مفردات (Vocabulary)</option>
                    <option value="وزاريات">سؤال وزاري مهم</option>
                    <option value="استنتاج">استنتاج شخصي</option>
                  </select>
                </div>

                <textarea
                  placeholder="اكتبي تفاصيل الملاحظة أو الاستنتاج هنا..."
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-black/30 border border-white/10 text-white placeholder-white/40 text-sm outline-none focus:border-purple-400 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:brightness-110 text-white font-black text-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>حفظ الملاحظة في بنك الأفكار</span>
                  </button>
                </div>
              </form>

              {/* Notes Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white">الملاحظات المحفوظة ({notes.length})</h3>
                  <span className="text-xs text-slate-400">حفظ محلي آمن</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.map((note) => (
                    <div key={note.id} className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                            {note.category}
                          </span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-500 hover:text-rose-400 transition p-1"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <h4 className="font-bold text-white text-base mb-1">{note.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">{note.content}</p>
                      </div>
                      <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 font-mono">
                        {note.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: غرفة التحكم */}
          {activeTab === 'control' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900/60 via-slate-950 to-black border border-white/10 backdrop-blur-xl">
                <h2 className="text-3xl font-black text-white">غرفة التحكم والتخصيص</h2>
                <p className="text-slate-300 text-sm mt-1">تخصيص تجربة القراءة والخطوط والمؤثرات في بوابة بيرق Gate 6.</p>
              </div>

              <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-6 backdrop-blur-xl">
                {/* Student Name Edit */}
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-200">اسم الطالب/الطالبة (المعروض في لوحة الشرف):</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => {
                      setStudentName(e.target.value);
                      safeStorage.setItem('g6_student_name', e.target.value);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-white text-base font-bold outline-none focus:border-[#FFD700]"
                  />
                </div>

                {/* Font Size Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-200">حجم الخط المفضل للنصوص:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'normal', label: 'قياسي (مريح)' },
                      { id: 'large', label: 'كبير (واضح)' },
                      { id: 'xlarge', label: 'كبير جداً (مركز)' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        onClick={() => setFontSize(sz.id as any)}
                        className={`p-3 rounded-xl border text-xs font-bold transition ${
                          fontSize === sz.id 
                            ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' 
                            : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio Effects Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5">
                  <div>
                    <h4 className="font-bold text-white text-sm">المؤثرات الصوتية التفاعلية</h4>
                    <p className="text-xs text-slate-400 mt-0.5">أصوات التحدي، الفوز، وتوليد البطاقات</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                      soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {soundEnabled ? 'مفعلة' : 'معطلة'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 4. Floating Navigation Capsule (السابق | التالي) for Strict Content Mode */}
        {activeTab === 'station1' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3.5 bg-black/60 backdrop-blur-2xl border border-white/15 rounded-full flex items-center gap-6 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 bg-white/5 hover:bg-white/15 rounded-full border border-white/10 text-white transition active:scale-90 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#FFD700] font-black tracking-widest uppercase">الصفحة المستقلة</span>
              <span className="text-base font-black text-white font-mono">
                0{currentPage} / 0{totalPages}
              </span>
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2.5 bg-white/5 hover:bg-white/15 rounded-full border border-white/10 text-white transition active:scale-90 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 5. 60-Second Challenge Modal */}
        <AnimatePresence>
          {showChallenge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6"
              dir="rtl"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-2xl w-full rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-[#D4AF37]/40 p-6 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative overflow-hidden"
              >
                {/* Dynamic Timer Bar */}
                <div className="absolute top-0 inset-x-0 h-2 bg-slate-800">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700]"
                    style={{ width: `${(challengeTime / 60) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'linear' }}
                  />
                </div>

                {!challengeFinished ? (
                  <div className="space-y-6">
                    {/* Header with Countdown */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]">
                          <Zap className="w-6 h-6 text-[#FFD700] animate-bounce" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white">تحدي الـ 60 ثانية</h3>
                          <span className="text-xs text-slate-400 font-bold">
                            سؤال 0{currentChallengeQ + 1} من 0{currentChallengeData.questions.length}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-3xl md:text-4xl font-black font-mono tracking-tight drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] ${challengeTime < 15 ? 'text-rose-500 animate-pulse' : 'text-[#FFD700]'}`}>
                          {formatTime(challengeTime)}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <h4 className="text-lg font-bold text-white leading-relaxed">
                        {currentChallengeData.questions[currentChallengeQ]?.q}
                      </h4>

                      <div className="space-y-2.5">
                        {currentChallengeData.questions[currentChallengeQ]?.options.map((opt, optIndex) => {
                          const isSelected = selectedChallengeAnswers[currentChallengeQ] === optIndex;
                          return (
                            <button
                              key={optIndex}
                              onClick={() => handleSelectChallengeAnswer(currentChallengeQ, optIndex)}
                              className={`w-full text-right p-4 rounded-2xl border text-sm font-bold transition flex items-center justify-between cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]' 
                                  : 'bg-black/30 border-white/10 text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && <Check className="w-5 h-5 text-[#FFD700]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setShowChallenge(false)}
                        className="text-xs text-slate-400 hover:text-white transition"
                      >
                        إلغاء التحدي
                      </button>

                      <button
                        onClick={nextChallengeQuestion}
                        disabled={selectedChallengeAnswers[currentChallengeQ] === undefined}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 disabled:opacity-30 text-slate-950 font-black text-sm transition cursor-pointer"
                      >
                        {currentChallengeQ < currentChallengeData.questions.length - 1 ? 'السؤال التالي ⚡' : 'إنهاء التحدي واعتماد النتيجة'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Challenge Results View */
                  <div className="text-center py-6 space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                      <Trophy className="w-10 h-10 text-[#FFD700] animate-bounce" />
                    </div>

                    <div>
                      <h3 className="text-3xl font-black text-white">
                        {challengeScore >= 50 ? 'رائع جداً! تم اجتياز التحدي 🌟' : 'حاولي مرة أخرى للتفوق!'}
                      </h3>
                      <p className="text-slate-300 text-sm mt-1">
                        حصلتِ على <strong className="text-[#FFD700] text-lg font-black">{challengeScore}%</strong> في هذا التحدي السريع!
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 max-w-sm mx-auto text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-[#FFD700]">تم فتح وسام "فارس التحدي السريع" وإضافته لقاعة الأبطال!</p>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-2">
                      <button
                        onClick={() => {
                          setShowChallenge(false);
                          setActiveTab('hall');
                        }}
                        className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#F59E0B] text-slate-950 font-black text-sm transition cursor-pointer"
                      >
                        مشاهدة الوسام في قاعة الأبطال 🏆
                      </button>
                      <button
                        onClick={startChallenge}
                        className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition cursor-pointer"
                      >
                        إعادة التحدي
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. Ultra-HD Honor Card Download Modal */}
        <AnimatePresence>
          {showCardModal && cardGeneratedUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8"
              dir="rtl"
            >
              <div className="max-w-3xl w-full bg-slate-950 border border-[#D4AF37] rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2 text-[#FFD700] font-black text-base">
                    <Award className="w-5 h-5" />
                    <span>تم توليد بطاقة الشرف بدقة فائقة (Ultra HD / 300 DPI)</span>
                  </div>
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Card Image Preview */}
                <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/50 shadow-2xl">
                  <img 
                    src={cardGeneratedUrl} 
                    alt="بطاقة الشرف" 
                    className="w-full h-auto object-contain"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <button
                    onClick={handleDownloadCard}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-slate-950 font-black text-base shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>تنزيل بطاقة الشرف بصيغة PNG عالية الدقة</span>
                  </button>
                  <button
                    onClick={() => setShowCardModal(false)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition"
                  >
                    إغلاق المعاينة
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
export default Gate6;
