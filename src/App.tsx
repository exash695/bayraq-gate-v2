import { Gate6 } from './components/Gate6.tsx';
import { Gate6Demo } from './components/Gate6/Gate6Demo';
import { matchesTargetGrades, isSchoolMatch } from './utils/gradeMatcher';
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { customAuth } from "./services/customAuthService";
import { auth, db, purgeFirestore } from "./lib/firebase";
import { api } from "./lib/api";
import { safeStorage, safeSessionStorage } from "./lib/storage";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  arrayUnion,
  increment,
  deleteDoc,
  getDocs,
  getDocsFromServer,
} from "@/src/lib/firebase";
import { useRemoteConfig } from "./services/remoteConfig";
import { useAppLogo } from "./components/BerqCharacterManager";
import DevDashboard from "./components/DevDashboard";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import { getStudentLevelInfo, getProfessionalAvatar } from "./lib/avatarLevel";
import { updateDailyLogin, updatePoints } from "./lib/pointsEngine";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthPage } from "./components/AuthPage";
import { ResetPasswordModal } from "./components/ResetPasswordModal";
import { ProfileDashboard } from "./components/ProfileDashboard";
import { UnitDetail } from "./components/UnitDetail";
import { AIBot } from "./components/AIBot";
import { IdeaBank } from "./components/IdeaBank";
import { HallOfFame } from "./components/HallOfFame";
import { ControlRoom } from "./components/ControlRoom";
import { Battalion } from "./components/Battalion";
import { SubscriptionPage } from "./components/SubscriptionPage";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { ToastContainer } from "./components/ToastNotification";
import { BerqCharacter } from "./components/BerqCharacterManager";
import { MascotTestPage } from "./components/MascotTestPage";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { SwipeDismissContainer } from "./components/SwipeDismissContainer";
import { ComingSoonPlaceholder } from "./components/ComingSoonPlaceholder";
import { sounds } from "./lib/sounds";
import { preloadAllMascotAssets } from "./utils/mediaPreloader";
import { pushNotificationManager } from "./services/pushNotificationManager";
import {
  AppSection,
  UnitId,
  AppSettings,
  UserProgress,
  AppNotification,
} from "./types";
import { translations } from "./lib/translations";

const INITIAL_SETTINGS: AppSettings = {
  fontSize: 18,
  voiceEnabled: true,
  themeColor: "blue",
  themeMode: "dark",
  fontFamily: "cairo",
  language: "ar",
  eyeCare: false,
  studyReminder: null,
  studyTone: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
  sovereigntyNotifications: true,
  classAlertsEnabled: true,
  studyReminderDays: [0, 1, 2, 3, 4, 5, 6],
};

const INITIAL_PROGRESS: UserProgress = {
  completedPages: [],
  favorites: [],
  ministerialFavorites: [],
  masteredPages: [],
  examResults: [],
  stickyNotes: {},
  unlockedUnits: [1, 2, 3, 4, 5, 6, 8, 9],
  badges: {},
  totalStudyTime: {},
  crossingStationProgress: {},
  flashChallengeRewards: [],
  rank: "squire",
  armor: [],
};

import { AnimatePresence, motion } from "motion/react";
import { BadgeNotification } from "./components/BadgeNotification";
import { broadcastService } from "./services/broadcastService";
import { Badge } from "./types";
import { checkNewBadges } from "./lib/badgeUtils";
import { SovereigntyPlatform } from "./components/Sovereignty/SovereigntyPlatform";

import { BroadcastTicker } from "./components/BroadcastTicker";
import { SeasonalThemeBanner } from "./components/SeasonalThemeBanner";
import { Sidebar } from "./components/Sidebar";
import {
  PhoneCall,
  Globe,
  Lock as LockIcon,
  ShieldAlert,
  ShieldOff,
  RefreshCw,
  Radio as RadioIcon,
  Smartphone,
  Presentation,
  ClipboardCheck,
  PlusCircle,
  FileUp,
  CalendarClock,
  Bus,
  BarChart3,
  Wallet,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Search,
  Users,
  Bell,
  X,
  Shield,
  Menu,
  Swords,
  UserPlus,
  Radar,
  Headphones,
  BookOpen,
  ChevronLeft,
  Trophy,
  Home,
  Zap,
  Target,
  Flame,
  Crown,
  Play,
  Compass,
  Sparkles,
  Rocket,
  MessageCircle,
  Award,
  Megaphone
} from "lucide-react";
import { LoadingScreen } from "./components/LoadingScreen";
import { WelcomeIntroScreen } from "./components/WelcomeIntroScreen";
import { ProfileSetup } from "./components/ProfileSetup";
import { DualArena } from "./components/DualArena";
import { BayraqGateway } from "./components/BayraqGateway";
import { SixthAcademyPro } from "./components/SixthAcademyPro";
import { SchoolSelection } from "./components/SchoolSelection";
import { SchoolPlatform } from "./components/SchoolPlatform";
import { AIEnhancedRadar } from "./components/AIEnhancedRadar";
import { StudentLounge } from "./components/StudentLounge";
import { SchoolContent } from "./components/SchoolContent";
import { SchoolAccessGate } from "./components/SchoolAccessGate";
import { BayraqAcademyHub } from "./components/BayraqAcademyHub";
import { ParentPortal } from "./components/ParentPortal";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminHomeDashboard } from "./components/AdminHomeDashboard";
import { DriverDashboard } from "./components/Transport/DriverDashboard";
import { DriverPortal } from "./components/Transport/DriverPortal";
import { getDriverByAccessCode } from "./services/transportService";
import { OnboardingCarousel } from "./components/OnboardingCarousel";
import { RoleSelectionModal } from "./components/RoleSelectionModal";
import { SCHOOLS_DATA, getOfficialSchoolName } from "./lib/constants";
import { schoolService, SchoolRecord } from "./services/schoolService";
import { STUDENT_REGISTRY } from "./lib/studentRegistry";
import { ReceiptVerification } from "./components/ReceiptVerification";
import { GlobalAnnouncementsPopup } from "./components/GlobalAnnouncementsPopup";
import { SystemDialogsModal } from "./components/SystemDialogsModal";
import { NetworkStatusListener } from "./components/NetworkStatusListener";

export const AVAILABLE_GRADES = [
  "أول ابتدائي",
  "ثاني ابتدائي",
  "ثالث ابتدائي",
  "رابع ابتدائي",
  "خامس ابتدائي",
  "سادس ابتدائي",
  "أول متوسط",
  "ثاني متوسط",
  "ثالث متوسط",
  "رابع علمي",
  "رابع أدبي",
  "خامس علمي",
  "خامس أدبي",
  "سادس علمي",
  "سادس أدبي",
];

const FONT_FAMILIES: Record<string, string> = {
  cairo: '"Cairo", sans-serif',
  tajawal: '"Tajawal", sans-serif',
  "noto-sans": '"Noto Sans Arabic", sans-serif',
  inter: '"Inter", "Noto Sans Arabic", sans-serif',
};

const isDeepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 == null ||
    obj2 == null
  ) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key) || !isDeepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
};

const getXpProgressDetails = (xp: number = 0) => {
  let currentLevelXp = 0;
  let nextLevelXp = 500;
  let label = "للترقية";

  if (xp >= 5000) {
    currentLevelXp = xp - 5000;
    nextLevelXp = 10000;
    label = "مستوى الأسطورة الأقصى";
  } else if (xp >= 3000) {
    currentLevelXp = xp - 3000;
    nextLevelXp = 2000;
  } else if (xp >= 1500) {
    currentLevelXp = xp - 1500;
    nextLevelXp = 1500;
  } else if (xp >= 500) {
    currentLevelXp = xp - 500;
    nextLevelXp = 1000;
  } else {
    currentLevelXp = xp;
    nextLevelXp = 500;
  }

  const percentage = Math.min(100, Math.max(0, (currentLevelXp / nextLevelXp) * 100));
  const remaining = nextLevelXp - currentLevelXp;

  return {
    percentage,
    remaining,
    label,
    isMax: xp >= 5000
  };
};

export default function App() {
  const dynamicAppLogo = useAppLogo();
  const remoteConfig = useRemoteConfig();
  const [bypassMaintenance, setBypassMaintenance] = useState(false);
  const [dismissedOptionalUpdate, setDismissedOptionalUpdate] = useState(false);
  const [dismissedNewVersionNotice, setDismissedNewVersionNotice] = useState(false);
  const [verifyReceiptId, setVerifyReceiptId] = useState<string | null>(null);
  const [showPrivacyPublic, setShowPrivacyPublic] = useState(false);
  const [showGate6Demo, setShowGate6Demo] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{ token: string; email: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyId = params.get("verify");
    if (verifyId) {
      setVerifyReceiptId(verifyId);
    }
    const resetToken = params.get("reset_token");
    const resetEmail = params.get("email");
    if (resetToken && resetEmail) {
      setResetPasswordData({ token: resetToken, email: resetEmail });
    }
    const isPrivacyParam = params.get("privacy") !== null || params.get("view") === "privacy" || params.get("policy") !== null;
    const isPrivacyPath = window.location.pathname.toLowerCase().includes("privacy");
    if (isPrivacyParam || isPrivacyPath) {
      setShowPrivacyPublic(true);
    }

    if (window.location.pathname.toLowerCase().includes("gate6") || params.get("gate6") !== null) {
      setShowGate6Demo(true);
    }
  }, []);

  const [authReady, setAuthReady] = useState(true);
  const [splashFinished, setSplashFinished] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [hasSeenWelcomeIntro, setHasSeenWelcomeIntro] = useState(true);

  // Global failsafe: Ensure immediate loading readiness
  useEffect(() => {
    setAuthReady(true);
    setSplashFinished(true);
  }, []);

  const handleWelcomeIntroComplete = React.useCallback(() => {
    safeStorage.setItem("app_has_seen_welcome_intro", "true");
    setHasSeenWelcomeIntro(true);
    setSplashFinished(true);
  }, []);

  const handleSplashFinished = React.useCallback(() => {
    setSplashFinished(true);
  }, []);

  const loading = !authReady || !splashFinished;

  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [portalType, setPortalType] = useState<
    "student" | "parent" | "admin-boys" | "admin-girls" | "teacher" | "admin-observer" | "driver" | "developer" | "superadmin"
  >(() => {
    try {
      const savedRole = safeStorage.getItem("bayraq_user_role");
      if (savedRole && ["student", "parent", "admin-boys", "admin-girls", "teacher", "admin-observer", "driver", "developer", "superadmin"].includes(savedRole)) {
        return savedRole as any;
      }
    } catch {}
    return "student";
  });

  // Sync portalType when userProfile loads if not manually overridden
  useEffect(() => {
    if (userProfile && !safeStorage.getItem("bayraq_user_role")) {
      const isDevEmail = userProfile.email?.toLowerCase() === 'mntzralghanm527@gmail.com';
      let role = userProfile.role === "admin" 
        ? (userProfile.adminBranch === "boys" ? "admin-boys" : "admin-girls")
        : userProfile.role;
        
      if (isDevEmail || userProfile.role === 'developer' || userProfile.role === 'dev') role = 'admin-boys'; // Default dev to admin for platform viewing
      if (userProfile.role === 'superadmin') role = 'admin-boys';

      const validRoles = ["student", "parent", "admin-boys", "admin-girls", "teacher", "admin-observer", "driver", "developer", "superadmin"];
      if (validRoles.includes(role)) {
        setPortalType(role as any);
      }
    }
  }, [userProfile]);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(() => {
    try {
      return safeStorage.getItem("app_has_seen_onboarding") === "true" && !safeStorage.getItem("bayraq_user_role");
    } catch {
      return false;
    }
  });
  const [loggedInDriver, setLoggedInDriver] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] =
    useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = safeStorage.getItem("app_notifications");
      const parsed = saved ? JSON.parse(saved) : [];
      // Remove duplicates by ID
      const unique = Array.from(
        new Map(
          parsed.map((item: AppNotification) => [item.id, item]),
        ).values(),
      );
      return unique as AppNotification[];
    } catch (e) {
      console.error("Error parsing app_notifications:", e);
      return [] as AppNotification[];
    }
  });

  const memoizedNotifications = React.useMemo(() => {
    const list = Array.from(
      new Map(notifications.map((n) => [n.id, n])).values(),
    );
    const isAdmin = portalType?.startsWith('admin');
    const isDev = Boolean(userProfile?.isDeveloper || userProfile?.role === 'developer');

    return list.filter((n: any) => {
      // Role & portal isolation: block admin/developer audit & internal actions from students/parents/teachers/drivers
      const isDevOrAdminNotification =
        n.recipientRole === 'developer' ||
        n.recipientRole === 'admin' ||
        n.type === 'developer' ||
        n.type === 'admin_audit' ||
        (typeof n.message === 'string' && (
          n.message.includes('كود الإدارة') ||
          n.message.includes('كود إدارة') ||
          n.message.includes('لوحة المطور') ||
          n.message.includes('سيرفر') ||
          n.message.includes('تفريغ الكاش')
        ));

      if (isDev) return true;

      if (isAdmin) {
        if (n.recipientRole && n.recipientRole !== 'admin' && n.recipientRole !== 'developer') return false;
        return true;
      }

      if (portalType === 'student') {
        if (isDevOrAdminNotification) return false;
        if (n.recipientRole && n.recipientRole !== 'student') return false;
        return true;
      }

      if (portalType === 'parent') {
        if (isDevOrAdminNotification) return false;
        if (n.recipientRole && n.recipientRole !== 'parent') return false;
        return true;
      }

      if (portalType === 'teacher') {
        if (isDevOrAdminNotification) return false;
        if (n.recipientRole && n.recipientRole !== 'teacher' && n.recipientRole !== 'cadre' && n.recipientRole !== 'staff') return false;
        return true;
      }

      if (portalType === 'driver') {
        if (isDevOrAdminNotification) return false;
        if (n.recipientRole && n.recipientRole !== 'driver') return false;
        return true;
      }

      return true;
    });
  }, [notifications, portalType, userProfile?.isDeveloper, userProfile?.role]);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [hasFired, setHasFired] = useState(false);
  const processedFirestoreNotifs = useRef<Set<string>>(new Set());
  const prevPossibleIds = useRef<string>("");
  const lastProfileSwitchTime = useRef<number>(Date.now());

  useEffect(() => {
    preloadAllMascotAssets();
  }, []);

  const [activeSectionState, setActiveSectionState] = useState<AppSection>(
    () => {
      try {
        const saved = safeStorage.getItem("s6_activeSection");
        if (saved === "gate-6") {
          safeStorage.setItem("s6_activeSection", "hub");
          return "hub";
        }
        const validSections: AppSection[] = [
          "hub",
          "mayadeen",
          "unit-detail",
          "radar",
          "bank",
          "control",
          "ai-bot",
          "profile-setup",
          "profile",
          "sovereignty",
          "battalion",
          "knowledge-den",
          "sixth-academy",
          "hall-of-fame",
          "idea-bank",
          "vault",
          "admin-hub",
          "school-content",
          "dev-dashboard",
          "gate-6",
          "mascot-test",
        ];
        return validSections.includes(saved as AppSection)
          ? (saved as AppSection)
          : "hub";
      } catch {
        return "hub";
      }
    },
  );

  const setActiveSection = (
    newSection: AppSection,
    callerName: string = "unknown",
  ) => {
    console.log(
      `[Section Switch Log] prev: ${activeSectionState}, new: ${newSection}, caller: ${callerName}`,
    );
    try {
      safeStorage.setItem("s6_activeSection", newSection);
    } catch (e) {
      console.error(e);
    }
    if (newSection === "mayadeen") {
      setIsChoosingSchool(true);
    } else {
      setIsChoosingSchool(false);
    }
    setActiveSectionState(newSection);
  };

  const activeSection = activeSectionState;

  React.useEffect(() => {
    // Force scroll to top on any section change after DOM paints
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      const mainContent = document.getElementById("main-content-area");
      if (mainContent) mainContent.scrollTop = 0;
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    });
  }, [activeSectionState]);




  const [selectedUnitId, setSelectedUnitId] = useState<UnitId | null>(() => {
    try {
      const saved = safeStorage.getItem("s6_selectedUnitId");
      return saved ? (parseInt(saved) as UnitId) : null;
    } catch {
      return null;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = safeStorage.getItem("s6_settings");
      if (!saved) return INITIAL_SETTINGS;
      return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = safeStorage.getItem("s6_progress");
      if (!saved) return INITIAL_PROGRESS;
      return { ...INITIAL_PROGRESS, ...JSON.parse(saved) };
    } catch {
      return INITIAL_PROGRESS;
    }
  });

  const [dualConfig, setDualConfig] = useState<{
    opponent: any;
    type: "1vs1" | "provincial";
  } | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(
    () => {
      try {
        return safeStorage.getItem("s6_selectedSchoolId");
      } catch {
        return null;
      }
    },
  );
  const [isSchoolVerified, setIsSchoolVerified] = useState(false);
  const [selectedStudentGrade, setSelectedStudentGrade] = useState<
    string | null
  >(null);
  const [verifiedStudentInfo, setVerifiedStudentInfo] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [bannedCode, setBannedCode] = useState<string | null>(null);
  const [suspendedSchoolName, setSuspendedSchoolName] = useState<string | null>(null);
  const [activeKnightsCount, setActiveKnightsCount] = useState<number>(0);
  const [activeKnights, setActiveKnights] = useState<any[]>([]);
  const [showActiveKnights, setShowActiveKnights] = useState(false);
  const [chatSelectedUser, setChatSelectedUser] = useState<any>(null);
  const [isLoungeChatOpen, setIsLoungeChatOpen] = useState(false);
  const [todayTasksCount, setTodayTasksCount] = useState<number | null>(null);
  const [highlightTasksSection, setHighlightTasksSection] = useState<boolean>(false);
  const [apiSchools, setApiSchools] = useState<SchoolRecord[]>([]);

  // Real-time sync for active schools from internal PostgreSQL API
  useEffect(() => {
    let isMounted = true;
    const loadSchools = async () => {
      try {
        const list = await schoolService.fetchSchools();
        if (isMounted) {
          setApiSchools(list);
        }
      } catch (err) {
        console.warn("Error fetching PostgreSQL schools:", err);
      }
    };
    loadSchools();
    const interval = setInterval(loadSchools, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Monitor school suspension status in real-time
  useEffect(() => {
    if (!selectedSchoolId || portalType === 'developer') {
      setSuspendedSchoolName(null);
      return;
    }

    // Skip check for global developers/super admins
    if (userProfile?.role === 'developer' || userProfile?.role === 'superadmin') {
      setSuspendedSchoolName(null);
      return;
    }

    const schoolRef = doc(db, "schools", selectedSchoolId);
    const unsubscribe = onSnapshot(schoolRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const status = (data.status || '').toLowerCase();
        const isSusp = status === 'suspended' || status === 'disabled' || status === 'inactive' || status === 'معطلة' || status === 'موقوفة';
        
        if (isSusp) {
          setSuspendedSchoolName(data.name || selectedSchoolId);
        } else {
          setSuspendedSchoolName(null);
        }
      }
    }, (err) => {
      console.warn("Error listening to school status:", err);
    });

    return () => unsubscribe();
  }, [selectedSchoolId, userProfile?.role, portalType]);

  const performSuspensionLogout = () => {
    setSuspendedSchoolName(null);
    setSelectedSchoolId(null);
    setIsSchoolVerified(false);
    setPortalType(null);
    setActiveSection("hub");
    safeStorage.removeItem("s6_selectedSchoolId");
    safeStorage.removeItem("s6_userProfile");
    safeStorage.removeItem("s6_auth_token");
    safeStorage.removeItem("s6_portalType");
    safeStorage.removeItem("bayraq_user_role");
    customAuth.logout();
    setUser(null);
    setUserProfile(null);
  };

  const allSchoolsList = useMemo(() => {
    const normalize = (name?: string) => 
      (name || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[\s\-_]/g, '').trim();

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    // 1. Start with SCHOOLS_DATA, but overwrite images and names if they exist in PostgreSQL
    const merged = SCHOOLS_DATA.map(sysSchool => {
      const sysNorm = normalize(sysSchool.name);
      const fs = apiSchools.find(f => f.id === sysSchool.id || normalize(f.name) === sysNorm);
      const item = {
        ...sysSchool,
        name: fs?.name || sysSchool.name,
        schoolBairaqImageUrl: fs?.coverUrl || fs?.schoolBairaqImageUrl || sysSchool.schoolBairaqImageUrl,
        schoolLogoUrl: fs?.logoUrl || fs?.schoolLogoUrl || sysSchool.schoolLogoUrl,
      };
      seenIds.add(item.id);
      seenNames.add(normalize(item.name));
      return item;
    });

    // 2. Add any schools that are purely in PostgreSQL
    apiSchools.forEach((fs) => {
      const fsNorm = normalize(fs.name);
      if (!seenIds.has(fs.id) && !seenNames.has(fsNorm)) {
        seenIds.add(fs.id);
        seenNames.add(fsNorm);
        merged.push({
          id: fs.id,
          name: fs.name || fs.id,
          governorate: fs.governorate || "العراق",
          studentsCount: fs.studentsCount || 0,
          teachersCount: 0,
          schoolBairaqImageUrl: fs.coverUrl || fs.schoolBairaqImageUrl || '/schools/cover1.jpg',
          schoolLogoUrl: fs.logoUrl || fs.schoolLogoUrl || '/school-logos/logo1.jpg',
        } as any);
      }
    });
    return merged;
  }, [apiSchools]);

  // Fetch active homework and competitions count for "Today's Tasks" card
  useEffect(() => {
    const targetSchoolId = selectedSchoolId || "school1";
    try {
      const q = query(collection(db, "schools", targetSchoolId, "ai_materials"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const tasks = snapshot.docs.filter((d) => {
            const data = d.data();
            return data.tool === "صناعة واجبات" || data.tool === "مسابقات صفية";
          });
          setTodayTasksCount(tasks.length);
        },
        (error) => {
          console.error("Error fetching tasks count:", error);
          setTodayTasksCount(0);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setTodayTasksCount(0);
    }
  }, [selectedSchoolId]);

  // Fetch active knights count for student's grade
  useEffect(() => {
    if (userProfile?.role === "student" && userProfile?.grade) {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("role", "==", "student"),
        where("grade", "==", userProfile?.grade),
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const knights: any[] = [];
          snapshot.forEach(doc => {
            knights.push({ id: doc.id, ...doc.data() });
          });
          setActiveKnights(knights);
          setActiveKnightsCount(knights.length > 0 ? knights.length : 1);
        },
        (error) => {
          console.error("Error fetching active knights:", error);
        },
      );

  return () => unsubscribe();
    }
  }, [userProfile?.role, userProfile?.grade]);

  const [gradeBroadcasts, setGradeBroadcasts] = useState<any[]>([]);

  // Fetch broadcasts published by admin/teachers/radio for the student's grade & school
  useEffect(() => {
    const currentGrade =
      userProfile?.grade ||
      verifiedStudentInfo?.grade ||
      selectedStudentGrade ||
      "";
    const currentSchool =
      selectedSchoolId ||
      userProfile?.schoolId ||
      verifiedStudentInfo?.schoolId ||
      safeStorage.getItem("s6_selectedSchoolId") ||
      safeStorage.getItem("s6_preferred_school") ||
      "school1";

    // Query broadcasts without strict orderBy so missing fields don't cause Firestore to exclude docs
    const q = query(collection(db, "broadcasts"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const list = snapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            const timestampMs =
              data.timestampMs ||
              data.timestamp_ms ||
              (data.timestamp?.toMillis
                ? data.timestamp.toMillis()
                : typeof data.timestamp === "number"
                ? data.timestamp
                : Date.now());

            let expMs = 0;
            const expField = data.expiryDate || data.expiry_date;
            if (typeof expField === "number") {
              expMs = expField;
            } else if (expField?.toMillis) {
              expMs = expField.toMillis();
            } else if (expField instanceof Date) {
              expMs = expField.getTime();
            } else if (typeof expField === "string") {
              const parsed = new Date(expField).getTime();
              expMs = isNaN(parsed) ? (Number(expField) || 0) : parsed;
            }

            const schoolId = data.schoolId || data.school_id || "";
            const targetGrades = data.targetGrades || data.target_grades || [];

            return {
              id: doc.id,
              ...data,
              schoolId,
              targetGrades,
              timestampMs,
              expMs,
            };
          })
          .filter((b: any) => {
            // Expiry check
            if (b.expMs > 0 && b.expMs < now) return false;

            // School check
            if (!isSchoolMatch(currentSchool, b.schoolId)) {
              return false;
            }

            // Target roles check
            let gradesArr: string[] = [];
            if (Array.isArray(b.targetGrades)) {
              gradesArr = b.targetGrades;
            } else if (typeof b.targetGrades === "string") {
              gradesArr = [b.targetGrades];
            }
            if (gradesArr.includes("parent_only")) return false;

            // Grade / stage check
            if (!matchesTargetGrades(currentGrade, gradesArr)) {
              return false;
            }

            return true;
          })
          .sort((a, b) => b.timestampMs - a.timestampMs);

        setGradeBroadcasts(list);
      },
      (error) => {
        console.error("Error fetching grade broadcasts:", error);
      }
    );

    return () => unsubscribe();
  }, [
    userProfile?.grade,
    verifiedStudentInfo?.grade,
    selectedStudentGrade,
    selectedSchoolId,
    userProfile?.schoolId,
    verifiedStudentInfo?.schoolId,
  ]);

  /* Visibility change logic removed as it could cause black screen issues */
  /*
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.body.style.display = "none";
      } else {
        document.body.style.display = "block";
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
  */

  useEffect(() => {
    safeStorage.setItem("app_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Request Browser Notification Permission & Register Push Tokens
  useEffect(() => {
    // تسجيل Service Worker وتهيئة إشعارات الويب فور تحميل التطبيق
    pushNotificationManager.initWebNotifications(userProfile?.id || userProfile?.studentId || 'guest_web').catch(() => {});
  }, [userProfile?.id, userProfile?.studentId]);

  // Register Device Push Token for current user / student / parent / teacher
  useEffect(() => {
    const activeId = userProfile?.studentId || userProfile?.id || user?.uid;
    if (activeId) {
      pushNotificationManager.initNativePush(
        String(activeId),
        userProfile?.role || portalType || 'student',
        selectedSchoolId || userProfile?.schoolId || ''
      ).catch(() => {});
    }
  }, [userProfile?.id, userProfile?.studentId, user?.uid, selectedSchoolId, portalType]);

  const [loggedInTeacher, setLoggedInTeacher] = useState<any>(null);

  useEffect(() => {
    if (safeStorage.getItem("s6_force_purge") === "true") {
      safeStorage.removeItem("s6_force_purge");
      purgeFirestore();
    }
  }, []);

  // Load cached school verified session automatically when school is selected
  useEffect(() => {
    // Session auto-resume disabled per request
  }, [selectedSchoolId, isSchoolVerified]);

  // Save cached school verified session automatically when verified state is active
  useEffect(() => {
    if (isSchoolVerified && selectedSchoolId) {
      try {
        const cacheObj = {
          portalType,
          verifiedStudentInfo,
          loggedInTeacher,
          loggedInDriver,
          selectedStudentGrade
        };
      } catch (e) {
        console.error("Error caching school verification:", e);
      }
    }
  }, [isSchoolVerified, selectedSchoolId, portalType, verifiedStudentInfo, loggedInTeacher, loggedInDriver, selectedStudentGrade]);

  const handleBroadcastMessage = async (
    message: string,
    targetGrades: string[],
    duration: number,
  ) => {
    if (!user) return;

    try {
      await broadcastService.sendBroadcast({
        schoolId: userProfile?.schoolId || selectedSchoolId || "school1",
        message,
        targetGrades,
        durationHours: duration,
        author: userProfile?.name || "الإدارة المدرسية",
        subject: 'الإذاعة المدرسية',
        targetLocation: 'ticker',
        type: 'school_broadcast',
        isSchoolBroadcast: true
      });
    } catch (e) {
      console.error("Failed to send broadcast:", e);
    }
  };

  const handleBroadcastUpdate = async (
    broadcastId: string,
    newMessage: string,
  ) => {
    if (!user) return;
    try {
      await broadcastService.updateBroadcast(broadcastId, newMessage);
    } catch (e) {
      console.error("Failed to update broadcast:", e);
    }
  };

  function addNotification(
    title: string,
    message: string,
    type: AppNotification["type"],
    optionalId?: string,
    recipientRole?: "student" | "parent" | "teacher",
    showToast = true,
    broadcastId?: string
  ) {
    // Prevent broadcast and general announcements from popping up as toasts or playing sounds
    const finalShowToast = (type === "broadcast" || type === "general") ? false : showToast;

    const newNotif: AppNotification = {
      id: optionalId || Math.random().toString(36).substr(2, 9),
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type,
      broadcastId,
      recipientRole:
        recipientRole ||
        (portalType?.startsWith("admin")
          ? "admin"
          : (portalType === "parent" || portalType === "teacher" || portalType === "driver"
            ? (portalType as any)
            : "student")),
    };

    setNotifications((prev) => {
      // Full list deduplication
      const combined = [newNotif, ...prev];
      const unique = Array.from(
        new Map(combined.map((n) => [n.id, n])).values(),
      );
      return unique;
    });

    if (finalShowToast) {
      setActiveToasts((prev) => {
        if (prev.some((t) => t.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      sounds.playNotification();
    }
  }

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      // Ignore
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string, index: number) => {
    setNotifications((prev) =>
      prev.filter((n, idx) => !(n.id === id && idx === index)),
    );
  };

  const handleChallengeResponse = async (
    notif: any,
    status: "accepted" | "rejected",
  ) => {
    if (!user) return;

    try {
      // If it's a battalion challenge, we need to check if it's already been claimed
      if (notif.subType === "battalion" && status === "accepted") {
        const notifRef = doc(db, "notifications", notif.id);
        const freshNotif = await getDoc(notifRef);
        if (freshNotif.exists() && freshNotif.data().claimedBy) {
          alert(
            settings.language === "ar"
              ? "لقد سبقك فارس آخر في قبول هذا التحدي!"
              : "Another knight has already accepted this challenge!",
          );
          setNotification(null);
          return;
        }

        // Mark as claimed in the original notification (this is tricky because there are multiple notifications for battalion)
        // Better approach: Use a shared challenge document. But for now, we'll just proceed with the notification logic.
        // Actually, let's update the specific notification to read: true and mark as claimed.
        await updateDoc(notifRef, {
          status: "accepted",
          read: true,
          claimedBy: user.uid,
        });
      } else {
        await updateDoc(doc(db, "notifications", notif.id), {
          status,
          read: true,
        });
      }

      if (status === "accepted") {
        // Notify the challenger that the target has accepted and ask for confirmation
        await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notif.challengerId,
          type: "challenge_accepted_by_target",
          targetId: user.uid,
          targetName: userProfile?.fullName || user.displayName || "فارس",
          challengeType: notif.subType,
          originalNotifId: notif.id,
          
          read: false,
        })
      });
      } else {
        // Notify the challenger of rejection
        await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notif.challengerId,
          type: "challenge_response",
          status: "rejected",
          targetName: userProfile?.fullName || user.displayName || "فارس",
          challengeType: notif.subType,
          
          read: false,
        })
      });
      }

      setNotification(null);
    } catch (error) {
      console.error("Error responding to challenge:", error);
    }
  };

  const handleBattalionResponse = async (
    notif: any,
    status: "accepted" | "rejected",
  ) => {
    if (!user) return;
    try {
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });

      if (status === "accepted") {
        if (notif.type === "battalion_invite") {
          await updateDoc(doc(db, "battalions", notif.battalionId), {
            members: arrayUnion(user.uid),
          });
          await setDoc(
            doc(db, "users", user.uid),
            {
              battalionId: notif.battalionId,
              battalionName: notif.battalionName,
            },
            { merge: true },
          );
        } else if (notif.type === "battalion_join_request") {
          await updateDoc(doc(db, "battalions", notif.battalionId), {
            members: arrayUnion(notif.requesterId),
          });
          await setDoc(
            doc(db, "users", notif.requesterId),
            {
              battalionId: notif.battalionId,
              battalionName: notif.battalionName,
            },
            { merge: true },
          );
          await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: notif.requesterId,
            type: "battalion_join_accepted",
            battalionName: notif.battalionName,
            
            read: false,
          })
      });
        }
      }
      setNotification(null);
    } catch (error) {
      console.error("Error responding to battalion request:", error);
    }
  };

  const handleChallengerConfirmation = async (
    notif: any,
    confirmed: boolean,
  ) => {
    if (!user) return;

    try {
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });

      if (confirmed) {
        // Final invite to the target
        await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notif.targetId,
          type: "challenge_final_invite",
          challengerId: user.uid,
          challengerName: userProfile?.fullName || user.displayName || "فارس",
          
          read: false,
        })
      });

        // Trigger the arena for the challenger
        setDualConfig({
          opponent: { id: notif.targetId, name: notif.targetName },
          type: "1vs1",
        });
      } else {
        // Notify target of cancellation
        await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notif.targetId,
          type: "challenge_cancelled",
          challengerName: userProfile?.fullName || user.displayName || "فارس",
          
          read: false,
        })
      });
      }
      setNotification(null);
    } catch (error) {
      console.error("Error confirming challenge:", error);
    }
  };

  const initializedProfile = useRef(false);

  // Clear the logout flag on clean page entry (new session/tab) to ensure review auto-bypasses login
  useEffect(() => {
    if (!safeSessionStorage.getItem("s6_session_active")) {
      safeSessionStorage.setItem("s6_session_active", "true");
      safeStorage.removeItem("s6_user_logged_out");
    }
  }, []);

  // Auto login removed

  // 1. Auth Listener: Solely responsible for user state
  useEffect(() => {
    const unsubscribeAuth = customAuth.onAuthStateChanged((currentUser: any) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Profile Listener: Depends on 'user', manages profile and init logic
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    let unsubscribeProfile: any = null;
    let interval: any = null;

    const docRef = doc(db, "users", user.uid);

    unsubscribeProfile = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // Auto create profile silently
          setDoc(
            docRef,
            {
              fullName: user.displayName || (user.email ? user.email.split("@")[0] : "فارس جديد"),
              governorate: "غير محدد",
              profileCompleted: true,
              status: "online",
              role: user.role || "student",
              lastActive: new Date().toISOString(),
            },
            { merge: true }
          ).catch(console.error);
          return;
        }

        const profileData = docSnap.data();
        setUserProfile({ uid: user.uid, ...profileData });

        if (profileData.isBanned) {
          customAuth.logout();
          return;
        }

        if (profileData.progress) {
          setProgress((prev) => {
            const newProgress = { ...prev, ...profileData.progress };
            if (isDeepEqual(prev, newProgress)) return prev;
            return newProgress;
          });
        }

        // NAV LOGIC: Only apply on first init
        if (!initializedProfile.current) {
          if (profileData.role === "teacher") {
            setPortalType("teacher");
            safeStorage.setItem("bayraq_user_role", "teacher");
            if (profileData.schoolId) {
              setSelectedSchoolId(profileData.schoolId);
              safeStorage.setItem("s6_selectedSchoolId", profileData.schoolId);
            }
            setIsSchoolVerified(true);
          } else if (profileData.role === "parent" && profileData.studentCode) {
            setPortalType("parent");
            setVerifiedStudentInfo({
              studentCode: profileData.studentCode,
              parentCode: profileData.parentCode,
              schoolId: profileData.schoolId,
              name:
                profileData.studentName ||
                "طالب مدرسة " + (profileData.schoolName || ""),
            });
            if (profileData.schoolId) {
              setSelectedSchoolId(profileData.schoolId);
              safeStorage.setItem("s6_selectedSchoolId", profileData.schoolId);
            }
            setIsSchoolVerified(true);
          } else if (
            (profileData.role === "student" || profileData.studentCode) &&
            profileData.studentCode &&
            !profileData.role?.includes("admin")
          ) {
            setPortalType("student");
            safeStorage.setItem("bayraq_user_role", "student");
            setSelectedStudentGrade(profileData.grade || "غير محدد");
            if (profileData.schoolId) {
              setSelectedSchoolId(profileData.schoolId);
              safeStorage.setItem("s6_selectedSchoolId", profileData.schoolId);
            }
            setIsSchoolVerified(true);
          } else if (profileData.role === "admin" || profileData.isAdmin) {
            const branch = profileData.adminBranch || "boys";
            setPortalType(branch === "boys" ? "admin-boys" : "admin-girls");
            if (profileData.schoolId) {
              setSelectedSchoolId(profileData.schoolId);
              safeStorage.setItem("s6_selectedSchoolId", profileData.schoolId);
            }
            setIsSchoolVerified(true);
          }

          // Profile check removed by user request
          initializedProfile.current = true;
        }
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `users/${user.uid}`,
          false,
        );
      },
    );

    // Heartbeat removed
    // interval = setInterval(() => { ...

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      if (interval) clearInterval(interval);
    };
  }, [user]); // Only re-run when user changes

  useEffect(() => {
    const studentCode =
      userProfile?.studentCode ||
      verifiedStudentInfo?.code ||
      verifiedStudentInfo?.studentCode;
    const parentCode =
      userProfile?.parentCode || verifiedStudentInfo?.parentCode;
    const teacherCode =
      loggedInTeacher?.code ||
      (portalType === "teacher"
        ? userProfile?.code || userProfile?.studentCode
        : undefined);
    const activeUserId = user?.uid || "";

    if (!activeUserId && !studentCode && !parentCode && !teacherCode) return;
    if (!settings.sovereigntyNotifications) return;

    const possibleIdsSet = new Set<string>();
    const hasSpecificCode = Boolean(studentCode || parentCode || teacherCode);

    if (activeUserId) {
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

      const prefix = isParent ? "pcode_" : "scode_";
      possibleIdsSet.add(`${prefix}${clean}`);
      possibleIdsSet.add(`${prefix}${upper}`);
      possibleIdsSet.add(`${prefix}${lower}`);

      if (String(upper || "").startsWith("S-") || String(upper || "").startsWith("P-")) {
        const pure = upper.slice(2);
        possibleIdsSet.add(pure);
        possibleIdsSet.add(pure.toLowerCase());
        possibleIdsSet.add(`${prefix}${pure}`);
        possibleIdsSet.add(`${prefix}${pure.toLowerCase()}`);
      } else {
        const signPrefix = isParent ? "P-" : "S-";
        possibleIdsSet.add(`${signPrefix}${upper}`);
        possibleIdsSet.add(`${signPrefix}${lower}`);
        possibleIdsSet.add(`${prefix}${signPrefix}${upper}`);
        possibleIdsSet.add(`${prefix}${signPrefix}${lower}`);
      }
    };

    if (portalType === "student") {
      processCode(studentCode, false);
      if (selectedStudentGrade) {
        // Add original grade identifier to paths
        possibleIdsSet.add(`class_${selectedStudentGrade}`);
        if (selectedSchoolId) {
          possibleIdsSet.add(
            `class_${selectedSchoolId}_${selectedStudentGrade}`,
          );
          possibleIdsSet.add(`school_${selectedSchoolId}`);
        }

        // Form a robust normalized grade string
        let normalized = selectedStudentGrade.trim();
        // Remove everything inside parentheses, e.g., (بنين), (بنات)
        normalized = normalized.replace(/\s*\([^)]*\)/g, "");
        // Remove separate words like "بنين" or "بنات" or "مختلط" or "صباحي" or "مسائي"
        normalized = normalized.replace(
          /\b(بنين|بنات|مختلط|صباحي|مسائي)\b/g,
          "",
        );

        normalized = normalized.replace(/^ال/, "");
        normalized = normalized.replace(/\s+ال/g, " ");
        normalized = normalized
          .replace("الابتدائي", "ابتدائي")
          .replace("المتوسط", "متوسط")
          .replace("العلمي", "علمي")
          .replace("الأدبي", "أدبي")
          .replace("علمي", "علمي")
          .replace("أدبي", "أدبي");
        const mappedGrade = normalized.replace(/\s+/g, " ").trim();

        possibleIdsSet.add(`class_${mappedGrade}`);
        if (selectedSchoolId) {
          possibleIdsSet.add(`class_${selectedSchoolId}_${mappedGrade}`);
        }
      }
    } else if (portalType === "parent") {
      processCode(parentCode, true);
      const extraParentIds = [verifiedStudentInfo?.parentCode, userProfile?.parentCode, activeUserId].filter(Boolean);
      for (const pId of extraParentIds) {
        processCode(pId as string, true);
      }
    } else if (portalType === "teacher") {
      const teacherIds = [teacherCode, loggedInTeacher?.id, loggedInTeacher?.code, userProfile?.code, userProfile?.studentCode, activeUserId].filter(Boolean);
      for (const tId of teacherIds) {
        const clean = (tId as string).trim();
        const upper = clean.toUpperCase();
        const lower = clean.toLowerCase();
        possibleIdsSet.add(clean);
        possibleIdsSet.add(upper);
        possibleIdsSet.add(lower);
        possibleIdsSet.add(`tcode_${clean}`);
        possibleIdsSet.add(`tcode_${upper}`);
        possibleIdsSet.add(`tcode_${lower}`);
        possibleIdsSet.add(`tch_${clean}`);
        possibleIdsSet.add(`tch_${upper}`);
        possibleIdsSet.add(`tch_${lower}`);
        if (String(upper || "").startsWith("TCH-") || String(upper || "").startsWith("T-")) {
          const pure = String(upper || "").startsWith("TCH-") ? upper.slice(4) : upper.slice(2);
          possibleIdsSet.add(pure);
          possibleIdsSet.add(pure.toLowerCase());
          possibleIdsSet.add(`tcode_${pure}`);
          possibleIdsSet.add(`tcode_${pure.toLowerCase()}`);
          possibleIdsSet.add(`tch_${pure}`);
          possibleIdsSet.add(`tch_${pure.toLowerCase()}`);
          possibleIdsSet.add(`tcode_TCH-${pure}`);
          possibleIdsSet.add(`tcode_T-${pure}`);
          possibleIdsSet.add(`tch_TCH-${pure}`);
        } else {
          possibleIdsSet.add(`TCH-${upper}`);
          possibleIdsSet.add(`T-${upper}`);
          possibleIdsSet.add(`tcode_TCH-${upper}`);
          possibleIdsSet.add(`tch_TCH-${upper}`);
        }
      }
    }

    const possibleIds = Array.from(possibleIdsSet).filter(Boolean);
    const currentIdsStr = possibleIds.join(",");

    // Only clear cache and previous notifications if the user/codes actually changed
    if (prevPossibleIds.current !== currentIdsStr) {
      setNotifications((prev) =>
        prev.filter(
          (n) =>
            n.type === "alarm" || n.recipientRole === "admin" || !n.recipientRole,
        ),
      );
      processedFirestoreNotifs.current.clear();
      prevPossibleIds.current = currentIdsStr;
      lastProfileSwitchTime.current = Date.now();
    }

    if (possibleIds.length === 0) return;

    let isInitialLoad = processedFirestoreNotifs.current.size === 0;

    let isMounted = true;
    
    const fetchAppNotifs = async (signal?: AbortSignal) => {
       try {
         const res = await fetch(`/api/notifications?recipientIds=${encodeURIComponent(possibleIds.filter(id => id && id !== 'undefined').join(','))}`, { signal });
         if (!res.ok) {
           console.warn(`[App] Notification fetch failed: ${res.status}`);
           return;
         }
         
         const contentType = res.headers.get('content-type');
         if (!contentType || !contentType.includes('application/json')) {
            if (contentType?.includes('text/html')) {
                // Vite or SPA fallback might intercept during fast reloads/HMR
                // We'll safely ignore it to prevent cluttering the console
                return;
            }
            console.error('[App] Expected JSON notifications but got', contentType);
            return;
         }
         
         const data = await res.json();
         if (!isMounted || !data.success) return;
         
         const notifs = data.notifications
          .filter((d: any) => d.read === false || d.isRead === false)
          .filter((d: any) => !(portalType === "teacher" && d.type === "alarm"))
          .filter((d: any) => d.type !== "reminder")
          .filter((d: any) => {
            if (d.recipientRole) {
              const r = d.recipientRole.toLowerCase();
              if (portalType === "teacher") return r === "teacher" || r === "cadre" || r === "staff" || r === "general";
              if (portalType === "parent") return r === "parent" || r === "general";
              return r === "student" || r === "general";
            }
            if (d.recipientId && d.recipientId !== 'all') return true;
            return true;
          });
          
         if (notifs.length > 0) {
           const specialDoc = notifs.find((d: any) => d.type === 'challenge' || d.type === 'reward' || d.type === 'sovereignty' || d.type === 'level_up');
           if (specialDoc) {
             setNotification(specialDoc);
           } else {
             setNotification(null);
           }
           
           notifs.forEach((doc: any) => {
             if (!processedFirestoreNotifs.current.has(doc.id)) {
               let title = doc.title || (settings.language === "ar" ? "إشعار جديد" : "New Notification");
               let message = doc.body || doc.message || "";
               let type = doc.type || "general";
               
               if (doc.type === "challenge") {
                 title = settings.language === "ar" ? "تحدي الـ 60 ثانية!" : "60 Second Challenge!";
               } else if (doc.type === "level_up") {
                 title = settings.language === "ar" ? "ترقية المستوى! 🏆" : "Level Up! 🏆";
               } else if (doc.type === "siege") {
                 title = settings.language === "ar" ? "تحدي الحصار! 🏰" : "Siege Challenge! 🏰";
               }
               
               let showToast = !isInitialLoad && Date.now() - lastProfileSwitchTime.current > 3000;
               if (doc.createdAt) {
                 const notifTime = new Date(doc.createdAt).getTime();
                 if (Date.now() - notifTime > 60000) showToast = false;
               }
               if (portalType === "parent") showToast = false;
               
               addNotification(title, message, type as any, doc.id, doc.recipientRole || doc.type, showToast, doc.metadata?.broadcastId);
               processedFirestoreNotifs.current.add(doc.id);
             }
           });
         } else {
           setNotification(null);
         }
         isInitialLoad = false;
       } catch (err: any) {
         if (err.name === 'AbortError') return;
         if (err.message?.includes('Failed to fetch')) {
             console.warn("Network drop while fetching app notifs");
             return;
         }
         console.error("Error fetching app notifs:", err);
       }
    };
    
    const abortController = new AbortController();
    fetchAppNotifs(abortController.signal);
    
    // Fast sync when coming back from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAppNotifs();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    import('./lib/realtimeManager').then(({ realtimeManager }) => {
       realtimeManager.on('notifications_updated', () => fetchAppNotifs());
    });

    return () => {
       isMounted = false;
       abortController.abort();
       document.removeEventListener("visibilitychange", handleVisibilityChange);
       import('./lib/realtimeManager').then(({ realtimeManager }) => {
          realtimeManager.off('notifications_updated', () => fetchAppNotifs());
       });
    };
  }, [
    user?.uid,
    userProfile?.studentCode,
    verifiedStudentInfo?.code,
    verifiedStudentInfo?.studentCode,
    userProfile?.parentCode,
    verifiedStudentInfo?.parentCode,
    loggedInTeacher?.code,
    portalType,
    selectedStudentGrade,
    selectedSchoolId,
    settings.sovereigntyNotifications,
  ]);

  useEffect(() => {
    // Apply settings globally
    document.documentElement.style.setProperty(
      "--theme-primary",
      settings.themeColor === "blue"
        ? "#38bdf8"
        : settings.themeColor === "purple"
          ? "#bc13fe"
          : settings.themeColor === "gold"
            ? "#ffd700"
            : settings.themeColor === "emerald"
              ? "#00ff88"
              : "#ff0077",
    );
    document.documentElement.style.setProperty(
      "--theme-glow",
      settings.themeColor === "blue"
        ? "rgba(56, 189, 248, 0.5)"
        : settings.themeColor === "purple"
          ? "rgba(188, 19, 254, 0.5)"
          : settings.themeColor === "gold"
            ? "rgba(255, 215, 0, 0.5)"
            : settings.themeColor === "emerald"
              ? "rgba(0, 255, 136, 0.5)"
              : "rgba(255, 0, 119, 0.5)",
    );

    // Apply font family globally using data attributes
    document.documentElement.setAttribute("data-font", settings.fontFamily);

    // Remove old dynamic style if it exists
    const oldStyleEl = document.getElementById("dynamic-font-style");
    if (oldStyleEl) {
      oldStyleEl.remove();
    }

    safeStorage.setItem("s6_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Update rank based on mastered pages
    const masteredCount = progress.masteredPages?.length || 0;
    let newRank: "squire" | "knight" | "commander" | "guardian" = "squire";

    if (masteredCount >= 60) newRank = "guardian";
    else if (masteredCount >= 30) newRank = "commander";
    else if (masteredCount >= 10) newRank = "knight";

    if (progress.rank !== newRank) {
      setProgress((prev) => ({ ...prev, rank: newRank }));
    }
  }, [progress.masteredPages?.length, progress.rank]);

  useEffect(() => {
    if (user && notifications.length === 0) {
      addNotification(
        settings.language === "ar"
          ? "مرحباً بك في بوابة بيرق GATE 6! 👋"
          : "Welcome to BAYRAQ Gate GATE 6! 👋",
        settings.language === "ar"
          ? "نحن هنا لمساعدتك في رحلتك الدراسية. استكشف المحطات وابدأ التحدي!"
          : "We are here to help you in your study journey. Explore the stations and start the challenge!",
        "general",
      );
    }
  }, [user]);

  const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);

  const t = translations[settings.language];

  // Global Study Time Tracker
  useEffect(() => {
    if (activeSection === "unit-detail" && selectedUnitId) {
      const interval = setInterval(() => {
        updateProgress((prev) => ({
          ...prev,
          totalStudyTime: {
            ...prev.totalStudyTime,
            [selectedUnitId]: (prev.totalStudyTime[selectedUnitId] || 0) + 60,
          },
        }));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [activeSection, selectedUnitId]);

  // Study Reminder Logic
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const alarmInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!settings.studyReminder) return;

    const checkReminder = async () => {
      const now = new Date();
      const alarmTime = settings.studyReminder?.split(":").map(Number) || [
        0, 0,
      ];
      const [alarmHours, alarmMinutes] = alarmTime;
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentDay = now.getDay();

      // Reset hasFired if minute changed
      if (currentMinutes !== alarmMinutes) {
        setHasFired(false);
      }

      // Trigger if time matches, day is allowed, and not fired
      if (
        currentHours === alarmHours &&
        currentMinutes === alarmMinutes &&
        currentSeconds <= 5 &&
        !hasFired &&
        (settings.studyReminderDays || []).includes(currentDay)
      ) {
        // 1. Play sound
        if (!alarmAudioRef.current) {
          alarmAudioRef.current = new Audio(settings.studyTone);
          alarmAudioRef.current.loop = true;
        } else if (alarmAudioRef.current.src !== settings.studyTone) {
          alarmAudioRef.current.src = settings.studyTone;
        }
        alarmAudioRef.current.play().catch(() => {});

        // 2. Request Wake Lock
        if ("wakeLock" in navigator) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request("screen");
          } catch (err: any) {
            if (err.name !== "NotAllowedError") {
              console.error("Wake Lock request failed", err);
            }
          }
        }

        // 3. Set full-screen notification
        const msg =
          settings.language === "ar"
            ? "حان وقت الدراسة! هل أنت مستعد؟"
            : "It's study time! Are you ready?";
        setNotification({
          id: "study-reminder",
          type: "reminder",
          message: msg,
          timestamp: new Date(),
          read: false,
          isPersistent: true,
        });
        addNotification(
          settings.language === "ar" ? "تذكير دراسي" : "Study Reminder",
          msg,
          "alarm",
        );
        setHasFired(true);
      }
    };

    alarmInterval.current = setInterval(checkReminder, 1000);
    return () => {
      if (alarmInterval.current) clearInterval(alarmInterval.current);
    };
  }, [settings.studyReminder, settings.language, hasFired]);

  // Function to stop alarm
  const stopAlarm = async () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(console.error);
      wakeLockRef.current = null;
    }
    if (
      notification &&
      notification.id &&
      notification.id !== "study-reminder"
    ) {
      try {
        await updateDoc(doc(db, "notifications", notification.id), {
          read: true,
          isRead: true,
        });
      } catch (err) {
        console.error("Failed to mark remote reminder as read", err);
      }
    }
    setNotification(null);
    setHasFired(false);
  };

  // Wrap setProgress to check for badges and award points
  const updateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);

      // Award points and resources if a new page is mastered
      if (next.masteredPages.length > prev.masteredPages.length && user) {
        updatePoints(user.uid, 50, "Mastered a page").catch(console.error);
        const userRef = doc(db, "users", user.uid);
        setDoc(
          userRef,
          {
            resources: increment(10),
          },
          { merge: true },
        ).catch(console.error);
      }

      const newBadges = checkNewBadges(prev, next);

      if (newBadges.length > 0) {
        // Add badges to progress
        const updatedBadges = { ...next.badges };
        const now = new Date().toISOString();
        newBadges.forEach((b) => {
          updatedBadges[b.id] = now;
        });

        // Trigger notification for the first one
        setEarnedBadge(newBadges[0]);

        newBadges.forEach((b) => {
          addNotification(
            settings.language === "ar"
              ? "وسام جديد! 🏆"
              : "New Badge Earned! 🏆",
            settings.language === "ar"
              ? `لقد حصلت على وسام "${b.title}". استمر في التقدم!`
              : `You've earned the "${b.title}" badge. Keep it up!`,
            "general",
          );
        });

        return { ...next, badges: updatedBadges };
      }

      return next;
    });
  };

  // Save settings and local progress whenever they change
  useEffect(() => {
    safeStorage.setItem("s6_activeSection", activeSection);
    if (selectedUnitId)
      safeStorage.setItem("s6_selectedUnitId", selectedUnitId.toString());
    safeStorage.setItem("s6_settings", JSON.stringify(settings));
    safeStorage.setItem("s6_progress", JSON.stringify(progress));
  }, [activeSection, selectedUnitId, settings, progress]);

  // Sync progress to Firestore
  useEffect(() => {
    if (!user) return;

    // We remove the auto-debounce write completely to stop quota exhaustion.
    // Progress will be persisted to safeStorage and restored on refresh.
    // The issue was progress mutating and triggering infinite loop.
  }, [progress, user]); // Only run when progress or user changes

  const resetProgress = () => {
    setProgress(INITIAL_PROGRESS);
    safeStorage.removeItem("s6_progress");
    // Also reset progress in Firestore
    if (user) {
      setDoc(
        doc(db, "users", user.uid),
        { progress: INITIAL_PROGRESS },
        { merge: true },
      ).catch(console.error);
    }
  };

  const clearNotes = () => {
    // Implement or leave as is if not needed
  };

  const resetSettings = () => {
    setSettings(INITIAL_SETTINGS);
    safeStorage.removeItem("s6_settings");
  };

  const handleSelectUnit = (unitId: UnitId) => {
    setSelectedUnitId(unitId);
    setActiveSection("unit-detail");
  };

  const [isChoosingSchool, setIsChoosingSchool] = useState(false);



  // Watch for school suspension status in real-time
  useEffect(() => {
    if (!selectedSchoolId || portalType === 'developer') return;

    const schoolRef = doc(db, "schools", selectedSchoolId);
    const unsubscribe = onSnapshot(schoolRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const status = (data.status || '').trim().toLowerCase();
        const isSuspended = status === 'suspended' || status === 'disabled' || status === 'inactive' || status === 'معطلة' || status === 'موقوفة';
        
        if (isSuspended) {
          setSuspendedSchoolName(data.name || 'المدرسة');
        } else {
          setSuspendedSchoolName(null);
        }
      }
    }, (err) => {
      console.error("Error watching school status:", err);
    });

    return () => unsubscribe();
  }, [selectedSchoolId, portalType]);

  const renderContent = () => {
    const isAuthDevEmail = auth.currentUser?.email?.toLowerCase() === 'mntzralghanm527@gmail.com';
    const isProfileDevEmail = userProfile?.email?.toLowerCase() === 'mntzralghanm527@gmail.com';
    const isDeveloperEmail = isAuthDevEmail || isProfileDevEmail;
    const isDevOrSuper = portalType === 'developer' || portalType === 'superadmin' || isDeveloperEmail;

    if (suspendedSchoolName && !isDevOrSuper) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 text-center animate-in fade-in duration-500" dir="rtl">
          <div className="max-w-md w-full space-y-8">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-rose-500/10 rounded-3xl border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.2)]">
              <ShieldOff size={48} className="text-rose-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center border-2 border-black">
                <LockIcon size={12} className="text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white leading-tight">
                تنبيه: تم تجميد <br />
                <span className="text-rose-400">حساب المدرسة</span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed font-medium">
                نعتذر منك، تم تعطيل وتجميد كافة خدمات مدرسة <br />
                <span className="text-white font-bold">({suspendedSchoolName})</span> <br />
                من قبل إدارة المنظومة (المطور) لأسباب فنية أو إدارية.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3 text-right">
              <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-1" />
              <p className="text-[11px] text-white/50 leading-relaxed">
                هذا الإجراء يمنع الدخول للمنصة التعليمية، لوحة الإدارة، وتطبيق أولياء الأمور والطلبة بشكل كامل حتى يتم معالجة الموقف من قبل الإدارة العامة للمدرسة.
              </p>
            </div>

            <button
              onClick={performSuspensionLogout}
              className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group"
            >
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              العودة للرئيسية
            </button>

            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              نظام بيرق التعليمي - الفئة الذهبية
            </p>
          </div>
        </div>
      );
    }

    if (!user) return <AuthPage onOpenPrivacy={() => setShowPrivacyPublic(true)} />;

    if (activeSection === "gate-6") {
      return <Gate6 onBack={() => setActiveSection('hub')} />;
    }

    if (activeSection === "privacy-policy") {
      return <PrivacyPolicy onBack={() => setActiveSection('control')} />;
    }

    // 1. If choosing school or in mayadeen section, show SchoolSelection
    if (isChoosingSchool || activeSection === "mayadeen") {
      return (
        <SchoolSelection
          language={settings.language}
          user={user}
          userProfile={userProfile}
          onBack={() => {
            setIsChoosingSchool(false);
            setShowRoleSelectionModal(true);
            safeStorage.removeItem("bayraq_user_role");
            setPortalType("student");
          }}
          onNavigateHome={() => {
            setIsChoosingSchool(false);
            setActiveSection("hub");
          }}
          onNavigateHallOfFame={() => {
            setIsChoosingSchool(false);
            setActiveSection("hall-of-fame");
          }}
          onOpenNotifications={() => {
            setIsNotificationDrawerOpen(true);
          }}
          onSelectSchool={(id) => {
            setSelectedSchoolId(id);
            setIsSchoolVerified(false); // Reset verification state
            safeStorage.setItem("s6_selectedSchoolId", id);
            setIsChoosingSchool(false);
            setActiveSection("school-content");
          }}
        />
      );
    }

    const effectiveSection = activeSection;

    // 2. Main structure
    console.log("[DEBUG] rendering section:", effectiveSection, "portalType:", portalType);
    switch (effectiveSection as string) {
      case "school-content": {
        console.log("[DEBUG] portalType inside school-content:", portalType);
        const currentSchool = allSchoolsList.find(
          (s) => s.id === selectedSchoolId,
        );
        const institutionName = currentSchool
          ? currentSchool.name
          : selectedSchoolId ? getOfficialSchoolName(selectedSchoolId) : "";

        if (!isSchoolVerified) {
          const isAcademy =
            selectedSchoolId === "general" ||
            selectedSchoolId === "academy" ||
            (institutionName &&
              (institutionName.includes("أكاديمية") ||
                institutionName.includes("اكاديمية")) &&
              !institutionName.includes("إبداعنا") &&
              !institutionName.includes("ابداعنا"));

          const handleAccessVerify = async (code: string, isParent: boolean) => {
            setIsVerifying(true);
            try {
              const user = await customAuth.loginWithCode(
                code,
                selectedSchoolId || undefined,
              );
              setIsSchoolVerified(true);
              if (
                user.role === "teacher" ||
                (user as any).role === "TEACHER"
              ) {
                setPortalType("teacher");
                const teacherObj = {
                  id: user.uid || (user as any).id,
                  code: code, // Add the login code here
                  name:
                    user.displayName ||
                    (user as any).name ||
                    "الأستاذ المحاضر",
                  schoolId: user.schoolId || selectedSchoolId || "school8",
                  subject: (user as any).subject || "المنهج الوزاري",
                  grade: (user as any).grade || "السادس العلمي",
                  classes: (user as any).classes || [],
                  role: "teacher",
                };
                setLoggedInTeacher(teacherObj);
                setUserProfile((prev: any) => ({
                  ...prev,
                  ...user,
                  role: "teacher",
                  name: teacherObj.name,
                }));
              } else if (
                user.role === "admin" ||
                (user as any).role === "ADMIN"
              ) {
                const branch = user.schoolId && user.schoolId.includes("boys") ? "admin-boys" : "admin-girls";
                setPortalType(branch);
                safeStorage.setItem("bayraq_user_role", branch);
                
                try {
                  const docRef = doc(db, "users", user.uid || (user as any).id);
                  setDoc(docRef, { role: "admin", adminBranch: user.schoolId && user.schoolId.includes("boys") ? "boys" : "girls" }, { merge: true });
                } catch(e) {}

                setVerifiedStudentInfo({
                  id: user.uid,
                  code: code,
                  name: user.displayName || "",
                  role: user.role,
                  schoolId: user.schoolId,
                });
              } else if (user.role === "parent") {
                setPortalType("parent");
                const studentGrade =
                  (user as any).grade ||
                  (user as any).academicLevel ||
                  "";
                if (studentGrade) {
                  setSelectedStudentGrade(studentGrade);
                }
                setVerifiedStudentInfo({
                  id: user.uid,
                  parentCode: code,
                  code: code,
                  studentCode: (user as any).studentCode || code,
                  name:
                    (user as any).studentName ||
                    user.displayName ||
                    "",
                  studentName:
                    (user as any).studentName ||
                    user.displayName ||
                    "",
                  role: "parent",
                  grade: studentGrade,
                  schoolId: user.schoolId || selectedSchoolId,
                  gender: (user as any).gender,
                });
              } else if (user.role === "driver") {
                setPortalType("driver");
                setVerifiedStudentInfo({
                  id: user.uid,
                  code: code,
                  name: user.displayName || "",
                  role: "driver",
                  schoolId: user.schoolId,
                });
              } else {
                // Student
                setPortalType("student");
                const studentGrade =
                  (user as any).grade ||
                  (user as any).academicLevel ||
                  "";
                if (studentGrade) {
                  setSelectedStudentGrade(studentGrade);
                }
                setVerifiedStudentInfo({
                  id: user.uid,
                  code: code,
                  studentCode: (user as any).studentCode || code,
                  name:
                    user.displayName ||
                    (user as any).name ||
                    "طالب الأكاديمية",
                  role: "student",
                  grade: studentGrade || "سادس علمي",
                  schoolId:
                    user.schoolId || selectedSchoolId || "school8",
                  gender: (user as any).gender,
                });
              }
            } catch (e: any) {
              if (e.message === 'SCHOOL_SUSPENDED' || e.isSchoolSuspended) {
                setSuspendedSchoolName(e.schoolName || institutionName || "المدرسة");
              } else if (e.message === 'ACCOUNT_BANNED') {
                setBannedCode(code);
              } else {
                addNotification(
                  "خطأ في التحقق",
                  e.message || "كود الدخول غير صحيح",
                  "alarm",
                );
              }
            } finally {
              setIsVerifying(false);
            }
          };

          if (bannedCode) {
            return (
              <div className="fixed inset-0 bg-[#050A18] flex flex-col items-center justify-center p-6 text-center z-[110]" dir="rtl">
                <button 
                  onClick={() => setBannedCode(null)}
                  className="fixed top-8 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ArrowRight size={20} />
                </button>
                <div className="max-w-sm w-full bg-rose-500/10 border border-rose-500/20 rounded-3xl p-8 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mb-2 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                    <LockIcon size={36} />
                  </div>
                  <h2 className="text-3xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">حساب مجمد</h2>
                  <p className="text-rose-400/80 text-base leading-relaxed mt-2 text-center">
                    عذراً، لقد تم تجميد هذا الحساب من قبل الإدارة. يرجى مراجعة إدارة المدرسة لمعرفة السبب وطلب رفع التجميد.
                  </p>
                  <button 
                    onClick={() => setBannedCode(null)}
                    className="mt-6 w-full py-4 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl font-bold transition-all active:scale-95"
                  >
                    العودة للرئيسية
                  </button>
                </div>
              </div>
            );
          }

          if (isAcademy) {
            return (
              <BayraqAcademyHub
                key={selectedSchoolId || "academy"}
                onVerify={handleAccessVerify}
                onBack={() => {
                  setActiveSection("mayadeen");
                  setSelectedSchoolId(null);
                  safeStorage.removeItem("s6_selectedSchoolId");
                }}
                isVerifying={isVerifying}
              />
            );
          }

          return (
            <SchoolAccessGate
              key={selectedSchoolId}
              schoolName={institutionName}
              isVerifying={isVerifying}
              onBack={() => {
                setActiveSection("mayadeen");
                setSelectedSchoolId(null);
                safeStorage.removeItem("s6_selectedSchoolId");
              }}
              onVerify={handleAccessVerify}
            />
          );
        }

        if (portalType === "driver") {
          return (
            <DriverPortal
              loggedInDriver={loggedInDriver}
              selectedSchoolId={selectedSchoolId}
              userProfile={userProfile}
              institutionName={institutionName}
              onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
              onBack={() => {
                setActiveSection("hub");
              }}
            />
          );
        }

        if (portalType === "parent") {
          return (
            <ParentPortal
              studentName={
                verifiedStudentInfo?.studentName ||
                verifiedStudentInfo?.fullName ||
                verifiedStudentInfo?.name ||
                verifiedStudentInfo?.userName ||
                "طالب مجهول"
              }
              studentCode={
                verifiedStudentInfo?.studentCode || verifiedStudentInfo?.code || verifiedStudentInfo?.parentCode
              }
              schoolId={verifiedStudentInfo?.schoolId || selectedSchoolId}
              schoolName={institutionName}
              gender={verifiedStudentInfo?.gender}
              grade={verifiedStudentInfo?.grade || selectedStudentGrade || ""}
              onBack={() => {
                setActiveSection("hub");
              }}
            />
          );
        }

        if (
          (portalType === "admin-boys" || portalType === "admin-girls")
        ) {
          return (
            <AdminDashboard
              schoolName={institutionName}
              selectedSchoolId={selectedSchoolId}
              adminBranch={portalType === "admin-boys" ? "boys" : "girls"}
              onBack={() => {
                setActiveSection("hub");
              }}
              onSendMessage={handleBroadcastMessage}
              onUpdateMessage={handleBroadcastUpdate}
            />
          );
        }

        if (portalType === "admin-observer" && !selectedStudentGrade) {
          return (
            <div
              className="min-h-screen bg-[#050A18] flex items-center justify-center p-6"
              dir="rtl"
            >
              <div className="max-w-md w-full bg-[#101935] rounded-3xl p-6 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <h2 className="text-2xl font-black text-[#FFD600] mb-6 text-center">
                  اختر الصف للمراقبة
                </h2>
                <div className="space-y-3">
                  {AVAILABLE_GRADES.map((grade) => (
                    <button
                      key={grade}
                      onClick={() => setSelectedStudentGrade(grade)}
                      className="w-full text-right bg-white/5 hover:bg-[#FFD600]/20 hover:text-[#FFD600] text-white p-4 rounded-2xl transition-colors font-bold"
                    >
                      {grade}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setActiveSection("hub");
                  }}
                  className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-center text-white/50 text-sm transition-colors"
                >
                  رجوع
                </button>
              </div>
            </div>
          );
        }

        return (
          <SchoolPlatform
            highlightTasksSection={highlightTasksSection}
            onClearHighlightTasks={() => setHighlightTasksSection(false)}
            progress={progress}
            setProgress={updateProgress}
            schoolName={institutionName}
            schoolId={selectedSchoolId || verifiedStudentInfo?.schoolId || userProfile?.schoolId || ""}
            grade={selectedStudentGrade || verifiedStudentInfo?.grade || userProfile?.grade || ""}
            gradeName={selectedStudentGrade || verifiedStudentInfo?.grade || userProfile?.grade || ""}
            onBack={() => {
              setActiveSection("hub");
            }}
            language={settings.language}
            portalType={portalType}
            isTeacher={portalType === "teacher"}
            teacherData={loggedInTeacher}
            userProfile={(() => {
              if (portalType === "student" && verifiedStudentInfo) {
                return {
                  ...userProfile,
                  ...verifiedStudentInfo,
                  photoURL: verifiedStudentInfo.photoURL || null,
                  id: verifiedStudentInfo.id,
                  studentCode:
                    verifiedStudentInfo.code ||
                    verifiedStudentInfo.studentCode ||
                    verifiedStudentInfo.id,
                  role: "student",
                  isAdmin: false,
                  adminType: null,
                };
              }
              if (portalType === "admin-observer" && verifiedStudentInfo) {
                return {
                  ...userProfile,
                  ...verifiedStudentInfo,
                  role: "admin",
                  isAdmin: true,
                  adminType: "observer",
                };
              }
              return (
                userProfile ||
                (verifiedStudentInfo
                  ? {
                      id: verifiedStudentInfo.id,
                      studentCode:
                        verifiedStudentInfo.code ||
                        verifiedStudentInfo.studentCode ||
                        verifiedStudentInfo.id,
                      ...verifiedStudentInfo,
                    }
                  : null)
              );
            })()}
            onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
            onUpdateProfile={(data) => {
              setUserProfile((prev: any) => ({ ...prev, ...data }));
              setVerifiedStudentInfo((prev: any) =>
                prev ? { ...prev, ...data } : prev,
              );
            }}
            onMarkNotificationAsRead={markNotificationAsRead}
            onDeleteNotification={(id) =>
              setNotifications((prev) => prev.filter((n) => n.id !== id))
            }
            onClearAllNotifications={() => setNotifications([])}
            notifications={memoizedNotifications}
          />
        );
      }
      case "profile-setup":
        return (
          <ProfileSetup
            userId={user.uid}
            language={settings.language}
            onComplete={(updatedData) => {
              setUserProfile((prev: any) => ({ ...prev, ...updatedData }));
              setActiveSection("hub");
            }}
          />
        );
      case "hub": {
        const isTeacherUser =
          portalType === "teacher" ||
          userProfile?.role === "teacher" ||
          !!loggedInTeacher;

        const isParentUser =
          portalType === "parent" ||
          userProfile?.role === "parent";

        const navigateToParentPlatform = (targetTab: string) => {
          setPortalType("parent");
          safeStorage.setItem("bayraq_user_role", "parent");
          safeStorage.setItem("s6_target_parent_tab", targetTab);

          let targetSchool = selectedSchoolId;
          if (!targetSchool) {
            targetSchool =
              safeStorage.getItem("s6_selectedSchoolId") ||
              safeStorage.getItem("s6_preferred_school") ||
              userProfile?.schoolId ||
              "school1";
            setSelectedSchoolId(targetSchool);
            safeStorage.setItem("s6_selectedSchoolId", targetSchool);
          }

          setIsChoosingSchool(false);
          setActiveSection("school-content");
        };

        const navigateToTeacherPlatform = (
          targetTab: string,
          subControlTab?: string,
          aiTool?: string
        ) => {
          setPortalType("teacher");
          safeStorage.setItem("bayraq_user_role", "teacher");
          safeStorage.setItem("s6_target_tab", targetTab);
          if (subControlTab) {
            safeStorage.setItem("s6_target_control_tab", subControlTab);
          }
          if (aiTool) {
            safeStorage.setItem("s6_target_ai_tool", aiTool);
          }

          let targetSchool = selectedSchoolId;
          if (!targetSchool) {
            targetSchool =
              safeStorage.getItem("s6_selectedSchoolId") ||
              safeStorage.getItem("s6_preferred_school") ||
              userProfile?.schoolId ||
              "school1";
            setSelectedSchoolId(targetSchool);
            safeStorage.setItem("s6_selectedSchoolId", targetSchool);
          }

          setIsChoosingSchool(false);
          setActiveSection("school-content");
        };
        const isAdminUser =
          portalType === "admin-boys" ||
          portalType === "admin-girls" ||
          userProfile?.role === "admin" ||
          userProfile?.role === "dev";

        const isDriverUser =
          portalType === "driver" ||
          userProfile?.role === "driver";

        const resolvedSchoolData = allSchoolsList.find(
          (s) => s.id === (selectedSchoolId || userProfile?.schoolId),
        );
        const resolvedSchoolName = resolvedSchoolData?.name || userProfile?.schoolName || "بوابة بيرق";

        if (isAdminUser) {
          return (
            <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-32">
              <AdminHomeDashboard
                schoolName={resolvedSchoolName}
                selectedSchoolId={selectedSchoolId || userProfile?.schoolId}
                setActiveTab={(tab) => {
                  safeStorage.setItem("s6_admin_target_tab", tab);
                  safeStorage.setItem("s6_admin_target_tab_glow", tab);
                  setActiveSection("admin-hub");
                }}
                onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
              />
            </div>
          );
        }

        if (isDriverUser) {
          return <DriverDashboard driverId={loggedInDriver?.id || "unknown"} routeId={loggedInDriver?.routeId || "unknown"} onBack={() => setActiveSection("hub")} />;
        }

        if (isParentUser) {
          return <ParentPortal studentName={userProfile?.name || "ولي أمر"} onBack={() => setActiveSection("hub")} />;
        }
        
        const currentSchool = allSchoolsList.find(
          (s) => s.id === selectedSchoolId,
        );
        const institutionName = currentSchool
          ? currentSchool.name
          : selectedSchoolId ? getOfficialSchoolName(selectedSchoolId) : "مدرسة غير محددة";
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md mx-auto min-h-screen pb-32 pt-6 font-sans px-4 space-y-7"
          >
            {/* Header / الترويسة الفاخرة */}
            <div className="flex flex-row items-center justify-between">
              {/* Logo top right - Minimal */}
              <div className="w-14 h-14 shrink-0 overflow-hidden rounded-[1rem] relative border border-white/5 flex items-center justify-center bg-[#0A0F1D] p-1 group hover:scale-105 transition-transform shadow-sm">
                <img
                  src={dynamicAppLogo}
                  alt="شعار البوابة"
                  className="w-full h-full object-contain scale-110 drop-shadow-sm rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>

              {/* Center aligned Verse */}
              <div className="flex-1 text-center">
                <span className="text-[#D4AF37] font-black font-amiri text-lg drop-shadow-sm tracking-wide">
                  وَقُل رَّبِّ زِدْنِي عِلْمًا
                </span>
              </div>

              {/* Notification left */}
              <div className="w-14 h-14 flex items-center justify-center shrink-0">
                <button
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  className="w-12 h-12 rounded-[1rem] bg-[#0A0F1D] border border-white/5 flex items-center justify-center relative hover:bg-white/5 transition-all shadow-sm active:scale-95 group"
                >
                  <Bell size={20} className="text-white/60 group-hover:text-white transition-colors" />
                  {memoizedNotifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-[#0A0F1D] animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Welcome Card - Horizontal Layout */}
            {isTeacherUser ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative overflow-hidden rounded-[1.75rem] bg-[#0A0F1D] border border-amber-500/20 p-5 sm:p-6 shadow-[0_4px_40px_rgba(245,158,11,0.08)] w-full flex flex-col gap-3"
              >
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle at right 50%, #F59E0B, transparent 70%)`
                  }}
                />

                <div className="relative z-10 flex items-center gap-3.5 flex-row-reverse">
                  {/* Teacher Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-[1.25rem] border-2 border-amber-400/40 p-0.5 flex items-center justify-center relative bg-gradient-to-br from-amber-500/20 via-indigo-500/10 to-amber-500/30 shadow-md overflow-hidden">
                    <img
                      src={getProfessionalAvatar(userProfile)}
                      alt="Avatar"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  {/* Teacher Info */}
                  <div className="flex-1 min-w-0 flex flex-col items-end justify-center">
                    <h2 className="text-[11px] sm:text-xs font-medium text-amber-300/80 mb-0.5">
                      أهلاً وسهلاً بك،
                    </h2>
                    <h1 className="text-xl sm:text-2xl font-black text-white truncate w-full text-right drop-shadow-sm">
                      {loggedInTeacher?.name || userProfile?.fullName || userProfile?.name || auth.currentUser?.displayName || "الأستاذ الفاضل"}
                    </h1>
                    <div className="mt-1 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <span className="text-[10px] font-bold text-amber-300 truncate">
                        {institutionName && institutionName !== "مدرسة غير محددة"
                          ? institutionName
                          : "المعلم المقتدر"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 w-full bg-white/5 rounded-xl p-2.5 border border-white/5 text-right flex items-center justify-between gap-2 px-3">
                  <span className="text-[11px] font-bold text-white/70">
                    منصة المعلم الذكية • إدارة الصف والبث المباشر والاختبارات
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                </div>
              </motion.div>
            ) : isParentUser ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative overflow-hidden rounded-[1.75rem] bg-[#0A0F1D] border border-amber-500/20 p-5 sm:p-6 shadow-[0_4px_40px_rgba(245,158,11,0.08)] w-full flex flex-col gap-3"
              >
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle at right 50%, #D4AF37, transparent 70%)`
                  }}
                />

                <div className="relative z-10 flex items-center gap-3.5 flex-row-reverse">
                  {/* Parent Avatar */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-[1.25rem] border-2 border-amber-400/40 p-0.5 flex items-center justify-center relative bg-gradient-to-br from-amber-500/20 via-indigo-500/10 to-amber-500/30 shadow-md overflow-hidden">
                    <img
                      src={getProfessionalAvatar(userProfile)}
                      alt="Avatar"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>

                  {/* Parent Info */}
                  <div className="flex-1 min-w-0 flex flex-col items-end justify-center">
                    <h2 className="text-[11px] sm:text-xs font-medium text-amber-300/80 mb-0.5">
                      أهلاً وسهلاً بك،
                    </h2>
                    <h1 className="text-xl sm:text-2xl font-black text-white truncate w-full text-right drop-shadow-sm">
                      ولي أمر {verifiedStudentInfo?.fullName || verifiedStudentInfo?.name || userProfile?.studentName || userProfile?.fullName || userProfile?.name || auth.currentUser?.displayName || "الطالب"}
                    </h1>
                    <div className="mt-1 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <span className="text-[10px] font-bold text-amber-300 truncate">
                        {institutionName && institutionName !== "مدرسة غير محددة"
                          ? institutionName
                          : "مدرسة الأوائل"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 w-full bg-white/5 rounded-xl p-2.5 border border-white/5 text-right flex items-center justify-between gap-2 px-3">
                  <span className="text-[11px] font-bold text-white/70">
                    بوابة ولي الأمر الرقمية • متابعة مباشرة للحضور والدرجات والرسوم
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative overflow-hidden rounded-[1.75rem] bg-[#0A0F1D] border border-indigo-500/10 p-5 sm:p-6 shadow-[0_4px_40px_rgba(99,102,241,0.06)] w-full flex flex-col gap-4"
              >
                {/* Subtle Ambient Background Glow */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
                  style={{
                    background: `radial-gradient(circle at right 50%, #4F46E5, transparent 70%)`
                  }}
                />

                <div className="relative z-10 flex items-center gap-3.5 flex-row-reverse">
                  {/* Circular Avatar */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-[1.25rem] border-[2px] ${getStudentLevelInfo(userProfile?.xp || userProfile?.totalScore || 0).borderColor} p-0.5 flex items-center justify-center relative bg-gradient-to-br ${getStudentLevelInfo(userProfile?.xp || userProfile?.totalScore || 0).bgGradient} shadow-md overflow-hidden`}>
                    <img
                      src={getProfessionalAvatar(userProfile)}
                      alt="Avatar"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0 flex flex-col items-end justify-center">
                    <h2 className="text-[11px] sm:text-xs font-medium text-white/50 mb-0.5">
                      عودة ميمونة،
                    </h2>
                    <h1 className="text-xl sm:text-2xl font-black text-white truncate w-full text-right drop-shadow-sm">
                      {(userProfile?.fullName || userProfile?.name || auth.currentUser?.displayName || "يا بطل").split(" ")[0]}
                    </h1>
                    <div className="mt-1 flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      <span className="text-[9px] sm:text-[10px] font-bold text-white/70 truncate">
                        {userProfile?.schoolName && userProfile?.schoolName !== "school_baghdad" && userProfile?.schoolName !== "مدرسة غير محددة"
                          ? `${userProfile?.schoolName} - ${userProfile?.grade || ""}`
                          : "بطل بيرق"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress / XP Bar */}
                <div className="relative z-10 w-full mt-1 bg-black/30 rounded-2xl p-3 border border-white/5 backdrop-blur-sm shadow-inner">
                  <div className="flex justify-between items-center mb-2 flex-row-reverse">
                    <div className="flex items-center gap-1.5 flex-row-reverse">
                      <Zap size={14} className="text-[#D4AF37]" />
                      <span className="text-[11px] sm:text-xs font-bold text-[#D4AF37]">
                        {(userProfile?.xp || 0).toLocaleString("ar-IQ")} نقطة
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-medium text-white/50">
                      {userProfile?.xp >= 5000 ? "مستوى الأسطورة الأقصى 🏆" : `بقي ${getXpProgressDetails(userProfile?.xp || 0).remaining.toLocaleString("ar-IQ")} نقطة للترقية للمستوى التالي`}
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 w-full bg-[#050812] rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getXpProgressDetails(userProfile?.xp || 0).percentage}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-[#D4AF37] via-[#FCD34D] to-[#D4AF37] rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Smart Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full relative group"
            >
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none z-10">
                <Search
                  size={20}
                  strokeWidth={1.5}
                  className="text-white/40 group-focus-within:text-indigo-400 transition-colors"
                />
              </div>
              <input
                type="text"
                placeholder={isTeacherUser ? "ابحث عن ملف، طالب، أو درس..." : "ابحث عن درس، أو ملف..."}
                dir="rtl"
                className="w-full bg-[#0A0F1D] border border-white/5 rounded-[1.5rem] py-3.5 pr-12 pl-4 text-[13px] font-bold text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm text-right hover:border-white/10"
              />
            </motion.div>

            {/* Quick Stats Grid or Teacher Direct Dashboard */}
            {isTeacherUser ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 w-full"
              >
                {/* Core Navigation Cards */}
                <div className="grid grid-cols-2 gap-3.5 w-full">
                  {/* 1. البث المباشر */}
                  <div
                    onClick={() => navigateToTeacherPlatform("control", "live")}
                    className="bg-[#0A0F1D] border border-amber-500/20 hover:border-amber-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(245,158,11,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <RadioIcon size={20} className="text-amber-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        البث المباشر 📡
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        بدء وإدارة القاعة التفاعلية
                      </span>
                    </div>
                  </div>

                  {/* 2. محول العرض التفاعلي */}
                  <div
                    onClick={() => navigateToTeacherPlatform("control", "content")}
                    className="bg-[#0A0F1D] border border-indigo-500/20 hover:border-indigo-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(99,102,241,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <Presentation size={20} className="text-indigo-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-indigo-300 transition-colors">
                        محول العرض التفاعلي 🪄
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        تحويل الكتب والملازم ذكياً
                      </span>
                    </div>
                  </div>

                  {/* 3. الإشعارات */}
                  <div
                    onClick={() => navigateToTeacherPlatform("control", "announcements")}
                    className="bg-[#0A0F1D] border border-cyan-500/20 hover:border-cyan-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(6,182,212,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        التبليغات
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <Bell size={20} className="text-cyan-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                        الإشعارات والتعاميم 🔔
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        عرض وإدارة التنبيهات الرسمية
                      </span>
                    </div>
                  </div>

                  {/* 4. الواجبات المطلوب تصحيحها */}
                  <div
                    onClick={() => navigateToTeacherPlatform("control", "assessment")}
                    className="bg-[#0A0F1D] border border-emerald-500/20 hover:border-emerald-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(16,185,129,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        تصحيح
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <ClipboardCheck size={20} className="text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                        الواجبات والتصحيح 📝
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        متابعة وتصحيح إجابات الطلاب
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3 px-1" dir="rtl">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                      ⚡ إجراءات سريعة للأستاذ
                    </span>
                    <span className="text-[10px] font-bold text-white/40">أدوات إعداد المحتوى والدروس</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 5. زر سريع لإنشاء واجب */}
                    <button
                      onClick={() => navigateToTeacherPlatform("ai_assistant", undefined, "homework")}
                      className="w-full bg-gradient-to-r from-amber-500/10 via-[#0A0F1D] to-[#0A0F1D] border border-amber-500/30 hover:border-amber-400 p-3.5 rounded-2xl flex items-center justify-between gap-3 group transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(245,158,11,0.2)] active:scale-95 text-right"
                      dir="rtl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-110 transition-transform">
                        <PlusCircle size={18} />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="block text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                          إنشاء واجب جديد 📝
                        </span>
                        <span className="block text-[10px] font-medium text-white/50">
                          توليد واجب ذكي للطلاب
                        </span>
                      </div>
                    </button>

                    {/* 6. زر لإنشاء مسابقة */}
                    <button
                      onClick={() => navigateToTeacherPlatform("ai_assistant", undefined, "competitions")}
                      className="w-full bg-gradient-to-r from-indigo-500/10 via-[#0A0F1D] to-[#0A0F1D] border border-indigo-500/30 hover:border-indigo-400 p-3.5 rounded-2xl flex items-center justify-between gap-3 group transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.2)] active:scale-95 text-right"
                      dir="rtl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 group-hover:scale-110 transition-transform">
                        <Trophy size={18} />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="block text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                          إنشاء مسابقة صفية 🏆
                        </span>
                        <span className="block text-[10px] font-medium text-white/50">
                          تحديات واختبارات حماسية
                        </span>
                      </div>
                    </button>

                    {/* 7. زر رفع ملف */}
                    <button
                      onClick={() => navigateToTeacherPlatform("control", "files_center")}
                      className="w-full bg-gradient-to-r from-emerald-500/10 via-[#0A0F1D] to-[#0A0F1D] border border-emerald-500/30 hover:border-emerald-400 p-3.5 rounded-2xl flex items-center justify-between gap-3 group transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)] active:scale-95 text-right"
                      dir="rtl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 transition-transform">
                        <FileUp size={18} />
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <span className="block text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                          رفع ملف / ملزمة 📂
                        </span>
                        <span className="block text-[10px] font-medium text-white/50">
                          إضافة للمكتبة المدرسية
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : isParentUser ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 w-full"
              >
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full">
                  {/* 1. الحضور والغياب */}
                  <div
                    onClick={() => navigateToParentPlatform("attendance")}
                    className="bg-[#0A0F1D] border border-emerald-500/20 hover:border-emerald-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(16,185,129,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        يومي
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <CalendarClock size={20} className="text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                        الحضور والغياب ⏱️
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        متابعة أوقات الحضور والانضباط
                      </span>
                    </div>
                  </div>

                  {/* 2. سجل الدرجات */}
                  <div
                    onClick={() => navigateToParentPlatform("grades")}
                    className="bg-[#0A0F1D] border border-cyan-500/20 hover:border-cyan-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(6,182,212,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        التقارير
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <BarChart3 size={20} className="text-cyan-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-cyan-300 transition-colors">
                        سجل الدرجات 📚
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        نتائج الامتحانات والتقييمات
                      </span>
                    </div>
                  </div>

                  {/* 3. الإشعارات */}
                  <div
                    onClick={() => setIsNotificationDrawerOpen(true)}
                    className="bg-[#0A0F1D] border border-amber-500/20 hover:border-amber-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(245,158,11,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <Bell size={20} className="text-amber-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        الإشعارات والتعاميم 🔔
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        التبليغات العاجلة من المدرسة
                      </span>
                    </div>
                  </div>

                  {/* 4. الرسوم الدراسية */}
                  <div
                    onClick={() => navigateToParentPlatform("finance")}
                    className="bg-[#0A0F1D] border border-purple-500/20 hover:border-purple-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(168,85,247,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        الأقساط
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <Wallet size={20} className="text-purple-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                        الرسوم الدراسية 💳
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        سجل الدفعات والوصل الرقمي
                      </span>
                    </div>
                  </div>

                  {/* 5. آخر رسالة من المدرسة */}
                  <div
                    onClick={() => navigateToParentPlatform("messages")}
                    className="bg-[#0A0F1D] border border-pink-500/20 hover:border-pink-500/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(236,72,153,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-pink-500/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                        تواصل
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <MessageCircle size={20} className="text-pink-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-pink-300 transition-colors">
                        آخر رسالة من المدرسة 💬
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        المراسلات المباشرة مع الكادر
                      </span>
                    </div>
                  </div>

                  {/* 6. النقل المدرسي */}
                  <div
                    onClick={() => navigateToParentPlatform("transport")}
                    className="bg-[#0A0F1D] border border-[#FFD600]/20 hover:border-[#FFD600]/50 rounded-[1.5rem] p-4 flex flex-col justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_25px_rgba(255,214,0,0.2)] active:scale-95 min-h-[110px]"
                  >
                    <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#FFD600]/10 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-[10px] font-bold text-[#FFD600] bg-[#FFD600]/10 px-2 py-0.5 rounded-full border border-[#FFD600]/20">
                        الحافلة
                      </span>
                      <div className="w-10 h-10 rounded-2xl bg-[#FFD600]/10 border border-[#FFD600]/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        <Bus size={20} className="text-[#FFD600]" />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-sm font-black text-white group-hover:text-[#FFD600] transition-colors">
                        النقل المدرسي 🚌
                      </span>
                      <span className="block text-[10px] font-medium text-white/50 mt-0.5">
                        تتبع حافلة وموقع الابن
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full"
              >
              {/* 1. Daily Homework / الواجبات اليومية */}
              <div
                onClick={() => {
                  safeStorage.setItem("s6_target_tab", "tasks");
                  let targetSchool = selectedSchoolId;
                  if (!targetSchool) {
                    targetSchool = safeStorage.getItem("s6_selectedSchoolId") || safeStorage.getItem("s6_preferred_school") || userProfile?.schoolId || null;
                    if (!targetSchool) {
                      targetSchool = "school1";
                    }
                    setSelectedSchoolId(targetSchool);
                    safeStorage.setItem("s6_selectedSchoolId", targetSchool);
                  }

                  setHighlightTasksSection(true);
                  setIsChoosingSchool(false);
                  setActiveSection("school-content");
                }}
                className="bg-[#0A0F1D] border border-amber-500/10 hover:border-amber-500/30 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    الواجبات اليومية
                  </span>
                  <span className="block text-sm sm:text-base font-black text-white">
                    {todayTasksCount === null ? (
                      <span className="text-[10px] font-bold text-white/40 animate-pulse">جاري التحميل...</span>
                    ) : todayTasksCount > 0 ? (
                      <span className="text-amber-400 drop-shadow-sm">{todayTasksCount}</span>
                    ) : (
                      <span className="text-white/30 text-[10px] font-bold">مكتملة</span>
                    )}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <Trophy size={20} strokeWidth={1.5} className="text-amber-400" />
                </div>
              </div>

              {/* 2. Connected Knights / الفرسان المتصلين */}
              <div 
                onClick={() => setShowActiveKnights(true)}
                className="bg-[#0A0F1D] border border-orange-500/10 hover:border-orange-500/30 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(249,115,22,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    الفرسان المتصلين
                  </span>
                  <span className="block text-sm sm:text-base font-black text-white">
                    {activeKnightsCount || 1}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <Users size={20} strokeWidth={1.5} className="text-orange-400" />
                </div>
              </div>

                            {/* Gate 6 Button */}
              <div 
                onClick={() => setActiveSection("gate-6")}
                className="col-span-2 bg-[#0A0F1D] border border-yellow-500/30 hover:border-yellow-500/60 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-[0_0_15px_rgba(255,215,0,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    النظام الجديد
                  </span>
                  <span className="block text-sm sm:text-base font-black text-yellow-400 truncate">
                    بوابة بيرق (Gate 6)
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <Zap size={20} strokeWidth={1.5} className="text-yellow-400 animate-pulse" />
                </div>
              </div>
              {/* 3. Sovereignty Platform / تتويجات الصف */}
              <div
                onClick={() => setActiveSection("sovereignty")}
                className="bg-[#0A0F1D] border border-indigo-500/10 hover:border-indigo-500/30 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    تتويجات الصف
                  </span>
                  <span className="block text-sm sm:text-base font-black text-indigo-400">
                    السيادة
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <Shield size={20} strokeWidth={1.5} className="text-indigo-400" />
                </div>
              </div>

              {/* 4. Current Rank / الرتبة الحالية */}
              <div className="bg-[#0A0F1D] border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-default shadow-sm hover:shadow-[0_4px_20px_rgba(212,175,55,0.15)]">
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    الرتبة الحالية
                  </span>
                  <span className="block text-sm sm:text-base font-black text-[#D4AF37] truncate">
                    بطل بيرق
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform ml-2">
                  <Crown size={20} strokeWidth={1.5} className="text-[#D4AF37]" />
                </div>
              </div>

              {/* 5. Peer Standing / ترتيبك بين زملائك */}
              <div 
                onClick={() => setShowActiveKnights(true)}
                className="bg-[#0A0F1D] border border-amber-500/10 hover:border-amber-500/30 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    ترتيبك بين زملائك
                  </span>
                  <span className="block text-sm sm:text-base font-black text-amber-300 truncate">
                    المركز #2 🥈
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <Award size={20} strokeWidth={1.5} className="text-amber-400" />
                </div>
              </div>

              {/* 6. Last Read Lesson / آخر درس قرأته */}
              <div 
                onClick={() => {
                  safeStorage.setItem("s6_target_tab", "files");
                  let targetSchool = selectedSchoolId;
                  if (!targetSchool) {
                    targetSchool = safeStorage.getItem("s6_selectedSchoolId") || safeStorage.getItem("s6_preferred_school") || userProfile?.schoolId || "school1";
                    setSelectedSchoolId(targetSchool);
                    safeStorage.setItem("s6_selectedSchoolId", targetSchool);
                  }
                  setIsChoosingSchool(false);
                  setActiveSection("school-content");
                }}
                className="bg-[#0A0F1D] border border-cyan-500/10 hover:border-cyan-500/30 rounded-[1.5rem] p-3 flex flex-row items-center justify-between relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(6,182,212,0.15)] active:scale-95"
              >
                <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
                <div className="text-right flex-1 min-w-0 pr-1">
                  <span className="block text-[9px] font-bold text-white/50 mb-0.5 truncate">
                    آخر درس قرأته
                  </span>
                  <span className="block text-xs sm:text-sm font-black text-cyan-300 truncate">
                    {safeStorage.getItem("s6_last_read_file_name") || "الوحدة الأولى: المفاهيم الرقمية"}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-active:scale-95 transition-transform ml-2">
                  <BookOpen size={20} strokeWidth={1.5} className="text-cyan-400" />
                </div>
              </div>

              {/* Sleek Horizontal Class Announcements Ticker Box */}
              <div
                onClick={() => {
                  safeStorage.setItem("s6_target_tab", "feed");
                  let targetSchool = selectedSchoolId;
                  if (!targetSchool) {
                    targetSchool =
                      safeStorage.getItem("s6_selectedSchoolId") ||
                      safeStorage.getItem("s6_preferred_school") ||
                      userProfile?.schoolId ||
                      "school1";
                    setSelectedSchoolId(targetSchool);
                    safeStorage.setItem("s6_selectedSchoolId", targetSchool);
                  }
                  setIsChoosingSchool(false);
                  setActiveSection("school-content");
                }}
                className="col-span-2 sm:col-span-2 md:col-span-3 w-full bg-[#0A0F1D] border border-amber-500/20 hover:border-amber-500/40 rounded-[1.5rem] p-3 px-4 flex items-center justify-between gap-3 relative overflow-hidden group transition-all cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)] active:scale-[0.99] mt-1"
              >
                <style>{`
                  @keyframes ticker-scroll-home {
                    0% {
                      transform: translate3d(-50%, 0, 0);
                    }
                    100% {
                      transform: translate3d(0, 0, 0);
                    }
                  }
                  .home-ticker-scroller {
                    display: flex;
                    align-items: center;
                    white-space: nowrap;
                    animation: ticker-scroll-home var(--home-ticker-speed, 22s) linear infinite;
                    width: max-content;
                  }
                  .home-ticker-scroller:hover {
                    animation-play-state: paused;
                  }
                `}</style>

                <div className="absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none z-20" />
                <div className="absolute right-0 top-0 w-12 h-full bg-gradient-to-l from-[#0A0F1D] to-transparent pointer-events-none z-20" />

                {/* Megaphone Icon Only */}
                <div className="flex items-center shrink-0 z-20">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Megaphone size={18} className="animate-pulse" />
                  </div>
                </div>

                {/* Left-to-Right Moving Ticker Text Area */}
                <div className="flex-1 min-w-0 overflow-hidden relative z-10 h-8 flex items-center px-1" dir="ltr">
                  <div
                    style={
                      {
                        "--home-ticker-speed": `${Math.max(
                          (gradeBroadcasts.length > 0
                            ? gradeBroadcasts.reduce(
                                (acc, item) => acc + (item.message || item.title || "").length,
                                0
                              )
                            : 45) * 0.25 + 12,
                          18
                        )}s`,
                      } as React.CSSProperties
                    }
                    className="home-ticker-scroller"
                  >
                    {/* First Copy */}
                    <div className="flex items-center shrink-0">
                      {gradeBroadcasts.length > 0 ? (
                        gradeBroadcasts.map((item, idx) => {
                          const bodyText = item.rawText || item.message || item.title || "";
                          const alreadyHasPrefix = String(bodyText || "").startsWith("📢") || String(bodyText || "").startsWith("[");
                          const authorLabel = item.author
                            ? `[الأستاذ ${item.author}]`
                            : item.senderName
                            ? `[${item.senderName}]`
                            : "[الإدارة المدرسية]";
                          return (
                            <div key={`copy1-${item.id || idx}`} className="flex items-center gap-2 shrink-0 px-5" dir="rtl">
                              {!alreadyHasPrefix && (
                                <span className="text-amber-300 font-extrabold text-xs shrink-0">
                                  {authorLabel}:
                                </span>
                              )}
                              <span className="text-xs font-bold text-white/90 shrink-0">
                                {bodyText}
                              </span>
                              {item.subject && !alreadyHasPrefix && (
                                <span className="text-[9px] text-amber-400/80 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                  {item.subject}
                                </span>
                              )}
                              <span className="text-amber-400/50 text-xs mx-3 shrink-0">✦</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-2 shrink-0 px-6" dir="rtl">
                          <span className="text-xs font-bold text-white/80">
                            لا توجد إعلانات مدرسية جارية لصفك الدراسي حالياً
                          </span>
                          <span className="text-amber-400/50 text-xs mx-3 shrink-0">✦</span>
                        </div>
                      )}
                    </div>

                    {/* Second Copy for Seamless Infinite Transition */}
                    <div className="flex items-center shrink-0">
                      {gradeBroadcasts.length > 0 ? (
                        gradeBroadcasts.map((item, idx) => {
                          const bodyText = item.rawText || item.message || item.title || "";
                          const alreadyHasPrefix = String(bodyText || "").startsWith("📢") || String(bodyText || "").startsWith("[");
                          const authorLabel = item.author
                            ? `[الأستاذ ${item.author}]`
                            : item.senderName
                            ? `[${item.senderName}]`
                            : "[الإدارة المدرسية]";
                          return (
                            <div key={`copy2-${item.id || idx}`} className="flex items-center gap-2 shrink-0 px-5" dir="rtl">
                              {!alreadyHasPrefix && (
                                <span className="text-amber-300 font-extrabold text-xs shrink-0">
                                  {authorLabel}:
                                </span>
                              )}
                              <span className="text-xs font-bold text-white/90 shrink-0">
                                {bodyText}
                              </span>
                              {item.subject && !alreadyHasPrefix && (
                                <span className="text-[9px] text-amber-400/80 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                  {item.subject}
                                </span>
                              )}
                              <span className="text-amber-400/50 text-xs mx-3 shrink-0">✦</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center gap-2 shrink-0 px-6" dir="rtl">
                          <span className="text-xs font-bold text-white/80">
                            لا توجد إعلانات مدرسية جارية لصفك الدراسي حالياً
                          </span>
                          <span className="text-amber-400/50 text-xs mx-3 shrink-0">✦</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-amber-500/20 flex items-center justify-center text-white/40 group-hover:text-amber-300 transition-all shrink-0 z-20">
                  <ChevronLeft size={16} />
                </div>
              </div>
            </motion.div>
            )}

            {/* Resume Card / أكمل من حيث توقفت - Minimal Premium */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                if (isSchoolVerified && selectedSchoolId) {
                  setActiveSection("school-content");
                } else {
                  setActiveSection("mayadeen");
                }
              }}
              className="relative overflow-hidden rounded-[1.5rem] bg-[#0A0F1D] border border-white/5 p-5 group cursor-pointer w-full text-right shadow-sm hover:border-white/10 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all duration-300"
            >
              {/* Light Sweep on active */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity duration-100" />
              
              <div className="relative z-10 flex flex-col">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />

                <div className="flex items-center justify-between mb-4 flex-row-reverse">
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <div className="w-12 h-12 bg-[#050812] border border-indigo-500/20 rounded-[1rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform rotate-2 group-hover:rotate-0 relative overflow-hidden">
                      <Rocket
                        size={20}
                        className="text-indigo-400 drop-shadow-sm relative z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 flex-row-reverse px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {isSchoolVerified && selectedSchoolId ? "المنصة النشطة" : "انضمام سريع"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-5 z-10 relative pr-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1.5 tracking-tight group-hover:text-indigo-300 transition-colors">
                    {isSchoolVerified && selectedSchoolId ? "ادخل إلى مدرستك" : "اختر مدرستك الآن"}
                  </h3>
                  <p className="text-xs text-white/50 font-bold max-w-[85%] ml-auto line-clamp-1">
                    {isSchoolVerified && selectedSchoolId 
                      ? `بوابة الحصص والملخصات لـ ${institutionName}`
                      : "انضم إلى زملائك من الميادين لفتح المحاضرات والملفات"}
                  </p>
                </div>

                <div className="w-full relative overflow-hidden bg-indigo-600 border border-indigo-500 group-hover:bg-indigo-500 group-hover:border-indigo-400 rounded-[1.25rem] py-3.5 flex items-center justify-center gap-2 transition-all flex-row-reverse shadow-[0_4px_15px_rgba(79,70,229,0.3)]">
                  <ChevronLeft
                    size={18}
                    className="text-white/80 group-hover:text-white transition-colors"
                  />
                  <span className="font-bold text-sm text-white transition-colors">
                    {isSchoolVerified && selectedSchoolId ? "دخول المنصة التعليمية" : "تصفح الميادين 📡"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Active Knights Independent Modal */}
            <AnimatePresence>
              {showActiveKnights && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-[#0D142A]/95 border border-orange-500/30 rounded-[2.5rem] p-6 shadow-[0_15px_50px_rgba(249,115,22,0.25)] relative overflow-hidden text-right"
                  >
                    {/* Decorative glow lines */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-row-reverse z-10 relative">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        <h3 className="text-white font-black text-lg">الفرسان النشطين الآن ({activeKnights.length || 1})</h3>
                      </div>
                      <button 
                        onClick={() => setShowActiveKnights(false)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <p className="text-white/50 text-xs font-bold text-right mb-4 leading-relaxed z-10 relative">
                      الأبطال المتصلين الآن من نفس صفك الدراسي والمستعدين لخوض التحديات والمناقشات التعليمية.
                    </p>

                    {/* Students List */}
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar z-10 relative">
                      {activeKnights.length > 0 ? (
                        activeKnights.map((knight) => {
                          const levelInfo = getStudentLevelInfo(knight.xp || knight.totalScore || 0);
                          const isSelf = knight.id === user?.uid;
                          return (
                            <div 
                              key={knight.id} 
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all flex-row"
                            >
                              {/* Start Chat Button (Left) */}
                              {!isSelf ? (
                                <button
                                  onClick={() => {
                                    setChatSelectedUser(knight);
                                    setIsLoungeChatOpen(true);
                                    setShowActiveKnights(false);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500 border border-orange-500/30 hover:border-transparent text-orange-400 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(249,115,22,0.1)] active:scale-95 cursor-pointer"
                                >
                                  <MessageCircle size={14} />
                                  <span>محادثة</span>
                                </button>
                              ) : (
                                <div className="text-[10px] text-white/30 font-bold bg-white/5 px-2.5 py-1 rounded-lg">المجلس</div>
                              )}

                              {/* Right Info (Right) */}
                              <div className="flex items-center gap-3 flex-row-reverse">
                                {/* Avatar */}
                                <div className={`w-11 h-11 rounded-full border-2 ${levelInfo.borderColor} p-0.5 relative bg-gradient-to-br ${levelInfo.bgGradient} ${levelInfo.glowColor} shrink-0`}>
                                  <img
                                    src={getProfessionalAvatar(knight)}
                                    alt="Avatar"
                                    className="w-full h-full object-contain rounded-full"
                                  />
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0f172a]" />
                                </div>
                                
                                {/* Name and level title */}
                                <div className="text-right">
                                  <span className="block text-xs font-black text-white leading-tight">
                                    {knight.name || knight.fullName || 'بطل بيرق'}
                                    {isSelf && <span className="text-[10px] text-orange-400 font-bold mr-1.5">(أنت)</span>}
                                  </span>
                                  <span className="block text-[9px] font-bold text-white/50 mt-0.5">
                                    {levelInfo.title} • {knight.xp || knight.totalScore || 0} نقطة
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Fallback user if no other active users found
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 flex-row-reverse">
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <div className={`w-11 h-11 rounded-full border-2 ${getStudentLevelInfo(userProfile?.xp || 0).borderColor} p-0.5 relative bg-gradient-to-br ${getStudentLevelInfo(userProfile?.xp || 0).bgGradient}`}>
                              <img
                                src={getProfessionalAvatar(userProfile)}
                                alt="Avatar"
                                className="w-full h-full object-contain rounded-full"
                              />
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0f172a]" />
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-black text-white leading-tight">
                                {userProfile?.name || userProfile?.fullName || 'بطل'}
                                <span className="text-[10px] text-orange-400 font-bold mr-1.5">(أنت)</span>
                              </span>
                              <span className="block text-[9px] font-bold text-white/50 mt-0.5">
                                {getStudentLevelInfo(userProfile?.xp || 0).title} • {userProfile?.xp || 0} نقطة
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Active Knights 1-on-1 Chat Integration */}
            <AnimatePresence>
              {isLoungeChatOpen && chatSelectedUser && (
                <StudentLounge
                  onClose={() => {
                    setIsLoungeChatOpen(false);
                    setChatSelectedUser(null);
                  }}
                  userProfile={userProfile}
                  schoolId={selectedSchoolId || "school_baghdad"}
                  grade={userProfile?.grade || "sixth"}
                  isTeacher={false}
                  initialSelectedUser={chatSelectedUser}
                />
              )}
            </AnimatePresence>
          </motion.div>
        );
      }
      case "profile":
        return (
          <div
            id="section-profile"
            className="max-w-4xl mx-auto p-0 md:p-6 space-y-8 border border-transparent"
          >
            <header className="flex items-center gap-4 p-4 md:p-0">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">
                {settings.language === "ar" ? "الملف الشخصي" : "Profile"}
              </h1>
            </header>
            <ProfileDashboard
              userProfile={userProfile}
              progress={progress}
              language={settings.language}
            />
          </div>
        );
      case "sovereignty":
        return (
          <div className="w-full h-full min-h-[calc(100vh-6rem)] flex flex-col gap-4">
             <button
                onClick={() => setActiveSection("hub")}
                className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors w-fit px-3 py-1.5 rounded-lg border border-white/5 bg-[#0a0f1d]"
              >
                <ArrowLeft size={16} className={settings.language === "ar" ? "" : "rotate-180"} />
                <span className="text-xs font-bold">{settings.language === "ar" ? "العودة" : "Back"}</span>
              </button>
              <div className="flex-1 w-full pt-4">
                <ComingSoonPlaceholder title={settings.language === "ar" ? "منصة السيادة (البطولات)" : "Sovereignty Platform"} />
              </div>
          </div>
        );
      case "unit-detail":
        return (
          <UnitDetail
            unitId={selectedUnitId || 1}
            onBack={() => setActiveSection("hub")}
            themeColor={`theme-${settings.themeColor}`}
            progress={progress}
            setProgress={updateProgress}
            settings={settings}
            setSettings={setSettings}
            onResetProgress={resetProgress}
            onClearNotes={clearNotes}
            onResetSettings={() => {}}
          />
        );
      case "radar":
        return (
          <AIEnhancedRadar
            userProfile={verifiedStudentInfo || { name: "فارس السادس", studentCode: "S6-GEN-7351", uid: user?.uid }}
            progress={progress}
            setProgress={setProgress}
            onBack={() => setActiveSection("hub")}
            files={[]}
          />
        );
      case "battalion":
        return (
          <div
            id="section-battalion"
            className="max-w-4xl mx-auto p-0 md:p-6 border border-transparent"
          >
            <header className="flex items-center gap-4 mb-8 p-4 md:p-0">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">
                {settings.language === "ar" ? "الكتائب" : "Battalions"}
              </h1>
            </header>
            <Battalion userProfile={userProfile} language={settings.language} />
          </div>
        );
      case "bank":
        return (
          <div
            id="section-bank"
            className="max-w-4xl mx-auto p-6 border border-transparent"
          >
            <header className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">{t.bank}</h1>
            </header>
            <IdeaBank />
          </div>
        );
      case "admin-hub": {
        const resolvedSchoolData = allSchoolsList.find(
          (s) => s.id === (selectedSchoolId || userProfile?.schoolId),
        );
        const resolvedSchoolName = resolvedSchoolData?.name || userProfile?.schoolName || "بوابة بيرق";

        return (
          <div className="max-w-6xl mx-auto p-2 sm:p-6 space-y-8">
            <header className="flex items-center gap-4 mb-2">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">
                {settings.language === "ar"
                  ? "غرفة إدارة المدرسة"
                  : "School Admin Room"}
              </h1>
            </header>
            <AdminDashboard
              schoolName={resolvedSchoolName}
              selectedSchoolId={selectedSchoolId || userProfile?.schoolId}
              adminBranch={userProfile?.adminBranch || "boys"}
              onBack={() => setActiveSection("hub")}
              onSendMessage={handleBroadcastMessage}
              onUpdateMessage={handleBroadcastUpdate}
            />
          </div>
        );
      }
      case "control":
        return (
          <div
            id="section-control"
            className="max-w-4xl mx-auto p-0 md:p-6 border border-transparent"
          >
            <header className="flex items-center gap-4 mb-8 p-4 md:p-0">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">{t.control}</h1>
            </header>
            <ControlRoom
              settings={settings}
              setSettings={setSettings}
              progress={progress}
              userProfile={userProfile}
              onResetProgress={resetProgress}
              onClearNotes={clearNotes}
              onResetSettings={resetSettings}
              onResetOnboarding={() => {
                safeStorage.removeItem("app_has_seen_onboarding");
                safeStorage.removeItem("app_has_seen_welcome_intro");
                setHasSeenOnboarding(false);
                setHasSeenWelcomeIntro(false);
                setSplashFinished(false);
              }}
              onOpenPrivacy={() => setActiveSection("privacy-policy")}
            />
          </div>
        );
      case "ai-bot":
        return (
          <div className="max-w-4xl mx-auto p-6">
            <header className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">{t.aiBot}</h1>
            </header>
            <AIBot />
          </div>
        );
      case "hall-of-fame":
        return (
          <div className="max-w-6xl mx-auto p-0 md:p-6">
            <header className="flex items-center gap-4 mb-8 p-4 md:p-0">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">
                {settings.language === "ar"
                  ? "قاعة الأبطال"
                  : "Hall of Champions"}
              </h1>
            </header>
            <HallOfFame language={settings.language} progress={progress} />
          </div>
        );
      case "idea-bank":
        return (
          <div className="max-w-4xl mx-auto p-6">
            <header className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">
                {settings.language === "ar" ? "بنك الأفكار" : "Idea Bank"}
              </h1>
            </header>
            <IdeaBank />
          </div>
        );
      case "sixth-academy":
        return (
          <SixthAcademyPro
            onBack={() => setActiveSection("hub", "SixthAcademy onBack")}
          />
        );
      case "vault":
        return (
          <div
            id="section-vault"
            className="max-w-4xl mx-auto p-6 border border-transparent"
          >
            <header className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveSection("hub")}
                className="neon-button px-4 py-2"
              >
                {t.back}
              </button>
              <h1 className="text-3xl font-bold neon-text">
                {settings.language === "ar" ? "الخزنة" : "Vault"}
              </h1>
            </header>
            <SubscriptionPage />
          </div>
        );
      case "mascot-test":
        return <MascotTestPage onBack={() => setActiveSection("control")} />;

      case "mayadeen":
        return (
          <SchoolSelection
            language={settings.language}
            user={user}
            userProfile={userProfile}
            onBack={() => {
              setIsChoosingSchool(false);
              setShowRoleSelectionModal(true);
              safeStorage.removeItem("bayraq_user_role");
              setPortalType("student");
            }}
            onNavigateHome={() => {
              setIsChoosingSchool(false);
              setActiveSection("hub");
            }}
            onNavigateHallOfFame={() => {
              setIsChoosingSchool(false);
              setActiveSection("hall-of-fame");
            }}
            onOpenNotifications={() => {
              setIsNotificationDrawerOpen(true);
            }}
            onSelectSchool={(id) => {
              setSelectedSchoolId(id);
              const currentRole = portalType || safeStorage.getItem("bayraq_user_role") || "student";
              const isUserAdmin = currentRole === "admin-boys" || currentRole === "admin-girls" || currentRole === "admin" || currentRole === "dev" || String(currentRole).includes("admin");
              setIsSchoolVerified(Boolean(isUserAdmin));
              safeStorage.setItem("s6_selectedSchoolId", id);
              setIsChoosingSchool(false);
              setActiveSection("school-content");
            }}
          />
        );

      case "dev-dashboard":
        if (
          auth.currentUser?.email !== "mntzralghanm527@gmail.com" &&
          userProfile?.email !== "mntzralghanm527@gmail.com"
        ) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4" dir="rtl">
              <div className="text-5xl">🔒</div>
              <h2 className="text-xl font-black text-rose-400">وصول غير مصرح به</h2>
              <p className="text-white/60 text-sm">هذه اللوحة مخصصة حصرياً لـ مطور المنصة الرئيسي.</p>
            </div>
          );
        }
        return (
          <DevDashboard 
            schoolId={selectedSchoolId || "global"} 
            userProfile={userProfile} 
            showToast={(msg, type) => {
              const toastNotif: AppNotification = {
                id: Math.random().toString(36).substr(2, 9),
                title: type === "success" ? "نجاح" : type === "error" ? "خطأ" : "تنبيه",
                message: msg,
                timestamp: new Date().toISOString(),
                read: true,
                type: "general"
              };
              setActiveToasts((prev) => [toastNotif, ...prev]);
              setTimeout(() => {
                setActiveToasts((prev) => prev.filter((t) => t.id !== toastNotif.id));
              }, 4000);
            }} 
          />
        );

      default:
        return (
          <div className="text-center py-20">Section under construction</div>
        );
    }
  };

  const fontSizeMap: { [key: string]: string } = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };

  if (showGate6Demo) {
    return <Gate6Demo />;
  }

  if (showPrivacyPublic) {
    return (
      <ErrorBoundary>
        <PrivacyPolicy onBack={() => {
          setShowPrivacyPublic(false);
          if (window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete("privacy");
            url.searchParams.delete("view");
            url.searchParams.delete("policy");
            window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
          }
        }} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* 🚨 REMOTE CONTROL & SYSTEM DIALOGS MODALS */}
      {/* 1. Maintenance Mode Dialog */}
      <SystemDialogsModal
        type="maintenance"
        remoteConfig={remoteConfig}
        isOpen={Boolean(remoteConfig.maintenanceMode && !bypassMaintenance && activeSection !== "admin-hub" && userProfile?.role !== "dev")}
        onDeveloperBypass={() => {
          setBypassMaintenance(true);
          setActiveSection("admin-hub");
        }}
      />

      {/* 2. System Temporary Pause Dialog */}
      <SystemDialogsModal
        type="system_pause"
        remoteConfig={remoteConfig}
        isOpen={Boolean(remoteConfig.systemPaused && !remoteConfig.maintenanceMode && !bypassMaintenance && activeSection !== "admin-hub" && userProfile?.role !== "dev")}
        onDeveloperBypass={() => {
          setBypassMaintenance(true);
          setActiveSection("admin-hub");
        }}
      />

      {/* 3. Mandatory Force Update Dialog */}
      <SystemDialogsModal
        type="mandatory_update"
        remoteConfig={remoteConfig}
        isOpen={Boolean(remoteConfig.forceUpdateActive && !remoteConfig.maintenanceMode && !remoteConfig.systemPaused && !bypassMaintenance && activeSection !== "admin-hub" && userProfile?.role !== "dev")}
        onDeveloperBypass={() => {
          setBypassMaintenance(true);
          setActiveSection("admin-hub");
        }}
      />

      {/* 4. Optional Update Dialog */}
      <SystemDialogsModal
        type="optional_update"
        remoteConfig={remoteConfig}
        isOpen={Boolean(remoteConfig.optionalUpdateActive && !remoteConfig.forceUpdateActive && !remoteConfig.maintenanceMode && !remoteConfig.systemPaused && !dismissedOptionalUpdate && activeSection !== "admin-hub")}
        onClose={() => setDismissedOptionalUpdate(true)}
      />

      {/* 5. New Version Notice Dialog */}
      <SystemDialogsModal
        type="new_version"
        remoteConfig={remoteConfig}
        isOpen={Boolean(remoteConfig.newVersionNoticeActive && !remoteConfig.optionalUpdateActive && !remoteConfig.forceUpdateActive && !remoteConfig.maintenanceMode && !remoteConfig.systemPaused && !dismissedNewVersionNotice && activeSection !== "admin-hub")}
        onClose={() => setDismissedNewVersionNotice(true)}
      />

      {verifyReceiptId ? (
        <ReceiptVerification receiptId={verifyReceiptId} />
      ) : (
        <>
          <AnimatePresence>
            {!hasSeenWelcomeIntro ? (
              <WelcomeIntroScreen
                key="welcome-intro"
                onComplete={handleWelcomeIntroComplete}
              />
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed inset-0 z-[9999]"
              >
                <LoadingScreen
                  videoSrc={
                    hasSeenOnboarding ? "/short-intro.webm" : "/mascot/sliced_bairaq_sheet5_greeting_hello.mp4"
                  }
                  onFinish={handleSplashFinished}
                />
              </motion.div>
            ) : !hasSeenOnboarding ? (
              <OnboardingCarousel
                key="onboarding"
                onComplete={() => {
                  safeStorage.setItem("app_has_seen_onboarding", "true");
                  setHasSeenOnboarding(true);
                  setShowRoleSelectionModal(true);
                }}
              />
            ) : showRoleSelectionModal ? (
              <RoleSelectionModal
                key="role-selection"
                onSelectRole={async (role) => {
                  safeStorage.setItem("bayraq_user_role", role);
                  setPortalType(role as any);
                  setShowRoleSelectionModal(false);
                  setActiveSection("mayadeen");
                  
                  const isRoleAdmin = role === "admin-boys" || role === "admin-girls" || role.includes("admin");
                  setIsSchoolVerified(isRoleAdmin);

                  const branch = role === "admin-boys" ? "boys" : "girls";
                  setUserProfile((prev: any) => {
                    if (!prev) {
                      return { role: isRoleAdmin ? "admin" : role, adminBranch: branch, isAdmin: isRoleAdmin };
                    }
                    return { ...prev, role: isRoleAdmin ? "admin" : role, adminBranch: branch, isAdmin: isRoleAdmin };
                  });

                  // Update Firestore safely
                  if (user && user.uid) {
                    const updateData: any = { role: isRoleAdmin ? "admin" : role };
                    if (isRoleAdmin) {
                      updateData.adminBranch = branch;
                      updateData.isAdmin = true;
                    }
                    try {
                      await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
                    } catch (err) {
                      console.warn("Could not sync role to user doc:", err);
                    }
                  }
                }}
              />
            ) : (
              <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`min-h-screen selection:bg-indigo-500/30 ${settings.eyeCare ? "eye-care-mode" : ""} ${settings.themeMode === "light" ? "light-mode" : ""} theme-${settings.themeColor} flex w-full`}
                dir={settings.language === "ar" ? "rtl" : "ltr"}
                style={{
                  backgroundImage: "url(/gate_bg.png)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundAttachment: "fixed",
                  backgroundColor: "#02050F", // Navy Black
                  fontSize: `${settings.fontSize}px`,
                  fontFamily:
                    FONT_FAMILIES[settings.fontFamily] || '"Cairo", sans-serif',
                }}
              >
                {/* Semi-transparent dark overlay - darker for better contrast */}
                <div className="fixed inset-0 bg-[#02050F]/90 backdrop-blur-[2px] z-0 pointer-events-none" />

                {/* Background Effects - Clean and subtle */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                  <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
                  <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse [animation-delay:4s]" />

                  {/* Noise layer for texture */}
                  <div className="absolute inset-0 opacity-[0.03] mix-blend-screen bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuODUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgibm9pc2UpIiBvcGFjaXR5PSIwLjE1Ii8+PC9zdmc+')]"></div>
                </div>

                {user && portalType !== "driver" && activeSection !== "school-content" && activeSection !== "gate-6" && !isChoosingSchool && (
                  <Sidebar
                    activeSection={activeSection}
                    onSelectSection={setActiveSection}
                    onSelectUnit={handleSelectUnit}
                    unlockedUnits={progress.unlockedUnits}
                    language={settings.language}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    progress={progress}
                    notifications={memoizedNotifications}
                    onOpenNotifications={() =>
                      setIsNotificationDrawerOpen(true)
                    }
                    userProfile={userProfile}
                  />
                )}

                <div
                  className={`relative z-10 flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden ${user && portalType !== "driver" && activeSection !== "school-content" && !isChoosingSchool && isSidebarOpen ? (settings.language === "ar" ? "lg:pr-72" : "lg:pl-72") : ""}`}
                >
                  {/* Seasonal Cloud Theme Banner & Ambiance */}
                  {portalType !== "driver" && activeSection !== "school-content" && <SeasonalThemeBanner />}
                  <main id="main-content-area"
                    className={
                      activeSection === "hub" ||
                      activeSection === "unit-detail" ||
                      activeSection === "sovereignty" ||
                      activeSection === "school-content" ||
                      activeSection === "radar" ||
                      activeSection === "battalion" ||
                      activeSection === "hall-of-fame" ||
                      activeSection === "profile" ||
                      activeSection === "control" ||
                      activeSection === "ai-bot" ||
                      activeSection === "bank" ||
                      activeSection === "vault" ||
                      isChoosingSchool
                        ? ""
                        : "p-5"
                    }
                  >
                    <div className="w-full animate-fade-in">
                        {renderContent()}
                      </div>
                  </main>
                </div>

                <AnimatePresence>
                  {dualConfig && (
                    <DualArena
                      opponent={dualConfig.opponent}
                      type={dualConfig.type}
                      language={settings.language}
                      unlockedUnits={progress.unlockedUnits}
                      onClose={() => setDualConfig(null)}
                    />
                  )}
                </AnimatePresence>

                <BadgeNotification
                  badge={earnedBadge}
                  onClose={() => setEarnedBadge(null)}
                />

                <NotificationDrawer
                  isOpen={isNotificationDrawerOpen}
                  onClose={() => setIsNotificationDrawerOpen(false)}
                  notifications={memoizedNotifications}
                  onClearAll={clearNotifications}
                  onMarkAsRead={markNotificationAsRead}
                  onDelete={deleteNotification}
                  language={settings.language}
                />

                <ToastContainer
                  toasts={activeToasts}
                  onClose={removeToast}
                  language={settings.language}
                />
                <GlobalAnnouncementsPopup 
                  dashboardType={userProfile?.role === 'admin' ? 'admin' : userProfile?.role === 'teacher' ? 'teacher' : userProfile?.role === 'parent' ? 'parent' : userProfile?.role === 'driver' ? 'driver' : 'student'} 
                  schoolId={userProfile?.schoolId} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Toast */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -40 }}
                className="fixed top-6 left-4 right-4 z-[10000] max-w-xs mx-auto animate-in fade-in"
                dir={settings.language === "ar" ? "rtl" : "ltr"}
              >
                <SwipeDismissContainer
                  onDismiss={() => {
                    if (notification.id === "study-reminder") {
                      stopAlarm();
                    } else if (
                      notification.type !== "challenge" &&
                      notification.type !== "challenge_accepted_by_target" &&
                      notification.type !== "challenge_final_invite"
                    ) {
                      updateDoc(doc(db, "notifications", notification.id), {
                        read: true,
                      });
                      setNotification(null);
                    } else {
                      setNotification(null);
                    }
                  }}
                >
                  <div className="bg-[#0c1427]/95 backdrop-blur-2xl border border-white/10 border-r-3 border-r-theme-primary py-2.5 px-3.5 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary shrink-0">
                          {notification.type === "challenge" ? (
                            <Swords size={15} />
                          ) : (
                            <Bell size={15} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-black text-xs leading-snug">
                            {notification.title ||
                              (notification.type === "reminder"
                                ? settings.language === "ar"
                                  ? "تذكير دراسي"
                                  : "Study Reminder"
                                : notification.type === "challenge"
                                  ? settings.language === "ar"
                                    ? "تحدي جديد!"
                                    : "New Challenge!"
                                  : settings.language === "ar"
                                    ? "إشعار جديد"
                                    : "New Notification")}
                          </h4>
                          <p className="text-white/70 text-[10.5px] mt-0.5 leading-relaxed whitespace-pre-line max-h-24 overflow-y-auto">
                            {notification.type === "reminder"
                              ? notification.message
                              : notification.type === "challenge"
                                ? settings.language === "ar"
                                  ? `الفارس ${notification.challengerName} يتحداكم لانتزاع اللقب!`
                                  : `Knight ${notification.challengerName} is challenging you for the title!`
                                : notification.type ===
                                    "challenge_accepted_by_target"
                                  ? settings.language === "ar"
                                    ? `${notification.challengeType === "battalion" ? "الكتيبة وافقت" : "حارس البوابة وافق"} على التحدي. هل أنت واثق من الدخول للتحدي؟`
                                    : `${notification.challengeType === "battalion" ? "The Battalion" : "The Gate Guardian"} accepted the challenge. Are you sure you want to enter?`
                                  : notification.type ===
                                      "challenge_final_invite"
                                    ? settings.language === "ar"
                                      ? `الفارس ${notification.challengerName} يدعوك لدخول التحدي الآن!`
                                      : `Knight ${notification.challengerName} is inviting you to enter the challenge now!`
                                    : notification.type === "challenge_response"
                                      ? settings.language === "ar"
                                        ? `الفارس ${notification.targetName} قد ${notification.status === "accepted" ? "قبل" : "رفض"} تحديك.`
                                        : `Knight ${notification.targetName} has ${notification.status === "accepted" ? "accepted" : "rejected"} your challenge.`
                                      : notification.message ||
                                        (settings.language === "ar"
                                          ? `حصار جديد على ${notification.cityName || "المدينة"} من قبل ${notification.challengerName || "فارس"}!`
                                          : `New siege on ${notification.cityName || "city"} by ${notification.challengerName || "knight"}!`)}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (notification.id === "study-reminder") {
                              stopAlarm();
                            } else if (
                              notification.type !== "challenge" &&
                              notification.type !==
                                "challenge_accepted_by_target" &&
                              notification.type !== "challenge_final_invite"
                            ) {
                              updateDoc(
                                doc(db, "notifications", notification.id),
                                { read: true },
                              );
                              setNotification(null);
                            } else {
                              setNotification(null);
                            }
                          }}
                          className="text-white/40 hover:text-white/80 transition-colors p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {notification.type === "reminder" && (
                        <button
                          onClick={stopAlarm}
                          className="w-full py-6 bg-theme-primary text-black font-black rounded-2xl shadow-[0_0_30px_var(--theme-glow)] text-xl hover:scale-105 transition-transform"
                        >
                          {settings.language === "ar"
                            ? "إيقاف المنبه"
                            : "Stop Alarm"}
                        </button>
                      )}

                      {/* Challenge Accepted by Target - Confirmation for Challenger */}
                      {notification.type === "challenge_accepted_by_target" && (
                        <div className="space-y-4">
                          <p className="text-white/80 font-bold text-center">
                            {settings.language === "ar"
                              ? `هل أنت مستعد لدخول الميدان ومواجهة ${notification.targetName}؟`
                              : `Are you ready to enter the arena and face ${notification.targetName}?`}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleChallengerConfirmation(notification, true)
                              }
                              className="flex-1 py-3 bg-theme-primary text-black font-black rounded-xl hover:scale-105 transition-all"
                            >
                              {settings.language === "ar"
                                ? "نعم، دخول الميدان"
                                : "Yes, Enter Arena"}
                            </button>
                            <button
                              onClick={() =>
                                handleChallengerConfirmation(
                                  notification,
                                  false,
                                )
                              }
                              className="flex-1 py-3 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 transition-all"
                            >
                              {settings.language === "ar" ? "تراجع" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Final Invite for Target */}
                      {notification.type === "challenge_final_invite" && (
                        <div className="space-y-4">
                          <p className="text-white/80 font-bold text-center">
                            {settings.language === "ar"
                              ? `الفارس ${notification.challengerName} بانتظارك في الميدان!`
                              : `Knight ${notification.challengerName} is waiting for you in the arena!`}
                          </p>
                          <button
                            onClick={() => {
                              updateDoc(
                                doc(db, "notifications", notification.id),
                                { read: true },
                              );
                              setDualConfig({
                                opponent: {
                                  id: notification.challengerId,
                                  name: notification.challengerName,
                                },
                                type: "1vs1",
                              });
                              setNotification(null);
                            }}
                            className="w-full py-3 bg-rose-500 text-white font-black rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                          >
                            {settings.language === "ar"
                              ? "دخول الميدان الآن"
                              : "Enter Arena Now"}
                          </button>
                        </div>
                      )}
                      {notification.type === "battalion_invite" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary">
                              <Shield size={24} />
                            </div>
                            <div>
                              <p className="font-black text-white text-lg">
                                {settings.language === "ar"
                                  ? "دعوة انضمام للكتيبة"
                                  : "Battalion Invite"}
                              </p>
                              <p className="text-white/60 text-sm">
                                {settings.language === "ar"
                                  ? `دعاك الفارس ${notification.inviterName} للانضمام إلى كتيبة ${notification.battalionName}`
                                  : `${notification.inviterName} invited you to join ${notification.battalionName}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleBattalionResponse(
                                  notification,
                                  "accepted",
                                )
                              }
                              className="flex-1 py-3 bg-theme-primary text-black font-black rounded-xl hover:scale-105 transition-all"
                            >
                              {settings.language === "ar"
                                ? "قبول الدعوة"
                                : "Accept Invite"}
                            </button>
                            <button
                              onClick={() =>
                                handleBattalionResponse(
                                  notification,
                                  "rejected",
                                )
                              }
                              className="flex-1 py-3 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 transition-all"
                            >
                              {settings.language === "ar" ? "رفض" : "Reject"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Battalion Join Request */}
                      {notification.type === "battalion_join_request" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-theme-primary/20 flex items-center justify-center text-theme-primary">
                              <UserPlus size={24} />
                            </div>
                            <div>
                              <p className="font-black text-white text-lg">
                                {settings.language === "ar"
                                  ? "طلب انضمام للكتيبة"
                                  : "Join Request"}
                              </p>
                              <p className="text-white/60 text-sm">
                                {settings.language === "ar"
                                  ? `يريد الفارس ${notification.requesterName} (مستوى ${notification.requesterLevel}) الانضمام لكتيبتك`
                                  : `${notification.requesterName} (Lvl ${notification.requesterLevel}) wants to join your battalion`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleBattalionResponse(
                                  notification,
                                  "accepted",
                                )
                              }
                              className="flex-1 py-3 bg-theme-primary text-black font-black rounded-xl hover:scale-105 transition-all"
                            >
                              {settings.language === "ar"
                                ? "قبول الفارس"
                                : "Accept Knight"}
                            </button>
                            <button
                              onClick={() =>
                                handleBattalionResponse(
                                  notification,
                                  "rejected",
                                )
                              }
                              className="flex-1 py-3 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 transition-all"
                            >
                              {settings.language === "ar" ? "رفض" : "Reject"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Battalion Join Accepted */}
                      {notification.type === "battalion_join_accepted" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <Shield size={24} />
                            </div>
                            <div>
                              <p className="font-black text-white text-lg">
                                {settings.language === "ar"
                                  ? "تم قبول انضمامك!"
                                  : "Join Accepted!"}
                              </p>
                              <p className="text-white/60 text-sm">
                                {settings.language === "ar"
                                  ? `وافق القائد على انضمامك لكتيبة ${notification.battalionName}`
                                  : `The leader accepted your request to join ${notification.battalionName}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              updateDoc(
                                doc(db, "notifications", notification.id),
                                { read: true },
                              );
                              setNotification(null);
                            }}
                            className="w-full py-3 bg-white/5 text-white font-black rounded-xl hover:bg-white/10 transition-all"
                          >
                            {settings.language === "ar" ? "حسناً" : "OK"}
                          </button>
                        </div>
                      )}

                      {notification.type === "challenge" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleChallengeResponse(notification, "accepted")
                            }
                            className="flex-1 py-3 bg-theme-primary text-black font-black rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_15px_var(--theme-glow)]"
                          >
                            {settings.language === "ar"
                              ? "قبول التحدي"
                              : "Accept Challenge"}
                          </button>
                          <button
                            onClick={() =>
                              handleChallengeResponse(notification, "rejected")
                            }
                            className="flex-1 py-3 bg-white/5 text-white/60 font-black rounded-xl hover:bg-white/10 transition-all border border-white/10"
                          >
                            {settings.language === "ar" ? "رفض" : "Reject"}
                          </button>
                        </div>
                      )}

                      {notification.type === "challenge_accepted_by_target" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleChallengerConfirmation(notification, true)
                            }
                            className="flex-1 py-3 bg-theme-primary text-black font-black rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_15px_var(--theme-glow)]"
                          >
                            {settings.language === "ar"
                              ? "نعم، دخول"
                              : "Yes, Enter"}
                          </button>
                          <button
                            onClick={() =>
                              handleChallengerConfirmation(notification, false)
                            }
                            className="flex-1 py-3 bg-white/5 text-white/60 font-black rounded-xl hover:bg-white/10 transition-all border border-white/10"
                          >
                            {settings.language === "ar" ? "لا" : "No"}
                          </button>
                        </div>
                      )}

                      {notification.type === "challenge_final_invite" && (
                        <button
                          onClick={() => {
                            updateDoc(
                              doc(db, "notifications", notification.id),
                              { read: true },
                            );
                            setDualConfig({
                              opponent: {
                                id: notification.challengerId,
                                name: notification.challengerName,
                              },
                              type: "1vs1",
                            });
                            setNotification(null);
                          }}
                          className="w-full py-3 bg-theme-primary text-black font-black rounded-xl shadow-[0_0_15px_var(--theme-glow)]"
                        >
                          {settings.language === "ar"
                            ? "دخول التحدي الآن"
                            : "Enter Challenge Now"}
                        </button>
                      )}

                      {notification.type === "challenge_response" && (
                        <button
                          onClick={() => {
                            updateDoc(
                              doc(db, "notifications", notification.id),
                              { read: true },
                            );
                            setNotification(null);
                          }}
                          className="w-full py-3 bg-theme-primary/20 text-theme-primary font-black rounded-xl border border-theme-primary/30"
                        >
                          {settings.language === "ar" ? "حسناً" : "OK"}
                        </button>
                      )}
                    </div>
                  </div>
                </SwipeDismissContainer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Universal Mobile Bottom Tab Bar - Floating Minimal */}
          {user &&
            (activeSection === "hub" || activeSection === "hall-of-fame" || activeSection === "mayadeen" || activeSection === "admin-hub" || isChoosingSchool) && (
              <div className="fixed bottom-0 left-0 right-0 z-[60] px-6 pb-6 pt-2 bg-gradient-to-t from-[#02050F] via-[#02050F]/80 to-transparent pointer-events-none flex justify-center">
                <div className="w-full max-w-[320px] pointer-events-auto bg-[#0A0F1D]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] px-2 py-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-h-[64px]">
                  {/* Nav: Home (Right) */}
                  <button
                    onClick={() => {
                      setActiveSection("hub");
                    }}
                    className={`flex-1 flex flex-col justify-center items-center h-full transition-all duration-300 ${activeSection === "hub" && !isChoosingSchool ? "text-indigo-400" : "text-white/30 hover:text-white/60"}`}
                  >
                    <Home
                      size={activeSection === "hub" && !isChoosingSchool ? 22 : 20}
                      className={`mb-0.5 transition-all duration-300 ${activeSection === "hub" && !isChoosingSchool ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] scale-110" : ""}`}
                    />
                    <span
                      className={`text-[9px] font-bold transition-all duration-300 ${activeSection === "hub" && !isChoosingSchool ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden"}`}
                    >
                      الرئيسية
                    </span>
                  </button>

                  {/* Nav: Setup/Schools (Center Elevated slightly - الميادين) */}
                  <div className="flex-none px-2 relative -top-3">
                    <button
                      onClick={() => {
                        setActiveSection("mayadeen");
                      }}
                      title="الميادين"
                      className={`w-[52px] h-[52px] rounded-full flex flex-col items-center justify-center transition-all duration-300 outline outline-[4px] outline-[#02050F] ${isChoosingSchool || activeSection === "mayadeen" ? "bg-gradient-to-br from-[#00E5FF]/20 to-[#007b8a]/20 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105" : "bg-[#111827] border-white/10 text-white/50 shadow-md hover:scale-105 active:scale-95"} border`}
                    >
                      <BookOpen size={20} className={isChoosingSchool || activeSection === "mayadeen" ? "drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] text-[#00E5FF]" : ""} />
                    </button>
                  </div>

                  {/* Nav: Knights Club / Hall of Fame / Admin Panel (Left) */}
                  {userProfile?.role === "admin" || userProfile?.role === "dev" ? (
                    <button
                      onClick={() => {
                        setActiveSection("admin-hub");
                      }}
                      className={`flex-1 flex flex-col justify-center items-center h-full transition-all duration-300 ${activeSection === "admin-hub" && !isChoosingSchool ? "text-rose-400" : "text-white/30 hover:text-white/60"}`}
                    >
                      <Shield
                        size={activeSection === "admin-hub" && !isChoosingSchool ? 22 : 20}
                        className={`mb-0.5 transition-all duration-300 ${activeSection === "admin-hub" && !isChoosingSchool ? "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] scale-110" : ""}`}
                      />
                      <span
                        className={`text-[9px] font-bold transition-all duration-300 ${activeSection === "admin-hub" && !isChoosingSchool ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden"}`}
                      >
                        لوحة الإدارة
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveSection("hall-of-fame");
                      }}
                      className={`flex-1 flex flex-col justify-center items-center h-full transition-all duration-300 ${activeSection === "hall-of-fame" && !isChoosingSchool ? "text-amber-400" : "text-white/30 hover:text-white/60"}`}
                    >
                      <Trophy
                        size={activeSection === "hall-of-fame" && !isChoosingSchool ? 22 : 20}
                        className={`mb-0.5 transition-all duration-300 ${activeSection === "hall-of-fame" && !isChoosingSchool ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] scale-110" : ""}`}
                      />
                      <span
                        className={`text-[9px] font-bold transition-all duration-300 ${activeSection === "hall-of-fame" && !isChoosingSchool ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 h-0 overflow-hidden"}`}
                      >
                        الفرسان
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* Logout Success Toast */}
          <AnimatePresence>
            {showLogoutToast && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-xs px-4"
              >
                <SwipeDismissContainer
                  onDismiss={() => setShowLogoutToast(false)}
                >
                  <div className="px-6 py-4 bg-emerald-500 text-white rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center gap-3 border border-emerald-400/50">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Shield size={20} />
                    </div>
                    <p className="font-bold">
                      {translations[settings.language].loggedOutSuccess}
                    </p>
                  </div>
                </SwipeDismissContainer>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Global Network Connectivity Status Listener */}
          <NetworkStatusListener />

          {/* Reset Password Modal from recovery email link */}
          {resetPasswordData && (
            <ResetPasswordModal
              token={resetPasswordData.token}
              email={resetPasswordData.email}
              onClose={() => {
                setResetPasswordData(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              onSuccess={() => {
                setResetPasswordData(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
            />
          )}

        </>
      )}
    </ErrorBoundary>
  );
}
