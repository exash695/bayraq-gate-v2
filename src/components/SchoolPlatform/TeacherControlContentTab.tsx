import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { motion, AnimatePresence } from 'motion/react';
import { useWebRTCStream } from '../../hooks/useWebRTCStream';
import { sounds } from "../../lib/sounds";
import { GlobalAnnouncementsBanner } from '../GlobalAnnouncementsBanner';
import { GlobalAnnouncementsPopup } from '../GlobalAnnouncementsPopup';
import { useRemoteConfig } from '../../services/remoteConfig';
import { SeasonalThemeBanner } from "../SeasonalThemeBanner";
import { TeacherAIAssistant } from "../TeacherAIAssistant";
import { copyToClipboard } from "../../utils/clipboard";
import { AIEnhancedRadar } from "../AIEnhancedRadar";
import { AIQuestionAssistantModal } from "../AIQuestionAssistantModal";
import { AIPaperExtractorModal } from "../AIPaperExtractorModal";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  increment,
  updateDoc,
  deleteDoc,
  arrayUnion,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  db,
  auth,
  storage,
} from "../../lib/firebase";
import { handleFirestoreError, OperationType } from "../../lib/firestoreUtils";
import { academicService } from "../../services/academicService";
import { compressImage } from "../../utils/imageCompressor";
import {
  computeExcellencePoints,
  computeAcademicIdentity,
  getLevelData,
  OUTSTANDING_BADGES,
  getSubjectsForGrade,
} from "../../utils/studentUtils";
import {
  Rss, FolderOpen, Megaphone, GraduationCap, ArrowRight, Star, LayoutGrid, BookOpen,
  Award, Trophy, Crown, Languages, Sigma, Zap, Laptop, Calculator, Globe, Palette,
  Briefcase, Library, Dna, Earth, Atom, Variable, Book, FlaskConical, Microscope,
  ScrollText, User, ShieldCheck, Users, Pin, Lock, Bell, Sparkles, Feather, Compass,
  Landmark, LineChart, Plus, Activity, BookOpenText, AlertCircle, Shirt, Camera,
  MonitorPlay, Layers, FileUp, FileText, CheckCircle, Video, Radio, Edit2, Trash2,
  Coffee, RefreshCw, FlipHorizontal, Upload, Eye, Save, Heart, MessageCircle, Share2,
  MoreHorizontal, Image as ImageIcon, School as SchoolIcon, Calendar, X, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, Mic, MicOff, VideoOff, ThumbsUp, Send, Clock,
  HelpCircle, Hand as HandIcon, PenTool, Search, Filter, MailQuestion, ShieldAlert,
  Database, Bot, ClipboardCheck, Play, Target, Terminal, Bug, Info, Unlock, Download,
  Minimize2, Scan, XCircle, MessageSquare
} from "lucide-react";
import { SchoolContent } from "../SchoolContent";
import { BroadcastTicker } from "../BroadcastTicker";
import { StudentLounge } from "../StudentLounge";
import { StudentSupportForm } from "../StudentSupportForm";
import { StudentSchedule } from "../StudentSchedule";
import { ScheduleAlerter } from "../ScheduleAlerter";
import { ConfirmDialog } from "../ConfirmDialog";
import StrictContentViewer from "../StrictContentViewer";
import { Station1Viewer } from "../Station1Viewer";
import { SixthAcademyPro } from "../SixthAcademyPro";
import { TransformerLogsViewer } from "../TransformerLogsViewer";
import { BerqCharacter } from "../BerqCharacterManager";
import { safeStorage, safeSessionStorage } from '../../lib/storage';
import { processPdfInForeground, parseLiteralTextToBlocks } from "../../utils/pdfProcessor";
import { SixtySecondChallenge } from "../SixtySecondChallenge";
import { TeacherQuestionBank } from "../TeacherQuestionBank";
import DevDashboard from "../DevDashboard";
import { VerticalScrollPicker } from "./VerticalScrollPicker";
import { RevealBlock, RenderTextWithTags } from "./RevealBlock";
import { VideoComments } from "./VideoComments";
import { PostCommentsSection } from "./PostCommentsSection";
import { pushSocialNotification } from "./SocialNotifications";
import {
  sanitizeForFirestore,
  stopStoryAudio,
  playStoryAudio,
  initStoryAudioContext,
  getSimulatedFileContent,
  generateQuestionsForDocument,
  getSanitizedVideoUrl,
} from "./utils";
import type { Teacher, MaterialField, Post, SchoolPlatformProps, PlatformTab, HandRaiseRequest, LiveQuestion } from "./types";
import { useSchoolPlatform } from "./SchoolPlatformContext";

export const TeacherControlContentTab: React.FC = () => {
  const { academyPages, activeWorkingClass, aiExtractionAbortControllerRef, aiExtractionError, aiExtractionLogs, aiExtractionPercent, aiExtractionProgress, aiExtractionTimeRemaining, debugFileName, debugFileSize, debugLastOperation, debugPageCount, debugStartTime, editingQueueIndex, extractedAiTitle, getFileNameFromStack, getFunctionNameFromStack, isExtractingAiText, isMountedRef, navTriggers, pendingEditorTab, pendingExtractedAi, pendingUnitTitle, previewPageIndex, progress, revealedSolutions, schoolId, setAcademyPages, setAiExtractionError, setAiExtractionLogs, setAiExtractionPercent, setAiExtractionProgress, setAiExtractionTimeRemaining, setDebugFileName, setDebugFileSize, setDebugLastOperation, setDebugPageCount, setDebugStartTime, setDeletingAcademyPageId, setEditingQueueIndex, setExtractedAiTitle, setIsExtractingAiText, setPendingEditorTab, setPendingExtractedAi, setPendingUnitTitle, setPreviewPageIndex, setRevealedSolutions, setSelectedAcademyPage, setShowAiCancelConfirm, setShowDebugLogsPanel, setShowTransformerLogs, setSingleUploadedPagesQueue, showAiCancelConfirm, showDebugLogsPanel, showToast, showTransformerLogs, singleUploadedPagesQueue, teacherData, userProfile } = useSchoolPlatform();

  return (
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full max-w-full px-0 sm:px-4 md:px-6 pb-6">
                  {/* Left Col: Upload & extraction */}
                  <div className="flex-1 space-y-4 w-full min-w-0">
                    <div className="bg-[#0E152D]/60 border border-white/5 p-3 sm:p-5 md:p-6 rounded-none sm:rounded-2xl border-x-0 sm:border-x border-y w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles
                            size={14}
                            className="text-amber-400 animate-pulse"
                          />
                          محول العرض التفاعلي الذكي
                        </h3>
                      </div>

                      {/* Error Diagnostic Panel inside Content tab itself */}
                      {aiExtractionError && (
                        <div className="bg-red-950/25 border border-red-500/20 rounded-xl p-6 mb-6 text-right relative overflow-hidden animate-in fade-in slide-in-from-top duration-300" dir="rtl">
                          <div className="absolute top-0 left-0 w-[150px] h-[150px] bg-red-500/5 rounded-full blur-[40px] pointer-events-none" />
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                              <ShieldAlert size={20} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white text-base font-black mb-1 font-sans">حدث خطأ أثناء المعالجة الذكية للملزمة</h4>
                              <p className="text-red-300/80 text-xs font-bold font-sans leading-relaxed">
                                {aiExtractionError.message}
                              </p>
                            </div>
                          </div>

                          {/* Technical metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-4 rounded-xl mb-4 text-xs">
                            <div>
                              <span className="text-white/40 block mb-0.5">اسم الملف:</span>
                              <span className="text-white font-black truncate block">{aiExtractionError.fileName || "غير معروف"}</span>
                            </div>
                            <div>
                              <span className="text-white/40 block mb-0.5">حجم الملف:</span>
                              <span className="text-white font-mono font-bold block">
                                {aiExtractionError.fileSize ? `${(aiExtractionError.fileSize / (1024 * 1024)).toFixed(2)} ميغابايت` : "غير معروف"}
                              </span>
                            </div>
                            <div>
                              <span className="text-white/40 block mb-0.5">عدد الصفحات كلياً:</span>
                              <span className="text-white font-mono font-bold block">
                                {aiExtractionError.pageCount || "غير متاح (فشل قبل فك الضغط)"}
                              </span>
                            </div>
                          </div>

                          {/* Extraction Logs */}
                          {aiExtractionLogs.length > 0 && (
                            <div className="mb-4 text-right">
                              <span className="text-white/40 text-xs font-bold block mb-2">سجل تتبع مراحل معالجة الملزمة التفصيلي (Phase Logs):</span>
                              <div className="bg-black/80 font-mono text-[10.5px] text-zinc-300 p-4 rounded-xl space-y-1.5 max-h-[160px] overflow-y-auto border border-white/5 leading-relaxed text-left no-scrollbar" style={{ direction: 'ltr' }}>
                                {aiExtractionLogs.map((logLine, idx) => {
                                  let isErrorLine = logLine.includes("[CRITICAL") || logLine.includes("[ERROR") || logLine.includes("انهيار");
                                  let isWarningLine = logLine.includes("تحذير") || logLine.includes("WARNING");
                                  let is30PercentLine = logLine.includes("30%");
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`py-0.5 border-b border-white/[0.02] last:border-0 ${
                                        isErrorLine ? 'text-red-400 font-bold' : 
                                        isWarningLine ? 'text-amber-300 font-bold' : 
                                        is30PercentLine ? 'text-sky-300 font-black bg-sky-500/10 px-1.5 py-0.5 rounded' : 
                                        'text-zinc-400'
                                      }`}
                                    >
                                      {logLine}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Expanded Technical Stack details */}
                          <details className="group mb-6 border border-white/5 rounded-xl overflow-hidden bg-black/20 text-right">
                            <summary className="px-4 py-3 text-xs font-bold text-white/50 hover:text-white cursor-pointer select-none flex items-center justify-between">
                              <span>التتبع التقني لخطأ الكومة البرمجية (Error Stack Trace)</span>
                              <span className="transition-transform duration-200 group-open:rotate-180">▼</span>
                            </summary>
                            <div className="p-4 bg-black/40 border-t border-white/5 font-mono text-[9px] text-red-300 overflow-x-auto whitespace-pre leading-relaxed text-left no-scrollbar" style={{ direction: 'ltr' }}>
                              {aiExtractionError.stack}
                            </div>
                          </details>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => {
                                setAiExtractionError(null);
                                setAiExtractionLogs([]);
                              }}
                              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs py-3 rounded-xl transition-all border border-red-500/30 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(239,68,68,0.2)]"
                            >
                              إغلاق ومحاولة الرفع مجدداً
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Single Elegant Top Queue Card */}
                      {singleUploadedPagesQueue.length > 0 && (
                        <div className="mb-4 bg-gradient-to-r from-[#0C1929] via-[#0A1224] to-[#070B18] border border-emerald-500/40 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-in fade-in duration-300">
                          {/* Top Mini Header */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              <span className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>📦 طابور الدمج الذكي</span>
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                                  {singleUploadedPagesQueue.length} {singleUploadedPagesQueue.length === 1 ? 'صفحة جاهزة' : 'صفحات جاهزة'}
                                </span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("هل أنت متأكد من رغبتك في إفراغ طابور الدمج؟")) {
                                  setSingleUploadedPagesQueue([]);
                                  try { safeStorage.removeItem("s6_uploaded_pages_queue"); } catch(e) {}
                                  showToast("تم إفراغ طابور الدمج", "info");
                                }
                              }}
                              className="text-[10px] text-rose-400/80 hover:text-rose-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <span>🗑️</span>
                              <span>إفراغ</span>
                            </button>
                          </div>

                          {/* Compact Queued Pages List */}
                          <div className="py-2.5 flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar">
                            {singleUploadedPagesQueue.map((item, idx) => (
                              <div
                                key={item.queueId || idx}
                                className="flex items-center justify-between sm:justify-start gap-2 bg-[#060D1F] border border-emerald-500/25 hover:border-emerald-400/50 rounded-xl px-2.5 py-1.5 transition-all text-xs w-full sm:w-auto"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </div>

                                  <span className="font-bold text-white/90 text-[11px] truncate max-w-[160px] sm:max-w-[200px]" title={item.title}>
                                    {item.title || `صفحة ${idx + 1}`}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 mr-1">
                                  {/* Quick Preview */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAcademyPage(item)}
                                    className="p-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                                    title="معاينة الصفحة"
                                  >
                                    👁️
                                  </button>

                                  {/* Quick Edit */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingQueueIndex(idx);
                                      const cloned = JSON.parse(JSON.stringify(item));
                                      if (!cloned.structuredContent && cloned.pages?.[0]?.structuredContent) {
                                        cloned.structuredContent = cloned.pages[0].structuredContent;
                                      }
                                      if (!cloned.quiz && cloned.pages?.[0]?.quiz) {
                                        cloned.quiz = cloned.pages[0].quiz;
                                      }
                                      if (!cloned.ministerialQuestions && cloned.pages?.[0]?.ministerialQuestions) {
                                        cloned.ministerialQuestions = cloned.pages[0].ministerialQuestions;
                                      }
                                      setPendingExtractedAi(cloned);
                                      setExtractedAiTitle(item.title || `صفحة ${idx + 1}`);
                                      setPendingUnitTitle(item.subtitle || item.unitTitle || "");
                                      showToast(`✏️ جاري تعديل الصفحة ${idx + 1} - تبقى في الطابور بأمان`, "info");
                                      setTimeout(() => {
                                        document.getElementById('pending-editor-container')?.scrollIntoView({ behavior: 'smooth' });
                                      }, 100);
                                    }}
                                    className={`p-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${editingQueueIndex === idx ? 'bg-blue-500 text-white ring-2 ring-blue-400' : 'bg-blue-500/10 hover:bg-blue-500/25 text-blue-300'}`}
                                    title="تعديل نصوص وأسئلة الصفحة"
                                  >
                                    ✏️
                                  </button>

                                  {/* Remove */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingQueueIndex === idx) {
                                        setEditingQueueIndex(null);
                                        setPendingExtractedAi(null);
                                      }
                                      setSingleUploadedPagesQueue(prev => prev.filter((_, i) => i !== idx));
                                      showToast("تم حذف الصفحة من الطابور", "info");
                                    }}
                                    className="p-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                                    title="حذف من الطابور"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Compact Merge Controls Bar */}
                          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <input
                              type="text"
                              value={extractedAiTitle}
                              onChange={(e) => setExtractedAiTitle(e.target.value)}
                              placeholder="عنوان الملزمة المدمجة (مثال: ملزمة اليونت الأول كاملاً)..."
                              className="flex-1 w-full bg-[#050A18] border border-emerald-500/30 focus:border-emerald-400 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const schoolIdToUse = schoolId || userProfile?.schoolId || teacherData?.schoolId || "school1";
                                  
                                  let allMergedPages: any[] = [];
                                  singleUploadedPagesQueue.forEach((item) => {
                                    if (item.pages && Array.isArray(item.pages) && item.pages.length > 0) {
                                      item.pages.forEach((p: any) => {
                                        allMergedPages.push({
                                          ...p,
                                          pageNumber: allMergedPages.length + 1,
                                          title: p.title || item.title || `صفحة ${allMergedPages.length + 1}`,
                                          subtitle: p.subtitle || item.subtitle || "الوحدة الأولى",
                                          structuredContent: Array.isArray(p.structuredContent) && p.structuredContent.length > 0 ? p.structuredContent : (Array.isArray(item.structuredContent) ? item.structuredContent : []),
                                          quiz: Array.isArray(p.quiz) && p.quiz.length > 0 ? p.quiz : (Array.isArray(item.quiz) ? item.quiz : []),
                                          ministerialQuestions: Array.isArray(p.ministerialQuestions) && p.ministerialQuestions.length > 0 ? p.ministerialQuestions : (Array.isArray(item.ministerialQuestions) ? item.ministerialQuestions : []),
                                          rawText: p.rawText || p.extractedText || item.extractedText || item.rawText || ""
                                        });
                                      });
                                    } else {
                                      allMergedPages.push({
                                        pageNumber: allMergedPages.length + 1,
                                        title: item.title || `صفحة ${allMergedPages.length + 1}`,
                                        subtitle: item.subtitle || item.unitTitle || "الوحدة الأولى",
                                        structuredContent: Array.isArray(item.structuredContent) ? item.structuredContent : [],
                                        quiz: Array.isArray(item.quiz) ? item.quiz : [],
                                        ministerialQuestions: Array.isArray(item.ministerialQuestions) ? item.ministerialQuestions : [],
                                        rawText: item.extractedText || item.rawText || ""
                                      });
                                    }
                                  });

                                  allMergedPages.forEach((p, pIdx) => {
                                    p.absoluteIndex = pIdx;
                                    p.pageNumber = pIdx + 1;
                                  });

                                  const generatedBookletId = `booklet_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                                  const finalBooklet = {
                                    title: extractedAiTitle || "الملزمة المدمجة الشاملة",
                                    schoolId: schoolIdToUse,
                                    pages: allMergedPages,
                                    order: Date.now()
                                  };

                                  setAcademyPages(prev => {
                                    const next = [{ id: generatedBookletId, ...finalBooklet }, ...prev];
                                    try { safeStorage.setItem("s6_cached_academy_pages", JSON.stringify(next)); } catch(e) {}
                                    return next;
                                  });

                                  try {
                                    const docRef = await addDoc(collection(db, "academy_pages"), sanitizeForFirestore({
                                      ...finalBooklet,
                                      createdAt: serverTimestamp(),
                                    }));
                                    setAcademyPages(prev => {
                                      const next = prev.map(p => p.id === generatedBookletId ? { ...p, id: docRef.id } : p);
                                      try { safeStorage.setItem("s6_cached_academy_pages", JSON.stringify(next)); } catch(e) {}
                                      return next;
                                    });
                                  } catch(fsErr) {
                                    console.warn("Firestore booklet save fallback to local storage:", fsErr);
                                  }

                                  showToast(`🔗 تم دمج ونشر ${singleUploadedPagesQueue.length} صفحة في ملزمة واحدة بنجاح!`, "success");
                                  setSingleUploadedPagesQueue([]);
                                  setEditingQueueIndex(null);
                                  setPendingExtractedAi(null);
                                  try { safeStorage.removeItem("s6_uploaded_pages_queue"); } catch(e) {}
                                  setExtractedAiTitle("");
                                  setSelectedAcademyPage({ id: generatedBookletId, ...finalBooklet });
                                } catch (e) {
                                  console.error(e);
                                  showToast("فشل دمج ونشر الصفحات", "error");
                                }
                              }}
                              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <span>✨</span>
                              <span>دمج ونشر ({singleUploadedPagesQueue.length} صفحات)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Upload zone */}
                      {!pendingExtractedAi ? (
                        <div className="border border-dashed border-white/10 hover:border-blue-500/40 rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:bg-blue-600/[0.01] transition-all relative overflow-hidden group">
                          {!isExtractingAiText && (
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              disabled={isExtractingAiText}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                              onChange={async (e: any) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              e.target.value = "";

                              setAiExtractionError(null);
                              setAiExtractionLogs([]);
                              setIsExtractingAiText(true);
                              
                              const schoolIdToUse =
                                schoolId ||
                                userProfile?.schoolId ||
                                teacherData?.schoolId;

                              const file = files[0] as File;
                              
                              if (file.type === "application/pdf" && file.size > 50 * 1024 * 1024) {
                                showToast("حجم الملف كبير جداً. يرجى رفع ملف لا يتجاوز 50 ميغابايت حتى لا يؤثر على أداء جهازك.", "error");
                                setIsExtractingAiText(false);
                                return;
                              }

                              try {
                                setAiExtractionError(null);
                                setDebugStartTime(new Date().toLocaleTimeString('ar-EG'));
                                setDebugFileName(file.name);
                                setDebugFileSize(file.size ? `${(file.size / (1024 * 1024)).toFixed(2)} ميغابايت` : "غير معروف");
                                setDebugPageCount(null);
                                setDebugLastOperation("[STEP 1] File Upload Started - جاري تحميل الملف المرفوع...");
                                (window as any).__currentStep = "STEP 1";

                                aiExtractionAbortControllerRef.current = new AbortController();

                                const result = await processPdfInForeground(file, (state) => {
                                  if (!isMountedRef.current) return;
                                  if (state.isProcessing !== undefined) setIsExtractingAiText(state.isProcessing);
                                  if (state.message !== undefined) setAiExtractionProgress(state.message);
                                  if (state.progress !== undefined) setAiExtractionPercent(state.progress);
                                  if (state.timeRemaining !== undefined) setAiExtractionTimeRemaining(state.timeRemaining);
                                  if (state.stageLogs !== undefined) {
                                    setAiExtractionLogs(state.stageLogs);
                                    
                                    const lastLog = state.stageLogs[state.stageLogs.length - 1];
                                    if (lastLog) {
                                      setDebugLastOperation(lastLog);
                                      
                                      const pageMatch = lastLog.match(/الملف على (\d+) صفحة/) || lastLog.match(/يحتوي الملف على (\d+) صفحة/);
                                      if (pageMatch) {
                                        setDebugPageCount(parseInt(pageMatch[1]));
                                      }
                                      
                                      const stepMatch = lastLog.match(/\[(STEP \d+)\]/);
                                      if (stepMatch) {
                                        (window as any).__currentStep = stepMatch[1];
                                      }
                                    }
                                  }
                                }, aiExtractionAbortControllerRef.current.signal);

                                setPendingExtractedAi({
                                  ...result,
                                  schoolId: schoolIdToUse,
                                });
                                setExtractedAiTitle(result.title || "الدرس الافتراضي");
                                setPendingUnitTitle(result.unitTitle || result.pages?.[0]?.subtitle || "الوحدة الأولى");
                                setPreviewPageIndex(0);
                                setPendingEditorTab('blocks');
                                setTimeout(() => {
                                  try {
                                    document.getElementById('pending-editor-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  } catch(e) {}
                                }, 150);
                                showToast("اكتملت معالجة الصفحة بنجاح! يمكنك الآن معاينتها تفاعلياً، تسميتها، وحفظها أو إضافتها لطابور الدمج", "success");
                              } catch (err: any) {
                                if (!isMountedRef.current) return;
                                let errMsg = typeof err === 'string' ? err : (err?.message || err?.reason || "");
                                const isAbort = 
                                  err?.name === "AbortError" || 
                                  errMsg.includes("without reason") || 
                                  errMsg.includes("aborted") || 
                                  errMsg.includes("abort") || 
                                  errMsg.includes("cancel") || 
                                  errMsg.includes("إلغاء") || 
                                  false;

                                if (isAbort) {
                                  console.log("تم اكتشاف إيقاف مقصود للعملية (Abort). لا يعتبر خطأ.");
                                  if (typeof window !== 'undefined' && (window as any).logTransformerAction) {
                                    (window as any).logTransformerAction("Cancel Response", "استجابة الخادم: تم استلام إشارة الإلغاء وقطع الاتصالات النشطة بنجاح.", undefined, undefined);
                                    (window as any).logTransformerAction("Cancel State Update", "تحديث حالة المعالجة: إيقاف شريط التقدم وتصفير النسبة المئوية.", undefined, undefined);
                                  }
                                  showToast("تم إلغاء معالجة الملف بنجاح.", "success");
                                } else {
                                  console.error("Real Error during extraction:", err);
                                  
                                  if (typeof window !== 'undefined' && (window as any).logTransformerAction) {
                                    (window as any).logTransformerAction("Transformer Error", `Error details recorded inside the active page:\nUnhandled Exception\n\n${errMsg}`, "Error", undefined, err);
                                  }

                                  setAiExtractionError({
                                    message: errMsg || "حدث خطأ غير متوقع أثناء معالجة الملف.",
                                    stack: err?.stack || "لا تتوفر تفاصيل تتبع إضافية.",
                                    fileName: file.name,
                                    fileSize: file.size,
                                    pageCount: debugPageCount || 0
                                  });
                                  
                                  setShowTransformerLogs(true);
                                  
                                  showToast(
                                    errMsg || "حدث خطأ غير متوقع أثناء معالجة الملف.",
                                    "error"
                                  );
                                }
                              } finally {
                                if (isMountedRef.current) {
                                  setIsExtractingAiText(false);
                                  setAiExtractionProgress("");
                                  setAiExtractionPercent(0);
                                  setAiExtractionTimeRemaining(undefined);
                                  aiExtractionAbortControllerRef.current = null;
                                  if (typeof window !== 'undefined' && (window as any).logTransformerAction) {
                                    (window as any).logTransformerAction("Cancel UI Update", "تحديث واجهة المستخدم: إغلاق نوافذ التأكيد وإعادة تعيين واجهة الرفع بالكامل بنجاح.", undefined, undefined);
                                  }
                                }
                              }
                            }}
                          />
                          )}
                          <div className="space-y-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 mx-auto">
                              {isExtractingAiText ? (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FileUp size={20} />
                              )}
                            </div>
                            <p className="text-white/80 text-xs font-bold">
                              {isExtractingAiText ? aiExtractionProgress : "رفع صفحة مفردة بدقة حرفية 100% (PDF / صورة)"}
                            </p>
                            <p className="text-white/30 text-[10px] leading-relaxed max-w-xs mx-auto font-medium">
                              {isExtractingAiText 
                                ? "المسار الشامل يعمل الآن على معالجة وهيكلة البيانات..."
                                : "استخراج دقيق وحرفي للمحتوى دون أي تلخيص أو حذف، مع إمكانية دمج الصفحات لاحقاً في ملف واحد."}
                            </p>
                            {isExtractingAiText && (
                              <>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4 max-w-[250px] mx-auto relative group">
                                  <motion.div 
                                    initial={{ width: "0%" }} 
                                    animate={{ width: `${Math.max(5, aiExtractionPercent)}%` }} 
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-[#00E5FF] to-blue-500 rounded-full" 
                                  />
                                  {aiExtractionTimeRemaining !== undefined && aiExtractionTimeRemaining > 0 && (
                                    <div className="absolute -bottom-6 w-full text-center text-white/40 text-[9px]">
                                      الوقت المتبقي تقريباً: {Math.floor(aiExtractionTimeRemaining / 60000)} دقيقة و {Math.floor((aiExtractionTimeRemaining % 60000) / 1000)} ثانية
                                    </div>
                                  )}
                                </div>
                                <div className="text-center mt-2 text-[#00E5FF] text-[10px] font-bold">
                                  %{aiExtractionPercent}
                                </div>
                                {showAiCancelConfirm ? (
                                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[110] flex flex-col items-center justify-center rounded-xl animate-in fade-in zoom-in duration-200">
                                    <p className="text-white text-sm font-bold mb-4">هل أنت متأكد من إلغاء معالجة الملف؟</p>
                                    <div className="flex gap-4">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          try {
                                            if (typeof window !== "undefined" && (window as any).logTransformerAction) {
                                              (window as any).logTransformerAction("Cancel Click", "الحدث: تم الضغط على زر إلغاء العملية وتأكيد الإيقاف من قبل المستخدم.", undefined, undefined);
                                            }
                                            const abortParams = {
                                              abortController: aiExtractionAbortControllerRef.current,
                                              processingState: isExtractingAiText,
                                              processingTask: "AI_PDF_EXTRACTION",
                                              currentJob: "EXTRACT_TEXT",
                                              activeWorker: !!aiExtractionAbortControllerRef.current ? "ACTIVE" : "NONE",
                                              uploadedFile: "UNKNOWN (Handled by onChange scope)"
                                            };
                                            
                                            console.log("[Cancel Validation] Examining values before abort:", abortParams);

                                            if (!abortParams.abortController && !abortParams.processingState) {
                                              console.log("لا توجد عملية معالجة نشطة لإلغائها.");
                                              setShowAiCancelConfirm(false);
                                              return;
                                            }

                                            console.log("[Cancel Action] User confirmed cancel. Aborting...");
                                            if (aiExtractionAbortControllerRef.current) {
                                              console.log("[Cancel Action] Calling abort() on active AbortController.");
                                              aiExtractionAbortControllerRef.current.abort();
                                            } else {
                                              console.log("[Cancel Action] Warning: No active AbortController found to abort.");
                                            }
                                            setShowAiCancelConfirm(false);
                                          } catch (error) {
                                            console.error("[Cancel Error] Crash inside Cancel onClick:", error);
                                            showToast("حدث خطأ أثناء محاولة الإلغاء. يرجى مراجعة Console.", "error");
                                          }
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-xs"
                                      >
                                        نعم، إلغاء المعالجة
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowAiCancelConfirm(false);
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-xs"
                                      >
                                        متابعة المعالجة
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowAiCancelConfirm(true);
                                    }}
                                    className="mt-6 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-bold hover:bg-red-500/20 transition-colors z-[100] relative mx-auto block"
                                  >
                                    إلغاء العملية
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div id="pending-editor-container" className={`bg-[#080D21] border-2 rounded-2xl p-4 animate-in fade-in zoom-in duration-300 shadow-2xl space-y-3.5 ${editingQueueIndex !== null ? 'border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.25)]' : (pendingExtractedAi?.id && !pendingExtractedAi.id.toString().startsWith("booklet_")) ? 'border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.25)]' : 'border-blue-500/40 shadow-[0_0_35px_rgba(59,130,246,0.2)]'}`}>
                          {(() => {
                            const totalPendingPages = (pendingExtractedAi?.pages && Array.isArray(pendingExtractedAi.pages) && pendingExtractedAi.pages.length > 0)
                              ? pendingExtractedAi.pages.length
                              : 1;
                            const activePageIndex = Math.min(Math.max(0, previewPageIndex), totalPendingPages - 1);
                            const activePendingPage = (pendingExtractedAi?.pages && Array.isArray(pendingExtractedAi.pages) && pendingExtractedAi.pages.length > 0)
                              ? pendingExtractedAi.pages[activePageIndex]
                              : pendingExtractedAi;

                            const activePageBlocks = (activePendingPage?.structuredContent || []) as any[];
                            const activePageQuiz = (activePendingPage?.quiz || []) as any[];
                            const activePageMinisterial = (activePendingPage?.ministerialQuestions || []) as any[];
                            const activePageRaw = activePendingPage?.extractedText || activePendingPage?.rawText || (
                              activePageBlocks
                                .map((b: any) => b.content || (b.vocabItems ? b.vocabItems.map((v: any) => `${v.en}: ${v.ar}`).join(", ") : ""))
                                .filter(Boolean)
                                .join("\n\n")
                            ) || "";

                            const totalBlocksCount = (pendingExtractedAi?.pages && Array.isArray(pendingExtractedAi.pages) && pendingExtractedAi.pages.length > 0)
                              ? pendingExtractedAi.pages.reduce((acc: number, p: any) => acc + (p.structuredContent?.length || 0), 0)
                              : activePageBlocks.length;

                            const totalQuizCount = (pendingExtractedAi?.pages && Array.isArray(pendingExtractedAi.pages) && pendingExtractedAi.pages.length > 0)
                              ? pendingExtractedAi.pages.reduce((acc: number, p: any) => acc + (p.quiz?.length || 0), 0)
                              : activePageQuiz.length;

                            const totalMinisterialCount = (pendingExtractedAi?.pages && Array.isArray(pendingExtractedAi.pages) && pendingExtractedAi.pages.length > 0)
                              ? pendingExtractedAi.pages.reduce((acc: number, p: any) => acc + (p.ministerialQuestions?.length || 0), 0)
                              : activePageMinisterial.length;

                            // Real-time raw text sync to structured blocks handler
                            const handleRawTextChange = (val: string) => {
                              const parsedBlocks = parseLiteralTextToBlocks(val);
                              setPendingExtractedAi((prev: any) => {
                                if (!prev) return prev;
                                if (prev.pages && Array.isArray(prev.pages) && prev.pages.length > 0) {
                                  const nextPages = [...prev.pages];
                                  nextPages[activePageIndex] = {
                                    ...nextPages[activePageIndex],
                                    extractedText: val,
                                    rawText: val,
                                    structuredContent: parsedBlocks
                                  };
                                  return {
                                    ...prev,
                                    pages: nextPages,
                                    structuredContent: activePageIndex === 0 ? parsedBlocks : prev.structuredContent,
                                    extractedText: activePageIndex === 0 ? val : prev.extractedText,
                                    rawText: activePageIndex === 0 ? val : prev.rawText,
                                  };
                                } else {
                                  return {
                                    ...prev,
                                    extractedText: val,
                                    rawText: val,
                                    structuredContent: parsedBlocks
                                  };
                                }
                              });
                            };

                            const handleSwitchPage = (newIdx: number) => {
                              const boundedIdx = Math.max(0, Math.min(totalPendingPages - 1, newIdx));
                              setPreviewPageIndex(boundedIdx);
                              const targetPage = pendingExtractedAi?.pages?.[boundedIdx];
                              if (targetPage?.title && !extractedAiTitle) {
                                setExtractedAiTitle(targetPage.title);
                              }
                            };

                            return (
                              <>
                                {/* Header & Status */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${editingQueueIndex !== null ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.5)]'}`}>
                                      <Sparkles size={16} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs sm:text-sm text-white font-black flex items-center gap-1.5">
                                        {editingQueueIndex !== null ? (
                                          <span className="text-emerald-300 flex items-center gap-1.5">
                                            <span>✏️</span>
                                            <span>تعديل الصفحة رقم ({editingQueueIndex + 1}) في طابور الدمج</span>
                                          </span>
                                        ) : (pendingExtractedAi?.id && !pendingExtractedAi.id.toString().startsWith("booklet_")) ? (
                                          "تعديل ملزمة تفاعلية معتمدة"
                                        ) : (
                                          "✨ تم تجهيز المحول التفاعلي بنجاح!"
                                        )}
                                      </h4>
                                      <p className="text-[10px] text-white/50">
                                        {editingQueueIndex !== null 
                                          ? "يتم عرض النص الحرفي فقط للتعديل المباشر وحفظه بالطابور"
                                          : `استخراج علمي حرفي 100% بدون نقصان • إجمالي ${totalPendingPages} صفحة`}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Quick Stats Chips */}
                                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                                      📄 {totalPendingPages} صفحة
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                                      🧩 {totalBlocksCount} كتل (ص{activePageIndex + 1}: {activePageBlocks.length})
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                      ⚡ {totalQuizCount} تحدي 60 ثانية
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                                      🏛️ {totalMinisterialCount} وزاريات
                                    </span>
                                  </div>
                                </div>

                                {/* Multi-Page Navigation Bar (when document has multiple pages) */}
                                {totalPendingPages > 1 && (
                                  <div className="bg-[#050A18] border border-blue-500/30 rounded-xl p-2.5 flex flex-col gap-2 shadow-inner">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                                          <span>📖</span>
                                          <span>تصفح صفحات المستند ({totalPendingPages} صفحة):</span>
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 text-[10px] font-bold border border-blue-400/30">
                                          الصفحة الحالية: {activePageIndex + 1} من {totalPendingPages}
                                        </span>
                                      </div>

                                      {/* Prev / Next & Dropdown */}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={activePageIndex === 0}
                                          onClick={() => handleSwitchPage(activePageIndex - 1)}
                                          className="px-2.5 py-1 bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                                          title="الصفحة السابقة"
                                        >
                                          <span>◀</span>
                                          <span>السابق</span>
                                        </button>

                                        <select
                                          value={activePageIndex}
                                          onChange={(e) => handleSwitchPage(Number(e.target.value))}
                                          className="bg-[#0B1229] border border-blue-500/40 text-blue-300 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 cursor-pointer"
                                        >
                                          {Array.from({ length: totalPendingPages }).map((_, pI) => (
                                            <option key={pI} value={pI}>
                                              صفحة {pI + 1} {pendingExtractedAi.pages?.[pI]?.title ? `- ${pendingExtractedAi.pages[pI].title.substring(0, 18)}` : ''}
                                            </option>
                                          ))}
                                        </select>

                                        <button
                                          type="button"
                                          disabled={activePageIndex === totalPendingPages - 1}
                                          onClick={() => handleSwitchPage(activePageIndex + 1)}
                                          className="px-2.5 py-1 bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                                          title="الصفحة التالية"
                                        >
                                          <span>التالي</span>
                                          <span>▶</span>
                                        </button>
                                      </div>
                                    </div>

                                    {/* Quick Page Pills Strip */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
                                      {Array.from({ length: totalPendingPages }).map((_, pI) => {
                                        const isCurrent = pI === activePageIndex;
                                        return (
                                          <button
                                            key={pI}
                                            type="button"
                                            onClick={() => handleSwitchPage(pI)}
                                            className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                                              isCurrent
                                                ? 'bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] border border-blue-300 scale-105'
                                                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                                            }`}
                                          >
                                            <span>ص {pI + 1}</span>
                                            {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Sleek Single Toolbar: Title, Unit, and Actions in One Unified Row */}
                                <div className="bg-[#050A18] border border-white/10 rounded-xl p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  {/* Title input */}
                                  <div className="flex-1 min-w-0 w-full flex items-center bg-[#0B1229] border border-blue-500/30 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400">
                                    <span className="text-[11px] text-white/50 ml-1.5 whitespace-nowrap">🏷️ الدرس:</span>
                                    <input 
                                      type="text"
                                      value={extractedAiTitle}
                                      onChange={(e) => setExtractedAiTitle(e.target.value)}
                                      placeholder="عنوان الدرس / الصفحة..."
                                      className="w-full min-w-0 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                                    />
                                  </div>

                                  {/* Unit input */}
                                  <div className="w-full sm:w-44 flex items-center bg-[#0B1229] border border-white/10 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400">
                                    <span className="text-[11px] text-white/50 ml-1.5 whitespace-nowrap">📚 اليونت:</span>
                                    <input 
                                      type="text"
                                      value={pendingUnitTitle}
                                      onChange={(e) => setPendingUnitTitle(e.target.value)}
                                      placeholder="Unit..."
                                      className="w-full min-w-0 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none"
                                    />
                                  </div>

                                  {/* Unified Action Buttons */}
                                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto shrink-0">
                                    {/* 1. Preview */}
                                    <button
                                      type="button"
                                      title="معاينة العرض التفاعلي الحي لجميع الصفحات"
                                      onClick={() => {
                                        const allPagesToPreview = (pendingExtractedAi.pages && pendingExtractedAi.pages.length > 0)
                                          ? pendingExtractedAi.pages.map((p: any, idx: number) => ({
                                              ...p,
                                              pageNumber: p.pageNumber || idx + 1,
                                              title: idx === activePageIndex ? (extractedAiTitle || p.title || `صفحة ${idx + 1}`) : (p.title || `صفحة ${idx + 1}`),
                                              subtitle: idx === activePageIndex ? (pendingUnitTitle || p.subtitle || "") : (p.subtitle || ""),
                                              structuredContent: p.structuredContent || [],
                                              quiz: p.quiz || [],
                                              ministerialQuestions: p.ministerialQuestions || [],
                                              rawText: p.extractedText || p.rawText || "",
                                              extractedText: p.extractedText || p.rawText || ""
                                            }))
                                          : [{
                                              pageNumber: editingQueueIndex !== null ? editingQueueIndex + 1 : 1,
                                              title: extractedAiTitle || pendingExtractedAi.title || "الدرس الافتراضي",
                                              subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "الوحدة الأولى",
                                              structuredContent: activePageBlocks,
                                              quiz: activePageQuiz,
                                              ministerialQuestions: activePageMinisterial,
                                              rawText: activePageRaw,
                                              extractedText: activePageRaw
                                            }];

                                        const previewObj = {
                                          ...pendingExtractedAi,
                                          title: extractedAiTitle || pendingExtractedAi.title || "الدرس الافتراضي",
                                          subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "الوحدة الأولى",
                                          pages: allPagesToPreview,
                                          structuredContent: allPagesToPreview[activePageIndex]?.structuredContent || allPagesToPreview[0]?.structuredContent || [],
                                          quiz: allPagesToPreview[activePageIndex]?.quiz || allPagesToPreview[0]?.quiz || [],
                                          ministerialQuestions: allPagesToPreview[activePageIndex]?.ministerialQuestions || allPagesToPreview[0]?.ministerialQuestions || [],
                                          rawText: allPagesToPreview[activePageIndex]?.rawText || allPagesToPreview[0]?.rawText || "",
                                          extractedText: allPagesToPreview[activePageIndex]?.extractedText || allPagesToPreview[0]?.extractedText || ""
                                        };
                                        setSelectedAcademyPage(previewObj);
                                      }}
                                      className="px-2.5 py-2 sm:py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg border border-indigo-400/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                                    >
                                      <Eye size={13} />
                                      <span>معاينة {totalPendingPages > 1 ? `(${totalPendingPages} ص)` : ''}</span>
                                    </button>

                                    {/* 2. Save / Install */}
                                    {editingQueueIndex !== null ? (
                                      <button
                                        type="button"
                                        title="حفظ التعديلات في الطابور"
                                        onClick={() => {
                                          const currentRaw = activePageRaw;
                                          const currentBlocks = activePageBlocks.length > 0 ? activePageBlocks : parseLiteralTextToBlocks(currentRaw);
                                          const currentQuiz = activePageQuiz;
                                          const currentMinisterial = activePageMinisterial;

                                          const updatedItem = {
                                            ...pendingExtractedAi,
                                            title: extractedAiTitle || pendingExtractedAi.title || `صفحة ${editingQueueIndex + 1}`,
                                            subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                            structuredContent: currentBlocks,
                                            quiz: currentQuiz,
                                            ministerialQuestions: currentMinisterial,
                                            rawText: currentRaw,
                                            extractedText: currentRaw,
                                            pages: [{
                                              pageNumber: editingQueueIndex + 1,
                                              title: extractedAiTitle || pendingExtractedAi.title || `صفحة ${editingQueueIndex + 1}`,
                                              subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                              structuredContent: currentBlocks,
                                              quiz: currentQuiz,
                                              ministerialQuestions: currentMinisterial,
                                              rawText: currentRaw,
                                              extractedText: currentRaw
                                            }]
                                          };

                                          setSingleUploadedPagesQueue(prev => {
                                            const next = [...prev];
                                            next[editingQueueIndex] = updatedItem;
                                            try { safeStorage.setItem("s6_uploaded_pages_queue", JSON.stringify(next)); } catch(e) {}
                                            return next;
                                          });

                                          showToast(`✅ تم حفظ تعديلات الصفحة ${editingQueueIndex + 1} في الطابور بنجاح!`, "success");
                                          setPendingExtractedAi(null);
                                          setEditingQueueIndex(null);
                                          setExtractedAiTitle("");
                                          setPendingUnitTitle("");
                                        }}
                                        className="px-2.5 py-2 sm:py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-lg border border-emerald-400/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                      >
                                        <Save size={13} />
                                        <span>تثبيت التعديل</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        title="تثبيت ونشر لجميع الصفحات"
                                        onClick={async () => {
                                          try {
                                            const allPagesToSave = (pendingExtractedAi.pages && pendingExtractedAi.pages.length > 0)
                                              ? pendingExtractedAi.pages.map((p: any, idx: number) => ({
                                                  ...p,
                                                  pageNumber: p.pageNumber || idx + 1,
                                                  title: idx === activePageIndex ? (extractedAiTitle || p.title || `صفحة ${idx + 1}`) : (p.title || `صفحة ${idx + 1}`),
                                                  subtitle: idx === activePageIndex ? (pendingUnitTitle || p.subtitle || "") : (p.subtitle || ""),
                                                  structuredContent: p.structuredContent || [],
                                                  quiz: p.quiz || [],
                                                  ministerialQuestions: p.ministerialQuestions || [],
                                                  rawText: p.extractedText || p.rawText || "",
                                                  extractedText: p.extractedText || p.rawText || ""
                                                }))
                                              : [{
                                                  pageNumber: 1,
                                                  title: extractedAiTitle || pendingExtractedAi.title || "بدون عنوان",
                                                  subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                                  structuredContent: activePageBlocks,
                                                  quiz: activePageQuiz,
                                                  ministerialQuestions: activePageMinisterial,
                                                  rawText: activePageRaw,
                                                  extractedText: activePageRaw
                                                }];

                                            const isEditing = !!(pendingExtractedAi?.id && !pendingExtractedAi.id.toString().startsWith("booklet_"));
                                            if (isEditing) {
                                              const { id, ...dataToUpdate } = pendingExtractedAi;
                                              const pageRef = doc(db, "academy_pages", id);
                                              const payload = sanitizeForFirestore({
                                                ...dataToUpdate,
                                                title: extractedAiTitle || pendingExtractedAi.title || "بدون عنوان",
                                                subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                                pages: allPagesToSave,
                                                structuredContent: allPagesToSave[0]?.structuredContent || [],
                                                quiz: allPagesToSave[0]?.quiz || [],
                                                ministerialQuestions: allPagesToSave[0]?.ministerialQuestions || [],
                                                rawText: allPagesToSave[0]?.rawText || "",
                                                extractedText: allPagesToSave[0]?.extractedText || "",
                                              });
                                              try {
                                                await updateDoc(pageRef, payload);
                                              } catch (err) {
                                                await setDoc(pageRef, payload, { merge: true });
                                              }
                                            } else {
                                              const { id: _, ...cleanData } = pendingExtractedAi;
                                              const schoolIdToUse = schoolId || userProfile?.schoolId || teacherData?.schoolId || "school1";
                                              const generatedId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                                              const newPageObj = {
                                                ...cleanData,
                                                title: extractedAiTitle || pendingExtractedAi.title || "بدون عنوان",
                                                subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                                pages: allPagesToSave,
                                                structuredContent: allPagesToSave[0]?.structuredContent || [],
                                                quiz: allPagesToSave[0]?.quiz || [],
                                                ministerialQuestions: allPagesToSave[0]?.ministerialQuestions || [],
                                                rawText: allPagesToSave[0]?.rawText || "",
                                                extractedText: allPagesToSave[0]?.extractedText || "",
                                                schoolId: schoolIdToUse,
                                                order: Date.now(),
                                              };

                                              setAcademyPages(prev => {
                                                const next = [{ id: generatedId, ...newPageObj }, ...prev];
                                                try { safeStorage.setItem("s6_cached_academy_pages", JSON.stringify(next)); } catch(e) {}
                                                return next;
                                              });

                                              try {
                                                const docRef = await addDoc(collection(db, "academy_pages"), sanitizeForFirestore({
                                                  ...newPageObj,
                                                  createdAt: serverTimestamp(),
                                                }));
                                                setAcademyPages(prev => {
                                                  const next = prev.map(p => p.id === generatedId ? { ...p, id: docRef.id } : p);
                                                  try { safeStorage.setItem("s6_cached_academy_pages", JSON.stringify(next)); } catch(e) {}
                                                  return next;
                                                });
                                              } catch(fsErr) {
                                                console.warn("Firestore save fallback to local storage:", fsErr);
                                              }
                                            }
                                            showToast(isEditing ? "تم حفظ التعديلات بنجاح!" : `✅ تم حفظ ونشر المحتوى التفاعلي (${allPagesToSave.length} صفحة) للطلاب بنجاح!`, "success");
                                            setPendingExtractedAi(null);
                                            setExtractedAiTitle("");
                                            setPendingUnitTitle("");
                                          } catch(e) {
                                            console.error(e);
                                            showToast("فشل في حفظ وتثبيت المحتوى", "error");
                                          }
                                        }}
                                        className="px-2.5 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg border border-emerald-400/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                                      >
                                        <Save size={13} />
                                        <span>{pendingExtractedAi?.id && !pendingExtractedAi.id.toString().startsWith("booklet_") ? 'حفظ' : `تثبيت (${totalPendingPages} ص)`}</span>
                                      </button>
                                    )}

                                    {/* 3. Add to Merge Queue */}
                                    <button
                                      type="button"
                                      title="إضافة الصفحات إلى طابور الدمج"
                                      onClick={() => {
                                        if (pendingExtractedAi.pages && pendingExtractedAi.pages.length > 1) {
                                          const itemsToAdd = pendingExtractedAi.pages.map((p: any, pIdx: number) => ({
                                            ...p,
                                            queueId: `queue_${Date.now()}_${pIdx}_${Math.random().toString(36).substr(2, 6)}`,
                                            title: p.title || `${extractedAiTitle || 'صفحة'} (${pIdx + 1})`,
                                            subtitle: p.subtitle || pendingUnitTitle || "",
                                            structuredContent: p.structuredContent || [],
                                            quiz: p.quiz || [],
                                            ministerialQuestions: p.ministerialQuestions || [],
                                            rawText: p.extractedText || p.rawText || "",
                                            extractedText: p.extractedText || p.rawText || "",
                                            pages: [{
                                              pageNumber: singleUploadedPagesQueue.length + pIdx + 1,
                                              title: p.title || `${extractedAiTitle || 'صفحة'} (${pIdx + 1})`,
                                              subtitle: p.subtitle || pendingUnitTitle || "",
                                              structuredContent: p.structuredContent || [],
                                              quiz: p.quiz || [],
                                              ministerialQuestions: p.ministerialQuestions || [],
                                              rawText: p.extractedText || p.rawText || ""
                                            }]
                                          }));
                                          setSingleUploadedPagesQueue(prev => [...prev, ...itemsToAdd]);
                                          setPendingExtractedAi(null);
                                          setEditingQueueIndex(null);
                                          setExtractedAiTitle("");
                                          setPendingUnitTitle("");
                                          showToast(`➕ تمت إضافة جميع الصفحات (${itemsToAdd.length} صفحة) إلى طابور الدمج بنجاح!`, "success");
                                        } else {
                                          const itemToAdd = {
                                            ...pendingExtractedAi,
                                            queueId: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
                                            title: extractedAiTitle || pendingExtractedAi.title || `صفحة ${singleUploadedPagesQueue.length + 1}`,
                                            subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                            structuredContent: activePageBlocks,
                                            quiz: activePageQuiz,
                                            ministerialQuestions: activePageMinisterial,
                                            rawText: activePageRaw,
                                            extractedText: activePageRaw,
                                            pages: [{
                                              pageNumber: singleUploadedPagesQueue.length + 1,
                                              title: extractedAiTitle || pendingExtractedAi.title || `صفحة ${singleUploadedPagesQueue.length + 1}`,
                                              subtitle: pendingUnitTitle || pendingExtractedAi.subtitle || "",
                                              structuredContent: activePageBlocks,
                                              quiz: activePageQuiz,
                                              ministerialQuestions: activePageMinisterial,
                                              rawText: activePageRaw
                                            }]
                                          };
                                          setSingleUploadedPagesQueue(prev => [...prev, itemToAdd]);
                                          setPendingExtractedAi(null);
                                          setEditingQueueIndex(null);
                                          setExtractedAiTitle("");
                                          setPendingUnitTitle("");
                                          showToast(`➕ تمت إضافة الصفحة إلى طابور الدمج (${singleUploadedPagesQueue.length + 1} صفحات حالياً)!`, "success");
                                        }
                                      }}
                                      className="px-2.5 py-2 sm:py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold rounded-lg border border-amber-400/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm"
                                    >
                                      <Plus size={13} />
                                      <span>{editingQueueIndex !== null ? 'نسخ للطابور' : `إضافة (${totalPendingPages} ص)`}</span>
                                    </button>

                                    {/* 4. Cancel / Close */}
                                    <button
                                      type="button"
                                      title="إلغاء المعالجة / إغلاق"
                                      onClick={() => {
                                        setPendingExtractedAi(null);
                                        setEditingQueueIndex(null);
                                        setExtractedAiTitle("");
                                        setPendingUnitTitle("");
                                        showToast("تم إغلاق المحرر مع الاحتفاظ بالصفحات في الطابور بأمان", "info");
                                      }}
                                      className="px-2 py-2 sm:py-1.5 bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 text-xs font-medium rounded-lg border border-white/10 hover:border-rose-500/30 flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                                    >
                                      <X size={13} />
                                      <span>إلغاء المعالجة</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Content Inspection or Queue Raw Text View */}
                                {editingQueueIndex !== null ? (
                                  /* ONLY Raw Literal Text Editor for Queue Editing */
                                  <div className="bg-[#050A18] border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                                        <span>📜</span>
                                        <span>النص الحرفي للصفحة ({editingQueueIndex + 1}) في الطابور (تعديل مباشر):</span>
                                      </div>
                                      <span className="text-[10px] text-white/40 font-mono">
                                        {activePageRaw.length} حرف
                                      </span>
                                    </div>
                                    
                                    <textarea
                                      value={activePageRaw}
                                      onChange={(e) => handleRawTextChange(e.target.value)}
                                      rows={12}
                                      className="w-full p-3.5 bg-black/70 border border-emerald-500/30 focus:border-emerald-400 rounded-xl text-emerald-100 font-mono text-xs whitespace-pre-wrap leading-relaxed focus:outline-none shadow-inner"
                                      placeholder="أدخل أو عدّل النص الحرفي هنا بدقة..."
                                    />

                                    <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
                                      <span>💡 عند الضغط على "تثبيت التعديل" في الشريط بالأعلى سيتم حفظ التعديلات في الطابور مع الحفاظ على الصفحة.</span>
                                    </div>
                                  </div>
                                ) : (
                                /* In-Place Content Inspection and LIVE TABS */
                                <div className="bg-[#050A18] border border-white/10 rounded-xl p-3.5 space-y-3">
                                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-2">
                                    <span className="text-[11px] font-black text-white/80 flex items-center gap-1.5">
                                      <span>📑 فحص ومعاينة الصفحة الحالية ({activePageIndex + 1} من {totalPendingPages}):</span>
                                      <span className="text-[10px] text-emerald-400 font-normal">(التعديل عبر النص الحرفي)</span>
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setPendingEditorTab('blocks')}
                                        className={`px-3 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${pendingEditorTab === 'blocks' ? 'bg-blue-500 text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white'}`}
                                      >
                                        🧩 الكتل الهيكلية ({activePageBlocks.length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingEditorTab('quiz')}
                                        className={`px-3 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${pendingEditorTab === 'quiz' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-white/60 hover:text-white'}`}
                                      >
                                        ⚡ أسئلة 60 ثانية ({activePageQuiz.length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingEditorTab('ministerial')}
                                        className={`px-3 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${pendingEditorTab === 'ministerial' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white'}`}
                                      >
                                        🏛️ وزاريات ({activePageMinisterial.length})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingEditorTab('raw')}
                                        className={`px-3 py-1 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${pendingEditorTab === 'raw' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/5 text-white/60 hover:text-white'}`}
                                      >
                                        📜 النص الحرفي ✏️
                                      </button>
                                    </div>
                                  </div>

                                  {/* Tab 1: Read-Only Elegant Structured Blocks */}
                                  {pendingEditorTab === 'blocks' && (
                                    <div className="space-y-3">
                                      {/* Info Banner */}
                                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs text-blue-200">
                                          <span>✨</span>
                                          <span>الكتل الهيكلية معروضة كبطاقات تفاعلية أنيقة بدقة 100%. لتعديل النصوص، انتقل إلى تبويب <strong>"📜 النص الحرفي"</strong> وستنعكس التعديلات هنا فوراً.</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setPendingEditorTab('raw')}
                                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 transition-all cursor-pointer"
                                        >
                                          <span>✏️ تعديل النص</span>
                                        </button>
                                      </div>

                                      <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
                                        {activePageBlocks.length === 0 ? (
                                          <div className="text-center py-8 text-white/40 text-xs bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                                            لا توجد كتل هيكلية حالياً لهذه الصفحة. انتقل إلى تبويب "📜 النص الحرفي" لإدخال المحتوى.
                                          </div>
                                        ) : (
                                          activePageBlocks.map((block: any, bIdx: number) => {
                                            const solKey = `sol_${activePageIndex}_${bIdx}`;
                                            const isSolRevealed = !!revealedSolutions[solKey];

                                            // 1. Heading
                                            if (block.type === 'heading') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-[#0B1530] to-blue-950/20 shadow-md space-y-1.5">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-black border border-blue-500/30">
                                                      🏷️ عنوان رئيسي #{bIdx + 1}
                                                    </span>
                                                  </div>
                                                  <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                                                    {block.content || block.title || ""}
                                                  </h3>
                                                </div>
                                              );
                                            }

                                            // 2. Question
                                            if (block.type === 'question') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-[#071524] shadow-md space-y-2.5">
                                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/30">
                                                        ❓ سؤال وتطبيق #{bIdx + 1}
                                                      </span>
                                                      {block.difficulty && (
                                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                                          {block.difficulty}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="text-xs sm:text-sm font-bold text-cyan-100 leading-relaxed whitespace-pre-wrap">
                                                    {block.content || block.questionText || ""}
                                                  </div>
                                                  {block.solutionText && (
                                                    <div className="pt-2 border-t border-cyan-500/20">
                                                      <button
                                                        type="button"
                                                        onClick={() => setRevealedSolutions(prev => ({ ...prev, [solKey]: !prev[solKey] }))}
                                                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                                      >
                                                        <span>{isSolRevealed ? "🔒 إخفاء الجواب النموذجي" : "👁️ انقر لإظهار الجواب النموذجي"}</span>
                                                      </button>
                                                      {isSolRevealed && (
                                                        <div className="mt-2 p-2.5 rounded-lg bg-black/60 border border-cyan-400/40 text-xs text-emerald-300 font-bold animate-in fade-in duration-200">
                                                          <span className="text-cyan-400 block text-[10px] mb-1">الجواب النموذجي المعتمد:</span>
                                                          {block.solutionText}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            }

                                            // 3. Note
                                            if (block.type === 'note') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-[#1A1508] shadow-md space-y-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                                                      💡 ملاحظة هامة #{bIdx + 1} {block.title ? `• ${block.title}` : ''}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs sm:text-sm text-amber-100/95 leading-relaxed whitespace-pre-wrap">
                                                    {block.content || ""}
                                                  </p>
                                                </div>
                                              );
                                            }

                                            // 4. Warning
                                            if (block.type === 'warning') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/30 to-[#1A0A10] shadow-md space-y-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                                                      ⚠️ تركيز وزاري #{bIdx + 1} {block.title ? `• ${block.title}` : ''}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs sm:text-sm text-rose-100/95 leading-relaxed whitespace-pre-wrap">
                                                    {block.content || ""}
                                                  </p>
                                                </div>
                                              );
                                            }

                                            // 5. Law / Rule
                                            if (block.type === 'law') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-purple-500/40 bg-gradient-to-r from-purple-950/30 to-[#150A20] shadow-md space-y-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-black border border-purple-500/30">
                                                      ⚖️ قاعدة / قانون #{bIdx + 1} {block.title ? `• ${block.title}` : ''}
                                                    </span>
                                                  </div>
                                                  <div className="text-xs sm:text-sm text-purple-100 font-mono font-bold leading-relaxed whitespace-pre-wrap">
                                                    {block.content || ""}
                                                  </div>
                                                </div>
                                              );
                                            }

                                            // 6. Example
                                            if (block.type === 'example') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-[#061810] shadow-md space-y-1.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                                                      🎯 مثال تطبيقي #{bIdx + 1} {block.title ? `• ${block.title}` : ''}
                                                    </span>
                                                  </div>
                                                  <p className="text-xs sm:text-sm text-emerald-100/95 leading-relaxed whitespace-pre-wrap">
                                                    {block.content || ""}
                                                  </p>
                                                </div>
                                              );
                                            }

                                            // 7. Vocabulary
                                            if (block.type === 'vocabulary') {
                                              return (
                                                <div key={bIdx} className="p-3.5 rounded-xl border border-pink-500/40 bg-gradient-to-r from-pink-950/30 to-[#1A0A18] shadow-md space-y-2.5">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-black border border-pink-500/30">
                                                      🔤 جدول المفردات #{bIdx + 1}
                                                    </span>
                                                  </div>
                                                  {block.vocabItems && block.vocabItems.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                      {block.vocabItems.map((v: any, vIdx: number) => (
                                                        <div key={vIdx} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/10 text-xs">
                                                          <span className="font-mono text-pink-300 font-bold" dir="ltr">{v.en}</span>
                                                          <span className="text-white/90">{v.ar}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <p className="text-xs sm:text-sm text-pink-100 leading-relaxed whitespace-pre-wrap">
                                                      {block.content || ""}
                                                    </p>
                                                  )}
                                                </div>
                                              );
                                            }

                                            // 8. Default: Paragraph
                                            return (
                                              <div key={bIdx} className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/60 text-[10px] font-bold">
                                                    📝 فقرة شرح #{bIdx + 1} {block.title ? `• ${block.title}` : ''}
                                                  </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                                                  {block.content || ""}
                                                </p>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Tab 2: Live Editable 60s Quiz */}
                                  {pendingEditorTab === 'quiz' && (() => {
                                    const quiz = activePageQuiz;
                                    const updateQuiz = (newQuiz: any[]) => {
                                      setPendingExtractedAi((prev: any) => {
                                        if (!prev) return prev;
                                        if (prev.pages && Array.isArray(prev.pages) && prev.pages.length > 0) {
                                          const nextPages = [...prev.pages];
                                          nextPages[activePageIndex] = { ...nextPages[activePageIndex], quiz: newQuiz };
                                          return {
                                            ...prev,
                                            pages: nextPages,
                                            quiz: activePageIndex === 0 ? newQuiz : prev.quiz
                                          };
                                        }
                                        return { ...prev, quiz: newQuiz };
                                      });
                                    };

                                    return (
                                      <div className="space-y-3">
                                        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
                                          {quiz.length === 0 ? (
                                            <div className="text-center py-6 text-white/40 text-xs bg-amber-500/[0.02] rounded-xl border border-dashed border-amber-500/20">
                                              لم يتم إضافة أسئلة تحدي 60 ثانية لهذه الصفحة بعد. يمكنك إضافة سؤال جديد بالأسفل.
                                            </div>
                                          ) : (
                                            quiz.map((q: any, qIdx: number) => (
                                              <div key={qIdx} className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                  <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-amber-400 text-black font-black text-[10px] flex items-center justify-center">
                                                      {qIdx + 1}
                                                    </span>
                                                    <span className="font-bold text-amber-300">سؤال تحدي الـ 60 ثانية #{qIdx + 1} (صفحة {activePageIndex + 1})</span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const next = quiz.filter((_, i) => i !== qIdx);
                                                      updateQuiz(next);
                                                    }}
                                                    className="p-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded text-[10px]"
                                                    title="حذف السؤال"
                                                  >
                                                    🗑️
                                                  </button>
                                                </div>

                                                {/* Question Text */}
                                                <textarea
                                                  value={q.question || ''}
                                                  onChange={(e) => {
                                                    const next = [...quiz];
                                                    next[qIdx] = { ...next[qIdx], question: e.target.value };
                                                    updateQuiz(next);
                                                  }}
                                                  placeholder="نص السؤال السريع..."
                                                  rows={2}
                                                  className="w-full bg-[#060D1F] border border-amber-500/30 focus:border-amber-400 rounded-lg p-2 text-xs text-white focus:outline-none"
                                                />

                                                {/* Options Grid */}
                                                <div className="space-y-1.5">
                                                  <span className="text-[10px] text-amber-200/80 font-bold block">
                                                    🎯 الخيارات (اضغط على الدائرة لتحديد الإجابة الصحيحة):
                                                  </span>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {[0, 1, 2, 3].map((oIdx) => {
                                                      const isCorrect = (q.correct ?? 0) === oIdx;
                                                      return (
                                                        <div 
                                                          key={oIdx}
                                                          className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isCorrect ? 'bg-emerald-500/20 border-emerald-500/60' : 'bg-black/30 border-white/10'}`}
                                                        >
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const next = [...quiz];
                                                              next[qIdx] = { ...next[qIdx], correct: oIdx };
                                                              updateQuiz(next);
                                                            }}
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${isCorrect ? 'border-emerald-400 bg-emerald-500 text-black font-black text-[9px]' : 'border-white/30 bg-transparent'}`}
                                                          >
                                                            {isCorrect && "✓"}
                                                          </button>
                                                          <input
                                                            type="text"
                                                            value={q.options?.[oIdx] || ''}
                                                            onChange={(e) => {
                                                              const next = [...quiz];
                                                              const opts = [...(next[qIdx].options || ["", "", "", ""])];
                                                              opts[oIdx] = e.target.value;
                                                              next[qIdx] = { ...next[qIdx], options: opts };
                                                              updateQuiz(next);
                                                            }}
                                                            placeholder={`الخيار ${oIdx + 1}`}
                                                            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                                                          />
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>

                                                {/* Explanation */}
                                                <div>
                                                  <input
                                                    type="text"
                                                    value={q.explanation || ''}
                                                    onChange={(e) => {
                                                      const next = [...quiz];
                                                      next[qIdx] = { ...next[qIdx], explanation: e.target.value };
                                                      updateQuiz(next);
                                                    }}
                                                    placeholder="💡 تفسير الإجابة الصحيحة أو تلميح للطالب..."
                                                    className="w-full bg-[#060D1F] border border-amber-500/20 rounded-lg px-2.5 py-1.5 text-xs text-amber-200/90 focus:outline-none placeholder-amber-300/30"
                                                  />
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>

                                        {/* Add Question Button */}
                                        <div className="pt-2 border-t border-white/10">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateQuiz([
                                                ...quiz,
                                                { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }
                                              ]);
                                            }}
                                            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <span>➕</span>
                                            <span>إضافة سؤال تحدي 60 ثانية جديد للصفحة {activePageIndex + 1}</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Tab 3: Live Editable Ministerial Questions */}
                                  {pendingEditorTab === 'ministerial' && (() => {
                                    const ministerial = activePageMinisterial;
                                    const updateMinisterial = (newMin: any[]) => {
                                      setPendingExtractedAi((prev: any) => {
                                        if (!prev) return prev;
                                        if (prev.pages && Array.isArray(prev.pages) && prev.pages.length > 0) {
                                          const nextPages = [...prev.pages];
                                          nextPages[activePageIndex] = { ...nextPages[activePageIndex], ministerialQuestions: newMin };
                                          return {
                                            ...prev,
                                            pages: nextPages,
                                            ministerialQuestions: activePageIndex === 0 ? newMin : prev.ministerialQuestions
                                          };
                                        }
                                        return { ...prev, ministerialQuestions: newMin };
                                      });
                                    };

                                    return (
                                      <div className="space-y-3">
                                        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 no-scrollbar">
                                          {ministerial.length === 0 ? (
                                            <div className="text-center py-6 text-white/40 text-xs bg-emerald-500/[0.02] rounded-xl border border-dashed border-emerald-500/20">
                                              لا توجد أسئلة وزارية مسجلة للصفحة {activePageIndex + 1} حالياً. يمكنك إضافة سؤال وزاري بالأسفل.
                                            </div>
                                          ) : (
                                            ministerial.map((m: any, mIdx: number) => (
                                              <div key={mIdx} className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                                                <div className="flex items-center justify-between gap-2">
                                                  <div className="flex items-center gap-2 flex-1">
                                                    <span className="font-bold text-emerald-300">سؤال وزاري #{mIdx + 1} (صفحة {activePageIndex + 1})</span>
                                                    <input
                                                      type="text"
                                                      value={m.years || ''}
                                                      onChange={(e) => {
                                                        const next = [...ministerial];
                                                        next[mIdx] = { ...next[mIdx], years: e.target.value };
                                                        updateMinisterial(next);
                                                      }}
                                                      placeholder="السنة والدور (مثال: 2023 دور أول)"
                                                      className="bg-[#060D1F] border border-emerald-500/30 rounded-lg px-2.5 py-1 text-xs text-emerald-200 focus:outline-none font-bold"
                                                    />
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const next = ministerial.filter((_, i) => i !== mIdx);
                                                      updateMinisterial(next);
                                                    }}
                                                    className="p-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 rounded text-[10px]"
                                                    title="حذف السؤال الوزاري"
                                                  >
                                                    🗑️
                                                  </button>
                                                </div>

                                                {/* Ministerial Question */}
                                                <textarea
                                                  value={m.question || ''}
                                                  onChange={(e) => {
                                                    const next = [...ministerial];
                                                    next[mIdx] = { ...next[mIdx], question: e.target.value };
                                                    updateMinisterial(next);
                                                  }}
                                                  placeholder="نص السؤال الوزاري..."
                                                  rows={2}
                                                  className="w-full bg-[#060D1F] border border-emerald-500/30 rounded-lg p-2 text-xs text-white focus:outline-none"
                                                />

                                                {/* Ministerial Answer */}
                                                <div>
                                                  <label className="block text-[10px] text-emerald-300 font-bold mb-1">
                                                    الجواب النموذجي الوزاري:
                                                  </label>
                                                  <textarea
                                                    value={m.answer || ''}
                                                    onChange={(e) => {
                                                      const next = [...ministerial];
                                                      next[mIdx] = { ...next[mIdx], answer: e.target.value };
                                                      updateMinisterial(next);
                                                    }}
                                                    placeholder="الجواب النموذجي المعتمد في مركز الفحص..."
                                                    rows={2}
                                                    className="w-full bg-black/40 border border-emerald-500/30 rounded-lg p-2 text-xs text-emerald-200 focus:outline-none"
                                                  />
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>

                                        {/* Add Ministerial Question Button */}
                                        <div className="pt-2 border-t border-white/10">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              updateMinisterial([
                                                ...ministerial,
                                                { question: "", answer: "", years: "2023 دور أول" }
                                              ]);
                                            }}
                                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <span>➕</span>
                                            <span>إضافة سؤال وزاري جديد للصفحة {activePageIndex + 1}</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Tab 4: Live Editable Raw Verbatim Text with Real-Time Blocks Sync */}
                                  {pendingEditorTab === 'raw' && (
                                    <div className="space-y-2.5 animate-in fade-in duration-200">
                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                                          <span>✏️</span>
                                          <span>النص الحرفي للصفحة ({activePageIndex + 1} من {totalPendingPages}) - التعديل هنا ينعكس فوراً على الكتل الهيكلية:</span>
                                        </p>
                                        <span className="text-[10px] text-white/40 font-mono">
                                          {activePageRaw.length} حرف
                                        </span>
                                      </div>

                                      <textarea
                                        value={activePageRaw}
                                        onChange={(e) => handleRawTextChange(e.target.value)}
                                        rows={12}
                                        className="w-full p-3.5 bg-black/80 border border-indigo-500/30 focus:border-indigo-400 rounded-xl text-white font-mono text-xs whitespace-pre-wrap leading-relaxed focus:outline-none shadow-inner"
                                        placeholder="أدخل أو عدّل النص الحرفي هنا بدقة..."
                                      />

                                      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-200/80 leading-relaxed flex items-center justify-between flex-wrap gap-2">
                                        <span>💡 عند كتابة عناوين، أسئلة، ملاحظات، أو مفردات، يتم تحليلها وتحديث بطاقات الكتل الهيكلية تلقائياً بدقة 100%.</span>
                                        <button
                                          type="button"
                                          onClick={() => setPendingEditorTab('blocks')}
                                          className="px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold border border-blue-400/30 whitespace-nowrap cursor-pointer"
                                        >
                                          معاينة الكتل 🧩
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Real-Time Diagnostic Debug Panel Centered Overlay */}
                    <AnimatePresence>
                      {showDebugLogsPanel && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-[#0B0F19] border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right font-sans"
                          >
                            {/* Header */}
                            <div className="p-5 border-b border-white/10 bg-black/40 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#00E5FF]">
                                  <Terminal size={22} className="animate-pulse" />
                                </div>
                                <div>
                                  <h3 className="text-white text-base font-black">لوحة تشخيص وتتبع المعالج الذكي (Smart Processor Diagnostics)</h3>
                                  <p className="text-xs text-white/50 tracking-wide font-mono mt-0.5">Sixth Academy - Smart Booklet Extraction Engine v2.0</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowDebugLogsPanel(false)}
                                className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                              
                              {/* Live Stats Log Block */}
                              <div className="p-5 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#00E5FF]/5 rounded-full blur-[40px] pointer-events-none" />
                                
                                <div className="font-mono text-xs text-[#00E5FF] font-black mb-3 select-all">
                                  === AI PROCESSING LOGS ===
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-zinc-300">
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[#00E5FF]/70">● وقت بدء المعالجة:</span>{" "}
                                      <span className="text-white font-bold">{debugStartTime || "لم يتم البدء بعد"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#00E5FF]/70">● اسم الملف:</span>{" "}
                                      <span className="text-white font-bold max-w-xs truncate inline-block align-bottom">{debugFileName || "لا يوجد ملف مستهدف"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#00E5FF]/70">● حجم الملف:</span>{" "}
                                      <span className="text-white font-bold">{debugFileSize || "غير معروف"}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#00E5FF]/70">● عدد الصفحات:</span>{" "}
                                      <span className="text-white font-bold">{debugPageCount !== null ? `${debugPageCount} صفحة` : "غير متاح"}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-[#00E5FF]/70">● المرحلة الحالية:</span>{" "}
                                      <span className="px-2 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-black border border-[#00E5FF]/20">
                                        {(window as any).__currentStep || "No active process"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[#00E5FF]/70">● نسبة التقدم الحالية:</span>{" "}
                                      <span className="text-[#00E5FF] font-black">{aiExtractionPercent}%</span>
                                    </div>
                                    <div className="pt-2">
                                      <span className="text-[#00E5FF]/70 block mb-1">● آخر عملية تم تنفيذها:</span>
                                      <span className="text-white bg-black/40 px-2 py-1.5 rounded block border border-white/5 truncate max-w-md" title={debugLastOperation}>
                                        {debugLastOperation || "بانتظار تلقي الأوامر..."}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-red-400 font-bold block">● آخر خطأ إن وجد:</span>
                                      <span className="text-red-300 bg-red-950/20 px-2 py-1 rounded block border border-red-500/10 truncate font-sans font-bold">
                                        {aiExtractionError ? aiExtractionError.message : "لا يوجد أخطاء حالياً (الحالة مستقرة)"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 font-mono text-xs text-[#00E5FF]/50 text-left" dir="ltr">
                                  ==========================
                                </div>
                              </div>

                              {/* Explanatory banner for Real Reason behind automatic chat open */}
                              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3 text-right">
                                <Info className="text-amber-400 shrink-0 mt-0.5" size={18} />
                                <div>
                                  <h4 className="text-amber-400 text-xs font-black mb-1 font-sans">💡 تفسير تقني: لماذا تفتح نافذة شات المساعد تلقائياً عند الخطأ؟</h4>
                                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans font-bold">
                                    عند حدوث خطأ غير متوقع في جلب أو معالجة الدفعات بالخلفية (مثل تخطي حد معدل الطلبات 429 لـ Gemini)، فإن المتصفح يسجل تعذر جلب الاستجابة. يتسبب هذا في إعادة ضبط أو تعليق خادم عرض الواجهة، ليعرض الصفحة الترحيبية المؤقتة للبوابة. نظراً لتعثر الواجهة وإعادة تشغيل اتصال الخادم داخل الإطار (iframe)، يقوم نظام المحاكاة السحابية لـ AI Studio بفتح نافذة مساعد التطوير تلقائياً بالجانب لإبلاغك بالخطأ الحالي، ليتم مراجعة ومعالجة المشكلة فورا دون فقدان سياق الدرس!
                                  </p>
                                </div>
                              </div>

                              {/* Error Detail Highlight Section */}
                              {aiExtractionError && (
                                <div className="p-5 rounded-xl border border-red-500/30 bg-red-950/20 space-y-4">
                                  <div className="flex items-center gap-2 text-red-400 border-b border-red-500/10 pb-2">
                                    <Bug size={16} className="animate-bounce" />
                                    <span className="text-xs font-black font-sans">تفاصيل تتبع الخطأ الفني (Technical Stack-trace):</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                      <span className="text-white/40 block mb-0.5">اسم الوظيفة / الدالة:</span>
                                      <span className="text-red-400 font-bold block">{getFunctionNameFromStack(aiExtractionError.stack)}</span>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                      <span className="text-white/40 block mb-0.5">اسم الملف المصدري:</span>
                                      <span className="text-[#00E5FF] font-bold block">{getFileNameFromStack(aiExtractionError.stack)}</span>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                      <span className="text-white/40 block mb-0.5">المرحلة الحالية:</span>
                                      <span className="text-amber-400 font-bold block">{(window as any).__currentStep || "No active step"}</span>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                      <span className="text-white/40 block mb-0.5">نسبة التقدم المتوقفة:</span>
                                      <span className="text-white font-bold block">{aiExtractionPercent}%</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="text-xs text-white/40 block font-bold font-sans">تتبع الخطوات التفصيلية (Stack Trace):</span>
                                    <pre 
                                      className="bg-black/80 font-mono text-[10px] text-zinc-300 p-4 rounded-xl border border-white/5 overflow-x-auto text-left leading-relaxed max-h-[160px] no-scrollbar overflow-y-auto"
                                      style={{ direction: 'ltr' }}
                                    >
                                      {aiExtractionError.stack || "لا تتوفر تفاصيل تتبع إضافية من النظام."}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* Stages Logs */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <span className="text-xs text-[#00E5FF] font-black flex items-center gap-1.5 font-sans">
                                    <Activity size={12} className="animate-pulse" />
                                    مسار المعالجة المتسلسلة (AI Processing Timeline)
                                  </span>
                                  <span className="text-[10px] text-white/40 font-mono">تحديث فوري</span>
                                </div>

                                {aiExtractionLogs.length === 0 ? (
                                  <div className="text-center py-8 text-white/20 text-xs font-mono">
                                    بانتظار بدء المعالجة لعرض المراحل...
                                  </div>
                                ) : (
                                  <div className="bg-black/60 border border-white/5 rounded-xl p-4 max-h-[180px] overflow-y-auto font-mono text-[11px] space-y-2 text-left no-scrollbar" style={{ direction: 'ltr' }}>
                                    {aiExtractionLogs.map((logLine, idx) => {
                                      const isStep = logLine.includes("[STEP");
                                      const isError = logLine.includes("خطأ") || logLine.includes("CRITICAL") || logLine.includes("fail") || logLine.includes("فشل");
                                      let colorClass = "text-zinc-400";
                                      if (isStep) colorClass = "text-[#00E5FF] font-black border-l-2 border-[#00E5FF]/40 pl-2";
                                      if (isError) colorClass = "text-red-400 font-bold bg-red-950/10 px-2 py-0.5 rounded";
                                      return (
                                        <div key={idx} className={`py-1 ${colorClass}`}>
                                          {logLine}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Navigation and state events log */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <span className="text-xs text-amber-400 font-black flex items-center gap-1.5 font-sans">
                                    <Info size={12} />
                                    سجل استدعاء النوافذ والمسار الحركي (Interface Tab & Navigation Hook Tracker)
                                  </span>
                                  <span className="text-[10px] text-white/40 font-mono">ملتقط فوري</span>
                                </div>

                                {navTriggers.length === 0 ? (
                                  <div className="text-center py-6 text-white/20 text-xs font-mono">
                                    لا توجد سجلات تصفح ملتقطة بعد. جرب التبديل بين التبويبات!
                                  </div>
                                ) : (
                                  <div className="bg-black/60 border border-white/5 rounded-xl overflow-hidden">
                                    <table className="w-full text-[10px] font-mono text-zinc-300 text-right">
                                      <thead>
                                        <tr className="bg-white/[0.02] text-white/40 border-b border-white/5">
                                          <th className="p-2 text-right">الوقت</th>
                                          <th className="p-2 text-right">الوظيفة (Action)</th>
                                          <th className="p-2 text-right">المستدعي (Caller)</th>
                                          <th className="p-2 text-right">المصدر (File)</th>
                                          <th className="p-2 text-right">المرحلة أثناء الطلب</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/[0.02]">
                                        {navTriggers.slice(-6).reverse().map((nav, i) => (
                                          <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-2 text-white/50">{nav.timestamp}</td>
                                            <td className="p-2 font-bold text-amber-400">{nav.action}</td>
                                            <td className="p-2 font-bold text-[#00E5FF]">{nav.caller}</td>
                                            <td className="p-2 text-white/50">{nav.sourceFile}</td>
                                            <td className="p-2 text-white/70">{nav.currentStep}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between font-mono text-xs text-white/40">
                              <span>نظام Sixth Academy للتحليل الذكي المتكامل</span>
                              <div className="flex gap-2">
                                {/* Diagnostic buttons removed as requested */}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {showTransformerLogs && (
                      <TransformerLogsViewer onClose={() => setShowTransformerLogs(false)} />
                    )}

                    {/* Existing Pages List */}
                    <div className="bg-[#0E152D]/30 border border-white/5 rounded-none sm:rounded-2xl border-x-0 sm:border-x border-y p-3 sm:p-4">
                      <h4 className="text-[11px] text-white/50 font-black mb-3 pb-2 border-b border-white/5">
                        الملزمة التفاعلية النشطة ({activeWorkingClass})
                      </h4>
                      <div className="space-y-2.5">
                        {academyPages.length === 0 ? (
                          <div className="text-center py-6 text-white/30 text-xs font-bold font-mono">
                            لم يتم رفع أي صفحات للملزمة التفاعلية حتى الآن
                          </div>
                        ) : (
                          academyPages.map((item, i) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2.5 sm:p-3 bg-[#0B0F21]/80 border border-white/5 rounded-xl hover:border-white/10 transition-colors gap-2"
                            >
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 overflow-hidden">
                                <div className="overflow-hidden w-full pl-1 sm:pl-2 min-w-0">
                                  <span className="text-[11px] font-black text-white/95 block max-w-full truncate overflow-hidden">
                                    {item.title || "بدون عنوان"}
                                  </span>
                                  <span className="text-[9px] text-white/40 font-bold font-mono block mt-0.5 truncate">
                                    مضاف تلقائياً بالذكاء الاصطناعي
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                                <button
                                  onClick={() => setSelectedAcademyPage(item)}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded-lg transition-all border border-amber-500/20 cursor-pointer"
                                >
                                  عرض
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingQueueIndex(null);
                                    setPreviewPageIndex(0);
                                    setPendingExtractedAi(item);
                                    setExtractedAiTitle(item.title || "");
                                    setPendingUnitTitle(item.subtitle || item.unit || item.unitTitle || "");
                                    setTimeout(() => {
                                      document.getElementById('pending-editor-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                  }}
                                  className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-[9px] text-blue-400 font-bold rounded-lg transition-all border border-blue-500/20 cursor-pointer"
                                >
                                  تعديل
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingAcademyPageId(item.id);
                                  }}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[9px] text-red-500 font-bold rounded-lg transition-all border border-red-500/20 cursor-pointer"
                                >
                                  حذف
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showToast('تم نشر الملف في منصة الطلاب - قسم الميادين بنجاح!', 'success');
                                  }}
                                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-[9px] text-emerald-400 font-bold rounded-lg transition-all border border-emerald-500/20 cursor-pointer flex items-center gap-1"
                                  title="نشر الملف في منصة الطلاب - قسم الميادين"
                                >
                                  <Share2 size={10} />
                                  <span>نشر</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: AI Toolkit & Parameters */}
                  <div className="w-full lg:w-[350px] shrink-0 space-y-4">
                    <div className="bg-[#0E152D]/60 border border-white/5 rounded-none sm:rounded-2xl border-x-0 sm:border-x border-y p-3.5 sm:p-4 text-right">
                      <h4 className="text-[11px] text-white/50 font-black mb-3 pb-2 border-b border-white/5">
                        تعليمات تهيئة الملخصات
                      </h4>
                      <ul className="space-y-2 text-[10px] text-white/60 leading-relaxed font-sans">
                        <li className="flex items-start gap-1">
                          <span className="text-blue-400">•</span>
                          <span>
                            تأكد من وضوح الصورة المرفوعة لضمان دقة المعالجة
                            100%.
                          </span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-blue-400">•</span>
                          <span>
                            النظام يقوم ببناء مؤقت "تحدي الـ 60 ثانية" تلقائياً
                            حسب طول الدرس.
                          </span>
                        </li>
                        <li className="flex items-start gap-1">
                          <span className="text-blue-400">•</span>
                          <span>
                            يمكنك استخدام ميزة "النقر لإظهار الحلول" عن طريق وضع
                            إجابات الأسئلة بين قوسين مربعة [الإجابة].
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
  );
};
