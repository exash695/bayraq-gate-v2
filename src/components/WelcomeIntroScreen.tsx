import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft, ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { useBerqPoses, useAppLogo } from "./BerqCharacterManager";

// Safe dynamic detection without hard external import breaking server rollup
const isNativeApp = typeof window !== "undefined" && Boolean(
  (window as any).Capacitor?.isNativePlatform?.() ||
  window.location.protocol === "capacitor:" ||
  window.location.protocol === "ionic:" ||
  (window.location.hostname === "localhost" && /Android/i.test(navigator.userAgent))
);

interface WelcomeIntroScreenProps {
  onComplete: () => void;
  videoSrc?: string;
  secondaryVideoSrc?: string;
}

export const WelcomeIntroScreen = React.forwardRef<HTMLDivElement, WelcomeIntroScreenProps>(({ 
  onComplete,
  videoSrc: propVideoSrc,
  secondaryVideoSrc: propSecondaryVideoSrc
}, ref) => {
  const poses = useBerqPoses();
  const appLogo = useAppLogo();

  // Faststart-optimized canonical local videos (0ms instant startup with moov atom at beginning)
  const poster1 = "/videos/welcome_poster_1.jpg";
  const poster2 = "/videos/welcome_poster_2.jpg";

  // Prioritize faststart-optimized files /videos/welcome_intro_*.mp4 for instantaneous playback
  const resolveVideoUrl = (customUrl?: string, fallback = "/videos/welcome_intro_1.mp4") => {
    if (isNativeApp) return fallback;
    if (customUrl && !customUrl.includes('1790368304162_1000112062') && !customUrl.includes('1790368291996_1000112063')) {
      return customUrl;
    }
    return fallback;
  };

  const primaryVideoSrc = resolveVideoUrl(propVideoSrc || poses['welcome_video'], "/videos/welcome_intro_1.mp4");
  const secondaryVideoSrc = resolveVideoUrl(propSecondaryVideoSrc || poses['welcome_video_secondary'], "/videos/welcome_intro_2.mp4");
  const hasSecondary = Boolean(secondaryVideoSrc && secondaryVideoSrc.trim() !== "" && secondaryVideoSrc !== primaryVideoSrc);

  const [currentStep, setCurrentStep] = useState<0 | 1>(0);
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);

  // Sound is strictly CLOSED (MUTED) by default so browser/Android allows immediate 0ms autoplay!
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Smooth story-like progress tracking
  const [primaryProgress, setPrimaryProgress] = useState(0);
  const [secondaryProgress, setSecondaryProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopAllMedia = useCallback(() => {
    if (primaryVideoRef.current) {
      try {
        primaryVideoRef.current.pause();
        primaryVideoRef.current.muted = true;
      } catch (e) {}
    }
    if (secondaryVideoRef.current) {
      try {
        secondaryVideoRef.current.pause();
        secondaryVideoRef.current.muted = true;
      } catch (e) {}
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  // Sound Toggle: Clean, intuitive switch between muted (closed) and active (open)
  const toggleSound = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    const activeVideo = currentStep === 0 ? primaryVideoRef.current : secondaryVideoRef.current;
    if (activeVideo) {
      activeVideo.muted = nextMuted;
      activeVideo.defaultMuted = nextMuted;
      if (!nextMuted) {
        activeVideo.volume = 1;
        activeVideo.play().catch(() => {});
      } else {
        activeVideo.volume = 0;
      }
    }
  }, [currentStep, isMuted]);

  // Handle Playback for current step (Guaranteed 100% Instant Autoplay Muted)
  useEffect(() => {
    const activeVideo = currentStep === 0 ? primaryVideoRef.current : secondaryVideoRef.current;
    if (!activeVideo) return;

    activeVideo.playsInline = true;
    (activeVideo as any)['webkitPlaysinline'] = true;
    activeVideo.muted = isMuted;
    activeVideo.defaultMuted = isMuted;
    if (isMuted) {
      activeVideo.volume = 0;
    }

    const startPlay = () => {
      activeVideo.play().catch(err => {
        console.warn("[WelcomeIntroScreen] Play was blocked, enforcing muted play:", err);
        activeVideo.muted = true;
        activeVideo.defaultMuted = true;
        activeVideo.volume = 0;
        setIsMuted(true);
        activeVideo.play().catch(() => {});
      });
    };

    startPlay();
  }, [currentStep, isMuted]);

  const handleNextStepOrComplete = useCallback(() => {
    if (currentStep === 0 && hasSecondary) {
      if (primaryVideoRef.current) {
        try {
          primaryVideoRef.current.pause();
        } catch (e) {}
      }
      setCurrentStep(1);
    } else {
      stopAllMedia();
      onCompleteRef.current();
    }
  }, [currentStep, hasSecondary, stopAllMedia]);

  const handleSkipAll = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopAllMedia();
    onCompleteRef.current();
  }, [stopAllMedia]);

  // Screen click toggles sound if clicking on background/video area
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    toggleSound();
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.25 } }}
      onClick={handleContainerClick}
      className="fixed inset-0 z-[10000] bg-[#020617] flex items-center justify-center overflow-hidden select-none cursor-pointer"
      dir="rtl"
    >
      {/* 1. Immersive Dual-Video Player & Visual Background */}
      <div className="absolute inset-0 w-full h-full z-0 bg-[#020617] overflow-hidden">
        
        {/* Background HD Poster for 0ms Instant Visual Presence */}
        <img 
          src={currentStep === 0 ? poster1 : poster2} 
          alt="Welcome Poster"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Primary Video */}
        <video
          ref={primaryVideoRef}
          src={primaryVideoSrc}
          poster={poster1}
          className={`w-full h-full object-cover transition-opacity duration-300 relative z-10 ${
            currentStep === 0 ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"
          }`}
          playsInline
          autoPlay
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          muted={isMuted}
          defaultMuted
          preload="auto"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) {
              setPrimaryProgress((v.currentTime / v.duration) * 100);
            }
          }}
          onEnded={handleNextStepOrComplete}
          onError={() => {
            if (currentStep === 0 && hasSecondary) setCurrentStep(1);
            else setVideoError(true);
          }}
        />

        {/* Secondary Video (Seamless switch when Step 1 is reached) */}
        {hasSecondary && (
          <video
            ref={secondaryVideoRef}
            src={secondaryVideoSrc}
            poster={poster2}
            className={`w-full h-full object-cover transition-opacity duration-300 relative z-10 ${
              currentStep === 1 ? "opacity-100 block" : "opacity-0 hidden pointer-events-none"
            }`}
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            muted={isMuted}
            defaultMuted
            preload="auto"
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) {
                setSecondaryProgress((v.currentTime / v.duration) * 100);
              }
            }}
            onEnded={handleNextStepOrComplete}
            onError={() => onCompleteRef.current()}
          />
        )}

        {/* Fallback Screen if Video Fails Completely */}
        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#020512] via-[#050B20] to-[#020512] z-40 space-y-6 p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-500/30 flex items-center justify-center p-3 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
              <img 
                src={appLogo} 
                alt="بوابة بيرق" 
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-xl font-black text-white">مرحباً بك في بوابة بيرق</h2>
              <p className="text-white/60 text-xs leading-relaxed">
                رفيقك الذكي ومنصتك المتكاملة للتعليم والمتابعة الذكية.
              </p>
            </div>
            <button
              onClick={handleSkipAll}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95 flex items-center gap-2"
            >
              <span>دخول البوابة ⚡</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Segmented Stories Progress Bars */}
      {hasSecondary && (
        <div className="absolute top-3 inset-x-4 z-[210] flex items-center gap-1.5 pointer-events-none" dir="rtl">
          <div className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-amber-400 transition-all duration-150 rounded-full"
              style={{ width: currentStep === 0 ? `${primaryProgress}%` : '100%' }}
            />
          </div>
          <div className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-amber-400 transition-all duration-150 rounded-full"
              style={{ width: currentStep === 1 ? `${secondaryProgress}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* 3. Top Header Navigation Bar (Clean, Balanced & Organized) */}
      <div 
        className={`absolute ${hasSecondary ? 'top-6' : 'top-4'} inset-x-4 z-[200] flex items-center justify-between pointer-events-none`}
        dir="rtl"
      >
        {/* Right side in RTL: Brand & Stage Badge */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/10 shadow-lg">
            <img 
              src={appLogo} 
              alt="Logo" 
              className="w-4 h-4 object-contain rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
            <span className="text-xs font-black text-white/90">
              بوابة بيرق
            </span>
            {hasSecondary && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentStep === 0 ? "المقدمة ١" : "المقدمة ٢"}
              </span>
            )}
          </div>
        </div>

        {/* Left side in RTL: Neatly organized action controls without clutter */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Sound Toggle Button (Clearly displays Muted/Closed by default) */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            title={isMuted ? "الصوت مغلق حالياً - انقر للتشغيل" : "الصوت مفتوح حالياً - انقر للكتم"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-lg backdrop-blur-md border ${
              isMuted
                ? "bg-black/70 text-white/80 border-white/15 hover:bg-black/90 hover:text-white"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/70" />
                <span className="text-[11px] font-bold text-white/80">الصوت مغلق</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300">الصوت مفتوح</span>
              </>
            )}
          </button>

          {/* Next Video Button (Only shown on Step 0 if Secondary video exists) */}
          {hasSecondary && currentStep === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentStep(1);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-black/65 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all cursor-pointer active:scale-95 shadow-lg"
            >
              <span>التالي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkipAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black text-amber-300 bg-amber-500/15 hover:bg-amber-400 hover:text-black border border-amber-500/30 transition-all cursor-pointer active:scale-95 shadow-lg"
          >
            <span>تخطي</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Discreet Status Hint */}
      <div 
        className="absolute bottom-0 inset-x-0 h-28 z-20 flex flex-col items-center justify-end pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none"
        dir="rtl"
      >
        <div className="text-center space-y-1.5 flex flex-col items-center pointer-events-auto">
          {/* Subtle sound tip if muted */}
          {isMuted && (
            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm text-[11px] text-white/80 hover:text-white transition-all cursor-pointer shadow-md"
            >
              <VolumeX className="w-3 h-3 text-amber-400" />
              <span>الصوت مغلق لبدء فوري بدون تأخير • انقر لتشغيل الصوت 🔇</span>
            </button>
          )}

          <p className="text-[10px] text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>
              {hasSecondary && currentStep === 0 
                ? "ينتقل تلقائياً للمقدمة الثانية فور انتهاء العرض" 
                : "جاري الانتقال للبوابة تلقائياً فور انتهاء الفيديو"}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
});

WelcomeIntroScreen.displayName = "WelcomeIntroScreen";
