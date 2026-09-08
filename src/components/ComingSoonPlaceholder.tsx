import React from 'react';
import { Hammer } from 'lucide-react';
import { motion } from 'framer-motion';

export const ComingSoonPlaceholder = ({ title }: { title?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-[#0a0f1d]/50 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden p-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#101935] to-[#0A0F1D] border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-center mb-6 relative"
      >
        <div className="absolute inset-0 bg-amber-400/10 rounded-3xl animate-pulse" />
        <Hammer size={36} className="text-amber-400 relative z-10" />
      </motion.div>
      {title && (
        <h2 className="text-xl md:text-2xl font-black text-white mb-2">{title}</h2>
      )}
      <p className="text-base md:text-lg text-amber-500/90 font-bold">
        نعمل على تجهيزها — قريبًا بين أيديكم
      </p>
    </div>
  );
};
