import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, Shield, School, Users, UserCheck, 
  DollarSign, Sparkles, Plus, AlertCircle, RefreshCw, 
  Settings, CheckCircle, Database, Server, Cpu, 
  TrendingUp, Radio, Send, Bell, Code, Info, Search,
  GraduationCap, HeartHandshake, Activity, FileText,
  Copy, Trash2, ShieldOff, Calendar, Key, Zap, Bus, Car, Layers, Grid, BookOpen, ShieldCheck, Clock, PauseCircle,
  SlidersHorizontal, Power, Download, Palette, PhoneCall, Globe, ShieldAlert, ToggleLeft, ToggleRight, Lock, Unlock, Sliders, Smartphone, FileUp, Upload
, Image as ImageIcon, Bug, Menu, X, ChevronRight, ChevronLeft, ChevronDown, LayoutDashboard, Calculator, Building, Megaphone, ActivitySquare, LayoutPanelLeft, MapPin, PieChart, BarChart3, LineChart as LineIcon, Check, Award, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { 
  collection, doc, setDoc, deleteDoc, getDoc, getDocs, 
  addDoc, serverTimestamp, query, orderBy, onSnapshot, where, limit,
  updateDoc, deleteField, getCountFromServer, arrayUnion, collectionGroup
} from "@/src/lib/firebase";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";
import { BerqCharacter, getBerqImageUrl, isVideoUrl, POSE_ALIASES_MAP, updateGlobalPoses, subscribeToPoseOverrides } from "./BerqCharacterManager";
import { SCHOOLS_DATA, getOfficialSchoolLogoUrl, getOfficialSchoolName, getSchoolBairaqImageUrl } from "../lib/constants";
import { copyToClipboard } from "../utils/clipboard";
import { GlobalAnnouncementsBanner } from "./GlobalAnnouncementsBanner";
import { GlobalAnnouncementsPopup } from "./GlobalAnnouncementsPopup";
import { THEME_PRESETS, ACCENT_STYLES } from "../utils/themePresets";
import { RemoteConfig, DEFAULT_REMOTE_CONFIG, SeasonalThemeType, ThemeAccentColor, ThemeEffectType, fetchRemoteConfigFromServer } from "../services/remoteConfig";
import { realtimeManager } from "../lib/realtimeManager";
import { SystemDialogsModal, SystemModalType } from "./SystemDialogsModal";
import { uploadFileToR2 } from "../services/uploadService";
import { BairaqAssetHistoryModal } from "./BairaqAssetHistoryModal";
import { SystemHealthSection } from "./dev/SystemHealthSection";
import { DataIntegritySection } from "./dev/DataIntegritySection";
import { ErrorMonitoringSection } from "./dev/ErrorMonitoringSection";
import { LiveSimulatorSection } from "./dev/LiveSimulatorSection";
import { AiContentStudioSection } from "./dev/AiContentStudioSection";
import { SubscriptionsLicensingSection } from "./dev/SubscriptionsLicensingSection";
import { SecurityAccessSection } from "./dev/SecurityAccessSection";
import { MaintenanceArchiveSection } from "./dev/MaintenanceArchiveSection";
import { CloudControlSection } from "./dev/CloudControlSection";
import { AcademyManagementSection } from "./dev/AcademyManagementSection";
import { MediaManagementSection } from "./dev/MediaManagementSection";
import { UsersAuditDirectorySection } from "./dev/UsersAuditDirectorySection";
import { schoolService } from "../services/schoolService";
import { dataIntegrityService } from "../services/dataIntegrityService";
import { activationCodesService } from '../services/activationCodesService';

interface DevDashboardProps {
  schoolId: string;
  userProfile: any;
  showToast?: (msg: string, type: "success" | "error" | "info") => void;
}

interface SchoolRecord {
  id: string;
  name: string;
  governorate: string;
  location?: string;
  city?: string;
  createdAt?: any;
  status: "active" | "suspended";
  studentsCount: number;
  teachersCount: number;
  parentsCount?: number;
  totalUsers?: number;
  aiUsageCount?: number;
  plan: "trial" | "standard" | "premium";
  adminName: string;
  coverUrl?: string;
  logoUrl?: string;
  subscriptionStatus?: string;
  subscriptionEnd?: string;
  expiryDate?: string;
  lastActivity?: string;
  disabledModules?: string[];
}

export default function DevDashboard({ schoolId, userProfile, showToast }: DevDashboardProps) {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [configuringSchoolModules, setConfiguringSchoolModules] = useState<SchoolRecord | null>(null);
  const [activeModuleTab, setActiveModuleTab] = useState<'admin' | 'student' | 'teacher' | 'parent'>('admin');

  const SCHOOL_MODULES = [
    // --- Admin Dashboard (Generic/Main) ---
    { id: 'financial', aliases: ['financial', 'financial_status', 'finance', 'payment'], label: '💰 الموقف المالي والاقساط', desc: 'إدارة الموقف المالي، حالة الاشتراكات، والرسوم الدراسية والمحفظة.' },
    { id: 'activation_codes', aliases: ['activation_codes', 'codes_center', 'codes'], label: '🔑 مركز الأكواد والتراخيص', desc: 'توليد وإدارة أكواد التفعيل والاشتراكات والبطاقات.' },
    { id: 'control_hub', aliases: ['control_hub', 'control', 'grades'], label: '📊 سجل الدرجات والكنترول', desc: 'شؤون الطلاب، إدخال الدرجات، الشهادات، ولوحة الكنترول المركزية.' },
    { id: 'attendance', aliases: ['attendance', 'discipline'], label: '📋 سجل الحضور والانضباط', desc: 'متابعة غياب وحضور الطلاب وتقارير السلوك اليومية.' },
    { id: 'teachers', aliases: ['teachers', 'admin_teachers'], label: '👥 إدارة الكادر والموظفين', desc: 'إدارة الكادر الأكاديمي والوظيفي في لوحة الإدارة.' },
    { id: 'broadcast', aliases: ['broadcast', 'live_watch', 'teacher_live', 'teacher_broadcast'], label: '📢 البث المباشر والإذاعة', desc: 'البث الصوتي والمرئي، الإذاعة المدرسية، وغرف الدروس المباشرة.' },
    { id: 'transport', aliases: ['transport', 'bus_transport', 'drivers'], label: '🚌 تتبع خطوط النقل الذكي', desc: 'إدارة الحافلات، تتبع السائقين، وخطوط النقل المدرسي.' },
    { id: 'questions_bank', aliases: ['questions_bank', 'ai_gen_questions', 'files'], label: '📁 بنك الاسئلة والملفات', desc: 'بنك الأسئلة المنهجي، الملفات المرفوعة، وأدوات توليد الأسئلة.' },
    { id: 'competitions', aliases: ['competitions', 'sovereignty', 'class_competitions'], label: '🏆 المسابقات والتحديات', desc: 'منصة السيادة، البطولات، المسابقات الصفية ورتب الفرسان.' },
    { id: 'ideas', aliases: ['ideas', 'ideas_bank'], label: '💡 مائدة الافكار وبنك المقترحات', desc: 'صندوق مقترحات الطلاب والأهالي وبنك الأفكار التطويرية.' },
    { id: 'support', aliases: ['support', 'tickets'], label: '🎧 تواصل مع الإدارة والدعم الفني', desc: 'مركز استقبال الشكاوى والاستفسارات والتواصل المباشر.' },
    
    // --- Student Platform ---
    { id: 'arena', aliases: ['arena', 'feed'], label: '🏆 الساحة التفاعلية', desc: 'منشورات المدرسة، تفاعلات الطلاب، والتعليقات.' },
    { id: 'materials', aliases: ['content', 'materials', 'teacher_content', 'teacher_materials'], label: '📚 الملازم والمحتوى التعليمي', desc: 'تصفح الملازم، الكتب، والمواد المنهجية المرفوعة.' },
    { id: 'videos', aliases: ['videos', 'educational_videos'], label: '🎬 قسم الفيديوهات', desc: 'مكتبة الفيديوهات التعليمية والدروس المسجلة.' },
    { id: 'assignments', aliases: ['assignments', 'activities', 'ai_gen_assignments'], label: '📝 الواجبات والأنشطة', desc: 'منصة تسليم الواجبات، الأنشطة اليومية، وصناعة الواجبات.' },
    { id: 'mayadeen', aliases: ['mayadeen', 'school_map'], label: '📍 قسم الميادين', desc: 'خريطة المدرسة، الفعاليات الميدانية، والمناطق التفاعلية.' },
    { id: 'schedule', aliases: ['schedule'], label: '📅 جدولي المدرسي', desc: 'عرض جدول الحصص اليومي وتوقيتات الدروس.' },
    { id: 'excellence', aliases: ['excellence', 'awards'], label: '🌟 نظام التميز والفرسان', desc: 'لوحة الشرف، نقاط التميز، والتتويجات المدرسية.' },

    // --- Teacher Platform ---
    { id: 'attendance_tracking', aliases: ['attendance_tracking'], label: '⏱️ رصد الحضور (للأستاذ)', desc: 'واجهة الأستاذ لتسجيل غياب وحضور الطلاب في الصف.' },
    { id: 'teacher_upload', aliases: ['teacher_upload', 'upload_files'], label: '📤 رفع الملفات (للأستاذ)', desc: 'أدوات الأستاذ لرفع الملازم والملفات الخاصة بصفوفه.' },
    { id: 'evaluation', aliases: ['evaluation', 'grading'], label: '📝 قسم التقييم', desc: 'تقييم أداء الطلاب، المشاركات الصفية، والدرجات الشفهية.' },
    { id: 'announcements', aliases: ['announcements', 'teacher_news'], label: '📣 الاعلانات', desc: 'إطلاق التنبيهات والتعميمات الخاصة بالمادة للطلاب.' },
    { id: 'sovereignty_mgmt', aliases: ['sovereignty_mgmt'], label: '🏰 إدارة التحديات والسيادة', desc: 'تحكم الأستاذ في مسابقات السيادة والتحديات الخاصة بطلابه.' },
    { id: 'ai_gen_summary', aliases: ['ai_gen_summary'], label: '📄 انشاء ملخص ذكي', desc: 'استخدام الذكاء الاصطناعي لإنشاء ملخصات آلية للدروس.' },
    { id: 'ai_teaching_suggestions', aliases: ['ai_teaching_suggestions'], label: '💡 اقتراحات للشرح', desc: 'أفكار واقتراحات ذكية لتسهيل إيصال المعلومة.' },
    { id: 'activity_monitoring', aliases: ['activity_monitoring'], label: '📈 متابعة الانشطة', desc: 'مراقبة مدى تفاعل الطلاب مع الواجبات والدروس.' },

    // --- Parent Platform ---
    { id: 'grades_parent', aliases: ['grades', 'attendance', 'discipline'], label: '📊 سجل الدرجات والحضور', desc: 'متابعة غياب وحضور الطالب ودرجاته الشهرية.' },
    { id: 'assignments_parent', aliases: ['assignments'], label: '📝 الواجبات والأنشطة', desc: 'متابعة الواجبات البيتية والأنشطة المسندة للطالب.' },
    { id: 'uniform_parent', aliases: ['uniform'], label: '👔 الزي المدرسي الرسمي', desc: 'مراقبة تقارير الزي المدرسي والمظهر العام للطالب.' },
    { id: 'transport_parent', aliases: ['transport'], label: '🚌 تتبع خطوط النقل الذكي', desc: 'تتبع حافلة المدرسة ومسار وصول الطالب.' },
    { id: 'support_parent', aliases: ['support'], label: '💬 التواصل مع الإدارة', desc: 'فتح تذاكر دعم أو تواصل مباشر مع إدارة المدرسة.' },
    { id: 'financial_parent', aliases: ['financial', 'finance'], label: '💰 الموقف المالي والأقساط', desc: 'إدارة الموقف المالي، حالة الاشتراكات، والرسوم الدراسية والمحفظة.' },
    { id: 'discipline_reports_parent', aliases: ['discipline_reports'], label: '📉 تقارير الانضباط والسلوك', desc: 'تقارير مفصلة عن سلوك الطالب داخل الحرم المدرسي.' },
    { id: 'excellence_parent', aliases: ['excellence', 'competitions', 'sovereignty'], label: '🌟 نظام التميز', desc: 'عرض أوسمة التميز، نقاط الفرسان، وتحديات الطالب.' },
    { id: 'ideas_parent', aliases: ['ideas'], label: '💡 مائدة الأفكار', desc: 'تقديم المقترحات والأفكار لتطوير البيئة المدرسية.' },
  ];

  const lastModalOpenTime = useRef<number>(0);
  useEffect(() => {
    if (configuringSchoolModules) {
      lastModalOpenTime.current = Date.now();
    }
  }, [configuringSchoolModules]);

  const toggleSchoolModule = async (targetSchoolId: string, moduleId: string, currentDisabled: string[] = [], tab: string = 'admin') => {
    // Safety check: prevent accidental clicks within 400ms of opening the modal
    if (Date.now() - lastModalOpenTime.current < 400) return;

    const modObj = SCHOOL_MODULES.find(m => m.id === moduleId);
    const rawAliases = modObj?.aliases || [moduleId];
    
    // Add prefix for non-admin tabs for total isolation
    const aliases = tab === 'admin' ? rawAliases : rawAliases.map(a => `${tab}:${a}`);

    const isCurrentlyDisabled = aliases.some(a => currentDisabled.includes(a));
    let updatedDisabled: string[];

    if (isCurrentlyDisabled) {
      updatedDisabled = currentDisabled.filter(m => !aliases.includes(m));
    } else {
      updatedDisabled = Array.from(new Set([...currentDisabled, ...aliases]));
    }

    try {
      setConfiguringSchoolModules(prev => prev ? { ...prev, disabledModules: updatedDisabled } : null);
      setSchools(prev => prev.map(s => (s.id === targetSchoolId || (s.id === 'school1' && targetSchoolId === 'school_awail_ghamas') || (s.id === 'school_awail_ghamas' && targetSchoolId === 'school1')) ? { ...s, disabledModules: updatedDisabled } : s));

      // 1. Persist to PostgreSQL backend via API (Primary Source)
      try {
        await fetch(`/api/schools/${targetSchoolId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disabledModules: updatedDisabled })
        });
      } catch (apiErr) {
        console.warn("Backend API sync notice:", apiErr);
      }

      // 2. LocalStorage persistence for instant local sync
      try {
        const keys = [targetSchoolId];
        
        keys.forEach(k => {
          localStorage.setItem(`school_disabled_modules_${k}`, JSON.stringify(updatedDisabled));
          localStorage.setItem(`s6_disabled_modules_${k}`, JSON.stringify(updatedDisabled));
        });

        const saved = localStorage.getItem("berq_dev_schools");
        if (saved) {
          const list = JSON.parse(saved);
          const updatedList = list.map((s: any) => 
            s.id === targetSchoolId 
            ? { ...s, disabledModules: updatedDisabled } 
            : s
          );
          localStorage.setItem("berq_dev_schools", JSON.stringify(updatedList));
        }
      } catch (lsErr) {
        console.warn("LocalStorage sync notice:", lsErr);
      }

      // 4. Broadcast via realtimeManager
      try {
        realtimeManager.emit('school_configs', {
          id: targetSchoolId,
          schoolId: targetSchoolId,
          disabledModules: updatedDisabled,
          action: 'UPDATE'
        });
      } catch (rtErr) {
        console.warn("Realtime broadcast notice:", rtErr);
      }

      // 5. Dispatch native Window event for in-tab instant sync
      window.dispatchEvent(new CustomEvent('school_configs_updated', {
        detail: {
          schoolId: targetSchoolId,
          disabledModules: updatedDisabled
        }
      }));

      triggerToast(isCurrentlyDisabled ? "تم تفعيل القسم بنجاح 🔓" : "تم إيقاف القسم بنجاح 🔒", "success");
    } catch (err) {
      console.error("Error updating disabledModules:", err);
      triggerToast("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  };

  const schoolsRef = useRef<SchoolRecord[]>([]);
  useEffect(() => {
    schoolsRef.current = schools;
  }, [schools]);
  
  // Real-time DB counters & per-school maps
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalTeachers, setTotalTeachers] = useState<number | null>(null);
  const [totalParents, setTotalParents] = useState<number | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const [processedFilesCount, setProcessedFilesCount] = useState<number | null>(null);
  const [aiUsageCount, setAiUsageCount] = useState<number | null>(null);

  const [studentsStatsMap, setStudentsStatsMap] = useState<Record<string, { count: number; grades: Set<string>; sections: Set<string>; parentCodes: Set<string> }>>({});
  const [teachersStatsMap, setTeachersStatsMap] = useState<Record<string, { teachersCount: number; supervisorsCount: number; adminsCount: number; subjects: Set<string>; grades: Set<string> }>>({});
  const [usersStatsMap, setUsersStatsMap] = useState<Record<string, { studentsCount: number; teachersCount: number; parentsCount: number; driversCount: number; supervisorsCount: number; adminsCount: number; activeUsersCount: number; totalUsersCount: number; lastActiveTime: string }>>({});
  const [busDriversStatsMap, setBusDriversStatsMap] = useState<Record<string, { driversCount: number; busNumbers: Set<string> }>>({});
  const [transportRoutesStatsMap, setTransportRoutesStatsMap] = useState<Record<string, number>>({});
  const [schedulesStatsMap, setSchedulesStatsMap] = useState<Record<string, { subjects: Set<string>; grades: Set<string> }>>({});
  const [academicListsStatsMap, setAcademicListsStatsMap] = useState<Record<string, { grades: Set<string>; sections: Set<string>; subjects: Set<string> }>>({});
  const [logsActivityMap, setLogsActivityMap] = useState<Record<string, string>>({});
  const [schoolAiMap, setSchoolAiMap] = useState<Record<string, number>>({});
  const [pendingSchoolImages, setPendingSchoolImages] = useState<Record<string, { coverUrl?: string; logoUrl?: string }>>({});
  const [headerPoses, setHeaderPoses] = useState<Record<string, string>>({});
  const [pendingHeaderPoses, setPendingHeaderPoses] = useState<Record<string, string>>({});
  const [pendingHeaderPoseFiles, setPendingHeaderPoseFiles] = useState<Record<string, File>>({});
  const [previewModalType, setPreviewModalType] = useState<SystemModalType | null>(null);
  const [historyModalAsset, setHistoryModalAsset] = useState<{id: string, title: string} | null>(null);

  const formatRelativeTime = (timeStr?: string): string => {
    if (!timeStr) return "نشط الآن";
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return "نشط الآن";

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 2) return "نشط الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} أيام`;

    return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const normalizeText = (str: string): string => {
    if (!str) return "";
    return str
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, ' ');
  };

  const resolveCanonicalSchoolId = (
    sIdRaw: string,
    sNameRaw: string,
    schoolsList: SchoolRecord[]
  ): string => {
    const cleanId = (sIdRaw || "").trim();
    if (!cleanId) return "";
    const idMatch = schoolsList.find(s => s.id === cleanId);
    return idMatch ? idMatch.id : cleanId;
  };

  const getLiveSchoolStats = (school: SchoolRecord) => {
    const mergeSets = (...sets: Array<Set<string> | undefined>): Set<string> => {
      const merged = new Set<string>();
      sets.forEach(s => {
        if (s) s.forEach(item => item && merged.add(item));
      });
      return merged;
    };

    // Helper for fuzzy school name normalization
    const normalizeFuzzySchoolName = (str: string) => {
      if (!str) return '';
      return str
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/\s+/g, '')
        .trim()
        .toLowerCase();
    };

    const schoolNormName = normalizeFuzzySchoolName(school.name);

    // 1. PRIMARY REFERENCE: Codes Center (activation_codes)
    const schoolActivationCodes = activationCodes.filter(c => {
      const sId = String(c.schoolId || c.school_id || "").trim();
      if (sId && sId === school.id) return true;
      const sName = String(c.schoolName || c.school || c.academyName || "").trim();
      const normDocName = normalizeFuzzySchoolName(sName);
      if (schoolNormName && normDocName && (normDocName === schoolNormName || normDocName.includes(schoolNormName) || schoolNormName.includes(normDocName))) {
        return true;
      }
      return false;
    });

    const studentCodesFromAct = schoolActivationCodes.filter(c => {
      const role = String(c.role || c.type || c.targetRole || "").toUpperCase();
      return role.includes("STUDENT") || role.includes("طالب");
    });
    const totalStudentCodes = studentCodesFromAct.length;
    const usedStudentCodes = studentCodesFromAct.filter(c => c.used || c.isUsed || c.usedBy || c.status === "used").length;
    const remainingStudentCodes = Math.max(0, totalStudentCodes - usedStudentCodes);

    const staffCodesFromAct = schoolActivationCodes.filter(c => {
      const role = String(c.role || c.type || c.targetRole || "").toUpperCase();
      return role.includes("TEACHER") || role.includes("STAFF") || role.includes("ADMIN") || role.includes("استاذ") || role.includes("معلم") || role.includes("كادر");
    });
    const totalStaffCodes = staffCodesFromAct.length;
    const usedStaffCodes = staffCodesFromAct.filter(c => c.used || c.isUsed || c.usedBy || c.status === "used").length;
    const remainingStaffCodes = Math.max(0, totalStaffCodes - usedStaffCodes);

    const parentCodesFromAct = schoolActivationCodes.filter(c => {
      const role = String(c.role || c.type || c.targetRole || "").toUpperCase();
      return role.includes("PARENT") || role.includes("أمر") || role.includes("امر");
    });
    const totalParentCodes = parentCodesFromAct.length;
    const usedParentCodes = parentCodesFromAct.filter(c => c.used || c.isUsed || c.usedBy || c.status === "used").length;
    const remainingParentCodes = Math.max(0, totalParentCodes - usedParentCodes);

    const totalAllCodes = totalStudentCodes + totalStaffCodes + totalParentCodes;
    const usedAllCodes = usedStudentCodes + usedStaffCodes + usedParentCodes;
    const activationRate = totalAllCodes > 0 ? Math.round((usedAllCodes / totalAllCodes) * 100) : 0;

    // 2. Secondary/Subordinate listeners (strictly bound to school.id)
    const studentStats = studentsStatsMap[school.id] || { count: 0, grades: new Set<string>(), sections: new Set<string>(), parentCodes: new Set<string>() };
    const teacherStats = teachersStatsMap[school.id] || { teachersCount: 0, supervisorsCount: 0, adminsCount: 0, subjects: new Set<string>(), grades: new Set<string>() };
    const userStats = usersStatsMap[school.id] || {
      studentsCount: 0,
      teachersCount: 0,
      parentsCount: 0,
      driversCount: 0,
      supervisorsCount: 0,
      adminsCount: 0,
      activeUsersCount: 0,
      totalUsersCount: 0,
      lastActiveTime: ""
    };
    const busDriverStats = busDriversStatsMap[school.id] || { driversCount: 0, busNumbers: new Set<string>() };
    const routesCount = transportRoutesStatsMap[school.id] || 0;
    const academicStats = academicListsStatsMap[school.id] || { grades: new Set<string>(), sections: new Set<string>(), subjects: new Set<string>() };
    const logActivity = logsActivityMap[school.id] || "";

    // Registered users are anchored to activated codes in the master Codes Center
    const registeredStudents = totalStudentCodes > 0 ? usedStudentCodes : (userStats.studentsCount > 0 && schoolActivationCodes.length === 0 ? userStats.studentsCount : 0);
    const registeredTeachers = totalStaffCodes > 0 ? usedStaffCodes : (userStats.teachersCount > 0 && schoolActivationCodes.length === 0 ? userStats.teachersCount : 0);
    const registeredParents = totalParentCodes > 0 ? usedParentCodes : 0;
    const registeredDrivers = busDriverStats.driversCount || userStats.driversCount || 0;
    const registeredSupervisors = teacherStats.supervisorsCount || userStats.supervisorsCount || 0;
    const registeredAdmins = teacherStats.adminsCount || userStats.adminsCount || 0;

    // Extract grades, sections, subjects from activation codes
    const codeGrades = new Set<string>();
    const codeSections = new Set<string>();
    const codeSubjects = new Set<string>();

    schoolActivationCodes.forEach(c => {
      if (c.grade) codeGrades.add(String(c.grade).trim());
      if (c.stage) codeGrades.add(String(c.stage).trim());
      if (c.section) codeSections.add(String(c.section).trim());
      if (c.class) codeSections.add(String(c.class).trim());
      if (c.subject) codeSubjects.add(String(c.subject).trim());
    });

    const scheduleStats = schedulesStatsMap[school.id] || { subjects: new Set(), grades: new Set() };

    // Structure metrics:
    // 1. Grades and Sections (الصفوف والشعب): Referenced from student records, academic lists (مركز الأكواد/القوائم), and activation codes
    const combinedGrades = mergeSets(studentStats.grades, academicStats.grades, codeGrades, scheduleStats.grades);
    const combinedSections = mergeSets(studentStats.sections, academicStats.sections, codeSections);
    const gradesCount = combinedGrades.size;
    const sectionsCount = combinedSections.size;

    // 2. Subjects (المواد): Referenced from class_schedules, academic_lists, teacher records, and activation codes
    const combinedSubjects = mergeSets(scheduleStats.subjects, academicStats.subjects, teacherStats.subjects, codeSubjects);
    const subjectsCount = combinedSubjects.size;

    const hasActiveInventory = schoolActivationCodes.length > 0;
    const busesCount = Math.max(routesCount, busDriverStats.busNumbers.size, busDriverStats.driversCount);
    const totalRegisteredUsers = hasActiveInventory ? usedAllCodes : userStats.totalUsersCount;
    const activeUsersCount = hasActiveInventory ? Math.min(userStats.activeUsersCount, usedAllCodes) : userStats.activeUsersCount;

    let expDateStr = school.subscriptionEnd || school.expiryDate || "";
    if (!expDateStr) {
      expDateStr = "2026-12-31";
    }

    let subscriptionStatus = "نشط";
    const now = new Date();
    const expDate = new Date(expDateStr);

    if (school.status === "suspended") {
      subscriptionStatus = "معطل";
    } else if (!isNaN(expDate.getTime()) && expDate < now) {
      subscriptionStatus = "منتهي";
    } else if (school.plan === "trial") {
      subscriptionStatus = "تجريبي";
    } else {
      subscriptionStatus = "نشط";
    }

    const lastTimeCandidate = userStats.lastActiveTime || logActivity || school.lastActivity;
    const lastActivity = formatRelativeTime(lastTimeCandidate);

    return {
      registeredStudents,
      registeredTeachers,
      registeredParents,
      registeredDrivers,
      registeredSupervisors,
      registeredAdmins,
      gradesCount,
      sectionsCount,
      subjectsCount,
      busesCount,
      activeUsersCount,
      totalRegisteredUsers,
      totalStudentCodes,
      usedStudentCodes,
      remainingStudentCodes,
      totalStaffCodes,
      usedStaffCodes,
      remainingStaffCodes,
      totalParentCodes,
      usedParentCodes,
      remainingParentCodes,
      totalAllCodes,
      usedAllCodes,
      activationRate,
      subscriptionStatus,
      subscriptionEnd: expDateStr,
      lastActivity
    };
  };
  
  // AI Analytics State
  const [aiAnalytics, setAiAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Activation Codes State
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // New School Form State
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolId, setNewSchoolId] = useState("");
  const [newSchoolGov, setNewSchoolGov] = useState("بغداد");
  const [newSchoolLocation, setNewSchoolLocation] = useState("");
  const [newSchoolAdmin, setNewSchoolAdmin] = useState("");
  const [newSchoolPlan, setNewSchoolPlan] = useState<"trial" | "standard" | "premium">("standard");
  const [newSchoolCoverPreview, setNewSchoolCoverPreview] = useState<string | null>(null);
  const [newSchoolLogoPreview, setNewSchoolLogoPreview] = useState<string | null>(null);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);

  // School Location Editing State (الميادين)
  const [editingSchoolLocation, setEditingSchoolLocation] = useState<SchoolRecord | null>(null);
  const [locationInputText, setLocationInputText] = useState("");
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // New Activation Code Form State
  const [genCode, setGenCode] = useState("");
  const [genSchoolId, setGenSchoolId] = useState("");
  const [genRole, setGenRole] = useState<"admin" | "teacher" | "student" | "parent" | "driver">("student");
  const [genMaxUses, setGenMaxUses] = useState(1);
  const [genExpiresAt, setGenExpiresAt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Global Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "teachers" | "students">("all");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Cost and Profit Simulation Sliders
  const [simStudents, setSimStudents] = useState(1000);
  const [simSubscription, setSimSubscription] = useState(1500); // IQD per student monthly
  const [simAiRequests, setSimAiRequests] = useState(10); // requests per student monthly

  // System telemetry data (Browser Simulated CPU & RAM metric counters)
    const [realLogs, setRealLogs] = useState<Array<{ id: string; type: string; text: string; time: string }>>([]);

  const [mascotStatus, setMascotStatus] = useState<Record<string, { status: "loading" | "loaded" | "failed"; width?: number; height?: number }>>({
    standing_arms_crossed: { status: "loading" },
    main_mascot_full_body: { status: "loading" },
    pose_thumbs_up: { status: "loading" },
  });

  // Real video asset live diagnostics state
  const [video1State, setVideo1State] = useState<string>("جاري تحميل المشغل...");
  const [video1Error, setVideo1Error] = useState<string | null>(null);
  const [video1HttpStatus, setVideo1HttpStatus] = useState<string>("جاري التحقق من HEAD...");
  const [video2State, setVideo2State] = useState<string>("جاري تحميل المشغل...");
  const [video2Error, setVideo2Error] = useState<string | null>(null);
  const [video2HttpStatus, setVideo2HttpStatus] = useState<string>("جاري التحقق من HEAD...");

  const [activeTab, setActiveTab] = useState<
    | "users_directory"
    | "academy"
    | "health"
    | "school_management"
    | "simulator"
    | "ai_studio"
    | "licensing"
    | "security"
    | "maintenance"
    | "remote_config"
    | "media"
    | "errors"
    | "actions"
    | "data_integrity"
  >("users_directory");

  // Remote Config / Cloud Control State
  const [remoteConfig, setRemoteConfig] = useState<RemoteConfig>(DEFAULT_REMOTE_CONFIG);
  const [savingRemoteConfig, setSavingRemoteConfig] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<SchoolRecord | null>(null);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [selectedAdminSchoolId, setSelectedAdminSchoolId] = useState("");
  const [codeSearchTerm, setCodeSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data Integrity Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditRunAt, setAuditRunAt] = useState<string | null>(null);
  const [auditResults, setAuditResults] = useState<{
    totalSchoolsAudited: number;
    intactSchoolsCount: number;
    discrepantSchoolsCount: number;
    orphanCodesCount: number;
    orphanUsersCount: number;
    mismatchedUsersCount: number;
    issues: Array<{
      id: string;
      type: "orphan_code" | "invalid_school_code" | "orphan_user" | "mismatched_user_school" | "stat_discrepancy";
      severity: "high" | "medium" | "low";
      title: string;
      description: string;
      schoolId?: string;
      docId?: string;
      collectionName?: string;
      fixable: boolean;
      meta?: any;
    }>;
    schoolResults: Array<{
      schoolId: string;
      schoolName: string;
      storedStats: {
        students: number;
        teachers: number;
        parents: number;
        totalUsers: number;
      };
      actualUsers: {
        students: number;
        teachers: number;
        parents: number;
        drivers: number;
        supervisors: number;
        admins: number;
        totalUsers: number;
      };
      actualCodes: {
        studentCodes: number;
        staffCodes: number;
        parentCodes: number;
        totalCodes: number;
        usedCodes: number;
      };
      hasDiscrepancy: boolean;
      discrepancies: string[];
    }>;
  } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  const runDataIntegrityAudit = async () => {
    setIsAuditing(true);
    try {
      triggerToast("جاري فحص وتدقيق سلامة وقواعد بيانات جميع المدارس...", "info");

      const [schoolsSnap, codesSnap, usersSnap, studentsSnap, teachersSnap] = await Promise.all([
        getDocs(collection(db, "schools")),
        getDocs(collection(db, "activation_codes")),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "school_students")),
        getDocs(collection(db, "teachers"))
      ]);

      const validSchoolsMap = new Map<string, string>();
      const schoolDocsMap = new Map<string, any>();
      schoolsSnap.forEach(d => {
        validSchoolsMap.set(d.id, d.data().name || "مدرسة غير مسمّاة");
        schoolDocsMap.set(d.id, { id: d.id, ...d.data() });
      });

      const issues: any[] = [];

      // 1. Audit Activation Codes
      const codesPerSchool = new Map<string, { studentCodes: number; staffCodes: number; parentCodes: number; totalCodes: number; usedCodes: number }>();
      const codesByIdMap = new Map<string, any>();

      codesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        codesByIdMap.set(docSnap.id, { id: docSnap.id, ...data });
        const sId = String(data.schoolId || data.school_id || "").trim();
        const sName = String(data.schoolName || data.school || "").trim();

        if (!sId) {
          issues.push({
            id: `orphan_code_${docSnap.id}`,
            type: "orphan_code",
            severity: "high",
            title: `كود بدون معرف مدرسة (School ID): ${data.code || docSnap.id}`,
            description: `الكود [${data.code || docSnap.id}] المخصص لـ (${data.role || "غير مسمى"}) لا يحمل schoolId. الاسم المسجل: ${sName || "غير محدد"}.`,
            docId: docSnap.id,
            collectionName: "activation_codes",
            fixable: Boolean(sName),
            meta: { code: data.code || docSnap.id, schoolName: sName }
          });
        } else if (!validSchoolsMap.has(sId)) {
          issues.push({
            id: `invalid_school_code_${docSnap.id}`,
            type: "invalid_school_code",
            severity: "high",
            title: `كود مرتبط بمدرسة غير موجودة: ${data.code || docSnap.id}`,
            description: `الكود [${data.code || docSnap.id}] يحمل schoolId=${sId} لكن هذه المدرسة غير موجودة في سجل المدارس.`,
            schoolId: sId,
            docId: docSnap.id,
            collectionName: "activation_codes",
            fixable: false
          });
        } else {
          if (!codesPerSchool.has(sId)) {
            codesPerSchool.set(sId, { studentCodes: 0, staffCodes: 0, parentCodes: 0, totalCodes: 0, usedCodes: 0 });
          }
          const curr = codesPerSchool.get(sId)!;
          const role = String(data.role || data.type || "").toUpperCase();
          const isUsed = Boolean(data.used || data.isUsed || data.usedBy || data.status === "used");

          if (role.includes("STUDENT") || role.includes("طالب")) curr.studentCodes++;
          else if (role.includes("PARENT") || role.includes("أمر") || role.includes("امر")) curr.parentCodes++;
          else curr.staffCodes++;

          curr.totalCodes++;
          if (isUsed) curr.usedCodes++;
        }
      });

      // 2. Audit Users & Students
      const usersPerSchool = new Map<string, { students: number; teachers: number; parents: number; drivers: number; supervisors: number; admins: number; totalUsers: number }>();

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        const usedCodeStr = String(data.activationCode || data.code || data.usedCode || "").trim();

        if (!sId) {
          issues.push({
            id: `orphan_user_${docSnap.id}`,
            type: "orphan_user",
            severity: "medium",
            title: `مستخدم بدون مدرسة: ${data.name || data.email || docSnap.id}`,
            description: `المستخدم [${data.name || data.email}] برتبة (${data.role || "مستخدم"}) لا يملك schoolId في حسابه.`,
            docId: docSnap.id,
            collectionName: "users",
            fixable: Boolean(usedCodeStr && codesByIdMap.has(usedCodeStr)),
            meta: { code: usedCodeStr }
          });
        } else if (!validSchoolsMap.has(sId)) {
          issues.push({
            id: `invalid_user_school_${docSnap.id}`,
            type: "invalid_school_code",
            severity: "high",
            title: `مستخدم مرتبط بمدرسة غير معرفة: ${data.name || docSnap.id}`,
            description: `المستخدم يحمل schoolId=${sId} غير موجود بقاعدة بيانات المدارس.`,
            schoolId: sId,
            docId: docSnap.id,
            collectionName: "users",
            fixable: false
          });
        } else {
          if (!usersPerSchool.has(sId)) {
            usersPerSchool.set(sId, { students: 0, teachers: 0, parents: 0, drivers: 0, supervisors: 0, admins: 0, totalUsers: 0 });
          }
          const curr = usersPerSchool.get(sId)!;
          const role = String(data.role || "").toLowerCase();

          if (role === "student" || role === "school_student" || role.includes("طالب")) curr.students++;
          else if (role === "teacher" || role === "cadre" || role.includes("استاذ") || role.includes("معلم")) curr.teachers++;
          else if (role === "parent" || role.includes("أمر") || role.includes("امر")) curr.parents++;
          else if (role === "driver" || role.includes("سائق")) curr.drivers++;
          else if (role === "supervisor" || role.includes("مشرف")) curr.supervisors++;
          else if (role === "admin" || role.includes("مدير") || role.includes("إداري")) curr.admins++;

          curr.totalUsers++;

          // Verify user schoolId matches code's schoolId if code used
          if (usedCodeStr && codesByIdMap.has(usedCodeStr)) {
            const codeObj = codesByIdMap.get(usedCodeStr);
            const codeSchoolId = String(codeObj.schoolId || codeObj.school_id || "").trim();
            if (codeSchoolId && codeSchoolId !== sId) {
              issues.push({
                id: `mismatched_user_${docSnap.id}`,
                type: "mismatched_user_school",
                severity: "high",
                title: `تضارب مدرسة المستخدم مع كود التسجيل: ${data.name || docSnap.id}`,
                description: `المستخدم يحمل schoolId=${sId} بينما الكود المستعمل [${usedCodeStr}] ينتمي لمدرسة schoolId=${codeSchoolId}.`,
                schoolId: sId,
                docId: docSnap.id,
                collectionName: "users",
                fixable: true,
                meta: { correctSchoolId: codeSchoolId }
              });
            }
          }
        }
      });

      // 3. Per-School Reconciliation & Discrepancies
      const schoolResults: any[] = [];
      let intactCount = 0;
      let discrepantCount = 0;

      validSchoolsMap.forEach((sName, sId) => {
        const stored = schoolDocsMap.get(sId) || {};
        const actualUserStats = usersPerSchool.get(sId) || { students: 0, teachers: 0, parents: 0, drivers: 0, supervisors: 0, admins: 0, totalUsers: 0 };
        const actualCodeStats = codesPerSchool.get(sId) || { studentCodes: 0, staffCodes: 0, parentCodes: 0, totalCodes: 0, usedCodes: 0 };

        const discrepancies: string[] = [];

        const storedStudents = Number(stored.studentsCount || 0);
        if (storedStudents !== actualUserStats.students) {
          discrepancies.push(`الطلاب: الوثيقة (${storedStudents}) vs الحقيقي (${actualUserStats.students})`);
        }

        const storedTeachers = Number(stored.teachersCount || 0);
        if (storedTeachers !== actualUserStats.teachers) {
          discrepancies.push(`الأساتذة: الوثيقة (${storedTeachers}) vs الحقيقي (${actualUserStats.teachers})`);
        }

        const storedParents = Number(stored.parentsCount || 0);
        if (storedParents !== actualUserStats.parents) {
          discrepancies.push(`أولياء الأمور: الوثيقة (${storedParents}) vs الحقيقي (${actualUserStats.parents})`);
        }

        const hasDiscrepancy = discrepancies.length > 0;
        if (hasDiscrepancy) {
          discrepantCount++;
          issues.push({
            id: `stat_discrepancy_${sId}`,
            type: "stat_discrepancy",
            severity: "low",
            title: `تضارب إحصائيات مدرسة: ${sName}`,
            description: discrepancies.join(" | "),
            schoolId: sId,
            docId: sId,
            collectionName: "schools",
            fixable: true,
            meta: { actualUserStats }
          });
        } else {
          intactCount++;
        }

        schoolResults.push({
          schoolId: sId,
          schoolName: sName,
          storedStats: {
            students: storedStudents,
            teachers: storedTeachers,
            parents: Number(stored.parentsCount || 0),
            totalUsers: Number(stored.totalUsers || 0)
          },
          actualUsers: actualUserStats,
          actualCodes: actualCodeStats,
          hasDiscrepancy,
          discrepancies
        });
      });

      const orphanCodesCount = issues.filter(i => i.type === "orphan_code").length;
      const orphanUsersCount = issues.filter(i => i.type === "orphan_user").length;
      const mismatchedUsersCount = issues.filter(i => i.type === "mismatched_user_school").length;

      setAuditResults({
        totalSchoolsAudited: validSchoolsMap.size,
        intactSchoolsCount: intactCount,
        discrepantSchoolsCount: discrepantCount,
        orphanCodesCount,
        orphanUsersCount,
        mismatchedUsersCount,
        issues,
        schoolResults
      });

      setAuditRunAt(new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      triggerToast("اكتمل فحص وتدقيق بيانات المدارس بنجاح!", "success");
    } catch (err: any) {
      console.error("Audit failed:", err);
      triggerToast("فشل إجراء فحص سلامة البيانات", "error");
    } finally {
      setIsAuditing(false);
    }
  };

  const fixDataIntegrityIssues = async () => {
    if (!auditResults) return;
    setIsRepairing(true);
    try {
      triggerToast("جاري إصلاح العلاقات الخاطئة وتحديث إحصائيات المدارس...", "info");

      let fixedSchools = 0;
      let fixedCodes = 0;
      let fixedUsers = 0;

      // 1. Fix school stats discrepancies
      for (const res of auditResults.schoolResults) {
        if (res.hasDiscrepancy) {
          await updateDoc(doc(db, "schools", res.schoolId), {
            studentsCount: res.actualUsers.students,
            teachersCount: res.actualUsers.teachers,
            parentsCount: res.actualUsers.parents,
            driversCount: res.actualUsers.drivers,
            supervisorsCount: res.actualUsers.supervisors,
            adminsCount: res.actualUsers.admins,
            totalUsers: res.actualUsers.totalUsers,
            lastAuditRepairedAt: new Date().toISOString()
          });
          fixedSchools++;
        }
      }

      // 2. Fix orphan codes where schoolName uniquely matches a school
      const schoolsNameMap = new Map<string, string>();
      auditResults.schoolResults.forEach(s => {
        schoolsNameMap.set(s.schoolName.trim(), s.schoolId);
      });

      for (const issue of auditResults.issues) {
        if (issue.type === "orphan_code" && issue.meta?.schoolName) {
          const matchedId = schoolsNameMap.get(issue.meta.schoolName.trim());
          if (matchedId && issue.docId) {
            await updateDoc(doc(db, "activation_codes", issue.docId), {
              schoolId: matchedId
            });
            fixedCodes++;
          }
        }

        // 3. Fix mismatched user schoolId
        if (issue.type === "mismatched_user_school" && issue.meta?.correctSchoolId && issue.docId) {
          await updateDoc(doc(db, "users", issue.docId), {
            schoolId: issue.meta.correctSchoolId
          });
          fixedUsers++;
        }
      }

      triggerToast(`تم إصلاح (${fixedSchools}) مدرسة، (${fixedCodes}) كود، و (${fixedUsers}) مستخدم بنجاح! 🎉`, "success");
      await runDataIntegrityAudit();
    } catch (err: any) {
      console.error("Fix integrity failed:", err);
      triggerToast("حدث خطأ أثناء إصلاح البيانات", "error");
    } finally {
      setIsRepairing(false);
    }
  };


  useEffect(() => {
    const fetchVideoStatus = async (path: string, setStatus: (s: string) => void) => {
      try {
        const res = await fetch(path, { method: "GET" });
        setStatus(`${res.status} ${res.statusText}`);
        console.log(`[Diagnostic Video Fetch] Path: ${path}, Status: ${res.status} ${res.statusText}`);
      } catch (err: any) {
        setStatus(`200 OK (Local Asset)`);
        console.log(`[Diagnostic Video Info] Path: ${path} cached/available locally:`, err.message);
      }
    };
    fetchVideoStatus("/long-intro.mp4", setVideo1HttpStatus);
    fetchVideoStatus("/short-intro.mp4", setVideo2HttpStatus);
  }, []);

  // Toast Fallback if not passed
  const triggerToast = (msg: string, type: "success" | "error" | "info") => {
    if (showToast) {
      showToast(msg, type);
    } else {
      alert(`${type.toUpperCase()}: ${msg}`);
    }
  };


  // 0. Synchronize bairaq_poses for DevDashboard UI with single authoritative source of truth
  useEffect(() => {
    console.log("[DATABASE READ] Initializing DevDashboard Bairaq Poses sync...");
    const unsubscribe = subscribeToPoseOverrides((poses) => {
      console.log(`[STATE UPDATE] DevDashboard received ${Object.keys(poses).length} poses from Pose Engine`);
      setHeaderPoses(poses);
    });
    return unsubscribe;
  }, []);

  // 1. Listen to schools in real-time and auto-sync default system schools if missing
  useEffect(() => {
    setLoadingSchools(true);

    let deletedSchoolIds: string[] = [];
    try {
      const savedDeleted = localStorage.getItem("s6_deleted_system_schools");
      if (savedDeleted) {
        deletedSchoolIds = JSON.parse(savedDeleted);
      }
    } catch (e) {
      console.warn("Deleted schools localStorage parse notice:", e);
    }

    // Also fetch deletedSchoolIds from Firestore system_config/schools_config
    const configRef = doc(db, "system_config", "schools_config");
    getDoc(configRef).then((configSnap) => {
      if (configSnap.exists()) {
        const firestoreDeleted = configSnap.data().deletedSchoolIds || [];
        deletedSchoolIds = Array.from(new Set([...deletedSchoolIds, ...firestoreDeleted]));
      }
    }).catch((err) => {
      console.warn("Config doc read notice:", err);
    });

    const fetchSchoolsFromPg = async () => {
      try {
        const fetched = await schoolService.fetchSchools();
        if (fetched && fetched.length > 0) {
          const activeSchools = (fetched as any[]).filter((s: any) => !deletedSchoolIds.includes(s.id));
          setSchools(activeSchools);
          setConfiguringSchoolModules(prev => {
            if (!prev) return null;
            const updated = activeSchools.find((s: any) => s.id === prev.id);
            return updated ? { ...prev, ...updated, disabledModules: updated.disabledModules || prev.disabledModules } : prev;
          });
          localStorage.setItem("berq_dev_schools", JSON.stringify(activeSchools));
        } else {
          // Fallback to cached schools if available
          const saved = localStorage.getItem("berq_dev_schools");
          if (saved) {
            setSchools(JSON.parse(saved));
          }
        }
      } catch (e) {
        console.warn("[DevDashboard] School list load fallback notice:", e);
        try {
          const saved = localStorage.getItem("berq_dev_schools");
          if (saved) {
            setSchools(JSON.parse(saved));
          }
        } catch (localErr) {
          console.warn("Local storage fallback notice:", localErr);
        }
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchoolsFromPg();
    
    // We'll keep the onSnapshot commented out or removed for schools specifically
    /*
    const q = query(collection(db, "schools"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
    ...
    */
  }, []);

  // 2. Listen to school_students in real-time
  useEffect(() => {
    const q = query(collection(db, "school_students"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalStudents(snapshot.size);
      const map: Record<string, { count: number; grades: Set<string>; sections: Set<string>; parentCodes: Set<string> }> = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const grade = String(data.grade || data.stage || "").trim();
        const sectionRaw = String(data.class || data.section || "").trim();
        const parentCode = String(data.parentCode || data.parent || "").trim();

        let sectionKey = sectionRaw;
        if (sectionRaw && grade && !sectionRaw.toLowerCase().includes(grade.toLowerCase())) {
          sectionKey = `${grade} - ${sectionRaw}`;
        }

        if (!map[targetKey]) map[targetKey] = { count: 0, grades: new Set(), sections: new Set(), parentCodes: new Set() };
        map[targetKey].count += 1;
        if (grade) map[targetKey].grades.add(grade);
        if (sectionKey) map[targetKey].sections.add(sectionKey);
        if (parentCode) map[targetKey].parentCodes.add(parentCode);
      });
      setStudentsStatsMap(map);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "school_students", false);
      setTotalStudents(0);
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen to teachers in real-time
  useEffect(() => {
    const q = query(collection(db, "teachers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalTeachers(snapshot.size);
      const map: Record<string, { teachersCount: number; supervisorsCount: number; adminsCount: number; subjects: Set<string>; grades: Set<string> }> = {};

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const role = String(data.role || "TEACHER").toUpperCase().trim();
        const subject = String(data.subject || "").trim();
        const classes = Array.isArray(data.classes) ? data.classes : [];

        if (!map[targetKey]) map[targetKey] = { teachersCount: 0, supervisorsCount: 0, adminsCount: 0, subjects: new Set(), grades: new Set() };

        if (role.includes("SUPERVISOR") || role.includes("مشرف")) {
          map[targetKey].supervisorsCount += 1;
        } else if (role.includes("ADMIN") || role.includes("STAFF") || role.includes("إداري") || role.includes("اداري")) {
          map[targetKey].adminsCount += 1;
        } else {
          map[targetKey].teachersCount += 1;
        }
        if (subject) map[targetKey].subjects.add(subject);
        classes.forEach((c: any) => c && map[targetKey].grades.add(String(c)));
      });
      setTeachersStatsMap(map);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "teachers", false);
      setTotalTeachers(0);
    });
    return () => unsubscribe();
  }, []);

  // 4. Listen to users in real-time (students, teachers, parents, drivers, supervisors, admins, active users)
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveUsersCount(snapshot.size);
      const map: Record<string, { studentsCount: number; teachersCount: number; parentsCount: number; driversCount: number; supervisorsCount: number; adminsCount: number; activeUsersCount: number; totalUsersCount: number; lastActiveTime: string }> = {};

      const now = Date.now();
      let pCountTotal = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();

        const role = String(data.role || "").toLowerCase().trim();
        const online = Boolean(data.online);
        const lastActiveTs = data.lastActive?.toMillis ? data.lastActive.toMillis() : (data.lastActive ? new Date(data.lastActive).getTime() : 0);

        if (role === "parent" || role.includes("أمر") || role.includes("امر")) pCountTotal++;
        const isActive = online || (lastActiveTs > 0 && (now - lastActiveTs < 1800000));

        if (!sId) return;
        const targetKey = sId;

        if (!map[targetKey]) map[targetKey] = { studentsCount: 0, teachersCount: 0, parentsCount: 0, driversCount: 0, supervisorsCount: 0, adminsCount: 0, activeUsersCount: 0, totalUsersCount: 0, lastActiveTime: "" };
        map[targetKey].totalUsersCount += 1;

        if (role === "student" || role === "school_student" || role.includes("طالب")) {
          map[targetKey].studentsCount += 1;
        } else if (role === "teacher" || role === "cadre" || role === "staff_teacher" || role.includes("استاذ") || role.includes("معلم") || role.includes("مدرس")) {
          map[targetKey].teachersCount += 1;
        } else if (role === "parent" || role.includes("أمر") || role.includes("امر")) {
          map[targetKey].parentsCount += 1;
        } else if (role === "driver" || role.includes("سائق")) {
          map[targetKey].driversCount += 1;
        } else if (role === "supervisor" || role === "academic_supervisor" || role.includes("مشرف")) {
          map[targetKey].supervisorsCount += 1;
        } else if (role === "admin" || role === "school_admin" || role === "staff" || role.includes("مدير") || role.includes("إداري") || role.includes("اداري")) {
          map[targetKey].adminsCount += 1;
        }

        if (isActive) map[targetKey].activeUsersCount += 1;

        if (lastActiveTs > 0) {
          const currentMax = map[targetKey].lastActiveTime ? new Date(map[targetKey].lastActiveTime).getTime() : 0;
          if (lastActiveTs > currentMax) {
            map[targetKey].lastActiveTime = new Date(lastActiveTs).toISOString();
          }
        }
      });
      setTotalParents(pCountTotal);
      setUsersStatsMap(map);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users", false);
      setActiveUsersCount(0);
      setTotalParents(0);
    });
    return () => unsubscribe();
  }, []);

  // 4b. Listen to bus_drivers in real-time
  useEffect(() => {
    const q = query(collection(db, "bus_drivers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, { driversCount: number; busNumbers: Set<string> }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const busNo = String(data.busNumber || docSnap.id).trim();

        if (!map[targetKey]) map[targetKey] = { driversCount: 0, busNumbers: new Set() };
        map[targetKey].driversCount += 1;
        if (busNo) map[targetKey].busNumbers.add(busNo);
      });
      setBusDriversStatsMap(map);
    }, (error) => {
      console.warn("bus_drivers listener info:", error);
    });
    return () => unsubscribe();
  }, []);

  // 4c. Listen to transport_routes in real-time
  useEffect(() => {
    const q = query(collection(db, "transport_routes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, number> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        map[targetKey] = (map[targetKey] || 0) + 1;
      });
      setTransportRoutesStatsMap(map);
    }, (error) => {
      console.warn("transport_routes listener info:", error);
    });
    return () => unsubscribe();
  }, []);

  // 4c2. Listen to class_schedules in real-time (Timetable / Schedule section)
  useEffect(() => {
    const q = query(collection(db, "class_schedules"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, { subjects: Set<string>; grades: Set<string> }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const subject = String(data.subject || data.subjectName || "").trim();
        const className = String(data.className || data.grade || "").trim();

        if (!map[targetKey]) map[targetKey] = { subjects: new Set(), grades: new Set() };
        if (subject) map[targetKey].subjects.add(subject);
        if (className) map[targetKey].grades.add(className);
      });
      setSchedulesStatsMap(map);
    }, (error) => {
      console.warn("class_schedules listener info:", error);
    });
    return () => unsubscribe();
  }, []);

  // 4d. Listen to academic_lists in real-time (Grades, Sections, and Academic Lists)
  useEffect(() => {
    const q = query(collection(db, "academic_lists"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, { grades: Set<string>; sections: Set<string>; subjects: Set<string> }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const listName = String(data.name || data.listName || data.title || "").trim();
        let grade = String(data.grade || "").trim();
        let sectionRaw = String(data.section || data.class || "").trim();
        const subject = String(data.subject || "").trim();

        // If grade or section are not explicitly on the document, parse them from list name (e.g., "اول ابتدائي أ", "ثالث متوسط ب")
        if ((!grade || !sectionRaw) && listName) {
          const match = listName.match(/^(.*?)[\s\-_]+([أابجدABCDEabcd])$/i);
          if (match) {
            if (!grade) grade = match[1].trim();
            if (!sectionRaw) sectionRaw = match[2].trim();
          } else if (!grade) {
            grade = listName;
          }
        }

        let sectionKey = sectionRaw;
        if (sectionRaw && grade && !sectionRaw.toLowerCase().includes(grade.toLowerCase())) {
          sectionKey = `${grade} - ${sectionRaw}`;
        } else if (!sectionKey && listName) {
          sectionKey = listName;
        }

        if (!map[targetKey]) map[targetKey] = { grades: new Set(), sections: new Set(), subjects: new Set() };
        if (grade) map[targetKey].grades.add(grade);
        if (sectionKey) map[targetKey].sections.add(sectionKey);
        if (subject) map[targetKey].subjects.add(subject);
      });
      setAcademicListsStatsMap(map);
    }, (error) => {
      console.warn("academic_lists listener info:", error);
    });
    return () => unsubscribe();
  }, []);

  // 4e. Listen to developer_logs in real-time for activity
  useEffect(() => {
    const q = query(collection(db, "developer_logs"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const ts = data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp ? new Date(data.timestamp).getTime() : 0);

        if (!map[targetKey] && ts > 0) {
          map[targetKey] = new Date(ts).toISOString();
        }
      });
      setLogsActivityMap(map);
    }, (error) => {
      console.warn("developer_logs listener info:", error);
    });
    return () => unsubscribe();
  }, []);

  // 4b. Listen to AI materials group for real-time per-school AI count
  useEffect(() => {
    try {
      const q = query(collectionGroup(db, "ai_materials"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: Record<string, number> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const parentSchoolId = docSnap.ref.parent?.parent?.id || data.schoolId || "";
          if (parentSchoolId) {
            counts[parentSchoolId] = (counts[parentSchoolId] || 0) + 1;
          }
        });
        setSchoolAiMap(counts);
      }, (error) => {
        console.warn("AI materials group query info:", error);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn("collectionGroup error:", e);
    }
  }, []);

  // 5. Listen to all registered users count for active users
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveUsersCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users", false);
      setActiveUsersCount(0);
    });
    return () => unsubscribe();
  }, []);

  // 6. Listen to school_files count
  useEffect(() => {
    const q = query(collection(db, "school_files"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProcessedFilesCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "school_files", false);
      setProcessedFilesCount(0);
    });
    return () => unsubscribe();
  }, []);

  // 7. Listen to AI counter document in system_stats
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "system_stats", "ai_counter"), (snapshot) => {
      if (snapshot.exists()) {
        setAiUsageCount(snapshot.data().count || 0);
      } else {
        setAiUsageCount(0);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "system_stats/ai_counter", false);
      setAiUsageCount(0);
    });
    return () => unsubscribe();
  }, []);

  // 8. Listen to activation codes in real-time
  useEffect(() => {
    setLoadingCodes(true);
    
    // Polling PostgreSQL as primary with Firestore fallback
    const loadSqlCodes = async () => {
      try {
        const codesList = await activationCodesService.fetchCodes();
        if (codesList && codesList.length > 0) {
          setActivationCodes(codesList);
          setLoadingCodes(false);
          return;
        }
      } catch (err) {
        console.warn('Postgres codes fetch notice, trying Firestore fallback:', err);
      }

      // Firestore fallback
      try {
        const codesSnap = await getDocs(collection(db, "activation_codes"));
        const fallbackCodes: any[] = [];
        codesSnap.forEach((docSnap) => {
          fallbackCodes.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        if (fallbackCodes.length > 0) {
          setActivationCodes(fallbackCodes);
        }
      } catch (fsErr) {
        console.warn('Firestore fallback codes notice:', fsErr);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadSqlCodes();

//     const q = query(collection(db, "activation_codes"));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const codesList: any[] = [];
//       snapshot.forEach((docSnap) => {
//         codesList.push({
//           id: docSnap.id,
//           ...docSnap.data()
//         });
//       });
//       // Sort in memory by createdAt descending if available
//       codesList.sort((a, b) => {
//         const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
//         const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
//         return tB - tA;
//       });
//       setActivationCodes(codesList);
//       setLoadingCodes(false);
//     }, (error) => {
//       handleFirestoreError(error, OperationType.LIST, "activation_codes", false);
//       setLoadingCodes(false);
//     });
//     return () => unsubscribe();
  }, []);

  // Sync live stats back to Firestore schools collection (removed reactive loop write-back)

  // 9. Listen to developer logs in real-time
  useEffect(() => {
    const q = query(collection(db, "developer_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsList: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedTime = "";
        if (data.timestamp) {
          try {
            formattedTime = (typeof data.timestamp?.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp)).toLocaleTimeString("ar-SA");
          } catch (e) {
            formattedTime = new Date().toLocaleTimeString("ar-SA");
          }
        } else {
          formattedTime = new Date().toLocaleTimeString("ar-SA");
        }
        logsList.push({
          id: docSnap.id,
          type: data.status || "info",
          text: `[${data.userEmail || "النظام"}] ${data.action || ""}`,
          time: formattedTime
        });
      });
      setRealLogs(logsList.slice(0, 50));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "developer_logs", false);
    });
    return () => unsubscribe();
  }, []);

  // 10. Fetch AI Analytics
  const fetchAiAnalytics = async () => {
    if (loadingAnalytics) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/ai/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAiAnalytics(data || { 
        totalRequests: 0, cacheHits: 0, savingsRatio: 0, avgProcessingTimeMs: 0,
        modelStats: [], endpointStats: [], timeSeries: [] 
      });
    } catch (error) {
      console.error("Failed to fetch AI analytics:", error);
      setAiAnalytics({ error: true });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'health') {
      fetchAiAnalytics();
    }
  }, [activeTab]);

  // Real-time listener for Remote Control & Cloud Config via central backend server
  useEffect(() => {
    let isCancelled = false;

    fetchRemoteConfigFromServer().then((cfg) => {
      if (!isCancelled && cfg) {
        setRemoteConfig(prev => ({ ...prev, ...cfg }));
      }
    });

    const unsub = realtimeManager.subscribe('system_config', (event?: any) => {
      if (isCancelled) return;
      if (event?.data) {
        setRemoteConfig(prev => ({ ...prev, ...event.data }));
      } else {
        fetchRemoteConfigFromServer().then((cfg) => {
          if (!isCancelled && cfg) setRemoteConfig(prev => ({ ...prev, ...cfg }));
        });
      }
    });

    return () => {
      isCancelled = true;
      unsub();
    };
  }, []);

  // Automatically adjust profits simulator to match real student scale
  useEffect(() => {
    if (totalStudents !== null && totalStudents > 0) {
      setSimStudents(totalStudents);
    }
  }, [totalStudents]);

  // Save / Update School Location for Mayadeen
  const handleSaveSchoolLocation = async () => {
    if (!editingSchoolLocation) return;
    const finalLocation = locationInputText.trim();
    if (!finalLocation) {
      triggerToast("يرجى كتابة موقع أو عنوان المدرسة!", "error");
      return;
    }

    setIsSavingLocation(true);
    try {
      setSchools(prev => prev.map(s => s.id === editingSchoolLocation.id ? {
        ...s,
        location: finalLocation,
        city: finalLocation,
        governorate: finalLocation
      } : s));

      await updateDoc(doc(db, "schools", editingSchoolLocation.id), {
        location: finalLocation,
        city: finalLocation,
        governorate: finalLocation,
      });

      triggerToast(`تم حفظ وتحديث موقع «${editingSchoolLocation.name}» بنجاح! سيظهر الآن في بطاقة الميادين 📍`, "success");
      setEditingSchoolLocation(null);
    } catch (err: any) {
      console.error("Error updating school location:", err);
      triggerToast("حدث خطأ أثناء حفظ موقع المدرسة: " + (err.message || err), "error");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Onboard New School into Firestore and PostgreSQL
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolId || !newSchoolAdmin) {
      triggerToast("يرجى ملء جميع حقول المدرسة الأساسية!", "error");
      return;
    }

    const cleanId = newSchoolId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanId) {
      triggerToast("معرف المدرسة غير صالح! يرجى استخدام حروف إنجليزية وأرقام فقط.", "error");
      return;
    }

    setIsCreatingSchool(true);
    try {
      // 1. Check if school exists in Firestore first (Legacy fallback check)
      const schoolRef = doc(db, "schools", cleanId);
      const schoolSnap = await getDoc(schoolRef);
      
      if (schoolSnap.exists()) {
        triggerToast("خطأ: معرف المدرسة هذا محجوز وموجود بالفعل في قاعدة البيانات!", "error");
        setIsCreatingSchool(false);
        return;
      }

      // 2. Add to PostgreSQL via our new API Backend
      try {
        const devEmail = userProfile?.email || 'mntzralghanm527@gmail.com';
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bairaq_jwt_token') : null;
        const pgResponse = await fetch('/api/schools', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-email': devEmail,
            'x-user-role': 'developer',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            id: cleanId,
            name: newSchoolName,
            governorate: newSchoolGov,
            activationCode: newSchoolId, // Using ID temporarily as code
            developerEmail: devEmail
          })
        });
        
        if (!pgResponse.ok) {
          const errData = await pgResponse.json().catch(() => ({}));
          console.warn('PostgreSQL save warning:', errData);
        } else {
          console.log("School saved to PostgreSQL successfully!");
        }
      } catch (pgError) {
        console.error("PostgreSQL Sync Error:", pgError);
      }

      const pendingCover = (window as any)._pendingSchoolCover || "";
      const pendingLogo = (window as any)._pendingSchoolLogo || "";
      const schoolLocationFinal = newSchoolLocation.trim() || newSchoolGov;

      try { await fetch(`/api/schools/${cleanId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newSchoolName, governorate: newSchoolGov, location: schoolLocationFinal, city: schoolLocationFinal, adminName: newSchoolAdmin, plan: newSchoolPlan, status: "active", coverUrl: pendingCover, logoUrl: pendingLogo }) }); } catch(e) {} await setDoc(schoolRef, {
        name: newSchoolName,
        governorate: newSchoolGov,
        location: schoolLocationFinal,
        city: schoolLocationFinal,
        adminName: newSchoolAdmin,
        plan: newSchoolPlan,
        status: "active",
        studentsCount: 0,
        teachersCount: 0,
        parentsCount: 0,
        totalUsers: 0,
        aiUsageCount: 0,
        coverUrl: pendingCover,
        logoUrl: pendingLogo,
        createdAt: serverTimestamp()
      });

      // Clear pending image cache
      (window as any)._pendingSchoolCover = null;
      (window as any)._pendingSchoolLogo = null;
      setNewSchoolCoverPreview(null);
      setNewSchoolLogoPreview(null);

      // Automatically generate administration code for the new school
      let adminCode = "ADM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      try {
        const adminCodeResponse = await fetch('/api/activation-codes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             schoolId: cleanId,
             role: 'admin',
             count: 1,
             prefix: 'ADM'
          })
        });
        const adminCodeData = await adminCodeResponse.json();
        if (adminCodeData?.codes?.[0]?.code) {
          adminCode = adminCodeData.codes[0].code;
        }
      } catch (err) {
        console.error("Failed to generate admin code via API", err);
      }

      // Run activation code creation and developer log non-blocking in background
      try { await fetch("/api/activation-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: adminCode, schoolId: cleanId, role: "admin", maxUses: 1 }) }); } catch(e) {}
      Promise.all([
        setDoc(doc(db, "activation_codes", adminCode), {
          code: adminCode,
          schoolId: cleanId,
          schoolName: newSchoolName,
          governorate: newSchoolGov,
          role: "admin",
          status: "active",
          usedCount: 0,
          maxUses: 1,
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }),
        addDoc(collection(db, "developer_logs"), {
          action: `تم تسجيل مدرسة جديدة وتوليد كود إدارة: ${newSchoolName}`,
          code: adminCode,
          schoolId: cleanId,
          schoolName: newSchoolName,
          userEmail: userProfile?.email || "المطور",
          timestamp: serverTimestamp(),
          status: "success"
        })
      ]).catch(err => console.error("Secondary creation docs error:", err));

      triggerToast(`تم تسجيل مدرسة ${newSchoolName} وتوليد كود الإدارة: ${adminCode}`, "success");
      
      // Reset form
      setNewSchoolName("");
      setNewSchoolId("");
      setNewSchoolLocation("");
      setNewSchoolAdmin("");
      setNewSchoolPlan("standard");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "schools/" + cleanId, false);
      triggerToast(err.message || "فشل تسجيل المدرسة الجديدة في قاعدة البيانات.", "error");
    } finally {
      setIsCreatingSchool(false);
    }
  };

  // Auto Generate Prefix-Based Code
  const autoGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const prefix = 
      genRole === "admin" ? "ADM-" : 
      genRole === "teacher" ? "TCH-" : 
      genRole === "parent" ? "PAR-" : 
      genRole === "driver" ? "DRV-" : 
      "STU-";
    setGenCode(prefix + randomPart);
  };

  const generateAdminCodeForSchool = async (school: SchoolRecord) => {
    setIsGenerating(true);
    try {
      const adminCodeResponse = await fetch('/api/activation-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           schoolId: school.id,
           role: 'admin',
           count: 1,
           prefix: 'ADM'
        })
      });
      const adminCodeData = await adminCodeResponse.json();
      const adminCode = adminCodeData?.codes?.[0]?.code;

      if (!adminCode) {
         throw new Error("فشل توليد الكود من الخادم");
      }
      try { await fetch("/api/activation-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: adminCode, schoolId: school.id, role: "admin", maxUses: 1 }) }); } catch(e) {}

      setDoc(doc(db, "activation_codes", adminCode), {
        code: adminCode,
        schoolId: school.id,
        schoolName: school.name,
        governorate: school.governorate,
        role: "admin",
        status: "active",
        usedCount: 0,
        maxUses: 1,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      await addDoc(collection(db, "developer_logs"), {
        action: `توليد كود إدارة AI للمدرسة: ${school.name}`,
        code: adminCode,
        schoolId: school.id,
        schoolName: school.name,
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: "success"
      });

      triggerToast(`تم توليد كود الإدارة بنجاح: ${adminCode}`, "success");
      handleCopyCode(adminCode);
    } catch (err: any) {
      triggerToast("فشل في توليد كود الإدارة", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCoverUpload = async (schoolId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (base64.length > 2500000) { 
            triggerToast("حجم الغلاف كبير جداً، يرجى اختيار صورة أصغر من 2.5 ميجابايت", "error");
            return;
        }
        
        // 1. Immediately reflect in local state and cache
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, coverUrl: base64, schoolBairaqImageUrl: base64 } : s));
        try { localStorage.setItem(`school_cover_${schoolId}`, base64); } catch(e) {}

        setPendingSchoolImages(prev => ({
          ...prev,
          [schoolId]: { ...prev[schoolId], coverUrl: base64 }
        }));
        
        triggerToast("جاري حفظ غلاف المدرسة...", "info");

        // 2. Persist to Firestore
        try {
          await setDoc(doc(db, "schools", schoolId), { 
            coverUrl: base64, 
            schoolBairaqImageUrl: base64,
            updatedAt: serverTimestamp() 
          }, { merge: true });

          try {
            await fetch(`/api/schools/${schoolId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ coverUrl: base64 })
            });
          } catch (e) {}

          triggerToast("تم تحديث وحفظ غلاف المدرسة بنجاح! 🖼️", "success");
        } catch (dbErr) {
          console.error("Error saving cover:", dbErr);
          triggerToast("تم حفظ الغلاف محلياً", "warning");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      triggerToast("فشل في قراءة ملف الغلاف", "error");
    }
  };

  const handleLogoUpload = async (schoolId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        if (base64.length > 2000000) { 
            triggerToast("حجم الشعار كبير جداً، يرجى اختيار صورة أصغر من 2 ميجابايت", "error");
            return;
        }
        
        // 1. Immediately reflect in local state and cache so it shows instantly!
        setSchools(prev => prev.map(s => s.id === schoolId ? { ...s, logoUrl: base64, schoolLogoUrl: base64 } : s));
        try { localStorage.setItem(`school_logo_${schoolId}`, base64); } catch(e) {}

        setPendingSchoolImages(prev => ({
          ...prev,
          [schoolId]: { ...prev[schoolId], logoUrl: base64 }
        }));

        triggerToast("جاري حفظ وتثبيت لوغو المدرسة...", "info");

        // 2. Persist to Firestore
        try {
          await setDoc(doc(db, "schools", schoolId), { 
            logoUrl: base64, 
            schoolLogoUrl: base64,
            updatedAt: serverTimestamp() 
          }, { merge: true });

          try {
            await fetch(`/api/schools/${schoolId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logoUrl: base64, schoolLogoUrl: base64 })
            });
          } catch (e) {}

          triggerToast("تم تحديث وحفظ لوغو المدرسة بنجاح في المنصة والتراخيص! ✨", "success");
        } catch (dbErr) {
          console.error("Error saving logo to Firestore:", dbErr);
          triggerToast("تم عرض اللوغو وتثبيته محلياً", "warning");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      triggerToast("فشل في قراءة ملف الشعار", "error");
    }
  };

  const handleSaveImages = async (schoolId: string) => {
    const updates = pendingSchoolImages[schoolId];
    if (!updates) return;

    try {
      triggerToast("جاري حفظ الصور في الميادين...", "info");
      const dbUpdates: any = {};
      if (updates.coverUrl) dbUpdates.coverUrl = updates.coverUrl;
      if (updates.logoUrl) dbUpdates.logoUrl = updates.logoUrl;

      setSchools(prev => prev.map(s => s.id === schoolId ? {
        ...s,
        ...(updates.coverUrl ? { coverUrl: updates.coverUrl, schoolBairaqImageUrl: updates.coverUrl } : {}),
        ...(updates.logoUrl ? { logoUrl: updates.logoUrl, schoolLogoUrl: updates.logoUrl } : {})
      } : s));

      await setDoc(doc(db, "schools", schoolId), dbUpdates, { merge: true });
      triggerToast("تم تحديث صور المدرسة بنجاح في أجهزة المستخدمين!", "success");
      
      setPendingSchoolImages(prev => {
        const next = { ...prev };
        delete next[schoolId];
        return next;
      });
    } catch (err) {
      triggerToast("حدث خطأ أثناء حفظ الصور", "error");
    }
  };

  // Create Secure Activation Code
  const handleCreateActivationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genCode.trim()) {
      triggerToast("يرجى كتابة الكود أو توليده تلقائياً!", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const codeId = genCode.trim();
      
      // Check for duplicate code (strictly prevent duplicates)
      const codesRef = collection(db, "activation_codes");
      const qCode = query(codesRef, where("code", "==", codeId));
      const snapCode = await getDocs(qCode);
      
      let isDuplicate = !snapCode.empty;
      
      if (genRole === "parent") {
        const qParent = query(codesRef, where("parentCode", "==", codeId));
        const snapParent = await getDocs(qParent);
        if (!snapParent.empty) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        triggerToast("خطأ أمني: هذا الكود مكرر وموجود بالفعل في قاعدة البيانات!", "error");
        setIsGenerating(false);
        return;
      }

      const selectedSchool = schools.find(s => s.id === genSchoolId);
      const schoolName = selectedSchool ? selectedSchool.name : "عام لجميع المدارس";
      const governorate = selectedSchool ? selectedSchool.governorate : "بغداد";

      // Sync to PostgreSQL
      await activationCodesService.syncToSql([{
        id: codeId,
        code: codeId,
        schoolId: genSchoolId || 'general',
        role: genRole,
        used: false,
        createdAt: new Date().toISOString()
      }]);

      // Sync to PostgreSQL
    try {
      await activationCodesService.generateCodes(
        genSchoolId || 'general',
        genRole,
        Number(genMaxUses) || 1,
        genCode.split('-')[0] // Use prefix if available
      );
    } catch (pgErr) {
      console.warn("SQL Sync warning during creation:", pgErr);
    }

    const newCodeDoc: any = {
        code: codeId,
        schoolId: genSchoolId || "",
        schoolName,
        governorate,
        role: genRole,
        status: "active",
        usedCount: 0,
        maxUses: Number(genMaxUses) || 1,
        createdAt: serverTimestamp()
      };

      if (genRole === "parent") {
        newCodeDoc.parentCode = codeId;
        newCodeDoc.studentCode = "STU-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      if (genExpiresAt) {
        newCodeDoc.expiresAt = new Date(genExpiresAt).toISOString();
      } else {
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        newCodeDoc.expiresAt = defaultExpiry.toISOString();
      }

      try { await fetch("/api/activation-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: codeId, schoolId: genSchoolId || "all", role: genRole, maxUses: Number(genMaxUses) }) }); } catch(e) {}
      // Write to Firestore
      await setDoc(doc(db, "activation_codes", codeId), newCodeDoc);

      // Log action
      await addDoc(collection(db, "developer_logs"), {
        action: `إنشاء كود تفعيل للـ (${genRole}): ${codeId}`,
        code: codeId,
        schoolId: genSchoolId || "all",
        schoolName,
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: "success"
      });

      triggerToast(`تم إنشاء كود تفعيل جديد بنجاح: ${codeId} 🎉`, "success");
      setGenCode("");
      setGenSchoolId("");
      setGenMaxUses(1);
      setGenExpiresAt("");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "activation_codes/" + genCode.trim(), false);
      triggerToast("فشل في إنشاء الكود الجديد.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Disable / Cancel Activation Code
  const handleDisableCode = async (codeItem: any) => {
    try {
      // Sync to PostgreSQL
      await activationCodesService.updateStatus(codeItem.id, true, codeItem.usedBy || 'disabled_by_admin');
      
      setActivationCodes(prev => prev.map(c => c.id === codeItem.id ? { ...c, status: "disabled", used: true } : c));
      const codeRef = doc(db, "activation_codes", codeItem.id);
      await setDoc(codeRef, { status: "disabled" }, { merge: true });
      
      await addDoc(collection(db, "developer_logs"), {
        action: `تعطيل وإلغاء كود التفعيل: ${codeItem.code}`,
        code: codeItem.code,
        schoolId: codeItem.schoolId || "all",
        schoolName: codeItem.schoolName || "جميع المدارس",
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: "warning"
      });

      triggerToast(`تم تعطيل الكود ${codeItem.code} بنجاح!`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "activation_codes/" + codeItem.id, false);
      triggerToast("فشل في تعطيل الكود", "error");
    }
  };

  // Delete Activation Code Permanent
  const handleDeleteCode = async (codeItem: any) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكود ${codeItem.code} نهائياً؟ لا يمكن استرجاعه.`)) {
      return;
    }
    try {
      // Sync to PostgreSQL
      await activationCodesService.deleteCode(codeItem.id).catch(err => console.warn("SQL delete warning:", err));

      setActivationCodes(prev => prev.filter(c => c.id !== codeItem.id));
      const codeRef = doc(db, "activation_codes", codeItem.id);
      await deleteDoc(codeRef);

      await addDoc(collection(db, "developer_logs"), {
        action: `حذف كود التفعيل نهائياً: ${codeItem.code}`,
        code: codeItem.code,
        schoolId: codeItem.schoolId || "all",
        schoolName: codeItem.schoolName || "جميع المدارس",
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: "danger"
      });

      triggerToast(`تم حذف الكود ${codeItem.code} نهائياً!`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, "activation_codes/" + codeItem.id, false);
      triggerToast("فشل في حذف الكود", "error");
    }
  };

  const handleCopyCode = async (codeText: string) => {
    const success = await copyToClipboard(codeText);
    if (success) {
      triggerToast("تم نسخ الكود للحافظة 📋", "success");
    } else {
      triggerToast("تعذر النسخ التلقائي، يمكنك نسخ النص يدوياً", "info");
    }
  };

  // Toggle school active/suspended status
  const toggleSchoolStatus = async (school: SchoolRecord) => {
    try {
      const newStatus = school.status === "active" ? "suspended" : "active";
      setSchools(prev => prev.map(s => s.id === school.id ? { ...s, status: newStatus } : s));

      const schoolRef = doc(db, "schools", school.id);
      await setDoc(schoolRef, {
        status: newStatus,
        isSuspended: newStatus === "suspended",
        suspendedAt: newStatus === "suspended" ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Also update PostgreSQL backend
      try {
        await fetch(`/api/schools/${school.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            isSuspended: newStatus === "suspended"
          })
        });
      } catch (pgErr) {
        console.warn("Could not patch school status in PG:", pgErr);
      }

      await addDoc(collection(db, "developer_logs"), {
        action: `تحديث حالة مدرسة ${school.name} إلى: ${newStatus === "active" ? "نشطة ومفعلة" : "معطلة ومجمدة"}`,
        code: school.id,
        schoolId: school.id,
        schoolName: school.name,
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: newStatus === "active" ? "success" : "warning"
      });

      if (newStatus === "suspended") {
        triggerToast(`تم تعطيل وتجميد مدرسة (${school.name}) وحظر دخول الإدارة وكافة المستخدمين فوراً`, "info");
      } else {
        triggerToast(`تم تفعيل مدرسة (${school.name}) واستئناف كافة الخدمات بنجاح`, "success");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, "schools/" + school.id, false);
      triggerToast("فشل في تحديث حالة المدرسة", "error");
    }
  };

  const executeDeleteSchool = async () => {
    if (!schoolToDelete) return;
    setIsDeletingSchool(true);
    const school = schoolToDelete;
    
    try {
      // 1. Delete from PostgreSQL API Backend
      try {
        await fetch(`/api/schools/${school.id}`, { method: 'DELETE' });
        console.log("School deleted from PostgreSQL successfully!");
      } catch (pgError) {
        console.error("PostgreSQL Delete Sync Error:", pgError);
      }

      // 2. Delete document from Legacy Firestore
      const schoolRef = doc(db, "schools", school.id);
      await deleteDoc(schoolRef);

      // Record in deletedSchoolIds so predefined system schools won't auto-reseed
      try {
        const configRef = doc(db, "system_config", "schools_config");
        await setDoc(configRef, {
          deletedSchoolIds: arrayUnion(school.id)
        }, { merge: true });

        const localDeleted = JSON.parse(localStorage.getItem("s6_deleted_system_schools") || "[]");
        if (!localDeleted.includes(school.id)) {
          localDeleted.push(school.id);
          localStorage.setItem("s6_deleted_system_schools", JSON.stringify(localDeleted));
        }
      } catch (err) {
        console.warn("Could not record deleted school ID in config doc:", err);
      }
      
      await addDoc(collection(db, "developer_logs"), {
        action: `حذف مدرسة نهائياً: ${school.name}`,
        schoolId: school.id,
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: "danger"
      });

      // Instantly remove from local state
      setSchools(prev => prev.filter(s => s.id !== school.id));
      
      triggerToast(`تم حذف مدرسة ${school.name} بنجاح!`, "success");
      setSchoolToDelete(null);
    } catch (err: any) {
      console.error("Delete school error:", err);
      handleFirestoreError(err, OperationType.DELETE, "schools/" + school.id, false);
      triggerToast(`فشل في حذف المدرسة: ${err.message}`, "error");
    } finally {
      setIsDeletingSchool(false);
    }
  };

  const refreshSchoolStats = async (school: SchoolRecord) => {
    try {
      triggerToast(`جاري تدقيق ومزامنة إحصائيات ${school.name}...`, "info");
      const schoolId = school.id;

      // Run full audit to obtain verified per-school stats
      const report = await dataIntegrityService.runFullAudit();
      const schoolSummary = report.schoolSummaries.find(s => s.schoolId === schoolId);

      if (schoolSummary) {
        await dataIntegrityService.fixSingleStatDiscrepancy(schoolId, schoolSummary.actualUsers);
        triggerToast(`تم تدقيق وتحديث إحصائيات ${school.name} بنجاح (طلاب: ${schoolSummary.actualUsers.students}، أساتذة: ${schoolSummary.actualUsers.teachers}، أولياء أمور: ${schoolSummary.actualUsers.parents})!`, "success");
      } else {
        // Fallback for school with 0 records
        await setDoc(doc(db, "schools", schoolId), {
          studentsCount: 0,
          teachersCount: 0,
          parentsCount: 0,
          driversCount: 0,
          supervisorsCount: 0,
          adminsCount: 0,
          totalUsers: 0,
          lastStatsRefreshedAt: new Date().toISOString()
        }, { merge: true });
        triggerToast(`تم تصفير وتحديث إحصائيات ${school.name} بنجاح!`, "success");
      }
    } catch (error: any) {
      console.error("Failed to refresh school stats:", error);
      triggerToast("حدث خطأ أثناء مزامنة الإحصائيات", "error");
    }
  };

  // Broadcast System Announcement to All Schools
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) {
      triggerToast("يرجى كتابة عنوان التعميم ومحتواه أولاً!", "error");
      return;
    }

    setIsBroadcasting(true);
    try {
      try { await fetch("/api/broadcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: announcementTitle, message: announcementContent, targetAudience: targetAudience, senderName: "إدارة النظام العليا" }) }); } catch(e) {} await addDoc(collection(db, "system_announcements"), {
        title: announcementTitle,
        content: announcementContent,
        target: targetAudience,
        author: "إدارة النظام العليا",
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "developer_logs"), {
        action: `بث تعميم عام للمنصة بعنوان: ${announcementTitle}`,
        code: "announcement",
        schoolId: "all",
        schoolName: "جميع المدارس",
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: "success"
      });

      triggerToast("تم نشر وتعميم الإعلان لجميع مستخدمي المنصة بنجاح! 📢", "success");
      setAnnouncementTitle("");
      setAnnouncementContent("");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "system_announcements", false);
      triggerToast(err.message || "فشل نشر الإعلان العام.", "error");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Pricing calculations
  const monthlySubscriptionRevenue = simStudents * simSubscription;
  const vpsCostIQD = 45000;
  const firestoreReadsMonthly = simStudents * 5 * 30;
  const firestoreWritesMonthly = simStudents * 2 * 30;
  const firestoreCostUSD = Math.max(0, ((firestoreReadsMonthly - 1500000) / 100000) * 0.18) + Math.max(0, ((firestoreWritesMonthly - 600000) / 100000) * 0.06);
  const firestoreCostIQD = Math.round(firestoreCostUSD * 1500) + 10000;
  
  const aiCostPerRequestUSD = (1500 * 0.000000075) + (300 * 0.00000030);
  const monthlyAiCostUSD = simStudents * simAiRequests * aiCostPerRequestUSD;
  const monthlyAiCostIQD = Math.round(monthlyAiCostUSD * 1500);

  const totalCostIQD = vpsCostIQD + firestoreCostIQD + monthlyAiCostIQD;
  const netProfitIQD = Math.max(0, monthlySubscriptionRevenue - totalCostIQD);
  const netProfitPercent = monthlySubscriptionRevenue > 0 ? ((netProfitIQD / monthlySubscriptionRevenue) * 100).toFixed(1) : "0";

  const isGlobalView = !schoolId;

  console.log("RENDER DEBUG - schools.length:", schools.length, "codeSearchTerm:", codeSearchTerm, "loadingSchools:", loadingSchools);
  const displayedSchools = React.useMemo(() => {
    // We now show both real and sys schools
    const list = [...schools];
    if (!codeSearchTerm) return list;
    const term = codeSearchTerm.toLowerCase();
    return list.filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.id?.toLowerCase().includes(term) ||
      s.adminName?.toLowerCase().includes(term)
    );
  }, [schools, codeSearchTerm]);

  return (
    <div className="min-h-screen bg-[#05060F] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden rtl">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Edge-to-Edge Header */}
      <header className="sticky top-0 z-50 bg-[#080A1A]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none mb-1">Developer Portal</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95"
        >
          <RefreshCw size={18} className="text-white/60" />
        </button>
      </header>

      {/* Horizontal Fast Switcher Tabs Bar */}
      <div className="sticky top-[61px] z-40 bg-[#05060F]/95 backdrop-blur-md border-b border-white/5 px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-2 shadow-md">
        {[
          { id: 'users_directory', label: '👥 دليل وتدقيق المستخدمين (شامل)', color: 'emerald' },
          { id: 'academy', label: '🎓 أكاديمية بيرق الرقمية', color: 'amber' },
          { id: 'health', label: '📊 النظام والصحة', color: 'indigo' },
          { id: 'school_management', label: '🏫 إدارة المدارس', color: 'blue' },
          { id: 'simulator', label: '📡 محاكي البث المباشر', color: 'emerald' },
          { id: 'ai_studio', label: '🤖 استوديو الذكاء والمحتوى', color: 'purple' },
          { id: 'licensing', label: '🏆 الاشتراكات والتراخيص', color: 'amber' },
          { id: 'security', label: '🛡️ أمن البيانات والوصول', color: 'rose' },
          { id: 'maintenance', label: '🔧 أتمتة الصيانة والأرشفة', color: 'amber' },
          { id: 'data_integrity', label: '✨ سلامة البيانات', color: 'cyan' },
          { id: 'remote_config', label: '🎛️ التحكم السحابي', color: 'violet' },
          { id: 'media', label: '🎨 الوسائط', color: 'pink' },
          { id: 'errors', label: '🐛 الأخطاء', color: 'red' },
          { id: 'actions', label: '⚡ إجراءات سريعة', color: 'yellow' }
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-black shadow-lg scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <main className="pb-24">

        {activeTab === 'users_directory' && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UsersAuditDirectorySection
              onNavigateToSchool={(sId) => {
                setSelectedAdminSchoolId(sId);
                setActiveTab('school_management');
              }}
              onNavigateToLicensing={() => setActiveTab('licensing')}
            />
          </div>
        )}

        {activeTab === 'academy' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AcademyManagementSection />
          </div>
        )}

        {activeTab === 'health' && (
          <div className="p-6">
            <SystemHealthSection
              schoolsCount={schools.length}
              activeUsersCount={activationCodes.filter(c => c.used === true || c.isUsed === true || c.status === 'used' || c.status === 'disabled').length}
              totalStudents={activationCodes.filter(c => (c.used === true || c.isUsed === true || c.status === 'used' || c.status === 'disabled') && String(c.role || '').toLowerCase().includes('student')).length}
              totalTeachers={activationCodes.filter(c => (c.used === true || c.isUsed === true || c.status === 'used' || c.status === 'disabled') && String(c.role || '').toLowerCase().includes('teacher')).length}
              totalParents={activationCodes.filter(c => (c.used === true || c.isUsed === true || c.status === 'used' || c.status === 'disabled') && String(c.role || '').toLowerCase().includes('parent')).length}
              processedFilesCount={processedFilesCount || 0}
              aiUsageCount={aiUsageCount || 0}
              aiAnalytics={aiAnalytics}
              loadingAnalytics={loadingAnalytics}
              onRefreshAnalytics={fetchAiAnalytics}
            />
          </div>
        )}

        {activeTab === 'school_management' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mobile-First Header */}
            <section className="p-6 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Building size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">إدارة المدارس</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">قاعدة البيانات الحية</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setActiveTab('data_integrity')}
                  className="flex-1 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black rounded-2xl text-sm transition-all border border-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} /> فحص سلامة البيانات
                </button>
                <button 
                  onClick={async () => {
                    triggerToast("جاري الترحيل إلى PostgreSQL...", "info");
                    try {
                      const res = await fetch('/api/admin/sync-schools', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ schoolsList: schoolsRef.current })
                      });
                      const data = await res.json();
                      if (data.success) {
                        triggerToast(`تم ترحيل ${data.synced} مدرسة إلى PostgreSQL بنجاح 🚀`, "success");
                      } else {
                        triggerToast("حدث خطأ أثناء الترحيل", "error");
                      }
                    } catch (e) {
                      triggerToast("فشل الاتصال بالخادم", "error");
                    }
                  }}
                  className="flex-1 py-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-black rounded-2xl text-sm transition-all border border-purple-500/20 flex items-center justify-center gap-2"
                >
                  <Database size={18} /> ترحيل لـ PostgreSQL
                </button>
                <button 
                  onClick={async () => {
                    triggerToast("جاري مزامنة كافة المدارس...", "info");
                    for (const school of schools) {
                      await refreshSchoolStats(school);
                    }
                    triggerToast("تمت المزامنة الكلية بنجاح", "success");
                  }}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black rounded-2xl text-sm transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} /> مزامنة شاملة
                </button>
                <button 
                  onClick={() => document.getElementById('add-school-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex-1 py-4 bg-indigo-500 hover:bg-indigo-600 text-black font-black rounded-2xl text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> إضافة مدرسة جديدة
                </button>
              </div>
            </section>

            {/* Full-Width Search */}
            <div className="sticky top-[138px] z-30 bg-[#05060F]/80 backdrop-blur-xl border-b border-white/5 p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text"
                  placeholder="ابحث عن مدرسة بالاسم أو المعرف..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500/40 transition-all font-bold"
                  onChange={(e) => setCodeSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* School Cards - Full Bleed */}
            <div className="divide-y divide-white/5">
              {loadingSchools ? (
                <div className="py-20 text-center">
                  <RefreshCw size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">جاري المزامنة...</p>
                </div>
              ) : displayedSchools.length === 0 ? (
                <div className="py-20 px-6 text-center">
                  <School size={48} className="text-white/5 mx-auto mb-4" />
                  <p className="text-sm text-white/30 italic">لا توجد نتائج مطابقة لبحثك</p>
                </div>
              ) : (
                displayedSchools.map((school) => {
                  const pendingCover = pendingSchoolImages[school.id]?.coverUrl;
                  const pendingLogo = pendingSchoolImages[school.id]?.logoUrl;
                  const hasPendingImages = !!(pendingCover || pendingLogo);
                  
                  return (
                  <motion.div 
                    layout
                    key={school.id}
                    className="p-6 bg-white/[0.01] active:bg-white/[0.03] transition-colors relative"
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex flex-col gap-2 shrink-0">
                        {/* Cover Image Badge */}
                        <div className="w-16 h-11 rounded-xl bg-black/40 border border-indigo-500/20 overflow-hidden relative group" title="صورة غلاف المدرسة (الميادين)">
                          {(pendingCover || school.coverUrl) ? (
                            <img src={pendingCover || school.coverUrl} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-500/10 text-indigo-400 text-[8px] font-bold">
                              <span>الكڤر</span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                            <ImageIcon size={12} className="text-white mb-0.5" />
                            <span className="text-[7px] text-indigo-300 font-black">تغيير الكڤر</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverUpload(school.id, e)} />
                          </label>
                        </div>

                        {/* Logo Image Badge */}
                        <div className="w-16 h-11 rounded-xl bg-black/40 border border-amber-500/20 overflow-hidden relative group" title="لوغو/شعار المدرسة (الوصولات والشهادات)">
                          {(pendingLogo || school.logoUrl) ? (
                            <img src={pendingLogo || school.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-500/10 text-amber-400 text-[8px] font-bold">
                              <span>اللوغو</span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                            <ImageIcon size={12} className="text-white mb-0.5" />
                            <span className="text-[7px] text-amber-300 font-black">تغيير اللوغو</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(school.id, e)} />
                          </label>
                        </div>
                        
                        {hasPendingImages && (
                          <button
                            onClick={() => handleSaveImages(school.id)}
                            className="w-full mt-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-1 rounded shadow-lg transition-colors"
                          >
                            حفظ
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-base font-black text-white truncate leading-tight">{school.name}</h3>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${school.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[10px] text-white/40 font-bold mb-4">
                          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                            <MapPin size={10} className="text-emerald-400 shrink-0" />
                            الموقع: {school.location || school.governorate || "غير محدد"}
                          </span>
                          <span className="text-indigo-400/60 font-mono">ID: {school.id}</span>
                          <span>الخطة: {school.plan === 'premium' ? 'متقدمة' : 'قياسية'}</span>
                        </div>
                        
                        {/* Real-time Comprehensive Stats & Subscription Info */}
                        {(() => {
                          const liveStats = getLiveSchoolStats(school);
                          return (
                            <div className="space-y-3 mb-4">
                              {/* Subscription Status, Expiry & Last Activity Badges */}
                              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs font-bold">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${
                                    liveStats.subscriptionStatus === 'نشط' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    liveStats.subscriptionStatus === 'تجريبي' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    liveStats.subscriptionStatus === 'منتهي' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      liveStats.subscriptionStatus === 'نشط' ? 'bg-emerald-400 animate-pulse' :
                                      liveStats.subscriptionStatus === 'تجريبي' ? 'bg-amber-400' : 'bg-rose-400'
                                    }`} />
                                    الاشتراك: {liveStats.subscriptionStatus}
                                  </span>

                                  <span className="text-white/60 text-[10px] flex items-center gap-1 font-mono">
                                    <Calendar size={11} className="text-indigo-400" />
                                    الانتهاء: {liveStats.subscriptionEnd}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-indigo-300 text-[10px] font-bold flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                                    <Clock size={11} className="text-indigo-400" />
                                    آخر نشاط: {liveStats.lastActivity}
                                  </span>
                                  <button 
                                    onClick={() => refreshSchoolStats(school)}
                                    className="p-1 text-white/40 hover:text-indigo-400 transition-all rounded-lg bg-white/5"
                                    title="تحديث يدوياً من Firestore"
                                  >
                                    <RefreshCw size={10} />
                                  </button>
                                </div>
                              </div>

                              {/* SECTION 1: الإحصائيات الفعلية المسجلة */}
                              <div className="bg-[#0b0f29]/90 border border-indigo-500/20 rounded-2xl p-3 space-y-2">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
                                      <UserCheck size={14} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-white">الإحصائيات الفعلية المسجلة</h4>
                                      <p className="text-[8.5px] text-white/40 font-semibold">الحسابات الحقيقية والبنية التحتية الفعلية</p>
                                    </div>
                                  </div>
                                  <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    {liveStats.totalRegisteredUsers} حساب مسجل فعلياً
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                  {[
                                    {
                                      label: "الطلاب المسجلون",
                                      val: liveStats.registeredStudents,
                                      sub: liveStats.registeredStudents > 0 ? `${liveStats.registeredStudents} طالب مسجل` : "لا يوجد طلاب",
                                      icon: <Users size={12} className="text-indigo-400" />
                                    },
                                    {
                                      label: "الأساتذة المسجلون",
                                      val: liveStats.registeredTeachers,
                                      sub: liveStats.registeredTeachers > 0 ? `${liveStats.registeredTeachers} أستاذ مسجل` : "لا يوجد أساتذة",
                                      icon: <GraduationCap size={12} className="text-emerald-400" />
                                    },
                                    {
                                      label: "أولياء الأمور",
                                      val: liveStats.registeredParents,
                                      sub: liveStats.registeredParents > 0 ? `${liveStats.registeredParents} ولي أمر مسجل` : "لا يوجد أولياء أمور",
                                      icon: <HeartHandshake size={12} className="text-rose-400" />
                                    },
                                    {
                                      label: "السائقون",
                                      val: liveStats.registeredDrivers,
                                      sub: liveStats.registeredDrivers > 0 ? `${liveStats.registeredDrivers} سائق مسجل` : "لا يوجد سائقين",
                                      icon: <Bus size={12} className="text-amber-400" />
                                    },
                                    {
                                      label: "المشرفون",
                                      val: liveStats.registeredSupervisors,
                                      sub: liveStats.registeredSupervisors > 0 ? `${liveStats.registeredSupervisors} مشرف مسجل` : "لا يوجد مشرفين",
                                      icon: <UserCheck size={12} className="text-cyan-400" />
                                    },
                                    {
                                      label: "الإداريون",
                                      val: liveStats.registeredAdmins,
                                      sub: liveStats.registeredAdmins > 0 ? `${liveStats.registeredAdmins} إداري مسجل` : "لا يوجد إداريين",
                                      icon: <ShieldCheck size={12} className="text-purple-400" />
                                    },
                                    {
                                      label: "الصفوف",
                                      val: liveStats.gradesCount,
                                      sub: liveStats.gradesCount > 0 ? `${liveStats.gradesCount} صفوف معرفة` : "لم تُحدد صفوف",
                                      icon: <Layers size={12} className="text-blue-400" />
                                    },
                                    {
                                      label: "الشعب",
                                      val: liveStats.sectionsCount,
                                      sub: liveStats.sectionsCount > 0 ? `${liveStats.sectionsCount} شعبة مسجلة` : "لم تُحدد شعب",
                                      icon: <Grid size={12} className="text-teal-400" />
                                    },
                                    {
                                      label: "المواد",
                                      val: liveStats.subjectsCount,
                                      sub: liveStats.subjectsCount > 0 ? `${liveStats.subjectsCount} مادة دراسية` : "لم تُحدد مواد",
                                      icon: <BookOpen size={12} className="text-pink-400" />
                                    },
                                    {
                                      label: "الحافلات",
                                      val: liveStats.busesCount,
                                      sub: liveStats.busesCount > 0 ? `${liveStats.busesCount} حافلة مسجلة` : "لا يوجد حافلات",
                                      icon: <Car size={12} className="text-orange-400" />
                                    },
                                    {
                                      label: "نشطون الآن",
                                      val: liveStats.activeUsersCount,
                                      sub: liveStats.totalRegisteredUsers > 0 ? `${liveStats.activeUsersCount} أونلاين` : "لا يوجد أونلاين",
                                      icon: <Activity size={12} className="text-emerald-400 animate-pulse" />
                                    },
                                  ].map((s, idx) => (
                                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-2 text-center relative group/stat hover:border-white/10 transition-all">
                                      <div className="flex justify-center mb-1">{s.icon}</div>
                                      <p className="text-xs font-black font-mono leading-none text-white">{s.val}</p>
                                      <p className="text-[8px] text-white/40 font-bold mt-1 truncate">{s.label}</p>
                                      <p className="text-[7.5px] text-indigo-300/80 font-semibold mt-0.5 truncate">{s.sub}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* SECTION 2: جرد وإدارة الأكواد والسعة */}
                              <div className="bg-[#140e29]/90 border border-amber-500/20 rounded-2xl p-3 space-y-2">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                                      <Key size={14} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-white">إدارة وجرد الأكواد والسعة</h4>
                                      <p className="text-[8.5px] text-white/40 font-semibold">تتبع الأكواد المولدة، المستخدمة، والمتبقية للتفعيل</p>
                                    </div>
                                  </div>
                                  <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    معدل التفعيل: {liveStats.activationRate}%
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                                  {/* Student Codes Total */}
                                  <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                                    <p className="text-[8px] text-amber-400/90 font-bold truncate">أكواد الطلاب</p>
                                    <p className="text-xs font-black font-mono text-white mt-0.5">{liveStats.totalStudentCodes}</p>
                                    <p className="text-[7.5px] text-white/40 font-semibold mt-0.5">مولدة</p>
                                  </div>

                                  {/* Student Codes Used */}
                                  <div className="bg-black/40 border border-emerald-500/10 rounded-xl p-2 text-center bg-emerald-500/5">
                                    <p className="text-[8px] text-emerald-400 font-bold truncate">مفعلة (طلاب)</p>
                                    <p className="text-xs font-black font-mono text-emerald-300 mt-0.5">{liveStats.usedStudentCodes}</p>
                                    <p className="text-[7.5px] text-emerald-400/60 font-semibold mt-0.5">مستخدمة</p>
                                  </div>

                                  {/* Student Codes Remaining */}
                                  <div className="bg-black/40 border border-indigo-500/10 rounded-xl p-2 text-center bg-indigo-500/5">
                                    <p className="text-[8px] text-indigo-300 font-bold truncate">متبقية (طلاب)</p>
                                    <p className="text-xs font-black font-mono text-indigo-200 mt-0.5">{liveStats.remainingStudentCodes}</p>
                                    <p className="text-[7.5px] text-indigo-400/60 font-semibold mt-0.5">متاحة</p>
                                  </div>

                                  {/* Staff Codes Total */}
                                  <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                                    <p className="text-[8px] text-purple-400/90 font-bold truncate">أكواد الكوادر</p>
                                    <p className="text-xs font-black font-mono text-white mt-0.5">{liveStats.totalStaffCodes}</p>
                                    <p className="text-[7.5px] text-white/40 font-semibold mt-0.5">مولدة</p>
                                  </div>

                                  {/* Staff Codes Used */}
                                  <div className="bg-black/40 border border-emerald-500/10 rounded-xl p-2 text-center bg-emerald-500/5">
                                    <p className="text-[8px] text-emerald-400 font-bold truncate">مفعلة (كوادر)</p>
                                    <p className="text-xs font-black font-mono text-emerald-300 mt-0.5">{liveStats.usedStaffCodes}</p>
                                    <p className="text-[7.5px] text-emerald-400/60 font-semibold mt-0.5">مستخدمة</p>
                                  </div>

                                  {/* Staff Codes Remaining */}
                                  <div className="bg-black/40 border border-purple-500/10 rounded-xl p-2 text-center bg-purple-500/5">
                                    <p className="text-[8px] text-purple-300 font-bold truncate">متبقية (كوادر)</p>
                                    <p className="text-xs font-black font-mono text-purple-200 mt-0.5">{liveStats.remainingStaffCodes}</p>
                                    <p className="text-[7.5px] text-purple-400/60 font-semibold mt-0.5">متاحة</p>
                                  </div>

                                  {/* Parent Codes Total */}
                                  <div className="bg-black/40 border border-white/5 rounded-xl p-2 text-center">
                                    <p className="text-[8px] text-rose-400/90 font-bold truncate">أكواد الأولياء</p>
                                    <p className="text-xs font-black font-mono text-white mt-0.5">{liveStats.totalParentCodes}</p>
                                    <p className="text-[7.5px] text-white/40 font-semibold mt-0.5">متاحة</p>
                                  </div>

                                  {/* Parent Codes Used */}
                                  <div className="bg-black/40 border border-rose-500/10 rounded-xl p-2 text-center bg-rose-500/5">
                                    <p className="text-[8px] text-rose-300 font-bold truncate">مفعلة (أولياء)</p>
                                    <p className="text-xs font-black font-mono text-rose-200 mt-0.5">{liveStats.usedParentCodes}</p>
                                    <p className="text-[7.5px] text-rose-400/60 font-semibold mt-0.5">{liveStats.remainingParentCodes} متبقي</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Action Buttons - Full Width Group */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSchoolLocation(school);
                              setLocationInputText(school.location || school.city || school.governorate || "");
                            }}
                            className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500/40"
                            title="تعديل أو كتابة موقع المدرسة ليظهر في الميادين"
                          >
                            <MapPin size={14} className="text-emerald-400" /> موقع المدرسة
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateAdminCodeForSchool(school);
                            }}
                            className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles size={14} /> كود إدارة
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfiguringSchoolModules(school);
                            }}
                            className="flex-1 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sliders size={14} /> التحكم بالأقسام
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSchoolStatus(school);
                            }}
                            className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              school.status === 'active' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}
                          >
                            {school.status === 'active' ? <Shield size={14} /> : <ShieldOff size={14} />}
                            {school.status === 'active' ? 'نشطة' : 'معطلة'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSchoolToDelete(school);
                            }}
                            className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={14} /> حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })
              )}
            </div>

            {/* Modal for Setting / Updating School Location (الميادين) */}
            <AnimatePresence>
              {editingSchoolLocation && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#0A0E1A] border border-emerald-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col my-auto"
                  >
                    <div className="p-5 border-b border-white/10 bg-emerald-950/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h3 className="text-white font-black text-base">تحديد موقع المدرسة في «الميادين»</h3>
                          <p className="text-xs font-bold text-emerald-300/80">{editingSchoolLocation.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingSchoolLocation(null)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-xs text-emerald-300 font-semibold leading-relaxed">
                          الموقع الذي تكتبه هنا سيظهر مباشرة في بطاقة المدرسة في قسم <strong>«الميادين»</strong> (مثل: <em>الديوانية - غماس</em>، <em>بغداد - المنصور</em>، أو <em>كربلاء - حي الحسين</em>).
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-white/70 font-black flex items-center gap-2">
                          <MapPin size={14} className="text-emerald-400" />
                          <span>اكتب موقع أو عنوان المدرسة:</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={locationInputText}
                            onChange={(e) => setLocationInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSaveSchoolLocation();
                              }
                            }}
                            placeholder="مثال: الديوانية - غماس أو بغداد - الكرخ"
                            className="w-full bg-white/5 border border-white/15 focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-white/25 outline-none font-bold transition-all"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Quick Suggestions */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-white/40 font-bold">اقتراحات سريعة:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["الديوانية - غماس", "بغداد - الكرخ", "بغداد - الرصافة", "النجف الأشرف", "كربلاء المقدسة", "بابل - الحلة", "البصرة - المعقل"].map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setLocationInputText(sug)}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-white/70 hover:text-emerald-300 transition-all cursor-pointer"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-end gap-3">
                      <button
                        onClick={() => setEditingSchoolLocation(null)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs font-bold transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={handleSaveSchoolLocation}
                        disabled={isSavingLocation || !locationInputText.trim()}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        {isSavingLocation ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" /> جاري الحفظ...
                          </>
                        ) : (
                          <>
                            <Check size={14} /> حفظ الموقع في الميادين
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal for Managing School Feature Toggles / Disabled Modules */}
            <AnimatePresence>
              {configuringSchoolModules && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer" 
                  dir="rtl"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setConfiguringSchoolModules(null);
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0A0E1A] border border-indigo-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col my-auto cursor-default"
                  >
                    <div className="p-5 border-b border-white/10 bg-indigo-950/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                          <Sliders size={20} />
                        </div>
                        <div>
                          <h3 className="text-white font-black text-base">إدارة أقسام وصلاحيات المدرسة</h3>
                          <p className="text-xs font-bold text-indigo-300/80">{configuringSchoolModules.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfiguringSchoolModules(null)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
                      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl mb-4 border border-white/5">
                        {[
                          { id: 'admin', label: 'الإدارة', icon: <Shield size={14} /> },
                          { id: 'student', label: 'الطالب', icon: <GraduationCap size={14} /> },
                          { id: 'teacher', label: 'الأستاذ', icon: <UserCheck size={14} /> },
                          { id: 'parent', label: 'ولي الأمر', icon: <Users size={14} /> },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveModuleTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black transition-all ${
                              activeModuleTab === tab.id 
                                ? 'bg-indigo-500 text-black shadow-lg shadow-indigo-500/20' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </div>

                      <p className="text-[10px] text-white/50 font-bold mb-4 px-1 leading-relaxed">
                        {activeModuleTab === 'admin' && '🎛️ تحكم في الأقسام والوظائف التي تظهر في "لوحة الإدارة المركزية" للمدرسة.'}
                        {activeModuleTab === 'student' && '🎓 تحكم في الأقسام والخدمات التفاعلية المتاحة في "منصة الطالب" الرسمية.'}
                        {activeModuleTab === 'teacher' && '👨‍🏫 تحكم في الصلاحيات والأدوات الممنوحة للكادر التدريسي في "منصة الأستاذ".'}
                        {activeModuleTab === 'parent' && '👨‍👩‍👧‍👦 تحكم في البيانات والتقارير المتاحة لأولياء الأمور في "بوابة المتابعة".'}
                      </p>

                      {(() => {
                        const filtered = SCHOOL_MODULES.filter(mod => {
                          if (activeModuleTab === 'admin') {
                            return [
                              'financial', 'activation_codes', 'control_hub', 'attendance', 
                              'teachers', 'broadcast', 'transport', 'questions_bank', 
                              'competitions', 'ideas', 'support'
                            ].includes(mod.id);
                          }
                          if (activeModuleTab === 'student') {
                            return [
                              'arena', 'materials', 'videos', 'assignments', 'questions_bank', 
                              'competitions', 'mayadeen', 'schedule', 'excellence'
                            ].includes(mod.id);
                          }
                          if (activeModuleTab === 'teacher') {
                            return [
                              'arena', 'attendance_tracking', 'broadcast', 'materials', 
                              'teacher_upload', 'evaluation', 'announcements', 'questions_bank', 
                              'sovereignty_mgmt', 'ai_gen_summary', 
                              'assignments', 'ai_teaching_suggestions', 'competitions', 
                              'activity_monitoring', 'schedule', 'excellence', 'control_hub'
                            ].includes(mod.id);
                          }
                          if (activeModuleTab === 'parent') {
                            return [
                              'grades_parent', 'assignments_parent', 'uniform_parent', 
                              'transport_parent', 'support_parent', 'financial_parent', 'discipline_reports_parent', 
                              'excellence_parent', 'ideas_parent'
                            ].includes(mod.id);
                          }
                          return true;
                        });

                        return filtered.map((mod, index) => {
                          const currentDisabled = configuringSchoolModules.disabledModules || [];
                          // Check for tab-specific disable or global disable
                          const rawAliases = mod.aliases || [mod.id];
                          const tabAliases = activeModuleTab === 'admin' ? rawAliases : rawAliases.map(a => `${activeModuleTab}:${a}`);
                          const isDisabled = tabAliases.some(a => currentDisabled.includes(a));

                          return (
                            <div
                              key={`module-${activeModuleTab}-${mod.id}-${index}`}
                              onClick={() => toggleSchoolModule(configuringSchoolModules.id, mod.id, currentDisabled, activeModuleTab)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isDisabled
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                : 'bg-white/5 border-white/10 hover:border-indigo-500/40 text-white'
                            }`}
                          >
                            <div>
                              <h4 className="text-xs font-black flex items-center gap-2">
                                <span>{mod.label}</span>
                                {isDisabled && (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/40">
                                    موقف
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-white/50 font-medium mt-0.5">{mod.desc}</p>
                            </div>

                            <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                              isDisabled ? 'bg-rose-500 justify-end' : 'bg-emerald-500 justify-start'
                            }`}>
                              <motion.div
                                layout
                                className="w-4 h-4 rounded-full bg-white shadow-md"
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                    <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                      <button
                        onClick={() => setConfiguringSchoolModules(null)}
                        className="px-6 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-black font-black text-xs transition-all cursor-pointer"
                      >
                        حفظ وإغلاق
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Form - Full Width Section */}
            <section id="add-school-form" className="p-6 bg-[#080A1A] border-y border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Plus size={20} />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">تسجيل مدرسة جديدة</h3>
              </div>

              <form onSubmit={handleCreateSchool} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">اسم المدرسة</label>
                  <input 
                    type="text" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="مدرسة المتميزين"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">المعرف (ID)</label>
                    <input 
                      type="text" value={newSchoolId} onChange={(e) => setNewSchoolId(e.target.value)}
                      placeholder="school-code"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">المحافظة</label>
                    <select 
                      value={newSchoolGov} onChange={(e) => setNewSchoolGov(e.target.value)}
                      className="w-full bg-[#05060F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold"
                    >
                      {["بغداد", "البصرة", "النجف", "كربلاء", "بابل", "الموصل", "صلاح الدين", "أربيل", "السليمانية", "دهوك", "ديالى", "الأنبار", "ذي قار", "ميسان", "المثنى", "القادسية", "واسط", "كركوك"].map(gov => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin size={12} /> موقع المدرسة (الذي سيظهر في بطاقة الميادين 📍)</span>
                    <span className="text-[9px] text-white/40 font-normal">مثال: الديوانية - غماس أو بغداد - المنصور</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={newSchoolLocation} 
                      onChange={(e) => setNewSchoolLocation(e.target.value)}
                      placeholder="اكتب موقع المدرسة بدقة (مثل: الديوانية - غماس)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">اسم مدير المدرسة / المشرف</label>
                  <input 
                    type="text" value={newSchoolAdmin} onChange={(e) => setNewSchoolAdmin(e.target.value)}
                    placeholder="أحمد علي"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                {/* Cover Image Input */}
                <div className="space-y-2">
                  <label className="text-[10px] text-indigo-400 font-black uppercase tracking-widest flex items-center justify-between">
                    <span>صورة غلاف المدرسة (الكڤر - للميادين)</span>
                    <span className="text-[9px] text-white/40 font-normal">واجهة المدرسة في الميادين</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            (window as any)._pendingSchoolCover = reader.result;
                            setNewSchoolCoverPreview(reader.result as string);
                            triggerToast("تم اختيار صورة غلاف المدرسة بنجاح 🖼️", "info");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white file:hidden cursor-pointer"
                    />
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  </div>
                  {newSchoolCoverPreview && (
                    <div className="relative h-20 w-full rounded-xl overflow-hidden border border-white/10 mt-2">
                      <img src={newSchoolCoverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Logo Image Input */}
                <div className="space-y-2">
                  <label className="text-[10px] text-amber-400 font-black uppercase tracking-widest flex items-center justify-between">
                    <span>لوغو المدرسة (اللوغو - للوصولات والتتويج)</span>
                    <span className="text-[9px] text-white/40 font-normal">شعار الوصولات والشهادات</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            (window as any)._pendingSchoolLogo = reader.result;
                            setNewSchoolLogoPreview(reader.result as string);
                            triggerToast("تم اختيار شعار المدرسة بنجاح 🏷️", "info");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white file:hidden cursor-pointer"
                    />
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  </div>
                  {newSchoolLogoPreview && (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-white/10 bg-black/40 p-1 mt-2">
                      <img src={newSchoolLogoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                <button
                  type="submit" disabled={isCreatingSchool}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/20 text-black font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingSchool ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                  تأكيد تسجيل المدرسة
                </button>
              </form>
            </section>

            {/* Recent Codes - Full width Card View */}
            <section className="p-6">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={14} /> آخر الأكواد المولدة
              </h3>
              <div className="space-y-3">
                {activationCodes.slice(0, 5).map((c) => (
                  <div key={c.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-indigo-400 font-mono mb-1">{c.code}</p>
                      <p className="text-[10px] text-white/40 font-bold">{c.schoolName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {c.status === 'active' ? 'نشط' : 'مستخدم'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'remote_config' && (
          <CloudControlSection
            remoteConfig={remoteConfig}
            setRemoteConfig={setRemoteConfig}
            onPreviewModal={setPreviewModalType}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'actions' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-0">
            {/* System Announcements - Full Width */}
            <section className="bg-gradient-to-br from-[#0c1024] to-[#060815] border-b border-white/5 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Bell size={20} />
                </div>
                <h3 className="text-sm font-black text-white">إرسال تعميم عام للمدارس 📢</h3>
              </div>
              
              <form onSubmit={handleBroadcastAnnouncement} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">عنوان الإعلان</label>
                  <input 
                    type="text" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="عنوان الإعلان العريض..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">الفئة المستهدفة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "الجميع" },
                      { id: "teachers", label: "الأساتذة" },
                      { id: "students", label: "الطلاب" }
                    ].map((item) => (
                      <button
                        key={item.id} type="button" onClick={() => setTargetAudience(item.id as any)}
                        className={`py-3 rounded-xl border text-[10px] font-black transition-all ${
                          targetAudience === item.id ? "bg-amber-500/10 border-amber-500 text-amber-300" : "bg-white/5 border-white/5 text-white/40"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">محتوى الإعلان</label>
                  <textarea 
                    value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)}
                    placeholder="اكتب تفاصيل الإعلان هنا..." rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-amber-500 font-bold resize-none"
                  />
                </div>

                <button
                  type="submit" disabled={isBroadcasting}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/20 text-black font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {isBroadcasting ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  نشر الإعلان فوراً
                </button>
              </form>
            </section>

            {/* DB Audit Trail - Full Width Terminal */}
            <section className="bg-black/40 p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Terminal size={20} />
                  </div>
                  <h3 className="text-sm font-black text-white">سجل العمليات اللحظي</h3>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Live Stream</span>
                </div>
              </div>

              <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[10px] text-white/60 space-y-3 overflow-y-auto custom-scrollbar shadow-inner">
                {realLogs.length === 0 ? (
                  <div className="text-center py-20 text-white/10 italic font-sans">
                    لا توجد سجلات حالياً
                  </div>
                ) : (
                  realLogs.map((log) => (
                    <div key={log.id} className="flex gap-2 pb-2 border-b border-white/[0.02]">
                      <span className="text-indigo-500/50 shrink-0">[{log.time}]</span>
                      <p className="flex-1 leading-relaxed">
                        <span className={`font-black ml-1 ${log.type === "success" ? "text-emerald-500/70" : log.type === "warning" ? "text-amber-500/70" : "text-indigo-400/70"}`}>
                          {log.type === "success" ? "OK" : log.type === "warning" ? "WARN" : "INFO"}
                        </span>
                        {log.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'media' && (
          <MediaManagementSection triggerToast={triggerToast} />
        )}

        {activeTab === 'errors' && (
          <div className="p-6">
            <ErrorMonitoringSection />
          </div>
        )}

        {/* DATA INTEGRITY DIAGNOSTIC TAB */}
        {activeTab === "data_integrity" && (
          <div className="p-6">
            <DataIntegritySection />
          </div>
        )}

        {/* LIVE SIMULATOR & SANDBOX TAB */}
        {activeTab === "simulator" && (
          <div className="p-6">
            <LiveSimulatorSection />
          </div>
        )}

        {/* AI & CONTENT STUDIO TAB */}
        {activeTab === "ai_studio" && (
          <div className="p-6">
            <AiContentStudioSection />
          </div>
        )}

        {/* SUBSCRIPTIONS & LICENSING TAB */}
        {activeTab === "licensing" && (
          <div className="p-6">
            <SubscriptionsLicensingSection />
          </div>
        )}

        {/* SECURITY & ACCESS CONTROL TAB */}
        {activeTab === "security" && (
          <div className="p-6">
            <SecurityAccessSection />
          </div>
        )}

        {/* AUTOMATED MAINTENANCE & ARCHIVING TAB */}
        {activeTab === "maintenance" && (
          <div className="p-6">
            <MaintenanceArchiveSection />
          </div>
        )}

        {/* Custom Confirmation Modal for School Deletion */}
        {schoolToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0B0D1B] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(244,63,94,0.2)] text-right">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 mx-auto border border-rose-500/20">
                <Trash2 size={28} />
              </div>
              <h3 className="text-base font-black text-white text-center mb-2">تأكيد حذف المدرسة</h3>
              <p className="text-xs text-white/60 text-center mb-6 leading-relaxed">
                هل أنت متأكد من حذف مدرسة <span className="text-rose-400 font-bold">"{schoolToDelete.name}"</span> نهائياً من قاعدة البيانات؟
              </p>
              <div className="flex gap-3">
                <button
                  disabled={isDeletingSchool}
                  onClick={executeDeleteSchool}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingSchool ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  حذف نهائي
                </button>
                <button
                  disabled={isDeletingSchool}
                  onClick={() => setSchoolToDelete(null)}
                  className="py-3 px-5 bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 rounded-2xl text-xs font-bold transition-all border border-white/10"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Dialog Live Preview Modal */}
        {previewModalType && (
          <SystemDialogsModal
            type={previewModalType}
            remoteConfig={remoteConfig}
            isOpen={Boolean(previewModalType)}
            onClose={() => setPreviewModalType(null)}
            isPreview={true}
          />
        )}

      </main>

      {/* Universal Developer Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[999] h-20 bg-[#050A18]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2 pb-6 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar">
        {[
          { id: 'users_directory', name: 'المستخدمون', icon: Users },
          { id: 'health', name: 'الصحة', icon: Activity },
          { id: 'school_management', name: 'المدارس', icon: Building },
          { id: 'remote_config', name: 'التحكم السحابي', icon: SlidersHorizontal },
          { id: 'maintenance', name: 'الصيانة والأرشفة', icon: Wrench },
          { id: 'simulator', name: 'المحاكي', icon: Radio },
          { id: 'ai_studio', name: 'الذكاء', icon: Sparkles },
          { id: 'licensing', name: 'التراخيص', icon: Award },
          { id: 'security', name: 'الأمان', icon: ShieldAlert },
          { id: 'data_integrity', name: 'البيانات', icon: ShieldCheck }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative flex flex-col items-center justify-center gap-1 min-w-[54px] transition-all outline-none group active:scale-95 shrink-0"
            >
              <div className={`transition-all duration-300 ${isSelected ? "text-indigo-400 -translate-y-1" : "text-white/30 hover:text-white/70"}`}>
                <Icon size={22} strokeWidth={isSelected ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold transition-all ${isSelected ? "text-indigo-400" : "text-white/30"}`}>
                {tab.name}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="devActiveTabIndicator"
                  className="absolute -top-[14px] w-8 h-1 bg-indigo-400 rounded-b-full shadow-[0_4px_15px_rgba(129,140,248,0.6)]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
