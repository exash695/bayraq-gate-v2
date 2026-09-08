import { db } from '../lib/firebase';
import { collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp } from '@/src/lib/firebase';
import { schoolService } from './schoolService';

export type IntegritySeverity = 'critical' | 'high' | 'medium' | 'low';

export type IntegrityIssueType =
  | 'stat_discrepancy'
  | 'orphan_code'
  | 'orphan_user'
  | 'invalid_school_reference'
  | 'mismatched_user_school'
  | 'orphan_parent'
  | 'unverified_school_parent'
  | 'unlinked_teacher'
  | 'orphan_schedule'
  | 'duplicate_code'
  | 'broken_foreign_key';

export interface IntegrityIssue {
  id: string;
  type: IntegrityIssueType;
  severity: IntegritySeverity;
  title: string;
  description: string;
  affectedRecordId: string;
  affectedCollection: string;
  affectedSchoolId?: string;
  affectedSchoolName?: string;
  detectedAt: string;
  probableCause: string;
  suggestedAction: string;
  fixable: boolean;
  meta?: Record<string, any>;
}

export interface SchoolUserDetail {
  id: string;
  name: string;
  email?: string;
  role: string;
  studentCode?: string;
  parentCode?: string;
  activationCode?: string;
  isVerifiedForSchool: boolean;
  verificationReason: string;
  createdAt?: string;
  lastActive?: string;
}

export interface SchoolAuditSummary {
  schoolId: string;
  schoolName: string;
  storedStats: {
    students: number;
    teachers: number;
    parents: number;
    drivers: number;
    totalUsers: number;
  };
  actualUsers: {
    students: number;
    teachers: number;
    parents: number;
    verifiedParents: number;
    unverifiedParents: number;
    drivers: number;
    supervisors: number;
    admins: number;
    totalUsers: number;
  };
  actualCodes: {
    studentCodes: number;
    staffCodes: number;
    parentCodes: number;
    totalCodes: number;
    usedCodes: number;
  };
  usersList?: SchoolUserDetail[];
  hasDiscrepancy: boolean;
  discrepancies: string[];
  issuesCount: number;
}

export interface FullIntegrityReport {
  runAt: string;
  durationMs: number;
  totalSchoolsAudited: number;
  intactSchoolsCount: number;
  discrepantSchoolsCount: number;
  totalIssuesCount: number;
  criticalIssuesCount: number;
  highIssuesCount: number;
  mediumIssuesCount: number;
  lowIssuesCount: number;
  orphanCodesCount: number;
  orphanUsersCount: number;
  mismatchedUsersCount: number;
  orphanParentsCount: number;
  unlinkedTeachersCount: number;
  brokenSchedulesCount: number;
  issues: IntegrityIssue[];
  schoolSummaries: SchoolAuditSummary[];
  validSchools: { id: string; name: string }[];
}

class DataIntegrityService {
  private lastReport: FullIntegrityReport | null = null;
  private isAuditing: boolean = false;

  public getLastReport(): FullIntegrityReport | null {
    return this.lastReport;
  }

  public async runFullAudit(): Promise<FullIntegrityReport> {
    if (this.isAuditing) {
      throw new Error('عملية الفحص جارية حالياً، يرجى الانتظار');
    }
    this.isAuditing = true;
    const startTime = performance.now();

    try {
      // Fetch core datasets concurrently
      const [
        schoolsList,
        codesSnap,
        usersSnap,
        studentsSnap,
        teachersSnap,
        schedulesSnap,
        routesSnap
      ] = await Promise.all([
        schoolService.fetchSchools(),
        getDocs(collection(db, 'activation_codes')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'school_students')).catch(() => ({ docs: [], forEach: () => {} } as any)),
        getDocs(collection(db, 'teachers')).catch(() => ({ docs: [], forEach: () => {} } as any)),
        getDocs(collection(db, 'class_schedules')).catch(() => ({ docs: [], forEach: () => {} } as any)),
        getDocs(collection(db, 'transport_routes')).catch(() => ({ docs: [], forEach: () => {} } as any))
      ]);

      const now = new Date().toISOString();
      const issues: IntegrityIssue[] = [];

      // 1. Build Index Maps
      const validSchoolsMap = new Map<string, string>();
      const schoolDocsMap = new Map<string, any>();
      schoolsList.forEach(d => {
        validSchoolsMap.set(d.id, d.name || 'مدرسة غير مسمّاة');
        schoolDocsMap.set(d.id, { id: d.id, ...d });
      });

      const codesByIdMap = new Map<string, any>();
      const codeStringCounts = new Map<string, number>();

      // 2. Audit Activation Codes
      const codesPerSchool = new Map<string, { studentCodes: number; staffCodes: number; parentCodes: number; totalCodes: number; usedCodes: number }>();

      codesSnap.forEach(docSnap => {
        const data = docSnap.data();
        codesByIdMap.set(docSnap.id, { id: docSnap.id, ...data });

        const codeVal = String(data.code || docSnap.id).trim().toUpperCase();
        codeStringCounts.set(codeVal, (codeStringCounts.get(codeVal) || 0) + 1);

        const sId = String(data.schoolId || data.school_id || '').trim();
        const sName = String(data.schoolName || data.school || '').trim();

        if (!sId) {
          issues.push({
            id: `orphan_code_${docSnap.id}`,
            type: 'orphan_code',
            severity: 'high',
            title: `كود تفعيل بدون معرف مدرسة (School ID): ${data.code || docSnap.id}`,
            description: `الكود [${data.code || docSnap.id}] المخصص لرتبة (${data.role || 'غير محدد'}) لا يحتوي على حقل schoolId.`,
            affectedRecordId: docSnap.id,
            affectedCollection: 'activation_codes',
            affectedSchoolName: sName || 'غير محدد',
            detectedAt: now,
            probableCause: 'إنشاء الكود من واجهة قديمة أو بدون ربط المدرسة المستهدفة.',
            suggestedAction: sName ? `ربط الكود تلقائياً بمدرسة "${sName}" أو نقله لمدرسة قائمة أو حذفه.` : 'تحديد المدرسة الصحيحة أو حذف الكود المهمل.',
            fixable: true,
            meta: { code: data.code || docSnap.id, schoolName: sName, role: data.role }
          });
        } else if (!validSchoolsMap.has(sId)) {
          issues.push({
            id: `invalid_school_code_${docSnap.id}`,
            type: 'invalid_school_reference',
            severity: 'critical',
            title: `كود مرتبط بمدرسة محذوفة أو غير موجودة: ${data.code || docSnap.id}`,
            description: `الكود [${data.code || docSnap.id}] يحمل School ID (${sId}) غير موجود في جدول المدارس.`,
            affectedRecordId: docSnap.id,
            affectedCollection: 'activation_codes',
            affectedSchoolId: sId,
            detectedAt: now,
            probableCause: 'تم حذف المدرسة المستهدفة بعد إنشاء الكود، أو إدخال ID غير صالح.',
            suggestedAction: 'تحديث معرف المدرسة إلى مدرسة قائمة أو حذف الكود المهمل.',
            fixable: true,
            meta: { code: data.code || docSnap.id, invalidSchoolId: sId, role: data.role }
          });
        } else {
          if (!codesPerSchool.has(sId)) {
            codesPerSchool.set(sId, { studentCodes: 0, staffCodes: 0, parentCodes: 0, totalCodes: 0, usedCodes: 0 });
          }
          const curr = codesPerSchool.get(sId)!;
          const role = String(data.role || data.type || '').toUpperCase();
          const isUsed = Boolean(data.used || data.isUsed || data.usedBy || data.status === 'used');

          if (role.includes('STUDENT') || role.includes('طالب')) curr.studentCodes++;
          else if (role.includes('PARENT') || role.includes('أمر') || role.includes('امر')) curr.parentCodes++;
          else curr.staffCodes++;

          curr.totalCodes++;
          if (isUsed) curr.usedCodes++;
        }
      });

      // Check for duplicate code strings
      codeStringCounts.forEach((count, codeStr) => {
        if (count > 1) {
          issues.push({
            id: `dup_code_${codeStr}`,
            type: 'duplicate_code',
            severity: 'critical',
            title: `كود تفعيل مكرر (${count} مرات): ${codeStr}`,
            description: `تم العثور على الكود [${codeStr}] مكرراً في قاعدة البيانات ${count} مرات، مما يسبب تضارباً في التفعيل.`,
            affectedRecordId: codeStr,
            affectedCollection: 'activation_codes',
            detectedAt: now,
            probableCause: 'توليد عشوائي مكرر دون التحقق المسبق من وجود الكود.',
            suggestedAction: 'إلغاء الأكواد المكررة وحذف النسخ الإضافية.',
            fixable: true,
            meta: { code: codeStr, count }
          });
        }
      });

      // 3. Audit Users (Students, Teachers, Parents, Drivers, Staff)
      const usersPerSchool = new Map<string, {
        students: number;
        teachers: number;
        parents: number;
        verifiedParents: number;
        unverifiedParents: number;
        drivers: number;
        supervisors: number;
        admins: number;
        totalUsers: number;
      }>();

      const schoolUsersList = new Map<string, SchoolUserDetail[]>();

      // Index student codes & parent codes per school from school_students
      const studentCodesPerSchool = new Map<string, Set<string>>();
      const parentCodesPerSchool = new Map<string, Set<string>>();
      const globalStudentCodesSet = new Set<string>();

      studentsSnap.forEach((docSnap: any) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || '').trim();
        const sCode = String(data.code || data.studentCode || data.student || '').trim().toUpperCase();
        const pCode = String(data.parentCode || data.parent || '').trim().toUpperCase();

        if (sCode) globalStudentCodesSet.add(sCode);

        if (sId) {
          if (!studentCodesPerSchool.has(sId)) studentCodesPerSchool.set(sId, new Set());
          if (!parentCodesPerSchool.has(sId)) parentCodesPerSchool.set(sId, new Set());

          if (sCode) studentCodesPerSchool.get(sId)!.add(sCode);
          if (pCode) parentCodesPerSchool.get(sId)!.add(pCode);
        }
      });

      // Index activation codes per school
      const activationCodesPerSchool = new Map<string, Set<string>>();
      codesSnap.forEach((docSnap: any) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || '').trim();
        const codeVal = String(data.code || docSnap.id).trim().toUpperCase();
        if (sId && codeVal) {
          if (!activationCodesPerSchool.has(sId)) activationCodesPerSchool.set(sId, new Set());
          activationCodesPerSchool.get(sId)!.add(codeVal);
        }
      });

      usersSnap.forEach(docSnap => {
        const data = docSnap.data();
        const sId = String(data.schoolId || data.school_id || '').trim();
        const usedCodeStr = String(data.activationCode || data.code || data.usedCode || '').trim().toUpperCase();
        const role = String(data.role || '').toLowerCase();
        const studentCode = String(data.studentCode || '').trim().toUpperCase();
        const parentCode = String(data.parentCode || '').trim().toUpperCase();

        if (studentCode) globalStudentCodesSet.add(studentCode);

        if (!sId) {
          issues.push({
            id: `orphan_user_${docSnap.id}`,
            type: 'orphan_user',
            severity: 'medium',
            title: `حساب مستخدم بدون انتماء لمدرسة: ${data.name || data.email || docSnap.id}`,
            description: `المستخدم [${data.name || data.email}] برتبة (${data.role || 'طالب'}) لا يحمل schoolId.`,
            affectedRecordId: docSnap.id,
            affectedCollection: 'users',
            detectedAt: now,
            probableCause: 'تسجيل حساب بدون استخدام كود تفعيل مدرسي.',
            suggestedAction: 'إسناد المستخدم للمدرسة المناسبة أو حذف الحساب المعزول.',
            fixable: true,
            meta: { code: usedCodeStr, userName: data.name, userEmail: data.email, role: data.role }
          });
        } else if (!validSchoolsMap.has(sId)) {
          issues.push({
            id: `invalid_user_school_${docSnap.id}`,
            type: 'invalid_school_reference',
            severity: 'high',
            title: `مستخدم مرتبط بمدرسة غير موجودة: ${data.name || docSnap.id}`,
            description: `المستخدم يحمل School ID (${sId}) غير مسجل في قائمة المدارس الحالية.`,
            affectedRecordId: docSnap.id,
            affectedCollection: 'users',
            affectedSchoolId: sId,
            detectedAt: now,
            probableCause: 'حذف المدرسة من النظام دون ترحيل مستخدميها.',
            suggestedAction: 'نقل المستخدم إلى مدرسة فعالة أو حذف الحساب.',
            fixable: true,
            meta: { userName: data.name, userEmail: data.email, role: data.role, invalidSchoolId: sId }
          });
        } else {
          if (!usersPerSchool.has(sId)) {
            usersPerSchool.set(sId, {
              students: 0,
              teachers: 0,
              parents: 0,
              verifiedParents: 0,
              unverifiedParents: 0,
              drivers: 0,
              supervisors: 0,
              admins: 0,
              totalUsers: 0
            });
          }
          if (!schoolUsersList.has(sId)) {
            schoolUsersList.set(sId, []);
          }

          const curr = usersPerSchool.get(sId)!;
          let isVerifiedForSchool = true;
          let verificationReason = 'مسجل بالمدرسة';

          if (role === 'student' || role === 'school_student' || role.includes('طالب')) {
            curr.students++;
            verificationReason = 'طالب مسجل بالمدرسة';
          } else if (role === 'teacher' || role === 'cadre' || role.includes('استاذ') || role.includes('معلم')) {
            curr.teachers++;
            verificationReason = 'كادر تدريسي بالمدرسة';
          } else if (role === 'parent' || role.includes('أمر') || role.includes('امر')) {
            curr.parents++;

            // Strict School Isolation Check for Parents
            const hasSchoolActivationCode = usedCodeStr ? (activationCodesPerSchool.get(sId)?.has(usedCodeStr) || false) : false;
            const hasStudentInSchool = (parentCode && parentCodesPerSchool.get(sId)?.has(parentCode)) ||
                                      (studentCode && studentCodesPerSchool.get(sId)?.has(studentCode)) ||
                                      (usedCodeStr && studentCodesPerSchool.get(sId)?.has(usedCodeStr));

            if (hasSchoolActivationCode || hasStudentInSchool) {
              curr.verifiedParents++;
              isVerifiedForSchool = true;
              verificationReason = hasSchoolActivationCode
                ? `كود تفعيل تابع للمدرسة [${usedCodeStr}]`
                : `مرتبط بطالب مسجل بالمدرسة [${parentCode || studentCode}]`;
            } else {
              curr.unverifiedParents++;
              isVerifiedForSchool = false;
              verificationReason = 'مسجل باسم المدرسة دون وجود كود تفعيل أو طالب مسجل بالمدرسة';

              issues.push({
                id: `unverified_parent_${docSnap.id}`,
                type: 'unverified_school_parent',
                severity: 'medium',
                title: `ولي أمر بدون طالب أو كود تفعيل في (${validSchoolsMap.get(sId) || sId}): ${data.name || data.email || docSnap.id}`,
                description: `المستخدم [${data.name || data.email || docSnap.id}] يحمل School ID للمدرسة (${validSchoolsMap.get(sId)}) ولكن لا يوجد له كود تفعيل بالمدرسة أو طالب مطابق لكود الربط [${parentCode || studentCode || 'بدون كود'}].`,
                affectedRecordId: docSnap.id,
                affectedCollection: 'users',
                affectedSchoolId: sId,
                affectedSchoolName: validSchoolsMap.get(sId),
                detectedAt: now,
                probableCause: 'حساب تجريبي قديم أو تسجيل مباشر بدون اختيار كود مدرسة حقيقي.',
                suggestedAction: 'فك ارتباط المستخدم بالمدرسة أو حذف الحساب لتصحيح عداد أولياء الأمور.',
                fixable: true,
                meta: { userId: docSnap.id, userName: data.name, userEmail: data.email, schoolId: sId, schoolName: validSchoolsMap.get(sId) }
              });
            }
          } else if (role === 'driver' || role.includes('سائق')) {
            curr.drivers++;
            verificationReason = 'سائق نقل مدرسي';
          } else if (role === 'supervisor' || role.includes('مشرف')) {
            curr.supervisors++;
            verificationReason = 'مشرف أكاديمي';
          } else if (role === 'admin' || role.includes('مدير') || role.includes('إداري')) {
            curr.admins++;
            verificationReason = 'إدارة المدرسة';
          }

          curr.totalUsers++;

          schoolUsersList.get(sId)!.push({
            id: docSnap.id,
            name: data.name || data.displayName || 'مستخدم بدون اسم',
            email: data.email || '',
            role: data.role || 'student',
            studentCode: data.studentCode || '',
            parentCode: data.parentCode || '',
            activationCode: usedCodeStr,
            isVerifiedForSchool,
            verificationReason,
            createdAt: data.createdAt ? String(data.createdAt) : undefined,
            lastActive: data.lastActive ? String(data.lastActive) : undefined
          });

          // Verify schoolId matches code's schoolId if code used
          if (usedCodeStr && codesByIdMap.has(usedCodeStr)) {
            const codeObj = codesByIdMap.get(usedCodeStr);
            const codeSchoolId = String(codeObj.schoolId || codeObj.school_id || '').trim();
            if (codeSchoolId && codeSchoolId !== sId) {
              issues.push({
                id: `mismatched_user_${docSnap.id}`,
                type: 'mismatched_user_school',
                severity: 'high',
                title: `تضارب مدرسة الحساب مع كود التسجيل: ${data.name || docSnap.id}`,
                description: `الحساب مسجل في مدرسة (${validSchoolsMap.get(sId) || sId}) بينما الكود المستعمل [${usedCodeStr}] يخص مدرسة (${validSchoolsMap.get(codeSchoolId) || codeSchoolId}).`,
                affectedRecordId: docSnap.id,
                affectedCollection: 'users',
                affectedSchoolId: sId,
                affectedSchoolName: validSchoolsMap.get(sId),
                detectedAt: now,
                probableCause: 'تعديل يدوي لمدرسة المستخدم دون تحديث الكود أو العكس.',
                suggestedAction: `إعادة مواءمة المدرسة مع مدرسة الكود الأصلية (${validSchoolsMap.get(codeSchoolId) || codeSchoolId}).`,
                fixable: true,
                meta: { correctSchoolId: codeSchoolId }
              });
            }
          }

          // Check for orphan parents (parent with no student linked anywhere)
          if ((role === 'parent' || role.includes('أمر')) && parentCode && !globalStudentCodesSet.has(parentCode)) {
            issues.push({
              id: `orphan_parent_${docSnap.id}`,
              type: 'orphan_parent',
              severity: 'medium',
              title: `ولي أمر مرتبط بكود طالب غير موجود: ${data.name || docSnap.id}`,
              description: `ولي الأمر [${data.name || data.email}] يحمل كود ربط [${parentCode}] لا يتطابق مع أي طالب مسجل.`,
              affectedRecordId: docSnap.id,
              affectedCollection: 'users',
              affectedSchoolId: sId,
              affectedSchoolName: validSchoolsMap.get(sId),
              detectedAt: now,
              probableCause: 'حذف حساب الطالب أو كتابة الكود بشكل خاطئ عند التسجيل.',
              suggestedAction: 'فك ارتباط الكود المفقود لتنظيف الحساب.',
              fixable: true,
              meta: { parentName: data.name, invalidStudentCode: parentCode }
            });
          }
        }
      });

      // 4. Audit Class Schedules
      schedulesSnap.forEach((docSnap: any) => {
        const data = docSnap.data();
        const sId = String(data.schoolId || '').trim();
        if (sId && !validSchoolsMap.has(sId)) {
          issues.push({
            id: `orphan_schedule_${docSnap.id}`,
            type: 'orphan_schedule',
            severity: 'low',
            title: `جدول حصص مرتبط بمدرسة محذوفة: ${data.className || docSnap.id}`,
            description: `جدول الحصص [${data.className || docSnap.id}] يحمل School ID (${sId}) غير موجود.`,
            affectedRecordId: docSnap.id,
            affectedCollection: 'class_schedules',
            affectedSchoolId: sId,
            detectedAt: now,
            probableCause: 'عدم مسح الجداول التابعة للمدرسة عند حذفها.',
            suggestedAction: 'حذف الجدول القديم لتنظيف قاعدة البيانات.',
            fixable: true
          });
        }
      });

      // 5. Per-School Stat Reconciliation
      const schoolSummaries: SchoolAuditSummary[] = [];
      let intactCount = 0;
      let discrepantCount = 0;

      validSchoolsMap.forEach((sName, sId) => {
        const stored = schoolDocsMap.get(sId) || {};
        const actualUserStats = usersPerSchool.get(sId) || {
          students: 0,
          teachers: 0,
          parents: 0,
          verifiedParents: 0,
          unverifiedParents: 0,
          drivers: 0,
          supervisors: 0,
          admins: 0,
          totalUsers: 0
        };
        const actualCodeStats = codesPerSchool.get(sId) || {
          studentCodes: 0,
          staffCodes: 0,
          parentCodes: 0,
          totalCodes: 0,
          usedCodes: 0
        };
        const usersList = schoolUsersList.get(sId) || [];

        const discrepancies: string[] = [];

        const storedStudents = Number(stored.studentsCount || 0);
        if (storedStudents !== actualUserStats.students) {
          discrepancies.push(`الطلاب: المخزن في الوثيقة (${storedStudents}) vs الفعلي (${actualUserStats.students})`);
        }

        const storedTeachers = Number(stored.teachersCount || 0);
        if (storedTeachers !== actualUserStats.teachers) {
          discrepancies.push(`الأساتذة: المخزن في الوثيقة (${storedTeachers}) vs الفعلي (${actualUserStats.teachers})`);
        }

        const storedParents = Number(stored.parentsCount || 0);
        const expectedParents = actualUserStats.verifiedParents;
        if (storedParents !== expectedParents) {
          discrepancies.push(`أولياء الأمور: المخزن (${storedParents}) vs الفعلي المؤكد (${expectedParents})`);
        }

        // Highlight if school has 0 codes but stored or actual parents > 0
        if (actualCodeStats.totalCodes === 0 && actualUserStats.students === 0 && (actualUserStats.parents > 0 || storedParents > 0)) {
          discrepancies.push(`تنبيه: المدرسة لا تملك أكواداً أو طلاباً ولكن مسجل بها (${actualUserStats.parents}) أولياء أمور`);
        } else if (actualUserStats.unverifiedParents > 0) {
          discrepancies.push(`يوجد (${actualUserStats.unverifiedParents}) حسابات أولياء أمور غير مؤكدة أو بدون أكواد في هذه المدرسة`);
        }

        const hasDiscrepancy = discrepancies.length > 0;
        const schoolIssues = issues.filter(i => i.affectedSchoolId === sId);

        if (hasDiscrepancy) {
          discrepantCount++;
          issues.push({
            id: `stat_discrepancy_${sId}`,
            type: 'stat_discrepancy',
            severity: 'low',
            title: `تضارب عدادات مدرسة: ${sName}`,
            description: discrepancies.length > 0 ? discrepancies.join(' | ') : `يوجد ${actualUserStats.unverifiedParents} حسابات أولياء أمور غير مرتبطة بطلاب أو أكواد في هذه المدرسة`,
            affectedRecordId: sId,
            affectedCollection: 'schools',
            affectedSchoolId: sId,
            affectedSchoolName: sName,
            detectedAt: now,
            probableCause: actualUserStats.unverifiedParents > 0 ? 'وجود حسابات قديمة أو تجريبية مسجلة باسم المدرسة دون وجود أكواد أو طلاب حقيقيين.' : 'إضافة أو تعديل مستخدمين بدون تشغيل دالة التحديث التلقائي للعدادات.',
            suggestedAction: 'تحديث ومواءمة العدادات أو تنظيف الحسابات غير المرتبطة.',
            fixable: true,
            meta: { actualUserStats }
          });
        } else {
          intactCount++;
        }

        schoolSummaries.push({
          schoolId: sId,
          schoolName: sName,
          storedStats: {
            students: storedStudents,
            teachers: storedTeachers,
            parents: Number(stored.parentsCount || 0),
            drivers: Number(stored.driversCount || 0),
            totalUsers: Number(stored.totalUsers || 0)
          },
          actualUsers: actualUserStats,
          actualCodes: actualCodeStats,
          usersList,
          hasDiscrepancy,
          discrepancies,
          issuesCount: schoolIssues.length + (hasDiscrepancy ? 1 : 0)
        });
      });

      const durationMs = Math.round(performance.now() - startTime);

      const criticalIssuesCount = issues.filter(i => i.severity === 'critical').length;
      const highIssuesCount = issues.filter(i => i.severity === 'high').length;
      const mediumIssuesCount = issues.filter(i => i.severity === 'medium').length;
      const lowIssuesCount = issues.filter(i => i.severity === 'low').length;

      const orphanCodesCount = issues.filter(i => i.type === 'orphan_code').length;
      const orphanUsersCount = issues.filter(i => i.type === 'orphan_user').length;
      const mismatchedUsersCount = issues.filter(i => i.type === 'mismatched_user_school').length;
      const orphanParentsCount = issues.filter(i => i.type === 'orphan_parent').length;
      const unlinkedTeachersCount = issues.filter(i => i.type === 'unlinked_teacher').length;
      const brokenSchedulesCount = issues.filter(i => i.type === 'orphan_schedule').length;

      const validSchools = Array.from(validSchoolsMap.entries()).map(([id, name]) => ({ id, name }));

      this.lastReport = {
        runAt: now,
        durationMs,
        totalSchoolsAudited: validSchoolsMap.size,
        intactSchoolsCount: intactCount,
        discrepantSchoolsCount: discrepantCount,
        totalIssuesCount: issues.length,
        criticalIssuesCount,
        highIssuesCount,
        mediumIssuesCount,
        lowIssuesCount,
        orphanCodesCount,
        orphanUsersCount,
        mismatchedUsersCount,
        orphanParentsCount,
        unlinkedTeachersCount,
        brokenSchedulesCount,
        issues,
        schoolSummaries,
        validSchools
      };

      return this.lastReport;
    } finally {
      this.isAuditing = false;
    }
  }

  // Targeted individual repair methods
  public async fixSingleStatDiscrepancy(schoolId: string, actualUsers?: any): Promise<void> {
    // 1. Ensure we have the latest audit report context
    if (!this.lastReport) {
      await this.runFullAudit();
    }
    const schoolSummary = this.lastReport?.schoolSummaries.find(s => s.schoolId === schoolId);
    
    // Check if the school is empty (0 codes and 0 students) or has unverified parents
    const isTotallyEmpty = schoolSummary
      ? (schoolSummary.actualCodes.totalCodes === 0 && schoolSummary.actualUsers.students === 0)
      : false;
    const hasUnverified = isTotallyEmpty || (schoolSummary && schoolSummary.actualUsers.unverifiedParents > 0);

    if (hasUnverified) {
      // Unlink unverified users recorded in the summary list
      const usersToUnlink = isTotallyEmpty
        ? (schoolSummary?.usersList || [])
        : (schoolSummary?.usersList?.filter(u => !u.isVerifiedForSchool) || []);

      for (const u of usersToUnlink) {
        try {
          await this.unlinkUserFromSchool(u.id);
        } catch (e) {
          console.error(`Failed to unlink user ${u.id}:`, e);
        }
      }

      // Also directly query the database to guarantee no stray accounts remain
      try {
        const uQ1 = query(collection(db, 'users'), where('schoolId', '==', schoolId));
        const uQ2 = query(collection(db, 'users'), where('school_id', '==', schoolId));
        const [snap1, snap2] = await Promise.all([getDocs(uQ1), getDocs(uQ2)]);
        const strayMap = new Map<string, any>();
        snap1.docs.forEach(d => strayMap.set(d.id, d.data()));
        snap2.docs.forEach(d => strayMap.set(d.id, d.data()));

        for (const [uid, udata] of strayMap) {
          const role = String(udata.role || '').toLowerCase();
          const isParent = role === 'parent' || role.includes('أمر') || role.includes('امر');
          if (isTotallyEmpty || isParent) {
            await this.unlinkUserFromSchool(uid);
          }
        }
      } catch (err) {
        console.error('Direct user cleanup query failed:', err);
      }
    }

    // 2. Re-audit to get clean counts after unlinking
    const freshReport = await this.runFullAudit();
    const updatedSummary = freshReport.schoolSummaries.find(s => s.schoolId === schoolId);

    const verifiedStudents = updatedSummary ? updatedSummary.actualUsers.students : (actualUsers?.students || 0);
    const verifiedTeachers = updatedSummary ? updatedSummary.actualUsers.teachers : (actualUsers?.teachers || 0);
    const verifiedParents = updatedSummary ? updatedSummary.actualUsers.verifiedParents : (actualUsers?.verifiedParents || 0);
    const drivers = updatedSummary ? (updatedSummary.actualUsers.drivers || 0) : (actualUsers?.drivers || 0);
    const supervisors = updatedSummary ? (updatedSummary.actualUsers.supervisors || 0) : (actualUsers?.supervisors || 0);
    const admins = updatedSummary ? (updatedSummary.actualUsers.admins || 0) : (actualUsers?.admins || 0);
    const total = verifiedStudents + verifiedTeachers + verifiedParents + drivers + supervisors + admins;

    // 3. Update the school document
    await setDoc(doc(db, 'schools', schoolId), {
      studentsCount: verifiedStudents,
      teachersCount: verifiedTeachers,
      parentsCount: verifiedParents,
      driversCount: drivers,
      supervisorsCount: supervisors,
      adminsCount: admins,
      totalUsers: total,
      lastAuditRepairedAt: serverTimestamp()
    }, { merge: true });

    // 4. Final audit refresh
    await this.runFullAudit();
  }

  public async fixMismatchedUser(userId: string, correctSchoolId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      schoolId: correctSchoolId,
      updatedAt: serverTimestamp()
    });
  }

  public async linkOrphanCode(codeDocId: string, schoolId: string): Promise<void> {
    await updateDoc(doc(db, 'activation_codes', codeDocId), {
      schoolId,
      updatedAt: serverTimestamp()
    });
  }

  public async deleteOrphanCode(codeDocId: string): Promise<void> {
    await deleteDoc(doc(db, 'activation_codes', codeDocId));
  }

  public async reassignCodeToSchool(codeDocId: string, schoolId: string, schoolName?: string): Promise<void> {
    const updateData: any = {
      schoolId,
      updatedAt: serverTimestamp()
    };
    if (schoolName) {
      updateData.schoolName = schoolName;
    }
    await updateDoc(doc(db, 'activation_codes', codeDocId), updateData);
  }

  public async deleteOrphanUser(userId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId));
  }

  public async reassignUserToSchool(userId: string, schoolId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      schoolId,
      updatedAt: serverTimestamp()
    });
  }

  public async unlinkOrphanParent(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      parentCode: '',
      studentCode: '',
      updatedAt: serverTimestamp()
    });
  }

  public async deleteOrphanSchedule(scheduleId: string): Promise<void> {
    await deleteDoc(doc(db, 'class_schedules', scheduleId));
  }

  public async unlinkUserFromSchool(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        schoolId: '',
        school_id: '',
        schoolName: '',
        school: '',
        parentCode: '',
        studentCode: '',
        activationCode: '',
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      // Fallback with setDoc merge
      await setDoc(doc(db, 'users', userId), {
        schoolId: '',
        school_id: '',
        schoolName: '',
        school: '',
        parentCode: '',
        studentCode: '',
        activationCode: '',
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  public async cleanUnverifiedSchoolUsers(schoolId: string): Promise<number> {
    if (!this.lastReport) {
      await this.runFullAudit();
    }
    const schoolSummary = this.lastReport?.schoolSummaries.find(s => s.schoolId === schoolId);
    let unverifiedUsers = schoolSummary?.usersList?.filter(u => !u.isVerifiedForSchool) || [];
    let cleanedCount = 0;

    for (const u of unverifiedUsers) {
      try {
        await this.unlinkUserFromSchool(u.id);
        cleanedCount++;
      } catch (err) {
        console.error(`Failed to unlink unverified user ${u.id}:`, err);
      }
    }

    // Direct database query fallback
    try {
      const uQ1 = query(collection(db, 'users'), where('schoolId', '==', schoolId));
      const uQ2 = query(collection(db, 'users'), where('school_id', '==', schoolId));
      const [snap1, snap2] = await Promise.all([getDocs(uQ1), getDocs(uQ2)]);
      const directDocs = new Map<string, any>();
      snap1.docs.forEach(d => directDocs.set(d.id, d.data()));
      snap2.docs.forEach(d => directDocs.set(d.id, d.data()));

      const isTotallyEmpty = schoolSummary ? (schoolSummary.actualCodes.totalCodes === 0 && schoolSummary.actualUsers.students === 0) : true;

      for (const [uid, udata] of directDocs) {
        const role = String(udata.role || '').toLowerCase();
        if (isTotallyEmpty || role.includes('أمر') || role === 'parent') {
          await this.unlinkUserFromSchool(uid);
          cleanedCount++;
        }
      }
    } catch (err) {
      console.error('Direct user cleanup query failed:', err);
    }

    // Re-run audit to get pristine updated numbers
    const newReport = await this.runFullAudit();
    const updatedSummary = newReport.schoolSummaries.find(s => s.schoolId === schoolId);
    if (updatedSummary) {
      const vStudents = updatedSummary.actualUsers.students;
      const vTeachers = updatedSummary.actualUsers.teachers;
      const vParents = updatedSummary.actualUsers.verifiedParents;
      const vDrivers = updatedSummary.actualUsers.drivers || 0;
      const vSupervisors = updatedSummary.actualUsers.supervisors || 0;
      const vAdmins = updatedSummary.actualUsers.admins || 0;
      const vTotal = vStudents + vTeachers + vParents + vDrivers + vSupervisors + vAdmins;

      await setDoc(doc(db, 'schools', schoolId), {
        studentsCount: vStudents,
        teachersCount: vTeachers,
        parentsCount: vParents,
        driversCount: vDrivers,
        supervisorsCount: vSupervisors,
        adminsCount: vAdmins,
        totalUsers: vTotal,
        lastAuditRepairedAt: serverTimestamp()
      }, { merge: true });
    }

    await this.runFullAudit();
    return cleanedCount;
  }

  public async resetSingleSchoolCounters(schoolId: string): Promise<void> {
    // 1. Unlink any stray users attached to this school
    try {
      const q1 = query(collection(db, 'users'), where('schoolId', '==', schoolId));
      const q2 = query(collection(db, 'users'), where('school_id', '==', schoolId));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const strayDocs = new Map<string, any>();
      s1.docs.forEach(d => strayDocs.set(d.id, d));
      s2.docs.forEach(d => strayDocs.set(d.id, d));
      for (const [userId] of strayDocs) {
        await this.unlinkUserFromSchool(userId);
      }
    } catch (err) {
      console.error('Direct user cleanup query failed:', err);
    }

    // 2. Set all school document counters strictly to 0
    await setDoc(doc(db, 'schools', schoolId), {
      studentsCount: 0,
      teachersCount: 0,
      parentsCount: 0,
      driversCount: 0,
      supervisorsCount: 0,
      adminsCount: 0,
      totalUsers: 0,
      lastAuditRepairedAt: serverTimestamp()
    }, { merge: true });

    await this.runFullAudit();
  }

  public async resetEmptySchoolsCounters(): Promise<number> {
    if (!this.lastReport) {
      await this.runFullAudit();
    }
    if (!this.lastReport) return 0;

    let resetCount = 0;
    for (const summary of this.lastReport.schoolSummaries) {
      // If the school has 0 codes and 0 verified students, its counters must be strictly 0
      if (summary.actualCodes.totalCodes === 0 && summary.actualUsers.students === 0) {
        // 1. Unlink any users mistakenly attached to this empty school
        const usersToUnlink = summary.usersList || [];
        for (const u of usersToUnlink) {
          try {
            await this.unlinkUserFromSchool(u.id);
          } catch (err) {
            console.error(`Failed to unlink user ${u.id}:`, err);
          }
        }

        // Direct query to ensure complete detachment
        try {
          const q1 = query(collection(db, 'users'), where('schoolId', '==', summary.schoolId));
          const q2 = query(collection(db, 'users'), where('school_id', '==', summary.schoolId));
          const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const strayDocs = new Map<string, any>();
          s1.docs.forEach(d => strayDocs.set(d.id, d));
          s2.docs.forEach(d => strayDocs.set(d.id, d));
          for (const [userId] of strayDocs) {
            await this.unlinkUserFromSchool(userId);
          }
        } catch (err) {
          console.error('Direct user cleanup query failed:', err);
        }

        // 2. Set all school document counters strictly to 0
        await setDoc(doc(db, 'schools', summary.schoolId), {
          studentsCount: 0,
          teachersCount: 0,
          parentsCount: 0,
          driversCount: 0,
          supervisorsCount: 0,
          adminsCount: 0,
          totalUsers: 0,
          lastAuditRepairedAt: serverTimestamp()
        }, { merge: true });

        resetCount++;
      }
    }

    await this.runFullAudit();
    return resetCount;
  }

  public async fixAllAutoFixableIssues(): Promise<{
    fixedStats: number;
    fixedSchedules: number;
    fixedMismatches: number;
    fixedUnverified: number;
    totalFixed: number;
  }> {
    if (!this.lastReport) {
      await this.runFullAudit();
    }
    if (!this.lastReport) return { fixedStats: 0, fixedSchedules: 0, fixedMismatches: 0, fixedUnverified: 0, totalFixed: 0 };

    let fixedStats = 0;
    let fixedSchedules = 0;
    let fixedMismatches = 0;
    let fixedUnverified = 0;

    // 1. First pass: Fix unverified parents, orphan parents, broken schedules, and mismatches
    for (const issue of this.lastReport.issues) {
      try {
        if (issue.type === 'unverified_school_parent') {
          await this.unlinkUserFromSchool(issue.affectedRecordId);
          fixedUnverified++;
        } else if (issue.type === 'orphan_parent') {
          await this.unlinkOrphanParent(issue.affectedRecordId);
          fixedUnverified++;
        } else if (issue.type === 'orphan_schedule') {
          await this.deleteOrphanSchedule(issue.affectedRecordId);
          fixedSchedules++;
        } else if (issue.type === 'mismatched_user_school' && issue.meta?.correctSchoolId) {
          await this.fixMismatchedUser(issue.affectedRecordId, issue.meta.correctSchoolId);
          fixedMismatches++;
        }
      } catch (err) {
        console.error(`Failed to auto-fix issue ${issue.id}:`, err);
      }
    }

    // 2. Refresh audit after unlinking accounts
    await this.runFullAudit();

    // 3. Second pass: Fix all stat discrepancies with clean data
    if (this.lastReport) {
      for (const issue of this.lastReport.issues) {
        if (issue.type === 'stat_discrepancy') {
          try {
            await this.fixSingleStatDiscrepancy(issue.affectedRecordId, issue.meta?.actualUserStats);
            fixedStats++;
          } catch (err) {
            console.error(`Failed to auto-fix stat discrepancy ${issue.id}:`, err);
          }
        }
      }
    }

    // 4. Final audit refresh
    await this.runFullAudit();

    return {
      fixedStats,
      fixedSchedules,
      fixedMismatches,
      fixedUnverified,
      totalFixed: fixedStats + fixedSchedules + fixedMismatches + fixedUnverified
    };
  }
}

export const dataIntegrityService = new DataIntegrityService();

