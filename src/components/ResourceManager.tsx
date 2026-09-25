import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Trash2, Eye, Search, Loader2, FileText, X, AlertTriangle, 
  CheckCircle2, Video, Radio, Trophy, ClipboardList, Filter, RefreshCw, 
  ExternalLink, Calendar, Clock, User, BookOpen, Layers, GraduationCap, 
  Play, Download, Sparkles, LayoutGrid, List, ChevronRight, HelpCircle,
  TrendingUp, Users, MessageCircle, AlertCircle, Bookmark, Check
} from 'lucide-react';
import { logActivity } from '../utils/auditLogger';
import { staffService } from '../services/staffService';

export type ContentCategory = 'all' | 'files' | 'homework' | 'lectures' | 'broadcasts' | 'competitions';

export interface UnifiedContentItem {
  id: string;
  category: 'files' | 'homework' | 'lectures' | 'broadcasts' | 'competitions';
  categoryLabel: string;
  title: string;
  description?: string;
  teacherName: string;
  teacherId?: string;
  subject?: string;
  grade?: string;
  section?: string;
  classroom?: string;
  url?: string;
  fileUrl?: string;
  filePath?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  views?: number;
  commentsCount?: number;
  questionsCount?: number;
  submissionsCount?: number;
  isLive?: boolean;
  liveRoom?: string;
  toolType?: string;
  difficulty?: string;
  dueDate?: string;
  createdAt: any;
  rawItem?: any;
}

interface ResourceManagerProps {
  schoolId?: string;
  schoolName?: string;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({ 
  schoolId, 
  schoolName,
  showToast: parentShowToast 
}) => {
  // Main Data States
  const [items, setItems] = useState<UnifiedContentItem[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>(() => {
    return staffService.getCachedTeachers(schoolId) || [];
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Navigation & Filter States
  const [activeCategory, setActiveCategory] = useState<ContentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [previewItem, setPreviewItem] = useState<UnifiedContentItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: UnifiedContentItem | null }>({
    isOpen: false,
    item: null
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [teacherProfileModal, setTeacherProfileModal] = useState<string | null>(null);

  // Toast Notification State
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (parentShowToast) {
      parentShowToast(message, type);
    } else {
      setLocalToast({ message, type });
      setTimeout(() => setLocalToast(null), 3000);
    }
  };

  // Helper to extract timestamp ms
  const parseTimestamp = (val: any): number => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (val instanceof Date) return val.getTime();
    if (typeof val === 'number') return val;
    const ms = new Date(val).getTime();
    return isNaN(ms) ? (Number(val) || 0) : ms;
  };

  // Helper to format date in Arabic
  const formatDate = (rawDate: any): string => {
    const ms = parseTimestamp(rawDate);
    if (!ms) return 'غير محدد';
    try {
      const d = new Date(ms);
      return d.toLocaleDateString('ar-IQ', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'حديثاً';
    }
  };

  // Comprehensive Data Fetcher across all 5 Academic Streams
  const fetchAllContent = async () => {
    setLoading(true);
    try {
      const unifiedList: UnifiedContentItem[] = [];

      // 1. Fetch Files & Documents (content & school_files)
      try {
        const resFiles = await fetch('/api/school-files');
        if (resFiles.ok) {
          const filesData = await resFiles.json();
          const list = Array.isArray(filesData) ? filesData : (filesData.files || filesData.data || []);
          list.forEach((f: any) => {
            unifiedList.push({
              id: f.id || `file_${Math.random()}`,
              category: 'files',
              categoryLabel: 'ملف تعليمي / ملزمة',
              title: f.title || f.fileName || f.name || 'ملف دراسي',
              description: f.description || 'مستند ومذكرة تعليمية مرفوعة للطلاب',
              teacherName: f.teacherName || f.uploaderName || f.uploadedBy || 'أستاذ المادة',
              teacherId: f.teacherId || f.userId,
              subject: f.subject || 'عام',
              grade: f.grade || f.className || 'كافة المراحل',
              section: f.section || f.division || 'جميع الشعب',
              url: f.url || f.fileUrl,
              fileUrl: f.fileUrl || f.url,
              filePath: f.filePath,
              createdAt: f.createdAt || f.uploadDate || f.timestamp || Date.now(),
              rawItem: f
            });
          });
        }
      } catch (err) {
        console.warn('Could not fetch school files from API, trying firestore:', err);
      }

      // 2. Fetch Video Lectures & Recorded Lessons (recorded_lessons)
      try {
        const resLessons = await fetch('/api/recorded-lessons');
        if (resLessons.ok) {
          const lessonsData = await resLessons.json();
          const list = Array.isArray(lessonsData) ? lessonsData : (lessonsData.lessons || lessonsData.data || []);
          list.forEach((l: any) => {
            unifiedList.push({
              id: l.id || `lesson_${Math.random()}`,
              category: 'lectures',
              categoryLabel: 'محاضرة مرئية',
              title: l.title || l.name || 'محاضرة مرئية',
              description: l.description || 'شرح تفصيلي مسجل للمنهاج الدراسي',
              teacherName: l.teacherName || l.uploaderName || 'أستاذ المادة',
              teacherId: l.teacherId,
              subject: l.subject || 'عام',
              grade: l.grade || l.className || 'كافة المراحل',
              section: l.section || 'جميع الشعب',
              videoUrl: l.videoUrl || l.url || l.video_url,
              youtubeUrl: l.youtubeUrl || l.youtube_url,
              thumbnailUrl: l.thumbnailUrl || l.thumbnail_url,
              duration: l.duration || 'غير محدد',
              views: l.views || l.viewCount || 0,
              commentsCount: l.commentCount || l.comments_count || 0,
              createdAt: l.createdAt || l.date || Date.now(),
              rawItem: l
            });
          });
        }
      } catch (err) {
        console.warn('Could not fetch recorded lessons:', err);
      }

      // 3. Fetch Live Broadcasts & Radio Streams (broadcasts)
      try {
        const resBroadcasts = await fetch('/api/broadcasts');
        if (resBroadcasts.ok) {
          const bData = await resBroadcasts.json();
          const list = Array.isArray(bData) ? bData : (bData.broadcasts || bData.data || []);
          list.forEach((b: any) => {
            const isLive = b.isLive === true || b.status === 'live' || b.type === 'live';
            unifiedList.push({
              id: b.id || `broadcast_${Math.random()}`,
              category: 'broadcasts',
              categoryLabel: isLive ? 'بث مباشر حي 🔴' : 'تسجيل إذاعي / بث',
              title: b.title || 'بث مباشر تفاعلي',
              description: b.message || b.description || 'جلسة بث صوتي/مرئي تفاعلي مع الطلاب',
              teacherName: b.senderName || b.teacherName || 'مقدم البث',
              teacherId: b.teacherId || b.senderId,
              subject: b.subject || 'إذاعة وبث',
              grade: b.grade || b.targetAudience || 'كافة المراحل',
              section: b.section || b.classRoom || 'عام',
              url: b.streamUrl || b.url,
              videoUrl: b.streamUrl || b.videoUrl,
              liveRoom: b.roomName || b.channelId || b.id,
              isLive: isLive,
              views: b.viewsCount || b.viewersCount || 0,
              createdAt: b.timestamp || b.createdAt || Date.now(),
              rawItem: b
            });
          });
        }
      } catch (err) {
        console.warn('Could not fetch broadcasts:', err);
      }

      // 4. Fetch Homework, Quizzes & AI Materials (ai_materials & activities)
      try {
        // Try fetching AI materials / assignments from DB
        const targetSchool = schoolId || 'school1';
        const aiMatRef = collection(db, 'schools', targetSchool, 'ai_materials');
        const snap = await getDocs(aiMatRef);
        
        if (snap && snap.docs) {
          snap.docs.forEach(d => {
            const data = d.data();
            const tool = data.tool || data.type || '';
            const isCompetition = tool.includes('مسابق') || tool.includes('تحدي') || tool.includes('اختبار') || tool.includes('quiz') || tool.includes('competition');
            
            if (isCompetition) {
              unifiedList.push({
                id: d.id,
                category: 'competitions',
                categoryLabel: 'مسابقة صفية وتحدي',
                title: data.title || 'تحدي ومسابقة تفاعلية',
                description: data.instructions || data.description || 'مسابقة وأسئلة تنافسية للفرسان داخل القاعة',
                teacherName: data.teacherName || 'أستاذ المادة',
                teacherId: data.teacherId,
                subject: data.subject || 'عام',
                grade: data.grade || data.className || 'عام',
                section: data.section || 'جميع الشعب',
                toolType: tool,
                questionsCount: Array.isArray(data.questions) ? data.questions.length : (data.questionCount || 5),
                difficulty: data.difficulty || 'متوسط',
                createdAt: data.timestamp || data.createdAt || Date.now(),
                rawItem: data
              });
            } else {
              unifiedList.push({
                id: d.id,
                category: 'homework',
                categoryLabel: 'واجب وتكليف دراسي',
                title: data.title || 'واجب بيتي صفي',
                description: data.instructions || data.content || 'تكليف وواجب إلكتروني موجه للطلاب لمتابعة الدروس',
                teacherName: data.teacherName || 'أستاذ المادة',
                teacherId: data.teacherId,
                subject: data.subject || 'عام',
                grade: data.grade || data.className || 'عام',
                section: data.section || 'جميع الشعب',
                toolType: tool,
                dueDate: data.dueDate || data.deadline,
                submissionsCount: data.submissionsCount || 0,
                createdAt: data.timestamp || data.createdAt || Date.now(),
                rawItem: data
              });
            }
          });
        }
      } catch (err) {
        console.warn('Could not fetch ai_materials:', err);
      }

      // 5. Fetch Question Bank & Exam Papers (question_bank & exam_papers)
      try {
        const [resQB, resExams] = await Promise.all([
          fetch('/api/question-bank').catch(() => null),
          fetch('/api/exam-papers').catch(() => null)
        ]);

        if (resQB && resQB.ok) {
          const qbData = await resQB.json();
          const list = Array.isArray(qbData) ? qbData : (qbData.questions || []);
          list.slice(0, 50).forEach((q: any) => {
            unifiedList.push({
              id: q.id || `q_${Math.random()}`,
              category: 'competitions',
              categoryLabel: 'سؤال في بنك الأسئلة',
              title: q.questionText || q.title || 'سؤال امتحاني نموذجي',
              description: q.explanation || 'سؤال منهجي مضاف لبنك الأسئلة المدرسية',
              teacherName: q.teacherName || q.author || 'الكادر التدريسي',
              subject: q.subject || 'عام',
              grade: q.grade || 'كافة المراحل',
              difficulty: q.difficulty || 'متوسط',
              createdAt: q.createdAt || Date.now(),
              rawItem: q
            });
          });
        }

        if (resExams && resExams.ok) {
          const examData = await resExams.json();
          const list = Array.isArray(examData) ? examData : (examData.papers || []);
          list.forEach((ex: any) => {
            unifiedList.push({
              id: ex.id || `exam_${Math.random()}`,
              category: 'competitions',
              categoryLabel: 'ورقة اختبار وامتحان',
              title: ex.title || 'ورقة امتحانية منشورة',
              description: ex.instructions || 'نموذج أسئلة اختبار صفي ومدرسي',
              teacherName: ex.teacherName || 'مدرس المادة',
              subject: ex.subject || 'عام',
              grade: ex.grade || 'عام',
              url: ex.fileUrl || ex.url,
              createdAt: ex.createdAt || Date.now(),
              rawItem: ex
            });
          });
        }
      } catch (err) {
        console.warn('Could not fetch question bank or exam papers:', err);
      }

      // Sort by creation date descending (newest first)
      unifiedList.sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt));

      // Remove duplicate IDs if any
      const uniqueMap = new Map<string, UnifiedContentItem>();
      unifiedList.forEach(item => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });

      setItems(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error('Error fetching unified content:', error);
      showToast('تعذر جلب بعض عناصر المحتوى', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllContent();
  }, [schoolId]);

  // Subscribe to real staff/teachers list from staffService
  useEffect(() => {
    const cached = staffService.getCachedTeachers(schoolId);
    if (cached && cached.length > 0) {
      setStaffMembers(cached);
    }
    const unsub = staffService.subscribeToTeachers(schoolId, (updatedTeachers) => {
      if (Array.isArray(updatedTeachers)) {
        setStaffMembers(updatedTeachers);
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [schoolId]);

  // Blacklist of generic / placeholder teacher strings to eliminate from filters
  const GENERIC_TEACHER_BLACKLIST = useMemo(() => [
    'الكادر التدريسي',
    'استاذ المادة',
    'أستاذ المادة',
    'مدرس المادة',
    'كادر المدرسة',
    'الكادر الأكاديمي',
    'أستاذ',
    'استاذ',
    'مدرس',
    'مقدم البث',
    'مجهول',
    'الإدارة',
    'عام',
    'مسؤول النظام',
    'المعلم',
    'معلم المادة'
  ], []);

  // Helper to normalize Arabic strings for accurate deduplication & comparison
  const normalizeArabic = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/[إأآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel/diacritics
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  // 1. Valid Teachers: Strictly extracted from Staff & Teachers directory (قسم الكادر والموظفين)
  const validTeachers = useMemo(() => {
    const list: { id: string; name: string; subject: string; specialization?: string }[] = [];
    const seenNames = new Set<string>();

    staffMembers.forEach((member: any) => {
      if (!member || member.isDeleted) return;
      // Discard non-teacher staff members (e.g. drivers, accountants, service staff)
      if (member.role === 'STAFF') return;

      const rawName = (member.name || '').trim();
      if (!rawName) return;

      // Filter out generic placeholder names
      const normName = normalizeArabic(rawName);
      const isPlaceholder = GENERIC_TEACHER_BLACKLIST.some(ph => 
        normName === normalizeArabic(ph) ||
        normName.replace(/\s+/g, '') === normalizeArabic(ph).replace(/\s+/g, '')
      );
      if (isPlaceholder) return;

      // Deduplicate by normalized name
      if (!seenNames.has(normName)) {
        seenNames.add(normName);
        list.push({
          id: member.id || rawName,
          name: rawName,
          subject: (member.subject || member.specialization || '').trim(),
          specialization: (member.specialization || member.subject || '').trim()
        });
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [staffMembers, GENERIC_TEACHER_BLACKLIST]);

  // Teachers List: Strictly display the names of teachers added in the Staff & Teachers section
  const teachersList = useMemo(() => {
    return validTeachers.map(t => t.name);
  }, [validTeachers]);

  // 2. Subjects List: STRICTLY the subjects & specializations added to registered teachers in the Staff section, with ZERO duplicates
  const subjectsList = useMemo(() => {
    const list: string[] = [];
    const seenNormalized = new Set<string>();
    const invalidSubjects = ['عام', 'كافة المواد', 'الكل', 'بدون مادة', 'غير محدد', 'إذاعة وبث', 'الكادر', 'مدرس'];

    validTeachers.forEach(t => {
      const rawSubject = (t.subject || t.specialization || '').trim();
      if (!rawSubject) return;

      // Split multiple subjects if listed with separators (e.g. "الرياضيات، الفيزياء" or "اللغة العربية / التربية الإسلامية")
      const parts = rawSubject.split(/[,،/+\-\n]/).map(s => s.trim()).filter(Boolean);

      parts.forEach(part => {
        if (!part) return;
        const normPart = normalizeArabic(part);
        
        // Exclude invalid/generic subjects
        if (invalidSubjects.some(inv => normPart === normalizeArabic(inv))) return;

        if (!seenNormalized.has(normPart)) {
          seenNormalized.add(normPart);
          list.push(part);
        }
      });
    });

    return list.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [validTeachers]);

  // Grades List: Cleaned and deduplicated
  const gradesList = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    items.forEach(item => {
      const g = (item.grade || '').trim();
      if (g && g !== 'عام' && g !== 'كافة المراحل') {
        const norm = normalizeArabic(g);
        if (!seen.has(norm)) {
          seen.add(norm);
          list.push(g);
        }
      }
    });
    return list.sort((a, b) => a.localeCompare(b, 'ar'));
  }, [items]);

  // Filtered & Searched items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // Subject filter (strict matching based on subject name or teacher's assigned subject)
      if (selectedSubject !== 'all') {
        const normSelected = normalizeArabic(selectedSubject);
        const normItemSubj = normalizeArabic(item.subject || '');
        const isDirectMatch = normItemSubj === normSelected || normItemSubj.includes(normSelected) || normSelected.includes(normItemSubj);

        // Also check if the publishing teacher teaches this subject
        const teacherObj = validTeachers.find(t => normalizeArabic(t.name) === normalizeArabic(item.teacherName || ''));
        const teacherHasSubj = teacherObj ? normalizeArabic(teacherObj.subject).includes(normSelected) : false;

        if (!isDirectMatch && !teacherHasSubj) {
          return false;
        }
      }

      // Grade filter
      if (selectedGrade !== 'all') {
        const normSelectedGrade = normalizeArabic(selectedGrade);
        const normItemGrade = normalizeArabic(item.grade || '');
        if (normItemGrade !== normSelectedGrade && !normItemGrade.includes(normSelectedGrade)) {
          return false;
        }
      }

      // Teacher filter (strictly matching the selected teacher from staff directory)
      if (selectedTeacher !== 'all') {
        const normSelectedTeacher = normalizeArabic(selectedTeacher);
        const normItemTeacher = normalizeArabic(item.teacherName || '');
        const isTeacherMatch = normItemTeacher === normSelectedTeacher || (item.teacherId && item.teacherId === selectedTeacher);
        if (!isTeacherMatch) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus === 'live' && !item.isLive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = normalizeArabic(searchQuery);
        const text = [
          item.title,
          item.description,
          item.teacherName,
          item.subject,
          item.grade,
          item.section,
          item.categoryLabel
        ].filter(Boolean).map(s => normalizeArabic(String(s))).join(' ');

        if (!text.includes(q)) return false;
      }

      return true;
    });
  }, [items, activeCategory, selectedSubject, selectedGrade, selectedTeacher, selectedStatus, searchQuery, validTeachers]);

  // Statistics across categories
  const stats = useMemo(() => {
    return {
      total: items.length,
      files: items.filter(i => i.category === 'files').length,
      homework: items.filter(i => i.category === 'homework').length,
      lectures: items.filter(i => i.category === 'lectures').length,
      broadcasts: items.filter(i => i.category === 'broadcasts').length,
      liveNow: items.filter(i => i.category === 'broadcasts' && i.isLive).length,
      competitions: items.filter(i => i.category === 'competitions').length,
    };
  }, [items]);

  // Handle Deletion of Any Content Item
  const handleDelete = async () => {
    const item = deleteModal.item;
    if (!item) return;

    setIsDeleting(true);
    try {
      // 1. Delete associated storage file if available
      if (item.filePath) {
        try {
          const storage = getStorage();
          const fileRef = ref(storage, item.filePath);
          await deleteObject(fileRef);
        } catch (e) {
          console.warn('Storage delete ignored:', e);
        }
      }

      // 2. Delete from specific Backend Endpoint or Firestore Collection based on category
      if (item.category === 'files') {
        await fetch(`/api/school-files/${item.id}`, { method: 'DELETE' }).catch(() => {});
        try { await deleteDoc(doc(db, 'content', item.id)); } catch {}
        try { await deleteDoc(doc(db, 'school_files', item.id)); } catch {}
      } else if (item.category === 'lectures') {
        await fetch(`/api/recorded-lessons/${item.id}`, { method: 'DELETE' }).catch(() => {});
        try { await deleteDoc(doc(db, 'recorded_lessons', item.id)); } catch {}
      } else if (item.category === 'broadcasts') {
        await fetch(`/api/broadcasts/${item.id}`, { method: 'DELETE' }).catch(() => {});
        try { await deleteDoc(doc(db, 'broadcasts', item.id)); } catch {}
      } else if (item.category === 'homework' || item.category === 'competitions') {
        const targetSchool = schoolId || 'school1';
        try { await deleteDoc(doc(db, 'schools', targetSchool, 'ai_materials', item.id)); } catch {}
        try { await fetch(`/api/firestore-docs/ai_materials/${item.id}`, { method: 'DELETE' }); } catch {}
        try { await fetch(`/api/question-bank/${item.id}`, { method: 'DELETE' }); } catch {}
        try { await fetch(`/api/exam-papers/${item.id}`, { method: 'DELETE' }); } catch {}
      }

      // 3. Send notification to the teacher with reason
      if (item.teacherName && deleteReason.trim()) {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'تنبيه إداري: تم حذف محتوى منشور',
              message: `تمت مراجعة وحذف "${item.title}" من مركز المراقبة. سبب الإجراء: ${deleteReason}`,
              type: 'warning',
              targetAudience: 'teachers',
              teacherName: item.teacherName,
              teacherId: item.teacherId,
              createdAt: serverTimestamp()
            })
          });
        } catch (notifErr) {
          console.warn('Could not post deletion notification:', notifErr);
        }
      }

      // 4. Log in Audit Trail
      logActivity({
        action: 'حذف محتوى صفي',
        details: `تمت إزالة "${item.title}" (${item.categoryLabel}) التابع للأستاذ/ة ${item.teacherName}. ${deleteReason ? `السبب: ${deleteReason}` : ''}`,
        targetId: item.id,
        targetType: item.category
      });

      // 5. Update local state
      setItems(prev => prev.filter(i => i.id !== item.id));
      showToast('تم حذف المحتوى وإشعار الكادر بنجاح', 'success');
      setDeleteModal({ isOpen: false, item: null });
      setDeleteReason('');
      if (previewItem?.id === item.id) setPreviewItem(null);
    } catch (error) {
      console.error('Delete error:', error);
      showToast('حدث خطأ أثناء تنفيذ عملية الحذف', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper icons and styles for categories
  const getCategoryConfig = (category: UnifiedContentItem['category']) => {
    switch (category) {
      case 'files':
        return {
          icon: FileText,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          badge: 'bg-blue-500/15 text-blue-300'
        };
      case 'homework':
        return {
          icon: ClipboardList,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          badge: 'bg-amber-500/15 text-amber-300'
        };
      case 'lectures':
        return {
          icon: Video,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          badge: 'bg-purple-500/15 text-purple-300'
        };
      case 'broadcasts':
        return {
          icon: Radio,
          color: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          badge: 'bg-rose-500/15 text-rose-300'
        };
      case 'competitions':
        return {
          icon: Trophy,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          badge: 'bg-emerald-500/15 text-emerald-300'
        };
      default:
        return {
          icon: ShieldCheck,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/20',
          badge: 'bg-cyan-500/15 text-cyan-300'
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans h-full flex flex-col">
      
      {/* 1. Header & Overview Bar */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-l from-slate-900 via-[#0E172E] to-[#0A0F1E] border border-white/10 p-4 sm:p-5 shadow-2xl shrink-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight">
                  مركز مراقبة المحتوى الأكاديمي
                </h1>
                {stats.liveNow > 0 && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[11px] font-black animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {stats.liveNow} بث مباشر
                  </span>
                )}
              </div>
              <p className="text-white/50 text-xs mt-0.5 font-bold leading-normal">
                متابعة وتدقيق منشورات الأساتذة في القاعات من ملازم، واجبات، محاضرات وبث مباشر.
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchAllContent();
              }}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all hover:border-emerald-500/30 active:scale-95 disabled:opacity-50"
              title="تحديث البيانات الفورية"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : 'text-white/70'} />
              <span>مزامنة فورية</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-500 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                title="عرض شبكي (بطاقات)"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-emerald-500 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                title="عرض جدولي (قائمة تفصيلية)"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Top Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          
          <button 
            onClick={() => setActiveCategory('all')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${activeCategory === 'all' ? 'bg-white/10 border-white/30 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
          >
            <div className="flex items-center justify-between text-white/50 text-xs font-bold mb-2">
              <span>إجمالي المحتوى</span>
              <Sparkles size={14} className="text-white/70" />
            </div>
            <span className="text-2xl font-black text-white">{stats.total}</span>
          </button>

          <button 
            onClick={() => setActiveCategory('files')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${activeCategory === 'files' ? 'bg-blue-500/15 border-blue-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:bg-blue-500/5'}`}
          >
            <div className="flex items-center justify-between text-blue-300 text-xs font-bold mb-2">
              <span>ملفات وملازم</span>
              <FileText size={14} className="text-blue-400" />
            </div>
            <span className="text-2xl font-black text-blue-400">{stats.files}</span>
          </button>

          <button 
            onClick={() => setActiveCategory('homework')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${activeCategory === 'homework' ? 'bg-amber-500/15 border-amber-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:bg-amber-500/5'}`}
          >
            <div className="flex items-center justify-between text-amber-300 text-xs font-bold mb-2">
              <span>واجبات وتكاليف</span>
              <ClipboardList size={14} className="text-amber-400" />
            </div>
            <span className="text-2xl font-black text-amber-400">{stats.homework}</span>
          </button>

          <button 
            onClick={() => setActiveCategory('lectures')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${activeCategory === 'lectures' ? 'bg-purple-500/15 border-purple-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:bg-purple-500/5'}`}
          >
            <div className="flex items-center justify-between text-purple-300 text-xs font-bold mb-2">
              <span>محاضرات مرئية</span>
              <Video size={14} className="text-purple-400" />
            </div>
            <span className="text-2xl font-black text-purple-400">{stats.lectures}</span>
          </button>

          <button 
            onClick={() => setActiveCategory('broadcasts')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${activeCategory === 'broadcasts' ? 'bg-rose-500/15 border-rose-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:bg-rose-500/5'}`}
          >
            <div className="flex items-center justify-between text-rose-300 text-xs font-bold mb-2">
              <span>بث وإذاعة</span>
              <Radio size={14} className="text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">{stats.broadcasts}</span>
              {stats.liveNow > 0 && <span className="text-xs text-rose-400 font-bold">({stats.liveNow} حي)</span>}
            </div>
          </button>

          <button 
            onClick={() => setActiveCategory('competitions')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${activeCategory === 'competitions' ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg' : 'bg-white/[0.02] border-white/5 hover:bg-emerald-500/5'}`}
          >
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold mb-2">
              <span>مسابقات صفية</span>
              <Trophy size={14} className="text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-emerald-400">{stats.competitions}</span>
          </button>

        </div>
      </div>

      {/* 3. Filter & Category Segmented Tabs Bar */}
      <div className="flex flex-col gap-4 shrink-0">
        
        {/* Category Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
              activeCategory === 'all'
                ? 'bg-white text-slate-950 shadow-md scale-100'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <Sparkles size={16} />
            <span>الرادار الشامل (الكل)</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-slate-900/10 font-mono font-bold">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('files')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
              activeCategory === 'files'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <FileText size={16} />
            <span>الملفات والملازم</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-black/20 font-mono font-bold">
              {stats.files}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('homework')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
              activeCategory === 'homework'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <ClipboardList size={16} />
            <span>الواجبات والتكاليف</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-black/20 font-mono font-bold">
              {stats.homework}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('lectures')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
              activeCategory === 'lectures'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <Video size={16} />
            <span>المحاضرات المرئية</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-black/20 font-mono font-bold">
              {stats.lectures}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('broadcasts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
              activeCategory === 'broadcasts'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <Radio size={16} />
            <span>البث المباشر والإذاعة</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-black/20 font-mono font-bold">
              {stats.broadcasts}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('competitions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all shrink-0 ${
              activeCategory === 'competitions'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
            }`}
          >
            <Trophy size={16} />
            <span>المسابقات الصفية والأسئلة</span>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-black/20 font-mono font-bold">
              {stats.competitions}
            </span>
          </button>

        </div>

        {/* Multi-Dimensional Search & Dropdown Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
          
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input 
              type="text" 
              placeholder="ابحث باسم المادة، الأستاذ، عنوان الدرس، أو القاعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pr-11 pl-4 text-white text-sm focus:border-emerald-500 outline-none transition-all font-bold placeholder:text-white/30"
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

          {/* Subject Selector */}
          <div className="lg:col-span-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              aria-label="تصفية حسب المادة الدراسية"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm font-bold focus:border-emerald-500 outline-none transition-all cursor-pointer"
            >
              <option value="all">كافة المواد الدراسية ({subjectsList.length})</option>
              {subjectsList.map(subj => (
                <option key={subj} value={subj} className="bg-slate-900 text-white font-bold py-1">
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Selector */}
          <div className="lg:col-span-3">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              aria-label="تصفية حسب المرحلة والقاعة"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm font-bold focus:border-emerald-500 outline-none transition-all cursor-pointer"
            >
              <option value="all">كافة المراحل والقاعات</option>
              {gradesList.map(gr => (
                <option key={gr} value={gr} className="bg-slate-900 text-white font-bold py-1">
                  {gr}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Selector */}
          <div className="lg:col-span-2">
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              aria-label="تصفية حسب الأستاذ"
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm font-bold focus:border-emerald-500 outline-none transition-all cursor-pointer"
            >
              <option value="all">جميع الأساتذة ({validTeachers.length})</option>
              {validTeachers.map(t => (
                <option key={t.id || t.name} value={t.name} className="bg-slate-900 text-white font-bold py-1">
                  {t.name} {t.subject ? `(${t.subject})` : ''}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* 4. Main Content Area */}
      <div className="flex-1 min-h-0 bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col relative">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
            <Loader2 className="text-emerald-400 animate-spin" size={48} />
            <p className="text-white/60 font-black text-base">جاري فحص وتجميع سجلات المحتوى الأكاديمي...</p>
            <p className="text-white/30 text-xs font-bold">يتم الاتصال بقواعد البيانات واسترجاع كافة منشورات القاعات</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-12 text-center my-auto">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/20 mb-4 border border-white/10">
              <Filter size={36} />
            </div>
            <h3 className="text-xl font-black text-white/60 mb-2">لا توجد عناصر مطابقة لخيارات البحث</h3>
            <p className="text-white/30 text-sm font-bold max-w-md mb-6">
              لم يتم العثور على أي ملفات أو واجبات أو محاضرات أو بث مباشر تطابق الكلمات المفتاحية المحددة.
            </p>
            {(searchQuery || selectedSubject !== 'all' || selectedGrade !== 'all' || selectedTeacher !== 'all' || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('all');
                  setSelectedGrade('all');
                  setSelectedTeacher('all');
                  setActiveCategory('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all"
              >
                إعادة ضبط خيارات البحث
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          
          /* GRID VIEW: Distinctive, High-Legibility Cards */
          <div className="overflow-y-auto p-6 flex-1 scrollbar-thin scrollbar-thumb-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map(item => {
                const config = getCategoryConfig(item.category);
                const IconComponent = config.icon;
                const formattedDate = formatDate(item.createdAt);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all flex flex-col justify-between relative shadow-lg hover:shadow-2xl overflow-hidden"
                  >
                    {/* Top Accent Line */}
                    <div className={`absolute top-0 right-0 left-0 h-1 ${config.bg}`} />

                    <div>
                      {/* Top Meta Line (Zero-Pill Clean Typography) */}
                      <div className="flex items-center justify-between gap-2 text-xs text-white/50 mb-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${config.bg} ${config.color} flex items-center justify-center shrink-0`}>
                            <IconComponent size={14} />
                          </div>
                          <span className="font-bold text-white/70">{item.categoryLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/40 font-mono text-[11px]">
                          <Clock size={12} />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 
                        className="text-base font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 leading-snug cursor-pointer"
                        onClick={() => setPreviewItem(item)}
                        title={item.title}
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-white/50 text-xs font-bold line-clamp-2 mb-4 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Clean Unboxed Metadata with Bullet Separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mb-4 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <span className="flex items-center gap-1 font-bold text-emerald-400">
                          <User size={12} />
                          {item.teacherName}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="flex items-center gap-1 font-bold text-blue-300">
                          <BookOpen size={12} />
                          {item.subject || 'عام'}
                        </span>
                        {(item.grade || item.section) && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="flex items-center gap-1 text-white/60 font-bold">
                              <GraduationCap size={12} />
                              {item.grade} {item.section ? `(${item.section})` : ''}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Extra metrics per category */}
                      {item.category === 'lectures' && item.duration && (
                        <div className="flex items-center gap-4 text-xs text-white/40 font-mono mb-4">
                          <span>المدة: {item.duration}</span>
                          <span>المشاهدات: {item.views || 0}</span>
                        </div>
                      )}

                      {item.category === 'homework' && item.dueDate && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-4">
                          <Calendar size={12} />
                          <span>تاريخ التسليم: {item.dueDate}</span>
                        </div>
                      )}

                      {item.category === 'broadcasts' && item.isLive && (
                        <div className="flex items-center gap-2 text-xs text-rose-400 font-black mb-4">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          <span>بث مباشر جاري الآن داخل المنصة</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-emerald-300 py-1.5 px-3 rounded-lg hover:bg-emerald-500/10 transition-all"
                      >
                        <Eye size={14} />
                        <span>معاينة وتفاصيل</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {(item.url || item.fileUrl || item.videoUrl) && (
                          <button
                            onClick={() => window.open(item.url || item.fileUrl || item.videoUrl, '_blank')}
                            className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-white text-white/50 transition-all"
                            title="فتح الرابط المباشر"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteModal({ isOpen: true, item })}
                          className="p-2 rounded-lg bg-white/5 hover:bg-rose-500 hover:text-white text-white/50 transition-all"
                          title="حذف هذا المحتوى"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          
          /* TABLE VIEW: High Information Density */
          <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
            <table className="w-full text-right border-collapse">
              <thead className="bg-[#101935] sticky top-0 z-10 shadow-md">
                <tr className="border-b border-white/10">
                  <th className="p-4 text-white/50 text-xs font-black w-12 text-center">#</th>
                  <th className="p-4 text-white/50 text-xs font-black whitespace-nowrap">النوع</th>
                  <th className="p-4 text-white/50 text-xs font-black whitespace-nowrap min-w-[200px]">العنوان والوصف</th>
                  <th className="p-4 text-white/50 text-xs font-black whitespace-nowrap">الأستاذ</th>
                  <th className="p-4 text-white/50 text-xs font-black whitespace-nowrap">المادة / القاعة</th>
                  <th className="p-4 text-white/50 text-xs font-black text-center whitespace-nowrap">التاريخ</th>
                  <th className="p-4 text-white/50 text-xs font-black text-center w-36 whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {filteredItems.map((item, index) => {
                  const config = getCategoryConfig(item.category);
                  const IconComponent = config.icon;
                  const formattedDate = formatDate(item.createdAt);

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors group">
                      
                      <td className="p-4 text-center text-white/30 font-bold text-xs">{index + 1}</td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center shrink-0`}>
                            <IconComponent size={16} />
                          </div>
                          <span className="text-white/80 font-bold text-xs">{item.categoryLabel}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span 
                            onClick={() => setPreviewItem(item)}
                            className="text-white font-bold text-sm hover:text-emerald-400 cursor-pointer line-clamp-1 transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </span>
                          {item.description && (
                            <span className="text-white/40 text-xs line-clamp-1">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                          {item.teacherName}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white font-bold text-xs">{item.subject || 'عام'}</span>
                          <span className="text-white/40 text-[11px] font-bold">
                            {item.grade || 'كافة المراحل'} {item.section ? `· ${item.section}` : ''}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="text-white/50 text-xs font-mono">{formattedDate}</span>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewItem(item)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-emerald-500 hover:text-white text-white/60 flex items-center justify-center transition-all"
                            title="معاينة وتفاصيل"
                          >
                            <Eye size={15} />
                          </button>

                          {(item.url || item.fileUrl || item.videoUrl) && (
                            <button
                              onClick={() => window.open(item.url || item.fileUrl || item.videoUrl, '_blank')}
                              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-cyan-500 hover:text-white text-white/60 flex items-center justify-center transition-all"
                              title="فتح الرابط"
                            >
                              <ExternalLink size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item })}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-rose-500 hover:text-white text-white/60 flex items-center justify-center transition-all"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* 5. Rich Preview Modal (معاينة شاملة للفيديوهات، الملفات، الواجبات، البث المباشر، والمسابقات) */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewItem(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0B1120] border border-white/15 w-full max-w-3xl max-h-[90vh] rounded-[32px] overflow-hidden relative z-[201] shadow-2xl flex flex-col font-sans"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-900/90 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${getCategoryConfig(previewItem.category).bg} ${getCategoryConfig(previewItem.category).color} flex items-center justify-center`}>
                    {React.createElement(getCategoryConfig(previewItem.category).icon, { size: 20 })}
                  </div>
                  <div>
                    <span className="text-white/50 text-xs font-bold block">{previewItem.categoryLabel}</span>
                    <h2 className="text-lg font-black text-white">{previewItem.title}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/10">
                
                {/* 1. Category-Specific Media Visualizer */}
                {previewItem.category === 'lectures' && (previewItem.videoUrl || previewItem.youtubeUrl) && (
                  <div className="rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center relative shadow-xl">
                    {previewItem.videoUrl?.includes('youtube.com') || previewItem.videoUrl?.includes('youtu.be') ? (
                      <iframe 
                        src={previewItem.videoUrl.replace('watch?v=', 'embed/')} 
                        className="w-full h-full border-0" 
                        allowFullScreen 
                        title={previewItem.title}
                      />
                    ) : (
                      <video 
                        src={previewItem.videoUrl} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                )}

                {previewItem.category === 'broadcasts' && (
                  <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-center gap-3">
                    <Radio size={40} className="text-rose-400 animate-pulse" />
                    <h4 className="text-lg font-black text-white">جلسة البث المباشر والإذاعة</h4>
                    <p className="text-white/60 text-xs font-bold max-w-md">
                      {previewItem.isLive ? 'البث جاري ومتاح للطلاب في القاعة المحددة' : 'تسجيل الإذاعة المدرسية'}
                    </p>
                    {previewItem.liveRoom && (
                      <span className="px-3 py-1 bg-black/40 rounded-lg text-white font-mono text-xs border border-white/10">
                        معرف الغرفة: {previewItem.liveRoom}
                      </span>
                    )}
                  </div>
                )}

                {/* 2. Metadata Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-xs font-bold block mb-1">الأستاذ الناشر</span>
                    <span className="text-emerald-400 font-black text-sm">{previewItem.teacherName}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-xs font-bold block mb-1">المادة الدراسية</span>
                    <span className="text-blue-300 font-black text-sm">{previewItem.subject || 'عام'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-xs font-bold block mb-1">المرحلة والقاعة</span>
                    <span className="text-amber-300 font-black text-sm">{previewItem.grade || 'كافة المراحل'} {previewItem.section ? `(${previewItem.section})` : ''}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-white/40 text-xs font-bold block mb-1">تاريخ النشر</span>
                    <span className="text-white/80 font-mono text-xs">{formatDate(previewItem.createdAt)}</span>
                  </div>
                </div>

                {/* 3. Description & Detailed Content */}
                {previewItem.description && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                    <h4 className="text-white/60 text-xs font-black mb-2 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      تفاصيل المحتوى والتعليمات
                    </h4>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-bold">
                      {previewItem.description}
                    </p>
                  </div>
                )}

                {/* 4. Homework / Quiz Questions Preview */}
                {previewItem.rawItem?.questions && Array.isArray(previewItem.rawItem.questions) && (
                  <div className="space-y-3">
                    <h4 className="text-white text-sm font-black flex items-center gap-2">
                      <HelpCircle size={16} className="text-emerald-400" />
                      أسئلة المسابقة / الواجب ({previewItem.rawItem.questions.length} سؤال)
                    </h4>
                    <div className="space-y-2">
                      {previewItem.rawItem.questions.map((q: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm">
                          <p className="text-white font-bold mb-2">{idx + 1}. {q.question || q.text || q.questionText || 'نص السؤال'}</p>
                          {q.options && Array.isArray(q.options) && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {q.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="p-2 rounded-lg bg-black/20 text-white/60 text-xs font-bold border border-white/5">
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-slate-900/90 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => {
                    const it = previewItem;
                    setPreviewItem(null);
                    setDeleteModal({ isOpen: true, item: it });
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-sm font-black transition-all"
                >
                  <Trash2 size={16} />
                  <span>حذف وإشعار الأستاذ</span>
                </button>

                <div className="flex items-center gap-3">
                  {(previewItem.url || previewItem.fileUrl || previewItem.videoUrl) && (
                    <button
                      onClick={() => window.open(previewItem.url || previewItem.fileUrl || previewItem.videoUrl, '_blank')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-black transition-all shadow-lg shadow-cyan-500/20"
                    >
                      <ExternalLink size={16} />
                      <span>فتح الرابط الأصلي</span>
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-black transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Delete Confirmation & Teacher Moderation Notification Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && deleteModal.item && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeleteModal({ isOpen: false, item: null })}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0A0F1E] border border-rose-500/30 w-full max-w-md rounded-[36px] p-8 relative z-[251] shadow-2xl"
            >
              <button 
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                disabled={isDeleting}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-5 shadow-inner shadow-rose-500/20">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-black text-center text-white mb-2">تأكيد حذف المحتوى</h3>
              <p className="text-center text-white/60 text-sm mb-6 font-bold leading-relaxed">
                هل أنت متأكد من رغبتك في حذف <br />
                <span className="text-rose-400 font-black">"{deleteModal.item.title}"</span> ؟<br />
                سيتم إزالة المحتوى نهائياً من قاعدة البيانات والتخزين وتحديث واجهة الطلاب فوراً.
              </p>

              <div className="mb-6">
                <label className="block text-white/60 text-xs font-black mb-2">
                  سبب الحذف (يصل إشعار فوري للأستاذ به)
                </label>
                <input 
                  type="text" 
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="مثال: يحتوي على بيانات غير مطابقة للمنهج..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-rose-500 transition-all font-bold placeholder:text-white/20"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  <span>{isDeleting ? 'جاري الحذف...' : 'حذف وإشعار الأستاذ'}</span>
                </button>
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, item: null })}
                  disabled={isDeleting}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-2xl font-black transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Local Toast Notification */}
      <AnimatePresence>
        {localToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex justify-center w-full px-6 pointer-events-none"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              localToast.type === 'success' 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}>
              {localToast.type === 'success' ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
              <span className="font-black text-sm tracking-wide">{localToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
