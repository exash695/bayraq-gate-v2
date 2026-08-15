import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, MapPin, Navigation, Clock, CheckCircle2, 
  CreditCard, AlertCircle, DollarSign, ArrowLeft, Phone, Shield,
  Bell, Check, Calendar, Settings, Volume2, ShieldAlert, AlertTriangle, Info, Sparkles,
  UserX
} from 'lucide-react';
import { StudentTransportStatus, TransportRoute, TransportFee } from '../../types/transport';
import { 
  subscribeToParentTransport, 
  getParentTransportFees, 
  payTransportFee,
  subscribeToRoutes,
  updateStudentTransportStatus
} from '../../services/transportService';
import { MetroTransitViewer } from './MetroTransitViewer';

interface ParentTransportViewProps {
  parentId: string;
}

interface ParentNotification {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  message: string;
  type: 'approaching' | 'picked_up' | 'arrived' | 'absent' | 'info';
  timestamp: number;
}

// Real Ghammas (Al-Diwaniyah, Iraq) coordinates and student home stops mapping
const STOP_COORDINATES: Record<string, { lat: number, lng: number; name: string }> = {
  's1': { lat: 31.7367231, lng: 44.6144858, name: 'مدرسة أم الربيعين الابتدائية' },
  's2': { lat: 31.7367349, lng: 44.6042306, name: 'مدرسة غماس الإبتدائية' },
  's3': { lat: 31.7427235, lng: 44.6184886, name: 'مدرسة الشهيد فيصل دلول' },
  's4': { lat: 31.7345365, lng: 44.6023995, name: 'مدرسة زنوبيا للبنات' },
  's5': { lat: 31.7348318, lng: 44.6010327, name: 'متوسطة ذو الفقار للبنين' },
  's6': { lat: 31.7350439, lng: 44.6001650, name: 'ثانوية غماس المسائية للبنين' },
  's7': { lat: 31.7346894, lng: 44.5999198, name: 'مدارس ابن عقيل الاهلية' }
};

const SCHOOL_COORDINATE = { lat: 31.735500, lng: 44.605000, name: 'ثانوية أوائل غماس الأهلية 🏫' };

export const ParentTransportView: React.FC<ParentTransportViewProps> = ({ parentId }) => {
  // Tabs: live (التتبع والغياب), notifications (مركز التنبيهات), finance (الأقساط)
  const [activeTab, setActiveTab] = useState<'live' | 'notifications' | 'finance'>('live');
  
  const [statuses, setStatuses] = useState<StudentTransportStatus[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [fees, setFees] = useState<TransportFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);
  const [showSuccessPayment, setShowSuccessPayment] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [triggeredToast, setTriggeredToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(false);
  const [showTechInfo, setShowTechInfo] = useState(false);

  // References to track previous state to detect transitions
  const prevStatusesRef = useRef<Record<string, 'waiting' | 'picked_up' | 'dropped_off' | 'absent'>>({});
  const proximityTriggeredRef = useRef<Record<string, boolean>>({});

  // Request browser notifications permission
  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotificationsEnabled(true);
        setTriggeredToast({ text: 'تم تفعيل الإشعارات اللحظية على متصفحك بنجاح!', type: 'success' });
      } else {
        setTriggeredToast({ text: 'تم رفض إذن الإشعارات، يرجى تفعيلها من إعدادات المتصفح.', type: 'error' });
      }
    } else {
      setTriggeredToast({ text: 'عذراً، متصفحك لا يدعم نظام الإشعارات المباشرة.', type: 'error' });
    }
  };

  const sendNotification = (title: string, message: string, type: ParentNotification['type'], studentId: string, studentName: string) => {
    // 1. Add to local list
    const newNotification: ParentNotification = {
      id: Math.random().toString(),
      studentId,
      studentName,
      title,
      message,
      type,
      timestamp: Date.now()
    };
    setNotifications(prev => [newNotification, ...prev]);

    // 2. Trigger browser native notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn("Failed to display browser notification:", e);
      }
    }

    // 3. Show dynamic custom floating Toast
    setTriggeredToast({ text: message, type: 'info' });
  };

  // Real-time synchronization
  useEffect(() => {
    setLoading(true);

    // 1. Subscribe to student statuses (filtered by parentId)
    const unsubscribeStatuses = subscribeToParentTransport(
      parentId, 
      (data) => {
        const finalData = data.length ? data : mockStatuses;
        setStatuses(finalData);
        setLoading(false);
      },
      (err) => {
        console.warn("Transport subscription error:", err);
        setStatuses(mockStatuses);
        setLoading(false);
      }
    );

    // 2. Subscribe to routes to get live bus locations
    const unsubscribeRoutes = subscribeToRoutes('s1', (allRoutes) => {
      setRoutes(allRoutes);
    });

    // 3. Fetch fees
    const fetchFees = async () => {
      try {
        const data = await getParentTransportFees(parentId);
        setFees(data.length ? data : mockFees);
      } catch (err) {
        setFees(mockFees);
      }
    };
    
    fetchFees();

    // Check notification permission state on load
    if ('Notification' in window && Notification.permission === 'granted') {
      setBrowserNotificationsEnabled(true);
    }

    return () => {
      unsubscribeStatuses();
      unsubscribeRoutes();
    };
  }, [parentId]);

  // Toast automatic dismiss effect
  useEffect(() => {
    if (triggeredToast) {
      const timer = setTimeout(() => setTriggeredToast(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [triggeredToast]);

  // Transitions & Proximity triggers logic based on live data updates
  useEffect(() => {
    if (statuses.length === 0) return;

    statuses.forEach(student => {
      const prevStatus = prevStatusesRef.current[student.id];
      const currentStatus = student.status;

      // 1. Handle transitions
      if (prevStatus && prevStatus !== currentStatus) {
        if (currentStatus === 'picked_up') {
          sendNotification(
            'الطالب صعد إلى الحافلة بنجاح 🚍',
            `صعد الابن ${student.studentName} الحافلة المدرسية بنجاح وهو الآن في طريقه الآمن.`,
            'picked_up',
            student.id,
            student.studentName
          );
        } else if (currentStatus === 'dropped_off') {
          sendNotification(
            'الوصول بسلامة الله 🏠',
            `وصل الابن ${student.studentName} إلى وجهته (المنزل/المدرسة) بسلام وتم تأكيد نزوله من الباص.`,
            'arrived',
            student.id,
            student.studentName
          );
        } else if (currentStatus === 'absent') {
          sendNotification(
            'تأكيد تسجيل الغياب ❌',
            `تم تسجيل الابن ${student.studentName} كغائب اليوم عن حافلة النقل المدرسي.`,
            'absent',
            student.id,
            student.studentName
          );
        }
      }

      // Record state in ref for future transition checks
      prevStatusesRef.current[student.id] = currentStatus;

      // 2. Proximity check
      if (student.routeId && currentStatus === 'waiting') {
        const route = routes.find(r => r.id === student.routeId);
        if (route && route.status === 'in_transit' && route.currentLocation) {
          const stopCoords = STOP_COORDINATES[student.id] || { lat: 33.3115, lng: 44.3600 };
          
          // Distance calculation (Euclidean approximation for coordinate space grid)
          const distance = Math.sqrt(
            Math.pow(route.currentLocation.lat - stopCoords.lat, 2) +
            Math.pow(route.currentLocation.lng - stopCoords.lng, 2)
          );

          // Proximity threshold ~ 0.007 degrees (~ 700 - 800 meters)
          if (distance < 0.007 && !proximityTriggeredRef.current[student.id]) {
            proximityTriggeredRef.current[student.id] = true;
            sendNotification(
              'الباص يقترب من منزلك 🚨',
              `الحافلة المدرسية تقترب الآن من موقف منزل الطالب ${student.studentName}! يرجى الخروج للاستعداد والانتظار.`,
              'approaching',
              student.id,
              student.studentName
            );
          } else if (distance >= 0.012) {
            // Reset state if bus moves far away, to allow triggering in the next run
            proximityTriggeredRef.current[student.id] = false;
          }
        }
      }
    });
  }, [statuses, routes]);

  // Payment trigger
  const handlePayFee = async (feeId: string) => {
    setPayingFeeId(feeId);
    try {
      await payTransportFee(feeId);
      setFees(prev => prev.map(f => f.id === feeId ? { ...f, status: 'paid' } : f));
      setShowSuccessPayment(true);
      setTimeout(() => setShowSuccessPayment(false), 4000);
      setTriggeredToast({ text: 'تم دفع اشتراك الباص بنجاح وتوليد الإيصال المالي الرقمي ✓', type: 'success' });
    } catch (err) {
      console.error(err);
      setTriggeredToast({ text: 'فشلت عملية الدفع الإلكتروني، يرجى إعادة المحاولة.', type: 'error' });
    }
    setPayingFeeId(null);
  };

  // Toggle Absence status with immediate driver-side synchronization
  const handleToggleAbsence = async (studentId: string, currentStatus: StudentTransportStatus['status']) => {
    const nextStatus = currentStatus === 'absent' ? 'waiting' : 'absent';
    try {
      await updateStudentTransportStatus(studentId, nextStatus);
      // Optimistic update locally
      setStatuses(prev => prev.map(s => s.id === studentId ? { ...s, status: nextStatus, timestamp: Date.now() } : s));
      
      const studentName = statuses.find(s => s.id === studentId)?.studentName || 'الابن';
      if (nextStatus === 'absent') {
        setTriggeredToast({ 
          text: `تم الإبلاغ عن غياب ${studentName} اليوم. سيتلقى السائق إشعاراً فوراً لتفادي التوقف والانتظار أمام منزلك.`, 
          type: 'info' 
        });
      } else {
        setTriggeredToast({ 
          text: `تم إلغاء الغياب للابن ${studentName}. الحافلة ستقوم بالمرور بالموقف المعتاد بانتظاره.`, 
          type: 'success' 
        });
      }
    } catch (err) {
      console.error("Failed to update student status:", err);
      setTriggeredToast({ text: 'عذراً، فشلت مزامنة حالة الغياب مع السائق.', type: 'error' });
    }
  };

  // Baghdad Mansour Stylized Coordinate Translation
  const getRelativeOffset = (lat: number, lng: number) => {
    const latDiff = lat - 33.3128; // center around Academy
    const lngDiff = lng - 44.3615;
    // Scale factor to map on 300px box perfectly
    const scale = 2200; 
    return {
      top: `calc(50% + ${latDiff * scale}px)`,
      right: `calc(50% + ${lngDiff * scale}px)`
    };
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* 1. Glassmorphism App Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl border border-indigo-900/30 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:20px_20px] opacity-25"></div>
        <div className="relative flex items-center gap-4 z-10">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Bus className="w-8 h-8 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-white">بوابة النقل والربط الذكي لولي الأمر</h2>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 px-2 py-0.5 rounded-full font-bold">الإصدار الاحترافي v2</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">تتبع مسار الأبناء، تلقي الإنذارات الذكية، ومزامنة الغياب الفورية مع أجهزة السائقين بالبث الحي.</p>
          </div>
        </div>

        {/* Real-time Connection status or Quick settings */}
        <div className="relative z-10 flex flex-wrap gap-2.5 w-full md:w-auto">
          <button 
            onClick={() => setShowTechInfo(!showTechInfo)}
            className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-gray-300 rounded-xl text-xs font-black border border-gray-700/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Info className="w-4 h-4 text-indigo-400" />
            آلية الربط والمزامنة
          </button>

          <button 
            onClick={handleRequestPermission}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              browserNotificationsEnabled 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/15'
            }`}
          >
            <Bell className={`w-4 h-4 ${!browserNotificationsEnabled ? 'animate-bounce' : ''}`} />
            {browserNotificationsEnabled ? 'الإشعارات اللحظية مفعلة' : 'تفعيل إشعارات المتصفح'}
          </button>
        </div>
      </div>

      {/* Realtime technical architecture explanation box */}
      <AnimatePresence>
        {showTechInfo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-[#11162A]/90 p-6 rounded-3xl border border-indigo-900/30 text-xs text-gray-300 space-y-4 shadow-lg"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h4 className="font-black text-sm text-white">كيف يعمل الربط الحي والمزامنة التلقائية؟</h4>
            </div>
            <p className="leading-relaxed">
              تعتمد المنصة على تقنية <strong className="text-indigo-400">Firestore Realtime Listeners</strong>. حيث ترتبط شاشات الإدارة، ولي الأمر، وتطبيق السائق بملفات مركزية مشتركة لكل رحلة وطالب في قاعدة البيانات السحابية:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-gray-800">
                <span className="text-amber-400 font-bold block mb-1">1. إشارة GPS من السائق</span>
                تتحرك الحافلة على خريطتك المباشرة بفضل الإرسال التلقائي المستمر من جهاز السائق لتحديث موقعه الجغرافي.
              </div>
              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-gray-800">
                <span className="text-emerald-400 font-bold block mb-1">2. صعود وهبوط فوري</span>
                عندما يضغط السائق على "صعد الحافلة" أو "نزل للبيت"، تتغير حالة الطالب لتنعكس لديك فوراً في جزء من الثانية دون أي تحديث للصفحة.
              </div>
              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-gray-800">
                <span className="text-rose-400 font-bold block mb-1">3. إخطار غياب لحظي</span>
                بنقرة واحدة منك على "ابني غائب"، يتلون اسم الطالب باللون الأحمر لدى السائق، مما يلغي وقوف الحافلة والانتظار دون جدوى.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Payment Message Banner */}
      {showSuccessPayment && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-sm font-bold text-center flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          تم دفع قسط الحافلة المدرسي بنجاح وتوثيق المعاملة برقم إيصال رقمي فوري!
        </motion.div>
      )}

      {/* 2. Primary Tabs Selectors */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-5 py-3.5 font-black text-sm transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'live' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-500/5 rounded-t-xl' 
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          التتبع المباشر وإثبات الغياب
        </button>
        
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-3.5 font-black text-sm transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap relative ${
            activeTab === 'notifications' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-500/5 rounded-t-xl' 
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          مركز الإشعارات والتحذيرات اللحظية
          {notifications.length > 0 && (
            <span className="absolute top-2.5 left-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {notifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`px-5 py-3.5 font-black text-sm transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'finance' 
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-500/5 rounded-t-xl' 
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          الأقساط وفواتير الاشتراك
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-bold">جاري المزامنة وبث البيانات الحية...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TAB 1: Live Trip tracking & Absence Reporting */}
          {activeTab === 'live' && (
            <>
              {/* Left column (Full-width 3/3 of grid): Students Real-Time status card */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-gray-900 dark:text-white text-base">متابعة الأبناء والمسار الحي</h3>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    تحديث حي ومباشر
                  </span>
                </div>

                {statuses.map(student => {
                  const studentStop = STOP_COORDINATES[student.id] || { lat: 33.3115, lng: 44.3600, name: student.stopName || 'المنزل' };
                  const associatedRoute = routes.find(r => r.id === student.routeId);
                  const isBusActive = associatedRoute?.status === 'in_transit';
                  
                  // Calculate dynamic progress status percentages for timeline
                  const progressPercentage = 
                    student.status === 'dropped_off' ? '100%' : 
                    student.status === 'picked_up' ? '50%' : '10%';

                  return (
                    <motion.div 
                      key={student.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-sm relative overflow-hidden space-y-6"
                    >
                      {/* Top colored highlight strip based on active status */}
                      <div className={`absolute top-0 right-0 w-full h-1.5 ${
                        student.status === 'picked_up' ? 'bg-indigo-500' :
                        student.status === 'dropped_off' ? 'bg-emerald-500' :
                        student.status === 'absent' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                      }`} />

                      {/* Header row: student card basic info */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black flex items-center justify-center text-xl shadow-md">
                            {(student.studentName || 'ط').charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white">{student.studentName}</h4>
                            <p className="text-gray-400 text-xs flex items-center gap-1.5 mt-1 font-bold">
                              <MapPin className="w-4 h-4 text-indigo-500" />
                              موقف الحافلة المعتمد: {studentStop.name}
                            </p>
                          </div>
                        </div>

                        {/* Status chip */}
                        <div className="flex items-center gap-2">
                          <span className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 ${
                            student.status === 'picked_up' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30' :
                            student.status === 'dropped_off' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' :
                            student.status === 'absent' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/30 font-black' : 
                            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30 animate-pulse'
                          }`}>
                            {student.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                            {student.status === 'picked_up' && <Bus className="w-3.5 h-3.5 text-blue-500 animate-bounce" />}
                            {student.status === 'dropped_off' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {student.status === 'absent' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                            
                            {student.status === 'waiting' && 'بانتظار وصول الحافلة'}
                            {student.status === 'picked_up' && 'داخل الحافلة (على الطريق)'}
                            {student.status === 'dropped_off' && 'وصل بسلام بفضل الله'}
                            {student.status === 'absent' && 'غائب اليوم'}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic interactive progress timeline */}
                      {student.status !== 'absent' && (
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60">
                          <div className="relative h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: progressPercentage }}
                              className="absolute right-0 top-0 h-full bg-gradient-to-l from-indigo-500 to-indigo-700 rounded-full"
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-gray-500 font-black px-1">
                            <span className={student.status === 'waiting' ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : ''}>1. انتظار الحافلة</span>
                            <span className={student.status === 'picked_up' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''}>2. صعد الحافلة</span>
                            <span className={student.status === 'dropped_off' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>3. وصل بسلام</span>
                          </div>
                        </div>
                      )}

                      {/* Interactive Real Ghammas Leaflet Map */}
                      {student.status !== 'absent' && (
                        <div className="space-y-3">
                          <h5 className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-indigo-500 rotate-45" />
                            رادار تتبع الحافلة ومسافة الاقتراب الحالية (خريطة غماس الحقيقية 🗺️):
                          </h5>

                          <div className="relative w-full h-[260px] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700/60 shadow-inner">
                            {(() => {
                              const activeBusCoords = associatedRoute?.currentLocation;
                              const mapBuses = (associatedRoute && activeBusCoords) ? [{
                                id: associatedRoute.id,
                                name: associatedRoute.name || 'حافلة الطلاب',
                                lat: activeBusCoords.lat,
                                lng: activeBusCoords.lng,
                                speed: associatedRoute.status === 'in_transit' ? 38 : 0,
                              }] : [];

                              const mapStops = [{
                                id: student.id,
                                name: studentStop.name,
                                lat: studentStop.lat,
                                lng: studentStop.lng,
                              }];

                              // Draw line if we have active bus GPS
                              const routeLine = (activeBusCoords) ? [
                                { lat: activeBusCoords.lat, lng: activeBusCoords.lng },
                                { lat: studentStop.lat, lng: studentStop.lng }
                              ] : undefined;

                              // Distance calculation in km
                              let distanceKm = "0.0";
                              if (activeBusCoords) {
                                const distVal = Math.sqrt(
                                  Math.pow(activeBusCoords.lat - studentStop.lat, 2) +
                                  Math.pow(activeBusCoords.lng - studentStop.lng, 2)
                                );
                                distanceKm = (distVal * 111).toFixed(2); // Convert to actual km (1 degree lat ~= 111km)
                              }

                              return (
                                <>
                                  <MetroTransitViewer 
                                    buses={mapBuses}
                                    stops={Object.entries(STOP_COORDINATES).map(([id, s]) => ({ id, name: s.name, waitingStudents: 0, busId: associatedRoute?.id }))}
                                    schoolName={SCHOOL_COORDINATE.name}
                                    busProgressMap={mapBuses.reduce((acc, bus) => { acc[bus.id] = 0.5; return acc; }, {})}
                                    selectedBusId={null}
                                    onSelectBus={() => {}}
                                  />
                                  {activeBusCoords ? (
                                    <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 text-white border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-lg">
                                      الباص على بعد <span className="text-amber-400 font-mono font-bold">{distanceKm} كم</span> من موقفك المعتمد
                                    </div>
                                  ) : (
                                    <div className="absolute inset-0 z-[400] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 text-center pointer-events-none">
                                      <p className="text-[11px] text-gray-400 font-bold">
                                        🔴 بانتظار تشغيل السائق لبث الـ GPS والتحرك اليوم.
                                      </p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Action buttons: PRE-REPORT ABSENCE & CONTACT DRIVER */}
                      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 text-xs font-bold text-gray-400">
                        {/* 1. Report absence button with instant synchronization */}
                        <div className="flex-1 sm:flex-initial">
                          {student.status === 'absent' ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-xl border border-rose-500/20">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>الابن مسجل كغائب اليوم بانتظار السائق.</span>
                              </div>
                              <button
                                onClick={() => handleToggleAbsence(student.id, student.status)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-800 dark:text-white rounded-xl transition-all font-black text-[11px] cursor-pointer"
                              >
                                إلغاء الإبلاغ عن الغياب وتأكيد الانتظار 🔄
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleToggleAbsence(student.id, student.status)}
                              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl border border-rose-500/20 transition-all font-black text-[11px] flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto"
                              title="سيتم إبلاغ السائق مباشرة لتخطي الوقوف أمام منزلك وتوفير وقته"
                            >
                              <UserX className="w-4 h-4" />
                              ابني غائب اليوم عن الباص ❌
                            </button>
                          )}
                        </div>

                        {/* 2. Contact driver link */}
                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            آخر مزامنة: <strong>{student.timestamp ? new Date(student.timestamp).toLocaleTimeString('ar-IQ') : 'الآن'}</strong>
                          </span>
                          
                          <a 
                            href="tel:+9647701234567"
                            className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline px-3 py-2 bg-indigo-500/10 rounded-xl"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            الاتصال بالسائق
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: Real-time Notification Alert Center */}
          {activeTab === 'notifications' && (
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white text-base">مركز الإشعارات اللحظية</h3>
                    <p className="text-xs text-gray-400 mt-1">سجل التنبيهات وإشارات الاقتراب الواردة من الحافلة اليوم.</p>
                  </div>
                  
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-xs text-rose-500 hover:underline cursor-pointer font-bold"
                    >
                      مسح السجل المؤقت
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Bell className="w-10 h-10 text-gray-300 dark:text-gray-700 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-gray-900 dark:text-white">لا توجد تنبيهات نشطة حالياً</p>
                      <p className="text-[10px] text-gray-500 mt-1">يتم بث الإشعارات تلقائياً عند تحرك السائق واقترابه من منزلك.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id}
                        className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-right flex items-start gap-3.5"
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${
                          notif.type === 'approaching' ? 'bg-rose-500/10 text-rose-500' :
                          notif.type === 'picked_up' ? 'bg-blue-500/10 text-blue-500' :
                          notif.type === 'arrived' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {notif.type === 'approaching' && <AlertTriangle className="w-5 h-5" />}
                          {notif.type === 'picked_up' && <Bus className="w-5 h-5" />}
                          {notif.type === 'arrived' && <CheckCircle2 className="w-5 h-5" />}
                          {notif.type === 'absent' && <UserX className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white">{notif.title}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">{new Date(notif.timestamp).toLocaleTimeString('ar-IQ')}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed font-bold">{notif.message}</p>
                          <span className="text-[9px] bg-slate-100 dark:bg-gray-900 px-1.5 py-0.5 rounded font-black text-gray-500 inline-block mt-1">
                            {notif.studentName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Financial Subscriptions and Installments */}
          {activeTab === 'finance' && (
            <div className="lg:col-span-3 space-y-6">
              <h3 className="font-black text-gray-900 dark:text-white text-base">اشتراكات وأقساط الحافلة</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {fees.map(fee => (
                  <div key={fee.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-5">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        
                        <span className={`px-3 py-1.5 rounded-full text-xs font-black ${
                          fee.status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {fee.status === 'paid' ? 'تم السداد بنجاح' : 'مستحق الدفع اليوم'}
                        </span>
                      </div>
                      
                      <h4 className="text-gray-400 text-xs font-bold mb-1">الاشتراك المخصص لشهر</h4>
                      <p className="text-lg font-black text-gray-800 dark:text-gray-100">{fee.month}</p>
                      
                      <div className="my-5 py-3 border-y border-gray-100 dark:border-gray-700/60 flex justify-between items-baseline">
                        <span className="text-xs text-gray-400 font-bold">مبلغ الاشتراك المعتمد:</span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{(fee.amount || 150000).toLocaleString('ar-IQ')} د.ع</span>
                      </div>
                    </div>
                    
                    {fee.status !== 'paid' ? (
                      <button 
                        onClick={() => handlePayFee(fee.id)}
                        disabled={payingFeeId !== null}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {payingFeeId === fee.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <CreditCard className="w-4.5 h-4.5" />
                            سداد الاشتراك إلكترونياً
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="py-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl text-center text-xs text-gray-400 dark:text-gray-500 font-bold border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-1.5">
                        <Shield className="w-4.5 h-4.5 text-emerald-400" />
                        المعاملة آمنة وموثقة برقم إيصال رقمي فوري
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      )}

      {/* 4. Elegant Bottom Floating Custom Toast Notifications */}
      <AnimatePresence>
        {triggeredToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 p-4 bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 text-white rounded-2xl shadow-2xl max-w-sm flex items-start gap-3 text-right"
            dir="rtl"
          >
            <div className={`p-2.5 rounded-xl text-white shrink-0 ${
              triggeredToast.type === 'success' ? 'bg-emerald-600' :
              triggeredToast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
            }`}>
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-indigo-300">رادار التنبيه الذكي</h4>
                <button 
                  onClick={() => setTriggeredToast(null)}
                  className="text-gray-400 hover:text-white font-black text-[10px]"
                >
                  إغلاق
                </button>
              </div>
              <p className="text-xs text-gray-100 mt-1 font-bold leading-relaxed">{triggeredToast.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// High quality templates for local display fallback if firebase returns empty initially
const mockStatuses: StudentTransportStatus[] = [
  { id: 's1', studentName: 'علي محمد الدليمي', routeId: '1', status: 'waiting', stopName: 'مدرسة أم الربيعين الابتدائية', parentId: 'p1', timestamp: Date.now() }
];

const mockFees: TransportFee[] = [
  { id: 'f1', studentId: 's1', parentId: 'p1', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'pending', month: 'نوفمبر 2026' }
];
