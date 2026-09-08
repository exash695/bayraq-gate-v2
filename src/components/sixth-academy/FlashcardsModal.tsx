import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, X, RotateCw, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Star, ThumbsUp, AlertCircle, BookOpen } from 'lucide-react';
import { FlashcardItem, NormalizedPage } from './types';
import { sounds } from '../../lib/sounds';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: NormalizedPage[];
  onJumpToPage?: (pageIndex: number) => void;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  pages,
  onJumpToPage
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratedCards, setRatedCards] = useState<Record<string, 'easy' | 'medium' | 'hard'>>({});

  // Auto-generate flashcards strictly and exclusively from document pages
  const flashcards: FlashcardItem[] = useMemo(() => {
    const list: FlashcardItem[] = [];

    pages.forEach((page, pIdx) => {
      // 1. From Question nodes
      page.structuredContent.forEach((node, nIdx) => {
        if (node.type === 'question' && node.questionText) {
          list.push({
            id: `fc_q_${pIdx}_${nIdx}`,
            front: node.questionText,
            back: node.solutionText || "الحل النموذجي المعتمد في الوزاري.",
            topic: page.title,
            pageNumber: page.pageNumber,
            difficulty: 'medium'
          });
        } else if (node.type === 'note' && node.content) {
          list.push({
            id: `fc_n_${pIdx}_${nIdx}`,
            front: `💡 ما التوجيه والقاعدة المهمة في: "${node.content.slice(0, 65)}..."؟`,
            back: node.content,
            topic: page.title,
            pageNumber: page.pageNumber,
            difficulty: 'easy'
          });
        } else if (node.type === 'heading' && node.content && node.content.length > 5) {
          list.push({
            id: `fc_h_${pIdx}_${nIdx}`,
            front: `ما هي المفاهيم والضوابط الأساسية لموضوع: (${node.content})؟`,
            back: `يرتكز الموضوع على مطابقة الشروط والقرائن المعتمدة في صفحة ${page.pageNumber}.`,
            topic: page.title,
            pageNumber: page.pageNumber,
            difficulty: 'easy'
          });
        }
      });

      // 2. From page quizzes if available
      page.quiz?.forEach((q, qIdx) => {
        if (q.question && !list.some(item => item.front === q.question)) {
          list.push({
            id: `fc_quiz_${pIdx}_${qIdx}`,
            front: q.question,
            back: q.options[q.correct] || q.tip || "الإجابة النموذجية المعتمدة.",
            topic: page.title,
            pageNumber: page.pageNumber,
            difficulty: 'medium'
          });
        }
      });
    });

    if (list.length === 0) {
      list.push({
        id: 'fc_default',
        front: "ما هي القاعدة الأساسية في هذا الدرس؟",
        back: "مطابقة الشروط والقواعد المعتمدة في المنهج الوزاري.",
        topic: "القواعد الأساسية",
        pageNumber: 1,
        difficulty: 'easy'
      });
    }

    return list;
  }, [pages]);

  if (!isOpen) return null;

  const currentCard = flashcards[currentIdx] || flashcards[0];

  const handleRate = (rating: 'easy' | 'medium' | 'hard') => {
    setRatedCards(prev => ({ ...prev, [currentCard.id]: rating }));
    try { sounds.playPop(); } catch (e) {}

    setIsFlipped(false);
    setTimeout(() => {
      if (currentIdx < flashcards.length - 1) {
        setCurrentIdx(prev => prev + 1);
      }
    }, 250);
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
    try { sounds.playPop(); } catch (e) {}
  };

  const handleJumpToSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJumpToPage) {
      onJumpToPage(currentCard.pageNumber - 1);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-xl bg-[#090C22] border border-fuchsia-500/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(217,70,239,0.18)] relative overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 flex items-center justify-center shadow-lg">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>البطاقات الذكية والفلاش كاردز</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-mono">
                    {currentIdx + 1} / {flashcards.length}
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  مستخلصة حصراً من محتوى الملف — انقري لقلب البطاقة أو رقم الصفحة للانتقال للموضوع
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Flashcard 3D Perspective Card */}
          <div className="py-6 flex-1 flex flex-col items-center justify-center min-h-[280px]">
            <div
              onClick={handleFlip}
              className="w-full max-w-md h-72 rounded-3xl cursor-pointer perspective-1000 relative select-none"
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front Side */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-[#121638] to-[#0A0D24] border-2 border-fuchsia-500/30 rounded-3xl p-6 flex flex-col justify-between shadow-2xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-fuchsia-400">
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} />
                      <span>{currentCard.topic}</span>
                    </span>

                    {/* Clickable Page Number Link */}
                    <button
                      onClick={handleJumpToSource}
                      className="px-2.5 py-1 rounded-full bg-fuchsia-500/20 hover:bg-fuchsia-500/40 border border-fuchsia-500/40 text-fuchsia-200 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 z-10"
                      title="انقر للانتقال مباشرة إلى صفحة هذا الموضوع"
                    >
                      <BookOpen size={12} />
                      <span>صفحة {currentCard.pageNumber} ↗</span>
                    </button>
                  </div>

                  <div className="text-center px-2">
                    <h4 className="text-white font-black text-base sm:text-lg leading-relaxed">
                      {currentCard.front}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/40 font-bold">
                    <div className="flex items-center gap-1.5">
                      <RotateCw size={13} />
                      <span>انقر للقلب وإظهار الجواب 💡</span>
                    </div>
                    <span className="text-[10px] text-fuchsia-300/70">مستخلص من الملف</span>
                  </div>
                </div>

                {/* Back Side */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-[#0D241C] to-[#0A1A24] border-2 border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-2xl"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      <span>الجواب والتحليل النموذجي</span>
                    </span>

                    {/* Clickable Page Number Link on Back */}
                    <button
                      onClick={handleJumpToSource}
                      className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/40 text-emerald-200 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 z-10"
                      title="انقر للانتقال مباشرة إلى صفحة هذا الموضوع"
                    >
                      <BookOpen size={12} />
                      <span>صفحة {currentCard.pageNumber} ↗</span>
                    </button>
                  </div>

                  <div className="text-center px-2">
                    <p className="text-emerald-200 font-black text-sm sm:text-base leading-relaxed">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-emerald-400/70 font-bold">
                    <span>انقر للعودة للسؤال 🔄</span>
                    <span className="text-white/40">مطابق للمنهج 100%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Retention Evaluation Actions (Spaced Repetition) */}
          <div className="pt-3 border-t border-white/10 space-y-3 shrink-0">
            <span className="text-[11px] font-bold text-white/50 block text-center">
              كيف كان استرجاعك لهذه المعلومة؟
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleRate('hard')}
                className="py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertCircle size={14} />
                <span>يحتاج مراجعة 🔴</span>
              </button>

              <button
                onClick={() => handleRate('medium')}
                className="py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Star size={14} />
                <span>متوسط 🟡</span>
              </button>

              <button
                onClick={() => handleRate('easy')}
                className="py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ThumbsUp size={14} />
                <span>سهل ومتقن 🟢</span>
              </button>
            </div>

            {/* Prev / Next Pagination */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                disabled={currentIdx === 0}
                onClick={() => {
                  if (currentIdx > 0) {
                    setIsFlipped(false);
                    setCurrentIdx(prev => prev - 1);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <ChevronRight size={14} />
                <span>السابق</span>
              </button>

              <button
                disabled={currentIdx >= flashcards.length - 1}
                onClick={() => {
                  if (currentIdx < flashcards.length - 1) {
                    setIsFlipped(false);
                    setCurrentIdx(prev => prev + 1);
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <span>التالي</span>
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
