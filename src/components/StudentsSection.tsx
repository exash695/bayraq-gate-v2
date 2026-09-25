import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, CheckCircle2, GraduationCap, ArrowRight, Save, Printer, FileSpreadsheet, Send, Plus, X, RotateCcw, Trash2, Layout,
  DollarSign, CreditCard, TrendingUp, Star, BookOpen, Award, Camera, Filter, Share2, Archive, FolderOpen, Settings
} from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from '../lib/firebase';
import { db } from '../lib/firebase';
import { ConfirmDialog } from './ConfirmDialog';
import { SubjectManager } from './SubjectManager';
import { SearchStudentsGlobal } from './SearchStudentsGlobal';
import { ExcellenceShareModal } from './ExcellenceShareModal';
import { BookDistributionManager } from './BookDistributionManager';
import { StudentPromotionWizard } from './StudentPromotionWizard';
import { getSubjectsForGrade, getGradePriority, calculateStudentFinancials, getPrefixForGrade, SUBJECT_BADGES_CONFIG, computeAcademicIdentity, OUTSTANDING_BADGES } from '../utils/studentUtils';
import { logActivity } from '../utils/auditLogger';
import { academicService } from '../services/academicService';

export const PRIDE_PRESETS = [
  "نفخر بالتطور الكبير الذي حققه هذا الشهر في مهاراته ودروسه المتميزة. 🌟",
  "أداء استثنائي وتفوق يستحق الإشادة الدائمة من الإدارة والكادر التدريسي. 👑",
  "استمر في دربك المتميز، أنت قريب جداً من نيل وسام النخبة العظيم! 🚀",
  "مثال يحتذى به في الأدب والالتزام والاجتهاد الدراسي. بارك الله بجهودك. ❤️"
];

export const getLevelData = (points: number) => {
  const level = Math.floor(points / 20) + 1;
  const xpInCurrentLevel = points % 20;
  const xpNeededForNext = 20;
  const progressPercent = (xpInCurrentLevel / xpNeededForNext) * 100;
  
  let label = "مجتهد برونزي 🥉";
  let borderClass = "border-slate-500/30 text-slate-300 bg-slate-400/5 shadow-[0_0_15px_rgba(148,163,184,0.1)]";
  let glowColor = "rgba(148,163,184,0.3)";
  let gradeTag = "ساعٍ للقمة";
  
  if (level >= 8) {
    label = "نخبة الأبطال الماسي 💎";
    borderClass = "border-[#FFD600] text-[#FFD600] bg-[#FFD600]/10 shadow-[0_0_25px_rgba(255,214,0,0.25)]";
    glowColor = "rgba(255,214,0,0.4)";
    gradeTag = "أسطوري المتفوقين";
  } else if (level >= 5) {
    label = "بطل خارق ذهبي 🥇";
    borderClass = "border-amber-400 text-amber-400 bg-amber-400/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
    glowColor = "rgba(245,158,11,0.35)";
    gradeTag = "متميز فائق";
  } else if (level >= 3) {
    label = "متميز فضي 🥈";
    borderClass = "border-blue-400/50 text-blue-300 bg-blue-500/5 shadow-[0_0_15px_rgba(96,165,250,0.15)]";
    glowColor = "rgba(96,165,250,0.3)";
    gradeTag = "نشيط مبدع";
  }
  
  return { level, label, progressPercent, xpInCurrentLevel, xpNeededForNext, borderClass, glowColor, gradeTag };
};

interface StudentsSectionProps {
  students: any[];
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  savedLists: any[];
  setSavedLists: React.Dispatch<React.SetStateAction<any[]>>;
  adminBranch: 'boys' | 'girls';
  schoolName: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
  handlePrintCard: (student: any) => void;
  setGradingStudent: (student: any) => void;
  tuitionFee: number;
  discountRates: Record<string, number>;
  onUpdateList?: (list: any) => Promise<void>;
  onDeleteList?: (id: string) => Promise<void>;
  subjectMapping?: any;
  isSaving?: boolean;
  onSubViewChange?: (isOpen: boolean) => void;
  schoolId?: string;
}

export const StudentsSection: React.FC<StudentsSectionProps> = ({
  students,
  setStudents,
  searchQuery,
  setSearchQuery,
  savedLists,
  setSavedLists,
  adminBranch,
  schoolName,
  showToast,
  handlePrintCard,
  setGradingStudent,
  tuitionFee,
  discountRates,
  onUpdateList,
  onDeleteList,
  subjectMapping,
  isSaving,
  onSubViewChange,
  schoolId
}) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const controlRoomRef = useRef<HTMLDivElement | null>(null);
  
  const handlePhotoUpload = (studentCode: string, listId: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      handleGlobalUpdateStudent(studentCode, listId, { avatar: dataUrl });
      showToast('تم تحديث صورة الطالب بنجاح', 'success');
    };
    reader.readAsDataURL(file);
  };

  const [selectedList, setSelectedList] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month1');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string, type: 'list' | 'student', student?: any } | null>(null);
  const [showSubjectManager, setShowSubjectManager] = useState(false);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<'all' | 'primary' | 'intermediate' | 'high'>('all');
  const [mainTab, setMainTab] = useState<'academic' | 'excellence' | 'books'>('academic');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveYearFilter, setArchiveYearFilter] = useState('all');
  const [excellenceSearch, setExcellenceSearch] = useState('');
  const [activeExcellenceStudentCode, setActiveExcellenceStudentCode] = useState<string | null>(null);
  const [selectedExcellenceStage, setSelectedExcellenceStage] = useState<'all' | 'primary' | 'intermediate' | 'high'>('all');
  const [selectedExcellenceClass, setSelectedExcellenceClass] = useState<string>('all');
  const [selectedExcellencePeriod, setSelectedExcellencePeriod] = useState<string>('all');
  const [selectedExcellenceExemption, setSelectedExcellenceExemption] = useState<string>('all');
  const [isExcellenceShareModalOpen, setIsExcellenceShareModalOpen] = useState(false);
  const [showExemptionsPanel, setShowExemptionsPanel] = useState(false);
  const [visualConfetti, setVisualConfetti] = useState<boolean>(false);
  const [customPrideMessage, setCustomPrideMessage] = useState<string>('');
  const [showCustomBadgeInput, setShowCustomBadgeInput] = useState(false);
  const [customBadgeTitle, setCustomBadgeTitle] = useState('');
  const [studentDisplayLimit, setStudentDisplayLimit] = useState<number>(50);
  const [isPromotionWizardOpen, setIsPromotionWizardOpen] = useState<boolean>(false);
  const [promotionTargetListId, setPromotionTargetListId] = useState<string | null>(null);

  useEffect(() => {
    setStudentDisplayLimit(50);
  }, [selectedExcellenceStage, selectedExcellenceClass, selectedExcellencePeriod, selectedExcellenceExemption, excellenceSearch]);

  const getListStage = (list: any): 'primary' | 'intermediate' | 'high' | '' => {
    const nameOrGrade = ((list?.name || '') + ' ' + (list?.students?.[0]?.grade || '')).toLowerCase();
    if (nameOrGrade.includes('ابتدائ') || nameOrGrade.includes('ابتدائي')) return 'primary';
    if (nameOrGrade.includes('متوسط')) return 'intermediate';
    if (nameOrGrade.includes('علمي') || nameOrGrade.includes('أدبي') || nameOrGrade.includes('اعدادي') || nameOrGrade.includes('إعدادي') || nameOrGrade.includes('سادس') || nameOrGrade.includes('خامس') || nameOrGrade.includes('رابع')) return 'high';
    return '';
  };

  useEffect(() => {
    if (onSubViewChange) {
      onSubViewChange(!!selectedList || showSubjectManager);
    }
    return () => {
      if (onSubViewChange) {
        onSubViewChange(false);
      }
    };
  }, [selectedList, showSubjectManager, onSubViewChange]);

  const handleRegenerateCode = (stu: any) => {
    try {
      const branchSuffix = (selectedList?.schoolName || selectedList?.school || '').includes('بنات') ? 'G' : 'B';
      const prefix = getPrefixForGrade(stu.grade || selectedList?.name?.split('-')[0]?.trim() || '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      const newStudentCode = `${prefix}-${branchSuffix}-${randomNum}`;
      const newParentCode = `PAR-${branchSuffix}-${randomNum}`;
      
      const updatedList = {
        ...selectedList,
        students: selectedList.students.map((s: any) => 
          (s.id === stu.id || s.student === stu.student) 
            ? { ...s, student: newStudentCode, code: newStudentCode, parent: newParentCode, parentCode: newParentCode } 
            : s
        )
      };
      
      setSelectedList(updatedList);
      if (onUpdateList) onUpdateList(updatedList);
      
      showToast('تم تحديث كود الطالب، الرجاء حفظ القائمة لاعتماده', 'success');
    } catch (e) {
      console.error(e);
      showToast('فشل توليد الكود', 'error');
    }
  };

  // Global Search Handler
  const handleSelectStudent = (student: any, listId: string) => {
    const list = savedLists.find(l => l.id === listId);
    if (list) {
      setSelectedList(list);
      setHighlightedStudentId(student.student || student.code);
      setSearchQuery('');
      
      // Auto-clear highlight after 5 seconds
      setTimeout(() => setHighlightedStudentId(null), 5000);
    }
  };

  // Auto-scroll to highlighted student
  useEffect(() => {
    if (highlightedStudentId && selectedList) {
      setTimeout(() => {
        const element = document.getElementById(`student-${highlightedStudentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [highlightedStudentId, selectedList]);

  const displaySchoolName = selectedList?.students[0]?.school || selectedList?.school || schoolName;

  const handleUpdateStudentDirect = async (studentCode: string, updates: any) => {
    if (!selectedList) return;
    const updatedList = {
      ...selectedList,
      students: selectedList.students.map((s: any) => 
        (s.student === studentCode || s.code === studentCode) ? { ...s, ...updates } : s
      )
    };
    setSelectedList(updatedList);
    if (onUpdateList) onUpdateList(updatedList);

    // Sync to school_students directly for realtime Parent Portal updates
    try {
       const studentDocId = `${selectedList.schoolId}_${studentCode}`.replace(/\s+/g, '_');
       await academicService.updateStudentDirect(studentDocId, updates);
    } catch (e) {
       console.warn("Could not sync direct update to school_students", e);
    }
  };

  const periods = [
    { id: 'month1', name: 'الشهر الاول' },
    { id: 'month2', name: 'الشهرالثاني' },
    { id: 'term1_avg', name: 'معدل الفصل الاول' },
    { id: 'mid', name: 'نصف السنة' },
    { id: 'month3', name: 'الشهر الاول ف1' },
    { id: 'month4', name: 'الشهر الثاني ف 2' },
    { id: 'term2_avg', name: 'معدل الفصل الثاني' },
    { id: 'annual_quest', name: 'معدل السعي السنوي' },
    { id: 'final', name: 'آخر السنة' },
    { id: 'final_grade', name: 'الدرجة النهائية' }
  ];

  const exportToDigitalList = () => {
    if (!selectedList) return;
    const subjects = getSubjectsForGrade(selectedList.students[0]?.grade || '', selectedList.removedSubjects || [], subjectMapping);
    const periodName = periods.find(p => p.id === selectedPeriod)?.name;
    
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += `بوابة بيرق - ${displaySchoolName}\n`;
    csvContent += `القائمة: ${selectedList.name} - ${periodName}\n`;
    csvContent += "الاسم,كود الطالب,المرحلة," + subjects.map(s => s.name).join(",") + "\n";
    
    selectedList.students.forEach((stu: any) => {
      const periodGrades = (stu.grades?.[selectedPeriod]) || {};
      
      let row = `"${stu.name}","${stu.student}","${stu.grade}",`;
      row += subjects.map(s => periodGrades[s.id] || 0).join(",");
      row += `\n`;
      csvContent += row;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedList.name}_${periodName}_درجات.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`تم تصدير درجات ${periodName} بنجاح`);
  };

  const printGrades = () => {
    if (!selectedList) return;
    const subjects = getSubjectsForGrade(selectedList.students[0]?.grade || '', selectedList.removedSubjects || [], subjectMapping);
    const periodName = periods.find(p => p.id === selectedPeriod)?.name;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
        <head>
          <title>كشف درجات: ${selectedList.name} - ${periodName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
            body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #1a1a1a; }
            .header { text-align: center; border-bottom: 4px solid #101935; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #101935; font-size: 28px; }
            .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
            .meta { margin-bottom: 20px; font-weight: bold; color: #0D47A1; font-size: 18px; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: center; font-size: 11px; }
            th { background-color: #f8f9fa; color: #101935; font-weight: 900; }
            tr:nth-child(even) { background-color: #fafafa; }
            .failed { color: #e11d48; font-weight: bold; }
            .passed { color: #10b981; font-weight: bold; }
            .footer { margin-top: 40px; text-align: left; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>بوابة بيرق - ${displaySchoolName}</h1>
            <p>سجل الدرجات الرسمي لعام 2026</p>
          </div>
          <div class="meta">كشف درجات ${periodName} | وجبة: ${selectedList.name}</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: right;">اسم الطالب</th>
                <th>الكود</th>
                ${subjects.map(s => `<th>${s.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${selectedList.students.map((stu: any) => {
                const periodGrades = stu.grades?.[selectedPeriod] || {};
                return `
                  <tr>
                    <td style="text-align: right; font-weight: 700;">${stu.name}</td>
                    <td>${stu.student}</td>
                    ${subjects.map(s => {
                      const g = periodGrades[s.id] || 0;
                      return `<td class="${g < 50 ? 'failed' : 'passed'}">${g}</td>`;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">طبع بواسطة نظام الإدارة الذكي • ${new Date().toLocaleString('ar-IQ')}</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };


  const removeSubject = (subjectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const allPossibleSubjects = getSubjectsForGrade(selectedList.students[0]?.grade || '', [], subjectMapping);
    const subjectName = allPossibleSubjects.find(s => s.id === subjectId)?.name || 'المادة';
    
    setSelectedList((prev: any) => {
      const currentRemoved = prev.removedSubjects || [];
      if (currentRemoved.includes(subjectId)) return prev;
      return {
        ...prev,
        removedSubjects: [...currentRemoved, subjectId]
      };
    });
    showToast(`تم إخفاء مادة ${subjectName} مؤقتاً`);
  };

  const restoreSubject = (subjectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const allPossibleSubjects = getSubjectsForGrade(selectedList.students[0]?.grade || '', [], subjectMapping);
    const subjectName = allPossibleSubjects.find(s => s.id === subjectId)?.name || 'المادة';
    
    setSelectedList((prev: any) => ({
      ...prev,
      removedSubjects: (prev.removedSubjects || []).filter((id: string) => id !== subjectId)
    }));
    showToast(`تمت استعادة مادة ${subjectName}`);
  };

  const handleUpdateGrade = (studentId: string, subjectId: string, value: any) => {
    const updatedList = {
      ...selectedList,
      students: selectedList.students.map((s: any) => {
        if (s.id === studentId || s.student === studentId || s.name === studentId) {
          const currentGrades = s.grades || {};
          const currentPeriodGrades = currentGrades[selectedPeriod] || {};
          
          const newPeriodGrades = { ...currentPeriodGrades };
          if (value === undefined || value === null || value === '') {
            delete newPeriodGrades[subjectId];
          } else {
            newPeriodGrades[subjectId] = value;
          }

          const newGrades = { 
            ...currentGrades, 
            [selectedPeriod]: newPeriodGrades 
          };

          const m1 = newGrades['month1']?.[subjectId];
          const m2 = newGrades['month2']?.[subjectId];
          const m3 = newGrades['month3']?.[subjectId];
          const m4 = newGrades['month4']?.[subjectId];
          const mid = newGrades['mid']?.[subjectId];
          const fin = newGrades['final']?.[subjectId];

          const getAvg = (a: any, b: any) => {
            if (a !== undefined && b !== undefined) return Math.round((Number(a) + Number(b)) / 2);
            if (a !== undefined) return Number(a);
            if (b !== undefined) return Number(b);
            return undefined;
          };

          const term1 = getAvg(m1, m2);
          const term2 = getAvg(m3, m4);
          
          let annual = undefined;
          let count = 0;
          let sum = 0;
          if (term1 !== undefined) { sum += term1; count++; }
          if (mid !== undefined) { sum += mid; count++; }
          if (term2 !== undefined) { sum += term2; count++; }
          if (count > 0) annual = Math.round(sum / count);

          const finalGrade = getAvg(annual, fin);

          const updateGrade = (period: string, val: any) => {
            if (val !== undefined) {
              if (!newGrades[period]) newGrades[period] = {};
              newGrades[period] = { ...newGrades[period], [subjectId]: val };
            }
          };

          updateGrade('term1_avg', term1);
          updateGrade('term2_avg', term2);
          updateGrade('annual_quest', annual);
          updateGrade('final_grade', finalGrade);

          return {
            ...s,
            grades: newGrades
          };
        }
        return s;
      })
    };
    setSelectedList(updatedList);
  };

  const saveBatchChanges = async () => {
    try {
      if (onUpdateList) {
        // Ensure the list has its schoolId explicitly for the service
        await onUpdateList(selectedList);
        await syncWithParents();
        showToast('تم حفظ التعديلات والمزامنة بنجاح', 'success');
      } else {
        setSavedLists(prev => prev.map(l => l.id === selectedList.id ? selectedList : l));
        await syncWithParents();
        showToast('تم حفظ التغييرات والمزامنة');
      }

      logActivity({
        action: 'تعديل درجات',
        details: `تم تعديل وحفظ درجات القائمة: ${selectedList.name}`,
        targetId: selectedList.id,
        targetType: 'academic_list',
        targetName: selectedList.name
      });
    } catch (err) {
      console.error(err);
      showToast('فشل في حفظ التعديلات في قاعدة البيانات', 'error');
    }
  };

  const syncWithParents = async () => {
    if (!selectedList) return;
    const studentCount = selectedList.students.length;
    const periodName = periods.find(p => p.id === selectedPeriod)?.name || 'غير محدد';
    showToast(`جاري بدؤ مزامنة درجات (${periodName}) لـ ${studentCount} طالباً مع بوابة أولياء الأمور...`);
    
    try {
      if (onUpdateList) {
        const listToSync = {
          ...selectedList,
          lastSyncedPeriod: selectedPeriod
        };
        await onUpdateList(listToSync);
        showToast(`تمت مزامنة درجات (${periodName}) بنجاح لجميع أولياء أمور وجبة (${selectedList.name})`, 'success');
      } else {
        showToast('خطأ: لا يوجد اتصال بخادم المزامنة', 'error');
      }

      logActivity({
        action: 'مزامنة الدرجات',
        details: `تمت مزامنة درجات (${periodName}) للقائمة: ${selectedList.name} لعدد ${studentCount} طالباً`,
        targetId: selectedList.id,
        targetType: 'academic_list',
        targetName: selectedList.name
      });
    } catch (err) {
      console.error(err);
      showToast('فشل في المزامنة مع قاعدة البيانات', 'error');
    }
  };

  const getStageKey = (grade: string): 'primary' | 'intermediate' | 'scientific' | 'literary' => {
    if (grade.includes('ابتدائي')) return 'primary';
    if (grade.includes('متوسط')) return 'intermediate';
    if (grade.includes('علمي')) return 'scientific';
    if (grade.includes('أدبي')) return 'literary';
    return 'scientific';
  };

  const uniqueSavedLists = useMemo(() => {
    const map = new Map<string, any>();
    (savedLists || []).forEach((l, idx) => {
      const id = l?.id || `list_${idx}`;
      if (!map.has(id)) {
        map.set(id, l);
      }
    });
    return Array.from(map.values());
  }, [savedLists]);

  const isArchivedList = (l: any) => {
    if (!l) return false;
    return Boolean(
      l.isArchive || 
      l.isArchived || 
      (typeof l.name === 'string' && l.name.startsWith('[أرشيف')) || 
      l.archiveYear
    );
  };

  const activeSavedLists = useMemo(() => {
    return uniqueSavedLists.filter(l => !isArchivedList(l));
  }, [uniqueSavedLists]);

  const archivedSavedLists = useMemo(() => {
    return uniqueSavedLists.filter(l => isArchivedList(l));
  }, [uniqueSavedLists]);

  const archiveYears = useMemo(() => {
    const set = new Set<string>();
    archivedSavedLists.forEach(l => {
      const year = l.archiveYear || (typeof l.name === 'string' ? l.name.match(/\[أرشيف\s*([0-9\u0660-\u0669-]+)\]/)?.[1] : null);
      if (year) set.add(year);
    });
    return Array.from(set);
  }, [archivedSavedLists]);

  const displayedArchivedLists = useMemo(() => {
    return archivedSavedLists.filter(l => {
      const listStudents = Array.isArray(l.students) ? l.students : [];
      const matchesSearch = (l.name || '').toLowerCase().includes(archiveSearch.toLowerCase()) ||
        listStudents.some((s: any) => (s?.name || '').toLowerCase().includes(archiveSearch.toLowerCase()));
      if (archiveSearch && !matchesSearch) return false;

      if (archiveYearFilter !== 'all') {
        const year = l.archiveYear || (typeof l.name === 'string' ? l.name.match(/\[أرشيف\s*([0-9\u0660-\u0669-]+)\]/)?.[1] : null);
        if (year && !year.includes(archiveYearFilter)) return false;
      }
      return true;
    }).sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
  }, [archivedSavedLists, archiveSearch, archiveYearFilter]);

  const allStudentsGlobal = useMemo(() => 
    activeSavedLists.flatMap(list => (list.students || []).map((s: any) => ({ ...s, listId: list.id, listName: list.name }))),
    [activeSavedLists]
  );

  const renderMainTabSelector = () => (
    <div className="flex justify-center items-center pb-2 mb-2 px-3 sm:px-0">
      <div className="flex bg-[#101935]/90 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-2xl w-full max-w-3xl justify-stretch flex-col sm:flex-row gap-1.5">
        <button
          onClick={() => { setMainTab('academic'); setSelectedList(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            (mainTab as string) === 'academic'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
              : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Users size={14} />
          <span>شؤون ورصد الدرجات</span>
        </button>
        <button
          onClick={() => { setMainTab('excellence'); setSelectedList(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            (mainTab as string) === 'excellence'
              ? 'bg-gradient-to-r from-[#FFD600] to-amber-500 text-black shadow-lg border border-amber-400/20'
              : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <Star size={14} fill={(mainTab as string) === 'excellence' ? 'currentColor' : 'none'} />
          <span>سجل التميز والأوسمة 🏅</span>
        </button>
        <button
          onClick={() => { setMainTab('books'); setSelectedList(null); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            (mainTab as string) === 'books'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg border border-emerald-400/20'
              : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <BookOpen size={14} />
          <span>جرد وتوزيع الكتب</span>
        </button>

      </div>
    </div>
  );
  
  const handleGlobalUpdateStudent = async (studentCode: string, listId: string, updates: any) => {
    const list = savedLists.find(l => l.id === listId);
    if (!list) return;
    
    const updatedList = {
      ...list,
      students: list.students.map((s: any) => 
        (s.student === studentCode || s.code === studentCode) ? { ...s, ...updates } : s
      )
    };
    
    setSavedLists(prev => prev.map(l => l.id === listId ? updatedList : l));
    if (onUpdateList) onUpdateList(updatedList);

    try {
       const studentDocId = `${list.schoolId}_${studentCode}`.replace(/\s+/g, '_');
       await academicService.updateStudentDirect(studentDocId, updates);
    } catch (e) {
       console.warn("Could not sync global update to school_students", e);
    }
  };

  const studentsWithProfileCache = useMemo(() => {
      return allStudentsGlobal.map(student => {
           const listForStudent = savedLists.find(l => l.id === student.listId);
           const academicProfile = computeAcademicIdentity(student, listForStudent, subjectMapping || null);
           return { ...student, _academicProfile: academicProfile, _totalBadges: academicProfile.totalBadges };
      });
  }, [allStudentsGlobal, savedLists, subjectMapping]);

  const hasAnyGeneralExemption = useMemo(() => {
      return studentsWithProfileCache.some(s => s._academicProfile?.generalExemption === true);
  }, [studentsWithProfileCache]);

  const hasAnyIndividualExemption = useMemo(() => {
      return studentsWithProfileCache.some(s => s._academicProfile?.individualExemptions && s._academicProfile.individualExemptions.length > 0);
  }, [studentsWithProfileCache]);

  const exemptedStudents = useMemo(() => {
      if (mainTab !== 'excellence') return [];
      return studentsWithProfileCache.filter(s => {
          if (selectedExcellenceClass !== 'all') {
             const normalize = (val: string) => val.replace(/الصف\s+/g, '').replace(/ال/g, '').replace(/\s+/g, '').trim();
             const normGrade = normalize(s.grade || s.listName || '');
             const normSelected = normalize(selectedExcellenceClass);
             if (!normGrade.includes(normSelected) && !normSelected.includes(normGrade)) {
                return false;
             }
          }
          if (selectedExcellenceStage !== 'all') {
             const gradeStr = (s.grade || s.listName || '');
             if (selectedExcellenceStage === 'primary' && !gradeStr.includes('ابتدائي')) return false;
             if (selectedExcellenceStage === 'intermediate' && !gradeStr.includes('متوسط')) return false;
             if (selectedExcellenceStage === 'high' && !(gradeStr.includes('علمي') || gradeStr.includes('أدبي') || gradeStr.includes('اعدادي') || gradeStr.includes('إعدادي') || gradeStr.includes('سادس') || gradeStr.includes('خامس') || gradeStr.includes('رابع'))) return false;
          }
          if (selectedExcellenceExemption === 'individual') {
             if (s._academicProfile?.generalExemption === true) return false;
             return s._academicProfile?.individualExemptions && s._academicProfile.individualExemptions.length > 0;
          }
          return s._academicProfile?.generalExemption === true;
      });
  }, [studentsWithProfileCache, mainTab, selectedExcellenceClass, selectedExcellenceStage, selectedExcellenceExemption]);

  const finalSortedStudents = useMemo(() => {
      if (mainTab !== 'excellence') return [];
      
      const sortedStudents = [...studentsWithProfileCache]
        .filter(s => {
          const matchesSearch = (s.name || '').toLowerCase().includes(excellenceSearch.toLowerCase());
          if (!matchesSearch) return false;
          
          const gradeStr = (s.grade || s.listName || '');
          if (selectedExcellenceClass !== 'all') {
             const normalize = (val: string) => val.replace(/الصف\s+/g, '').replace(/ال/g, '').replace(/\s+/g, '').trim();
             const normGrade = normalize(gradeStr);
             const normSelected = normalize(selectedExcellenceClass);
             if (!normGrade.includes(normSelected) && !normSelected.includes(normGrade)) {
                return false;
             }
          }

          if (selectedExcellenceExemption === 'general') {
             if (s._academicProfile?.generalExemption !== true) return false;
          } else if (selectedExcellenceExemption === 'individual') {
             if (s._academicProfile?.generalExemption === true || !(s._academicProfile?.individualExemptions && s._academicProfile.individualExemptions.length > 0)) return false;
          }
          
          if (selectedExcellenceStage === 'all') return true;
          if (selectedExcellenceStage === 'primary' && gradeStr.includes('ابتدائي')) return true;
          if (selectedExcellenceStage === 'intermediate' && gradeStr.includes('متوسط')) return true;
          if (selectedExcellenceStage === 'high' && (gradeStr.includes('علمي') || gradeStr.includes('أدبي') || gradeStr.includes('اعدادي') || gradeStr.includes('إعدادي') || gradeStr.includes('سادس') || gradeStr.includes('خامس') || gradeStr.includes('رابع'))) return true;
          return false;
        })
        .map(stu => {
           const list = savedLists.find(l => l.id === stu.listId);
           const studentSubjects = getSubjectsForGrade(stu.grade || list?.name || '', list?.removedSubjects || [], subjectMapping || null);
           
           let sum = 0, count = 0;
           let badgesBonus = 0;
           let improvementBonus = 0;
           let goldBadges = 0, silverBadges = 0, bronzeBadges = 0;
           let badgesEarnedInPeriod = 0;
           let basePoints = 0;

           const period = selectedExcellencePeriod;
           
           if (period === 'all') {
               const prof = stu._academicProfile;
               let allSum = 0, allCount = 0;
               if (stu.grades) {
                   ['month1', 'month2', 'term1_avg', 'mid', 'month3', 'month4', 'term2_avg', 'annual_quest', 'final', 'final_grade'].forEach(p => {
                      Object.values(stu.grades[p] || {}).forEach((v: any) => {
                         const n = Number(v);
                         if (!isNaN(n)) { allSum += n; allCount++; }
                      });
                   });
               }
               const avg = allCount > 0 ? parseFloat((allSum / allCount).toFixed(2)) : 0;
               basePoints = avg;

               if (prof) {
                   prof.subjectBadgesArray?.forEach((b: any) => {
                        if (b.config?.level === 'elite' || b.config?.level === 'gold' || b.badge?.level === 'elite' || b.badge?.level === 'gold') {
                            goldBadges++; badgesBonus += 10;
                        } else if (b.config?.level === 'silver' || b.badge?.level === 'silver') {
                            silverBadges++; badgesBonus += 6;
                        } else {
                            bronzeBadges++; badgesBonus += 3;
                        }
                   });
                   prof.improvementBadges?.forEach((b: any) => {
                        improvementBonus += 5;
                   });
                   if (prof.individualExemptions?.length > 0) badgesBonus += prof.individualExemptions.length * 10;
                   if (prof.generalExemption) badgesBonus += 50;
                   badgesEarnedInPeriod = prof.totalBadges || 0;
               }
           } else {
               const pGrades = stu.grades?.[period] || {};
               
               studentSubjects.forEach(subj => {
                   const sStr = pGrades[subj.id];
                   const s = Number(sStr);
                   if (sStr !== undefined && sStr !== null && sStr !== '' && !isNaN(s)) {
                       sum += s;
                       count++;
                       
                       let subjKey = Object.keys(SUBJECT_BADGES_CONFIG).find(k => subj.name.includes(k) && k !== 'default') || 'default';
                       const config = SUBJECT_BADGES_CONFIG[subjKey];
                       if (config && config.badges) {
                           const badgeDef = config.badges.find((b: any) => s >= b.score);
                           if (badgeDef && s >= 50) {
                              badgesEarnedInPeriod++;
                              if (badgeDef.level === 'elite' || badgeDef.level === 'gold') {
                                  goldBadges++; badgesBonus += 10;
                              } else if (badgeDef.level === 'silver') {
                                  silverBadges++; badgesBonus += 6;
                              } else {
                                  bronzeBadges++; badgesBonus += 3;
                              }
                           }
                       }
                   }
               });
               basePoints = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
           }

           let continuityBonus = 0;
           let elitePeriods = 0;
           const allPeriods = ['month1', 'month2', 'term1_avg', 'mid', 'month3', 'month4', 'term2_avg', 'annual_quest', 'final', 'final_grade'];
           allPeriods.forEach(p => {
               let pSum = 0, pCount = 0;
               const pGr = stu.grades?.[p];
               if (pGr) {
                   Object.values(pGr).forEach((v: any) => {
                       const s = Number(v);
                       if (!isNaN(s)) { pSum += s; pCount++; }
                   });
                   if (pCount > 0 && pSum / pCount >= 90) {
                       elitePeriods++;
                   }
               }
           });
           
           if (elitePeriods >= 3) continuityBonus = 15;
           else if (elitePeriods >= 2) continuityBonus = 10;

           const totalPoints = basePoints + badgesBonus + improvementBonus + continuityBonus;
           
           return {
               ...stu,
               _excellence: {
                   basePoints,
                   badgesBonus,
                   improvementBonus,
                   continuityBonus,
                   totalPoints,
                   badgesEarnedInPeriod,
                   goldBadges,
                   silverBadges,
                   bronzeBadges,
                   elitePeriods
               }
           };
        })
        .sort((a, b) => {
           if (b._excellence.totalPoints !== a._excellence.totalPoints) {
               return b._excellence.totalPoints - a._excellence.totalPoints;
           }
           if (b._excellence.badgesEarnedInPeriod !== a._excellence.badgesEarnedInPeriod) {
               return b._excellence.badgesEarnedInPeriod - a._excellence.badgesEarnedInPeriod;
           }
           if (b._excellence.improvementBonus !== a._excellence.improvementBonus) {
               return b._excellence.improvementBonus - a._excellence.improvementBonus;
           }
           if (b._excellence.elitePeriods !== a._excellence.elitePeriods) {
               return b._excellence.elitePeriods - a._excellence.elitePeriods;
           }
           return b._excellence.basePoints - a._excellence.basePoints;
        });

      const maxBase = Math.max(0, ...sortedStudents.map(s => s._excellence.basePoints));
      const maxBadges = Math.max(0, ...sortedStudents.map(s => s._excellence.badgesEarnedInPeriod));
      const maxImprovement = Math.max(0, ...sortedStudents.map(s => s._excellence.improvementBonus));
      const maxElite = Math.max(0, ...sortedStudents.map(s => s._excellence.elitePeriods));

      const mappedStudents = sortedStudents.map(s => {
         const ex = s._excellence;
         let dynamicTitle = 'بطل التميز 🏅';
         
         if (ex.basePoints === maxBase && maxBase >= 90) dynamicTitle = 'ملك التفوق 👑';
         else if (ex.continuityBonus === 15 && ex.elitePeriods === maxElite && ex.elitePeriods >= 3) dynamicTitle = 'أسطورة التميز ⚓';
         else if (ex.improvementBonus === maxImprovement && maxImprovement > 0) dynamicTitle = 'نجم التطور 🚀';
         else if (ex.badgesEarnedInPeriod === maxBadges && maxBadges >= 3) dynamicTitle = 'جامع الأوسمة 🎖️';

         return { ...s, _excellence: { ...ex, dynamicTitle } };
      });

      if (selectedExcellenceClass !== 'all') {
         const top3 = mappedStudents.slice(0, 3);
         const rest = mappedStudents.slice(3);
         rest.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
         return [...top3, ...rest];
      }
      return mappedStudents; if (false) sortedStudents.map(s => {
      //
      });
  }, [studentsWithProfileCache, mainTab, excellenceSearch, selectedExcellenceClass, selectedExcellenceStage, selectedExcellencePeriod, selectedExcellenceExemption, savedLists, subjectMapping]);

  useEffect(() => {
     if ((mainTab as string) === 'excellence') {
         if (selectedExcellenceClass !== 'all' && finalSortedStudents.length > 0) {
             setActiveExcellenceStudentCode(finalSortedStudents[0].student || finalSortedStudents[0].code);
         } else if (selectedExcellenceClass === 'all') {
             setActiveExcellenceStudentCode(null);
         }
     }
  }, [selectedExcellenceClass, finalSortedStudents.length, mainTab]);


  if ((mainTab as string) === 'excellence') {
    // Get top 3 podiums based on current filter
    const podiums = finalSortedStudents.slice(0, 3);

    const availableClasses = savedLists.filter(list => {
      if (selectedExcellenceStage === 'all') return true;
      const gradeStr = (list.name || '').toLowerCase();
      if (selectedExcellenceStage === 'primary' && gradeStr.includes('ابتدائي')) return true;
      if (selectedExcellenceStage === 'intermediate' && gradeStr.includes('متوسط')) return true;
      if (selectedExcellenceStage === 'high' && (gradeStr.includes('علمي') || gradeStr.includes('أدبي') || gradeStr.includes('اعدادي') || gradeStr.includes('إعدادي') || gradeStr.includes('سادس') || gradeStr.includes('خامس') || gradeStr.includes('رابع'))) return true;
      return false;
    });

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {/* Floating Crown/Honor Button for General Exemption Elite Students */}
        {false && exemptedStudents.length > 0 && (
          <div className="fixed bottom-8 right-8 z-[999]">
             <button
               id="btn-exemptions-fab"
               onClick={() => setShowExemptionsPanel(true)}
               className="relative group p-4 bg-gradient-to-r from-[#FFD600] to-amber-500 hover:from-amber-400 hover:to-amber-600 rounded-full shadow-[0_10px_35px_rgba(255,214,0,0.5)] active:scale-95 transition-all duration-300 border-2 border-white/20 flex items-center justify-center gap-2 text-black cursor-pointer animate-pulse animate-bounce"
             >
                <div className="absolute inset-0 rounded-full animate-ping bg-[#FFD600]/30 -z-10" />
                <span className="text-xl">👑</span>
                <span className="text-black font-black text-xs hidden md:inline ml-1 font-sans">كشف الإعفاء العام ({exemptedStudents.length})</span>
             </button>
          </div>
        )}

        {/* Prestigious Exempted Students Overlay Dialog */}
        <AnimatePresence>
          {showExemptionsPanel && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
               <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-gradient-to-b from-[#0e1633] to-[#060a1c] border-2 border-[#FFD600]/30 rounded-[2.5rem] w-full max-w-2xl p-6 md:p-8 shadow-[0_25px_60px_rgba(255,214,0,0.25)] relative overflow-hidden text-right"
                 style={{ direction: 'rtl' }}
               >
                  {/* Glowing background circles */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFD600]/10 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/5 blur-3xl pointer-events-none" />

                  {/* Absolute Close Button */}
                  <button 
                    onClick={() => setShowExemptionsPanel(false)}
                    className="absolute left-6 top-6 w-9 h-9 rounded-xl bg-white/5 text-white/60 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                  >
                     <X size={18} />
                  </button>

                  {/* Header Title */}
                  <div className="flex items-center gap-3 mb-4 mt-2">
                     <span className="text-3xl">{selectedExcellenceExemption === 'individual' ? '🏅' : '👑'}</span>
                     <div className="text-right">
                        <h3 className={`font-black text-lg md:text-xl tracking-wide font-sans ${selectedExcellenceExemption === 'individual' ? 'text-emerald-400' : 'text-[#FFD600]'}`}>
                           {selectedExcellenceExemption === 'individual' ? 'لوحـة صدارة ونخبة الإعفـاء الفـردي' : 'لوحـة صدارة ونخبة الإعفـاء العـام'}
                        </h3>
                        <p className="text-white/40 text-[10px] md:text-xs font-bold mt-1 font-sans">
                           {selectedExcellenceExemption === 'individual' ? 'الطلبة الحاصلون على درجة 90% فأكثر في مادة واحدة أو أكثر (فرسان الأوسمة الفردية)' : 'الطلبة الحاصلون على معدل عام 85% فأكثر دون أي درجة مادة تقل عن 75% (كسور معدلّة لصالح الطالب)'}
                        </p>
                     </div>
                  </div>

                  <div className="border-t border-white/10 my-4" />

                  {/* Exempted Students Directory */}
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                     {exemptedStudents.map((stu: any, sIdx: number) => {
                         const rawGrades = stu.grades || {};
                         // Compute student subject averages and count
                         const listForStudent = savedLists.find(l => l.id === stu.listId);
                         const studentSubjects = getSubjectsForGrade(stu.grade || listForStudent?.name || '', listForStudent?.removedSubjects || [], subjectMapping || null);
                         
                         let sumScores = 0, countScores = 0;
                         studentSubjects.forEach(subj => {
                            let scores: number[] = [];
                            ['month1', 'month2', 'midterm', 'month3', 'month4', 'final'].forEach(p => {
                               const sStr = rawGrades[p]?.[subj.id];
                               const s = Number(sStr);
                               if (sStr !== undefined && sStr !== null && sStr !== '' && !isNaN(s)) {
                                  scores.push(s);
                               }
                            });
                            if (scores.length > 0) {
                               const subjAvg = Math.ceil(scores.reduce((a, b) => a + b, 0) / scores.length);
                               sumScores += subjAvg;
                               countScores++;
                            }
                         });
                         const finalExAvg = countScores > 0 ? Math.ceil(sumScores / countScores) : 0;

                         return (
                            <div key={stu.student || sIdx} className="bg-[#101935]/60 hover:bg-[#101935]/90 border border-white/5 hover:border-[#FFD600]/20 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                               <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl whitespace-nowrap ${selectedExcellenceExemption === 'individual' ? 'border-emerald-500 bg-[#101935] text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'border-[#FFD600] bg-[#1a2342] text-amber-300 shadow-[0_0_15px_rgba(255,214,0,0.2)]'}`}>
                                     {selectedExcellenceExemption === 'individual' ? '🏅' : '👑'}
                                  </div>
                                  <div className="text-right">
                                     <h4 className="text-white font-extrabold text-sm font-sans">{stu.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <span className={`font-black text-[10px] px-2 py-0.5 rounded-full font-sans border ${selectedExcellenceExemption === 'individual' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-[#FFD600] bg-[#FFD600]/10 border-[#FFD600]/20'}`}>{selectedExcellenceExemption === 'individual' ? `مواد الإعفاء (${stu._academicProfile?.individualExemptions?.length || 0}): ${stu._academicProfile?.individualExemptions?.join(' • ')}` : `المعدل العام: ${finalExAvg}%`}</span>
                                        <span className="text-zinc-400 font-bold text-[10px] font-sans">{stu.grade || stu.listName}</span>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex gap-2 shrink-0">
                                  <button
                                     onClick={() => {
                                        setActiveExcellenceStudentCode(stu.student || stu.code);
                                        setShowExemptionsPanel(false);
                                        setTimeout(() => {
                                           const el = document.getElementById('excellence-student-detail-panel');
                                           if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 100);
                                     }}
                                     className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] rounded-xl border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1 text-center font-sans"
                                  >
                                     <Star size={12} className="text-[#FFD600] fill-[#FFD600]" />
                                     عرض الهوية الشرفية
                                  </button>
                                  <button
                                     onClick={() => {
                                        // Auto select this student
                                        setActiveExcellenceStudentCode(stu.student || stu.code);
                                        // Trigger share modal
                                        setIsExcellenceShareModalOpen(true);
                                        // Close exemptions list
                                        setShowExemptionsPanel(false);
                                     }}
                                     className="px-3 py-2 bg-gradient-to-r from-[#FFD600] to-yellow-500 hover:to-[#FFD600] text-black font-black text-[10px] rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 font-sans"
                                  >
                                     <Share2 size={12} />
                                     توليد بطاقة الإعفاء الفاخرة
                                  </button>
                               </div>
                            </div>
                         );
                     })}
                  </div>

                  <div className="border-t border-white/10 my-4" />

                  <div className="text-center">
                     <p className="text-white/30 text-[9px] font-bold font-sans">بوابة بيرق - الإصدار السنوي السادس الاحترافي</p>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Sparkle Confetti Layer */}
        {visualConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden bg-black/10">
            {/* Ambient Screen Flash */}
            <div className="absolute inset-0 bg-white pointer-events-none animate-[flash-white_0.8s_ease-out_forwards]" />
            
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes flash-white {
                0% { opacity: 0; }
                10% { opacity: 0.25; }
                100% { opacity: 0; }
              }
              @keyframes ring-expand {
                0% { transform: scale(0.5); opacity: 0.8; }
                100% { transform: scale(3.5); opacity: 0; }
              }
            `}} />

            {/* Radial glowing core */}
            <div className="absolute w-64 h-64 bg-gradient-to-r from-[#FFD600] to-amber-500 rounded-full opacity-20 blur-3xl pointer-events-none animate-pulse" />
            
            {/* Expanding shockwave rings */}
            {[1, 2, 3].map((r) => (
              <div 
                key={`ring_${r}`}
                className="absolute rounded-full border-2 border-[#FFD600]/30 w-32 h-32 pointer-events-none"
                style={{
                  animation: `ring-expand 1.2s cubic-bezier(0.1, 0.8, 0.3, 1) ${r * 0.15}s forwards`
                }}
              />
            ))}

            {/* Colorful burst particles */}
            {Array.from({ length: 44 }).map((_, pi) => {
              const angle = (pi * 360) / 44;
              const speed = 120 + (pi % 4) * 60;
              const scale = 0.5 + Math.random() * 0.8;
              const emoji = ['✨', '🏆', '⭐', '🎈', '👑', '🎉', '⚡', '🏅'][pi % 8];
              const delay = (pi % 3) * 0.04;
              const duration = 1.0 + Math.random() * 0.6;
              
              const rad = (angle * Math.PI) / 180;
              const tx = Math.round(Math.cos(rad) * speed * 2.2);
              const ty = Math.round(Math.sin(rad) * speed * 2.2);
              
              const keyframeName = `blast_custom_${pi}`;
              
              return (
                <div 
                  key={`particle_${pi}`}
                  className="absolute font-bold text-xl pointer-events-none select-none"
                  style={{
                    animation: `${keyframeName} ${duration}s cubic-bezier(0.1, 0.9, 0.2, 1) ${delay}s forwards`,
                    textShadow: '0 0 12px rgba(255,214,0,0.6)',
                  }}
                >
                   {emoji}
                   <style dangerouslySetInnerHTML={{__html: `
                     @keyframes ${keyframeName} {
                       0% { transform: translate3d(0, 0, 0) scale(0.2) rotate(0deg); opacity: 1; }
                       100% { transform: translate3d(${tx}px, ${ty}px, 0) scale(${scale}) rotate(${Math.round(Math.random() * 360)}deg); opacity: 0; }
                     }
                   `}} />
                </div>
              );
            })}

            <div className="text-center space-y-4 relative z-10 animate-in zoom-in-75 duration-500">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-[#FFD600]/20 blur-xl rounded-full scale-125 animate-pulse" />
                <div className="relative text-7xl animate-bounce">👑</div>
              </div>
              <div className="bg-slate-900/95 backdrop-blur-xl px-8 py-4 rounded-[1.8rem] border-2 border-[#FFD600] text-[#FFD600] font-black text-xs tracking-wider uppercase shadow-[0_15px_50px_rgba(255,214,0,0.35)] max-w-sm mx-auto">
                <p className="text-[10px] text-white/50 mb-1">تمت العملية بنجاح</p>
                تم منح وسام ولقب شرفي مبهر! 🎉
              </div>
            </div>
          </div>
        )}

        {/* Centered Modern Unified Tabs Selector */}
        {renderMainTabSelector()}

        {/* Quick Motivation Banner */}
        <div className="bg-[#050812] border border-[#FFD600]/30 shadow-[0_0_20px_rgba(255,214,0,0.15)] rounded-2xl p-4 md:p-5 relative overflow-hidden flex flex-col items-center justify-center text-center w-[90%] md:w-3/4 max-w-2xl mx-auto mb-8">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD600]/5 to-transparent pointer-events-none" />
           
           <div className="text-center space-y-1.5 relative z-10 w-full flex flex-col items-center">
              <h2 className="text-sm md:text-base font-black text-[#FFD600] flex items-center gap-2 justify-center drop-shadow-[0_0_8px_rgba(255,214,0,0.6)]">
                <Star size={16} className="fill-[#FFD600]" />
                نظام نقاط التميز الذكي
              </h2>
              <p className="text-white/70 text-[10px] md:text-[11px] font-bold max-w-lg leading-relaxed mx-auto">
                نظام فوري متزامن مع لوحة ولي الأمر، يقوم بتوليد مكافآت تلقائية بناءً على (الدرجات، التطور، والثبات) دون الحاجة لإدخال مباشر للأوسمة.
              </p>
           </div>
        </div>

        {/* Podium Highlight (Top 3) */}
        {podiums.length > 0 && (
          <div className="flex flex-col items-center justify-center pt-8 pb-10 px-4 bg-gradient-to-b from-[#0a0f24] via-[#0d142b] to-[#0a0f24] rounded-[3rem] border border-white/5 relative overflow-hidden my-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] w-full">
             {/* Dramatic Cinematic Lighting Background */}
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#FFD600_0%,transparent_60%)] opacity-[0.03] pointer-events-none" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-[#FFD600]/20 blur-[140px] rounded-[100%] pointer-events-none" />
             <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />

             <h3 className="text-[#FFD600] font-black text-xs md:text-sm tracking-widest mb-10 flex items-center gap-3 relative z-20 px-6 py-2 rounded-full border border-[#FFD600]/20 bg-[#FFD600]/5 backdrop-blur-xl shadow-[0_0_20px_rgba(255,214,0,0.1)]">
                <span className="text-xl">🏆</span>
                منصـة الشـرف العُـليا
             </h3>

             {/* The Podiums Podium Blocks */}
             <div className="relative w-full max-w-lg md:max-w-2xl flex items-end justify-center gap-3 sm:gap-6 mt-12 pt-16 z-20">
                
                {/* 2nd Place Block (Right) */}
                {podiums[1] && (() => {
                   const pod = podiums[1];
                   return (
                      <div 
                         onClick={() => {
                            setActiveExcellenceStudentCode(pod.student || pod.code || null);
                            setTimeout(() => controlRoomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                         }}
                         className="flex flex-col items-center w-1/3 group cursor-pointer transition-all duration-500 hover:-translate-y-2 relative z-20"
                      >
                         {/* Avatar & Info above the block */}
                         <div className="flex flex-col items-center mb-4 text-center px-1 w-full">
                            <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-1 border-2 border-slate-300 flex items-center justify-center text-3xl md:text-4xl shadow-[0_0_30px_rgba(148,163,184,0.3)] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                 style={{ backgroundImage: pod.avatar ? `url(${pod.avatar})` : 'none' }}>
                               {!pod.avatar && '🥈'}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); fileInputRefs.current[`pod2_${pod.student}`]?.click(); }}
                                 className="absolute -bottom-1 -right-1 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white p-2 md:p-2.5 rounded-full border border-slate-600 shadow-xl transition-all z-30 transform hover:scale-110"
                               >
                                 <Camera size={14} className="md:w-5 md:h-5"/>
                               </button>
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 ref={el => { fileInputRefs.current[`pod2_${pod.student}`] = el; }}
                                 onChange={(e) => {
                                   if (e.target.files && e.target.files[0]) {
                                      handlePhotoUpload(pod.student || pod.code, pod.listId, e.target.files[0]);
                                   }
                                 }}
                               />
                            </div>
                            <span className="text-slate-200 text-xs md:text-sm font-black mt-3 block max-w-full truncate drop-shadow-md">{pod.name || pod.fullName}</span>
                            <span className="text-[9px] md:text-[10px] text-white/50 block font-bold truncate max-w-full mb-1.5">{pod.grade || pod.listName}</span>
                            <span className="bg-slate-400/10 text-slate-300 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full border border-slate-400/20 shadow-[0_0_15px_rgba(148,163,184,0.1)] flex items-center justify-center gap-1">
                               {pod._excellence?.totalPoints || 0} نقطة
                            </span>
                            <span className="text-slate-200 text-[10px] md:text-xs font-black mt-2 tracking-wide px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-600/50 block w-max max-w-full truncate">
                               {pod._excellence?.dynamicTitle || 'بطل التميز'}
                            </span>
                         </div>
                         
                         {/* Podium Pedestal */}
                         <div className="w-full h-28 md:h-36 bg-gradient-to-b from-slate-400/20 to-slate-400/5 border-t-4 border-slate-300/80 rounded-t-[1.5rem] flex flex-col justify-end items-center pb-4 backdrop-blur-lg relative overflow-hidden group-hover:from-slate-400/30 transition-all duration-500">
                            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-300/10 to-transparent pointer-events-none" />
                            <span className="text-slate-300 font-black text-4xl md:text-5xl leading-none drop-shadow-lg">2</span>
                            <span className="text-slate-400 text-[8px] md:text-[10px] font-extrabold tracking-[0.2em] uppercase mt-2">الثاني</span>
                         </div>
                      </div>
                   );
                })()}

                {/* 1st Place Block (Center - Taller and glowing) */}
                {podiums[0] && (() => {
                   const pod = podiums[0];
                   return (
                      <div 
                         onClick={() => {
                            setActiveExcellenceStudentCode(pod.student || pod.code || null);
                            setTimeout(() => controlRoomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                         }}
                         className="flex flex-col items-center w-[40%] group cursor-pointer transition-all duration-500 hover:-translate-y-3 relative z-30"
                      >
                         {/* Shiny Crown floating above */}
                         <div className="absolute -top-12 md:-top-16 text-3xl md:text-5xl animate-[bounce_2s_infinite]">👑</div>
                         <div className="absolute -top-12 inset-x-0 h-32 bg-[#FFD600]/20 blur-2xl rounded-full pointer-events-none" />
                         
                         {/* Avatar & Info above the block */}
                         <div className="flex flex-col items-center mb-4 text-center px-1 w-full relative">
                            <div className="relative w-24 h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-[#FFD600] to-yellow-300 p-1.5 border-2 border-[#FFD600] flex items-center justify-center text-4xl md:text-5xl shadow-[0_0_50px_rgba(255,214,0,0.4)] transition-transform duration-500 group-hover:scale-105 group-hover:shadow-[0_0_70px_rgba(255,214,0,0.6)]">
                               <div className="w-full h-full rounded-full bg-[#0a0f24] flex items-center justify-center bg-cover bg-center overflow-hidden relative"
                                    style={{ backgroundImage: pod.avatar ? `url(${pod.avatar})` : 'none' }}>
                                  {!pod.avatar && '🥇'}
                                  <div className="absolute inset-0 rounded-full ring-inset ring-2 ring-black/20" />
                               </div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); fileInputRefs.current[`pod1_${pod.student}`]?.click(); }}
                                 className="absolute bottom-1 -right-1 bg-slate-900 hover:bg-[#FFD600] text-[#FFD600] hover:text-slate-900 p-2 md:p-3 rounded-full border border-[#FFD600] shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-all z-40 transform hover:scale-110"
                               >
                                 <Camera size={18} className="md:w-6 md:h-6"/>
                               </button>
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 ref={el => { fileInputRefs.current[`pod1_${pod.student}`] = el; }}
                                 onChange={(e) => {
                                   if (e.target.files && e.target.files[0]) {
                                      handlePhotoUpload(pod.student || pod.code, pod.listId, e.target.files[0]);
                                   }
                                 }}
                               />
                            </div>
                            <span className="text-[#FFD600] text-sm md:text-base font-black mt-4 block max-w-full truncate drop-shadow-lg">{pod.name || pod.fullName}</span>
                            <span className="text-[10px] md:text-xs text-white/60 block font-bold truncate max-w-full mb-1.5">{pod.grade || pod.listName}</span>
                            <span className="bg-gradient-to-r from-[#FFD600]/20 to-amber-500/20 text-[#FFD600] text-[11px] font-black px-4 py-1.5 rounded-full border border-[#FFD600]/30 shadow-[0_0_20px_rgba(255,214,0,0.2)] flex items-center justify-center gap-1">
                               {pod._excellence?.totalPoints || 0} نقطة
                            </span>
                            <span className="text-[#FFD600] text-xs md:text-sm font-black mt-2 tracking-wide px-3 py-1 rounded-md bg-[#FFD600]/10 border border-[#FFD600]/50 block w-max max-w-full truncate drop-shadow-md">
                               {pod._excellence?.dynamicTitle || 'بطل التميز'}
                            </span>
                         </div>
                         
                         {/* Podium Pedestal */}
                         <div className="w-full h-36 md:h-48 bg-gradient-to-b from-[#FFD600]/30 to-[#FFD600]/5 border-t-4 border-[#FFD600] rounded-t-[1.5rem] md:rounded-t-[2rem] flex flex-col justify-end items-center pb-5 backdrop-blur-xl relative overflow-hidden group-hover:from-[#FFD600]/40 transition-all duration-500 shadow-[0_-5px_30px_rgba(255,214,0,0.15)]">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#FFD600]/20 to-transparent pointer-events-none" />
                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-[#FFD600]/30 to-transparent" />
                            <span className="text-[#FFD600] font-black text-5xl md:text-7xl leading-none drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]">1</span>
                            <span className="text-amber-500 text-[9px] md:text-[11px] font-extrabold tracking-[0.2em] uppercase mt-2">الأول</span>
                         </div>
                      </div>
                   );
                })()}

                {/* 3rd Place Block (Left) */}
                {podiums[2] && (() => {
                   const pod = podiums[2];
                   return (
                      <div 
                         onClick={() => {
                            setActiveExcellenceStudentCode(pod.student || pod.code || null);
                            setTimeout(() => controlRoomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                         }}
                         className="flex flex-col items-center w-1/3 group cursor-pointer transition-all duration-500 hover:-translate-y-2 relative z-20"
                      >
                         {/* Avatar & Info above the block */}
                         <div className="flex flex-col items-center mb-4 text-center px-1 w-full">
                            <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 p-1 border-2 border-amber-600 flex items-center justify-center text-3xl md:text-4xl shadow-[0_0_25px_rgba(217,119,6,0.3)] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                 style={{ backgroundImage: pod.avatar ? `url(${pod.avatar})` : 'none' }}>
                               {!pod.avatar && '🥉'}
                               <button 
                                 onClick={(e) => { e.stopPropagation(); fileInputRefs.current[`pod3_${pod.student}`]?.click(); }}
                                 className="absolute -bottom-1 -right-1 bg-slate-900 hover:bg-amber-700 text-amber-500 hover:text-white p-1.5 md:p-2 rounded-full border border-amber-800 shadow-xl transition-all z-30 transform hover:scale-110"
                               >
                                 <Camera size={14} className="md:w-5 md:h-5" />
                               </button>
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 ref={el => { fileInputRefs.current[`pod3_${pod.student}`] = el; }}
                                 onChange={(e) => {
                                   if (e.target.files && e.target.files[0]) {
                                      handlePhotoUpload(pod.student || pod.code, pod.listId, e.target.files[0]);
                                   }
                                 }}
                               />
                            </div>
                            <span className="text-amber-500 text-[11px] md:text-xs font-black mt-3 block max-w-full truncate drop-shadow-md">{pod.name || pod.fullName}</span>
                            <span className="text-[8px] md:text-[9px] text-white/40 block font-bold truncate max-w-full mb-1.5">{pod.grade || pod.listName}</span>
                            <span className="bg-amber-600/10 text-amber-500 text-[9px] font-black px-2.5 py-1 rounded-full border border-amber-600/20 shadow-[0_0_10px_rgba(217,119,6,0.1)] flex items-center justify-center gap-1">
                               {pod._excellence?.totalPoints || 0} نقطة
                            </span>
                            <span className="text-amber-500 text-[9px] md:text-[10px] font-black mt-2 tracking-wide px-2 py-0.5 rounded-md bg-amber-900/40 border border-amber-700/50 block w-max max-w-full truncate">
                               {pod._excellence?.dynamicTitle || 'بطل التميز'}
                            </span>
                         </div>
                         
                         {/* Podium Pedestal */}
                         <div className="w-full h-20 md:h-28 bg-gradient-to-b from-amber-700/20 to-amber-700/5 border-t-4 border-amber-600/80 rounded-t-[1.3rem] flex flex-col justify-end items-center pb-3 backdrop-blur-lg relative overflow-hidden group-hover:from-amber-700/30 transition-all duration-500">
                            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-amber-600/10 to-transparent pointer-events-none" />
                            <span className="text-amber-500/80 font-black text-3xl md:text-4xl leading-none drop-shadow-lg">3</span>
                            <span className="text-amber-600/80 text-[7px] md:text-[9px] font-extrabold tracking-[0.2em] uppercase mt-1.5">الثالث</span>
                         </div>
                      </div>
                   );
                })()}

             </div>
          </div>
        )}

        {/* Stages & Classes Filter Bar */}
        <div className="flex flex-col gap-4 bg-gradient-to-br from-[#121c3f] to-[#0b1229] border border-white/10 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-[#FFD600]/[0.02] pointer-events-none" />
           <div className="flex items-center gap-3 mb-2 flex-col md:flex-row justify-between relative z-10 w-full">
              <h3 className="text-white/60 font-black text-xs md:text-sm tracking-wide flexitems-center gap-2">
                 <Filter size={16} className="inline-block mr-1 text-white/40"/>
                 تصفية سجل التميز
              </h3>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0 items-center">
                 <select
                    value={selectedExcellencePeriod}
                    onChange={(e) => setSelectedExcellencePeriod(e.target.value)}
                    className="bg-black/40 text-amber-400 text-sm font-black border border-amber-400/20 rounded-full py-2 px-4 outline-none focus:border-[#FFD600]/50 transition-colors cursor-pointer w-full md:w-max"
                 >
                    <option value="all">الأوسمة التراكمية</option>
                    <option value="month1">الشهر الأول</option>
                    <option value="month2">الشهر الثاني</option>
                    <option value="term1_avg">معدل الفصل الأول</option>
                    <option value="mid">نصف السنة</option>
                    <option value="month3">الشهر الأول ف2</option>
                    <option value="month4">الشهر الثاني ف2</option>
                    <option value="term2_avg">معدل الفصل الثاني</option>
                    <option value="annual_quest">معدل السعي السنوي</option>
                    <option value="final">آخر السنة</option>
                    <option value="final_grade">الدرجة النهائية</option>
                 </select>
                 <select
                    value={selectedExcellenceClass}
                    onChange={(e) => setSelectedExcellenceClass(e.target.value)}
                    className="bg-black/40 text-white/80 text-sm font-black border border-white/10 rounded-full py-2 px-4 outline-none focus:border-[#FFD600]/50 transition-colors cursor-pointer w-full md:w-max"
                 >
                    <option value="all">كافة الصفوف (مدمج)</option>
                    {(selectedExcellenceStage === 'all' || selectedExcellenceStage === 'primary') && (
                       <>
                          <option value="الأول الابتدائي">الأول الابتدائي</option>
                          <option value="الثاني الابتدائي">الثاني الابتدائي</option>
                          <option value="الثالث الابتدائي">الثالث الابتدائي</option>
                          <option value="الرابع الابتدائي">الرابع الابتدائي</option>
                          <option value="الخامس الابتدائي">الخامس الابتدائي</option>
                          <option value="السادس الابتدائي">السادس الابتدائي</option>
                       </>
                    )}
                    {(selectedExcellenceStage === 'all' || selectedExcellenceStage === 'intermediate') && (
                       <>
                          <option value="الأول المتوسط">الأول المتوسط</option>
                          <option value="الثاني المتوسط">الثاني المتوسط</option>
                          <option value="الثالث المتوسط">الثالث المتوسط</option>
                       </>
                    )}
                    {(selectedExcellenceStage === 'all' || selectedExcellenceStage === 'high') && (
                       <>
                          <option value="الرابع العلمي">الرابع العلمي</option>
                          <option value="الرابع الأدبي">الرابع الأدبي</option>
                          <option value="الخامس العلمي">الخامس العلمي</option>
                          <option value="الخامس الأدبي">الخامس الأدبي</option>
                          <option value="السادس العلمي">السادس العلمي</option>
                          <option value="السادس الأدبي">السادس الأدبي</option>
                       </>
                    )}
                 </select>
                  {/* Dropdown for Exemption Filter - only appears if there are students with any exemption */}
                  {(hasAnyGeneralExemption || hasAnyIndividualExemption) && (
                     <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                           value={selectedExcellenceExemption}
                           onChange={(e) => setSelectedExcellenceExemption(e.target.value)}
                           className="bg-gradient-to-l from-amber-600/30 to-yellow-600/10 text-amber-300 text-sm font-black border border-amber-500/30 rounded-full py-2 px-4 outline-none focus:border-[#FFD600] transition-all cursor-pointer w-full md:w-max shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                        >
                           <option value="all" className="bg-[#0c1228] text-white">البحث العام (كل المتميزين) 🎖️</option>
                           {hasAnyGeneralExemption && (
                              <option value="general" className="bg-[#0c1228] text-amber-300">مفلتر: طلاب الإعفاء العام 👑</option>
                           )}
                           {hasAnyIndividualExemption && (
                              <option value="individual" className="bg-[#0c1228] text-emerald-400">مفلتر: طلاب الإعفاء الفردي 🏅</option>
                           )}
                        </select>
                        {selectedExcellenceExemption !== 'all' && (
                           <button
                              id="btn-exemptions-overlay-trigger"
                              onClick={() => setShowExemptionsPanel(true)}
                              className={`p-2 rounded-full shadow-lg transition-all border flex items-center justify-center cursor-pointer shrink-0 w-9 h-9 ${
                                 selectedExcellenceExemption === 'general'
                                    ? 'bg-gradient-to-r from-[#FFD600]/20 to-[#FFD600]/10 border-[#FFD600]/40 text-[#FFD600] hover:scale-105 shadow-[0_0_15px_rgba(255,214,0,0.15)]'
                                    : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400 hover:scale-105'
                              }`}
                              title={selectedExcellenceExemption === 'general' ? 'عرض لوحة صدارة ونخبة الإعفاء العام' : 'عرض لوحة صدارة ونخبة الإعفاء الفردي'}
                           >
                              {selectedExcellenceExemption === 'general' ? '👑' : '🏅'}
                           </button>
                        )}
                     </div>
                  )}

                 <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10 w-full md:w-max overflow-x-auto hide-scrollbar">
                    {[
                   { id: 'all', title: 'كافة المراحل' },
                   { id: 'primary', title: 'الابتدائي' },
                   { id: 'intermediate', title: 'المتوسط' },
                   { id: 'high', title: 'الإعدادي' }
                 ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedExcellenceStage(tab.id as any);
                        setSelectedExcellenceClass('all'); 
                      }}
                      className={`px-5 py-2 min-w-max rounded-full text-[11px] font-black transition-all ${
                        selectedExcellenceStage === tab.id 
                          ? 'bg-gradient-to-r from-[#FFD600] to-yellow-500 text-black shadow-lg shadow-amber-500/20' 
                          : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {tab.title}
                    </button>
                 ))}
              </div>
              </div>
           </div>
        </div>

        {/* Selected Student Academic Identity Review Panel */}
        {activeExcellenceStudentCode && (() => {
           const currentStudentObj = allStudentsGlobal.find(s => (s.student === activeExcellenceStudentCode || s.code === activeExcellenceStudentCode));
           if (!currentStudentObj) return null;
           
           const listForStudent = savedLists.find(l => l.id === currentStudentObj.listId);
           const academicProfile = computeAcademicIdentity(currentStudentObj, listForStudent, subjectMapping || null);

           return (
             <div ref={controlRoomRef} className="bg-gradient-to-br from-[#121c3f] to-[#0b1229] border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 my-8">
                
                {/* Close Button */}
                <button 
                  onClick={() => setActiveExcellenceStudentCode(null)}
                  className="absolute left-6 top-6 w-8 h-8 rounded-lg bg-black/40 hover:bg-rose-500/20 text-white/50 hover:text-rose-400 flex items-center justify-center transition-colors border border-white/5 z-20"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-2 mb-6 relative z-10">
                   <span className="text-white text-[12px] font-black tracking-wide">الهوية الأكاديمية للطالب المتميز</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
                   {/* RIGHT SIDE: Badges and Stats */}
                   <div className="lg:col-span-8 space-y-6 w-full">
                         {/* Generate Card Button */}
                         <div className="flex justify-end w-full mb-2">
                             <button
                                onClick={() => setIsExcellenceShareModalOpen(true)}
                                className="relative z-10 px-8 py-3.5 bg-gradient-to-l from-[#FFD600] to-yellow-500 hover:to-[#FFD600] active:scale-95 transition-all rounded-full flex items-center gap-2.5 shadow-[0_5px_20px_rgba(255,214,0,0.3)] group-hover:shadow-[0_10px_30px_rgba(255,214,0,0.4)]"
                             >
                                <Share2 size={16} className="text-black" />
                                <span className="text-black font-black text-xs">بوابة بيرق - توليد بطاقة شرف للطالب</span>
                             </button>
                         </div>
                         
                         <ExcellenceShareModal
                            key="excellence-share-modal"
                            isOpen={isExcellenceShareModalOpen}
                            studentData={currentStudentObj}
                            academicProfile={academicProfile}
                            schoolName={displaySchoolName}
                            exportId="achievement-export-card-admin"
                            onClose={() => setIsExcellenceShareModalOpen(false)}
                         />

                         {/* Top Stats */}
                         <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
                               <span className="text-white/40 text-[9px] font-bold">إجمالي الأوسمة</span>
                               <span className="text-[#FFD600] font-black text-3xl">{academicProfile.totalBadges}</span>
                            </div>
                            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                               <span className="text-white/40 text-[9px] font-bold">المادة الأقوى</span>
                               <span className="text-white font-black text-[11px] md:text-xs mt-1.5 leading-tight text-center block">{academicProfile.strongestSubjectMap.name}</span>
                            </div>
                            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
                               <span className="text-white/40 text-[9px] font-bold">أعلى درجة مسجلة</span>
                               <span className="text-emerald-400 font-black text-3xl">{academicProfile.highestScore}</span>
                            </div>
                         </div>

                         {/* Badges Grid */}
                         <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {academicProfile.subjectBadgesArray.map((badgObj: any, bIdx: number) => (
                                <div key={`s_${bIdx}`} className={`relative overflow-hidden rounded-[1.5rem] border flex flex-col items-center p-4 text-center transition-all bg-gradient-to-br ${badgObj.config.colors} ${badgObj.badge.color} border-white/10 ${badgObj.badge.effect} shadow-lg`}>
                                   <div className="absolute inset-0 bg-black/40" />
                                   <span className="text-4xl relative z-10 drop-shadow-md mb-2 block w-full text-center">{badgObj.badge.icon}</span>
                                   <span className={`text-[11px] font-black relative z-10 w-full truncate block text-center ${badgObj.config.text}`}>{badgObj.badge.title}</span>
                                   <span className="text-[9px] font-bold text-white/60 relative z-10 w-full mt-2 block text-center">حقق {badgObj.measureWord} {badgObj.score}</span>
                                </div>
                            ))}
                            
                            {academicProfile.improvementBadges.map((badgObj: any, bIdx: number) => (
                                <div key={`i_${bIdx}`} className={`relative overflow-hidden rounded-[1.5rem] border flex flex-col items-center p-4 text-center transition-all bg-gradient-to-br from-indigo-800 to-purple-600 border-indigo-400/50 shadow-[0_0_20px_rgba(129,140,248,0.2)]`}>
                                   <div className="absolute inset-0 bg-black/20" />
                                   <span className="text-4xl relative z-10 drop-shadow-md mb-2 block w-full text-center">🚀</span>
                                   <span className="text-[11px] font-black relative z-10 w-full truncate text-indigo-200 block text-center">تطور ملحوظ</span>
                                   <span className="text-[8px] font-bold text-white/70 relative z-10 w-full mt-2 block text-center break-words">+ {badgObj.diff} {badgObj.measureWord} في {badgObj.subject}</span>
                                </div>
                            ))}
                            
                            {academicProfile.subjectBadgesArray.length === 0 && academicProfile.improvementBadges.length === 0 && (
                                <div className="col-span-full py-8 text-center text-white/20 font-bold text-xs italic bg-black/20 rounded-2xl border border-white/5">
                                   لا توجد أوسمة دراسية مسجلة حالياً، بانتظار إنجازات الطالب!
                                </div>
                            )}
                         </div>

                         {/* Needs Improvement */}
                         {academicProfile.needsImprovementArray.length > 0 && (
                             <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-4">
                                <span className="text-white/50 text-[10px] font-black w-full block mb-2">🔍 فرص التطور المتاحة:</span>
                                <div className="flex flex-wrap gap-2">
                                  {academicProfile.needsImprovementArray.map((ni: any, niIdx: number) => (
                                     <div key={`ni_${niIdx}`} className="bg-black/30 border border-white/5 text-rose-200/60 text-[9px] px-3 py-2 rounded-xl font-bold flex items-center gap-1.5">
                                        <TrendingUp size={12} className="inline opacity-50" />
                                        زيادة المستوى في {ni.subject} 
                                     </div>
                                  ))}
                                </div>
                             </div>
                         )}

                         {/* Manual Badges Controls */}
                         <div className="bg-black/20 border border-[#FFD600]/20 rounded-2xl p-5 relative overflow-hidden mt-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD600]/5 blur-3xl pointer-events-none" />
                            <h5 className="text-[#FFD600] font-black text-sm mb-4">🎖️ إدارة أوسمة الشرف الإضافية</h5>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
                               {OUTSTANDING_BADGES.map((b) => {
                                  const isAwarded = currentStudentObj?.outstandingBadges?.includes(b.id) || currentStudentObj?.generalBadges?.some((cb: any) => cb.id === b.id);
                                  return (
                                     <button
                                        key={b.id}
                                        onClick={() => {
                                           let newBadges = currentStudentObj?.outstandingBadges || [];
                                           if (isAwarded) {
                                              newBadges = newBadges.filter((id: string) => id !== b.id);
                                              // also remove from generalBadges if it exists
                                              let newGB = currentStudentObj?.generalBadges || [];
                                              newGB = newGB.filter((gb: any) => gb.id !== b.id);
                                              handleGlobalUpdateStudent(currentStudentObj.student, currentStudentObj.listId, { outstandingBadges: newBadges, generalBadges: newGB });
                                           } else {
                                              newBadges = [...newBadges, b.id];
                                              handleGlobalUpdateStudent(currentStudentObj.student, currentStudentObj.listId, { outstandingBadges: newBadges });
                                           }
                                        }}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${isAwarded ? 'bg-[#FFD600]/10 border-[#FFD600]/30 shadow-[0_0_15px_rgba(255,214,0,0.1)] scale-[1.02]' : 'bg-black/30 border-white/5 hover:bg-white/5 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'}`}
                                     >
                                        <span className="text-3xl mb-2 drop-shadow-md">{b.icon}</span>
                                        <span className={`text-[9px] font-black text-center leading-tight ${isAwarded ? 'text-[#FFD600]' : 'text-white/60'}`}>{b.title}</span>
                                     </button>
                                  );
                               })}
                            </div>
                         </div>
                   </div>

                   {/* LEFT SIDE: Identity Card & Pride Message */}
                   <div className="lg:col-span-4 space-y-6 w-full">
                       {/* Student Identity Mini-Card */}
                       <div className={`relative rounded-3xl border border-white/10 p-5 bg-black/20 backdrop-blur-md flex flex-col justify-center items-center text-center`}>
                          <div className="relative group cursor-pointer perspective-1000 mb-4 mt-2">
                             {academicProfile?.levelData && (
                               <>
                                 <div 
                                   className="absolute inset-0 rounded-full blur-[20px] transition-all duration-700 ease-out group-hover:blur-[30px]" 
                                   style={{ 
                                     background: academicProfile?.levelData?.glowColor || 'rgba(148,163,184,0.3)',
                                     opacity: 0.8
                                   }}
                                 />
                                 <div 
                                   className="absolute inset-0 rounded-full blur-[40px] opacity-20 transition-all duration-1000 ease-out animate-pulse" 
                                   style={{ background: academicProfile?.levelData?.glowColor || 'rgba(148,163,184,0.3)' }}
                                 />
                               </>
                             )}
                             <div className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl font-black shadow-xl ring-2 ring-white/10 ${academicProfile?.levelData?.borderClass || 'border-slate-500/30'} bg-cover bg-center overflow-hidden z-20 transition-transform duration-500 group-hover:scale-105`} style={{ backgroundImage: currentStudentObj?.avatar ? `url(${currentStudentObj.avatar})` : 'none', backgroundColor: '#0a0f24' }}>
                                {!currentStudentObj.avatar && (academicProfile.isEliteStudent ? '👑' : '👨‍🎓')}
                             </div>
                             {academicProfile?.levelData && (
                               <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-black border ${academicProfile.levelData.borderClass} z-30 shadow-xl backdrop-blur-md`}>
                                  {academicProfile.levelData.label}
                               </div>
                             )}
                             <button 
                               onClick={(e) => { e.stopPropagation(); fileInputRefs.current[`profile_${currentStudentObj.student}`]?.click(); }}
                               className="absolute -right-2 top-0 bg-[#0a0f24] hover:bg-[#FFD600] text-[#FFD600] border border-[#FFD600]/30 hover:text-[#0a0f24] p-2 rounded-full shadow-xl transition-all z-40 transform hover:scale-110 flex items-center justify-center"
                             >
                               <Camera size={14} />
                             </button>
                             <input 
                               type="file" 
                               ref={el => { fileInputRefs.current[`profile_${currentStudentObj.student}`] = el; }}
                               className="hidden" 
                               accept="image/*"
                               onChange={(e) => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   const reader = new FileReader();
                                   reader.onload = (ev) => {
                                      if (ev.target?.result && currentStudentObj.listId) {
                                         handleGlobalUpdateStudent(currentStudentObj.student, currentStudentObj.listId, { avatar: ev.target.result as string });
                                      }
                                   };
                                   reader.readAsDataURL(file);
                                 }
                               }}
                             />
                          </div>
                          <h4 className="text-white font-black text-xl mt-2">{currentStudentObj.name}</h4>
                          <p className="text-white/50 text-[11px] font-bold mt-1">{currentStudentObj.grade || currentStudentObj.listName}</p>
                       </div>

                       {/* Pride Message Admin Controls */}
                       <div className="bg-black/20 border border-white/5 p-5 rounded-3xl">
                          <label className="text-white/60 text-[10px] font-black tracking-wide block mb-3">رسالة فخر واعتزاز لوالدي الطالب (إشعار فوري)</label>
                          <div className="flex flex-col gap-2">
                             {PRIDE_PRESETS.map((pst, pI) => (
                               <button
                                 key={pI}
                                 onClick={() => {
                                    handleGlobalUpdateStudent(currentStudentObj.student, currentStudentObj.listId, { prideMessage: pst });
                                 }}
                                 className={`px-3 py-2 rounded-xl border text-[9px] font-bold transition-all text-right ${
                                   currentStudentObj.prideMessage === pst
                                     ? 'bg-[#FFD600]/20 border-[#FFD600]/40 text-[#FFD600]'
                                     : 'bg-black/40 border-white/5 text-white/50 hover:bg-white/5 text-right'
                                 }`}
                               >
                                 {pst}
                               </button>
                             ))}
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/5">
                             <input 
                               type="text"
                               value={customPrideMessage}
                               onChange={e => setCustomPrideMessage(e.target.value)}
                               placeholder="اكتب رسالة خاصة..."
                               className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#FFD600] transition-colors mb-2 text-right"
                             />
                             <button
                               onClick={() => {
                                  if (!customPrideMessage.trim()) return;
                                  handleGlobalUpdateStudent(currentStudentObj.student, currentStudentObj.listId, { prideMessage: customPrideMessage.trim() });
                                  setCustomPrideMessage('');
                               }}
                               className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-black transition-all border border-white/10 shadow-lg shadow-indigo-500/10 block text-center"
                             >
                               إرسال الرسالة 📨
                             </button>
                             <div className="flex justify-between items-center mt-3 mx-1">
                                <span className="text-[8px] text-white/30 font-bold">تظهر للوالدين فوراً</span>
                                <button 
                                  onClick={() => handleGlobalUpdateStudent(currentStudentObj.student, currentStudentObj.listId, { prideMessage: "" })} 
                                  className="text-rose-400 text-[8px] font-bold hover:underline"
                                >
                                   إلغاء الرسالة
                                </button>
                             </div>
                          </div>
                       </div>
                   </div>
                </div>
             </div>
           );
         })()}

         {/* Modern Excellence Search & Directory */}
        <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-6 w-full">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                 <h4 className="text-white font-black text-sm">البحث السريع ودليل المتميزين</h4>
                 <p className="text-white/40 text-[10px] font-bold">ابحث عن الطالب لمنحه أوسمة، نقاط تفوق، أو رسائل اعتزاز لوالديه فورياً</p>
              </div>
              <div className="relative w-full md:max-w-xs">
                <input 
                  type="text" 
                  value={excellenceSearch}
                  onChange={e => setExcellenceSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الكود..."
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 text-white placeholder-white/30 focus:border-[#FFD600]/40 outline-none transition-all text-xs font-bold text-right"
                />
                <style dangerouslySetInnerHTML={{__html: `
                  input::placeholder { text-align: right; }
                `}} />
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
           </div>

           {/* Elegant Table/Grid for Sorted Students */}
           <div className="w-full mt-3 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
             <table className="w-full text-right text-xs table-fixed">
               <thead className="bg-[#101935]/80 border-b border-white/5">
                 <tr>
                    <th className="py-3 px-3 md:px-4 text-white/40 text-[10px] md:text-[11px] font-black uppercase tracking-wider w-[42%] md:w-[42%]">الطالب</th>
                    <th className="py-3 px-3 md:px-4 text-white/40 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-center w-[23%] md:w-[23%]"><span className="hidden md:inline">النقاط والأوسمة</span><span className="md:hidden">النقاط</span></th>
                    <th className="py-3 px-3 md:px-4 text-white/40 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-right w-[35%] md:w-[35%] pr-2 md:pr-10"><span className="hidden md:inline">اللقب والاستحقاق</span><span className="md:hidden">اللقب</span></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5 bg-transparent">
                 {finalSortedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-white/20 font-black">
                         لا يوجد طلاب يطابقون خيارات البحث الحالية
                      </td>
                    </tr>
                 ) : (
                    finalSortedStudents.slice(0, studentDisplayLimit).map((stu: any, idx: number) => {
                       const isSelected = activeExcellenceStudentCode === (stu.student || stu.code);
                       const prof = stu._academicProfile;
                       const ex = stu._excellence;
                       
                       return (
                          <tr 
                             key={stu.student || idx} 
                             onClick={() => {
                               setActiveExcellenceStudentCode(stu.student || stu.code);
                               setTimeout(() => controlRoomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                             }}
                             className={`group transition-all duration-300 cursor-pointer ${
                                isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                             }`}
                          >
                             <td className="py-2 md:py-3 px-3 md:px-4">
                                <div className="flex items-center gap-2 md:gap-3">
                                   <div className="relative group cursor-pointer perspective-1000">
                                      {prof?.levelData && (
                                        <>
                                          <div 
                                            className="absolute inset-0 rounded-full blur-[10px] transition-all duration-700 ease-out group-hover:blur-[15px]" 
                                            style={{ 
                                              background: prof.levelData.glowColor || 'rgba(148,163,184,0.3)',
                                              opacity: 0.6
                                            }}
                                          />
                                          <div 
                                            className="absolute inset-0 rounded-full blur-[20px] opacity-20 transition-all duration-1000 ease-out animate-pulse" 
                                            style={{ background: prof.levelData.glowColor || 'rgba(148,163,184,0.3)' }}
                                          />
                                        </>
                                      )}
                                      <div className={`relative w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full border-2 flex items-center justify-center text-xl font-black shadow-lg ${prof?.levelData?.borderClass || 'border-slate-500/30'} bg-cover bg-center overflow-hidden z-20`} style={{ backgroundImage: stu.avatar ? `url(${stu.avatar})` : 'none', backgroundColor: '#0a0f24' }}>
                                         {!stu.avatar && (prof?.isEliteStudent ? '👑' : '👨‍🎓')}
                                      </div>
                                   </div>
                                   <div className="flex flex-col justify-center">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                         <span className="text-xs md:text-sm font-black truncate max-w-full group-hover:text-[#FFD600] transition-colors">{stu.name}</span>
                                         {prof?.individualExemptions && prof.individualExemptions.length > 0 && (
                                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10 whitespace-nowrap hidden md:inline-block">
                                               ({prof.individualExemptions.length} مادة معفاة فردياً 🏅)
                                            </span>
                                         )}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        <button 
                                          className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded shadow-sm group-hover:bg-indigo-500/30 group-hover:text-indigo-200 transition-colors shrink-0"
                                        >
                                           استعراض 🎓</button>
                                         {selectedExcellenceExemption === 'individual' && prof?.individualExemptions && prof.individualExemptions.length > 0 && (
                                            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap ml-1">إعفاء فردي ({prof.individualExemptions.length}<span className="hidden md:inline"> مادة</span>) 🏅</span>
                                         )}
                                         {selectedExcellenceExemption === 'general' && prof?.generalExemption === true && (
                                            <span className="text-[9px] font-black bg-amber-500/10 text-[#FFD600] border border-amber-500/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap ml-1">إعفاء عام 👑</span>
                                         )}
                                         {selectedExcellenceExemption === 'all' && (
                                            <>
                                               {prof?.generalExemption === true ? (
                                                  <span className="text-[9px] font-black bg-amber-500/10 text-[#FFD600] border border-amber-500/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap ml-1">إعفاء عام 👑</span>
                                               ) : (
                                                  prof?.individualExemptions && prof.individualExemptions.length > 0 && (
                                                     <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap ml-1">إعفاء فردي ({prof.individualExemptions.length}<span className="hidden md:inline"> مادة</span>) 🏅</span>
                                                  )
                                               )}
                                            </>
                                         )}<button className="hidden" style={{display: 'none'}}>
                                        </button>
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-2 md:py-3 px-3 md:px-4 text-center">
                                <div className="flex flex-col items-center justify-center gap-1 w-full mt-1">
                                    <div className="inline-flex bg-gradient-to-br from-[#FFD600]/10 to-amber-500/5 border border-[#FFD600]/20 rounded-lg px-2 py-1 md:px-3 shadow-[0_4px_15px_rgba(255,214,0,0.1)] items-center justify-center min-w-[30px] md:min-w-[40px]">
                                       <span className="text-[#FFD600] font-black text-xs md:text-sm leading-tight flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1">{ex?.totalPoints || 0}<span className="text-[8px] md:text-xs opacity-75 font-black">نقطة</span></span>
                                    </div>
                                    <div className="flex gap-1.5 opacity-80 scale-90">
                                       {ex?.goldBadges > 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">🥇 {ex.goldBadges}</span>}
                                       {ex?.silverBadges > 0 && <span className="text-[10px] bg-slate-300/20 text-slate-300 px-1.5 py-0.5 rounded">🥈 {ex.silverBadges}</span>}
                                    </div>
                                </div>
                             </td>
                             <td className="py-2 md:py-3 px-3 md:px-4 text-right pr-4 md:pr-10">
                                <div className="flex flex-col gap-1 items-start">
                                    <span className="inline-block text-[9px] md:text-[10px] px-2 py-1 rounded-lg bg-black/40 border border-indigo-500/30 text-indigo-300 font-black shadow-inner truncate max-w-full">
                                       {ex?.dynamicTitle || "بطل التميز"}
                                    </span>
                                    <span className="inline-block text-[9px] px-2 py-1 text-emerald-400 font-bold truncate max-w-full opacity-60">
                                       {prof?.strongestSubjectMap?.name !== "---" ? prof.strongestSubjectMap.name : "قيد التقييم"}
                                    </span>
                                </div>
                             </td>
                          </tr>
                       );
                    })
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  }

  if ((mainTab as string) === "books") {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
        {renderMainTabSelector()}
        
        <BookDistributionManager 
          savedLists={activeSavedLists}
          onUpdateList={async (list) => {
            if (onUpdateList) {
              await onUpdateList(list);
            }
          }}
          showToast={showToast}
        />
      </div>
    );
  }

  if (selectedList) {
    const subjects = getSubjectsForGrade(selectedList.students[0]?.grade || '', selectedList.removedSubjects || [], subjectMapping);
    
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
        {/* Top Centered Tabs Selector */}
        {renderMainTabSelector()}

        {/* Compact Edge-to-Edge Class Header & Live Status */}
        <div className="bg-[#0b1226]/95 border-y sm:border border-white/10 sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedList(null);
                }}
                className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-2 text-xs font-black transition-all border border-white/10 shrink-0"
              >
                <ArrowRight size={16} />
                <span>{isArchivedList(selectedList) ? 'العودة للأرشيف' : 'العودة للشعب'}</span>
              </motion.button>
              
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-black text-base sm:text-lg tracking-tight">{selectedList.name}</h3>
                  <span className="bg-blue-500/10 text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/20">
                    {displaySchoolName}
                  </span>
                  {isArchivedList(selectedList) && (
                    <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                      <FolderOpen size={11} />
                      سجل أرشيفي مفتوح 📂
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    متصل بالبث الفوري لأولياء الأمور
                  </span>
                  <span className="text-white/40 text-[10px] font-mono">• {selectedList.students.length} طالباً</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setPromotionTargetListId(selectedList.id);
                  setIsPromotionWizardOpen(true);
                }}
                className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-500/20 text-purple-300 flex items-center justify-center gap-2 text-xs font-black transition-all shadow-md cursor-pointer"
                title="ترحيل طلاب هذه الشعبة للعام القادم"
              >
                <GraduationCap size={16} className="text-purple-300" />
                <span>ترحيل الشعبة 🎓</span>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSubjectManager(true)}
                className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-white/[0.04] border border-white/10 hover:border-amber-400/40 hover:bg-amber-400/10 text-amber-300 flex items-center justify-center gap-2 text-xs font-black transition-all"
              >
                <Layout size={16} />
                <span>مواد المرحلة</span>
              </motion.button>

              <motion.button 
                disabled={isSaving}
                whileHover={isSaving ? {} : { scale: 1.02 }}
                whileTap={isSaving ? {} : { scale: 0.98 }}
                onClick={saveBatchChanges}
                className={`flex-1 sm:flex-initial h-11 px-5 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all border border-white/10 ${
                  isSaving 
                    ? 'bg-blue-900/80 cursor-not-allowed opacity-80' 
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:brightness-110 shadow-blue-900/40'
                }`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ ومزامنة الدرجات'}</span>
              </motion.button>
            </div>
          </div>

          {/* Periods Selector Pills */}
          <div className="pt-2 border-t border-white/5">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {periods.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPeriod(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-all whitespace-nowrap shrink-0 border ${
                    selectedPeriod === p.id 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border-blue-400/40' 
                      : 'bg-black/40 text-white/50 hover:text-white hover:bg-white/5 border-white/5'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Restorable Removed Subjects (if any) */}
          {(selectedList.removedSubjects || []).length > 0 && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-300 text-xs">
              <span className="font-black shrink-0 text-[10px]">مواد محذوفة:</span>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {selectedList.removedSubjects.map((subId: string) => {
                  const subName = getSubjectsForGrade(selectedList.students[0]?.grade || '', [], subjectMapping).find(s => s.id === subId)?.name;
                  return (
                    <button
                      key={subId}
                      type="button"
                      onClick={(e) => restoreSubject(subId, e)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-200 rounded-lg text-[10px] font-black hover:bg-rose-500 hover:text-white transition-all border border-rose-500/30 whitespace-nowrap"
                    >
                      <RotateCcw size={10} />
                      {subName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Grades Table - Edge-to-Edge Slim Rows */}
        <div className="bg-[#0b1226]/95 border-y sm:border border-white/10 sm:rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black text-white/70">
                  <th className="px-3 py-3 text-right whitespace-nowrap">اسم الطالب</th>
                  {subjects.map(sub => (
                    <th key={sub.id} className="px-1.5 py-3 whitespace-nowrap min-w-[54px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] text-white/90">{sub.name}</span>
                        {(sub.id === 'computer' || sub.id === 'french') && (
                          <button 
                            type="button"
                            onClick={(e) => removeSubject(sub.id, e)}
                            className="text-[9px] text-rose-400 hover:text-white hover:bg-rose-500 p-0.5 rounded transition-all"
                            title="إخفاء المادة"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 whitespace-nowrap text-amber-400 w-16">التميز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedList.students
                  .filter((stu, index, self) => index === self.findIndex((s) => (s.id && s.id === stu.id) || (s.code && s.code === stu.code)))
                  .filter((stu: any) => stu.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'ar'))
                  .map((stu: any, idx: number) => {
                    const studentKey = stu.student || stu.code || stu.id || `stu-${idx}`;
                    const periodGrades = stu.grades?.[selectedPeriod] || {};

                    return (
                      <tr 
                        key={studentKey}
                        id={`student-${stu.student || stu.code}`}
                        className={`hover:bg-white/[0.04] transition-colors group ${
                          highlightedStudentId === (stu.student || stu.code) 
                            ? 'bg-blue-500/15 ring-inset ring-1 ring-blue-400' 
                            : ''
                        }`}
                      >
                        {/* Student Name and Delete */}
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-white/30 font-mono text-[10px] w-4 text-center shrink-0">{idx + 1}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete({ 
                                  id: stu.student, 
                                  name: stu.name, 
                                  type: 'student',
                                  student: stu 
                                });
                              }}
                              className="w-6 h-6 flex items-center justify-center text-rose-400/40 hover:text-white bg-rose-500/5 hover:bg-rose-600 rounded-md transition-all shrink-0"
                              title="حذف الطالب"
                            >
                              <Trash2 size={12} />
                            </button>
                            <span className="text-white text-xs font-black group-hover:text-amber-300 transition-colors truncate max-w-[180px]">
                              {stu.name}
                            </span>
                          </div>
                        </td>

                        {/* Subject Grade Inputs */}
                        {subjects.map(sub => {
                          const currentVal = periodGrades[sub.id];
                          const numVal = currentVal !== undefined && currentVal !== '' ? Number(currentVal) : null;
                          const isFailed = numVal !== null && numVal < 50;

                          return (
                            <td key={sub.id} className="px-1 py-1.5">
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                value={currentVal ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    handleUpdateGrade(stu.student, sub.id, 0);
                                  } else {
                                    const val = Math.min(100, Math.max(0, parseInt(raw) || 0));
                                    handleUpdateGrade(stu.student, sub.id, val);
                                  }
                                }}
                                className={`w-12 h-8 rounded-lg text-center text-xs font-black font-mono outline-none border transition-all ${
                                  numVal === null
                                    ? 'bg-black/30 border-white/10 text-white/40 focus:border-blue-400 focus:bg-black/60'
                                    : isFailed
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 focus:border-rose-400 focus:bg-rose-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 focus:border-emerald-400 focus:bg-emerald-500/20'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Excellence Star Toggle */}
                        <td className="px-2 py-1.5">
                          <button 
                            onClick={async () => {
                              try {
                                const newStatus = !stu.isTopStudent;
                                const periodName = periods.find(p => p.id === selectedPeriod)?.name || 'غير محدد';
                                const schoolId = selectedList.schoolId;
                                
                                const studentCode = stu.student || stu.code;
                                const usersRef = collection(db, 'users');
                                const safeStudentCode = studentCode || 'unassigned';
                                const q = query(usersRef, where('studentCode', '==', safeStudentCode));
                                const querySnapshot = await getDocs(q);
                                
                                if (!querySnapshot.empty) {
                                  const userDoc = querySnapshot.docs[0];
                                  await updateDoc(doc(db, 'users', userDoc.id), {
                                    isTopStudent: newStatus,
                                    topStudentPeriod: newStatus ? periodName : null,
                                    schoolId: schoolId,
                                    grade: stu.grade || selectedList.name.split('-')[0].trim() || userDoc.data().grade
                                  });
                                }

                                const studentDocId = `${schoolId}_${studentCode}`.replace(/\s+/g, '_');
                                await academicService.updateStudentDirect(studentDocId, {
                                  name: stu.fullName || stu.name,
                                  isTopStudent: newStatus,
                                  topStudentPeriod: newStatus ? periodName : null,
                                  grade: stu.grade || selectedList.name.split('-')[0].trim(),
                                  schoolId: schoolId,
                                  updatedAt: new Date().toISOString()
                                }).catch(e => console.warn("Could not find student in school_students, skipping global sync"));

                                const updatedList = {
                                  ...selectedList,
                                  students: selectedList.students.map((s: any) => 
                                    (s.id === stu.id || s.student === stu.student) 
                                      ? { ...s, isTopStudent: newStatus, topStudentPeriod: newStatus ? periodName : null } 
                                      : s
                                  )
                                };
                                setSelectedList(updatedList);
                                if (onUpdateList) onUpdateList(updatedList);
                                
                                showToast(newStatus ? `تم منح الطالب وسام التميز (${periodName})` : 'تم سحب وسام التميز', 'success');
                              } catch (err) {
                                console.error(err);
                                showToast('فشل تحديث حالة التميز', 'error');
                              }
                            }}
                            className={`w-9 h-8 mx-auto rounded-lg transition-all border flex items-center justify-center ${
                              stu.isTopStudent 
                                ? 'bg-[#FFD600]/20 border-[#FFD600]/50 text-[#FFD600] shadow-[0_0_12px_rgba(255,214,0,0.3)] scale-105' 
                                : 'bg-white/5 border-white/10 text-white/20 hover:text-amber-300 hover:border-amber-300/30'
                            }`}
                            title={stu.isTopStudent ? 'إلغاء وسام التميز' : 'منح وسام التميز'}
                          >
                            <Star size={16} fill={stu.isTopStudent ? "currentColor" : "none"} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center gap-3 px-3 sm:px-0">
          <button 
            onClick={printGrades}
            className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-black hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <Printer size={16} />
            طباعة كشف الدرجات
          </button>
          <button 
            onClick={exportToDigitalList}
            className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl text-white/60 text-xs font-black hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <FileSpreadsheet size={16} />
            تصدير كشف إكسل
          </button>
        </div>

        {/* Subject Manager Modal */}
        <AnimatePresence>
          {showSubjectManager && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              onClick={() => setShowSubjectManager(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#101935] border border-white/10 rounded-3xl p-4 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative no-scrollbar shadow-2xl my-auto"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 sticky top-0 bg-[#101935] z-30 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-white font-black text-sm">إدارة وتوزيع مواد المرحلة</span>
                  </div>
                  <button 
                    onClick={() => setShowSubjectManager(false)}
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer"
                    title="إغلاق النافذة"
                  >
                    <X size={18} />
                  </button>
                </div>
                <SubjectManager 
                  showToast={showToast} 
                  onClose={() => setShowSubjectManager(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <StudentPromotionWizard 
          isOpen={isPromotionWizardOpen}
          onClose={() => {
            setIsPromotionWizardOpen(false);
            setPromotionTargetListId(null);
          }}
          savedLists={savedLists}
          setSavedLists={setSavedLists}
          schoolId={schoolId || selectedList?.schoolId || schoolName || 'default_school'}
          schoolName={schoolName || selectedList?.schoolName || 'المدرسة'}
          showToast={showToast}
          preSelectedListId={promotionTargetListId}
        />
      </div>
    );
  }





  const getListStageName = (list: any): string => {
    const stage = getListStage(list);
    if (stage === 'primary') return 'ابتدائي';
    if (stage === 'intermediate') return 'متوسط';
    if (stage === 'high') return 'إعدادي';
    return 'عام';
  };

  const getGradeOrderValue = (list: any): number => {
    let grade = list.students?.[0]?.grade || '';
    if (!grade) {
      const name = list.name || '';
      if (name.includes('ابتدائي') || name.includes('ابتدائ')) {
        grade = 'ابتدائي';
        if (name.includes('اول') || name.includes('أول')) grade = 'أول ابتدائي';
        else if (name.includes('ثاني')) grade = 'ثاني ابتدائي';
        else if (name.includes('ثالث')) grade = 'ثالث ابتدائي';
        else if (name.includes('رابع')) grade = 'رابع ابتدائي';
        else if (name.includes('خامس')) grade = 'خامس ابتدائي';
        else if (name.includes('سادس')) grade = 'سادس ابتدائي';
      } else if (name.includes('متوسط')) {
        grade = 'متوسط';
        if (name.includes('اول') || name.includes('أول')) grade = 'أول متوسط';
        else if (name.includes('ثاني')) grade = 'ثاني متوسط';
        else if (name.includes('ثالث')) grade = 'ثالث متوسط';
      } else if (name.includes('علمي') || name.includes('أدبي') || name.includes('اعدادي') || name.includes('إعدادي')) {
        grade = 'إعدادي';
        if (name.includes('رابع')) grade = 'رابع علمي';
        else if (name.includes('خامس')) grade = 'خامس علمي';
        else if (name.includes('سادس')) grade = 'سادس علمي';
      }
    }
    
    const cleanGrade = (grade || '').replace(/[أإآ]/g, 'ا').trim();

    // Primary (Order 10-19)
    if (cleanGrade.includes('ابتدائي') || cleanGrade.includes('ابتدائ')) {
      if (cleanGrade.includes('اول')) return 10;
      if (cleanGrade.includes('ثاني')) return 11;
      if (cleanGrade.includes('ثالث')) return 12;
      if (cleanGrade.includes('رابع')) return 13;
      if (cleanGrade.includes('خامس')) return 14;
      if (cleanGrade.includes('سادس')) return 15;
      return 19;
    }
    // Intermediate (Order 20-29)
    if (cleanGrade.includes('متوسط')) {
      if (cleanGrade.includes('اول')) return 20;
      if (cleanGrade.includes('ثاني')) return 21;
      if (cleanGrade.includes('ثالث')) return 22;
      return 29;
    }
    // High / Preparatory (Order 30-39)
    if (cleanGrade.includes('اعدادي') || cleanGrade.includes('علمي') || cleanGrade.includes('ادبي') || cleanGrade.includes('سادس') || cleanGrade.includes('خامس') || cleanGrade.includes('رابع')) {
      if (cleanGrade.includes('رابع')) return 30;
      if (cleanGrade.includes('خامس')) return 31;
      if (cleanGrade.includes('سادس')) return 32;
      return 39;
    }

    return 99;
  };

  const filteredLists = activeSavedLists.filter(l => {
    const listStudents = Array.isArray(l.students) ? l.students : [];
    const matchesSearch = (l.name || '').includes(searchQuery) || listStudents.some((s: any) => (s?.name || '').includes(searchQuery));
    if (!matchesSearch) return false;
    if (selectedStage === 'all') return true;
    return getListStage(l) === selectedStage;
  }).sort((a, b) => {
    const priorityA = getGradeOrderValue(a);
    const priorityB = getGradeOrderValue(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return (a.name || '').localeCompare(b.name || '', 'ar');
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300 -mx-3 sm:mx-0 w-[calc(100%+1.5rem)] sm:w-full">
      {/* Centered Modern Unified Tabs Selector */}
      {renderMainTabSelector()}

      {/* Annual Student Promotion Feature Banner - Compact, Sleek & Elegant */}
      <div className="px-3 sm:px-0">
        <div className="relative overflow-hidden rounded-xl bg-[#0e1630]/90 border border-purple-500/20 hover:border-purple-500/40 px-3.5 py-2.5 sm:py-3 shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <GraduationCap size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-black text-xs sm:text-sm">الترحيل السنوي للعام الدراسي الجديد</h3>
                <span className="bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  ترقية ذكية وأرشفة 🎓
                </span>
              </div>
              <p className="text-white/50 text-[11px] truncate max-w-xl mt-0.5">
                ترقية الناجحين تلقائياً للصف التالي، فرز المعيدين، وأرشفة قوائم العام المنصرم بأمان.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setPromotionTargetListId(null);
              setIsPromotionWizardOpen(true);
            }}
            className="h-8 px-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 border border-purple-400/30 shrink-0 cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
          >
            <GraduationCap size={13} />
            <span>بدء الترحيل 🚀</span>
          </motion.button>
        </div>
      </div>

      {/* Educational Stages Filter Row - Primary First */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 bg-[#0b1226]/80 p-3 sm:p-4 border-y sm:border border-white/10 sm:rounded-2xl shadow-xl">
        {[
          { id: 'primary', name: 'المرحلة الابتدائية', description: 'من الأول حتى السادس الابتدائي', icon: BookOpen, color: 'from-amber-500/10 to-orange-500/10', borderColor: 'border-amber-500/30', textColor: 'text-amber-400', glowColor: 'rgba(212, 175, 55, 0.4)' },
          { id: 'intermediate', name: 'المرحلة المتوسطة', description: 'من الأول حتى الثالث المتوسط', icon: Award, color: 'from-emerald-500/10 to-teal-500/10', borderColor: 'border-emerald-500/30', textColor: 'text-emerald-400', glowColor: 'rgba(16, 185, 129, 0.4)' },
          { id: 'high', name: 'المرحلة الإعدادية', description: 'من الرابع حتى السادس الإعدادي', icon: GraduationCap, color: 'from-purple-500/10 to-pink-500/10', borderColor: 'border-purple-500/30', textColor: 'text-purple-400', glowColor: 'rgba(168, 85, 247, 0.4)' },
          { id: 'all', name: 'كافة المراحل', description: 'عرض جميع الشعب الدراسية', icon: Users, color: 'from-blue-500/10 to-indigo-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-400', glowColor: 'rgba(59, 130, 246, 0.4)' }
        ].map((stg) => {
          const StageIcon = stg.icon;
          const isSelected = selectedStage === stg.id;
          return (
            <motion.button
              key={stg.id}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStage(stg.id as any)}
              className={`relative flex items-center gap-3 p-3 rounded-xl text-right border transition-all duration-200 overflow-hidden cursor-pointer group ${
                isSelected 
                  ? `bg-gradient-to-br ${stg.color} ${stg.borderColor} text-white shadow-lg ring-1 ring-white/10` 
                  : 'bg-[#101935]/40 border-white/5 text-white/50 hover:text-white hover:bg-[#101935] hover:border-white/10'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isSelected 
                  ? `${stg.textColor} bg-white/10 scale-105` 
                  : 'bg-white/5 text-white/30 group-hover:text-white'
              }`}>
                <StageIcon size={18} />
              </div>
              
              <div className="min-w-0">
                <h4 className={`text-xs font-black truncate ${
                  isSelected ? 'text-white' : 'text-white/80'
                }`}>
                  {stg.name}
                </h4>
                <p className="text-[9px] text-white/40 truncate hidden sm:block">
                  {stg.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Global Students Search */}
      <div className="px-3 sm:px-0">
        <SearchStudentsGlobal 
          savedLists={savedLists}
          onSelectStudent={handleSelectStudent}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* Class Cards Grid - Slim Edge-to-Edge Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 px-3 sm:px-0">
        {filteredLists.length === 0 ? (
          <div className="col-span-full p-12 text-center text-white/20 font-bold border border-dashed border-white/10 rounded-2xl">
             لا توجد قوائم طلاب مسجلة لهذه المرحلة
          </div>
        ) : (
          filteredLists.map((list, listIdx) => {
            const totalStudents = list.students?.length || 0;
            const topStudentsCount = (list.students || []).filter((s: any) => s.isTopStudent).length;

            // Calculate accurate grade completion across all active subjects and evaluation periods
            const listGrade = list.grade || list.students?.[0]?.grade || '';
            const listSubjects = getSubjectsForGrade(listGrade, list.removedSubjects || [], subjectMapping);
            const evalPeriods = ['month1', 'month2', 'mid', 'month3', 'month4', 'final'];

            let totalExpectedEntries = totalStudents * Math.max(1, listSubjects.length) * evalPeriods.length;
            let actualEnteredEntries = 0;

            if (totalStudents > 0 && listSubjects.length > 0) {
              (list.students || []).forEach((s: any) => {
                if (!s.grades) return;
                evalPeriods.forEach((pKey) => {
                  const pObj = s.grades[pKey];
                  if (!pObj) return;
                  listSubjects.forEach((sub) => {
                    const v = pObj[sub.id];
                    if (v !== undefined && v !== null && v !== "" && !isNaN(Number(v))) {
                      actualEnteredEntries++;
                    }
                  });
                });
              });
            }

            const gradeCompletion = totalExpectedEntries > 0 
              ? Math.min(100, Math.round((actualEnteredEntries / totalExpectedEntries) * 100)) 
              : 0;

            return (
              <div 
                key={`class_list_${list.id || listIdx}`} 
                onClick={() => setSelectedList(list)}
                className="bg-[#0b1226]/90 hover:bg-[#101938] p-4 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl flex flex-col justify-between gap-3.5"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-all shrink-0">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-black text-xs sm:text-sm group-hover:text-blue-400 transition-colors truncate">{list.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-300 border border-blue-500/20 shrink-0">
                          {getListStageName(list)}
                        </span>
                      </div>
                      <span className="text-white/40 text-[10px] font-mono block mt-0.5">{list.date || 'تم الإنشاء'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ id: list.id, name: list.name, type: 'list' });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-rose-400/40 hover:text-white bg-rose-500/5 hover:bg-rose-600 rounded-lg transition-all shrink-0"
                    title="حذف القائمة نهائياً"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Progress & Stat Strip */}
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <div className="flex items-center gap-1.5 text-white/70">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span>نسبة رصد الدرجات</span>
                    </div>
                    <span className="text-blue-400 font-mono font-black">{gradeCompletion}%</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-500 rounded-full"
                      style={{ width: `${gradeCompletion}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/5 text-center">
                    <div className="flex flex-col">
                      <span className="text-white/40 text-[8px] font-black">الطلاب</span>
                      <span className="text-white font-black text-xs font-mono">{totalStudents}</span>
                    </div>
                    <div className="flex flex-col border-x border-white/5">
                      <span className="text-white/40 text-[8px] font-black">المتميزين</span>
                      <span className="text-amber-400 font-black text-xs font-mono">⭐ {topStudentsCount}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white/40 text-[8px] font-black">الحالة</span>
                      <span className={`text-[9px] font-black ${
                        gradeCompletion === 100 
                          ? 'text-emerald-400' 
                          : gradeCompletion > 0 
                          ? 'text-amber-400' 
                          : 'text-blue-300'
                      }`}>
                        {gradeCompletion === 100 ? 'مكتمل' : gradeCompletion > 0 ? 'قيد الرصد' : 'جديد'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[#FFD600] group-hover:text-white transition-colors">
                  <span className="text-[10px] font-black flex items-center gap-1.5">
                    فتح سجل الرصد والمزامنة
                    <ArrowRight size={12} className="transform group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-white/30 text-[9px] group-hover:text-blue-400 transition-colors font-mono truncate max-w-[120px]">
                    {list.schoolName || ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;

          // 1. Snapshot current state for rollback
          const previousLists = [...savedLists];
          const previousSelectedList = selectedList ? { ...selectedList } : null;

          try {
            if (confirmDelete.type === 'list') {
               // 2. Perform optimistic local update
               setSavedLists(prev => prev.filter(l => l.id !== confirmDelete.id));
               
               if (onDeleteList) {
                 // 3. Await server operation
                 await onDeleteList(confirmDelete.id);
               }

               logActivity({
                 action: 'حذف قائمة طلاب',
                 details: `تم حذف قائمة الطلاب: ${confirmDelete.name}`,
                 targetId: confirmDelete.id,
                 targetType: 'academic_list',
                 targetName: confirmDelete.name
               });
            } else if (confirmDelete.type === 'student') {
               if (!selectedList) {
                 throw new Error('القائمة غير موجودة');
               }
               const updatedStudents = selectedList.students.filter((s: any) => s.student !== confirmDelete.student.student);
               const updatedList = { ...selectedList, students: updatedStudents };
               
               // 2. Perform optimistic local update
               setSelectedList(updatedList);
               setSavedLists(prev => prev.map(l => l.id === selectedList.id ? updatedList : l));
               showToast('تم الحذف بنجاح');
               
               // 3. Await server operation
               if (onUpdateList) {
                 await onUpdateList(updatedList);
               }

               logActivity({
                 action: 'حذف طالب',
                 details: `تم حذف الطالب: ${confirmDelete.name} من القائمة: ${selectedList.name}`,
                 targetId: confirmDelete.id,
                 targetType: 'student',
                 targetName: confirmDelete.name
               });
            }
          } catch (e: any) {
            // 4. Rollback on failure
            setSavedLists(previousLists);
            if (selectedList) setSelectedList(previousSelectedList);
            
            console.error('Delete Error in StudentsSection:', e);
            alert('فشلت عملية الحذف: ' + (e.message || 'خطأ غير معروف'));
          } finally {
            setConfirmDelete(null);
          }
        }}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف ${confirmDelete?.type === 'list' ? 'القائمة ' + confirmDelete.name : 'الطالب ' + confirmDelete?.student?.name}؟`}
      />

      <StudentPromotionWizard 
        isOpen={isPromotionWizardOpen}
        onClose={() => {
          setIsPromotionWizardOpen(false);
          setPromotionTargetListId(null);
        }}
        savedLists={savedLists}
        setSavedLists={setSavedLists}
        schoolId={schoolId || schoolName || 'default_school'}
        schoolName={schoolName || 'المدرسة'}
        showToast={showToast}
        preSelectedListId={promotionTargetListId}
      />
    </div>
  );
};
