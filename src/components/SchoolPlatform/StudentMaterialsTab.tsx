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
  Minimize2, Scan, XCircle, MessageSquare, Presentation, Tv
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

export const StudentMaterialsTab: React.FC = () => {
  const {
    academyPages,
    activeLiveMaterialIndex,
    activeLiveTeacherName,
    educationalFields,
    grade,
    gradeName,
    isLiveActive,
    isMaterialsSidebarCollapsed,
    isTeacher,
    liveTitle,
    mapGradeForDocument,
    recordedLessons,
    resolvedSchoolId,
    schoolName,
    selectedMaterialIndex,
    setActiveContentSession,
    setActiveTab,
    setIsMaterialsSidebarCollapsed,
    setSelectedAcademyPage,
    setSelectedMaterialIndex,
    setViewingRecordedLesson,
    studentSubmissions,
    targetBroadcastGrade,
    teacherAiResults,
    userProfile
  } = useSchoolPlatform();

  const [materialsActiveTab, setMaterialsActiveTab] = useState<'live' | 'interactive_converter'>('live');
  const [converterSearch, setConverterSearch] = useState('');

  useEffect(() => {
    if (educationalFields.length > 0 && selectedMaterialIndex >= educationalFields.length) {
      setSelectedMaterialIndex(0);
    }
  }, [educationalFields.length, selectedMaterialIndex, setSelectedMaterialIndex]);

  const safeIndex = selectedMaterialIndex < educationalFields.length ? selectedMaterialIndex : 0;
  const activeField = educationalFields[safeIndex];
  const activeSubjectName = activeField?.material || "";
  const activeTeachers = activeField?.teachers || [];
        
  const filteredRecordedLessons = recordedLessons.filter((lesson) => {
    const normalize = (s: string) => {
      if (!s) return "";
      return s
        .trim()
        .replace(/\s+/g, "")
        .replace(/^ال/, "")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/أ|إ|آ/g, "ا")
        .toLowerCase();
    };

    const lSubDesc = normalize(lesson.subject);
    const actSubDesc = normalize(activeSubjectName);

    const isSubMatch = 
      !activeSubjectName ||
      !lesson.subject ||
      lSubDesc.includes(actSubDesc) ||
      actSubDesc.includes(lSubDesc) ||
      (lSubDesc.includes("انكليز") && actSubDesc.includes("نجليز")) ||
      (actSubDesc.includes("انكليز") && lSubDesc.includes("نجليز")) ||
      (lSubDesc.includes("عرب") && actSubDesc.includes("عرب")) ||
      (lSubDesc.includes("اسلام") && (actSubDesc.includes("اسلام") || actSubDesc.includes("دين"))) ||
      (actSubDesc.includes("اسلام") && (lSubDesc.includes("islam") || lSubDesc.includes("دين") || lSubDesc.includes("اسلام"))) ||
      (lSubDesc.includes("حاسوب") && actSubDesc.includes("حاسب")) ||
      (lSubDesc.includes("رياضيات") && actSubDesc.includes("رياض"));

    const lGrad = normalize(lesson.grade);
    const sGrad = normalize(grade || userProfile?.grade || "");
    const isGradMatch = 
      !lesson.grade || 
      lesson.grade === "الكل" || 
      lesson.grade === "عام" || 
      lGrad === "" || 
      lGrad === "كل" || 
      lGrad === "عام" || 
      sGrad === "" || 
      sGrad === "كل" || 
      lGrad === sGrad || 
      lGrad.includes(sGrad) || 
      sGrad.includes(lGrad);

    return isSubMatch && isGradMatch;
  });

  const filteredAcademyPages = useMemo(() => {
    const norm = (s: string) =>
      (s || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/أ|إ|آ/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .toLowerCase();
    const currentSub = norm(activeSubjectName);
    const studentGrade = norm(grade || gradeName || (userProfile as any)?.grade || "");
    const searchNorm = norm(converterSearch);

    return (academyPages || []).filter((page: any) => {
      if (searchNorm) {
        const titleNorm = norm(page.title || "");
        const labelNorm = norm(page.targetSectionLabel || "");
        if (!titleNorm.includes(searchNorm) && !labelNorm.includes(searchNorm)) return false;
      }

      // Grade check
      if (studentGrade && page.targetSectionLabel) {
        const pageGrade = norm(page.targetSectionLabel);
        if (!pageGrade.includes("عام") && !pageGrade.includes("كل") && !pageGrade.includes(studentGrade) && !studentGrade.includes(pageGrade)) {
          if (Array.isArray(page.targetSections) && page.targetSections.length > 0) {
            const matchesSec = page.targetSections.some((ts: string) => norm(ts).includes(studentGrade) || studentGrade.includes(norm(ts)));
            if (!matchesSec) return false;
          }
        }
      }

      // Subject check
      const pageSub = norm(page.subject || "");
      const pageTitle = norm(page.title || "");
      if (currentSub) {
        if (pageSub) {
          return pageSub.includes(currentSub) || currentSub.includes(pageSub);
        }
        if (pageTitle.includes(currentSub) || currentSub.includes(pageTitle)) {
          return true;
        }
        return true;
      }
      return true;
    });
  }, [academyPages, activeSubjectName, grade, gradeName, userProfile, converterSearch]);

  return (
    <div className="w-full h-full flex-1 min-h-0 flex text-right" dir="rtl">
      {/* القائمة الجانبية للمواد - تمرير طبيعي باللمس والتصفح مع حيز علوي آمن لزر العودة */}
      <div
        className={`bg-[#0A1024]/95 backdrop-blur-md border-l border-white/5 flex flex-col pt-20 pb-24 overflow-y-auto shrink-0 shadow-[inset_1px_0_0_rgba(255,255,255,0.02)] transition-all duration-300 relative h-full min-h-0 touch-pan-y overscroll-contain ${
          isMaterialsSidebarCollapsed ? "w-0 opacity-0 overflow-hidden border-l-0" : "w-20 lg:w-[86px]"
        }`}
        style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {educationalFields.map((field, index) => {
            const isSelected = selectedMaterialIndex === index;
            const Icon = field.icon;
            return (
              <button
                key={`${field.material}-${index}`}
                onClick={() => {
                  setSelectedMaterialIndex(index);
                  if (isTeacher && isLiveActive && resolvedSchoolId && targetBroadcastGrade) {
                    setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                      materialIndex: index
                    }, { merge: true }).catch(console.error);
                  }
                }}
                className={`group flex flex-col items-center justify-center py-4 px-1 transition-all outline-none gap-1.5 border-r-[3px] relative shrink-0 cursor-pointer ${
                  isSelected
                    ? `bg-[#050A18] ${field.color || "text-[#FFD600]"}`
                    : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/80"
                }`}
                style={{
                  borderColor: isSelected ? "currentColor" : "transparent",
                }}
              >
                {isSelected && (
                  <div
                    className={`absolute inset-0 ${field.bgColor || "bg-[#FFD600]/10"} opacity-30`}
                  />
                )}
                {isLiveActive && !isTeacher && activeLiveMaterialIndex === index && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-black z-20" title="بث مباشر الآن"></span>
                )}
                <Icon
                  size={isSelected ? 24 : 20}
                  strokeWidth={isSelected ? 2.5 : 2}
                  className={`relative z-10 transition-transform ${isSelected ? "scale-110" : "group-hover:scale-105"} ${isSelected ? "" : "group-hover:" + (field.color || "text-white/60")}`}
                />
                <span
                  className={`text-[9px] font-bold px-1 text-center relative z-10 leading-tight ${isSelected ? "" : "group-hover:" + (field.color || "text-white/60")}`}
                >
                  {field.material}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* زر طي / فتح الشريط الجانبي للميادين - في مكان آمن تماماً بعيداً عن سهم العودة الرئيسي */}
      <button
        type="button"
        onClick={() => setIsMaterialsSidebarCollapsed(!isMaterialsSidebarCollapsed)}
        className={`fixed top-[115px] z-50 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0d1533] hover:bg-[#14214d] border border-amber-400/40 hover:border-amber-400 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 ${
          isMaterialsSidebarCollapsed
            ? "right-3"
            : "right-[84px] lg:right-[90px]"
        }`}
        title={isMaterialsSidebarCollapsed ? "إظهار شريط المواد" : "طي شريط المواد"}
      >
        {isMaterialsSidebarCollapsed ? (
          <ChevronLeft size={16} strokeWidth={3} />
        ) : (
          <ChevronRight size={16} strokeWidth={3} />
        )}
      </button>

      {/* ساحة المحتوى - تمرير طبيعي باللمس والفأرة */}
      <div 
        className="flex-1 min-h-0 h-full flex flex-col p-4 sm:p-6 overflow-y-auto relative touch-pan-y overscroll-contain pb-28"
        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}
      >
        {/* Materials Tab Header banner with Bairaq pose_live_announcer */}
        <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-5">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
          <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Bairaq Video Companion on the LEFT side */}
          <div className="absolute left-0 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
            <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
            <BerqCharacter
              pose="captain_bairaq_guardian"
              glowColor="gold"
              className="w-full h-full object-cover relative z-10 scale-105"
            />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
          </div>

          {/* Content Container */}
          <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none h-full text-right min-w-0">
            <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
              ميادين الفرسان ⚔️
            </h2>
            <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
              <span className="shrink-0 text-xs">🏛️</span>
              <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
              <span className="shrink-0 text-[10px]">⚔️</span>
              <span className="truncate">ساحة {activeSubjectName || "المواد الدراسية"} {gradeName ? `• ${gradeName}` : ''}</span>
            </div>
          </div>
        </div>

        {/* بنر البث المباشر النشط للفرسان في أعلى الميادين */}
        {isLiveActive && !isTeacher && (
          <div 
            onClick={() => {
              if (activeLiveMaterialIndex !== null && activeLiveMaterialIndex !== undefined) {
                setSelectedMaterialIndex(activeLiveMaterialIndex);
              }
              setActiveTab("live_watch", "Student Materials Top Live Banner onClick");
            }}
            className="mb-5 z-10 relative cursor-pointer group"
          >
            <div className="bg-gradient-to-r from-red-950/90 via-red-900/80 to-black/95 border-2 border-red-500/50 hover:border-red-400 rounded-2xl p-4 flex items-center justify-between gap-3 overflow-hidden relative shadow-[0_0_25px_rgba(239,68,68,0.25)] transition-all hover:scale-[1.005]">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex items-center gap-3.5 z-10 min-w-0">
                <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  <Radio size={18} className="text-red-400 animate-pulse" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full" />
                </div>
                
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                      بث مباشر تفاعلي نشط 📡
                    </span>
                    {activeLiveMaterialIndex !== null && educationalFields[activeLiveMaterialIndex] && (
                      <span className="bg-white/10 text-[#FFD600] text-[10px] font-black px-2 py-0.5 rounded-full border border-white/10">
                        {educationalFields[activeLiveMaterialIndex].material}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm md:text-base font-black text-white truncate">
                      {activeLiveTeacherName ? `مع ${activeLiveTeacherName.replace(/^(أ\.|أستاذ\s+)/, 'الأستاذ ').trim()}` : 'بث مباشر الآن للفرسان'}
                    </h3>
                  </div>
                  <p className="text-red-200/90 text-[11px] sm:text-xs truncate max-w-xs sm:max-w-md md:max-w-xl mt-1 font-medium">
                    انضم الآن لحضور شرح <span className="text-[#00E5FF] font-black">"{liveTitle || 'الدرس المباشر'}"</span>
                  </p>
                </div>
              </div>

              <button 
                type="button"
                className="shrink-0 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-black px-4 sm:px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] z-10 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>دخول البث</span>
                <ChevronLeft size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* التبوبين العلويين في قسم الميادين: 1. البث المباشر 2. محول العرض التفاعلي */}
        <div className="flex items-center gap-2 mb-5 p-1 bg-[#0A1024]/90 border border-white/10 rounded-2xl shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMaterialsActiveTab('live')}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
              materialsActiveTab === 'live'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-600/30 border border-red-400/30'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Radio size={16} className={materialsActiveTab === 'live' ? 'animate-pulse text-white' : 'text-red-400'} />
            <span>البث المباشر</span>
            {isLiveActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMaterialsActiveTab('interactive_converter')}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none ${
              materialsActiveTab === 'interactive_converter'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 border border-cyan-400/30'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Sparkles size={16} className={materialsActiveTab === 'interactive_converter' ? 'text-amber-300 animate-pulse' : 'text-indigo-400'} />
            <span>محول العرض التفاعلي</span>
            <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-400/30 hidden sm:inline-block">
              ملفات ذكية 🪄
            </span>
          </button>
        </div>

        {/* محتوى التبويب المختار */}
        {materialsActiveTab === 'live' ? (
          /* تبويب البث المباشر */
          <div className="space-y-6">
            {/* سجل البثوث المرئية المحفوظة */}
            <div className="pt-2 px-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/80 text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Video size={18} className="text-[#00E5FF]" />
                  سجل البثوث المرئية المحفوظة
                </h3>
                <span className="text-xs text-white/40 font-bold">{filteredRecordedLessons.length} دروس محفوظة</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                {filteredRecordedLessons.length > 0 ? filteredRecordedLessons.map((lesson) => (
                  <div key={lesson.id} className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden hover:border-[#00E5FF]/30 transition-all group flex flex-col relative">
                    <div className="aspect-video bg-zinc-900 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:scale-105 transition-transform duration-500">
                        <img src="https://images.unsplash.com/photo-1633504581165-d419358249fc?q=80&w=400&auto=format&fit=crop" alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-bold text-white z-20 flex items-center gap-1">
                        {lesson.duration}
                      </div>
                      
                      <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm cursor-pointer">
                        <div className="w-12 h-12 bg-[#00E5FF] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                          <Video size={20} className="ml-1" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[#00E5FF] text-[9px] font-bold mb-1">{lesson.subject} | {lesson.grade}</p>
                        <h4 className="text-white text-xs font-black line-clamp-2 leading-relaxed">{lesson.title}</h4>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/40 mt-4 border-t border-white/5 pt-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {lesson.date}</span>
                        <button onClick={() => setViewingRecordedLesson(lesson)} className="text-[#00E5FF] font-bold hover:underline cursor-pointer">مشاهدة الدرس</button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-[#07132B]/60 rounded-3xl border border-cyan-500/20 p-8 shadow-[0_0_30px_rgba(0,229,255,0.1)] relative overflow-hidden my-4"
                  >
                    <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                      <BerqCharacter 
                        pose="captain_bairaq_guardian" 
                        glowColor="cyan" 
                        className="w-full h-full" 
                      />
                    </div>
                    <h3 className="text-base font-black text-white">ميادين البث المباشر والتفاعل 📡</h3>
                    <p className="text-cyan-300/70 text-xs mt-1.5 max-w-sm leading-relaxed font-bold">
                      بيرق المذيع المباشر جاهز في الميدان! ستظهر المحاضرات المسجلة والبثوث المباشرة فور إطلاقها من قِبل الأستاذ.
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* تبويب محول العرض التفاعلي */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 pt-5 px-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Presentation size={20} />
                </div>
                <div>
                  <h3 className="text-white text-sm font-black flex items-center gap-2">
                    <span>عروض وملفات محول العرض التفاعلي لمادة {activeSubjectName}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                      {filteredAcademyPages.length} ملفات تفاعلية
                    </span>
                  </h3>
                  <p className="text-white/40 text-[11px] font-semibold mt-0.5">
                    عروض تقديمية ذكية، تفكيك منهجي، واختبارات وزارية مصممة بأحدث تقنيات التعليم التفاعلي
                  </p>
                </div>
              </div>

              {filteredAcademyPages.length > 3 && (
                <div className="relative min-w-[200px]">
                  <Search size={14} className="absolute right-3 top-2.5 text-white/40" />
                  <input
                    type="text"
                    value={converterSearch}
                    onChange={(e) => setConverterSearch(e.target.value)}
                    placeholder="بحث في ملفات العرض..."
                    className="w-full bg-black/40 text-white text-xs pr-8 pl-3 py-2 rounded-xl border border-white/10 focus:border-indigo-400 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Grid of Interactive Display Files */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
              {filteredAcademyPages.length > 0 ? (
                filteredAcademyPages.map((booklet: any, idx: number) => {
                  const pageCount = Array.isArray(booklet.pages) ? booklet.pages.length : (booklet.pageCount || 1);
                  const hasQuiz = Array.isArray(booklet.pages) && booklet.pages.some((p: any) => Array.isArray(p.quiz) && p.quiz.length > 0);
                  const hasMinisterial = Array.isArray(booklet.pages) && booklet.pages.some((p: any) => Array.isArray(p.ministerialQuestions) && p.ministerialQuestions.length > 0);
                  
                  return (
                    <motion.div
                      key={booklet.id || idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-gradient-to-br from-[#0c142c] to-[#070b18] hover:from-[#111c3e] hover:to-[#0a1126] border border-white/10 hover:border-cyan-400/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between group shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/25">
                              {activeSubjectName}
                            </span>
                            {booklet.targetSectionLabel && (
                              <span className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded-full font-medium border border-white/5 truncate max-w-[120px]">
                                {booklet.targetSectionLabel}
                              </span>
                            )}
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <Presentation size={16} />
                          </div>
                        </div>

                        <h4 className="text-white font-black text-sm mb-2 line-clamp-2 group-hover:text-cyan-300 transition-colors leading-relaxed">
                          {booklet.title || `ملزمة تفاعلية - ${activeSubjectName}`}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 mb-4">
                          <span className="text-[10px] bg-black/40 text-cyan-300 px-2 py-0.5 rounded-lg border border-white/5 font-bold flex items-center gap-1">
                            <Layers size={11} className="text-cyan-400" />
                            {pageCount} {pageCount === 1 ? 'شريحة' : 'شرائح تفاعلية'}
                          </span>
                          {hasQuiz && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/20 font-bold flex items-center gap-1">
                              <Sparkles size={11} className="text-amber-400" />
                              اختبارات ذكية
                            </span>
                          )}
                          {hasMinisterial && (
                            <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-500/20 font-bold flex items-center gap-1">
                              <Award size={11} className="text-purple-400" />
                              وزاريات
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedAcademyPage(booklet)}
                        className="w-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <Play size={14} className="fill-white" />
                        <span>فتح العرض التفاعلي الذكي</span>
                      </button>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-[#07132B]/60 rounded-3xl border border-indigo-500/20 p-8 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden my-4"
                >
                  <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                    <BerqCharacter 
                      pose="captain_bairaq_guardian" 
                      glowColor="gold" 
                      className="w-full h-full" 
                    />
                  </div>
                  <h3 className="text-base font-black text-white">محول العرض التفاعلي لمادة {activeSubjectName} 🪄</h3>
                  <p className="text-indigo-200/70 text-xs mt-1.5 max-w-md leading-relaxed font-bold">
                    يقوم الأساتذة بتحويل الكتب والملازم الدراسية إلى عروض تقديمية تفاعلية وشاشات ذكية واختبارات وزارية، وستظهر ملفات مادة <span className="text-amber-400 font-black">{activeSubjectName}</span> هنا فور نشرها.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
