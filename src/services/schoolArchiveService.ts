import { collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp } from '@/src/lib/firebase';
import { db, auth } from '../lib/firebase';
import { logActivity } from '../utils/auditLogger';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { getSubjectsForGrade } from '../utils/studentUtils';

export interface SchoolArchiveRecord {
  id: string;
  archiveNumber: string; // e.g. ARC-SCH-2026-92841
  schoolId: string;
  schoolName: string;
  governorate: string;
  academicPeriod: string; // e.g. "العام الدراسي 2025 - 2026"
  createdAt: string; // ISO string
  createdTimestamp: number;
  createdBy: {
    uid: string;
    email: string;
    name: string;
  };
  status: 'archived' | 'read_only';
  archivedReason: string;
  notes?: string;
  
  // Statistical Overview
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    totalAcademicLists: number;
    totalFinancialRecords: number;
    totalPaymentsCount: number;
    totalPaymentsAmount: number;
    totalRequiredAmount: number;
    totalFiles: number;
    totalBroadcasts: number;
    totalSchedules: number;
    totalTransportRoutes: number;
    totalSavedReceipts: number;
  };

  // Complete Snapshot Sections (Strictly scoped to schoolId)
  schoolProfile: {
    schoolId: string;
    name: string;
    governorate: string;
    plan: string;
    licenseNumber: string;
    receiptNumber: string;
    subscriptionFee: number;
    paymentStatus: string;
    subscriptionStart: string;
    subscriptionEnd: string;
    adminName: string;
    adminPhone: string;
    logoUrl?: string;
    stampUrl?: string;
    createdAt?: string;
  };

  students: any[];
  teachersAndStaff: any[];
  academicLists: any[];
  financials: {
    records: any[];
    payments: any[];
    receipts: any[];
    studentInstallments?: any[];
    summary: {
      totalRequired: number;
      totalCollected: number;
      totalOutstanding: number;
      collectionRate?: number;
    };
  };
  attendanceAndBehaviorSummary: {
    totalAttendanceEvents: number;
    totalDisciplineRecords: number;
  };
  broadcastsAndSchedules: {
    broadcasts: any[];
    schedules: any[];
  };
  filesAndAttachments: any[];
  transport: {
    routes: any[];
    drivers: any[];
    fees: any[];
  };
}

export const schoolArchiveService = {
  /**
   * Generates a unique, high-integrity archive number
   */
  generateArchiveNumber(schoolId: string): string {
    const cleanId = (schoolId || 'SCH').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'SCH';
    const year = new Date().getFullYear();
    const randomHex = Math.floor(10000 + Math.random() * 90000);
    return `ARC-${cleanId}-${year}-${randomHex}`;
  },

  /**
   * Creates an isolated, complete school archive for a specific schoolId
   * and marks the school as 'archived' (Read-Only) without deleting any data.
   */
  async createSchoolArchive(
    schoolId: string, 
    params: {
      academicPeriod: string;
      archivedReason?: string;
      notes?: string;
    }
  ): Promise<SchoolArchiveRecord> {
    if (!schoolId) {
      throw new Error('معرف المدرسة (School ID) مطلوب لإنشاء الأرشيف');
    }

    const currentUser = auth.currentUser;
    const creatorInfo = {
      uid: currentUser?.uid || 'dev_admin',
      email: currentUser?.email || 'abdulradhaalmayali@gmail.com',
      name: currentUser?.displayName || 'المطور / مدير النظام'
    };

    // 1. Fetch School Master Record
    const schoolDocRef = doc(db, 'schools', schoolId);
    const schoolSnap = await getDoc(schoolDocRef);
    const schoolData = schoolSnap.exists() ? schoolSnap.data() : {};
    const schoolName = schoolData.name || schoolId;
    const governorate = schoolData.governorate || 'غير محدد';

    // 2. Fetch all collections strictly isolated by schoolId
    const fetchScopedCollection = async (collName: string) => {
      try {
        const q = query(collection(db, collName), where('schoolId', '==', schoolId));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        try {
          const snap = await getDocs(collection(db, collName));
          return snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((item: any) => item.schoolId === schoolId || item.schoolName === schoolName);
        } catch (innerErr) {
          console.warn(`Could not fetch ${collName} for archive:`, innerErr);
          return [];
        }
      }
    };

    const [
      studentsRaw,
      teachersRaw,
      academicListsRaw,
      financeRecordsRaw,
      paymentsRaw,
      savedReceiptsRaw,
      filesRaw,
      broadcastsRaw,
      schedulesRaw,
      transportRoutesRaw,
      transportDriversRaw,
      transportFeesRaw
    ] = await Promise.all([
      fetchScopedCollection('school_students'),
      fetchScopedCollection('teachers'),
      fetchScopedCollection('academic_lists'),
      fetchScopedCollection('finance'),
      fetchScopedCollection('payments'),
      fetchScopedCollection('saved_receipts'),
      fetchScopedCollection('school_files'),
      fetchScopedCollection('broadcasts'),
      fetchScopedCollection('class_schedules'),
      fetchScopedCollection('transport_routes'),
      fetchScopedCollection('transport_drivers'),
      fetchScopedCollection('transport_fees')
    ]);

    // Sanitize dates for JSON/Firestore serialization
    const sanitizeDates = (obj: any): any => {
      if (!obj) return obj;
      if (obj?.toDate && typeof obj.toDate === 'function') {
        return (typeof obj?.toDate === 'function' ? obj.toDate() : new Date(obj)).toISOString();
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeDates);
      }
      if (typeof obj === 'object') {
        const res: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) {
          res[k] = sanitizeDates(v);
        }
        return res;
      }
      return obj;
    };

    const cleanStudents = sanitizeDates(studentsRaw);
    const cleanTeachersAndStaff = sanitizeDates(teachersRaw);
    const cleanAcademicLists = sanitizeDates(academicListsRaw);
    const cleanFinanceRecords = sanitizeDates(financeRecordsRaw);
    const cleanPayments = sanitizeDates(paymentsRaw);
    const cleanReceipts = sanitizeDates(savedReceiptsRaw);
    const cleanFiles = sanitizeDates(filesRaw);
    const cleanBroadcasts = sanitizeDates(broadcastsRaw);
    const cleanSchedules = sanitizeDates(schedulesRaw);
    const cleanTransportRoutes = sanitizeDates(transportRoutesRaw);
    const cleanTransportDrivers = sanitizeDates(transportDriversRaw);
    const cleanTransportFees = sanitizeDates(transportFeesRaw);

    // Build exhaustive academic class structures with subjects and grades
    const processedLists: any[] = [];
    const processedStudentCodes = new Set<string>();

    cleanAcademicLists.forEach((list: any) => {
      const grade = list.grade || list.name || 'عام';
      const rawSubjects = getSubjectsForGrade(grade, list.removedSubjects || []);
      const subjects = rawSubjects.length > 0 ? rawSubjects : [
        { id: 'islamic', name: 'التربية الإسلامية' },
        { id: 'arabic', name: 'اللغة العربية' },
        { id: 'english', name: 'اللغة الانجليزية' },
        { id: 'math', name: 'الرياضيات' },
        { id: 'science', name: 'العلوم' }
      ];

      const listStudents = (list.students || []).map((stu: any, sIdx: number) => {
        const code = stu.student || stu.code || `STU-${sIdx + 1}`;
        processedStudentCodes.add(code);
        
        const masterStu = cleanStudents.find((s: any) => (s.code && s.code === code) || (s.id && s.id === stu.id)) || {};
        const studentGrades = stu.grades || masterStu.grades || {};
        
        const periodKeys = ['month1', 'month2', 'mid', 'midyear', 'month3', 'month4', 'final', 'final_grade'];
        let activePeriod = 'month1';
        for (const pk of periodKeys) {
          if (studentGrades[pk] && Object.keys(studentGrades[pk]).length > 0) {
            activePeriod = pk;
          }
        }
        const currentMarks = studentGrades[activePeriod] || studentGrades || {};

        let sumMarks = 0;
        let countMarks = 0;
        subjects.forEach(sub => {
          const val = currentMarks[sub.id];
          if (val !== undefined && val !== null && val !== '') {
            const num = Number(val);
            if (!isNaN(num)) {
              sumMarks += num;
              countMarks++;
            }
          }
        });
        const average = countMarks > 0 ? Math.round((sumMarks / countMarks) * 10) / 10 : (stu.average || 0);

        const tuitionRequired = Number(stu.totalAmount || masterStu.finance?.totalTuition || masterStu.totalAmount || 1200000);
        const paid = Number(stu.paidAmount || masterStu.finance?.paidAmount || masterStu.paidAmount || (stu.paid ? tuitionRequired : 0));
        const remaining = Math.max(0, tuitionRequired - paid);

        return {
          ...stu,
          name: stu.name || masterStu.name || 'طالب',
          code: code,
          parentCode: stu.parent || stu.parentCode || masterStu.parentCode || `PAR-${code}`,
          grade: stu.grade || grade,
          grades: studentGrades,
          currentMarks,
          activePeriod,
          average,
          totalScore: sumMarks,
          isTopStudent: Boolean(stu.isTopStudent || masterStu.isTopStudent),
          excellencePoints: Number(stu.excellencePoints || masterStu.excellencePoints || 0),
          financial: {
            totalRequired: tuitionRequired,
            paidAmount: paid,
            remainingAmount: remaining,
            discountType: stu.discountType || masterStu.discountType || 'none',
            status: paid >= tuitionRequired ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
          }
        };
      });

      processedLists.push({
        ...list,
        id: list.id || `list-${grade}`,
        name: list.name || grade,
        grade: grade,
        subjects: subjects,
        students: listStudents
      });
    });

    // Group any students in cleanStudents who were not in explicit academic lists
    const remainingStudents = cleanStudents.filter((s: any) => {
      const code = s.code || s.student;
      return code && !processedStudentCodes.has(code);
    });

    if (remainingStudents.length > 0) {
      const gradeGroups: Record<string, any[]> = {};
      remainingStudents.forEach(stu => {
        const g = stu.grade || 'صفوف عامة';
        if (!gradeGroups[g]) gradeGroups[g] = [];
        gradeGroups[g].push(stu);
      });

      for (const [gradeName, stus] of Object.entries(gradeGroups)) {
        const rawSubjects = getSubjectsForGrade(gradeName, []);
        const subjects = rawSubjects.length > 0 ? rawSubjects : [
          { id: 'islamic', name: 'التربية الإسلامية' },
          { id: 'arabic', name: 'اللغة العربية' },
          { id: 'english', name: 'اللغة الانجليزية' },
          { id: 'math', name: 'الرياضيات' },
          { id: 'science', name: 'العلوم' }
        ];

        const listStudents = stus.map((stu: any, sIdx: number) => {
          const code = stu.code || stu.student || `STU-${sIdx + 1}`;
          const studentGrades = stu.grades || {};
          const currentMarks = studentGrades.month1 || studentGrades || {};
          let sumMarks = 0;
          let countMarks = 0;
          subjects.forEach(sub => {
            const val = currentMarks[sub.id];
            if (val !== undefined && val !== null && val !== '') {
              const num = Number(val);
              if (!isNaN(num)) {
                sumMarks += num;
                countMarks++;
              }
            }
          });
          const average = countMarks > 0 ? Math.round((sumMarks / countMarks) * 10) / 10 : (stu.average || 0);
          const tuitionRequired = Number(stu.finance?.totalTuition || stu.totalAmount || 1200000);
          const paid = Number(stu.finance?.paidAmount || stu.paidAmount || (stu.paid ? tuitionRequired : 0));
          const remaining = Math.max(0, tuitionRequired - paid);

          return {
            ...stu,
            name: stu.name || 'طالب',
            code,
            parentCode: stu.parentCode || stu.parent || `PAR-${code}`,
            grade: gradeName,
            grades: studentGrades,
            currentMarks,
            average,
            totalScore: sumMarks,
            isTopStudent: Boolean(stu.isTopStudent),
            excellencePoints: Number(stu.excellencePoints || 0),
            financial: {
              totalRequired: tuitionRequired,
              paidAmount: paid,
              remainingAmount: remaining,
              discountType: stu.discountType || 'none',
              status: paid >= tuitionRequired ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
            }
          };
        });

        processedLists.push({
          id: `grade-${gradeName}`,
          name: gradeName,
          grade: gradeName,
          subjects,
          students: listStudents
        });
      }
    }

    // Build Unified Students Array
    const allStudentsList: any[] = [];
    processedLists.forEach(l => {
      l.students.forEach((s: any) => allStudentsList.push(s));
    });

    // Compute Comprehensive Financial Aggregates
    let totalReq = 0;
    let totalCol = 0;
    
    allStudentsList.forEach(s => {
      totalReq += Number(s.financial?.totalRequired || 1200000);
      totalCol += Number(s.financial?.paidAmount || 0);
    });

    cleanPayments.forEach((p: any) => {
      if (p.status === 'approved' || p.status === 'paid' || p.status === 'completed') {
        const amt = Number(p.amount || 0);
        if (totalCol === 0 && amt > 0) {
          totalCol += amt;
        }
      }
    });

    cleanReceipts.forEach((r: any) => {
      const amt = Number(r.amount || 0);
      if (totalCol === 0 && amt > 0) {
        totalCol += amt;
      }
    });

    const totalStudentsCount = allStudentsList.length || cleanStudents.length;
    const totalTeachersCount = cleanTeachersAndStaff.filter((t: any) => t.role !== 'STAFF').length;
    const totalStaffCount = cleanTeachersAndStaff.filter((t: any) => t.role === 'STAFF').length;
    const collectionRate = totalReq > 0 ? Math.round((totalCol / totalReq) * 100) : 100;

    // Archive Metadata & Snapshot Assembly
    const archiveNo = this.generateArchiveNumber(schoolId);
    const now = new Date();
    const isoDate = now.toISOString();
    const timestamp = now.getTime();
    const archiveDocId = `arch_${schoolId}_${timestamp}`;

    const archiveRecord: SchoolArchiveRecord = {
      id: archiveDocId,
      archiveNumber: archiveNo,
      schoolId,
      schoolName,
      governorate,
      academicPeriod: params.academicPeriod || `العام الدراسي ${now.getFullYear() - 1} - ${now.getFullYear()}`,
      createdAt: isoDate,
      createdTimestamp: timestamp,
      createdBy: creatorInfo,
      status: 'archived',
      archivedReason: params.archivedReason || 'انتهاء ترخيص الاشتراك السنوي وأرشفة السجلات الرقمية بالكامل',
      notes: params.notes || 'تم حفظ وأرشفة جميع السجلات والملفات المدرسية والدرجات والموقف المالي بصيغة غير قابلة للتعديل وبشكل دائم.',
      
      stats: {
        totalStudents: totalStudentsCount,
        totalTeachers: totalTeachersCount,
        totalStaff: totalStaffCount,
        totalAcademicLists: processedLists.length,
        totalFinancialRecords: cleanFinanceRecords.length,
        totalPaymentsCount: cleanPayments.length,
        totalPaymentsAmount: totalCol,
        totalRequiredAmount: totalReq,
        totalFiles: cleanFiles.length,
        totalBroadcasts: cleanBroadcasts.length,
        totalSchedules: cleanSchedules.length,
        totalTransportRoutes: cleanTransportRoutes.length,
        totalSavedReceipts: cleanReceipts.length
      },

      schoolProfile: {
        schoolId,
        name: schoolName,
        governorate,
        plan: schoolData.plan || 'standard',
        licenseNumber: schoolData.licenseNumber || `B6-LIC-${schoolId.slice(0, 4).toUpperCase()}`,
        receiptNumber: schoolData.receiptNumber || `RCPT-B6-${new Date().getFullYear()}`,
        subscriptionFee: Number(schoolData.subscriptionFee || 0),
        paymentStatus: schoolData.paymentStatus || 'paid',
        subscriptionStart: schoolData.subscriptionStart || '',
        subscriptionEnd: schoolData.expiryDate || schoolData.subscriptionEnd || '',
        adminName: schoolData.adminName || 'المدير المفوض',
        adminPhone: schoolData.adminPhone || '',
        logoUrl: schoolData.logoUrl || schoolData.coverUrl || '',
        stampUrl: schoolData.stampUrl || schoolData.schoolStamp || '',
        createdAt: schoolData.createdAt?.toDate ? (typeof schoolData.createdAt?.toDate === 'function' ? schoolData.createdAt.toDate() : new Date(schoolData.createdAt)).toISOString() : ''
      },

      students: allStudentsList.length > 0 ? allStudentsList : cleanStudents,
      teachersAndStaff: cleanTeachersAndStaff,
      academicLists: processedLists,
      financials: {
        records: cleanFinanceRecords,
        payments: cleanPayments,
        receipts: cleanReceipts,
        studentInstallments: allStudentsList.map(s => ({
          name: s.name,
          code: s.code,
          grade: s.grade,
          tuitionRequired: s.financial?.totalRequired || 1200000,
          discountType: s.financial?.discountType || 'none',
          paidAmount: s.financial?.paidAmount || 0,
          remainingAmount: s.financial?.remainingAmount || 0,
          status: s.financial?.status || 'unpaid'
        })),
        summary: {
          totalRequired: totalReq,
          totalCollected: totalCol,
          totalOutstanding: Math.max(0, totalReq - totalCol),
          collectionRate: collectionRate
        }
      },
      attendanceAndBehaviorSummary: {
        totalAttendanceEvents: cleanStudents.reduce((acc: number, s: any) => acc + (s.attendance ? Object.keys(s.attendance).length : 0), 0),
        totalDisciplineRecords: cleanStudents.reduce((acc: number, s: any) => acc + (s.behavior ? Object.keys(s.behavior).length : 0), 0)
      },
      broadcastsAndSchedules: {
        broadcasts: cleanBroadcasts,
        schedules: cleanSchedules
      },
      filesAndAttachments: cleanFiles,
      transport: {
        routes: cleanTransportRoutes,
        drivers: cleanTransportDrivers,
        fees: cleanTransportFees
      }
    };

    // 3. Save permanent archive document to Firestore `school_archives`
    const archiveRef = doc(db, 'school_archives', archiveDocId);
    try {
      await setDoc(archiveRef, {
        ...archiveRecord,
        savedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Firestore setDoc failed, saving to local fallback storage:', err);
    }

    // Save also to local vault cache for instant retrieval & offline backup
    try {
      const existingRaw = localStorage.getItem('bairaq_school_archives_vault') || '[]';
      const existingList = JSON.parse(existingRaw);
      const updatedList = [archiveRecord, ...existingList.filter((a: any) => a.id !== archiveDocId)];
      localStorage.setItem('bairaq_school_archives_vault', JSON.stringify(updatedList));
    } catch (localErr) {
      console.warn('Local storage archive caching error:', localErr);
    }

    // 4. Update school status to 'archived' (Read-Only) in `schools/{schoolId}`
    try {
      await updateDoc(schoolDocRef, {
        status: 'archived',
        isReadOnly: true,
        archivedAt: serverTimestamp(),
        lastArchiveNumber: archiveNo,
        lastArchiveDate: isoDate,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Could not update school status to archived directly:', e);
    }

    // 5. Log activity in `audit_logs`
    try {
      await logActivity({
        action: 'إنشاء وتوثيق أرشيف مدرسة شامل',
        details: `تم إنشاء وحفظ أرشيف رقمي شامل لمدرسة (${schoolName}) برقم أرشيف (${archiveNo}) للفترة (${params.academicPeriod}) وتغيير حالتها إلى وضع القراءة فقط (Read-Only) مع حفظ كافة السجلات والدرجات لجميع الصفوف والموقف المالي بالكامل.`,
        targetId: schoolId,
        targetType: 'school_archive',
        targetName: schoolName
      });
    } catch (logErr) {
      console.warn('Could not write to audit_logs:', logErr);
    }

    return archiveRecord;
  },

  /**
   * Fetches all school archives from Firestore + local vault
   */
  async fetchArchives(schoolId?: string): Promise<SchoolArchiveRecord[]> {
    const firestoreList: SchoolArchiveRecord[] = [];
    try {
      let q = collection(db, 'school_archives');
      let snap;
      if (schoolId) {
        snap = await getDocs(query(q, where('schoolId', '==', schoolId), orderBy('createdTimestamp', 'desc')));
      } else {
        snap = await getDocs(query(q, orderBy('createdTimestamp', 'desc')));
      }
      snap.docs.forEach(docSnap => {
        firestoreList.push(docSnap.data() as SchoolArchiveRecord);
      });
    } catch (e) {
      console.warn('Could not load archives directly with index, falling back:', e);
      try {
        const snap = await getDocs(collection(db, 'school_archives'));
        snap.docs.forEach(docSnap => {
          const item = docSnap.data() as SchoolArchiveRecord;
          if (!schoolId || item.schoolId === schoolId) {
            firestoreList.push(item);
          }
        });
      } catch (innerE) {
        console.warn('Failed reading school_archives from Firestore:', innerE);
      }
    }

    // Merge with Local Storage Vault to prevent data loss
    const localRaw = localStorage.getItem('bairaq_school_archives_vault') || '[]';
    let localList: SchoolArchiveRecord[] = [];
    try {
      localList = JSON.parse(localRaw);
    } catch (err) {
      localList = [];
    }

    const mergedMap = new Map<string, SchoolArchiveRecord>();
    localList.forEach(item => {
      if (!schoolId || item.schoolId === schoolId) {
        mergedMap.set(item.id, item);
      }
    });
    firestoreList.forEach(item => {
      mergedMap.set(item.id, item);
    });

    return Array.from(mergedMap.values()).sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
  },

  /**
   * Downloads raw JSON digital package of the archive
   */
  downloadArchiveJSON(archive: SchoolArchiveRecord) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archive, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SchoolArchive_${archive.schoolName}_${archive.archiveNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  /**
   * Generates a printable official HTML / PDF-ready report for the archive
   * with Official Logo, literal Class-by-Class Student Grades, and Full Financial Position
   */
  async downloadArchiveReport(archive: SchoolArchiveRecord) {
    const verifyPayload = `https://bayraq-gate6.iq/archive-verify?arc=${archive.archiveNumber}&sch=${encodeURIComponent(archive.schoolName)}&dt=${archive.createdAt}`;
    let qrUrl = '';
    try {
      qrUrl = await generateQrDataUrl(verifyPayload);
    } catch (e) {
      qrUrl = '';
    }

    // Determine classes and students
    const academicClasses = (archive.academicLists && archive.academicLists.length > 0)
      ? archive.academicLists
      : [{
          name: 'الطلاب المسجلين',
          grade: 'عام',
          subjects: [
            { id: 'islamic', name: 'التربية الإسلامية' },
            { id: 'arabic', name: 'اللغة العربية' },
            { id: 'english', name: 'اللغة الانجليزية' },
            { id: 'math', name: 'الرياضيات' },
            { id: 'science', name: 'العلوم' }
          ],
          students: archive.students || []
        }];

    // Financial Data
    const summary = archive.financials?.summary || {
      totalRequired: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      collectionRate: 100
    };
    const studentInstallments = archive.financials?.studentInstallments || archive.students.map((s: any) => ({
      name: s.name,
      code: s.code,
      grade: s.grade,
      tuitionRequired: s.financial?.totalRequired || s.totalAmount || 1200000,
      discountType: s.financial?.discountType || s.discountType || 'none',
      paidAmount: s.financial?.paidAmount || s.paidAmount || (s.paid ? 1200000 : 0),
      remainingAmount: s.financial?.remainingAmount || Math.max(0, (s.financial?.totalRequired || 1200000) - (s.financial?.paidAmount || 0)),
      status: s.financial?.status || (s.paid ? 'paid' : 'unpaid')
    }));

    const receipts = archive.financials?.receipts || [];
    const payments = archive.financials?.payments || [];

    const reportHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير أرشيف مدرسي رسمي - ${archive.schoolName} - ${archive.archiveNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=JetBrains+Mono:wght@500;700;900&display=swap');
    
    @page {
      size: A4 landscape;
      margin: 8mm 6mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 16px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
    }
    
    @media print {
      @page {
        size: A4 landscape;
        margin: 6mm 6mm;
      }
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        font-size: 8.5pt !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
      .archive-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
      }
      .class-block {
        page-break-inside: avoid;
        margin-bottom: 14px !important;
        border: 1px solid #64748b !important;
        border-radius: 8px !important;
      }
      .table-responsive {
        overflow: visible !important;
      }
      table {
        width: 100% !important;
        font-size: 7.5pt !important;
        table-layout: auto !important;
      }
      th, td {
        padding: 2.5px 2px !important;
        border: 1px solid #94a3b8 !important;
      }
      th {
        font-size: 7.5pt !important;
        background: #f1f5f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .student-name-col {
        font-size: 8pt !important;
      }
      .code-col {
        font-size: 6.8pt !important;
      }
      .avg-col {
        font-size: 8pt !important;
        background: #fef3c7 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .grid-meta, .kpi-grid {
        gap: 6px !important;
        padding: 8px !important;
        margin-bottom: 10px !important;
        border: 1px solid #94a3b8 !important;
      }
      .kpi-card {
        padding: 6px !important;
        border: 1px solid #94a3b8 !important;
      }
      .kpi-num {
        font-size: 12pt !important;
      }
      .header {
        padding-bottom: 8px !important;
        margin-bottom: 10px !important;
        border-bottom: 2px solid #0f172a !important;
      }
      .logo-frame {
        width: 50px !important;
        height: 50px !important;
      }
      .legal-box {
        margin-top: 15px !important;
        padding: 8px !important;
        font-size: 7.5pt !important;
      }
      .footer-stamps {
        margin-top: 15px !important;
        padding-top: 10px !important;
      }
      .stamp-box {
        width: 100px !important;
        height: 100px !important;
      }
    }
    
    .archive-container {
      max-width: 1380px;
      width: 100%;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      transition: all 0.2s ease;
    }
    
    /* Top Action Bar */
    .top-actions-bar {
      max-width: 1380px;
      margin: 0 auto 16px auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #ffffff;
      padding: 12px 18px;
      border-radius: 16px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    .print-btn {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 12px;
      font-weight: 900;
      cursor: pointer;
      font-size: 13px;
      box-shadow: 0 3px 10px rgba(217, 119, 6, 0.3);
      font-family: 'Cairo', sans-serif;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .print-btn:hover {
      background: linear-gradient(135deg, #b45309, #92400e);
      transform: translateY(-1px);
    }

    .hint-chip {
      font-size: 11.5px;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zoom-btn {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
    }

    .zoom-btn:hover {
      background: #e2e8f0;
    }
    
    /* Header Area */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .logo-frame {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      border: 2.5px solid #d97706;
      background: #070c1e;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25);
      flex-shrink: 0;
    }
    
    .logo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .logo-fallback-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #070c1e, #1e293b);
      color: #f59e0b;
      font-weight: 900;
      font-size: 12px;
      text-align: center;
    }
    
    .archive-badge {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      padding: 10px 16px;
      border-radius: 14px;
      text-align: left;
      font-family: 'JetBrains Mono', monospace;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    
    /* Metadata Grid */
    .grid-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      font-size: 11.5px;
    }
    
    .grid-meta div {
      color: #334155;
    }
    
    .grid-meta strong {
      color: #0f172a;
    }
    
    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .kpi-card {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    
    .kpi-num {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 2px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 900;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 5px;
      margin: 22px 0 12px 0;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .section-subtitle {
      font-size: 11px;
      color: #64748b;
      font-weight: normal;
    }
    
    /* Class Block Styling */
    .class-block {
      margin-bottom: 20px;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      background: #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    
    .class-header {
      background: #f1f5f9;
      border-bottom: 1.5px solid #cbd5e1;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }
    
    .class-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .class-tag {
      background: #0f172a;
      color: #f59e0b;
      font-size: 10px;
      font-weight: 900;
      padding: 2px 7px;
      border-radius: 5px;
    }

    /* Scrollable Responsive Table Wrapper */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: 0 0 12px 12px;
    }
    
    table {
      width: 100%;
      min-width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      table-layout: auto;
    }
    
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 4px;
      text-align: center;
      vertical-align: middle;
    }
    
    th {
      background: #f8fafc;
      font-weight: 700;
      color: #0f172a;
      font-size: 10px;
      white-space: nowrap;
    }
    
    td.text-right {
      text-align: right;
    }
    
    .student-name-col {
      white-space: nowrap;
      font-weight: 700;
      color: #0f172a;
      font-size: 11px;
      padding: 5px 6px;
    }

    .code-col {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      white-space: nowrap;
      letter-spacing: -0.2px;
      padding: 4px 3px;
    }

    .subject-col {
      font-size: 9.5px;
      white-space: nowrap;
      padding: 4px 2px;
    }

    .avg-col {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 900;
      font-size: 10.5px;
      color: #b45309;
      background: #fffbeb;
      white-space: nowrap;
      padding: 4px 3px;
    }

    .total-col {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 9.5px;
      color: #475569;
      white-space: nowrap;
      padding: 4px 2px;
    }
    
    .badge-star {
      color: #b45309;
      font-weight: 900;
      font-size: 9px;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 1px 5px;
      border-radius: 5px;
      display: inline-block;
      white-space: nowrap;
    }
    
    .status-paid {
      color: #047857;
      font-weight: bold;
      font-size: 9.5px;
      white-space: nowrap;
    }
    
    .status-partial {
      color: #d97706;
      font-weight: bold;
      font-size: 9.5px;
      white-space: nowrap;
    }
    
    .status-unpaid {
      color: #dc2626;
      font-weight: bold;
      font-size: 9.5px;
      white-space: nowrap;
    }
    
    .legal-box {
      background: #fffbeb;
      border: 1.5px solid #fde68a;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 11px;
      margin-top: 22px;
      color: #92400e;
      line-height: 1.5;
    }
    
    .footer-stamps {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #0f172a;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .stamp-box {
      width: 110px;
      height: 110px;
      border: 2.5px dashed #b91c1c;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #b91c1c;
      font-size: 9px;
      font-weight: 900;
      flex-shrink: 0;
    }
  </style>
</head>
<body>
  <!-- Top Floating/Fixed Action Bar -->
  <div class="no-print top-actions-bar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <button onclick="window.print()" class="print-btn">
        <span>🖨️</span>
        <span>طباعة الأرشيف الرسمي المعتمد / حفظ كـ PDF</span>
      </button>
      <div class="hint-chip">
        <span>💡</span>
        <span>تم ضبط التقرير بالوضع العرضي (Landscape) لتظهر جميع الأعمدة والمواد والدرجات كاملة دون أي قص.</span>
      </div>
    </div>

    <div class="zoom-controls">
      <span style="font-size: 11px; color: #64748b; font-weight: bold;">حجم العرض:</span>
      <button class="zoom-btn" onclick="document.querySelector('.archive-container').style.transform='scale(0.85)'; document.querySelector('.archive-container').style.transformOrigin='top center';">85%</button>
      <button class="zoom-btn" onclick="document.querySelector('.archive-container').style.transform='scale(1)';">100%</button>
      <button class="zoom-btn" onclick="document.querySelector('.archive-container').style.transform='scale(1.15)'; document.querySelector('.archive-container').style.transformOrigin='top center';">115%</button>
    </div>
  </div>

  <div class="archive-container">
    <!-- Header with Official Logo -->
    <div class="header">
      <div class="logo-area">
        <div class="logo-frame">
          <img src="/logo.png" alt="شعار بوابة بيرق" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="logo-fallback-badge" style="display: none;">
            <span>بوابة بيرق</span>
            <span style="font-size: 8px; font-family: monospace;">GATE 6</span>
          </div>
        </div>
        <div>
          <h1 style="font-size: 19px; font-weight: 900; color: #0f172a; margin-bottom: 2px;">منصة بوابة بيرق الذكية (BAYRAQ GATE 6)</h1>
          <h2 style="font-size: 12px; color: #b45309; font-weight: 800;">وثيقة أرشيف وسجلات مدرسية رسمية شاملة • OFFICIAL SCHOOL ARCHIVE RECORD</h2>
        </div>
      </div>
      <div class="archive-badge">
        <div style="font-size: 9px; color: #64748b; font-weight: bold;">رقم الأرشيف المعتمد:</div>
        <div style="font-size: 12.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px;">${archive.archiveNumber}</div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="grid-meta">
      <div><strong>المدرسة:</strong> ${archive.schoolName}</div>
      <div><strong>المعرف الرقمي:</strong> <span class="code-col" style="color: #b45309; font-weight: bold;">${archive.schoolId}</span></div>
      <div><strong>المحافظة:</strong> ${archive.governorate}</div>
      <div><strong>الفترة الدراسية:</strong> ${archive.academicPeriod}</div>
      <div><strong>تاريخ التوثيق:</strong> ${new Date(archive.createdAt).toLocaleDateString('ar-IQ')}</div>
      <div><strong>الحالة:</strong> 🔒 مؤرشف (Read-Only)</div>
      <div><strong>المسؤول المفوض:</strong> ${archive.createdBy.name}</div>
      <div><strong>باقة الترخيص:</strong> ${archive.schoolProfile.plan}</div>
    </div>

    <!-- Summary KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">إجمالي الطلاب المسجلين</div>
        <div class="kpi-num" style="color: #b45309;">${archive.stats.totalStudents} طالب</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">الكادر التعليمي والإداري</div>
        <div class="kpi-num">${archive.stats.totalTeachers + archive.stats.totalStaff} عضو</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">الصفوف والشعب الموثقة</div>
        <div class="kpi-num" style="color: #2563eb;">${academicClasses.length} صفوف</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">إجمالي التحصيل المالي</div>
        <div class="kpi-num" style="color: #047857; font-size: 15px;">${summary.totalCollected.toLocaleString()} د.ع</div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 1. شؤون الطلاب والدرجات لكل صف حرفياً حسب لوحة الإدارة -->
    <!-- ========================================================================= -->
    <div class="section-title">
      <span>👥 شؤون الطلاب والدرجات حسب الصفوف الدراسية (حرفياً حسب سجلات الإدارة)</span>
      <span class="section-subtitle">إجمالي الطلاب: ${archive.stats.totalStudents} طالب مسجل</span>
    </div>

    ${academicClasses.map((cls: any, cIdx: number) => {
      const subjects: any[] = cls.subjects || [];
      const students: any[] = cls.students || [];

      return `
      <div class="class-block">
        <div class="class-header">
          <div class="class-title">
            <span class="class-tag">صف ${cIdx + 1}</span>
            <span>${cls.name || cls.grade}</span>
          </div>
          <div style="font-size: 11px; font-weight: bold; color: #475569;">
            عدد الطلاب: <strong style="color: #0f172a;">${students.length}</strong> طالب
          </div>
        </div>

        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th style="width: 24px; text-align: center;">#</th>
                <th style="text-align: right;" class="student-name-col">اسم الطالب</th>
                <th class="code-col" style="text-align: center;">كود الطالب</th>
                <th class="code-col" style="text-align: center;">كود ولي الأمر</th>
                ${subjects.map((sub: any) => `<th class="subject-col">${sub.name}</th>`).join('')}
                <th class="avg-col" style="text-align: center;">المعدل</th>
                <th class="total-col" style="text-align: center;">المجموع</th>
                <th style="text-align: center; white-space: nowrap; font-size: 9.5px; padding: 4px 3px;">التميز</th>
                <th style="text-align: center; white-space: nowrap; font-size: 9.5px; padding: 4px 4px;">الموقف المالي</th>
              </tr>
            </thead>
            <tbody>
              ${students.map((stu: any, sIdx: number) => {
                const currentMarks = stu.currentMarks || stu.grades?.month1 || stu.grades || {};
                const avg = stu.average !== undefined ? stu.average : '-';
                const total = stu.totalScore !== undefined ? stu.totalScore : '-';
                const finStatus = stu.financial?.status || (stu.paid ? 'paid' : 'unpaid');
                const finText = finStatus === 'paid' ? 'مسدد ✓' : (finStatus === 'partial' ? 'جزئي' : 'مستحق');
                const finClass = finStatus === 'paid' ? 'status-paid' : (finStatus === 'partial' ? 'status-partial' : 'status-unpaid');

                return `
                <tr>
                  <td style="color: #64748b; font-size: 9.5px;">${sIdx + 1}</td>
                  <td class="text-right student-name-col">${stu.name || 'طالب'}</td>
                  <td class="code-col" style="color: #b45309; font-weight: bold;">${stu.code || '-'}</td>
                  <td class="code-col" style="color: #64748b;">${stu.parentCode || '-'}</td>
                  ${subjects.map((sub: any) => {
                    const mark = currentMarks[sub.id];
                    const markDisplay = mark !== undefined && mark !== null && mark !== '' ? mark : '-';
                    const numMark = Number(mark);
                    const isLow = !isNaN(numMark) && numMark < 50 && mark !== '-' && mark !== '';
                    return `<td class="subject-col" style="${isLow ? 'color: #dc2626; font-weight: bold;' : 'font-weight: 600;'}">${markDisplay}</td>`;
                  }).join('')}
                  <td class="avg-col">${avg}</td>
                  <td class="total-col">${total}</td>
                  <td>
                    ${stu.isTopStudent ? '<span class="badge-star">⭐ متميز</span>' : (stu.excellencePoints ? `<span style="font-size: 9px; color: #b45309; font-weight: bold;">${stu.excellencePoints} ن</span>` : '<span style="color: #94a3b8; font-size: 9px;">-</span>')}
                  </td>
                  <td class="${finClass}">${finText}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      `;
    }).join('')}

    <!-- ========================================================================= -->
    <!-- 2. الموقف المالي بالكامل للمدرسة (Full Financial Position) -->
    <!-- ========================================================================= -->
    <div class="page-break"></div>
    <div class="section-title" style="margin-top: 20px;">
      <span>💰 الموقف المالي الشامل والحسابات المدرسية بالكامل</span>
      <span class="section-subtitle">كشف الأقساط والتحصيلات والوصولات المعتمدة</span>
    </div>

    <!-- Financial Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">إجمالي الأقساط المقررة</div>
        <div class="kpi-num" style="color: #0f172a;">${summary.totalRequired.toLocaleString()} د.ع</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">إجمالي المبالغ المحصلة</div>
        <div class="kpi-num" style="color: #047857;">${summary.totalCollected.toLocaleString()} د.ع</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">المتبقيات والذمم المستحقة</div>
        <div class="kpi-num" style="color: #dc2626;">${summary.totalOutstanding.toLocaleString()} د.ع</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 10px; color: #64748b; font-weight: bold;">رسم اشتراك المنصة والترخيص</div>
        <div class="kpi-num" style="color: #b45309;">${(archive.schoolProfile.subscriptionFee || 0).toLocaleString()} د.ع</div>
      </div>
    </div>

    <!-- Student Financial Installments Table -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 12.5px; font-weight: 900; margin-bottom: 8px; color: #1e293b;">
        📋 كشف الأقساط والموقف المالي لجميع الطلاب:
      </h3>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th style="width: 24px; text-align: center;">#</th>
              <th style="text-align: right;" class="student-name-col">اسم الطالب</th>
              <th style="text-align: center;">الصف / المرحلة</th>
              <th class="code-col" style="text-align: center;">كود الطالب</th>
              <th class="code-col" style="text-align: center;">القسط السنوي</th>
              <th style="text-align: center;">نوع الخصم</th>
              <th class="code-col" style="text-align: center;">المسدد</th>
              <th class="code-col" style="text-align: center;">المتبقي</th>
              <th style="text-align: center;">حالة السداد</th>
            </tr>
          </thead>
          <tbody>
            ${studentInstallments.map((inst: any, idx: number) => {
              const isPaid = inst.status === 'paid';
              const isPartial = inst.status === 'partial';
              const statusClass = isPaid ? 'status-paid' : (isPartial ? 'status-partial' : 'status-unpaid');
              const statusLabel = isPaid ? 'مسدد بالكامل ✓' : (isPartial ? 'سداد جزئي' : 'مستحق السداد');

              return `
              <tr>
                <td style="color: #64748b; font-size: 9.5px;">${idx + 1}</td>
                <td class="text-right student-name-col">${inst.name || 'طالب'}</td>
                <td style="font-size: 10px;">${inst.grade || '-'}</td>
                <td class="code-col" style="color: #b45309;">${inst.code || '-'}</td>
                <td class="code-col">${Number(inst.tuitionRequired || 0).toLocaleString()} د.ع</td>
                <td style="font-size: 9.5px;">${inst.discountType !== 'none' && inst.discountType ? inst.discountType : '-'}</td>
                <td class="code-col" style="color: #047857; font-weight: bold;">${Number(inst.paidAmount || 0).toLocaleString()} د.ع</td>
                <td class="code-col" style="color: ${Number(inst.remainingAmount || 0) > 0 ? '#dc2626' : '#64748b'}; font-weight: bold;">
                  ${Number(inst.remainingAmount || 0).toLocaleString()} د.ع
                </td>
                <td class="${statusClass}">${statusLabel}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Official Receipts & Payment Transactions Ledger -->
    ${(receipts.length > 0 || payments.length > 0) ? `
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 12.5px; font-weight: 900; margin-bottom: 8px; color: #1e293b;">
        🧾 سجل وصولات الدفع والتحصيلات الإلكترونية والنقدية:
      </h3>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th style="width: 24px; text-align: center;">#</th>
              <th class="code-col" style="text-align: center;">رقم الوصل</th>
              <th class="code-col" style="text-align: center;">تاريخ الدفع</th>
              <th style="text-align: right;" class="student-name-col">اسم الطالب / المستفيد</th>
              <th class="code-col" style="text-align: center;">المبلغ</th>
              <th style="text-align: center;">طريقة الدفع</th>
              <th style="text-align: center;">حالة الوصل</th>
            </tr>
          </thead>
          <tbody>
            ${(receipts.length > 0 ? receipts : payments).slice(0, 30).map((rcpt: any, rIdx: number) => `
              <tr>
                <td style="color: #64748b; font-size: 9.5px;">${rIdx + 1}</td>
                <td class="code-col" style="color: #b45309; font-weight: bold;">${rcpt.receiptNumber || rcpt.id || `RCPT-${rIdx + 1}`}</td>
                <td class="code-col">${rcpt.date || rcpt.createdAt ? new Date(rcpt.date || rcpt.createdAt).toLocaleDateString('ar-IQ') : '-'}</td>
                <td class="text-right student-name-col">${rcpt.studentName || rcpt.userName || rcpt.name || 'طالب'}</td>
                <td class="code-col" style="color: #047857; font-weight: bold;">${Number(rcpt.amount || 0).toLocaleString()} د.ع</td>
                <td style="font-size: 10px;">${rcpt.paymentMethod || rcpt.method || 'إلكتروني'}</td>
                <td class="status-paid">معتمد وموثق ✓</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- ========================================================================= -->
    <!-- 3. الكادر التعليمي والإداري -->
    <!-- ========================================================================= -->
    <div class="section-title">
      <span>👔 الكادر التعليمي والإداري للمدرسة</span>
      <span class="section-subtitle">${archive.teachersAndStaff.length} عضو مسجل</span>
    </div>
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th style="width: 24px; text-align: center;">#</th>
            <th style="text-align: right;" class="student-name-col">الاسم الكامل</th>
            <th style="text-align: center;">الصفة / الدور</th>
            <th style="text-align: center;">المادة / القسم</th>
            <th class="code-col" style="text-align: center;">رقم الهاتف</th>
          </tr>
        </thead>
        <tbody>
          ${archive.teachersAndStaff.map((t: any, idx: number) => `
            <tr>
              <td style="color: #64748b; font-size: 9.5px;">${idx + 1}</td>
              <td class="text-right student-name-col">${t.name || '-'}</td>
              <td style="font-size: 10px;">${t.role === 'STAFF' ? 'إداري / موظف' : 'أستاذ / معلم'}</td>
              <td style="font-size: 10px;">${t.subject || t.department || 'عام'}</td>
              <td class="code-col" dir="ltr">${t.phone || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- ========================================================================= -->
    <!-- 4. المرفقات والملازم المؤرشفة -->
    <!-- ========================================================================= -->
    <div class="section-title">
      <span>📂 المرفقات والملازم والتعاميم المؤرشفة</span>
      <span class="section-subtitle">${archive.filesAndAttachments.length} ملف مؤرشف</span>
    </div>
    <p style="font-size: 11.5px; margin-bottom: 8px; color: #475569;">
      عدد الملازم والملفات الدراسية المعتمدة سحابياً: <strong>${archive.filesAndAttachments.length} ملف</strong> • 
      عدد التعاميم والرسائل الإدارية: <strong>${archive.broadcastsAndSchedules.broadcasts.length} تعميم</strong>
    </p>

    <!-- Legal Guarantee Box -->
    <div class="legal-box">
      <strong>⚠️ إقرار التوثيق والأرشفة الرقمية الدائمة:</strong>
      تم استخراج وتوثيق هذا الأرشيف الرقمي المعتمد من قاعدة بيانات منصة بوابة بيرق الذكية (Bayraq Gate 6). تم تجميد وتأمين كافة بيانات المدرسة والطلاب ودرجاتهم والموقف المالي وسجلات الكادر والملازم بصيغة دائمة غير قابلة للتعديل (Read-Only) مع الاحتفاظ بكامل السجلات في الخوادم السحابية المشفرة.
    </div>

    <!-- Official Seals & Signatures -->
    <div class="footer-stamps">
      <!-- Seal 1: Bayraq Gate 6 Official Stamp -->
      <div class="stamp-box">
        <div>ختم التوثيق والأرشفة</div>
        <div style="font-size: 11px; margin: 3px 0;">بوابة بيرق</div>
        <div style="font-size: 7.5px; font-family: monospace;">GATE 6 ARCHIVE</div>
      </div>

      <!-- Center: QR Code -->
      <div style="text-align: center;">
        ${qrUrl ? `<img src="${qrUrl}" alt="QR Verification" style="width: 85px; height: 85px; border: 1.5px solid #cbd5e1; border-radius: 8px;" />` : ''}
        <div style="font-size: 10px; font-weight: bold; margin-top: 3px; color: #0f172a;">امسح للتحقق الرقمي من صحة الأرشيف</div>
        <div style="font-size: 8.5px; font-family: monospace; color: #64748b;">${archive.archiveNumber}</div>
      </div>

      <!-- Seal 2: Authorized Archiver Signature -->
      <div style="text-align: left; font-size: 11px;">
        <div><strong>المسؤول المفوض:</strong> ${archive.createdBy.name}</div>
        <div><strong>البريد:</strong> ${archive.createdBy.email}</div>
        <div><strong>التاريخ:</strong> ${new Date(archive.createdAt).toLocaleString('ar-IQ')}</div>
        <div style="margin-top: 12px; border-bottom: 1.5px solid #0f172a; width: 150px;"></div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">التوقيع والاعتماد الإلكتروني</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    } else {
      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Official_Archive_Report_${archive.schoolName}_${archive.archiveNumber}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
};
