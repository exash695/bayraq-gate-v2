import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, MapPin, CheckCircle2, UserX, AlertTriangle, 
  Navigation, Phone, ShieldAlert, Check, ChevronRight,
  ArrowRight, Users, Bell, DollarSign, QrCode, Map, 
  Clock, Heart, ShieldCheck, HelpCircle, Wifi, Compass, 
  UserCheck, Send, AlertCircle
} from 'lucide-react';
import { StudentTransportStatus, TransportRoute, TransportFee } from '../../types/transport';
import { calculateLiveTracking, getStopCoords, SCHOOL_COORDINATE } from '../../utils/geoUtils';
import { 
  updateStudentTransportStatus, 
  updateRouteStatus,
  getRoutes,
  subscribeToStudentStatusesForRoute,
  subscribeToAllFees,
  getDrivers,
  subscribeToRoutes
} from '../../services/transportService';
import { MetroTransitViewer } from './MetroTransitViewer';

interface DriverDashboardProps {
  driverId: string;
  routeId: string;
  onBack?: () => void;
  driverObj?: any;
  schoolId?: string;
}

// Custom structure for expanded student details with payment and phone info
interface EnhancedStudent extends StudentTransportStatus {
  parentPhone?: string;
  paymentStatus: 'paid' | 'overdue';
  amountDue: string;
  shift: 'morning' | 'evening';
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ driverId, routeId, onBack, driverObj, schoolId = "s1" }) => {
  // Navigation & tabs state
  const [activeTab, setActiveTab] = useState<'manifest' | 'route' | 'finance' | 'alerts'>('manifest');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  
  // App data state
  const [students, setStudents] = useState<EnhancedStudent[]>([]);
  const [routeInfo, setRouteInfo] = useState<TransportRoute | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Dynamic driver and resolved route id
  const [driverDetails, setDriverDetails] = useState<any>(driverObj || null);
  const [resolvedRouteId, setResolvedRouteId] = useState<string>(routeId);

  // Simulation states
  const [isGpsBroadcasting, setIsGpsBroadcasting] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState({ lat: 31.735500, lng: 44.605000 }); // Real Ghammas coordinates (init near school)
  const [simulatedStep, setSimulatedStep] = useState(0);
  const [useRealGps, setUseRealGps] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanningStudentId, setScanningStudentId] = useState<string>('');
  const [scannerSuccess, setScannerSuccess] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [alertType, setAlertType] = useState<string>('');
  const [customNotification, setCustomNotification] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Manage body class for full-screen view
  useEffect(() => {
    document.body.classList.add('driver-portal-active');
    return () => {
      document.body.classList.remove('driver-portal-active');
    };
  }, []);

  // Load students and route info with real-time subscriptions
  useEffect(() => {
    setLoading(true);
    let unsubRoutes: () => void = () => {};
    let unsubStudents: () => void = () => {};
    let unsubFees: () => void = () => {};

    const loadRouteAndStartSubscriptions = async () => {
      let currentDriver = driverDetails;
      try {
        // Load driver details if not provided
        if (!currentDriver) {
          const driversList = await getDrivers(schoolId);
          currentDriver = driversList.find(d => d.id === driverId || d.accessCode === driverId);
          if (currentDriver) {
            setDriverDetails(currentDriver);
            if (currentDriver.shift && currentDriver.shift !== 'both') {
              setShiftFilter(currentDriver.shift);
            }
          }
        } else if (currentDriver.shift && currentDriver.shift !== 'both') {
          setShiftFilter(currentDriver.shift);
        }

        // Subscribed fees list
        let latestFees: TransportFee[] = [];

        // Subscribe to fees to map payment status dynamically
        unsubFees = subscribeToAllFees((fees) => {
          latestFees = fees;
          // Re-evaluate students status when fees change
          setStudents(prev => {
            return prev.map(s => {
              const matchedFee = latestFees.find(f => f.studentId === s.id);
              return {
                ...s,
                paymentStatus: matchedFee ? (matchedFee.status === 'paid' ? 'paid' : 'overdue') : s.paymentStatus,
                amountDue: matchedFee ? (matchedFee.status === 'paid' ? '0 د.ع' : '150,000 د.ع') : s.amountDue
              };
            });
          });
        });

        // Real-time subscribe to routes to sync the bus plate & name dynamically!
        unsubRoutes = subscribeToRoutes(schoolId, (routes) => {
          // Find route matching this driver's name, ID, or direct routeId
          let activeRoute = routes.find(r => r.driverId === driverId || (currentDriver && r.driverId === currentDriver.id));
          if (!activeRoute && currentDriver) {
            activeRoute = routes.find(r => 
              r.driverId === currentDriver.id || 
              r.name === currentDriver.routeId || 
              r.id === currentDriver.routeId ||
              (currentDriver.routeId && (r.name.includes(currentDriver.routeId) || currentDriver.routeId.includes(r.name)))
            );
          }
          if (!activeRoute && routeId) {
            activeRoute = routes.find(r => r.id === routeId || r.name === routeId || r.name.includes(routeId));
          }

          // Fallback if no matching route is found
          if (!activeRoute) {
            activeRoute = {
              id: routeId || '1',
              name: currentDriver?.routeId || (currentDriver ? `خط باص السائق ${currentDriver.name}` : 'خط المنصور السريع والداودي'),
              driverId: driverId,
              busPlate: 'أ ب ج 1234',
              startTime: '06:30 ص',
              status: 'idle',
              schoolId: schoolId,
              stops: [
                'مول المنصور',
                'ساحة النسور',
                'تقاطع الداودي'
              ]
            };
          }

          setRouteInfo(activeRoute);
          setResolvedRouteId(activeRoute.id);
          const actualRouteId = activeRoute.id;

          // Cleanup previous students subscription if any
          unsubStudents();

          // Subscribe to students assigned to this specific route in real-time
          unsubStudents = subscribeToStudentStatusesForRoute(actualRouteId, (rawStatuses) => {
            const matchedMockStudents = mockStudentsTemplate.filter(s => s.routeId === actualRouteId);
            const finalStatuses = rawStatuses.length ? rawStatuses : matchedMockStudents;
            const enriched: EnhancedStudent[] = finalStatuses.map((student, idx) => {
              const matchedFee = latestFees.find(f => f.studentId === student.id);
              const nameToUse = student.studentName || (student as any).name || 'طالب جديد';
              const resolvedStudentShift = student.shift || (currentDriver?.shift && currentDriver.shift !== 'both' ? currentDriver.shift : (idx % 2 === 0 ? 'morning' : 'evening'));
              return {
                ...student,
                studentName: nameToUse,
                parentPhone: idx % 2 === 0 ? '+964 770 123 4567' : '+964 780 987 6543',
                paymentStatus: matchedFee ? (matchedFee.status === 'paid' ? 'paid' : 'overdue') : (idx === 1 ? 'overdue' : 'paid'),
                amountDue: matchedFee ? (matchedFee.status === 'paid' ? '0 د.ع' : '150,000 د.ع') : (idx === 1 ? '150,000 د.ع' : '0 د.ع'),
                shift: resolvedStudentShift
              };
            });
            setStudents(enriched);
            setLoading(false);
          });
        });

      } catch (err) {
        console.error('Error fetching driver dashboard data:', err);
        // Fallback to high quality mock data
        setStudents(mockStudentsTemplate.map((student, idx) => {
          const resolvedStudentShift = student.shift || (currentDriver?.shift && currentDriver.shift !== 'both' ? currentDriver.shift : (idx % 2 === 0 ? 'morning' : 'evening'));
          return {
            ...student,
            parentPhone: idx % 2 === 0 ? '+964 770 123 4567' : '+964 780 987 6543',
            paymentStatus: idx === 1 ? 'overdue' : 'paid',
            amountDue: idx === 1 ? '150,000 د.ع' : '0 د.ع',
            shift: resolvedStudentShift
          };
        }));
        setLoading(false);
      }
    };

    loadRouteAndStartSubscriptions();

    return () => {
      unsubRoutes();
      unsubStudents();
      unsubFees();
    };
  }, [routeId, driverId, schoolId]);

  // GPS Broadcast / Simulation Loop
  useEffect(() => {
    let watchId: number | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (isGpsBroadcasting) {
      if (useRealGps && 'geolocation' in navigator) {
        // Use browser real Geolocation
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const newCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setGpsCoordinates(newCoords);

            // Calculate live stats
            const speedKmh = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 32;
            const tracking = calculateLiveTracking(
              newCoords.lat,
              newCoords.lng,
              routeInfo?.stops || [],
              speedKmh
            );

            // Broadcast to Firestore
            await updateRouteStatus(resolvedRouteId, 'in_transit', newCoords, {
              speed: tracking.speed,
              distanceToSchool: tracking.distanceToSchool,
              eta: tracking.eta,
              currentStop: tracking.currentStop,
              nextStop: tracking.nextStop,
              stopsRemaining: tracking.stopsRemaining,
              progress: tracking.progress,
              trackingStatus: tracking.status,
              lastGpsUpdate: Date.now()
            });
          },
          (err) => {
            console.warn("Geolocation watch error, falling back to simulator:", err);
            setUseRealGps(false); // fall back
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        // High-Fidelity Path-Based Route Simulator
        interval = setInterval(async () => {
          setSimulatedStep(prevStep => {
            const nextStep = prevStep >= 100 ? 0 : prevStep + 2; // increments along the path

            // Calculate coordinates along route stops path
            const stopsList = routeInfo?.stops || [];
            const pathPoints = [
              // Start point (further away from first stop)
              ...(stopsList.length > 0 
                ? [{ 
                    lat: getStopCoords(stopsList[0], 0, stopsList.length).lat - 0.005, 
                    lng: getStopCoords(stopsList[0], 0, stopsList.length).lng - 0.005 
                  }]
                : []),
              ...stopsList.map((stop, idx) => getStopCoords(stop, idx, stopsList.length)),
              SCHOOL_COORDINATE
            ];

            const getPointAlongPath = (points: Array<{ lat: number, lng: number }>, prog: number) => {
              if (points.length === 0) return SCHOOL_COORDINATE;
              if (points.length === 1) return points[0];
              if (prog <= 0) return points[0];
              if (prog >= 1) return points[points.length - 1];

              const totalSegments = points.length - 1;
              const segmentFloat = prog * totalSegments;
              const segmentIdx = Math.floor(segmentFloat);
              const t = segmentFloat - segmentIdx;

              const p1 = points[segmentIdx];
              const p2 = points[segmentIdx + 1];

              return {
                lat: p1.lat + (p2.lat - p1.lat) * t,
                lng: p1.lng + (p2.lng - p1.lng) * t,
              };
            };

            const newCoords = getPointAlongPath(pathPoints, nextStep / 100);
            setGpsCoordinates(newCoords);

            // Calculate live telemetry metrics
            const isNearSchool = nextStep >= 100;
            const speedKmh = isNearSchool ? 0 : Math.floor(Math.random() * 15) + 25; // 25-40 km/h

            const tracking = calculateLiveTracking(
              newCoords.lat,
              newCoords.lng,
              stopsList,
              speedKmh
            );

            // Broadcast to Firestore
            updateRouteStatus(resolvedRouteId, isNearSchool ? 'completed' : 'in_transit', newCoords, {
              speed: tracking.speed,
              distanceToSchool: tracking.distanceToSchool,
              eta: tracking.eta,
              currentStop: tracking.currentStop,
              nextStop: tracking.nextStop,
              stopsRemaining: tracking.stopsRemaining,
              progress: tracking.progress,
              trackingStatus: tracking.status,
              lastGpsUpdate: Date.now()
            });

            if (isNearSchool) {
              setIsGpsBroadcasting(false);
              triggerToast('وصلت الحافلة إلى المدرسة بنجاح! تم إكمال الرحلة ✓', 'success');
              return 0; // reset
            }

            return nextStep;
          });
        }, 3000);
      }
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (interval !== null) clearInterval(interval);
    };
  }, [isGpsBroadcasting, useRealGps, resolvedRouteId, routeInfo?.stops]);

  // Toast helper
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Student update handler
  const handleStatusUpdate = async (id: string, newStatus: StudentTransportStatus['status']) => {
    // Optimistic UI update
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    
    // Status translation for messages
    const statusArabic = 
      newStatus === 'picked_up' ? 'ركب الحافلة' :
      newStatus === 'dropped_off' ? 'نزل من الحافلة' : 'غائب';

    const studentName = students.find(s => s.id === id)?.studentName || 'الطالب';

    try {
      await updateStudentTransportStatus(id, newStatus);
      triggerToast(`تم تحديث حالة ${studentName} إلى: ${statusArabic}`, 'success');
    } catch (error) {
      console.error("Failed to update status", error);
      triggerToast(`عذراً، فشل تحديث حالة الطالب`, 'error');
    }
  };

  // Route actions
  const handleStartRoute = async () => {
    if (routeInfo) {
      setRouteInfo({ ...routeInfo, status: 'in_transit' });
    }
    await updateRouteStatus(resolvedRouteId, 'in_transit', gpsCoordinates);
    setIsGpsBroadcasting(true);
    setActiveTab('route'); // Immediately show the path/map to the driver!
    triggerToast('تم تشغيل خط الرحلة وبث إشارة GPS للأهالي والمنصة بنجاح 📡', 'success');
  };

  const handleEndRoute = async () => {
    if (routeInfo) {
      setRouteInfo({ ...routeInfo, status: 'completed' });
    }
    await updateRouteStatus(resolvedRouteId, 'completed');
    setIsGpsBroadcasting(false);
    triggerToast('تم إنهاء الرحلة الحالية وإغلاق المسار بنجاح اليوم ✓', 'info');
  };

  // QR Code Simulation trigger
  const handleQrScan = (studentId: string) => {
    setScannerSuccess(true);
    const targetStudent = students.find(s => s.id === studentId);
    
    setTimeout(() => {
      if (targetStudent) {
        // Toggle status: if already in_transit (picked_up), check them out (dropped_off), otherwise check in (picked_up)
        const nextStatus = targetStudent.status === 'picked_up' ? 'dropped_off' : 'picked_up';
        handleStatusUpdate(studentId, nextStatus);
      }
      setScannerSuccess(false);
      setScannerOpen(false);
    }, 1500);
  };

  // Send delay or SOS warnings
  const handleSendAlert = (type: string, msg: string) => {
    setAlertType(type);
    setAlertSent(true);
    triggerToast(`تم إرسال إشعار فوري: ${msg}`, 'error');
    setTimeout(() => {
      setAlertSent(false);
      setAlertType('');
    }, 5000);
  };

  const handleSendCustomNotify = () => {
    if (!customNotification.trim()) return;
    triggerToast(`تم بث الإشعار الجماعي لأولياء الأمور بنجاح 📢`, 'success');
    setCustomNotification('');
  };

  // Filter students based on morning/evening shift
  const filteredStudents = students.filter(s => {
    if (shiftFilter === 'all') return true;
    return s.shift === shiftFilter;
  });

  return (
    <div className="min-h-screen bg-[#0A0D1A] text-white font-sans flex flex-col selection:bg-amber-500 selection:text-black overflow-x-hidden w-full max-w-none m-0 p-0 border-0" dir="rtl">
      
      {/* Header Bar - Sleek Single Line, Edge to Edge */}
      <div className="w-full bg-[#11162A]/90 backdrop-blur-xl border-b border-gray-800 px-4 py-3 md:px-5 md:py-4 sticky top-0 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2.5 bg-gray-800/60 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-xl transition-all duration-300 border border-gray-700/50 cursor-pointer shrink-0"
              title="خروج من لوحة السائق"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <div className="relative shrink-0">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-xl text-black shadow-lg shadow-amber-500/20">
              <Bus className="w-5 h-5 stroke-[2.5]" />
            </div>
            {isGpsBroadcasting && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-lg font-black tracking-tight text-white truncate">
              {driverDetails ? `لوحة السائق: ${driverDetails.name}` : 'لوحة تحكم السائق المحترف'}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400 font-medium flex items-center gap-1.5 truncate mt-0.5">
              <span className="text-amber-400 font-black">{routeInfo?.name || 'خط الحافلة'}</span>
              <span className="text-gray-600 font-bold">|</span>
              <span className="text-indigo-300 font-bold">{routeInfo?.busPlate || ''}</span>
            </p>
          </div>
        </div>

        {/* GPS Controls on the same single line */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0 ml-5 xs:ml-8 md:ml-12">
          <div className="hidden md:flex flex-col text-left">
            <span className="text-[9px] text-gray-500 text-right font-black block">بث الـ GPS المباشر</span>
            <span className="font-mono text-xs text-emerald-400 font-black tracking-wider">
              {gpsCoordinates.lat.toFixed(5)}°N, {gpsCoordinates.lng.toFixed(5)}°E
            </span>
          </div>

          <button 
            onClick={() => setIsGpsBroadcasting(!isGpsBroadcasting)}
            className={`px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              isGpsBroadcasting 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/10' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <Wifi className={`w-3.5 h-3.5 ${isGpsBroadcasting ? 'animate-pulse' : ''}`} />
            <span className="hidden xs:inline">
              {isGpsBroadcasting 
                ? `البث نشط (${gpsCoordinates.lat.toFixed(3)}, ${gpsCoordinates.lng.toFixed(3)})`
                : 'تشغيل بث GPS'
              }
            </span>
            <span className="xs:hidden">
              {isGpsBroadcasting ? `${gpsCoordinates.lat.toFixed(2)}, ${gpsCoordinates.lng.toFixed(2)}` : 'بث GPS'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Container - Edge-to-Edge Layout */}
      <div className="flex-1 w-full flex flex-col md:flex-row gap-0">
        
        {/* Glassmorphism Sidebar / Right Menu Panel - Hidden on Mobile */}
        <div className="hidden md:flex w-full md:w-80 bg-[#11162A]/80 backdrop-blur-xl border-l border-gray-800/80 p-4 md:p-5 flex-col justify-between gap-6 shrink-0">
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-br from-[#18213F] to-[#10162B] rounded-2xl border border-gray-800">
              <span className="text-xs text-gray-500 block mb-1">مسار الحافلة النشط</span>
              <p className="text-sm font-black text-white leading-relaxed">{routeInfo?.name || 'خط حي المنصور وبوابة الكفاءات'}</p>
              
              <div className="mt-4 flex gap-2">
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-bold">
                  صباحية ومسائية
                </span>
                <span className="text-xs bg-[#243B55] text-blue-300 border border-blue-500/10 px-2.5 py-1 rounded-lg font-bold">
                  {routeInfo?.busPlate || 'باص 12'}
                </span>
              </div>
            </div>

            {/* Core Side Navigation */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-500 font-black tracking-wider block px-1">القائمة الرئيسية</span>
              
              <button 
                onClick={() => setActiveTab('manifest')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-right font-bold text-sm cursor-pointer ${
                  activeTab === 'manifest' 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 border-r-4 border-amber-400' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5 text-indigo-400" />
                <div className="flex-1">
                  <span>الركاب والتحضير</span>
                  <span className="text-[10px] block font-medium opacity-75">حضور وانصراف الطلاب بالباص</span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('route')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-right font-bold text-sm cursor-pointer ${
                  activeTab === 'route' 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 border-r-4 border-amber-400' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`}
              >
                <Map className="w-5 h-5 text-amber-400" />
                <div className="flex-1">
                  <span>المسار والخريطة</span>
                  <span className="text-[10px] block font-medium opacity-75">محطات التوقف وبث الـ GPS</span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('finance')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-right font-bold text-sm cursor-pointer ${
                  activeTab === 'finance' 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 border-r-4 border-amber-400' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`}
              >
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div className="flex-1">
                  <span>المالية والأقساط</span>
                  <span className="text-[10px] block font-medium opacity-75">حالة سداد الركاب ومستحقاتك</span>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('alerts')}
                className={`w-full p-4 rounded-2xl flex items-center gap-3.5 transition-all text-right font-bold text-sm cursor-pointer ${
                  activeTab === 'alerts' 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 border-r-4 border-amber-400' 
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <div className="flex-1">
                  <span>تنبيهات الطوارئ والاتصال</span>
                  <span className="text-[10px] block font-medium opacity-75">الإبلاغ عن ازدحامات وأعطال</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quick SOS Trigger in Side panel */}
          <div className="p-4 bg-rose-950/20 rounded-2xl border border-rose-900/30">
            <div className="flex gap-2 items-center mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs font-black text-rose-400">حالة طوارئ فورية</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">اضغط على زر الـ SOS لإخطار الإدارة والآباء بوجود عطل أو خطر على الطريق فوراً.</p>
            <button 
              onClick={() => handleSendAlert('sos', 'نداء طوارئ عاجل من السائق!')}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/20"
            >
              🚨 إرسال إشارة استغاثة SOS
            </button>
          </div>
        </div>

        {/* Content Panel - Pure Edge-to-Edge */}
        <div className="flex-1 bg-[#0A0D1A] min-h-[500px] pb-24 md:pb-0">
          
          <AnimatePresence mode="wait">
            {/* TAB 1: STUDENT MANIFEST */}
            {activeTab === 'manifest' && (
              <motion.div 
                key="manifest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-6 md:px-5 md:py-8 space-y-6 w-full max-w-none"
              >
                {/* Manifest Filters & QR Activation */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-indigo-400" />
                      قائمة ركاب الباص والتحضير اليومي
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">قم بتحضير الطلاب وتدوين ركوبهم أو نزولهم أو غيابهم عن الحافلة بنقرة واحدة.</p>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* Shift Filter */}
                    <div className="bg-gray-800/60 p-1 rounded-xl border border-gray-700/50 flex text-xs">
                      <button 
                        onClick={() => setShiftFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${shiftFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        الكل
                      </button>
                      <button 
                        onClick={() => setShiftFilter('morning')}
                        className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${shiftFilter === 'morning' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        الصباحي
                      </button>
                      <button 
                        onClick={() => setShiftFilter('evening')}
                        className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${shiftFilter === 'evening' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        المسائي
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulation controls for start/end route inside manifest */}
                <div className="bg-gradient-to-r from-indigo-950/40 via-[#121834] to-gray-900/40 p-4 md:p-5 rounded-3xl border border-indigo-900/30 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-black">حالة مسار الرحلة</span>
                      <h3 className="text-base font-black text-white mt-1.5 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
                        {routeInfo?.status === 'in_transit' ? 'الرحلة قيد الحركة الآن وبث إحداثيات GPS نشط' : 
                         routeInfo?.status === 'completed' ? 'تم اكتمال مسار الرحلة بنجاح اليوم ✓' : 'الرحلة متوقفة حالياً وبانتظار الانطلاق'}
                      </h3>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {routeInfo?.status !== 'in_transit' ? (
                        <button 
                          onClick={handleStartRoute}
                          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-black rounded-xl text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/10 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 rotate-45" />
                          بدء وانطلاق رحلة الباص اليوم
                        </button>
                      ) : (
                        <button 
                          onClick={handleEndRoute}
                          className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-xl shadow-rose-600/10 cursor-pointer animate-pulse"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          إنهاء وإغلاق رحلة الباص
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Source Switcher */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl">
                    <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5 shrink-0">
                      <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                      مستشعر تتبع الرحلة:
                    </span>
                    <div className="flex flex-wrap gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setUseRealGps(false);
                          triggerToast('تم التبديل إلى محاكي الرحلة التلقائي الذكي 🤖', 'info');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${!useRealGps ? 'bg-indigo-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        محاكي الحركة الذكي للمحطات 🤖
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if ('geolocation' in navigator) {
                            setUseRealGps(true);
                            triggerToast('تم تشغيل مستشعر GPS الحقيقي للجهاز 📡', 'success');
                          } else {
                            triggerToast('مستشعر GPS غير مدعوم في هذا المتصفح', 'error');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${useRealGps ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        موقع جهاز السائق الحي (GPS) 📡
                      </button>
                    </div>
                  </div>
                </div>

                {/* Students manifest grid */}
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-400 font-bold">جاري تحميل بيانات حضور الطلاب...</span>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center p-12 bg-gray-900/40 rounded-3xl border border-dashed border-gray-800">
                    <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-bold">لا يوجد طلاب متطابقين مع تصفية البحث الحالية</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredStudents.map((student, idx) => {
                      const studentStatus = student.status || 'waiting';
                      return (
                        <motion.div 
                          key={student.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-[#11162A]/90 hover:bg-[#151C36] rounded-3xl p-4 md:p-5 border border-gray-800 hover:border-gray-700/80 shadow-md transition-all flex flex-col justify-between gap-4 group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3.5">
                              {/* Glowing Avatar */}
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                {(student.studentName || '').charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-white text-base group-hover:text-amber-300 transition-colors">{student.studentName}</h3>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                    student.shift === 'morning' ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                                  }`}>
                                    {student.shift === 'morning' ? 'الصباحي' : 'المسائي'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                  محطة الركوب: {student.stopName || 'حي المنصور'}
                                </p>
                              </div>
                            </div>

                            {/* Parent call trigger */}
                            {student.parentPhone && (
                              <a 
                                href={`tel:${student.parentPhone}`}
                                className="p-3 bg-gray-800/80 hover:bg-indigo-600 hover:text-white text-gray-300 rounded-2xl transition-all duration-300 border border-gray-700/50 flex items-center justify-center cursor-pointer"
                                title="اتصال مباشر بولي الأمر"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          {/* Interactive touch-friendly states picker */}
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <button 
                              onClick={() => handleStatusUpdate(student.id, 'picked_up')}
                              className={`py-2.5 px-1 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                studentStatus === 'picked_up' 
                                  ? 'bg-emerald-500 text-black font-black shadow-lg shadow-emerald-500/10' 
                                  : 'bg-gray-800/50 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400'
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              صعد الحافلة
                            </button>

                            <button 
                              onClick={() => handleStatusUpdate(student.id, 'dropped_off')}
                              className={`py-2.5 px-1 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                studentStatus === 'dropped_off' 
                                  ? 'bg-blue-500 text-white font-black shadow-lg shadow-blue-500/10' 
                                  : 'bg-gray-800/50 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              نزل للبيت
                            </button>

                            <button 
                              onClick={() => handleStatusUpdate(student.id, 'absent')}
                              className={`py-2.5 px-1 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                studentStatus === 'absent' 
                                  ? 'bg-rose-500 text-white font-black shadow-lg shadow-rose-500/10' 
                                  : 'bg-gray-800/50 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400'
                              }`}
                            >
                              <UserX className="w-3.5 h-3.5" />
                              غائب اليوم
                            </button>
                          </div>

                          {/* Extra bottom info: payment and check indicator */}
                          <div className="flex justify-between items-center bg-[#0C0F20] px-3.5 py-2.5 rounded-xl text-[10px] border border-gray-800/50 mt-1">
                            <span className="flex items-center gap-1 text-gray-400">
                              حالة الاشتراك المالي: 
                              <span className={`font-black ${student.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                                {student.paymentStatus === 'paid' ? '✓ مسدد الاشتراك' : '⚠ متأخر عن السداد'}
                              </span>
                            </span>
                            
                            <span className={`font-black ${
                              studentStatus === 'picked_up' ? 'text-emerald-400' :
                              studentStatus === 'dropped_off' ? 'text-blue-400' :
                              studentStatus === 'absent' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                              {studentStatus === 'waiting' && '⏱ بانتظار الباص'}
                              {studentStatus === 'picked_up' && '🚍 داخل الحافلة'}
                              {studentStatus === 'dropped_off' && '🏠 نزل للمنزل بسلام'}
                              {studentStatus === 'absent' && '❌ مسجل غائب'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: ROUTE & NAVIGATION */}
            {activeTab === 'route' && (
              <motion.div 
                key="route"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-6 md:px-5 md:py-8 space-y-6 w-full max-w-none"
              >
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Map className="w-6 h-6 text-amber-400" />
                    المسار التفاعلي ومحطات التوقف
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">تتبع محطات الحافلة بالترتيب الزمني مع أوقات التوقف والوصول المقدرة.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Stations Timeline */}
                  <div className="lg:col-span-1 bg-[#11162A] p-4 md:p-5 rounded-3xl border border-gray-800 space-y-5">
                    <h3 className="text-sm font-black text-white pb-3 border-b border-gray-800">محطات المسار المعتمد</h3>
                    
                    <div className="relative pl-2 pr-6 border-r-2 border-dashed border-gray-800 space-y-6 mr-1">
                      {routeInfo?.stops?.map((stop, idx) => (
                        <div key={idx} className="relative">
                          {/* Station Bullet Accent */}
                          <span className={`absolute -right-[33px] top-1 w-5 h-5 rounded-full border-4 border-[#0A0D1A] flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400' :
                            idx === routeInfo.stops!.length - 1 ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}></span>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-white">{stop}</span>
                              {idx === 1 && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">المحطة القادمة</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              أوقات الوصول المقدرة: {0 + idx * 15} : 07 صباحاً
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Real GPS Map and Active Status (Ghammas) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#11162A] p-4 md:p-5 rounded-3xl border border-gray-800 flex flex-col justify-between h-[360px] relative overflow-hidden">
                      <div className="flex justify-between items-center z-10 mb-2">
                        <span className="text-xs bg-[#0F1222] px-3 py-1.5 rounded-xl border border-gray-800 text-gray-300 font-bold flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                          رادار تتبع الحافلة والمحطات الحقيقي (غماس 🗺️)
                        </span>
                        
                        <div className="flex gap-1.5 items-center">
                          <span className={`w-2 h-2 rounded-full ${isGpsBroadcasting ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
                          <span className="text-[10px] font-mono text-gray-400 font-bold">
                            {isGpsBroadcasting ? 'بث GPS نشط' : 'البث متوقف'}
                          </span>
                        </div>
                      </div>

                      {/* Map container rendering real Leaflet */}
                      <div className="flex-1 relative rounded-2xl overflow-hidden border border-gray-800/80">
                        {(() => {
                          const schoolCoord = { lat: 31.735500, lng: 44.605000, name: 'ثانوية أوائل غماس الأهلية 🏫' };
                          
                          // Stop coordinates mapping
                          const STOP_COORDINATE_LOOKUP: Record<string, { lat: number, lng: number }> = {
                            'مدرسة أم الربيعين الابتدائية': { lat: 31.7367231, lng: 44.6144858 },
                            'مدرسة غماس الإبتدائية': { lat: 31.7367349, lng: 44.6042306 },
                            'مدرسة الشهيد فيصل دلول': { lat: 31.7427235, lng: 44.6184886 },
                            'مدرسة زنوبيا للبنات': { lat: 31.7345365, lng: 44.6023995 },
                            'متوسطة ذو الفقار للبنين': { lat: 31.7348318, lng: 44.6010327 },
                            'ثانوية غماس المسائية للبنين': { lat: 31.7350439, lng: 44.6001650 },
                            'مدارس ابن عقيل الاهلية': { lat: 31.7346894, lng: 44.5999198 },
                            // Fallbacks for Baghdad stops in database just in case
                            'مول المنصور': { lat: 31.8185, lng: 44.6050 },
                            'ساحة النسور': { lat: 31.8210, lng: 44.6015 },
                            'تقاطع الداودي': { lat: 31.8245, lng: 44.5930 },
                            'منطقة اليرموك': { lat: 31.8110, lng: 44.6140 },
                            'حي الحارثية': { lat: 31.8130, lng: 44.6090 },
                            'جامعة بغداد': { lat: 31.8125, lng: 44.5980 },
                          };

                          const mapStops = routeInfo?.stops?.map((stopName, idx) => {
                            const trimmed = stopName.trim();
                            const coords = STOP_COORDINATE_LOOKUP[trimmed] || {
                              lat: 31.7350 + (idx - 1) * 0.003,
                              lng: 44.6060 + (idx - 1) * 0.003
                            };
                            
                            // Calculate dynamic waiting students for this stop
                            const waitingCount = students.filter(s => 
                              (s.stopName || '').trim() === trimmed && 
                              (s.status === 'waiting' || !s.status)
                            ).length;

                            return {
                              id: `stop-${idx}`,
                              name: stopName,
                              lat: coords.lat,
                              lng: coords.lng,
                              waitingStudents: waitingCount
                            };
                          }) || [];

                          const mapBuses = [{
                            id: routeId,
                            name: routeInfo?.name || 'الباص المباشر',
                            lat: gpsCoordinates.lat,
                            lng: gpsCoordinates.lng,
                            speed: isGpsBroadcasting ? 42 : 0,
                          }];

                          // Assemble simple route path if stops are present
                          const routeLine = [
                            ...mapStops.map(s => ({ lat: s.lat, lng: s.lng })),
                            { lat: schoolCoord.lat, lng: schoolCoord.lng }
                          ];

                          return (
                            <MetroTransitViewer 
                              buses={mapBuses}
                              stops={mapStops}
                              schoolName={schoolCoord.name}
                              busProgressMap={{ [routeId]: simulatedStep / 100 }}
                              selectedBusId={routeId}
                              onSelectBus={() => {}}
                            />
                          );
                        })()}
                      </div>

                      {/* Map Footer status */}
                      <div className="flex justify-between items-center text-xs bg-[#0C1021] p-2.5 rounded-2xl border border-gray-800/60 z-10 mt-2">
                        <span className="text-gray-400 font-bold">بث إشارة GPS المباشرة:</span>
                        <div className="flex gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${isGpsBroadcasting ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {isGpsBroadcasting ? 'نشط ويتم البث الآن في غماس' : 'متوقف مؤقتاً'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: FINANCE & INSTALLMENTS */}
            {activeTab === 'finance' && (
              <motion.div 
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-6 md:px-5 md:py-8 space-y-6 w-full max-w-none"
              >
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                    المالية وحالة أقساط الطلاب
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">تابع الموقف المالي وحالة تسديد اشتراكات باص الطلاب المخصصين لرحلتك.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Driver due salary details */}
                  <div className="lg:col-span-1 bg-gradient-to-b from-[#11162A] to-[#0D1224] p-4 md:p-5 rounded-3xl border border-gray-800 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-white pb-3 border-b border-gray-800">مستحقاتك المالية من الإدارة</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">الراتب الشهري الأساسي:</span>
                          <span className="font-bold text-white">750,000 د.ع</span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">حوافز الانتظام والمواعيد:</span>
                          <span className="font-bold text-emerald-400">+ 50,000 د.ع</span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">بدلات وقود وصيانة دورية:</span>
                          <span className="font-bold text-emerald-400">+ 120,000 د.ع</span>
                        </div>

                        <div className="flex justify-between text-xs pt-3 border-t border-gray-800 font-extrabold text-base">
                          <span className="text-white">إجمالي مستحقات هذا الشهر:</span>
                          <span className="text-amber-400">920,000 د.ع</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={() => triggerToast('تم إرسال طلب كشف مالي مفصل وموافقة الإقساط إلى الإدارة بنجاح', 'success')}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer text-center"
                      >
                        طلب صرف الراتب أو كشف مالي
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Students installments status list */}
                  <div className="lg:col-span-2 bg-[#11162A] p-4 md:p-5 rounded-3xl border border-gray-800 space-y-4">
                    <h3 className="text-sm font-black text-white pb-3 border-b border-gray-800">تفاصيل تسديد أقساط الطلاب بالباص</h3>
                    
                    <div className="space-y-3">
                      {students.map(student => (
                        <div key={student.id} className="flex justify-between items-center p-4 bg-[#0A0D1A]/80 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors">
                          <div className="flex gap-3 items-center">
                            <div className="w-9 h-9 rounded-xl bg-gray-800 text-white font-extrabold text-sm flex items-center justify-center">
                              {student.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{student.studentName}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">موقف التجمع: {student.stopName || 'غير محدد'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {student.paymentStatus === 'paid' ? (
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black">
                                ✓ مسدد بالكامل
                              </span>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-black animate-pulse">
                                  ⚠ متأخر عن السداد
                                </span>
                                <span className="text-[9px] text-rose-400 font-bold mt-1">المتبقي: {student.amountDue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: ALERTS & SOS */}
            {activeTab === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-6 md:px-5 md:py-8 space-y-6 w-full max-w-none"
              >
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-rose-500" />
                    تنبيهات الطوارئ وبث الأعطال والتأخير
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">يمكنك إرسال إشعارات سريعة وتنبيهات فورية للإدارة والأهالي في حالة حدوث ظرف طارئ.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Quick Predefined Alert triggers */}
                  <div className="lg:col-span-2 bg-[#11162A] p-4 md:p-5 rounded-3xl border border-gray-800 space-y-4">
                    <h3 className="text-sm font-black text-white pb-3 border-b border-gray-800">إرسال تنبيه تأخير سريع للمسار</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSendAlert('traffic', 'تأخير 15 دقيقة بسبب الازدحام المروري')}
                        className="p-4 bg-gray-800/40 hover:bg-amber-500/10 hover:text-amber-300 text-gray-300 rounded-2xl border border-gray-800/80 hover:border-amber-500/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <Clock className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-black text-xs block text-white group-hover:text-amber-300">ازدحام مروري خانق</span>
                          <span className="text-[10px] text-gray-500">يبث إشعار تأخير 15 دقيقة للأولياء</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleSendAlert('breakdown', 'تأخير 30 دقيقة بسبب عطل فني طارئ في الحافلة')}
                        className="p-4 bg-gray-800/40 hover:bg-rose-500/10 hover:text-rose-300 text-gray-300 rounded-2xl border border-gray-800/80 hover:border-rose-500/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <AlertTriangle className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-black text-xs block text-white group-hover:text-rose-300">عطل فني بالحافلة</span>
                          <span className="text-[10px] text-gray-500">يبث إشعار تأخير 30 دقيقة للأولياء</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleSendAlert('route_close', 'تعديل مسار الرحلة مؤقتاً بسبب غلق الشوارع')}
                        className="p-4 bg-gray-800/40 hover:bg-indigo-500/10 hover:text-indigo-300 text-gray-300 rounded-2xl border border-gray-800/80 hover:border-indigo-500/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <Navigation className="w-5 h-5 text-indigo-400 rotate-45 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-black text-xs block text-white group-hover:text-indigo-300">شوارع مغلقة / تعديل مسار</span>
                          <span className="text-[10px] text-gray-500">يبث إشعار تعديل مسار مؤقت</span>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleSendAlert('weather', 'تأخير طفيف بسبب رداءة الحالة الجوية والسيول')}
                        className="p-4 bg-gray-800/40 hover:bg-blue-500/10 hover:text-blue-300 text-gray-300 rounded-2xl border border-gray-800/80 hover:border-blue-500/30 text-right transition-all flex items-center gap-3 cursor-pointer group"
                      >
                        <HelpCircle className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <span className="font-black text-xs block text-white group-hover:text-blue-300">رداءة الطقس والأحوال</span>
                          <span className="text-[10px] text-gray-500">يبث إشعار تأخير طفيف للأولياء</span>
                        </div>
                      </button>
                    </div>

                    {/* Notification feedback confirmation banner */}
                    {alertSent && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-black text-center flex items-center justify-center gap-2 mt-4"
                      >
                        <Bell className="w-4 h-4 animate-ring" />
                        تم بث التنبيه الفوري: ( {alertType === 'sos' ? 'نداء SOS عاجل' : alertType === 'traffic' ? 'تأخير ازدحام' : 'تأخير عطل فني'} ) إلى إدارة المدرسة وأولياء الأمور!
                      </motion.div>
                    )}
                  </div>

                  {/* Custom broadcast input */}
                  <div className="lg:col-span-1 bg-[#11162A] p-4 md:p-5 rounded-3xl border border-gray-800 flex flex-col justify-between gap-4">
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-white pb-3 border-b border-gray-800">بث إشعار جماعي مخصص</h3>
                      
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-2 font-bold">رسالة الإشعار للأهالي</label>
                        <textarea 
                          rows={4}
                          value={customNotification}
                          onChange={(e) => setCustomNotification(e.target.value)}
                          placeholder="اكتب هنا رسالة توضيحية بخصوص المسار، مثل: (سنتأخر قليلاً بسبب التزود بالوقود ونصلكم خلال دقائق)"
                          className="w-full p-4 rounded-2xl bg-[#0A0D1A] border border-gray-800 focus:border-indigo-500 text-xs font-bold leading-relaxed outline-none resize-none text-white placeholder:text-gray-600 text-right"
                        ></textarea>
                      </div>
                    </div>

                    <button 
                      onClick={handleSendCustomNotify}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                    >
                      <Send className="w-3.5 h-3.5" />
                      بث الإشعار فوراً لأهالي المسار
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER BAR: IMMERSIVE BOTTOM TOUCH BAR FOR MOBILE */}
      <div className="w-full bg-[#11162A]/90 backdrop-blur-xl border-t border-gray-800 p-2 md:p-3 sticky bottom-0 z-20 flex justify-around items-center gap-1 md:hidden">
        <button 
          onClick={() => setActiveTab('manifest')}
          className={`flex-1 py-3 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all text-[10px] font-black cursor-pointer ${
            activeTab === 'manifest' ? 'bg-indigo-600/20 text-white border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 text-indigo-400" />
          <span>الركاب</span>
        </button>

        <button 
          onClick={() => setActiveTab('route')}
          className={`flex-1 py-3 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all text-[10px] font-black cursor-pointer ${
            activeTab === 'route' ? 'bg-indigo-600/20 text-white border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Map className="w-5 h-5 text-amber-400" />
          <span>الخريطة</span>
        </button>

        <button 
          onClick={() => setActiveTab('finance')}
          className={`flex-1 py-3 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all text-[10px] font-black cursor-pointer ${
            activeTab === 'finance' ? 'bg-indigo-600/20 text-white border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span>المالية</span>
        </button>

        <button 
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-3 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all text-[10px] font-black cursor-pointer ${
            activeTab === 'alerts' ? 'bg-indigo-600/20 text-white border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>الطوارئ</span>
        </button>
      </div>

      {/* VIRTUAL QR CODE SCANNER OVERLAY MODAL */}
      <AnimatePresence>
        {scannerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A0D1A]/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#11162A] w-full max-w-md rounded-3xl border border-gray-800 p-6 space-y-6 relative overflow-hidden"
            >
              {/* Scan Beam Indicator */}
              {scannerSuccess && (
                <div className="absolute inset-0 bg-emerald-500/5 flex items-center justify-center z-10">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center animate-ping">
                    <Check className="w-12 h-12 text-emerald-400" />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                  محاكاة ماسح باركود بطاقة الطالب
                </h3>
                <button 
                  onClick={() => setScannerOpen(false)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

              {/* Camera Scanning Frame Mock */}
              <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-black rounded-2xl border-2 border-indigo-500/40 flex flex-col justify-center items-center overflow-hidden">
                {/* Dynamic lasers & frames */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-amber-400"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-amber-400"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-amber-400"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-amber-400"></div>

                {/* Blinking laser line */}
                <div className="absolute w-full h-1 bg-red-500/80 top-0 animate-scan"></div>

                {scannerSuccess ? (
                  <span className="text-xs font-black text-emerald-400 animate-bounce">تم التحضير والمسح بنجاح!</span>
                ) : (
                  <div className="text-center p-4">
                    <QrCode className="w-14 h-14 text-indigo-400 mx-auto opacity-30 animate-pulse" />
                    <span className="text-[10px] text-gray-500 block mt-2 font-black">بانتظار تمرير بطاقة الطالب الذكية</span>
                  </div>
                )}
              </div>

              {/* Simulation triggers: Allow user to pick a student to simulate scanning */}
              <div className="space-y-3">
                <span className="text-[10px] text-gray-400 font-bold block text-center">اضغط على اسم الطالب لمحاكاة تمرير بطاقته أمام الكاميرا:</span>
                
                <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto p-1 bg-[#0A0D1A] rounded-2xl border border-gray-800/60">
                  {students.map(student => (
                    <button 
                      key={student.id}
                      onClick={() => handleQrScan(student.id)}
                      disabled={scannerSuccess}
                      className="p-3 bg-[#11162A] hover:bg-[#1C2344] disabled:opacity-50 text-right rounded-xl border border-gray-800 text-xs font-black flex justify-between items-center transition-all cursor-pointer"
                    >
                      <span>{student.studentName}</span>
                      <span className="text-[9px] text-amber-400 font-bold">محاكاة مسح الكود ⚡</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM FEEDBACK */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 z-50 p-4 rounded-2xl border flex items-center gap-3.5 shadow-2xl bg-[#11162A] border-indigo-500/30"
          >
            <div className={`p-2 rounded-xl text-black ${
              toastMessage.type === 'success' ? 'bg-emerald-500' :
              toastMessage.type === 'error' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-extrabold text-white block">منظومة رادار الحافلة</span>
              <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed font-bold">{toastMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE STICKY BOTTOM TAB BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#11162A]/90 backdrop-blur-2xl border-t border-gray-800/80 px-4 py-2 pb-5 flex justify-around items-center shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => setActiveTab('manifest')}
          className={`flex-1 flex flex-col justify-center items-center py-2 rounded-xl transition-all ${
            activeTab === 'manifest' ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">الركاب</span>
        </button>
        
        <button
          onClick={() => setActiveTab('route')}
          className={`flex-1 flex flex-col justify-center items-center py-2 rounded-xl transition-all ${
            activeTab === 'route' ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400'
          }`}
        >
          <Map className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">المسار</span>
        </button>
        
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex-1 flex flex-col justify-center items-center py-2 rounded-xl transition-all ${
            activeTab === 'finance' ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-400'
          }`}
        >
          <DollarSign className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">المالية</span>
        </button>
        
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 flex flex-col justify-center items-center py-2 rounded-xl transition-all ${
            activeTab === 'alerts' ? 'text-rose-400 bg-rose-500/10' : 'text-gray-400'
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-black">التنبيهات</span>
        </button>
      </div>

    </div>
  );
};

// Robust default mock template
const mockStudentsTemplate: StudentTransportStatus[] = [
  { id: 's1', studentName: 'علي محمد الدليمي', routeId: '1', status: 'waiting', stopName: 'شارع المنصور / مقابل المول', parentId: 'p1' },
  { id: 's2', studentName: 'سارة أحمد الجبوري', routeId: '1', status: 'waiting', stopName: 'ساحة النسور / خلف البريد', parentId: 'p2' },
  { id: 's3', studentName: 'حسن حيدر الخفاجي', routeId: '1', status: 'picked_up', stopName: 'حي الداودي / تقاطع الرواد', parentId: 'p3' },
  { id: 's4', studentName: 'يوسف عمر الفهد', routeId: '2', status: 'waiting', stopName: 'منطقة اليرموك / قرب الساحة', parentId: 'p4' },
  { id: 's5', studentName: 'رانيا سامي الحداد', routeId: '2', status: 'waiting', stopName: 'جامعة بغداد / الجادرية', parentId: 'p5' },
];
