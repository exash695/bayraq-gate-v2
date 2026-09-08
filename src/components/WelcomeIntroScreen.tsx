import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft, Loader2, Volume2, VolumeX, Play, ChevronLeft } from "lucide-react";
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

  // Primary & Secondary Video resolution
  const primaryVideoSrc = propVideoSrc || poses['welcome_video'] || poses['greeting_welcome'] || "/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4";
  const secondaryVideoSrc = propSecondaryVideoSrc || poses['welcome_video_secondary'] || poses['welcome_intro_secondary'] || "";

  const hasSecondary = Boolean(secondaryVideoSrc && secondaryVideoSrc.trim() !== "" && secondaryVideoSrc !== primaryVideoSrc);

  const [currentStep, setCurrentStep] = useState<0 | 1>(0);
  const activeSrc = currentStep === 0 ? primaryVideoSrc : secondaryVideoSrc;

  const [currentVideoSrc, setCurrentVideoSrc] = useState(activeSrc);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Sync video source on step change or remote pose update
  useEffect(() => {
    const nextSrc = currentStep === 0 ? primaryVideoSrc : secondaryVideoSrc;
    if (nextSrc) {
      setCurrentVideoSrc(nextSrc);
      setVideoLoaded(false);
      setVideoError(false);
    }
  }, [currentStep, primaryVideoSrc, secondaryVideoSrc]);

  // Autoplay attempt on video source change
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playsInline = true;
      video.muted = isMuted;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[WelcomeIntroScreen] Autoplay notice:", err?.message || err);
          // Fallback to muted autoplay
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      }
    }
    
    // FAILSAFE: If the video hasn't successfully played within 2.5 seconds (likely 404 or blocked), skip to prevent a black screen
    const failsafe = setTimeout(() => {
      onCompleteRef.current();
    }, 2200);
    
    return () => clearTimeout(failsafe);
  }, [currentVideoSrc, isMuted]);

  const handleNextStepOrComplete = useCallback(() => {
    if (currentStep === 0 && hasSecondary) {
      // Transition to secondary welcome video
      setCurrentStep(1);
    } else {
      onComplete();
    }
  }, [currentStep, hasSecondary, onComplete]);

  const handleSkipAll = () => {
    onCompleteRef.current();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      const nextMuted = !video.muted;
      video.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        video.play().catch(console.warn);
      }
    }
  };

  const handleVideoError = () => {
    console.warn(`[WelcomeIntroScreen] Video error on step ${currentStep} (${currentVideoSrc})`);
    if (currentStep === 0 && hasSecondary) {
      // If primary fails and secondary exists, attempt secondary
      setCurrentStep(1);
    } else if (currentVideoSrc !== "/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4" && currentVideoSrc !== "/short-intro.webm") {
      // Try reliable default video
      setCurrentVideoSrc("/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4");
    } else {
      setVideoError(true);
    }
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-[10000] bg-[#020617] flex items-center justify-center overflow-hidden select-none"
      dir="rtl"
    >
      {/* 1. Immersive Video Player & Visual Background */}
      <div className="absolute inset-0 w-full h-full z-0 bg-[#020617]">
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#020617] via-[#0A1024] to-[#050A18] z-30 space-y-5 p-6">
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
                {currentStep === 0 ? "جاري تشغيل الفيديو الترحيبي..." : "جاري تشغيل الفيديو الترحيبي الثانوي..."}
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

        <video
          key={`welcome-video-${currentStep}-${currentVideoSrc}`}
          ref={videoRef}
          src={currentVideoSrc}
          className="w-full h-full object-cover pointer-events-none"
          playsInline
          autoPlay
          muted={isMuted}
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onPlay={() => setVideoLoaded(true)}
          onEnded={handleNextStepOrComplete}
          onError={handleVideoError}
        />

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
        </div>

        {/* Center: Stage Pill Indicator if multiple videos */}
        {hasSecondary && (
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/20 text-[11px] font-bold text-amber-300 shadow-md">
            <span className={`w-2 h-2 rounded-full ${currentStep === 0 ? "bg-amber-400 animate-pulse" : "bg-white/30"}`} />
            <span>{currentStep === 0 ? "المقدمة الأولى (١ / ٢)" : "المقدمة الثانية (٢ / ٢)"}</span>
            <span className={`w-2 h-2 rounded-full ${currentStep === 1 ? "bg-amber-400 animate-pulse" : "bg-white/30"}`} />
          </div>
        )}

        {/* Left side: Sound Mute / Unmute Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:border-amber-400 text-white hover:text-amber-400 transition-all duration-300 cursor-pointer active:scale-95 shadow-lg"
            title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
          >
            {isMuted ? (
              <div className="relative flex items-center justify-center">
                <VolumeX className="w-4 h-4 text-red-400" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
            )}
          </button>
        </div>
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
