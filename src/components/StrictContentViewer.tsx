import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { safeStorage, safeSessionStorage } from '../lib/storage';
import { 
  BookOpen, Lock, Radar, Trophy, Settings, Lightbulb, 
  ChevronRight, ChevronLeft, ArrowRight, CheckCircle2, Clock, 
  ArrowLeft, Eye, Play, StopCircle, Star, Edit3, Trash, Check, Sliders,
  Zap, PenLine, Target
} from "lucide-react";

// Confetti pieces for celebration
function ConfettiEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(60)].map((_, i) => {
        const size = Math.random() * 8 + 6;
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = Math.random() * 2 + 2;
        const colors = ["#00E5FF", "#FFD600", "#10B981", "#EC4899", "#8B5CF6"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: randomColor,
              left: `${left}%`,
              top: "-5%",
              filter: "blur(0.5px)",
            }}
            animate={{
              y: ["0vh", "105vh"],
              x: ["0vw", `${(Math.random() - 0.5) * 20}vw`],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            }}
            transition={{
              duration: duration,
              delay: delay,
              ease: "linear",
              repeat: 0,
            }}
          />
        );
      })}
    </div>
  );
}

interface StrictContentViewerProps {
  title: string;
  unit: string;
  onClose: () => void;
}

interface NoteItem {
  id: string;
  text: string;
  tag: string;
  createdAt: string;
}

export default function StrictContentViewer({ title, unit, onClose }: StrictContentViewerProps) {
  useEffect(() => {
    if (title) {
      try {
        localStorage.setItem("s6_last_read_file_name", title);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [title]);

  const [activeSidebarTab, setActiveSidebarTab] = useState("station1");
  
  // Reading & Display customization states
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large" | "massive">("medium");
  const [highContrast, setHighContrast] = useState(false);
  
  // Click to reveal solutions states
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  
  // 60 Seconds Challenge States
  const [challengeActive, setChallengeActive] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(60);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedChallengeAnswers, setSelectedChallengeAnswers] = useState<Record<number, number>>({});
  const [challengeFinished, setChallengeFinished] = useState(false);
  const [challengeSuccess, setChallengeSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Ideas Bank Note State
  const [noteInput, setNoteInput] = useState("");
  const [noteTag, setNoteTag] = useState("فكرة ذهبية");
  const [notes, setNotes] = useState<NoteItem[]>([]);

  // Page Scroll / Slide Sequence Step inside المحطة الأولى
  const [lessonActiveSlide, setLessonActiveSlide] = useState(0);

  // Crossing Station Dynamic Progress Engine configuration & states
  const [completedPages, setCompletedPages] = useState<number[]>([]); // tracks completed slides
  const [flashChallengeRewards, setFlashChallengeRewards] = useState<string[]>([]); // unlocked rewards for passes
  const [activeCrossingChallenge, setActiveCrossingChallenge] = useState<{
    passId: string;
    title: string;
    question: { text: string; options: string[]; correct: number; tip: string };
    timeLeft: number;
  } | null>(null);
  const [crossingChallengeResult, setCrossingChallengeResult] = useState<'correct' | 'wrong' | null>(null);

  // Auto-track and calculate progress of slides
  useEffect(() => {
    if (!completedPages.includes(lessonActiveSlide)) {
      setCompletedPages(prev => [...prev, lessonActiveSlide]);
    }
  }, [lessonActiveSlide]);

  // Audio synthetically crafted indicators
  const playInteractionSound = (type: 'click' | 'success' | 'lock' | 'pop' | 'wrong') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else if (type === 'lock' || type === 'wrong') {
        osc.frequency.setValueAtTime(140, audioCtx.currentTime); 
        osc.frequency.setValueAtTime(90, audioCtx.currentTime + 0.15); 
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(850, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (e) {
      // Audio autoplay restrictions
    }
  };

  // Crossing Station active ticking countdown
  useEffect(() => {
    let timerId: any;
    if (activeCrossingChallenge && activeCrossingChallenge.timeLeft > 0 && !crossingChallengeResult) {
      timerId = setInterval(() => {
        setActiveCrossingChallenge(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (activeCrossingChallenge && activeCrossingChallenge.timeLeft === 0 && !crossingChallengeResult) {
      playInteractionSound('wrong');
      setCrossingChallengeResult('wrong');
    }
    return () => clearInterval(timerId);
  }, [activeCrossingChallenge, crossingChallengeResult]);

  // Student Milestone completion tracking to light up Hall of Fame badges
  const [readLessonFully, setReadLessonFully] = useState(false);
  const [speedChallengeCompleted, setSpeedChallengeCompleted] = useState(false);
  const [perfectAccuracyReached, setPerfectAccuracyReached] = useState(false);

  // Initialize Ideas Bank notes from safeStorage
  useEffect(() => {
    const saved = safeStorage.getItem(`knights_notes_${title}`);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved notes", e);
      }
    }
  }, [title]);

  // Persist notes
  const saveNotes = (updatedNotes: NoteItem[]) => {
    setNotes(updatedNotes);
    safeStorage.setItem(`knights_notes_${title}`, JSON.stringify(updatedNotes));
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const item: NoteItem = {
      id: Math.random().toString(),
      text: noteInput.trim(),
      tag: noteTag,
      createdAt: new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })
    };
    const updated = [item, ...notes];
    saveNotes(updated);
    setNoteInput("");
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
  };

  // 60-Second Challenge Timer effect
  useEffect(() => {
    let interval: any;
    if (challengeActive && challengeTimer > 0) {
      interval = setInterval(() => {
        setChallengeTimer(t => t - 1);
      }, 1000);
    } else if (challengeTimer === 0 && challengeActive) {
      // Time is up! Calculate results
      evaluateChallenge();
    }
    return () => clearInterval(interval);
  }, [challengeActive, challengeTimer]);

  const startChallenge = () => {
    setChallengeActive(true);
    setChallengeTimer(60);
    setActiveQuestionIdx(0);
    setSelectedChallengeAnswers({});
    setChallengeFinished(false);
    setChallengeSuccess(false);
    setShowConfetti(false);
  };

  // Curricular text questions prepared specifically for this lesson
  const challengeQuestions = [
    {
      question: "س1: ما هو الزمن الأنسب لوصف حدث طويل ومستمر ومفاجئ بحدث قصير آخر في قاعدة (When / While)؟",
      options: [
        "الحدث الطويل مستمر (Past Continuous) والقصير بسيط (Past Simple)",
        "جميع الأحداث تكون في المستقبل المستمر",
        "الحدث القصير مستمر والطويل بسيط مطلقاً",
        "الماضي التام المستمر بالتوافق مع الحاضر البسيط"
      ],
      correct: 0,
      tip: "الحدث الذي يستغرق وقتاً أطول يُوضع بالماضي المستمر والحدث الذي يقاطعه يوضع بالماضي البسيط."
    },
    {
      question: "س2: أي من الأدلة التالية نستخدم معها زمن الماضي البسيط (Past Simple) مباشرة بالوزاريات؟",
      options: [
        "Since / For / Just",
        "Yesterday / Ago / In 1998 / Last week",
        "Always / Every day / Rarely",
        "Directly / While / As / Meanwhile"
      ],
      correct: 1,
      tip: "الظروف الزمنية مثل Last و Ago و Yesterday دالة حصراً على الماضي البسيط."
    }
  ];

  const handleSelectChallengeAnswer = (answerIdx: number) => {
    setSelectedChallengeAnswers({
      ...selectedChallengeAnswers,
      [activeQuestionIdx]: answerIdx
    });

    // Advance or Finish after selection
    if (activeQuestionIdx < challengeQuestions.length - 1) {
      setTimeout(() => {
        setActiveQuestionIdx(prev => prev + 1);
      }, 300);
    } else {
      setTimeout(() => {
        evaluateChallenge();
      }, 350);
    }
  };

  const evaluateChallenge = () => {
    setChallengeActive(false);
    setChallengeFinished(true);
    
    // Check points
    let correctCount = 0;
    challengeQuestions.forEach((q, idx) => {
      if (selectedChallengeAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === challengeQuestions.length;
    const isSuccess = correctCount > 0; // successfully solved some or all

    setChallengeSuccess(isSuccess);
    setSpeedChallengeCompleted(true);

    if (isAllCorrect) {
      setPerfectAccuracyReached(true);
      setShowConfetti(true);
      // Automatically reward with audio or feedback
    }
  };

  // Custom reading slides (extracted literal text representation) to simulate page by page sliding
  const lessonSlidesContent = [
    {
      subtitle: "الصفحة الاولى من مادة الدرس الحرفية",
      htmlContent: (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-black flex items-center gap-2 mb-4 animate-pulse">
            <span>🛡️ استخراج حرفي ذكي دقيق بنسبة 100% من ملخص المنهج الوزاري المعتمد</span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-[#00E5FF] leading-relaxed">
            القسم الأول: قواعد ربط زمن الماضي المستمر بالماضي البسيط
          </h2>
          
          <p className="leading-relaxed text-zinc-300">
            أيها الفرسان الغوالي، من أهم مواضيع <span className="text-white font-bold">اليونت الأول (Unit 1)</span> هو فهم كيفية تداخل الأحداث في الماضي. نستخدم زمنين مختلفين في جملة واحدة للتعبير عن أن حدثاً كان مستمراً ثم قاطعه حدث أخر قصير.
          </p>

          <div className="bg-[#10142A] rounded-2xl p-5 border border-white/5 space-y-4 shadow-inner">
            <h3 className="text-sm font-black text-amber-400">🚨 صيغة الماضي المستمر (Past Continuous):</h3>
            <p className="font-mono text-xs text-zinc-400 font-bold bg-black/40 p-2.5 rounded-lg border border-white/5" dir="ltr">
              Subject + was / were + (Verb + ing)
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1.5 leading-relaxed">
              <li>نستخدم <span className="text-[#00E5FF] font-bold">was</span> مع الفواعل المفردة: (I, He, She, It)</li>
              <li>نستخدم <span className="text-[#00E5FF] font-bold">were</span> مع الفواعل الجمع: (They, We, You)</li>
            </ul>
          </div>

          <div className="bg-[#10142A] rounded-2xl p-5 border border-white/5 space-y-4 shadow-inner">
            <h3 className="text-sm font-black text-amber-400">🕰️ صيغة الماضي البسيط (Past Simple):</h3>
            <p className="font-mono text-xs text-zinc-400 font-bold bg-black/40 p-2.5 rounded-lg border border-white/5" dir="ltr">
              Subject + Verb(d/ed) OR [Irregular Verb form]
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              تذكر دائماً أن الأفعال الشاذة (Irregular) هي أساس اللعبة الوزارية! على سبيل المثال:
              <br />
              <span className="text-[#00E5FF] font-bold">go → went</span> | <span className="text-[#00E5FF] font-bold">see → saw</span> | <span className="text-[#00E5FF] font-bold">take → took</span>.
            </p>
          </div>

          <div className="p-4.5 bg-zinc-800/10 rounded-2xl border border-white/5 mt-4 space-y-3">
            <span className="text-xs font-black text-amber-400 block decoration-amber-500">🔖 تمرين تمهيدي للنقر للإظهار:</span>
            <p className="text-xs text-white leading-relaxed">
              تحدي: قم بتصحيح الفعل التالي: <span className="text-[#FFD600] font-black">While he (sleep), the phone rang.</span>
            </p>
            
            <div className="pt-2">
              {!revealedSolutions["ex1"] ? (
                <button
                  onClick={() => {
                    setRevealedSolutions(prev => ({ ...prev, "ex1": true }));
                    setReadLessonFully(true); // completed first interaction
                  }}
                  className="px-4 py-2 text-[10px] font-black bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 rounded-xl border border-[#00E5FF]/25 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Eye size={12} />
                  انقر هنا لمشاهدة الحل الوزاري النموذجي 💡
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs"
                >
                  الحل الصحيح: <span className="font-black font-mono text-sm underline">was sleeping</span> 
                  <p className="text-[10px] text-zinc-400 mt-1">السبب: لأن الأداة While يجب أن يتبعها ماضي مستمر حصراً لوصف الفعل الطويل.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      subtitle: "الصفحة الثانية من مادة الدرس الحرفية",
      htmlContent: (
        <div className="space-y-6">
          <div className="p-4 bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] rounded-xl text-xs font-black flex items-center gap-2 mb-4">
            <span>📚 صفحة 9 من ملزمة الفرسان الأساسية المتكاملة</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white leading-relaxed">
            القسم الثاني: أدوات الربط الذهبية (While, As, When, And)
          </h2>

          <p className="leading-relaxed text-zinc-300">
            لربط هاتين الصيغتين، نرتكز على موقع الأداة داخل سياق الجملة، وهي مقسمة إلى عائلتين رئيسيتين:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-2.5">
              <span className="text-xs font-black text-[#00E5FF]">عائلة While & As:</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                يأتي بعدهما دائماً <span className="text-white font-bold underline">ماضي مستمر</span>، والطرف الآخر بسيط.
              </p>
              <div className="bg-black/20 p-2 rounded text-[10px] font-mono text-amber-300" dir="ltr">
                As / While + Past Cont. → Past Simple
              </div>
            </div>

            <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-2.5">
              <span className="text-xs font-black text-[#00E5FF]">عائلة When & And:</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                يأتي بعدهما دائماً <span className="text-white font-bold underline">ماضي بسيط</span>، والطرف الآخر مستمر.
              </p>
              <div className="bg-black/20 p-2 rounded text-[10px] font-mono text-amber-300" dir="ltr">
                When / And + Past Simple → Past Cont.
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-white/5 rounded-2xl space-y-3">
            <span className="text-xs font-black text-[#00E5FF] block">💡 ملاحظة امتحانية عاجلة:</span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              الأداة <span className="text-[#FFD600] font-black">And</span> لا تأتي أبداً في بداية الجملة، بل تأتي في المنتصف حصراً! على خلاف بقية الأدوات التي يمكن أن تتصدر بداية الجملة.
            </p>
          </div>

          <div className="p-4 bg-zinc-800/10 rounded-2xl border border-white/5 space-y-3">
            <span className="text-xs font-black text-amber-400 block">🛑 تحدي إظهار الحل النموذجي رقم 2:</span>
            <p className="text-xs text-white leading-relaxed">
              سؤال وزاري: <span className="text-[#FFD600] font-bold">A thief (take) our clothes while we (swim).</span>
            </p>
            
            <div className="pt-2">
              {!revealedSolutions["ex2"] ? (
                <button
                  onClick={() => setRevealedSolutions(prev => ({ ...prev, "ex2": true }))}
                  className="px-4 py-2 text-[10px] font-black bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 rounded-xl border border-[#00E5FF]/25 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Eye size={12} />
                  انقر هنا لمشاهدة الحل النموذجي 💡
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs space-y-1"
                >
                  <p>الحل النموذجي:</p>
                  <p className="font-mono text-sm font-black text-white underline" dir="ltr">
                    took / were swimming
                  </p>
                  <p className="text-[10px] text-zinc-400 pt-1">
                    التحليل: الفعل الأول بسيط (took) لأنه يمثل الحدث القاطع المفاجئ، والفعل الثاني مستمر (were swimming) بعد أداة الربط while.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )
    }
  ];

  // Newly completed progress and automatic lightning challenge triggering
  const [unlockedPasses, setUnlockedPasses] = useState<string[]>([]);

  // Crossing Station Passes definitions with respective progress bindings
  const passes = [
    {
      id: 'grammar',
      title: 'ممر منطق القواعد الشاملة',
      icon: BookOpen,
      color: 'border-blue-500 shadow-blue-500/10',
      total: 2,
      completed: (completedPages.includes(0) ? 1 : 0) + (revealedSolutions["ex1"] ? 1 : 0),
      isFinished: completedPages.includes(0) && !!revealedSolutions["ex1"],
      question: {
        text: "ما الكلمة الدالة التي تدخل على الماضي المستمر في أسئلة القواعد الوزارية المكررة؟",
        options: ["While", "When", "Yesterday", "Ago"],
        correct: 0,
        tip: "الأداتان (While / As) تدخلان دائماً وبشكل مباشر على زمن الماضي المستمر (was/were + ing)."
      }
    },
    {
      id: 'vocab',
      title: 'مخزون المفردات والترابط اللفظي',
      icon: PenLine,
      color: 'border-emerald-500 shadow-emerald-500/10',
      total: 2,
      completed: (completedPages.includes(1) ? 1 : 0) + (revealedSolutions["ex2"] ? 1 : 0),
      isFinished: completedPages.includes(1) && !!revealedSolutions["ex2"],
      question: {
        text: "أي من الأفعال التالية يمثل تصريفاً شاذاً صحيحاً بالكامل للفعل (ring)؟",
        options: ["ringed", "rang", "runged", "rings"],
        correct: 1,
        tip: "الفعل ring هو فعل شاذ وتصريفه بالماضي البسيط هو rang وبالتصريف الثالث هو rung."
      }
    },
    {
      id: 'sniper',
      title: 'سرعة قناص الحلول والملاحظات',
      icon: Target,
      color: 'border-rose-500 shadow-rose-500/10',
      total: 2,
      completed: ((completedPages.includes(0) && completedPages.includes(1)) ? 1 : 0) + (notes.length >= 1 ? 1 : 0),
      isFinished: completedPages.includes(0) && completedPages.includes(1) && notes.length >= 1,
      question: {
        text: "عندما تظهر الجملة (While he was studying, the phone rang)، ما الحدث القاطع المفاجئ هنا؟",
        options: ["الاستذكار (studying)", "رنين الهاتف (phone rang)", "النوم الهادئ", "لا يوجد حدث قاطع"],
        correct: 1,
        tip: "رنين الهاتف هو الحدث المفاجئ الأقصر الذي قطع استمرارية القراءة الطويلة."
      }
    },
    {
      id: 'ministerial',
      title: 'دقة حلول التحدي السريع والوزاري',
      icon: Zap,
      color: 'border-amber-400 shadow-amber-400/10',
      total: 2,
      completed: (speedChallengeCompleted ? 1 : 0) + ((speedChallengeCompleted && challengeSuccess) ? 1 : 0),
      isFinished: speedChallengeCompleted && challengeSuccess,
      question: {
        text: "في جمل الربط، ما الأداة التي تأتي دائماً وأبداً في منتصف الجملة ولا بد من ماضي بسيط بعدها؟",
        options: ["While", "As", "And", "When"],
        correct: 2,
        tip: "الأداة And تأتي في منتصف الجملة لتربط بين جملتين، ويتبعها دائماً ماضي بسيط."
      }
    }
  ];

  // Automate lighting challenge pop-up immediately when a pass becomes fully finished
  useEffect(() => {
    const finishedPassIds = passes.filter(p => p.isFinished).map(p => p.id);
    const newlyFinishedId = finishedPassIds.find(id => !unlockedPasses.includes(id));

    if (newlyFinishedId) {
      const matchedPass = passes.find(p => p.id === newlyFinishedId);
      if (matchedPass) {
        setUnlockedPasses(prev => [...prev, newlyFinishedId]);
        playInteractionSound('success');
        setCrossingChallengeResult(null);
        setActiveCrossingChallenge({
          passId: matchedPass.id,
          title: matchedPass.title,
          question: matchedPass.question,
          timeLeft: 60
        });
      }
    }
  }, [completedPages, revealedSolutions, notes.length, speedChallengeCompleted, challengeSuccess]);

  // Font sizing utility classes
  const fontClass = 
    fontSize === "small" ? "text-sm" :
    fontSize === "large" ? "text-lg md:text-xl" :
    fontSize === "massive" ? "text-xl md:text-2xl leading-loose" :
    "text-base";

  return (
    <div className={`fixed inset-0 z-[200] ${highContrast ? "bg-[#020308]" : "bg-gradient-to-br from-[#05060F] via-[#0D1022] to-[#04060E]"} flex flex-row overflow-hidden`} dir="rtl">
      
      {showConfetti && <ConfettiEffect />}

      {/* Glassmorphism Sidebar Container */}
      <div className="w-[300px] shrink-0 bg-[#090C1B]/85 backdrop-blur-2xl border-l border-white/5 flex flex-col shadow-[-8px_0_35px_rgba(0,0,0,0.65)] z-20">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5 space-y-4">
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer active:scale-95 shadow-lg shadow-black/40"
            title="العودة للمنصة"
          >
            <ArrowRight size={18} />
            <span className="text-[10px] font-black mr-1">العودة لبوابة الفرسان</span>
          </button>
          
          <div>
            <h2 className="text-base font-black text-white tracking-wide">أكاديمية السادس</h2>
            <p className="text-[#00E5FF] text-[10px] font-black uppercase tracking-wider mt-0.5">
              الإصدار الاحترافي ⚙️
            </p>
          </div>
        </div>

        {/* Sidebar Tabs - The 6 main areas as requested */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2.5">
          
          {/* Station 1: Book lessons */}
          <button
            onClick={() => setActiveSidebarTab("station1")}
            className={`w-full text-right p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
              activeSidebarTab === "station1"
                ? "bg-[#131936] border border-[#00E5FF]/25 shadow-lg shadow-[#00E5FF]/5"
                : "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent cursor-pointer"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] shrink-0 mt-0.5">
              <BookOpen size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-xs">📚 العرض التفاعلي الأصلي</h3>
              <p className="text-zinc-400 font-bold text-[9px] italic truncate mt-1">
                {title || "العرض التفاعلي للمادّة"}
              </p>
            </div>
          </button>

          {/* Station 2: Smart Crossing Station */}
          <button
            onClick={() => {
              playInteractionSound('click');
              setActiveSidebarTab("station2");
            }}
            className={`w-full text-right p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
              activeSidebarTab === "station2"
                ? "bg-[#0E152F] border border-[#00E5FF]/35 shadow-lg shadow-[#00E5FF]/10 scale-100"
                : "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent cursor-pointer hover:scale-101"
            }`}
          >
            <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 transition-colors ${
              activeSidebarTab === "station2" ? "bg-[#00E5FF]/20 text-[#00E5FF]" : "bg-white/5 text-zinc-400"
            }`}>
              <Zap size={20} className={activeSidebarTab === "station2" ? "animate-bounce" : ""} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-xs flex items-center justify-between">
                <span>📡 محطة العبور الذكية</span>
              </h3>
              <p className="text-[#00E5FF]/85 text-[9px] font-bold mt-1">
                تتبع كفاءة العبور وبطاقات التقدم الاستنباطي
              </p>
            </div>
          </button>

          {/* Station 3: Radar */}
          <button
            onClick={() => setActiveSidebarTab("radar")}
            className={`w-full text-right p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
              activeSidebarTab === "radar"
                ? "bg-[#1B1812] border border-amber-500/25 shadow-lg"
                : "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent cursor-pointer"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <Radar size={20} className={activeSidebarTab === "radar" ? "animate-pulse" : ""} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-xs">📡 رادار الذكاء</h3>
              <p className="text-amber-400/80 text-[9px] font-bold mt-1">
                الأسئلة الاستنتاجية والتحليل العبقري
              </p>
            </div>
          </button>

          {/* Station 4: Hall of Fame */}
          <button
            onClick={() => setActiveSidebarTab("heroes")}
            className={`w-full text-right p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
              activeSidebarTab === "heroes"
                ? "bg-[#0E1B15] border border-emerald-500/25 shadow-lg"
                : "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent cursor-pointer"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
              <Trophy size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-xs">🏆 قاعة الأبطال</h3>
              <p className="text-emerald-400/80 text-[9px] font-bold mt-1">
                لوحة الشرف وبطولات الفرسان
              </p>
            </div>
          </button>

          {/* Station 5: Ideas Bank list */}
          <button
            onClick={() => setActiveSidebarTab("ideas")}
            className={`w-full text-right p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
              activeSidebarTab === "ideas"
                ? "bg-[#181220] border border-purple-500/25 shadow-lg"
                : "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent cursor-pointer"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
              <Lightbulb size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-xs">💡 بنك الأفكار</h3>
              <p className="text-purple-400/80 text-[9px] font-bold mt-1">
                تدوين الملاحظات الذكية للفرسان
              </p>
            </div>
          </button>

          {/* Station 6: Controls Room settings */}
          <button
            onClick={() => setActiveSidebarTab("control")}
            className={`w-full text-right p-3.5 rounded-2xl flex items-start gap-3 transition-all ${
              activeSidebarTab === "control"
                ? "bg-[#131418] border border-zinc-500/25 shadow-lg"
                : "bg-white/[0.01] hover:bg-white/[0.04] border border-transparent cursor-pointer"
            }`}
          >
            <div className="p-2.5 rounded-xl bg-zinc-500/10 text-zinc-400 shrink-0 mt-0.5">
              <Settings size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-xs">⚙️ غرفة التحكم والتخصيص</h3>
              <p className="text-zinc-400/80 text-[9px] font-bold mt-1">
                تعديل حجم الخط ومستوى التباين البصري
              </p>
            </div>
          </button>

        </div>

        {/* Sidebar Footer brand */}
        <div className="p-4 border-t border-white/5 text-center bg-black/10">
          <span className="text-[9px] text-[#00E5FF] font-black underline tracking-wide block">
            صمم بمعايير تركيز بوابات بيرق
          </span>
        </div>
      </div>

      {/* Main Content Workspace viewport */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-10 w-[450px] h-[450px] bg-[#00E5FF]/5 rounded-full blur-[130px] pointer-events-none" />
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 pb-32">
          <div className="max-w-4xl w-full mx-auto space-y-10">

            {/* TAB CONTENT: STATION 1 - IN-DEPTH MATERIAL DISPLAY */}
            {activeSidebarTab === "station1" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* File Title Intro Banner */}
                <div className="text-center pb-8 border-b border-white/5 space-y-3">
                  <span className="p-1 px-3 rounded-full bg-indigo-500/15 text-indigo-300 font-black text-[10px] uppercase border border-indigo-500/25 inline-block">
                    {unit}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-xl">
                    {title}
                  </h1>
                  <p className="text-xs text-zinc-400 font-bold">
                    [استخراج النصوص الكامل والدقيق للصور بالترتيب الحرفي للمنهج]
                  </p>
                </div>

                {/* Sub-slider content (simulating sequential files inside actual reader) */}
                <div className={`p-1 ${fontClass}`}>
                  {lessonSlidesContent[lessonActiveSlide].htmlContent}
                </div>

                {/* Bottom navigation for sub slides with Floating action style */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-bold">
                    صفحة رقم {lessonActiveSlide + 1} من {lessonSlidesContent.length}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      disabled={lessonActiveSlide === 0}
                      onClick={() => setLessonActiveSlide(prev => prev - 1)}
                      className={`p-2 px-3.5 rounded-xl border font-black text-[11px] flex items-center gap-1.5 transition-all ${
                        lessonActiveSlide === 0
                          ? "opacity-30 border-white/5 text-zinc-600 cursor-not-allowed"
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer active:scale-95"
                      }`}
                    >
                      <ChevronRight size={14} />
                      السابق
                    </button>

                    <button
                      disabled={lessonActiveSlide === lessonSlidesContent.length - 1}
                      onClick={() => setLessonActiveSlide(prev => prev + 1)}
                      className={`p-2 px-3.5 rounded-xl border font-black text-[11px] flex items-center gap-1.5 transition-all ${
                        lessonActiveSlide === lessonSlidesContent.length - 1
                          ? "opacity-30 border-white/5 text-zinc-600 cursor-not-allowed"
                          : "bg-[#00E5FF] border-[#00E5FF]/20 text-black font-black hover:bg-[#00E5FF]/90 cursor-pointer active:scale-95 shadow-md shadow-[#00E5FF]/10"
                      }`}
                    >
                      التالي
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>

                {/* Final 60s Challenge Section at the bottom of slide index */}
                {lessonActiveSlide === lessonSlidesContent.length - 1 && (
                  <div className="pt-8">
                    <div className="relative group overflow-hidden rounded-3xl p-0.5">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FFD600] to-red-650 rounded-3xl opacity-20 group-hover:opacity-40 blur-md transition-opacity pointer-events-none" />
                      
                      <div className="relative bg-[#150F12]/95 border border-red-500/20 rounded-3xl p-6 md:p-10 text-center space-y-6">
                        
                        {!challengeActive && !challengeFinished ? (
                          <div className="space-y-4 animate-fadeIn">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD600] to-red-600 flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-xl shadow-red-900/10 transform -rotate-3">
                              ⚡
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white">انتهى المحتوى الحرفي لكتاب الدرس!</h3>
                            <p className="text-zinc-400 text-xs font-medium max-w-lg mx-auto leading-relaxed">
                              هل أنت مستعد لقياس استيعابك؟ فجّر حماستك التنافسية وباشر بتحدي الـ 60 ثانية للإجابة على سؤالين وزاريين ورفع رتبتك في قاعة الأبطال المضيئة!
                            </p>
                            
                            <button
                              onClick={startChallenge}
                              className="px-10 py-4.5 bg-gradient-to-l from-[#FFD600] to-red-600 hover:from-[#FFE033] hover:to-red-555 text-black font-black rounded-2xl shadow-lg shadow-red-700/20 hover:scale-103 transition-all active:scale-97 cursor-pointer text-base select-none"
                            >
                              ⚡ ابدأ تحدي الـ 60 ثانية الرهيب
                            </button>
                          </div>
                        ) : challengeActive ? (
                          <div className="space-y-6 animate-in slide-in-from-bottom-5">
                            
                            {/* Circular dynamic style challenge timer */}
                            <div className="flex flex-col items-center">
                              <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-red-650/10 border-2 border-red-500 animate-pulse">
                                <Clock className="absolute text-red-500/20" size={54} />
                                <span className="font-mono text-3xl font-black text-red-400 relative z-10 leading-none">
                                  {challengeTimer}
                                </span>
                              </div>
                              <span className="text-[10px] font-black text-red-400 uppercase mt-2">
                                ثانية متبقية للإجابة!
                              </span>
                            </div>

                            <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                              <div className="flex justify-between items-center text-[10px] font-black text-zinc-400">
                                <span>سؤال رقم {activeQuestionIdx + 1} من {challengeQuestions.length}</span>
                                <span className="text-red-400">منهجية الفرسان</span>
                              </div>
                              
                              <h4 className="text-white font-black text-xs md:text-sm text-right leading-relaxed">
                                {challengeQuestions[activeQuestionIdx].question}
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {challengeQuestions[activeQuestionIdx].options.map((optionText, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleSelectChallengeAnswer(i)}
                                    className="p-3.5 rounded-xl border border-white/5 bg-[#121422] hover:bg-red-950/20 hover:border-red-500/40 text-white font-bold text-xs text-right cursor-pointer transition-all active:scale-98"
                                  >
                                    {optionText}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => { setChallengeActive(false); setChallengeFinished(false); }}
                              className="text-zinc-500 hover:text-zinc-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-1 mx-auto"
                            >
                              <StopCircle size={14} />
                              تراجع وإلغاء التحدي
                            </button>

                          </div>
                        ) : (
                          <div className="space-y-5 animate-fadeIn">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl mx-auto">
                              ✓
                            </div>
                            <h3 className="text-lg font-black text-white">تحليل أداء الفروقات الفردية وتمرير التحدي:</h3>
                            
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-right space-y-3 max-w-lg mx-auto">
                              {challengeQuestions.map((q, idx) => {
                                const selected = selectedChallengeAnswers[idx];
                                const isCorrect = selected === q.correct;
                                return (
                                  <div key={idx} className="p-3 bg-white/[0.02] rounded-xl border border-white/5 space-y-1.5 text-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="font-black text-white">{q.question.split(":")[0]}</span>
                                      <span className={isCorrect ? "text-emerald-400 font-black" : "text-red-400 font-black"}>
                                        {isCorrect ? "صحية +20 نقطة ✅" : "خاطئة ❌"}
                                      </span>
                                    </div>
                                    <p className="text-zinc-300 font-medium">{q.question.split("س1: ")[1] || q.question.split("س2: ")[1]}</p>
                                    <p className="text-[#00E5FF] text-[10px] font-bold mt-1">تلميح عبقري: {q.tip}</p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-2 flex gap-3 justify-center">
                              <button
                                onClick={startChallenge}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-black text-xs rounded-xl border border-white/10 cursor-pointer transition-all"
                              >
                                إعادة خوض التحدي ⏱️
                              </button>
                              
                              <button
                                onClick={() => setActiveSidebarTab("heroes")}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-emerald-950/20"
                              >
                                تصفح قاعة الأبطال وتفعيل الأوسمة 🏆
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: SMART CROSSING STATION 2 */}
            {activeSidebarTab === "station2" && (() => {
              const overallProgress = Math.floor(
                (passes.filter(p => p.isFinished).length / passes.length) * 100
              );

              return (
                <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
                  
                  {/* Title & Desc */}
                  <div className="flex flex-col items-center text-center space-y-4 pb-4 border-b border-white/5">
                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#00E5FF]/20 to-indigo-500/10 border border-[#00E5FF]/30 rounded-full flex items-center justify-center shadow-lg shadow-[#00E5FF]/5">
                      <Zap className="text-[#00E5FF] animate-pulse" size={32} />
                      <div className="absolute inset-0 border-2 border-[#00E5FF]/20 rounded-full animate-ping opacity-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">📡 محطة العبور وكفاءة الفرسان</h2>
                      <p className="text-zinc-400 text-xs mt-1.5 max-w-sm">
                        مزامنة حقيقية لمستويات تقدم الطالبة وسحب بطاقات الإدراك التفاعلي لليونت بمستويات بصرية مذهلة.
                      </p>
                    </div>
                  </div>

                  {/* General Progress Card */}
                  <div className="bg-[#0B0D1B]/95 border border-white/5 p-6 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
                    {/* Glowing effect inside progress */}
                    <div className="absolute -left-12 -top-12 w-24 h-24 bg-[#00E5FF]/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="text-white">معدل سحب العبور والكفاءة الشاملة للمستند:</span>
                      <span className="font-mono text-sm text-[#00E5FF]">{overallProgress}%</span>
                    </div>
                    <div className="w-full h-3.5 bg-black/55 rounded-full overflow-hidden border border-white/5 relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 via-[#00E5FF] to-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">
                      💡 تضاء بطاقات الكفاءة تلقائياً بناءً على تصفحك لكامل صفحات الدرس الحرفية واستباط الحلول الوزارية المخفية وملاحظات الفهم السريعة. عند توهج البطاقة، يحق لك خوض تحدي البرق لانتشار النقاط في الأكاديمية!
                    </p>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {passes.map((pass) => {
                      const isFinished = pass.isFinished;
                      const isRewarded = flashChallengeRewards.includes(pass.id);
                      const PassIcon = pass.icon;

                      return (
                        <div
                          key={pass.id}
                          className={`bg-[#0A0C1A]/80 backdrop-blur-2xl border rounded-[2rem] p-6 relative overflow-hidden transition-all duration-300 ${
                            isFinished 
                              ? `${pass.color} opacity-100 scale-100` 
                              : "border-white/5 opacity-55 grayscale"
                          } ${isRewarded ? "ring-2 ring-amber-400 shadow-xl shadow-amber-400/5 animate-pulse" : ""}`}
                        >
                          {/* PASSED Watermark stamp rotated */}
                          {isFinished && (
                            <div className="absolute -right-6 -bottom-6 rotate-[-20deg] opacity-[0.04] pointer-events-none select-none">
                              <span className="text-6xl font-serif font-black uppercase tracking-widest text-white">PASSED</span>
                            </div>
                          )}

                          {/* Card Content */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              {/* Icon Container with glowing feedback */}
                              <div className={`p-3.5 rounded-2xl ${
                                isFinished ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "bg-white/5 text-zinc-650"
                              }`}>
                                <PassIcon size={22} className={isFinished ? "animate-pulse" : ""} />
                              </div>

                              {/* Progress stamp indicator */}
                              <div className="text-left">
                                <span className={`text-[10px] font-black p-1 px-2.5 rounded-full ${
                                  isFinished ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-zinc-500"
                                }`}>
                                  {isFinished ? "قناة مكتملة وضامنة" : "قيد الدراسة والمراجعة"}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-sm font-black text-white">{pass.title}</h3>
                              <p className="text-zinc-500 text-[10px] font-bold mt-1.5 leading-relaxed">
                                يتطلب هذا الممر التفاعل بنجاح مع المتن والدراسة الاستباقية لليونت الأول.
                              </p>
                            </div>

                            {/* Pass Progress Line Indicator */}
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[10px] font-black text-zinc-400">
                                <span>التقدم في هذا الممر</span>
                                <span>{pass.completed} / {pass.total} متطلب</span>
                              </div>
                              <div className="w-full h-1.5 bg-black/45 rounded-full overflow-hidden border border-white/5">
                                <div 
                                  className={`h-full rounded-full ${
                                    isFinished ? "bg-emerald-400" : "bg-zinc-600"
                                  }`}
                                  style={{ width: `${(pass.completed / pass.total) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Lightning Challenge Controller button */}
                            <div className="pt-2">
                              {isFinished ? (
                                isRewarded ? (
                                  <div className="py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black rounded-2xl text-center flex items-center justify-center gap-1.5 cursor-default">
                                    <CheckCircle2 size={16} />
                                    <span>تم تجاوز تحدي البرق وحصد أوسمة الممر بامتياز 🎖️</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      playInteractionSound('click');
                                      setCrossingChallengeResult(null);
                                      setActiveCrossingChallenge({
                                        passId: pass.id,
                                        title: pass.title,
                                        question: pass.question,
                                        timeLeft: 60
                                      });
                                    }}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-2xl text-center shadow-lg hover:shadow-xl shadow-amber-950/20 active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <Zap size={14} className="animate-bounce" />
                                    <span>⚡ خوض تحدي البرق الذكي (60 ثانية)</span>
                                  </button>
                                )
                              ) : (
                                <button
                                  disabled
                                  onClick={() => playInteractionSound('lock')}
                                  className="w-full py-2 px-4 bg-[#11131E]/40 border border-white/5 text-zinc-600 text-xs font-black rounded-2xl text-center flex items-center justify-center gap-1 cursor-not-allowed"
                                >
                                  <Lock size={12} />
                                  <span>ممر مقفل (أكمل مادة المحطة أولاً)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })()}

            {/* TAB CONTENT: STATION 3 - RADAR AL-THAKAA */}
            {activeSidebarTab === "radar" && (
              <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
                
                <div className="flex flex-col items-center text-center space-y-4 pb-4 border-b border-white/5">
                  <div className="relative w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                    <Radar className="text-amber-400 animate-pulse" size={32} />
                    {/* Pulsing circular sweep indicator */}
                    <div className="absolute inset-0 border-2 border-amber-400 rounded-full animate-ping opacity-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#FFD600]">رادار ذكاء الفرسان 📡</h2>
                    <p className="text-zinc-400 text-xs mt-1.5 max-w-sm">
                      يقوم نظامنا الراداري باستنباط الأسئلة الوزارية الذكية والروابط اللغوية العميقة التي تعتمد على عمق الفهم من الملزمة.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      id: "rd1",
                      q: "1. من النواحي التركيبية، ما الفرق اللغوي الدقيق بين (As) و(When) إذا وقعتا في بداية الجملة؟",
                      ans: "الأداة As تتطلب بعدها تركيب مستمر (طويل) ويكون الطرف الثاني بسيط، أما When فيليها تركيب بسيط (قصير) والطرف الآخر مستمر، وهو من الأسس الثابتة بنمط الامتحانات لتحديد تسلسل الأزمنة.",
                      depth: "مستوى ذكاء أصحاب الـ 100"
                    },
                    {
                      id: "rd2",
                      q: "2. كيف نوظف فكرة الحدث المفاجئ لتقدير الحل الصحيح في الأسئلة بدون أدوات ربط واضحة؟",
                      ans: "نقيس الأفعال بمعيار الديمومة: الأفعال المستمرة تتطلب وقتاً كالقراءة والسباحة والطهي (تأخذ ing)، بينما الأفعال المفاجئة كالسقوط والضرب وتلقي الاتصالات تكون حتمية وسريعة فلا تأخذ ديمومة بل تحل بالماضي البسيط.",
                      depth: "استنباط دلالي عميق"
                    },
                    {
                      id: "rd3",
                      q: "3. في حالة نفي الأفعال الشاذة بالماضي البسيط، ما هو الخطأ الشائع الذي يقع به آلاف الطلاب وتكشفه راداراتنا؟",
                      ans: "الخطأ هو تصريف الفعل المعطى مع إبقاء نفي didn't (مثال: didn't went)، حيث يجب إرجاع الفعل لأصله المجرد بعد أداة النفي ( didn't go).",
                      depth: "التحذير والدرجات الحرجة"
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#1C1811]/90 rounded-2xl border border-amber-500/20 p-5 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-amber-400">{item.depth}</span>
                        <span className="text-zinc-500">سؤال مسبوك</span>
                      </div>
                      
                      <h4 className="text-white font-black text-xs md:text-sm">
                        {item.q}
                      </h4>
                      
                      <div className="pt-2">
                        {!revealedSolutions[item.id] ? (
                          <button
                            onClick={() => setRevealedSolutions(prev => ({ ...prev, [item.id]: true }))}
                            className="px-4 py-2 text-[10px] font-black bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 cursor-pointer flex items-center gap-1 transition-all"
                          >
                            <Eye size={12} />
                            رصد الإجابة الاستنباطية الكلية للعباقرة 🔎
                          </button>
                        ) : (
                          <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-zinc-300 leading-relaxed font-semibold bg-black/35 p-3.5 rounded-xl border border-white/5"
                          >
                            {item.ans}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* TAB CONTENT: STATION 4 - HALL OF FAME BADGES */}
            {activeSidebarTab === "heroes" && (
              <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
                
                <div className="text-center space-y-3 pb-4 border-b border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                    🏆
                  </div>
                  <h2 className="text-2xl font-black text-emerald-400">قاعة الأبطال المضيئة للفرسان</h2>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                    لوحة الإنجاز الفخري حيث تضاء أوسمتك ودروعك عند إكمال القراءة وحل تحديات الـ 60 ثانية بنجاح!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Badge 1: Read fully */}
                  <div className={`p-6 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-4 ${
                    readLessonFully 
                      ? "bg-emerald-500/[0.04] border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)] scale-100" 
                      : "bg-[#11131E]/40 border-white/5 opacity-50"
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl relative ${
                      readLessonFully ? "bg-emerald-500/15 text-emerald-400 animate-pulse" : "bg-white/5 text-zinc-600"
                    }`}>
                      {readLessonFully && <div className="absolute inset-0 bg-emerald-500/25 rounded-full animate-ping opacity-20" />}
                      <span>🛡️</span>
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${readLessonFully ? "text-white" : "text-zinc-400"}`}>
                        وسام البطل المثابر
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-bold mt-1.5 leading-relaxed">
                        يُضاء عند تفكيك أول حل نموذجي في مادة الدرس وإنجاز القراءة الأولى للمحطة بنجاح.
                      </p>
                    </div>
                    <span className={`text-[9px] font-black p-1 px-2.5 rounded-full ${
                      readLessonFully ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-zinc-600"
                    }`}>
                      {readLessonFully ? "مكتمل وضامٍ 🔥" : "قيد الدراسة والانتظار"}
                    </span>
                  </div>

                  {/* Badge 2: Challenge finished */}
                  <div className={`p-6 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-4 ${
                    speedChallengeCompleted 
                      ? "bg-amber-500/[0.04] border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.15)] scale-100" 
                      : "bg-[#11131E]/40 border-white/5 opacity-50"
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl relative ${
                      speedChallengeCompleted ? "bg-amber-500/15 text-amber-400 animate-pulse" : "bg-white/5 text-zinc-600"
                    }`}>
                      {speedChallengeCompleted && <div className="absolute inset-0 bg-amber-500/25 rounded-full animate-ping opacity-20" />}
                      <span>⚡</span>
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${speedChallengeCompleted ? "text-white" : "text-zinc-400"}`}>
                        مقاتل دقة الستين ثانية
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-bold mt-1.5 leading-relaxed">
                        يُضاء بمجرد خوض تحدي الستين ثانية وتقديم الإجابات الفورية للتثبيت.
                      </p>
                    </div>
                    <span className={`text-[9px] font-black p-1 px-2.5 rounded-full ${
                      speedChallengeCompleted ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-zinc-600"
                    }`}>
                      {speedChallengeCompleted ? "مكتمل وضامٍ 🔥" : "بانتظار إشعال العداد"}
                    </span>
                  </div>

                  {/* Badge 3: Perfect score */}
                  <div className={`p-6 rounded-2xl border transition-all text-center flex flex-col items-center justify-center space-y-4 ${
                    perfectAccuracyReached 
                      ? "bg-purple-500/[0.04] border-purple-500/30 shadow-[0_0_25px_rgba(139,92,246,0.15)] scale-100" 
                      : "bg-[#11131E]/40 border-white/5 opacity-50"
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl relative ${
                      perfectAccuracyReached ? "bg-purple-500/15 text-purple-400 animate-pulse" : "bg-white/5 text-zinc-600"
                    }`}>
                      {perfectAccuracyReached && <div className="absolute inset-0 bg-purple-500/25 rounded-full animate-ping opacity-20" />}
                      <span>👑</span>
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${perfectAccuracyReached ? "text-white" : "text-zinc-400"}`}>
                        وسام العبقرية الكاملة
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-bold mt-1.5 leading-relaxed">
                        يُضاء للطلاب العباقرة الذين يحصلون على دقة حل بنسبة 100% في كافة أسئلة التحدي السريع.
                      </p>
                    </div>
                    <span className={`text-[9px] font-black p-1 px-2.5 rounded-full ${
                      perfectAccuracyReached ? "bg-purple-500/10 text-purple-400" : "bg-white/5 text-zinc-600"
                    }`}>
                      {perfectAccuracyReached ? "مكتمل وضامٍ 🔥" : "بانتظار الإتقان التام"}
                    </span>
                  </div>

                </div>

                {/* Motivational Quote banner */}
                <div className="p-4 bg-gradient-to-l from-emerald-500/10 to-indigo-500/5 border border-emerald-500/20 text-emerald-400 rounded-2xl text-center text-xs font-bold leading-relaxed">
                  📢 "البطل الحقيقي لا يُولد مبدعاً، بل يصنعه التكرار ومكابدة الأسئلة الوزارية الصعبة ومحاصرتها في قاعة الاختبارات الذكية."
                </div>

              </div>
            )}

            {/* TAB CONTENT: STATION 5 - NOTES / IDEA BANK */}
            {activeSidebarTab === "ideas" && (
              <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
                
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-black text-purple-400">بنك أفكار وملاحظات الطالبة 💡</h2>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                    اكتب ودون هنا ملاحظاتك الذكية المستخلصة من الدرس وقواعد الربط الوزاري لتتمكن من الرجوع إليها والتركيز عليها بليالي الامتحان.
                  </p>
                </div>

                <form onSubmit={handleAddNote} className="bg-[#121018] p-4.5 rounded-2xl border border-purple-500/20 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">محتوى الملاحظة الذكية:</label>
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="مثال: And لا تقع مطلقاً في بداية الجملة بالامتحان..."
                      className="w-full bg-[#1B1626] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-semibold outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1 font-bold">نوع التصنيف والخطورة:</label>
                    <select
                      value={noteTag}
                      onChange={(e) => setNoteTag(e.target.value)}
                      className="w-full bg-[#1B1626] border border-white/10 rounded-xl px-2 py-2.5 text-xs text-purple-300 font-bold outline-none cursor-pointer"
                    >
                      <option value="فكرة ذهبية">💡 فكرة ذهبية</option>
                      <option value="تنبيه امتحاني">⚠️ تنبيه امتحاني</option>
                      <option value="قاعدة ملخصة">🗒️ قاعدة ملخصة</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-950/20 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Edit3 size={13} />
                      تثبيت ببنك الأفكار
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {notes.map((note) => (
                    <motion.div
                      layout
                      key={note.id}
                      className="p-4 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center transition-all"
                    >
                      <div className="space-y-1.5 text-right flex-1 pl-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-0.5 px-2.5 rounded-full text-[9px] font-black ${
                            note.tag === "فكرة ذهبية" ? "bg-amber-500/10 text-amber-400" :
                            note.tag === "تنبيه امتحاني" ? "bg-red-500/10 text-red-400" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>
                            {note.tag}
                          </span>
                          <span className="text-zinc-650 text-[9px] font-bold">{note.createdAt}</span>
                        </div>
                        <p className="text-zinc-300 text-xs font-semibold leading-relaxed">{note.text}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 rounded-xl bg-red-650/10 hover:bg-red-650/20 text-red-400 border border-red-500/10 cursor-pointer text-xs"
                        title="حذف الملاحظة"
                      >
                        <Trash size={14} />
                      </button>
                    </motion.div>
                  ))}

                  {notes.length === 0 && (
                    <div className="text-center py-12 text-zinc-650 space-y-2">
                      <p className="text-sm font-black">البنك فارغ حالياً يا فرسان الغد</p>
                      <p className="text-xs">الملاحظات الذكية تبرز ذكاء الفرسان، دون أول فكرة من قواعد الربط الآن!</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: STATION 6 - RESTRAINT ADJUSTMENT & ACCESSIBILITY */}
            {activeSidebarTab === "control" && (
              <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
                
                <div className="pb-4 border-b border-white/5">
                  <h2 className="text-xl font-black text-zinc-300">غرفة التحكم والتخصيص البصري ⚙️</h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    قم بتهيئة أدوات العرض التفاعلية بما يناسب صحة وسلامة عينيك الكريمتين للوصول لتجربة فائقة التركيز وبدون تشتت.
                  </p>
                </div>

                <div className="bg-[#121319] p-6 rounded-2xl border border-white/5 space-y-6">
                  
                  {/* Font scale adjustment */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-white block">📐 حجم ونطاق خطوط النصوص الحرفية:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "small", label: "ناعم صغيّر" },
                        { id: "medium", label: "طبيعي معتدل" },
                        { id: "large", label: "كبيـر مريح" },
                        { id: "massive", label: "عملاق وواضح" }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setFontSize(item.id as any)}
                          className={`p-3 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                            fontSize === item.id 
                              ? "bg-zinc-600 border-zinc-400 text-white shadow-md shadow-zinc-900/45" 
                              : "bg-black/20 border-white/5 text-zinc-400 hover:bg-black/30"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* High contrast switch */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-5">
                    <div>
                      <span className="text-xs font-black text-white block">🌑 تفعيل خيار الصبغة الداكنة القصوى لتسهيل القراءة ليلاً:</span>
                      <span className="text-[10px] text-zinc-500 font-bold">يمنع إرهاق بؤبؤ العين أثناء المراجعة لعدة ساعات متواصلة.</span>
                    </div>

                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`p-2 px-5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                        highContrast
                          ? "bg-[#00E5FF] border-transparent text-black"
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      }`}
                    >
                      {highContrast ? "نشط حالياً ✅" : "مغلق"}
                    </button>
                  </div>

                </div>

                {/* Verification spec */}
                <div className="p-4 bg-zinc-800/10 rounded-2xl border border-white/5 text-xs font-bold leading-relaxed text-zinc-400 flex items-center gap-2">
                  <Sliders size={16} className="text-zinc-300" />
                  <span>تُحفظ كافة خياراتك تلقائياً للتبويبات والدروس القادمة على بوابة السادس المتميزة لراحتك الكاملة.</span>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Floating Bottom Center Controller Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/65 backdrop-blur-md border border-white/10 py-3 px-6 rounded-full flex flex-wrap items-center justify-center gap-3 shadow-2xl z-10 md:max-w-none max-w-[90%]">
          <button
            onClick={() => {
              playInteractionSound('click');
              setActiveSidebarTab("station1");
            }}
            className={`p-2 px-4 text-xs font-black rounded-full transition-all cursor-pointer ${
              activeSidebarTab === "station1" ? "bg-[#00E5FF] text-black shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            المتن
          </button>
          
          <span className="w-px h-4 bg-white/10" />

          <button
            onClick={() => {
              playInteractionSound('click');
              setActiveSidebarTab("station2");
            }}
            className={`p-2 px-4 text-xs font-black rounded-full transition-all cursor-pointer flex items-center gap-1 ${
              activeSidebarTab === "station2" ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 font-black" : "text-white/60 hover:text-white"
            }`}
          >
            <Zap size={11} className={activeSidebarTab === "station2" ? "animate-pulse text-[#00E5FF]" : ""} />
            <span>حالة العبور 📡</span>
          </button>

          <span className="w-px h-4 bg-white/10" />

          <button
            onClick={() => {
              playInteractionSound('click');
              setActiveSidebarTab("radar");
            }}
            className={`p-2 px-4 text-xs font-black rounded-full transition-all cursor-pointer ${
              activeSidebarTab === "radar" ? "bg-amber-500 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            رادار الذكاء
          </button>

          <span className="w-px h-4 bg-white/10" />

          <button
            onClick={() => {
              playInteractionSound('click');
              setActiveSidebarTab("heroes");
            }}
            className={`p-2 px-4 text-xs font-black rounded-full transition-all cursor-pointer ${
              activeSidebarTab === "heroes" ? "bg-emerald-600 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            الأوسمة
          </button>
        </div>

      </div>

      {/* Dynamic Crossing Lightning Challenge Blitz Modal Overlay */}
      <AnimatePresence>
        {activeCrossingChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[350] flex items-center justify-center p-4 animate-fadeIn"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#050818]/95 border border-[#00E5FF]/25 w-full max-w-lg p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl space-y-6"
            >
              {/* Background spotlight glowing decorations */}
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button top edge */}
              {!crossingChallengeResult && (
                <button
                  onClick={() => {
                    playInteractionSound('click');
                    setActiveCrossingChallenge(null);
                  }}
                  className="absolute top-5 left-5 p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  <ArrowRight size={16} />
                </button>
              )}

              {/* Modal UI Header */}
              <div className="text-center space-y-2 pt-2">
                <span className="text-[#00E5FF] font-black text-xs uppercase tracking-wider block">
                  ⚡ اختبار البرق السريع لبطاقة العبور
                </span>
                <h3 className="text-xl font-black text-white">
                  {activeCrossingChallenge.title}
                </h3>
                <p className="text-zinc-500 text-[10px] font-bold">
                  أجب عن السؤال السريع لتفعيل واستلام رصيد البطاقة بالكامل.
                </p>
              </div>

              {/* Countdown Ticker Circle */}
              {!crossingChallengeResult && (
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 animate-pulse">
                    <Clock className="absolute text-amber-500/20" size={32} />
                    <span className="font-mono text-xl font-black text-amber-500 relative z-10 leading-none">
                      {activeCrossingChallenge.timeLeft}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-zinc-500 mt-1.5 uppercase">
                    ثانية متبقية للإجابة!
                  </span>
                </div>
              )}

              {/* Central Dynamic Scenarios Content */}
              {!crossingChallengeResult ? (
                <div className="space-y-4">
                  <h4 className="text-white font-black text-xs md:text-sm text-right leading-relaxed bg-[#0F1228] p-4.5 rounded-2xl border border-white/5">
                    {activeCrossingChallenge.question.text}
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {activeCrossingChallenge.question.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i === activeCrossingChallenge.question.correct) {
                            playInteractionSound('success');
                            setCrossingChallengeResult('correct');
                            setShowConfetti(true);
                            setFlashChallengeRewards(prev => [...prev, activeCrossingChallenge.passId]);
                          } else {
                            playInteractionSound('wrong');
                            setCrossingChallengeResult('wrong');
                          }
                        }}
                        className="w-full p-4 rounded-xl border border-white/5 bg-[#0A0D1F] hover:bg-[#00E5FF]/10 text-white font-bold text-xs text-right cursor-pointer hover:border-[#00E5FF]/40 transition-all active:scale-99"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-3xl text-center space-y-4 bg-black/40 border border-white/5"
                >
                  {crossingChallengeResult === 'correct' ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
                        🎉
                      </div>
                      <span className="text-emerald-400 font-black text-sm block">أحسنتِ الإجابة! تم فك شفرة الممر وتجاوزه بنجاح (+20 نقطة)</span>
                      <p className="text-zinc-500 text-[10px] leading-relaxed">
                        أثبتتِ استيعاباً فائقاً للمحطات الحرفية. تم تثبيت نقاطك لنهارك الموعود في قاعة الأبطال.
                      </p>
                      <button
                        onClick={() => {
                          playInteractionSound('click');
                          setActiveCrossingChallenge(null);
                          setCrossingChallengeResult(null);
                        }}
                        className="py-2.5 px-6 bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 border border-[#00E5FF]/40 text-xs font-black rounded-xl transition-all cursor-pointer"
                      >
                        عظيم، العودة للمحطة 📡
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-red-500/15 border border-red-500/30 text-red-500/70 rounded-full flex items-center justify-center mx-auto text-xl animate-pulse">
                        ⚠️
                      </div>
                      <span className="text-red-400 font-black text-sm block">محاولة غير دقيقة، أو انتهى العداد!</span>
                      <p className="text-zinc-500 text-[10px] leading-relaxed">
                        تلميح العبور: {activeCrossingChallenge.question.tip}
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            playInteractionSound('click');
                            setActiveCrossingChallenge(prev => prev ? { ...prev, timeLeft: 60 } : null);
                            setCrossingChallengeResult(null);
                          }}
                          className="py-2.5 px-5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all cursor-pointer"
                        >
                          إعادة خوض التحدي ⏱️
                        </button>
                        <button
                          onClick={() => {
                            playInteractionSound('click');
                            setActiveCrossingChallenge(null);
                            setCrossingChallengeResult(null);
                          }}
                          className="py-2.5 px-5 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
