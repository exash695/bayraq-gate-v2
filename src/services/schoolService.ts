import { SCHOOLS_DATA, SchoolItem, getSchoolBairaqImageUrl, getOfficialSchoolLogoUrl } from '../lib/constants';

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
  createdAt?: string;
  [key: string]: any;
}

export const schoolService = {
  /**
   * جلب جميع المدارس والميادين من قاعدة بيانات PostgreSQL الداخلية
   */
  fetchSchools: async (): Promise<SchoolRecord[]> => {
    try {
      const response = await fetch('/api/schools', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch schools: ${response.statusText}`);
      }
      const data = await response.json();
      const rawSchools: any[] = data.schools || data.data || [];
      
      // Map and format raw postgres records
      return rawSchools.map((item) => {
        const loc = item.governorate || item.city || item.location || 'الديوانية - غماس';
        return {
          id: item.id,
          name: item.name,
          governorate: loc,
          city: loc,
          location: loc,
          status: item.status || 'active',
          activationCode: item.activationCode || '',
          type: item.type || (item.status === 'premium' ? 'ميدان متميز' : 'ميدان تعليمي'),
          students: item.students || item.studentsCount || 350,
          studentsCount: item.studentsCount || item.students || 350,
          schoolBairaqImageUrl: item.schoolBairaqImageUrl || item.coverUrl || getSchoolBairaqImageUrl(item.id, item.name),
          schoolLogoUrl: item.schoolLogoUrl || item.logoUrl || getOfficialSchoolLogoUrl(item.id, item.name),
          createdAt: item.createdAt,
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
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });
      return response.ok;
    } catch (err) {
      console.error('[SchoolService] Failed to create school:', err);
      return false;
    }
  },

  /**
   * تحديث بيانات مدرسة
   */
  updateSchool: async (id: string, updates: Partial<SchoolRecord>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.ok;
    } catch (err) {
      console.error(`[SchoolService] Failed to update school ${id}:`, err);
      return false;
    }
  },

  /**
   * حذف مدرسة
   */
  deleteSchool: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.error(`[SchoolService] Failed to delete school ${id}:`, err);
      return false;
    }
  }
};
