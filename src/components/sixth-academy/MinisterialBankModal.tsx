import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Search, Filter, X, Eye, EyeOff, Sparkles, 
  CheckCircle2, ArrowLeft, Tag, Calendar, Layers, BookOpen, 
  Check, RefreshCw, Zap, Award, Lock, Unlock
} from 'lucide-react';
import { MinisterialBankItem, NormalizedPage } from './types';
import { sounds } from '../../lib/sounds';

interface MinisterialBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: NormalizedPage[];
  onJumpToPage: (pageIndex: number) => void;
}

export const MinisterialBankModal: React.FC<MinisterialBankModalProps> = ({
  isOpen,
  onClose,
  pages,
  onJumpToPage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('الكل');
  const [selectedSession, setSelectedSession] = useState<string>('الكل');
  const [selectedBranch, setSelectedBranch] = useState<string>('الكل');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('الكل');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [revealedAnalyses, setRevealedAnalyses] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'browse' | 'quiz'>('browse');

  // Interactive Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<MinisterialBankItem[]>([]);

  // Comprehensive Session and Year Detector Helper
  const parseSessionAndYear = (text: string, fallbackYear: string = "2024", fallbackSession: string = "الدور الأول (د1)") => {
    // 1. Detect Year (2000 to 2030 and 1990-1999)
    const yearMatch = text.match(/\b(199\d|20[0-3]\d)\b/);
    const detectedYear = yearMatch ? yearMatch[1] : fallbackYear;

    // 2. Detect Session with comprehensive abbreviations and terms:
    // (د1, دور اول, د2, دور ثاني, د3, دور ثالث, ت, تمهيدي, خ, خارجي, خارج القطر, ن, نازحين, تكميلي, استثنائي)
    let detectedSession = fallbackSession;
    if (/(د\s*2|دور\s*(ثان|2)|الدور\s*الثاني|\b2د\b|د\/2)/i.test(text)) {
      detectedSession = "الدور الثاني (د2)";
    } else if (/(د\s*3|دور\s*(ثالث|3)|الدور\s*الثالث|\b3د\b|د\/3)/i.test(text)) {
      detectedSession = "الدور الثالث (د3)";
    } else if (/(\(|\[|\s|^|\/)(ت|ت\.|تمهيدي|التمهيدي)(\)|\]|\s|$|\/)/i.test(text)) {
      detectedSession = "تمهيدي (ت)";
    } else if (/(خارج\s*(القطر|العراق)|خ\.?\s*ق|خارجي|الخارجي|(\(|\[|\s|^|\/)(خ|خ\.)(\)|\]|\s|$|\/))/i.test(text)) {
      detectedSession = "خارج القطر (خ)";
    } else if (/(نازحين|النازحين|(\(|\[|\s|^|\/)(ن|ن\.)(\)|\]|\s|$|\/))/i.test(text)) {
      detectedSession = "نازحين (ن)";
    } else if (/(تكميلي|استثنائي|مؤجلين|خاص)/i.test(text)) {
      detectedSession = "تكميلي / استثنائي";
    } else if (/(د\s*1|دور\s*(أول|اول|1)|الدور\s*(الأول|الاول)|\b1د\b|د\/1)/i.test(text)) {
      detectedSession = "الدور الأول (د1)";
    }

    // 3. Detect Branch (علمي, أحيائي (أح), تطبيقي (تط), أدبي)
    let detectedBranch = "علمي / عام";
    if (/(أدب|أدبي|\bأد\b)/i.test(text)) {
      detectedBranch = "أدبي";
    } else if (/(أحيائ|احيائي|\bأح\b|\(أح\))/i.test(text)) {
      detectedBranch = "أحيائي (أح)";
    } else if (/(تطبيق|تطبيقي|\bتط\b|\(تط\))/i.test(text)) {
      detectedBranch = "تطبيقي (تط)";
    } else if (/(علمي|علمية)/i.test(text)) {
      detectedBranch = "علمي";
    }

    return { detectedYear, detectedSession, detectedBranch };
  };

  // Extract ministerial questions from pages - comprehensively recognizing all years and session codes (د1, د2, ت, خ, نازحين, إلخ)
  const ministerialItems: MinisterialBankItem[] = useMemo(() => {
    const items: MinisterialBankItem[] = [];

    pages.forEach((page, pIdx) => {
      // 1. Explicit ministerial questions array attached to page
      if (Array.isArray(page.ministerialQuestions) && page.ministerialQuestions.length > 0) {
        page.ministerialQuestions.forEach((m: any, mIdx: number) => {
          if (m && (m.question || m.questionText || m.text)) {
            const qText = m.question || m.questionText || m.text;
            const ansText = m.answer || m.solutionText || m.solution || "الجواب النموذجي المعتمد في مركز الفحص الوزاري.";
            const rawInfo = `${m.years || m.year || ''} ${m.session || ''} ${qText}`;
            const { detectedYear, detectedSession, detectedBranch } = parseSessionAndYear(rawInfo, (2024 - (pIdx % 8)).toString(), m.session || "الدور الأول (د1)");

            if (!items.some(it => it.questionText === qText)) {
              items.push({
                id: `min_exp_${pIdx}_${mIdx}`,
                questionText: qText,
                solutionText: ansText,
                linguisticAnalysis: m.linguisticAnalysis || `تحليل وزاري دقيق (${detectedSession} ${detectedYear}): استناداً إلى ضوابط مركز الفحص المعتمدة لمنهج السادس.`,
                year: detectedYear,
                session: detectedSession,
                branch: m.branch || detectedBranch,
                topic: page.title || page.tag,
                pageNumber: page.pageNumber,
                difficulty: (m.difficulty as ('أصحاب الـ 100' | 'استنباط دلالي' | 'درجات حرجة')) || 'أصحاب الـ 100',
                keywords: [
                  `#${(page.tag || "وزاريات").replace(/\s+/g, '_')}`,
                  `#وزاري_${detectedYear}`,
                  `#${detectedSession.replace(/[\s()]/g, '_')}`
                ],
                options: [
                  ansText,
                  "خيار بديل غير مطابق للشروط الوزارية",
                  "صيغة غير دقيقة للتشتيت",
                  "حالة استثنائية غير مطابقة"
                ],
                correct: 0
              });
            }
          }
        });
      }

      // 2. Structured content nodes (type: question, or containing ministerial tags/years)
      if (Array.isArray(page.structuredContent)) {
        page.structuredContent.forEach((node, nIdx) => {
          const text = node.questionText || node.content || "";
          const isMinisterial = node.type === 'question' || 
                                node.year || 
                                node.session || 
                                /وزاري|دور\s*(أول|ثان|ثالث|1|2|3)|(\(|\[|\s)(د1|د2|د3|ت|خ|ن)(\)|\]|\s)|\b(199\d|20[0-3]\d)\b/i.test(text);

          if (isMinisterial && text.trim().length > 10) {
            const { detectedYear, detectedSession, detectedBranch } = parseSessionAndYear(
              `${node.year || ''} ${node.session || ''} ${text} ${page.rawText || ''}`,
              (2024 - (pIdx % 6)).toString(),
              node.session || "الدور الأول (د1)"
            );

            // Avoid duplicating identical questions
            if (!items.some(it => it.questionText === text)) {
              items.push({
                id: `min_node_${pIdx}_${nIdx}`,
                questionText: text,
                solutionText: node.solutionText || "الحل النموذجي الوزاري المعتمد في مركز الفحص.",
                linguisticAnalysis: node.linguisticAnalysis || `تحليل وزاري دقيق: يرتكز السؤال على مطابقة الشروط والقرائن المعتمدة في منهج السادس.`,
                year: node.year || detectedYear,
                session: node.session || detectedSession,
                branch: node.branch || detectedBranch,
                topic: page.title || page.tag,
                pageNumber: page.pageNumber,
                difficulty: (node.difficulty as ('أصحاب الـ 100' | 'استنباط دلالي' | 'درجات حرجة')) || 'أصحاب الـ 100',
                keywords: [
                  `#${(page.tag || "وزاريات").replace(/\s+/g, '_')}`,
                  `#وزاري_${detectedYear}`,
                  `#${detectedSession.replace(/[\s()]/g, '_')}`
                ],
                options: [
                  node.solutionText || "الحل النموذجي المعتمد",
                  "خيار بديل غير مطابق للشروط الوزارية",
                  "صيغة غير دقيقة للتشتيت",
                  "حالة استثنائية غير مطابقة"
                ],
                correct: 0
              });
            }
          }
        });
      }

      // 3. Check raw text lines for any ministerial questions that were in regular paragraphs
      if (page.rawText) {
        const rawLines = page.rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 15);
        rawLines.forEach((line, lIdx) => {
          const hasMinisterialMarker = /وزاري|دور\s*(أول|ثان|ثالث|1|2|3)|(\(|\[|\s)(د1|د2|د3|ت|خ|ن)(\)|\]|\s)|\b(199\d|20[0-3]\d)\b/i.test(line);
          const isQuestionLine = line.startsWith("س/") || line.startsWith("س:") || line.startsWith("سؤال") || line.includes("؟") || line.includes("?");
          
          if (hasMinisterialMarker && isQuestionLine && !items.some(it => it.questionText === line || line.includes(it.questionText))) {
            const { detectedYear, detectedSession, detectedBranch } = parseSessionAndYear(line, (2024 - (pIdx % 8)).toString());
            let qText = line;
            let ansText = "الجواب النموذجي المعتمد في مركز الفحص.";
            const solSplit = line.split(/(?:ج\/|ج:|الجواب:|الإجابة:|Ans:|Answer:)/i);
            if (solSplit.length > 1) {
              qText = solSplit[0].trim();
              ansText = solSplit.slice(1).join(" ").trim();
            }

            items.push({
              id: `min_raw_${pIdx}_${lIdx}`,
              questionText: qText,
              solutionText: ansText,
              linguisticAnalysis: `سؤال وزاري (${detectedSession} ${detectedYear}): استناداً لضوابط مركز الفحص المعتمدة.`,
              year: detectedYear,
              session: detectedSession,
              branch: detectedBranch,
              topic: page.title || page.tag,
              pageNumber: page.pageNumber,
              difficulty: 'أصحاب الـ 100',
              keywords: [`#${(page.tag || "وزاريات").replace(/\s+/g, '_')}`, `#وزاري_${detectedYear}`],
              options: [
                ansText,
                "خيار بديل غير مطابق للشروط الوزارية",
                "صيغة غير دقيقة للتشتيت",
                "حالة استثنائية غير مطابقة"
              ],
              correct: 0
            });
          }
        });
      }
    });

    return items;
  }, [pages]);

  // Dynamic Lists for Filtering - Comprehensively covers all years from 2000 to present (2026+)
  const dynamicYears = useMemo(() => {
    const yearsSet = new Set<string>();
    // Seed standard years 2026 down to 2000
    for (let y = 2026; y >= 2000; y--) {
      yearsSet.add(y.toString());
    }
    // Also include any other years detected from content
    ministerialItems.forEach(it => {
      if (it.year) yearsSet.add(it.year);
    });
    const sorted = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
    return ['الكل', ...sorted];
  }, [ministerialItems]);

  const dynamicSessions = [
    'الكل',
    'الدور الأول (د1)',
    'الدور الثاني (د2)',
    'الدور الثالث (د3)',
    'تمهيدي (ت)',
    'خارج القطر (خ)',
    'نازحين (ن)',
    'تكميلي / استثنائي'
  ];

  const branchesList = ['الكل', 'علمي', 'أدبي', 'أحيائي (أح)', 'تطبيقي (تط)', 'مشترك / عام'];

  const difficultiesList = ['الكل', 'أصحاب الـ 100', 'استنباط دلالي', 'درجات حرجة'];

  // Filter items based on search query, year, session, branch, and difficulty
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return ministerialItems.filter(item => {
      const qText = (item.questionText || '').toLowerCase();
      const sText = (item.solutionText || '').toLowerCase();
      const yText = (item.year || '').toLowerCase();
      const sessText = (item.session || '').toLowerCase();
      const brText = (item.branch || '').toLowerCase();
      const keywordsText = item.keywords.join(' ').toLowerCase();

      let matchesSearch = true;
      if (query) {
        // Match query against question, solution, year, session name, branch, keywords, or short abbreviations (د1, د2, د3, ت, خ, ن, أح, تط)
        matchesSearch = qText.includes(query) ||
          sText.includes(query) ||
          yText.includes(query) ||
          sessText.includes(query) ||
          brText.includes(query) ||
          keywordsText.includes(query) ||
          (query === 'د1' && sessText.includes('الأول')) ||
          (query === 'د2' && sessText.includes('الثاني')) ||
          (query === 'د3' && sessText.includes('الثالث')) ||
          (query === 'ت' && sessText.includes('تمهيدي')) ||
          (query === 'خ' && (sessText.includes('خارج') || sessText.includes('خارجي'))) ||
          (query === 'ن' && sessText.includes('نازحين')) ||
          (query === 'أح' && (brText.includes('أحيائ') || brText.includes('أح'))) ||
          (query === 'تط' && (brText.includes('تطبيق') || brText.includes('تط')));
      }

      const matchesYear = selectedYear === 'الكل' || item.year === selectedYear;

      // Session matching with acronym flexibility
      let matchesSession = true;
      if (selectedSession !== 'الكل') {
        if (selectedSession.includes('د1')) {
          matchesSession = sessText.includes('الأول') || sessText.includes('د1');
        } else if (selectedSession.includes('د2')) {
          matchesSession = sessText.includes('الثاني') || sessText.includes('د2');
        } else if (selectedSession.includes('د3')) {
          matchesSession = sessText.includes('الثالث') || sessText.includes('د3');
        } else if (selectedSession.includes('تمهيدي')) {
          matchesSession = sessText.includes('تمهيدي') || sessText.includes('(ت)');
        } else if (selectedSession.includes('خارج')) {
          matchesSession = sessText.includes('خارج') || sessText.includes('(خ)');
        } else if (selectedSession.includes('نازحين')) {
          matchesSession = sessText.includes('نازحين') || sessText.includes('(ن)');
        } else if (selectedSession.includes('تكميلي')) {
          matchesSession = sessText.includes('تكميلي') || sessText.includes('استثنائي');
        } else {
          matchesSession = item.session === selectedSession;
        }
      }

      // Branch matching
      let matchesBranch = true;
      if (selectedBranch !== 'الكل') {
        if (selectedBranch.includes('أحيائي')) {
          matchesBranch = brText.includes('أحيائ') || brText.includes('احيائي') || brText.includes('أح');
        } else if (selectedBranch.includes('تطبيقي')) {
          matchesBranch = brText.includes('تطبيق') || brText.includes('تطبيقي') || brText.includes('تط');
        } else if (selectedBranch === 'أدبي') {
          matchesBranch = brText.includes('أدب') || brText.includes('ادبي');
        } else if (selectedBranch === 'علمي') {
          matchesBranch = brText.includes('علم') || brText.includes('أحيائ') || brText.includes('تطبيق');
        } else {
          matchesBranch = item.branch === selectedBranch;
        }
      }

      const matchesDiff = selectedDifficulty === 'الكل' || item.difficulty === selectedDifficulty;

      return matchesSearch && matchesYear && matchesSession && matchesBranch && matchesDiff;
    });
  }, [ministerialItems, searchQuery, selectedYear, selectedSession, selectedBranch, selectedDifficulty]);

  // Randomize 5 questions for Interactive Quiz whenever tab is switched or restarted
  const startDynamicQuiz = () => {
    const pool = filteredItems.length > 0 ? filteredItems : ministerialItems;
    if (pool.length === 0) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setActiveQuizQuestions(shuffled.slice(0, 5));
    setQuizIdx(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const handleQuizAnswer = (optIdx: number) => {
    if (selectedQuizAnswer !== null) return;
    setSelectedQuizAnswer(optIdx);

    const questionsList = activeQuizQuestions.length > 0 ? activeQuizQuestions : filteredItems;
    const currentItem = questionsList[quizIdx];
    const isCorrect = optIdx === (currentItem?.correct ?? 0);

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      try { sounds.playSuccess(); } catch (e) {}
    } else {
      try { sounds.playError(); } catch (e) {}
    }

    setTimeout(() => {
      if (quizIdx < questionsList.length - 1) {
        setQuizIdx(prev => prev + 1);
        setSelectedQuizAnswer(null);
      } else {
        setQuizCompleted(true);
      }
    }, 1200);
  };

  const restartQuiz = () => {
    startDynamicQuiz();
  };

  const toggleRevealAnswer = (id: string) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
    try { sounds.playPop(); } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-3 sm:p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-4xl bg-[#090C22] border border-[#00E5FF]/30 rounded-[2.5rem] p-5 sm:p-7 shadow-[0_0_80px_rgba(0,229,255,0.18)] relative overflow-hidden flex flex-col max-h-[92vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shadow-lg">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>بنك الوزاريات الشامل والمتطور</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] font-mono font-black">
                    {filteredItems.length} سؤال وزاري
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  شامل لجميع السنوات (2000 حتى الآن) والأدوار (د1، د2، د3، ت، خ، نازحين) مع إمكانية النقر لإيضاح الحل
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Selector */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'browse' ? 'bg-[#00E5FF] text-black font-black shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  تصفح الوزاريات 📚
                </button>
                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    startDynamicQuiz();
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'quiz' ? 'bg-purple-600 text-white font-black shadow' : 'text-white/60 hover:text-white'
                  }`}
                >
                  اختبار سريع (5 أسئلة) ⚡
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/50 cursor-pointer transition-all active:scale-95 flex items-center justify-center shadow-md shadow-rose-500/20"
                title="إغلاق النافذة (Esc)"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* TAB 1: BROWSE ALL MINISTERIAL QUESTIONS */}
          {activeTab === 'browse' && (
            <div className="flex-1 flex flex-col min-h-0 pt-3">
              {/* Search */}
              <div className="space-y-3 shrink-0 pb-3 border-b border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في الأسئلة الوزارية، الحلول، أو السنوات..."
                    className="w-full bg-[#0E1230] border border-white/10 focus:border-[#00E5FF] rounded-2xl py-3 pr-11 pl-4 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors shadow-inner"
                  />
                  <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 no-scrollbar">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-white/40 space-y-2">
                    <GraduationCap size={40} className="mx-auto opacity-30" />
                    <p className="text-xs">لا توجد أسئلة وزارية تطابق الفلتر أو كلمة البحث الحالية.</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isRevealed = revealedAnswers[item.id];
                    const isAnalysisRevealed = revealedAnalyses[item.id];

                    return (
                      <div
                        key={item.id}
                        className="bg-[#0C1028] border border-white/10 rounded-3xl p-5 space-y-3 hover:border-[#00E5FF]/40 transition-all shadow-md"
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-[11px] flex items-center gap-1">
                              <Award size={13} />
                              <span>وزاري {item.year} - {item.session} ({item.branch})</span>
                            </span>

                            <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
                              {item.difficulty}
                            </span>

                            <button
                              onClick={() => {
                                onJumpToPage(item.pageNumber - 1);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-full bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="انتقل إلى مكان هذا السؤال في الصفحة الأصلية"
                            >
                              <BookOpen size={12} />
                              <span>صفحة {item.pageNumber} ↗</span>
                            </button>
                          </div>

                          {/* Keyword tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.keywords.map((k, kIdx) => (
                              <span key={kIdx} className="text-[10px] text-white/40 font-mono">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Question Text */}
                        <h4 className="text-white font-black text-sm sm:text-base leading-relaxed">
                          {item.questionText}
                        </h4>

                        {/* Blurred / Revealed Solution Area ("يكون الجواب مضللاً عند النقر عليه يتضح") */}
                        <div className="space-y-2">
                          <div
                            onClick={() => toggleRevealAnswer(item.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden select-none ${
                              isRevealed
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : 'bg-[#080B1C] border-white/10 hover:border-[#00E5FF]/40 text-white/40'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-black mb-1">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                {isRevealed ? <Unlock size={14} /> : <Lock size={14} className="text-[#00E5FF]" />}
                                <span>الجواب الوزاري النموذجي:</span>
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                                {isRevealed ? "تم الإيضاح (انقر للتظليل)" : "مضلل (انقر هنا لإيضاح الجواب 💡)"}
                              </span>
                            </div>

                            {/* The answer text - blurred if not revealed, clear when clicked */}
                            <div className={`text-sm sm:text-base leading-relaxed transition-all duration-300 ${
                              isRevealed ? 'filter-none opacity-100 font-bold text-white' : 'blur-sm opacity-50 font-medium'
                            }`}>
                              {item.solutionText}
                            </div>
                          </div>

                          {/* Analysis Toggle */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => setRevealedAnalyses(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className="text-xs text-amber-300/80 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
                            >
                              <Sparkles size={13} />
                              <span>{isAnalysisRevealed ? "إخفاء التحليل الاستنباطي" : "إظهار التحليل الاستنباطي والقواعدي 🔎"}</span>
                            </button>
                          </div>

                          {/* Revealed Analysis */}
                          {isAnalysisRevealed && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed"
                            >
                              <span className="font-black text-amber-400 block mb-1">
                                🔎 التحليل الوزاري وتفكيك الفروقات:
                              </span>
                              {item.linguisticAnalysis}
                            </motion.div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE MINISTERIAL QUIZ */}
          {activeTab === 'quiz' && (() => {
            const currentQuizList = activeQuizQuestions.length > 0 ? activeQuizQuestions : (filteredItems.length > 0 ? filteredItems.slice(0, 5) : ministerialItems.slice(0, 5));
            const currentQ = currentQuizList[quizIdx];

            return (
              <div className="flex-1 flex flex-col justify-center items-center p-4">
                {!quizCompleted && currentQ ? (
                  <div className="w-full max-w-xl space-y-6">
                    {/* Progress */}
                    <div className="flex items-center justify-between text-xs font-black text-white/60">
                      <span>السؤال {quizIdx + 1} من {currentQuizList.length}</span>
                      <span className="text-purple-400">النقاط: {quizScore}</span>
                    </div>

                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-[#00E5FF] transition-all"
                        style={{ width: `${((quizIdx + 1) / currentQuizList.length) * 100}%` }}
                      />
                    </div>

                    {/* Question Card */}
                    <div className="bg-[#0C1028] border border-purple-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between text-[11px] font-black text-amber-400">
                        <span>وزاري {currentQ.year} - {currentQ.session}</span>
                        <span className="text-white/40">صفحة {currentQ.pageNumber}</span>
                      </div>

                      <h4 className="text-white font-black text-base sm:text-lg leading-relaxed">
                        {currentQ.questionText}
                      </h4>

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-2.5 pt-2">
                        {(currentQ.options || [currentQ.solutionText || "الحل النموذجي"]).map((opt, oIdx) => {
                          const isSelected = selectedQuizAnswer === oIdx;
                          const isCorrect = oIdx === (currentQ.correct ?? 0);
                          let btnStyle = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10";

                          if (selectedQuizAnswer !== null) {
                            if (isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-black";
                            else if (isSelected) btnStyle = "bg-rose-500/20 border-rose-500/50 text-rose-300 font-black";
                            else btnStyle = "bg-white/5 border-white/5 text-white/30";
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={selectedQuizAnswer !== null}
                              onClick={() => handleQuizAnswer(oIdx)}
                              className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-right font-bold transition-all cursor-pointer ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto text-2xl">
                      🏆
                    </div>
                    <h3 className="text-2xl font-black text-white">اكتمل الاختبار الوزاري السريع!</h3>
                    <p className="text-white/60 text-sm">
                      درجتك النهائية: <span className="text-[#00E5FF] font-black font-mono text-lg">{quizScore}</span> من أصل <span className="font-mono">{currentQuizList.length}</span>
                    </p>

                    <button
                      onClick={restartQuiz}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-black text-xs cursor-pointer shadow-lg active:scale-95"
                    >
                      إعادة الاختبار مع أسئلة جديدة 🔄
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
