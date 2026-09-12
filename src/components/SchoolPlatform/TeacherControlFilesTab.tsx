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
  formatLectureDescription,
} from "./utils";
import type { Teacher, MaterialField, Post, SchoolPlatformProps, PlatformTab, HandRaiseRequest, LiveQuestion } from "./types";
import { useSchoolPlatform } from "./SchoolPlatformContext";

export const TeacherControlFilesTab: React.FC = () => {
  const { currentTeacherData, documentXhr, grade, isTeacher, isUploading, mapGradeForDocument, progress, recordedLessons, resolvedSchoolId, schoolFiles, schoolId, selectedTeacherClass, setDocumentXhr, setIsUploading, setPdfLoadError, setPreviewingFile, setTeacherUploadTab, setUploadProgress, setUploadedAssetSubject, setUploadedAssetTag, setUploadedAssetTitle, setUploadedFileMeta, setUploadedFileUrl, setUploadedVideoDesc, setUploadedVideoDuration, setUploadedVideoLock, setUploadedVideoSubject, setUploadedVideoTitle, setUploadedVideoUrl, setViewingRecordedLesson, showToast, targetBroadcastGrade, teacherAssignedSections, teacherData, teacherUploadTab, uploadProgress, uploadedAssetSubject, uploadedAssetTag, uploadedAssetTitle, uploadedFileMeta, uploadedFileUrl, uploadedVideoDesc, uploadedVideoDuration, uploadedVideoSubject, uploadedVideoTitle, uploadedVideoUrl, userProfile, setSchoolFiles, setRecordedLessons } = useSchoolPlatform();

  const [isPublishing, setIsPublishing] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);

  // ⏱️ إدارة وتعديل مدة المحاضرة المباشرة
  const [editingLessonDurationId, setEditingLessonDurationId] = useState<string | null>(null);
  const [newLessonDuration, setNewLessonDuration] = useState<string>("45:00");
  const [isUpdatingDuration, setIsUpdatingDuration] = useState(false);
  const [detectingVideoId, setDetectingVideoId] = useState<string | null>(null);

  const handleSaveDuration = async (lessonId: string) => {
    if (!newLessonDuration.trim()) {
      showToast("يرجى كتابة مدة صالحة للمحاضرة", "error");
      return;
    }
    setIsUpdatingDuration(true);
    try {
      const res = await fetch(`/api/recorded-lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: newLessonDuration.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (setRecordedLessons) {
          setRecordedLessons((prev: any[]) => 
            (prev || []).map((l: any) => l.id === lessonId ? { ...l, duration: newLessonDuration.trim() } : l)
          );
        }
        showToast("تم تحديث مدة المحاضرة بنجاح! ⏱️", "success");
        setEditingLessonDurationId(null);
      } else {
        showToast(data.message || "فشل حفظ المدة", "error");
      }
    } catch (e: any) {
      showToast("تعذر تحديث مدة المحاضرة", "error");
    } finally {
      setIsUpdatingDuration(false);
    }
  };

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (err) {
            return;
          }
        }
        let sec = 0;
        if (data?.event === 'infoDelivery' && data?.info?.duration) {
          sec = Math.round(data.info.duration);
        } else if (data?.info && typeof data.info.duration === 'number') {
          sec = Math.round(data.info.duration);
        }
        if (sec > 0) {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;
          const formatted = h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
          setUploadedVideoDuration(formatted);
          setDetectingVideoId(null);
        }
      } catch (err) {}
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [setUploadedVideoDuration]);

  const tData = currentTeacherData || teacherData;
  const inferredTeacherSubject = (tData?.subject ? (Array.isArray(tData.subject) ? tData.subject[0] : tData.subject) : null) || tData?.specialty || tData?.specialization || "عام";

  const activeTeacherSection = (teacherAssignedSections || []).find((s: any) => s.name === selectedTeacherClass);
  const isAllSections = !selectedTeacherClass || selectedTeacherClass === "ALL" || selectedTeacherClass === "كافة الشُعب";
  const displayTargetClass = isAllSections
    ? `كافة الشُعب الموكلة (${targetBroadcastGrade || "عام"})`
    : selectedTeacherClass;

  const getComputedTargetGrade = () => {
    if (!isAllSections && activeTeacherSection) {
      return activeTeacherSection?.grade ? mapGradeForDocument(activeTeacherSection.grade) : mapGradeForDocument(selectedTeacherClass);
    }
    return targetBroadcastGrade || (teacherAssignedSections?.[0]?.grade ? mapGradeForDocument(teacherAssignedSections[0].grade) : null) || (teacherAssignedSections?.[0]?.name ? mapGradeForDocument(teacherAssignedSections[0].name) : null) || (tData?.classes?.[0] ? mapGradeForDocument(tData.classes[0]) : null) || (tData?.grade ? mapGradeForDocument(tData.grade) : null) || "الكل";
  };

  const filteredSchoolFiles = useMemo(() => {
    if (isAllSections) {
      const teacherSecNames = (teacherAssignedSections || []).map((s: any) => s.name).filter(Boolean);
      return schoolFiles.filter((f: any) => {
        if (!f.section || f.section === 'ALL' || f.section === 'all' || f.section === 'كافة الشُعب') return true;
        if (teacherSecNames.length === 0) return true;
        return teacherSecNames.includes(f.section) || (Array.isArray(f.targetSections) && f.targetSections.some((ts: string) => teacherSecNames.includes(ts)));
      });
    }
    return schoolFiles.filter((f: any) => {
      if (!f.section || f.section === 'ALL' || f.section === 'all' || f.section === 'كافة الشُعب') return true;
      return f.section === selectedTeacherClass || (Array.isArray(f.targetSections) && f.targetSections.includes(selectedTeacherClass));
    });
  }, [schoolFiles, isAllSections, selectedTeacherClass, teacherAssignedSections]);

  const filteredRecordedLessons = useMemo(() => {
    if (isAllSections) {
      const teacherSecNames = (teacherAssignedSections || []).map((s: any) => s.name).filter(Boolean);
      return recordedLessons.filter((l: any) => {
        if (!l.section || l.section === 'ALL' || l.section === 'all' || l.section === 'كافة الشُعب') return true;
        if (teacherSecNames.length === 0) return true;
        return teacherSecNames.includes(l.section) || (Array.isArray(l.targetSections) && l.targetSections.some((ts: string) => teacherSecNames.includes(ts)));
      });
    }
    return recordedLessons.filter((l: any) => {
      if (!l.section || l.section === 'ALL' || l.section === 'all' || l.section === 'كافة الشُعب') return true;
      return l.section === selectedTeacherClass || (Array.isArray(l.targetSections) && l.targetSections.includes(selectedTeacherClass));
    });
  }, [recordedLessons, isAllSections, selectedTeacherClass, teacherAssignedSections]);

  useEffect(() => {
    const trimmed = (uploadedVideoUrl || "").trim();
    if (!trimmed || (!trimmed.includes("youtube.com") && !trimmed.includes("youtu.be") && !trimmed.includes("vimeo.com"))) return;

    // Detect YouTube ID for client-side iframe duration extraction
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      setDetectingVideoId(ytMatch[1]);
    }

    const fetchVideoMeta = async () => {
      try {
        setUploadedVideoDuration("جاري الاستخراج...");
        // Fetch from our enhanced server-side API (supports YouTube player API & Vimeo)
        const metaRes = await fetch(`/api/video-meta?url=${encodeURIComponent(trimmed)}`);
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.success) {
            if (metaData.duration) {
              setUploadedVideoDuration(metaData.duration);
            }
            if (metaData.title && !uploadedVideoTitle) {
              setUploadedVideoTitle(metaData.title);
            }
            return;
          }
        }

        // Fallback to noembed for title if needed
        const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(trimmed)}`);
        if (noembedRes.ok) {
          const data = await noembedRes.json();
          if (data.title && !uploadedVideoTitle) {
            setUploadedVideoTitle(data.title);
          }
        }
        setUploadedVideoDuration((prev) => (prev === "جاري الاستخراج..." ? "" : prev));
      } catch (e) {
        console.warn("Failed to fetch video meta", e);
        setUploadedVideoDuration((prev) => (prev === "جاري الاستخراج..." ? "" : prev));
      }
    };

    const timer = setTimeout(fetchVideoMeta, 400);
    return () => clearTimeout(timer);
  }, [uploadedVideoUrl]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative" dir="rtl">
      {detectingVideoId && (
        <iframe
          key={detectingVideoId}
          src={`https://www.youtube-nocookie.com/embed/${detectingVideoId}?enablejsapi=1`}
          className="hidden w-0 h-0 opacity-0 pointer-events-none absolute"
          title="yt-duration-detector"
          onLoad={(e) => {
            try {
              (e.currentTarget as HTMLIFrameElement).contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), '*');
            } catch (err) {}
          }}
        />
      )}
                  {/* Left Column: Upload Forms */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Sub-tab Navigation */}
                    <div className="flex bg-[#0E152D]/80 p-1.5 rounded-xl border border-white/5 gap-2">
                      <button
                        onClick={() => setTeacherUploadTab("document")}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          teacherUploadTab === "document"
                            ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <FileUp size={14} />
                        <span>📚 نشر ملازم وتلاخيص</span>
                      </button>
                      <button
                        onClick={() => setTeacherUploadTab("video")}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          teacherUploadTab === "video"
                            ? "bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Video size={14} />
                        <span>🎥 نشر محاضرات مرئية</span>
                      </button>
                    </div>

                    {/* Document Upload Form */}
                    {teacherUploadTab === "document" && (
                      <div className="bg-[#0E152D]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-widest">
                          توجيه ونشر ملف/ملزمة جديدة للصف
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-white/40 font-bold block mb-1">
                              اسم أو عنوان الملف
                            </label>
                            <input
                              type="text"
                              value={uploadedAssetTitle}
                              onChange={(e) => setUploadedAssetTitle(e.target.value)}
                              placeholder="مثال: مرشحات القواعد الوزارية - الدور الأول"
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-amber-500/40 transition-all font-sans font-semibold text-right"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-white/40 font-bold block mb-1">
                              شعار التصنيف
                            </label>
                            <input
                              type="text"
                              value={uploadedAssetTag}
                              onChange={(e) => setUploadedAssetTag(e.target.value)}
                              placeholder="مثال: ملخص شامل، اختبار وزاري"
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-amber-500/40 transition-all font-sans font-semibold text-right"
                            />
                          </div>
                        </div>

                        {/* Auto-detected Subject & Target Class */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                              <BookOpen size={18} />
                            </div>
                            <div className="flex flex-col text-right min-w-0">
                              <span className="text-[10px] text-white/40 font-bold">المادة الدراسية للملف</span>
                              <span className="text-xs font-black text-amber-400 truncate">
                                {inferredTeacherSubject}
                              </span>
                              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle size={10} /> معتمد تلقائياً من كود وتخصص الأستاذ
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                              <Target size={18} />
                            </div>
                            <div className="flex flex-col text-right min-w-0">
                              <span className="text-[10px] text-white/40 font-bold">الصف / الشعبة الموجه لها الملف</span>
                              <span className="text-xs font-black text-cyan-400 truncate">
                                {displayTargetClass}
                              </span>
                              <span className="text-[9px] text-cyan-400/80 font-bold flex items-center gap-1 mt-0.5">
                                <Sparkles size={10} /> محدد تلقائياً عبر زر التبديل بين الصفوف
                              </span>
                            </div>
                          </div>
                        </div>

                          <div>
                            <label className="text-[10px] text-white/40 font-bold block mb-1">
                              إرفاق الملف الحقيقي
                            </label>
                            <input
                              type="file"
                              id="teacher-file-uploader"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.png,.jpg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const sz = (file.size / (1024 * 1024)).toFixed(1) + " MB";
                                  
                                  // Auto-fill title with file name if not typed yet
                                  if (!uploadedAssetTitle.trim()) {
                                    const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();
                                    if (autoTitle) setUploadedAssetTitle(autoTitle);
                                  }

                                  // Reset previous upload states
                                  setIsUploading(true);
                                  setUploadProgress(0);
                                  setUploadedFileMeta(null);
                                  setUploadedFileUrl("");

                                  // Actual upload via R2 or secure server proxy
                                  import("../../services/uploadService").then(({ uploadFileToR2 }) => {
                                    uploadFileToR2(file, (progress) => {
                                      setUploadProgress(progress);
                                    }, (xhr) => {
                                      setDocumentXhr(xhr);
                                    }).then((publicUrl) => {
                                      if (!publicUrl || publicUrl.trim() === "") {
                                        throw new Error("لم يتم استلام رابط الملف من السحابة");
                                      }
                                      setUploadedFileUrl(publicUrl);
                                      setIsUploading(false);
                                      setDocumentXhr(null);
                                      setUploadedFileMeta({ name: file.name, size: sz });
                                      showToast("اكتمل معالجة ورفع الملف بنجاح وهو جاهز للنشر! 🎉", "success");
                                    }).catch((error) => {
                                      const isAbort = error?.name === "AbortError" || (error?.message || "").includes("aborted") || (error?.message || "").includes("abort") || (error?.message || "").includes("cancel") || (error?.message || "").includes("without reason");
                                       if (!isAbort) {
                                        console.error("Upload error:", error);
                                        showToast(error?.message || "تعذر رفع الملف، الرجاء المحاولة مرة أخرى", "error");
                                      }
                                      setIsUploading(false);
                                      setDocumentXhr(null);
                                      setUploadedFileUrl("");
                                    });
                                  });
                                }
                              }}
                            />
                            
                            {isUploading ? (
                              <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-2.5 text-right space-y-2 relative">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-white/50 font-sans font-bold">جاري الرفع والمعالجة السحابية...</span>
                                  <span className="text-[10px] text-amber-400 font-mono font-black">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-amber-500 h-full transition-all duration-150" 
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (documentXhr) {
                                        documentXhr.abort();
                                      }
                                      setIsUploading(false);
                                      setUploadProgress(0);
                                      setUploadedFileUrl("");
                                      setUploadedFileMeta(null);
                                      setDocumentXhr(null);
                                      showToast("تم إلغاء رفع الملف", "info");
                                    }}
                                    className="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 text-[8px] font-black rounded transition-colors cursor-pointer"
                                  >
                                    إلغاء التحميل ❌
                                  </button>
                                </div>
                              </div>
                            ) : uploadedFileMeta ? (
                              <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                  <CheckCircle className="text-green-400 shrink-0" size={14} />
                                  <div className="truncate text-right">
                                    <span className="text-white text-[10px] font-bold font-mono truncate block max-w-[200px]">
                                      {uploadedFileMeta.name} ({uploadedFileMeta.size})
                                    </span>
                                    <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">
                                      {uploadedFileUrl ? "جاهز للنشر السحابي ومكتمل الرفع ✅" : "جاري المعالجة السحابية..."}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUploadedFileMeta(null);
                                    setUploadedFileUrl("");
                                    showToast("تمت إزالة الملف المرفق", "info");
                                  }}
                                  className="text-white/40 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                                  title="إزالة"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => document.getElementById("teacher-file-uploader")?.click()}
                                className="border border-dashed border-white/10 hover:border-amber-500/40 rounded-xl p-2.5 text-center cursor-pointer hover:bg-[#F59E0B]/5 transition-all relative group flex items-center justify-center gap-2"
                              >
                                <FileUp className="text-amber-400 shrink-0" size={14} />
                                <span className="text-white/60 text-[10px] font-bold">
                                  انقر لاختيار ملف PDF أو ملخص
                                </span>
                              </div>
                            )}
                          </div>

                        {/* Allow Download Toggle */}
                        <div className="flex items-center gap-2 px-1">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={allowDownload}
                              onChange={(e) => setAllowDownload(e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span className="mr-3 text-xs font-bold text-white/70">السماح للطلاب بتنزيل الملف 📥</span>
                          </label>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={async () => {
                              if (isUploading) {
                                showToast(`يرجى الانتظار حتى اكتمال رفع الملف (${uploadProgress}%)`, "warning");
                                return;
                              }
                              if (!uploadedFileUrl || uploadedFileUrl.trim() === "" || uploadedFileUrl.startsWith("blob:")) {
                                showToast("يرجى إرفاق الملف وانتظار اكتمال رفعه سحابياً أولاً", "warning");
                                return;
                              }
                              const finalTitle = uploadedAssetTitle.trim() || (uploadedFileMeta ? uploadedFileMeta.name.replace(/\.[^/.]+$/, "") : "ملخص دراسي");
                              if (!finalTitle) {
                                showToast("يرجى كتابة عنوان الملف المراد رفعه", "error");
                                return;
                              }
                              try {
                                setIsPublishing(true);
                                const fileName = uploadedFileMeta ? uploadedFileMeta.name : `${finalTitle}.pdf`;
                                const fileSize = uploadedFileMeta ? uploadedFileMeta.size : "4.5 MB";
                                const finalSubject = inferredTeacherSubject;
                                const finalGrade = getComputedTargetGrade();

                                const res = await fetch('/api/school-files', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    title: finalTitle,
                                    size: fileSize,
                                    downloads: 0,
                                    tag: uploadedAssetTag || "ملخص شامل",
                                    subject: finalSubject,
                                    grade: finalGrade,
                                    section: isAllSections ? null : selectedTeacherClass,
                                    targetSections: isAllSections
                                      ? (teacherAssignedSections || []).map((s: any) => s.name).filter(Boolean)
                                      : [selectedTeacherClass],
                                    targetSectionLabel: displayTargetClass,
                                    schoolId: resolvedSchoolId,
                                    fileUrl: uploadedFileUrl || "",
                                    allowDownload,
                                    createdAt: new Date().toISOString()
                                  })
                                });

                                if (res.ok) {
                                  const data = await res.json();
                                  const createdFile = data?.file || data?.data;
                                  if (createdFile && setSchoolFiles) {
                                    setSchoolFiles((prev: any[]) => [createdFile, ...prev.filter((f: any) => f.id !== createdFile.id)]);
                                  }
                                  showToast(`تم نشر وتعميم الملزمة بنجاح لفرسان (${displayTargetClass})! 🚀`, "success");
                                  setUploadedAssetTitle("");
                                  setUploadedAssetTag("ملخص شامل");
                                  setUploadedFileMeta(null);
                                  setUploadedFileUrl("");
                                } else {
                                  const errData = await res.json().catch(() => ({}));
                                  showToast(errData.message || "فشل نشر الملف، حاول مجدداً", "error");
                                }
                              } catch (err) {
                                console.error("Document upload err", err);
                                showToast("فشل نشر الملف، حاول مجدداً", "error");
                              } finally {
                                setIsPublishing(false);
                              }
                            }}
                            disabled={isUploading || isPublishing}
                            className={`px-5 py-2.5 font-black text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)] cursor-pointer ${
                              isUploading || isPublishing 
                                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                                : 'bg-amber-500 hover:bg-amber-400 text-black'
                            }`}
                          >
                            {isPublishing ? "جاري النشر والتعميم للفرسان... ⏳" : `نشر وتعميم الملف لـ (${displayTargetClass}) 📚`}
                          </button>
                        </div>

                        {/* 📚 Published Documents History List */}
                        <div className="mt-6 border-t border-white/5 pt-5 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <h4 className="text-[10px] text-amber-400 font-black uppercase tracking-wider">
                              📚 سجل الملازم والملخصات لـ ({displayTargetClass})
                            </h4>
                            <span className="text-[9px] text-white/40 font-mono font-bold">
                              إجمالي الملازم: {filteredSchoolFiles.length}
                            </span>
                          </div>

                          {filteredSchoolFiles.length === 0 ? (
                            <p className="text-[10px] text-white/20 py-4 text-center font-bold">
                              لا توجد ملازم مرفوعة حالياً لهذا الصف أو الشعبة
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                              {filteredSchoolFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between p-2.5 bg-[#0B0F21]/85 border border-white/5 rounded-xl hover:border-white/10 transition-all"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-[10px] font-black shrink-0">
                                      PDF
                                    </div>
                                    <div className="truncate text-right">
                                      <span className="text-[10px] font-black text-white/90 block truncate leading-tight">
                                        {file.title || file.name || "بدون عنوان"}
                                      </span>
                                      <span className="text-[8px] text-white/40 font-mono font-bold block mt-0.5">
                                        {file.subject || "عام"} {file.size ? '• ' + file.size : ''}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setPreviewingFile(file);
                                        setPdfLoadError(false);
                                      }}
                                      className="p-1 hover:bg-white/10 text-white/70 hover:text-white rounded transition-colors cursor-pointer"
                                      title="فتح وقراءة الملف"
                                    >
                                      <BookOpen size={11} />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const delRes = await fetch(`/api/school-files/${file.id}`, { method: 'DELETE' });
                                          if (delRes.ok) {
                                            if (setSchoolFiles) {
                                              setSchoolFiles((prev: any[]) => prev.filter((f: any) => f.id !== file.id));
                                            }
                                            showToast("تم سحب وإلغاء نشر الملف بنجاح!", "success");
                                          } else {
                                            showToast("تعذر حذف الملف من الخادم", "error");
                                          }
                                        } catch (err) {
                                          showToast("خطأ أثناء الحذف", "error");
                                        }
                                      }}
                                      className="p-1 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 rounded transition-colors cursor-pointer"
                                      title="حذف الملف"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Video Upload Form */}
                    {teacherUploadTab === "video" && (
                      <div className="bg-[#0E152D]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-[#00E5FF] mb-2 uppercase tracking-widest">
                          نشر محاضرة مرئية ودرس مسجل جديد للصف
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-white/40 font-bold block mb-1">
                              عنوان المحاضرة
                            </label>
                            <input
                              type="text"
                              value={uploadedVideoTitle}
                              onChange={(e) => setUploadedVideoTitle(e.target.value)}
                              placeholder="مثال: المحاضرة الأولى - أساسيات القواعد"
                              className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#00E5FF]/40 transition-all font-sans font-semibold text-right"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] text-white/40 font-bold block mb-1">
                              وضع رابط فيديو المحاضرة (YouTube / Vimeo)
                            </label>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={uploadedVideoUrl}
                                onChange={(e) => setUploadedVideoUrl(e.target.value)}
                                placeholder="مثال: https://www.youtube.com/watch?v=..."
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#00E5FF]/40 transition-all font-sans font-semibold text-right"
                              />
                              
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-right">
                                <h4 className="text-[10px] font-black text-amber-400 mb-1 flex items-center gap-1">
                                  ⚠️ ملاحظة حول رفع المحاضرات:
                                </h4>
                                <p className="text-[9px] text-white/70 leading-relaxed">
                                  يرجى رفع الفيديو على قناتك في يوتيوب وضبط الخصوصية على <strong>"غير مدرج" (Unlisted)</strong>، 
                                  ثم نسخ الرابط ولصقه هنا.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                              <BookOpen size={18} />
                            </div>
                            <div className="flex flex-col text-right min-w-0">
                              <span className="text-[10px] text-white/40 font-bold">المادة الدراسية</span>
                              <span className="text-xs font-black text-amber-400 truncate">
                                {inferredTeacherSubject}
                              </span>
                              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                                <CheckCircle size={10} /> معتمد من كود وتخصص الأستاذ
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0">
                              <Target size={18} />
                            </div>
                            <div className="flex flex-col text-right min-w-0">
                              <span className="text-[10px] text-white/40 font-bold">الصف / الشعبة الموجه لها</span>
                              <span className="text-xs font-black text-[#00E5FF] truncate">
                                {displayTargetClass}
                              </span>
                              <span className="text-[9px] text-[#00E5FF]/80 font-bold flex items-center gap-1 mt-0.5">
                                <Sparkles size={10} /> من زر التبديل
                              </span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-white/40 font-bold block">
                                مدة المحاضرة (مثال: 45:00)
                              </label>
                              {uploadedVideoDuration && uploadedVideoDuration !== "جاري الاستخراج..." && uploadedVideoDuration !== "0:00" && (
                                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle size={10} /> تم التحديد: {uploadedVideoDuration}
                                </span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={uploadedVideoDuration}
                              onChange={(e) => setUploadedVideoDuration(e.target.value)}
                              placeholder="مثال: 45:00 أو 1:20:00"
                              className="w-full bg-[#070B19] border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#00E5FF]/40 transition-all font-sans font-semibold text-right"
                            />
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-[8px] text-white/30 font-bold">خيارات شائعة:</span>
                              {["30:00", "40:00", "45:00", "50:00", "1:00:00"].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setUploadedVideoDuration(preset)}
                                  className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer ${
                                    uploadedVideoDuration === preset
                                      ? "bg-[#00E5FF] text-black shadow-sm"
                                      : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-white/40 font-bold block mb-1">
                            وصف بسيط أو ملاحظة لفرسان {displayTargetClass || "الصف"}
                          </label>
                          <textarea
                            value={uploadedVideoDesc}
                            onChange={(e) => setUploadedVideoDesc(e.target.value)}
                            placeholder={`اكتب ملاحظة تحفيزية لفرسان ${displayTargetClass || "الصف"} أو ملخص للنقاط الأساسية...`}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#00E5FF]/40 transition-all font-sans font-semibold h-16 resize-none text-right"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={async () => {
                              if (!uploadedVideoTitle.trim()) {
                                showToast("يرجى كتابة عنوان المحاضرة المرئية", "error");
                                return;
                              }
                              try {
                                const today = new Date().toISOString().split('T')[0];
                                let finalVideoUrl = uploadedVideoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ";
                                if (finalVideoUrl.startsWith("/")) {
                                  finalVideoUrl = window.location.origin + finalVideoUrl;
                                }
                                const finalSubject = inferredTeacherSubject;
                                const finalGrade = getComputedTargetGrade();
                                const targetClassText = finalGrade && finalGrade !== "الكل" ? finalGrade : (selectedTeacherClass && selectedTeacherClass !== "ALL" ? selectedTeacherClass : "الصف");
                                const defaultLectureDesc = `محاضرة مرئية منشورة لفرسان ${targetClassText} الأبطال`;

                                 const res = await fetch('/api/recorded-lessons', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({
                                     title: uploadedVideoTitle,
                                     subject: finalSubject,
                                     grade: finalGrade,
                                     section: isAllSections ? null : selectedTeacherClass,
                                     targetSections: isAllSections
                                       ? (teacherAssignedSections || []).map((s: any) => s.name).filter(Boolean)
                                       : [selectedTeacherClass],
                                     targetSectionLabel: displayTargetClass,
                                     duration: (uploadedVideoDuration && uploadedVideoDuration.trim() && uploadedVideoDuration !== "جاري الاستخراج...") ? uploadedVideoDuration.trim() : "45:00",
                                     date: today,
                                     videoUrl: finalVideoUrl,
                                     description: uploadedVideoDesc || defaultLectureDesc,
                                     schoolId: resolvedSchoolId,
                                     teacherId: userProfile?.uid,
                                     timestamp: new Date().toISOString(),
                                     allowDownload: false
                                   })
                                 });

                                 const resData = await res.json();
                                 if (resData.success && resData.lesson) {
                                   // Ensure the new lesson is added to the list immediately
                                   setRecordedLessons((prev: any) => {
                                     const exists = prev.some((l: any) => l.id === resData.lesson.id);
                                     if (exists) return prev;
                                     return [resData.lesson, ...prev];
                                   });
                                   showToast("تم نشر المحاضرة المرئية وتثبيتها بنجاح! 🎥🔥", "success");
                                   setUploadedVideoTitle("");
                                   setUploadedVideoDesc("");
                                   setUploadedVideoUrl("");
                                   setUploadedVideoDuration("0:00");
                                   setUploadedVideoLock(false);
                                 } else {
                                   throw new Error("Failed to get lesson data from server");
                                 }
                              } catch (err) {
                                console.error("Video upload err", err);
                                showToast("فشل نشر الدرس المسجل، حاول مجدداً", "error");
                              }
                            }}
                            className="px-5 py-2.5 bg-[#00E5FF] hover:bg-[#33ebff] text-black font-black text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(0,229,255,0.1)] cursor-pointer"
                          >
                            تثبيت ونشر الدرس المرئي الآن 🎥
                          </button>
                        </div>

                        {/* 🎥 Published Videos History List */}
                        <div className="mt-6 border-t border-white/5 pt-5 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <h4 className="text-[10px] text-[#00E5FF] font-black uppercase tracking-wider">
                              🎥 سجل المحاضرات المرئية لـ ({displayTargetClass})
                            </h4>
                            <span className="text-[9px] text-white/40 font-mono font-bold">
                              إجمالي الفيديوهات: {filteredRecordedLessons.length}
                            </span>
                          </div>

                          {filteredRecordedLessons.length === 0 ? (
                            <p className="text-[10px] text-white/20 py-4 text-center font-bold">
                              لا توجد محاضرات منشورة حالياً لهذا الصف أو الشعبة
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                              {filteredRecordedLessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="p-2.5 bg-[#0B0F21]/85 border border-white/5 rounded-xl hover:border-white/10 transition-all"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 truncate">
                                      <div className="w-7 h-7 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] shrink-0">
                                        <Play size={10} fill="currentColor" />
                                      </div>
                                      <div className="truncate text-right">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-black text-white/90 block truncate leading-tight">
                                            {lesson.title}
                                          </span>
                                          {lesson.grade && (
                                            <span className="text-[8px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                                              {lesson.grade}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                          <span className="text-[8px] text-white/40 font-mono font-bold">
                                            {lesson.subject} •
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingLessonDurationId(editingLessonDurationId === lesson.id ? null : lesson.id);
                                              setNewLessonDuration(lesson.duration && lesson.duration !== '0:00' && lesson.duration !== '00:00' ? lesson.duration : '45:00');
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                              !lesson.duration || lesson.duration === '0:00' || lesson.duration === '00:00'
                                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 animate-pulse'
                                                : 'bg-white/5 text-[#00E5FF] hover:bg-white/15 border border-white/10'
                                            }`}
                                            title="انقر لتعديل مدة المحاضرة"
                                          >
                                            <Clock size={8} className="text-[#00E5FF]" />
                                            <span>{!lesson.duration || lesson.duration === '0:00' || lesson.duration === '00:00' ? 'تحديد المدة ⏱️' : lesson.duration}</span>
                                            <Edit2 size={7} className="opacity-60" />
                                          </button>
                                          <span className="text-[8px] text-white/40 font-mono font-bold flex items-center gap-1">
                                            • <Eye size={8} /> {lesson.views ?? lesson.viewCount ?? 0} • <MessageSquare size={8} /> {lesson.comment_count ?? lesson.commentCount ?? 0}
                                          </span>
                                        </div>
                                        <p className="text-[8px] text-white/50 font-sans font-bold truncate mt-0.5">
                                          {formatLectureDescription(lesson.description, lesson.grade)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingLessonDurationId(editingLessonDurationId === lesson.id ? null : lesson.id);
                                          setNewLessonDuration(lesson.duration && lesson.duration !== '0:00' && lesson.duration !== '00:00' ? lesson.duration : '45:00');
                                        }}
                                        className="p-1 hover:bg-amber-500/10 text-amber-300/80 hover:text-amber-300 rounded transition-colors cursor-pointer"
                                        title="تعديل مدة المحاضرة ⏱️"
                                      >
                                        <Clock size={11} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          sounds.playClick();
                                          setViewingRecordedLesson(lesson);
                                        }}
                                        className="p-1 hover:bg-white/10 text-[#00E5FF] rounded transition-colors cursor-pointer"
                                        title="مشاهدة وتشغيل المحاضرة"
                                      >
                                        <Play size={11} fill="currentColor" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/recorded-lessons/${lesson.id}`, { method: 'DELETE' });
                                            if (res.ok) {
                                              setRecordedLessons((prev: any) => prev.filter((l: any) => l.id !== lesson.id));
                                              showToast("تم سحب وإلغاء نشر المحاضرة بنجاح!", "success");
                                            } else {
                                              showToast("فشل الحذف، حاول مجدداً", "error");
                                            }
                                          } catch (err) {
                                            showToast("خطأ أثناء الحذف", "error");
                                          }
                                        }}
                                        className="p-1 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 rounded transition-colors cursor-pointer"
                                        title="حذف المحاضرة"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Quick Duration Editor */}
                                  {editingLessonDurationId === lesson.id && (
                                    <div className="mt-2.5 p-2.5 rounded-xl bg-[#070B19] border border-[#00E5FF]/30 space-y-2 text-right" dir="rtl">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                                          <Clock size={11} className="text-[#00E5FF]" />
                                          تعديل مدة المحاضرة:
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setEditingLessonDurationId(null)}
                                          className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                                        >
                                          <X size={11} />
                                        </button>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[8px] text-white/40 font-bold">خيارات سريعة:</span>
                                        {["25:00", "30:00", "40:00", "45:00", "50:00", "1:00:00"].map((preset) => (
                                          <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setNewLessonDuration(preset)}
                                            className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all cursor-pointer ${
                                              newLessonDuration === preset
                                                ? "bg-[#00E5FF] text-black shadow-sm"
                                                : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5"
                                            }`}
                                          >
                                            {preset}
                                          </button>
                                        ))}
                                      </div>

                                      <div className="flex items-center gap-2 pt-1">
                                        <input
                                          type="text"
                                          value={newLessonDuration}
                                          onChange={(e) => setNewLessonDuration(e.target.value)}
                                          placeholder="مثال: 45:00 أو 1:15:00"
                                          className="flex-1 bg-[#050814] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/20 outline-none focus:border-[#00E5FF]/50 font-mono text-right"
                                        />
                                        <button
                                          type="button"
                                          disabled={isUpdatingDuration}
                                          onClick={() => handleSaveDuration(lesson.id)}
                                          className="px-3 py-1 bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-black font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                        >
                                          {isUpdatingDuration ? <RefreshCw size={10} className="animate-spin" /> : <Save size={10} />}
                                          <span>حفظ المدة</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Statistics & Storage */}
                  <div className="space-y-4">
                    {/* Academy AI radar notice */}
                    <div className="bg-[#0E152D]/40 border border-[#F59E0B]/20 rounded-2xl p-5 text-right space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <HelpCircle size={14} className="animate-pulse" />
                        <h4 className="text-[10px] font-black uppercase">
                          رادار الذكاء الاصطناعي للملازم
                        </h4>
                      </div>
                      <p className="text-[9px] text-white/50 leading-relaxed font-bold">
                        تلقائياً عند رفع الملازم والملخصات، يتم تفعيل "رادار الذكاء" للطلبة لاستنتاج وطرح الأسئلة الذكية وتدريبهم عبر "تحدي الستين ثانية" الملحق بكل ملزمة.
                      </p>
                    </div>
                  </div>
                </div>
  );
};
