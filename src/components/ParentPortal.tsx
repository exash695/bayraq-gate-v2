import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pushNotificationManager } from '../services/pushNotificationManager';
import { 
  ArrowRight, 
  Megaphone, 
  BarChart3, 
  Timer, 
  CalendarClock, 
  Wallet, 
  AlertTriangle, 
  Star, 
  Map as MapIcon, 
  Calendar,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  XCircle,
  Shirt,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Target,
  Bell,
  Award,
  Receipt,
  Clock,
  MessageCircle,
  Building2,
  Sparkles,
  Share2,
  Download,
  Bus,
  Edit2,
  Search,
  Image as ImageIcon,
  ZoomIn,
  ExternalLink,
  Upload,
  Paperclip,
  CheckCircle,
  Loader2,
  Trash2,
  Send,
  Users,
  User,
  X,
  Camera,
  UserCheck,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cleanParentStudentName, formatParentGreetingTitle } from '../utils/studentUtils';
import { matchesTargetGrades, extractSectionLetter } from '../utils/gradeMatcher';
import { AnnouncementsCenterTab } from './SchoolPlatform/AnnouncementsCenterTab';
import { doc, onSnapshot, collection, query, where, orderBy, limit, updateDoc, addDoc, serverTimestamp, increment, arrayUnion } from '../lib/firebase';
import { academicService } from '../services/academicService';
import { supportService } from '../services/supportService';
import { staffService } from '../services/staffService';
import { ideaService } from '../services/ideaService';
import { uploadFileToR2 } from '../services/uploadService';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { safeStorage } from '../lib/storage';
import { realtimeManager } from '../lib/realtimeManager';
import { ParentPaymentView } from './ParentPaymentView';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { StudentSupportForm } from './StudentSupportForm';
import { ExcellenceShareModal } from './ExcellenceShareModal';
import { IdeaBank } from './IdeaBank';
import { ParentTransportView } from './Transport/ParentTransportView';
import { ComingSoonPlaceholder } from './ComingSoonPlaceholder';
import { useSecuritySettings, securityService } from '../services/securityService';
import { BerqCharacter } from './BerqCharacterManager';
import { ParentPortalSkeleton } from './shared/ShimmerSkeleton';
import { StudentLounge } from './StudentLounge';
import { getSubjectsForGrade, calculateStudentFinancials, computeAcademicIdentity, computeExcellencePoints, normalizeGradeCanonical } from '../utils/studentUtils';
import { toPng, toBlob } from 'html-to-image';
import { IRAQ_UNIVERSITIES } from '../constants/iraqColleges';
import { flattenedColleges } from '../constants/flattenedColleges';
import { ClassroomVideoPlayer } from './ClassroomVideoPlayer';

interface ParentPortalProps {
  studentName: string;
  studentCode?: string;
  schoolId?: string | null;
  schoolName?: string;
  gender?: 'male' | 'female';
  grade?: string;
  onBack: () => void;
  parentNotifications?: any[];
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ 
  studentName, 
  studentCode, 
  schoolId, 
  schoolName, 
  gender = 'male', 
  grade, 
  onBack,
  parentNotifications: initialNotifications = []
}) => {
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null);
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [showTransportView, setShowTransportView] = useState(false);
  const [isSupportFormOpen, setIsSupportFormOpen] = useState(false);
  const [studentData, setStudentData] = useState<any>(() => {
    try {
      const cacheKey = `bairaq_cached_student_${studentCode || ''}`;
      const stored = safeStorage.getItem(cacheKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const cacheKey = `bairaq_cached_student_${studentCode || ''}`;
      const stored = safeStorage.getItem(cacheKey);
      return !stored;
    } catch {
      return true;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedGradePeriod, setSelectedGradePeriod] = useState('month1');
  const [parentNotifications, setParentNotifications] = useState<any[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [unreadIdeasCount, setUnreadIdeasCount] = useState(0);
  const [parentBroadcasts, setParentBroadcasts] = useState<any[]>([]);
  const [readBroadcastIds, setReadBroadcastIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("bairaq_read_broadcast_ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync readBroadcastIds when opening/closing announcements sub-page or listening to window event
  useEffect(() => {
    const handleReadAnnouncements = () => {
      try {
        const saved = localStorage.getItem("bairaq_read_broadcast_ids");
        if (saved) {
          setReadBroadcastIds(JSON.parse(saved));
        }
      } catch {}
    };
    window.addEventListener("bairaq_announcements_read", handleReadAnnouncements);
    handleReadAnnouncements();
    return () => {
      window.removeEventListener("bairaq_announcements_read", handleReadAnnouncements);
    };
  }, [activeSubPage]);
  const [parentHomeworks, setParentHomeworks] = useState<any[]>([]);
  const [parentSubmissions, setParentSubmissions] = useState<any[]>([]);
  const [hwSearch, setHwSearch] = useState('');
  const [hwSubject, setHwSubject] = useState('الكل');
  const [viewingHwModal, setViewingHwModal] = useState<any | null>(null);
  
  // Classroom Lens ("عين على الصف") Activities State & Tab
  const [lensActivities, setLensActivities] = useState<any[]>([]);
  const [selectedLensMedia, setSelectedLensMedia] = useState<any | null>(null);
  const [parentAttendanceTab, setParentAttendanceTab] = useState<'attendance' | 'lens'>('attendance');
  const [unreadLensCount, setUnreadLensCount] = useState<number>(0);
  const [parentLensDateFilter, setParentLensDateFilter] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showAllLensDates, setShowAllLensDates] = useState<boolean>(true);
  const [isLoadingLensActivities, setIsLoadingLensActivities] = useState<boolean>(false);
  const [lensSubTab, setLensSubTab] = useState<'individual' | 'broadcast'>('individual');

  const [lastSeenIndividual, setLastSeenIndividual] = useState<number>(0);
  const [lastSeenBroadcast, setLastSeenBroadcast] = useState<number>(0);

  // Sync seen timestamps when studentData changes
  useEffect(() => {
    const stId = studentData?.id || studentData?.studentCode || studentCode || '';
    if (stId) {
      const valInd = safeStorage.getItem(`bairaq_lens_ind_seen_${stId}`);
      setLastSeenIndividual(valInd ? new Date(valInd).getTime() : 0);
      const valBc = safeStorage.getItem(`bairaq_lens_bc_seen_${stId}`);
      setLastSeenBroadcast(valBc ? new Date(valBc).getTime() : 0);
    }
  }, [studentData?.id, studentData?.studentCode, studentCode]);

  // Automatically mark activities as read when the active tab is opened
  useEffect(() => {
    const stId = studentData?.id || studentData?.studentCode || studentCode || '';
    if (!stId || parentAttendanceTab !== 'lens') return;

    const now = Date.now() + 1000; // Add 1 second buffer
    if (lensSubTab === 'individual') {
      safeStorage.setItem(`bairaq_lens_ind_seen_${stId}`, new Date(now).toISOString());
      setLastSeenIndividual(now);
    } else if (lensSubTab === 'broadcast') {
      safeStorage.setItem(`bairaq_lens_bc_seen_${stId}`, new Date(now).toISOString());
      setLastSeenBroadcast(now);
    }
  }, [parentAttendanceTab, lensSubTab, lensActivities, studentData?.id, studentData?.studentCode, studentCode]);

  const mountTimeRef = useRef<number>(Date.now());

  const fetchParentLensActivities = () => {
    const stId = studentData?.id || studentData?.studentCode || studentCode;
    if (!stId) return;
    setIsLoadingLensActivities(true);
    fetch(`/api/bairaq-activities?studentId=${stId}&schoolId=${schoolId || studentData?.schoolId || 'school1'}`)
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.activities)) {
          setLensActivities(data.activities);
        } else {
          setLensActivities([]);
        }
      })
      .catch(err => console.warn("Failed to load classroom lens activities:", err))
      .finally(() => setIsLoadingLensActivities(false));
  };

  useEffect(() => {
    fetchParentLensActivities();
  }, [studentData?.id, studentData?.studentCode, studentCode, parentAttendanceTab]);

  // Real-time synchronization when teacher adds or deletes snapshots
  useEffect(() => {
    const handleLensUpdate = (payload?: any) => {
      if (!payload || typeof payload !== 'object') return;

      if (payload?.deletedId) {
        setLensActivities(prev => prev.filter(act => act.id !== payload.deletedId));
        return;
      }

      // Ignore toast notifications during the first 5 seconds of mounting or for historical/sync events
      if (Date.now() - mountTimeRef.current < 5000) {
        fetchParentLensActivities();
        return;
      }

      // Ensure payload is a valid new activity object with ID and createdAt timestamp
      if (!payload?.id || !payload?.createdAt || !payload?.description) {
        fetchParentLensActivities();
        return;
      }

      const activityTime = new Date(payload.createdAt).getTime();
      if (isNaN(activityTime) || Date.now() - activityTime > 30000) {
        fetchParentLensActivities();
        return;
      }

      const st = studentData || {};
      const stId = (st.id || '').toLowerCase();
      const stCode = (st.code || st.student || studentCode || '').toLowerCase();
      const stName = (st.name || studentName || '').toLowerCase();
      const pCode = (st.parentCode || st.parent || '').toLowerCase();

      const actStId = (payload?.studentId || '').toLowerCase();
      const actStCode = (payload?.studentCode || '').toLowerCase();
      const actPCode = (payload?.parentCode || '').toLowerCase();
      const actStName = (payload?.studentName || '').toLowerCase();
      const actAliases = Array.isArray(payload?.aliases) ? payload.aliases.map((a: any) => String(a).toLowerCase()) : [];
      const actDesc = (payload?.description || '').toLowerCase();

      const isAll = actStId === 'all' || !actStId || actStId === 'ALL';

      // Match by ID, code, name, parentCode, or aliases
      const matchesId = stId && (actStId === stId || actStId.includes(stId) || stId.includes(actStId) || actAliases.includes(stId));
      const matchesCode = stCode && (
        actStId === stCode || actStCode === stCode || 
        actStId.includes(stCode) || stCode.includes(actStId) || 
        actAliases.includes(stCode) || actAliases.some(a => a.includes(stCode) || stCode.includes(a))
      );
      const matchesParentCode = pCode && (actPCode === pCode || actAliases.includes(pCode));
      const matchesName = stName && (
        actStName === stName || actDesc.includes(stName) || 
        actAliases.includes(stName) || actAliases.some(a => a.includes(stName) || stName.includes(a))
      );

      const isForThisStudent = isAll || matchesId || matchesCode || matchesParentCode || matchesName;

      if (isForThisStudent) {
        setUnreadLensCount(prev => prev + 1);

        const teacherName = payload?.authorName || 'الأستاذ';
        const notifTitle = isAll ? '📢 مشاركة صفية جماعية جديدة' : `📸 لقطة جديدة لطفلك (${studentName || st.name || 'الطالب'})`;
        const notifBody = payload.description;
        showToast(`${notifTitle}: ${notifBody}`, 'success');

        try {
          pushNotificationManager.showLocalNotification(notifTitle, {
            body: notifBody,
            icon: '/logo.png',
            tag: `lens_activity_${payload.id}`,
            renotify: true
          });
        } catch (e) {}

        fetchParentLensActivities();
      }
    };

    const unsub1 = realtimeManager.on('lens_activities', handleLensUpdate);
    const unsub2 = realtimeManager.on('bairaq_activities', handleLensUpdate);

    return () => {
      unsub1();
      unsub2();
    };
  }, [parentAttendanceTab, studentData?.id, studentData?.studentCode, studentData?.parentCode, studentData?.name, studentCode, studentName]);

  // Filtered lens activities based on parent date selection
  const displayedLensActivities = useMemo(() => {
    if (!Array.isArray(lensActivities)) return [];
    
    // First filter by sub-tab (Individual vs Broadcast)
    let filtered = lensActivities.filter((act: any) => {
      const isBroadcast = act.studentId === 'ALL' || !act.studentId;
      return lensSubTab === 'broadcast' ? isBroadcast : !isBroadcast;
    });

    if (showAllLensDates) return filtered;
    
    return filtered.filter((act: any) => {
      if (!act.createdAt) return false;
      const actDate = new Date(act.createdAt).toISOString().split('T')[0];
      return actDate === parentLensDateFilter;
    });
  }, [lensActivities, showAllLensDates, parentLensDateFilter, lensSubTab]);
  
  // Solution submission state
  const [solutionText, setSolutionText] = useState('');
  const [solutionImages, setSolutionImages] = useState<File[]>([]);
  const [solutionImagePreviews, setSolutionImagePreviews] = useState<string[]>([]);
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);
  const [solutionSubmitSuccess, setSolutionSubmitSuccess] = useState(false);
  const [solutionSubmitError, setSolutionSubmitError] = useState<string | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'absent' | 'late' | 'present'>('all');
  const [attendanceSearchDate, setAttendanceSearchDate] = useState<string>('');
  const todayDateStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Contact & Teacher Messaging State
  const [contactTab, setContactTab] = useState<'admin' | 'teachers'>('admin');
  const [isLoungeOpen, setIsLoungeOpen] = useState<boolean>(false);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(false);
  const [selectedTeacherForChat, setSelectedTeacherForChat] = useState<any | null>(null);
  const [teacherMessageText, setTeacherMessageText] = useState<string>('');
  const [isSendingTeacherMessage, setIsSendingTeacherMessage] = useState<boolean>(false);
  const [teacherChatHistory, setTeacherChatHistory] = useState<{[key: string]: any[]}>({});

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load persistent parent-teacher chat history
  useEffect(() => {
    try {
      const stored = safeStorage.getItem(`bairaq_parent_teacher_chats_${studentCode || ''}`);
      if (stored) {
        setTeacherChatHistory(JSON.parse(stored));
      }
    } catch {}
  }, [studentCode]);

  // Subscribe to teachers list when meeting subPage is active
  useEffect(() => {
    if (activeSubPage === 'meeting') {
      setIsLoadingTeachers(true);
      const unsub = staffService.subscribeToTeachers(schoolId || undefined, (teachers) => {
        if (Array.isArray(teachers)) {
          setAllTeachers(teachers);
        }
        setIsLoadingTeachers(false);
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [activeSubPage, schoolId]);

  // Filter strictly to teachers who teach THIS student
  const studentTeachers = useMemo(() => {
    if (!allTeachers || allTeachers.length === 0) return [];

    const teachingStaff = allTeachers.filter(t => !t.role || t.role === 'TEACHER' || t.role === 'cadre');
    const stGrade = studentData?.grade || studentData?.listName || studentData?.className || grade || '';
    const stSection = studentData?.section || '';

    const norm = (str: string) => (str || '')
      .replace(/[\s\-_()\/\\.]+/g, '')
      .replace(/^(الصف|صف)/g, '')
      .replace(/شعبة/g, '')
      .replace(/ال/g, '')
      .replace(/ة/g, 'ه')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ـ/g, '')
      .toLowerCase();

    const normGrade = norm(stGrade);
    const normSection = norm(stSection);
    const normFull = norm(`${stGrade} ${stSection}`);

    const matched = teachingStaff.filter(t => {
      const classesList = Array.isArray(t.classes) ? t.classes : [];
      if (classesList.length > 0) {
        return classesList.some((c: any) => {
          const cName = typeof c === 'string' ? c : (c?.name || c?.className || '');
          const normC = norm(cName);
          if (!normC) return false;
          if (normGrade && (normC.includes(normGrade) || normGrade.includes(normC))) return true;
          if (normFull && (normC.includes(normFull) || normFull.includes(normC))) return true;
          if (normSection && normC.includes(normSection)) return true;
          return false;
        });
      }

      if (Array.isArray(t.schedule) && t.schedule.length > 0) {
        return t.schedule.some((s: any) => {
          const cName = s?.className || s?.class || s?.grade || '';
          const normC = norm(cName);
          return normC && (normC.includes(normGrade) || normGrade.includes(normC));
        });
      }

      return true;
    });

    return matched.length > 0 ? matched : teachingStaff;
  }, [allTeachers, studentData, grade]);

  // Handler: Send Message to Selected Teacher
  const handleSendTeacherMessage = async () => {
    if (!selectedTeacherForChat || !teacherMessageText.trim()) return;
    setIsSendingTeacherMessage(true);
    const msgText = teacherMessageText.trim();
    const tId = selectedTeacherForChat.id || selectedTeacherForChat.code;
    const cleanStudentName = cleanParentStudentName(studentName);

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const isPM = hours >= 12;
    const h12 = (hours % 12 || 12).toString().padStart(2, '0');
    const timeFormatted = `${h12}:${minutes} ${isPM ? 'م' : 'ص'}`;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: 'parent',
      senderName: `ولي أمر ${cleanStudentName}`,
      text: msgText,
      time: timeFormatted,
      date: now.toISOString().split('T')[0],
      timestamp: now.toISOString(),
      status: 'sent'
    };

    const updatedHistory = {
      ...teacherChatHistory,
      [tId]: [...(teacherChatHistory[tId] || []), newMsg]
    };
    setTeacherChatHistory(updatedHistory);
    try {
      safeStorage.setItem(`bairaq_parent_teacher_chats_${studentCode || ''}`, JSON.stringify(updatedHistory));
    } catch {}

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: tId,
          recipientRole: 'teacher',
          type: 'parent_message',
          title: `💬 رسالة جديدة من ولي أمر الطالب ${cleanStudentName}`,
          message: `تلقيت استفساراً جديداً من ولي أمر الطالب ${cleanStudentName} (${studentData?.grade || ''}): "${msgText}"`,
          read: false,
          senderName: `ولي أمر ${cleanStudentName}`,
          studentCode: studentCode,
          studentName: cleanStudentName
        })
      });

      try {
        await supportService.createTicket({
          userId: tId,
          userRole: 'teacher',
          schoolId: schoolId || undefined,
          studentName: cleanStudentName,
          grade: studentData?.grade || grade || 'عام',
          type: 'مراسلة ولي الأمر',
          message: `رسالة ولي أمر الطالب (${cleanStudentName}) إلى الأستاذ (${selectedTeacherForChat.name}): ${msgText}`,
          studentCode: studentCode || ''
        });
      } catch {}

      setTeacherMessageText('');
      showToast?.(`تم إرسال رسالتك للأستاذ (${selectedTeacherForChat.name}) بنجاح! ⚡`, 'success');
    } catch (err) {
      console.warn("Error sending teacher message:", err);
      showToast?.(`تم حفظ وإرسال الرسالة للأستاذ بنجاح!`, 'success');
      setTeacherMessageText('');
    } finally {
      setIsSendingTeacherMessage(false);
    }
  };

  const handlePrevAttendanceDay = () => {
    try {
      const parts = selectedAttendanceDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedAttendanceDate(`${y}-${m}-${day}`);
    } catch {}
  };

  const handleNextAttendanceDay = () => {
    try {
      const parts = selectedAttendanceDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const nextDate = `${y}-${m}-${day}`;
      if (nextDate <= todayDateStr) {
        setSelectedAttendanceDate(nextDate);
      }
    } catch {}
  };

  const getArabicDateFormatted = (dateStr: string) => {
    try {
      const parts = (dateStr || '').split('-');
      if (parts.length !== 3) return dateStr;
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (isNaN(d.getTime())) return dateStr;
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      return `${days[d.getDay()]}، ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };
  const solutionFileInputRef = useRef<HTMLInputElement | null>(null);

  const [viewedHwIds, setViewedHwIds] = useState<Set<string>>(() => {
    try {
      const studentKey = studentData?.id || studentCode || 'default';
      const saved = localStorage.getItem(`s6_parent_viewed_hw_${studentKey}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      const studentKey = studentData?.id || studentCode || 'default';
      const saved = localStorage.getItem(`s6_parent_viewed_hw_${studentKey}`);
      if (saved) {
        setViewedHwIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.warn("Failed to load viewed homeworks", e);
    }
  }, [studentData?.id, studentCode]);

  useEffect(() => {
    if (activeSubPage === 'homework' && parentHomeworks.length > 0) {
      markAllHomeworksAsViewed();
    }
  }, [activeSubPage, parentHomeworks]);

  const markHwAsViewed = (hwId: string) => {
    if (!hwId) return;
    setViewedHwIds(prev => {
      if (prev.has(hwId)) return prev;
      const next = new Set(prev);
      next.add(hwId);
      try {
        const studentKey = studentData?.id || studentCode || 'default';
        localStorage.setItem(`s6_parent_viewed_hw_${studentKey}`, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn("Failed to save viewed homeworks", e);
      }
      return next;
    });
  };

  const markAllHomeworksAsViewed = () => {
    const allIds = parentHomeworks.map(h => h.id).filter(Boolean);
    if (allIds.length === 0) return;
    setViewedHwIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      try {
        const studentKey = studentData?.id || studentCode || 'default';
        localStorage.setItem(`s6_parent_viewed_hw_${studentKey}`, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn("Failed to save viewed homeworks", e);
      }
      return next;
    });
  };

  const handleSolutionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const combined = [...solutionImages, ...files].slice(0, 5);
    setSolutionImages(combined);
    const newPreviews = combined.map(f => URL.createObjectURL(f));
    setSolutionImagePreviews(newPreviews);
  };

  const handleRemoveSolutionImage = (index: number) => {
    const nextImages = solutionImages.filter((_, i) => i !== index);
    setSolutionImages(nextImages);
    const nextPreviews = nextImages.map(f => URL.createObjectURL(f));
    setSolutionImagePreviews(nextPreviews);
  };

  const handleParentSubmitSolution = async (hw: any) => {
    if (!hw || (!solutionText.trim() && solutionImages.length === 0)) {
      setSolutionSubmitError('يرجى كتابة الحل أو إرفاق صورة الحل على الأقل');
      return;
    }
    const effectiveSchoolId = schoolId || studentData?.schoolId || 'school1';
    setIsSubmittingSolution(true);
    setSolutionSubmitError(null);
    try {
      let uploadedUrls: string[] = [];
      if (solutionImages.length > 0) {
        for (const file of solutionImages) {
          try {
            const url = await uploadFileToR2(file);
            uploadedUrls.push(url);
          } catch (uploadErr) {
            console.warn("Upload direct failed, fallback to data url", uploadErr);
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            uploadedUrls.push(dataUrl);
          }
        }
      }

      let fullContent = solutionText.trim();
      if (uploadedUrls.length > 0) {
        const imagesMd = uploadedUrls.map((u, i) => `![صورة الحل ${i + 1}](${u})`).join('\n\n');
        fullContent = fullContent ? `${fullContent}\n\n${imagesMd}` : imagesMd;
      }

      const cleanStudentName = cleanParentStudentName(studentData?.name || studentName);
      const studentClass = studentData?.grade || grade || 'عام';

      // Call AI Evaluation for Parent Submission
      let aiFeedback = "";
      let pointsAwarded = 0;
      let badgeAwarded = null;
      let aiGraded = false;

      try {
        const response = await fetch('/api/gemini/evaluate-homework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: effectiveSchoolId,
            taskId: hw.id,
            taskTitle: hw.name || hw.title || 'واجب مدرسي',
            studentId: studentData?.id || studentCode || 'std_unknown',
            studentName: cleanStudentName,
            content: fullContent
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          aiFeedback = data.feedback;
          pointsAwarded = data.pointsAwarded;
          badgeAwarded = data.badgeAwarded || null;
          aiGraded = true;
        }
      } catch (geminiErr) {
        console.warn("Failed AI evaluation for parent submission, continuing with local submit", geminiErr);
      }

      const submissionPayload = {
        taskId: hw.id,
        taskTitle: hw.name || hw.title || 'واجب مدرسي',
        type: 'homework',
        studentId: studentData?.id || studentCode || 'std_unknown',
        studentName: cleanStudentName,
        studentCode: studentCode || studentData?.code || '',
        class: studentClass,
        grade: studentClass,
        subject: hw.subject || 'عام',
        teacherId: hw.teacherId || '',
        teacherName: hw.teacherName || '',
        content: fullContent,
        solutionImages: uploadedUrls,
        imageUrl: uploadedUrls[0] || null,
        status: aiGraded ? 'completed' : 'pending',
        submittedBy: 'parent',
        parentName: studentName || 'ولي الأمر',
        submittedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        aiFeedback: aiFeedback || null,
        feedback: aiFeedback || null,
        score: pointsAwarded,
        pointsAwarded: pointsAwarded,
        badgeAwarded: badgeAwarded,
        aiGraded: aiGraded
      };

      await addDoc(collection(db, "schools", effectiveSchoolId, "activities_submissions"), submissionPayload);

      // If AI graded successfully and awarded points, update the student's user profile in Firestore
      if (aiGraded && pointsAwarded > 0) {
        const studentUid = studentData?.uid || studentData?.id;
        if (studentUid) {
          const userRef = doc(db, "users", studentUid);
          const updateFields: any = {
            totalScore: increment(pointsAwarded),
            xp: increment(pointsAwarded)
          };
          if (badgeAwarded) {
            updateFields.outstandingBadges = arrayUnion(badgeAwarded);
          }
          try {
            await updateDoc(userRef, updateFields);
          } catch (err) {
            console.warn("Failed to update user document for parent-submitted homework points:", err);
          }
        }
      }

      setSolutionSubmitSuccess(true);
      setSolutionText('');
      setSolutionImages([]);
      setSolutionImagePreviews([]);
      
      // Update viewing modal with newly created submission representation
      setViewingHwModal((prev: any) => prev ? {
        ...prev,
        submission: {
          ...submissionPayload,
          id: 'temp_sub_' + Date.now(),
          createdAt: { toDate: () => new Date() }
        }
      } : null);

      setTimeout(() => {
        setSolutionSubmitSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error("Failed to submit solution by parent:", err);
      setSolutionSubmitError(err?.message || 'فشل في إرسال الحل، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmittingSolution(false);
    }
  };

  useEffect(() => {
    const effectiveSchoolId = schoolId || studentData?.schoolId || 'school1';
    if (!effectiveSchoolId) return;

    const q = query(
      collection(db, "schools", effectiveSchoolId, "ai_materials"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParentHomeworks(items);
    }, (err) => {
      console.warn("Failed to fetch homework materials in ParentPortal", err);
    });

    const studentId = studentData?.id || studentCode || 'unknown';
    const qSub = query(
      collection(db, "schools", effectiveSchoolId, "activities_submissions"),
      where("studentId", "==", studentId)
    );
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParentSubmissions(subs);
    }, (err) => {
      console.warn("Failed to fetch student submissions in ParentPortal", err);
    });

    return () => {
      unsub();
      unsubSub();
    };
  }, [schoolId, studentData?.schoolId, studentData?.id, studentCode]);

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

    const normalizeArabicText = (txt: string) => {
      return (txt || '').replace(/أ|إ|آ/g, 'ا').replace(/ة/g, 'ه').toLowerCase().trim();
    };

    const sNorm = normalizeArabicText(sClean);

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

    if (!docGrade) return true;
    const dClean = String(docGrade).trim();
    const dNorm = normalizeArabicText(dClean);
    if (dClean === "الكل" || dClean === "عام" || dClean === "جميع المراحل" || dNorm === "all" || dClean === "*") return true;
    if (dNorm === sNorm || dNorm.includes(sNorm) || sNorm.includes(dNorm)) return true;

    for (const g of grades) {
      const dMatches = g.keys.some(k => dNorm.includes(k));
      const sMatches = g.keys.some(k => sNorm.includes(k));
      if (dMatches && sMatches) return true;
    }
    return false;
  };

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

  // Sync with prop notifications
  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setParentNotifications(initialNotifications);
    }
  }, [initialNotifications]);

  // Auto-navigate to requested tab from Hub or navigation
  useEffect(() => {
    try {
      const target = safeStorage.getItem('s6_target_parent_tab') || safeStorage.getItem('s6_target_tab');
      if (target) {
        safeStorage.removeItem('s6_target_parent_tab');
        safeStorage.removeItem('s6_target_tab');

        if (target === 'attendance') {
          setActiveSubPage('attendance');
        } else if (target === 'grades') {
          setActiveSubPage('grades');
        } else if (target === 'finance') {
          setActiveSubPage('finance');
        } else if (target === 'notifications') {
          setActiveSubPage('ideas');
        } else if (target === 'messages' || target === 'support' || target === 'meeting') {
          setIsSupportFormOpen(true);
        } else if (target === 'homework') {
          setActiveSubPage('homework');
        } else if (target === 'transport') {
          setShowTransportView(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const parentCode = studentData?.parentCode || studentCode;
    const currentUid = auth.currentUser?.uid;
    
    if (!parentCode && !currentUid) return;

    const possibleIds = [parentCode, currentUid, studentCode].filter(Boolean) as string[];

    if (possibleIds.length === 0) return;

    const q = query(
      collection(db, 'idea_bank'),
      where('senderId', 'in', possibleIds),
      where('readByParent', '==', false)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadIdeasCount(snapshot.docs.length);
    }, (err) => {
      console.warn("Error fetching unread ideas count", err);
      // Don't clear state on error, keep last known value
    });

    return () => unsub();
  }, [studentData?.parentCode, studentCode]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [subjectMapping, setSubjectMapping] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<{ adminPhone?: string, adminWhatsapp?: string, schoolName?: string, name?: string }>({});
  const [tuitionFee, setTuitionFee] = useState<number>(0);
  const [discountRates, setDiscountRates] = useState<Record<string, number>>({});
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [schoolConfigs, setSchoolConfigs] = useState<any>(null);

  const getStageFromGrade = (studentGrade: string): string => {
    const trimmed = (studentGrade || '').trim();
    if (trimmed.includes('ابتدائي')) return 'المرحلة الابتدائية';
    if (trimmed.includes('متوسط')) return 'المرحلة المتوسطة';
    return 'المرحلة الاعدادية';
  };

  const getArabicToday = (): string => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  };
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [activeFinanceTab, setActiveFinanceTab] = useState<'installments' | 'logs'>('installments');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const [studentDocId, setStudentDocId] = useState<string | null>(null);
  const [futureTargetCollege, setFutureTargetCollege] = useState<string>('');
  const [futureTargetAverage, setFutureTargetAverage] = useState<number>(95);
  const [futureTab, setFutureTab] = useState<'calculator' | 'guide'>('calculator');
  const [futureParentNotes, setFutureParentNotes] = useState<string>('');
  const [isSavingFuturePath, setIsSavingFuturePath] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  
  const [selectedUnivId, setSelectedUnivId] = useState<string>('');
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');

  // Future Tab Widescreen state
  const [thresholdSearch, setThresholdSearch] = useState<string>('');
  const [thresholdBranchFilter, setThresholdBranchFilter] = useState<string>('all');
  const [thresholdCategoryFilter, setThresholdCategoryFilter] = useState<string>('all');
  const [thresholdSortField, setThresholdSortField] = useState<'name' | 'minGpa' | 'totalScore' | 'competitiveScore'>('minGpa');
  const [thresholdSortOrder, setThresholdSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAdvisoryCollegeId, setSelectedAdvisoryCollegeId] = useState<string>('');
  const [thresholdDisplayLimit, setThresholdDisplayLimit] = useState<number>(50);

  useEffect(() => {
    setThresholdDisplayLimit(50);
  }, [thresholdSearch, thresholdBranchFilter, thresholdCategoryFilter, thresholdSortField, thresholdSortOrder]);
  
  // 60-Second Challenge States
  const [isChallengeActive, setIsChallengeActive] = useState<boolean>(false);
  const [challengeTimer, setChallengeTimer] = useState<number>(60);
  const [challengeStep, setChallengeStep] = useState<number>(1);
  const [challengeSelectedOption, setChallengeSelectedOption] = useState<number | null>(null);
  const [challengeScore, setChallengeScore] = useState<number>(0);
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);
  const challengeIntervalRef = useRef<any>(null);

  const studentBranch = useMemo<'scientific' | 'literary'>(() => {
    if (!studentData?.grade) return 'scientific';
    const text = studentData.grade.toLowerCase();
    if (text.includes('أدبي') || text.includes('literary') || text.includes('lit') || text.includes('literary')) {
      return 'literary';
    }
    return 'scientific';
  }, [studentData?.grade]);

  const filteredThresholdsList = useMemo(() => {
    let list = [...flattenedColleges];

    if (thresholdSearch.trim() !== '') {
      const queryText = thresholdSearch.toLowerCase();
      list = list.filter(item => 
        item.univName.toLowerCase().includes(queryText) || 
        item.collegeName.toLowerCase().includes(queryText) || 
        item.location.toLowerCase().includes(queryText)
      );
    }

    const checkBranch = thresholdBranchFilter === 'all' ? studentBranch : thresholdBranchFilter;
    list = list.filter(item => item.branch === 'both' || item.branch === checkBranch);

    if (thresholdCategoryFilter !== 'all') {
      list = list.filter(item => item.category === thresholdCategoryFilter);
    }

    list.sort((a, b) => {
      if (thresholdSortField === 'name') {
        const fullA = `${a.univName} ${a.collegeName}`;
        const fullB = `${b.univName} ${b.collegeName}`;
        return thresholdSortOrder === 'asc' ? fullA.localeCompare(fullB) : fullB.localeCompare(fullA);
      }
      const valA = a[thresholdSortField as keyof typeof a] as number || 0;
      const valB = b[thresholdSortField as keyof typeof b] as number || 0;
      return thresholdSortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [thresholdSearch, thresholdBranchFilter, studentBranch, thresholdCategoryFilter, thresholdSortField, thresholdSortOrder]);

  const uniqueTransactions = useMemo(() => {
    if (!studentData?.finance?.transactions) return [];
    
    const paidInstallments = new Set(
      (studentData?.finance?.installments || [])
        .filter((i: any) => i.paid || i.status === 'paid' || i.status === 'completed' || i.status === 'verified')
        .map((i: any) => i.name?.trim())
    );

    // Sort transactions so most recent (and completed) appear first
    const sortedTxns = [...studentData.finance.transactions].sort((a: any, b: any) => {
       if (a.status === 'completed' && b.status !== 'completed') return -1;
       if (b.status === 'completed' && a.status !== 'completed') return 1;
       const bTime = new Date(b.date || b.timestamp || 0).getTime();
       const aTime = new Date(a.date || a.timestamp || 0).getTime();
       return bTime - aTime;
    });

    const finalTxns = [];
    
    for (const t of sortedTxns) {
      const note = typeof t.note === 'string' ? t.note.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim() : '';
      const amount = Number(t.amount) || 0;
      const reqId = t.requestId;
      
      // CRITICAL: Ensure we don't show "completed" transactions for installments the admin marked as unpaid
      if (t.status === 'completed' && note !== '') {
          const matchingInst = (studentData?.finance?.installments || []).find((i:any) => i.name?.trim() === note);
          if (matchingInst && !paidInstallments.has(note)) {
              continue; // Skip because the installment is unpaid/cancelled
          }
      }
      
      let isDuplicate = false;
      for (let i = 0; i < finalTxns.length; i++) {
         const existing = finalTxns[i];
         const existingNote = typeof existing.note === 'string' ? existing.note.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim() : '';
         
         if ((reqId && (existing.id === reqId || existing.requestId === reqId)) || 
             (t.id && existing.id === t.id) ||
             (existingNote === note && Number(existing.amount) === amount && note !== '')) {
             
             // If we found a duplicate, but the current one `t` is stamped, we might want to ensure the stamped one prevails?
             // Since we sorted it, we assume the one already in finalTxns is better, unless it's pending.
             if (t.status === 'completed' && existing.status !== 'completed') {
                 finalTxns[i] = t; // overwrite
             }
             isDuplicate = true;
             break;
         }
      }
      
      if (!isDuplicate) {
        finalTxns.push(t);
      }
    }
    return finalTxns;
  }, [studentData?.finance?.transactions]);

  const attemptedViewReqIds = React.useRef<Set<string>>(new Set());

  // Function to mark rejected/pending requests as viewed
  const markRejectedAsViewed = async () => {
    const unviewedRequests = pendingRequests.filter(r => (r.status === 'rejected' || r.status === 'pending') && r.viewedByParent === false && !attemptedViewReqIds.current.has(r.id));
    if (unviewedRequests.length === 0) return;

    for (const req of unviewedRequests) {
      attemptedViewReqIds.current.add(req.id);
      await updateDoc(doc(db, 'payment_requests', req.id), {
        viewedByParent: true
      }).catch(console.error);
    }
  };

  useEffect(() => {
    if (activeSubPage === 'finance') {
      markRejectedAsViewed();
    }
  }, [activeSubPage, pendingRequests]);

  // 60-Second Central Admissions Challenge timer
  useEffect(() => {
    if (isChallengeActive && !challengeCompleted) {
      challengeIntervalRef.current = setInterval(() => {
        setChallengeTimer((prev) => {
          if (prev <= 1) {
            setChallengeCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (challengeIntervalRef.current) {
        clearInterval(challengeIntervalRef.current);
      }
    }
    
    return () => {
      if (challengeIntervalRef.current) {
        clearInterval(challengeIntervalRef.current);
      }
    };
  }, [isChallengeActive, challengeCompleted]);

  // Subscribe to subject mapping, school info and tuition settings

  // Subscribe to subject mapping, school info and tuition settings
  useEffect(() => {
    const unsubMap = onSnapshot(doc(db, 'settings', 'subject_mapping'), (d) => {
      if (d.exists()) setSubjectMapping(d.data());
    });
    
    const effectiveSchoolId = schoolId || studentData?.schoolId || 'school1';
    const unsubConfigs = academicService.subscribeToSchoolSettings(effectiveSchoolId, (data) => {
      if (data) {
        setPaymentSettings(data.paymentMethods || {});
        setSchoolConfigs(data);
        setDiscountRates(data.discountRates || {});
        // Merge SQL config into schoolInfo state for UI compatibility
        setSchoolInfo({
          adminPhone: data.adminPhone,
          adminWhatsapp: data.adminWhatsapp,
          schoolName: data.name || data.schoolName,
          name: data.name || data.schoolName
        });
      }
    });
    
    return () => {
      unsubMap();
      unsubConfigs();
    };
  }, [schoolId, studentData?.schoolId]);

  // Sync disabled modules locally in same tab
  useEffect(() => {
    const handleSchoolConfigEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;
      const effectiveSchoolId = schoolId || studentData?.schoolId || 'school1';
      if (detail.schoolId === effectiveSchoolId || !detail.schoolId) {
        setSchoolConfigs((prev: any) => ({
          ...(prev || {}),
          disabledModules: detail.disabledModules || []
        }));
      }
    };
    window.addEventListener("school_configs_updated", handleSchoolConfigEvent);
    return () => window.removeEventListener("school_configs_updated", handleSchoolConfigEvent);
  }, [schoolId, studentData?.schoolId]);

  useEffect(() => {
    if (schoolConfigs && studentData) {
      const grade = studentData.grade;
      const normalizedGrade = normalizeGradeCanonical(grade || '');
      const byGrade = schoolConfigs.tuitionFeesByGrade || {};
      
      // Try exact match, then normalized match to find the BASE fee for this grade
      let baseFee = (grade && byGrade[grade] !== undefined) ? Number(byGrade[grade]) : undefined;
      
      if (baseFee === undefined && normalizedGrade) {
        // Try matching with normalized keys
        const matchKey = Object.keys(byGrade).find(k => normalizeGradeCanonical(k) === normalizedGrade);
        if (matchKey) {
          baseFee = Number(byGrade[matchKey]);
        }
      }
      
      // Fallback to global tuition fee from school config
      if (baseFee === undefined) {
        baseFee = (Number(schoolConfigs.tuitionFee) || 0);
      }

      // If server provided a totalAmount, and we couldn't find a grade fee, use it as fallback
      // But otherwise, we prefer the base grade fee so calculateStudentFinancials can work correctly
      if (baseFee === 0 || baseFee === undefined) {
        const serverTotal = studentData.totalAmount || studentData.finance?.totalTuition;
        if (serverTotal !== undefined && serverTotal > 0) {
           baseFee = Number(serverTotal);
        }
      }
      
      setTuitionFee(baseFee);
    }
  }, [schoolConfigs, studentData?.grade, studentData?.totalAmount, studentData?.finance?.totalTuition]);

  // Fetch Parent-Specific Notifications
  useEffect(() => {
    const pCode = studentData?.parentCode;
    const sCode = studentData?.studentCode || studentCode;
    const currentUid = auth.currentUser?.uid;
    
    const possibleIdsSet = new Set<string>();

    const addCodes = (codeStr?: string, isParent = true) => {
      if (!codeStr) return;
      const clean = codeStr.trim();
      const upper = clean.toUpperCase();
      const lower = clean.toLowerCase();
      
      possibleIdsSet.add(clean);
      possibleIdsSet.add(upper);
      possibleIdsSet.add(lower);
      
      const prefix = isParent ? 'pcode_' : 'scode_';
      possibleIdsSet.add(`${prefix}${clean}`);
      possibleIdsSet.add(`${prefix}${upper}`);
      possibleIdsSet.add(`${prefix}${lower}`);
      
      if (upper.startsWith('P-') || upper.startsWith('S-') || upper.startsWith('PAR-') || upper.startsWith('STU-')) {
        const pure = upper.replace(/^(STU-|PAR-|P-|S-)/i, '');
        possibleIdsSet.add(pure);
        possibleIdsSet.add(pure.toLowerCase());
        possibleIdsSet.add(`${prefix}${pure}`);
        possibleIdsSet.add(`${prefix}${pure.toLowerCase()}`);
        if (isParent) {
          possibleIdsSet.add(`pcode_P-${pure}`);
        } else {
          possibleIdsSet.add(`scode_S-${pure}`);
        }
      } else {
        if (isParent) {
          possibleIdsSet.add(`P-${upper}`);
          possibleIdsSet.add(`pcode_P-${upper}`);
        } else {
          possibleIdsSet.add(`S-${upper}`);
          possibleIdsSet.add(`scode_S-${upper}`);
        }
      }
    };

    if (currentUid) {
      possibleIdsSet.add(currentUid);
      possibleIdsSet.add(currentUid.trim());
      possibleIdsSet.add(currentUid.trim().toUpperCase());
      possibleIdsSet.add(currentUid.trim().toLowerCase());
    }
    
    addCodes(pCode, true);
    addCodes(sCode, false);
    if (studentData?.id) {
      possibleIdsSet.add(studentData.id);
    }

    const filterIds = Array.from(possibleIdsSet).filter(Boolean);
    if (filterIds.length === 0) return;

    let isMounted = true;
    
    import('../services/broadcastService').then(({ broadcastService }) => {
      broadcastService.subscribeToBroadcasts(schoolId || 'school_awail_ghamas', (allData) => {
        if (!isMounted) return;
        const pBroadcasts = (allData || [])
          .filter((b: any) => {
            const raw = b.targetGrades || b.target_grades;
            let grades: string[] = [];
            if (Array.isArray(raw)) grades = raw;
            else if (typeof raw === 'string') grades = [raw];
            
            // 1. Show if it explicitly targets parent_only
            if (grades.includes('parent_only')) return true;
            
            // 2. Or, if it targets the student's grade and section
            if (studentData?.grade) {
              const gradeMatch = matchesTargetGrades(studentData.grade, raw);
              if (gradeMatch) {
                // If it targets a specific section, check section matching
                const targetSec = b.targetSection || b.target_section;
                if (targetSec && studentData.section) {
                  const bSecLetter = extractSectionLetter(targetSec);
                  const sSecLetter = extractSectionLetter(studentData.section);
                  if (bSecLetter && sSecLetter) {
                    return bSecLetter === sSecLetter;
                  }
                  return targetSec.trim().toLowerCase() === studentData.section.trim().toLowerCase() ||
                         targetSec.includes(studentData.section) ||
                         studentData.section.includes(targetSec);
                }
                return true;
              }
            }
            return false;
          })
          .sort((a: any, b: any) => (b.timestampMs || 0) - (a.timestampMs || 0))
          .slice(0, 200);
        setParentBroadcasts(pBroadcasts);
      });
    }).catch(console.warn);

    const fetchNotifsAndTickets = async () => {
       try {
         const { supportService } = await import('../services/supportService');
         const possibleTicketIds = [...filterIds];
         let unread = 0;
         if (possibleTicketIds.length > 0) {
            const tickets = await supportService.fetchTickets(schoolId, possibleTicketIds[0], possibleTicketIds, 'parent');
            const pTickets = tickets.filter(t => t.role === 'parent' || !t.role);
            unread = pTickets.filter(t => t.status === 'resolved' && (t.readByStudent === false || t.readByStudent === undefined)).length;
         }
         
         const res = await fetch(`/api/notifications?recipientIds=${encodeURIComponent(filterIds.join(','))}`);
         const data = await res.json();
         if (isMounted && data.success) {
            const notifs = data.notifications || [];
            setParentNotifications(notifs);
            const unreadNotifs = notifs.filter((n: any) => !n.read).length;
            setUnreadSupportCount(unread);
         } else if (isMounted) {
            setUnreadSupportCount(unread);
         }
       } catch (err) {
         console.warn("Error fetching tickets or notifications:", err);
       }
    };
    
    fetchNotifsAndTickets();
    
    let cleanupLounge: (() => void) | null = null;
    
    import('../lib/realtimeManager').then(({ realtimeManager }) => {
      realtimeManager.on('notifications_updated', fetchNotifsAndTickets);
      realtimeManager.on('support_tickets_updated', fetchNotifsAndTickets);
      
      cleanupLounge = realtimeManager.subscribe('lounge_messages', (event) => {
        fetchNotifsAndTickets();
        if (event && event.action === 'INSERT' && event.data) {
          const msgData = event.data;
          const currentUid = auth.currentUser?.uid || studentCode;
          if (msgData && msgData.recipientId === currentUid && msgData.userId !== currentUid) {
            const senderName = msgData.userName || 'الكادر التدريسي';
            const text = msgData.text === 'بصمة صوتية' ? 'أرسل لك بصمة صوتية 🎙️' : msgData.text;
            showToast(`💬 رسالة جديدة من ${senderName}: ${text}`, 'success');
            
            // Trigger background system push notification (Messenger / Facebook style)
            pushNotificationManager.showLocalNotification(`رسالة جديدة من أ. ${senderName} 💬`, {
              body: text,
              icon: msgData.userPhoto || '/logo.png',
              tag: `lounge_msg_${msgData.userId}`,
              renotify: true
            });
          }
        }
      });
    }).catch(console.warn);

    return () => {
      isMounted = false;
      if (cleanupLounge) cleanupLounge();
      import('../lib/realtimeManager').then(({ realtimeManager }) => {
        realtimeManager.off('notifications_updated', fetchNotifsAndTickets);
        realtimeManager.off('support_tickets_updated', fetchNotifsAndTickets);
      }).catch(console.warn);
    };
  }, [studentData?.parentCode, studentCode, studentData?.id, studentData?.grade, studentData?.section]);

  const gradePeriods = [
    { id: 'month1', name: 'الشهر الاول' },
    { id: 'month2', name: 'الشهرالثاني' },
    { id: 'term1_avg', name: 'معدل الفصل الاول' },
    { id: 'mid', name: 'نصف السنة' },
    { id: 'month3', name: 'الشهر الاول ف1' },
    { id: 'month4', name: 'الشهر الثاني ف 2' },
    { id: 'term2_avg', name: 'معدل الفصل الثاني' },
    { id: 'annual_quest', name: 'معدل السعي السنوي' },
    { id: 'final', name: 'آخر السنة' },
    { id: 'final_grade', name: 'الدرجة النهائية' }
  ];

  // Subscribe to student data to get real grades and financials
  useEffect(() => {
    if (!studentCode || !schoolId) {
      setIsLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      try {
        // 1. First, try fetching from SQL API to leverage Just-In-Time finance repair
        const apiRes = await fetch(`/api/students/by-code/${encodeURIComponent(schoolId)}/${encodeURIComponent(studentCode)}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success && apiData.student) {
            setStudentData(apiData.student);
            setStudentDocId(apiData.student.id);
            setError(null);
            
            // Handle future path
            if (apiData.student.futurePath) {
              setFutureTargetCollege(apiData.student.futurePath.targetCollege || '');
              setFutureTargetAverage(apiData.student.futurePath.targetAverage || 95);
              setFutureParentNotes(apiData.student.futurePath.notes || '');
            }
            
            if (apiData.student.lastSyncedPeriod) {
              setSelectedGradePeriod(apiData.student.lastSyncedPeriod);
            }
            
            // We have the truth from SQL, but we still subscribe to Firestore for real-time grades if needed
            // However, for financials, SQL is the repaired source.
          }
        }
      } catch (err) {
        console.warn("API student fetch failed, falling back to Firestore:", err);
      }
    };

    fetchStudentData();

    // Add realtimeManager listener for SQL updates (grade changes, finance repairs/updates, pride messages)
    let unsubRealtime: (() => void) | null = null;
    import('../lib/realtimeManager').then(({ realtimeManager }) => {
      unsubRealtime = realtimeManager.on('students', (payload: any) => {
        const payloadData = payload?.data || {};
        const pCode = (payloadData.studentCode || payloadData.code || payloadData.student || '').toString().toLowerCase().trim();
        const targetCode = (studentCode || '').toString().toLowerCase().trim();

        if (payload.action === 'UPDATE' && (payload.id === studentDocId || pCode === targetCode || payload.id?.includes(targetCode))) {
           console.log("[ParentPortal] Received real-time student update from SQL:", payload);
           if (payload.data) {
             setStudentData(prev => {
               if (!prev) return payload.data;
               return { ...prev, ...payload.data };
             });
           } else {
             // Fallback to refetch if payload.data is missing
             fetchStudentData();
           }
        }
      });
    }).catch(console.warn);

    // Keep Firestore subscription for real-time updates (attendance, points, grade, prideMessage)
    const q = query(
      collection(db, 'school_students'),
      where('studentCode', '==', studentCode)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        
        // Merge Firestore data (like points, level, etc.) into studentData but preserve SQL financials & SQL attendance
        setStudentData(prev => {
          if (!prev) return data;
          
          // If Firestore has NO finance or totalAmount is 0, keep the SQL one
          const hasFirestoreFinance = data.finance && data.finance.installments && data.finance.installments.length > 0;
          const isFirestoreTotalValid = data.totalAmount && Number(data.totalAmount) > 0;
          
          // Merge Firestore & SQL attendance logs dynamically
          const prevLogs = Array.isArray(prev.attendance?.logs) ? prev.attendance.logs : [];
          const firestoreLogs = Array.isArray(data.attendance?.logs) ? data.attendance.logs : [];

          const mergedLogsMap = new Map<string, any>();
          firestoreLogs.forEach((l: any) => {
            const key = `${l.date}_${l.period || 'يوم كامل'}`;
            mergedLogsMap.set(key, l);
          });
          prevLogs.forEach((l: any) => {
            const key = `${l.date}_${l.period || 'يوم كامل'}`;
            mergedLogsMap.set(key, l);
          });

          const mergedLogs = Array.from(mergedLogsMap.values());
          let pCount = 0, aCount = 0, lCount = 0;
          mergedLogs.forEach((l: any) => {
            if (l.status === 'present') pCount++;
            if (l.status === 'absent') aCount++;
            if (l.status === 'late') lCount++;
          });

          const resolvedAttendance = {
            present: pCount,
            absent: aCount,
            late: lCount,
            logs: mergedLogs
          };

          return {
            ...prev,
            ...data,
            finance: (hasFirestoreFinance && isFirestoreTotalValid) ? data.finance : prev.finance,
            totalAmount: (hasFirestoreFinance && isFirestoreTotalValid) ? data.totalAmount : prev.totalAmount,
            attendance: resolvedAttendance
          };
        });
        
        setStudentDocId(data.id);
        setError(null);
        
        if (data.futurePath) {
          setFutureTargetCollege(data.futurePath.targetCollege || '');
          setFutureTargetAverage(data.futurePath.targetAverage || 95);
          setFutureParentNotes(data.futurePath.notes || '');
        }
        
        if (data.lastSyncedPeriod) {
          setSelectedGradePeriod(data.lastSyncedPeriod);
        }
      } else {
        console.warn("Student doc not found with code:", studentCode);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Error subscribing to student in ParentPortal:", err);
      setIsLoading(false);
    });

    return () => {
      unsub();
      if (unsubRealtime) unsubRealtime();
    };
  }, [studentCode, schoolId, studentDocId]);

  // Instant real-time listener for attendance updates dispatched from teacher or admin
  useEffect(() => {
    if (!studentCode) return;
    const cleanCurrent = (studentCode || '').toLowerCase().replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();
    const sDataId = (studentData?.id || '').toLowerCase().replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();
    const sDataCode = (studentData?.code || '').toLowerCase().replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();
    const sDataParentCode = (studentData?.parentCode || '').toLowerCase().replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();

    const handleAttendanceUpdated = (evt: any) => {
      const detail = evt?.detail || evt?.data || evt?.payload || evt;
      if (!detail) return;
      const targetCode = (detail.code || detail.studentCode || detail.userId || '').toLowerCase();
      const targetParentCode = (detail.parentCode || '').toLowerCase();
      const targetId = (detail.studentId || detail.id || '').toLowerCase();
      const cleanTarget = targetCode.replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();
      const cleanTargetId = targetId.replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();
      const cleanTargetParent = targetParentCode.replace(/^(p\d*[-_]?|st[-_]?)/, '').trim();

      const isMatch = 
        (cleanTarget && (cleanTarget === cleanCurrent || cleanTarget === sDataCode || cleanTarget === sDataId)) ||
        (cleanTargetId && (cleanTargetId === cleanCurrent || cleanTargetId === sDataId || cleanTargetId === sDataCode)) ||
        (cleanTargetParent && (cleanTargetParent === cleanCurrent || cleanTargetParent === sDataParentCode)) ||
        (targetCode && (targetCode === studentCode.toLowerCase() || targetCode === studentData?.code?.toLowerCase())) ||
        (targetId && (targetId === studentData?.id?.toLowerCase() || targetId === studentCode.toLowerCase())) ||
        (detail.name && studentData?.name && detail.name.trim() === studentData.name.trim());

      if (isMatch) {
        setStudentData((prev: any) => {
          if (!prev) return prev;
          if (detail.attendance && Array.isArray(detail.attendance.logs) && detail.attendance.logs.length > 0) {
            return {
              ...prev,
              attendance: detail.attendance
            };
          }
          const currentAttendance = prev.attendance || { present: 0, absent: 0, late: 0, logs: [] };
          const logs = Array.isArray(currentAttendance.logs) ? currentAttendance.logs : [];
          const attPeriod = detail.period || 'يوم كامل';
          const attDate = detail.date || new Date().toISOString().split('T')[0];
          const otherLogs = logs.filter((l: any) => !(l.date === attDate && l.period === attPeriod));
          const attTime = detail.time || (() => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            const isPM = h >= 12;
            const h12 = (h % 12 || 12).toString().padStart(2, '0');
            return `${h12}:${m} ${isPM ? 'م' : 'ص'}`;
          })();

          const newLog = {
            date: attDate,
            status: detail.status || 'present',
            period: attPeriod,
            reason: detail.reason || '',
            time: attTime,
            by: detail.by || 'الأستاذ'
          };
          const updatedLogs = [newLog, ...otherLogs];
          let present = 0, absent = 0, late = 0;
          updatedLogs.forEach((l: any) => {
            if (l.status === 'present') present++;
            if (l.status === 'absent') absent++;
            if (l.status === 'late') late++;
          });
          return {
            ...prev,
            attendance: { present, absent, late, logs: updatedLogs }
          };
        });
      }
    };

    const unsubAttendance = realtimeManager.on('attendance', (data: any) => {
      handleAttendanceUpdated(data);
    });

    const unsubStudents = realtimeManager.on('students', (data: any) => {
      if (data?.action === 'UPDATE') {
        const payload = data.payload || data.data || data;
        handleAttendanceUpdated(payload);
      }
    });

    window.addEventListener('attendance_updated', handleAttendanceUpdated as any);
    return () => {
      window.removeEventListener('attendance_updated', handleAttendanceUpdated as any);
      unsubAttendance();
      unsubStudents();
    };
  }, [studentCode, studentData?.id, studentData?.code]);

  // Fetch fresh attendance logs whenever entering attendance page or code changes
  useEffect(() => {
    if (!studentCode || !schoolId) return;
    if (activeSubPage === 'attendance') {
      fetch(`/api/students/by-code/${encodeURIComponent(schoolId)}/${encodeURIComponent(studentCode)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.success && data?.student?.attendance) {
            setStudentData((prev: any) => {
              if (!prev) return data.student;
              return {
                ...prev,
                attendance: data.student.attendance
              };
            });
          }
        })
        .catch(console.warn);
    }
  }, [activeSubPage, studentCode, schoolId]);

  // Persist studentData to local cache for instant zero-lag rendering
  useEffect(() => {
    if (studentData && studentCode) {
      try {
        safeStorage.setItem(`bairaq_cached_student_${studentCode}`, JSON.stringify(studentData));
      } catch {}
    }
  }, [studentData, studentCode]);

  // Subscribe to payment requests to show "Under Review" or "Rejected" status
  useEffect(() => {
    if (!studentCode) return;

    // Fetch both pending and rejected requests to provide feedback to the parent
    const q = query(
      collection(db, 'payment_requests'),
      where('studentCode', '==', studentCode || 'unassigned'),
      where('status', 'in', ['pending', 'rejected']),
      orderBy('timestamp', 'desc'),
      limit(15)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingRequests(requests);
    }, (error) => {
      console.warn("Error fetching payment requests:", error);
    });

    return () => unsub();
  }, [studentCode]);

  const unreadLoungeMessagesCount = useMemo(() => {
    return parentNotifications.filter(n => !n.read && (n.type === 'lounge_message' || n.type === 'parent_message')).length;
  }, [parentNotifications]);

  const generalNotifications = useMemo(() => {
    return parentNotifications.filter(n => n.type !== 'lounge_message' && n.type !== 'parent_message');
  }, [parentNotifications]);

  const unreadAnnouncementsCount = useMemo(() => {
    if (activeSubPage === "announcements") return 0;
    const unreadBroadcasts = parentBroadcasts.filter(b => b.id && !readBroadcastIds.includes(b.id)).length;
    const unreadNotifs = generalNotifications.filter(n => !n.read).length;
    return unreadBroadcasts + unreadNotifs;
  }, [parentBroadcasts, readBroadcastIds, generalNotifications, activeSubPage]);

  const totalUnreadSupport = unreadSupportCount + generalNotifications.filter(n => !n.read).length;

  const academicProfile = useMemo(() => {
     if (!studentData || !subjectMapping) return null;
     return computeAcademicIdentity(studentData, { name: studentData.listName || studentData.grade, removedSubjects: studentData.removedSubjects || [] }, subjectMapping);
  }, [studentData, subjectMapping]);

  const excellencePoints = useMemo(() => {
     if (!studentData || !subjectMapping) return null;
     return computeExcellencePoints(studentData, { name: studentData.listName || studentData.grade, removedSubjects: studentData.removedSubjects || [] }, subjectMapping, 'all');
  }, [studentData, subjectMapping]);

  const displayPrideMessage = useMemo(() => {
    if (studentData?.prideMessage) return studentData.prideMessage;
    if (academicProfile?.isEliteStudent) return "أداء استثنائي وتفوق يستحق الإشادة الدائمة من الإدارة والكادر التدريسي. 👑";
    if (academicProfile?.totalBadges && academicProfile.totalBadges > 0) return "نفخر بالتطور الكبير الذي حققه هذا الشهر في مهاراته ودروسه المتميزة وبحصوله على أوسمة التميز. 🌟";
    return "";
  }, [studentData?.prideMessage, academicProfile]);

  const allBadges = useMemo(() => {
    const list: any[] = [];
    const subjectMap = new Map<string, any>();

    if (academicProfile?.subjectBadgesArray) {
      academicProfile.subjectBadgesArray.forEach((b: any) => {
        const item = {
           badgeName: b.badge?.title || 'وسام',
           subjName: b.subject,
           icon: b.badge?.icon || '🏆',
           levelColor: b.config?.text || b.config?.colors || b.badge?.color || 'text-[#FFD600]',
           detail: `الدرجة: ${b.score}`,
           extraTags: [] as string[]
        };
        subjectMap.set(b.subject, item);
        list.push(item);
      });
    }

    if (academicProfile?.improvementBadges) {
      academicProfile.improvementBadges.forEach((b: any) => {
        const parent = subjectMap.get(b.subject);
        if (parent) {
           parent.extraTags.push('تطور ملحوظ 🚀');
        } else {
           const item = {
             badgeName: b.badge?.title || 'تطور',
             subjName: b.subject,
             icon: b.badge?.icon || '🚀',
             levelColor: b.config?.text || b.config?.colors || b.badge?.color || 'text-cyan-400',
             detail: 'تطور ملحوظ',
             extraTags: [] as string[]
           };
           subjectMap.set(b.subject, item);
           list.push(item);
        }
      });
    }

    if (academicProfile?.generalBadges) {
      academicProfile.generalBadges.forEach((b: any) => {
         if (b.id?.startsWith('exemption_indiv_')) {
            const subjName = b.id.replace('exemption_indiv_', '');
            const parent = subjectMap.get(subjName);
            if (parent) {
               parent.extraTags.push('إعفاء فردي 🏅');
               return;
            }
         }
         
         list.push({
            badgeName: b.title,
            subjName: 'وسام شرف',
            icon: b.icon,
            levelColor: b.color || 'text-amber-400 bg-amber-400/10',
            detail: b.desc,
            extraTags: [] as string[]
         });
      });
    }
    return list;
  }, [academicProfile]);

  const isSixthGrade = studentData?.grade ? (studentData.grade.includes('سادس') && (studentData.grade.includes('علمي') || studentData.grade.includes('أدبي') || studentData.grade.includes('ادبي'))) : false;

  const unreadHomeworksCount = useMemo(() => {
    return parentHomeworks.filter(hw => hw?.id && !viewedHwIds.has(hw.id)).length;
  }, [parentHomeworks, viewedHwIds]);

  // Compute unread counts for individual and broadcast lens activities separately
  const unreadIndividualCount = useMemo(() => {
    if (!Array.isArray(lensActivities) || lensActivities.length === 0) return 0;
    const individualActs = lensActivities.filter((act: any) => {
      const isBroadcast = act.studentId === 'ALL' || !act.studentId;
      return !isBroadcast;
    });

    if (!lastSeenIndividual) {
      return Math.min(individualActs.length, 3);
    }

    const unread = individualActs.filter((act: any) => {
      if (!act.createdAt) return false;
      const isUnread = new Date(act.createdAt).getTime() > lastSeenIndividual;
      return isUnread;
    });
    
    if (unread.length > 0) {
      console.log("Unread individual count > 0", unread.length, "lastSeen:", new Date(lastSeenIndividual).toISOString(), "Activities:", unread.map(u => ({id: u.id, createdAt: u.createdAt})));
    }
    
    return unread.length;
  }, [lensActivities, lastSeenIndividual]);

  const unreadBroadcastCount = useMemo(() => {
    if (!Array.isArray(lensActivities) || lensActivities.length === 0) return 0;
    const broadcastActs = lensActivities.filter((act: any) => {
      const isBroadcast = act.studentId === 'ALL' || !act.studentId;
      return isBroadcast;
    });

    if (!lastSeenBroadcast) {
      return Math.min(broadcastActs.length, 3);
    }

    return broadcastActs.filter((act: any) => {
      if (!act.createdAt) return false;
      return new Date(act.createdAt).getTime() > lastSeenBroadcast;
    }).length;
  }, [lensActivities, lastSeenBroadcast]);

  const effectiveLensBadge = useMemo(() => {
    // If the parent is currently inside the Lens section (individual or broadcast),
    // treat everything as read.
    if (parentAttendanceTab === 'lens') return 0;
    
    return unreadIndividualCount + unreadBroadcastCount;
  }, [unreadIndividualCount, unreadBroadcastCount, parentAttendanceTab]);

  const { settings: secSettings } = useSecuritySettings();

  const rawSections = [
    {
      title: "المتابعة اللحظية",
      items: [
        { 
          id: "announcements", 
          icon: Megaphone, 
          name: "مركز التبليغات والإعلانات 📢", 
          color: "text-cyan-400", 
          bg: "bg-cyan-400/10", 
          border: "border-cyan-400/20",
          badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : null
        },
        { id: "grades", icon: BarChart3, name: "سجل الدرجات", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", cap: 'view_grades' },
        { 
          id: "attendance", 
          icon: Timer, 
          name: "سجل الحضور والمواظبة", 
          color: "text-orange-400", 
          bg: "bg-orange-400/10", 
          border: "border-orange-400/20",
          badge: effectiveLensBadge > 0 ? effectiveLensBadge : null
        },
        { 
          id: "homework", 
          icon: Edit2, 
          name: "الواجبات والأنشطة اليومية", 
          color: "text-amber-400", 
          bg: "bg-amber-400/10", 
          border: "border-amber-400/20",
          badge: unreadHomeworksCount > 0 ? unreadHomeworksCount : null
        },
        { id: "uniform", icon: Shirt, name: "الزي المدرسي الرسمي", color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
        { id: "transport", icon: Bus, name: "تتبع خطوط النقل الذكي", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", cap: 'track_bus' },
      ]
    },
    {
      title: "الإدارة والتواصل",
      items: [
        { 
          id: "meeting", 
          icon: Users, 
          name: "كادر المواد وتواصل الإدارة", 
          color: "text-blue-400", 
          bg: "bg-blue-400/10", 
          border: "border-blue-400/20",
          badge: unreadLoungeMessagesCount > 0 ? unreadLoungeMessagesCount : null
        },
        { id: "finance", icon: Wallet, name: "المحفظة المالية والأقساط", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", cap: 'financial_view' },
        { id: "conduct", icon: AlertTriangle, name: "تقارير الانضباط والسلوك", color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
      ]
    },
    {
      title: "التميز والمستقبل",
      items: [
        { id: "excellence", icon: Star, name: "نظام التميز (ركن التميز)", color: "text-[#FFD600]", bg: "bg-[#FFD600]/10", border: "border-[#FFD600]/20" },
        ...(isSixthGrade ? [{ id: "future", icon: MapIcon, name: "المسار الدراسي المستقبلي", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" }] : []),
        { 
          id: "ideas", 
          icon: Lightbulb, 
          name: "مائدة الأفكار (مقترحاتكم)", 
          color: "text-purple-400", 
          bg: "bg-purple-400/10", 
          border: "border-purple-400/20",
          badge: unreadIdeasCount > 0 ? unreadIdeasCount : null
        },
      ]
    }
  ];

  const sections = useMemo(() => {
    const disabledModules = Array.isArray(schoolConfigs?.disabledModules) ? schoolConfigs.disabledModules : [];

    const checkIsDisabled = (id: string): boolean => {
      // 1. Check specific parent prefix (Priority)
      if (disabledModules.includes(`parent:${id}`)) return true;
      
      // 3. Handle aliases - ONLY check parent-prefixed versions for portal isolation
      if (id === "grades") return disabledModules.includes("parent:grades") || disabledModules.includes("parent:attendance") || disabledModules.includes("parent:discipline");
      if (id === "attendance" || id === "lens") return disabledModules.includes("parent:grades") || disabledModules.includes("parent:attendance") || disabledModules.includes("parent:discipline");
      if (id === "homework") return disabledModules.includes("parent:assignments");
      if (id === "conduct") return disabledModules.includes("parent:discipline_reports");
      if (id === "excellence") return disabledModules.includes("parent:excellence") || disabledModules.includes("parent:competitions");
      if (id === "ideas") return disabledModules.includes("parent:ideas");
      if (id === "meeting") return disabledModules.includes("parent:support");
      if (id === "finance") return disabledModules.includes("parent:financial");
      if (id === "uniform") return disabledModules.includes("parent:uniform");
      if (id === "transport") return disabledModules.includes("parent:transport");

      return false;
    };

    return rawSections.map(sec => ({
      ...sec,
      items: sec.items.filter(item => {
        // First check security capability
        const hasCap = !item.cap || securityService.canRoleAccess('parent', item.cap);
        if (!hasCap) return false;

        // Then check if disabled in dev dashboard
        return !checkIsDisabled(item.id);
      })
    })).filter(sec => sec.items.length > 0);
  }, [rawSections, schoolConfigs?.disabledModules, unreadHomeworksCount, effectiveLensBadge, securityService]);

  const getFormattedWhatsapp = (phone?: string) => {
    if (!phone) return '9647700000000';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('00964')) return cleaned.replace('00964', '964');
    if (cleaned.startsWith('+964')) return cleaned.replace('+964', '964');
    if (cleaned.startsWith('0')) return '964' + cleaned.substring(1);
    if (cleaned.startsWith('964')) return cleaned;
    return cleaned.replace('+', ''); 
  };

  const handleSaveFuturePath = async () => {
    if (!studentDocId) {
      console.error("No student document ID found.");
      return;
    }
    setIsSavingFuturePath(true);
    try {
      await updateDoc(doc(db, 'school_students', studentDocId), {
        futurePath: {
          targetCollege: futureTargetCollege,
          targetAverage: Number(futureTargetAverage) || 95,
          notes: futureParentNotes,
          updatedAt: new Date().toISOString()
        }
      });
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving future path:", err);
    } finally {
      setIsSavingFuturePath(false);
    }
  };

  const getSubpageHeaderDetails = (subPageId: string) => {
    const cleanStudentName = cleanParentStudentName(studentName);
    const activeSchool = schoolName || schoolInfo?.schoolName || schoolInfo?.name || "ثانوية أوائل غماس الأهلية";

    switch (subPageId) {
      case 'announcements':
        return {
          pose: 'pose_broadcaster' as const,
          title: 'غرفة المتابعة - مركز التبليغات والإعلانات 📢',
          subtitle: `السجل المركزي الشامل لتبليغات الإدارة والأساتذة • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'cyan' as const
        };
      case 'homework':
        return {
          pose: 'pose_homework_master' as const,
          title: 'غرفة المتابعة - الواجبات والتمارين المدرسية 📝',
          subtitle: `متابعة الواجبات المنشورة وحالة تسليم الطالب • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      case 'grades':
        return {
          pose: 'pose_student_manager' as const,
          title: 'غرفة المتابعة - سجل الدرجات والنتائج 📚',
          subtitle: `تقارير الأداء والمستوى الأكاديمي • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'cyan' as const
        };
      case 'lens':
      case 'attendance':
        return {
          pose: 'pose_schedule_planner' as const,
          title: parentAttendanceTab === 'lens' ? 'غرفة المتابعة - عين على الصف (اللقطات والبث الصفي) 📸✨' : 'غرفة المتابعة - سجل الحضور والمواظبة ⏱️🌟',
          subtitle: parentAttendanceTab === 'lens' ? `توثيق اللحظات والمشاركات الصفية الحية • الطالب ${cleanStudentName}` : `تتبع الحضور والغياب وتقييم النشاط الصفي المباشر • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'cyan' as const
        };
      case 'uniform':
        return {
          pose: 'pose_school_uniform' as const,
          title: 'غرفة المتابعة - الزي المدرسي والمظهر 👔',
          subtitle: `تقارير الالتزام بالتعليمات والزي الرسمي • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      case 'transport':
        return {
          pose: 'pose_transport_manager' as const,
          title: 'غرفة المتابعة - تتبع خطوط النقل والحافلة 🚌',
          subtitle: `تتبع حي ومباشر لمسار وموقع الحافلة • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      case 'meeting':
        return {
          pose: 'pose_customer_support' as const,
          title: 'غرفة المتابعة - التواصل والدعم الإداري 💬',
          subtitle: `قناة التواصل المباشر مع إدارة الأكاديمية • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'cyan' as const
        };
      case 'finance':
        return {
          pose: 'pose_finance_officer' as const,
          title: 'غرفة المتابعة - المحفظة المالية والأقساط 💳',
          subtitle: `متابعة الدفعات والوصولات الرسمية للأقساط • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      case 'conduct':
        return {
          pose: 'pose_discipline_shield' as const,
          title: 'غرفة المتابعة - تقارير السلوك والانضباط 🛡️',
          subtitle: `ملاحظات تقييم السلوك والتفاعل الأخلاقي • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      case 'excellence':
        return {
          pose: 'excellence_tab_bairaq' as const,
          title: 'غرفة المتابعة - ركن التميز وقاعة الأبطال 🏆',
          subtitle: `لوحة إنجازات وأوسمة التفوق المستحق • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      case 'future':
        return {
          pose: 'pose_idea_genius' as const,
          title: 'غرفة المتابعة - محاكي المعدل والمسار المستقبلي 🎓',
          subtitle: `استكشاف الكليات والقبول الجامعي • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'cyan' as const
        };
      case 'ideas':
        return {
          pose: 'pose_idea_creator' as const,
          title: 'غرفة المتابعة - مائدة الأفكار والمقترحات 💡',
          subtitle: `تبادل وتدوين الأفكار الذكية مع الإدارة • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
      default:
        return {
          pose: 'pose_parent_dashboard' as const,
          title: 'غرفة المتابعة الشاملة لولي الأمر 🏛️',
          subtitle: `بوابة المتابعة والتواصل الفوري • الطالب ${cleanStudentName}`,
          school: activeSchool,
          glowColor: 'gold' as const
        };
    }
  };

  const renderSubPage = () => {
    if (!activeSubPage) return null;

    const allItems = sections.flatMap(s => s.items);
    const currentItem = allItems.find(i => i.id === activeSubPage);
    const headerDetails = getSubpageHeaderDetails(activeSubPage);

    return (
      <motion.div 
        key={`subpage-${activeSubPage}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="fixed inset-0 bg-[#050A18] z-[130] flex flex-col"
      >
        <header className="shrink-0 bg-[#050A18] pt-0 pb-1 px-0 relative border-b border-white/10 z-10">
          <div className="shrink-0 relative w-full overflow-hidden bg-gradient-to-r from-[#0a1536] via-[#0D47A1] to-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] min-h-[145px] sm:min-h-[150px] flex items-end pb-3 px-3.5 sm:px-6">
            {/* Background Bairaq Mascot Backdrop with full brightness */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <BerqCharacter
                pose={headerDetails.pose}
                glowColor={headerDetails.glowColor}
                className="w-full h-full object-cover relative z-10 scale-105 opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050A18]/95 via-[#050A18]/30 to-transparent pointer-events-none z-10" />
            </div>

            {/* Header Content positioned at bottom right */}
            <div className="relative z-10 flex-1 flex flex-col justify-end text-right min-w-0 pr-1 pl-12 select-none pb-0.5">
              <h2 className="text-white text-xs sm:text-sm md:text-base font-black leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] break-words">
                {headerDetails.title}
              </h2>
              <div className="flex items-center gap-1 text-[#FFD600] font-bold text-[10px] sm:text-xs md:text-sm tracking-wide drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] mt-0.5 min-w-0 break-words">
                <span className="shrink-0 text-xs">🏛️</span>
                <span className="break-words">{headerDetails.school}</span>
              </div>
              <div className="flex items-center gap-1 text-white/90 font-semibold text-[9.5px] sm:text-xs tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-0.5 min-w-0 break-words">
                <span className="shrink-0 text-[10px]">⚡</span>
                <span className="break-words">{headerDetails.subtitle}</span>
              </div>
            </div>

            {/* Return / Close Button */}
            <button
              onClick={() => setActiveSubPage(null)}
              className="absolute top-18 left-3 sm:top-8 sm:left-5 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-black active:scale-95 transition-all flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/60 shadow-2xl backdrop-blur-lg cursor-pointer"
              title="عودة"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto w-full no-scrollbar ${activeSubPage === 'homework' || activeSubPage === 'announcements' ? 'p-0' : ['future', 'ideas'].includes(activeSubPage || '') ? 'py-6 px-0 md:px-0' : 'px-6 py-10'}`}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="m-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-bold"
            >
              <AlertTriangle size={14} />
              <span>{error}</span>
            </motion.div>
          )}
          {activeSubPage === "announcements" ? (
            <div className="w-full flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-2 pb-16 px-0">
              <AnnouncementsCenterTab
                schoolId={schoolId || studentData?.schoolId || 'school1'}
                grade={studentData?.grade || grade || 'عام'}
                section={studentData?.section || studentData?.studentSection || extractSectionLetter(studentData?.grade) || extractSectionLetter(studentData?.class) || extractSectionLetter(studentData?.className) || extractSectionLetter(grade) || ""}
                isTeacher={false}
                isParent={true}
                notifications={generalNotifications}
                hideHeader={true}
                fullWidth={true}
              />
            </div>
          ) : activeSubPage === "homework" ? (
            <div className="w-full flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-2 pb-16">
              {/* Edge-to-Edge Sticky Horizontal Subject Bar */}
              <div className="sticky top-0 z-20 bg-[#070D1E]/95 backdrop-blur-xl border-b border-white/10 px-3 sm:px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
                  {/* All Subjects Pill */}
                  {(() => {
                    const activeStudentGrade = studentData?.grade || '';
                    const totalUnviewedAll = parentHomeworks.filter(r => {
                      const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
                      const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
                      return r.tool === 'صناعة واجبات' && matchesGrade && !viewedHwIds.has(r.id);
                    }).length;
                    const isSelected = hwSubject === 'الكل';

                    return (
                      <button
                        key="all-subjects-btn"
                        type="button"
                        onClick={() => setHwSubject('الكل')}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 select-none cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/25 ring-1 ring-amber-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                        }`}
                      >
                        <span>جميع المواد</span>
                        {totalUnviewedAll > 0 && (
                          <span className={`px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black flex items-center justify-center leading-none ${
                            isSelected ? 'bg-black text-amber-400' : 'bg-rose-500 text-white shadow-md shadow-rose-500/50 animate-pulse'
                          }`}>
                            {totalUnviewedAll}
                          </span>
                        )}
                      </button>
                    );
                  })()}

                  {/* Student Subjects Pills */}
                  {getSubjectsForGrade(studentData?.grade || '', studentData?.removedSubjects || [], subjectMapping).map((sub: any) => {
                    const isSelected = hwSubject === sub.name;
                    const activeStudentGrade = studentData?.grade || '';
                    const subjectUnviewedCount = parentHomeworks.filter(r => {
                      const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
                      const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
                      const rNameStr = String(r.name || "");
                      const rContentStr = String(r.content || "");
                      return r.tool === 'صناعة واجبات' && 
                        matchesGrade && 
                        (isSubjectMatch(r.subject, sub.name) || rNameStr.includes(sub.name) || rContentStr.includes(sub.name)) && 
                        !viewedHwIds.has(r.id);
                    }).length;

                    return (
                      <button
                        key={sub.id || sub.name}
                        type="button"
                        onClick={() => setHwSubject(sub.name)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-lg shadow-amber-500/25 ring-1 ring-amber-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/5'
                        }`}
                      >
                        <span>{sub.name}</span>
                        {subjectUnviewedCount > 0 && (
                          <span className={`px-1.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black flex items-center justify-center leading-none ${
                            isSelected ? 'bg-black text-amber-400' : 'bg-rose-500 text-white shadow-md shadow-rose-500/50 animate-pulse'
                          }`}>
                            {subjectUnviewedCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar */}
              <div className="px-4 sm:px-6 pt-4 pb-2">
                <div className="relative w-full">
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  <input
                    type="text"
                    value={hwSearch}
                    onChange={(e) => setHwSearch(e.target.value)}
                    placeholder={`ابحث في واجبات ${hwSubject === 'الكل' ? 'كافة المواد' : hwSubject}...`}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pr-10 pl-9 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
                  />
                  {hwSearch && (
                    <button 
                      onClick={() => setHwSearch('')} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs p-1"
                      title="مسح البحث"
                    >
                      <XCircle size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Homework Cards Grid */}
              <div className="px-4 sm:px-6 pt-2">
                {(() => {
                  const activeStudentGrade = studentData?.grade || '';
                  const homeworks = parentHomeworks.filter(r => {
                    const rSections = Array.isArray(r.targetSections) ? r.targetSections : (r.section ? [r.section] : undefined);
                    const matchesGrade = isGradeMatch(r.targetGrade, activeStudentGrade, rSections);
                    const rNameStr = String(r.name || "");
                    const rContentStr = String(r.content || "");
                    return r.tool === 'صناعة واجبات' && 
                      matchesGrade &&
                      (isSubjectMatch(r.subject, hwSubject) || rNameStr.includes(hwSubject) || rContentStr.includes(hwSubject)) && 
                      (hwSearch.trim() === "" || rNameStr.includes(hwSearch) || rContentStr.includes(hwSearch));
                  });

                  return homeworks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-white/10 rounded-3xl space-y-4 my-4 bg-white/[0.01]">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400 border border-amber-500/20 shadow-inner">
                        <Edit2 size={28} />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-white font-black text-base">لا توجد واجبات منشورة في هذه المادة حالياً</p>
                        <p className="text-amber-300/70 text-xs max-w-sm mx-auto">بيرق خبير الواجبات أتم المراجعة، ترقب الواجبات والأنشطة القادمة من المعلمين.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {homeworks.map((hw, idx) => {
                        const submission = parentSubmissions.find(sub => sub.taskId === hw.id && sub.type === 'homework');
                        const isUnviewed = !viewedHwIds.has(hw.id);
                        
                        // Extract image URL if exists in markdown or props
                        const imgMatch = hw.imageUrl || hw.fileUrl || (hw.content ? hw.content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/)?.[1] : null);

                        return (
                          <div 
                            key={`parent_hw_${hw.id || idx}`} 
                            onClick={() => {
                              markHwAsViewed(hw.id);
                              setViewingHwModal({ hw, submission });
                            }}
                            className="bg-[#0A1026]/90 border border-white/10 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group cursor-pointer shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 relative overflow-hidden"
                          >
                            {isUnviewed && (
                              <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none z-10">
                                <span className="absolute top-3 -right-6 bg-rose-500 text-white text-[9px] font-black py-0.5 w-24 text-center rotate-45 shadow-sm">
                                  جديد
                                </span>
                              </div>
                            )}

                            <div>
                              <div className="flex items-start gap-3 mb-3">
                                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/25 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                                  {imgMatch ? <ImageIcon size={20} className="text-amber-300" /> : <Edit2 size={20} />}
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">{hw.name || "واجب دراسي"}</h4>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] text-white/40">{new Date(hw.date || Date.now()).toLocaleDateString('ar-SA')}</span>
                                    {hw.subject && hw.subject !== "عام" && (
                                      <span className="text-[9px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-md font-bold border border-amber-500/20">
                                        {hw.subject}
                                      </span>
                                    )}
                                    {imgMatch && (
                                      <span className="text-[9px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-md font-bold border border-purple-500/20 flex items-center gap-1">
                                        <ImageIcon size={10} />
                                        واجب مصور
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Thumbnail preview if image exists */}
                              {imgMatch ? (
                                <div className="mb-3 rounded-xl overflow-hidden bg-black/40 border border-white/5 h-32 relative group/img">
                                  <img 
                                    src={imgMatch} 
                                    alt="معاينة الواجب" 
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                                    <span className="text-[10px] text-white/80 font-bold flex items-center gap-1">
                                      <ZoomIn size={12} /> اضغط لتكبير الصورة وقراءة التفاصيل
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-white/70 line-clamp-3 leading-relaxed whitespace-pre-wrap mb-3 bg-black/30 p-3 rounded-xl border border-white/5 font-medium">
                                  {hw.content?.replace(/!\[.*?\]\(.*?\)/g, '')?.trim() || hw.content}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                              <div className="flex items-center gap-1.5">
                                {submission ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 size={12} />
                                    تم التسليم {submission.score !== undefined ? `(${submission.score} د)` : ''}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                    <Clock size={12} />
                                    بانتظار الحل
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markHwAsViewed(hw.id);
                                  setViewingHwModal({ hw, submission });
                                }}
                                className="px-3.5 py-1.5 bg-white/10 hover:bg-amber-500 hover:text-black text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1"
                              >
                                <span>عرض الواجب</span>
                                <ChevronLeft size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Homework Details Modal */}
              <AnimatePresence>
                {viewingHwModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                    onClick={() => setViewingHwModal(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#0C132B] border border-amber-500/30 rounded-3xl p-5 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-4 custom-scrollbar"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                          <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                          <span className="text-white font-black text-sm sm:text-base truncate">{viewingHwModal.hw.name || "تفاصيل الواجب"}</span>
                        </div>
                        <button
                          onClick={() => setViewingHwModal(null)}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-amber-500/15 text-amber-300 px-3 py-1 rounded-full border border-amber-500/25 font-black">
                            المادة: {viewingHwModal.hw.subject || 'عام'}
                          </span>
                          <span className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            تاريخ النشر: {new Date(viewingHwModal.hw.date || Date.now()).toLocaleDateString('ar-SA')}
                          </span>
                          {viewingHwModal.hw.teacherName && (
                            <span className="text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 font-bold">
                              الأستاذ: {viewingHwModal.hw.teacherName}
                            </span>
                          )}
                        </div>

                        {/* If homework has direct image, display it nicely */}
                        {(() => {
                          const directImg = viewingHwModal.hw.imageUrl || viewingHwModal.hw.fileUrl;
                          if (!directImg) return null;
                          return (
                            <div className="space-y-2">
                              <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                                <ImageIcon size={14} /> صورة الواجب والتمارين:
                              </h5>
                              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-xl relative group">
                                <img 
                                  src={directImg} 
                                  alt="صورة الواجب" 
                                  className="w-full max-h-[500px] object-contain mx-auto"
                                />
                                <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs">
                                  <span className="text-white/60">انقر لفتح الصورة بالحجم الكامل</span>
                                  <a 
                                    href={directImg} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-3 py-1 bg-white/10 hover:bg-amber-500 hover:text-black text-white font-bold rounded-lg transition-all flex items-center gap-1 text-xs"
                                  >
                                    <ExternalLink size={13} /> فتح الصورة
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Only show text block if there is actual meaningful text */}
                        {(() => {
                          const rawContent = viewingHwModal.hw.content || '';
                          const textWithoutImages = rawContent.replace(/!\[.*?\]\(.*?\)/g, '').trim();
                          if (!textWithoutImages) return null;
                          return (
                            <div className="space-y-2">
                              <h5 className="text-xs font-black text-white/60">نص الواجب والمطلوب:</h5>
                              <div className="p-4 bg-black/40 rounded-2xl border border-white/10 text-white text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                <ReactMarkdown
                                  components={{
                                    img: ({node, src, alt, ...props}: any) => (
                                      <span className="block my-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-xl max-w-full">
                                        <img 
                                          src={src} 
                                          alt={alt || "صورة الواجب"} 
                                          className="w-full max-h-[450px] object-contain rounded-xl block" 
                                          {...props} 
                                        />
                                        {alt && <span className="block p-2 text-center text-xs text-white/50 font-bold bg-black/20 border-t border-white/5">{alt}</span>}
                                      </span>
                                    )
                                  }}
                                >
                                  {textWithoutImages}
                                </ReactMarkdown>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="space-y-3 pt-2 border-t border-white/10">
                          <h5 className="text-xs font-black text-amber-400">حالة تسليم الطالب (متابعة ولي الأمر):</h5>
                          {viewingHwModal.submission ? (
                            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                                  <CheckCircle2 size={16} />
                                  تم حل وتسليم الواجب {viewingHwModal.submission.submittedBy === 'parent' ? 'بواسطة ولي الأمر' : 'بواسطة الطالب'}
                                </span>
                                {viewingHwModal.submission.score !== undefined && (
                                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-200 rounded-lg text-xs font-black">
                                    الدرجة: {viewingHwModal.submission.score} / 100
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-white/50 font-bold">إجابة / حل الطالب:</span>
                                <div className="p-3 bg-black/30 rounded-xl text-white text-xs whitespace-pre-wrap border border-white/5">
                                  <ReactMarkdown
                                    components={{
                                      img: ({node, src, alt, ...props}: any) => (
                                        <span className="block my-2 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow max-w-full">
                                          <img 
                                            src={src} 
                                            alt={alt || "صورة الحل"} 
                                            className="w-full max-h-[350px] object-contain rounded-lg block" 
                                            {...props} 
                                          />
                                        </span>
                                      )
                                    }}
                                  >
                                    {viewingHwModal.submission.content || viewingHwModal.submission.answer || 'لا توجد تفاصيل نصية للإجابة'}
                                  </ReactMarkdown>
                                </div>
                              </div>
                              {viewingHwModal.submission.aiFeedback && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-cyan-300 font-bold">تقييم المساعد الذكي / المعلم:</span>
                                  <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-200 text-xs whitespace-pre-wrap border border-cyan-500/20">
                                    {viewingHwModal.submission.aiFeedback}
                                  </div>
                                </div>
                              )}
                              {viewingHwModal.submission.feedback && (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-amber-300 font-bold">ملاحظات وتقييم الأستاذ:</span>
                                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-200 text-xs whitespace-pre-wrap border border-amber-500/20">
                                    {viewingHwModal.submission.feedback}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                                <Clock size={16} />
                                <span>لم يقم الطالب بتسليم هذا الواجب حتى الآن. يمكنك رفع الحل نيابة عن الطالب أدناه:</span>
                              </div>

                              {/* Form to submit answer / solution */}
                              <div className="bg-[#101935] p-4 rounded-2xl border border-amber-500/30 space-y-3">
                                <h6 className="text-xs font-black text-white flex items-center gap-2">
                                  <Upload size={14} className="text-amber-400" />
                                  <span>رفع وإرسال حل الواجب للأستاذ:</span>
                                </h6>
                                
                                <textarea
                                  value={solutionText}
                                  onChange={(e) => setSolutionText(e.target.value)}
                                  placeholder="اكتب إجابة أو حل الواجب أو أي ملاحظات توضيحية للأستاذ هنا..."
                                  className="w-full h-24 bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-xl p-3 text-xs sm:text-sm text-white outline-none resize-none placeholder:text-white/30 transition-all font-medium"
                                  dir="rtl"
                                />

                                {/* Image previews if uploaded */}
                                {solutionImagePreviews.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold text-white/60">صور الحل المرفقة ({solutionImagePreviews.length}/5):</span>
                                    <div className="flex flex-wrap gap-2">
                                      {solutionImagePreviews.map((preview, idx) => (
                                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-amber-500/40 group">
                                          <img src={preview} alt={`preview_${idx}`} className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSolutionImage(idx)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-md transition-all"
                                            title="حذف الصورة"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {solutionSubmitError && (
                                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    <span>{solutionSubmitError}</span>
                                  </div>
                                )}

                                {solutionSubmitSuccess && (
                                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                                    <CheckCircle size={14} />
                                    <span>تم رفع وإرسال الحل بنجاح إلى الأستاذ!</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                                  <input 
                                    type="file" 
                                    ref={solutionFileInputRef} 
                                    accept="image/*" 
                                    multiple 
                                    className="hidden" 
                                    onChange={handleSolutionImageSelect}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => solutionFileInputRef.current?.click()}
                                    disabled={isSubmittingSolution || solutionImages.length >= 5}
                                    className="px-3.5 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <ImageIcon size={14} />
                                    <span>إرفاق صور الحل / الدفتر</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleParentSubmitSolution(viewingHwModal.hw)}
                                    disabled={isSubmittingSolution || (!solutionText.trim() && solutionImages.length === 0)}
                                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-black font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                                  >
                                    {isSubmittingSolution ? (
                                      <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>جاري إرسال الحل...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Send size={14} />
                                        <span>إرسال الحل للأستاذ</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : activeSubPage === "grades" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                 <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">المستوى الدراسي الحالي</span>
                    <span className="text-white font-black text-base">{studentData?.grade || 'غير محدد'}</span>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Target size={20} />
                 </div>
              </div>

              {/* Period Selector */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {gradePeriods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedGradePeriod(p.id)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
                      selectedGradePeriod === p.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-white/5 text-white/30 border border-white/5'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {(() => {
                  const subjects = getSubjectsForGrade(studentData?.grade || '', [], subjectMapping);
                  const grades = studentData?.grades?.[selectedGradePeriod] || {};
                  
                  if (Object.keys(grades).length === 0) {
                    return (
                      <div className="text-center py-16 px-6 border-2 border-dashed border-white/5 rounded-[2.5rem] space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                          <BarChart3 size={32} className="text-white/10" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-white font-bold text-sm">لا يوجد نتائج مرصودة</p>
                          <p className="text-white/20 text-[10px]">لم يتم رفع درجات {gradePeriods.find(p => p.id === selectedGradePeriod)?.name} حتى الآن</p>
                        </div>
                      </div>
                    );
                  }

                  return subjects.map((sub, idx) => {
                    const grade = grades[sub.id] || 0;
                    const isExcellent = grade >= 90;
                    const isGood = grade >= 70 && grade < 90;
                    const isFailed = grade < 50;

                    return (
                      <motion.div
                        key={`${sub.id}_${idx}_grade`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-[#101935] p-5 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-blue-500/30 transition-all"
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

              {studentData?.grades?.[selectedGradePeriod] && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/10"
                >
                  <p className="text-white/70 text-sm font-bold flex flex-col items-center justify-center gap-2 text-center">
                    <span className="flex items-center gap-2">
                      تحليل المستوى: {gender === 'female' ? 'طالبتكِ' : 'طالبُكَ'} تبلي بلاءً حسناً في هذا الفصل.
                    </span>
                  </p>
                </motion.div>
              )}
            </div>
          ) : activeSubPage === "finance" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-12">
              {/* Financial Summary */}
              {(() => {
                const fin = calculateStudentFinancials(studentData, tuitionFee, discountRates);
                return (
                  <div className="bg-[#101935] rounded-[32px] p-8 border border-white/5 space-y-6 shadow-2xl relative overflow-hidden group">
                     {/* Decorative background element */}
                     <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
                     
                    <div className="flex items-center justify-between relative z-10">
                      <div className="space-y-1">
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">المحفظة المالية</p>
                        <h3 className="text-white font-black text-xl">نظام الأقساط الذكي</h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 relative z-10">
                      <div className="bg-black/20 p-4 rounded-2xl text-center border border-white/5 flex-1">
                        <p className="text-[9px] text-white/40 font-bold mb-1 uppercase">بالكامل</p>
                        <p className="text-xs font-black tabular-nums text-white">{fin.requiredAmount.toLocaleString()} <span className="text-[7px] opacity-40">د.ع</span></p>
                      </div>
                      <div className="bg-emerald-500/10 p-4 rounded-2xl text-center border border-emerald-500/10 flex-1">
                        <p className="text-[9px] text-emerald-400/60 font-bold mb-1 uppercase">الواصل</p>
                        <p className="text-xs font-black tabular-nums text-emerald-400">{fin.paidAmount.toLocaleString()} <span className="text-[7px] opacity-40">د.ع</span></p>
                      </div>
                      <div className="bg-rose-500/10 p-4 rounded-2xl text-center border border-rose-500/10 flex-1">
                        <p className="text-[9px] text-rose-400/60 font-bold mb-1 uppercase">المتبقي</p>
                        <p className="text-xs font-black tabular-nums text-rose-400">{fin.remainingAmount.toLocaleString()} <span className="text-[7px] opacity-40">د.ع</span></p>
                      </div>
                    </div>

                    {fin.discountRate > 0 && (
                      <div className="flex items-center gap-3 px-5 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Star size={16} className="text-blue-400 shrink-0" />
                        <p className="text-[11px] text-blue-200 font-bold leading-relaxed">
                          تم تطبيق خصم بقيمة {fin.discountAmount.toLocaleString()} د.ع ({fin.discountRate}%) على القسط الإجمالي.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}



               {/* Finance Tabs */}
               <div className="flex bg-[#101935] p-1.5 rounded-2xl mb-6 items-center border border-white/5">
                 <button 
                   onClick={() => setActiveFinanceTab('installments')}
                   className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${activeFinanceTab === 'installments' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/30 hover:text-white'}`}
                 >
                   الأقساط
                 </button>
                 <button 
                   onClick={() => setActiveFinanceTab('logs')}
                   className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${activeFinanceTab === 'logs' ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'text-white/30 hover:text-white'}`}
                 >
                   سجل الوصولات
                 </button>
               </div>

               {/* Installment Schedule */}
               {activeFinanceTab === 'installments' && (
                 <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-white font-black text-sm flex items-center gap-2">
                        <CalendarClock size={18} className="text-amber-400" />
                        مواعيد الأقساط القادمة
                      </h4>
                    </div>
                
                    <div className="space-y-3">
                      {(() => {
                        const studentInstallments = studentData?.finance?.installments || [];
                        const hasStudentInstallments = Array.isArray(studentInstallments) && studentInstallments.length > 0;
                        
                        // Use the refined student financial calculation to get the target total
                        const fin = calculateStudentFinancials(studentData, tuitionFee, discountRates);
                        const targetTotal = fin.requiredAmount; // This is the final net amount expected from student
                        const discountFactor = fin.discountFactor || ((100 - (fin.discountRate || 0)) / 100);

                        let displayInstallments = studentInstallments;
                        
                        const hasPayments = studentInstallments.some((inst: any) => inst.paid === true || ['completed', 'verified', 'verified_payment', 'مكتمل'].includes((inst.status || '').toLowerCase()));
                        const templateLength = schoolConfigs?.installmentPlan?.length || 0;

                        // Fallback to school template OR hardcoded default if missing/mismatched (if no payments yet)
                        // This ensures that if admin changes 4 to 6 installments, parent sees 6 immediately.
                        if (!hasStudentInstallments || (!hasPayments && templateLength > 0 && studentInstallments.length !== templateLength)) {
                          let template = schoolConfigs?.installmentPlan || [];
                          
                          // Fallback for missing template
                          if (template.length === 0 && (schoolId === 'school1' || schoolId === 'school_awail_ghamas' || schoolId === 'ghamas_awail')) {
                             template = [
                               { id: 'def_1', name: 'القسط الأول', amount: 200000, date: '2025-10-01' },
                               { id: 'def_2', name: 'القسط الثاني', amount: 150000, date: '2026-01-01' },
                               { id: 'def_3', name: 'القسط الثالث', amount: 100000, date: '2026-03-01' },
                               { id: 'def_4', name: 'القسط الرابع', amount: 100000, date: '2026-05-01' },
                             ];
                          }

                          if (template.length > 0) {
                            const templateSum = template.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
                            // Factor to scale each template installment to match student's specific total (including their discounts)
                            const scaleFactor = templateSum > 0 ? (targetTotal / templateSum) : 1;
                            
                            displayInstallments = template.map((inst: any, idx: number) => ({
                              ...inst,
                              id: inst.id || `template_${idx}`,
                              amount: Math.round((Number(inst.amount) || 0) * scaleFactor),
                              paid: false,
                              status: 'pending'
                            }));
                          }
                        } else {
                          // Student already has installments in DB.
                          // Ensure each installment's amount accurately reflects student's discount
                          const rawSum = displayInstallments.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
                          
                          if (rawSum > 0 && (fin.discountRate > 0 || Math.abs(rawSum - targetTotal) > 10)) {
                            if (!hasPayments) {
                              // If no payments yet, scale all installments to sum to targetTotal exactly
                              const scaleFactor = targetTotal / rawSum;
                              displayInstallments = displayInstallments.map((inst: any) => ({
                                ...inst,
                                amount: Math.round((Number(inst.amount) || 0) * scaleFactor)
                              }));
                            } else {
                              // If some are paid, ensure unpaid installments reflect the discount
                              displayInstallments = displayInstallments.map((inst: any) => {
                                const isPaid = inst.paid === true || ['completed', 'verified', 'verified_payment', 'مكتمل'].includes((inst.status || '').toLowerCase());
                                if (isPaid) return inst;
                                return {
                                  ...inst,
                                  amount: fin.isInstallmentsAtGross ? Math.round((Number(inst.amount) || 0) * discountFactor) : Number(inst.amount)
                                };
                              });
                            }
                          }
                        }

                        if (displayInstallments && displayInstallments.length > 0) {
                          return displayInstallments.map((inst: any, idx: number) => {
                            const installmentId = inst.id || idx.toString();
                            const isPaid = inst.paid === true || ['completed', 'verified', 'verified_payment', 'مكتمل'].includes((inst.status || '').toLowerCase());
                            const isPartial = !isPaid && (inst.status === 'جزئي' || (Number(inst.paidAmount || 0) > 0 && Number(inst.paidAmount || 0) < Number(inst.amount)));
                            
                            // Check active requests collection
                            const activeRequest = pendingRequests.find((r: any) => r.installmentId === installmentId);
                            const isPending = !isPaid && activeRequest?.status === 'pending';
                            const isRejected = !isPaid && activeRequest?.status === 'rejected';
                            
                            let statusText = isPaid ? 'مكتمل' : (isPending ? 'قيد المراجعة' : (isRejected ? 'مرفوض' : (isPartial ? 'إكمال القسط' : 'تسديد')));
                            let statusBg = isPaid ? 'bg-emerald-500/10 text-emerald-400' : 
                                         isPending ? 'bg-amber-500/20 text-amber-400' : 
                                         isRejected ? 'bg-rose-500/20 text-rose-400' : 
                                         isPartial ? 'bg-sky-400 text-black font-black shadow-md shadow-sky-400/25' :
                                         'bg-amber-400 text-black font-extrabold';
                            
                            return (
                              <div key={`installment_${installmentId}_${idx}`} className="flex flex-col gap-2">
                                <div className="bg-[#101935] p-5 rounded-[24px] border border-white/5 flex items-center justify-between group hover:border-blue-500/20 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="relative">
                                        <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-emerald-500' : (isPending ? 'bg-amber-500' : (isRejected ? 'bg-rose-500' : (isPartial ? 'bg-sky-400' : 'bg-white/20')))}`} />
                                        {isRejected && activeRequest?.viewedByParent === false && (
                                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                        )}
                                     </div>
                                     <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <p className="text-white font-black text-sm tabular-nums">{Number(inst.amount).toLocaleString()} <span className="text-[10px] opacity-40">د.ع</span></p>
                                          {isPartial && (
                                            <span className="text-[9px] text-sky-300 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                              مدفوع منه: {Number(inst.paidAmount).toLocaleString()} د.ع
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-white/30 text-[10px] font-bold">{inst.name || 'قسط مدرسي'} • {inst.date}</p>
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                     {isRejected && (
                                       <button 
                                         onClick={() => {
                                           setSelectedInstallmentId(installmentId);
                                           setShowPaymentView(true);
                                         }}
                                         className="px-3 py-2 rounded-xl bg-amber-400 text-black text-[10px] font-black shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
                                       >
                                         إعادة تسديد
                                       </button>
                                     )}
                                     {isPaid ? (() => {
                                        let matchingTxn = uniqueTransactions.find((t: any) => 
                                           t.status === 'completed' && 
                                           (t.note?.replace('وصل رقمي - ', '')?.replace('وصل رقمي', '')?.trim() === inst.name?.trim() || t.installmentId === installmentId)
                                        );
                                        return (
                                          <div className="flex items-center gap-2">
                                            {matchingTxn && (
                                              <button
                                                onClick={() => {
                                                  let dateVal = matchingTxn.date || matchingTxn.timestamp;
                                                  if (dateVal && typeof dateVal === 'object') {
                                                      if (dateVal.toDate) dateVal = dateVal.toDate();
                                                      else if (dateVal.seconds) dateVal = new Date(dateVal.seconds * 1000);
                                                  }
                                                  setSelectedReceipt({
                                                    adminName: matchingTxn.adminName || 'مدير النظام',
                                                    studentName: studentData.name,
                                                    studentId: studentCode,
                                                    amount: Number(matchingTxn.amount),
                                                    time: new Date(dateVal || 0),
                                                    schoolName: studentData?.schoolName,
                                                    schoolId: studentData?.schoolId,
                                                    installmentName: matchingTxn.note?.replace('وصل رقمي - ', ''),
                                                    isStamped: matchingTxn.isStamped,
                                                    stampTime: matchingTxn.stampTime,
                                                    method: matchingTxn.method || (matchingTxn.note?.includes('إلكتروني') || matchingTxn.note?.includes('AsiaPay') ? 'إلكتروني' : 'نقدي/مدير') || (matchingTxn.note?.includes('إلكتروني') || matchingTxn.note?.includes('AsiaPay') ? 'إلكتروني' : 'نقدي/مدير')
                                                  });
                                                }}
                                                className="px-3 py-2 rounded-xl text-[10px] font-black transition-all bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20"
                                              >
                                                عرض الوصل
                                              </button>
                                            )}
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${statusBg}`}>
                                              {statusText}
                                            </span>
                                          </div>
                                        );
                                     })() : (
                                       <button 
                                         disabled={isPending}
                                         onClick={() => {
                                           if (!isPending) {
                                             setSelectedInstallmentId(installmentId);
                                             setShowPaymentView(true);
                                           }
                                         }}
                                         className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${statusBg} ${isRejected ? 'cursor-pointer hover:bg-rose-500 hover:text-white' : ''}`}
                                       >
                                         {statusText}
                                       </button>
                                     )}
                                  </div>
                                </div>
                                
                                {isRejected && activeRequest.rejectReason && (
                                  <div className="mx-4 space-y-2">
                                     <motion.div 
                                       initial={{ opacity: 0, height: 0 }}
                                       animate={{ opacity: 1, height: 'auto' }}
                                       className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex flex-col gap-1 shadow-lg"
                                     >
                                       <div className="flex items-center gap-2 text-rose-400">
                                         <AlertTriangle size={12} />
                                         <span className="text-[10px] font-black">ملاحظة الإدارة:</span>
                                       </div>
                                       <p className="text-white/70 text-[10px] font-medium pr-5 leading-relaxed">
                                         {activeRequest.rejectReason}
                                       </p>
                                     </motion.div>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        } else {
                          return (
                            <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center space-y-3">
                              <CalendarClock size={40} className="mx-auto text-white/10" />
                              <p className="text-white/20 font-bold text-xs italic">لا يوجد جدول أقساط محدد للطالب</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                 </div>
               )}

               {/* Transactions List */}
               {activeFinanceTab === 'logs' && (
                 <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center justify-between px-2 pt-2">
                       <h4 className="text-white font-black text-sm flex items-center gap-2">
                         <Receipt size={18} className="text-blue-400" />
                         سجل الوصولات المالية
                       </h4>
                       <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                         <ShieldCheck size={12} />
                         <span>عمليات موثقة</span>
                       </div>
                    </div>

                    {uniqueTransactions.length > 0 ? (
                      uniqueTransactions.map((txn: any, idx: number) => (
                        <div key={`txn_${txn.id || idx}_${idx}`} className="bg-[#101935] p-5 rounded-[24px] border border-white/5 flex flex-col gap-3 group hover:border-emerald-500/20 transition-all">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                  txn.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                  txn.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {txn.status === 'completed' ? <CheckCircle2 size={16} /> : 
                                   txn.status === 'pending' ? <Timer size={16} /> : <AlertTriangle size={16} />}
                                </div>
                                <div>
                                   <span className="block text-white font-black text-sm tracking-tight text-right">{txn.note?.replace('وصل رقمي - ', '') || 'وصل مالي'}</span>
                                   <span className="text-white/30 text-[9px] font-bold text-right">
                                     {(() => {
                                        const d = new Date(txn.date || txn.timestamp || 0);
                                        return !isNaN(d.getTime()) ? `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}` : 'غير متاح';
                                     })()} - {txn.method}
                                   </span>
                                </div>
                             </div>
                             <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                                txn.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                txn.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-400'
                             }`}>
                                {txn.status === 'completed' ? 'مقبول' : txn.status === 'pending' ? 'مراجعة' : 'مرفوض'}
                             </div>
                          </div>
                          {txn.status === 'rejected' && (
                            <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 flex items-center gap-3">
                               <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                               <p className="text-rose-400 text-[9px] font-bold leading-relaxed">{txn.rejectReason || 'يرجى التأكد من صورة الوصل وإعادة المحاولة'}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                             <span className="text-[10px] text-white/40 font-bold">{Number(txn.amount).toLocaleString()} د.ع</span>
                             <button 
                               onClick={() => {
                                  let dateVal = txn.date || txn.timestamp;
                                  if (dateVal && typeof dateVal === 'object') {
                                      if (dateVal.toDate) dateVal = dateVal.toDate();
                                      else if (dateVal.seconds) dateVal = new Date(dateVal.seconds * 1000);
                                  }
                                  setSelectedReceipt({
                                  adminName: txn.adminName || 'مدير النظام',
                                  studentName: studentData.name,
                                  studentId: studentCode,
                                  amount: Number(txn.amount),
                                  time: new Date(dateVal || 0),
                                  schoolName: studentData?.schoolName,
                                  schoolId: studentData?.schoolId,
                                  installmentName: txn.note?.replace('وصل رقمي - ', ''),
                                  isStamped: txn.isStamped,
                                  stampTime: txn.stampTime,
                                  method: txn.method || (txn.note?.includes('إلكتروني') || txn.note?.includes('AsiaPay') ? 'إلكتروني' : 'نقدي/مدير')
                               });
                               }}
                               className="text-[10px] bg-blue-500/20 px-3 py-1.5 rounded-lg text-blue-400 font-black cursor-pointer hover:bg-blue-500 hover:text-white transition-all shadow-lg relative z-50"
                             >
                               عرض الوصل
                             </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center space-y-3">
                        <Wallet size={40} className="mx-auto text-white/10" />
                        <p className="text-white/20 font-bold text-xs italic">لا يوجد سجل دفعات حالي</p>
                      </div>
                    )}
                 </div>
               )}


              {/* Note */}
              <div className="flex gap-4 p-5 rounded-[24px] bg-blue-500/5 border border-blue-500/10 active:scale-[0.98] transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <Lightbulb size={20} />
                </div>
                <div className="space-y-1">
                  <h5 className="text-white font-black text-[11px]">ملاحظة إدارية</h5>
                  <p className="text-white/30 text-[10px] leading-relaxed">
                    يتم مطابقة الوصولات يدوياً من قبل القسم المالي. في حال وجود أي استفسار يرجى مراسلتنا عبر قسم "تواصل مع الإدارة".
                  </p>
                </div>
              </div>
            </div>

          ) : activeSubPage === "attendance" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* 🌟 Top-Level Tab Switcher: [سجل الحضور والمواظبة ⚡] vs [عين على الصف 📸✨] */}
              <div className="flex items-center gap-2 p-1.5 bg-[#0a1124] border border-cyan-500/25 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={() => setParentAttendanceTab('attendance')}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    parentAttendanceTab === 'attendance'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.01]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserCheck size={18} className={parentAttendanceTab === 'attendance' ? 'animate-pulse' : ''} />
                  <span>سجل الحضور والمواظبة ⏱️</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setParentAttendanceTab('lens');
                    setUnreadLensCount(0);
                    try {
                      const storageKey = `bairaq_last_lens_seen_${studentData?.id || studentData?.studentCode || studentCode || ''}`;
                      safeStorage.setItem(storageKey, new Date().toISOString());
                    } catch {}
                    // Mark classroom_lens notifications as read in state & backend
                    const unreadLensNotifs = (parentNotifications || []).filter((n: any) => n.type === 'classroom_lens' && !n.read);
                    unreadLensNotifs.forEach((n: any) => {
                      fetch(`/api/notifications/${n.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ read: true })
                      }).catch(() => {});
                    });
                    setParentNotifications(prev => prev.map(n => n.type === 'classroom_lens' ? { ...n, read: true } : n));
                  }}
                  className={`relative flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    parentAttendanceTab === 'lens'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] scale-[1.01]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Camera size={18} className={parentAttendanceTab === 'lens' ? 'animate-pulse text-cyan-300' : ''} />
                  <span>عين على الصف (اللقطات والبث الصفي) 📸✨</span>
                  {effectiveLensBadge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] animate-bounce shadow-lg">
                      {effectiveLensBadge} جديد
                    </span>
                  )}
                </button>
              </div>

              {parentAttendanceTab === 'lens' ? (
                <div className="space-y-4 text-right" style={{ direction: 'rtl' }}>
                  {/* Internal Tab Switcher: [لقطات الطالب] vs [لقطات الصف] */}
                  <div className="flex items-center gap-1.5 p-1 bg-[#0a1124] border border-blue-500/20 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setLensSubTab('individual');
                        const stId = studentData?.id || studentData?.studentCode || studentCode || '';
                        if (stId) {
                          const now = Date.now();
                          safeStorage.setItem(`bairaq_lens_ind_seen_${stId}`, new Date(now).toISOString());
                          setLastSeenIndividual(now);
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        lensSubTab === 'individual'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <User size={13} />
                      <span>لقطات الطالب 👨‍🎓</span>
                      {unreadIndividualCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                          {unreadIndividualCount} جديد
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLensSubTab('broadcast');
                        const stId = studentData?.id || studentData?.studentCode || studentCode || '';
                        if (stId) {
                          const now = Date.now();
                          safeStorage.setItem(`bairaq_lens_bc_seen_${stId}`, new Date(now).toISOString());
                          setLastSeenBroadcast(now);
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        lensSubTab === 'broadcast'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Users size={13} />
                      <span>المشاركات الجماعية 📢</span>
                      {unreadBroadcastCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                          {unreadBroadcastCount} جديد
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Controls Bar: Date Selector & History Navigation */}
                  <div className="bg-gradient-to-r from-[#0d162d] via-[#101c3d] to-[#0d162d] p-3.5 sm:p-4 rounded-2xl border border-blue-500/25 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Camera size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white">
                          {showAllLensDates ? 'أرشيف كافة اللقطات والمشاركات الصفية' : `لقطات تاريخ: ${parentLensDateFilter}`}
                        </h4>
                        <p className="text-[10.5px] text-white/50">
                          {showAllLensDates ? `إجمالي اللقطات الموثقة: ${displayedLensActivities.length} لقطة` : `عدد اللقطات في هذا اليوم: ${displayedLensActivities.length} لقطة`}
                        </p>
                      </div>
                    </div>

                    {/* Date Navigator Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Date Stepper */}
                      <div className="flex items-center bg-[#070d1e] p-1 rounded-xl border border-white/10 shadow-inner">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAllLensDates(false);
                            const prev = new Date(parentLensDateFilter);
                            prev.setDate(prev.getDate() - 1);
                            setParentLensDateFilter(prev.toISOString().split('T')[0]);
                          }}
                          title="اليوم السابق"
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        >
                          <ChevronRight size={15} />
                        </button>

                        <div className="px-2 flex items-center gap-1.5">
                          <Calendar size={13} className="text-blue-400 shrink-0" />
                          <input
                            type="date"
                            value={parentLensDateFilter}
                            onChange={(e) => {
                              setParentLensDateFilter(e.target.value);
                              setShowAllLensDates(false);
                            }}
                            className="bg-transparent text-xs font-bold text-blue-200 outline-none cursor-pointer [color-scheme:dark]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAllLensDates(false);
                            const next = new Date(parentLensDateFilter);
                            next.setDate(next.getDate() + 1);
                            setParentLensDateFilter(next.toISOString().split('T')[0]);
                          }}
                          title="اليوم التالي"
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        >
                          <ChevronLeft size={15} />
                        </button>
                      </div>

                      {/* Today button */}
                      <button
                        type="button"
                        onClick={() => {
                          setParentLensDateFilter(new Date().toISOString().split('T')[0]);
                          setShowAllLensDates(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-bold border border-blue-500/30 transition-all cursor-pointer"
                      >
                        اليوم 📍
                      </button>

                      {/* Show All Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowAllLensDates(!showAllLensDates)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          showAllLensDates
                            ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                        }`}
                      >
                        <span>{showAllLensDates ? 'عرض الكل ✅' : 'عرض كل التواريخ'}</span>
                      </button>

                      {/* Refresh */}
                      <button
                        type="button"
                        onClick={fetchParentLensActivities}
                        disabled={isLoadingLensActivities}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                        title="تحديث اللقطات"
                      >
                        <RefreshCw size={14} className={isLoadingLensActivities ? 'animate-spin text-blue-400' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Feed */}
                  {isLoadingLensActivities ? (
                    <div className="py-16 text-center space-y-3 bg-[#0a1124] rounded-2xl border border-white/5">
                      <Loader2 size={32} className="text-blue-400 animate-spin mx-auto" />
                      <span className="text-xs text-white/60 font-bold block">جاري جلب اللقطات والمشاركات الصفية...</span>
                    </div>
                  ) : displayedLensActivities.length === 0 ? (
                    <div className="py-12 px-4 text-center bg-[#0a1124]/60 rounded-3xl border border-dashed border-white/10 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-3xl">
                        📸
                      </div>
                      <h5 className="text-sm font-black text-white">
                        {showAllLensDates ? 'لا توجد لقطات مسجلة لطالبتكم/طالبكم حتى الآن' : `لا توجد لقطات موثقة لتاريخ ${parentLensDateFilter}`}
                      </h5>
                      <p className="text-xs text-white/50 max-w-md mx-auto">
                        {showAllLensDates
                          ? 'يقوم كادر التدريس بتوثيق اللقطات والفيديوهات التفاعلية وبثها مباشرة فور قيام الطالب بمشاركة متميزة.'
                          : 'يمكنك التبديل إلى تواريخ أخرى أو النقر على "عرض الكل" لمشاهدة جميع اللقطات السابقة.'}
                      </p>
                      {!showAllLensDates && (
                        <button
                          type="button"
                          onClick={() => setShowAllLensDates(true)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all cursor-pointer"
                        >
                          عرض كل التواريخ 📂
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {displayedLensActivities.map((act) => {
                        const tgEmbed = act.mediaUrl ? act.mediaUrl.replace('https://t.me/', 'https://t.me/') : '';
                        const isPrivate = tgEmbed.includes('/c/');
                        const embedUrl = isPrivate ? '' : `${tgEmbed}?embed=1&dark=1`;

                        const mediaSrc = act.mediaUrl && act.mediaUrl.startsWith('/api/media/local/')
                          ? act.mediaUrl
                          : act.telegramFileId?.startsWith('local:')
                            ? `/api/media/local/${act.telegramFileId.replace('local:', '')}`
                            : act.telegramFileId
                              ? `/api/media/telegram/${act.schoolId || studentData?.schoolId || 'school1'}/${act.telegramFileId}`
                              : act.mediaUrl || '';

                        const isVideo = act.mediaType === 'video' || 
                          Boolean(act.telegramFileId?.startsWith('BAAC')) ||
                          Boolean(mediaSrc && (/\.(mp4|mov|webm|m4v|3gp|avi|mkv)$/i.test(mediaSrc) || mediaSrc.includes('video') || mediaSrc.includes('mp4') || mediaSrc.includes('tg_BAAC'))) ||
                          Boolean(act.mediaUrl && (/\.(mp4|mov|webm|m4v|3gp|avi|mkv)$/i.test(act.mediaUrl) || act.mediaUrl.includes('video') || act.mediaUrl.includes('mp4')));

                        // Parse Teacher Name and Subject Name
                        const authorRaw = (act.authorName || 'الأستاذ').trim();
                        let teacherName = authorRaw;
                        let subjectName = '';

                        const parenMatch = authorRaw.match(/^(.*?)\s*\((.*?)\)$/);
                        if (parenMatch) {
                          teacherName = parenMatch[1].trim() || 'الأستاذ';
                          subjectName = parenMatch[2].trim();
                        } else if (authorRaw.includes('•')) {
                          const parts = authorRaw.split('•');
                          teacherName = parts[0].trim() || 'الأستاذ';
                          subjectName = parts[1].trim();
                        } else if (authorRaw.includes(' - ')) {
                          const parts = authorRaw.split(' - ');
                          teacherName = parts[0].trim() || 'الأستاذ';
                          subjectName = parts[1].trim();
                        }

                        return (
                          <div key={act.id} className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3 relative overflow-hidden flex flex-col justify-between shadow-lg hover:border-blue-500/30 transition-all">
                            <div>
                              {/* 👨‍🏫 اسم الأستاذ والمادة الدراسية */}
                              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-blue-500/25 mb-2.5 shadow-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30 text-sm font-bold shadow-sm">
                                    👨‍🏫
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-white truncate">
                                        الأستاذ: {teacherName}
                                      </span>
                                      {subjectName && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/25 text-cyan-300 border border-cyan-400/35">
                                          مادة: {subjectName}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-blue-200/70 font-semibold block">
                                      {act.telegramMessageId ? 'بث وتوثيق صفي حي 📡' : 'مشاركة صفية متميزة 🌟'}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-white/50 font-mono shrink-0">
                                  {act.createdAt ? new Date(act.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>

                              {mediaSrc ? (
                                <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center relative shadow-inner">
                                  {isVideo ? (
                                    <ClassroomVideoPlayer
                                      src={mediaSrc}
                                      paused={Boolean(selectedLensMedia)}
                                      onExpand={(currentTime) => setSelectedLensMedia({ ...act, mediaSrc, isVideo: true, teacherName, subjectName, initialTime: currentTime })}
                                    />
                                  ) : (
                                    <div 
                                      className="w-full h-full relative cursor-pointer group flex items-center justify-center"
                                      onClick={() => setSelectedLensMedia({ ...act, mediaSrc, isVideo: false, teacherName, subjectName })}
                                    >
                                      <img
                                        src={mediaSrc}
                                        alt="نشاط صفي"
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="px-3 py-1.5 rounded-xl bg-blue-600/90 text-white font-black text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                                          <ZoomIn size={14} />
                                          <span>عرض بحجم كامل 🔍</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : embedUrl ? (
                                <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/5 bg-black/40">
                                  <iframe
                                    src={embedUrl}
                                    className="w-full h-full border-none"
                                    title="Classroom Lens Video"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <div className="w-full aspect-video rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center p-4 text-center bg-black/40 space-y-2">
                                  <span className="text-2xl">🔒</span>
                                  <span className="text-[10px] font-bold text-white/60">لقطة صفيّة آمنة (قناة خاصة)</span>
                                  <a
                                    href={act.mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1 rounded-lg bg-blue-600 text-white font-black text-[9px] hover:bg-blue-500 transition-all flex items-center gap-1 shadow-md shadow-blue-500/20"
                                  >
                                    <span>فتح وبث المشاهدة ↗️</span>
                                  </a>
                                </div>
                              )}
                            </div>

                            {act.description && (
                              <p className="text-white text-xs font-black leading-relaxed border-t border-white/5 pt-2.5 mt-2">
                                💬 {act.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Attendance Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div 
                  onClick={() => setAttendanceFilter('present')}
                  className={`cursor-pointer transition-all duration-300 p-4 rounded-3xl text-center border ${
                    attendanceFilter === 'present' 
                      ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]' 
                      : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="block text-emerald-400 text-2xl font-black">{studentData?.attendance?.present || 0}</span>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-black">حضور حصص ✅</span>
                </div>

                <div 
                  onClick={() => setAttendanceFilter('absent')}
                  className={`cursor-pointer transition-all duration-300 p-4 rounded-3xl text-center border ${
                    attendanceFilter === 'absent' 
                      ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.25)] scale-[1.02]' 
                      : 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <XCircle size={16} className="text-rose-400" />
                    <span className="block text-rose-400 text-2xl font-black">{studentData?.attendance?.absent || 0}</span>
                  </div>
                  <span className="text-[11px] text-rose-300 font-black">غياب حصص ❌</span>
                </div>

                <div 
                  onClick={() => setAttendanceFilter('late')}
                  className={`cursor-pointer transition-all duration-300 p-4 rounded-3xl text-center border ${
                    attendanceFilter === 'late' 
                      ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]' 
                      : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Timer size={16} className="text-amber-400" />
                    <span className="block text-amber-400 text-2xl font-black">{studentData?.attendance?.late || 0}</span>
                  </div>
                  <span className="text-[11px] text-amber-300 font-black">تأخير ⏳</span>
                </div>
              </div>

              {/* Commitment Score & Rate */}
              <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-5 rounded-3xl shadow-xl shadow-blue-900/30 border border-blue-400/20 relative overflow-hidden">
                 <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck size={18} className="text-cyan-400" />
                          <h3 className="text-white font-black text-lg">معدل الانضباط والمواظبة</h3>
                        </div>
                        <p className="text-white/70 text-xs">نسبة التزام الطالب بحضور الحصص الدراسية المقررة</p>
                    </div>
                    <div className="text-right">
                        {(() => {
                           const present = studentData?.attendance?.present || 0;
                           const absent = studentData?.attendance?.absent || 0;
                           const total = present + absent;
                           const rate = total > 0 ? Math.round((present / total) * 100) : 100;
                           return (
                             <div className="flex flex-col items-center bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-md">
                               <span className="text-3xl font-black text-white">{rate}%</span>
                               <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider">
                                 {rate >= 90 ? 'ممتاز 🌟' : rate >= 75 ? 'جيد جداً 👍' : 'يحتاج متابعة ⚠️'}
                               </span>
                             </div>
                           );
                        })()}
                    </div>
                 </div>
                 <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Fixed Non-Scrollable Header Bar (Date Controller + 4-Col Filter Grid) */}
              <div className="sticky -top-10 z-30 bg-[#070D1E]/95 backdrop-blur-xl border-b border-white/10 -mx-6 -mt-10 px-4 sm:px-6 py-3.5 mb-6 shadow-xl space-y-2.5">
                {/* Row 1: Day Navigation with Small Arrows & Today's Priority */}
                <div className="flex items-center justify-between gap-2 bg-[#101935] px-3 py-2 rounded-2xl border border-white/10">
                  {/* Prev Day Arrow (Right arrow in RTL moves to past/previous day) */}
                  <button
                    type="button"
                    onClick={handlePrevAttendanceDay}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 text-cyan-400 hover:text-cyan-300 flex items-center justify-center transition-all cursor-pointer border border-white/5"
                    title="اليوم السابق"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Center: Formatted Date & Today Indicator */}
                  <div className="flex items-center gap-2 text-center min-w-0">
                    <Calendar size={15} className="text-cyan-400 shrink-0" />
                    <span className="text-white font-black text-xs sm:text-sm truncate">
                      {getArabicDateFormatted(selectedAttendanceDate)}
                    </span>
                    {selectedAttendanceDate === todayDateStr ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                        اليوم 🌟
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedAttendanceDate(todayDateStr)}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        سجل اليوم 📍
                      </button>
                    )}
                  </div>

                  {/* Next Day Arrow (Left arrow in RTL moves to next day) */}
                  <button
                    type="button"
                    disabled={selectedAttendanceDate >= todayDateStr}
                    onClick={handleNextAttendanceDay}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 active:scale-95 text-cyan-400 hover:text-cyan-300 disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center transition-all cursor-pointer border border-white/5"
                    title="اليوم التالي"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>

                {/* Row 2: Fixed Non-Scrollable Filter Bar (4-Column Grid) */}
                <div className="grid grid-cols-4 gap-1.5 w-full bg-[#101935] p-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setAttendanceFilter('all')}
                    className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all text-center ${
                      attendanceFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    الكل ({studentData?.attendance?.logs?.length || 0})
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('absent')}
                    className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 ${
                      attendanceFilter === 'absent'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-rose-400 hover:text-rose-300'
                    }`}
                  >
                    <span>غياب ❌</span>
                    <span>({studentData?.attendance?.absent || 0})</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('late')}
                    className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 ${
                      attendanceFilter === 'late'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <span>تأخير ⏳</span>
                    <span>({studentData?.attendance?.late || 0})</span>
                  </button>
                  <button
                    onClick={() => setAttendanceFilter('present')}
                    className={`py-1.5 px-1 rounded-xl text-xs font-black transition-all text-center flex items-center justify-center gap-1 ${
                      attendanceFilter === 'present'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <span>حضور ✅</span>
                    <span>({studentData?.attendance?.present || 0})</span>
                  </button>
                </div>
              </div>

              {/* Attendance Matrix & Days Archive */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-white text-sm font-black flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-400" />
                    <span>سجل الحصص والنشاط الصفي اليومي</span>
                  </h4>
                  <span className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    تزامن حي ومباشر ⚡
                  </span>
                </div>

                {(() => {
                  const allLogs = Array.isArray(studentData?.attendance?.logs) ? studentData.attendance.logs : [];
                  
                  // Filter logs according to active filter
                  const filteredLogs = allLogs.filter((l: any) => {
                    if (attendanceFilter === 'absent') return l.status === 'absent';
                    if (attendanceFilter === 'late') return l.status === 'late';
                    if (attendanceFilter === 'present') return l.status === 'present';
                    return true;
                  });

                  // Group by Date
                  const dateGroups: { [key: string]: any[] } = {};
                  filteredLogs.forEach((l: any) => {
                    const rawDate = l.date || (l.timestamp ? new Date(l.timestamp).toISOString().split('T')[0] : 'سجل سابق');
                    if (!dateGroups[rawDate]) {
                      dateGroups[rawDate] = [];
                    }
                    dateGroups[rawDate].push(l);
                  });

                  // Sort dates with selectedAttendanceDate ALWAYS as top priority
                  const allFoundDates = Object.keys(dateGroups).sort((a, b) => {
                    return new Date(b).getTime() - new Date(a).getTime();
                  });

                  const getArabicDayName = (dateStr: string) => {
                    try {
                      const parts = (dateStr || '').split('-');
                      let date: Date;
                      if (parts.length === 3) {
                        date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                      } else {
                        date = new Date(dateStr);
                      }
                      if (isNaN(date.getTime())) return '';
                      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                      return days[date.getDay()];
                    } catch {
                      return '';
                    }
                  };

                  const renderDateCard = (dateKey: string, isPriority = false) => {
                    const rawDayLogs = dateGroups[dateKey] || [];
                    const dayName = getArabicDayName(dateKey);

                    // Deduplicate logs for this date strictly by period
                    const dedupedLogsMap = new Map<string, any>();
                    rawDayLogs.forEach((l: any) => {
                      const pKey = l.period || 'يوم كامل';
                      if (!dedupedLogsMap.has(pKey)) {
                        dedupedLogsMap.set(pKey, l);
                      } else {
                        const existing = dedupedLogsMap.get(pKey);
                        dedupedLogsMap.set(pKey, {
                          ...existing,
                          ...l,
                          subject: l.subject || existing.subject,
                          evaluation: l.evaluation || existing.evaluation || l.reason || existing.reason,
                          reason: l.reason || existing.reason
                        });
                      }
                    });
                    const dayLogs = Array.from(dedupedLogsMap.values());

                    // Calculate day statistics
                    let dayPresent = 0, dayAbsent = 0, dayLate = 0;
                    dayLogs.forEach((l: any) => {
                      if (l.status === 'present') dayPresent++;
                      if (l.status === 'absent') dayAbsent++;
                      if (l.status === 'late') dayLate++;
                    });

                    // Periods status lookup map
                    const periodsMap: { [key: string]: any } = {};
                    dayLogs.forEach((l: any) => {
                      if (l.period) {
                        periodsMap[l.period] = l;
                      }
                    });

                    const isFullDay = periodsMap['يوم كامل'];

                    return (
                      <div 
                        key={`date_group_${dateKey}`} 
                        className={`bg-[#101935] rounded-3xl border p-5 space-y-4 shadow-lg transition-all ${
                          isPriority 
                            ? 'border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30' 
                            : 'border-white/10 hover:border-blue-500/30'
                        }`}
                      >
                        {/* Day Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                              isPriority ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40' : 'bg-blue-500/15 text-blue-400 border-blue-400/30'
                            }`}>
                              <Calendar size={20} />
                            </div>
                            <div>
                              <h5 className="text-white font-black text-sm flex items-center gap-2 flex-wrap">
                                <span>{dayName ? `يوم ${dayName}` : 'تاريخ الرصد'}</span>
                                <span className="text-xs text-blue-300 font-mono bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-400/20">
                                  {dateKey}
                                </span>
                                {dateKey === todayDateStr && (
                                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black">
                                    سجل اليوم الأولوية 🌟
                                  </span>
                                )}
                              </h5>
                              <p className="text-white/50 text-[11px] mt-0.5">
                                إجمالي الحصص المسجلة في هذا اليوم: <span className="text-white font-bold">{dayLogs.length}</span>
                              </p>
                            </div>
                          </div>

                          {/* Day Quick Verdict Badge */}
                          <div className="flex items-center gap-1.5 self-start sm:self-center">
                            {dayAbsent > 0 ? (
                              <span className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                                <span>غائب في ({dayAbsent}) حصة ⚠️</span>
                              </span>
                            ) : dayLate > 0 ? (
                              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <span>تأخير ({dayLate}) حصة ⏳</span>
                              </span>
                            ) : dayLogs.length > 0 ? (
                              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>حضور تام ومكتمل 🌟</span>
                              </span>
                            ) : (
                              <span className="bg-white/5 border border-white/10 text-white/40 text-xs font-black px-3 py-1 rounded-xl">
                                لم تسجل حصص بعد
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Period Pills Timeline (حصة 1 إلى حصة 8) */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-white/50 font-black uppercase tracking-wider block">
                            مصفوفة الحصص اليومية:
                          </span>
                          
                          {isFullDay ? (
                            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                              isFullDay.status === 'present' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                              isFullDay.status === 'absent' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' :
                              'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                {isFullDay.status === 'present' ? <CheckCircle2 size={18} /> : isFullDay.status === 'absent' ? <XCircle size={18} /> : <Timer size={18} />}
                                <span className="text-xs font-black">رصد اليوم بالكامل ({isFullDay.status === 'present' ? 'حاضر ✅' : isFullDay.status === 'absent' ? 'غائب ❌' : 'متأخر ⏳'})</span>
                                {isFullDay.subject && (
                                  <span className="text-cyan-300 font-black bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                                    <BookOpen size={10} />
                                    <span>{isFullDay.subject}</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-white/60">{isFullDay.time || 'صباحاً'}</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                              {['1', '2', '3', '4', '5', '6', '7', '8'].map((periodNum) => {
                                const log = periodsMap[periodNum] || periodsMap[`الحصة ${periodNum}`];
                                const isPresent = log?.status === 'present';
                                const isAbsent = log?.status === 'absent';
                                const isLate = log?.status === 'late';

                                return (
                                  <div
                                    key={`period_chip_${dateKey}_${periodNum}`}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                                      isAbsent
                                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)] scale-[1.02]'
                                        : isLate
                                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                        : isPresent
                                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                        : 'bg-white/5 border-white/5 text-white/30'
                                    }`}
                                  >
                                    <span className="text-[10px] font-bold">ح {periodNum}</span>
                                    {log?.subject && (
                                      <span className="text-[9px] text-cyan-300 font-bold truncate max-w-full px-1">
                                        {log.subject}
                                      </span>
                                    )}
                                    <span className="text-[11px] font-black mt-0.5">
                                      {isAbsent ? 'غائب ❌' : isLate ? 'متأخر ⏳' : isPresent ? 'حاضر ✅' : '—'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Detailed Class Logs for this Date */}
                        <div className="space-y-2 pt-1">
                          {dayLogs.map((log: any, idx: number) => {
                            const isPresent = log.status === 'present';
                            const isAbsent = log.status === 'absent';
                            const isLate = log.status === 'late';

                            return (
                              <div 
                                key={`log_row_${dateKey}_${idx}_${log.period || ''}`}
                                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                                  isAbsent 
                                    ? 'bg-rose-500/10 border-rose-500/25' 
                                    : isLate
                                    ? 'bg-amber-500/10 border-amber-500/25'
                                    : 'bg-white/5 border-white/5 hover:border-emerald-500/20'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isPresent ? 'bg-emerald-500/20 text-emerald-400' :
                                    isAbsent ? 'bg-rose-500/20 text-rose-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {isPresent ? <CheckCircle2 size={16} /> : isAbsent ? <XCircle size={16} /> : <Timer size={16} />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-white font-black text-xs">
                                        {log.period === 'يوم كامل' ? 'اليوم الدراسي بالكامل' : `الحصة ${log.period}`}
                                      </span>

                                      {/* Subject Display */}
                                      {log.subject && (
                                        <span className="text-cyan-300 font-black bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1">
                                          <BookOpen size={11} className="text-cyan-400" />
                                          <span>{log.subject}</span>
                                        </span>
                                      )}

                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                        isPresent ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                        isAbsent ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                        'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                      }`}>
                                        {isPresent ? 'حاضر في الحصة' : isAbsent ? 'غائب عن الحصة' : 'متأخر عن الحصة'}
                                      </span>
                                    </div>

                                    {/* Sub details: Recorded by, time, reason */}
                                    <div className="flex items-center gap-3 text-[11px] text-white/50 mt-1 flex-wrap">
                                      <span className="flex items-center gap-1 font-mono text-white/70">
                                        <Clock size={11} className="text-white/40" />
                                        <span>{log.time || '08:00 ص'}</span>
                                      </span>
                                      {log.by && (
                                        <span>• الأستاذ: <strong className="text-white/80">{log.by}</strong></span>
                                      )}
                                      {log.reason && log.reason !== 'بدون عذر' && !log.evaluation && (
                                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                                          السبب: {log.reason}
                                        </span>
                                      )}
                                    </div>

                                    {/* Classroom Activity Evaluation Badge */}
                                    {(() => {
                                      const evalText = (log.evaluation || (log.status === 'present' && log.reason && log.reason !== 'بدون عذر' ? log.reason : '') || '').trim();
                                      if (!evalText || evalText === 'بدون عذر') return null;
                                      return (
                                        <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold flex items-center justify-between gap-2 shadow-sm flex-wrap">
                                          <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-cyan-400 shrink-0 animate-pulse" />
                                            <span>النشاط والتقييم الصفي: <strong className="text-white font-black">{evalText}</strong></span>
                                          </div>
                                          <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-black border border-cyan-400/30 shrink-0">تزامن حي ⚡</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>

                                <div className="text-right sm:text-left shrink-0">
                                  <span className="text-[10px] text-white/40 font-mono">
                                    معتمد رسمياً 🛡️
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  };

                  // Render prioritized date (selectedAttendanceDate) first
                  const hasSelectedDateRecords = dateGroups[selectedAttendanceDate] && dateGroups[selectedAttendanceDate].length > 0;
                  const otherDates = allFoundDates.filter(d => d !== selectedAttendanceDate);

                  return (
                    <div className="space-y-6">
                      {/* Only Show Selected Date Card */}
                      {hasSelectedDateRecords ? (
                        renderDateCard(selectedAttendanceDate, true)
                      ) : (
                        <div className="bg-[#101935] rounded-3xl border border-cyan-500/20 p-6 sm:p-8 text-center space-y-3 shadow-lg ring-1 ring-cyan-500/15">
                          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                            <Calendar size={22} />
                          </div>
                          <h5 className="text-white font-black text-sm">
                            {selectedAttendanceDate === todayDateStr
                              ? 'سجل اليوم الدراسي (الحالي) 🌟'
                              : `سجل يوم ${getArabicDateFormatted(selectedAttendanceDate)}`}
                          </h5>
                          <p className="text-white/60 text-xs max-w-md mx-auto leading-relaxed">
                            {selectedAttendanceDate === todayDateStr
                              ? 'لم تسجل أي حالات غياب أو تأخير للطالب اليوم حتى الآن. يتحدث السجل فوراً عند قيام الأساتذة برصد الحصص الدراسية.'
                              : 'لا توجد حصص مسجلة في هذا التاريخ المحدد. يمكنك استخدام الأسهم للرجوع للأيام السابقة.'}
                          </p>
                          {selectedAttendanceDate !== todayDateStr && (
                            <button
                              type="button"
                              onClick={() => setSelectedAttendanceDate(todayDateStr)}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <span>العودة لسجل اليوم الحالي 📍</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
                </>
              )}

              {/* Full-Screen Media Modal (Lightbox) for Videos and Photos */}
              <AnimatePresence>
                {selectedLensMedia && (
                  <div 
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
                    onClick={() => setSelectedLensMedia(null)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#0b1328] border border-white/15 rounded-3xl p-4 sm:p-5 max-w-3xl w-full max-h-[92vh] flex flex-col space-y-3 relative shadow-2xl text-right overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                      style={{ direction: 'rtl' }}
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center text-lg border border-blue-400/30 shrink-0 shadow-sm">
                            👨‍🏫
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white">
                                الأستاذ: {selectedLensMedia.teacherName || selectedLensMedia.authorName || 'الأستاذ'}
                              </h4>
                              {selectedLensMedia.subjectName && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/25 text-cyan-300 border border-cyan-400/35">
                                  مادة: {selectedLensMedia.subjectName}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-white/50">{selectedLensMedia.createdAt ? new Date(selectedLensMedia.createdAt).toLocaleString('ar-EG') : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLensMedia(null)}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-all cursor-pointer flex items-center justify-center border border-white/10"
                            title="إغلاق النافذة"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Media Display */}
                      <div className="flex-1 w-full min-h-[260px] max-h-[62vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center relative">
                        {selectedLensMedia.isVideo ? (
                          <ClassroomVideoPlayer
                            src={selectedLensMedia.mediaSrc}
                            autoPlay={true}
                            initialTime={selectedLensMedia.initialTime || 0}
                            className="max-h-[62vh]"
                          />
                        ) : (
                          <img
                            src={selectedLensMedia.mediaSrc}
                            alt="نشاط صفي"
                            className="w-full h-full max-h-[62vh] object-contain"
                          />
                        )}
                      </div>

                      {/* Modal Description */}
                      {selectedLensMedia.description && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black leading-relaxed">
                          💬 {selectedLensMedia.description}
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : activeSubPage === "excellence" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Pride Message Show */}
              {displayPrideMessage && (
                 <div className="bg-gradient-to-l from-indigo-900/40 to-black/40 border border-indigo-500/20 p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] -mt-10 -mr-10 pointer-events-none" />
                    <div className="text-4xl animate-bounce">📨</div>
                    <div className="flex-1 text-center md:text-right">
                       <h4 className="text-indigo-300 font-extrabold text-sm mb-2">رسالة فخر واعتزاز من الإدارة</h4>
                       <p className="text-white md:text-lg font-black leading-snug">"{displayPrideMessage}"</p>
                    </div>
                 </div>
              )}

              {/* Academic Profile Hero */}
              <div className="bg-[#101935] p-6 sm:p-8 rounded-[2.5rem] border border-[#FFD600]/20 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(255,214,0,0.15)] flex flex-col gap-6">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD600]/10 blur-[80px] rounded-full -mt-20 -mr-20 pointer-events-none" />
                 
                 <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full sm:w-auto">
                       {/* Dynamic Neon Glowing Avatar */}
                       <div className="relative group cursor-pointer perspective-1000 shrink-0">
                          {academicProfile?.levelData && (
                            <>
                              <div 
                                className="absolute inset-0 rounded-full blur-[20px] transition-all duration-750 ease-out" 
                                style={{ 
                                  background: academicProfile?.levelData?.glowColor || 'rgba(148,163,184,0.3)',
                                  opacity: 0.8
                                }}
                              />
                              <div 
                                className="absolute inset-0 rounded-full blur-[40px] opacity-20 animate-pulse" 
                                style={{ background: academicProfile?.levelData?.glowColor || 'rgba(148,163,184,0.3)' }}
                              />
                            </>
                          )}
                          <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl font-black shadow-xl ring-2 ring-white/10 ${academicProfile?.levelData?.borderClass || 'border-slate-500/30'} bg-[#0a0f24] bg-cover bg-center overflow-hidden z-20`} style={{ backgroundImage: studentData?.avatar ? `url(${studentData.avatar})` : 'none' }}>
                            {!studentData?.avatar && (academicProfile?.isEliteStudent ? '👑' : '👨‍🎓')}
                            
                            {/* Points Badge Overlaid on bottom corner */}
                            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#FFD600] to-amber-500 text-black px-2 py-1 rounded-lg text-[9px] font-black border border-amber-400 shadow-xl flex items-center justify-center gap-0.5 z-30">
                               <span>{excellencePoints?.totalPoints || 0}</span>
                               <span className="opacity-70 text-[7px]">نقطة</span>
                            </div>
                          </div>
                          {academicProfile?.levelData && (
                            <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[8px] font-black border ${academicProfile.levelData.borderClass} z-30 shadow-xl backdrop-blur-md`}>
                               {academicProfile.levelData.label}
                            </div>
                          )}
                       </div>

                       <div className="text-center md:text-right flex-grow">
                          <div className="flex flex-col md:flex-row items-center gap-2 mb-1 justify-center md:justify-start">
                             <span className="text-white text-xl sm:text-2xl font-black">{studentData?.name}</span>
                             <span className="text-white/40 font-bold text-xs hidden md:inline">|</span>
                             <h3 className="text-[#FFD600] text-lg sm:text-xl font-black drop-shadow-md">{excellencePoints?.dynamicTitle || 'بطل التميز 🏅'}</h3>
                          </div>
                          <p className="text-white/80 text-[11px] font-bold mb-2">نظام النقاط الذكي: معدل دقيق + أوسمة + استمرارية</p>
                           <div className="flex flex-wrap items-center gap-1.5 justify-center md:justify-start mb-2">
                              {academicProfile?.generalExemption === true ? (
                                 <span className="text-[10px] font-black bg-amber-500/10 text-[#FFD600] border border-amber-500/20 px-2.5 py-0.5 rounded shadow-sm">إعفاء عام 👑</span>
                              ) : (
                                 academicProfile?.individualExemptions && academicProfile.individualExemptions.length > 0 && (
                                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded shadow-sm">إعفاء فردي ({academicProfile.individualExemptions.length} مادة) 🏅</span>
                                 )
                              )}
                           </div>
                          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                             <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-white/70 text-[10px] font-bold">🎯 الأساس: {excellencePoints?.basePoints || 0}</span>
                             <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-white/70 text-[10px] font-bold">🏆 أوسمة: {excellencePoints?.badgesBonus || 0}</span>
                             <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-emerald-400/80 text-[10px] font-bold shadow-[0_0_10px_rgba(52,211,153,0.1)]">⚡ تطور واستمرار: {(excellencePoints?.improvementBonus || 0) + (excellencePoints?.continuityBonus || 0)}</span>
                          </div>
                       </div>
                    </div>
                    {/* Strongest Subject */}
                    <div className="w-full sm:w-1/3 flex flex-col gap-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/40">المادة الأقوى</span>
                       </div>
                       <div className="p-3 bg-black/40 rounded-2xl border border-white/5 relative flex items-center justify-center">
                             <span className="font-extrabold text-emerald-400 text-sm">{academicProfile?.strongestSubjectMap?.name !== '---' ? academicProfile?.strongestSubjectMap?.name : 'قيد التقييم'}</span>
                       </div>
                       {academicProfile?.strongestSubjectMap?.name !== '---' && (
                         <p className="text-emerald-400/60 text-[9px] font-bold text-center">
                            الدرجة الأعلى: {academicProfile?.highestScore}
                          </p>
                        )}
                        {academicProfile?.individualExemptions && academicProfile.individualExemptions.length > 0 && (
                           <div className="flex flex-col gap-1 mt-2 border-t border-white/5 pt-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-1">
                                 <span className="text-emerald-300">مواد الإعفاء الفردي 🏅</span>
                              </div>
                              <div className="p-2 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-wrap gap-1 justify-center">
                                 {academicProfile.individualExemptions.map((sj: string, i: number) => (
                                    <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-300 font-black px-1.5 py-0.5 rounded border border-emerald-500/20">{sj}</span>
                                 ))}
                              </div>
                           </div>
                        )}
                        {false && (
                           <p>
                         </p>
                       )}
                    </div>
                 </div>
              </div>

              {/* Achievements Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                     <Award className="text-[#FFD600]" size={16} />
                     <h4 className="text-white/80 text-xs font-black uppercase tracking-wide">صالة الشرف والأوسمة الدراسية</h4>
                  </div>
                  {academicProfile?.isEliteStudent && (
                     <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        👑 طالب النخبة
                     </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {allBadges.length > 0 ? (
                    allBadges.map((ach: any, idx: number) => (
                      <div key={`ach_${idx}`} className="bg-[#101935] p-5 rounded-3xl border border-white/5 flex flex-col items-center gap-3 text-center group hover:border-[#FFD600]/30 transition-all relative overflow-hidden shadow-lg hover:shadow-[#FFD600]/10 hover:-translate-y-1">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${ach.levelColor?.replace('text-', '')}/50 to-transparent`} />
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center text-3xl group-hover:scale-110 transition-transform ${ach.levelColor}`}>
                           {ach.icon}
                        </div>
                        <div className="space-y-1">
                          <h5 className={`font-black text-xs ${ach.levelColor}`}>{ach.badgeName}</h5>
                          <p className="text-white/50 text-[10px] font-bold">{ach.subjName}</p>
                          <p className="text-white/30 text-[8px] leading-tight flex flex-wrap items-center gap-1 justify-center mt-1">
                             {ach.detail} <CalendarClock size={8}/>
                          </p>
                          {(ach.extraTags && ach.extraTags.length > 0) && (
                             <div className="flex flex-wrap gap-1 justify-center mt-2">
                                {ach.extraTags.map((t: string, i: number) => (
                                   <span key={i} className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">{t}</span>
                                ))}
                             </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] text-center space-y-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[#FFD600]/5" />
                      <Star size={40} className="mx-auto text-[#FFD600]/20 relative z-10" />
                      <div className="relative z-10">
                        <p className="text-[#FFD600]/70 text-sm font-black mb-1">لوحة الشرف قيد التقييم!</p>
                        <p className="text-white/30 text-[10px] font-bold">بانتظار أن يسطر الطالب إنجازاته الأكاديمية هنا.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Share on Social Media Button - End of Badges */}
                {allBadges.length > 0 && (
                  <div className="mt-8 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0a1536] to-[#101935] rounded-3xl border border-[#FFD600]/20 shadow-[0_15px_40px_rgba(255,214,0,0.1)] relative overflow-hidden group">
                     {/* Decorative background glow */}
                     <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-[#FFD600]/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-[#FFD600]/15 transition-colors" />
                     
                     <Sparkles size={28} className="text-[#FFD600] mb-3 relative z-10 animate-pulse" />
                     <h4 className="text-white font-extrabold text-sm md:text-base mb-1 relative z-10 text-center">
                        شارك فخرك بـ {cleanParentStudentName(studentName)}! 🌟
                     </h4>
                     <p className="text-blue-200/60 text-[10px] md:text-xs text-center max-w-sm mb-5 relative z-10 font-bold leading-relaxed">
                        قم بتوليد بطاقة إنجازات مبهرة ورسمية من بوابة بيرق لمشاركتها على وسائل التواصل الاجتماعي والتفاخر بهذا التقدم المتميز.
                     </p>
                     
                     <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="relative z-10 px-8 py-3.5 bg-gradient-to-l from-[#FFD600] to-yellow-500 hover:to-[#FFD600] active:scale-95 transition-all rounded-full flex items-center gap-2.5 shadow-[0_5px_20px_rgba(255,214,0,0.3)] group-hover:shadow-[0_10px_30px_rgba(255,214,0,0.4)]"
                     >
                        <Share2 size={16} className="text-black" />
                        <span className="text-black font-black text-xs">بوابة بيرق - توليد بطاقة شرف تفاعلية</span>
                     </button>
                  </div>
                )}

                {/* Exemption Card Generator */}
                {(academicProfile?.generalExemption || (academicProfile?.individualExemptions && academicProfile.individualExemptions.length > 0)) && (
                   <div className="mt-4 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 to-[#101935] rounded-3xl border border-indigo-400/30 shadow-[0_15px_40px_rgba(99,102,241,0.2)] relative overflow-hidden group">
                      <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors" />
                      <Award size={28} className="text-indigo-300 mb-3 relative z-10" />
                      <h4 className="text-white font-extrabold text-sm md:text-base mb-1 relative z-10 text-center">
                         بطاقة الاستحقاق العالي (الإعفاء) 🏅
                      </h4>
                      <p className="text-indigo-200/60 text-[10px] md:text-xs text-center max-w-sm mb-5 relative z-10 font-bold leading-relaxed">
                         تهانينا! الإعفاء هو أعلى درجات النخبة، يمكنك استخراج بطاقة الإعفاء الرسمية.
                      </p>
                      
                      <button
                         onClick={() => setIsShareModalOpen(true)}
                         className="relative z-10 px-8 py-3.5 bg-gradient-to-l from-indigo-500 to-purple-600 hover:to-indigo-500 active:scale-95 transition-all rounded-full flex items-center gap-2.5 shadow-[0_5px_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_10px_30px_rgba(99,102,241,0.6)]"
                      >
                         <Share2 size={16} className="text-white" />
                         <span className="text-white font-black text-xs">استخراج بطاقة الإعفاء الفاخرة</span>
                      </button>
                   </div>
                )}
              </div>
            </div>
          ) : activeSubPage === "meeting" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Top Navigation Bar: Administration vs Teachers */}
              <div className="flex items-center gap-2 bg-[#101935] p-1.5 rounded-2xl border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={() => setContactTab('admin')}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    contactTab === 'admin'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck size={16} />
                  <span>تواصل مع الإدارة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLoungeOpen(true)}
                  className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 relative text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-500/10 border border-white/5 bg-[#101935] hover:border-cyan-400/30`}
                >
                  <Users size={16} />
                  <span>الأساتذة (كادر المواد)</span>
                  {unreadLoungeMessagesCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md font-sans">
                      {unreadLoungeMessagesCount}
                    </span>
                  )}
                </button>
              </div>

              {contactTab === 'admin' ? (
                <div className="space-y-6">
                  {/* Quick Contact Options */}
                  <div className="grid grid-cols-2 gap-4">
                     <a href={`tel:${schoolInfo.adminPhone || '07700000000'}`} className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                           <ShieldCheck size={24} />
                        </div>
                        <span className="text-white font-bold text-[10px]">اتصال مباشر</span>
                     </a>
                     <a href={`https://wa.me/${getFormattedWhatsapp(schoolInfo.adminWhatsapp)}`} target="_blank" rel="noreferrer" className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl flex flex-col items-center gap-3 group active:scale-95 transition-all text-center">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                           <Megaphone size={24} />
                        </div>
                        <span className="text-white font-bold text-[10px]">واتساب الإدارة</span>
                     </a>
                  </div>

                  {/* Message Box */}
                  <div className="bg-[#101935] p-6 rounded-[2.5rem] border border-white/5 space-y-4">
                     <h4 className="text-white font-black text-sm pr-2">صندوق الدعم والتبليغات الإدارية</h4>
                     <p className="text-white/40 text-xs px-2 leading-relaxed">فتح صندوق الوارد لعرض الرسائل المباشرة و إرسال طلبات رسمية للإدارة.</p>
                     <button 
                        onClick={() => setIsSupportFormOpen(true)}
                        className="w-full py-4 bg-purple-600 rounded-2xl text-white font-black text-sm shadow-xl shadow-purple-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-visible"
                     >
                        {totalUnreadSupport > 0 && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-[#101935] shadow-lg animate-pulse">
                            {totalUnreadSupport > 9 ? '+9' : totalUnreadSupport}
                          </span>
                        )}
                        <Bell size={16} /> فتح صندوق الدعم والتبليغات
                     </button>
                  </div>

                  {/* Note */}
                  <div className="flex items-center gap-3 px-4">
                     <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                     <p className="text-white/30 text-[9px] font-bold">يتم الرد على طلبات المقابلات والاستفسارات الإدارية خلال أوقات الدوام الرسمي.</p>
                  </div>
                </div>
              ) : (
                /* Teacher Communication Tab */
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-indigo-500/15 border border-cyan-500/30 p-5 rounded-3xl space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-cyan-300 font-black text-sm flex items-center gap-2">
                        <Sparkles size={18} className="text-cyan-400 animate-pulse" />
                        <span>كادر أساتذة الطالب المباشر (المجلس)</span>
                      </h4>
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {studentTeachers.length} أساتذة
                      </span>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">
                      هؤلاء هم الأساتذة المدرسون للطالب <strong className="text-white font-black">{cleanParentStudentName(studentName)}</strong> ({studentData?.grade || grade || ''}). يمكنك مراسلة الأستاذ مباشرة للاستفسار عن الأداء الأكاديمي والمستوى المالي/الانضباطي.
                    </p>
                  </div>

                  {/* Teachers Grid */}
                  {isLoadingTeachers ? (
                    <div className="p-8 text-center space-y-3 bg-[#101935] rounded-3xl border border-white/5">
                      <Loader2 size={28} className="animate-spin text-cyan-400 mx-auto" />
                      <p className="text-white/50 text-xs font-bold">جاري تحميل قائمة الأساتذة...</p>
                    </div>
                  ) : studentTeachers.length === 0 ? (
                    <div className="p-8 text-center space-y-3 bg-[#101935] rounded-3xl border border-white/5">
                      <Users size={32} className="text-white/20 mx-auto" />
                      <h5 className="text-white font-black text-sm">لا يوجد أساتذة مسجلون لهذه الشعبة حالياً</h5>
                      <p className="text-white/40 text-xs max-w-md mx-auto">
                        يمكنك التواصل مباشرة مع إدارة المدرسة لتوجيه أي استفسار خاص بالمدرس المختص.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {studentTeachers.map((tch: any) => {
                        const tchId = tch.id || tch.code;
                        const hasHistory = teacherChatHistory[tchId] && teacherChatHistory[tchId].length > 0;
                        const lastMsg = hasHistory ? teacherChatHistory[tchId][teacherChatHistory[tchId].length - 1] : null;

                        return (
                          <div 
                            key={`tch_card_${tchId}`}
                            className="bg-[#101935] rounded-3xl border border-white/10 p-5 space-y-4 hover:border-cyan-500/40 transition-all shadow-lg flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-3.5">
                              {/* Avatar */}
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center shrink-0 overflow-hidden text-cyan-300 shadow-md">
                                {tch.photo ? (
                                  <img src={tch.photo} alt={tch.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Users size={24} />
                                )}
                              </div>

                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  <h5 className="text-white font-black text-sm truncate">
                                    أ. {tch.name}
                                  </h5>
                                  <span className="text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full shrink-0">
                                    معتمد 🛡️
                                  </span>
                                </div>

                                <div className="text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                                  <BookOpen size={12} className="text-cyan-400 shrink-0" />
                                  <span className="truncate">{tch.subject ? `مادة ${tch.subject}` : 'أستاذ المادة'}</span>
                                </div>

                                <p className="text-white/40 text-[11px] truncate">
                                  {tch.bio || `كادر التدريس لصف ${studentData?.grade || grade || ''}`}
                                </p>
                              </div>
                            </div>

                            {/* Last Msg snippet if exists */}
                            {lastMsg && (
                              <div className="bg-white/5 p-2.5 rounded-2xl border border-white/5 text-[11px] text-white/70 space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] text-white/40">
                                  <span>آخر رسالة مرسلة:</span>
                                  <span>{lastMsg.time}</span>
                                </div>
                                <p className="truncate font-semibold text-white/80">"{lastMsg.text}"</p>
                              </div>
                            )}

                            {/* Direct Action Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedTeacherForChat(tch)}
                              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
                            >
                              <MessageCircle size={14} />
                              <span>مراسلة الأستاذ مباشرة 💬</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeSubPage === "conduct" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Summary Chart-like Card */}
              <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2.5rem] flex items-center justify-between">
                 <div className="space-y-1">
                    <h4 className="text-rose-400 font-black text-sm">مؤشر السلوك</h4>
                    <p className="text-white/40 text-[10px] font-bold">إجمالي الملاحظات المسجلة: {studentData?.behavior?.logs?.length || 0}</p>
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-rose-500/30 border-t-rose-500 flex items-center justify-center">
                    <span className="text-white font-black text-xs">{(studentData?.behavior?.score || 100)}%</span>
                 </div>
              </div>

              {/* Logs */}
              <div className="space-y-3">
                 <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest px-2">سجل الانضباط</h4>
                 {studentData?.behavior?.logs?.length > 0 ? (
                   studentData.behavior.logs.map((log: any, idx: number) => (
                     <div key={`behavior_log_${log.id || idx}_${idx}`} className="bg-[#101935] p-5 rounded-3xl border border-white/5 flex gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          log.type === 'positive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                           {log.type === 'positive' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center justify-between">
                              <h5 className="text-white font-bold text-xs">{log.title}</h5>
                              <span className="text-white/20 text-[9px]">{log.date}</span>
                           </div>
                           <p className="text-white/40 text-[10px] leading-relaxed">{log.description}</p>
                        </div>
                     </div>
                   ))
                 ) : (
                  <div className="p-10 border-2 border-dashed border-white/5 rounded-[2.5rem] text-center space-y-3">
                    <ShieldCheck size={40} className="mx-auto text-emerald-500/20" />
                    <p className="text-emerald-500/30 text-xs font-bold">لا توجد ملاحظات سلوكية سلبية مسجلة</p>
                    <p className="text-white/10 text-[9px]">الطالب يتمتع بسلوك مثالي حالياً</p>
                  </div>
                 )}
              </div>

              {/* Direct WhatsApp support discussion for Behaviour supervision room */}
              <div className="bg-gradient-to-br from-[#101935] to-[#101935]/40 p-5 rounded-3xl border border-green-500/20 shadow-[0_8px_32px_rgba(34,197,94,0.04)] space-y-3.5 text-right mt-4" style={{ direction: 'rtl' }}>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-green-500/15 flex items-center justify-center text-green-400 shrink-0 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                       <MessageCircle size={18} />
                    </div>
                    <div>
                       <h5 className="text-white font-black text-xs">غرفة الإشراف السلوكي والتربوي</h5>
                       <p className="text-white/30 text-[9px] font-bold">تواصل مباشر لمناقشة السلوك والانضباط مع المشرف المختص</p>
                    </div>
                 </div>
                 
                 <a 
                    href={`https://wa.me/${getFormattedWhatsapp(schoolInfo.adminWhatsapp)}?text=${encodeURIComponent(`السلام عليكم ورحمة الله، أنا ولي أمر الطالب ${studentData?.name || studentName || ''}. أرغب بمناقشة تقرير الانضباط والسلوك المنشور في لوحة المتابعة الخاصة به.`)}`}
                    target="_blank" 
                    rel="noreferrer" 
                    className="w-full py-3 bg-green-600 hover:bg-green-500 active:scale-[0.98] transition-all rounded-xl text-white font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-600/20 group"
                 >
                    <span className="text-sm">💬</span>
                    <span>بدء المحادثة المباشرة مع الإشراف السلوكي</span>
                 </a>
              </div>
            </div>
          ) : activeSubPage === "uniform" ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-right" style={{ direction: 'rtl' }}>
              {/* Top Banner */}
              <div className="bg-gradient-to-br from-[#0c1329] to-[#080d1d] border border-indigo-500/20 p-6 rounded-[2.5rem] relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-indigo-400 font-extrabold text-[#FFD600] text-sm flex items-center gap-1.5 font-sans">
                      <span>👔</span>
                      <span>سجل الزي المدرسي الرسمي</span>
                    </h4>
                    <p className="text-white/40 text-[10px] font-bold font-sans">بوابة المتابعة لزي فرسان {getStageFromGrade(studentData?.grade || '')}</p>
                  </div>
                  
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border font-sans ${
                    schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-white/5 text-white/30 border-white/5'
                  }`}>
                    {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.isActive 
                      ? '🟢 نظام الزي نشط ومعتمد' 
                      : '⚪ غير مفعل حالياً'
                    }
                  </span>
                </div>
              </div>

              {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')] ? (
                <div className="space-y-6">
                  {/* Informative Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
                    {/* Shirt detail card */}
                    <div className="bg-[#101935] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-500/5 blur-xl rounded-full pointer-events-none" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-indigo-400">👕 الزي العلوي (القميص)</span>
                        <span className="text-white font-extrabold text-sm mt-1">
                          {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.shirt || 'غير محدد من قبل الإدارة'}
                        </span>
                      </div>
                    </div>

                    {/* Pants detail card */}
                    <div className="bg-[#101935] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-16 h-16 bg-cyan-500/5 blur-xl rounded-full pointer-events-none" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-cyan-400">👖 الزي السفلي (البنطال)</span>
                        <span className="text-white font-extrabold text-sm mt-1">
                          {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.pants || 'غير محدد من قبل الإدارة'}
                        </span>
                      </div>
                    </div>

                    {/* Accessories detail card */}
                    <div className="bg-[#101935] border border-white/5 p-5 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-16 h-16 bg-purple-500/5 blur-xl rounded-full pointer-events-none" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-purple-400">👟 الأحذية والتجهيزات</span>
                        <span className="text-white font-extrabold text-sm mt-1">
                          {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.accessories || 'غير محدد من قبل الإدارة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Days Card */}
                  <div className="bg-[#101935] border border-white/5 p-5 rounded-3xl space-y-3 font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[10px] font-black uppercase tracking-wider">سجل الالتزام الأسبوعي</span>
                      <span className="text-amber-400 font-extrabold text-[10px] flex items-center gap-1">
                        <span>ℹ</span>
                        <span>يرجى ارتداء الزي بالأيام المحددة</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'].map((day) => {
                        const isRequired = schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.days?.includes(day);
                        return (
                          <div
                            key={day}
                            className={`flex-grow min-w-[70px] py-3 px-2 rounded-2xl text-center border transition-all flex flex-col justify-center items-center gap-1 ${
                              isRequired
                                ? 'bg-amber-400/10 border-amber-400/20 text-white'
                                : 'bg-white/5 border-white/5 text-white/30'
                            }`}
                          >
                            <span className="text-xs font-bold">{day}</span>
                            <span className={`text-[9px] font-black leading-none ${isRequired ? 'text-amber-400' : 'text-white/20'}`}>
                              {isRequired ? 'مقرر حتمي' : 'اختياري'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes Card */}
                  {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.notes && (
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-3xl space-y-2 font-sans">
                      <h4 className="text-indigo-400 font-black text-xs flex items-center gap-1">
                        <span>💡</span>
                        <span>ملاحظات الزي وتوجيهات الإدارة منضبطاً</span>
                      </h4>
                      <p className="text-white/80 font-medium text-xs leading-relaxed bg-transparent border-none">
                        {schoolConfigs?.uniformConfigs?.[getStageFromGrade(studentData?.grade || '')]?.notes}
                      </p>
                    </div>
                  )}

                  {/* Instant Contact with conduct discipline room */}
                  <div className="bg-[#101935] border border-white/5 p-5 rounded-[2.5rem] space-y-4 font-sans">
                     <div className="flex items-start gap-3 text-right">
                        <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                           <span className="text-lg">📞</span>
                        </div>
                        <div className="space-y-0.5">
                           <h4 className="text-white font-extrabold text-sm">التواصل بخصوص الالتزام والزي</h4>
                           <p className="text-white/30 text-[9px] font-semibold leading-normal font-sans">تواصل مع المشرف السلوكي بالقسم لمناقشة ظروف أو استثناءات لزي الفارس بنقرة واحدة</p>
                        </div>
                     </div>
                     
                     <a 
                        href={`https://wa.me/${getFormattedWhatsapp(schoolInfo.adminWhatsapp)}?text=${encodeURIComponent(`السلام عليكم ورحمة الله، أنا ولي أمر الطالب ${studentData?.name || studentName || ''}. أرغب بمناقشة موضوع الزي المدرسي والالتزام والتعليمات المعلنة.`)}`}
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full py-3 bg-green-600 hover:bg-green-500 active:scale-[0.98] transition-all rounded-xl text-white font-black text-[11px] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-600/20"
                     >
                        <span className="text-sm">💬</span>
                        <span>مراسلة الإشراف السلوكي عبر واتساب</span>
                     </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 font-sans">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/30">
                    <Shirt size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-amber-400 font-bold text-base">بانتظار إعلان الزي</h3>
                    <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto font-sans">
                      لم يتم تعميم أو تحديد تفاصيل الزي المدرسي بعد من قبل الإدارة لهذه المرحلة الدراسية.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : activeSubPage === "future" ? (
            <div className="space-y-0 divide-y divide-white/5 animate-in fade-in slide-in-from-bottom-4 pb-12 text-right font-sans w-full" style={{ direction: 'rtl' }}>
              
              {/* COMPUTE LIST DATA DIRECTLY IN SCOPE FOR OPTIMAL MEMORY AND REACTIVE FILTERS */}
              {(() => {
                const filteredList = filteredThresholdsList;

                return (
                  <>
                    {/* Top Banner */}
                    <div className="bg-[#050A18] relative overflow-hidden flex flex-col md:flex-row items-center gap-6 px-6 py-10 w-full">
                      <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none" />
                      
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center text-white text-3xl shadow-xl shadow-amber-500/10 shrink-0 border border-white/10">
                        🗺️
                      </div>
                      <div className="flex-1 space-y-1 text-center md:text-right">
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <h4 className="text-[#D4AF37] font-black text-lg md:text-xl tracking-wide drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                            مستشار كشف القبول المركزي والمسار الجامعي
                          </h4>
                          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase self-center md:self-auto">
                            الإصدار الاحترافي عالي الدقة ✨
                          </span>
                        </div>
                        <p className="text-white/60 text-xs font-medium leading-relaxed max-w-3xl">
                          المنظم التعليمي الشامل لفرسان السادس الإعدادي. يتم فلترة المواد ومطابقة المعايرة تنافسياً مع دليل الحدود الدنيا الحكومية بدقة متناهية 100%.
                        </p>
                      </div>
                    </div>

                    {/* Left & Right Panel: Top goal setting & Predictions */}
                    {/* Inner Tabs for Future Path */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 px-6 pb-4 pt-2">
                       <button
                         onClick={() => setFutureTab('calculator')}
                         className={`flex-1 w-full px-4 py-3 text-xs sm:text-sm font-black transition-all rounded-2xl border ${futureTab === 'calculator' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}`}
                       >
                         حسابات المسار والتوقع
                       </button>
                       <button
                         onClick={() => setFutureTab('guide')}
                         className={`flex-1 w-full px-4 py-3 text-xs sm:text-sm font-black transition-all rounded-2xl border ${futureTab === 'guide' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-white'}`}
                       >
                         توجيهات الارشاد التربوي ودليل الحدود الدنيا
                       </button>
                    </div>

                    {futureTab === 'calculator' && (
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start w-full">
                      
                      {/* Interactive Central Form - takes 5 columns */}
                      <div className="relative overflow-hidden xl:col-span-5 space-y-6 px-6 py-8 w-full">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <h3 className="text-[#D4AF37] font-extrabold text-sm flex items-center gap-2">
                            <span>🎯</span>
                            مزامنة وتعديل الطموح الأكاديمي
                          </h3>
                          <span className="bg-[#FFD600]/10 text-[#FFD600] text-[9px] font-black px-2.5 py-0.5 rounded-lg border border-[#FFD600]/20">
                            فرع {studentBranch === 'scientific' ? 'العلمي 🧪' : 'الأدبي 📚'}
                          </span>
                        </div>

                        <div className="space-y-4">
                          
                          {/* Automatic Branch Notification - Beautiful, simple */}
                          <div>
                            <span className="block text-white/40 text-[9px] font-black tracking-wider mb-1.5 uppercase">الكشف التلقائي للتوجيه</span>
                            <div className="bg-indigo-500/5 border border-indigo-500/15 p-3 rounded-2xl flex items-center gap-3">
                              <span className="text-xl">🛡️</span>
                              <div>
                                <h5 className="text-white font-black text-xs">تم تحديد الفرع: {studentBranch === 'scientific' ? 'العلمي' : 'الأدبي'}</h5>
                                <p className="text-white/40 text-[9px] font-semibold">تلقائياً بناءً على رمز وجدول الفارس الدراسي بالأكاديمية.</p>
                              </div>
                            </div>
                          </div>

                          {/* University Selector */}
                          <div>
                            <label className="block text-white/50 text-[9px] font-black uppercase tracking-wider mb-2">الجامعة الحكومية المرجوة</label>
                            <select
                              value={selectedUnivId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedUnivId(val);
                                setSelectedCollegeId('');
                              }}
                              className="w-full p-4 bg-[#141b31]/90 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-cyan-500 focus:outline-none transition-all cursor-pointer font-sans"
                            >
                              <option value="" className="bg-[#0c1329] text-white">إختر الجامعة الحكومية الطموحة...</option>
                              {Array.from(new Set(flattenedColleges.map(c => c.univId))).map(univId => {
                                const univItem = flattenedColleges.find(c => c.univId === univId);
                                return (
                                  <option key={univId} value={univId} className="bg-[#0c1329] text-white">
                                    🏛️ {univItem?.univName} (محافظة {univItem?.location})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* College Selector (Fully linked) */}
                          <div>
                            <label className="block text-white/50 text-[9px] font-black uppercase tracking-wider mb-2">
                              {selectedUnivId ? "الكلية المستهدفة للقبول المركزي" : "بانتظار اختيار معيار الجامعة..."}
                            </label>
                            <select
                              value={selectedCollegeId}
                              onChange={(e) => {
                                const colId = e.target.value;
                                setSelectedCollegeId(colId);
                                const currentUnivName = flattenedColleges.find(c => c.univId === selectedUnivId)?.univName;
                                const col = flattenedColleges.find(c => c.collegeId === colId);
                                if (col) {
                                  setFutureTargetAverage(col.gpa);
                                  setFutureTargetCollege(`${currentUnivName} - ${col.collegeName}`);
                                }
                              }}
                              disabled={!selectedUnivId}
                              className="w-full p-4 bg-[#141b31]/90 border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-cyan-500 focus:outline-none transition-all cursor-pointer font-sans disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <option value="" className="bg-[#0c1329] text-white">إختر الكلية أو التخصص المرجو...</option>
                              {selectedUnivId && flattenedColleges
                                .filter(c => c.univId === selectedUnivId && (c.branch === 'both' || c.branch === studentBranch))
                                .map(col => (
                                  <option key={col.collegeId} value={col.collegeId} className="bg-[#0c1329] text-white">
                                    {col.category?.includes('medical') ? '🩺' : col.category?.includes('engineer') ? '💻' : col.category?.includes('science') || col.category === 'tech_medical' ? '🧬' : col.category?.includes('agri') ? '🌾' : col.category?.includes('art') ? '🎨' : col.category?.includes('manage') ? '📊' : col.category?.includes('teacher') ? '🧑‍🏫' : '⚖️'} {col.collegeName} (المعدل: ~{col.gpa}%)
                                  </option>
                                ))
                              }
                            </select>
                          </div>

                          {/* GPA goal modifier */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-white/50 text-[9px] font-black uppercase tracking-wider">تعديل المعدل المستهدف</span>
                              <span className="text-cyan-400 font-extrabold text-xs tabular-nums bg-cyan-400/10 px-3 py-1 rounded-xl">{futureTargetAverage}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="50" 
                              max="100" 
                              step="0.1"
                              value={futureTargetAverage}
                              onChange={(e) => setFutureTargetAverage(parseFloat(e.target.value))}
                              className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/5 rounded-lg appearance-none"
                            />
                            <div className="flex justify-between text-[8px] text-white/35 pt-1 font-black">
                              <span>50.0%</span>
                              <span>75.0%</span>
                              <span>100.0%</span>
                            </div>
                          </div>

                          {/* Guidance input */}
                          <div>
                            <label className="block text-white/50 text-[9px] font-black uppercase tracking-wider mb-2">سجل توجيه الأسرة والتعضيد البيتي</label>
                            <textarea
                              value={futureParentNotes}
                              onChange={(e) => setFutureParentNotes(e.target.value)}
                              placeholder="أدخل هنا استشاراتكم البيتية، تكييف ساعات التفكير والمتابعة، أو الأغراض التعليمية لدعم الفارس والعمل بروح الفريق الواحد لتحقيق الحلم..."
                              className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white text-xs font-bold h-24 focus:border-cyan-500 focus:outline-none transition-all placeholder-white/20 resize-none font-sans"
                            />
                          </div>

                          {/* Saving button connected with Firebase */}
                          <button
                            onClick={handleSaveFuturePath}
                            disabled={isSavingFuturePath}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs transition-all focus:outline-none shadow-lg shadow-cyan-500/10 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {isSavingFuturePath ? (
                              <>
                                <div className="w-4.4 h-4.4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>جاري تدوين وبث البيانات...</span>
                              </>
                            ) : (
                              <>
                                <span>💾</span>
                                <span>حفظ ومزامنة الهدف رسمياً بالسجل المركزي</span>
                              </>
                            )}
                          </button>

                          <AnimatePresence>
                            {showSaveSuccess && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-center text-[10px] font-black flex items-center justify-center gap-2 shadow-lg"
                              >
                                <span>✨</span>
                                <span>تم مزامنة طموح الفارس وتوجيهاتكم الموقرة بنجاح في سجل الأكاديمية المركزي!</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Dynamic GPA predictions card - takes 7 columns */}
                      <div className="flex flex-col gap-6 relative px-6 py-8 xl:col-span-7 xl:h-full w-full">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full" />
                        
                        <h4 className="text-[#FFD600] font-black text-xs uppercase border-b border-white/5 pb-3 flex items-center gap-2">
                          <span>🎛️</span>
                          مستشار القياس والتوقعات الذكية للوزاري
                        </h4>

                        {(() => {
                          const currentGrades = studentData?.grades?.[selectedGradePeriod] || {};
                          const gradeValues = Object.values(currentGrades).map(Number).filter(g => !isNaN(g) && g > 0);
                          
                          const hasGrades = gradeValues.length > 0;
                          
                          let rawAverage = hasGrades 
                            ? Math.round(gradeValues.reduce((sum, g) => sum + g, 0) / gradeValues.length * 10) / 10 
                            : 0;
                          const currentAverage = rawAverage;
                          
                          const totalPoints = studentData?.totalPoints || 0;
                          const xpBonus = totalPoints > 1000 ? 1.5 : totalPoints > 500 ? 1.0 : totalPoints > 200 ? 0.5 : 0;
                          
                          let rawPredicted = hasGrades ? Math.min(100, Math.round((currentAverage + xpBonus) * 10) / 10) : 0;
                          const predictedAverage = rawPredicted;
                          
                          let rawTarget = Number(futureTargetAverage);
                          if (isNaN(rawTarget) || rawTarget <= 0) {
                            rawTarget = 95;
                          }
                          const safeTargetAverage = rawTarget;
                          
                          const gap = hasGrades ? Math.max(0, parseFloat((safeTargetAverage - predictedAverage).toFixed(1))) : 0;

                          return (
                            <div className="space-y-6 flex-1 flex flex-col justify-between">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                <div className="bg-black/35 p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-16 h-16 bg-purple-500/5 blur-xl rounded-full" />
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-white/40 text-[9px] font-black tracking-wider uppercase block">المعدل الفعلي بالامتحانات</span>
                                    <span className="text-purple-400 font-bold text-base leading-none">📊</span>
                                  </div>
                                  <div>
                                    {hasGrades ? (
                                      <span className="text-white text-3xl font-extrabold tracking-tight tabular-nums block">{currentAverage}%</span>
                                    ) : (
                                      <span className="text-white text-xl font-bold tracking-tight block">بإنتظار الدرجات ⏳</span>
                                    )}
                                    <span className="text-white/30 text-[8.5px] font-bold mt-1 block">بناءً على فترة ({gradePeriods.find(p => p.id === selectedGradePeriod)?.name || 'الدرجات الشهرية'})</span>
                                  </div>
                                </div>

                                <div className="bg-black/35 p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-16 h-16 bg-amber-500/5 blur-xl rounded-full" />
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-white/40 text-[9px] font-black tracking-wider uppercase block">المعدل الوزاري المرصود</span>
                                    <span className="text-amber-400 font-bold text-base leading-none animate-pulse">🔥</span>
                                  </div>
                                  <div>
                                    {hasGrades ? (
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-amber-400 text-3xl font-black tracking-tight tabular-nums block">{predictedAverage}%</span>
                                        {xpBonus > 0 && (
                                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black px-1.5 py-0.5 rounded">
                                            +{xpBonus}% نقاط
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-amber-400 text-base font-bold tracking-tight block">التوقع غير متاح 🔴</span>
                                    )}
                                    <span className="text-white/30 text-[8.5px] font-bold mt-1 block">بإضافة نقاط الجرعة التدريبية لأوسمة الفارس</span>
                                  </div>
                                </div>

                              </div>

                              {/* Progress Slider Line */}
                              <div className="space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between text-[10px] font-black">
                                  <span className="text-amber-400 flex items-center gap-1">🟢 التوقع الفعلي ({predictedAverage}%)</span>
                                  <span className="text-cyan-400 flex items-center gap-1">🎯 الهدف المرجو ({safeTargetAverage}%)</span>
                                </div>
                                <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/10 flex">
                                  <div 
                                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-r-full transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.min(100, predictedAverage)}%` }}
                                  />
                                  <div 
                                    className="bg-cyan-500 h-full opacity-55 transition-all duration-1000 ease-out"
                                    style={{ width: `${Math.max(0, Math.min(100, safeTargetAverage - predictedAverage))}%` }}
                                  />
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                  <span className="text-white/30 text-[8px] font-semibold">مسار التفوق الفعلي</span>
                                  <span className="text-white/30 text-[8px] font-semibold">باقي للهدف {gap}%</span>
                                </div>
                              </div>

                              {/* Analyser Advice (Rich customized rules) */}
                              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1c38] to-[#040813] border border-cyan-500/15 space-y-1.5 flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-center border-b border-cyan-500/10 pb-2">
                                  <span className="text-[10px] text-cyan-300 font-black">تقرير فجوة المسار المستقبلية</span>
                                  <span className={`font-bold tabular-nums text-xs ${!hasGrades ? 'text-white/40' : 'text-cyan-400'}`}>
                                    {!hasGrades ? 'الحالة: بإنتظار الدرجات ⏳' : gap === 0 ? '👑 المسار آمن بالكامل' : `العجز المتبقي: -${gap}%`}
                                  </span>
                                </div>
                                <p className="text-white/80 text-[11px] leading-relaxed font-medium pt-1">
                                  {!hasGrades ? (
                                    "لم يتم تسجيل درجات بعد. يُفعل مستشار القياس والتوقعات تلقائياً ويكون دقيقاً بعد إكمال امتحانات الشهر الأول للفصل الأول بالكامل، ليرسم للطالب خارطة دقيقة نحو طموحه الجامعي."
                                  ) : gap === 0 ? (
                                    "👑 أداء مذهل واستثنائي! الفارس المؤهل يتخطى الحدود الصارمة للقبول بالنسبة لهذه الكلية بكفاءة مرتقبة. نوصي بتثبيت ساعات القراءة وتفادي ظاهرة التشتت البيتي لضمان المقعد الصاعد."
                                  ) : gap <= 1.5 ? (
                                    "⚡ فارق ضئيل بمستوى نصف درجة في المواد الحيوية! زيادة الدقة في المراجعة الذاتية لحلول اللجان بين 2018-2023 تضمن حتمية سد الفجوة وحسم الطموح بجدارة."
                                  ) : gap <= 4 ? (
                                    "📈 مستوى واعد وقريب جداً من التحقق! حصد درجة ونظام توازن إضافي في مادة واحدة علمية كفيل بسحب معدل الطالب المركزي للأعلى. نوصي بتكثيف حلول رادار المواد بالأسفل."
                                  ) : gap <= 8 ? (
                                    "🚀 سعة الفرسان تطحن الصعاب! يتطلب غلق هذا الفارق وضع جدول استدراكي مضاعف بالتعاون مع مرشد الأكاديمية، والتركيز على مفاتيح حفظ التكاثر والإنشاءات الإنجليزية."
                                  ) : (
                                    "🔥 طموح استثنائي يتطلب وثبة فرسان فارقة! يحتاج الفارس إلى تنظيم مراجعة حاسمة لدرجات المواد المتراجعة، والاعتماد المطلق على اختبارات الـ 60 ثانية لتطوير مرونة التجاوب الوزاري السريع."
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                    )}

                    {futureTab === 'guide' && (
                      <>
                    {/* Recipe for parents */}
                    <div className="space-y-4 w-full px-6 py-8 border-t border-white/5">
                      <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                        <span className="text-lg">🧑‍⚕️</span>
                        توجيهات الإرشاد التربوي والنفسي الأبوي لفرسان السادس العلمي والأدبي
                      </h3>
                      <p className="text-white/40 text-[10px] sm:text-xs leading-relaxed">
                        معدلات القبول الاستثنائية تولد من بيوت توفر الطمأنينة والأمان وتوازن البيئة الحيوية. إليك إرشادات الأخصائي التربوي:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 font-sans">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                          <span className="text-lg">🕯️</span>
                          <h4 className="text-white font-semibold text-xs">زرع الطمأنينة والثقة المطلقة</h4>
                          <p className="text-white/40 text-[9px] leading-relaxed font-bold">
                            الطالب في هذا المنعطف يحتاج إلى الشعور بأنكم تؤمنون بقدراته بمعزل عن النتيجة. الضغط النفسي والمقارنات تقتل الإبداع، بينما الدعم العاطفي غير المشروط يضاعف سعة الاستيعاب والذاكرة.
                          </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                          <span className="text-lg">🛡️</span>
                          <h4 className="text-white font-semibold text-xs">إدارة البيئة المنزلية</h4>
                          <p className="text-white/40 text-[9px] leading-relaxed font-bold">
                            احرصوا على توفير بيئة دراسية هادئة، خالية من المشتتات والتوترات العائلية. عزل الطالب عن أي مشاكل جانبية يعتبر جدار الحماية الأول لتركيزه الذهني العميق.
                          </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                          <span className="text-lg">🧠</span>
                          <h4 className="text-white font-semibold text-xs">الصحة الجسدية والذهنية</h4>
                          <p className="text-white/40 text-[9px] leading-relaxed font-bold">
                            النوم الليلي المنتظم (7-8 ساعات) هو المصنع الذي تُثبت فيه المعلومات، والتغذية السليمة هي الوقود. السهر المفرط يرهق الجهاز العصبي ويهدم ما تم حفظه.
                          </p>
                        </div>
                      </div>
                    </div>
                    </>
                    )}

                    {futureTab === 'guide' && (
                      <>
                      {/* WIDESCREEN CENTRAL ADMISSIONS THRESHOLDS GUIDE (كامل القائمة بحجم عرض الشاشة) */}
                      <div className="overflow-hidden space-y-6 px-6 py-10 w-full relative">
                      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
                      
                      {/* Section Title with counting metric */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-5 gap-4">
                        <div className="space-y-1">
                          <h3 className="text-white font-extrabold text-base flex items-center gap-2">
                            <span className="text-[#FFD600]">📑</span>
                            دليل الحدود الدنيا والمفاضلات التنافسية للقبول المركزي الحكومي
                          </h3>
                          <p className="text-white/40 text-[10px] sm:text-xs">
                            توجيه حقيقي 100% مستوحى من كتاب القبول المركزي للوزارة للعام الدراسي الماضي. اضغط على أي تخصص لمعاينة التوجيه المخفي وسد عيوب المتابعة.
                          </p>
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-2xl flex items-center gap-2 self-start md:self-auto">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="text-cyan-400 text-xs font-black tabular-nums">مدرج {filteredList.length} كليات مطابقة</span>
                        </div>
                      </div>

                      {/* Advanced live Search & multi-filter console layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        
                        {/* Search keyword input */}
                        <div className="lg:col-span-5 relative">
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
                          <input
                            type="text"
                            value={thresholdSearch}
                            onChange={(e) => setThresholdSearch(e.target.value)}
                            placeholder="ابحث بـاسم الجامعة، الكلية، التخصص أو المحافظة..."
                            className="w-full pr-11 pl-4 py-3 bg-[#11182c] border border-white/10 rounded-2xl text-white text-xs font-bold font-sans placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-all"
                          />
                        </div>

                        {/* Preset Branch Filters (علمي / أدبي / كلاهما) */}
                        <div className="lg:col-span-4 flex items-center gap-1 bg-[#11182c] p-1 rounded-2xl border border-white/5">
                          <button
                            onClick={() => setThresholdBranchFilter('all')}
                            className={`flex-1 py-2 text-center text-[10px] font-black rounded-xl transition-all ${thresholdBranchFilter === 'all' ? 'bg-cyan-500 text-[#050A18] shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                          >
                            الفرع المعتمد تلقائياً
                          </button>
                          <button
                            onClick={() => setThresholdBranchFilter('scientific')}
                            className={`flex-1 py-2 text-center text-[10px] font-black rounded-xl transition-all ${thresholdBranchFilter === 'scientific' ? 'bg-[#00e5ff] text-[#050A18] shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                          >
                            🧪 الفرع العلمي
                          </button>
                          <button
                            onClick={() => setThresholdBranchFilter('literary')}
                            className={`flex-1 py-2 text-center text-[10px] font-black rounded-xl transition-all ${thresholdBranchFilter === 'literary' ? 'bg-[#ff9100] text-[#050A18] shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                          >
                            📚 الفرع الأدبي
                          </button>
                        </div>

                        {/* Categories fast filter dropdown */}
                        <div className="lg:col-span-3">
                          <select
                            value={thresholdCategoryFilter}
                            onChange={(e) => setThresholdCategoryFilter(e.target.value)}
                            className="w-full py-3 px-4 bg-[#11182c] border border-white/10 rounded-2xl text-white text-xs font-bold focus:border-[#D4AF37] focus:outline-none transition-all cursor-pointer font-sans"
                          >
                            <option value="all" className="bg-[#0c1226]">كل التصانيف والتخصصات</option>
                            <option value="medical" className="bg-[#0c1226]">🩺 المجموعة الطبية والصيدلانية</option>
                            <option value="engineering" className="bg-[#0c1226]">💻 التخصصات الهندسية</option>
                            <option value="tech_medical" className="bg-[#0c1226]">🧪 التقنيات الصحية والطبية</option>
                            <option value="tech_engineering" className="bg-[#0c1226]">⚙️ التقنيات الهندسية</option>
                            <option value="tech_agriculture" className="bg-[#0c1226]">🌾 التقنيات الزراعية</option>
                            <option value="tech_management" className="bg-[#0c1226]">📊 التقنيات الإدارية</option>
                            <option value="tech_fine_arts" className="bg-[#0c1226]">🎨 الفنون التطبيقية</option>
                            <option value="medical_institute" className="bg-[#0c1226]">🏥 المعاهد الطبية التقنية</option>
                            <option value="engineering_institute" className="bg-[#0c1226]">🏗️ المعاهد الهندسية التقنية</option>
                            <option value="agriculture_institute" className="bg-[#0c1226]">🌱 المعاهد الزراعية التقنية</option>
                            <option value="management_institute" className="bg-[#0c1226]">📈 المعاهد الإدارية التقنية</option>
                            <option value="arts_institute" className="bg-[#0c1226]">🎨 المعاهد الفنية التقنية</option>
                            <option value="teachers_institute" className="bg-[#0c1226]">🧑‍🏫 معهد إعداد المدربين</option>
                            <option value="science" className="bg-[#0c1226]">🧬 كليات العلوم والتقنيات</option>
                            <option value="humanities" className="bg-[#0c1226]">🏛️ التربية والآداب والقانون</option>
                            <option value="administration" className="bg-[#0c1226]">⚖️ الإدارة واقتصاديات الأعمال</option>
                            <option value="management" className="bg-[#0c1226]">📊 الإدارة والاقتصاد</option>
                            <option value="fine_arts" className="bg-[#0c1226]">🎨 الفنون الجميلة</option>
                            <option value="media" className="bg-[#0c1226]">📹 الإعلام والاتصال</option>
                            <option value="islamic" className="bg-[#0c1226]">🕌 العلوم الإسلامية والفقه</option>
                            <option value="food_sci" className="bg-[#0c1226]">🍎 علوم الأغذية</option>
                          </select>
                        </div>

                      </div>

                      {/* Massive widescreen dynamic Glassmorphism table component */}
                      <p className="text-cyan-400/80 text-[10px] font-bold mt-4 mb-2 animate-pulse text-center sm:hidden">
                        (اسحب الجدول يميناً لرؤية جميع التفاصيل)
                      </p>
                      <div className="overflow-x-auto overflow-y-auto max-h-[500px] w-auto -mx-6 px-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <table className="w-full text-right text-xs text-white border-collapse font-sans min-w-[800px]">
                          <thead className="sticky top-0 bg-[#0c1329] z-10">
                            <tr className="border-b border-white/10 text-white/50 font-black uppercase text-[9px] tracking-wider bg-black/40">
                              <th 
                                onClick={() => {
                                  setThresholdSortField('name');
                                  setThresholdSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                }}
                                className="py-4 px-5 text-right cursor-pointer hover:text-white transition-colors"
                              >
                                اسم الجامعة أو الكلية المستشفة {thresholdSortField === 'name' ? (thresholdSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                              </th>
                              <th 
                                onClick={() => {
                                  setThresholdSortField('totalScore');
                                  setThresholdSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                }}
                                className="py-4 px-4 text-center cursor-pointer hover:text-white transition-colors text-[#00e5ff]"
                              >
                                المجموع المالي الرقمي {thresholdSortField === 'totalScore' ? (thresholdSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                              </th>
                              <th 
                                onClick={() => {
                                  setThresholdSortField('minGpa');
                                  setThresholdSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                }}
                                className="py-4 px-4 text-center cursor-pointer hover:text-white transition-colors text-amber-400"
                              >
                                المعدل المركزي المطلوب {thresholdSortField === 'minGpa' ? (thresholdSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                              </th>
                              <th 
                                onClick={() => {
                                  setThresholdSortField('competitiveScore');
                                  setThresholdSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                                }}
                                className="py-4 px-4 text-center cursor-pointer hover:text-white transition-colors text-pink-400"
                              >
                                المفاضلة التنافسية {thresholdSortField === 'competitiveScore' ? (thresholdSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                              </th>
                              <th className="py-4 px-4 text-center">الفرع الدراسي</th>
                              <th className="py-4 px-4 text-center">جنس المقاعد</th>
                              <th className="py-4 px-5 text-left">أسرار التوجيه</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {filteredList.length > 0 ? (
                              filteredList.slice(0, thresholdDisplayLimit).map((item, index) => {
                                const isGoal = futureTargetCollege.includes(item.collegeName) && futureTargetCollege.includes(item.univName);
                                const isExpanded = selectedAdvisoryCollegeId === item.collegeId;

                                return (
                                  <React.Fragment key={`${item.collegeId}_row_${index}`}>
                                    <tr 
                                      onClick={() => setSelectedAdvisoryCollegeId(isExpanded ? '' : item.collegeId)}
                                      className={`group cursor-pointer transition-all hover:bg-white/[0.04] ${isGoal ? 'bg-indigo-500/5' : ''} ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                                    >
                                      {/* College and University Name */}
                                      <td className="py-4 px-5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                                          {item.category?.includes('medical') ? '🩺' : item.category?.includes('engineer') ? '💻' : item.category?.includes('science') || item.category === 'tech_medical' ? '🧬' : item.category?.includes('agri') ? '🌾' : item.category?.includes('art') ? '🎨' : item.category?.includes('manage') ? '📊' : item.category?.includes('teacher') ? '🧑‍🏫' : '⚖️'}
                                        </div>
                                        <div className="text-right">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-white font-extrabold text-xs">{item.univName}</span>
                                            <span className="text-white/40 font-semibold text-[11px]">- {item.collegeName}</span>
                                            {isGoal && (
                                              <span className="bg-amber-400/20 text-[#FFD600] border border-[#FFD600]/30 text-[8px] font-black px-1.5 py-0.2 rounded-full">
                                                هدفك المختار 👑
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-white/35 text-[9px] block mt-0.5">الملف الحكومي الموثق - محافظة {item.location}</span>
                                        </div>
                                      </td>

                                      {/* Total Score */}
                                      <td className="py-4 px-4 text-center text-white/90 font-mono text-xs font-semibold tabular-nums">
                                        {item.total.toFixed(2)}
                                      </td>

                                      {/* Minimum Average GPA */}
                                      <td className="py-4 px-4 text-center">
                                        <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 font-mono font-black text-xs px-2.5 py-1 rounded-xl shadow-inner tabular-nums">
                                          {item.gpa.toFixed(2)}%
                                        </span>
                                      </td>

                                      {/* Competitive Preference Rating */}
                                      <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-pink-400 tabular-nums">
                                        {item.competitive}
                                      </td>

                                      {/* Academic Branch */}
                                      <td className="py-4 px-4 text-center">
                                        {item.branch === 'scientific' ? (
                                          <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[8px] font-black px-2 py-0.5 rounded-lg">علمي</span>
                                        ) : item.branch === 'literary' ? (
                                          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[8px] font-black px-2 py-0.5 rounded-lg">أدبي</span>
                                        ) : (
                                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[8px] font-black px-2 py-0.5 rounded-lg">كلاهما</span>
                                        )}
                                      </td>

                                      {/* Seat Gender */}
                                      <td className="py-4 px-4 text-center text-white/50 text-[11px] font-medium">
                                        مختلط
                                      </td>

                                      {/* Trigger Details */}
                                      <td className="py-4 px-5 text-left text-[10px] text-cyan-400 font-bold group-hover:underline">
                                        {isExpanded ? 'إخفاء التوجيه 🔼' : 'كشف أسرار القبول 🔽'}
                                      </td>
                                    </tr>

                                    {/* Nest click to reveal panel with customized educational guidance ("النقر للإظهار") */}
                                    <AnimatePresence>
                                      {isExpanded && (
                                        <tr>
                                          <td colSpan={7} className="p-0 border-none">
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden bg-[#101935]/50 border-r-4 border-[#D4AF37] px-6 py-4 space-y-2 text-right"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="text-xl pt-0.5">🧠</div>
                                                <div className="space-y-1.5 flex-1">
                                                  <h5 className="text-[#D4AF37] text-xs font-black">الدليل الإرشادي والتوجيهي لإحراز قبول ({item.collegeName}) بجامعة {item.univName}</h5>
                                                  <p className="text-white/80 text-[11px] leading-relaxed max-w-4xl">
                                                    {item.category?.includes('medical') ? (
                                                      "🩺 معيار التأهيل الطبي المباشر: تتطلب المجموعة الطبية تفوقاً تاماً بالمنهج الحرفي للأحياء والفيزياء الطبية السريرية. حلول اللجان الشاملة بين 2013-2023 تمنع الأخطاء الطفيفة بالجزئيات وحصد نقاط المفاضلة التنافسية البالغة " + item.competitive + " نقطة كاملة."
                                                    ) : item.category?.includes('engineer') ? (
                                                      "💻 كراس الهندسة المتقدم: ركائز هذا القسم تصب في التكامل والتطبيقات الفيزيائية والميكانيكية. يُنصح الطالب بمعالجة عقبات مادة الرياضيات بالفصل الخامس وإتقان رسم ومكونات الأجهزة لضمان سد فجوة المعدل البالغة " + item.gpa + "%."
                                                    ) : item.category?.includes('science') ? (
                                                      "🧬 مركب العلوم والتقنيات الحية: يركز السجل الوزاري لهذا القسم على مسائل الوراثة ونظرية الذرة الحديثة بالكيمياء. التركيز الشامل بحل وزاريات الفصول والامتحانات التقييمية الشهرية بالأكاديمية يضمن الحسم."
                                                    ) : item.category?.includes('agri') ? (
                                                      "🌾 مسار التقنيات الزراعية: يتطلب هذا القسم فهما واسعا للمجالات التقنية والبيولوجية الحية ويستلزم التثبيت الأكاديمي لمواد الأحياء."
                                                    ) : item.category?.includes('manage') ? (
                                                      "📊 مسار الإدارة والإقتصاديات: التركيز المالي والإداري عصب هذا القسم. يتطلب التفوق بمعادلات الإحصاء والمنطق وقفل درجات مواد الحفظ."
                                                    ) : item.category?.includes('art') ? (
                                                      "🎨 مسار الفنون التطبيقية والتصميم: صقل المهارة الإبداعية والتركيز على الجانب الفني والتطبيقي أساس للمنافسة وحصر المقعد الأكاديمي."
                                                    ) : item.category?.includes('teacher') ? (
                                                      "🧑‍🏫 مسار إعداد المدربين التقنيين: ينصح الطالب بالتركيز على التخصصات العلمية المطلوبة ومواد الحفظ التعليمية لتعزيز قوة الترشيح."
                                                    ) : (
                                                      "🏛️ نظام التخصصات والعلوم الإنسانية والقانون: للحسم هنا، الفارس بحاجة ماسة لقفل درجات مواد الحفظ (التربية الإسلامية ومفردات قواعد اللغة العربية) لما تمثله من وقود استثنائي وسريع لرفع المعدلات وحصد الترشيح وبلوغ مجموع " + item.total + " نقطة."
                                                    )}
                                                  </p>
                                                  <div className="flex items-center gap-4 pt-1.5 text-[9px] text-white/40">
                                                    <span>📍 موقع التقديم: محافظة {item.location}</span>
                                                    <span>🛡️ فرع الترشيح المركزي: {item.branch === 'scientific' ? 'علمي' : item.branch === 'literary' ? 'أدبي' : 'كلاهما'}</span>
                                                    <span>✨ الجنس المتاح: مختلط</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </motion.div>
                                          </td>
                                        </tr>
                                      )}
                                    </AnimatePresence>
                                  </React.Fragment>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={7} className="py-12 text-center text-white/30 text-xs font-bold">
                                  🔍 لم نجد أي جامعة أو كلية مطابقة لبحثك الحالي. جرب كلمات مفتاحية أخرى مناسبة.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {filteredList.length > thresholdDisplayLimit && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={() => setThresholdDisplayLimit(prev => prev + 50)}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                          >
                            إظهار المزيد (متبقي {filteredList.length - thresholdDisplayLimit})
                          </button>
                        </div>
                      )}
                    </div>
                    </>
                    )}

                    {futureTab === 'calculator' && (
                      <>
                    {/* Material gaps */}
                    {(() => {
                      const currentGrades = studentData?.grades?.[selectedGradePeriod] || {};
                      const subjects = getSubjectsForGrade(studentData?.grade || '', [], subjectMapping);
                      
                      const criticalSubjects = subjects.map(sub => {
                        const grade = Number(currentGrades[sub.id]) || 0;
                        const diff = parseFloat((futureTargetAverage - grade).toFixed(1));
                        return { ...sub, grade, diff };
                      }).filter(s => s.grade > 0 && s.diff > 0).sort((a,b) => b.diff - a.diff);

                      if (criticalSubjects.length === 0) return null;

                      return (
                        <div className="space-y-4 w-full relative px-6 py-8 border-y border-white/5">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 blur-3xl rounded-full" />
                          <div>
                            <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                              <span className="text-[#ff3d00]">📡</span>
                              رادار الفجوات الأكاديمية بالمواد المقررة
                            </h3>
                            <p className="text-white/40 text-[10px] sm:text-xs mt-1 leading-relaxed">
                              معالجة العجز بالمقاييس اليومية: تفوق في الفصول الاستثنائية لامتصاص التناقص وضمان معدل الكليات الطبية أو الهندسية الطموحة.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
                            {criticalSubjects.slice(0, 4).map((sub, idx) => {
                              let tipText = 'المتابعة المستمرة والتركيز في هذه المادة سيصنع الفارق في المعدل العام.';
                              if (sub.diff > 20) {
                                tipText = 'تحتاج هذه المادة إلى اهتمام مكثف وخطة مراجعة مضاعفة. تشجيع الطالب على التركيز المستمر سيعزز مستواه بقوة ويقلص الفجوة الحالية.';
                              } else if (sub.diff > 10) {
                                tipText = 'جهد إضافي ومراجعة دورية منتظمة في هذه المادة سيسهم بشكل التزام إيجابي في رفع المعدل العام وتحقيق طموح الفارس.';
                              } else if (sub.diff > 5) {
                                tipText = 'مستوى الطالب يحتاج إلى متابعة إضافية بسيطة وتخصيص وقت محدد لحل المزيد من التمارين لضمان الوصول إلى الدرجة المطلوبة.';
                              } else {
                                tipText = 'أداء واعد ومتقارب مع الهدف. قليل من التركيز الإضافي في هذه المادة سيضمن تحقيق التميز والتفوق المنشود.';
                              }

                              return (
                                <div key={`critical_${sub.id}_${idx}`} className="bg-black/35 p-5 rounded-2xl border border-white/5 flex flex-col justify-between gap-3 group hover:border-[#D4AF37]/20 transition-all">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="block text-white font-extrabold text-xs">{sub.name}</span>
                                      <span className="text-white/40 text-[9px] font-bold">الدرجة الفعلية للشهر: <span className="text-rose-400 font-extrabold tabular-nums">{sub.grade}</span></span>
                                    </div>
                                    <span className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[8.5px] font-black px-2 py-0.5 rounded-lg tabular-nums">
                                      عجز ({sub.diff}%) عن الحد الأدنى للكلية
                                    </span>
                                  </div>
                                  <div className="p-3 bg-white/5 rounded-xl text-white/70 text-[9.5px] leading-relaxed font-semibold">
                                    <span className="text-cyan-400 font-black block mb-0.5">🚀 توجيه لرفع المادة:</span>
                                    {tipText}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Timeline to Ministerial Exam */}
                    <div className="space-y-6 w-full relative px-6 py-8">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl rounded-full" />
                      <div>
                        <h3 className="text-white font-extrabold text-sm flex items-center gap-2">
                          <span className="text-[#FFD600]">🏁</span>
                          خارطة طريق الفارس إلى مقعد الجامعة
                        </h3>
                        <p className="text-white/40 text-[10px] sm:text-xs mt-1 leading-relaxed">
                          مراحل السعي الحتمي لفرسان السادس الإمتحاني، موجهة بدقة حسب المستوى الحالي للطالب.
                        </p>
                      </div>

                      {(() => {
                        const gradesArr = Object.values(studentData?.grades?.[selectedGradePeriod] || {}).map(Number).filter(g => !isNaN(g) && g > 0);
                        let avg = gradesArr.length > 0 ? (gradesArr.reduce((a,b)=>a+b,0)/gradesArr.length) : Number(studentData?.averagePercent) || 0;
                        
                        let levelMsg = "بإنتظار تقييم المستوى";
                        let levelColor = "text-white/40";
                        let advice = "المرحلة تتطلب التركيز وبناء الأساس لحين توفر الدرجات.";

                        if (avg > 94) {
                          levelMsg = "مستوى التميز الأقصى - مسار المجموعة الطبية/الهندسية المتقدمة";
                          levelColor = "text-emerald-400";
                          advice = "الحفاظ على النسق التدريبي وحل وزاريات السنوات الصعبة وتجنب الثقة المفرطة.";
                        } else if (avg > 85) {
                          levelMsg = "مستوى متقدم - نحو القمة";
                          levelColor = "text-cyan-400";
                          advice = "دفعة بسيطة في المواد العاثرة تفصلك عن كليات الصف الأول. التركيز في المراجعة الذهبية هو الفيصل.";
                        } else if (avg > 75) {
                          levelMsg = "مستوى جيد - يحتاج لمضاعفة الجهد";
                          levelColor = "text-amber-400";
                          advice = "لا تدع الوقت يتسرب، استثمر فترات المراجعة المكثفة لرفع المعدل وتغطية الثغرات المعرفية.";
                        } else if (avg > 0) {
                          levelMsg = "مستوى حرج - حالة استنفار أكاديمي";
                          levelColor = "text-rose-400";
                          advice = "الرجوع فوراً لأساسيات الفصول الأولى والاستعانة بالكادر التربوي لإنقاذ الموقف قبل الامتحانات الشاملة.";
                        }

                        return (
                          <div className="relative border-r-2 border-[#1c2a4f] mr-4 pr-6 space-y-8 py-2 font-sans text-right">
                            <div className="relative">
                              <div className="absolute -right-[31px] top-1.5 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0c1226] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                              <div>
                                <span className="text-emerald-400 text-[9px] font-black bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">منجزة بنجاح ✔</span>
                                <h4 className="text-white font-extrabold text-xs mt-1.5">مرحلة 1: بناء الأساس</h4>
                                <p className="text-white/40 text-[9px] leading-relaxed mt-1">تثبيت أساسيات القواعد، والتعريفات، وبناء رصيد أوسمة التميز.</p>
                              </div>
                            </div>
    
                            <div className="relative">
                              <div className="absolute -right-[31px] top-1.5 w-4 h-4 bg-cyan-400 rounded-full border-4 border-[#0c1226] shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-pulse" />
                              <div>
                                <span className="text-cyan-400 text-[9px] font-black bg-cyan-500/15 border border-cyan-500/20 px-2 py-0.5 rounded-lg animate-pulse">التوجيه الدقيق للمرحلة الحالية ⚙</span>
                                <h4 className="text-white font-extrabold text-xs mt-1.5">حالة الطالب: <span className={levelColor}>{levelMsg}</span></h4>
                                <p className="text-white/70 font-bold text-[10px] leading-relaxed mt-1.5 bg-black/30 p-3 rounded-xl border border-white/5">{advice}</p>
                              </div>
                            </div>
    
                            <div className="relative opacity-50">
                              <div className="absolute -right-[31px] top-1.5 w-4 h-4 bg-white/20 rounded-full border-4 border-[#0c1226]" />
                              <div>
                                <span className="text-white/40 text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg">المحطة القادمة</span>
                                <h4 className="text-white font-extrabold text-xs mt-1.5">مرحلة 3: المراجعة الشاملة والمكثفة (الذهبية)</h4>
                                <p className="text-white/40 text-[9px] leading-relaxed mt-1">المراجعة المنزلية الحتمية قبل الوزاري وتجنب فقدان التركيز.</p>
                              </div>
                            </div>
    
                            <div className="relative opacity-50">
                              <div className="absolute -right-[31px] top-1.5 w-4 h-4 bg-white/10 rounded-full border-4 border-[#0c1226]" />
                              <div>
                                <span className="text-white/30 text-[9px] font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg">الامتحان النهائي</span>
                                <h4 className="text-white font-extrabold text-xs mt-1.5">مرحلة 4: الامتحان الوزاري الرسمي للتربية ومسار الحسم</h4>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    </>
                    )}


                  </>
                );
              })()}
            </div>
          ) : activeSubPage === "ideas" ? (
            <div className="space-y-0 w-full animate-in fade-in slide-in-from-bottom-4">
              <IdeaBank 
                userId={studentData?.parentCode || auth.currentUser?.uid} 
                userName={studentName ? formatParentGreetingTitle(studentName) : 'ولي أمر'} 
                studentGrade={studentData?.grade} 
                schoolId={schoolId}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
                <XCircle size={48} className="text-white/10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[#FFD600] font-bold text-xl">قيد التحديث</h3>
                <p className="text-white/40 text-sm leading-relaxed max-w-[280px] mx-auto">
                  يتم حالياً تجهيز البيانات الخاصة بـ {currentItem?.name} وربطها بملف {gender === 'female' ? 'الطالبة' : 'الطالب'} {studentName}. 
                  سينبثق المحتوى هنا قريباً!
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return <ParentPortalSkeleton />;
  }

  // Check if account is frozen
  const isAccountFrozen = studentData?.isBanned === true || 
                          studentData?.status === 'frozen' || 
                          studentData?.status === 'مجمّد';
                          
  if (isAccountFrozen) {
    return (
      <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-6 text-center relative" dir="rtl">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all z-50"
          title="عودة"
        >
          <ChevronLeft size={24} className="rotate-180" />
        </button>
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
          <AlertTriangle size={48} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2 font-sans">الحساب مجمد مؤقتاً</h1>
        <p className="text-white/60 text-sm max-w-xs leading-relaxed font-sans">
          نعتذر منك، لقد تم تجميد حساب ولي الأمر من قبل الإدارة. يرجى مراجعة المدرسة لتسوية الأمور الإدارية.
        </p>
        <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm font-sans">تحديث الحالة</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050A18] flex flex-col z-[120] font-sans overflow-hidden" dir="rtl">
      <AnimatePresence>
        {activeSubPage && renderSubPage()}
        {showPaymentView && (
          <motion.div 
            key="payment-view"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 bg-[#090e1d] z-[200] overflow-y-auto overscroll-contain"
          >
            <ParentPaymentView 
              onBack={() => {
                setShowPaymentView(false);
                setSelectedInstallmentId(null);
              }} 
              studentCode={studentCode || studentData?.code || ''}
              senderName={studentName || studentData?.name || 'ولي أمر'}
              studentData={studentData}
              tuitionFee={tuitionFee}
              discountRates={discountRates}
              paymentSettings={paymentSettings}
              adminWhatsapp={schoolInfo.adminWhatsapp}
              initialInstallmentId={selectedInstallmentId || undefined}
            />
          </motion.div>
        )}

        {showTransportView && (
          <motion.div
            key="transport-view"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-0 bg-[#090e1d] z-[200] overflow-y-auto overscroll-contain p-4 md:p-6"
          >
            {/* Header Banner for Transport */}
            <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-[#0a1536] via-[#0D47A1] to-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] min-h-[125px] sm:min-h-[135px] flex items-end pb-3 px-3 sm:px-6 mb-6">
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <BerqCharacter
                  pose="pose_transport_manager"
                  glowColor="gold"
                  className="w-full h-full object-cover relative z-10 scale-105 opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050A18]/95 via-[#050A18]/30 to-transparent pointer-events-none z-10" />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-end text-right min-w-0 pr-1 pl-10 select-none pb-0.5">
                <h2 className="text-white text-xs sm:text-sm md:text-base font-black leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] break-words">
                  غرفة المتابعة - تتبع خطوط النقل والحافلة 🚌
                </h2>
                <div className="flex items-center gap-1 text-[#FFD600] font-bold text-[10px] sm:text-xs md:text-sm tracking-wide drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] mt-0.5 min-w-0 break-words">
                  <span className="shrink-0 text-xs">🏛️</span>
                  <span className="break-words">{schoolName || schoolInfo?.schoolName || schoolInfo?.name || "ثانوية أوائل غماس الأهلية"}</span>
                </div>
                <div className="flex items-center gap-1 text-white/90 font-semibold text-[9.5px] sm:text-xs tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-0.5 min-w-0 break-words">
                  <span className="shrink-0 text-[10px]">⚡</span>
                  <span className="break-words">تتبع حي ومباشر لمسار وموقع الحافلة • الطالب {cleanParentStudentName(studentName)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowTransportView(false)}
                className="absolute top-18 left-3 sm:top-8 sm:left-5 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-black active:scale-95 transition-all flex items-center justify-center text-amber-400 shrink-0 border border-amber-400/60 shadow-2xl backdrop-blur-lg cursor-pointer"
                title="عودة"
              >
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="pt-2">
              <ComingSoonPlaceholder title="تتبع خطوط النقل الذكي" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DigitalReceiptModal 
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        hideActions={true}
      />
        <StudentSupportForm
          isOpen={isSupportFormOpen}
          onClose={() => setIsSupportFormOpen(false)}
          studentName={studentName}
          grade={studentData?.grade || 'General'}
          userId={studentData?.parentCode || auth.currentUser?.uid || ''}
          role="parent"
          isTeacher={false}
          notifications={generalNotifications}
          onDeleteNotification={(id) => setParentNotifications(prev => prev.filter(n => n.id !== id))}
          onClearAllNotifications={() => setParentNotifications([])}
          studentCode={studentData?.studentCode || studentCode}
          parentCode={studentData?.parentCode}
          onMarkAllRead={() => {
            setUnreadSupportCount(0);
            setParentNotifications(prev => prev.map(n => ({ ...n, read: true })));
          }}
          schoolId={schoolId}
        />

        <ExcellenceShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          studentData={studentData}
          academicProfile={academicProfile}
          schoolName={schoolInfo?.schoolName || schoolInfo?.name}
          exportId="achievement-export-card-parent"
        />

      {/* 1. رأس الصفحة الرئيسية لولي الأمر مع رفيق بيرق الرقمي */}
      <header className="shrink-0 z-40 relative px-0 pt-0 pb-0">
        <div className="shrink-0 relative w-full h-[135px] sm:h-[140px] overflow-hidden bg-[#050A18] shadow-[0_10px_30px_rgba(13,71,161,0.4)] flex flex-col justify-end pb-1 pt-2 px-3 sm:px-5">
          {/* خلفية مشعة وتأثيرات ضوئية */}
          <div className="absolute top-0 left-0 w-44 h-44 bg-[#FFD600]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* رفيق بيرق التفاعلي بالفيديو - كامل الهيدر من الحافة إلى الحافة بدون أي حواجز */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <BerqCharacter
              pose="pose_parent_dashboard"
              glowColor="gold"
              className="w-full h-full object-cover relative z-10 scale-105 opacity-100"
            />
            {/* تدرج خفيف في أسفل الهيدر فقط لضمان وضوح النصوص في الأسفل دون التأثير على إضاءة بيرق */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050A18] via-[#050A18]/40 to-transparent pointer-events-none z-10" />
          </div>

          {/* زر الخروج العائم في أعلى اليسار */}
          <div className="absolute top-18 left-3 sm:top-8 sm:left-4 z-30">
            <button 
              onClick={onBack}
              className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-black/80 hover:bg-black active:scale-95 transition-all flex items-center justify-center text-amber-400 hover:text-amber-300 shrink-0 border border-amber-400/60 shadow-2xl cursor-pointer backdrop-blur-lg"
              title="خروج"
            >
              <ArrowRight size={17} className="rotate-180" />
            </button>
          </div>

          {/* محتوى أسفل الهيدر: سطر صورة واسم الطالب فوق سطر اسم المدرسة والمرحلة والوسم متراصين في القاع فوق شريط التبليغات مباشرة */}
          <div className="relative z-20 flex flex-col justify-end w-full min-w-0 mt-auto gap-1 select-none pb-0.5">
            {/* السطر الأول: صورة الطالب وعنوان واسمه بخط صغير متمركز فوق اسم المدرسة مباشرة */}
            <div className="flex items-center gap-2 text-right min-w-0 max-w-[80%] sm:max-w-[85%]">
              <div 
                className={`relative w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 rounded-full border border-amber-400/50 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-[0_0_12px_rgba(0,0,0,0.8)] ring-1 ring-[#FFD600]/40 ${academicProfile?.levelData?.borderClass || 'border-slate-500/30'} bg-cover bg-center overflow-hidden shrink-0`} 
                style={{ backgroundImage: studentData?.avatar ? `url(${studentData.avatar})` : 'none', backgroundColor: '#050A18' }}
              >
                {!studentData?.avatar && (academicProfile?.isEliteStudent ? '👑' : '👨‍🎓')}
              </div>
              <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-[#FFD600] text-[10.5px] sm:text-[11.5px] md:text-xs tracking-tight leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] truncate">
                متابعة الطالب: {cleanParentStudentName(studentName)}
              </h1>
            </div>

            {/* السطر الثاني: ملاصق للقاع فوق التبليغات - اسم المدرسة من اليمين | المرحلة في المنتصف | رتبة الطالب من اليسار */}
            <div className="flex items-center justify-between w-full min-w-0 pt-1 border-t border-white/10 gap-1">
              {/* 1. من اليمين: اسم المدرسة بخط مخصص ليظهر كاملاً بدون اقتطاع */}
              <div className="flex items-center gap-1 text-[#FFD600] font-bold text-[9px] sm:text-[10.5px] md:text-xs tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] shrink-0 max-w-[42%] min-w-0">
                <span className="shrink-0 text-[10px]">🏛️</span>
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{schoolName || schoolInfo?.schoolName || schoolInfo?.name || "ثانوية أوائل غماس الأهلية"}</span>
              </div>

              {/* 2. في المنتصف: اسم المرحلة بخط مباشر وبدون شارة دائرية */}
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-extrabold text-[9px] sm:text-[10.5px] md:text-xs tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)] shrink-0" />
                <span>المرحلة: {studentData?.grade || grade || 'سادس علمي'}</span>
              </div>

              {/* 3. من اليسار: وسم مجتهد / رتبة الطالب بخط مباشر وبدون شارة دائرية */}
              <div className="flex items-center justify-end gap-1 text-amber-300 font-black text-[9px] sm:text-[10.5px] md:text-xs tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] shrink-0 whitespace-nowrap">
                <span className="shrink-0 text-[10px]">🏅</span>
                <span>{academicProfile?.levelData?.label || 'مجتهد برونزي'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* إشعار خطاب مستشار ولي الأمر التفاعلي المباشر */}
        {Boolean(studentData?.prideMessage) && (
          <div 
            onClick={() => {
              setActiveSubPage('excellence');
              if (studentDocId) {
                updateDoc(doc(db, "school_students", studentDocId), { hasUnreadPrideMessage: false }).catch(() => {});
              }
            }}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black px-4 py-2 font-black text-xs flex items-center justify-between shadow-lg cursor-pointer hover:brightness-105 transition-all animate-pulse"
            dir="rtl"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-base animate-bounce">✉️</span>
              <span className="font-extrabold text-[11px] sm:text-xs">
                خطاب جديد من مستشار ولي الأمر ({studentData?.prideMessageSubject || 'مادة الأستاذ'}):
              </span>
              <span className="truncate opacity-90 font-bold text-[10.5px]">"{studentData.prideMessage}"</span>
            </div>
            <div className="bg-black/80 text-amber-300 px-2.5 py-1 rounded-lg text-[9.5px] font-black shrink-0 border border-amber-400/30 flex items-center gap-1 shadow-md">
              <span>عرض الخطاب</span>
              <ArrowLeft size={12} />
            </div>
          </div>
        )}

        {/* شريط التبليغات الجماعية (Broadcast) مدمج مع إشعارات ولي الأمر */}
        <div className="w-full bg-[#fbbf24] font-sans text-black flex items-center h-10 border-b border-black/10 relative overflow-hidden" dir="rtl">
          <style>{`
            @keyframes parent-marquee-scroll-seamless {
              0% { transform: translate3d(-50%, 0, 0); }
              100% { transform: translate3d(0, 0, 0); }
            }
            .parent-marquee-scroller {
              display: flex;
              align-items: center;
              white-space: nowrap;
              animation: parent-marquee-scroll-seamless 25s linear infinite;
              width: max-content;
            }
            .parent-marquee-scroller:hover {
              animation-play-state: paused;
              cursor: pointer;
            }
          `}</style>
          <div className="flex-1 overflow-hidden h-full flex items-center relative" dir="ltr">
             {(() => {
               const broadcastNotifs = [...parentBroadcasts, ...generalNotifications.filter(n => n.type === 'broadcast' || n.title?.includes('تبليغ'))];
               return broadcastNotifs.length === 0 ? (
                 <div className="parent-marquee-scroller font-black text-[11px] md:text-xs tracking-wide opacity-75">
                   {/* First copy */}
                   <div className="flex items-center justify-around px-6 shrink-0 min-w-full gap-12">
                     <span className="shrink-0" dir="rtl">منصة الإدارة: لا توجد تبليغات جماعية عاجلة لأولياء الأمور حالياً...</span>
                     <span className="text-red-700/0 font-extrabold text-sm mx-4 shrink-0">✦</span>
                   </div>
                   {/* Second copy */}
                   <div className="flex items-center justify-around px-6 shrink-0 min-w-full gap-12">
                     <span className="shrink-0" dir="rtl">منصة الإدارة: لا توجد تبليغات جماعية عاجلة لأولياء الأمور حالياً...</span>
                     <span className="text-red-700/0 font-extrabold text-sm mx-4 shrink-0">✦</span>
                   </div>
                 </div>
               ) : (
                 <div className="parent-marquee-scroller font-black text-[11px] md:text-xs tracking-wide">
                   {/* First copy */}
                   <div className="flex items-center justify-around px-6 shrink-0 min-w-full gap-12">
                     <div className="flex items-center gap-12 shrink-0" dir="rtl">
                       {broadcastNotifs.map((n, i) => (
                         <span key={`p_notif_1_${n.id || i}_${i}`} className="flex items-center gap-2 shrink-0">
                           <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                           <span className="text-black font-extrabold">{n.message || n.body || n.text || ''}</span>
                         </span>
                       ))}
                     </div>
                     <span className="text-red-700 font-extrabold text-sm mx-4 animate-pulse shrink-0">✦</span>
                   </div>
                   
                   {/* Second copy */}
                   <div className="flex items-center justify-around px-6 shrink-0 min-w-full gap-12">
                     <div className="flex items-center gap-12 shrink-0" dir="rtl">
                       {broadcastNotifs.map((n, i) => (
                         <span key={`p_notif_2_${n.id || i}_${i}`} className="flex items-center gap-2 shrink-0">
                           <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                           <span className="text-black font-extrabold">{n.message || n.body || n.text || ''}</span>
                         </span>
                       ))}
                     </div>
                     <span className="text-red-700 font-extrabold text-sm mx-4 animate-pulse shrink-0">✦</span>
                   </div>
                 </div>
               );
             })()}
          </div>
          <div className="px-4 text-black bg-[#fbbf24] h-full flex items-center z-10 border-r border-black/10 font-black shadow-[5px_0_15px_rgba(0,0,0,0.05)] select-none shrink-0" dir="rtl">
            <span className="text-[10px] md:text-xs font-black bg-black text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              إشعار عاجل 📡
            </span>
          </div>
        </div>
      </header>

      {/* 2. قائمة الأقسام (أقراص التفاعل السريع) */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-8" style={{ willChange: "scroll-position", WebkitOverflowScrolling: "touch" }}>
        {sections.map((section, sIdx) => (
          <div key={`${section.title}_${sIdx}_section`} className="space-y-4">
            <h2 className="text-white/30 text-xs font-black px-2 tracking-widest uppercase">
              {section.title}
            </h2>
            
            <div className="space-y-3">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={`${item.id}_${sIdx}_${iIdx}_item`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (item.id === "meeting") {
                        setIsLoungeOpen(true);
                        setActiveSubPage('meeting');
                      } else if (item.id === "transport") {
                        setShowTransportView(true);
                      } else if (item.id === "lens") {
                        setParentAttendanceTab('lens');
                        setUnreadLensCount(0);
                        setActiveSubPage('attendance');
                      } else if (item.id === "announcements") {
                        // Mark all unread announcements notifications as read
                        const unreadAnnouncements = (parentNotifications || []).filter(n => !n.read && (n.type === 'broadcast' || n.title?.includes('تبليغ')));
                        unreadAnnouncements.forEach((n: any) => {
                          fetch(`/api/notifications/${n.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ read: true })
                          }).catch(() => {});
                        });
                        setParentNotifications(prev => prev.map(n => (n.type === 'broadcast' || n.title?.includes('تبليغ')) ? { ...n, read: true } : n));
                        setActiveSubPage('announcements');
                      } else {
                        if (item.id === "attendance") {
                          setParentAttendanceTab('attendance');
                          setUnreadLensCount(0);
                        }
                        setActiveSubPage(item.id);
                      }
                    }}
                    className={`bg-[#101935] p-[18px] mb-3 rounded-[20px] flex items-center gap-4 border ${item.border} cursor-pointer hover:bg-[#152042] transition-colors group relative overflow-hidden`}
                  >
                    <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center transition-transform group-hover:scale-110 relative z-10`}>
                      <Icon className={item.color} size={24} />
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white px-1 ml-1 animate-pulse border border-[#101935]">
                          {item.badge > 9 ? '+9' : item.badge}
                        </span>
                      )}
                      {item.id === 'finance' && pendingRequests.some(r => (r.status === 'rejected' || r.status === 'pending') && r.viewedByParent === false) && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-[#101935] shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 z-10 relative">
                      <h3 className="text-white font-bold text-sm leading-tight inline-flex items-center gap-2">
                        {item.name}
                        {item.badge && (
                          <span className="bg-rose-500/20 text-rose-400 text-[9px] px-2 py-0.5 rounded-full font-black">
                            جديد
                          </span>
                        )}
                      </h3>
                    </div>
                    <ChevronLeft size={14} className="text-white/20 group-hover:text-white transition-colors relative z-10" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="h-20" /> {/* Spacer */}
      </div>

      {/* Teacher Direct Chat (Replaced with Lounge) */}
      <AnimatePresence>
        {selectedTeacherForChat && (
          <StudentLounge 
            onClose={() => setSelectedTeacherForChat(null)}
            schoolId={schoolId || studentData?.schoolId || 'school1'}
            grade={studentData?.grade || grade || 'all'}
            isTeacher={false}
            isParent={true}
            userProfile={{
              id: auth.currentUser?.uid || studentCode || 'parent',
              name: `ولي أمر ${cleanParentStudentName(studentName)}`,
              role: 'parent',
              photoURL: null,
              grade: studentData?.grade || grade
            }}
            initialSelectedUser={{
              ...selectedTeacherForChat,
              role: 'teacher'
            }}
          />
        )}
        {isLoungeOpen && (
          <StudentLounge 
            onClose={() => setIsLoungeOpen(false)}
            schoolId={schoolId || studentData?.schoolId || 'school1'}
            grade={studentData?.grade || grade || 'all'}
            isTeacher={false}
            isParent={true}
            userProfile={{
              id: auth.currentUser?.uid || studentCode || 'parent',
              name: `ولي أمر ${cleanParentStudentName(studentName)}`,
              role: 'parent',
              photoURL: null,
              grade: studentData?.grade || grade
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs font-black dir-rtl ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50 shadow-rose-900/40'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 shadow-emerald-900/40'
            }`}
          >
            <Sparkles size={16} className={toast.type === 'error' ? 'text-rose-400' : 'text-emerald-400'} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
