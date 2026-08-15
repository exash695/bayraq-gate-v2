import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { academicService } from '../services/academicService';
import { subscribeToPoseOverrides } from './BerqCharacterManager';
import { generateSingleStudentPDF } from '../utils/studentUtils';
import { useAdminData } from '../hooks/useAdminData';
import { useAcademicActions } from '../hooks/useAcademicActions';
import { GlobalAnnouncementsBanner } from './GlobalAnnouncementsBanner';
import { 
  ArrowRight, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Megaphone, 
  Plus, 
  Save, 
  UserPlus, 
  Database,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  FileSpreadsheet,
  Trash2,
  Bell,
  Clock,
  Check,
  X,
  Lock as LockIcon,
  Fingerprint,
  ShieldCheck,
  PieChart,
  History,
  BookOpenText,
  Activity,
  Layout,
  Sparkles,
  RotateCcw,
  Shirt,
  Lightbulb,
  Bus,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

import { verifyPayment, rejectPayment } from '../services/financeService';

import { ArchiveSection } from './ArchiveSection';
import { CodesSection } from './CodesSection';
import { StudentsSection } from './StudentsSection';
import { ArchiveDetailView } from './ArchiveDetailView';
import { GradingModal } from './GradingModal';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { DiscountSimulatorModal } from './DiscountSimulatorModal';
import { TransportAdmin } from './Transport/AdminTransportManager';
import { FinanceSection } from './FinanceSection';
import { BroadcastSection } from './BroadcastSection';
import { TeachersSection } from './TeachersSection';
import { SupportManager } from './SupportManager';
import { IdeaBankAdminView } from './IdeaBankAdminView';
import { ResourceManager } from './ResourceManager';
import { SubjectManager } from './SubjectManager';
import { AuditLogView } from './AuditLogView';
import { PortalPulseDashboard } from './PortalPulseDashboard';
import { safeStorage, safeSessionStorage } from '../lib/storage';
import { useCachedMedia } from '../hooks/useCachedMedia';

interface AdminDashboardProps {
  schoolName: string;
  adminBranch: 'boys' | 'girls';
  onBack: () => void;
  selectedSchoolId: string | null;
  onSendMessage?: (message: string, targetGrades: string[], duration: number) => void;
  onUpdateMessage?: (broadcastId: string, newMessage: string) => void;
}

const AVAILABLE_GRADES = [
  'أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي',
  'أول متوسط', 'ثاني متوسط', 'ثالث متوسط',
  'رابع علمي', 'رابع أدبي', 'خامس علمي', 'خامس أدبي', 'سادس علمي', 'سادس أدبي'
];

const mascotVideos: Record<string, { src: string; title: string; tip: string }> = {
  pulse: {
    src: '/mascot/sliced_bairaq_sheet5_pose_portal_pulse.mp4',
    title: 'مراقب النبض الذكي',
    tip: 'مرحباً بك في لوحة تحكم نبض البوابة. هنا يمكنك تتبع العمليات الفورية، ومعدلات الدخول، وحالة الأنظمة الحية لحظة بلحظة.'
  },
  finance: {
    src: '/mascot/sliced_bairaq_sheet5_pose_finance_officer.mp4',
    title: 'المسؤول المالي بيرق',
    tip: 'أهلاً بك في قسم الإحصائيات والتحصيلات المالية. يمكنك هنا تدقيق دفعات الأقساط المدرسية واعتماد الرسوم والخصومات بذكاء.'
  },
  codes: {
    src: '/mascot/sliced_bairaq_sheet5_pose_key_master.mp4',
    title: 'حارس الأكواد والتراخيص',
    tip: 'أهلاً بك في مركز التحكم بالتفعيلات. من هنا يمكنك توليد مفاتيح الاشتراك السنوية والتحكم في صلاحيات الحسابات.'
  },
  students: {
    src: '/mascot/sliced_bairaq_sheet5_pose_student_manager.mp4',
    title: 'مدير شؤون الطلاب',
    tip: 'أهلاً بك في قسم الملفات الطلابية والدرجات. هنا يمكنك إدارة بيانات الطلاب والنتائج الأكاديمية ومستويات تقدمهم.'
  },
  broadcast: {
    src: '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4',
    title: 'مذيع البوابة الذكي',
    tip: 'مرحباً بك في الإذاعة المدرسية الذكية. من هنا يمكنك توجيه الإعلانات الصوتية والرسائل العاجلة لجميع هواتف الطلاب وأولياء الأمور.'
  },
  attendance: {
    src: '/mascot/sliced_bairaq_sheet5_pose_discipline_shield.mp4',
    title: 'درع الانضباط المدرسي',
    tip: 'مرحباً بك في سجل الانضباط والمواظبة. يمكنك تسجيل الغياب الفوري، وتقييم السلوك المدرسي، ومتابعة الالتزام بالزي الموحد.'
  },
  uniform: {
    src: '/mascot/sliced_bairaq_sheet5_pose_school_uniform.mp4',
    title: 'مراقب الزي المدرسي',
    tip: 'أهلاً بك في سجل الزي المدرسي والمظهر. تابع التزام الفرسان بضوابط الزي المدرسي المعتمد.'
  },
  teachers: {
    src: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
    title: 'قائد الكادر التعليمي',
    tip: 'مرحباً بك في قسم إدارة الكادر والموظفين. من هنا يمكنك تنسيق جداول الأساتذة وصلاحياتهم وتوزيع المهام الأكاديمية.'
  },
  transport: {
    src: '/mascot/sliced_bairaq_sheet5_pose_transport_manager.mp4',
    title: 'كابتن النقل والرحلات',
    tip: 'مرحباً بك في منصة إدارة الحافلات والنقل الذكي. تتبع خطوط سير الحافلات ومواعيد وصول الطلاب المحدثة تلقائياً.'
  },
  ideas: {
    src: '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4',
    title: 'عبقري بنك الأفكار',
    tip: 'أهلاً بك في مخزن الإبداع والابتكار. هنا تتجمع ملاحظات ومقترحات الطالبات الذكية، اطلّع عليها لتطوير بيئتنا التعليمية.'
  },
  support: {
    src: '/mascot/sliced_bairaq_sheet5_pose_customer_support.mp4',
    title: 'مستشار الدعم والشكاوى',
    tip: 'مرحباً بك في مركز الاستجابة السريعة. نحن هنا لتلقي شكاوى أولياء الأمور وحلها، وتقديم الدعم الفني لضمان أفضل تجربة.'
  },
  resources: {
    src: '/mascot/sliced_bairaq_sheet5_pose_content_control.mp4',
    title: 'حامي بوابة الأمان',
    tip: 'أهلاً بك في مركز مراقبة المحتوى. يتم فحص وتنقية الأوراق التعليمية والمستندات بذكاء للحفاظ على السلامة الفكرية.'
  },
  audit: {
    src: '/mascot/sliced_bairaq_sheet5_pose_activity_logs.mp4',
    title: 'مفتش سجل النشاطات',
    tip: 'مرحباً بك في سجل التدقيق والأمان. نراقب كافة العمليات الإدارية المنفذة في النظام لضمان النزاهة التامة والأمن السيبراني.'
  }
};

const MascotHeaderVideo: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const [customSrc, setCustomSrc] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToPoseOverrides((poses) => {
      setCustomSrc(poses[activeTab] || null);
    });
  }, [activeTab]);

  const originalUrl = customSrc || mascotVideos[activeTab]?.src || mascotVideos.pulse.src;
  const { url: cachedUrl } = useCachedMedia(originalUrl);
  if (!cachedUrl) return null;

  const isImage = cachedUrl.startsWith('data:image/') || cachedUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

  if (isImage) {
    return (
      <img
        key={`mascot-bg-${activeTab}`}
        src={cachedUrl}
        alt="Header Pose"
        className="h-full w-full object-cover select-none opacity-100"
      />
    );
  }

  return (
    <video
      key={`mascot-bg-${activeTab}`}
      src={cachedUrl}
      autoPlay
      loop
      muted
      playsInline
      onError={() => {}}
      className="h-full w-full object-cover select-none opacity-100"
    />
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  schoolName, 
  adminBranch, 
  onBack, 
  selectedSchoolId,
  onSendMessage, 
  onUpdateMessage 
}) => {
  const [tuitionFee, setTuitionFee] = useState<number>(() => {
    const saved = safeStorage.getItem('academy6_tuition_fee');
    if (!saved) return 0;
    const cleaned = saved.replace(/,/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? 0 : num;
  });

  const [installmentPlan, setInstallmentPlan] = useState<any[]>(() => {
    const saved = safeStorage.getItem('academy6_installment_plan');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendanceAction, setAttendanceAction] = useState<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
    period: string;
    reason: string;
  } | null>(null);

  const { students, setStudents, savedLists, setSavedLists, pendingPayments, setPendingPayments, schoolSettings, isLoading } = useAdminData(selectedSchoolId, schoolName);

  useEffect(() => {
    if (schoolSettings?.tuitionFee) {
        const tuition = Number(schoolSettings.tuitionFee);
        setTuitionFee(tuition);
        safeStorage.setItem('academy6_tuition_fee', tuition.toString());
    }
  }, [schoolSettings?.tuitionFee]);

  const [isBusTrackingOpen, setIsBusTrackingOpen] = useState(false);
  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsBusTrackingOpen(!!e.detail);
    };
    window.addEventListener('bus-tracking-toggle', handleToggle);
    return () => {
      window.removeEventListener('bus-tracking-toggle', handleToggle);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'pulse' | 'codes' | 'students' | 'grades' | 'finance' | 'broadcast' | 'teachers' | 'archive' | 'control' | 'ideas' | 'radar' | 'hall' | 'resources' | 'audit' | 'academy' | 'attendance' | 'support' | 'transport'>('pulse');
  const [isAdminSidebarCollapsed, setIsAdminSidebarCollapsed] = useState(false);
  const [isMascotCollapsed, setIsMascotCollapsed] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [isFinanceUnlocked, setIsFinanceUnlocked] = useState(false);
  const [financePIN, setFinancePIN] = useState('');

  // School Uniform configurations & loading state
  const [selectedUniformStage, setSelectedUniformStage] = useState<string>('المرحلة الابتدائية');
  const [isSavingUniform, setIsSavingUniform] = useState<boolean>(false);
  const [uniformConfigs, setUniformConfigs] = useState<Record<string, {
    shirt: string;
    pants: string;
    accessories: string;
    days: string[];
    notes: string;
    isActive: boolean;
  }>>({
    'المرحلة الابتدائية': { shirt: 'أبيض', pants: 'رمادي', accessories: 'حذاء مريح للبنين والبنات', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'], notes: 'يرجى الالتزام بالزي المدرسي للتربية والتعليم والمظهر اللائق لطلابنا.', isActive: true },
    'المرحلة المتوسطة': { shirt: 'أزرق فاتح', pants: 'نيلي', accessories: 'الباج المدرسي وحذاء رياضي مريح أو أسود', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'], notes: 'لتزام الطلبة بالزي الرسمي يعكس انضباطهم وتربيتهم الأخلاقية العالية.', isActive: true },
    'المرحلة الاعدادية': { shirt: 'أبيض / كريمي', pants: 'كحلي غامق', accessories: 'الباج التعريفي للفارس وحذاء رسمي أو أسود', days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'], notes: 'الانضباط بالزي الرسمي جزء أساسي من الهوية الدراسية الملتزمة لطلبة السادس العلمي والأدبي.', isActive: true }
  });

  useEffect(() => {
    if (schoolSettings?.uniformConfigs) {
      setUniformConfigs(schoolSettings.uniformConfigs);
    }
  }, [schoolSettings?.uniformConfigs]);
  
  // Behaviour Control Hook States
  const [attendanceSubTab, setAttendanceSubTab] = useState<'attendance' | 'behavior' | 'uniform'>('attendance');
  const [selectedBehaviorStudent, setSelectedBehaviorStudent] = useState<any | null>(null);
  const [behaviorType, setBehaviorType] = useState<'positive' | 'negative'>('positive');
  const [behaviorAction, setBehaviorAction] = useState<string>('كتاب شكر وتقدير');
  const [behaviorNote, setBehaviorNote] = useState<string>('مشاركة متميزة');
  const [behaviorPoints, setBehaviorPoints] = useState<number>(5);
  const [showCustomBehaviorNoteInput, setShowCustomBehaviorNoteInput] = useState<boolean>(false);
  const [customBehaviorNoteText, setCustomBehaviorNoteText] = useState<string>('');
  const [showCustomBehaviorActionInput, setShowCustomBehaviorActionInput] = useState<boolean>(false);
  const [customBehaviorActionText, setCustomBehaviorActionText] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResettingBehavior, setIsResettingBehavior] = useState<boolean>(false);
  const [isSyncingBehavior, setIsSyncingBehavior] = useState<boolean>(false);
  
  // Track sectional sub-views to hide top-level exit button
  const [studentsSubView, setStudentsSubView] = useState(false);
  const [financeSubView, setFinanceSubView] = useState(false);
  const [codesSubView, setCodesSubView] = useState(false);
  const [supportSubView, setSupportSubView] = useState(false);
  const [teachersSubView, setTeachersSubView] = useState(false);
  
  const GRADES_BY_STAGE: Record<string, string[]> = {
    'المرحلة الابتدائية': ['أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي'],
    'المرحلة المتوسطة': ['أول متوسط', 'ثاني متوسط', 'ثالث متوسط'],
    'المرحلة الاعدادية': ['رابع علمي', 'رابع أدبي', 'خامس علمي', 'خامس أدبي', 'سادس علمي', 'سادس أدبي']
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const mainRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScrollTop = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0 });
    };

    // Staggered scrolls to guarantee resetting position during any dynamic page renders
    handleScrollTop();
    const t1 = setTimeout(handleScrollTop, 50);
    const t2 = setTimeout(handleScrollTop, 150);
    const t3 = setTimeout(handleScrollTop, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeTab, isFinanceUnlocked]);

  // Reset all sub-view states when user switches tabs to prevent button stuck state
  useEffect(() => {
    setStudentsSubView(false);
    setFinanceSubView(false);
    setCodesSubView(false);
    setSupportSubView(false);
    setTeachersSubView(false);
  }, [activeTab]);

  // Reset behavior modal states when active student changes
  useEffect(() => {
    if (selectedBehaviorStudent) {
      setShowCustomBehaviorNoteInput(false);
      setCustomBehaviorNoteText('');
      setShowCustomBehaviorActionInput(false);
      setCustomBehaviorActionText('');
      setShowResetConfirm(false);
    }
  }, [selectedBehaviorStudent]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSyncBehavior = async (student: any) => {
    if (!selectedSchoolId) {
      showToast('عذراً، يجب تحديد المدرسة أولاً', 'error');
      return;
    }

    const finalNoteText = showCustomBehaviorNoteInput ? customBehaviorNoteText.trim() : behaviorNote.trim();
    if (!finalNoteText) {
      showToast('الرجاء إدخال أو تحديد ملاحظة سلوكية أولاً', 'error');
      return;
    }

    const finalActionText = showCustomBehaviorActionInput ? customBehaviorActionText.trim() : behaviorAction.trim();
    if (!finalActionText) {
      showToast('الرجاء إدخال الإجراء الإداري المتخذ أولاً', 'error');
      return;
    }

    setIsSyncingBehavior(true);
    try {
      const currentBehavior = student.behavior || {};
      const currentScore = typeof currentBehavior.score === 'number' ? currentBehavior.score : 100;
      const currentLogs = currentBehavior.logs || [];

      // Calculate new score between 0 and 100
      const updatedScore = Math.max(0, Math.min(100, currentScore + behaviorPoints));

      // Generate a new timeline log entry
      const newLog = {
        id: Date.now().toString(),
        type: behaviorType,
        title: finalActionText, // Administrative action / category
        description: finalNoteText,
        date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        scoreEffect: behaviorPoints,
        officialSeal: behaviorType === 'negative', // stamped official admin seal for negative notes!
        createdAt: new Date().toISOString()
      };

      const updatedLogs = [newLog, ...currentLogs];

      // Update student record in Firestore
      await academicService.updateStudent(student.id, {
        behavior: {
          score: updatedScore,
          logs: updatedLogs
        }
      });

      // Generate instant notification for the parent
      const parentNotificationTarget = student.parentCode || `pcode_${student.code || student.id}`;
      await addDoc(collection(db, 'notifications'), {
        userId: parentNotificationTarget,
        studentId: student.id,
        studentCode: student.code || '',
        title: behaviorType === 'positive' ? '🟢 تميز سلوكي مميز جداً' : '🔴 انذار انضباط وسلوك مالي',
        message: behaviorType === 'positive'
          ? `نحيطكم علماً بتميز الطالب ${student.name} بـ (${finalNoteText}). تم شكر الطالب بملف (${finalActionText}) ومنحه +${behaviorPoints} نقاط.`
          : `تنبيه: تم رصد ملاحظة سلوكية (${finalNoteText}) بحق الطالب ${student.name}. الإجراء الإداري المتخذ: (${finalActionText}) وخصم ${Math.abs(behaviorPoints)} نقاط من الانضباط السلوكي.`,
        type: 'support', // Standard type supported by ParentPortal communication lists
        recipientRole: 'parent',
        icon: behaviorType === 'positive' ? 'ShieldCheck' : 'AlertTriangle',
        read: false,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      showToast('⚡ تم المزامنة وحفظ الإجراء بنجاح وإرسال إشعار فوري لولي الأمر!');
      setSelectedBehaviorStudent(null);
    } catch (err) {
      console.error("Failed to sync behavioral action:", err);
      showToast('حدث خطأ أثناء رصد السلوك، يرجى المحاولة لاحقاً', 'error');
    } finally {
      setIsSyncingBehavior(false);
    }
  };

  const handleResetBehavior = async (student: any) => {
    if (!selectedSchoolId) {
      showToast('عذراً، يجب تحديد المدرسة أولاً', 'error');
      return;
    }

    setIsResettingBehavior(true);
    try {
      // Reset behavior fields: score to 100, logs to []
      await academicService.updateStudent(student.id, {
        behavior: {
          score: 100,
          logs: []
        }
      });

      // Send instant notification to the parent notifying them of the behavior record reset
      const parentNotificationTarget = student.parentCode || `pcode_${student.code || student.id}`;
      await addDoc(collection(db, 'notifications'), {
        userId: parentNotificationTarget,
        studentId: student.id,
        studentCode: student.code || '',
        title: '🔄 تصفير وإعادة تعيين سجل السلوك',
        message: `تم تصفير وإعادة تعيين نقاط وسجل السلوك والانضباط بالكامل للطالب ${student.name} من قبل الإدارة، وإرجاع نقاط السلوك إلى 100 نقطة كاملة.`,
        type: 'support',
        recipientRole: 'parent',
        icon: 'ShieldCheck',
        read: false,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      showToast('⚡ تم تصفير وإعادة تعيين سجل سلوك الطالب إلى 100 نقطة بنجاح!');
      setShowResetConfirm(false);
      setSelectedBehaviorStudent(null);
    } catch (err) {
      console.error("Failed to reset student behavior:", err);
      showToast('عذراً، فشل تصفير السلوك السحابة', 'error');
    } finally {
      setIsResettingBehavior(false);
    }
  };

  useEffect(() => {
    safeStorage.setItem('academy6_tuition_fee', tuitionFee.toString());
  }, [tuitionFee, schoolSettings]);
  
  const [subjectMapping, setSubjectMapping] = useState<any>(null);

  useEffect(() => {
    if (!db || !auth.currentUser) return;
    
    const unsub = onSnapshot(doc(db, 'settings', 'subject_mapping'), 
      (doc) => {
        if (doc.exists()) setSubjectMapping(doc.data());
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'settings/subject_mapping', false);
        }
      }
    );
    return () => unsub();
  }, [auth.currentUser]);

  const [pendingSupportCount, setPendingSupportCount] = useState<number>(0);
  const [pendingIdeabankCount, setPendingIdeabankCount] = useState<number>(0);

  useEffect(() => {
    if (!db || !auth.currentUser) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, 
      (snapshot) => {
        const activeTickets = snapshot.docs.map(doc => doc.data())
          .filter(t => !t.broadcastId && t.issueType !== 'تبليغ إداري' && !t.readByAdmin);
        setPendingSupportCount(activeTickets.length);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'support_tickets', false);
        }
      }
    );
    return () => unsub();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!db || !auth.currentUser) return;

    const q = query(
      collection(db, 'idea_bank'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, 
      (snapshot) => {
        setPendingIdeabankCount(snapshot.docs.length);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.GET, 'idea_bank', false);
        }
      }
    );
    return () => unsub();
  }, [auth.currentUser]);
  
  const { 
    saveList: handleSaveList, 
    deleteEntity: handleDelete, 
    updateStudent: handleUpdateStudent, 
    updateList: handleUpdateList,
    isSaving 
  } = useAcademicActions(showToast);

  const [selectedArchiveList, setSelectedArchiveList] = useState<{ id: string; name: string; date: string; students: any[] } | null>(null);
  const [listToEdit, setListToEdit] = useState<any | null>(null);
  const [authModalPayment, setAuthModalPayment] = useState<any | null>(null);
  const [authPIN, setAuthPIN] = useState('');
  const [showDigitalReceipt, setShowDigitalReceipt] = useState<{adminName: string, studentName: string, amount: number, time: Date, method?: string} | null>(null);
  const [showDiscountSimulator, setShowDiscountSimulator] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const discountLabels = {
    SIBLINGS: 'خصم إخوة',
    MARTYRS: 'شهداء',
    SOCIAL_CARE: 'رعاية',
    EXEMPTION: 'إعفاء',
    ORPHANS: 'أيتام',
    TEACHER_CHILDREN: 'ابناء الاساتذة',
    NONE: 'لا يوجد خصم'
  };

  const handleSaveUniformSettings = async () => {
    if (!selectedSchoolId) {
      showToast('خطأ: لم يتم تحديد مدرسة لمزامنة البيانات سحابياً', 'error');
      return;
    }
    
    setIsSavingUniform(true);
    try {
      await academicService.updateSchoolSettings(selectedSchoolId, {
        uniformConfigs: uniformConfigs
      });
      showToast('⚡ تم تحديث وحفظ الزي المدرسي الرسمي لكافة المراحل بنجاح وتعميمه سحابياً!', 'success');
    } catch (error) {
      console.error('Error saving uniform settings:', error);
      showToast('عذراً، فشل مزامنة الزي الموحد سحابياً', 'error');
    } finally {
      setIsSavingUniform(false);
    }
  };

  const [discountRates, setDiscountRates] = useState<Record<string, number>>(() => {
    const saved = safeStorage.getItem('academy6_discount_rates');
    const defaults = {
      SIBLINGS: 10,
      MARTYRS: 25,
      SOCIAL_CARE: 15,
      EXEMPTION: 20,
      ORPHANS: 50,
      TEACHER_CHILDREN: 20
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const updateDiscountRate = (type: string, rate: number) => {
    const newRates = { ...discountRates, [type]: rate };
    setDiscountRates(newRates);
    safeStorage.setItem('academy6_discount_rates', JSON.stringify(newRates));
    showToast(`تم تحديث ${discountLabels[type as keyof typeof discountLabels]} إلى ${rate}%`);
  };

  const updateDiscountRates = (newRatesMap: Record<string, number>) => {
    setDiscountRates(prev => {
      const updated = { ...prev, ...newRatesMap };
      safeStorage.setItem('academy6_discount_rates', JSON.stringify(updated));
      return updated;
    });
    showToast('تم تحديث نسب الخصم بنجاح');
  };

  const tabs = [
    { id: 'pulse', name: 'نبض البوابة', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 'finance', name: 'الموقف المالي والإحصائيات', icon: PieChart, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'codes', name: 'مركز الأكواد', icon: QrCode, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'students', name: 'شؤون الطلاب والدرجات', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'broadcast', name: 'الإذاعة المدرسية', icon: Megaphone, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { id: 'attendance', name: 'سجل الانضباط المدرسي', icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'teachers', name: 'الكادر والموظفين', icon: BookOpenText, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
    { id: 'resources', name: 'مركز مراقبة المحتوى', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'audit', name: 'سجل النشاطات', icon: History, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: "transport", name: "إدارة النقل المدرسي", icon: Bus, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: 'ideas', name: 'بنك الأفكار', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { id: 'support', name: 'الدعم والشكاوى', icon: AlertCircle, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  ];


  const handleTuitionUpdate = async (newFee: number) => {
    setTuitionFee(newFee);
    safeStorage.setItem('academy6_tuition_fee', newFee.toString());
    
    if (selectedSchoolId) {
      try {
        await academicService.updateSchoolSettings(selectedSchoolId, {
          tuitionFee: newFee
        });
        showToast('تم تعميم مبلغ الاشتراك الجديد على كافة أقسام النظام', 'success');
      } catch (error) {
        console.error('Error updating tuition fee in DB:', error);
        showToast('حدث خطأ أثناء المزامنة مع قاعدة البيانات', 'error');
      }
    }
  };

  const handlePrintCard = (student: any) => {
    generateSingleStudentPDF(student);
    handleUpdateStudent(student.id, { status: 'مطبوع' });
    showToast(`تم إنشاء بطاقة ${student.name} بصيغة PDF.`);
  };

  const isAnySubViewOpen = 
    studentsSubView || 
    financeSubView || 
    codesSubView || 
    supportSubView || 
    teachersSubView ||
    selectedArchiveList !== null || 
    selectedBehaviorStudent !== null || 
    gradingStudent !== null || 
    showDigitalReceipt !== null || 
    attendanceAction !== null || 
    listToEdit !== null ||
    isBusTrackingOpen;

  const effectiveHeaderTab = (activeTab === 'attendance' && attendanceSubTab === 'uniform') 
    ? 'uniform' 
    : activeTab;

  return (
    <div className="fixed inset-0 bg-[#050A18] flex flex-col z-[500] font-sans overflow-x-hidden" dir="rtl">
      
      {!isAnySubViewOpen && (
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            if (activeTab !== 'pulse') {
              setActiveTab('pulse');
              setIsHeaderCollapsed(false);
            } else {
              if (isHeaderCollapsed) {
                setIsHeaderCollapsed(false);
              } else {
                onBack();
              }
            }
          }}
          className="fixed top-2 right-2 md:right-4 z-[600] w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-[#101935]/95 backdrop-blur-3xl border border-amber-500/40 hover:border-amber-400 text-amber-500 hover:text-amber-400 flex items-center justify-center shadow-[0_4px_25px_rgba(212,175,55,0.15)] hover:shadow-[0_6px_35px_rgba(212,175,55,0.35)] transition-all duration-300 group cursor-pointer"
          title={isHeaderCollapsed ? "عرض لوحة التحكم الكاملة" : "رجوع للرئيسية"}
        >
          <ArrowRight size={22} strokeWidth={3} className="transition-transform duration-300 group-hover:-translate-x-1" />
        </motion.button>
      )}

      <motion.header 
        initial={false}
        animate={{ 
          height: isHeaderCollapsed ? (window.innerWidth < 768 ? 58 : 66) : (window.innerWidth < 768 ? 144 : 176), 
          backgroundColor: isHeaderCollapsed ? "rgba(10, 16, 36, 0.92)" : "rgba(5, 10, 24, 1)",
          backdropFilter: isHeaderCollapsed ? "blur(20px)" : "blur(0px)",
          borderColor: isHeaderCollapsed ? "rgba(255, 214, 0, 0.25)" : "rgba(255, 255, 255, 0.1)"
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => {
          if (isHeaderCollapsed) {
            setIsHeaderCollapsed(false);
          }
        }}
        className={`shrink-0 rounded-none md:rounded-bl-[32px] shadow-2xl relative overflow-hidden w-full border-b flex items-end pb-3 md:pb-5 z-[400] ${isHeaderCollapsed ? "cursor-pointer hover:bg-[#0a1024]" : ""}`}
        style={{ willChange: "height, background-color" }}
      >
        {/* Full Header Ambient Mascot Video Backdrop */}
        <motion.div
          animate={{
            opacity: isHeaderCollapsed ? 0.25 : 1,
            scale: isHeaderCollapsed ? 1.05 : 1,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        >
          <MascotHeaderVideo activeTab={effectiveHeaderTab} />
          {/* Dynamic dark gradient background overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050A18]/95 via-[#050A18]/50 to-transparent pointer-events-none z-10" />
        </motion.div>

        {/* Expanded State Content */}
        <motion.div 
          animate={{
            opacity: isHeaderCollapsed ? 0 : 1,
            y: isHeaderCollapsed ? -20 : 0,
            scale: isHeaderCollapsed ? 0.95 : 1,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto flex items-end justify-between relative z-10 w-full px-4 md:px-8 pointer-events-none"
          style={{ pointerEvents: isHeaderCollapsed ? "none" : "auto" }}
        >
          {/* Right Side: Tab/Section Info Stack */}
          <div className="flex items-center gap-3 md:gap-4 text-right select-none">
            <motion.div 
              key={`icon-${effectiveHeaderTab}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-2.5 md:p-3 bg-white/10 rounded-2xl border border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] text-[#FFD600] shrink-0"
            >
              {(() => {
                const ActiveTabIcon = tabs.find(t => t.id === activeTab)?.icon || Database;
                return <ActiveTabIcon size={22} className="text-[#FFD600] md:w-6 md:h-6" />;
              })()}
            </motion.div>
            
            <div className="flex flex-col justify-end">
              <h1 className="text-white font-black text-lg md:text-2xl tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                لوحة إدارة {adminBranch === 'girls' ? 'البنات' : 'البنين'}
              </h1>
              <p className="text-white/90 text-xs md:text-sm font-semibold tracking-wide mt-0.5 drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
                {schoolName}
              </p>
            </div>
          </div>

          {/* Left Side: Active Mascot Persona Pill Badge */}
          <div className="hidden sm:flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-400/30 shadow-lg">
            <div className="w-8 h-8 rounded-full border border-amber-400/60 overflow-hidden relative shrink-0">
              <MascotHeaderVideo activeTab={effectiveHeaderTab} />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-black text-amber-300">
                {mascotVideos[effectiveHeaderTab]?.title || "مساعد البوابة"}
              </span>
              <span className="text-[9px] font-bold text-white/60">نشط الآن</span>
            </div>
          </div>
        </motion.div>

        {/* Collapsed Glass Compact Bar Content */}
        <motion.div
          initial={false}
          animate={{
            opacity: isHeaderCollapsed ? 1 : 0,
            y: isHeaderCollapsed ? 0 : 15,
            scale: isHeaderCollapsed ? 1 : 0.95,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-20 flex items-center justify-between px-4 md:px-8"
          style={{ pointerEvents: isHeaderCollapsed ? "auto" : "none" }}
        >
          {/* Right side: Section title next to Back Button */}
          <div className="flex flex-col text-right pr-[52px] md:pr-[72px] select-none justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_#34d399]" />
              <div className="flex items-center gap-1.5">
                {(() => {
                  const ActiveTabIcon = tabs.find(t => t.id === activeTab)?.icon || Database;
                  return <ActiveTabIcon size={15} className="text-[#FFD600] shrink-0" />;
                })()}
                <span className="text-white font-black text-xs sm:text-sm whitespace-nowrap">
                  {tabs.find(t => t.id === activeTab)?.name || ""}
                </span>
              </div>
            </div>
            <span className="text-white/60 text-[10px] sm:text-xs font-bold truncate max-w-[180px] sm:max-w-[320px] pr-3.5 mt-0.5 leading-tight">
              {schoolName}
            </span>
          </div>

          {/* Central Hint Badge */}
          <div className="hidden md:flex items-center gap-1.5 text-amber-400 text-xs font-black bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse">
            <ChevronDown size={14} className="animate-bounce" />
            <span>انقر لتوسيع لوحة التحكم ⚡</span>
          </div>

          {/* Left side: Sleek Floating Mascot Avatar Circle */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-amber-400/90 bg-[#0A1024] p-0.5 shadow-[0_0_15px_rgba(255,214,0,0.4)] overflow-hidden relative shrink-0">
              <MascotHeaderVideo activeTab={effectiveHeaderTab} />
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Main Workspace with Glassmorphism Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden relative w-full">
        {/* Collapsible Sidebar (Right side in RTL) */}
        <motion.aside
          initial={false}
          animate={{
            width: isAdminSidebarCollapsed 
              ? (window.innerWidth < 768 ? 0 : 80) 
              : (window.innerWidth < 768 ? 220 : 250),
            opacity: (isAdminSidebarCollapsed && window.innerWidth < 768) ? 0 : 1
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`bg-[#0A1024]/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-30 shrink-0 shadow-[2px_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all ${
            isAdminSidebarCollapsed && window.innerWidth < 768 ? 'pointer-events-none' : ''
          }`}
        >
          {/* Sidebar Top Header & Toggle Button */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 bg-white/[0.02]">
            {!isAdminSidebarCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden px-1">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-amber-400" />
                </div>
                <div className="flex flex-col overflow-hidden text-right">
                  <span className="text-xs font-black text-white truncate">أقسام اللوحة</span>
                  <span className="text-[10px] font-bold text-amber-400/80 truncate">التنقل السريع</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsAdminSidebarCollapsed(!isAdminSidebarCollapsed)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:text-amber-300 transition-all cursor-pointer mx-auto"
              title={isAdminSidebarCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
            >
              {isAdminSidebarCollapsed ? (
                <ChevronLeft size={18} strokeWidth={2.5} />
              ) : (
                <ChevronRight size={18} strokeWidth={2.5} />
              )}
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-2 px-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (mainRef.current) {
                      mainRef.current.scrollTop = 0;
                    }
                    if (window.innerWidth < 768) {
                      setIsAdminSidebarCollapsed(true);
                    }
                  }}
                  title={tab.name}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300 relative group cursor-pointer border ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 via-[#101935] to-[#101935] border-amber-500/50 shadow-[0_4px_20px_rgba(255,214,0,0.15)] text-white"
                      : "bg-white/[0.02] border-transparent hover:bg-white/[0.08] hover:border-white/10 text-white/70"
                  }`}
                >
                  {/* Active Indicator Bar on right edge */}
                  {isActive && (
                    <motion.div
                      layoutId="activeAdminTabIndicator"
                      className="absolute right-0 top-2 bottom-2 w-1 bg-[#FFD600] rounded-l-full shadow-[0_0_10px_#FFD600]"
                    />
                  )}

                  {/* Icon with notification badge */}
                  <div className={`p-2 rounded-xl shrink-0 relative transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? tab.bg + " " + tab.color : "bg-white/5 text-white/60"
                  }`}>
                    <Icon size={20} className={isActive ? tab.color : "text-white/70"} />
                    
                    {tab.id === 'finance' && pendingPayments.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-[#0A1024] animate-pulse">
                        {pendingPayments.length}
                      </span>
                    )}
                    {tab.id === 'support' && pendingSupportCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-[#0A1024] animate-pulse">
                        {pendingSupportCount}
                      </span>
                    )}
                    {tab.id === 'ideas' && pendingIdeabankCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-[#0A1024] animate-pulse">
                        {pendingIdeabankCount}
                      </span>
                    )}
                  </div>

                  {/* Label Text */}
                  {!isAdminSidebarCollapsed && (
                    <div className="flex flex-col text-right overflow-hidden flex-1">
                      <span className={`text-xs font-black truncate ${isActive ? "text-amber-400" : "text-white/90"}`}>
                        {tab.name}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.aside>

        {/* Floating toggle button when sidebar is collapsed on mobile */}
        {isAdminSidebarCollapsed && (
          <button
            onClick={() => setIsAdminSidebarCollapsed(false)}
            className="fixed right-3 top-[180px] md:top-[200px] z-[350] p-3 bg-[#0d1533]/95 hover:bg-[#14214d] text-amber-400 transition-all rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] border border-amber-500/40 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
            title="إظهار قائمة الأقسام"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>
        )}

        <main 
          ref={mainRef} 
          onScroll={(e) => {
            const scrollTop = e.currentTarget.scrollTop;
            if (scrollTop > 50 && !isHeaderCollapsed) {
              setIsHeaderCollapsed(true);
            } else if (scrollTop < 10 && isHeaderCollapsed) {
              setIsHeaderCollapsed(false);
            }
          }}
          className="flex-1 overflow-y-auto overflow-x-hidden w-full py-3 md:py-4 no-scrollbar px-3 md:px-6"
        >
        <GlobalAnnouncementsBanner dashboardType="admin" schoolId={selectedSchoolId} />
        <AnimatePresence mode="wait">
          {activeTab === 'pulse' && (
            <motion.div 
               key="pulse-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
              <PortalPulseDashboard showToast={showToast} schoolName={schoolName} selectedSchoolId={selectedSchoolId} />
            </motion.div>
          )}

          {activeTab === 'codes' && (
            <motion.div 
               key="codes-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
              {selectedArchiveList ? (
                <ArchiveDetailView 
                  selectedArchiveList={selectedArchiveList}
                  setSelectedArchiveList={setSelectedArchiveList}
                  showToast={showToast}
                  schoolName={schoolName}
                  onEdit={(list) => {
                    setListToEdit(list);
                    setSelectedArchiveList(null);
                  }}
                  discountLabels={discountLabels}
                  tuitionFee={tuitionFee}
                  discountRates={discountRates}
                />
              ) : (
                <>
                  <CodesSection 
                    schoolName={schoolName}
                    adminBranch={adminBranch}
                    availableGrades={AVAILABLE_GRADES}
                    discountLabels={discountLabels}
                    discountRates={discountRates}
                    showToast={showToast}
                    savedLists={savedLists}
                    setSavedLists={setSavedLists}
                    tuitionFee={tuitionFee}
                    installmentPlan={installmentPlan}
                    listToEdit={listToEdit}
                    setListToEdit={setListToEdit}
                    onSaveList={(list) => handleSaveList(selectedSchoolId || '', list)}
                    isSaving={isSaving}
                    onSubViewChange={setCodesSubView}
                  />

                  <ArchiveSection 
                    savedLists={savedLists}
                    setSavedLists={setSavedLists}
                    setSelectedArchiveList={setSelectedArchiveList}
                    showToast={showToast}
                    onDelete={(id) => handleDelete('academic_lists', id)}
                  />
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div 
               key="students-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
              <StudentsSection 
                students={students}
                setStudents={setStudents}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                savedLists={savedLists}
                setSavedLists={setSavedLists}
                adminBranch={adminBranch}
                schoolName={schoolName}
                showToast={showToast}
                handlePrintCard={handlePrintCard}
                setGradingStudent={setGradingStudent}
                tuitionFee={tuitionFee}
                discountRates={discountRates}
                onUpdateList={(list) => handleUpdateList(selectedSchoolId || '', list)}
                onDeleteList={(id) => handleDelete('academic_lists', id)}
                subjectMapping={subjectMapping}
                isSaving={isSaving}
                onSubViewChange={setStudentsSubView}
              />
              
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div 
               key="attendance-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6 px-4"
            >
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 text-right" style={{ direction: 'rtl' }}>
                 <h2 className="text-white font-black text-xl">نظام سجل الانضباط المدرسي المتكامل</h2>
                 <span className="text-[10px] text-[#FFD600] font-black bg-[#FFD600]/10 border border-[#FFD600]/20 px-3 py-1 rounded-full">{schoolName}</span>
               </div>
               
               {/* Smart and Smooth Tab Switcher (Glassy Design with 3 options) */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#101935]/85 p-1.5 rounded-2xl border border-white/5 w-full hover:border-white/10 transition-all backdrop-blur-md">
                 <button
                   onClick={() => setAttendanceSubTab('attendance')}
                   className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${attendanceSubTab === 'attendance' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/15 font-black scale-[1.01]' : 'text-white/40 hover:text-white/80'}`}
                 >
                   <span className="text-[14px]">📅</span>
                   <span>رصد الحضور والغياب اليومي</span>
                 </button>
                 <button
                   onClick={() => setAttendanceSubTab('behavior')}
                   className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${attendanceSubTab === 'behavior' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/15 font-black scale-[1.01]' : 'text-white/40 hover:text-white/80'}`}
                 >
                   <span className="text-[14px]">🛡️</span>
                   <span>غرفة التحكم السلوكي والانضباط</span>
                 </button>
                 <button
                   onClick={() => setAttendanceSubTab('uniform')}
                   className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${attendanceSubTab === 'uniform' ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/15 font-black scale-[1.01]' : 'text-white/40 hover:text-white/80'}`}
                 >
                   <span className="text-[14px]">👔</span>
                   <span>الزي المدرسي الرسمي</span>
                 </button>
               </div>

               {attendanceSubTab === 'uniform' ? (
                 <div className="space-y-6 text-right animate-in fade-in" style={{ direction: 'rtl' }}>
                   <div className="bg-gradient-to-br from-[#0c1329] to-[#080d1d] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                     <div className="absolute top-0 left-0 w-44 h-44 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                     <div className="absolute bottom-0 right-0 w-36 h-36 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
                       <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
                           <Shirt size={28} className="animate-pulse" />
                         </div>
                         <div>
                           <h3 className="text-xl font-black text-white">إعدادات الزي المدرسي الرسمي</h3>
                           <p className="text-white/40 text-xs font-bold mt-0.5">تحديد مواصفات ونظام الزي الموحد لكل مرحلة وتعميمها على شاشات الطلاب وأولياء الأمور</p>
                         </div>
                       </div>

                       <button
                         onClick={handleSaveUniformSettings}
                         disabled={isSavingUniform}
                         className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer self-end sm:self-auto"
                       >
                         {isSavingUniform ? (
                           <>
                             <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             <span>جاري المزامنة سحابياً...</span>
                           </>
                         ) : (
                           <>
                             <Save size={15} />
                             <span>حفظ وتعميم الزي سحابياً 📡</span>
                           </>
                         )}
                       </button>
                     </div>

                     {/* Stage Tab Selector */}
                     <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5 mb-6">
                       {['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الاعدادية'].map((stage) => {
                         const isActive = selectedUniformStage === stage;
                         return (
                           <button
                             key={stage}
                             onClick={() => setSelectedUniformStage(stage)}
                             className={`py-3 px-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                               isActive
                                 ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/15 scale-[1.01]'
                                 : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                             }`}
                           >
                             {stage}
                           </button>
                         );
                       })}
                     </div>

                     {/* Main configurations card for the selected stage */}
                     <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {/* Top Portion (Shirt) */}
                         <div className="space-y-2 bg-[#101424] p-5 rounded-2xl border border-white/5">
                           <label className="text-xs text-indigo-400 font-extrabold flex items-center gap-1.5 mb-1">
                             <span>👔</span>
                             <span>الزي العلوي (القميص / التيشيرت)</span>
                           </label>
                           <input
                             type="text"
                             id={`uniform-shirt-${selectedUniformStage}`}
                             value={uniformConfigs[selectedUniformStage]?.shirt || ''}
                             onChange={(e) =>
                               setUniformConfigs((prev) => ({
                                 ...prev,
                                 [selectedUniformStage]: {
                                   ...prev[selectedUniformStage],
                                   shirt: e.target.value,
                                 },
                               }))
                             }
                             placeholder="مثال: قميص أبيض بأكمام طويلة..."
                             className="w-full h-11 px-4 bg-black/30 border border-white/10 rounded-xl text-white font-bold text-xs outline-none focus:border-indigo-500 transition-all text-right"
                           />
                           {/* Predefined Suggestions */}
                           <div className="flex flex-wrap gap-1.5 mt-2">
                             {['أبيض صدفي', 'أزرق فاتح', 'رمادي ملائم', 'نشائي/كريمي'].map((suggest) => (
                               <button
                                 key={suggest}
                                 type="button"
                                 onClick={() =>
                                   setUniformConfigs((prev) => ({
                                     ...prev,
                                     [selectedUniformStage]: {
                                       ...prev[selectedUniformStage],
                                       shirt: suggest,
                                     },
                                   }))
                                 }
                                 className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/10 text-indigo-300 transition-all cursor-pointer"
                               >
                                 {suggest}
                               </button>
                             ))}
                             {/* Custom / Manual button */}
                             <button
                               type="button"
                               onClick={() => {
                                 const el = document.getElementById(`uniform-shirt-${selectedUniformStage}`);
                                 if (el) {
                                   (el as HTMLInputElement).focus();
                                   showToast('قم بكتابة خيارك المخصص مباشرة في الحقل أعلاه ✍️', 'info');
                                 }
                               }}
                               className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 transition-all cursor-pointer"
                             >
                               ✍️ مخصص
                             </button>
                           </div>
                         </div>

                         {/* Bottom Portion (Pants / Skirt) */}
                         <div className="space-y-2 bg-[#101424] p-5 rounded-2xl border border-white/5">
                           <label className="text-xs text-cyan-400 font-extrabold flex items-center gap-1.5 mb-1">
                             <span>👖</span>
                             <span>الزي السفلي (بنطال / تنورة)</span>
                           </label>
                           <input
                             type="text"
                             id={`uniform-pants-${selectedUniformStage}`}
                             value={uniformConfigs[selectedUniformStage]?.pants || ''}
                             onChange={(e) =>
                               setUniformConfigs((prev) => ({
                                 ...prev,
                                 [selectedUniformStage]: {
                                   ...prev[selectedUniformStage],
                                   pants: e.target.value,
                                 },
                               }))
                             }
                             placeholder="مثال: بنطال كحلي غامق..."
                             className="w-full h-11 px-4 bg-black/30 border border-white/10 rounded-xl text-white font-bold text-xs outline-none focus:border-cyan-500 transition-all text-right"
                           />
                           {/* Predefined Suggestions */}
                           <div className="flex flex-wrap gap-1.5 mt-2">
                             {['رمادي كلاسيك', 'نيلي داكن', 'كحلي غامق', 'أسود وقور', 'بيجي'].map((suggest) => (
                               <button
                                 key={suggest}
                                 type="button"
                                 onClick={() =>
                                   setUniformConfigs((prev) => ({
                                     ...prev,
                                     [selectedUniformStage]: {
                                       ...prev[selectedUniformStage],
                                       pants: suggest,
                                     },
                                   }))
                                 }
                                 className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-500/5 hover:bg-cyan-500/15 border border-cyan-500/10 text-cyan-300 transition-all cursor-pointer"
                               >
                                 {suggest}
                               </button>
                             ))}
                             {/* Custom / Manual button */}
                             <button
                               type="button"
                               onClick={() => {
                                 const el = document.getElementById(`uniform-pants-${selectedUniformStage}`);
                                 if (el) {
                                   (el as HTMLInputElement).focus();
                                   showToast('قم بكتابة خيارك المخصص مباشرة في الحقل أعلاه ✍️', 'info');
                                 }
                               }}
                               className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 transition-all cursor-pointer"
                             >
                               ✍️ مخصص
                             </button>
                           </div>
                         </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         {/* Footwear & Accessories */}
                         <div className="space-y-2 bg-[#101424] p-5 rounded-2xl border border-white/5">
                           <label className="text-xs text-purple-400 font-extrabold flex items-center gap-1.5 mb-1">
                             <span>👟</span>
                             <span>الأحذية والمستلزمات الثانوية</span>
                           </label>
                           <input
                             type="text"
                             id={`uniform-acc-${selectedUniformStage}`}
                             value={uniformConfigs[selectedUniformStage]?.accessories || ''}
                             onChange={(e) =>
                               setUniformConfigs((prev) => ({
                                 ...prev,
                                 [selectedUniformStage]: {
                                   ...prev[selectedUniformStage],
                                   accessories: e.target.value,
                                 },
                               }))
                             }
                             placeholder="مثال: حذاء أسود مريح والباج الترحيبي..."
                             className="w-full h-11 px-4 bg-black/30 border border-white/10 rounded-xl text-white font-bold text-xs outline-none focus:border-purple-500 transition-all text-right"
                           />
                           {/* Predefined Suggestions for Footwear */}
                           <div className="flex flex-wrap gap-1.5 mt-2">
                             {['حذاء أسود رسمي', 'حذاء رياضي مريح', 'الباج المدرسي وحذاء عادي'].map((suggest) => (
                               <button
                                 key={suggest}
                                 type="button"
                                 onClick={() =>
                                   setUniformConfigs((prev) => ({
                                     ...prev,
                                     [selectedUniformStage]: {
                                       ...prev[selectedUniformStage],
                                       accessories: suggest,
                                     },
                                   }))
                                 }
                                 className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/10 text-purple-300 transition-all cursor-pointer"
                               >
                                 {suggest}
                               </button>
                             ))}
                             {/* Custom / Manual button */}
                             <button
                               type="button"
                               onClick={() => {
                                 const el = document.getElementById(`uniform-acc-${selectedUniformStage}`);
                                 if (el) {
                                   (el as HTMLInputElement).focus();
                                   showToast('قم بكتابة خيارك المخصص مباشرة في الحقل أعلاه ✍️', 'info');
                                 }
                               }}
                               className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-amber-300 transition-all cursor-pointer"
                             >
                               ✍️ مخصص
                             </button>
                           </div>
                         </div>

                         {/* Uniform Status toggle & Switch */}
                         <div className="space-y-2 bg-[#101424] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                           <div>
                             <label className="text-xs text-rose-400 font-extrabold flex items-center gap-1.5 mb-1">
                               <span>📢</span>
                               <span>حالة تفعيل التنبيه بالزي</span>
                             </label>
                             <p className="text-[11px] text-white/40 leading-relaxed font-semibold">تفعيل إظهار وتنبيه الزي المدرسي على منصة الطلاب لتذكير الفرسان بالزي المطلوب قبل الدوام.</p>
                           </div>
                           
                           <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl border border-white/5 mt-2">
                             <span className="text-xs text-white font-bold">
                               {uniformConfigs[selectedUniformStage]?.isActive ? '🟢 التنبيه مفعّل ونشط على المنصات' : '🔴 التنبيه معطّل ومخفي حالياً'}
                             </span>
                             <button
                               type="button"
                               onClick={() =>
                                 setUniformConfigs((prev) => ({
                                   ...prev,
                                   [selectedUniformStage]: {
                                     ...prev[selectedUniformStage],
                                     isActive: !prev[selectedUniformStage]?.isActive,
                                   },
                                 }))
                               }
                               className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none cursor-pointer flex items-center ${
                                 uniformConfigs[selectedUniformStage]?.isActive ? 'bg-indigo-600 justify-end' : 'bg-white/10 justify-start'
                               }`}
                             >
                               <motion.div layout className="w-5 h-5 rounded-full bg-white shadow" />
                             </button>
                           </div>
                         </div>
                       </div>

                       {/* Operational Days selector */}
                       <div className="bg-[#101424] p-5 rounded-2xl border border-white/5 space-y-3">
                         <label className="text-xs text-[#FFD600] font-extrabold flex items-center gap-1.5">
                           <span>📅</span>
                           <span>أيام الالتزام بالزي الرسمي</span>
                         </label>
                         <p className="text-[11px] text-white/40 leading-relaxed font-semibold">اختر أيام الأسبوع المقررة فيها لبس الزي المدرسي الرسمي للبنين والبنات:</p>
                         
                         <div className="flex flex-wrap gap-2 pt-1.5">
                           {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map((day) => {
                             const stageConfigs = uniformConfigs[selectedUniformStage] || { days: [] };
                             const isChecked = stageConfigs.days?.includes(day);
                             return (
                               <button
                                 key={day}
                                 type="button"
                                 onClick={() => {
                                   const currentDays = stageConfigs.days || [];
                                   const newDays = currentDays.includes(day)
                                     ? currentDays.filter((d) => d !== day)
                                     : [...currentDays, day];
                                   setUniformConfigs((prev) => ({
                                     ...prev,
                                     [selectedUniformStage]: {
                                       ...prev[selectedUniformStage],
                                       days: newDays,
                                     },
                                   }));
                                 }}
                                 className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                                   isChecked
                                     ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 shadow-md shadow-amber-500/5'
                                     : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60 hover:border-white/10'
                                 }`}
                               >
                                 <span>{isChecked ? '✓' : '○'}</span>
                                 <span>{day}</span>
                               </button>
                             );
                           })}
                         </div>
                       </div>

                       {/* Textarea for Special Rules / Instructions */}
                       <div className="bg-[#101424] p-5 rounded-2xl border border-white/5 space-y-2">
                         <label className="text-xs text-white font-extrabold flex items-center gap-1.5">
                           <span>💡</span>
                           <span>توجيهات الإدارة والملاحظات السلوكية</span>
                         </label>
                         <textarea
                           rows={3}
                           value={uniformConfigs[selectedUniformStage]?.notes || ''}
                           onChange={(e) =>
                             setUniformConfigs((prev) => ({
                               ...prev,
                               [selectedUniformStage]: {
                                 ...prev[selectedUniformStage],
                                 notes: e.target.value,
                               },
                             }))
                           }
                           placeholder="اكتب توجيهات سلوكية مخصصة تظهر لأولياء الأمور والطلاب هنا..."
                           className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white font-medium text-xs leading-relaxed outline-none focus:border-indigo-500 transition-all text-right resize-none"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               ) : (
                 <>
                   {!selectedStage ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ direction: 'rtl' }}>
                   {Object.keys(GRADES_BY_STAGE).map(stage => (
                     <button 
                       key={stage}
                       onClick={() => setSelectedStage(stage)}
                       className="bg-[#101935]/80 hover:bg-[#101935] p-6 rounded-2xl border border-white/5 text-white font-black text-center hover:border-purple-500/50 transition-all flex flex-col items-center justify-center gap-2 group active:scale-[0.98]"
                     >
                       <span className="text-xl">🏫</span>
                       <span className="text-sm font-black text-white/95">{stage}</span>
                       <span className="text-[10px] text-white/30 font-bold group-hover:text-purple-400">انقر لعرض الفصول الدراسية</span>
                     </button>
                   ))}
                 </div>
               ) : !selectedGrade ? (
                  <div className="space-y-3 mt-6" style={{ direction: 'rtl' }}>
                    <div className="flex items-center justify-between pb-4">
                      <h3 className="text-white font-black text-base flex items-center gap-2">
                        <span className="text-sm">📌</span>
                        <span>{selectedStage}</span>
                      </h3>
                      <button onClick={() => setSelectedStage(null)} className="text-purple-400 hover:text-purple-300 font-bold text-xs flex items-center gap-1">
                        <span>رجوع للمراحل</span>
                        <span>⬅️</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {GRADES_BY_STAGE[selectedStage].map(grade => (
                        <button 
                          key={grade}
                          onClick={() => setSelectedGrade(grade)}
                          className="bg-[#101935]/80 hover:bg-[#101935] p-4 rounded-2xl border border-white/5 text-white font-bold text-center hover:border-purple-500/50 hover:bg-purple-950/20 transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-2"
                        >
                          <span>📚</span>
                          <span>{grade}</span>
                        </button>
                      ))}
                    </div>
                  </div>
               ) : (
                 <div className="space-y-4 mt-6" style={{ direction: 'rtl' }}>
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <h3 className="text-white font-black text-base">{selectedGrade} ({selectedStage})</h3>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => setSelectedGrade(null)} className="text-blue-400 hover:text-blue-300 font-bold text-xs">تغيير الصف</button>
                         <span className="text-white/20 text-xs">|</span>
                         <button onClick={() => setSelectedStage(null)} className="text-blue-400 hover:text-blue-300 font-bold text-xs">تغيير المرحلة</button>
                      </div>
                    </div>
                    
                    {attendanceSubTab === 'attendance' ? (
                      students
                        .filter(s => (s as any).grade === selectedGrade)
                        .slice()
                        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
                        .map((s, sIdx) => {
                        const today = new Date().toISOString().split('T')[0];
                        const dayLogs = ((s as any).attendance?.logs || []).filter((l: any) => l.date === today);
                        const isEditing = attendanceAction?.studentId === s.id;

                        return (
                          <div key={`adm_stu_${s.id || s.code || sIdx}`} className="bg-[#101935] p-4 rounded-2xl border border-white/5 space-y-4 text-right">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-bold text-sm">{s.name}</span>
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => academicService.updateAttendance(s.id, (s as any).userId, 'present', 'الإدارة', '', 'عام').then(() => {
                                    showToast('تم تسجيل حضور');
                                    setAttendanceAction(null);
                                  })} 
                                  className={`px-3 py-2 rounded-xl font-bold text-[10px] transition-all ${dayLogs.some((l: any) => l.status === 'present') ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                                >
                                  حضور
                                </button>
                                <button 
                                  onClick={() => setAttendanceAction(isEditing && attendanceAction?.status === 'absent' ? null : { studentId: s.id, status: 'absent', period: 'يوم كامل', reason: 'بدون عذر' })} 
                                  className={`px-3 py-2 rounded-xl font-bold text-[10px] transition-all ${dayLogs.some((l: any) => l.status === 'absent') ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'}`}
                                >
                                  غياب
                                </button>
                                <button 
                                  onClick={() => setAttendanceAction(isEditing && attendanceAction?.status === 'late' ? null : { studentId: s.id, status: 'late', period: '1', reason: '' })} 
                                  className={`px-3 py-2 rounded-xl font-bold text-[10px] transition-all ${dayLogs.some((l: any) => l.status === 'late') ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                                >
                                  تأخير
                                </button>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isEditing && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden space-y-3 pt-2 border-t border-white/5"
                                >
                                  <div className="grid grid-cols-2 gap-3 text-right">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] text-white/40 font-bold block">تحديد الوقت/الحصة</label>
                                      <div className="flex flex-wrap gap-1">
                                        {['يوم كامل', '1', '2', '3', '4', '5', '6', '7', '8'].map(p => (
                                          <button 
                                            key={p}
                                            onClick={() => setAttendanceAction({ ...attendanceAction, period: p })}
                                            className={`px-2 h-7 rounded-lg text-[10px] font-bold border transition-all ${attendanceAction.period === p ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
                                          >
                                            {p}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {attendanceAction.status === 'absent' && (
                                      <div className="space-y-1.5">
                                        <label className="text-[10px] text-white/40 font-bold block">سبب العذر</label>
                                        <select 
                                          value={attendanceAction?.reason || 'بدون عذر'}
                                          onChange={(e) => setAttendanceAction({ ...attendanceAction, reason: e.target.value })}
                                          className="w-full bg-[#101935] border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-rose-500/50"
                                        >
                                          <option value="بدون عذر">بدون عذر</option>
                                          <option value="مرضي">عذر مرضي</option>
                                          <option value="إجازة رسمية">إجازة رسمية</option>
                                          <option value="ظرف عائلي">ظرف عائلي</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  <button 
                                    onClick={() => {
                                      academicService.updateAttendance(
                                        s.id, 
                                        (s as any).userId, 
                                        attendanceAction.status, 
                                        'الإدارة', 
                                        attendanceAction.reason, 
                                        attendanceAction.period
                                      ).then(() => {
                                        showToast(`تم تسجيل ${attendanceAction.status === 'absent' ? 'الغياب' : 'التأخير'}`);
                                        setAttendanceAction(null);
                                      });
                                    }}
                                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Check size={14} />
                                    تأكيد التسجيل لـ {attendanceAction.period}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {dayLogs.length > 0 && !isEditing && (
                              <div className="flex flex-wrap gap-2 pt-1 justify-start">
                                {dayLogs.map((log: any, i: number) => (
                                  <div key={`day_log_${i}`} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5 text-[9px]">
                                    <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'present' ? 'bg-emerald-500' : log.status === 'absent' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <span className="text-white/60 font-bold">{log.period}:</span>
                                    <span className="text-white/40">{log.status === 'present' ? 'حاضر' : log.status === 'absent' ? 'غائب' : 'تأخير'}</span>
                                    {log.reason && <span className="text-rose-400/40">({log.reason})</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      students
                        .filter(s => (s as any).grade === selectedGrade)
                        .slice()
                        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
                        .map((s, sIdx) => {
                        const currentScore = typeof (s as any).behavior?.score === 'number' ? (s as any).behavior.score : 100;
                        return (
                          <div key={`beh_stu_${s.id || s.code || sIdx}`} className="bg-[#101935]/60 hover:bg-[#101935] p-4 rounded-2xl border border-white/5 transition-all text-right flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{s.name}</span>
                                <span className="text-[10px] text-white/30 font-mono bg-white/5 px-2 py-0.5 rounded-md">{s.code || 'بدون كود'}</span>
                              </div>
                              <p className="text-[10px] text-white/40 mt-1">تاريخ آخر إجراء سلوكي: {(s as any).behavior?.logs && (s as any).behavior.logs[0] ? (s as any).behavior.logs[0].date : 'لا يوجد سجل سابق'}</p>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <div className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${
                                currentScore >= 95 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : currentScore >= 80 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                <span>مستوى الانضباط: {currentScore}%</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedBehaviorStudent(s);
                                  setBehaviorType('positive');
                                  setBehaviorPoints(5);
                                  setBehaviorAction('كتاب شكر وتقدير');
                                  setBehaviorNote('مشاركة متميزة');
                                  setShowCustomBehaviorNoteInput(false);
                                  setCustomBehaviorNoteText('');
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-purple-600/15 duration-200 transition-all active:scale-[0.97]"
                              >
                                ⚙️ إجراء سلوكي
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                 </div>
               )}
             </>
           )}
           </motion.div>
          )}

          {activeTab === 'finance' && (
            <motion.div 
               key="finance-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
               className="h-full w-full"
            >
              <FinanceSection 
                isFinanceUnlocked={isFinanceUnlocked}
                setIsFinanceUnlocked={setIsFinanceUnlocked}
                financePIN={financePIN}
                setFinancePIN={setFinancePIN}
                correctPIN={schoolSettings?.financePIN}
                selectedSchoolId={selectedSchoolId}
                schoolName={schoolName}
                schoolSettings={schoolSettings}
                pendingPayments={pendingPayments}
                setPendingPayments={setPendingPayments}
                students={students}
                setStudents={setStudents}
                savedLists={savedLists}
                setSavedLists={setSavedLists}
                discountLabels={discountLabels}
                discountRates={discountRates}
                showToast={showToast}
                setShowDiscountSimulator={setShowDiscountSimulator}
                setAuthModalPayment={setAuthModalPayment}
                rejectPayment={rejectPayment}
                tuitionFee={tuitionFee}
                setTuitionFee={handleTuitionUpdate}
                updateDiscountRates={updateDiscountRates}
                gradesByStage={GRADES_BY_STAGE}
                onSubViewChange={setFinanceSubView}
              />
            </motion.div>
          )}

          {activeTab === 'broadcast' && (
            <motion.div 
               key="broadcast-tab"
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
            >
              <BroadcastSection 
                onSendMessage={(msg, targetGrades, duration) => {
                  if (onSendMessage) {
                    onSendMessage(msg, targetGrades, duration);
                  }
                  const targetText = targetGrades.includes('الجميع') 
                    ? 'لجميع الطلاب' 
                    : `لمراحل (${targetGrades.join('، ')})`;
                  showToast(`🚀 تم نشر الرسالة ${targetText} بنجاح`);
                }}
                onUpdateMessage={onUpdateMessage}
                onDeleteMessage={(id) => handleDelete('broadcasts', id)}
                showToast={showToast}
              />
            </motion.div>
          )}

          {activeTab === 'teachers' && (
            <motion.div key="teachers-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <TeachersSection showToast={showToast} schoolId={selectedSchoolId} schoolName={schoolName} onSubViewChange={setTeachersSubView} />
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div key="support-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SupportManager onSubViewChange={setSupportSubView} />
            </motion.div>
          )}

          {activeTab === "transport" && (
            <motion.div key="transport-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <TransportAdmin schoolId={selectedSchoolId || ""} schoolName={schoolName} />
            </motion.div>
          )}
          {activeTab === 'ideas' && (
            <motion.div key="ideabank-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <IdeaBankAdminView schoolId={selectedSchoolId} schoolName={schoolName} />
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div key="resources-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ResourceManager />
            </motion.div>
          )}



          {activeTab === 'audit' && (
            <motion.div key="audit-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AuditLogView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      </div>

      <div className="h-10 shrink-0" />

      <GradingModal 
        gradingStudent={gradingStudent}
        setGradingStudent={setGradingStudent}
        setStudents={setStudents}
        showToast={showToast}
      />

      <DigitalReceiptModal 
        receipt={showDigitalReceipt}
        onClose={() => setShowDigitalReceipt(null)}
      />

      <DiscountSimulatorModal 
        show={showDiscountSimulator}
        onClose={() => setShowDiscountSimulator(false)}
      />

      {/* Security Auth Modal for Payment Confirmation */}
      <AnimatePresence>
        {authModalPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-white"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#101935] border border-white/10 rounded-[40px] p-8 w-full max-w-sm shadow-2xl relative"
            >
               <button 
                  onClick={() => {
                    setAuthModalPayment(null);
                    setAuthPIN('');
                  }}
                  className="absolute top-8 right-8 text-white/30 hover:text-white"
               >
                  <X size={20} />
               </button>

               <div className="w-20 h-20 bg-emerald-500/10 rounded-[30px] flex items-center justify-center text-emerald-400 mx-auto mb-6 border border-emerald-500/20">
                  <Fingerprint size={40} />
               </div>

               <div className="text-center space-y-2 mb-8">
                  <h3 className="text-xl font-black">المصادقة الإدارية</h3>
                  <p className="text-white/40 text-xs font-bold">بصفتك مديراً، أدخل الرمز الخاص لتأكيد قبض دفعة الطالب: {authModalPayment.studentName}</p>
               </div>

               <div className="space-y-4">
                  <input 
                    type="password" 
                    value={authPIN}
                    onChange={(e) => setAuthPIN(e.target.value)}
                    placeholder="رمز التأكيد (PIN)"
                    className="w-full h-16 bg-black/40 border border-white/10 rounded-2xl text-center text-white font-black text-2xl tracking-[0.5em] outline-none focus:border-emerald-500 transition-all font-sans"
                  />
                  
                  <button 
                    onClick={async () => {
                      if (authPIN === (schoolSettings?.financePIN || '1234')) { 
                        try {
                          await verifyPayment(
                            authModalPayment.id, 
                            authModalPayment.studentId, 
                            authModalPayment.studentName, 
                            authModalPayment.amount, 
                            'المدير العام'
                          );
                          setPendingPayments(prev => prev.filter(p => p.id !== authModalPayment.id));
                          
                          // Show receipt after successful confirmation
                          setShowDigitalReceipt({
                            adminName: 'المدير العام',
                            studentName: authModalPayment.studentName,
                            amount: authModalPayment.amount,
                            time: new Date(),
                            method: authModalPayment.method || 'نقدي/مدير'
                          });
                          
                          setAuthModalPayment(null);
                          setAuthPIN('');
                          showToast('تم تأكيد الدفعة بنجاح', 'success');
                        } catch (e: any) {
                          showToast('حدث خطأ أثناء التأكيد', 'error');
                        }
                      } else {
                        showToast('رمز التأكيد غير صحيح', 'error');
                        setAuthPIN('');
                      }
                    }}
                    className="w-full h-16 bg-emerald-500 rounded-2xl text-white font-black text-lg active:scale-95 transition-all shadow-xl shadow-emerald-900/40"
                  >
                    تأكيد نهائي
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛡️ Stunning Behavior & Discipline Control Modal / Center Panel */}
      <AnimatePresence>
        {selectedBehaviorStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-white"
            style={{ direction: 'rtl' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0b1227] border border-white/10 rounded-[32px] p-6 w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {/* Background ambient gold/fuchsia glow effects */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

              <button 
                onClick={() => setSelectedBehaviorStudent(null)}
                className="absolute top-6 left-6 text-white/30 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                  <span className="text-xl">🛡️</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">غرفة المعالجة السلوكية والانضباط</h3>
                  <p className="text-white/40 text-xs font-bold mt-0.5">سجل وضبط سلوك الطالب: <span className="text-[#FFD600]">{selectedBehaviorStudent.name}</span></p>
                </div>
              </div>

              <div className="space-y-5">
                {/* 1. Toggle Type */}
                <div className="space-y-2">
                  <label className="text-[11px] text-white/40 font-bold block">تصنيف الملاحظة السلوكية</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#101935]/85 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setBehaviorType('positive');
                        setBehaviorPoints(5);
                        setBehaviorAction('كتاب شكر وتقدير');
                        setBehaviorNote('مشاركة متميزة');
                        setShowCustomBehaviorNoteInput(false);
                      }}
                      className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${behaviorType === 'positive' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-black' : 'text-white/40 hover:text-white/70'}`}
                    >
                      <span>🟢</span>
                      <span>ملاحظة تميز إيجابي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBehaviorType('negative');
                        setBehaviorPoints(-5);
                        setBehaviorAction('تنبيه شفهي');
                        setBehaviorNote('عدم إحضار الملزمة');
                        setShowCustomBehaviorNoteInput(false);
                      }}
                      className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${behaviorType === 'negative' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20 font-black' : 'text-white/40 hover:text-white/70'}`}
                    >
                      <span>🔴</span>
                      <span>رصد سلوك سلبي</span>
                    </button>
                  </div>
                </div>

                {/* 2. Rapid Selection / Shortcuts list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-white/40 font-bold">المشاهدات والملاحظات السريعة (اختر سريعاً)</label>
                    <button 
                      onClick={() => {
                        setShowCustomBehaviorNoteInput(!showCustomBehaviorNoteInput);
                        if (!showCustomBehaviorNoteInput) {
                          setCustomBehaviorNoteText('');
                        }
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                    >
                      {showCustomBehaviorNoteInput ? 'إلغاء الملاحظة المخصصة' : '💡 كتابة ملاحظة مخصصة...'}
                    </button>
                  </div>

                  {!showCustomBehaviorNoteInput ? (
                    <div className="grid grid-cols-2 gap-1.5 font-sans">
                      {(behaviorType === 'positive'
                        ? ['مشاركة متميزة', 'التفوق في الاختبار', 'الالتزام الكامل بالزي المدرسي', 'الالتزام بالحضور']
                        : ['عدم إحضار الملزمة', 'مخالفة الزي المدرسي الموحد', 'عدم أداء الواجب', 'تأخير متكرر']
                      ).map(shortcut => (
                        <button
                          key={shortcut}
                          type="button"
                          onClick={() => setBehaviorNote(shortcut)}
                          className={`py-2 px-3 rounded-xl text-[11px] font-bold text-right border transition-all whitespace-normal break-words leading-tight h-auto min-h-[52px] flex items-center justify-start gap-1 ${behaviorNote === shortcut ? 'bg-purple-600/15 border-purple-500/40 text-purple-200 shadow-lg shadow-purple-950/20' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                        >
                          <span className="shrink-0 text-amber-400">📌</span>
                          <span>{shortcut}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      dir="rtl"
                      value={customBehaviorNoteText}
                      onChange={(e) => setCustomBehaviorNoteText(e.target.value)}
                      placeholder="اكتب الملاحظة السلوكية المخصصة هنا بدقة..."
                      className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-purple-500/60 transition-all font-bold"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 3. Points selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-white/40 font-bold block">معدل تغير النقاط ({behaviorPoints > 0 ? '+' : ''}{behaviorPoints})</label>
                    <div className="grid grid-cols-4 gap-1">
                      {behaviorType === 'negative' ? (
                        [-5, -10, -15, -20].map(pt => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => setBehaviorPoints(pt)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${behaviorPoints === pt ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-white/5 border-white/5 text-white/55 hover:bg-white/10'}`}
                          >
                            {pt}
                          </button>
                        ))
                      ) : (
                        [5, 10, 15, 20].map(pt => (
                          <button
                            key={pt}
                            type="button"
                            onClick={() => setBehaviorPoints(pt)}
                            className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${behaviorPoints === pt ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/5 text-white/55 hover:bg-white/10'}`}
                          >
                            +{pt}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 4. Action list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-white/40 font-bold block">الإجراء المتخذ رسمياً في الملخص</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setShowCustomBehaviorActionInput(!showCustomBehaviorActionInput);
                          if (!showCustomBehaviorActionInput) {
                            setCustomBehaviorActionText('');
                          }
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                      >
                        {showCustomBehaviorActionInput ? 'إلغاء الإجراء المخصص' : '💡 إجراء مخصص...'}
                      </button>
                    </div>

                    {!showCustomBehaviorActionInput ? (
                      <div className="grid grid-cols-2 gap-1.5 font-sans">
                        {(behaviorType === 'negative'
                          ? ['تنبيه شفهي', 'إنذار أول', 'لفت نظر', 'استدعاء ولي أمر']
                          : ['كتاب شكر وتقدير', 'تكريم أمام زملائه', 'وسام التفوق', 'نقاط تشجيعية']
                        ).map(act => (
                          <button
                            key={act}
                            type="button"
                            onClick={() => setBehaviorAction(act)}
                            className={`py-2 px-3 rounded-xl text-[11px] font-bold text-right border transition-all whitespace-normal break-words leading-tight h-auto min-h-[52px] flex items-center justify-start gap-1 ${behaviorAction === act ? 'bg-[#FFD600]/15 border-[#FFD600]/40 text-[#FFD600] shadow-lg shadow-[#FFD600]/10' : 'bg-white/5 border-white/10 text-white/55 hover:bg-white/10 hover:text-white'}`}
                          >
                            <span className="shrink-0 text-amber-500">📝</span>
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        dir="rtl"
                        value={customBehaviorActionText}
                        onChange={(e) => setCustomBehaviorActionText(e.target.value)}
                        placeholder="اكتب الإجراء الإداري المخصص هنا..."
                        className="w-full h-11 px-4 bg-[#101935]/80 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/60 transition-all font-bold"
                      />
                    )}
                  </div>
                </div>

                {/* Confirm & Sync Action Button with Loader */}
                <button
                  onClick={() => handleSyncBehavior(selectedBehaviorStudent)}
                  disabled={isSyncingBehavior}
                  className={`w-full h-14 rounded-2xl font-black text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-55 cursor-pointer ${
                    behaviorType === 'positive'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/40'
                      : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-rose-950/40'
                  }`}
                >
                  {isSyncingBehavior ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري الحفظ والمزامنة السحابية...</span>
                    </>
                  ) : (
                    <>
                      <span>📡 مزامنة سحابية وحفظ الإجراء السلوكي</span>
                    </>
                  )}
                </button>

                {/* Reset / Delete Behavior Section - Compact & Elegant */}
                <div className="border-t border-white/5 pt-3.5 mt-2">
                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="mx-auto h-9 px-4 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-rose-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>🔄 تصفير وإعادة تعيين سجل السلوك</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 text-right space-y-2 max-w-sm mx-auto">
                      <p className="text-[10px] text-rose-300 font-bold leading-relaxed">⚠️ هل أنت متأكد من مسح جميع الملاحظات والإنذارات السابقة وإعادة السلوك إلى 100؟</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResetBehavior(selectedBehaviorStudent)}
                          disabled={isResettingBehavior}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] rounded-lg transition-all cursor-pointer"
                        >
                          {isResettingBehavior ? 'جاري المسح...' : 'نعم، تصفير السجل'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 font-medium text-[10px] rounded-lg transition-all cursor-pointer"
                        >
                          تراجع
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-6 right-6 z-[200] flex justify-center"
          >
            <div className={`px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 
              toast.type === 'error' ? 'bg-rose-500 text-white' : 
              'bg-blue-500 text-white'
            }`}>
              {toast.type === 'info' ? <Activity size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-bold text-sm">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
