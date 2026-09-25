import { realtimeManager } from '../lib/realtimeManager';
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
const debugLog = (...args: any[]) => { if (process.env.NODE_ENV === 'development') console.log(...args); };
const debugError = (...args: any[]) => { if (process.env.NODE_ENV === 'development') console.error(...args); };
const debugWarn = (...args: any[]) => { if (process.env.NODE_ENV === 'development') console.warn(...args); };
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure pdfjs worker to use local public static worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}
import { motion, AnimatePresence } from 'motion/react';
import { useWebRTCStream } from '../hooks/useWebRTCStream';
import { sounds } from "../lib/sounds";
import { GlobalAnnouncementsBanner } from './GlobalAnnouncementsBanner';
import { GlobalAnnouncementsPopup } from './GlobalAnnouncementsPopup';
import { useRemoteConfig } from '../services/remoteConfig';
import { SeasonalThemeBanner } from "./SeasonalThemeBanner";
import { TeacherAIAssistant } from "./TeacherAIAssistant";
import { copyToClipboard } from "../utils/clipboard";
import { useSecuritySettings, securityService } from '../services/securityService';

import { AIEnhancedRadar } from "./AIEnhancedRadar";
import { AIQuestionAssistantModal } from "./AIQuestionAssistantModal";
import { AIPaperExtractorModal } from "./AIPaperExtractorModal";
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
} from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";
import { academicService } from "../services/academicService";
import { staffService } from "../services/staffService";
import { compressImage } from "../utils/imageCompressor";
import {
  computeExcellencePoints,
  computeAcademicIdentity,
  getLevelData,
  OUTSTANDING_BADGES,
  getSubjectsForGrade,
  normalizeArabicText,
  normalizeGradeName,
  isArchivedList,
} from "../utils/studentUtils";

import {
  Rss,
  FolderOpen,
  Megaphone,
  GraduationCap,
  ArrowRight,
  Star,
  LayoutGrid,
  BookOpen,
  Award,
  Trophy,
  Crown,
  Languages,
  Sigma,
  Zap,
  Laptop,
  Calculator,
  Globe,
  Palette,
  Briefcase,
  Library,
  Dna,
  Earth,
  Atom,
  Variable,
  Book,
  FlaskConical,
  Microscope,
  ScrollText,
  User,
  ShieldCheck,
  Users,
  Pin,
  Lock,
  Bell,
  Sparkles,
  Feather,
  Compass,
  Landmark,
  LineChart,
  Plus,
  KeyRound,
  Check,
  Activity,
  BookOpenText,
  AlertCircle,
  Shirt,
  Camera,
  MonitorPlay,
  Layers,
  FileUp,
  FileText,
  CheckCircle,
  Video,
  Radio,
  Edit2,
  Trash2,
  Coffee,
  RefreshCw,
  FlipHorizontal,
  Upload,
  Eye,
  Save,
  UserCheck,
  FileSpreadsheet,
} from "lucide-react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  School as SchoolIcon,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  VideoOff,
  ThumbsUp,
  Send,
  Clock,
  HelpCircle,
  Hand as HandIcon,
  PenTool,
  Search,
  Filter,
} from "lucide-react";
import { SchoolContent } from "./SchoolContent";
import { BroadcastTicker } from "./BroadcastTicker";
import { extractGradeBase, extractSectionLetter } from "../utils/gradeMatcher";
import { StudentLounge } from "./StudentLounge";
import { StudentSupportForm } from "./StudentSupportForm";
import { StudentSchedule } from "./StudentSchedule";
import { ScheduleAlerter } from "./ScheduleAlerter";
import { MailQuestion, ShieldAlert, Database, Bot, ClipboardCheck, Play, Target, Terminal, Bug, Info, Unlock, Download, Minimize2, Scan, XCircle, MessageSquare } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";
import StrictContentViewer from "./StrictContentViewer";
import { Station1Viewer } from "./Station1Viewer";
import { SixthAcademyPro } from "./SixthAcademyPro";
import { TransformerLogsViewer } from "./TransformerLogsViewer";
import { BerqCharacter } from "./BerqCharacterManager";
import { safeStorage, safeSessionStorage } from '../lib/storage';
import { processPdfInForeground, parseLiteralTextToBlocks } from "../utils/pdfProcessor";
import { SixtySecondChallenge } from "./SixtySecondChallenge";
import { TeacherQuestionBank } from "./TeacherQuestionBank";
import { TeacherAttendanceTab } from "./TeacherAttendanceTab";
import DevDashboard from "./DevDashboard";

import { VerticalScrollPicker } from "./SchoolPlatform/VerticalScrollPicker";
import { RevealBlock, RenderTextWithTags } from "./SchoolPlatform/RevealBlock";
import { VideoComments } from "./SchoolPlatform/VideoComments";
import { PostCommentsSection } from "./SchoolPlatform/PostCommentsSection";
import { pushSocialNotification } from "./SchoolPlatform/SocialNotifications";
import {
  sanitizeForFirestore,
  stopStoryAudio,
  playStoryAudio,
  initStoryAudioContext,
  getSimulatedFileContent,
  generateQuestionsForDocument,
  getSanitizedVideoUrl,
} from "./SchoolPlatform/utils";
import type {
  Teacher,
  MaterialField,
  Post,
  SchoolPlatformProps,
  PlatformTab,
} from "./SchoolPlatform/types";
import { StudentViewWrapper } from "./student/StudentViewWrapper";
import { TeacherViewWrapper } from "./teacher/TeacherViewWrapper";

import { SchoolPlatformContext } from "./SchoolPlatform/SchoolPlatformContext";
import { StudentFeedTab } from "./SchoolPlatform/StudentFeedTab";
import { StudentFilesTab } from "./SchoolPlatform/StudentFilesTab";
import { StudentMaterialsTab } from "./SchoolPlatform/StudentMaterialsTab";
import { StudentExcellenceTab } from "./SchoolPlatform/StudentExcellenceTab";
import { StudentLiveWatchTab } from "./SchoolPlatform/StudentLiveWatchTab";
import { TeacherControlLiveTab } from "./SchoolPlatform/TeacherControlLiveTab";
import { TeacherControlContentTab } from "./SchoolPlatform/TeacherControlContentTab";
import { TeacherControlFilesTab } from "./SchoolPlatform/TeacherControlFilesTab";
import { TeacherControlGradesTab } from "./SchoolPlatform/TeacherControlGradesTab";
import { TeacherControlAssessmentTab } from "./SchoolPlatform/TeacherControlAssessmentTab";
import { TeacherControlAnnouncementsTab } from "./SchoolPlatform/TeacherControlAnnouncementsTab";
import { PlatformOverlays } from "./SchoolPlatform/PlatformOverlays";


export const SchoolPlatform: React.FC<SchoolPlatformProps> = ({
  progress,
  setProgress,
  schoolName,
  schoolId,
  grade,
  gradeName,
  onBack,
  language = "ar",
  portalType,
  isTeacher = false,
  teacherData,
  userProfile,
  onUpdateProfile,
  onOpenNotifications,
  onMarkNotificationAsRead,
  onDeleteNotification,
  onClearAllNotifications,
  notifications = [],
  highlightTasksSection,
  onClearHighlightTasks,
  activeMainTab,
  onSwitchMainTab,
}) => {
  const resolvedSchoolId = schoolId || userProfile?.schoolId || teacherData?.schoolId || "school1";

  const [platformLocks, setPlatformLocks] = useState({
    communityLockAll: false,
    communityLockGrades: [] as string[],
    storiesLock: false,
    loungeLock: false
  });

  const [subjectMapping, setSubjectMapping] = useState<any>(() => {
    try {
      const cached = safeStorage.getItem("s6_cached_subject_mapping");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!resolvedSchoolId) return;
    const unsub = academicService.subscribeToSchoolSettings(resolvedSchoolId, (data) => {
      if (data) {
        setPlatformLocks({
          communityLockAll: data.communityLockAll || false,
          communityLockGrades: data.communityLockGrades || [],
          storiesLock: data.storiesLock || false,
          loungeLock: data.loungeLock || false
        });
      }
    });
    return () => unsub();
  }, [resolvedSchoolId]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBack = async () => {
    if (isTeacher && isLiveActive) {
      try {
        const docRef = doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`);
        await setDoc(docRef, {
          isLiveActive: false,
          isLive: false,
          activeLiveQuizStr: null
        }, { merge: true });
        safeSessionStorage.removeItem("s6_is_broadcasting");
      } catch (e) {
        console.error("Error stopping live on back:", e);
      }
    }
    onBack();
  };

  const activeTeacherSubject = teacherData?.subject || "اللغة الإنجليزية";

  const [teacherBroadcasts, setTeacherBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    if (!isTeacher || !resolvedSchoolId) return;

    const currentTeacherName = teacherData?.name || "أستاذ المادة";

    const normalizeBroadcastItem = (item: any) => {
      let expiryMs = 0;
      if (typeof item.expiryDate === 'number') {
        expiryMs = item.expiryDate;
      } else if (item.expiryDate) {
        const parsed = new Date(item.expiryDate).getTime();
        expiryMs = isNaN(parsed) ? 0 : parsed;
      } else if (item.timestampMs && item.durationHours) {
        expiryMs = item.timestampMs + item.durationHours * 3600 * 1000;
      }

      return {
        ...item,
        timestampMs: item.timestampMs || (item.timestamp?.toMillis ? item.timestamp.toMillis() : (typeof item.timestamp === 'number' ? item.timestamp : Date.now())),
        expiryDate: expiryMs || (Date.now() + 24 * 3600 * 1000)
      };
    };

    const deduplicateItems = (items: any[]) => {
      const map = new Map<string, any>();
      const seenMessages = new Set<string>();

      items.forEach(raw => {
        const item = normalizeBroadcastItem(raw);
        const msgKey = `${item.schoolId || ''}:::${(item.message || '').trim()}`;
        if (!seenMessages.has(msgKey) && !map.has(item.id)) {
          seenMessages.add(msgKey);
          map.set(item.id, item);
        }
      });

      return Array.from(map.values()).sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
    };

    // 1. Fast load from API / PostgreSQL
    const loadFromApi = async () => {
      try {
        const apiList = await broadcastService.getBroadcasts(resolvedSchoolId);
        const myBroadcasts = (apiList || []).filter((b: any) => {
          const authorNorm = (b.author || '').trim();
          return b.schoolId === resolvedSchoolId && (authorNorm === currentTeacherName || authorNorm.includes(currentTeacherName) || currentTeacherName.includes(authorNorm));
        });
        setTeacherBroadcasts(prev => {
          // If apiList is empty or has changed, merge only active non-deleted items
          const combined = [...myBroadcasts, ...(prev || []).filter(p => p && !p.id.startsWith('br_'))];
          return deduplicateItems(combined);
        });
      } catch (err) {}
    };

    loadFromApi();

    const handleBroadcastEvent = (e: any) => {
      const detail = e?.detail;
      if (detail?.action === 'DELETE') {
        const deletedId = detail.id;
        const deletedMsg = detail.message;
        setTeacherBroadcasts(prev => (prev || []).filter(b => b.id !== deletedId && (!deletedMsg || b.message !== deletedMsg)));
        return;
      }
      loadFromApi();
    };
    window.addEventListener('app_broadcast_event', handleBroadcastEvent);

    // 2. Also listen to Firestore collection
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'broadcasts'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs
          .map(doc => {
            const data = doc.data() as any;
            return normalizeBroadcastItem({
              id: doc.id,
              ...data
            });
          })
          .filter(b => b.schoolId === resolvedSchoolId && (b.author === currentTeacherName || (b.author && currentTeacherName && (b.author.includes(currentTeacherName) || currentTeacherName.includes(b.author)))))
          .sort((a, b) => b.timestampMs - a.timestampMs);

        setTeacherBroadcasts(prev => {
          const apiItems = (prev || []).filter(p => p && p.id && p.id.startsWith('br_'));
          return deduplicateItems([...list, ...apiItems]);
        });
      }, (error) => {
        console.warn("Teacher Broadcasts Listener Warning:", error);
      });
    } catch (e) {}

    return () => {
      window.removeEventListener('app_broadcast_event', handleBroadcastEvent);
      unsubscribe();
    };
  }, [isTeacher, resolvedSchoolId, teacherData?.name]);

  const getTeacherSubjectId = (teacherSubject: string, studentGrade: string): string => {
    const normTeacher = (teacherSubject || "").trim().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
    const subjects = getSubjectsForGrade(studentGrade || "", undefined, subjectMapping);
    const found = subjects.find(s => {
      const normSubjName = s.name.trim().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
      return normSubjName.includes(normTeacher) || normTeacher.includes(normSubjName) ||
             s.id.toLowerCase().includes(normTeacher.toLowerCase());
    });
    if (found) return found.id;
    if (normTeacher.includes("رياضيات") || normTeacher.includes("رياض")) return "math";
    if (normTeacher.includes("انجليزي") || normTeacher.includes("انكليزي") || normTeacher.includes("english")) return "english";
    if (normTeacher.includes("عربي") || normTeacher.includes("عربية")) return "arabic";
    if (normTeacher.includes("فيزياء") || normTeacher.includes("فيزيا")) return "physics";
    if (normTeacher.includes("كيمياء") || normTeacher.includes("كيميا")) return "chemistry";
    if (normTeacher.includes("احياء")) return "biology";
    if (normTeacher.includes("اسلامية") || normTeacher.includes("دين")) return "islamic";
    if (normTeacher.includes("حاسوب") || normTeacher.includes("حاسب")) return "computer";
    return "english";
  };

  const getLatestGrade = (student: any, teacherSubject: string): { grade: number; periodName: string } => {
    const subjId = getTeacherSubjectId(teacherSubject, student.grade || "");
    const allPossiblePeriodsWithLabels = [
      { id: 'month1', label: 'الشهر الأول' },
      { id: 'month2', label: 'الشهر الثاني' },
      { id: 'mid', label: 'امتحان نصف السنة' },
      { id: 'term1_avg', label: 'معدل الفصل الأول' },
      { id: 'month3', label: 'الشهر الثالث' },
      { id: 'month4', label: 'الشهر الرابع' },
      { id: 'term2_avg', label: 'معدل الفصل الثاني' },
      { id: 'annual_quest', label: 'السعي السنوي' },
      { id: 'final', label: 'الامتحان النهائي' },
      { id: 'final_grade', label: 'الدرجة النهائية' }
    ];
    for (let i = allPossiblePeriodsWithLabels.length - 1; i >= 0; i--) {
      const p = allPossiblePeriodsWithLabels[i];
      const scoreVal = student.grades?.[p.id]?.[subjId];
      if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "") {
        const num = Number(scoreVal);
        if (!isNaN(num)) {
          return { grade: num, periodName: p.label };
        }
      }
    }
    const nameHash = (student.name || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const fallbackGrade = Math.round(85 + (nameHash % 16));
    return { grade: fallbackGrade, periodName: "التقييم المستمر" };
  };

  const getDynamicOutstandingBadges = () => {
    const subjectName = activeTeacherSubject;
    return OUTSTANDING_BADGES.map(b => {
      if (b.id === 'math') {
        return {
          ...b,
          title: `عبقري ${subjectName}`,
          desc: `للأداء الاستثنائي المتكامل في اختبارات وكويزات مادة ${subjectName} والتفاعل اليومي`
        };
      }
      return b;
    });
  };

  const getStudentSubjectPoints = (student: any, teacherSubject: string): number => {
    const subjId = getTeacherSubjectId(teacherSubject, student.grade || "");
    
    // 1. Base Score Points: sum of grades in this subject * 10
    let scores: number[] = [];
    const allPossiblePeriods = ['month1', 'month2', 'term1_avg', 'mid', 'month3', 'month4', 'term2_avg', 'annual_quest', 'final', 'final_grade'];
    allPossiblePeriods.forEach(p => {
      const sStr = student.grades?.[p]?.[subjId];
      const s = Number(sStr);
      if (sStr !== undefined && sStr !== null && sStr !== '' && !isNaN(s)) {
        scores.push(s);
      }
    });

    let subjAvg = 90; // Default baseline avg
    if (scores.length > 0) {
      subjAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
    } else {
      const nameHash = (student.name || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      subjAvg = 80 + (nameHash % 21); // 80 - 100
    }

    let basePoints = Math.round(subjAvg * 10);

    // 2. Progress/Improvement Bonus
    let progressBonus = 0;
    if (scores.length >= 2) {
      const diff = scores[scores.length - 1] - scores[0];
      if (diff > 0) {
        progressBonus = diff * 15; // e.g., improved by 10 points -> +150 XP
      }
    } else {
      const nameHash = (student.name || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      progressBonus = (nameHash % 5) * 30; // Stable dynamic progress bonus
    }

    // 3. Badges and Awards Bonus specifically for this subject
    let badgesBonus = 0;
    
    // Outstanding badges
    if (student.outstandingBadges && Array.isArray(student.outstandingBadges)) {
      student.outstandingBadges.forEach((badgeId: string) => {
        if (badgeId === 'math') {
          // This is the subject genius badge ("عبقري المادة")
          badgesBonus += 250;
        } else if (badgeId === 'honor' || badgeId === 'elite') {
          // High honor or elite
          badgesBonus += 150;
        } else {
          badgesBonus += 80;
        }
      });
    }

    // High performance exemption bonus
    if (subjAvg >= 90) {
      badgesBonus += 150;
    }
    if (subjAvg >= 95) {
      badgesBonus += 100; // Extra elite bonus
    }

    // 4. Overrides bonus
    const overrides = evaluationOverrides[student.id] || {};
    const extraPoints = Number(overrides.pointsBonusAdded || 0);

    const finalPoints = basePoints + progressBonus + badgesBonus + extraPoints;
    return finalPoints;
  };

  const getCurrentUserId = () => {
    if (isTeacher)
      return (
        teacherData?.id || teacherData?.code || auth.currentUser?.uid || "guest"
      );
    if (userProfile?.role === "admin")
      return userProfile?.id || auth.currentUser?.uid || "guest";
    return (
      userProfile?.studentCode ||
      userProfile?.code ||
      userProfile?.id ||
      auth.currentUser?.uid ||
      "guest"
    );
  };

  const getUserName = () => {
    if (isTeacher) return teacherData?.name || "أستاذ";
    if (
      userProfile?.role === "admin" ||
      userProfile?.isAdmin ||
      userProfile?.adminType
    )
      return "الإدارة 🏛️";
    const profileName =
      userProfile?.name || userProfile?.fullName || userProfile?.studentName;
    if (profileName && profileName.trim()) {
      return profileName.trim();
    }
    return auth.currentUser?.displayName || "طالب متميز";
  };

  const getUserPhoto = () => {
    if (isTeacher) return currentTeacherData?.photoURL || teacherData?.photoURL || userProfile?.photoURL || null;
    if (
      userProfile?.role === "admin" ||
      userProfile?.isAdmin ||
      userProfile?.adminType
    )
      return null; // No photo for admin account
    return userProfile?.photoURL || null;
  };

  const remoteConfig = useRemoteConfig();
  const [schoolConfigData, setSchoolConfigData] = useState<{ disabledModules?: string[]; [key: string]: any } | null>(() => {
    try {
      const cached = localStorage.getItem(`school_disabled_modules_${resolvedSchoolId}`) || localStorage.getItem(`s6_disabled_modules_${resolvedSchoolId}`);
      if (cached) {
        return { disabledModules: JSON.parse(cached) };
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    let unsubDoc: (() => void) | null = null;
    let unsubQuery: (() => void) | null = null;

    if (resolvedSchoolId) {
      unsubDoc = onSnapshot(doc(db, "schools", resolvedSchoolId), (snap) => {
        if (snap.exists()) {
          setSchoolConfigData(snap.data());
        }
      }, (err) => console.warn("School config doc listener:", err));
    }

    const targetName = schoolName || userProfile?.schoolName || "";
    const q = query(collection(db, "schools"));
    unsubQuery = onSnapshot(q, (snap) => {
      let foundData: any = null;
      snap.forEach((d) => {
        const data = d.data();
        if (
          d.id === resolvedSchoolId ||
          d.id === schoolId ||
          data.id === resolvedSchoolId ||
          (targetName && (data.name === targetName || data.name?.includes(targetName) || targetName.includes(data.name)))
        ) {
          foundData = data;
        }
      });
      if (foundData) {
        setSchoolConfigData(foundData);
      }
    }, (err) => console.warn("School config query listener:", err));

    // In-tab instant sync listener from DevDashboard toggle
    const handleSchoolConfigEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      if (
        detail.schoolId === resolvedSchoolId ||
        detail.schoolId === schoolId ||
        (targetName && detail.schoolName === targetName) ||
        !detail.schoolId
      ) {
        setSchoolConfigData(prev => ({
          ...(prev || {}),
          disabledModules: detail.disabledModules || []
        }));
      }
    };
    window.addEventListener("school_configs_updated", handleSchoolConfigEvent);

    // Multi-user realtimeManager listener
    const unsubRealtime = realtimeManager.subscribe('school_configs', (payload: any) => {
      if (payload?.schoolId === resolvedSchoolId || payload?.id === resolvedSchoolId) {
        if (Array.isArray(payload?.disabledModules)) {
          setSchoolConfigData(prev => ({ ...(prev || {}), disabledModules: payload.disabledModules }));
        }
      }
    });

    // Also fetch initial disabled modules from backend API
    if (resolvedSchoolId) {
      fetch(`/api/schools/${resolvedSchoolId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          const sch = data?.school || data?.data || (Array.isArray(data) ? data[0] : null);
          if (sch && Array.isArray(sch.disabledModules)) {
            setSchoolConfigData(prev => ({ ...(prev || {}), disabledModules: sch.disabledModules }));
          }
        })
        .catch(() => {});
    }

    return () => {
      if (unsubDoc) unsubDoc();
      if (unsubQuery) unsubQuery();
      window.removeEventListener("school_configs_updated", handleSchoolConfigEvent);
      if (typeof unsubRealtime === 'function') unsubRealtime();
    };
  }, [resolvedSchoolId, schoolName, schoolId, userProfile?.schoolName]);

  const disabledModules = useMemo(() => {
    return Array.isArray(schoolConfigData?.disabledModules) ? schoolConfigData.disabledModules : [];
  }, [schoolConfigData]);

  const isSuperAdmin = auth.currentUser?.email === "mntzralghanm527@gmail.com" || userProfile?.email === "mntzralghanm527@gmail.com";
  const { settings: secSettings } = useSecuritySettings();
  const effectiveRole = isTeacher ? 'teacher' : (userProfile?.role || 'student');
  const rolePrefix = effectiveRole;
  const [isLiveActive, setIsLiveActive] = useState(false);

  const checkIsModuleDisabled = (tabId: string): boolean => {
    // Current role-specific prefix (e.g. "student:feed", "parent:financial")
    const specificId = `${rolePrefix}:${tabId}`;

    // 1. Check for specific role-based disable (Priority)
    if (disabledModules.includes(specificId)) return true;

    // 2. Removed global fallback to ensure absolute portal isolation as requested by user

    // 3. Special handling for aliases and cross-references - ONLY check role-prefixed versions
    if (tabId === "feed") {
      return disabledModules.includes(`${rolePrefix}:arena`) || disabledModules.includes(`${rolePrefix}:feed`);
    }
    
    if (tabId === "grades") {
      return disabledModules.includes(`${rolePrefix}:grades_parent`) || disabledModules.includes(`${rolePrefix}:grades`);
    }

    if (tabId === "attendance") {
      return disabledModules.includes(`${rolePrefix}:attendance_parent`) || 
             disabledModules.includes(`${rolePrefix}:attendance`) || 
             disabledModules.includes(`${rolePrefix}:attendance_tracking`) ||
             disabledModules.includes(`${rolePrefix}:discipline`);
    }

    if (tabId === "control") {
      return disabledModules.includes(`${rolePrefix}:control_hub`) || 
             disabledModules.includes(`${rolePrefix}:teacher_control`) ||
             disabledModules.includes(`${rolePrefix}:control`);
    }

    if (tabId === "live_watch" || tabId === "broadcast") {
      return disabledModules.includes(`${rolePrefix}:broadcast`) || 
             disabledModules.includes(`${rolePrefix}:teacher_live`) ||
             disabledModules.includes(`${rolePrefix}:teacher_broadcast`) ||
             disabledModules.includes(`${rolePrefix}:live_watch`);
    }

    if (tabId === "questions_bank") {
      return disabledModules.includes(`${rolePrefix}:questions_bank`);
    }

    if (tabId === "files") {
      return disabledModules.includes(`${rolePrefix}:files`);
    }

    if (tabId === "ai_assistant") {
      return disabledModules.includes(`${rolePrefix}:ai_assistant`);
    }

    if (tabId === "excellence" || tabId === "sovereignty") {
      return disabledModules.includes(`${rolePrefix}:competitions`) || 
             disabledModules.includes(`${rolePrefix}:sovereignty_mgmt`) || 
             disabledModules.includes(`${rolePrefix}:excellence`) ||
             disabledModules.includes(`${rolePrefix}:excellence_parent`) ||
             disabledModules.includes(`${rolePrefix}:sovereignty`);
    }

    if (tabId === "evaluation") {
      return disabledModules.includes(`${rolePrefix}:evaluation`) || 
             disabledModules.includes(`${rolePrefix}:grading`);
    }

    if (tabId === "announcements") {
      return disabledModules.includes(`${rolePrefix}:announcements`) || 
             disabledModules.includes(`${rolePrefix}:teacher_news`);
    }

    if (tabId === "activity_monitoring" || tabId === "monitoring") {
      return disabledModules.includes(`${rolePrefix}:activity_monitoring`) || 
             disabledModules.includes(`${rolePrefix}:monitoring`);
    }

    if (tabId === "assignments") {
      return disabledModules.includes(`${rolePrefix}:assignments_parent`) || disabledModules.includes(`${rolePrefix}:assignments`);
    }

    if (tabId === "discipline_reports") {
      return disabledModules.includes(`${rolePrefix}:discipline_reports_parent`) || disabledModules.includes(`${rolePrefix}:discipline_reports`);
    }

    if (tabId === "uniform") {
      return disabledModules.includes(`${rolePrefix}:uniform_parent`) || disabledModules.includes(`${rolePrefix}:uniform`);
    }

    if (tabId === "transport") {
      return disabledModules.includes(`${rolePrefix}:transport_parent`) || disabledModules.includes(`${rolePrefix}:transport`);
    }

    if (tabId === "financial" || tabId === "finance") {
      return disabledModules.includes(`${rolePrefix}:financial_parent`) || disabledModules.includes(`${rolePrefix}:financial`);
    }

    if (tabId === "support") {
      return disabledModules.includes(`${rolePrefix}:support_parent`) || disabledModules.includes(`${rolePrefix}:support`);
    }

    if (tabId === "ideas") {
      return disabledModules.includes(`${rolePrefix}:ideas_parent`) || disabledModules.includes(`${rolePrefix}:ideas`);
    }

    if (tabId === "materials") {
      return disabledModules.includes(`${rolePrefix}:content`) || 
             disabledModules.includes(`${rolePrefix}:teacher_content`) ||
             disabledModules.includes(`${rolePrefix}:teacher_materials`) ||
             disabledModules.includes(`${rolePrefix}:materials`) ||
             disabledModules.includes(`${rolePrefix}:mayadeen`);
    }

    return false;
  };

  const rawTabs = [
    { id: "feed", name: "الساحة", icon: LayoutGrid },
    ...(isTeacher || userProfile?.role === "admin"
      ? [
          { id: "attendance", name: "رصد الحضور", icon: UserCheck, cap: "enter_attendance" },
          { id: "control", name: "التحكم", icon: ShieldCheck, cap: "enter_attendance" },
        ]
      : isLiveActive 
        ? [{ id: "live_watch", name: "البث 📡", icon: Radio, cap: "live_broadcast" }]
        : []),
    ...(isTeacher || userProfile?.role === "admin"
      ? [
          { id: "questions_bank", name: "بنك الأسئلة", icon: Database },
          { id: "ai_assistant", name: "مساعد الذكاء", icon: Bot, cap: "ai_radar" },        
        ]
      : [
          { id: "files", name: "الملفات", icon: FolderOpen },
          { id: "materials", name: "الميادين", icon: BookOpen, cap: "view_grades" },
        ]),
    {
      id: "schedule",
      name: isTeacher ? "جدولي" : "جدولي اليومي",
      icon: Calendar,
    },
    { id: "excellence", name: "التميز", icon: Award },
  ];

  const [activeTab, setActiveTabState] = useState<PlatformTab>(() => {
    const target = safeStorage.getItem("s6_target_tab") as PlatformTab;
    if (target) {
      safeStorage.removeItem("s6_target_tab");
      return target;
    }
    return "feed";
  });
  const [selectedAIQuestion, setSelectedAIQuestion] = useState<any>(null);
  const [selectedPaperForExtraction, setSelectedPaperForExtraction] = useState<any>(null);

  // AI Radar and Print-Ready custom state variables
  const [activeRadarFile, setActiveRadarFile] = useState<any>(null);
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("s6_library_ratings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [isExtractingAiText, setIsExtractingAiText] = useState(false);
  const [showAiCancelConfirm, setShowAiCancelConfirm] = useState(false);
  const aiExtractionAbortControllerRef = useRef<AbortController | null>(null);
  const [aiExtractionProgress, setAiExtractionProgress] = useState("");
  const [aiExtractionPercent, setAiExtractionPercent] = useState<number>(0);
  const [aiExtractionTimeRemaining, setAiExtractionTimeRemaining] = useState<number | undefined>(undefined);
  const [pendingExtractedAi, setPendingExtractedAi] = useState<any>(null);
  const [editingQueueIndex, setEditingQueueIndex] = useState<number | null>(null);
  const [pendingEditorTab, setPendingEditorTab] = useState<'blocks' | 'quiz' | 'ministerial' | 'raw'>('blocks');
  const [pendingUnitTitle, setPendingUnitTitle] = useState("");
  const [singleUploadedPagesQueue, setSingleUploadedPagesQueue] = useState<any[]>(() => {
    try {
      const saved = safeStorage.getItem("s6_uploaded_pages_queue");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically persist queue changes so queued pages NEVER disappear
  useEffect(() => {
    try {
      safeStorage.setItem("s6_uploaded_pages_queue", JSON.stringify(singleUploadedPagesQueue));
    } catch (e) {
      console.warn("Failed to persist queue to localStorage:", e);
    }
  }, [singleUploadedPagesQueue]);
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);
  const [isPublishEditMode, setIsPublishEditMode] = useState(true);
  const [extractedAiTitle, setExtractedAiTitle] = useState("");
  const [selectedAcademyPage, setSelectedAcademyPage] = useState<any>(null);
  const [aiExtractionLogs, setAiExtractionLogs] = useState<string[]>([]);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  
  const [isDeveloperModeEnabled, setIsDeveloperModeEnabled] = useState(() => {
    return typeof window !== "undefined" && (
      localStorage.getItem("isDeveloper") === "true" ||
      auth.currentUser?.email === "mntzralghanm527@gmail.com"
    );
  });
  const [headerClicks, setHeaderClicks] = useState(0);

  useEffect(() => {
    console.log("[Mount Log] SchoolPlatform mounted. activeTab initialized to:", activeTab);
  }, []);

  const [showTransformerLogs, setShowTransformerLogs] = useState(false);
  const [aiExtractionError, setAiExtractionError] = useState<{
    message: string;
    stack?: string;
    fileName?: string;
    fileSize?: number;
    pageCount?: number;
  } | null>(null);

  const showDebugLogsPanel = false;
  const setShowDebugLogsPanel = (v: boolean) => {};
  const debugStartTime = null;
  const setDebugStartTime = (v: any) => {};
  const debugFileName = null;
  const setDebugFileName = (v: any) => {};
  const debugFileSize = null;
  const setDebugFileSize = (v: any) => {};
  const debugPageCount = null;
  const setDebugPageCount = (v: any) => {};
  const debugLastOperation = "";
  const setDebugLastOperation = (v: any) => {};
  const navTriggers: any[] = [];
  const setNavTriggers = (v: any) => {};
  const getFunctionNameFromStack = (s: string) => s;
  const getFileNameFromStack = (s: string) => s;
  
  const setActiveTab = (newTab: PlatformTab, callerName: string = 'unknown') => {
    if (checkIsModuleDisabled(newTab)) {
      showToast("هذا القسم مقفل حالياً من قبل الإدارة المركزية", "error");
      return;
    }
    setActiveTabState(newTab);
    if (newTab === "files") {
      setStudentLibraryTab("document");
    }
  };
  const [selectedControlTab, setSelectedControlTab] = useState<string>(() => {
    const targetSub = safeStorage.getItem("s6_target_control_tab");
    if (targetSub) {
      safeStorage.removeItem("s6_target_control_tab");
      return targetSub;
    }
    return "live";
  });

  useEffect(() => {
    const targetSub = safeStorage.getItem("s6_target_control_tab");
    if (targetSub) {
      safeStorage.removeItem("s6_target_control_tab");
      setSelectedControlTab(targetSub);
    }
  }, [activeTab]);
  const [selectedEvaluationStudentId, setSelectedEvaluationStudentId] = useState<string | null>(null);
  const [evaluationOverrides, setEvaluationOverrides] = useState<Record<string, any>>({});
  const [customPointsInput, setCustomPointsInput] = useState<string>("");
  const [prideMessageText, setPrideMessageText] = useState<string>("");
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>("");
  const [selectedEvaluationSubTab, setSelectedEvaluationSubTab] = useState<string>("analytics");
  const [activeMetricModal, setActiveMetricModal] = useState<"points" | "badges" | "attendance" | "knights" | null>(null);
  const [isControlSidebarCollapsed, setIsControlSidebarCollapsed] =
    useState(false);
  const [isMaterialsSidebarCollapsed, setIsMaterialsSidebarCollapsed] =
    useState(false);
  const [isFilesSidebarCollapsed, setIsFilesSidebarCollapsed] = useState(false);
  
  // Content Viewer state
  const [activeContentSession, setLocalActiveContentSession] = useState<{title: string, unit: string} | null>(null);

  const setActiveContentSession = (session: {title: string, unit: string} | null) => {
    setLocalActiveContentSession(session);
    if (isTeacher && isLiveActive && resolvedSchoolId && targetBroadcastGrade) {
      setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
        activeContentSession: session 
      }, { merge: true }).catch(console.error);
    }
  };
  const [activeLiveAlert, setActiveLiveAlert] = useState<any | null>(null);

  // Student specific local media controls
  const [studentLocalMicActive, setStudentLocalMicActive] = useState(false);
  const [studentLocalCamActive, setStudentLocalCamActive] = useState(false);

  const [currentTeacherData, setCurrentTeacherData] = useState<any>(teacherData);

  useEffect(() => {
    if (teacherData) {
      setCurrentTeacherData(teacherData);
    }
  }, [teacherData]);

  // Modal and state for linking an additional class code for multi-section teachers
  const [showLinkCodeModal, setShowLinkCodeModal] = useState(false);
  const [linkingCode, setLinkingCode] = useState('');
  const [isLinkingCode, setIsLinkingCode] = useState(false);
  const [linkCodeError, setLinkCodeError] = useState('');
  const [linkCodeSuccess, setLinkCodeSuccess] = useState('');

  const handleLinkTeacherCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = linkingCode.trim();
    if (!code) {
      setLinkCodeError('يرجى إدخال كود الشعبة');
      return;
    }
    const teacherId = currentTeacherData?.id || teacherData?.id;
    if (!teacherId) {
      setLinkCodeError('تعذر تحديد حساب الأستاذ');
      return;
    }

    setIsLinkingCode(true);
    setLinkCodeError('');
    setLinkCodeSuccess('');
    try {
      const res = await staffService.linkTeacherCode(teacherId, code);
      if (res.success && res.teacher) {
        setCurrentTeacherData(res.teacher);
        setLinkCodeSuccess(res.message || 'تم ربط الشعبة بنجاح!');
        showToast(res.message || 'تم ربط الشعبة بنجاح!', 'success');
        if (res.linkedClass) {
          setSelectedTeacherClass(res.linkedClass);
        }
        setTimeout(() => {
          setShowLinkCodeModal(false);
          setLinkingCode('');
          setLinkCodeSuccess('');
        }, 1200);
      } else {
        setLinkCodeError(res.message || 'فشل ربط كود الشعبة');
      }
    } catch (err: any) {
      setLinkCodeError(err.message || 'فشل ربط كود الشعبة، تأكد من صحة الكود');
    } finally {
      setIsLinkingCode(false);
    }
  };

  const [academicLists, setAcademicLists] = useState<any[]>([]);

  const [rawTopStudents, setRawTopStudents] = useState<any[]>([]);

  const topStudents = useMemo(() => {
    if (!academicLists || academicLists.length === 0) return rawTopStudents;
    const validCodes = new Set<string>();
    academicLists.forEach((l: any) => {
      if (Array.isArray(l.students)) {
        l.students.forEach((st: any) => {
          const code = (st.code || st.student || st.id || "").toString().trim().toLowerCase();
          if (code) validCodes.add(code);
        });
      }
    });
    if (validCodes.size === 0) return rawTopStudents;
    
    return rawTopStudents.filter((st: any) => {
      const c1 = (st.code || "").toString().trim().toLowerCase();
      const c2 = (st.studentCode || "").toString().trim().toLowerCase();
      const c3 = (st.id || "").toString().trim().toLowerCase();
      return validCodes.has(c1) || validCodes.has(c2) || validCodes.has(c3);
    });
  }, [rawTopStudents, academicLists]);

  // 1. Dynamic subscription to school academic_lists to detect specific sections

  useEffect(() => {
    if (!resolvedSchoolId) return;
    const unsub = academicService.subscribeToLists(resolvedSchoolId, (lists) => {
      setAcademicLists(lists || []);
    });
    return () => unsub();
  }, [resolvedSchoolId]);

  // Resolves the exact section name for student from academic_lists if not already present in userProfile
  const resolvedStudentSection = useMemo(() => {
    if (isTeacher) return null;
    if (userProfile?.section) return userProfile.section;
    if ((userProfile as any)?.studentSection) return (userProfile as any).studentSection;
    if (userProfile?.class) return userProfile.class;
    if (userProfile?.className) return userProfile.className;

    // Search academic lists by student ID or student code
    const studentId = userProfile?.id || (userProfile as any)?.uid || (userProfile as any)?.studentId;
    const studentCode = (userProfile as any)?.studentCode || (userProfile as any)?.code;
    if (studentId || studentCode) {
      const cleanId = String(studentId || '').trim().toLowerCase();
      const cleanCode = String(studentCode || '').trim().toLowerCase();
      const matchedList = (academicLists || []).find((list: any) => {
        const listStudents = Array.isArray(list.students) ? list.students : [];
        return listStudents.some((s: any) => {
          const sid = String(s.id || '').trim().toLowerCase();
          const scode = String(s.student || s.code || '').trim().toLowerCase();
          return (cleanId && sid === cleanId) || (cleanCode && scode === cleanCode);
        });
      });
      if (matchedList?.name) {
        return matchedList.name;
      }
    }
    return null;
  }, [isTeacher, userProfile, academicLists]);

  const [schoolTeachersList, setSchoolTeachersList] = useState<any[]>(() => {
    try {
      return staffService.getCachedTeachers(resolvedSchoolId) || [];
    } catch {
      return [];
    }
  });

  // 2. Real-time sync for teachers data so teacher list, photos, and assignments reflect immediately
  useEffect(() => {
    if (!resolvedSchoolId) return;
    const syncTeacherFromList = (teachersList: any[]) => {
      if (Array.isArray(teachersList)) {
        setSchoolTeachersList(teachersList);
      }
      if (isTeacher) {
        const teacherId = currentTeacherData?.id || teacherData?.id;
        if (teacherId) {
          const fresh = teachersList.find(
            (t) => t.id === teacherId || (t.code && (t.code === teacherData?.code || t.code === currentTeacherData?.code))
          );
          if (fresh) {
            setCurrentTeacherData((prev: any) => ({ ...prev, ...fresh, classes: fresh.classes || [] }));
          }
        }
      }
    };

    const unsub = staffService.subscribeToTeachers(resolvedSchoolId, syncTeacherFromList);

    const handleWindowTeachersUpdated = () => {
      staffService.getTeachers(resolvedSchoolId).then((freshList) => {
        if (Array.isArray(freshList)) {
          syncTeacherFromList(freshList);
        }
      });
    };
    window.addEventListener('teachers_updated', handleWindowTeachersUpdated);

    return () => {
      unsub();
      window.removeEventListener('teachers_updated', handleWindowTeachersUpdated);
    };
  }, [resolvedSchoolId, isTeacher, teacherData?.id, teacherData?.code, currentTeacherData?.id, currentTeacherData?.code]);

  // 3. Dropdown ref and click-outside handler
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Compute all assigned sections as registered in administration (strictly excluding archived lists)
  const teacherAssignedSections = useMemo<{ name: string; grade: string; studentCount: number; listId?: string }[]>(() => {
    if (!isTeacher) return [];
    const tData = currentTeacherData || teacherData;
    if (!tData) return [];

    const normArabic = (s: string) => normalizeArabicText(s || '');
    const normGrade = (s: string) => normalizeGradeName(s || '');

    // Collect all raw assigned grade/class strings (excluding archived)
    const rawAssignedRaw = new Set<string>();
    const hasClasses = Array.isArray(tData.classes) && tData.classes.length > 0;
    if (hasClasses) {
      tData.classes.forEach((c: string) => {
        if (c && typeof c === 'string' && !isArchivedList(c)) rawAssignedRaw.add(c.trim());
      });
    }
    if (tData.grade && typeof tData.grade === 'string' && !hasClasses && !isArchivedList(tData.grade)) {
      rawAssignedRaw.add(tData.grade.trim());
    }
    if (!hasClasses && tData.classCodes && typeof tData.classCodes === 'object') {
      Object.keys(tData.classCodes).forEach(k => {
        if (k && k !== 'default' && k !== 'master' && !isArchivedList(k)) {
          rawAssignedRaw.add(k.trim());
        }
      });
    }

    const sectionsMap = new Map<string, { name: string; grade: string; studentCount: number; listId?: string }>();

    const isSpecificMatch = (listName: string, assigned: string) => {
      if (!listName || !assigned || isArchivedList(listName) || isArchivedList(assigned)) return false;
      const lTrim = listName.trim();
      const aTrim = assigned.trim();
      if (lTrim === aTrim) return true;
      if (normArabic(lTrim) === normArabic(aTrim)) return true;
      if (lTrim.endsWith(aTrim) || aTrim.endsWith(lTrim)) return true;
      if (lTrim.split(' - ').pop()?.trim() === aTrim.split(' - ').pop()?.trim()) return true;
      return false;
    };

    const isGenericGradeMatch = (listGrade: string, listName: string, assigned: string) => {
      if (!assigned || isArchivedList(assigned) || isArchivedList(listName) || isArchivedList(listGrade)) return false;
      const gAssigned = normGrade(assigned);
      const gList = normGrade(listGrade) || normGrade(listName);
      if (!gAssigned || !gList || gAssigned !== gList) return false;

      // Make sure assigned is truly a generic grade name and NOT a specific section
      const assignedCleaned = normArabic(assigned).replace(normArabic(gAssigned), '').trim();
      if (assignedCleaned.length > 0) return false;
      return true;
    };

    // Match against active (non-archived) academic_lists
    if (academicLists && academicLists.length > 0) {
      academicLists.forEach((list: any) => {
        if (!list || isArchivedList(list)) return;
        const listName = (list.name || '').trim();
        if (!listName || isArchivedList(listName)) return;

        const listStudents = Array.isArray(list.students) ? list.students : [];
        const listGrade = listStudents[0]?.grade || '';

        const matches = Array.from(rawAssignedRaw).some(assignedItem => {
          if (isArchivedList(assignedItem)) return false;
          if (isSpecificMatch(listName, assignedItem)) return true;
          if (isGenericGradeMatch(listGrade, listName, assignedItem)) return true;
          return false;
        });

        if (matches) {
          let count = listStudents.length;
          if (count === 0 && topStudents && topStudents.length > 0) {
            count = topStudents.filter((st: any) => {
              const sNorm = normArabic(st.grade || '');
              return sNorm === normArabic(listName);
            }).length;
          }

          sectionsMap.set(listName, {
            name: listName,
            grade: listGrade || normGrade(listName) || listName,
            studentCount: count,
            listId: list.id
          });
        }
      });
    }

    // Include raw items not covered by specific academicLists
    if (sectionsMap.size === 0 && rawAssignedRaw.size > 0) {
      rawAssignedRaw.forEach(rawItem => {
        if (!isArchivedList(rawItem)) {
          sectionsMap.set(rawItem, {
            name: rawItem,
            grade: normGrade(rawItem) || rawItem,
            studentCount: 0
          });
        }
      });
    }

    // Final fallback
    if (sectionsMap.size === 0) {
      const fallback = (!isArchivedList(tData.grade) ? tData.grade : '') || 
                       (Array.isArray(tData.classes) && tData.classes.find((c: string) => !isArchivedList(c))) || 
                       "الصف الدراسي";
      sectionsMap.set(fallback, {
        name: fallback,
        grade: fallback,
        studentCount: 0
      });
    }

    return Array.from(sectionsMap.values()).filter(sec => !isArchivedList(sec.name));
  }, [isTeacher, currentTeacherData, teacherData, academicLists, topStudents]);

  const [selectedTeacherClass, setSelectedTeacherClass] = useState<string>("");

  // Helper to resolve exact students belonging to a section or across all assigned sections
  const getSectionStudents = useCallback((sectionName: string) => {
    const normArabic = (s: string) => normalizeArabicText(s || '');

    const enrichStudent = (item: any, fallbackGrade?: string) => {
      const code = (item.code || item.student || item.id || '').toString().trim();
      const name = (item.name || '').trim();
      const normName = normArabic(name);

      const foundInTop = (topStudents || []).find((st: any) => {
        const stCode = (st.code || st.student || st.id || '').toString().trim();
        if (code && stCode && stCode === code) return true;
        if (normName && st.name && normArabic(st.name) === normName) return true;
        return false;
      });

      if (foundInTop) {
        return {
          ...foundInTop,
          ...item,
          id: foundInTop.id || item.id || code || `st_${name}`,
          name: name || foundInTop.name,
          grade: fallbackGrade || item.grade || foundInTop.grade,
          code: code || foundInTop.code || foundInTop.student || '',
          totalPoints: foundInTop.totalPoints !== undefined ? foundInTop.totalPoints : (item.totalPoints || 0),
          averagePercent: foundInTop.averagePercent !== undefined ? foundInTop.averagePercent : (item.averagePercent || 0),
          attendance: foundInTop.attendance !== undefined ? foundInTop.attendance : (item.attendance !== undefined ? item.attendance : 100),
          badges: foundInTop.badges || item.badges || [],
          status: foundInTop.status || item.status || 'نشط'
        };
      }

      return {
        id: item.id || code || `st_${name}`,
        name: name || 'طالب',
        grade: fallbackGrade || item.grade || '',
        code: code,
        totalPoints: item.totalPoints || 0,
        averagePercent: item.averagePercent || 0,
        attendance: item.attendance !== undefined ? item.attendance : 100,
        badges: item.badges || [],
        status: item.status || 'نشط'
      };
    };

    const getStudentsForSingleSection = (sec: { name: string; grade: string; studentCount: number; listId?: string }) => {
      // 1. Find matching academic list
      let matchedList = sec.listId ? (academicLists || []).find((l: any) => l.id === sec.listId) : null;
      if (!matchedList) {
        matchedList = (academicLists || []).find((l: any) => normArabic(l.name) === normArabic(sec.name));
      }

      if (matchedList && Array.isArray(matchedList.students) && matchedList.students.length > 0) {
        return matchedList.students.map((st: any) => enrichStudent(st, sec.name));
      }

      // 2. Strict match by section name in topStudents
      const secNorm = normArabic(sec.name);
      const filtered = (topStudents || []).filter((st: any) => {
        const sNorm = normArabic(st.grade || '');
        return sNorm === secNorm;
      });

      if (filtered.length > 0) {
        return filtered;
      }

      // 3. Fallback: match by section property or exact grade
      return (topStudents || []).filter((st: any) => {
        const sGrade = normArabic(st.grade || '');
        const sSec = normArabic(st.section || '');
        return sSec === secNorm || sGrade === secNorm;
      });
    };

    const isAll = !sectionName || sectionName === "ALL" || sectionName === "كافة الشُعب" || sectionName === "all";

    if (isAll) {
      if (!teacherAssignedSections || teacherAssignedSections.length === 0) {
        return topStudents;
      }

      const map = new Map<string, any>();
      teacherAssignedSections.forEach(sec => {
        const secStudents = getStudentsForSingleSection(sec);
        secStudents.forEach(st => {
          const key = (st.code || st.id || st.name || '').toString().trim();
          if (key && !map.has(key)) {
            map.set(key, st);
          }
        });
      });

      return Array.from(map.values());
    }

    // Specific section
    const targetSec = (teacherAssignedSections || []).find(s => s.name === sectionName);
    if (targetSec) {
      return getStudentsForSingleSection(targetSec);
    }

    // Direct search if not found in assigned sections
    const directList = (academicLists || []).find((l: any) => normArabic(l.name) === normArabic(sectionName));
    if (directList && Array.isArray(directList.students) && directList.students.length > 0) {
      return directList.students.map((st: any) => enrichStudent(st, sectionName));
    }

    const targetNorm = normArabic(sectionName);
    return (topStudents || []).filter((st: any) => normArabic(st.grade || '') === targetNorm);
  }, [teacherAssignedSections, academicLists, topStudents]);

  const allTeacherAssignedStudents = useMemo(() => {
    return getSectionStudents("ALL");
  }, [getSectionStudents]);

  const formatStudentCount = (count: number) => {
    if (count === 1) return "طالب واحد";
    if (count === 2) return "طالبان";
    if (count >= 3 && count <= 10) return `${count} طلاب`;
    return `${count} طالباً`;
  };

  // Synchronize selectedTeacherClass with available sections
  useEffect(() => {
    if (!isTeacher || teacherAssignedSections.length === 0) return;

    if (!selectedTeacherClass) {
      if (teacherAssignedSections.length > 1) {
        setSelectedTeacherClass("ALL");
      } else {
        setSelectedTeacherClass(teacherAssignedSections[0].name);
      }
      return;
    }

    if (selectedTeacherClass !== "ALL") {
      const exists = teacherAssignedSections.some(s => s.name === selectedTeacherClass);
      if (!exists) {
        if (teacherAssignedSections.length > 1) {
          setSelectedTeacherClass("ALL");
        } else {
          setSelectedTeacherClass(teacherAssignedSections[0].name);
        }
      }
    }
  }, [teacherAssignedSections, isTeacher, selectedTeacherClass]);
  const [activeLiveMaterialIndex, setActiveLiveMaterialIndex] = useState<number | null>(null);
  const [activeLiveTeacherName, setActiveLiveTeacherName] = useState<string | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [liveTitle, setLiveTitle] = useState(
    "مراجعة وزاريات الوحدة الأولى وقواعد الماضي والمضارع",
  );
  const [liveStreamType, setLiveStreamType] = useState<'webrtc' | 'youtube'>('youtube');
  const [youtubeLiveUrl, setYoutubeLiveUrl] = useState<string>('');
  const [activeYoutubeVideoId, setActiveYoutubeVideoId] = useState<string | null>(null);

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
    const clean = url.trim();
    if (clean.length === 11) return clean;
    return null;
  };

  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(false);
  const [teacherCameraEnabled, setTeacherCameraEnabled] = useState(false);
  const [teacherMicEnabled, setTeacherMicEnabled] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [selectedQuality, setSelectedQuality] = useState("1085p");
  const [studentLiveControls, setLocalStudentLiveControls] = useState<
    Record<string, { micEnabled: boolean; camEnabled: boolean; boardEnabled?: boolean }>
  >({});

  const setStudentLiveControls = (callbackOrValue: any) => {
    setLocalStudentLiveControls((prev) => {
      const nextValue = typeof callbackOrValue === 'function' ? callbackOrValue(prev) : callbackOrValue;
      if (resolvedSchoolId && targetBroadcastGrade) {
        setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          studentLiveControls: nextValue
        }, { merge: true }).catch(console.error);
      }
      return nextValue;
    });
  };
  
  // --- INTERACTIVE LIVE CLASSROOM PRO STATE CONTROLS ---
  type HandRaiseStatus = "pending" | "approved" | "rejected";
  interface HandRaiseRequest {
    id: string;
    name: string;
    timestamp: number;
    status: HandRaiseStatus;
  }
  const [handRaises, setLocalHandRaises] = useState<HandRaiseRequest[]>([]);

  const setHandRaises = (callbackOrValue: HandRaiseRequest[] | ((prev: HandRaiseRequest[]) => HandRaiseRequest[])) => {
    setLocalHandRaises((prev) => {
      const nextValue = typeof callbackOrValue === 'function' ? callbackOrValue(prev) : callbackOrValue;
      if (resolvedSchoolId && targetBroadcastGrade) {
        // sync asynchronously
        setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          handRaises: nextValue
        }, { merge: true }).catch(console.error);
      }
      return nextValue;
    });
  };

  interface LiveQuestion {
    id: string;
    name: string;
    text: string;
    timestamp: number;
    pinned?: boolean;
  }
  const [liveQuestions, setLocalLiveQuestions] = useState<LiveQuestion[]>([]);

  const setLiveQuestions = (callbackOrValue: LiveQuestion[] | ((prev: LiveQuestion[]) => LiveQuestion[])) => {
    setLocalLiveQuestions((prev) => {
      const nextValue = typeof callbackOrValue === 'function' ? callbackOrValue(prev) : callbackOrValue;
      if (resolvedSchoolId && targetBroadcastGrade) {
        setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          liveQuestions: nextValue
        }, { merge: true }).catch(console.error);
      }
      return nextValue;
    });
  };
  const [pinnedQuestion, setLocalPinnedQuestion] = useState<LiveQuestion | null>(null);

  const setPinnedQuestion = (callbackOrValue: LiveQuestion | null | ((prev: LiveQuestion | null) => LiveQuestion | null)) => {
    setLocalPinnedQuestion((prev) => {
      const nextValue = typeof callbackOrValue === 'function' ? callbackOrValue(prev) : callbackOrValue;
      if (resolvedSchoolId && targetBroadcastGrade) {
        setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          pinnedQuestion: nextValue
        }, { merge: true }).catch(console.error);
      }
      return nextValue;
    });
  };

  // Instant Quiz
  interface QuizOption {
    text: string;
    percentage?: number;
  }
  interface LiveQuiz {
    id?: number;
    question: string;
    options: string[];
    correctIndex: number;
    secondsRemaining: number;
    isActive: boolean;
    expiresAt?: number;
  }
  const [activeLiveQuiz, setActiveLiveQuiz] = useState<LiveQuiz | null>(null);
  const [quizResponses, setQuizResponses] = useState<any[]>([]); // { name, answerIndex, isCorrect, timeSpent }
  const [quizTimerActive, setQuizTimerActive] = useState(false);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState<number>(1);
  const [showDetailedQuizResults, setShowDetailedQuizResults] = useState(false);

  // Real-time broadcast and online classmate presence states
  const [realLiveAttendees, setRealLiveAttendees] = useState<any[]>([]);
  const [onlineSchoolUsers, setOnlineSchoolUsers] = useState<any[]>([]);
  const [showAttendeesDropdown, setShowAttendeesDropdown] = useState(false);
  const [showActiveKnightsDropdown, setShowActiveKnightsDropdown] = useState(false);
  const [invitedStudents, setInvitedStudents] = useState<Record<string, boolean>>({});

  // Live Interactions & Reactions
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    understood: 0,
    confused: 0,
    excellent: 0,
  });
  const [clickingLiveReaction, setClickingLiveReaction] = useState<string | null>(null);

  const handleSendLiveStreamReaction = async (type: string) => {
    if (!resolvedSchoolId || !targetBroadcastGrade) return;
    
    try {
      setClickingLiveReaction(type);
      setTimeout(() => setClickingLiveReaction(null), 300);

      const ref = doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`);
      await updateDoc(ref, {
        [`reactionCounts.${type}`]: increment(1)
      });
      showToast("تم الإرسال!", "success");
    } catch(err) {
      console.error(err);
    }
  };
  const [floatingEmojis, setFloatingEmojis] = useState<any[]>([]);

  // Smart Blackboard Shared Strokes
  interface DrawStroke {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    thickness: number;
    type: "pencil" | "line" | "rect" | "circle" | "arrow" | "text" | "eraser";
    text?: string;
    groupId?: string;
  }
  const [isWhiteboardActive, setIsWhiteboardActive] = useState(false);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<DrawStroke[]>([]);
  const [whiteboardImage, setWhiteboardImage] = useState<string | null>(null); // explaining on worksheet custom images!
  const [boardImageScale, setBoardImageScale] = useState<number>(1);
  const [teacherLiveSubTab, setTeacherLiveSubTab] =
    useState<string>("settings");
  const [boardColor, setBoardColor] = useState("#00E5FF");
  const [brushThickness, setBrushThickness] = useState(3);
  const [boardTextSize, setBoardTextSize] = useState(24);
  const [boardTool, setBoardTool] = useState<
    | "pencil"
    | "line"
    | "rect"
    | "circle"
    | "arrow"
    | "text"
    | "eraser"
    | "pointer"
    | "laser"
  >("pencil");
  const [boardTextContent, setBoardTextContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | string | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState<number>(1);
  const [pdfPageNumber, setPdfPageNumber] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1);
  const [sharedPdfPageBase64, setSharedPdfPageBase64] = useState<string | null>(null);
  const [currentShape, setCurrentShape] = useState<DrawStroke | null>(null);

  const [studentCanDraw, setStudentCanDraw] = useState(false);
  const [laserPosition, setLaserPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [cameraLayout, setCameraLayout] = useState<"default" | "pip">("default"); // PiP mode for camera below board

  // PiP Draggable & Shape state
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 });
  const [pipShape, setPipShape] = useState<"square" | "round">("square");
  const [isDraggingPip, setIsDraggingPip] = useState(false);
  const pipDragStart = useRef({ x: 0, y: 0, startPipX: 0, startPipY: 0 });

  // Drawing refs
  const isDrawingRef = useRef(false);
  const laserTimeoutRef = useRef<any>(null);
  const startDrawPos = useRef({ x: 0, y: 0 });
  const lastDrawPos = useRef({ x: 0, y: 0 });
  const currentStrokeGroupId = useRef<string | null>(null);
  const lastSyncedStrokesRef = useRef<string | null>(null);

  const mapGradeForDocument = (raw: string) => {
    if (!raw) return "";
    let s = raw.trim();
    if (s === "الكل" || s === "عام" || s === "جميع المراحل") return "الكل";
    // Normalize Hamza, Ta-Marbuta, and Alef Maksura
    s = s.replace(/[أإآ]/g, "ا")
         .replace(/ة/g, "ه")
         .replace(/ى/g, "ي");
    // Remove the word "الصف" wherever it appears to unify grades (e.g. "الصف السادس" vs "السادس")
    s = s.replace(/(^|\s)الصف(\s|$)/g, " ");
    // Normalize prefix "ال" on any word to ensure full alignment
    s = s.replace(/^ال/, "");
    s = s.replace(/\s+ال/g, " ");
    s = s.replace("الابتدائي", "ابتدائي")
         .replace("المتوسط", "متوسط")
         .replace("العلمي", "علمي")
         .replace("الأدبي", "أدبي")
         .replace("ابتدائى", "ابتدائي")
         .replace("ابتداي", "ابتدائي");
    // Strip trailing section designations e.g. "- أ" or "(أ)" or " أ"
    s = s.replace(/[\s\-_–—]+(شعبة\s*)?[أ-يA-Za-z0-9]$/, "");
    return s.replace(/\s+/g, " ").trim();
  };

  const targetBroadcastGrade = mapGradeForDocument(
    isTeacher
      ? (selectedTeacherClass && selectedTeacherClass !== "ALL" ? selectedTeacherClass : null) ||
        (teacherAssignedSections[0]?.name) ||
        (currentTeacherData?.classes && Array.isArray(currentTeacherData.classes) && currentTeacherData.classes[0]) ||
        (teacherData?.classes && Array.isArray(teacherData.classes) && teacherData.classes[0]) ||
        "سادس علمي"
      : gradeName || grade || "",
  );

  useEffect(() => {
    if (!resolvedSchoolId || !targetBroadcastGrade) return;

    const timer = setTimeout(async () => {
      try {
        const strokeStr = JSON.stringify(whiteboardStrokes);
        if (lastSyncedStrokesRef.current === strokeStr) return;
        lastSyncedStrokesRef.current = strokeStr;
        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          whiteboardStrokes: strokeStr
        }, { merge: true });
      } catch (err) {
        console.error("Sync stroke error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [whiteboardStrokes, isLiveActive, isTeacher, resolvedSchoolId, targetBroadcastGrade]);

  // 1) Subscription to live broadcast viewers/attendees (subcollection "viewers")
  useEffect(() => {
    if (!resolvedSchoolId || !targetBroadcastGrade) return;
    const viewersColRef = collection(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`, "viewers");
    const unsub = onSnapshot(viewersColRef, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRealLiveAttendees(list);
    }, (err) => {
      console.error("Failed to fetch live broadcast watchers:", err);
    });
    return () => unsub();
  }, [resolvedSchoolId, targetBroadcastGrade, isTeacher, userProfile?.role]);

  // 2) Subscription to general school online users
  useEffect(() => {
    if ((!isTeacher && userProfile?.role !== 'admin') || !resolvedSchoolId) return;
    const onlineColRef = collection(db, "schools", resolvedSchoolId, "online_users");
    const unsub = onSnapshot(onlineColRef, (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setOnlineSchoolUsers(list);
    }, (err) => {
      console.error("Failed to fetch general online classmates:", err);
    });
    return () => unsub();
  }, [resolvedSchoolId, isTeacher, userProfile?.role]);

  useEffect(() => {
    if ((!isTeacher && userProfile?.role !== 'admin') || !resolvedSchoolId || !targetBroadcastGrade) return;
    const refPath = collection(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`, "responses");
    const unsubQuiz = onSnapshot(refPath, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setQuizResponses(list);
    }, (err) => {
      console.error("Failed to fetch live quiz responses:", err);
    });
    return () => {
      unsubQuiz();
    };
  }, [resolvedSchoolId, targetBroadcastGrade, isTeacher, userProfile?.role]);

  useEffect(() => {
    if (!resolvedSchoolId || !targetBroadcastGrade) return;
    const docRef = doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Compute heartbeat check safely to avoid NaN issues with clock alignment
        const hbTime = data.heartbeat?.toMillis
          ? data.heartbeat.toMillis()
          : (typeof data.heartbeat === 'number' ? data.heartbeat : 0);

        const upTime = data.updatedAt?.toMillis
          ? data.updatedAt.toMillis()
          : (typeof data.updatedAt === 'number' ? data.updatedAt : 0);

        const stTime = data.startTime?.toMillis
          ? data.startTime.toMillis()
          : (typeof data.startTime === 'number' ? data.startTime : 0);

        // Always trust the database's explicit isLiveActive status to eliminate any client/server clock-skew bugs
        const isSessionStale = false;
        
        console.log("[DEBUG Student/Teacher Live] docPath:", `${resolvedSchoolId}_${targetBroadcastGrade}`, "session stats: ", { hbTime, upTime, stTime, isSessionStale, dataIsLiveActive: data.isLiveActive });

        
        // For the teacher, the broadcast is ONLY active if starting in current tab/session (survives page refresh)
        const isBroadcastingSessionLocal = safeSessionStorage.getItem("s6_is_broadcasting") === "true";

        // TEMPORARILY DISABLED: The self-healing logic might be immediately killing the stream in iframes
        // if (isTeacher) {
        //   if (data.isLiveActive) {
        //     // If the database thinks a stream is active, but we didn't start it in this session
        //     // we immediately clean up Firestore (self-healing ghost streams)
        //     if (!isBroadcastingSessionLocal) {
        //       updateDoc(docRef, {
        //         isLiveActive: false,
        //         isLive: false,
        //         activeLiveQuizStr: null
        //       }).catch(console.error);
        //
        //       setIsLiveActive(false);
        //       setActiveLiveMaterialIndex(null);
        //       setActiveLiveTeacherName(null);
        //       return;
        //     }
        //   }
        // }

        if (data.isLiveActive && !isSessionStale) {
          setIsLiveActive(true);
          setActiveLiveMaterialIndex(data.materialIndex ?? null);
          setActiveLiveTeacherName(data.teacherName || data.teacherId || null);
          if (data.title) setLiveTitle(data.title);
          if (data.streamType) setLiveStreamType(data.streamType);
          if (data.youtubeUrl !== undefined) setYoutubeLiveUrl(data.youtubeUrl || '');
          if (data.youtubeVideoId !== undefined) setActiveYoutubeVideoId(data.youtubeVideoId || null);
          if (data.isWhiteboardActive !== undefined) setIsWhiteboardActive(data.isWhiteboardActive);
          if (data.cameraLayout !== undefined) setCameraLayout(data.cameraLayout);
          if (data.whiteboardImage !== undefined) setWhiteboardImage(data.whiteboardImage);
          if (data.cameraEnabled !== undefined) setTeacherCameraEnabled(!!data.cameraEnabled);
          else if (data.isCameraOn !== undefined) setTeacherCameraEnabled(!!data.isCameraOn);
          else if (data.teacherVideoActive !== undefined) setTeacherCameraEnabled(!!data.teacherVideoActive);
          else if (data.camEnabled !== undefined) setTeacherCameraEnabled(!!data.camEnabled);

          if (data.micEnabled !== undefined) setTeacherMicEnabled(!!data.micEnabled);
          else if (data.isMicOn !== undefined) setTeacherMicEnabled(!!data.isMicOn);
          else if (data.teacherMicActive !== undefined) setTeacherMicEnabled(!!data.teacherMicActive);
          if (!isTeacher && data.activeContentSession !== undefined) setLocalActiveContentSession(data.activeContentSession || null);
          if (data.sharedPdfPageBase64 !== undefined) setSharedPdfPageBase64(data.sharedPdfPageBase64);
          if (data.pdfScale !== undefined) setPdfScale(data.pdfScale);
          if (data.studentCanDraw !== undefined) setStudentCanDraw(data.studentCanDraw);
          if (data.handRaises !== undefined) {
             setLocalHandRaises(data.handRaises);
          }
          if (data.liveQuestions !== undefined) {
             setLocalLiveQuestions(data.liveQuestions);
          }
          if (data.pinnedQuestion !== undefined) {
             setLocalPinnedQuestion(data.pinnedQuestion);
          }
          if (data.reactionCounts !== undefined) {
             setReactionCounts(data.reactionCounts);
          }
          if (data.studentLiveControls !== undefined) {
             setLocalStudentLiveControls(data.studentLiveControls);
          }
          if (data.whiteboardStrokes !== undefined) {
            try {
              const parsed = JSON.parse(data.whiteboardStrokes);
              setWhiteboardStrokes(prev => {
                if (JSON.stringify(prev) === data.whiteboardStrokes) return prev;
                return parsed;
              });
            } catch (e) {
               console.error("failed to parse strokes", e);
             }
          }
          if (data.activeLiveQuizStr !== undefined && !isTeacher) {
            try {
               const parsedQ = data.activeLiveQuizStr ? JSON.parse(data.activeLiveQuizStr) : null;
               
               // Validate that the quiz is format-compliant (must have id and expiresAt)
               // This specifically prevents legacy ghost-quizzes from appearing and looping.
               if (!parsedQ || !parsedQ.id || !parsedQ.expiresAt) {
                 setActiveLiveQuiz(null);
               } else {
                 const now = Date.now();
                 if (now >= parsedQ.expiresAt) {
                   parsedQ.isActive = false;
                   parsedQ.secondsRemaining = 0;
                 } else {
                   parsedQ.secondsRemaining = Math.max(0, Math.floor((parsedQ.expiresAt - now) / 1000));
                 }
                 
                 setActiveLiveQuiz(prev => {
                    if (!parsedQ) return null;
                    if (prev && parsedQ.isActive) {
                      if (prev.id && prev.id === parsedQ.id) return prev;
                    }
                    return parsedQ;
                 });
               }
            } catch (e) {}
          }
        } else {
          setIsLiveActive(false);
          setActiveLiveMaterialIndex(null);
          setActiveLiveTeacherName(null);
          if (!isTeacher) setLocalActiveContentSession(null);
        }
      } else {
        setIsLiveActive(false);
        setActiveLiveMaterialIndex(null);
        setActiveLiveTeacherName(null);
        if (!isTeacher) setLocalActiveContentSession(null);
      }
    }, (error) => {
      console.warn("Live sessions subscription error:", error);
    });
    return () => unsub();
  }, [resolvedSchoolId, targetBroadcastGrade, isTeacher]);

  useEffect(() => {
    const handleUp = () => setIsDraggingPip(false);
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingPip) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - pipDragStart.current.x;
      const dy = clientY - pipDragStart.current.y;
      setPipPosition({
        x: pipDragStart.current.startPipX + dx,
        y: pipDragStart.current.startPipY + dy,
      });
    };

    if (isDraggingPip) {
      window.addEventListener("mousemove", handleMove, { passive: false });
      window.addEventListener("mouseup", handleUp);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDraggingPip]);

  const onPipDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingPip(true);
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    pipDragStart.current = {
      x: clientX,
      y: clientY,
      startPipX: pipPosition.x,
      startPipY: pipPosition.y,
    };
  };

  // Smart Attendance
  interface AttendanceLog {
    studentId: string;
    name: string;
    enterTime: number;
    watchDuration: number; // in seconds
    attendancePercent: number;
  }
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceLog[]>(
    [
      {
        studentId: "real_st_1",
        name: "محمد رسول الأسدي",
        enterTime: Date.now() - 50000,
        watchDuration: 4200,
        attendancePercent: 99,
      },
      {
        studentId: "real_st_2",
        name: "فاطمة الزهراء عمار",
        enterTime: Date.now() - 40000,
        watchDuration: 3950,
        attendancePercent: 98,
      },
      {
        studentId: "real_st_3",
        name: "حسن علي الخفاجي",
        enterTime: Date.now() - 30000,
        watchDuration: 3800,
        attendancePercent: 97,
      },
      {
        studentId: "real_st_4",
        name: "زينب ميثم الكعبي",
        enterTime: Date.now() - 20000,
        watchDuration: 4300,
        attendancePercent: 100,
      },
      {
        studentId: "real_st_5",
        name: "جعفر جبار الوائلي",
        enterTime: Date.now() - 10000,
        watchDuration: 3500,
        attendancePercent: 95,
      },
    ],
  );
  const [studentWatchSeconds, setStudentWatchSeconds] = useState(0);
  const [studentQuizAnswered, setStudentQuizAnswered] = useState<number | null>(
    null,
  );
  const [studentQuizCorrect, setStudentQuizCorrect] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (activeLiveQuiz && activeLiveQuiz.isActive && activeLiveQuiz.secondsRemaining >= 58) {
      setStudentQuizAnswered(null);
      setStudentQuizCorrect(null);
    }
  }, [activeLiveQuiz?.question, activeLiveQuiz?.isActive]);
  const [studentQuestionsSubmittedCount, setStudentQuestionsSubmittedCount] =
    useState(0);
  const [studentPrivateNotes, setStudentPrivateNotes] = useState("");
  const [savedStudentNotes, setSavedStudentNotes] = useState<string[]>([]);
  const [showAchievementCard, setShowAchievementCard] = useState(false);
  const [isWindowObscured, setIsWindowObscured] = useState(false);

  const handleDownloadBoard = () => {
    if (!whiteboardImage) {
      showToast("لا توجد شاشة سبورة لتحميلها", "error");
      return;
    }
    // Simple download logic
    const a = document.createElement("a");
    a.href =
      whiteboardImage === "pdf_viewer"
        ? (pdfFile as string) || ""
        : whiteboardImage || "";
    a.download = `whiteboard_snapshot_${new Date().getTime()}.${whiteboardImage === "pdf_viewer" ? "pdf" : "png"}`;
    a.click();
    showToast("تم تنزيل نسخة من السبورة لجهازك ⬇️", "success");
  };

  useEffect(() => {
    if (!isTeacher) {
      const handleVisibilityChange = () => {
        setIsWindowObscured(document.hidden);
      };
      const handleBlur = () => setIsWindowObscured(true);
      const handleFocus = () => setIsWindowObscured(false);

      const preventScreenshot = (e: KeyboardEvent) => {
        if (
          e.key === "PrintScreen" ||
          (e.metaKey &&
            e.shiftKey &&
            (e.key === "4" || e.key === "3" || e.key === "s" || e.key === "S"))
        ) {
          e.preventDefault();
          showToast(
            "يُمنع أخذ لقطات شاشة أو تسجيل الشاشة لضمان حقوق النشر 🔒",
            "error",
          );
          copyToClipboard("غير مسموح بنسخ المحتوى");
        }
      };

      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
      window.addEventListener("focus", handleFocus);
      document.addEventListener("keyup", preventScreenshot);
      document.addEventListener("keydown", preventScreenshot);

      const studentContainer = document.getElementById(
        "student-stream-container",
      );
      if (studentContainer) {
        studentContainer.addEventListener("contextmenu", preventContextMenu);
      }

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("keyup", preventScreenshot);
        document.removeEventListener("keydown", preventScreenshot);
        if (studentContainer) {
          studentContainer.removeEventListener(
            "contextmenu",
            preventContextMenu,
          );
        }
      };
    }
  }, [activeTab]);

  // Lesson Recording saving
  interface RecordedLesson {
    id: string;
    title: string;
    subject: string;
    grade: string;
    duration: string;
    date: string;
    videoUrl?: string; // Optional embedded video link or YouTube url
    description?: string;
    views?: number;
    allowDownload?: boolean;
  }
  interface SchoolFile {
    id: string;
    name: string;
    title: string;
    size: string;
    downloads: number;
    tag: string;
    subject: string;
    grade: string;
    schoolId: string;
    section?: string;
    createdAt?: any;
    fileUrl?: string;
    publishDate?: string;
    rating?: number;
    allowDownload?: boolean;
  }
  const [isRecordingFinishedModalOpen, setIsRecordingFinishedModalOpen] =
    useState(false);
  const [recordedLessons, setRecordedLessons] = useState<RecordedLesson[]>([]);
  const [schoolFiles, setSchoolFiles] = useState<SchoolFile[]>([]);
  const [schoolQuestions, setSchoolQuestions] = useState<any[]>([]);
  const [schoolExamPapers, setSchoolExamPapers] = useState<any[]>([]);
  const [teacherAiResults, setTeacherAiResults] = useState<any[]>([]);

  useEffect(() => {
    if (!resolvedSchoolId) return;
    const q = query(
      collection(db, "schools", resolvedSchoolId, "ai_materials"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeacherAiResults(results);
    }, (error) => {
      console.error("Failed to fetch ai_materials", error);
    });
    return () => unsubscribe();
  }, [resolvedSchoolId]);

  const [studentSubmissions, setStudentSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (!resolvedSchoolId || isTeacher) return;
    const studentId = userProfile?.id || "unknown";
    if (studentId === "unknown") return;

    const q = query(
      collection(db, "schools", resolvedSchoolId, "activities_submissions"),
      where("studentId", "==", studentId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentSubmissions(results);
    }, (error) => {
      console.error("Failed to fetch student activities_submissions", error);
    });
    return () => unsubscribe();
  }, [resolvedSchoolId, userProfile?.id, isTeacher]);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [viewingRecordedLesson, setViewingRecordedLesson] = useState<RecordedLesson | null>(null);
  const [viewingHomework, setViewingHomework] = useState<any | null>(null);
  const [aiEvaluationResult, setAiEvaluationResult] = useState<any | null>(null);
  const [viewingCompetition, setViewingCompetition] = useState<any | null>(null);
  const [viewingSubmissionFeedback, setViewingSubmissionFeedback] = useState<any | null>(null);
  const [homeworkAnswer, setHomeworkAnswer] = useState('');
  const [competitionAnswers, setCompetitionAnswers] = useState<Record<number, number>>({});
  const [competitionScore, setCompetitionScore] = useState<number | null>(null);
  const [competitionTimer, setCompetitionTimer] = useState<number>(60);

  useEffect(() => {
    let interval;
    if (viewingCompetition && competitionScore === null && competitionTimer > 0) {
      interval = setInterval(() => {
        setCompetitionTimer(prev => prev - 1);
      }, 1000);
    } else if (competitionTimer === 0 && competitionScore === null && viewingCompetition) {
      // Auto submit
      let score = 0;
      let quizData = null;
      try {
        const jsonMatch = viewingCompetition.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          quizData = JSON.parse(jsonMatch[1].trim());
        } else {
          quizData = JSON.parse(viewingCompetition.content);
        }
      } catch (e) {}
      
      if (quizData && quizData.questions) {
        quizData.questions.forEach((q, i) => {
          if (competitionAnswers[i] === q.correctAnswerIndex) score++;
        });
        setCompetitionScore(score);
        addDoc(collection(db, "schools", resolvedSchoolId, "activities_submissions"), {
          taskId: viewingCompetition.id,
          taskTitle: viewingCompetition.name,
          type: "competition",
          studentId: userProfile?.id || "unknown",
          studentName: userProfile?.studentName || userProfile?.name || userProfile?.fullName || "طالب",
          score: score,
          totalQuestions: quizData.questions.length,
          createdAt: serverTimestamp()
        }).catch(err => console.error(err));
      }
    }
    return () => clearInterval(interval);
  }, [viewingCompetition, competitionTimer, competitionScore, competitionAnswers]);

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showVideoLogs, setShowVideoLogs] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  const [videoDebugInfo, setVideoDebugInfo] = useState({
    url: "",
    httpStatus: "جاري الفحص...",
    mimeType: "جاري الفحص...",
    loadState: "جاري البدء...",
    metadata: "لا يوجد بيانات ميتا حتى الآن",
    playbackState: "متوقف",
    errorCode: "لا يوجد أخطاء",
    errorMessage: "لا يوجد",
    
    // Detailed required fields
    storageProvider: "غير معروف",
    videoId: "لا يوجد",
    fileName: "غير معروف",
    fileSize: "جاري الاستعلام...",
    downloadUrl: "",
    readyState: "HAVE_NOTHING (0)",
    networkState: "NETWORK_EMPTY (0)",
    stackTrace: "",
    errorComponent: "SchoolPlatform.tsx",
    errorFunction: "N/A",
    errorLine: "N/A",
    
    // Checks & Verifications
    uploadStatus: "جاري الفحص...",
    physicalStorageStatus: "جاري الفحص...",
    urlValidity: "جاري الفحص...",
    readPermissions: "جاري الفحص...",
    playerCorrectness: "جاري الفحص...",
    formatCompatibility: "جاري الفحص..."
  });

  useEffect(() => {
    if (!viewingRecordedLesson || !viewingRecordedLesson.videoUrl) return;
    
    const url = viewingRecordedLesson.videoUrl;
    const absoluteUrl = getSanitizedVideoUrl(url);
    
    // Determine storage provider
    let provider = "سيرفر خارجي مخصص";
    if (url.includes("/uploads/")) {
      provider = "Local Server Storage (fallback/public/uploads)";
    } else if (url.includes("amazon") || url.includes("amazonaws.com") || url.includes("s3")) {
      provider = "S3 (Amazon Web Services) Cloud Storage";
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      provider = "YouTube Stream Service";
    } else if (url.includes("vimeo.com")) {
      provider = "Vimeo Stream Service";
    }

    // Determine filename
    let nameOfFile = "رابط بث خارجي";
    if (url.includes("/uploads/")) {
      nameOfFile = url.split("/uploads/")[1]?.split("?")[0] || "ملف محلي";
    }

    // Determine url validity
    let isValidUrl = "⚠️ غير محدد";
    try {
      new URL(absoluteUrl);
      isValidUrl = "✅ رابط صالح وذو صيغة صحيحة";
    } catch (e) {
      isValidUrl = "❌ صيغة الرابط غير صالحة أو مكسورة";
    }

    setVideoDebugInfo({
      url: absoluteUrl,
      httpStatus: "جاري الاتصال والتحقق عبر السيرفر...",
      mimeType: "جاري تحديد النوع...",
      loadState: "جاري تهيئة مشغل الفيديو وقراءة الميتا...",
      metadata: "بانتظار تحميل الميتا...",
      playbackState: "جاري التحميل والمزامنة...",
      errorCode: "لا يوجد",
      errorMessage: "لا يوجد",
      
      storageProvider: provider,
      videoId: viewingRecordedLesson.id || "غير متوفر",
      fileName: nameOfFile,
      fileSize: "جاري الفحص المادي للملف...",
      downloadUrl: absoluteUrl,
      readyState: "HAVE_NOTHING (0)",
      networkState: "NETWORK_EMPTY (0)",
      stackTrace: "",
      errorComponent: "SchoolPlatform.tsx",
      errorFunction: "N/A",
      errorLine: "N/A",
      
      uploadStatus: url.includes("/uploads/") ? "✅ تم الرفع بنجاح" : "🌐 رابط خارجي مباشر",
      physicalStorageStatus: "جاري الاستعلام المادي عن الملف...",
      urlValidity: isValidUrl,
      readPermissions: "جاري التحقق من صلاحيات CORS والقراءة...",
      playerCorrectness: "✅ عنصر مشغل HTML5 نشط وجاهز للربط",
      formatCompatibility: "جاري تحديد الكودك والامتداد..."
    });

    console.log("🎥 ===== [فحص الفيديو] بدء فتح المحاضرة المرئية =====");
    console.log("🎥 رابط الفيديو المفتوح:", absoluteUrl);

    // Fetch the video status and headers via the safe server-side proxy to bypass CORS
    fetch("/api/check-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: absoluteUrl })
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("استجابة غير صالحة من السيرفر.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.error || data.status === 500) {
          console.error("❌ فشل فحص الرابط من السيرفر:", data.error || data.statusText);
          
          let compSupport = "❌ غير متوافق";
          if (videoRef.current && data.contentType) {
            const supportResult = videoRef.current.canPlayType(data.contentType);
            compSupport = supportResult === "" ? "❌ غير مدعوم في هذا المتصفح" : supportResult === "maybe" ? "⚠️ قد يعمل (Maybe)" : "✅ مدعوم بالكامل (Probably)";
          }

          setVideoDebugInfo(prev => ({
            ...prev,
            httpStatus: `فشل الفحص: ${data.statusText || "خطأ شبكة"}`,
            mimeType: data.contentType || "تعذر التحديد",
            fileSize: data.fileSize || "مجهول (خطأ في الملف)",
            loadState: `خطأ أثناء الاتصال: ${data.fileLocationInfo || "الملف قد لا يكون موجوداً"}`,
            physicalStorageStatus: data.localExists ? "✅ موجود مادياً على السيرفر" : "❌ مفقود من السيرفر (Physical File Missing)",
            readPermissions: "❌ فشل اختبار القراءة (أو الملف تالف/غير موجود)",
            formatCompatibility: compSupport
          }));
        } else {
          const statusText = `${data.status} ${data.statusText || "OK"}`;
          const contentType = data.contentType || "غير معروف";
          console.log("🎥 حالة HTTP للرابط (عبر السيرفر):", statusText);
          console.log("🎥 نوع MIME (Content-Type):", contentType);
          
          let compSupport = "⏳ قيد التحقق عند ربط المكون";
          if (videoRef.current && contentType) {
            const supportResult = videoRef.current.canPlayType(contentType);
            compSupport = supportResult === "" ? "❌ غير مدعوم في هذا المتصفح" : supportResult === "maybe" ? "⚠️ قد يعمل (Maybe)" : "✅ مدعوم بالكامل (Probably)";
          }

          setVideoDebugInfo(prev => ({
            ...prev,
            httpStatus: statusText,
            mimeType: contentType,
            fileSize: data.fileSize || "مجهول (لم يتم العثور على الطول)",
            loadState: data.localExists ? "الملف موجود مادياً على القرص وقابل للقراءة" : "تم التحقق من الرابط بنجاح",
            physicalStorageStatus: data.localExists ? "✅ موجود مادياً ومطابق للمسار" : "🌐 خارجي (موجود على مخزن خارجي)",
            readPermissions: data.status >= 200 && data.status < 300 ? "✅ صلاحيات قراءة ممتازة (HTTP 2xx)" : `⚠️ حالة استجابة غير اعتيادية (${data.status})`,
            formatCompatibility: compSupport
          }));
        }
      })
      .catch((err) => {
        console.error("❌ فشل فحص الرابط تماماً عبر الشبكة:", err);
        setVideoDebugInfo(prev => ({
          ...prev,
          httpStatus: "فشل الاتصال (تعذر التحقق عبر السيرفر)",
          mimeType: "فشل الاستعلام",
          fileSize: "غير معروف بسبب انقطاع الاتصال",
          physicalStorageStatus: "⚠️ تعذر الفحص",
          readPermissions: "❌ فشل الاتصال بالشبكة تماماً (Failed to fetch)"
        }));
      });
  }, [viewingRecordedLesson]);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("v=")) {
          videoId = url.split("v=")[1].split("&")[0];
        } else if (url.includes("youtu.be/")) {
          videoId = url.split("youtu.be/")[1].split("?")[0];
        } else if (url.includes("youtube.com/embed/")) {
          videoId = url.split("youtube.com/embed/")[1].split("?")[0];
        } else if (url.includes("youtube.com/shorts/")) {
          videoId = url.split("youtube.com/shorts/")[1].split("?")[0];
        }
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
      if (url.includes("vimeo.com")) {
        if (url.includes("player.vimeo.com/video/")) return url;
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        return `https://player.vimeo.com/video/${id}`;
      }
    } catch (e) {
      console.error("Video URL parsing error:", e);
    }
    return url;
  };
  const [viewingLessonNotes, setViewingLessonNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!viewingRecordedLesson || isTeacher) {
      setViewingLessonNotes([]);
      return;
    }
    const fetchNotes = async () => {
      try {
        const userId = getCurrentUserId();
        if (!auth.currentUser || !userId || userId === "guest") {
          return;
        }
        const q = query(
          collection(db, "student_live_notes"),
          where("userId", "==", userId),
          where("liveTitle", "==", viewingRecordedLesson.title)
        );
        const snap = await getDocs(q);
        const notes = snap.docs.map((d: any) => ({id: d.id, ...d.data()}));
        setViewingLessonNotes(notes.sort((a,b) => {
           const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
           const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
           return timeA - timeB;
        }));
      } catch (err) {
        console.warn("Notice: error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [viewingRecordedLesson, isTeacher]);

  useEffect(() => {
    if (!resolvedSchoolId) return;

    // Normalize student profile info for accurate SQL/Firebase filtering
    const studentGrade = mapGradeForDocument(userProfile?.grade || grade || "");
    const studentSection = userProfile?.section || userProfile?.class;

    // Fetch initial data from SQL API with filtering and Firestore fallback
    const fetchRecordedLessons = async () => {
      try {
        let url = `/api/recorded-lessons?schoolId=${encodeURIComponent(resolvedSchoolId)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const lessons = data.lessons || data.data || [];
          if (Array.isArray(lessons) && lessons.length > 0) {
            setRecordedLessons(prev => {
              const combined = [...lessons];
              prev.forEach(p => {
                if (!combined.find(c => c.id === p.id)) combined.push(p);
              });
              return combined.sort((a: any, b: any) => {
                const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
                const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
                return timeB - timeA;
              });
            });
            return;
          }
        }
      } catch (err) {
        console.warn("Notice: Error fetching recorded lessons from SQL, trying Firestore fallback:", err);
      }

      // Firestore fallback
      try {
        const q = query(collection(db, "recorded_lessons"), where("schoolId", "==", resolvedSchoolId));
        const snap = await getDocs(q).catch(() => null);
        if (snap && !snap.empty) {
          const fbLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setRecordedLessons(prev => {
            const combined = [...fbLessons];
            prev.forEach(p => {
              if (!combined.find(c => c.id === p.id)) combined.push(p);
            });
            return combined.sort((a: any, b: any) => {
              const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
              const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
              return timeB - timeA;
            });
          });
        }
      } catch (fbErr) {
        console.warn("Notice: Firestore recorded lessons fallback notice:", fbErr);
      }
    };

    fetchRecordedLessons();

    // Subscribe to real-time updates via SQL RealtimeManager
    const unsubRealtime = realtimeManager.subscribe('recorded_lessons', (payload) => {
      if (!payload) return;

      if (!payload.data) {
        fetchRecordedLessons();
        return;
      }

      if (payload.action === 'INSERT') {
        const newLesson = payload.data;
        const normG = (s: any) => String(s || "").trim().replace(/^ال/, '').replace(/\s+/g, '');
        const matchesGrade = isTeacher || !studentGrade || studentGrade === 'الكل' || !newLesson.grade || newLesson.grade === 'الكل' || newLesson.grade === 'عام' || normG(newLesson.grade) === normG(studentGrade) || normG(newLesson.grade).includes(normG(studentGrade)) || normG(studentGrade).includes(normG(newLesson.grade));
        const matchesSection = isTeacher || !studentSection || studentSection === 'الكل' || studentSection === 'all' || !newLesson.section || newLesson.section === 'all' || newLesson.section === 'الكل' || newLesson.section === studentSection;

        if ((newLesson.schoolId === resolvedSchoolId || newLesson.schoolId === 'school1') && matchesGrade && matchesSection) {
          setRecordedLessons(prev => [newLesson, ...prev.filter(l => l.id !== newLesson.id)]);
        }
      } else if (payload.action === 'UPDATE') {
        const updatedLesson = payload.data;
        setRecordedLessons(prev => prev.map(l => {
          if (l.id !== updatedLesson.id) return l;
          const newViews = updatedLesson.views !== undefined 
            ? updatedLesson.views 
            : (updatedLesson.incrementViews ? (l.views || 0) + 1 : l.views);
          
          let newComments = l.commentCount || l.comment_count || 0;
          if (updatedLesson.commentCount !== undefined) newComments = updatedLesson.commentCount;
          else if (updatedLesson.comment_count !== undefined) newComments = updatedLesson.comment_count;
          else if (updatedLesson.incrementComments) newComments = (l.commentCount || l.comment_count || 0) + 1;
          else if (updatedLesson.decrementComments) newComments = Math.max((l.commentCount || l.comment_count || 0) - 1, 0);

          return {
            ...l,
            ...updatedLesson,
            views: newViews,
            commentCount: newComments,
            comment_count: newComments,
          };
        }));
      } else if (payload.action === 'DELETE') {
        setRecordedLessons(prev => prev.filter(l => l.id !== payload.id));
      }
    });

    // Keep Firebase listener as a fallback
    const q = query(collection(db, "recorded_lessons"), where("schoolId", "==", resolvedSchoolId));
    const unsubFirebase = onSnapshot(q, (snap) => {
      const lessons = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RecordedLesson);
      setRecordedLessons(prev => {
        // Create a map of current lessons for easy lookup
        const lessonMap = new Map(prev.map(l => [l.id, l]));
        
        // Update or add lessons from snapshot
        lessons.forEach(l => {
          lessonMap.set(l.id, l);
        });
        
        // Convert map back to sorted array
        return Array.from(lessonMap.values()).sort((a, b) => {
          const timeA = (a as any).timestamp?.toMillis ? (a as any).timestamp.toMillis() : new Date(a.createdAt || 0).getTime();
          const timeB = (b as any).timestamp?.toMillis ? (b as any).timestamp.toMillis() : new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
      });
    }, (error) => {
      console.error("Error loading recorded lessons from Firebase:", error);
    });

    return () => {
      unsubRealtime();
      unsubFirebase();
    };
  }, [resolvedSchoolId, userProfile?.grade, userProfile?.section, grade, isTeacher]);

  useEffect(() => {
    if (!resolvedSchoolId) return;

    const studentGrade = userProfile?.grade || grade;
    const studentSection = userProfile?.section || userProfile?.class;

    // Direct fetch from SQL API to ensure instant, reliable loading with filtering
    const fetchSchoolFiles = async () => {
      try {
        let url = `/api/school-files?schoolId=${encodeURIComponent(resolvedSchoolId)}`;
        if (!isTeacher && studentGrade && studentGrade !== 'all') {
          url += `&grade=${encodeURIComponent(studentGrade)}`;
        }
        if (!isTeacher && studentSection && studentSection !== 'all') {
          url += `&section=${encodeURIComponent(studentSection)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const filesList = data?.files || data?.data;
          if (Array.isArray(filesList)) {
            setSchoolFiles(prev => {
              const combined = [...filesList];
              prev.forEach(p => {
                if (!combined.find(c => c.id === p.id)) combined.push(p);
              });
              return combined.sort((a, b) => {
                const timeA = new Date((a as any).createdAt || 0).getTime();
                const timeB = new Date((b as any).createdAt || 0).getTime();
                return timeB - timeA;
              });
            });
          }
        }
      } catch (err) {
        console.warn("Initial direct fetch of school-files failed:", err);
      }
    };

    fetchSchoolFiles();

    // Subscribe to realtime updates for school_files
    const unsubRealtime = realtimeManager.subscribe('school_files', (payload) => {
      if (!payload) return;

      if (!payload.data) {
        // If we don't have data, it might be a raw PostgreSQL event.
        // Refresh the list to stay in sync.
        fetchSchoolFiles();
        return;
      }

      if (payload.action === 'INSERT') {
        const newFile = payload.data;
        const matchesGrade = isTeacher || !studentGrade || studentGrade === 'all' || newFile.grade === studentGrade || !newFile.grade;
        const matchesSection = isTeacher || !studentSection || studentSection === 'all' || newFile.section === studentSection || !newFile.section;
        
        if (newFile.schoolId === resolvedSchoolId && matchesGrade && matchesSection) {
          setSchoolFiles(prev => [newFile, ...prev.filter(f => f.id !== newFile.id)]);
        }
      } else if (payload.action === 'UPDATE') {
        const updatedFile = payload.data;
        setSchoolFiles(prev => prev.map(f => f.id === updatedFile.id ? { ...f, ...updatedFile } : f));
      } else if (payload.action === 'DELETE') {
        setSchoolFiles(prev => prev.filter(f => f.id !== payload.id));
      }
    });

    const q = query(collection(db, "school_files"), where("schoolId", "==", resolvedSchoolId));
    const unsub = onSnapshot(q, (snap) => {
      const files = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SchoolFile);
      setSchoolFiles(prev => {
        const combined = [...prev];
        files.forEach(f => {
          if (!combined.find(c => c.id === f.id)) combined.push(f);
        });
        return combined.sort((a, b) => {
          const timeA = (a as any).createdAt?.toMillis ? (a as any).createdAt.toMillis() : new Date((a as any).createdAt || 0).getTime();
          const timeB = (b as any).createdAt?.toMillis ? (b as any).createdAt.toMillis() : new Date((b as any).createdAt || 0).getTime();
          return timeB - timeA;
        });
      });
    }, (error) => {
      console.error("Error loading school files from Firebase:", error);
    });

    const q2 = query(collection(db, "question_bank"), where("schoolId", "==", resolvedSchoolId));
    const unsub2 = onSnapshot(q2, (snap) => {
      const questions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const getTs = (item: any) => {
        if (!item?.createdAt) return 0;
        if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
        if (typeof item.createdAt.toDate === 'function') return item.createdAt.toDate().getTime();
        const ms = new Date(item.createdAt).getTime();
        return isNaN(ms) ? (Number(item.createdAt) || 0) : ms;
      };
      setSchoolQuestions(questions.sort((a, b) => getTs(b) - getTs(a)));
    }, (error) => {
      console.error("Error loading question bank:", error);
    });

    const q3 = query(collection(db, "exam_papers"), where("schoolId", "==", resolvedSchoolId));
    const unsub3 = onSnapshot(q3, (snap) => {
      const papers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const getTs = (item: any) => {
        if (!item?.createdAt) return 0;
        if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
        if (typeof item.createdAt.toDate === 'function') return item.createdAt.toDate().getTime();
        const ms = new Date(item.createdAt).getTime();
        return isNaN(ms) ? (Number(item.createdAt) || 0) : ms;
      };
      setSchoolExamPapers(papers.sort((a, b) => getTs(b) - getTs(a)));
    }, (error) => {
      console.error("Error loading exam papers:", error);
    });

    return () => {
      unsub();
      unsub2();
      unsub3();
      unsubRealtime();
    };
  }, [resolvedSchoolId, userProfile?.grade, userProfile?.section, grade, isTeacher]);

  // Real media streaming states & controls for the teacher
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const teacherVideoRef = useRef<HTMLVideoElement | null>(null);

  const { remoteStream, peerConnectionsRef } = useWebRTCStream({
    isTeacher: !!isTeacher,
    roomId: resolvedSchoolId && targetBroadcastGrade && isLiveActive ? `${resolvedSchoolId}_${targetBroadcastGrade}` : null,
    localStream: cameraStream,
    currentUserUid: getCurrentUserId()
  });

  const handleToggleCamera = async () => {
    const nextState = !camEnabled;
    setCamEnabled(nextState);
    if (isTeacher && resolvedSchoolId && targetBroadcastGrade && isLiveActive) {
      try {
        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          cameraEnabled: nextState,
          isCameraOn: nextState,
          teacherVideoActive: nextState,
          camEnabled: nextState,
        }, { merge: true });
        debugLog("[CameraDebug] Synced cameraEnabled state to Firestore:", nextState);
      } catch (err) {
        console.error("Failed to sync camera state:", err);
      }
    }
  };

  const handleToggleMic = async () => {
    const nextState = !micEnabled;
    setMicEnabled(nextState);
    if (isTeacher && resolvedSchoolId && targetBroadcastGrade && isLiveActive) {
      try {
        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          micEnabled: nextState,
          isMicOn: nextState,
          teacherMicActive: nextState,
        }, { merge: true });
        console.log("[MicDebug] Synced micEnabled state to Firestore:", nextState);
      } catch (err) {
        console.error("Failed to sync mic state:", err);
      }
    }
  };

  const handleStartDrawing = (
    clientX: number,
    clientY: number,
    currentTarget: EventTarget & HTMLCanvasElement,
  ) => {
    const canvas = currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (boardTool === "pointer") return;

    if (boardTool === "laser") {
      isDrawingRef.current = true;
      setLaserPosition({ x, y });
      return;
    }

    if (boardTool === "text") {
      if (boardTextContent.trim()) {
        setWhiteboardStrokes((prev) => [
          ...prev,
          {
            x1: x,
            y1: y,
            x2: x,
            y2: y,
            color: boardColor,
            thickness: boardTextSize,
            type: "text",
            text: boardTextContent,
          },
        ]);
        setBoardTextContent(""); // clear text after placement
        showToast("لقد تم إدراج النص على لوحة الكتابة 📝", "info");
      } else {
        showToast(
          "يرجى كتابة نص من شريط الأدوات أولاً قبل النقر للصقه ⚠️",
          "error",
        );
      }
      return;
    }

    startDrawPos.current = { x, y };
    lastDrawPos.current = { x, y };
    isDrawingRef.current = true;
    currentStrokeGroupId.current = Date.now().toString() + Math.random().toString();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) =>
    handleStartDrawing(e.clientX, e.clientY, e.currentTarget);

  const handleDraw = (
    clientX: number,
    clientY: number,
    currentTarget: EventTarget & HTMLCanvasElement,
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (boardTool === "laser") {
      setLaserPosition({ x, y });
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
      laserTimeoutRef.current = setTimeout(() => setLaserPosition(null), 1000);
      return;
    }

    if (boardTool === "pencil" || boardTool === "eraser") {
      const newStroke: DrawStroke = {
        x1: lastDrawPos.current.x,
        y1: lastDrawPos.current.y,
        x2: x,
        y2: y,
        color: boardTool === "eraser" ? "eraser" : boardColor,
        thickness: boardTool === "eraser" ? 24 : brushThickness,
        type: boardTool === "eraser" ? "eraser" : "pencil",
        groupId: currentStrokeGroupId.current || undefined
      };
      setWhiteboardStrokes((prev) => [...prev, newStroke]);
      lastDrawPos.current = { x, y };
    } else {
      setCurrentShape({
        x1: startDrawPos.current.x,
        y1: startDrawPos.current.y,
        x2: x,
        y2: y,
        color: boardColor,
        thickness: brushThickness,
        type: boardTool as DrawStroke["type"],
        groupId: currentStrokeGroupId.current || undefined
      });
    }
  };

  const handleSetWhiteboardImage = async (img: string | null) => {
    setWhiteboardImage(img);
    if (img !== "pdf_viewer") {
      setPdfFile(null); // Clear the local PDF if switching templates so we can reset clean
      setSharedPdfPageBase64(null);
    }
    if (isLiveActive) {
      try {
        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
          whiteboardImage: img,
          ...(img !== "pdf_viewer" ? { sharedPdfPageBase64: null } : {})
        }, { merge: true });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const lastSyncedPdfMetaRef = useRef<string | null>(null);

  const captureAndSyncPdf = () => {
    if (!isTeacher || !isLiveActive || whiteboardImage !== "pdf_viewer" || !pdfFile) return;
    
    // We create a unique signature of the current page and scale. 
    // This stops the infinite loop because JPEG encoding on canvas is non-deterministic 
    // and produces slightly different strings on every paint.
    const currentMeta = `${pdfPageNumber}_${pdfScale}`;
    if (lastSyncedPdfMetaRef.current === currentMeta) return;

    setTimeout(async () => {
      const elements = document.querySelectorAll(".react-pdf__Page__canvas");
      if (elements.length > 0) {
        const canvas = elements[0] as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.3);
        if (dataUrl) {
          try {
            lastSyncedPdfMetaRef.current = currentMeta;
            await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
               sharedPdfPageBase64: dataUrl,
               pdfScale: pdfScale
            }, { merge: true });
          } catch (err) {
            console.error("Failed to sync PDF page image", err);
          }
        }
      }
    }, 1500); // short delay to ensure canvas is painted
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) =>
    handleDraw(e.clientX, e.clientY, e.currentTarget);

  const renderWhiteboardBackground = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    imageId: string | null,
  ) => {
    if (
      !imageId ||
      imageId.startsWith("data:image") ||
      imageId === "pdf_viewer"
    )
      return;

    if (imageId === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (imageId === "chalkboard") {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let i = 0; i < canvas.height; i += step) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    } else if (imageId === "grid") {
      ctx.fillStyle = "#11162D";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.06)";
      ctx.lineWidth = 1;
      const step = 25;
      for (let i = 0; i < canvas.width; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += step) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    } else if (imageId === "coordinate_grid") {
      ctx.fillStyle = "#11162D";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(0, 229, 255, 0.04)";
      ctx.lineWidth = 1;
      const step = 25;
      // thin grid
      for (let i = 0; i < canvas.width; i += step) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += step) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }
      // axes
      ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
    } else if (imageId === "ruled") {
      ctx.fillStyle = "#0A0F21";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)";
      ctx.lineWidth = 1;
      const step = 28;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.15)";
      ctx.moveTo(canvas.width - 60, 0);
      ctx.lineTo(canvas.width - 60, canvas.height);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      for (let i = 40; i < canvas.height; i += step) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    } else if (imageId === "geometric") {
      ctx.fillStyle = "#0E0B1B";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.05)";
      ctx.lineWidth = 1;
      // iso grid pattern
      const s = 30;
      const hStr = s * Math.sqrt(3);
      for(let x=0; x<canvas.width*2; x+=hStr) {
        for(let y=0; y<canvas.height*2; y+=s*3) {
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x+hStr/2, y+s/2); ctx.lineTo(x, y+s);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x+hStr/2, y+s/2); ctx.lineTo(x+hStr/2, y+s*1.5);
          ctx.stroke();
        }
      }
    } else if (imageId === "music") {
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      const spacing = 10;
      const staveGap = 60;
      for (let i = 40; i < canvas.height; i += staveGap + spacing * 4) {
        for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.moveTo(20, i + j * spacing);
            ctx.lineTo(canvas.width - 20, i + j * spacing);
            ctx.stroke();
        }
      }
    } else if (imageId === "science") {
      ctx.fillStyle = "#0A0F21";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(52, 211, 153, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(52, 211, 153, 0.25)";
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }
    } else if (imageId === "arabic") {
      ctx.fillStyle = "#FDFBF7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const step = 60;
      for (let i = 50; i < canvas.height; i += step) {
        // Base line
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
        
        // Top limit line (dashed)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, i - 25); ctx.lineTo(canvas.width, i - 25); ctx.stroke();
        
        // Bottom limit line (dashed)
        ctx.beginPath(); ctx.moveTo(0, i + 15); ctx.lineTo(canvas.width, i + 15); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };

  const renderStroke = (
    ctx: CanvasRenderingContext2D,
    s: DrawStroke,
    canvas: HTMLCanvasElement,
  ) => {
    ctx.beginPath();
    if (s.color === "eraser" || s.type === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = s.thickness;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
      ctx.fillStyle = s.color;
      ctx.lineWidth = s.thickness;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const renderScale = boardImageScale || 1; // Assuming boardImageScale is accessible here, if not we'll pass it if needed, actually it's scaling the whole board maybe? let's just use canvas dimensions.
    const x1 = s.x1 * canvas.width;
    const y1 = s.y1 * canvas.height;
    const x2 = s.x2 * canvas.width;
    const y2 = s.y2 * canvas.height;

    switch (s.type) {
      case "pencil":
      case "eraser":
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
      case "line":
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        break;
      case "rect":
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        break;
      case "circle":
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case "arrow":
        const headlen = 10 * (s.thickness / 3);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          x2 - headlen * Math.cos(angle + Math.PI / 6),
          y2 - headlen * Math.sin(angle + Math.PI / 6),
        );
        ctx.lineTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6),
        );
        ctx.stroke();
        break;
      case "text":
        if (s.text) {
          ctx.font = `bold ${s.thickness}px Amiri, sans-serif`;
          ctx.fillText(s.text, x1, y1);
        }
        break;
    }
  };

  const stopDrawing = () => {
    if (boardTool === "laser") {
      setLaserPosition(null);
      isDrawingRef.current = false;
      return;
    }
    if (currentShape) {
      setWhiteboardStrokes((prev) => [...prev, currentShape]);
      setCurrentShape(null);
    }
    isDrawingRef.current = false;
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startStreaming = async () => {
      const needsVideo = camEnabled || studentLocalCamActive;
      const needsAudio = micEnabled || studentLocalMicActive;

      if (needsVideo || needsAudio) {
        console.log(
          "[CameraDebug] Triggering media stream capture with video:",
          needsVideo,
          "and audio:",
          needsAudio,
        );
        try {
          const constraints = {
            video: needsVideo
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: cameraFacingMode,
                }
              : false,
            audio: needsAudio,
          };

          if (
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== "function"
          ) {
            const apiError = new Error(
              "navigator.mediaDevices.getUserMedia is undefined/unsupported in this environment context (perhaps due to unsecure origin HTTP or iframe constraint).",
            );
            console.warn(
              "[CameraDebug] stream creation failed:",
              apiError.message,
            );
            showToast(
              "فشل تفعيل الوسائط: المتصفح لا يدعم الوصول للأجهزة أو يتطلب اتصال آمن HTTPS 🔒",
              "error",
            );
            setCameraStream(null);
            return;
          }

          // Device checks
          try {
            if (navigator.mediaDevices.enumerateDevices) {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const hasVideo = devices.some(
                (device) => device.kind === "videoinput",
              );
              const hasAudio = devices.some(
                (device) => device.kind === "audioinput",
              );

              if (needsVideo && !hasVideo) {
                debugWarn("[CameraDebug] no camera found on this device.");
                showToast(
                  "تنبيه: لم يتم العثور على كاميرا متصلة بالجهاز للبدء! 🎥",
                  "error",
                );
              }
              if (needsAudio && !hasAudio) {
                console.warn(
                  "[CameraDebug] no microphone found on this device.",
                );
                showToast(
                  "تنبيه: لم يتم العثور على ميكروفون متصل بالجهاز للبدء! 🎙️",
                  "error",
                );
              }
            }
          } catch (enumErr) {
            console.warn(
              "[CameraDebug] Device check evaluation bypassed:",
              enumErr,
            );
          }

          console.log(
            "[CameraDebug] Invoking getUserMedia with calculated constraints:",
            JSON.stringify(constraints),
          );
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          debugLog("[CameraDebug] Teacher Stream:", stream);
          debugLog("[CameraDebug] Video Tracks:", stream.getVideoTracks().length);
          debugLog("[CameraDebug] Audio Tracks:", stream.getAudioTracks().length);

          setCameraStream(stream);
          activeStream = stream;
          showToast(
            "تم تفعيل الكاميرا والوسائط المباشرة للمنصة بنجاح 🚀",
            "success",
          );
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          const errName = err?.name || "";
          console.warn(
            "[CameraDebug] stream creation failed:",
            errMsg,
            "Details:",
            errName,
          );

          if (
            errName === "NotAllowedError" ||
            errName === "PermissionDeniedError" ||
            errMsg.toLowerCase().includes("permission denied")
          ) {
            console.warn(
              "[CameraDebug] permission denied: Please grant camera and microphone access permissions in browser settings.",
            );
            showToast(
              "فشل البدء: تم رفض إذن الوصول للكاميرا والميكروفون من قِبل المتصفح 🔒",
              "error",
            );
          } else if (
            errName === "NotFoundError" ||
            errName === "DevicesNotFoundError" ||
            errMsg.toLowerCase().includes("not found")
          ) {
            debugWarn("[CameraDebug] no camera found on this device.");
            showToast(
              "فشل البدء: لم يتم إيجاد جهاز كاميرا أو ميكروفون متصل بالجهاز 🎒",
              "error",
            );
          } else {
            showToast(`فشل إطلاق البث والوسائط الحقيقية: ${errMsg}`, "error");
          }
          setCameraStream(null);
        }
      } else {
        console.log(
          "[CameraDebug] All media tools are disabled. Release current active capture.",
        );
        setCameraStream(null);
      }
    };

    startStreaming();

    return () => {
      if (activeStream) {
        debugLog("[CameraDebug] Cleaning up media stream tracks...");
        activeStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn(
              "[CameraDebug] Error stopping media track on cleanup:",
              e,
            );
          }
        });
      }
    };
  }, [camEnabled, micEnabled, cameraFacingMode, studentLocalCamActive, studentLocalMicActive]);

  useEffect(() => {
    if (isTeacher) {
      if (cameraStream && teacherVideoRef.current) {
        if (teacherVideoRef.current.srcObject !== cameraStream) {
          debugLog("[CameraDebug] Assigning media stream to video element.");
          try {
            teacherVideoRef.current.srcObject = cameraStream;
          } catch (e: any) {
            debugWarn("[CameraDebug] Failed assigning stream:", e);
          }
        }
      } else if (teacherVideoRef.current) {
        teacherVideoRef.current.srcObject = null;
      }
    } else {
      // Student logic
      if (isLiveActive && remoteStream && teacherVideoRef.current) {
        if (teacherVideoRef.current.srcObject !== remoteStream) {
          try {
            debugLog(`[WebRTC Debug - 9] (Student/useEffect) Attempting to bind remoteStream (${remoteStream.id}) to teacherVideoRef.`);
            teacherVideoRef.current.srcObject = remoteStream;
            debugLog(`[WebRTC Debug - 9] (Student/useEffect) successfully assigned srcObject.`);
            teacherVideoRef.current.play().then(() => {
              debugLog(`[WebRTC Debug - 9] (Student/useEffect) el.play() succeeded.`);
            }).catch(e => {
              debugError(`[WebRTC Debug - 9] (Student/useEffect) AutoPlay Blocked/Failed:`, e);
            });
            debugLog(`[WebRTC Debug - 9] bound remoteStream to Video element correctly. VideoTracks: ${remoteStream.getVideoTracks().length}`);
          } catch(e) {
            debugError(`[WebRTC Debug - Err] (Student/useEffect) Failed to bind stream:`, e);
          }
        } else {
          debugLog(`[WebRTC Debug - 9] (Student/useEffect) teacherVideoRef.current.srcObject is already remoteStream.`);
        }
      } else if (teacherVideoRef.current && !isLiveActive) {
        teacherVideoRef.current.srcObject = null;
      }
    }
  }, [cameraStream, remoteStream, isTeacher, isLiveActive]);

  useEffect(() => {
    let interval: any = null;
    let hbInterval: any = null;
    if (isLiveActive) {
      interval = setInterval(() => {
        setLiveSeconds((prev) => prev + 1);
      }, 1000);
      
      // Sync heartbeat as teacher (every 15 seconds to prevent Firestore write spikes)
      if (isTeacher && resolvedSchoolId && targetBroadcastGrade) {
        hbInterval = setInterval(() => {
          setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
            heartbeat: Date.now()
          }, { merge: true }).catch(err => {
            // Document might not exist if stopped concurrently
          });
        }, 15000);
      }
    } else {
      setLiveSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (hbInterval) clearInterval(hbInterval);
    };
  }, [isLiveActive, isTeacher, resolvedSchoolId, targetBroadcastGrade]);

  const formatLiveDuration = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs.toString().padStart(2, "0"),
      mins.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":");
  };

  // Quiz timer effect
  useEffect(() => {
    let interval: any = null;
    if (
      activeLiveQuiz &&
      activeLiveQuiz.isActive &&
      activeLiveQuiz.secondsRemaining > 0
    ) {
      interval = setInterval(() => {
        setActiveLiveQuiz((prev: any) => {
          if (!prev) return null;
          if (prev.secondsRemaining <= 1) {
            clearInterval(interval);
            return { ...prev, secondsRemaining: 0, isActive: false };
          }
          return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeLiveQuiz]);

  // Student general online status heartbeat
  useEffect(() => {
    if (isTeacher || !resolvedSchoolId) return;
    const myUserId = getCurrentUserId();
    const docRef = doc(db, "schools", resolvedSchoolId, "online_users", myUserId);
    
    const updateOnlineStatus = () => {
      const myName = userProfile?.studentName || userProfile?.name || userProfile?.fullName || "الفارس المتميز";
      setDoc(docRef, {
        name: myName,
        lastActive: Date.now(),
        grade: gradeName || userProfile?.grade || ""
      }, { merge: true }).catch(console.error);
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [isTeacher, resolvedSchoolId, userProfile, gradeName]);

  // Student active watch second, and updates their attendance percentages dynamically
  useEffect(() => {
    let watchInterval: any = null;
    let viewerInterval: any = null;
    
    if (isLiveActive && !isTeacher && activeTab === ("live_watch" as any) && resolvedSchoolId && targetBroadcastGrade) {
      const myUserId = getCurrentUserId();
      const viewerDocRef = doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`, "viewers", myUserId);
      const studentName = userProfile?.studentName || userProfile?.name || userProfile?.fullName || "الفارس المتميز";

      let currentWatchSecs = studentWatchSeconds;

      const updateViewerStatus = () => {
        setDoc(viewerDocRef, {
          id: myUserId,
          name: studentName,
          lastActive: Date.now(),
          watchDuration: currentWatchSecs,
          studentCode: userProfile?.studentCode || userProfile?.code || myUserId
        }, { merge: true }).catch(console.error);
      };

      updateViewerStatus();
      viewerInterval = setInterval(updateViewerStatus, 8000);

      watchInterval = setInterval(() => {
        setStudentWatchSeconds((prev) => {
          const next = prev + 1;
          currentWatchSecs = next;

          // Dynamically log into attendance statistics
          setAttendanceSessions((current) => {
            const hasRecord = current.some(
              (x) => x.studentId === myUserId,
            );
            const streamLength = 4500; // Simulated 75 min total class time
            const nextPercent = Math.min(
              100,
              Math.round((next / streamLength) * 100),
            );

            if (hasRecord) {
              return current.map((x) =>
                x.studentId === myUserId
                  ? {
                      ...x,
                      watchDuration: next,
                      attendancePercent: nextPercent,
                    }
                  : x,
              );
            } else {
              return [
                ...current,
                {
                  studentId: myUserId,
                  name: studentName,
                  enterTime: Date.now(),
                  watchDuration: next,
                  attendancePercent: nextPercent,
                },
              ];
            }
          });

          return next;
        });
      }, 1000);

      const handleBeforeUnload = () => {
        deleteDoc(viewerDocRef).catch(() => {});
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        if (watchInterval) clearInterval(watchInterval);
        if (viewerInterval) clearInterval(viewerInterval);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        
        // Clean up from the broadcast viewers list instantly when leaving
        deleteDoc(viewerDocRef).catch(console.error);
      };
    }

    return () => {};
  }, [isLiveActive, isTeacher, activeTab, resolvedSchoolId, targetBroadcastGrade, userProfile]);

  // Floating emojis fade out lifecycle timer
  useEffect(() => {
    let emojiInterval: any = null;
    if (floatingEmojis.length > 0) {
      emojiInterval = setInterval(() => {
        setFloatingEmojis((prev) =>
          prev.filter((e) => Date.now() - e.timestamp < 2000),
        );
      }, 500);
    }
    return () => {
      if (emojiInterval) clearInterval(emojiInterval);
    };
  }, [floatingEmojis]);

  const [announcementText, setAnnouncementText] = useState("");
  const [announcementHours, setAnnouncementHours] = useState<number>(0);
  const [announcementDays, setAnnouncementDays] = useState<number>(1);
  const [teacherUploadTab, setTeacherUploadTab] = useState<"document" | "video">("document");
  const [uploadedAssetTitle, setUploadedAssetTitle] = useState("");
  const [uploadedAssetTag, setUploadedAssetTag] = useState("ملخص شامل");
  const [uploadedAssetSubject, setUploadedAssetSubject] = useState("اللغة العربية");
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: string } | null>(null);
  
  const [previewingFile, setPreviewingFile] = useState<any | null>(null);
  const [previewPdfNumPages, setPreviewPdfNumPages] = useState<number | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [activeFileChallengeQuestions, setActiveFileChallengeQuestions] = useState<any[] | null>(null);
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  useEffect(() => {
    if (isTeacher && teacherData?.subject) {
      setUploadedAssetSubject(teacherData.subject);
      setUploadedVideoSubject(teacherData.subject);
    }
  }, [isTeacher, teacherData?.subject]);
  
  const [uploadedVideoTitle, setUploadedVideoTitle] = useState("");
  const [uploadedVideoDesc, setUploadedVideoDesc] = useState("");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  const [uploadedVideoSubject, setUploadedVideoSubject] = useState("اللغة العربية");
  const [uploadedVideoDuration, setUploadedVideoDuration] = useState("");
  const [uploadedVideoFileMeta, setUploadedVideoFileMeta] = useState<{ name: string; size: string } | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadedVideoLock, setUploadedVideoLock] = useState(false);
  const [documentXhr, setDocumentXhr] = useState<XMLHttpRequest | null>(null);
  const [videoXhr, setVideoXhr] = useState<XMLHttpRequest | null>(null);
  const [studentLibraryTab, setStudentLibraryTab] = useState<"document" | "video" | "question_bank" | "homework" | "competitions">("document");
  const [visitedHomework, setVisitedHomework] = useState(false);
  const [visitedCompetitions, setVisitedCompetitions] = useState(false);

  useEffect(() => {
    if (studentLibraryTab === "homework") {
      setVisitedHomework(true);
    } else if (studentLibraryTab === "competitions") {
      setVisitedCompetitions(true);
    }
  }, [studentLibraryTab]);

  useEffect(() => {
    if (highlightTasksSection) {
      setStudentLibraryTab("homework");
      setVisitedHomework(true);
      setVisitedCompetitions(true);

      const timer = setTimeout(() => {
        if (onClearHighlightTasks) {
          onClearHighlightTasks();
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightTasksSection, onClearHighlightTasks]);

  const [studentQuestionBankTab, setStudentQuestionBankTab] = useState<"questions" | "papers">("questions");
  const [studentExamPaperYear, setStudentExamPaperYear] = useState<string>("الكل");
  const [studentExamPaperRole, setStudentExamPaperRole] = useState<string>("الكل");
  const [studentLibrarySearch, setStudentLibrarySearch] = useState("");
  const [studentLibrarySubject, setStudentLibrarySubject] = useState("الكل");
  
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostMedia, setNewPostMedia] = useState<string | null>(null);

  const [classmates, setClassmates] = useState<{ name: string }[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [showTagMenuTarget, setShowTagMenuTarget] = useState<
    "post" | "comment" | "story" | null
  >(null);
  const [tagCursorPos, setTagCursorPos] = useState(0);

  useEffect(() => {
    if (!auth.currentUser || !schoolId || !grade) return;
    const fetchMates = async () => {
      try {
        const q = query(
          collection(db, "activation_codes"),
          where("schoolId", "==", schoolId),
          where("grade", "==", grade),
        );
        const snap = await getDocs(q);
        const mates = snap.docs
          .filter((doc) => doc.data().role !== "parent")
          .map((doc) => {
            const d = doc.data();
            return { name: d.name || d.studentName || d.fullName || "" };
          })
          .filter((m) => m.name.trim() !== "");

        let teacherNames: { name: string }[] = [];
        try {
          const tq = query(
            collection(db, "teachers"),
            where("schoolId", "==", schoolId),
            where("classes", "array-contains", grade),
          );
          const tsnap = await getDocs(tq);
          teacherNames = tsnap.docs
            .map((doc) => ({ name: doc.data().name || "" }))
            .filter((m) => m.name.trim() !== "");
        } catch (err) {
          console.warn("Could not fetch teachers for tags", err);
        }

        const adminName = { name: "الإدارة" };
        const allNames = [...mates, ...teacherNames, adminName];

        const unique = Array.from(new Set(allNames.map((m) => m.name))).map(
          (name) => ({ name }),
        );
        setClassmates(unique);
      } catch (e) {
        console.warn("Could not fetch classmates", e);
      }
    };
    fetchMates();
  }, [schoolId, grade]);
  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setter: (v: string) => void,
    target: "post" | "comment" | "story",
  ) => {
    const val = e.target.value;
    setter(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtPos + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setTagSearch(textAfterAt);
        setShowTagMenuTarget(target);
        setTagCursorPos(lastAtPos);
        return;
      }
    }
    setShowTagMenuTarget(null);
  };

  const insertTag = (
    name: string,
    currentValue: string,
    setter: (v: string) => void,
  ) => {
    const before = currentValue.substring(0, tagCursorPos);
    const searchLen = tagSearch.length;
    const after = currentValue.substring(tagCursorPos + 1 + searchLen);

    const formattedName = name.replace(/\s+/g, "_");
    setter(before + "@" + formattedName + " " + after);
    setShowTagMenuTarget(null);
  };

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isLoungeOpen, setIsLoungeOpen] = useState(false);
  const [unreadLoungeCount, setUnreadLoungeCount] = useState(0);
  const [socialUnreadCount, setSocialUnreadCount] = useState(0);
  const [resolvedTicketCount, setResolvedTicketCount] = useState(0);
  const [schoolConfigs, setSchoolConfigs] = useState<any>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingAcademyPageId, setDeletingAcademyPageId] = useState<string | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const isStoryPausedRef = useRef(false);
  const [isStoryUIHidden, setIsStoryUIHidden] = useState(false);
  const storyTouchStartX = useRef<number | null>(null);
  const storyTouchStartTime = useRef<number | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSwipingStory = useRef(false);
  const [editingPhraseText, setEditingPhraseText] = useState("");
  const [isEditingPhrase, setIsEditingPhrase] = useState(false);

  // Track unread lounge messages global count
  useEffect(() => {
    if (!auth.currentUser || !resolvedSchoolId) return;
    
    const fetchCount = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const res = await fetch(`/api/lounge-messages/unread/${uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.counts) {
            const total = Object.values(data.counts as Record<string, number>).reduce((a, b) => a + b, 0);
            setUnreadLoungeCount(total);
          }
        }
      } catch (e) {
        console.warn("Notice: could not fetch unread lounge count:", e);
      }
    };

    fetchCount();
    const unsub = realtimeManager.subscribe('lounge_messages', () => {
      fetchCount();
    });
    return () => unsub();
  }, [resolvedSchoolId]);

  useEffect(() => {
    if (!schoolId) return;
    const unsub = academicService.subscribeToSchoolSettings(
      schoolId,
      (data) => {
        setSchoolConfigs(data);
      },
    );
    return () => unsub();
  }, [schoolId]);

  const getStageFromGrade = (studentGrade: string): string => {
    const trimmed = (studentGrade || "").trim();
    if (trimmed.includes("ابتدائي")) return "المرحلة الابتدائية";
    if (trimmed.includes("متوسط")) return "المرحلة المتوسطة";
    return "المرحلة الاعدادية";
  };

  const getArabicToday = (): string => {
    const days = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };

  const prevHandRaisesCountRef = useRef(0);
  useEffect(() => {
    if (isTeacher && isLiveActive) {
      const pendingCount = handRaises.filter((h) => h.status === "pending").length;
      if (pendingCount > prevHandRaisesCountRef.current) {
        showToast("✋ طلب مداخلة جديد! تفقّد قسم المداخلات.", "info");
      }
      prevHandRaisesCountRef.current = pendingCount;
    }
  }, [handRaises, isTeacher, isLiveActive]);

  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // activeLiveAlert effect disabled
  // useEffect(() => {
  //   if (isTeacher) return;
  //   const liveNotif = (notifications || []).find(n => 
  //     !n.read && !n.isRead && 
  //     !dismissedAlertIds.has(n.id) && (
  //       n.type === "live_alert" || 
  //       n.type === "reminder" || 
  //       (n.title && (n.title.includes("نداء") || n.title.includes("الأستاذ"))) ||
  //       (n.message && (n.message.includes("نداء") || n.message.includes("البث")))
  //     )
  //   );
  //   if (liveNotif) {
  //     if (!activeLiveAlert || activeLiveAlert.id !== liveNotif.id) {
  //       setActiveLiveAlert(liveNotif);
  //       try {
  //         sounds.playNotification();
  //       } catch (err) {}
  //     }
  //   } else {
  //     setActiveLiveAlert(null);
  //   }
  // }, [notifications, isTeacher, activeLiveAlert, dismissedAlertIds]);

  const handleJoinLiveFromAlert = async () => {
    if (!activeLiveAlert) return;
    try {
      const notifId = activeLiveAlert.id;
      if (notifId) {
        await updateDoc(doc(db, "notifications", notifId), {
          read: true,
          isRead: true
        });
        if (onMarkNotificationAsRead) onMarkNotificationAsRead(notifId);
        setDismissedAlertIds(prev => new Set(prev).add(notifId));
      }
    } catch (e) {
      console.error("Failed to mark live alert as read:", e);
    }
    
    showToast("تم الانضمام للبث وتأكيد الحضور بنجاح! 📡🛡️", "success");
    try {
      sounds.playSuccess();
    } catch (e) {}
    setActiveTab("live_watch", "handleJoinLiveBroadcast");
    setActiveLiveAlert(null);
  };

  const handleDismissLiveAlert = async () => {
    if (!activeLiveAlert) return;
    try {
      const notifId = activeLiveAlert.id;
      if (notifId) {
        await updateDoc(doc(db, "notifications", notifId), {
          read: true,
          isRead: true
        });
        if (onMarkNotificationAsRead) onMarkNotificationAsRead(notifId);
        setDismissedAlertIds(prev => new Set(prev).add(notifId));
      }
    } catch (e) {
      console.error("Failed to mark live alert as read:", e);
    }
    setActiveLiveAlert(null);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const activeUserId = auth.currentUser.uid;
    const studentCode = userProfile?.studentCode || userProfile?.code;
    const parentCode = userProfile?.parentCode;

    if (!activeUserId && !studentCode && !parentCode) return;

    const possibleIdsSet = new Set<string>();
    const hasSpecificCode = Boolean(studentCode || parentCode);

    if (activeUserId && !hasSpecificCode) {
      possibleIdsSet.add(activeUserId);
      possibleIdsSet.add(activeUserId.trim());
      possibleIdsSet.add(activeUserId.trim().toUpperCase());
      possibleIdsSet.add(activeUserId.trim().toLowerCase());
    }

    const processCode = (rawCode?: string, isParent = false) => {
      if (!rawCode) return;
      const clean = rawCode.trim();
      const upper = clean.toUpperCase();
      const lower = clean.toLowerCase();

      possibleIdsSet.add(clean);
      possibleIdsSet.add(upper);
      possibleIdsSet.add(lower);

      const prefix = isParent ? "pcode_" : isTeacher ? "tcode_" : "scode_";
      possibleIdsSet.add(`${prefix}${clean}`);
      possibleIdsSet.add(`${prefix}${upper}`);
      possibleIdsSet.add(`${prefix}${lower}`);
      if (isTeacher) {
        possibleIdsSet.add(`tch_${clean}`);
        possibleIdsSet.add(`tch_${upper}`);
        possibleIdsSet.add(`tch_${lower}`);
      }

      if (
        upper.startsWith("S-") ||
        upper.startsWith("P-") ||
        upper.startsWith("TCH-") ||
        upper.startsWith("T-") ||
        upper.startsWith("STU-") ||
        upper.startsWith("PAR-")
      ) {
        const pure = upper.replace(/^(STU-|PAR-|TCH-|S-|P-|T-)/i, "");
        possibleIdsSet.add(pure);
        possibleIdsSet.add(pure.toLowerCase());
        possibleIdsSet.add(`${prefix}${pure}`);
        possibleIdsSet.add(`${prefix}${pure.toLowerCase()}`);
        if (isTeacher) {
          possibleIdsSet.add(`tch_${pure}`);
          possibleIdsSet.add(`tch_${pure.toLowerCase()}`);
          possibleIdsSet.add(`tcode_TCH-${pure}`);
          possibleIdsSet.add(`tcode_T-${pure}`);
          possibleIdsSet.add(`tch_TCH-${pure}`);
        } else if (isParent) {
          possibleIdsSet.add(`pcode_P-${pure}`);
        } else {
          possibleIdsSet.add(`scode_S-${pure}`);
        }
      } else {
        const signPrefix = isParent ? "P-" : isTeacher ? "TCH-" : "S-";
        possibleIdsSet.add(`${signPrefix}${upper}`);
        possibleIdsSet.add(`${signPrefix}${lower}`);
        possibleIdsSet.add(`${prefix}${signPrefix}${upper}`);
        possibleIdsSet.add(`${prefix}${signPrefix}${lower}`);
        if (isTeacher) {
          possibleIdsSet.add(`T-${upper}`);
          possibleIdsSet.add(`tcode_T-${upper}`);
          possibleIdsSet.add(`tch_TCH-${upper}`);
        }
      }
    };

    processCode(studentCode, false);
    if (isTeacher) {
      processCode(teacherData?.code, false);
      processCode(teacherData?.id, false);
      processCode(userProfile?.code, false);
    }

    const possibleIds = Array.from(possibleIdsSet).filter(Boolean).slice(0, 30);

    if (possibleIds.length === 0) return;

    const fetchApiTickets = async () => {
      try {
        const res = await fetch(`/api/support-tickets?userIds=${encodeURIComponent(possibleIds.join(','))}&userRole=teacher`);
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tickets)) {
          const filteredTickets = data.tickets.filter(
            (t: any) =>
              t.status === "resolved" &&
              (t.readByStudent === false || t.readByStudent === undefined) &&
              (isTeacher ? (t.role === "teacher" || t.role === "cadre" || t.role === "staff") : (!t.role || t.role === "student")),
          );
          setResolvedTicketCount(filteredTickets.length);
        }
      } catch (err) {
        console.warn("Error fetching api tickets:", err);
      }
    };
    fetchApiTickets();

    const unsubRealtime = realtimeManager.on('support_tickets_updated', () => {
      fetchApiTickets();
    });

    const q = query(
      collection(db, "support_tickets"),
      where("userId", "in", possibleIds),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tickets = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filteredTickets = tickets.filter(
          (t) =>
            (t as any).status === "resolved" &&
            ((t as any).readByStudent === false ||
              (t as any).readByStudent === undefined) &&
            (isTeacher ? ((t as any).role === "teacher" || (t as any).role === "cadre" || (t as any).role === "staff") : (!(t as any).role || (t as any).role === "student")),
        );
        if (filteredTickets.length > 0) {
          setResolvedTicketCount(filteredTickets.length);
        }
      },
      (error) => console.warn("SchoolPlatform support_tickets error:", error),
    );
    return () => {
      unsubscribe();
      unsubRealtime();
    };
  }, [
    isTeacher,
    userProfile?.studentCode,
    userProfile?.code,
    userProfile?.parentCode,
    auth.currentUser?.uid,
  ]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
    null,
  );
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [seenStories, setSeenStories] = useState<string[]>(() => {
    try {
      const key = `seen_stories_${auth.currentUser?.uid || "guest"}`;
      const value = safeStorage.getItem(key);
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  });
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const likesInFlightRef = useRef<Set<string>>(new Set());

  // Custom Story Interactive controls scale & offset (Facebook / Instagram immersion styling)
  const [storyZoom, setStoryZoom] = useState<number>(1);
  const [storyPanX, setStoryPanX] = useState<number>(0);
  const [storyPanY, setStoryPanY] = useState<number>(0);
  const [isZoomControlsOpen, setIsZoomControlsOpen] = useState<boolean>(false);
  const [storyGroupIndex, setStoryGroupIndex] = useState<number>(0);

  // High-fidelity story options for creation & viewing
  const [newStoryMusic, setNewStoryMusic] = useState<string>("none");
  const [newStoryFont, setNewStoryFont] = useState<string>("classic");
  const [newStoryBgGradient, setNewStoryBgGradient] =
    useState<string>("indigo");
  const [newStorySticker, setNewStorySticker] = useState<string | null>(null);
  const [newStoryTextColor, setNewStoryTextColor] = useState<string>("#ffffff");
  const [newStoryTextBg, setNewStoryTextBg] = useState<
    "transparent" | "semi-black" | "solid-white" | "neon-glow"
  >("transparent");
  const [newStoryTextX, setNewStoryTextX] = useState<number>(0);
  const [newStoryTextY, setNewStoryTextY] = useState<number>(0);
  const [newStoryTextScale, setNewStoryTextScale] = useState<number>(1.0);
  const [newStoryStickerX, setNewStoryStickerX] = useState<number>(0);
  const [newStoryStickerY, setNewStoryStickerY] = useState<number>(0);
  const [newStoryStickerScale, setNewStoryStickerScale] = useState<number>(1.2);
  const [creatorActiveTab, setCreatorActiveTab] = useState<
    "font" | "gradient" | "music" | "sticker" | null
  >(null);

  const [isStoryMenuOpen, setIsStoryMenuOpen] = useState(false);
  const [isStoryViewersOpen, setIsStoryViewersOpen] = useState(false);
  const [newStoryMediaFiles, setNewStoryMediaFiles] = useState<string[]>([]);
  const [newStoryMediaType, setNewStoryMediaType] = useState<
    "image" | "video" | "group"
  >("image");
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isStoryTypingOpen, setIsStoryTypingOpen] = useState<boolean>(false);
  const storyGroupMediaInputRef = useRef<HTMLInputElement>(null);

  // Pinch scale references
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1.0);

  const handleTextTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      touchStartDist.current = dist;
      touchStartScale.current = newStoryTextScale;
    }
  };

  const handleTextTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const ratio = dist / touchStartDist.current;
      const nextScale = Math.max(
        0.5,
        Math.min(2.5, touchStartScale.current * ratio),
      );
      setNewStoryTextScale(nextScale);
    }
  };

  const handleTextTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStartDist.current = null;
    }
  };

  const touchStartStickerDist = useRef<number | null>(null);
  const touchStartStickerScale = useRef<number>(1.2);

  const handleStickerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && newStorySticker) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      touchStartStickerDist.current = dist;
      touchStartStickerScale.current = newStoryStickerScale;
    }
  };

  const handleStickerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      e.touches.length === 2 &&
      touchStartStickerDist.current !== null &&
      newStorySticker
    ) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const scaleRef = dist / touchStartStickerDist.current;
      // Clamp scale between 0.5 and 5.0
      setNewStoryStickerScale(
        Math.min(Math.max(touchStartStickerScale.current * scaleRef, 0.5), 5.0),
      );
    }
  };

  const handleStickerTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStartStickerDist.current = null;
    }
  };

  // Play soundtrack automatically when story is viewed
  useEffect(() => {
    if (activeStory) {
      playStoryAudio(activeStory.musicTrack || "none");
    } else {
      stopStoryAudio();
    }
    return () => {
      stopStoryAudio();
    };
  }, [activeStory?.id]);

  // Client-side dragging pointers implementation
  const [isPointerDraggingText, setIsPointerDraggingText] = useState(false);
  const pointerDragStart = useRef({ x: 0, y: 0 });
  const pointerTextOffset = useRef({ x: 0, y: 0 });
  const pointerDragMoved = useRef(false);

  // Sticker dragging implementation
  const [isPointerDraggingSticker, setIsPointerDraggingSticker] =
    useState(false);
  const pointerDragStartSticker = useRef({ x: 0, y: 0 });
  const pointerStickerOffset = useRef({ x: 0, y: 0 });
  const pointerDragMovedSticker = useRef(false);

  const handlePointerDownSticker = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDraggingSticker(true);
    pointerDragMovedSticker.current = false;
    pointerDragStartSticker.current = { x: e.clientX, y: e.clientY };
    pointerStickerOffset.current = { x: newStoryStickerX, y: newStoryStickerY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSticker = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDraggingSticker) return;
    const dx = e.clientX - pointerDragStartSticker.current.x;
    const dy = e.clientY - pointerDragStartSticker.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      pointerDragMovedSticker.current = true;
    }
    setNewStoryStickerX(pointerStickerOffset.current.x + dx);
    setNewStoryStickerY(pointerStickerOffset.current.y + dy);
  };

  const handlePointerUpSticker = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDraggingSticker(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsPointerDraggingText(true);
    pointerDragMoved.current = false;
    pointerDragStart.current = { x: e.clientX, y: e.clientY };
    pointerTextOffset.current = { x: newStoryTextX, y: newStoryTextY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDraggingText) return;
    const dx = e.clientX - pointerDragStart.current.x;
    const dy = e.clientY - pointerDragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      pointerDragMoved.current = true;
    }
    const nextX = Math.max(
      -130,
      Math.min(130, pointerTextOffset.current.x + dx),
    );
    const nextY = Math.max(
      -230,
      Math.min(230, pointerTextOffset.current.y + dy),
    );
    setNewStoryTextX(nextX);
    setNewStoryTextY(nextY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPointerDraggingText) {
      setIsPointerDraggingText(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (!pointerDragMoved.current) {
        setIsStoryTypingOpen(true);
      }
    }
  };

  // Reactions and story tracking states
  const [activePostReactionId, setActivePostReactionId] = useState<
    string | null
  >(null);
  const [clickingReactionKey, setClickingReactionKey] = useState<string | null>(
    null,
  );

  // Group raw stories by student/user (Facebook-style)
  const groupedStories = useMemo(() => {
    const groups: { [userId: string]: any[] } = {};
    stories.forEach((story) => {
      const key = story.userId || story.userName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(story);
    });

    // Sort chronologically within each user group
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const aTime = a.timestamp?.toDate
          ? (typeof a.timestamp?.toDate === 'function' ? a.timestamp.toDate() : new Date(a.timestamp)).getTime()
          : new Date(a.timestamp || 0).getTime();
        const bTime = b.timestamp?.toDate
          ? (typeof b.timestamp?.toDate === 'function' ? b.timestamp.toDate() : new Date(b.timestamp)).getTime()
          : new Date(b.timestamp || 0).getTime();
        return aTime - bTime;
      });
    });

    return groups;
  }, [stories]);

  // Unique story owners list (for story circles rendering)
  const uniqueStoryUsers = useMemo(() => {
    const users: Array<{
      userId: string;
      userName: string;
      userPhotoURL: string;
      stories: any[];
      latestTimestamp: number;
      allSeen: boolean;
    }> = [];

    Object.entries(groupedStories).forEach(([key, val]) => {
      const userStories = val as any[];
      const firstStory = userStories[0];
      const latestStory = userStories[userStories.length - 1];
      const latestTimestamp = latestStory.timestamp?.toDate
        ? (typeof latestStory.timestamp?.toDate === 'function' ? latestStory.timestamp.toDate() : new Date(latestStory.timestamp)).getTime()
        : new Date(latestStory.timestamp || 0).getTime();

      const allSeen = userStories.every((s: any) => seenStories.includes(s.id));

      users.push({
        userId: key,
        userName: firstStory.userName,
        userPhotoURL: firstStory.userPhotoURL,
        stories: userStories,
        latestTimestamp,
        allSeen,
      });
    });

    // Sort by latest story timestamp descending
    return users.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [groupedStories, seenStories]);

  // Unified sequence list of stories (flat list ordered: logged-in user's stories first, then other users)
  const playlist = useMemo(() => {
    const myUserId = getCurrentUserId();
    const myStories = groupedStories[myUserId] || [];
    const otherUsers = uniqueStoryUsers.filter(
      (user) => user.userId !== myUserId,
    );
    const otherStories = otherUsers.flatMap((user) => user.stories);
    return [...myStories, ...otherStories];
  }, [groupedStories, uniqueStoryUsers]);

  // All stories of the active story's owner
  const activeGroupStories = useMemo(() => {
    if (!activeStory) return [];
    const key = activeStory.userId || activeStory.userName;
    return groupedStories[key] || [];
  }, [activeStory, groupedStories]);

  // Position index of the active story inside its group
  const activeGroupIndex = useMemo(() => {
    if (!activeStory) return -1;
    return activeGroupStories.findIndex((s) => s.id === activeStory.id);
  }, [activeStory, activeGroupStories]);

  // Timer effect to automatically advance stories sequentially
  useEffect(() => {
    if (!activeStory) {
      setStoryProgress(0);
      return;
    }

    const activeIndex = playlist.findIndex((s) => s.id === activeStory.id);
    if (activeIndex === -1) return;

    setStoryProgress(0);

    const intervalTime = 100; // Update progress bar every 100ms
    const totalDuration = 6000; // 6 seconds per story
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      if (isStoryPausedRef.current) return;
      setStoryProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Advance to the next story in the unified playlist
          const nextIndex = activeIndex + 1;
          if (nextIndex < playlist.length) {
            handleViewStory(playlist[nextIndex]);
          } else {
            setActiveStory(null);
          }
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStory, playlist]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const storyMediaInputRef = useRef<HTMLInputElement>(null);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isCreateStoryMenuOpen, setIsCreateStoryMenuOpen] = useState(false);

  const handleAddStoryClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin' && platformLocks.storiesLock) {
      showToast("النشر في ستوريات التميز مقفل حالياً من قبل الإدارة.", "error");
      return;
    }
    setIsCreateStoryMenuOpen(true);
  };

  const [newStoryContent, setNewStoryContent] = useState("");
  const [newStoryMedia, setNewStoryMedia] = useState<string | null>(null);

  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState("");
  const [isAdminNoteModalOpen, setIsAdminNoteModalOpen] = useState(false);
  const [adminNoteTargetPost, setAdminNoteTargetPost] = useState<Post | null>(
    null,
  );
  const [newAdminNote, setNewAdminNote] = useState("");
  const [shareText, setShareText] = useState("");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast("جاري معالجة الصورة الشخصية...", "info");
      const compressedBase64 = await compressImage(file, 400, 0.75);

      if (isTeacher) {
        const teacherId = currentTeacherData?.id || teacherData?.id;
        const teacherCode = currentTeacherData?.code || teacherData?.code;

        if (teacherId) {
          try {
            await fetch(`/api/teachers/${teacherId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ photoURL: compressedBase64 })
            });
          } catch (tErr) {
            console.warn("Error updating teacher via API:", tErr);
          }

          try {
            await updateDoc(doc(db, "teachers", teacherId), {
              photoURL: compressedBase64,
            });
          } catch (tDocErr) {}
        }

        if (teacherCode) {
          try {
            const q = query(collection(db, "activation_codes"), where("code", "==", teacherCode));
            const snap = await getDocs(q);
            if (!snap.empty) {
              await updateDoc(doc(db, "activation_codes", snap.docs[0].id), {
                photoURL: compressedBase64,
              });
            }
          } catch (cErr) {}
        }

        if (auth.currentUser?.uid) {
          try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              photoURL: compressedBase64,
            });
          } catch (uErr) {}
        }

        setCurrentTeacherData((prev: any) => ({ ...(prev || teacherData), photoURL: compressedBase64 }));
        onUpdateProfile?.({ photoURL: compressedBase64 });
        showToast("تم تحديث صورة الأستاذ بنجاح! 📸", "success");
        return;
      }

      const currentStudentCode = userProfile?.studentCode || userProfile?.code;
      if (userProfile?.role === "student" && currentStudentCode) {
        try {
          const q1 = query(
            collection(db, "school_students"),
            where("code", "==", currentStudentCode),
          );
          const snap1 = await getDocs(q1);
          if (!snap1.empty) {
            await updateDoc(doc(db, "school_students", snap1.docs[0].id), {
              photoURL: compressedBase64,
            });
          }

          const q2 = query(
            collection(db, "activation_codes"),
            where("code", "==", currentStudentCode),
          );
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
            await updateDoc(doc(db, "activation_codes", snap2.docs[0].id), {
              photoURL: compressedBase64,
            });
          }
        } catch (innerErr) {
          console.error("error updating student collections", innerErr);
        }
      } else if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser!.uid), {
          photoURL: compressedBase64,
        });
      }

      onUpdateProfile?.({ photoURL: compressedBase64 });

      showToast("تم تحديث الصورة الشخصية بنجاح! 📸", "success");
    } catch (err) {
      console.error("Error updating avatar:", err);
      showToast("فشل تحديث الصورة الشخصية", "error");
    }
  };

  const handlePublishStory = async () => {
    if (
      !newStoryContent.trim() &&
      !newStoryMedia &&
      newStoryMediaFiles.length === 0
    )
      return;
    try {
      await addDoc(collection(db, "community_stories"), {
        userId: getCurrentUserId(),
        userName: getUserName(),
        userPhotoURL: getUserPhoto(),
        postContent: newStoryContent,
        postMedia: newStoryMedia || null,
        mediaType: newStoryMediaType || "image",
        postMediaGroup: newStoryMediaFiles || [],
        timestamp: serverTimestamp(),
        schoolId: schoolId,
        grade: grade,
        musicTrack: newStoryMusic,
        fontStyle: newStoryFont,
        bgGradient: newStoryBgGradient,
        sticker: newStorySticker,
        textColor: newStoryTextColor || "#ffffff",
        textBg: newStoryTextBg || "transparent",
        textX: newStoryTextX || 0,
        textY: newStoryTextY || 0,
        textScale: newStoryTextScale || 1.0,
        stickerX: newStoryStickerX || 0,
        stickerY: newStoryStickerY || 0,
        stickerScale: newStoryStickerScale || 1.2,
        viewers: [],
      });
      showToast("تم إضافة التميز إلى يومياتك بنجاح! 🌟", "success");

      const matches = newStoryContent.match(/@(\S+)/g);
      if (matches) {
        matches.forEach((m: string) => {
          const name = m.substring(1).replace(/_/g, " ");
          if (name !== getUserName()) {
            pushSocialNotification(
              null,
              name,
              getUserName(),
              getUserPhoto(),
              "mention_story",
              newStoryContent,
            );
          }
        });
      }

      setNewStoryContent("");
      setNewStoryMedia(null);
      setNewStoryMediaFiles([]);
      setNewStoryMediaType("image");
      setNewStoryMusic("none");
      setNewStoryFont("classic");
      setNewStoryBgGradient("indigo");
      setNewStorySticker(null);
      setNewStoryTextColor("#ffffff");
      setNewStoryTextBg("transparent");
      setNewStoryTextX(0);
      setNewStoryTextY(0);
      setNewStoryTextScale(1.0);
      setIsStoryModalOpen(false);
    } catch (err) {
      console.error("Error publishing story:", err);
      showToast("فشل نشر التميز اليومي", "error");
    }
  };

  const handleStoryMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast("جاري معالجة الملف لليوميات...", "info");
      const isVideo = file.type.startsWith("video/");
      if (isVideo) {
        const reader = new FileReader();
        reader.onload = () => {
          setNewStoryMedia(reader.result as string);
          setNewStoryMediaType("video");
          setNewStoryMediaFiles([]);
          setIsStoryModalOpen(true);
          showToast("تم إرفاق مقطع الفيديو بنجاح! 🎥", "success");
        };
        reader.readAsDataURL(file);
      } else {
        const compressedBase64 = await compressImage(file, 1920, 0.95);
        setNewStoryMedia(compressedBase64);
        setNewStoryMediaType("image");
        setNewStoryMediaFiles([]);
        setIsStoryModalOpen(true);
        showToast("تم إرفاق الصورة بنجاح! 📸", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("فشل في معالجة الملف المرفق", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleStoryGroupMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      showToast("جاري معالجة مجموعة الصور...", "info");
      const bases: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, 1920, 0.95);
        bases.push(compressed);
      }
      setNewStoryMediaFiles((prev) => [...prev, ...bases]);
      setNewStoryMediaType("group");
      setNewStoryMedia(bases[0]);
      setIsStoryModalOpen(true);
      showToast(`تم إرفاق ${files.length} صور كمجموعة بنجاح! 📸✨`, "success");
    } catch (err) {
      console.error(err);
      showToast("فشل في معالجة الصور للمجموعة", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleViewStory = async (story: any) => {
    // Create or resume audio context synchronously within the user gesture
    initStoryAudioContext();

    setActiveStory(story);
    setStoryZoom(1);
    setStoryPanX(0);
    setStoryPanY(0);
    setIsZoomControlsOpen(false);
    setIsStoryMenuOpen(false);
    setIsStoryViewersOpen(false);

    if (!seenStories.includes(story.id)) {
      const newSeen = [...seenStories, story.id];
      setSeenStories(newSeen);
      try {
        const key = `seen_stories_${auth.currentUser?.uid || "guest"}`;
        safeStorage.setItem(key, JSON.stringify(newSeen));
      } catch (err) {
        console.error(err);
      }
    }

    if (auth.currentUser && story.id) {
      try {
        const storyRef = doc(db, "community_stories", story.id);
        const alreadyViewed = story.viewers?.some(
          (v: any) => v.uid === auth.currentUser?.uid,
        );
        if (!alreadyViewed) {
          const viewerObj = {
            uid: getCurrentUserId(),
            name: getUserName(),
            photoURL: getUserPhoto(),
            timestamp: new Date().toISOString(),
          };

          await updateDoc(storyRef, {
            viewers: arrayUnion(viewerObj),
          });

          setActiveStory((prev: any) => {
            if (prev && prev.id === story.id) {
              const currentViewers = prev.viewers ? [...prev.viewers] : [];
              if (
                !currentViewers.some((v) => v.uid === auth.currentUser?.uid)
              ) {
                currentViewers.push(viewerObj);
              }
              return { ...prev, viewers: currentViewers };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error updating story viewers:", err);
      }
    }
  };

  const handleShareStory = async (story: any) => {
    try {
      const shareUrl = `${window.location.origin}/?storyId=${story.id}`;
      await copyToClipboard(shareUrl);
      showToast("تم نسخ رابط الحالة بنجاح! كود مشاركة 🔗✨", "success");
    } catch (err) {
      console.error(err);
      showToast("فشل في نسخ الرابط", "error");
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      showToast("جاري حذف هذه الحالة...", "info");
      await deleteDoc(doc(db, "community_stories", storyId));
      setActiveStory(null);
      showToast("تم إيقاف الحالة بنجاح! 🗑️", "success");
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ عند محاولة إيقاف الحالة", "error");
    }
  };

  const handleViewUserStories = (user: any) => {
    const firstUnseen =
      user.stories.find((s: any) => !seenStories.includes(s.id)) ||
      user.stories[0];
    handleViewStory(firstUnseen);
  };

  const handlePrevStory = () => {
    if (!activeStory) return;
    const activeIndex = playlist.findIndex((s) => s.id === activeStory.id);
    if (activeIndex > 0) {
      handleViewStory(playlist[activeIndex - 1]);
    }
  };

  const handleNextStory = () => {
    if (!activeStory) return;
    const activeIndex = playlist.findIndex((s) => s.id === activeStory.id);
    if (activeIndex < playlist.length - 1) {
      handleViewStory(playlist[activeIndex + 1]);
    } else {
      setActiveStory(null);
    }
  };

  const handleNextUserStories = () => {
    if (!activeStory) return;
    const currentUserId = activeStory.userId || activeStory.userName;
    const userIndex = uniqueStoryUsers.findIndex(
      (u) => u.userId === currentUserId,
    );
    if (userIndex !== -1 && userIndex < uniqueStoryUsers.length - 1) {
      const nextUser = uniqueStoryUsers[userIndex + 1];
      handleViewUserStories(nextUser);
    } else {
      setActiveStory(null);
    }
  };

  const unpauseStoryTimer = () => {
    isStoryPausedRef.current = false;
    setIsStoryUIHidden(false);
  };

  const handleStoryPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Attempt to resume audio context on first screen interaction
    initStoryAudioContext();

    isSwipingStory.current = false;
    storyTouchStartX.current = e.clientX;
    storyTouchStartTime.current = Date.now();

    longPressTimeout.current = setTimeout(() => {
      if (!isSwipingStory.current) {
        isStoryPausedRef.current = true;
        setIsStoryUIHidden(true);
      }
    }, 250);
  };

  const handleStoryPointerMove = (e: React.PointerEvent) => {
    if (storyTouchStartX.current === null) return;

    const dx = e.clientX - storyTouchStartX.current;
    if (Math.abs(dx) > 10) {
      isSwipingStory.current = true;
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
    }
  };

  const handleStoryPointerUp = (e: React.PointerEvent) => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    unpauseStoryTimer();

    if (storyTouchStartX.current === null) return;

    const dx = e.clientX - storyTouchStartX.current;
    const isClick =
      !isSwipingStory.current &&
      Date.now() - (storyTouchStartTime.current || 0) < 300;

    storyTouchStartX.current = null;
    storyTouchStartTime.current = null;

    const doNext = () => {
      const groupMedia = activeStory?.postMediaGroup || [];
      const hasGroupMedia =
        activeStory?.mediaType === "group" && groupMedia.length > 1;
      if (hasGroupMedia && storyGroupIndex < groupMedia.length - 1) {
        setStoryGroupIndex((prev) => prev + 1);
        setStoryProgress(0);
      } else {
        handleNextStory();
      }
    };

    const doPrev = () => {
      const groupMedia = activeStory?.postMediaGroup || [];
      const hasGroupMedia =
        activeStory?.mediaType === "group" && groupMedia.length > 1;
      if (hasGroupMedia && storyGroupIndex > 0) {
        setStoryGroupIndex((prev) => prev - 1);
        setStoryProgress(0);
      } else {
        handlePrevStory();
      }
    };

    if (isSwipingStory.current) {
      if (Math.abs(dx) > 50) {
        if (dx < 0) {
          doNext();
        } else {
          doPrev();
        }
      }
      isSwipingStory.current = false;
      return;
    }

    if (isClick) {
      const screenWidth = window.innerWidth;

      // Right hemisphere tap -> Prev story. Left hemisphere tap -> Next story (RTL).
      if (e.clientX > screenWidth / 2) {
        doPrev();
      } else {
        doNext();
      }
    }
  };

  const handleStoryPointerLeave = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    unpauseStoryTimer();
    storyTouchStartX.current = null;
    storyTouchStartTime.current = null;
    isSwipingStory.current = false;
  };

  const handlePrevUserStories = () => {
    if (!activeStory) return;
    const currentUserId = activeStory.userId || activeStory.userName;
    const userIndex = uniqueStoryUsers.findIndex(
      (u) => u.userId === currentUserId,
    );
    if (userIndex > 0) {
      const prevUser = uniqueStoryUsers[userIndex - 1];
      handleViewUserStories(prevUser);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditingPostContent(post.content);
    setOpenMenuPostId(null);
  };

  const handleSaveEditPost = async (id: string) => {
    if (!editingPostContent.trim()) return;
    try {
      await updateDoc(doc(db, "community_posts", id), {
        content: editingPostContent,
      });
      setEditingPostId(null);
      showToast("تم تعديل المنشور بنجاح! ✏️", "success");
    } catch (err) {
      console.error("Error editing post:", err);
      showToast("فشل في تعديل المنشور", "error");
    }
  };

  const handleDeletePost = (id: string) => {
    setDeletingPostId(id);
    setOpenMenuPostId(null);
  };

  const executeDeletePost = async () => {
    if (!deletingPostId) return;
    try {
      await deleteDoc(doc(db, "community_posts", deletingPostId));
      showToast("تم حذف المنشور بنجاح! 🗑️", "success");
      setDeletingPostId(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      showToast("فشل في حذف المنشور", "error");
    }
  };

  const handleTogglePinPost = async (post: Post) => {
    try {
      const postRef = doc(db, "community_posts", post.id);
      await updateDoc(postRef, {
        isPinned: !post.isPinned,
      });
      showToast(
        post.isPinned ? "تم إلغاء تثبيت المنشور" : "تم تثبيت المنشور بنجاح! 📌",
        "success",
      );
      setOpenMenuPostId(null);
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ", "error");
    }
  };

  const handleToggleLockPost = async (post: Post) => {
    try {
      const postRef = doc(db, "community_posts", post.id);
      await updateDoc(postRef, {
        isLocked: !post.isLocked,
      });
      showToast(
        post.isLocked ? "تم فتح التعليقات" : "تم قفل التعليقات 🔒",
        "success",
      );
      setOpenMenuPostId(null);
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ", "error");
    }
  };

  const handleAddAdminNoteClick = async (post: Post) => {
    setAdminNoteTargetPost(post);
    setNewAdminNote("");
    setIsAdminNoteModalOpen(true);
    setOpenMenuPostId(null);
  };

  const submitAdminNote = async () => {
    if (adminNoteTargetPost && newAdminNote.trim() !== "") {
      try {
        await addDoc(
          collection(
            db,
            "community_posts",
            adminNoteTargetPost.id,
            "admin_notes",
          ),
          {
            content: newAdminNote.trim(),
            timestamp: serverTimestamp(),
          },
        );
        showToast("تم إضافة الملاحظة الإدارية بنجاح", "success");
        setIsAdminNoteModalOpen(false);
        setAdminNoteTargetPost(null);
        setNewAdminNote("");
      } catch (err) {
        console.error(err);
        showToast("حدث خطأ", "error");
      }
    }
  };

  const handleSaveInspiringPhrase = async (studentId: string) => {
    if (!editingPhraseText.trim()) return;
    try {
      if (isTeacher) {
        const teacherId = currentTeacherData?.id || teacherData?.id;
        if (teacherId) {
          try {
            await fetch(`/api/teachers/${teacherId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bio: editingPhraseText.trim() })
            });
          } catch (tErr) {}
          try {
            await updateDoc(doc(db, "teachers", teacherId), {
              bio: editingPhraseText.trim(),
              inspiringPhrase: editingPhraseText.trim(),
            });
          } catch (tDocErr) {}
        }
        if (auth.currentUser?.uid) {
          try {
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              bio: editingPhraseText.trim(),
              inspiringPhrase: editingPhraseText.trim(),
            });
          } catch (uErr) {}
        }
        setCurrentTeacherData((prev: any) => ({
          ...(prev || teacherData),
          bio: editingPhraseText.trim(),
          inspiringPhrase: editingPhraseText.trim(),
        }));
        showToast("تم تحديث عبارتك الملهمة بنجاح! 🌟", "success");
        setIsEditingPhrase(false);
        return;
      }

      if (studentId) {
        await updateDoc(doc(db, "school_students", studentId), {
          inspiringPhrase: editingPhraseText.trim(),
        });
        showToast("تم تحديث عبارتك الملهمة بنجاح! 🌟", "success");
        setIsEditingPhrase(false);
      } else {
        showToast("لا يمكن تحديث العبارة الملهمة في الوضع التجريبي", "info");
      }
    } catch (err) {
      console.error("Error updating phrase:", err);
      showToast("فشل في تحديث العبارة الملهمة", "error");
    }
  };

  useEffect(() => {
    if (!schoolId) return;
    const storiesQuery = query(
      collection(db, "community_stories"),
      where("schoolId", "==", schoolId),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(
      storiesQuery,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Only display stories <= 24 hours old and matching of the same level/grade!
        const now = Date.now();
        const cutoff = now - 24 * 60 * 60 * 1000;
        const filtered = list.filter((story: any) => {
          // Grade filter check
          if (story.grade && grade && story.grade !== grade) return false;

          // 24 hours age cutoff check
          if (!story.timestamp) return true; // keep newly posted in-flight story
          const storyTime = story.timestamp.toDate
            ? (typeof story.timestamp?.toDate === 'function' ? story.timestamp.toDate() : new Date(story.timestamp)).getTime()
            : new Date(story.timestamp).getTime();
          return storyTime >= cutoff;
        });
        setStories(filtered);
      },
      (err) => console.warn("Stories sub error:", err),
    );
    return () => unsubscribe();
  }, [schoolId, grade]);

  const getLikedPosts = (): string[] => {
    const key = `liked_posts_${auth.currentUser?.uid || "guest"}`;
    try {
      return JSON.parse(safeStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  };

  const toggleLocalPostLike = (postId: string, isLikedSelected: boolean) => {
    const key = `liked_posts_${auth.currentUser?.uid || "guest"}`;
    const current = getLikedPosts();
    let updated;
    if (isLikedSelected) {
      updated = current.filter((id) => id !== postId);
    } else {
      updated = [...current, postId];
    }
    safeStorage.setItem(key, JSON.stringify(updated));
  };

  useEffect(() => {
    if (!schoolId) return;

    const postsRef = collection(db, "community_posts");
    // Simple query by timestamp to avoid missing compound indices
    const postsQuery = query(postsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      postsQuery,
      async (snapshot) => {
        const likedList = getLikedPosts();
        const fetchedPosts = await Promise.all(
          snapshot.docs.map(async (docRef) => {
            const data = docRef.data();
            const notesSnap = await getDocs(
              collection(db, "community_posts", docRef.id, "admin_notes"),
            );
            const adminNotes = notesSnap.docs.map((n) => n.data());

            let userReaction = null;
            if (auth.currentUser) {
              const uReactDoc = await getDoc(
                doc(
                  db,
                  "community_posts",
                  docRef.id,
                  "reactions_list",
                  getCurrentUserId(),
                ),
              );
              if (uReactDoc.exists()) {
                userReaction = uReactDoc.data().sticker;
              }
            }

            return {
              id: docRef.id,
              userId: data.userId || "",
              userName: data.userName,
              userPhotoURL: data.userPhotoURL,
              mediaUrl: data.mediaUrl,
              time: data.timestamp
                ? (typeof data.timestamp?.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp)).toLocaleString("ar-IQ")
                : "الآن",
              content: data.content,
              likes: data.likes || 0,
              comments: data.comments || 0,
              shares: data.shares || 0,
              isLiked: likedList.includes(docRef.id),
              type: data.type || "student",
              isPinned: data.isPinned || false,
              isLocked: data.isLocked || false,
              adminNotes: adminNotes,
              stageIcon: data.stageIcon || "",
              stageStickers: data.stageStickers || [],
              reactions: data.reactions || {},
              userReaction: userReaction,
              schoolId: data.schoolId || "",
              grade: data.grade || "",
            } as Post;
          }),
        );

        // Filter with high-fidelity visibility matching
        const filteredPosts = fetchedPosts.filter((post) => {
          // Must match school context
          const isSchoolMatch =
            !post.schoolId ||
            post.schoolId === "all" ||
            post.schoolId === schoolId;
          if (!isSchoolMatch) return false;

          // If it's a student/teacher post, only show to the same grade
          if (post.type !== "admin") {
            return post.grade === grade;
          }

          // For admin posts, determine visibility based on configured targets
          const postGrade = post.grade || "";
          if (
            postGrade === "جميع الصفوف" ||
            postGrade === "all" ||
            !postGrade
          ) {
            return true;
          }

          // Check stage matches (primary, intermediate, preparatory)
          const isStudentPrep = (g: string) =>
            g.includes("علمي") ||
            g.includes("أدبي") ||
            g.includes("رابع") ||
            g.includes("خامس") ||
            g.includes("سادس") ||
            g.includes("إعدادي");
          const isStudentInter = (g: string) => g.includes("متوسط");
          const isStudentPrimary = (g: string) => g.includes("ابتدائي");

          if (postGrade.includes("الإعدادية") && isStudentPrep(grade))
            return true;
          if (postGrade.includes("المتوسطة") && isStudentInter(grade))
            return true;
          if (postGrade.includes("الابتدائية") && isStudentPrimary(grade))
            return true;

          // Otherwise exact match or substring check
          if (
            postGrade === grade ||
            grade.includes(postGrade) ||
            postGrade.includes(grade)
          ) {
            return true;
          }

          return false;
        });

        // Sort with Pinned first
        filteredPosts.sort(
          (a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0),
        );
        setPosts(filteredPosts);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          "community_posts",
          false,
        );
      },
    );

    return () => unsubscribe();
  }, [schoolId, grade]);

  const handleReactToPost = async (postId: string, sticker: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post || !auth.currentUser) return;

      const previousSticker = post.userReaction;
      const isRemoving = previousSticker === sticker;

      // Optimistic UI update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const currentReactions = { ...(p.reactions || {}) };

            if (isRemoving) {
              currentReactions[sticker] = Math.max(
                0,
                (currentReactions[sticker] || 0) - 1,
              );
            } else {
              if (previousSticker && currentReactions[previousSticker]) {
                currentReactions[previousSticker] = Math.max(
                  0,
                  currentReactions[previousSticker] - 1,
                );
              }
              currentReactions[sticker] = (currentReactions[sticker] || 0) + 1;
            }

            return {
              ...p,
              reactions: currentReactions,
              userReaction: isRemoving ? null : sticker,
            };
          }
          return p;
        }),
      );

      const postRef = doc(db, "community_posts", postId);
      const updates: any = {};

      if (isRemoving) {
        updates[`reactions.${sticker}`] = increment(-1);
      } else {
        if (previousSticker) {
          updates[`reactions.${previousSticker}`] = increment(-1);
        }
        updates[`reactions.${sticker}`] = increment(1);
      }

      await updateDoc(postRef, updates);

      const userReactionRef = doc(
        db,
        "community_posts",
        postId,
        "reactions_list",
        getCurrentUserId(),
      );
      if (isRemoving) {
        await deleteDoc(userReactionRef);
        showToast(`تم إزالة التفاعل`, "info");
      } else {
        await setDoc(
          userReactionRef,
          {
            uid: getCurrentUserId(),
            name: getUserName(),
            photoURL: getUserPhoto(),
            sticker: sticker,
            timestamp: serverTimestamp(),
          },
          { merge: true },
        );
        showToast(`تم التفاعل بـ ${sticker}! ✨`, "success");
      }
    } catch (err) {
      console.error("Error reacting to post with sticker:", err);
    }
  };

  const toggleLike = async (id: string, isLiked: boolean) => {
    if (likesInFlightRef.current.has(id)) return;
    likesInFlightRef.current.add(id);

    // Update local storage first
    toggleLocalPostLike(id, isLiked);

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked
                ? Math.max(0, post.likes - 1)
                : post.likes + 1,
            }
          : post,
      ),
    );

    try {
      const postRef = doc(db, "community_posts", id);
      await updateDoc(postRef, {
        likes: isLiked ? increment(-1) : increment(1),
      });

      if (!isLiked) {
        const targetPost = posts.find((p) => p.id === id);
        if (targetPost && targetPost.userId !== getCurrentUserId()) {
          pushSocialNotification(
            targetPost.userId,
            null,
            getUserName(),
            getUserPhoto(),
            "like",
            targetPost.content || "",
          );
        }
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Rollback on error
      toggleLocalPostLike(id, !isLiked);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id
            ? {
                ...post,
                isLiked: isLiked,
                likes: isLiked ? post.likes : Math.max(0, post.likes - 1),
              }
            : post,
        ),
      );
    } finally {
      likesInFlightRef.current.delete(id);
    }
  };

  const handleComment = (postId: string) => {
    setActiveCommentPostId(postId);
  };

  const handleShare = (post: Post) => {
    setSharingPost(post);
  };

  const handleShareOption = async (option: "feed" | "story" | "system") => {
    if (!sharingPost || !auth.currentUser) return;

    if (option === "feed") {
      try {
        const commentPrefix = shareText.trim() ? `${shareText.trim()}\n\n` : "";
        await addDoc(collection(db, "community_posts"), {
          userId: getCurrentUserId(),
          userName: getUserName(),
          userPhotoURL: getUserPhoto(),
          mediaUrl: sharingPost.mediaUrl || null,
          content: `${commentPrefix}🔄 تمت إعادة مشاركة منشور لـ (${sharingPost.userName}):\n\n${sharingPost.content}`,
          timestamp: serverTimestamp(),
          schoolId: schoolId,
          schoolName: schoolName,
          grade: grade,
          type: isTeacher
            ? "teacher"
            : userProfile?.role === "admin"
              ? "admin"
              : "student",
        });
        await updateDoc(doc(db, "community_posts", sharingPost.id), {
          shares: increment(1),
        });
        showToast("تمت إعادة مشاركة المنشور في الساحة بنجاح! 🚀", "success");
      } catch (err) {
        console.error("Error sharing to feed:", err);
        showToast("فشل مشاركة المنشور", "error");
      }
    } else if (option === "story") {
      try {
        const commentPrefix = shareText.trim() ? `${shareText.trim()}\n\n` : "";
        await addDoc(collection(db, "community_stories"), {
          userId: getCurrentUserId(),
          userName: getUserName(),
          userPhotoURL: getUserPhoto(),
          postContent: `${commentPrefix}${sharingPost.content}`,
          postMedia: sharingPost.mediaUrl || null,
          timestamp: serverTimestamp(),
          schoolId: schoolId,
          grade: grade,
        });
        await updateDoc(doc(db, "community_posts", sharingPost.id), {
          shares: increment(1),
        });
        showToast(
          "تمت الإضافة إلى حالات التميز الخاصة بك بنجاح! 🌟",
          "success",
        );
      } catch (err) {
        console.error("Error sharing to story:", err);
        showToast("فشل النشر في حالات التميز", "error");
      }
    } else if (option === "system") {
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: schoolName,
            text: sharingPost.content,
          });
        } catch (err) {
          console.error("Error sharing:", err);
        }
      } else {
        await copyToClipboard(sharingPost.content);
        showToast("تم نسخ نص المنشور بنجاح! 📋", "success");
      }
    }
    setSharingPost(null);
    setShareText("");
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast("جاري معالجة الصورة المرفقة...", "info");
      const compressedBase64 = await compressImage(file, 900, 0.75);
      setNewPostMedia(compressedBase64);
    } catch (err) {
      console.error(err);
      showToast("فشل معالجة الصورة", "error");
    }
  };

  const handlePost = async () => {
    if ((!newPostContent.trim() && !newPostMedia) || !auth.currentUser) return;

    if (userProfile && userProfile?.canPost === false) {
      alert("تم تقييد صلاحية النشر لديك من قبل الإدارة.");
      return;
    }

    try {
      const postRef = await addDoc(collection(db, "community_posts"), {
        userId: getCurrentUserId(),
        userName: getUserName(),
        userPhotoURL: getUserPhoto(),
        mediaUrl: newPostMedia,
        content: newPostContent,
        timestamp: serverTimestamp(),
        schoolId: schoolId,
        schoolName: schoolName,
        grade: isTeacher ? (targetBroadcastGrade || "سادس علمي") : grade,
        type: isTeacher
          ? "teacher"
          : userProfile?.role === "admin"
            ? "admin"
            : "student",
      });

      const newPost: Post = {
        id: postRef.id,
        userName: getUserName(),
        userPhotoURL: getUserPhoto(),
        mediaUrl: newPostMedia || undefined,
        time: "الآن",
        content: newPostContent,
        likes: 0,
        comments: 0,
        isLiked: false,
        type: isTeacher ? "teacher" : "student",
        timestamp: new Date(),
      };

      // The onSnapshot will automatically update the UI
      const matches = newPostContent.match(/@(\S+)/g);
      if (matches) {
        matches.forEach((m: string) => {
          const name = m.substring(1).replace(/_/g, " ");
          if (name !== getUserName()) {
            pushSocialNotification(
              null,
              name,
              getUserName(),
              getUserPhoto(),
              "mention_post",
              newPostContent,
            );
          }
        });
      }

      setNewPostContent("");
      setNewPostMedia(null);
      setIsPosting(false);
    } catch (error) {
      console.error("Error posting:", error);
    }
  };

  const tabs = useMemo(() => {
    return rawTabs
      .filter(tab => {
        if ((tab as any).cap && !securityService.canRoleAccess(effectiveRole, (tab as any).cap)) return false;
        return true;
      })
      .map(tab => ({
        ...tab,
        isDisabled: checkIsModuleDisabled(tab.id)
      }));
  }, [rawTabs, disabledModules, isTeacher, userProfile?.role, isLiveActive, effectiveRole, secSettings]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
      setActiveTabState(tabs[0].id as PlatformTab);
    }
  }, [tabs, activeTab]);

  const educationalFields: MaterialField[] = useMemo(() => {
    const baseTeachers = {
      english: [{ name: "أ. سجاد الخفاجي", desc: "خبير اللغة الإنجليزية" }],
      physics: [{ name: "أ. حسن الكرعاوي", desc: "الدكتوراه في الفيزياء" }],
    };

    const getSubjectVisuals = (name: string) => {
      const n = (name || "").replace(/\s+/g, "").replace(/أ|إ|آ/g, "ا").replace(/ة/g, "ه").toLowerCase();
      if (n.includes("اسلام") || n.includes("دين")) return { icon: BookOpen, color: "text-emerald-400", bgColor: "bg-emerald-400/10" };
      if (n.includes("عرب")) return { icon: Feather, color: "text-amber-400", bgColor: "bg-amber-400/10" };
      if (n.includes("نجليز") || n.includes("انكليز")) return { icon: Languages, color: "text-blue-400", bgColor: "bg-blue-400/10" };
      if (n.includes("رياضيات")) return { icon: Calculator, color: "text-rose-400", bgColor: "bg-rose-400/10" };
      if (n.includes("علوم")) return { icon: Microscope, color: "text-cyan-400", bgColor: "bg-cyan-400/10" };
      if (n.includes("احياء")) return { icon: Dna, color: "text-lime-400", bgColor: "bg-lime-400/10" };
      if (n.includes("كيمياء")) return { icon: FlaskConical, color: "text-indigo-400", bgColor: "bg-indigo-400/10" };
      if (n.includes("فيزياء")) return { icon: Atom, color: "text-violet-400", bgColor: "bg-violet-400/10" };
      if (n.includes("اجتماع")) return { icon: Compass, color: "text-fuchsia-400", bgColor: "bg-fuchsia-400/10" };
      if (n.includes("حاسوب") || n.includes("حاسب")) return { icon: Laptop, color: "text-sky-400", bgColor: "bg-sky-400/10" };
      if (n.includes("تاريخ")) return { icon: Landmark, color: "text-orange-400", bgColor: "bg-orange-400/10" };
      if (n.includes("جغراف")) return { icon: Earth, color: "text-teal-400", bgColor: "bg-teal-400/10" };
      if (n.includes("اقتصاد")) return { icon: LineChart, color: "text-yellow-400", bgColor: "bg-yellow-400/10" };
      if (n.includes("فن")) return { icon: Palette, color: "text-pink-400", bgColor: "bg-pink-400/10" };
      if (n.includes("رياضه") || n.includes("بدن")) return { icon: Trophy, color: "text-emerald-400", bgColor: "bg-emerald-400/10" };
      if (n.includes("فرنس")) return { icon: Globe, color: "text-purple-400", bgColor: "bg-purple-400/10" };
      return { icon: BookOpenText, color: "text-amber-400", bgColor: "bg-amber-400/10" };
    };

    const effectiveGrade = (!isTeacher
      ? (gradeName || grade || (userProfile as any)?.grade || targetBroadcastGrade)
      : (targetBroadcastGrade || gradeName || grade || (userProfile as any)?.grade)) || "";

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

    const subjects = getSubjectsForGrade(effectiveGrade, removedIds, subjectMapping);

    if (Array.isArray(subjects) && subjects.length > 0) {
      return subjects.map((s: any) => {
        const matName = typeof s === "string" ? s : s?.name || s?.title || "";
        const visuals = getSubjectVisuals(matName);
        const norm = matName.trim().replace(/أ|إ|آ/g, "ا").replace(/ة/g, "ه").toLowerCase();

        // Match teachers from registered school staff
        const matched = (schoolTeachersList || []).filter((t: any) => {
          if (t.role && t.role !== 'TEACHER') return false;
          const tSub = (t.subject || "").trim().replace(/أ|إ|آ/g, "ا").replace(/ة/g, "ه").toLowerCase();
          if (!tSub) return false;
          return (
            tSub.includes(norm) ||
            norm.includes(tSub) ||
            (tSub.includes("انكليز") && norm.includes("نجليز")) ||
            (norm.includes("انكليز") && tSub.includes("نجليز")) ||
            (tSub.includes("عرب") && norm.includes("عرب")) ||
            (tSub.includes("اسلام") && (norm.includes("اسلام") || norm.includes("دين"))) ||
            (norm.includes("اسلام") && (tSub.includes("اسلام") || tSub.includes("دين"))) ||
            (tSub.includes("حاسوب") && norm.includes("حاسب")) ||
            (tSub.includes("رياضيات") && norm.includes("رياض"))
          );
        });

        let teachers: { name: string; desc: string; photo?: string; rating?: number; studentsCount?: number }[] = [];
        if (matched.length > 0) {
          teachers = matched.map((t: any) => ({
            name: t.name,
            desc: t.bio || `أستاذ مادة ${matName}`,
            photo: t.photo || t.avatar || "",
            rating: t.rating || 5.0,
            studentsCount: (Array.isArray(t.classes) && t.classes.length > 0) ? t.classes.length * 15 : 18
          }));
        } else {
          if (norm.includes("انجليز") || norm.includes("انكليز")) teachers = baseTeachers.english;
          else if (norm.includes("فيزياء")) teachers = baseTeachers.physics;
          else {
            teachers = [
              {
                name: `أستاذ ${matName}`,
                desc: `كادر تدريس ${matName}`,
                photo: "",
                rating: 5.0,
                studentsCount: 15
              }
            ];
          }
        }

        return {
          material: matName,
          icon: visuals.icon,
          color: visuals.color,
          bgColor: visuals.bgColor,
          teachers,
        };
      });
    }

    return [
      {
        material: "التربية الإسلامية",
        icon: BookOpen,
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        teachers: [],
      },
      {
        material: "اللغة العربية",
        icon: Feather,
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        teachers: [],
      },
      {
        material: "اللغة الإنجليزية",
        icon: Languages,
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        teachers: baseTeachers.english,
      },
      {
        material: "الرياضيات",
        icon: Calculator,
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        teachers: [],
      },
      {
        material: "العلوم",
        icon: Microscope,
        color: "text-cyan-400",
        bgColor: "bg-cyan-400/10",
        teachers: [],
      },
    ];
  }, [targetBroadcastGrade, gradeName, grade, userProfile, academicLists, subjectMapping, schoolTeachersList, isTeacher]);

  useEffect(() => {
    if (isTeacher && typeof teacherData?.subject === 'string' && educationalFields.length > 0) {
      const subjectWord = teacherData.subject.trim().replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
      
      const matchIndex = educationalFields.findIndex((f) => {
        const fieldWord = f.material.replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
        return (
          fieldWord.includes(subjectWord) || 
          subjectWord.includes(fieldWord) ||
          (fieldWord.includes("انكليز") && subjectWord.includes("نجليز")) ||
          (fieldWord.includes("نجليز") && subjectWord.includes("انكليز")) ||
          (fieldWord.includes("عرب") && subjectWord.includes("عرب")) ||
          (fieldWord.includes("اسلام") && (subjectWord.includes("اسلام") || subjectWord.includes("دين"))) ||
          (fieldWord.includes("حاسوب") && subjectWord.includes("حاسب")) ||
          (fieldWord.includes("رياضيات") && subjectWord.includes("رياض"))
        );
      });
      if (matchIndex !== -1) {
        setSelectedMaterialIndex(matchIndex);
      }
    }
  }, [isTeacher, teacherData?.subject, educationalFields]);

  const activeClassStudents = useMemo(() => {
    if (isTeacher) {
      return getSectionStudents(selectedTeacherClass || "ALL");
    }

    // Not a teacher (e.g. admin or student view)
    const activeWorkingClass = targetBroadcastGrade;
    if (!activeWorkingClass) return topStudents;
    const normArabic = (s: string) => normalizeArabicText(s || '');
    const targetNorm = normArabic(activeWorkingClass);
    return topStudents.filter((student: any) => {
      const sGradNorm = normArabic(student.grade || "");
      return sGradNorm === targetNorm || targetNorm.includes(sGradNorm) || sGradNorm.includes(targetNorm);
    });
  }, [topStudents, targetBroadcastGrade, selectedTeacherClass, isTeacher, getSectionStudents]);

  useEffect(() => {
    if (selectedControlTab === "assessment") {
      const rosterStudents = activeClassStudents.length > 0 ? activeClassStudents : [
        { id: "fallback_st_1", name: "عبد الله قحطان الطائي", totalPoints: 1420, averagePercent: 95, computedTitle: "المثابر الحقيقي 🎖️", outstandingBadges: ["honor", "discipline"], prideMessage: "نبارك لكم تميز البطل في حل واجبات رادار الذكاء الاصطناعي بنجاح باهر!", avatar: "" },
        { id: "fallback_st_2", name: "رتاج سليم الجبوري", totalPoints: 1980, averagePercent: 98, computedTitle: "صاحبة الصولة الذهبية 👑", outstandingBadges: ["honor_term1", "elite"], prideMessage: "طالبة مجتهدة جداً وتتميز بحضورها المثالي وتفاعلها الرائد في كافة الحصص.", avatar: "" },
        { id: "fallback_st_3", name: "كرار مصطفى البصري", totalPoints: 1240, averagePercent: 92, computedTitle: "فارس رادار الذكاء 📡", outstandingBadges: ["math", "star"], prideMessage: "", avatar: "" },
        { id: "fallback_st_4", name: "فدك حيدر الموسوي", totalPoints: 1850, averagePercent: 100, computedTitle: "الدرع الأكاديمي الممتاز 🛡️", outstandingBadges: ["honor", "progress", "attendance"], prideMessage: "مستوى رائع وإجابات نموذجية مستمرة في امتحانات الأكاديمية.", avatar: "" }
      ];
      
      const currentId = selectedEvaluationStudentId || rosterStudents[0]?.id;
      const student = rosterStudents.find(s => s.id === currentId);
      if (student) {
        const overrides = evaluationOverrides[student.id] || {};
        const activePride = overrides.prideMessage !== undefined ? overrides.prideMessage : (student.prideMessage || "");
        setPrideMessageText(activePride);
      }
    }
  }, [selectedEvaluationStudentId, selectedControlTab, activeClassStudents, evaluationOverrides]);

  const [loadingExcellence, setLoadingExcellence] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [excellenceSubTab, setExcellenceSubTab] = useState<
    "knights" | "badges" | "profile" | "grades"
  >("knights");

  const userCode = (userProfile?.studentCode || userProfile?.code || "")
    .trim()
    .toLowerCase();
  const loggedInStudentData = topStudents.find((s) => {
    const c1 = (s.studentCode || "").trim().toLowerCase();
    const c2 = (s.code || "").trim().toLowerCase();
    const c3 = (s.student || "").trim().toLowerCase();
    return (
      (c1 && c1 === userCode) ||
      (c2 && c2 === userCode) ||
      (c3 && c3 === userCode) ||
      s.id === userProfile?.id
    );
  });

  const defaultStudent = {
    name:
      userProfile?.studentName ||
      userProfile?.name ||
      userProfile?.fullName ||
      auth.currentUser?.displayName ||
      "طالب متميز",
    studentCode:
      userProfile?.studentCode || userProfile?.code || "STU-6TH-ELITE",
    code: userProfile?.studentCode || userProfile?.code || "STU-6TH-ELITE",
    student: userProfile?.studentCode || userProfile?.code || "STU-6TH-ELITE",
    grade: grade || "الصف السادس العلمي",
    outstandingBadges: ["honor", "discipline", "math"],
    grades: {
      mid: { math: 95, physics: 92, chemistry: 94 },
      final: { math: 98, physics: 95, chemistry: 96 },
    },
    inspiringPhrase:
      "سأصل إلى هدفي وسأكون فخراً لنفسي وعائلتي بالتصميم والمثابرة.",
  };

  const activeStudent = loggedInStudentData || defaultStudent;

  // Stories interaction states
  const [reactionFloatingIcons, setReactionFloatingIcons] = useState<
    Array<{ id: number; char: string; x: number; y: number; delay?: number }>
  >([]);
  const [storyCommentText, setStoryCommentText] = useState("");
  const [academyPages, setAcademyPages] = useState<any[]>(() => {
    try {
      const cached = safeStorage.getItem("s6_cached_academy_pages");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeStoryReplies, setActiveStoryReplies] = useState<any[]>([]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'academy_pages'));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => {
          const orderA = typeof a.order === 'number' ? a.order : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const orderB = typeof b.order === 'number' ? b.order : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return orderA - orderB;
        });
        setAcademyPages(list);
        try {
          safeStorage.setItem("s6_cached_academy_pages", JSON.stringify(list));
        } catch(e) {}
      }, (error) => {
        console.warn("Error loading academy pages from Firestore, using local cache:", error);
        try {
          const cached = safeStorage.getItem("s6_cached_academy_pages");
          if (cached) {
            setAcademyPages(JSON.parse(cached));
          }
        } catch(e) {}
      });
      return () => unsub();
    } catch(err) {
      console.warn("Academy pages snapshot listener failed:", err);
    }
  }, [db]);

  // Subscribe to replies for activeStory
  useEffect(() => {
    if (!activeStory) {
      setActiveStoryReplies([]);
      return;
    }
    const q = query(
      collection(db, "community_stories", activeStory.id, "replies_list"),
      orderBy("timestamp", "asc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActiveStoryReplies(list);
      },
      (err) => {
        console.error("Story replies listener error:", err);
      },
    );
    return () => unsub();
  }, [activeStory]);

  const handleReactToStory = async (storyId: string, reactionType: string) => {
    try {
      setClickingReactionKey(reactionType);
      setTimeout(() => setClickingReactionKey(null), 350);

      const storyRef = doc(db, "community_stories", storyId);
      await updateDoc(storyRef, {
        [`reactions.${reactionType}`]: increment(1),
      });

      // Show floating reaction effect (multiples)
      const charMap: Record<string, string> = {
        love: "❤️",
        fire: "🔥",
        clap: "👏",
        trophy: "🏆",
        star: "🌟",
      };
      const baseChar = charMap[reactionType] || "❤️";
      const newIcons = Array.from({ length: 6 }).map((_, i) => ({
        id: `reaction-${Date.now()}-${Math.random()}-${i}`,
        char: baseChar,
        x: Math.random() * 120 - 60, // random offset left-right
        y: Math.random() * 20 - 10,
        delay: Math.random() * 0.2,
      }));

      setReactionFloatingIcons((prev) => [...prev, ...newIcons]);

      setTimeout(() => {
        setReactionFloatingIcons((prev) =>
          prev.filter((x) => !newIcons.find((n) => n.id === x.id)),
        );
      }, 2500);

      // Tell lounge
      if (activeStory && schoolId) {
        try {
          const emoji = charMap[reactionType] || "❤️";
          const currentName = isTeacher
            ? teacherData?.name || auth.currentUser?.displayName
            : userProfile?.name || userProfile?.fullName || "مستخدم";
          const currentRole = isTeacher
            ? "teacher"
            : userProfile?.role === "admin"
              ? "admin"
              : "student";

          await addDoc(collection(db, "lounge_messages"), {
            text: `تفاعل(ت) بـ ${emoji} على حالة التميز لـ ${activeStory.userName} 🌟`,
            userId: auth.currentUser?.uid || "unknown",
            userName: currentName || "مستخدم",
            userPhoto: getUserPhoto() || null,
            userRole: currentRole,
            schoolId: schoolId,
            grade: grade || "all",
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("error broadcasting reaction to lounge", err);
        }
      }

      // Award XP to the story owner in school_students
      if (activeStory) {
        const q = query(
          collection(db, "school_students"),
          where("name", "==", activeStory.userName),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const studentDocRef = doc(db, "school_students", snap.docs[0].id);
          await updateDoc(studentDocRef, {
            storyReactionsCount: increment(1),
            pointsBonus: increment(15), // +15 XP
          });
        }
      }
    } catch (err) {
      console.error("Error reacting to story:", err);
    }
  };

  const handleSendStoryReply = async () => {
    if (!storyCommentText.trim() || !activeStory) return;
    try {
      const storyRef = doc(db, "community_stories", activeStory.id);
      const textVal = storyCommentText.trim();

      await addDoc(collection(storyRef, "replies_list"), {
        userId: getCurrentUserId(),
        userName: getUserName(),
        userPhotoURL: getUserPhoto(),
        text: textVal,
        timestamp: serverTimestamp(),
      });

      await updateDoc(storyRef, {
        repliesCount: increment(1),
      });

      // Show in Lounge!
      if (schoolId) {
        try {
          const currentName = isTeacher
            ? teacherData?.name || auth.currentUser?.displayName
            : userProfile?.name || userProfile?.fullName || "مستخدم";
          const currentRole = isTeacher
            ? "teacher"
            : userProfile?.role === "admin"
              ? "admin"
              : "student";
          await addDoc(collection(db, "lounge_messages"), {
            text: `رد(ت) على حالة التميز لـ ${activeStory.userName}: "${textVal}"`,
            userId: auth.currentUser?.uid || "unknown",
            userName: currentName || "مستخدم",
            userPhoto: getUserPhoto() || null,
            userRole: currentRole,
            schoolId: schoolId,
            grade: grade || "all",
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.error("error pushing reply to lounge", e);
        }
      }

      // Award XP to the story owner in school_students
      const q = query(
        collection(db, "school_students"),
        where("name", "==", activeStory.userName),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const studentDocRef = doc(db, "school_students", snap.docs[0].id);
        await updateDoc(studentDocRef, {
          storyRepliesCount: increment(1),
          pointsBonus: increment(30), // +30 XP
        });
      }

      showToast(
        "تم إرسال تشجيعك ولقد تم منح الطالب مكافأة تميز! 💬⚡",
        "success",
      );
      setStoryCommentText("");
    } catch (err) {
      console.error("Error saving story reply:", err);
      showToast("عذراً، فشل إرسال الرد السريع.", "error");
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "subject_mapping"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSubjectMapping(data);
          try {
            safeStorage.setItem("s6_cached_subject_mapping", JSON.stringify(data));
          } catch(e) {}
        }
      },
      (error) => {
        console.error(
          "Error subscribing to subject_mapping inside platform:",
          error,
        );
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !schoolId) return;

    setLoadingExcellence(true);
    const q = query(
      collection(db, "school_students"),
      where("schoolId", "==", schoolId || "unassigned"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let students = snapshot.docs.map(
          (docSnap) =>
            ({
              id: docSnap.id,
              ...docSnap.data(),
            }) as any,
        );

        // Fuzzy matching for grades (ignore strict filter for teachers to allow cross-class selection)
        if (grade && !isTeacher) {
          const normalize = (s: string) =>
            s
              .replace(/\s+/g, "")
              .replace(/^ال/, "")
              .replace(/ة/g, "ه")
              .replace(/أ|إ|آ/g, "ا");
          const platformGradeNorm = normalize(grade);

          students = students.filter((s) => {
            const sGrade = (s.grade || "").toString().trim();
            if (!sGrade) return false;

            const sGradeNorm = normalize(sGrade);

            return (
              sGradeNorm === platformGradeNorm ||
              platformGradeNorm.includes(sGradeNorm) ||
              sGradeNorm.includes(platformGradeNorm) ||
              sGrade.includes(grade) ||
              grade.includes(sGrade)
            );
          });
        }

        // Compute academic identities and points on-the-fly for live sync
        const computedStudents = students.map((s) => {
          const excPoints = computeExcellencePoints(s, null, subjectMapping);
          const identity = computeAcademicIdentity(s, null, subjectMapping);

          // Calculate average grade
          let avgGrade = 0;
          if (s.grades) {
            const periods = [
              "final",
              "month4",
              "month3",
              "mid",
              "month2",
              "month1",
            ];
            let found = false;
            for (const p of periods) {
              const g = s.grades[p];
              if (g && Object.keys(g).length > 0) {
                const values = Object.values(g)
                  .map((v) => Number(v))
                  .filter((v) => !isNaN(v));
                if (values.length > 0) {
                  avgGrade = Math.round(
                    values.reduce((a, b) => a + b, 0) / values.length,
                  );
                  found = true;
                  break;
                }
              }
            }
          }

          return {
            ...s,
            totalPoints: Math.round(excPoints.totalPoints || 0),
            basePoints: Math.round(excPoints.basePoints || 0),
            averagePercent: avgGrade,
            computedTitle: excPoints.dynamicTitle || "بطل التميز 🏅",
            excellenceData: excPoints,
            academicIdentity: identity,
          };
        });

        // Sort classmates by totalPoints, then by average percent descending for live sync leaderboard
        computedStudents.sort((a, b) => {
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          const aAvg = Number(a.averagePercent) || 0;
          const bAvg = Number(b.averagePercent) || 0;
          if (bAvg !== aAvg) {
            return bAvg - aAvg;
          }
          return (a.name || "").localeCompare(b.name || "", "ar");
        });

        setRawTopStudents(computedStudents);
        setLoadingExcellence(false);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          "school_students/excellence",
          false,
        );
        setLoadingExcellence(false);
      },
    );

    return () => unsubscribe();
  }, [schoolId, grade, subjectMapping]);


  const activeWorkingClass = targetBroadcastGrade;

  const platformContextValue = {
    academyPages,
    academicLists,
    activeClassStudents,
    activeCommentPostId,
    activeContentSession,
    activeFileChallengeQuestions,
    activeGroupIndex,
    activeGroupStories,
    activeLiveAlert,
    activeLiveMaterialIndex,
    activeLiveQuiz,
    activeLiveTeacherName,
    activeMainTab,
    activeMetricModal,
    activePostReactionId,
    activeRadarFile,
    activeStory,
    activeStoryReplies,
    activeStudent,
    activeTab,
    activeTeacherSubject,
    activeWorkingClass,
    activeYoutubeVideoId,
    adminNoteTargetPost,
    aiEvaluationResult,
    aiExtractionAbortControllerRef,
    aiExtractionError,
    aiExtractionLogs,
    aiExtractionPercent,
    aiExtractionProgress,
    aiExtractionTimeRemaining,
    announcementDays,
    announcementHours,
    announcementText,
    attendanceSessions,
    avatarInputRef,
    boardColor,
    boardImageScale,
    boardTextContent,
    boardTextSize,
    boardTool,
    brushThickness,
    camEnabled,
    cameraFacingMode,
    cameraLayout,
    cameraStream,
    captureAndSyncPdf,
    classmates,
    clickingLiveReaction,
    clickingReactionKey,
    competitionAnswers,
    competitionScore,
    competitionTimer,
    creatorActiveTab,
    currentShape,
    currentStrokeGroupId,
    customPointsInput,
    debugFileName,
    debugFileSize,
    debugLastOperation,
    debugPageCount,
    debugStartTime,
    defaultStudent,
    deletingAcademyPageId,
    deletingPostId,
    disabledModules,
    rolePrefix,
    dismissedAlertIds,
    documentXhr,
    draw,
    editingPhraseText,
    editingPostContent,
    editingPostId,
    editingQueueIndex,
    educationalFields,
    evaluationOverrides,
    excellenceSubTab,
    executeDeletePost,
    extractYouTubeId,
    extractedAiTitle,
    floatingEmojis,
    formatLiveDuration,
    getArabicToday,
    getCurrentUserId,
    getDynamicOutstandingBadges,
    getEmbedUrl,
    getFileNameFromStack,
    getFunctionNameFromStack,
    getLatestGrade,
    getLikedPosts,
    getStageFromGrade,
    getStudentSubjectPoints,
    getTeacherSubjectId,
    getUserName,
    getUserPhoto,
    grade,
    gradeName,
    groupedStories,
    handRaises,
    handleAddAdminNoteClick,
    handleAddStoryClick,
    handleAvatarUpload,
    handleBack,
    handleComment,
    handleDeletePost,
    handleDeleteStory,
    handleDismissLiveAlert,
    handleDownloadBoard,
    handleDraw,
    handleEditPost,
    handleJoinLiveFromAlert,
    handleMediaUpload,
    handleNextStory,
    handleNextUserStories,
    handlePointerDown,
    handlePointerDownSticker,
    handlePointerMove,
    handlePointerMoveSticker,
    handlePointerUp,
    handlePointerUpSticker,
    handlePost,
    handlePrevStory,
    handlePrevUserStories,
    handlePublishStory,
    handleReactToPost,
    handleReactToStory,
    handleSaveEditPost,
    handleSaveInspiringPhrase,
    handleSendLiveStreamReaction,
    handleSendStoryReply,
    handleSetWhiteboardImage,
    handleShare,
    handleShareOption,
    handleShareStory,
    handleStartDrawing,
    handleStickerTouchEnd,
    handleStickerTouchMove,
    handleStickerTouchStart,
    handleStoryGroupMediaUpload,
    handleStoryMediaUpload,
    handleStoryPointerDown,
    handleStoryPointerLeave,
    handleStoryPointerMove,
    handleStoryPointerUp,
    handleTextTouchEnd,
    handleTextTouchMove,
    handleTextTouchStart,
    handleTextareaChange,
    handleToggleCamera,
    handleToggleLockPost,
    handleToggleMic,
    handleTogglePinPost,
    handleViewStory,
    handleViewUserStories,
    hasStartedPlaying,
    headerClicks,
    highlightTasksSection,
    homeworkAnswer,
    insertTag,
    invitedStudents,
    isAdminNoteModalOpen,
    isChallengeActive,
    isCinemaMode,
    isControlSidebarCollapsed,
    isCreateStoryMenuOpen,
    isDeveloperModeEnabled,
    isDraggingPip,
    isDrawingRef,
    isEditingPhrase,
    isExtractingAiText,
    isFilesSidebarCollapsed,
    isLiveActive,
    isLoungeOpen,
    isMaterialsSidebarCollapsed,
    isMountedRef,
    isPointerDraggingSticker,
    isPointerDraggingText,
    isPosting,
    isPublishEditMode,
    isRecordingFinishedModalOpen,
    isStoryMenuOpen,
    isStoryModalOpen,
    isStoryPaused,
    isStoryPausedRef,
    isStoryTypingOpen,
    isStoryUIHidden,
    isStoryViewersOpen,
    isSubmittingTask,
    isSuperAdmin,
    isSupportOpen,
    isSwipingStory,
    isTeacher,
    isUploading,
    isUploadingVideo,
    isWhiteboardActive,
    isWindowObscured,
    isZoomControlsOpen,
    language,
    laserPosition,
    laserTimeoutRef,
    lastDrawPos,
    lastSyncedPdfMetaRef,
    lastSyncedStrokesRef,
    likesInFlightRef,
    liveQuestions,
    liveSeconds,
    liveStreamType,
    liveTitle,
    loadingExcellence,
    loggedInStudentData,
    longPressTimeout,
    mapGradeForDocument,
    mediaInputRef,
    micEnabled,
    navTriggers,
    newAdminNote,
    newPostContent,
    newPostMedia,
    newStoryBgGradient,
    newStoryContent,
    newStoryFont,
    newStoryMedia,
    newStoryMediaFiles,
    newStoryMediaType,
    newStoryMusic,
    newStorySticker,
    newStoryStickerScale,
    newStoryStickerX,
    newStoryStickerY,
    newStoryTextBg,
    newStoryTextColor,
    newStoryTextScale,
    newStoryTextX,
    newStoryTextY,
    notifications,
    onBack,
    onClearAllNotifications,
    onClearHighlightTasks,
    onDeleteNotification,
    onMarkNotificationAsRead,
    onOpenNotifications,
    onPipDragStart,
    onSwitchMainTab,
    onUpdateProfile,
    onlineSchoolUsers,
    openMenuPostId,
    pdfFile,
    pdfLoadError,
    pdfNumPages,
    pdfPageNumber,
    pdfScale,
    peerConnectionsRef,
    pendingEditorTab,
    pendingExtractedAi,
    pendingUnitTitle,
    pinnedQuestion,
    pipDragStart,
    pipPosition,
    pipShape,
    platformLocks,
    playlist,
    pointerDragMoved,
    pointerDragMovedSticker,
    pointerDragStart,
    pointerDragStartSticker,
    pointerStickerOffset,
    pointerTextOffset,
    portalType,
    posts,
    prevHandRaisesCountRef,
    previewPageIndex,
    previewPdfNumPages,
    previewingFile,
    prideMessageText,
    progress,
    quizCorrectIndex,
    quizResponses,
    quizTimerActive,
    rawTabs,
    reactionCounts,
    reactionFloatingIcons,
    realLiveAttendees,
    recordedLessons,
    recordingStartTime,
    remoteConfig,
    remoteStream,
    renderStroke,
    renderWhiteboardBackground,
    resolvedSchoolId,
    resolvedTicketCount,
    revealedSolutions,
    savedStudentNotes,
    schoolConfigData,
    schoolConfigs,
    schoolExamPapers,
    schoolFiles,
    schoolId,
    schoolName,
    schoolQuestions,
    seenStories,
    selectedAIQuestion,
    selectedAcademyPage,
    selectedBadge,
    selectedControlTab,
    selectedEvaluationStudentId,
    selectedEvaluationSubTab,
    selectedMaterialIndex,
    selectedPaperForExtraction,
    selectedQuality,
    selectedTeacherClass,
    setAcademyPages,
    setActiveCommentPostId,
    setActiveContentSession,
    setActiveFileChallengeQuestions,
    setActiveLiveAlert,
    setActiveLiveMaterialIndex,
    setActiveLiveQuiz,
    setActiveLiveTeacherName,
    setActiveMetricModal,
    setActivePostReactionId,
    setActiveRadarFile,
    setActiveStory,
    setActiveStoryReplies,
    setActiveTab,
    setActiveTabState,
    setActiveYoutubeVideoId,
    setAdminNoteTargetPost,
    setAiEvaluationResult,
    setAiExtractionError,
    setAiExtractionLogs,
    setAiExtractionPercent,
    setAiExtractionProgress,
    setAiExtractionTimeRemaining,
    setAnnouncementDays,
    setAnnouncementHours,
    setAnnouncementText,
    setAttendanceSessions,
    setBoardColor,
    setBoardImageScale,
    setBoardTextContent,
    setBoardTextSize,
    setBoardTool,
    setBrushThickness,
    setCamEnabled,
    setCameraFacingMode,
    setCameraLayout,
    setCameraStream,
    setClassmates,
    setClickingLiveReaction,
    setClickingReactionKey,
    setCompetitionAnswers,
    setCompetitionScore,
    setCompetitionTimer,
    setCreatorActiveTab,
    setCurrentShape,
    setCustomPointsInput,
    setDebugFileName,
    setDebugFileSize,
    setDebugLastOperation,
    setDebugPageCount,
    setDebugStartTime,
    setDeletingAcademyPageId,
    setDeletingPostId,
    setDismissedAlertIds,
    setDocumentXhr,
    setEditingPhraseText,
    setEditingPostContent,
    setEditingPostId,
    setEditingQueueIndex,
    setEvaluationOverrides,
    setExcellenceSubTab,
    setExtractedAiTitle,
    setFloatingEmojis,
    setHandRaises,
    setHasStartedPlaying,
    setHeaderClicks,
    setHomeworkAnswer,
    setInvitedStudents,
    setIsAdminNoteModalOpen,
    setIsChallengeActive,
    setIsCinemaMode,
    setIsControlSidebarCollapsed,
    setIsCreateStoryMenuOpen,
    setIsDeveloperModeEnabled,
    setIsDraggingPip,
    setIsEditingPhrase,
    setIsExtractingAiText,
    setIsFilesSidebarCollapsed,
    setIsLiveActive,
    setIsLoungeOpen,
    setIsMaterialsSidebarCollapsed,
    setIsPointerDraggingSticker,
    setIsPointerDraggingText,
    setIsPosting,
    setIsPublishEditMode,
    setIsRecordingFinishedModalOpen,
    setIsStoryMenuOpen,
    setIsStoryModalOpen,
    setIsStoryPaused,
    setIsStoryTypingOpen,
    setIsStoryUIHidden,
    setIsStoryViewersOpen,
    setIsSubmittingTask,
    setIsSupportOpen,
    setIsUploading,
    setIsUploadingVideo,
    setIsWhiteboardActive,
    setIsWindowObscured,
    setIsZoomControlsOpen,
    setLaserPosition,
    setLiveQuestions,
    setLiveSeconds,
    setLiveStreamType,
    setLiveTitle,
    setLoadingExcellence,
    setLocalActiveContentSession,
    setLocalHandRaises,
    setLocalLiveQuestions,
    setLocalPinnedQuestion,
    setLocalStudentLiveControls,
    setMicEnabled,
    setNavTriggers,
    setNewAdminNote,
    setNewPostContent,
    setNewPostMedia,
    setNewStoryBgGradient,
    setNewStoryContent,
    setNewStoryFont,
    setNewStoryMedia,
    setNewStoryMediaFiles,
    setNewStoryMediaType,
    setNewStoryMusic,
    setNewStorySticker,
    setNewStoryStickerScale,
    setNewStoryStickerX,
    setNewStoryStickerY,
    setNewStoryTextBg,
    setNewStoryTextColor,
    setNewStoryTextScale,
    setNewStoryTextX,
    setNewStoryTextY,
    setOnlineSchoolUsers,
    setOpenMenuPostId,
    setPdfFile,
    setPdfLoadError,
    setPdfNumPages,
    setPdfPageNumber,
    setPdfScale,
    setPendingEditorTab,
    setPendingExtractedAi,
    setPendingUnitTitle,
    setPinnedQuestion,
    setPipPosition,
    setPipShape,
    setPlatformLocks,
    setPosts,
    setPreviewPageIndex,
    setPreviewPdfNumPages,
    setPreviewingFile,
    setPrideMessageText,
    setProgress,
    setQuizCorrectIndex,
    setQuizResponses,
    setQuizTimerActive,
    setReactionCounts,
    setReactionFloatingIcons,
    setRealLiveAttendees,
    setRecordedLessons,
    setRecordingStartTime,
    setResolvedTicketCount,
    setRevealedSolutions,
    setSavedStudentNotes,
    setSchoolConfigData,
    setSchoolConfigs,
    setSchoolExamPapers,
    setSchoolFiles,
    setSchoolQuestions,
    setSeenStories,
    setSelectedAIQuestion,
    setSelectedAcademyPage,
    setSelectedBadge,
    setSelectedControlTab,
    setSelectedEvaluationStudentId,
    setSelectedEvaluationSubTab,
    setSelectedMaterialIndex,
    setSelectedPaperForExtraction,
    setSelectedQuality,
    setSelectedTeacherClass,
    setShareText,
    setSharedPdfPageBase64,
    setSharingPost,
    setShowAchievementCard,
    setShowActiveKnightsDropdown,
    setShowAiCancelConfirm,
    setShowAttendeesDropdown,
    setShowDebugLogsPanel,
    setShowDetailedQuizResults,
    setShowTagMenuTarget,
    setShowTransformerLogs,
    setShowVideoLogs,
    setSingleUploadedPagesQueue,
    setSocialUnreadCount,
    setStories,
    setStoryCommentText,
    setStoryGroupIndex,
    setStoryPanX,
    setStoryPanY,
    setStoryProgress,
    setStoryZoom,
    setStudentCanDraw,
    setStudentExamPaperRole,
    setStudentExamPaperYear,
    setStudentLibrarySearch,
    setStudentLibrarySubject,
    setStudentLibraryTab,
    setStudentLiveControls,
    setStudentLocalCamActive,
    setStudentLocalMicActive,
    setStudentPrivateNotes,
    setStudentQuestionBankTab,
    setStudentQuestionsSubmittedCount,
    setStudentQuizAnswered,
    setStudentQuizCorrect,
    setStudentSearchQuery,
    setStudentSubmissions,
    setStudentWatchSeconds,
    setSubjectMapping,
    setTagCursorPos,
    setTagSearch,
    setTeacherAiResults,
    setTeacherBroadcasts,
    setTeacherCameraEnabled,
    setTeacherLiveSubTab,
    setTeacherMicEnabled,
    setTeacherUploadTab,
    setToast,
    setTopStudents: setRawTopStudents,
    setTouchStartY,
    setUnreadLoungeCount,
    setUploadProgress,
    setUploadedAssetSubject,
    setUploadedAssetTag,
    setUploadedAssetTitle,
    setUploadedFileMeta,
    setUploadedFileUrl,
    setUploadedVideoDesc,
    setUploadedVideoDuration,
    setUploadedVideoFileMeta,
    setUploadedVideoLock,
    setUploadedVideoSubject,
    setUploadedVideoTitle,
    setUploadedVideoUrl,
    setUserRatings,
    setVideoDebugInfo,
    setVideoUploadProgress,
    setVideoXhr,
    setViewingCompetition,
    setViewingHomework,
    setViewingLessonNotes,
    setViewingRecordedLesson,
    setViewingSubmissionFeedback,
    setVisitedCompetitions,
    setVisitedHomework,
    setWhiteboardImage,
    setWhiteboardStrokes,
    setYoutubeLiveUrl,
    shareText,
    sharedPdfPageBase64,
    sharingPost,
    showAchievementCard,
    showActiveKnightsDropdown,
    showAiCancelConfirm,
    showAttendeesDropdown,
    showDebugLogsPanel,
    showDetailedQuizResults,
    showTagMenuTarget,
    showToast,
    showTransformerLogs,
    showVideoLogs,
    singleUploadedPagesQueue,
    socialUnreadCount,
    startDrawPos,
    startDrawing,
    stopDrawing,
    stories,
    storyCommentText,
    storyGroupIndex,
    storyGroupMediaInputRef,
    storyMediaInputRef,
    storyPanX,
    storyPanY,
    storyProgress,
    storyTouchStartTime,
    storyTouchStartX,
    storyZoom,
    studentCanDraw,
    studentExamPaperRole,
    studentExamPaperYear,
    studentLibrarySearch,
    studentLibrarySubject,
    studentLibraryTab,
    studentLiveControls,
    studentLocalCamActive,
    studentLocalMicActive,
    studentPrivateNotes,
    studentQuestionBankTab,
    studentQuestionsSubmittedCount,
    studentQuizAnswered,
    studentQuizCorrect,
    studentSearchQuery,
    studentSubmissions,
    studentWatchSeconds,
    subjectMapping,
    submitAdminNote,
    tabs,
    tagCursorPos,
    tagSearch,
    targetBroadcastGrade,
    teacherAiResults,
    teacherAssignedSections,
    teacherBroadcasts,
    teacherCameraEnabled,
    teacherData,
    currentTeacherData,
    teacherLiveSubTab,
    teacherMicEnabled,
    teacherUploadTab,
    teacherVideoRef,
    toast,
    toggleLike,
    toggleLocalPostLike,
    topStudents,
    touchStartDist,
    touchStartScale,
    touchStartStickerDist,
    touchStartStickerScale,
    touchStartY,
    uniqueStoryUsers,
    unpauseStoryTimer,
    unreadLoungeCount,
    uploadProgress,
    uploadedAssetSubject,
    uploadedAssetTag,
    uploadedAssetTitle,
    uploadedFileMeta,
    uploadedFileUrl,
    uploadedVideoDesc,
    uploadedVideoDuration,
    uploadedVideoFileMeta,
    uploadedVideoLock,
    uploadedVideoSubject,
    uploadedVideoTitle,
    uploadedVideoUrl,
    userCode,
    userProfile,
    userRatings,
    videoDebugInfo,
    videoRef,
    videoUploadProgress,
    videoXhr,
    viewingCompetition,
    viewingHomework,
    viewingLessonNotes,
    viewingRecordedLesson,
    viewingSubmissionFeedback,
    visitedCompetitions,
    visitedHomework,
    whiteboardImage,
    whiteboardStrokes,
    youtubeLiveUrl
  };

  const renderTabContent = () => {
    const isTabDisabled = checkIsModuleDisabled(activeTab);

    if (isTabDisabled) {
      const tabNamesMap: Record<string, string> = {
        feed: "الساحة والمنشورات",
        attendance: "رصد الحضور والغياب",
        control: "لوحة التحكم والدروس",
        live_watch: "البث المباشر والإذاعة",
        questions_bank: "بنك الأسئلة والملفات",
        files: "الملفات والمستندات",
        materials: "المحتوى والمناهج الدراسية",
        schedule: "الجدول المدرسي",
        excellence: "لوحة التميز والفرسان",
        ai_assistant: "مساعد الذكاء الاصطناعي",
      };
      const currentTabName = tabNamesMap[activeTab] || "هذا القسم";

      return (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center space-y-6 my-auto max-w-lg mx-auto" dir="rtl">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.3)] backdrop-blur-md">
              <Lock size={46} className="animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-[#050A18] border border-rose-500/50 rounded-full text-[10px] font-black text-rose-300 flex items-center gap-1.5 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>مغلق برمجياً</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black">
              <span>🛡️ إشعار إيقاف القسم برمجياً</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              قسم {currentTabName} مغلق حالياً من قِبل المطور
            </h3>
            <p className="text-xs sm:text-sm font-medium text-white/70 leading-relaxed px-4">
              تم إيقاف وتعطيل هذا القسم لهذه المدرسة بناءً على ضبط صلاحيات المطور والإدارة المركزية. تم تجميد الوصول إليه مؤقتاً لحين إعادة التفعيل.
            </p>
          </div>

          <div className="w-full p-4 rounded-2xl bg-[#080D21]/90 border border-white/10 text-right space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/60">
              <span>حالة القسم:</span>
              <span className="font-bold text-rose-400">معطل برمجياً (Locked by Developer)</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>المدرسة المستهدفة:</span>
              <span className="font-bold text-amber-300">{schoolName || "الميدان التعليمي"}</span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>رمز القسم:</span>
              <span className="font-mono text-zinc-400 text-[11px]">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab("feed", "Back to feed from locked tab")}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
            >
              <LayoutGrid size={15} />
              <span>العودة إلى الساحة الرئيسية</span>
            </button>
          </div>
        </div>
      );
    }

    const placeholderStyle =
      "flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6";

    switch (activeTab) {
      case "feed":
        return <StudentFeedTab />;
      case "attendance": {
        const assignedClassesList: string[] = (teacherAssignedSections && teacherAssignedSections.length > 0)
          ? teacherAssignedSections.map((s: any) => s.name)
          : ((currentTeacherData?.classes || teacherData?.classes) || []);

        const resolvedAttendanceClass = (selectedTeacherClass && selectedTeacherClass !== "ALL" && selectedTeacherClass !== "all" && (assignedClassesList.length === 0 || assignedClassesList.includes(selectedTeacherClass)))
          ? selectedTeacherClass
          : (assignedClassesList[0] || academicLists?.[0]?.name || "اول ابتدائي أ");

        return (
          <TeacherAttendanceTab
            schoolId={resolvedSchoolId}
            teacherData={currentTeacherData || teacherData}
            schoolName={schoolName}
            selectedClass={resolvedAttendanceClass}
            onSelectClass={(cls) => {
              setSelectedTeacherClass(cls);
            }}
            availableClasses={assignedClassesList.length > 0 ? assignedClassesList : undefined}
            showToast={showToast}
            initialAcademicLists={academicLists}
            initialStudents={topStudents}
          />
        );
      }
      case "files":
        return <StudentFilesTab disabledModules={disabledModules} rolePrefix={rolePrefix} />;
      case "materials":
        return <StudentMaterialsTab />;
      case "excellence":
        return <StudentExcellenceTab />;
      case "live_watch":
        return <StudentLiveWatchTab />;
      case "questions_bank":
        return <TeacherQuestionBank schoolId={resolvedSchoolId} teacherData={currentTeacherData || teacherData} schoolName={schoolName} selectedClass={selectedTeacherClass} />;

      case "ai_assistant":
        return <TeacherAIAssistant schoolId={resolvedSchoolId} teacherData={currentTeacherData || teacherData} selectedClass={selectedTeacherClass || ((currentTeacherData?.classes || teacherData?.classes)?.[0] || "سادس علمي")} disabledModules={disabledModules} rolePrefix={rolePrefix} />;
      
      case "dev_dashboard":
        return <DevDashboard schoolId={resolvedSchoolId} userProfile={userProfile} showToast={showToast} />;
      

      case "schedule":
        return (
          <div className="flex-1 h-full overflow-hidden">
            <StudentSchedule
              grade={grade}
              isTeacher={isTeacher}
              teacherId={teacherData?.id}
              schoolId={schoolId}
            />
          </div>
        );
      case "control": {
        const isControlLiveDisabled = 
          disabledModules.includes(`${rolePrefix}:teacher_live`) || 
          disabledModules.includes(`${rolePrefix}:teacher_broadcast`) || 
          disabledModules.includes(`${rolePrefix}:broadcast`) || 
          disabledModules.includes(`${rolePrefix}:live_watch`);

        const isControlContentDisabled = 
          disabledModules.includes(`${rolePrefix}:teacher_content`) || 
          disabledModules.includes(`${rolePrefix}:teacher_materials`) || 
          disabledModules.includes(`${rolePrefix}:content`) || 
          disabledModules.includes(`${rolePrefix}:materials`);

        const controlTabs = [
          {
            id: "live",
            name: "البث المباشر",
            icon: Radio,
            color: "text-red-400",
            bgColor: "bg-red-500/10",
            isLocked: isControlLiveDisabled,
          },
          {
            id: "content",
            name: "المحتوى",
            icon: Layers,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            isLocked: isControlContentDisabled,
          },
          {
            id: "files_center",
            name: "رفع الملفات",
            icon: FileUp,
            color: "text-amber-400",
            bgColor: "bg-amber-500/10",
            isLocked: disabledModules.includes(`${rolePrefix}:questions_bank`) || 
                     disabledModules.includes(`${rolePrefix}:files`) ||
                     disabledModules.includes(`${rolePrefix}:teacher_upload`),
          },
          {
            id: "grades_center",
            name: "رصد الدرجات",
            icon: FileSpreadsheet,
            color: "text-cyan-400",
            bgColor: "bg-cyan-500/10",
            isLocked: disabledModules.includes(`${rolePrefix}:grades`) || 
                     disabledModules.includes(`${rolePrefix}:grading_center`) ||
                     disabledModules.includes(`${rolePrefix}:grading_hub`),
          },
          {
            id: "assessment",
            name: "التقييم",
            icon: CheckCircle,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10",
            isLocked: disabledModules.includes(`${rolePrefix}:evaluation`) || 
                     disabledModules.includes(`${rolePrefix}:grading`),
          },
          {
            id: "announcements",
            name: "الإعلانات",
            icon: Megaphone,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10",
            isLocked: disabledModules.includes(`${rolePrefix}:announcements`) || 
                     disabledModules.includes(`${rolePrefix}:teacher_news`),
          },
        ];

        const fallbackStudents = [
          { id: "real_st_1", name: "محمد رسول الأسدي", attendance: 99 },
          { id: "real_st_2", name: "فاطمة الزهراء عمار", attendance: 98 },
          { id: "real_st_3", name: "حسن علي الخفاجي", attendance: 97 },
          { id: "real_st_4", name: "زينب ميثم الكعبي", attendance: 100 },
          { id: "real_st_5", name: "جعفر جبار الوائلي", attendance: 95 },
        ];

        const displayStudents =
          activeClassStudents.length > 0
            ? activeClassStudents
            : fallbackStudents;

        const totalPresence = displayStudents.reduce(
          (acc, st) => acc + (st.attendanceRate || st.attendance || 98),
          0,
        );
        const realPresencePercent =
          displayStudents.length > 0
            ? Math.round(totalPresence / displayStudents.length)
            : 98;

        const realActiveKnights = displayStudents.length;

        // Live broadcast active attendees (filter heartbeat in last 3 mins to account for clock skew)
        const realAttendees = realLiveAttendees.filter(user => {
          return Date.now() - (user.lastActive || 0) < 180000;
        });

        // Setup real registered database student data lists
        let displayAttendees: any[] = [];
        let displayActiveNotAttending: any[] = [];

        if (!isLiveActive) {
          // If the broadcast is not active yet, nobody is attending!
          displayAttendees = [];
          displayActiveNotAttending = activeClassStudents.length > 0 
            ? activeClassStudents.filter((student: any) => student.id !== getCurrentUserId())
            : fallbackStudents;
        } else {
          // Broadcast is active! Show ONLY actual attendees who have joined in real-time
          displayAttendees = realAttendees;
          
          // Users who are registered in the class roster but haven't joined yet
          const attendingKeys = new Set<string>();
          realAttendees.forEach(u => {
            if (u.id) attendingKeys.add(u.id.toString().trim().toLowerCase());
            if (u.studentCode) attendingKeys.add(u.studentCode.toString().trim().toLowerCase());
            if (u.code) attendingKeys.add(u.code.toString().trim().toLowerCase());
          });

          const allOtherStudentsInClass = activeClassStudents.length > 0 
            ? activeClassStudents 
            : fallbackStudents;

          displayActiveNotAttending = allOtherStudentsInClass.filter((student: any) => {
            const sCode = (student.code || "").toString().trim().toLowerCase();
            const sStCode = (student.studentCode || "").toString().trim().toLowerCase();
            const sId = (student.id || "").toString().trim().toLowerCase();
            
            const isAttending = attendingKeys.has(sCode) || 
                                attendingKeys.has(sStCode) || 
                                attendingKeys.has(sId);
            
            const myIdStr = getCurrentUserId().toString().toLowerCase();
            const isMe = sId === myIdStr || sCode === myIdStr || sStCode === myIdStr;

            return !isAttending && !isMe;
          });
        }

        const handleInviteStudent = async (student: any) => {
          const stKey = student.id || student.name;
          if (invitedStudents[stKey]) return;
          
          setInvitedStudents(prev => ({ ...prev, [stKey]: true }));
          
          try {
            const subjectStr = teacherData?.subject || "الدرس";
            const isMock = stKey.toString().startsWith("simulated_") || stKey.toString().startsWith("real_st_");
            if (!isMock) {
              // Gather all unique identifiers for the student to guarantee they receive it
              const targetIds = new Set<string>();
              if (student.code) targetIds.add(student.code);
              if (student.studentCode) targetIds.add(student.studentCode);
              if (student.id) targetIds.add(student.id);
              if (student.uid) targetIds.add(student.uid);
              if (student.authUid) targetIds.add(student.authUid);

              for (const tId of targetIds) {
                if (tId && !tId.startsWith("simulated_") && !tId.startsWith("real_st_")) {
                  await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                    userId: tId,
                    type: "reminder", // Triggers real-time popup audio alarm modal for the student
                    title: "🚨 نداء عاجل من الأستاذ!",
                    message: `نداء من الأستاذ ${teacherData?.name || "القدير"}: يدعوك فوراً للانضمام إلى البث المباشر لمادة ${subjectStr}! الفرسان بانتظارك 🛡️⚡`,
                                        recipientRole: 'student',
                    read: false,
                    isRead: false
                  }) });
                }
              }
            }
            showToast(`لقد تم إرسال تنبيه ونقرة نداء عاجلة للفارس "${student.name}" بنجاح! 🔔🚀`, "success");
          } catch (err) {
            console.error("Failed to send live invitation alert:", err);
            showToast("عذراً، فشل إرسال النداء التنبيهي للطالب", "error");
            setInvitedStudents(prev => ({ ...prev, [stKey]: false }));
          }
        };

        const toggleStudentMic = (studentId: string, studentName: string) => {
          const current = studentLiveControls[studentId]?.micEnabled || false;
          setStudentLiveControls((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              micEnabled: !current,
            },
          }));
          showToast(
            !current
              ? `تم السماح بالكلمة لـ ${studentName} 🎙️`
              : `تم كتم صوت الطالب ${studentName}`,
            !current ? "success" : "info",
          );
        };

        const toggleStudentCam = (studentId: string, studentName: string) => {
          const current = studentLiveControls[studentId]?.camEnabled || false;
          setStudentLiveControls((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              camEnabled: !current,
            },
          }));
          showToast(
            !current
              ? `تم السماح لمشاركة الكاميرا لـ ${studentName} 📹`
              : `تم قفل كاميرا الطالب ${studentName}`,
            !current ? "success" : "info",
          );
        };

        const toggleStudentBoard = (studentId: string, studentName: string) => {
          const current = studentLiveControls[studentId]?.boardEnabled || false;
          setStudentLiveControls((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              boardEnabled: !current,
            },
          }));
          showToast(
            !current
              ? `تم منح صلاحية الكتابة على السبورة لـ ${studentName} ✍️`
              : `تم سحب صلاحية السبورة من ${studentName}`,
            !current ? "success" : "info",
          );
        };

        return (
          <div className="h-full flex text-right w-full" dir="rtl">
            {/* Control Sidebar - Collapsible with slide transition */}
            <div
              className={`bg-[#0A1024]/95 backdrop-blur-md border-l border-white/5 flex flex-col pt-24 no-scrollbar overflow-y-auto shrink-0 shadow-[inset_1px_0_0_rgba(255,255,255,0.02)] transition-all duration-300 relative ${
                isControlSidebarCollapsed
                  ? "w-0 opacity-0 overflow-hidden border-l-0"
                  : "w-20 lg:w-[86px]"
              }`}
            >
              {!isControlSidebarCollapsed && (
                <button
                  onClick={() => setIsControlSidebarCollapsed(true)}
                  className="absolute left-2 top-20 p-1.5 rounded-full bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-amber-400/50 text-amber-400 transition-all z-20 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)] border border-white/10"
                  title="طي الشريط الجانبي"
                >
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              )}

              {controlTabs.map((tab) => {
                const isSelected = selectedControlTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedControlTab(tab.id)}
                    className={`group flex flex-col items-center justify-center py-5 transition-all outline-none gap-1.5 border-r-[3px] relative overflow-hidden ${
                      isSelected
                        ? `bg-[#050A18] ${tab.color}`
                        : tab.isLocked
                        ? "border-transparent text-rose-400/50 hover:bg-rose-500/5"
                        : "border-transparent text-white/40 hover:bg-white/5"
                    }`}
                    style={{
                      borderColor: isSelected ? "currentColor" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <div
                        className={`absolute inset-0 ${tab.bgColor} opacity-30`}
                      />
                    )}
                    {tab.isLocked && (
                      <span className="absolute top-1.5 left-1.5 p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 z-20" title="مغلق من قِبل المطور">
                        <Lock size={10} />
                      </span>
                    )}
                    <Icon
                      size={isSelected ? 24 : 22}
                      strokeWidth={isSelected ? 2.5 : 2}
                      className={`relative z-10 transition-transform ${isSelected ? "scale-110" : "group-hover:scale-105"} ${isSelected ? "" : tab.isLocked ? "text-rose-400/60" : "group-hover:" + tab.color}`}
                    />
                    <span
                      className={`text-[9px] font-bold px-1 text-center relative z-10 leading-tight ${isSelected ? "" : tab.isLocked ? "text-rose-400/70" : "group-hover:" + tab.color}`}
                    >
                      {tab.name}
                    </span>
                    {tab.isLocked && (
                      <span className="text-[8px] font-black text-rose-400/90 leading-none">
                        مغلق 🔒
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Control Content */}
            <div className="flex-1 flex flex-col p-0 overflow-y-auto relative no-scrollbar bg-[#05060F]/40">
              {isControlSidebarCollapsed && (
                <button
                  onClick={() => setIsControlSidebarCollapsed(false)}
                  className="fixed right-3 top-[120px] z-50 p-2.5 bg-[#0d1533]/90 hover:bg-[#14214d]/95 hover:border-amber-400/50 text-amber-400 transition-all rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)] border border-white/10 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                  title="إظهار الشريط الجانبي"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
              )}

              {/* Header Banner - Standardized Platform Header (Height 105px) */}
              <div className="px-4 pt-4 md:px-6 flex flex-col">
                <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-4">
                  {/* Background elegant pattern and overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
                  <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Bairaq Video Companion on the LEFT side - Height 100% */}
                  <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
                    <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
                    <BerqCharacter
                      pose={
                        selectedControlTab === "live"
                          ? "pose_live_stream"
                          : selectedControlTab === "content"
                          ? "pose_academic_scholar"
                          : selectedControlTab === "files_center"
                          ? "pose_content_control"
                          : selectedControlTab === "assessment"
                          ? "excellence_tab_bairaq"
                          : selectedControlTab === "announcements"
                          ? "pose_broadcaster"
                          : "pose_control_mechanic"
                      }
                      glowColor="gold"
                      className="w-full h-full object-cover relative z-10 scale-110"
                    />
                  </div>

                  {/* Content Container (Title, School & Subtitle in 3 neat lines) */}
                  <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none h-full text-right min-w-0">
                    <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
                      {selectedControlTab === "live"
                        ? "غرفة التحكم - البث المباشر 🎙️"
                        : selectedControlTab === "content"
                        ? "غرفة التحكم - المحتوى التعليمي 📚"
                        : selectedControlTab === "files_center"
                        ? "غرفة التحكم - رفع المستندات والملفات 📁"
                        : selectedControlTab === "assessment"
                        ? "غرفة التحكم - التقييم ولوحة النتائج 🏆"
                        : selectedControlTab === "announcements"
                        ? "غرفة التحكم - الإعلانات والتبليغات 📢"
                        : "غرفة التحكم والأستاذ ⚙️"}
                    </h2>
                    <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                      <span className="shrink-0 text-xs">🏛️</span>
                      <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                      <span className="shrink-0 text-[10px]">
                        {selectedControlTab === "live" ? "📡" : selectedControlTab === "content" ? "📖" : selectedControlTab === "files_center" ? "📂" : selectedControlTab === "assessment" ? "⭐" : "📢"}
                      </span>
                      <span className="truncate">
                        {selectedControlTab === "live"
                          ? `إدارة البث والتفاعل الفوري • ${teacherData?.name || "أستاذ المادة"}`
                          : selectedControlTab === "content"
                          ? `إدارة الملازم والملخصات • ${teacherData?.name || "أستاذ المادة"}`
                          : selectedControlTab === "files_center"
                          ? `مرفقات المادة والملفات • ${teacherData?.name || "أستاذ المادة"}`
                          : selectedControlTab === "assessment"
                          ? `رصد التقييمات والأوسمة • ${teacherData?.name || "أستاذ المادة"}`
                          : selectedControlTab === "announcements"
                          ? `بث التنبيهات والإعلانات الرسمية • ${teacherData?.name || "أستاذ المادة"}`
                          : `بوابة التحكم الأكاديمي • ${teacherData?.name || "أستاذ المادة"}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dedicated Multi-Section Switcher Bar (Visible across ALL tabs in Control Room) */}
                <div className={`mb-4 w-full bg-gradient-to-r from-[#0C1229]/95 via-[#0F1738]/95 to-[#0A0E23]/95 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-cyan-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,229,255,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative ${isSectionDropdownOpen ? "z-[120]" : "z-30"}`}>
                  {/* Info / Title Section */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                        <Layers size={20} />
                      </div>
                      <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-white truncate">
                            الشعبة والصف الأكاديمي النشط
                          </span>
                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                            {teacherAssignedSections.length} {teacherAssignedSections.length === 1 ? "شعبة موكلة" : "شُعب موكلة"}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-white/60 font-medium truncate mt-0.5">
                          {selectedTeacherClass === "ALL" || !selectedTeacherClass
                            ? `عرض شامل لكافة الشُعب (${formatStudentCount(activeClassStudents.length)} مسجلين)`
                            : `الشعبة الحالية: ${selectedTeacherClass} (${formatStudentCount(activeClassStudents.length)})`}
                        </span>
                      </div>
                    </div>

                    {/* Quick Link Button on Mobile */}
                    <button
                      type="button"
                      onClick={() => setShowLinkCodeModal(true)}
                      className="sm:hidden text-[10px] text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                      title="ربط كود شعبة إضافية"
                    >
                      <Plus size={12} />
                      <span>ربط شعبة</span>
                    </button>
                  </div>

                  {/* Dropdown & Actions */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {/* Interactive Dropdown Trigger */}
                    <div className="relative flex-1 sm:w-64 md:w-72" ref={sectionDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                        className={`w-full bg-[#070C1E] border ${
                          isSectionDropdownOpen ? "border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]" : "border-white/10 hover:border-cyan-500/40"
                        } rounded-xl px-3 py-2 text-right flex items-center justify-between gap-2 text-white transition-all cursor-pointer group outline-none`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-cyan-400 shrink-0 text-sm">
                            {selectedTeacherClass === "ALL" || !selectedTeacherClass ? "🌟" : "📌"}
                          </span>
                          <span className="text-xs sm:text-sm font-black truncate text-white">
                            {selectedTeacherClass === "ALL" || !selectedTeacherClass
                              ? `كافة الشُعب الموكلة (${activeClassStudents.length})`
                              : `${selectedTeacherClass} (${activeClassStudents.length})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold bg-white/5 text-white/50 px-1.5 py-0.5 rounded-md">
                            تبديل
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-cyan-400 transition-transform duration-300 ${
                              isSectionDropdownOpen ? "rotate-180" : "group-hover:translate-y-0.5"
                            }`}
                          />
                        </div>
                      </button>

                      {/* Click-away backdrop overlay to prevent any interaction or bleed-through with background */}
                      {isSectionDropdownOpen && (
                        <div
                          className="fixed inset-0 z-[115] bg-black/40 backdrop-blur-[2px]"
                          onClick={() => setIsSectionDropdownOpen(false)}
                        />
                      )}

                      {/* Dropdown Menu Popover */}
                      <AnimatePresence>
                        {isSectionDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 w-full sm:w-80 bg-[#070C1E] border border-cyan-500/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(0,229,255,0.2)] p-2 z-[130] text-right space-y-1 backdrop-blur-2xl"
                          >
                            <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px] text-white/50 font-bold">
                              <span>اختر الشعبة لعرض بياناتها وطلابها:</span>
                              <span className="text-cyan-400">{teacherAssignedSections.length} متاح</span>
                            </div>

                            {/* Option 1: All Classes (Comprehensive View) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTeacherClass("ALL");
                                setIsSectionDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                selectedTeacherClass === "ALL" || !selectedTeacherClass
                                  ? "bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/40 text-amber-300 font-black"
                                  : "hover:bg-white/5 text-white/80 font-bold"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-amber-400 text-sm shrink-0">🌟</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black truncate">
                                    كافة الشُعب الموكلة
                                  </span>
                                  <span className="text-[9px] text-white/40 font-medium">لوحة شاملة موحدة لجميع الفرسان</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                                  {formatStudentCount(allTeacherAssignedStudents.length)}
                                </span>
                                {(selectedTeacherClass === "ALL" || !selectedTeacherClass) && (
                                  <Check size={14} className="text-amber-400" />
                                )}
                              </div>
                            </button>

                            <div className="h-px bg-white/5 my-1" />

                            {/* Individual Sections List */}
                            <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar">
                              {teacherAssignedSections.map((sec) => {
                                const isSelected = selectedTeacherClass === sec.name;
                                return (
                                  <button
                                    key={sec.name}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTeacherClass(sec.name);
                                      setIsSectionDropdownOpen(false);
                                    }}
                                    className={`w-full px-3 py-2 rounded-xl text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-black"
                                        : "hover:bg-white/5 text-white/80 font-bold"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className="text-cyan-400 text-xs shrink-0">📌</span>
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-xs truncate font-black text-white">
                                          {sec.name}
                                        </span>
                                        {sec.grade && sec.grade !== sec.name && (
                                          <span className="text-[9px] text-white/40 font-medium truncate">
                                            {sec.grade}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono font-bold">
                                        {formatStudentCount(sec.studentCount)}
                                      </span>
                                      {isSelected && (
                                        <Check size={14} className="text-cyan-400" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="h-px bg-white/5 my-1" />

                            {/* Quick Link Additional Code Action */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsSectionDropdownOpen(false);
                                setShowLinkCodeModal(true);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <Plus size={14} />
                              <span>ربط كود شعبة إضافية للتبديل إليها</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Desktop Link Code Button */}
                    <button
                      type="button"
                      onClick={() => setShowLinkCodeModal(true)}
                      className="hidden sm:flex text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3.5 py-2 rounded-xl font-bold transition-all items-center gap-1.5 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-95 shadow-sm"
                      title="ربط كود شعبة إضافية بحسابك الموحد"
                    >
                      <Plus size={14} />
                      <span>ربط شعبة بكود</span>
                    </button>
                  </div>
                </div>

                {/* Minimal & contemporary live attendance cards: TWO ELEGANT CARDS SIDE-BY-SIDE */}
                {selectedControlTab === "live" && (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                      {/* Card 1: Broadcast Attendees collapsible button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttendeesDropdown(!showAttendeesDropdown);
                          setShowActiveKnightsDropdown(false);
                        }}
                        className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl border text-right flex items-center justify-between group transition-all duration-300 relative select-none cursor-pointer outline-none ${
                          showAttendeesDropdown
                            ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                            : "bg-[#0C1229]/80 border-white/5 hover:border-emerald-500/30"
                        }`}
                      >
                        <div className="space-y-1 text-right min-w-0 flex-1">
                          <span className="text-[9px] md:text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 leading-none truncate">
                            <span>عدد الحضور بالبث</span>
                            <ChevronDown
                              size={11}
                              className={`transition-transform duration-300 text-emerald-400 ${showAttendeesDropdown ? "rotate-180" : ""}`}
                            />
                          </span>
                          <span className="text-xs sm:text-sm md:text-base font-black text-white/95 truncate block mt-0.5">
                            {displayAttendees.length} فرسان متصلون 🟢
                          </span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                          <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl hidden sm:flex items-center justify-center transition-transform shrink-0 ${
                            showAttendeesDropdown ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-500/10 text-emerald-500 group-hover:scale-110"
                          }`}>
                            <CheckCircle size={15} />
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-emerald-400/80 transition-transform duration-350 shrink-0 ${showAttendeesDropdown ? "rotate-180 text-emerald-400" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Card 2: Active Knights but not in stream collapsible button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowActiveKnightsDropdown(!showActiveKnightsDropdown);
                          setShowAttendeesDropdown(false);
                        }}
                        className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl border text-right flex items-center justify-between group transition-all duration-300 relative select-none cursor-pointer outline-none ${
                          showActiveKnightsDropdown
                            ? "bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "bg-[#0C1229]/80 border-white/5 hover:border-blue-500/30"
                        }`}
                      >
                        <div className="space-y-1 text-right min-w-0 flex-1">
                          <span className="text-[9px] md:text-[10px] text-blue-400 font-extrabold flex items-center gap-1 leading-none truncate">
                            <span>الفرسان خارج البث</span>
                            <ChevronDown
                              size={11}
                              className={`transition-transform duration-300 text-blue-400 ${showActiveKnightsDropdown ? "rotate-180" : ""}`}
                            />
                          </span>
                          <span className="text-xs sm:text-sm md:text-base font-black text-white/95 truncate block mt-0.5">
                            {displayActiveNotAttending.length} فرسان نشطين 📡
                          </span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                          <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl hidden sm:flex items-center justify-center transition-transform shrink-0 ${
                            showActiveKnightsDropdown ? "bg-blue-500/20 text-blue-400" : "bg-blue-500/10 text-blue-500 group-hover:scale-110"
                          }`}>
                            <Users size={15} />
                          </div>
                          <ChevronDown
                            size={14}
                            className={`text-blue-400/80 transition-transform duration-350 shrink-0 ${showActiveKnightsDropdown ? "rotate-180 text-blue-400" : ""}`}
                          />
                        </div>
                      </button>
                    </div>

                    {/* Dropdown 1: Live Broadcast Attendees List Panel */}
                    {showAttendeesDropdown && (
                      <div className="w-full mt-3.5 bg-gradient-to-b from-[#0A0F25] to-[#040715] rounded-xl border border-emerald-500/30 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_15px_rgba(16,185,129,0.06)] animate-fadeIn text-right">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black text-white">قائمة فرسان البث المتواجدين حالياً ({displayAttendees.length})</span>
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-400">📡 محدث لحظياً وتلقائياً 100%</span>
                          <button
                            type="button"
                            onClick={() => setShowAttendeesDropdown(false)}
                            className="text-white/40 hover:text-white transition-colors cursor-pointer text-xs"
                          >
                            ✕ طي القائمة
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto no-scrollbar">
                          {displayAttendees.map((st: any, i: number) => (
                            <div
                              key={st.id || i}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 transition-all shadow-sm"
                            >
                              <div className="flex items-center gap-2 text-right">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-xs font-black text-white/95">{st.name}</span>
                              </div>
                              <span className="text-[8px] font-black tracking-wider px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                                داخل البث 🟢
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dropdown 2: Online but not attending list with invite triggers */}
                    {showActiveKnightsDropdown && (
                      <div className="w-full mt-3.5 bg-gradient-to-b from-[#0A0F25] to-[#040715] rounded-xl border border-blue-500/30 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6),0_0_15px_rgba(59,130,246,0.06)] animate-fadeIn text-right">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs font-black text-white">الفرسان المتصلون بالمنصة وخارج البث في الوقت الفعلي ({displayActiveNotAttending.length})</span>
                          </div>
                          <span className="text-[10px] font-semibold text-blue-400">💡 متصلون بصفحة الدرس الأساسية</span>
                          <button
                            type="button"
                            onClick={() => setShowActiveKnightsDropdown(false)}
                            className="text-white/40 hover:text-white transition-colors cursor-pointer text-xs"
                          >
                            ✕ طي القائمة
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto no-scrollbar">
                          {displayActiveNotAttending.map((st: any, i: number) => {
                            const isInvited = invitedStudents[st.id || st.name];
                            return (
                              <div
                                key={st.id || i}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all shadow-sm"
                              >
                                <div className="flex flex-col text-right">
                                  <span className="text-xs font-black text-white/95">{st.name}</span>
                                  <span className="text-[8px] text-blue-400 font-extrabold leading-none mt-1">متصل بالمنصة 📱</span>
                                </div>
                                <span className="text-[9px] text-zinc-500 font-bold">لم ينضم بعد</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Selected Tab content */}
              {selectedControlTab === "live" && (
                isControlLiveDisabled ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center space-y-5 my-auto max-w-lg mx-auto" dir="rtl">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.25)] backdrop-blur-md">
                        <Lock size={38} className="animate-pulse" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-[#0A0F24] border border-rose-500/50 rounded-full text-[9px] font-black text-rose-300 flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span>مغلق من قِبل المطور</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black">
                        <span>📡 قسم البث المباشر للأستاذ</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        قسم البث المباشر مغلق حالياً من قِبل المطور
                      </h3>
                      <p className="text-xs font-medium text-white/70 leading-relaxed px-4">
                        تم إيقاف صلاحية إطلاق وإدارة غرف البث المباشر الصوتي والمرئي لمنصة الأستاذ لهذه المدرسة بقرار من مطور النظام والإدارة المركزية. تم تعليق غرف البث التفاعلي مؤقتاً لحين إعادة التفعيل.
                      </p>
                    </div>
                    <div className="w-full p-3.5 rounded-xl bg-[#090F24]/90 border border-white/10 text-right space-y-2 text-xs">
                      <div className="flex items-center justify-between text-white/60">
                        <span>الحالة:</span>
                        <span className="font-bold text-rose-400">إيقاف مركزي (Developer Lockdown)</span>
                      </div>
                      <div className="flex items-center justify-between text-white/60">
                        <span>المدرسة المستهدفة:</span>
                        <span className="font-bold text-amber-300">{schoolName || "الميدان التعليمي"}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/60">
                        <span>رمز الخاصية:</span>
                        <span className="font-mono text-zinc-400 text-[11px]">teacher_live</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <TeacherControlLiveTab
                    realActiveKnights={realActiveKnights}
                    displayAttendees={displayAttendees}
                    displayActiveNotAttending={displayActiveNotAttending}
                    toggleStudentMic={toggleStudentMic}
                    toggleStudentCam={toggleStudentCam}
                    toggleStudentBoard={toggleStudentBoard}
                  />
                )
              )}
              {selectedControlTab === "content" && (
                isControlContentDisabled ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center space-y-5 my-auto max-w-lg mx-auto" dir="rtl">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.25)] backdrop-blur-md">
                        <Lock size={38} className="animate-pulse" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-[#0A0F24] border border-rose-500/50 rounded-full text-[9px] font-black text-rose-300 flex items-center gap-1 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                        <span>مغلق من قِبل المطور</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black">
                        <span>📚 قسم المحتوى والدروس للأستاذ</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        قسم المحتوى مغلق حالياً من قِبل المطور
                      </h3>
                      <p className="text-xs font-medium text-white/70 leading-relaxed px-4">
                        تم إيقاف صلاحية إدارة ورفع المحتوى التعليمي والدروس والملازم في منصة الأستاذ لهذه المدرسة من قِبل مطور النظام. تم تجميد التعديل ونشر الملفات مؤقتاً.
                      </p>
                    </div>
                    <div className="w-full p-3.5 rounded-xl bg-[#090F24]/90 border border-white/10 text-right space-y-2 text-xs">
                      <div className="flex items-center justify-between text-white/60">
                        <span>الحالة:</span>
                        <span className="font-bold text-rose-400">إيقاف مركزي (Developer Lockdown)</span>
                      </div>
                      <div className="flex items-center justify-between text-white/60">
                        <span>المدرسة المستهدفة:</span>
                        <span className="font-bold text-amber-300">{schoolName || "الميدان التعليمي"}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/60">
                        <span>رمز الخاصية:</span>
                        <span className="font-mono text-zinc-400 text-[11px]">teacher_content</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <TeacherControlContentTab />
                )
              )}
              {selectedControlTab === "files_center" && <TeacherControlFilesTab />}
              {selectedControlTab === "grades_center" && <TeacherControlGradesTab />}
              {selectedControlTab === "assessment" && <TeacherControlAssessmentTab />}
              {selectedControlTab === "announcements" && <TeacherControlAnnouncementsTab />}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const teacherNotifications = isTeacher
    ? notifications.filter(
        (n) =>
          !(
            (n.title &&
              (n.title.includes("مرحباً بك") ||
                n.title.includes("Welcome to BAYRAQ") ||
                n.title.includes("خطأ في"))) ||
            n.type === "alarm"
          ),
      )
    : [];
  const displayNotifications = (notifications || []).filter((n) => {
    if (n.type === "broadcast" || n.type === "admin_broadcast") return true;
    if (!n.title) return false;
    const lowercaseTitle = n.title.toLowerCase();
    if (
      lowercaseTitle.includes("مرحباً بك") ||
      lowercaseTitle.includes("welcome to bayraq")
    )
      return false;
    if (
      lowercaseTitle.includes("خطأ في") ||
      lowercaseTitle.includes("خطأ") ||
      n.type === "alarm"
    )
      return false;
    if (
      n.message &&
      (n.message.includes("تم نشر الإعلان") ||
        n.message.includes("أجهزة وواجهات جميع المستخدمين"))
    )
      return false;
    if (
      n.title &&
      (n.title.includes("تم نشر الإعلان") ||
        (n.title === "نجاح" && n.message?.includes("تم نشر")))
    )
      return false;
    return true;
  });
  console.log("SchoolPlatform displayNotifications:", displayNotifications);


  return (
    <SchoolPlatformContext.Provider value={platformContextValue}>
      <div
        className="fixed inset-0 bg-[#050A18] flex flex-col z-[100] font-sans overflow-hidden"
        dir="rtl"
      >
      {selectedAcademyPage && (
        <SixthAcademyPro 
          onBack={() => setSelectedAcademyPage(null)} 
          pageData={selectedAcademyPage}
          isTeacherEditMode={isTeacher || userProfile?.role === "admin"}
        />
      )}
      {activeContentSession && (
        <StrictContentViewer
          title={activeContentSession.title}
          unit={activeContentSession.unit}
          onClose={() => setActiveContentSession(null)}
        />
      )}

      {/* Comprehensive AI Radar Exam Overlay Modal */}
      {activeRadarFile && (
        <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#030616]">
          <AIEnhancedRadar
            userProfile={userProfile || { name: "فارس السادس", studentCode: "S6-GEN-7351" }}
            progress={progress || { unlockedUnits: [], badges: {} }}
            setProgress={setProgress || (() => {})}
            onBack={() => setActiveRadarFile(null)}
            files={[activeRadarFile]}
          />
        </div>
      )}

      {/* Download modal removed */}


      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-6 right-6 z-[200] flex justify-center"
          >
            <div
              className={`px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 ${
                toast.type === "success"
                  ? "bg-emerald-500 text-white"
                  : toast.type === "error"
                    ? "bg-rose-500 text-white"
                    : "bg-blue-600 text-white"
              }`}
            >
              {toast.type === "info" ? (
                <Activity size={20} />
              ) : (
                <Zap size={20} />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 REMOTE CONTROL: Seasonal Theme Visual Cloud Banner */}
      <SeasonalThemeBanner />

      <ScheduleAlerter
        grade={grade}
        isTeacher={isTeacher}
        teacherId={teacherData?.id}
        userName={
          isTeacher
            ? teacherData?.name || "أستاذ"
            : userProfile?.name || auth.currentUser?.displayName || "طالب"
        }
      />
      {/* Absolute Back Button - Always accessible */}
      {!isPosting && (
        <button
          onClick={handleBack}
          className={`fixed right-6 z-[110] rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-all border border-white/10 ${activeTab === "feed" ? "top-8 w-8 h-8" : "top-6 w-10 h-10"}`}
        >
          <ArrowRight size={activeTab === "feed" ? 18 : 22} />
        </button>
      )}

      {/* 2. Platform Page Content Area */}
      <div 
        id="main-platform-scroll-container" 
        className={`flex-1 min-h-0 overflow-x-hidden relative ${activeTab === "materials" ? "overflow-hidden flex flex-col" : "overflow-y-auto"}`}
      >
        {/* 1. رأس الصفحة الملكي (الاسم الكامل + شريط التبليغات) - يظهر في تبويب النشر ويرتفع للأعلى مع التمرير */}
        <AnimatePresence>
          {activeTab === "feed" && (
            <motion.header
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="shrink-0 z-40 relative"
            >
              <div className="bg-[#0D47A1] rounded-b-[30px] shadow-[0_10px_30px_rgba(13,71,161,0.3)] relative h-[105px] overflow-hidden flex items-center">
                {/* Background elegant pattern and overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
                <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Bairaq Video Companion on the LEFT side - Spans from edge to edge (height 100%) */}
                <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-bl-[30px] flex items-center justify-center">
                  {/* Decorative neon golden-phosphor circular glow frame in background */}
                  <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
                  <BerqCharacter
                    pose="pose_waving_hand"
                    glowColor="gold"
                    className="w-full h-full object-cover relative z-10 scale-110"
                  />
                  {/* Subtle gradient overlay to blend the right edge smoothly into the blue background */}
                  <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
                </div>

                {/* Content on the RIGHT side */}
                <div 
                  className="relative z-10 flex-1 pr-16 md:pr-20 pl-36 sm:pl-40 md:pl-44 py-2 select-none cursor-pointer text-right flex flex-col justify-center h-full"
                  onClick={() => {
                    const newClicks = headerClicks + 1;
                    setHeaderClicks(newClicks);
                    if (newClicks >= 5) {
                      localStorage.setItem("isDeveloper", "true");
                      setIsDeveloperModeEnabled(true);
                      showToast("تم تفعيل وضع المطور واللوحة الإحصائية بنجاح! 🛠️", "success");
                      setHeaderClicks(0);
                    } else if (newClicks > 1) {
                      showToast(`اضغط ${5 - newClicks} مرات إضافية لتفعيل وضع المطور 🛠️`, "info");
                    }
                  }}
                >
                  {isTeacher ? (
                    <div className="text-right min-w-0">
                      <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
                        الساحة التفاعلية 📢
                      </h2>
                      <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                        <span className="shrink-0 text-xs">🏛️</span>
                        <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/90 font-bold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                        <span className="shrink-0 text-[10px]">👨‍🏫</span>
                        <span className="truncate">
                          بوابة الكادر التعليمي - {currentTeacherData?.name || teacherData?.name || userProfile?.name || userProfile?.displayName || userName || "أستاذ"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right min-w-0 flex-1">
                      <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
                        الساحة التفاعلية 📢
                      </h2>
                      <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                        <span className="shrink-0 text-xs">🏛️</span>
                        <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
                        <span className="shrink-0 text-[10px]">🎓</span>
                        <span className="truncate">
                          {resolvedStudentSection || userProfile?.section || (userProfile as any)?.studentSection || userProfile?.class || (userProfile?.grade && extractSectionLetter(userProfile.grade) ? userProfile.grade : "") || gradeName || grade || userProfile?.grade || userProfile?.academicLevel || "سادس علمي"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full bg-[#fbbf24] border-b border-white/5 flex items-center h-11">
                {/* Notification & Lounge Buttons container */}
                <div className="flex items-center h-full">
                  {/* Lounge Button */}
                  <button
                    onClick={() => setIsLoungeOpen(true)}
                    className="h-full px-3 shrink-0 flex items-center justify-center bg-[#fbbf24] border-l border-black/10 text-black hover:bg-black/5 transition-all relative group"
                    title="المجلس"
                  >
                    <div className="relative">
                      <Coffee
                        size={18}
                        className="text-black group-hover:scale-110 transition-transform"
                      />
                      {(!isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin' && platformLocks.loungeLock) ? (
                          <div className="absolute -bottom-1.5 -left-2 bg-red-600 rounded-full min-w-[14px] h-[14px] px-1 shadow-sm border border-white flex items-center justify-center">
                              <Lock size={8} className="text-white" />
                          </div>
                      ) : unreadLoungeCount > 0 ? (
                        <div className="absolute -bottom-1.5 -left-2 bg-red-600 rounded-full min-w-[14px] h-[14px] px-1 shadow-sm border border-white flex items-center justify-center">
                          <span className="text-[8px] font-black text-white">
                            {unreadLoungeCount}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -left-1 bg-white rounded-full p-[1px] shadow-sm border border-black/10">
                          <MessageCircle
                            size={8}
                            className="text-blue-600 fill-blue-600"
                          />
                        </div>
                      )}
                    </div>
                  </button>
                  {/* Support/Notifications Button */}
                  <button
                    onClick={() => setIsSupportOpen(true)}
                    className="h-full px-3 shrink-0 flex items-center justify-center bg-[#fbbf24] border-l border-black/10 text-black hover:bg-black/5 transition-all relative"
                    title="التبليغات والإشعارات"
                  >
                    <Bell size={18} />
                    {resolvedTicketCount > 0 ||
                    displayNotifications.some((n) => !n.read) ||
                    socialUnreadCount > 0 ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-[9px] text-white flex items-center justify-center font-black shadow-[0_0_10px_rgba(225,29,72,0.5)] border border-white/20 z-10"
                      >
                        {resolvedTicketCount +
                          displayNotifications.filter((n) => !n.read).length +
                          socialUnreadCount}
                      </motion.span>
                    ) : null}
                  </button>
                </div>

                <div className="flex-1 overflow-hidden h-full">
                  <BroadcastTicker
                    schoolId={resolvedSchoolId}
                    grade={
                      isTeacher && selectedTeacherClass && selectedTeacherClass !== "ALL" && selectedTeacherClass !== "كافة الشُعب"
                        ? (extractGradeBase(selectedTeacherClass) || selectedTeacherClass)
                        : (gradeName || grade || "")
                    }
                    section={
                      isTeacher
                        ? (selectedTeacherClass && selectedTeacherClass !== "ALL" && selectedTeacherClass !== "كافة الشُعب"
                            ? selectedTeacherClass
                            : "ALL")
                        : (resolvedStudentSection || userProfile?.section || (userProfile as any)?.studentSection || userProfile?.class || (userProfile?.grade && extractSectionLetter(userProfile.grade) ? userProfile.grade : "") || gradeName || grade || "")
                    }
                    isVisible={true}
                    isTeacher={isTeacher && (!selectedTeacherClass || selectedTeacherClass === "ALL" || selectedTeacherClass === "كافة الشُعب")}
                  />
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD600]/10 rounded-full blur-[120px]" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full w-full flex flex-col min-h-0 flex-1"
          >
            {isTeacher ? (
              <TeacherViewWrapper title={activeTab}>
                {renderTabContent()}
              </TeacherViewWrapper>
            ) : (
              <StudentViewWrapper title={activeTab}>
                {renderTabContent()}
              </StudentViewWrapper>
            )}
          </motion.div>
        </AnimatePresence>

        <StudentSupportForm
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
          studentName={
            isTeacher
              ? teacherData?.name || "أستاذ"
              : userProfile?.name || auth.currentUser?.displayName || "طالب"
          }
          grade={gradeName || grade}
          userId={getCurrentUserId()}
          role={isTeacher ? "teacher" : "student"}
          isTeacher={isTeacher}
          notifications={notifications}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
          onDeleteNotification={onDeleteNotification}
          onClearAllNotifications={onClearAllNotifications}
          studentCode={
            isTeacher
              ? teacherData?.code || teacherData?.id || userProfile?.code
              : userProfile?.studentCode || userProfile?.code
          }
          parentCode={userProfile?.parentCode}
          onSocialUnreadCount={setSocialUnreadCount}
          onMarkAllRead={() => {
            setResolvedTicketCount(0);
            if (onMarkNotificationAsRead && notifications) {
              notifications.filter(n => !n.read).forEach(n => onMarkNotificationAsRead(n.id));
            }
          }}
          schoolId={schoolId}
        />

        {/* Real-time Student Live Lesson Summons Banner - Disabled manually as per request */}
        {/* <AnimatePresence>
          {activeLiveAlert && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
...
            </div>
          )}
        </AnimatePresence> */}
      </div>

      {/* شريط الفرسان المرابطون أسفل الميادين */}
      <AnimatePresence>
        {!isTeacher && activeTab !== "feed" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-16 left-0 right-0 z-[60]"
          >
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Professional Bottom Navigation Bar (Matched to User Flutter Specs) */}
      <nav className="h-16 flex-shrink-0 bg-[#050A18]/95 backdrop-blur-sm border-t border-white/10 flex items-center gap-1 overflow-x-auto no-scrollbar px-2 pb-1 z-50 relative justify-start md:justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PlatformTab, "Bottom Navigation Bar onClick")}
              className="relative flex flex-col items-center justify-center gap-1 min-w-[75px] h-full transition-all outline-none group flex-shrink-0"
            >
              <motion.div
                animate={
                  isSelected ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }
                }
                className={`transition-all duration-300 ${isSelected ? "text-[#FFD600]" : (tab as any).isDisabled ? "text-rose-400/60" : "text-white/30 group-hover:text-white/70"}`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 ${isSelected ? "bg-[#FFD600]/10 shadow-[0_0_15px_rgba(255,214,0,0.1)]" : "bg-transparent"}`}
                >
                  <Icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
                </div>
              </motion.div>
              <span
                className={`text-[10px] font-bold transition-all duration-300 tracking-wide
                ${isSelected ? "text-[#FFD600] scale-105" : (tab as any).isDisabled ? "text-rose-400/70" : "text-white/30"}`}
              >
                {tab.name}
              </span>

              {(tab as any).isDisabled && (
                <span className="absolute top-1 left-2 p-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 z-20" title="مغلق من قِبل المطور">
                  <Lock size={9} />
                </span>
              )}

              {tab.id === "live_watch" && !(tab as any).isDisabled && (
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-black z-20"></span>
              )}

              {isSelected && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-[1px] w-12 h-1 bg-[#FFD600] rounded-b-full shadow-[0_2px_10px_rgba(255,214,0,0.5)]"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Share Options Drawer/Modal */}
      {sharingPost && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 shadow-2xl"
          dir="rtl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0D1527] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-white font-black text-lg">
                خيارات مشاركة المنشور
              </h3>
              <button
                onClick={() => setSharingPost(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-white/5 text-right">
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                placeholder="بم تفكر..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500/50 min-h-[80px] resize-none"
              />
            </div>

            {/* Content Preview */}
            <div className="p-6 bg-black/20 border-b border-white/5 text-right">
              <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider block mb-2">
                معاينة المنشور:
              </span>
              <p className="text-white/85 text-sm line-clamp-2 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                <RenderTextWithTags text={sharingPost.content} />
              </p>
            </div>

            {/* Buttons list */}
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleShareOption("feed")}
                className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
              >
                <span>🚀 مشاركة كمنشور في الساحة</span>
                <span className="text-xs text-blue-200/60 font-medium group-hover:translate-x-1 transition-transform">
                  تكرار النشر ←
                </span>
              </button>

              <button
                onClick={() => handleShareOption("story")}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-white font-black text-sm flex items-center justify-between transition-all group active:scale-[0.98] cursor-pointer"
              >
                <span>🌟 مشاركة كحالة (Story)</span>
                <span className="text-xs text-amber-100/60 font-medium group-hover:translate-x-1 transition-transform">
                  تظهر لزملائك ←
                </span>
              </button>

              <button
                onClick={() => handleShareOption("system")}
                className="w-full py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-black text-sm flex items-center justify-between transition-all border border-white/5 active:scale-[0.98] cursor-pointer"
              >
                <span>🔗 نسخ وتصدير النص الحرفي</span>
                <span className="text-xs text-white/40">نسخ للحافظة</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Link Additional Class Code for Multi-Section Teachers */}
      <AnimatePresence>
        {showLinkCodeModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-gradient-to-b from-[#0F172A] to-[#090D1A] rounded-3xl border border-amber-500/30 p-6 shadow-2xl space-y-5 text-right relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shadow-inner">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">ربط كود شعبة إضافية</h3>
                    <p className="text-xs text-amber-300/80 font-medium">لوحة تحكم موحدة لجميع شُعبك</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowLinkCodeModal(false); setLinkCodeError(''); setLinkCodeSuccess(''); }}
                  className="text-white/40 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <span>✨</span>
                  <span>كيف تعمل هذه الميزة؟</span>
                </p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  إذا كنت مكلفاً بتدريس أكثر من شعبة (مثل أ، ب، ج، د)، أدخل كود الشعبة الإضافية هنا لربطها فوراً بحسابك. ستتمكن من التبديل بين الشُعب أو إدارتها معاً دون الحاجة لتسجيل الخروج والدخول مجدداً!
                </p>
              </div>

              {/* Currently Linked Classes */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-white/60">الشُعب المربوطة حالياً بحسابك:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(((currentTeacherData?.classes || teacherData?.classes || []) as string[])).map((c: string) => (
                    <span key={c} className="bg-white/5 border border-white/10 text-emerald-300 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5">
                      <Check size={12} className="text-emerald-400" />
                      <span>{c}</span>
                    </span>
                  ))}
                </div>
              </div>

              <form onSubmit={handleLinkTeacherCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">
                    كود الشعبة الإضافية:
                  </label>
                  <input
                    type="text"
                    value={linkingCode}
                    onChange={(e) => setLinkingCode(e.target.value)}
                    placeholder="مثال: TCH-MATH-G1-1234 أو ACT-..."
                    className="w-full bg-[#050914] border border-white/10 focus:border-amber-400/60 rounded-2xl px-4 py-3 text-sm text-white font-mono text-center tracking-wider uppercase outline-none transition-all placeholder:text-white/20"
                    disabled={isLinkingCode}
                    autoFocus
                  />
                </div>

                {linkCodeError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0 text-rose-400" />
                    <span>{linkCodeError}</span>
                  </div>
                )}

                {linkCodeSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle size={14} className="shrink-0 text-emerald-400" />
                    <span>{linkCodeSuccess}</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="submit"
                    disabled={isLinkingCode || !linkingCode.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLinkingCode ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>جاري الربط والتحقق...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={14} />
                        <span>ربط الشعبة الآن</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowLinkCodeModal(false); setLinkCodeError(''); setLinkCodeSuccess(''); }}
                    className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PlatformOverlays />
      </div>
    </SchoolPlatformContext.Provider>
  );
};

export default SchoolPlatform;
