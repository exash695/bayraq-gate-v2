import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, FileUp, ClipboardCheck, HelpCircle, ScrollText, Edit2, Sparkles, Trophy, ChevronRight, Loader2, Copy, CheckCircle, Image as ImageIcon, X, Save, History, Trash2, Plus, Minus, Lock, Search, Camera, CheckCircle2, UploadCloud, Eye, ZoomIn, Clock, Calendar, Send, Users, Check } from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import TeacherActivities from "./TeacherActivities";
import { TeacherSovereigntyManager } from './Sovereignty/TeacherSovereigntyManager';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { uploadFileToR2 } from '../services/uploadService';
import { copyToClipboard } from '../utils/clipboard';
import { BerqCharacter } from './BerqCharacterManager';
import { useRemoteConfig } from '../services/remoteConfig';
import { safeStorage } from '../lib/storage';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, deleteDoc, doc } from '../lib/firebase';

interface TeacherAIAssistantProps {
  schoolId: string;
  teacherData?: any;
  selectedClass?: string;
  disabledModules?: string[];
  rolePrefix?: string;
  classSwitcherBar?: React.ReactNode;
}

type AITool = 'questions' | 'summaries' | 'homework' | 'ideas' | 'competitions' | 'history' | 'activities' | 'sovereignty' | null;

export const TeacherAIAssistant: React.FC<TeacherAIAssistantProps> = ({ 
  schoolId, 
  teacherData, 
  selectedClass,
  disabledModules = [],
  rolePrefix = 'teacher',
  classSwitcherBar
}) => {
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
  // Homework & Material Scheduling States
  const [showPublishScheduleModal, setShowPublishScheduleModal] = useState(false);
  const [scheduleChoice, setScheduleChoice] = useState<'now' | 'tomorrow_am' | 'tomorrow_pm' | 'after_tomorrow_am' | 'custom'>('now');
  const [customDate, setCustomDate] = useState<string>(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().split('T')[0];
  });
  const [customTime, setCustomTime] = useState<string>('08:00');
  const [publishPendingMode, setPublishPendingMode] = useState<'regular' | 'image_hw' | null>(null);

  const computeScheduleDetails = (choice: string, cDate?: string, cTime?: string) => {
    const now = new Date();
    if (choice === 'now') {
      return { isScheduled: false, scheduledAt: null, scheduledLabel: 'نشر فوري الآن', status: 'published' };
    }
    let target = new Date();
    if (choice === 'tomorrow_am') {
      target.setDate(now.getDate() + 1);
      target.setHours(8, 0, 0, 0);
    } else if (choice === 'tomorrow_pm') {
      target.setDate(now.getDate() + 1);
      target.setHours(16, 0, 0, 0);
    } else if (choice === 'after_tomorrow_am') {
      target.setDate(now.getDate() + 2);
      target.setHours(8, 0, 0, 0);
    } else if (choice === 'custom') {
      const dStr = cDate || new Date().toISOString().split('T')[0];
      const tStr = cTime || '08:00';
      target = new Date(`${dStr}T${tStr}`);
    } else {
      return { isScheduled: false, scheduledAt: null, scheduledLabel: 'نشر فوري الآن', status: 'published' };
    }

    if (isNaN(target.getTime()) || target.getTime() <= Date.now()) {
      return { isScheduled: false, scheduledAt: null, scheduledLabel: 'نشر فوري الآن', status: 'published' };
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    const label = target.toLocaleDateString('ar-IQ', options);

    return {
      isScheduled: true,
      scheduledAt: target.toISOString(),
      scheduledLabel: label,
      status: 'scheduled'
    };
  };

  const assignedSectionsList = useMemo(() => {
    const rawClasses = teacherData?.classes || teacherData?.assignedSections || teacherData?.sections;
    let list: string[] = [];
    if (Array.isArray(rawClasses)) {
      list = rawClasses.map((item: any) => typeof item === 'string' ? item : (item?.name || item?.sectionName || String(item))).filter(Boolean);
    } else if (typeof rawClasses === 'string' && rawClasses.trim()) {
      list = rawClasses.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (selectedClass && selectedClass !== 'ALL' && selectedClass !== 'كافة الشُعب' && !list.includes(selectedClass)) {
      list = [selectedClass, ...list];
    }
    if (list.length === 0) {
      list = ['أ', 'ب', 'ج', 'د'];
    }
    return Array.from(new Set(list));
  }, [teacherData, selectedClass]);

  const [selectedPublishSections, setSelectedPublishSections] = useState<string[]>([]);

  const openPublishModal = (mode = 'regular') => {
    if (activeTool === 'summaries') {
      if (summaryMode === 'image' && !imageSummaryResult && summaryImageFiles.length > 0) {
        handleApplySummaryImagesToResult(true);
        return;
      }
      if (summaryMode === 'manual' && !manualSummaryResult && summaryManualText.trim()) {
        handleApplyManualSummaryToResult(true);
        return;
      }
    }
    setPublishPendingMode(mode);
    setScheduleChoice('now');
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    setCustomDate(tm.toISOString().split('T')[0]);
    setCustomTime('08:00');

    // Default to all assigned sections for effortless one-click publishing
    if (selectedPublishSections.length === 0) {
      setSelectedPublishSections(assignedSectionsList);
    }

    setShowPublishScheduleModal(true);
  };

  const confirmAndExecutePublish = async () => {
    const sched = computeScheduleDetails(scheduleChoice, customDate, customTime);
    setShowPublishScheduleModal(false);
    if (publishPendingMode === 'image_hw') {
      await handleDirectImageHwPublish(sched);
    } else {
      await handlePublish(sched);
    }
  };

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
  const [hwMode, setHwMode] = useState<'ai' | 'manual' | 'image'>('ai');
  const [imageHwFiles, setImageHwFiles] = useState<File[]>([]);
  const [imageHwPreviews, setImageHwPreviews] = useState<string[]>([]);
  const [imageHwTitle, setImageHwTitle] = useState('');
  const [imageHwInstructions, setImageHwInstructions] = useState('');
  const [isUploadingImageHw, setIsUploadingImageHw] = useState(false);
  const [imageHwProgress, setImageHwProgress] = useState(0);
  const imageHwInputRef = useRef<HTMLInputElement>(null);

  // Summaries states (AI generation, Multi-image upload, Manual writing)
  const [summaryMode, setSummaryMode] = useState<'ai' | 'image' | 'manual'>('ai');
  
  // Dedicated strictly separate states for AI generation mode
  const [aiSummaryTopic, setAiSummaryTopic] = useState('');
  const [aiSummaryPromptText, setAiSummaryPromptText] = useState('');
  const [aiSummaryPdfFiles, setAiSummaryPdfFiles] = useState<File[]>([]);
  const aiSummaryPdfInputRef = useRef<HTMLInputElement>(null);

  // Dedicated strictly separate states for Multi-image mode
  const [summaryImageFiles, setSummaryImageFiles] = useState<File[]>([]);
  const [summaryImagePreviews, setSummaryImagePreviews] = useState<string[]>([]);
  const [summaryImageTitle, setSummaryImageTitle] = useState('');
  const [summaryImageNotes, setSummaryImageNotes] = useState('');
  const [isUploadingSummaryImages, setIsUploadingSummaryImages] = useState(false);
  const [summaryImageProgress, setSummaryImageProgress] = useState(0);
  const summaryImageInputRef = useRef<HTMLInputElement>(null);

  // Dedicated strictly separate states for Manual writing mode
  const [summaryManualTitle, setSummaryManualTitle] = useState('');
  const [summaryManualText, setSummaryManualText] = useState('');
  const [previewingImageUrl, setPreviewingImageUrl] = useState<string | null>(null);

  // Dedicated strictly separated results for each summary mode
  const [aiSummaryResult, setAiSummaryResult] = useState('');
  const [imageSummaryResult, setImageSummaryResult] = useState('');
  const [manualSummaryResult, setManualSummaryResult] = useState('');

  const activeSummaryTitle = useMemo(() => {
    if (activeTool !== 'summaries') return saveName;
    if (summaryMode === 'image') {
      return summaryImageTitle.trim() || `ملخص ${teacherData?.subject || 'دراسي'} مصور - ${new Date().toLocaleDateString('ar-IQ')}`;
    }
    if (summaryMode === 'manual') {
      return summaryManualTitle.trim() || `ملخص ${teacherData?.subject || 'دراسي'} - ${new Date().toLocaleDateString('ar-IQ')}`;
    }
    return aiSummaryTopic.trim() || saveName.trim() || `ملخص ${teacherData?.subject || 'دراسي'} ذكي - ${new Date().toLocaleDateString('ar-IQ')}`;
  }, [activeTool, summaryMode, summaryImageTitle, summaryManualTitle, aiSummaryTopic, saveName, teacherData?.subject]);

  const activeDisplayContent = activeTool === 'summaries' ? (
    summaryMode === 'ai' ? aiSummaryResult :
    summaryMode === 'image' ? imageSummaryResult :
    manualSummaryResult
  ) : generatedContent;

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
    setHwMode('ai');
    setImageHwFiles([]);
    setImageHwPreviews([]);
    setImageHwTitle('');
    setImageHwInstructions('');

    setSummaryMode('ai');
    setAiSummaryTopic('');
    setAiSummaryPromptText('');
    setAiSummaryPdfFiles([]);
    setSummaryImageFiles([]);
    setSummaryImagePreviews(prev => {
      prev.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
      return [];
    });
    setSummaryImageTitle('');
    setSummaryImageNotes('');
    setSummaryManualTitle('');
    setSummaryManualText('');
    setAiSummaryResult('');
    setImageSummaryResult('');
    setManualSummaryResult('');
    setPreviewingImageUrl(null);
    setTopicFiles([]);
    
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

  // Note: We preserve user inputs across summary mode tabs (AI, Image, Manual) so data is not wiped when switching views.

  const handlePublish = async (schedInfo) => {
    const sched = schedInfo || { isScheduled: false, scheduledAt: null, scheduledLabel: 'نشر فوري الآن', status: 'published' };
    if (!schoolId) return;

    // In summaries tool: if direct image or manual modes haven't been applied yet, trigger them; if already applied, publish content directly
    if (activeTool === 'summaries') {
      if (summaryMode === 'image') {
        if (!imageSummaryResult && summaryImageFiles.length > 0) {
          await handleApplySummaryImagesToResult(true);
          return;
        }
      }
      if (summaryMode === 'manual') {
        if (!manualSummaryResult && summaryManualText.trim()) {
          await handleApplyManualSummaryToResult(true);
          return;
        }
      }
    }

    const contentToPublish = activeTool === 'summaries' ? (summaryMode === 'ai' ? aiSummaryResult : activeDisplayContent) : generatedContent;
    if (!contentToPublish) return;
    setIsPublishing(true);
    try {
      const targetSections = selectedPublishSections.length > 0 
        ? selectedPublishSections 
        : (selectedClass && selectedClass !== 'ALL' && selectedClass !== 'كافة الشُعب' ? [selectedClass] : assignedSectionsList);
      
      const isAll = targetSections.length >= assignedSectionsList.length;
      const targetGrade = teacherData?.grade || "الكل";
      const targetSectionLabel = isAll ? "كافة الشُعب الموكلة" : targetSections.join('، ');
      const subject = teacherData?.subject || "عام";
      
      const defaultTitle = activeToolData?.title ? `${activeToolData.title} - ${new Date().toLocaleDateString('ar-IQ')}` : 'ملف جديد';
      const finalName = activeTool === 'summaries' ? activeSummaryTitle : (saveName.trim() || defaultTitle);
      const isSummary = activeTool === 'summaries';

      const materialData = {
        name: finalName,
        title: finalName,
        content: contentToPublish,
        tool: isSummary ? 'إنشاء ملخصات' : (activeToolData?.title || 'عام'),
        subject: subject,
        targetGrade: targetGrade,
        grade: targetGrade,
        section: isAll ? null : targetSections.join(', '),
        targetSections: targetSections,
        targetSectionLabel: targetSectionLabel,
        teacherId: teacherData?.id || teacherData?.code || "unknown",
        teacherName: teacherData?.name || "الأستاذ",
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        date: new Date().toISOString(),
        publishDate: new Date().toLocaleDateString('ar-IQ'),
        tag: isSummary ? 'ملخص ذكي 🤖' : undefined,
        type: isSummary ? 'summary' : undefined,
        isSummary: isSummary,
        category: isSummary ? 'ملخصات' : undefined,
        allowDownload: true,
        status: sched.status,
        scheduledAt: sched.scheduledAt,
        scheduledLabel: sched.scheduledLabel
      };

      await addDoc(collection(db, "schools", schoolId, "ai_materials"), materialData);

      if (isSummary) {
        const schoolFilesData = {
          ...materialData,
          schoolId: schoolId
        };
        await addDoc(collection(db, "school_files"), schoolFilesData);

        // Also sync to REST API /api/school-files for PostgreSQL & Realtime listeners
        try {
          await fetch('/api/school-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: finalName,
              fileName: `${finalName}.md`,
              fileUrl: '',
              content: contentToPublish,
              schoolId: schoolId,
              subject: subject,
              grade: targetGrade,
              section: isAll ? null : selectedClass,
              targetSections: targetSections,
              targetSectionLabel: targetSectionLabel,
              tag: summaryMode === 'image' ? 'ملخص مصور' : summaryMode === 'manual' ? 'ملخص مكتوب' : 'ملخص ذكي 🤖',
              size: summaryMode === 'image' ? `${summaryImageFiles.length} صفحات` : 'ملخص معتمد',
              downloads: 0,
              allowDownload: true,
              createdAt: new Date().toISOString()
            })
          });
        } catch (apiErr) {
          console.warn("API school-files sync error:", apiErr);
        }
      }

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

  const handleImageHwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImageHwFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageHwPreviews(prev => [...prev, ...newPreviews]);
      if (!imageHwTitle) {
        setImageHwTitle(`واجب ${teacherData?.subject || ''} مصور - ${new Date().toLocaleDateString('ar-IQ')}`);
      }
    }
  };

  const removeImageHwFile = (index: number) => {
    setImageHwFiles(prev => prev.filter((_, i) => i !== index));
    setImageHwPreviews(prev => {
      try {
        if (prev[index]) URL.revokeObjectURL(prev[index]);
      } catch {}
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDirectImageHwPublish = async (schedInfo) => {
    const sched = schedInfo || { isScheduled: false, scheduledAt: null, scheduledLabel: 'نشر فوري الآن', status: 'published' };
    if (imageHwFiles.length === 0) {
      alert("يرجى اختيار صورة أو ورقة عمل للواجب أولاً");
      return;
    }
    if (!schoolId) {
      alert("معرف المدرسة غير متوفر");
      return;
    }

    setIsUploadingImageHw(true);
    setImageHwProgress(10);
    try {
      const uploadedUrls: string[] = [];
      const totalFiles = imageHwFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = imageHwFiles[i];
        const uploaded: any = await uploadFileToR2(
          file,
          (progress) => {
            const currentFileWeight = 80 / totalFiles;
            const currentProgress = 10 + (i * currentFileWeight) + (progress * currentFileWeight / 100);
            setImageHwProgress(Math.round(currentProgress));
          },
          schoolId,
          'image_homework'
        );
        const resolvedUrl = typeof uploaded === 'string' ? uploaded : (uploaded?.publicUrl || uploaded?.url || '');
        if (resolvedUrl && typeof resolvedUrl === 'string' && resolvedUrl.trim().length > 0) {
          uploadedUrls.push(resolvedUrl.trim());
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error("فشل في رفع صور الواجب إلى الخادم السحابي");
      }

      setImageHwProgress(90);

      let mdContent = '';
      uploadedUrls.forEach((url, i) => {
        mdContent += `![صورة الواجب ${i + 1}](${url})\n\n`;
      });
      if (imageHwInstructions.trim()) {
        mdContent += `### تعليمات وملاحظات الأستاذ:\n${imageHwInstructions.trim()}\n\n`;
      }

      const defaultTitle = `واجب ${teacherData?.subject || 'دراسي'} مصور - ${new Date().toLocaleDateString('ar-IQ')}`;
      const finalTitle = imageHwTitle.trim() || defaultTitle;

      const isAll = !selectedClass || selectedClass === 'ALL' || selectedClass === 'كافة الشُعب' || selectedClass === 'all';
      const rawClasses = teacherData?.classes;
      const teacherSecNames = Array.isArray(rawClasses) 
        ? rawClasses.filter(Boolean) 
        : typeof rawClasses === 'string' && rawClasses.trim() 
          ? [rawClasses.trim()] 
          : [];
      const targetGrade = isAll ? "الكل" : selectedClass;
      const targetSections = isAll ? (teacherSecNames.length > 0 ? teacherSecNames : [selectedClass || "الكل"]) : [selectedClass];
      const targetSectionLabel = isAll ? "كافة الشُعب" : selectedClass;
      const subject = teacherData?.subject || "عام";

      await addDoc(collection(db, "schools", schoolId, "ai_materials"), {
        name: finalTitle,
        content: mdContent,
        fileUrl: uploadedUrls[0] || null,
        imageUrl: uploadedUrls[0] || null,
        imageUrls: uploadedUrls,
        tool: 'صناعة واجبات',
        subject: subject,
        targetGrade: targetGrade,
        section: isAll ? null : selectedClass,
        targetSections: targetSections,
        targetSectionLabel: targetSectionLabel,
        teacherId: teacherData?.id || teacherData?.code || "unknown",
        teacherName: teacherData?.name || "الأستاذ",
        timestamp: serverTimestamp(),
        date: new Date().toISOString(),
        type: 'image_homework',
        status: sched.status,
        scheduledAt: sched.scheduledAt,
        scheduledLabel: sched.scheduledLabel
      });

      setImageHwProgress(100);
      setGeneratedContent(mdContent);
      setSaveName(finalTitle);
      setIsPublished(true);
      setTimeout(() => setIsPublished(false), 4000);

      const newItem = {
        id: Date.now().toString(),
        name: finalTitle,
        content: mdContent,
        tool: 'صناعة واجبات (صورة)',
        date: new Date().toISOString()
      };
      setSavedResults(prev => [newItem, ...prev]);
      try {
        localStorage.setItem('teacher_ai_saved_results', JSON.stringify([newItem, ...savedResults]));
      } catch {}

      setImageHwFiles([]);
      setImageHwPreviews([]);
      setImageHwInstructions('');
      setImageHwTitle('');
    } catch (err: any) {
      console.error("Failed to upload image homework:", err);
      alert(err?.message || "حدث خطأ أثناء رفع ونشر صورة الواجب");
    } finally {
      setIsUploadingImageHw(false);
      setImageHwProgress(0);
    }
  };

  const [savedResults, setSavedResults] = useState<{id: string, name: string, content: string, tool: string, date: string}[]>(() => {
    try {
      const saved = localStorage.getItem('teacher_ai_saved_results');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const [historySearch, setHistorySearch] = useState('');

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<'all' | string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helpers to build live previews for Image and Manual modes
  const buildImageSummaryMarkdown = (previews: string[], title?: string, notes?: string) => {
    if (previews.length === 0) return '';
    const finalTitle = (title !== undefined ? title : summaryImageTitle).trim() || `ملخص ${teacherData?.subject || 'دراسي'} مصور - ${new Date().toLocaleDateString('ar-IQ')}`;
    const finalNotes = (notes !== undefined ? notes : summaryImageNotes).trim();
    let md = `# 📄 ${finalTitle}\n\n`;
    if (finalNotes) {
      md += `> 💡 **ملاحظات وتوجيهات الأستاذ:**\n> ${finalNotes}\n\n`;
    }
    md += `### 🖼️ صفحات ومحتويات الملخص (${previews.length} ${previews.length === 1 ? 'صفحة' : 'صفحات'}):\n\n`;
    previews.forEach((url, i) => {
      md += `![صفحة الملخص ${i + 1}](${url})\n\n`;
    });
    return md;
  };

  // Handlers for multiple summary images upload & management
  const handleSummaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const updatedFiles = [...summaryImageFiles, ...newFiles];
      setSummaryImageFiles(updatedFiles);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      const updatedPreviews = [...summaryImagePreviews, ...newPreviews];
      setSummaryImagePreviews(updatedPreviews);
      const title = summaryImageTitle.trim() || `ملخص ${teacherData?.subject || 'دراسي'} مصور - ${new Date().toLocaleDateString('ar-IQ')}`;
      if (!summaryImageTitle) {
        setSummaryImageTitle(title);
      }
      setImageSummaryResult(buildImageSummaryMarkdown(updatedPreviews, title, summaryImageNotes));
    }
  };

  const removeSummaryImageFile = (index: number) => {
    const updatedFiles = summaryImageFiles.filter((_, i) => i !== index);
    setSummaryImageFiles(updatedFiles);
    const updatedPreviews = summaryImagePreviews.filter((_, i) => i !== index);
    setSummaryImagePreviews(prev => {
      try {
        if (prev[index]) URL.revokeObjectURL(prev[index]);
      } catch {}
      return updatedPreviews;
    });
    setImageSummaryResult(buildImageSummaryMarkdown(updatedPreviews, summaryImageTitle, summaryImageNotes));
  };

  const handleApplySummaryImagesToResult = async (publishDirectly: boolean = false) => {
    if (summaryImageFiles.length === 0) {
      alert("يرجى اختيار صورة أو أكثر للملخص أولاً");
      return;
    }
    if (!schoolId) {
      alert("معرف المدرسة غير متوفر");
      return;
    }

    setIsUploadingSummaryImages(true);
    setSummaryImageProgress(10);
    try {
      const uploadedUrls: string[] = [];
      const totalFiles = summaryImageFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        const file = summaryImageFiles[i];
        const uploaded: any = await uploadFileToR2(
          file,
          (progress) => {
            const currentFileWeight = 80 / totalFiles;
            const currentProgress = 10 + (i * currentFileWeight) + (progress * currentFileWeight / 100);
            setSummaryImageProgress(Math.round(currentProgress));
          },
          schoolId,
          'image_summary'
        );
        const resolvedUrl = typeof uploaded === 'string' ? uploaded : (uploaded?.publicUrl || uploaded?.url || '');
        if (resolvedUrl && typeof resolvedUrl === 'string' && resolvedUrl.trim().length > 0) {
          uploadedUrls.push(resolvedUrl.trim());
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error("فشل في رفع صور الملخص إلى الخادم السحابي");
      }

      setSummaryImageProgress(90);

      const defaultTitle = `ملخص ${teacherData?.subject || 'دراسي'} مصور - ${new Date().toLocaleDateString('ar-IQ')}`;
      const finalTitle = summaryImageTitle.trim() || defaultTitle;

      let mdContent = `# 📄 ${finalTitle}\n\n`;
      if (summaryImageNotes.trim()) {
        mdContent += `> 💡 **ملاحظات وتوجيهات الأستاذ:**\n> ${summaryImageNotes.trim()}\n\n`;
      }
      mdContent += `### 🖼️ صفحات ومحتويات الملخص (${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'صفحة' : 'صفحات'}):\n\n`;
      uploadedUrls.forEach((url, i) => {
        mdContent += `![صفحة الملخص ${i + 1}](${url})\n\n`;
      });

      setSummaryImageProgress(100);
      setImageSummaryResult(mdContent);
      setGeneratedContent(mdContent);
      setSaveName(finalTitle);

      const isAll = !selectedClass || selectedClass === 'ALL' || selectedClass === 'كافة الشُعب' || selectedClass === 'all';
      const rawClasses = teacherData?.classes;
      const teacherSecNames = Array.isArray(rawClasses) 
        ? rawClasses.filter(Boolean) 
        : typeof rawClasses === 'string' && rawClasses.trim() 
          ? [rawClasses.trim()] 
          : [];
      const targetGrade = isAll ? "الكل" : selectedClass;
      const targetSections = isAll ? (teacherSecNames.length > 0 ? teacherSecNames : [selectedClass || "الكل"]) : [selectedClass];
      const targetSectionLabel = isAll ? "كافة الشُعب" : selectedClass;
      const subject = teacherData?.subject || "عام";

      const newItem = {
        id: Date.now().toString(),
        name: finalTitle,
        content: mdContent,
        tool: 'إنشاء ملخصات (مصور)',
        date: new Date().toISOString()
      };
      setSavedResults(prev => [newItem, ...prev]);
      try {
        localStorage.setItem('teacher_ai_saved_results', JSON.stringify([newItem, ...savedResults]));
      } catch {}

      if (publishDirectly) {
        const materialData = {
          name: finalTitle,
          title: finalTitle,
          content: mdContent,
          fileUrl: uploadedUrls[0] || null,
          imageUrl: uploadedUrls[0] || null,
          imageUrls: uploadedUrls,
          tool: 'إنشاء ملخصات',
          subject: subject,
          targetGrade: targetGrade,
          grade: targetGrade,
          section: isAll ? null : selectedClass,
          targetSections: targetSections,
          targetSectionLabel: targetSectionLabel,
          teacherId: teacherData?.id || teacherData?.code || "unknown",
          teacherName: teacherData?.name || "الأستاذ",
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          date: new Date().toISOString(),
          publishDate: new Date().toLocaleDateString('ar-IQ'),
          type: 'image_summary',
          tag: 'ملخص مصور',
          isSummary: true,
          category: 'ملخصات',
          size: `${uploadedUrls.length} صفحات`,
          downloads: 0,
          allowDownload: true,
          schoolId: schoolId
        };

        await addDoc(collection(db, "schools", schoolId, "ai_materials"), materialData);
        await addDoc(collection(db, "school_files"), materialData);

        try {
          await fetch('/api/school-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: finalTitle,
              fileName: `${finalTitle}.md`,
              fileUrl: uploadedUrls[0] || '',
              imageUrl: uploadedUrls[0] || '',
              imageUrls: uploadedUrls,
              content: mdContent,
              schoolId: schoolId,
              subject: subject,
              grade: targetGrade,
              section: isAll ? null : selectedClass,
              targetSections: targetSections,
              targetSectionLabel: targetSectionLabel,
              tag: 'ملخص مصور',
              size: `${uploadedUrls.length} صفحات`,
              downloads: 0,
              allowDownload: true,
              createdAt: new Date().toISOString()
            })
          });
        } catch (apiErr) {
          console.warn("API school-files sync error:", apiErr);
        }

        setIsPublished(true);
        setTimeout(() => setIsPublished(false), 4000);
      }
    } catch (err: any) {
      console.error("Failed to process summary images:", err);
      alert(err?.message || "حدث خطأ أثناء معالجة صور الملخص");
    } finally {
      setIsUploadingSummaryImages(false);
      setSummaryImageProgress(0);
    }
  };

  const handleApplyManualSummaryToResult = async (publishDirectly: boolean = false) => {
    if (!summaryManualText.trim()) {
      alert("يرجى كتابة نص الملخص أولاً.");
      return;
    }

    const defaultTitle = `ملخص ${teacherData?.subject || 'دراسي'} - ${new Date().toLocaleDateString('ar-IQ')}`;
    const finalTitle = summaryManualTitle.trim() || defaultTitle;

    let mdContent = '';
    if (summaryManualTitle.trim()) {
      mdContent += `# 📄 ${summaryManualTitle.trim()}\n\n`;
    }
    mdContent += summaryManualText.trim();

    setManualSummaryResult(mdContent);
    setGeneratedContent(mdContent);
    setSaveName(finalTitle);

    const newItem = {
      id: Date.now().toString(),
      name: finalTitle,
      content: mdContent,
      tool: 'إنشاء ملخصات (كتابة)',
      date: new Date().toISOString()
    };
    setSavedResults(prev => [newItem, ...prev]);
    try {
      localStorage.setItem('teacher_ai_saved_results', JSON.stringify([newItem, ...savedResults]));
    } catch {}

    if (publishDirectly) {
      if (!schoolId) {
        alert("معرف المدرسة غير متوفر");
        return;
      }
      try {
        const isAll = !selectedClass || selectedClass === 'ALL' || selectedClass === 'كافة الشُعب' || selectedClass === 'all';
        const rawClasses = teacherData?.classes;
        const teacherSecNames = Array.isArray(rawClasses) 
          ? rawClasses.filter(Boolean) 
          : typeof rawClasses === 'string' && rawClasses.trim() 
            ? [rawClasses.trim()] 
            : [];
        const targetGrade = isAll ? "الكل" : selectedClass;
        const targetSections = isAll ? (teacherSecNames.length > 0 ? teacherSecNames : [selectedClass || "الكل"]) : [selectedClass];
        const targetSectionLabel = isAll ? "كافة الشُعب" : selectedClass;
        const subject = teacherData?.subject || "عام";

        const materialData = {
          name: finalTitle,
          title: finalTitle,
          content: mdContent,
          fileUrl: '',
          imageUrl: '',
          imageUrls: [],
          tool: 'إنشاء ملخصات',
          subject: subject,
          targetGrade: targetGrade,
          grade: targetGrade,
          section: isAll ? null : selectedClass,
          targetSections: targetSections,
          targetSectionLabel: targetSectionLabel,
          teacherId: teacherData?.id || teacherData?.code || "unknown",
          teacherName: teacherData?.name || "الأستاذ",
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          date: new Date().toISOString(),
          publishDate: new Date().toLocaleDateString('ar-IQ'),
          type: 'manual_summary',
          tag: 'ملخص مكتوب',
          isSummary: true,
          category: 'ملخصات',
          size: 'ملخص معتمد',
          downloads: 0,
          allowDownload: true,
          schoolId: schoolId
        };

        await addDoc(collection(db, "schools", schoolId, "ai_materials"), materialData);
        await addDoc(collection(db, "school_files"), materialData);

        try {
          await fetch('/api/school-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: finalTitle,
              fileName: `${finalTitle}.md`,
              fileUrl: '',
              content: mdContent,
              schoolId: schoolId,
              subject: subject,
              grade: targetGrade,
              section: isAll ? null : selectedClass,
              targetSections: targetSections,
              targetSectionLabel: targetSectionLabel,
              tag: 'ملخص مكتوب',
              size: 'ملخص معتمد',
              downloads: 0,
              allowDownload: true,
              createdAt: new Date().toISOString()
            })
          });
        } catch (apiErr) {
          console.warn("API school-files sync error:", apiErr);
        }

        setIsPublished(true);
        setTimeout(() => setIsPublished(false), 4000);
      } catch (err: any) {
        console.error("Failed to publish manual summary:", err);
        alert(err?.message || "حدث خطأ أثناء نشر الملخص للطلاب");
      }
    }
  };

  const tools = [
    { 
      id: 'sovereignty', 
      title: "إدارة التحديات والسيادة", 
      desc: "نعمل على تجهيزها، قريباً بين أيديكم", 
      badge: "نعمل على تجهيزها، قريباً بين أيديكم",
      icon: Trophy, 
      color: "text-amber-400", 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:sovereignty`) || disabledModules.includes(`${rolePrefix}:sovereignty_mgmt`)
    },
    { 
      id: 'questions', 
      title: "توليد أسئلة", 
      desc: "استخراج أسئلة تلقائية استنتاجية أو نصية.", 
      icon: HelpCircle, 
      color: "text-blue-400", 
      bg: "bg-blue-500/10", 
      border: "border-blue-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:questions_bank`) || disabledModules.includes(`${rolePrefix}:ai_gen_questions`)
    },
    { 
      id: 'summaries', 
      title: "إنشاء ملخصات", 
      desc: "تلخيص الفصول الطويلة لنقاط أساسية للطالب.", 
      icon: ScrollText, 
      color: "text-emerald-400", 
      bg: "bg-emerald-500/10", 
      border: "border-emerald-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:ai_gen_summary`)
    },
    { 
      id: 'homework', 
      title: "صناعة واجبات", 
      desc: "تكوين أنشطة صفية وواجبات منزلية مبتكرة بضغطة زر.", 
      icon: Edit2, 
      color: "text-amber-400", 
      bg: "bg-amber-500/10", 
      border: "border-amber-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:assignments`) || disabledModules.includes(`${rolePrefix}:ai_gen_assignments`)
    },
    { 
      id: 'ideas', 
      title: "اقتراحات للشرح", 
      desc: "أفكار وطرق مبتكرة لتوصيل الفكرة وتوضيحها للطلاب.", 
      icon: Sparkles, 
      color: "text-fuchsia-400", 
      bg: "bg-fuchsia-500/10", 
      border: "border-fuchsia-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:ai_teaching_suggestions`) || disabledModules.includes(`${rolePrefix}:ideas`)
    },
    { 
      id: 'competitions', 
      title: "مسابقات صفية", 
      desc: "إعداد تحديات ومسابقات سريعة للطلاب بأسلوب شيق.", 
      icon: Trophy, 
      color: "text-rose-400", 
      bg: "bg-rose-500/10", 
      border: "border-rose-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:competitions`)
    },
    { 
      id: 'history', 
      title: "المحفوظات", 
      desc: "الرجوع للنتائج والملفات التي تم توليدها مسبقاً وحفظها.", 
      icon: History, 
      color: "text-teal-400", 
      bg: "bg-teal-500/10", 
      border: "border-teal-500/20",
      isLocked: false 
    },
    { 
      id: 'activities', 
      title: "متابعة الأنشطة", 
      desc: "تتبع إنجازات الطلاب وتقييم الواجبات والمسابقات.", 
      icon: ClipboardCheck, 
      color: "text-indigo-400", 
      bg: "bg-indigo-500/10", 
      border: "border-indigo-500/20",
      isLocked: disabledModules.includes(`${rolePrefix}:activity_monitoring`)
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTopicFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setTopicFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiSummaryPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAiSummaryPdfFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeAiSummaryPdfFile = (index: number) => {
    setAiSummaryPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    const isSummariesTool = activeTool === 'summaries';
    const filesToUse = isSummariesTool ? aiSummaryPdfFiles : topicFiles;

    if (isSummariesTool) {
      if (!aiSummaryTopic.trim() && !aiSummaryPromptText.trim() && filesToUse.length === 0) {
        alert("يرجى إدخال عنوان أو موضوع الدرس، أو لصق نصه، أو رفع مستند الدرس للتلخيص الذكي.");
        return;
      }
    } else {
      if (filesToUse.length === 0) {
        alert("يرجى إرفاق صور أو ملف الموضوع أولاً.");
        return;
      }
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
        const lessonTopicStr = aiSummaryTopic.trim() ? ` (عنوان/موضوع الدرس: ${aiSummaryTopic.trim()})` : '';
        const lessonTextStr = aiSummaryPromptText.trim() ? `\n\nنص ومحتوى الدرس المراد تلخيصه:\n${aiSummaryPromptText.trim()}` : '';
        promptMessage = isEnglish
          ? `Hello. Based on the lesson ${lessonTopicStr} (Subject: English, Grade: ${gradeLevel})${lessonTextStr}, write a comprehensive, simplified, and well-structured lesson summary in English. Organize into clear bullet points, key takeaways, and sub-headings. \n\n${baseFormatting}`
          : `أهلاً. بناءً على موضوع الدرس${lessonTopicStr} لمادة ${subject} لـ ${gradeLevel}${lessonTextStr}، صغ لي ملخصاً شاملاً، مبسطاً، ومنظماً في نقاط مركزة. رتب الملخص في عناوين فرعية تُسهل على الطلاب مراجعة الدرس وحفظ المفاهيم والقوانين والملاحظات الهامة بسرعة. \n\n${baseFormatting}`;
        break;
      case 'homework':
        promptMessage = isEnglish
          ? `Hello. Based on the attached files (Subject: English, Grade: ${gradeLevel}), design an innovative, high-quality, and interactive homework assignment in English.

STRICT HOMEWORK RULES:
1. The homework is strictly for the STUDENT to solve independently.
2. ABSOLUTELY NO ANSWERS, SOLUTIONS, HINTS, OR EXPLANATIONS. Do NOT write answers or clues in parentheses (e.g., do NOT write '(faster) الشرح:' or explain why an answer is correct).
3. Provide ONLY the exercises, numbered questions, and clear student instructions. If Arabic translation is needed, provide ONLY the direct Arabic translation of the question/instruction without any clues, hints, or answers.
4. Do NOT include any 'Explanation', 'Answer', or 'Hint' sections or lines anywhere.

${baseFormatting}`
          : `أهلاً. بناءً على الملفات المرفقة (مادة ${subject} لـ ${gradeLevel})، اصنع واجبًا منزليًا مبتكرًا صفحة بصفحة يجمع بين التطبيق العملي/البحثي والأسئلة التحليلية.
قواعد صارمة جداً للواجب:
1. هذا الواجب مخصص ليحله الطالب بنفسه دون أي مساعدة.
2. ممنوع منعاً باتاً كتابة الحلول أو الإجابات النموذجية أو التلميحات أو الشروحات للنقاط أو الأسئلة (لا تكتب الشرح أو الحل أو تلميح إطلاقاً).
3. يجب أن يحتوي الواجب على نص الأسئلة والتمارين والتعليمات فقط دون إعطاء الطالب أي مفتاح حل أو توضيح للإجابة.

${baseFormatting}`;
        break;
      case 'ideas':
        promptMessage = isEnglish
          ? `Hello. I am teaching English (Grade: ${gradeLevel}). Based on the attached files, suggest an innovative and engaging teaching plan in English containing a catchy Hook, a real-life analogy, and a clear step-by-step teaching logic. \n\n${baseFormatting}`
          : `أهلاً. أنا أستاذ لمادة ${subject} (لـ ${gradeLevel}). بناءً على محتوى الملفات المرفقة (اعمل عليها صفحة بصفحة)، اقترح علي خطة شرح مبتكرة تتضمن: مقدمة جاذبة (Hook)، قصة قصيرة أو تشبيه واقعي لتبسيط المفاهيم المعقدة، وتسلسل منطقي لطرح الأفكار أثناء الحصة. \n\n${baseFormatting}`;
        break;
      case 'competitions':
        promptMessage = `أهلاً. انطلاقاً من محتوى الملفات المرفقة (مادة ${subject} لـ ${gradeLevel}) صفحة بصفحة، صمم مسابقة صفية تفاعلية سريعة (تحدي الـ 60 ثانية). أريد 5 أسئلة خيارات متعددة.
 must be valid JSON only enclosed inside a code block, no other text outside:
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
      const totalFiles = filesToUse.length;
      
      if (totalFiles > 0) {
        for (let i = 0; i < totalFiles; i++) {
          const file = filesToUse[i];
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
      } else {
        setProgressPercentage(10);
      }

      setProgressText('جاري تحليل المحتوى وتوليد النتيجة (قد يستغرق بعض الوقت)...');
      let currentProgress = totalFiles > 0 ? 30 : 10;
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
          isTeacherMode: true,
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
        if (activeTool === 'summaries') {
          setAiSummaryResult(data.response);
          setSaveName(aiSummaryTopic.trim() || `ملخص ${teacherData?.subject || 'دراسي'} ذكي`);
        }
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
        const msg = isAbort 
          ? `تم إلغاء عملية التوليد بنجاح.` 
          : `عذراً، حدث خطأ أثناء العملية: ${error.message || 'يرجى المحاولة مرة أخرى.'}`;
        setGeneratedContent(msg);
        if (activeTool === 'summaries') {
          setAiSummaryResult(msg);
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
    const textToCopy = activeTool === 'summaries' ? activeDisplayContent : generatedContent;
    if (!textToCopy) return;
    await copyToClipboard(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const contentToSave = activeTool === 'summaries' ? activeDisplayContent : generatedContent;
    if (!contentToSave) return;
    
    const defaultTitle = activeToolData?.title ? `${activeToolData.title} - ${new Date().toLocaleDateString('ar-IQ')}` : 'ملف جديد';
    const finalName = saveName.trim() || defaultTitle;
    
    const toolTitle = activeTool === 'summaries'
      ? (summaryMode === 'image' ? 'إنشاء ملخصات (مصور)' : summaryMode === 'manual' ? 'إنشاء ملخصات (كتابة)' : 'إنشاء ملخصات (ذكي)')
      : (activeToolData?.title || 'عام');

    const newItem = {
      id: Date.now().toString(),
      name: finalName,
      content: contentToSave,
      tool: toolTitle,
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
    <div ref={scrollContainerRef} className={`h-full w-full max-w-full flex flex-col ${activeTool === 'summaries' ? 'p-0' : 'p-4 md:p-6'} overflow-y-auto overflow-x-hidden custom-scrollbar relative`} dir="rtl">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
            {activeTool === 'sovereignty' ? (
        <div className="relative z-10 flex-1 h-auto flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-white/70 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 w-fit cursor-pointer">
              <ChevronRight size={20} /> العودة للمساعد الذكي
            </button>
            <span className="text-xs text-amber-400/80 font-bold hidden sm:inline">✨ إدارة التحديات والسيادة</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#0C1229]/90 border border-amber-500/20 rounded-3xl backdrop-blur-md shadow-2xl min-h-[420px]">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Trophy size={40} className="animate-pulse" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full text-xs sm:text-sm font-black mb-4 shadow-sm animate-pulse">
              <span>⏳</span>
              <span>قريباً في التحديث القادم</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">إدارة التحديات والسيادة</h3>
            <p className="text-lg sm:text-xl text-amber-300 font-black max-w-lg leading-relaxed">
              نعمل على تجهيزها، قريباً بين أيديكم
            </p>
            <p className="text-xs sm:text-sm text-white/50 mt-3 max-w-md font-medium leading-relaxed">
              يتم العمل حالياً على تجهيز قسم إدارة التحديات والسيادة الصفية وتكامله مع نظام الرايات والمسابقات التفاعلية لتقديم تجربة حماسية متميزة.
            </p>
          </div>
        </div>
      ) : activeTool === 'activities' ? (
        <div className="relative z-10 flex-1 h-auto flex flex-col -mx-4 md:-mx-6 -my-4 md:-my-6 w-[calc(100%+2rem)] md:w-[calc(100%+3rem)]">
          <div className="flex justify-between items-center px-4 sm:px-6 py-3 bg-[#0A0F24]/90 border-b border-white/10 shrink-0">
            <button onClick={() => setActiveTool(null)} className="flex items-center gap-2 text-white/70 hover:text-white font-bold transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs sm:text-sm cursor-pointer shadow-sm">
              <ChevronRight size={18} /> العودة للمساعد الذكي
            </button>
            <span className="text-xs text-indigo-400 font-bold hidden sm:inline">📊 قسم متابعة أنشطة الطلاب (شاشة كاملة)</span>
          </div>
          <div className="flex-1 relative w-full">
            <TeacherActivities schoolId={schoolId} teacherData={teacherData} selectedClass={selectedClass} />
          </div>
        </div>
      ) : !activeTool ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          {/* Bairaq Standard Platform Header Banner */}
          <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-4">
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
                <span className="truncate">{teacherData?.schoolName || "مدرسة اليمامة الابتدائية"}</span>
              </div>
              <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                <span className="shrink-0 text-[10px]">✨</span>
                <span className="truncate">المساعد الأكاديمي الذكي لتوليد الأسئلة والملخصات والأنشطة الصفية</span>
              </div>
            </div>
          </div>

          {/* Class Switcher Bar below the Header Banner */}
          {classSwitcherBar && <div className="mb-6 shrink-0">{classSwitcherBar}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {tools.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                onClick={() => !item.isLocked && setActiveTool(item.id as AITool)}
                className={`bg-[#0C1229]/80 backdrop-blur-md border ${item.isLocked ? 'border-rose-500/30' : item.border} rounded-3xl p-5 md:p-6 transition-all duration-300 ${item.isLocked ? 'cursor-not-allowed grayscale-[0.5]' : 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'} group shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden relative`}
              >
                {item.isLocked && (
                  <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-3 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                      <Lock size={20} />
                    </div>
                    <span className="text-rose-400 text-sm font-black mb-1">التبويب مغلق</span>
                    <span className="text-rose-300/60 text-[10px] font-bold">يرجى مراجعة إدارة المدرسة لتفعيل الخدمة</span>
                  </div>
                )}
                <div className={`absolute -right-10 -top-10 w-32 h-32 ${item.bg} rounded-full blur-2xl ${!item.isLocked && 'group-hover:scale-150'} transition-all duration-500`} />
                <div className="flex items-start justify-between gap-2 mb-5">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center border ${item.border} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    <item.icon size={24} />
                  </div>
                  {(item as any).badge && (
                    <span className="px-2.5 py-1 text-[10px] sm:text-[11px] font-black bg-amber-500/20 border border-amber-500/35 text-amber-300 rounded-full shadow-sm animate-pulse text-right leading-tight">
                      {(item as any).badge}
                    </span>
                  )}
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
          <div className={`shrink-0 relative overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center ${activeTool === 'summaries' ? 'rounded-none border-x-0 border-t-0 mb-0 w-full' : 'rounded-2xl mb-6'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
            <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Bairaq Video Companion on the LEFT side */}
            <div className={`absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden ${activeTool === 'summaries' ? 'rounded-none' : 'rounded-l-2xl'} flex items-center justify-center`}>
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
                  <span className="truncate">{teacherData?.schoolName || "مدرسة اليمامة الابتدائية"}</span>
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
                  setSummaryImageFiles([]);
                  setSummaryImagePreviews(prev => {
                    prev.forEach(url => { try { URL.revokeObjectURL(url); } catch {} });
                    return [];
                  });
                  setSummaryImageTitle('');
                  setSummaryImageNotes('');
                  setSummaryManualTitle('');
                  setSummaryManualText('');
                  setPreviewingImageUrl(null);
                }}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/10 shrink-0 cursor-pointer ml-2"
                title="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Sticky Edge-to-Edge Summaries Mode Switcher Bar */}
          {activeTool === 'summaries' && (
            <div className="sticky top-0 z-30 bg-[#070e24]/95 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 shadow-2xl w-full">
              <div className="w-full grid grid-cols-3 gap-2 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setSummaryMode('ai')}
                  className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    summaryMode === 'ai'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.45)] ring-1 ring-emerald-400/50'
                      : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Sparkles size={16} className={summaryMode === 'ai' ? 'text-emerald-200' : ''} />
                  <span>توليد ذكي 🤖</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSummaryMode('image')}
                  className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    summaryMode === 'image'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.45)] ring-1 ring-teal-400/50'
                      : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <ImageIcon size={16} className={summaryMode === 'image' ? 'text-teal-200' : ''} />
                  <span>رفع صورة جاهزة 🖼️</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSummaryMode('manual')}
                  className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    summaryMode === 'manual'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-[0_0_20px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/50'
                      : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Edit2 size={16} className={summaryMode === 'manual' ? 'text-amber-200' : ''} />
                  <span>إدراج ككتابة ✍️</span>
                </button>
              </div>
            </div>
          )}

          <div className={`flex flex-col lg:flex-row ${activeTool === 'summaries' ? 'w-full min-h-0 border-t border-white/5 gap-0' : 'gap-6 w-full max-w-full'}`}>
            {/* Input Form or History List */}
            <div className={`w-full ${activeTool === 'summaries' ? 'lg:w-[440px] xl:w-[480px] p-4 sm:p-6 lg:border-l border-white/10 bg-[#070e24]/70 shrink-0' : 'lg:w-[350px] shrink-0 flex flex-col gap-4'}`}>
              <div className={`${activeTool === 'summaries' ? 'flex flex-col gap-4' : 'bg-[#0A1024]/80 border border-white/5 rounded-3xl p-5 shadow-lg h-fit max-h-[500px] overflow-y-auto custom-scrollbar'}`}>
                {activeTool === 'history' ? (
                  <>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5 gap-2">
                      <label className="text-sm font-bold text-white/70">
                        النتائج المحفوظة ({historySearch.trim() ? `${savedResults.filter(r => {
                          const q = historySearch.trim().toLowerCase();
                          return String(r.name || '').toLowerCase().includes(q) || String(r.tool || '').toLowerCase().includes(q) || String(r.content || '').toLowerCase().includes(q);
                        }).length} من ${savedResults.length}` : savedResults.length})
                      </label>
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

                    {/* Filter search bar for history */}
                    {savedResults.length > 0 && (
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          placeholder="ابحث بالاسم، نوع الأداة أو المحتوى..."
                          className="w-full bg-[#050A18] border border-white/10 rounded-xl pr-8 pl-8 py-2 text-xs text-white placeholder:text-white/30 focus:border-teal-500/50 outline-none transition-all"
                        />
                        <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        {historySearch && (
                          <button
                            onClick={() => setHistorySearch('')}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                            title="مسح البحث"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    {savedResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 text-white/40">
                        <History size={32} className="mb-2 opacity-50" />
                        <span className="text-xs font-bold text-center">لا توجد نتائج محفوظة بعد</span>
                      </div>
                    ) : (() => {
                      const filtered = savedResults.filter((result) => {
                        if (!historySearch.trim()) return true;
                        const q = historySearch.trim().toLowerCase();
                        return (
                          String(result.name || '').toLowerCase().includes(q) ||
                          String(result.tool || '').toLowerCase().includes(q) ||
                          String(result.content || '').toLowerCase().includes(q)
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center p-6 text-white/40">
                            <Search size={28} className="mb-2 opacity-40 text-teal-400" />
                            <span className="text-xs font-bold text-center">لا توجد نتائج مطابقة لبحثك</span>
                            <button
                              onClick={() => setHistorySearch('')}
                              className="mt-2 text-[11px] text-teal-400 hover:underline cursor-pointer"
                            >
                              مسح فلتر البحث
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-2">
                          {filtered.map((result) => (
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
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {activeTool === 'homework' && (
                      <div className="flex flex-col gap-2 mb-4 bg-black/30 p-1.5 rounded-2xl border border-white/5 shrink-0">
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => setHwMode('ai')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              hwMode === 'ai'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Sparkles size={13} className={hwMode === 'ai' ? 'text-amber-300' : ''} />
                            <span>توليد ذكي</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHwMode('image')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              hwMode === 'image'
                                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <ImageIcon size={13} className={hwMode === 'image' ? 'text-teal-200' : ''} />
                            <span>رفع صورة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHwMode('manual')}
                            className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              hwMode === 'manual'
                                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <Edit2 size={13} className={hwMode === 'manual' ? 'text-amber-200' : ''} />
                            <span>كتابة نص</span>
                          </button>
                        </div>
                      </div>
                    )}



                    {activeTool === 'homework' && hwMode === 'image' ? (
                      <div className="flex flex-col gap-3 shrink-0">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-right">
                          <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5 mb-1">
                            <ImageIcon size={14} />
                            <span>نشر صورة الواجب أو ورقة العمل</span>
                          </p>
                          <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                            يمكنك رفع صورة لتمارين الكتاب، ملزمة، أو ورقة عمل مكتوبة ليراها الطلاب وأولياء الأمور مباشرة.
                          </p>
                        </div>

                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={imageHwInputRef}
                          onChange={handleImageHwChange}
                        />

                        {/* Dropzone */}
                        <div 
                          onClick={() => imageHwInputRef.current?.click()}
                          className="w-full h-28 bg-black/40 border border-dashed border-teal-500/40 hover:border-teal-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group shrink-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mb-1 group-hover:bg-teal-500/25 transition-colors text-teal-400">
                            <Camera size={20} />
                          </div>
                          <span className="text-xs font-bold text-teal-200 group-hover:text-teal-100">انقر لاختيار صورة الواجب</span>
                          <span className="text-[9px] text-white/40 mt-0.5">يدعم JPG, PNG, WEBP</span>
                        </div>

                        {/* Image Previews */}
                        {imageHwPreviews.length > 0 && (
                          <div className="flex flex-col gap-2 max-h-44 overflow-y-auto custom-scrollbar p-1">
                            {imageHwPreviews.map((src, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 relative group/img">
                                <img src={src} alt={`معاينة ${idx + 1}`} className="w-12 h-12 rounded-lg object-cover bg-black/40 shrink-0 border border-white/10" />
                                <div className="flex-1 min-w-0 text-right">
                                  <span className="text-xs font-bold text-white block truncate">{imageHwFiles[idx]?.name || `صورة ${idx + 1}`}</span>
                                  <span className="text-[10px] text-white/40">{( (imageHwFiles[idx]?.size || 0) / 1024 ).toFixed(0)} KB</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImageHwFile(idx)}
                                  className="text-white/40 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                  title="حذف هذه الصورة"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Title input */}
                        <div className="space-y-1 text-right">
                          <label className="text-[11px] font-bold text-white/70">عنوان الواجب:</label>
                          <input
                            type="text"
                            value={imageHwTitle}
                            onChange={(e) => setImageHwTitle(e.target.value)}
                            placeholder="مثال: واجب الرياضيات - تمارين صفحة 45"
                            className="w-full h-10 bg-black/40 border border-white/10 focus:border-teal-500/60 rounded-xl px-3 text-xs text-white outline-none"
                          />
                        </div>

                        {/* Instructions */}
                        <div className="space-y-1 text-right">
                          <label className="text-[11px] font-bold text-white/70">تعليمات وملاحظات للطالب (اختياري):</label>
                          <textarea
                            value={imageHwInstructions}
                            onChange={(e) => setImageHwInstructions(e.target.value)}
                            placeholder="مثال: حل التمارين في الدفتر وتصوير الحل ورفعه قبل موعد الدرس القادم..."
                            className="w-full h-20 bg-black/40 border border-white/10 focus:border-teal-500/60 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                          />
                        </div>

                        {/* Upload & Publish Button */}
                        {isUploadingImageHw ? (
                          <div className="w-full space-y-2 py-2">
                            <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
                              <span>جاري رفع ونشر صورة الواجب...</span>
                              <span>{imageHwProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                                style={{ width: `${imageHwProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPublishModal('image_hw')}
                            disabled={imageHwFiles.length === 0}
                            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <UploadCloud size={16} />
                            <span>اعتماد ونشر صورة الواجب</span>
                          </button>
                        )}
                      </div>
                    ) : (activeTool === 'homework' && hwMode === 'manual') || isManualInput ? (
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
                          className="w-full py-2.5 bg-amber-500 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-all cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          اعتماد الواجب المكتوب
                        </button>
                      </div>
                    ) : activeTool === 'summaries' && summaryMode === 'image' ? (
                      <div className="flex flex-col gap-3 shrink-0">
                        <div className="space-y-1 text-right">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-teal-300 flex items-center gap-1.5">
                              <ImageIcon size={14} />
                              <span>رفع صورة جاهزة للملخص</span>
                            </p>
                            <span className="text-[9px] font-bold bg-teal-500/20 text-teal-200 px-2 py-0.5 rounded-full">تحديد صور متعددة ✅</span>
                          </div>
                          <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                            يمكنك تحديد ورفع أكثر من صورة دفعة واحدة لصفحات الملخص أو الدفتر لاعتمادها ونشرها مباشرة للطلاب.
                          </p>
                        </div>

                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          className="hidden"
                          ref={summaryImageInputRef}
                          onChange={handleSummaryImageChange}
                        />

                        {/* Dropzone */}
                        <div 
                          onClick={() => summaryImageInputRef.current?.click()}
                          className="w-full h-28 bg-black/40 border border-dashed border-teal-500/40 hover:border-teal-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group shrink-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mb-1 group-hover:bg-teal-500/25 transition-colors text-teal-400">
                            <Camera size={20} />
                          </div>
                          <span className="text-xs font-bold text-teal-200 group-hover:text-teal-100">انقر لتحديد صورة أو عدة صور للملخص</span>
                          <span className="text-[9px] text-white/40 mt-0.5">يمكنك اختيار أكثر من صورة معاً (JPG, PNG, WEBP)</span>
                        </div>

                        {/* Image Previews & Multi-Select Counter */}
                        {summaryImagePreviews.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-[11px] font-bold px-1 text-white/70">
                              <span>الصور المحددة ({summaryImagePreviews.length}):</span>
                              <button
                                type="button"
                                onClick={() => summaryImageInputRef.current?.click()}
                                className="text-teal-300 hover:text-teal-200 flex items-center gap-1 text-[10px] cursor-pointer"
                              >
                                <Plus size={12} />
                                <span>إضافة المزيد من الصور</span>
                              </button>
                            </div>

                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                              {summaryImagePreviews.map((src, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 relative group/img">
                                  <div 
                                    onClick={() => setPreviewingImageUrl(src)}
                                    className="relative cursor-pointer group/zoom shrink-0"
                                    title="انقر لتكبير الصورة"
                                  >
                                    <img src={src} alt={`صفحة ${idx + 1}`} className="w-12 h-12 rounded-lg object-cover bg-black/40 border border-white/10" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/zoom:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white">
                                      <ZoomIn size={14} />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0 text-right">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-black bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">صفحة {idx + 1}</span>
                                      <span className="text-xs font-bold text-white truncate">{summaryImageFiles[idx]?.name || `صورة ${idx + 1}`}</span>
                                    </div>
                                    <span className="text-[10px] text-white/40 mt-0.5 block">{( (summaryImageFiles[idx]?.size || 0) / 1024 ).toFixed(0)} KB</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSummaryImageFile(idx)}
                                    className="text-white/40 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                    title="حذف هذه الصورة"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Title input */}
                        <div className="space-y-1 text-right">
                          <label className="text-[11px] font-bold text-white/70">عنوان الملخص:</label>
                          <input
                            type="text"
                            value={summaryImageTitle}
                            onChange={(e) => {
                              const title = e.target.value;
                              setSummaryImageTitle(title);
                              setImageSummaryResult(buildImageSummaryMarkdown(summaryImagePreviews, title, summaryImageNotes));
                            }}
                            placeholder="مثال: ملخص الفصل الثاني - المغناطيسية وتطبيقاتها"
                            className="w-full h-10 bg-black/40 border border-white/10 focus:border-teal-500/60 rounded-xl px-3 text-xs text-white outline-none"
                          />
                        </div>

                        {/* Notes / Instructions */}
                        <div className="space-y-1 text-right">
                          <label className="text-[11px] font-bold text-white/70">ملاحظات أو توضيحات للطلاب (اختياري):</label>
                          <textarea
                            value={summaryImageNotes}
                            onChange={(e) => {
                              const notes = e.target.value;
                              setSummaryImageNotes(notes);
                              setImageSummaryResult(buildImageSummaryMarkdown(summaryImagePreviews, summaryImageTitle, notes));
                            }}
                            placeholder="مثال: التركيز على القوانين والمقارنات في الصفحة الثانية..."
                            className="w-full h-16 bg-black/40 border border-white/10 focus:border-teal-500/60 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                          />
                        </div>

                        {/* Action Buttons */}
                        {isUploadingSummaryImages ? (
                          <div className="w-full space-y-2 py-2">
                            <div className="flex items-center justify-between text-xs text-teal-300 font-bold">
                              <span>جاري رفع صفحات الملخص ({summaryImageFiles.length} صور)...</span>
                              <span>{summaryImageProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300 rounded-full"
                                style={{ width: `${summaryImageProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleApplySummaryImagesToResult(false)}
                              disabled={summaryImageFiles.length === 0}
                              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <Eye size={15} className="text-teal-300" />
                              <span>اعتماد وعرض الملخص في لوحة النتائج</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApplySummaryImagesToResult(true)}
                              disabled={summaryImageFiles.length === 0}
                              className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <UploadCloud size={16} />
                              <span>اعتماد ونشر الملخص للطلاب مباشرة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : activeTool === 'summaries' && summaryMode === 'manual' ? (
                      <div className="flex flex-col gap-4 shrink-0 text-right">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                            <Edit2 size={14} />
                            <span>إدراج الملخص ككتابة</span>
                          </p>
                          <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                            اكتب أو الصق نص الملخص مباشرة للدرس ليتم إدراجه وعرضه فوراً.
                          </p>
                        </div>

                        {/* Title input */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white/80">عنوان الملخص:</label>
                          <input
                            type="text"
                            value={summaryManualTitle}
                            onChange={(e) => {
                              const title = e.target.value;
                              setSummaryManualTitle(title);
                              if (summaryManualText.trim()) {
                                const finalTitle = title.trim() || `ملخص ${teacherData?.subject || 'دراسي'} - ${new Date().toLocaleDateString('ar-IQ')}`;
                                setManualSummaryResult(`# 📄 ${finalTitle}\n\n${summaryManualText.trim()}`);
                              }
                            }}
                            placeholder="اكتب عنوان الملخص هنا..."
                            className="w-full h-10 bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-xl px-3 text-xs sm:text-sm text-white outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-white/80">نص ومحتوى الملخص:</label>
                          <textarea
                            value={summaryManualText}
                            onChange={(e) => {
                              const text = e.target.value;
                              setSummaryManualText(text);
                              if (!text.trim()) {
                                setManualSummaryResult('');
                              } else {
                                const title = summaryManualTitle.trim() || `ملخص ${teacherData?.subject || 'دراسي'} - ${new Date().toLocaleDateString('ar-IQ')}`;
                                setManualSummaryResult(`# 📄 ${title}\n\n${text.trim()}`);
                              }
                            }}
                            placeholder="اكتب أو الصق نص الملخص هنا مباشرة..."
                            className="w-full h-64 bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-2xl p-3.5 text-xs sm:text-sm text-white outline-none resize-none leading-relaxed placeholder:text-white/30"
                          />
                          <div className="flex justify-between items-center text-[10px] text-white/40 px-1">
                            <span>عدد الكلمات: {summaryManualText.trim() ? summaryManualText.trim().split(/\s+/).length : 0}</span>
                            <span>عدد الأحرف: {summaryManualText.length}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApplyManualSummaryToResult(false)}
                            disabled={!summaryManualText.trim()}
                            className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={14} className="text-amber-400" />
                            <span>معاينة الملخص في لوحة النتائج</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyManualSummaryToResult(true)}
                            disabled={!summaryManualText.trim()}
                            className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <UploadCloud size={16} />
                            <span>نشر الملخص المكتوب للطلاب مباشرة</span>
                          </button>
                        </div>
                      </div>
                    ) : activeTool === 'summaries' && summaryMode === 'ai' ? (
                      <div className="flex flex-col gap-3.5 shrink-0 text-right">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-300" />
                            <span>التلخيص الذكي للدروس بواسطة الذكاء الاصطناعي 🤖</span>
                          </p>
                          <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                            أدخل موضوع الدرس أو الصق نصه أو أرفق مستندات الدرس ليقوم الذكاء الاصطناعي باستخراج المفاهيم وتلخيصها بدقة.
                          </p>
                        </div>

                        {/* Title input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-white/70">موضوع أو عنوان الدرس المراد تلخيصه:</label>
                          <input
                            type="text"
                            value={aiSummaryTopic}
                            onChange={(e) => setAiSummaryTopic(e.target.value)}
                            placeholder="مثال: الجهاز الهضمي ووظائفه، المغناطيسية، الخلية النباتية..."
                            className="w-full h-10 bg-black/40 border border-white/10 focus:border-emerald-500/60 rounded-xl px-3 text-xs text-white outline-none"
                          />
                        </div>

                        {/* Text / Excerpt Paste */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-white/70">نص أو فقرات من الدرس لتلخيصها (اختياري):</label>
                          <textarea
                            value={aiSummaryPromptText}
                            onChange={(e) => setAiSummaryPromptText(e.target.value)}
                            placeholder="الصق نص الشرح أو فقرات الكتاب المراد تركيزها وتلخيصها هنا..."
                            className="w-full h-24 bg-black/40 border border-white/10 focus:border-emerald-500/60 rounded-xl p-2.5 text-xs text-white outline-none resize-none leading-relaxed"
                          />
                        </div>

                        {/* File Upload for Lesson Material */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-white/70">إرفاق ملفات أو صور الدرس (اختياري):</label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf,.ppt,.pptx"
                            multiple
                            className="hidden"
                            ref={aiSummaryPdfInputRef}
                            onChange={handleAiSummaryPdfChange}
                          />

                          <div 
                            onClick={() => aiSummaryPdfInputRef.current?.click()}
                            className="w-full h-20 bg-black/40 border border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group shrink-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1 group-hover:bg-emerald-500/20 transition-colors text-emerald-400">
                              <FileUp size={16} />
                            </div>
                            <span className="text-xs font-bold text-emerald-200 group-hover:text-emerald-100">انقر لإرفاق مستند الدرس (PDF, صور, PPT)</span>
                            <span className="text-[9px] text-white/40 mt-0.5">يمكنك اختيار أكثر من ملف لتحليلها وتلخيصها معاً</span>
                          </div>

                          {aiSummaryPdfFiles.length > 0 && (
                            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                              {aiSummaryPdfFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-right">
                                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                    {file.type.startsWith('image/') ? (
                                      <ImageIcon size={14} className="text-emerald-400 shrink-0" />
                                    ) : (
                                      <ScrollText size={14} className="text-teal-400 shrink-0" />
                                    )}
                                    <span className="text-xs text-white/90 truncate font-medium">{file.name}</span>
                                    <span className="text-[10px] text-white/40 shrink-0">({((file.size || 0) / 1024).toFixed(0)} KB)</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeAiSummaryPdfFile(idx)}
                                    className="text-white/40 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer shrink-0"
                                    title="إزالة الملف"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button 
                          type="button"
                          onClick={handleGenerate}
                          disabled={(!aiSummaryTopic.trim() && !aiSummaryPromptText.trim() && aiSummaryPdfFiles.length === 0) || isGenerating}
                          className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>جاري التلخيص الذكي للدرس...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} className="text-emerald-200" />
                              <span>توليد الملخص بالذكاء الاصطناعي</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        <label className="block text-sm font-bold text-white/70 mb-3">
                          ارفع صور أو ملف (PDF, PPT) للبدء
                        </label>
                        
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
                                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-white/40 hover:text-rose-400 transition-colors p-1 cursor-pointer">
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <button 
                          onClick={handleGenerate}
                          disabled={topicFiles.length === 0 || isGenerating}
                          className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
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
            <div className={`w-full flex-1 flex flex-col min-w-0 ${activeTool === 'summaries' ? 'bg-[#040817]/90 p-4 sm:p-6 min-h-[500px]' : 'bg-[#0A1024]/80 border border-white/5 rounded-3xl p-5 shadow-lg relative h-fit min-h-[400px]'} overflow-hidden`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-white/5 pb-4 gap-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Bot size={18} className={activeToolData?.color} />
                  النتيجة
                </h3>

                {activeDisplayContent && !isGenerating && !activeDisplayContent.startsWith('تم إلغاء') && !activeDisplayContent.startsWith('عذراً، حدث خطأ') && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 bg-[#050812] border border-white/10 rounded-xl p-1.5 shadow-xl w-full">
                    {activeTool === 'competitions' || activeTool === 'homework' || activeTool === 'summaries' ? (
                      <button 
                        onClick={() => {
                          const title = activeTool === 'competitions' ? "اسم المسابقة" : activeTool === 'homework' ? "اسم الواجب" : "عنوان الملخص";
                          const currentName = activeTool === 'summaries' ? activeSummaryTitle : saveName;
                          const newName = prompt(`أدخل ${title}:`, currentName);
                          if (newName !== null) {
                            if (activeTool === 'summaries') {
                              if (summaryMode === 'image') setSummaryImageTitle(newName);
                              else if (summaryMode === 'manual') setSummaryManualTitle(newName);
                              else setAiSummaryTopic(newName);
                            }
                            setSaveName(newName);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 h-9 ${
                          activeTool === 'competitions' 
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300' 
                            : activeTool === 'homework' 
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300' 
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                        } border border-white/10 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-none justify-center`}
                        title={activeTool === 'competitions' ? "تسمية المسابقة" : activeTool === 'homework' ? "تسمية الواجب" : "تسمية الملخص"}
                      >
                        <Edit2 size={14} />
                        <span className="truncate max-w-[120px]">
                          {activeTool === 'summaries' ? activeSummaryTitle : (saveName ? `${saveName}` : (activeTool === 'competitions' ? 'تسمية المسابقة' : 'تسمية الواجب'))}
                        </span>
                      </button>
                    ) : null}

                    <button 
                      onClick={copyToClipboardHandler}
                      className="flex items-center gap-1.5 px-3 h-9 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white/60 hover:text-white transition-all flex-1 sm:flex-none justify-center"
                      title="نسخ النتيجة"
                    >
                      {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                    
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
                                : activeTool === 'summaries'
                                ? "عنوان أو اسم الملخص..."
                                : "اسم الملف (اختياري)..."
                            }
                            value={activeTool === 'summaries' ? activeSummaryTitle : saveName}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (activeTool === 'summaries') {
                                if (summaryMode === 'image') setSummaryImageTitle(val);
                                else if (summaryMode === 'manual') setSummaryManualTitle(val);
                                else setAiSummaryTopic(val);
                              } else {
                                setSaveName(val);
                              }
                            }}
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
                      const isPublishable = activeTool === 'homework' || activeTool === 'competitions' || activeTool === 'summaries' ||
                        (activeTool === 'history' && (() => {
                          const savedItem = savedResults.find(r => r.content === generatedContent);
                          const originalTool = tools.find(t => t.title === savedItem?.tool)?.id;
                          return originalTool === 'homework' || originalTool === 'competitions' || originalTool === 'summaries';
                        })());
                        
                      if (isPublishable) {
                        return (
                          <>
                            <div className="hidden sm:block w-px h-5 bg-white/10 mx-1"></div>
                            <button
                              onClick={() => openPublishModal('regular')}
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
                ) : activeDisplayContent ? (
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
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:border-purple-500/30 transition-all duration-300 w-full overflow-hidden text-white/80 leading-relaxed text-sm md:text-base font-medium break-words my-2" dir="auto" {...props}>
                              {children}
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
                          ),
                          img: ({node, src, alt, ...props}: any) => (
                            <span 
                              onClick={() => { if (src) setPreviewingImageUrl(src); }}
                              className="block my-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl max-w-full cursor-pointer hover:border-emerald-500/50 transition-all group"
                              title="انقر لتكبير الصورة في شاشة كاملة"
                            >
                              <img 
                                src={src} 
                                alt={alt || (activeTool === 'summaries' ? "صفحة الملخص" : "صورة الواجب")} 
                                className="w-full max-h-[500px] object-contain rounded-xl block group-hover:scale-[1.01] transition-transform" 
                                {...props} 
                              />
                              {alt && <span className="block p-2.5 text-center text-xs text-white/60 font-bold bg-black/20 border-t border-white/5">{alt}</span>}
                            </span>
                          )
                        }}
                      >
                        {activeDisplayContent}
                      </ReactMarkdown>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 p-6 text-center">
                    {activeTool === 'summaries' ? (
                      summaryMode === 'image' ? (
                        <div className="flex flex-col items-center gap-2 max-w-sm">
                          <ImageIcon size={48} className="mb-2 opacity-30 text-teal-400" />
                          <p className="font-bold text-sm text-teal-200/80">
                            حدد صورة أو عدة صور للملخص لعرضها وتنسيقها هنا
                          </p>
                          <p className="text-xs text-white/40">
                            يمكنك اختيار أكثر من صورة دفعة واحدة لصفحات الملخص واعتمادها أو نشرها للطلاب
                          </p>
                        </div>
                      ) : summaryMode === 'manual' ? (
                        <div className="flex flex-col items-center gap-2 max-w-sm">
                          <Edit2 size={48} className="mb-2 opacity-30 text-amber-400" />
                          <p className="font-bold text-sm text-amber-200/80">
                            اكتب نص الملخص في الجانب الأيمن لعرضه هنا مباشرة
                          </p>
                          <p className="text-xs text-white/40">
                            سيتم تنسيق العناوين والنقاط والملاحظات فوراً وبشكل مرتب للطلاب
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 max-w-sm">
                          <Sparkles size={48} className="mb-2 opacity-30 text-emerald-400" />
                          <p className="font-bold text-sm text-white/70">
                            ارفع ملف الدرس أو صوره واضغط توليد ذكي لإنشاء الملخص
                          </p>
                          <p className="text-xs text-white/40">
                            سيقوم الذكاء الاصطناعي باستخراج الأفكار والمفاهيم الرئيسية وتلخيصها بدقة
                          </p>
                        </div>
                      )
                    ) : (
                      <>
                        <Sparkles size={48} className="mb-4 opacity-20" />
                        <p className="font-bold text-sm">ارفع صورة للموضوع واضغط للبدء</p>
                      </>
                    )}
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

      {/* Fullscreen Image Preview Modal for Summary Images */}
      <AnimatePresence>
        {previewingImageUrl && (
          <div 
            onClick={() => setPreviewingImageUrl(null)}
            className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl max-h-[90vh] p-2 bg-[#0C1229] border border-white/20 rounded-2xl shadow-2xl flex flex-col items-center" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setPreviewingImageUrl(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer z-10"
                title="إغلاق"
              >
                <X size={16} />
              </button>
              <img src={previewingImageUrl} alt="معاينة الصورة" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    
      {/* Homework & Content Publishing Schedule Modal */}
      <AnimatePresence>
        {showPublishScheduleModal && (
          <div 
            onClick={() => setShowPublishScheduleModal(false)}
            className="fixed inset-0 z-[12000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B132B] border border-amber-500/30 rounded-3xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[85dvh] sm:max-h-[85vh] overflow-hidden text-right my-auto"
              dir="rtl"
            >
              {/* Header (Fixed at top) */}
              <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#0B132B] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base sm:text-lg leading-tight">جدولة موعد نشر الواجب للطلاب</h3>
                    <p className="text-white/40 text-xs mt-0.5">اختر متى يصبح الواجب مرئياً للطلاب وأولياء الأمور</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPublishScheduleModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Options List */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 flex flex-col gap-4 min-h-0">
                {/* Section Selector: Allows choosing target sections at decision time */}
                <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Users size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-white">تحديد الشعب الموكلة للنشر:</span>
                        <span className="block text-[10px] text-cyan-300 font-medium">
                          {selectedPublishSections.length === assignedSectionsList.length
                            ? "محدد: كافة الشعب الموكلة ⚡"
                            : `محدد: ${selectedPublishSections.length} شعبة من أصل ${assignedSectionsList.length}`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPublishSections.length === assignedSectionsList.length) {
                          setSelectedPublishSections(selectedClass && selectedClass !== 'ALL' && selectedClass !== 'كافة الشُعب' ? [selectedClass] : [assignedSectionsList[0]]);
                        } else {
                          setSelectedPublishSections([...assignedSectionsList]);
                        }
                      }}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
                    >
                      {selectedPublishSections.length === assignedSectionsList.length ? "إلغاء تحديد الكل" : "تحديد كافة الشعب ⚡"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {assignedSectionsList.map((secName) => {
                      const isChecked = selectedPublishSections.includes(secName);
                      return (
                        <button
                          key={secName}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              if (selectedPublishSections.length > 1) {
                                setSelectedPublishSections(prev => prev.filter(s => s !== secName));
                              }
                            } else {
                              setSelectedPublishSections(prev => [...prev, secName]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border select-none ${
                            isChecked
                              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-[1.02]"
                              : "bg-black/30 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked ? "bg-white text-cyan-800 border-white" : "border-white/30 bg-transparent"
                          }`}>
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span>{secName.startsWith("شعبة") ? secName : `شعبة ${secName}`}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  {[
                    { id: 'now', title: '⚡ نشر فوري الآن', desc: 'يصل الواجب مباشرة وتتم إتاحته للجميع حالاً' },
                    { id: 'tomorrow_am', title: '🌅 غداً صباحاً (08:00 ص)', desc: 'يظهر للطلاب صباح اليوم التالي مع بدء الدوام' },
                    { id: 'tomorrow_pm', title: '🌆 غداً عصراً (04:00 م)', desc: 'يظهر للطلاب عصراً للمراجعة وحل الواجبات' },
                    { id: 'after_tomorrow_am', title: '📅 بعد غد صباحاً (08:00 ص)', desc: 'جدولة مسبقة بعد يومين من الآن' },
                    { id: 'custom', title: '⏰ تحديد تاريخ ووقت مخصص', desc: 'اختر يدوياً التاريخ والساعة الدقيقة' },
                  ].map(opt => {
                    const isSelected = scheduleChoice === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setScheduleChoice(opt.id)}
                        className={`w-full p-3 sm:p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer select-none active:scale-[0.99] ${
                          isSelected 
                            ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                          isSelected ? 'border-amber-400 bg-amber-400' : 'border-white/30'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#0B132B]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-white">{opt.title}</div>
                          <div className="text-xs text-white/50 mt-0.5">{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}

                  {scheduleChoice === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3.5 bg-black/50 border border-amber-500/40 rounded-2xl flex flex-col gap-3 mt-1 text-right"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} /> حدد تاريخ ووقت النشر الدقيق:
                        </span>
                        <span className="text-[11px] text-amber-200/90 font-mono" dir="ltr">
                          {customDate} | {customTime}
                        </span>
                      </div>

                      {/* Date Row with Quick Day Buttons */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-white/70">التاريخ:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            dir="ltr"
                            lang="en-US"
                            value={customDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-amber-400 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomDate(new Date().toISOString().split('T')[0])}
                            className={`px-2.5 py-2 border rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                              customDate === new Date().toISOString().split('T')[0]
                                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                                : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                            }`}
                          >
                            اليوم
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const tm = new Date();
                              tm.setDate(tm.getDate() + 1);
                              setCustomDate(tm.toISOString().split('T')[0]);
                            }}
                            className={`px-2.5 py-2 border rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                              customDate === (() => { const tm = new Date(); tm.setDate(tm.getDate() + 1); return tm.toISOString().split('T')[0]; })()
                                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                                : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                            }`}
                          >
                            غداً
                          </button>
                        </div>
                      </div>

                      {/* Time Row with Quick Presets */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-white/70">الساعة / الوقت:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            dir="ltr"
                            lang="en-US"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-28 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-amber-400 cursor-pointer"
                          />
                          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                            {[
                              { label: '08:00 ص', val: '08:00' },
                              { label: '12:00 ظ', val: '12:00' },
                              { label: '04:00 م', val: '16:00' },
                              { label: '08:00 م', val: '20:00' },
                            ].map(t => (
                              <button
                                key={t.val}
                                type="button"
                                onClick={() => setCustomTime(t.val)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition-all shrink-0 cursor-pointer ${
                                  customTime === t.val 
                                    ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md' 
                                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Arabic Readable Date & Time Preview Badge */}
                      <div className="mt-1 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                        <span className="text-[11px] font-bold text-amber-300">
                          📅 موعد النشر المحدد: {(() => {
                            try {
                              const [y, m, d] = customDate.split('-').map(Number);
                              const [hh, mm] = customTime.split(':').map(Number);
                              const dateObj = new Date(y, m - 1, d, hh, mm);
                              return dateObj.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' - الساعة ' + dateObj.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
                            } catch {
                              return `${customDate} الساعة ${customTime}`;
                            }
                          })()}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Summary note */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white/70 flex items-center gap-2 shrink-0">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span>
                    {scheduleChoice === 'now' 
                      ? 'سيتم النشر فوراً للطلاب وأولياء الأمور مع إشعار بالواجب.' 
                      : 'سيبقى الواجب محفوظاً في سجلك ويمكنك نشره يدوياً في أي لحظة قبل الموعد.'}
                  </span>
                </div>
              </div>

              {/* Footer (Fixed at bottom) */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-white/10 bg-[#0B132B] z-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={confirmAndExecutePublish}
                  disabled={isPublishing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isPublishing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  <span>{scheduleChoice === 'now' ? 'تأكيد النشر الفوري الآن' : 'تأكيد وحفظ الجدولة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublishScheduleModal(false)}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer"
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
