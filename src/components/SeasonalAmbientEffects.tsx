import React, { useMemo } from "react";
import { useActiveTheme } from "../services/remoteConfig";
import { motion } from "framer-motion";

export const SeasonalAmbientEffects: React.FC = () => {
  const { isThemeActive, config, preset, accentStyle } = useActiveTheme();

  // Generate lightweight particles once
  const particles = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // %
      y: Math.random() * 100, // %
      size: Math.random() * 16 + 8, // px
      duration: Math.random() * 6 + 6, // sec
      delay: Math.random() * 3,
      char: preset.decorations[i % preset.decorations.length] || "✨",
      color: accentStyle.particleColors[i % accentStyle.particleColors.length]
    }));
  }, [preset, accentStyle]);

  if (!isThemeActive || !config.themeEffectsEnabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden select-none opacity-75 dark:opacity-70">
      {/* Ambient Radial Accent Light Orbs */}
      <div
        className="absolute top-[10%] right-[-5%] w-[450px] h-[450px] rounded-full blur-[140px] transition-all duration-1000"
        style={{ backgroundColor: accentStyle.glowColor }}
      />
      <div
        className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[130px] transition-all duration-1000"
        style={{ backgroundColor: accentStyle.glowColor }}
      />

      {/* Floating Theme Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0.3, y: 0, scale: 0.85 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            y: [-15, -40, -15],
            scale: [0.85, 1.2, 0.85],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
          style={{
            position: "absolute",
            top: `${p.y}%`,
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            color: p.color
          }}
        >
          {p.char}
        </motion.div>
      ))}
    </div>
  );
};
