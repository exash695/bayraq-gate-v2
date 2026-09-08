import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Lock, CheckCircle2, Clock, Check, ArrowLeft, X, AlertCircle } from 'lucide-react';
import { TopicPass, MinisterialQuestion } from './types';
import { sounds } from '../../lib/sounds';

interface TopicPassesStationProps {
  topicPasses: TopicPass[];
  completedPages: number[];
  currentPageIndex: number;
  totalPages: number;
  overallEfficiency: number;
  onJumpToPage: (pageIndex: number) => void;
  onRewardPass: (passId: string) => void;
  rewardedPassIds: string[];
}

export const TopicPassesStation: React.FC<TopicPassesStationProps> = ({
  topicPasses,
  completedPages,
  currentPageIndex,
  totalPages,
  overallEfficiency,
  onJumpToPage,
  onRewardPass,
  rewardedPassIds
}) => {
  const [activeChallenge, setActiveChallenge] = useState<{
    pass: TopicPass;
    questionIdx: number;
    timeLeft: number;
    userAnswers: Record<number, number>;
  } | null>(null);

  const [challengeResult, setChallengeResult] = useState<'success' | 'failed' | null>(null);

  // Countdown timer for Active Lightning Challenge
  useEffect(() => {
    let timer: any;
    if (activeChallenge && activeChallenge.timeLeft > 0 && !challengeResult) {
      timer = setInterval(() => {
        setActiveChallenge(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
      }, 1000);
    } else if (activeChallenge && activeChallenge.timeLeft === 0 && !challengeResult) {
      setChallengeResult('failed');
      try { sounds.playError(); } catch (e) {}
    }
    return () => clearInterval(timer);
  }, [activeChallenge, challengeResult]);

  const startLightningChallenge = (pass: TopicPass) => {
    setActiveChallenge({
      pass,
      questionIdx: 0,
      timeLeft: 60,
      userAnswers: {}
    });
    setChallengeResult(null);
    try { sounds.playClick(); } catch (e) {}
  };

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    if (!activeChallenge) return;
    const updatedAnswers = { ...activeChallenge.userAnswers, [qIdx]: optIdx };
    const currentQ = activeChallenge.pass.ministerialQuestions[qIdx];
    const isCorrect = optIdx === currentQ?.correct;

    if (isCorrect) {
      try { sounds.playPop(); } catch (e) {}
    }

    if (qIdx < activeChallenge.pass.ministerialQuestions.length - 1) {
      setTimeout(() => {
        setActiveChallenge(prev => prev ? {
          ...prev,
          questionIdx: prev.questionIdx + 1,
          userAnswers: updatedAnswers
        } : null);
      }, 350);
    } else {
      // Finished all questions for this topic pass!
      setTimeout(() => {
        // Calculate score
        let correctCount = 0;
        activeChallenge.pass.ministerialQuestions.forEach((q, i) => {
          if (updatedAnswers[i] === q.correct) correctCount++;
        });

        if (correctCount >= Math.ceil(activeChallenge.pass.ministerialQuestions.length * 0.5)) {
          setChallengeResult('success');
          onRewardPass(activeChallenge.pass.id);
          try { sounds.playSuccess(); } catch (e) {}
        } else {
          setChallengeResult('failed');
          try { sounds.playError(); } catch (e) {}
        }
      }, 400);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#0C1127]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 pb-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Zap className="text-[#00E5FF]" size={24} />
              <span>محطة بطاقات العبور لموضوعات الملف</span>
            </h2>
            <p className="text-white/60 text-xs mt-1">
              مصنفة حسب موضوعات وصفحات الملزمة — اضغط على أي رقم صفحة للانتقال إليها مباشرةً وإنجازها.
            </p>
          </div>

          <div className="px-4 py-2 bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-2xl text-center">
            <span className="text-[10px] text-white/50 block font-bold">الموضوعات المنجزة</span>
            <span className="text-base font-black text-[#00E5FF] font-mono">
              {topicPasses.filter(t => t.isFinished).length} من {topicPasses.length}
            </span>
          </div>
        </div>

        {/* General Progress Card */}
        <div className="bg-[#070A18]/90 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-black">
            <span className="text-white">إجمالي الصفحات المنجزة في الملف:</span>
            <span className="font-mono text-sm text-[#00E5FF]">
              {completedPages.length} من أصل {totalPages} صفحات ({overallEfficiency}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-[#00E5FF] to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${overallEfficiency}%` }}
            />
          </div>
        </div>

        {/* Topic Passes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {topicPasses.map((pass, passIdx) => {
            const isFinished = pass.isFinished;
            const isRewarded = rewardedPassIds.includes(pass.id);
            const progressPct = Math.round((pass.completedCount / pass.totalCount) * 100);

            return (
              <div
                key={pass.id}
                className={`bg-[#080B1C] border rounded-3xl p-5 space-y-4 transition-all relative overflow-hidden ${
                  isFinished 
                    ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
                    : 'border-white/10 hover:border-amber-400/30'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-400 font-mono font-bold block">
                      بطاقة الموضوع {passIdx + 1}
                    </span>
                    <h3 className="font-black text-sm text-white leading-snug">
                      {pass.topicTitle}
                    </h3>
                    <span className="text-[10px] text-indigo-300/80 block">
                      {pass.unit}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                    isFinished 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {isFinished ? 'مكتمل بالكامل ✅' : `${pass.remainingCount} متبقية`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-white/60">
                    <span>الصفحات المنجزة: {pass.completedCount} من {pass.totalCount}</span>
                    <span className="font-mono text-[#00E5FF]">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isFinished ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-white/50 block font-bold">
                    صفحات هذا الموضوع (انقر للانتقال مباشرة):
                  </span>
                  
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {pass.pageIndices.map((pIdx) => {
                      const isPageDone = completedPages.includes(pIdx);
                      const isCurrentPage = currentPageIndex === pIdx;

                      return (
                        <button
                          key={pIdx}
                          onClick={() => onJumpToPage(pIdx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            isCurrentPage
                              ? 'bg-[#00E5FF] text-black ring-2 ring-[#00E5FF]/40 shadow'
                              : isPageDone
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 animate-pulse'
                          }`}
                          title={`انتقل إلى الصفحة ${pIdx + 1} (${isPageDone ? 'منجزة' : 'غير منجزة - انقر لإنجازها'})`}
                        >
                          <span>صفحة {pIdx + 1}</span>
                          {isPageDone ? <Check size={12} /> : <ArrowLeft size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lightning Challenge Action */}
                <div className="pt-2">
                  {isFinished ? (
                    isRewarded ? (
                      <div className="py-2.5 px-3 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={15} />
                        <span>تم اجتياز تحدي البرق الوزاري لهذا الموضوع 🎖️</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => startLightningChallenge(pass)}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-black rounded-xl text-center shadow-md active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap size={14} className="animate-bounce" />
                        <span>⚡ خوض تحدي البرق الوزاري (من أسئلة الموضوع حصراً)</span>
                      </button>
                    )
                  ) : (
                    <div className="py-2 px-3 bg-white/5 border border-white/5 text-white/40 text-[10px] font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                      <Lock size={12} />
                      <span>أكمل تصفح صفحات الموضوع أعلاه لفتح التحدي الوزاري</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Active Lightning Challenge Modal Dialog */}
      <AnimatePresence>
        {activeChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[350] flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#070A1C]/95 border border-[#00E5FF]/30 w-full max-w-lg p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl space-y-6 text-right"
            >
              {!challengeResult && (
                <button
                  onClick={() => setActiveChallenge(null)}
                  className="absolute top-5 left-5 p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-all cursor-pointer border border-white/5"
                >
                  <X size={16} />
                </button>
              )}

              {/* Header */}
              <div className="text-center space-y-1 pt-1">
                <span className="text-[#00E5FF] font-black text-xs uppercase tracking-wider block">
                  ⚡ تحدي البرق الوزاري الحصري لموضوع:
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {activeChallenge.pass.topicTitle}
                </h3>
                <p className="text-white/50 text-[10px] font-bold">
                  أسئلة وزارية مأخوذة حصراً من صفحات هذا الموضوع داخل الملف!
                </p>
              </div>

              {/* Timer */}
              {!challengeResult && (
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 animate-pulse">
                    <Clock className="absolute text-amber-500/20" size={32} />
                    <span className="font-mono text-xl font-black text-amber-400 relative z-10 leading-none">
                      {activeChallenge.timeLeft}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-white/40 mt-1 uppercase">
                    ثانية متبقية للإجابة!
                  </span>
                </div>
              )}

              {/* Questions or Results */}
              {!challengeResult ? (
                <div className="space-y-4">
                  {activeChallenge.pass.ministerialQuestions[activeChallenge.questionIdx] && (
                    <>
                      <div className="bg-[#0F142D] p-4 rounded-2xl border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold mb-1">
                          <span>سؤال وزاري من صفحة {activeChallenge.pass.ministerialQuestions[activeChallenge.questionIdx].pageNumber}</span>
                          <span>السؤال {activeChallenge.questionIdx + 1} من {activeChallenge.pass.ministerialQuestions.length}</span>
                        </div>
                        <h4 className="text-white font-black text-xs sm:text-sm leading-relaxed">
                          {activeChallenge.pass.ministerialQuestions[activeChallenge.questionIdx].questionText}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {activeChallenge.pass.ministerialQuestions[activeChallenge.questionIdx].options.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectAnswer(activeChallenge.questionIdx, oIdx)}
                            className="w-full p-3.5 rounded-xl border border-white/10 bg-[#090C1F] hover:bg-[#00E5FF]/10 text-white font-bold text-xs text-right cursor-pointer hover:border-[#00E5FF]/40 transition-all active:scale-98"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 py-2">
                  {challengeResult === 'success' ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce">
                        🏆
                      </div>
                      <h4 className="text-emerald-400 font-black text-base">
                        مبارك! اجتزتِ تحدي البرق الوزاري لهذا الموضوع بنجاح
                      </h4>
                      <p className="text-white/60 text-xs">
                        تم تثبيت تفوقك واستيعابك الحرفي للأسئلة الوزارية المقررة في هذا الموضوع.
                      </p>
                      <button
                        onClick={() => setActiveChallenge(null)}
                        className="py-3 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg"
                      >
                        تم بنجاح، العودة للبطاقات ✅
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto text-2xl animate-pulse">
                        ⚠️
                      </div>
                      <h4 className="text-rose-400 font-black text-base">
                        انتهى الوقت أو لم تطابق الإجابات الوزارية!
                      </h4>
                      <p className="text-white/60 text-xs">
                        يمكنك مراجعة صفحات هذا الموضوع مرة أخرى وخوض التحدي مجدداً.
                      </p>
                      <div className="flex gap-2 justify-center pt-2">
                        <button
                          onClick={() => startLightningChallenge(activeChallenge.pass)}
                          className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl cursor-pointer"
                        >
                          إعادة المحاولة ⏱️
                        </button>
                        <button
                          onClick={() => setActiveChallenge(null)}
                          className="py-2.5 px-5 bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
