import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Zap, Trophy, X, ChevronLeft, Brain, Target, AlertCircle } from 'lucide-react';
import { Question, UserProgress } from '../types';
import { translations } from '../lib/translations';
import { updatePoints } from '../lib/pointsEngine';
import { auth } from '../lib/firebase';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  pageTitle: string;
  unitId?: number;
  setProgress?: React.Dispatch<React.SetStateAction<UserProgress>>;
  onAwardBadge?: (badgeId: string) => void;
  language?: 'ar' | 'en';
}

type Difficulty = 'easy' | 'hard';
type GameState = 'difficulty-selection' | 'playing' | 'results';

export const ChallengeModal = ({ 
  isOpen, 
  onClose, 
  questions, 
  pageTitle, 
  unitId,
  setProgress, 
  onAwardBadge,
  language = 'ar'
}: ChallengeModalProps) => {
  const t = translations[language];
  const [gameState, setGameState] = useState<GameState>('difficulty-selection');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Shuffle and select 6 questions filtered by unitId
  const prepareChallenge = useCallback((diff: Difficulty) => {
    // Filter by unitId AND difficulty
    const filtered = questions.filter(q => 
      q.unitId === unitId && 
      (!q.difficulty || q.difficulty === diff)
    );
    
    // Fallback if not enough questions for this unit
    const pool = filtered.length >= 6 ? filtered : questions.filter(q => q.unitId === unitId);
    
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setCurrentQuestions(shuffled.slice(0, 6));
    setDifficulty(diff);
    setGameState('playing');
    setTimeLeft(60);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowExplanation(false);
  }, [questions, unitId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('results');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleAnswer = (optionIndex: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(optionIndex);
    const correct = optionIndex === currentQuestions[currentIndex].correctAnswer;
    setIsCorrect(correct);
    const finalScore = score + (correct ? 1 : 0);
    if (correct) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentIndex < currentQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setShowExplanation(false);
      } else {
        setGameState('results');
        
        // Update points in Firestore with difficulty multiplier
        if (auth.currentUser && finalScore > 0) {
          const multiplier = difficulty === 'hard' ? 2 : 1;
          const pointsEarned = finalScore * 10 * multiplier;
          updatePoints(auth.currentUser.uid, pointsEarned, 'challenge_completion');
        }

        // Check for perfect score badge
        if (finalScore === currentQuestions.length) {
          if (setProgress) {
            setProgress(prev => ({
              ...prev,
              examResults: [...prev.examResults] // Trigger badge check
            }));
          }
          
          if (onAwardBadge) {
            // Logic for specialized badges
            const title = pageTitle.toLowerCase();
            const isSniper = title.includes('قطعة') || title.includes('استيعابية') || title.includes('reading') || title.includes('comprehension');
            const isDictionary = title.includes('إسقاطات') || title.includes('مرادفات') || title.includes('vocab') || title.includes('synonym');
            const isMemory = title.includes('إنشاء') || title.includes('أدب') || title.includes('writing') || title.includes('literature');

            // Find unit number from page title or context (using a simple heuristic for now)
            // In a real app, we'd pass unitId explicitly
            if (isSniper) onAwardBadge('unit-1-sniper');
            if (isDictionary) onAwardBadge('unit-1-dictionary');
            if (isMemory) onAwardBadge('unit-1-memory');
          }
        }
      }
    }, 1500);
  };

  const getFeedbackMessage = () => {
    if (language === 'ar') {
      if (score === 6) return "أسطوري! 🔥 حصلت على الدرجة الكاملة، أنت الآن بطل الوحدة!";
      if (score >= 4) return `رائع جداً! ✨ نتيجتك (${score}/6)، استمر هكذا وستصل للقمة.`;
      if (score === 3) return "جيد، نتيجتك (3/6). مراجعة سريعة للملاحظات وستتحسن بالتأكيد! 👍";
      return "لا بأس، المحاولة هي طريق النجاح. أعد قراءة 'المسار الشامل' وحاول مجدداً! 💪";
    } else {
      if (score === 6) return "Legendary! 🔥 Perfect score, you are now the unit champion!";
      if (score >= 4) return `Great job! ✨ Your score (${score}/6), keep it up and you'll reach the top.`;
      if (score === 3) return "Good, your score (3/6). A quick review and you'll definitely improve! 👍";
      return "It's okay, trying is the way to success. Re-read the 'Comprehensive Path' and try again! 💪";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-2xl overflow-hidden relative border-theme-primary/30"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-primary/20 flex items-center justify-center text-theme-primary">
              <Zap className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-xl neon-text">{t.challengeTitle}</h3>
              <p className="text-xs text-white/40">{pageTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {gameState === 'difficulty-selection' && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 text-center"
              >
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold">{language === 'ar' ? 'جاهزة للتحدي؟' : 'Ready for the Challenge?'}</h4>
                  <p className="text-white/60">{language === 'ar' ? 'اختاري مستوى الصعوبة للبدء' : 'Choose difficulty to start'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => prepareChallenge('easy')}
                    className={`group p-6 glass-card border-emerald-500/30 hover:bg-emerald-500/10 transition-all ${language === 'ar' ? 'text-right' : 'text-left'} relative overflow-hidden`}
                  >
                    <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1 h-full bg-emerald-500`} />
                    <Brain className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="text-xl font-bold text-emerald-500 mb-1">{language === 'ar' ? 'تحدي سهل' : 'Easy Challenge'}</h5>
                    <p className="text-sm text-white/40">{language === 'ar' ? 'أسئلة مباشرة للمراجعة السريعة' : 'Direct questions for quick review'}</p>
                  </button>

                  <button 
                    onClick={() => prepareChallenge('hard')}
                    className={`group p-6 glass-card border-rose-500/30 hover:bg-rose-500/10 transition-all ${language === 'ar' ? 'text-right' : 'text-left'} relative overflow-hidden`}
                  >
                    <div className={`absolute top-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1 h-full bg-rose-500`} />
                    <Target className="text-rose-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="text-xl font-bold text-rose-500 mb-1">{language === 'ar' ? 'تحدي صعب' : 'Hard Challenge'}</h5>
                    <p className="text-sm text-white/40">{language === 'ar' ? 'أسئلة استنتاجية ووزارية دقيقة' : 'Inference and ministerial questions'}</p>
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === 'playing' && currentQuestions.length === 0 && (
              <motion.div 
                key="no-questions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 space-y-4"
              >
                <AlertCircle size={64} className="mx-auto text-white/20" />
                <h4 className="text-xl font-bold">{language === 'ar' ? 'عذراً، لا توجد أسئلة لهذا التحدي حالياً' : 'Sorry, no questions for this challenge yet'}</h4>
                <p className="text-white/40">{language === 'ar' ? 'سيتم إضافة الأسئلة الخاصة بهذه الصفحة قريباً في التحديث القادم' : 'Questions for this page will be added soon in the next update'}</p>
                <button 
                  onClick={onClose}
                  className="mt-4 px-8 py-3 glass-card border-white/10 hover:bg-white/5 transition-all font-bold"
                >
                  {language === 'ar' ? 'العودة للملزمة' : 'Back to Curriculum'}
                </button>
              </motion.div>
            )}

            {gameState === 'playing' && currentQuestions.length > 0 && (
              <motion.div 
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 glass-card border-theme-primary/20 rounded-full">
                      <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-rose-500 animate-bounce' : 'text-theme-primary'}`} />
                      <span className={`font-mono text-xl font-bold ${timeLeft <= 10 ? 'text-rose-500' : ''}`}>
                        {timeLeft}s
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white/40">
                      {language === 'ar' ? `السؤال ${currentIndex + 1} من ${currentQuestions.length}` : `Question ${currentIndex + 1} of ${currentQuestions.length}`}
                    </div>
                  </div>
                  <div className="text-theme-primary font-bold">
                    {t.score}: {score}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}
                    className="h-full bg-theme-primary shadow-[0_0_10px_var(--theme-glow)]"
                  />
                </div>

                {/* Question */}
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold leading-relaxed">
                    {currentQuestions[currentIndex].text}
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {currentQuestions[currentIndex].options.map((option, idx) => (
                      <button
                        key={`${option}-${idx}`}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswer(idx)}
                        className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'} rounded-xl border transition-all flex items-center justify-between group ${
                          selectedAnswer === idx 
                            ? (isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-rose-500/20 border-rose-500 text-rose-400')
                            : selectedAnswer !== null && idx === currentQuestions[currentIndex].correctAnswer
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-white/5 border-white/10 hover:border-theme-primary/50 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg">{option}</span>
                        {language === 'ar' ? (
                          <ChevronLeft className={`w-5 h-5 transition-transform ${selectedAnswer === null ? 'group-hover:translate-x-[-4px]' : 'opacity-0'}`} />
                        ) : (
                          <ChevronLeft className={`w-5 h-5 transition-transform rotate-180 ${selectedAnswer === null ? 'group-hover:translate-x-[4px]' : 'opacity-0'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {selectedAnswer !== null && currentQuestions[currentIndex].explanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-theme-primary/10 border border-theme-primary/20 rounded-xl flex gap-3"
                  >
                    <AlertCircle className="text-theme-primary shrink-0" />
                    <p className="text-sm text-white/80">{currentQuestions[currentIndex].explanation}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {gameState === 'results' && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 py-8"
              >
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-theme-primary/20 blur-3xl rounded-full" />
                  <Trophy size={100} className="text-theme-primary relative animate-bounce" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-3xl font-bold neon-text">{t.challengeComplete}</h4>
                  <p className="text-xl font-bold text-white/90 px-4">{getFeedbackMessage()}</p>
                </div>

                <div className="flex justify-center gap-8">
                  <div className="glass-card p-6 min-w-[120px]">
                    <span className="block text-white/40 text-sm mb-1">{t.score}</span>
                    <span className="text-4xl font-bold text-theme-primary">{score} / {currentQuestions.length}</span>
                  </div>
                  <div className="glass-card p-6 min-w-[120px]">
                    <span className="block text-white/40 text-sm mb-1">{language === 'ar' ? 'الوقت' : 'Time'}</span>
                    <span className="text-4xl font-bold text-theme-primary">{60 - timeLeft}s</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    onClick={() => setGameState('difficulty-selection')}
                    className="flex-1 neon-button py-4 font-bold flex items-center justify-center gap-2"
                  >
                    {language === 'ar' ? 'إعادة التحدي' : 'Retry Challenge'}
                  </button>
                  <button 
                    onClick={onClose}
                    className="flex-1 py-4 glass-card border-white/10 hover:bg-white/5 transition-all font-bold"
                  >
                    {t.close}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
