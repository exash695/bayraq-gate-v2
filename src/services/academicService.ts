import { 
  collection, 
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
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { logActivity } from '../utils/auditLogger';

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

export const academicService = {
  // --- Academic Lists ---
  subscribeToLists: (schoolId: string, callback: (lists: AcademicList[]) => void, schoolName?: string) => {
    // Query the collection to filter client-side. This ensures legacy lists (with outdated IDs/no school ID),
    // lists saved during a session without loaded profile info, and custom names fallbacks are 100% matched.
    const q = query(collection(db, 'academic_lists'));
    return onSnapshot(q, (snapshot) => {
      let lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AcademicList[];
      
      const targetSchoolId = schoolId || 'unassigned';
      lists = lists.filter(list => {
        const listSchoolId = list.schoolId || 'unassigned';
        
        // 1. Check direct schoolId equality
        if (targetSchoolId !== 'unassigned' && listSchoolId === targetSchoolId) {
          return true;
        }
        
        // 2. Check fallback school textual name match (for legacy or empty-id lists)
        if (schoolName && list.school === schoolName) {
          return true;
        }
        
        // 3. Fallback for unassigned states
        if (targetSchoolId === 'unassigned' && (listSchoolId === 'unassigned' || listSchoolId === '')) {
          return true;
        }
        
        return false;
      });

      // Sort client-side using a bulletproof utility checking all date/timestamp variants
      const parseToTimestamp = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'string') {
          const t = Date.parse(val);
          return isNaN(t) ? 0 : t;
        }
        if (typeof val === 'number') return val;
        if (val.seconds) return val.seconds * 1000;
        if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
        const t = new Date(val).getTime();
        return isNaN(t) ? 0 : t;
      };

      lists.sort((a: any, b: any) => {
        const dateA = parseToTimestamp(a.createdAt);
        const dateB = parseToTimestamp(b.createdAt);
        return dateB - dateA;
      });

      callback(lists);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'academic_lists', false);
      }
    });
  },

  saveList: async (schoolId: string, listData: any) => {
    if (!listData) return;
    const { id, ...data } = listData;
    let listId = id;

    // Ensure safe default values to matching query fallbacks
    const finalSchoolId = schoolId || data.schoolId || 'unassigned';

    // To handle synchronization and prevent residuals: 
    // If updating an existing list, find previous students who are now removed.
    let removedStudentCodes: string[] = [];
    let isUpdate = false;
    let existingSnap = null;

    if (id) {
      const docRef = doc(db, 'academic_lists', id);
      try {
        existingSnap = await getDoc(docRef);
        if (existingSnap.exists()) {
          isUpdate = true;
          const existingData = existingSnap.data() as AcademicList;
          if (existingData.students && Array.isArray(existingData.students)) {
            const previousCodes = existingData.students.map(s => s.student || s.code).filter(Boolean);
            const newCodes = (listData.students || []).map((s: any) => s.student || s.code).filter(Boolean);
            removedStudentCodes = previousCodes.filter(c => !newCodes.includes(c));
          }
        }
      } catch (err) {
        console.warn("Could not fetch existing academic list snapshot:", err);
      }
    }

    // Check for Firestore document ID Presence
    // Handles update if document exists. Using a check for length or alphanumeric
    if (isUpdate && id) {
      const docRef = doc(db, 'academic_lists', id);
      await updateDoc(docRef, {
        ...data,
        schoolId: finalSchoolId,
        updatedAt: new Date().toISOString()
      });
    } else {
      const docRef = await addDoc(collection(db, 'academic_lists'), {
        ...data,
        schoolId: finalSchoolId,
        createdAt: new Date().toISOString()
      });
      listId = docRef.id;
    }

    // --- Sync to Users Collection (for Student Platform) ---
    if (listData.students && Array.isArray(listData.students)) {
      const batch = writeBatch(db);
      
      // Optimization: Fetch all potentially matching users in fewer queries
      const studentCodes = listData.students.map(s => s.student || s.code).filter(Boolean);
      const userMap = new Map<string, string>(); // studentCode -> userDocId
      
      // Firestore 'in' query is limited to 30 elements
      const chunkSize = 30;
      for (let i = 0; i < studentCodes.length; i += chunkSize) {
        const chunk = studentCodes.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        const q = query(collection(db, 'users'), where('studentCode', 'in', chunk));
        const userSnap = await getDocs(q);
        userSnap.forEach(doc => {
          userMap.set(doc.data().studentCode, doc.id);
        });
      }
      
      for (const student of listData.students) {
        // 1. Sync to school_students (Global admin view)
        const studentCode = student.student || student.code;
        if (!studentCode) continue;

        const studentDocId = `${finalSchoolId}_${studentCode}`.replace(/\s+/g, '_');
        const studentRef = doc(db, 'school_students', studentDocId);
        
        // 2. Sync grades to users collection (Student Platform)
        const userDocId = userMap.get(studentCode);
        
        // Construct base data
        const baseData: any = {
          id: studentDocId,
          name: student.name,
          grade: student.grade,
          schoolId: finalSchoolId,
          code: studentCode,
          userId: userDocId || null, // Link to user account if exists
          parentCode: student.parent || student.parentCode,
          status: student.status || 'نشط',
          discountType: student.discountType || 'NONE',
          paidAmount: student.paidAmount || 0,
          totalAmount: student.totalAmount || 0,
          isTopStudent: student.isTopStudent || false,
          topStudentPeriod: student.topStudentPeriod || null,
          lastSyncedPeriod: listData.lastSyncedPeriod || null,
          updatedAt: new Date().toISOString()
        };

        // Use batch.set for base data (merge root fields)
        batch.set(studentRef, baseData, { merge: true });

        // 3. Sync to activation_codes (Master Center for Portal Pulse)
        const activationDocId = `ACT_${studentDocId}`;
        const activationRef = doc(db, 'activation_codes', activationDocId);
        const activationData = {
          code: studentCode,
          studentCode: studentCode,
          parentCode: student.parent || student.parentCode,
          name: student.name,
          userName: student.name,
          fullName: student.name,
          role: 'student',
          grade: student.grade,
          schoolId: finalSchoolId,
          schoolName: listData.school || data.school || '',
          status: 'active',
          updatedAt: serverTimestamp()
        };
        batch.set(activationRef, activationData, { merge: true });

        // Link parent code to activation_codes as well if it's a new identifier
        if (activationData.parentCode) {
            const parentActivationId = `ACT_PAR_${finalSchoolId}_${activationData.parentCode}`.replace(/\s+/g, '_');
            batch.set(doc(db, 'activation_codes', parentActivationId), {
                code: activationData.parentCode,
                parentCode: activationData.parentCode,
                studentCode: studentCode,
                name: `ولي أمر ${student.name}`,
                userName: `ولي أمر ${student.name}`,
                role: 'parent',
                grade: student.grade,
                schoolId: finalSchoolId,
                schoolName: listData.school || data.school || '',
                status: 'active',
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        // Deep merge grades using dot notation to prevent overwriting other periods
        if (student.grades && typeof student.grades === 'object') {
          const gradesUpdate: any = {};
          Object.entries(student.grades).forEach(([period, periodGrades]: [string, any]) => {
            if (periodGrades && typeof periodGrades === 'object') {
              Object.entries(periodGrades).forEach(([subId, score]) => {
                // Ensure score is a number and not NaN
                const numericScore = Number(score);
                if (!isNaN(numericScore)) {
                  gradesUpdate[`grades.${period}.${subId}`] = numericScore;
                }
              });
            }
          });

          if (Object.keys(gradesUpdate).length > 0) {
            batch.update(studentRef, gradesUpdate);
          }
        }

        // 2. Sync grades to users collection (Student Platform)
        if (userDocId) {
          const userRef = doc(db, 'users', userDocId);
          const userUpdate: any = {
            isTopStudent: student.isTopStudent || false,
            topStudentPeriod: student.topStudentPeriod || null,
            grade: student.grade,
            schoolId: finalSchoolId,
            lastSyncedPeriod: listData.lastSyncedPeriod || null,
            updatedAt: new Date().toISOString()
          };

          // Apply same deep merge for users collection
          if (student.grades && typeof student.grades === 'object') {
            Object.entries(student.grades).forEach(([period, periodGrades]: [string, any]) => {
              if (periodGrades && typeof periodGrades === 'object') {
                Object.entries(periodGrades).forEach(([subId, score]) => {
                  const numericScore = Number(score);
                  if (!isNaN(numericScore)) {
                    userUpdate[`grades.${period}.${subId}`] = numericScore;
                  }
                });
              }
            });
          }

          batch.update(userRef, userUpdate);
        }
      }

      // 4. Delete any students that were removed from this list (True Sync)
      if (removedStudentCodes.length > 0) {
        for (const code of removedStudentCodes) {
          // Delete school_student record
          const studentDocId = `${finalSchoolId}_${code}`.replace(/\s+/g, '_');
          const studentRef = doc(db, 'school_students', studentDocId);
          batch.delete(studentRef);

          // Find and delete matching activation codes
          const codesRef = collection(db, 'activation_codes');
          const codesQ = query(codesRef, where('studentCode', '==', code));
          const codesSnap = await getDocs(codesQ);
          const codesToDelete: string[] = [code];
          
          codesSnap.forEach(cdoc => {
            const cdata = cdoc.data();
            if (cdata.code) codesToDelete.push(cdata.code);
            if (cdata.parentCode) codesToDelete.push(cdata.parentCode);
            batch.delete(cdoc.ref);
          });

          // Find and delete matching users
          const usersRef = collection(db, 'users');
          for (const cDelete of [...new Set(codesToDelete)]) {
            const uq1 = query(usersRef, where('studentCode', '==', cDelete));
            const uq2 = query(usersRef, where('parentCode', '==', cDelete));
            const [uSnap1, uSnap2] = await Promise.all([getDocs(uq1), getDocs(uq2)]);
            uSnap1.forEach(udoc => batch.delete(udoc.ref));
            uSnap2.forEach(udoc => batch.delete(udoc.ref));
          }
        }
      }
      
      await batch.commit();
    }

    return listId;
  },

  deleteList: async (listId: string) => {
    const listRef = doc(db, 'academic_lists', listId);
    const listSnap = await getDoc(listRef);

    if (!listSnap.exists()) return;

    const listData = listSnap.data() as AcademicList;
    const batch = writeBatch(db);

    // 1. Delete the academic list itself
    batch.delete(listRef);

    // 2. Delete related school_students, users, and activation_codes
    if (listData.students && Array.isArray(listData.students)) {
      for (const student of listData.students) {
        const studentCode = student.student || student.code;
        if (studentCode) {
          // school_students
          const studentDocId = `${listData.schoolId}_${studentCode}`.replace(/\s+/g, '_');
          const studentRef = doc(db, 'school_students', studentDocId);
          batch.delete(studentRef);

          // Find ALL activation codes for this student, including student/parent variants
          const codesRef = collection(db, 'activation_codes');
          const safeStudentCode = studentCode || 'unassigned';
          const codesQ1 = query(codesRef, where('studentCode', '==', safeStudentCode));
          const codesQ2 = query(codesRef, where('code', '==', safeStudentCode));
          const [codesSnap1, codesSnap2] = await Promise.all([getDocs(codesQ1), getDocs(codesQ2)]);
          
          const codesToDelete: string[] = [safeStudentCode];
          const foundCodes = new Set<string>();
          
          const addDocDelete = (cdoc: any) => {
            if (foundCodes.has(cdoc.id)) return;
            foundCodes.add(cdoc.id);
            const cdata = cdoc.data();
            if (cdata.code) codesToDelete.push(cdata.code);
            if (cdata.parentCode) codesToDelete.push(cdata.parentCode);
            batch.delete(cdoc.ref);
          };

          codesSnap1.forEach(addDocDelete);
          codesSnap2.forEach(addDocDelete);

          // Delete student and parent users with matching studentCode or parentCode or code
          const usersRef = collection(db, 'users');
          for (const code of [...new Set(codesToDelete)]) {
            const uq1 = query(usersRef, where('studentCode', '==', code));
            const uq2 = query(usersRef, where('parentCode', '==', code));
            const uq3 = query(usersRef, where('code', '==', code));
            const [uSnap1, uSnap2, uSnap3] = await Promise.all([getDocs(uq1), getDocs(uq2), getDocs(uq3)]);
            uSnap1.forEach(udoc => batch.delete(udoc.ref));
            uSnap2.forEach(udoc => batch.delete(udoc.ref));
            uSnap3.forEach(udoc => batch.delete(udoc.ref));
          }
        }
      }
    }

    await batch.commit();
  },

  // --- School Students ---
  subscribeToStudents: (schoolId: string, callback: (students: SchoolStudent[]) => void) => {
    const q = query(
      collection(db, 'school_students'), 
      where('schoolId', '==', schoolId || 'unassigned')
    );
    return onSnapshot(q, (snapshot) => {
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SchoolStudent[];
      callback(students);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.LIST, 'school_students', false);
      }
    });
  },

  deleteStudent: async (studentId: string) => {
    const studentRef = doc(db, 'school_students', studentId);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return;
    const studentData = snap.data();
    const studentCode = studentData.code;

    const batch = writeBatch(db);
    batch.delete(studentRef);

    if (studentCode) {
      const safeStudentCode = studentCode || 'unassigned';
      const codesRef = collection(db, 'activation_codes');
      const codesQ = query(codesRef, where('studentCode', '==', safeStudentCode));
      const codesSnap = await getDocs(codesQ);
      
      const codesToDelete: string[] = [safeStudentCode];
      codesSnap.forEach(cdoc => {
        const cdata = cdoc.data();
        if (cdata.code) codesToDelete.push(cdata.code);
        if (cdata.parentCode) codesToDelete.push(cdata.parentCode);
        batch.delete(cdoc.ref);
      });

      const usersRef = collection(db, 'users');
      for (const code of [...new Set(codesToDelete)]) {
        const uq1 = query(usersRef, where('studentCode', '==', code));
        const uq2 = query(usersRef, where('parentCode', '==', code));
        const [uSnap1, uSnap2] = await Promise.all([getDocs(uq1), getDocs(uq2)]);
        uSnap1.forEach(udoc => batch.delete(udoc.ref));
        uSnap2.forEach(udoc => batch.delete(udoc.ref));
      }
    }
    
    await batch.commit();
  },

  updateStudent: async (studentId: string, data: Partial<SchoolStudent>) => {
    await updateDoc(doc(db, 'school_students', studentId), data);
  },

  updateAttendance: async (
    studentId: string, 
    userId: string | null, 
    status: 'present' | 'absent' | 'late', 
    teacherName: string,
    reason?: string,
    period?: string
  ) => {
    const studentRef = doc(db, 'school_students', studentId);
    const studentSnap = await getDoc(studentRef).catch(() => null);
    
    if (!studentSnap || !studentSnap.exists()) return;
    
    const studentData = studentSnap.data();
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' });
    
    // Auto-resolve userId if missing but present in student data
    const effectiveUserId = userId || studentData.userId;
    
    let logs = studentData.attendance?.logs || [];
    let presentCount = studentData.attendance?.present || 0;
    let absentCount = studentData.attendance?.absent || 0;
    let lateCount = studentData.attendance?.late || 0;

    // Find if there's already a log for today and SAME period
    const existingIndex = logs.findIndex((l: any) => l.date === date && l.period === period);
    
    if (existingIndex > -1) {
      const oldStatus = logs[existingIndex].status;
      if (oldStatus === 'present') presentCount = Math.max(0, presentCount - 1);
      else if (oldStatus === 'absent') absentCount = Math.max(0, absentCount - 1);
      else if (oldStatus === 'late') lateCount = Math.max(0, lateCount - 1);
      
      logs[existingIndex] = {
        date,
        time,
        status,
        teacherName,
        reason: reason || '',
        period: period || 'عام'
      };
    } else {
      logs.push({
        date,
        time,
        status,
        teacherName,
        reason: reason || '',
        period: period || 'عام'
      });
    }

    if (status === 'present') presentCount++;
    else if (status === 'absent') absentCount++;
    else if (status === 'late') lateCount++;

    const attendanceUpdate = {
      'attendance.present': presentCount,
      'attendance.absent': absentCount,
      'attendance.late': lateCount,
      'attendance.logs': logs
    };

    const batch = writeBatch(db);
    batch.update(studentRef, attendanceUpdate);
    batch.update(studentRef, { updatedAt: new Date().toISOString() });

    if (effectiveUserId) {
      batch.update(doc(db, 'users', effectiveUserId), attendanceUpdate);
      batch.update(doc(db, 'users', effectiveUserId), { updatedAt: new Date().toISOString() });
    }

    await batch.commit();

    // Real-time Notification System
    if (status === 'absent' || status === 'late') {
        const notificationData = {
            userId: effectiveUserId,
            studentId,
            title: status === 'absent' ? '🚨 إشعار غياب' : '⏳ إشعار تأخير',
            message: `نود إعلامكم بـ ${status === 'absent' ? 'غياب' : 'تأخير'} الطالب عن الدوام في حصة ${period || '1'}${reason ? ` (السبب: ${reason})` : ''}`,
            timestamp: serverTimestamp(),
            isRead: false,
            type: 'attendance_alert'
        };
        await addDoc(collection(db, 'notifications'), notificationData).catch(err => console.error("Notification save error:", err));
    }
  },

  verifyAdminAccess: async (userId: string, schoolId: string) => {
    const adminRef = doc(db, 'admins', userId);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) return false;
    const data = adminSnap.data();
    return data.schoolId === schoolId || data.role === 'super_admin';
  },

  // --- Financial & Payments ---
  getStudentDoc: async (schoolId: string, studentCode: string) => {
    const studentDocId = `${schoolId}_${studentCode}`.replace(/\s+/g, '_');
    const studentRef = doc(db, 'school_students', studentDocId);
    let studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      return { ref: studentRef, snap: studentSnap };
    }

    // Fallback: search by code
    const q = query(collection(db, 'school_students'), 
                    where('schoolId', '==', schoolId || 'unassigned'), 
                    where('code', '==', studentCode || 'unassigned'));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      return { ref: qSnap.docs[0].ref, snap: qSnap.docs[0] };
    }

    return null;
  },

  subscribeToStudentFinances: (schoolId: string, studentCode: string, callback: (finances: any) => void) => {
    const studentDocId = `${schoolId}_${studentCode}`.replace(/\s+/g, '_');
    const studentRef = doc(db, 'school_students', studentDocId);

    return onSnapshot(studentRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const installments = data.finance?.installments || data.installments || [];
        const computedTotal = installments.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
        const computedPaid = installments.filter((inst: any) => inst.paid === true || inst.status === 'paid' || inst.status === 'completed' || inst.status === 'verified' || inst.status === 'approved').reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
        
        callback({
          totalTuition: computedTotal > 0 ? computedTotal : (data.finance?.totalTuition || data.totalAmount || 0),
          paidAmount: computedTotal > 0 ? computedPaid : (data.finance?.paidAmount || data.paidAmount || 0),
          remainingAmount: computedTotal > 0 ? (computedTotal - computedPaid) : ((data.finance?.totalTuition || data.totalAmount || 0) - (data.finance?.paidAmount || data.paidAmount || 0)),
          installments: installments,
          transactions: data.finance?.transactions || []
        });
      } else {
        callback(null);
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, `school_students/${studentDocId}`, false);
      }
    });
  },

  getStudentFinances: async (schoolId: string, studentCode: string) => {
    const studentDocId = `${schoolId}_${studentCode}`.replace(/\s+/g, '_');
    const studentRef = doc(db, 'school_students', studentDocId);
    const snap = await getDoc(studentRef);
    
    if (snap.exists()) {
      const data = snap.data();
      const installments = data.finance?.installments || data.installments || [];
      const computedTotal = installments.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
      const computedPaid = installments.filter((inst: any) => inst.paid === true || inst.status === 'paid' || inst.status === 'completed' || inst.status === 'verified' || inst.status === 'approved').reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);

      return {
        totalTuition: computedTotal > 0 ? computedTotal : (data.finance?.totalTuition || data.totalAmount || 0),
        paidAmount: computedTotal > 0 ? computedPaid : (data.finance?.paidAmount || data.paidAmount || 0),
        remainingAmount: computedTotal > 0 ? (computedTotal - computedPaid) : ((data.finance?.totalTuition || data.totalAmount || 0) - (data.finance?.paidAmount || data.paidAmount || 0)),
        installments: installments,
        transactions: data.finance?.transactions || []
      };
    }
    return null;
  },

  recordParentPayment: async (schoolId: string, studentCode: string, paymentData: { amount: number, method: string, note?: string, senderName?: string, transactionDate?: string, installmentId?: string, studentNameOverride?: string }) => {
    const resolved = await academicService.getStudentDoc(schoolId, studentCode);
    if (!resolved) {
      throw new Error('لم يتم العثور على سجل الطالب لإرسال طلب الدفع');
    }
    
    const { ref: studentRef, snap: studentSnap } = resolved;
    const studentData = studentSnap.data();
    const studentName = paymentData.studentNameOverride || studentData?.name || studentCode;

    // Create a Payment Request instead of updating immediately
    const requestRef = doc(collection(db, 'payment_requests'));
    const requestData = {
      id: requestRef.id,
      schoolId,
      studentCode,
      studentId: studentCode, // For compatibility
      parentCode: studentData?.parentCode || '',
      studentName,
      amount: paymentData.amount,
      method: paymentData.method,
      senderName: paymentData.senderName || '',
      transactionDate: paymentData.transactionDate || '',
      transactionNote: paymentData.note || '',
      status: 'pending',
      installmentId: paymentData.installmentId || null,
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString()
    };

    // Mark the selected (or first unpaid) installment as 'pending' for visibility
    // (We now compute 'isPending' dynamically in UI based on pending transactions to avoiding overwriting other fields)
    
    // Perform writes in parallel
    await Promise.all([
      setDoc(requestRef, requestData),
      updateDoc(studentRef, {
        'finance.transactions': arrayUnion({
          ...requestData,
          status: 'pending'
        })
      }).catch(() => {
        // Fallback if student doc structure is somehow missing, though it shouldn't
        return setDoc(studentRef, {
          finance: {
            ...studentData?.finance,
            transactions: [...(studentData?.finance?.transactions || []), { ...requestData, status: 'pending' }]
          }
        }, { merge: true });
      }),
      // Optional: fast notification
      addDoc(collection(db, 'notifications'), {
          userId: studentData?.userId || null,
          studentId: resolved.ref.id,
          title: '⏳ طلب دفع قيد المراجعة',
          message: `تم إرسال طلب دفع بمبلغ (${paymentData.amount.toLocaleString()} د.ع) هو الآن قيد المراجعة من قبل الإدارة.`,
          timestamp: Timestamp.now(),
          isRead: false,
          type: 'payment_pending'
      }).catch(() => {})
    ]);

    return requestData;
  },

  approvePaymentRequest: async (requestId: string) => {
      // Find the student outside to avoid transaction.get query issues
      const requestRef = doc(db, 'payment_requests', requestId);
      const reqSnap = await getDoc(requestRef);
      if (!reqSnap.exists()) throw new Error('الطلب غير موجود');
      const data = reqSnap.data();
      
      const userQ = query(collection(db, 'users'), where('studentCode', '==', data.studentCode || 'unassigned'));
      const userSnaps = await getDocs(userQ);
      
      await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        
        if (!requestSnap.exists() || requestSnap.data().status !== 'pending') {
          throw new Error('الطلب غير موجود أو تمت معالجته مسبقاً');
        }
  
        const studentDocId = `${data.schoolId}_${data.studentCode}`.replace(/\s+/g, '_');
        const studentRef = doc(db, 'school_students', studentDocId);
        const schoolRef = doc(db, 'school_configs', data.schoolId);
  
        let studentSnap = await transaction.get(studentRef);
        if (!studentSnap.exists()) {
          if (userSnaps.empty) {
            throw new Error('لم يتم العثور على سجل الطالب أو المستخدم لتأكيد الدفعة');
          }
          const userDoc = userSnaps.docs[0];
          const userData = userDoc.data();
          
          // Create the missing school_student record
          transaction.set(studentRef, {
              name: userData.fullName || data.studentName,
              grade: userData.grade || 'غير محدد',
              schoolId: data.schoolId,
              code: data.studentCode,
              status: 'نشط',
              finance: { installments: [] },
              updatedAt: new Date().toISOString()
          });
          
          // re-fetch snap
          studentSnap = await transaction.get(studentRef);
        }

      const currentFinance = studentSnap.data()?.finance || {};
      const installments = currentFinance.installments || studentSnap.data()?.installments || [];
      
      // Idempotency check: Ensure this requestId hasn't been processed yet
      const alreadyProcessedIds = (currentFinance.transactions || []).map((t: any) => t.requestId);
      if (alreadyProcessedIds.includes(requestId)) {
        throw new Error('تمت معالجة هذا الطلب مسبقاً');
      }

      let amountLeft = data.amount;
      let installmentPaid = false; // Flag to ensure we only pay one per request
      let installmentPaidName = '';
      let generatedTxnId = `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const updatedInstallments = installments.map((inst: any, idx: number) => {
        const instStatus = inst.status || '';
        const isPaid = inst.paid === true || instStatus === 'paid' || instStatus === 'completed' || instStatus === 'verified' || instStatus === 'approved' || instStatus === 'verified_payment';
        
        const isTargetInstallment = data.installmentId && (inst.id === data.installmentId || idx.toString() === data.installmentId);
        const instAmount = Number(inst.amount) || 0;

        // If we haven't paid an installment yet, and this one is eligible
        if (!installmentPaid && !isPaid && (isTargetInstallment || (data.amount >= instAmount))) {
          installmentPaid = true; // Mark as paid
          installmentPaidName = inst.name || '';
          return { 
            ...inst, 
            status: 'completed', 
            paid: true, 
            paidAt: Timestamp.now(),
            transactionId: generatedTxnId
          };
        }
        return inst;
      });

      const txns = (currentFinance.transactions || []).filter((t: any) => t.id !== requestId);
      
      const newlyCalculatedPaidAmount = updatedInstallments
        .filter((inst: any) => inst.paid === true || inst.status === 'paid' || inst.status === 'completed' || inst.status === 'verified' || inst.status === 'approved' || inst.status === 'verified_payment')
        .reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);

      transaction.update(studentRef, {
        'finance.paidAmount': newlyCalculatedPaidAmount,
        'finance.transactions': [...txns, { 
           id: generatedTxnId,
           requestId: requestId,
           amount: data.amount,
           method: data.method,
           note: data.transactionNote || installmentPaidName || 'قسط الكتروني',
           timestamp: Timestamp.now(),
           status: 'completed'
        }],
        'finance.lastPaymentDate': Timestamp.now(),
        'finance.installments': updatedInstallments,
        'installments': updatedInstallments,
        'paidAmount': newlyCalculatedPaidAmount,
        'updatedAt': new Date().toISOString()
      });

      transaction.update(schoolRef, {
        'stats.totalRevenue': increment(data.amount),
        'stats.todayRevenue': increment(data.amount)
      });

      transaction.update(requestRef, {
        status: 'approved',
        approvedAt: Timestamp.now()
      });

      // 10. Create notification for parent
      const notificationRef = doc(collection(db, 'notifications'));
      transaction.set(notificationRef, {
          userId: studentSnap.data().userId || null,
          studentId: data.studentCode,
          title: '✅ تم تأكيد الدفعة المادية',
          message: `تم الموافقة على طلب الدفع بقيمة (${data.amount.toLocaleString()} د.ع) وتحديث سجل الطالب بنجاح.`,
          timestamp: Timestamp.now(),
          isRead: false,
          type: 'payment_approved'
      });

      logActivity({
        action: 'تأكيد دفعة مالية',
        details: `تم تأكيد وصل دفع بمبلغ ${data.amount.toLocaleString()} د.ع للطالب: ${data.studentName}`,
        targetId: data.studentCode,
        targetType: 'finance_payment'
      });
    });
  },

  rejectPaymentRequest: async (requestId: string, reason: string) => {
    const requestRef = doc(db, 'payment_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;

    const data = requestSnap.data();
    const resolved = await academicService.getStudentDoc(data.schoolId, data.studentCode);
    if (!resolved) return;

    const { ref: studentRef, snap: studentSnap } = resolved;
    const batch = writeBatch(db);

    // Update Student Transactions (remove/mark rejected)
    const txns = (studentSnap.data()?.finance?.transactions || []).map((t: any) => {
      if (t.id === requestId) return { ...t, status: 'rejected', rejectReason: reason, reason: reason };
      return t;
    });

    batch.set(studentRef, { 
      'finance': {
        ...studentSnap.data()?.finance,
        transactions: txns
      }
    }, { merge: true });
    batch.update(requestRef, { status: 'rejected', rejectReason: reason, rejectedAt: Timestamp.now() });

    // 4. Create notification for parent
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, {
        userId: studentSnap.data()?.userId || null,
        studentId: data.studentCode,
        title: '❌ رفض طلب الدفع',
        message: `تم رفض طلب الدفع بقيمة (${data.amount.toLocaleString()} د.ع). السبب: ${reason}`,
        timestamp: Timestamp.now(),
        isRead: false,
        type: 'payment_rejected'
    });

    await batch.commit();

    logActivity({
      action: 'رفض دفعة مالية',
      details: `تم رفض وصل الدفع للطالب: ${data.studentName}. السبب: ${reason}`,
      targetId: data.studentCode,
      targetType: 'finance_payment'
    });
  },

  deletePaymentRequest: async (requestId: string) => {
    const requestRef = doc(db, 'payment_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;

    const data = requestSnap.data();
    
    await deleteDoc(requestRef);
    
    logActivity({
      action: 'حذف طلب دفع',
      details: `تم حذف طلب الدفع الخاص بالطالب: ${data.studentName}`,
      targetId: data.studentCode,
      targetType: 'finance_payment'
    });
  },

  cleanupOrphanedPaymentRequests: async () => {
    const q = query(collection(db, 'payment_requests'), where('status', '==', 'pending'));
    const snaps = await getDocs(q);
    const batch = writeBatch(db);
    let deletedCount = 0;

    for (const docSnap of snaps.docs) {
      const data = docSnap.data();
      // Try both possible doc ID formats
      const studentDocId = `${data.schoolId}_${data.studentCode}`.replace(/\s+/g, '_');
      const studentRef = doc(db, 'school_students', studentDocId);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        batch.delete(docSnap.ref);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await batch.commit();
      logActivity({
        action: 'تنظيف طلبات الدفع',
        details: `تم حذف ${deletedCount} طلب دفع خاص بطلاب محذوفين.`,
        targetId: 'system',
        targetType: 'finance_payment'
      });
    }
    return deletedCount;
  },

  cleanupResolvedPaymentRequests: async () => {
    const q = query(collection(db, 'payment_requests'), where('status', 'in', ['approved', 'rejected']));
    const snaps = await getDocs(q);
    const batch = writeBatch(db);
    let deletedCount = 0;

    for (const docSnap of snaps.docs) {
      batch.delete(docSnap.ref);
      deletedCount++;
    }
    
    if (deletedCount > 0) {
      await batch.commit();
      logActivity({
        action: 'تنظيف طلبات الدفع المستكمله',
        details: `تم حذف ${deletedCount} طلب دفع (مؤكد ومرفوض).`,
        targetId: 'system',
        targetType: 'finance_payment'
      });
    }
    return deletedCount;
  },

  subscribeToSchoolSettings: (schoolId: string, callback: (settings: any) => void) => {
    return onSnapshot(doc(db, 'school_configs', schoolId), (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback(null); // No settings yet
      }
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, `school_configs/${schoolId}`, false);
      }
    });
  },

  getSchoolSettings: async (schoolId: string) => {
    const docRef = doc(db, 'school_configs', schoolId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  },

  updateSchoolSettings: async (schoolId: string, settings: any) => {
    const docRef = doc(db, 'school_configs', schoolId);
    await updateDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    }).catch(async (err) => {
      // If doc doesn't exist, create it
      if (err.code === 'not-found') {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, {
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        throw err;
      }
    });
  }
};
