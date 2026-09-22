
export type IntegritySeverity = 'critical' | 'high' | 'medium' | 'low';
export type IntegrityIssueType = 'stat_discrepancy' | 'orphan_code' | 'orphan_user' | 'invalid_school_reference' | 'mismatched_user_school' | 'orphan_parent' | 'unverified_school_parent' | 'unlinked_teacher' | 'orphan_schedule' | 'duplicate_code' | 'broken_foreign_key';

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
  storedStats: any;
  actualUsers: any;
  actualCodes: any;
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
    try {
      const res = await fetch('/api/admin/data-integrity/scan');
      if (!res.ok) throw new Error('فشل الفحص');
      this.lastReport = await res.json();
      return this.lastReport!;
    } finally {
      this.isAuditing = false;
    }
  }

  public async unlinkUserFromSchool(userId: string): Promise<void> {
    await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', recordId: userId, collectionName: 'users' })
    });
  }

  public async deleteOrphanUser(userId: string, collectionName: string = 'users'): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', recordId: userId, collectionName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف السجل المعزول');
    }
  }

  public async reassignUserToSchool(userId: string, schoolId: string, collectionName: string = 'users'): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reassign', recordId: userId, collectionName, targetSchoolId: schoolId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إسناد السجل للمدرسة');
    }
  }

  public async fixSingleStatDiscrepancy(schoolId: string, actualUsers?: any): Promise<void> {
    // Ignored in Postgres
  }

  public async fixMismatchedUser(userId: string, correctSchoolId: string): Promise<void> {
    return this.reassignUserToSchool(userId, correctSchoolId);
  }

  public async linkOrphanCode(codeDocId: string, schoolId: string): Promise<void> {
    return this.reassignCodeToSchool(codeDocId, schoolId);
  }
  
  public async deleteOrphanCode(codeDocId: string): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', recordId: codeDocId, collectionName: 'activation_codes' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف الكود المعزول');
    }
  }
  
  public async reassignCodeToSchool(codeDocId: string, schoolId: string, schoolName?: string): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reassign', recordId: codeDocId, collectionName: 'activation_codes', targetSchoolId: schoolId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل إعادة تعيين الكود للمدرسة');
    }
  }

  public async deleteOrphanSchedule(scheduleId: string): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', recordId: scheduleId, collectionName: 'class_schedules' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل حذف الجدول المعزول');
    }
  }

  public async unlinkOrphanParent(userId: string): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unlink_parent', recordId: userId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشل فك ارتباط كود الطالب التالف');
    }
  }

  public async cleanUnverifiedSchoolUsers(schoolId: string): Promise<number> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', collectionName: 'users', targetSchoolId: schoolId })
    });
    if (res.ok) {
      const d = await res.json();
      return d.count || 0;
    }
    return 0;
  }

  public async resetSingleSchoolCounters(schoolId: string): Promise<void> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_school_counters', recordId: schoolId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشلت إعادة ضبط عدادات المدرسة');
    }
  }

  public async resetEmptySchoolsCounters(): Promise<number> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_empty_schools' })
    });
    if (res.ok) {
      const d = await res.json();
      return d.count || 0;
    }
    return 0;
  }

  public async fixAllAutoFixableIssues(): Promise<any> {
    const res = await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fix_all' })
    });
    const data = await res.json();
    await this.runFullAudit();
    return {
      fixedStats: 0,
      fixedSchedules: 0,
      fixedMismatches: 0,
      fixedUnverified: 0,
      totalFixed: data.count || 0
    };
  }
}

export const dataIntegrityService = new DataIntegrityService();
