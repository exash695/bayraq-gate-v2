import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, FileUp, ClipboardCheck, HelpCircle, ScrollText, Edit2, Sparkles, Trophy, ChevronRight, Loader2, Copy, CheckCircle, Image as ImageIcon, X, Save, History, Trash2, Plus, Minus, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import TeacherActivities from "./TeacherActivities";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { uploadFileToR2 } from '../services/uploadService';
import { copyToClipboard } from '../utils/clipboard';
import { BerqCharacter } from './BerqCharacterManager';
import { useRemoteConfig } from '../services/remoteConfig';
import { safeStorage } from '../lib/storage';

interface TeacherAIAssistantProps {
  schoolId: string;
  teacherData?: any;
  selectedClass?: string;
}

type AITool = 'questions' | 'summaries' | 'homework' | 'ideas' | 'competitions' | 'history' | 'activities' | null;

export const TeacherAIAssistant: React.FC<TeacherAIAssistantProps> = ({ schoolId, teacherData, selectedClass }) => {
  const remoteConfig = useRemoteConfig();
  const [activeTool, setActiveTool] = useState<AITool>(() => {
    const targetTool = safeStorage.getItem("s6_target_ai_tool") as AITool;
    if (targetTool) {
      safeStorage.removeItem("s6_target_ai_tool");
      return targetTool;
    }
    return null;
  });

  useEffect(() => {
    const targetTool = safeStorage.getItem("s6_target_ai_tool") as AITool;
    if (targetTool) {
      safeStorage.removeItem("s6_target_ai_tool");
      setActiveTool(targetTool);
    }
  }, []);
  const [topicFiles, setTopicFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [saveName, setSaveName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const [isManualInput, setIsManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const [localQuiz, setLocalQuiz] = useState<any>(null);
  const [lastParsedContent, setLastParsedContent] = useState<string>('');

  useEffect(() => {
    if (generatedContent && generatedContent !== lastParsedContent) {
      try {
        const jsonMatch = generatedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : generatedContent);
        if (parsed && parsed.questions) {
          setLocalQuiz(parsed);
          setLastParsedContent(generatedContent);
        } else {
          setLocalQuiz(null);
        }
      } catch (e) {
        setLocalQuiz(null);
      }
    } else if (!generatedContent) {
      setLocalQuiz(null);
      setLastParsedContent('');
    }
  }, [generatedContent, lastParsedContent]);

  const updateLocalQuiz = (newQuiz: any) => {
    setLocalQuiz(newQuiz);
    const jsonStr = JSON.stringify(newQuiz, null, 2);
    setGeneratedContent(jsonStr);
    setLastParsedContent(jsonStr);
    setIsSaved(false);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsManualInput(false);
    setManualText('');
    
    const performScroll = () => {
      // 1. Scroll local container
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      
      // 2. Scroll parent platform container
      const platformScrollContainer = document.getElementById("main-platform-scroll-container") || document.querySelector(".flex-1.overflow-y-auto.overflow-x-hidden");
      if (platformScrollContainer) {
        platformScrollContainer.scrollTop = 0;
      }

      // 3. Find any parent scroll containers and scroll them to top
      if (scrollContainerRef.current) {
        let parent = scrollContainerRef.current.parentElement;
        while (parent) {
          try {
            const style = window.getComputedStyle(parent);
            const overflowY = style.overflowY || style.overflow || "";
            if (overflowY.includes('auto') || overflowY.includes('scroll') || parent.classList.contains('overflow-y-auto')) {
              parent.scrollTop = 0;
            }
          } catch (e) {}
          parent = parent.parentElement;
        }
      }
      
      // 4. Scroll window
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    // Run immediately
    performScroll();

    // Run after DOM settles (microtasks and macro tasks)
    const t1 = setTimeout(performScroll, 50);
    const t2 = setTimeout(performScroll, 150);
    const t3 = setTimeout(performScroll, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTool]);

  const handlePublish = async () => {
    if (!generatedContent || !schoolId) return;
    setIsPublishing(true);
    try {
      const { db } = await import('../lib/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const targetGrade = selectedClass || (teacherData?.classes && Array.isArray(teacherData.classes) ? teacherData.classes[0] : "الكل");
      const subject = teacherData?.subject || "عام";
      
      const savedItem = savedResults.find(r => r.content === generatedContent);
      const defaultTitle = activeToolData?.title ? `${activeToolData.title} - ${new Date().toLocaleDateString('ar-IQ')}` : 'ملف جديد';
      const finalName = savedItem ? savedItem.name : (saveName.trim() || defaultTitle);
      const toolName = savedItem ? savedItem.tool : (activeToolData?.title || 'عام');

      await addDoc(collection(db, "schools", schoolId, "ai_materials"), {
        name: finalName,
        content: generatedContent,
        tool: toolName,
        subject: subject,
        targetGrade: targetGrade,
        teacherId: teacherData?.id || teacherData?.code || "unknown",
        teacherName: teacherData?.name || "الأستاذ",
        timestamp: serverTimestamp(),
        date: new Date().toISOString()
      });
      setIsPublished(true);
      setTimeout(() => setIsPublished(false), 3000);
      
      if (!isSaved && activeTool !== 'history') {
        handleSave();
      }
    } catch (e) {
      console.error("Publishing failed", e);
    } finally {
      setIsPublishing(false);
    }
  };

  const [savedResults, setSavedResults] = useState<{id: string, name: string, content: string, tool: string, date: string}[]>(() => {
    try {
      const saved = localStorage.getItem('teacher_ai_saved_results');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<'all' | string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: 'questions', title: "توليد أسئلة", desc: "استخراج أسئلة تلقائية استنتاجية أو نصية.", icon: HelpCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: 'summaries', title: "إنشاء ملخصات", desc: "تلخيص الفصول الطويلة لنقاط أساسية للطالب.", icon: ScrollText, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: 'homework', title: "صناعة واجبات", desc: "تكوين أنشطة صفية وواجبات منزلية مبتكرة بضغطة زر.", icon: Edit2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: 'ideas', title: "اقتراحات للشرح", desc: "أفكار وطرق مبتكرة لتوصيل الفكرة وتوضيحها للطلاب.", icon: Sparkles, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
    { id: 'competitions', title: "مسابقات صفية", desc: "إعداد تحديات ومسابقات سريعة للطلاب بأسلوب شيق.", icon: Trophy, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { id: 'history', title: "المحفوظات", desc: "الرجوع للنتائج والملفات التي تم توليدها مسبقاً وحفظها.", icon: History, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" },
    { id: 'activities', title: "متابعة الأنشطة", desc: "تتبع إنجازات الطلاب وتقييم الواجبات والمسابقات.", icon: ClipboardCheck, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTopicFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setTopicFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (topicFiles.length === 0) {
      alert("يرجى إرفاق صور أو ملف الموضوع أولاً.");
      return;
    }
    
    setIsGenerating(true);
    setShowCancelConfirm(false);
    setGeneratedContent('');
    setProgressPercentage(0);
    setProgressText('جاري تحضير الملفات...');
    
    const gradeLevel = teacherData?.classes && Array.isArray(teacherData.classes) ? teacherData.classes.join(" و ") : "مرحلته";
    const subject = teacherData?.subject || "مادته";

    const isEnglish = (subject.includes('انجليزي') || subject.includes('English') || subject.includes('انگليزي') || subject.includes('انكليزي'));
    const englishInstruction = isEnglish 
      ? (activeTool === 'homework' 
          ? "ملاحظة هامة جداً: نظراً لأن المادة هي اللغة الإنجليزية، يجب أن تكون الأسئلة باللغة الإنجليزية، ولكن يجب عليك ترجمة كل سؤال أو بطاقة أو فقرة في الواجب إلى اللغة العربية أو شرحها بالعربية بالتفصيل والوضوح مباشرة تحتها لمساعدة الطلاب على الفهم والحل."
          : "ملاحظة هامة جداً: نظراً لأن المادة هي اللغة الإنجليزية، يجب أن تكون الأسئلة والواجبات والمحتوى الأساسي باللغة الإنجليزية، بالكامل دون استخدام اللغة العربية إلا للشرح البسيط جداً في الهامش إذا دعت الحاجة. يجب كتابة الواجب نفسه والأسئلة باللغة الإنجليزية مباشرة.")
      : "";
    const baseFormatting = `مهم جداً: الإخراج يجب أن يحتوي فقط على المحتوى المطلوب مباشرة. ممنوع كتابة أي مقدمات مثل 'إليك الواجب' أو تحيات. ادخل في صلب الموضوع فوراً لتكون جاهزة للنسخ والمشاركة مباشرة مع الطلاب. رتب المخرجات بنسق Markdown جميل، واستخدم العناوين العريضة والنقاط الواضحة.\n${englishInstruction}`;

    let promptMessage = '';
    switch (activeTool) {
      case 'questions':
        promptMessage = isEnglish
          ? `Hello. Based on the attached files (Subject: English, Grade: ${gradeLevel}), please generate at least 10 comprehensive and high-quality questions in English. Provide multiple choice, true/false, and short analytical questions. Attach the model answers under a separate clear section at the end. \n\n${baseFormatting}`
          : `أهلاً. بناءً على الملفات المرفقة (لموضوع في مادة ${subject} لـ ${gradeLevel})، يرجى استخراج المعلومات الأساسية صفحة بصفحة وتوليد على الأقل 10 أسئلة متنوعة (اختيارات متعددة، صح وخطأ، وأسئلة استنتاجية قصيرة) أو أكثر حسب كمية المحتوى المرفوع. يرجى إرفاق الإجابة النموذجية لكل سؤال تحت بند منفصل ومخفي أو واضح للتصحيح. \n\n${baseFormatting}`;
        break;
      case 'summaries':
        promptMessage = isEnglish
          ? `Hello. Based on the attached files (Subject: English, Grade: ${gradeLevel}), write a comprehensive, simplified, and well-structured lesson summary in English. Organize into clear bullet points and sub-headings. \n\n${baseFormatting}`
          : `أهلاً. بناءً على الملفات المرفقة (مادة ${subject} لـ ${gradeLevel})، صغ لي ملخصاً شاملاً، مبسطاً، ومنظماً في نقاط مركزة صفحة بصفحة. قسم الملخص إلى عناوين فرعية تُسهل على الطلاب مراجعة الدرس بسرعة. \n\n${baseFormatting}`;
        break;
      case 'homework':
        promptMessage = isEnglish
          ? `Hello. Based on the attached files (Subject: English, Grade: ${gradeLevel}), design an innovative, high-quality, and interactive homework assignment in English. 

CRITICAL REQUIREMENT: For each question, card, or activity in this homework, you must write the English question/task first, and immediately below it, provide a clear Arabic translation or a simplified explanation in Arabic. Do not make it only in English.

${baseFormatting}`
          : `أهلاً. بناءً على الملفات المرفقة (مادة ${subject} لـ ${gradeLevel})، اصنع واجبًا منزليًا مبتكرًا صفحة بصفحة يجمع بين التطبيق العملي/البحثي والأسئلة التحليلية. أريد واجباً يكسر الروتين ويثير فضول الطلاب. \n\n${baseFormatting}`;
        break;
      case 'ideas':
        promptMessage = isEnglish
          ? `Hello. I am teaching English (Grade: ${gradeLevel}). Based on the attached files, suggest an innovative and engaging teaching plan in English containing a catchy Hook, a real-life analogy, and a clear step-by-step teaching logic. \n\n${baseFormatting}`
          : `أهلاً. أنا أستاذ لمادة ${subject} (لـ ${gradeLevel}). بناءً على محتوى الملفات المرفقة (اعمل عليها صفحة بصفحة)، اقترح علي خطة شرح مبتكرة تتضمن: مقدمة جاذبة (Hook)، قصة قصيرة أو تشبيه واقعي لتبسيط المفاهيم المعقدة، وتسلسل منطقي لطرح الأفكار أثناء الحصة. \n\n${baseFormatting}`;
        break;
      case 'competitions':
        promptMessage = `أهلاً. انطلاقاً من محتوى الملفات المرفقة (مادة ${subject} لـ ${gradeLevel}) صفحة بصفحة، صمم مسابقة صفية تفاعلية سريعة (تحدي الـ 60 ثانية). أريد 5 أسئلة خيارات متعددة.
يجب أن ترد بـ JSON فقط داخل كتلة كود (code block) كالتالي، ممنوع كتابة أي نص خارج هذه الكتلة:
\`\`\`json
{
  "title": "${isEnglish ? 'English Challenge' : 'عنوان المسابقة'}",
  "questions": [
    {
      "question": "${isEnglish ? 'Question text in English?' : 'نص السؤال؟'}",
      "options": [
        "${isEnglish ? 'Option 1' : 'خيار1'}",
        "${isEnglish ? 'Option 2' : 'خيار2'}",
        "${isEnglish ? 'Option 3' : 'خيار3'}",
        "${isEnglish ? 'Option 4' : 'خيار4'}"
      ],
      "correctAnswerIndex": 0
    }
  ]
}
\`\`\`
\n${englishInstruction}`;
        break;
    }

    let progressInterval: any;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const fileUrls: string[] = [];
      const totalFiles = topicFiles.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = topicFiles[i];
        setProgressText(`جاري رفع الملف ${i + 1} من ${totalFiles}...`);
        
        let url: string;
        try {
          url = await uploadFileToR2(file, (progress) => {
            setProgressText(`جاري رفع الملف ${i + 1} من ${totalFiles}... ${progress}%`);
          });
        } catch (error: any) {
           const errMsg = String(error.message || '');
           if (errMsg.includes('413') || errMsg.includes('<!doctype html>')) {
             throw new Error("حجم الملف كبير جداً أو أن الخادم رفض استقباله. يرجى محاولة رفع ملف أصغر حجماً.");
           }
           if (errMsg.includes('502') || errMsg.includes('503') || errMsg.includes('504')) {
             throw new Error("حدث خطأ في الخادم أثناء رفع الملف. يرجى المحاولة مرة أخرى.");
           }
           throw error;
        }

        if (url) fileUrls.push(url);
        
        setProgressPercentage(((i + 1) / totalFiles) * 30);
      }

      if (fileUrls.length === 0) throw new Error("لم يتم إرجاع رابط صالح للملفات");

      setProgressText('جاري تحليل المحتوى وتوليد النتيجة (قد يستغرق بعض الوقت)...');
      let currentProgress = 30;
      progressInterval = setInterval(() => {
        if (currentProgress < 95) {
          currentProgress += Math.random() * 3;
          setProgressPercentage(Math.min(95, currentProgress));
        }
      }, 1000);

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify({
          context: "أنت مساعد ذكي للأكاديميين والمعلمين في منصة تعليمية احترافية. دورك الأساسي هو توفير محتوى ومواد تعليمية جاهزة للاستخدام من قبل الأستاذ. تخاطب الأستاذ باحترام وبمسميات تليق به (يا أستاذنا، زميلي العزيز)، وتصيغ المحتوى بحيث يكون مرتباً ومنسقاً بصرياً (Markdown) وجاهزاً للنسخ مباشرة. اعمل على الملفات صفحة بصفحة بشكل دقيق وشامل.",
          message: promptMessage,
          fileUrls: fileUrls,
          history: []
        })
      });

      clearInterval(progressInterval);
      setProgressPercentage(100);
      setProgressText('اكتمل بنجاح!');
      
      const chatContentType = response.headers.get("content-type");
      if (!chatContentType || !chatContentType.includes("application/json")) {
        const text = await response.text();
        console.error("Chat error text:", text.substring(0, 200));
        throw new Error(`استجابة غير صالحة من السيرفر أثناء توليد المحتوى (كود: ${response.status})`);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate');
      }
      const data = await response.json();
      if (isMountedRef.current) {
        setGeneratedContent(data.response);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      if (isMountedRef.current) {
        setProgressPercentage(0);
      }
      const errMsg = error?.message || '';
      const isAbort = 
        error?.name === 'AbortError' || 
        errMsg.includes('aborted') || 
        errMsg.includes('abort') || 
        errMsg.includes('cancel') || 
        errMsg.includes('without reason');

      if (!isAbort) {
        console.error(error);
      } else {
        console.log("Process aborted gracefully (AbortError/Cancelled).");
      }

      if (isMountedRef.current) {
        if (isAbort) {
          setGeneratedContent(`تم إلغاء عملية التوليد بنجاح.`);
        } else {
          setGeneratedContent(`عذراً، حدث خطأ أثناء العملية: ${error.message || 'يرجى المحاولة مرة أخرى.'}`);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
      abortControllerRef.current = null;
    }
  };

  const copyToClipboardHandler = async () => {
    await copyToClipboard(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!generatedContent) return;
    
    const defaultTitle = activeToolData?.title ? `${activeToolData.title} - ${new Date().toLocaleDateString('ar-IQ')}` : 'ملف جديد';
    const finalName = saveName.trim() || defaultTitle;
    
    const newItem = {
      id: Date.now().toString(),
      name: finalName,
      content: generatedContent,
      tool: activeToolData?.title || 'عام',
      date: new Date().toISOString()
    };
    
    const updated = [newItem, ...savedResults];
    setSavedResults(updated);
    localStorage.setItem('teacher_ai_saved_results', JSON.stringify(updated));
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setSaveName('');
    }, 3000);
  };

  const activeToolData = tools.find(t => t.id === activeTool);

  if (!remoteConfig.aiFeaturesEnabled) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl max-w-md space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center animate-pulse">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-black text-white">خدمات الذكاء الاصطناعي موقفة مؤقتاً 🔒</h3>
          <p className="text-xs text-white/60 font-bold leading-relaxed">
            تم إيقاف المساعد الذكي وتوليد الأسئلة بقرار سحابي مباشر لأغراض الصيانة والتحديثات الدورية. ستعود الخدمة للعمل فور الانتهاء.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollContainerRef} className="h-full w-full max-w-full flex flex-col p-4 md:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar relative" dir="rtl">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {activeTool === 'activities' ? (
        <div className="relative z-10 flex-1 h-auto flex flex-col">
          <div className="flex justify-end mb-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-white/50 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 w-fit cursor-pointer">
              <ChevronRight size={20} /> عودة للمساعد
            </button>
          </div>
          <div className="flex-1 relative">
            <TeacherActivities schoolId={schoolId} teacherData={teacherData} />
          </div>
        </div>
      ) : !activeTool ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Bairaq Standard Platform Header Banner */}
          <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-6">
            {/* Background elegant pattern and overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
            <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Bairaq Video Companion on the LEFT side - Spans edge to edge */}
            <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
              <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
              <BerqCharacter
                pose="pose_ai_companion"
                glowColor="cyan"
                className="w-full h-full object-cover relative z-10 scale-110"
              />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
            </div>

            {/* Header Title & Subtitle */}
            <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none text-right h-full min-w-0">
              <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
                قسم مساعد الذكاء الاصطناعي 🤖
              </h2>
              <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                <span className="shrink-0 text-xs">🏛️</span>
                <span className="truncate">{teacherData?.schoolName || "ثانوية أوائل غماس الأهلية"}</span>
              </div>
              <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                <span className="shrink-0 text-[10px]">✨</span>
                <span className="truncate">المساعد الأكاديمي الذكي لتوليد الأسئلة والملخصات والأنشطة الصفية</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {tools.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                onClick={() => setActiveTool(item.id as AITool)}
                className={`bg-[#0C1229]/80 backdrop-blur-md border ${item.border} rounded-3xl p-5 md:p-6 transition-all duration-300 cursor-pointer group shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden relative`}
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 ${item.bg} rounded-full blur-2xl group-hover:scale-150 transition-all duration-500`} />
                <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-5 border ${item.border} group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-xs md:text-sm font-bold leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 flex flex-col"
        >
          {/* Active Tool Bairaq Standard Platform Header Banner */}
          <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
            <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Bairaq Video Companion on the LEFT side */}
            <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
              <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
              <BerqCharacter
                pose="pose_ai_companion"
                glowColor="cyan"
                className="w-full h-full object-cover relative z-10 scale-110"
              />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
            </div>

            {/* Content & Close button */}
            <div className="relative z-10 flex-1 flex items-center justify-between pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none h-full min-w-0">
              <div className="flex flex-col text-right min-w-0 justify-center">
                <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate flex items-center gap-2">
                  <span>{activeToolData?.title}</span>
                  <span className="text-[10px] font-black bg-[#FFD600] text-black px-2 py-0.5 rounded-full">مساعد بيرق</span>
                </h2>
                <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                  <span className="shrink-0 text-xs">🏛️</span>
                  <span className="truncate">{teacherData?.schoolName || "ثانوية أوائل غماس الأهلية"}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                  <span className="shrink-0 text-[10px]">💡</span>
                  <span className="truncate">{activeToolData?.desc}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setActiveTool(null);
                  setGeneratedContent('');
                  setTopicFiles([]);
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 shrink-0 cursor-pointer ml-2"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full">
            {/* Input Form or History List */}
            <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">
              <div className="bg-[#0A1024]/80 border border-white/5 rounded-3xl p-5 shadow-lg h-fit max-h-[500px] overflow-y-auto custom-scrollbar">
                {activeTool === 'history' ? (
                  <>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5 gap-2">
                      <label className="text-sm font-bold text-white/70">النتائج المحفوظة ({savedResults.length})</label>
                      {savedResults.length > 0 && (
                        <button
                          onClick={() => setDeleteConfirmTarget('all')}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          title="حذف جميع المحفوظات"
                        >
                          <Trash2 size={12} />
                          <span>حذف الكل</span>
                        </button>
                      )}
                    </div>
                    {savedResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 text-white/40">
                        <History size={32} className="mb-2 opacity-50" />
                        <span className="text-xs font-bold text-center">لا توجد نتائج محفوظة بعد</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {savedResults.map((result) => (
                          <div 
                            key={result.id}
                            onClick={() => {
                              setGeneratedContent(result.content);
                            }}
                            className="bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-white/10 p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-1 group relative overflow-hidden pl-10"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-white truncate max-w-[150px]">{result.name}</span>
                              <span className="text-[10px] text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded font-bold">{result.tool}</span>
                            </div>
                            <span className="text-[10px] text-white/40 font-medium">
                              {new Date(result.date).toLocaleDateString('ar-SA')} - {new Date(result.date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmTarget(result.id);
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20 cursor-pointer border border-rose-500/20"
                              title="حذف"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {activeTool === 'homework' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualInput(!isManualInput);
                          setManualText('');
                        }}
                        className="w-full mb-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Edit2 size={14} />
                        {isManualInput ? 'العودة لرفع الملفات' : 'كتابة الواجب بنفسي'}
                      </button>
                    )}

                    {isManualInput ? (
                      <div className="flex flex-col gap-2 shrink-0">
                        <label className="block text-xs font-bold text-white/50">اكتب نص الواجب هنا:</label>
                        <textarea
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          placeholder="مثال: واجب مادة الرياضيات اليوم: حل التمارين صفحة 45 من السؤال 1 إلى 5..."
                          className="w-full h-36 bg-black/40 border border-white/10 focus:border-amber-500/50 rounded-2xl p-3 text-xs text-white outline-none resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (manualText.trim()) {
                              setGeneratedContent(manualText);
                              setIsManualInput(false);
                            } else {
                              alert("يرجى كتابة نص الواجب أولاً.");
                            }
                          }}
                          className="w-full py-2.5 bg-amber-500 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-all"
                        >
                          <CheckCircle size={14} />
                          اعتماد الواجب المكتوب
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="block text-sm font-bold text-white/70 mb-3">ارفع صور أو ملف (PDF, PPT)</label>
                        
                        <input 
                          type="file" 
                          accept="image/*,.pdf,.ppt,.pptx"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-32 bg-black/40 border border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all mb-4 group shrink-0"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-purple-500/20 transition-colors">
                            <FileUp size={24} className="text-white/40 group-hover:text-purple-400 transition-colors" />
                          </div>
                          <span className="text-xs font-bold text-white/40 group-hover:text-purple-300">انقر لرفع ملفات الدرس</span>
                        </div>

                        {topicFiles.length > 0 && (
                          <div className="flex-1 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
                            {topicFiles.map((f, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {f.type.startsWith('image/') ? <ImageIcon size={16} className="text-purple-400 shrink-0" /> : <ScrollText size={16} className="text-blue-400 shrink-0" />}
                                  <span className="text-xs text-white/80 truncate font-medium">{f.name}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-white/40 hover:text-rose-400 transition-colors p-1">
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button 
                          onClick={handleGenerate}
                          disabled={topicFiles.length === 0 || isGenerating}
                          className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              جاري المعالجة صفحة بصفحة...
                            </>
                          ) : (
                            <>
                              <Sparkles size={18} className="text-amber-300" />
                              بدء السحر
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Output Area */}
            <div className="w-full flex-1 flex flex-col min-w-0 bg-[#0A1024]/80 border border-white/5 rounded-3xl p-5 shadow-lg relative h-fit min-h-[400px] overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-white/5 pb-4 gap-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bot size={18} className={activeToolData?.color} />
                  النتيجة
                </h3>

                {generatedContent && !isGenerating && !generatedContent.startsWith('تم إلغاء') && !generatedContent.startsWith('عذراً، حدث خطأ') && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 bg-[#050812] border border-white/10 rounded-xl p-1.5 shadow-xl w-full">
                    {activeTool === 'competitions' || activeTool === 'homework' ? (
                      <button 
                        onClick={() => {
                          const title = activeTool === 'competitions' ? "اسم المسابقة" : "اسم الواجب";
                          const newName = prompt(`أدخل ${title}:`, saveName);
                          if (newName !== null) {
                            setSaveName(newName);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 h-9 ${activeTool === 'competitions' ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300'} border border-white/10 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none justify-center`}
                        title={activeTool === 'competitions' ? "تسمية المسابقة" : "تسمية الواجب"}
                      >
                        <Edit2 size={14} />
                        <span>{saveName ? `${saveName}` : (activeTool === 'competitions' ? 'تسمية المسابقة' : 'تسمية الواجب')}</span>
                      </button>
                    ) : (
                      <button 
                        onClick={copyToClipboardHandler}
                        className="flex items-center gap-1.5 px-3 h-9 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all flex-1 sm:flex-none justify-center"
                        title="نسخ النتيجة"
                      >
                        {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    )}
                    
                    {activeTool !== 'history' && (
                      <>
                        <div className="hidden sm:block w-px h-5 bg-white/10 mx-1"></div>
                        <div className="flex items-center gap-1.5 bg-white/5 rounded-lg overflow-hidden h-9 w-full sm:w-auto sm:flex-1 min-w-[140px]">
                          <input 
                            type="text" 
                            placeholder={
                              activeTool === 'competitions' 
                                ? "اسم المسابقة..." 
                                : activeTool === 'homework' 
                                ? "اسم الواجب..." 
                                : "اسم الملف (اختياري)..."
                            }
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            className="bg-transparent text-white/80 text-xs font-medium px-3 h-full outline-none w-full transition-all placeholder:text-white/30"
                          />
                          <button 
                            onClick={handleSave}
                            disabled={isSaved}
                            className="h-full px-3 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 transition-colors flex items-center justify-center disabled:opacity-50 shrink-0"
                            title="حفظ الملف"
                          >
                            {isSaved ? (
                              <span className="flex items-center gap-1.5 text-emerald-400 whitespace-nowrap text-xs font-bold">
                                <CheckCircle size={14} />
                                <span className="hidden sm:inline">تم الحفظ</span>
                              </span>
                            ) : (
                              <Save size={14} />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                    
                    {(() => {
                      const isPublishable = activeTool === 'homework' || activeTool === 'competitions' || 
                        (activeTool === 'history' && (() => {
                          const savedItem = savedResults.find(r => r.content === generatedContent);
                          const originalTool = tools.find(t => t.title === savedItem?.tool)?.id;
                          return originalTool === 'homework' || originalTool === 'competitions';
                        })());
                        
                      if (isPublishable) {
                        return (
                          <>
                            <div className="hidden sm:block w-px h-5 bg-white/10 mx-1"></div>
                            <button
                              onClick={handlePublish}
                              disabled={isPublishing || isPublished}
                              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 h-9 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50"
                              title="نشر في منصة الطالب"
                            >
                              {isPublishing ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : isPublished ? (
                                <CheckCircle size={14} />
                              ) : (
                                <Sparkles size={14} />
                              )}
                              <span className="whitespace-nowrap">
                                {isPublishing ? 'جاري النشر...' : isPublished ? 'تم النشر للطالب' : 'نشر للطلاب'}
                              </span>
                            </button>
                          </>
                        );
                      }
                      return null;
                    })()}
                    
                    {activeTool === 'history' && (
                      <>
                        <div className="hidden sm:block w-px h-5 bg-white/10 mx-1"></div>
                        <button
                          onClick={() => setGeneratedContent('')}
                          className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 h-9 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                          title="إغلاق الملف"
                        >
                          <X size={14} />
                          <span className="text-xs font-bold">إغلاق</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative w-full">
                {isGenerating ? (
                  <div className="relative w-full flex flex-col items-center justify-center text-white/40 p-4 min-h-[300px] z-20">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                      <Bot size={32} className="text-purple-400 animate-pulse" />
                    </div>
                    
                    <div className="w-full max-w-md flex flex-col items-center">
                      <div className="w-full flex justify-between items-end mb-2">
                        <span className="font-bold text-sm text-purple-300">{progressText}</span>
                        <span className="font-black text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-300 ease-out relative"
                          style={{ width: `${progressPercentage}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
                        </div>
                      </div>
                      {showCancelConfirm ? (
                        <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 mt-2 text-center animate-in fade-in zoom-in duration-300 w-full max-w-sm relative z-30">
                          <p className="text-xs text-rose-400 font-bold mb-3">هل أنت متأكد من رغبتك في إلغاء عملية التوليد؟</p>
                          <div className="flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== "undefined" && (window as any).logTransformerAction) {
                                  (window as any).logTransformerAction("Cancel Click", "الحدث: تم الضغط على زر إلغاء العملية وتأكيد الإيقاف من قبل الأستاذ.", undefined, undefined);
                                }
                                if (abortControllerRef.current) {
                                  abortControllerRef.current.abort();
                                }
                                if (isMountedRef.current) {
                                  setIsGenerating(false);
                                  setProgressPercentage(0);
                                  setGeneratedContent('تم إلغاء عملية التوليد.');
                                  setShowCancelConfirm(false);
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors text-xs cursor-pointer"
                            >
                              نعم، إلغاء التوليد
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowCancelConfirm(false);
                              }}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-xs cursor-pointer border border-white/10"
                            >
                              متابعة التوليد
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCancelConfirm(true);
                          }}
                          className="relative z-30 cursor-pointer px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 font-bold text-xs rounded-xl transition-all hover:scale-105 active:scale-95 duration-200"
                        >
                          إلغاء العملية
                        </button>
                      )}
                    </div>
                  </div>
                ) : generatedContent ? (
                  <div className="flex flex-col gap-4 pb-10 w-full relative group max-w-full overflow-x-hidden">
                    {localQuiz ? (
                      <div className="flex flex-col gap-6 w-full text-right" dir="rtl">
                        <div className="bg-gradient-to-r from-purple-600/20 to-rose-600/20 border border-purple-500/30 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-rose-300 font-bold text-lg">
                            <Trophy size={20} />
                            <span>تعديل تفاصيل المسابقة الصفية</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-white/60 text-xs font-bold">عنوان المسابقة:</label>
                            <input 
                              type="text" 
                              value={localQuiz.title || ""} 
                              onChange={(e) => {
                                const updated = { ...localQuiz, title: e.target.value };
                                updateLocalQuiz(updated);
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium text-sm outline-none focus:border-rose-500/50 transition-colors"
                              placeholder="عنوان المسابقة..."
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {localQuiz.questions && Array.isArray(localQuiz.questions) && localQuiz.questions.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="bg-white/5 border border-white/10 hover:border-white/15 rounded-2xl p-5 shadow-md flex flex-col gap-4 relative transition-all">
                              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                <span className="text-sm font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">السؤال {qIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedQuestions = localQuiz.questions.filter((_: any, i: number) => i !== qIdx);
                                    updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                                  }}
                                  className="text-white/40 hover:text-red-400 p-1.5 hover:bg-white/5 rounded-lg transition-all"
                                  title="حذف السؤال"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-white/60 text-xs font-bold">نص السؤال:</label>
                                <textarea
                                  value={q.question || ""}
                                  onChange={(e) => {
                                    const updatedQuestions = localQuiz.questions.map((item: any, i: number) => 
                                      i === qIdx ? { ...item, question: e.target.value } : item
                                    );
                                    updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                                  }}
                                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white font-medium text-sm outline-none focus:border-rose-500/40 transition-colors min-h-[70px] resize-y"
                                  placeholder="اكتب السؤال هنا..."
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <label className="text-white/60 text-xs font-bold">الخيارات والإجابة الصحيحة:</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options && Array.isArray(q.options) && q.options.map((opt: string, optIdx: number) => {
                                    const isCorrect = q.correctAnswerIndex === optIdx;
                                    return (
                                      <div key={optIdx} className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-xl p-2 hover:border-white/10 transition-all">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedQuestions = localQuiz.questions.map((item: any, i: number) => 
                                              i === qIdx ? { ...item, correctAnswerIndex: optIdx } : item
                                            );
                                            updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                                          }}
                                          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                            isCorrect 
                                              ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                              : "border-white/20 hover:border-white/40 bg-white/5"
                                          }`}
                                          title={isCorrect ? "هذه هي الإجابة الصحيحة" : "تحديد كإجابة صحيحة"}
                                        >
                                          {isCorrect && <CheckCircle size={14} />}
                                        </button>
                                        <input
                                          type="text"
                                          value={opt || ""}
                                          onChange={(e) => {
                                            const updatedOptions = q.options.map((o: string, oIdx: number) => 
                                              oIdx === optIdx ? e.target.value : o
                                            );
                                            const updatedQuestions = localQuiz.questions.map((item: any, i: number) => 
                                              i === qIdx ? { ...item, options: updatedOptions } : item
                                            );
                                            updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                                          }}
                                          className="flex-1 bg-transparent border-none text-white font-medium text-xs sm:text-sm outline-none"
                                          placeholder={`الخيار ${optIdx + 1}...`}
                                        />
                                        {q.options.length > 2 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedOptions = q.options.filter((_: any, oIdx: number) => oIdx !== optIdx);
                                              let newCorrectIdx = q.correctAnswerIndex;
                                              if (q.correctAnswerIndex === optIdx) {
                                                newCorrectIdx = 0;
                                              } else if (q.correctAnswerIndex > optIdx) {
                                                newCorrectIdx--;
                                              }
                                              const updatedQuestions = localQuiz.questions.map((item: any, i: number) => 
                                                i === qIdx ? { ...item, options: updatedOptions, correctAnswerIndex: newCorrectIdx } : item
                                              );
                                              updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                                            }}
                                            className="text-white/30 hover:text-red-400 p-1"
                                            title="حذف هذا الخيار"
                                          >
                                            <Minus size={14} />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex justify-end mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedOptions = [...q.options, `خيار جديد ${q.options.length + 1}`];
                                      const updatedQuestions = localQuiz.questions.map((item: any, i: number) => 
                                        i === qIdx ? { ...item, options: updatedOptions } : item
                                      );
                                      updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                                    }}
                                    className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors border border-rose-500/10"
                                  >
                                    <Plus size={12} />
                                    <span>إضافة خيار</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newQuestion = {
                              question: "سؤال جديد؟",
                              options: ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
                              correctAnswerIndex: 0
                            };
                            const updatedQuestions = [...(localQuiz.questions || []), newQuestion];
                            updateLocalQuiz({ ...localQuiz, questions: updatedQuestions });
                          }}
                          className="w-full py-4 border-2 border-dashed border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 hover:text-rose-200 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group/btn"
                        >
                          <Plus size={18} className="group-hover/btn:scale-110 transition-transform" />
                          <span>إضافة سؤال جديد للمسابقة</span>
                        </button>
                      </div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          p: ({node, children, ...props}) => (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-purple-500/30 transition-all duration-300 w-full overflow-hidden" dir="auto">
                              <p className="text-white/80 leading-relaxed text-sm md:text-base font-medium break-words" {...props}>
                                {children}
                              </p>
                            </div>
                          ),
                          h1: ({node, children, ...props}) => (
                            <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-5 shadow-lg w-full mt-4 mb-2 overflow-hidden" dir="auto">
                              <h1 className="text-2xl font-black text-purple-300 break-words" {...props}>
                                {children}
                              </h1>
                            </div>
                          ),
                          h2: ({node, children, ...props}) => (
                            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl p-4 shadow-md w-full mt-3 mb-2 overflow-hidden" dir="auto">
                              <h2 className="text-xl font-bold text-blue-300 break-words" {...props}>
                                {children}
                              </h2>
                            </div>
                          ),
                          h3: ({node, children, ...props}) => (
                            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-4 shadow-sm w-full mt-2 mb-2 overflow-hidden" dir="auto">
                              <h3 className="text-lg font-bold text-emerald-300 break-words" {...props}>
                                {children}
                              </h3>
                            </div>
                          ),
                          ul: ({node, children, ...props}) => (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-md w-full overflow-hidden" dir="auto">
                              <ul className="list-disc list-inside space-y-3 text-white/80 font-medium" {...props}>
                                {children}
                              </ul>
                            </div>
                          ),
                          ol: ({node, children, ...props}) => (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-md w-full overflow-hidden" dir="auto">
                              <ol className="list-decimal list-inside space-y-3 text-white/80 font-medium" {...props}>
                                {children}
                              </ol>
                            </div>
                          ),
                          li: ({node, children, ...props}) => (
                            <li className="text-sm md:text-base leading-relaxed marker:text-purple-400 break-words" {...props}>
                              {children}
                            </li>
                          ),
                          strong: ({node, children, ...props}) => (
                            <strong className="text-purple-300 font-bold bg-purple-500/10 px-1 py-0.5 rounded break-words" {...props}>
                              {children}
                            </strong>
                          ),
                          blockquote: ({node, children, ...props}) => (
                            <div className="border-r-4 border-amber-500 bg-amber-500/10 rounded-l-2xl p-5 w-full overflow-hidden" dir="auto">
                              <blockquote className="text-amber-200/90 italic font-medium break-words" {...props}>
                                {children}
                              </blockquote>
                            </div>
                          ),
                          details: ({node, children, ...props}: any) => {
                            const hasSummary = React.Children.toArray(children).some(
                              (child: any) => child?.type === 'summary' || child?.props?.node?.tagName === 'summary'
                            );
                            return (
                              <details className="group bg-black/30 border border-white/10 rounded-2xl overflow-hidden mt-2 mb-2 w-full" {...props}>
                                {!hasSummary && (
                                  <summary className="cursor-pointer p-4 font-bold text-purple-300 hover:bg-white/5 transition-colors list-none flex items-center justify-between">
                                    <span>إظهار الحل</span>
                                    <ChevronRight size={16} className="transform group-open:-rotate-90 transition-transform duration-300" />
                                  </summary>
                                )}
                                {children}
                              </details>
                            );
                          },
                          summary: ({node, children, ...props}) => (
                            <summary className="cursor-pointer p-4 font-bold text-purple-300 hover:bg-white/5 transition-colors list-none flex items-center justify-between" {...props}>
                              <span>{children || 'إظهار الحل'}</span>
                              <ChevronRight size={16} className="transform group-open:-rotate-90 transition-transform duration-300" />
                            </summary>
                          ),
                          table: ({node, children, ...props}) => (
                            <div className="w-full overflow-x-auto my-4 bg-white/5 rounded-2xl border border-white/10 custom-scrollbar">
                              <table className="w-full text-sm text-left rtl:text-right text-white/80" {...props}>
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({node, children, ...props}) => (
                            <th className="px-4 py-3 bg-white/10 font-bold text-white whitespace-nowrap" {...props}>
                              {children}
                            </th>
                          ),
                          td: ({node, children, ...props}) => (
                            <td className="px-4 py-3 border-t border-white/10 whitespace-nowrap" {...props}>
                              {children}
                            </td>
                          ),
                          code: ({node, className, children, ...props}: any) => {
                            const match = /language-(\w+)/.exec(className || '');
                            if (match) {
                              return (
                                <div className="bg-black/40 border border-white/10 rounded-2xl p-5 w-full overflow-x-auto custom-scrollbar shadow-inner" dir="ltr">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </div>
                              );
                            }
                            return (
                              <code className="bg-black/30 text-emerald-300 px-1.5 py-0.5 rounded-md font-mono text-sm break-words whitespace-pre-wrap" {...props}>
                                {children}
                              </code>
                            );
                          },
                          pre: ({node, children, ...props}) => (
                            <pre className="max-w-full overflow-x-auto bg-transparent p-0 m-0" {...props}>
                              {children}
                            </pre>
                          )
                        }}
                      >
                        {generatedContent}
                      </ReactMarkdown>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                    <Sparkles size={48} className="mb-4 opacity-20" />
                    <p className="font-bold text-sm">ارفع صورة للموضوع واضغط للبدء</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#050A18] border border-rose-500/30 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                {deleteConfirmTarget === 'all' ? 'حذف جميع المحفوظات؟' : 'حذف هذا الملف؟'}
              </h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                {deleteConfirmTarget === 'all' 
                  ? 'هل أنت متأكد من رغبتك في حذف جميع الملفات المحفوظة؟ لا يمكن التراجع عن هذا الإجراء.' 
                  : 'هل أنت متأكد من رغبتك في حذف هذا الملف من المحفوظات؟'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const { db } = await import('../lib/firebase');
                    const { collection, getDocs, query, where, deleteDoc, doc } = await import('firebase/firestore');
                    
                    try {
                      if (deleteConfirmTarget === 'all') {
                        setSavedResults([]);
                        localStorage.setItem('teacher_ai_saved_results', JSON.stringify([]));
                        setGeneratedContent('');
                        
                        if (schoolId) {
                          const q = query(collection(db, "schools", schoolId, "ai_materials"), where("teacherId", "==", teacherData?.id || teacherData?.code || "unknown"));
                          const snap = await getDocs(q);
                          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "schools", schoolId, "ai_materials", d.id)));
                          await Promise.all(deletePromises);
                        }
                      } else {
                        const deletedItem = savedResults.find(r => r.id === deleteConfirmTarget);
                        const newResults = savedResults.filter(r => r.id !== deleteConfirmTarget);
                        setSavedResults(newResults);
                        localStorage.setItem('teacher_ai_saved_results', JSON.stringify(newResults));
                        
                        if (deletedItem && generatedContent === deletedItem.content) {
                          setGeneratedContent('');
                        }
                        
                        if (schoolId && deletedItem) {
                          const q = query(
                            collection(db, "schools", schoolId, "ai_materials"),
                            where("teacherId", "==", teacherData?.id || teacherData?.code || "unknown")
                          );
                          const snap = await getDocs(q);
                          const deletePromises = snap.docs
                            .filter(d => d.data().content === deletedItem.content)
                            .map(d => deleteDoc(doc(db, "schools", schoolId, "ai_materials", d.id)));
                          await Promise.all(deletePromises);
                        }
                      }
                    } catch (error) {
                      console.error("Failed to delete from firestore", error);
                    }
                    setDeleteConfirmTarget(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  نعم، احذف
                </button>
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs transition-colors cursor-pointer border border-white/10"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
