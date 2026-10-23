import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Volume2, VolumeX, GraduationCap, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppLogo } from './BerqCharacterManager';

interface LoadingScreenProps {
  onFinish?: () => void;
  videoSrc?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onFinish, 
  videoSrc = '/short-intro.mp4' 
}) => {
  const appLogo = useAppLogo();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);

  // Fallback loader state if video fails or is disabled
  const [progress, setProgress] = useState(15);
  const [showDirectButton, setShowDirectButton] = useState(false);

  const finishedRef = useRef(false);

  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (err) {}
    }
    if (onFinish) {
      onFinish();
    }
  }, [onFinish]);

  const handleSkip = useCallback((e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    handleFinish();
  }, [handleFinish]);

  // Attempt to play video on mount
  useEffect(() => {
    finishedRef.current = false;
    if (videoSrc === 'none') {
      setVideoFailed(true);
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Failsafe timer: video duration is 4 seconds, so failsafe at 4.2s max
    const failsafeTimer = setTimeout(() => {
      handleFinish();
    }, 4200);

    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setHasStartedPlaying(true);
        })
        .catch((err) => {
          console.warn('Autoplay with sound prevented, ensuring muted autoplay:', err);
          videoEl.muted = true;
          setIsMuted(true);
          videoEl.play().catch(() => {
            // If completely cannot play, trigger fallback
            setVideoFailed(true);
          });
        });
    }

    return () => {
      clearTimeout(failsafeTimer);
    };
  }, [videoSrc, handleFinish]);

  // Fallback animation if video fails or cannot load
  useEffect(() => {
    if (!videoFailed) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return Math.min(100, prev + 25);
      });
    }, 120);

    const buttonTimer = setTimeout(() => {
      setShowDirectButton(true);
    }, 350);

    const finishTimer = setTimeout(() => {
      handleFinish();
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(buttonTimer);
      clearTimeout(finishTimer);
    };
  }, [videoFailed, handleFinish]);

  const handleManualEnter = () => {
    handleFinish();
  };

  const getStatusMessage = (p: number) => {
    if (p < 35) return "جاري الاتصال والتحقق من الأمان...";
    if (p < 75) return "جاري تحضير القاعات والدروس التعليمية...";
    if (p < 95) return "جاري تجهيز بوابة بيرق الذكية...";
    return "جاهز! أهلاً بك في المنصة ⚡";
  };

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] overflow-hidden select-none" 
      dir="rtl"
    >
      {/* 1. Fullscreen Video Splash (Replaces blue screen) */}
      {!videoFailed && (
        <div 
          onClick={handleSkip}
          className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer"
        >
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted={isMuted}
            preload="auto"
            className="w-full h-full object-cover sm:object-contain bg-black"
            onLoadedData={() => setIsVideoLoaded(true)}
            onPlaying={() => setHasStartedPlaying(true)}
            onTimeUpdate={() => {
              if (videoRef.current && videoRef.current.currentTime >= 3.8) {
                handleFinish();
              }
            }}
            onEnded={handleFinish}
            onError={() => {
              console.warn('Video failed to load, falling back to logo loader');
              setVideoFailed(true);
              setTimeout(handleFinish, 600);
            }}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src="/short-intro.mp4" type="video/mp4" />
            <source src="/intro.mp4" type="video/mp4" />
            <source src="/splash.mp4" type="video/mp4" />
            <source src="/short-intro.webm" type="video/webm" />
          </video>

          {/* Controls Overlay: Skip & Sound Toggle */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Skip Button (تخطي) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFinish();
              }}
              className="pointer-events-auto absolute start-4 top-4 z-50 px-4 py-2 rounded-full bg-black/75 hover:bg-black/90 active:bg-black text-white text-xs font-black backdrop-blur-md border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xl active:scale-95"
              style={{ top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 8px)' }}
              title="تخطي الفيديو والدخول فوراً"
            >
              <span>تخطي</span>
              <ChevronLeft size={16} />
            </button>

            {/* Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const videoEl = videoRef.current;
                if (videoEl) {
                  videoEl.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="pointer-events-auto absolute end-4 top-4 z-50 w-9 h-9 rounded-full bg-black/75 hover:bg-black/90 active:bg-black text-white backdrop-blur-md border border-white/30 transition-all flex items-center justify-center cursor-pointer shadow-xl active:scale-95"
              style={{ top: 'calc(max(env(safe-area-inset-top, 0px), 16px) + 8px)' }}
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* 2. Fallback Branded Loading Screen (Only if video fails or missing) */}
      {videoFailed && (
        <div className="relative flex flex-col items-center justify-center z-10 text-center p-6 max-w-sm w-full mx-auto animate-in fade-in">
          {/* Animated Central Emblem */}
          <div className="relative mb-7 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#D4AF37]/25 blur-2xl rounded-full scale-125 pointer-events-none" />
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

          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFD700] to-[#F59E0B] drop-shadow-[0_2px_12px_rgba(212,175,55,0.4)] mb-2 tracking-tight">
            بوابة بيرق
          </h1>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700] animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[11px] font-black text-[#F59E0B] tracking-wider uppercase">
              GATE 6 • المنصة التعليمية الذكية
            </span>
          </div>

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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>

          {showDirectButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleManualEnter}
              className="mt-2 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] hover:brightness-110 text-slate-950 font-black px-8 py-3 rounded-full text-sm shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95 transition-all cursor-pointer border border-amber-300/30"
            >
              <GraduationCap className="w-4 h-4" />
              <span>دخول المنصة ⚡</span>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};
