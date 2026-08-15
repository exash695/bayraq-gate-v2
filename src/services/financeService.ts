import { 
  collection, 
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
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { logActivity } from '../utils/auditLogger';
import { safeStorage, safeSessionStorage } from '../lib/storage';

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
  let q = query(
    collection(db, 'payment_requests'),
    where('status', '==', 'pending')
  );

  if (schoolId) {
    q = query(
      collection(db, 'payment_requests'),
      where('status', '==', 'pending'),
      where('schoolId', '==', schoolId || 'unassigned')
    );
  }

  return onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as unknown as StudentPayment))
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    callback(payments);
  }, (error) => {
    if (error.code !== 'permission-denied') {
      handleFirestoreError(error, OperationType.LIST, 'payment_requests', false);
    }
  });
};

export const verifyPayment = async (requestId: string, studentCode: string, studentName: string, amount: number, adminName: string = 'النظام') => {
  // 1. Get the request document
  const requestRef = doc(db, 'payment_requests', requestId);
  const requestSnap = await getDoc(requestRef);
  
  if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
    throw new Error('الطلب غير موجود أو تمت معالجته مسبقاً');
  }

  const requestData = requestSnap.data();
  const schoolId = requestData.schoolId || 'unknown';
  
  // 2. Resolve specific student document ID (with space/sanitization)
  const studentDocId = `${schoolId}_${studentCode}`.replace(/\s+/g, '_');
  const studentRef = doc(db, 'school_students', studentDocId);
  
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) {
    throw new Error(`تعذر العثور على سجل الطالب: ${studentCode}`);
  }

  const studentData = studentSnap.data();

  // 3. Update installments logic - correctly target finance object
  const installments = studentData.finance?.installments || studentData.installments || [];
  let amountLeft = amount;
  const updatedInstallments = installments.map((inst: any) => {
    const isPaid = inst.paid === true || inst.status === 'paid' || inst.status === 'completed' || inst.status === 'verified' || inst.status === 'approved';
    // Match based on amount remaining
    if (!isPaid && amountLeft >= inst.amount) {
      amountLeft -= inst.amount;
      return { 
        ...inst, 
        status: 'completed', 
        paid: true, 
        paidAt: serverTimestamp(),
        verifiedAt: serverTimestamp()
      };
    }
    return inst;
  });
  
  const batch = writeBatch(db);

  // 4. Mark request as verified/approved
  batch.update(requestRef, {
    status: 'verified',
    verifiedAt: serverTimestamp(),
    approvedBy: adminName
  });

  // 5. Update student document
  batch.update(studentRef, {
    'finance.paidAmount': increment(amount),
    'finance.lastPaymentDate': serverTimestamp(),
    'finance.installments': updatedInstallments,
    'paidAmount': increment(amount)
  });

  // 6. Create notification
  const notificationRef = doc(collection(db, 'notifications'));
  batch.set(notificationRef, {
    title: 'تم تأكيد دفعة مالية',
    message: `تم تأكيد مبلغ ${amount.toLocaleString()} د.ع للطالب ${studentName}`,
    type: 'payment',
    createdAt: new Date().toISOString(),
    isRead: false,
    studentId: studentCode,
    userId: studentData.userId || null
  });

  await batch.commit();

  try {
    logActivity({
      action: 'تأكيد دفعة مالية',
      details: `تم تأكيد وصل قبض بمبلغ ${amount.toLocaleString()} د.ع للطالب: ${studentName}`,
      targetId: studentCode,
      targetType: 'finance_payment',
      targetName: studentName
    });
  } catch (error) {
    console.error("Failed to log payment confirmation:", error);
  }
};

export const rejectPayment = async (requestId: string, notes: string) => {
  const requestRef = doc(db, 'payment_requests', requestId);
  try {
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;
    
    const data = requestSnap.data();
    const studentDocId = `${data.schoolId}_${data.studentCode || data.studentId}`.replace(/\s+/g, '_');
    const studentRef = doc(db, 'school_students', studentDocId);

    const batch = writeBatch(db);
    
    // Mark as rejected in request collection
    batch.update(requestRef, {
      status: 'rejected',
      rejectReason: notes,
      rejectedAt: serverTimestamp()
    });

    // Update student's transaction log (the pending record in their finance object)
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const txns = (studentSnap.data().finance?.transactions || []).map((t: any) => {
        if (t.id === requestId) return { ...t, status: 'rejected', rejectReason: notes };
        return t;
      });
      batch.update(studentRef, { 'finance.transactions': txns });
    }

    await batch.commit();

    logActivity({
      action: 'رفض دفعة مالية',
      details: `تم رفض وصل الدفع للطالب: ${data.studentName}. السبب: ${notes}`,
      targetId: data.studentCode || data.studentId,
      targetType: 'finance_payment'
    });
  } catch (e) {
    console.error("Error rejecting payment:", e);
    throw new Error('فشل في عملية الرفض: ' + (e instanceof Error ? e.message : String(e)));
  }
};

export const createPaymentRequest = async (paymentData: Omit<StudentPayment, 'id' | 'status' | 'date'>, idempotencyKey?: string) => {
  const payload = {
    ...paymentData,
    status: 'pending',
    date: serverTimestamp(),
    ...(idempotencyKey && { idempotency_key: idempotencyKey })
  };

  if (idempotencyKey) {
    const paymentRef = doc(db, 'payments', idempotencyKey);
    await setDoc(paymentRef, payload, { merge: true });
    return paymentRef;
  } else {
    return await addDoc(collection(db, 'payments'), payload);
  }
};

export const getStudentFinancials = async (studentId: string) => {
  const cacheKey = `financials_${studentId}`;
  const cachedData = safeStorage.getItem(cacheKey);

  // 1. التحقق من وجود بيانات مخزنة محلياً لتوفير التكلفة
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. إذا لم توجد، نسحبها من السيرفر لمرة واحدة
  const studentRef = doc(db, 'students', studentId);
  const data = await getDoc(studentRef);
  
  if (data.exists()) {
    const studentData = data.data();
    // حفظ محلي
    safeStorage.setItem(cacheKey, JSON.stringify(studentData));
    return studentData;
  }
  
  return null;
};
