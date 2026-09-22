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
  Minimize2, Scan, XCircle, MessageSquare, Copy, Check, ExternalLink
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
  downloadDocumentFile,
} from "./utils";
import type { Teacher, MaterialField, Post, SchoolPlatformProps, PlatformTab, HandRaiseRequest, LiveQuestion } from "./types";
import { useSchoolPlatform } from "./SchoolPlatformContext";

export const StudentFilesTab: React.FC<{ disabledModules?: string[], rolePrefix?: string }> = ({ 
  disabledModules: propsDisabledModules, 
  rolePrefix: propsRolePrefix 
}) => {
  const context = useSchoolPlatform();
  const { 
    academicLists, grade, gradeName, highlightTasksSection, isFilesSidebarCollapsed, isTeacher, 
    mapGradeForDocument, onClearHighlightTasks, recordedLessons, resolvedSchoolId, schoolExamPapers, 
    schoolFiles, schoolId, schoolName, schoolQuestions, setActiveRadarFile, setCompetitionAnswers, 
    setCompetitionScore, setCompetitionTimer, setHomeworkAnswer, setIsFilesSidebarCollapsed, 
    setPdfLoadError, setPreviewingFile, setSelectedAIQuestion, setSelectedPaperForExtraction, 
    setStudentExamPaperRole, setStudentExamPaperYear, setStudentLibrarySearch, setStudentLibrarySubject, 
    setStudentLibraryTab, setStudentQuestionBankTab, setUserRatings, setViewingCompetition, 
    setViewingHomework, setViewingRecordedLesson, setViewingSubmissionFeedback, showToast, 
    studentExamPaperRole, studentExamPaperYear, studentLibrarySearch, studentLibrarySubject, 
    studentLibraryTab, studentQuestionBankTab, studentSubmissions, subjectMapping, teacherAiResults, 
    userProfile, userRatings 
  } = context;

  const disabledModules = propsDisabledModules || context.disabledModules || [];
  const rolePrefix = propsRolePrefix || context.rolePrefix || 'student';

  const checkLocked = (id: string) => disabledModules.includes(`${rolePrefix}:${id}`);

  const [selectedQuestionCategory, setSelectedQuestionCategory] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [viewingPaperImage, setViewingPaperImage] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const isGradeMatch = (docGrade?: string, targetStudentGrade?: string, targetSections?: string[]): boolean => {
    if (!targetStudentGrade) return true;
    const sClean = String(targetStudentGrade).trim();
    const sLower = sClean.toLowerCase();
    if (!sClean || sClean === "الكل" || sClean === "عام" || sClean === "جميع المراحل" || sLower === "all" || sClean === "*") return true;

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

    const sNorm = normalizeArabicText(sClean);

    // 1. Check targetSections if provided (array of classes/sections assigned by teacher)
    if (Array.isArray(targetSections) && targetSections.length > 0) {
      const sectionMatched = targetSections.some(sec => {
        if (!sec) return false;
        const secStr = String(sec).trim();
        const secLower = secStr.toLowerCase();
        if (secStr === "الكل" || secStr === "عام" || secStr === "جميع المراحل" || secStr === "كافة الشُعب" || secLower === "all" || secStr === "*") return true;
        if (secStr === sClean) return true;
        const secNorm = normalizeArabicText(secStr);
        if (secNorm === sNorm || secNorm.includes(sNorm) || sNorm.includes(secNorm)) return true;
        for (const g of grades) {
          const secMatches = g.keys.some(k => secNorm.includes(k));
          const sMatches = g.keys.some(k => sNorm.includes(k));
          if (secMatches && sMatches) return true;
        }
        return false;
      });
      if (sectionMatched) return true;
    }

    // 2. Check docGrade
    if (!docGrade) return true;
    const dClean = String(docGrade).trim();
    const dLower = dClean.toLowerCase();
    if (!dClean || dClean === "الكل" || dClean === "عام" || dClean === "جميع المراحل" || dClean === "كافة الشُعب" || dLower === "all" || dClean === "*") return true;
    if (dClean === sClean) return true;

    const dMapped = mapGradeForDocument(dClean);
    const sMapped = mapGradeForDocument(sClean);
    if (dMapped && sMapped && (dMapped === sMapped || dMapped === "الكل" || sMapped === "الكل")) return true;

    const dNorm = normalizeArabicText(dClean);
    if (dNorm === sNorm || dNorm.includes(sNorm) || sNorm.includes(dNorm)) return true;

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
        const isSectionMatch = (docSection?: string | null, targetSections?: string[]) => {
          if (Array.isArray(targetSections) && targetSections.length > 0) {
            const hasAll = targetSections.some(s => !s || s === "ALL" || s === "كافة الشُعب" || s === "all" || s === "الكل");
            if (hasAll) return true;
            if (!normSection) return true;
            return targetSections.some(s => {
              const sNorm = String(s || '').trim().toLowerCase();
              return sNorm === normSection || sNorm.includes(normSection) || normSection.includes(sNorm);
            });
          }
          if (!docSection || docSection.trim() === "" || docSection === "ALL" || docSection === "كافة الشُعب" || docSection === "all" || docSection === "الكل") return true;
          if (!normSection) return true;
          const dNorm = docSection.trim().toLowerCase();
          return dNorm === normSection || dNorm.includes(normSection) || normSection.includes(dNorm);
        };

        const isHomeworkItem = (r: any) => {
          const tool = String(r.tool || '').trim();
          const type = String(r.type || '').trim();
          const toolId = String(r.toolId || '').trim();
          return tool === 'صناعة واجبات' || 
                 tool === 'صناعة واجبات بيتية' || 
                 tool === 'واجبات' || 
                 tool === 'الواجبات' || 
                 tool === 'واجب بيتي' || 
                 type === 'homework' || 
                 toolId === 'homework' || 
                 r.category === 'homework';
        };

        const isCompetitionItem = (r: any) => {
          const tool = String(r.tool || '').trim();
          const type = String(r.type || '').trim();
          const toolId = String(r.toolId || '').trim();
          return tool === 'مسابقات صفية' || 
                 tool === 'مسابقات' || 
                 tool === 'المسابقات' || 
                 tool === 'تحديات ومسابقات' || 
                 type === 'competition' || 
                 toolId === 'competitions' || 
                 r.category === 'competition';
        };

        const uncompletedHwCount = teacherAiResults.filter(r => {
          const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
          const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
          const matchesSection = isSectionMatch(r.section, r.targetSections);
          return isHomeworkItem(r) && matchesGrade && matchesSection && !studentSubmissions.some(sub => sub.taskId === r.id && sub.type === 'homework');
        }).length;

        const uncompletedCompCount = teacherAiResults.filter(r => {
          const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
          const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
          const matchesSection = isSectionMatch(r.section, r.targetSections);
          return isCompetitionItem(r) && matchesGrade && matchesSection && !studentSubmissions.some(sub => sub.taskId === r.id && sub.type === 'competition');
        }).length;

        const filteredDocs = schoolFiles.filter((doc) => {
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || String(doc.title || '').toLowerCase().includes(searchLower) || 
                                String(doc.name || '').toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(doc.subject, doc.title || doc.name);
          const matchesGrade = isGradeMatch(doc.grade, activeStudentGrade, (doc as any).targetSections);
          const matchesSection = isSectionMatch((doc as any).section, (doc as any).targetSections);
          return matchesSearch && matchesSubject && matchesGrade && matchesSection;
        });

        const filteredVideos = recordedLessons.filter((vid) => {
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || String(vid.title || '').toLowerCase().includes(searchLower) || 
                                String(vid.description || '').toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(vid.subject, vid.title || vid.description);
          const matchesGrade = isGradeMatch(vid.grade, activeStudentGrade, (vid as any).targetSections);
          const matchesSection = isSectionMatch((vid as any).section, (vid as any).targetSections);
          return matchesSearch && matchesSubject && matchesGrade && matchesSection;
        });

        const filteredQuestions = schoolQuestions.filter((q) => {
          const qText = String(q.text || q.question || '').trim();
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || qText.toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(q.subject, qText);
          const qGrade = (q as any).grade || (q as any).targetGrade;
          const qSections = Array.isArray((q as any).targetSections)
            ? (q as any).targetSections
            : (q as any).section ? [(q as any).section] : undefined;
          const matchesGrade = isGradeMatch(qGrade, activeStudentGrade, qSections);
          const matchesSection = isSectionMatch((q as any).section, (q as any).targetSections);
          return matchesSearch && matchesSubject && matchesGrade && matchesSection;
        });

        const filteredPapers = schoolExamPapers.filter((p) => {
          const paperTitle = p.title || `${p.subject || ''} ${p.role || ''} ${p.year || ''}`.trim() || "ورقة امتحانية";
          const searchLower = String(studentLibrarySearch || '').toLowerCase();
          const matchesSearch = !searchLower || String(paperTitle || '').toLowerCase().includes(searchLower);
          const matchesSubject = isSubjectMatch(p.subject, paperTitle);
          const matchesYear = !studentExamPaperYear || studentExamPaperYear === "الكل" || String(p.year).trim() === String(studentExamPaperYear).trim();
          const matchesRole = !studentExamPaperRole || studentExamPaperRole === "الكل" || normalizeArabicText(String(p.role || '')) === normalizeArabicText(String(studentExamPaperRole));
          const pGrade = (p as any).grade || (p as any).targetGrade;
          const pSections = Array.isArray((p as any).targetSections)
            ? (p as any).targetSections
            : (p as any).section ? [(p as any).section] : undefined;
          const matchesGrade = isGradeMatch(pGrade, activeStudentGrade, pSections);
          const matchesSection = isSectionMatch((p as any).section, (p as any).targetSections);
          return matchesSearch && matchesSubject && matchesYear && matchesRole && matchesGrade && matchesSection;
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
                  onClick={() => !checkLocked("materials") && setStudentLibraryTab("document")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    checkLocked("materials") ? "opacity-50 grayscale cursor-not-allowed" : ""
                  } ${
                    studentLibraryTab === "document"
                      ? "bg-[#050A18] text-amber-500 border-amber-500"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {checkLocked("materials") && (
                    <div className="absolute top-1 right-1 z-20 text-rose-500">
                      <Lock size={12} />
                    </div>
                  )}
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
                  onClick={() => !checkLocked("videos") && setStudentLibraryTab("video")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    checkLocked("videos") ? "opacity-50 grayscale cursor-not-allowed" : ""
                  } ${
                    studentLibraryTab === "video"
                      ? "bg-[#050A18] text-[#00E5FF] border-[#00E5FF]"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {checkLocked("videos") && (
                    <div className="absolute top-1 right-1 z-20 text-rose-500">
                      <Lock size={12} />
                    </div>
                  )}
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
                  onClick={() => !checkLocked("questions_bank") && setStudentLibraryTab("question_bank")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    checkLocked("questions_bank") ? "opacity-50 grayscale cursor-not-allowed" : ""
                  } ${
                    studentLibraryTab === "question_bank"
                      ? "bg-[#050A18] text-indigo-400 border-indigo-400"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {checkLocked("questions_bank") && (
                    <div className="absolute top-1 right-1 z-20 text-rose-500">
                      <Lock size={12} />
                    </div>
                  )}
                  {studentLibraryTab === "question_bank" && (
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-30" />
                  )}
                  <Database 
                    size={studentLibraryTab === "question_bank" ? 26 : 22} 
                    strokeWidth={studentLibraryTab === "question_bank" ? 2.5 : 2}
                    className={`relative z-10 transition-transform ${studentLibraryTab === "question_bank" ? "scale-110" : "group-hover:scale-105 group-hover:text-white/60"}`} 
                  />
                  <span className={`text-[9px] font-bold px-1 text-center relative z-10 ${studentLibraryTab === "question_bank" ? "" : "group-hover:text-white/60"}`}>بنك الأسئلة</span>
                </button>
                <button
                  onClick={() => !checkLocked("assignments") && setStudentLibraryTab("homework")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    checkLocked("assignments") ? "opacity-50 grayscale cursor-not-allowed" : ""
                  } ${
                    highlightTasksSection
                      ? "ring-2 ring-[#00E5FF] shadow-[0_0_20px_#00E5FF] border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] animate-pulse"
                      : studentLibraryTab === "homework"
                      ? "bg-[#050A18] text-amber-400 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {checkLocked("assignments") && (
                    <div className="absolute top-1 right-1 z-20 text-rose-500">
                      <Lock size={12} />
                    </div>
                  )}
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
                  onClick={() => !checkLocked("excellence") && setStudentLibraryTab("competitions")}
                  className={`group w-full flex flex-col items-center justify-center py-6 transition-all outline-none gap-2 border-r-[3px] relative overflow-hidden ${
                    checkLocked("excellence") ? "opacity-50 grayscale cursor-not-allowed" : ""
                  } ${
                    highlightTasksSection
                      ? "ring-2 ring-[#00E5FF] shadow-[0_0_20px_#00E5FF] border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] animate-pulse"
                      : studentLibraryTab === "competitions"
                      ? "bg-[#050A18] text-rose-400 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "border-transparent text-white/40 hover:bg-white/5"
                  }`}
                >
                  {checkLocked("excellence") && (
                    <div className="absolute top-1 right-1 z-20 text-rose-500">
                      <Lock size={12} />
                    </div>
                  )}
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
                          
                          {(docItem.allowDownload === true || isTeacher || userProfile?.role === 'admin' || userProfile?.isAdmin) && (
                            <div className="relative">
                              <button
                                onClick={() => {
                                  sounds.playClick();
                                  if (docItem?.fileUrl) {
                                    setDownloadingFileId(docItem.id);
                                    setDownloadProgress(0);
                                    downloadDocumentFile(
                                      docItem.fileUrl,
                                      (docItem.title || docItem.name || "ملزمة دراسية") + ".pdf",
                                      docItem.id,
                                      (msg, type) => showToast(msg, type),
                                      (progress) => {
                                        setDownloadProgress(progress);
                                        if (progress >= 100) setTimeout(() => setDownloadingFileId(null), 1500);
                                      }
                                    );
                                  } else {
                                    showToast("رابط الملف غير متاح للتحميل", "error");
                                  }
                                }}
                                disabled={downloadingFileId === docItem.id}
                                className={`px-2.5 py-1.5 ${downloadingFileId === docItem.id ? 'bg-slate-500/15 text-slate-400 border-slate-500/25' : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/25 active:scale-95 cursor-pointer'} text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 border shadow-[0_2px_8px_rgba(16,185,129,0.1)]`}
                                title="تحميل الملزمة مباشرة بصيغة PDF"
                              >
                                {downloadingFileId === docItem.id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    <span>{downloadProgress}%</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={13} className={downloadingFileId === docItem.id ? "text-slate-400" : "text-emerald-400"} />
                                    <span>تحميل</span>
                                  </>
                                )}
                              </button>
                              {downloadingFileId === docItem.id && downloadProgress > 0 && downloadProgress < 100 && (
                                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                                </div>
                              )}
                            </div>
                          )}

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
                          
                          <span className="absolute bottom-2 left-2 text-[8px] font-bold font-mono text-white/90 bg-black/75 px-2 py-0.5 rounded z-20 flex items-center gap-1 backdrop-blur-sm border border-white/10">
                            <Clock size={9} className="text-[#00E5FF]" />
                            {(!vidItem.duration || vidItem.duration === "0:00" || vidItem.duration === "00:00") ? "محاضرة مرئية" : vidItem.duration}
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

                {studentQuestionBankTab === 'questions' ? (() => {
                  const QUESTION_CATEGORIES = [
                    {
                      id: 'ministerial',
                      title: 'أسئلة وزارية',
                      desc: 'نماذج وأسئلة الامتحانات الوزارية للسنوات السابقة مع الحلول',
                      icon: BookOpen,
                      badgeText: 'وزاري',
                      borderClass: 'border-amber-500/20 hover:border-amber-500/50',
                      bgBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                      gradientBg: 'from-amber-500/10 via-[#0d1633] to-[#0A1024]',
                    },
                    {
                      id: 'chapter',
                      title: 'أسئلة فصلية',
                      desc: 'أسئلة ومراجعات مركزة لنهاية كل فصل ووحدة منهجية',
                      icon: Layers,
                      badgeText: 'فصلي',
                      borderClass: 'border-blue-500/20 hover:border-blue-500/50',
                      bgBadge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                      iconBg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                      gradientBg: 'from-blue-500/10 via-[#0d1633] to-[#0A1024]',
                    },
                    {
                      id: 'monthly',
                      title: 'أسئلة شهرية',
                      desc: 'نماذج اختبارات الأشهر المدرسية لتعزيز الفهم والتدريب',
                      icon: Calendar,
                      badgeText: 'شهري',
                      borderClass: 'border-pink-500/20 hover:border-pink-500/50',
                      bgBadge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
                      iconBg: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
                      gradientBg: 'from-pink-500/10 via-[#0d1633] to-[#0A1024]',
                    },
                    {
                      id: 'lesson',
                      title: 'أسئلة حسب الدرس',
                      desc: 'أسئلة وتمارين تفصيلية مقسمة بدقة لكل درس وموضوع',
                      icon: BookOpenText,
                      badgeText: 'حسب الدرس',
                      borderClass: 'border-emerald-500/20 hover:border-emerald-500/50',
                      bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                      gradientBg: 'from-emerald-500/10 via-[#0d1633] to-[#0A1024]',
                    },
                  ];

                  const questionCounts: Record<string, number> = {
                    ministerial: filteredQuestions.filter(q => (q.category || 'ministerial') === 'ministerial').length,
                    chapter: filteredQuestions.filter(q => q.category === 'chapter').length,
                    monthly: filteredQuestions.filter(q => q.category === 'monthly').length,
                    lesson: filteredQuestions.filter(q => q.category === 'lesson').length,
                  };

                  const displayedQuestions = (!selectedQuestionCategory || selectedQuestionCategory === 'all')
                    ? filteredQuestions
                    : filteredQuestions.filter(q => (q.category || 'ministerial') === selectedQuestionCategory);

                  return (
                    <div className="flex flex-col gap-6">
                      {/* Top Category Navigation & Cards */}
                      {selectedQuestionCategory === null ? (
                        <div>
                          {/* Header banner */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-transparent p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                                <Database size={20} />
                              </div>
                              <div>
                                <h3 className="text-base font-black text-white">بنك الأسئلة والمراجعة المنهجية</h3>
                                <p className="text-xs font-bold text-white/50">تصفح الأسئلة بحسب التصنيفات المعتمدة أو استعرض كافة الأسئلة</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedQuestionCategory('all')}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
                            >
                              <span>عرض كافة الأسئلة ({filteredQuestions.length})</span>
                              <ChevronLeft size={16} />
                            </button>
                          </div>

                          {/* 4 Interactive Category Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {QUESTION_CATEGORIES.map((cat) => {
                              const count = questionCounts[cat.id] || 0;
                              const CatIcon = cat.icon;
                              return (
                                <motion.div
                                  key={cat.id}
                                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelectedQuestionCategory(cat.id)}
                                  className={`cursor-pointer rounded-2xl border bg-gradient-to-b ${cat.gradientBg} p-5 transition-all duration-300 flex flex-col justify-between shadow-lg relative overflow-hidden group ${cat.borderClass}`}
                                >
                                  <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.iconBg} transition-transform group-hover:scale-110`}>
                                      <CatIcon size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${cat.bgBadge}`}>
                                      {count} {count === 1 ? 'سؤال' : count === 2 ? 'سؤالان' : 'أسئلة'}
                                    </span>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-base font-black text-white mb-1.5 flex items-center justify-between">
                                      <span>{cat.title}</span>
                                      <span className="text-xs font-bold text-white/40 group-hover:text-white transition-all">←</span>
                                    </h4>
                                    <p className="text-xs font-medium text-white/50 leading-relaxed line-clamp-2">
                                      {cat.desc}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Header above questions preview */}
                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <h4 className="text-sm font-black text-white/80 flex items-center gap-2">
                              <Sparkles size={16} className="text-amber-400" />
                              <span>أحدث الأسئلة المتاحة</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-bold">{filteredQuestions.length}</span>
                            </h4>
                          </div>
                        </div>
                      ) : (
                        /* Filtered Category Header with Back button and Quick Tabs */
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10">
                          <button
                            onClick={() => setSelectedQuestionCategory(null)}
                            className="px-3.5 py-2 rounded-xl text-xs font-black bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 border border-white/10 self-start cursor-pointer"
                          >
                            <ArrowRight size={14} />
                            <span>العودة للأقسام الرئيسية</span>
                          </button>

                          {/* Category quick switcher tabs */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                            <button
                              onClick={() => setSelectedQuestionCategory('all')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                                selectedQuestionCategory === 'all'
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                                  : 'bg-black/30 text-white/60 border-white/5 hover:text-white'
                              }`}
                            >
                              الكل ({filteredQuestions.length})
                            </button>
                            {QUESTION_CATEGORIES.map(cat => {
                              const count = questionCounts[cat.id] || 0;
                              const isCurrent = selectedQuestionCategory === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() => setSelectedQuestionCategory(cat.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                    isCurrent
                                      ? `${cat.bgBadge} font-black shadow-md`
                                      : 'bg-black/30 text-white/60 border-white/5 hover:text-white'
                                  }`}
                                >
                                  <span>{cat.title}</span>
                                  <span className="opacity-70 text-[10px]">({count})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Questions Grid or Empty State */}
                      {displayedQuestions.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-3xl border border-white/5 p-6"
                        >
                          <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative mb-3">
                            <BerqCharacter 
                              pose="pose_questions_bank" 
                              glowColor="cyan" 
                              className="w-full h-full" 
                            />
                          </div>
                          <h3 className="text-lg font-black text-white/80 mb-2">لا توجد أسئلة متوفرة في هذا القسم</h3>
                          <p className="text-xs font-bold text-white/40 max-w-sm leading-relaxed mb-4">
                            لم يقم الأساتذة بنشر أسئلة تطابق هذا التصنيف أو المادة حتى الآن.
                          </p>
                          {selectedQuestionCategory !== null && (
                            <button
                              onClick={() => setSelectedQuestionCategory(null)}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                            >
                              تصفح باقي الأقسام
                            </button>
                          )}
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {displayedQuestions.map((q: any, idx: number) => {
                            const qText = q.text || q.question || "نص السؤال غير متوفر";
                            const qId = q.id || `q_${idx}`;
                            const isExpanded = expandedQuestionId === qId;
                            const isCopied = copiedQuestionId === qId;
                            const catMeta = QUESTION_CATEGORIES.find(c => c.id === q.category) || QUESTION_CATEGORIES[0];
                            
                            return (
                              <motion.div
                                key={`q_${qId}_${idx}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group relative rounded-2xl border transition-all duration-300 flex flex-col justify-between bg-[#0A1024]/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] ${
                                  isExpanded ? 'border-indigo-500/40 bg-[#0E1532]/90 md:col-span-2' : 'border-white/10'
                                }`}
                              >
                                <div>
                                  {/* Top badges */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[11px] font-black text-white/70">
                                        {q.subject || "مادة عامة"}
                                      </span>
                                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${catMeta.bgBadge}`}>
                                        {catMeta.badgeText}
                                      </span>
                                    </div>
                                    
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                                      q.difficulty === 'hard' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                      q.difficulty === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                      'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    }`}>
                                      {q.difficulty === 'hard' ? 'صعب ⚠️' : q.difficulty === 'medium' ? 'متوسط ⚡' : 'سهل ✨'}
                                    </span>
                                  </div>

                                  {/* Tags */}
                                  {q.tags && q.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                      {q.tags.map((tag: string, i: number) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {/* Question Text (Expandable Accordion) */}
                                  <div 
                                    onClick={() => setExpandedQuestionId(isExpanded ? null : qId)}
                                    className="cursor-pointer mb-3"
                                  >
                                    <h4 className={`text-white font-bold text-sm sm:text-base leading-relaxed group-hover:text-indigo-200 transition-colors ${
                                      isExpanded ? '' : 'line-clamp-3'
                                    }`}>
                                      {qText}
                                    </h4>
                                    {qText.length > 120 && (
                                      <button 
                                        type="button"
                                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold mt-1.5 flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>{isExpanded ? 'طي السؤال ▲' : 'عرض السؤال كاملاً ▼'}</span>
                                      </button>
                                    )}
                                  </div>

                                  {/* Options (if multiple choice) */}
                                  {q.options && q.options.length > 0 && (
                                    <div className="mt-3 space-y-2 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
                                      <p className="text-[11px] font-bold text-white/50 mb-1.5">الخيارات المتاحة:</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {q.options.map((opt: string, i: number) => (
                                          <div key={i} className="text-xs font-bold text-white/80 bg-white/5 px-3 py-2 rounded-lg border border-white/5 flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] text-white/60 font-black">
                                              {['أ', 'ب', 'ج', 'د', 'هـ'][i] || (i + 1)}
                                            </span>
                                            <span className="truncate">{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Actions Footer */}
                                <div className="pt-3 border-t border-white/5 mt-3 flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedAIQuestion(q)}
                                    className="flex-1 py-2.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-indigo-200 text-xs font-black rounded-xl border border-indigo-500/30 hover:border-indigo-500/50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                  >
                                    <Sparkles size={15} className="text-amber-400" />
                                    <span>المساعد الذكي 🤖</span>
                                  </button>

                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await copyToClipboard(qText);
                                      setCopiedQuestionId(qId);
                                      setTimeout(() => setCopiedQuestionId(null), 2000);
                                      showToast("تم نسخ نص السؤال إلى الحافظة بنجاح", "success");
                                    }}
                                    title="نسخ نص السؤال"
                                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                      isCopied
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-white/10'
                                    }`}
                                  >
                                    {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                    <span className="hidden sm:inline text-xs">{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })() : (
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
                  const isSubjectMatch = (dbSubject: any, filterSubject: string) => {
                    if (filterSubject === "الكل") return true;
                    const s1 = String(dbSubject || "").replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase().trim();
                    const s2 = String(filterSubject || '').replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase().trim();
                    if (!s1 || !s2) return false;
                    if (s1.includes(s2) || s2.includes(s1)) return true;
                    if (s2 === "اللغه الانجليزيه" && (s1.includes("انكليزي") || s1.includes("انجليزي") || s1.includes("english"))) return true;
                    if (s2 === "اللغه العربيه" && (s1.includes("عربي"))) return true;
                    if (s2 === "التربيه الاسلاميه" && (s1.includes("اسلامي") || s1.includes("قران") || s1.includes("دين"))) return true;
                    return false;
                  };
                  const homeworks = teacherAiResults.filter(r => {
                    const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
                    const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
                    const matchesSection = isSectionMatch(r.section, r.targetSections);
                    const rNameStr = String(r.name || "");
                    const rContentStr = String(r.content || "");
                    return isHomeworkItem(r) && 
                      matchesGrade &&
                      matchesSection &&
                      (isSubjectMatch(r.subject, studentLibrarySubject) || rNameStr.includes(studentLibrarySubject) || rContentStr.includes(studentLibrarySubject)) && 
                      (studentLibrarySearch.trim() === "" || rNameStr.includes(studentLibrarySearch) || rContentStr.includes(studentLibrarySearch));
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
                    const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
                    const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
                    const matchesSection = isSectionMatch(r.section, r.targetSections);
                    const rNameStr = String(r.name || "");
                    const rContentStr = String(r.content || "");
                    return isCompetitionItem(r) && 
                      matchesGrade &&
                      matchesSection &&
                      (isSubjectMatch(r.subject || "", studentLibrarySubject) || rNameStr.includes(studentLibrarySubject) || rContentStr.includes(studentLibrarySubject)) && 
                      (studentLibrarySearch.trim() === "" || rNameStr.includes(studentLibrarySearch) || rContentStr.includes(studentLibrarySearch));
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
