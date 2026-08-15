
import { useState, useEffect } from 'react';
import { subscribeMultiQuery } from '../utils/firestoreSubscriptions';
// Wait, I can't export setters easily like this.
// I'll make this hook return the data itself.

export const usePortalData = (isAdmin: boolean | null, selectedSchoolId: string | null, schoolName: string) => {
  const [sourceCodes, setSourceCodes] = useState<any[]>([]);
  const [sData, setSData] = useState<any[]>([]);
  const [uData, setUData] = useState<any[]>([]);
  const [tData, setTData] = useState<any[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [codesVersion, setCodesVersion] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    console.log(`[usePortalData] Initializing with schoolId: ${selectedSchoolId}, schoolName: ${schoolName}`);

    let unsubTeachers = () => {};
    let unsubUsers = () => {};
    let unsubCodes = () => {};
    let unsubStudents = () => {};

    const safeSchoolId = selectedSchoolId || 'unassigned';
    const cleanSchoolName = String(schoolName || "").trim();

    unsubTeachers = subscribeMultiQuery('teachers', safeSchoolId, cleanSchoolName, setTData, () => setDataVersion(v => v + 1));
    unsubUsers = subscribeMultiQuery('users', safeSchoolId, cleanSchoolName, setUData, () => setDataVersion(v => v + 1));
    unsubStudents = subscribeMultiQuery('school_students', safeSchoolId, cleanSchoolName, setSData, () => setDataVersion(v => v + 1));
    unsubCodes = subscribeMultiQuery('activation_codes', safeSchoolId, cleanSchoolName, setSourceCodes, () => {
      setDataVersion(v => v + 1);
      setCodesVersion(v => v + 1);
    }, false); 

    return () => {
      unsubTeachers();
      unsubUsers();
      unsubCodes();
      unsubStudents();
    };
  }, [isAdmin, selectedSchoolId, schoolName]);

  return { sourceCodes, sData, uData, tData, dataVersion, codesVersion };
};
