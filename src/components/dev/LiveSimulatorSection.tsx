import React, { useState, useEffect } from 'react';
import {
  Radio,
  Bus,
  Bell,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserCheck,
  MapPin,
  Clock,
  Sparkles,
  Smartphone,
  Layers,
  ChevronRight,
  Shield,
  Volume2,
  Calendar,
  Eye,
  Megaphone,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, addDoc, serverTimestamp } from '@/src/lib/firebase';
import { db } from '../../lib/firebase';
import { logActivity } from '../../utils/auditLogger';
import { schoolService } from '../../services/schoolService';

interface SimulatorEvent {
  id: string;
  timestamp: string;
  type: 'bus_pickup' | 'bus_dropoff' | 'bus_proximity' | 'absence_alert' | 'emergency_broadcast' | 'grade_alert';
  title: string;
  description: string;
  recipient: string;
  status: 'delivered' | 'pending' | 'failed';
  payload: any;
}

export const LiveSimulatorSection: React.FC = () => {
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('test_school_sandbox');
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>('مدرسة النخبة النموذجية (بيئة تجريبية)');

  // Bus Simulator State
  const [busRouteActive, setBusRouteActive] = useState(false);
  const [busProgress, setBusProgress] = useState(0); // 0 to 100
  const [busSpeed, setBusSpeed] = useState<number>(1);
  const [busDriverName, setBusDriverName] = useState('كابتن أحمد الكرخي');
  const [busNumber, setBusNumber] = useState('باص رقم 12 - الكرخ');
  const [currentStation, setCurrentStation] = useState(0);

  // Student test target
  const [studentName, setStudentName] = useState('زينب علي الموسوي');
  const [studentGrade, setStudentGrade] = useState('الرابع العلمي - أ');
  const [parentName, setParentName] = useState('علي الموسوي (ولي الأمر)');
  const [parentPhone, setParentPhone] = useState('07701234567');

  // Logs stream
  const [eventLogs, setEventLogs] = useState<SimulatorEvent[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      type: 'bus_pickup',
      title: 'صعود الطالب إلى الحافلة',
      description: 'تم تسجيل صعود الطالبة (زينب علي) إلى الباص 12 صباحاً بنجاح',
      recipient: 'علي الموسوي (07701234567)',
      status: 'delivered',
      payload: { studentId: 'std_01', busId: 'bus_12', speed: '35 km/h', lat: 33.3152, lng: 44.3661 }
    }
  ]);

  const [selectedLog, setSelectedLog] = useState<SimulatorEvent | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notification simulator preview modal / toast
  const [simulatedNotification, setSimulatedNotification] = useState<{
    show: boolean;
    title: string;
    body: string;
    time: string;
    icon: string;
  } | null>(null);

  const stations = [
    { id: 0, name: 'المدرسة (نقطة الانطلاق)', pct: 0, desc: 'تحرك الباص وبدء المسار الصباحي' },
    { id: 1, name: 'محطة المنصور (تقاطع 14 رمضان)', pct: 25, desc: 'صعود طلاب حي المنصور' },
    { id: 2, name: 'محطة اليرموك (ساحة قحطان)', pct: 50, desc: 'صعود طلاب حي اليرموك' },
    { id: 3, name: 'محطة القادسية (قرب مجمع الكليات)', pct: 75, desc: 'صعود طلاب القادسية' },
    { id: 4, name: 'بوابة المدرسة (الوصول النهائي)', pct: 100, desc: 'وصول الطلاب بسلام للمدرسة' }
  ];

  // Load actual schools list
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const data = await schoolService.fetchSchools();
        const list: Array<{ id: string; name: string }> = [
          { id: 'test_school_sandbox', name: 'مدرسة النخبة النموذجية (بيئة تجريبية)' }
        ];
        data.forEach(d => {
          list.push({ id: d.id, name: d.name || d.id });
        });
        setSchools(list);
      } catch (e) {
        console.error('Failed to load schools for simulator:', e);
      }
    };
    fetchSchools();
  }, []);

  // Bus progress interval loop
  useEffect(() => {
    let interval: any;
    if (busRouteActive) {
      interval = setInterval(() => {
        setBusProgress(prev => {
          const next = prev + 1.5 * busSpeed;
          if (next >= 100) {
            setBusRouteActive(false);
            dispatchSimulatorEvent(
              'bus_dropoff',
              'وصول الحافلة إلى المدرسة',
              `وصلت الحافلة (${busNumber}) إلى المدرسة وجميع الطلاب نزلوا بأمان`,
              'كافة أولياء أمور خط 12',
              { arrivedAt: new Date().toISOString(), totalStudents: 14 }
            );
            return 100;
          }
          // Determine current station
          const matchedStation = stations.slice().reverse().find(st => next >= st.pct);
          if (matchedStation && matchedStation.id !== currentStation) {
            setCurrentStation(matchedStation.id);
          }
          return next;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [busRouteActive, busSpeed, currentStation]);

  const showTriggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const triggerDeviceNotification = (title: string, body: string, icon = '🚌') => {
    setSimulatedNotification({
      show: true,
      title,
      body,
      time: 'الآن',
      icon
    });
    setTimeout(() => {
      setSimulatedNotification(prev => prev ? { ...prev, show: false } : null);
    }, 5500);
  };

  const dispatchSimulatorEvent = async (
    type: SimulatorEvent['type'],
    title: string,
    description: string,
    recipient: string,
    payload: any
  ) => {
    const newEvent: SimulatorEvent = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ar-SA'),
      type,
      title,
      description,
      recipient,
      status: 'delivered',
      payload
    };

    setEventLogs(prev => [newEvent, ...prev.slice(0, 40)]);
    triggerDeviceNotification(title, description);
    showTriggerToast(`⚡ تم إرسال إشعار تجريبي: ${title}`);

    // Log to developer logs in firestore for auditability
    try {
      await logActivity({
        action: `محاكاة نظام: ${title}`,
        details: `${description} - المستلم: ${recipient}`,
        targetId: selectedSchoolId,
        targetType: 'simulator_events'
      });
    } catch (e) {}
  };

  // Specific simulation triggers
  const handleSimulateBoarding = () => {
    dispatchSimulatorEvent(
      'bus_pickup',
      `صعود الحافلة: ${studentName}`,
      `تم تسجيل صعود ابنتكم/ابنكم (${studentName}) إلى (${busNumber}) بنجاح`,
      `${parentName} (${parentPhone})`,
      { student: studentName, grade: studentGrade, bus: busNumber, driver: busDriverName, time: new Date().toISOString() }
    );
  };

  const handleSimulateAlight = () => {
    dispatchSimulatorEvent(
      'bus_dropoff',
      `نزول آمن: ${studentName}`,
      `تم تسجيل نزول الطالب (${studentName}) ووصوله بسلام للمنزل/المدرسة`,
      `${parentName} (${parentPhone})`,
      { student: studentName, location: 'بوابة المنزل', time: new Date().toISOString() }
    );
  };

  const handleSimulateProximity = () => {
    dispatchSimulatorEvent(
      'bus_proximity',
      `الحافلة على بعد 500 متر! 📍`,
      `اقتربت الحافلة المدرسية من موقعكم (المتبقي دقيقتان)، يرجى استعداد الطالب`,
      `${parentName} (${parentPhone})`,
      { distanceMeters: 480, estimatedMinutes: 2, currentSpeed: '32 km/h' }
    );
  };

  const handleSimulateAbsence = (reason: string) => {
    dispatchSimulatorEvent(
      'absence_alert',
      `تنبيه غياب صباحي: ${studentName}`,
      `عزيزي ولي الأمر، لم يتم تسجيل حضور الطالب (${studentName}) في الطابور الصباحي اليوم. السبب: ${reason}`,
      `${parentName} (${parentPhone})`,
      { student: studentName, grade: studentGrade, reason, recordedAt: new Date().toLocaleTimeString('ar-SA') }
    );
  };

  const handleSimulateEmergencyBroadcast = (msgTitle: string, msgContent: string) => {
    dispatchSimulatorEvent(
      'emergency_broadcast',
      `📢 تعميم طارئ: ${msgTitle}`,
      msgContent,
      `جميع أولياء أمور وكوادر ${selectedSchoolName}`,
      { title: msgTitle, broadcastText: msgContent, priority: 'urgent', sentBy: 'إدارة المدرسة' }
    );
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-400/40 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles size={16} className="text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Simulated Phone Push Notification */}
      <AnimatePresence>
        {simulatedNotification && simulatedNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-6 left-6 z-[9999] max-w-sm w-full bg-[#121528]/95 backdrop-blur-xl border border-indigo-500/40 rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-right"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-white/50">
              <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                <span className="text-base">{simulatedNotification.icon}</span>
                <span>بوابة بيرق • إشعار فوري</span>
              </div>
              <span>{simulatedNotification.time}</span>
            </div>
            <h4 className="text-xs font-black text-white mb-1">{simulatedNotification.title}</h4>
            <p className="text-[11px] text-white/70 leading-relaxed">{simulatedNotification.body}</p>
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-emerald-400 font-bold">
              <span>تم الاستلام على جهاز ولي الأمر ✓</span>
              <span className="text-white/40">Sound: Chime.mp3</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-[#0B0D1B] to-purple-950/80 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Radio size={22} className="animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">محاكي الاختبار الحي وحافلات النقل (Live Sandbox)</h2>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              أداة متطورة لاختبار إشعارات صعود ونزول الطلاب من الحافلة، حركة الـ GPS المباشرة، وتنبيهات الغياب في الوقت الفعلي مع معاينة فورية لما يظهر لولي الأمر.
            </p>
          </div>

          {/* School Selector */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-3 min-w-[260px]">
            <label className="block text-[11px] font-bold text-indigo-300 mb-1.5">المدرسة المستهدفة في المحاكاة:</label>
            <select
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                const s = schools.find(item => item.id === e.target.value);
                if (s) setSelectedSchoolName(s.name);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 font-bold"
            >
              {schools.map(s => (
                <option key={s.id} value={s.id} className="bg-[#0B0D1B] text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Simulator Controls & Live Route Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Map & Route Track (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Live Bus GPS Route Simulation */}
          <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Bus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">مسار الحافلة التفاعلي المباشر (GPS Playback)</h3>
                  <p className="text-[10px] text-white/40">{busNumber} • {busDriverName}</p>
                </div>
              </div>

              {/* Speed & Play Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                  {[1, 2, 5].map(spd => (
                    <button
                      key={spd}
                      onClick={() => setBusSpeed(spd)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                        busSpeed === spd ? 'bg-indigo-600 text-white shadow' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setBusRouteActive(!busRouteActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg ${
                    busRouteActive
                      ? 'bg-amber-500 hover:bg-amber-600 text-black'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {busRouteActive ? (
                    <>
                      <Pause size={14} /> إيقاف مؤقت
                    </>
                  ) : (
                    <>
                      <Play size={14} /> تشغيل المسار
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setBusProgress(0);
                    setCurrentStation(0);
                    setBusRouteActive(false);
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl border border-white/5"
                  title="إعادة التعيين"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Simulated Route Visualization Canvas */}
            <div className="relative bg-[#060814] border border-white/5 rounded-2xl p-5 mb-5 overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              {/* Track Line */}
              <div className="relative h-2.5 bg-neutral-800 rounded-full my-8 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${busProgress}%` }}
                />
              </div>

              {/* Bus Marker Icon on Track */}
              <motion.div
                className="absolute top-9 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
                style={{ left: `${Math.min(96, Math.max(4, busProgress))}%` }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)] border-2 border-white">
                  <Bus size={18} />
                </div>
                <div className="mt-1 bg-black/80 px-2 py-0.5 rounded-md border border-white/20 text-[9px] font-bold text-amber-300 whitespace-nowrap">
                  {Math.round(busProgress)}% مسافة
                </div>
              </motion.div>

              {/* Stations Markers */}
              <div className="relative flex justify-between items-center pt-2">
                {stations.map((st) => {
                  const isPassed = busProgress >= st.pct;
                  const isCurrent = currentStation === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setBusProgress(st.pct);
                        setCurrentStation(st.id);
                      }}
                      className="flex flex-col items-center cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all ${
                          isCurrent
                            ? 'bg-amber-400 text-black border-white scale-125 shadow-lg'
                            : isPassed
                            ? 'bg-emerald-500 text-white border-emerald-300'
                            : 'bg-neutral-800 text-white/40 border-neutral-700'
                        }`}
                      >
                        {st.id + 1}
                      </div>
                      <span className="text-[10px] font-bold text-white/70 mt-1.5 text-center max-w-[80px] leading-tight">
                        {st.name.split('(')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Station Status & Quick Triggers */}
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-white">
                    الموقع الحالي: {stations[currentStation]?.name}
                  </span>
                </div>
                <p className="text-[11px] text-white/50">{stations[currentStation]?.desc}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSimulateProximity}
                  className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  <MapPin size={12} /> إشعار اقتراب (500م)
                </button>
                <button
                  onClick={handleSimulateBoarding}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  <Check size={12} /> صعود الطالب 🚌
                </button>
                <button
                  onClick={handleSimulateAlight}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1"
                >
                  <CheckCircle2 size={12} /> نزول الطالب ✓
                </button>
              </div>
            </div>
          </div>

          {/* Absence & General Notifications Simulator */}
          <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">محاكي إشعارات الغياب والتعاميم المدرسية</h3>
                <p className="text-[10px] text-white/40">إرسال تنبيهات تلقائية وتجربة استجابة ولي الأمر</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-300 mb-1">تنبيه غياب صباحي (طابور الصباح)</h4>
                  <p className="text-[11px] text-white/60 mb-3">
                    إشعار فوري لولي أمر الطالب ({studentName}) في حال عدم الحضور
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSimulateAbsence('عدم الحضور للطابور بدون إشعار مسبق')}
                    className="flex-1 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    إرسال تنبيه غياب 🚨
                  </button>
                  <button
                    onClick={() => handleSimulateAbsence('تأخر عن الحصة الأولى')}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl text-xs font-bold transition-all"
                  >
                    تأخر صباحي
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 mb-1">تعميم طارئ للمدرسة بأكملها</h4>
                  <p className="text-[11px] text-white/60 mb-3">
                    بث رسالة تعميم عاجلة لجميع الهواتف المتصلة بالمدرسة
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleSimulateEmergencyBroadcast(
                        'عطلة رسمية لسوء الأحوال الجوية',
                        'نظراً لغزارة الأمطار وحرصاً على سلامة أبنائنا، تقرر تعطيل الدوام الرسمي ليوم غد.'
                      )
                    }
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                  >
                    بث تعميم عطلة طارئة 📢
                  </button>
                  <button
                    onClick={() =>
                      handleSimulateEmergencyBroadcast(
                        'تأكيد موعد الامتحانات الشهرية',
                        'يرجى من جميع الطلبة الالتزام بالزي المدرسي وجدول الامتحانات المعتمد.'
                      )
                    }
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl text-xs font-bold transition-all"
                  >
                    امتحانات
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Target Student Info & Live Event Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Target Profile Card */}
          <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <UserCheck size={16} />
                </div>
                <h3 className="text-xs font-black text-white">بيانات الطالب المستهدف بالمحاكاة</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                حساب نشط ومطابق
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40">اسم الطالب:</span>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-white font-bold text-left outline-none focus:border-indigo-400 text-xs"
                />
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40">الصف والشعبة:</span>
                <input
                  type="text"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-white font-bold text-left outline-none focus:border-indigo-400 text-xs"
                />
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-white/40">ولي الأمر:</span>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-white font-bold text-left outline-none focus:border-indigo-400 text-xs"
                />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-white/40">رقم الهاتف:</span>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-white font-bold text-left outline-none focus:border-indigo-400 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Live Events Stream */}
          <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <h3 className="text-xs font-black text-white">سجل الأحداث والإشعارات المرسلة</h3>
              </div>
              <button
                onClick={() => setEventLogs([])}
                className="text-[10px] text-white/40 hover:text-white transition-colors font-bold"
              >
                مسح السجل
              </button>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {eventLogs.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-xs">
                  لا توجد أحداث مرسلة حالياً. اضغط على أي زر محاكاة للبدء!
                </div>
              ) : (
                eventLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    layout
                    onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-indigo-300">{log.title}</span>
                      <span className="text-[10px] text-white/40 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-white/70 leading-relaxed mb-1.5">{log.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>المستلم: {log.recipient}</span>
                      <span className="text-emerald-400 font-bold">تم التسليم ✓</span>
                    </div>

                    {/* Expandable JSON payload */}
                    {selectedLog?.id === log.id && (
                      <div className="mt-2 pt-2 border-t border-white/10 bg-black/40 p-2.5 rounded-xl text-[10px] font-mono text-indigo-300 overflow-x-auto text-left" dir="ltr">
                        {JSON.stringify(log.payload, null, 2)}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
