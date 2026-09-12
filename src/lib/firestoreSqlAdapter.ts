import { api } from './api';
import { customAuth } from '../services/customAuthService';
import { realtimeManager } from './realtimeManager';
import { cacheService } from '../services/cacheService';

// Ensure toMillis compatibility for dates and strings coming from SQL API
if (typeof (String.prototype as any).toMillis !== 'function') {
  Object.defineProperty(String.prototype, 'toMillis', {
    value: function () {
      const ms = new Date(this as string).getTime();
      return isNaN(ms) ? (Number(this) || 0) : ms;
    },
    writable: true,
    configurable: true
  });
}
if (typeof (Date.prototype as any).toMillis !== 'function') {
  Object.defineProperty(Date.prototype, 'toMillis', {
    value: function () {
      return this.getTime();
    },
    writable: true,
    configurable: true
  });
}
if (typeof (Number.prototype as any).toMillis !== 'function') {
  Object.defineProperty(Number.prototype, 'toMillis', {
    value: function () {
      return Number(this);
    },
    writable: true,
    configurable: true
  });
}

// Compatibility layer mimicking Firestore SDK on top of our PostgreSQL / REST backend
export const db: any = {
  type: 'firestore'
};

export const auth: any = {
  get currentUser() {
    const user = customAuth.getCurrentUser();
    return user ? { 
      uid: user.uid, 
      id: user.uid,
      email: user.email, 
      displayName: user.displayName || user.name,
      name: user.name || user.displayName,
      role: user.role,
      schoolId: user.schoolId,
      getIdToken: async (force?: boolean) => customAuth.getToken() || "",
      emailVerified: true,
      isAnonymous: false,
      providerData: [],
      tenantId: null,
      photoURL: user.photoURL || null
    } : null;
  }
};

export const GoogleAuthProvider: any = class {
  constructor() {}
  setCustomParameters(params: any) { return this; }
  static setCustomParameters(params: any) { return new GoogleAuthProvider(); }
};
export const signInWithPopup: any = async (...args: any[]) => ({ user: auth.currentUser });
export const signOut: any = async (authInstance?: any) => { 
  customAuth.logout();
};
export const sendPasswordResetEmail: any = async (auth: any, email: string) => {};
export const deleteUser: any = async () => {};
export const ref: any = (storage: any, path: string) => ({ type: 'storageRef', path });
export const uploadBytes: any = async (ref: any, bytes: any) => ({ ref });
export const getDownloadURL: any = async (ref: any) => "";

export function collection(dbInstance: any, name: string, ...rest: string[]): any {
  const path = rest.length > 0 ? `${name}/${rest.join('/')}` : name;
  return { type: 'collection', name: path };
}

export function doc(dbInstance: any, ...rest: string[]): any {
  // Handle doc(collectionRef) -> auto ID
  if (typeof dbInstance === 'object' && dbInstance?.type === 'collection' && rest.length === 0) {
    return { type: 'doc', collectionName: dbInstance.name, id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` };
  }
  // Handle doc(db, 'col', 'id')
  if (rest.length >= 2) {
    const id = rest[rest.length - 1];
    const collectionName = rest.slice(0, -1).join('/');
    return { type: 'doc', collectionName, id };
  }
  // Handle doc(collectionRef, 'id')
  if (typeof dbInstance === 'object' && dbInstance?.type === 'collection' && rest.length === 1) {
    return { type: 'doc', collectionName: dbInstance.name, id: rest[0] };
  }
  // Handle doc(db, 'col/id')
  const path = rest[0] || '';
  const parts = path.split('/');
  const id = parts.pop() || '';
  const collectionName = parts.join('/');
  return { type: 'doc', collectionName, id };
}

export const query: any = (col: any, ...constraints: any[]) => {
  return { ...col, constraints: [...(col.constraints || []), ...constraints] };
};

export const where: any = (field: string, op: string, value: any) => {
  return { type: 'where', field, op, value };
};

export const orderBy: any = (field: string, direction: string = 'asc') => {
  return { type: 'orderBy', field, direction };
};

export const limit: any = (n: number) => {
  return { type: 'limit', value: n };
};

// Helper: map camelCase <-> snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
}

// Map collection paths to REST API endpoints
export const getEndpoint = (collectionName: string): string => {
  if (!collectionName) return '/api/firestore-docs/default';
  
  // Handle subcollections: e.g. "community_posts/123/comments" or "community_stories/456/replies"
  const parts = collectionName.split('/');
  if (parts.length === 3) {
    const [parentCol, parentId, subCol] = parts;
    if (parentCol === 'community_posts' && subCol === 'comments') {
      return `/api/community/posts/${parentId}/comments`;
    }
    if (parentCol === 'community_stories' && (subCol === 'comments' || subCol === 'replies' || subCol === 'replies_list')) {
      return `/api/community/stories/${parentId}/replies`;
    }
    if (parentCol === 'live_sessions' && subCol === 'viewers') {
      return `/api/live-sessions/${parentId}/viewers`;
    }
    if (parentCol === 'live_sessions' && subCol === 'responses') {
      return `/api/live-sessions/${parentId}/responses`;
    }
    return `/api/firestore-docs/${parentCol}_${parentId}_${subCol}`;
  }
  if (parts.length > 3) {
    return `/api/firestore-docs/${parts.join('_')}`;
  }

  const baseName = parts[0];
  const mapping: Record<string, string> = {
    'users': '/api/users',
    'admins': '/api/admins',
    'schools': '/api/schools',
    'provinces': '/api/schools',
    'students': '/api/students',
    'school_students': '/api/students',
    'activation_codes': '/api/activation-codes',
    'codes': '/api/activation-codes',
    'support_tickets': '/api/support-tickets',
    'admin_outbox': '/api/admin-outbox',
    'idea_bank': '/api/idea-bank',
    'school_announcements': '/api/broadcasts',
    'notifications': '/api/notifications',
    'social_notifications': '/api/notifications',
    'broadcasts': '/api/broadcasts',
    'global_announcements': '/api/broadcasts',
    'system_announcements': '/api/broadcasts',
    'teachers': '/api/teachers',
    'lounge_messages': '/api/lounge-messages',
    'attendance_logs': '/api/attendance-logs',
    'behavior_logs': '/api/behavior-logs',
    'student_transactions': '/api/finance/transactions',
    'receipts': '/api/finance/transactions',
    'payment_requests': '/api/finance/payment-requests',
    'parent_receipts': '/api/finance/payment-requests',
    'class_schedules': '/api/class-schedules',
    'schedules': '/api/class-schedules',
    'academic_lists': '/api/academic-lists',
    'battalions': '/api/academic-lists',
    'school_archives': '/api/academic-lists',
    'council_polls': '/api/council-polls',
    'transport_routes': '/api/transport/routes',
    'transport_drivers': '/api/transport/drivers',
    'bus_drivers': '/api/transport/drivers',
    'transport_students_status': '/api/transport/students-status',
    'transport_fees': '/api/transport/fees',
    'salaries': '/api/finance/salaries',
    'community_posts': '/api/community/posts',
    'community_stories': '/api/community/stories',
    'community_comments': '/api/community/comments',
    'developer_logs': '/api/developer-logs',
    'audit_logs': '/api/audit-logs',
    'system_config': '/api/system_config',
    'system_settings': '/api/system_settings',
    'settings': '/api/settings',
    'school_settings': '/api/settings',
    'school_configs': '/api/school-configs',
    'system_errors': '/api/system_errors',
    'system_stats': '/api/admin/dashboard-stats',
    'recorded_lessons': '/api/recorded-lessons',
    'recorded_lessons_views': '/api/recorded-lessons-views',
    'school_files': '/api/school-files',
    'academy_pages': '/api/academy-pages',
    'video_comments': '/api/video-comments',
    'student_live_notes': '/api/student-live-notes',
    'bairaq_pose_chunks': '/api/bairaq/poses',
    'question_bank': '/api/question-bank',
    'curriculum_questions': '/api/question-bank',
    'exam_papers': '/api/exam-papers',
    'content': '/api/school-files',
    'live_sessions': '/api/live-sessions'
  };

  return mapping[baseName] || `/api/${baseName.replace(/_/g, '-')}`;
};

// Client-side query evaluator
function applyConstraints(items: any[], constraints: any[] = []): any[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!constraints || constraints.length === 0) return items;

  let result = [...items];

  // 1. Where filters
  for (const c of constraints) {
    if (c && c.type === 'where') {
      result = result.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const val = item[c.field] !== undefined 
          ? item[c.field] 
          : item[camelToSnake(c.field)] !== undefined 
            ? item[camelToSnake(c.field)] 
            : item[snakeToCamel(c.field)];

        if (c.op === '==') {
          if ((c.field === 'schoolId' || c.field === 'school_id') && (val === 'all' || val === 'global' || c.value === 'all' || c.value === 'global' || (!val && c.value === 'school1') || (val === 'school1' && !c.value))) {
            return true;
          }
          if (c.field === 'className' || c.field === 'class_name' || c.field === 'grade') {
            if (val == c.value) return true;
            if (val && c.value) {
              const cleanA = String(val).replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/(?:^|\s)ال/g, ' ').replace(/\s+/g, '');
              const cleanB = String(c.value).replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىي]/g, 'ي').replace(/(?:^|\s)ال/g, ' ').replace(/\s+/g, '');
              if (cleanA && cleanB && (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA))) return true;
            }
            return false;
          }
          return val == c.value;
        }
        if (c.op === '!=') return val != c.value;
        if (c.op === '>') return val > c.value;
        if (c.op === '>=') return val >= c.value;
        if (c.op === '<') return val < c.value;
        if (c.op === '<=') return val <= c.value;
        if (c.op === 'array-contains') return Array.isArray(val) && val.includes(c.value);
        if (c.op === 'in') return Array.isArray(c.value) && (c.value.includes(val) || ((c.field === 'schoolId' || c.field === 'school_id') && (val === 'all' || val === 'global')));
        return true;
      });
    }
  }

  // 2. OrderBy
  for (const c of constraints) {
    if (c && c.type === 'orderBy') {
      result.sort((a, b) => {
        const valA = a[c.field] ?? a[camelToSnake(c.field)] ?? a[snakeToCamel(c.field)];
        const valB = b[c.field] ?? b[camelToSnake(c.field)] ?? b[snakeToCamel(c.field)];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const comp = valA > valB ? 1 : -1;
        return c.direction === 'desc' ? -comp : comp;
      });
    }
  }

  // 3. Limit
  for (const c of constraints) {
    if (c && c.type === 'limit' && typeof c.value === 'number') {
      result = result.slice(0, c.value);
    }
  }

  return result;
}

// Extract document data from various API response shapes
function extractDocData(res: any, id: string): any {
  if (!res) return null;
  if (res.success === false) return null;
  if (res.data !== undefined) return res.data;
  if (res.user !== undefined) return res.user;
  if (res.school !== undefined) return res.school;
  if (res.student !== undefined) return res.student;
  if (res.teacher !== undefined) return res.teacher;
  if (res.ticket !== undefined) return res.ticket;
  if (res.post !== undefined) return res.post;
  if (res.lesson !== undefined) return res.lesson;
  if (res.file !== undefined) return res.file;
  if (res.page !== undefined) return res.page;
  if (res.schedule !== undefined) return res.schedule;
  if (res.setting !== undefined) return res.setting;
  if (res[id] !== undefined) return res[id];
  return res;
}

// Extract items array from various API response shapes
function extractArrayItems(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.users)) return res.users;
  if (Array.isArray(res.schools)) return res.schools;
  if (Array.isArray(res.students)) return res.students;
  if (Array.isArray(res.teachers)) return res.teachers;
  if (Array.isArray(res.codes)) return res.codes;
  if (Array.isArray(res.tickets)) return res.tickets;
  if (Array.isArray(res.posts)) return res.posts;
  if (Array.isArray(res.stories)) return res.stories;
  if (Array.isArray(res.lessons)) return res.lessons;
  if (Array.isArray(res.files)) return res.files;
  if (Array.isArray(res.pages)) return res.pages;
  if (Array.isArray(res.schedules)) return res.schedules;
  if (Array.isArray(res.comments)) return res.comments;
  if (Array.isArray(res.notes)) return res.notes;
  if (Array.isArray(res.routes)) return res.routes;
  if (Array.isArray(res.drivers)) return res.drivers;
  if (Array.isArray(res.payments)) return res.payments;
  if (Array.isArray(res.transactions)) return res.transactions;
  if (Array.isArray(res.notifications)) return res.notifications;
  if (Array.isArray(res.broadcasts)) return res.broadcasts;
  if (Array.isArray(res.settings)) return res.settings;

  // Fallback: search for any array property
  if (typeof res === 'object' && res !== null) {
    for (const key of Object.keys(res)) {
      if (Array.isArray(res[key])) {
        return res[key];
      }
    }
  }
  return [];
}

export const onSnapshot: any = (q: any, callback: (snapshot: any) => void) => {
  let isCancelled = false;
  const collectionName = q.name || q.collectionName || (q.type === 'doc' ? q.collectionName : '');
  const docId = q.type === 'doc' ? q.id : undefined;

  // 1. Instant Cache Emission (0ms delay)
  const isDocQuery = q.type === 'doc' && q.id;
  const cacheKey = isDocQuery ? `sql_doc_${collectionName}_${q.id}` : `sql_col_${collectionName}`;

  if (isDocQuery) {
    const cachedDoc = cacheService.get<any>(cacheKey);
    if (cachedDoc !== null && cachedDoc !== undefined) {
      queueMicrotask(() => {
        if (!isCancelled) {
          callback({
            exists: () => true,
            data: () => cachedDoc,
            get: (field: string) => cachedDoc?.[field] ?? cachedDoc?.[camelToSnake(field)] ?? cachedDoc?.[snakeToCamel(field)],
            id: q.id,
            metadata: { hasPendingWrites: false, fromCache: true },
            ref: q
          });
        }
      });
    }
  } else {
    const cachedItems = cacheService.get<any[]>(cacheKey);
    if (Array.isArray(cachedItems) && cachedItems.length > 0) {
      const filtered = applyConstraints(cachedItems, q.constraints);
      const docs = filtered.map((item: any) => {
        const id = item.id || item.uid || item._id;
        return {
          id,
          ref: { type: 'doc', collectionName, id },
          data: () => item,
          get: (field: string) => item?.[field] ?? item?.[camelToSnake(field)] ?? item?.[snakeToCamel(field)],
          exists: () => true,
          metadata: { hasPendingWrites: false, fromCache: true }
        };
      });

      queueMicrotask(() => {
        if (!isCancelled) {
          callback({
            docs,
            size: docs.length,
            empty: docs.length === 0,
            forEach: (cb: any) => docs.forEach(cb),
            docChanges: () => [],
            metadata: { hasPendingWrites: false, fromCache: true },
            query: q
          });
        }
      });
    }
  }

  const fetchData = async () => {
    try {
      const endpoint = getEndpoint(collectionName);

      if (q.type === 'doc' && q.id) {
        let res: any;
        try {
          res = await api.get(`${endpoint}/${q.id}`);
        } catch (fetchErr: any) {
          if (!isCancelled) {
            callback({
              exists: () => false,
              data: () => null,
              get: () => undefined,
              id: q.id,
              metadata: { hasPendingWrites: false, fromCache: false },
              ref: q
            });
          }
          return;
        }

        const data = extractDocData(res, q.id);
        if (data) {
          cacheService.set(cacheKey, data);
        }

        if (!isCancelled) {
          callback({
            exists: () => !!data,
            data: () => data,
            get: (field: string) => data?.[field] ?? data?.[camelToSnake(field)] ?? data?.[snakeToCamel(field)],
            id: q.id,
            metadata: { hasPendingWrites: false, fromCache: false },
            ref: q
          });
        }
      } else {
        let res: any;
        try {
          res = await api.get(endpoint);
        } catch (fetchErr: any) {
          if (!isCancelled) {
            callback({
              docs: [],
              size: 0,
              empty: true,
              forEach: () => {},
              docChanges: () => [],
              metadata: { hasPendingWrites: false, fromCache: false },
              query: q
            });
          }
          return;
        }

        const rawItems = extractArrayItems(res);
        if (Array.isArray(rawItems)) {
          cacheService.set(cacheKey, rawItems);
        }

        const filteredItems = applyConstraints(rawItems, q.constraints);

        if (!isCancelled) {
          const docs = filteredItems.map((item: any) => {
            const id = item.id || item.uid || item._id;
            return {
              id,
              ref: { type: 'doc', collectionName, id },
              data: () => item,
              get: (field: string) => item?.[field] ?? item?.[camelToSnake(field)] ?? item?.[snakeToCamel(field)],
              exists: () => true,
              metadata: { hasPendingWrites: false, fromCache: false }
            };
          });

          callback({
            docs,
            size: docs.length,
            empty: docs.length === 0,
            forEach: (cb: any) => docs.forEach(cb),
            docChanges: () => [],
            metadata: { hasPendingWrites: false, fromCache: false },
            query: q
          });
        }
      }
    } catch (err) {
      console.error("onSnapshot fetch error:", err);
    }
  };

  // 2. Network fetch in background
  fetchData();

  // 3. Realtime WebSocket subscription
  const unsubscribeRealtime = realtimeManager.subscribe(collectionName, docId, (event?: any) => {
    if (!isCancelled) {
      if (q.type === 'doc' && q.id && event?.data && (event.action === 'UPDATE' || event.action === 'INSERT')) {
        const data = event.data;
        cacheService.set(cacheKey, data);
        callback({
          exists: () => !!data,
          data: () => data,
          get: (field: string) => data?.[field] ?? data?.[camelToSnake(field)] ?? data?.[snakeToCamel(field)],
          id: q.id,
          metadata: { hasPendingWrites: false, fromCache: false },
          ref: q
        });
      } else {
        fetchData();
      }
    }
  });

  return () => {
    isCancelled = true;
    unsubscribeRealtime();
  };
};

export const getDoc: any = async (docRef: any) => {
  const collectionName = docRef.collectionName;
  const cacheKey = `sql_doc_${collectionName}_${docRef.id}`;
  const cached = cacheService.get<any>(cacheKey);
  if (cached) {
    // Revalidate in background
    setTimeout(async () => {
      try {
        const endpoint = getEndpoint(collectionName);
        const res = await api.get(`${endpoint}/${docRef.id}`);
        const data = extractDocData(res, docRef.id);
        if (data) cacheService.set(cacheKey, data);
      } catch {}
    }, 0);

    return {
      exists: () => true,
      data: () => cached,
      id: docRef.id
    };
  }

  try {
    const endpoint = getEndpoint(collectionName);
    const res = await api.get(`${endpoint}/${docRef.id}`);
    const data = extractDocData(res, docRef.id);
    if (data) cacheService.set(cacheKey, data);
    return {
      exists: () => !!data,
      data: () => data,
      id: docRef.id
    };
  } catch (err) {
    return {
      exists: () => false,
      data: () => null,
      id: docRef.id
    };
  }
};

export const addDoc: any = async (colRef: any, data: any) => {
  const endpoint = getEndpoint(colRef.name);
  const res = await api.post(endpoint, data);
  const id = res?.id || res?.data?.id || data?.id || `auto_${Date.now()}`;
  cacheService.remove(`sql_col_${colRef.name}`);
  return {
    id,
    ...res
  };
};

export const updateDoc: any = async (docRef: any, data: any) => {
  const endpoint = getEndpoint(docRef.collectionName);
  cacheService.remove(`sql_doc_${docRef.collectionName}_${docRef.id}`);
  cacheService.remove(`sql_col_${docRef.collectionName}`);
  return await api.patch(`${endpoint}/${docRef.id}`, data);
};

export const setDoc: any = async (docRef: any, data: any, options?: any) => {
  const endpoint = getEndpoint(docRef.collectionName);
  cacheService.remove(`sql_doc_${docRef.collectionName}_${docRef.id}`);
  cacheService.remove(`sql_col_${docRef.collectionName}`);
  return await api.patch(`${endpoint}/${docRef.id}`, data);
};

export const deleteDoc: any = async (docRef: any) => {
  const endpoint = getEndpoint(docRef.collectionName);
  cacheService.remove(`sql_doc_${docRef.collectionName}_${docRef.id}`);
  cacheService.remove(`sql_col_${docRef.collectionName}`);
  return await api.delete(`${endpoint}/${docRef.id}`);
};

export const getDocs: any = async (q: any) => {
  const collectionName = q.name || q.collectionName;
  const cacheKey = `sql_col_${collectionName}`;
  const cachedItems = cacheService.get<any[]>(cacheKey);

  if (Array.isArray(cachedItems) && cachedItems.length > 0) {
    // Revalidate in background
    setTimeout(async () => {
      try {
        const endpoint = getEndpoint(collectionName);
        const res = await api.get(endpoint);
        const rawItems = extractArrayItems(res);
        if (Array.isArray(rawItems)) cacheService.set(cacheKey, rawItems);
      } catch {}
    }, 0);

    const filteredItems = applyConstraints(cachedItems, q.constraints);
    const docs = filteredItems.map((item: any) => {
      const id = item.id || item.uid || item._id;
      return {
        id,
        ref: { type: 'doc', collectionName, id },
        data: () => item,
        get: (field: string) => item?.[field] ?? item?.[camelToSnake(field)] ?? item?.[snakeToCamel(field)],
        exists: () => true
      };
    });

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (callback: any) => docs.forEach(callback)
    };
  }

  try {
    const endpoint = getEndpoint(collectionName);
    const res = await api.get(endpoint);
    const rawItems = extractArrayItems(res);
    if (Array.isArray(rawItems)) {
      cacheService.set(cacheKey, rawItems);
    }
    const filteredItems = applyConstraints(rawItems, q.constraints);

    const docs = filteredItems.map((item: any) => {
      const id = item.id || item.uid || item._id;
      return {
        id,
        ref: { type: 'doc', collectionName, id },
        data: () => item,
        get: (field: string) => item?.[field] ?? item?.[camelToSnake(field)] ?? item?.[snakeToCamel(field)],
        exists: () => true
      };
    });

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (callback: any) => docs.forEach(callback)
    };
  } catch (err) {
    return {
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {}
    };
  }
};

export type DocumentData = any;
export type QueryConstraint = any;
export type Firestore = any;
export type CollectionReference<T = any, D = any> = any;
export type DocumentReference<T = any, D = any> = any;
export type FirebaseStorage = any;
export type StorageReference = any;

export const increment: any = (n: number) => ({ type: 'increment', value: n });
export const arrayUnion: any = (...elements: any[]) => ({ type: 'arrayUnion', value: elements });
export const arrayRemove: any = (...elements: any[]) => ({ type: 'arrayRemove', value: elements });
export const serverTimestamp: any = () => new Date().toISOString();

export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static now() {
    const n = Date.now();
    return new Timestamp(Math.floor(n / 1000), (n % 1000) * 1e6);
  }
  static fromDate(date: Date) {
    const n = date.getTime();
    return new Timestamp(Math.floor(n / 1000), (n % 1000) * 1e6);
  }
  toDate() {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
}

export const writeBatch: any = () => {
  const operations: Array<() => Promise<any>> = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push(() => setDoc(docRef, data));
    },
    update: (docRef: any, data: any) => {
      operations.push(() => updateDoc(docRef, data));
    },
    delete: (docRef: any) => {
      operations.push(() => deleteDoc(docRef));
    },
    commit: async () => {
      for (const op of operations) {
        await op();
      }
    }
  };
};

export const runTransaction: any = async (db: any, updateFunction: any) => {
  return await updateFunction({
    get: async (docRef: any) => await getDoc(docRef),
    set: async (docRef: any, data: any) => await setDoc(docRef, data),
    update: async (docRef: any, data: any) => await updateDoc(docRef, data),
    delete: async (docRef: any) => await deleteDoc(docRef)
  });
};

export const getDocFromServer: any = getDoc;
export const getDocFromCache: any = getDoc;
export const getDocsFromServer: any = getDocs;
export const getCountFromServer: any = async (q: any) => {
  const snap = await getDocs(q);
  return { data: () => ({ count: snap.size }) };
};
export const startAfter: any = (...args: any[]) => ({ type: 'startAfter', value: args });
export const terminate: any = async () => {};
export const clearIndexedDbPersistence: any = async () => {};
export const deleteField: any = () => ({ type: 'deleteField' });
export const collectionGroup: any = (db: any, id: string) => ({ type: 'collectionGroup', id });

export const deleteObject: any = async (ref: any) => {
  console.log("deleteObject executed", ref);
};

export const uploadBytesResumable: any = (ref: any, bytes: any) => {
  return {
    on: (event: string, progress: any, error: any, complete: any) => {
      setTimeout(complete, 50);
      return () => {};
    },
    snapshot: { ref },
    then: (cb: any) => Promise.resolve({ ref }).then(cb)
  };
};

export const storage: any = {};
