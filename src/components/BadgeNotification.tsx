import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Award, Zap, Target, BookOpen, PenLine } from 'lucide-react';
import { Badge } from '../types';

const ICON_MAP: { [key: string]: any } = {
  Trophy,
  Star,
  Award,
  Zap,
  Target,
  BookOpen,
  PenLine
};

interface BadgeNotificationProps {
  badge: Badge | null;
  onClose: () => void;
}

const COLOR_MAP: { [key: string]: { border: string, bg: string, text: string, shadow: string } } = {
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/20', text: 'text-emerald-500', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]' },
  rose: { border: 'border-rose-500', bg: 'bg-rose-500/20', text: 'text-rose-500', shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]' },
  blue: { border: 'border-blue-500', bg: 'bg-blue-500/20', text: 'text-blue-500', shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' },
  gold: { border: 'border-gold', bg: 'bg-gold/20', text: 'text-gold', shadow: 'shadow-[0_0_20px_rgba(255,215,0,0.4)]' },
};

export const BadgeNotification = ({ badge, onClose }: BadgeNotificationProps) => {
  if (!badge) return null;

  const Icon = ICON_MAP[badge.icon] || Award;
  const colors = COLOR_MAP[badge.color] || COLOR_MAP.blue;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10002] w-[90%] max-w-md"
      >
        <div className="glass-card ambient-glow p-6 border-2 border-theme-primary/50 shadow-[0_0_30px_rgba(0,210,255,0.3)] flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center shrink-0 ${colors.shadow}`}>
            <Icon className={`w-12 h-12 ${colors.text} animate-bounce`} />
          </div>
          
          <div className="flex-1">
            <div className="text-xs font-black text-theme-primary uppercase tracking-widest mb-1">إنجاز جديد!</div>
            <h3 className="text-2xl font-black text-white mb-1">{badge.title}</h3>
            <p className="text-white/60 text-sm leading-tight">{badge.description}</p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors self-start"
          >
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper to get color RGB for glow
const X = ({ className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    {...props}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);
