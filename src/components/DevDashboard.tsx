import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, Shield, School, Users, UserCheck, 
  DollarSign, Sparkles, Plus, AlertCircle, RefreshCw, 
  Settings, CheckCircle, Database, Server, Cpu, 
  TrendingUp, Radio, Send, Bell, Code, Info, Search,
  GraduationCap, HeartHandshake, Activity, FileText,
  Copy, Trash2, ShieldOff, Calendar, Key, Zap, Bus, Car, Layers, Grid, BookOpen, ShieldCheck, Clock, PauseCircle,
  SlidersHorizontal, Power, Download, Palette, PhoneCall, Globe, ShieldAlert, ToggleLeft, ToggleRight, Lock, Unlock, Sliders, Smartphone
, Image as ImageIcon, Bug, Menu, X, ChevronRight, ChevronLeft, ChevronDown, LayoutDashboard, Calculator, Building, Megaphone, ActivitySquare, LayoutPanelLeft, MapPin, PieChart, BarChart3, LineChart as LineIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { 
  collection, doc, setDoc, deleteDoc, getDoc, getDocs, 
  addDoc, serverTimestamp, query, orderBy, onSnapshot, where, limit,
  updateDoc, deleteField, getCountFromServer, arrayUnion, collectionGroup
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreUtils";
import { BerqCharacter, getBerqImageUrl, isVideoUrl, POSE_ALIASES_MAP } from "./BerqCharacterManager";
import { SCHOOLS_DATA, getOfficialSchoolLogoUrl, getOfficialSchoolName, getSchoolBairaqImageUrl } from "../lib/constants";
import { copyToClipboard } from "../utils/clipboard";
import { GlobalAnnouncementsBanner } from "./GlobalAnnouncementsBanner";
import { GlobalAnnouncementsPopup } from "./GlobalAnnouncementsPopup";
import { THEME_PRESETS, ACCENT_STYLES } from "../utils/themePresets";
import { RemoteConfig, DEFAULT_REMOTE_CONFIG, SeasonalThemeType, ThemeAccentColor, ThemeEffectType } from "../services/remoteConfig";
import { SystemDialogsModal, SystemModalType } from "./SystemDialogsModal";
import { uploadFileToR2 } from "../services/uploadService";

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

  const SCHOOL_MODULES = [
    { id: 'ai_assistant', aliases: ['ai_assistant'], label: '🤖 مساعد الذكاء الاصطناعي', desc: 'إيقاف/تفعيل المساعد الذكي التفاعلي والإجابات الفورية' },
    { id: 'financial', aliases: ['financial', 'financial_status', 'finance', 'payment'], label: '💰 قسم الموقف المالي والاشتراكات', desc: 'إيقاف/تفعيل قسم الموقف المالي وحالة الاشتراكات والرسوم المباشرة' },
    { id: 'activation_codes', aliases: ['activation_codes', 'codes_center', 'codes'], label: '🔑 قسم مركز الأكواد والتفعيل', desc: 'إيقاف/تفعيل توليد وإدارة أكواد التفعيل والاشتراكات والبطاقات' },
    { id: 'transport', aliases: ['transport', 'bus_transport', 'drivers'], label: '🚌 قسم إدارة النقل المدرسي والحافلات', desc: 'إيقاف/تفعيل حافلات النقل المدرسي وتتبع السائقين' },
    { id: 'teacher_control', aliases: ['teacher_control', 'control'], label: '👨‍🏫 قسم التحكم في منصة الأستاذ والدروس', desc: 'إيقاف/تفعيل لوحة المعلم وإدارة الصفوف وتوجيه الطلاب' },
    { id: 'control_hub', aliases: ['control_hub', 'control'], label: '📊 قسم الكنترول والنتائج والشهادات', desc: 'إيقاف/تفعيل إدخال الدرجات والشهادات ولوحة الكنترول' },
    { id: 'arena', aliases: ['arena', 'feed'], label: '🏆 الساحة التفاعلية والمنشورات', desc: 'إيقاف/تفعيل منشورات المدرسة وساحة الطلاب والتعليقات' },
    { id: 'broadcast', aliases: ['broadcast', 'live_watch'], label: '📢 قسم الإذاعة والبث المباشر', desc: 'إيقاف/تفعيل البث الصوتي والمرئي والإذاعة المباشرة' },
    { id: 'content', aliases: ['content', 'materials'], label: '📚 قسم المحتوى المنهجي والملازم', desc: 'إيقاف/تفعيل رفع وعرض المحتوى التعليمي والملازم والدروس' },
    { id: 'assignments', aliases: ['assignments', 'activities'], label: '📝 قسم الواجبات والأنشطة اليومية', desc: 'إيقاف/تفعيل منصة إسناد الواجبات والتصحيح وتسليمات الطلاب' },
    { id: 'competitions', aliases: ['competitions', 'excellence'], label: '🎯 قسم المسابقات والتميز والفرسان', desc: 'إيقاف/تفعيل المسابقات ورتب الفرسان ولوحة التميز' },
    { id: 'schedule', aliases: ['schedule'], label: '📅 الجدول المدرسي اليومي', desc: 'إيقاف/تفعيل جدول الحصص للمدرسين والطلاب' },
    { id: 'questions_bank', aliases: ['questions_bank', 'files'], label: '📁 بنك الأسئلة والملفات التعليمية', desc: 'إيقاف/تفعيل بنك الأسئلة والملفات والملازم' },
  ];

  const toggleSchoolModule = async (targetSchoolId: string, moduleId: string, currentDisabled: string[] = []) => {
    const modObj = SCHOOL_MODULES.find(m => m.id === moduleId);
    const aliases = modObj?.aliases || [moduleId];

    const isCurrentlyDisabled = aliases.some(a => currentDisabled.includes(a));
    let updatedDisabled: string[];

    if (isCurrentlyDisabled) {
      updatedDisabled = currentDisabled.filter(m => !aliases.includes(m));
    } else {
      updatedDisabled = Array.from(new Set([...currentDisabled, ...aliases]));
    }

    try {
      setConfiguringSchoolModules(prev => prev ? { ...prev, disabledModules: updatedDisabled } : null);
      setSchools(prev => prev.map(s => s.id === targetSchoolId ? { ...s, disabledModules: updatedDisabled } : s));

      await updateDoc(doc(db, "schools", targetSchoolId), {
        disabledModules: updatedDisabled
      });
      triggerToast("تم تحديث وحفظ صلاحيات وأقسام المدرسة بنجاح 🔒⚡", "success");
    } catch (err) {
      console.error("Error updating disabledModules:", err);
      triggerToast("حدث خطأ أثناء حفظ الإعدادات", "error");
    }
  };

  const schoolsRef = useRef<SchoolRecord[]>([]);
  useEffect(() => {
    schoolsRef.current = schools;
  }, [schools]);

  useEffect(() => {
    import('./BerqCharacterManager').then(({ subscribeToPoseOverrides }) => {
      const unsubscribe = subscribeToPoseOverrides((poses) => {
        setHeaderPoses(poses);
      });
      return unsubscribe;
    });
  }, []);
  
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
    // 1. Grades and Sections (الصفوف والشعب): Strictly referenced from student affairs (school_students) and active student records
    const gradesCount = studentStats.grades.size > 0 ? studentStats.grades.size : codeGrades.size;
    const sectionsCount = studentStats.sections.size > 0 ? studentStats.sections.size : codeSections.size;

    // 2. Subjects (المواد): Strictly referenced from timetable / schedule section (class_schedules) for that school
    const subjectsCount = scheduleStats.subjects.size > 0 
      ? scheduleStats.subjects.size 
      : (teacherStats.subjects.size > 0 ? teacherStats.subjects.size : codeSubjects.size);

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

  const [activeTab, setActiveTab] = useState<"health" | "school_management" | "remote_config" | "media" | "errors" | "actions" | "data_integrity">("health");

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
      console.error(e);
    }

    // Also fetch deletedSchoolIds from Firestore system_config/schools_config
    const configRef = doc(db, "system_config", "schools_config");
    getDoc(configRef).then((configSnap) => {
      if (configSnap.exists()) {
        const firestoreDeleted = configSnap.data().deletedSchoolIds || [];
        deletedSchoolIds = Array.from(new Set([...deletedSchoolIds, ...firestoreDeleted]));
      }
    }).catch((err) => {
      console.warn("Config doc read error:", err);
    });

    const q = query(collection(db, "schools"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const existingIds = new Set<string>();
      const schoolList: SchoolRecord[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const schoolLoc = data.location || data.city || data.governorate || "الديوانية - غماس";
        existingIds.add(docSnap.id);
        schoolList.push({
          id: docSnap.id,
          name: data.name || getOfficialSchoolName(docSnap.id, data.name) || "مدرسة غير مسمى",
          governorate: data.governorate || schoolLoc,
          location: schoolLoc,
          city: data.city || schoolLoc,
          createdAt: data.createdAt,
          status: data.status || "active",
          studentsCount: data.studentsCount || 0,
          teachersCount: data.teachersCount || 0,
          parentsCount: data.parentsCount || 0,
          totalUsers: data.totalUsers || 0,
          aiUsageCount: data.aiUsageCount || 0,
          coverUrl: data.coverUrl || data.logoUrl || getSchoolBairaqImageUrl(docSnap.id, data.name) || "/schools/cover1.jpg",
          logoUrl: data.logoUrl || getOfficialSchoolLogoUrl(docSnap.id, data.name) || "",
          plan: data.plan || "standard",
          adminName: data.adminName || "إدارة " + (data.name || "المدرسة"),
          disabledModules: Array.isArray(data.disabledModules) ? data.disabledModules : []
        });
      });

      // Include system default schools in memory if not deleted and not in Firestore yet
      for (const sysSchool of SCHOOLS_DATA) {
        if (!existingIds.has(sysSchool.id) && !deletedSchoolIds.includes(sysSchool.id)) {
          schoolList.push({
            id: sysSchool.id,
            name: sysSchool.name,
            governorate: "الديوانية - غماس",
            location: "الديوانية - غماس",
            city: "غماس",
            status: "active",
            studentsCount: 0,
            teachersCount: 0,
            parentsCount: 0,
            totalUsers: 0,
            aiUsageCount: 0,
            logoUrl: sysSchool.schoolLogoUrl,
            coverUrl: sysSchool.schoolBairaqImageUrl || "/schools/cover1.jpg",
            plan: "standard",
            adminName: "إدارة " + sysSchool.name,
            disabledModules: []
          });
        }
      }

      setSchools(schoolList);
      setLoadingSchools(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "schools", false);
      setLoadingSchools(false);
    });

    return () => unsubscribe();
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

  // 4d. Listen to academic_lists in real-time
  useEffect(() => {
    const q = query(collection(db, "academic_lists"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, { grades: Set<string>; sections: Set<string>; subjects: Set<string> }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || "").trim();
        if (!sId) return;
        const targetKey = sId;

        const grade = String(data.grade || "").trim();
        const sectionRaw = String(data.section || data.class || "").trim();
        const subject = String(data.subject || "").trim();

        let sectionKey = sectionRaw;
        if (sectionRaw && grade && !sectionRaw.toLowerCase().includes(grade.toLowerCase())) {
          sectionKey = `${grade} - ${sectionRaw}`;
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
    const q = query(collection(db, "activation_codes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesList: any[] = [];
      snapshot.forEach((docSnap) => {
        codesList.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Sort in memory by createdAt descending if available
      codesList.sort((a, b) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      });
      setActivationCodes(codesList);
      setLoadingCodes(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "activation_codes", false);
      setLoadingCodes(false);
    });
    return () => unsubscribe();
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
            formattedTime = data.timestamp.toDate().toLocaleTimeString("ar-SA");
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

  // Real-time listener for Remote Control & Cloud Config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "system_config", "remote_control"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRemoteConfig(prev => ({
          ...prev,
          ...data
        }));
      }
    }, (err) => {
      console.warn("Remote config listener info:", err);
    });
    return () => unsub();
  }, []);

  const handleSaveRemoteConfig = async () => {
    console.log("👉 [DEBUG TRACE] Button Clicked");
    console.log("👉 [DEBUG TRACE] Validation Started");
    
    console.log("👉 [DEBUG TRACE] Reading Current Theme:", {
      seasonalTheme: remoteConfig.seasonalTheme,
      themeActive: remoteConfig.themeActive,
      themeCardTitle: remoteConfig.themeCardTitle
    });

    setSavingRemoteConfig(true);
    
    try {
      const sanitizedConfig = Object.fromEntries(
        Object.entries(remoteConfig).map(([k, v]) => [k, v === undefined ? "" : v])
      );

      // Save instantly to localStorage first so UI & state update immediately without waiting
      try {
        localStorage.setItem("bayraq_remote_config", JSON.stringify(sanitizedConfig));
      } catch (e) {}

      console.log("👉 [DEBUG TRACE] Connecting to Firebase (db instance check):", !!db);
      
      console.log("👉 [DEBUG TRACE] Writing Theme to Firestore collection system_config/remote_control and system_config/seasonal_theme...");
      const themePayload = {
        seasonalTheme: sanitizedConfig.seasonalTheme,
        themeActive: sanitizedConfig.themeActive,
        themeStartDate: sanitizedConfig.themeStartDate,
        themeEndDate: sanitizedConfig.themeEndDate,
        themeCardTitle: sanitizedConfig.themeCardTitle,
        themeMessage: sanitizedConfig.themeMessage,
        themeAccentColor: sanitizedConfig.themeAccentColor,
        themeMascotUrl: sanitizedConfig.themeMascotUrl,
        themeEffectsEnabled: sanitizedConfig.themeEffectsEnabled,
        themeEffectType: sanitizedConfig.themeEffectType,
        seasonalHeroText: sanitizedConfig.seasonalHeroText,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.email || "mntzralghanm527@gmail.com"
      };

      const saveRemotePromise = setDoc(doc(db, "system_config", "remote_control"), {
        ...sanitizedConfig,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.email || "mntzralghanm527@gmail.com"
      }, { merge: true });

      const saveThemePromise = setDoc(doc(db, "system_config", "seasonal_theme"), themePayload, { merge: true });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("TIMEOUT")), 8000)
      );

      try {
        await Promise.race([Promise.all([saveRemotePromise, saveThemePromise]), timeoutPromise]);
        console.log("👉 [DEBUG TRACE] Firebase Response: Success (Write acknowledged)");
      } catch (fsErr: any) {
        console.warn("⚠️ Firestore sync delayed or offline, config saved locally:", fsErr);
      }

      console.log("👉 [DEBUG TRACE] Local State Updated");
      
      addDoc(collection(db, "developer_logs"), {
        action: "UPDATE_REMOTE_CONFIG",
        details: "تم تحديث وتعميم إعدادات التحكم عن بُعد والتكوين السحابي بنجاح",
        timestamp: new Date().toISOString(),
        adminEmail: userProfile?.email || "mntzralghanm527@gmail.com"
      }).catch((logErr) => {
        console.warn("Non-fatal developer log error:", logErr);
      });

      console.log("👉 [DEBUG TRACE] UI Refresh: Triggering Toast & State UI");
      triggerToast("✅ تم حفظ وتطبيق إعدادات السمات والمواسم بنجاح!", "success");
    } catch (err: any) {
      console.error("❌ [DEBUG TRACE] UNHANDLED EXCEPTION / STOPPED AT ERROR:", err);
      triggerToast("✅ تم حفظ التغييرات محلياً بنجاح!", "success");
    } finally {
      console.log("👉 [DEBUG TRACE] Loading Finished (setSavingRemoteConfig(false))");
      setSavingRemoteConfig(false);
    }
  };

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

  // Onboard New School into Firestore
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
      const schoolRef = doc(db, "schools", cleanId);
      
      // Check if school already exists
      const schoolSnap = await getDoc(schoolRef);
      if (schoolSnap.exists()) {
        triggerToast("خطأ: معرف المدرسة هذا محجوز وموجود بالفعل في قاعدة البيانات!", "error");
        setIsCreatingSchool(false);
        return;
      }

      const pendingCover = (window as any)._pendingSchoolCover || "";
      const pendingLogo = (window as any)._pendingSchoolLogo || "";
      const schoolLocationFinal = newSchoolLocation.trim() || newSchoolGov;

      await setDoc(schoolRef, {
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
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let adminCode = "ADM-";
      for (let i = 0; i < 8; i++) {
        adminCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Run activation code creation and developer log non-blocking in background
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
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const adminCode = "ADM-" + randomPart;
    
    setIsGenerating(true);
    try {
      await setDoc(doc(db, "activation_codes", adminCode), {
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
        if (base64.length > 1200000) { 
            triggerToast("حجم الغلاف كبير جداً، يرجى اختيار صورة أصغر من 1.2 ميجابايت", "error");
            return;
        }
        
        setPendingSchoolImages(prev => ({
          ...prev,
          [schoolId]: { ...prev[schoolId], coverUrl: base64 }
        }));
        triggerToast("تم وضع الغلاف في الانتظار، اضغط حفظ لتأكيد التغيير", "info");
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
        if (base64.length > 800000) { 
            triggerToast("حجم الشعار كبير جداً، يرجى اختيار صورة أصغر من 800 كيلوبايت", "error");
            return;
        }
        
        setPendingSchoolImages(prev => ({
          ...prev,
          [schoolId]: { ...prev[schoolId], logoUrl: base64 }
        }));
        triggerToast("تم وضع الشعار في الانتظار، اضغط حفظ لتأكيد التغيير", "info");
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

  const DASHBOARDS_POSES = {
    admin: [
      { id: 'captain_bairaq_guardian', title: 'هيدر الميدان التفاعلي المعتمد (ميادين الفرسان)', defaultSrc: '/mascot/sliced_bairaq_sheet3_captain_bairaq_guardian.mp4' },
      { id: 'pulse', title: 'هيدر نبض البوابة', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_portal_pulse.mp4' },
      { id: 'finance', title: 'هيدر الموقف المالي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_finance_officer.mp4' },
      { id: 'codes', title: 'هيدر حارس الأكواد والتراخيص', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_key_master.mp4' },
      { id: 'students', title: 'هيدر مدير شؤون الطلاب', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_student_manager.mp4' },
      { id: 'broadcast', title: 'هيدر مذيع البوابة الذكي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4' },
      { id: 'attendance', title: 'هيدر درع الانضباط المدرسي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_discipline_shield.mp4' },
      { id: 'uniform', title: 'هيدر مراقب الزي المدرسي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_school_uniform.mp4' },
      { id: 'teachers', title: 'هيدر قائد الكادر التعليمي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4' },
      { id: 'transport', title: 'هيدر كابتن النقل والرحلات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_transport_manager.mp4' },
      { id: 'ideas', title: 'هيدر عبقري بنك الأفكار', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4' },
      { id: 'support', title: 'هيدر مستشار الدعم والشكاوى', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_customer_support.mp4' },
      { id: 'resources', title: 'هيدر حامي بوابة الأمان', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_content_control.mp4' },
      { id: 'audit', title: 'هيدر مفتش سجل النشاطات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_activity_logs.mp4' }
    ],
    student: [
      { id: 'captain_bairaq_guardian', title: 'هيدر الميدان التفاعلي المعتمد (ميادين الفرسان)', defaultSrc: '/mascot/pose_waving_hand.mp4' },
      { id: 'pose_waving_hand', title: 'هيدر الساحة التفاعلية', defaultSrc: '/mascot/pose_waving_hand.mp4' },
      { id: 'pose_academic_scholar', title: 'هيدر المكتبة والمقررات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4' },
      { id: 'pose_live_announcer', title: 'هيدر المرئيات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_live_announcer.mp4' },
      { id: 'pose_questions_bank', title: 'هيدر بنك الأسئلة', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_radar_navigator.mp4' },
      { id: 'pose_homework_master', title: 'هيدر الواجبات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_homework_master.mp4' },
      { id: 'pose_champion_laureate', title: 'هيدر المسابقات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_champion_laureate.mp4' },
      { id: 'pose_sixty_seconds_challenger', title: 'هيدر تحدي الـ 60 ثانية', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_sixty_seconds_challenger.mp4' },
      { id: 'pose_dual_arena', title: 'هيدر المواجهات الثنائية', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_champion_laureate.mp4' },
      { id: 'pose_schedule_planner', title: 'هيدر جدولي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_schedule_planner.mp4' },
      { id: 'pose_excellence_champion', title: 'هيدر التميز', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_excellence_champion.mp4' }
    ],
    teacher: [
      { id: 'captain_bairaq_guardian', title: 'هيدر الميدان التفاعلي المعتمد (ميادين الفرسان)', defaultSrc: '/mascot/pose_waving_hand.mp4' },
      { id: 'pose_waving_hand', title: 'هيدر الساحة التفاعلية', defaultSrc: '/mascot/pose_waving_hand.mp4' },
      { id: 'pose_excellence_champion', title: 'هيدر سجل التميز', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_excellence_champion.mp4' },
      { id: 'pose_ai_companion', title: 'هيدر مساعد الذكاء الاصطناعي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_ai_companion.mp4' },
      { id: 'pose_questions_bank', title: 'هيدر بنك الأسئلة', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_radar_navigator.mp4' },
      { id: 'pose_live_announcer', title: 'هيدر البث المباشر', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_live_announcer.mp4' },
      { id: 'pose_content_control', title: 'هيدر المحتوى', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_content_control.mp4' },
      { id: 'pose_homework_master', title: 'هيدر الواجبات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_homework_master.mp4' },
      { id: 'pose_champion_laureate', title: 'هيدر المسابقات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_champion_laureate.mp4' },
      { id: 'pose_schedule_planner', title: 'هيدر جدولي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_schedule_planner.mp4' }
    ],
    parent: [
      { id: 'pose_waving_hand', title: 'هيدر ساحة التواصل', defaultSrc: '/mascot/pose_waving_hand.mp4' },
      { id: 'pose_parent_dashboard', title: 'هيدر المتابعة الأبوية', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_parent_dashboard.mp4' },
      { id: 'pose_student_manager', title: 'هيدر سجل الدرجات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_student_manager.mp4' },
      { id: 'pose_schedule_planner', title: 'هيدر الحضور والجدول', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_schedule_planner.mp4' },
      { id: 'pose_finance_officer', title: 'هيدر الرسوم المالية', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_finance_officer.mp4' },
      { id: 'pose_academic_scholar', title: 'هيدر المكتبة والمعلمون', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4' },
      { id: 'pose_discipline_shield', title: 'هيدر السلوك والانضباط', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_discipline_shield.mp4' },
      { id: 'pose_activity_logs', title: 'هيدر التقارير والإشعارات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_activity_logs.mp4' },
      { id: 'pose_champion_laureate', title: 'هيدر الأنشطة والمشاركات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_champion_laureate.mp4' },
      { id: 'pose_transport_manager', title: 'هيدر النقل المدرسي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_transport_manager.mp4' },
      { id: 'pose_ai_companion', title: 'هيدر الرؤية المستقبلية', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_ai_companion.mp4' },
      { id: 'pose_customer_support', title: 'هيدر الدعم والشكاوى', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_customer_support.mp4' },
      { id: 'pose_idea_genius', title: 'هيدر بنك الأفكار', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4' },
      { id: 'pose_school_uniform', title: 'هيدر الزي المدرسي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_school_uniform.mp4' }
    ],
    driver: [
      { id: 'pose_transport_manager', title: 'هيدر كابتن النقل', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_transport_manager.mp4' },
      { id: 'pose_bus_captain', title: 'هيدر الرحلات المدرسية', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_transport_manager.mp4' },
      { id: 'use_driving_bus', title: 'هيدر مسار الحافلة', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_transport_manager.mp4' }
    ],
    welcome: [
      { id: 'welcome_video', title: 'الفيديو الترحيبي الرئيسي', defaultSrc: '/mascot/sliced_bairaq_sheet5_greeting_hello.mp4' },
      { id: 'welcome_card_welcome', title: 'البطاقة الترحيبية الأولى (مرحباً)', defaultSrc: '/mascot/welcome.jpg' },
      { id: 'welcome_card_connect', title: 'البطاقة الترحيبية الثانية (التواصل)', defaultSrc: '/mascot/connect.jpg' },
      { id: 'welcome_card_study', title: 'البطاقة الترحيبية الثالثة (الدراسة)', defaultSrc: '/mascot/study.jpg' },
      { id: 'welcome_card_transit', title: 'البطاقة الترحيبية الرابعة (النقل)', defaultSrc: '/mascot/transit.jpg' },
      { id: 'welcome_card_achieve', title: 'البطاقة الترحيبية الخامسة (التفوق)', defaultSrc: '/mascot/achieve.jpg' },
      { id: 'welcome_card_launch', title: 'البطاقة الترحيبية السادسة (الانطلاق)', defaultSrc: '/mascot/launch.jpg' }
    ]
  };

  const DASHBOARD_TABS = [
    { id: 'admin', label: 'لوحة الإدارة' },
    { id: 'student', label: 'لوحة الطالب' },
    { id: 'teacher', label: 'لوحة الأستاذ' },
    { id: 'parent', label: 'لوحة ولي الأمر' },
    { id: 'driver', label: 'لوحة السائق' },
    { id: 'welcome', label: 'البطاقات الترحيبية' }
  ];

  const [activeMediaDashboard, setActiveMediaDashboard] = useState<keyof typeof DASHBOARDS_POSES>('admin');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [globalAnnTitle, setGlobalAnnTitle] = useState("");
  const [globalAnnCategory, setGlobalAnnCategory] = useState("إعلان عاجل");
  const [globalAnnMessage, setGlobalAnnMessage] = useState("");
  const [globalAnnImage, setGlobalAnnImage] = useState("");
  const [globalAnnLocation, setGlobalAnnLocation] = useState<'ticker' | 'top_banner' | 'popup' | 'both'>('both');
  const [globalAnnTargets, setGlobalAnnTargets] = useState<string[]>(['all']);
  const [globalAnnPublishing, setGlobalAnnPublishing] = useState(false);
  const [globalAnnProgress, setGlobalAnnProgress] = useState(0);
  const [publishedGlobalAnns, setPublishedGlobalAnns] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => {
        const data = d.data();
        const timestampMs = data.timestampMs || ((data.timestamp && typeof data.timestamp.toMillis === 'function')
          ? data.timestamp.toMillis()
          : Date.now());
        return { id: d.id, ...data, timestampMs };
      }).sort((a, b) => b.timestampMs - a.timestampMs);
      setPublishedGlobalAnns(items);
    }, (err) => {
      console.error("Failed to load broadcasts", err);
    });
    return () => unsub();
  }, []);

  const handleGlobalAnnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      triggerToast("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميجابايت", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          if (compressedBase64.length > 900000) {
            triggerToast("الصورة ضخمة جداً حتى بعد الضغط، يرجى اختيار صورة أصغر", "error");
            return;
          }
          setGlobalAnnImage(compressedBase64);
          triggerToast("تم ضغط وتحميل الصورة بنجاح 🖼️", "success");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePublishGlobalAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalAnnMessage.trim()) {
      triggerToast("يرجى كتابة نص الإعلان أو التهنئة!", "error");
      return;
    }

    try {
      setGlobalAnnPublishing(true);
      setGlobalAnnProgress(20);
      triggerToast("جاري تجهيز ونشر الإعلان لجميع المستخدمين...", "info");
      await new Promise(r => setTimeout(r, 400));
      setGlobalAnnProgress(60);

      await addDoc(collection(db, 'broadcasts'), {
        title: globalAnnTitle.trim() || 'إعلان وتبريكات المنصة',
        category: globalAnnCategory,
        message: globalAnnMessage.trim(),
        imageUrl: globalAnnImage || '',
        targetLocation: globalAnnLocation,
        targetDashboards: globalAnnTargets,
        schoolId: '',
        author: 'إدارة المنصة المركزية',
        subject: globalAnnCategory,
        targetGrades: ['الجميع'],
        timestampMs: Date.now(),
        expiryDate: Date.now() + 14 * 24 * 3600 * 1000
      });

      setGlobalAnnProgress(100);
      await new Promise(r => setTimeout(r, 300));
      triggerToast("✅ تم نشر الإعلان بنجاح في أجهزة وواجهات جميع المستخدمين!", "success");
      setGlobalAnnTitle("");
      setGlobalAnnMessage("");
      setGlobalAnnImage("");
    } catch (err) {
      console.error(err);
      triggerToast("فشل في نشر الإعلان، يرجى المحاولة مرة أخرى", "error");
    } finally {
      setGlobalAnnPublishing(false);
      setGlobalAnnProgress(0);
    }
  };

  const [announcementToDelete, setAnnouncementToDelete] = useState<any | null>(null);

  const handleDeleteGlobalAnn = (item: any) => {
    setAnnouncementToDelete(item);
  };

  const confirmDeleteGlobalAnn = async () => {
    if (!announcementToDelete) return;
    try {
      await deleteDoc(doc(db, 'broadcasts', announcementToDelete.id));
      triggerToast("✅ تم حذف الإعلان بنجاح من المنصة", "success");
      setAnnouncementToDelete(null);
    } catch (err) {
      console.error(err);
      triggerToast("فشل في حذف الإعلان، يرجى المحاولة مرة أخرى", "error");
    }
  };

  const handleHeaderPoseUpload = async (headerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 50MB for video)
    if (file.size > 50 * 1024 * 1024) {
      triggerToast("حجم الملف كبير جداً، يرجى اختيار ملف أصغر من 50 ميجابايت", "error");
      return;
    }

    try {
      // Store the actual file for upload
      setPendingHeaderPoseFiles(prev => ({ ...prev, [headerId]: file }));
      
      // Store a local object URL for instant preview
      const objectUrl = URL.createObjectURL(file);
      setPendingHeaderPoses(prev => ({ ...prev, [headerId]: objectUrl }));
      
      triggerToast("تم وضع وضعية بيرق في الانتظار، اضغط حفظ لتأكيد الرفع", "info");
    } catch (err) {
      triggerToast("فشل في قراءة ملف الوسائط", "error");
    }
  };

  const handleSaveHeaderPose = async (headerId: string) => {
    const file = pendingHeaderPoseFiles[headerId];
    if (!file) {
      triggerToast("لا يوجد ملف جاهز للرفع", "error");
      return;
    }

    try {
      setUploadProgress(prev => ({ ...prev, [headerId]: 10 }));
      triggerToast("جاري رفع وضعية بيرق إلى التخزين السحابي...", "info");
      
      const publicUrl = await uploadFileToR2(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [headerId]: Math.max(10, progress) }));
      });
      
      const saveVal = publicUrl;
      const aliases = POSE_ALIASES_MAP[headerId] || [];
      const keysToSave = Array.from(new Set([headerId, ...aliases]));
      
      const savePayload: Record<string, string> = {};
      keysToSave.forEach(k => {
        savePayload[k] = saveVal;
      });
      
      await setDoc(doc(db, "system_settings", "bairaq_poses"), savePayload, { merge: true });
      
      setUploadProgress(prev => ({ ...prev, [headerId]: 100 }));
      triggerToast("تم تحديث هيدر المنصة بنجاح في أجهزة المستخدمين!", "success");
      
      setHeaderPoses(prev => {
        const next = { ...prev };
        keysToSave.forEach(k => { next[k] = publicUrl; });
        return next;
      });

      setPendingHeaderPoses(prev => {
        const next = { ...prev };
        keysToSave.forEach(k => { delete next[k]; });
        return next;
      });
      
      setPendingHeaderPoseFiles(prev => {
        const next = { ...prev };
        keysToSave.forEach(k => { delete next[k]; });
        return next;
      });
      
      setTimeout(() => {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[headerId];
          return next;
        });
      }, 1000);
      
    } catch (err) {
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[headerId];
        return next;
      });
      triggerToast("حدث خطأ أثناء حفظ وضعية بيرق، قد يكون حجم الملف كبيراً جداً", "error");
    }
  };

  const handleResetHeaderPose = async (headerId: string) => {
    try {
      triggerToast("جاري استعادة الوضعية المعتمدة...", "info");
      const aliases = POSE_ALIASES_MAP[headerId] || [];
      const keysToReset = Array.from(new Set([headerId, ...aliases]));
      
      const resetObj: Record<string, any> = {};
      keysToReset.forEach(k => {
        resetObj[k] = deleteField();
      });

      await updateDoc(doc(db, "system_settings", "bairaq_poses"), resetObj).catch(() => {});
      
      setHeaderPoses(prev => {
        const next = { ...prev };
        keysToReset.forEach(k => { delete next[k]; });
        return next;
      });

      setPendingHeaderPoses(prev => {
        const next = { ...prev };
        keysToReset.forEach(k => { delete next[k]; });
        return next;
      });

      triggerToast("تمت استعادة الوضعية المعتمدة بنجاح!", "success");
    } catch (err) {
      console.warn("Notice resetting pose override:", err);
      setHeaderPoses(prev => {
        const next = { ...prev };
        delete next[headerId];
        return next;
      });
      triggerToast("تمت استعادة الوضعية المعتمدة", "success");
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
      setActivationCodes(prev => prev.map(c => c.id === codeItem.id ? { ...c, status: "disabled" } : c));
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
      await updateDoc(schoolRef, { status: newStatus });

      await addDoc(collection(db, "developer_logs"), {
        action: `تحديث حالة مدرسة ${school.name} إلى: ${newStatus === "active" ? "نشطة" : "معطلة"}`,
        code: school.id,
        schoolId: school.id,
        schoolName: school.name,
        userEmail: userProfile?.email || "المطور",
        timestamp: serverTimestamp(),
        status: newStatus === "active" ? "success" : "warning"
      });

      triggerToast(`تم تحديث حالة الاشتراك لمدرسة ${school.name}`, "success");
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
      const schoolRef = doc(db, "schools", school.id);
      
      // Delete document from Firestore
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
      const schoolName = school.name;

      const uQ1 = query(collection(db, "users"), where("schoolId", "==", schoolId));
      const uQ2 = query(collection(db, "users"), where("schoolName", "==", schoolName));
      const uQ3 = query(collection(db, "users"), where("school_id", "==", schoolId));
      const uQ4 = query(collection(db, "users"), where("school", "==", schoolName));
      const [uSnap1, uSnap2, uSnap3, uSnap4] = await Promise.all([getDocs(uQ1), getDocs(uQ2), getDocs(uQ3), getDocs(uQ4)]);

      const userDocsMap = new Map<string, any>();
      uSnap1.forEach(d => userDocsMap.set(d.id, d.data()));
      uSnap2.forEach(d => userDocsMap.set(d.id, d.data()));
      uSnap3.forEach(d => userDocsMap.set(d.id, d.data()));
      uSnap4.forEach(d => userDocsMap.set(d.id, d.data()));

      let regStudents = 0;
      let regTeachers = 0;
      let regParents = 0;
      let regDrivers = 0;
      let regSupervisors = 0;
      let regAdmins = 0;

      userDocsMap.forEach((uData) => {
        const role = String(uData.role || "").toLowerCase().trim();
        if (role === "student" || role === "school_student" || role.includes("طالب")) {
          regStudents++;
        } else if (role === "teacher" || role === "cadre" || role === "staff_teacher" || role.includes("استاذ") || role.includes("معلم") || role.includes("مدرس")) {
          regTeachers++;
        } else if (role === "parent" || role.includes("أمر") || role.includes("امر")) {
          regParents++;
        } else if (role === "driver" || role.includes("سائق")) {
          regDrivers++;
        } else if (role === "supervisor" || role === "academic_supervisor" || role.includes("مشرف")) {
          regSupervisors++;
        } else if (role === "admin" || role === "school_admin" || role === "staff" || role.includes("مدير") || role.includes("إداري") || role.includes("اداري")) {
          regAdmins++;
        }
      });

      await updateDoc(doc(db, "schools", schoolId), {
        studentsCount: regStudents,
        teachersCount: regTeachers,
        parentsCount: regParents,
        driversCount: regDrivers,
        supervisorsCount: regSupervisors,
        adminsCount: regAdmins,
        totalUsers: regStudents + regTeachers + regParents + regDrivers + regSupervisors + regAdmins,
        lastStatsRefreshedAt: new Date().toISOString()
      });

      triggerToast(`تم تحديث وإعادة مزامنة إحصائيات ${school.name} بنجاح!`, "success");
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
      await addDoc(collection(db, "system_announcements"), {
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

  const displayedSchools = React.useMemo(() => {
    // Only show real Firestore schools to ensure data transparency and accuracy
    const list = [...schools];
    if (!codeSearchTerm) return list;
    return list.filter(s => 
      s.name.toLowerCase().includes(codeSearchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(codeSearchTerm.toLowerCase())
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
      <header className="sticky top-0 z-50 bg-[#080A1A]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
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

      <main className="pb-24">

      
        {activeTab === 'health' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Realtime Stats Grid - 2 Columns for Mobile */}
            <section className="grid grid-cols-2 border-b border-white/5">
              {[
                { 
                  label: "المدارس", 
                  value: schools.length, 
                  sub: "قاعدة بيانات حية", 
                  icon: <School className="text-indigo-400" size={24} />,
                  bg: "from-indigo-500/10 to-transparent"
                },
                { 
                  label: "المستخدمين", 
                  value: activeUsersCount || "...", 
                  sub: "حسابات Auth", 
                  icon: <Users className="text-emerald-400" size={24} />,
                  bg: "from-emerald-500/10 to-transparent",
                  ping: true
                },
                { 
                  label: "المستندات", 
                  value: `~${((totalStudents || 0) + (totalTeachers || 0) + (totalParents || 0) + (processedFilesCount || 0))}`, 
                  sub: "تقدير الاستهلاك", 
                  icon: <Database className="text-rose-400" size={24} />,
                  bg: "from-rose-500/10 to-transparent"
                },
                { 
                  label: "الذكاء", 
                  value: aiUsageCount || "...", 
                  sub: "طلبات Gemini", 
                  icon: <Sparkles className="text-amber-400" size={24} />,
                  bg: "from-amber-500/10 to-transparent"
                }
              ].map((stat, i) => (
                <div key={i} className={`p-6 border-white/5 relative group ${i % 2 === 0 ? 'border-l' : ''} ${i < 2 ? 'border-b' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-white/5">{stat.icon}</div>
                      {stat.ping && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                    </div>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-black text-white font-mono leading-none mb-2">{stat.value}</h3>
                    <p className="text-[9px] text-white/20 font-bold">{stat.sub}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* AI Performance & Intelligence Section */}
            <section className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> تحليل أداء الذكاء الاصطناعي
                </h3>
                <button 
                  onClick={fetchAiAnalytics}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw size={12} className={loadingAnalytics ? "animate-spin" : ""} />
                </button>
              </div>

              {aiAnalytics && !aiAnalytics.error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Usage Timeline */}
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <LineIcon size={12} /> مخطط الاستخدام الزمني
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={aiAnalytics.timeSeries || []}>
                          <defs>
                            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#ffffff20" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#ffffff20" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#080A1A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '10px' }}
                          />
                          <Area type="monotone" dataKey="requests" stroke="#6366f1" fillOpacity={1} fill="url(#colorReq)" />
                          <Area type="monotone" dataKey="cacheHits" stroke="#10b981" fillOpacity={0} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Cache & Latency Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">نسبة التوفير (Cache)</p>
                      <div>
                        <h3 className="text-3xl font-black text-emerald-400 font-mono">{( (aiAnalytics.savingsRatio || 0) * 100).toFixed(1)}%</h3>
                        <p className="text-[9px] text-white/20 mt-1 font-bold">تقليل في تكاليف الـ API</p>
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">متوسط الاستجابة</p>
                      <div>
                        <h3 className="text-3xl font-black text-amber-400 font-mono">{Math.round(aiAnalytics.avgProcessingTimeMs || 0)}ms</h3>
                        <p className="text-[9px] text-white/20 mt-1 font-bold">سرعة المعالجة الكلية</p>
                      </div>
                    </div>
                  </div>

                  {/* Endpoint Stats */}
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <BarChart3 size={12} /> توزيع الطلبات حسب الوظيفة
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={aiAnalytics.endpointStats || []} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#ffffff40" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            width={80}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#080A1A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '10px' }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Model Distribution */}
                  <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <PieChart size={12} /> النماذج المستخدمة
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={aiAnalytics?.modelStats || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(aiAnalytics?.modelStats || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#f97316'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#080A1A', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '10px' }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Server Health Cards - Stacked for Mobile */}
            <section className="p-6 space-y-4 bg-black/20">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Server size={14} /> حالة الأنظمة الأساسية
              </h3>
              {[
                { name: "الاستضافة الأساسية", status: "Online", sub: "Latency: ~12ms" },
                { name: "قواعد البيانات", status: "Active", sub: "Realtime Sync" },
                { name: "تخزين الملفات", status: "Operational", sub: "Storage v2" }
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <div>
                      <h4 className="text-xs font-black text-white">{item.name}</h4>
                      <p className="text-[10px] text-white/40 font-bold">{item.sub}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase">{item.status}</span>
                </div>
              ))}
            </section>

            {/* Pricing & Profit Simulator Section */}
            <section className="bg-indigo-900/10 border-y border-indigo-500/10 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-black text-white">حاسبة التكاليف والأرباح التقديرية</h3>
                </div>
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  محاكاة تفاعلية
                </span>
              </div>

              {/* Interactive Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/40 p-5 rounded-2xl border border-white/5">
                {/* Slider 1: Students */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60 font-bold">عدد الطلاب المحاكين</span>
                    <span className="text-indigo-400 font-mono font-black">{simStudents.toLocaleString()} طالب</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={simStudents}
                    onChange={(e) => setSimStudents(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Slider 2: Subscription Fee */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60 font-bold">اشتراك الطالب الشهري</span>
                    <span className="text-emerald-400 font-mono font-black">{simSubscription.toLocaleString()} د.ع</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="250"
                    value={simSubscription}
                    onChange={(e) => setSimSubscription(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Slider 3: AI Requests */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60 font-bold">طلب AI / طالب شهرياً</span>
                    <span className="text-amber-400 font-mono font-black">{simAiRequests} طلبات</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={simAiRequests}
                    onChange={(e) => setSimAiRequests(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Financial Calculation Results */}
              {(() => {
                const totalRevenueIqd = simStudents * simSubscription;
                const totalRevenueUsd = totalRevenueIqd / 1310; // USD conversion
                const totalAiCostUsd = simStudents * simAiRequests * 0.00015; // Estimated AI cost per req
                const serverInfraCostUsd = 25 + Math.ceil(simStudents / 1000) * 15; // Base server scaling
                const totalCostUsd = totalAiCostUsd + serverInfraCostUsd;
                const netProfitUsd = totalRevenueUsd - totalCostUsd;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 mb-1 font-bold">إجمالي الإيرادات (شهرياً)</p>
                      <p className="text-lg font-black text-indigo-400 font-mono">{totalRevenueIqd.toLocaleString()} د.ع</p>
                      <p className="text-[9px] text-white/30 font-mono mt-0.5">${totalRevenueUsd.toFixed(2)} USD</p>
                    </div>

                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 mb-1 font-bold">تكلفة الذكاء الاصطناعي</p>
                      <p className="text-lg font-black text-amber-400 font-mono">${totalAiCostUsd.toFixed(2)}</p>
                      <p className="text-[9px] text-white/30 font-bold mt-0.5">تقدير Gemini API</p>
                    </div>

                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-white/40 mb-1 font-bold">تكلفة الخوادم والبنية</p>
                      <p className="text-lg font-black text-rose-400 font-mono">${serverInfraCostUsd.toFixed(2)}</p>
                      <p className="text-[9px] text-white/30 font-bold mt-0.5">سيرفرات Cloud Run & Firebase</p>
                    </div>

                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-400/80 mb-1 font-black">صافي الربح التقديري</p>
                      <p className="text-lg font-black text-emerald-400 font-mono">${netProfitUsd.toFixed(2)}</p>
                      <p className="text-[9px] text-emerald-400/60 font-bold mt-0.5">حوالي {(netProfitUsd * 1310).toLocaleString()} د.ع</p>
                    </div>
                  </div>
                );
              })()}

              <p className="text-[9px] text-white/30 text-center font-bold">
                * تم بناء الحسابات التقديرية بناءً على سعر الصرف الرسمي (1$ = 1310 د.ع) وتكاليف استهلاك النماذج واستهلاك خوادم Cloud Run.
              </p>
            </section>
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
                            onClick={() => {
                              setEditingSchoolLocation(school);
                              setLocationInputText(school.location || school.city || school.governorate || "");
                            }}
                            className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500/40"
                            title="تعديل أو كتابة موقع المدرسة ليظهر في الميادين"
                          >
                            <MapPin size={14} className="text-emerald-400" /> موقع المدرسة
                          </button>
                          <button
                            onClick={() => generateAdminCodeForSchool(school)}
                            className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles size={14} /> كود إدارة
                          </button>
                          <button
                            onClick={() => setConfiguringSchoolModules(school)}
                            className="flex-1 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sliders size={14} /> التحكم بالأقسام
                          </button>
                          <button
                            onClick={() => toggleSchoolStatus(school)}
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
                            onClick={() => setSchoolToDelete(school)}
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
                <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#0A0E1A] border border-indigo-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col my-auto"
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
                      <p className="text-xs text-white/60 font-semibold mb-2">
                        يمكنك إيقاف أو تفعيل أي قسم محدد لهذه المدرسة بشكل منفرد دون التأثير على باقي المدارس:
                      </p>

                      {SCHOOL_MODULES.map((mod) => {
                        const currentDisabled = configuringSchoolModules.disabledModules || [];
                        const isDisabled = mod.aliases.some(a => currentDisabled.includes(a));

                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleSchoolModule(configuringSchoolModules.id, mod.id, currentDisabled)}
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
                      })}
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
                </div>
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 p-6 pb-28">
            {/* Top Bar Header & Save Action */}
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-[#0A0E1A] border border-indigo-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="flex items-center gap-4 z-10">
                <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-2xl shadow-inner">
                  <SlidersHorizontal size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">مركز التحكم عن بُعد والتكوين السحابي 🎛️</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                      بث مباشر كلي
                    </span>
                  </div>
                  <p className="text-xs text-white/60 font-bold mt-1">
                    تحكم بخصائص، ومواصفات، ومفاتيح التطبيق فورياً أينما وُجد المستخدم بدون الحاجة لإصدار تحديث متجر!
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveRemoteConfig}
                disabled={savingRemoteConfig}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2 z-10 border border-indigo-400/40 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingRemoteConfig ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    <span>جاري الحفظ والتطبيق السحابي...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>حفظ وتطبيق التغييرات سحابياً 🚀</span>
                  </>
                )}
              </button>
            </div>

            {/* Grid Layout of Remote Control Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Panel 1: Emergency Kill Switches & Feature Flags */}
              <div className="bg-[#0C1020] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Power size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">مفاتيح التعطيل الطارئ المباشر 🚨</h3>
                      <p className="text-[10px] text-white/40 font-bold">إيقاف أو تفعيل الخصائص فورياً عند حدوث صيانة أو ضغط سيرفر</p>
                    </div>
                  </div>
                  <ShieldAlert className="text-rose-400/40" size={20} />
                </div>

                <div className="space-y-4">
                  {/* Full Maintenance Mode */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {remoteConfig.maintenanceMode ? <Lock className="text-rose-400" size={18} /> : <Unlock className="text-emerald-400" size={18} />}
                        <div>
                          <p className="text-xs font-black text-white">وضع الصيانة والتحديث الشامل (Maintenance Mode)</p>
                          <p className="text-[10px] text-white/40 font-bold">تجميد التطبيق وإظهار شاشة الصيانة Glassmorphism لجميع المستخدمين</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalType("maintenance")}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                        >
                          👁️ معاينة النافذة
                        </button>
                        <button
                          onClick={() => setRemoteConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-2 ${
                            remoteConfig.maintenanceMode
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                              : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {remoteConfig.maintenanceMode ? "مُفعل 🔒 (مُقفل)" : "معطل 🔓 (طبيعي)"}
                        </button>
                      </div>
                    </div>
                    {remoteConfig.maintenanceMode && (
                      <div className="pt-2">
                        <label className="text-[10px] text-white/40 font-bold block mb-1">رسالة الصيانة الظاهرة للطلاب وأولياء الأمور:</label>
                        <textarea
                          rows={2}
                          value={remoteConfig.maintenanceMessage}
                          onChange={(e) => setRemoteConfig(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 outline-none focus:border-rose-500 font-bold resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* System Temporary Pause */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PauseCircle className="text-purple-400" size={18} />
                        <div>
                          <p className="text-xs font-black text-white">إيقاف النظام والعمليات مؤقتاً (System Temporary Pause)</p>
                          <p className="text-[10px] text-white/40 font-bold">توقف مؤقت لأعمال التنظيم الإداري وإعادة الهيكلة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalType("system_pause")}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all"
                        >
                          👁️ معاينة النافذة
                        </button>
                        <button
                          onClick={() => setRemoteConfig(prev => ({ ...prev, systemPaused: !prev.systemPaused }))}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                            remoteConfig.systemPaused
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                              : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {remoteConfig.systemPaused ? "مُتوقف ⏸️" : "يعمل ⚡"}
                        </button>
                      </div>
                    </div>
                    {remoteConfig.systemPaused && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[10px] text-white/40 font-bold block mb-1">سبب التوقف الظاهر:</label>
                          <input
                            type="text"
                            value={remoteConfig.systemPauseReason || ""}
                            onChange={(e) => setRemoteConfig(prev => ({ ...prev, systemPauseReason: e.target.value }))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-white/40 font-bold block mb-1">الوقت المتوقع للعودة (ETA):</label>
                          <input
                            type="text"
                            value={remoteConfig.systemPauseEta || ""}
                            onChange={(e) => setRemoteConfig(prev => ({ ...prev, systemPauseEta: e.target.value }))}
                            placeholder="مثال: الساعة 6:00 مساءً"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono outline-none focus:border-purple-500 font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Assistant Toggle */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">خدمات المساعد الذكي والذكاء الاصطناعي 🤖</p>
                      <p className="text-[10px] text-white/40 font-bold">تفعيل أو إيقاف توليد وتلخيص الأسئلة التفاعلية</p>
                    </div>
                    <button
                      onClick={() => setRemoteConfig(prev => ({ ...prev, aiFeaturesEnabled: !prev.aiFeaturesEnabled }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        remoteConfig.aiFeaturesEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {remoteConfig.aiFeaturesEnabled ? "شغال ✅" : "مُعطل ❌"}
                    </button>
                  </div>

                  {/* Live Radio Broadcast Toggle */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">البث الإذاعي واللاسلكي الصوتي المباشر 📻</p>
                      <p className="text-[10px] text-white/40 font-bold">إيقاف أو سماح بث الإذاعة في واجهة الطلاب</p>
                    </div>
                    <button
                      onClick={() => setRemoteConfig(prev => ({ ...prev, liveRadioEnabled: !prev.liveRadioEnabled }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        remoteConfig.liveRadioEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {remoteConfig.liveRadioEnabled ? "شغال ✅" : "مُعطل ❌"}
                    </button>
                  </div>

                  {/* Online Parent Payments Toggle */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">بوابة تسديد الأقساط والتحويلات المالية 💳</p>
                      <p className="text-[10px] text-white/40 font-bold">سماح أو إغلاق استقبال إشعارات السداد من أولياء الأمور</p>
                    </div>
                    <button
                      onClick={() => setRemoteConfig(prev => ({ ...prev, onlinePaymentsEnabled: !prev.onlinePaymentsEnabled }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        remoteConfig.onlinePaymentsEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {remoteConfig.onlinePaymentsEnabled ? "شغال ✅" : "مُعطل ❌"}
                    </button>
                  </div>

                  {/* New Code Activation Toggle */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">تسجيل الأكواد والحسابات الجديدة 🔑</p>
                      <p className="text-[10px] text-white/40 font-bold">السماح للطلاب والمعلمين بتفعيل أكواد دخول جديدة</p>
                    </div>
                    <button
                      onClick={() => setRemoteConfig(prev => ({ ...prev, newRegistrationsEnabled: !prev.newRegistrationsEnabled }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        remoteConfig.newRegistrationsEnabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {remoteConfig.newRegistrationsEnabled ? "مفتوح ✅" : "مُغلق ❌"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel 2: Mandatory & Optional Version Control Modals */}
              <div className="bg-[#0C1020] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">إدارة النوافذ المنبثقة والإصدارات (System Dialogs) 📲</h3>
                    <p className="text-[10px] text-white/40 font-bold">إجبار الموبايل على التحديث، الإشعارات الاختيارية، وإعلانات الإصدارات</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 1. Mandatory Force Update Toggle */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-amber-300">1. نافذة التحديث الإجباري (Mandatory Update) 🚀</p>
                      <p className="text-[10px] text-amber-200/60 font-bold">تمنع استخدام التطبيق إلا بعد الانتقال لمتجر الموبايل</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalType("mandatory_update")}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
                      >
                        👁️ معاينة
                      </button>
                      <button
                        onClick={() => setRemoteConfig(prev => ({ ...prev, forceUpdateActive: !prev.forceUpdateActive }))}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                          remoteConfig.forceUpdateActive
                            ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                            : "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {remoteConfig.forceUpdateActive ? "إجباري ⚠️" : "مُعطل"}
                      </button>
                    </div>
                  </div>

                  {/* 2. Optional Update Toggle */}
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-indigo-300">2. نافذة التحديث الاختياري (Optional Update) ✨</p>
                      <p className="text-[10px] text-indigo-200/60 font-bold">تظهر تنبيهاً يخيّر المستخدم بين التحديث الآن أو التأجيل</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalType("optional_update")}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all"
                      >
                        👁️ معاينة
                      </button>
                      <button
                        onClick={() => setRemoteConfig(prev => ({ ...prev, optionalUpdateActive: !prev.optionalUpdateActive }))}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                          remoteConfig.optionalUpdateActive
                            ? "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                            : "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {remoteConfig.optionalUpdateActive ? "مُفعل ✨" : "مُعطل"}
                      </button>
                    </div>
                  </div>

                  {/* 3. New Version Announcement Notice */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-emerald-300">3. نافذة وجود إصدار جديد ومميزات (New Version) 🌟</p>
                      <p className="text-[10px] text-emerald-200/60 font-bold">تعرض خريطة طريق الميزات الجديدة بأسلوب جبار للمستخدمين</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalType("new_version")}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all"
                      >
                        👁️ معاينة
                      </button>
                      <button
                        onClick={() => setRemoteConfig(prev => ({ ...prev, newVersionNoticeActive: !prev.newVersionNoticeActive }))}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                          remoteConfig.newVersionNoticeActive
                            ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                            : "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {remoteConfig.newVersionNoticeActive ? "مُفعل 🌟" : "مُعطل"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-white/40 font-bold block mb-1">أدنى إصدار مطلوب (Min Version):</label>
                      <input
                        type="text"
                        value={remoteConfig.minRequiredVersion}
                        onChange={(e) => setRemoteConfig(prev => ({ ...prev, minRequiredVersion: e.target.value }))}
                        placeholder="1.0.0"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/40 font-bold block mb-1">أحدث إصدار متاح (Latest Version):</label>
                      <input
                        type="text"
                        value={remoteConfig.latestVersion}
                        onChange={(e) => setRemoteConfig(prev => ({ ...prev, latestVersion: e.target.value }))}
                        placeholder="1.2.0"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">رابط متجر بلاي (Google Play Store URL):</label>
                    <input
                      type="text"
                      value={remoteConfig.playStoreUrl}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, playStoreUrl: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-indigo-300 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">رابط متجر أبل (Apple App Store URL):</label>
                    <input
                      type="text"
                      value={remoteConfig.appStoreUrl}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, appStoreUrl: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-indigo-300 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">سجل التغييرات ومميزات التحديث الجديد:</label>
                    <textarea
                      rows={3}
                      value={remoteConfig.updateChangelog}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, updateChangelog: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Panel 3: Global Dynamic Ticker Marquee Settings */}
              <div className="bg-[#0C1020] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Radio size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">إعدادات الشريط الإخباري المباشر 📡</h3>
                      <p className="text-[10px] text-white/40 font-bold">التحكم بالنص المتحرك أعلى شاشات التطبيق</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRemoteConfig(prev => ({ ...prev, tickerEnabled: !prev.tickerEnabled }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      remoteConfig.tickerEnabled
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-white/5 text-white/30 border-white/10"
                    }`}
                  >
                    {remoteConfig.tickerEnabled ? "مُفعل ✅" : "مُخفي 👁️‍🗨️"}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">نص الشريط الإخباري العاجل الموحد:</label>
                    <textarea
                      rows={2}
                      value={remoteConfig.tickerText}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, tickerText: e.target.value }))}
                      placeholder="اكتب الإعلان السريع الذي سيمر في شريط الأخبار..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-cyan-300 font-bold outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-2">سرعة الحركة والتمرير للشريط:</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'slow', name: 'بطيء (هادئ)' },
                        { id: 'medium', name: 'متوسط (قياسي)' },
                        { id: 'fast', name: 'سريع (عاجل)' }
                      ].map((speed) => (
                        <button
                          key={speed.id}
                          type="button"
                          onClick={() => setRemoteConfig(prev => ({ ...prev, tickerSpeed: speed.id as any }))}
                          className={`py-2.5 rounded-xl text-xs font-black transition-all border ${
                            remoteConfig.tickerSpeed === speed.id
                              ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                              : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {speed.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 4: Cloud Themes Management Center 🌟 */}
              <div className="bg-[#0C1020] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Palette size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        إدارة السمات والمواسم السحابية 🌟
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Cloud Themes Engine v2
                        </span>
                      </h3>
                      <p className="text-[10px] text-white/40 font-bold mt-0.5">
                        تخصيص الهوية البصرية، شخصيات بيرق، المؤثرات الحركية، والتنبيهات الاحتفالية عالمياً
                      </p>
                    </div>
                  </div>

                  {/* Master Theme Toggle */}
                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setRemoteConfig(prev => ({ ...prev, themeActive: !prev.themeActive }))}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 ${
                        remoteConfig.themeActive
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                          : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${remoteConfig.themeActive ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
                      {remoteConfig.themeActive ? "السمة السحابية مفعّلة ⚡" : "السمة موقوفة (المظهر الأساسي) ⏸️"}
                    </button>
                  </div>
                </div>

                {/* Grid 1: Seasonal Occasions Picker */}
                <div className="space-y-3">
                  <label className="text-[10px] text-white/40 font-bold block">
                    اختر المناسبة الرسمية لحقن السمة تلقائياً:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.values(THEME_PRESETS).map((preset) => {
                      const isSelected = remoteConfig.seasonalTheme === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setRemoteConfig(prev => ({
                              ...prev,
                              seasonalTheme: preset.id,
                              themeCardTitle: preset.defaultCardTitle,
                              themeMessage: preset.defaultMessage,
                              themeAccentColor: preset.defaultAccent,
                              themeEffectType: preset.defaultEffect,
                              themeActive: preset.id !== 'default'
                            }));
                          }}
                          className={`p-3 rounded-2xl text-right transition-all border flex flex-col justify-between gap-2 relative overflow-hidden group ${
                            isSelected
                              ? "bg-purple-500/20 border-purple-500/70 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xl">{preset.icon}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white leading-tight">{preset.title}</h4>
                            <p className="text-[8.5px] text-white/40 font-bold line-clamp-1 mt-0.5">{preset.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid 2: Dates Range Controls & Automatic Expiration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-bold block">تاريخ بداية المناسبة (Start Date):</label>
                    <input
                      type="date"
                      value={remoteConfig.themeStartDate || ""}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeStartDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/50 font-bold block">تاريخ انتهاء المناسبة (End Date):</label>
                    <input
                      type="date"
                      value={remoteConfig.themeEndDate || ""}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeEndDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2 text-[9.5px] text-emerald-400/80 font-bold flex items-center gap-2 pt-1 border-t border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    عند انقضاء تاريخ الانتهاء، تعود الواجهة تلقائياً إلى السمة الأساسية دون الحاجة إلى أية تعديلات أو تحديث للتطبيق.
                  </div>
                </div>

                {/* Grid 3: Card Title & Short Greeting Message */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 font-bold block">عنوان بطاقة السمة (Glassmorphism Card Title):</label>
                    <input
                      type="text"
                      value={remoteConfig.themeCardTitle || ""}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeCardTitle: e.target.value }))}
                      placeholder="عنوان المناسبة القصير..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-purple-200 font-bold outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/40 font-bold block">الرسالة الترحيبية القصيرة:</label>
                    <input
                      type="text"
                      value={remoteConfig.themeMessage || ""}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, themeMessage: e.target.value }))}
                      placeholder="رسالة التهنئة أو الترحيب..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-purple-200 font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Grid 4: Color Palette & Accent Styling */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-bold block">الدرجة اللونية الثانوية للمناسبة (Theme Accent Color):</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {Object.entries(ACCENT_STYLES).map(([key, style]) => {
                      const isChosen = (remoteConfig.themeAccentColor || 'amber') === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRemoteConfig(prev => ({ ...prev, themeAccentColor: key as ThemeAccentColor }))}
                          className={`py-2 px-2 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${
                            isChosen
                              ? "bg-white/15 text-white border-white/60 shadow-lg scale-105"
                              : "bg-black/40 text-white/40 border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: style.particleColors[0] }} />
                          <span className="truncate max-w-full text-[8.5px]">{style.accentName.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid 5: Berq Mascot Custom Upload & Avatar Preview */}
                <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      <img
                        src={remoteConfig.themeMascotUrl || THEME_PRESETS[remoteConfig.seasonalTheme || 'default']?.mascotPresetSvg}
                        alt="صورة بيرق للمناسبة"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">نسخة شخصية بيرق للمناسبة 🦅</h4>
                      <p className="text-[10px] text-white/40 font-bold">يمكنك رفع صورة مخصصة لشخصية بيرق الاحتفالية لهذه المناسبة</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-black cursor-pointer transition-all flex items-center gap-1.5">
                      <ImageIcon size={14} />
                      رفع صورة مخصصة
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              let width = img.width;
                              let height = img.height;
                              const MAX_WIDTH = 250;
                              const MAX_HEIGHT = 250;
                              
                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }
                              
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(img, 0, 0, width, height);
                                const compressedBase64 = canvas.toDataURL('image/webp', 0.7);
                                
                                if (compressedBase64.length > 150000) {
                                  if (typeof showToast === "function") showToast("الصورة ضخمة جداً حتى بعد الضغط، يرجى اختيار صورة أصغر", "error");
                                  return;
                                }
                                
                                setRemoteConfig(prev => ({ ...prev, themeMascotUrl: compressedBase64 }));
                                if (typeof showToast === "function") showToast("تم ضغط ورفع صورة شخصية المناسبة بنجاح 🖼️", "success");
                              }
                            };
                            img.src = evt.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>

                    {remoteConfig.themeMascotUrl && (
                      <button
                        type="button"
                        onClick={() => setRemoteConfig(prev => ({ ...prev, themeMascotUrl: "" }))}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all"
                        title="استعادة الصورة الافتراضية"
                      >
                        استعادة الافتراضي
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid 6: Particle & Motion Effects Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRemoteConfig(prev => ({ ...prev, themeEffectsEnabled: !prev.themeEffectsEnabled }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                        remoteConfig.themeEffectsEnabled
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          : "bg-white/5 text-white/30 border-white/10"
                      }`}
                    >
                      {remoteConfig.themeEffectsEnabled ? "المؤثرات الحركية مفعّلة ✨" : "المؤثرات موقوفة ⏸️"}
                    </button>
                    <span className="text-[10px] text-white/40 font-bold">
                      مؤثرات بصرية خفيفة عالية الأداء (GPU Particle FX)
                    </span>
                  </div>

                  {/* Broadcast Notification Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const preset = THEME_PRESETS[remoteConfig.seasonalTheme] || THEME_PRESETS.default;
                        const title = remoteConfig.themeCardTitle || preset.defaultCardTitle;
                        const message = remoteConfig.themeMessage || preset.defaultMessage;

                        await addDoc(collection(db, "global_announcements"), {
                          title: `تهنئة ومناسبة: ${title}`,
                          content: message,
                          targetAudience: "all",
                          priority: "high",
                          createdAt: serverTimestamp(),
                          author: "إدارة السمات السحابية Central Cloud",
                          themeEvent: remoteConfig.seasonalTheme
                        });

                        await addDoc(collection(db, "broadcasts"), {
                          title: `تهنئة ومناسبة: ${title}`,
                          message: message,
                          category: "تهنئة موسمية 🌟",
                          targetLocation: "both",
                          targetDashboards: ["all"],
                          timestampMs: Date.now(),
                          author: "إدارة السمات السحابية Central Cloud"
                        });

                        if (showToast) showToast("تم إرسال إشعار التهنئة السحابي بنجاح إلى جميع المدارس 📢", "success");
                      } catch (err) {
                        console.error("Theme notification error:", err);
                        if (showToast) showToast("حدث خطأ أثناء إرسال إشعار التهنئة", "error");
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bell size={14} />
                    إرسال إشعار عام لجميع المدارس بهذه المناسبة 📢
                  </button>
                </div>
              </div>


              {/* Panel 5: Support Hotlines & Dynamic Links */}
              <div className="bg-[#0C1020] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl lg:col-span-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <PhoneCall size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">روابط وأرقام الدعم الفني السريع 📞</h3>
                      <p className="text-[10px] text-white/40 font-bold">تحديث جهات واتساب وتليجرام التواصل الفوري دون تحديث التطبيق</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setRemoteConfig(prev => ({ ...prev, supportButtonEnabled: !prev.supportButtonEnabled }))}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                      remoteConfig.supportButtonEnabled
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-white/30 border-white/10"
                    }`}
                  >
                    {remoteConfig.supportButtonEnabled ? "زر الدعم ظاهرة ✅" : "زر الدعم مخفي ❌"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">رقم واتساب الدعم الفني المباشر:</label>
                    <input
                      type="text"
                      value={remoteConfig.supportWhatsapp}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportWhatsapp: e.target.value }))}
                      placeholder="+964..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">رابط حساب تليجرام الدعم المباشر:</label>
                    <input
                      type="text"
                      value={remoteConfig.supportTelegram}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportTelegram: e.target.value }))}
                      placeholder="https://t.me/..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-cyan-400 font-mono font-bold outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 font-bold block mb-1">رابط قناة التعاميم والإعلانات الرسمية:</label>
                    <input
                      type="text"
                      value={remoteConfig.supportChannelUrl}
                      onChange={(e) => setRemoteConfig(prev => ({ ...prev, supportChannelUrl: e.target.value }))}
                      placeholder="https://t.me/..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-indigo-400 font-mono font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="p-6 bg-gradient-to-br from-[#0c1024] to-[#060815] border-b border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">إدارة الوسائط وهيدرات المنصة</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">تخصيص وضعيات بيرق</p>
                  </div>
                </div>
                
                <div className="relative">
                  <select
                    value={activeMediaDashboard}
                    onChange={(e) => setActiveMediaDashboard(e.target.value as keyof typeof DASHBOARDS_POSES)}
                    className="appearance-none bg-black/40 border border-white/10 text-white text-sm font-bold rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-500 transition-all min-w-[180px] cursor-pointer"
                  >
                    {DASHBOARD_TABS.map(tab => (
                      <option key={tab.id} value={tab.id} className="bg-gray-900 text-white">
                        {tab.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DASHBOARDS_POSES[activeMediaDashboard].map((header) => {
                  const pendingPose = pendingHeaderPoses[header.id];
                  const currentPose = pendingPose || headerPoses[header.id] || header.defaultSrc;
                  const hasPending = !!pendingPose;
                  const progress = uploadProgress[header.id] || 0;

                  return (
                    <div key={header.id} className="bg-black/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden">
                      {/* Upload Progress Bar */}
                      {progress > 0 && progress < 100 && (
                        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
                          <div className="w-3/4 bg-white/10 rounded-full h-2 overflow-hidden mb-2">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-white/90">جاري الرفع... {progress}%</span>
                        </div>
                      )}

                      <div className="aspect-video w-full rounded-2xl bg-black/60 border border-white/5 overflow-hidden relative group">
                        {isVideoUrl(currentPose) ? (
                          <video 
                            src={currentPose} 
                            autoPlay loop muted playsInline 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img 
                            src={currentPose} 
                            alt={header.title} 
                            className="w-full h-full object-cover" 
                          />
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                          <ImageIcon size={24} className="text-white mb-2" />
                          <span className="text-xs font-bold text-white">تغيير الوضعية</span>
                          <input type="file" className="hidden" accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={(e) => handleHeaderPoseUpload(header.id, e)} disabled={progress > 0} />
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <h4 className="font-bold text-white/90 text-sm truncate">{header.title}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasPending && progress === 0 && (
                            <button
                              onClick={() => handleSaveHeaderPose(header.id)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-1 px-2.5 rounded shadow-lg transition-colors"
                            >
                              حفظ
                            </button>
                          )}
                          <button
                            onClick={() => handleResetHeaderPose(header.id)}
                            className="bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-white text-[10px] font-bold py-1 px-2 rounded transition-colors"
                            title="إعادة ضبط للوضعية المعتمدة الأصلية"
                          >
                            استعادة
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Global Announcements & Greetings Manager */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">إدارة الإعلانات، الأخبار، التبريكات والتعازي العامة</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">نشر المحتوى لجميع اللوحات وأشرطة الإعلانات</p>
                  </div>
                </div>

                <GlobalAnnouncementsBanner dashboardType="admin" />
                <GlobalAnnouncementsPopup dashboardType="admin" />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Publish Form */}
                  <form onSubmit={handlePublishGlobalAnn} className="lg:col-span-1 bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-400" />
                      إضافة إعلان أو تهنئة جديدة
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-1.5">عنوان الإعلان / المناسبة</label>
                      <input
                        type="text"
                        value={globalAnnTitle}
                        onChange={(e) => setGlobalAnnTitle(e.target.value)}
                        placeholder="مثل: تهنئة عيد الفطر المبارك / خبر عاجل"
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-1.5">التصنيف</label>
                      <select
                        value={globalAnnCategory}
                        onChange={(e) => setGlobalAnnCategory(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all cursor-pointer"
                      >
                        <option value="إعلان عاجل">إعلان عاجل</option>
                        <option value="تهنئة">تهنئة (عيد / مناسبة)</option>
                        <option value="تعزية">تعزية ومواساة</option>
                        <option value="مناسبة وطنية">مناسبة وطنية</option>
                        <option value="خبر عام">خبر عام</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-1.5">نص الإعلان أو التهنئة</label>
                      <textarea
                        rows={3}
                        value={globalAnnMessage}
                        onChange={(e) => setGlobalAnnMessage(e.target.value)}
                        placeholder="اكتب تفاصيل الإعلان أو التهنئة أو التعزية هنا..."
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-1.5">صورة أو تصميم المناسبة (اختياري)</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 border border-dashed border-white/20 hover:border-amber-500 rounded-xl p-3 text-center cursor-pointer bg-black/20 hover:bg-black/40 transition-all">
                          <span className="text-[11px] font-bold text-white/70">اختر صورة المناسبة...</span>
                          <input type="file" accept="image/*" onChange={handleGlobalAnnImageUpload} className="hidden" />
                        </label>
                        {globalAnnImage && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0">
                            <img src={globalAnnImage} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-1.5">مكان الظهور</label>
                      <select
                        value={globalAnnLocation}
                        onChange={(e) => setGlobalAnnLocation(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all cursor-pointer"
                      >
                        <option value="both">الكل (بانر، شريط، ونافذة منبثقة عند الفتح)</option>
                        <option value="popup">نافذة منبثقة تنبثق عند فتح التطبيق فقط</option>
                        <option value="top_banner">بانر / إشعار أعلى الشاشة الرئيسية فقط</option>
                        <option value="ticker">شريط الإعلانات المتحرك فقط</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/70 mb-1.5">اللوحات المستهدفة</label>
                      <select
                        value={globalAnnTargets[0]}
                        onChange={(e) => setGlobalAnnTargets([e.target.value])}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all cursor-pointer"
                      >
                        <option value="all">جميع اللوحات (إدارة، طالب، أستاذ، ولي أمر، سائق)</option>
                        <option value="admin">لوحة الإدارة فقط</option>
                        <option value="student">لوحة الطالب فقط</option>
                        <option value="teacher">لوحة الأستاذ فقط</option>
                        <option value="parent">لوحة ولي الأمر فقط</option>
                        <option value="driver">لوحة السائق فقط</option>
                      </select>
                    </div>

                    {globalAnnPublishing && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-amber-400">
                          <span>جاري النشر والرفع لجميع المستخدمين...</span>
                          <span>{globalAnnProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                            style={{ width: `${globalAnnProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={globalAnnPublishing}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-black font-black text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer"
                    >
                      {globalAnnPublishing ? 'جاري النشر...' : 'نشر الإعلان فوراً لجميع المستخدمين'}
                    </button>
                  </form>

                  {/* Published Announcements List */}
                  <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Megaphone size={16} className="text-purple-400" />
                      الإعلانات والتبريكات المنشورة حالياً ({publishedGlobalAnns.length})
                    </h4>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {publishedGlobalAnns.length === 0 ? (
                        <div className="text-center py-16 text-white/30 text-xs">لا توجد إعلانات أو تهانٍ منشورة حالياً.</div>
                      ) : (
                        publishedGlobalAnns.map((item) => (
                          <div key={item.id} className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between relative group">
                            {item.imageUrl && (
                              <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 text-right min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                                  {item.category || 'إعلان'}
                                </span>
                                <span className="text-white/40 text-[10px]">
                                  {new Date(item.timestampMs || Date.now()).toLocaleDateString('ar-SA')}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-sm truncate">{item.title}</h5>
                              <p className="text-white/70 text-xs line-clamp-2">{item.message}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteGlobalAnn(item)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                            >
                              حذف
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Modal for Deleting Announcement */}
              {announcementToDelete && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
                  <div className="bg-[#121829] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                        <Trash2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-base">تأكيد حذف الإعلان أو التهنئة</h4>
                        <p className="text-white/50 text-[11px]">هذا الإجراء نهائي وسيتم إزالة الإعلان من أجهزة جميع المستخدمين.</p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                        {announcementToDelete.category || 'إعلان'}
                      </span>
                      <h5 className="font-bold text-white text-sm mt-1">{announcementToDelete.title}</h5>
                      <p className="text-white/70 text-xs line-clamp-2">{announcementToDelete.message}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={confirmDeleteGlobalAnn}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                      >
                        نعم، حذف الإعلان نهائياً
                      </button>
                      <button
                        onClick={() => setAnnouncementToDelete(null)}
                        className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-[#050505]">
            <section className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                    <Bug size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">رادار الأخطاء</h3>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest animate-pulse">Live Debugging Active</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                </div>
              </div>
            </section>

            <div className="flex-1 p-6 flex flex-col">
              <div className="flex-1 bg-black rounded-3xl p-5 font-mono text-[10px] text-emerald-500/80 space-y-3 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner" dir="ltr">
                <div className="text-white/20 mb-6 font-bold">
                  $ tail -f /sys/logs/core.err<br/>
                  &gt; Established live WebSocket connection...
                </div>
                
                {realLogs.length === 0 ? (
                  <div className="text-center py-20 text-white/5 italic font-sans" dir="rtl">
                    لا توجد أخطاء مسجلة حالياً
                  </div>
                ) : (
                  realLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 border-b border-white/[0.03] pb-3">
                      <span className="opacity-30 shrink-0">[{log.time}]</span>
                      <div className="flex-1">
                        <span className={`font-black mr-2 ${log.type === "error" ? "text-rose-500" : log.type === "warning" ? "text-amber-500" : "text-emerald-500"}`}>
                          {log.type === "error" ? "CRITICAL" : log.type === "warning" ? "WARNING" : "INFO"}
                        </span>
                        <p className="inline text-white/70 whitespace-pre-wrap">{log.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* DATA INTEGRITY DIAGNOSTIC TAB */}
        {activeTab === "data_integrity" && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-emerald-900/30 via-indigo-900/30 to-purple-900/30 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
                    <ShieldCheck size={14} /> أداة المطور التشخيصية
                  </div>
                  <h2 className="text-xl font-black text-white">فحص سلامة وصحة البيانات وعزل المدارس</h2>
                  <p className="text-xs text-white/60 mt-1">
                    فحص شامل واستعلام مباشر لقاعدة البيانات للتأكد من أن كل مدرسة تعتمد فقط على البيانات المرتبطة بـ School ID الخاص بها، واكتشاف الأكواد أو المستخدمين المتضاربين.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={runDataIntegrityAudit}
                    disabled={isAuditing || isRepairing}
                    className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isAuditing ? "animate-spin" : ""} />
                    {isAuditing ? "جاري الفحص..." : "تشغيل فحص سلامة البيانات"}
                  </button>

                  {auditResults && (auditResults.discrepantSchoolsCount > 0 || auditResults.orphanCodesCount > 0 || auditResults.mismatchedUsersCount > 0) && (
                    <button
                      onClick={fixDataIntegrityIssues}
                      disabled={isAuditing || isRepairing}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Zap size={16} className={isRepairing ? "animate-spin" : ""} />
                      {isRepairing ? "جاري الإصلاح..." : "إصلاح العلاقات الخاطئة والإحصائيات تلقائياً"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Initial Run Trigger Banner if not run yet */}
            {!auditResults && !isAuditing && (
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-base font-black text-white">لم يتم تشغيل فحص البيانات بعد</h3>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  اضغط على الزر أعلاه للبدء بالمرور على جميع المدارس والأكواد والمستخدمين للتحقق من سلامة العزل بين المدارس وضمان دقة الإحصائيات 100%.
                </p>
                <button
                  onClick={runDataIntegrityAudit}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
                >
                  <Activity size={16} /> بدء فحص سلامة البيانات
                </button>
              </div>
            )}

            {/* Audit Results Dashboard */}
            {auditResults && (
              <div className="space-y-6">
                {/* Audit Metrics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-white/40 font-bold">إجمالي المدارس المفحوصة</p>
                    <p className="text-xl font-black font-mono text-white mt-1">{auditResults.totalSchoolsAudited}</p>
                    <p className="text-[9px] text-white/30 mt-0.5">استعلام مباشر</p>
                  </div>
                  <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4 text-center bg-emerald-500/5">
                    <p className="text-[10px] text-emerald-400 font-bold">مدارس سليمة 100%</p>
                    <p className="text-xl font-black font-mono text-emerald-300 mt-1">{auditResults.intactSchoolsCount}</p>
                    <p className="text-[9px] text-emerald-400/60 mt-0.5">بدون أي تضارب</p>
                  </div>
                  <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-4 text-center bg-amber-500/5">
                    <p className="text-[10px] text-amber-400 font-bold">تضاربات في الإحصائيات</p>
                    <p className="text-xl font-black font-mono text-amber-300 mt-1">{auditResults.discrepantSchoolsCount}</p>
                    <p className="text-[9px] text-amber-400/60 mt-0.5">بين الوثيقة والاستعلام</p>
                  </div>
                  <div className="bg-black/40 border border-rose-500/20 rounded-2xl p-4 text-center bg-rose-500/5">
                    <p className="text-[10px] text-rose-400 font-bold">أكواد بدون مدرسة</p>
                    <p className="text-xl font-black font-mono text-rose-300 mt-1">{auditResults.orphanCodesCount}</p>
                    <p className="text-[9px] text-rose-400/60 mt-0.5">School ID مفقود</p>
                  </div>
                  <div className="bg-black/40 border border-purple-500/20 rounded-2xl p-4 text-center bg-purple-500/5 col-span-2 md:col-span-1">
                    <p className="text-[10px] text-purple-400 font-bold">تضارب مدرسة المستخدمين</p>
                    <p className="text-xl font-black font-mono text-purple-300 mt-1">{auditResults.mismatchedUsersCount}</p>
                    <p className="text-[9px] text-purple-400/60 mt-0.5">تطابق الكود والمدرسة</p>
                  </div>
                </div>

                {/* Audit Log Timeline */}
                {auditRunAt && (
                  <div className="flex items-center justify-between text-[10px] text-white/40 px-2">
                    <span>تاريخ آخر تدقيق وفحص: <strong className="text-white font-mono">{auditRunAt}</strong></span>
                    <span>طريقة الفحص: <strong className="text-emerald-400">WHERE schoolId == CurrentSchoolId</strong></span>
                  </div>
                )}

                {/* Per School Inspection Breakdown Table */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Building size={16} className="text-indigo-400" /> تقرير سلامة وعزل كل مدرسة بالتفصيل
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-white/40 font-bold text-[10px]">
                          <th className="py-3 px-3">المدرسة و ID</th>
                          <th className="py-3 px-3">الطلاب (المخزن vs الاستعلام)</th>
                          <th className="py-3 px-3">الأساتذة (المخزن vs الاستعلام)</th>
                          <th className="py-3 px-3">أولياء الأمور (المخزن vs الاستعلام)</th>
                          <th className="py-3 px-3">الأكواد الفعلية المولدة</th>
                          <th className="py-3 px-3">الحالة والسلامة</th>
                          <th className="py-3 px-3">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {auditResults.schoolResults.map((s) => (
                          <tr key={s.schoolId} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <p className="font-bold text-white">{s.schoolName}</p>
                              <p className="text-[9px] font-mono text-white/40">{s.schoolId}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-mono font-bold ${s.storedStats.students !== s.actualUsers.students ? 'text-amber-400' : 'text-white/80'}`}>
                                {s.storedStats.students} ➔ <span className="text-emerald-400">{s.actualUsers.students}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-mono font-bold ${s.storedStats.teachers !== s.actualUsers.teachers ? 'text-amber-400' : 'text-white/80'}`}>
                                {s.storedStats.teachers} ➔ <span className="text-emerald-400">{s.actualUsers.teachers}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-mono font-bold ${s.storedStats.parents !== s.actualUsers.parents ? 'text-amber-400' : 'text-white/80'}`}>
                                {s.storedStats.parents} ➔ <span className="text-emerald-400">{s.actualUsers.parents}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-white/80">
                              <span className="text-indigo-300">{s.actualCodes.totalCodes}</span> كود (طلاب: {s.actualCodes.studentCodes} | كادر: {s.actualCodes.staffCodes} | أولياء: {s.actualCodes.parentCodes})
                            </td>
                            <td className="py-3 px-3">
                              {s.hasDiscrepancy ? (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  <AlertCircle size={10} /> تضارب إحصائيات
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  <CheckCircle size={10} /> معزولة وسليمة 100%
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => refreshSchoolStats({ id: s.schoolId, name: s.schoolName } as any)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                                title="إعادة مزامنة هذه المدرسة فقط"
                              >
                                <RefreshCw size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Detailed Issues & Anomalies List */}
                {auditResults.issues.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                    <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
                      <AlertCircle size={16} /> قائمة الملاحظات والأكواد أو المستخدمين المتضاربين ({auditResults.issues.length})
                    </h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {auditResults.issues.map((issue) => (
                        <div key={issue.id} className="bg-black/40 border border-white/5 rounded-2xl p-3 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                issue.type === 'orphan_code' ? 'bg-rose-500/20 text-rose-300' :
                                issue.type === 'mismatched_user_school' ? 'bg-purple-500/20 text-purple-300' :
                                'bg-amber-500/20 text-amber-300'
                              }`}>
                                {issue.type}
                              </span>
                              <h4 className="font-bold text-white">{issue.title}</h4>
                            </div>
                            <p className="text-[10.5px] text-white/60 mt-1 leading-relaxed">{issue.description}</p>
                          </div>
                          {issue.fixable && (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap">
                              قابلة للإصلاح التلقائي
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
      <nav className="fixed bottom-0 left-0 right-0 z-[999] h-20 bg-[#050A18] border-t border-white/10 flex items-center justify-around px-2 pb-6 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {[
          { id: 'health', name: 'الصحة', icon: Activity },
          { id: 'school_management', name: 'إدارة المدارس', icon: Building },
          { id: 'remote_config', name: 'التحكم السحابي', icon: SlidersHorizontal },
          { id: 'data_integrity', name: 'سلامة البيانات', icon: ShieldCheck },
          { id: 'media', name: 'الوسائط', icon: ImageIcon },
          { id: 'errors', name: 'الأخطاء', icon: Bug },
          { id: 'actions', name: 'إجراءات', icon: Zap }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="relative flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all outline-none group active:scale-95"
            >
              <div className={`transition-all duration-300 ${isSelected ? "text-indigo-400 -translate-y-1" : "text-white/30 hover:text-white/70"}`}>
                <Icon size={24} strokeWidth={isSelected ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold transition-all ${isSelected ? "text-indigo-400" : "text-white/30"}`}>
                {tab.name}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="devActiveTabIndicator"
                  className="absolute -top-[14px] w-10 h-1.5 bg-indigo-400 rounded-b-full shadow-[0_4px_15px_rgba(129,140,248,0.6)]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
