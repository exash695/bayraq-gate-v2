import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Zap, CheckCircle2, XCircle, Trophy, Sparkles } from 'lucide-react';
import { Question } from '../types';
import { BerqCharacter } from './BerqCharacterManager';

interface SixtySecondChallengeProps {
    questions: Question[];
    onComplete: (score: number) => void;
    onClose: () => void;
}

export const SixtySecondChallenge: React.FC<SixtySecondChallengeProps> = ({ questions, onComplete, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    useEffect(() => {
        if (timeLeft <= 0 || isFinished) {
            setIsFinished(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isFinished]);

    const handleAnswer = (idx: number) => {
        if (selectedOption !== null) return;
        setSelectedOption(idx);
        
        const isCorrect = idx === questions[currentIndex].correctAnswer;
        if (isCorrect) setScore(s => s + 1);

        setTimeout(() => {
            setSelectedOption(null);
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                setIsFinished(true);
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-2xl bg-[#0a0a10] border border-[#00E5FF]/20 rounded-[2rem] p-8 overflow-hidden"
                dir="rtl"
            >
                {/* Background effects */}
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#00E5FF]/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                {!isFinished ? (
                    <div className="relative">
                        {/* Header with Bairaq pose_sixty_seconds_challenger */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 flex items-center justify-center shrink-0 border border-[#00E5FF]/20 relative overflow-hidden shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                                    <BerqCharacter 
                                        pose="pose_sixty_seconds_challenger" 
                                        glowColor="cyan" 
                                        className="w-full h-full object-cover scale-110" 
                                    />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                                        <Zap className="text-[#00E5FF] w-5 h-5 animate-pulse" />
                                        تحدي الـ 60 ثانية
                                    </h3>
                                    <p className="text-sm font-bold text-white/40">سؤال {currentIndex + 1} من {questions.length}</p>
                                </div>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                                timeLeft <= 10 
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                                    : 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]'
                            }`}>
                                <Timer className="w-5 h-5" />
                                <span className="text-xl font-black font-mono">{timeLeft}</span>
                            </div>
                        </div>

                        {/* Question */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="w-full space-y-8"
                            >
                                <h2 className="text-2xl font-black text-white leading-relaxed text-center min-h-[5rem]">
                                    {questions[currentIndex].text}
                                </h2>

                                <div className="space-y-4">
                                    {questions[currentIndex].options.map((opt, idx) => {
                                        const isCorrect = idx === questions[currentIndex].correctAnswer;
                                        
                                        let style = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20";
                                        if (selectedOption !== null) {
                                            if (isCorrect) {
                                                style = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                                            } else if (selectedOption === idx && !isCorrect) {
                                                style = "bg-rose-500/20 border-rose-500 text-rose-400";
                                            } else {
                                                style = "bg-white/5 border-white/5 text-white/20 opacity-50";
                                            }
                                        }

                                        return (
                                            <button
                                                key={`ssc_opt_${idx}`}
                                                disabled={selectedOption !== null}
                                                onClick={() => handleAnswer(idx)}
                                                className={`w-full p-4 rounded-xl border text-right font-bold transition-all flex items-center justify-between ${style}`}
                                            >
                                                <span className="text-lg">{opt}</span>
                                                {selectedOption !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                                {selectedOption === idx && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 space-y-8"
                    >
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-[#00E5FF]/20 rounded-full blur-[40px] animate-pulse" />
                            <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-blue-600/20 border border-[#00E5FF]/40 flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.4)] relative overflow-hidden">
                                <BerqCharacter 
                                    pose={score >= Math.ceil(questions.length / 2) ? "pose_excellence_champion" : "pose_sixty_seconds_challenger"} 
                                    glowColor="gold" 
                                    className="w-full h-full object-cover scale-110" 
                                />
                                <Sparkles className="absolute -top-2 -right-2 w-7 h-7 text-[#FFD600] animate-bounce z-20 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl font-black text-white mb-2">انتهى التحدي!</h2>
                            <p className="text-xl font-bold text-[#00E5FF]">لقد حصلت على {score} من {questions.length}</p>
                        </div>

                        <div className="pt-8 flex gap-4 w-full">
                            <button
                                onClick={() => onComplete(score)}
                                className="flex-1 neon-button text-lg uppercase tracking-widest py-3"
                            >
                                إكمال
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 outline-button border-white/20 text-white/60 hover:bg-white/5 py-3"
                            >
                                إغلاق
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
