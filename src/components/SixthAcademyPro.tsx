import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Lock, Radar, Trophy, Settings, Lightbulb, 
  ChevronRight, ChevronLeft, Zap, X, CheckCircle2, Eye, EyeOff,
  Menu, Sparkles, Award, Crown, Check, Trash2, Plus, Clock, 
  ShieldCheck, Flame, Edit3, ArrowRight, ArrowLeft, Volume2, 
  VolumeX, Moon, Sun, Type, FileText, CheckCircle, Mic, Image as ImageIcon,
  GraduationCap, Layers, Scale, AlertOctagon, Printer, Highlighter,
  SplitSquareVertical, HelpCircle, AlertTriangle
} from 'lucide-react';
import { sounds } from '../lib/sounds';
import { safeStorage } from '../lib/storage';
import { 
  NoteItem, NoteCategory, StructuredContentNode, NormalizedPage, 
  TopicPass, MinisterialQuestion, PageIllustration, MistakeItem, HighlightColor 
} from './sixth-academy/types';
import { parseLiteralTextToBlocks } from '../utils/pdfProcessor';
import { VoiceRecorderNode } from './sixth-academy/VoiceRecorderManager';
import { IllustrationGeneratorModal } from './sixth-academy/IllustrationGeneratorModal';
import { IdeaBankModal } from './sixth-academy/IdeaBankModal';
import { TopicPassesStation } from './sixth-academy/TopicPassesStation';
import { TopToolbar } from './sixth-academy/TopToolbar';
import { MinisterialBankModal } from './sixth-academy/MinisterialBankModal';
import { FlashcardsModal } from './sixth-academy/FlashcardsModal';
import { ComparatorModal } from './sixth-academy/ComparatorModal';
import { VoiceIndexModal } from './sixth-academy/VoiceIndexModal';
import { MockExamModal } from './sixth-academy/MockExamModal';
import { MistakesLogModal } from './sixth-academy/MistakesLogModal';
import { ExportSummaryModal } from './sixth-academy/ExportSummaryModal';


// Floating Confetti celebration effect
function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[400]">
      {[...Array(50)].map((_, i) => {
        const size = Math.random() * 8 + 6;
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = Math.random() * 2 + 2;
        const colors = ["#00E5FF", "#FFD600", "#10B981", "#EC4899", "#8B5CF6", "#F59E0B"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: randomColor,
              left: `${left}%`,
              top: "-5%",
              filter: "blur(0.5px)",
            }}
            animate={{
              y: ["0vh", "105vh"],
              x: ["0vw", `${(Math.random() - 0.5) * 20}vw`],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
            }}
            transition={{
              duration: duration,
              delay: delay,
              ease: "linear",
              repeat: 0,
            }}
          />
        );
      })}
    </div>
  );
}

interface SixthAcademyProProps {
  onBack: () => void;
  pageData?: any;
  isTeacherEditMode?: boolean;
}

export const SixthAcademyPro: React.FC<SixthAcademyProProps> = ({ onBack, pageData, isTeacherEditMode = true }) => {
  // Main view tab
  const [activeTab, setActiveTab] = useState<'station1' | 'station2' | 'radar' | 'fame' | 'ideas' | 'control'>('station1');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Available booklets in safeStorage
  const [allAvailableBooklets, setAllAvailableBooklets] = useState<any[]>(() => {
    try {
      const cached = safeStorage.getItem("s6_cached_academy_pages");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [selectedBookletId, setSelectedBookletId] = useState<string | null>(() => pageData?.id || null);

  // Sync selected booklet when incoming pageData prop updates
  useEffect(() => {
    if (pageData) {
      setSelectedBookletId(pageData.id || null);
      setCurrentPageIndex(0);
    }
  }, [pageData?.id, pageData?.title, pageData?.pages?.length]);

  // Pagination
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Reading preferences
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'massive'>('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // In-page tools states
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [revealedAnalysis, setRevealedAnalysis] = useState<Record<string, boolean>>({});
  const [revealedMinisterial, setRevealedMinisterial] = useState<Record<string, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAllSolutionsOnPage, setShowAllSolutionsOnPage] = useState(false);

  // Idea Bank Modal
  const [isIdeaBankOpen, setIsIdeaBankOpen] = useState(false);
  const [ideaBankInitialText, setIdeaBankInitialText] = useState('');
  const [ideaBankInitialTag, setIdeaBankInitialTag] = useState<NoteCategory>('فكرة ذهبية');

  // AI Illustration Generator Modal
  const [isIllustrationModalOpen, setIsIllustrationModalOpen] = useState(false);
  const [attachedIllustrations, setAttachedIllustrations] = useState<Record<number, PageIllustration[]>>({});

  // 60s Challenge Modal states (for in-page challenge button)
  const [challengeMode, setChallengeMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [challengeAnswers, setChallengeAnswers] = useState<Record<number, number>>({});
  const [showChallengeResult, setShowChallengeResult] = useState(false);
  const [dynamicQuiz, setDynamicQuiz] = useState<any[]>([]);

  // Hall of Fame & Pass Rewards
  const [completedPages, setCompletedPages] = useState<number[]>(() => {
    try {
      const saved = safeStorage.getItem(`s6_completed_pages_${docTitle}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [completedChallenges, setCompletedChallenges] = useState<number[]>(() => {
    try {
      const saved = safeStorage.getItem(`s6_completed_challenges_${docTitle}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rewardedPassIds, setRewardedPassIds] = useState<string[]>([]);

  // Idea Bank Notes
  const [notes, setNotes] = useState<NoteItem[]>([]);

  // Advanced Educational Modals
  const [isMinisterialBankOpen, setIsMinisterialBankOpen] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);
  const [isVoiceIndexOpen, setIsVoiceIndexOpen] = useState(false);
  const [isMockExamOpen, setIsMockExamOpen] = useState(false);
  const [isMistakesLogOpen, setIsMistakesLogOpen] = useState(false);
  const [isExportSummaryOpen, setIsExportSummaryOpen] = useState(false);

  // Active Recall & Reading Enhancement States
  const [focusRulerActive, setFocusRulerActive] = useState(false);
  const [mousePos, setMousePos] = useState({ y: 240 });
  const [clozeModeActive, setClozeModeActive] = useState(false);
  const [revealedCloze, setRevealedCloze] = useState<Record<string, boolean>>({});
  const [highlighterActive, setHighlighterActive] = useState(false);
  const [highlightColor, setHighlightColor] = useState<HighlightColor>('yellow');
  const [highlightedNodes, setHighlightedNodes] = useState<Record<string, HighlightColor>>({});

  // Diagnostic Mistakes Log
  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => {
    const saved = safeStorage.getItem('s6_diagnostic_mistakes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const handleAddMistake = (mistake: MistakeItem) => {
    setMistakes(prev => {
      const updated = [mistake, ...prev.slice(0, 49)];
      safeStorage.setItem('s6_diagnostic_mistakes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearMistakes = () => {
    setMistakes([]);
    safeStorage.removeItem('s6_diagnostic_mistakes');
    playSfx('pop');
  };

  // Scroll container ref
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Audio helper
  const playSfx = (type: 'click' | 'success' | 'lock' | 'pop' | 'wrong') => {
    if (!soundEnabled) return;
    try {
      if (type === 'success') sounds.playSuccess();
      else if (type === 'wrong') sounds.playError();
      else if (type === 'click') sounds.playClick();
      else sounds.playPop();
    } catch (e) {}
  };

  // Extract / Normalize document metadata and pages from incoming pageData or saved booklet
  const effectivePageData = useMemo(() => {
    if (pageData) {
      return pageData;
    }
    if (selectedBookletId && allAvailableBooklets.length > 0) {
      const found = allAvailableBooklets.find(b => b.id === selectedBookletId);
      if (found) return found;
    }
    if (allAvailableBooklets.length > 0) {
      return allAvailableBooklets[0];
    }
    return null;
  }, [pageData, selectedBookletId, allAvailableBooklets]);

  const { docTitle, unitTitle, normalizedPages } = useMemo(() => {
    let title = "العرض التفاعلي للمادّة";
    let unit = "الوحدة الأولى";

    if (effectivePageData?.title) title = effectivePageData.title;
    else if (effectivePageData?.documentTitle) title = effectivePageData.documentTitle;
    else if (effectivePageData?.fileName) title = effectivePageData.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

    if (effectivePageData?.unit) unit = effectivePageData.unit;
    else if (effectivePageData?.unitTitle) unit = effectivePageData.unitTitle;
    else if (effectivePageData?.subject) unit = effectivePageData.subject;

    const pagesList: NormalizedPage[] = [];

    const buildFallbackQuiz = (pageTitle: string, rawTextContent: string, nodes: StructuredContentNode[]) => {
      const questionNodes = nodes.filter(n => n.type === 'question' && (n.questionText || n.content));
      if (questionNodes.length >= 2) {
        return [
          {
            question: questionNodes[0].questionText || questionNodes[0].content || `سؤال وزاري حول ${pageTitle}`,
            options: [
              questionNodes[0].solutionText || "الإجابة النموذجية الأولى",
              "خيار غير صحيح للتشتيت",
              "إجابة مخالفة للقاعدة",
              "غير محدد في النص"
            ],
            correct: 0,
            tip: questionNodes[0].solutionText || "راجع نص القاعدة أعلاه."
          },
          {
            question: questionNodes[1].questionText || questionNodes[1].content || `سؤال وزاري ثانٍ حول ${pageTitle}`,
            options: [
              "خيار بديل غير دقيق",
              questionNodes[1].solutionText || "الإجابة النموذجية الصحيحة",
              "حالة استثنائية غير مطابقة",
              "لا شيء مما سبق"
            ],
            correct: 1,
            tip: questionNodes[1].solutionText || "تأكد من شروط تطبيق القاعدة."
          }
        ];
      }

      return [
        {
          question: `س1: بناءً على محتوى صفحة (${pageTitle})، ما هو الإجراء الصحيح عند الإجابة على الأسئلة الوزارية؟`,
          options: [
            "تطبيق القواعد والشروط المذكورة في الدرس بدقة حرفية",
            "اختيار الإجابة الأطول دائماً دون قراءة الشروط",
            "تغيير سياق الجملة بشكل عشوائي",
            "إلغاء أدوات الربط والقرائن الزمنية"
          ],
          correct: 0,
          tip: "احرص على مطابقة القواعد والشروط النموذجية."
        },
        {
          question: `س2: ما هي التوصية الذهبية لتثبيت فهم هذا الموضوع؟`,
          options: [
            "التطبيق الفوري واستخدام النقر للإظهار للتحقق من الحل",
            "حفظ الأسئلة بدون فهم القاعدة",
            "تأجيل مراجعة الأمثلة التطبيقية",
            "تجاوز الملاحظات الوزارية الهامة"
          ],
          correct: 0,
          tip: "التدريب العملي والمطابقة الوزارية يضمنان الدرجة الكاملة."
        }
      ];
    };

    if (Array.isArray(effectivePageData?.pages) && effectivePageData.pages.length > 0) {
      effectivePageData.pages.forEach((p: any, idx: number) => {
        const pNum = p.pageNumber || idx + 1;
        const pTitle = p.title || `الصفحة ${pNum}`;
        const pSub = p.subtitle || p.tag || unit;
        const pTag = p.tag || `الموضوع ${idx + 1}`;
        const raw = p.rawText || p.extractedText || p.fallbackContent || (Array.isArray(p.content) ? p.content.join("\n") : (typeof p.content === 'string' ? p.content : ''));

        let nodes: StructuredContentNode[] = [];
        const candidateBlocks = p.structuredContent || p.structured_content || p.blocks || p.content_blocks || p.items || p.sections;
        const isOnlyPlaceholder = Array.isArray(candidateBlocks) && (
          candidateBlocks.length === 0 ||
          (candidateBlocks.length === 1 && (
            candidateBlocks[0]?.content?.includes("تم استخراج محتوى الصفحة بنجاح وجاري إعداده") ||
            candidateBlocks[0]?.title === "المحتوى التعليمي" ||
            candidateBlocks[0]?.content?.includes("ممسوحة")
          ))
        );

        if (Array.isArray(candidateBlocks) && candidateBlocks.length > 0 && !isOnlyPlaceholder) {
          nodes = candidateBlocks.map((n: any) => ({
            ...n,
            linguisticAnalysis: n.linguisticAnalysis || (n.solutionText ? `التحليل الاستنباطي: يرتكز هذا الفرع على ربط القاعدة الوزارية بالقرائن الصريحة داخل الجملة.` : undefined),
            difficulty: n.difficulty || (idx % 2 === 0 ? 'أصحاب الـ 100' : 'استنباط دلالي')
          }));
        } else if (raw && raw.trim().length > 0) {
          nodes = parseLiteralTextToBlocks(raw);
        }

        if (nodes.length === 0) {
          nodes = [
            {
              type: "paragraph",
              content: raw || `محتوى الصفحة ${pNum}`
            }
          ];
        }

        let quizItems: any[] = [];
        const candidateQuiz = p.quiz || p.quizQuestions || p.quiz_questions || p.questions || p.mcqs;
        if (Array.isArray(candidateQuiz) && candidateQuiz.length > 0) {
          quizItems = candidateQuiz.map((q: any) => ({
            question: q.question || q.text || q.title || "سؤال اختباري",
            options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
            correct: typeof q.correct === 'number' ? q.correct : 0,
            tip: q.explanation || q.tip || "راجع نص المادة العلمية أعلاه."
          }));
        } else {
          quizItems = buildFallbackQuiz(pTitle, raw, nodes);
        }

        let ministerialItems: any[] = [];
        const candidateMinisterial = p.ministerialQuestions || p.ministerial_questions || p.ministerials;
        if (Array.isArray(candidateMinisterial) && candidateMinisterial.length > 0) {
          ministerialItems = candidateMinisterial.map((m: any) => ({
            question: m.question || m.text || "سؤال وزاري",
            answer: m.answer || m.solution || "الجواب النموذجي وفق الضوابط الوزارية",
            years: m.years || m.year || "مقرر وزاري",
            session: m.session || "الدور الأول (د1)",
            year: m.year || "2024"
          }));
        }

        pagesList.push({
          pageNumber: pNum,
          title: pTitle,
          subtitle: pSub,
          tag: pTag,
          unit,
          structuredContent: nodes,
          rawText: raw,
          quiz: quizItems,
          ministerialQuestions: ministerialItems
        });
      });
    } else if (effectivePageData) {
      const raw = effectivePageData.rawText || effectivePageData.extractedText || (Array.isArray(effectivePageData.content) ? effectivePageData.content.join("\n") : (typeof effectivePageData.content === 'string' ? effectivePageData.content : ''));
      let nodes: StructuredContentNode[] = [];

      const candidateBlocks = effectivePageData.structuredContent || effectivePageData.structured_content || effectivePageData.blocks || effectivePageData.content_blocks || effectivePageData.items;
      const isOnlyPlaceholder = Array.isArray(candidateBlocks) && (
        candidateBlocks.length === 0 ||
        (candidateBlocks.length === 1 && (
          candidateBlocks[0]?.content?.includes("تم استخراج محتوى الصفحة بنجاح وجاري إعداده") ||
          candidateBlocks[0]?.title === "المحتوى التعليمي"
        ))
      );

      if (Array.isArray(candidateBlocks) && candidateBlocks.length > 0 && !isOnlyPlaceholder) {
        nodes = candidateBlocks;
      } else if (raw && raw.trim().length > 0) {
        nodes = parseLiteralTextToBlocks(raw);
      }

      if (nodes.length === 0) {
        nodes = [{ type: 'paragraph', content: raw || 'المحتوى المعتمد' }];
      }

      let quizItems: any[] = [];
      const candidateQuiz = effectivePageData.quiz || effectivePageData.quizQuestions || effectivePageData.quiz_questions || effectivePageData.questions || effectivePageData.mcqs;
      if (Array.isArray(candidateQuiz) && candidateQuiz.length > 0) {
        quizItems = candidateQuiz.map((q: any) => ({
          question: q.question || q.text || q.title || "سؤال اختباري",
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
          correct: typeof q.correct === 'number' ? q.correct : 0,
          tip: q.explanation || q.tip || "راجع نص المادة العلمية أعلاه."
        }));
      } else {
        quizItems = buildFallbackQuiz(title, raw, nodes);
      }

      pagesList.push({
        pageNumber: 1,
        title: title,
        subtitle: effectivePageData.subtitle || unit,
        tag: effectivePageData.tag || "الموضوع الأول",
        unit,
        structuredContent: nodes,
        rawText: raw,
        quiz: quizItems,
        ministerialQuestions: effectivePageData.ministerialQuestions || effectivePageData.ministerial_questions || []
      });
    }

    if (pagesList.length === 0) {
      pagesList.push({
        pageNumber: 1,
        title: "الدرس النموذجي الأول: قواعد الربط الزمني",
        subtitle: "الوحدة الأولى: الماضي البسيط والمستمر",
        tag: "قواعد اللغة",
        unit: "الوحدة الأولى",
        structuredContent: [
          {
            type: "heading",
            content: "1. الماضي المستمر (Past Continuous)"
          },
          {
            type: "paragraph",
            content: "نستخدم الماضي المستمر للتعبير عن حدث كان مستمراً في فترة معينة في الماضي. وتتكون قاعدته الأساسية من: Subject + was/were + v.ing"
          },
          {
            type: "question",
            questionText: "سؤال وزاري مقرر: While Ali (have) a shower, somebody knocked at the front door.",
            solutionText: "was having (لأن الأداة While يتبعها ماضي مستمر دائماً لوصف الحدث الطويل)",
            linguisticAnalysis: "الفعل الأول مستمر (was having) والحدث القاطع بالماضي البسيط (knocked).",
            difficulty: "أصحاب الـ 100"
          },
          {
            type: "note",
            content: "ملاحظة وزارية هامة: دائماً نستخدم الماضي المستمر بعد (while/as)، والماضي البسيط بعد (when/and)."
          }
        ],
        rawText: "الدرس النموذجي الأول: قواعد الربط الزمني",
        quiz: [
          {
            question: "س1: ما هو الزمن المستخدم بعد while مباشرة؟",
            options: ["الماضي البسيط", "الماضي المستمر", "المستقبل", "المضارع التام"],
            correct: 1,
            tip: "تستخدم While لوصف الحدث الطويل المستمر."
          },
          {
            question: "س2: الأفعال بعد when و and تكون في صيغة:",
            options: ["الماضي البسيط", "الماضي المستمر", "المصدر المجرد", "التصريف الثالث"],
            correct: 0,
            tip: "الأداة When تقطع الاستمرار بالماضي البسيط."
          }
        ]
      });
    }

    return {
      docTitle: title,
      unitTitle: unit,
      normalizedPages: pagesList
    };
  }, [effectivePageData]);

  const totalPages = normalizedPages.length;
  const currentPage = normalizedPages[currentPageIndex] || normalizedPages[0];

  // Initialize Idea Bank notes from local storage
  useEffect(() => {
    const storageKey = `s6_knights_notes_${docTitle}`;
    const saved = safeStorage.getItem(storageKey);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading notes", e);
      }
    } else {
      setNotes([
        {
          id: '1',
          text: `ملاحظة ذكية حول ${docTitle}: التركيز على شروط التطبيق الوزاري وحل الأمثلة.`,
          tag: 'فكرة ذهبية',
          createdAt: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [docTitle]);

  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    safeStorage.setItem(`s6_knights_notes_${docTitle}`, JSON.stringify(updated));
  };

  const handleAddNote = (text: string, tag: NoteCategory, pageNumber?: number) => {
    const newNote: NoteItem = {
      id: Date.now().toString(),
      text,
      tag,
      pageNumber: pageNumber || (currentPageIndex + 1),
      createdAt: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newNote, ...notes];
    saveNotes(updated);
    setIsIdeaBankOpen(false);
    playSfx('pop');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    playSfx('pop');
  };

  // Scroll to top on page/tab change
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setShowAllSolutionsOnPage(false);
  }, [currentPageIndex, activeTab]);

  // 60s In-Page Challenge Timer
  useEffect(() => {
    let timer: any;
    if (challengeMode && timeLeft > 0 && !showChallengeResult) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && challengeMode && !showChallengeResult) {
      setShowChallengeResult(true);
      playSfx('wrong');
    }
    return () => clearInterval(timer);
  }, [challengeMode, timeLeft, showChallengeResult]);

  const startInPageChallenge = () => {
    // Collect all candidate questions directly and exclusively from the current page
    const pool: Array<{
      question: string;
      options: string[];
      correct: number;
      tip: string;
    }> = [];

    // 1. Explicit quiz questions on the current page
    if (Array.isArray(currentPage.quiz) && currentPage.quiz.length > 0) {
      currentPage.quiz.forEach((q: any) => {
        if (q && (q.question || q.text)) {
          const rightAns = Array.isArray(q.options) && typeof q.correct === 'number' ? q.options[q.correct] : (q.answer || "الإجابة النموذجية الصحيحة");
          const dist1 = (q.options && q.options.find((o: string) => o !== rightAns)) || "خيار بديل غير مطابق للشروط";
          const dist2 = "صيغة تخالف سياق القاعدة في المنهج";
          const dist3 = "استثناء غير معمول به في هذا التمرين";
          const rawOptions = Array.isArray(q.options) && q.options.length >= 2 ? [...q.options] : [rightAns, dist1, dist2, dist3];
          
          while (rawOptions.length < 4) {
            rawOptions.push(`خيار تشتيتي إضافي ${rawOptions.length + 1}`);
          }
          const shuffledOptions = [...rawOptions].sort(() => Math.random() - 0.5);
          pool.push({
            question: q.question || q.text,
            options: shuffledOptions,
            correct: shuffledOptions.indexOf(rightAns) !== -1 ? shuffledOptions.indexOf(rightAns) : 0,
            tip: q.tip || q.explanation || "استند إلى نص القاعدة المذكورة في هذه الصفحة."
          });
        }
      });
    }

    // 2. Structured content questions from current page
    const questionNodes = (currentPage.structuredContent || []).filter(n => n.type === 'question' && (n.questionText || n.content));
    questionNodes.forEach(qn => {
      const qText = qn.questionText || qn.content || "";
      const rightAns = qn.solutionText || "الإجابة النموذجية الوزارية المعتمدة";
      const wrong1 = "تطبيق غير مطابق لقرائن الجملة";
      const wrong2 = "صيغة مغايرة للشروط الوزارية";
      const wrong3 = "اختيار مخالف للسياق المعتمد";
      const options = [rightAns, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      pool.push({
        question: qText,
        options,
        correct: options.indexOf(rightAns),
        tip: qn.linguisticAnalysis || qn.solutionText || "راجع الشروط والقرائن المذكورة في هذه الصفحة."
      });
    });

    // 3. Ministerial questions attached to current page
    if (Array.isArray(currentPage.ministerialQuestions) && currentPage.ministerialQuestions.length > 0) {
      currentPage.ministerialQuestions.forEach((mq: any) => {
        const qText = mq.question || mq.questionText || mq.text;
        if (qText) {
          const rightAns = mq.answer || mq.solutionText || mq.solution || "الجواب الوزاري النموذجي";
          const wrong1 = "خيار بديل غير مطابق للضوابط الوزارية";
          const wrong2 = "صيغة غير دقيقة للتشتيت";
          const wrong3 = "حالة استثنائية غير مطابقة";
          const options = [rightAns, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
          pool.push({
            question: `سؤال وزاري (${mq.year || ''} ${mq.session || ''}): ${qText}`,
            options,
            correct: options.indexOf(rightAns),
            tip: mq.linguisticAnalysis || "مطابقة حرفية لضوابط مركز الفحص الوزاري."
          });
        }
      });
    }

    // 4. Grammar rules / Vocabulary items / Key sentences directly from structuredContent nodes
    (currentPage.structuredContent || []).forEach((node: any) => {
      if (node.type === 'rule' && node.content) {
        const rightAns = node.content;
        const options = [
          rightAns,
          "إهمال شروط التطبيق والقرائن الدالة",
          "استبدال القاعدة بصيغة عشوائية غير معتمدة",
          "تجاوز المحددات النحوية للزمن"
        ].sort(() => Math.random() - 0.5);
        pool.push({
          question: `سؤال قاعدة (${node.title || 'قاعدة الصفحة'}): ما هو الاستنتاج النموذجي؟`,
          options,
          correct: options.indexOf(rightAns),
          tip: "مطابقة حرفية لقاعدة هذه الصفحة."
        });
      }

      if (node.vocabItems && Array.isArray(node.vocabItems) && node.vocabItems.length > 0) {
        node.vocabItems.forEach((v: any) => {
          if (v.en && v.ar) {
            const rightAns = v.ar;
            const otherVocab = node.vocabItems.filter((o: any) => o.ar !== rightAns).map((o: any) => o.ar);
            const dist1 = otherVocab[0] || "معنى مغاير للسياق";
            const dist2 = otherVocab[1] || "مرادف غير دقيق";
            const dist3 = otherVocab[2] || "لفظ غير مطابق";
            const options = [rightAns, dist1, dist2, dist3].sort(() => Math.random() - 0.5);
            pool.push({
              question: `سؤال مفردات من الصفحة: ما المعنى الدقيق للكلمة أو العبارة (${v.en})؟`,
              options,
              correct: options.indexOf(rightAns),
              tip: `المعنى الوزاري الحرفي: ${v.en} = ${v.ar}`
            });
          }
        });
      }
    });

    // 5. Lines from raw text if pool is still small
    const textLines = (currentPage.rawText || "")
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 15 && !l.startsWith('#') && !l.startsWith('http'));

    textLines.forEach((line, idx) => {
      const rightAnswer = line;
      const wrong1 = textLines[(idx + 1) % textLines.length] || "خيار تشتيتي من سياق آخر";
      const wrong2 = textLines[(idx + 2) % textLines.length] || "نص مغاير للشروط المذكورة";
      const wrong3 = "تطبيق خاطئ غير معتمد في هذا الدرس";
      const options = [rightAnswer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      pool.push({
        question: `بناءً على نصوص صفحة (${currentPage.title}): أي العبارات الآتية وردت نصاً ومطابقة للشروط؟`,
        options,
        correct: options.indexOf(rightAnswer),
        tip: "مطابقة تامة للنص الحرفي للصفحة."
      });
    });

    // Fallbacks if page has minimal text
    if (pool.length < 5) {
      const pageTitle = currentPage.title || "الدرس الحالي";
      const fillerQuestions = [
        {
          question: `سؤال تحدي الـ 60 ثانية: ما المحور الأساسي لدرس (${pageTitle})؟`,
          options: [
            `فهم وتطبيق القواعد والمفردات الواردة في صفحة ${currentPage.pageNumber || 1} بدقة`,
            "تخطي قراءة الشروط والاعتماد على التخمين",
            "حذف القرائن اللغوية المحددة للحل",
            "اختيار الحلول غير المعيارية"
          ],
          correct: 0,
          tip: "راجع أهداف ومحتوى الصفحة الحالية."
        },
        {
          question: `في ضوابط السادس الوزاري لمحتوى (${pageTitle}): كيف يتم التعامل مع المطالب؟`,
          options: [
            "الالتزام الحرفي بالقرائن والصيغ الوزارية المعتمدة",
            "تغيير زمن الجملة دون مبرر نحوي",
            "إهمال الأدوات الرابطة والعلامات",
            "الاعتماد على إجابات غير مكتملة"
          ],
          correct: 0,
          tip: "التركيز على القرائن يضمن الدرجة الكاملة."
        },
        {
          question: `ما هو المعيار المعتمد لتحقيق الـ 100 في (${pageTitle})؟`,
          options: [
            "الاستيعاب الشامل لجميع الأمثلة والملاحظات الواردة في الصفحة",
            "حفظ العناوين فقط دون دراسة الأمثلة",
            "تجاهل الفروقات الدلالية في التمارين",
            "عدم مراجعة الحلول النموذجية"
          ],
          correct: 0,
          tip: "الدقة في التفاصيل سر التفوق."
        }
      ];
      fillerQuestions.forEach(fq => {
        const shuffled = [...fq.options].sort(() => Math.random() - 0.5);
        pool.push({
          ...fq,
          options: shuffled,
          correct: shuffled.indexOf(fq.options[0])
        });
      });
    }

    // Shuffling the entire pool and selecting 5 distinct questions
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selectedFive = shuffledPool.slice(0, 5);

    setDynamicQuiz(selectedFive);
    setTimeLeft(60);
    setActiveQuestionIdx(0);
    setChallengeAnswers({});
    setShowChallengeResult(false);
    setChallengeMode(true);
    playSfx('pop');
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    setChallengeAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    playSfx('pop');

    if (questionIdx < (dynamicQuiz.length - 1)) {
      setTimeout(() => setActiveQuestionIdx(prev => prev + 1), 350);
    } else {
      setTimeout(() => {
        setShowChallengeResult(true);
        if (!completedChallenges.includes(currentPageIndex)) {
          setCompletedChallenges(prev => {
            const next = [...prev, currentPageIndex];
            safeStorage.setItem(`s6_completed_challenges_${docTitle}`, JSON.stringify(next));
            return next;
          });
        }
        if (!completedPages.includes(currentPageIndex)) {
          setCompletedPages(prev => {
            const next = [...prev, currentPageIndex];
            safeStorage.setItem(`s6_completed_pages_${docTitle}`, JSON.stringify(next));
            return next;
          });
        }
        setShowConfetti(true);
        playSfx('success');
      }, 400);
    }
  };

  const jumpToPage = (index: number) => {
    if (index >= 0 && index < totalPages) {
      setCurrentPageIndex(index);
      setActiveTab('station1');
      playSfx('click');
    }
  };

  // Build Topic Passes with Ministerial Questions extracted STRICTLY from pages of that topic
  const topicPasses: TopicPass[] = useMemo(() => {
    const list: TopicPass[] = [];

    const groupSize = totalPages <= 3 ? 1 : totalPages > 6 ? 3 : 2;
    for (let i = 0; i < totalPages; i += groupSize) {
      const pIndices: number[] = [];
      for (let j = i; j < Math.min(i + groupSize, totalPages); j++) {
        pIndices.push(j);
      }

      const firstPage = normalizedPages[i];
      const doneInTopic = pIndices.filter(idx => completedPages.includes(idx)).length;
      const topicName = firstPage?.title || `الموضوع ${Math.floor(i / groupSize) + 1}`;

      // Extract ministerial questions STRICTLY from pages in this topic pass!
      const passMinisterialQuestions: MinisterialQuestion[] = [];
      pIndices.forEach(pIdx => {
        const page = normalizedPages[pIdx];
        if (!page) return;

        // 1. From question nodes
        page.structuredContent.forEach(node => {
          if (node.type === 'question' && node.questionText) {
            passMinisterialQuestions.push({
              questionText: node.questionText,
              options: [
                node.solutionText || "الإجابة الوزارية النموذجية الأولى",
                "خيار بديل غير مطابق لشروط القاعدة",
                "صيغة غير صحيحة للتشتيت",
                "حالة استثنائية غير مطابقة"
              ],
              correct: 0,
              solutionText: node.solutionText,
              tip: node.linguisticAnalysis || "راجع نص القاعدة والشروط الوزارية.",
              pageNumber: page.pageNumber
            });
          }
        });

        // 2. From page quiz items
        page.quiz.forEach(q => {
          passMinisterialQuestions.push({
            questionText: q.question,
            options: q.options,
            correct: q.correct,
            solutionText: q.options[q.correct],
            tip: q.tip,
            pageNumber: page.pageNumber
          });
        });
      });

      // Fallback ministerial question if none found
      if (passMinisterialQuestions.length === 0) {
        passMinisterialQuestions.push({
          questionText: `سؤال وزاري حول (${topicName}): ما الشرط النموذجي لتطبيق القواعد الوزارية؟`,
          options: [
            "المطابقة الحرفية للزمن ومراعاة القرائن الصريحة",
            "إهمال الأدوات الرابطة",
            "اختيار الإجابة عشوائياً",
            "حذف الأفعال الرئيسية"
          ],
          correct: 0,
          tip: "الالتزام بالشروط والقرائن الصريحة يضمن الدرجة الكاملة.",
          pageNumber: firstPage?.pageNumber || 1
        });
      }

      list.push({
        id: `topic_pass_${i}`,
        topicTitle: topicName,
        unit: firstPage?.unit || unitTitle,
        pageIndices: pIndices,
        completedCount: doneInTopic,
        totalCount: pIndices.length,
        remainingCount: pIndices.length - doneInTopic,
        isFinished: doneInTopic === pIndices.length,
        ministerialQuestions: passMinisterialQuestions
      });
    }

    return list;
  }, [normalizedPages, totalPages, completedPages, unitTitle]);

  const overallEfficiency = Math.round((completedPages.length / Math.max(1, totalPages)) * 100);

  // Derive Ministerial Questions count
  const ministerialCount = useMemo(() => {
    let count = 0;
    normalizedPages.forEach(p => {
      p.structuredContent.forEach(n => {
        if (n.type === 'question' && n.questionText) count++;
      });
      p.quiz.forEach(q => {
        if (q.question) count++;
      });
    });
    return Math.max(count, 4);
  }, [normalizedPages]);

  // Check if current page has general voice note
  const pageVoiceKey = `s6_page_voice_${docTitle}_p${currentPageIndex}`;
  const [hasPageVoiceNote, setHasPageVoiceNote] = useState(false);
  useEffect(() => {
    setHasPageVoiceNote(Boolean(safeStorage.getItem(`s6_voicenote_${pageVoiceKey}`)));
  }, [pageVoiceKey]);

  const handleAttachIllustration = (illustration: PageIllustration) => {
    setAttachedIllustrations(prev => ({
      ...prev,
      [currentPageIndex]: [...(prev[currentPageIndex] || []), illustration]
    }));
    playSfx('success');
  };

  const fontClass = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-loose',
    large: 'text-lg leading-loose',
    massive: 'text-xl leading-loose'
  }[fontSize];

  const handleToggleHighlightNode = (key: string) => {
    if (!highlighterActive) return;
    setHighlightedNodes(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = highlightColor;
      }
      return next;
    });
    playSfx('pop');
  };

  const renderTextWithCloze = (text: string, nodeKey: string) => {
    if (!clozeModeActive) return text;

    // Pattern to mask: English keywords, brackets, rule tokens
    const tokens = text.split(/(\([^\)]+\)|\[[^\]]+\]|\b[A-Za-z\+\/\-]{3,}\b)/g);
    return tokens.map((part, pIdx) => {
      const isTarget = /(\([^\)]+\)|\[[^\]]+\]|\b[A-Za-z\+\/\-]{3,}\b)/.test(part);
      if (!isTarget) return part;

      const clozeKey = `${nodeKey}_cloze_${pIdx}`;
      const isRevealed = revealedCloze[clozeKey];

      return (
        <span
          key={pIdx}
          onClick={(e) => {
            e.stopPropagation();
            setRevealedCloze(prev => ({ ...prev, [clozeKey]: !prev[clozeKey] }));
            playSfx('pop');
          }}
          className={`inline-block px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-all duration-300 font-mono text-xs ${
            isRevealed 
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm' 
              : 'bg-indigo-950/90 text-transparent select-none blur-[4px] hover:blur-[2px] border border-indigo-400/30 ring-1 ring-indigo-500/40'
          }`}
          title={isRevealed ? "انقر لإعادة الإخفاء" : "انقر لكشف الكلمة المحجوبة 🙈"}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <div 
      id="sixth-academy-pro-container"
      onMouseMove={(e) => {
        if (focusRulerActive) {
          setMousePos({ y: e.clientY });
        }
      }}
      className={`fixed inset-0 z-[200] ${highContrast ? 'bg-[#020308]' : 'bg-gradient-to-br from-[#060814] via-[#0D1124] to-[#080A16]'} text-white flex overflow-hidden font-sans select-text`}
      dir="rtl"
    >
      {showConfetti && <ConfettiEffect />}

      {/* Focus Ruler Overlay (Clean, non-obscuring reading band) */}
      {focusRulerActive && (
        <div 
          className="fixed left-0 right-0 pointer-events-none z-[150] transition-transform duration-75 select-none"
          style={{ top: `${mousePos.y - 18}px` }}
        >
          <div className="w-full h-9 bg-amber-400/[0.08] border-y border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] backdrop-brightness-110 pointer-events-none" />
        </div>
      )}

      {/* Ambient Lighting */}
      <div className="absolute top-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[45vw] h-[45vw] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Glassmorphism Sidebar */}
      <aside 
        className={`fixed md:static top-0 right-0 bottom-0 z-40 w-72 sm:w-80 h-full flex-shrink-0 bg-[#0A0D1C]/90 md:bg-[#0A0D1C]/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 flex items-center justify-between border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/15 hover:text-white transition-all border border-white/10 hover:border-amber-400/40 shadow-sm cursor-pointer"
              title="العودة للمنصة الرئيسية"
            >
              <ChevronRight size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-l from-amber-300 via-white to-white tracking-tight">
                بوابة بيرق Gate 6
              </h1>
              <p className="text-[9px] text-amber-400 font-bold tracking-widest mt-0.5">
                العرض التفاعلي الذكي V2
              </p>
            </div>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-2 text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.01]">
          <div className="space-y-1 text-right">
            {allAvailableBooklets.length > 1 ? (
              <select
                value={effectivePageData?.id || ""}
                onChange={(e) => {
                  setSelectedBookletId(e.target.value);
                  setCurrentPageIndex(0);
                }}
                className="w-full bg-[#12162a] border border-indigo-500/30 rounded-lg px-2 py-1.5 text-xs text-white font-bold outline-none focus:border-indigo-400 mb-1.5"
              >
                {allAvailableBooklets.map((b, idx) => (
                  <option key={b.id || idx} value={b.id} className="bg-[#0e1222] text-white">
                    {b.title || `ملزمة / صفحة ${idx + 1}`} {b.pages?.length ? `(${b.pages.length} ص)` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-white block truncate">{docTitle}</span>
            )}
            <span className="text-[10px] text-indigo-300/80 font-mono block truncate">{unitTitle}</span>
            
            <div className="pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                <span className="text-white/60">كفاءة الإنجاز الشاملة:</span>
                <span className="font-mono text-[#00E5FF] font-black">{overallEfficiency}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-[#00E5FF] to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${overallEfficiency}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          
          {/* 📚 المحطة الأولى */}
          <button 
            onClick={() => {
              setActiveTab('station1');
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className={`w-full text-right p-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeTab === 'station1' 
                ? 'bg-indigo-500/20 border border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.2)]' 
                : 'bg-white/[0.02] border border-white/5 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                activeTab === 'station1' 
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-500/40' 
                  : 'bg-[#151828] text-indigo-400 border border-indigo-500/20'
              }`}>
                <BookOpen size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className={`font-black text-xs mb-0.5 ${activeTab === 'station1' ? 'text-white' : 'text-white/80'}`}>
                  المحطة الأولى (المتن الحرفي)
                </h3>
                <p className="text-[10px] text-indigo-300/80 italic font-medium truncate">
                  ({unitTitle} - {docTitle})
                </p>
              </div>
            </div>
            {activeTab === 'station1' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />}
          </button>

          {/* 📡 المحطة الثانية: بطاقات العبور للموضوعات */}
          <button 
            onClick={() => {
              setActiveTab('station2');
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className={`w-full text-right p-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              activeTab === 'station2' 
                ? 'bg-[#00E5FF]/20 border border-[#00E5FF]/40 shadow-[0_0_25px_rgba(0,229,255,0.2)]' 
                : 'bg-white/[0.02] border border-white/5 hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${
                activeTab === 'station2' 
                  ? 'bg-gradient-to-br from-[#00E5FF] to-blue-600 text-black shadow-[#00E5FF]/40 font-black' 
                  : 'bg-[#12182C] text-[#00E5FF] border border-[#00E5FF]/20'
              }`}>
                <Zap size={18} className={activeTab === 'station2' ? 'animate-bounce' : ''} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className={`font-black text-xs ${activeTab === 'station2' ? 'text-white' : 'text-white/80'}`}>
                    محطة بطاقات العبور 📡
                  </h3>
                  <span className="text-[9px] font-mono text-[#00E5FF] font-bold">
                    {topicPasses.filter(t => t.isFinished).length}/{topicPasses.length}
                  </span>
                </div>
                <p className="text-[9px] text-[#00E5FF]/80 font-bold truncate mt-0.5">
                  موضوعات الملف وتحديات البرق الوزارية
                </p>
              </div>
            </div>
            {activeTab === 'station2' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.8)]" />}
          </button>

          <div className="h-2 border-b border-white/5" />

          {/* 🎯 بنك الوزاريات الشامل */}
          <button 
            onClick={() => {
              setIsMinisterialBankOpen(true);
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all cursor-pointer bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 hover:border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.1)] group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-105 transition-transform shrink-0 shadow-md">
              <GraduationCap size={20} />
            </div>
            <div className="flex-1 text-right overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-white block">بنك الوزاريات الشامل 🎯</span>
                <span className="text-[9px] bg-amber-500/30 text-amber-300 font-mono px-1.5 py-0.5 rounded-md font-bold">
                  {ministerialCount} سؤال
                </span>
              </div>
              <span className="text-[9px] text-amber-400/80 font-bold block truncate mt-0.5">
                تصنيف بالسنوات والأدوار مع الاختبار الذكي
              </span>
            </div>
          </button>

          {/* 🗂️ بنك البطاقات الذكية */}
          <button 
            onClick={() => {
              setIsFlashcardsOpen(true);
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20"
          >
            <Layers size={18} />
            <div className="flex-1 text-right">
              <span className="font-bold text-xs block">البطاقات التعليمية ثلاثية الأبعاد 🗂️</span>
              <span className="text-[9px] text-purple-300/60 block">استذكار نشط وتكرار متباعد</span>
            </div>
          </button>

          <div className="h-1 border-b border-white/5" />

          {/* 📡 رادار الذكاء */}
          <button 
            onClick={() => {
              setActiveTab('radar');
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'radar' 
                ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 shadow-[0_0_20px_rgba(0,229,255,0.15)] font-black' 
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Radar size={18} />
            <div className="flex-1 text-right">
              <span className="font-bold text-xs block">رادار الذكاء</span>
              <span className="text-[9px] text-white/40 block">استنباط وتوقعات وزارية ذكية</span>
            </div>
          </button>

          {/* 🏆 قاعة الأبطال */}
          <button 
            onClick={() => {
              setActiveTab('fame');
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'fame' 
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-black' 
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Trophy size={18} />
            <div className="flex-1 text-right">
              <span className="font-bold text-xs block">قاعة الأبطال</span>
              <span className="text-[9px] text-white/40 block">الأوسمة والإنجازات المكتسبة</span>
            </div>
          </button>

          {/* 📝 محاكي الامتحان الوزاري */}
          <button 
            onClick={() => {
              setIsMockExamOpen(true);
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
          >
            <Award size={18} />
            <div className="flex-1 text-right">
              <span className="font-bold text-xs block">محاكي الامتحان الوزاري ⏱️</span>
              <span className="text-[9px] text-emerald-300/70 block">اختبار شامل وتوقيت زمني دقيق</span>
            </div>
          </button>

          {/* 💡 بنك الأفكار */}
          <button 
            onClick={() => {
              setIsIdeaBankOpen(true);
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-white/70 hover:bg-white/5 hover:text-white"
          >
            <Lightbulb size={18} className="text-fuchsia-400" />
            <div className="flex-1 text-right">
              <span className="font-bold text-xs block">بنك الأفكار المصنفة</span>
              <span className="text-[9px] text-white/40 block">تدوين الملاحظات ({notes.length})</span>
            </div>
          </button>

          <div className="h-2 border-b border-white/5" />

          {/* ⚙️ غرفة التحكم */}
          <button 
            onClick={() => {
              setActiveTab('control');
              setMobileSidebarOpen(false);
              playSfx('click');
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'control' 
                ? 'bg-slate-500/20 text-slate-200 border border-slate-500/30 font-black' 
                : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings size={18} />
            <span className="font-bold text-xs">غرفة التحكم والتخصيص</span>
          </button>

        </nav>

        <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[10px] text-white/40 font-mono">
          <span>الصفحات: {totalPages}</span>
          <span>Sixth Academy Pro</span>
        </div>
      </aside>

      {/* Main Screen Content Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden bg-black/30">
        
        {/* Top Header */}
        <header className="h-14 border-b border-white/10 bg-[#080B1A]/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 cursor-pointer"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-md">
                {docTitle}
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-amber-400 font-bold border border-white/5">
                {currentPage.tag || "محتوى معتمد"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </header>

        {/* Sleek Scrollable Icon Toolbar */}
        <TopToolbar
          notesCount={notes.length}
          onOpenIdeaBank={() => setIsIdeaBankOpen(true)}
          onOpenIllustrationGenerator={() => setIsIllustrationModalOpen(true)}
          onRecordPageVoice={() => {
            const el = document.getElementById('page-general-voice-recorder');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          isPageVoiceRecording={false}
          hasPageVoiceNote={hasPageVoiceNote}
          onOpenTopicPasses={() => {
            setActiveTab('station2');
            playSfx('click');
          }}
          completedTopicsCount={topicPasses.filter(t => t.isFinished).length}
          totalTopicsCount={topicPasses.length}
          isTopicPassesActive={activeTab === 'station2'}
          showAllSolutions={showAllSolutionsOnPage}
          onToggleShowAllSolutions={() => {
            const nextState = !showAllSolutionsOnPage;
            setShowAllSolutionsOnPage(nextState);
            const updated: Record<string, boolean> = { ...revealedSolutions };
            currentPage.structuredContent.forEach((node, idx) => {
              if (node.type === 'question' && node.solutionText) {
                updated[`page_${currentPageIndex}_node_${idx}`] = nextState;
              }
            });
            setRevealedSolutions(updated);
            playSfx('pop');
          }}
          fontSize={fontSize}
          onChangeFontSize={(size) => {
            setFontSize(size);
            playSfx('pop');
          }}
          highContrast={highContrast}
          onToggleContrast={() => {
            setHighContrast(!highContrast);
            playSfx('pop');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            setSoundEnabled(!soundEnabled);
            playSfx('pop');
          }}
          // Global-Class Tool Suite Props
          ministerialCount={ministerialCount}
          onOpenMinisterialBank={() => setIsMinisterialBankOpen(true)}
          onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          onOpenComparator={() => setIsComparatorOpen(true)}
          onOpenVoiceIndex={() => setIsVoiceIndexOpen(true)}
          onOpenMockExam={() => setIsMockExamOpen(true)}
          mistakesCount={mistakes.length}
          onOpenMistakesLog={() => setIsMistakesLogOpen(true)}
          onOpenExportSummary={() => setIsExportSummaryOpen(true)}
          focusRulerActive={focusRulerActive}
          onToggleFocusRuler={() => setFocusRulerActive(prev => !prev)}
          clozeModeActive={clozeModeActive}
          onToggleClozeMode={() => setClozeModeActive(prev => !prev)}
          highlighterActive={highlighterActive}
          onToggleHighlighter={() => setHighlighterActive(prev => !prev)}
        />

        {/* Scrollable Main Content Body */}
        <div 
          ref={contentScrollRef}
          className="flex-1 overflow-y-auto scroll-smooth p-4 sm:p-8 md:p-10 pb-32 no-scrollbar relative" 
          id="strict-content-scroll-area"
        >
          <AnimatePresence mode="wait">
            
            {/* 📚 TAB 1: المحطة الأولى (Strict Content Mode & In-Page Tools) */}
            {activeTab === 'station1' && (
              <motion.div 
                key={`page-${currentPageIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Page Title Header Banner */}
                <div className="bg-[#0D122B]/90 border border-indigo-500/20 p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      {/* 💡 Elegant Small Lamp Button for Page Idea Bank */}
                      <button
                        onClick={() => {
                          setIdeaBankInitialText('');
                          setIdeaBankInitialTag('فكرة ذهبية');
                          setIsIdeaBankOpen(true);
                          playSfx('pop');
                        }}
                        className="w-9 h-9 rounded-full bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer relative"
                        title="بنك أفكار الصفحة"
                      >
                        <Lightbulb size={18} className="text-amber-400 animate-pulse fill-amber-400/30" />
                        {notes.filter(n => n.pageNumber === currentPage.pageNumber).length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center shadow-sm">
                            {notes.filter(n => n.pageNumber === currentPage.pageNumber).length}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-white/60">
                      <span>إنجاز الصفحة:</span>
                      <span className="text-[#00E5FF] font-black font-mono">
                        {completedPages.includes(currentPageIndex) ? "100% منجزة ✅" : "قيد المراجعة"}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {currentPage.title || docTitle}
                  </h2>
                  
                  {/* General Voice Note for the entire page */}
                  <div id="page-general-voice-recorder" className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-xs text-indigo-200/70 font-medium">
                      {unitTitle} — استخراج حرفي 100% مدعوم بالشرح الصوتي والرسوم التوضيحية
                    </p>
                    <VoiceRecorderNode
                      nodeKey={pageVoiceKey}
                      label="الشرح الصوتي العام للصفحة 🎙️"
                      isTeacherMode={isTeacherEditMode}
                      onVoiceUpdate={() => setHasPageVoiceNote(Boolean(safeStorage.getItem(`s6_voicenote_${pageVoiceKey}`)))}
                    />
                  </div>
                </div>

                {/* Attached AI Diagrams & Illustrations for this page */}
                {attachedIllustrations[currentPageIndex] && attachedIllustrations[currentPageIndex].length > 0 && (
                  <div className="space-y-4">
                    {attachedIllustrations[currentPageIndex].map((illus) => (
                      <div 
                        key={illus.id}
                        className="bg-[#0C0F26] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-3 relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-amber-400 flex items-center gap-1.5">
                            <Sparkles size={15} />
                            رسم توضيحي ذكي: {illus.title}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">{illus.createdAt}</span>
                        </div>
                        <div 
                          className="w-full flex items-center justify-center overflow-auto rounded-2xl bg-black/40 p-2"
                          dangerouslySetInnerHTML={{ __html: illus.svg }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Structured Cards Stream (بطاقات المحتوى التفاعلية - تصميم البطاقات المتسلسل 100%) */}
                <div className="space-y-6">
                  {/* Top Bar for Card Actions */}
                  <div className="flex items-center justify-between flex-wrap gap-3 bg-white/[0.03] border border-white/10 px-5 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        {currentPage.structuredContent && currentPage.structuredContent.length > 0 
                          ? `${currentPage.structuredContent.length} بطاقة تعليمية منظمة` 
                          : 'المحتوى الحرفي الأصلي'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowAllSolutionsOnPage(prev => !prev);
                        playSfx('pop');
                      }}
                      className="px-4 py-1.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Eye size={14} />
                      <span>{showAllSolutionsOnPage ? 'إخفاء كافة الحلول' : 'إظهار كافة الحلول'}</span>
                    </button>
                  </div>

                  {/* Render Structured Content Nodes as Cards */}
                  {currentPage.structuredContent && currentPage.structuredContent.length > 0 ? (
                    currentPage.structuredContent.map((node, nIdx) => {
                      const nodeKey = `card_${currentPageIndex}_${nIdx}`;
                      const isSolRevealed = showAllSolutionsOnPage || revealedSolutions[nodeKey];
                      const isAnalRevealed = revealedAnalysis[nodeKey];

                      if (node.type === 'heading') {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-gradient-to-r from-amber-500/15 via-indigo-900/30 to-indigo-950/40 border border-amber-400/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 relative overflow-hidden text-right"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black">
                                📑 عنوان رئيسي / محور
                              </span>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="تسجيل صوتي 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-amber-300 leading-snug">
                              {node.title || node.content || ''}
                            </h3>
                            {node.title && node.content && (
                              <p className="text-base text-white/90 leading-relaxed font-medium pt-1">
                                {renderTextWithCloze(node.content, `${nodeKey}_content`)}
                              </p>
                            )}
                          </div>
                        );
                      }

                      if (node.type === 'question') {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-[#0C0F28]/95 border border-indigo-500/30 hover:border-indigo-400/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 transition-all text-right relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-[#00E5FF] border border-cyan-500/30 text-[11px] font-black flex items-center gap-1">
                                  <HelpCircle size={13} />
                                  {node.difficulty || 'سؤال وتطبيق وزاري'}
                                </span>
                                {node.tag && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px] font-bold">
                                    {node.tag}
                                  </span>
                                )}
                              </div>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="شرح السؤال 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>

                            <div className="text-white text-lg sm:text-xl font-bold leading-relaxed">
                              {renderTextWithCloze(node.questionText || node.content || '', `${nodeKey}_q`)}
                            </div>

                            {/* Click to Reveal Solution */}
                            {node.solutionText && (
                              <div className="pt-2 space-y-3">
                                <button
                                  onClick={() => {
                                    setRevealedSolutions(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
                                    playSfx('pop');
                                  }}
                                  className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 hover:from-cyan-500/25 hover:to-indigo-500/25 border border-cyan-400/30 text-cyan-300 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
                                >
                                  {isSolRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                                  <span>{isSolRevealed ? 'إخفاء الإجابة النموذجية' : 'النقر للإظهار (الجواب النموذجي والتعليل)'}</span>
                                </button>

                                <AnimatePresence>
                                  {isSolRevealed && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-base sm:text-lg font-bold space-y-2 shadow-inner">
                                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                                          <CheckCircle2 size={15} />
                                          <span>الجواب النموذجي المعتمد:</span>
                                        </div>
                                        <div className="text-white/95 leading-relaxed">
                                          {node.solutionText}
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Linguistic Analysis */}
                            {node.linguisticAnalysis && (
                              <div className="border-t border-white/5 pt-3">
                                <button
                                  onClick={() => {
                                    setRevealedAnalysis(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
                                    playSfx('pop');
                                  }}
                                  className="text-xs text-amber-400/80 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Sparkles size={13} />
                                  <span>{isAnalRevealed ? 'إخفاء التحليل الاستنباطي' : 'عرض التحليل الاستنباطي الذكي'}</span>
                                </button>
                                {isAnalRevealed && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-200 text-xs leading-relaxed font-medium"
                                  >
                                    {node.linguisticAnalysis}
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (node.type === 'note') {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-amber-950/30 border border-amber-400/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 text-right relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-black flex items-center gap-1">
                                <Lightbulb size={13} className="text-amber-400" />
                                {node.title || 'ملاحظة وزارية ذهبية 💡'}
                              </span>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="تسجيل صوتي 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>
                            <p className="text-base sm:text-lg text-amber-100/95 leading-relaxed font-semibold">
                              {renderTextWithCloze(node.content || '', `${nodeKey}_content`)}
                            </p>
                          </div>
                        );
                      }

                      if (node.type === 'warning') {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-rose-950/30 border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 text-right relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black flex items-center gap-1">
                                <AlertTriangle size={13} className="text-rose-400" />
                                {node.title || 'تنبيه وزاري حرج ⚠️'}
                              </span>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="تسجيل صوتي 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>
                            <p className="text-base sm:text-lg text-rose-100/95 leading-relaxed font-semibold">
                              {renderTextWithCloze(node.content || '', `${nodeKey}_content`)}
                            </p>
                          </div>
                        );
                      }

                      if (node.type === 'example') {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-emerald-950/25 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 text-right relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black flex items-center gap-1">
                                <FileText size={13} />
                                {node.title || 'مثال تطبيقي معتمد 📝'}
                              </span>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="تسجيل صوتي 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>
                            <p className="text-base sm:text-lg text-white/95 leading-relaxed font-medium">
                              {renderTextWithCloze(node.content || '', `${nodeKey}_content`)}
                            </p>
                            {node.solutionText && (
                              <div className="p-4 rounded-2xl bg-emerald-900/30 border border-emerald-500/30 text-emerald-200 text-sm font-bold">
                                💡 الحل: {node.solutionText}
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (node.type === 'law') {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-indigo-950/30 border border-indigo-500/40 rounded-3xl p-6 sm:p-7 shadow-xl space-y-3 text-right relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-black flex items-center gap-1">
                                <BookOpen size={13} />
                                {node.title || 'القاعدة / القانون ⚖️'}
                              </span>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="تسجيل صوتي 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>
                            <p className="text-base sm:text-xl text-indigo-200/95 leading-relaxed font-bold font-mono">
                              {renderTextWithCloze(node.content || '', `${nodeKey}_content`)}
                            </p>
                          </div>
                        );
                      }

                      if (node.type === 'vocabulary' && Array.isArray(node.vocabItems) && node.vocabItems.length > 0) {
                        return (
                          <div 
                            key={nodeKey}
                            className="bg-[#0D122D] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 text-right relative overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-black flex items-center gap-1">
                                <BookOpen size={13} />
                                {node.title || 'المفردات والمعاني اللغوية 📖'}
                              </span>
                              <VoiceRecorderNode
                                nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                                label="تسجيل صوتي 🎙️"
                                isTeacherMode={isTeacherEditMode}
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {node.vocabItems.map((item, vIdx) => (
                                <div key={vIdx} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 transition-all group">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (item.en && 'speechSynthesis' in window) {
                                          window.speechSynthesis.cancel(); // Stop current speech
                                          const utterance = new SpeechSynthesisUtterance(item.en);
                                          utterance.lang = 'en-US';
                                          utterance.rate = 0.9; // Slightly slower for clarity
                                          window.speechSynthesis.speak(utterance);
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-white/40 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
                                      title="استمع للكلمة"
                                    >
                                      <Volume2 size={14} />
                                    </button>
                                    <span className="font-mono font-bold text-cyan-300 text-sm" dir="ltr">{item.en}</span>
                                  </div>
                                  <span className="font-bold text-white/90 text-sm">{item.ar}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // Default / Paragraph / List Card
                      const hasListItems = Array.isArray(node.points) || Array.isArray(node.items);
                      const listItems = node.points || node.items || [];
                      const hasSolutions = Array.isArray(node.solutions);
                      const solutionItems = node.solutions || [];
                      
                      return (
                        <div 
                          key={nodeKey}
                          className={`bg-[#0C0F24] border border-white/10 hover:border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 ${fontClass} text-right relative overflow-hidden transition-all`}
                        >
                          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/50 text-[10px] font-bold">
                              {hasListItems ? 'قائمة / نقاط' : 'فقرة نصية'} {nIdx + 1}
                            </span>
                            <VoiceRecorderNode
                              nodeKey={`${docTitle}_p${currentPageIndex}_node_${nIdx}_audio`}
                              label="شرح الفقرة 🎙️"
                              isTeacherMode={isTeacherEditMode}
                            />
                          </div>
                          
                          {node.content && (
                            <div className="text-white/95 text-base sm:text-lg leading-[2.1] font-medium">
                              {renderTextWithCloze(node.content, `${nodeKey}_content`)}
                            </div>
                          )}

                          {hasListItems && listItems.length > 0 && (
                            <ul className="list-disc list-inside space-y-3 mt-4">
                              {listItems.map((point, pIdx) => (
                                <li key={pIdx} className="text-white/90 text-base sm:text-lg leading-relaxed marker:text-amber-500 pr-2">
                                  {renderTextWithCloze(point, `${nodeKey}_pt_${pIdx}`)}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Fallback Solution Reveal for missing structural nodes */}
                          {(node.solutionText || (hasSolutions && solutionItems.length > 0)) && (
                            <div className="pt-3 space-y-3 mt-2 border-t border-white/5">
                              <button
                                onClick={() => {
                                  setRevealedSolutions(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
                                  playSfx('pop');
                                }}
                                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-400/20 text-emerald-400 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                              >
                                {isSolRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                                <span>{isSolRevealed ? 'إخفاء الإجابة النموذجية / الحل' : 'النقر لإظهار الحلول / التوضيح 💡'}</span>
                              </button>

                              <AnimatePresence>
                                {isSolRevealed && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-5 mt-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-base font-bold space-y-3 shadow-inner">
                                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                                        <CheckCircle2 size={15} />
                                        <span>الحل النموذجي:</span>
                                      </div>
                                      
                                      {node.solutionText && (
                                        <div className="text-white/95 leading-relaxed whitespace-pre-line">
                                          {node.solutionText}
                                        </div>
                                      )}

                                      {hasSolutions && solutionItems.length > 0 && (
                                        <ul className="list-decimal list-inside space-y-2 mt-2">
                                          {solutionItems.map((sol, sIdx) => (
                                            <li key={sIdx} className="text-white/95 leading-relaxed marker:text-emerald-400">
                                              {sol}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    /* Fallback when no structured nodes: Verbatim Text Sheet */
                    <div className={`bg-[#0C0F24] border border-amber-500/20 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl space-y-8 ${fontClass} text-right relative overflow-hidden`}>
                      <div className="text-white/95 text-lg sm:text-xl leading-[2.2] whitespace-pre-line font-medium space-y-6 pt-4">
                        {currentPage.rawText && currentPage.rawText.trim().length > 0 ? (
                          renderTextWithCloze(currentPage.rawText, `page_sheet_${currentPageIndex}`)
                        ) : (
                          <div className="text-center text-white/50 py-12">
                            لا يتوفر محتوى نصي متاح لهذه الصفحة.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 🏛️ Ministerial Questions Section (كنز الأسئلة الوزارية الخاصة بهذه الصفحة) */}
                {currentPage.ministerialQuestions && currentPage.ministerialQuestions.length > 0 && (
                  <div className="bg-gradient-to-br from-[#071815] to-[#0A1F2D] border border-emerald-500/40 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 text-right relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-emerald-500/20 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Award size={22} />
                        </span>
                        <div>
                          <h3 className="text-lg sm:text-xl font-black text-emerald-300">
                            🏛️ كنز الأسئلة الوزارية الخاصة بهذه الصفحة
                          </h3>
                          <p className="text-xs text-emerald-200/60 font-medium">
                            {currentPage.ministerialQuestions.length} أسئلة وزارية مقتبسة ومطابقة حرفياً للسنوات السابقة
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {currentPage.ministerialQuestions.map((m: any, mIdx: number) => {
                        const mKey = `min_${currentPageIndex}_${mIdx}`;
                        const isRevealed = showAllSolutionsOnPage || revealedMinisterial[mKey];
                        const qText = m.question || m.questionText || m.text || 'سؤال وزاري';
                        const ansText = m.answer || m.solutionText || m.solution || 'الجواب النموذجي وفق الضوابط الوزارية';
                        const yearTag = m.years || m.year || m.session || 'مقرر وزاري';

                        return (
                          <div 
                            key={mKey}
                            className="bg-black/30 border border-emerald-500/25 rounded-2xl p-5 space-y-4 hover:border-emerald-400/40 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="px-3 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 text-[11px] font-black">
                                📅 {yearTag}
                              </span>
                              <span className="text-[10px] text-white/40 font-mono">سؤال وزاري #{mIdx + 1}</span>
                            </div>

                            <div className="text-white text-base sm:text-lg font-bold leading-relaxed">
                              {qText}
                            </div>

                            <button
                              onClick={() => {
                                setRevealedMinisterial(prev => ({ ...prev, [mKey]: !prev[mKey] }));
                                playSfx('pop');
                              }}
                              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                            >
                              {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                              <span>{isRevealed ? 'إخفاء الجواب الوزاري النموذجي' : 'انقر لإظهار الجواب الوزاري النموذجي'}</span>
                            </button>

                            <AnimatePresence>
                              {isRevealed && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-emerald-100 text-sm sm:text-base font-semibold leading-relaxed shadow-inner">
                                    <span className="text-emerald-400 font-black block mb-1">الجواب النموذجي المعتمد:</span>
                                    {ansText}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 60s Challenge In-Page CTA */}
                <div className="pt-6 pb-4 text-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent mb-8" />
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startInPageChallenge}
                    className="relative inline-flex items-center justify-center px-8 sm:px-14 py-4 sm:py-5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-lg sm:text-xl shadow-[0_10px_40px_rgba(245,158,11,0.35)] hover:shadow-[0_10px_60px_rgba(245,158,11,0.55)] transition-all overflow-hidden group cursor-pointer border border-amber-300/30"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                    <Zap className="ml-3 group-hover:scale-125 transition-transform" fill="currentColor" size={24} />
                    ⚡ ابدأ تحدي الـ 60 ثانية (لهذه الصفحة)
                  </motion.button>
                  <p className="mt-3 text-xs font-bold text-white/50">
                    اختبر فهمك لهذه الصفحة فوراً ({Array.isArray(currentPage.quiz) ? `${currentPage.quiz.length} أسئلة اختبارية` : 'سؤالان سريعان'} مع مؤقت تنازلي واكتساب الأوسمة)
                  </p>
                </div>

                {/* Bottom Full-Width Navigation Bar */}
                <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                  <button 
                    id="btn-nav-prev"
                    disabled={currentPageIndex === 0}
                    onClick={() => {
                      if (currentPageIndex > 0) {
                        setCurrentPageIndex(prev => prev - 1);
                        setActiveTab('station1');
                        playSfx('pop');
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-2xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                      currentPageIndex === 0 
                        ? 'text-white/20 bg-white/5 border border-white/5 cursor-not-allowed' 
                        : 'bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10 hover:border-indigo-400/40 active:scale-95'
                    }`}
                    title="الصفحة السابقة"
                  >
                    <ChevronRight size={18} className="text-indigo-300" />
                    <span>السابق</span>
                  </button>

                  <div className="shrink-0 px-6 py-3 rounded-2xl bg-[#060814]/80 border border-white/10 text-sm font-mono font-black text-amber-300 flex items-center justify-center shadow-inner">
                    <span>{currentPageIndex + 1} / {totalPages}</span>
                  </div>

                  <button 
                    id="btn-nav-next"
                    disabled={currentPageIndex >= totalPages - 1}
                    onClick={() => {
                      if (currentPageIndex < totalPages - 1) {
                        setCurrentPageIndex(prev => prev + 1);
                        setActiveTab('station1');
                        playSfx('pop');
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-2xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                      currentPageIndex >= totalPages - 1 
                        ? 'text-white/20 bg-white/5 border border-white/5 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.35)] active:scale-95'
                    }`}
                    title="الصفحة التالية"
                  >
                    <span>التالي</span>
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                </div>

              </motion.div>
            )}

            {/* 📡 TAB 2: محطة بطاقات العبور للموضوعات */}
            {activeTab === 'station2' && (
              <motion.div 
                key="station2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
              >
                <TopicPassesStation
                  topicPasses={topicPasses}
                  completedPages={completedPages}
                  currentPageIndex={currentPageIndex}
                  totalPages={totalPages}
                  overallEfficiency={overallEfficiency}
                  onJumpToPage={jumpToPage}
                  onRewardPass={(passId) => {
                    setRewardedPassIds(prev => [...prev, passId]);
                    setShowConfetti(true);
                  }}
                  rewardedPassIds={rewardedPassIds}
                />
              </motion.div>
            )}

            {/* 📡 TAB 3: رادار الذكاء */}
            {activeTab === 'radar' && (
              <motion.div 
                key="radar"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto space-y-6 text-right"
              >
                <div className="bg-[#0D1229]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-[#00E5FF] flex items-center gap-2">
                      <Radar size={24} />
                      <span>رادار الذكاء والتوقعات الوزارية الذكية</span>
                    </h2>
                    <p className="text-white/60 text-xs mt-1">
                      تحليل شامل لمحتوى الملزمة واستنباط الأسئلة الذهبية المتوقعة في الامتحان الوزاري.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {normalizedPages.flatMap(p => p.structuredContent.filter(n => n.type === 'question')).slice(0, 8).map((item, qIdx) => (
                      <div key={qIdx} className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                        <span className="bg-[#00E5FF]/10 text-[#00E5FF] text-[10px] px-2.5 py-0.5 rounded-full font-black border border-[#00E5FF]/20">
                          {item.difficulty || "استنباط وزاري"}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug">{item.questionText}</h4>
                        {item.solutionText && (
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-emerald-300 font-medium">
                            <span className="text-white/40 block text-[10px] mb-0.5">الحل المقترح:</span>
                            {item.solutionText}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 🏆 TAB 4: قاعة الأبطال */}
            {activeTab === 'fame' && (
              <motion.div 
                key="fame"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto space-y-6 text-right"
              >
                <div className="bg-[#0D1229]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-2">
                      <Trophy size={24} />
                      <span>لوحة شرف وقاعة أبطال السادس</span>
                    </h2>
                    <p className="text-white/60 text-xs mt-1">
                      أكمل قراءة الصفحات والتحديات لتضيء الأوسمة الفوسفورية.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl border bg-amber-500/10 border-amber-500/40 text-center space-y-2">
                      <Zap size={28} className="text-amber-400 mx-auto" />
                      <h4 className="font-bold text-sm text-white">بطل الـ 60 ثانية</h4>
                      <p className="text-white/50 text-xs">أكمل تحديات السرعة بنجاح ({completedChallenges.length})</p>
                    </div>

                    <div className="p-5 rounded-2xl border bg-emerald-500/10 border-emerald-500/40 text-center space-y-2">
                      <ShieldCheck size={28} className="text-emerald-400 mx-auto" />
                      <h4 className="font-bold text-sm text-white">درع القارئ الذكي</h4>
                      <p className="text-white/50 text-xs">منجز {completedPages.length} من أصل {totalPages} صفحات</p>
                    </div>

                    <div className="p-5 rounded-2xl border bg-fuchsia-500/10 border-fuchsia-500/40 text-center space-y-2">
                      <Lightbulb size={28} className="text-fuchsia-400 mx-auto" />
                      <h4 className="font-bold text-sm text-white">مفكر المستقبل</h4>
                      <p className="text-white/50 text-xs">مدونة {notes.length} ملاحظة مصنفة في بنك الأفكار</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ⚙️ TAB 6: غرفة التحكم */}
            {activeTab === 'control' && (
              <motion.div 
                key="control"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto space-y-6 text-right"
              >
                <div className="bg-[#0D1229]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                  <div className="border-b border-white/10 pb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-200 flex items-center gap-2">
                      <Settings size={24} />
                      <span>غرفة التحكم والتخصيص</span>
                    </h2>
                    <p className="text-white/60 text-xs mt-1">
                      تحكمي بحجم الخط والمؤثرات الصوتية والتباين لتجربة دراسية مثالية.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-right">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                      <span className="text-xs text-white/70 font-bold block">حجم خط القراءة:</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['small', 'medium', 'large', 'massive'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              setFontSize(size);
                              playSfx('pop');
                            }}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${fontSize === size ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                          >
                            {size === 'small' ? 'صغير' : size === 'medium' ? 'معتدل' : size === 'large' ? 'كبير' : 'ضخم'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-xs text-white font-bold block">المؤثرات الصوتية</span>
                        <span className="text-[10px] text-white/40">أصوات الأزرار والتحديات</span>
                      </div>
                      <button
                        onClick={() => {
                          setSoundEnabled(!soundEnabled);
                          playSfx('pop');
                        }}
                        className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer flex items-center ${soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-white/20 justify-start'}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* Idea Bank Modal with 4 Categories and Page-tagging */}
      <IdeaBankModal
        isOpen={isIdeaBankOpen}
        onClose={() => setIsIdeaBankOpen(false)}
        notes={notes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        currentPageNumber={currentPage.pageNumber}
        initialText={ideaBankInitialText}
        initialTag={ideaBankInitialTag}
        onJumpToPage={(pNum) => jumpToPage(pNum - 1)}
      />

      {/* AI Illustration Generator Modal */}
      <IllustrationGeneratorModal
        isOpen={isIllustrationModalOpen}
        onClose={() => setIsIllustrationModalOpen(false)}
        currentPageTitle={`${docTitle} - ${currentPage.title}`}
        currentPageContent={currentPage.rawText || (currentPage.structuredContent || []).map(n => n.content || n.questionText).join("\n")}
        onAttachToPage={handleAttachIllustration}
      />

      {/* 🎯 Ministerial Question Bank Modal */}
      <MinisterialBankModal
        isOpen={isMinisterialBankOpen}
        onClose={() => setIsMinisterialBankOpen(false)}
        pages={normalizedPages}
        onJumpToPage={(pIdx) => {
          if (pIdx >= 0 && pIdx < totalPages) {
            setCurrentPageIndex(pIdx);
            setActiveTab('station1');
            setIsMinisterialBankOpen(false);
          }
        }}
      />

      {/* 🗂️ 3D Active Recall Flashcards Modal */}
      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        pages={normalizedPages}
      />

      {/* ⚖️ Linguistic Rule Comparator Modal */}
      <ComparatorModal
        isOpen={isComparatorOpen}
        onClose={() => setIsComparatorOpen(false)}
        pages={normalizedPages}
        onJumpToPage={(pIdx) => jumpToPage(pIdx)}
      />

      {/* 🎙️ Podcast / Teacher Voice Index Modal */}
      <VoiceIndexModal
        isOpen={isVoiceIndexOpen}
        onClose={() => setIsVoiceIndexOpen(false)}
        docTitle={docTitle}
        pages={normalizedPages}
        onJumpToPage={(pIdx) => {
          if (pIdx >= 0 && pIdx < totalPages) {
            setCurrentPageIndex(pIdx);
            setActiveTab('station1');
            setIsVoiceIndexOpen(false);
          }
        }}
      />

      {/* ⏱️ Standard Mock Exam Simulation Modal */}
      <MockExamModal
        isOpen={isMockExamOpen}
        onClose={() => setIsMockExamOpen(false)}
        pages={normalizedPages}
        docTitle={docTitle}
        onAddMistake={handleAddMistake}
      />

      {/* 📕 Diagnostic Mistakes Log Modal */}
      <MistakesLogModal
        isOpen={isMistakesLogOpen}
        onClose={() => setIsMistakesLogOpen(false)}
        mistakes={mistakes}
        onClearMistakes={handleClearMistakes}
        onJumpToPage={(pIdx) => {
          if (pIdx >= 0 && pIdx < totalPages) {
            setCurrentPageIndex(pIdx);
            setActiveTab('station1');
            setIsMistakesLogOpen(false);
          }
        }}
      />

      {/* 🖨️ Printable Summary & Cheat-sheet Export Modal */}
      <ExportSummaryModal
        isOpen={isExportSummaryOpen}
        onClose={() => setIsExportSummaryOpen(false)}
        pages={normalizedPages}
        docTitle={docTitle}
        unitTitle={unitTitle}
        notes={notes}
        attachedIllustrations={attachedIllustrations}
      />

      {/* 60s Challenge In-Page Modal */}
      <AnimatePresence>
        {challengeMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 backdrop-blur-xl px-4"
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="w-full max-w-lg bg-gradient-to-b from-[#141833] to-[#0A0D1A] rounded-[2.5rem] p-6 sm:p-8 border-2 border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.2)] relative overflow-hidden text-center"
            >
              <button 
                onClick={() => setChallengeMode(false)}
                className="absolute top-5 left-5 p-3 rounded-full bg-white/10 text-white hover:text-rose-400 hover:bg-rose-500/20 transition-all z-[999] cursor-pointer border border-white/10 hover:border-rose-500/40 shadow-xl"
              >
                <X size={20} strokeWidth={3} />
              </button>

              {!showChallengeResult ? (
                <div className="space-y-5 relative z-10">
                  <div className="w-20 h-20 mx-auto relative flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                      <motion.circle 
                        cx="50" cy="50" r="44" fill="none" 
                        stroke={timeLeft > 15 ? "#00E5FF" : "#F43F5E"} 
                        strokeWidth="8"
                        strokeDasharray="276"
                        strokeDashoffset={(1 - timeLeft / 60) * 276}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`text-2xl font-black font-mono ${timeLeft > 15 ? 'text-[#00E5FF]' : 'text-rose-500 animate-pulse'}`}>
                      {timeLeft}
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl text-right">
                    <h3 className="text-lg font-black text-white">تحدي الـ 60 ثانية</h3>
                    <p className="text-white/50 text-[10px] font-medium">
                      السؤال {activeQuestionIdx + 1} من {dynamicQuiz.length} — من محتوى هذه الصفحة فقط!
                    </p>
                  </div>

                  {dynamicQuiz[activeQuestionIdx] && (
                    <div className="space-y-3 text-right">
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                        <p className="font-bold text-white text-xs sm:text-sm leading-relaxed mb-3">
                          {dynamicQuiz[activeQuestionIdx].question}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {dynamicQuiz[activeQuestionIdx].options.map((opt: string, oIdx: number) => {
                            const isSelected = challengeAnswers[activeQuestionIdx] === oIdx;
                            return (
                              <button 
                                key={oIdx}
                                onClick={() => handleSelectOption(activeQuestionIdx, oIdx)}
                                className={`p-3 rounded-xl border font-bold text-xs transition-all text-right cursor-pointer ${
                                  isSelected 
                                    ? 'border-amber-400 bg-amber-400/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-white/40 pt-2">
                    <span>انقر على الإجابة لتسجيلها والانتقال فوراً</span>
                    <button 
                      onClick={() => setShowChallengeResult(true)}
                      className="text-amber-400 hover:underline"
                    >
                      إنهاء التحدي الآن
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center relative z-10 py-2">
                  <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                    🏆
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white">أحسنتِ إكمال التحدي!</h3>
                    <p className="text-white/60 text-xs mt-1">لقد أكملتِ تحدي الستين ثانية بنجاح باهر ⚡</p>
                  </div>

                  <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl max-w-xs mx-auto">
                    <span className="text-[10px] text-white/40 block">النتيجة المسجلة</span>
                    <span className="text-3xl font-black text-amber-400 block mt-0.5">
                      {Object.keys(challengeAnswers).reduce((acc, qIdx) => {
                        const idx = parseInt(qIdx);
                        const isCorrect = challengeAnswers[idx] === dynamicQuiz[idx]?.correct;
                        return isCorrect ? acc + 1 : acc;
                      }, 0)} / {dynamicQuiz.length}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                      تم فتح وسام "بطل الـ 60 ثانية" في قاعة الأبطال 🏆
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      setChallengeMode(false);
                      if (currentPageIndex < totalPages - 1) {
                        setCurrentPageIndex(prev => prev + 1);
                      }
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    {currentPageIndex < totalPages - 1 ? 'متابعة إلى الصفحة التالية 🚀' : 'إغلاق والعودة للملزمة ✅'}
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
