import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scale, X, ArrowLeftRight, CheckCircle, AlertTriangle, Sparkles, BookOpen, Layers } from 'lucide-react';
import { NormalizedPage, ComparisonItem } from './types';
import { sounds } from '../../lib/sounds';

interface ComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: NormalizedPage[];
  onJumpToPage?: (pageIndex: number) => void;
}

export const ComparatorModal: React.FC<ComparatorModalProps> = ({
  isOpen,
  onClose,
  pages,
  onJumpToPage
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Dynamically extract all comparative topics across all pages of the uploaded document
  const comparisons: ComparisonItem[] = useMemo(() => {
    const list: ComparisonItem[] = [];

    pages.forEach((page, pIdx) => {
      // Check structured nodes for comparisons (e.g. قارن, ما الفرق, مقابل, or contrasts)
      page.structuredContent.forEach((node, nIdx) => {
        const text = node.questionText || node.content || '';
        const isComparisonQuestion = /قارن|ما الفرق|الفرق بين|ميّز بين|أوجه الاختلاف|مقابل|vs|versus/i.test(text);

        if (isComparisonQuestion) {
          // Attempt to extract the two concepts from text (e.g. "قارن بين X و Y")
          const match = text.match(/(?:قارن بين|ما الفرق بين|الفرق بين|ميّز بين)\s+([^و]+?)\s+و\s+(.+)/i);
          const concept1Name = match ? match[1].trim() : "المفهوم الأول (أ)";
          const concept2Name = match ? match[2].replace(/[؟\.\:]/g, '').trim() : "المفهوم الثاني (ب)";

          list.push({
            id: `comp_dyn_${pIdx}_${nIdx}`,
            title: text.replace(/^س\/|سؤال:?/i, '').trim(),
            topic: page.title,
            pageNumber: page.pageNumber,
            conceptA: {
              name: concept1Name,
              rule: node.solutionText ? node.solutionText.split(/؛|\n|مقابل/)[0] || node.solutionText : `شروط وضوابط ${concept1Name} كما وردت في صفحة ${page.pageNumber}.`,
              example: `تطبيق وزاري مباشر من سياق صفحة ${page.pageNumber}`,
              key: "الركن الأساسي والشروط المعتمدة"
            },
            conceptB: {
              name: concept2Name,
              rule: node.solutionText && node.solutionText.includes("؛") ? node.solutionText.split("؛")[1] : `الضوابط المقابلة لـ ${concept2Name} وتجنب الخلط بينهما.`,
              example: `الموضع والشاهد الوارد في المنهج`,
              key: "الفارق الجوهري في الامتحان"
            },
            ministerialTip: node.linguisticAnalysis || `⚠️ تنبيه وزاري: ركزي على الفارق الدقيق المذكور في صفحة ${page.pageNumber} لمنع فقدان الدرجات.`
          });
        }
      });
    });

    // If document is general, extract comparative rules from key pages
    if (list.length === 0) {
      pages.forEach((page) => {
        list.push({
          id: `comp_page_${page.pageNumber}`,
          title: `مقارنة القواعد والمفاهيم لـ: ${page.title}`,
          topic: page.title,
          pageNumber: page.pageNumber,
          conceptA: {
            name: "الحالة الأولى / الإثبات والقاعدة العامة",
            rule: page.structuredContent[0]?.content || "تطبيق القاعدة النموذجية المباشرة الواردة في الصفحة.",
            example: "الشواهد والأمثلة الوزارية الأولى",
            key: "النمط المعتمد"
          },
          conceptB: {
            name: "الحالة المقابلة / الاستثناء والنفي",
            rule: page.structuredContent[1]?.content || page.structuredContent[0]?.solutionText || "الحالات الاستثنائية والقرائن التي تغير الحكم.",
            example: "الأفخاخ الوزارية والملاحظات التحذيرية",
            key: "الفارق الحاسم"
          },
          ministerialTip: `💡 مراجعة دقيقة لما ورد في صفحة ${page.pageNumber} لضمان التمييز التام بين الحالات.`
        });
      });
    }

    return list;
  }, [pages]);

  if (!isOpen) return null;

  const current = comparisons[selectedIdx] || comparisons[0];

  const handleJump = (pageNumber: number) => {
    if (onJumpToPage) {
      try { sounds.playPop(); } catch (e) {}
      onJumpToPage(pageNumber - 1);
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
          className="w-full max-w-3xl bg-[#0A0E26] border border-blue-500/35 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(59,130,246,0.2)] relative overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg">
                <Scale size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>المقارن الوزاري الذكي (Side-by-Side)</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-black">
                    {comparisons.length} موضوع مقارنة
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  يشمل جميع المقارنات داخل الملف المرفوع — انقري على رقم الصفحة للانتقال الفوري
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

          {/* Comparison tabs selector */}
          <div className="py-3 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {comparisons.map((comp, idx) => (
              <button
                key={comp.id || idx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  selectedIdx === idx
                    ? 'bg-blue-600 text-white shadow-lg font-black border border-blue-400'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
                }`}
              >
                <span>{comp.title.slice(0, 32)}...</span>
                <span className="text-[10px] opacity-70 font-mono">(ص {comp.pageNumber})</span>
              </button>
            ))}
          </div>

          {/* Comparison Display */}
          {current && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 no-scrollbar">
              {/* Header Title & Jump Link */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-white/[0.02] border border-white/10 p-3.5 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-400 font-bold block">{current.topic}</span>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    {current.title}
                  </h4>
                </div>

                <button
                  onClick={() => handleJump(current.pageNumber)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/40 text-blue-200 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow"
                  title="انتقلي مباشرة لموضع هذه المقارنة في الملزمة"
                >
                  <BookOpen size={14} />
                  <span>انتقال إلى صفحة {current.pageNumber} ↗</span>
                </button>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Concept A */}
                <div className="bg-[#0F1538] border border-cyan-500/30 rounded-3xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/30">
                      {current.conceptA.name}
                    </span>
                    <span className="text-[10px] text-cyan-400/70 font-mono font-bold">الطرف الأول</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-white/50 block font-bold">القاعدة والتعريف:</span>
                    <p className="text-white text-xs sm:text-sm font-medium leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5">
                      {current.conceptA.rule}
                    </p>
                  </div>

                  {current.conceptA.example && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-cyan-300/70 block font-bold">الشاهد والمثال:</span>
                      <p className="text-cyan-200 text-xs font-mono bg-cyan-950/30 p-2.5 rounded-xl border border-cyan-500/20">
                        {current.conceptA.example}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-white/40 font-bold pt-1 flex items-center gap-1">
                    <CheckCircle size={13} className="text-cyan-400" />
                    <span>المفتاح: {current.conceptA.key}</span>
                  </div>
                </div>

                {/* Concept B */}
                <div className="bg-[#140F38] border border-fuchsia-500/30 rounded-3xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-300 text-xs font-black border border-fuchsia-500/30">
                      {current.conceptB.name}
                    </span>
                    <span className="text-[10px] text-fuchsia-400/70 font-mono font-bold">الطرف المقابل</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-white/50 block font-bold">القاعدة والتعريف:</span>
                    <p className="text-white text-xs sm:text-sm font-medium leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5">
                      {current.conceptB.rule}
                    </p>
                  </div>

                  {current.conceptB.example && (
                    <div className="space-y-1">
                      <span className="text-[11px] text-fuchsia-300/70 block font-bold">الشاهد والمثال:</span>
                      <p className="text-fuchsia-200 text-xs font-mono bg-fuchsia-950/30 p-2.5 rounded-xl border border-fuchsia-500/20">
                        {current.conceptB.example}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-white/40 font-bold pt-1 flex items-center gap-1">
                    <CheckCircle size={13} className="text-fuchsia-400" />
                    <span>المفتاح: {current.conceptB.key}</span>
                  </div>
                </div>
              </div>

              {/* Ministerial Trap / Gold Tip */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-amber-300 block mb-0.5">توجيه وزاري لفصل الالتباس:</span>
                  <span>{current.ministerialTip}</span>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
