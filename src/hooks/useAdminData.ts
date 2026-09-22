import { useState, useEffect, useMemo } from 'react';
import { academicService, AcademicList, SchoolStudent } from '../services/academicService';
import { staffService } from '../services/staffService';
import { subscribeToPendingPayments, StudentPayment } from '../services/financeService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, getDocFromCache } from '@/src/lib/firebase';
import { safeStorage } from '../lib/storage';
import { realtimeManager } from '../lib/realtimeManager';

export const useAdminData = (selectedSchoolId: string | null, schoolName?: string) => {
  const safeSchoolId = selectedSchoolId || 'all';

  const [rawStudents, setRawStudents] = useState<SchoolStudent[]>(() => {
    try {
      const stored = safeStorage.getItem(`s6_cache_students_${safeSchoolId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [teachers, setTeachers] = useState<any[]>(() => {
    const cached = staffService.getCachedTeachers(safeSchoolId);
    return cached.filter((t: any) => t.role !== 'STAFF' && !t.isDeleted);
  });

  const [staff, setStaff] = useState<any[]>(() => {
    const cached = staffService.getCachedTeachers(safeSchoolId);
    return cached.filter((t: any) => t.role === 'STAFF' && !t.isDeleted);
  });

  const [savedLists, setSavedLists] = useState<AcademicList[]>(() => {
    try {
      const stored = safeStorage.getItem(`s6_cache_lists_${safeSchoolId}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      const map = new Map<string, AcademicList>();
      parsed.forEach((item: any) => {
        if (item?.id) map.set(item.id, item);
      });
      return Array.from(map.values());
    } catch {
      return [];
    }
  });

  const [pendingPayments, setPendingPayments] = useState<StudentPayment[]>([]);

  const [schoolSettings, setSchoolSettings] = useState<any>(() => {
    try {
      const stored = safeStorage.getItem(`s6_cache_settings_${safeSchoolId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we have cached data, don't show blocking loading state!
    try {
      const hasLists = Boolean(safeStorage.getItem(`s6_cache_lists_${safeSchoolId}`));
      const hasStudents = Boolean(safeStorage.getItem(`s6_cache_students_${safeSchoolId}`));
      return !(hasLists || hasStudents);
    } catch {
      return true;
    }
  });

  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => {
    const role = safeStorage.getItem('bayraq_user_role');
    return Boolean(role && (role.includes('admin') || role === 'dev' || role === 'super_admin'));
  });

  useEffect(() => {
    const checkAdmin = async () => {
      // 1. Check local session / storage first for instant verification
      const localRole = safeStorage.getItem('bayraq_user_role');
      if (localRole && (localRole.includes('admin') || localRole === 'dev' || localRole === 'super_admin')) {
        setIsAdminVerified(true);
      }

      if (!selectedSchoolId) {
        setIsLoading(false);
        return;
      }

      if (!auth.currentUser) {
        // If not authenticated to Firebase Auth yet, rely on session admin verification
        if (localRole && localRole.includes('admin')) {
          setIsAdminVerified(true);
        }
        setIsLoading(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
        if (adminDoc.exists()) {
          setIsAdminVerified(true);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const udata = userDoc.data();
          if (udata.isAdmin === true || ['admin', 'admin-boys', 'admin-girls', 'dev'].includes(udata.role)) {
            setIsAdminVerified(true);
            return;
          }
        }

        // If local storage has admin role, maintain verification
        if (localRole && localRole.includes('admin')) {
          setIsAdminVerified(true);
          return;
        }
        
        setIsAdminVerified(false);
        setIsLoading(false);
      } catch (err: any) {
        if (err?.message?.includes('offline')) {
          try {
            const adminDocCache = await getDocFromCache(doc(db, 'admins', auth.currentUser.uid));
            if (adminDocCache.exists()) {
              setIsAdminVerified(true);
              return;
            }

            const userDocCache = await getDocFromCache(doc(db, 'users', auth.currentUser.uid));
            if (userDocCache.exists()) {
              const udata = userDocCache.data();
              if (udata.isAdmin === true || ['admin', 'admin-boys', 'admin-girls', 'dev'].includes(udata.role)) {
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
        // Fallback to local role
        if (localRole && localRole.includes('admin')) {
          setIsAdminVerified(true);
        } else {
          setIsAdminVerified(false);
        }
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [selectedSchoolId, auth.currentUser]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setIsLoading(false);
      return;
    }

    const currentSchoolId = selectedSchoolId;
    const cleanSchoolName = String(schoolName || "").trim();

    // 1. Sync Students (Robust Subscription via PostgreSQL API)
    const unsubStudents = academicService.subscribeToStudents(currentSchoolId, (data) => {
        setRawStudents(data);
        setIsLoading(false);
    });

    // 2. Sync Teachers/Staff from staffService API (Postgres source of truth)
    const loadTeachers = async () => {
      try {
        const allTeachers = await staffService.getTeachers(currentSchoolId);
        if (Array.isArray(allTeachers)) {
          setTeachers(allTeachers.filter((t: any) => t.role !== 'STAFF' && !t.isDeleted));
          setStaff(allTeachers.filter((t: any) => t.role === 'STAFF' && !t.isDeleted));
        }
      } catch (err) {
        console.warn("Failed to load teachers in useAdminData:", err);
      }
    };
    loadTeachers();

    const unsubRealtimeTeachers = realtimeManager.on('teachers_updated', loadTeachers);
    const unsubRealtimeStaff = realtimeManager.on('staff_updated', loadTeachers);

    // 3. Sync Academic Lists
    const unsubLists = academicService.subscribeToLists(currentSchoolId, (data) => {
      const map = new Map<string, AcademicList>();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item?.id) map.set(item.id, item);
        });
      }
      setSavedLists(Array.from(map.values()));
      setIsLoading(false);
    }, schoolName);

    // 4. Sync Pending Payments
    const unsubPayments = subscribeToPendingPayments((data) => {
      setPendingPayments(data);
    }, currentSchoolId);

    // 5. Sync School Settings
    const unsubSettings = academicService.subscribeToSchoolSettings(currentSchoolId, (data) => {
      setSchoolSettings(data);
      setIsLoading(false);
    });

    // Fallback: Ensure loading stops quickly
    const loadingTimeout = setTimeout(() => setIsLoading(false), 800);

    return () => {
      unsubStudents();
      unsubRealtimeTeachers();
      unsubRealtimeStaff();
      unsubLists();
      unsubPayments();
      unsubSettings();
      clearTimeout(loadingTimeout);
    };
  }, [selectedSchoolId, schoolName]);

  // SOURCE OF TRUTH: If savedLists exist, strictly return active students from savedLists.
  // This automatically cleans up any deleted batches or orphaned documents from deleted lists.
  const students = useMemo(() => {
    const studentMap = new Map<string, any>();
    const metaLookup = new Map<string, any>();
    rawStudents.forEach((s: any) => {
      const key = s.code || s.student || s.id;
      if (key) metaLookup.set(key, s);
    });

    if (savedLists && savedLists.length > 0) {
      savedLists.forEach(list => {
        (list.students || []).forEach((s: any) => {
          const key = s.code || s.student || s.id || `${s.name}_${s.grade}`;
          if (key && !studentMap.has(key)) {
            const extraMeta = metaLookup.get(s.code || s.student || s.id) || {};
            studentMap.set(key, {
              ...s,
              ...extraMeta,
              listId: list.id,
              listName: list.name,
              grade: s.grade || (list as any).grade || list.name,
              schoolId: list.schoolId || selectedSchoolId,
              schoolName: list.school || schoolName,
              parentCode: s.parentCode || extraMeta.parentCode || (s.code ? `P-${s.code}` : (s.student ? `P-${s.student}` : ''))
            });
          }
        });
      });
      return Array.from(studentMap.values());
    }
    
    // Explicitly return an empty list if no active lists exist in the Code Center.
    // This prevents showing stale/orphaned students from the database when lists are empty.
    return [];
  }, [savedLists, rawStudents, selectedSchoolId, schoolName]);

  return {
    students,
    setStudents: setRawStudents,
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
