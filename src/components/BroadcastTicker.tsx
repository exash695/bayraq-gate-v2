import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Megaphone } from 'lucide-react';
import { useRemoteConfig } from '../services/remoteConfig';

interface BroadcastTickerProps {
  schoolId: string;
  grade: string;
  isVisible: boolean;
  isTeacher?: boolean;
}

export const BroadcastTicker: React.FC<BroadcastTickerProps> = ({ schoolId, grade, isVisible, isTeacher }) => {
  const remoteConfig = useRemoteConfig();
  const [broadcasts, setBroadcasts] = useState<{ message: string; id: string }[]>([]);

  useEffect(() => {
    if (!schoolId || !isVisible) return;

    const q = query(
      collection(db, 'broadcasts'),
      orderBy('timestampMs', 'desc'),
      limit(40)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBroadcasts = snapshot.docs
        .map(doc => {
          const docData = doc.data();
          const timestampMs = docData.timestampMs || ((docData.timestamp && typeof docData.timestamp.toMillis === 'function')
            ? docData.timestamp.toMillis()
            : Date.now());
          return {
            message: docData.message,
            id: doc.id,
            author: docData.author || '',
            subject: docData.subject || '',
            targetGrades: docData.targetGrades as string[],
            schoolId: docData.schoolId || '',
            targetLocation: docData.targetLocation || 'both',
            expiryDate: docData.expiryDate || 0,
            timestampMs
          };
        })
        .filter(b => b.expiryDate > Date.now())
        .filter(b => b.targetLocation === 'ticker' || b.targetLocation === 'both' || b.targetLocation === 'all' || !b.targetLocation)
        .filter(b => b.schoolId === '' || b.schoolId === schoolId)
        .filter(b => isTeacher || b.targetGrades.includes('الجميع') || (grade && b.targetGrades.includes(grade)))
        .sort((a, b) => {
          // 1. Prioritize school radio / admin broadcasts (author is empty)
          const isAAdmin = !a.author;
          const isBAdmin = !b.author;
          if (isAAdmin && !isBAdmin) return -1;
          if (!isAAdmin && isBAdmin) return 1;
          
          // 2. If both are same type, sort by timestampMs descending (newest first)
          return b.timestampMs - a.timestampMs;
        })
        .slice(0, 5);
      
      setBroadcasts(allBroadcasts);
    }, (error) => {
      console.error("Ticker Listener Error:", error);
    });

    return () => unsubscribe();
  }, [schoolId, grade, isVisible, isTeacher]);

  if (!remoteConfig.tickerEnabled) {
    return null;
  }

  const broadcastsList = [
    ...(remoteConfig.tickerText ? [{ id: 'cloud_remote_ticker', message: `📢 [إعلان سحابي عاجل]: ${remoteConfig.tickerText}` }] : []),
    ...broadcasts
  ];

  // Calculate length based on content to adapt the animation speed
  const tickerTextLength = broadcastsList.reduce((acc, b) => acc + b.message.length, 0);
  const baseSpeedSeconds = remoteConfig.tickerSpeed === 'fast' ? 10 : remoteConfig.tickerSpeed === 'slow' ? 35 : 20;
  const dynamicDuration = Math.max(tickerTextLength * 0.15 + 4, baseSpeedSeconds);

  return (
    <div className="bg-[#fbbf24] text-black h-full flex items-center overflow-hidden relative" dir="rtl">
      {/* Inline styles for perfect keyframe support in fake framer workspace */}
      <style>{`
        @keyframes ticker-scroll-seamless {
          0% {
            transform: translate3d(-50%, 0, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        .ticker-scroller-active {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: ticker-scroll-seamless var(--ticker-speed, 20s) linear infinite;
          width: max-content;
        }
        .ticker-scroller-active:hover {
          animation-play-state: paused;
          cursor: pointer;
        }
      `}</style>

      {/* Ticker Content container */}
      <div className="flex-1 overflow-hidden h-full flex items-center relative" dir="ltr">
        {broadcastsList.length === 0 ? (
          <div
            style={{ '--ticker-speed': '15s' } as React.CSSProperties}
            className="ticker-scroller-active font-black text-[11px] opacity-75 tracking-wide"
          >
            {/* First copy */}
            <div className="flex items-center justify-around px-6 shrink-0 min-w-full gap-12">
              <span className="whitespace-nowrap shrink-0" dir="rtl">لا توجد تبليغات نشطة حالياً في منصة الصف</span>
              <span className="text-red-700/0 font-extrabold text-sm mx-4 shrink-0">✦</span>
            </div>
            {/* Second copy */}
            <div className="flex items-center justify-around px-6 shrink-0 min-w-full gap-12">
              <span className="whitespace-nowrap shrink-0" dir="rtl">لا توجد تبليغات نشطة حالياً في منصة الصف</span>
              <span className="text-red-700/0 font-extrabold text-sm mx-4 shrink-0">✦</span>
            </div>
          </div>
        ) : (
          <div
            style={{ '--ticker-speed': `${dynamicDuration}s` } as React.CSSProperties}
            className="ticker-scroller-active font-black text-xs md:text-xs tracking-wide"
          >
            {/* First copy */}
            <div className="flex items-center gap-12 px-6 shrink-0 min-w-full justify-around">
              <div className="flex items-center gap-12 shrink-0">
                {broadcastsList.map((b, idx) => (
                  <div key={`${b.id}-1`} className="flex items-center gap-3 shrink-0" dir="rtl">
                    {idx > 0 && (
                      <span className="text-red-700 font-extrabold text-sm mx-2 animate-pulse shrink-0">
                        ✦
                      </span>
                    )}
                    <Megaphone className="w-3.5 h-3.5 inline-block shrink-0 animate-bounce text-red-700" />
                    <span className="whitespace-nowrap shrink-0">{b.message}</span>
                  </div>
                ))}
              </div>
              {/* Separator between copy 1 and copy 2 */}
              <span className="text-red-700 font-extrabold text-sm mx-4 animate-pulse shrink-0">
                ✦
              </span>
            </div>

            {/* Second copy for seamless transition */}
            <div className="flex items-center gap-12 px-6 shrink-0 min-w-full justify-around">
              <div className="flex items-center gap-12 shrink-0">
                {broadcastsList.map((b, idx) => (
                  <div key={`${b.id}-2`} className="flex items-center gap-3 shrink-0" dir="rtl">
                    {idx > 0 && (
                      <span className="text-red-700 font-extrabold text-sm mx-2 animate-pulse shrink-0">
                        ✦
                      </span>
                    )}
                    <Megaphone className="w-3.5 h-3.5 inline-block shrink-0 animate-bounce text-red-700" />
                    <span className="whitespace-nowrap shrink-0">{b.message}</span>
                  </div>
                ))}
              </div>
              {/* Separator to balance the loop */}
              <span className="text-red-700 font-extrabold text-sm mx-4 animate-pulse shrink-0">
                ✦
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Left Label Section (Static badge on left side in RTL layout) */}
      <div className="h-full px-2 flex flex-col justify-center items-center bg-[#fbbf24] border-r border-black/10 shrink-0 shadow-[5px_0_15px_rgba(0,0,0,0.05)] z-20 select-none min-w-[50px]" dir="rtl">
        {isTeacher ? (
          <span className="text-[11px] font-black text-black flex items-center justify-center gap-1">
            الإذاعة <span className="text-[10px]">📡</span>
          </span>
        ) : (
          <span className="text-[9px] sm:text-[10px] font-black text-black flex flex-col items-center justify-center leading-none text-center h-full w-full">
            <span>تبليغ</span>
            <span>عاجل</span>
          </span>
        )}
      </div>
    </div>
  );
};
