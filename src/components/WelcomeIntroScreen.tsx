import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft, Loader2, Play, ChevronLeft, Volume2, VolumeX } from "lucide-react";
import { useBerqPoses, useAppLogo } from "./BerqCharacterManager";

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

  const [serverPosesLoaded, setServerPosesLoaded] = useState(false);
  const [remotePoses, setRemotePoses] = useState<Record<string, string>>(poses);

  // Force fetch latest poses from server on mount so regular users get developer uploaded welcome videos instantly
  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      if (isMounted) setServerPosesLoaded(true);
    }, 1200);

    fetch('/api/bairaq/poses', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data && data.poses) {
          setRemotePoses(prev => ({ ...prev, ...data.poses }));
          import('./BerqCharacterManager').then(({ updateGlobalPoses }) => {
            updateGlobalPoses(data.poses);
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          clearTimeout(timeout);
          setServerPosesLoaded(true);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Primary & Secondary Video resolution
  const activePoses = serverPosesLoaded ? { ...poses, ...remotePoses } : poses;
  const primaryVideoSrc = propVideoSrc || activePoses['welcome_video'] || activePoses['greeting_welcome'] || "/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4";
  const secondaryVideoSrc = propSecondaryVideoSrc || activePoses['welcome_video_secondary'] || activePoses['welcome_intro_secondary'] || "/mascot/sliced_bairaq_sheet5_greeting_hello.mp4";

  const hasSecondary = Boolean(secondaryVideoSrc && secondaryVideoSrc.trim() !== "" && secondaryVideoSrc !== primaryVideoSrc);

  const [currentStep, setCurrentStep] = useState<0 | 1>(0);
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const [primaryLoaded, setPrimaryLoaded] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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

  // Cleanup on unmount - absolutely guarantee audio/video stops
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, [stopAllMedia]);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle Playback for current step
  useEffect(() => {
    const activeVideo = currentStep === 0 ? primaryVideoRef.current : secondaryVideoRef.current;
    if (!activeVideo) return;

    activeVideo.playsInline = true;
    (activeVideo as any)['webkitPlaysinline'] = true;

    const attemptPlay = async () => {
      try {
        activeVideo.muted = false;
        setIsMuted(false);
        await activeVideo.play();
        if (currentStep === 0) setPrimaryLoaded(true);
        else setSecondaryLoaded(true);
      } catch (err) {
        // Fallback to muted instant autoplay
        try {
          activeVideo.muted = true;
          setIsMuted(true);
          await activeVideo.play();
          if (currentStep === 0) setPrimaryLoaded(true);
          else setSecondaryLoaded(true);
        } catch (innerErr) {
          console.warn("[WelcomeIntroScreen] Playback fallback notice:", innerErr);
        }
      }
    };

    attemptPlay();

    const handleTouch = () => {
      if (activeVideo && activeVideo.muted) {
        activeVideo.muted = false;
        setIsMuted(false);
      }
    };

    window.addEventListener('click', handleTouch, { once: true, passive: true });
    window.addEventListener('touchstart', handleTouch, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleTouch);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [currentStep]);

  const toggleSound = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const activeVideo = currentStep === 0 ? primaryVideoRef.current : secondaryVideoRef.current;
    if (activeVideo) {
      const newMuted = !activeVideo.muted;
      activeVideo.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [currentStep]);

  const handleNextStepOrComplete = useCallback(() => {
    if (currentStep === 0 && hasSecondary) {
      if (primaryVideoRef.current) {
        primaryVideoRef.current.pause();
      }
      setCurrentStep(1);
    } else {
      stopAllMedia();
      onComplete();
    }
  }, [currentStep, hasSecondary, onComplete, stopAllMedia]);

  const handleSkipAll = useCallback(() => {
    stopAllMedia();
    onCompleteRef.current();
  }, [stopAllMedia]);

  const currentVideoLoaded = currentStep === 0 ? primaryLoaded : secondaryLoaded;

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 0.3 } }}
      className="fixed inset-0 z-[10000] bg-[#020617] flex items-center justify-center overflow-hidden select-none"
      dir="rtl"
    >
      {/* 1. Immersive Dual-Video Player & Visual Background */}
      <div className="absolute inset-0 w-full h-full z-0 bg-[#020617] overflow-hidden">
        
        {/* Aesthetic Loading Screen: Masks any native Android player buffering */}
        {!currentVideoLoaded && !videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] z-30 space-y-5 p-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
              <img 
                src={appLogo} 
                alt="Logo" 
                className="w-9 h-9 object-contain absolute inset-0 m-auto rounded-full drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-amber-400/90 tracking-wider">
                {currentStep === 0 ? "جاري تشغيل الفيديو الترحيبي..." : "جاري تشغيل الفيديو الترحيبي الثاني..."}
              </span>
              <p className="text-[10px] text-white/40">بوابة بيرق للتعليم الذكي</p>
            </div>
            <button
              onClick={() => onCompleteRef.current()}
              className="mt-2 px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              تخطي ودخول المنصة ⚡
            </button>
          </div>
        )}

        {/* Primary Video */}
        <video
          ref={primaryVideoRef}
          src={primaryVideoSrc}
          className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
            currentStep === 0 && primaryLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          playsInline
          autoPlay
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          muted={isMuted}
          preload="auto"
          onTimeUpdate={() => {
            if (primaryVideoRef.current && primaryVideoRef.current.currentTime > 0.05) {
              setPrimaryLoaded(true);
            }
          }}
          onPlaying={() => setPrimaryLoaded(true)}
          onEnded={handleNextStepOrComplete}
          onError={() => {
            if (currentStep === 0 && hasSecondary) setCurrentStep(1);
            else setVideoError(true);
          }}
        />

        {/* Secondary Video (Preloaded in background) */}
        {hasSecondary && (
          <video
            ref={secondaryVideoRef}
            src={secondaryVideoSrc}
            className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
              currentStep === 1 && secondaryLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            muted={isMuted}
            preload="auto"
            onTimeUpdate={() => {
              if (secondaryVideoRef.current && secondaryVideoRef.current.currentTime > 0.05) {
                setSecondaryLoaded(true);
              }
            }}
            onPlaying={() => setSecondaryLoaded(true)}
            onEnded={handleNextStepOrComplete}
            onError={() => onCompleteRef.current()}
          />
        )}

        {/* Fallback Screen if Video Cannot Play */}
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
              onClick={() => onCompleteRef.current()}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95 flex items-center gap-2"
            >
              <span>دخول البوابة ⚡</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Header Controls & Stage Badges */}
      <div className="absolute top-6 inset-x-6 z-50 flex items-center justify-between pointer-events-none">
        
        {/* Right side: Skip and Step Navigation */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={handleSkipAll}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black tracking-wider text-amber-400 hover:text-black bg-black/50 backdrop-blur-md border border-amber-500/30 transition-all duration-300 cursor-pointer active:scale-95 hover:bg-amber-400 hover:border-amber-400 shadow-lg"
          >
            <span>تخطي</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          </button>

          {hasSecondary && currentStep === 0 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-all duration-300 cursor-pointer active:scale-95 shadow-lg"
            >
              <span>الفيديو التالي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={toggleSound}
            aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white/90 bg-black/50 backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all cursor-pointer active:scale-95 shadow-lg"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span className="text-[10px] text-amber-300">تشغيل الصوت</span>
              </>
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>

        {/* Left: Stage Pill Indicator if multiple videos */}
        {hasSecondary && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/20 text-[11px] font-bold text-amber-300 shadow-md pointer-events-auto">
            <span className={`w-2 h-2 rounded-full ${currentStep === 0 ? "bg-amber-400 animate-pulse" : "bg-white/30"}`} />
            <span>{currentStep === 0 ? "المقدمة الأولى (١ / ٢)" : "المقدمة الثانية (٢ / ٢)"}</span>
            <span className={`w-2 h-2 rounded-full ${currentStep === 1 ? "bg-amber-400 animate-pulse" : "bg-white/30"}`} />
          </div>
        )}
      </div>

      {/* 3. Bottom Vignette & Branding Bar */}
      <div className="absolute bottom-0 inset-x-0 h-36 z-20 flex flex-col items-center justify-end pb-8 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none">
        <div className="text-center space-y-1.5 flex flex-col items-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-amber-500/20 backdrop-blur-sm">
            <img 
              src={appLogo} 
              alt="Logo" 
              className="w-4 h-4 object-contain rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
            />
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              بوابة بيرق
            </span>
          </div>

          <p className="text-[10px] text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>
              {hasSecondary && currentStep === 0 
                ? "ينتقل تلقائياً إلى الفيديو الثاني فور انتهاء العرض" 
                : "جاري فتح البوابة تلقائياً فور انتهاء الفيديو"}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
});

WelcomeIntroScreen.displayName = "WelcomeIntroScreen";

