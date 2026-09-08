
import { useState, useEffect, useRef, useCallback } from 'react';
import { subscribeMultiQuery, getCachedSubscriptionData } from '../utils/firestoreSubscriptions';
import { academicService } from '../services/academicService';
import { staffService } from '../services/staffService';
import { realtimeManager } from '../lib/realtimeManager';

export const usePortalData = (isAdmin: boolean | null, selectedSchoolId: string | null, schoolName: string) => {
  const safeSchoolId = selectedSchoolId || 'unassigned';

  const [sourceCodes, setSourceCodes] = useState<any[]>(() => 
    getCachedSubscriptionData('activation_codes', safeSchoolId)
  );
  const [sData, setSData] = useState<any[]>(() => 
    getCachedSubscriptionData('school_students', safeSchoolId)
  );
  const [uData, setUData] = useState<any[]>(() => 
    getCachedSubscriptionData('users', safeSchoolId)
  );
  const [tData, setTData] = useState<any[]>(() => 
    staffService.getCachedTeachers(safeSchoolId).filter((t: any) => !t.isDeleted)
  );
  const [aData, setAData] = useState<any[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [codesVersion, setCodesVersion] = useState(0);

  const bumpTimerRef = useRef<any>(null);
  const bumpDataVersion = useCallback(() => {
    if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
    bumpTimerRef.current = setTimeout(() => {
      setDataVersion(v => v + 1);
    }, 50);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const currentSchoolId = selectedSchoolId || 'unassigned';
    const cleanSchoolName = String(schoolName || "").trim();

    // 1. Fetch academic lists directly from PostgreSQL API (Source of Truth for students & parents)
    const unsubAcademic = academicService.subscribeToLists(currentSchoolId, (data) => {
      setAData(data || []);
      bumpDataVersion();
    }, schoolName);

    // 2. Fetch teachers & staff directly from PostgreSQL API (Source of Truth for cadre)
    const loadTeachers = async () => {
      try {
        const teachers = await staffService.getTeachers(currentSchoolId);
        if (Array.isArray(teachers)) {
          const activeTeachers = teachers.filter((t: any) => !t.isDeleted);
          setTData(activeTeachers);
          bumpDataVersion();
        }
      } catch (err) {
        console.warn("Failed to load teachers in usePortalData:", err);
      }
    };
    loadTeachers();

    const unsubRealtimeTeachers = realtimeManager.on('teachers', loadTeachers);
    const unsubRealtimeStaff = realtimeManager.on('staff', loadTeachers);
    const unsubRealtimeAcademic = realtimeManager.on('academic_lists', () => {
      academicService.subscribeToLists(currentSchoolId, (data) => {
        setAData(data || []);
        bumpDataVersion();
      }, schoolName);
    });

    // 3. Online presence and users via Realtime / Firestore subscriptions
    const unsubUsers = subscribeMultiQuery('users', currentSchoolId, cleanSchoolName, setUData, bumpDataVersion);
    const unsubStudents = subscribeMultiQuery('school_students', currentSchoolId, cleanSchoolName, setSData, bumpDataVersion);
    const unsubCodes = subscribeMultiQuery('activation_codes', currentSchoolId, cleanSchoolName, setSourceCodes, () => {
      bumpDataVersion();
      setCodesVersion(v => v + 1);
    }, false); 

    return () => {
      if (bumpTimerRef.current) clearTimeout(bumpTimerRef.current);
      unsubAcademic();
      unsubRealtimeTeachers();
      unsubRealtimeStaff();
      unsubRealtimeAcademic();
      unsubUsers();
      unsubCodes();
      unsubStudents();
    };
  }, [isAdmin, selectedSchoolId, schoolName, bumpDataVersion]);

  return { sourceCodes, sData, uData, tData, aData, dataVersion, codesVersion };
};

