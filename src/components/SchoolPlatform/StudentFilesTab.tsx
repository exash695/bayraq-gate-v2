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
  normalizeArabicText,
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

export const StudentFilesTab: React.FC = () => {
  const { academicLists, grade, gradeName, highlightTasksSection, isFilesSidebarCollapsed, isTeacher, mapGradeForDocument, onClearHighlightTasks, recordedLessons, resolvedSchoolId, schoolExamPapers, schoolFiles, schoolId, schoolName, schoolQuestions, setActiveRadarFile, setCompetitionAnswers, setCompetitionScore, setCompetitionTimer, setHomeworkAnswer, setIsFilesSidebarCollapsed, setPdfLoadError, setPreviewingFile, setSelectedAIQuestion, setSelectedPaperForExtraction, setStudentExamPaperRole, setStudentExamPaperYear, setStudentLibrarySearch, setStudentLibrarySubject, setStudentLibraryTab, setStudentQuestionBankTab, setUserRatings, setViewingCompetition, setViewingHomework, setViewingRecordedLesson, setViewingSubmissionFeedback, showToast, studentExamPaperRole, studentExamPaperYear, studentLibrarySearch, studentLibrarySubject, studentLibraryTab, studentQuestionBankTab, studentSubmissions, subjectMapping, teacherAiResults, userProfile, userRatings } = useSchoolPlatform();

        const isGradeMatch = (docGrade?: string, targetStudentGrade?: string): boolean => {
          if (!docGrade || !targetStudentGrade) return true;
          const dClean = String(docGrade).trim();
          const sClean = String(targetStudentGrade).trim();
          if (!dClean || dClean === "الكل" || dClean === "عام" || dClean === "جميع المراحل") return true;
          if (!sClean || sClean === "الكل" || sClean === "عام" || sClean === "جميع المراحل") return true;
          if (dClean === sClean) return true;

          const dMapped = mapGradeForDocument(dClean);
          const sMapped = mapGradeForDocument(sClean);
          if (dMapped && sMapped && (dMapped === sMapped || dMapped === "الكل" || sMapped === "الكل")) return true;

          const dNorm = normalizeArabicText(dClean);
          const sNorm = normalizeArabicText(sClean);
          if (dNorm === sNorm || dNorm.includes(sNorm) || sNorm.includes(dNorm)) return true;

          const grades = [
            { keys: ['اولابتدائي', 'اولابتداي'], label: 'أول ابتدائي' },
            { keys: ['ثانيابتدائي', 'ثانيابتداي'], label: 'ثاني ابتدائي' },
            { keys: ['ثالثابتدائي', 'ثالثابتداي'], label: 'ثالث ابتدائي' },
            { keys: ['رابعابتدائي', 'رابعابتداي'], label: 'رابع ابتدائي' },
            { keys: ['خامسابتدائي', 'خامسابتداي'], label: 'خامس ابتدائي' },
            { keys: ['سادسابتدائي', 'سادسابتداي'], label: 'سادس ابتدائي' },
            { keys: ['اولمتوسط'], label: 'أول متوسط' },
            { keys: ['ثانيمتوسط'], label: 'ثاني متوسط' },
            { keys: ['ثالثمتوسط'], label: 'ثالث متوسط' },
            { keys: ['رابععلمي', 'رابعالعلمي'], label: 'رابع علمي' },
            { keys: ['رابعادبي', 'رابعالادبي'], label: 'رابع أدبي' },
            { keys: ['خامسعلمي', 'خامسالعلمي'], label: 'خامس علمي' },
            { keys: ['خامسادبي', 'خامسالادبي'], label: 'خامس أدبي' },
            { keys: ['سادسعلمي', 'سادسالعلمي', 'سادستطبيقي', 'سادسأحيائي', 'سادساحيائي'], label: 'سادس علمي' },
            { keys: ['سادسادبي', 'سادسالادبي'], label: 'سادس أدبي' },
          ];

          for (const g of grades) {
            const dMatches = g.keys.some(k => dNorm.includes(k));
            const sMatches = g.keys.some(k => sNorm.includes(k));
            if (dMatches && sMatches) return true;
          }

          return false;
        };

        const normalizeSubject = (s: string) => {
          if (!s) return "";
          return String(s)
            .trim()
            .replace(/\s+/g, "")
            .replace(/^ال/, "")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/أ|إ|آ/g, "ا")
            .toLowerCase();
        };

        const isSubjectMatch = (itemSubject?: string, itemTitle?: string) => {
          if (!studentLibrarySubject || studentLibrarySubject === "الكل") return true;
          const s2 = normalizeSubject(studentLibrarySubject);
          if (!s2) return true;

          const isMath = (s: string) => s.includes("رياضيات");
          const isSport = (s: string) => (s.includes("رياضه") || s.includes("بدني")) && !s.includes("رياضيات");

          if (itemSubject) {
            const s1 = normalizeSubject(itemSubject);
            if (isMath(s1) && isSport(s2)) return false;
            if (isSport(s1) && isMath(s2)) return false;
            if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) return true;
            if ((s1.includes("انكليز") && s2.includes("نجليز")) || (s2.includes("انكليز") && s1.includes("نجليز"))) return true;
            if (s1.includes("عرب") && s2.includes("عرب")) return true;
            if (s1.includes("اسلام") && (s2.includes("اسلام") || s2.includes("دين"))) return true;
            if (s2.includes("اسلام") && (s1.includes("islam") || s1.includes("دين") || s1.includes("اسلام"))) return true;
            if (s1.includes("حاسوب") && s2.includes("حاسب")) return true;
            if (s1.includes("كيمياء") && s2.includes("كيمياء")) return true;
            if (s1.includes("فيزياء") && s2.includes("فيزياء")) return true;
            if (s1.includes("احياء") && s2.includes("احياء")) return true;
            if (s1.includes("علوم") && s2.includes("علوم")) return true;
            if (s1.includes("اجتماع") && s2.includes("اجتماع")) return true;
            if (s1.includes("فني") && s2.includes("فني")) return true;
            if (isSport(s1) && isSport(s2)) return true;
            if (isMath(s1) && isMath(s2)) return true;
          }

          if (itemTitle) {
            const tNorm = normalizeSubject(itemTitle);
            if (isMath(tNorm) && isSport(s2)) return false;
            if (isSport(tNorm) && isMath(s2)) return false;
            if (tNorm.includes(s2)) return true;
            if (s2.includes("كيمياء") && tNorm.includes("كيمياء")) return true;
            if (s2.includes("فيزياء") && tNorm.includes("فيزياء")) return true;
            if (s2.includes("احياء") && tNorm.includes("احياء")) return true;
            if (s2.includes("علوم") && tNorm.includes("علوم")) return true;
            if (s2.includes("عرب") && tNorm.includes("عرب")) return true;
            if (s2.includes("نجليز") && (tNorm.includes("نجليز") || tNorm.includes("انكليز"))) return true;
            if (s2.includes("اسلام") && tNorm.includes("اسلام")) return true;
            if (s2.includes("اجتماع") && tNorm.includes("اجتماع")) return true;
            if (s2.includes("فني") && tNorm.includes("فني")) return true;
            if (isSport(s2) && isSport(tNorm)) return true;
            if (isMath(s2) && isMath(tNorm)) return true;
          }

          return false;
        };

        const activeStudentGrade = gradeName || grade || (userProfile as any)?.grade || "";

        const activeStudentSection = (userProfile as any)?.section || (userProfile as any)?.class_name || "";
        const normSection = activeStudentSection ? activeStudentSection.trim().toLowerCase() : "";
        const isSectionMatch = (docSection: string | undefined | null) => {
          if (!docSection || docSection.trim() === "" || docSection === "ALL" || docSection === "كافة الشُعب" || docSection === "all") return true;
          if (!normSection) return true;
          return docSection.trim().toLowerCase() === normSection;
        };

        const uncompletedHwCount = teacherAiResults.filter(r => {
          const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade);
          return r.tool === 'صناعة واجبات' && matchesGrade && !studentSubmissions.some(sub => sub.taskId === r.id && sub.type === 'homework');
        }).length;

        const uncompletedCompCount = teacherAiResults.filter(r => {
          const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade);
          return r.tool === 'مسابقات صفية' && matchesGrade && !studentSubmissions.some(sub => sub.taskId === r.id && sub.type === 'competition');
        }).length;

        const filteredDocs = schoolFiles.filter((doc) => {
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || String(doc.title || '').toLowerCase().includes(searchLower) || 
                                String(doc.name || '').toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(doc.subject, doc.title || doc.name);
          const matchesGrade = isGradeMatch(doc.grade, activeStudentGrade);
          const matchesSection = isSectionMatch((doc as any).section);
          return matchesSearch && matchesSubject && matchesGrade && matchesSection;
        });

        const filteredVideos = recordedLessons.filter((vid) => {
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || String(vid.title || '').toLowerCase().includes(searchLower) || 
                                String(vid.description || '').toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(vid.subject, vid.title || vid.description);
          const matchesGrade = isGradeMatch(vid.grade, activeStudentGrade);
          return matchesSearch && matchesSubject && matchesGrade;
        });

        const filteredQuestions = schoolQuestions.filter((q) => {
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || (String(q.text || '').toLowerCase().includes(searchLower) || false);
          const matchesSubject = isSubjectMatch(q.subject, q.text);
          const matchesGrade = isGradeMatch((q as any).grade, activeStudentGrade);
          return matchesSearch && matchesSubject && matchesGrade;
        });

        const filteredPapers = schoolExamPapers.filter((p) => {
          const paperTitle = p.title || "ورقة امتحانية";
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || String(paperTitle || '').toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(p.subject, paperTitle);
          const matchesYear = studentExamPaperYear === "الكل" || p.year === studentExamPaperYear;
          const matchesRole = studentExamPaperRole === "الكل" || p.role === studentExamPaperRole;
          const matchesGrade = isGradeMatch((p as any).grade, activeStudentGrade);
          return matchesSearch && matchesSubject && matchesYear && matchesRole && matchesGrade;
        });

        // شريط المواد: يطابق حصراً المواد المضبوطة للصف من قبل الإدارة في مواد المرحلة في شؤون الطلاب والدرجات
        const subjectsList = useMemo(() => {
          const list = ["الكل"];

          try {
            // استخراج المواد المحذوفة للطالب إن وجدت
            const myCode = ((userProfile as any)?.studentCode || (userProfile as any)?.code || "").toString().trim().toLowerCase();
            const studentList = (academicLists || []).find((l: any) => {
              if (Array.isArray(l.students)) {
                return l.students.some((st: any) => {
                  const c = (st.code || st.student || st.id || "").toString().trim().toLowerCase();
                  return c && myCode && c === myCode;
                });
              }
              return false;
            });
            const removedIds = studentList?.removedSubjects || [];

            const effectiveGrade = activeStudentGrade || (userProfile as any)?.grade || "";
            const gradeSubs = getSubjectsForGrade(effectiveGrade, removedIds, subjectMapping);
            if (Array.isArray(gradeSubs)) {
              gradeSubs.forEach((s: any) => {
                const name = typeof s === "string" ? s : s?.name || s?.title;
                if (name && typeof name === "string" && name.trim()) {
                  const cleanName = name.trim();
                  if (!list.includes(cleanName)) {
                    list.push(cleanName);
                  }
                }
              });
            }
          } catch (e) {
            console.error("Error loading grade subjects for student files:", e);
          }

          return list;
        }, [activeStudentGrade, userProfile, academicLists, subjectMapping]);

        // ضمان عدم بقاء فلتر مادة غير موجودة ضمن مواد الصف المضبوطة
        useEffect(() => {
          if (studentLibrarySubject && studentLibrarySubject !== "الكل") {
            const exists = subjectsList.some((s) => s === studentLibrarySubject || (s !== "الكل" && isSubjectMatch(s, studentLibrarySubject)));
            if (!exists) {
              setStudentLibrarySubject("الكل");
            }
          }
        }, [subjectsList, studentLibrarySubject, setStudentLibrarySubject]);

        return (
          <div className="h-full flex text-right relative" dir="rtl">
            {/* القائمة الجانبية للملفات */}
            <div
              className={`bg-[#0A1024]/95 backdrop-blur-md border-l border-white/5 flex flex-col pt-4 no-scrollbar overflow-y-auto shrink-0 shadow-[inset_1px_0_0_rgba(255,255,255,0.02)] transition-all duration-300 relative ${isFilesSidebarCollapsed ? "w-0 opacity-0 overflow-hidden border-l-0" : "w-20 lg:w-[86px]"}`}
            >
              {!isFilesSidebarCollapsed && (
                <button
                  onClick={() => setIsFilesSidebarCollapsed(true)}
                  className="absolute left-2 top-20 p-1.5 rounded-full bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-amber-400/50 text-amber-400 transition-all z-20 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)] border border-white/10"
                  title="طي الشريط الجانبي"
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              )}
              
              <div className="flex flex-col flex-1 justify-between pt-36 pb-8 min-h-[450px]">
                <button
                  onClick={() => setStudentLibraryTab("document")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    studentLibraryTab === "document"
                      ? "bg-[#050A18] text-amber-500 border-amber-500"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {studentLibraryTab === "document" && (
                    <div className="absolute inset-0 bg-amber-500/10 opacity-30" />
                  )}
                  <FileText 
                    size={studentLibraryTab === "document" ? 28 : 24} 
                    strokeWidth={studentLibraryTab === "document" ? 2.5 : 2}
                    className={`relative z-10 transition-transform ${studentLibraryTab === "document" ? "scale-110" : "group-hover:scale-105 group-hover:text-white/60"}`} 
                  />
                  <span className={`text-[9px] font-bold px-1 text-center relative z-10 ${studentLibraryTab === "document" ? "" : "group-hover:text-white/60"}`}>الملازم</span>
                </button>

                <button
                  onClick={() => setStudentLibraryTab("video")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    studentLibraryTab === "video"
                      ? "bg-[#050A18] text-[#00E5FF] border-[#00E5FF]"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {studentLibraryTab === "video" && (
                    <div className="absolute inset-0 bg-[#00E5FF]/10 opacity-30" />
                  )}
                  <Video 
                    size={studentLibraryTab === "video" ? 28 : 24} 
                    strokeWidth={studentLibraryTab === "video" ? 2.5 : 2}
                    className={`relative z-10 transition-transform ${studentLibraryTab === "video" ? "scale-110" : "group-hover:scale-105 group-hover:text-white/60"}`} 
                  />
                  <span className={`text-[9px] font-bold px-1 text-center relative z-10 ${studentLibraryTab === "video" ? "" : "group-hover:text-white/60"}`}>الفيديوهات</span>
                </button>
                
                <button
                  onClick={() => setStudentLibraryTab("question_bank")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    studentLibraryTab === "question_bank"
                      ? "bg-[#050A18] text-indigo-400 border-indigo-400"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {studentLibraryTab === "question_bank" && (
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-30" />
                  )}
                  <Search 
                    size={studentLibraryTab === "question_bank" ? 24 : 22} 
                    strokeWidth={studentLibraryTab === "question_bank" ? 2.5 : 2}
                    className={`relative z-10 transition-transform ${studentLibraryTab === "question_bank" ? "scale-110" : "group-hover:scale-105 group-hover:text-white/60"}`} 
                  />
                  <span className={`text-[9px] font-bold px-1 text-center relative z-10 ${studentLibraryTab === "question_bank" ? "" : "group-hover:text-white/60"}`}>بنك الأسئلة</span>
                </button>
                <button
                  onClick={() => setStudentLibraryTab("homework")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    highlightTasksSection
                      ? "ring-2 ring-[#00E5FF] shadow-[0_0_20px_#00E5FF] border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] animate-pulse"
                      : studentLibraryTab === "homework"
                      ? "bg-[#050A18] text-amber-400 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {studentLibraryTab === "homework" && (
                    <div className="absolute inset-0 bg-amber-500/10 opacity-30" />
                  )}
                  {uncompletedHwCount > 0 && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                      {uncompletedHwCount}
                    </div>
                  )}
                  <Edit2 
                    size={studentLibraryTab === "homework" ? 28 : 24} 
                    strokeWidth={studentLibraryTab === "homework" ? 2.5 : 2}
                    className={`relative z-10 transition-transform ${studentLibraryTab === "homework" ? "scale-110" : "group-hover:scale-105 group-hover:text-white/60"}`} 
                  />
                  <span className={`text-[9px] font-bold px-1 text-center relative z-10 ${studentLibraryTab === "homework" ? "" : "group-hover:text-white/60"}`}>الواجبات</span>
                </button>
                <button
                  onClick={() => setStudentLibraryTab("competitions")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    highlightTasksSection
                      ? "ring-2 ring-[#00E5FF] shadow-[0_0_20px_#00E5FF] border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] animate-pulse"
                      : studentLibraryTab === "competitions"
                      ? "bg-[#050A18] text-rose-400 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {studentLibraryTab === "competitions" && (
                    <div className="absolute inset-0 bg-rose-500/10 opacity-30" />
                  )}
                  {uncompletedCompCount > 0 && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                      {uncompletedCompCount}
                    </div>
                  )}
                  <Trophy 
                    size={studentLibraryTab === "competitions" ? 28 : 24} 
                    strokeWidth={studentLibraryTab === "competitions" ? 2.5 : 2}
                    className={`relative z-10 transition-transform ${studentLibraryTab === "competitions" ? "scale-110" : "group-hover:scale-105 group-hover:text-white/60"}`} 
                  />
                  <span className={`text-[9px] font-bold px-1 text-center relative z-10 ${studentLibraryTab === "competitions" ? "" : "group-hover:text-white/60"}`}>مسابقات</span>
                </button>
              </div>
            </div>

            {isFilesSidebarCollapsed && (
              <button
                onClick={() => setIsFilesSidebarCollapsed(false)}
                className="absolute right-3 top-[120px] z-50 p-2.5 bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-amber-400/50 text-amber-400 transition-all rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-white/10 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                title="إظهار الشريط الجانبي"
              >
                <ChevronLeft size={16} strokeWidth={3} />
              </button>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto no-scrollbar space-y-6 min-w-0">
              <GlobalAnnouncementsPopup dashboardType={userProfile?.role === 'admin' ? 'admin' : isTeacher ? 'teacher' : userProfile?.role === 'parent' ? 'parent' : userProfile?.role === 'driver' ? 'driver' : 'student'} schoolId={resolvedSchoolId} />
              {/* Header banner */}
              <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-6">
                {/* Background elegant pattern and overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
                <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Bairaq Video Companion on the LEFT side - Spans from edge to edge (height 100%) */}
                <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
                  {/* Decorative neon golden-phosphor circular glow frame in background */}
                  <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
                  <BerqCharacter
                    key={studentLibraryTab}
                    pose={
                      studentLibraryTab === "document"
                        ? "pose_academic_scholar"
                        : studentLibraryTab === "video"
                        ? "pose_live_announcer"
                        : studentLibraryTab === "question_bank"
                        ? "pose_questions_bank"
                        : studentLibraryTab === "homework"
                        ? "pose_homework_master"
                        : studentLibraryTab === "competitions"
                        ? "pose_champion_laureate"
                        : "pose_radar_navigator"
                    }
                    glowColor="gold"
                    className="w-full h-full object-cover relative z-10 scale-110"
                  />
                  {/* Subtle gradient overlay to blend the right edge smoothly into the blue background */}
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3 w-full pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none h-full min-w-0">
                  {/* Title, School & Tab in 3 neat lines */}
                  <div className="flex flex-col text-right min-w-0 justify-center">
                    <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
                      المكتبة الرقمية 📚
                    </h2>
                    <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                      <span className="shrink-0 text-xs">🏛️</span>
                      <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                      <span className="shrink-0 text-[10px]">📖</span>
                      <span className="truncate">
                        {studentLibraryTab === "document" 
                          ? "الملازم والملخصات"
                          : studentLibraryTab === "video"
                          ? "الشروحات المرئية"
                          : studentLibraryTab === "homework"
                          ? "الواجبات البيتية"
                          : studentLibraryTab === "competitions"
                          ? "التحديات والمسابقات"
                          : "الأسئلة الذكية"} {gradeName ? `• ${gradeName}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Search Bar on the left/central of container */}
                  <div className="relative w-full md:w-56 lg:w-64 shrink-0">
                    <input
                      type="text"
                      value={studentLibrarySearch}
                      onChange={(e) => setStudentLibrarySearch(e.target.value)}
                      placeholder={
                        studentLibraryTab === "document" 
                          ? "ابحث عن ملزمة أو ملخص..."
                          : studentLibraryTab === "video"
                          ? "ابحث عن فيديو أو درس..."
                          : studentLibraryTab === "homework"
                          ? "ابحث عن واجب..."
                          : studentLibraryTab === "competitions"
                          ? "ابحث عن مسابقة..."
                          : "ابحث عن سؤال..."
                      }
                      className="w-full bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#FFD600] focus:border-transparent transition-all font-sans font-semibold text-right shadow-inner"
                      dir="rtl"
                    />
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
              </div>

              {/* Subject Badges */}
              <div className="border-b border-white/5 pb-4">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {subjectsList.map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setStudentLibrarySubject(subj)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-xl transition-all whitespace-nowrap border shrink-0 cursor-pointer ${
                        studentLibrarySubject === subj
                          ? "bg-white/10 text-white border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                          : "bg-transparent text-white/40 border-transparent hover:text-white/80"
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Library List Display */}
            {studentLibraryTab === "document" ? (
              filteredDocs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-amber-500/5 flex items-center justify-center border border-amber-500/10 mb-4">
                    <FileText size={36} className="text-amber-500/30" />
                  </div>
                  <h3 className="text-sm font-black text-white/80">لم نجد أي ملازم أو ملخصات تطابق بحثك</h3>
                  <p className="text-white/40 text-[10px] mt-1 max-w-xs leading-relaxed font-bold">
                    ترقب قريباً نشر كبار الأساتذة للملازم والملخصات الذهبية للوحدات الدراسية.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocs.map((docItem, idx) => {
                    const formattedDate = docItem.publishDate || "2026/06/20";
                    return (
                      <motion.div
                        key={`doc_${docItem.id || 'idx'}_${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative rounded-2xl border border-white/5 bg-[#0A0F24]/60 hover:bg-[#0E1535]/80 p-5 transition-all flex flex-col justify-between hover:border-amber-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] overflow-hidden"
                      >
                        {/* Decorative background light */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full group-hover:bg-amber-500/10 transition-colors" />

                        <div className="space-y-3 relative z-10">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/15 flex items-center gap-1">
                              <span>{docItem.tag || "ملخص ذهبي"}</span>
                              <span className="text-white/40">•</span>
                              <span className="text-emerald-400">عالي الجودة 🌟</span>
                            </span>
                            <span className="text-[10px] text-white/40 font-bold">
                              {docItem.subject}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center text-red-500 font-mono shrink-0">
                              <span className="text-xs font-black leading-none">PDF</span>
                              <span className="text-[7px] text-red-400/60 mt-0.5 uppercase font-bold">HIGH-RES</span>
                            </div>
                            <div className="space-y-1 text-right flex-1">
                              <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors leading-snug">
                                {docItem.title || docItem.name || 'بدون عنوان'}
                              </h4>
                              
                              {/* Publication date and file sizes */}
                              <div className="text-[9px] text-white/40 flex items-center gap-1.5 font-sans mt-0.5">
                                <span>📅 {formattedDate}</span>
                                <span>•</span>
                                <span>💾 {docItem.size || "4.2 MB"}</span>
                              </div>

                              {/* Interactive Knights' Rating (تقييم الفرسان) */}
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[9px] text-amber-400 font-bold ml-1.5">
                                  {((userRatings[docItem.id] ? (docItem.rating || 4.8) : (docItem.rating || 4.8))).toFixed(1)} ⭐
                                </span>
                                {[1, 2, 3, 4, 5].map((starVal) => {
                                  const activeRating = userRatings[docItem.id] || Math.round(docItem.rating || 4.8);
                                  return (
                                    <button
                                      key={starVal}
                                      onClick={() => {
                                        const updated = { ...userRatings, [docItem.id]: starVal };
                                        setUserRatings(updated);
                                        try {
                                          localStorage.setItem("s6_library_ratings", JSON.stringify(updated));
                                        } catch (e) {}
                                        sounds.playSuccess();
                                        showToast(`شكرًا لتقييمك! تم تسجيل تصويتك لفرسان ${grade || "الصف"} ⭐`, "success");
                                      }}
                                      className={`text-xs hover:scale-125 transition-transform ${
                                        starVal <= activeRating ? 'text-amber-400' : 'text-white/20'
                                      }`}
                                    >
                                      ★
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Extra info counters */}
                          <div className="grid grid-cols-2 gap-2 bg-[#060A1A]/60 p-2 rounded-xl border border-white/5 text-[9px] font-sans text-white/50">
                            <div className="text-center">
                              <span className="block text-white/30">عمليات التنزيل</span>
                              <span className="font-bold text-amber-400 font-mono text-[10px]">{docItem.downloads || 0} عملية</span>
                            </div>
                            <div className="text-center border-r border-white/5">
                              <span className="block text-white/30">حالة الورقة</span>
                              <span className="font-bold text-emerald-400">جاهزة للقراءة 📖</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                          <button
                            onClick={() => {
                              sounds.playClick();
                              if (docItem?.fileUrl) {
                                safeStorage.setItem("s6_last_read_file_name", docItem.title || docItem.name || "ملف دراسي");
                                setPreviewingFile(docItem);
                                setPdfLoadError(false);
                              } else {
                                showToast("رابط الملف غير متاح", "error");
                              }
                            }}
                            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
                          >
                            <BookOpen size={14} />
                            فتح الملف والقراءة
                          </button>
                          
                          <button
                            onClick={() => {
                              setActiveRadarFile(docItem);
                              showToast("جاري توجيه رادار الذكاء الاصطناعي لفحص الملزمة وتوليد الامتحان الشامل... 📡", "info");
                            }}
                            className="px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 border border-blue-500/20 cursor-pointer"
                            title="إطلاق رادار الامتحان الشامل"
                          >
                            <HelpCircle size={12} />
                            <span>رادار الذكاء</span>
                          </button>

                          {(isTeacher || userProfile?.role === 'admin' || userProfile?.isAdmin) && (
                            <button
                              onClick={async () => {
                                try {
                                  await fetch(`/api/school-files/${docItem.id}`, { method: "DELETE" });
                                  showToast("تم حذف وإلغاء نشر الملف بنجاح!", "success");
                                } catch (err) {
                                  showToast("خطأ أثناء الحذف", "error");
                                }
                              }}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
                              title="حذف الملف نهائياً من المكتبة"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : studentLibraryTab === "video" ? (
              filteredVideos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center bg-[#070D22]/60 rounded-3xl border border-[#00E5FF]/20 p-8 shadow-[0_0_30px_rgba(0,229,255,0.1)] relative overflow-hidden my-4"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                    <BerqCharacter 
                      pose="pose_live_announcer" 
                      glowColor="cyan" 
                      className="w-full h-full" 
                    />
                  </div>
                  <h3 className="text-base font-black text-white">استوديو بيرق للشروحات المرئية 📺</h3>
                  <p className="text-cyan-300/70 text-xs mt-1.5 max-w-sm leading-relaxed font-bold">
                    بيرق المذيع الذكي بانتظار رفع كبار الأساتذة للمحاضرات المرئية والشروحات المفصلة لصفوف {grade || "الطلبة"}!
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideos.map((vidItem, idx) => (
                    <motion.div
                      key={`vid_${vidItem.id || 'idx'}_${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative rounded-xl border border-white/5 bg-[#0E152D]/40 hover:bg-[#0E152D]/70 p-4 transition-all flex flex-col justify-between hover:border-[#00E5FF]/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                    >
                      <div className="space-y-3">
                        {/* Thumbnail overlay container */}
                        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/60 border border-white/5 relative flex items-center justify-center group-hover:border-[#00E5FF]/10 transition-all">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                          <Play size={24} className="text-white/60 group-hover:text-[#00E5FF] group-hover:scale-110 transition-all z-20" fill="currentColor" />
                          
                          <span className="absolute bottom-2 left-2 text-[8px] font-bold font-mono text-white/80 bg-black/70 px-1.5 py-0.5 rounded z-20">
                            {vidItem.duration}
                          </span>
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                            <span className="text-[8px] font-black text-[#00E5FF] bg-black/70 px-2 py-0.5 rounded-md border border-[#00E5FF]/30 backdrop-blur-md">
                              {vidItem.subject}
                            </span>
                            {(vidItem.grade || grade) && (
                              <span className="text-[8px] font-black text-amber-300 bg-black/70 px-2 py-0.5 rounded-md border border-amber-400/30 backdrop-blur-md shadow-sm">
                                {vidItem.grade || grade}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 text-right">
                          <h4 className="text-[11px] font-black text-white/95 group-hover:text-[#00E5FF] transition-colors leading-snug">
                            {vidItem.title}
                          </h4>
                          <p className="text-[9px] text-white/50 leading-relaxed font-bold line-clamp-2">
                            {formatLectureDescription(vidItem.description, vidItem.grade || grade)}
                          </p>
                        </div>
                      </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 gap-2 flex-wrap">
                          <div className="flex flex-col gap-0.5 text-right shrink-0">
                            <span className="text-[8px] text-amber-300 font-bold flex items-center gap-1">
                              <span className="text-[#00E5FF]">الصف:</span> {vidItem.grade || grade || "الصف المقرر"}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] text-white/30 font-bold font-mono">
                                تم النشر: {vidItem.date}
                              </span>
                              <span className="text-[8px] text-white/30 font-bold font-mono flex items-center gap-1">
                                <Eye size={10} className="text-[#00E5FF]/60" /> {vidItem.views || 0} مشاهدة
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setStudentLibraryTab("document");
                                setStudentLibrarySubject(vidItem.subject);
                                showToast(`تم الانتقال لملزمة ${vidItem.subject} 📚`, "info");
                              }}
                              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/20 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              title="عرض ملزمة المادة المرفوعة"
                            >
                              <BookOpen size={12} />
                              <span>ملزمة المادة</span>
                            </button>

                            <button
                              onClick={() => {
                                setViewingRecordedLesson(vidItem);
                              }}
                              className="px-3 py-1.5 bg-[#00E5FF] hover:bg-[#33ebff] text-black text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.05)]"
                            >
                              مشاهدة المحاضرة الآن 🎥
                            </button>
                          </div>
                        </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : studentLibraryTab === "question_bank" ? (
              <div className="flex flex-col h-full">
                <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
                  <button 
                    onClick={() => setStudentQuestionBankTab('questions')}
                    className={`font-bold pb-2 px-2 transition-all border-b-2 ${studentQuestionBankTab === 'questions' ? 'text-indigo-400 border-indigo-400' : 'text-white/40 border-transparent hover:text-white'}`}
                  >
                    الأسئلة المفردة
                  </button>
                  <button 
                    onClick={() => setStudentQuestionBankTab('papers')}
                    className={`font-bold pb-2 px-2 transition-all border-b-2 ${studentQuestionBankTab === 'papers' ? 'text-fuchsia-400 border-fuchsia-400' : 'text-white/40 border-transparent hover:text-white'}`}
                  >
                    الأوراق الامتحانية
                  </button>
                </div>

                {studentQuestionBankTab === 'papers' && (
                  <div className="flex flex-wrap items-center gap-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/10 shrink-0">
                    <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1.5 border border-white/10 shrink-0">
                      <Filter size={14} className="text-white/40" />
                      <select
                        value={studentExamPaperYear}
                        onChange={(e) => setStudentExamPaperYear(e.target.value)}
                        className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="الكل" className="bg-[#05060F] text-white">كل السنوات</option>
                        {Array.from({length: 2026 - 2010 + 1}, (_, i) => 2026 - i).map(year => (
                          <option key={year} value={year.toString()} className="bg-[#05060F] text-white">{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1.5 border border-white/10 shrink-0">
                      <Filter size={14} className="text-white/40" />
                      <select
                        value={studentExamPaperRole}
                        onChange={(e) => setStudentExamPaperRole(e.target.value)}
                        className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="الكل" className="bg-[#05060F] text-white">كل الأدوار</option>
                        {['الدور الأول', 'الدور الثاني', 'الدور الثالث', 'تمهيدي', 'خارجي', 'شهري', 'فصلي', 'اخر السنة', 'اخرى'].map(role => (
                          <option key={role} value={role} className="bg-[#05060F] text-white">{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {studentQuestionBankTab === 'questions' ? (
                  filteredQuestions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                        <BerqCharacter 
                          pose="pose_questions_bank" 
                          glowColor="cyan" 
                          className="w-full h-full" 
                        />
                      </div>
                      <h3 className="text-xl font-black text-white/70 mb-3">لا توجد أسئلة متوفرة</h3>
                      <p className="text-sm font-bold text-white/30 max-w-sm leading-relaxed">
                        لم يقم الأساتذة بإضافة أسئلة لهذه المادة بعد.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredQuestions.map((q, idx) => (
                        <motion.div
                          key={`q_${q.id || 'idx'}_${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative rounded-xl border border-white/5 bg-[#0E152D]/40 hover:bg-[#0E152D]/70 p-4 transition-all flex flex-col justify-between hover:border-indigo-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
                        >
                          <div className="mb-4">
                            <div className="flex justify-between items-start mb-3">
                              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 truncate max-w-[120px]">
                                {q.subject || "مادة عامة"}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                q.difficulty === 'hard' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                q.difficulty === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              }`}>
                                {q.difficulty === 'hard' ? 'صعب' : q.difficulty === 'medium' ? 'متوسط' : 'سهل'}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {q.tags?.map((tag: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <h4 className="text-white font-bold text-sm leading-relaxed line-clamp-3 group-hover:text-indigo-300 transition-colors">
                              {q.text}
                            </h4>
                          </div>
                          
                          {q.options && q.options.length > 0 && (
                            <div className="mt-3 space-y-2 mb-4">
                              <p className="text-[10px] text-white/40 mb-1">الخيارات:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt: string, i: number) => (
                                  <div key={i} className="text-[10px] font-bold text-white/60 bg-black/20 p-2 rounded border border-white/5 line-clamp-1">
                                    {opt}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => setSelectedAIQuestion(q)}
                            className="relative z-10 w-full mt-auto py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-black rounded-xl border border-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center justify-center gap-2"
                          >
                            <Sparkles size={14} className="text-amber-400" />
                            المساعد الذكي
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )
                ) : (
                  filteredPapers.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                        <BerqCharacter 
                          pose="pose_radar_navigator" 
                          glowColor="purple" 
                          className="w-full h-full" 
                        />
                      </div>
                      <h3 className="text-xl font-black text-white/70 mb-3">لا توجد أوراق امتحانية</h3>
                      <p className="text-sm font-bold text-white/30 max-w-sm leading-relaxed">
                        لم يتم إضافة أي أوراق امتحانية تطابق الفلتر الحالي.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {filteredPapers.map((paper, idx) => (
                        <motion.div
                          key={`paper_${paper.id || 'idx'}_${idx}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full flex flex-col group relative rounded-2xl border border-white/5 bg-[#0A1024]/60 overflow-hidden hover:bg-[#0f1730]/80 transition-all p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(217,70,239,0.1)] hover:border-fuchsia-500/30"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="flex gap-2">
                              <span className="px-4 py-1.5 rounded-xl text-sm font-black bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-lg backdrop-blur-md">
                                {paper.year}
                              </span>
                              <span className="px-4 py-1.5 rounded-xl text-sm font-black bg-white/10 text-white border border-white/10 shadow-lg backdrop-blur-md">
                                {paper.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-bold text-white/60">
                              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                <BookOpen size={14} className="text-fuchsia-400" />
                                {paper.subject || "الكل"}
                              </span>
                              
                              {paper.date && (
                                <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                  <Calendar size={14} />
                                  {paper.date}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="relative z-10">
                            {paper.imageUrl ? (
                              <div 
                                className="w-full h-32 md:h-48 rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-fuchsia-500/50 transition-all relative shadow-inner"
                                onClick={() => {
                                  window.open(paper.imageUrl, '_blank');
                                }}
                              >
                                <img src={paper.imageUrl} alt={paper.title || "ورقة امتحانية"} className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end justify-center pb-4 opacity-90 group-hover:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-2 text-white bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold border border-white/10 shadow-lg group-hover:bg-fuchsia-500/20 group-hover:text-fuchsia-300 group-hover:border-fuchsia-500/30 transition-all">
                                    <Scan size={16} />
                                    <span>تكبير الصورة لعرض الورقة كاملة</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-32 md:h-48 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-white/20">
                                <BookOpen size={32} className="mb-2 opacity-50" />
                                <span className="text-sm font-bold">لا توجد صورة</span>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPaperForExtraction(paper);
                            }}
                            className="relative z-10 w-full mt-4 py-2.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-300 hover:text-fuchsia-200 text-sm font-black rounded-xl border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all flex items-center justify-center gap-2"
                          >
                            <Sparkles size={16} className="text-amber-400" />
                            الاستخراج الذكي للأسئلة
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ) : studentLibraryTab === "homework" ? (
              <div className={`flex flex-col h-full gap-4 relative transition-all rounded-3xl ${highlightTasksSection ? "border-2 border-[#00E5FF] shadow-[0_0_35px_rgba(0,229,255,0.6)] p-4 bg-[#00E5FF]/5 animate-pulse" : ""}`}>
                {highlightTasksSection && (
                  <div className="flex items-center justify-between bg-[#00E5FF]/10 border border-[#00E5FF]/40 rounded-2xl px-4 py-2.5 mb-2">
                    <span className="text-[#00E5FF] font-black text-xs flex items-center gap-2">
                      <Zap size={16} className="animate-bounce" />
                      ⚡ قسم الواجبات والمسابقات الصفية (محدد بإطار نيون)
                    </span>
                    {onClearHighlightTasks && (
                      <button 
                        onClick={onClearHighlightTasks}
                        className="text-[10px] font-bold text-white/70 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg"
                      >
                        إلغاء التحديد
                      </button>
                    )}
                  </div>
                )}
                {(() => {
                  const isSubjectMatch = (dbSubject: string, filterSubject: string) => {
                    if (filterSubject === "الكل") return true;
                    const s1 = (dbSubject || "").replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase().trim();
                    const s2 = (filterSubject || '').replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase().trim();
                    if (!s1 || !s2) return false;
                    if (s1.includes(s2) || s2.includes(s1)) return true;
                    if (s2 === "اللغه الانجليزيه" && (s1.includes("انكليزي") || s1.includes("انجليزي") || s1.includes("english"))) return true;
                    if (s2 === "اللغه العربيه" && (s1.includes("عربي"))) return true;
                    if (s2 === "التربيه الاسلاميه" && (s1.includes("اسلامي") || s1.includes("قران") || s1.includes("دين"))) return true;
                    return false;
                  };

                  const homeworks = teacherAiResults.filter(r => {
                    const rGradeNorm = mapGradeForDocument(r.targetGrade || "");
                    const studentGradeNorm = mapGradeForDocument(grade || gradeName || "");
                    const matchesGrade = !r.targetGrade || r.targetGrade === "الكل" || rGradeNorm === studentGradeNorm;
                    return r.tool === 'صناعة واجبات' && 
                      matchesGrade &&
                      (isSubjectMatch(r.subject, studentLibrarySubject) || (r.name && r.name.includes(studentLibrarySubject)) || (r.content && r.content.includes(studentLibrarySubject))) && 
                      (studentLibrarySearch.trim() === "" || (r.name && r.name.includes(studentLibrarySearch)) || (r.content && r.content.includes(studentLibrarySearch)));
                  });
                  return homeworks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center bg-[#0C122C]/60 rounded-3xl border border-amber-500/20 p-8 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden my-4"
                    >
                      <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                        <BerqCharacter 
                          pose="pose_homework_master" 
                          glowColor="gold" 
                          className="w-full h-full" 
                        />
                      </div>
                      <h3 className="text-base font-black text-white">منصة متابعة الواجبات والتمارين 📝</h3>
                      <p className="text-amber-300/70 text-xs mt-1.5 max-w-sm leading-relaxed font-bold">
                        بيرق خبير الواجبات أتم مراجعة كافة الواجبات، لا توجد بواقي حالياً! ترقب الواجبات القادمة من معلميك.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {homeworks.map((hw, idx) => (
                        <div key={`hw_${hw.id || 'idx'}_${idx}`} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col hover:border-amber-500/30 transition-all group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/10 rounded-xl">
                              <Edit2 size={20} className="text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{hw.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-white/40">{new Date(hw.date).toLocaleDateString('ar-SA')}</span>
                                {studentLibrarySubject === "الكل" && hw.subject && hw.subject !== "عام" && (
                                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-md font-bold truncate max-w-[100px]">
                                    {hw.subject}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-white/70 line-clamp-4 leading-relaxed whitespace-pre-wrap flex-1 mb-4">
                            {hw.content}
                          </div>
                          {(() => {
                            const submission = studentSubmissions.find(sub => sub.taskId === hw.id && sub.type === 'homework');
                            return submission ? (
                              <button
                                onClick={() => setViewingSubmissionFeedback(submission)}
                                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs text-center border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <CheckCircle size={14} /> عرض التقييم
                              </button>
                            ) : (
                              <button 
                                onClick={() => { setViewingHomework(hw); setHomeworkAnswer(''); }}
                                className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                              >
                                فتح الواجب
                              </button>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : studentLibraryTab === "competitions" ? (
              <div className={`flex flex-col h-full gap-4 relative transition-all rounded-3xl ${highlightTasksSection ? "border-2 border-[#00E5FF] shadow-[0_0_35px_rgba(0,229,255,0.6)] p-4 bg-[#00E5FF]/5 animate-pulse" : ""}`}>
                {highlightTasksSection && (
                  <div className="flex items-center justify-between bg-[#00E5FF]/10 border border-[#00E5FF]/40 rounded-2xl px-4 py-2.5 mb-2">
                    <span className="text-[#00E5FF] font-black text-xs flex items-center gap-2">
                      <Zap size={16} className="animate-bounce" />
                      ⚡ قسم الواجبات والمسابقات الصفية (محدد بإطار نيون)
                    </span>
                    {onClearHighlightTasks && (
                      <button 
                        onClick={onClearHighlightTasks}
                        className="text-[10px] font-bold text-white/70 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg"
                      >
                        إلغاء التحديد
                      </button>
                    )}
                  </div>
                )}
                {(() => {
                  const competitions = teacherAiResults.filter(r => {
                    const rGradeNorm = mapGradeForDocument(r.targetGrade || "");
                    const studentGradeNorm = mapGradeForDocument(grade || gradeName || "");
                    const matchesGrade = !r.targetGrade || r.targetGrade === "الكل" || rGradeNorm === studentGradeNorm;
                    return r.tool === 'مسابقات صفية' && 
                      matchesGrade &&
                      (isSubjectMatch(r.subject || "") || (r.name && r.name.includes(studentLibrarySubject)) || (r.content && r.content.includes(studentLibrarySubject))) && 
                      (studentLibrarySearch.trim() === "" || (r.name && r.name.includes(studentLibrarySearch)) || (r.content && r.content.includes(studentLibrarySearch)));
                  });
                  return competitions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center bg-[#180A18]/60 rounded-3xl border border-rose-500/20 p-8 shadow-[0_0_30px_rgba(244,63,94,0.1)] relative overflow-hidden my-4"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                      <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                        <BerqCharacter 
                          pose="pose_champion_laureate" 
                          glowColor="gold" 
                          className="w-full h-full" 
                        />
                      </div>
                      <h3 className="text-base font-black text-white">حلبة التحديات والمسابقات 🏆</h3>
                      <p className="text-rose-300/70 text-xs mt-1.5 max-w-sm leading-relaxed font-bold">
                        بيرق حامل الكأس والأنواط بانتظار إطلاق كبار الأساتذة للتحديات والمسابقات القادمة! استعد للمواجهة.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {competitions.map((comp, idx) => (
                        <div key={`comp_${comp.id || 'idx'}_${idx}`} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col hover:border-rose-500/30 transition-all group">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-rose-500/10 rounded-xl">
                              <Trophy size={20} className="text-rose-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{comp.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-white/40">{new Date(comp.date).toLocaleDateString('ar-SA')}</span>
                                {studentLibrarySubject === "الكل" && comp.subject && comp.subject !== "عام" && (
                                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded-md font-bold truncate max-w-[100px]">
                                    {comp.subject}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-white/70 line-clamp-4 leading-relaxed whitespace-pre-wrap flex-1 mb-4">
                            {(() => {
                              try {
                                const jsonMatch = comp.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                                const parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : comp.content);
                                if (parsed && parsed.questions) {
                                  return (
                                    <div className="flex flex-col gap-1.5 text-rose-200/80">
                                      <p className="font-bold text-white mb-1">📋 تفاصيل المسابقة:</p>
                                      <p>• العنوان: {parsed.title || comp.name}</p>
                                      <p>• عدد الأسئلة: {parsed.questions.length} أسئلة</p>
                                      <p>• الوقت المتاح: دقيقة واحدة</p>
                                    </div>
                                  );
                                }
                              } catch(e) {}
                              return comp.content;
                            })()}
                          </div>
                          {(() => {
                            const submission = studentSubmissions.find(sub => sub.taskId === comp.id && sub.type === 'competition');
                            return submission ? (
                              <button
                                onClick={() => setViewingSubmissionFeedback(submission)}
                                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl text-xs text-center border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <CheckCircle size={14} /> عرض التقييم والنتيجة
                              </button>
                            ) : (
                              <button 
                                onClick={() => { setViewingCompetition(comp); setCompetitionAnswers({}); setCompetitionScore(null); setCompetitionTimer(60); }}
                                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl transition-colors text-xs cursor-pointer"
                              >
                                بدء المسابقة
                              </button>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : null}
            </div>
          </div>
        );
};
