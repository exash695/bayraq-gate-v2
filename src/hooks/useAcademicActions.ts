import { useState } from 'react';
import { academicService } from '../services/academicService';
import { deleteDoc, doc } from '../lib/firebase';
import { db } from '../lib/firebase';

export const useAcademicActions = (showToast: (msg: string, type?: 'success' | 'error') => void) => {
  const [isSaving, setIsSaving] = useState(false);

  const saveList = async (schoolId: string, listData: any) => {
    if (!schoolId) {
      showToast('خطأ: لا يوجد مدرسة مختارة', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await academicService.saveList(schoolId, listData);
      showToast('تم حفظ البيانات بنجاح');
    } catch (e) {
      console.error("Save Error:", e);
      showToast('فشل حفظ البيانات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntity = async (collectionName: string, docId: string) => {
    try {
      if (collectionName === 'academic_lists') {
        await academicService.deleteList(docId);
      } else if (collectionName === 'school_students') {
        await academicService.deleteStudent(docId);
      } else if (collectionName === 'broadcasts') {
        await deleteDoc(doc(db, collectionName, docId));
      } else {
        showToast('هذه المجموعة غير مدعومة حالياً بالتحديث الجديد', 'error');
        return;
      }
      showToast('تم الحذف بنجاح');
    } catch (e: any) {
      console.error("Delete Error:", e);
      if (e?.message?.includes('Failed to fetch') || e?.message?.includes('NetworkError') || e?.message?.includes('Network request failed')) {
        showToast('تم الحذف محلياً (غير متصل بالإنترنت)', 'success');
      } else {
        showToast('فشل في عملية الحذف: ' + (e?.message || ''), 'error');
      }
    }
  };


  const updateStudent = async (studentId: string, data: any) => {
    try {
      await academicService.updateStudent(studentId, data);
      showToast('تم التحديث بنجاح');
    } catch (e) {
      console.error("Update failed:", e);
      showToast('حدث خطأ أثناء التحديث', 'error');
    }
  };

  const updateList = async (schoolId: string, data: any) => {
    setIsSaving(true);
    try {
      await academicService.saveList(schoolId, data);
      showToast('تم تحديث القائمة بنجاح');
    } catch (e) {
      console.error("Update List Error:", e);
      showToast('فشل تحديث القائمة', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveList,
    deleteEntity,
    updateStudent,
    updateList,
    isSaving
  };
};
