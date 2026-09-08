import { collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  increment,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { logActivity } from '../utils/auditLogger';
import { safeStorage, safeSessionStorage } from '../lib/storage';
import { realtimeManager } from '../lib/realtimeManager';

// ملاحظة للإدارة: لتفعيل صلاحيات المدير لهذا الحساب، يجب إضافة وثيقة في مجموعة "admins"
// معرف الوثيقة (Document ID) يجب أن يكون: FW9aRJklhbZ6m6h6YJjOCG5nPqB3
// يمكنك القيام بذلك يدوياً من خلال لوحة تحكم Firestore Console.


export const DISCOUNT_TYPES = {
  'EARLY_BIRD': { label: 'خصم التسجيل المبكر', value: 0.15 },
  'SOCIAL_CASE': { label: 'خصم الرعاية الاجتماعية', value: 0.30 },
  'SIBLING': { label: 'خصم الأخوة', value: 0.10 },
  'MARTYR_FAMILY': { label: 'خصم ذوي الشهداء', value: 0.50 },
  'ORPHAN': { label: 'خصم الأيتام', value: 0.50 },
  'TEACHER_CHILDREN': { label: 'خصم ابناء الاساتذة', value: 0.20 },
};

export type DiscountKey = keyof typeof DISCOUNT_TYPES;

export const calculateFinalAmount = (originalPrice: number, selectedDiscount?: DiscountKey | null) => {
  const discount = selectedDiscount ? DISCOUNT_TYPES[selectedDiscount] : null;
  const discountAmount = originalPrice * (discount?.value || 0);
  const finalPrice = originalPrice - discountAmount;
  
  return {
    finalPrice,
    discountAmount,
    discountLabel: discount?.label || "لا يوجد"
  };
};

export interface StudentPayment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: any;
  createdAt?: any;
  status: 'pending' | 'verified' | 'rejected';
  method: string;
  notes?: string;
}

export const subscribeToPendingPayments = (callback: (payments: StudentPayment[]) => void, schoolId?: string | null) => {
  let isSubscribed = true;
  let abortController: AbortController | null = null;
  let retryTimeout: any = null;

  const fetchPayments = async (retries = 2) => {
    if (!isSubscribed) return;
    try {
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      const validSchoolId = (schoolId && schoolId !== 'all' && schoolId !== 'undefined' && schoolId !== 'null') ? schoolId : null;
      const url = validSchoolId 
        ? `/api/finance/pending-payments?schoolId=${encodeURIComponent(validSchoolId)}&t=${Date.now()}` 
        : `/api/finance/pending-payments?t=${Date.now()}`;

      const res = await fetch(url, { signal: abortController.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (isSubscribed && data && data.success && Array.isArray(data.payments)) {
        callback(data.payments);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      if (!isSubscribed) return;

      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn("[financeService] Network reconnecting, will retry fetching pending payments...");
      } else {
        console.warn("[financeService] Issue fetching pending payments:", error?.message || error);
      }

      if (retries > 0) {
        clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
          if (isSubscribed) fetchPayments(retries - 1);
        }, 2500);
      }
    }
  };

  fetchPayments();
  const unsub = realtimeManager.subscribe('payment_requests', () => {
    if (isSubscribed) {
      fetchPayments();
    }
  });

  return () => {
    isSubscribed = false;
    clearTimeout(retryTimeout);
    if (abortController) {
      abortController.abort();
    }
    unsub();
  };
};

export const verifyPayment = async (requestId: string, studentId: string, studentName: string, amount: number, adminName: string = 'النظام') => {
  const response = await fetch('/api/finance/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, studentId, amount, adminName, note: `تأكيد دفعة الطالب ${studentName}` })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'فشل في تأكيد الدفعة');
  }

  return await response.json();
};

export const rejectPayment = async (requestId: string, notes: string) => {
  const response = await fetch('/api/finance/reject-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId, reason: notes })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'فشل في رفض الدفعة');
  }

  return await response.json();
};

export const createPaymentRequest = async (paymentData: Omit<StudentPayment, 'id' | 'status' | 'date'>) => {
  const response = await fetch('/api/finance/payment-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'فشل في إرسال طلب الدفع');
  }

  return await response.json();
};

export const getStudentTransactions = async (studentId: string) => {
  try {
    const response = await fetch(`/api/finance/student-transactions/${encodeURIComponent(studentId)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.success ? data.transactions : [];
  } catch (error: any) {
    console.warn("[financeService] Transient issue fetching student transactions:", error?.message || error);
    return [];
  }
};

export const getStudentFinanceProfile = async (studentId: string) => {
  try {
    const response = await fetch(`/api/finance/student-profile/${encodeURIComponent(studentId)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error: any) {
    console.warn("[financeService] Transient issue fetching student finance profile:", error?.message || error);
    return null;
  }
};


export const getStudentFinancials = async (studentId: string) => {
  try {
    const response = await fetch(`/api/students/${encodeURIComponent(studentId)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.student : null;
  } catch (error: any) {
    console.warn("[financeService] Transient issue fetching student financials:", error?.message || error);
    return null;
  }
};
