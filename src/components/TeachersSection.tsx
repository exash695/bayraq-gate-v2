import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Trash2, 
  Edit2, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  ToggleLeft, 
  ToggleRight, 
  X, 
  User, 
  Search, 
  Filter, 
  MessageSquare, 
  Activity, 
  UserCog, 
  Megaphone, 
  Calculator, 
  Car, 
  Wrench, 
  Lock, 
  Users as UsersIcon, 
  QrCode, 
  Send, 
  RotateCcw,
  GraduationCap,
  Calendar,
  Check,
  CheckCircle2,
  Sparkles,
  School,
  KeyRound,
  ChevronDown,
  Layers,
  Camera,
  UploadCloud,
  ImageIcon,
  Printer
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { StaffPrintModal } from './StaffPrintModal';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from '@/src/lib/firebase';
import { db } from '../lib/firebase';
import { useSubjectDistributor } from '../hooks/useSubjectDistributor';
import { staffService } from '../services/staffService';
import { logActivity } from '../utils/auditLogger';
import { compressImage } from '../utils/imageCompressor';

import { getPrefixForGrade, getStageFromGrade, getSanitizedSubCode, SUBJECT_KEYWORDS, normalizeArabicText, normalizeGradeName, isArchivedList } from '../utils/studentUtils';
import { ScheduleManager } from './ScheduleManager';
import { copyToClipboard } from '../utils/clipboard';
import { subscribeMultiQuery } from '../utils/firestoreSubscriptions';
import { realtimeManager } from '../lib/realtimeManager';

interface Teacher {
  id: string;
  name: string;
  photo?: string;
  subject: string;
  role: 'TEACHER' | 'STAFF';
  bio: string;
  classes: string[];
  schedule: string[];
  canPublish: boolean;
  isActive: boolean;
  rating: number;
  adminNotes?: string;
  code?: string;
  classCodes?: Record<string, string>;
}

const getRoleIcon = (role: string, type: 'TEACHER' | 'STAFF', size = 24) => {
  if (type === 'TEACHER') return <BookOpen size={size} />;
  
  switch (role) {
    case 'مدير': return <ShieldCheck size={size} />;
    case 'محاسب': return <Calculator size={size} />;
    case 'معاون': return <UsersIcon size={size} />;
    case 'إعلامي': return <Megaphone size={size} />;
    case 'علاقات عامة': return <MessageSquare size={size} />;
    case 'موظف خدمة': return <Wrench size={size} />;
    case 'سائق': return <Car size={size} />;
    case 'حارس أمني': return <Lock size={size} />;
    default: return <UserCog size={size} />;
  }
};

// ... existing code ...

interface TeachersSectionProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
  schoolId: string | null;
  schoolName: string;
  onSubViewChange?: (isOpen: boolean) => void;
  savedLists?: any[];
}

export const TeachersSection: React.FC<TeachersSectionProps> = ({ showToast, schoolId, schoolName, onSubViewChange, savedLists = [] }) => {
  const { getAllSubjects } = useSubjectDistributor();
  const [teachers, setTeachers] = useState<Teacher[]>(() => staffService.getCachedTeachers(schoolId || undefined) as Teacher[]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedStageForForm, setSelectedStageForForm] = useState<string | null>(null);
  const [selectedGradeForForm, setSelectedGradeForForm] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    subject: '', 
    role: 'TEACHER' as 'TEACHER' | 'STAFF', 
    bio: '', 
    classes: [] as string[], 
    schedule: [] as string[],
    code: '',
    photo: ''
  });
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'staff' | 'schedule'>('teachers');
  const [confirmDelete, setConfirmDelete] = useState<Teacher | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(isAdding || !!editingTeacher || !!selectedTeacher || !!confirmDelete);
    }
    return () => {
      if (onSubViewChange) {
        onSubViewChange(false);
      }
    };
  }, [isAdding, editingTeacher, selectedTeacher, confirmDelete, onSubViewChange]);
  
  useEffect(() => {
    setFilterSubject('');
    setFilterClass('');
    setSearch('');
  }, [activeSubTab]);

  const STAGE_GROUPS = [
    {
      id: 'primary',
      name: 'المرحلة الابتدائية',
      icon: '🎒',
      classes: ['الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي']
    },
    {
      id: 'middle',
      name: 'المرحلة المتوسطة',
      icon: '📘',
      classes: ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط']
    },
    {
      id: 'preparatory',
      name: 'المرحلة الإعدادية / الثانوية',
      icon: '🎓',
      classes: ['الرابع علمي', 'الرابع أدبي', 'الخامس علمي', 'الخامس أدبي', 'السادس علمي', 'السادس أدبي']
    }
  ];

  const CLASSES = [
    'الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي',
    'الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط',
    'الرابع علمي', 'الرابع أدبي', 'الخامس علمي', 'الخامس أدبي', 'السادس علمي', 'السادس أدبي'
  ];

  const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

  const CORE_SUBJECTS = [
    'الرياضيات', 'اللغة العربية', 'اللغة الإنجليزية', 'العلوم', 
    'الفيزياء', 'الكيمياء', 'الأحياء', 'الاجتماعيات', 
    'التربية الإسلامية', 'الحاسوب', 'اللغة الفرنسية', 'التربية الفنية', 
    'التربية الرياضية', 'الجغرافية', 'التاريخ', 'الاقتصاد'
  ];
  const SUBJECTS = Array.from(new Set([...CORE_SUBJECTS, ...getAllSubjects()])).filter(Boolean);
  const STAFF_ROLES = [
    'مدير',
    'معاون',
    'محاسب',
    'مرشد تربوي',
    'أمين مكتبة',
    'مشرف مختبر',
    'إعلامي',
    'علاقات عامة',
    'موظف خدمة',
    'سائق',
    'حارس أمني',
    'مساعد إداري'
  ];

  const isGradeMatch = (g1: string, g2: string, listName?: string) => {
    if (!g1 && !listName) return false;
    const n1 = normalizeGradeName(g1 || '');
    const n2 = normalizeGradeName(g2 || '');
    if (n1 && n2 && n1 === n2) return true;
    
    const norm1 = normalizeArabicText(g1 || '');
    const norm2 = normalizeArabicText(g2 || '');
    if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) return true;

    if (listName) {
      const normListName = normalizeArabicText(listName);
      if (norm2 && (normListName.includes(norm2) || normListName.includes(normalizeArabicText(n2)))) return true;
    }
    return false;
  };

  const getListsForGrade = (gradeName: string) => {
    if (!gradeName) return [];
    const gNorm = normalizeArabicText(gradeName);
    const gNameNorm = normalizeGradeName(gradeName);
    
    return (savedLists || []).filter(l => {
      // Filter out archived lists
      if (isArchivedList(l)) return false;

      const listGrade = l.students?.[0]?.grade || '';
      const lGradeNorm = normalizeArabicText(listGrade);
      const lGradeNameNorm = normalizeGradeName(listGrade);
      const lNameNorm = normalizeArabicText(l.name || '');
      const lNameGradeNorm = normalizeGradeName(l.name || '');
      
      return (
        (lGradeNorm && lGradeNorm === gNorm) ||
        (lGradeNameNorm && lGradeNameNorm === gNameNorm) ||
        (lNameGradeNorm && lNameGradeNorm === gNameNorm) ||
        (lNameNorm && gNorm && (lNameNorm === gNorm || lNameNorm.includes(gNorm) || gNorm.includes(lNameNorm))) ||
        (gNameNorm && lNameNorm.includes(normalizeArabicText(gNameNorm)))
      );
    });
  };

  const getTeacherSections = (teacher: Teacher | any): string[] => {
    if (!teacher) return [];
    const rawClasses = Array.isArray(teacher.classes) ? teacher.classes : [];
    if (rawClasses.length > 0) {
      const result: string[] = [];
      rawClasses.forEach((c: string) => {
        if (!c || isArchivedList(c)) return;
        const specificList = (savedLists || []).find(l => (l.name === c || l.name === c.split(' - ').pop()) && !isArchivedList(l));
        const nameToUse = specificList ? specificList.name : c;
        if (!result.includes(nameToUse)) {
          result.push(nameToUse);
        }
      });
      return result.filter(item => !isArchivedList(item));
    }

    if (teacher.classCodes && typeof teacher.classCodes === 'object') {
      const keys = Object.keys(teacher.classCodes).filter(k => k && k !== 'default' && k !== 'master' && !isArchivedList(k));
      if (keys.length > 0) return keys;
    }

    if (teacher.grade && typeof teacher.grade === 'string' && !isArchivedList(teacher.grade)) {
      return [teacher.grade];
    }

    return [];
  };

  // Helper to check if a class or section is currently selected in form
  const isSectionSelected = (targetSection: string, classesList: string[] = []): boolean => {
    if (!targetSection || !classesList || classesList.length === 0) return false;
    if (classesList.includes(targetSection)) return true;

    const normTarget = normalizeArabicText(targetSection);
    return classesList.some(c => {
      if (!c) return false;
      if (c === targetSection) return true;
      const normC = normalizeArabicText(c);
      if (normC === normTarget) return true;
      if ((normC.includes(normTarget) || normTarget.includes(normC)) && isGradeMatch(c, targetSection, targetSection)) {
        return true;
      }
      return false;
    });
  };

  // Helper to toggle a class/section in formData.classes
  const toggleSection = (targetSection: string) => {
    const current = formData.classes || [];
    const isSelected = isSectionSelected(targetSection, current);
    
    if (isSelected) {
      // Remove all matching variants
      const normTarget = normalizeArabicText(targetSection);
      const filtered = current.filter(c => {
        if (!c) return false;
        if (c === targetSection) return false;
        const normC = normalizeArabicText(c);
        if (normC === normTarget) return false;
        if ((normC.includes(normTarget) || normTarget.includes(normC)) && isGradeMatch(c, targetSection, targetSection)) {
          return false;
        }
        return true;
      });
      setFormData({ ...formData, classes: filtered });
    } else {
      // Add canonical targetSection
      if (!current.includes(targetSection)) {
        setFormData({ ...formData, classes: [...current, targetSection] });
      }
    }
  };

  // Helper to remove an exact section from formData.classes
  const removeSection = (targetSection: string) => {
    const current = formData.classes || [];
    const filtered = current.filter(c => c !== targetSection);
    setFormData({ ...formData, classes: filtered });
  };

  const handleUpdateNotes = async (teacher: Teacher, notes: string) => {
    try {
      await staffService.updateTeacher(teacher.id, { adminNotes: notes });
      setSelectedTeacher({ ...teacher, adminNotes: notes });
      setTeachers(teachers.map(t => t.id === teacher.id ? { ...t, adminNotes: notes } : t));

      logActivity({
        action: 'تحديث ملاحظات المدرس',
        details: `تم تحديث الملاحظات الإدارية للمدرس: ${teacher.name}`,
        targetId: teacher.id,
        targetType: 'teacher',
        targetName: teacher.name
      });
    } catch (err) {
      showToast('فشل تحديث الملاحظات', 'error');
    }
  };
  
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    if (selectedTeacher) {
      setTempNotes(selectedTeacher.adminNotes || '');
    }
  }, [selectedTeacher]);

  useEffect(() => {
    if (!schoolId && !schoolName) return;

    const unsub = staffService.subscribeToTeachers(schoolId || undefined, (data) => {
      setTeachers(data as Teacher[]);
    });

    const fetchTeachers = async () => {
      try {
        const data = await staffService.getTeachers(schoolId || undefined);
        setTeachers(data as Teacher[]);
      } catch (err) {
        console.warn("TeachersSection fetch error:", err);
      }
    };

    const unsubRealtime = realtimeManager.on('teachers_updated', fetchTeachers);

    return () => {
      unsub();
      unsubRealtime();
    };
  }, [schoolId, schoolName]);

  const handleOpenAdd = (type: 'TEACHER' | 'STAFF' = 'TEACHER') => {
    setEditingTeacher(null);
    setSelectedStageForForm('primary');
    setSelectedGradeForForm(null);
    setFormData({ name: '', subject: '', role: type, bio: '', classes: [], schedule: [], code: '', photo: '' });
    setIsAdding(true);
  };
  
  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    const resolvedSections = getTeacherSections(teacher);

    // Automatically detect and set the initial stage and grade for the form
    let initialStage: string = 'primary';
    let initialGrade: string | null = null;

    if (resolvedSections.length > 0) {
      const firstSection = resolvedSections[0];
      const detectedStage = getStageFromGrade(firstSection);
      if (detectedStage) initialStage = detectedStage;
      
      // Match with STAGE_GROUPS to open the right grade
      for (const stg of STAGE_GROUPS) {
        for (const grd of stg.classes) {
          if (isGradeMatch(grd, firstSection, firstSection)) {
            initialStage = stg.id;
            initialGrade = grd;
            break;
          }
        }
        if (initialGrade) break;
      }
    } else if (teacher.stage) {
      initialStage = teacher.stage;
    }

    setSelectedStageForForm(initialStage);
    setSelectedGradeForForm(initialGrade);

    setFormData({ 
      name: teacher.name || '', 
      subject: teacher.subject || '', 
      role: teacher.role || (Array.isArray(teacher.classes) && teacher.classes.length > 0 ? 'TEACHER' : 'STAFF'),
      bio: teacher.bio || '', 
      classes: resolvedSections, 
      schedule: teacher.schedule || [],
      code: teacher.code || '',
      photo: teacher.photo || ''
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const typeLabel = formData.role === 'TEACHER' ? 'مدرس' : 'موظف';
    
    // Derive stage and grade for teachers
    let derivedStage = '';
    let primaryGrade = '';
    
    const safeClasses = (formData.classes || []).filter(Boolean);
    const safeSchedule = formData.schedule || [];

    const finalClasses: string[] = [];
    safeClasses.forEach(c => {
      const trimmed = typeof c === 'string' ? c.trim() : '';
      if (!trimmed) return;
      const specificList = (savedLists || []).find(l => 
        l.name === trimmed || 
        normalizeArabicText(l.name) === normalizeArabicText(trimmed) ||
        l.name === trimmed.split(' - ').pop()
      );
      const resolvedName = specificList ? specificList.name : trimmed;
      if (!finalClasses.includes(resolvedName)) {
        finalClasses.push(resolvedName);
      }
    });

    if (formData.role === 'TEACHER' && finalClasses.length > 0) {
      derivedStage = getStageFromGrade(finalClasses[0]) || (selectedStageForForm || 'primary');
      primaryGrade = finalClasses[0];
    }

    // Build complete updated classCodes for every class in finalClasses
    const subCode = getSanitizedSubCode(formData.subject || editingTeacher?.subject || 'GEN');
    const existingClassCodes = (editingTeacher?.classCodes && typeof editingTeacher.classCodes === 'object') 
      ? { ...editingTeacher.classCodes } 
      : {};
    const finalClassCodes: Record<string, string> = {};

    finalClasses.forEach(cls => {
      let foundCode = existingClassCodes[cls];
      if (!foundCode) {
        const matchingKey = Object.keys(existingClassCodes).find(k => 
          normalizeArabicText(k) === normalizeArabicText(cls) || isGradeMatch(k, cls)
        );
        if (matchingKey) foundCode = existingClassCodes[matchingKey];
      }

      if (foundCode) {
        finalClassCodes[cls] = foundCode;
      } else {
        // Generate new unique code for the added class
        const prefix = getPrefixForGrade(cls);
        let randomNum: number;
        let isUnique = false;
        let code = '';
        do {
          randomNum = Math.floor(1000 + Math.random() * 9000);
          code = `TCH-${subCode}-${prefix}-${randomNum}`;
          isUnique = !teachers.some(t => 
            t.id !== (editingTeacher?.id || '') && (
              t.code === code || 
              (t.classCodes && Object.values(t.classCodes).includes(code))
            )
          );
        } while (!isUnique);
        finalClassCodes[cls] = code;
      }
    });

    // Master Unified Code
    let masterCode = formData.code || editingTeacher?.code;
    if (formData.role === 'TEACHER') {
      if (!masterCode || !masterCode.startsWith('TCH-')) {
        const primaryPrefix = finalClasses[0] ? getPrefixForGrade(finalClasses[0]) : 'GEN';
        let randomNum: number;
        let isUnique = false;
        do {
          randomNum = Math.floor(1000 + Math.random() * 9000);
          masterCode = `TCH-${subCode}-${primaryPrefix}-${randomNum}`;
          isUnique = !teachers.some(t => 
            t.id !== (editingTeacher?.id || '') && (
              t.code === masterCode || 
              (t.classCodes && Object.values(t.classCodes).includes(masterCode))
            )
          );
        } while (!isUnique);
      }
    } else {
      if (!masterCode) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        masterCode = `TCH-STAFF-${randomNum}`;
      }
    }

    const payload = {
      ...formData,
      code: masterCode,
      classes: finalClasses,
      classCodes: finalClassCodes,
      schedule: safeSchedule,
      stage: derivedStage,
      teacherStage: derivedStage,
      grade: primaryGrade,
      schoolId: schoolId,
      updatedAt: new Date()
    };

    try {
      if (editingTeacher) {
          await staffService.updateTeacher(editingTeacher.id, payload);
          setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, ...payload } : t));
          if (selectedTeacher?.id === editingTeacher.id) {
            setSelectedTeacher(prev => prev ? { ...prev, ...payload } : null);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('teachers_updated', { detail: { action: 'UPDATE', id: editingTeacher.id, data: payload } }));
          }
          logActivity({
            action: `تعديل بيانات ${typeLabel}`,
            details: `تم تعديل بيانات ال${typeLabel}: ${editingTeacher.name}`,
            targetId: editingTeacher.id,
            targetType: 'teacher',
            targetName: editingTeacher.name
          });
      } else {
          const res = await staffService.addTeacher({
            ...payload,
            canPublish: false,
            isActive: true,
            rating: 0
          });
          setTeachers(prev => [...prev, { ...payload, id: res.id, canPublish: false, isActive: true, rating: 0 } as any]);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('teachers_updated', { detail: { action: 'INSERT', id: res.id, data: payload } }));
          }
          logActivity({
            action: `إضافة ${typeLabel}`,
            details: `تم إضافة ${typeLabel} جديد: ${formData.name}`,
            targetId: res.id,
            targetType: 'teacher',
            targetName: formData.name
          });
      }
      setIsAdding(false);
      setEditingTeacher(null);
      setFormData({ name: '', subject: '', role: 'TEACHER', bio: '', classes: [], schedule: [], code: '', photo: '' });
      showToast('تم الحفظ وتحديث شُعب الأستاذ بنجاح', 'success');
    } catch (err) {
      showToast('فشل في عملية الحفظ', 'error');
    }
  };

  // Using imported copyToClipboard utility

  const handleGenerateTeacherCode = async (teacher: Teacher, targetClass?: string) => {
    const subCode = getSanitizedSubCode(teacher.subject);
    
    try {
      const resolvedSections = getTeacherSections(teacher);
      const effectiveClasses = resolvedSections.length > 0 ? resolvedSections : (teacher.classes || []);

      if (teacher.role === 'TEACHER' && effectiveClasses.length > 0) {
        const classCodes: Record<string, string> = {};
        for (const className of effectiveClasses) {
          if (teacher.classCodes && teacher.classCodes[className]) {
            classCodes[className] = teacher.classCodes[className];
          }
        }
        const classesToProcess = targetClass ? [targetClass] : effectiveClasses;

        for (const className of classesToProcess) {
          const prefix = getPrefixForGrade(className);
          let randomNum: number;
          let isUnique = false;
          let code = '';
          
          do {
            randomNum = Math.floor(1000 + Math.random() * 9000);
            code = `TCH-${subCode}-${prefix}-${randomNum}`;
            // Check uniqueness across all teachers
            isUnique = !teachers.some(t => 
              t.id !== teacher.id && (
                t.code === code || 
                (t.classCodes && Object.values(t.classCodes).includes(code))
              )
            );
          } while (!isUnique);

          classCodes[className] = code;
        }

        // Generate or retain Master Unified Code
        let masterCode = teacher.code;
        if (!masterCode || !masterCode.startsWith('TCH-')) {
          const primaryPrefix = getPrefixForGrade(effectiveClasses[0]);
          let randomNum: number;
          let isUnique = false;
          do {
            randomNum = Math.floor(1000 + Math.random() * 9000);
            masterCode = `TCH-${subCode}-${primaryPrefix}-${randomNum}`;
            isUnique = !teachers.some(t => 
              t.id !== teacher.id && (
                t.code === masterCode || 
                (t.classCodes && Object.values(t.classCodes).includes(masterCode))
              )
            );
          } while (!isUnique);
        }

        const updateData = { 
          classCodes,
          classes: effectiveClasses,
          code: masterCode || Object.values(classCodes)[0]
        };
        await staffService.updateTeacher(teacher.id, updateData);
        setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, ...updateData } : t));
        showToast(targetClass ? `تم إصدار كود الصف ${targetClass} بنجاح` : 'تم إصدار الكود الموحد وكافة شُعب الأستاذ بنجاح', 'success');
      } else {
        // Staff or generic fallback
        let randomNum: number;
        let isUnique = false;
        let staffCode = '';
        
        do {
          randomNum = Math.floor(1000 + Math.random() * 9000);
          staffCode = `TCH-STAFF-${randomNum}`;
          isUnique = !teachers.some(t => t.id !== teacher.id && t.code === staffCode);
        } while (!isUnique);

        await staffService.updateTeacher(teacher.id, { code: staffCode });
        setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, code: staffCode } : t));
        showToast('تم إصدار كود الموظف بنجاح', 'success');
      }

      logActivity({
        action: 'توليد أكواد صلاحيات',
        details: `تم إصدار كود موحد جديد للأستاذ/الموظف: ${teacher.name} لجميع شُعبه`,
        targetId: teacher.id,
        targetType: 'teacher',
        targetName: teacher.name
      });
    } catch (err) {
      showToast('فشل توليد الكود', 'error');
    }
  };

  const shareTeacherCode = (teacher: Teacher, specificCode?: string, className?: string) => {
    const codeToShare = specificCode || teacher.code;
    if (!codeToShare) return;
    
    const teacherSections = getTeacherSections(teacher);
    const effectiveClasses = teacherSections.length > 0 ? teacherSections : (teacher.classes || []);
    const isMultiClass = effectiveClasses.length > 1;
    const classesList = effectiveClasses.join('، ');

    const message = `
🌟 *بوابة بيرق - كود الدخول الموحد للأستاذ* 🌟

تحية طيبة الأستاذ القدير: *${teacher.name}*
المادة: *${teacher.subject}*
${className ? `📌 الشعبة المحددة: *${className}*` : (isMultiClass ? `📚 الشُعب الموكلة (${effectiveClasses.length}): *${classesList}*` : `📌 الصف: *${classesList || 'المنهج الوزاري'}*`)}

🔑 *كود الدخول ${className ? 'للشعبة' : 'الموحد الشامل'}:*
\`${codeToShare}\`

${!className && isMultiClass ? `✨ *ميزة الدخول الموحد:*
يكفي إدخال هذا الكود لمرة واحدة فقط لفتح كافة شُعبك (${effectiveClasses.length} شُعب) في لوحة تحكم واحدة، دون الحاجة لتسجيل الخروج والدخول المتكرر لكل شعبة.

` : ''}بهذا الحساب يمكنك:
✅ متابعة وتقييم طلاب كافة الشُعب أو كل شعبة على حدة
✅ نشر الواجبات والمسابقات لكل الشُعب بنقرة واحدة
✅ البث المباشر والتفاعل الفوري مع جميع طلابك

رابط المنصة: ${window.location.origin}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'كود الأستاذ الموحد - بوابة بيرق',
        text: message
      }).catch(async () => {
        const success = await copyToClipboard(message);
        if (success) showToast('تم نسخ رسالة المشاركة للمحافظة', 'success');
      });
    } else {
      copyToClipboard(message).then(success => {
        if (success) showToast('تم نسخ رسالة المشاركة للمحافظة', 'success');
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const teacherName = confirmDelete.name;
      const teacherId = confirmDelete.id;
      await staffService.deleteTeacher(teacherId);
      setSelectedTeacher(null);
      setTeachers(prev => prev.filter(t => t.id !== confirmDelete.id));
      showToast('تم الحذف بنجاح');
      
      logActivity({
        action: 'حذف مدرس',
        details: `تم حذف المدرس نهائياً: ${teacherName}`,
        targetId: teacherId,
        targetType: 'teacher',
        targetName: teacherName
      });
    } catch (e) {
      console.error("Error deleting teacher: ", e);
      alert('فشل في عملية الحذف: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setConfirmDelete(null);
    }
  };
  
  const searchLower = search.toLowerCase();
  
  const filteredTeachers = teachers.filter(t => 
      (t.role === 'TEACHER' || !t.role) &&
      (t.name?.toLowerCase().includes(searchLower) || false) &&
      (filterSubject === '' || t.subject?.trim() === filterSubject) &&
      (filterClass === '' || (Array.isArray(t.classes) && t.classes.includes(filterClass)))
  );

  const filteredStaff = teachers.filter(t => 
      t.role === 'STAFF' &&
      (t.name?.toLowerCase().includes(searchLower) || false) &&
      (filterSubject === '' || t.subject?.trim() === filterSubject)
  );

  return (
    <div className="space-y-6">
      <ConfirmDialog 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف المدرس/ة "${confirmDelete?.name}"؟`}
      />

      {activeSubTab !== 'schedule' && (
        <div className="flex flex-wrap items-center gap-4 bg-[#101935] border border-white/5 p-4 rounded-xl shadow-lg">
          <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-white/40" size={16} />
              <input type="text" placeholder="بحث بالاسم..." className="w-full bg-black/40 py-2 pl-10 pr-4 rounded-xl text-white text-xs border border-white/10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {activeSubTab === 'teachers' && (
            <>
              <select className="bg-black/40 p-2 rounded-xl text-white text-xs border border-white/10" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                  <option value="">جميع المواد</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="bg-black/40 p-2 rounded-xl text-white text-xs border border-white/10" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                  <option value="">جميع الصفوف</option>
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </>
          )}
          {activeSubTab === 'staff' && (
            <select className="bg-black/40 p-2 rounded-xl text-white text-xs border border-white/10" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                <option value="">جميع المسميات الوظيفية</option>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white/5 p-1.5 rounded-[22px] border border-white/5 w-full md:w-auto">
          <button 
            onClick={() => setActiveSubTab('teachers')}
            className={`flex-1 md:w-32 py-3 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeSubTab === 'teachers' ? 'bg-amber-400 text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <BookOpen size={16} />
            كادر تدريسي
          </button>
          <button 
            onClick={() => setActiveSubTab('staff')}
            className={`flex-1 md:w-32 py-3 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeSubTab === 'staff' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
            <UserCog size={16} />
            موظفين
          </button>
          <button 
            onClick={() => setActiveSubTab('schedule')}
            className={`flex-1 md:w-32 py-3 rounded-[18px] text-[10px] font-black transition-all flex items-center justify-center gap-2 ${activeSubTab === 'schedule' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-white/40 hover:text-white'}`}
          >
            <Clock size={16} />
            جدول الحصص
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPrintModal(true)}
            className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20 border border-emerald-400/20"
            title="طباعة وتصدير قوائم الكادر والموظفين"
          >
            <Printer size={16} />
            <span>طباعة القوائم</span>
          </button>

          {activeSubTab === 'teachers' && (
            <button 
                onClick={() => handleOpenAdd('TEACHER')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/20"
            >
                <UserPlus size={16} /> إضافة مدرس
            </button>
          )}
          {activeSubTab === 'staff' && (
            <button 
                onClick={() => handleOpenAdd('STAFF')}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
            >
                <UserCog size={16} /> إضافة موظف
            </button>
          )}
        </div>
      </div>
      
      {teachers.length === 0 ? (
          <div className="text-center py-20 bg-[#101935] rounded-3xl border border-white/5 text-white/30 font-bold">لا يوجد كادر مضاف حالياً</div>
      ) : (
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {activeSubTab === 'teachers' ? (
                <motion.div 
                  key="teachers-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTeachers.map(teacher => (
                          <motion.div 
                              key={teacher.id} 
                              whileHover={{ y: -5 }}
                              className={`bg-[#101935] p-5 rounded-[40px] border border-white/5 space-y-4 shadow-lg cursor-pointer transition-all ${!teacher.isActive ? 'opacity-60' : ''}`} 
                              onClick={() => setSelectedTeacher(teacher)}
                          >
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-500 overflow-hidden border border-amber-400/20 shrink-0">
                                          {teacher.photo ? (
                                            <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />
                                          ) : (
                                            getRoleIcon(teacher.subject, 'TEACHER')
                                          )}
                                      </div>
                                      <div>
                                          <h4 className="text-white font-black text-lg">{teacher.name}</h4>
                                          <p className="text-amber-400 text-xs font-bold">مدرس: {teacher.subject}</p>
                                      </div>
                                  </div>
                              </div>
                              
                              {(() => {
                                const displaySections = getTeacherSections(teacher);
                                const isMulti = displaySections.length > 1;
                                return (
                                  <>
                                    <div className="space-y-1.5 pt-1">
                                      <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-white/60 flex items-center gap-1">
                                          <Layers size={12} className="text-amber-400" />
                                          <span>الشُعب والصفوف الموكلة:</span>
                                        </span>
                                        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                                          {displaySections.length} {displaySections.length === 1 ? 'شعبة' : 'شُعب'}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {displaySections.map((sec) => (
                                          <span
                                            key={sec}
                                            className="text-[11px] bg-gradient-to-r from-blue-500/15 to-cyan-500/20 text-cyan-200 border border-cyan-500/30 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 shadow-sm"
                                          >
                                            <span className="text-cyan-400 text-[10px]">📌</span>
                                            <span>{sec}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                                      {((teacher.classCodes && Object.keys(teacher.classCodes).length > 0) || teacher.code) ? (
                                        <div className="space-y-2.5">
                                          {/* Unified Master Code Box for Multi-Section Teachers */}
                                          {teacher.code && (
                                            <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent p-3 rounded-2xl border border-amber-500/40 flex items-center justify-between group/master relative shadow-sm">
                                              <div 
                                                className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  const success = await copyToClipboard(teacher.code || '');
                                                  if (success) showToast('تم نسخ كود الدخول الموحد الشامل للأستاذ بنجاح', 'success');
                                                }}
                                                title="انقر لنسخ الكود الموحد"
                                              >
                                                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                                                  <KeyRound size={15} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] text-amber-300 font-black">
                                                      {isMulti ? 'كود الدخول الموحد الشامل' : 'كود المنصة'}
                                                    </span>
                                                    {isMulti && (
                                                      <span className="text-[8px] bg-amber-400/25 text-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                                                        يفتح {displaySections.length} شُعب معاً
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span className="text-amber-400 font-mono text-xs font-black tracking-wider uppercase truncate mt-0.5">
                                                    {teacher.code}
                                                  </span>
                                                </div>
                                              </div>
                                              
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); handleGenerateTeacherCode(teacher); }}
                                                  className="p-2 bg-amber-400/15 text-amber-400 rounded-xl hover:bg-amber-400 hover:text-black transition-all active:scale-90"
                                                  title="تجديد الكود الموحد"
                                                >
                                                  <RotateCcw size={12} />
                                                </button>
                                                <button 
                                                  onClick={(e) => { e.stopPropagation(); shareTeacherCode(teacher); }}
                                                  className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all active:scale-90 shadow-sm flex items-center gap-1 text-[10px]"
                                                  title="مشاركة الكود الموحد"
                                                >
                                                  <Send size={11} className="-rotate-45" />
                                                  <span>مشاركة</span>
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Per-Section Individual Codes (If multiple sections configured) */}
                                          {teacher.classCodes && Object.keys(teacher.classCodes).length > 1 && (
                                            <div className="space-y-1.5 pt-1">
                                              <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] text-white/50 font-bold flex items-center gap-1">
                                                  <Layers size={10} className="text-blue-400" />
                                                  <span>أكواد الشُعب المنفصلة (مربوطة تلقائياً باللوحة):</span>
                                                </span>
                                              </div>
                                              <div className="grid grid-cols-1 gap-1.5">
                                                {(Object.entries(teacher.classCodes) as [string, string][]).map(([className, classCode]) => (
                                                  <div key={className} className="bg-black/30 px-2.5 py-2 rounded-xl border border-white/5 hover:border-blue-500/30 flex items-center justify-between group/code text-right">
                                                    <div 
                                                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                                      onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const success = await copyToClipboard(classCode);
                                                        if (success) showToast(`تم نسخ كود ${className}`, 'success');
                                                      }}
                                                    >
                                                      <QrCode size={12} className="text-blue-400 shrink-0" />
                                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="text-[9px] text-white/70 font-bold truncate">{className}:</span>
                                                        <span className="text-blue-400 font-mono text-[9px] font-black tracking-wider uppercase truncate">{classCode}</span>
                                                      </div>
                                                    </div>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); shareTeacherCode(teacher, classCode, className); }}
                                                      className="p-1 text-white/40 hover:text-blue-400 transition-colors"
                                                      title={`مشاركة كود ${className}`}
                                                    >
                                                      <Send size={10} className="-rotate-45" />
                                                    </button>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); handleGenerateTeacherCode(teacher); }} 
                                          className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white p-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 transition-all border border-blue-600/20"
                                        >
                                          <QrCode size={16} />
                                          توليد أكواد الصلاحيات
                                        </button>
                                      )}
                                      
                                      <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(teacher); }} className="flex-1 bg-white/5 p-2 rounded-xl text-[10px] text-white/40 hover:text-white flex items-center justify-center gap-1"><Edit2 size={14} /> تعديل</button>
                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(teacher); }} className="flex-1 bg-rose-600/10 p-2 rounded-xl text-[10px] text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center gap-1 transition-all"><Trash2 size={14} /> حذف</button>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                          </motion.div>
                      ))}
                      {filteredTeachers.length === 0 && (
                        <div className="col-span-full py-10 text-center text-white/20 font-bold border border-dashed border-white/5 rounded-[40px]">لا توجد نتائج مطابقة لبحثك في قسم المدرسين</div>
                      )}
                  </div>
                </motion.div>
              ) : activeSubTab === 'staff' ? (
                <motion.div 
                  key="staff-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStaff.map(staff => (
                          <motion.div 
                              key={staff.id} 
                              whileHover={{ y: -5 }}
                              className={`bg-[#101935] p-5 rounded-[40px] border border-white/5 space-y-4 shadow-lg cursor-pointer transition-all ${!staff.isActive ? 'opacity-60' : ''}`} 
                              onClick={() => setSelectedTeacher(staff)}
                          >
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-blue-400/10 rounded-full flex items-center justify-center text-blue-400 overflow-hidden border border-blue-400/20 shrink-0">
                                          {staff.photo ? (
                                            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                          ) : (
                                            getRoleIcon(staff.subject, 'STAFF')
                                          )}
                                      </div>
                                      <div>
                                          <h4 className="text-white font-black text-lg">{staff.name}</h4>
                                          <p className="text-blue-400 text-xs font-bold">موظف: {staff.subject}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                                  {staff.code ? (
                                    <div className="bg-black/40 p-3 rounded-2xl border border-blue-500/30 flex items-center justify-between group/code relative">
                                      <div 
                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const success = await copyToClipboard(staff.code || '');
                                          if (success) showToast('تم نسخ الكود بنجاح', 'success');
                                          else showToast('فشل النسخ تلقائياً، يرجى كتابة الكود', 'error');
                                        }}
                                      >
                                        <QrCode size={14} className="text-blue-400" />
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-white/40 font-bold">كود الموظف:</span>
                                          <span className="text-blue-400 font-mono text-[11px] font-black tracking-wider uppercase">{staff.code}</span>
                                        </div>
                                      </div>

                                      <button 
                                        onClick={(e) => { e.stopPropagation(); shareTeacherCode(staff); }}
                                        className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-600/10 active:scale-90"
                                        title="مشاركة الكود"
                                      >
                                        <Send size={14} className="-rotate-45" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleGenerateTeacherCode(staff); }} 
                                      className="w-full bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white p-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 transition-all border border-blue-600/20"
                                    >
                                      <QrCode size={16} />
                                      توليد كود الموظف
                                    </button>
                                  )}
                                  <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(staff); }} className="flex-1 bg-white/5 p-2 rounded-xl text-[10px] text-white/40 hover:text-white flex items-center justify-center gap-1"><Edit2 size={14} /> تعديل</button>
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(staff); }} className="flex-1 bg-rose-600/10 p-2 rounded-xl text-[10px] text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center gap-1 transition-all"><Trash2 size={14} /> حذف</button>
                                  </div>
                              </div>
                          </motion.div>
                      ))}
                      {filteredStaff.length === 0 && (
                        <div className="col-span-full py-10 text-center text-white/20 font-bold border border-dashed border-white/5 rounded-[40px]">لا توجد نتائج مطابقة لبحثك في قسم الموظفين</div>
                      )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="schedule-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <ScheduleManager teachers={teachers} showToast={showToast} CLASSES={CLASSES} schoolId={schoolId} savedLists={savedLists} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedTeacher && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-black/80 z-[100] flex justify-end"
                onClick={() => setSelectedTeacher(null)}
            >
                <motion.div 
                    initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                    className="bg-[#0f172a] border-l border-white/10 w-full max-w-lg p-8 space-y-6 overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <h4 className="text-white font-black text-xl">تفاصيل {selectedTeacher.role === 'TEACHER' ? 'المدرس' : 'الموظف'}</h4>
                        <button onClick={() => setSelectedTeacher(null)}><X size={24} className="text-white/60 hover:text-white" /></button>
                    </div>
                    
                    <div className="text-white space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-500 overflow-hidden border border-amber-400/20 shadow-md shrink-0">
                                {selectedTeacher.photo ? (
                                  <img src={selectedTeacher.photo} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                                ) : (
                                  getRoleIcon(selectedTeacher.subject, selectedTeacher.role || 'TEACHER', 40)
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">{selectedTeacher.name}</h3>
                                <p className="text-amber-400 font-bold">{selectedTeacher.role === 'STAFF' ? selectedTeacher.subject : selectedTeacher.subject}</p>
                                {selectedTeacher.code && (
                                  <div className="mt-2 bg-blue-600/10 border border-blue-600/20 px-3 py-1.5 rounded-xl inline-flex items-center gap-2">
                                    <QrCode size={14} className="text-blue-400" />
                                    <span className="text-blue-400 font-mono text-sm font-black">{selectedTeacher.code}</span>
                                  </div>
                                )}
                            </div>
                        </div>
                        
                        <p className="text-white/70 leading-relaxed pt-2">{selectedTeacher.bio}</p>
                        
                        {selectedTeacher.role === 'TEACHER' && (
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                  <span className="text-white/50 text-xs block mb-1">الشُعب والصفوف الموكلة</span>
                                  <div className="space-y-1.5 mt-1 flex flex-col">
                                    {getTeacherSections(selectedTeacher).map(c => (
                                      <span key={c} className="inline-flex items-center gap-1.5 text-cyan-300 text-xs font-bold bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                                        <span>📌</span>
                                        <span>{c}</span>
                                      </span>
                                    ))}
                                  </div>
                              </div>
                              <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                  <span className="text-white/50 text-xs block mb-1">ايام الحصص</span>
                                  <div className="space-y-1">{(selectedTeacher.schedule || []).map(d => <span key={d} className="block text-white text-sm">{d}</span>)}</div>
                              </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t border-white/10 space-y-2">
                             <h5 className="font-bold flex items-center gap-2"><MessageSquare size={18} className="text-amber-500"/> ملاحظات إدارية:</h5>
                             <textarea 
                                className="w-full bg-black/40 p-3 rounded-xl text-white text-sm border border-white/10"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                placeholder="إضافة ملاحظات سرية للمدير..."
                             />
                             <button onClick={() => handleUpdateNotes(selectedTeacher, tempNotes)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500">حفظ الملاحظة</button>
                        </div>
                        
                        <div className="pt-4 border-t border-white/10">
                            <h5 className="font-bold flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> نشاطات {selectedTeacher.role === 'TEACHER' ? 'المدرس' : 'الموظف'} الأخيرة:</h5>
                            <ul className="text-white/60 text-sm mt-2 space-y-1">
                                <li>- تم تحديث بيانات الحساب</li>
                                {selectedTeacher.role === 'TEACHER' && <li>- تم رفع ملف (محاضرة جديدة)</li>}
                            </ul>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6"
            onClick={() => setIsAdding(false)}
          >
            <motion.div 
              initial={{ scale: 0.92, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.92, opacity: 0, y: 20 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#0d1527] border border-white/10 rounded-[28px] sm:rounded-[36px] w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/90 overflow-hidden my-auto text-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Modal Header */}
              <div className="sticky top-0 z-20 bg-[#0d1527]/95 backdrop-blur-md border-b border-white/10 px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${formData.role === 'TEACHER' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20 shadow-amber-400/10' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-blue-500/10'}`}>
                    {editingTeacher ? <Edit2 size={22} /> : (formData.role === 'TEACHER' ? <BookOpen size={22} /> : <UserCog size={22} />)}
                  </div>
                  <div>
                    <h4 className="text-white font-black text-base sm:text-lg">
                      {editingTeacher ? (formData.role === 'TEACHER' ? 'تعديل بيانات الأستاذ' : 'تعديل بيانات الموظف') : (formData.role === 'TEACHER' ? 'إضافة أستاذ جديد للكادر' : 'إضافة موظف جديد')}
                    </h4>
                    <p className="text-white/40 text-[11px] font-semibold">
                      {formData.role === 'TEACHER' ? 'حدد اسم الأستاذ، المادة، الصفوف الموكلة، وأيام الحصص' : 'أدخل بيانات الموظف والمسمى الوظيفي'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role toggle if adding */}
                  {!editingTeacher && (
                    <div className="hidden sm:flex bg-black/40 p-1 rounded-2xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${formData.role === 'TEACHER' ? 'bg-amber-400 text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                      >
                        <BookOpen size={14} />
                        كادر تدريسي
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: 'STAFF', classes: [], schedule: [] })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${formData.role === 'STAFF' ? 'bg-blue-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                      >
                        <UserCog size={14} />
                        كادر إداري
                      </button>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)} 
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/5 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Mobile Role Switcher (visible only on small screens) */}
              {!editingTeacher && (
                <div className="sm:hidden px-5 pt-3 pb-0">
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${formData.role === 'TEACHER' ? 'bg-amber-400 text-black shadow-md' : 'text-white/50 hover:text-white'}`}
                    >
                      <BookOpen size={14} />
                      كادر تدريسي
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'STAFF', classes: [], schedule: [] })}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${formData.role === 'STAFF' ? 'bg-blue-600 text-white shadow-md' : 'text-white/50 hover:text-white'}`}
                    >
                      <UserCog size={14} />
                      كادر إداري
                    </button>
                  </div>
                </div>
              )}

              {/* Scrollable Form Body */}
              <form id="teacher-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
                {/* 1. Basic Info Section */}
                <div className="bg-[#101935] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5 text-amber-400 text-xs font-black">
                    <User size={16} />
                    <span>المعلومات الأساسية</span>
                  </div>

                  {/* Teacher Photo Upload Box */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#121c38] to-[#0a1022] border-2 border-amber-400/40 flex items-center justify-center shadow-lg">
                        {formData.photo ? (
                          <img src={formData.photo} alt="معاينة الصورة" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/30">
                            <User size={34} />
                          </div>
                        )}
                      </div>
                      {formData.photo && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md border border-black text-xs transition-transform active:scale-90"
                          title="إزالة الصورة"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 text-center sm:text-right space-y-1.5 min-w-0">
                      <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                        <span className="text-white text-xs font-black">
                          {formData.role === 'TEACHER' ? 'صورة الأستاذ الشخصية' : 'صورة الموظف'}
                        </span>
                        <span className="text-[10px] text-amber-400/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-bold">
                          تظهر في بطاقات الميادين وحسابه
                        </span>
                      </div>
                      <p className="text-white/40 text-[11px] font-semibold">
                        ارفع صورة واضحة ومميزة لتظهر للطلاب في ساحة المادة وبطاقات الأساتذة
                      </p>
                      <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95">
                          <Camera size={15} />
                          <span>{formData.photo ? 'تغيير الصورة' : (formData.role === 'TEACHER' ? 'رفع صورة الأستاذ' : 'رفع صورة الموظف')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressImage(file, 400, 0.85);
                                  setFormData(prev => ({ ...prev, photo: compressed }));
                                  showToast('تم تحميل الصورة بنجاح', 'success');
                                } catch (err) {
                                  console.error(err);
                                  showToast('فشل في معالجة الصورة، يرجى اختيار صورة أخرى', 'error');
                                }
                              }
                            }}
                          />
                        </label>
                        {formData.photo && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                            className="text-white/50 hover:text-rose-400 text-xs font-bold px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/5 transition-all"
                          >
                            حذف الصورة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-white/80 text-xs font-bold flex items-center justify-between">
                      <span>{formData.role === 'TEACHER' ? 'اسم الأستاذ الكامل' : 'اسم الموظف الكامل'} <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-white/40">ثلاثي أو رباعي</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder={formData.role === 'TEACHER' ? "مثال: أ. حيدر عباس الكناني" : "مثال: أحمد عبد الرضا"} 
                        className="w-full h-12 bg-black/40 px-4 rounded-xl text-white text-sm font-bold border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Subject or Role Selection */}
                  <div className="space-y-2">
                    <label className="text-white/80 text-xs font-bold flex items-center justify-between">
                      <span>{formData.role === 'TEACHER' ? 'المادة / الاختصاص التدريسي' : 'المسمى الوظيفي'} <span className="text-rose-400">*</span></span>
                      {formData.role === 'TEACHER' && <span className="text-[10px] text-amber-400/80">اختر من القائمة أو اكتب اختصاصك</span>}
                    </label>

                    {formData.role === 'TEACHER' ? (
                      <div className="space-y-3">
                        {/* Dropdown Selector */}
                        <div className="relative">
                          <select 
                            className="w-full h-12 bg-black/40 px-4 rounded-xl text-white text-sm font-bold border border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 outline-none transition-all cursor-pointer"
                            value={SUBJECTS.includes(formData.subject) ? formData.subject : (formData.subject ? 'CUSTOM' : '')} 
                            onChange={e => {
                              if (e.target.value === 'CUSTOM') {
                                // Keep or switch to custom input
                              } else {
                                setFormData({ ...formData, subject: e.target.value });
                              }
                            }}
                            required
                          >
                            <option value="" disabled>-- اضغط لاختيار المادة من القائمة --</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            <option value="CUSTOM">✍️ مادة أخرى (كتابة يدوية)...</option>
                          </select>
                        </div>

                        {/* Direct input for custom subject if chosen or typed */}
                        {(!SUBJECTS.includes(formData.subject) || formData.subject === 'أخرى') && (
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="اكتب اسم المادة أو الاختصاص المخصص..." 
                              className="w-full h-11 bg-amber-400/5 px-4 rounded-xl text-amber-300 text-xs font-bold border border-amber-400/30 focus:border-amber-400 outline-none transition-all"
                              value={formData.subject === 'أخرى' ? '' : formData.subject}
                              onChange={e => setFormData({ ...formData, subject: e.target.value })}
                              required
                            />
                          </div>
                        )}

                        {/* Quick Selection Chips */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] text-white/40 font-bold block">اختيار سريع:</span>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-black/20 rounded-xl">
                            {SUBJECTS.slice(0, 12).map(s => {
                              const isSelected = formData.subject === s;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, subject: s })}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${isSelected ? 'bg-amber-400 text-black border-amber-400 shadow-md' : 'bg-white/5 text-white/70 hover:text-white border-white/5 hover:border-white/15'}`}
                                >
                                  {isSelected && <Check size={12} />}
                                  <span>{s}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select 
                          className="w-full h-12 bg-black/40 px-4 rounded-xl text-white text-sm font-bold border border-white/10 focus:border-blue-500 outline-none transition-all cursor-pointer" 
                          value={formData.subject || ''} 
                          onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                          required
                        >
                          <option value="" disabled>-- اضغط لاختيار المسمى الوظيفي --</option>
                          {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        {/* Quick staff role chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {STAFF_ROLES.map(r => {
                            const isSelected = formData.subject === r;
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setFormData({ ...formData, subject: r })}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${isSelected ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-white/5 text-white/70 hover:text-white border-white/5 hover:border-white/15'}`}
                              >
                                {isSelected && <Check size={12} />}
                                <span>{r}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Teacher Assigned Classes Section (Teachers Only) */}
                {formData.role === 'TEACHER' && (
                  <div className="bg-[#101935] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-black">
                        <GraduationCap size={16} />
                        <span>الصفوف الدراسية والشُعب الموكلة</span>
                        <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                          {formData.classes?.length || 0} شُعب
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allExpanded: string[] = [];
                            CLASSES.forEach(g => {
                              const lists = getListsForGrade(g);
                              if (lists.length > 0) {
                                lists.forEach(l => {
                                  if (!allExpanded.includes(l.name)) allExpanded.push(l.name);
                                });
                              } else {
                                if (!allExpanded.includes(g)) allExpanded.push(g);
                              }
                            });
                            (savedLists || []).forEach(l => {
                              if (l.name && !allExpanded.includes(l.name)) {
                                allExpanded.push(l.name);
                              }
                            });
                            setFormData({ ...formData, classes: allExpanded.length > 0 ? allExpanded : [...CLASSES] });
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-bold bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg transition-all"
                        >
                          تحديد الكل
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, classes: [] })}
                          className="text-[10px] text-white/40 hover:text-white font-bold bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all"
                        >
                          إلغاء التحديد
                        </button>
                      </div>
                    </div>

                    {/* CURRENTLY ASSIGNED CLASSES & SECTIONS CHIPS (WITH REMOVE BUTTON) */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-white/70 flex items-center justify-between">
                        <span>الشُعب والصفوف المحددة حالياً ({formData.classes?.length || 0}):</span>
                        {formData.classes && formData.classes.length > 0 && (
                          <span className="text-[10px] text-amber-400">انقر (✕) لإلغاء أي شعبة مباشرة</span>
                        )}
                      </div>
                      {formData.classes && formData.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-2 p-3 bg-black/40 rounded-2xl border border-amber-500/20">
                          {formData.classes.map(cls => (
                            <span 
                              key={cls} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-bold shadow-sm"
                            >
                              <span>📌 {cls}</span>
                              <button
                                type="button"
                                onClick={() => removeSection(cls)}
                                className="w-4 h-4 rounded-full bg-amber-400/20 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all ml-0.5"
                                title="إزالة هذه الشعبة"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-black/20 rounded-xl border border-dashed border-white/10 text-center text-xs text-white/40 font-bold">
                          لم يتم تحديد أي صفوف أو شُعب حتى الآن. اختر المرحلة والصف أدناه لإسناد الشُعب.
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Stages Selection */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-white/60">1. اختر المرحلة التعليمية:</div>
                        <div className="flex flex-wrap gap-2">
                          {STAGE_GROUPS.map(stage => (
                            <button
                              key={stage.id}
                              type="button"
                              onClick={() => {
                                setSelectedStageForForm(stage.id);
                                setSelectedGradeForForm(null); // Reset grade selection when stage changes
                              }}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                selectedStageForForm === stage.id ? 'bg-amber-400 text-black shadow-md font-black' : 'bg-black/30 text-white/50 hover:text-white border border-white/5'
                              }`}
                            >
                              <span>{stage.icon}</span>
                              <span>{stage.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grades Selection */}
                      {selectedStageForForm && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-1.5">
                          <div className="text-xs font-bold text-white/60">2. اختر الصف الدراسي:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {STAGE_GROUPS.find(s => s.id === selectedStageForForm)?.classes.map(grade => (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => setSelectedGradeForForm(grade)}
                                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                                  selectedGradeForForm === grade ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-black/30 border-white/5 text-white/50 hover:text-white'
                                }`}
                              >
                                {grade}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Classes/Lists Selection for the Chosen Grade */}
                      {selectedGradeForForm && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200 bg-black/25 p-3.5 rounded-2xl border border-white/5 mt-3 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                              <BookOpen size={14} />
                              <span>شُعب وقوائم: {selectedGradeForForm}</span>
                            </div>
                            
                            {/* Whole Grade Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleSection(selectedGradeForForm)}
                              className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                                isSectionSelected(selectedGradeForForm, formData.classes)
                                  ? 'bg-amber-400 text-black border-amber-400'
                                  : 'bg-white/5 text-white/70 hover:text-white border-white/10'
                              }`}
                            >
                              {isSectionSelected(selectedGradeForForm, formData.classes) ? '✓ الصف بالكامل محدد' : '+ تحديد الصف بالكامل'}
                            </button>
                          </div>
                          
                          {/* Lists from savedLists for this grade */}
                          {(() => {
                            const availableLists = getListsForGrade(selectedGradeForForm);
                            if (availableLists.length > 0) {
                              return (
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold text-white/60">القوائم والشُعب المسجلة:</div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {availableLists.map(list => {
                                      const isChecked = isSectionSelected(list.name, formData.classes);
                                      return (
                                        <button
                                          key={list.id || list.name}
                                          type="button"
                                          onClick={() => toggleSection(list.name)}
                                          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-right border ${
                                            isChecked
                                              ? 'bg-amber-400/20 border-amber-400/80 text-amber-300 shadow-md shadow-amber-500/10'
                                              : 'bg-black/40 border-white/5 text-white/60 hover:text-white hover:border-white/15'
                                          }`}
                                        >
                                          <div className="flex flex-col text-right">
                                            <span className="leading-tight font-black">{list.name}</span>
                                            <span className="text-[9px] text-white/40 mt-0.5">{list.students?.length || 0} طالب/طالبة</span>
                                          </div>
                                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 ${isChecked ? 'bg-amber-400 text-black font-black' : 'border border-white/20'}`}>
                                            {isChecked ? '✓' : ''}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-center text-xs text-white/40 font-bold">
                                لا توجد قوائم مسجلة لهذا الصف حالياً. يمكنك النقر على &quot;تحديد الصف بالكامل&quot; أعلاه.
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Teaching Schedule Days (Teachers Only) */}
                {formData.role === 'TEACHER' && (
                  <div className="bg-[#101935] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-black">
                        <Clock size={16} />
                        <span>أيام الدوام والحصص الأسبوعية</span>
                        <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {formData.schedule?.length || 0} أيام
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = (formData.schedule || []).length === DAYS.length;
                          setFormData({ ...formData, schedule: allSelected ? [] : [...DAYS] });
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg transition-all"
                      >
                        {(formData.schedule || []).length === DAYS.length ? 'إلغاء الكل' : 'تحديد جميع الأيام'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {DAYS.map(d => {
                        const isChecked = (formData.schedule || []).includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const current = formData.schedule || [];
                              const newDays = isChecked 
                                ? current.filter(i => i !== d) 
                                : [...current, d];
                              setFormData({ ...formData, schedule: newDays });
                            }}
                            className={`min-h-[44px] py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                              isChecked
                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-black/30 border-white/5 text-white/50 hover:text-white hover:border-white/15'
                            }`}
                          >
                            <span>{d}</span>
                            <span className="text-[9px] opacity-80">{isChecked ? '✓ مشمول' : '—'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Bio & Extra Notes */}
                <div className="bg-[#101935] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2">
                  <label className="text-white/80 text-xs font-bold flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-400" />
                    <span>نبذة تعريفية وملاحظات (اختياري)</span>
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="اكتب نبذة مختصرة عن الخبرة، التحصيل العلمي، أو المهام الموكلة..." 
                    className="w-full bg-black/40 p-3.5 rounded-xl text-white text-xs font-medium border border-white/10 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 outline-none transition-all resize-none leading-relaxed" 
                    value={formData.bio || ''} 
                    onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                  />
                </div>
              </form>

              {/* Sticky Modal Footer */}
              <div className="sticky bottom-0 z-20 bg-[#080d19]/95 backdrop-blur-md border-t border-white/10 px-5 sm:px-7 py-4 flex items-center justify-between gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="px-5 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  form="teacher-form" 
                  className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <CheckCircle2 size={16} />
                  <span>{editingTeacher ? 'حفظ التعديلات' : (formData.role === 'TEACHER' ? 'إضافة الأستاذ وتثبيته' : 'إضافة الموظف')}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff & Teachers Printable List Modal */}
      <StaffPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        teachers={teachers}
        currentFilteredTeachers={filteredTeachers}
        currentFilteredStaff={filteredStaff}
        activeSubTab={activeSubTab}
        schoolName={schoolName}
        schoolId={schoolId}
        getTeacherSections={getTeacherSections}
      />
    </div>
  );
};
