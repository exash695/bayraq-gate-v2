import { SCHOOLS_DATA, SchoolItem, getSchoolBairaqImageUrl, getOfficialSchoolLogoUrl } from '../lib/constants';
import { db, collection, getDocs, doc, setDoc } from '../lib/firebase';
import { getApiBaseUrl } from '../lib/serverConfig';

function resolveApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export interface SchoolRecord {
  id: string;
  name: string;
  type?: string;
  governorate?: string;
  city?: string;
  location?: string;
  status?: string;
  activationCode?: string;
  students?: number;
  studentsCount?: number;
  schoolBairaqImageUrl?: string;
  schoolLogoUrl?: string;
  logoUrl?: string;
  coverUrl?: string;
  plan?: string;
  expiryDate?: string;
  subscriptionStart?: string;
  receiptNumber?: string;
  licenseNumber?: string;
  subscriptionFee?: number;
  paymentStatus?: string;
  adminName?: string;
  adminPhone?: string;
  licenseNotes?: string;
  maxStudents?: number;
  createdAt?: string;
  disabledModules?: string[];
  [key: string]: any;
}

export const schoolService = {
  /**
   * جلب جميع المدارس والميادين من قاعدة بيانات PostgreSQL والفايرستور لضمان ظهور كافة الميادين
   */
  fetchSchools: async (): Promise<SchoolRecord[]> => {
    try {
      let rawSchools: any[] = [];
      try {
        const response = await fetch(resolveApiUrl('/api/schools'), {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (response.ok) {
          const data = await response.json();
          rawSchools = data.schools || data.data || [];
        }
      } catch (apiErr) {
        console.warn('[SchoolService] API fetch failed, falling back to database/cache:', apiErr);
      }

      // Also get any schools saved in Firestore
      const firestoreMap: Record<string, any> = {};
      try {
        const snap = await getDocs(collection(db, 'schools'));
        snap.forEach(docSnap => {
          firestoreMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
      } catch (fsErr) {
        console.warn('[SchoolService] Firestore read notice:', fsErr);
      }

      // Combine PG schools, Firestore schools, and defaults
      const mergedMap: Record<string, any> = {};

      let deletedSchoolIds: string[] = [];
      try {
        if (typeof localStorage !== 'undefined') {
          const savedDeleted = localStorage.getItem("s6_deleted_system_schools");
          if (savedDeleted) {
            deletedSchoolIds = JSON.parse(savedDeleted);
          }
        }
      } catch (e) {}

      rawSchools.forEach(s => {
        if (!deletedSchoolIds.includes(s.id)) {
          mergedMap[s.id] = { ...s };
        }
      });

      Object.keys(firestoreMap).forEach(id => {
        if (deletedSchoolIds.includes(id)) return;
        if (!mergedMap[id]) {
          mergedMap[id] = firestoreMap[id];
        } else {
          mergedMap[id] = { ...mergedMap[id], ...firestoreMap[id] };
        }
      });

      // Ensure both school8 (معهد ابداعنا) and general (أكاديمية بيرق الرقمية) coexist independently
      if (!mergedMap['school8']) {
        const sys8 = SCHOOLS_DATA.find(s => s.id === 'school8');
        if (sys8) {
          mergedMap['school8'] = {
            id: 'school8',
            name: sys8.name,
            type: sys8.type,
            governorate: 'الديوانية - غماس',
            status: 'active',
            schoolBairaqImageUrl: sys8.schoolBairaqImageUrl,
            schoolLogoUrl: sys8.schoolLogoUrl
          };
        }
      }
      if (!mergedMap['general']) {
        const sysGen = SCHOOLS_DATA.find(s => s.id === 'general');
        if (sysGen) {
          mergedMap['general'] = {
            id: 'general',
            name: sysGen.name,
            type: sysGen.type,
            governorate: 'العراق - دورات نخبة الأساتذة',
            status: 'active',
            schoolBairaqImageUrl: sysGen.schoolBairaqImageUrl,
            schoolLogoUrl: sysGen.schoolLogoUrl
          };
        }
      }

      // Ensure all standard system schools exist in the list unless explicitly deleted
      SCHOOLS_DATA.forEach(sys => {
        if (deletedSchoolIds.includes(sys.id)) return;
        if (!mergedMap[sys.id]) {
          mergedMap[sys.id] = {
            id: sys.id,
            name: sys.name,
            type: sys.type,
            governorate: 'الديوانية - غماس',
            status: 'active',
            schoolBairaqImageUrl: sys.schoolBairaqImageUrl,
            schoolLogoUrl: sys.schoolLogoUrl
          };
        }
      });

      // Exclude phantom alias if present
      delete mergedMap['school_awail_ghamas'];

      const allMerged = Object.values(mergedMap).filter((item: any) => 
        !deletedSchoolIds.includes(item.id) &&
        item.id !== 'school_awail_ghamas' &&
        item.name !== 'مدرسة جديدة'
      );

      return allMerged.map((item: any) => {
        const loc = item.governorate || item.city || item.location || 'الديوانية - غماس';
        const savedLocalLogo = typeof localStorage !== 'undefined' ? localStorage.getItem(`school_logo_${item.id}`) : null;
        const savedLocalCover = typeof localStorage !== 'undefined' ? localStorage.getItem(`school_cover_${item.id}`) : null;

        const resolvedLogo = item.logoUrl || item.schoolLogoUrl || item.schoolLogo || savedLocalLogo || getOfficialSchoolLogoUrl(item.id, item.name);
        const resolvedCover = item.coverUrl || item.schoolBairaqImageUrl || savedLocalCover || getSchoolBairaqImageUrl(item.id, item.name);

        return {
          id: item.id,
          name: item.name || 'مدرسة غير مسمّاة',
          governorate: loc,
          city: loc,
          location: loc,
          status: item.status || 'active',
          activationCode: item.activationCode || '',
          type: item.type || (item.status === 'premium' ? 'ميدان متميز' : 'ميدان تعليمي'),
          students: Number(item.students || item.studentsCount || 350),
          studentsCount: Number(item.studentsCount || item.students || 350),
          schoolBairaqImageUrl: resolvedCover,
          schoolLogoUrl: resolvedLogo,
          logoUrl: resolvedLogo,
          coverUrl: resolvedCover,
          plan: item.plan || 'standard',
          expiryDate: item.expiryDate || item.subscriptionEnd,
          subscriptionStart: item.subscriptionStart,
          receiptNumber: item.receiptNumber,
          licenseNumber: item.licenseNumber,
          subscriptionFee: item.subscriptionFee,
          paymentStatus: item.paymentStatus,
          adminName: item.adminName,
          adminPhone: item.adminPhone,
          licenseNotes: item.licenseNotes,
          maxStudents: item.maxStudents,
          createdAt: item.createdAt,
          disabledModules: Array.isArray(item.disabledModules)
            ? item.disabledModules
            : (Array.isArray(item.disabled_modules) ? item.disabled_modules : []),
        };
      });
    } catch (error) {
      console.warn('[SchoolService] Falling back to default institutions:', error);
      return SCHOOLS_DATA.map((sys) => ({
        id: sys.id,
        name: sys.name,
        type: sys.type,
        governorate: 'الديوانية - غماس',
        city: 'الديوانية - غماس',
        location: 'الديوانية - غماس',
        status: 'active',
        students: 350,
        studentsCount: 350,
        schoolBairaqImageUrl: sys.schoolBairaqImageUrl,
        schoolLogoUrl: sys.schoolLogoUrl,
        logoUrl: sys.schoolLogoUrl,
        coverUrl: sys.schoolBairaqImageUrl,
        plan: 'standard',
      }));
    }
  },

  /**
   * جلب مدرسة محددة بالمعرف
   */
  getSchoolById: async (id: string): Promise<SchoolRecord | null> => {
    try {
      const response = await fetch(`/api/schools/${id}`);
      if (!response.ok) return null;
      const data = await response.json();
      const item = data.school || data.data;
      if (!item) return null;
      const loc = item.governorate || item.city || 'الديوانية - غماس';
      return {
        id: item.id,
        name: item.name,
        governorate: loc,
        city: loc,
        location: loc,
        status: item.status || 'active',
        activationCode: item.activationCode || '',
        type: item.type || 'ميدان تعليمي',
        students: item.students || 350,
        schoolBairaqImageUrl: item.schoolBairaqImageUrl || item.coverUrl || getSchoolBairaqImageUrl(item.id, item.name),
        schoolLogoUrl: item.schoolLogoUrl || item.logoUrl || getOfficialSchoolLogoUrl(item.id, item.name),
        disabledModules: Array.isArray(item.disabledModules)
          ? item.disabledModules
          : (Array.isArray(item.disabled_modules) ? item.disabled_modules : []),
      };
    } catch (err) {
      console.warn(`[SchoolService] Failed to get school ${id}:`, err);
      return null;
    }
  },

  /**
   * إضافة مدرسة جديدة
   */
  createSchool: async (schoolData: Partial<SchoolRecord>): Promise<boolean> => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bairaq_jwt_token') : null;
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'developer',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(schoolData),
      });
      return response.ok;
    } catch (err) {
      console.error('[SchoolService] Failed to create school:', err);
      return false;
    }
  },

  /**
   * تحديث بيانات مدرسة (وتزامنها عبر قاعدة البيانات والفايرستور)
   */
  updateSchool: async (id: string, updates: Partial<SchoolRecord>): Promise<boolean> => {
    let success = false;
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bairaq_jwt_token') : null;
      const response = await fetch(resolveApiUrl(`/api/schools/${id}`), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'developer',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        success = true;
      }
    } catch (err) {
      console.warn(`[SchoolService] API update for school ${id} warning:`, err);
    }

    // Always sync with Firestore document
    try {
      await setDoc(doc(db, "schools", id), {
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      success = true;
    } catch (fsErr) {
      console.warn(`[SchoolService] Firestore sync for school ${id}:`, fsErr);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('school_updated', { detail: { id, updates } }));
    }

    return success;
  },

  /**
   * حذف مدرسة
   */
  deleteSchool: async (id: string): Promise<boolean> => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('bairaq_jwt_token') : null;
      const response = await fetch(`/api/schools/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'developer',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      return response.ok;
    } catch (err) {
      console.error(`[SchoolService] Failed to delete school ${id}:`, err);
      return false;
    }
  }
};
