import { safeStorage } from "../lib/storage";
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, addDoc, serverTimestamp, orderBy, where, getDoc, getDocFromCache, writeBatch, onSnapshot, setDoc, limit, startAfter, getCountFromServer } from '@/src/lib/firebase';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { academicService } from '../services/academicService';
import { staffService } from '../services/staffService';
import { Shield, Lock, Unlock, CheckCircle, Search, Mail, Trash2, Activity, Filter, AlertTriangle, MessageSquare, Pin, MessageSquareText, Ban, Star, Users, User, UserCircle, ShieldCheck, RotateCcw, PauseCircle, Clock, Key, GraduationCap, Briefcase, Heart, Contact, Smartphone, LogOut, Bell, UserCheck, BarChart2, Plus, Sparkles, ThumbsUp, MessageCircle, Share2, School } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../utils/auditLogger';
import { ConfirmDialog } from './ConfirmDialog';
import { getPrefixForGrade, getSanitizedSubCode } from '../utils/studentUtils';
import { subscribeMultiQuery } from '../utils/firestoreSubscriptions';
import { usePortalData } from '../hooks/usePortalData';
import { mergeDashboardData } from '../lib/dataMerger';
import { realtimeManager } from '../lib/realtimeManager';

interface UserData {
  id: string;
  fullName: string;
  schoolName?: string;
  schoolId?: string;
  name?: string;
  isBanned?: boolean;
  isTopStudent?: boolean;
  rank?: string;
  role?: 'student' | 'cadre' | 'staff' | 'parent' | 'teacher' | 'admin';
  isOnline?: boolean;
  grade?: string;
  section?: string;
  subscriptionStatus?: 'active' | 'expired' | 'pending';
  parentId?: string;
  parentName?: string;
  lastLogin?: any;
  studentCode?: string;
  parentCode?: string;
  code?: string;
  parentSubscriptionStatus?: 'active' | 'expired' | 'pending';
  parentIsBanned?: boolean;
  disciplineScore?: number;
  progressStatus?: string;
  deviceId?: string;
  canPost?: boolean;
  canComment?: boolean;
  subject?: string;
  stage?: string;
  branch?: string;
  teacherStage?: string;
  uid?: string;
  importSource?: string;
  foundInInventory?: boolean;
  classes?: string[];
  classCodes?: Record<string, string>;
}

interface PostData {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: any;
  isPinned?: boolean;
  isLocked?: boolean;
  grade?: string;
  group?: string;
  type?: string;
  stageIcon?: string;
  userPhotoURL?: string;
  reportsCount?: number;
  mediaUrl?: string;
  likes?: any[];
  comments?: any[];
  shares?: number;
  reactions?: any;
}

interface RoleStat {
  total: number;
  active: number;
}

interface PortalPulseDashboardProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
  schoolName?: string;
  schoolId?: string;
  name?: string;
  selectedSchoolId: string | null;
}

export const PortalPulseDashboard: React.FC<PortalPulseDashboardProps> = ({ showToast, schoolName, selectedSchoolId }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLastDoc, setPostsLastDoc] = useState<any>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postSearchActive, setPostSearchActive] = useState(false);
  const [postStats, setPostStats] = useState<Record<string, number>>({ total: 0, adminTeacher: 0, comments: 0, likes: 0 });
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [activeKnights, setActiveKnights] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [showOnlyActiveCadre, setShowOnlyActiveCadre] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'banned' | 'top'>('all');
  const [postFilterStage, setPostFilterStage] = useState<'all' | 'primary' | 'intermediate' | 'preparatory'>('all');
  const [postFilterGrade, setPostFilterGrade] = useState('all');
  const [postFilterType, setPostFilterType] = useState<'latest' | 'top' | 'reported' | null>(null);
  const [showPosts, setShowPosts] = useState(false);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [roleCounts, setRoleCounts] = useState<Record<string, RoleStat>>({
    student: { total: 0, active: 0 },
    cadre: { total: 0, active: 0 },
    staff: { total: 0, active: 0 },
    parent: { total: 0, active: 0 }
  });
  const [adminPhone, setAdminPhone] = useState('');
  const [adminWhatsapp, setAdminWhatsapp] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [activeRole, setActiveRole] = useState<'student' | 'cadre' | 'staff' | 'parent'>('student');
  const [selectedStage, setSelectedStage] = useState<'all' | 'primary' | 'intermediate' | 'preparatory'>('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleSaveContactNumbers = async () => {
    if (!selectedSchoolId) return;
    setIsSavingPhone(true);
    try {
      await academicService.updateSchoolSettings(selectedSchoolId, {
        adminPhone,
        adminWhatsapp
      });
      showToast('تم الحفظ بنجاح', 'success');
    } catch (e) {
      console.error("Error saving phone numbers:", e);
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveLocks = async (updates: Partial<{communityLockAll: boolean, communityLockGrades: string[], storiesLock: boolean, loungeLock: boolean}>) => {
    if (!selectedSchoolId) return;
    
    // Optimistic UI updates
    if (updates.communityLockAll !== undefined) setCommunityLockAll(updates.communityLockAll);
    if (updates.communityLockGrades !== undefined) setCommunityLockGrades(updates.communityLockGrades);
    if (updates.storiesLock !== undefined) setStoriesLock(updates.storiesLock);
    if (updates.loungeLock !== undefined) setLoungeLock(updates.loungeLock);
    
    try {
      await academicService.updateSchoolSettings(selectedSchoolId, updates);
      showToast('تم تحديث إعدادات النشر بنجاح', 'success');
    } catch (e) {
      console.error("Error saving locks:", e);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };



  const STAGES_CONFIG = {
    primary: {
      label: 'المرحلة الابتدائية',
      grades: [
        { id: '1p', label: 'الأول ابتدائي' },
        { id: '2p', label: 'الثاني ابتدائي' },
        { id: '3p', label: 'الثالث ابتدائي' },
        { id: '4p', label: 'الرابع ابتدائي' },
        { id: '5p', label: 'الخامس ابتدائي' },
        { id: '6p', label: 'السادس ابتدائي' },
      ]
    },
    intermediate: {
      label: 'المرحلة المتوسطة',
      grades: [
        { id: '1m', label: 'الأول متوسط' },
        { id: '2m', label: 'الثاني متوسط' },
        { id: '3m', label: 'الثالث متوسط' },
      ]
    },
    preparatory: {
      label: 'المرحلة الإعدادية',
      grades: [
        { id: '4s', label: 'الرابع علمي' },
        { id: '4l', label: 'الرابع أدبي' },
        { id: '5s', label: 'الخامس علمي' },
        { id: '5l', label: 'الخامس أدبي' },
        { id: '6s', label: 'السادس علمي' },
        { id: '6l', label: 'السادس أدبي' },
      ]
    }
  };
  
  const [activeTab, setActiveTab] = useState<'posts' | 'control' | 'notifications'>('posts');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostData | null>(null);
  const [isDeletePostConfirmOpen, setIsDeletePostConfirmOpen] = useState(false);
  
  // Admin announcement states
  const [isAdminPublishOpen, setIsAdminPublishOpen] = useState(false);
  const [adminPostContent, setAdminPostContent] = useState('');
  const [adminPostTargetStage, setAdminPostTargetStage] = useState<string>('all');
  const [adminPostTargetGrade, setAdminPostTargetGrade] = useState<string>('all_grades');
  const [adminPostTargetSchool, setAdminPostTargetSchool] = useState<string>('all');
  const [isPublishingAdminPost, setIsPublishingAdminPost] = useState(false);

  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [activeNotePostId, setActiveNotePostId] = useState<string | null>(null);
  const [adminNoteContent, setAdminNoteContent] = useState('');
  const [recentlySecured, setRecentlySecured] = useState<Set<string>>(new Set());
  const [adminNotifs, setAdminNotifs] = useState<any[]>([]);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [logSubTab, setLogSubTab] = useState<'student' | 'cadre' | 'parent'>('student');
  const [expandedNotifIds, setExpandedNotifIds] = useState<Set<string>>(new Set());
  const [adminQuickReplyToTicketId, setAdminQuickReplyToTicketId] = useState<string | null>(null);
  const [adminQuickReplyText, setAdminQuickReplyText] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);
  const [isDeleteAllNotifsConfirmOpen, setIsDeleteAllNotifsConfirmOpen] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [readNotifCardIds, setReadNotifCardIds] = useState<Set<string>>(() => {
    try {
      const saved = safeStorage.getItem('bayraq_admin_read_notif_cards');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markNotifCardAsRead = async (notifId: string, replies: any[] = []) => {
    setReadNotifCardIds(prev => {
      const next = new Set(prev);
      next.add(notifId);
      try {
        safeStorage.setItem('bayraq_admin_read_notif_cards', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    const unreadReplies = replies.filter(t => !t.readByAdmin);
    if (unreadReplies.length > 0) {
      setAllTickets(prev => prev.map(t => unreadReplies.some(u => u.id === t.id) ? { ...t, readByAdmin: true } : t));
      try {
        await Promise.all(unreadReplies.map(t => 
          fetch(`/api/support-tickets/${t.id}`, { 
            method: 'PATCH', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ readByAdmin: true }) 
          }).catch(() => {})
        ));
      } catch (err) {
        console.error("Error marking replies as read", err);
      }
    }
  };
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [communityLockAll, setCommunityLockAll] = useState(false);
  const [communityLockGrades, setCommunityLockGrades] = useState<string[]>([]);
  const [storiesLock, setStoriesLock] = useState(false);
  const [loungeLock, setLoungeLock] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
        if (!auth.currentUser) {
            setIsAdmin(false);
            return;
        }
      try {
            const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
            if (adminDoc.exists() || auth.currentUser.email === 'mntzralghanm527@gmail.com' || auth.currentUser.email === 'mntzr.alghanm527@gmail.com') {
                setIsAdmin(true);
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
                const udata = userDoc.data();
                if (udata.isAdmin === true || ['admin', 'admin-boys', 'admin-girls', 'manager', 'super_admin'].includes(udata.role)) {
                    setIsAdmin(true);
                    return;
                }
            }
            setIsAdmin(false);
        } catch (err: any) {
            if (err?.message?.includes('offline')) {
                try {
                    const adminDocCache = await getDocFromCache(doc(db, 'admins', auth.currentUser.uid));
                    if (adminDocCache.exists() || auth.currentUser?.email === 'mntzralghanm527@gmail.com' || auth.currentUser?.email === 'mntzr.alghanm527@gmail.com') {
                        setIsAdmin(true);
                        return;
                    }
                    const userDocCache = await getDocFromCache(doc(db, 'users', auth.currentUser.uid));
                    if (userDocCache.exists()) {
                        const udata = userDocCache.data();
                        if (udata.isAdmin === true || ['admin', 'admin-boys', 'admin-girls', 'manager', 'super_admin'].includes(udata.role)) {
                            setIsAdmin(true);
                            return;
                        }
                    }
                } catch (cacheErr) {
                    console.warn("PortalPulse caching checkAdmin failed:", cacheErr);
                }
            } else {
                console.error("PortalPulse checkAdmin error:", err);
            }
            setIsAdmin(false);
        }
    };
    checkAdmin();
  }, [auth.currentUser?.uid]);

  const fetchPostStats = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/pulse/stats?schoolId=${selectedSchoolId || 'all'}`);
      const data = await res.json();
      
      if (data.success) {
        setPostStats({
          total: data.stats.total || 0,
          adminTeacher: data.stats.adminTeacher || 0,
          comments: data.stats.comments || 0,
          likes: data.stats.likes || 0
        });
      }
    } catch(err) {
      console.log('Error fetching pulse stats from PG', err);
    }
  };

  const handleFetchComments = async (postId: string) => {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      setPostComments([]);
      return;
    }
    setExpandedCommentsPostId(postId);
    setLoadingComments(true);
    setPostComments([]);
    try {
      const res = await fetch(`/api/pulse/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setPostComments(data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments from PG', err);
      showToast("فشل جلب التعليقات", "error");
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchPosts = async (isLoadMore = false) => {
    if (isAdmin === null || !showPosts) return;
    if (isLoadMore) {
       setLoadingMorePosts(true);
    } else {
       setLoadingPosts(true);
    }

    try {
      // Use PostgreSQL API instead of Firestore
      const res = await fetch(`/api/pulse/posts?schoolId=${selectedSchoolId || 'all'}`);
      const data = await res.json();
      
      if (data.success) {
        let pData = data.posts as PostData[];

        // Filter by stage/grade (Client-side filtering for now)
        if (postFilterStage !== 'all') {
           if (postFilterGrade !== 'all') {
              const targetLabel = getGradeLabel(postFilterGrade);
              pData = pData.filter(p => normalizeArabic(p.grade || '').includes(normalizeArabic(targetLabel)));
           } else {
              const stageCfg = (STAGES_CONFIG as any)[postFilterStage];
              const gradeLabels = stageCfg?.grades?.map((g: any) => normalizeArabic(g.label)) || [];
              pData = pData.filter(p => {
                 const normalizedGrade = normalizeArabic(p.grade || '');
                 return gradeLabels.some((lbl: string) => normalizedGrade.includes(lbl));
              });
           }
        }

        // Filter/sort by type
        if (postFilterType === 'reported') {
           pData = pData.filter((p: any) => (p as any).reportsCount > 0);
           pData.sort((a: any, b: any) => ((b as any).reportsCount || 0) - ((a as any).reportsCount || 0));
        } else if (postFilterType === 'top') {
           pData.sort((a: any, b: any) => {
              const aTotal = ((a as any).likesCount || 0);
              const bTotal = ((b as any).likesCount || 0);
              return bTotal - aTotal;
           });
        }

        setPosts(pData);
        setPostsLastDoc(null);
        setHasMorePosts(false);
      }
    } catch (error: any) {
      console.error("Error fetching posts from PG:", error);
      showToast("فشل جلب المنشورات من النظام الجديد", "error");
    } finally {
      setLoadingPosts(false);
      setLoadingMorePosts(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
       fetchPostStats();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (showPosts) {
       fetchPosts();
    } else {
       setPosts([]);
    }
  }, [showPosts, postFilterStage, postFilterGrade, postFilterType]);

  const { sourceCodes, sData, uData, tData, aData, dataVersion, codesVersion } = usePortalData(isAdmin, selectedSchoolId, schoolName || '');

  useEffect(() => {
    if (isAdmin === null) return;
    
    let unsubOutbox = () => {};
    let unsubSettings = () => {};
    let unsubTickets = () => {};

    if (isAdmin) {
      const fetchAdminData = async () => {
        try {
          // Fetch Admin Outbox
          const outboxRes = await fetch('/api/admin-outbox' + (selectedSchoolId ? `?schoolId=${selectedSchoolId}` : ''));
          const outboxData = await outboxRes.json();
          if (outboxData.success) setAdminNotifs(outboxData.admin_outbox);

          // Fetch Tickets
          const ticketRes = await fetch('/api/support-tickets');
          const ticketData = await ticketRes.json();
          if (ticketData.success) setAllTickets(ticketData.tickets);
          
          // Fetch Audit Logs
          const auditRes = await fetch('/api/audit-logs?limit=50');
          const auditData = await auditRes.json();
          if (auditData.success) {
            // Mapping developer_logs to what the UI expects if needed, or just using them
            // In this UI, audit logs might be handled elsewhere or just shown in a list
          }
        } catch (e) {
          console.error("Pulse API Fetch error:", e);
        }
      };

      fetchAdminData();

      const unsubRealtimeNotifs = realtimeManager.on('notifications_updated', fetchAdminData);
      const unsubRealtimeOutbox = realtimeManager.on('admin_outbox_updated', fetchAdminData);
      const unsubRealtimeTickets = realtimeManager.on('support_tickets_updated', fetchAdminData);

      if (selectedSchoolId) {
        unsubSettings = academicService.subscribeToSchoolSettings(selectedSchoolId, (data) => {
          setAdminPhone(data.adminPhone || '');
          setAdminWhatsapp(data.adminWhatsapp || '');
          setCommunityLockAll(data.communityLockAll || false);
          setCommunityLockGrades(data.communityLockGrades || []);
          setStoriesLock(data.storiesLock || false);
          setLoungeLock(data.loungeLock || false);
        });
      }

      return () => {
        unsubRealtimeNotifs();
        unsubRealtimeOutbox();
        unsubRealtimeTickets();
        unsubSettings();
      };
    }
  }, [isAdmin, selectedSchoolId]);

  useEffect(() => {
    if (isAdmin) {
      const initialMerged = mergeDashboardData(sourceCodes, sData, uData, tData, aData);
      
      // Preserve optimistic updates for users currently undergoing actions
      setUsers(prev => {
        const activeActionUserIds = new Set(
          Object.keys(actionLoading).map(key => key.split('_')[0])
        );

        if (activeActionUserIds.size === 0) return initialMerged;

        return initialMerged.map(newUser => {
          if (activeActionUserIds.has(newUser.id)) {
            const existingUser = prev.find(u => u.id === newUser.id);
            return existingUser ? existingUser : newUser;
          }
          return newUser;
        });
      });
      
      const counts: any = {
        student: { total: 0, active: 0 },
        parent: { total: 0, active: 0 },
        cadre: { total: 0, active: 0 },
        staff: { total: 0, active: 0 }
      };

      initialMerged.forEach(u => {
        const role = normalizeRole(u.role || '', u.studentCode || u.parentCode || u.code || '');
        if (counts[role]) {
          counts[role].total++;
          if (u.isOnline) counts[role].active++;
        }
      });
      
      setRoleCounts(counts);
      setLoading(false);
    }
  }, [sourceCodes, sData, uData, tData, aData, isAdmin]);
  const handleManualRefresh = async () => {
    showToast("البيانات يتم تحديثها تلقائياً عند تغيير المصادر.", "success");
  };

  const handleSyncAndPurge = async (isSilent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    if (!isSilent) showToast("جاري المزامنة العميقة وحذف بيانات الأشباح من كافة سجلات البوابة...", "success");

    try {
      // 1. Refresh Base Data
      mergeDashboardData(sourceCodes, sData, uData, tData, aData);

      // 2. Fetch all academic lists to identify valid student and parent codes
      let listsQ = selectedSchoolId && selectedSchoolId !== 'unassigned'
        ? query(collection(db, 'academic_lists'), where('schoolId', '==', selectedSchoolId))
        : query(collection(db, 'academic_lists'), limit(150));
      const listsSnap = await getDocs(listsQ);

      const activeLists = listsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(list => {
          const listSchoolId = list.schoolId || 'unassigned';
          if (selectedSchoolId && selectedSchoolId !== 'unassigned' && listSchoolId === selectedSchoolId) {
            return true;
          }
          if (schoolName && list.school === schoolName) {
            return true;
          }
          if ((!selectedSchoolId || selectedSchoolId === 'unassigned') && (listSchoolId === 'unassigned' || listSchoolId === '')) {
            return true;
          }
          return false;
        });

      // Build Set of permitted active student and parent codes
      const activeCodes = new Set<string>();
      activeLists.forEach(list => {
        if (list.students && Array.isArray(list.students)) {
          list.students.forEach((student: any) => {
            const stCode = (student.student || student.code || '').trim().toUpperCase();
            const paCode = (student.parent || student.parentCode || '').trim().toUpperCase();
            if (stCode) activeCodes.add(stCode);
            if (paCode) activeCodes.add(paCode);
          });
        }
      });

      // 3. Query all registration/activation documents for this school
      let codesQ = selectedSchoolId && selectedSchoolId !== 'unassigned'
          ? query(collection(db, 'activation_codes'), where('schoolId', '==', selectedSchoolId))
          : query(collection(db, 'activation_codes'), limit(300));
      const codesSnap = await getDocs(codesQ);
      const schoolCodes = codesSnap.docs
        .map(doc => ({ id: doc.id, ref: doc.ref, data: doc.data() as any }))
        .filter(docItem => {
          const d = docItem.data;
          const schId = d.schoolId || 'unassigned';
          if (selectedSchoolId && selectedSchoolId !== 'unassigned' && schId === selectedSchoolId) return true;
          if (schoolName && (d.schoolName === schoolName || d.school === schoolName)) return true;
          return false;
        });

      let studentsQ = selectedSchoolId && selectedSchoolId !== 'unassigned'
          ? query(collection(db, 'school_students'), where('schoolId', '==', selectedSchoolId))
          : query(collection(db, 'school_students'), limit(300));
      const studentsSnap = await getDocs(studentsQ);
      const schoolStudents = studentsSnap.docs
        .map(doc => ({ id: doc.id, ref: doc.ref, data: doc.data() as any }))
        .filter(docItem => {
          const d = docItem.data;
          const schId = d.schoolId || 'unassigned';
          if (selectedSchoolId && selectedSchoolId !== 'unassigned' && schId === selectedSchoolId) return true;
          if (schoolName && (d.schoolName === schoolName || d.school === schoolName || d.schoolId === schoolName)) return true;
          return false;
        });

      let usersQ = selectedSchoolId && selectedSchoolId !== 'unassigned'
          ? query(collection(db, 'users'), where('schoolId', '==', selectedSchoolId))
          : query(collection(db, 'users'), limit(500));
      const usersSnap = await getDocs(usersQ);
      const schoolUsers = usersSnap.docs
        .map(doc => ({ id: doc.id, ref: doc.ref, data: doc.data() as any }))
        .filter(docItem => {
          const d = docItem.data;
          const role = (d.role || '').toLowerCase().trim();
          if (role !== 'student' && role !== 'parent' && role !== '') return false;

          const schId = d.schoolId || 'unassigned';
          if (selectedSchoolId && selectedSchoolId !== 'unassigned' && schId === selectedSchoolId) return true;
          if (schoolName && (d.schoolName === schoolName || d.school === schoolName || d.schoolId === schoolName)) return true;
          return false;
        });

      // 4. Identify orphans (ghosts) that do not belong to any active list
      const refsToDelete: any[] = [];
      const purgedCodes = new Set<string>();

      schoolCodes.forEach(docItem => {
        const d = docItem.data;
        const codeVal = (d.code || d.studentCode || d.parentCode || '').trim().toUpperCase();
        if (codeVal && !activeCodes.has(codeVal)) {
          refsToDelete.push(docItem.ref);
          purgedCodes.add(codeVal);
        }
      });

      schoolStudents.forEach(docItem => {
        const d = docItem.data;
        const codeVal = (d.code || d.studentCode || d.parentCode || '').trim().toUpperCase();
        if (codeVal && !activeCodes.has(codeVal)) {
          refsToDelete.push(docItem.ref);
          purgedCodes.add(codeVal);
        }
      });

      schoolUsers.forEach(docItem => {
        const d = docItem.data;
        const codeVal = (d.studentCode || d.parentCode || d.code || '').trim().toUpperCase();
        if (codeVal && !activeCodes.has(codeVal)) {
          refsToDelete.push(docItem.ref);
          purgedCodes.add(codeVal);
        }
      });

      // Commit document deletions in chunk batches to respect Firestore limitations
      const firestoreChunkSize = 400;
      for (let i = 0; i < refsToDelete.length; i += firestoreChunkSize) {
        const chunk = refsToDelete.slice(i, i + firestoreChunkSize);
        const purgeBatch = writeBatch(db);
        chunk.forEach(ref => purgeBatch.delete(ref));
        await purgeBatch.commit();
      }

      // 5. Deep Mechanical Sync for valid students: Ensure correct school metadata
      const studentsToFix = users.filter(u => 
        (u.role === 'student' || !u.role) && 
        (u.schoolId !== selectedSchoolId || u.schoolName !== schoolName) &&
        !u.id.startsWith('scode_') && !u.id.startsWith('pcode_') &&
        !purgedCodes.has((u.studentCode || u.parentCode || u.code || '').trim().toUpperCase())
      );

      if (studentsToFix.length > 0) {
        if (!isSilent) showToast(`جاري إصلاح بيانات ${studentsToFix.length} طالب...`, "success");
        const batch = writeBatch(db);
        studentsToFix.forEach(student => {
          const studentDocRef = doc(db, 'school_students', student.id);
          const userDocRef = doc(db, 'users', student.id);
          const update = {
            schoolId: selectedSchoolId,
            schoolName: schoolName,
            school: schoolName,
            updatedAt: serverTimestamp()
          };
          batch.update(studentDocRef, update);
          batch.update(userDocRef, update);
        });
        await batch.commit();
      }

      if (!isSilent) {
        if (refsToDelete.length > 0) {
          showToast(`تم التطهير الكامل بنجاح! تم حذف ${refsToDelete.length} سجل شبحي ويتيم من قاعدة البيانات.`, "success");
        } else {
          showToast("تمت المزامنة بنجاح! جميع البيانات مطابقة لمركز الأكواد.", "success");
        }
      }
    } catch (e) {
      console.error("Sync failed:", e);
      if (!isSilent) showToast("فشل تحديث البيانات وتطهير الأشباح", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const resolveActualId = async (user: UserData): Promise<string> => {
    // If it's already a real Firestore ID (not one of our placeholders)
    if (!user.id.startsWith('pcode_') && !user.id.startsWith('scode_') && !user.id.startsWith('tch_')) {
      return user.id;
    }

    try {
      const usersRef = collection(db, 'users');
      const userCode = (user.studentCode || user.parentCode || user.code || '').trim().toUpperCase();
      if (!userCode) return user.id;

      const normRole = normalizeRole(user.role || '', userCode);
      
      // Try multiple possible code fields in Firestore
      const fieldsToTry = ['code', 'studentCode', 'parentCode', 'userId', 'uid'];
      
      for (const fieldName of fieldsToTry) {
        const q = query(usersRef, where(fieldName, '==', userCode));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].id;
      }
      
      // Special case for teachers often prefixed with TCH-
      if (normRole === 'cadre' || normRole === 'teacher') {
        const q = query(usersRef, where('code', '==', `TCH-${userCode}`));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].id;
      }

    } catch (e) {
      console.error("ID resolution failed:", e);
    }
    return user.id;
  };

  const syncUserUpdate = async (userId: string, data: Partial<UserData>, role?: string, userCode?: string) => {
    const normRole = normalizeRole(role || '', userCode || userId);
    const collections = ['users', 'school_students', 'teachers', 'activation_codes'];
    
    // Determine prioritized collections
    const prioritized = normRole === 'student' ? ['school_students', 'users', 'activation_codes'] : 
                        (normRole === 'cadre' || normRole === 'staff') ? ['teachers', 'users', 'activation_codes'] : 
                        collections;

    let updatedCount = 0;
    const finalCode = (userCode || "").trim().toUpperCase();

    // 1. PHASE 1: Update by ID
    const updateByIdPromises = prioritized.map(async (coll) => {
      try {
        if (!userId || userId.startsWith('pcode_') || userId.startsWith('scode_')) return false;
        const docRef = doc(db, coll, userId);
        // Force set with merge to ensure document exists with the new data
        const updatePayload = { ...data };
        if (Object.keys(updatePayload).length > 0) {
          updatePayload.updatedAt = serverTimestamp();
          await setDoc(docRef, updatePayload, { merge: true });
          updatedCount++;
          return true;
        }
      } catch (err) {
        console.error(`Sync error on ID phase for ${coll}:`, err);
      }
      return false;
    });
    
    await Promise.all(updateByIdPromises);
    
    // 2. PHASE 2: Update by Code
    if (finalCode) {
      const fallbackPromises = prioritized.map(async (coll) => {
          try {
              let collectionUpdated = false;

              // Check if record exists
              const fieldsToTry = ['code', 'studentCode', 'parentCode', 'userId', 'uid'];
              let foundDocRef = null;
              
              for (const fieldName of fieldsToTry) {
                  const q = query(collection(db, coll), where(fieldName, '==', finalCode));
                  const snap = await getDocs(q);
                  if (!snap.empty) {
                      foundDocRef = snap.docs[0].ref;
                      break;
                  }
              }

              if (foundDocRef) {
                  await updateDoc(foundDocRef, { ...data, updatedAt: serverTimestamp() });
                  updatedCount++;
                  collectionUpdated = true;
              } else if (coll === 'school_students' || coll === 'users') {
                  // Optimistic creation if record not found
                  const docId = coll === 'school_students' && selectedSchoolId 
                      ? `${selectedSchoolId}_${finalCode}`.replace(/\s+/g, '_')
                      : finalCode;
                      
                  const docRef = doc(db, coll, docId);
                  await setDoc(docRef, { 
                      studentCode: normRole === 'student' ? finalCode : undefined,
                      parentCode: normRole === 'parent' ? finalCode : undefined,
                      schoolId: selectedSchoolId,
                      createdAt: serverTimestamp(),
                      ...data 
                  }, { merge: true });
                  updatedCount++;
                  collectionUpdated = true;
              }
              
              return collectionUpdated;
          } catch (e) {
              console.error(`Sync failed for collection ${coll}:`, e);
          }
          return false;
      });
      await Promise.all(fallbackPromises);
    }
    
    // 3. PHASE 3: SQL Updates (Source of Truth for Cadre & Students)
    try {
      if (normRole === 'cadre' || normRole === 'teacher' || normRole === 'staff') {
        const sqlId = userCode || userId;
        if (sqlId && !sqlId.startsWith('pcode_') && !sqlId.startsWith('scode_')) {
          await staffService.updateTeacher(sqlId, data).catch(e => console.warn("SQL Teacher sync failed:", e));
          updatedCount++;
        }
      } else if (normRole === 'student' && finalCode && selectedSchoolId) {
        const studentSqlId = `${selectedSchoolId}_${finalCode}`.replace(/\s+/g, '_');
        await academicService.updateStudent(studentSqlId, data).catch(e => console.warn("SQL Student sync failed:", e));
        updatedCount++;
      }
    } catch (err) {
      console.error("SQL Sync Phase failed:", err);
    }

    // 4. PHASE 4: Success logic
    if (updatedCount > 0) {
      console.log(`[Sync] Successfully updated ${updatedCount} records across collections.`);
    }
    return updatedCount > 0;
  };

  const handleToggleBan = async (user: UserData) => {
    // 1. Check for Admin
    if (user.role === 'admin') {
      showToast('لا يمكن تجميد حسابات الإدارة', 'error');
      return;
    }

    const loadingKey = `${user.id}_ban`;
    if (actionLoading[loadingKey]) return;
    setActionLoading(prev => ({ ...prev, [loadingKey]: 'جاري التجميد...' }));

    try {
      // 2. Validate/Find real ID for placeholder IDs using unified resolver
      const actualId = await resolveActualId(user);

      const originalStatus = user.isBanned;
      const newStatus = !originalStatus;
      
      // 3. Sync with actual ID
      const updatePayload: any = { 
        isBanned: newStatus,
        status: newStatus ? 'مجمّد' : 'نشط',
        updatedAt: serverTimestamp()
      };
      
      const success = await syncUserUpdate(actualId, updatePayload, user.role, user.studentCode || user.parentCode || user.code);
      
      if (!success) {
        showToast('فشل في تحديث حالة المستخدم في Firebase', 'error');
        return;
      }

      // Update locally - use functional update to be safe and match by multiple possible identifiers
      setUsers(prev => prev.map(u => {
        const isMatch = u.id === user.id || 
                       (u.code && user.code && u.code === user.code) ||
                       (u.studentCode && user.studentCode && u.studentCode === user.studentCode);
        return isMatch ? { ...u, isBanned: newStatus, status: newStatus ? 'مجمّد' : 'نشط' } : u;
      }));

      const roleLabel = (user.role === 'cadre' || user.role === 'teacher') ? 'للأستاذ' : 
                         user.role === 'staff' ? 'للموظف' : 
                         user.role === 'parent' ? 'لولي الأمر' : 'للطالب';

      await logActivity({
        action: newStatus ? 'تجميد حساب' : 'إلغاء التجميد',
        details: `تم ${newStatus ? 'تجميد' : 'إلغاء تجميد'} حساب ${roleLabel} ${user.fullName} بنجاح.`,
        targetId: actualId,
        targetName: user.fullName,
        targetType: 'account_freeze'
      });
      
      showToast(`تم ${newStatus ? 'تجميد' : 'إلغاء تجميد'} حساب ${roleLabel} بنجاح`, 'success');
    } catch (error) {
      console.error("Error toggling ban:", error);
      showToast('فشل في تحديث الحالة. تأكد من وجود صلاحيات كافية.', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[loadingKey];
        return next;
      });
    }
  };

  const handleUpdatePermission = async (user: UserData, field: 'canPost' | 'canComment', currentValue: boolean | undefined) => {
    const loadingKey = `${user.id}_${field}`;
    if (actionLoading[loadingKey]) return;
    setActionLoading(prev => ({ ...prev, [loadingKey]: 'جاري التحديث...' }));

    try {
      const actualId = await resolveActualId(user);

      // Treat undefined as true (allowed) by default
      const actualCurrentValue = currentValue ?? true;
      const newValue = !actualCurrentValue;
      
      const success = await syncUserUpdate(actualId, { [field]: newValue }, user.role, user.studentCode || user.parentCode || user.code);
      
      if (!success) {
        showToast('فشل في تحديث الحالة', 'error');
        return;
      }

      // Update locally - use functional update to be safe and match by multiple possible identifiers
      setUsers(prev => prev.map(u => {
        const isMatch = u.id === user.id || 
                       (u.code && user.code && u.code === user.code) ||
                       (u.studentCode && user.studentCode && u.studentCode === user.studentCode);
        return isMatch ? { ...u, [field]: newValue } : u;
      }));

      // Improved feedback messages
      const statusText = newValue ? 'تفعيل' : 'منع';
      const actionText = field === 'canPost' ? 'النشر' : 'التعليق';
      const roleLabel = (user.role === 'cadre' || user.role === 'teacher') ? 'للأستاذ' : 
                         user.role === 'staff' ? 'للموظف' : 
                         user.role === 'parent' ? 'لولي الأمر' : 'للطالب';
      
      showToast(`تم ${statusText} ${actionText} ${roleLabel} ${user.fullName}`, 'success');
      
    } catch (error) {
      console.error("Error updating permission:", error);
      showToast('حدث خطأ أثناء تحديث الصلاحية', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[loadingKey];
        return next;
      });
    }
  };

  const handleRegenerateCode = async (user: UserData) => {
    const loadingKey = `${user.id}_regenerate`;
    if (actionLoading[loadingKey]) return;
    setActionLoading(prev => ({ ...prev, [loadingKey]: 'جاري التوليد...' }));

    try {
      const actualId = await resolveActualId(user);
      const normalizedRole = normalizeRole(user.role || '', user.studentCode || user.parentCode || user.code || '');

      if (normalizedRole === 'cadre' || normalizedRole === 'staff') {
          let codeData: Record<string, string> = {};
          let syncData: any = {};
          let generatedCode = '';

          if (normalizedRole === 'cadre') {
              const subCode = getSanitizedSubCode(user.subject || 'SUB');
              const classCodes: Record<string, string> = { ...user.classes?.reduce((acc, cls) => ({ ...acc, [cls]: '' }), {}) };
              
              for (const className of (user.classes || [user.grade || ''])) {
                  const prefix = getPrefixForGrade(className);
                  const randomNum = Math.floor(1000 + Math.random() * 9000);
                  classCodes[className] = `TCH-${subCode}-${prefix}-${randomNum}`;
              }
              codeData = classCodes;
              generatedCode = Object.values(classCodes)[0];
              syncData = { classCodes: codeData, code: generatedCode };
          } else {
              // Staff
              const randomNum = Math.floor(1000 + Math.random() * 9000);
              generatedCode = `TCH-STAFF-${randomNum}`;
              syncData = { studentCode: generatedCode };
          }
          
          // Optimistically sync
          await syncUserUpdate(actualId, syncData, user.role, user.studentCode);
          
          const message = normalizedRole === 'cadre' 
              ? `تم تحديث أكواد المعلم بنجاح:\n${Object.entries(codeData).map(([cls, code]) => `${cls}: ${code}`).join('\n')}`
              : `تم تحديث كود الموظف بنجاح: ${generatedCode}`;
          
          showToast('تم تحديث الكود بنجاح', 'success');
          if (navigator.share) {
              navigator.share({ title: 'أكواد الحساب', text: message }).catch(() => {});
          } else {
              alert(message);
          }
          return;
      }

      const originalCode = user.studentCode;
      const originalParentCode = user.parentCode;
      let newCode = '';
      let newParentCode = '';

      // Generate code based on role and existing encryption (format) patterns
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      if (user.role === 'student') {
        const prefix = getPrefixForGrade(user.grade || '');
        // Extract branch from old code or default to checking school name
        let branch = 'B';
        if (originalCode && originalCode.includes('-')) {
          const parts = originalCode.split('-');
          if (parts.length > 1 && (parts[1] === 'G' || parts[1] === 'B')) {
            branch = parts[1];
          }
        } else if ((user.schoolName || (user as any).school || '').includes('بنات')) {
          branch = 'G';
        }
        
        newCode = `${prefix}-${branch}-${randomNum}`;
        newParentCode = `PAR-${branch}-${randomNum}`;
      } else if (user.role === 'parent') {
        // Parent code logic: Use PAR- prefix and same branch/number logic
        let branch = 'B';
        let studentNum: string | number = randomNum;

        if (user.studentCode && user.studentCode.includes('-')) {
          const parts = user.studentCode.split('-');
          if (parts.length > 1) {
            branch = (parts[1] === 'G' || parts[1] === 'B') ? parts[1] : branch;
            if (parts.length > 2) studentNum = parts[2];
          }
        } else if (user.parentCode && user.parentCode.includes('-')) {
          const parts = user.parentCode.split('-');
          if (parts.length > 1) {
            branch = (parts[1] === 'G' || parts[1] === 'B') ? parts[1] : branch;
            if (parts.length > 2) studentNum = parts[2];
          }
        }
        newCode = `PAR-${branch}-${studentNum}`;
        // In parents tab, regenerated code is applied to parentCode field
      } else if (user.role === 'staff') {
        newCode = `EMP-${randomNum}`;
      } else {
        // Fallback
        newCode = `ADM-${randomNum}`;
      }

      const updateData: any = {};
      if (user.role === 'parent') {
        updateData.parentCode = newCode;
      } else if (user.role === 'student') {
        updateData.studentCode = newCode;
        if (newParentCode) updateData.parentCode = newParentCode;
      } else {
        updateData.studentCode = newCode; // For cadre/staff use studentCode field for their main code
      }

      const success = await syncUserUpdate(actualId, updateData, user.role, user.studentCode || user.parentCode || user.code);
      
      if (!success) {
        showToast('فشل في تحديث الكود', 'error');
        return;
      }

      // Update locally
      setUsers(prev => prev.map(u => u.id === user.id ? (
        user.role === 'parent' 
          ? { ...u, parentCode: newCode }
          : { ...u, studentCode: newCode, parentCode: newParentCode || u.parentCode }
      ) : u));

      // Sync with activation_codes collection if it exists
      try {
        const codesRef = collection(db, 'activation_codes');
        // Find records matching either studentCode, parentCode or general code
        const safeOriginalCode = originalCode || 'unassigned';
        const safeOriginalParentCode = originalParentCode || 'unassigned';
        const queries = [
          getDocs(query(codesRef, where('studentCode', '==', safeOriginalCode))),
          getDocs(query(codesRef, where('parentCode', '==', safeOriginalCode))),
          getDocs(query(codesRef, where('code', '==', safeOriginalCode))),
          getDocs(query(codesRef, where('parentCode', '==', safeOriginalParentCode)))
        ];
        
        const snapshots = await Promise.all(queries);
        const allDocs = snapshots.flatMap(s => s.docs);
        
        const updatePromises = allDocs.map(cDoc => {
           const cData = cDoc.data();
           const update: any = {};
           
           if (user.role === 'parent') {
              update.parentCode = newCode;
              // If this is a direct parent code record
              if (cData.code === originalCode) update.code = newCode;
           } else {
              update.studentCode = newCode;
              if (cData.code === originalCode) update.code = newCode;
              if (newParentCode) update.parentCode = newParentCode;
           }
           
           return updateDoc(doc(db, 'activation_codes', cDoc.id), update);
        });
        await Promise.all(updatePromises);
      } catch (err) {
        console.warn("Could not sync activation_codes:", err);
      }
      
      showToast(`تم توليد الكود الجديد: ${newCode}`, 'success');
      
      // Share logic
      const shareText = `تم تحديث أكواد الدخول بنجاح:\n\n👤 كود الطالب: ${newCode}${newParentCode ? `\n👨‍👩‍👦 كود ولي الأمر: ${newParentCode}` : ''}`;
      if (navigator.share) {
         await navigator.share({
           title: 'تحديث كود الحساب',
           text: shareText,
         }).catch(() => {});
      } else {
        // Fallback to clipboard
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('تم نسخ المعلومات للمحافظة', 'success');
      }
    } catch (error) {
      console.error("Error regenerating code:", error);
      showToast('حدث خطأ أثناء توليد الكود', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[loadingKey];
        return next;
      });
    }
  };

  const handleSecureDevice = async (user: UserData) => {
    const loadingKey = `${user.id}_secure`;
    if (actionLoading[loadingKey]) return;
    setActionLoading(prev => ({ ...prev, [loadingKey]: 'جاري التأمين...' }));

    try {
      const actualId = await resolveActualId(user);
      if (actualId.startsWith('pcode_') || actualId.startsWith('scode_')) {
        showToast('الحساب غير مفعل على أي جهاز حالياً', 'success');
        return;
      }

      const success = await syncUserUpdate(actualId, { deviceId: '', lastLogin: null }, user.role, user.studentCode || user.parentCode || user.code);
      
      if (!success) {
        showToast('فشل في تنفيذ بروتوكول التأمين', 'error');
        return;
      }
      
      // Update locally
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, deviceId: '', lastLogin: null } : u));

      // Update recently secured state
      setRecentlySecured(prev => new Set(prev).add(user.id));
      setTimeout(() => {
        setRecentlySecured(prev => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      }, 3000); // Show "Secured" for 3 seconds

      showToast(`تم تنفيذ بروتوكول الحماية وتأمين حساب ${user.fullName}`, 'success');
    } catch (error) {
      console.error("Error securing device:", error);
      showToast('حدث خطأ أثناء تأمين الجهاز', 'error');
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[loadingKey];
        return next;
      });
    }
  };

  const handleToggleTopStudent = async (user: UserData) => {
    try {
      const newStatus = !user.isTopStudent;
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
          await updateDoc(userRef, { isTopStudent: newStatus });
      }
      setUsers(users.map(u => u.id === user.id ? { ...u, isTopStudent: newStatus } : u));
      
      // Audit log
      await logActivity({
        action: newStatus ? 'تعيين طالب متفوق' : 'إلغاء تفوق طالب',
        details: `تم ${newStatus ? 'إضافة' : 'إزالة'} الطالب ${user.fullName} من قائمة أوائل المتفوقين.`,
        targetId: user.id,
        targetName: user.fullName,
        targetType: 'student_top'
      });
      
      showToast('تمت العملية بنجاح', 'success');
    } catch (error) {
      console.error("Error toggling top student:", error);
      showToast('حدث خطأ', 'error');
    }
  };

  useEffect(() => {
    // Purposefully disabled to prevent infinite write-loops on unresolved schema issues
    /*
    if (isAdmin && codesVersion > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        handleSyncAndPurge(true);
      }, 1500); 
      return () => clearTimeout(timer);
    }
    */
  }, [codesVersion, isAdmin]);

  const handleDeletePost = (post: PostData) => {
    setPostToDelete(post);
    setIsDeletePostConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    const previousPosts = [...posts];

    try {
      setIsDeletePostConfirmOpen(false);
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postToDelete.id));

      await deleteDoc(doc(db, 'community_posts', postToDelete.id));

      logActivity({
        action: 'حذف منشور غير مناسب',
        details: `تم حذف منشور للطالب ${postToDelete.userName}.`,
        targetId: postToDelete.id,
        targetName: postToDelete.userName,
        targetType: 'post_delete'
      }).catch(console.error);
      
      showToast('تمت العملية بنجاح', 'success');
    } catch (error) {
      setPosts(previousPosts);
      console.error('Delete Error in PortalPulseDashboard:', error);
      showToast('فشلت عملية الحذف. لا تملك صلاحية أو حدث خطأ.', 'error');
    } finally {
      setPostToDelete(null);
    }
  };

  const handlePublishAdminPost = async () => {
    if (!adminPostContent.trim()) {
      showToast('الرجاء كتابة محتوى المنشور أولاً.', 'error');
      return;
    }

    try {
      setIsPublishingAdminPost(true);

      // System recognizes the school by itself from dashboard state
      const targetSchoolId = selectedSchoolId || 'all';
      const targetSchoolName = schoolName || 'جميع المدارس';

      // Determine target grade/stage
      let selectedGradeLabel = 'جميع الصفوف';
      if (adminPostTargetStage !== 'all') {
        if (adminPostTargetGrade === 'all_grades') {
          const stageCfg = (STAGES_CONFIG as any)[adminPostTargetStage];
          selectedGradeLabel = `جميع صفوف ${stageCfg?.label || 'هذه المرحلة'}`;
        } else {
          const stageCfg = (STAGES_CONFIG as any)[adminPostTargetStage];
          const grd = stageCfg?.grades?.find((g: any) => g.id === adminPostTargetGrade);
          if (grd) selectedGradeLabel = grd.label;
        }
      }

      // Determine appropriate stage icon and stickers suitable for the same stages
      let stageIcon = "📢";
      let stageStickers = ["📢", "✨", "🛡️", "🔥", "👑"];
      if (adminPostTargetStage === 'primary') {
        stageIcon = "🎒";
        stageStickers = ["🎒", "🧸", "📚", "🎈", "🍭"];
      } else if (adminPostTargetStage === 'intermediate') {
        stageIcon = "📡";
        stageStickers = ["📡", "🧠", "📐", "🔬", "🚀"];
      } else if (adminPostTargetStage === 'preparatory') {
        stageIcon = "🎓";
        stageStickers = ["🎓", "🛡️", "🧬", "🏆", "🌟"];
      }

      // Write to community_posts in Firestore
      await addDoc(collection(db, 'community_posts'), {
        userId: 'admin-broadcast',
        userName: 'الإدارة 🏛️',
        userPhotoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
        content: adminPostContent.trim(),
        timestamp: serverTimestamp(),
        schoolId: targetSchoolId,
        schoolName: targetSchoolName,
        grade: selectedGradeLabel,
        type: 'admin',
        isPinned: true,
        isLocked: false,
        likes: 0,
        comments: 0,
        stageIcon,
        stageStickers,
        reactions: {}
      });

      // Write audit log
      await logActivity({
        action: 'نشر منشور إداري',
        details: `تم نشر منشور إداري موجه إلى: ${targetSchoolName} / ${selectedGradeLabel}`,
        targetName: selectedGradeLabel,
        targetType: 'admin_post_publish'
      });

      showToast('تم نشر المنشور الإداري بنجاح وتوجيهه للفئة المستهدفة! 📢🌟', 'success');
      
      // Reset state
      setAdminPostContent('');
      setAdminPostTargetStage('all');
      setAdminPostTargetGrade('all_grades');
      setAdminPostTargetSchool('all');
      setIsAdminPublishOpen(false);

    } catch (err) {
      console.error('Error publishing admin post:', err);
      showToast('حدث خطأ أثناء محاولة نشر المنشور.', 'error');
    } finally {
      setIsPublishingAdminPost(false);
    }
  };

  const handleDeleteUser = (user: UserData) => {
      console.log("Delete button clicked for user:", user);
      setUserToDelete(user);
      setIsConfirmDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const loadingKey = `${userToDelete.id}_delete`;
    setActionLoading(prev => ({ ...prev, [loadingKey]: 'جاري الحذف...' }));

    try {
      const actualId = await resolveActualId(userToDelete);
      const batch = writeBatch(db);

      // 1. Delete from SQL server with context for thorough deletion
      const queryParams = new URLSearchParams({
        role: userToDelete.role || '',
        schoolId: selectedSchoolId || '',
        code: userToDelete.code || userToDelete.studentCode || userToDelete.parentCode || ''
      });
      
      const sqlId = actualId || userToDelete.id;
      await fetch(`/api/users/${sqlId}?${queryParams.toString()}`, { method: 'DELETE' }).catch(err => console.warn("SQL delete failed:", err));

      // 2. Delete user from Firestore 'users'
      if (actualId && !actualId.startsWith('pcode_') && !actualId.startsWith('scode_')) {
        batch.delete(doc(db, 'users', actualId));
      }

      const deletedDocPaths = new Set<string>();
      const addDelete = (docRef: any) => {
        if (!deletedDocPaths.has(docRef.path)) {
          batch.delete(docRef);
          deletedDocPaths.add(docRef.path);
        }
      };

      // Gather all related codes to sweep (both parent and student)
      const codesToSweep = new Set<string>();
      const stCode = (userToDelete.studentCode || '').trim().toUpperCase();
      const paCode = (userToDelete.parentCode || '').trim().toUpperCase();
      const codeVal = (userToDelete.code || '').trim().toUpperCase();
      
      if (stCode) codesToSweep.add(stCode);
      if (paCode) codesToSweep.add(paCode);
      if (codeVal) codesToSweep.add(codeVal);

      const codesArray = Array.from(codesToSweep);

      for (const singleCode of codesArray) {
        if (!singleCode) continue;

        // Find and delete matching activation codes
        const codesRef = collection(db, 'activation_codes');
        const q1 = query(codesRef, where('studentCode', '==', singleCode));
        const q2 = query(codesRef, where('parentCode', '==', singleCode));
        const q3 = query(codesRef, where('code', '==', singleCode));
        
        const [snap1, snap2, snap3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
        
        snap1.forEach(doc => addDelete(doc.ref));
        snap2.forEach(doc => addDelete(doc.ref));
        snap3.forEach(doc => addDelete(doc.ref));

        // Find and delete matching school students
        const schoolStudentsRef = collection(db, 'school_students');
        const sq1 = query(schoolStudentsRef, where('code', '==', singleCode));
        const sq2 = query(schoolStudentsRef, where('studentCode', '==', singleCode));
        
        const [ssSnap1, ssSnap2] = await Promise.all([getDocs(sq1), getDocs(sq2)]);
        ssSnap1.forEach(doc => addDelete(doc.ref));
        ssSnap2.forEach(doc => addDelete(doc.ref));

        // Find and delete matching users by studentCode/parentCode/code as well
        const usersRef = collection(db, 'users');
        const uq1 = query(usersRef, where('studentCode', '==', singleCode));
        const uq2 = query(usersRef, where('parentCode', '==', singleCode));
        const uq3 = query(usersRef, where('code', '==', singleCode));
        const [uSnap1, uSnap2, uSnap3] = await Promise.all([getDocs(uq1), getDocs(uq2), getDocs(uq3)]);
        uSnap1.forEach(doc => addDelete(doc.ref));
        uSnap2.forEach(doc => addDelete(doc.ref));
        uSnap3.forEach(doc => addDelete(doc.ref));
      }

      await batch.commit();

      // Filter locally
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id && 
        !codesArray.includes((u.studentCode || '').trim().toUpperCase()) &&
        !codesArray.includes((u.parentCode || '').trim().toUpperCase()) &&
        !codesArray.includes((u.code || '').trim().toUpperCase())
      ));
      
      logActivity({
        action: 'حذف مستخدم نهائي مع الأكواد',
        details: `تم حذف الحساب والبيانات التابعة لـ ${userToDelete.fullName} (${userToDelete.role}) نهائياً بالرموز: ${codesArray.join(', ') || 'بدون رمز'}.`,
        targetId: userToDelete.id,
        targetName: userToDelete.fullName,
        targetType: 'user_delete'
      }).catch(console.error);
      
      showToast('تم حذف المستخدم وكافة أكواده وبطاقاته التعريفية نهائياً من كافه السجلات', 'success');
    } catch (e) {
      console.error("Deletion Error:", e);
      showToast('فشل في حذف المستخدم وسجلاته بالكامل', 'error');
    } finally {
      const delId = userToDelete?.id;
      setUserToDelete(null);
      setIsConfirmDialogOpen(false);
      if (delId) {
        setActionLoading(prev => {
          const next = { ...prev };
          delete next[`${delId}_delete`];
          return next;
        });
      }
    }
  };

  const handleSendAdminQuickReply = async (ticketId: string, originalTicket: any) => {
    if (!adminQuickReplyText.trim()) return;
    setIsSendingQuickReply(true);
    try {
      await fetch(`/api/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminReply: adminQuickReplyText,
          status: 'resolved',
          readByStudent: false,
          readByAdmin: true
        })
      });

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchoolId || 'school_awail_ghamas',
          recipientId: originalTicket.userId || '',
          title: 'رد من الادارة 💬',
          body: adminQuickReplyText,
          type: 'general',
          read: false
        })
      });

      setAdminQuickReplyText('');
      setAdminQuickReplyToTicketId(null);
      showToast('تم إرسال الرد وتنبيه المستخدم بنجاح', 'success');
    } catch (e) {
      console.error("Error sending admin quick reply:", e);
      showToast('حدث خطأ أثناء إرسال الرد', 'error');
    } finally {
      setIsSendingQuickReply(false);
    }
  };

  const handleDeleteNotification = async (outboxId: string, refIds: any[] = []) => {
    setAdminNotifs(prev => prev.filter(n => n.id !== outboxId));
    try {
      if (refIds && refIds.length > 0) {
        await Promise.all(refIds.map(async (ref) => {
          if (ref.collection === 'support_tickets') {
            await fetch(`/api/support-tickets/${ref.id}`, { method: 'DELETE' }).catch(() => {});
          } else if (ref.collection === 'notifications') {
            await fetch(`/api/notifications/${ref.id}`, { method: 'DELETE' }).catch(() => {});
          }
        }));
      }
      await fetch(`/api/admin-outbox/${outboxId}`, { method: 'DELETE' });
      showToast('تمت إزالة التبليغ بنجاح', 'success');
    } catch (error) {
      console.error("Error deleting notification:", error);
      showToast('حدث خطأ أثناء إزالة التبليغ', 'error');
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      if (adminNotifs.length === 0) return;
      setAdminNotifs([]);
      setIsDeleteAllNotifsConfirmOpen(false);
      await fetch('/api/admin-outbox', { method: 'DELETE' }).catch(() => {});
      showToast('تم حذف كافة التبليغات المُرسلة بنجاح', 'success');
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      showToast('حدث خطأ أثناء حذف كافة التبليغات', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSendingMessage) return;
    setIsSendingMessage(true);
    
    try {
      const targetUsers = isBroadcastMode 
        ? (activeRole === 'cadre' ? filteredCadreStaff : (activeRole === 'parent' ? filteredParents : filteredStudents))
        : null;

      if (isBroadcastMode && (!targetUsers || targetUsers.length === 0)) {
        showToast('لا يوجد مستخدمون لإرسال التبليغ إليهم', 'error');
        return;
      }
      if (!isBroadcastMode && !selectedUser) return;

      const response = await fetch('/api/admin-outbox/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchoolId || 'school_awail_ghamas',
          messageText,
          activeRole,
          targetUsers: isBroadcastMode ? targetUsers : null,
          isBroadcastMode,
          selectedUser: isBroadcastMode ? null : selectedUser
        })
      });
      
      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'فشل إرسال التبليغ');
      }
      
      showToast('تمت العملية بنجاح', 'success');
      setIsMessageModalOpen(false);
      setIsBroadcastMode(false);
      setMessageText('');
      setSelectedUser(null);

      // Non-blocking background tasks
      (async () => {
        try {
          const { broadcastService } = await import('../services/broadcastService');
          if (isBroadcastMode && (activeRole === 'student' || activeRole === 'cadre' || activeRole === 'parent')) {
            await broadcastService.sendBroadcast({
              schoolId: selectedSchoolId || 'school_awail_ghamas',
              message: messageText,
              targetGrades: activeRole === 'student' ? ['الجميع'] : activeRole === 'cadre' ? ['teacher_only'] : ['parent_only'],
              durationHours: 24,
              author: 'الإدارة',
              targetLocation: 'ticker'
            });
          }
        } catch (e) {
          console.error("Failed to add to broadcast ticker:", e);
        }
        
      await logActivity({
        action: isBroadcastMode ? 'إرسال تبليغ جماعي' : 'إرسال تبليغ فردي',
        details: isBroadcastMode ? `تم إرسال رسالة جماعية لـ ${resData.count} من ${activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}.` : `تم إرسال رسالة فردية إلى ${(selectedUser as any).fullName || (selectedUser as any).name} (${activeRole === 'student' ? 'طالب' : activeRole === 'cadre' ? 'مدرس' : activeRole === 'staff' ? 'موظف' : 'ولي أمر'})`,
        targetType: isBroadcastMode ? 'broadcast_message' : 'single_message'
      });
      })();
    } catch (error) {
      console.error("Error sending message:", error);
      showToast('حدث خطأ أثناء إرسال التبليغ', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const normalizeArabic = (str: string) => {
    if (!str) return '';
    return str
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ال/g, '')
      .replace(/\s+/g, '')
      .trim()
      .toLowerCase();
  };

  const normalizeRole = (roleRaw: string, code: string) => {
      const r = (roleRaw || "").toLowerCase().trim();
      const codeUpper = String(code || "").toUpperCase().trim();
      
      // Strict role checks
      if (["student", "طالب", "طالبة", "students"].includes(r)) return "student";
      if (["parent", "ولي", "ولي امر", "أب", "أم", "ولي أمر", "parent_role", "parents"].includes(r)) return "parent";
      if (["teacher", "cadre", "admin", "مدرس", "كادر", "cadre_role", "teachers"].includes(r)) return "cadre";
      if (["staff", "employee", "موظف", "staff_role", "staffs", "employees"].includes(r)) return "staff";
      
      // Prefix checks
      if (codeUpper.startsWith('TCH-') || codeUpper.startsWith('T-')) return "cadre";
      if (codeUpper.startsWith('PAR-') || codeUpper.startsWith('P-')) return "parent";
      if (codeUpper.startsWith('EMP-') || codeUpper.startsWith('E-') || codeUpper.startsWith('STAFF-')) return "staff";
      if (codeUpper.startsWith('STU-') || codeUpper.startsWith('S-')) return "student";
      
      // Return null or unknown if undetermined, don't force 'student'
      return "unknown";
  };

  const filteredStudents = React.useMemo(() => {
    let result = users.filter(user => {
      const normalizedRole = normalizeRole(user.role || '', user.studentCode || user.parentCode || user.code || '');
      return normalizedRole === 'student';
    });

    if (searchQuery.trim()) {
      const searchTxt = searchQuery.trim().toLowerCase();
      result = result.filter(user => {
        const gradeLbl = normalizeArabic(getGradeLabel(user.grade || ''));
        return user.fullName.toLowerCase().includes(searchTxt) ||
               (user.studentCode || '').toLowerCase().includes(searchTxt) ||
               (user.parentCode || '').toLowerCase().includes(searchTxt) ||
               gradeLbl.includes(normalizeArabic(searchTxt));
      });
    }

    if (selectedStage !== 'all') {
      const currentStage = STAGES_CONFIG[selectedStage as keyof typeof STAGES_CONFIG];
      const normalizedStageLabel = normalizeArabic(currentStage.label);

      if (selectedGrade !== 'all') {
        const targetGradeObj = currentStage.grades.find(g => g.id === selectedGrade);
        const targetLabel = normalizeArabic(targetGradeObj?.label || '');
        const targetId = selectedGrade.trim().toLowerCase();

        result = result.filter(user => {
          const userGrade = String(user.grade || '').trim().toLowerCase();
          const userGrades = userGrade.split(/[,\s]+/).map(s => s.trim().toLowerCase());
          const normUserGrade = normalizeArabic(userGrade);
          
          return userGrades.includes(targetId) || 
                 normUserGrade === targetLabel || 
                 (targetLabel && normUserGrade.includes(targetLabel));
        });
      } else {
        const stageGradeIds = currentStage.grades.map(g => g.id.toLowerCase());
        const stageGradeLabels = currentStage.grades.map(g => normalizeArabic(g.label));

        result = result.filter(user => {
          const userGradeRaw = String(user.grade || '');
          const userStageRaw = String(user.stage || '');
          const normUserGrade = normalizeArabic(userGradeRaw);
          const normUserStage = normalizeArabic(userStageRaw);
          
          const userGrades = userGradeRaw.split(/[,\s]+/).map(s => s.trim().toLowerCase());
          const hasStageGrade = userGrades.some(ug => stageGradeIds.includes(ug));
          
          return hasStageGrade ||
                 stageGradeLabels.some(label => normUserGrade.includes(label)) || 
                 normUserGrade.includes(normalizedStageLabel) ||
                 normUserStage.includes(normalizedStageLabel) ||
                 userStageRaw.toLowerCase().includes(selectedStage.toLowerCase());
        });
      }
    }

    if (selectedStatus !== 'all') {
      result = result.filter(user => (user.subscriptionStatus || 'pending') === selectedStatus);
    }
    
    if (showOnlyActive) {
      result = result.filter(user => user.isOnline);
    }

    return result;
  }, [users, searchQuery, activeRole, showOnlyActive, selectedStage, selectedGrade, selectedStatus]);

  const filteredParents = React.useMemo(() => {
    let result = users.filter(user => {
      const normalizedRole = normalizeRole(user.role || '', user.studentCode || user.parentCode || user.code || '');
      return normalizedRole === 'parent';
    });

    if (searchQuery.trim()) {
      const searchTxt = searchQuery.trim().toLowerCase();
      result = result.filter(user => {
        return user.fullName.toLowerCase().includes(searchTxt) ||
               (user.studentCode || '').toLowerCase().includes(searchTxt) ||
               (user.parentCode || '').toLowerCase().includes(searchTxt);
      });
    }

    if (selectedStatus !== 'all') {
      result = result.filter(user => (user.subscriptionStatus || 'pending') === selectedStatus);
    }
    
    if (showOnlyActive) {
      result = result.filter(user => user.isOnline);
    }

    return result;
  }, [users, searchQuery, activeRole, showOnlyActive, selectedStatus]);

  const filteredCadreStaff = React.useMemo(() => {
    let result = users.filter(user => {
      const normalizedRole = normalizeRole(user.role || '', user.studentCode || user.parentCode || user.code || '');
      return (activeRole === 'cadre' && normalizedRole === 'cadre') || 
             (activeRole === 'staff' && normalizedRole === 'staff');
    });

    if (searchQuery.trim()) {
      const searchTxt = searchQuery.trim().toLowerCase();
      result = result.filter(user => {
        const gradeLbl = normalizeArabic(getGradeLabel(user.grade || ''));
        return user.fullName.toLowerCase().includes(searchTxt) ||
               (user.studentCode || '').toLowerCase().includes(searchTxt) ||
               (user.parentCode || '').toLowerCase().includes(searchTxt) ||
               (user.subject || '').toLowerCase().includes(searchTxt) ||
               (user.stage || '').toLowerCase().includes(searchTxt) ||
               gradeLbl.includes(normalizeArabic(searchTxt));
      });
    }

    if (selectedStage !== 'all') {
      const currentStage = STAGES_CONFIG[selectedStage as keyof typeof STAGES_CONFIG];
      const normalizedStageLabel = normalizeArabic(currentStage.label);

      if (selectedGrade !== 'all') {
        const targetGradeObj = currentStage.grades.find(g => g.id === selectedGrade);
        const targetLabel = normalizeArabic(targetGradeObj?.label || '');
        const targetId = selectedGrade.trim().toLowerCase();

        result = result.filter(user => {
          const userGrade = String(user.grade || '').trim().toLowerCase();
          const userGrades = userGrade.split(/[,\s]+/).map(s => s.trim().toLowerCase());
          const normUserGrade = normalizeArabic(userGrade);
          
          return userGrades.includes(targetId) || 
                 normUserGrade === targetLabel || 
                 (targetLabel && normUserGrade.includes(targetLabel));
        });
      } else {
        const stageGradeIds = currentStage.grades.map(g => g.id.toLowerCase());
        const stageGradeLabels = currentStage.grades.map(g => normalizeArabic(g.label));

        result = result.filter(user => {
          const userGradeRaw = String(user.grade || '');
          const userStageRaw = String(user.stage || '');
          const normUserGrade = normalizeArabic(userGradeRaw);
          const normUserStage = normalizeArabic(userStageRaw);
          
          const userGrades = userGradeRaw.split(/[,\s]+/).map(s => s.trim().toLowerCase());
          const hasStageGrade = userGrades.some(ug => stageGradeIds.includes(ug));
          
          return hasStageGrade ||
                 stageGradeLabels.some(label => normUserGrade.includes(label)) || 
                 normUserGrade.includes(normalizedStageLabel) ||
                 normUserStage.includes(normalizedStageLabel) ||
                 userStageRaw.toLowerCase().includes(selectedStage.toLowerCase());
        });
      }
    }

    if (selectedStatus !== 'all') {
      result = result.filter(user => (user.subscriptionStatus || 'pending') === selectedStatus);
    }
    
    if (showOnlyActiveCadre) {
      result = result.filter(user => user.isOnline);
    }

    return result;
  }, [users, searchQuery, activeRole, showOnlyActiveCadre, selectedStage, selectedGrade, selectedStatus]);


  // Helper to get grade label
  const getGradeLabel = (gradeId: string) => {
    if (!gradeId) return 'غير محدد';
    
    // Fix: Remove 'ابتدائي' if 'علمي' or 'أدبي' is present
    let cleanGradeId = gradeId;
    if (cleanGradeId.includes('علمي') || cleanGradeId.includes('أدبي')) {
        cleanGradeId = cleanGradeId.replace(/ابتدائي/g, '');
    }

    // Split by comma or newline or semicolon IF it has Arabic, but if pure English, split with spaces as well to support old list format.
    const hasArabic = /[\u0600-\u06FF]/.test(cleanGradeId);
    const ids = hasArabic
      ? cleanGradeId.split(/[,\n;+|]+/).map(s => s.trim()).filter(Boolean)
      : cleanGradeId.split(/[,\s\n;+|]+/).map(s => s.trim()).filter(Boolean);
    
    const labels = ids.map(id => {
      const normalized = normalizeArabic(id);
      
      // Check for explicit ID matches first
      for (const stage of Object.values(STAGES_CONFIG)) {
        const grade = stage.grades.find(g => g.id.toLowerCase() === id.toLowerCase());
        if (grade) return grade.label;
      }

      // Fuzzy normalization with normalizeArabic
      for (const stage of Object.values(STAGES_CONFIG)) {
        for (const grade of stage.grades) {
          if (normalizeArabic(grade.label) === normalized || normalizeArabic(grade.id) === normalized) {
            return grade.label;
          }
        }
      }

      // Fallback fuzzy checks
      if (normalized.includes('خامس')) {
          if (normalized.includes('علمي')) return 'الخامس علمي';
          if (normalized.includes('ادبي')) return 'الخامس أدبي';
          return 'الخامس ابتدائي';
      }
      if (normalized.includes('سادس')) {
          if (normalized.includes('علمي')) return 'السادس علمي';
          if (normalized.includes('ادبي')) return 'السادس أدبي';
          return 'السادس ابتدائي';
      }
      if (normalized.includes('رابع')) {
          if (normalized.includes('علمي')) return 'الرابع علمي';
          if (normalized.includes('ادبي')) return 'الرابع أدبي';
          return 'الرابع ابتدائي';
      }

      return id; // Return as is if no match found
    });

    return labels.join(' - ');
  };

  // Helper to get unified and cleaned stage/grade label avoiding duplicates like 'ابتدائي - الخامس علمي'
  const getStageAndGradeLabel = (u: UserData) => {
    const docStage = u.stage || '';
    let resolvedStage = docStage;
    const cleanGrade = (u.grade || '').trim().toLowerCase();
    
    if (cleanGrade.includes('علمي') || cleanGrade.includes('أدبي') || cleanGrade === '4s' || cleanGrade === '4l' || cleanGrade === '5s' || cleanGrade === '5l' || cleanGrade === '6s' || cleanGrade === '6l') {
        resolvedStage = 'preparatory';
    } else if (cleanGrade.includes('متوسط') || cleanGrade === '1m' || cleanGrade === '2m' || cleanGrade === '3m') {
        resolvedStage = 'intermediate';
    } else if (cleanGrade.includes('ابتدائي') || cleanGrade === '1p' || cleanGrade === '2p' || cleanGrade === '3p' || cleanGrade === '4p' || cleanGrade === '5p' || cleanGrade === '6p') {
        resolvedStage = 'primary';
    }
    
    const stageText = resolvedStage === 'primary' ? 'ابتدائي' : resolvedStage === 'intermediate' ? 'متوسط' : resolvedStage === 'preparatory' ? 'إعدادي' : (resolvedStage && resolvedStage !== 'undefined' ? resolvedStage : '');
    const gradeText = u.grade && u.grade !== 'undefined' ? getGradeLabel(u.grade) : '';
    
    if (stageText && gradeText) {
      if (gradeText.includes('علمي') || gradeText.includes('أدبي') || gradeText.includes('متوسط') || gradeText.includes('ابتدائي')) {
        return gradeText;
      }
      return `${stageText} - ${gradeText}`;
    }
    return gradeText || stageText || 'غير محدد';
  };

  const getUnreadRepliesCount = (notifications: any[]) => {
    return notifications.reduce((acc, n) => {
      if (readNotifCardIds.has(n.id)) return acc;
      const replies = allTickets.filter(t => {
        if (t.broadcastId && n.broadcastId && t.broadcastId === n.broadcastId) return true;
        if (t.replyToTicketId && n.refIds && n.refIds.some((ref: any) => ref.id === t.replyToTicketId)) return true;
        if (t.message && t.message.includes(`(تعقيباً على: "`) && n.message && t.message.includes(n.message.slice(0, 30))) {
          return true;
        }
        return false;
      });
      return acc + replies.filter(t => !t.readByAdmin).length;
    }, 0);
  };

  const totalUnreadBroadcastReplies = getUnreadRepliesCount(adminNotifs);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full -translate-y-32 -translate-x-32 blur-3xl" />
        
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Users className="text-cyan-400" size={32} />
            نبض البوابة
          </h2>
          <p className="text-white/60 mt-2 font-medium">
            مركز المراقبة والتحكم الشامل لنشاطات وحسابات الطلاب
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
        </div>
      </div>

      <div className="flex justify-center gap-2 p-4">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'posts' ? 'bg-blue-600 text-white' : 'bg-[#101935]/50 text-white/40 hover:text-white'}`}
        >
          المنشورات
        </button>
        <button 
          onClick={() => setActiveTab('control')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'control' ? 'bg-emerald-600 text-white' : 'bg-[#101935]/50 text-white/40 hover:text-white'}`}
        >
          التحكم بالحسابات
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'notifications' ? 'bg-purple-600 text-white' : 'bg-[#101935]/50 text-white/40 hover:text-white'}`}
        >
          سجل التبليغات
          {totalUnreadBroadcastReplies > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow-lg border-2 border-[#101935] animate-pulse">
              {totalUnreadBroadcastReplies}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-6 border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-5">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white font-sans">
                  <MessageSquare className="text-blue-400" size={24} />
                  مراقبة المنشورات والتعليقات
                </h3>
                <button
                  onClick={() => setIsAdminPublishOpen(!isAdminPublishOpen)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#00E5FF] hover:opacity-90 active:scale-95 text-slate-950 font-black rounded-xl text-xs tracking-wide transition-all cursor-pointer pointer-events-auto select-none shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>{isAdminPublishOpen ? 'إغلاق نافذة النشر ✖️' : 'نشر منشور إداري جديد 📢'}</span>
                </button>
              </div>

              {/* Administrative Post form panel */}
              {isAdminPublishOpen && (
                <div
                  className="bg-gradient-to-r from-indigo-950/20 to-cyan-950/20 border border-white/10 rounded-2xl p-5 mb-6 space-y-4 text-right overflow-hidden shadow-xl"
                  dir="rtl"
                >
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Sparkles size={16} className="text-[#00E5FF] animate-pulse" />
                    <span className="text-white font-black text-xs sm:text-sm">إنشاء منشور إداري موجه ومتكامل</span>
                  </div>

                  {/* Target Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Target Stage (الفئة المستهدفة) */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] text-[#00E5FF] font-bold">المرحلة المستهدفة:</label>
                      <select
                        value={adminPostTargetStage}
                        onChange={(e) => {
                          setAdminPostTargetStage(e.target.value);
                          setAdminPostTargetGrade('all_grades');
                        }}
                        className="w-full bg-slate-950 hover:bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
                      >
                        <option value="all">جميع المراحل الدراسية</option>
                        <option value="primary">المرحلة الابتدائية 🏫</option>
                        <option value="intermediate">المرحلة المتوسطة 📡</option>
                        <option value="preparatory">المرحلة الإعدادية 🎓</option>
                      </select>
                    </div>

                    {/* Specific target grade */}
                    <div className="space-y-1 text-right">
                      <label className="block text-[11px] text-[#00E5FF] font-bold">الصف المستهدف:</label>
                      <select
                        value={adminPostTargetGrade}
                        onChange={(e) => setAdminPostTargetGrade(e.target.value)}
                        disabled={adminPostTargetStage === 'all'}
                        className="w-full bg-slate-950 hover:bg-slate-950 border border-white/15 disabled:opacity-40 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-[#00E5FF]"
                      >
                        <option value="all_grades">جميع صفوف هذه المرحلة</option>
                        {adminPostTargetStage !== 'all' && 
                          (STAGES_CONFIG as any)[adminPostTargetStage]?.grades?.map((g: any) => (
                            <option key={g.id} value={g.id}>{g.label}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* Message content editor */}
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#00E5FF] font-bold">محتوى الإعلان والمنشور الإداري:</label>
                    <textarea
                      value={adminPostContent}
                      onChange={(e) => setAdminPostContent(e.target.value)}
                      placeholder="اكتب الإعلان الموجه هنا بروح الحفاوة والتشجيع للأبطال..."
                      rows={4}
                      className="w-full bg-slate-950 border border-white/10 hover:border-white/20 rounded-2xl p-4 text-white text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00E5FF]"
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-2.5 pt-1">
                    <button
                      onClick={() => setIsAdminPublishOpen(false)}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs transition-all"
                    >
                      تراجع
                    </button>
                    <button
                      onClick={handlePublishAdminPost}
                      disabled={isPublishingAdminPost || !adminPostContent.trim()}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-[#00E5FF] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isPublishingAdminPost ? 'جاري النشر وتعميم المنشور... ⏳' : 'نشر وتعميم الإعلان الإداري 🚀'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Admin Search and Stats Panel */}
              <div className="bg-[#101935]/80 border border-indigo-500/20 rounded-2xl p-4 mb-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
                
                {/* Stats Panel */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 border-b border-white/5 pb-5">
                   <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                     <span className="text-white/50 text-[10px] font-bold block mb-1">إجمالي المنشورات</span>
                     <span className="text-xl font-black text-white">{postStats.total || 0}</span>
                   </div>
                   <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-center">
                     <span className="text-blue-200/50 text-[10px] font-bold block mb-1">منشورات المعلمين والإدارة</span>
                     <span className="text-xl font-black text-blue-400">
                        {postStats.adminTeacher || 0}+
                     </span>
                   </div>
                   <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
                     <span className="text-emerald-200/50 text-[10px] font-bold block mb-1">التفاعل العام (تعليقات)</span>
                     <span className="text-xl font-black text-emerald-400">
                        {postStats.comments || 0}
                     </span>
                   </div>
                   <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
                     <span className="text-amber-200/50 text-[10px] font-bold block mb-1">إجمالي الإعجابات والتفاعلات</span>
                     <span className="text-xl font-black text-amber-400">
                        {postStats.likes || 0}
                     </span>
                   </div>
                </div>

                {/* Filters */}
                 <div className="space-y-3">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <select
                       value={postFilterStage}
                       onChange={(e) => {
                         setPostFilterStage(e.target.value as any);
                         setPostFilterGrade('all');
                         setShowPosts(false);
                       }}
                       className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                     >
                       <option value="all">جميع المراحل</option>
                       <option value="primary">المرحلة الابتدائية</option>
                       <option value="intermediate">المرحلة المتوسطة</option>
                       <option value="preparatory">المرحلة الإعدادية</option>
                     </select>
                     
                     {postFilterStage !== 'all' ? (
                       <select
                         value={postFilterGrade}
                         onChange={(e) => {
                           setPostFilterGrade(e.target.value);
                           setShowPosts(false);
                         }}
                         className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                       >
                         <option value="all">جميع صفوف المرحلة</option>
                         {postFilterStage && (STAGES_CONFIG as any)[postFilterStage]?.grades.map((grade: any) => (
                           <option key={grade.id} value={grade.id}>{grade.label}</option>
                         ))}
                       </select>
                     ) : (
                       <div className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/40 cursor-not-allowed">
                         اختر مبدئياً المرحلة الدراسية
                       </div>
                     )}

                     <select
                       value={postFilterType || ''}
                       onChange={(e) => {
                          setPostFilterType(e.target.value as any);
                          setShowPosts(false);
                       }}
                       className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                     >
                       <option value="" disabled>اختر نوع التصفية...</option>
                       <option value="latest">أحدث المنشورات</option>
                       <option value="top">أهم المنشورات</option>
                       <option value="reported">المنشورات المبلغ عنها</option>
                     </select>
                   </div>
                   
                   <div className="flex gap-2">
                     <button
                       onClick={() => {
                          setShowPosts(true);
                       }}
                       disabled={!postFilterType}
                       className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                     >
                        عرض المنشورات
                     </button>
                     {showPosts && (
                       <button
                         onClick={() => {
                           setShowPosts(false);
                         }}
                         className="px-6 py-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                       >
                         إخفاء
                       </button>
                     )}
                   </div>
                 </div>
              </div>
              
              {showPosts && (
                <div className="space-y-4 mt-6 max-h-[600px] overflow-y-auto no-scrollbar border-t border-white/5 pt-6">
                  {loadingPosts ? (
                    <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : posts.length === 0 ? (
                    <div className="text-center p-8 text-white/40 font-bold">لا توجد منشورات متطابقة</div>
                  ) : (
                    <>
                  {posts.map(post => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`backdrop-blur-md rounded-2xl border overflow-hidden shadow-2xl transition-all ${
                         (post as any).type === 'admin' 
                         ? 'bg-gradient-to-br from-amber-950/20 to-[#101935]/80 border-amber-500/30' 
                         : 'bg-[#101935]/60 border-white/5'
                      }`}
                    >
                      <div className="p-4 md:p-5 flex flex-wrap sm:flex-nowrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4 overflow-hidden w-full sm:w-auto">
                           <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border shadow-lg overflow-hidden shrink-0 ${
                             (post as any).type === 'admin' 
                               ? 'bg-amber-400 border-amber-300/30' 
                               : 'bg-blue-600/10 border-blue-500/20'
                             }`}
                           >
                             {(post as any).type === 'admin' ? (
                               (post as any).stageIcon ? (
                                 <span className="text-xl md:text-2.5xl select-none" role="img">{(post as any).stageIcon}</span>
                               ) : (
                                 <School className="text-black" size={20} />
                               )
                             ) : (post as any).userPhotoURL ? (
                               <img src={(post as any).userPhotoURL} alt={post.userName} className="w-full h-full object-cover" />
                             ) : (
                               <User size={20} className={(post as any).type === 'teacher' ? 'text-amber-400' : 'text-blue-400'} />
                             )}
                           </div>
                           <div className="min-w-0">
                             <div className="font-black text-white text-sm md:text-base flex flex-wrap items-center gap-1.5 md:gap-2">
                               <span className="truncate">{post.userName}</span>
                               {post.isPinned && <Pin size={12} className="text-amber-400 shrink-0" />}
                               {post.isLocked && <Lock size={12} className="text-rose-400 shrink-0" />}
                               {(post as any).type === 'teacher' && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold ml-1 shrink-0">كادر</span>}
                               {(post as any).type === 'admin' && <span className="bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded-full font-bold ml-1 shrink-0">إدارة</span>}
                             </div>
                             <div className="text-white/40 text-[9px] md:text-[10px] font-bold tracking-widest uppercase mt-1 truncate">
                                {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleString('ar-IQ') : 'الآن'}
                                {' · '}
                                {post.grade || 'غير محدد'}
                             </div>
                           </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0 justify-end w-full sm:w-auto mt-2 sm:mt-0">
                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, 'community_posts', post.id), { isPinned: !post.isPinned });
                              setPosts(posts.map(p => p.id === post.id ? {...p, isPinned: !p.isPinned} : p));
                              showToast('تم تحديث حالة التثبيت', 'success');
                            }}
                            className={`p-2 rounded-lg border transition-all ${post.isPinned ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}
                            title="تثبيت/إلغاء تثبيت"
                          >
                            <Pin size={16} />
                          </button>
                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, 'community_posts', post.id), { isLocked: !post.isLocked });
                              setPosts(posts.map(p => p.id === post.id ? {...p, isLocked: !post.isLocked} : p));
                              showToast('تم تحديث حالة القفل', 'success');
                            }}
                            className={`p-2 rounded-lg border transition-all ${post.isLocked ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}
                            title="قفل/فتح التعليقات"
                          >
                            <Lock size={16} />
                          </button>
                          <button 
                            onClick={() => setActiveNotePostId(activeNotePostId === post.id ? null : post.id)}
                            className={`p-2 rounded-lg border transition-all flex items-center gap-1 ${activeNotePostId === post.id ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}
                            title="تعليقات الإدارة"
                          >
                            <MessageSquareText size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeletePost(post)}
                            className="bg-rose-500/10 text-rose-400 p-2 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                            title="حذف نهائي"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="px-5">
                        {activeNotePostId === post.id && (
                          <div className="mb-4 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 animate-in fade-in zoom-in duration-200">
                              <textarea
                                  value={adminNoteContent}
                                  onChange={(e) => setAdminNoteContent(e.target.value)}
                                  className="w-full bg-transparent text-white text-sm focus:outline-none"
                                  placeholder="اكتب ملاحظة أو تعليق الإدارة..."
                              />
                              <button 
                                onClick={async () => {
                                    await addDoc(collection(db, 'community_posts', post.id, 'admin_notes'), {
                                        adminId: auth.currentUser?.uid,
                                        adminName: 'إدارة المدرسة',
                                        content: adminNoteContent,
                                        timestamp: serverTimestamp()
                                    });
                                    setAdminNoteContent('');
                                    setActiveNotePostId(null);
                                    showToast('تمت إضافة تعليق الإدارة', 'success');
                                }}
                                className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg mt-2 transition-colors cursor-pointer"
                              >حفظ التوجيه الإداري</button>
                          </div>
                        )}
                        
                        {(post as any).reportsCount && (post as any).reportsCount > 0 ? (
                          <div className="mb-4 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 flex items-center gap-2">
                             <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                             <span className="text-rose-400 text-sm font-bold">هذا المنشور محظور استلام إبلاغات ضده ({(post as any).reportsCount} إبلاغ)</span>
                          </div>
                        ) : null}
                        
                        <p className="text-white/90 leading-relaxed text-base md:text-lg whitespace-pre-wrap font-medium">{post.content}</p>
                        
                        {(post as any).mediaUrl && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                            <img src={(post as any).mediaUrl} className="w-full object-contain max-h-[500px]" alt="مرفق المنشور" />
                          </div>
                        )}
                        
                        {/* Interactive Bar */}
                        <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 pb-2 text-xs font-bold w-full">
                           <div className="flex items-center gap-1.5 text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap">
                              <ThumbsUp size={14} className={((post as any).likes?.length || 0) > 0 ? "text-cyan-400" : ""} /> 
                              <span className={((post as any).likes?.length || 0) > 0 ? "text-cyan-400" : ""}>{((post as any).likes?.length || 0)}</span>
                           </div>
                           <button 
                              onClick={() => handleFetchComments(post.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border whitespace-nowrap ${expandedCommentsPostId === post.id ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white'}`}
                           >
                              <MessageCircle size={14} /> 
                              <span>{(post as any).comments?.length || 0}</span>
                           </button>
                           <div className="flex items-center gap-1.5 text-white/30 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 whitespace-nowrap mr-auto">
                              <Share2 size={13} /> <span>{(post as any).shares || 0}</span>
                           </div>
                        </div>

                        {/* Reactions Bar (Facebook style summary) */}
                        {(post as any).reactions && Object.keys((post as any).reactions).length > 0 && (
                          <div className="pb-4 flex flex-wrap items-center gap-2">
                             <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-white font-mono text-[11px]">
                               <div className="flex items-center -space-x-1.5 space-x-reverse">
                                 {Object.keys((post as any).reactions).slice(0, 5).map(char => {
                                   if ((post as any).reactions[char] === 0) return null;
                                   return (
                                     <div key={char} className="w-6 h-6 rounded-full bg-[#101935] border border-white/10 flex items-center justify-center text-sm shadow-md z-10" title={char}>
                                       {char}
                                     </div>
                                   );
                                 })}
                               </div>
                               <span className="font-extrabold text-cyan-400 px-1 text-xs">
                                 {Number(Object.values((post as any).reactions || {}).reduce((acc: any, val: any) => acc + val, 0))}
                               </span>
                             </div>
                          </div>
                        )}

                        {expandedCommentsPostId === post.id && (
                          <div className="mt-2 mb-4 bg-black/20 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                             {loadingComments ? (
                               <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
                             ) : postComments.length === 0 ? (
                               <div className="text-center text-white/40 text-xs font-bold py-4">لا توجد تعليقات بعد</div>
                             ) : (
                               <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                 {postComments.map((comment: any) => (
                                   <div key={comment.id} className="flex gap-3">
                                      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center overflow-hidden border border-white/10">
                                        {comment.userPhotoURL ? <img src={comment.userPhotoURL} className="w-full h-full object-cover" /> : <User size={16} className="text-white/60" />}
                                      </div>
                                      <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                                         <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-white">{comment.userName}</span>
                                            <span className="text-[10px] text-white/30">{comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString('ar-IQ') : ''}</span>
                                         </div>
                                         <p className="text-white/70 text-xs leading-relaxed">{comment.content}</p>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {hasMorePosts && (
                     <div className="flex justify-center p-4">
                        <button 
                          onClick={() => fetchPosts(true)}
                          disabled={loadingMorePosts}
                          className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold disabled:opacity-50 transition-colors"
                        >
                           {loadingMorePosts ? 'جاري التحميل...' : 'تحميل المزيد'}
                        </button>
                     </div>
                  )}
                  </>
                )}
              </div>
              )}
            </div>
          </div>

          {/* Right Column: Global Publish Locks & Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-6 border-white/5 space-y-6 sticky top-6">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                <Lock className="text-red-400" size={20} />
                قيود النشر للمنصات (للطلاب)
              </h3>

              {/* Sytem Locks */}
              <div className="space-y-5">
                {/* 1. Lounge Lock */}
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <MessageSquareText className="text-purple-400" size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">قفل المجلس (الدردشة)</h4>
                      <p className="text-[10px] text-white/40">منع الطلاب من إرسال رسائل في المجلس</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveLocks({ loungeLock: !loungeLock })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${loungeLock ? 'bg-red-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${loungeLock ? 'left-1' : 'left-7'}`} />
                  </button>
                </div>

                {/* 2. Excellence Stories Lock */}
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Star className="text-amber-400" size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">قفل ستوريات التميز</h4>
                      <p className="text-[10px] text-white/40">منع الطلاب من نشر تحديثات تميز</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveLocks({ storiesLock: !storiesLock })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${storiesLock ? 'bg-red-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${storiesLock ? 'left-1' : 'left-7'}`} />
                  </button>
                </div>

                {/* 3. Community (Al-Saha) Lock */}
                <div className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Users className="text-blue-400" size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">قفل الساحة (المجتمع)</h4>
                        <p className="text-[10px] text-white/40">حصر النشر في الساحة على الإدارة والأساتذة</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveLocks({ communityLockAll: !communityLockAll })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${communityLockAll ? 'bg-red-500' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${communityLockAll ? 'left-1' : 'left-7'}`} />
                    </button>
                  </div>
                  
                  {/* Select grades if community is not completely locked */}
                  <AnimatePresence>
                    {!communityLockAll && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-4 border-t border-white/10 overflow-hidden space-y-3"
                      >
                        <p className="text-xs text-white/60 font-bold mb-2">أو قفل النشر لصفوف محددة فقط:</p>
                        {['1p', '2p', '3p', '4p', '5p', '6p', '1m', '2m', '3m', '4s', '4l', '5s', '5l', '6s', '6l'].map(gradeId => {
                          const isLocked = communityLockGrades.includes(gradeId);
                          return (
                            <div key={gradeId} className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-white/5">
                              <span className="text-xs text-white">{getPrefixForGrade(gradeId)} {gradeId.replace(/[^1-6]/g, '')}</span>
                              <button
                                onClick={() => {
                                  const newGrades = isLocked 
                                    ? communityLockGrades.filter(g => g !== gradeId)
                                    : [...communityLockGrades, gradeId];
                                  setCommunityLockGrades(newGrades);
                                  handleSaveLocks({ communityLockGrades: newGrades });
                                }}
                                className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors ${isLocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                              >
                                {isLocked ? 'مقفول' : 'مسموح'}
                              </button>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
      
      {activeTab === 'control' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Top Role Cards - Unified Horizontal Line */}
          <div className="flex flex-nowrap items-stretch gap-4 md:grid md:grid-cols-4 md:gap-6 overflow-x-auto no-scrollbar pb-4 pt-2 group-selection">
             {[
               {id: 'student', label: 'الطلاب', icon: GraduationCap, key: 'student', color: 'from-cyan-500/20 to-blue-500/20', textColor: 'text-cyan-400', glow: 'shadow-cyan-500/20'}, 
               {id: 'cadre', label: 'الكادر التدريسي', icon: Contact, key: 'cadre', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-400', glow: 'shadow-emerald-500/20'}, 
               {id: 'staff', label: 'الموظفين', icon: Briefcase, key: 'staff', color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400', glow: 'shadow-amber-500/20'},
               {id: 'parent', label: 'أولياء الأمور', icon: Heart, key: 'parent', color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400', glow: 'shadow-purple-500/20'}
             ].map(role => {
                const isActive = activeRole === role.id;
                const stats = roleCounts[role.key] || { total: 0, active: 0 };
                return (
                  <button 
                    key={role.id}
                    onClick={() => setActiveRole(role.id as any)}
                    className={`flex-1 min-w-[90px] md:min-w-[100px] glass-card p-2.5 md:p-3 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all duration-500 border-2 relative overflow-hidden group ${
                      isActive 
                        ? `border-cyan-500 bg-gradient-to-br ${role.color} scale-[1.02] shadow-lg ${role.glow}` 
                        : 'border-white/5 hover:border-white/10 hover:bg-white/5 active:scale-95'
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeRoleGlow" 
                        className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" 
                      />
                    )}
                    
                    <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0 ${
                      isActive 
                        ? 'bg-white/10 rotate-12 scale-110' 
                        : `bg-white/5 group-hover:-rotate-6 group-hover:scale-105`
                    }`}>
                      <role.icon className={isActive ? 'text-white' : role.textColor} size={isActive ? 18 : 16} />
                    </div>
                    
                    <div className="z-10 w-full">
                      <span className={`font-black block text-[10px] md:text-xs tracking-tight whitespace-nowrap ${isActive ? 'text-white' : 'text-white/60'}`}>
                        {role.label}
                      </span>
                      <div className="flex flex-col items-center gap-0 mt-0.5">
                        <div className="flex items-center gap-0.5">
                           <span className={`text-[8px] font-black ${isActive ? 'text-white' : 'text-white/30'}`}>{stats.total}</span>
                           <span className="text-[6px] text-white/20 uppercase font-bold tracking-tighter">سجل</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
             })}
          </div>
          
          <div className="glass-card p-4 md:p-8 border-white/5 relative">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 px-2 md:px-0">
                <div>
                   <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <Filter className="text-cyan-400" size={24} />
                      إدارة {activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}
                   </h3>
                   <p className="text-white/40 text-sm mt-1">فلترة متقدمة للوصول السريع لبيانات وتراخيص الحسابات</p>
                    {activeRole && activeRole !== 'student' && (
                       <button 
                         onClick={() => { setIsBroadcastMode(true); setIsMessageModalOpen(true); }}
                         className="mt-4 flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-xl font-black text-[10px] hover:bg-amber-500/20 transition-all font-sans"
                       >
                         <Bell size={14} className="animate-pulse" />
                         إرسال تبليغ للكل ({activeRole === 'parent' ? 'أولياء الأمور' : activeRole === 'cadre' ? 'الكادر' : 'الموظفين'})
                       </button>
                    )}

                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                   <div className="relative">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={activeRole === 'cadre' ? "ابحث بالاسم، الكود، أو المادة..." : "ابحث بالاسم أو الرقم..."}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pr-12 pl-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                   </div>
                   
                   {(activeRole === 'student' || activeRole === 'parent' || activeRole === 'cadre') && (
                     <>
                        <select 
                          value={selectedStage}
                          onChange={(e) => {
                            setSelectedStage(e.target.value as any);
                            setSelectedGrade('all');
                          }}
                          className="w-full bg-[#0a0f1e] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="all">كل المراحل</option>
                          <option value="primary">المرحلة الابتدائية</option>
                          <option value="intermediate">المرحلة المتوسطة</option>
                          <option value="preparatory">المرحلة الإعدادية</option>
                        </select>

                        {selectedStage !== 'all' && (
                          <select 
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="w-full bg-[#0a0f1e] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 animate-in fade-in slide-in-from-right-2"
                          >
                            <option value="all">كل الصفوف</option>
                            {STAGES_CONFIG[selectedStage as keyof typeof STAGES_CONFIG].grades.map(grade => (
                              <option key={grade.id} value={grade.id}>{grade.label}</option>
                            ))}
                          </select>
                        )}

                        <select 
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full bg-[#0a0f1e] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="all">كل حالات الكود</option>
                          <option value="active">كود مفعل (مستخدم)</option>
                          <option value="expired">منتهي الصلاحية</option>
                          <option value="pending">غير مستخدم بعد</option>
                        </select>
                        <button
                          onClick={() => {
                            if (activeRole === 'cadre') {
                              setShowOnlyActiveCadre(!showOnlyActiveCadre);
                            } else {
                              setShowOnlyActive(!showOnlyActive);
                            }
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border ${
                            (activeRole === 'cadre' ? showOnlyActiveCadre : showOnlyActive) 
                              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' 
                              : 'bg-white/5 border-white/10 text-white/60 hover:border-emerald-500/30'
                          }`}
                        >
                          <Users size={16} />
                          {(activeRole === 'cadre' ? showOnlyActiveCadre : showOnlyActive) ? 'النشطون الآن' : 'جميع المستخدمين'}
                        </button>
                     </>
                   )}
                </div>
             </div>

              <div className="mt-8">
                {(activeRole === 'student' || activeRole === 'parent') ? (
                  <>
                    {activeRole === 'parent' && (
                      <div className="mb-6 bg-white/5 p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-end gap-4 shadow-xl">
                        <div className="flex-1 w-full space-y-2">
                          <label className="text-xs text-white/40 uppercase font-black px-1 flex items-center gap-2">
                            <Smartphone size={14} className="text-emerald-400" />
                            رقم هاتف الإدارة (للاتصال المباشر)
                          </label>
                          <input 
                            value={adminPhone} 
                            onChange={e => setAdminPhone(e.target.value)} 
                            placeholder="مثال: 07700000000" 
                            dir="ltr"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-left font-mono focus:border-purple-500/50 outline-none transition-colors"
                          />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <label className="text-xs text-white/40 uppercase font-black px-1 flex items-center gap-2">
                            <MessageSquare className="text-green-500" size={14} />
                            رقم واتساب الإدارة
                          </label>
                          <input 
                            value={adminWhatsapp} 
                            onChange={e => setAdminWhatsapp(e.target.value)} 
                            placeholder="مثال: +9647700000000" 
                            dir="ltr"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-left font-mono focus:border-purple-500/50 outline-none transition-colors"
                          />
                        </div>
                        <button 
                          onClick={handleSaveContactNumbers}
                          disabled={isSavingPhone}
                          className="md:w-auto w-full px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
                        >
                          {isSavingPhone ? 'جاري الحفظ...' : 'حفظ أرقام التواصل'}
                        </button>
                      </div>
                    )}
                    {/* Breadcrumbs for Navigation */}
                    <div className="flex items-center gap-2 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <button 
                          onClick={() => { setSelectedStage('all'); setSelectedGrade('all'); setSearchQuery(''); }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${selectedStage === 'all' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white'}`}
                        >
                          المحطة الرئيسية
                        </button>
                        {selectedStage !== 'all' && (
                          <>
                            <span className="text-white/20">/</span>
                            <button 
                              onClick={() => { setSelectedGrade('all'); }}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${selectedGrade === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-white/40 hover:text-white'}`}
                            >
                              {STAGES_CONFIG[selectedStage as keyof typeof STAGES_CONFIG].label}
                            </button>
                          </>
                        )}
                        {selectedGrade !== 'all' && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/20">/</span>
                            <span className="text-xs font-black text-white bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shrink-0">
                              {getGradeLabel(selectedGrade)}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Folder View vs Student View */}
                    <AnimatePresence mode="wait">
                      {searchQuery === '' && selectedStage === 'all' ? (
                         <motion.div 
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                           className="grid grid-cols-1 md:grid-cols-3 gap-6"
                         >
                            {Object.entries(STAGES_CONFIG).map(([key, config]) => (
                               <button 
                                 key={key}
                                 onClick={() => setSelectedStage(key as any)}
                                 className="group bg-[#0c1225]/40 border border-white/5 p-8 rounded-[2rem] hover:bg-cyan-500/5 hover:border-cyan-500/30 transition-all flex flex-col items-center gap-4 relative overflow-hidden"
                               >
                                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                     <GraduationCap size={120} />
                                  </div>
                                  <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                     <Users size={32} />
                                  </div>
                                  <div className="text-center">
                                     <h4 className="text-xl font-black text-white">{config.label}</h4>
                                     <p className="text-white/40 text-xs mt-1">تصفح ملفات هذه المرحلة</p>
                                  </div>
                                  <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full text-[10px] text-white/40 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors">
                                     انقر لفتح الملفات
                                  </div>
                               </button>
                            ))}
 
                      </motion.div>
                       ) : searchQuery === '' && selectedGrade === 'all' ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                        >
                           {STAGES_CONFIG[selectedStage as keyof typeof STAGES_CONFIG].grades.map((grade) => (
                              <button 
                                key={grade.id}
                                onClick={() => setSelectedGrade(grade.id)}
                                className="group bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all flex flex-col items-center gap-3"
                              >
                                 <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                                    <Clock size={24} />
                                 </div>
                                 <span className="text-xs font-bold text-white/70 group-hover:text-white text-center">{grade.label}</span>
                              </button>
                           ))}
                        </motion.div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {(() => {
                            const activeList = activeRole === 'student' ? filteredStudents : 
                                               activeRole === 'parent' ? filteredParents : 
                                               filteredCadreStaff;
                            return activeList.length === 0 ? (
                              <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Users className="mx-auto text-white/10 mb-4" size={48} />
                                <p className="text-white/40">لا يوجد بيانات في هذا الملف حالياً.</p>
                              </div>
                            ) : (
                              activeList.map((user) => (
                                <motion.div 
                                  key={user.id} 
                                  className="bg-[#0c1225]/80 border border-white/10 rounded-[16px] p-5 hover:border-cyan-500/40 transition-all flex flex-col gap-4 relative group overflow-hidden shadow-2xl"
                                >
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-all" />
                                
                                <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                       <div className={`w-3.5 h-3.5 rounded-full absolute -top-1 -right-1 z-20 border-2 border-[#0c1225] shadow-[0_0_10px] ${user.isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-white/10'}`} />
                                       <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/30 transition-all">
                                          <UserCircle className="text-white/40 group-hover:text-white transition-colors" size={32} />
                                       </div>
                                    </div>
                                    <div>
                                      <h4 className="font-black text-white text-xl tracking-tight leading-tight group-hover:text-cyan-400 transition-colors">{user.fullName}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[11px] text-cyan-400 font-black uppercase tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded-lg border border-cyan-400/20">
                                           {user.role === 'cadre' ? (
                                             <span>{user.subject || 'مدرس'}</span>
                                           ) : user.role === 'staff' ? 'موظف إداري' : user.role === 'parent' ? 'ولي أمر' : getGradeLabel(user.grade || '')}
                                        </span>
                                        {!(user.role === 'student' || !user.role) && (user.stage || user.grade) && (
                                          <span className="text-[10px] text-emerald-400 font-black tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                                             {(user.stage === 'primary' ? 'ابتدائي' : user.stage === 'intermediate' ? 'متوسط' : user.stage === 'preparatory' ? 'إعدادي' : (user.stage && user.stage !== 'undefined' ? user.stage : ''))}
                                             {user.grade && user.grade !== 'undefined' && ` - ${getGradeLabel(user.grade)}`}
                                          </span>
                                        )}
                                        
                                     </div>
                                    </div>
                                  </div>
                                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                                    user.isBanned ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 
                                    (!user.deviceId && !user.lastLogin) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
                                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                  }`}>
                                    {user.isBanned ? 'حساب مجمّد' : (!user.deviceId && !user.lastLogin) ? 'قيد التفعيل' : 'مفعل'}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                   <div className="bg-black/40 p-2 rounded-xl border border-white/5 group-hover:border-cyan-500/20 transition-all group-hover:shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
                                      <span className="text-[8px] text-white/30 uppercase block mb-0.5 font-black">{(activeRole === 'parent' || activeRole === 'student') ? 'كود الطالب' : 'الانضباط العام'}</span>
                                      <div className="flex items-end gap-1">
                                         <span className="text-cyan-400 font-black text-xs font-mono">{(activeRole === 'parent' || activeRole === 'student') ? (user.studentCode || 'N/A') : `${(user as any).disciplineScore || '98'}%`}</span>
                                         {activeRole !== 'parent' && activeRole !== 'student' && <UserCheck size={12} className="text-cyan-500/40 mb-0.5" />}
                                         {(activeRole === 'student' || activeRole === 'parent') && <ShieldCheck size={12} className="text-cyan-500/40 mb-0.5" />}
                                      </div>
                                   </div>
                                   <div className="bg-black/40 p-2 rounded-xl border border-white/5 group-hover:border-amber-500/20 transition-all group-hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                                      <span className="text-[8px] text-white/30 uppercase block mb-0.5 font-black">{(activeRole === 'parent' || activeRole === 'student') ? 'كود ولي الأمر' : 'التقدم الدراسي'}</span>
                                      <div className="flex items-end gap-1">
                                         <span className="text-amber-400 font-black text-xs font-mono">{(activeRole === 'parent' || activeRole === 'student') ? (user.parentCode || 'N/A') : ((user as any).progressStatus || 'MVP')}</span>
                                         {activeRole !== 'parent' && activeRole !== 'student' && <Star size={12} className="text-amber-500/40 mb-0.5" />}
                                         {(activeRole === 'student' || activeRole === 'parent') && <Heart size={12} className="text-amber-500/40 mb-0.5" />}
                                      </div>
                                   </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between text-[10px] bg-black/60 px-4 py-3 rounded-xl border border-white/5 font-mono group-hover:border-cyan-500/20 transition-all">
                                    <div className="flex items-center gap-3">
                                      <Smartphone size={16} className="text-cyan-500/40" />
                                      <span className="text-white/60 tracking-widest">{user.deviceId ? user.deviceId.substring(0, 12).toUpperCase() : 'لم يتم الربط'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                                      <span className={user.isOnline ? 'text-emerald-500 font-black' : 'text-white/20'}>{user.isOnline ? 'متصل الآن' : 'غير متصل'}</span>
                                    </div>
                                  </div>
                                  
                                  {user.lastLogin && (
                                    <div className="flex items-center gap-2 px-4 text-[9px] text-white/30 font-mono">
                                      <Clock size={10} className="text-cyan-500/40" />
                                      <span>آخر ظهور: {new Date(user.lastLogin?.seconds * 1000).toLocaleString('ar-IQ')}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-white/5">
                                  <button 
                                    onClick={() => handleUpdatePermission(user, 'canPost', user.canPost)}
                                    disabled={!!actionLoading[`${user.id}_canPost`]}
                                    className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[10px] font-black ${user.canPost === false ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} disabled:opacity-50`}
                                  >
                                    <MessageSquare size={14} />
                                    {actionLoading[`${user.id}_canPost`] || (user.canPost === false ? 'تفعيل النشر' : 'منع النشر')}
                                  </button>
                                  <button 
                                    onClick={() => handleUpdatePermission(user, 'canComment', user.canComment)}
                                    disabled={!!actionLoading[`${user.id}_canComment`]}
                                    className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[10px] font-black ${user.canComment === false ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} disabled:opacity-50`}
                                  >
                                    <MessageSquare size={14} />
                                    {actionLoading[`${user.id}_canComment`] || (user.canComment === false ? 'تفعيل التعليق' : 'منع التعليق')}
                                  </button>
                                 <button 
                                   onClick={() => handleRegenerateCode(user)}
                                   disabled={!!actionLoading[`${user.id}_regenerate`]}
                                   className="py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                 >
                                   <RotateCcw size={14} />
                                   {actionLoading[`${user.id}_regenerate`] || 'إعادة توليد الكود'}
                                 </button>
                                 <button 
                                   onClick={() => handleToggleBan(user)}
                                   disabled={!!actionLoading[`${user.id}_ban`]}
                                   className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[10px] font-black ${user.isBanned ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'} disabled:opacity-50`}
                                 >
                                   {user.isBanned ? <Unlock size={14}/> : <Ban size={14}/>}
                                   {actionLoading[`${user.id}_ban`] || (user.isBanned ? 'إلغاء التجميد' : 'تجميد الحساب')}
                                 </button>
                                 <button
                                     onClick={() => handleSecureDevice(user)}
                                     disabled={!!actionLoading[`${user.id}_secure`]}
                                     className={`py-2 rounded-xl border transition-all text-[10px] font-black flex items-center justify-center gap-1.5 ${recentlySecured.has(user.id) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'} disabled:opacity-50`}
                                   >
                                     <ShieldCheck size={14} className={recentlySecured.has(user.id) ? 'text-emerald-400' : 'text-cyan-400'} /> 
                                     {actionLoading[`${user.id}_secure`] || (recentlySecured.has(user.id) ? 'تم التأمين' : 'تأمين الجهاز')}
                                   </button>
                                 <button 
                                   onClick={() => {
                                     setSelectedUser(user);
                                     setMessageText('');
                                     setIsBroadcastMode(false);
                                      setIsMessageModalOpen(true);
                                   }}
                                   className="py-2 rounded-xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black hover:bg-cyan-600/20 flex items-center justify-center gap-1.5 transition-all"
                                 >
                                   <MessageSquare size={14} />
                                   بدء محادثة
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteUser(user)}
                                   disabled={!!actionLoading[`${user.id}_delete`]}
                                   className="py-2 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 text-[10px] font-black hover:bg-rose-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                 >
                                   <Trash2 size={14} />
                                   {actionLoading[`${user.id}_delete`] || 'حذف نهائي'}
                                 </button>
                               </div>
                             </motion.div>
                           ))
                         )})()}
                       </motion.div>)
                     }
                   </AnimatePresence>
                 </>
               ) : (
                  filteredCadreStaff.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                       <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                         <UserCircle size={32} className="text-white/20" />
                       </div>
                       <p className="text-white/40">لا يوجد بيانات حالياً.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredCadreStaff.map(user => (
                        <motion.div key={user.id} className="bg-[#0c1225]/80 p-5 rounded-[16px] border border-white/10 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/5 blur-2xl" />
                            
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                                  <UserCircle size={24} />
                                </div>
                                <div>
                                   <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{user.fullName}</h4>
                                   <div className="flex flex-col gap-1 mt-1">
                                      {['cadre', 'teacher', 'teachers'].includes((user.role || '').toLowerCase()) && (
                                        <>
                                          {user.subject && (
                                            <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                              مدرس {user.subject}
                                            </p>
                                          )}
                                        </>
                                      )}
                                   </div>
                                   <div className="flex flex-wrap gap-1 mt-2">
                                   </div>
                                   <div className="flex items-center gap-2 mt-2">
                                     <span className="text-[10px] text-cyan-400 font-bold px-2 py-1 bg-cyan-400/10 rounded-md border border-cyan-400/20 flex items-center gap-2">
                                       {['cadre', 'teacher', 'teachers'].includes((user.role || '').toLowerCase()) ? (
                                         <div className="flex items-center gap-2">
                                           <span>كادر تدريسي</span>
                                           {(user.classes && user.classes.length > 0) ? (
                                             <div className="flex flex-wrap items-center gap-1">
                                               <span className="w-1 h-1 rounded-full bg-cyan-400/40 mx-1" />
                                               {user.classes.map((cls: string) => (
                                                  <span key={cls} className="text-[9px] text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">{getGradeLabel(cls)}</span>
                                               ))}
                                             </div>
                                           ) : (user.stage || user.grade) ? (
                                              <>
                                                <span className="w-1 h-1 rounded-full bg-cyan-400/40" />
                                                <span className="text-emerald-400">
                                                   {(user.stage === 'primary' ? 'ابتدائي' : user.stage === 'intermediate' ? 'متوسط' : user.stage === 'preparatory' ? 'إعدادي' : (user.stage && user.stage !== 'undefined' ? user.stage : ''))}
                                                   {user.grade && user.grade !== 'undefined' && ` - ${getGradeLabel(user.grade)}`}
                                                </span>
                                              </>
                                           ) : null}
                                         </div>
                                       ) : ['staff', 'employee'].includes((user.role || '').toLowerCase()) ? 'موظف' : user.role === 'parent' ? 'ولي أمر' : getGradeLabel(user.grade || '')}
                                     </span>
                                     {user.role === 'parent' && <span className="text-[10px] text-white/30 font-mono tracking-widest bg-white/5 px-2 py-0.5 rounded">{user.parentCode || 'بدون كود'}</span>}
                                   </div>
                               </div>
                             </div>
                             <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter ${
                               user.isBanned ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 
                               (!user.deviceId && !user.lastLogin) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                               'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                             }`}>
                               {user.isBanned ? 'مجمد' : (!user.deviceId && !user.lastLogin) ? 'قيد التفعيل' : 'مفعل'}
                             </div>
                           </div>

                            <div className="flex flex-col gap-3">
                                 <div className="flex items-center justify-between text-[10px] bg-black/40 px-3 py-2 rounded-xl border border-white/5 font-mono">
                                   <div className="flex items-center gap-2">
                                     <Smartphone size={14} className="text-cyan-500/40" />
                                     <span className="text-white/60">{user.deviceId ? user.deviceId.substring(0, 10).toUpperCase() : 'غير مربوط'}</span>
                                   </div>
                                   <div className="flex items-center gap-1.5">
                                      <div className={`w-1 h-1 rounded-full ${user.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                                      <span className={user.isOnline ? 'text-emerald-500 font-bold' : 'text-white/20'}>{user.isOnline ? 'نشط' : 'أوفلاين'}</span>
                                   </div>
                                 </div>
                                 
                                 {user.lastLogin && (
                                    <div className="flex items-center gap-2 px-1 text-[9px] text-white/30 font-mono">
                                      <Clock size={10} className="text-cyan-500/40" />
                                      <span>آخر ظهور: {new Date(user.lastLogin?.seconds * 1000).toLocaleString('ar-IQ')}</span>
                                    </div>
                                  )}
                               </div>

                                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/5">
                                 <button 
                                   onClick={() => handleUpdatePermission(user, 'canPost', user.canPost)}
                                   disabled={!!actionLoading[`${user.id}_canPost`]}
                                   className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[10px] font-black ${user.canPost === false ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} disabled:opacity-50`}
                                 >
                                   <MessageSquare size={14} />
                                   {actionLoading[`${user.id}_canPost`] || (user.canPost === false ? 'تفعيل النشر' : 'منع النشر')}
                                 </button>
                                 <button 
                                   onClick={() => handleUpdatePermission(user, 'canComment', user.canComment)}
                                   disabled={!!actionLoading[`${user.id}_canComment`]}
                                   className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[10px] font-black ${user.canComment === false ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} disabled:opacity-50`}
                                 >
                                   <MessageSquare size={14} />
                                   {actionLoading[`${user.id}_canComment`] || (user.canComment === false ? 'تفعيل التعليق' : 'منع التعليق')}
                                 </button>

                                 <button 
                                   onClick={() => handleRegenerateCode(user)}
                                   disabled={!!actionLoading[`${user.id}_regenerate`]}
                                   className="py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                                 >
                                   <RotateCcw size={14} />
                                   {actionLoading[`${user.id}_regenerate`] || 'إعادة توليد الكود'}
                                 </button>
                                 <button 
                                   onClick={() => handleToggleBan(user)}
                                   disabled={!!actionLoading[`${user.id}_ban`]}
                                   className={`py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[10px] font-black ${user.isBanned ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'} disabled:opacity-50`}
                                 >
                                   {user.isBanned ? <Unlock size={14} className="text-emerald-400" /> : <Ban size={14} className="text-rose-400" />}
                                   {actionLoading[`${user.id}_ban`] || (user.isBanned ? 'تفعيل الحساب' : 'تجميد الحساب')}
                                 </button>
                                 <button 
                                     onClick={() => handleSecureDevice(user)}
                                     disabled={!!actionLoading[`${user.id}_secure`]}
                                     className={`py-2 rounded-xl border transition-all text-[10px] font-black flex items-center justify-center gap-1.5 ${recentlySecured.has(user.id) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'} disabled:opacity-50`}
                                   >
                                     <ShieldCheck size={14} className={recentlySecured.has(user.id) ? 'text-emerald-400' : 'text-cyan-400'} /> 
                                     {actionLoading[`${user.id}_secure`] || (recentlySecured.has(user.id) ? 'تم التأمين' : 'تأمين الجهاز')}
                                   </button>
                                 <button 
                                   onClick={() => { setSelectedUser(user); setMessageText(''); setIsBroadcastMode(false); setIsMessageModalOpen(true); }}
                                   className="py-2 rounded-xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black hover:bg-cyan-600/20 flex items-center justify-center gap-1.5 transition-all"
                                 >
                                   <MessageSquare size={14} />
                                   بدء محادثة
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteUser(user)}
                                   disabled={!!actionLoading[`${user.id}_delete`]}
                                   className="py-2 rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20 text-[10px] font-black hover:bg-rose-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                                 >
                                   <Trash2 size={14} />
                                   {actionLoading[`${user.id}_delete`] || 'حذف نهائي'}
                                 </button>
                               </div>
                        </motion.div>
                      ))
                    }
                  </div>
                )
              )}
            </div>
              </div>
            </div>
        )}
      
      {activeTab === 'notifications' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 max-w-4xl mx-auto">
          <div className="glass-card p-6 border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Bell className="text-purple-400" size={24} />
                سجل التبليغات المرسلة (لجميع الفئات)
              </h3>
              
              {adminNotifs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsDeleteAllNotifsConfirmOpen(true)}
                  className="px-4 py-2 text-xs font-black bg-rose-600/25 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-lg shadow-rose-950/20"
                >
                  <Trash2 size={13} />
                  <span>🧹 حذف الكل</span>
                </button>
              )}
            </div>

            {/* أزرار التصفية الثلاثية لتقسيم سجل التبليغات من الإدارة */}
            <div className="grid grid-cols-3 bg-[#101935]/80 p-1 rounded-2xl border border-white/5 mb-6 gap-1 relative z-10">
              <button 
                type="button"
                onClick={() => setLogSubTab('student')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer relative ${logSubTab === 'student' ? 'bg-[#FFD600] text-black shadow-lg scale-102' : 'text-white/40 hover:text-white/80'}`}
              >
                <span>👨‍🎓 الطلاب</span>
                {(() => {
                  const unread = getUnreadRepliesCount(adminNotifs.filter(n => n.targetRole === 'student'));
                  if (unread === 0) return null;
                  return (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 min-w-[20px] rounded-full font-bold border-2 border-[#101935] animate-pulse">
                      {unread}
                    </span>
                  );
                })()}
              </button>
              
              <button 
                type="button"
                onClick={() => setLogSubTab('cadre')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer relative ${logSubTab === 'cadre' ? 'bg-[#FFD600] text-black shadow-lg scale-102' : 'text-white/40 hover:text-white/80'}`}
              >
                <span>👨‍🏫 التدريسيين</span>
                {(() => {
                  const unread = getUnreadRepliesCount(adminNotifs.filter(n => n.targetRole === 'cadre' || n.targetRole === 'staff' || n.targetRole === 'teacher'));
                  if (unread === 0) return null;
                  return (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 min-w-[20px] rounded-full font-bold border-2 border-[#101935] animate-pulse">
                      {unread}
                    </span>
                  );
                })()}
              </button>
              
              <button 
                type="button"
                onClick={() => setLogSubTab('parent')}
                className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer relative ${logSubTab === 'parent' ? 'bg-[#FFD600] text-black shadow-lg scale-102' : 'text-white/40 hover:text-white/80'}`}
              >
                <span>👨‍👩‍👦 أولياء الأمور</span>
                {(() => {
                  const unread = getUnreadRepliesCount(adminNotifs.filter(n => n.targetRole === 'parent'));
                  if (unread === 0) return null;
                  return (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 min-w-[20px] rounded-full font-bold border-2 border-[#101935] animate-pulse">
                      {unread}
                    </span>
                  );
                })()}
              </button>
            </div>

            <div className="space-y-4">
              {adminNotifs.filter(n => {
                if (logSubTab === 'student') return n.targetRole === 'student';
                if (logSubTab === 'parent') return n.targetRole === 'parent';
                if (logSubTab === 'cadre') return n.targetRole === 'cadre' || n.targetRole === 'staff' || n.targetRole === 'teacher';
                return true;
              }).length === 0 ? (
                <div className="text-center py-12 text-white/40 border border-dashed border-white/10 rounded-[2rem]">
                  لا توجد تبليغات مرسلة في هذه الفئة حالياً
                </div>
              ) : (
                adminNotifs.filter(n => {
                  if (logSubTab === 'student') return n.targetRole === 'student';
                  if (logSubTab === 'parent') return n.targetRole === 'parent';
                  if (logSubTab === 'cadre') return n.targetRole === 'cadre' || n.targetRole === 'staff' || n.targetRole === 'teacher';
                  return true;
                }).map((n, idx) => {
                  // Find replies to this notification
                  const replies = allTickets.filter(t => {
                    if (t.broadcastId && n.broadcastId && t.broadcastId === n.broadcastId) return true;
                    if (t.replyToTicketId && n.refIds && n.refIds.some((ref: any) => ref.id === t.replyToTicketId)) return true;
                    if (t.message && t.message.includes(`(تعقيباً على: "`) && n.message && t.message.includes(n.message.slice(0, 30))) {
                      return true;
                    }
                    return false;
                  });

                  const unreadReplies = replies.filter(t => !t.readByAdmin);
                  const isCardUnread = unreadReplies.length > 0 && !readNotifCardIds.has(n.id);
                  const isExpanded = expandedNotifIds.has(n.id);
                  const toggleExpand = async () => {
                    const copy = new Set(expandedNotifIds);
                    if (copy.has(n.id)) {
                      copy.delete(n.id);
                    } else {
                      copy.add(n.id);
                      markNotifCardAsRead(n.id, replies);
                    }
                    setExpandedNotifIds(copy);
                  };

                  return (
                    <div 
                      key={n.id || idx} 
                      onClick={() => markNotifCardAsRead(n.id, replies)}
                      className={`bg-[#101935] p-5 rounded-3xl border transition-all flex flex-col gap-4 group ${isCardUnread ? 'border-red-500/40 bg-[#141b3d]' : 'border-white/5 hover:border-purple-500/20'}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2 cursor-pointer" onClick={toggleExpand}>
                           <h4 className="text-white font-bold text-sm flex items-center gap-2 flex-wrap">
                              {n.title || 'تبليغ إداري عام'}
                              <span className={`${n.type === 'broadcast' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'} text-[9px] px-2 py-0.5 rounded-full font-black`}>
                                {n.type === 'broadcast' ? `جماعي (${n.count})` : 'فردي'}
                              </span>
                              {isCardUnread && (
                                <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1 shadow-lg shadow-red-500/30">
                                  <span>رد جديد ({unreadReplies.length})</span>
                                </span>
                              )}
                           </h4>
                           <p className="text-white/60 text-xs leading-relaxed max-w-2xl">{n.message}</p>
                           <div className="flex items-center gap-4 text-[10px] text-white/30 font-mono">
                             <span className="capitalize">{n.targetRole === 'cadre' ? 'كادر تدريسي' : n.targetRole === 'staff' ? 'موظف إداري' : n.targetRole === 'parent' ? 'ولي أمر' : 'طالب'}</span>
                             {n.createdAt && <span>التاريخ: {new Date(n.createdAt).toLocaleString('ar-IQ')}</span>}
                           </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 justify-end">
                           {replies.length > 0 && (
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 toggleExpand();
                               }}
                               className={`px-4 py-2 rounded-2xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${isExpanded ? 'bg-[#FFD600] text-black shadow-lg' : isCardUnread ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'}`}
                             >
                               <span>💬 الردود الواردة ({replies.length})</span>
                             </button>
                           )}
                           
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteNotification(n.id, n.refIds);
                             }}
                             className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
                             title="حذف التبليغ"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>

                      {/* Expandable Section for replies list */}
                      {isExpanded && replies.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <h5 className="text-xs font-black text-cyan-400 mb-2 flex items-center gap-1">
                            <span>💬 ردود واستفسارات أولياء الأمور والكادر والطلاب:</span>
                          </h5>
                          
                          <div className="space-y-3">
                            {replies.map((reply, ridx) => (
                              <div key={reply.id || ridx} className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-black text-[#FFD600] block">{reply.studentName || 'مستخدم غير معروف'}</span>
                                    <span className="text-[9px] text-white/40">
                                      {reply.role === 'parent' ? 'ولي أمر' : reply.role === 'teacher' ? 'مدرس/كادر' : reply.role === 'staff' ? 'موظف إداري' : 'طالب'} 
                                      {reply.grade && reply.grade !== 'General' && ` - ${reply.grade}`}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-white/30 font-mono">
                                    {reply.timestamp ? new Date(reply.timestamp.seconds * 1000).toLocaleString('ar-IQ') : 'الآن'}
                                  </span>
                                </div>
                                
                                <p className="text-white/80 text-xs whitespace-pre-line leading-relaxed bg-[#101935]/40 p-3 rounded-xl border border-white/5">
                                  {reply.message}
                                </p>

                                {/* Response Log thread */}
                                {reply.adminReply ? (
                                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                                    <span className="text-[10px] font-black text-emerald-400 block mb-1">✍️ ردك الإداري المباشر الحالي:</span>
                                    <p className="text-white/80 text-xs leading-relaxed">{reply.adminReply}</p>
                                  </div>
                                ) : (
                                  <div className="bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl">
                                    <p className="text-[10px] text-rose-400 font-bold">⚠️ لا يوجد رد إداري رسمي على تعقيب هذا العضو بعد.</p>
                                  </div>
                                )}

                                {/* Admin Action: Quick Reply Input */}
                                {adminQuickReplyToTicketId === reply.id ? (
                                  <div className="p-3 bg-black/50 rounded-xl border border-[#FFD600]/20 space-y-2 mt-2">
                                    <textarea
                                      value={adminQuickReplyText}
                                      onChange={(e) => setAdminQuickReplyText(e.target.value)}
                                      placeholder="اكتب ردك أو توجيهك لهذا العقد..."
                                      className="w-full bg-transparent text-white text-xs outline-none h-16 resize-none placeholder:text-white/20"
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setAdminQuickReplyToTicketId(null)}
                                        className="px-3 py-1 rounded bg-white/5 text-white/40 text-[10px] font-black"
                                      >
                                        إلغاء
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!adminQuickReplyText.trim() || isSendingQuickReply}
                                        onClick={() => handleSendAdminQuickReply(reply.id, reply)}
                                        className="px-3 py-1 rounded bg-[#FFD600] text-black text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                      >
                                        <span>{isSendingQuickReply ? 'جاري الإرسال...' : 'إرسال الرد'}</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAdminQuickReplyToTicketId(reply.id);
                                        setAdminQuickReplyText(reply.adminReply || '');
                                      }}
                                      className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-purple-500/25 text-purple-400 hover:bg-purple-500/35 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    >
                                      <span>💬 {reply.adminReply ? 'تعديل الرد أو إرسال تعقيب إضافي' : 'رد سريع ومباشر'}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Message Modal */}
      <AnimatePresence>
        {isMessageModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsMessageModalOpen(false);
                setMessageText('');
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0c1225] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <MessageSquare className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {isBroadcastMode ? 'تبليغ جماعي عام' : 'بدء محادثة إدارية'}
                    </h3>
                    <p className="text-sm text-white/40 mt-1">
                      {isBroadcastMode 
                        ? `إرسال رسالة لجميع المختارين في قائمة ${activeRole === 'student' ? 'الطلاب' : activeRole === 'cadre' ? 'الكادر' : activeRole === 'staff' ? 'الموظفين' : 'أولياء الأمور'}` 
                        : `إرسال رسالة مباشرة للمستخدم: ${selectedUser?.fullName}`}
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full h-48 bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => {
                      setIsMessageModalOpen(false);
                      setMessageText('');
                    }}
                    className="py-4 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isSendingMessage}
                    className="py-4 rounded-2xl bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    {isSendingMessage ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        <ConfirmDialog 
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={confirmDeleteUser}
          title="حذف المستخدم نهائياً"
          message={`هل أنت متأكد من حذف ${userToDelete?.fullName} نهائياً؟`}
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
        />

        <ConfirmDialog 
          isOpen={isDeletePostConfirmOpen}
          onClose={() => setIsDeletePostConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="حذف المنشور"
          message={`هل أنت متأكد من حذف منشور صاحب الحساب ${postToDelete?.userName || 'مجهول'} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف المنشور"
          cancelText="إلغاء"
          type="danger"
        />

        <ConfirmDialog 
          isOpen={isDeleteAllNotifsConfirmOpen}
          onClose={() => setIsDeleteAllNotifsConfirmOpen(false)}
          onConfirm={handleDeleteAllNotifications}
          title="حذف جميع التبليغات المُرسلة"
          message="هل أنت متأكد من حذف كافة التبليغات والرسائل المرسلة (الفردية والجماعية) نهائياً مع كافة ردودها الملحقة؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="حذف الكل"
          cancelText="إلغاء"
          type="danger"
        />

    </div>
  );
};
