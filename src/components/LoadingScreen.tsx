import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap } from 'lucide-react';

interface LoadingScreenProps {
  onFinish?: () => void;
  videoSrc?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish, videoSrc = "/short-intro.mp4" }) => {
  const [videoError, setVideoError] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // If the video takes too long or fails, we still want to show something or allow continuation
    const fallbackTimer = setTimeout(() => {
      // Don't auto-finish if we are waiting for user to click play
      if (!showPlayOverlay) {
        if (onFinish) onFinish();
      }
    }, 20000); // Max splash screen duration
    
    return () => clearTimeout(fallbackTimer);
  }, [onFinish, showPlayOverlay]);

  const handleManualPlay = () => {
    setShowPlayOverlay(false);
    const video = videoRef.current;
    if (video) {
      try {
        video.muted = false;
        if (video.readyState >= 1) {
          video.currentTime = 0;
        }
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Standard play failed, trying muted fallback:", err);
            // If play fails (e.g. autoplay/audio restriction), try to play muted (browsers always allow this)
            video.muted = true;
            video.play().catch((muteErr) => {
              console.error("Muted play failed as well:", muteErr);
              setVideoError(true);
            });
          });
        }
      } catch (err) {
        console.error("Error starting manual play:", err);
        // Direct muted fallback
        try {
          video.muted = true;
          video.play().catch(() => setVideoError(true));
        } catch {
          setVideoError(true);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Intro Video */}
      <AnimatePresence>
        {!videoError && (
          <motion.div
            key="video-splash"
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black z-20"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              preload="auto"
              playsInline
              autoPlay
              muted
              onError={() => {
                 setVideoError(true);
                 if (onFinish) {
                   setTimeout(onFinish, 6000);
                 }
              }}
              onEnded={() => {
                if (onFinish) onFinish();
              }}
              className="w-full h-full object-cover"
            />
            {showPlayOverlay && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-end pb-24 bg-gradient-to-t from-black/80 via-transparent to-transparent cursor-pointer z-30"
                onClick={handleManualPlay}
              >
                <div className="flex items-center gap-3 bg-[#D4AF37]/90 backdrop-blur-md text-black font-bold px-8 py-4 rounded-full text-lg shadow-[0_0_30px_rgba(212,175,55,0.4)] animate-pulse transition-transform hover:scale-105">
                  <GraduationCap className="w-6 h-6" />
                  <span>انقر لدخول البوابة</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback Screen - Premium Modern Design */}
      <AnimatePresence>
        {videoError && (
          <motion.div
            key="fallback-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020617]"
          >
            {/* Background Splashes & Effects (matching Auth page) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0A1024] to-[#050A18] pointer-events-none" />
            <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
                 style={{ 
                   backgroundImage: 'radial-gradient(circle at center, rgba(212,175,55,0.8) 1px, transparent 1px)', 
                   backgroundSize: '40px 40px',
                   backgroundPosition: '0 0, 20px 20px'
                 }} 
            />
            <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-transparent to-transparent opacity-80" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center justify-center w-full h-full z-10"
            >
              {/* Premium Logo Presentation */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative mb-12 flex flex-col items-center"
              >
                {/* Soft backdrop glow behind logo */}
                <div className="absolute inset-0 bg-[#D4AF37]/10 blur-[60px] rounded-full scale-150 pointer-events-none" />
                <img 
                  src={'/logo.png'} 
                  alt="بوابة بيرق" 
                  className="w-48 h-auto object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.3)] z-10 rounded-[25px]"
                  style={{ maskImage: 'radial-gradient(circle at center, black 55%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at center, black 55%, transparent 100%)' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-[#D4AF37] text-5xl font-black">بيرق</div>';
                  }}
                />
                
                {/* Elegant Loading Spinner */}
                <div className="mt-10 flex items-center justify-center gap-2">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }} 
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                    className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" 
                  />
                </div>
              </motion.div>

              {/* Bottom Golden Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute bottom-16 text-center w-full px-6"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                  <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#F59E0B] tracking-wide drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
                    وَقُل رَّبِّ زِدْنِي عِلْمًا
                  </h2>
                  <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

