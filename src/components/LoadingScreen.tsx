import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { useAppLogo } from './BerqCharacterManager';

interface LoadingScreenProps {
  onFinish?: () => void;
  videoSrc?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish, videoSrc = "/short-intro.mp4" }) => {
  const appLogo = useAppLogo();
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    // If onFinish is provided, guarantee dismissal within 1.5 seconds max
    if (onFinishRef.current) {
      const fallbackTimer = setTimeout(() => {
        onFinishRef.current?.();
      }, 1500);
      return () => clearTimeout(fallbackTimer);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-[9999] overflow-hidden select-none" dir="rtl">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0A1024] to-[#050A18] pointer-events-none" />
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-10" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, rgba(212,175,55,0.8) 1px, transparent 1px)', 
          backgroundSize: '36px 36px' 
        }} 
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-transparent to-transparent opacity-80" />

      {/* Main Elegant Loading Visual */}
      <div className="relative flex flex-col items-center justify-center z-10 text-center p-6">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#D4AF37]/20 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />
          <div className="w-24 h-24 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
            <img 
              src={appLogo || "https://raw.githubusercontent.com/Arkan-M/Resources/main/Gate6/berq_logo.png"} 
              alt="بوابة بيرق" 
              className="w-14 h-14 object-contain rounded-full drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
          </div>
        </div>

        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#F59E0B] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)] mb-2">
          بوابة بيرق
        </h1>
        <p className="text-xs font-bold text-[#D4AF37]/70 tracking-widest uppercase mb-6">
          GATE 6 - المنصة التعليمية الذكية
        </p>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" />
        </div>

        {/* Instant Skip Button if onFinish is available */}
        {onFinish && (
          <button
            onClick={() => onFinishRef.current?.()}
            className="flex items-center gap-2.5 bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:brightness-110 text-slate-950 font-black px-7 py-3 rounded-full text-sm shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>دخول المنصة ⚡</span>
          </button>
        )}
      </div>
    </div>
  );
};


