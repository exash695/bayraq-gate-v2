import { useState, useEffect } from 'react';
import { academicService, AcademicList, SchoolStudent } from '../services/academicService';
import { subscribeToPendingPayments, StudentPayment } from '../services/financeService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { subscribeMultiQuery } from '../utils/firestoreSubscriptions';

export const useAdminData = (selectedSchoolId: string | null, schoolName?: string) => {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [savedLists, setSavedLists] = useState<AcademicList[]>([]);
  const [pendingPayments, setPendingPayments] = useState<StudentPayment[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.currentUser || !selectedSchoolId) {
        setIsAdminVerified(false);
        setIsLoading(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
        if (adminDoc.exists()) {
          const data = adminDoc.data();
          if (data.schoolId === selectedSchoolId || data.role === 'super_admin') {
            setIsAdminVerified(true);
            return;
          }
        }

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const udata = userDoc.data();
          if (udata.isAdmin === true || ['admin', 'admin-boys', 'admin-girls'].includes(udata.role)) {
            setIsAdminVerified(true);
            return;
          }
        }
        
        setIsAdminVerified(false);
        setIsLoading(false);
      } catch (err: any) {
        if (err?.message?.includes('offline')) {
          try {
            const adminDocCache = await getDocFromCache(doc(db, 'admins', auth.currentUser.uid));
            if (adminDocCache.exists()) {
              const data = adminDocCache.data();
              if (data.schoolId === selectedSchoolId || data.role === 'super_admin') {
                setIsAdminVerified(true);
                return;
              }
            }

            const userDocCache = await getDocFromCache(doc(db, 'users', auth.currentUser.uid));
            if (userDocCache.exists()) {
              const udata = userDocCache.data();
              if (udata.isAdmin === true || ['admin', 'admin-boys', 'admin-girls'].includes(udata.role)) {
                setIsAdminVerified(true);
                return;
              }
            }
          } catch (cacheErr) {
            console.warn("Admin verification from cache also failed:", cacheErr);
          }
        } else {
          console.error("Admin verification failed:", err);
        }
        setIsAdminVerified(false);
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [selectedSchoolId, auth.currentUser]);

  useEffect(() => {
    if (!selectedSchoolId || !isAdminVerified || !auth.currentUser) {
      if (!selectedSchoolId) setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const safeSchoolId = selectedSchoolId;
    const cleanSchoolName = String(schoolName || "").trim();

    // 1. Sync Students (Robust Subscription)
    const unsubStudents = subscribeMultiQuery('school_students', safeSchoolId, cleanSchoolName, (data) => {
        setStudents(data);
    });

    // 2. Sync Teachers/Staff (Robust Subscription)
    const unsubTeachers = subscribeMultiQuery('teachers', safeSchoolId, cleanSchoolName, (data) => {
        setTeachers(data.filter((t: any) => t.role !== 'STAFF'));
        setStaff(data.filter((t: any) => t.role === 'STAFF'));
    });

    // 3. Sync Academic Lists
    const unsubLists = academicService.subscribeToLists(safeSchoolId, (data) => {
      setSavedLists(data);
    }, schoolName);

    // 4. Sync Pending Payments
    const unsubPayments = subscribeToPendingPayments((data) => {
      setPendingPayments(data);
    }, safeSchoolId);

    // 5. Sync School Settings
    const unsubSettings = academicService.subscribeToSchoolSettings(safeSchoolId, (data) => {
      setSchoolSettings(data);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubTeachers();
      unsubLists();
      unsubPayments();
      unsubSettings();
    };
  }, [selectedSchoolId, isAdminVerified, schoolName]);

  return {
    students,
    setStudents,
    teachers,
    staff,
    savedLists,
    setSavedLists,
    pendingPayments,
    setPendingPayments,
    schoolSettings,
    isLoading,
    isAdminVerified
  };
};
