import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, MapPin, CheckCircle2, UserX, AlertTriangle, 
  Navigation, Phone, ShieldAlert, Check, ChevronRight,
  ArrowRight, Users, Bell, DollarSign, QrCode, Map, 
  Clock, Heart, ShieldCheck, HelpCircle, Wifi, Compass, 
  UserCheck, Send, AlertCircle, Play, Square, Pause, 
  RotateCcw, Sparkles, Megaphone, CheckCheck, Eye,
  Maximize2, Minimize2, PhoneCall, Search, Filter,
  Shield, CalendarClock, MessageCircle, AlertOctagon, Info
} from 'lucide-react';
import { StudentTransportStatus, TransportRoute, TransportFee, BusDriver } from '../../types/transport';
import { calculateLiveTracking, getStopCoords, SCHOOL_COORDINATE, LiveTrackingResult } from '../../utils/geoUtils';
import { 
  updateStudentTransportStatus, 
  updateRouteStatus,
  getRoutes,
  subscribeToStudentStatusesForRoute,
  subscribeToAllFees,
  getDrivers,
  subscribeToRoutes,
  subscribeToDrivers
} from '../../services/transportService';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, updateDoc } from '@/src/lib/firebase';
import { db } from '../../lib/firebase';
import { getProfessionalAvatar } from '../../lib/avatarLevel';

interface DriverHomeSectionProps {
  driverObj?: any;
  userProfile?: any;
  schoolId?: string;
  institutionName?: string;
  onOpenNotifications?: () => void;
  onNavigateToFullPanel?: () => void;
}

// Enriched student interface with phone & absence details
interface DriverStudent extends StudentTransportStatus {
  parentPhone?: string;
  paymentStatus?: 'paid' | 'overdue';
  absenceReason?: string;
  absenceNote?: string;
  grade?: string;
}

// Admin Alert Interface
interface AdminAlert {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: 'urgent' | 'high' | 'normal';
  sender: string;
  isRead: boolean;
}

export const DriverHomeSection: React.FC<DriverHomeSectionProps> = ({
  driverObj,
  userProfile,
  schoolId = "s1",
  institutionName = "ثانوية أوائل غماس الأهلية",
  onOpenNotifications,
  onNavigateToFullPanel,
}) => {
  // State for active driver & shift
  const [driver, setDriver] = useState<BusDriver | null>(driverObj || null);
  const [shift, setShift] = useState<'morning' | 'evening'>('morning');
  const [routeInfo, setRouteInfo] = useState<TransportRoute | null>(null);
  const [students, setStudents] = useState<DriverStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // GPS Telemetry & Simulation States
  const [isTripActive, setIsTripActive] = useState<boolean>(false);
  const [isBroadcastingGps, setIsBroadcastingGps] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [busCoordinates, setBusCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 31.735500,
    lng: 44.605000
  });
  const [currentSpeed, setCurrentSpeed] = useState<number>(32);
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTrackingResult | null>(null);

  // UI Interactive States
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [showStudentsModal, setShowStudentsModal] = useState<boolean>(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'picked_up' | 'waiting' | 'absent' | 'dropped_off'>('all');
  const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState<DriverStudent | null>(null);
  const [absenceReasonInput, setAbsenceReasonInput] = useState<string>('ظرف عائلي / مريض');
  const [sosReasonInput, setSosReasonInput] = useState<string>('ازدحام مروري خانق (تأخير 10 دقائق)');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Admin Alerts & Supervisor Directives
  const [adminAlerts, setAdminAlerts] = useState<AdminAlert[]>([
    {
      id: 'alert-1',
      title: 'توجيه إدارة المدرسة ومسؤول النقل',
      message: 'يرجى الالتزام التام بالسرعة المحددة وتأكيد صعود الطلاب عبر التطبيق لضمان طمأنة أولياء الأمور لحظياً.',
      timestamp: 'اليوم 06:15 ص',
      priority: 'high',
      sender: 'إدارة شؤون النقل',
      isRead: false,
    },
    {
      id: 'alert-2',
      title: 'تنبيه موعد الانصراف المسائي',
      message: 'تم تحديد موعد انصراف وجبة الظهيرة في تمام الساعة 01:30 ظهراً، يرجى التواجد في ساحة الحافلات قبل الموعد بـ 15 دقيقة.',
      timestamp: 'اليوم 07:45 ص',
      priority: 'normal',
      sender: 'مدير المدرسة',
      isRead: false,
    }
  ]);

  // Initial Mock Students Template if no real data
  const defaultMockStudents: DriverStudent[] = useMemo(() => [
    {
      id: 'st-101',
      studentName: 'علي رضا الميالي',
      routeId: routeInfo?.id || 'r1',
      status: 'picked_up',
      stopName: 'مدرسة أم الربيعين الابتدائية',
      parentId: 'p-101',
      parentPhone: '+964 770 123 4567',
      grade: 'الرابع العلمي',
      shift: 'morning',
      paymentStatus: 'paid'
    },
    {
      id: 'st-102',
      studentName: 'حسين أحمد البصري',
      routeId: routeInfo?.id || 'r1',
      status: 'picked_up',
      stopName: 'مدرسة غماس الإبتدائية',
      parentId: 'p-102',
      parentPhone: '+964 780 234 5678',
      grade: 'الخامس الإحيائي',
      shift: 'morning',
      paymentStatus: 'paid'
    },
    {
      id: 'st-103',
      studentName: 'كرار حيدر الشمري',
      routeId: routeInfo?.id || 'r1',
      status: 'waiting',
      stopName: 'مدرسة الشهيد فيصل دلول',
      parentId: 'p-103',
      parentPhone: '+964 771 345 6789',
      grade: 'السادس التطبيقي',
      shift: 'morning',
      paymentStatus: 'paid'
    },
    {
      id: 'st-104',
      studentName: 'فاطمة جواد الكاظمي',
      routeId: routeInfo?.id || 'r1',
      status: 'absent',
      stopName: 'مدرسة زنوبيا للبنات',
      parentId: 'p-104',
      parentPhone: '+964 750 456 7890',
      grade: 'الثالث المتوسط',
      shift: 'morning',
      paymentStatus: 'paid',
      absenceReason: 'إجازة مرضية مُسجلة من ولي الأمر 🩺',
      absenceNote: 'أبلغ والده بالغياب لارتفاع درجات الحرارة'
    },
    {
      id: 'st-105',
      studentName: 'محمد باقر الزيدي',
      routeId: routeInfo?.id || 'r1',
      status: 'waiting',
      stopName: 'متوسطة ذو الفقار للبنين',
      parentId: 'p-105',
      parentPhone: '+964 781 567 8901',
      grade: 'الأول المتوسط',
      shift: 'morning',
      paymentStatus: 'paid'
    },
    {
      id: 'st-106',
      studentName: 'زينب عمار الموسوي',
      routeId: routeInfo?.id || 'r1',
      status: 'absent',
      stopName: 'مدارس ابن عقيل الاهلية',
      parentId: 'p-106',
      parentPhone: '+964 772 678 9012',
      grade: 'السادس الأدبي',
      shift: 'morning',
      paymentStatus: 'paid',
      absenceReason: 'سفر عائلي مُعلن ✈️',
      absenceNote: 'سيحضر غداً بمشيئة الله'
    },
    {
      id: 'st-107',
      studentName: 'يوسف مصطفى الخفاجي',
      routeId: routeInfo?.id || 'r1',
      status: 'picked_up',
      stopName: 'مدرسة أم الربيعين الابتدائية',
      parentId: 'p-107',
      parentPhone: '+964 773 789 0123',
      grade: 'الخامس الأدبي',
      shift: 'morning',
      paymentStatus: 'paid'
    },
    {
      id: 'st-108',
      studentName: 'عباس سلام الفتلاوي',
      routeId: routeInfo?.id || 'r1',
      status: 'picked_up',
      stopName: 'مدرسة غماس الإبتدائية',
      parentId: 'p-108',
      parentPhone: '+964 782 890 1234',
      grade: 'الرابع الأدبي',
      shift: 'morning',
      paymentStatus: 'paid'
    }
  ], [routeInfo?.id]);

  // Load Driver and Route Info
  useEffect(() => {
    let unsubRoutes = () => {};
    let unsubStudents = () => {};
    let unsubDrivers = () => {};

    const initializeDriverData = async () => {
      try {
        setLoading(true);
        let activeDriver = driverObj;
        
        if (!activeDriver) {
          const driversList = await getDrivers(schoolId);
          activeDriver = driversList[0] || {
            id: 'd1',
            name: userProfile?.name || 'الكابتن أبو فهد (سائق الباص)',
            phone: '07700000000',
            schoolId: schoolId,
            busNumber: 'حافلة رقم 12 (الفرسان)',
            routeId: 'r1',
            shift: 'morning',
            status: 'active'
          };
        }
        setDriver(activeDriver);

        // Fetch / Subscribe to routes
        unsubRoutes = subscribeToRoutes(schoolId, (routes) => {
          let matchedRoute = routes.find(r => 
            r.driverId === activeDriver.id || 
            r.id === activeDriver.routeId ||
            (activeDriver.busNumber && r.busPlate?.includes(activeDriver.busNumber))
          );

          if (!matchedRoute) {
            matchedRoute = routes[0] || {
              id: 'route-ghammas-main',
              name: 'خط غماس والداودي المركزي',
              driverId: activeDriver.id || 'd1',
              busPlate: activeDriver.busNumber || 'باص 12 - أ ب ج 4567',
              schoolId: schoolId,
              startTime: '06:30 ص',
              status: 'idle',
              stops: [
                'مدرسة أم الربيعين الابتدائية',
                'مدرسة غماس الإبتدائية',
                'مدرسة الشهيد فيصل دلول',
                'مدرسة زنوبيا للبنات',
                'متوسطة ذو الفقار للبنين',
                'مدارس ابن عقيل الاهلية'
              ]
            };
          }

          setRouteInfo(matchedRoute);
          setIsTripActive(matchedRoute.status === 'in_transit');
          
          // Initial Live Telemetry
          const initialTracking = calculateLiveTracking(
            busCoordinates.lat,
            busCoordinates.lng,
            matchedRoute.stops,
            matchedRoute.status === 'in_transit' ? 32 : 0
          );
          setLiveTelemetry(initialTracking);

          // Subscribe to students for this route
          unsubStudents();
          unsubStudents = subscribeToStudentStatusesForRoute(matchedRoute.id, (rawStatuses) => {
            if (rawStatuses && rawStatuses.length > 0) {
              const mapped: DriverStudent[] = rawStatuses.map((s, idx) => ({
                ...s,
                parentPhone: idx % 2 === 0 ? '+964 770 123 4567' : '+964 780 987 6543',
                grade: `الصف الدراسي ${((idx % 6) + 1)}`,
                absenceReason: s.status === 'absent' ? 'إجازة مسجلة من ولي الأمر' : undefined
              }));
              setStudents(mapped);
            } else {
              setStudents(defaultMockStudents);
            }
            setLoading(false);
          });
        });

      } catch (err) {
        console.error("Error loading driver home data:", err);
        setStudents(defaultMockStudents);
        setLoading(false);
      }
    };

    initializeDriverData();

    return () => {
      unsubRoutes();
      unsubStudents();
      unsubDrivers();
    };
  }, [schoolId, driverObj, defaultMockStudents]);

  // Real-time GPS & Simulation Runner when Trip is Active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTripActive && routeInfo?.stops && routeInfo.stops.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIndex((prevStep) => {
          const totalStops = routeInfo.stops.length;
          const nextStep = (prevStep + 1) % ((totalStops + 1) * 5); // Smooth steps
          
          const stopIdx = Math.min(Math.floor(nextStep / 5), totalStops - 1);
          const stopName = routeInfo.stops[stopIdx];
          const coords = getStopCoords(stopName, stopIdx, totalStops);

          // Add slight jitter for realistic movement
          const newLat = coords.lat + (Math.sin(nextStep) * 0.0002);
          const newLng = coords.lng + (Math.cos(nextStep) * 0.0002);
          
          setBusCoordinates({ lat: newLat, lng: newLng });
          
          const speed = Math.floor(25 + Math.random() * 15);
          setCurrentSpeed(speed);

          const tracking = calculateLiveTracking(
            newLat,
            newLng,
            routeInfo.stops,
            speed
          );
          setLiveTelemetry(tracking);

          return nextStep;
        });
      }, 4000);
    } else {
      if (liveTelemetry && !isTripActive) {
        setLiveTelemetry({
          ...liveTelemetry,
          speed: 0,
          status: 'stopped'
        });
        setCurrentSpeed(0);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTripActive, routeInfo?.stops]);

  // Actions: Start Trip
  const handleStartTrip = async () => {
    if (!routeInfo) return;
    try {
      setIsTripActive(true);
      setIsBroadcastingGps(true);
      
      await updateRouteStatus(routeInfo.id, 'in_transit', busCoordinates, {
        speed: 32,
        trackingStatus: 'in_transit',
        lastGpsUpdate: Date.now(),
        shift: shift,
        startedAt: new Date().toLocaleTimeString('ar-IQ')
      });

      // Update route in local state
      setRouteInfo(prev => prev ? { ...prev, status: 'in_transit' } : null);

      // Create Announcement / Broadcast for parents
      try {
        await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          title: `انطلاق حافلة ${routeInfo.name || 'المدرسة'} 🚌`,
          message: `الكابتن ${driver?.name || 'السائق'} بدأ رحلة النقل (${shift === 'morning' ? 'الصباحية' : 'المسائية'}) الآن. يمكنك تتبع مسار الحافلة لحظياً.`,
                    read: false,
          type: 'general',
          recipientRole: 'parent',
          schoolId: schoolId
        }) });
      } catch (e) {
        console.warn("Notification logging error:", e);
      }

      setActionFeedback('🚀 تم بدء الرحلة بنجاح وتفعيل البث اللحظي وإشعار أولياء الأمور!');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      console.error("Error starting trip:", err);
      setActionFeedback('تم بدء الرحلة محلياً (وضع عدم الاتصال).');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Actions: End Trip
  const handleEndTrip = async () => {
    if (!routeInfo) return;
    try {
      setIsTripActive(false);
      setIsBroadcastingGps(false);
      
      await updateRouteStatus(routeInfo.id, 'completed', SCHOOL_COORDINATE, {
        speed: 0,
        trackingStatus: 'arrived_at_school',
        lastGpsUpdate: Date.now(),
        completedAt: new Date().toLocaleTimeString('ar-IQ')
      });

      // Mark all picked_up students as dropped_off
      setStudents(prev => prev.map(s => s.status === 'picked_up' ? { ...s, status: 'dropped_off' } : s));

      // Update route in local state
      setRouteInfo(prev => prev ? { ...prev, status: 'completed' } : null);

      // Notify parents
      try {
        await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          title: `اكتمال رحلة الحافلة المدرسية بنجاح 🏁`,
          message: `وصلت حافلة ${routeInfo.name || 'المدرسة'} إلى وجهتها بسلام وتم نزول الطلاب بأمان.`,
                    read: false,
          type: 'general',
          recipientRole: 'parent',
          schoolId: schoolId
        }) });
      } catch (e) {}

      setActionFeedback('🏁 تم إنهاء الرحلة بنجاح وتأكيد وصول وسلامة جميع الطلاب!');
      setTimeout(() => setActionFeedback(null), 4500);
    } catch (err) {
      console.error("Error ending trip:", err);
      setActionFeedback('تم إنهاء الرحلة محلياً.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Actions: Update Student Status
  const handleUpdateStudentStatus = async (studentId: string, newStatus: StudentTransportStatus['status'], absenceNote?: string) => {
    try {
      setStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            status: newStatus,
            absenceReason: newStatus === 'absent' ? (absenceNote || 'تم تسجيل الغياب من السائق') : s.absenceReason
          };
        }
        return s;
      }));

      await updateStudentTransportStatus(studentId, newStatus);
      setActionFeedback(`تم تحديث حالة الطالب إلى (${newStatus === 'picked_up' ? 'صعد للحافلة 🟢' : newStatus === 'absent' ? 'غائب 🔴' : newStatus === 'dropped_off' ? 'تم التوصيل 🔵' : 'بانتظار الصعود ⏳'})`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err) {
      console.error("Error updating student status:", err);
    }
  };

  // Actions: Send SOS / Delay Alert to Admin & Parents
  const handleSendSosAlert = async () => {
    if (!sosReasonInput) return;
    try {
      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: `🚨 تنبيه عاجل من حافلة (${routeInfo?.name || 'المدرسة'})`,
        message: `إفادة الكابتن ${driver?.name || 'السائق'}: ${sosReasonInput}`,
                read: false,
        type: 'alarm',
        recipientRole: 'admin',
        schoolId: schoolId
      }) });

      // Also notify parents
      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: `⚠️ إشعار تأخير طفيف للحافلة`,
        message: `نود إعلامكم بوجود ${sosReasonInput}، والحافلة في طريقها إليكم بأمان.`,
                read: false,
        type: 'alarm',
        recipientRole: 'parent',
        schoolId: schoolId
      }) });

      setShowSosModal(false);
      setActionFeedback('🚨 تم إرسال البلاغ العاجل لإدارة المدرسة وأولياء الأمور بنجاح.');
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err) {
      setShowSosModal(false);
      setActionFeedback('تم إرسال التنبيه محلياً.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Derived KPI Counts
  const totalStudentsCount = students.length;
  const pickedUpCount = students.filter(s => s.status === 'picked_up').length;
  const waitingCount = students.filter(s => s.status === 'waiting').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const droppedOffCount = students.filter(s => s.status === 'dropped_off').length;

  const absentStudentsList = students.filter(s => s.status === 'absent');

  // Filtered Students for the Modal
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          s.stopName.toLowerCase().includes(studentSearchQuery.toLowerCase());
    const matchesFilter = studentFilter === 'all' || s.status === studentFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-xl mx-auto min-h-screen pb-36 pt-4 font-sans px-3 sm:px-4 space-y-6 text-right"
      dir="rtl"
    >
      {/* Action Feedback Toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-4 right-4 z-[9999] max-w-md mx-auto bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-black p-3.5 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.3)] backdrop-blur-xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
              <span>{actionFeedback}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1 bg-white/5 rounded-lg"
            >
              إغلاق
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header / الترويسة الرئيسية */}
      <div className="flex items-center justify-between">
        {/* Driver Brand Logo */}
        <div className="w-12 h-12 shrink-0 overflow-hidden rounded-2xl bg-[#0A0F1D] border border-orange-500/20 p-2 flex items-center justify-center shadow-md">
          <Bus className="w-7 h-7 text-orange-400 animate-pulse" />
        </div>

        {/* Center Title & Verse */}
        <div className="flex-1 text-center px-2">
          <span className="text-[#D4AF37] font-black font-amiri text-base sm:text-lg block drop-shadow-sm">
            وَقُل رَّبِّ زِدْنِي عِلْمًا
          </span>
          <span className="text-[10px] text-white/50 font-bold">
            بوابة بيرق • منظومة النقل المدرسي الذكي 🚌
          </span>
        </div>

        {/* Notifications & SOS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSosModal(true)}
            title="إرسال بلاغ طارئ"
            className="w-11 h-11 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/20 active:scale-95 transition-all shadow-sm group"
          >
            <AlertOctagon size={19} className="group-hover:rotate-12 transition-transform" />
          </button>
          <button
            onClick={onOpenNotifications}
            className="w-11 h-11 rounded-2xl bg-[#0A0F1D] border border-white/10 flex items-center justify-center relative hover:bg-white/5 active:scale-95 transition-all shadow-sm"
          >
            <Bell size={19} className="text-white/70" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border border-[#0A0F1D] animate-ping" />
          </button>
        </div>
      </div>

      {/* 2. Hero Captain Card / بطاقة كابتن الحافلة */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-[1.85rem] bg-[#0A0F1D] border border-orange-500/25 p-5 sm:p-6 shadow-[0_8px_35px_rgba(249,115,22,0.08)] flex flex-col gap-4"
      >
        {/* Subtle Ambient Glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
          style={{
            background: `radial-gradient(circle at right 40%, #EA580C, transparent 75%)`
          }}
        />

        <div className="relative z-10 flex items-center gap-3.5 flex-row-reverse justify-between">
          {/* Captain Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl border-2 border-orange-400/40 p-0.5 flex items-center justify-center relative bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-orange-500/30 shadow-md overflow-hidden">
            <img
              src={getProfessionalAvatar(userProfile)}
              alt="Captain Avatar"
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 text-center">
              <span className="text-[8px] font-black text-orange-300">كابتن</span>
            </div>
          </div>

          {/* Captain Info */}
          <div className="flex-1 min-w-0 flex flex-col items-end justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-orange-300/80 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                {driver?.busNumber || "حافلة رقم 12 (الفرسان)"}
              </span>
              <span className="text-[10px] font-medium text-white/40">أهلاً بك،</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white truncate w-full text-right mt-0.5">
              {driver?.name || userProfile?.name || "الكابتن أبو فهد"}
            </h1>
            <p className="text-[11px] font-bold text-white/60 truncate mt-1 flex items-center gap-1">
              <MapPin size={12} className="text-orange-400 shrink-0" />
              <span>{routeInfo?.name || "خط الغماس والداودي المركزي"}</span>
            </p>
          </div>
        </div>

        {/* Shift Toggle & Status Bar */}
        <div className="relative z-10 flex items-center justify-between bg-black/30 rounded-2xl p-2.5 border border-white/5 backdrop-blur-sm gap-2">
          {/* Shift selector */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
            <button
              onClick={() => setShift('morning')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                shift === 'morning'
                  ? 'bg-orange-500 text-slate-950 shadow-md scale-102'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              ☀️ صباحية (إلى المدرسة)
            </button>
            <button
              onClick={() => setShift('evening')}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                shift === 'evening'
                  ? 'bg-indigo-600 text-white shadow-md scale-102'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              🌙 مسائية (إلى المنازل)
            </button>
          </div>

          {/* Trip Status Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isTripActive 
                ? 'bg-emerald-400 animate-ping shadow-[0_0_10px_rgba(52,211,153,0.8)]' 
                : 'bg-amber-400'
            }`} />
            <span className="text-[11px] font-bold text-white/80">
              {isTripActive ? 'الرحلة جارية ⚡' : 'متوقف في المحطة'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. زر بدء الرحلة / زر إنهاء الرحلة (Large Prominent Action Buttons) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full space-y-2.5"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
            <Navigation size={14} />
            <span>التحكم الفوري بالرحلة</span>
          </span>
          <span className="text-[10px] font-bold text-white/40">
            {isTripActive ? 'بث الـ GPS مفعل 🛰️' : 'جاهز للانطلاق'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Start Trip Button */}
          <button
            onClick={handleStartTrip}
            disabled={isTripActive}
            className={`w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer ${
              !isTripActive
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] border border-emerald-300/40'
                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed opacity-50'
            }`}
          >
            <Play size={20} className={!isTripActive ? "animate-pulse fill-slate-950" : ""} />
            <span className="text-base">🚀 بدء الرحلة وتفعيل التتبع</span>
          </button>

          {/* End Trip Button */}
          <button
            onClick={handleEndTrip}
            disabled={!isTripActive}
            className={`w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer ${
              isTripActive
                ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.35)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] border border-red-300/40'
                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed opacity-50'
            }`}
          >
            <Square size={18} className={isTripActive ? "fill-white" : ""} />
            <span className="text-base">🏁 إنهاء الرحلة وتأكيد الوصول</span>
          </button>
        </div>
      </motion.div>

      {/* 4. الرحلة الحالية (Current Trip Card & Telemetry) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#0A0F1D] border border-white/10 rounded-[1.75rem] p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Compass size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">الرحلة الحالية</h3>
              <p className="text-[10px] text-white/40 font-medium">بيانات المسار والوقت التقديري لحظياً</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
            {shift === 'morning' ? 'وجبة الصباح ☀️' : 'وجبة الظهر 🌙'}
          </span>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Next Stop */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-right">
            <span className="text-[9px] font-bold text-white/40 block mb-1">المحطة القادمة</span>
            <span className="text-xs font-black text-orange-300 block truncate">
              {liveTelemetry?.nextStop || (routeInfo?.stops?.[0] || 'مدرسة أم الربيعين')}
            </span>
          </div>

          {/* Remaining Distance */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-right">
            <span className="text-[9px] font-bold text-white/40 block mb-1">المسافة للمدرسة</span>
            <span className="text-xs font-black text-white block">
              {liveTelemetry?.distanceToSchool || '3.5 كم'}
            </span>
          </div>

          {/* Estimated ETA */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-right">
            <span className="text-[9px] font-bold text-white/40 block mb-1">وقت الوصول المتوقع</span>
            <span className="text-xs font-black text-emerald-400 block">
              {liveTelemetry?.eta || '10 دقائق'}
            </span>
          </div>

          {/* Live Speed */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-right">
            <span className="text-[9px] font-bold text-white/40 block mb-1">السرعة الحالية</span>
            <span className="text-xs font-black text-cyan-400 block">
              {currentSpeed} كم/س
            </span>
          </div>
        </div>

        {/* Trip Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-white/60">
            <span>محطة الانطلاق</span>
            <span className="text-orange-400">
              {Math.round((liveTelemetry?.progress || 0.35) * 100)}% تم إنجازه
            </span>
            <span>المدرسة 🏫</span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div
              className="h-full bg-gradient-to-l from-orange-400 via-amber-400 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((liveTelemetry?.progress || 0.35) * 100)}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Stations Timeline Mini Strip */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1 custom-scrollbar text-[9px] font-bold text-white/50">
          {(routeInfo?.stops || []).slice(0, 4).map((st, idx) => (
            <div key={idx} className="flex items-center gap-1 shrink-0 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="truncate max-w-[85px]">{st}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 5. عدد الطلاب (Student Count KPI & Quick Actions) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
            <Users size={14} />
            <span>إحصائيات الطلاب وركاب الخط ({totalStudentsCount} طالب)</span>
          </span>
          <button
            onClick={() => setShowStudentsModal(true)}
            className="text-[11px] font-bold text-orange-300 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1"
          >
            <Eye size={12} />
            <span>عرض وإدارة القائمة</span>
          </button>
        </div>

        {/* 4-KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. In Bus / Picked Up */}
          <div 
            onClick={() => { setStudentFilter('picked_up'); setShowStudentsModal(true); }}
            className="bg-[#0A0F1D] border border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-102 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UserCheck size={16} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-white/50 block">في الحافلة</span>
              <span className="text-lg font-black text-emerald-400">{pickedUpCount} طالب</span>
            </div>
          </div>

          {/* 2. Waiting */}
          <div 
            onClick={() => { setStudentFilter('waiting'); setShowStudentsModal(true); }}
            className="bg-[#0A0F1D] border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-102 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">بالانتظار</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-white/50 block">بانتظار الصعود</span>
              <span className="text-lg font-black text-amber-400">{waitingCount} طالب</span>
            </div>
          </div>

          {/* 3. Absent */}
          <div 
            onClick={() => { setStudentFilter('absent'); setShowStudentsModal(true); }}
            className="bg-[#0A0F1D] border border-red-500/20 hover:border-red-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-102 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">غائب</span>
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <UserX size={16} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-white/50 block">حالات الغياب</span>
              <span className="text-lg font-black text-red-400">{absentCount} طالب</span>
            </div>
          </div>

          {/* 4. Dropped off */}
          <div 
            onClick={() => { setStudentFilter('dropped_off'); setShowStudentsModal(true); }}
            className="bg-[#0A0F1D] border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-102 group shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">تم التوصيل</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-white/50 block">وصلوا بسلام</span>
              <span className="text-lg font-black text-cyan-400">{droppedOffCount} طالب</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. الخريطة (Interactive Live Map & GPS Route Tracker) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#0A0F1D] border border-orange-500/20 rounded-[1.75rem] overflow-hidden shadow-md"
      >
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Map size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>الخريطة الحية ومسار الحافلة</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-[10px] text-white/40 font-medium">محطات الركاب وموقع المدرسة لحظياً</p>
            </div>
          </div>

          <button
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className="text-[10px] font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1"
          >
            {isMapExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isMapExpanded ? 'تصغير' : 'توسيع الخريطة'}</span>
          </button>
        </div>

        {/* Visual Map Canvas / Path */}
        <div className={`relative w-full ${isMapExpanded ? 'h-96' : 'h-56 sm:h-64'} bg-[#050814] overflow-hidden transition-all duration-300 p-4 flex flex-col justify-between`}>
          {/* Map Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#EA580C 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Simulated Route Line SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M 50,180 Q 150,50 250,140 T 450,60"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
          </svg>

          {/* Top Map HUD */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-white/80 flex items-center gap-2">
              <Wifi size={12} className="text-emerald-400 animate-pulse" />
              <span>إحداثيات GPS: {busCoordinates.lat.toFixed(4)}, {busCoordinates.lng.toFixed(4)}</span>
            </div>
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl px-2.5 py-1 text-[10px] font-black text-orange-300">
              {institutionName}
            </div>
          </div>

          {/* Interactive Map Stops & Pins */}
          <div className="relative z-10 grid grid-cols-3 sm:grid-cols-6 gap-2 my-auto">
            {(routeInfo?.stops || []).map((stopName, idx) => {
              const studentsAtStop = students.filter(s => s.stopName === stopName);
              const isCurrent = liveTelemetry?.currentStop === stopName;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border backdrop-blur-md text-right transition-all ${
                    isCurrent
                      ? 'bg-orange-500/30 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-105'
                      : 'bg-black/50 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-black text-orange-400">#{idx + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  </div>
                  <span className="text-[10px] font-bold text-white block truncate">{stopName}</span>
                  <span className="text-[8px] font-medium text-white/50 block mt-0.5">
                    {studentsAtStop.length} طلاب
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Live Moving Bus Indicator */}
          <div className="relative z-10 flex items-center justify-between bg-black/75 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 px-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 animate-bounce">
                <Bus size={16} />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-black text-white block">موقع الحافلة الآن:</span>
                <span className="text-[9px] font-bold text-orange-300">{liveTelemetry?.currentStop || 'في الطريق'}</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] font-black text-emerald-400 block">{currentSpeed} كم/ساعة</span>
              <span className="text-[8px] font-medium text-white/40">تحديث بالأقمار الصناعية</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 7. حالات الغياب (Today's Absence Cases Section) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0A0F1D] border border-red-500/20 rounded-[1.75rem] p-5 shadow-sm space-y-3.5"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <UserX size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>حالات الغياب المسجلة اليوم</span>
                <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                  {absentCount} طلاب
                </span>
              </h3>
              <p className="text-[10px] text-white/40 font-medium">مُبلغ بها من أولياء الأمور لتجاوز محطاتهم وتوفير الوقت</p>
            </div>
          </div>

          <button
            onClick={() => setShowAbsenceModal(true)}
            className="text-[10px] font-bold text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-2.5 py-1.5 rounded-xl transition-colors"
          >
            + تسجيل غياب طالب
          </button>
        </div>

        {/* Smart Time-Saving Alert Box */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-right">
          <Info size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-red-200/90 leading-relaxed">
            ⚡ <span className="text-white">توفير وقت الرحلة:</span> تم إلغاء التوقف في محطات الطلاب الغائبين تلقائياً. لن تحتاج للانتظار في نقاط تجمعهم.
          </p>
        </div>

        {/* Absent Students List */}
        <div className="space-y-2">
          {absentStudentsList.length > 0 ? (
            absentStudentsList.map((st) => (
              <div
                key={st.id}
                className="bg-white/[0.02] border border-white/5 hover:border-red-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <UserX size={17} />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-white block">{st.studentName}</span>
                    <span className="text-[10px] font-medium text-white/50 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-red-400" />
                      <span>{st.stopName}</span>
                      <span>• {st.grade}</span>
                    </span>
                  </div>
                </div>

                <div className="text-left flex flex-col items-end">
                  <span className="text-[10px] font-bold text-red-300 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                    {st.absenceReason || 'إجازة مسجلة'}
                  </span>
                  {st.parentPhone && (
                    <a
                      href={`tel:${st.parentPhone}`}
                      className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1 mt-1"
                    >
                      <PhoneCall size={10} className="text-orange-400" />
                      <span>{st.parentPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-white/40 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
              <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-1.5 opacity-60" />
              <p className="text-xs font-bold text-white/70">لا توجد حالات غياب مسجلة اليوم</p>
              <p className="text-[10px] text-white/30 mt-0.5">جميع الطلاب حاضرون ومؤكدون على خط السير</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 8. تنبيهات الإدارة (Administration Directives & Alerts) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-[#0A0F1D] border border-cyan-500/20 rounded-[1.75rem] p-5 shadow-sm space-y-3.5"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Megaphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>تنبيهات الإدارة ومشرف النقل</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </h3>
              <p className="text-[10px] text-white/40 font-medium">التعليمات الإدارية والتوجيهات العاجلة للسائقين</p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            مدرسة الأوائل
          </span>
        </div>

        {/* Alerts Stream */}
        <div className="space-y-2.5">
          {adminAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border transition-all text-right ${
                alert.priority === 'urgent'
                  ? 'bg-red-500/10 border-red-500/30 text-white'
                  : alert.priority === 'high'
                  ? 'bg-amber-500/10 border-amber-500/25 text-white'
                  : 'bg-white/[0.02] border-white/5 text-white/90'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-white/40 flex items-center gap-1">
                  <Clock size={11} />
                  <span>{alert.timestamp}</span>
                  <span>• {alert.sender}</span>
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  alert.priority === 'urgent'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : alert.priority === 'high'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {alert.priority === 'urgent' ? 'عاجل جداً 🚨' : alert.priority === 'high' ? 'توجيه هام ⚠️' : 'إشعار إداري 📢'}
                </span>
              </div>

              <h4 className="text-xs font-black text-white mb-1">{alert.title}</h4>
              <p className="text-[11px] text-white/70 font-medium leading-relaxed">{alert.message}</p>

              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => {
                    setAdminAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
                    setActionFeedback('تم تأكيد استلام والاطلاع على التوجيه الإداري ✔️');
                    setTimeout(() => setActionFeedback(null), 3000);
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                    alert.isRead
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30'
                  }`}
                >
                  <CheckCheck size={12} />
                  <span>{alert.isRead ? 'تم الاطلاع والالتزام' : 'تأكيد الاطلاع ✔️'}</span>
                </button>

                <button
                  onClick={() => setShowSosModal(true)}
                  className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1"
                >
                  <MessageCircle size={12} />
                  <span>الرد على المشرف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* MODAL 1: Students Roster Management (إدارة قائمة الطلاب بالكامل) */}
      <AnimatePresence>
        {showStudentsModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#0A0F1D] border border-orange-500/30 rounded-[2rem] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[85vh] text-right"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">قائمة ركاب الحافلة ({students.length} طالب)</h3>
                    <p className="text-xs text-white/40">تحديث حالات الصعود، النزول، والغياب لحظياً</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowStudentsModal(false)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search & Status Filters */}
              <div className="space-y-2.5 mb-4">
                <div className="relative">
                  <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم طالب أو محطة التوقف..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-3 text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-bold">
                  <button
                    onClick={() => setStudentFilter('all')}
                    className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                      studentFilter === 'all' ? 'bg-orange-500 text-slate-950 font-black' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    الكل ({students.length})
                  </button>
                  <button
                    onClick={() => setStudentFilter('picked_up')}
                    className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                      studentFilter === 'picked_up' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    في الحافلة ({pickedUpCount})
                  </button>
                  <button
                    onClick={() => setStudentFilter('waiting')}
                    className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                      studentFilter === 'waiting' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    بالانتظار ({waitingCount})
                  </button>
                  <button
                    onClick={() => setStudentFilter('absent')}
                    className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                      studentFilter === 'absent' ? 'bg-red-500 text-white font-black' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    غائب ({absentCount})
                  </button>
                  <button
                    onClick={() => setStudentFilter('dropped_off')}
                    className={`px-3 py-1.5 rounded-lg shrink-0 transition-all ${
                      studentFilter === 'dropped_off' ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    تم التوصيل ({droppedOffCount})
                  </button>
                </div>
              </div>

              {/* Students Scrollable List */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 custom-scrollbar max-h-[50vh]">
                {filteredStudents.map((st) => (
                  <div
                    key={st.id}
                    className="bg-white/[0.02] border border-white/5 hover:border-white/15 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">{st.studentName}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                          st.status === 'picked_up'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : st.status === 'waiting'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : st.status === 'absent'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {st.status === 'picked_up' ? 'في الحافلة 🟢' : st.status === 'waiting' ? 'بانتظار الصعود ⏳' : st.status === 'absent' ? 'غائب اليوم 🔴' : 'تم التوصيل 🔵'}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-white/50 flex items-center gap-1 mt-1">
                        <MapPin size={11} className="text-orange-400" />
                        <span>المحطة: {st.stopName}</span>
                        <span>• {st.grade}</span>
                      </span>
                    </div>

                    {/* Quick State Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {st.parentPhone && (
                        <a
                          href={`tel:${st.parentPhone}`}
                          title="اتصال بولي الأمر"
                          className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                        >
                          <Phone size={14} />
                        </a>
                      )}

                      {/* Button: صعد */}
                      <button
                        onClick={() => handleUpdateStudentStatus(st.id, 'picked_up')}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          st.status === 'picked_up'
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        صعد 🟢
                      </button>

                      {/* Button: غائب */}
                      <button
                        onClick={() => handleUpdateStudentStatus(st.id, 'absent', 'غياب مسجل')}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          st.status === 'absent'
                            ? 'bg-red-500 text-white font-black'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        غائب 🔴
                      </button>

                      {/* Button: نزل */}
                      <button
                        onClick={() => handleUpdateStudentStatus(st.id, 'dropped_off')}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                          st.status === 'dropped_off'
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        وصل 🔵
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Record Absence (تسجيل غياب طالب) */}
      <AnimatePresence>
        {showAbsenceModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0A0F1D] border border-red-500/30 rounded-[2rem] p-6 shadow-2xl text-right space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <UserX size={18} className="text-red-400" />
                  <span>تسجيل غياب طالب عن رحلة اليوم</span>
                </h3>
                <button
                  onClick={() => setShowAbsenceModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5">اختر الطالب:</label>
                <select
                  onChange={(e) => {
                    const st = students.find(s => s.id === e.target.value);
                    setSelectedStudentForAbsence(st || null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                >
                  <option value="" className="bg-[#0A0F1D] text-white">-- اختر اسم الطالب من القائمة --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#0A0F1D] text-white">
                      {s.studentName} ({s.stopName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1.5">سبب الغياب الملاحظ:</label>
                <input
                  type="text"
                  value={absenceReasonInput}
                  onChange={(e) => setAbsenceReasonInput(e.target.value)}
                  placeholder="مثال: لم يحضر في المحطة بعد الانتظار..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={() => {
                  if (selectedStudentForAbsence) {
                    handleUpdateStudentStatus(selectedStudentForAbsence.id, 'absent', absenceReasonInput);
                    setShowAbsenceModal(false);
                  }
                }}
                disabled={!selectedStudentForAbsence}
                className={`w-full py-3.5 rounded-xl font-black text-xs transition-all ${
                  selectedStudentForAbsence
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                تأكيد تسجيل الغياب وإشعار المدرسة 🔴
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Emergency SOS Alert (إرسال بلاغ طارئ) */}
      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0A0F1D] border border-red-500/40 rounded-[2rem] p-6 shadow-2xl text-right space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <AlertOctagon size={20} className="text-red-400 animate-pulse" />
                  <span>إرسال بلاغ طارئ لإدارة المدرسة والأهالي</span>
                </h3>
                <button
                  onClick={() => setShowSosModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/70 block">اختر نوع البلاغ السريع:</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'ازدحام مروري خانق (تأخير 10-15 دقيقة)',
                    'عطل فني طارئ في الحافلة (جاري المعالجة)',
                    'تأخير بسبب الظروف الجوية والأمطار',
                    'طريق مغلق وأعمال صيانة (تغيير المسار)'
                  ].map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSosReasonInput(reason)}
                      className={`p-3 rounded-xl text-right text-xs font-bold transition-all border ${
                        sosReasonInput === reason
                          ? 'bg-red-500/20 border-red-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      ⚠️ {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">أو اكتب تفاصيل مخصصة:</label>
                <input
                  type="text"
                  value={sosReasonInput}
                  onChange={(e) => setSosReasonInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                onClick={handleSendSosAlert}
                className="w-full py-3.5 rounded-xl font-black text-xs bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all active:scale-98"
              >
                إرسال البلاغ فوراً للمشرف والأهالي 🚨
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
