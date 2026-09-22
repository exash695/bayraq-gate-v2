import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Building,
  GraduationCap,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  SlidersHorizontal,
  PlusCircle,
  ArrowUpDown,
  Download,
  Sparkles,
  Clock,
  Calendar,
  Eye,
  Edit3,
  X,
  UserPlus,
  FileSpreadsheet,
  Layers,
  Radio,
  Trash2,
  Share2
} from 'lucide-react';
import { db, collection, getDocs, doc, setDoc, updateDoc, serverTimestamp, writeBatch, deleteDoc } from '../../lib/firebase';
import { schoolService, SchoolRecord } from '../../services/schoolService';
import { getOfficialSchoolLogoUrl } from '../../lib/constants';
import { logActivity } from '../../utils/auditLogger';

export interface UnifiedUserRecord {
  id: string;
  uid: string;
  fullName: string;
  displayName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  role: string; // student, teacher, parent, admin, dev, etc.
  stage?: string;
  grade?: string;
  hasCode: boolean;
  code?: string;
  codeType?: string;
  schoolId?: string;
  schoolName?: string;
  schoolLogo?: string;
  isAffiliatedWithSchool: boolean;
  status: 'active' | 'pending' | 'disabled' | 'online' | 'offline';
  isOnline: boolean;
  lastActive?: string | number | Date;
  createdAt?: string | number | Date;
  rawSource: 'firestore' | 'postgres' | 'both';
  rawDoc?: any;
}

interface UsersAuditDirectoryProps {
  onNavigateToSchool?: (schoolId: string) => void;
  onNavigateToLicensing?: () => void;
}

export const UsersAuditDirectorySection: React.FC<UsersAuditDirectoryProps> = ({
  onNavigateToSchool,
  onNavigateToLicensing
}) => {
  const [users, setUsers] = useState<UnifiedUserRecord[]>([]);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [activationCodes, setActivationCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [codeFilter, setCodeFilter] = useState<'all' | 'with_code' | 'no_code'>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all'); // 'all', 'unaffiliated', or specific schoolId
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [onlineFilter, setOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name' | 'school' | 'code'>('recent');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & User Actions
  const [selectedUserForAction, setSelectedUserForAction] = useState<UnifiedUserRecord | null>(null);
  const [isAssignCodeModalOpen, setIsAssignCodeModalOpen] = useState(false);
  const [isLinkSchoolModalOpen, setIsLinkSchoolModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isInspectUserModalOpen, setIsInspectUserModalOpen] = useState(false);

  // Action form states
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [codeSchoolSelection, setCodeSchoolSelection] = useState('');
  const [selectedTargetSchoolId, setSelectedTargetSchoolId] = useState('');
  const [targetRoleSelection, setTargetRoleSelection] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  const copyToClipboard = (text: string, keyId: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2500);
      showToast('تم نسخ القيمة إلى الحافظة بنجاح 📋');
    }
  };

  // Main data fetch & consolidation
  const loadAllUsersAndRelations = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch schools list
      const schoolsList = await schoolService.fetchSchools();
      setSchools(schoolsList);

      const schoolMapById = new Map<string, SchoolRecord>();
      const schoolMapByName = new Map<string, SchoolRecord>();
      schoolsList.forEach(s => {
        schoolMapById.set(s.id, s);
        if (s.name) schoolMapByName.set(s.name.trim().toLowerCase(), s);
      });

      // 2. Fetch Activation Codes (Firestore + Postgres)
      let allCodes: any[] = [];
      try {
        const codesSnap = await getDocs(collection(db, 'activation_codes'));
        codesSnap.forEach(d => allCodes.push({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Firestore codes fetch error:', err);
      }

      try {
        const res = await fetch('/api/activation-codes');
        if (res.ok) {
          const data = await res.json();
          const pgCodes = data.codes || [];
          pgCodes.forEach((pgc: any) => {
            if (!allCodes.some(c => c.code === pgc.code)) {
              allCodes.push(pgc);
            }
          });
        }
      } catch (err) {
        console.warn('Postgres codes fetch error:', err);
      }
      setActivationCodes(allCodes);

      // Create mapping of code to code document
      const codeLookup = new Map<string, any>();
      allCodes.forEach(c => {
        if (c.code) codeLookup.set(String(c.code).trim().toUpperCase(), c);
      });

      // 3. Fetch Users from Firestore
      const firestoreUsers: any[] = [];
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach(docSnap => {
          firestoreUsers.push({ id: docSnap.id, uid: docSnap.id, ...docSnap.data(), source: 'firestore' });
        });
      } catch (err) {
        console.warn('Firestore users fetch warning:', err);
      }

      // 4. Fetch Users from PostgreSQL API
      let pgUsers: any[] = [];
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          pgUsers = data.users || data.data || [];
        }
      } catch (err) {
        console.warn('Postgres users fetch warning:', err);
      }

      // 5. Merge, harmonize and cross-reference
      const unifiedMap = new Map<string, UnifiedUserRecord>();
      const nowTs = Date.now();

      // Process Firestore Users
      firestoreUsers.forEach(fu => {
        const uid = fu.uid || fu.id;
        const name = fu.fullName || fu.name || fu.displayName || fu.userName || 'مستخدم بدون اسم';
        const rawCode = String(fu.activationCode || fu.studentCode || fu.parentCode || fu.code || fu.usedCode || '').trim();
        const hasCode = Boolean(rawCode && rawCode.length > 2);

        // Determine school
        let sId = String(fu.schoolId || fu.school_id || '').trim();
        let sName = String(fu.schoolName || fu.school || '').trim();

        // If no direct school ID, check if schoolName matches any registered school
        if (!sId && sName) {
          const matched = schoolMapByName.get(sName.toLowerCase());
          if (matched) {
            sId = matched.id;
            sName = matched.name;
          }
        }

        // If user has a code, check if that code provides school association
        if (!sId && hasCode) {
          const codeInfo = codeLookup.get(rawCode.toUpperCase());
          if (codeInfo && codeInfo.schoolId) {
            sId = codeInfo.schoolId;
            const sc = schoolMapById.get(sId);
            if (sc) sName = sc.name;
          }
        }

        const registeredSchool = sId ? schoolMapById.get(sId) : null;
        const finalSchoolName = registeredSchool ? registeredSchool.name : (sName || (sId ? `مدرسة (${sId})` : ''));
        const finalSchoolLogo = registeredSchool?.schoolLogoUrl || (sId ? getOfficialSchoolLogoUrl(sId, finalSchoolName) : undefined);
        const isAffiliated = Boolean(sId && sId !== 'general' && sId !== 'unassigned');

        // Determine online state
        const lastActiveDate = fu.lastActive?.toDate ? fu.lastActive.toDate() : (fu.lastActive ? new Date(fu.lastActive) : (fu.updatedAt ? new Date(fu.updatedAt) : null));
        const lastActiveTs = lastActiveDate ? lastActiveDate.getTime() : 0;
        const isOnline = Boolean(fu.online || fu.status === 'online' || (lastActiveTs > 0 && nowTs - lastActiveTs < 1800000));

        const role = String(fu.role || 'student').toLowerCase();

        unifiedMap.set(uid, {
          id: uid,
          uid: uid,
          fullName: name,
          displayName: fu.displayName || name,
          email: fu.email || '',
          phone: fu.phoneNumber || fu.phone || '',
          photoUrl: fu.photoURL || fu.avatar || fu.photo || '',
          role: role,
          stage: fu.stage || fu.grade || '',
          grade: fu.grade || fu.class || '',
          hasCode: hasCode,
          code: rawCode || undefined,
          codeType: hasCode ? (codeLookup.get(rawCode.toUpperCase())?.role || role) : undefined,
          schoolId: sId || undefined,
          schoolName: finalSchoolName || undefined,
          schoolLogo: finalSchoolLogo,
          isAffiliatedWithSchool: isAffiliated,
          status: fu.status || (isOnline ? 'online' : 'active'),
          isOnline: isOnline,
          lastActive: lastActiveDate || undefined,
          createdAt: fu.createdAt?.toDate ? fu.createdAt.toDate() : (fu.createdAt ? new Date(fu.createdAt) : undefined),
          rawSource: 'firestore',
          rawDoc: fu
        });
      });

      // Merge PostgreSQL Users
      pgUsers.forEach((pu: any) => {
        const uid = String(pu.id || pu.uid);
        const existing = unifiedMap.get(uid);

        const name = pu.name || pu.fullName || pu.displayName || 'مستخدم مسجل';
        const rawCode = String(pu.studentCode || pu.code || pu.activationCode || '').trim();
        const hasCode = Boolean(rawCode && rawCode.length > 2);

        let sId = String(pu.schoolId || pu.school_id || '').trim();
        let sName = String(pu.schoolName || pu.school || '').trim();
        const registeredSchool = sId ? schoolMapById.get(sId) : null;
        const finalSchoolName = registeredSchool ? registeredSchool.name : (sName || (sId ? `مدرسة (${sId})` : ''));
        const finalSchoolLogo = registeredSchool?.schoolLogoUrl || (sId ? getOfficialSchoolLogoUrl(sId, finalSchoolName) : undefined);
        const isAffiliated = Boolean(sId && sId !== 'general' && sId !== 'unassigned');

        const role = String(pu.role || 'student').toLowerCase();
        const lastActiveDate = pu.lastLogin ? new Date(pu.lastLogin) : (pu.lastActive ? new Date(pu.lastActive) : null);
        const lastActiveTs = lastActiveDate ? lastActiveDate.getTime() : 0;
        const isOnline = Boolean(lastActiveTs > 0 && nowTs - lastActiveTs < 1800000);

        if (existing) {
          // Merge missing properties
          existing.rawSource = 'both';
          if (!existing.email && pu.email) existing.email = pu.email;
          if (!existing.phone && (pu.phone || pu.phoneNumber)) existing.phone = pu.phone || pu.phoneNumber;
          if (!existing.hasCode && hasCode) {
            existing.hasCode = true;
            existing.code = rawCode;
          }
          if (!existing.schoolId && sId) {
            existing.schoolId = sId;
            existing.schoolName = finalSchoolName;
            existing.schoolLogo = finalSchoolLogo;
            existing.isAffiliatedWithSchool = isAffiliated;
          }
        } else {
          unifiedMap.set(uid, {
            id: uid,
            uid: uid,
            fullName: name,
            displayName: pu.displayName || name,
            email: pu.email || '',
            phone: pu.phone || pu.phoneNumber || '',
            photoUrl: pu.photo || pu.avatar || '',
            role: role,
            stage: pu.stage || pu.grade || '',
            grade: pu.grade || '',
            hasCode: hasCode,
            code: rawCode || undefined,
            schoolId: sId || undefined,
            schoolName: finalSchoolName || undefined,
            schoolLogo: finalSchoolLogo,
            isAffiliatedWithSchool: isAffiliated,
            status: isOnline ? 'online' : 'active',
            isOnline: isOnline,
            lastActive: lastActiveDate || undefined,
            createdAt: pu.createdAt ? new Date(pu.createdAt) : undefined,
            rawSource: 'postgres',
            rawDoc: pu
          });
        }
      });

      const list = Array.from(unifiedMap.values());
      setUsers(list);
      setLastRefreshedAt(new Date());
      if (isManualRefresh) {
        showToast(`تم تحديث سجل المستخدمين بنجاح (${list.length} مستخدم مسجل) 🔄`);
      }
    } catch (err: any) {
      console.error('Error loading users directory:', err);
      showToast('تعذر تحميل بعض بيانات المستخدمين، يرجى المحاولة ثانية', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllUsersAndRelations();
  }, []);

  // Filter & Search Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = user.fullName.toLowerCase().includes(q);
        const matchEmail = (user.email || '').toLowerCase().includes(q);
        const matchPhone = (user.phone || '').includes(q);
        const matchCode = (user.code || '').toLowerCase().includes(q);
        const matchSchool = (user.schoolName || '').toLowerCase().includes(q);
        const matchUid = user.uid.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchCode && !matchSchool && !matchUid) {
          return false;
        }
      }

      // 2. Code Filter
      if (codeFilter === 'with_code' && !user.hasCode) return false;
      if (codeFilter === 'no_code' && user.hasCode) return false;

      // 3. School Affiliation Filter
      if (schoolFilter === 'unaffiliated' && user.isAffiliatedWithSchool) return false;
      if (schoolFilter === 'affiliated' && !user.isAffiliatedWithSchool) return false;
      if (schoolFilter !== 'all' && schoolFilter !== 'unaffiliated' && schoolFilter !== 'affiliated') {
        if (user.schoolId !== schoolFilter) return false;
      }

      // 4. Role Filter
      if (roleFilter !== 'all') {
        const uRole = user.role.toLowerCase();
        if (roleFilter === 'student' && !uRole.includes('student') && !uRole.includes('طالب')) return false;
        if (roleFilter === 'teacher' && !uRole.includes('teacher') && !uRole.includes('cadre') && !uRole.includes('أستاذ') && !uRole.includes('معلم')) return false;
        if (roleFilter === 'parent' && !uRole.includes('parent') && !uRole.includes('أمر') && !uRole.includes('امر')) return false;
        if (roleFilter === 'admin' && !uRole.includes('admin') && !uRole.includes('dev') && !uRole.includes('إدارة')) return false;
      }

      // 5. Online Filter
      if (onlineFilter === 'online' && !user.isOnline) return false;
      if (onlineFilter === 'offline' && user.isOnline) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recent') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.lastActive ? new Date(a.lastActive).getTime() : 0);
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.lastActive ? new Date(b.lastActive).getTime() : 0);
        return timeB - timeA;
      }
      if (sortBy === 'oldest') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      }
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName, 'ar');
      }
      if (sortBy === 'school') {
        return (a.schoolName || '').localeCompare(b.schoolName || '', 'ar');
      }
      if (sortBy === 'code') {
        return (b.hasCode ? 1 : 0) - (a.hasCode ? 1 : 0);
      }
      return 0;
    });
  }, [users, searchQuery, codeFilter, schoolFilter, roleFilter, onlineFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Statistics KPI calculations
  const stats = useMemo(() => {
    const total = users.length;
    const withCode = users.filter(u => u.hasCode).length;
    const withoutCode = total - withCode;
    const affiliated = users.filter(u => u.isAffiliatedWithSchool).length;
    const unaffiliated = total - affiliated;
    const online = users.filter(u => u.isOnline).length;

    const students = users.filter(u => u.role.includes('student') || u.role.includes('طالب')).length;
    const teachers = users.filter(u => u.role.includes('teacher') || u.role.includes('cadre') || u.role.includes('أستاذ') || u.role.includes('معلم')).length;
    const parents = users.filter(u => u.role.includes('parent') || u.role.includes('أمر')).length;
    const admins = users.filter(u => u.role.includes('admin') || u.role.includes('dev') || u.role.includes('إدارة')).length;

    const withCodePct = total > 0 ? Math.round((withCode / total) * 100) : 0;
    const withoutCodePct = total > 0 ? Math.round((withoutCode / total) * 100) : 0;
    const affiliatedPct = total > 0 ? Math.round((affiliated / total) * 100) : 0;

    return {
      total,
      withCode,
      withoutCode,
      withCodePct,
      withoutCodePct,
      affiliated,
      unaffiliated,
      affiliatedPct,
      online,
      students,
      teachers,
      parents,
      admins
    };
  }, [users]);

  // Action Handlers
  const handleOpenAssignCode = (user: UnifiedUserRecord) => {
    setSelectedUserForAction(user);
    setCustomCodeInput(user.code || `B6-${(user.schoolId || 'GEN').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setCodeSchoolSelection(user.schoolId || (schools[0]?.id || ''));
    setIsAssignCodeModalOpen(true);
  };

  const handleSaveAssignCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !customCodeInput.trim()) return;

    setIsProcessingAction(true);
    const codeVal = customCodeInput.trim().toUpperCase();
    const schoolTarget = codeSchoolSelection || selectedUserForAction.schoolId || '';
    const schoolObj = schools.find(s => s.id === schoolTarget);

    try {
      // 1. Update user document in Firestore
      await setDoc(doc(db, 'users', selectedUserForAction.uid), {
        activationCode: codeVal,
        studentCode: codeVal,
        code: codeVal,
        schoolId: schoolTarget || 'general',
        schoolName: schoolObj?.name || 'أكاديمية بيرق العامة',
        hasValidCode: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 2. Also record in activation_codes collection as used
      await setDoc(doc(db, 'activation_codes', codeVal), {
        code: codeVal,
        schoolId: schoolTarget || 'general',
        schoolName: schoolObj?.name || 'أكاديمية بيرق العامة',
        role: selectedUserForAction.role,
        used: true,
        isUsed: true,
        status: 'used',
        usedBy: selectedUserForAction.fullName,
        usedByUid: selectedUserForAction.uid,
        usedAt: new Date().toISOString(),
        assignedByDev: true
      }, { merge: true });

      // 3. Update PostgreSQL if endpoint exists
      try {
        await fetch(`/api/users/${selectedUserForAction.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentCode: codeVal,
            schoolId: schoolTarget
          })
        });
      } catch (e) {}

      // 4. Log audit activity
      await logActivity({
        action: 'منح كود تفعيل مباشر من لوحة المطور',
        category: 'security',
        status: 'success',
        details: `تم منح الكود (${codeVal}) للمستخدم: ${selectedUserForAction.fullName} (${selectedUserForAction.uid}) للمدرسة: ${schoolObj?.name || 'عامة'}`
      });

      // 5. Update local state
      setUsers(prev => prev.map(u => {
        if (u.uid === selectedUserForAction.uid) {
          return {
            ...u,
            hasCode: true,
            code: codeVal,
            schoolId: schoolTarget,
            schoolName: schoolObj?.name || u.schoolName,
            schoolLogo: schoolObj?.schoolLogoUrl || u.schoolLogo,
            isAffiliatedWithSchool: Boolean(schoolTarget && schoolTarget !== 'general')
          };
        }
        return u;
      }));

      showToast(`تم تعيين وتفعيل الكود (${codeVal}) للمستخدم بنجاح! ⚡🔑`);
      setIsAssignCodeModalOpen(false);
    } catch (err: any) {
      console.error('Error assigning code:', err);
      showToast('حدث خطأ أثناء حفظ الكود للمستخدم', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenLinkSchool = (user: UnifiedUserRecord) => {
    setSelectedUserForAction(user);
    setSelectedTargetSchoolId(user.schoolId || (schools[0]?.id || ''));
    setIsLinkSchoolModalOpen(true);
  };

  const handleSaveLinkSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !selectedTargetSchoolId) return;

    setIsProcessingAction(true);
    const targetSchool = schools.find(s => s.id === selectedTargetSchoolId);
    if (!targetSchool) return;

    try {
      // 1. Update in Firestore
      await updateDoc(doc(db, 'users', selectedUserForAction.uid), {
        schoolId: targetSchool.id,
        schoolName: targetSchool.name,
        updatedAt: serverTimestamp()
      });

      // 2. Update in Postgres
      try {
        await fetch(`/api/users/${selectedUserForAction.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: targetSchool.id
          })
        });
      } catch (e) {}

      // 3. Log audit
      await logActivity({
        action: 'ربط وتحديث مدرسة المستخدم',
        category: 'data_integrity',
        status: 'success',
        details: `تم نقل/ربط المستخدم ${selectedUserForAction.fullName} إلى مدرسة ${targetSchool.name} (${targetSchool.id})`
      });

      // 4. Update local state
      setUsers(prev => prev.map(u => {
        if (u.uid === selectedUserForAction.uid) {
          return {
            ...u,
            schoolId: targetSchool.id,
            schoolName: targetSchool.name,
            schoolLogo: targetSchool.schoolLogoUrl,
            isAffiliatedWithSchool: true
          };
        }
        return u;
      }));

      showToast(`تم ربط المستخدم بمدرسة (${targetSchool.name}) بنجاح! 🏫✓`);
      setIsLinkSchoolModalOpen(false);
    } catch (err: any) {
      console.error('Error linking school:', err);
      showToast('فشل في تحديث مدرسة المستخدم', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleOpenEditRole = (user: UnifiedUserRecord) => {
    setSelectedUserForAction(user);
    setTargetRoleSelection(user.role);
    setIsEditRoleModalOpen(true);
  };

  const handleSaveEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !targetRoleSelection) return;

    setIsProcessingAction(true);
    try {
      await updateDoc(doc(db, 'users', selectedUserForAction.uid), {
        role: targetRoleSelection,
        updatedAt: serverTimestamp()
      });

      try {
        await fetch(`/api/users/${selectedUserForAction.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: targetRoleSelection })
        });
      } catch (e) {}

      setUsers(prev => prev.map(u => {
        if (u.uid === selectedUserForAction.uid) {
          return { ...u, role: targetRoleSelection };
        }
        return u;
      }));

      showToast(`تم تحديث رتبة المستخدم إلى (${targetRoleSelection}) بنجاح! 🛡️`);
      setIsEditRoleModalOpen(false);
    } catch (err: any) {
      console.error('Error updating role:', err);
      showToast('فشل في تحديث رتبة المستخدم', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Export CSV Report
  const exportUsersCSV = () => {
    const headers = ['المعرف (UID)', 'الاسم الكامل', 'البريد الإلكتروني', 'رقم الهاتف', 'الرتبة / الدور', 'يمتلك كود', 'كود التفعيل', 'معرف المدرسة', 'اسم المدرسة', 'الحالة', 'تاريخ الإنشاء'];
    const rows = filteredUsers.map(u => [
      `"${u.uid}"`,
      `"${u.fullName.replace(/"/g, '""')}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role}"`,
      u.hasCode ? 'نعم' : 'لا (بدون كود)',
      `"${u.code || ''}"`,
      `"${u.schoolId || ''}"`,
      `"${(u.schoolName || 'مستقل').replace(/"/g, '""')}"`,
      u.isOnline ? 'متصل' : 'غير متصل',
      u.createdAt ? new Date(u.createdAt).toISOString() : ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bayraq_users_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير تقرير المستخدمين بنجاح بصيغة CSV 📊');
  };

  const handleResetAllUsers = async () => {
    setShowResetConfirm(false);
    setIsResetting(true);
    try {
      console.log('--- STARTING SYSTEM RESET (FULL PURGE) ---');
      
      // 1. Backend SQL Reset
      const response = await fetch('/api/admin/maintenance/reset-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          confirm: true,
          developerEmail: 'mntzralghanm527@gmail.com' 
        })
      });

      const data = await response.json();
      console.log('SQL Reset response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل تصفير قاعدة بيانات SQL');
      }

      // 2. Frontend Firestore Reset (Users & Codes)
      console.log('--- STARTING FIRESTORE PURGE ---');
      const devEmail = 'mntzralghanm527@gmail.com';
      
      // Clear Firestore Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const userBatch = writeBatch(db);
      let userCount = 0;
      usersSnap.forEach((userDoc) => {
        const userData = userDoc.data();
        if (userData.email?.toLowerCase() !== devEmail) {
          userBatch.delete(userDoc.ref);
          userCount++;
        }
      });
      if (userCount > 0) await userBatch.commit();
      console.log(`Purged ${userCount} users from Firestore`);

      // Clear Firestore Activation Codes
      const codesSnap = await getDocs(collection(db, 'activation_codes'));
      const codesBatch = writeBatch(db);
      let codesCount = 0;
      codesSnap.forEach((codeDoc) => {
        codesBatch.delete(codeDoc.ref);
        codesCount++;
      });
      if (codesCount > 0) await codesBatch.commit();
      console.log(`Purged ${codesCount} codes from Firestore`);

      showToast('✅ تم تصفير النظام بالكامل بنجاح ✓', 'success');
      
      // Refresh UI
      await loadAllUsersAndRelations(true);
    } catch (err: any) {
      console.error('Reset system error:', err);
      showToast('حدث خطأ أثناء محاولة تصفير النظام: ' + err.message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#030712] text-slate-100 px-3 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-bold backdrop-blur-xl ${
            toastMsg.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
              : toastMsg.type === 'info'
              ? 'bg-sky-950/90 text-sky-200 border-sky-500/50'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
          }`}>
            {toastMsg.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Header Banner - Edge to Edge */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/20">
                <Users size={26} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  دليل وحوكمة مستخدمي المنصة والأكواد الشاملة 👥⚡
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  نظرة تفصيلية دقيقة وفورية لكل مستخدم مسجل: هل يمتلك كوداً؟ لأي مدرسة يتبع؟ رتبته، ونشاطه مع صلاحيات التحكم المباشر.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-mono">
                <Clock size={12} className="text-emerald-400" />
                آخر تحديث: {lastRefreshedAt.toLocaleTimeString('ar-IQ')}
              </span>
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Building size={12} className="text-blue-400" />
                {schools.length} مدرسة وميدان معتمد
              </span>
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5" title="عدد بطاقات وأكواد التراخيص الصادرة في جدول بنك الأكواد (activation_codes)">
                <Key size={12} className="text-amber-400" />
                {activationCodes.length} بطاقة في بنك التراخيص
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => loadAllUsersAndRelations(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
              <span>{refreshing ? 'جاري المزامنة...' : 'تحديث حي 🔄'}</span>
            </button>

            <button
              onClick={exportUsersCSV}
              className="px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              <span>تصدير تقرير (CSV) 📊</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting || refreshing}
              className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={15} className={isResetting ? 'animate-pulse' : ''} />
              <span>{isResetting ? 'جاري التصفير...' : 'تصفير المستخدمين 🗑️'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-md bg-[#0B1528] border-2 border-rose-500/30 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_0_80px_rgba(244,63,94,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 rotate-12 shadow-2xl shadow-rose-500/20 border border-rose-500/30">
                  <AlertTriangle size={40} />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">تصفير النظام بالكامل 🚨</h2>
                  <div className="h-1 w-20 bg-rose-500/40 mx-auto rounded-full" />
                </div>

                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  تحذير: سيتم حذف جميع <span className="text-white font-bold underline">المستخدمين</span>، 
                  <span className="text-white font-bold underline">الأكواد</span>، 
                  <span className="text-white font-bold underline">المالية</span>، 
                  وكافة البيانات التجريبية نهائياً. سيتم الإبقاء فقط على حساب المطور والمدارس المسجلة.
                </div>
                
                <p className="text-rose-400 font-black text-xs animate-pulse">هذا الإجراء مدمر وغير قابل للتراجع!</p>
                
                <div className="flex flex-col w-full gap-3 mt-4">
                  <button
                    onClick={handleResetAllUsers}
                    disabled={isResetting}
                    className="w-full py-4.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                  >
                    {isResetting ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                    )}
                    <span>نعم، قم بتصفير النظام الآن 🗑️</span>
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isResetting}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold text-sm border border-white/10 active:scale-95 transition-all"
                  >
                    إلغاء العملية
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Grid - Edge to Edge */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {/* Card 1: Total Users */}
        <div className="bg-[#0B1120] border border-white/10 rounded-2xl p-4 shadow-lg hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between text-white/50 text-xs font-bold mb-2">
            <span>إجمالي المسجلين</span>
            <Users size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">{stats.total}</div>
          <div className="text-[11px] text-white/40 mt-1 font-medium flex items-center gap-1">
            <span className="text-emerald-400">100%</span> من قاعدة البيانات
          </div>
        </div>

        {/* Card 2: With Code */}
        <div
          onClick={() => setCodeFilter('with_code')}
          className={`border rounded-2xl p-4 shadow-lg transition-all cursor-pointer ${
            codeFilter === 'with_code'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-emerald-500/20'
              : 'bg-[#0B1120] border-white/10 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-2">
            <span>مفعلون بكود ✓</span>
            <ShieldCheck size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">{stats.withCode}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">
            يمثلون {stats.withCodePct}% من المستخدمين
          </div>
        </div>

        {/* Card 3: Without Code (Crucial for dev) */}
        <div
          onClick={() => setCodeFilter('no_code')}
          className={`border rounded-2xl p-4 shadow-lg transition-all cursor-pointer ${
            codeFilter === 'no_code'
              ? 'bg-amber-950/40 border-amber-500 shadow-amber-500/20'
              : 'bg-[#0B1120] border-white/10 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-2">
            <span>بدون كود ⚠️</span>
            <AlertTriangle size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{stats.withoutCode}</div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            {stats.withoutCodePct}% بانتظار التفعيل/الشراء
          </div>
        </div>

        {/* Card 4: School Affiliated */}
        <div
          onClick={() => setSchoolFilter('affiliated')}
          className={`border rounded-2xl p-4 shadow-lg transition-all cursor-pointer ${
            schoolFilter === 'affiliated'
              ? 'bg-blue-950/40 border-blue-500 shadow-blue-500/20'
              : 'bg-[#0B1120] border-white/10 hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-blue-400 text-xs font-bold mb-2">
            <span>مربوط بمدارس</span>
            <Building size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-300 font-mono">{stats.affiliated}</div>
          <div className="text-[11px] text-blue-400/80 mt-1 font-medium">
            {stats.affiliatedPct}% يتبعون مدارس مرخصة
          </div>
        </div>

        {/* Card 5: Unaffiliated / Floating */}
        <div
          onClick={() => setSchoolFilter('unaffiliated')}
          className={`border rounded-2xl p-4 shadow-lg transition-all cursor-pointer ${
            schoolFilter === 'unaffiliated'
              ? 'bg-purple-950/40 border-purple-500 shadow-purple-500/20'
              : 'bg-[#0B1120] border-white/10 hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold mb-2">
            <span>حسابات مستقلة / عامة</span>
            <Layers size={16} />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">{stats.unaffiliated}</div>
          <div className="text-[11px] text-purple-400/80 mt-1 font-medium">
            غير مرتبطين بمدرسة محددة
          </div>
        </div>

        {/* Card 6: Online Now */}
        <div
          onClick={() => setOnlineFilter(onlineFilter === 'online' ? 'all' : 'online')}
          className={`border rounded-2xl p-4 shadow-lg transition-all cursor-pointer ${
            onlineFilter === 'online'
              ? 'bg-teal-950/40 border-teal-500 shadow-teal-500/20'
              : 'bg-[#0B1120] border-white/10 hover:border-teal-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-teal-400 text-xs font-bold mb-2">
            <span>متصلون الآن 🟢</span>
            <Radio size={16} className="animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-300 font-mono">{stats.online}</div>
          <div className="text-[11px] text-teal-400/80 mt-1 font-medium">
            نشاط خلال آخر 30 دقيقة
          </div>
        </div>
      </div>

      {/* Role Breakdown Bar */}
      <div className="w-full bg-[#0B1120] border border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-white/70">
          <GraduationCap size={16} className="text-indigo-400" />
          <span>توزيع أدوار المستخدمين:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setRoleFilter(roleFilter === 'student' ? 'all' : 'student')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              roleFilter === 'student' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <span>🎓 الطلاب:</span>
            <span className="font-mono text-indigo-300">{stats.students}</span>
          </button>

          <button
            onClick={() => setRoleFilter(roleFilter === 'teacher' ? 'all' : 'teacher')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              roleFilter === 'teacher' ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <span>👨‍🏫 الأساتذة:</span>
            <span className="font-mono text-emerald-300">{stats.teachers}</span>
          </button>

          <button
            onClick={() => setRoleFilter(roleFilter === 'parent' ? 'all' : 'parent')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              roleFilter === 'parent' ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <span>👨‍👩‍👦 أولياء الأمور:</span>
            <span className="font-mono text-amber-300">{stats.parents}</span>
          </button>

          <button
            onClick={() => setRoleFilter(roleFilter === 'admin' ? 'all' : 'admin')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              roleFilter === 'admin' ? 'bg-rose-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <span>🛡️ الإدارة والكوادر:</span>
            <span className="font-mono text-rose-300">{stats.admins}</span>
          </button>

          {(roleFilter !== 'all' || codeFilter !== 'all' || schoolFilter !== 'all' || onlineFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setCodeFilter('all');
                setSchoolFilter('all');
                setOnlineFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl font-bold border border-rose-500/30 text-[11px] transition-all flex items-center gap-1 cursor-pointer"
            >
              <X size={12} />
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Toolbar: Search & Advanced Selectors */}
      <div className="w-full bg-[#0B1120] border border-white/10 rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث فوري بالاسم، البريد، الهاتف، كود التفعيل، المدرسة، أو معرّف UID..."
              className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Code Filter Pills */}
            <div className="bg-[#151C2F] p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => { setCodeFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  codeFilter === 'all' ? 'bg-white text-slate-950 font-black' : 'text-white/60 hover:text-white'
                }`}
              >
                الكل ({users.length})
              </button>
              <button
                onClick={() => { setCodeFilter('with_code'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  codeFilter === 'with_code' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <ShieldCheck size={13} />
                <span>يمتلك كود ({stats.withCode})</span>
              </button>
              <button
                onClick={() => { setCodeFilter('no_code'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  codeFilter === 'no_code' ? 'bg-amber-500 text-slate-950 font-black' : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <AlertTriangle size={13} />
                <span>بدون كود ({stats.withoutCode})</span>
              </button>
            </div>

            {/* School Dropdown */}
            <select
              value={schoolFilter}
              onChange={(e) => {
                setSchoolFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#151C2F] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">🏢 جميع المدارس والميادين</option>
              <option value="affiliated">🏫 فقط التابعين لمدارس</option>
              <option value="unaffiliated">🌐 فقط الحسابات المستقلة (بدون مدرسة)</option>
              <optgroup label="المدارس والميادين المعتمدة:">
                {schools.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({users.filter(u => u.schoolId === s.id).length} مستخدم)
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#151C2F] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500/50"
            >
              <option value="recent">⏱️ الأحدث تسجيلاً</option>
              <option value="oldest">🕰️ الأقدم تسجيلاً</option>
              <option value="name">🔤 حسب الاسم أبجدياً</option>
              <option value="school">🏫 حسب المدرسة</option>
              <option value="code">🔑 المفعلون بالكود أولاً</option>
            </select>
          </div>
        </div>

        {/* Status result summary */}
        <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
          <div>
            تم العثور على <strong className="text-white font-mono">{filteredUsers.length}</strong> مستخدم يطابق معايير التصفية الحالية
          </div>
          <div className="flex items-center gap-3">
            <span>عدد العناصر في الصفحة:</span>
            {[25, 50, 100].map(cnt => (
              <button
                key={cnt}
                onClick={() => { setItemsPerPage(cnt); setCurrentPage(1); }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  itemsPerPage === cnt ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Full-Width Data Table (Edge-to-Edge) */}
      <div className="w-full bg-[#0B1120] border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/60 text-xs font-black">
                <th className="py-4 pr-6 pl-3">المستخدم والبيانات الشخصية</th>
                <th className="py-4 px-3">حالة الكود والتفعيل 🔑</th>
                <th className="py-4 px-3">المدرسة التابعة 🏫</th>
                <th className="py-4 px-3">الرتبة والدور 🎓</th>
                <th className="py-4 px-3">الاتصال والنشاط 📡</th>
                <th className="py-4 px-3">تاريخ التسجيل 📅</th>
                <th className="py-4 pl-6 pr-3 text-center">إجراءات المطور ⚡</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw size={28} className="animate-spin text-emerald-400" />
                      <p className="font-bold">جاري تحميل وتدقيق سجلات المستخدمين والأكواد...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-white/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX size={36} className="text-white/20" />
                      <p className="font-bold text-sm text-white/60">لا يوجد مستخدمون يطابقون خيارات البحث الحالية</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCodeFilter('all');
                          setSchoolFilter('all');
                          setRoleFilter('all');
                        }}
                        className="text-indigo-400 hover:underline text-xs mt-1"
                      >
                        إلغاء جميع الفلاتر وعرض الكل
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isCopied = copiedKey === u.uid;
                  const isCodeCopied = copiedKey === `code_${u.uid}`;

                  return (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                      {/* 1. User info */}
                      <td className="py-4 pr-6 pl-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 overflow-hidden flex items-center justify-center text-base font-black text-white">
                              {u.photoUrl ? (
                                <img
                                  src={u.photoUrl}
                                  alt={u.fullName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                                />
                              ) : (
                                <span>{u.fullName.slice(0, 2)}</span>
                              )}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0B1120] ${
                                u.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                              }`}
                              title={u.isOnline ? 'متصل الآن' : 'غير متصل'}
                            />
                          </div>

                          <div className="space-y-0.5">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {u.rawSource === 'both' && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">PG+FS</span>
                              )}
                            </div>
                            <div className="text-[11px] text-white/50 flex flex-wrap items-center gap-2">
                              {u.email && (
                                <span className="flex items-center gap-1">
                                  <Mail size={11} className="text-white/40" />
                                  <span className="font-mono text-[10px]">{u.email}</span>
                                </span>
                              )}
                              {u.phone && (
                                <span className="flex items-center gap-1" dir="ltr">
                                  <Phone size={11} className="text-white/40" />
                                  <span className="font-mono text-[10px]">{u.phone}</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/30 font-mono flex items-center gap-1">
                              <span>UID: {u.uid.slice(0, 10)}...</span>
                              <button
                                onClick={() => copyToClipboard(u.uid, u.uid)}
                                className="text-white/40 hover:text-white"
                                title="نسخ المعرف الكامل"
                              >
                                {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Code Status */}
                      <td className="py-4 px-3">
                        {u.hasCode ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                              <ShieldCheck size={13} />
                              <span>{u.code}</span>
                              <button
                                onClick={() => copyToClipboard(u.code!, `code_${u.uid}`)}
                                className="text-emerald-400 hover:text-white mr-1"
                                title="نسخ الكود"
                              >
                                {isCodeCopied ? <Check size={11} /> : <Copy size={11} />}
                              </button>
                            </div>
                            {u.codeType && (
                              <div className="text-[10px] text-white/40 font-medium">
                                نوع الكود: <span className="text-emerald-400/90 font-bold">{u.codeType}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[11px]">
                              <AlertTriangle size={12} />
                              <span>بدون كود ⚠️</span>
                            </div>
                            <div>
                              <button
                                onClick={() => handleOpenAssignCode(u)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle size={10} />
                                <span>+ منح كود فوري</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. School Affiliation */}
                      <td className="py-4 px-3">
                        {u.isAffiliatedWithSchool ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                              <img
                                src={u.schoolLogo || getOfficialSchoolLogoUrl(u.schoolId || '', u.schoolName || '')}
                                alt={u.schoolName}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs">{u.schoolName}</div>
                              <div className="text-[10px] text-white/40 font-mono">ID: {u.schoolId}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[11px] font-medium">
                              🌐 مستقل / غير مربوط
                            </span>
                            <div>
                              <button
                                onClick={() => handleOpenLinkSchool(u)}
                                className="text-[10px] text-blue-400 hover:underline font-bold"
                              >
                                ربط بمدرسة 🏫
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Role & Level */}
                      <td className="py-4 px-3">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-1 rounded-xl font-bold text-[11px] border ${
                            u.role.includes('student') || u.role.includes('طالب')
                              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                              : u.role.includes('teacher') || u.role.includes('أستاذ')
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : u.role.includes('parent') || u.role.includes('أمر')
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          }`}>
                            {u.role.includes('student') || u.role.includes('طالب') ? '🎓 طالب'
                              : u.role.includes('teacher') ? '👨‍🏫 أستاذ'
                              : u.role.includes('parent') ? '👨‍👩‍👦 ولي أمر'
                              : `🛡️ ${u.role}`}
                          </span>
                          {u.grade && (
                            <div className="text-[10px] text-white/40">
                              الصف: <span className="text-white/70 font-bold">{u.grade}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Online Status & Activity */}
                      <td className="py-4 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                            <span className={`text-[11px] font-bold ${u.isOnline ? 'text-emerald-400' : 'text-white/40'}`}>
                              {u.isOnline ? 'متصل الآن 🟢' : 'غير متصل ⚫'}
                            </span>
                          </div>
                          {u.lastActive && (
                            <div className="text-[10px] text-white/40 flex items-center gap-1">
                              <Clock size={10} />
                              <span>{new Date(u.lastActive).toLocaleDateString('ar-IQ')}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Registered Date */}
                      <td className="py-4 px-3 text-white/60 font-mono text-[11px]">
                        {u.createdAt ? (
                          <div>
                            <div>{new Date(u.createdAt).toLocaleDateString('ar-IQ')}</div>
                            <div className="text-[9px] text-white/30">{new Date(u.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>

                      {/* 7. Quick Dev Actions */}
                      <td className="py-4 pl-6 pr-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Assign / Change Code */}
                          <button
                            onClick={() => handleOpenAssignCode(u)}
                            className="p-2 bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer"
                            title={u.hasCode ? 'تغيير كود التفعيل' : 'منح كود تفعيل فوري'}
                          >
                            <Key size={14} />
                          </button>

                          {/* Link / Change School */}
                          <button
                            onClick={() => handleOpenLinkSchool(u)}
                            className="p-2 bg-white/5 hover:bg-blue-500/20 text-white/70 hover:text-blue-300 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer"
                            title="تغيير أو ربط المدرسة"
                          >
                            <Building size={14} />
                          </button>

                          {/* Edit Role */}
                          <button
                            onClick={() => handleOpenEditRole(u)}
                            className="p-2 bg-white/5 hover:bg-purple-500/20 text-white/70 hover:text-purple-300 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
                            title="تعديل رتبة المستخدم"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Inspect Full Raw Data */}
                          <button
                            onClick={() => {
                              setSelectedUserForAction(u);
                              setIsInspectUserModalOpen(true);
                            }}
                            className="p-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
                            title="فحص الكائن البرمجي الكامل (Raw JSON)"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 bg-white/[0.02] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-white/50">
              عرض <strong className="text-white font-mono">{Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)}</strong> إلى{' '}
              <strong className="text-white font-mono">{Math.min(filteredUsers.length, currentPage * itemsPerPage)}</strong> من أصل{' '}
              <strong className="text-white font-mono">{filteredUsers.length}</strong> مستخدم
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                السابق
              </button>

              <div className="text-white/60 font-mono font-bold px-2">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Assign Activation Code */}
      {isAssignCodeModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1120] border-2 border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">منح كود تفعيل فوري للمستخدم</h3>
                  <p className="text-xs text-white/50">{selectedUserForAction.fullName} ({selectedUserForAction.role})</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignCodeModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignCode} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">كود التفعيل المراد تعيينه:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-[#151C2F] border border-emerald-500/50 text-emerald-300 font-mono font-bold rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="B6-XXX-XXXX"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = (codeSchoolSelection || selectedUserForAction.schoolId || 'GEN').slice(0, 3).toUpperCase();
                      setCustomCodeInput(`B6-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold"
                  >
                    توليد عشوائي 🎲
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">المدرسة المرتبطة بالكود:</label>
                <select
                  value={codeSchoolSelection}
                  onChange={(e) => setCodeSchoolSelection(e.target.value)}
                  className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold"
                >
                  <option value="general">أكاديمية بيرق العامة (مستقل / عام)</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} /> سيتم تفعيل الحساب فوراً
                </p>
                <p className="text-[11px] text-white/70">
                  سيتم حفظ الكود في ملف المستخدم في فايربيس وقاعدة البيانات الداخلية، مما يتيح للمستخدم الدخول الكامل للمنصة.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignCodeModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {isProcessingAction ? 'جاري الحفظ...' : 'تأكيد وحفظ الكود فوراً ⚡'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Link / Reassign School */}
      {isLinkSchoolModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1120] border-2 border-blue-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">ربط / نقل المستخدم إلى مدرسة</h3>
                  <p className="text-xs text-white/50">{selectedUserForAction.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkSchoolModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLinkSchool} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">اختر المدرسة المراد ربط المستخدم بها:</label>
                <select
                  value={selectedTargetSchoolId}
                  onChange={(e) => setSelectedTargetSchoolId(e.target.value)}
                  className="w-full bg-[#151C2F] border border-blue-500/40 text-white rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  required
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.governorate || 'غماس'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 space-y-1">
                <p className="font-bold">ملاحظة الربط:</p>
                <p className="text-[11px] text-white/70">
                  سيتم احتساب هذا المستخدم تلقائياً ضمن إحصائيات طلاب/كوادر المدرسة المختارة، وربط كافة فعالياته بها.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkSchoolModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {isProcessingAction ? 'جاري الربط...' : 'تأكيد الربط بالمدرسة 🏫'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Role */}
      {isEditRoleModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1120] border-2 border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">تعديل رتبة ودور المستخدم</h3>
                  <p className="text-xs text-white/50">{selectedUserForAction.fullName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditRoleModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRole} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/70 block mb-1">اختر الدور الجديد:</label>
                <select
                  value={targetRoleSelection}
                  onChange={(e) => setTargetRoleSelection(e.target.value)}
                  className="w-full bg-[#151C2F] border border-purple-500/40 text-white rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                >
                  <option value="student">🎓 طالب (Student)</option>
                  <option value="teacher">👨‍🏫 أستاذ / معلم (Teacher)</option>
                  <option value="parent">👨‍👩‍👦 ولي أمر (Parent)</option>
                  <option value="admin">🛡️ إدارة المدرسة (Admin)</option>
                  <option value="dev">💻 مطور النظام (Developer)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                  {isProcessingAction ? 'جاري الحفظ...' : 'تحديث الدور فوراً 🛡️'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Inspect Raw User Object */}
      {isInspectUserModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1120] border border-white/20 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-indigo-400" />
                <h3 className="text-base font-black text-white">فحص سجل المستخدم البرمجي (Raw JSON)</h3>
              </div>
              <button
                onClick={() => setIsInspectUserModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-black/60 rounded-2xl p-4 border border-white/10 font-mono text-xs text-emerald-400 max-h-[60vh] overflow-y-auto dir-ltr text-left">
              <pre>{JSON.stringify(selectedUserForAction, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsInspectUserModalOpen(false)}
                className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
