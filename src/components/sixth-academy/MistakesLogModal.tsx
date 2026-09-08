import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertOctagon, X, Trash2, CheckCircle2, BookOpen, AlertTriangle } from 'lucide-react';
import { MistakeItem } from './types';

interface MistakesLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistakes: MistakeItem[];
  onClearMistakes: () => void;
  onJumpToPage: (pageIndex: number) => void;
}

export const MistakesLogModal: React.FC<MistakesLogModalProps> = ({
  isOpen,
  onClose,
  mistakes,
  onClearMistakes,
  onJumpToPage
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-2xl bg-[#0B0E24] border border-rose-500/35 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(244,63,94,0.18)] relative overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg">
                <AlertOctagon size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>سجل الأخطاء والملاحظات التشخيصية</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                    {mistakes.length} خطأ مسجل
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  تجميع الأسئلة التي تعثرتِ بها في التحديات لتفادي تكرارها في الامتحان الوزاري
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mistakes.length > 0 && (
                <button
                  onClick={onClearMistakes}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-300 border border-white/5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>تصفير السجل</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mistakes list */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 no-scrollbar">
            {mistakes.length === 0 ? (
              <div className="text-center py-12 text-white/40 space-y-2">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400 opacity-60" />
                <h4 className="text-sm font-bold text-white">سجل الأخطاء نظيف ومثالي!</h4>
                <p className="text-xs">لم يتم تسجيل أي إجابة خاطئة حتى الآن. واصلي التميز 🌟</p>
              </div>
            ) : (
              mistakes.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#121633] border border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle size={13} />
                      {item.topic} (صفحة {item.pageNumber})
                    </span>
                    <button
                      onClick={() => {
                        onJumpToPage(item.pageNumber - 1);
                        onClose();
                      }}
                      className="text-blue-300 hover:text-blue-200 flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      <BookOpen size={11} />
                      انتقال للصفحة
                    </button>
                  </div>

                  <h5 className="text-white font-bold text-xs sm:text-sm leading-relaxed">
                    {item.questionText}
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      <span className="text-[10px] text-white/40 block">إجابتك السابقة:</span>
                      <span className="font-bold">{item.userAnswer}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="text-[10px] text-white/40 block">الإجابة النموذجية الصحيحة:</span>
                      <span className="font-bold">{item.correctAnswer}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-300 bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                    💡 <strong>التشخيص والحل:</strong> {item.explanation}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
