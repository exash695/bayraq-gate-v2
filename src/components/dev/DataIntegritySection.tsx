import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Search,
  Building2,
  Users,
  Key,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Trash2,
  Link2,
  Wrench,
  AlertOctagon,
  CheckCheck,
  GraduationCap,
  UserCheck,
  Eye,
  UserX,
  ShieldAlert,
  Eraser,
  X
} from 'lucide-react';
import {
  dataIntegrityService,
  FullIntegrityReport,
  IntegrityIssue,
  SchoolAuditSummary,
  SchoolUserDetail
} from '../../services/dataIntegrityService';
import { logActivity } from '../../utils/auditLogger';
import { activationCodesService } from '../../services/activationCodesService';

export const DataIntegritySection: React.FC = () => {
  const [report, setReport] = useState<FullIntegrityReport | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [isResettingEmpty, setIsResettingEmpty] = useState(false);
  const [isSyncingCodes, setIsSyncingCodes] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'stat_discrepancy' | 'orphans' | 'schools'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [repairingMap, setRepairingMap] = useState<Record<string, boolean>>({});
  const [selectedSchoolMap, setSelectedSchoolMap] = useState<Record<string, string>>({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [inspectSchool, setInspectSchool] = useState<SchoolAuditSummary | null>(null);
  const [userListRoleFilter, setUserListRoleFilter] = useState<string>('all');

  const showSuccessBanner = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 5000);
  };

  const showErrorBanner = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => {
      setActionErrorMsg(null);
    }, 5000);
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const newReport = await dataIntegrityService.runFullAudit();
      setReport(newReport);
      if (inspectSchool) {
        const updatedInspected = newReport.schoolSummaries.find(s => s.schoolId === inspectSchool.schoolId);
        setInspectSchool(updatedInspected || null);
      }
      await logActivity({
        action: 'تشغيل فحص سلامة البيانات',
        details: `تم إجراء تدقيق شامل لـ ${newReport.totalSchoolsAudited} مدرسة واكتشاف ${newReport.totalIssuesCount} مسألة.`,
        targetType: 'system_integrity'
      });
    } catch (e: any) {
      console.error('Audit failed:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFixSingleStat = async (schoolId: string, actualUsers: any) => {
    setRepairingMap(prev => ({ ...prev, [schoolId]: true }));
    try {
      await dataIntegrityService.fixSingleStatDiscrepancy(schoolId, actualUsers);
      await logActivity({
        action: 'إصلاح عدادات مدرسة',
        details: `تمت مواءمة وتحديث عدادات المدرسة ID: ${schoolId}`,
        targetId: schoolId,
        targetType: 'school_stat_reconciliation'
      });
      showSuccessBanner(`تمت مواءمة وتحديث عدادات المدرسة (${schoolId}) بنجاح!`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
      if (inspectSchool && inspectSchool.schoolId === schoolId) {
        const up = updated.schoolSummaries.find(s => s.schoolId === schoolId);
        setInspectSchool(up || null);
      }
    } catch (e: any) {
      console.error('Failed to fix stat:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [schoolId]: false }));
    }
  };

  const handleCleanUnverifiedSchoolUsers = async (schoolId: string, schoolName: string) => {
    setRepairingMap(prev => ({ ...prev, [schoolId]: true }));
    try {
      const cleaned = await dataIntegrityService.cleanUnverifiedSchoolUsers(schoolId);
      await logActivity({
        action: 'تنظيف حسابات غير مرتبطة بالمدرسة',
        details: `تم فك ارتباط ${cleaned} حساب غير مطابق من مدرسة ${schoolName}`,
        targetId: schoolId,
        targetType: 'users'
      });
      showSuccessBanner(`تم بنجاح تنظيف وفك ارتباط (${cleaned}) حسابات غير مرتبطة بمدرسة (${schoolName}) وتحديث العدادات بدقة!`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
      if (inspectSchool && inspectSchool.schoolId === schoolId) {
        const up = updated.schoolSummaries.find(s => s.schoolId === schoolId);
        setInspectSchool(up || null);
      }
    } catch (e: any) {
      console.error('Failed to clean unverified users:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [schoolId]: false }));
    }
  };

  const handleResetSingleSchool = async (schoolId: string, schoolName: string) => {
    setRepairingMap(prev => ({ ...prev, [schoolId]: true }));
    try {
      await dataIntegrityService.resetSingleSchoolCounters(schoolId);
      await logActivity({
        action: 'تصفير عدادات مدرسة',
        details: `تم تصفير عدادات مدرسة ${schoolName} (ID: ${schoolId}) وإلغاء ارتباط أي حسابات عشوائية بها`,
        targetId: schoolId,
        targetType: 'schools'
      });
      showSuccessBanner(`تم تصفير عدادات مدرسة (${schoolName}) وتصفير حساباتها بنجاح!`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
      if (inspectSchool && inspectSchool.schoolId === schoolId) {
        const up = updated.schoolSummaries.find(s => s.schoolId === schoolId);
        setInspectSchool(up || null);
      }
    } catch (e: any) {
      console.error('Failed to reset school:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [schoolId]: false }));
    }
  };

  const handleResetEmptySchools = async () => {
    setIsResettingEmpty(true);
    try {
      const count = await dataIntegrityService.resetEmptySchoolsCounters();
      await logActivity({
        action: 'تصفير عدادات المدارس الفارغة',
        details: `تم تصفير عدادات ${count} مدرسة لا تملك أكواداً أو طلاباً`,
        targetType: 'system_integrity'
      });
      showSuccessBanner(`تم تصفير عدادات (${count}) مدرسة فارغة (0 كود و0 طالب) وإعادتها إلى الصفر التام بنجاح!`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.error('Failed to reset empty schools:', e);
    } finally {
      setIsResettingEmpty(false);
    }
  };

  const handleUnlinkUserFromSchool = async (userId: string, userName?: string) => {
    setRepairingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await dataIntegrityService.unlinkUserFromSchool(userId);
      await logActivity({
        action: 'فك ارتباط مستخدم من المدرسة',
        details: `تم فك ارتباط المستخدم [${userName || userId}] من المدرسة لتصحيح العدادات`,
        targetId: userId,
        targetType: 'users'
      });
      showSuccessBanner(`تم فك ارتباط المستخدم [${userName || userId}] من المدرسة بنجاح!`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
      if (inspectSchool) {
        const up = updated.schoolSummaries.find(s => s.schoolId === inspectSchool.schoolId);
        setInspectSchool(up || null);
      }
    } catch (e: any) {
      console.error('Failed to unlink user:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteOrphanCode = async (codeDocId: string, codeVal?: string) => {
    setRepairingMap(prev => ({ ...prev, [codeDocId]: true }));
    try {
      await dataIntegrityService.deleteOrphanCode(codeDocId);
      await logActivity({
        action: 'حذف كود تفعيل مهمل',
        details: `تم حذف كود التفعيل المعزول [${codeVal || codeDocId}] من النظام`,
        targetId: codeDocId,
        targetType: 'activation_code'
      });
      showSuccessBanner(`تم حذف كود التفعيل [${codeVal || codeDocId}] بنجاح`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.error('Failed to delete code:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [codeDocId]: false }));
    }
  };

  const handleReassignCode = async (codeDocId: string, schoolId: string, codeVal?: string) => {
    if (!schoolId) return;
    setRepairingMap(prev => ({ ...prev, [codeDocId]: true }));
    try {
      const schoolObj = report?.validSchools?.find(s => s.id === schoolId);
      await dataIntegrityService.reassignCodeToSchool(codeDocId, schoolId, schoolObj?.name);
      await logActivity({
        action: 'إعادة تعيين كود لمدرسة',
        details: `تم ربط ونقل الكود [${codeVal || codeDocId}] إلى مدرسة: ${schoolObj?.name || schoolId}`,
        targetId: codeDocId,
        targetType: 'activation_code'
      });
      showSuccessBanner(`تم نقل وتعيين الكود إلى مدرسة (${schoolObj?.name || schoolId}) بنجاح`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.error('Failed to reassign code:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [codeDocId]: false }));
    }
  };

  const handleLinkOrphanCode = async (codeDocId: string, schoolId: string) => {
    setRepairingMap(prev => ({ ...prev, [codeDocId]: true }));
    try {
      await dataIntegrityService.linkOrphanCode(codeDocId, schoolId);
      await logActivity({
        action: 'ربط كود تفعيل بمدرسة',
        details: `تم ربط الكود docId: ${codeDocId} بالمدرسة ID: ${schoolId}`,
        targetId: codeDocId,
        targetType: 'activation_code'
      });
      showSuccessBanner(`تم ربط الكود بالمدرسة (${schoolId}) بنجاح`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.error('Failed to link code:', e);
    } finally {
      setRepairingMap(prev => ({ ...prev, [codeDocId]: false }));
    }
  };

  const handleDeleteOrphanSchedule = async (scheduleId: string) => {
    setRepairingMap(prev => ({ ...prev, [scheduleId]: true }));
    try {
      await dataIntegrityService.deleteOrphanSchedule(scheduleId);
      await logActivity({
        action: 'حذف جدول مهمل',
        details: `تم حذف جدول حصص تابع لمدرسة ملغية ID: ${scheduleId}`,
        targetId: scheduleId,
        targetType: 'class_schedule'
      });
      showSuccessBanner('تم تنظيف وحذف جدول الحصص المهمل بنجاح');
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.warn('Notice: Failed to delete schedule:', e);
      showErrorBanner(e.message || 'فشل حذف الجدول المعزول');
    } finally {
      setRepairingMap(prev => ({ ...prev, [scheduleId]: false }));
    }
  };

  const handleFixMismatchedUser = async (userId: string, correctSchoolId: string) => {
    setRepairingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await dataIntegrityService.fixMismatchedUser(userId, correctSchoolId);
      await logActivity({
        action: 'مواءمة مدرسة المستخدم',
        details: `تمت مواءمة مدرسة المستخدم ID: ${userId} مع مدرسته الصحيحة ID: ${correctSchoolId}`,
        targetId: userId,
        targetType: 'user_school_alignment'
      });
      showSuccessBanner('تمت مواءمة وتصحيح مدرسة المستخدم بنجاح');
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.warn('Notice: Failed to fix mismatched user:', e);
      showErrorBanner(e.message || 'فشل مواءمة مدرسة المستخدم');
    } finally {
      setRepairingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteOrphanUser = async (userId: string, userName?: string, collectionName: string = 'users') => {
    setRepairingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await dataIntegrityService.deleteOrphanUser(userId, collectionName);
      await logActivity({
        action: 'حذف سجل معزول',
        details: `تم حذف السجل المعزول [${userName || userId}] من (${collectionName})`,
        targetId: userId,
        targetType: collectionName
      });
      showSuccessBanner(`تم حل المشكلة وحذف السجل [${userName || userId}] بنجاح`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.warn('Notice: Failed to delete user:', e);
      showErrorBanner(e.message || 'فشل حذف السجل المعزول');
    } finally {
      setRepairingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleReassignUser = async (userId: string, schoolId: string, userName?: string, collectionName: string = 'users') => {
    if (!schoolId) return;
    setRepairingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await dataIntegrityService.reassignUserToSchool(userId, schoolId, collectionName);
      const schoolObj = report?.validSchools?.find(s => s.id === schoolId);
      await logActivity({
        action: 'إسناد سجل لمدرسة',
        details: `تم إسناد السجل [${userName || userId}] إلى مدرسة: ${schoolObj?.name || schoolId}`,
        targetId: userId,
        targetType: collectionName
      });
      showSuccessBanner(`تم حل المشكلة وإسناد السجل إلى مدرسة (${schoolObj?.name || schoolId}) بنجاح`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.warn('Notice: Failed to reassign user:', e);
      showErrorBanner(e.message || 'فشل إسناد السجل للمدرسة');
    } finally {
      setRepairingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDirectSolveIssue = async (issue: IntegrityIssue) => {
    const recordId = issue.affectedRecordId;
    setRepairingMap(prev => ({ ...prev, [recordId]: true }));
    try {
      if (issue.affectedCollection === 'students' || issue.type === 'orphan_student') {
        await dataIntegrityService.deleteOrphanUser(recordId, 'students');
        showSuccessBanner(`تم حل المشكلة بنجاح: تم حذف سجل الطالب غير المرتبط`);
      } else if (issue.affectedCollection === 'teachers' || issue.type === 'unlinked_teacher') {
        await dataIntegrityService.deleteOrphanUser(recordId, 'teachers');
        showSuccessBanner(`تم حل المشكلة بنجاح: تم حذف سجل المعلم غير المرتبط`);
      } else if (issue.affectedCollection === 'users' || issue.type === 'orphan_user') {
        await dataIntegrityService.deleteOrphanUser(recordId, 'users');
        showSuccessBanner(`تم حل المشكلة بنجاح: تم حذف حساب المستخدم غير المرتبط`);
      } else if (issue.affectedCollection === 'activation_codes' || issue.type === 'orphan_code') {
        await dataIntegrityService.deleteOrphanCode(recordId);
        showSuccessBanner(`تم حل المشكلة بنجاح: تم حذف كود التفعيل المهمل`);
      } else if (issue.type === 'orphan_schedule') {
        await dataIntegrityService.deleteOrphanSchedule(recordId);
        showSuccessBanner(`تم حل المشكلة بنجاح: تم حذف جدول الحصص المهمل`);
      } else if (issue.type === 'orphan_parent') {
        await dataIntegrityService.unlinkOrphanParent(recordId);
        showSuccessBanner(`تم حل المشكلة بنجاح: تم فك ارتباط كود الطالب التالف`);
      } else if (issue.type === 'unverified_school_parent') {
        await dataIntegrityService.unlinkUserFromSchool(recordId);
        showSuccessBanner(`تم حل المشكلة بنجاح: تم فك ارتباط الحساب غير المؤكد`);
      } else if (issue.type === 'mismatched_user_school' && issue.meta?.correctSchoolId) {
        await dataIntegrityService.fixMismatchedUser(recordId, issue.meta.correctSchoolId);
        showSuccessBanner(`تم حل المشكلة بنجاح: تمت مواءمة مدرسة المستخدم`);
      } else if (issue.type === 'stat_discrepancy' && issue.meta?.actualUserStats) {
        await dataIntegrityService.fixSingleStatDiscrepancy(recordId, issue.meta.actualUserStats);
        showSuccessBanner(`تمت مواءمة وتحديث عدادات المدرسة بنجاح`);
      } else {
        await fetch('/api/admin/data-integrity/fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', recordId, collectionName: issue.affectedCollection })
        });
        showSuccessBanner(`تم حل المشكلة بنجاح`);
      }

      await logActivity({
        action: 'حل مسألة في سلامة البيانات',
        details: `${issue.title} (ID: ${recordId})`,
        targetId: recordId,
        targetType: issue.affectedCollection
      });

      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.error('Failed to solve issue:', e);
      showErrorBanner(e.message || 'فشل حل المشكلة');
    } finally {
      setRepairingMap(prev => ({ ...prev, [recordId]: false }));
    }
  };

  const handleUnlinkOrphanParent = async (userId: string) => {
    setRepairingMap(prev => ({ ...prev, [userId]: true }));
    try {
      await dataIntegrityService.unlinkOrphanParent(userId);
      await logActivity({
        action: 'فك ارتباط كود طالب غير صالح',
        details: `تمت إزالة كود الطالب غير الصالح من حساب ولي الأمر ID: ${userId}`,
        targetId: userId,
        targetType: 'users'
      });
      showSuccessBanner('تم فك ارتباط الكود التالف من حساب ولي الأمر بنجاح');
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.warn('Notice: Failed to unlink parent:', e);
      showErrorBanner(e.message || 'فشل فك ارتباط الكود التالف');
    } finally {
      setRepairingMap(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSyncCodesToSql = async () => {
    setIsSyncingCodes(true);
    try {
      console.log('Starting sync of activation codes...');
      const codes = await activationCodesService.fetchCodes();

      if (!codes || codes.length === 0) {
        showSuccessBanner('لا توجد أكواد تفعيل صالحة للمزامنة');
        return;
      }

      console.log(`Syncing ${codes.length} codes to SQL...`);
      const result = await activationCodesService.syncToSql(codes);
      console.log('Sync result:', result);
      
      await logActivity({
        action: 'مزامنة أكواد التفعيل إلى SQL',
        details: `تمت مزامنة ${result.synced || codes.length} كود تفعيل بنجاح`,
        targetType: 'system_integrity'
      });
      showSuccessBanner(`تمت مزامنة ${result.synced || codes.length} كود تفعيل مع قاعدة البيانات (PostgreSQL)`);
      
      if (result.failed > 0) {
        setTimeout(() => showSuccessBanner(`فشلت مزامنة ${result.failed} كود بسبب التكرار أو أخطاء`), 4000);
      }
      
      handleRunAudit();
    } catch (e: any) {
      console.error('Error syncing codes:', e);
      showErrorBanner('فشلت مزامنة أكواد التفعيل: ' + e.message);
    } finally {
      setIsSyncingCodes(false);
    }
  };

  const handleFixAllAutoFixable = async () => {
    setIsBatchFixing(true);
    try {
      const result = await dataIntegrityService.fixAllAutoFixableIssues();
      await logActivity({
        action: 'إصلاح تلقائي جماعي',
        details: `تم إصلاح ${result.totalFixed} مسألة تلقائياً (${result.fixedStats} عدادات، ${result.fixedSchedules} جداول، ${result.fixedMismatches} مستخدمين).`,
        targetType: 'system_integrity'
      });
      showSuccessBanner(`تم تنفيذ الإصلاح التلقائي بنجاح! تم حل (${result.totalFixed}) مسألة.`);
      const updated = await dataIntegrityService.runFullAudit();
      setReport(updated);
    } catch (e: any) {
      console.error('Batch fix failed:', e);
    } finally {
      setIsBatchFixing(false);
    }
  };

  const filteredIssues = report
    ? report.issues.filter(issue => {
        if (activeFilter === 'critical') {
          if (issue.severity !== 'critical' && issue.severity !== 'high') return false;
        } else if (activeFilter === 'stat_discrepancy') {
          if (issue.type !== 'stat_discrepancy') return false;
        } else if (activeFilter === 'orphans') {
          if (issue.type !== 'orphan_code' && issue.type !== 'orphan_user' && issue.type !== 'orphan_parent' && issue.type !== 'invalid_school_reference') return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = issue.title.toLowerCase().includes(q);
          const matchDesc = issue.description.toLowerCase().includes(q);
          const matchSchool = issue.affectedSchoolName?.toLowerCase().includes(q) || false;
          const matchRecord = issue.affectedRecordId.toLowerCase().includes(q);
          return matchTitle || matchDesc || matchSchool || matchRecord;
        }
        return true;
      })
    : [];

  const autoFixableCount = report
    ? report.issues.filter(
        i =>
          i.type === 'stat_discrepancy' ||
          i.type === 'orphan_schedule' ||
          i.type === 'mismatched_user_school' ||
          i.type === 'orphan_user' ||
          i.type === 'orphan_student' ||
          i.type === 'unlinked_teacher' ||
          i.type === 'orphan_code' ||
          i.affectedCollection === 'students' ||
          i.affectedCollection === 'teachers' ||
          i.affectedCollection === 'users' ||
          i.affectedCollection === 'activation_codes' ||
          i.fixable
      ).length
    : 0;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
            حرج (Critical)
          </span>
        );
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
            مرتفع (High)
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            متوسط (Medium)
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            منخفض (Low)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Toast Banner */}
      {actionSuccessMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-emerald-950/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCheck size={18} className="text-emerald-400" />
              </div>
              <span>{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Error Toast Banner */}
      {actionErrorMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-rose-950/90 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-300 text-xs font-bold shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle size={18} className="text-rose-400" />
              </div>
              <span>{actionErrorMsg}</span>
            </div>
            <button
              onClick={() => setActionErrorMsg(null)}
              className="w-8 h-8 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-indigo-950/40 to-neutral-900 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
              <ShieldCheck size={14} /> محرك فحص العلاقات والتكامل الهيكلي
            </div>
            <h2 className="text-xl font-black text-white">فحص سلامة البيانات وعزل المدارس</h2>
            <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
              استعلام حي لجميع جداول النظام للتحقق من سلامة المفاتيح الخارجية، مواءمة عدادات المدارس، واكتشاف ومعالجة الأكواد والمستخدمين المعزولين بأزرار إصلاح فورية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetEmptySchools}
              disabled={isResettingEmpty || isAuditing}
              className="px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white/90 font-bold text-xs transition-all border border-white/10 flex items-center gap-2 disabled:opacity-50"
              title="إعادة ضبط ومعايرة العدادات الإحصائية (طلاب/أكواد) للمدارس الفارغة لتصبح 0 ومنع أي أرقام وهمية دون حذف المدارس"
            >
              <Eraser size={15} className={isResettingEmpty ? 'animate-spin text-amber-400' : 'text-amber-400'} />
              {isResettingEmpty ? 'جاري معايرة وضبط العدادات...' : 'معايرة عدادات المدارس الفارغة (إزالة الوهمية)'}
            </button>

            {report && autoFixableCount > 0 && (
              <button
                onClick={handleFixAllAutoFixable}
                disabled={isBatchFixing || isAuditing}
                className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-xs transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Zap size={15} className={isBatchFixing ? 'animate-spin' : ''} />
                {isBatchFixing ? 'جاري الإصلاح التلقائي...' : `إصلاح تلقائي شامل (${autoFixableCount})`}
              </button>
            )}

            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isAuditing ? 'animate-spin' : ''} />
              {isAuditing ? 'جاري الفحص الميداني...' : 'فحص سلامة البيانات الآن'}
            </button>

            <button
              onClick={handleSyncCodesToSql}
              disabled={isSyncingCodes || isAuditing}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
              title="مزامنة جميع أكواد التفعيل في قاعدة بيانات PostgreSQL"
            >
              <RefreshCw size={16} className={isSyncingCodes ? 'animate-spin' : ''} />
              {isSyncingCodes ? 'جاري المزامنة...' : 'مزامنة الأكواد إلى SQL'}
            </button>
          </div>
        </div>

        {report && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/5 text-center">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] text-white/40 block">المدارس المفحوصة</span>
              <span className="text-lg font-black text-white font-mono">{report.totalSchoolsAudited}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] text-white/40 block">مدارس سليمة 100%</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{report.intactSchoolsCount}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] text-white/40 block">مدارس تحتاج ضبط</span>
              <span className="text-lg font-black text-amber-400 font-mono">{report.discrepantSchoolsCount}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] text-white/40 block">إجمالي المسائل</span>
              <span className="text-lg font-black text-rose-400 font-mono">{report.totalIssuesCount}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
              <span className="text-[10px] text-white/40 block">زمن الفحص</span>
              <span className="text-lg font-black text-indigo-400 font-mono">{report.durationMs} ms</span>
            </div>
          </div>
        )}
      </div>

      {!report && !isAuditing && (
        <div className="text-center py-16 bg-black/20 border border-white/5 rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <ShieldCheck size={32} />
          </div>
          <h3 className="text-base font-black text-white">لم يتم تشغيل فحص البيانات في هذه الجلسة</h3>
          <p className="text-xs text-white/40 max-w-md mx-auto">
            اضغط على زر "فحص سلامة البيانات الآن" للبدء في استعلام كافة الكولكشنز ومطابقتها للتأكد من سلامة العلاقات واكتشاف أي مسائل لحلها فوراً.
          </p>
          <button
            onClick={handleRunAudit}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all"
          >
            بدء التدقيق الآن
          </button>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                جميع المسائل ({report.issues.length})
              </button>
              <button
                onClick={() => setActiveFilter('critical')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'critical'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                حرجة وعالية ({report.criticalIssuesCount + report.highIssuesCount})
              </button>
              <button
                onClick={() => setActiveFilter('stat_discrepancy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'stat_discrepancy'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                تضارب العدادات ({report.discrepantSchoolsCount})
              </button>
              <button
                onClick={() => setActiveFilter('orphans')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'orphans'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                سجلات معزولة ({report.orphanCodesCount + report.orphanUsersCount + report.orphanParentsCount})
              </button>
              <button
                onClick={() => setActiveFilter('schools')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'schools'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                جدول المدارس ({report.schoolSummaries.length})
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="بحث في المسائل أو المدارس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-black/40 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* School Summaries View */}
          {activeFilter === 'schools' ? (
            <div className="space-y-4">
              {/* Summary Header Bar */}
              {(() => {
                const filteredSchoolSummaries = report.schoolSummaries.filter(school => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    school.schoolName.toLowerCase().includes(q) ||
                    school.schoolId.toLowerCase().includes(q)
                  );
                });

                const matchedCount = filteredSchoolSummaries.filter(s => !s.hasDiscrepancy).length;
                const discrepantCount = filteredSchoolSummaries.filter(s => s.hasDiscrepancy).length;

                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <Building2 size={16} className="text-emerald-400" />
                        <span>إجمالي المدارس المفحوصة: <strong className="text-white font-mono">{filteredSchoolSummaries.length}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                          <CheckCircle2 size={13} />
                          {matchedCount} متطابقة
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                          <AlertTriangle size={13} />
                          {discrepantCount} غير متطابقة
                        </span>
                      </div>
                    </div>

                    {filteredSchoolSummaries.length === 0 ? (
                      <div className="text-center py-16 bg-neutral-900/60 border border-white/5 rounded-3xl text-white/40 text-xs">
                        <Building2 size={32} className="text-white/20 mx-auto mb-2" />
                        لا توجد مدارس مطابقة لعبارة البحث الحالية.
                      </div>
                    ) : (
                      <>
                        {/* Mobile & Tablet Card Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:hidden">
                          {filteredSchoolSummaries.map(school => (
                            <div 
                              key={school.schoolId} 
                              className={`p-5 rounded-3xl border transition-all ${
                                school.hasDiscrepancy 
                                  ? 'bg-amber-950/20 border-amber-500/30 shadow-lg shadow-amber-950/20' 
                                  : 'bg-neutral-900/60 border-white/5 hover:border-white/10'
                              }`}
                            >
                              {/* Card Header */}
                              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Building2 size={16} className="text-emerald-400 shrink-0" />
                                    <h4 className="font-black text-white text-sm">{school.schoolName}</h4>
                                  </div>
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-black/40 text-[10px] text-white/50 font-mono border border-white/5">
                                    ID: {school.schoolId}
                                  </span>
                                </div>
                                {school.hasDiscrepancy ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30 shrink-0">
                                    <AlertTriangle size={11} /> غير متطابق
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
                                    <CheckCircle2 size={11} /> سليم ومطابق
                                  </span>
                                )}
                              </div>

                              {/* Discrepancies Details if any */}
                              {school.hasDiscrepancy && school.discrepancies.length > 0 && (
                                <div className="my-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                                    <Info size={12} /> التضاربات المرصودة:
                                  </div>
                                  <ul className="list-disc list-inside pr-1 space-y-0.5 text-amber-200/80">
                                    {school.discrepancies.map((disc, dIdx) => (
                                      <li key={dIdx}>{disc}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 4 Data Counters Grid */}
                              <div className="grid grid-cols-2 gap-2.5 my-3.5">
                                {/* Students */}
                                <div className={`p-3 rounded-2xl border ${
                                  school.storedStats.students !== school.actualUsers.students
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-black/30 border-white/5'
                                }`}>
                                  <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                                    <span className="flex items-center gap-1 font-bold text-white/80">
                                      <GraduationCap size={13} className="text-cyan-400" /> الطلاب
                                    </span>
                                    {school.storedStats.students === school.actualUsers.students ? (
                                      <span className="text-[9px] text-emerald-400 font-bold">مطابق ✓</span>
                                    ) : (
                                      <span className="text-[9px] text-amber-400 font-bold">تضارب ✗</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline justify-between pt-1">
                                    <div className="text-[10px] text-white/40">
                                      مخزن: <span className="font-mono text-white/70 font-bold">{school.storedStats.students}</span>
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                      فعلي: <span className={`font-mono font-black ${school.storedStats.students !== school.actualUsers.students ? 'text-amber-400' : 'text-emerald-400'}`}>{school.actualUsers.students}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Teachers */}
                                <div className={`p-3 rounded-2xl border ${
                                  school.storedStats.teachers !== school.actualUsers.teachers
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-black/30 border-white/5'
                                }`}>
                                  <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                                    <span className="flex items-center gap-1 font-bold text-white/80">
                                      <Users size={13} className="text-indigo-400" /> الأساتذة
                                    </span>
                                    {school.storedStats.teachers === school.actualUsers.teachers ? (
                                      <span className="text-[9px] text-emerald-400 font-bold">مطابق ✓</span>
                                    ) : (
                                      <span className="text-[9px] text-amber-400 font-bold">تضارب ✗</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline justify-between pt-1">
                                    <div className="text-[10px] text-white/40">
                                      مخزن: <span className="font-mono text-white/70 font-bold">{school.storedStats.teachers}</span>
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                      فعلي: <span className={`font-mono font-black ${school.storedStats.teachers !== school.actualUsers.teachers ? 'text-amber-400' : 'text-emerald-400'}`}>{school.actualUsers.teachers}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Parents */}
                                <div className={`p-3 rounded-2xl border ${
                                  school.storedStats.parents !== school.actualUsers.parents
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : (school.actualUsers.unverifiedParents > 0 ? 'bg-purple-950/20 border-purple-500/30' : 'bg-black/30 border-white/5')
                                }`}>
                                  <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                                    <span className="flex items-center gap-1 font-bold text-white/80">
                                      <UserCheck size={13} className="text-purple-400" /> أولياء الأمور
                                    </span>
                                    {school.storedStats.parents === school.actualUsers.parents ? (
                                      <span className="text-[9px] text-emerald-400 font-bold">مطابق ✓</span>
                                    ) : (
                                      <span className="text-[9px] text-amber-400 font-bold">تضارب ✗</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline justify-between pt-1">
                                    <div className="text-[10px] text-white/40">
                                      مخزن: <span className="font-mono text-white/70 font-bold">{school.storedStats.parents}</span>
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                      فعلي: <span className={`font-mono font-black ${school.storedStats.parents !== school.actualUsers.parents ? 'text-amber-400' : 'text-emerald-400'}`}>{school.actualUsers.parents}</span>
                                    </div>
                                  </div>
                                  {school.actualUsers.unverifiedParents > 0 && (
                                    <div className="mt-1.5 pt-1.5 border-t border-purple-500/20 flex items-center justify-between text-[9px] text-purple-300">
                                      <span>مؤكد: <strong className="font-mono text-emerald-400">{school.actualUsers.verifiedParents}</strong></span>
                                      <span className="text-amber-300 font-bold">غير مؤكد: <strong className="font-mono">{school.actualUsers.unverifiedParents}</strong></span>
                                    </div>
                                  )}
                                </div>

                                {/* Activation Codes */}
                                <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                                  <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                                    <span className="flex items-center gap-1 font-bold text-white/80">
                                      <Key size={13} className="text-amber-400" /> الأكواد
                                    </span>
                                    <span className="text-[9px] text-white/40 font-mono">
                                      {school.actualCodes.totalCodes > 0 ? `${Math.round((school.actualCodes.usedCodes / school.actualCodes.totalCodes) * 100)}% مستخدم` : '0 كود'}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between pt-1">
                                    <div className="text-[10px] text-white/40">
                                      مستخدم: <span className="font-mono text-white/80 font-bold">{school.actualCodes.usedCodes}</span>
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                      الإجمالي: <span className="font-mono text-white/80 font-bold">{school.actualCodes.totalCodes}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="space-y-2 pt-1">
                                <button
                                  onClick={() => setInspectSchool(school)}
                                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold text-white/80 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                  <Eye size={13} className="text-indigo-400" />
                                  تدقيق قائمة المستخدمين ({school.actualUsers.totalUsers})
                                </button>

                                {school.actualUsers.unverifiedParents > 0 && (
                                  <button
                                    onClick={() => handleCleanUnverifiedSchoolUsers(school.schoolId, school.schoolName)}
                                    disabled={repairingMap[school.schoolId]}
                                    className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-2xl text-xs font-bold text-purple-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                  >
                                    <UserX size={13} className={repairingMap[school.schoolId] ? 'animate-spin' : 'text-purple-400'} />
                                    {repairingMap[school.schoolId] ? 'جاري التنظيف...' : `تنظيف الحسابات غير المؤكدة (${school.actualUsers.unverifiedParents}) ⚡`}
                                  </button>
                                )}

                                {school.hasDiscrepancy && (
                                  <button
                                    onClick={() => handleFixSingleStat(school.schoolId, school.actualUsers)}
                                    disabled={repairingMap[school.schoolId]}
                                    className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 rounded-2xl text-xs font-bold text-amber-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                  >
                                    <RefreshCw size={13} className={repairingMap[school.schoolId] ? 'animate-spin' : ''} />
                                    {repairingMap[school.schoolId] ? 'جارٍ مواءمة العدادات...' : 'مواءمة وتحديث عدادات المدرسة ⚡'}
                                  </button>
                                )}

                                {(school.actualCodes.totalCodes === 0 && school.actualUsers.students === 0) && (
                                  <button
                                    onClick={() => handleResetSingleSchool(school.schoolId, school.schoolName)}
                                    disabled={repairingMap[school.schoolId]}
                                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-2xl text-xs font-bold text-amber-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                                  >
                                    <Eraser size={13} className={repairingMap[school.schoolId] ? 'animate-spin' : 'text-amber-400'} />
                                    {repairingMap[school.schoolId] ? 'جاري تصفير المدرسة...' : 'تصفير عدادات المدرسة إلى الصفر ⚡'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Wide Desktop Clean Table */}
                        <div className="hidden xl:block bg-neutral-900/60 border border-white/5 rounded-3xl p-6 overflow-x-auto shadow-xl">
                          <table className="w-full text-right text-xs whitespace-nowrap min-w-[950px]">
                            <thead>
                              <tr className="border-b border-white/10 text-white/40 font-bold text-[11px]">
                                <th className="pb-3 pr-2">المدرسة</th>
                                <th className="pb-3 px-3 text-center">الطلاب (مخزن / فعلي)</th>
                                <th className="pb-3 px-3 text-center">الأساتذة (مخزن / فعلي)</th>
                                <th className="pb-3 px-3 text-center">أولياء الأمور (مخزن / فعلي)</th>
                                <th className="pb-3 px-3 text-center">أكواد المدرسة (مستخدمة / إجمالي)</th>
                                <th className="pb-3 px-3 text-center">الحالة</th>
                                <th className="pb-3 pl-2 text-left">إجراءات المدرسة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {filteredSchoolSummaries.map(school => (
                                <tr key={school.schoolId} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-4 pr-2">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                                        <Building2 size={15} />
                                      </div>
                                      <div>
                                        <span className="font-bold text-white block text-xs">{school.schoolName}</span>
                                        <span className="text-[10px] text-white/40 font-mono">ID: {school.schoolId}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-3 text-center font-mono">
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] ${
                                      school.storedStats.students !== school.actualUsers.students
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-black'
                                        : 'bg-black/30 border-white/5 text-white/80'
                                    }`}>
                                      <span className="text-white/40 text-[9px]">م:</span>{school.storedStats.students}
                                      <span className="text-white/20">|</span>
                                      <span className="text-white/40 text-[9px]">ف:</span>{school.actualUsers.students}
                                    </div>
                                  </td>
                                  <td className="py-4 px-3 text-center font-mono">
                                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] ${
                                      school.storedStats.teachers !== school.actualUsers.teachers
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-black'
                                        : 'bg-black/30 border-white/5 text-white/80'
                                    }`}>
                                      <span className="text-white/40 text-[9px]">م:</span>{school.storedStats.teachers}
                                      <span className="text-white/20">|</span>
                                      <span className="text-white/40 text-[9px]">ف:</span>{school.actualUsers.teachers}
                                    </div>
                                  </td>
                                  <td className="py-4 px-3 text-center font-mono">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] ${
                                        school.storedStats.parents !== school.actualUsers.parents
                                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-black'
                                          : 'bg-black/30 border-white/5 text-white/80'
                                      }`}>
                                        <span className="text-white/40 text-[9px]">م:</span>{school.storedStats.parents}
                                        <span className="text-white/20">|</span>
                                        <span className="text-white/40 text-[9px]">ف:</span>{school.actualUsers.parents}
                                      </div>
                                      {school.actualUsers.unverifiedParents > 0 && (
                                        <span className="text-[9px] text-amber-400/90 font-sans font-bold">
                                          ({school.actualUsers.unverifiedParents} غير مؤكد)
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-3 text-center font-mono">
                                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/30 border border-white/5 text-white/80 text-[11px]">
                                      <span className="text-white/40 text-[9px]">مستخدم:</span>{school.actualCodes.usedCodes}
                                      <span className="text-white/20">/</span>
                                      <span className="text-white/40 text-[9px]">إجمالي:</span>{school.actualCodes.totalCodes}
                                    </div>
                                  </td>
                                  <td className="py-4 px-3 text-center">
                                    {school.hasDiscrepancy ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                                        <AlertTriangle size={11} /> غير متطابق
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                                        <CheckCircle2 size={11} /> سليم ومطابق
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 pl-2 text-left">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => setInspectSchool(school)}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-white/80 transition-all inline-flex items-center gap-1.5 shadow-sm"
                                        title="عرض وتدقيق قائمة جميع مستخدمي هذه المدرسة"
                                      >
                                        <Eye size={12} className="text-indigo-400" />
                                        تدقيق المستخدمين ({school.actualUsers.totalUsers})
                                      </button>

                                      {school.actualUsers.unverifiedParents > 0 && (
                                        <button
                                          onClick={() => handleCleanUnverifiedSchoolUsers(school.schoolId, school.schoolName)}
                                          disabled={repairingMap[school.schoolId]}
                                          className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-xl text-[11px] font-bold text-purple-200 transition-all disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
                                          title="فك ارتباط الحسابات الوهمية أو غير المؤكدة من هذه المدرسة"
                                        >
                                          <UserX size={11} className={repairingMap[school.schoolId] ? 'animate-spin' : ''} />
                                          تنظيف ({school.actualUsers.unverifiedParents})
                                        </button>
                                      )}

                                      {school.hasDiscrepancy && (
                                        <button
                                          onClick={() => handleFixSingleStat(school.schoolId, school.actualUsers)}
                                          disabled={repairingMap[school.schoolId]}
                                          className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-[11px] font-bold text-amber-200 transition-all disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
                                        >
                                          <RefreshCw size={11} className={repairingMap[school.schoolId] ? 'animate-spin' : ''} />
                                          مواءمة العدادات
                                        </button>
                                      )}

                                      {(school.actualCodes.totalCodes === 0 && school.actualUsers.students === 0) && (
                                        <button
                                          onClick={() => handleResetSingleSchool(school.schoolId, school.schoolName)}
                                          disabled={repairingMap[school.schoolId]}
                                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-xl text-[11px] font-bold text-amber-300 transition-all disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
                                          title="تصفير عدادات هذه المدرسة وإعادتها للصفر التام"
                                        >
                                          <Eraser size={11} className={repairingMap[school.schoolId] ? 'animate-spin' : 'text-amber-400'} />
                                          تصفير المدرسة
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            /* Issues List View */
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-16 bg-black/20 border border-white/5 rounded-3xl text-white/40 text-xs">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  لا توجد مشاكل مطابقة لهذا الفلتر! كافة البيانات سليمة.
                </div>
              ) : (
                <>
                  {/* Quick Action Top Bar */}
                  <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert size={18} className="text-amber-400" />
                      <span className="text-xs font-bold text-white">
                        تم رصد ({filteredIssues.length}) مسألة بحاجة إلى معالجة
                      </span>
                    </div>
                    {autoFixableCount > 0 && (
                      <button
                        onClick={handleFixAllAutoFixable}
                        disabled={isBatchFixing || isAuditing}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 disabled:opacity-50"
                      >
                        <Zap size={14} className={isBatchFixing ? 'animate-spin' : ''} />
                        {isBatchFixing ? 'جاري الإصلاح الشامل...' : `حل كافة المشاكل دفعة واحدة (${autoFixableCount}) ⚡`}
                      </button>
                    )}
                  </div>

                  {filteredIssues.map(issue => {
                  const isProcessing = Boolean(repairingMap[issue.affectedRecordId]);
                  const currentSelectedSchool = selectedSchoolMap[issue.id] || (report.validSchools?.[0]?.id || '');

                  return (
                    <div
                      key={issue.id}
                      className="bg-neutral-900/70 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/40 transition-all space-y-3 backdrop-blur-md shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {getSeverityBadge(issue.severity)}
                          <h4 className="text-xs font-black text-white">{issue.title}</h4>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono">
                          {issue.affectedCollection} • ID: {issue.affectedRecordId}
                        </span>
                      </div>

                      <p className="text-xs text-white/80 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 font-mono">
                        {issue.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-amber-300/90">
                          <span className="font-bold block text-amber-400 text-[10px] mb-1">السبب المحتمل:</span>
                          {issue.probableCause}
                        </div>
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl text-indigo-300/90">
                          <span className="font-bold block text-indigo-400 text-[10px] mb-1">الإجراء المقترح:</span>
                          {issue.suggestedAction}
                        </div>
                      </div>

                      {/* Dynamic Action Buttons by Issue Type */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-end gap-2.5">
                        {/* 1. Stat Discrepancy Action */}
                        {issue.type === 'stat_discrepancy' && issue.meta?.actualUserStats && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleFixSingleStat(issue.affectedRecordId, issue.meta.actualUserStats)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حل المشكلة: مواءمة وتحديث العدادات فوراً ⚡
                            </button>
                            <button
                              onClick={() => handleResetSingleSchool(issue.affectedRecordId, issue.title)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-amber-300 border border-white/10 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                              title="معايرة العدادات إلى 0 لإزالة الأرقام الوهمية"
                            >
                              <Eraser size={13} className={isProcessing ? 'animate-spin' : 'text-amber-400'} />
                              معايرة العدادات للصفر (0)
                            </button>
                          </div>
                        )}

                        {/* Unverified School Parent Action */}
                        {issue.type === 'unverified_school_parent' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDirectSolveIssue(issue)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حل المسألة فوراً ⚡
                            </button>
                            <button
                              onClick={() => handleUnlinkUserFromSchool(issue.affectedRecordId, issue.meta?.userName)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 bg-purple-600/90 hover:bg-purple-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <UserX size={13} className={isProcessing ? 'animate-spin' : ''} />
                              فك ارتباط الحساب من المدرسة
                            </button>
                            <button
                              onClick={() => handleDeleteOrphanUser(issue.affectedRecordId, issue.meta?.userName)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Trash2 size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حذف الحساب نهائياً
                            </button>
                          </div>
                        )}

                        {/* 2. Activation Code with invalid school or orphan code */}
                        {(issue.affectedCollection === 'activation_codes' || issue.type === 'orphan_code' || issue.type === 'invalid_school_reference') &&
                          issue.affectedCollection === 'activation_codes' && (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handleDirectSolveIssue(issue)}
                                disabled={isProcessing}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                                حل المسألة فوراً ⚡
                              </button>
                              {/* Reassign to valid school selector */}
                              {report.validSchools && report.validSchools.length > 0 && (
                                <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2 py-1">
                                  <select
                                    value={currentSelectedSchool}
                                    onChange={(e) =>
                                      setSelectedSchoolMap(prev => ({
                                        ...prev,
                                        [issue.id]: e.target.value
                                      }))
                                    }
                                    className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer max-w-[140px] truncate"
                                  >
                                    {report.validSchools.map(s => (
                                      <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleReassignCode(issue.affectedRecordId, currentSelectedSchool, issue.meta?.code)}
                                    disabled={isProcessing}
                                    className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Link2 size={11} />
                                    نقل إلى المدرسة
                                  </button>
                                </div>
                              )}

                              {/* Direct Delete Code Button */}
                              <button
                                onClick={() => handleDeleteOrphanCode(issue.affectedRecordId, issue.meta?.code)}
                                disabled={isProcessing}
                                className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <Trash2 size={13} className={isProcessing ? 'animate-spin' : ''} />
                                حذف الكود المهمل فوراً
                              </button>
                            </div>
                          )}

                        {/* 3. Orphan Schedule Action */}
                        {issue.type === 'orphan_schedule' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDirectSolveIssue(issue)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حل المسألة فوراً ⚡
                            </button>
                            <button
                              onClick={() => handleDeleteOrphanSchedule(issue.affectedRecordId)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Trash2 size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حذف جدول الحصص المهمل
                            </button>
                          </div>
                        )}

                        {/* 4. Mismatched User School Action */}
                        {issue.type === 'mismatched_user_school' && issue.meta?.correctSchoolId && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDirectSolveIssue(issue)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حل المسألة فوراً ⚡
                            </button>
                            <button
                              onClick={() => handleFixMismatchedUser(issue.affectedRecordId, issue.meta.correctSchoolId)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              مواءمة مدرسة الحساب مع كود التسجيل
                            </button>
                          </div>
                        )}

                        {/* 5. Orphan Student / Teacher / User Actions */}
                        {(issue.affectedCollection === 'students' ||
                          issue.affectedCollection === 'teachers' ||
                          issue.affectedCollection === 'users' ||
                          issue.type === 'orphan_user' ||
                          issue.type === 'orphan_student' ||
                          issue.type === 'unlinked_teacher') &&
                          issue.type !== 'orphan_parent' &&
                          issue.type !== 'mismatched_user_school' &&
                          issue.type !== 'unverified_school_parent' && (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Prominent Solve Issue Button */}
                            <button
                              onClick={() => handleDirectSolveIssue(issue)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                              title="تنفيذ الإجراء المقترح فوراً"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              {issue.suggestedAction ? `حل المشكلة (${issue.suggestedAction}) ⚡` : 'حل المشكلة فوراً ⚡'}
                            </button>

                            {report.validSchools && report.validSchools.length > 0 && (
                              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2 py-1">
                                <select
                                  value={currentSelectedSchool}
                                  onChange={(e) =>
                                    setSelectedSchoolMap(prev => ({
                                      ...prev,
                                      [issue.id]: e.target.value
                                    }))
                                  }
                                  className="bg-transparent text-white text-[11px] font-bold focus:outline-none cursor-pointer max-w-[140px] truncate"
                                >
                                  {report.validSchools.map(s => (
                                    <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                                      {s.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleReassignUser(issue.affectedRecordId, currentSelectedSchool, issue.meta?.userName, issue.affectedCollection)}
                                  disabled={isProcessing}
                                  className="px-2.5 py-1 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Link2 size={11} />
                                  إسناد للمدرسة
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => handleDeleteOrphanUser(issue.affectedRecordId, issue.meta?.userName, issue.affectedCollection)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Trash2 size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حذف نهائي
                            </button>
                          </div>
                        )}

                        {/* 6. Orphan Parent Action */}
                        {issue.type === 'orphan_parent' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDirectSolveIssue(issue)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حل المشكلة فوراً ⚡
                            </button>
                            <button
                              onClick={() => handleUnlinkOrphanParent(issue.affectedRecordId)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Wrench size={13} className={isProcessing ? 'animate-spin' : ''} />
                              فك ارتباط كود الطالب التالف
                            </button>
                          </div>
                        )}

                        {/* 7. Duplicate Code Action */}
                        {issue.type === 'duplicate_code' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDirectSolveIssue(issue)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Zap size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حل المشكلة فوراً ⚡
                            </button>
                            <button
                              onClick={() => handleDeleteOrphanCode(issue.affectedRecordId, issue.meta?.code)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Trash2 size={13} className={isProcessing ? 'animate-spin' : ''} />
                              حذف السجل المكرر
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            </div>
          )}
        </div>
      )}

      {/* Inspect School Users Modal */}
      {inspectSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">تدقيق مستخدمي مدرسة: {inspectSchool.schoolName}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50 font-mono mt-0.5">
                    <span>ID: {inspectSchool.schoolId}</span>
                    <span>•</span>
                    <span>إجمالي المسجلين: {inspectSchool.usersList?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {inspectSchool.actualUsers.unverifiedParents > 0 && (
                  <button
                    onClick={() => handleCleanUnverifiedSchoolUsers(inspectSchool.schoolId, inspectSchool.schoolName)}
                    disabled={repairingMap[inspectSchool.schoolId]}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                  >
                    <UserX size={13} className={repairingMap[inspectSchool.schoolId] ? 'animate-spin' : ''} />
                    تنظيف كافة غير المؤكدين ({inspectSchool.actualUsers.unverifiedParents})
                  </button>
                )}
                <button
                  onClick={() => setInspectSchool(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-2 bg-black/20">
              {[
                { id: 'all', label: `الكل (${inspectSchool.usersList?.length || 0})` },
                { id: 'parent', label: `أولياء الأمور (${inspectSchool.actualUsers.parents})` },
                { id: 'student', label: `الطلاب (${inspectSchool.actualUsers.students})` },
                { id: 'teacher', label: `الأساتذة (${inspectSchool.actualUsers.teachers})` },
                { id: 'unverified', label: `غير مؤكدين (${inspectSchool.actualUsers.unverifiedParents})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUserListRoleFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    userListRoleFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Users Table / List */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              {(() => {
                const users = (inspectSchool.usersList || []).filter(u => {
                  if (userListRoleFilter === 'unverified') return u.isVerifiedForSchool === false;
                  if (userListRoleFilter === 'parent') return u.role === 'parent' || u.role.includes('أمر');
                  if (userListRoleFilter === 'student') return u.role === 'student' || u.role.includes('طالب');
                  if (userListRoleFilter === 'teacher') return u.role === 'teacher' || u.role.includes('معلم') || u.role.includes('استاذ');
                  return true;
                });

                if (users.length === 0) {
                  return (
                    <div className="text-center py-12 text-white/40 text-xs">
                      لا يوجد مستخدمون مطابقون لهذا التصنيف في هذه المدرسة.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {users.map(u => {
                      const isProcessing = Boolean(repairingMap[u.id]);
                      return (
                        <div
                          key={u.id}
                          className="bg-black/30 border border-white/5 hover:border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-white text-xs">{u.name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/60 font-mono">
                                {u.role}
                              </span>
                              {u.isVerifiedForSchool ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                                  <CheckCircle2 size={11} /> مؤكد ومرتبط
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-bold">
                                  <AlertTriangle size={11} /> غير مؤكد (لا يوجد كود/طالب)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-white/40 font-mono flex-wrap">
                              <span>ID: {u.id}</span>
                              {u.email && <span>• البريد: {u.email}</span>}
                              {u.activationCode && <span>• كود التفعيل: <strong className="text-white/70">{u.activationCode}</strong></span>}
                              {u.studentCode && <span>• كود الطالب: <strong className="text-white/70">{u.studentCode}</strong></span>}
                              {u.parentCode && <span>• كود الولي: <strong className="text-white/70">{u.parentCode}</strong></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleUnlinkUserFromSchool(u.id, u.name)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl text-[11px] font-bold text-amber-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="إزالة معرف المدرسة من حساب المستخدم لتصحيح عداد المدرسة"
                            >
                              <UserX size={12} className={isProcessing ? 'animate-spin' : ''} />
                              فك الارتباط بالمدرسة
                            </button>
                            <button
                              onClick={() => handleDeleteOrphanUser(u.id, u.name)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 rounded-xl text-[11px] font-bold text-rose-300 transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="حذف الحساب نهائياً من قاعدة البيانات"
                            >
                              <Trash2 size={12} className={isProcessing ? 'animate-spin' : ''} />
                              حذف الحساب
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
