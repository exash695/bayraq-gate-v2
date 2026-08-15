import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Maximize, Heart, MessageSquare, Bookmark, Eye, EyeOff, X, Minimize, Youtube } from 'lucide-react';

interface Timestamp {
  time: number;
  label: string;
}

interface PremiumVideoPlayerProps {
  src: string;
  timestamps?: Timestamp[];
  onEnded?: () => void;
  title?: string;
}

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const PremiumVideoPlayer: React.FC<PremiumVideoPlayerProps> = ({ 
  src, 
  timestamps = [], 
  onEnded,
  title
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const youtubeId = extractYouTubeId(src);

  useEffect(() => {
    if (youtubeId) return; // YouTube iframe manages its own events
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const handleEnded = () => {
      setShowCompletion(true);
      if (onEnded) onEnded();
    };
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onEnded, youtubeId]);

  const togglePlay = () => {
    if (youtubeId) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changeSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const jumpTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 transition-all duration-500 relative">
      {/* Video Container */}
      <div className={`w-full max-w-4xl mx-auto relative rounded-[20px] border border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)] overflow-hidden ${isFocusMode ? 'bg-black' : ''} transition-all duration-500`}>
        {youtubeId ? (
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&origin=${window.location.origin}`}
              title={title || "محاضرة مرئية"}
              className="w-full h-full rounded-[20px] border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="w-full aspect-video"
            onClick={togglePlay}
          />
        )}
        
        {/* Completion Overlay */}
        <AnimatePresence>
          {showCompletion && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-6"
            >
              <button onClick={() => setShowCompletion(false)} className="absolute top-4 right-4 text-white hover:text-amber-400">
                <X size={32} />
              </button>
              <div className="text-center dir-rtl">
                <h2 className="text-3xl font-black text-[#D4AF37] mb-4">اكتملت المحاضرة بنجاح! 🎉</h2>
                <p className="text-white/70 mb-6 text-sm">أحسنت يا بطل، يمكنك الآن الانتقال للاختبارات السريعة والملاحظات</p>
                <button onClick={() => setShowCompletion(false)} className="px-8 py-3 bg-[#D4AF37] text-black font-black rounded-xl hover:bg-amber-400 transition-colors">
                  متابعة الدرس
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Cinema Bar */}
      <div className="w-full max-w-4xl mx-auto bg-black/80 backdrop-blur-sm p-4 rounded-xl flex items-center justify-between text-[#D4AF37] border border-[#D4AF37]/30 text-sm dir-rtl">
        <div className="flex items-center gap-4">
          {!youtubeId && (
            <button onClick={togglePlay} className="hover:text-white transition-colors" title={isPlaying ? "إيقاف" : "تشغيل"}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          )}
          {youtubeId && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/60 border border-red-500/30 px-3 py-1 rounded-full font-bold">
              <Youtube size={16} /> مشغل يوتيوب عالي الجودة
            </span>
          )}
          <button onClick={() => setIsFocusMode(!isFocusMode)} className="hover:text-white transition-colors" title="وضع التركيز Cinema">
            {isFocusMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        {!youtubeId && (
          <div className="flex gap-2">
            {[0.5, 1, 1.25, 1.5, 2].map(rate => (
              <button 
                key={rate} 
                onClick={() => changeSpeed(rate)}
                className={`px-2.5 py-1 rounded font-bold text-xs transition-all ${playbackRate === rate ? 'bg-[#D4AF37] text-black' : 'text-white hover:text-[#D4AF37]'}`}
              >
                {rate}x
              </button>
            ))}
          </div>
        )}

        <button onClick={toggleFullscreen} className="hover:text-white transition-colors" title="ملء الشاشة">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Action Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center gap-8 p-3 bg-black/40 rounded-xl border border-white/5 dir-rtl">
        <button onClick={() => setLiked(!liked)} className="flex items-center gap-2 text-xs font-bold text-white/80 hover:text-rose-400 transition-colors">
          <Heart size={20} className={`cursor-pointer transition-colors ${liked ? 'text-rose-500 fill-rose-500' : 'text-white/70'}`} />
          <span>{liked ? 'تم الإعجاب' : 'إعجاب'}</span>
        </button>
        <button onClick={() => setSaved(!saved)} className="flex items-center gap-2 text-xs font-bold text-white/80 hover:text-amber-400 transition-colors">
          <Bookmark size={20} className={`cursor-pointer transition-colors ${saved ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-white/70'}`} />
          <span>{saved ? 'محفوظة' : 'حفظ المحاضرة'}</span>
        </button>
      </div>

      {/* Timestamps Grid */}
      {timestamps.length > 0 && (
        <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {timestamps.map((ts, i) => {
            const isActive = currentTime >= ts.time && (i === timestamps.length - 1 || currentTime < timestamps[i+1].time);
            return (
              <button 
                key={ts.label + ts.time}
                onClick={() => jumpTo(ts.time)}
                className={`p-3 glass-card border ${isActive ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10'} hover:border-[#D4AF37]/60 text-right text-xs font-bold text-white/90 transition-all rounded-xl flex flex-col justify-between`}
              >
                <span className="text-[#D4AF37] text-[11px] font-mono mb-1">
                  {Math.floor(ts.time / 60)}:{String(Math.floor(ts.time % 60)).padStart(2, '0')}
                </span>
                <span className="line-clamp-2">{ts.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

