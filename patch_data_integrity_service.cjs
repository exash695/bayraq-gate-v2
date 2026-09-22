const fs = require('fs');

const content = `
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

  public async fixSingleStatDiscrepancy(schoolId: string, actualUsers?: any): Promise<void> {
    // Ignored in Postgres
  }

  public async fixMismatchedUser(userId: string, correctSchoolId: string): Promise<void> {}
  public async linkOrphanCode(codeDocId: string, schoolId: string): Promise<void> {}
  
  public async deleteOrphanCode(codeDocId: string): Promise<void> {
    await fetch('/api/admin/data-integrity/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', recordId: codeDocId, collectionName: 'activation_codes' })
    });
  }
  
  public async reassignCodeToSchool(codeDocId: string, schoolId: string, schoolName?: string): Promise<void> {}
  public async deleteOrphanSchedule(scheduleId: string): Promise<void> {}
  public async unlinkOrphanParent(userId: string): Promise<void> {}
  public async cleanUnverifiedSchoolUsers(schoolId: string): Promise<number> { return 0; }
  public async resetSingleSchoolCounters(schoolId: string): Promise<void> {}
  public async resetEmptySchoolsCounters(): Promise<number> { return 0; }

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
`;

fs.writeFileSync('src/services/dataIntegrityService.ts', content);
