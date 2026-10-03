import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Video, ZoomIn, RefreshCw } from 'lucide-react';

interface ClassroomVideoPlayerProps {
  src: string;
  onExpand?: (currentTime?: number) => void;
  className?: string;
  autoPlay?: boolean;
  initialTime?: number;
  paused?: boolean;
}

export const ClassroomVideoPlayer: React.FC<ClassroomVideoPlayerProps> = ({ 
  src, 
  onExpand, 
  className = '', 
  autoPlay = false,
  initialTime = 0,
  paused = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime || 0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Sync paused prop from parent (e.g., when lightbox modal is open)
  useEffect(() => {
    if (paused && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [paused]);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [autoPlay, src, initialTime]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      setIsBuffering(true);
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch((err) => {
          console.log("Play failed:", err);
          setIsBuffering(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  return (
    <div 
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none group/player ${className}`}
      onClick={togglePlay}
      onMouseMove={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onWaiting={() => {
          if (isPlaying) setIsBuffering(true);
        }}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
        }}
      />

      {/* Telegram-style Central Play / Loading Button (Visible ONLY when paused or initial) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={togglePlay}
            className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs shadow-[0_0_30px_rgba(37,99,235,0.7)] backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 border border-white/30 cursor-pointer"
            title="تشغيل الفيديو"
          >
            {isBuffering ? (
              <>
                <RefreshCw size={18} className="animate-spin text-white" />
                <span>جاري التجهيز...</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Play size={18} className="fill-white text-white translate-x-[-0.5px]" />
                </div>
                <div className="text-right">
                  <span className="block leading-tight text-xs font-black">تشغيل ومشاهدة اللقطة ⚡</span>
                  <span className="block text-[9.5px] text-blue-200/80 font-normal">بث سحابي فوري ومباشر</span>
                </div>
              </>
            )}
          </button>
        </div>
      )}

      {/* Custom Bottom Controls Bar */}
      <div 
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 pt-6 flex flex-col gap-1.5 z-20 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
        />

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center"
              title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="fill-white" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center"
              title={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <span className="text-[10px] font-mono text-white/80 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5" dir="rtl">
            {onExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  let currentProgress = 0;
                  if (videoRef.current) {
                    currentProgress = videoRef.current.currentTime;
                    videoRef.current.pause();
                    setIsPlaying(false);
                  }
                  if (onExpand) {
                    onExpand(currentProgress);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                title="تكبير وملء الشاشة"
              >
                <ZoomIn size={13} />
                <span>تكبير 🔍</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
