import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Trash2, Edit2, ShieldCheck, Clock, BookOpen, ToggleLeft, ToggleRight, X, User, Search, Filter, MessageSquare, Activity, UserCog, Megaphone, Calculator, Car, Wrench, Lock, Users as UsersIcon, QrCode, Send, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSubjectDistributor } from '../hooks/useSubjectDistributor';
import { staffService } from '../services/staffService';
import { logActivity } from '../utils/auditLogger';


import { getPrefixForGrade, getStageFromGrade, getSanitizedSubCode, SUBJECT_KEYWORDS } from '../utils/studentUtils';
import { ScheduleManager } from './ScheduleManager';
import { copyToClipboard } from '../utils/clipboard';

interface Teacher {
  id: string;
  name: string;
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
}

export const TeachersSection: React.FC<TeachersSectionProps> = ({ showToast, schoolId, schoolName, onSubViewChange }) => {
  const { getAllSubjects } = useSubjectDistributor();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    subject: '', 
    role: 'TEACHER' as 'TEACHER' | 'STAFF', 
    bio: '', 
    classes: [] as string[], 
    schedule: [] as string[],
    code: ''
  });
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'staff' | 'schedule'>('teachers');
  const [confirmDelete, setConfirmDelete] = useState<Teacher | null>(null);

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

  const SUBJECTS_TO_REMOVE = [
    'كيمياء', 'فيزياء', 'احياء', 'التربية الاسلامية', 'لغة فرنسية', 'حاسوب'
  ];
  const SUBJECTS = Array.from(new Set(getAllSubjects().filter(s => !SUBJECTS_TO_REMOVE.includes(s.trim()))));
  const STAFF_ROLES = [
    'مدير',
    'محاسب',
    'معاون',
    'علاقات عامة',
    'إعلامي',
    'موظف خدمة',
    'سائق',
    'حارس أمني'
  ];

  const handleUpdateNotes = async (teacher: Teacher, notes: string) => {
    await updateDoc(doc(db, 'teachers', teacher.id), { adminNotes: notes });
    setSelectedTeacher({ ...teacher, adminNotes: notes });
    setTeachers(teachers.map(t => t.id === teacher.id ? { ...t, adminNotes: notes } : t));

    logActivity({
      action: 'تحديث ملاحظات المدرس',
      details: `تم تحديث الملاحظات الإدارية للمدرس: ${teacher.name}`,
      targetId: teacher.id,
      targetType: 'teacher',
      targetName: teacher.name
    });
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

    const safeSchoolId = schoolId || 'unassigned';
    const safeSchoolName = schoolName || 'unassigned';

    // Aggressive query to find teachers belonging to this school
    const constraints = [
      where('schoolId', '==', safeSchoolId),
      where('schoolName', '==', safeSchoolName),
      where('school', '==', safeSchoolName)
    ];

    // Build unique list from multiple property checks 
    // (Firebase doesn't support logical OR across different fields easily in one query without indexes)
    const unsubQueries = constraints.map(constraint => {
      const q = query(collection(db, 'teachers'), constraint);
      return onSnapshot(q, (snapshot) => {
          setTeachers(prev => {
              const newMap = new Map(prev.map(t => [t.id, t]));
              snapshot.docs.forEach(doc => {
                  newMap.set(doc.id, { id: doc.id, ...doc.data() } as Teacher);
              });
              return Array.from(newMap.values());
          });
      });
    });

    // Also include legacy ones (without school info) - for backward compatibility
    const qLegacy = query(collection(db, 'teachers'));
    const unsubLegacy = onSnapshot(qLegacy, (snapshot) => {
       setTeachers(prev => {
           const newMap = new Map(prev.map(t => [t.id, t]));
           snapshot.docs.forEach(doc => {
               const data = doc.data();
               if (!data.schoolId && !data.schoolName && !data.school) {
                   newMap.set(doc.id, { id: doc.id, ...data } as Teacher);
               }
           });
           return Array.from(newMap.values());
       });
    });

    return () => {
      unsubQueries.forEach(unsub => unsub());
      unsubLegacy();
    };
  }, [schoolId, schoolName]);

  const CLASSES = [
    'الأول الابتدائي', 'الثاني الابتدائي', 'الثالث الابتدائي', 'الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي',
    'الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط',
    'الرابع علمي', 'الرابع أدبي', 'الخامس علمي', 'الخامس أدبي', 'السادس علمي', 'السادس أدبي'
  ];

  const DAYS = ['السبت', 'الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس'];


  const handleOpenAdd = (type: 'TEACHER' | 'STAFF' = 'TEACHER') => {
    setEditingTeacher(null);
    setFormData({ name: '', subject: '', role: type, bio: '', classes: [], schedule: [], code: '' });
    setIsAdding(true);
  };
  
  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({ 
      name: teacher.name || '', 
      subject: teacher.subject || '', 
      role: teacher.role || (Array.isArray(teacher.classes) && teacher.classes.length > 0 ? 'TEACHER' : 'STAFF'),
      bio: teacher.bio || '', 
      classes: teacher.classes || [], 
      schedule: teacher.schedule || [],
      code: teacher.code || ''
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const typeLabel = formData.role === 'TEACHER' ? 'مدرس' : 'موظف';
    
    // Derive stage and grade for teachers
    let derivedStage = '';
    let primaryGrade = '';
    
    const safeClasses = formData.classes || [];
    const safeSchedule = formData.schedule || [];

    if (formData.role === 'TEACHER' && safeClasses.length > 0) {
      derivedStage = getStageFromGrade(safeClasses[0]);
      primaryGrade = safeClasses[0];
    }

    const payload = {
      ...formData,
      classes: safeClasses,
      schedule: safeSchedule,
      stage: derivedStage,
      teacherStage: derivedStage,
      grade: primaryGrade,
      schoolId: schoolId,
      schoolName: schoolName,
      school: schoolName,
      updatedAt: new Date()
    };

    if (editingTeacher) {
        await updateDoc(doc(db, 'teachers', editingTeacher.id), payload);
        logActivity({
          action: `تعديل بيانات ${typeLabel}`,
          details: `تم تعديل بيانات ال${typeLabel}: ${editingTeacher.name}`,
          targetId: editingTeacher.id,
          targetType: 'teacher',
          targetName: editingTeacher.name
        });
    } else {
        const docRef = await addDoc(collection(db, 'teachers'), {
          ...payload,
          canPublish: false,
          isActive: true,
          rating: 0
        });
        logActivity({
          action: `إضافة ${typeLabel}`,
          details: `تم إضافة ${typeLabel} جديد: ${formData.name}`,
          targetId: docRef.id,
          targetType: 'teacher',
          targetName: formData.name
        });
    }
    setIsAdding(false);
    setFormData({ name: '', subject: '', role: 'TEACHER', bio: '', classes: [], schedule: [], code: '' });
  };

  // Using imported copyToClipboard utility

  const handleGenerateTeacherCode = async (teacher: Teacher, targetClass?: string) => {
    const subCode = getSanitizedSubCode(teacher.subject);
    
    if (teacher.role === 'TEACHER' && teacher.classes.length > 0) {
      const classCodes: Record<string, string> = { ...teacher.classCodes };
      
      const classesToProcess = targetClass ? [targetClass] : teacher.classes;

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
            t.code === code || 
            (t.classCodes && Object.values(t.classCodes).includes(code))
          );
        } while (!isUnique);

        classCodes[className] = code;
      }

      await updateDoc(doc(db, 'teachers', teacher.id), { 
        classCodes,
        // We keep the first one in 'code' for simplified fallback search
        code: Object.values(classCodes)[0]
      });
      showToast(targetClass ? `تم إصدار كود الصف ${targetClass} بنجاح` : 'تم إصدار الأكواد لجميع الصفوف بنجاح', 'success');
    } else {
      // Staff or generic fallback
      let randomNum: number;
      let isUnique = false;
      let staffCode = '';
      
      do {
        randomNum = Math.floor(1000 + Math.random() * 9000);
        staffCode = `TCH-STAFF-${randomNum}`;
        isUnique = !teachers.some(t => t.code === staffCode);
      } while (!isUnique);

      await updateDoc(doc(db, 'teachers', teacher.id), { code: staffCode });
      showToast('تم إصدار كود الموظف بنجاح', 'success');
    }

    logActivity({
      action: 'توليد أكواد صلاحيات',
      details: `تم إصدار أكواد دخول جديدة للأستاذ/الموظف: ${teacher.name}`,
      targetId: teacher.id,
      targetType: 'teacher',
      targetName: teacher.name
    });
  };

  const shareTeacherCode = (teacher: Teacher, specificCode?: string, className?: string) => {
    const codeToShare = specificCode || teacher.code;
    if (!codeToShare) return;
    
    const message = `
🌟 *بوابة بيرق - الإصدار الاحترافي* 🌟

تحية طيبة الأستاذ القدير: *${teacher.name}*
يسرنا تزويدكم بكود الدخول الرسمي للمنصة التعليمية:

${className ? `📌 الصف: *${className}*` : ''}
🔐 كود الصلاحيات: \`${codeToShare}\`

بهذا الكود يمكنك:
✅ رفع الملفات والملزمات
✅ إدارة محتوى صفك التعليمي
✅ البث المباشر والتفاعل مع الطلاب

رابط المنصة: ${window.location.origin}
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'كود الأستاذ - بوابة بيرق',
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
                                      <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-500">
                                          {getRoleIcon(teacher.subject, 'TEACHER')}
                                      </div>
                                      <div>
                                          <h4 className="text-white font-black text-lg">{teacher.name}</h4>
                                          <p className="text-amber-400 text-xs font-bold">مدرس: {teacher.subject}</p>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                  {(teacher.classes || []).map(c => <span key={c} className="text-[10px] bg-white/5 text-white/70 px-2 py-0.5 rounded-full">{c}</span>)}
                              </div>

                              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                                  {((teacher.classCodes && Object.keys(teacher.classCodes).length > 0) || teacher.code) ? (
                                    <div className="space-y-2">
                                      {teacher.classCodes ? (Object.entries(teacher.classCodes) as [string, string][]).map(([className, classCode]) => (
                                        <div key={className} className="bg-black/40 p-3 rounded-2xl border border-blue-500/30 flex items-center justify-between group/code relative">
                                          <div 
                                            className="flex items-center gap-2 cursor-pointer flex-1"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              const success = await copyToClipboard(classCode);
                                              if (success) showToast(`تم نسخ كود ${className}`, 'success');
                                            }}
                                          >
                                            <QrCode size={14} className="text-blue-400" />
                                            <div className="flex flex-col">
                                              <span className="text-[9px] text-white/40 font-bold leading-tight">{className}:</span>
                                              <span className="text-blue-400 font-mono text-[10px] font-black tracking-wider uppercase">{classCode}</span>
                                            </div>
                                          </div>
                                          
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleGenerateTeacherCode(teacher, className); }}
                                            className="p-2 bg-rose-600/20 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                                            title="إعادة توليد الكود"
                                          >
                                            <RotateCcw size={12} />
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); shareTeacherCode(teacher, classCode, className); }}
                                            className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                            title="مساعدة الكود"
                                          >
                                            <Send size={12} className="-rotate-45" />
                                          </button>
                                        </div>
                                      )) : (
                                        <div className="bg-black/40 p-3 rounded-2xl border border-blue-500/30 flex items-center justify-between group/code relative">
                                          <div 
                                            className="flex items-center gap-2 cursor-pointer flex-1"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              const success = await copyToClipboard(teacher.code || '');
                                              if (success) showToast('تم نسخ الكود بنجاح', 'success');
                                            }}
                                          >
                                            <QrCode size={14} className="text-blue-400" />
                                            <div className="flex flex-col">
                                              <span className="text-[10px] text-white/40 font-bold">كود المنصة:</span>
                                              <span className="text-blue-400 font-mono text-[11px] font-black tracking-wider uppercase">{teacher.code}</span>
                                            </div>
                                          </div>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleGenerateTeacherCode(teacher); }}
                                            className="p-2 bg-rose-600/20 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                                            title="إعادة توليد الكود"
                                          >
                                            <RotateCcw size={12} />
                                          </button>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); shareTeacherCode(teacher); }}
                                            className="p-2 bg-blue-600/20 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                          >
                                            <Send size={12} className="-rotate-45" />
                                          </button>
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
                                      <div className="w-12 h-12 bg-blue-400/10 rounded-full flex items-center justify-center text-blue-400">
                                          {getRoleIcon(staff.subject, 'STAFF')}
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
                  <ScheduleManager teachers={teachers} showToast={showToast} CLASSES={CLASSES} schoolId={schoolId} />
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
                            <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center text-amber-500">
                                {getRoleIcon(selectedTeacher.subject, selectedTeacher.role || 'TEACHER', 40)}
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
                                  <span className="text-white/50 text-xs block mb-1">الصفوف</span>
                                  <div className="space-y-1">{(selectedTeacher.classes || []).map(c => <span key={c} className="block text-white text-sm">{c}</span>)}</div>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#101935] border border-white/5 p-6 rounded-[30px] w-full max-w-md space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-white font-black">{editingTeacher ? 'تعديل بيانات المدرس' : 'إضافة مدرس جديد'}</h4>
                        <button onClick={() => setIsAdding(false)}><X size={20} className="text-white" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-3">
                        <input type="text" placeholder={formData.role === 'TEACHER' ? "اسم المدرس" : "اسم الموظف"} className="w-full bg-black/40 p-3 rounded-xl text-white text-xs border border-white/10" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                        
                        {formData.role === 'TEACHER' ? (
                          <select className="w-full bg-black/40 p-3 rounded-xl text-white text-xs border border-white/10" value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} required>
                              <option value="">اختر المادة</option>
                              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <select className="w-full bg-black/40 p-3 rounded-xl text-white text-xs border border-white/10" value={formData.subject || ''} onChange={e => setFormData({...formData, subject: e.target.value})} required>
                              <option value="">اختر المسمى الوظيفي</option>
                              {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}

                        {formData.role === 'TEACHER' && (
                          <>
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs text-right block">الصفوف</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-black/20 p-2 rounded-xl">
                                    {CLASSES.map(c => (
                                        <label key={c} className="flex items-center gap-2 text-white text-xs">
                                            <input type="checkbox" checked={(formData.classes || []).includes(c)} onChange={e => {
                                                const current = formData.classes || [];
                                                const newClasses = e.target.checked 
                                                    ? [...current, c] 
                                                    : current.filter(i => i !== c);
                                                setFormData({...formData, classes: newClasses});
                                            }} />
                                            {c}
                                        </label>
                                    ))}
                                </div>
                            </div>
    
                            <div className="space-y-2">
                                <label className="text-white/60 text-xs text-right block">ايام الحصص</label>
                                <div className="grid grid-cols-2 gap-2 bg-black/20 p-2 rounded-xl">
                                    {DAYS.map(d => (
                                        <label key={d} className="flex items-center gap-2 text-white text-xs">
                                            <input type="checkbox" checked={(formData.schedule || []).includes(d)} onChange={e => {
                                                const current = formData.schedule || [];
                                                const newDays = e.target.checked 
                                                    ? [...current, d] 
                                                    : current.filter(i => i !== d);
                                                setFormData({...formData, schedule: newDays});
                                            }} />
                                            {d}
                                        </label>
                                    ))}
                                </div>
                            </div>
                          </>
                        )}

                        <textarea placeholder="نبذة قصيرة" className="w-full bg-black/40 p-3 rounded-xl text-white text-xs border border-white/10" value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} required />

                        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs">{editingTeacher ? 'حفظ التعديلات' : 'إضافة'}</button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
