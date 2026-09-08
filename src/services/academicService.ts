import { collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  getDoc,
  addDoc, 
  deleteDoc,
  Timestamp,
  getDocs,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  increment,
  setDoc,
  runTransaction } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { logActivity } from '../utils/auditLogger';
import { normalizeFuzzyArabic } from '../utils/firestoreSubscriptions';
import { activationCodesService } from './activationCodesService';
import { realtimeManager } from '../lib/realtimeManager';

import { safeStorage } from '../lib/storage';

export interface AcademicList {
  id: string;
  name: string;
  school: string;
  schoolId: string;
  date: string;
  students: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolStudent {
  id: string;
  name: string;
  grade: string;
  schoolId: string;
  code: string;
  parentCode: string;
  status: string;
  paidAmount: number;
  totalAmount: number;
  behavior?: {
    score: number;
    logs: any[];
  };
}

// In-memory Fast Access Cache
const academicCache = {
  lists: new Map<string, { data: AcademicList[]; raw: string }>(),
  students: new Map<string, { data: SchoolStudent[]; raw: string }>(),
  settings: new Map<string, { data: any; raw: string }>(),
};

export const academicService = {
  // --- Academic Lists ---
  subscribeToLists: (schoolId: string, callback: (lists: AcademicList[]) => void, schoolName?: string) => {
    const key = schoolId || 'all';
    
    // 1. Instant Synchronous Cache Emission
    let cachedEntry = academicCache.lists.get(key);
    if (!cachedEntry) {
      try {
        const stored = safeStorage.getItem(`s6_cache_lists_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedEntry = { data: parsed, raw: stored };
          academicCache.lists.set(key, cachedEntry);
        }
      } catch {}
    }
    if (cachedEntry && Array.isArray(cachedEntry.data)) {
      callback(cachedEntry.data);
    }

    const fetchLists = async () => {
      try {
        const response = await fetch(`/api/academic-lists/${schoolId}`);
        if (!response.ok) {
          const text = await response.text();
          if (text.includes('Rate exceeded')) {
            console.warn('Rate limit exceeded for academic lists');
            return;
          }
          throw new Error(`Server returned ${response.status}: ${text.slice(0, 100)}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
           console.error('[AcademicService] Expected JSON but got', contentType);
           return;
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.academicLists)) {
          const rawStr = JSON.stringify(data.academicLists);
          const currentEntry = academicCache.lists.get(key);
          if (!currentEntry || currentEntry.raw !== rawStr) {
            academicCache.lists.set(key, { data: data.academicLists, raw: rawStr });
            safeStorage.setItem(`s6_cache_lists_${key}`, rawStr);
            callback(data.academicLists);
          }
        }
      } catch (error) {
        if(error instanceof Error && error.message.includes('Failed to fetch')) { console.warn('Network issue fetching academic lists, will retry'); } else { console.warn('Error fetching academic lists from API:', error); }
      }
    };

    fetchLists();
    const unsub = realtimeManager.subscribe('academic_lists', () => {
      fetchLists();
    });
    return () => unsub();
  },

  saveList: async (schoolId: string, listData: any) => {
    if (!listData) return;
    
    const fullListData = {
      ...listData,
      schoolId,
      updatedAt: new Date().toISOString()
    };

    // 1. Optimistic Cache & LocalStorage update so UI reflects immediately
    const key = schoolId || 'all';
    const currentEntry = academicCache.lists.get(key);
    const existingLists = currentEntry?.data ? [...currentEntry.data] : [];
    const idx = existingLists.findIndex(l => l.id === fullListData.id);
    if (idx >= 0) {
      existingLists[idx] = fullListData;
    } else {
      existingLists.unshift(fullListData);
    }
    const rawStr = JSON.stringify(existingLists);
    academicCache.lists.set(key, { data: existingLists, raw: rawStr });
    safeStorage.setItem(`s6_cache_lists_${key}`, rawStr);

    // Dispatch realtime event locally for instant UI response
    realtimeManager.trigger('academic_lists', { action: 'INSERT', id: fullListData.id, data: fullListData });

    // 2. Save to PostgreSQL via API
    const response = await fetch('/api/academic-lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullListData)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to save list (${response.status}): ${text.slice(0, 100)}`);
    }

    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to save list to SQL');

    // 3. Batch Sync Students to PostgreSQL (runs efficiently in background)
    if (listData.students && Array.isArray(listData.students)) {
      const studentsToSync = listData.students.map((student: any) => ({
        id: `${schoolId}_${student.student || student.code}`.replace(/\s+/g, '_'),
        schoolId,
        name: student.name,
        grade: student.grade,
        code: student.student || student.code,
        parentCode: student.parent || student.parentCode,
        status: student.status || 'نشط',
        paidAmount: student.paidAmount || 0,
        totalAmount: student.totalAmount || 0,
        discountType: student.discountType || null,
        discountRate: student.discountRate || 0,
        finance: student.finance || { installments: [], transactions: [] },
        isTopStudent: student.isTopStudent || false,
        topStudentPeriod: student.topStudentPeriod || null,
        lastSyncedPeriod: listData.lastSyncedPeriod || null,
        grades: student.grades || {}
      }));

      fetch('/api/students/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: studentsToSync })
      }).catch(err => console.warn('Background student sync note:', err));
    }

    return result.academicList?.id || fullListData.id;
  },

  syncStudents: async (schoolId: string, studentsList: any[]) => {
    if (!studentsList || !Array.isArray(studentsList)) return;
    
    const studentsToSync = studentsList.map((student: any) => ({
      id: `${schoolId}_${student.student || student.code}`.replace(/\s+/g, '_'),
      schoolId,
      name: student.name,
      grade: student.grade,
      code: student.student || student.code,
      parentCode: student.parent || student.parentCode,
      status: student.status || 'نشط',
      paidAmount: student.paidAmount || 0,
      totalAmount: student.totalAmount || 0,
      discountType: student.discountType || null,
      discountRate: student.discountRate || 0,
      finance: student.finance || { installments: [], transactions: [] },
      isTopStudent: student.isTopStudent || false,
      topStudentPeriod: student.topStudentPeriod || null,
      grades: student.grades || {}
    }));

    const syncResponse = await fetch('/api/students/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: studentsToSync })
    });

    return syncResponse.ok;
  },

  deleteList: async (listId: string) => {
    // 1. Optimistic Cache & LocalStorage update
    for (const [key, entry] of academicCache.lists.entries()) {
      const filtered = entry.data.filter(l => l.id !== listId);
      const rawStr = JSON.stringify(filtered);
      academicCache.lists.set(key, { data: filtered, raw: rawStr });
      safeStorage.setItem(`s6_cache_lists_${key}`, rawStr);
    }
    realtimeManager.trigger('academic_lists', { action: 'DELETE', id: listId });

    const response = await fetch(`/api/academic-lists/${listId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to delete list (${response.status}): ${text.slice(0, 100)}`);
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to delete list');
  },

  // --- School Students ---
  subscribeToStudents: (schoolId: string, callback: (students: SchoolStudent[]) => void) => {
    const key = schoolId || 'all';

    // 1. Instant Synchronous Cache Emission
    let cachedEntry = academicCache.students.get(key);
    if (!cachedEntry) {
      try {
        const stored = safeStorage.getItem(`s6_cache_students_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedEntry = { data: parsed, raw: stored };
          academicCache.students.set(key, cachedEntry);
        }
      } catch {}
    }
    if (cachedEntry && Array.isArray(cachedEntry.data)) {
      callback(cachedEntry.data);
    }

    const fetchStudents = async () => {
      try {
        const response = await fetch(`/api/students/${schoolId}`);
        if (!response.ok) {
          const text = await response.text();
          if (text.includes('Rate exceeded')) {
            console.warn('Rate limit exceeded for students');
            return;
          }
          throw new Error(`Server returned ${response.status}: ${text.slice(0, 100)}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
           console.error('[AcademicService] Expected JSON but got', contentType);
           return;
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.students)) {
          const rawStr = JSON.stringify(data.students);
          const currentEntry = academicCache.students.get(key);
          if (!currentEntry || currentEntry.raw !== rawStr) {
            academicCache.students.set(key, { data: data.students, raw: rawStr });
            safeStorage.setItem(`s6_cache_students_${key}`, rawStr);
            callback(data.students);
          }
        }
      } catch (error) {
        if(error instanceof Error && error.message.includes('Failed to fetch')) { console.warn('Network issue fetching students, will retry'); } else { console.warn('Error fetching students from API:', error); }
      }
    };

    fetchStudents();
    const unsub = realtimeManager.subscribe('students', () => {
      fetchStudents();
    });
    return () => unsub();
  },

  deleteStudent: async (studentId: string) => {
    const response = await fetch(`/api/students/${studentId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to delete student (${response.status}): ${text.slice(0, 100)}`);
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to delete student');
  },

  updateStudent: async (studentId: string, data: Partial<SchoolStudent>) => {
    const response = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to update student (${response.status}): ${text.slice(0, 100)}`);
    }
    return await response.json();
  },

  updateStudentDirect: async (studentId: string, data: any) => {
    const response = await fetch(`/api/students/${studentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  getStudentByCode: async (schoolId: string, code: string) => {
    const response = await fetch(`/api/students/by-code/${schoolId}/${code}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.student : null;
  },

  // --- Financial & School Settings ---
  subscribeToSchoolSettings: (schoolId: string, callback: (settings: any) => void) => {
    const key = schoolId || 'all';

    // 1. Instant Synchronous Cache Emission
    let cachedEntry = academicCache.settings.get(key);
    if (!cachedEntry) {
      try {
        const stored = safeStorage.getItem(`s6_cache_settings_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          cachedEntry = { data: parsed, raw: stored };
          academicCache.settings.set(key, cachedEntry);
        }
      } catch {}
    }
    if (cachedEntry && cachedEntry.data) {
      callback(cachedEntry.data);
    }

    const fetchSettings = async () => {
      if (!schoolId || schoolId === 'undefined') {
        console.warn('[AcademicService] fetchSettings called with empty schoolId');
        return;
      }
      try {
        const response = await fetch(`/api/school-configs/${encodeURIComponent(schoolId)}`);
        
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.warn(`[AcademicService] Non-JSON or error response from /api/school-configs/${schoolId}:`, text.slice(0, 100));
          
          // Return early if we got HTML (probably SPA fallback)
          if (text.includes('<!doctype html>') || text.includes('<html')) {
            return;
          }
          
          throw new Error(`Server returned ${response.status} for schoolId ${schoolId}`);
        }
        
        const data = await response.json();
        if (data.success && data.config) {
          const rawStr = JSON.stringify(data.config);
          const currentEntry = academicCache.settings.get(key);
          if (!currentEntry || currentEntry.raw !== rawStr) {
            academicCache.settings.set(key, { data: data.config, raw: rawStr });
            safeStorage.setItem(`s6_cache_settings_${key}`, rawStr);
            callback(data.config);
          }
        }
      } catch (error) {
        if(error instanceof Error && error.message.includes('Failed to fetch')) { console.warn('Network issue fetching settings, will retry'); } else { console.warn('Error fetching settings from API:', error); }
      }
    };

    fetchSettings();
    const unsub = realtimeManager.subscribe('school_configs', schoolId, () => {
      fetchSettings();
    });
    return () => unsub();
  },

  getSchoolSettings: async (schoolId: string) => {
    if (!schoolId || schoolId === 'undefined') return null;
    const response = await fetch(`/api/school-configs/${schoolId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.config : null;
  },

  updateSchoolSettings: async (schoolId: string, settings: any) => {
    await fetch('/api/school-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, id: schoolId })
    });
  },

  // --- سجل الانضباط المدرسي (Attendance & Discipline) ---
  updateAttendance: async (studentId: string, userId: string, status: string, by: string, reason: string, period: string, schoolId?: string) => { 
    const response = await fetch(`/api/students/${studentId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, by, reason, period, schoolId })
    });
    if (!response.ok) throw new Error('Failed to update attendance');
    return await response.json();
  },

  updateBehavior: async (studentId: string, payload: { type: string, points: number, action: string, note: string, by: string, schoolId?: string }) => {
    const response = await fetch(`/api/students/${studentId}/behavior`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to update behavior');
    return await response.json();
  },

  updateUniformConfigs: async (schoolId: string, uniformConfigs: any) => {
    const response = await fetch(`/api/school-configs/${schoolId}/uniform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uniformConfigs })
    });
    if (!response.ok) throw new Error('Failed to update uniform settings');
    return await response.json();
  },

  fetchAttendanceLogs: async (studentId: string) => {
    const response = await fetch(`/api/students/${studentId}/attendance/logs`);
    if (!response.ok) throw new Error('Failed to fetch attendance logs');
    const data = await response.json();
    return data.logs || [];
  },

  fetchBehaviorLogs: async (studentId: string) => {
    const response = await fetch(`/api/students/${studentId}/behavior/logs`);
    if (!response.ok) throw new Error('Failed to fetch behavior logs');
    const data = await response.json();
    return data.logs || [];
  },

  recordParentPayment: async (studentId: string, amount: number, period: string, type: string) => { 
    try {
      const response = await fetch('/api/finance/payment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, amount, notes: period, method: type })
      });
      return await response.json();
    } catch (e) {
      console.error('Error recording parent payment:', e);
      return { success: false };
    }
  },
  approvePaymentRequest: async (requestId: string, studentId?: string, amount?: number, adminName?: string) => { 
    const response = await fetch('/api/finance/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, studentId, amount, adminName: adminName || 'الإدارة المالية' })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'فشل في تأكيد الدفعة');
    }
    return await response.json();
  },
  rejectPaymentRequest: async (requestId: string, reason: string) => { 
    const response = await fetch('/api/finance/reject-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, reason })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'فشل في رفض الدفعة');
    }
    return await response.json();
  },
  cleanupResolvedPaymentRequests: async (schoolId?: string) => {
    try {
      const response = await fetch('/api/finance/cleanup-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: schoolId || 'all' })
      });
      if (!response.ok) return 0;
      const data = await response.json().catch(() => ({ count: 0 }));
      return data.count || 0;
    } catch (e) {
      console.error('Error cleaning up resolved payments:', e);
      return 0;
    }
  },
  cleanupOrphanedPaymentRequests: async () => {
    try {
      const response = await fetch('/api/finance/cleanup-orphaned-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) return 0;
      const data = await response.json().catch(() => ({ count: 0 }));
      return data.count || 0;
    } catch (e) {
      console.error('Error cleaning up orphaned payments:', e);
      return 0;
    }
  },
};
