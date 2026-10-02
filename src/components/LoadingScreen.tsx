import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppLogo } from './BerqCharacterManager';

interface LoadingScreenProps {
  onFinish?: () => void;
  videoSrc?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const appLogo = useAppLogo();
  const [progress, setProgress] = useState(15);
  const [showDirectButton, setShowDirectButton] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // Smooth animated progress bar from 15% to 100%
  useEffect(() => {
    const startTime = Date.now();
    const duration = 900; // 0.9 seconds smooth fill

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const current = Math.min(100, Math.round(15 + (elapsed / duration) * 85));
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (onFinishRef.current) {
            onFinishRef.current();
          }
        }, 150);
      }
    }, 30);

    // Safety timer showing direct button after 1.2s if stuck
    const safetyTimer = setTimeout(() => {
      setShowDirectButton(true);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimer);
    };
  }, []);

  const getStatusMessage = (p: number) => {
    if (p < 35) return "جاري الاتصال والتحقق من الأمان...";
    if (p < 75) return "جاري تحضير القاعات والدروس التعليمية...";
    if (p < 95) return "جاري تجهيز بوابة بيرق الذكية...";
    return "جاهز! أهلاً بك في المنصة ⚡";
  };

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[9999] overflow-hidden select-none" dir="rtl">
      {/* Ambient Gradient Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#091129] to-[#020617] pointer-events-none" />
      
      {/* Decorative Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-15" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, rgba(212,175,55,0.8) 1.2px, transparent 1.2px)', 
          backgroundSize: '32px 32px' 
        }} 
      />

      {/* Gold Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-gradient-to-r from-[#D4AF37]/20 via-[#F59E0B]/10 to-transparent blur-[90px] rounded-full pointer-events-none animate-pulse" />

      {/* Main Luxury Container */}
      <div className="relative flex flex-col items-center justify-center z-10 text-center p-6 max-w-sm w-full mx-auto">
        
        {/* Animated Central Emblem */}
        <div className="relative mb-7 flex items-center justify-center">
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 bg-[#D4AF37]/25 blur-2xl rounded-full scale-125 pointer-events-none" />
          
          {/* Rotating Outer Ring */}
          <div className="w-28 h-28 rounded-full border-2 border-[#D4AF37]/25 border-t-[#D4AF37] border-r-[#F59E0B] animate-spin flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.35)]">
            <div className="w-24 h-24 rounded-full border border-white/10 bg-[#060D20]/80 backdrop-blur-md flex items-center justify-center">
              <img 
                src={appLogo || "/logo.png"} 
                alt="بوابة بيرق" 
                className="w-16 h-16 object-contain rounded-full drop-shadow-[0_0_18px_rgba(212,175,55,0.6)]"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>
          </div>
        </div>

        {/* Platform Title */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFD700] to-[#F59E0B] drop-shadow-[0_2px_12px_rgba(212,175,55,0.4)] mb-2 tracking-tight">
          بوابة بيرق
        </h1>
        
        {/* Subtitle Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full mb-8 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD700] animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[11px] font-black text-[#F59E0B] tracking-wider uppercase">
            GATE 6 • المنصة التعليمية الذكية
          </span>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-white/70 px-1">
            <span className="flex items-center gap-1.5 text-amber-300/90 text-[11.5px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              {getStatusMessage(progress)}
            </span>
            <span className="font-mono text-[#FFD700] text-xs">{progress}%</span>
          </div>

          <div className="relative w-full h-2.5 bg-slate-900/80 border border-[#D4AF37]/20 rounded-full overflow-hidden p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#F59E0B] rounded-full relative overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.6)]"
              initial={{ width: "15%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            >
              {/* Shining highlight effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Direct Action Button if needed */}
        {(showDirectButton || onFinish) && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onFinishRef.current?.()}
            className="mt-2 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] hover:brightness-110 text-slate-950 font-black px-8 py-3 rounded-full text-sm shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95 transition-all cursor-pointer border border-amber-300/30"
          >
            <GraduationCap className="w-4 h-4" />
            <span>دخول المنصة ⚡</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};



