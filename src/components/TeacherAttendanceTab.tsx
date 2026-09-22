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
  X
} from 'lucide-react';
import { academicService, SchoolStudent, AcademicList } from '../services/academicService';
import { staffService } from '../services/staffService';
import { safeStorage } from '../lib/storage';
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
      setAllStudents(initialStudents);
    }
  }, [initialStudents]);

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
    return classStudents.map(student => {
      const logs = ((student as any).attendance?.logs || []) as any[];
      const dayLog = logs.find((l: any) => l.date === selectedDate);
      const status: 'present' | 'absent' | 'late' | 'unrecorded' = dayLog ? dayLog.status : 'unrecorded';
      return {
        ...student,
        dayStatus: status,
        dayLog: dayLog || null
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

  // Handler: 1-Click Status Update (Instant Real-time Sync with Backend)
  const handleQuickStatus = async (student: any, status: 'present' | 'absent' | 'late') => {
    const teacherName = teacherData?.name || 'الأستاذ';
    setIsSyncing(true);

    try {
      await academicService.updateAttendance(
        student.id,
        (student as any).userId || student.code || student.id,
        status,
        teacherName,
        status === 'present' ? '' : 'بدون عذر',
        'يوم كامل',
        schoolId,
        selectedDate
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
    setIsSubmittingAction(true);

    try {
      await academicService.updateAttendance(
        student.id,
        (student as any).userId || student.code || student.id,
        actionStatus,
        teacherName,
        actionStatus === 'present' ? '' : actionReason,
        actionPeriod,
        schoolId,
        selectedDate
      );

      showToast(`تم تثبيت ${actionStatus === 'present' ? 'حضور' : actionStatus === 'absent' ? 'غياب' : 'تأخير'} للطالب (${actionPeriod})`, 'success');
      setEditingStudentId(null);
    } catch (err: any) {
      console.error('Detailed attendance update error:', err);
      showToast('حدث خطأ أثناء حفظ تفاصيل الحضور', 'error');
    } finally {
      setIsSubmittingAction(false);
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

    try {
      for (const st of unrecordedStudents) {
        await academicService.updateAttendance(
          st.id,
          (st as any).userId || st.code || st.id,
          'present',
          teacherName,
          '',
          'يوم كامل',
          schoolId,
          selectedDate
        );
      }
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
    <div className="w-full flex-1 flex flex-col min-h-0 bg-[#070b14] text-white p-3 sm:p-5 md:p-6 space-y-4 overflow-y-auto" dir="rtl">
      
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

          {/* Print Sheet Button */}
          <button
            onClick={handlePrintAttendanceReport}
            className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
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
            const isEditing = editingStudentId === student.id;
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
                        <span>كود الطالب: <strong className="text-white/70 font-mono">{student.code || student.id}</strong></span>
                        <span>•</span>
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
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    
                    {/* 1. Present Button */}
                    <button
                      onClick={() => handleQuickStatus(student, 'present')}
                      className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
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
                          setEditingStudentId(student.id);
                          setActionStatus('absent');
                          setActionPeriod('يوم كامل');
                          setActionReason('بدون عذر');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
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
                          setEditingStudentId(student.id);
                          setActionStatus('late');
                          setActionPeriod('1');
                          setActionReason('');
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        dayStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                          : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                      }`}
                    >
                      <Clock size={14} />
                      <span>تأخير</span>
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
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-cyan-300 block">
                            تحديد وقت / الحصة الدراسية:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['يوم كامل', '1', '2', '3', '4', '5', '6', '7', '8'].map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setActionPeriod(p)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                                  actionPeriod === p
                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
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
                      <div className="flex items-center justify-end gap-2">
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
                            actionStatus === 'absent'
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
                          }`}
                        >
                          {isSubmittingAction ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          <span>تأكيد تسجيل ({actionStatus === 'absent' ? 'الغياب' : 'التأخير'}) لـ {actionPeriod}</span>
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
                    <p className="text-xs text-white/50 font-medium">الشعبة: {activeClass} • الكود: {historyStudent.code}</p>
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

    </div>
  );
};

export default TeacherAttendanceTab;
