import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveTheme } from "../services/remoteConfig";
import { Sparkles } from "lucide-react";

export const SeasonalThemeCard: React.FC = () => {
  const { isThemeActive, config, preset, accentStyle, mascotImage } = useActiveTheme();

  if (!isThemeActive) {
    return null;
  }

  const cardTitle = config.themeCardTitle && config.themeCardTitle.trim() !== ""
    ? config.themeCardTitle
    : preset.defaultCardTitle;

  const cardMessage = config.themeMessage && config.themeMessage.trim() !== ""
    ? config.themeMessage
    : preset.defaultMessage;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-1"
        dir="rtl"
      >
        <div
          className={`relative overflow-hidden rounded-2xl border ${accentStyle.cardBorder} shadow-lg flex items-center min-h-[64px] sm:min-h-[72px] bg-gradient-to-l from-slate-900/95 to-slate-950/90 dark:from-slate-950/95 dark:to-black/95`}
        >
          {/* Subtle Ambient Background Glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
            style={{
              background: `radial-gradient(circle at right 50%, ${accentStyle.glowColor}, transparent 60%)`
            }}
          />

          {/* Edge-to-Edge Mascot Image with Mask Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-36 md:w-44 z-0 pointer-events-none overflow-hidden rounded-r-2xl">
            {/* Soft glow strictly behind the image */}
            <div
              className="absolute inset-0 blur-2xl opacity-40"
              style={{ backgroundColor: accentStyle.glowColor }}
            />
            <motion.img
              animate={{ y: [0, -1.5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              src={mascotImage || preset.mascotPresetSvg}
              alt="شخصية بيرق"
              className="absolute inset-0 w-full h-full object-cover object-right sm:object-right-top mix-blend-normal"
              style={{
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)'
              }}
              onError={(e) => {
                (e.target as HTMLElement).setAttribute("src", preset.mascotPresetSvg);
              }}
            />
          </div>

          {/* Content Container (Pushed left to avoid overlapping the face, but centered overall) */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-2 sm:py-3 pl-3 pr-24 sm:pr-32 md:pr-40">
            
            {/* Top Row: Icon, Title, Badge */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-0.5">
              <span className="text-base sm:text-lg drop-shadow-sm select-none">{preset.icon}</span>
              <span className={`text-xs sm:text-sm font-black tracking-wide leading-snug drop-shadow-md ${accentStyle.textColor}`}>
                {cardTitle}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold text-white/90 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm shrink-0">
                <Sparkles size={8} className="text-amber-300" />
                <span>مناسبة خاصة</span>
              </span>
            </div>

            {/* Message */}
            <p className="text-[10px] sm:text-xs text-slate-200/95 dark:text-slate-300/95 font-medium leading-relaxed whitespace-normal break-words drop-shadow-sm max-w-3xl">
              {cardMessage}
            </p>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};


