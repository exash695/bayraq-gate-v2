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

export const StudentMaterialsTab: React.FC = () => {
  const { activeLiveMaterialIndex, activeLiveTeacherName, educationalFields, grade, gradeName, isLiveActive, isMaterialsSidebarCollapsed, isTeacher, liveTitle, mapGradeForDocument, recordedLessons, resolvedSchoolId, schoolName, selectedMaterialIndex, setActiveContentSession, setActiveTab, setIsMaterialsSidebarCollapsed, setSelectedMaterialIndex, setViewingRecordedLesson, studentSubmissions, targetBroadcastGrade, teacherAiResults, userProfile } = useSchoolPlatform();

  useEffect(() => {
    if (educationalFields.length > 0 && selectedMaterialIndex >= educationalFields.length) {
      setSelectedMaterialIndex(0);
    }
  }, [educationalFields.length, selectedMaterialIndex, setSelectedMaterialIndex]);

  const safeIndex = selectedMaterialIndex < educationalFields.length ? selectedMaterialIndex : 0;
  const activeField = educationalFields[safeIndex];
  const activeSubjectName = activeField?.material || "";
        
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

        const uncompletedHwCount = teacherAiResults.filter(r => {
          const rGradeNorm = mapGradeForDocument(r.targetGrade || "");
          const studentGradeNorm = mapGradeForDocument(grade || gradeName || "");
          const matchesGrade = !r.targetGrade || r.targetGrade === "الكل" || rGradeNorm === studentGradeNorm;
          return r.tool === 'صناعة واجبات' && matchesGrade && !studentSubmissions.some(sub => sub.taskId === r.id && sub.type === 'homework');
        }).length;

        const uncompletedCompCount = teacherAiResults.filter(r => {
          const rGradeNorm = mapGradeForDocument(r.targetGrade || "");
          const studentGradeNorm = mapGradeForDocument(grade || gradeName || "");
          const matchesGrade = !r.targetGrade || r.targetGrade === "الكل" || rGradeNorm === studentGradeNorm;
          return r.tool === 'مسابقات صفية' && matchesGrade && !studentSubmissions.some(sub => sub.taskId === r.id && sub.type === 'competition');
        }).length;

        return (
          <div className="h-full flex text-right" dir="rtl">
            {/* القائمة الجانبية للمواد */}
            <div
              className={`bg-[#0A1024]/95 backdrop-blur-md border-l border-white/5 flex flex-col pt-4 no-scrollbar overflow-y-auto shrink-0 shadow-[inset_1px_0_0_rgba(255,255,255,0.02)] transition-all duration-300 relative ${isMaterialsSidebarCollapsed ? "w-0 opacity-0 overflow-hidden border-l-0" : "w-20 lg:w-[86px]"}`}
            >
              {!isMaterialsSidebarCollapsed && (
                <button
                  onClick={() => setIsMaterialsSidebarCollapsed(true)}
                  className="absolute left-2 top-20 p-1.5 rounded-full bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-amber-400/50 text-amber-400 transition-all z-20 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)] border border-white/10"
                  title="طي الشريط الجانبي"
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              )}

              {educationalFields.map((field, index) => {
                const isSelected = selectedMaterialIndex === index;
                const Icon = field.icon;
                return (
                  <button
                    key={field.material}
                    onClick={() => {
                      setSelectedMaterialIndex(index);
                      if (isTeacher && isLiveActive && resolvedSchoolId && targetBroadcastGrade) {
                        setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                          materialIndex: index
                        }, { merge: true }).catch(console.error);
                      }
                    }}
                    className={`group flex flex-col items-center justify-center py-5 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                      isSelected
                        ? `bg-[#050A18] ${field.color || "text-[#FFD600]"}`
                        : "border-transparent text-white/40 hover:bg-white/5"
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
                      <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-black z-20" title="بث مباشر الآن"></span>
                    )}
                    <Icon
                      size={isSelected ? 24 : 22}
                      strokeWidth={isSelected ? 2.5 : 2}
                      className={`relative z-10 transition-transform ${isSelected ? "scale-110" : "group-hover:scale-105"} ${isSelected ? "" : "group-hover:" + (field.color || "text-white/60")}`}
                    />
                    <span
                      className={`text-[9px] font-bold px-1 text-center relative z-10 ${isSelected ? "" : "group-hover:" + (field.color || "text-white/60")}`}
                    >
                      {field.material}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ساحة الأساتذة والمحتوى */}
            <div className="flex-1 flex flex-col p-4 overflow-y-auto relative no-scrollbar">
              {isMaterialsSidebarCollapsed && (
                <button
                  onClick={() => setIsMaterialsSidebarCollapsed(false)}
                  className="fixed right-3 top-[120px] z-50 p-2.5 bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-amber-400/50 text-amber-400 transition-all rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-white/10 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                  title="إظهار الشريط الجانبي"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
              )}

              {/* Materials Tab Header banner with Bairaq pose_live_announcer */}
              <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-6">
                {/* Background elegant pattern and overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
                <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Bairaq Video Companion on the LEFT side - Spans from edge to edge (height 100%) */}
                <div className="absolute left-0 top-0 bottom-0 h-full w-36 sm:w-44 md:w-52 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
                  {/* Decorative neon golden-phosphor circular glow frame in background */}
                  <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
                  <BerqCharacter
                    pose="captain_bairaq_guardian"
                    glowColor="gold"
                    className="w-full h-full object-cover relative z-10 scale-105"
                  />
                  {/* Subtle gradient overlay to blend the right edge smoothly into the blue background */}
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

              {/* Live Broadcast Banner for Students */}
              {isLiveActive && !isTeacher && (
                <div className="mb-6 z-10 relative cursor-pointer" onClick={() => setActiveTab("live_watch", "Live Broadcast Banner for Students onClick")}>
                  <div className="bg-gradient-to-r from-red-950/80 to-black/90 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3 overflow-hidden relative group shadow-lg shadow-red-900/10 hover:border-red-500/40 transition-colors">
                    <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center gap-3 z-10">
                      <div className="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30">
                        <Radio size={14} className="text-red-500 animate-pulse" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs md:text-sm font-black text-white">
                            {activeLiveTeacherName ? `بث مباشر الآن مع ${activeLiveTeacherName.replace(/^(أ\.|أستاذ\s+)/, 'الأستاذ ').trim()}` : 'بث مباشر الآن'}
                          </h3>
                          <span className="bg-red-500/20 text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">LIVE</span>
                        </div>
                        <p className="text-white/60 text-[10px] md:text-xs truncate max-w-[200px] md:max-w-md mt-0.5">
                          انضم الآن لشرح <span className="text-[#00E5FF] font-bold">"{liveTitle}"</span>
                        </p>
                      </div>
                    </div>

                    <button 
                      className="shrink-0 bg-red-600 hover:bg-red-500 text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)] z-10 flex items-center gap-1.5"
                    >
                      <span className="hidden sm:inline">دخول</span>
                      <ChevronLeft size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">
                  كبار الأساتذة
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {educationalFields[selectedMaterialIndex].teachers.length >
                  0 ? (
                    educationalFields[selectedMaterialIndex].teachers.map(
                      (teacher, idx) => (
                        <motion.div
                          key={`${teacher.name}-${idx}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="min-w-[120px] flex flex-col items-center p-4 bg-[#101935] rounded-[40px] border border-[#FFD600]/30 shadow-lg"
                        >
                          <div className="w-14 h-14 rounded-full bg-[#0D47A1] flex items-center justify-center mb-3 border-2 border-[#FFD600]/20 shadow-inner">
                            <User size={28} className="text-white" />
                          </div>
                          <span className="text-white text-xs font-black text-center mb-1 leading-tight">
                            {teacher.name}
                          </span>
                          <span className="text-white/40 text-[9px] text-center leading-tight">
                            {teacher.desc}
                          </span>
                        </motion.div>
                      ),
                    )
                  ) : (
                    <div className="w-full py-10 flex flex-col items-center justify-center text-white/20 border border-dashed border-white/10 rounded-2xl">
                      <GraduationCap size={40} className="mb-2 opacity-10" />
                      <span className="text-sm font-bold italic">
                        قريباً.. انضمام عمالقة التدريس
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 border-t border-white/5 pt-6 px-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white/80 text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-500" />
                    المحتوى التدريسي والملازم التفاعلية
                  </h3>
                </div>
                {!isTeacher && educationalFields[selectedMaterialIndex].teachers.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                   <button
                     onClick={() => setActiveContentSession({ title: "أزمنة الماضي والمضارع", unit: "اليونت الأول" })}
                     className="group text-right bg-[#0B1021]/80 hover:bg-[#111933] border border-white/5 hover:border-[#00E5FF]/40 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex flex-col h-full active:scale-95"
                   >
                     <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#00E5FF] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex items-start gap-4 mb-4">
                       <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shrink-0">
                         <BookOpen size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                       </div>
                       <div>
                         <span className="text-[#00E5FF] text-[10px] font-black uppercase tracking-wider bg-[#00E5FF]/10 px-2 py-0.5 rounded-full inline-block mb-1 border border-[#00E5FF]/20">عالي الأهمية</span>
                         <h4 className="text-white font-black text-sm leading-snug">أزمنة الماضي والمضارع</h4>
                         <p className="text-blue-400 text-[10px] font-bold mt-1">اليونت الأول</p>
                       </div>
                     </div>
                     <p className="text-white/50 text-[11px] font-bold leading-relaxed mb-4 flex-1">
                       محاضرة تفاعلية كاملة تم نشرها للتو تغطي القواعد مع أسئلة وزارية وتحدي הـ60 ثانية.
                     </p>
                     <div className="w-full bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] py-2 rounded-xl text-center text-xs font-black transition-colors flex items-center justify-center gap-2 border border-[#00E5FF]/20">
                       <Play size={14} className="fill-[#00E5FF]" /> بدء المعالجة
                     </div>
                   </button>
                 </div>
                ) : (
                  <div className="w-full py-8 text-center text-white/30 text-xs font-bold bg-white/5 rounded-2xl border border-white/5 mb-8">
                    لم يقم الأستاذ بنشر محتوى تفاعلي جديد في هذا الميدان بعد
                  </div>
                )}
              </div>

              <div className="flex-1 border-t border-white/5 pt-6 px-2">
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
                        {/* Placeholder video thumbnail style */}
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
                          <button onClick={() => setViewingRecordedLesson(lesson)} className="text-[#00E5FF] font-bold hover:underline">مشاهدة الدرس</button>
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
          </div>
        );
};
