import * as FirebaseMock from "../lib/firebase"; const { db, auth, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, getDoc, getDocFromServer, getDocFromCache, increment, arrayUnion, arrayRemove, writeBatch, runTransaction, purgeFirestore, getStorage, ref, deleteObject } = FirebaseMock;
import React, { useState, useEffect } from 'react';
import { Bell, X, MonitorPlay, Users, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { safeStorage, safeSessionStorage } from '../lib/storage';

interface ScheduleEntry {
  id: string;
  day: string;
  className: string;
  time: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  type: 'live' | 'physical';
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const normalizeDay = (d: string) => (d || '').replace(/[إأآٱ]/g, 'ا').trim();

interface Props {
  grade: string;
  isTeacher?: boolean;
  teacherId?: string;
  userName?: string;
}

export const ScheduleAlerter: React.FC<Props> = ({ grade, isTeacher, teacherId, userName }) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [activeAlert, setActiveAlert] = useState<ScheduleEntry | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let q;
    if (isTeacher && teacherId) {
      q = query(collection(db, 'class_schedules'), where('teacherId', '==', teacherId || 'unassigned'));
    } else {
      q = query(collection(db, 'class_schedules'), where('className', '==', grade || 'unassigned'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as ScheduleEntry)
        .filter(entry => entry.subject && entry.time);
      setSchedules(data);
    }, (error) => {
      console.warn("ScheduleAlerter error:", error);
      if (error.message && error.message.includes('Unexpected state') && error.message.includes('ca9')) {
        terminate(db).then(() => {
          clearIndexedDbPersistence(db).then(() => {
            window.location.reload();
          });
        });
      }
    });

    return () => unsubscribe();
  }, [grade, isTeacher, teacherId]);

  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentDayAr = DAYS_AR[now.getDay()];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const todaySchedules = schedules.filter(s => normalizeDay(s.day) === normalizeDay(currentDayAr) && !dismissedIds.has(s.id));

      for (const entry of todaySchedules) {
        const timeParts = entry.time.split(' ');
        if (timeParts.length < 2) continue;

        const clockParts = timeParts[0].split(':');
        let hour = parseInt(clockParts[0]);
        const minute = parseInt(clockParts[1]);
        const period = timeParts[1]; // 'صباحاً', 'ظهراً', 'عصراً', 'مساءً'

        // Convert to 24h format for comparison
        if (period === 'صباحاً') {
           if (hour === 12) hour = 0;
        } else if (period === 'ظهراً' || period === 'عصراً' || period === 'مساءً') {
           if (hour !== 12) hour += 12;
        }

        const scheduledTime = new Date();
        scheduledTime.setHours(hour, minute, 0, 0);

        const diffMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

        // Alert if starting in 0-2 minutes
        const isAlertsEnabled = safeStorage.getItem('classAlertsEnabled') !== 'false';
        if (isAlertsEnabled && diffMinutes > 0 && diffMinutes <= 2) {
          setActiveAlert(entry);
          return; // Show one alert at a time
        }
      }
      
      setActiveAlert(null);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedules, dismissedIds]);

  const handleDismiss = () => {
    if (activeAlert) {
      setDismissedIds(prev => new Set(prev).add(activeAlert.id));
      setActiveAlert(null);
    }
  };

  return (
    <AnimatePresence>
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-4 left-4 md:left-auto md:right-8 md:w-96 z-[100]"
        >
          <div className="bg-[#101935] border border-amber-500/30 rounded-[30px] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
            {/* Animated Glow Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50" />
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px]" 
            />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner border border-amber-500/30">
                  <Bell className="animate-bounce" size={24} />
                </div>
                <button 
                  onClick={handleDismiss}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">تنبيه موعد الحصة</h4>
                  <p className="text-white text-xl font-black leading-tight">
                    {activeAlert.subject}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                   <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <Calendar size={14} className="text-amber-500/70" />
                      <span>{activeAlert.time}</span>
                   </div>
                   <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      {activeAlert.type === 'live' ? <MonitorPlay size={14} className="text-blue-400" /> : <Users size={14} className="text-purple-400" />}
                      <span>{activeAlert.type === 'live' ? 'بث مباشر' : 'حضوري'}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">
                         {isTeacher ? activeAlert.className[0] : activeAlert.teacherName[0]}
                      </div>
                      <span className="text-white/40 text-xs font-bold">
                         {isTeacher ? activeAlert.className : `أ. ${activeAlert.teacherName}`}
                      </span>
                   </div>
                   <button 
                    onClick={handleDismiss}
                    className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black px-6 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                   >
                     حسناً، فهمت
                   </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
