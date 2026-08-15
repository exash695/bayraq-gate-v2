import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Sparkles, X, Bell, Maximize2, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalAnnouncementsPopupProps {
  dashboardType: 'admin' | 'student' | 'teacher' | 'parent' | 'driver';
  schoolId?: string;
}

export const GlobalAnnouncementsPopup: React.FC<GlobalAnnouncementsPopupProps> = ({ dashboardType, schoolId }) => {
  const [popupAnnouncement, setPopupAnnouncement] = useState<any | null>(null);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
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
          // Ignore items already dismissed locally
          if (localStorage.getItem(`dismissed_popup_${item.id}`) === 'true') return false;

          // Exclude school radio broadcasts and school-level messages strictly from global popups
          if (item.type === 'school_broadcast' || item.isSchoolBroadcast || item.targetLocation === 'ticker') {
            return false;
          }

          if (!item.isCentralPlatform && !item.isGlobalAnnouncement) {
            // Non-central items without explicit popup/both target location must not popup
            if (item.targetLocation !== 'popup' && item.targetLocation !== 'both' && item.targetLocation !== 'all') {
              return false;
            }
          }

          const loc = item.targetLocation || (item.isCentralPlatform ? 'both' : 'ticker');
          if (loc !== 'popup' && loc !== 'both' && loc !== 'all') return false;

          // For admin dashboard view, DO NOT pop up school-level broadcasts or broadcasts created by school admins
          if (dashboardType === 'admin') {
            if (item.authorRole === 'school_admin' || item.senderId || (item.schoolId && item.schoolId !== '' && !item.isCentralPlatform)) {
              return false;
            }
          }

          const targets = Array.isArray(item.targetDashboards) ? item.targetDashboards : ['all'];
          if (dashboardType && dashboardType !== 'admin' && !targets.includes('all') && !targets.includes(dashboardType)) return false;
          if (item.schoolId && schoolId && item.schoolId !== '' && item.schoolId !== schoolId) return false;
          return true;
        })
        .sort((a, b) => b.timestampMs - a.timestampMs);

      setAnnouncementsList(list);

      if (list.length > 0) {
        const undismissed = list.find((item: any) => !localStorage.getItem(`dismissed_popup_${item.id}`));
        if (undismissed) {
          setPopupAnnouncement(undismissed);
          setIsOpen(true);
        } else {
          setPopupAnnouncement(list[0]);
          setIsOpen(false);
        }
      } else {
        setPopupAnnouncement(null);
        setIsOpen(false);
      }
    }, (err) => {
      console.error("Popup announcements listener error:", err);
    });

    return () => unsubscribe();
  }, [dashboardType, schoolId]);

  const handleClose = () => {
    if (popupAnnouncement) {
      localStorage.setItem(`dismissed_popup_${popupAnnouncement.id}`, 'true');
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Main Popup Modal */}
      <AnimatePresence>
        {isOpen && popupAnnouncement && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-[#121829] to-[#0A0E1A] border border-amber-500/40 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-[0_0_60px_rgba(251,191,36,0.35)] relative flex flex-col my-auto"
            >
              {/* Header */}
              <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] border border-amber-500/30">
                      {popupAnnouncement.category || 'إعلان وتبريكات'}
                    </span>
                    <h3 className="text-white font-black text-lg sm:text-xl mt-0.5 leading-snug">{popupAnnouncement.title || 'إعلان هام للمنصة'}</h3>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
                {popupAnnouncement.imageUrl && (
                  <div className="w-full rounded-2xl overflow-hidden border border-amber-500/30 bg-black/70 p-2 shadow-2xl relative group flex items-center justify-center">
                    <img
                      src={popupAnnouncement.imageUrl}
                      alt={popupAnnouncement.title || 'إعلان'}
                      className="max-w-full max-h-[55vh] h-auto w-auto object-contain rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                      onClick={() => setZoomedImage(popupAnnouncement.imageUrl)}
                    />
                    <div 
                      onClick={() => setZoomedImage(popupAnnouncement.imageUrl)}
                      className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-amber-500 text-amber-300 hover:text-black text-xs font-black transition-all flex items-center gap-1.5 border border-amber-500/40 shadow-lg cursor-pointer"
                    >
                      <Maximize2 size={14} />
                      <span>عرض بحجم كامل 🔍</span>
                    </div>
                  </div>
                )}

                <div className="text-right space-y-3">
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
                    {popupAnnouncement.message}
                  </p>
                  <div className="text-white/40 text-[10px] pt-3 border-t border-white/5 flex items-center justify-between">
                    <span>الناشر: {popupAnnouncement.author || 'إدارة المنصة المركزية'}</span>
                    <span>{new Date(popupAnnouncement.timestampMs || Date.now()).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-black/50 border-t border-white/10 flex items-center justify-between gap-3">
                {announcementsList.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {announcementsList.map((ann, idx) => (
                      <button
                        key={ann.id}
                        onClick={() => setPopupAnnouncement(ann)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${popupAnnouncement.id === ann.id ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="mr-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs transition-all shadow-lg cursor-pointer"
                >
                  تم الاطلاع / إخفاء النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Image Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg"
            onClick={() => setZoomedImage(null)}
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 bg-white/20 hover:bg-white/30 text-white p-2.5 rounded-full transition-all cursor-pointer"
              >
                <X size={24} />
              </button>
              <img
                src={zoomedImage}
                alt="الصورة الكاملة"
                className="max-w-full max-h-[88vh] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-amber-500/40"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
