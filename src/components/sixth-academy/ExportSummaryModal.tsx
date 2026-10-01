import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, X, FileText, CheckCircle2, Sparkles, Lightbulb } from 'lucide-react';
import { NoteItem, NormalizedPage, PageIllustration } from './types';
import { printHTML } from '../../lib/exportUtils';

interface ExportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  unitTitle: string;
  notes: NoteItem[];
  pages: NormalizedPage[];
  attachedIllustrations: Record<number, PageIllustration[]>;
}

export const ExportSummaryModal: React.FC<ExportSummaryModalProps> = ({
  isOpen,
  onClose,
  docTitle,
  unitTitle,
  notes,
  pages
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printArea = document.getElementById('print-area-summary');
    if (printArea) {
      const html = `
        <html dir="rtl">
          <head>
            <title>ملخص أكاديمية السادس</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
              body { font-family: 'Tajawal', sans-serif; padding: 30px; color: black; background: white; }
              h4 { color: #d97706; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px; }
              .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; }
              .note-box { padding: 15px; border: 1px solid #ddd; border-radius: 10px; background: #f9f9f9; }
              .tag { font-size: 10px; font-weight: bold; color: #d97706; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${printArea.innerHTML}
          </body>
        </html>
      `;
      printHTML(html);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:z-[9999]" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-3xl bg-[#090D24] border border-amber-500/35 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] text-right print:max-h-none print:h-auto print:border-none print:bg-white print:text-black print:p-8 print:shadow-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 print:border-black/20 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 print:text-black flex items-center justify-center shadow-lg">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white print:text-black">
                  كراس الملاحظات الذهبية والملخص الوزاري
                </h3>
                <p className="text-xs text-white/50 print:text-black/60">
                  {docTitle} — ({unitTitle})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-all"
              >
                <Printer size={14} />
                <span>طباعة / حفظ كـ PDF 📄</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Content Body */}
          <div id="print-area-summary" className="flex-1 overflow-y-auto space-y-6 py-4 no-scrollbar print:overflow-visible">
            
            {/* Section 1: Idea Bank Notes */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-amber-400 print:text-black flex items-center gap-2 border-b border-white/10 print:border-black/20 pb-2">
                <Lightbulb size={16} />
                <span>الملاحظات المصنفة في بنك الأفكار ({notes.length})</span>
              </h4>

              {notes.length === 0 ? (
                <p className="text-xs text-white/40 print:text-black/40 italic">لا توجد ملاحظات مدونة حالياً.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notes.map(n => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-2xl bg-white/[0.02] print:bg-gray-100 border border-white/5 print:border-gray-300 space-y-1"
                    >
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 print:text-black font-mono">
                        {n.tag}
                      </span>
                      <p className="text-xs text-white print:text-black font-medium leading-relaxed">
                        {n.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Core Rules Summary */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-black text-[#00E5FF] print:text-black flex items-center gap-2 border-b border-white/10 print:border-black/20 pb-2">
                <Sparkles size={16} />
                <span>ملخص القواعد والملاحظات الوزارية الرئيسية</span>
              </h4>

              <div className="space-y-3">
                {pages.map((p) => {
                  const notesInPage = p.structuredContent.filter(n => n.type === 'note');
                  const questionsInPage = p.structuredContent.filter(n => n.type === 'question');

                  return (
                    <div
                      key={p.pageNumber}
                      className="p-4 rounded-2xl bg-[#0D1230] print:bg-gray-50 border border-white/5 print:border-gray-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-black text-amber-400 print:text-black">
                        <span>صفحة {p.pageNumber}: {p.title}</span>
                        <span className="text-[10px] text-white/40 print:text-black/50">{p.tag}</span>
                      </div>

                      {notesInPage.map((n, idx) => (
                        <p key={idx} className="text-xs text-amber-200 print:text-black leading-relaxed">
                          💡 {n.content}
                        </p>
                      ))}

                      {questionsInPage.slice(0, 2).map((q, idx) => (
                        <div key={idx} className="text-xs text-zinc-300 print:text-black space-y-0.5 pt-1">
                          <span className="font-bold block">س: {q.questionText}</span>
                          {q.solutionText && (
                            <span className="text-emerald-300 print:text-green-800 font-bold block text-[11px]">
                              ج: {q.solutionText}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 print:hidden flex justify-end shrink-0">
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
