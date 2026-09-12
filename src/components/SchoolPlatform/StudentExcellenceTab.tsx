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
  Minimize2, Scan, XCircle, MessageSquare, BarChart3
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
import { ExcellenceShareModal } from "../ExcellenceShareModal";
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

export const StudentExcellenceTab: React.FC = () => {
  const { 
    activeClassStudents,
    activeCommentPostId, 
    activeStudent, 
    avatarInputRef, 
    currentTeacherData, 
    editingPhraseText, 
    editingPostContent, 
    editingPostId, 
    excellenceSubTab, 
    getCurrentUserId, 
    getUserPhoto, 
    grade, 
    gradeName, 
    handleAddAdminNoteClick, 
    handleComment, 
    handleDeletePost, 
    handleEditPost, 
    handleSaveEditPost, 
    handleSaveInspiringPhrase, 
    handleToggleLockPost, 
    handleTogglePinPost, 
    isEditingPhrase, 
    isTeacher, 
    loadingExcellence, 
    openMenuPostId, 
    posts, 
    schoolConfigs, 
    schoolName, 
    selectedBadge, 
    selectedTeacherClass,
    setActiveTab, 
    setEditingPhraseText, 
    setEditingPostContent, 
    setEditingPostId, 
    setExcellenceSubTab, 
    setIsEditingPhrase, 
    setOpenMenuPostId, 
    setSelectedBadge, 
    setSelectedTeacherClass,
    subjectMapping, 
    teacherAssignedSections,
    teacherData, 
    toggleLike, 
    topStudents, 
    userCode, 
    userProfile 
  } = useSchoolPlatform();
  const [isExcellenceShareModalOpen, setIsExcellenceShareModalOpen] = useState(false);
  const [selectedGradePeriod, setSelectedGradePeriod] = useState<string>("month1");

  const examPeriods = [
    { id: 'month1', name: 'الشهر الأول' },
    { id: 'month2', name: 'الشهر الثاني' },
    { id: 'midterm', name: 'نصف السنة' },
    { id: 'month3', name: 'الشهر الثالث' },
    { id: 'month4', name: 'الشهر الرابع' },
    { id: 'annual_quest', name: 'معدل السعي السنوي' },
    { id: 'final', name: 'آخر السنة' },
    { id: 'final_grade', name: 'الدرجة النهائية' }
  ];

  const effectiveTeacher = currentTeacherData || teacherData;
  const teacherName = effectiveTeacher?.name || userProfile?.name || auth.currentUser?.displayName || "أستاذ المادة";
  const teacherSpecialization = effectiveTeacher?.subject || userProfile?.subject || userProfile?.specialization || "كادر التدريس والتفوق الأكاديمي";
  const teacherCode = effectiveTeacher?.code || effectiveTeacher?.id || userProfile?.code || "TCH-ACTIVE";

  useEffect(() => {
    if (isTeacher && excellenceSubTab === "badges") {
      setExcellenceSubTab("knights");
    }
  }, [isTeacher, excellenceSubTab, setExcellenceSubTab]);

        const activeExcPoints = computeExcellencePoints(
          activeStudent,
          null,
          subjectMapping,
        );
        const activeIdentity = computeAcademicIdentity(
          activeStudent,
          null,
          subjectMapping,
        );
        const activeLevelData = getLevelData(activeExcPoints.totalPoints || 0);

        // Map general & subject badges
        const studentBadges: Array<{
          id: string;
          title: string;
          desc: string;
          icon: string;
          color?: string;
        }> = [];

        if (activeIdentity.generalBadges) {
          activeIdentity.generalBadges.forEach((b: any) => {
            if (b) {
              studentBadges.push({
                id: b.id,
                title: b.title,
                desc:
                  b.desc ||
                  "وسام تقديري فخري عن سلوكك وتفوقك الراقي بالأكاديمية.",
                icon: b.icon || "🏆",
                color: b.color || "from-amber-400 to-yellow-600",
              });
            }
          });
        }

        if (activeIdentity.subjectBadgesArray) {
          activeIdentity.subjectBadgesArray.forEach((b: any) => {
            if (b) {
              studentBadges.push({
                id: b.id || b.subject,
                title: b.badge?.title || `بطل ${b.subject}`,
                desc: `مستحَق عن إنجاز تفوق بمعدل ${b.score}% في مادة ${b.subject}.`,
                icon: b.badge?.icon || "🧠",
                color: b.config?.colors || "from-blue-600 to-indigo-500",
              });
            }
          });
        }

        // Standard placeholders if no badges obtained yet to make UI highly engaging
        if (studentBadges.length === 0) {
          studentBadges.push(
            {
              id: "math_default",
              title: "عبقري الرياضيات 🧠",
              desc: "ممنوح لحصول الطالب على درجة تفوق مبهرة وتفكير رياضي متميز.",
              icon: "🧠",
              color: "from-blue-600 to-indigo-600",
            },
            {
              id: "che_default",
              title: "بطل الكيمياء 🧪",
              desc: "ممنوح لسرعة التفاعلات الذهنية والحلول الكيميائية المبدعة.",
              icon: "🧪",
              color: "from-fuchsia-600 to-pink-500",
            },
            {
              id: "attendance_default",
              title: "وسام المثابرة 🚀",
              desc: "ممنوح للالتزام المطلق والانضباط العالي في تتبع ومثابرة الدروس.",
              icon: "🚀",
              color: "from-teal-500 to-emerald-600",
            },
          );
        }
        const classroomColleagues = useMemo(() => {
          if (isTeacher) {
            const list = [...(activeClassStudents || [])];
            return list.sort((a: any, b: any) => {
              const aPts = Number(a.totalPoints !== undefined ? a.totalPoints : (a.excellencePoints || 0));
              const bPts = Number(b.totalPoints !== undefined ? b.totalPoints : (b.excellencePoints || 0));
              if (bPts !== aPts) return bPts - aPts;
              const aAvg = Number(a.averagePercent) || 0;
              const bAvg = Number(b.averagePercent) || 0;
              if (bAvg !== aAvg) return bAvg - aAvg;
              return (a.name || "").localeCompare(b.name || "", "ar");
            });
          }
          return topStudents || [];
        }, [isTeacher, activeClassStudents, topStudents]);

        const topThree = useMemo(() => classroomColleagues.slice(0, 3), [classroomColleagues]);

        const levelsList = [
          { levelNum: 1, label: "مجتهد برونزي 🥉", pointsRange: "0 - 20 XP" },
          { levelNum: 2, label: "طالب مبادر 🥉", pointsRange: "21 - 40 XP" },
          { levelNum: 3, label: "منضبط فضي 🥈", pointsRange: "41 - 60 XP" },
          { levelNum: 4, label: "متميز فضي 🥈", pointsRange: "61 - 80 XP" },
          { levelNum: 5, label: "بطل ذهبي 🥇", pointsRange: "81 - 100 XP" },
          { levelNum: 6, label: "فائق ذهبي 🥇", pointsRange: "101 - 120 XP" },
          {
            levelNum: 7,
            label: "أسطوري الماسي 💎",
            pointsRange: "121 - 140 XP",
          },
          {
            levelNum: 8,
            label: "نخبة الأبطال الماسي 💎",
            pointsRange: "141+ XP",
          },
        ];

        const currentPoints = Math.round(activeExcPoints.totalPoints || 0);
        const currentLvl = activeLevelData.level;
        const xpInCurrentLvl = activeLevelData.xpInCurrentLevel;

        return (
          <div
            className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 space-y-10"
            dir="rtl"
          >
            {/* Header banner with Bairaq pose_excellence_champion */}
            <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-8">
              {/* Background elegant pattern and overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
              <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Bairaq Video Companion */}
              <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
                <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
                <BerqCharacter
                  pose="pose_excellence_champion"
                  glowColor="gold"
                  className="w-full h-full object-cover relative z-10 scale-110"
                />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
              </div>

              {/* Header Title & Subtitle */}
              <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none text-right h-full min-w-0">
                <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
                  قاعة الأبطال ولوحة النخبة 🏆
                </h2>
                <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                  <span className="shrink-0 text-xs">🏛️</span>
                  <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                  <span className="shrink-0 text-[10px]">🎓</span>
                  <span className="truncate">{gradeName || grade || userProfile?.grade || userProfile?.academicLevel || "سادس علمي"}</span>
                </div>
              </div>
            </div>

            {/* Sub-tab segmented controller */}
            <div className="flex w-full p-1.5 bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-2xl max-w-3xl mx-auto relative z-10 shadow-2xl">
              <button
                id="subtab-knights"
                onClick={() => setExcellenceSubTab("knights")}
                className={`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                  excellenceSubTab === "knights"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Trophy size={16} className="shrink-0" />
                <span className="text-center leading-tight whitespace-nowrap">سجل الشرف</span>
              </button>
              {!isTeacher && (
                <button
                  id="subtab-badges"
                  onClick={() => setExcellenceSubTab("badges")}
                  className={`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                    excellenceSubTab === "badges"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Award size={16} className="shrink-0" />
                  <span className="text-center leading-tight whitespace-nowrap">أوسمتي</span>
                </button>
              )}
              {!isTeacher && (
                <button
                  id="subtab-grades"
                  onClick={() => setExcellenceSubTab("grades")}
                  className={`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                    excellenceSubTab === "grades"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <BarChart3 size={16} className="shrink-0" />
                  <span className="text-center leading-tight whitespace-nowrap">درجاتي</span>
                </button>
              )}
              <button
                id="subtab-profile"
                onClick={() => setExcellenceSubTab("profile")}
                className={`flex-1 py-2 sm:py-3 px-1 sm:px-4 rounded-xl font-bold text-[10px] sm:text-sm transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
                  excellenceSubTab === "profile"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/10 scale-[1.01]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <User size={16} className="shrink-0" />
                <span className="text-center leading-tight whitespace-nowrap">الملف الشخصي</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isTeacher && excellenceSubTab === "badges" && (
                <motion.div
                  key="personal_badges"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-10"
                >
                  {/* Personal Vault Banner */}
                  <div className="relative rounded-[2.5rem] p-1 bg-gradient-to-tr from-amber-500/20 via-transparent to-amber-500/10 overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.1)] border border-amber-500/20">
                    <div className="bg-[#0b0f24]/85 backdrop-blur-2xl rounded-[2.4rem] p-6 sm:p-10 relative overflow-hidden space-y-8">
                      <div className="absolute top-[-40%] left-[-20%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
                      <div className="absolute bottom-[-30%] right-[-10%] w-[55%] h-[55%] bg-[#00E5FF]/5 rounded-full blur-[120px] pointer-events-none" />

                      {/* Banner Header inside */}
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-6 border-b border-white/5 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right">
                          <div className="relative group shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2.2rem] bg-gradient-to-tr from-amber-500/10 via-[#101935] to-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(251,191,36,0.2)] overflow-hidden transition-all duration-300">
                              {getUserPhoto() ? (
                                <img
                                  src={getUserPhoto()}
                                  alt="صورة الملف الشخصي"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={36} className="text-white/30" />
                              )}
                              {/* Camera Hover overlay */}
                              <div
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                              >
                                <Camera size={26} className="text-amber-400" />
                              </div>
                            </div>

                            {/* Floating camera button */}
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="absolute -bottom-1 -left-1 bg-amber-400 shadow-md select-none p-2 rounded-full border border-black/50 text-black hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                              title="تغيير الصورة الشخصية"
                            >
                              <Camera size={12} strokeWidth={3} />
                            </button>
                          </div>
                          <div>
                            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                              خزنتي الخاصة للأوسمة والتفوق
                            </h3>
                            <p className="text-white/40 text-xs mt-1">
                              كود الطالب:{" "}
                              <span className="text-[#00E5FF] font-mono font-black">
                                {activeStudent.studentCode ||
                                  activeStudent.code}
                              </span>
                            </p>

                            <p className="text-white/70 italic text-xs sm:text-sm mt-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-2xl max-w-xl">
                              "
                              {activeStudent.inspiringPhrase ||
                                "طالب ذكي يسعى بكل شغف للريادة والمعدلات الكاملة وبصمة تميز لا تنطفئ."}
                              "
                            </p>
                          </div>
                        </div>

                        {/* Level text summary & Quick Honor Card Generator */}
                        <div className="text-center lg:text-left bg-gradient-to-l from-amber-500/10 to-transparent p-4 rounded-3xl border border-amber-500/10 shrink-0 flex flex-col items-center lg:items-end">
                          <p className="text-amber-300 text-[10px] font-black tracking-widest uppercase mb-1">
                            المستحق الحالي والتصنيف
                          </p>
                          <p className="text-white font-black text-lg sm:text-xl drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)]">
                            {activeLevelData.label}
                          </p>
                          <p className="text-white/30 text-[9px] mt-1">
                            المستوى الرقمي:{" "}
                            <span className="text-[#00E5FF] font-black">
                              {activeLevelData.level}
                            </span>{" "}
                            | نقاط التميز الإجمالية:{" "}
                            <span className="text-amber-400 font-black">
                              {currentPoints} XP
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsExcellenceShareModalOpen(true)}
                            className="mt-3 w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#FFD600] to-amber-500 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,214,0,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
                          >
                            <Sparkles size={14} className="text-black" />
                            <span>توليد بطاقة شرف الطالب الأكاديمية 📜✨</span>
                          </button>
                        </div>
                      </div>

                      {/* Gamified Levels Progression Track */}
                      <div className="space-y-4 relative z-10">
                        <h4 className="text-sm font-black text-amber-400/80 text-right flex items-center justify-start gap-2">
                          <Sparkles size={16} className="text-amber-400" />
                          <span>
                            خارطة مستويات التميز (مؤشرات تعبئة الأشرطة اللحظية)
                          </span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                          {levelsList.map((lvl) => {
                            const isCompleted = currentLvl > lvl.levelNum;
                            const isActive = currentLvl === lvl.levelNum;

                            let fillPercent = 0;
                            let statusText = "";
                            let barColor = "from-slate-600 to-slate-400";
                            let cardBorder = "border-white/5 bg-white/[0.01]";

                            if (isCompleted) {
                              fillPercent = 100;
                              statusText = "مكتمل بنجاح 🌟";
                              barColor = "from-emerald-500 to-teal-400";
                              cardBorder =
                                "border-emerald-500/20 bg-emerald-500/[0.02]";
                            } else if (isActive) {
                              fillPercent = (xpInCurrentLvl / 20) * 100;
                              statusText = `قيد التقدم • متبقي ${Math.round(20 - xpInCurrentLvl)} XP للعبور`;
                              barColor =
                                "from-amber-500 via-yellow-400 to-[#FFD600]";
                              cardBorder =
                                "border-amber-500/40 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.05)]";
                            } else {
                              fillPercent = 0;
                              statusText = "مغلق 🔒";
                              barColor = "from-white/5 to-white/5";
                              cardBorder =
                                "border-white/5 bg-white/[0.01] opacity-50";
                            }

                            return (
                              <div
                                key={lvl.levelNum}
                                className={`p-4 rounded-2xl border ${cardBorder} transition-all duration-300 flex flex-col justify-between space-y-3`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${isActive ? "bg-amber-500 text-black" : isCompleted ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/30"}`}
                                    >
                                      {lvl.levelNum}
                                    </span>
                                    <span
                                      className={`text-xs font-bold ${isActive ? "text-white font-black" : isCompleted ? "text-white/80" : "text-white/40"}`}
                                    >
                                      {lvl.label}
                                    </span>
                                  </div>
                                </div>

                                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 relative flex items-center">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${fillPercent}%` }}
                                    transition={{
                                      duration: 1.2,
                                      ease: "easeOut",
                                    }}
                                    className={`h-full bg-gradient-to-r ${barColor} rounded-full`}
                                  />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-semibold">
                                  <span
                                    className={
                                      isActive
                                        ? "text-amber-400 font-bold"
                                        : isCompleted
                                          ? "text-emerald-400"
                                          : "text-white/20"
                                    }
                                  >
                                    {statusText}
                                  </span>
                                  {isActive && (
                                    <span className="text-[#00E5FF] font-black font-mono">
                                      {Math.round(fillPercent)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active honorary badges */}
                      <div className="space-y-4 relative z-10 pt-4">
                        <h4 className="text-white text-sm font-black text-right flex items-center justify-start gap-2 text-amber-400/80">
                          <Sparkles
                            size={16}
                            className="text-amber-400 animate-pulse"
                          />
                          <span>
                            الأوسمة الفخرية النشطة والميداليات الذكية الخاصة بك
                            (اضغط لقراءة بطاقة التهنئة)
                          </span>
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 pt-2">
                          {studentBadges.map((badge, bIdx) => (
                            <motion.button
                              key={`${badge.id}-${bIdx}`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedBadge(badge)}
                              className="aspect-square rounded-full bg-gradient-to-br from-[#101935] via-[#090d20] to-black border-2 border-amber-500/30 flex flex-col items-center justify-center relative cursor-pointer group shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.05)] hover:shadow-[0_15px_30px_rgba(251,191,36,0.35),inset_0_2px_10px_rgba(255,255,255,0.15)] hover:border-[#FFD600]/80 transition-all duration-300"
                            >
                              <div className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,_rgba(255,255,255,0.1)_0%,_transparent_50%,_rgba(0,0,0,0.3)_100%)] pointer-events-none" />
                              <span className="text-3xl filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)] transform group-hover:rotate-12 transition-transform duration-300">
                                {badge.icon}
                              </span>
                              <div className="absolute -bottom-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-[8px] sm:text-[9px] font-black tracking-tight border border-amber-300 truncate max-w-[95%] shadow-md">
                                {badge.title}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Elite Status Overlay */}
                      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                            <Crown
                              size={26}
                              className="drop-shadow-[0_0_10px_rgba(255,214,0,0.4)] animate-pulse"
                            />
                          </div>
                          <div className="text-right">
                            <p className="text-white font-black text-sm">
                              ركن الإعفاء والريادة الدراسية (Elite Status
                              Overlay) 👑
                            </p>
                            <p className="text-white/40 text-[10px] font-extrabold">
                              منفعة وتكريم الإعفاء من الامتحانات أو الحصص
                              المقررة
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                          {activeIdentity.generalExemption ? (
                            <span className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-[#FFD600] to-yellow-600 text-black font-black text-xs rounded-full border border-amber-300 flex items-center gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-105 transition-transform animate-none">
                              <span>إعفاء عام معتمد 👑</span>
                            </span>
                          ) : activeIdentity.individualExemptions &&
                            activeIdentity.individualExemptions.length > 0 ? (
                            activeIdentity.individualExemptions.map(
                              (subj, sIdx) => (
                                <span
                                  key={`exempt-subj-${sIdx}`}
                                  className="px-4 py-2 bg-emerald-500/10 text-emerald-400 font-extrabold text-[10px] sm:text-xs rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                                >
                                  ✨ إعفاء فردي: {subj}
                                </span>
                              ),
                            )
                          ) : (
                            <div className="px-4 py-2 bg-white/[0.02] text-white/40 font-bold text-[10px] sm:text-xs rounded-full border border-white/5 text-center">
                              يتم احتساب ومنح بطاقات الإعفاء تلقائياً بعد رصد معدل السعي السنوي 🎯
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {excellenceSubTab === "knights" && (
                <motion.div
                  key="knights_leaderboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-right">
                      <h3 className="text-2xl font-black text-white">
                        سجل شرف الفرسان والصف الدراسي
                      </h3>
                      <p className="text-white/40 text-xs">
                        {isTeacher
                          ? `قائمة فرسان ${selectedTeacherClass === "ALL" || !selectedTeacherClass ? "كافة الشُعب الموكلة" : `شعبة (${selectedTeacherClass})`} مرتبة تلقائياً حسب النقاط ومتزامنة آنياً 📡`
                          : "قائمة فرسان صفك الدراسي الحالية مرتبة تلقائياً ومتزامنة آنياً مع أي ترصيد من المشرف 📡"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] text-emerald-400 font-black tracking-widest">
                        تزامن حي ومباشر (REAL-TIME STATUS)
                      </span>
                    </div>
                  </div>

                  {/* Teacher Section Switcher & Active Indicator in Excellence Tab */}
                  {isTeacher && teacherAssignedSections && teacherAssignedSections.length > 0 && (
                    <div className="bg-[#0A0E24]/80 border border-amber-500/20 rounded-2xl p-4 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔀</span>
                          <span className="text-xs font-black text-white">
                            تحديد الشعبة لعرض سجل الشرف:
                          </span>
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            {selectedTeacherClass === "ALL" || !selectedTeacherClass
                              ? "كافة الشُعب الموكلة"
                              : selectedTeacherClass}
                          </span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          {classroomColleagues.length} فرسان مسجلين
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTeacherClass && setSelectedTeacherClass("ALL")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                            selectedTeacherClass === "ALL" || !selectedTeacherClass
                              ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105"
                              : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          🌟 كافة الشُعب الموكلة
                        </button>

                        {teacherAssignedSections.map((sec: any) => {
                          const isSelected = selectedTeacherClass === sec.name;
                          return (
                            <button
                              key={`sec_exc_${sec.name}`}
                              type="button"
                              onClick={() => setSelectedTeacherClass && setSelectedTeacherClass(sec.name)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] scale-105"
                                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <span>{sec.name}</span>
                              {sec.studentCount !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                  isSelected ? "bg-black/20 text-black" : "bg-white/10 text-white/50"
                                }`}>
                                  {sec.studentCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {loadingExcellence ? (
                    <div className="py-20 text-center">
                      <div className="w-12 h-12 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                      <p className="text-white/20 text-[10px] font-black tracking-widest uppercase">
                        جاري استدعاء سجل التميز والتزامن...
                      </p>
                    </div>
                  ) : classroomColleagues.length === 0 ? (
                    <div className="py-24 text-center bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                      <Award className="mx-auto text-white/5 mb-6" size={80} />
                      <p className="text-white/20 font-black italic tracking-widest uppercase">
                        سجل الشرف بانتظار فرسانه الجدد...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-10 selection:bg-amber-400 selection:text-black">
                      {/* The 3D Podium (منصة التتويج الثلاثية) */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative bg-gradient-to-b from-[#0a0f24] to-transparent rounded-[3rem] p-6 sm:p-10 border border-white/5 shadow-2xl"
                      >
                        <h4 className="text-center font-black text-white/50 text-xs tracking-widest uppercase mb-4">
                          {isTeacher
                            ? `منصة التتويج الثلاثي - ${selectedTeacherClass === "ALL" || !selectedTeacherClass ? "كافة الشُعب الموكلة" : selectedTeacherClass} 🥇`
                            : "منصة التتويج الثلاثي لأبطال الصف 🥇"}
                        </h4>

                        <div className="flex justify-center items-end gap-3 sm:gap-6 pt-10 pb-6">
                          {/* 2nd Place */}
                          {topThree[1] ? (
                            <div className="flex flex-col items-center md:w-44">
                              <div className="relative group mb-3">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 shadow-[0_0_20px_rgba(156,163,175,0.25)] border-2 border-slate-300">
                                  {topThree[1].avatar ? (
                                    <img
                                      src={topThree[1].avatar}
                                      alt={topThree[1].name}
                                      className="w-full h-full object-cover rounded-full"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full rounded-full bg-[#101935] flex items-center justify-center text-slate-300 font-bold text-xl sm:text-2xl">
                                      🥈
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-black flex items-center justify-center text-xs font-black shadow-lg">
                                  2
                                </div>
                              </div>

                              <div className="text-center mb-2 px-1 max-w-[120px]">
                                <p className="text-white font-black text-xs sm:text-sm truncate">
                                  {topThree[1].name}
                                </p>
                                <p className="text-[#00E5FF] font-black text-[10px] sm:text-xs">
                                  {Math.round(topThree[1].totalPoints || 0)} XP
                                </p>
                              </div>

                              {/* Podium Block */}
                              <div className="w-24 sm:w-28 h-20 sm:h-24 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t border-slate-500/30 flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
                                <span className="text-3xl sm:text-4xl text-slate-400 font-black">
                                  2
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-slate-300 font-black tracking-wider mt-1">
                                  المستحق الثاني
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center opacity-25 md:w-44">
                              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10" />
                              <div className="w-24 h-20 bg-white/5 rounded-t-xl mt-3" />
                            </div>
                          )}

                          {/* 1st Place */}
                          {topThree[0] ? (
                            <div className="flex flex-col items-center md:w-48 animate-none">
                              <div className="relative group mb-3">
                                {/* Radiant Glow */}
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 via-[#FFD600] to-yellow-500 rounded-full blur opacity-65 animate-pulse" />
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-500 via-[#FFD600] to-yellow-400 p-1 shadow-[0_0_35px_rgba(251,191,36,0.4)] border-2 border-[#FFD600]">
                                  {topThree[0].avatar ? (
                                    <img
                                      src={topThree[0].avatar}
                                      alt={topThree[0].name}
                                      className="w-full h-full object-cover rounded-full"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full rounded-full bg-[#101935] flex items-center justify-center text-[#FFD600] font-black text-2xl sm:text-3xl">
                                      🥇
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FFD600] text-black flex items-center justify-center text-sm font-black shadow-lg border-2 border-black">
                                  👑
                                </div>
                              </div>

                              <div className="text-center mb-2 px-1 max-w-[130px]">
                                <p className="text-amber-400 font-black text-sm sm:text-base truncate drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                                  {topThree[0].name}
                                </p>
                                <p className="text-[#FFD600] font-black text-xs sm:text-sm drop-shadow-[0_0_5px_rgba(255,214,0,0.5)]">
                                  {Math.round(topThree[0].totalPoints || 0)} XP
                                </p>
                              </div>

                              {/* Podium Block */}
                              <div className="w-28 sm:w-32 h-28 sm:h-32 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-3xl border-t-2 border-[#FFD600]/80 flex flex-col items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
                                <span className="text-5xl text-amber-300 font-extrabold drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)]">
                                  1
                                </span>
                                <span className="text-[10px] text-amber-200 font-black tracking-wide mt-1">
                                  بطل الصف الأول
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center opacity-25 md:w-48">
                              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10" />
                              <div className="w-28 h-28 bg-white/5 rounded-t-3xl mt-3" />
                            </div>
                          )}

                          {/* 3rd Place */}
                          {topThree[2] ? (
                            <div className="flex flex-col items-center md:w-44">
                              <div className="relative group mb-3">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-800 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(180,83,9,0.25)] border-2 border-amber-700/60">
                                  {topThree[2].avatar ? (
                                    <img
                                      src={topThree[2].avatar}
                                      alt={topThree[2].name}
                                      className="w-full h-full object-cover rounded-full"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full rounded-full bg-[#101935] flex items-center justify-center text-amber-600 font-bold text-xl sm:text-2xl">
                                      🥉
                                    </div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-xs font-black shadow-lg">
                                  3
                                </div>
                              </div>

                              <div className="text-center mb-2 px-1 max-w-[120px]">
                                <p className="text-white font-black text-xs sm:text-sm truncate">
                                  {topThree[2].name}
                                </p>
                                <p className="text-amber-500 font-black text-[10px] sm:text-xs">
                                  {Math.round(topThree[2].totalPoints || 0)} XP
                                </p>
                              </div>

                              {/* Podium Block */}
                              <div className="w-24 sm:w-28 h-16 sm:h-20 bg-gradient-to-t from-amber-955 to-amber-900/60 rounded-t-xl border-t border-amber-800/20 flex flex-col items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
                                <span className="text-2xl sm:text-3xl text-amber-600 font-black">
                                  3
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-amber-500 font-black tracking-wider mt-1">
                                  المستحق الثالث
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center opacity-25 md:w-44">
                              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10" />
                              <div className="w-24 h-16 bg-white/5 rounded-t-lg mt-3" />
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Class Leaderboard Grid / Rows (جدول الفرسان التفاعلي) */}
                      <div className="space-y-4">
                        <h4 className="text-white text-xs font-black tracking-widest uppercase mb-4 text-right">
                          {isTeacher && selectedTeacherClass && selectedTeacherClass !== "ALL"
                            ? `رتبة فرسان شعبة (${selectedTeacherClass}) من الأعلى للأقل ⚔️`
                            : "رتبة فرسان الصف من الأعلى للأقل ⚔️"}
                        </h4>
                        <div className="space-y-3">
                          {classroomColleagues.map((stu, idx) => {
                            const isCurrentUser =
                              (stu.studentCode || stu.code || stu.student || "")
                                .trim()
                                .toLowerCase() === userCode ||
                              stu.id === userProfile?.id;
                            return (
                              <motion.div
                                key={stu.id || `knightr-${idx}`}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{
                                  delay: Math.min(idx * 0.05, 0.5),
                                }}
                                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden ${
                                  isCurrentUser
                                    ? "bg-gradient-to-r from-amber-500/15 via-[#0b0f24] to-transparent border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30 font-bold"
                                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  {/* Medal rank placement */}
                                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black font-mono shrink-0 bg-white/5 border border-white/10 text-white/50">
                                    {idx === 0
                                      ? "🥇"
                                      : idx === 1
                                        ? "🥈"
                                        : idx === 2
                                          ? "🥉"
                                          : `#${idx + 1}`}
                                  </div>

                                  {/* Avatar and Info */}
                                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 shrink-0 bg-[#101935] flex items-center justify-center relative shadow-inner">
                                    {stu.avatar ? (
                                      <img
                                        src={stu.avatar}
                                        alt={stu.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <span className="text-lg">🎓</span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-white font-black text-sm sm:text-base leading-tight truncate">
                                        {stu.name}
                                      </h4>
                                      {isCurrentUser && (
                                        <span className="shrink-0 text-[7px] sm:text-[8px] bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black px-2 py-0.5 rounded-full uppercase border border-amber-300 shadow-md">
                                          أنت
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-white/40 text-[11px] sm:text-xs italic mt-0.5 truncate max-w-[280px] sm:max-w-[450px]">
                                      "
                                      {stu.inspiringPhrase ||
                                        "طالب ذكي من فرسان الأكاديمية وصاحب سعي مستمر وهمة تعانق النجوم."}
                                      "
                                    </p>
                                  </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                                  <div className="flex gap-4 sm:gap-8">
                                    <div className="text-right">
                                      <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                                        نقاط التميز
                                      </p>
                                      <p className="text-[#00E5FF] font-black text-base italic">
                                        {Math.round(stu.totalPoints || 0)} XP
                                      </p>
                                    </div>
                                  </div>
                                  <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] sm:text-[10px] text-white/50 font-black max-w-[130px] truncate md:block hidden">
                                    {stu.computedTitle || "بطل التميز 🏅"}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {excellenceSubTab === "profile" && (
                <motion.div
                  key="my_profile_dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Student Profile details card */}
                  <div className="relative rounded-[2.5rem] p-1 bg-gradient-to-tr from-[#00E5FF]/20 via-transparent to-purple-500/20 overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.05)] border border-white/5">
                    <div className="bg-[#0b0f24]/85 backdrop-blur-2xl rounded-[2.4rem] p-6 sm:p-10 relative overflow-hidden space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-right justify-between w-full">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="relative group shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[2.2rem] bg-gradient-to-tr from-[#00E5FF]/10 via-[#101935] to-[#00E5FF]/20 border-2 border-[#00E5FF]/50 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,229,255,0.2)] overflow-hidden transition-all duration-300">
                              {getUserPhoto() ? (
                                <img
                                  src={getUserPhoto()}
                                  alt="صورة الملف الشخصي"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={40} className="text-white/30" />
                              )}
                              <div
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                              >
                                <Camera size={26} className="text-[#00E5FF]" />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => avatarInputRef.current?.click()}
                              className="absolute -bottom-1 -left-1 bg-[#00E5FF] shadow-md select-none p-2 rounded-full border border-black/50 text-black hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                              title="تغيير الصورة الشخصية"
                            >
                              <Camera size={14} strokeWidth={3} />
                            </button>
                          </div>
                          <div>
                            {isTeacher ? (
                              <>
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                    {teacherName}
                                  </h3>
                                  <span className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black px-2.5 py-0.5 rounded-full shadow-md">
                                    أستاذ قدير
                                  </span>
                                </div>
                                <div className="text-[#00E5FF] text-xs sm:text-sm font-black mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                                  <span className="text-white/50 font-normal">الاختصاص التدريسي:</span>
                                  <span className="bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] px-2.5 py-0.5 rounded-lg font-bold">
                                    {teacherSpecialization}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                  <span className="text-white/40 text-xs font-mono">
                                    كود المعلم: <span className="text-amber-400 font-bold">{teacherCode}</span>
                                  </span>
                                  {effectiveTeacher?.classes && effectiveTeacher.classes.length > 0 && (
                                    <span className="text-white/40 text-[11px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-sans">
                                      الصفوف: {effectiveTeacher.classes.join("، ")}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                                  {userProfile?.name ||
                                    auth.currentUser?.displayName ||
                                    "طالب متميز"}
                                </h3>
                                <p className="text-white/40 text-xs sm:text-sm mt-1">
                                  كود الطالب:{" "}
                                  <span className="text-[#00E5FF] font-mono font-black">
                                    {activeStudent.studentCode ||
                                      activeStudent.code ||
                                      "STU-6TH-ELITE"}
                                  </span>
                                </p>
                                <p className="text-[#00E5FF] text-xs font-bold mt-1 bg-[#00E5FF]/5 border border-[#00E5FF]/10 px-3 py-1 rounded-full inline-block">
                                  {activeLevelData.label} | {currentPoints} XP
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Interactive Stats Panel */}
                        <div className="flex gap-4 text-center">
                          {isTeacher ? (
                            <>
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 min-w-[100px]">
                                <span className="block text-[#00E5FF] font-black text-2xl">
                                  {effectiveTeacher?.classes?.length || 1}
                                </span>
                                <span className="text-[10px] text-white/40 font-bold">
                                  الصفوف الموكلة
                                </span>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 min-w-[100px]">
                                <span className="block text-amber-400 font-black text-2xl">
                                  {
                                    posts.filter(
                                      (p) => p.userId === getCurrentUserId(),
                                    ).length
                                  }
                                </span>
                                <span className="text-[10px] text-white/40 font-bold">
                                  منشوراتي
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 min-w-[100px]">
                                <span className="block text-[#00E5FF] font-black text-2xl">
                                  {currentPoints}
                                </span>
                                <span className="text-[10px] text-white/40 font-bold">
                                  نقاط التميز
                                </span>
                              </div>
                              <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-3 min-w-[100px]">
                                <span className="block text-amber-400 font-black text-2xl">
                                  {
                                    posts.filter(
                                      (p) => p.userId === getCurrentUserId(),
                                    ).length
                                  }
                                </span>
                                <span className="text-[10px] text-white/40 font-bold">
                                  منشوراتي
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Inspiring phrase with editor */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center space-y-3">
                        <span className="text-[10px] text-[#00E5FF] font-black uppercase tracking-wider block">
                          {isTeacher ? "رسالتي الأكاديمية والتربوية 🌟" : "العبارة الملهمة الخاصة بي 🌟"}
                        </span>
                        {isEditingPhrase ? (
                          <div className="space-y-3 max-w-lg mx-auto">
                            <input
                              type="text"
                              value={editingPhraseText}
                              onChange={(e) =>
                                setEditingPhraseText(e.target.value)
                              }
                              placeholder={isTeacher ? "اكتب رسالتك التربوية والملهمة لطلابك..." : "..."}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-[#00E5FF]"
                            />
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleSaveInspiringPhrase(isTeacher ? (effectiveTeacher?.id || 'teacher') : activeStudent.id)
                                }
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black transition-all cursor-pointer rounded-lg"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setIsEditingPhrase(false)}
                                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 text-[10px] sm:text-xs font-bold transition-all rounded-lg"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-white/80 italic text-xs sm:text-sm font-medium">
                              "
                              {isTeacher
                                ? (effectiveTeacher?.bio || effectiveTeacher?.inspiringPhrase || "التعليم رسالة سامية نبني بها عقول فرسان المستقبل ونوقد بها شعلة المعرفة.")
                                : (activeStudent.inspiringPhrase || "طالب متميز يسعى بكل شغف للريادة الأكاديمية والمعدلات الكاملة وبصمة تميز لا تنطفئ.")}
                              "
                            </p>
                            <button
                              onClick={() => {
                                setEditingPhraseText(
                                  isTeacher
                                    ? (effectiveTeacher?.bio || effectiveTeacher?.inspiringPhrase || "التعليم رسالة سامية نبني بها عقول فرسان المستقبل ونوقد بها شعلة المعرفة.")
                                    : (activeStudent.inspiringPhrase || "")
                                );
                                setIsEditingPhrase(true);
                              }}
                              className="text-[10px] text-[#00E5FF]/80 hover:text-[#00E5FF] flex items-center gap-1 cursor-pointer font-bold underline transition-colors"
                            >
                              <Edit2 size={10} />
                              {isTeacher ? "تعديل رسالتي التربوية" : "تعديل العبارة الملهمة"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Story Interactions Panel */}
                      <div className="bg-gradient-to-r from-indigo-950/20 to-purple-950/20 border border-white/5 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Crown
                            size={18}
                            className="text-amber-400 animate-pulse"
                          />
                          <h4 className="text-white font-black text-xs sm:text-sm font-sans">
                            🌟 لوحة تفاعلات حالات التميز لقصصي
                          </h4>
                        </div>
                        <p className="text-white/50 text-[11px] leading-relaxed">
                          عندما يستلهم زملائك الفرسان من تميزك اليومي، يرسلون لك
                          ملصقات وردوداً تشجيعية، ما يزيد من نفوذك وهيبتك
                          الأكاديمية!
                        </p>
                        <div className={`grid ${isTeacher ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} gap-3 pt-1`}>
                          <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-right">
                            <span className="block text-rose-400 font-black text-base">
                              ❤️{" "}
                              {(activeStudent as any).storyReactionsCount || 0}
                            </span>
                            <span className="text-[9px] text-white/40 font-bold">
                              {isTeacher ? "تفاعلات الطلبة والمتابعين" : "تفاعلات الرموز التعبيرية"}
                            </span>
                          </div>
                          <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-right">
                            <span className="block text-emerald-400 font-black text-base">
                              💬 {(activeStudent as any).storyRepliesCount || 0}
                            </span>
                            <span className="text-[9px] text-white/40 font-bold font-sans">
                              {isTeacher ? "الردود والتوجيهات المنشورة" : "الردود والتشجيع المباشر"}
                            </span>
                          </div>
                          {!isTeacher && (
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-right col-span-2 md:col-span-1">
                              <span className="block text-amber-400 font-black text-base">
                                ✨ +{(activeStudent as any).pointsBonus || 0} XP
                              </span>
                              <span className="text-[9px] text-white/40 font-bold">
                                مكافآت التميز اليومي
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student posts section (منشوراتي) */}
                  <div className="space-y-6 text-right">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded-full bg-[#00E5FF]" />
                      <span>المنشورات التي قمت بنشرها في الساحة 🚀</span>
                    </h3>

                    {posts.filter((p) => p.userId === getCurrentUserId())
                      .length === 0 ? (
                      <div className="py-20 text-center bg-white/[0.01] border border-white/5 rounded-3xl space-y-4">
                        <LayoutGrid
                          size={48}
                          className="mx-auto text-white/10"
                        />
                        <p className="text-white/30 text-sm font-bold italic">
                          لم تقم بنشر أي مشاركات في الساحة بعد.
                        </p>
                        <button
                          onClick={() => setActiveTab("feed", "Start new post button onClick")}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-[0.98] inline-block"
                        >
                          ابدأ بنشر منشور جديد في الساحة!
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5">
                        {posts
                          .filter((p) => p.userId === getCurrentUserId())
                          .map((post, idx) => (
                            <motion.div
                              key={`profile-post-${post.id || idx}`}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-[#101935]/60 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl text-right"
                            >
                              <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                                    {getUserPhoto() ? (
                                      <img
                                        src={getUserPhoto()}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <User
                                        size={22}
                                        className="text-blue-400"
                                      />
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <h4 className="text-white font-black text-sm sm:text-base flex items-center gap-1.5 animate-none">
                                      {post.userName}
                                      {post.isPinned && (
                                        <Pin
                                          size={12}
                                          className="text-amber-400"
                                        />
                                      )}
                                      {post.isLocked && (
                                        <Lock
                                          size={12}
                                          className="text-rose-400"
                                        />
                                      )}
                                    </h4>
                                    <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-none block">
                                      {post.time}
                                    </span>
                                  </div>
                                </div>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuPostId(
                                        openMenuPostId === post.id
                                          ? null
                                          : post.id,
                                      );
                                    }}
                                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer active:scale-95"
                                  >
                                    <MoreHorizontal size={18} />
                                  </button>

                                  {openMenuPostId === post.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenMenuPostId(null)}
                                      />
                                      <div
                                        className="absolute left-0 mt-2 w-48 rounded-2xl bg-[#090D1C]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.6)] py-2 z-50 animate-in fade-in duration-150 text-right"
                                        dir="rtl"
                                      >
                                        {!isTeacher &&
                                          userProfile?.role !== "admin" &&
                                          post.userId ===
                                            getCurrentUserId() && (
                                            <>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEditPost(post);
                                                }}
                                                className="w-full px-4 py-2.5 text-right text-xs font-bold text-white/85 hover:text-amber-400 hover:bg-white/[0.03] transition-all flex items-center justify-between cursor-pointer"
                                              >
                                                <span>تعديل المنشور</span>
                                                <Edit2
                                                  size={13}
                                                  className="opacity-60"
                                                />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeletePost(post.id);
                                                }}
                                                className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                              >
                                                <span>حذف المنشور</span>
                                                <Trash2 size={13} />
                                              </button>
                                            </>
                                          )}

                                        {(post.userId === getCurrentUserId() ||
                                          userProfile?.role === "admin") && (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePost(post.id);
                                              }}
                                              className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-between cursor-pointer"
                                            >
                                              <span>حذف المنشور</span>
                                              <Trash2 size={13} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleTogglePinPost(post);
                                              }}
                                              className="w-full px-4 py-2.5 text-right text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                            >
                                              <span>
                                                {post.isPinned
                                                  ? "إلغاء التثبيت"
                                                  : "تثبيت المنشور"}
                                              </span>
                                              <Pin
                                                size={13}
                                                className={
                                                  post.isPinned
                                                    ? "fill-amber-500"
                                                    : ""
                                                }
                                              />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleLockPost(post);
                                              }}
                                              className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-400 hover:bg-rose-400/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                            >
                                              <span>
                                                {post.isLocked
                                                  ? "فتح التعليقات"
                                                  : "قفل التعليقات"}
                                              </span>
                                              <Lock size={13} />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddAdminNoteClick(post);
                                              }}
                                              className="w-full px-4 py-2.5 text-right text-xs font-bold text-blue-400 hover:bg-blue-400/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                            >
                                              <span>إضافة ملاحظة إدارية</span>
                                              <MessageCircle size={13} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="px-5 pb-5 text-right">
                                {editingPostId === post.id ? (
                                  <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                                    <textarea
                                      value={editingPostContent}
                                      onChange={(e) =>
                                        setEditingPostContent(e.target.value)
                                      }
                                      className="w-full bg-black/40 border border-[#00E5FF]/40 rounded-xl p-3 text-white text-sm focus:outline-none transition-colors text-right"
                                      rows={3}
                                      dir="rtl"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() =>
                                          handleSaveEditPost(post.id)
                                        }
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-[0.98]"
                                      >
                                        حفظ التعديلات
                                      </button>
                                      <button
                                        onClick={() => setEditingPostId(null)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold cursor-pointer transition-all"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-white/90 text-sm md:text-base leading-relaxed font-semibold block text-right whitespace-pre-wrap">
                                    <RenderTextWithTags text={post.content} />
                                  </p>
                                )}

                                {post.mediaUrl && (
                                  <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                                    <img
                                      src={post.mediaUrl}
                                      alt=""
                                      className="w-full object-contain max-h-[400px]"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="px-5 py-3.5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <button
                                    onClick={() =>
                                      toggleLike(post.id, post.isLiked)
                                    }
                                    className={`flex items-center gap-1.5 transition-all text-sm ${post.isLiked ? "text-rose-500 animate-pulse" : "text-white/30 hover:text-white/60"}`}
                                  >
                                    <Heart
                                      size={18}
                                      strokeWidth={2.5}
                                      fill={
                                        post.isLiked ? "currentColor" : "none"
                                      }
                                    />
                                    <span className="text-xs font-bold">
                                      {post.likes}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleComment(post.id)}
                                    className={`flex items-center gap-1.5 transition-colors text-sm ${activeCommentPostId === post.id ? "text-blue-500" : "text-white/30 hover:text-white/60"}`}
                                  >
                                    <MessageCircle
                                      size={18}
                                      strokeWidth={2.5}
                                    />
                                    <span className="text-xs font-bold">
                                      {post.comments}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* Global comments modal handles comments instead of inline */}
                            </motion.div>
                          ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {excellenceSubTab === "grades" && !isTeacher && (
                <motion.div
                  key="my_grades_dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-br from-black/80 to-[#0B1021] border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-white text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
                            <BarChart3 className="text-amber-400" />
                            سجل التقييم الأكاديمي
                          </h2>
                          <p className="text-white/40 text-xs sm:text-sm max-w-lg">
                            يتيح لك هذا السجل متابعة تقييمك الذاتي في جميع الاختبارات والامتحانات بصورة مباشرة ودقيقة كما يتم رصدها مركزياً.
                          </p>
                        </div>
                      </div>

                      {/* Period Selector */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-4">
                        {examPeriods.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedGradePeriod(p.id)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
                              selectedGradePeriod === p.id 
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20' 
                                : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>

                      {/* Grades Table */}
                      <div className="space-y-3">
                        {(() => {
                          const subjects = getSubjectsForGrade(activeStudent?.grade || '', [], subjectMapping);
                          const grades = activeStudent?.grades?.[selectedGradePeriod] || {};
                          
                          if (Object.keys(grades).length === 0) {
                            return (
                              <div className="text-center py-16 px-6 border-2 border-dashed border-white/5 rounded-[2.5rem] space-y-4">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                  <BarChart3 size={32} className="text-white/10" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-white font-bold text-sm">لا يوجد نتائج مرصودة</p>
                                  <p className="text-white/20 text-[10px]">لم يتم رفع درجات {examPeriods.find(p => p.id === selectedGradePeriod)?.name} حتى الآن</p>
                                </div>
                              </div>
                            );
                          }

                          return subjects.map((sub, idx) => {
                            const grade = Number(grades[sub.id]) || 0;
                            const isExcellent = grade >= 90;
                            const isGood = grade >= 70 && grade < 90;
                            const isFailed = grade < 50;
                            return (
                              <motion.div
                                key={`${sub.id}_${idx}_grade`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[#101935] p-5 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-amber-500/30 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${isFailed ? 'bg-rose-500' : isExcellent ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                  <span className="text-white font-medium group-hover:text-amber-400 transition-colors">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`text-xl font-black ${isFailed ? 'text-rose-500' : isExcellent ? 'text-emerald-400' : 'text-blue-400'}`}>
                                    {grade}
                                  </span>
                                  {isExcellent && <Star size={16} className="text-[#FFD600] fill-[#FFD600] animate-pulse" />}
                                </div>
                              </motion.div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal: Congratulatory Academy Medal Certificate */}
            <AnimatePresence>
              {selectedBadge && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedBadge(null)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                  />

                  {/* Glassmorphism Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative bg-[#0d122c]/95 border border-[#FFD600]/40 rounded-[3rem] p-8 max-w-sm sm:max-w-md w-full text-center shadow-[0_0_60px_rgba(251,191,36,0.3)] overflow-hidden"
                    dir="rtl"
                  >
                    {/* Golden sparkles/beams background */}
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.08)_0%,_transparent_65%)] pointer-events-none" />

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedBadge(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>

                    {/* Emblem Badge Icon */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-[#FFD600] to-yellow-400 p-1.5 mx-auto mb-6 shadow-[0_0_40px_rgba(251,191,36,0.35)] relative group">
                      <div className="w-full h-full rounded-full bg-[#050a18] flex items-center justify-center text-5xl">
                        {selectedBadge.icon}
                      </div>
                      <div className="absolute inset-0 rounded-full border border-dashed border-[#FFD600] animate-none" />
                    </div>

                    {/* Academy Branding Header */}
                    <span className="text-[#FFD600] text-[8px] sm:text-[9px] font-black tracking-[0.3em] uppercase block mb-1">
                      الأكاديمية الوطنية للتميز
                    </span>
                    <h3 className="text-white text-sm font-bold mb-6">
                      بوابة شرف النخبة
                    </h3>

                    {/* Main Congratulations text */}
                    <div className="space-y-4 mb-8">
                      <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight leading-tight uppercase">
                        {selectedBadge.title}
                      </h2>

                      <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto rounded-full" />

                      <p className="text-white/80 font-medium text-sm sm:text-base px-2 leading-relaxed">
                        بكامل الفخر والشرف، تتقدم إدارة المنصة بتهنئة الفارس
                        المصمم والمجتهد على نيل هذا الاستحقاق الفوسفوري:
                      </p>

                      <p className="text-[#00E5FF] font-black text-xs sm:text-sm bg-[#00E5FF]/10 py-2 px-4 rounded-xl border border-[#00E5FF]/20 inline-block">
                        {selectedBadge.desc}
                      </p>

                      {/* Influential Quote */}
                      <p className="text-white/50 italic text-xs leading-relaxed max-w-xs mx-auto border-t border-white/5 pt-4">
                        "القمم لا يبلغها المتكاسلون، بل يتربع عليها الفرسان
                        الحقيقيون مثلكم دائمًا. ننتظر صولتك القادمة بقمة
                        الميادين!"
                      </p>
                    </div>

                    {/* Bottom Branding Stamp */}
                    <div className="flex items-center justify-center gap-2 text-[9px] text-white/30 font-black tracking-wider uppercase border-t border-white/5 pt-4">
                      <span>إمضاء: اللجنة التحكيمية الأكاديمية</span>
                      <span>⚜️</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Academic Honor Card Modal */}
            <ExcellenceShareModal
              isOpen={isExcellenceShareModalOpen}
              onClose={() => setIsExcellenceShareModalOpen(false)}
              studentData={activeStudent}
              academicProfile={activeIdentity}
              schoolConfigs={schoolConfigs}
              schoolName={schoolName}
              exportId="student-vault-achievement-export-card"
            />
          </div>
        );
};
