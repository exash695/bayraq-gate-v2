import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sparkles, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalAnnouncementsBannerProps {
  dashboardType: 'admin' | 'student' | 'teacher' | 'parent' | 'driver';
  schoolId?: string;
}

export const GlobalAnnouncementsBanner: React.FC<GlobalAnnouncementsBannerProps> = ({ dashboardType, schoolId }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dismissed_announcements_banner');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'broadcasts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const list = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          const timestampMs = data.timestampMs || ((data.timestamp && typeof data.timestamp.toMillis === 'function')
            ? data.timestamp.toMillis()
            : Date.now());
          return {
            id: docSnap.id,
            ...data,
            timestampMs
          };
        })
        .filter((item: any) => {
          if (item.expiryDate && item.expiryDate < now) return false;
          if (item.type === 'school_broadcast' || item.isSchoolBroadcast || item.targetLocation === 'ticker') {
            return false;
          }
          if (!item.isCentralPlatform && !item.isGlobalAnnouncement) {
            if (item.targetLocation !== 'top_banner' && item.targetLocation !== 'both' && item.targetLocation !== 'all') {
              return false;
            }
          }
          const loc = item.targetLocation || (item.isCentralPlatform ? 'both' : 'ticker');
          if (loc !== 'top_banner' && loc !== 'both' && loc !== 'all') return false;
          const targets = Array.isArray(item.targetDashboards) ? item.targetDashboards : ['all'];
          if (dashboardType && dashboardType !== 'admin' && !targets.includes('all') && !targets.includes(dashboardType)) return false;
          if (item.schoolId && schoolId && item.schoolId !== '' && item.schoolId !== schoolId) return false;
          return true;
        })
        .sort((a, b) => b.timestampMs - a.timestampMs);

      setAnnouncements(list);
    }, (err) => {
      console.error("Global announcements banner listener error:", err);
    });

    return () => unsubscribe();
  }, [dashboardType, schoolId]);

  const activeAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0];

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => {
      const updated = [...prev, id];
      try {
        localStorage.setItem('dismissed_announcements_banner', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="w-full bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-blue-600/20 border border-amber-500/30 rounded-3xl p-4 sm:p-5 mb-6 backdrop-blur-xl relative overflow-hidden shadow-[0_10px_30px_rgba(251,191,36,0.15)] z-40"
          dir="rtl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
            {current.imageUrl && (
              <div 
                onClick={() => setZoomedImage(current.imageUrl)}
                className="w-full md:w-auto max-w-md max-h-64 rounded-2xl overflow-hidden shrink-0 border border-amber-500/30 bg-black/60 p-2 relative group cursor-pointer flex items-center justify-center shadow-2xl hover:border-amber-400 transition-all"
              >
                <img
                  src={current.imageUrl}
                  alt={current.title || 'إعلان'}
                  className="w-full h-auto max-h-56 object-contain rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs rounded-2xl">
                  <Maximize2 size={18} className="text-amber-400" />
                  <span>انقر لعرض الصورة بالحجم الكامل 🔍</span>
                </div>
              </div>
            )}

            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30 flex items-center gap-1">
                  <Sparkles size={12} />
                  {current.category || 'إعلان وتبريكات'}
                </span>
                <span className="text-white/40 text-[10px] font-bold">
                  {new Date(current.timestampMs || Date.now()).toLocaleDateString('ar-SA')}
                </span>
              </div>

              <h3 className="text-white text-base sm:text-lg font-black leading-snug mb-1 drop-shadow-md">
                {current.title || 'إعلان هام للمنصة'}
              </h3>

              <p className="text-white/80 text-xs sm:text-sm leading-relaxed line-clamp-4 whitespace-pre-line">
                {current.message}
              </p>
            </div>

            <div className="flex md:flex-col items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => handleDismiss(current.id)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <span>تم الاطلاع</span>
              </button>
              {activeAnnouncements.length > 1 && (
                <button
                  onClick={() => setCurrentIndex((currentIndex + 1) % activeAnnouncements.length)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] transition-all"
                >
                  التالي ({currentIndex + 1}/{activeAnnouncements.length})
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Lightbox Modal for Full Size Image */}
      <AnimatePresence>
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setZoomedImage(null)}
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all cursor-pointer"
              >
                <X size={24} />
              </button>
              <img
                src={zoomedImage}
                alt="الصورة الكاملة"
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-amber-500/30"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
