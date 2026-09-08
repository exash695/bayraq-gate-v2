import { safeStorage } from '../lib/storage';
import { realtimeManager } from '../lib/realtimeManager';

const staffCache = new Map<string, { data: any[]; raw: string }>();

export const staffService = {
  // Teachers & Staff
  subscribeToTeachers: (schoolId: string | undefined, callback: (teachers: any[]) => void): (() => void) => {
    const key = schoolId || 'all';
    // 1. Immediately call with cache if available
    const cached = staffService.getCachedTeachers(schoolId);
    if (cached && cached.length > 0) {
      callback(cached);
    }
    // 2. Fetch in background
    staffService.getTeachers(schoolId).then((fresh) => {
      callback(fresh);
    });
    // 3. Listen to realtime updates
    const unsub = realtimeManager.on('teachers_updated', async () => {
      const updated = await staffService.getTeachers(schoolId);
      callback(updated);
    });
    return unsub;
  },

  getTeachers: async (schoolId?: string) => {
    const key = schoolId || 'all';

    // Instant Synchronous Cache Check
    if (!staffCache.has(key)) {
      try {
        const stored = safeStorage.getItem(`s6_cache_teachers_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          staffCache.set(key, { data: parsed, raw: stored });
        }
      } catch {}
    }

    try {
      const response = await fetch(`/api/teachers?schoolId=${schoolId || 'all'}`);
      if (!response.ok) {
        return staffCache.get(key)?.data || [];
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.teachers)) {
        const rawStr = JSON.stringify(data.teachers);
        staffCache.set(key, { data: data.teachers, raw: rawStr });
        safeStorage.setItem(`s6_cache_teachers_${key}`, rawStr);
        return data.teachers;
      }
    } catch (e) {
      console.warn('Error fetching teachers, using cached fallback:', e);
    }
    return staffCache.get(key)?.data || [];
  },

  getCachedTeachers: (schoolId?: string): any[] => {
    const key = schoolId || 'all';
    if (staffCache.has(key)) {
      return staffCache.get(key)!.data;
    }
    try {
      const stored = safeStorage.getItem(`s6_cache_teachers_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        staffCache.set(key, { data: parsed, raw: stored });
        return parsed;
      }
    } catch {}
    return [];
  },

  addTeacher: async (teacherData: any) => {
    const response = await fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    });
    if (!response.ok) throw new Error('Failed to add teacher');
    return await response.json();
  },

  updateTeacher: async (id: string, updateData: any) => {
    const response = await fetch(`/api/teachers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update teacher');
    return await response.json();
  },

  deleteTeacher: async (id: string) => {
    const response = await fetch(`/api/teachers/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete teacher');
    return await response.json();
  },

  // Schedules
  getSchedules: async (schoolId?: string) => {
    const response = await fetch(`/api/schedules?schoolId=${schoolId || 'all'}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.success ? data.schedules : [];
  },

  addSchedule: async (scheduleData: any) => {
    const response = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    if (!response.ok) throw new Error('Failed to add schedule');
    return await response.json();
  },

  deleteSchedule: async (id: string) => {
    const response = await fetch(`/api/schedules/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete schedule');
    return await response.json();
  },

  // School Settings (Times)
  getSchoolTimes: async (schoolId: string) => {
    const response = await fetch(`/api/school-settings/${schoolId}/times`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.success ? data.times : [];
  },

  updateSchoolTimes: async (schoolId: string, times: string[]) => {
    const response = await fetch(`/api/school-settings/${schoolId}/times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ times })
    });
    if (!response.ok) throw new Error('Failed to update school times');
    return await response.json();
  },

  // ربط كود شعبة إضافية بحساب المعلم
  linkTeacherCode: async (teacherId: string, code: string) => {
    const response = await fetch(`/api/teachers/${teacherId}/link-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'فشل ربط كود الشعبة');
    }
    return await response.json();
  }
};
