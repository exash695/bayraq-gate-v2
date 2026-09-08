import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Clock, X, Check, ArrowRight, ArrowLeft, RefreshCw, FileText, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { NormalizedPage, MistakeItem } from './types';
import { sounds } from '../../lib/sounds';

interface MockExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: NormalizedPage[];
  docTitle: string;
  onAddMistake?: (mistake: MistakeItem) => void;
}

export const MockExamModal: React.FC<MockExamModalProps> = ({
  isOpen,
  onClose,
  pages,
  docTitle,
  onAddMistake
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generate Comprehensive Exam covering ALL pages of the uploaded document
  const examQuestions = useMemo(() => {
    const list: Array<{
      id: string;
      questionText: string;
      options: string[];
      correct: number;
      solutionText?: string;
      topic: string;
      pageNumber: number;
    }> = [];

    // Ensure EVERY page in the document has its key question represented
    pages.forEach((page, pIdx) => {
      // 1. Look for question in structured content
      const questionNode = page.structuredContent.find(n => n.type === 'question' && n.questionText);
      const quizQuestion = page.quiz && page.quiz[0];

      if (questionNode && questionNode.questionText) {
        list.push({
          id: `exam_p_${page.pageNumber}_q`,
          questionText: questionNode.questionText,
          options: [
            questionNode.solutionText || "الإجابة النموذجية الوزارية المعتمدة",
            "خيار بديل غير مطابق لضوابط الصفحة",
            "صيغة غير دقيقة للتشتيت",
            "حالة استثنائية لا تنطبق هنا"
          ],
          correct: 0,
          solutionText: questionNode.solutionText,
          topic: page.title,
          pageNumber: page.pageNumber
        });
      } else if (quizQuestion && quizQuestion.question) {
        list.push({
          id: `exam_p_${page.pageNumber}_quiz`,
          questionText: quizQuestion.question,
          options: quizQuestion.options,
          correct: quizQuestion.correct,
          solutionText: quizQuestion.options[quizQuestion.correct],
          topic: page.title,
          pageNumber: page.pageNumber
        });
      } else {
        // Synthesize a key comprehension question from this page's content
        const firstParagraph = page.structuredContent.find(n => n.content)?.content || page.rawText || page.title;
        list.push({
          id: `exam_p_${page.pageNumber}_synth`,
          questionText: `سؤال شامل من صفحة ${page.pageNumber}: ما هو الحكم أو الضابط الأساسي لـ "${page.title}"؟`,
          options: [
            firstParagraph.substring(0, 80) || "القاعدة النموذجية المعتمدة في المنهج",
            "حكم مغاير غير متوافق مع شروط الصفحة",
            "تطبيق غير دقيق",
            "جميع الخيارات الأخرى غير صحيحة"
          ],
          correct: 0,
          solutionText: firstParagraph.substring(0, 100),
          topic: page.title,
          pageNumber: page.pageNumber
        });
      }
    });

    return list;
  }, [pages]);

  // Adjust timer based on total questions (1.5 mins per question, min 5 mins)
  useEffect(() => {
    if (isOpen && !isSubmitted) {
      setTimeLeft(Math.max(300, examQuestions.length * 90));
    }
  }, [isOpen, examQuestions.length]);

  // Exam timer
  useEffect(() => {
    let timer: any;
    if (isOpen && !isSubmitted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [isOpen, isSubmitted, timeLeft]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsSubmitted(true);
    let correctCount = 0;

    examQuestions.forEach((q, idx) => {
      const userAns = selectedAnswers[idx];
      const isCorrect = userAns === q.correct;
      if (isCorrect) {
        correctCount++;
      } else if (onAddMistake) {
        onAddMistake({
          id: Date.now().toString() + idx,
          questionText: q.questionText,
          userAnswer: q.options[userAns] || "لم يتم الإجابة",
          correctAnswer: q.options[q.correct] || q.solutionText || "الإجابة النموذجية",
          topic: q.topic,
          pageNumber: q.pageNumber,
          explanation: q.solutionText || "راجع القاعدة والشروط الوزارية في هذا الموضوع.",
          timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    try {
      if (correctCount >= examQuestions.length * 0.7) sounds.playSuccess();
      else sounds.playError();
    } catch (e) {}
  };

  const restartExam = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setTimeLeft(Math.max(300, examQuestions.length * 90));
    setIsSubmitted(false);
  };

  const correctAnswersCount = examQuestions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correct ? acc + 1 : acc;
  }, 0);

  const finalGrade = Math.round((correctAnswersCount / Math.max(1, examQuestions.length)) * 100);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = examQuestions[currentIdx] || examQuestions[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-2xl bg-[#090D24] border border-amber-500/35 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.2)] relative overflow-hidden flex flex-col max-h-[92vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg">
                <Award size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>الامتحان الشامل لكافة صفحات الملف</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-black">
                    {examQuestions.length} سؤال ({pages.length} صفحة)
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  تغطية شاملة لكل صفحات الملزمة بمعدل سؤال رئيسي من كل صفحة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isSubmitted && (
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono text-xs font-black ${
                  timeLeft < 60 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' : 'bg-white/5 text-amber-300 border-white/10'
                }`}>
                  <Clock size={14} />
                  <span>{formatSec(timeLeft)}</span>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Exam Body */}
          {!isSubmitted ? (
            <div className="flex-1 overflow-y-auto py-4 space-y-5 no-scrollbar flex flex-col justify-between">
              <div className="space-y-4">
                {/* Progress Bar & Page Navigation Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/60 font-bold">
                    <span>السؤال {currentIdx + 1} من {examQuestions.length}</span>
                    <span className="text-amber-400">تغطية صفحة {currentQ.pageNumber} من {pages.length}</span>
                  </div>

                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${((currentIdx + 1) / examQuestions.length) * 100}%` }}
                    />
                  </div>

                  {/* Page indicator pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {examQuestions.map((q, idx) => {
                      const isAnswered = selectedAnswers[idx] !== undefined;
                      const isCurrent = currentIdx === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentIdx(idx)}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black shrink-0 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-400 text-black shadow'
                              : isAnswered
                              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {q.pageNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Card */}
                <div className="bg-[#0D1230] border border-amber-500/25 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black">
                      {currentQ.topic}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-black border border-blue-500/30 flex items-center gap-1">
                      <BookOpen size={11} />
                      <span>صفحة {currentQ.pageNumber}</span>
                    </span>
                  </div>

                  <h4 className="text-white font-black text-base sm:text-lg leading-relaxed">
                    {currentQ.questionText}
                  </h4>

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[currentIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setSelectedAnswers(prev => ({ ...prev, [currentIdx]: oIdx }));
                            try { sounds.playPop(); } catch (e) {}
                          }}
                          className={`p-4 rounded-2xl border text-xs sm:text-sm text-right font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 mr-2 ${
                            isSelected ? 'bg-amber-400 border-amber-400 text-black font-black' : 'border-white/20 text-white/40'
                          }`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Nav Controls */}
              <div className="pt-4 flex items-center justify-between border-t border-white/10 shrink-0">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight size={14} />
                  <span>السؤال السابق</span>
                </button>

                {currentIdx < examQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1 cursor-pointer shadow-lg active:scale-95"
                  >
                    <span>السؤال التالي</span>
                    <ArrowLeft size={14} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 animate-bounce"
                  >
                    <CheckCircle2 size={15} />
                    <span>تسليم الامتحان النهائي 🎯</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-center no-scrollbar">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto text-3xl shadow-xl">
                {finalGrade >= 75 ? '🏆' : '📚'}
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">
                  {finalGrade >= 90 ? 'ممتاز! نتيجة مشرفة تليق بأبطال الـ 100' : finalGrade >= 75 ? 'أحسنتِ! مستوى رائع واستيعاب شامل' : 'فرصة لمراجعة النقاط الحرجة وتثبيت المعلومات'}
                </h3>
                <p className="text-xs text-white/50">تم تغطية كافة صفحات الملزمة بنجاح</p>
              </div>

              {/* Score Display */}
              <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl max-w-sm mx-auto space-y-2">
                <span className="text-xs text-white/40 block font-bold">الدرجة النهائية في الامتحان الشامل</span>
                <span className="text-5xl font-black text-amber-400 font-mono block">
                  {finalGrade}%
                </span>
                <span className="text-xs text-emerald-400 font-bold block">
                  الإجابات الصحيحة: {correctAnswersCount} من أصل {examQuestions.length} سؤال
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={restartExam}
                  className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>إعادة الامتحان 🔄</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs cursor-pointer shadow-lg"
                >
                  العودة للملزمة ✅
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
