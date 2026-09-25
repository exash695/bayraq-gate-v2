import * as FirebaseMock from "../lib/firebase"; const { db, auth, storage, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, terminate, clearIndexedDbPersistence } = FirebaseMock;
import React, { useState, useEffect } from 'react';
import { staffService } from '../services/staffService';
import { realtimeManager } from '../lib/realtimeManager';
import { Trash2, Plus, Calendar, MonitorPlay, Users, Search, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../utils/auditLogger';
import { TimeSelector } from './TimeSelector';

interface ScheduleEntry {
  id: string;
  day: string;
  className: string;
  sectionName?: string;
  time: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  type: 'live' | 'physical';
}

interface Teacher {
  id: string;
  name: string;
  subject: string;
  teacherStage?: string;
  grade?: string;
  classes?: string[];
  role: string;
}

interface Props {
  teachers: Teacher[];
  showToast: (msg: string, type: 'success' | 'error') => void;
  CLASSES: string[];
  schoolId: string | null;
  savedLists?: any[];
}

import { normalizeArabicText } from '../utils/studentUtils';

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];

export const ScheduleManager: React.FC<Props> = ({ teachers, showToast, CLASSES, schoolId, savedLists = [] }) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [filterClass, setFilterClass] = useState(CLASSES[0]);
  const [times, setTimes] = useState<string[]>(['08:00 صباحاً', '09:00 صباحاً', '10:00 صباحاً', '11:00 صباحاً', '12:00 ظهراً', '01:00 ظهراً', '02:00 ظهراً', '03:00 عصراً', '04:00 عصراً', '05:00 عصراً']);

  const updateTimesBackend = async (newTimes: string[]) => {
      if (!schoolId) return;
      try {
        await staffService.updateSchoolTimes(schoolId, newTimes);
      } catch (err) {
        showToast('فشل تحديث الأوقات', 'error');
      }
  };

  const handleAddBackendTime = (time: string) => {
      const newTimes = [...times, time];
      setTimes(newTimes);
      updateTimesBackend(newTimes);
  };
  const handleEditBackendTime = (oldTime: string, newTime: string) => {
      const newTimes = times.map(t => t === oldTime ? newTime : t);
      setTimes(newTimes);
      updateTimesBackend(newTimes);
  };
  const handleDeleteBackendTime = (time: string) => {
      const newTimes = times.filter(t => t !== time);
      setTimes(newTimes);
      updateTimesBackend(newTimes);
  };

  const [formData, setFormData] = useState({
    day: DAYS[0],
    className: CLASSES[0],
    sectionName: '',
    time: times[0],
    teacherId: '',
    type: 'physical' as 'live' | 'physical'
  });

  const teachingStaff = teachers.filter(t => t.role === 'TEACHER');

  useEffect(() => {
    if (!schoolId) return;
    const fetchTimes = async () => {
      try {
        const data = await staffService.getSchoolTimes(schoolId);
        if (data && data.length > 0) setTimes(data);
      } catch (err) {
        console.warn("ScheduleManager fetchTimes error:", err);
      }
    };
    fetchTimes();
  }, [schoolId]);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const data = await staffService.getSchedules(schoolId || undefined);
        // Enrich schedules with teacher names from the local teachers list
        const enriched = (data as any[]).map(s => {
          const teacher = teachers.find(t => t.id === s.teacherId);
          return {
            ...s,
            teacherName: teacher ? teacher.name : s.teacherName
          };
        });
        setSchedules(enriched);
      } catch (err) {
        console.warn("ScheduleManager fetchSchedules error:", err);
      }
    };
    fetchSchedules();
    const unsub = realtimeManager.on('schedules_updated', fetchSchedules);
    return () => unsub();
  }, [schoolId, teachers]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId || !formData.time || !formData.className) {
      showToast('يرجى إكمال جميع الحقول', 'error');
      return;
    }

    // Conflict Checks
    const teacherConflict = schedules.find(s => 
      s.day === formData.day && 
      s.time === formData.time && 
      s.teacherId === formData.teacherId
    );

    if (teacherConflict) {
      showToast(`يوجد تضارب: الأستاذ ${teacherConflict.teacherName} لديه حصة في هذا الوقت`, 'error');
      return;
    }

    const classConflict = schedules.find(s => 
      s.day === formData.day && 
      s.time === formData.time && 
      s.className === formData.className
    );

    if (classConflict) {
      showToast(`يوجد تضارب: الصف ${formData.className} لديه حصة في هذا الوقت مع الأستاذ ${classConflict.teacherName}`, 'error');
      return;
    }

    const teacher = teachingStaff.find(t => t.id === formData.teacherId);
    if (!teacher) return;

    try {
      const newEntry = {
        day: formData.day,
        className: formData.className,
        sectionName: formData.sectionName,
        time: formData.time,
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: teacher.subject,
        type: formData.type,
        schoolId: schoolId
      };

      const res = await staffService.addSchedule(newEntry);
      setSchedules(prev => [...prev, { ...newEntry, id: res.id } as any]);
      
      logActivity({
        action: 'إضافة حصة',
        details: `تمت إضافة حصة ${teacher.subject} للصف ${formData.className} يوم ${formData.day} (${formData.time})`,
        targetType: 'schedule',
        targetName: formData.className
      });

      showToast('تمت إضافة الحصة بنجاح', 'success');
      setIsAdding(false);
      setFormData(prev => ({ ...prev, time: times[0], teacherId: '' }));
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء إضافة الحصة', 'error');
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = async (id: string, entry: ScheduleEntry) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      return;
    }
    
    setDeleteConfirmId(null);
    try {
      await staffService.deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s.id !== id));
      logActivity({
        action: 'حذف حصة',
        details: `تم حذف حصة ${entry.subject} للصف ${entry.className} يوم ${entry.day} (${entry.time})`,
        targetType: 'schedule',
        targetName: entry.className
      });
      showToast('تم حذف الحصة بنجاح', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const filteredView = schedules.filter(s => s.className === filterClass && s.day === selectedDay);

  // Sort by time (simple index logic based on TIMES array)
  filteredView.sort((a, b) => times.indexOf(a.time) - times.indexOf(b.time));

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#101935] p-6 rounded-[30px] border border-white/5">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <select 
                className="bg-black/40 p-3 rounded-2xl text-white text-sm border border-white/10 w-full md:w-48 outline-none focus:border-purple-500/50"
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, className: filterClass, day: selectedDay }));
                 setIsAdding(true);
              }}
              className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-500 transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.4)]"
            >
              <Plus size={18} /> إضافة حصة جديدة
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-6 py-3 rounded-[20px] font-black text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedDay === day ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'}`}
              >
                <Calendar size={16} /> {day}
              </button>
            ))}
          </div>

          <div className="bg-[#101935] border border-white/5 rounded-[40px] p-6 md:p-8 min-h-[400px]">
            {filteredView.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/30 py-20">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p className="font-bold">لا توجد حصص مضافة لهذا اليوم</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filteredView.map(entry => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative p-5 rounded-[24px] border ${entry.type === 'live' ? 'bg-blue-600/10 border-blue-500/20 shadow-[0_0_30px_-10px_rgba(37,99,235,0.2)]' : 'bg-purple-600/10 border-purple-500/20 shadow-[0_0_30px_-10px_rgba(147,51,234,0.2)]'}`}
                    >
                      <button 
                        onClick={() => handleDelete(entry.id, entry)}
                        className={`absolute top-4 left-4 p-2 rounded-xl transition-colors ${
                          deleteConfirmId === entry.id 
                            ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' 
                            : 'bg-black/20 text-white/20 hover:text-rose-400'
                        }`}
                        title={deleteConfirmId === entry.id ? 'تأكيد الحذف' : 'حذف'}
                      >
                        <Trash2 size={16} className={deleteConfirmId === entry.id ? 'animate-bounce' : ''} />
                      </button>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${entry.type === 'live' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {entry.type === 'live' ? <MonitorPlay size={20} /> : <Users size={20} />}
                        </div>
                        <div>
                          <h4 className={`font-black text-sm ${entry.type === 'live' ? 'text-blue-400' : 'text-purple-400'}`}>
                            {entry.type === 'live' ? 'بث مباشر' : 'حضور فعلي'}
                          </h4>
                          <p className="text-white font-bold text-xs mt-1">{entry.time}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-lg font-black">{entry.subject}</p>
                          {entry.sectionName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                              {entry.sectionName}
                            </span>
                          )}
                        </div>
                        <p className="text-white/60 text-sm font-medium">أ. {entry.teacherName}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          </div>
          
          <div className="lg:col-span-1">
          </div>
      </div>
      
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0b1221] border border-white/10 rounded-[40px] p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                <Calendar className="text-purple-400" />
                إضافة حصة دراسية
              </h3>

              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/40 text-xs font-bold mb-2">اليوم</label>
                    <select 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none cursor-pointer"
                      value={formData.day}
                      onChange={e => setFormData({...formData, day: e.target.value})}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/40 text-xs font-bold mb-2">الوقت</label>
                    <TimeSelector 
                        selectedTime={formData.time}
                        onSelect={(time) => setFormData({...formData, time })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/40 text-xs font-bold mb-2">الصف الدراسي</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none cursor-pointer"
                    value={formData.className}
                    onChange={e => setFormData({...formData, className: e.target.value, sectionName: ''})}
                  >
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Section selection based on savedLists */}
                {savedLists.filter(l => normalizeArabicText(l.students?.[0]?.grade) === normalizeArabicText(formData.className)).length > 0 && (
                  <div>
                    <label className="block text-white/40 text-xs font-bold mb-2">الشعبة (اختياري)</label>
                    <select 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none cursor-pointer"
                      value={formData.sectionName || ''}
                      onChange={e => setFormData({...formData, sectionName: e.target.value})}
                    >
                      <option value="">كافة الشعب (عام)</option>
                      {savedLists
                        .filter(l => normalizeArabicText(l.students?.[0]?.grade) === normalizeArabicText(formData.className))
                        .map(l => (
                          <option key={l.id} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-white/40 text-xs font-bold mb-2">الأستاذ والمادة</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none cursor-pointer"
                    value={formData.teacherId}
                    onChange={e => setFormData({...formData, teacherId: e.target.value})}
                  >
                    <option value="" disabled>اختر الأستاذ...</option>
                    {teachingStaff.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject} - {t.teacherStage || 'عام'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/40 text-xs font-bold mb-3">نوع الحصة</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'live'})}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                        formData.type === 'live' 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                        : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      <MonitorPlay size={24} />
                      <span className="font-bold text-xs">بث مباشر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: 'physical'})}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 border transition-all ${
                        formData.type === 'physical' 
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                        : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/5'
                      }`}
                    >
                      <Users size={24} />
                      <span className="font-bold text-xs">حضور فعلي</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 bg-white/5 text-white/60 font-bold rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-colors"
                  >
                    حفظ الحصة
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
