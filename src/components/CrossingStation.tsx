import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, BookOpen, PenLine, Target, CheckCircle2, X, Clock } from 'lucide-react';
import { UserProgress, PageContent, AppSettings, Question } from '../types';
import { translations } from '../lib/translations';

interface CrossingStationProps {
  unitId: number;
  unitPages: PageContent[];
  progress: UserProgress;
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  settings: AppSettings;
}

export const CrossingStation: React.FC<CrossingStationProps> = ({ unitId, unitPages, progress, setProgress, settings }) => {
  const t = translations[settings.language];
  const [showModal, setShowModal] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<{ passId: string, question: Question, timeLeft: number } | null>(null);
  const [challengeResult, setChallengeResult] = useState<'correct' | 'wrong' | null>(null);

  // Mapping for Unit 1 topics (based on user request)
  const PASS_MAPPING = {
    grammar: [1, 3, 9, 11, 12, 17, 18, 21, 22, 24, 25, 31, 37, 38],
    vocab: [2, 5, 6, 7, 10, 13, 14, 15, 19, 20, 27, 28],
    sniper: [16, 35, 44, 45, 46, 47, 49, 50],
    ministerial: [8, 29, 30, 32, 51, 52]
  };

  const passes = [
    { id: 'grammar', title: t.grammarLogicPass, icon: BookOpen, color: 'border-blue-500', topics: PASS_MAPPING.grammar },
    { id: 'vocab', title: t.vocabStock, icon: PenLine, color: 'border-emerald-500', topics: PASS_MAPPING.vocab },
    { id: 'sniper', title: t.textSniper, icon: Target, color: 'border-rose-500', topics: PASS_MAPPING.sniper },
    { id: 'ministerial', title: t.ministerialEssay, icon: Zap, color: 'border-gold', topics: PASS_MAPPING.ministerial },
  ];

  const getPassProgress = (topics: number[]) => {
    const completed = topics.filter(id => progress.completedPages.includes(id));
    return {
      completed: completed.length,
      total: topics.length,
      isFinished: completed.length === topics.length
    };
  };

  // Get a ministerial question for a pass
  const getMinisterialQuestion = (passId: string): Question => {
    const allQuestions = unitPages.flatMap(p => p.questions || []);
    // In a real app, we'd map questions to passes. For now, pick a random one.
    return allQuestions[Math.floor(Math.random() * allQuestions.length)] || { id: 0, text: "سؤال وزاري تجريبي؟", options: ["أ", "ب", "ج", "د"], correctAnswer: 0 };
  };

  const startChallenge = (passId: string) => {
    setActiveChallenge({
      passId,
      question: getMinisterialQuestion(passId),
      timeLeft: 60
    });
    setChallengeResult(null);
  };

  useEffect(() => {
    if (activeChallenge && activeChallenge.timeLeft > 0 && !challengeResult) {
      const timer = setInterval(() => {
        setActiveChallenge(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeChallenge, challengeResult]);

  const handleAnswer = (optionIdx: number) => {
    if (optionIdx === activeChallenge?.question.correctAnswer) {
      setChallengeResult('correct');
      setProgress(prev => ({ ...prev, flashChallengeRewards: [...prev.flashChallengeRewards, activeChallenge.passId] }));
    } else {
      setChallengeResult('wrong');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {passes.map((pass, index) => {
          const { completed, total, isFinished } = getPassProgress(pass.topics);
          const isRewarded = progress.flashChallengeRewards.includes(pass.id);
          return (
            <motion.div
              key={pass.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-[#0c0c14]/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 relative overflow-hidden ${isFinished ? `${pass.color} shadow-2xl opacity-100 grayscale-0` : 'opacity-70 grayscale'} transition-all ${isRewarded ? 'ring-2 ring-gold animate-pulse' : ''}`}
            >
              {/* Passport Watermark */}
              {isFinished && (
                <div className="absolute -right-6 -bottom-6 rotate-[-20deg] opacity-10 pointer-events-none select-none">
                  <span className="text-6xl font-serif font-bold uppercase tracking-widest text-white">PASSED</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-xl bg-white/5 ${isFinished ? 'text-theme-primary' : 'text-white/40'}`}>
                  <pass.icon size={24} />
                </div>
                {isFinished && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-gold animate-pulse"
                  >
                    <CheckCircle2 size={28} className="drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
                  </motion.div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">{pass.title}</h3>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(completed / total) * 100}%` }}
                  className={`h-full ${isFinished ? 'bg-theme-primary' : 'bg-white/40'}`}
                />
              </div>
              <p className={`text-sm font-black mt-2 relative z-10 ${isFinished ? 'text-theme-primary' : 'text-white/40'}`}>
                {completed} / {total} {t.page}
              </p>
              {isFinished && (
                <button 
                  onClick={() => startChallenge(pass.id)}
                  className="mt-4 w-full py-2 rounded-xl bg-theme-primary text-black font-bold hover:scale-[1.02] transition-transform"
                >
                  تحدي البرق
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeChallenge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-[#0c0c14]/40 backdrop-blur-xl border-2 border-white/10 rounded-[2.5rem] p-8 w-full max-w-lg text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <div className="relative z-10 flex justify-between items-center">
                <h3 className="text-2xl font-bold">تحدي البرق</h3>
                <div className="flex items-center gap-2 text-gold">
                  <Clock size={20} />
                  <span className="font-mono text-xl">{activeChallenge.timeLeft}</span>
                </div>
              </div>
              
              {!challengeResult ? (
                <>
                  <p className="text-xl">{activeChallenge.question.text}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {activeChallenge.question.options.map((opt, i) => (
                      <button key={`${opt}-${i}`} onClick={() => handleAnswer(i)} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-lg">
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {challengeResult === 'correct' ? (
                    <>
                      <CheckCircle2 size={64} className="text-gold mx-auto" />
                      <p className="text-2xl font-bold text-gold">أحسنت! إجابة صحيحة ومبهرة.</p>
                    </>
                  ) : (
                    <>
                      <X size={64} className="text-rose-500 mx-auto" />
                      <p className="text-2xl font-bold text-rose-500">لا بأس، كل محاولة تقربك من القمة. حاول مرة أخرى!</p>
                    </>
                  )}
                  <button onClick={() => setActiveChallenge(null)} className="neon-button w-full py-3">
                    {t.close}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
