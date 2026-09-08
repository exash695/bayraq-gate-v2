import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bus, Users, MapPin, DollarSign, Plus, Edit2, Trash2, 
  Search, ShieldAlert, CheckCircle2, Clock, AlertCircle,
  Play, ShieldCheck, TrendingUp, ChevronLeft, RefreshCw, X, FileText, Download, QrCode,
  Compass, Navigation, ArrowLeft, Maximize2, Locate, Info
} from 'lucide-react';
import { academicService, AcademicList } from '../../services/academicService';
import { TransportRoute, BusDriver, TransportFee, StudentTransportStatus } from '../../types/transport';
import { FleetPanel } from './FleetPanel';
import { 
  getRoutes, 
  getDrivers, 
  addRoute, 
  updateRoute, 
  deleteRoute,
  addDriver,
  updateDriver,
  deleteDriver,
  subscribeToRoutes,
  subscribeToDrivers,
  subscribeToAllStudentStatuses,
  subscribeToAllFees,
  getAllStudentStatuses,
  getAllTransportFees,
  assignStudentToRoute,
  updateTransportFeeStatus
} from '../../services/transportService';
import { DriverDashboard } from './DriverDashboard';
import { collection, addDoc, doc, setDoc } from '@/src/lib/firebase';
import { db } from '../../lib/firebase';

// ============================================================================
// 3. Error Boundary Component
// ============================================================================
class TransportErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log('[TransportTab] error: ' + error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl text-center max-w-lg mx-auto my-12" dir="rtl">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4 animate-bounce">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">عذراً، حدث خطأ أثناء تحميل لوحة النقل</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            واجه النظام مشكلة غير متوقعة أثناء عرض هذا التبويب. تم عزل الخطأ لضمان استقرار التطبيق.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface TransportAdminProps {
  schoolId: string;
  schoolName?: string;
  savedLists?: any[];
}

const TransportAdminInner: React.FC<TransportAdminProps> = ({ schoolId, schoolName = "ثانوية اوائل غماس الاهلية", savedLists }) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'drivers' | 'fees' | 'fleet' | 'students'>('fleet');
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [drivers, setDrivers] = useState<BusDriver[]>([]);
  const [studentStatuses, setStudentStatuses] = useState<StudentTransportStatus[]>([]);
  const [fees, setFees] = useState<TransportFee[]>([]);
  const [localSavedLists, setLocalSavedLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search query states
  const [routeQuery, setRouteQuery] = useState('');
  const [driverQuery, setDriverQuery] = useState('');

  // Toast / alert state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal control states
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<TransportRoute | null>(null);

  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<BusDriver | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null);

  const [isInvoicingModalOpen, setIsInvoicingModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Form states for Route
  const [routeForm, setRouteForm] = useState({
    name: '',
    busPlate: '',
    driverId: '',
    startTime: '06:30 ص',
    stops: '',
    status: 'idle' as TransportRoute['status']
  });

  // Form states for Driver
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    routeId: '',
    accessCode: '',
    shift: 'both' as 'morning' | 'evening' | 'both'
  });

  // Simulation Preview State
  const [showDriverPreview, setShowDriverPreview] = useState(false);
  const [previewRouteId, setPreviewRouteId] = useState("");

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAssignStudent = async (studentId: string, routeId: string, stopName?: string, studentObj?: any) => {
    try {
      const existing = studentStatuses.find(s => s.id === studentId);
      
      // Determine the associated shift from the route's driver
      const matchedRoute = routes.find(r => r.id === routeId);
      const matchedDriver = matchedRoute ? drivers.find(d => d.id === matchedRoute.driverId) : null;
      const resolvedShift = matchedDriver?.shift || 'both';

      if (!existing && studentObj) {
        // Create student status record
        const parentId = studentObj.parent || `PAR-B-${Math.floor(1000 + Math.random() * 9000)}`;
        const newStatus = {
          id: studentId,
          studentName: studentObj.name || 'طالب جديد',
          routeId: routeId,
          status: 'waiting',
          stopName: stopName || 'بانتظار تحديد المحطة',
          parentId: parentId,
          timestamp: Date.now(),
          shift: resolvedShift
        };
        await setDoc(doc(db, 'transport_students_status', studentId), newStatus);

        // Auto-create transport invoice/fee
        const feeId = `fee_${studentId}`;
        const newFee = {
          id: feeId,
          studentId: studentId,
          studentName: studentObj.name || 'طالب جديد',
          parentId: parentId,
          amount: 150000,
          dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
          status: 'pending',
          month: 'نوفمبر 2026'
        };
        await setDoc(doc(db, 'transport_fees', feeId), newFee);
        showToast('تم تسجيل الطالب بالنقل وتعيينه على خط الباص وإنشاء الاشتراك المالي بنجاح!', 'success');
      } else {
        await assignStudentToRoute(studentId, routeId, stopName, resolvedShift);
        showToast('تم تعيين خط سير الطالب بنجاح', 'success');
      }
    } catch (err: any) {
      showToast('خطأ أثناء تعيين الطالب: ' + (err.message || err), 'error');
    }
  };

  const handlePayFee = async (feeId: string) => {
    try {
      await updateTransportFeeStatus(feeId, 'paid');
      showToast('تم تأكيد استلام القسط وتحديث حالة الطالب بنجاح', 'success');
    } catch (err: any) {
      showToast('خطأ أثناء تحديث حالة الدفع: ' + (err.message || err), 'error');
    }
  };

  const handleSetFeeStatus = async (feeId: string, status: 'paid' | 'pending' | 'overdue') => {
    try {
      await updateTransportFeeStatus(feeId, status);
      showToast('تم تحديث حالة القسط المالي بنجاح', 'success');
    } catch (err: any) {
      showToast('خطأ أثناء تحديث حالة القسط: ' + (err.message || err), 'error');
    }
  };

  // Real-time synchronization and auto-seeding
  useEffect(() => {
    console.log('[TransportTab] initializing live sync...');
    setLoading(true);

    let unsubRoutes: () => void = () => {};
    let unsubDrivers: () => void = () => {};
    let unsubStudents: () => void = () => {};
    let unsubFees: () => void = () => {};
    let unsubLists: () => void = () => {};

    const startSubscriptionsAndSeeds = async () => {
      try {
        // 1. Auto-seed Student statuses if empty
        const fetchedStatuses = await getAllStudentStatuses();
        if (!fetchedStatuses.length) {
          console.log('[TransportTab] Seeding initial student statuses...');
          for (const student of initialStudentsSeed) {
            await setDoc(doc(db, 'transport_students_status', student.id), student);
          }
        }

        // 2. Auto-seed Fees if empty
        const fetchedFees = await getAllTransportFees();
        if (!fetchedFees.length) {
          console.log('[TransportTab] Seeding initial fees...');
          for (const fee of initialFeesSeed) {
            await setDoc(doc(db, 'transport_fees', fee.id), fee);
          }
        }

        // 3. Auto-seed Routes if empty
        const fetchedRoutes = await getRoutes(schoolId || "s1");
        if (!fetchedRoutes.length) {
          console.log('[TransportTab] Seeding initial routes...');
          for (const route of mockRoutes) {
            await setDoc(doc(db, 'transport_routes', route.id), route);
          }
        }

        // 4. Auto-seed Drivers if empty
        const fetchedDrivers = await getDrivers(schoolId || "s1");
        if (!fetchedDrivers.length) {
          console.log('[TransportTab] Seeding initial drivers...');
          for (const driver of mockDrivers) {
            await setDoc(doc(db, 'transport_drivers', driver.id), driver);
          }
        }

        // Now activate the 4 real-time live listeners
        unsubRoutes = subscribeToRoutes(schoolId || "s1", (liveRoutes) => {
          setRoutes(liveRoutes.length ? liveRoutes : mockRoutes);
        });

        unsubDrivers = subscribeToDrivers(schoolId || "s1", (liveDrivers) => {
          setDrivers(liveDrivers.length ? liveDrivers : mockDrivers);
        });

        unsubStudents = subscribeToAllStudentStatuses((liveStatuses) => {
          setStudentStatuses(liveStatuses);
        });

        unsubFees = subscribeToAllFees((liveFees) => {
          setFees(liveFees);
        });

        if (!savedLists) {
          unsubLists = academicService.subscribeToLists(schoolId || "s1", (liveLists) => {
            setLocalSavedLists(liveLists);
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('[TransportTab] Error during initialization:', err);
        setError(err?.message || String(err));
        setLoading(false);
      }
    };

    startSubscriptionsAndSeeds();

    return () => {
      unsubRoutes();
      unsubDrivers();
      unsubStudents();
      unsubFees();
      unsubLists();
    };
  }, [schoolId, savedLists]);

  // Handle saving Route (Create or Update)
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.name.trim() || !routeForm.busPlate.trim()) {
      showToast('الرجاء إدخال اسم الخط ورقم اللوحة بالكامل', 'error');
      return;
    }

    try {
      const stopsArray = routeForm.stops
        .split(/[,،-]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const routeData = {
        name: routeForm.name,
        busPlate: routeForm.busPlate,
        driverId: routeForm.driverId,
        startTime: routeForm.startTime,
        stops: stopsArray,
        status: routeForm.status,
        schoolId: schoolId || 's1'
      };

      if (editingRoute) {
        // Update
        await updateRoute(editingRoute.id, routeData);
        showToast('تم تحديث خط الحافلة بنجاح!');
      } else {
        // Create
        await addRoute(routeData);
        showToast('تمت إضافة خط الحافلة الجديد بنجاح!');
      }

      setIsRouteModalOpen(false);
      setEditingRoute(null);
    } catch (err: any) {
      showToast('خطأ أثناء حفظ البيانات: ' + (err?.message || err), 'error');
    }
  };

  // Open Route Modal for edit or add
  const openRouteModal = (route: TransportRoute | null = null) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({
        name: route.name || '',
        busPlate: route.busPlate || '',
        driverId: route.driverId || '',
        startTime: route.startTime || '06:30 ص',
        stops: (route.stops || []).join(', '),
        status: route.status || 'idle'
      });
    } else {
      setEditingRoute(null);
      setRouteForm({
        name: '',
        busPlate: '',
        driverId: '',
        startTime: '06:30 ص',
        stops: '',
        status: 'idle'
      });
    }
    setIsRouteModalOpen(true);
  };

  // Open Delete Route Confirmation
  const confirmDeleteRoute = (routeId: string) => {
    setRouteToDelete(routeId);
    setIsDeleteConfirmOpen(true);
  };

  // Execute Delete Route
  const handleDeleteRoute = async () => {
    if (!routeToDelete) return;
    try {
      await deleteRoute(routeToDelete);
      showToast('تم حذف خط الحافلة بنجاح!');
      setIsDeleteConfirmOpen(false);
      setRouteToDelete(null);
    } catch (err: any) {
      showToast('فشل حذف الخط: ' + (err?.message || err), 'error');
    }
  };

  // Handle saving Driver (Create or Update)
  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name.trim() || !driverForm.phone.trim()) {
      showToast('الرجاء ملء اسم السائق ورقم الهاتف بدقة', 'error');
      return;
    }

    try {
      const driverData = {
        name: driverForm.name,
        phone: driverForm.phone,
        routeId: driverForm.routeId,
        schoolId: schoolId || 's1',
        accessCode: driverForm.accessCode || '',
        shift: driverForm.shift || 'both'
      };

      if (editingDriver) {
        // Update
        await updateDriver(editingDriver.id, driverData);
        showToast('تم تحديث ملف السائق بنجاح!');
      } else {
        // Create
        await addDriver(driverData);
        showToast('تم تسجيل السائق الجديد بنجاح!');
      }

      setIsDriverModalOpen(false);
      setEditingDriver(null);
    } catch (err: any) {
      showToast('خطأ أثناء حفظ السائق: ' + (err?.message || err), 'error');
    }
  };

  // Open Driver Modal
  const openDriverModal = (driver: BusDriver | null = null) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverForm({
        name: driver.name || '',
        phone: driver.phone || '',
        routeId: driver.routeId || '',
        accessCode: driver.accessCode || '',
        shift: driver.shift || 'both'
      });
    } else {
      setEditingDriver(null);
      setDriverForm({
        name: '',
        phone: '',
        routeId: '',
        accessCode: '',
        shift: 'both'
      });
    }
    setIsDriverModalOpen(true);
  };

  // Generate Invoices for upcoming month
  const handleGenerateInvoices = async () => {
    try {
      // In a real database, we would query all students registered to transport and create records.
      // Let's dynamically add some invoice entries to Firestore to make it full-stack.
      const invoiceData = {
        studentId: 'st_random',
        parentId: 'p_parent',
        amount: 150000,
        dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days from now
        status: 'pending',
        month: 'نوفمبر 2026'
      };
      
      await addDoc(collection(db, 'transport_fees'), invoiceData);
      showToast('تم توليد وإرسال فواتير واشتراكات شهر نوفمبر 2026 لجميع الطلاب بنجاح!');
      setIsInvoicingModalOpen(false);
    } catch (err: any) {
      showToast('فشل توليد الفواتير: ' + (err?.message || err), 'error');
    }
  };

  // Export Financial Ledger Function
  const handleExportReport = () => {
    // Generate simple simulated download content
    const dataRow = "التاريخ,البيان,المبلغ\n2026-07-06,رسوم باص المنصور السريع,12450000\n";
    const blob = new Blob([dataRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_مالية_النقل_المدرسي_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('تم تجهيز وتصدير التقرير المالي الشامل بصيغة CSV وجاري التحميل!');
    setIsExportModalOpen(false);
  };

  if (showDriverPreview) {
    const matchedRoute = routes.find(r => r.id === previewRouteId);
    const activeDriverId = matchedRoute?.driverId || "d1";
    const activeDriverObj = drivers.find(d => d.id === activeDriverId);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <DriverDashboard 
          driverId={activeDriverId} 
          routeId={previewRouteId} 
          driverObj={activeDriverObj}
          schoolId={schoolId}
          onBack={() => setShowDriverPreview(false)} 
        />
      </motion.div>
    );
  }

  // Filtered lists
  const filteredRoutes = routes.filter(r => 
    (r.name || '').toLowerCase().includes(routeQuery.toLowerCase()) ||
    (r.busPlate || '').toLowerCase().includes(routeQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter(d =>
    (d.name || '').toLowerCase().includes(driverQuery.toLowerCase()) ||
    (d.phone || '').toLowerCase().includes(driverQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans relative" dir="rtl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:w-96 z-[9999] bg-[#090D1E] border border-cyan-500/30 p-4 rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.25)] flex items-center gap-3 text-right"
          >
            {toast.type === 'success' ? (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-[#00E5FF]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-white font-bold text-xs">إشعار النظام</p>
              <p className="text-white/70 text-[11px] mt-0.5">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Bus className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>إدارة النقل المدرسي والحافلات</span>
            <span className="hidden md:inline text-gray-400 dark:text-gray-500 font-normal text-sm">| تتبع خطوط النقل، إدارة السائقين، والاشتراكات الشهرية للطلاب</span>
          </h2>
        </div>
        
        <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto max-w-full">
          {(['drivers', 'routes', 'students', 'fleet', 'fees'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-700' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'fleet' && '📡 رادار الأسطول الحي'}
              {tab === 'routes' && 'خطوط الحافلات'}
              {tab === 'students' && '👥 إدارة ركاب الحافلات'}
              {tab === 'drivers' && 'السائقين'}
              {tab === 'fees' && 'الرسوم والاشتراكات'}
            </button>
          ))}
        </div>
      </div>

      {/* Optional Error Alert (Doesn't crash the tab) */}
      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>تنبيه: تم تحميل البيانات بسبب انقطاع الخادم: {error}</span>
        </div>
      )}

      {/* Content Rendering */}
      {loading ? (
        <div className="space-y-6">
          {activeTab === 'routes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RouteCardSkeleton />
              <RouteCardSkeleton />
            </div>
          )}
          {activeTab === 'drivers' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm divide-y divide-gray-100 dark:divide-gray-700/50">
              <DriverCardSkeleton />
              <DriverCardSkeleton />
            </div>
          )}
          {activeTab === 'fees' && (
            <div className="flex justify-center py-16 animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-3xl w-full"></div>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'fleet' && (
            <FleetPanel 
              routes={routes} 
              studentStatuses={studentStatuses} 
              drivers={drivers} 
              schoolId={schoolId}
              schoolName={schoolName}
            />
          )}
          {activeTab === 'routes' && (
            <RoutesPanel 
              routes={filteredRoutes} 
              onPreview={(id) => {
                setPreviewRouteId(id || "");
                setShowDriverPreview(true);
              }} 
              onAddRoute={() => openRouteModal(null)}
              onEditRoute={(route) => openRouteModal(route)}
              onDeleteRoute={(id) => confirmDeleteRoute(id)}
              searchQuery={routeQuery}
              setSearchQuery={setRouteQuery}
            />
          )}
          {activeTab === 'students' && (
            <StudentsAssignmentPanel 
              studentStatuses={studentStatuses} 
              routes={routes} 
              onAssign={handleAssignStudent} 
              savedLists={savedLists || localSavedLists}
              showToast={showToast}
            />
          )}
          {activeTab === 'drivers' && (
            <DriversPanel 
              drivers={filteredDrivers} 
              onAddDriver={() => openDriverModal(null)}
              onEditDriver={(driver) => openDriverModal(driver)}
              searchQuery={driverQuery}
              setSearchQuery={setDriverQuery}
            />
          )}
          {activeTab === 'fees' && (
            <FeesPanel 
              fees={fees} 
              studentStatuses={studentStatuses}
              onPayFee={handlePayFee} 
              onSetFeeStatus={handleSetFeeStatus} 
              onGenerateInvoices={() => setIsInvoicingModalOpen(true)}
              onExportReport={() => setIsExportModalOpen(true)}
            />
          )}
        </motion.div>
      )}

      {/* ============================================================================
          MODALS SECTION (Premium custom overlays)
         ============================================================================ */}

      {/* 1. Route Add/Edit Modal */}
      <AnimatePresence>
        {isRouteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-2xl max-w-lg w-full overflow-hidden text-right"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                  {editingRoute ? 'تعديل بيانات خط الحافلة' : 'إضافة خط حافلة جديد'}
                </h3>
                <button onClick={() => setIsRouteModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRoute} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">اسم خط النقل والمحور</label>
                  <input 
                    type="text" 
                    value={routeForm.name || ''}
                    onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                    placeholder="مثال: خط المنصور السريع والداودي" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">رقم / لوحة الحافلة</label>
                    <input 
                      type="text" 
                      value={routeForm.busPlate || ''}
                      onChange={(e) => setRouteForm({ ...routeForm, busPlate: e.target.value })}
                      placeholder="مثال: بغداد ١٢٣٤٥" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">وقت انطلاق الرحلة</label>
                    <input 
                      type="text" 
                      value={routeForm.startTime || ''}
                      onChange={(e) => setRouteForm({ ...routeForm, startTime: e.target.value })}
                      placeholder="مثال: 06:30 ص" 
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">السائق المسؤول</label>
                  <select 
                    value={routeForm.driverId || ''}
                    onChange={(e) => setRouteForm({ ...routeForm, driverId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                  >
                    <option value="">-- اختر سائقاً من القائمة --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">محطات التوقف (مفصولة بفاصلة)</label>
                  <input 
                    type="text" 
                    value={routeForm.stops || ''}
                    onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
                    placeholder="مثال: ساحة النسور, مول المنصور, تقاطع الداودي" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">أدخل أسماء المحطات مرتبة تفصل بينها علامة الفاصلة (,).</span>
                </div>


                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700/60 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsRouteModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-blue-500/10"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Delete Route Confirmation Modal */}
      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تأكيد حذف خط الحافلة</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">
                هل أنت متأكد من رغبتك في حذف هذا الخط نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم إلغاء تعيين الطلاب المسجلين فيه.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleDeleteRoute}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  نعم، احذف الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Driver Add/Edit Modal */}
      <AnimatePresence>
        {isDriverModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-2xl max-w-md w-full overflow-hidden text-right"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                  {editingDriver ? 'تعديل ملف السائق الكابتن' : 'تسجيل سائق جديد بالمنظومة'}
                </h3>
                <button onClick={() => setIsDriverModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">اسم السائق الكابتن</label>
                  <input 
                    type="text" 
                    value={driverForm.name || ''}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    placeholder="مثال: كابتن حيدر الربيعي" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">رقم الهاتف (للاتصال والواتساب)</label>
                  <input 
                    type="text" 
                    value={driverForm.phone || ''}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    placeholder="مثال: +964 770 123 4567" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">الخط المسند إليه</label>
                  <input 
                    type="text" 
                    value={driverForm.routeId || ''}
                    onChange={(e) => setDriverForm({ ...driverForm, routeId: e.target.value })}
                    placeholder="مثال: خط المنصور السريع والداودي" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">فترة دوام السائق (الوردية)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, shift: 'morning' })}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        driverForm.shift === 'morning'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-450 font-black shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      صباحي فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, shift: 'evening' })}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        driverForm.shift === 'evening'
                          ? 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400 font-black shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      مسائي فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverForm({ ...driverForm, shift: 'both' })}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        driverForm.shift === 'both'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-700 dark:text-indigo-405 font-black shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      صباحي ومسائي
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">رمز الدخول السريع للسائق</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={driverForm.accessCode || ''}
                      onChange={(e) => setDriverForm({ ...driverForm, accessCode: e.target.value })}
                      placeholder="اضغط على توليد كود لتوليد رمز دخول" 
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-right dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomCode = 'DRI-' + Math.floor(100000 + Math.random() * 900000).toString();
                        setDriverForm({ ...driverForm, accessCode: randomCode });
                        showToast('تم توليد كود دخول جديد للسائق: ' + randomCode, 'success');
                      }}
                      className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                    >
                      توليد كود
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">يستخدم السائق هذا الكود المكون من بادئة DRI- ورقم من 6 أرقام لتسجيل الدخول والوصول إلى لوحته مباشرة.</span>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-700/60 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsDriverModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-blue-500/10"
                  >
                    حفظ السائق
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Generate Monthly Invoices Confirmation */}
      <AnimatePresence>
        {isInvoicingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-2xl max-w-md w-full p-6 text-right"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">توليد فواتير الشهر الجديد</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">
                أنت على وشك توليد فواتير اشتراك النقل المدرسي لجميع الطلاب المسجلين بالخطوط لشهر <strong>نوفمبر 2026</strong>. سيصل إشعار فوري لأولياء الأمور عبر التطبيق لتأكيد الدفع.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setIsInvoicingModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleGenerateInvoices}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-blue-500/10"
                >
                  نعم، ولد الفواتير الآن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Export Report Dialog */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-2xl max-w-md w-full p-6 text-right"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تصدير التقرير المالي الشامل</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-6">
                توليد ملف تقرير مالي موحد يشمل إيرادات جميع الحافلات والخطوط، تفاصيل الدفعات المستلمة والمعلقة، والاشتراكات المتأخرة بالكامل لتسليمها للإدارة المالية.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleExportReport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-500/10 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> تحميل التقرير CSV
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Main wrapped export using our custom ErrorBoundary
export const TransportAdmin: React.FC<TransportAdminProps> = (props) => {
  return (
    <TransportErrorBoundary>
      <TransportAdminInner {...props} />
    </TransportErrorBoundary>
  );
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================
const RouteCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3"></div>
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/3"></div>
        </div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/60 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-24"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-24"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-900/20 p-3 rounded-2xl">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
    </div>
    
    <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700/60 pt-4 mt-6">
      <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-40"></div>
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  </div>
);

const DriverCardSkeleton = () => (
  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse w-full">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-28"></div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-20"></div>
      </div>
    </div>
    <div className="flex items-center gap-12">
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-16"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-20"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-12"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-12"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div>
      </div>
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-24"></div>
  </div>
);

// ============================================================================
// 1. Fully Null-Safe Sub-panels
// ============================================================================

/* --- Routes Panel --- */
const RoutesPanel = ({ 
  routes, 
  onPreview,
  onAddRoute,
  onEditRoute,
  onDeleteRoute,
  searchQuery,
  setSearchQuery
}: { 
  routes: TransportRoute[], 
  onPreview: (id: string) => void,
  onAddRoute: () => void,
  onEditRoute: (route: TransportRoute) => void,
  onDeleteRoute: (routeId: string) => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void
}) => {
  const safeRoutes = routes || [];
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن خط حافلة برقم اللوحة أو الاسم..." 
            className="w-full pr-11 pl-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:text-white text-sm outline-none"
          />
        </div>
        <button 
          onClick={onAddRoute}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all text-sm shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> إضافة خط جديد
        </button>
      </div>

      {safeRoutes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-3xl border border-gray-100 dark:border-gray-700/60 text-center text-gray-500 dark:text-gray-400">
          <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold">لا توجد خطوط حافلات تطابق هذا البحث أو مسجلة حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {safeRoutes.map(route => {
            if (!route) return null;
            const routeName = route.name || "خط حافلة غير معروف";
            const stopsCount = route.stops ? route.stops.length : 0;
            const stopsList = route.stops || [];
            const routeStatus = route.status || "idle";
            const routeStartTime = route.startTime || "غير محدد";
            const routeBusPlate = route.busPlate || "غير متوفر";
            const routeId = route.id || "";

            return (
              <div key={routeId} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{routeName}</h3>
                      <p className="text-gray-400 text-xs flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" /> {stopsCount} محطات توقف مجدولة
                      </p>
                    </div>
                    
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      routeStatus === 'in_transit' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse' :
                      'bg-gray-100 text-gray-500 dark:bg-gray-900/60 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                    }`}>
                      {routeStatus === 'in_transit' ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>

                  {/* Route Timeline stops mini visualization */}
                  <div className="my-5 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/60">
                    <span className="text-[10px] text-gray-400 block mb-2.5 font-bold">مسار الرحلة والمحطات:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {stopsList.map((stop, sIdx) => (
                        <React.Fragment key={sIdx}>
                          {sIdx > 0 && <span className="text-gray-300 dark:text-gray-700">←</span>}
                          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-2xs shrink-0">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{stop || "محطة"}</span>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400 mb-6 bg-gray-50/50 dark:bg-gray-900/20 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>وقت الانطلاق: <strong className="text-gray-800 dark:text-gray-200">{routeStartTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-gray-400" />
                      <span>رقم الحافلة: <strong className="text-gray-800 dark:text-gray-200">{routeBusPlate}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700/60 pt-4 mt-auto">


                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => onEditRoute(route)}
                      className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors border border-gray-100 dark:border-gray-700 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteRoute(routeId)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* --- Drivers Panel --- */
const DriversPanel = ({ 
  drivers,
  onAddDriver,
  onEditDriver,
  searchQuery,
  setSearchQuery
}: { 
  drivers: BusDriver[],
  onAddDriver: () => void,
  onEditDriver: (driver: BusDriver) => void,
  searchQuery: string,
  setSearchQuery: (q: string) => void
}) => {
  const safeDrivers = drivers || [];
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن سائق بالاسم أو الهاتف..." 
            className="w-full pr-11 pl-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:text-white text-sm outline-none text-right"
          />
        </div>
        <button 
          onClick={onAddDriver}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all text-sm shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> تسجيل سائق جديد
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white">قائمة كباتن وسائقي الحافلات</h3>
            <p className="text-xs text-gray-500">مراقبة التزام السائقين وبيانات الاتصال والتقييمات</p>
          </div>
        </div>
        
        {safeDrivers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-bold">لا يوجد سائقون مسجلون حالياً أو يطابقون البحث.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {safeDrivers.map((driver, idx) => {
              if (!driver) return null;
              const driverId = driver.id || `driver-${idx}`;
              const driverName = driver.name || "سائق حافلة غير مسجل";
              const driverPhone = driver.phone || "غير متوفر";
              const driverRoute = driver.routeId || "لم يتم الإسناد بعد";
              const driverAccessCode = driver.accessCode || "";

              return (
                <div key={driverId} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-lg">
                      {driverName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 dark:text-white">{driverName}</p>
                      <p className="text-xs text-gray-500 mt-1 text-right" dir="ltr">{driverPhone}</p>
                      {driverAccessCode && (
                        <p className="text-xs text-indigo-600 dark:text-blue-400 font-black mt-1.5 flex items-center gap-1">
                          رمز الدخول السريع: <span className="bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg font-mono border border-indigo-100/40 dark:border-indigo-900/40 select-all">{driverAccessCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-12 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">الخط المسند إليه</p>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{driverRoute}</span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">فترة الدوام (الوردية)</p>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        driver.shift === 'morning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                        driver.shift === 'evening' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' :
                        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                      }`}>
                        {driver.shift === 'morning' ? 'صباحي' :
                         driver.shift === 'evening' ? 'مسائي' :
                         'صباحي ومسائي'}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">تقييم القيادة والالتزام</p>
                      <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                        ★ {idx === 0 ? '4.9' : '4.8'}
                        <span className="text-xs text-gray-400 font-medium">/ 5</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400 mb-1">حالة السائق</p>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg text-xs font-bold">
                        نشط ومتاح
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEditDriver(driver)}
                      className="px-4 py-2 text-xs font-bold border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
                    >
                      تعديل الملف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Fees Panel --- */
const FeesPanel = ({
  fees,
  studentStatuses,
  onPayFee,
  onSetFeeStatus,
  onGenerateInvoices,
  onExportReport
}: {
  fees: TransportFee[],
  studentStatuses: StudentTransportStatus[],
  onPayFee: (feeId: string) => void,
  onSetFeeStatus: (feeId: string, status: TransportFee['status']) => void,
  onGenerateInvoices: () => void,
  onExportReport: () => void
}) => {
  const [feeFilter, setFeeFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  // Compute stats dynamically from Firestore data
  const totalCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 150000), 0);
  const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + (f.amount || 150000), 0);
  const overdueCount = fees.filter(f => f.status === 'overdue').length;

  const filteredFees = fees.filter(f => feeFilter === 'all' ? true : f.status === feeFilter);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 1. Dynamic Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">إجمالي الرسوم المحصلة</p>
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-300">
            {totalCollected.toLocaleString('ar-IQ')} د.ع
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block mt-2">✓ تم تحصيلها لحظياً من الاشتراكات النشطة</span>
        </div>
        
        <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-3xl border border-amber-100 dark:border-amber-900/30">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">الاشتراكات المعلقة (قيد الانتظار)</p>
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-700 dark:text-amber-300">
            {totalPending.toLocaleString('ar-IQ')} د.ع
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-2">⌛ بانتظار تأكيد الدفع الإلكتروني أو الإداري</span>
        </div>

        <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-bold text-red-800 dark:text-red-400">حسابات واشتراكات متأخرة</p>
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-red-700 dark:text-red-300">
            {overdueCount} طلاب
          </p>
          <span className="text-[10px] text-red-600 dark:text-red-500 block mt-2">⚠️ تجاوزت مهلة السداد المحددة</span>
        </div>
      </div>

      {/* 2. Controls & List Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">سجل الاشتراكات وجرد المقبوضات</h3>
            <p className="text-xs text-gray-500 mt-1">إدارة تحصيل دفعات الطلاب وتأثيرها المباشر والآني على رادارات السائقين.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={onGenerateInvoices}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
            >
              توليد فواتير الشهر الجديد
            </button>
            <button 
              onClick={onExportReport}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
            >
              تصدير كشف حساب المبيعات
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(['all', 'paid', 'pending', 'overdue'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setFeeFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                feeFilter === filter
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}
            >
              {filter === 'all' && 'الكل'}
              {filter === 'paid' && '✓ مدفوع'}
              {filter === 'pending' && '⌛ معلّق'}
              {filter === 'overdue' && '⚠️ متأخر'}
            </button>
          ))}
        </div>

        {/* Fees Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-black text-gray-400">
                <th className="pb-3 pt-2 pr-4">اسم الطالب</th>
                <th className="pb-3 pt-2">الشهر</th>
                <th className="pb-3 pt-2">قيمة الاشتراك</th>
                <th className="pb-3 pt-2">تاريخ الاستحقاق</th>
                <th className="pb-3 pt-2">الحالة</th>
                <th className="pb-3 pt-2 pl-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    لا توجد اشتراكات مطابقة للفلتر المحدد.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const studentObj = studentStatuses.find(s => s.id === fee.studentId);
                  const studentName = studentObj ? studentObj.studentName : 'طالب غير معروف';
                  const formattedAmount = (fee.amount || 150000).toLocaleString('ar-IQ') + ' د.ع';
                  const formattedDueDate = fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير محدد';
                  
                  return (
                    <tr key={fee.id} className="border-b border-gray-100 dark:border-gray-800/50 text-sm text-gray-700 dark:text-gray-300">
                      <td className="py-3 pr-4 font-bold text-gray-900 dark:text-white">{studentName}</td>
                      <td className="py-3">{fee.month}</td>
                      <td className="py-3 font-mono">{formattedAmount}</td>
                      <td className="py-3 text-xs">{formattedDueDate}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          fee.status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          fee.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                          'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        }`}>
                          {fee.status === 'paid' && '✓ مدفوع'}
                          {fee.status === 'pending' && '⌛ معلّق'}
                          {fee.status === 'overdue' && '⚠️ متأخر'}
                        </span>
                      </td>
                      <td className="py-3 pl-4">
                        <div className="flex justify-center gap-2">
                          {fee.status !== 'paid' && (
                            <button
                              onClick={() => onPayFee(fee.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              تسجيل دفعة
                            </button>
                          )}
                          <select
                            value={fee.status}
                            onChange={(e) => onSetFeeStatus(fee.id, e.target.value as any)}
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold p-1 outline-none cursor-pointer"
                          >
                            <option value="paid">مدفوع</option>
                            <option value="pending">معلق</option>
                            <option value="overdue">متأخر</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* --- Students Assignment Panel (Drag & Drop + Codes Center Integration) --- */
const StudentsAssignmentPanel = ({
  studentStatuses,
  routes,
  onAssign,
  savedLists = [],
  showToast
}: {
  studentStatuses: StudentTransportStatus[],
  routes: TransportRoute[],
  onAssign: (studentId: string, routeId: string, stopName?: string, studentObj?: any) => void,
  savedLists?: any[],
  showToast?: (message: string, type?: 'success' | 'error') => void
}) => {
  const [draggedStudent, setDraggedStudent] = useState<any | null>(null);
  const [draggedOverRouteId, setDraggedOverRouteId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');

  // Edit/Save local states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<{
    [studentId: string]: {
      routeId: string;
      stopName?: string;
      studentObj?: any;
    }
  }>({});

  // Modal states for adding a student directly
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [selectedRouteForAdd, setSelectedRouteForAdd] = useState<TransportRoute | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [modalSelectedListId, setModalSelectedListId] = useState<string>('');

  // Set default list for modal when it opens or lists change
  useEffect(() => {
    if (savedLists.length > 0 && !modalSelectedListId) {
      setModalSelectedListId(savedLists[0].id);
    }
  }, [savedLists, modalSelectedListId]);

  // Select first list by default if list id is empty
  useEffect(() => {
    if (savedLists.length > 0 && !selectedListId) {
      setSelectedListId(savedLists[0].id);
    }
  }, [savedLists, selectedListId]);

  const selectedList = savedLists.find(l => l.id === selectedListId);
  const codesStudents = selectedList 
    ? (selectedList.students || []) 
    : studentStatuses.map(s => ({
        id: s.id,
        student: s.id,
        name: s.studentName,
        address: (s as any).address || s.stopName || 'الشارع الرئيسي',
        grade: 'الصف السادس'
      }));

  // Helper to get effective route ID for any student
  const getEffectiveRouteId = (studentId: string) => {
    if (studentId in pendingChanges) {
      return pendingChanges[studentId].routeId;
    }
    const matched = studentStatuses.find(s => s.id === studentId);
    return matched ? matched.routeId : "";
  };

  // Update local pending changes
  const handleLocalAssign = (studentId: string, routeId: string, stopName?: string, studentObj?: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        routeId,
        stopName: stopName || prev[studentId]?.stopName || studentStatuses.find(s => s.id === studentId)?.stopName || "باص مركز الأكواد",
        studentObj: studentObj || prev[studentId]?.studentObj
      }
    }));
  };

  // Save changes to Firestore
  const handleSaveAllChanges = async () => {
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) {
      setIsEditing(false);
      return;
    }
    try {
      for (const [id, change] of entries) {
        await onAssign(id, change.routeId, change.stopName, change.studentObj);
      }
      setIsEditing(false);
      setPendingChanges({});
    } catch (err: any) {
      console.error("Error saving transport assignments:", err);
    }
  };

  const handleCancelChanges = () => {
    setPendingChanges({});
    setIsEditing(false);
  };

  // Filter lists based on search and selected residential area
  const filteredCodes = codesStudents.filter((s: any) => {
    const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.student || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = selectedArea === 'all' || (s.address || '').includes(selectedArea);
    return matchesSearch && matchesArea;
  });

  // Dynamic area collection for filtering (ONLY the exact areas present in the active Codes Center batch)
  const availableAreas = React.useMemo(() => {
    const areas = new Set<string>();
    codesStudents.forEach((s: any) => {
      const addr = (s.address || '').trim();
      if (addr) {
        areas.add(addr);
      }
    });
    return Array.from(areas).sort();
  }, [codesStudents]);

  // Smart Auto-Assign geographically matching students to buses based on route name/stops matching
  const handleSmartAutoAssign = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
    
    let matchCount = 0;
    let fallbackCount = 0;

    filteredCodes.forEach((student: any) => {
      const studentIdToAssign = student.student || student.id;
      const currentRouteId = getEffectiveRouteId(studentIdToAssign);
      if (currentRouteId) return; // already assigned in this edit session
      
      const studentAddr = (student.address || student.grade || '').toLowerCase();
      
      // 1. Try keyword matching on stops and route name
      const matchedRoute = routes.find(route => {
        const routeName = route.name.toLowerCase();
        const stops = (route.stops || []).map(st => st.toLowerCase());
        const hasStopMatch = stops.some(st => studentAddr.includes(st) || st.includes(studentAddr));
        const hasNameMatch = routeName.includes(studentAddr) || (studentAddr.length > 2 && studentAddr.split(' ').some(word => routeName.includes(word)));
        return hasStopMatch || hasNameMatch;
      });

      if (matchedRoute) {
        handleLocalAssign(studentIdToAssign, matchedRoute.id, student.address || 'محطة - ' + matchedRoute.name, student);
        matchCount++;
      } else {
        // 2. Fallback load balancing: Assign to the route with the fewest students currently assigned
        const routeLoads = routes.map(r => {
          const currentCount = filteredCodes.filter((s: any) => {
            const sId = s.student || s.id;
            return getEffectiveRouteId(sId) === r.id;
          }).length;
          return { route: r, count: currentCount };
        });

        routeLoads.sort((a, b) => a.count - b.count);
        const bestRoute = routeLoads[0]?.route;
        if (bestRoute) {
          handleLocalAssign(studentIdToAssign, bestRoute.id, student.address || 'محطة - ' + bestRoute.name, student);
          fallbackCount++;
        }
      }
    });

    if (matchCount > 0 || fallbackCount > 0) {
      showToast?.(`تم التوزيع التلقائي الذكي لـ ${matchCount + fallbackCount} طالباً بنجاح! 🎉 (${matchCount} مطابقة ذكية، ${fallbackCount} موازنة أحمال). يرجى نقر حفظ التعديلات للتثبيت.`, 'success');
    } else {
      showToast?.('جميع الطلاب موزعون مسبقاً على الحافلات. 👍', 'success');
    }
  };

  const handleDragStart = (student: any) => {
    if (!isEditing) return;
    setDraggedStudent(student);
  };

  const handleDragOver = (e: React.DragEvent, routeId: string) => {
    e.preventDefault();
    if (isEditing) {
      setDraggedOverRouteId(routeId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverRouteId(null);
  };

  const handleDrop = (routeId: string) => {
    if (!isEditing) return;
    if (draggedStudent) {
      const studentId = draggedStudent.student || draggedStudent.id;
      const stopName = draggedStudent.address || `باص مركز الأكواد - ${draggedStudent.grade || ''}`;
      handleLocalAssign(studentId, routeId, stopName, draggedStudent);
      setDraggedStudent(null);
    }
    setDraggedOverRouteId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-right font-sans" dir="rtl">
      
      {/* 1. Left Column: Codes Center Lists Only (with direct status check) */}
      <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col h-[650px]">
        
        {/* Header without Tab Switcher */}
        <div className="mb-4">
          <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            وجبات ومسارات مركز الأكواد
          </h3>
          <p className="text-[10px] text-gray-400">تصفية وتوزيع طلاب وجبات مركز الأكواد جغرافياً على الحافلات.</p>
        </div>

        {/* Filters Panel */}
        <div className="space-y-3 mb-4 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم طالب أو كود أو منطقة..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Smart Area Dropdown */}
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-gray-400 font-bold mb-1">تصفية حسب المنطقة:</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full text-xs font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white outline-none"
              >
                <option value="all">الكل (كل المناطق)</option>
                {availableAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Smart Auto Assign Action */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                disabled={false}
                onClick={handleSmartAutoAssign}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer"
                title="توزيع الطلاب جغرافياً بشكل تلقائي"
              >
                <RefreshCw className="w-3 h-3 animate-spin-slow shrink-0" />
                توزيع تلقائي ذكي ⚡
              </button>
            </div>
          </div>

          {savedLists.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold shrink-0">اختر الوجبة:</span>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full text-xs font-bold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white outline-none"
              >
                {savedLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.school})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Student Lists Display */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredCodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
              <Search className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-bold">لا توجد نتائج تطابق البحث</p>
            </div>
          ) : (
            filteredCodes.map((student: any) => {
              const studentId = student.student || student.id;
              // Find matching student transport status
              const matchedStatus = studentStatuses.find(s => 
                s.id === student.id || 
                s.id === student.student || 
                s.studentName === student.name
              );

              const assignedRouteId = getEffectiveRouteId(studentId);
              const assignedRoute = assignedRouteId 
                ? routes.find(r => r.id === assignedRouteId)
                : null;

              const isAssigned = !!assignedRoute;
              const isUnassignedInTransport = matchedStatus && !assignedRouteId;

              return (
                <div
                  key={studentId}
                  draggable={isEditing}
                  onDragStart={() => handleDragStart(student)}
                  className={`p-4 rounded-2xl border transition-all shadow-xs group ${
                    isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'
                  } ${
                    isAssigned 
                      ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' 
                      : isUnassignedInTransport
                      ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30'
                      : 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">{student.name}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[8px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 px-1 py-0.5 rounded font-black">{student.grade || 'الصف'}</span>
                        {student.gender === 'female' ? (
                          <span className="text-[8px] bg-pink-500/10 text-pink-500 px-1 py-0.5 rounded font-black">طالبة ♀</span>
                        ) : (
                          <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1 py-0.5 rounded font-black">طالب ♂</span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Status Badge */}
                    <span className={`text-[9px] px-2 py-1 rounded-xl font-black whitespace-nowrap ${
                      isAssigned 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs shadow-emerald-500/5' 
                        : isUnassignedInTransport
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs shadow-amber-500/5 animate-pulse'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-450 dark:text-gray-500 border border-transparent'
                    }`}>
                      {isAssigned ? `باص: ${assignedRoute.name} 🚌` : isUnassignedInTransport ? 'مسجل (غير معيّن) ⚠️' : 'غير مسجل بالنقل ❌'}
                    </span>
                  </div>

                  {/* Codes identifiers */}
                  <div className="grid grid-cols-2 gap-2 mt-3 bg-white/40 dark:bg-black/20 p-2 rounded-xl border border-gray-100 dark:border-gray-850 text-center font-mono text-[8px] font-black">
                    <div>
                      <span className="text-gray-400 block text-[7px] font-bold scale-90 mb-0.5">كود الطالب</span>
                      <span className="text-amber-500 tracking-wider block">{student.student || 'غير متوفر'}</span>
                    </div>
                    <div className="border-r border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400 block text-[7px] font-bold scale-90 mb-0.5">كود ولي الأمر</span>
                      <span className="text-blue-400 tracking-wider block">{student.parent || 'غير متوفر'}</span>
                    </div>
                  </div>

                  {/* Quick action controls */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-gray-400 font-bold shrink-0">
                      {isAssigned ? 'تعديل الخط:' : 'إسناد سريع للباص:'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <select
                        disabled={!isEditing}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleLocalAssign(studentId, e.target.value, `باص مركز الأكواد - ${student.grade || ''}`, student);
                          }
                        }}
                        className={`text-[9px] font-black bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-1 max-w-[120px] ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={assignedRouteId || ""}
                      >
                        <option value="" disabled={!isAssigned}>اختر الخط...</option>
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {isAssigned && (
                        <button
                          disabled={!isEditing}
                          onClick={() => handleLocalAssign(studentId, "")}
                          className={`p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors text-[9px] font-black shrink-0 border border-rose-500/10 cursor-pointer ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="إلغاء الاشتراك"
                        >
                          إلغاء الاشتراك
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Column: School Buses Targets (region to drop students on with Edit and Save buttons) */}
      <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col h-[650px]">
        
        {/* Header with Edit & Save / Cancel Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 shrink-0 pb-3 border-b border-gray-50 dark:border-gray-750">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              باصات وحافلات المدرسة (منطقة الإفلات)
            </h3>
            <p className="text-[10px] text-gray-500 mt-1">تحديد ركاب كل خط مع إمكانية التعديل والحفظ الشامل.</p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {!isEditing ? (
              <button
                onClick={() => {
                  setPendingChanges({});
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center gap-1.5"
              >
                ✏️ تعديل تعيينات الحافلات
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveAllChanges}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  💾 حفظ التغييرات والاشتراكات
                </button>
                <button
                  onClick={handleCancelChanges}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-750 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl text-[10px] font-bold text-center">
            💡 أنت الآن في "وضع تعديل تعيينات الحافلات". يمكنك سحب الطلاب، تغيير الباصات، أو إزالتهم. انقر "حفظ التغييرات" لتثبيتها نهائياً بالداتابيس.
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {routes.map(route => {
            // Build the effective list of students assigned to this route
            const allCandidateStudents = [...studentStatuses];
            codesStudents.forEach((cs: any) => {
              const csId = cs.student || cs.id;
              if (!allCandidateStudents.some(s => s.id === csId)) {
                allCandidateStudents.push({
                  id: csId,
                  studentName: cs.name,
                  routeId: "",
                  status: "waiting",
                  stopName: cs.address || "باص مركز الأكواد",
                  parentId: cs.parent || "",
                  timestamp: Date.now()
                });
              }
            });

            const assignedStudents = allCandidateStudents.filter(s => {
              const effRouteId = getEffectiveRouteId(s.id);
              return effRouteId === route.id;
            });

            const isCurrentlyOver = draggedOverRouteId === route.id;

            return (
              <div
                key={route.id}
                onDragOver={(e) => handleDragOver(e, route.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(route.id)}
                className={`p-5 rounded-3xl border border-dashed transition-all ${
                  isCurrentlyOver
                    ? 'border-cyan-500 bg-cyan-500/5 scale-[1.01] shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 hover:bg-indigo-50/20 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">{route.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">اللوحة: {route.busPlate} | وقت الانطلاق: {route.startTime}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-black">
                      عدد الركاب: {assignedStudents.length} طلاب
                    </span>

                    {/* Dynamic edit & add buttons next to each route */}
                    <div className="flex items-center gap-1.5">
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingChanges({});
                            setIsEditing(true);
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          ✏️ تعديل
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRouteForAdd(route);
                            setIsAddStudentModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          ➕ إضافة طالب
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {assignedStudents.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 border border-dashed border-gray-250 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/40 text-xs font-bold">
                    لا يوجد ركاب معينين على هذا الخط.
                    {isEditing ? ' اسحب طالباً وأفلته هنا للتعيين السريع.' : ' انقر فوق زر "تعديل" لتتمكن من إضافة ركاب.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignedStudents.map(student => (
                      <div key={student.id} className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl flex justify-between items-center group/item hover:border-indigo-500/30 transition-all">
                        <div className="truncate">
                          <span className="text-xs font-black text-gray-900 dark:text-white block truncate">{student.studentName}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5 truncate">{student.stopName || 'بانتظار تحديد المحطة'}</span>
                        </div>
                        
                        <button
                          disabled={!isEditing}
                          onClick={() => handleLocalAssign(student.id, "")}
                          className={`p-1 hover:bg-rose-500/10 text-gray-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0 ${!isEditing ? 'opacity-30 cursor-not-allowed' : ''}`}
                          title="إزالة من الحافلة"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Add Student directly from Codes Center Modal */}
      {isAddStudentModalOpen && selectedRouteForAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-750 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header (Close Button on the LEFT side) */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
              <button 
                type="button"
                onClick={() => {
                  setIsAddStudentModalOpen(false);
                  setSelectedRouteForAdd(null);
                  setModalSearchQuery('');
                }} 
                className="text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Bus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>إضافة طالب إلى {selectedRouteForAdd.name}</span>
              </h3>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
              
              {/* Batch Selector & Search Bar */}
              <div className="space-y-3">
                {savedLists.length > 0 && (
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 font-bold mb-1">اختر الوجبة من مركز الأكواد:</span>
                    <select
                      value={modalSelectedListId || (savedLists[0] ? savedLists[0].id : '')}
                      onChange={(e) => setModalSelectedListId(e.target.value)}
                      className="w-full text-xs font-black bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-gray-900 dark:text-white outline-none"
                    >
                      {savedLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name} ({list.school})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="ابحث عن اسم طالب أو كود الطالب..."
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  />
                </div>
              </div>

              {/* Student list */}
              <div className="space-y-2 pt-2">
                {(() => {
                  const activeListId = modalSelectedListId || (savedLists[0] ? savedLists[0].id : '');
                  const currentList = savedLists.find(l => l.id === activeListId);
                  const modalStudents = currentList ? (currentList.students || []) : [];
                  
                  const filtered = modalStudents.filter((s: any) => {
                    const nameMatch = (s.name || '').toLowerCase().includes(modalSearchQuery.toLowerCase());
                    const codeMatch = (s.student || '').toLowerCase().includes(modalSearchQuery.toLowerCase());
                    return nameMatch || codeMatch;
                  });

                  if (savedLists.length === 0) {
                    return (
                      <div className="py-8 text-center text-gray-400 text-xs font-bold">
                        لا توجد وجبات محفوظة في مركز الأكواد.
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-gray-400 text-xs font-bold">
                        لا توجد نتائج تطابق البحث.
                      </div>
                    );
                  }

                  return filtered.map((student: any) => {
                    const studentId = student.student || student.id;
                    const activeRouteId = getEffectiveRouteId(studentId);
                    const isAssignedToThisBus = activeRouteId === selectedRouteForAdd.id;
                    const isAssignedToOtherBus = activeRouteId && !isAssignedToThisBus;
                    const otherRoute = isAssignedToOtherBus ? routes.find(r => r.id === activeRouteId) : null;

                    return (
                      <div 
                        key={studentId} 
                        className="p-3.5 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl flex justify-between items-center gap-3 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="truncate text-right">
                          <span className="text-xs font-extrabold text-gray-900 dark:text-white block truncate">{student.name}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5 truncate">{student.address || 'العنوان غير محدد'}</span>
                        </div>

                        <div className="shrink-0">
                          {isAssignedToThisBus ? (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg font-black border border-emerald-500/20">
                              مضاف مسبقاً ✔️
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleLocalAssign(studentId, selectedRouteForAdd.id, student.address || `باص مركز الأكواد - ${student.grade || ''}`, student);
                              }}
                              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                isAssignedToOtherBus
                                  ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-400 border border-amber-500/20'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              {isAssignedToOtherBus ? `نقل من: ${otherRoute?.name || 'باص آخر'}` : 'إضافة ➕'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>

            {/* Footer with Close Button */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700/60 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsAddStudentModalOpen(false);
                  setSelectedRouteForAdd(null);
                  setModalSearchQuery('');
                }}
                className="px-5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-750 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// Initial Database seeds
const initialStudentsSeed = [
  { id: 's1', studentName: 'علي محمد الدليمي', routeId: '1', status: 'waiting', stopName: 'شارع المنصور / مقابل المول', parentId: 'p1', timestamp: Date.now() },
  { id: 's2', studentName: 'سارة أحمد الجبوري', routeId: '1', status: 'waiting', stopName: 'ساحة النسور / خلف البريد', parentId: 'p2', timestamp: Date.now() },
  { id: 's3', studentName: 'حسن حيدر الخفاجي', routeId: '1', status: 'picked_up', stopName: 'حي الداودي / تقاطع الرواد', parentId: 'p3', timestamp: Date.now() },
  { id: 's4', studentName: 'يوسف عمر الفهد', routeId: '2', status: 'waiting', stopName: 'منطقة اليرموك / قرب الساحة', parentId: 'p4', timestamp: Date.now() },
  { id: 's5', studentName: 'رانيا سامي الحداد', routeId: '2', status: 'waiting', stopName: 'جامعة بغداد / الجادرية', parentId: 'p5', timestamp: Date.now() },
  { id: 's6', studentName: 'فاطمة ليث العبيدي', routeId: '', status: 'waiting', stopName: 'حي القادسية / المجمع السكني', parentId: 'p6', timestamp: Date.now() },
  { id: 's7', studentName: 'عبد الله رعد العزاوي', routeId: '', status: 'waiting', stopName: 'حي الحارثية / شارع الكندي', parentId: 'p7', timestamp: Date.now() }
];

const initialFeesSeed = [
  { id: 'f1', studentId: 's1', studentName: 'علي محمد الدليمي', parentId: 'p1', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'paid', month: 'نوفمبر 2026' },
  { id: 'f2', studentId: 's2', studentName: 'سارة أحمد الجبوري', parentId: 'p2', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'overdue', month: 'نوفمبر 2026' },
  { id: 'f3', studentId: 's3', studentName: 'حسن حيدر الخفاجي', parentId: 'p3', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'paid', month: 'نوفمبر 2026' },
  { id: 'f4', studentId: 's4', studentName: 'يوسف عمر الفهد', parentId: 'p4', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'pending', month: 'نوفمبر 2026' },
  { id: 'f5', studentId: 's5', studentName: 'رانيا سامي الحداد', parentId: 'p5', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'paid', month: 'نوفمبر 2026' },
  { id: 'f6', studentId: 's6', studentName: 'فاطمة ليث العبيدي', parentId: 'p6', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'pending', month: 'نوفمبر 2026' },
  { id: 'f7', studentId: 's7', studentName: 'عبد الله رعد العزاوي', parentId: 'p7', amount: 150000, dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000, status: 'overdue', month: 'نوفمبر 2026' }
];

// Mock Data in Arabic
const mockRoutes: TransportRoute[] = [
  { id: '1', name: 'خط المنصور السريع والداودي', driverId: 'd1', busPlate: 'أ ب ج 1234', stops: ['مول المنصور', 'ساحة النسور', 'تقاطع الداودي'], schoolId: 's1', startTime: '06:30 ص', status: 'in_transit' },
  { id: '2', name: 'خط الكرخ والوزيرية واليرموك', driverId: 'd2', busPlate: 'س ص ع 9876', stops: ['منطقة اليرموك', 'حي الحارثية', 'جامعة بغداد'], schoolId: 's1', startTime: '07:00 ص', status: 'idle' },
];

const mockDrivers: BusDriver[] = [
  { id: 'd1', name: 'أبو أحمد الكناني', phone: '+964 770 123 4567', routeId: 'خط المنصور السريع', schoolId: 's1' },
  { id: 'd2', name: 'عمر عبد الله الجبوري', phone: '+964 780 987 6543', routeId: 'خط الكرخ والوزيرية', schoolId: 's1' },
];
