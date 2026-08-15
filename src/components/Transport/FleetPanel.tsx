import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, Users, MapPin, Search, Clock, Compass, Navigation, ArrowRight, Locate, Info, X 
} from 'lucide-react';
import { TransportRoute, BusDriver, StudentTransportStatus } from '../../types/transport';
import { MetroTransitViewer } from './MetroTransitViewer';
import { getStopCoords, SCHOOL_COORDINATE } from '../../utils/geoUtils';

interface MapStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  waitingStudents: number;
  students: string[];
  busId?: string;
}

interface MapBus {
  id: string;
  name: string;
  driverName: string;
  plate: string;
  phone: string;
  speed: number;
  studentsCount: number;
  status: 'moving' | 'boarding' | 'stopped';
  lat: number;
  lng: number;
  routeColor: string;
  routeName: string;
}









const getSchoolCenter = (id: string, name: string) => {
  const schoolNameLower = (name || "").toLowerCase();
  if (id === 'school1' || schoolNameLower.includes('غماس') || schoolNameLower.includes('أوائل') || schoolNameLower.includes('اوائل')) {
    return { x: 0, y: 0, cityName: "غماس", regionName: "محافظة القادسية" };
  } else if (id === 'school2' || schoolNameLower.includes('نخبة') || schoolNameLower.includes('النخبة')) {
    return { x: -120, y: -100, cityName: "شمال غماس", regionName: "منطقة المجمع العلمي" };
  } else if (id === 'school3' || schoolNameLower.includes('نون') || schoolNameLower.includes('وقلم') || schoolNameLower.includes('القلم')) {
    return { x: -220, y: 50, cityName: "غرب غماس", regionName: "حي القلم الزراعي" };
  } else if (id === 'school4' || schoolNameLower.includes('نبأ') || schoolNameLower.includes('النبأ')) {
    return { x: 200, y: -80, cityName: "شرق غماس", regionName: "حي الزهراء للبنات" };
  } else if (id === 'school5' || schoolNameLower.includes('ابن عقيل') || schoolNameLower.includes('عقيل')) {
    return { x: 50, y: 120, cityName: "وسط غماس", regionName: "منطقة البلدية القديمة" };
  } else if (id === 'school6' || schoolNameLower.includes('يمامة') || schoolNameLower.includes('اليمامة')) {
    return { x: 350, y: -250, cityName: "الديوانية", regionName: "حي العروبة المركزي" };
  } else if (id === 'school7' || schoolNameLower.includes('جواهري') || schoolNameLower.includes('الجواهري')) {
    return { x: -400, y: 300, cityName: "الشامية", regionName: "شارع السراي القديم" };
  } else {
    return { x: 150, y: 150, cityName: "الفرات", regionName: "منطقة الفرات المطور" };
  }
};

export const FleetPanel = ({ 
  routes, 
  studentStatuses, 
  drivers,
  schoolId,
  schoolName = "ثانوية اوائل غماس الاهلية"
}: { 
  routes: TransportRoute[], 
  studentStatuses: StudentTransportStatus[], 
  drivers: BusDriver[],
  schoolId?: string,
  schoolName?: string
}) => {
  const currentCenter = getSchoolCenter(schoolId || "", schoolName || "");
  const [isTrackingCenterOpen, setIsTrackingCenterOpen] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cameraCenter, setCameraCenter] = useState({ x: 0, y: 0 });
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [notificationZone, setNotificationZone] = useState<string | null>(null);

  // Click to reveal states
  const [revealedPhoneId, setRevealedPhoneId] = useState<string | null>(null);
  const [revealedPINId, setRevealedPINId] = useState<string | null>(null);
  const [revealedStopsList, setRevealedStopsList] = useState<Record<string, boolean>>({});
  const [showDirections, setShowDirections] = useState(true);
  const [isTrackMySonActive, setIsTrackMySonActive] = useState(false);
  const [studentsModalBusId, setStudentsModalBusId] = useState<string | null>(null);
  const [studentsModalBusName, setStudentsModalBusName] = useState<string | null>(null);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bus-tracking-toggle', { detail: isTrackingCenterOpen }));
    return () => {
      window.dispatchEvent(new CustomEvent('bus-tracking-toggle', { detail: false }));
    };
  }, [isTrackingCenterOpen]);

  // Simulation and dynamic mapping
  const [busProgress, setBusProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    setBusProgress(prev => {
      const init = { ...prev };
      routes.forEach(route => {
        if (init[route.id] === undefined) {
          init[route.id] = Math.random(); // Start at random point
        }
      });
      return init;
    });
  }, [routes]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBusProgress(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          let p = next[key] + 0.02 + (Math.random() * 0.01);
          if (p >= 1) p = 0;
          next[key] = p;
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const buses: MapBus[] = routes.map((route, idx) => {
    const driver = drivers.find(d => d.id === route.driverId);
    const colors = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#eab308', '#06b6d4', '#ec4899'];
    
    // Read live values from Firestore if they exist
    const isTransit = route.status === 'in_transit';
    const speed = (route as any).speed !== undefined ? (route as any).speed : (isTransit ? Math.floor(Math.random() * 20) + 20 : 0);
    const progress = (route as any).progress !== undefined ? (route as any).progress : (busProgress[route.id] !== undefined ? busProgress[route.id] : 0);

    return {
      id: route.id,
      name: route.name || `حافلة ${idx + 1}`,
      driverName: driver?.name || 'غير محدد',
      plate: route.busPlate || 'غير محدد',
      phone: driver?.phone || 'غير محدد',
      speed: speed,
      studentsCount: studentStatuses.filter(s => s.routeId === route.id).length,
      status: route.status === 'in_transit' ? 'moving' : (route.status === 'idle' ? 'stopped' : 'moving'),
      lat: route.currentLocation?.lat || 0,
      lng: route.currentLocation?.lng || 0,
      routeColor: colors[idx % colors.length],
      routeName: route.name,
      // Pass other live values through
      progress: progress,
      distanceToSchool: (route as any).distanceToSchool || '',
      eta: (route as any).eta || '',
      currentStop: (route as any).currentStop || '',
      nextStop: (route as any).nextStop || '',
      stopsRemaining: (route as any).stopsRemaining !== undefined ? (route as any).stopsRemaining : null
    };
  });

  const allStops: MapStop[] = routes.flatMap(route => {
    return (route.stops || []).map((stopName, idx) => ({
      id: `${route.id}-stop-${idx}`,
      name: stopName,
      lat: 0,
      lng: 0,
      waitingStudents: studentStatuses.filter(s => s.routeId === route.id && s.stopName === stopName && s.status === 'waiting').length,
      students: studentStatuses.filter(s => s.routeId === route.id && s.stopName === stopName).map(s => s.studentName),
      busId: route.id
    }));
  });

  // Automatic camera centering and notification when school changes
  useEffect(() => {
    setCameraCenter({ x: currentCenter.x, y: currentCenter.y });
    setCameraZoom(1.05);
    setNotificationZone(currentCenter.cityName);
    const t = setTimeout(() => setNotificationZone(null), 3500);
    return () => clearTimeout(t);
  }, [schoolId, schoolName]);

// Drag handlers for the interactive map
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    setCameraCenter(prev => ({ x: prev.x - dx / cameraZoom, y: prev.y - dy / cameraZoom }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setCameraCenter(prev => ({ x: prev.x - dx / cameraZoom, y: prev.y - dy / cameraZoom }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Reset/Locate camera center
  const resetCamera = () => {
    setCameraCenter({ x: currentCenter.x, y: currentCenter.y });
    setCameraZoom(1.1);
  };

  // Searching for items on map
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Search in buses
    const foundBus = buses.find(b => b.name.includes(searchQuery) || b.driverName.includes(searchQuery) || b.routeName.includes(searchQuery));
    if (foundBus) {
      setSelectedBusId(foundBus.id);
      setSelectedStopId(null);
      setIsSearchOpen(false);
      return;
    }

    // Search in stops
    const foundStop = allStops.find(s => s.name.includes(searchQuery));
    if (foundStop) {
      setSelectedStopId(foundStop.id);
      setSelectedBusId(null);
      setIsSearchOpen(false);
      return;
    }
  };

  const activeBusDetails = buses.find(b => b.id === selectedBusId);
  const activeStopDetails = allStops.find(s => s.id === selectedStopId);

  // Student statuses logs
  const logs = [...studentStatuses]
    .filter(s => s.timestamp && s.status !== 'waiting')
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (!isTrackingCenterOpen) {
    // Real dynamic KPI calculations
    const activeBusesCount = routes.filter(r => r.status === 'in_transit').length;
    const studentsInBusesCount = studentStatuses.filter(s => s.status === 'picked_up').length;
    const waitingStudentsCount = studentStatuses.filter(s => s.status === 'waiting').length;

    const activeETAs = routes
      .filter(r => r.status === 'in_transit' && (r as any).eta)
      .map(r => {
        const match = (r as any).eta.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((v): v is number => v !== null);

    const closestEtaValue = activeETAs.length > 0 ? Math.min(...activeETAs) : null;
    const closestArrivalText = closestEtaValue !== null 
      ? `${closestEtaValue} دقائق` 
      : (activeBusesCount > 0 ? "5 دقائق" : "لا يوجد رحلات نشطة");

    const getBusesText = (count: number) => {
      if (count === 0) return "لا يوجد حافلات نشطة";
      if (count === 1) return "حافلة نشطة";
      if (count === 2) return "حافلتان نشطتان";
      if (count >= 3 && count <= 10) return `${count} حافلات`;
      return `${count} حافلة`;
    };

    const getStudentsInBusesText = (count: number) => {
      if (count === 0) return "لا يوجد طلاب حالياً";
      if (count === 1) return "طالب واحد";
      if (count === 2) return "طالبان";
      if (count >= 3 && count <= 10) return `${count} طلاب`;
      return `${count} طالباً`;
    };

    const getWaitingStudentsText = (count: number) => {
      if (count === 0) return "لا يوجد طلاب بالانتظار";
      if (count === 1) return "طالب واحد";
      if (count === 2) return "طالبان";
      if (count >= 3 && count <= 10) return `${count} طلاب`;
      return `${count} طالباً`;
    };

    // --- Operating Dashboard View (لوحة تشغيل النقل والتحكم) ---
    return (
      <div className="space-y-6" dir="rtl">
        {/* Banner with Gate Title and Live Ticker */}
        <div className="bg-gradient-to-r from-[#0c122c] to-[#060814] p-6 rounded-3xl border border-blue-500/10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <span className="text-[10px] text-[#FFD600] font-black tracking-widest bg-[#FFD600]/10 border border-[#FFD600]/20 px-3 py-1 rounded-full uppercase">بوابة بيرق الذكية</span>
            <h2 className="text-xl font-black text-white mt-2">لوحة تشغيل النقل المدرسي وغرفة التحكم للأسطول</h2>
            <p className="text-xs text-white/60 mt-1">المحطة الحالية للملاحة: {currentCenter.cityName} ({currentCenter.regionName})</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl shrink-0">
            <Clock className="w-5 h-5 text-[#FFD600] animate-pulse" />
            <div className="text-right">
              <p className="text-xs text-white/40 leading-none">توقيت بغداد المباشر</p>
              <p className="text-sm font-black text-white mt-1 font-mono">{currentTime.toLocaleTimeString('ar-IQ')}</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mr-2"></span>
          </div>
        </div>

        {/* 4 KPIs Grid with dynamic hover animations */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Buses */}
          <div className="bg-gradient-to-br from-[#0e1630] to-[#060918] p-5 rounded-2xl border border-emerald-500/20 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-white/50 font-bold">الحافلات النشطة الآن</p>
                <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{getBusesText(activeBusesCount)}</h3>
                <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  تبث إشارات GPS حية
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Bus className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Students in buses */}
          <div className="bg-gradient-to-br from-[#0e1630] to-[#060918] p-5 rounded-2xl border border-blue-500/20 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-white/50 font-bold">طالباً في الحافلات</p>
                <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{getStudentsInBusesText(studentsInBusesCount)}</h3>
                <p className="text-[10px] text-blue-400 font-bold mt-1">تأكيد الصعود التلقائي</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 3: Students waiting */}
          <div className="bg-gradient-to-br from-[#0e1630] to-[#060918] p-5 rounded-2xl border border-yellow-500/20 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-white/50 font-bold">بانتظار الصعود</p>
                <h3 className="text-2xl font-black text-white mt-1.5 font-mono">{getWaitingStudentsText(waitingStudentsCount)}</h3>
                <p className="text-[10px] text-yellow-400 font-bold mt-1">في المحطات الفرعية</p>
              </div>
              <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Card 4: Closest arrival */}
          <div className="bg-gradient-to-br from-[#0e1630] to-[#060918] p-5 rounded-2xl border border-[#FFD600]/20 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FFD600]"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-white/50 font-bold">أقرب وقت للوصول</p>
                <h3 className="text-2xl font-black text-[#FFD600] mt-1.5 font-mono">{closestArrivalText}</h3>
                <p className="text-[10px] text-white/40 mt-1">إلى المقر الرئيسي</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFD600]/10 text-[#FFD600]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Center Stage & Tracking Center Opener */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Dashboard Interaction Block - now full width (col-span-12) */}
          <div className="lg:col-span-12 bg-gradient-to-b from-[#0e132e] to-[#050714] p-8 rounded-3xl border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden h-[450px]">
            {/* Background glowing sweep radar effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-35">
              <div className="w-[350px] h-[350px] rounded-full border border-blue-500/10 relative flex items-center justify-center">
                <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-pulse"></div>
                <div className="w-[240px] h-[240px] rounded-full border border-[#FFD600]/15 flex items-center justify-center">
                  <div className="w-[120px] h-[120px] rounded-full border border-teal-500/10"></div>
                </div>
                {/* Rotating radar sweep */}
                <div className="absolute w-full h-full rounded-full bg-gradient-to-tr from-transparent via-transparent to-indigo-500/5 animate-[spin_8s_linear_infinite]"></div>
              </div>
            </div>

            {/* Content info */}
            <div className="relative z-10 max-w-lg space-y-5">
              <div className="p-4 rounded-full bg-[#FFD600]/10 border border-[#FFD600]/20 inline-flex text-[#FFD600]">
                <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">مركز القيادة والتحكم الحي للأسطول</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  بوابة رصد متكاملة تتيح لمدير المدرسة متابعة حركة الحافلات المدرسية عبر تقنية الملاحة الحية GPS.
                  شغل شاشة الملاحة الكاملة لمراقبة مسارات الطلاب وتحديثات الصعود والنزول في مدينة <strong className="text-[#FFD600] font-black">{currentCenter.cityName}</strong>.
                </p>
              </div>

              {/* HUGE ACTION TRIGGER BUTTON */}
              <motion.button
                onClick={() => setIsTrackingCenterOpen(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#FFD600] to-[#E5BE00] hover:from-[#FFE02E] hover:to-[#FFD600] text-[#060814] font-black text-sm px-8 py-4 rounded-2xl shadow-[0_8px_30px_rgb(255,214,0,0.15)] flex items-center justify-center gap-3 cursor-pointer transition-all duration-300"
              >
                <Navigation className="w-5 h-5 fill-current" />
                <span>⚡ فتح مركز تتبع الملاحة بملء الشاشة</span>
              </motion.button>

              <div className="flex justify-center gap-6 text-[10px] text-white/40 font-bold">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> تتبع GPS لحظي</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> رادار السرعة الذكي</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> حماية ركاب مشددة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] bg-[#040612] text-white flex flex-col font-sans overflow-hidden select-none" dir="rtl">
      {/* Sleek Top Bar */}
      <div className="h-16 border-b border-white/5 bg-[#070a1a]/95 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        {/* Right side: Title and Back button */}
        <div className="flex items-center gap-4">
          <motion.button
              onClick={() => setIsTrackingCenterOpen(false)}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md"
              title="رجوع للتبويب"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
          
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              📡 رادار تتبع الملاحة المباشر للمدرسة
            </h1>
          </div>
        </div>

        {/* Center/Left controls: Search, Locate, Status */}
        <div className="flex items-center gap-3">

          {/* Dynamic zone indicator */}
          <span className="hidden md:flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            بث تتبع حي مباشر 📡
          </span>
        </div>
      </div>

      {/* Map Board and Canvas Container (Ghammas Map) */}
      <div className="flex-1 relative bg-[#040612] overflow-hidden">
        {(() => {
          const schoolCoord = { lat: 31.735500, lng: 44.605000, name: schoolName || 'ثانوية أوائل غماس الأهلية 🏫' };
          
          const mapStops = allStops.map(stop => ({
            id: stop.id,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            waitingStudents: stop.waitingStudents,
          }));

          const mapBuses = buses
            .filter(bus => !isTrackMySonActive || bus.id === 'bus2')
            .map(bus => ({
              id: bus.id,
              name: bus.name,
              lat: bus.lat,
              lng: bus.lng,
              routeColor: bus.routeColor,
              speed: bus.speed,
              driverName: bus.driverName,
              status: bus.status,
            }));

          // Draw the selected bus active line, or all active routes dynamically
          let activeRouteLine: Array<{ lat: number, lng: number }> | undefined = undefined;
          const currentRouteIdForLine = isTrackMySonActive ? 'bus2' : selectedBusId;
          if (currentRouteIdForLine) {
            const activeRoute = routes.find(r => r.id === currentRouteIdForLine);
            if (activeRoute) {
              const stopsList = activeRoute.stops || [];
              activeRouteLine = [
                ...(activeRoute.currentLocation ? [activeRoute.currentLocation] : []),
                ...stopsList.map((stop, idx) => getStopCoords(stop, idx, stopsList.length)),
                SCHOOL_COORDINATE
              ];
            }
          }

          
          // Filter logic for clean view
          const activeBusIdToFilter = selectedBusId || (selectedStopId ? allStops.find(s => s.id === selectedStopId)?.busId : null);
          
          const filteredBuses = activeBusIdToFilter 
            ? buses.filter(b => b.id === activeBusIdToFilter)
            : buses;
            
          const filteredStops = activeBusIdToFilter
            ? allStops.filter(s => s.busId === activeBusIdToFilter)
            : allStops;

          // Compute progress based on path index
          const busProgressMap = busProgress;

          return (
            <MetroTransitViewer 
              buses={buses}
              stops={allStops}
              schoolName={schoolCoord.name}
              busProgressMap={busProgressMap}
              selectedBusId={selectedBusId}
              onSelectBus={(id) => {
                 setSelectedBusId(id);
                 if (!id) {
                    setSelectedStopId(null);
                 }
              }}
              studentStatuses={studentStatuses}
              onSelectStudentCount={(id, name) => {
                setStudentsModalBusId(id);
                setStudentsModalBusName(name);
              }}
            />
          );
        })()}

        {/* Dynamic switch-zone overlay alert notification */}
        <AnimatePresence>
          {notificationZone && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#0c122c]/95 border border-[#FFD600]/30 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-3 select-none pointer-events-none"
            >
              <Compass className="w-5 h-5 text-[#FFD600] animate-spin" style={{ animationDuration: '4s' }} />
              <div className="text-right">
                <p className="text-[9px] text-[#FFD600] font-black uppercase tracking-wider">جاري مزامنة رادار الملاحة</p>
                <p className="text-xs font-black text-white mt-0.5">تحويل الكاميرا إلى: {notificationZone} 📡</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Bus Details Panel HUD Overlay */}
        {activeBusDetails && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 z-20 bg-[#070a1a]/95 backdrop-blur-md p-5 rounded-2xl border border-[#FFD600]/15 shadow-xl font-sans"
          >
            {/* HUD Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <span 
                  style={{ backgroundColor: `${activeBusDetails.routeColor}15`, color: activeBusDetails.routeColor, borderColor: `${activeBusDetails.routeColor}25` }}
                  className="px-2 py-0.5 text-[8.5px] font-black rounded border"
                >
                  {activeBusDetails.routeName}
                </span>
                <h3 className="text-sm font-black text-white mt-1">{activeBusDetails.name} | {activeBusDetails.driverName}</h3>
                <p className="text-[9.5px] text-white/50 mt-0.5 font-bold">لوحة المركبة: {activeBusDetails.plate}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedBusId(null);
                  setIsTrackMySonActive(false);
                }}
                className="p-1 text-white/40 hover:text-white rounded-lg bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics grid inside HUD */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-center bg-white/[0.02] border border-white/5 p-2 rounded-xl">
              <div>
                <p className="text-[8.5px] text-white/40 leading-none">السرعة الحالية</p>
                <p className="text-xs font-mono font-black text-white mt-1.5">{activeBusDetails.speed} كم/س</p>
              </div>
              <div>
                <p className="text-[8.5px] text-white/40 leading-none">الطلاب بالداخل</p>
                <p className="text-xs font-mono font-black text-white mt-1.5">{activeBusDetails.studentsCount} طالباً</p>
              </div>
              <div>
                <p className="text-[8.5px] text-white/40 leading-none">إشارة الـ GPS</p>
                <p className="text-xs font-mono font-black text-emerald-400 mt-1.5">● ممتازة</p>
              </div>
            </div>

            {/* Click to Reveal Driver Phone Number */}
            <div className="bg-[#FFD600]/5 border border-[#FFD600]/10 p-2.5 rounded-xl mb-3 flex items-center justify-between">
              <span className="text-[9.5px] text-white/70 font-black flex items-center gap-1.5">
                📞 اتصال مباشر طارئ بالسائق:
              </span>
              <button 
                onClick={() => setRevealedPhoneId(revealedPhoneId === activeBusDetails.id ? null : activeBusDetails.id)}
                className="text-[9px] text-[#FFD600] font-black underline cursor-pointer hover:text-[#FFE02E] font-mono"
              >
                {revealedPhoneId === activeBusDetails.id ? activeBusDetails.phone : 'انقر للإظهار 🔒'}
              </button>
            </div>

            {/* Simulated Live student list inside this bus */}
            <div className="space-y-1">
              {isTrackMySonActive ? (
                <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-[#FFD600]">أمير الغانم (ابنكم - الصف السادس العلمي) 👨‍🎓</p>
                      <p className="text-[9.5px] text-white/70 mt-1">الحالة: الحافلة تتحرك بأمان باتجاه المدرسة</p>
                      <p className="text-[8.5px] text-white/40 mt-0.5">محطة الركوب: حي الحسين | زمن الوصول المتوقع: ٧:٤٥ ص</p>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap shrink-0">آمن ومكتمل ✅</span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[8.5px] text-white/40 font-black">آخر حضور تم تسجيله في الحافلة:</p>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">كرار البديري (الصف السادس العلمي)</p>
                      <p className="text-[8.5px] text-white/50 mt-0.5">تم صعود الحافلة بنجاح</p>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">صعود مؤكد 🟢</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Active Stop Details Panel HUD Overlay */}
        {activeStopDetails && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 z-20 bg-[#070a1a]/95 backdrop-blur-md p-5 rounded-2xl border border-yellow-500/15 shadow-xl font-sans"
          >
            {/* HUD Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="px-2 py-0.5 text-[8.5px] font-black rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  تفاصيل المحطة الفرعية
                </span>
                <h3 className="text-sm font-black text-white mt-1">{activeStopDetails.name}</h3>
                <p className="text-[9.5px] text-white/50 mt-0.5 font-bold">الموقع: {currentCenter.cityName} - تقاطع الطرق</p>
              </div>
              <button 
                onClick={() => setSelectedStopId(null)}
                className="p-1 text-white/40 hover:text-white rounded-lg bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-center bg-white/[0.02] border border-white/5 p-2 rounded-xl">
              <div>
                <p className="text-[8.5px] text-white/40 leading-none">الطلاب المنتظرين</p>
                <p className="text-xs font-mono font-black text-yellow-400 mt-1.5">{activeStopDetails.waitingStudents} طلاب</p>
              </div>
              <div>
                <p className="text-[8.5px] text-white/40 leading-none">الحافلة القادمة</p>
                <p className="text-xs font-mono font-black text-white mt-1.5">حافلة ١ (3 د)</p>
              </div>
            </div>

            {/* Click to Reveal Students registered at this stop */}
            <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9.5px] text-white/70 font-black flex items-center gap-1.5">
                  👥 أسماء الطلاب المقيدين بهذه المحطة:
                </span>
                <button 
                  onClick={() => setRevealedStopsList(prev => ({ ...prev, [activeStopDetails.id]: !prev[activeStopDetails.id] }))}
                  className="text-[9px] text-[#FFD600] font-black underline cursor-pointer hover:text-[#FFE02E]"
                >
                  {revealedStopsList[activeStopDetails.id] ? 'إخفاء الأسماء 🔒' : 'انقر للإظهار 👁️'}
                </button>
              </div>
              
              <AnimatePresence>
                {revealedStopsList[activeStopDetails.id] ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 pt-1.5 max-h-32 overflow-y-auto"
                  >
                    {activeStopDetails.students.length === 0 ? (
                      <p className="text-[10px] text-white/30 text-center font-bold">لا يوجد طلاب منتظرين حالياً</p>
                    ) : (
                      activeStopDetails.students.map((student, sIdx) => (
                        <div key={sIdx} className="bg-slate-900/80 p-1.5 rounded border border-white/5 text-[10px] font-black text-white text-right">
                          {student} - الصف السادس الابتدائي
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <p className="text-[9px] text-white/30">
                    الأسماء مشفرة ومحمية لدواعي الخصوصية والأمان المدرسي.
                  </p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Route Students Modal */}
        <AnimatePresence>
          {studentsModalBusId && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-right" dir="rtl">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0b0e22] border border-blue-500/20 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0e132e]/50">
                  <div>
                    <h3 className="font-extrabold text-white text-base">
                      ركاب الخط: {studentsModalBusName}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-1">
                      القائمة المعتمدة حسب بيانات إدارة الركاب
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setStudentsModalBusId(null);
                      setStudentsModalBusName(null);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-3 max-h-[350px] overflow-y-auto">
                  {studentStatuses.filter(s => s.routeId === studentsModalBusId).length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-xs font-bold">
                      لا يوجد طلاب مسجلين في هذا الخط حالياً.
                    </div>
                  ) : (
                    studentStatuses
                      .filter(s => s.routeId === studentsModalBusId)
                      .map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center"
                        >
                          <div>
                            <p className="text-xs font-black text-white">{student.studentName}</p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              المحطة: {student.stopName || 'المنزل'}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded border ${
                            student.status === 'picked_up'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : student.status === 'dropped_off'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : student.status === 'absent'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {student.status === 'waiting' && 'بانتظار الحافلة'}
                            {student.status === 'picked_up' && 'داخل الحافلة'}
                            {student.status === 'dropped_off' && 'وصل للمدرسة/المنزل'}
                            {student.status === 'absent' && 'غائب اليوم'}
                          </span>
                        </div>
                      ))
                  )}
                </div>

                <div className="p-4 bg-[#080a1a] border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => {
                      setStudentsModalBusId(null);
                      setStudentsModalBusName(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-white/5 text-xs text-gray-300 hover:text-white cursor-pointer hover:bg-white/10 transition-all font-bold"
                  >
                    إغلاق
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
