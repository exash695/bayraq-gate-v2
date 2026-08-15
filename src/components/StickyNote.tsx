import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, Save, Trash2, PenLine, Lightbulb } from 'lucide-react';
import { translations } from '../lib/translations';

interface StickyNoteProps {
  pageId: number;
  initialText: string;
  onSave: (text: string) => void;
  onClose?: () => void;
  onOpen?: () => void;
  isOpen?: boolean;
  language?: 'ar' | 'en';
}

export const StickyNote = ({ 
  pageId, 
  initialText, 
  onSave, 
  onClose, 
  onOpen, 
  isOpen: externalIsOpen,
  language = 'ar'
}: StickyNoteProps) => {
  const t = translations[language];
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [text, setText] = useState(initialText);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInDeleteZone, setIsInDeleteZone] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const hasNote = initialText && initialText.trim().length > 0;

  const dragY = useMotionValue(0);
  const deleteZoneOpacity = useTransform(dragY, [0, 200], [0, 1]);

  const setIsOpen = (val: boolean) => {
    if (externalIsOpen !== undefined) {
      if (val && onOpen) onOpen();
      if (!val && onClose) onClose();
    } else {
      setInternalIsOpen(val);
    }
  };

  useEffect(() => {
    setText(initialText);
  }, [initialText, pageId]);

  const handleSave = () => {
    onSave(text);
    setIsOpen(false);
  };

  const handleDelete = () => {
    setText('');
    onSave('');
    setIsOpen(false);
  };

  const handleDrag = (_: any, info: any) => {
    // Check if bulb is near the bottom center
    const threshold = window.innerHeight - 150;
    const isNearBottom = info.point.y > threshold;
    const isNearCenter = Math.abs(info.point.x - window.innerWidth / 2) < 100;
    
    setIsInDeleteZone(isNearBottom && isNearCenter);
  };

  const handleDragEnd = (_: any, info: any) => {
    setIsDragging(false);
    if (isInDeleteZone) {
      handleDelete();
    }
    setIsInDeleteZone(false);
  };

  return (
    <>
      {/* Delete Zone Indicator (Messenger Style) */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9998] flex flex-col items-center gap-2"
          >
            <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isInDeleteZone ? 'bg-red-500 border-red-500 scale-125 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'bg-white/10 border-white/30 scale-100'
            }`}>
              <X size={32} className={isInDeleteZone ? 'text-white' : 'text-white/40'} />
            </div>
            <span className={`text-xs font-bold transition-colors ${isInDeleteZone ? 'text-red-400' : 'text-white/40'}`}>
              {hasNote ? t.deleteNote : t.closeAssistant}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Assistant System (Bulb + Speech Bubble) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            drag
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            dragConstraints={{ left: -window.innerWidth + 80, right: 0, top: -window.innerHeight/2 + 40, bottom: window.innerHeight/2 - 40 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-[9999] flex items-center gap-3 pointer-events-none"
            style={{ touchAction: 'none' }}
          >
            {/* Speech Bubble (Quote) */}
            <AnimatePresence>
              {hasNote && !isDragging && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  className="glass-card p-4 max-w-[200px] border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)] relative pointer-events-auto cursor-pointer"
                  onClick={() => setIsOpen(true)}
                >
                  {/* Triangle for speech bubble */}
                  <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-orange-500/30" />
                  
                  <div className="text-[10px] font-bold text-orange-400 mb-1 flex items-center gap-1">
                    <Lightbulb size={10} />
                    {t.smartReminder}
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed line-clamp-3 italic">
                    {initialText}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Bulb (Action Button) */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              onClick={() => setIsOpen(true)}
              className={`w-14 h-14 rounded-full flex items-center justify-center z-40 transition-all duration-500 pointer-events-auto shadow-lg cursor-grab active:cursor-grabbing ${
                hasNote 
                  ? 'bg-orange-500/20 border-2 border-orange-500 text-orange-500 shadow-orange-500/40' 
                  : 'glass-card border-theme-primary/30 text-theme-primary shadow-theme-primary/20'
              }`}
            >
              <Lightbulb 
                size={28} 
                className={`${hasNote || isHovered ? 'animate-pulse' : ''}`} 
              />
              {hasNote && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-ping" />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card ambient-glow w-full max-w-lg p-8 rounded-[20px] shadow-2xl border-theme-primary/30 relative"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
              >
                <X size={24} />
              </button>

              <h3 className="text-2xl font-black neon-text mb-6 flex items-center gap-3">
                <PenLine className="text-theme-primary" />
                {t.pageNotebook} {pageId}
              </h3>

              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.writeNotesHere}
                className="w-full bg-black/40 border border-white/10 rounded-[15px] p-6 min-h-[250px] text-xl font-medium focus:outline-none focus:border-theme-primary/50 transition-all resize-none text-white"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSave}
                  className="flex-1 py-4 bg-theme-primary text-charcoal rounded-[15px] font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_15px_var(--theme-glow)]"
                >
                  <Save size={20} />
                  {t.saveNote}
                </button>
                {hasNote && (
                  <button
                    style={{ cursor: 'pointer', zIndex: 99999, position: 'relative', background: '#e11d48', padding: '12px 24px', borderRadius: '15px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (window.confirm('هل أنت متأكد من مسح هذه الملاحظة نهائياً؟')) {
                        handleDelete();
                      }
                    }}
                    onMouseDownCapture={(e) => e.stopPropagation()}
                    className="font-black pointer-events-auto"
                    title={t.clearNote}
                  >
                    <Trash2 size={24} strokeWidth={3} />
                    <span className="mr-2">{t.clear}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
