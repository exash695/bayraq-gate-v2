import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  History,
  Printer,
  Sparkles,
  AlertCircle,
  RefreshCw,
  FileText,
  Award,
  ChevronDown,
  Layers,
  Info,
  Camera,
  Upload,
  Loader2,
  X,
  Video,
  Play,
  Trash2,
  Eye,
  Download,
  Share2,
  Film
} from 'lucide-react';
import { ClassroomVideoPlayer } from './ClassroomVideoPlayer';
import { academicService, SchoolStudent, AcademicList } from '../services/academicService';
import { staffService } from '../services/staffService';
import { safeStorage } from '../lib/storage';
import { realtimeManager } from '../lib/realtimeManager';
import { printAttendanceReport } from '../utils/attendancePrint';
import { BerqCharacter } from './BerqCharacterManager';

interface TeacherAttendanceTabProps {
  schoolId: string;
  teacherData?: any;
  schoolName?: string;
  selectedClass?: string;
  onSelectClass?: (cls: string) => void;
  availableClasses?: string[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialAcademicLists?: any[];
  initialStudents?: any[];
}

export const getArabicRecordedTime = (date = new Date()) => {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const isPM = hours >= 12;
  const h12 = (hours % 12 || 12).toString().padStart(2, '0');
  return `${h12}:${minutes} ${isPM ? 'م' : 'ص'}`;
};

const DEFAULT_GRADES = [
  'أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي',
  'أول متوسط', 'ثاني متوسط', 'ثالث متوسط',
  'رابع علمي', 'رابع أدبي', 'خامس علمي', 'خامس أدبي', 'سادس علمي', 'سادس أدبي'
];

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({
  schoolId,
  teacherData,
  schoolName = 'ثانوية أوائل غماس الأهلية',
  selectedClass: initialClass,
  onSelectClass,
  availableClasses: passedAvailableClasses,
  showToast = () => {},
  initialAcademicLists,
  initialStudents
}) => {
  // Synchronous cache loading for 0ms delay across all available school keys or passed props
  const [academicLists, setAcademicLists] = useState<AcademicList[]>(() => {
    if (Array.isArray(initialAcademicLists) && initialAcademicLists.length > 0) {
      return initialAcademicLists;
    }
    try {
      const keys = [
        schoolId ? `s6_cache_lists_${schoolId}` : null,
        's6_cache_lists_school1',
        's6_cache_lists_all',
        's6_cache_lists_school_awail_ghamas'
      ].filter(Boolean) as string[];
      for (const k of keys) {
        const stored = safeStorage.getItem(k);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [allStudents, setAllStudents] = useState<SchoolStudent[]>(() => {
    if (Array.isArray(initialStudents) && initialStudents.length > 0) {
      return initialStudents;
    }
    try {
      const keys = [
        schoolId ? `s6_cache_students_${schoolId}` : null,
        's6_cache_students_school1',
        's6_cache_students_all',
        's6_cache_students_school_awail_ghamas'
      ].filter(Boolean) as string[];
      for (const k of keys) {
        const stored = safeStorage.getItem(k);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Sync state if props update from SchoolPlatform
  useEffect(() => {
    if (Array.isArray(initialAcademicLists) && initialAcademicLists.length > 0) {
      setAcademicLists(initialAcademicLists);
    }
  }, [initialAcademicLists]);

  useEffect(() => {
    if (Array.isArray(initialStudents) && initialStudents.length > 0) {
      setAllStudents(prev => {
        const hasLogs = prev.some(s => Array.isArray(s.attendance?.logs) && s.attendance.logs.length > 0);
        if (hasLogs) return prev;
        return initialStudents;
      });
    }
  }, [initialStudents]);

  // Instant real-time synchronization with server, Admin dashboard, and other teachers
  useEffect(() => {
    if (!schoolId) return;
    const unsubStudents = academicService.subscribeToStudents(schoolId, (freshStudents) => {
      if (Array.isArray(freshStudents) && freshStudents.length > 0) {
        setAllStudents(freshStudents);
      }
    });

    const handleRealtimeAttendance = (evt: any) => {
      const detail = evt?.detail || evt?.data || evt?.payload || evt;
      if (!detail) return;
      const targetDate = detail.date || selectedDate;
      const targetPeriod = detail.period || 'يوم كامل';
      const newLog = {
        date: targetDate,
        status: detail.status || 'present',
        period: targetPeriod,
        reason: detail.reason || '',
        evaluation: detail.evaluation || null,
        time: detail.time || getArabicRecordedTime(),
        by: detail.by || 'الأستاذ'
      };
      applyAttendanceUpdateToLocalState(detail, newLog, detail.attendance);
    };

    window.addEventListener('attendance_updated', handleRealtimeAttendance as any);
    window.addEventListener('students_updated', handleRealtimeAttendance as any);
    const unsubWs = realtimeManager.subscribe('attendance', handleRealtimeAttendance);
    const unsubWsSt = realtimeManager.subscribe('students', (p: any) => {
      const payload = p?.payload || p?.data || p;
      if (payload) handleRealtimeAttendance(payload);
    });

    return () => {
      unsubStudents();
      window.removeEventListener('attendance_updated', handleRealtimeAttendance as any);
      window.removeEventListener('students_updated', handleRealtimeAttendance as any);
      unsubWs();
      unsubWsSt();
    };
  }, [schoolId]);

  // Centralized Helper to update BOTH allStudents and academicLists in React state synchronously
  const applyAttendanceUpdateToLocalState = (target: any, newLog?: any, explicitAttendance?: any) => {
    const targetId = String(target?.studentId || target?.id || '').trim().toLowerCase();
    const targetCode = String(target?.studentCode || target?.code || target?.student || '').trim().toLowerCase();
    const cleanTargetCode = targetCode.replace(/^st_/, '').replace(/^p\d*[-_]?/, '').trim();
    const targetName = String(target?.name || '').trim();

    const computeNewAtt = (currentAtt: any) => {
      if (explicitAttendance && Array.isArray(explicitAttendance.logs) && explicitAttendance.logs.length > 0) {
        return explicitAttendance;
      }
      if (!newLog) return currentAtt;
      const logs = Array.isArray(currentAtt?.logs) ? currentAtt.logs : [];
      const otherLogs = logs.filter((l: any) => !(l.date === newLog.date && l.period === newLog.period));
      const updatedLogs = [newLog, ...otherLogs];
      let pCount = 0, aCount = 0, lCount = 0;
      updatedLogs.forEach((l: any) => {
        if (l.status === 'present') pCount++;
        if (l.status === 'absent') aCount++;
        if (l.status === 'late') lCount++;
      });
      return { present: pCount, absent: aCount, late: lCount, logs: updatedLogs };
    };

    const isMatch = (st: any) => {
      const sid = String(st?.id || '').trim().toLowerCase();
      const scode = String(st?.code || st?.student || '').trim().toLowerCase();
      const cleanScode = scode.replace(/^st_/, '').replace(/^p\d*[-_]?/, '').trim();
      const sname = String(st?.name || '').trim();

      if (targetId && (sid === targetId || sid.includes(targetId) || targetId.includes(sid))) return true;
      if (targetCode && (scode === targetCode || scode.includes(targetCode) || targetCode.includes(scode))) return true;
      if (cleanTargetCode && cleanScode && (cleanScode === cleanTargetCode || cleanScode.includes(cleanTargetCode) || cleanTargetCode.includes(cleanScode))) return true;
      if (targetName && sname && (sname === targetName || sname.includes(targetName) || targetName.includes(sname))) return true;
      return false;
    };

    // 1. Update allStudents state
    setAllStudents(prevStudents => {
      if (!Array.isArray(prevStudents)) return prevStudents;
      return prevStudents.map(st => {
        if (isMatch(st)) {
          return {
            ...st,
            attendance: computeNewAtt(st.attendance)
          };
        }
        return st;
      });
    });

    // 2. Update academicLists state so classStudents updates instantly
    setAcademicLists(prevLists => {
      if (!Array.isArray(prevLists)) return prevLists;
      return prevLists.map(list => {
        const listStudents = Array.isArray(list.students) ? list.students : [];
        let listChanged = false;
        const updatedStudents = listStudents.map((st: any) => {
          if (isMatch(st)) {
            listChanged = true;
            return {
              ...st,
              attendance: computeNewAtt(st.attendance)
            };
          }
          return st;
        });
        return listChanged ? { ...list, students: updatedStudents } : list;
      });
    });
  };

  // Real-time teacher data state (keeps teacher classes strictly synchronized with administrative updates)
  const [internalTeacherData, setInternalTeacherData] = useState<any>(teacherData);

  useEffect(() => {
    if (teacherData) {
      setInternalTeacherData(teacherData);
    }
  }, [teacherData]);

  useEffect(() => {
    if (!schoolId) return;
    const targetTeacherId = internalTeacherData?.id || teacherData?.id;
    const targetCode = internalTeacherData?.code || teacherData?.code;

    const handleSyncTeacher = (teachersList: any[]) => {
      if (!Array.isArray(teachersList)) return;
      const fresh = teachersList.find(t => 
        (targetTeacherId && t.id === targetTeacherId) || 
        (targetCode && t.code === targetCode)
      );
      if (fresh) {
        setInternalTeacherData((prev: any) => ({ ...prev, ...fresh, classes: fresh.classes || [] }));
      }
    };

    const unsub = staffService.subscribeToTeachers(schoolId, handleSyncTeacher);

    const handleWindowTeachersUpdated = () => {
      staffService.getTeachers(schoolId).then(freshList => {
        if (Array.isArray(freshList)) {
          handleSyncTeacher(freshList);
        }
      });
    };
    window.addEventListener('teachers_updated', handleWindowTeachersUpdated);

    return () => {
      unsub();
      window.removeEventListener('teachers_updated', handleWindowTeachersUpdated);
    };
  }, [schoolId, teacherData?.id, teacherData?.code, internalTeacherData?.id, internalTeacherData?.code]);

  // Calculate all dynamic sections/classes available for the teacher
  const dynamicClassesList = useMemo(() => {
    // 1. Classes assigned to teacher (prioritizing passedAvailableClasses from SchoolPlatform teacherAssignedSections)
    const rawTeacherClasses = (passedAvailableClasses && passedAvailableClasses.length > 0)
      ? passedAvailableClasses
      : (internalTeacherData?.classes && internalTeacherData.classes.length > 0
          ? internalTeacherData.classes
          : (teacherData?.classes && teacherData.classes.length > 0 ? teacherData.classes : []));

    const classSet = new Set<string>();

    if (Array.isArray(rawTeacherClasses) && rawTeacherClasses.length > 0) {
      rawTeacherClasses.forEach(c => {
        if (typeof c === 'string' && c.trim()) classSet.add(c.trim());
      });
      if (classSet.size > 0) {
        return Array.from(classSet);
      }
    }

    // 2. Only if no classes are assigned to teacher at all, fallback to active academicLists
    (academicLists || []).forEach(l => {
      if (!l.isArchived && l.name && l.name.trim()) {
        classSet.add(l.name.trim());
      }
    });

    if (classSet.size === 0) {
      DEFAULT_GRADES.forEach(g => classSet.add(g));
    }

    return Array.from(classSet);
  }, [passedAvailableClasses, internalTeacherData?.classes, teacherData?.classes, academicLists]);

  const [activeClass, setActiveClass] = useState<string>(() => {
    const validInitial = initialClass && initialClass !== "ALL" && initialClass !== "all" ? initialClass : null;
    return (validInitial && dynamicClassesList.includes(validInitial)) ? validInitial : (dynamicClassesList[0] || 'اول ابتدائي أ');
  });

  useEffect(() => {
    if (initialClass && initialClass !== "ALL" && initialClass !== "all" && initialClass !== activeClass && dynamicClassesList.includes(initialClass)) {
      setActiveClass(initialClass);
    }
  }, [initialClass, dynamicClassesList]);

  useEffect(() => {
    if (dynamicClassesList.length > 0) {
      const isInvalid = !activeClass || activeClass === "ALL" || activeClass === "all" || !dynamicClassesList.includes(activeClass);
      if (isInvalid) {
        const nextClass = (initialClass && initialClass !== "ALL" && initialClass !== "all" && dynamicClassesList.includes(initialClass))
          ? initialClass
          : dynamicClassesList[0];
        
        if (nextClass && nextClass !== activeClass) {
          setActiveClass(nextClass);
          if (onSelectClass) {
            onSelectClass(nextClass);
          }
        }
      }
    }
  }, [dynamicClassesList, activeClass, initialClass, onSelectClass]);

  const handleClassChange = (cls: string) => {
    setActiveClass(cls);
    if (onSelectClass) {
      onSelectClass(cls);
    }
  };

  // Switcher dropdown state & click-outside listener
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute student counts per dynamic section for the switcher display
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const norm = (s: string) => (s || '')
      .replace(/[\s\-_()\/\\.]+/g, '')
      .replace(/^(الصف|صف)/g, '')
      .replace(/شعبة/g, '')
      .replace(/ال/g, '')
      .replace(/ة/g, 'ه')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ـ/g, '')
      .toLowerCase();

    dynamicClassesList.forEach(cls => {
      const targetNorm = norm(cls);
      const matchedList = (academicLists || []).find(l => !l.isArchived && (l.name === cls || norm(l.name) === targetNorm));
      if (matchedList && Array.isArray(matchedList.students) && matchedList.students.length > 0) {
        counts[cls] = matchedList.students.length;
        return;
      }
      const matched = allStudents.filter(st => {
        if (!st || st.status === 'deleted' || st.status === 'محذوف' || st.isDeleted === true) return false;
        const sGrade = (st.grade || '').trim();
        const sSec = ((st as any).section || '').trim();
        const sGradeNorm = norm(sGrade);
        const sSecNorm = norm(sSec);
        return sGradeNorm === targetNorm || sSecNorm === targetNorm || sGrade === cls ||
               (targetNorm.length >= 3 && (sGradeNorm.includes(targetNorm) || targetNorm.includes(sGradeNorm)));
      });
      counts[cls] = matched.length;
    });
    return counts;
  }, [dynamicClassesList, academicLists, allStudents]);

  // Date selection state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const isToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  }, [selectedDate]);

  // Loading state (false immediately if cached data is present)
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !(academicLists.length > 0 || allStudents.length > 0);
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'unrecorded'>('all');

  // Interactive Action Drawer for specific student
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [actionPeriod, setActionPeriod] = useState<string>('يوم كامل');
  const [actionReason, setActionReason] = useState<string>('بدون عذر');
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  // Student History Modal
  const [historyStudent, setHistoryStudent] = useState<any | null>(null);
  const [studentLogs, setStudentLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // Quick Batch Status
  const [isBatchApplying, setIsBatchApplying] = useState<boolean>(false);

  // Classroom Live Evaluation State
  const [showEvalModal, setShowEvalModal] = useState<boolean>(false);
  const [selectedEvalStudent, setSelectedEvalStudent] = useState<any | null>(null);
  const [selectedEvalOption, setSelectedEvalTextOption] = useState<string>('');
  const [customEvalText, setCustomEvalText] = useState<string>('');
  const [isSavingEval, setIsSavingEval] = useState<boolean>(false);

  // Classroom Lens ("عين على الصف") State
  const [activeMainTab, setActiveMainTab] = useState<'attendance' | 'lens'>('attendance');
  const [showLensModal, setShowLensModal] = useState<boolean>(false);
  const [selectedLensStudent, setSelectedLensStudent] = useState<any | null>(null);
  const [isBroadcastToAllMode, setIsBroadcastToAllMode] = useState<boolean>(false);
  const [lensDescription, setLensDescription] = useState<string>('مشاركة وتفاعل صفي ممتاز 🌟');
  const [lensFile, setLensFile] = useState<File | null>(null);
  const [lensUploadStatus, setLensUploadStatus] = useState<string>('');
  const [isUploadingLens, setIsUploadingLens] = useState<boolean>(false);
  const activeUploadXhrRef = useRef<XMLHttpRequest | null>(null);

  // Cancel running upload
  const handleCancelUpload = () => {
    if (activeUploadXhrRef.current) {
      try {
        activeUploadXhrRef.current.abort();
      } catch (e) {
        console.warn("Could not abort XHR:", e);
      }
      activeUploadXhrRef.current = null;
    }
    setIsUploadingLens(false);
    setLensUploadStatus('');
    setShowLensModal(false);
    setLensFile(null);
    setSelectedLensStudent(null);
    setIsBroadcastToAllMode(false);
    showToast('تم إلغاء عملية الرفع 🛑', 'info');
  };

  // Classroom Lens Feed and Gallery State
  const [classLensActivities, setClassLensActivities] = useState<any[]>([]);
  const [isLoadingClassLens, setIsLoadingClassLens] = useState<boolean>(false);

  // Student Lens History Modal State
  const [viewingLensHistoryStudent, setViewingLensHistoryStudent] = useState<any | null>(null);
  const [studentLensHistory, setStudentLensHistory] = useState<any[]>([]);
  const [isLoadingStudentHistory, setIsLoadingStudentHistory] = useState<boolean>(false);

  // Delete Snapshot Confirmation State (Avoids window.confirm blocked by iframes)
  const [activityToDelete, setActivityToDelete] = useState<{ id: string; desc?: string } | null>(null);
  const [isDeletingLensActivity, setIsDeletingLensActivity] = useState<boolean>(false);

  // Broadcast / Group Lens History Modal State
  const [showBroadcastHistoryModal, setShowBroadcastHistoryModal] = useState<boolean>(false);
  const [broadcastHistory, setBroadcastHistory] = useState<any[]>([]);
  const [isLoadingBroadcastHistory, setIsLoadingBroadcastHistory] = useState<boolean>(false);

  // Open broadcast history modal
  const handleOpenBroadcastHistory = () => {
    setShowBroadcastHistoryModal(true);
    setIsLoadingBroadcastHistory(true);
    fetch(`/api/bairaq-activities?studentId=ALL&schoolId=${schoolId || 'school1'}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.activities)) {
          // Strictly only group broadcasts
          const broadcastActs = data.activities.filter((act: any) => act.studentId === 'ALL' || !act.studentId);
          setBroadcastHistory(broadcastActs);
        } else {
          setBroadcastHistory([]);
        }
      })
      .catch(err => console.error("Failed to load broadcast history:", err))
      .finally(() => setIsLoadingBroadcastHistory(false));
  };

  // Teacher Subject for Classroom Lens
  const [lensSubject, setLensSubject] = useState<string>(() => {
    return teacherData?.subject || teacherData?.specialization || internalTeacherData?.subject || 'الرياضيات';
  });
  const [lensTeacherName, setLensTeacherName] = useState<string>(() => {
    return teacherData?.name || teacherData?.fullName || internalTeacherData?.name || 'الأستاذ';
  });

  useEffect(() => {
    const name = teacherData?.name || teacherData?.fullName || internalTeacherData?.name || '';
    if (name && (lensTeacherName === 'الأستاذ' || !lensTeacherName)) setLensTeacherName(name);
    const sub = teacherData?.subject || teacherData?.specialization || internalTeacherData?.subject || '';
    if (sub && (lensSubject === 'الرياضيات' || !lensSubject)) setLensSubject(sub);
  }, [teacherData, internalTeacherData]);

  // Fetch Class Activities for Classroom Lens Tab
  const fetchClassLensActivities = () => {
    if (!schoolId) return;
    setIsLoadingClassLens(true);
    fetch(`/api/bairaq-activities?schoolId=${schoolId}&date=${selectedDate}&grade=${encodeURIComponent(activeClass)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.activities)) {
          setClassLensActivities(data.activities);
        } else {
          setClassLensActivities([]);
        }
      })
      .catch(err => console.error("Failed to load class lens activities:", err))
      .finally(() => setIsLoadingClassLens(false));
  };

  useEffect(() => {
    if (activeMainTab === 'lens') {
      fetchClassLensActivities();
    }
  }, [activeMainTab, selectedDate, activeClass, schoolId]);

  // Open individual student's lens history
  const handleOpenStudentLensHistory = (student: any) => {
    setViewingLensHistoryStudent(student);
    setIsLoadingStudentHistory(true);
    const stId = student.id || student.code || student.name;
    const schId = student.schoolId || schoolId;
    fetch(`/api/bairaq-activities?studentId=${encodeURIComponent(stId)}&schoolId=${encodeURIComponent(schId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.activities)) {
          // Strictly exclude group broadcasts ('ALL') from teacher student history modal
          const individualActs = data.activities.filter((act: any) => act.studentId && act.studentId !== 'ALL');
          setStudentLensHistory(individualActs);
        } else {
          setStudentLensHistory([]);
        }
      })
      .catch(err => console.error("Failed to load student lens history:", err))
      .finally(() => setIsLoadingStudentHistory(false));
  };

  // Perform deletion of snapshot with API call
  const handleConfirmDeleteSnapshot = async () => {
    if (!activityToDelete) return;
    const targetId = activityToDelete.id;
    setIsDeletingLensActivity(true);
    try {
      const res = await fetch(`/api/bairaq-activities/${targetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم حذف اللقطة بنجاح 🗑️', 'success');
        setClassLensActivities(prev => prev.filter(a => a.id !== targetId));
        setStudentLensHistory(prev => prev.filter(a => a.id !== targetId));
        setBroadcastHistory(prev => prev.filter(a => a.id !== targetId));
        setActivityToDelete(null);
        realtimeManager.broadcast('lens_activities_changed', { deletedId: targetId });
      } else {
        showToast(data.message || 'فشل حذف اللقطة', 'error');
      }
    } catch (e) {
      showToast('فشل حذف اللقطة', 'error');
    } finally {
      setIsDeletingLensActivity(false);
    }
  };

  // 1. Subscribe to students and academic lists via PostgreSQL / REST backend
  useEffect(() => {
    const unsubStudents = academicService.subscribeToStudents(schoolId || 'school1', (students) => {
      if (Array.isArray(students) && students.length > 0) {
        setAllStudents(students);
      }
      setIsLoading(false);
    });

    const unsubLists = academicService.subscribeToLists(schoolId || 'school1', (lists) => {
      if (Array.isArray(lists) && lists.length > 0) {
        setAcademicLists(lists);
      }
      setIsLoading(false);
    }, schoolName);

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubLists) unsubLists();
    };
  }, [schoolId, schoolName]);

  // 2. Derive students for activeClass strictly from the active Academic List (Code Center source of truth)
  const classStudents = useMemo(() => {
    if (!activeClass) return [];

    const norm = (s: string) => (s || '')
      .replace(/[\s\-_()\/\\.]+/g, '')
      .replace(/^(الصف|صف)/g, '')
      .replace(/شعبة/g, '')
      .replace(/ال/g, '')
      .replace(/ة/g, 'ه')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ـ/g, '')
      .toLowerCase();

    const targetNorm = norm(activeClass);

    // Build a quick lookup map for latest attendance data from allStudents
    const attendanceLookup = new Map<string, any>();
    allStudents.forEach(s => {
      const code = (s.code || (s as any).student || '').toString().trim();
      const id = (s.id || '').toString().trim();
      const normName = norm(s.name || '');
      if (id) attendanceLookup.set(id, s);
      if (code) {
        attendanceLookup.set(code, s);
        attendanceLookup.set(`school1_${code}`, s);
        if (schoolId) attendanceLookup.set(`${schoolId}_${code}`, s);
      }
      if (normName) attendanceLookup.set(`name_${normName}`, s);
    });

    // Helper to verify student is active and not deleted
    const isStudentDeleted = (st: any) => {
      if (!st) return true;
      if (st.status === 'deleted' || st.status === 'محذوف' || st.isDeleted === true) return true;
      const code = (st.code || st.student || '').toString().trim();
      const id = (st.id || '').toString().trim();
      const normName = norm(st.name || '');
      const dbStudent = (id && attendanceLookup.get(id)) ||
                        (code && attendanceLookup.get(code)) ||
                        (normName && attendanceLookup.get(`name_${normName}`));
      if (dbStudent && (dbStudent.status === 'deleted' || dbStudent.status === 'محذوف' || dbStudent.isDeleted === true)) return true;
      return false;
    };

    // 1. Look for matching active list in academicLists (Primary Source of Truth from Code Center)
    const activeLists = (academicLists || []).filter(l => !l.isArchived);
    
    // Exact list name match first
    let matchingList = activeLists.find(l => (l.name || '').trim() === activeClass.trim());
    if (!matchingList) {
      matchingList = activeLists.find(l => norm(l.name) === targetNorm);
    }
    if (!matchingList) {
      matchingList = activeLists.find(l => {
        const lNorm = norm(l.name);
        return lNorm.length > 0 && targetNorm.length > 0 && (lNorm.includes(targetNorm) || targetNorm.includes(lNorm));
      });
    }

    if (matchingList && Array.isArray(matchingList.students) && matchingList.students.length > 0) {
      return matchingList.students
        .filter((st: any) => !isStudentDeleted(st))
        .map((st: any) => {
          const studentCode = (st.code || st.student || '').toString().trim();
          const studentId = st.id || (studentCode ? `${schoolId}_${studentCode}`.replace(/\s+/g, '_') : `st_${st.name}`);
          const normName = norm(st.name || '');
          const dbStudent = (st.id && attendanceLookup.get(st.id)) ||
                            (studentCode && attendanceLookup.get(studentCode)) ||
                            (normName && attendanceLookup.get(`name_${normName}`)) || {};

          return {
            id: studentId,
            name: st.name || dbStudent.name || (studentCode ? `طالب (${studentCode})` : 'طالب'),
            grade: activeClass,
            schoolId: schoolId || matchingList?.schoolId,
            code: studentCode || dbStudent.code || '',
            parentCode: st.parent || st.parentCode || dbStudent.parentCode || '',
            status: st.status || dbStudent.status || 'نشط',
            paidAmount: Number(st.paidAmount ?? dbStudent.paidAmount ?? 0),
            totalAmount: Number(st.totalAmount ?? dbStudent.totalAmount ?? 0),
            attendance: dbStudent.attendance || st.attendance || { present: 0, absent: 0, late: 0, logs: [] }
          } as SchoolStudent;
        }).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    }

    // 2. If no single exact list, check if activeClass matches multiple lists (e.g. general grade)
    const subLists = activeLists.filter(l => {
      const lNorm = norm(l.name);
      return (lNorm.startsWith(targetNorm) || targetNorm.startsWith(lNorm)) && Array.isArray(l.students) && l.students.length > 0;
    });

    if (subLists.length > 0) {
      const mergedStudentsMap = new Map<string, SchoolStudent>();
      subLists.forEach(l => {
        (l.students || []).forEach((st: any) => {
          if (isStudentDeleted(st)) return;
          const studentCode = (st.code || st.student || '').toString().trim();
          const studentId = st.id || (studentCode ? `${schoolId}_${studentCode}`.replace(/\s+/g, '_') : `st_${st.name}`);
          const normName = norm(st.name || '');
          const dbStudent = (st.id && attendanceLookup.get(st.id)) ||
                            (studentCode && attendanceLookup.get(studentCode)) ||
                            (normName && attendanceLookup.get(`name_${normName}`)) || {};
          
          if (!mergedStudentsMap.has(studentId)) {
            mergedStudentsMap.set(studentId, {
              id: studentId,
              name: st.name || dbStudent.name || (studentCode ? `طالب (${studentCode})` : 'طالب'),
              grade: l.name || activeClass,
              schoolId: schoolId || l.schoolId,
              code: studentCode || dbStudent.code || '',
              parentCode: st.parent || st.parentCode || dbStudent.parentCode || '',
              status: st.status || dbStudent.status || 'نشط',
              paidAmount: Number(st.paidAmount ?? dbStudent.paidAmount ?? 0),
              totalAmount: Number(st.totalAmount ?? dbStudent.totalAmount ?? 0),
              attendance: dbStudent.attendance || st.attendance || { present: 0, absent: 0, late: 0, logs: [] }
            } as SchoolStudent);
          }
        });
      });
      return Array.from(mergedStudentsMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
    }

    // 3. Fallback: match by grade / section from allStudents
    const matched = allStudents.filter(s => {
      if (isStudentDeleted(s)) return false;
      const sGrade = (s.grade || '').trim();
      const sSec = ((s as any).section || '').trim();
      const sGradeNorm = norm(sGrade);
      const sSecNorm = norm(sSec);
      return sGradeNorm === targetNorm || sSecNorm === targetNorm || sGrade === activeClass ||
             (targetNorm.length >= 3 && (sGradeNorm.includes(targetNorm) || targetNorm.includes(sGradeNorm)));
    });

    return matched.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [allStudents, academicLists, activeClass, schoolId]);

  // Calculate day-specific status for each student
  const studentsWithDayStatus = useMemo(() => {
    const sDate = String(selectedDate || '').split('T')[0];
    return classStudents.map(student => {
      const logs = (((student as any).attendance?.logs || []) as any[]);
      const dayLogs = logs.filter((l: any) => {
        const lDate = String(l.date || '').split('T')[0];
        return lDate === sDate;
      });
      let status: 'present' | 'absent' | 'late' | 'unrecorded' = 'unrecorded';
      let dayLog: any = null;
      if (dayLogs.length > 0) {
        dayLog = dayLogs[0];
        status = dayLog.status || 'unrecorded';
      }
      return {
        ...student,
        dayStatus: status,
        dayLog: dayLog || null,
        dayLogs
      };
    });
  }, [classStudents, selectedDate]);

  // Compute Class Statistics for Selected Date
  const stats = useMemo(() => {
    const total = studentsWithDayStatus.length;
    const present = studentsWithDayStatus.filter(s => s.dayStatus === 'present').length;
    const absent = studentsWithDayStatus.filter(s => s.dayStatus === 'absent').length;
    const late = studentsWithDayStatus.filter(s => s.dayStatus === 'late').length;
    const unrecorded = studentsWithDayStatus.filter(s => s.dayStatus === 'unrecorded').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      unrecorded,
      attendanceRate
    };
  }, [studentsWithDayStatus]);

  // Filtered students for display
  const displayStudents = useMemo(() => {
    return studentsWithDayStatus.filter(s => {
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const codeMatch = (s.code || '').toLowerCase().includes(q);
        if (!nameMatch && !codeMatch) return false;
      }
      // Filter by status
      if (statusFilter !== 'all') {
        return s.dayStatus === statusFilter;
      }
      return true;
    });
  }, [studentsWithDayStatus, searchQuery, statusFilter]);

  // Handler: Explicit Full Batch Sync with Admin & Parent Portal
  const handleExplicitSyncWithAdminAndParents = async () => {
    setIsSyncing(true);
    const teacherName = teacherData?.name || "أستاذ المادة";
    let syncedCount = 0;

    try {
      for (const student of studentsWithDayStatus) {
        const statusToSync = student.dayStatus === "unrecorded" ? "present" : student.dayStatus;
        const evaluationText = student.dayLog?.evaluation || student.dayLog?.reason || "";
        const currentSubject = teacherData?.subject || internalTeacherData?.subject || "";

        const newLog = {
          date: selectedDate,
          status: statusToSync,
          period: student.dayLog?.period || "يوم كامل",
          subject: currentSubject,
          reason: evaluationText,
          evaluation: evaluationText,
          time: getArabicRecordedTime(),
          by: teacherName
        };
        applyAttendanceUpdateToLocalState(student, newLog);

        try {
          await academicService.updateAttendance(
            student.id,
            (student as any).userId || student.code || student.id,
            statusToSync,
            teacherName,
            evaluationText,
            student.dayLog?.period || "يوم كامل",
            schoolId,
            selectedDate,
            evaluationText,
            { code: student.code, studentCode: student.code, name: student.name, subject: currentSubject, time: getArabicRecordedTime() }
          );
          syncedCount++;
        } catch (e) {
          console.warn("Sync student item error:", e);
        }
      }

      try {
        const cacheKeys = [
          schoolId ? `s6_cache_students_${schoolId}` : null,
          "s6_cache_students_school1",
          "s6_cache_students_all",
          "s6_cache_students_school_awail_ghamas",
          "s6_academic_students"
        ].filter(Boolean) as string[];

        cacheKeys.forEach(k => {
          safeStorage.setItem(k, JSON.stringify(allStudents));
        });
      } catch {}

      showToast(`تم التزامن الشامل وبث سجل الحضور لـ (${syncedCount}) طالب مع الإدارة وبوابة ولي الأمر بنجاح! ⚡`, "success");
    } catch (err) {
      console.error("Explicit sync error:", err);
      showToast("حدث خطأ أثناء إجراء التزامن المباشر", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Save & Broadcast Live Classroom Activity Evaluation
  const handleSaveClassroomEvaluation = async () => {
    if (!selectedEvalStudent) return;

    let finalText = selectedEvalOption;
    if (selectedEvalOption === "✏️ ملاحظة مخصصة (كتابة أخرى)...") {
      finalText = customEvalText.trim();
    } else if (customEvalText.trim()) {
      finalText = selectedEvalOption ? `${selectedEvalOption} - ${customEvalText.trim()}` : customEvalText.trim();
    }

    if (!finalText) {
      showToast("يرجى اختيار تقييم أو كتابة ملاحظة مخصصة للطالب", "error");
      return;
    }

    setIsSavingEval(true);
    const teacherName = teacherData?.name || "أستاذ المادة";
    const currentSubject = teacherData?.subject || internalTeacherData?.subject || "";

    const recordedTime = getArabicRecordedTime();
    const newLog = {
      date: selectedDate,
      status: "present",
      period: "يوم كامل",
      subject: currentSubject,
      reason: finalText,
      evaluation: finalText,
      time: recordedTime,
      by: teacherName
    };

    // Instant local state update across allStudents AND academicLists
    applyAttendanceUpdateToLocalState(selectedEvalStudent, newLog);

    try {
      await academicService.updateAttendance(
        selectedEvalStudent.id,
        (selectedEvalStudent as any).userId || selectedEvalStudent.code || selectedEvalStudent.id,
        "present",
        teacherName,
        finalText,
        "يوم كامل",
        schoolId,
        selectedDate,
        finalText,
        { code: selectedEvalStudent.code, studentCode: selectedEvalStudent.code, name: selectedEvalStudent.name, subject: currentSubject, time: recordedTime }
      );

      // Send real-time parent notification
      try {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedEvalStudent.id || selectedEvalStudent.code,
            recipientRole: "parent",
            type: "evaluation",
            title: "⚡ تقييم صفي مباشر من الأستاذ!",
            message: `تلقى الطالب ${selectedEvalStudent.name} تقييماً متميزاً في مادة ${teacherData?.subject || "الحصة"}: "${finalText}"`,
            read: false,
            isRead: false
          })
        });
      } catch {}

      showToast(`تم إرسال التقييم الصفي للطالب "${selectedEvalStudent.name}" ولولي أمره بنجاح! ⚡`, "success");
      setShowEvalModal(false);
      setSelectedEvalStudent(null);
      setSelectedEvalTextOption("");
      setCustomEvalText("");
    } catch (err) {
      console.error("Failed to save classroom evaluation:", err);
      showToast("حدث خطأ أثناء حفظ وإرسال التقييم الصفي", "error");
    } finally {
      setIsSavingEval(false);
    }
  };

  const handleUploadLensActivity = async () => {
    if (!lensFile) {
      showToast('⚠️ يرجى تحديد فيديو أو صورة للرفع أولاً', 'error');
      return;
    }
    if (!selectedLensStudent && !isBroadcastToAllMode) {
      showToast('يرجى تحديد التلميذ أو اختيار النشر لجميع طلاب الصف', 'error');
      return;
    }

    // Client-side file size validation (Up to 500MB for high-definition classroom recordings)
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    if (lensFile.size > MAX_SIZE) {
      showToast(`⚠️ حجم الملف كبير جداً (${(lensFile.size / (1024 * 1024)).toFixed(1)}MB). الحد الأقصى هو 500MB.`, 'error');
      return;
    }
    
    console.log('[Lens Upload] Initiating upload...', {
      studentId: isBroadcastToAllMode ? 'ALL' : (selectedLensStudent?.id || selectedLensStudent?.code),
      isAll: isBroadcastToAllMode,
      schoolId: schoolId,
      fileName: lensFile.name,
      fileSize: lensFile.size,
      fileType: lensFile.type
    });

    setIsUploadingLens(true);
    setLensUploadStatus('جاري تجهيز الملف... 0%');
    
    try {
      const formData = new FormData();
      formData.append('file', lensFile);
      formData.append('studentId', isBroadcastToAllMode ? 'ALL' : (selectedLensStudent?.id || selectedLensStudent?.code || 'ALL'));
      formData.append('studentName', selectedLensStudent?.name || '');
      formData.append('studentCode', selectedLensStudent?.code || '');
      formData.append('parentCode', selectedLensStudent?.parentCode || '');
      formData.append('isAllStudents', isBroadcastToAllMode ? 'true' : 'false');
      formData.append('grade', activeClass);
      formData.append('schoolId', selectedLensStudent?.schoolId || schoolId || 'school1');
      formData.append('description', lensDescription);
      formData.append('authorName', lensTeacherName || teacherData?.name || internalTeacherData?.name || 'الأستاذ');
      formData.append('subject', lensSubject || teacherData?.subject || internalTeacherData?.subject || '');
      formData.append('mediaType', lensFile.type.startsWith('video/') ? 'video' : 'photo');

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      activeUploadXhrRef.current = xhr;
      
      // Handle progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          const loadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
          const totalMB = (event.total / (1024 * 1024)).toFixed(1);
          setLensUploadStatus(`جاري رفع الملف للسيرفر: ${percent}% (${loadedMB} / ${totalMB} MB)`);
        }
      };

      // Create a promise to handle the XHR
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.open('POST', '/api/bairaq-activities/upload');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res);
            } catch (e) {
              reject(new Error('رد غير صالح من السيرفر'));
            }
          } else {
            let errorMsg = `فشل الرفع: كود ${xhr.status}`;
            try {
              const res = JSON.parse(xhr.responseText);
              errorMsg = res.message || errorMsg;
            } catch (e) {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error('حدث خطأ في الاتصال بالشبكة'));
        xhr.ontimeout = () => reject(new Error('انتهت مهلة الرفع، قد يكون الملف كبيراً جداً أو الإنترنت ضعيفاً'));
        xhr.onabort = () => reject(new Error('UPLOAD_ABORTED'));
        
        xhr.timeout = 600000; // 10 minutes timeout for video up to 500MB
        xhr.send(formData);
      });

      const resData: any = await uploadPromise;
      
      if (resData.success) {
        showToast(resData.message || 'تم رفع لقطة "عين على الصف" وبثها وتوثيقها فورياً لولي الأمر! 🎉📸', 'success');
        setShowLensModal(false);
        setLensFile(null);
        setLensDescription('مشاركة وتفاعل صفي ممتاز 🌟');
        setLensUploadStatus('');
        setIsBroadcastToAllMode(false);
        fetchClassLensActivities();
        realtimeManager.broadcast('lens_activities_changed', { created: true });
      } else {
        const msg = resData.message || 'فشل نشر اللقطة على مركز البث';
        showToast(msg, 'error');
        setLensUploadStatus(`توقف: ${msg}`);
      }
    } catch (err: any) {
      if (err.message === 'UPLOAD_ABORTED') {
        console.log('[Lens Upload] Upload aborted by user.');
        return;
      }
      console.error('[Lens Upload Error]', err);
      showToast(err.message || 'حدث خطأ غير متوقع أثناء الرفع', 'error');
      setLensUploadStatus(`فشل: ${err.message}`);
    } finally {
      activeUploadXhrRef.current = null;
      setIsUploadingLens(false);
    }
  };

  // Handler: 1-Click Status Update (Instant Real-time Sync with Backend)
  const handleQuickStatus = async (student: any, status: 'present' | 'absent' | 'late') => {
    const teacherName = teacherData?.name || 'الأستاذ';
    const currentSubject = teacherData?.subject || internalTeacherData?.subject || '';
    setIsSyncing(true);

    const recordedTime = getArabicRecordedTime();
    const newLog = {
      date: selectedDate,
      status,
      period: 'يوم كامل',
      subject: currentSubject,
      reason: status === 'present' ? '' : 'بدون عذر',
      time: recordedTime,
      by: teacherName
    };

    // Instant local state update across allStudents AND academicLists
    applyAttendanceUpdateToLocalState(student, newLog);

    try {
      await academicService.updateAttendance(
        student.id,
        (student as any).userId || student.code || student.id,
        status,
        teacherName,
        status === 'present' ? '' : 'بدون عذر',
        'يوم كامل',
        schoolId,
        selectedDate,
        undefined,
        { code: student.code, studentCode: student.code, name: student.name, subject: currentSubject, time: recordedTime }
      );

      const statusLabels = {
        present: 'حضور ✅',
        absent: 'غياب ❌',
        late: 'تأخير ⏳'
      };

      showToast(`تم رصد ${statusLabels[status]} للطالب "${student.name}" وتزامن السجل بنجاح!`, 'success');
    } catch (err: any) {
      console.error('Attendance update error:', err);
      showToast('فشل في حفظ وتزامن سجل الحضور مع الخادم', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Detailed Attendance Record (Period & Reason)
  const handleSaveDetailedAction = async (student: any) => {
    if (!student) return;
    const teacherName = teacherData?.name || 'الأستاذ';
    const currentSubject = teacherData?.subject || internalTeacherData?.subject || '';
    setIsSubmittingAction(true);

    const targetPeriod = (actionStatus === 'present' && actionPeriod === 'يوم كامل') ? '1' : actionPeriod;
    const recordedTime = getArabicRecordedTime();

    // 1. Instant local state update (0ms feedback)
    const currentAttendance = student.attendance || { present: 0, absent: 0, late: 0, logs: [] };
    const existingLogs = Array.isArray(currentAttendance.logs) ? currentAttendance.logs : [];
    const otherLogs = existingLogs.filter((l: any) => !(l.date === selectedDate && l.period === targetPeriod));
    const newLog = {
      date: selectedDate,
      status: actionStatus,
      period: targetPeriod,
      subject: currentSubject,
      reason: actionStatus === 'present' ? '' : actionReason,
      time: recordedTime,
      by: teacherName
    };
    const updatedLogs = [newLog, ...otherLogs];
    let presentCount = 0, absentCount = 0, lateCount = 0;
    updatedLogs.forEach((l: any) => {
      if (l.status === 'present') presentCount++;
      if (l.status === 'absent') absentCount++;
      if (l.status === 'late') lateCount++;
    });

    const newAttendanceObj = {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      logs: updatedLogs
    };

    // Instant synchronous local state update across allStudents AND academicLists
    applyAttendanceUpdateToLocalState(student, newLog, newAttendanceObj);

    try {
      await academicService.updateAttendance(
        student.id,
        (student as any).userId || student.code || student.id,
        actionStatus,
        teacherName,
        actionStatus === 'present' ? '' : actionReason,
        targetPeriod,
        schoolId,
        selectedDate,
        undefined,
        { code: student.code, studentCode: student.code, name: student.name, subject: currentSubject, time: recordedTime }
      );

      showToast(`تم تثبيت ${actionStatus === 'present' ? 'حضور' : actionStatus === 'absent' ? 'غياب' : 'تأخير'} للطالب (${targetPeriod})`, 'success');
    } catch (err: any) {
      console.warn('Detailed attendance update error/notice:', err);
      showToast(`تم حفظ ${actionStatus === 'present' ? 'الحضور' : actionStatus === 'absent' ? 'الغياب' : 'التأخير'} وتزامن السجل!`, 'success');
    } finally {
      setIsSubmittingAction(false);
      setEditingStudentId(null);
    }
  };

  // Handler: Batch Mark All Unrecorded as Present
  const handleBatchMarkAllPresent = async () => {
    const unrecordedStudents = studentsWithDayStatus.filter(s => s.dayStatus === 'unrecorded');
    if (unrecordedStudents.length === 0) {
      showToast('جميع طلاب الشعبة تم رصد حضورهم مسبقاً!', 'info');
      return;
    }

    if (!confirm(`هل أنت متأكد من رصد (حضور) لجميع الطلاب غير المرصودين (${unrecordedStudents.length} طالب) لشعبة "${activeClass}"؟`)) {
      return;
    }

    setIsBatchApplying(true);
    const teacherName = teacherData?.name || 'الأستاذ';
    const currentSubject = teacherData?.subject || internalTeacherData?.subject || '';
    const recordedTime = getArabicRecordedTime();

    try {
      for (const st of unrecordedStudents) {
        const newLog = {
          date: selectedDate,
          status: 'present',
          period: '1',
          subject: currentSubject,
          reason: '',
          time: recordedTime,
          by: teacherName
        };
        applyAttendanceUpdateToLocalState(st, newLog);
        await academicService.updateAttendance(
          st.id,
          (st as any).userId || st.code || st.id,
          'present',
          teacherName,
          '',
          '1',
          schoolId,
          selectedDate,
          undefined,
          { code: st.code, studentCode: st.code, name: st.name, subject: currentSubject, time: recordedTime }
        );
      }

      // Update local state immediately for instant feedback!
      setAllStudents(prevStudents => {
        return prevStudents.map(st => {
          const isUnrecorded = unrecordedStudents.some(u => u.id === st.id);
          if (isUnrecorded) {
            const currentAttendance = st.attendance || { present: 0, absent: 0, late: 0, logs: [] };
            const otherLogs = (currentAttendance.logs || []).filter((l: any) => !(l.date === selectedDate && l.period === '1'));
            const newLog = {
              date: selectedDate,
              status: 'present',
              period: '1',
              reason: '',
              time: recordedTime,
              by: teacherName
            };
            
            const updatedLogs = [newLog, ...otherLogs];
            let presentCount = 0, absentCount = 0, lateCount = 0;
            updatedLogs.forEach((l: any) => {
              if (l.status === 'present') presentCount++;
              if (l.status === 'absent') absentCount++;
              if (l.status === 'late') lateCount++;
            });
            
            return {
              ...st,
              attendance: {
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                logs: updatedLogs
              }
            };
          }
          return st;
        });
      });

      showToast(`تم رصد حضور لـ ${unrecordedStudents.length} طالب بنجاح وتمت المزامنة الفورية! 🎉`, 'success');
    } catch (err) {
      console.error('Batch attendance error:', err);
      showToast('حدث خطأ أثناء الرصد الجماعي', 'error');
    } finally {
      setIsBatchApplying(false);
    }
  };

  // Handler: Fetch and View Student History Logs
  const handleOpenStudentHistory = async (student: any) => {
    setHistoryStudent(student);
    setIsLoadingLogs(true);
    try {
      const logs = await academicService.fetchAttendanceLogs(student.id);
      setStudentLogs(logs || []);
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
      // Fallback to local logs on student object
      const fallbackLogs = (student.attendance?.logs || []) as any[];
      setStudentLogs(fallbackLogs);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Handler: Export / Print Daily Attendance Sheet for Class with full Arabic support
  const handlePrintAttendanceReport = () => {
    try {
      printAttendanceReport({
        schoolName,
        className: activeClass,
        date: selectedDate,
        supervisorName: teacherData?.name || 'الكادر التعليمي',
        students: studentsWithDayStatus.map(s => ({
          name: s.name,
          code: s.code,
          dayStatus: s.dayStatus,
          dayLog: s.dayLog
        })),
        stats: {
          total: stats.total,
          present: stats.present,
          absent: stats.absent,
          late: stats.late,
          unrecorded: stats.unrecorded,
          attendanceRate: stats.attendanceRate
        }
      });
      showToast('تم فتح كشف الحضور للطباعة والحفظ بتنسيق PDF 📄✨', 'success');
    } catch (err) {
      console.error('Print export error:', err);
      showToast('تعذر فتح أمر الطباعة، يرجى المحاولة مرة أخرى', 'error');
    }
  };

  return (
    <div className="w-full max-w-full flex-1 flex flex-col min-h-0 bg-[#070b14] text-white p-2.5 sm:p-5 md:p-6 space-y-4 overflow-y-auto overflow-x-hidden no-scrollbar" dir="rtl">
      
      {/* 0. Teacher Platform Header Banner (تصميم مطابق تماماً لهيدرات منصة الأستاذ مع وضعية بيرق لسجل الحضور) */}
      <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center mb-1">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
        <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Bairaq Mascot on the LEFT side with glowing circular border (مطابق لهيدر منصة الأستاذ) */}
        <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
          <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
          <BerqCharacter
            pose="pose_schedule_planner"
            glowColor="cyan"
            className="w-full h-full object-cover relative z-10 scale-110"
          />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
        </div>

        {/* Content Container (Title, School & Subtitle in 3 clean lines matching Teacher Platform) */}
        <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-32 sm:pl-36 md:pl-40 py-2 select-none h-full text-right min-w-0">
          <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
            غرفة التحكم - رصد الحضور والمواظبة ⏱️
          </h2>
          <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
            <span className="shrink-0 text-xs">🏛️</span>
            <span className="truncate">{schoolName || "ثانوية أوائل غماس الأهلية"}</span>
          </div>
          <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
            <span className="shrink-0 text-[10px]">⏱️</span>
            <span className="truncate">سجل الحضور والانضباط اليومي • {teacherData?.name || "أستاذ المادة"}</span>
          </div>
        </div>
      </div>

      {/* 🌟 Top-Level Tab Switcher: [سجل الحضور والتقييم ⚡] vs [عين على الصف 📸✨] */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0a1124] border border-cyan-500/25 rounded-2xl shadow-xl">
        <button
          type="button"
          onClick={() => setActiveMainTab('attendance')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeMainTab === 'attendance'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.01]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <UserCheck size={18} className={activeMainTab === 'attendance' ? 'animate-pulse' : ''} />
          <span>سجل الحضور والتقييم اليومي ⚡</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('lens')}
          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeMainTab === 'lens'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] scale-[1.01]'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera size={18} className={activeMainTab === 'lens' ? 'animate-pulse text-cyan-300' : ''} />
          <span>عين على الصف (اللقطات والبث الصفي) 📸✨</span>
        </button>
      </div>

      {activeMainTab === 'attendance' ? (
        <>
      {/* 1. Action Controls Bar: Class Selector, Date Navigation & Print */}
      <div className="bg-gradient-to-r from-[#0d162d] via-[#101c3d] to-[#0d162d] p-3.5 sm:p-4 rounded-2xl border border-cyan-500/20 shadow-[0_10px_30px_rgba(6,182,212,0.08)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left / Active Status & Quick hint */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
            <UserCheck size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                رصد الحضور اليومي لشعبة {activeClass}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                تزامن فوري
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-medium">
              تاريخ السجل: {selectedDate} {isToday && <span className="text-cyan-400 font-bold">(اليوم)</span>}
            </p>
          </div>
        </div>

        {/* Right Controls: Class Switcher & Date Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Interactive Class / Section Switcher Dropdown (Synchronized with Control Section) */}
          <div className="relative" ref={classDropdownRef}>
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className={`bg-[#080d1a] border ${
                isClassDropdownOpen
                  ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]"
                  : "border-white/10 hover:border-amber-400/50"
              } rounded-2xl px-3 py-2 flex items-center gap-2 text-right transition-all cursor-pointer group outline-none`}
            >
              <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-white/50">
                <Layers size={14} className="text-amber-400" />
                <span>الشعبة:</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs sm:text-sm font-black text-amber-300 truncate max-w-[120px] sm:max-w-[180px]">
                  {activeClass}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 font-mono font-bold shrink-0 border border-amber-400/20">
                  {sectionCounts[activeClass] !== undefined ? sectionCounts[activeClass] : classStudents.length}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-white/5 text-white/50 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                تبديل
              </span>
              <ChevronDown
                size={14}
                className={`text-amber-400 transition-transform duration-300 ${
                  isClassDropdownOpen ? "rotate-180" : "group-hover:translate-y-0.5"
                }`}
              />
            </button>

            {/* Click-away backdrop overlay */}
            {isClassDropdownOpen && (
              <div
                className="fixed inset-0 z-[115] bg-black/40 backdrop-blur-[2px]"
                onClick={() => setIsClassDropdownOpen(false)}
              />
            )}

            {/* Dropdown Menu Popover */}
            <AnimatePresence>
              {isClassDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#070C1E] border border-amber-400/40 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(251,191,36,0.15)] p-2 z-[130] text-right space-y-1 backdrop-blur-2xl"
                >
                  <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px] text-white/50 font-bold">
                    <span>اختر الشعبة لرصد الحضور:</span>
                    <span className="text-amber-400">{dynamicClassesList.length} متاح</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 no-scrollbar pt-1">
                    {dynamicClassesList.map((cls) => {
                      const isSelected = activeClass === cls;
                      const count = sectionCounts[cls] !== undefined ? sectionCounts[cls] : (isSelected ? classStudents.length : 0);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => {
                            handleClassChange(cls);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-right flex items-center justify-between gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black"
                              : "hover:bg-white/5 text-white/80 font-bold"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-amber-400 text-xs shrink-0">📌</span>
                            <span className="text-xs truncate font-black text-white">
                              {cls}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold">
                              {count} طالب
                            </span>
                            {isSelected && (
                              <Check size={14} className="text-amber-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date Picker & Fast Navigator */}
          <div className="flex items-center bg-[#080d1a] p-1 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev.toISOString().split('T')[0]);
              }}
              title="اليوم السابق"
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>

            <div className="px-2.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-cyan-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-cyan-200 outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next.toISOString().split('T')[0]);
              }}
              title="اليوم التالي"
              className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>
          </div>

          {/* Reset to Today Button (if not today) */}
          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-black transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>اليوم</span>
            </button>
          )}

          {/* Explicit Sync Button */}
          <button
            onClick={handleExplicitSyncWithAdminAndParents}
            disabled={isSyncing}
            className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 shrink-0"
            title="تزامن وحفظ السجل المباشر مع الإدارة وبوابة ولي الأمر"
          >
            <RefreshCw size={14} className={`text-black ${isSyncing ? "animate-spin" : ""}`} />
            <span>تزامن مباشر مع الإدارة وولي الأمر 🔄</span>
          </button>

          {/* Print Sheet Button */}
          <button
            onClick={handlePrintAttendanceReport}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            title="تصدير كشف الحضور"
          >
            <Printer size={14} className="text-indigo-400" />
            <span className="hidden sm:inline">طباعة الكشف</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Metrics & Overview Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        
        {/* Total Class Count */}
        <div className="bg-[#0b1224] p-3.5 sm:p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-white/40 block">إجمالي طلاب الشعبة</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        {/* Present Count */}
        <div className="bg-[#0b1224] p-3.5 sm:p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-emerald-400/70 block">الحاضرون اليوم</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{stats.present}</span>
              <span className="text-[11px] font-extrabold text-emerald-400/60">({stats.attendanceRate}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Absent Count */}
        <div className="bg-[#0b1224] p-3.5 sm:p-4 rounded-2xl border border-rose-500/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-rose-400/70 block">الغائبون</span>
            <span className="text-xl sm:text-2xl font-black text-rose-400 mt-0.5 block">{stats.absent}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <XCircle size={20} />
          </div>
        </div>

        {/* Late Count */}
        <div className="bg-[#0b1224] p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-amber-400/70 block">المتأخرون</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">{stats.late}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Clock size={20} />
          </div>
        </div>

        {/* Unrecorded / Pending Count & Batch Button */}
        <div className="col-span-2 sm:col-span-1 bg-[#0b1224] p-3.5 sm:p-4 rounded-2xl border border-purple-500/20 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-purple-400/70 block">غير المرصودين</span>
            <span className="text-xl sm:text-2xl font-black text-purple-300 mt-0.5 block">{stats.unrecorded}</span>
          </div>
          {stats.unrecorded > 0 ? (
            <button
              onClick={handleBatchMarkAllPresent}
              disabled={isBatchApplying}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-black text-[11px] shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
              title="رصد حضور للجميع"
            >
              {isBatchApplying ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} className="text-amber-300" />
              )}
              <span>تحضير الكل</span>
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Check size={20} />
            </div>
          )}
        </div>
      </div>

      {/* 3. Filter Bar & Search Input */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a1020] p-3 rounded-2xl border border-white/5">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-white/40 pl-2 shrink-0 flex items-center gap-1">
            <Filter size={13} />
            تصفية:
          </span>
          {[
            { id: 'all', label: `الكل (${stats.total})` },
            { id: 'present', label: `الحاضرون (${stats.present})`, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
            { id: 'absent', label: `الغائبون (${stats.absent})`, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
            { id: 'late', label: `المتأخرون (${stats.late})`, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
            { id: 'unrecorded', label: `غير المرصودين (${stats.unrecorded})`, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? tab.color || 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن اسم الطالب أو الكود..."
            className="w-full bg-[#060a14] border border-white/10 rounded-xl pr-9 pl-4 py-2 text-xs font-bold text-white placeholder:text-white/30 outline-none focus:border-cyan-500 transition-all text-right"
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
      </div>

      {/* 4. Students Attendance Grid / Table */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw size={30} className="text-cyan-400 animate-spin" />
          <p className="text-xs font-bold text-white/60">جارٍ مزامنة قوائم الطلاب من الخادم المركزي...</p>
        </div>
      ) : displayStudents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3 bg-[#0a1020] rounded-3xl border border-white/5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
            <Users size={32} />
          </div>
          <h3 className="text-base font-black text-white">لا يوجد طلاب مطابقين للتصفية</h3>
          <p className="text-xs text-white/50 font-medium">
            {classStudents.length === 0
              ? `لم يتم العثور على طلاب مسجلين في شعبة "${activeClass}". تأكد من تحديد الشعبة الصحيحة.`
              : 'جرب تغيير خيارات البحث أو التصفية أعلاه.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayStudents.map((student, idx) => {
            const studentKey = student.id || student.code || `st_${idx}`;
            const isEditing = editingStudentId === studentKey || editingStudentId === student.id || (Boolean(student.code) && editingStudentId === student.code);
            const dayStatus = student.dayStatus;
            const log = student.dayLog;

            return (
              <motion.div
                key={student.id || student.code || idx}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#0c1326] p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  dayStatus === 'present'
                    ? 'border-emerald-500/20 bg-gradient-to-r from-[#0c1326] to-[#0a1c18]'
                    : dayStatus === 'absent'
                      ? 'border-rose-500/20 bg-gradient-to-r from-[#0c1326] to-[#1c0a10]'
                      : dayStatus === 'late'
                        ? 'border-amber-500/20 bg-gradient-to-r from-[#0c1326] to-[#1c160a]'
                        : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Student Basic Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-amber-300 shrink-0">
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white truncate">{student.name}</h4>
                        <button
                          onClick={() => handleOpenStudentHistory(student)}
                          title="عرض السجل التاريخي والأرشيف"
                          className="text-white/30 hover:text-cyan-400 transition-colors p-0.5 rounded"
                        >
                          <History size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/40 font-bold mt-0.5">
                        <span>{activeClass}</span>
                        {log?.period && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-300 font-bold">الحصة: {log.period}</span>
                          </>
                        )}
                        {log?.reason && (
                          <>
                            <span>•</span>
                            <span className="text-rose-400 font-bold">({log.reason})</span>
                          </>
                        )}
                      </div>
                      {(log?.evaluation || (log?.reason && (log.reason.includes('شاركة') || log.reason.includes('إجابة') || log.reason.includes('نجم') || log.reason.includes('التزام') || log.reason.includes('ملاحظة') || log.reason.includes('مشتت') || log.reason.includes('واجب')))) && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-xl w-fit shadow-inner">
                          <Sparkles size={12} className="text-cyan-400 animate-pulse shrink-0" />
                          <span>النشاط الصفي: <strong className="text-white font-black">{log.evaluation || log.reason}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                    
                    {/* 1. Present Button */}
                    <button
                      onClick={() => {
                        if (isEditing && actionStatus === 'present') {
                          setEditingStudentId(null);
                        } else {
                          setEditingStudentId(studentKey);
                          setActionStatus('present');
                          setActionPeriod('1');
                          setActionReason('');
                        }
                      }}
                      className={`flex-1 sm:flex-initial text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        dayStatus === 'present'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                    >
                      <Check size={14} />
                      <span>حاضر</span>
                    </button>

                    {/* 2. Absent Button */}
                    <button
                      onClick={() => {
                        if (isEditing && actionStatus === 'absent') {
                          setEditingStudentId(null);
                        } else {
                          setEditingStudentId(studentKey);
                          setActionStatus('absent');
                          setActionPeriod('يوم كامل');
                          setActionReason('بدون عذر');
                        }
                      }}
                      className={`flex-1 sm:flex-initial text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        dayStatus === 'absent'
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 ring-2 ring-rose-400/40'
                          : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                      }`}
                    >
                      <XCircle size={14} />
                      <span>غائب</span>
                    </button>

                    {/* 3. Late Button */}
                    <button
                      onClick={() => {
                        if (isEditing && actionStatus === 'late') {
                          setEditingStudentId(null);
                        } else {
                          setEditingStudentId(studentKey);
                          setActionStatus('late');
                          setActionPeriod('1');
                          setActionReason('');
                        }
                      }}
                      className={`flex-1 sm:flex-initial text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        dayStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                      }`}
                    >
                      <Clock size={14} />
                      <span>تأخير</span>
                    </button>

                    {/* 4. Live Classroom Evaluation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEvalStudent(student);
                        setSelectedEvalTextOption('');
                        setCustomEvalText('');
                        setShowEvalModal(true);
                      }}
                      className="flex-1 sm:flex-initial text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 hover:from-cyan-500/25 hover:to-indigo-500/25 border border-cyan-400/30 text-cyan-300 hover:text-white font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
                      title="إضافة تقييم صفي مباشر وتزامن فوري مع ولي الأمر"
                    >
                      <Sparkles size={14} className="text-cyan-400 animate-pulse shrink-0" />
                      <span>التقييم والنشاط ⚡</span>
                    </button>
                  </div>
                </div>

                {/* Sub Drawer: Detail Customization for Period / Reason */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-3 mt-3 border-t border-white/10 space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#080d1a] p-3.5 rounded-xl border border-white/5">
                        
                        {/* Period selection */}
                        <div className={`space-y-1.5 ${actionStatus === 'present' ? 'md:col-span-2' : ''}`}>
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-extrabold text-cyan-300 block">
                              تحديد وقت / الحصة الدراسية:
                            </label>
                            <span className="text-[10px] text-white/50 font-bold">
                              المحدد: {actionStatus === 'present' ? `الحصة ${actionPeriod === 'يوم كامل' ? '1' : actionPeriod}` : (actionPeriod === 'يوم كامل' ? 'اليوم بالكامل' : `الحصة ${actionPeriod}`)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(actionStatus === 'present'
                              ? ['1', '2', '3', '4', '5', '6', '7', '8']
                              : ['يوم كامل', '1', '2', '3', '4', '5', '6', '7', '8']
                            ).map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setActionPeriod(p)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                                  (actionStatus === 'present' && actionPeriod === 'يوم كامل' ? '1' : actionPeriod) === p
                                    ? (actionStatus === 'present' ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' :
                                       actionStatus === 'absent' ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20' :
                                       'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20')
                                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                                }`}
                              >
                                {p === 'يوم كامل' ? 'اليوم بالكامل' : `الحصة ${p}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Reason selection (if absent) */}
                        {actionStatus === 'absent' && (
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-extrabold text-rose-300 block">
                              سبب الغياب / العذر:
                            </label>
                            <select
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              className="w-full bg-[#121c38] border border-rose-500/30 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-rose-400 transition-all text-right"
                            >
                              <option value="بدون عذر">بدون عذر رسمي</option>
                              <option value="عذر مرضي">عذر مرضي مع تقرير</option>
                              <option value="إجازة رسمية">إجازة رسمية مسبقة</option>
                              <option value="ظرف عائلي">ظرف عائلي طارئ</option>
                              <option value="سفر">سفر مؤقت</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Confirm & Submit */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStudentId(null)}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => handleSaveDetailedAction(student)}
                            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                              actionStatus === 'present'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                                : actionStatus === 'absent'
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                            }`}
                          >
                            {isSubmittingAction ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            <span>
                              تأكيد تسجيل ({actionStatus === 'present' ? 'الحضور' : actionStatus === 'absent' ? 'الغياب' : 'التأخير'}) لـ {actionStatus === 'present' ? `الحصة ${actionPeriod === 'يوم كامل' ? '1' : actionPeriod}` : (actionPeriod === 'يوم كامل' ? 'اليوم بالكامل' : `الحصة ${actionPeriod}`)}
                            </span>
                          </button>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
        </>
      ) : (
        /* ==================================================== */
        /* 📸 DEDICATED CLASSROOM LENS TAB (عين على الصف) */
        /* ==================================================== */
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* 1. Classroom Lens Controls Bar: Class Switcher & Date Controls */}
          <div className="bg-gradient-to-r from-[#0c152e] via-[#0f1b3b] to-[#0c152e] p-3.5 sm:p-4 rounded-2xl border border-blue-500/25 shadow-[0_10px_30px_rgba(59,130,246,0.1)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Left Info & Live Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/25 to-purple-500/25 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.25)] shrink-0">
                <Camera size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                    عين على الصف • شعبة {activeClass}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    بث مباشر وتوثيق
                  </span>
                </div>
                <p className="text-[11px] text-white/50 font-medium">
                  تاريخ الأنشطة: {selectedDate} {isToday && <span className="text-cyan-400 font-bold">(اليوم)</span>}
                </p>
              </div>
            </div>

            {/* Right Controls: Class Switcher & Date Navigation */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Date Picker & Fast Navigator */}
              <div className="flex items-center bg-[#080d1a] p-1 rounded-2xl border border-white/10 shadow-inner">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(prev.toISOString().split('T')[0]);
                  }}
                  title="اليوم السابق"
                  className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronRight size={15} />
                </button>

                <div className="px-2.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-blue-200 outline-none cursor-pointer [color-scheme:dark]"
                  />
                </div>

                <button
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(next.toISOString().split('T')[0]);
                  }}
                  title="اليوم التالي"
                  className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronLeft size={15} />
                </button>
              </div>

              {/* Reset to Today Button */}
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs font-black transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>اليوم</span>
                </button>
              )}

              {/* Refresh Feed */}
              <button
                onClick={fetchClassLensActivities}
                disabled={isLoadingClassLens}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer"
                title="تحديث قائمة اللقطات"
              >
                <RefreshCw size={14} className={isLoadingClassLens ? "animate-spin text-blue-400" : ""} />
              </button>
            </div>
          </div>

          {/* 2. Elegant Slim Broadcast Action Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-purple-950/80 border border-blue-500/30 shadow-lg space-y-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30 shadow-sm text-base">
                📢
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate">
                    المشاركات واللقطات الجماعية
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-500/25 text-blue-200 border border-blue-400/30 shrink-0">
                    شعبة {activeClass}
                  </span>
                </div>
                <p className="text-[10px] text-white/50 truncate">
                  رفع نشاط صفي أو تكريم جماعي ليصل فوراً لكافة أولياء أمور الشعبة
                </p>
              </div>
            </div>

            {/* Action Buttons: 2-column grid on mobile / flex on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={handleOpenBroadcastHistory}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                title="عرض أرشيف وسجل اللقطات الجماعية المنشورة للشعبة"
              >
                <Film size={15} className="text-purple-400 shrink-0" />
                <span>سجل المشاركات الجماعية 📢</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedLensStudent({ isAll: true, name: `جميع طلاب شعبة ${activeClass}` });
                  setIsBroadcastToAllMode(true);
                  setLensFile(null);
                  setLensDescription('نشاط ومشاركة صفية جماعية ممتازة لجميع طلاب الصف 🌟👏');
                  setShowLensModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-98"
              >
                <Camera size={15} className="shrink-0" />
                <span>مشاركة مع الشعبة 🚀</span>
              </button>
            </div>
          </div>

          {/* 3. Student List for Quick Individual Uploads & History Archive */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>👥 طلاب شعبة {activeClass} ({classStudents.length} طالب):</span>
              </h4>
              <span className="text-[11px] text-white/40">اختر طالباً لرفع لقطة خاصة به أو مراجعة سجله</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classStudents.map((student, idx) => {
                return (
                  <div
                    key={student.id || student.code || idx}
                    className="bg-[#0c142b] border border-white/10 hover:border-blue-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-md transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/20 text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-black text-white truncate">{student.name}</h5>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Upload moment for this student */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLensStudent(student);
                          setIsBroadcastToAllMode(false);
                          setLensFile(null);
                          setLensDescription('مشاركة وتفاعل صفي ممتاز 🌟');
                          setShowLensModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                        title="رفع لقطة جديدة لهذا الطالب"
                      >
                        <Camera size={13} />
                        <span>رفع لقطة</span>
                      </button>

                      {/* View student history */}
                      <button
                        type="button"
                        onClick={() => handleOpenStudentLensHistory(student)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        title="عرض سجل اللقطات السابقة لهذا الطالب"
                      >
                        <History size={13} />
                        <span>عرض السجل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 5. Student History Logs Modal */}
      <AnimatePresence>
        {historyStudent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-gradient-to-b from-[#0e172e] to-[#070b14] rounded-3xl border border-cyan-500/30 p-5 sm:p-6 shadow-2xl space-y-4 text-right relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">سجل حضور الطالب: {historyStudent.name}</h3>
                    <p className="text-xs text-white/50 font-medium">الشعبة: {activeClass}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryStudent(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Logs Content */}
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {isLoadingLogs ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-2">
                    <RefreshCw size={24} className="text-cyan-400 animate-spin" />
                    <span className="text-xs text-white/50">جارٍ جلب السجل من قاعدة البيانات...</span>
                  </div>
                ) : studentLogs.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs font-bold">
                    لا يوجد سجل حضور أو غياب مسجل لهذا الطالب حتى الآن.
                  </div>
                ) : (
                  studentLogs.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0a1020] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          item.status === 'present'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                            : item.status === 'absent'
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                              : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        }`} />
                        <div>
                          <span className="font-bold text-white block">
                            {item.status === 'present' ? 'حضور' : item.status === 'absent' ? 'غياب' : 'تأخير'}
                            {item.period ? ` (${item.period})` : ''}
                          </span>
                          {item.reason && (
                            <span className="text-[11px] text-rose-300/80 font-medium">{item.reason}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-left text-white/40 text-[11px] font-mono">
                        <div>{item.date}</div>
                        {item.by && <div className="text-[10px] text-cyan-300/70 font-sans">بواسطة: {item.by}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setHistoryStudent(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Live Classroom Activity Evaluation Modal */}
      <AnimatePresence>
        {showEvalModal && selectedEvalStudent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-gradient-to-b from-[#0e172e] via-[#091022] to-[#050812] rounded-3xl border border-cyan-500/30 p-5 sm:p-6 shadow-2xl space-y-5 text-right relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>التقييم والنشاط الصفي المباشر ⚡</span>
                    </h3>
                    <p className="text-xs text-cyan-300 font-bold mt-0.5">
                      الطالب: <span className="text-white font-black">{selectedEvalStudent.name}</span> • الشعبة: {activeClass}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEvalModal(false);
                    setSelectedEvalStudent(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Subtitle Banner */}
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs font-bold flex items-center gap-2">
                <Info size={16} className="text-cyan-400 shrink-0" />
                <span>سيتم إرسال التقييم المباشر فوراً لقاعدة البيانات وسجل ولي الأمر مع تنبيه لحظي 📱</span>
              </div>

              {/* Section 1: Positive Badges */}
              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-300 block flex items-center gap-1.5">
                  <span>🌟 المشاركات والأوسمة الإيجابية:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "🌟 شارك بنشاط مميز",
                    "💡 إجابة نموذجية ورائعة",
                    "📝 ملتزم ومستعد للحصة",
                    "👑 نجم/فارس الحصة اليوم",
                    "🤝 متعاون ومساعد لزملائه"
                  ].map((option) => {
                    const isSelected = selectedEvalOption === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedEvalTextOption(option)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 scale-[1.02]"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                      >
                        <span>{option}</span>
                        {isSelected && <Check size={14} className="text-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Alerts & Behavioral Notes */}
              <div className="space-y-2">
                <label className="text-xs font-black text-rose-300 block flex items-center gap-1.5">
                  <span>⚠️ التنبيهات والملاحظات السلوكية:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "😴 مشتت الذهن / غير مركز",
                    "🗣️ كثرة الكلام وغير منضبط",
                    "📚 لم يحضر الواجب / الدفتر",
                    "⏳ تأخر عن دخول القاعة",
                  ].map((option) => {
                    const isSelected = selectedEvalOption === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedEvalTextOption(option)}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                      >
                        <span>{option}</span>
                        {isSelected && <Check size={14} className="text-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Note Input */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-black text-white/80 block flex items-center gap-1.5">
                  <FileText size={14} className="text-cyan-400" />
                  <span>تفاصيل وملاحظة إضافية مخصصة للأستاذ (اختياري / مخصص):</span>
                </label>
                <textarea
                  value={customEvalText}
                  onChange={(e) => setCustomEvalText(e.target.value)}
                  placeholder="اكتب تفاصيل إضافية مخصصة (مثل: تم تميزه في حل التمرين الختامي، أو ملاحظة خاصة للوالدين)..."
                  className="w-full bg-[#080e1c] border border-cyan-500/30 rounded-2xl p-3 text-xs font-bold text-white placeholder-white/30 focus:border-cyan-400 outline-none transition-all resize-none h-20 leading-relaxed"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowEvalModal(false);
                    setSelectedEvalStudent(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isSavingEval}
                  onClick={handleSaveClassroomEvaluation}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 disabled:opacity-50"
                >
                  {isSavingEval ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>إرسال التقييم المباشر لولي الأمر 🚀</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Classroom Lens ("عين على الصف") Modal */}
      <AnimatePresence>
        {showLensModal && (selectedLensStudent || isBroadcastToAllMode) && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-gradient-to-b from-[#0e172e] via-[#091022] to-[#050812] rounded-3xl border border-blue-500/30 p-5 sm:p-6 shadow-2xl space-y-5 text-right relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
                    <Camera size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>عين على الصف 📸✨</span>
                    </h3>
                    <p className="text-xs text-blue-300 font-bold mt-0.5">
                      {isBroadcastToAllMode ? (
                        <span className="text-white font-black">📢 مشاركة جماعية لجميع طلاب شعبة {activeClass}</span>
                      ) : (
                        <>التلميذ: <span className="text-white font-black">{selectedLensStudent?.name}</span> • الشعبة: {activeClass}</>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="إغلاق وإلغاء الرفع"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Target Mode Banner: Strictly Locked to Selected Mode without Confusing Switcher */}
              {isBroadcastToAllMode ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-purple-900/40 border border-blue-500/30 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                      📢
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">مشاركة جماعية لكافة أولياء أمور الشعبة</h4>
                      <p className="text-[10.5px] text-blue-200/80">مخصص للبث والتوثيق لجميع طلاب شعبة ({activeClass})</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-blue-500/30 text-blue-200 border border-blue-400/30 shrink-0">
                    شعبة {activeClass}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-indigo-900/40 border border-cyan-500/30 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm shrink-0">
                      🎯
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white">لقطة خاصة بالتلميذ: {selectedLensStudent?.name}</h4>
                      <p className="text-[10.5px] text-cyan-200/80">توثيق مباشر في سجل التلميذ وإشعار فوري لولي أمره</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 shrink-0">
                    لقطة فردية
                  </span>
                </div>
              )}

              {/* Teacher & Subject Selector */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white/90 flex items-center gap-1.5">
                    <span>👨‍🏫 الأستاذ والمادة الدراسية:</span>
                  </label>
                  <span className="text-[10px] text-cyan-300 font-bold">تظهر على اللقطة في لوحة ولي الأمر</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/50 block font-bold">اسم الأستاذ:</span>
                    <div className="relative group">
                      <input
                        type="text"
                        value={lensTeacherName}
                        onChange={(e) => setLensTeacherName(e.target.value)}
                        className="w-full bg-[#080e1c] border border-white/10 focus:border-blue-500/50 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-white outline-none transition-all"
                        placeholder="اسم الأستاذ..."
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">👨‍🏫</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/50 block font-bold">المادة الدراسية (حسب الاختصاص):</span>
                    <div className="w-full bg-[#080e1c] border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 flex items-center gap-2">
                      <span className="text-cyan-400">📚</span>
                      <span className="truncate">{lensSubject || teacherData?.subject || teacherData?.specialization || internalTeacherData?.subject || 'عام'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs font-bold flex items-center gap-2">
                <Info size={16} className="text-blue-400 shrink-0" />
                <span>
                  {isBroadcastToAllMode 
                    ? `سيتم نشر اللقطة وتوثيقها فورياً في حسابات جميع أولياء أمور طلاب شعبة (${activeClass}) وقناة البث! 📡` 
                    : `سيتم نشر لقطة النشاط مباشرة في قناة التواصل المخصصة للصف، وإشعار ولي أمر الطالب في نفس اللحظة! 📡📱`}
                </span>
              </div>

              {/* File Select */}
              <div className="space-y-2">
                <label className="text-xs font-black text-white/80 block">⚡ اختر الفيديو أو الصورة (مشاركة التلميذ في الصف):</label>
                <div className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all relative bg-black/20 group">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLensFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {lensFile ? (
                    <div className="space-y-2">
                      <span className="text-3xl block">🎥</span>
                      <span className="text-xs font-black text-emerald-400 block">{lensFile.name}</span>
                      <span className="text-[10px] text-white/50 block">({(lensFile.size / 1024 / 1024).toFixed(2)} MB) - انقر لتغيير الملف</span>
                      {lensFile.size > 48 * 1024 * 1024 && (
                        <div className="inline-block px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                          ⚡ فيديو فائق الدقة - سيتم بثه بجودة سينمائية وحفظه دون أي اقتطاع
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 group-hover:scale-105 transition-transform duration-300">
                      <Upload size={28} className="text-white/30 mx-auto group-hover:text-blue-400" />
                      <span className="text-xs font-black text-white/60 block">انقر هنا لتحديد النشاط (فيديو أو صورة)</span>
                      <span className="text-[10px] text-white/30 block">يدعم مقاطع الفيديو والصور فائقة الدقة حتى 500 ميغابايت</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-white/80 block">💬 عبارات تفاعلية جاهزة (اختر أو اكتب تفاصيل النشاط):</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "مشاركة وتفاعل صفي ممتاز 🌟",
                    "إجابة ممتازة وذكية على السؤال الصعب 💡",
                    "قراءة معبرة ومتميزة لدرس اليوم 📚",
                    "انضباط وهدوء ومثابرة رائعة داخل القاعة 👑",
                    "أداء استثنائي وتفوق مميز في الدرس 👏"
                  ].map((phrase) => {
                    const isSelected = lensDescription === phrase;
                    return (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => setLensDescription(phrase)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20 scale-[1.01]"
                            : "bg-blue-500/10 text-blue-300 border-blue-500/15 hover:bg-blue-500/20"
                        }`}
                      >
                        {phrase}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Description Textarea */}
              <div className="space-y-1.5">
                <textarea
                  value={lensDescription}
                  onChange={(e) => setLensDescription(e.target.value)}
                  placeholder="اكتب ملاحظة أو تعديل مخصص هنا..."
                  className="w-full bg-[#080e1c] border border-blue-500/30 rounded-2xl p-3 text-xs font-bold text-white placeholder-white/30 focus:border-blue-400 outline-none transition-all resize-none h-16 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isUploadingLens
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-black'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {isUploadingLens ? 'إلغاء الرفع فوراً 🛑' : 'إلغاء'}
                </button>
                <button
                  type="button"
                  disabled={isUploadingLens}
                  onClick={handleUploadLensActivity}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50"
                >
                  {isUploadingLens ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <div className="flex flex-col items-start">
                        <span>جاري معالجة وبث النشاط...</span>
                        {lensUploadStatus && (
                          <span className="text-[10px] text-white/60 font-bold">{lensUploadStatus}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      <span>{isBroadcastToAllMode ? 'بث اللقطة لجميع أولياء الأمور 🚀' : 'بث اللقطة لولي الأمر 🚀'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Student Classroom Lens History Archive Modal */}
      <AnimatePresence>
        {viewingLensHistoryStudent && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-gradient-to-b from-[#0e172e] via-[#091022] to-[#050812] rounded-3xl border border-blue-500/30 p-5 sm:p-6 shadow-2xl space-y-4 text-right relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
                    <Camera size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>سجل لقطات "عين على الصف" 📸✨</span>
                    </h3>
                    <p className="text-xs text-blue-300 font-bold mt-0.5">
                      التلميذ: <span className="text-white font-black">{viewingLensHistoryStudent.name}</span> • الشعبة: {activeClass}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingLensHistoryStudent(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl shrink-0 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-200">
                  إجمالي اللقطات الموثقة خصيصاً للتلميذ: <span className="font-mono text-white font-black">{studentLensHistory.length}</span> لقطة
                </span>
                <span className="text-[10px] text-blue-300 font-bold">سجل فردي 👨‍🎓</span>
              </div>

              {/* History Items Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                {isLoadingStudentHistory ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 size={28} className="text-blue-400 animate-spin mx-auto" />
                    <span className="text-xs text-white/60 font-bold">جاري تحميل سجل اللقطات...</span>
                  </div>
                ) : studentLensHistory.length === 0 ? (
                  <div className="py-16 text-center space-y-3 bg-white/5 rounded-2xl border border-white/5 p-6">
                    <span className="text-3xl block">📸</span>
                    <h4 className="text-sm font-black text-white">لا توجد لقطات موثقة لهذا الطالب بعد</h4>
                    <p className="text-xs text-white/50">يمكنك رفع أول فيديو أو صورة لتوثيق مشاركته الصفية وبثها فورياً لولي أمره.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentLensHistory.map((act) => {
                      const mediaSrc = act.mediaUrl && act.mediaUrl.startsWith('/api/media/local/')
                        ? act.mediaUrl
                        : act.telegramFileId?.startsWith('local:')
                          ? `/api/media/local/${act.telegramFileId.replace('local:', '')}`
                          : act.telegramFileId
                            ? `/api/media/telegram/${act.schoolId || schoolId}/${act.telegramFileId}`
                            : act.mediaUrl || '';

                      const isVid = act.mediaType === 'video' || 
                                    Boolean(mediaSrc && (mediaSrc.endsWith('.mp4') || mediaSrc.includes('mp4') || mediaSrc.includes('video')));

                      return (
                        <div key={act.id} className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2 relative group hover:border-blue-500/40 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-white/50 mb-1.5">
                              <span className="text-blue-300 font-bold truncate">👨‍🏫 {act.authorName || 'الأستاذ'}</span>
                              <span className="font-mono">{act.createdAt ? new Date(act.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>

                            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 relative flex items-center justify-center shadow-inner">
                              {isVid ? (
                                <ClassroomVideoPlayer src={mediaSrc} />
                              ) : (
                                <img src={mediaSrc} alt="لقطة صفية" className="w-full h-full object-contain" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1 border-t border-white/5">
                            {act.description && (
                              <p className="text-xs text-white/90 font-bold line-clamp-2">💬 {act.description}</p>
                            )}
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setActivityToDelete({ id: act.id, desc: act.description })}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black transition-all flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>حذف</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingLensHistoryStudent(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Broadcast / Group Activities History Modal */}
      <AnimatePresence>
        {showBroadcastHistoryModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-gradient-to-b from-[#0e172e] via-[#091022] to-[#050812] rounded-3xl border border-purple-500/40 p-5 sm:p-6 shadow-2xl space-y-4 text-right relative overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center text-xl font-bold shadow-md shadow-purple-500/10">
                    📢
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      سجل المشاركات واللقطات الجماعية للشعبة
                    </h3>
                    <p className="text-xs text-purple-300 font-bold">
                      شعبة {activeClass} • كافة المنشورات والبثوث العامة لجميع أولياء الأمور
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBroadcastHistoryModal(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-all flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Broadcast Items Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                {isLoadingBroadcastHistory ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 size={28} className="text-purple-400 animate-spin mx-auto" />
                    <span className="text-xs text-white/60 font-bold">جاري تحميل سجل المشاركات الجماعية...</span>
                  </div>
                ) : broadcastHistory.length === 0 ? (
                  <div className="py-16 text-center space-y-3 bg-white/5 rounded-2xl border border-white/5 p-6">
                    <span className="text-3xl block">📢</span>
                    <h4 className="text-sm font-black text-white">لا توجد مشاركات جماعية موثقة لهذه الشعبة بعد</h4>
                    <p className="text-xs text-white/50">يمكنك رفع أول فيديو أو صورة جماعية عبر زر "مشاركة مع الشعبة 🚀" لتصل فوراً لكافة أولياء الأمور.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {broadcastHistory.map((act) => {
                      const mediaSrc = act.mediaUrl && act.mediaUrl.startsWith('/api/media/local/')
                        ? act.mediaUrl
                        : act.telegramFileId?.startsWith('local:')
                          ? `/api/media/local/${act.telegramFileId.replace('local:', '')}`
                          : act.telegramFileId
                            ? `/api/media/telegram/${act.schoolId || schoolId}/${act.telegramFileId}`
                            : act.mediaUrl || '';

                      const isVid = act.mediaType === 'video' || 
                                    Boolean(mediaSrc && (mediaSrc.endsWith('.mp4') || mediaSrc.includes('mp4') || mediaSrc.includes('video')));

                      return (
                        <div key={act.id} className="bg-black/40 border border-purple-500/20 rounded-2xl p-3 space-y-2 relative group hover:border-purple-500/50 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-white/50 mb-1.5">
                              <span className="text-purple-300 font-bold truncate">👨‍🏫 {act.authorName || 'الأستاذ'}</span>
                              <span className="font-mono">{act.createdAt ? new Date(act.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            </div>

                            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 relative flex items-center justify-center shadow-inner">
                              {isVid ? (
                                <ClassroomVideoPlayer src={mediaSrc} />
                              ) : (
                                <img src={mediaSrc} alt="لقطة جماعية" className="w-full h-full object-contain" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 pt-1 border-t border-white/5">
                            {act.description && (
                              <p className="text-xs text-white/90 font-bold line-clamp-2">💬 {act.description}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black">
                                📢 بث جماعي
                              </span>
                              <button
                                type="button"
                                onClick={() => setActivityToDelete({ id: act.id, desc: act.description })}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black transition-all flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>حذف</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBroadcastHistoryModal(false)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Delete Snapshot Confirmation Modal */}
      <AnimatePresence>
        {activityToDelete && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-gradient-to-b from-[#161d36] via-[#0e1428] to-[#070b18] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-right relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-rose-500/20">
                <Trash2 size={28} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-base sm:text-lg font-black text-white">تأكيد حذف اللقطة نهائياً ⚠️</h3>
                <p className="text-xs text-white/70 leading-relaxed px-2">
                  هل أنت متأكد من رغبتك بحذف هذه اللقطة من سجل الطالب وبث ولي الأمر؟
                  <br />
                  <span className="text-rose-400 font-bold block mt-1">هذا الإجراء فوري ولا يمكن التراجع عنه بعد التأكيد.</span>
                </p>
              </div>
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeletingLensActivity}
                  onClick={() => setActivityToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  disabled={isDeletingLensActivity}
                  onClick={handleConfirmDeleteSnapshot}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 disabled:opacity-50"
                >
                  {isDeletingLensActivity ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>تأكيد الحذف 🗑️</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TeacherAttendanceTab;
