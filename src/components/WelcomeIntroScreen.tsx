import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft, Loader2, Volume2, VolumeX } from "lucide-react";
import { useBerqPoses } from "./BerqCharacterManager";

interface WelcomeIntroScreenProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const WelcomeIntroScreen = React.forwardRef<HTMLDivElement, WelcomeIntroScreenProps>(({ 
  onComplete,
  videoSrc: propVideoSrc
}, ref) => {
  const poses = useBerqPoses();
  const rawVideoSrc = propVideoSrc || poses['welcome_video'] || poses['greeting_welcome'] || "/mascot/sliced_bairaq_sheet5_greeting_hello.mp4";
  
  const [videoSrc, setVideoSrc] = useState(rawVideoSrc);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (rawVideoSrc) {
      setVideoSrc(rawVideoSrc);
    }
  }, [rawVideoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playsInline = true;
      video.muted = true;
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Autoplay error in WelcomeIntroScreen:", err);
        });
      }
    }
  }, [videoSrc]);

  const handleSkip = () => {
    onComplete();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
      if (!video.muted) {
        video.play().catch(console.warn);
      }
    }
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden select-none"
      dir="rtl"
    >
      {/* 1. Immersive Video Element (Full Edge-to-Edge Cover) */}
      <div className="absolute inset-0 w-full h-full z-0 bg-black">
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-30 space-y-4">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <span className="text-xs font-semibold text-white/60 tracking-wider">جاري فتح بوابة بيرق...</span>
          </div>
        )}

        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover pointer-events-none"
          playsInline
          autoPlay
          muted
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onPlay={() => setVideoLoaded(true)}
          onEnded={onComplete}
          onError={(e) => {
            console.warn("Video play error in WelcomeIntroScreen, trying default fallback:", e);
            if (videoSrc !== "/mascot/sliced_bairaq_sheet5_greeting_hello.mp4") {
              setVideoSrc("/mascot/sliced_bairaq_sheet5_greeting_hello.mp4");
            } else {
              setVideoError(true);
            }
          }}
        />

        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-40 space-y-4 p-6 text-center">
            <Sparkles className="w-12 h-12 text-amber-400 animate-pulse" />
            <p className="text-white text-sm">عذراً، تعذر تشغيل الفيديو الترحيبي. يمكنك المتابعة مباشرة.</p>
            <button
              onClick={onComplete}
              className="px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all cursor-pointer"
            >
              دخول البوابة ⚡
            </button>
          </div>
        )}
      </div>

      {/* 2. Floating Action Controls overlaying the video */}
      <div className="absolute top-6 inset-x-6 z-50 flex items-center justify-between pointer-events-none">
        {/* Floating Skip Button (Top Right) */}
        <button
          onClick={handleSkip}
          className="pointer-events-auto group relative flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-black tracking-wider text-amber-400 hover:text-black bg-black/40 backdrop-blur-md border border-amber-500/30 transition-all duration-300 cursor-pointer active:scale-95 hover:bg-amber-400 hover:border-amber-400"
        >
          <span>تخطي الفيديو</span>
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
        </button>

        {/* Floating Sound Controller (Top Left) */}
        <button
          onClick={toggleMute}
          className="pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-amber-400 text-white hover:text-amber-400 transition-all duration-300 cursor-pointer active:scale-95"
          title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
        >
          {isMuted ? (
            <div className="relative flex items-center justify-center">
              <VolumeX className="w-5 h-5 text-red-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>
          ) : (
            <Volume2 className="w-5 h-5 text-amber-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. Immersive Bottom Vignette and minimal branding */}
      <div className="absolute bottom-0 inset-x-0 h-32 z-20 flex flex-col items-center justify-end pb-8 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none">
        <div className="text-center space-y-1">
          <p className="text-xs font-black tracking-widest text-amber-400 uppercase flex items-center justify-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>بوابة بيرق</span>
          </p>
          <p className="text-[10px] text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">جاري البدء تلقائياً فور انتهاء الفيديو</p>
        </div>
      </div>
    </motion.div>
  );
});
WelcomeIntroScreen.displayName = "WelcomeIntroScreen";
