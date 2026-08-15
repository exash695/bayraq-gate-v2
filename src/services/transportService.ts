import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TransportRoute, StudentTransportStatus, TransportFee, BusDriver } from '../types/transport';

const ROUTES_COL = 'transport_routes';
const DRIVERS_COL = 'transport_drivers';
const STUDENTS_STATUS_COL = 'transport_students_status';
const FEES_COL = 'transport_fees';

export const getRoutes = async (schoolId: string): Promise<TransportRoute[]> => {
  const q = query(collection(db, ROUTES_COL), where('schoolId', '==', schoolId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportRoute));
};

export const addRoute = async (route: Omit<TransportRoute, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, ROUTES_COL), route);
  return docRef.id;
};

export const updateRoute = async (routeId: string, routeData: Partial<TransportRoute>) => {
  await setDoc(doc(db, ROUTES_COL, routeId), routeData, { merge: true });
};

export const deleteRoute = async (routeId: string) => {
  await deleteDoc(doc(db, ROUTES_COL, routeId));
};

export const updateRouteStatus = async (
  routeId: string, 
  status: TransportRoute['status'], 
  location?: { lat: number, lng: number },
  trackingData?: any
) => {
  const updateData: any = { status };
  if (location) updateData.currentLocation = location;
  if (trackingData) {
    Object.assign(updateData, trackingData);
  }
  await setDoc(doc(db, ROUTES_COL, routeId), updateData, { merge: true });
};

export const getDrivers = async (schoolId: string): Promise<BusDriver[]> => {
  const q = query(collection(db, DRIVERS_COL), where('schoolId', '==', schoolId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BusDriver));
};

export const getDriverByAccessCode = async (accessCode: string): Promise<BusDriver | null> => {
  try {
    const q = query(collection(db, DRIVERS_COL), where('accessCode', '==', accessCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as BusDriver;
    }
  } catch (e) {
    console.error("Error fetching driver from Firestore:", e);
  }

  // Demo fallback for testing
  if (
    accessCode.startsWith('DRI-') || 
    accessCode.startsWith('DRV-') || 
    accessCode === '100200' || 
    accessCode === '112233'
  ) {
    return {
      id: 'demo-driver-1',
      name: 'الكابتن أبو فهد (سائق تجريبي)',
      phone: '07700000000',
      accessCode: accessCode,
      busNumber: 'حافلة رقم 12 (الفرسان)',
      routeId: 'route-demo-1',
      schoolId: 'school1',
      status: 'active'
    };
  }

  return null;
};

export const addDriver = async (driver: Omit<BusDriver, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, DRIVERS_COL), driver);
  return docRef.id;
};

export const updateDriver = async (driverId: string, driverData: Partial<BusDriver>) => {
  await setDoc(doc(db, DRIVERS_COL, driverId), driverData, { merge: true });
};

export const deleteDriver = async (driverId: string) => {
  await deleteDoc(doc(db, DRIVERS_COL, driverId));
};

export const getStudentTransportStatuses = async (routeId: string): Promise<StudentTransportStatus[]> => {
  const q = query(collection(db, STUDENTS_STATUS_COL), where('routeId', '==', routeId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentTransportStatus));
};

export const updateStudentTransportStatus = async (statusId: string, status: StudentTransportStatus['status']) => {
  await setDoc(doc(db, STUDENTS_STATUS_COL, statusId), { 
    status, 
    timestamp: Date.now() 
  }, { merge: true });
};

export const subscribeToParentTransport = (
  parentId: string, 
  callback: (statuses: StudentTransportStatus[]) => void,
  onError?: (error: any) => void
) => {
  const q = query(collection(db, STUDENTS_STATUS_COL), where('parentId', '==', parentId));
  return onSnapshot(q, 
    (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentTransportStatus)));
    },
    (err) => {
      console.warn("Firestore subscription error for parent transport:", err);
      if (onError) onError(err);
    }
  );
};

export const subscribeToRoutes = (
  schoolId: string,
  callback: (routes: TransportRoute[]) => void
) => {
  const q = query(collection(db, ROUTES_COL), where('schoolId', '==', schoolId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportRoute)));
  }, (err) => {
    console.warn("Firestore subscription error for routes:", err);
  });
};

export const subscribeToDrivers = (
  schoolId: string,
  callback: (drivers: BusDriver[]) => void
) => {
  const q = query(collection(db, DRIVERS_COL), where('schoolId', '==', schoolId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as BusDriver)));
  }, (err) => {
    console.warn("Firestore subscription error for drivers:", err);
  });
};

export const subscribeToStudentStatusesForRoute = (
  routeId: string,
  callback: (statuses: StudentTransportStatus[]) => void
) => {
  const q = query(collection(db, STUDENTS_STATUS_COL), where('routeId', '==', routeId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentTransportStatus)));
  }, (err) => {
    console.warn("Firestore subscription error for student statuses for route:", err);
  });
};

export const subscribeToAllStudentStatuses = (
  callback: (statuses: StudentTransportStatus[]) => void
) => {
  return onSnapshot(collection(db, STUDENTS_STATUS_COL), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentTransportStatus)));
  }, (err) => {
    console.warn("Firestore subscription error for all student statuses:", err);
  });
};

export const getAllStudentStatuses = async (): Promise<StudentTransportStatus[]> => {
  const snap = await getDocs(collection(db, STUDENTS_STATUS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudentTransportStatus));
};

export const assignStudentToRoute = async (studentId: string, routeId: string, stopName?: string, shift?: 'morning' | 'evening' | 'both') => {
  const updateData: any = { routeId };
  if (stopName !== undefined) {
    updateData.stopName = stopName;
  }
  if (shift !== undefined) {
    updateData.shift = shift;
  }
  await setDoc(doc(db, STUDENTS_STATUS_COL, studentId), updateData, { merge: true });
};

export const getParentTransportFees = async (parentId: string): Promise<TransportFee[]> => {
  const q = query(collection(db, FEES_COL), where('parentId', '==', parentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportFee));
};

export const subscribeToAllFees = (
  callback: (fees: TransportFee[]) => void
) => {
  return onSnapshot(collection(db, FEES_COL), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportFee)));
  }, (err) => {
    console.warn("Firestore subscription error for all fees:", err);
  });
};

export const getAllTransportFees = async (): Promise<TransportFee[]> => {
  const snap = await getDocs(collection(db, FEES_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as TransportFee));
};

export const updateTransportFeeStatus = async (feeId: string, status: TransportFee['status']) => {
  await setDoc(doc(db, FEES_COL, feeId), { status }, { merge: true });
};

export const payTransportFee = async (feeId: string) => {
  await setDoc(doc(db, FEES_COL, feeId), { status: 'paid' }, { merge: true });
};
