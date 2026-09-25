import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, limit, orderBy, addDoc, serverTimestamp } from '../lib/firebase';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, MapPin, Users, Swords } from 'lucide-react';

interface OnlineKnight {
  id: string;
  name: string;
  rank: string;
  cityName: string;
  color: string;
  score: number;
}

interface KnightsRadarBarProps {
  gradeFilter?: string;
  isCompact?: boolean;
}

export const KnightsRadarBar: React.FC<KnightsRadarBarProps> = ({ gradeFilter, isCompact }) => {
  const [onlineKnights, setOnlineKnights] = useState<OnlineKnight[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChallenging, setIsChallenging] = useState<string | null>(null);

  const sendChallenge = async (knight: OnlineKnight) => {
    if (!auth.currentUser) return;
    setIsChallenging(knight.id);
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        userId: knight.id,
        type: 'challenge',
        subType: '1vs1',
        challengerId: auth.currentUser.uid,
        challengerName: auth.currentUser.displayName || 'فارس',
        
        read: false,
        status: 'pending'
      })
      });
      alert(`تم إرسال طلب التحدي إلى ${knight.name}`);
    } catch (error) {
      console.error("Error sending challenge:", error);
    } finally {
      setIsChallenging(null);
    }
  };

  useEffect(() => {
    // Query users active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    let q = query(
      collection(db, 'users'), 
      where('lastActive', '>=', fiveMinutesAgo),
      orderBy('lastActive', 'desc'),
      limit(50)
    );

    // Apply grade filter if provided
    if (gradeFilter) {
      q = query(
        collection(db, 'users'),
        where('lastActive', '>=', fiveMinutesAgo),
        where('grade', '==', gradeFilter),
        orderBy('lastActive', 'desc'),
        limit(50)
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const knights = snapshot.docs
        .filter(doc => doc.data().profileCompleted === true)
        .map(doc => {
          const data = doc.data();
          const score = data.totalScore || 0;
          let color = '#38bdf8'; 
          if (score > 95) color = '#facc15'; 
          else if (score > 80) color = '#22c55e'; 
          else if (score < 50) color = '#f43f5e'; 

          return {
            id: doc.id,
            name: data.fullName || data.displayName || data.name || 'فارس مجهول',
            rank: data.rank || 'مقاتل',
            cityName: data.governorate || 'غير محدد',
            color: color,
            score: score
          };
        });

      setOnlineKnights(knights);
    }, (error) => {
      console.warn("KnightsRadarBar error:", error);
    });

    return () => unsubscribe();
  }, [gradeFilter]);

  if (isCompact) {
    return (
      <div 
        dir="rtl"
        onClick={() => setIsModalOpen(true)}
        className="mx-0 bg-[#0A1229]/60 backdrop-blur-md rounded-2xl p-4 border border-white/5 space-y-3 cursor-pointer group hover:bg-[#0A1229]/80 transition-all overflow-hidden shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Users size={16} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-white text-xs font-black">الفرسان المرابطون</h4>
              <p className="text-white/40 text-[9px] font-bold">النشطين من صفك: {onlineKnights.length}</p>
            </div>
          </div>
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {onlineKnights.slice(0, 3).map((k) => (
              <div 
                key={k.id} 
                className="w-6 h-6 rounded-full border-2 border-[#0A1229] bg-gray-800 flex items-center justify-center text-[10px] text-white shadow-sm"
                style={{ borderColor: k.color }}
              >
                {k.name[0]}
              </div>
            ))}
            {onlineKnights.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-[#0A1229] bg-white/5 flex items-center justify-center text-[8px] font-black text-white/60">
                +{onlineKnights.length - 3}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 overflow-hidden relative h-6">
           <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            className="absolute whitespace-nowrap text-white/30 text-[10px] font-black flex gap-12"
          >
            {onlineKnights.map(k => (
              <span key={k.id} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                {k.name} من {k.cityName}
              </span>
            ))}
            {onlineKnights.length === 0 && (
              <span>كن أنت أول الفرسان المرابطين اليوم! ⚔️</span>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stationed Knights Bar */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-sm border-t border-theme-primary/30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center px-6 cursor-pointer hover:bg-theme-primary/5 transition-all z-[100]"
      >
        <div className="flex items-center gap-4 text-theme-primary">
          <div className="relative">
            <Users className="w-6 h-6 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-ping" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight">الفرسان المرابطون</span>
            <span className="text-[10px] font-bold opacity-60">النشطين الآن: {onlineKnights.length}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative h-full flex items-center mx-8">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
            className="absolute whitespace-nowrap text-white/40 text-xs font-bold flex gap-16"
          >
            {onlineKnights.map(k => (
              <span key={k.id} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                الفارس {k.name} مرابط في {k.cityName}
              </span>
            ))}
            {onlineKnights.length === 0 && (
              <span>لا يوجد فرسان مرابطون حالياً... كن أنت الأول! 🛡️</span>
            )}
          </motion.div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-theme-primary/10 rounded-full border border-theme-primary/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-theme-primary uppercase tracking-widest">Live Status</span>
        </div>
      </div>

      {/* Online Knights Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-[#020617] border-2 border-theme-primary/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,229,255,0.1)] overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-white/5 bg-gradient-to-b from-theme-primary/10 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-theme-primary/20 flex items-center justify-center text-theme-primary">
                    <Shield size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white m-0">الفرسان المرابطون</h2>
                    <p className="text-white/40 text-xs font-bold">قائمة الفرسان النشطين في الميدان</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
                {onlineKnights.map(knight => (
                  <div key={knight.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-theme-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-3xl border-2" style={{ borderColor: knight.color }}>
                          👤
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#020617]" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg m-0">{knight.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/10 text-white/60 uppercase tracking-tighter">
                            {knight.rank}
                          </span>
                          <span className="text-xs text-white/40 flex items-center gap-1 font-bold">
                            <MapPin size={12} /> {knight.cityName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-theme-primary font-black text-xl">{knight.score}</div>
                        <div className="text-[10px] font-bold text-white/20 uppercase">Points</div>
                      </div>
                      {knight.id !== auth.currentUser?.uid && (
                        <button
                          onClick={() => sendChallenge(knight)}
                          disabled={isChallenging === knight.id}
                          className="p-3 bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                          title="تحدي هذا الفارس"
                        >
                          <Swords size={20} className={isChallenging === knight.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {onlineKnights.length === 0 && (
                  <div className="text-center py-20">
                    <Users size={48} className="mx-auto text-white/10 mb-4" />
                    <p className="text-white/40 font-bold">لا يوجد فرسان مرابطون حالياً</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
