import { 
  healStudentCodePrefix, 
  getPrefixForGrade, 
  normalizeArabicText 
} from './studentUtils';
import { 
  normalizeArabicGrade, 
  detectAcademicStage, 
  detectGradeNumber, 
  detectAcademicBranch 
} from './gradeMatcher';
import { academicService } from '../services/academicService';
import { logActivity } from './auditLogger';

export type PromotionStudentDecision = 'promote' | 'retain' | 'graduate' | 'exclude';

export interface StudentPromotionItem {
  student: any;
  currentGrade: string;
  sourceListId: string;
  sourceListName: string;
  targetGrade: string;
  targetClassName: string;
  decision: PromotionStudentDecision;
  academicEvaluation: {
    status: 'passed' | 'conditional' | 'failed' | 'unassessed';
    failingSubjectsCount: number;
    failingSubjects: string[];
    average: number;
    evaluatedSubjectsCount: number;
  };
}

export interface ClassPromotionRule {
  sourceListId: string;
  sourceClassName: string;
  sourceGrade: string;
  targetGrade: string;
  targetClassName: string;
  isGraduation: boolean;
  graduationLabel?: string;
  enabled: boolean;
  studentCount: number;
  students: any[];
  alternativeBranch?: 'scientific' | 'literary'; // for 3rd intermediate
}

export interface PromotionSettings {
  previousAcademicYear: string;
  newAcademicYear: string;
  createArchiveSnapshot: boolean;
  resetFinances: boolean;
  carryOverDebts: boolean;
  keepDiscounts: boolean;
  resetGrades: boolean;
  updateStudentCodes: boolean;
  handleConditionals: 'promote' | 'retain';
}

export interface PromotionResult {
  promotedCount: number;
  retainedCount: number;
  graduatedCount: number;
  newListsCount: number;
  archivedListsCount: number;
  promotedLists: any[];
  errors?: string[];
}

/**
 * Calculates the destination grade for any given Iraqi curriculum grade.
 */
export function getNextGradeInfo(rawGrade: string, preferredBranch: 'scientific' | 'literary' = 'scientific'): {
  nextGrade: string;
  stage: 'primary' | 'intermediate' | 'high' | 'graduated';
  nextPrefix: string;
  isGraduating: boolean;
  graduationLabel?: string;
} {
  const norm = normalizeArabicGrade(rawGrade || '');
  const stage = detectAcademicStage(norm);
  const gradeNum = detectGradeNumber(norm);
  const branch = detectAcademicBranch(norm);

  // 1. Primary Stage
  if (stage === 'primary' || norm.includes('ابتد')) {
    if (gradeNum === 1 || norm.includes('اول')) {
      return { nextGrade: 'ثاني ابتدائي', stage: 'primary', nextPrefix: 'P2', isGraduating: false };
    }
    if (gradeNum === 2 || norm.includes('ثاني')) {
      return { nextGrade: 'ثالث ابتدائي', stage: 'primary', nextPrefix: 'P3', isGraduating: false };
    }
    if (gradeNum === 3 || norm.includes('ثالث')) {
      return { nextGrade: 'رابع ابتدائي', stage: 'primary', nextPrefix: 'P4', isGraduating: false };
    }
    if (gradeNum === 4 || norm.includes('رابع')) {
      return { nextGrade: 'خامس ابتدائي', stage: 'primary', nextPrefix: 'P5', isGraduating: false };
    }
    if (gradeNum === 5 || norm.includes('خامس')) {
      return { nextGrade: 'سادس ابتدائي', stage: 'primary', nextPrefix: 'P6', isGraduating: false };
    }
    if (gradeNum === 6 || norm.includes('سادس')) {
      return { 
        nextGrade: 'أول متوسط', 
        stage: 'intermediate', 
        nextPrefix: 'M1', 
        isGraduating: true,
        graduationLabel: 'خريج المرحلة الابتدائية'
      };
    }
  }

  // 2. Intermediate Stage
  if (stage === 'intermediate' || norm.includes('متوسط')) {
    if (gradeNum === 1 || norm.includes('اول')) {
      return { nextGrade: 'ثاني متوسط', stage: 'intermediate', nextPrefix: 'M2', isGraduating: false };
    }
    if (gradeNum === 2 || norm.includes('ثاني')) {
      return { nextGrade: 'ثالث متوسط', stage: 'intermediate', nextPrefix: 'M3', isGraduating: false };
    }
    if (gradeNum === 3 || norm.includes('ثالث')) {
      const nextTarget = preferredBranch === 'literary' ? 'رابع أدبي' : 'رابع علمي';
      const prefix = preferredBranch === 'literary' ? 'S4A' : 'S4S';
      return { 
        nextGrade: nextTarget, 
        stage: 'high', 
        nextPrefix: prefix, 
        isGraduating: true,
        graduationLabel: 'خريج المرحلة المتوسطة'
      };
    }
  }

  // 3. Preparatory / High Stage
  if (stage === 'preparatory' || norm.includes('اعداد') || norm.includes('ثانوي') || branch) {
    if (gradeNum === 4 || norm.includes('رابع')) {
      if (branch === 'literary' || norm.includes('ادبي')) {
        return { nextGrade: 'خامس أدبي', stage: 'high', nextPrefix: 'S5A', isGraduating: false };
      }
      return { nextGrade: 'خامس علمي', stage: 'high', nextPrefix: 'S5S', isGraduating: false };
    }
    if (gradeNum === 5 || norm.includes('خامس')) {
      if (branch === 'literary' || norm.includes('ادبي')) {
        return { nextGrade: 'سادس أدبي', stage: 'high', nextPrefix: 'S6A', isGraduating: false };
      }
      return { nextGrade: 'سادس علمي', stage: 'high', nextPrefix: 'S6S', isGraduating: false };
    }
    if (gradeNum === 6 || norm.includes('سادس')) {
      return { 
        nextGrade: 'خريج المرحلة الإعدادية', 
        stage: 'graduated', 
        nextPrefix: 'GRAD', 
        isGraduating: true,
        graduationLabel: branch === 'literary' ? 'خريج السادس الأدبي' : 'خريج السادس العلمي'
      };
    }
  }

  // Fallback defaults
  return { nextGrade: 'الصف التالي', stage: 'intermediate', nextPrefix: 'STU', isGraduating: false };
}

/**
 * Intelligently suggests the next class title while preserving section letters (أ, ب, ج, A, B).
 */
export function suggestNextClassName(currentName: string, sourceGrade: string, targetGrade: string): string {
  if (!currentName) return targetGrade;
  
  // Extract section or letter indicators (أ, ب, ج, د, هـ, و, A, B, C, D)
  const sectionMatch = currentName.match(/(?:شعبة|شعبه|صف|فصل)?\s*([أ-يA-Za-z])(?:\s|$|\)|-|_)/);
  const sectionLetter = sectionMatch ? sectionMatch[1].trim() : '';

  // Check if current name has a dash separator like "الأول متوسط - أ"
  if (currentName.includes('-')) {
    const parts = currentName.split('-');
    const suffix = parts.slice(1).join('-').trim();
    return `${targetGrade} - ${suffix}`;
  }

  if (currentName.includes('(') && currentName.includes(')')) {
    const insideParen = currentName.match(/\(([^)]+)\)/);
    if (insideParen) {
      return `${targetGrade} (${insideParen[1].trim()})`;
    }
  }

  if (sectionLetter && !['الصف', 'الاول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'].includes(sectionLetter)) {
    return `${targetGrade} - شعبة ${sectionLetter}`;
  }

  return `${targetGrade} - جديد`;
}

/**
 * Analyzes the academic grading records for a student to determine graduation or passing status.
 * Accurately categorizes every student into:
 * - 'passed': All evaluated subjects >= 50, average >= 50, and at least 1 subject evaluated with passing score
 * - 'conditional': 1 to 2 failing subjects (eligible for 2nd round / إكمال)
 * - 'failed': 3 or more failing subjects, OR all zeroes / empty / unassessed / failing average
 */
export function evaluateStudentAcademicStatus(student: any, passScore: number = 50): {
  status: 'passed' | 'conditional' | 'failed';
  failingSubjectsCount: number;
  failingSubjects: string[];
  average: number;
  evaluatedSubjectsCount: number;
  hasGrades: boolean;
} {
  if (!student) {
    return {
      status: 'failed',
      failingSubjectsCount: 1,
      failingSubjects: ['بيانات غير متوفرة'],
      average: 0,
      evaluatedSubjectsCount: 0,
      hasGrades: false
    };
  }

  // 1. Check if the student record has explicit status or result tags
  const rawStatus = (student?.status || student?.academicStatus || student?.result || '').toString().toLowerCase().trim();
  if (rawStatus.includes('راسب') || rawStatus === 'failed') {
    return {
      status: 'failed',
      failingSubjectsCount: 3,
      failingSubjects: ['إعادة الصف'],
      average: 0,
      evaluatedSubjectsCount: 0,
      hasGrades: false
    };
  }
  if (rawStatus.includes('مكمل') || rawStatus.includes('دور ثاني') || rawStatus === 'conditional') {
    return {
      status: 'conditional',
      failingSubjectsCount: 1,
      failingSubjects: ['مكمل (دور ثاني)'],
      average: 0,
      evaluatedSubjectsCount: 0,
      hasGrades: false
    };
  }

  const grades = student?.grades;
  // If student has no grades object or it's empty, they have 0 marks and are NOT passed!
  if (!grades || typeof grades !== 'object' || Object.keys(grades).length === 0) {
    return {
      status: 'failed',
      failingSubjectsCount: 1,
      failingSubjects: ['درجات صفر / غير مرصودة'],
      average: 0,
      evaluatedSubjectsCount: 0,
      hasGrades: false
    };
  }

  // Priority order of periods to determine final subject score
  const priorityPeriods = [
    'final_grade', 'final', 'round2', 'annual_quest', 'term2_avg', 'term2',
    'mid', 'term1_avg', 'month4', 'month3', 'month2', 'month1',
    'may', 'apr', 'mar', 'feb', 'jan', 'dec', 'nov', 'oct'
  ];

  // Map each subject to its latest recorded numerical score
  const subjectScores: Record<string, number> = {};

  // Case A: grades is formatted as grades[periodId][subjectId] = score
  for (const p of priorityPeriods) {
    const periodMap = (grades as any)[p];
    if (periodMap && typeof periodMap === 'object') {
      for (const [subjKey, val] of Object.entries(periodMap)) {
        if (subjectScores[subjKey] === undefined && val !== undefined && val !== null && val !== '') {
          const num = Number(val);
          if (!isNaN(num) && num >= 0 && num <= 100) {
            subjectScores[subjKey] = num;
          }
        }
      }
    }
  }

  // Case B: grades is formatted as grades[subjectId][periodId] or grades[subjectId] = score
  for (const [key, val] of Object.entries(grades)) {
    if (priorityPeriods.includes(key)) continue; // Already processed as period in Case A

    if (subjectScores[key] === undefined) {
      if (typeof val === 'number') {
        if (val >= 0 && val <= 100) subjectScores[key] = val;
      } else if (typeof val === 'string' && val.trim() !== '') {
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= 100) subjectScores[key] = num;
      } else if (val && typeof val === 'object') {
        for (const p of priorityPeriods) {
          const innerVal = (val as any)[p];
          if (innerVal !== undefined && innerVal !== null && innerVal !== '') {
            const num = Number(innerVal);
            if (!isNaN(num) && num >= 0 && num <= 100) {
              subjectScores[key] = num;
              break;
            }
          }
        }
      }
    }
  }

  const failingSubjects: string[] = [];
  let totalScore = 0;
  let evaluatedCount = 0;
  let passingSubjectsCount = 0;

  for (const [subjKey, score] of Object.entries(subjectScores)) {
    evaluatedCount++;
    totalScore += score;
    if (score < passScore) {
      failingSubjects.push(subjKey);
    } else {
      passingSubjectsCount++;
    }
  }

  // CRITICAL: If no subjects have scores, OR all scores are 0, OR passingSubjectsCount === 0:
  // The student CANNOT be passed! They are failed (درجات صفر / غير مرصودة).
  if (evaluatedCount === 0 || totalScore === 0 || passingSubjectsCount === 0) {
    return {
      status: 'failed',
      failingSubjectsCount: Math.max(1, failingSubjects.length),
      failingSubjects: failingSubjects.length > 0 ? failingSubjects : ['درجات صفر في كل المواد'],
      average: 0,
      evaluatedSubjectsCount: evaluatedCount,
      hasGrades: evaluatedCount > 0
    };
  }

  const average = Math.round((totalScore / evaluatedCount) * 10) / 10;
  const failingCount = failingSubjects.length;

  let status: 'passed' | 'conditional' | 'failed' = 'passed';
  if (failingCount === 0 && average >= passScore) {
    status = 'passed';
  } else if (failingCount <= 2) {
    status = 'conditional';
  } else {
    status = 'failed';
  }

  return {
    status,
    failingSubjectsCount: failingCount,
    failingSubjects,
    average,
    evaluatedSubjectsCount: evaluatedCount,
    hasGrades: true
  };
}

/**
 * Builds the initial promotion rules for all available saved lists in the school.
 */
export function generateInitialPromotionRules(savedLists: any[]): ClassPromotionRule[] {
  return savedLists.map(list => {
    const sampleStudent = list.students?.[0];
    const detectedGrade = sampleStudent?.grade || list.name || '';
    const nextInfo = getNextGradeInfo(detectedGrade, 'scientific');
    const suggestedName = suggestNextClassName(list.name, detectedGrade, nextInfo.nextGrade);

    return {
      sourceListId: list.id,
      sourceClassName: list.name,
      sourceGrade: detectedGrade,
      targetGrade: nextInfo.nextGrade,
      targetClassName: suggestedName,
      isGraduation: nextInfo.isGraduating,
      graduationLabel: nextInfo.graduationLabel,
      enabled: true,
      studentCount: list.students?.length || 0,
      students: list.students || [],
      alternativeBranch: 'scientific'
    };
  });
}

/**
 * Executes the entire promotion pipeline:
 * 1. Archives current lists (Frozen Snapshot)
 * 2. Prepares new classes with promoted & retained students
 * 3. Updates student codes, financial records, and clears new grade books
 * 4. Persists the new academic state
 */
export async function executePromotionPipeline(params: {
  schoolId: string;
  schoolName: string;
  allCurrentLists: any[];
  classRules: ClassPromotionRule[];
  studentDecisions: Record<string, PromotionStudentDecision>;
  settings: PromotionSettings;
  onProgress?: (progress: number, stepName: string) => void;
}): Promise<PromotionResult> {
  const {
    schoolId,
    schoolName,
    allCurrentLists,
    classRules,
    studentDecisions,
    settings,
    onProgress
  } = params;

  const errors: string[] = [];
  let promotedCount = 0;
  let retainedCount = 0;
  let graduatedCount = 0;
  let archivedListsCount = 0;

  try {
    // -------------------------------------------------------------
    // 1. STEP A: Create Frozen Archive Snapshot
    // -------------------------------------------------------------
    if (settings.createArchiveSnapshot) {
      onProgress?.(15, 'إنشاء وتجميد الأرشيف للعام المنصرم...');
      
      const timestamp = new Date().toISOString();
      const archiveDateStr = `أرشيف ${settings.previousAcademicYear}`;

      for (const list of allCurrentLists) {
        // Only archive lists that have not already been archived
        if ((list as any).isArchived) continue;

        const archiveListId = `arch_${Date.now()}_${Math.floor(Math.random() * 10000)}_${list.id}`;
        const archivePayload = {
          ...list,
          id: archiveListId,
          name: `[أرشيف ${settings.previousAcademicYear}] ${list.name}`,
          schoolId,
          schoolName: schoolName || list.schoolName,
          date: archiveDateStr,
          isArchived: true,
          isArchive: true,
          archiveYear: settings.previousAcademicYear,
          archivedAt: timestamp,
          // Deep clone students with their historical grades & payments
          students: JSON.parse(JSON.stringify(list.students || []))
        };

        try {
          await academicService.saveList(schoolId, archivePayload);
          archivedListsCount++;
        } catch (e: any) {
          console.warn(`Could not save archive snapshot for list ${list.name}:`, e);
          errors.push(`فشل أرشفة ${list.name}: ${e.message}`);
        }
      }
    }

    onProgress?.(40, 'معالجة الطلاب وتوزيع الصفوف الجديدة...');

    // -------------------------------------------------------------
    // 2. STEP B: Organize Promoted, Retained, and Graduated Students
    // -------------------------------------------------------------
    // Key: targetClassName -> list of students
    const promotedListsMap = new Map<string, {
      className: string;
      grade: string;
      schoolId: string;
      schoolName: string;
      students: any[];
    }>();

    // Retained students bucket by current list
    const retainedListsMap = new Map<string, {
      listId: string;
      className: string;
      grade: string;
      students: any[];
    }>();

    // Graduated students collection
    const graduatedStudentsList: any[] = [];

    // Filter enabled rules
    const enabledRules = classRules.filter(r => r.enabled);

    for (const rule of enabledRules) {
      const currentList = allCurrentLists.find(l => l.id === rule.sourceListId);
      if (!currentList) continue;

      const sourceStudents = currentList.students || [];

      for (const stu of sourceStudents) {
        const studentCode = stu.student || stu.code;
        const decisionKey = `${rule.sourceListId}_${studentCode}`;
        
        // Default decision based on academic evaluation
        let decision: PromotionStudentDecision = studentDecisions[decisionKey];
        if (!decision) {
          const evalResult = evaluateStudentAcademicStatus(stu);
          if (rule.isGraduation && evalResult.status === 'passed') {
            decision = 'graduate';
          } else if (evalResult.status === 'passed') {
            decision = 'promote';
          } else if (evalResult.status === 'conditional') {
            decision = settings.handleConditionals === 'promote' ? 'promote' : 'retain';
          } else {
            decision = 'retain';
          }
        }

        if (decision === 'exclude') continue;

        // Deep copy student
        const processedStudent = { ...stu };

        // 1. Process Financial Policy
        if (settings.resetFinances) {
          const unpaid = Math.max(0, (processedStudent.totalAmount || 0) - (processedStudent.paidAmount || 0));
          if (settings.carryOverDebts && unpaid > 0) {
            processedStudent.previousDebt = unpaid;
            processedStudent.paidAmount = 0;
          } else {
            processedStudent.paidAmount = 0;
          }
          if (processedStudent.finance) {
            processedStudent.finance = {
              installments: [],
              transactions: []
            };
          }
        }

        // 2. Preserve Discounts
        if (!settings.keepDiscounts) {
          processedStudent.discountType = null;
          processedStudent.discountRate = 0;
        }

        // 3. Reset Grade Book for New Year
        if (settings.resetGrades) {
          processedStudent.grades = {};
          processedStudent.isTopStudent = false;
          processedStudent.topStudentPeriod = null;
        }

        // 4. Handle Decision Branch
        if (decision === 'graduate' || (rule.isGraduation && decision === 'promote')) {
          graduatedCount++;
          processedStudent.status = 'خريج';
          processedStudent.graduationYear = settings.previousAcademicYear;
          graduatedStudentsList.push(processedStudent);
        } else if (decision === 'promote') {
          promotedCount++;
          processedStudent.grade = rule.targetGrade;
          processedStudent.status = 'نشط';

          // Update code prefix if requested
          if (settings.updateStudentCodes && processedStudent.code) {
            processedStudent.code = healStudentCodePrefix(processedStudent.code, rule.targetGrade);
            processedStudent.student = processedStudent.code;
          }

          const targetKey = rule.targetClassName;
          if (!promotedListsMap.has(targetKey)) {
            promotedListsMap.set(targetKey, {
              className: rule.targetClassName,
              grade: rule.targetGrade,
              schoolId,
              schoolName: schoolName || currentList.schoolName,
              students: []
            });
          }
          promotedListsMap.get(targetKey)!.students.push(processedStudent);
        } else if (decision === 'retain') {
          retainedCount++;
          processedStudent.status = 'معيد';

          const retainedKey = rule.sourceListId;
          if (!retainedListsMap.has(retainedKey)) {
            retainedListsMap.set(retainedKey, {
              listId: rule.sourceListId,
              className: `${rule.sourceClassName} (المعيدون)`,
              grade: rule.sourceGrade,
              students: []
            });
          }
          retainedListsMap.get(retainedKey)!.students.push(processedStudent);
        }
      }
    }

    onProgress?.(70, 'حفظ القوائم والمجموعات الجديدة في النظام...');

    // -------------------------------------------------------------
    // 3. STEP C: Persist New Lists
    // -------------------------------------------------------------
    const createdLists: any[] = [];
    const dateStamp = `العام الدراسي ${settings.newAcademicYear}`;

    // A. Save Promoted Lists
    for (const [_, listGroup] of promotedListsMap.entries()) {
      if (listGroup.students.length === 0) continue;

      const newListId = `list_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const listPayload = {
        id: newListId,
        name: listGroup.className,
        school: listGroup.schoolName,
        schoolId: listGroup.schoolId,
        schoolName: listGroup.schoolName,
        date: dateStamp,
        academicYear: settings.newAcademicYear,
        students: listGroup.students,
        removedSubjects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await academicService.saveList(schoolId, listPayload);
        createdLists.push(listPayload);
      } catch (e: any) {
        console.error(`Failed to save promoted list ${listGroup.className}:`, e);
        errors.push(`فشل حفظ الشعبة: ${listGroup.className}`);
      }
    }

    // B. Save Retained Lists (if any students are repeating)
    for (const [_, retGroup] of retainedListsMap.entries()) {
      if (retGroup.students.length === 0) continue;

      const retListId = `list_retained_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const retPayload = {
        id: retListId,
        name: retGroup.className,
        school: schoolName,
        schoolId,
        schoolName,
        date: dateStamp,
        academicYear: settings.newAcademicYear,
        students: retGroup.students,
        removedSubjects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await academicService.saveList(schoolId, retPayload);
        createdLists.push(retPayload);
      } catch (e: any) {
        console.error(`Failed to save retained list ${retGroup.className}:`, e);
        errors.push(`فشل حفظ قائمة المعيدين: ${retGroup.className}`);
      }
    }

    // C. Save Graduated Students Archive list if any
    if (graduatedStudentsList.length > 0) {
      const gradListId = `list_graduates_${Date.now()}`;
      const gradPayload = {
        id: gradListId,
        name: `سجل الخريجين 🎓 (${settings.previousAcademicYear})`,
        school: schoolName,
        schoolId,
        schoolName,
        date: `تخرج دور ${settings.previousAcademicYear}`,
        academicYear: settings.previousAcademicYear,
        isGraduationList: true,
        students: graduatedStudentsList,
        removedSubjects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await academicService.saveList(schoolId, gradPayload);
        createdLists.push(gradPayload);
      } catch (e: any) {
        console.error(`Failed to save graduates list:`, e);
      }
    }

    onProgress?.(90, 'مزامنة حسابات الطلاب مع البوابة...');

    // -------------------------------------------------------------
    // 4. STEP D: Batch Sync All Active Students to SQL & Firestore
    // -------------------------------------------------------------
    const allActiveStudents = [
      ...Array.from(promotedListsMap.values()).flatMap(g => g.students),
      ...Array.from(retainedListsMap.values()).flatMap(g => g.students)
    ];

    if (allActiveStudents.length > 0) {
      try {
        await academicService.syncStudents(schoolId, allActiveStudents);
      } catch (e) {
        console.warn('Student sync warning:', e);
      }
    }

    // Log Activity in Audit Trail
    logActivity({
      action: 'ترحيل الطلاب السنوي',
      details: `تم ترحيل ${promotedCount} طالب بنجاح للعام الدراسي ${settings.newAcademicYear}، مع أرشفة ${archivedListsCount} قائمة سابقة، وبقاء ${retainedCount} معيد، وتخرج ${graduatedCount} طالب.`,
      targetId: schoolId,
      targetType: 'academic_promotion',
      targetName: `الترحيل إلى ${settings.newAcademicYear}`
    });

    onProgress?.(100, 'اكتمل الترحيل السنوي بنجاح!');

    return {
      promotedCount,
      retainedCount,
      graduatedCount,
      newListsCount: createdLists.length,
      archivedListsCount,
      promotedLists: createdLists,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    console.error('Promotion Execution Error:', error);
    throw new Error(error.message || 'حدث خطأ أثناء تنفيذ الترحيل السنوي');
  }
}
