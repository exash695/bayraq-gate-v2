import React from 'react';
import { 
  Lightbulb, Sparkles, ShieldCheck, Eye, EyeOff, 
  Type, Sun, Moon, Volume2, VolumeX, Mic, GraduationCap,
  Layers, Scale, Award, AlertOctagon, Printer, Highlighter,
  SplitSquareVertical, HelpCircle
} from 'lucide-react';
import { NoteCategory } from './types';

interface TopToolbarProps {
  // Idea Bank
  notesCount: number;
  onOpenIdeaBank: () => void;
  // Ministerial Bank
  ministerialCount: number;
  onOpenMinisterialBank: () => void;
  // Flashcards
  onOpenFlashcards: () => void;
  // Comparator
  onOpenComparator: () => void;
  // Voice Index / Podcast
  onOpenVoiceIndex: () => void;
  // Grand Mock Exam
  onOpenMockExam: () => void;
  // Mistakes Log
  mistakesCount: number;
  onOpenMistakesLog: () => void;
  // Export Summary (Optional / removed from UI)
  onOpenExportSummary?: () => void;
  // AI Illustration Generator
  onOpenIllustrationGenerator: () => void;
  // Voice Recording for Page
  onRecordPageVoice: () => void;
  isPageVoiceRecording: boolean;
  hasPageVoiceNote: boolean;
  // Topic Passes
  onOpenTopicPasses: () => void;
  completedTopicsCount: number;
  totalTopicsCount: number;
  isTopicPassesActive: boolean;
  // Active Recall Tools
  focusRulerActive: boolean;
  onToggleFocusRuler: () => void;
  clozeModeActive: boolean;
  onToggleClozeMode: () => void;
  highlighterActive: boolean;
  onToggleHighlighter: () => void;
  // Solutions Reveal Toggle
  showAllSolutions: boolean;
  onToggleShowAllSolutions: () => void;
  // Font Size
  fontSize: 'small' | 'medium' | 'large' | 'massive';
  onChangeFontSize: (size: 'small' | 'medium' | 'large' | 'massive') => void;
  // Contrast & Sound
  highContrast: boolean;
  onToggleContrast: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  notesCount,
  onOpenIdeaBank,
  ministerialCount,
  onOpenMinisterialBank,
  onOpenFlashcards,
  onOpenComparator,
  onOpenVoiceIndex,
  onOpenMockExam,
  mistakesCount,
  onOpenMistakesLog,
  onOpenExportSummary,
  onOpenIllustrationGenerator,
  onRecordPageVoice,
  isPageVoiceRecording,
  hasPageVoiceNote,
  onOpenTopicPasses,
  completedTopicsCount,
  totalTopicsCount,
  isTopicPassesActive,
  focusRulerActive,
  onToggleFocusRuler,
  clozeModeActive,
  onToggleClozeMode,
  highlighterActive,
  onToggleHighlighter,
  showAllSolutions,
  onToggleShowAllSolutions,
  fontSize,
  onChangeFontSize,
  highContrast,
  onToggleContrast,
  soundEnabled,
  onToggleSound
}) => {
  return (
    <div className="bg-[#090C1F]/95 border-b border-white/10 px-3 py-2 shrink-0 z-10" dir="rtl">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
        
        {/* 1. بنك الوزاريات الشامل */}
        <button
          onClick={onOpenMinisterialBank}
          className="px-3.5 py-1.5 rounded-xl bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF]/35 font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
          title="بنك الوزاريات الشامل المصنف بالسنوات والكلمات المفتاحية"
        >
          <GraduationCap size={15} />
          <span>بنك الوزاريات ({ministerialCount}) 🎯</span>
        </button>

        {/* 2. Idea Bank with Classifications */}
        <button
          onClick={onOpenIdeaBank}
          className="px-3 py-1.5 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/35 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
          title="بنك الأفكار المصنفة (فكرة ذهبية، تنبيه، امتحاني، قاعدة ملخصة)"
        >
          <Lightbulb size={14} className="text-fuchsia-400" />
          <span>بنك الأفكار ({notesCount})</span>
        </button>

        {/* 3. البطاقات الذكية / الفلاش كاردز */}
        <button
          onClick={onOpenFlashcards}
          className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/35 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          title="البطاقات الذكية والفلاش كاردز للاسترجاع النشط"
        >
          <Layers size={14} />
          <span>البطاقات الذكية 🗂️</span>
        </button>

        {/* 4. المقارن الوزاري الذكي */}
        <button
          onClick={onOpenComparator}
          className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/35 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          title="المقارن الوزاري الذكي بين القواعد المتشابهة"
        >
          <Scale size={14} />
          <span>المقارن الوزاري ⚖️</span>
        </button>

        {/* 5. AI Illustration Generator */}
        <button
          onClick={onOpenIllustrationGenerator}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black flex items-center gap-1.5 shrink-0 shadow-md transition-all cursor-pointer active:scale-95"
          title="توليد رسم توضيحي ومخطط بياني ذكي بالذكاء الاصطناعي"
        >
          <Sparkles size={14} fill="currentColor" />
          <span>رسم توضيحي ذكي 🎨</span>
        </button>

        {/* 6. بودكاست الأستاذ والفهرس الصوتي */}
        <button
          onClick={onOpenVoiceIndex}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          title="فهرس وبودكاست الشروح الصوتية للأستاذ"
        >
          <Mic size={14} />
          <span>بودكاست الأستاذ 🎙️</span>
        </button>

        {/* 7. محاكي الامتحان الوزاري الشامل */}
        <button
          onClick={onOpenMockExam}
          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          title="امتحان وزاري شامل من 100 مع تقرير تفصيلي"
        >
          <Award size={14} />
          <span>امتحان شامل 🏆</span>
        </button>

        {/* 8. سجل الأخطاء التشخيصي */}
        {mistakesCount > 0 && (
          <button
            onClick={onOpenMistakesLog}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer animate-pulse"
            title="سجل الأخطاء التشخيصي والمراجعة المركزة"
          >
            <AlertOctagon size={14} />
            <span>سجل الأخطاء ({mistakesCount})</span>
          </button>
        )}

        {/* 10. Topic Passes Button */}
        <button
          onClick={onOpenTopicPasses}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            isTopicPassesActive
              ? 'bg-[#00E5FF] text-black font-black shadow'
              : 'bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
          }`}
          title="محطة بطاقات العبور وتحديات البرق لموضوعات الملف"
        >
          <ShieldCheck size={14} />
          <span>بطاقات العبور ({completedTopicsCount}/{totalTopicsCount})</span>
        </button>

        <span className="w-px h-5 bg-white/10 shrink-0 mx-1" />

        {/* Active Recall Tools (Focus Ruler, Highlighter, Cloze) */}
        <button
          onClick={onToggleFocusRuler}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            focusRulerActive ? 'bg-amber-400 text-black font-bold shadow' : 'bg-white/5 text-white/60 hover:text-white border-white/5'
          }`}
          title={focusRulerActive ? "تعطيل مسطرة التركيز" : "تفعيل مسطرة التركيز البصرية"}
        >
          <SplitSquareVertical size={15} />
        </button>

        <button
          onClick={onToggleClozeMode}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            clozeModeActive ? 'bg-fuchsia-500 text-white font-bold shadow' : 'bg-white/5 text-white/60 hover:text-white border-white/5'
          }`}
          title={clozeModeActive ? "تعطيل وضعية إخفاء الكلمات" : "تفعيل وضعية ملء الفراغات والاسترجاع النشط"}
        >
          <HelpCircle size={15} />
        </button>

        <button
          onClick={onToggleHighlighter}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            highlighterActive ? 'bg-yellow-400 text-black font-bold shadow' : 'bg-white/5 text-white/60 hover:text-white border-white/5'
          }`}
          title={highlighterActive ? "تعطيل قلم التظليل" : "تفعيل قلم التظليل الفسفوري"}
        >
          <Highlighter size={15} />
        </button>

        {/* 11. Reveal All Solutions Toggle */}
        <button
          onClick={onToggleShowAllSolutions}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
            showAllSolutions
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
          }`}
          title={showAllSolutions ? "إخفاء كافة الحلول في الصفحة" : "كشف كافة الحلول في الصفحة دفعة واحدة"}
        >
          {showAllSolutions ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{showAllSolutions ? "إخفاء الحلول" : "كشف كل الحلول"}</span>
        </button>

        {/* 12. Font Size Scale */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/5 shrink-0">
          <Type size={13} className="text-white/40 mr-1" />
          {(['small', 'medium', 'large', 'massive'] as const).map(size => (
            <button
              key={size}
              onClick={() => onChangeFontSize(size)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                fontSize === size ? 'bg-indigo-600 text-white shadow' : 'text-white/50 hover:text-white'
              }`}
            >
              {size === 'small' ? 'صغير' : size === 'medium' ? 'معتدل' : size === 'large' ? 'كبير' : 'ضخم'}
            </button>
          ))}
        </div>

        {/* 13. Dark AMOLED Contrast Mode */}
        <button
          onClick={onToggleContrast}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            highContrast 
              ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40' 
              : 'bg-white/5 text-white/60 hover:text-white border-white/5'
          }`}
          title={highContrast ? "تعطيل الصبغة الداكنة القصوى" : "تفعيل الصبغة الداكنة القصوى (AMOLED)"}
        >
          {highContrast ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* 14. Sound Toggle */}
        <button 
          onClick={onToggleSound}
          className={`p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            soundEnabled 
              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' 
              : 'bg-white/5 text-white/40 border-white/5'
          }`}
          title={soundEnabled ? "كتم المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية"}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

      </div>
    </div>
  );
};

