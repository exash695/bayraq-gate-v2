import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Timer, Zap, Shield, Trophy, X } from 'lucide-react';
import { doc, updateDoc, increment } from '@/src/lib/firebase';
import { db, auth } from '../lib/firebase';
import { updatePoints } from '../lib/pointsEngine';
import { INITIAL_PAGES } from '../data';
import { Question as AppQuestion } from '../types';
import { BerqCharacter } from './BerqCharacterManager';

interface DualArenaProps {
  opponent: any;
  type: '1vs1' | 'provincial' | 'siege';
  onClose: () => void;
  language: 'ar' | 'en';
  unlockedUnits: number[];
}

export const DualArena = React.forwardRef<HTMLDivElement, DualArenaProps>(({ opponent, type, onClose, language, unlockedUnits }, ref) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(type === 'siege' ? 10 : 15);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Dynamically load and shuffle questions from the app's actual content
  const questions = useMemo(() => {
    if (type === 'siege') {
      // Siege mode: Only ministerial questions
      const ministerial = INITIAL_PAGES.flatMap(page => page.questions || []).filter(q => 
        q.isMinisterial || (q.text && q.text.includes('20')) || (q.explanation && q.explanation.includes('20'))
      );
      
      const source = ministerial.length >= 5 ? ministerial : INITIAL_PAGES.flatMap(page => page.questions || []);
      const shuffled = [...source].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 15); // 15 questions for the siege
    }

    // For "Higher Level" challenges, we look at the units beyond what the user has unlocked
    const currentMaxUnit = unlockedUnits.length > 0 ? Math.max(...unlockedUnits) : 1;
    
    // If it's a special challenge (like Gate Guardian), we want the hardest units (e.g. 7, 8, 9)
    // Otherwise, we take the next 2 units from the user's current progress
    const targetUnits = [currentMaxUnit + 1, currentMaxUnit + 2];
    
    // Filter pages to include these "higher" units
    let relevantPages = INITIAL_PAGES.filter(page => {
      const unitMatch = page.unit.match(/Unit (\d+)/i) || page.unit.match(/الوحدة (.*)/);
      let unitNum = 1;
      
      if (unitMatch && unitMatch[1]) {
        const numStr = unitMatch[1].trim();
        if (numStr === '1' || numStr === 'الاولى') unitNum = 1;
        else if (numStr === '2' || numStr === 'الثانية') unitNum = 2;
        else if (numStr === '3' || numStr === 'الثالثة') unitNum = 3;
        else if (numStr === '4' || numStr === 'الرابعة') unitNum = 4;
        else if (numStr === '5' || numStr === 'الخامسة') unitNum = 5;
        else if (numStr === '6' || numStr === 'السادسة') unitNum = 6;
        else if (numStr === '7' || numStr === 'السابعة') unitNum = 7;
        else if (numStr === '8' || numStr === 'الثامنة') unitNum = 8;
        else if (numStr === '9' || numStr === 'التاسعة') unitNum = 9;
        else unitNum = parseInt(numStr) || 1;
      }
      
      return targetUnits.includes(unitNum);
    });

    // Fallback if no "higher" units found (e.g. user is at max unit)
    if (relevantPages.length === 0) {
      relevantPages = INITIAL_PAGES.filter(page => {
        const unitMatch = page.unit.match(/Unit (\d+)/i) || page.unit.match(/الوحدة (.*)/);
        return (unitMatch && (unitMatch[1] === '9' || unitMatch[1] === 'التاسعة'));
      });
    }

    const allQuestions: AppQuestion[] = relevantPages.flatMap(page => page.questions || []);
    const sourceQuestions = allQuestions.length > 0 ? allQuestions : INITIAL_PAGES.flatMap(page => page.questions || []);
    
    const shuffled = [...sourceQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, 20);
  }, [unlockedUnits, type]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (isFinished || !currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return type === 'siege' ? 10 : 15;
        }
        return prev - 1;
      });
      
      // Simulate opponent answering randomly (only if not siege or if siege has a master)
      if (type !== 'siege' && Math.random() > 0.8) {
        setOpponentScore(prev => prev + (Math.random() > 0.5 ? 10 : 0));
      } else if (type === 'siege' && Math.random() > 0.9) {
        // Siege master is tougher
        setOpponentScore(prev => prev + (Math.random() > 0.4 ? 12 : 0));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, isFinished, currentQuestion]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    setSelectedAnswer(index);

    if (index === currentQuestion.correctAnswer) {
      // Speed bonus: 10 base points + up to 15 bonus points based on time left
      const points = 10 + timeLeft;
      setScore(prev => prev + points);
    }

    // For Siege mode, we want a faster transition or immediate if correct? 
    // User said "عند الانتهاء ينتقل التطبيق تلقائياً للسؤال التالي"
    // Let's keep a short delay for feedback unless it's a timeout
    setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(type === 'siege' ? 10 : 15);
    } else {
      finishDual();
    }
  };

  const finishDual = async () => {
    setIsFinished(true);
    
    if (auth.currentUser) {
      try {
        if (score > opponentScore) {
          // Win
          let points = type === 'provincial' ? 100 : 50;
          let reason = 'arena_win';
          
          // Special handling for Grand Siege
          if (opponent.uid === 'siege-master' || type === 'siege') {
            points = 300;
            reason = 'grand_siege_victory';
          }
          
          await updatePoints(auth.currentUser.uid, points, reason);
          
          if (type === 'provincial' && opponent.cityName) {
            const provinceRef = doc(db, 'provinces', opponent.cityName);
            await updateDoc(provinceRef, {
              wins: increment(1)
            }).catch(() => console.log("Province doc might not exist yet, skipping for mock."));
          }
        } else if (score < opponentScore && type === '1vs1') {
          // Loss in 1vs1
          await updatePoints(auth.currentUser.uid, -20, 'arena_loss');
        }
      } catch (error) {
        console.error("Error updating scores:", error);
      }
    }
  };

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#020617]/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="text-white text-xl">جاري تحميل التحدي...</div>
      </div>
    );
  }

  const themeColor = type === 'siege' ? '#dc2626' : '#38bdf8';
  const glowColor = type === 'siege' ? 'rgba(220, 38, 38, 0.5)' : 'rgba(56, 189, 248, 0.5)';

  return (
    <div ref={ref} className="fixed inset-0 z-[1000] bg-[#020617]/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse" style={{ backgroundColor: glowColor }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

        <motion.div 
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-3xl bg-[#0f172a] border-y md:border-2 rounded-none md:rounded-[3rem] -mx-4 md:mx-0 overflow-hidden"
          style={{ borderColor: `${themeColor}4d`, boxShadow: `0 0 50px ${glowColor}` }}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-black/20" style={{ borderColor: `${themeColor}33` }}>
          <div className="flex items-center gap-3">
            <Swords className={`w-6 h-6 ${type === 'siege' ? 'text-red-500' : 'text-rose-500'}`} />
            <h2 className="text-xl font-bold text-white m-0">
              {type === 'siege' ? (language === 'ar' ? 'تحدي الحصار العظيم' : 'Great Siege Challenge') : type === '1vs1' ? 'مبارزة كسر الراية' : 'تحدي السيادة الإقليمية'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 text-white/60 hover:text-white bg-white/5 hover:bg-rose-500/20 px-3 py-2 rounded-lg transition-all border border-transparent hover:border-rose-500/30"
          >
            <span className="text-sm font-bold">{language === 'ar' ? 'إغلاق' : 'Close'}</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Versus Bar */}
        <div className={`flex justify-between items-center p-6 bg-gradient-to-r ${type === 'siege' ? 'from-red-600/20 via-transparent to-red-950/20' : 'from-theme-primary/20 via-transparent to-rose-500/20'}`}>
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full bg-white/5 border-2 flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg`} style={{ borderColor: themeColor }}>
              👤
            </div>
            <div className="font-bold" style={{ color: themeColor }}>{language === 'ar' ? 'أنت' : 'You'}</div>
            <div className="text-2xl font-black text-white">{score}</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-3xl font-black text-white/20 italic mb-2">VS</div>
            {!isFinished && (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/30">
                <Timer className="w-5 h-5 animate-pulse" />
                <span className="font-bold text-xl">{timeLeft}s</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className={`w-16 h-16 rounded-full bg-white/5 border-2 flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg`} style={{ borderColor: type === 'siege' ? '#dc2626' : '#f43f5e' }}>
              {type === 'siege' ? '🏰' : '🛡️'}
            </div>
            <div className="font-bold" style={{ color: type === 'siege' ? '#dc2626' : '#f43f5e' }}>{opponent.fullName || opponent.name || opponent.cityName}</div>
            <div className="text-2xl font-black text-white">{opponentScore}</div>
          </div>
        </div>

        {/* Arena Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {!isFinished ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <span className="font-bold text-sm tracking-wider uppercase mb-2 block" style={{ color: themeColor }}>
                    {language === 'ar' ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}` : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
                  </span>
                  <h3 className="text-2xl font-bold text-white leading-relaxed" dir="ltr">
                    {currentQuestion.text}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4" dir="ltr">
                  {currentQuestion.options.map((option, idx) => {
                    let btnClass = "bg-white/5 border-white/10 hover:bg-white/10 text-white";
                    let dynamicStyle = { borderColor: 'rgba(255,255,255,0.1)' };

                    if (selectedAnswer !== null) {
                      if (idx === currentQuestion.correctAnswer) {
                        btnClass = "bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                        dynamicStyle = { borderColor: '#22c55e' };
                      } else if (idx === selectedAnswer) {
                        btnClass = "bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]";
                        dynamicStyle = { borderColor: '#f43f5e' };
                      } else {
                        btnClass = "bg-white/5 text-white/30 opacity-50";
                      }
                    }

                    return (
                      <button
                        key={`${option}-${idx}`}
                        onClick={() => handleAnswer(idx)}
                        disabled={selectedAnswer !== null}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 text-lg font-bold flex items-center justify-between group ${btnClass}`}
                        style={dynamicStyle}
                      >
                        <span>{option}</span>
                        {selectedAnswer === null && (
                          <Zap size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: themeColor }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 px-8 relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/10 z-50"
              >
                <X size={20} />
              </button>

              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-theme-primary/20 blur-3xl rounded-full" />
                {score >= opponentScore ? (
                  <div className="relative">
                    <div className="w-28 h-28 mx-auto mb-4 relative overflow-hidden rounded-2xl border border-yellow-400/40 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                      <BerqCharacter pose="pose_excellence_champion" glowColor="gold" className="w-full h-full object-contain p-1" />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2">
                      {language === 'ar' ? 'نصرٌ مؤزر أيها الفاتح! 🎉' : 'A Glorious Victory, Conqueror! 🎉'}
                    </h2>
                    <p className="text-theme-primary font-bold text-lg">
                      {language === 'ar' ? 'لقد سقط الحصار أمام عزيمتك، وأثبت أنك سيد الميدان.' : 'The siege has fallen before your resolve, proving you are the master of the field.'}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <Shield size={100} className="text-white/20 mx-auto mb-4" />
                    <h2 className="text-4xl font-black text-white mb-2">
                      {language === 'ar' ? 'كبوة فارس شجاع! 🛡️' : 'A Brave Knight\'s Fall! 🛡️'}
                    </h2>
                    <p className="text-white/60 font-bold text-lg">
                      {language === 'ar' ? 'لا تحزن، فالعظماء يتعلمون من الهزيمة أكثر من النصر. استعد، فالحرب لم تنتهِ بعد!' : 'Do not be sad, for the great learn more from defeat than victory. Prepare, the war is not over!'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-6 mb-10">
               <div className="glass-card p-4 min-w-[140px] rounded-none md:rounded-[1.5rem]" style={{ borderColor: `${themeColor}4d` }}>
                  <p className="text-xs text-white/40 mb-1">{language === 'ar' ? 'نقاطك' : 'Your Score'}</p>
                  <p className="text-3xl font-black" style={{ color: themeColor }}>{score}</p>
                </div>
                <div className="glass-card p-4 border-white/10 min-w-[140px] rounded-none md:rounded-[1.5rem]">
                  <p className="text-xs text-white/40 mb-1">{language === 'ar' ? 'نقاط الخصم' : 'Opponent'}</p>
                  <p className="text-3xl font-black text-white/60">{opponentScore}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={onClose}
                    className="px-12 py-4 text-black font-black rounded-none md:rounded-[1.5rem] hover:scale-105 transition-all w-full md:w-auto"
                    style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${glowColor}` }}
                  >
                  {language === 'ar' ? 'إغلاق الميدان' : 'Close Arena'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
});
DualArena.displayName = 'DualArena';
